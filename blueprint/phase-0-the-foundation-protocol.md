# Phase 0 - The Foundation Protocol

**Working scope**  
Platform spine and integration seams.

## The detailed Phase 0 development algorithm

The cleanest way to run Phase 0 is as **seven internal sub-phases**. Each one leaves the system stronger than before, and each one has hard gates before you move on.

---

## 0A. Delivery skeleton and repository architecture

This is where you decide how the codebase will stay sane when the product becomes large.

For Vecells, a **modular monorepo** is the cleanest default unless there is a strong organisational reason not to use one. There will be several front-end surfaces and several backend executables sharing the same contracts, so a monorepo makes design-system reuse, typed API contracts, shared test fixtures, and cross-cutting refactors much easier.

The repo should be split by bounded context, not by framework convenience. A good starting shape is:

- `apps/patient-web`
- `apps/clinical-workspace`
- `apps/ops-console`
- `apps/hub-desk`
- `services/api-gateway`
- `services/command-api`
- `services/projection-worker`
- `services/notification-worker`
- `services/adapter-simulators`
- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/fhir-mapping`
- `packages/design-system`
- `packages/authz-policy`
- `packages/test-fixtures`
- `packages/observability`
- `packages/api-contracts`
- `packages/release-controls`
- `infra/environments`
- `ops/runbooks`

The rule is simple: **no app can own truth**. Truth lives in the domain kernel, event contracts, and persistence layer.

The repo boundary law must also be explicit:

- every bounded context gets one owned package or module namespace, such as `packages/domains/<context-code>` or the equivalent top-level boundary in the chosen build system
- apps and workload services may compose multiple context packages, but they may not reach through a sibling context's internal aggregates, repositories, projections, or worker-only helpers
- cross-context reuse is limited to the shared kernel: `packages/domain-kernel`, `packages/event-contracts`, `packages/api-contracts`, `packages/authz-policy`, `packages/release-controls`, `packages/design-system`, `packages/observability`, and other explicitly published contracts
- any intake, identity, triage, booking, hub, pharmacy, communications, support, operations, governance, analytics, audit, or release-control code that needs another context's lifecycle truth must consume a published contract, milestone, or anti-corruption adapter instead of importing sibling internals
- import-boundary lint, code owners, and CI checks must fail any package shape where shell code, adapters, or admin scripts become the hidden owner of another context's lifecycle state

The first code written here is not business logic. It is build system, linting, type safety, code owners, import-boundary rules, environment loading, secret injection, local dev bootstrap, preview deploys, and CI workflows.

Phase 0 must also establish the delivery control plane now, not later. Create a contract registry for synchronous APIs and live update channels, a migration runner that enforces expand-migrate-contract discipline, emits route-scoped `ReadPathCompatibilityWindow` and `ProjectionReadinessVerdict` artifacts for rebuild or cutover work, ephemeral preview environments, a release-manifest generator that binds immutable artifacts to approved `CompiledPolicyBundle` hashes, and a canary plus rollback harness. Treat those as first-class platform capabilities rather than downstream DevOps chores.

On the backend side, create the runnable empty services with health endpoints, config validation, structured logging, and startup dependency checks.

On the frontend side, create the app shells with routing, route guards, layout primitives, global state plumbing, API client stubs, feature flag support, error boundaries, and loading skeletons.

**Tests that must pass before 0A is done**

- Every app and service builds in CI.
- Every service can boot locally with a one-command developer startup.
- Every frontend app can render shell pages in preview environments.
- API and event contract compatibility tests pass for every published route and event family.
- Schema migration dry-run tests pass against production-like snapshots.
- SBOM generation, dependency policy checks, and signed-artifact verification pass in CI.
- Preview deploy smoke tests and non-production canary rollback rehearsal pass.
- Import-boundary lint rules block forbidden cross-module dependencies.
- Secrets never appear in source, logs, or build output.

**Exit state**  
You have a live but nearly empty product platform. It does almost nothing useful yet, but it is deployable, release-controlled, testable, and hard to accidentally turn into spaghetti.

---

## 0B. Canonical domain kernel and state machine

This is the real heart of Phase 0.

The target remains one Vecells-first, FHIR-integrated, event-driven platform with request intake, tasks, communications, booking handoffs, pharmacy flows, and audit, all hanging off the same runtime backbone.

The mistake to avoid is using FHIR resources directly as the internal object model. Build a **Vecells domain model first**, then map it to FHIR-oriented persistence and interchange.

At minimum, define these aggregates:

**Request**  
The canonical work item. Fields should include `id`, `tenantId`, `patientRef`, `sourceChannel`, `originIngressRecordRef`, `normalizedSubmissionRef`, `requestType`, `narrative`, `structuredData`, `attachmentRefs`, `contactPreferences`, `workflowState`, `safetyState`, `identityState`, `priorityBand`, `pathway`, `assignedQueue`, `slaClock`, `currentEvidenceSnapshotRef`, `requestLineageRef`, `latestLineageCaseLinkRef`, `activeLineageCaseLinkRefs[]`, `createdAt`, `updatedAt`, `version`.

**EvidenceSnapshot**  
Immutable authoritative evidence slice attached to a request. Fields like `snapshotId`, `requestId`, `sourceType`, `schemaVersion`, `captureBundleRef`, `normalizedPayloadRef`, `attachmentRefs`, `audioRefs`, `derivedFactsPackageRef`, `redactionTransformRefs[]`, `authoritativeSummaryParityRef`, `capturedAt`, `frozenAt`, `snapshotHash`, `supersedesSnapshotRef`, `supersededBySnapshotRef`.

**EvidenceCaptureBundle**
Immutable raw capture set for one evidence event. Fields like `captureBundleId`, `governingLineageRef`, `sourceChannel`, `captureClass = raw_submit | telephony_recording | patient_reply | callback_outcome | message_reply | manual_ingest`, `sourcePayloadRef`, `sourcePayloadHash`, `sourceArtifactRefs[]`, `artifactManifestHash`, `captureSchemaVersionRef`, `capturedByMode = patient | staff | adapter | system`, `capturedAt`.

**EvidenceDerivationPackage**
Immutable normalized, extracted, or presentation-ready derivative computed from one frozen capture bundle. Fields like `derivationPackageId`, `captureBundleRef`, `derivationClass = canonical_normalization | transcript | structured_fact_extraction | safety_feature_set | patient_safe_summary | staff_review_summary`, `inputArtifactRefs[]`, `derivationVersionRef`, `outputRef`, `outputHash`, `materialityClass = source_preserving | clinically_material | presentation_only`, `supersedesDerivationPackageRef`, `derivedAt`.

**EvidenceRedactionTransform**
Immutable visibility-specific transform over a source or derived artifact. Fields like `redactionTransformId`, `sourceArtifactRef`, `sourceHash`, `visibilityProjectionPolicyRef`, `redactionPolicyRef`, `outputArtifactRef`, `outputHash`, `transformClass = masked_copy | excerpt | presentation_extract`, `createdAt`.

**EvidenceSummaryParityRecord**
Proof that a visible evidence summary, transcript stub, or review digest still matches the frozen source bundle and authoritative derived package. Fields like `parityRecordId`, `evidenceSnapshotRef`, `summaryArtifactRef`, `sourceBundleRef`, `sourceHash`, `derivedFactsPackageRef`, `visibilityProjectionPolicyRef`, `parityState = verified | stale | blocked | superseded`, `checkedAt`.

**SubmissionIngressRecord**
Immutable cross-channel intake ingress fact attached to one `SubmissionEnvelope` or existing `RequestLineage` before promotion or same-request evidence assimilation. Fields like `ingressRecordId`, `submissionEnvelopeRef`, `requestLineageRef`, `intakeConvergenceContractRef`, `sourceLineageRef`, `ingressChannel = self_service_form | telephony_capture | secure_link_continuation | support_assisted_capture`, `surfaceChannelProfile = browser | embedded | telephony | secure_link | support_console`, `captureAuthorityClass = patient_self_entered | patient_spoken | patient_verified_reply | support_assisted | staff_transcribed`, `promotionIntentClass = draft_mutation | governed_submit | continuation_append | support_seed_only`, `channelCapabilityCeiling`, `contactAuthorityClass = self_asserted | nhs_login_claim | verified_destination | authority_confirmed | support_attested`, `identityEvidenceRefs[]`, `contactRouteEvidenceRefs[]`, `evidenceReadinessState = partial | urgent_live_only | safety_usable | manual_review_only | unusable_terminal`, `evidenceReadinessRef`, `normalizedSubmissionRef`, `transportCorrelationId`, `channelPayloadRef`, `channelPayloadHash`, `receiptConsistencyKey`, `statusConsistencyKey`, `supersedesIngressRecordRef`, `createdAt`.

`SubmissionIngressRecord` is the immutable join between channel-specific entry posture and the canonical intake model. Browser, embedded NHS App, secure-link, telephony, and support-assisted entry may differ in evidence ceiling, capability ceiling, or delivery posture, but they must all materialize through this same record before duplicate handling, promotion, or safety can continue.

**NormalizedSubmission**
Canonical cross-channel intake package used for duplicate handling, governed promotion, receipt issuance, and safety screening. Fields like `normalizedSubmissionId`, `submissionEnvelopeRef`, `requestLineageRef`, `primaryIngressRecordRef`, `governingSnapshotRef`, `requestType`, `narrativeRef`, `structuredAnswersRef`, `channelMetadataRef`, `identityContextRef`, `attachmentRefs[]`, `audioRefs[]`, `contactPreferencesRef`, `submissionSourceTimestamp`, `patientMatchConfidenceRef`, `dedupeFingerprintRef`, `channelCapabilityCeiling`, `contactAuthorityClass`, `evidenceReadinessState = urgent_live_only | safety_usable | manual_review_only`, `normalizationVersionRef`, `normalizedHash`, `supersedesNormalizedSubmissionRef`, `createdAt`.

`NormalizedSubmission` is the one canonical intake payload seen by duplicate policy, promotion logic, safety screening, and receipt assembly. Channel-specific controllers, secure-link resolvers, NHS App bridges, telephony workers, and support tools may not bypass it or improvise alternate request-creation semantics.

**Task**  
Operational or clinical action item. Fields like `taskId`, `requestId`, `taskType`, `ownerType`, `ownerId`, `status`, `dueAt`, `priority`, `resolution`, `approvalState`.

**Communication**  
Outbound or inbound message object. Fields like `channel`, `recipient`, `template`, `payload`, `transportAckState`, `deliveryEvidenceState`, `deliveryRiskState`, `authoritativeOutcomeState`, `threadId`, `relatedRequestId`, `causalToken`, and `monotoneRevision`.

**Attachment**  
Binary reference only, never inline blobs. Fields like `objectKey`, `contentType`, `size`, `checksum`, `virusScanState`, `documentReferenceId`.

**AuditRecord**  
Append-only action record. Fields like `auditRecordId`, `actor`, `actingContextRef`, `action`, `targetType`, `targetId`, `reasonCode`, `edgeCorrelationId`, `routeIntentRef`, `commandActionRef`, `commandSettlementRef`, `uiEventRef`, `uiEventCausalityFrameRef`, `uiTransitionSettlementRef`, `projectionVisibilityRef`, `selectedAnchorRef`, `shellDecisionClass = created | reused | restored | recovered | replaced | frozen`, `disclosureFenceRef`, `sourceIp`, `userAgent`, `timestamp`, `previousHash`, `hash`.

`AuditRecord` is the immutable join row between ingress correlation, route intent, command settlement, visible shell decision, and disclosure posture. Server acceptance, local acknowledgement, or detached analytics events may not stand in for this audit join.

**FhirRepresentationContract**
`fhirRepresentationContractId`, `owningBoundedContextRef`, `governingAggregateType`, `representationPurpose = clinical_persistence | external_interchange | partner_callback_correlation | audit_companion`, `triggerMilestoneTypes[]`, `requiredEvidenceRefs[]`, `allowedResourceTypes[]`, `requiredProfileCanonicalUrls[]`, `identifierPolicyRef`, `statusMappingPolicyRef`, `cardinalityPolicyRef`, `redactionPolicyRef`, `companionArtifactPolicyRef`, `replayPolicyRef`, `supersessionPolicyRef`, `callbackCorrelationPolicyRef`, `contractVersionRef`, `contractState = draft | active | superseded | withdrawn`, `publishedAt`

`FhirRepresentationContract` is the only legal place to define how one aggregate version, evidence snapshot, or settlement chain becomes FHIR resources. Application code, projections, partner adapters, and support tools may not improvise raw resource shapes or treat FHIR profiles as hidden aggregate schemas.

**FhirRepresentationSet**
`fhirRepresentationSetId`, `representationContractRef`, `governingAggregateType`, `governingAggregateRef`, `governingAggregateVersionRef`, `governingLineageRef`, `evidenceSnapshotRef`, `representationPurpose`, `resourceRecordRefs[]`, `bundleArtifactRef`, `setHash`, `causalToken`, `monotoneRevision`, `representationState = staged | emitted | superseded | invalidated`, `supersedesRepresentationSetRef`, `generatedAt`

`FhirRepresentationSet` is the atomic mapping unit for replay, audit, and partner exchange. One domain aggregate version may emit multiple FHIR resources, and neither shells nor adapters may reconstruct business truth from a partial subset of those resources.

**FhirResourceRecord**
`fhirResourceRecordId`, `representationSetRef`, `resourceType = Task | ServiceRequest | DocumentReference | Communication | Consent | AuditEvent | Provenance | Bundle`, `profileCanonicalUrl`, `logicalId`, `versionId`, `subjectRef`, `payloadArtifactRef`, `payloadHash`, `sourceAggregateRefs[]`, `identifierSetHash`, `provenanceAuditJoinRef`, `storageDisposition = clinical_store | interchange_only | callback_cache | derived_view`, `materializationState = staged | written | superseded | invalidated`, `writtenAt`

`logicalId` and `versionId` belong to the FHIR representation, not the internal aggregate. Replacing a `Task`, `ServiceRequest`, or `Communication` version does not transfer lifecycle ownership away from the governing aggregate, and raw FHIR consumers may not infer blocker clearance, lease ownership, or final closure without the bound aggregate and settlement chain.

**FhirExchangeBundle**
`fhirExchangeBundleId`, `representationSetRef`, `adapterContractProfileRef`, `direction = outbound | inbound`, `bundleType = transaction | message | document | collection | searchset | history | batch`, `transportPayloadRef`, `transportPayloadHash`, `targetPartnerRef`, `correlationKey`, `receiptCheckpointRef`, `exchangeState = staged | dispatched | accepted | replayed | failed | superseded`, `createdAt`, `closedAt`

`FhirExchangeBundle` is the only FHIR payload family adapters may send or accept at the platform boundary. Adapters transform or correlate through this bundle and the bound representation contract; they may not read raw aggregate tables or invent partner-specific bundles from local convenience state.

**IdempotencyRecord**  
Required for duplicate submits, repeated webhooks, replay recognition, and retry safety. Fields like `idempotencyRecordId`, `actionScope`, `governingLineageRef`, `sourceCommandId`, `transportCorrelationId`, `rawPayloadHash`, `semanticPayloadHash`, `replayKey`, `scopeFingerprint`, `causalParentRef`, `intentGeneration`, `expectedEffectSetHash`, `decisionClass = exact_replay | semantic_replay | distinct | collision_review`, `firstAcceptedActionRecordRef`, `acceptedSettlementRef`, `collisionReviewRef`, `decisionBasisRef`, `replayWindowClosedAt`, `createdAt`, `updatedAt`.

**ReplayCollisionReview**
Required when a reused source identifier, correlation token, or idempotency key diverges semantically or targets the wrong governing scope. Fields like `replayCollisionReviewId`, `idempotencyRecordRef`, `actionScope`, `governingLineageRef`, `existingActionRecordRef`, `existingSettlementRef`, `incomingSourceCommandId`, `incomingTransportCorrelationId`, `incomingSemanticPayloadHash`, `incomingEffectSetHash`, `collisionClass = source_id_reuse | transport_correlation_reuse | idempotency_key_reuse | callback_scope_drift`, `reviewState = open | resolved_replay | resolved_distinct | resolved_abuse_blocked`, `createdAt`, `resolvedAt`.

Add these cross-phase guardrail objects now:

**IdentityBinding**  
`bindingId`, `requestId`, `subjectRef`, `candidatePatientRefs`, `bindingState = candidate | provisional_verified | ambiguous | verified_patient | correction_pending | corrected | revoked`, `assuranceLevel = none | low | medium | high`, `verifiedContactRouteRef`, `matchEvidenceRef`, `linkProbability`, `linkProbabilityLowerBound`, `runnerUpProbabilityUpperBound`, `subjectProofProbabilityLowerBound`, `gapLogit`, `calibrationVersionRef`, `confidenceModelState = calibrated | drift_review | out_of_domain`, `bindingVersion`, `stepUpMethod`, `supersededByRef`, `createdAt`, `updatedAt`

**PatientLink**
`patientLinkId`, `subjectRef`, `patientRef`, `linkState`, `linkProbability`, `linkProbabilityLowerBound`, `runnerUpProbabilityUpperBound`, `subjectProofProbabilityLowerBound`, `gapLogit`, `calibrationVersionRef`, `confidenceModelState`, `provenanceRef`, `evaluatedAt`, `expiresAt`

**CapabilityDecision**
`decisionId`, `subjectRef`, `routeProfileRef`, `policyVersion`, `capabilitySet`, `capabilityCeiling`, `decisionState = allow | step_up_required | recover_only | deny`, `trustFloor`, `freshnessScore`, `riskUpperBound`, `reasonCodes`, `evaluatedAt`, `expiresAt`, `identityEvidenceRefs`, `linkState`, `ageGateState`, `manualOverrideRef`, `bindingVersionRef`

**Session**
`sessionId`, `subjectRef`, `patientLinkRef`, `decisionRef`, `establishmentDecisionRef`, `activeReturnIntentRef`, `issuedAt`, `lastSeenAt`, `authTime`, `idleExpiresAt`, `absoluteExpiresAt`, `sessionState = establishing | active | step_up_required | restricted | recovery_only | revoked | expired_idle | expired_absolute | terminated`, `assuranceBand`, `routeAuthorityState = none | auth_read_only | claim_pending | writable`, `sessionEpoch`, `subjectBindingVersion`, `riskUpperBound`, `cookieKeyVersionRef`, `reauthRequiredAt`, `revokedAt`, `revocationReason`, `csrfSecret`, `deviceContext`

**AuthTransaction**
`transactionId`, `stateHash`, `nonceHash`, `pkceVerifierRef`, `scopeBundleRef`, `capabilityIntentRef`, `returnIntentRef`, `requestContextHash`, `transactionFenceEpoch`, `callbackSettlementRef`, `sessionEstablishmentDecisionRef`, `maxAuthAgeSeconds`, `startedAt`, `expiresAt`, `callbackReceivedAt`, `completedAt`, `errorRef`, `transactionState = opened | awaiting_callback | callback_received | verified | consumed | denied | expired | replayed`

**AuthScopeBundle**
`scopeBundleId`, `requestedScopes`, `minimumClaims`, `minimumAssuranceBand`, `capabilityCeiling`, `policyVersion`, `consentCopyVariantRef`, `createdAt`, `expiresAt`

**PostAuthReturnIntent**
`returnIntentId`, `routeFamilyRef`, `actionScope`, `routeTargetRef`, `requestLineageRef`, `draftRef`, `submissionPromotionRecordRef`, `draftContinuityEvidenceRef`, `continuationAccessGrantRef`, `fallbackRouteRef`, `resumeContinuationRef`, `subjectRef`, `requiredCapabilityDecisionRef`, `requiredPatientLinkRef`, `requiredSessionState = active | step_up_required | restricted | recovery_only`, `returnAuthority = auth_only | claim_pending | writable_resume | recovery_only`, `sessionEpochRef`, `subjectBindingVersionRef`, `lineageFenceEpoch`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `minimumBridgeCapabilitiesRef`, `channelReleaseFreezeState`, `routeFreezeDispositionRef`, `expiresAt`, `intentState = pending | consumed | superseded | recovered`

**SessionEstablishmentDecision**
`decisionId`, `transactionRef`, `existingSessionRef`, `resolvedSessionRef`, `subjectComparisonState = no_session | anonymous_session | same_subject_same_binding | same_subject_binding_advanced | different_subject | mismatched_secure_link_subject | stale_existing`, `capabilityDecisionRef`, `draftClaimDisposition = none | claim_route_required | draft_claim_allowed | request_shell_required | blocked_other_subject`, `returnIntentDisposition = consume_intent | consume_to_recovery | supersede_intent | deny_intent`, `writableAuthorityState = none | auth_read_only | claim_pending | writable`, `decision = create_fresh | rotate_existing | reuse_existing | deny | bounded_recovery`, `decidedAt`

**SessionTerminationSettlement**
`settlementId`, `sessionRef`, `trigger`, `triggerRef`, `cookieClearState`, `serverRevocationState`, `projectionDisposition`, `postTerminationRouteRef`, `settledAt`

**StaffIdentityContext**
`staffIdentityContextId`, `staffUserId`, `homeOrganisationRef`, `affiliatedOrganisationRefs[]`, `tenantGrantRefs[]`, `nationalRbacRefs[]`, `localRoleRefs[]`, `sessionAssurance`, `identityState = authenticated | reauth_required | revoked`, `authenticatedAt`, `expiresAt`

**ActingContext**
`actingContextId`, `staffIdentityContextRef`, `activeOrganisationRef`, `activeOrganisationScopeRefs[]`, `tenantScopeMode = single_tenant | organisation_group | multi_tenant | platform`, `tenantScopeRefs[]`, `environmentRef`, `policyPlaneRef`, `actingRoleRef`, `purposeOfUseRef`, `audienceTierRef`, `elevationState = none | requested | active | expiring | revoked`, `breakGlassState = forbidden | eligible | active | expiring | revoked`, `visibilityCoverageRef`, `minimumNecessaryContractRef`, `contextState = current | stale | blocked | superseded`, `switchGeneration`, `issuedAt`, `expiresAt`, `revokedAt`

**ActingScopeTuple**
`actingScopeTupleId`, `staffIdentityContextRef`, `actingContextRef`, `scopeMode = tenant | organisation | organisation_group | multi_tenant | platform`, `tenantRefs[]`, `organisationRefs[]`, `environmentRef`, `policyPlaneRef`, `purposeOfUseRef`, `elevationState`, `breakGlassState`, `requiredVisibilityCoverageRefs[]`, `requiredRuntimeBindingRefs[]`, `requiredTrustRefs[]`, `affectedTenantCount`, `affectedOrganisationCount`, `tupleHash`, `issuedAt`, `expiresAt`

**ActingContextDriftRecord**
`actingContextDriftRecordId`, `priorActingContextRef`, `priorActingScopeTupleRef`, `detectedChangeClass = organisation_switch | tenant_scope_change | environment_change | policy_plane_change | purpose_of_use_change | elevation_expired | break_glass_revoked | visibility_contract_drift`, `affectedRouteIntentRefs[]`, `affectedLeaseRefs[]`, `recoveryDispositionRef`, `detectedAt`, `resolvedAt`

`StaffIdentityContext` is the durable identity basis for staff, support, governance, and cross-organisation coordination work. `ActingContext` is the operator-selected working posture over that identity, and `ActingScopeTuple` is the machine-checkable fence that binds tenant, organisation, environment, policy plane, purpose-of-use, elevation, visibility coverage, runtime binding, and blast radius into one authority. Organisation switching, purpose-of-use changes, elevation expiry, break-glass revocation, or coverage drift must supersede the tuple rather than being reinterpreted inside a live shell.

**AccessGrant**  
`grantId`, `grantFamily`, `actionScope`, `lineageScope`, `grantScopeEnvelopeRef`, `routeFamilyRef`, `subjectRef`, `boundPatientRef`, `issuedIdentityBindingRef`, `boundContactRouteRef`, `subjectBindingMode`, `phiExposureClass`, `replayPolicy`, `tokenHash`, `tokenKeyVersionRef`, `validatorVersionRef`, `issuedRouteIntentBindingRef`, `issuedSessionEpochRef`, `issuedSubjectBindingVersionRef`, `issuedLineageFenceEpoch`, `requiredReleaseApprovalFreezeRef`, `requiredChannelReleaseFreezeRef`, `requiredAudienceSurfaceRuntimeBindingRef`, `grantState = live | redeeming | redeemed | rotated | superseded | revoked | expired`, `maxRedemptions`, `redemptionCount`, `currentRedemptionRef`, `latestSupersessionRef`, `expiresAt`, `redeemedAt`, `revokedAt`, `supersedesGrantRef`, `supersededByGrantRef`, `createdAt`, `updatedAt`

**DuplicateCluster**  
`clusterId`, `episodeId`, `canonicalRequestId`, `memberRequestRefs`, `memberSnapshotRefs`, `candidateRequestRefs`, `pairwiseEvidenceRefs`, `currentResolutionDecisionRef`, `resolutionDecisionRefs`, `relationType = retry | same_episode_candidate | same_episode_confirmed | related_episode | review_required`, `reviewStatus = open | in_review | resolved_confirmed | resolved_separate | resolved_related | resolved_retry | superseded`, `decisionRef`, `clusterConfidence`, `thresholdPolicyRef`, `channelCalibrationRef`, `instabilityState = stable | oscillating | blocked_conflict`, `lastRecomputedAt`, `createdAt`, `updatedAt`

**DuplicatePairEvidence**
`pairEvidenceId`, `incomingLineageRef`, `incomingSnapshotRef`, `candidateRequestRef`, `candidateEpisodeRef`, `replaySignalRefs`, `continuitySignalRefs`, `conflictSignalRefs`, `relationModelVersionRef`, `channelCalibrationRef`, `thresholdPolicyRef`, `featureVectorHash`, `piRetry`, `piSameRequestAttach`, `piSameEpisode`, `piRelatedEpisode`, `piNewEpisode`, `classMargin`, `candidateMargin`, `uncertaintyScore`, `hardBlockerRefs`, `evidenceState = active | superseded`, `createdAt`

**DuplicateResolutionDecision**
`duplicateResolutionDecisionId`, `duplicateClusterRef`, `incomingLineageRef`, `incomingSnapshotRef`, `targetRequestRef`, `targetEpisodeRef`, `winningPairEvidenceRef`, `competingPairEvidenceRefs`, `decisionClass = exact_retry_collapse | same_request_attach | same_episode_link | related_episode_link | separate_request | review_required`, `continuityWitnessClass = deterministic_replay | submit_lineage | workflow_return | more_info_cycle | telephony_continuation | human_review | none`, `continuityWitnessRef`, `reviewMode = auto | human_review | replay_authority`, `reasonCodes`, `decisionState = applied | superseded | reverted`, `supersedesDecisionRef`, `downstreamInvalidationRefs`, `decidedByRef`, `decidedAt`, `revertedAt`

**SafetyPreemptionRecord**  
`preemptionId`, `requestId`, `triggeringSnapshotRef`, `classificationDecisionRef`, `sourceDomain`, `sourceBoundedContextRef`, `governingBoundedContextRef`, `requiredBoundaryContractRefs[]`, `evidenceClass = technical_metadata | operationally_material_nonclinical | contact_safety_relevant | potentially_clinical`, `openingSafetyEpoch`, `blockingActionScopeRefs[]`, `priority = routine_review | urgent_review | urgent_live`, `reasonCode`, `fallbackState = none | manual_review_required | artifact_degraded`, `status = pending | blocked_manual_review | cleared_routine | escalated_urgent | cancelled | superseded`, `createdAt`, `resolvedAt`

**EvidenceClassificationDecision**
`classificationDecisionId`, `requestId`, `triggeringSnapshotRef`, `sourceDomain`, `sourceBoundedContextRef`, `governingBoundedContextRef`, `requiredBoundaryContractRefs[]`, `governingObjectRef`, `classifiedEvidenceRefs[]`, `classifierVersionRef`, `dominantEvidenceClass = technical_metadata | operationally_material_nonclinical | contact_safety_relevant | potentially_clinical`, `classificationBasis = allow_list | route_dependency | content_signal | manual_review | degraded_fail_closed`, `triggerReasonCodes[]`, `activeDependencyRefs[]`, `confidenceBand = high | medium | low`, `misclassificationRiskState = ordinary | fail_closed_review | urgent_hold`, `decisionState = applied | superseded`, `supersedesDecisionRef`, `decidedByRef`, `decidedAt`

**SafetyDecisionRecord**
`safetyDecisionId`, `requestId`, `preemptionRef`, `classificationDecisionRef`, `compositeSnapshotRef`, `sourceDomain`, `sourceBoundedContextRef`, `governingBoundedContextRef`, `requiredBoundaryContractRefs[]`, `rulePackVersionRef`, `calibratorVersionRef`, `decisionTupleHash`, `hardStopRuleRefs[]`, `urgentContributorRuleRefs[]`, `residualContributorRuleRefs[]`, `activeReachabilityDependencyRefs[]`, `conflictVectorRef`, `criticalMissingnessRef`, `decisionOutcome = urgent_required | urgent_live | urgent_review | residual_review | clear_routine | fallback_manual_review`, `requestedSafetyState = urgent_diversion_required | residual_risk_flagged | screen_clear`, `decisionState = pending_settlement | settled | superseded`, `resultingSafetyEpoch`, `supersedesSafetyDecisionRef`, `decidedAt`, `settledAt`

**UrgentDiversionSettlement**
`urgentDiversionSettlementId`, `requestId`, `preemptionRef`, `safetyDecisionRef`, `actionMode = urgent_guidance_presented | live_transfer_started | duty_clinician_escalated | urgent_callback_opened | emergency_service_handoff | manual_follow_up_only`, `presentationArtifactRef`, `authoritativeActionRef`, `settlementState = pending | issued | failed | superseded`, `supersedesSettlementRef`, `issuedAt`, `settledAt`

**RequestLifecycleLease**  
`leaseId`, `episodeId`, `requestId`, `requestLineageRef`, `domain`, `owningBoundedContextRef`, `domainObjectRef`, `leaseAuthorityRef`, `ownerActorRef`, `ownerSessionRef`, `ownerWorkerRef`, `ownershipEpoch`, `leaseScopeHash`, `state = active | releasing | released | expired | broken`, `closeBlockReason`, `leaseTtlSeconds`, `heartbeatAt`, `fencingToken`, `staleOwnerRecoveryRef`, `supersededByLeaseRef`, `acquiredAt`, `releasedAt`, `breakEligibleAt`, `brokenByActorRef`, `breakReason`

**StaleOwnershipRecoveryRecord**
`staleOwnershipRecoveryId`, `requestId`, `leaseRef`, `domain`, `domainObjectRef`, `lastOwnershipEpoch`, `lastFencingToken`, `detectedAt`, `detectedByRef`, `recoveryReason = heartbeat_missed | stale_write_rejected | superseded_reacquire | supervisor_takeover | lineage_drift`, `blockedActionScopeRefs[]`, `operatorVisibleWorkRef`, `sameShellRecoveryRouteRef`, `resolutionState = open | reacquire_in_progress | takeover_pending | resolved | superseded`, `resolvedAt`

**LeaseTakeoverRecord**
`leaseTakeoverRecordId`, `requestId`, `domain`, `domainObjectRef`, `priorLeaseRef`, `replacementLeaseRef`, `fromOwnerRef`, `toOwnerRef`, `authorizedByRef`, `takeoverReason`, `takeoverState = pending | committed | cancelled`, `staleOwnershipRecoveryRef`, `issuedAt`, `committedAt`, `cancelledAt`

**RequestClosureRecord**  
`closureRecordId`, `requestId`, `requestLineageRef`, `evaluatedAt`, `requiredCausalToken`, `blockingLeaseRefs`, `blockingStaleOwnershipRecoveryRefs`, `blockingPreemptionRefs`, `blockingApprovalRefs`, `blockingReconciliationRefs`, `blockingLineageCaseLinkRefs[]`, `decision`, `closedByMode`

**CapacityReservation**  
`reservationId`, `capacityIdentityRef`, `canonicalReservationKey`, `sourceDomain`, `sourceBoundedContextRef`, `governingBoundedContextRef`, `requiredBoundaryContractRefs[]`, `holderRef`, `state = none | soft_selected | held | pending_confirmation | confirmed | released | expired | disputed`, `commitMode = exclusive_hold | truthful_nonexclusive | degraded_manual_pending`, `reservationVersion`, `activeFencingToken`, `truthBasisHash`, `supplierObservedAt`, `revalidatedAt`, `expiresAt`, `confirmedAt`, `releasedAt`, `supersededByReservationRef`, `terminalReasonCode`

**ReservationTruthProjection**
`reservationTruthProjectionId`, `capacityReservationRef`, `canonicalReservationKey`, `sourceDomain`, `sourceObjectRef`, `selectedAnchorRef`, `truthState = exclusive_held | truthful_nonexclusive | pending_confirmation | confirmed | disputed | released | expired | revalidation_required | unavailable`, `displayExclusivityState = exclusive | nonexclusive | none`, `countdownMode = none | hold_expiry`, `exclusiveUntilAt`, `reservationVersionRef`, `truthBasisHash`, `projectionFreshnessEnvelopeRef`, `reasonRefs[]`, `generatedAt`

**BookingConfirmationTruthProjection**
`bookingConfirmationTruthProjectionId`, `bookingCaseRef`, `bookingTransactionRef`, `selectedSlotRef`, `appointmentRecordRef`, `externalConfirmationGateRef`, `commandSettlementRecordRef`, `latestReceiptCheckpointRef`, `providerReference`, `authoritativeProofClass = none | durable_provider_reference | same_commit_read_after_write | reconciled_confirmation`, `confirmationTruthState = booking_in_progress | confirmation_pending | reconciliation_required | confirmed | failed | expired | superseded`, `patientVisibilityState = selected_slot_pending | provisional_receipt | booked_summary | recovery_required`, `manageExposureState = hidden | summary_only | writable`, `artifactExposureState = hidden | summary_only | handoff_ready`, `reminderExposureState = blocked | pending_schedule | scheduled`, `continuityEvidenceRef`, `truthBasisHash`, `projectionFreshnessEnvelopeRef`, `settlementRevision`, `generatedAt`

**PharmacyCorrelationRecord**  
`correlationId`, `pharmacyCaseId`, `packageId`, `dispatchAttemptId`, `providerRef`, `patientRef`, `serviceType`, `directorySnapshotRef`, `providerCapabilitySnapshotRef`, `dispatchPlanRef`, `transportMode`, `transportAssuranceProfileRef`, `dispatchAdapterBindingRef`, `dispatchPlanHash`, `packageHash`, `outboundReferenceSet`, `outboundReferenceSetHash`, `transportAcceptanceState = none | accepted | rejected | timed_out | disputed`, `providerAcceptanceState = none | accepted | rejected | timed_out | disputed`, `authoritativeDispatchProofState = pending | satisfied | disputed | expired`, `currentProofEnvelopeRef`, `currentDispatchSettlementRef`, `acknowledgementState`, `confidenceFloor`, `supersededByAttemptRef`, `createdAt`, `updatedAt`

**VisibilityProjectionPolicy**  
`policyId`, `audienceTier`, `allowedFields`, `redactionRules`, `purposeOfUseRequirements`, `breakGlassAllowed`, `consistencyClass`

**CompiledPolicyBundle**  
`bundleId`, `tenantId`, `policyPackRefs`, `configVersionRefs`, `compiledHash`, `compatibilityState`, `simulationEvidenceRef`, `approvedBy`, `approvedAt`

Add the bounded-context authority map now, before route contracts and services drift apart:

**BoundedContextDescriptor**
`boundedContextDescriptorId`, `contextCode = intake_safety | identity_access | triage_workspace | booking | hub_coordination | pharmacy | communications | support | operations | governance_admin | analytics_assurance | audit_compliance | release_control | shared_kernel`, `ownedAggregateTypes[]`, `ownedLifecycleMilestoneTypes[]`, `ownedRouteFamilyRefs[]`, `ownedPackageRefs[]`, `publishedContractRefs[]`, `consumedContractRefs[]`, `allowedContributorContextRefs[]`, `sharedKernelPackageRefs[]`, `closureAuthority = none | propose_only | sole_authority`, `shellResidencyMode = root_only | contributor_only | both | none`, `descriptorState = active | deprecated | superseded`, `publishedAt`

`BoundedContextDescriptor` is the single machine-readable ownership map for one domain boundary. It names which aggregates, lifecycle milestones, route families, packages, and published contracts belong to the context, which other contexts may contribute to its surfaces, and whether it is allowed to close, reopen, or only propose downstream lifecycle change.

**ContextBoundaryContract**
`contextBoundaryContractId`, `sourceContextRef`, `targetContextRef`, `boundaryType = shared_kernel | published_event | published_projection | anti_corruption_adapter | governance_gate | observer_only`, `permittedWriteModes = none | milestone_emit | governance_decision | owning_context_only`, `publishedMilestoneTypes[]`, `publishedProjectionTypes[]`, `allowedActionScopeRefs[]`, `forbiddenAggregateWriteTypes[]`, `requiredAdapterProfileRefs[]`, `requiredGatewaySurfaceRefs[]`, `requiredAuditReasonCodes[]`, `recoveryDispositionRef`, `boundaryState = active | constrained | blocked | deprecated`, `contractVersionRef`, `publishedAt`

`ContextBoundaryContract` is the only legal declaration of a cross-context seam. It states whether the source context may publish milestones, projections, or governance decisions into the target context, which actions remain forbidden, which anti-corruption adapters or gateways must be used, and what recovery path applies when the boundary is stale or blocked.

**CanonicalLifecycleMilestoneContract**
`canonicalLifecycleMilestoneContractId`, `milestoneType`, `owningContextRef`, `proposingContextRefs[]`, `governingAggregateTypes[]`, `governingRouteFamilyRefs[]`, `allowedTransitionRefs[]`, `requiredBoundaryContractRefs[]`, `forbiddenDirectWriterContextRefs[]`, `proofRequirementRefs[]`, `contractState = active | superseded`, `publishedAt`

`CanonicalLifecycleMilestoneContract` separates milestone proposal from lifecycle truth. Downstream or observer contexts may detect, recommend, or attest transitions, but only the owning context named here may write the aggregate state that makes the milestone authoritative unless one listed governance or release-control contract says otherwise.

Required platform services are:

- `LifecycleCoordinator`: sole cross-domain authority for request closure and reopen decisions
- `LeaseAuthority`: sole serializer for `RequestLifecycleLease` acquisition, heartbeat, release, stale-owner recovery, and `LeaseTakeoverRecord` minting across long-running workflow branches
- `ReservationAuthority`: sole serializer for any user-visible claim on `capacityUnitRef`
- `IdentityBindingAuthority`: sole serializer for `IdentityBinding` version changes and derived patient-binding updates on `Episode` and `Request`
- `AccessGrantService`: sole issuer, redeemer, revoker, and rotator of patient-access grants
- `AuthBridge`: sole validator of NHS login callback state, nonce, PKCE, and frozen `AuthScopeBundle`
- `SessionGovernor`: sole issuer, rotator, reuser, and terminator of local `Session` rows and session fences
- `ActingContextGovernor`: sole issuer, superseder, and drift detector for `StaffIdentityContext`, `ActingContext`, `ActingScopeTuple`, governance scope tokens, organisation switching, purpose-of-use changes, elevation posture, and break-glass state
- `EvidenceAssimilationCoordinator`: sole owner of post-submit evidence assimilation and material-delta decisions
- `SafetyOrchestrator`: sole owner of evidence classification, safety preemption, and canonical re-safety
- `ReachabilityGovernor`: sole owner of versioned contact-route snapshots, observed reachability signals, and dependency assessments
- `ClinicalRepresentationMapper`: sole owner of `FhirRepresentationContract`, `FhirRepresentationSet`, `FhirResourceRecord`, and `FhirExchangeBundle` materialization, replay, supersession, and callback-correlation joins across clinical persistence and interchange

Bounded-context rules are mandatory:

1. every aggregate, route family, gateway surface, and package namespace must resolve to exactly one `BoundedContextDescriptor`
2. `sourceDomain` and similar provenance labels describe where evidence, requests, or observations came from; they do not authorize cross-context writes
3. only the owning context may write lifecycle truth for its aggregates; other contexts may append evidence, publish projections, emit milestones, or request review only through an active `ContextBoundaryContract`
4. intake and safety, identity and access, triage workspace, booking, hub coordination, pharmacy, communications, support, operations, governance admin, analytics assurance, audit compliance, and release control are distinct contexts even when they share shells, services, or route families
5. analytics, assurance, audit, support, operations, and release-control contexts are observer, governance, or control-plane contributors unless a published contract explicitly grants a narrower write mode; they may not silently become the owner of patient, booking, hub, pharmacy, or communication lifecycle truth
6. `LifecycleCoordinator` remains the sole cross-domain closure and governed-reopen authority for `Request`; downstream contexts may only propose milestones or blockers into that closure decision
7. shared kernel reuse is limited to versioned contracts, immutable kernels, and explicitly declared boundary adapters; shared util folders or convenience imports are not acceptable substitutes
8. any route, service, worker, or package that needs more than one context's internal write model without a declared boundary contract is a topology and ownership defect, not an ordinary integration
9. domain services, projections, and shells may speak in aggregates, milestones, settlement records, and published projections; only `ClinicalRepresentationMapper` and declared adapter workloads may speak raw FHIR payloads
10. one aggregate version may emit multiple FHIR resources, but no FHIR `Task`, `ServiceRequest`, `DocumentReference`, `Communication`, `Consent`, `AuditEvent`, or `Provenance` row becomes the hidden owner of aggregate lifecycle, blocker, or continuity truth

Then define the intake and `Request` state contracts now. Even in Phase 0, the transition maps should be fixed.

Use four explicit axes rather than one overloaded status field. Confirmation gates, repair holds, duplicate review, fallback recovery, reachability repair, and other closure blockers are orthogonal control-plane facts; they must never be encoded as `Request.workflowState` values:

**Submission envelope state**  
`draft -> evidence_pending -> ready_to_promote -> promoted | abandoned | expired`

**Workflow state**  
`submitted -> intake_normalized -> triage_ready -> triage_active -> handoff_active -> outcome_recorded -> closed`

**Safety state**  
`not_screened -> screen_clear | residual_risk_flagged | urgent_diversion_required -> urgent_diverted`

**Identity state**  
`anonymous -> partial_match -> matched -> claimed`

State semantics matter:

- `SubmissionEnvelope` owns pre-submit capture and continuation; `Request` must not exist merely because draft evidence exists.
- `submitted` is mandatory and is entered when governed promotion from `SubmissionEnvelope` to `Request` succeeds, before normalization or safety. It is the durable post-submit state used for crash recovery, replay, dedupe, and SLA anchoring.
- `intake_normalized` is mandatory and is only entered after the immutable submission snapshot and canonical normalizer both succeed.
- `triage_ready` is only legal once a real `TriageTask` has been created.
- `triage_active` is the coarse canonical state for all live practice-side review and reopen activity on the request lineage.
- `residual_risk_flagged` is only legal when non-diversion safety rules remain active and their rule IDs have been durably persisted on the request lineage.
- `urgent_diversion_required` is only legal when the urgent path has been determined but the urgent advice or escalation action is not yet durably issued. Once that action is durably issued, the request must move to `urgent_diverted`.

With allowed workflow branches such as:

- `submitted -> intake_normalized`
- `intake_normalized -> triage_ready`
- `triage_ready -> triage_active`
- `triage_active -> handoff_active`
- `triage_active -> outcome_recorded`
- `handoff_active -> triage_active`
- `handoff_active -> outcome_recorded`
- `outcome_recorded -> closed`

Detailed queue, review, booking, hub, and pharmacy states must live on their own domain objects. The canonical `Request` should record milestone ownership and outcome state, not impersonate every downstream operational step.

Also lock these non-negotiable invariants now:

1. One `Episode` represents one clinical episode. One `Request` represents one governed submission lineage inside one `Episode`. Suspected duplicates are clustered, not silently merged, unless they are proven idempotent retries or proven same-request continuations under the attach rules.
2. `RequestLineage` is the only continuity anchor that may join one request to auth return, patient navigation, and child workflow branches. `currentHandoffRef`-style singleton pointers are insufficient and must not be reintroduced as canonical truth.
3. Every booking, hub, pharmacy, callback, clinician-message, admin-resolution, support-follow-up, or exception child workflow must open, return, supersede, and close through exactly one `LineageCaseLink`; child tables or route params alone may not become the hidden lineage map.
4. Authentication, phone verification, or continuation redemption must not directly overwrite `Request.patientRef`. Patient binding must flow through `IdentityBinding`.
5. Any clinically material evidence must create a new immutable `EvidenceSnapshot` and must trigger the canonical safety reassessment before routine flow continues.
6. No domain-local service may close a request by itself. Only `LifecycleCoordinator` may write `Request.workflowState = closed`.
7. Confirmation pending, identity repair, duplicate review, fallback recovery, reachability repair, and degraded promises must remain orthogonal blocker facts; encoding them as `Request.workflowState` values is forbidden.
8. No patient-facing flow may imply slot exclusivity unless a real `CapacityReservation.state = held` exists.
9. No pharmacy case may auto-close from weakly correlated, email-only, or operator-entered outcome evidence.
10. Minimum-necessary access must be enforced before projection materialization, not only in the UI.
11. No production config promotion may occur until a single compiled policy bundle has passed compatibility validation and reference-case simulation.
12. NHS login callback success, secure-link uplift, or continuation redemption may not itself imply writable authority or request claim. Those transitions must settle one current `CapabilityDecision`, one `SessionEstablishmentDecision`, and one governed `RouteIntentBinding` before writable detail or mutation is exposed.
13. Local session reuse is legal only while the existing `Session.subjectRef`, `sessionEpoch`, `subjectBindingVersion`, and target `PostAuthReturnIntent` all still agree. Anonymous, stale, different-subject, or mismatched secure-link sessions must rotate, bounded-recover, or deny before patient-linked detail is revealed.
14. `claim_step_up`, authenticated claim return, and URL-borne secure-link recovery may never upgrade an anonymous or mismatched session in place. Any subject change, privilege elevation, or binding-version advance must rotate the session identifier and CSRF secret and advance `sessionEpoch`.
15. `CapabilityDecision(decisionState = allow)` is necessary but not sufficient for mutation. Current `RouteIntentBinding`, `Session(sessionState = active)`, lineage fence, `sessionEpoch`, `subjectBindingVersion`, and publication posture are still mandatory.
16. No service may rewrite an existing `EvidenceSnapshot`, its `EvidenceCaptureBundle`, its normalized payload, its `EvidenceDerivationPackage`, or its `EvidenceSummaryParityRecord` in place. Late transcript improvement, enrichment, schema migration, or redaction change must append a new immutable derivative record and, if meaning changes for safety, triage, delivery, or patient-visible interpretation, mint a new `EvidenceSnapshot` linked by supersession.
17. Any summary, suggestion, or patient-visible artifact that represents evidence must cite one current parity-verified evidence contract. Local joins over mutable current state may assist navigation, but they may not impersonate the authoritative evidence used for a decision.
18. Route family, shell profile, secure-link posture, embedded NHS App posture, or support-console posture may narrow capability, visibility, or artifact delivery, but they may not redefine intake field meaning, duplicate semantics, safety entry criteria, or receipt and ETA grammar. Those differences must resolve through `IntakeConvergenceContract`, `SubmissionIngressRecord`, `NormalizedSubmission`, and the published receipt-consistency policy instead of hidden controller branches.

At this stage, also define the canonical event taxonomy as a published cross-phase contract, not a loose bullet list:

**CanonicalEventNamespace**
`canonicalEventNamespaceId`, `namespaceCode = request | intake | identity | access | telephony | safety | triage | booking | hub | pharmacy | patient | communication | reachability | exception | confirmation | capacity | support | assistive | policy | release | analytics | audit`, `owningBoundedContextRef`, `eventPurposeClass = domain_lifecycle | control_plane | recovery | continuity | observability`, `allowedProducerContextRefs[]`, `defaultDisclosureClass`, `namespaceState = draft | active | superseded | withdrawn`, `publishedAt`

**CanonicalEventContract**
`canonicalEventContractId`, `eventName`, `namespaceRef`, `owningBoundedContextRef`, `governingObjectType`, `eventPurpose = lifecycle | evidence | blocker | settlement | continuity | recovery | policy | observability`, `requiredIdentifierRefs[]`, `requiredCausalityRefs[]`, `requiredPrivacyRefs[]`, `requiredPayloadRefs[]`, `legacyAliasRefs[]`, `schemaVersionRef`, `compatibilityMode = additive_only | new_version_required | namespace_break`, `replaySemantics = append_only | idempotent_replace | superseding | observational`, `contractState = draft | active | superseded | withdrawn`, `publishedAt`

**CanonicalEventEnvelope**
`eventId`, `eventName`, `canonicalEventContractRef`, `namespaceRef`, `schemaVersionRef`, `tenantId`, `producerRef`, `producerScopeRef`, `sourceBoundedContextRef`, `governingBoundedContextRef`, `governingAggregateRef`, `governingLineageRef`, `routeIntentRef`, `commandActionRecordRef`, `commandSettlementRef`, `edgeCorrelationId`, `causalToken`, `effectKeyRef`, `continuityFrameRef`, `subjectRef`, `piiClass`, `disclosureClass`, `payloadArtifactRef`, `payloadHash`, `occurredAt`, `emittedAt`

**CanonicalEventNormalizationRule**
`canonicalEventNormalizationRuleId`, `sourceProducerRef`, `sourceNamespacePattern`, `sourceEventPattern`, `targetCanonicalEventContractRef`, `normalizationVersionRef`, `payloadRewritePolicyRef`, `privacyRewritePolicyRef`, `ruleState = active | superseded | withdrawn`, `publishedAt`

Rules:

- every state transition, blocker mutation, continuity-evidence change, degraded or recovery transition, and control-plane decision that can affect projections, analytics, assurance, replay, or audit must emit one `CanonicalEventEnvelope`
- producers may not deliver `ingest.*`, `tasks.*`, vendor callback names, or shell-local event names directly to projections, analytics, assurance, or audit; they must first normalize through `CanonicalEventNormalizationRule`
- legacy aliases must be normalized before downstream consumption, including at minimum `ingest.* -> intake.*`, `tasks.* -> triage.task.*`, `fallback.review_case.* -> exception.review_case.*`, and `external.confirmation.gate.* -> confirmation.gate.*`
- every canonical event must carry `tenantId`, `eventId`, `eventName`, `canonicalEventContractRef`, `schemaVersionRef`, `sourceBoundedContextRef`, `governingBoundedContextRef`, producer scope, governing object or lineage reference, `edgeCorrelationId`, and the required privacy posture; raw PHI, phone numbers, message bodies, transcripts, and artifact contents must travel by governed artifact reference or masked descriptor only
- if the same business fact is emitted for replay, analytics, and assurance, those consumers must share one canonical event contract; they may specialize derived projections, but they may not fork namespace or event-name semantics
- `compatibilityMode = namespace_break` is the only legal way to retire a family in place; otherwise evolve by additive schema or a new contract version with replay proof

Minimum required canonical event families:

- `request.*`: `request.created`, `request.updated`, `request.submitted`, `request.evidence.capture.frozen`, `request.snapshot.created`, `request.snapshot.superseded`, `request.evidence.parity.verified`, `request.representation.emitted`, `request.representation.superseded`, `request.workflow.changed`, `request.safety.changed`, `request.identity.changed`, `request.closure_blockers.changed`, `request.close.evaluated`, `request.closed`, `request.reopened`, `request.duplicate.pair_scored`, `request.duplicate.clustered`, `request.duplicate.review_required`, `request.duplicate.attach_applied`, `request.duplicate.retry_collapsed`, `request.duplicate.resolved`, `request.duplicate.separated`, `request.lease.acquired`, `request.lease.released`, `request.lease.broken`, `request.lease.takeover_committed`
- `intake.*`: `intake.draft.created`, `intake.draft.updated`, `intake.ingress.recorded`, `intake.ingress.superseded`, `intake.attachment.added`, `intake.attachment.quarantined`, `intake.normalized`, `intake.promotion.settled`, `intake.resume.continuity.updated`
- `identity.*`: `identity.binding.created`, `identity.binding.settled`, `identity.binding.verified`, `identity.binding.superseded`, `identity.binding.corrected`, `identity.binding.revoked`, `identity.repair_signal.recorded`, `identity.repair_case.opened`, `identity.repair_case.freeze_committed`, `identity.repair_branch.quarantined`, `identity.repair_case.corrected`, `identity.repair_release.settled`, `identity.repair_case.closed`, `identity.session.established`, `identity.session.rotated`, `identity.session.terminated`
- `access.*`: `access.grant.issued`, `access.grant.redeemed`, `access.grant.rotated`, `access.grant.superseded`, `access.grant.revoked`
- `telephony.*`: `telephony.call.started`, `telephony.menu.selected`, `telephony.identity.captured`, `telephony.recording.ready`, `telephony.urgent_live.assessed`, `telephony.transcript.readiness.updated`, `telephony.evidence.pending`, `telephony.evidence.readiness.assessed`, `telephony.evidence.ready`, `telephony.manual_review.required`, `telephony.continuation.eligibility.settled`, `telephony.sms_link.sent`, `telephony.request.seeded`, `telephony.continuation.context.created`, `telephony.continuation.context.resolved`
- `safety.*`: `safety.screened`, `safety.classified`, `safety.preempted`, `safety.reassessed`, `safety.decision_settled`, `safety.urgent_diversion.required`, `safety.urgent_diversion.issued`, `safety.urgent_diversion.completed`
- `triage.*`: `triage.task.created`, `triage.task.claimed`, `triage.task.resumed`, `triage.task.settled`, `triage.task_completion.continuity.updated`
- `booking.*`: `booking.capability.resolved`, `booking.slots.fetched`, `booking.offers.created`, `booking.slot.selected`, `booking.slot.revalidated`, `booking.slot.revalidation.failed`, `booking.commit.started`, `booking.commit.confirmation_pending`, `booking.commit.reconciliation_pending`, `booking.commit.confirmed`, `booking.commit.ambiguous`, `booking.confirmation.truth.updated`, `booking.appointment.created`, `booking.reminders.scheduled`, `booking.cancelled`, `booking.reschedule.started`, `booking.manage.continuity.updated`
- `hub.*`: `hub.case.released`, `hub.case.transfer_started`, `hub.case.transfer_accepted`, `hub.capacity.snapshot.created`, `hub.candidates.rank_completed`, `hub.offer.created`, `hub.offer.accepted`, `hub.booking.native_started`, `hub.booking.confirmation_pending`, `hub.booking.externally_confirmed`, `hub.practice.notified`
- `pharmacy.*`: `pharmacy.dispatch.started`, `pharmacy.dispatch.acknowledged`, `pharmacy.dispatch.confirmed`, `pharmacy.dispatch.proof_missing`, `pharmacy.consent.revoked`, `pharmacy.consent.revocation.recorded`, `pharmacy.outcome.received`, `pharmacy.outcome.unmatched`, `pharmacy.outcome.reconciled`, `pharmacy.reachability.blocked`, `pharmacy.reachability.repaired`, `pharmacy.case.resolved`, `pharmacy.case.bounce_back`, `pharmacy.console_settlement.continuity.updated`
- `patient.*`: `patient.receipt.issued`, `patient.receipt.degraded`, `patient.receipt.consistency.updated`, `patient.nav.digest.updated`, `patient.nav.return.bound`, `patient.record_action.context.issued`, `patient.recovery.continuation.issued`
- `communication.*`: `communication.queued`, `communication.receipt.enveloped`, `communication.command.settled`, `communication.delivery.evidence.recorded`, `communication.callback.outcome.recorded`
- `reachability.*`: `reachability.dependency.created`, `reachability.assessment.settled`, `reachability.dependency.failed`, `reachability.repair.started`, `reachability.dependency.repaired`
- `exception.*`: `exception.review_case.opened`, `exception.review_case.recovered`, `exception.artifact.quarantined`, `exception.artifact.cleared`
- `confirmation.*`: `confirmation.gate.created`, `confirmation.gate.confirmed`, `confirmation.gate.disputed`, `confirmation.gate.expired`, `confirmation.gate.cancelled`
- `capacity.*`: `capacity.reservation.created`, `capacity.reservation.soft_selected`, `capacity.reservation.held`, `capacity.reservation.pending_confirmation`, `capacity.reservation.confirmed`, `capacity.reservation.released`, `capacity.reservation.expired`, `capacity.reservation.superseded`, `capacity.reservation.disputed`, `capacity.reservation.truth.updated`
- `support.*`: `support.action.settled`, `support.repair.route_opened`, `support.repair.route_settled`, `support.replay.restore.required`, `support.replay.restore.settled`
- `assistive.*`: `assistive.transcript.ready`, `assistive.context.snapshot.created`, `assistive.artifact.generated`, `assistive.run.settled`, `assistive.freeze.opened`, `assistive.freeze.released`, `assistive.session.continuity.updated`
- `policy.*`: `policy.bundle.compiled`, `policy.bundle.rejected`, `policy.bundle.promoted`
- `release.*`: `release.candidate.published`, `release.wave.started`, `release.wave.widened`, `release.freeze.opened`, `release.freeze.released`, `release.rollback.started`, `release.rollback.completed`
- `analytics.*`: `analytics.projection_health.updated`, `analytics.assurance_slice.degraded`, `analytics.assurance_slice.quarantined`, `analytics.continuity_control.health.updated`
- `audit.*`: `audit.recorded`, `audit.break_glass.used`, `audit.export.generated`

Use these namespaces consistently across all later phases: `request.*`, `intake.*`, `identity.*`, `access.*`, `telephony.*`, `safety.*`, `triage.*`, `booking.*`, `hub.*`, `pharmacy.*`, `patient.*`, `communication.*`, `reachability.*`, `exception.*`, `confirmation.*`, `capacity.*`, `support.*`, `assistive.*`, `policy.*`, `release.*`, `analytics.*`, and `audit.*`.

Do not introduce phase-local workflow meanings onto `Request` if a dedicated downstream aggregate already owns that detail.

Continuity-evidence production is also canonical, not optional. `PatientExperienceContinuityEvidenceProjection(controlCode = patient_nav | record_continuation | conversation_settlement | more_info_reply | booking_manage)`, `SupportContinuityEvidenceProjection(controlCode = support_replay_restore)`, `DraftContinuityEvidenceProjection(controlCode = intake_resume)`, `BookingContinuityEvidenceProjection(controlCode = booking_manage)`, `HubContinuityEvidenceProjection(controlCode = hub_booking_manage)`, `AssistiveContinuityEvidenceProjection(controlCode = assistive_session)`, `WorkspaceContinuityEvidenceProjection(controlCode = workspace_task_completion)`, and `PharmacyConsoleContinuityEvidenceProjection(controlCode = pharmacy_console_settlement)` are first-class platform producers alongside `PatientNavUrgencyDigest`, `PatientNavReturnContract`, `PatientSpotlightDecisionProjection`, `PatientQuietHomeDecision`, `RecordActionContextToken`, `RecoveryContinuationToken`, `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, `ConversationCommandSettlement`, and `SupportReplayRestoreSettlement`. Later phases may specialize those projections, but they may not replace them with route-local continuity shortcuts.

On the FHIR side, the mapping layer must now be explicit and replayable through `FhirRepresentationContract`, `FhirRepresentationSet`, `FhirResourceRecord`, and `FhirExchangeBundle`. `Task`, `ServiceRequest`, `DocumentReference`, `Communication`, `Consent`, `AuditEvent`, and `Provenance` remain the right clinical and interchange backbone, but the mapping must live in one place so the rest of the code stays domain-first.

- `Request` remains the canonical aggregate and ordinarily maps to a FHIR `Task`; a FHIR `ServiceRequest` appears only when a real external or clinical service commitment exists, and booking, hub, pharmacy, support, and release blockers remain on their owning aggregates rather than being flattened into task status
- `EvidenceSnapshot`, attachments, transcripts, and presentation-safe derivatives map to `DocumentReference` plus governed binary artifacts; rewriting or superseding a `DocumentReference` may not mutate snapshot truth in place
- conversation and callback domain objects may map to `Communication`, but delivery evidence, review outcome, callback promise state, and patient reassurance continue to live on the domain settlement and evidence chain rather than on transport-facing resource status alone
- `AccessGrant`, `CapabilityDecision`, `Session`, `RequestLifecycleLease`, `CapacityReservation`, and other control-plane objects are internal domain truth, not FHIR resources; only clinically meaningful sharing or dispatch decisions may materialize as FHIR `Consent`
- `AuditRecord` remains the canonical runtime audit spine; FHIR `AuditEvent` and `Provenance` are companion clinical representations derived from the same causal chain and may never replace immutable audit or replay joins

**Frontend work in 0B**

Build an internal-only request inspector page inside the clinical shell and the patient shell. It should show:

- request summary
- current workflow, safety, and identity state
- event timeline
- attachments list
- related tasks
- raw debug identifiers

This is not a production feature. It is a developer tool that stops the team from building blind.

**Tests that must pass before 0B is done**

- state-transition tests for every allowed and forbidden transition on each state axis
- property-based tests proving invalid sequences are rejected
- event-schema compatibility tests
- alias-normalization tests proving legacy or adapter-local event names are converted into the published canonical contracts before projection, analytics, assurance, or audit ingestion
- replay tests proving superseding event contracts preserve determinism on `eventName`, `edgeCorrelationId`, `causalToken`, and governing object joins
- idempotency tests for repeated submit and create commands
- snapshot tests for domain-to-FHIR mapping contracts and emitted representation sets
- replay tests proving the same aggregate version rematerializes the same `FhirRepresentationSet` and does not silently fork identifiers or bundle membership
- contract tests proving adapters and downstream integrations consume only published `FhirExchangeBundle` payloads instead of raw aggregate internals
- version-increment tests on aggregate updates

**Exit state**  
You have one canonical request model, one explicit state contract, and one published event taxonomy plus envelope contract. Every later phase depends on this being right.

## Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm

### 0. Purpose

This segment defines the mandatory platform-wide algorithm for:

* pre-submission capture and governed promotion
* episode formation and continuity control
* identity binding, claim, and wrong-patient correction
* request ownership and secure-link access
* safety and reachability preemption
* duplicate control and duplicate-resolution discipline
* lifecycle, closure, reopen, and cross-domain concurrency
* capacity reservation, truthful offer handling, and degraded external booking
* pharmacy dispatch, consent, and outcome reconciliation
* audience-tier projection, UI-state safety, and communication semantics
* support governance, derived-artifact control, and retention freezing
* resilience, assurance ingestion, and configuration promotion

Any local rule that conflicts with this segment is invalid.

The canonical boundary model is:

* `SubmissionEnvelope`: the only durable container for pre-submission input, incomplete drafts, and evidence that is not yet safe to promote.
* `Episode`: the only durable object that represents one clinical episode.
* `Request`: one governed submission lineage inside one `Episode`.
* domain cases such as triage, callback, booking, hub, pharmacy, reconciliation, and exception work: operational branches attached to the `Episode` and, where relevant, to the originating `Request`.

One object must not silently stand in for all four boundaries.

### 1. Required platform objects

#### 1.0A IntakeConvergenceContract

Fields:

* `intakeConvergenceContractId`
* `ingressChannel = self_service_form | telephony_capture | secure_link_continuation | support_assisted_capture`
* `allowedSurfaceChannelProfiles[] = browser | embedded | telephony | secure_link | support_console`
* `requiredCanonicalFieldRefs[]`
* `identityCeilingPolicyRef`
* `contactAuthorityPolicyRef`
* `evidenceReadinessPolicyRef`
* `normalizationContractRef`
* `duplicateCalibrationPolicyRef`
* `promotionIntentPolicyRef`
* `receiptConsistencyPolicyRef`
* `statusConsistencyPolicyRef`
* `fallbackDispositionRef`
* `contractState = draft | active | superseded`
* `publishedAt`

Semantics:

* is the published cross-channel intake contract that tells runtime how one ingress family converges into the canonical intake model
* distinguishes business ingress meaning from shell adaptation; standalone web and NHS App embedded start-request are both `ingressChannel = self_service_form`, while the shell difference is carried only by `surfaceChannelProfile`
* allows telephony, secure-link continuation, and support-assisted capture to carry weaker or narrower evidence and capability ceilings explicitly, but they must still resolve the same canonical field meanings, normalization path, duplicate policy, receipt grammar, and status grammar once promotion occurs
* is the only legal place to declare that a channel may degrade to challenge, summary-only, read-only, or manual follow-up posture; route controllers, bridge code, or support tooling may not invent hidden channel-specific bypasses

#### 1.1 SubmissionEnvelope

Fields:

* `envelopeId`
* `sourceChannel = self_service_form | telephony_capture | secure_link_continuation | support_assisted_capture`
* `initialSurfaceChannelProfile = browser | embedded | telephony | secure_link | support_console`
* `intakeConvergenceContractRef`
* `sourceLineageRef`
* `state = draft | evidence_pending | ready_to_promote | promoted | abandoned | expired`
* `latestIngressRecordRef`
* `latestEvidenceSnapshotRef`
* `currentNormalizedSubmissionRef`
* `retentionClass = pre_submission | clinically_material_pre_submit`
* `verifiedSubjectRef`
* `candidatePatientRefs[]`
* `candidateEpisodeRef`
* `candidateRequestRef`
* `promotionDecisionRef`
* `promotionRecordRef`
* `expiresAt`
* `promotedRequestRef`
* `createdAt`
* `updatedAt`

Semantics:

* is the only durable container for incomplete, unauthenticated, or not-yet-promoted input
* is allowed to hold drafts, partial telephony capture, continuation fragments, uploads, and support-assisted pre-submit capture, but each ingress append must first materialize one immutable `SubmissionIngressRecord` under the bound `IntakeConvergenceContract`
* must not be projected as a submitted clinical request
* may reference only immutable evidence snapshots; `latestEvidenceSnapshotRef` must never point at a mutable draft blob, mutable transcript row, or recomputed summary view
* `sourceChannel` records the originating business ingress class, not a shell adaptation. Embedded NHS App, secure-link, or support-console posture may change `surfaceChannelProfile` on later ingress records, but they may not redefine the envelope's canonical field meanings or create a second request model
* may be linked to zero or one `Episode` before promotion and exactly one `Request` after promotion through one immutable `SubmissionPromotionRecord`
* must use narrower retention and projection rules than canonical submitted work unless policy upgrades it because the pre-submission content is clinically material

#### 1.1A SubmissionPromotionRecord

Fields:

* `promotionRecordId`
* `submissionEnvelopeRef`
* `sourceLineageRef`
* `requestRef`
* `requestLineageRef`
* `promotionCommandActionRecordRef`
* `promotionCommandSettlementRecordRef`
* `promotedEvidenceSnapshotRef`
* `promotedNormalizedSubmissionRef`
* `promotedDraftVersion`
* `intakeExperienceBundleRef`
* `receiptConsistencyKey`
* `statusConsistencyKey`
* `patientJourneyLineageRef`
* `supersededAccessGrantRefs[]`
* `supersededDraftLeaseRefs[]`
* `createdAt`

Semantics:

* is the immutable bridge between pre-submit capture and the canonical submitted request
* proves that exactly one governed promotion happened for a given envelope lineage; exact replays and late duplicate submits must return this record rather than creating another `Request`
* freezes the snapshot, normalized submission, draft version, intake bundle, and channel-equivalence keys that crossed the boundary so receipt assembly, ETA promise continuity, auth return, embedded resume, secure-link recovery, and support-assisted resume cannot infer promotion from client cache or mutable projections
* closes the draft mutation surface by superseding prior resume grants and draft leases in the same transaction as request creation

#### 1.1B RequestLineage

Fields:

* `requestLineageId`
* `episodeRef`
* `requestRef`
* `originEnvelopeRef`
* `submissionPromotionRecordRef`
* `branchClass = primary_submission | same_request_continuation | same_episode_branch | related_episode_branch`
* `branchDecisionRef`
* `continuityWitnessClass = envelope_promotion | duplicate_resolution | workflow_return | more_info_cycle | telephony_continuation | manual_link`
* `continuityWitnessRef`
* `latestTriageTaskRef`
* `latestDecisionEpochRef`
* `latestClosureRecordRef`
* `activeLineageCaseLinkRefs[]`
* `latestLineageCaseLinkRef`
* `lineageState = active | closure_pending | closed | superseded`
* `createdAt`
* `updatedAt`

Semantics:

* is the canonical continuity anchor for one governed request lineage inside one `Episode`
* binds envelope promotion, request identity, duplicate-resolution branching, auth return, patient-shell continuity, and child workflow ownership to the same lineage object
* same-request continuation must reuse the existing `RequestLineage`; it may append new snapshots or open new linked child workflows, but it may not mint a second request-shaped lineage by convention
* same-episode and related-episode branching must mint a new `RequestLineage` with an explicit `branchDecisionRef`; later readers must be able to distinguish reuse, sibling branch, and related-episode branch without reverse-engineering event history
* does not own lifecycle milestones; `Request`, `Episode`, and child workflow aggregates still own their own state, while `RequestLineage` owns continuity, joins, and branch semantics

#### 1.1C LineageCaseLink

Fields:

* `lineageCaseLinkId`
* `requestLineageRef`
* `episodeRef`
* `requestRef`
* `caseFamily = callback | clinician_message | booking | hub | pharmacy | admin_resolution | support_follow_up | exception`
* `domainCaseRef`
* `parentLineageCaseLinkRef`
* `originDecisionEpochRef`
* `originDecisionSupersessionRef`
* `originTriageTaskRef`
* `originDuplicateResolutionDecisionRef`
* `linkReason = direct_handoff | same_request_continuation | same_episode_related_work | related_episode_branch | bounce_back | recovery_follow_on | operational_follow_up`
* `ownershipState = proposed | acknowledged | active | returned | closed | superseded | compensated`
* `currentClosureBlockerRefs[]`
* `currentConfirmationGateRefs[]`
* `latestMilestoneRef`
* `returnToTriageRef`
* `openedAt`
* `closedAt`
* `supersededAt`

Semantics:

* is the sole canonical join between one `RequestLineage` and one child workflow aggregate such as booking, hub, pharmacy, callback, message, admin-resolution, support, or exception work
* every child workflow case must materialize exactly one `LineageCaseLink` before it can become writable, patient-visible, or closure-relevant; raw foreign keys and local status copy are insufficient
* parent-child workflows such as booking to hub fallback must chain through `parentLineageCaseLinkRef` so one care journey remains reconstructable without flattening all workflow state into `Request`
* child workflows may contribute blockers, confirmation gates, and milestones through this link, but they may not rewrite `Request.workflowState`, `Episode.state`, or sibling case meaning directly
* close, return, supersession, compensation, and reopen logic must settle the link explicitly so lineage replay can explain whether the child work completed, returned upstream, was superseded, or was compensated after a branch correction

#### 1.2 Episode

Fields:

* `episodeId`
* `patientRef?`
* `currentIdentityBindingRef`
* `activeIdentityRepairCaseRef`
* `currentConfirmationGateRefs[]`
* `currentClosureBlockerRefs[]`
* `episodeFingerprint`
* `originRequestRef`
* `memberRequestRefs[]`
* `requestLineageRefs[]`
* `state = open | resolved | archived`
* `resolutionReason`
* `openedAt`
* `resolvedAt`
* `updatedAt`

Semantics:

* is the sole canonical container for one clinical episode
* derives `patientRef` only from `currentIdentityBindingRef`; no support, auth, telephony, import, or backfill path may write episode patient identity directly
* may parent one or more related `Request` and `RequestLineage` objects without forcing them into a single operational lineage
* keeps identity repair, duplicate review, fallback recovery, confirmation gates, and other closure blockers orthogonal to episode lifecycle rather than encoding them as extra episode states
* is the object against which cross-domain invariants, closure, reopen, and high-risk correction are ultimately evaluated

#### 1.3 Request

Fields:

* `requestId`
* `episodeId`
* `originEnvelopeRef`
* `promotionRecordRef`
* `requestVersion`
* `tenantId`
* `sourceChannel`
* `originIngressRecordRef`
* `normalizedSubmissionRef`
* `requestType`
* `narrativeRef`
* `structuredDataRef`
* `attachmentRefs[]`
* `contactPreferencesRef`
* `workflowState = submitted | intake_normalized | triage_ready | triage_active | handoff_active | outcome_recorded | closed`
* `safetyState = not_screened | screen_clear | residual_risk_flagged | urgent_diversion_required | urgent_diverted`
* `identityState = anonymous | partial_match | matched | claimed`
* `priorityBand`
* `pathwayRef`
* `assignedQueueRef`
* `patientRef?`
* `currentIdentityBindingRef`
* `currentEvidenceSnapshotRef`
* `currentEvidenceAssimilationRef`
* `currentMaterialDeltaAssessmentRef`
* `currentEvidenceClassificationRef`
* `currentSafetyPreemptionRef`
* `currentSafetyDecisionRef`
* `currentUrgentDiversionSettlementRef`
* `safetyDecisionEpoch`
* `requestLineageRef`
* `currentTriageTaskRef`
* `latestLineageCaseLinkRef`
* `activeLineageCaseLinkRefs[]`
* `currentConfirmationGateRefs[]`
* `currentClosureBlockerRefs[]`
* `slaClockRef`
* `createdAt`
* `updatedAt`

Semantics:

* represents one governed submission lineage promoted from one `SubmissionEnvelope` through one immutable `SubmissionPromotionRecord`
* is not a draft store
* `sourceChannel` records the originating ingress class from the envelope and may not be rewritten by later NHS App embedding, secure-link continuation, telephony follow-up, or support-assisted capture; later ingress records may append provenance, but they do not redefine request meaning
* keeps workflow milestones separate from confirmation, repair, duplicate-review, and fallback-recovery blockers
* derives `patientRef` from the latest verified `IdentityBinding`; before verified binding exists it may be null while `identityState` remains below `claimed`
* may receive additional immutable snapshots after promotion, but `currentEvidenceSnapshotRef` may advance only by linking to a new snapshot through explicit supersession
* `currentEvidenceAssimilationRef` and `currentMaterialDeltaAssessmentRef` may advance only through `EvidenceAssimilationCoordinator`; downstream domains may consume them, but they may not decide locally that new evidence is non-material or safe to bypass
* `currentEvidenceClassificationRef`, `currentSafetyPreemptionRef`, `currentSafetyDecisionRef`, `currentUrgentDiversionSettlementRef`, and `safetyDecisionEpoch` may advance only through `SafetyOrchestrator`; downstream domains may consume them, but they may not infer or rewrite safety truth locally
* `requestLineageRef` is the canonical continuity anchor for auth return, patient-shell continuity, and child workflow joins; route params, projections, or child case tables may not synthesize a second lineage anchor
* `latestLineageCaseLinkRef` and `activeLineageCaseLinkRefs[]` summarize child workflow ownership without collapsing booking, hub, pharmacy, callback, or message-local states into the request
* may remain related to other `Request` objects within the same `Episode` without being merged into them

#### 1.3A PatientReceiptConsistencyEnvelope

Fields:

* `consistencyEnvelopeId`
* `requestRef`
* `requestLineageRef`
* `submissionPromotionRecordRef`
* `normalizedSubmissionRef`
* `receiptConsistencyKey`
* `statusConsistencyKey`
* `receiptBucket`
* `etaPromiseRef`
* `etaLowerBoundAt`
* `etaMedianAt`
* `etaUpperBoundAt`
* `bucketConfidence`
* `promiseState = on_track | improved | at_risk | revised_downward | recovery_required`
* `calibrationVersionRef`
* `statusProjectionVersionRef`
* `causalToken`
* `monotoneRevision`
* `visibilityTier`
* `issuedAt`

Semantics:

* is the canonical monotone receipt and ETA contract for one promoted request lineage
* must be derived from the promoted `NormalizedSubmission` plus the frozen `SubmissionPromotionRecord.receiptConsistencyKey` and `statusConsistencyKey`; later route, shell, or channel adaptation may not fork promise semantics for the same request
* browser, embedded NHS App, secure-link, authenticated, and telephony-origin views may differ in disclosure level or provenance copy, but they must all read the same bucket, confidence, promise state, and recovery posture from this envelope
* later views may refine or improve the promise only when a newer authoritative projection and the published hysteresis rules justify the change; they may not silently downgrade, widen, or contradict the already issued promise

#### 1.3B TelephonyUrgentLiveAssessment

Fields:

* `telephonyUrgentLiveAssessmentId`
* `callSessionRef`
* `signalRefs[]`
* `signalSourceClasses[] = ivr_selection | spoken_phrase | staff_observation | live_rule`
* `assessmentOutcome = none | suspected | urgent_live_required`
* `preemptionRef`
* `assessmentState = open | preempted | cleared | superseded`
* `assessedAt`

Semantics:

* is the only telephony-side authority that may open urgent-live handling before full transcript or routine evidence readiness exists
* may trigger conservative urgent diversion immediately, but it may not by itself authorize routine promotion, calm receipt posture, or seeded continuation

#### 1.3C TelephonyTranscriptReadinessRecord

Fields:

* `telephonyTranscriptReadinessRecordId`
* `callSessionRef`
* `recordingArtifactRef`
* `transcriptJobRef`
* `transcriptState = not_started | queued | running | partial | ready | failed | superseded`
* `coverageClass = none | keyword_only | partial_utterance | clinically_sufficient`
* `qualityBand = unknown | low | medium | high`
* `derivedFactsPackageRef`
* `blockingReasonCodes[]`
* `checkedAt`

Semantics:

* is the immutable verdict over transcript availability and clinical sufficiency for one call-session evidence cut
* separates transcript existence from transcript usability; `transcriptState = ready` is not enough if coverage or quality still leaves safety meaning unresolved

#### 1.3D TelephonyEvidenceReadinessAssessment

Fields:

* `telephonyEvidenceReadinessAssessmentId`
* `callSessionRef`
* `submissionEnvelopeRef`
* `urgentLiveAssessmentRef`
* `transcriptReadinessRef`
* `structuredCaptureRefs[]`
* `identityEvidenceRefs[]`
* `contactRouteEvidenceRefs[]`
* `manualReviewDispositionRef`
* `continuationEligibilityRef`
* `usabilityState = awaiting_recording | awaiting_transcript | awaiting_structured_capture | urgent_live_only | safety_usable | manual_review_only | unusable_terminal`
* `promotionReadiness = blocked | continuation_only | ready_to_seed | ready_to_promote`
* `reasonCodes[]`
* `assessedAt`

Semantics:

* is the sole authority allowed to state whether telephony evidence is still incomplete, urgent-only, manually reviewable, seedable for bounded continuation, or safe to promote into routine canonical intake
* binds recording availability, transcript sufficiency, structured keypad capture, identity posture, and urgent-live assessment into one immutable verdict so workers and controllers cannot race or infer readiness from partial local state

#### 1.3E TelephonyContinuationEligibility

Fields:

* `telephonyContinuationEligibilityId`
* `callSessionRef`
* `evidenceReadinessAssessmentRef`
* `identityConfidenceRef`
* `destinationConfidenceRef`
* `grantFamilyRecommendation = continuation_seeded_verified | continuation_challenge | manual_only`
* `lineageScope = same_submission_envelope | same_request_lineage | none`
* `eligibilityState = not_eligible | eligible_seeded | eligible_challenge | manual_only`
* `reasonCodes[]`
* `evaluatedAt`

Semantics:

* is the only telephony-side authority allowed to recommend seeded continuation, challenge continuation, or manual-only follow-up
* may narrow grant scope or force manual handling, but it may not bypass `AccessGrantService` or widen continuity outside the proven lineage scope

#### 1.3F TelephonyManualReviewDisposition

Fields:

* `telephonyManualReviewDispositionId`
* `callSessionRef`
* `triggerClass = recording_missing | transcript_degraded | contradictory_capture | identity_ambiguous | handset_untrusted | urgent_live_without_routine_evidence`
* `reviewMode = audio_review | callback_required | staff_transcription | follow_up_needed | abandon`
* `reviewState = open | assigned | settled | superseded`
* `createdAt`
* `settledAt`

Semantics:

* is the canonical manual-review fork for telephony evidence that cannot safely become routine intake yet
* keeps manual audio review, callback follow-up, and staff transcription explicit and closure-blocking instead of leaving them as hidden operator convention

#### 1.4 IdentityBinding

Fields:

* `bindingId`
* `episodeId`
* `requestId`
* `subjectRef`
* `patientRef?`
* `runnerUpPatientRef?`
* `candidatePatientRefs[]`
* `candidateSetRef`
* `bindingState = candidate | provisional_verified | ambiguous | verified_patient | correction_pending | corrected | revoked`
* `ownershipState = unclaimed | claim_pending | claimed | blocked_other_subject`
* `decisionClass = candidate_refresh | provisional_verify | verified_bind | claim_confirmed | correction_applied | revoked`
* `assuranceLevel = none | low | medium | high`
* `verifiedContactRouteRef`
* `matchEvidenceRef`
* `linkProbability`
* `linkProbabilityLowerBound`
* `runnerUpProbabilityUpperBound`
* `subjectProofProbabilityLowerBound`
* `gapLogit`
* `calibrationVersionRef`
* `confidenceModelState = calibrated | drift_review | out_of_domain`
* `bindingVersion`
* `bindingAuthorityRef`
* `stepUpMethod`
* `supersedesBindingRef`
* `supersededByRef`
* `createdAt`
* `updatedAt`

Semantics:

* owns patient-binding decisions
* is the sole governed source for establishing or correcting patient identity on a `Request` and its `Episode`
* separates authentication, matching, and ownership
* supports provisional binding before irreversible downstream work exists
* stores calibrated confidence, interval bounds, and model-state so automatic binding can fail closed under drift instead of treating every score as equally trustworthy
* is append-only by version; every candidate refresh, verified bind, claim confirmation, correction, or revocation creates a new binding version rather than mutating a previously settled one in place
* is the authoritative source for bound `patientRef` and `ownershipState`; sessions, grants, support tools, and projections may reference it but may not infer or overwrite those fields independently

#### 1.4A PatientLink

Fields:

* `patientLinkId`
* `subjectRef`
* `patientRef`
* `identityBindingRef`
* `linkState = none | candidate | provisional_verified | verified_patient | ambiguous | correction_pending | revoked`
* `linkProbability`
* `linkProbabilityLowerBound`
* `runnerUpProbabilityUpperBound`
* `subjectProofProbabilityLowerBound`
* `gapLogit`
* `calibrationVersionRef`
* `confidenceModelState = calibrated | drift_review | out_of_domain`
* `bindingVersionRef`
* `provenanceRef`
* `evaluatedAt`
* `expiresAt`

Semantics:

* is the current subject-to-patient link verdict used by capability evaluation and auth-return fencing
* is derived from the latest settled `IdentityBinding` version and associated evidence; it may not establish or correct lineage binding by itself
* remains distinct from local session issuance and from request ownership claim
* may be `provisional_verified` or `ambiguous` without implying writable claim posture

#### 1.4B CapabilityDecision

Fields:

* `decisionId`
* `subjectRef`
* `routeProfileRef`
* `policyVersion`
* `capabilitySet`
* `capabilityCeiling`
* `decisionState = allow | step_up_required | recover_only | deny`
* `trustFloor`
* `freshnessScore`
* `riskUpperBound`
* `reasonCodes[]`
* `evaluatedAt`
* `expiresAt`
* `identityEvidenceRefs[]`
* `linkState`
* `ageGateState`
* `manualOverrideRef`
* `bindingVersionRef`

Semantics:

* is the immutable trust and route-capability verdict for one subject and route profile
* is a ceiling only; it does not by itself mint session, claim, or writable mutation authority
* must fail closed on stale evidence, ambiguous patient link, route-profile drift, or explicit policy restriction

#### 1.4C Session

Fields:

* `sessionId`
* `subjectRef`
* `patientLinkRef`
* `identityBindingRef`
* `decisionRef`
* `establishmentDecisionRef`
* `activeReturnIntentRef`
* `issuedAt`
* `lastSeenAt`
* `authTime`
* `idleExpiresAt`
* `absoluteExpiresAt`
* `sessionState = establishing | active | step_up_required | restricted | recovery_only | revoked | expired_idle | expired_absolute | terminated`
* `assuranceBand`
* `routeAuthorityState = none | auth_read_only | claim_pending | writable`
* `sessionEpoch`
* `subjectBindingVersion`
* `riskUpperBound`
* `cookieKeyVersionRef`
* `reauthRequiredAt`
* `revokedAt`
* `revocationReason`
* `csrfSecret`
* `deviceContext`

Semantics:

* is the local Vecells session and remains distinct from upstream NHS login proof, patient link, claim status, and route intent
* may be `active` while `routeAuthorityState` is only `auth_read_only` or `claim_pending`
* any subject switch, privilege elevation, or binding-version advance must rotate the session identifier, CSRF secret, and `sessionEpoch`

#### 1.4D AuthTransaction

Fields:

* `transactionId`
* `stateHash`
* `nonceHash`
* `pkceVerifierRef`
* `scopeBundleRef`
* `capabilityIntentRef`
* `returnIntentRef`
* `requestContextHash`
* `transactionFenceEpoch`
* `callbackSettlementRef`
* `sessionEstablishmentDecisionRef`
* `maxAuthAgeSeconds`
* `startedAt`
* `expiresAt`
* `callbackReceivedAt`
* `completedAt`
* `errorRef`
* `transactionState = opened | awaiting_callback | callback_received | verified | consumed | denied | expired | replayed`

Semantics:

* is the single callback-consumption fence for one NHS login authorization round-trip
* duplicate browser retries or callback races must settle the same transaction rather than opening a second session or second post-auth side effect
* may not be bypassed by controller-local auth-return shortcuts

#### 1.4E AuthScopeBundle

Fields:

* `scopeBundleId`
* `requestedScopes[]`
* `minimumClaims[]`
* `minimumAssuranceBand`
* `capabilityCeiling`
* `policyVersion`
* `consentCopyVariantRef`
* `createdAt`
* `expiresAt`

Semantics:

* freezes the exact requested scopes, assurance floor, and capability ceiling for one auth transaction
* prevents consent copy, route sensitivity, or requested-scope drift between authorize and callback

#### 1.4F PostAuthReturnIntent

Fields:

* `returnIntentId`
* `routeFamilyRef`
* `actionScope`
* `routeTargetRef`
* `requestLineageRef`
* `draftRef`
* `submissionPromotionRecordRef`
* `draftContinuityEvidenceRef`
* `continuationAccessGrantRef`
* `fallbackRouteRef`
* `resumeContinuationRef`
* `subjectRef`
* `requiredIdentityBindingRef`
* `requiredCapabilityDecisionRef`
* `requiredPatientLinkRef`
* `requiredSessionState = active | step_up_required | restricted | recovery_only`
* `returnAuthority = auth_only | claim_pending | writable_resume | recovery_only`
* `sessionEpochRef`
* `subjectBindingVersionRef`
* `lineageFenceEpoch`
* `manifestVersionRef`
* `releaseApprovalFreezeRef`
* `minimumBridgeCapabilitiesRef`
* `channelReleaseFreezeState`
* `routeFreezeDispositionRef`
* `expiresAt`
* `intentState = pending | consumed | superseded | recovered`

Semantics:

* is the governed post-auth target and may be converted into exactly one `RouteIntentBinding`
* distinguishes ordinary sign-in, claim-pending return, writable resume, and bounded recovery instead of treating all auth returns as equivalent
* may not reopen a promoted draft lineage or reveal stale patient detail when session, subject, lineage, or channel fences drift

#### 1.4G SessionEstablishmentDecision

Fields:

* `decisionId`
* `transactionRef`
* `existingSessionRef`
* `resolvedSessionRef`
* `identityBindingRef`
* `subjectComparisonState = no_session | anonymous_session | same_subject_same_binding | same_subject_binding_advanced | different_subject | mismatched_secure_link_subject | stale_existing`
* `capabilityDecisionRef`
* `draftClaimDisposition = none | claim_route_required | draft_claim_allowed | request_shell_required | blocked_other_subject`
* `returnIntentDisposition = consume_intent | consume_to_recovery | supersede_intent | deny_intent`
* `writableAuthorityState = none | auth_read_only | claim_pending | writable`
* `decision = create_fresh | rotate_existing | reuse_existing | deny | bounded_recovery`
* `decidedAt`

Semantics:

* is the only object allowed to turn successful auth into a local session outcome
* same-subject low-drift flows may reuse a session, but anonymous, stale, different-subject, or mismatched secure-link posture must rotate or bounded-recover instead of upgrading in place
* keeps `auth_read_only`, `claim_pending`, and `writable` authority separate so claim remains a distinct later step

#### 1.4H SessionTerminationSettlement

Fields:

* `settlementId`
* `sessionRef`
* `trigger`
* `triggerRef`
* `cookieClearState`
* `serverRevocationState`
* `projectionDisposition`
* `postTerminationRouteRef`
* `settledAt`

Semantics:

* is the exact-once settlement for sign-out, expiry, downgrade, revocation, and subject-switch teardown
* prevents UI, support, or recovery flows from inferring terminal session reasons from missing cookies or stale projections alone

#### 1.4I IdentityRepairSignal

Fields:

* `repairSignalId`
* `episodeId`
* `affectedRequestRef`
* `observedIdentityBindingRef`
* `observedSessionRef`
* `observedAccessGrantRef`
* `observedRouteIntentBindingRef`
* `signalClass = patient_report | support_report | auth_subject_conflict | secure_link_subject_conflict | telephony_contradiction | downstream_contradiction | delivery_dispute | audit_replay`
* `signalDisposition = suspicion_only | credible_misbinding | confirmed_misbinding`
* `evidenceRefs[]`
* `openedRepairCaseRef`
* `reportedBy`
* `reportedAt`

Semantics:

* is the immutable trigger object for any wrong-patient suspicion or confirmed misbinding discovered after durable binding exists
* lets auth, support, telephony, delivery, and downstream domains converge on one active repair case instead of opening competing local holds
* captures the exact binding, session, grant, and route posture that triggered the freeze so later repair or review cannot infer that state from mutable projections

#### 1.5 IdentityRepairCase

Fields:

* `repairCaseId`
* `episodeId`
* `affectedRequestRefs[]`
* `openedSignalRefs[]`
* `frozenIdentityBindingRef`
* `frozenSubjectRef`
* `frozenPatientRef`
* `suspectedWrongBindingRef`
* `repairBasis = suspicion_only | credible_misbinding | confirmed_misbinding`
* `lineageFenceEpoch`
* `state = opened | freeze_committed | downstream_quarantined | correction_authority_pending | corrected | rebuild_pending | release_pending | closed`
* `openedBy`
* `supervisorApprovalRef`
* `independentReviewRef`
* `freezeRecordRef`
* `projectionRebuildRef`
* `downstreamDispositionRefs[]`
* `compensationRefs[]`
* `releaseSettlementRef`
* `createdAt`
* `updatedAt`

Semantics:

* is mandatory for any wrong-patient correction after a verified bind exists
* is the only active lineage-level correction container for a frozen bind; new wrong-patient signals on the same frozen binding must reuse this case until release or closure
* records the exact binding, patient, and lineage fence that were frozen, so later correction, rebuild, and release cannot infer pre-correction truth from mutable current state
* coordinates review, downstream quarantine, compensation, and release, but the corrected bind itself must still be settled by `IdentityBindingAuthority`

#### 1.5A IdentityRepairFreezeRecord

Fields:

* `freezeRecordId`
* `identityRepairCaseRef`
* `frozenIdentityBindingRef`
* `lineageFenceEpoch`
* `sessionTerminationSettlementRefs[]`
* `accessGrantSupersessionRefs[]`
* `supersededRouteIntentBindingRefs[]`
* `communicationsHoldState = active | partial | released`
* `projectionHoldState = summary_only | read_only | recovery_only`
* `affectedAudienceRefs[]`
* `freezeState = pending | active | released`
* `activatedAt`
* `releasedAt`

Semantics:

* is the exact-once freeze barrier for wrong-patient correction
* advances lineage fences, terminates or rotates stale sessions, supersedes stale grants and route intents, and freezes outward communication before repair work may continue
* is the single repair posture consumed by patient, support, staff, and downstream projections so identity hold does not drift into surface-local interpretations

#### 1.5B IdentityRepairBranchDisposition

Fields:

* `branchDispositionId`
* `identityRepairCaseRef`
* `branchType = booking | hub_coordination | pharmacy | callback | message_thread | support_ticket | artifact_projection | outbound_communication`
* `governingObjectRef`
* `frozenIdentityBindingRef`
* `requiredDisposition = suppress_visibility | revalidate_under_new_binding | compensate_external | manual_review_only`
* `compensationRef`
* `revalidationSettlementRef`
* `branchState = pending_freeze | quarantined | compensation_pending | rebuilt | released`
* `releasedAt`

Semantics:

* every downstream branch touched by the frozen binding must materialize one disposition record before release
* makes correction hold replayable and auditable by recording which branches were merely suppressed, which were rebuilt, and which required compensation or manual review
* prevents patient, staff, and support shells from reopening a downstream path just because one projection refreshed earlier than the others

#### 1.5C IdentityRepairReleaseSettlement

Fields:

* `releaseSettlementId`
* `identityRepairCaseRef`
* `resultingIdentityBindingRef`
* `freezeRecordRef`
* `downstreamDispositionRefs[]`
* `projectionRebuildRef`
* `replacementAccessGrantRefs[]`
* `replacementRouteIntentBindingRefs[]`
* `replacementSessionEstablishmentDecisionRef`
* `communicationsResumeState = resumed | manual_follow_up_required`
* `releaseMode = read_only_resume | claim_pending_resume | writable_resume | manual_follow_up_only`
* `recordedAt`

Semantics:

* is the only authority allowed to clear an identity hold and mint fresh continuity after correction
* guarantees that continuity resumes from the corrected binding, repaired branch set, and current runtime tuple rather than from stale cached links, sessions, or route intents
* permits release to remain read-only or claim-pending when correction settles identity but not yet writable authority

#### 1.6 AccessGrant

Fields:

* `grantId`
* `grantFamily = draft_resume_minimal | public_status_minimal | claim_step_up | continuation_seeded_verified | continuation_challenge | transaction_action_minimal | support_recovery_minimal`
* `actionScope = envelope_resume | status_view | claim | respond_more_info | waitlist_offer | alternative_offer | appointment_manage_entry | pharmacy_status_entry | callback_status_entry | callback_response | message_thread_entry | message_reply | contact_route_repair | secure_resume`
* `lineageScope = envelope | request | episode`
* `grantScopeEnvelopeRef`
* `routeFamilyRef`
* `subjectRef`
* `boundPatientRef`
* `issuedIdentityBindingRef`
* `boundContactRouteRef`
* `subjectBindingMode = none | soft_subject | hard_subject`
* `phiExposureClass = none | minimal | scoped`
* `replayPolicy = one_time | rotating | multi_use_minimal`
* `tokenHash`
* `tokenKeyVersionRef`
* `validatorVersionRef`
* `issuedRouteIntentBindingRef`
* `issuedSessionEpochRef`
* `issuedSubjectBindingVersionRef`
* `issuedLineageFenceEpoch`
* `requiredReleaseApprovalFreezeRef`
* `requiredChannelReleaseFreezeRef`
* `requiredAudienceSurfaceRuntimeBindingRef`
* `grantState = live | redeeming | redeemed | rotated | superseded | revoked | expired`
* `maxRedemptions`
* `redemptionCount`
* `currentRedemptionRef`
* `latestSupersessionRef`
* `expiresAt`
* `redeemedAt`
* `revokedAt`
* `revocationReason`
* `supersedesGrantRef`
* `supersededByGrantRef`
* `createdAt`
* `updatedAt`

Semantics:

* all secure-link, continuation, uplift, and transactional patient-entry flows must use this object
* `manual_only` is not a grant family; it is a routing disposition indicating no safe grant may be issued
* each grant family must use an independently testable validator, replay policy, and signing or key namespace so a family-specific defect cannot widen all access paths at once
* any grant that can appear in a URL must be an opaque random reference with at least 128 bits of entropy; only `tokenHash` may be stored at rest and the token itself must carry no inline PHI, lineage, or mutable scope
* every grant is an immutable issuance contract over one `AccessGrantScopeEnvelope`; controllers, shells, support tools, and delivery channels may narrow presentation, but they may not widen route, object, PHI, or runtime scope beyond that envelope
* any first successful presentation of a one-time or rotating grant must settle through exactly one `AccessGrantRedemptionRecord` before session creation, route re-entry, or replacement-grant issuance continues
* any replacement, rotation, reissue, promotion, claim, identity repair, logout, or drift invalidation must settle through `AccessGrantSupersessionRecord`; a stale grant may not remain implicitly live after newer access has been issued

#### 1.6A AccessGrantScopeEnvelope

Fields:

* `scopeEnvelopeId`
* `grantFamily`
* `actionScope`
* `lineageScope`
* `routeFamilyRef`
* `governingObjectRef`
* `governingVersionRef`
* `phiExposureClass = none | minimal | scoped`
* `issuedRouteIntentBindingRef`
* `requiredIdentityBindingRef`
* `requiredReleaseApprovalFreezeRef`
* `requiredChannelReleaseFreezeRef`
* `requiredAudienceSurfaceRuntimeBindingRef`
* `minimumBridgeCapabilitiesRef`
* `requiredAssuranceSliceTrustRefs[]`
* `recoveryRouteRef`
* `scopeHash`
* `createdAt`

Semantics:

* is the immutable capability and route ceiling for one grant
* binds one grant family and one action scope to one governing object version, one route family, and one current runtime tuple
* any change in governing-object version, route ownership, embedded capability floor, release posture, or audience-surface runtime binding requires a new grant rather than reinterpretation of an older token

#### 1.6B AccessGrantRedemptionRecord

Fields:

* `redemptionId`
* `grantRef`
* `grantScopeEnvelopeRef`
* `requestContextHash`
* `authorizationFenceHash`
* `decision = allow | step_up | recover | deny`
* `decisionReasonCodes[]`
* `grantStateAfterDecision = live | redeemed | rotated | superseded | revoked | expired`
* `resultingSessionRef`
* `resultingRouteIntentBindingRef`
* `replacementGrantRef`
* `supersessionRecordRef`
* `recoveryRouteRef`
* `recordedAt`

Semantics:

* is the exact-once terminal settlement for a presented grant under the current fences and scope envelope
* duplicate clicks, delayed SMS or email opens, refreshes, or cross-device retries must return this record or the linked supersession result rather than executing a second session mint, route re-entry, or replacement-grant flow
* explains why redemption was allowed, denied, narrowed into step-up, or diverted into bounded recovery

#### 1.6C AccessGrantSupersessionRecord

Fields:

* `supersessionId`
* `causeClass = rotation | claim_completed | draft_promoted | secure_link_reissue | identity_repair | session_drift | route_drift | publication_drift | expiry_sweep | logout | manual_revoke`
* `supersededGrantRefs[]`
* `replacementGrantRef`
* `governingObjectRef`
* `lineageFenceEpoch`
* `sessionEpochRef`
* `subjectBindingVersionRef`
* `reasonCodes[]`
* `recordedAt`

Semantics:

* is the authoritative settlement for invalidating one or more older grants and optionally naming the replacement grant
* any listed superseded grant becomes non-authoritative immediately, even if a delayed sweep has not yet marked the row expired
* support reissue, claim uplift, draft promotion, route drift, runtime publication drift, logout, and wrong-patient repair must use this record rather than leaving old links live by convention

#### 1.7 DuplicateCluster

Fields:

* `clusterId`
* `episodeId`
* `canonicalRequestId`
* `memberRequestRefs[]`
* `memberSnapshotRefs[]`
* `candidateRequestRefs[]`
* `pairwiseEvidenceRefs[]`
* `currentResolutionDecisionRef`
* `resolutionDecisionRefs[]`
* `relationType = retry | same_episode_candidate | same_episode_confirmed | related_episode | review_required`
* `reviewStatus = open | in_review | resolved_confirmed | resolved_separate | resolved_related | resolved_retry | superseded`
* `decisionRef`
* `clusterConfidence`
* `thresholdPolicyRef`
* `channelCalibrationRef`
* `instabilityState = stable | oscillating | blocked_conflict`
* `lastRecomputedAt`
* `createdAt`
* `updatedAt`

Semantics:

* `same_episode_candidate` is a clustering signal only
* `same_episode_candidate` never authorizes automatic attach or merge by itself
* only `retry` or `same_episode_confirmed` may authorize attach behavior, and `same_episode_confirmed` remains subject to the attach rules below
* pairwise candidate edges are not transitive proof; an auto-confirmed cluster must be canonical-centered and conflict-free under the cluster rules below
* review clusters may use connected components for operator efficiency, but every attach, retry, and same-episode confirmation decision remains pairwise or canonical-to-member and separately auditable through `DuplicateResolutionDecision`
* the cluster is the review container, not the settlement itself; stale or superseded duplicate resolutions append to `resolutionDecisionRefs[]` rather than rewriting earlier decisions in place

#### 1.7A DuplicatePairEvidence

Fields:

* `pairEvidenceId`
* `incomingLineageRef`
* `incomingSnapshotRef`
* `candidateRequestRef`
* `candidateEpisodeRef`
* `replaySignalRefs[]`
* `continuitySignalRefs[]`
* `conflictSignalRefs[]`
* `relationModelVersionRef`
* `channelCalibrationRef`
* `thresholdPolicyRef`
* `featureVectorHash`
* `piRetry`
* `piSameRequestAttach`
* `piSameEpisode`
* `piRelatedEpisode`
* `piNewEpisode`
* `classMargin`
* `candidateMargin`
* `uncertaintyScore`
* `hardBlockerRefs[]`
* `evidenceState = active | superseded`
* `createdAt`

Semantics:

* is the immutable pairwise scoring proof for one incoming snapshot against one candidate request
* stores both class separation and candidate-to-candidate competition margin so auto-attach cannot pick one plausible target while another target remains nearly equivalent
* pins channel calibration, relation model, and threshold policy so later replay, review, and audit can explain why the platform clustered, attached, or separated

#### 1.7B DuplicateResolutionDecision

Fields:

* `duplicateResolutionDecisionId`
* `duplicateClusterRef`
* `incomingLineageRef`
* `incomingSnapshotRef`
* `targetRequestRef`
* `targetEpisodeRef`
* `winningPairEvidenceRef`
* `competingPairEvidenceRefs[]`
* `decisionClass = exact_retry_collapse | same_request_attach | same_episode_link | related_episode_link | separate_request | review_required`
* `continuityWitnessClass = deterministic_replay | submit_lineage | workflow_return | more_info_cycle | telephony_continuation | human_review | none`
* `continuityWitnessRef`
* `reviewMode = auto | human_review | replay_authority`
* `reasonCodes[]`
* `decisionState = applied | superseded | reverted`
* `supersedesDecisionRef`
* `downstreamInvalidationRefs[]`
* `decidedByRef`
* `decidedAt`
* `revertedAt`

Semantics:

* is the only object allowed to collapse retry, attach same-request continuation, confirm same-episode linkage, or affirm separation after duplicate review
* keeps duplicate handling reversible by supersession rather than by mutating prior lineage history in place
* requires explicit continuity witness for `same_request_attach`; pairwise scores alone are never sufficient to prove same-request continuation

#### 1.7C EvidenceAssimilationRecord

Fields:

* `evidenceAssimilationId`
* `episodeId`
* `requestId`
* `sourceDomain`
* `governingObjectRef`
* `ingressEvidenceRefs[]`
* `priorCompositeSnapshotRef`
* `resultingSnapshotRef`
* `materialDeltaAssessmentRef`
* `classificationDecisionRef`
* `resultingPreemptionRef`
* `attachmentDisposition = new_snapshot | derivative_only | replay_existing | hold_pending_review`
* `assimilationState = pending_materiality | pending_classification | pending_preemption | settled_no_re_safety | settled_triggered | blocked_manual_review | replay_returned | superseded`
* `resultingSafetyEpoch`
* `decidedAt`

Semantics:

* is the sole cross-domain gateway for post-submit evidence entering an active lineage
* exact or semantic replay of the same post-submit evidence batch must return the current assimilation record rather than minting a second snapshot, second preemption, or second downstream side effect
* no domain may update workflow, queue calmness, patient reassurance, or downstream completion from new evidence until the owning assimilation record has settled

#### 1.7D MaterialDeltaAssessment

Fields:

* `materialDeltaAssessmentId`
* `requestId`
* `evidenceAssimilationRef`
* `sourceDomain`
* `governingObjectRef`
* `priorCompositeSnapshotRef`
* `candidateSnapshotRef`
* `changedEvidenceRefs[]`
* `changedFeatureRefs[]`
* `changedDependencyRefs[]`
* `changedChronologyRefs[]`
* `materialityPolicyRef`
* `materialityClass = technical_only | operational_nonclinical | safety_material | contact_safety_material | unresolved`
* `triggerDecision = re_safety_required | no_re_safety | blocked_manual_review | coalesced_with_pending_preemption`
* `decisionBasis = no_semantic_delta | feature_delta | chronology_delta | contradiction_delta | dependency_delta | manual_override | degraded_fail_closed`
* `reasonCodes[]`
* `supersedesAssessmentRef`
* `decidedByRef`
* `decidedAt`

Semantics:

* is the only authority allowed to decide whether newly arrived post-submit evidence must trigger canonical re-safety
* makes the materiality threshold explicit, versioned, and auditable instead of leaving reply handlers, adapter callbacks, support tools, or projection rebuilds to decide locally
* may settle `no_re_safety` only when the new evidence is provably technical-only or operational-nonclinical under the current policy and introduces no safety, chronology, contradiction, or reachability delta

#### 1.8 SafetyPreemptionRecord

Fields:

* `preemptionId`
* `episodeId`
* `requestId`
* `triggeringSnapshotRef`
* `evidenceAssimilationRef`
* `materialDeltaAssessmentRef`
* `classificationDecisionRef`
* `sourceDomain`
* `evidenceClass = technical_metadata | operationally_material_nonclinical | contact_safety_relevant | potentially_clinical`
* `openingSafetyEpoch`
* `blockingActionScopeRefs[]`
* `priority = routine_review | urgent_review | urgent_live`
* `reasonCode`
* `fallbackState = none | manual_review_required | artifact_degraded`
* `status = pending | blocked_manual_review | cleared_routine | escalated_urgent | cancelled | superseded`
* `createdAt`
* `resolvedAt`

Semantics:

* is the only cross-domain blocker for materially meaningful new evidence or reachability risk after `MaterialDeltaAssessment` has determined that re-safety is required
* supports conservative urgent handling even before full evidence normalization is complete
* opens one new `openingSafetyEpoch` so downstream mutation can fence against stale routine posture
* may remain `blocked_manual_review` when degraded artifacts, unreadable payloads, or ambiguous classification prevent a safe automated clear or urgent settlement

#### 1.8A EvidenceClassificationDecision

Fields:

* `classificationDecisionId`
* `requestId`
* `triggeringSnapshotRef`
* `evidenceAssimilationRef`
* `sourceDomain`
* `governingObjectRef`
* `classifiedEvidenceRefs[]`
* `classifierVersionRef`
* `dominantEvidenceClass = technical_metadata | operationally_material_nonclinical | contact_safety_relevant | potentially_clinical`
* `classificationBasis = allow_list | route_dependency | content_signal | manual_review | degraded_fail_closed`
* `triggerReasonCodes[]`
* `activeDependencyRefs[]`
* `confidenceBand = high | medium | low`
* `misclassificationRiskState = ordinary | fail_closed_review | urgent_hold`
* `decisionState = applied | superseded`
* `supersedesDecisionRef`
* `decidedByRef`
* `decidedAt`

Semantics:

* is the only authority allowed to downgrade or upgrade inbound evidence below or above routine workflow significance
* must freeze why evidence was treated as `technical_metadata`, `operationally_material_nonclinical`, `contact_safety_relevant`, or `potentially_clinical` before any routine bypass is allowed
* classifies the evidence batch itself, but it may not by itself decide whether re-safety is skippable; that decision belongs to the paired `MaterialDeltaAssessment`
* must fail closed when parser degradation, unreadable artifacts, incomplete transcripts, or conflicting extractor outputs leave clinical or contact-safety meaning unresolved

#### 1.8B SafetyDecisionRecord

Fields:

* `safetyDecisionId`
* `requestId`
* `preemptionRef`
* `classificationDecisionRef`
* `compositeSnapshotRef`
* `sourceDomain`
* `rulePackVersionRef`
* `calibratorVersionRef`
* `decisionTupleHash`
* `hardStopRuleRefs[]`
* `urgentContributorRuleRefs[]`
* `residualContributorRuleRefs[]`
* `activeReachabilityDependencyRefs[]`
* `conflictVectorRef`
* `criticalMissingnessRef`
* `decisionOutcome = urgent_required | urgent_live | urgent_review | residual_review | clear_routine | fallback_manual_review`
* `requestedSafetyState = urgent_diversion_required | residual_risk_flagged | screen_clear`
* `decisionState = pending_settlement | settled | superseded`
* `resultingSafetyEpoch`
* `supersedesSafetyDecisionRef`
* `decidedAt`
* `settledAt`

Semantics:

* is the only authority allowed to state the current urgent, residual, clear, or fallback-manual-review posture for the lineage
* must pin the exact rule pack, calibrator, contradiction burden, dependency set, and settled outcome that produced the current safety truth
* advances `Request.safetyDecisionEpoch` so late evidence, command replays, and downstream mutations can fail closed against stale routine assumptions

#### 1.8C UrgentDiversionSettlement

Fields:

* `urgentDiversionSettlementId`
* `requestId`
* `preemptionRef`
* `safetyDecisionRef`
* `actionMode = urgent_guidance_presented | live_transfer_started | duty_clinician_escalated | urgent_callback_opened | emergency_service_handoff | manual_follow_up_only`
* `presentationArtifactRef`
* `authoritativeActionRef`
* `settlementState = pending | issued | failed | superseded`
* `supersedesSettlementRef`
* `issuedAt`
* `settledAt`

Semantics:

* separates urgent-required truth from urgent-issued truth
* is mandatory before `Request.safetyState` may move from `urgent_diversion_required` to `urgent_diverted`
* keeps urgent advice, live transfer, callback escalation, and manual fallback issuance auditable rather than implied by route transitions or UI copy

#### 1.8D ContactRouteSnapshot

Fields:

* `contactRouteSnapshotId`
* `subjectRef`
* `routeRef`
* `routeVersionRef`
* `routeKind = sms | voice | email | app_message | postal | practice_endpoint | pharmacy_endpoint`
* `normalizedAddressRef`
* `preferenceProfileRef`
* `verificationCheckpointRef`
* `verificationState = verified_current | verified_stale | unverified | failed | disputed | superseded`
* `demographicFreshnessState = current | stale | disputed`
* `preferenceFreshnessState = current | stale | disputed`
* `sourceAuthorityClass = patient_confirmed | clinician_confirmed | support_captured | imported | derived`
* `supersedesSnapshotRef`
* `createdAt`

Semantics:

* is the frozen authority for one contact-route version; later edits, preference changes, or demographic corrections must mint a new snapshot
* separates route existence from route trustworthiness by carrying verification, demographic freshness, and preference freshness explicitly
* may be referenced by multiple `ReachabilityDependency` rows, but no patient, staff, or support surface may infer current route truth from mutable profile state alone

#### 1.8E ReachabilityObservation

Fields:

* `reachabilityObservationId`
* `reachabilityDependencyRef`
* `contactRouteSnapshotRef`
* `observationClass = transport_ack | delivery_receipt | bounce | no_answer | invalid_route | opt_out | preference_change | demographic_change | verification_success | verification_failure | manual_dispute | manual_confirmed_reachable | manual_confirmed_unreachable`
* `observationSourceRef`
* `observedAt`
* `recordedAt`
* `outcomePolarity = positive | negative | ambiguous`
* `authorityWeight = weak | moderate | strong`
* `evidenceRef`
* `supersedesObservationRef`

Semantics:

* records observed reachability facts without collapsing them into calm route health
* transport acceptance, enqueue success, or outbound send attempts are weak observations only and may not prove reachability on their own
* later contradictory evidence must append a new observation or supersede a provisional one rather than mutating prior observation history

#### 1.8F ReachabilityAssessmentRecord

Fields:

* `reachabilityAssessmentId`
* `reachabilityDependencyRef`
* `governingObjectRef`
* `contactRouteSnapshotRef`
* `consideredObservationRefs[]`
* `priorAssessmentRef`
* `routeAuthorityState = current | stale_verification | stale_demographics | stale_preferences | disputed | superseded`
* `deliverabilityState = confirmed_reachable | uncertain | likely_failed | confirmed_failed`
* `deliveryRiskState = on_track | at_risk | likely_failed | disputed`
* `assessmentState = clear | at_risk | blocked | disputed`
* `falseNegativeGuardState = pass | stale_input | conflicting_signal | insufficient_observation`
* `dominantReasonCode`
* `resultingRepairState = none | repair_required | awaiting_verification | rebound_pending`
* `resultingReachabilityEpoch`
* `assessedAt`

Semantics:

* is the only authority allowed to convert route snapshot plus observed evidence into current dependency posture
* fails closed when verification, demographics, or preference freshness are stale or disputed; those paths may not reuse calm channel priors
* must be append-only by supersession so patient, staff, support, callback, booking, hub, and pharmacy surfaces can all point to the same current dependency truth

#### 1.9 ReachabilityDependency

Fields:

* `dependencyId`
* `episodeId`
* `requestId`
* `domain`
* `domainObjectRef`
* `requiredRouteRef`
* `contactRouteVersionRef`
* `currentContactRouteSnapshotRef`
* `currentReachabilityAssessmentRef`
* `reachabilityEpoch`
* `purpose = callback | clinician_message | more_info | waitlist_offer | alternative_offer | pharmacy_contact | urgent_return | outcome_confirmation`
* `blockedActionScopeRefs[]`
* `selectedAnchorRef`
* `requestReturnBundleRef`
* `resumeContinuationRef`
* `repairJourneyRef`
* `routeAuthorityState = current | stale_verification | stale_demographics | stale_preferences | disputed | superseded`
* `routeHealthState = clear | degraded | blocked | disputed`
* `deliveryRiskState = on_track | at_risk | likely_failed | disputed`
* `repairState = none | repair_required | awaiting_verification | rebound_pending`
* `deadlineAt`
* `failureEffect = escalate | urgent_review | requeue | invalidate_pending_action`
* `state = active | satisfied | expired | superseded`
* `createdAt`
* `updatedAt`

Semantics:

* formalizes when contact-route changes, delivery failures, stale verification, stale demographics, or preference changes are no longer merely operational
* any active dependency can upgrade a delivery or reachability event into a preemption-triggering condition
* current dependency posture may advance only by appending `ReachabilityAssessmentRecord` under the current snapshot; patient, staff, and support shells may consume it, but they may not infer calm health from send success, mutable profile rows, or channel defaults
* when `routeAuthorityState != current`, `routeHealthState != clear`, `deliveryRiskState != on_track`, or `repairState != none`, the dependency is the dominant blocker for the owning patient promise and must resolve through one same-shell repair journey instead of detached settings or generic home recovery

#### 1.9A ContactRouteRepairJourney

Fields:

* `repairJourneyId`
* `reachabilityDependencyRef`
* `governingObjectRef`
* `blockedActionScopeRefs[]`
* `selectedAnchorRef`
* `requestReturnBundleRef`
* `resumeContinuationRef`
* `patientRecoveryLoopRef`
* `blockedAssessmentRef`
* `currentContactRouteSnapshotRef`
* `candidateContactRouteSnapshotRef`
* `verificationCheckpointRef`
* `resultingReachabilityAssessmentRef`
* `journeyState = ready | collecting_route | awaiting_verification | rebound_pending | completed | recovery_required | stale`
* `issuedAt`
* `updatedAt`
* `completedAt`

Semantics:

* is the sole same-shell repair authority for any callback, message, reminder, waitlist, alternative-offer, pharmacy-contact, or admin-resolution promise blocked by a degraded contact route
* must preserve the blocked action summary, current anchor, and return target while repair is active; generic account-settings detours and detached confirmation pages are invalid recovery paths
* ordinary actionability may resume only after the linked verification checkpoint is verified, the resulting reachability assessment is `clear`, the dependency is rebound on the current reachability epoch, and the current return or continuity posture still matches

#### 1.9B ContactRouteVerificationCheckpoint

Fields:

* `checkpointId`
* `repairJourneyRef`
* `contactRouteRef`
* `contactRouteVersionRef`
* `preVerificationAssessmentRef`
* `verificationMethod = otp | link | clinician_verified | existing_verified | policy_exempt`
* `verificationState = pending | verified | failed | expired | superseded`
* `resultingContactRouteSnapshotRef`
* `resultingReachabilityAssessmentRef`
* `rebindState = pending | rebound | blocked`
* `dependentGrantRefs[]`
* `dependentRouteIntentRefs[]`
* `evaluatedAt`

Semantics:

* applied contact edits alone do not reopen blocked callback, reply, reminder, or offer flows
* stale grants, stale route intents, stale return bundles, or a resulting assessment that still reports stale or disputed posture must be rotated or blocked before the owning action may resume
* successful verification must mint a new current `ContactRouteSnapshot` and `ReachabilityAssessmentRecord`; it may not simply toggle an older route row back to healthy

#### 1.10 RequestLifecycleLease

Fields:

* `leaseId`
* `episodeId`
* `requestId`
* `requestLineageRef`
* `domain`
* `domainObjectRef`
* `leaseAuthorityRef`
* `ownerActorRef`
* `ownerSessionRef`
* `ownerWorkerRef`
* `ownershipEpoch`
* `leaseScopeHash`
* `state = active | releasing | released | expired | broken`
* `closeBlockReason`
* `leaseTtlSeconds`
* `heartbeatAt`
* `fencingToken`
* `staleOwnerRecoveryRef`
* `supersededByLeaseRef`
* `acquiredAt`
* `releasedAt`
* `breakEligibleAt`
* `brokenByActorRef`
* `breakReason`

Semantics:

* is a first-class distributed systems primitive, not just a logical flag
* all active workflow objects must acquire, heartbeat, release, and break their lease through one authoritative compare-and-set boundary
* `leaseTtlSeconds` must be sized from observed p99 critical-section duration plus transport and clock-skew guard, not guessed arbitrarily
* `ownershipEpoch` advances monotonically whenever writable ownership changes, including reacquire, release-to-new-owner, and supervisor takeover
* `fencingToken` and `ownershipEpoch` are paired write fences; downstream commands must present both and fail closed if either is stale
* stale-owner fencing and operator-visible recovery are mandatory

#### 1.10A StaleOwnershipRecoveryRecord and LeaseTakeoverRecord

Fields:

* `staleOwnershipRecoveryId`
* `requestId`
* `leaseRef`
* `domain`
* `domainObjectRef`
* `lastOwnershipEpoch`
* `lastFencingToken`
* `detectedAt`
* `detectedByRef`
* `recoveryReason = heartbeat_missed | stale_write_rejected | superseded_reacquire | supervisor_takeover | lineage_drift`
* `blockedActionScopeRefs[]`
* `operatorVisibleWorkRef`
* `sameShellRecoveryRouteRef`
* `resolutionState = open | reacquire_in_progress | takeover_pending | resolved | superseded`
* `resolvedAt`
* `leaseTakeoverRecordId`
* `priorLeaseRef`
* `replacementLeaseRef`
* `fromOwnerRef`
* `toOwnerRef`
* `authorizedByRef`
* `takeoverReason`
* `takeoverState = pending | committed | cancelled`
* `issuedAt`
* `committedAt`
* `cancelledAt`

Semantics:

* lease expiry, stale-write rejection, or supervised takeover must create or update one `StaleOwnershipRecoveryRecord`
* stale-owner recovery is a first-class workflow artifact, not a log-only side effect; shells and workers must degrade to bounded reacquire or takeover posture while it remains open
* supervisor takeover is never a blind overwrite; it must append one `LeaseTakeoverRecord`, mint a fresh `ownershipEpoch` and `fencingToken`, and supersede the prior lease before the new owner may commit

#### 1.11 LineageFence

Fields:

* `fenceId`
* `episodeId`
* `currentEpoch`
* `issuedFor = close | reopen | identity_repair | ownership_change | urgent_preemption | cross_domain_commit`
* `issuedAt`
* `expiresAt`

Semantics:

* any command that changes cross-domain invariants must present the current epoch
* stale-epoch writes must fail and trigger reevaluation rather than silently racing

#### 1.12 RequestClosureRecord

Fields:

* `closureRecordId`
* `episodeId`
* `requestId`
* `requestLineageRef`
* `evaluatedAt`
* `requiredLineageEpoch`
* `blockingLeaseRefs[]`
* `blockingPreemptionRefs[]`
* `blockingApprovalRefs[]`
* `blockingReconciliationRefs[]`
* `blockingConfirmationRefs[]`
* `blockingLineageCaseLinkRefs[]`
* `blockingDuplicateClusterRefs[]`
* `blockingFallbackCaseRefs[]`
* `blockingIdentityRepairRefs[]`
* `blockingGrantRefs[]`
* `blockingReachabilityRefs[]`
* `blockingDegradedPromiseRefs[]`
* `decision = close | defer`
* `closedByMode`
* `deferReasonCodes[]`

#### 1.13 CapacityIdentity

Fields:

* `capacityIdentityId`
* `sourceSystem`
* `sourceSlotRef`
* `scheduleEnvelopeHash`
* `sourceVersion`
* `mutabilityClass = stable | unstable | manual_window`
* `normalizationConfidence = strong | medium | weak`
* `canonicalReservationKey`
* `createdAt`
* `updatedAt`

Semantics:

* `capacityUnitRef` must resolve to a `CapacityIdentity`, not to an underspecified universal slot assumption
* weak or manual identities may support candidate display, but they may not support exclusivity claims or final booked assurance until externally confirmed

#### 1.13A ProviderCapabilityMatrix

Fields:

* `providerCapabilityMatrixId`
* `tenantId`
* `practiceRef`
* `supplierRef`
* `integrationMode`
* `deploymentType`
* `assuranceStateRef`
* `supportedActionScopes[]`
* `selfServiceCapabilityState = live | assisted_only | linkage_required | local_component_required | degraded_manual | blocked`
* `manageCapabilityState = full | partial | summary_only | none`
* `reservationMode = exclusive_hold | truthful_nonexclusive | degraded_manual_pending`
* `authoritativeReadMode = durable_provider_reference | read_after_write | gate_required`
* `requiresGpLinkageDetails`
* `requiresLocalConsumerComponent`
* `searchNormalizationContractRef`
* `revalidationContractRef`
* `manageSupportContractRef`
* `contractVersionRef`
* `contractState = draft | active | superseded | withdrawn`
* `publishedAt`

Semantics:

* `ProviderCapabilityMatrix` is the published static capability row for one supplier, integration mode, deployment type, practice context, and assurance posture
* it declares what operations are possible and which canonical booking-operation contracts they require; it is not itself the live route, UI, or mutation authority
* supplier naming, local flags, and payload shape may not substitute for a current published row when search, waitlist, commit, or manage posture is derived
* changes to reservation semantics, authoritative-read proof class, manage support, or degradation behavior must supersede the row rather than being inferred in worker code

#### 1.13B BookingProviderAdapterBinding

Fields:

* `bookingProviderAdapterBindingId`
* `providerCapabilityMatrixRef`
* `matrixVersionRef`
* `supplierRef`
* `integrationMode`
* `deploymentType`
* `actionScopeSet[]`
* `selectionAudienceSet[]`
* `adapterContractProfileRef`
* `dependencyDegradationProfileRef`
* `searchNormalizationContractRef`
* `temporalNormalizationContractRef`
* `revalidationContractRef`
* `reservationSemantics = exclusive_hold | truthful_nonexclusive | degraded_manual_pending`
* `commitContractRef`
* `authoritativeReadContractRef`
* `manageSupportContractRef`
* `bindingHash`
* `bindingState = live | recovery_only | blocked | superseded`
* `supersedesBindingRef`
* `publishedAt`

Semantics:

* `BookingProviderAdapterBinding` is the canonical booking-provider contract compiled from one current `ProviderCapabilityMatrix` row plus the bound `AdapterContractProfile` and declared degradation profile
* it is the only legal place where search normalization, temporal handling, revalidation, reservation behavior, commit semantics, authoritative read-after-write proof, and manage support are assembled for a supplier context
* adapters may translate and correlate supplier payloads only through this binding; ranking, policy evaluation, waitlist fallback, patient-safe copy, and writable UI meaning remain core-owned
* any change in the capability row, adapter contract, degradation profile, or operation contract supersedes the binding; stale bindings may preserve provenance only and may not keep live booking or manage posture armed

#### 1.14 CapacityReservation

Fields:

* `reservationId`
* `capacityIdentityRef`
* `canonicalReservationKey`
* `sourceDomain`
* `holderRef`
* `state = none | soft_selected | held | pending_confirmation | confirmed | released | expired | disputed`
* `commitMode = exclusive_hold | truthful_nonexclusive | degraded_manual_pending`
* `reservationVersion`
* `activeFencingToken`
* `truthBasisHash`
* `supplierObservedAt`
* `revalidatedAt`
* `expiresAt`
* `confirmedAt`
* `releasedAt`
* `supersededByReservationRef`
* `terminalReasonCode`

Semantics:

* `soft_selected` is focus or offer-selection posture only; it may preserve the active card or row, but it may not imply exclusivity, ownership, or guaranteed capacity
* `released`, `expired`, and `disputed` are terminal for that visible claim; later attempts must advance through a new reservation version or superseding reservation rather than quietly reviving the old one
* any supersession must append `supersededByReservationRef` and `terminalReasonCode`; overwriting one live claim in place is forbidden

#### 1.14A ReservationTruthProjection

Fields:

* `reservationTruthProjectionId`
* `capacityReservationRef`
* `canonicalReservationKey`
* `sourceDomain`
* `sourceObjectRef`
* `selectedAnchorRef`
* `truthState = exclusive_held | truthful_nonexclusive | pending_confirmation | confirmed | disputed | released | expired | revalidation_required | unavailable`
* `displayExclusivityState = exclusive | nonexclusive | none`
* `countdownMode = none | hold_expiry`
* `exclusiveUntilAt`
* `reservationVersionRef`
* `truthBasisHash`
* `projectionFreshnessEnvelopeRef`
* `reasonRefs[]`
* `generatedAt`

Semantics:

* `ReservationTruthProjection` is the sole user-visible authority for reservation language, hold countdowns, and truthful nonexclusive wording on booking, waitlist, hub, and equivalent capacity-claim surfaces
* `displayExclusivityState = exclusive` is legal only while the linked `CapacityReservation.state = held`, `commitMode = exclusive_hold`, the linked `CapacityIdentity` remains strong enough for exclusivity, and `ReservationTruth(r,t) = 1`
* `countdownMode = hold_expiry` is legal only when the linked reservation is actually held and the expiry is the real hold expiry; `OfferSession.expiresAt`, `WaitlistOffer.offerExpiryAt`, client-local timers, or selection TTLs alone may not drive a hold countdown
* `truthState = truthful_nonexclusive` must render explicit live-confirmation semantics; it may preserve the active anchor and CTA, but it may not render reserved-for-you language
* `truthState = pending_confirmation` may preserve the selected capacity claim and explain that the system is confirming the booking, but it may not widen into final booked reassurance without the governing authoritative settlement
* if the linked reservation expires, is released, is superseded, becomes disputed, or fails the current freshness or truth-basis check, the projection must degrade to `released | expired | revalidation_required | unavailable` immediately and suppress stale exclusivity or countdown state in place

#### 1.15 ExternalConfirmationGate

Fields:

* `gateId`
* `episodeId`
* `domain`
* `domainObjectRef`
* `transportMode`
* `assuranceLevel = strong | moderate | weak | manual`
* `evidenceModelVersionRef`
* `requiredHardMatchRefs[]`
* `positiveEvidenceRefs[]`
* `negativeEvidenceRefs[]`
* `proofRefs[]`
* `confirmationDeadlineAt`
* `priorProbability`
* `posteriorLogOdds`
* `confirmationConfidence`
* `competingGateMargin`
* `state = pending | confirmed | expired | disputed | cancelled`
* `createdAt`
* `updatedAt`

Semantics:

* any weak, asynchronous, or manual external handoff must hold one of these gates
* for gate `g`, let `0 < pi_g < 1` be the persisted `priorProbability` under `evidenceModelVersionRef`; for policy-calibrated evidence atoms `e` carrying positive or negative log-likelihood weights `lambda_e`, compute `posteriorLogOdds_g = L_g = log(pi_g / (1 - pi_g)) + sum_{e in E_g^+} lambda_e - sum_{e in E_g^-} lambda_e`
* persist `confirmationConfidence_g = 1 / (1 + exp(-L_g))`
* if multiple open gates compete for the same external object, define `competingGateMargin_g = confirmationConfidence_g - max_{h != g} confirmationConfidence_h`; otherwise persist `competingGateMargin_g = 1`
* `confirmed` requires every required hard match to pass and `confirmationConfidence_g >= tau_confirm` and `competingGateMargin_g >= delta_confirm`
* `pending` applies while required hard matches are incomplete, while corroboration is still being gathered before `confirmationDeadlineAt`, or while `confirmationConfidence_g` stays in `[tau_hold, tau_confirm)`
* `expired` applies when `confirmationDeadlineAt` passes before the gate reaches `tau_hold` or before the required hard-match set is satisfied without contradiction
* `disputed` applies on contradictory evidence, hard-match failure, competing-gate ambiguity, or any manual override that lacks the required independent evidence sources
* weak or manual paths must present independent corroboration from at least two distinct source families before `confirmed` is legal
* no final patient assurance or closure may rely on a weak or manual path without this gate being satisfied or explicitly escalated under policy

#### 1.15A BookingConfirmationTruthProjection

Fields:

* `bookingConfirmationTruthProjectionId`
* `bookingCaseRef`
* `bookingTransactionRef`
* `selectedSlotRef`
* `appointmentRecordRef`
* `externalConfirmationGateRef`
* `commandSettlementRecordRef`
* `latestReceiptCheckpointRef`
* `providerReference`
* `authoritativeProofClass = none | durable_provider_reference | same_commit_read_after_write | reconciled_confirmation`
* `confirmationTruthState = booking_in_progress | confirmation_pending | reconciliation_required | confirmed | failed | expired | superseded`
* `patientVisibilityState = selected_slot_pending | provisional_receipt | booked_summary | recovery_required`
* `manageExposureState = hidden | summary_only | writable`
* `artifactExposureState = hidden | summary_only | handoff_ready`
* `reminderExposureState = blocked | pending_schedule | scheduled`
* `continuityEvidenceRef`
* `truthBasisHash`
* `projectionFreshnessEnvelopeRef`
* `settlementRevision`
* `generatedAt`

Semantics:

* `BookingConfirmationTruthProjection` is the sole audience-safe authority for booking commit outcome posture across patient booking shells, request-detail booking cards, appointment-manage surfaces, reminder and artifact affordances, staff-assisted booking panels, and support or operations booking summaries
* `confirmationTruthState = confirmed` is legal only when the linked `BookingTransaction.authoritativeOutcomeState = booked`, the current `CommandSettlementRecord` agrees, and either a durable provider reference or same-commit read-after-write proof binds to that same transaction lineage; unresolved or contradictory `ExternalConfirmationGate` state keeps the projection non-confirmed
* local acknowledgement, accepted-for-processing, provider 202-style acceptance, transport acceptance, callback arrival without a hard match, detached appointment rows, or stale `AppointmentRecord` presence may widen pending explanation but they may not produce `patientVisibilityState = booked_summary`, `manageExposureState = writable`, `artifactExposureState = handoff_ready`, or `reminderExposureState = scheduled`
* duplicate confirm clicks, refresh re-entry, outbox replay, and callback replay must monotonically advance the same current projection for the active transaction chain; they may not mint competing booked, failed, or provisional narratives for one booking attempt
* `patientVisibilityState = provisional_receipt` may preserve the selected slot, known provider reference, and next-step messaging in the same shell while truth is unresolved, but it may not expose final manage, export, print, calendar, direction, or reminder-complete posture
* if the linked gate expires, becomes disputed, the proof basis drifts, or the transaction lineage is superseded, the projection must degrade immediately to `confirmation_pending | reconciliation_required | recovery_required | failed | expired` posture and keep the last safe slot or appointment anchor visible only as provenance or governed recovery

#### 1.16 PharmacyCorrelationRecord

Fields:

* `correlationId`
* `pharmacyCaseId`
* `packageId`
* `dispatchAttemptId`
* `providerRef`
* `patientRef`
* `serviceType`
* `directorySnapshotRef`
* `providerCapabilitySnapshotRef`
* `dispatchPlanRef`
* `transportMode`
* `transportAssuranceProfileRef`
* `dispatchAdapterBindingRef`
* `dispatchPlanHash`
* `packageHash`
* `outboundReferenceSet`
* `outboundReferenceSetHash`
* `acknowledgementState`
* `confidenceFloor`
* `createdAt`
* `updatedAt`

#### 1.17 VisibilityProjectionPolicy

Fields:

* `policyId`
* `audienceTier`
* `audienceSurface`
* `purposeOfUse`
* `projectionFamilyRef`
* `routeFamilyRefs[]`
* `allowedFields[]`
* `derivedFields[]`
* `prohibitedFields[]`
* `previewVisibility = none | awareness_only | masked_summary | governed_preview`
* `artifactVisibility = not_applicable | awareness_only | summary_only | governed_inline | governed_handoff`
* `summarySafetyTier`
* `minimumNecessaryContractRef`
* `sectionVisibilityContractRefs[]`
* `previewVisibilityContractRefs[]`
* `artifactPresentationContractRefs[]`
* `redactionPolicyRefs[]`
* `mutationAuthority = none | governed_step_up | governed_mutation | break_glass_review_only`
* `actingContextRequirement = forbidden | optional | required`
* `breakGlassMode = forbidden | summary_only | bounded_detail`
* `redactionRules`
* `breakGlassAllowed`
* `consistencyClass = informational_eventual | operational_guarded | command_following`
* `materializationMode = allowlisted_only`
* `placeholderContractRef`
* `policyHash`
* `createdAt`
* `updatedAt`

Semantics:

* minimum-necessary access must be enforced before projection materialization
* one policy row binds an audience tier, audience surface, and purpose of use to one exact projection family, field allow-list, summary safety tier, minimum-necessary contract, preview ceiling, artifact ceiling, and mutation ceiling
* `previewVisibility` and `artifactVisibility` are bundle-level ceilings derived from the referenced preview and artifact contracts; they are not sufficient render authority on their own
* if two audiences, purposes, sections, previews, or artifact modes require different truth shapes, they must materialize distinct contract refs, projection families, or governed placeholders rather than trimming an over-broad payload after assembly
* acting-context elevation and break-glass may only narrow or switch to a separately governed purpose-of-use row; they may not widen a payload already materialized for a lower-trust audience
* UI collapse is cosmetic only and is never a privacy control
* redaction evolution must happen through named policy refs and contract recompilation; route-family conditionals may not silently redefine what a preview, section, or artifact mode reveals

#### 1.17A SectionVisibilityContract

Fields:

* `sectionVisibilityContractId`
* `visibilityPolicyRef`
* `sectionRef`
* `surfaceClass = detail_section | header_meta | chart | table | attachment_stub | related_actions`
* `allowedFields[]`
* `derivedFields[]`
* `prohibitedFields[]`
* `summarySafetyTier`
* `placeholderContractRef`
* `redactionPolicyRef`
* `disclosureMode = hidden | awareness_only | summary_only | bounded_detail | full_detail`
* `payloadMode = omit_payload | placeholder_only | summary_payload | bounded_payload | full_payload`
* `breakGlassMode = forbidden | summary_only | bounded_detail`
* `policyHash`

Semantics:

* section contracts are the smallest independently evolvable units for detail-surface disclosure; a route family may consume them, but it may not redefine them locally
* a section that renders only awareness or summary must not receive hidden full-detail fields and rely on collapse, CSS, or component branching to mask them later
* if one detail route contains sections with materially different disclosure classes, it must resolve multiple section contracts instead of one over-broad body payload

#### 1.17B PreviewVisibilityContract

Fields:

* `previewVisibilityContractId`
* `visibilityPolicyRef`
* `previewRef`
* `previewClass = alert_card | timeline_row | queue_row | receipt_line | communication_preview | digest_tile | notification_stub`
* `allowedFields[]`
* `derivedFields[]`
* `prohibitedFields[]`
* `summarySafetyTier`
* `placeholderContractRef`
* `redactionPolicyRef`
* `disclosureMode = hidden | awareness_only | masked_summary | governed_preview`
* `payloadMode = placeholder_only | summary_payload | preview_payload`
* `breakGlassMode = forbidden | summary_only | bounded_detail`
* `policyHash`

Semantics:

* previews, alerts, timeline rows, queue rows, receipts, and communication snippets are independent disclosure surfaces and may not inherit richer route-detail payloads by default
* if a list row or digest tile needs a stricter summary than its destination route, it must publish a distinct preview contract rather than rendering the destination payload in collapsed form
* preview contracts must be stable and replayable so the same digest can be rebuilt, audited, and regression-tested without depending on transient UI logic

#### 1.17C MinimumNecessaryContract

Fields:

* `minimumNecessaryContractId`
* `audienceTier`
* `audienceSurface`
* `purposeOfUse`
* `requiredSectionContractRefs[]`
* `requiredPreviewContractRefs[]`
* `requiredArtifactContractRefs[]`
* `requiredSummarySafetyTier`
* `awarenessObligationRefs[]`
* `prohibitedDisclosureRefs[]`
* `redactionPolicyRefs[]`
* `contractHash`

Semantics:

* every audience surface must bind one minimum-necessary contract before publication; the contract declares the smallest lawful payload shapes for sections, previews, artifacts, and awareness-only placeholders
* the contract is audience-specific and purpose-of-use-specific; a route family may reference it, but route families must not become the source of truth for disclosure classes
* awareness obligations and prohibited disclosures are first-class: the system must be able to show that work exists without materializing detail that the contract forbids

#### 1.17D AudienceVisibilityCoverage

Fields:

* `audienceVisibilityCoverageId`
* `audienceTier`
* `audienceSurface`
* `purposeOfUse`
* `projectionFamilyRef`
* `routeFamilyRefs[]`
* `artifactSurfaceRefs[]`
* `previewVisibility`
* `artifactVisibility`
* `mutationAuthority`
* `actingContextRequirement`
* `breakGlassMode`
* `minimumNecessaryContractRef`
* `requiredSectionContractRefs[]`
* `requiredPreviewContractRefs[]`
* `requiredArtifactContractRefs[]`
* `requiredRedactionPolicyRefs[]`
* `requiredVisibilityPolicyRef`
* `requiredPlaceholderContractRef`
* `requiredSummarySafetyTier`
* `coverageHash`

Semantics:

* every route family, projection family, timeline preview, receipt, communication digest, artifact surface, and mutation path that can render for an audience tier must resolve one exact coverage row before publication
* coverage rows are the compile-time and runtime matrix consumed by policy compilation, runtime publication, audit, and verification; missing rows are blocking defects, not advisory notes
* a coverage row is incomplete if its minimum-necessary contract, required section contracts, required preview contracts, required artifact contracts, or required redaction policies are missing, stale, or wider than the declared summary tier and disclosure ceilings
* awareness-only visibility is legal only when the row explicitly declares placeholder or summary posture; omission may not hide the existence of blocked work when policy still permits awareness
* governance, operations, support, and break-glass or purpose-of-use overlays must publish separate rows when they require a different field set, section contract, preview snippet, artifact mode, redaction pack, or mutation ceiling

#### 1.18 ProjectionActionSet

Fields:

* `projectionRef`
* `primaryActionRef`
* `blockingSecondaryActionRefs[]`
* `nonBlockingActionRefs[]`
* `pendingDependencyRefs[]`
* `riskDescriptor`
* `awaitedPartyDescriptor`
* `microStateDescriptor`
* `provisionalStateFlag`

Semantics:

* one prioritized action may exist
* multiple simultaneous obligations must remain visible
* the absence of a primary action must not hide blocking secondary actions or pending dependencies

#### 1.19 CompiledPolicyBundle

Fields:

* `bundleId`
* `tenantId`
* `domainPackRefs[]`
* `domainPackHashes`
* `subpackTupleRefs[]`
* `dependencyGraphHash`
* `requiredContinuityControlRefs[]`
* `continuityEvidenceContractRefs[]`
* `releaseContractVerificationMatrixRef`
* `releaseContractMatrixHash`
* `compatibilityState = valid | invalid`
* `simulationEvidenceRef`
* `approvedBy`
* `approvedAt`
* `effectiveAt`
* `canaryScope`
* `rollbackRefs[]`

Semantics:

* is a modular bundle of domain policy packs, not one monolithic indivisible blob
* each domain pack must support independent canary and rollback within declared dependency constraints
* carries an `effectiveAt` boundary that routing, replay, audit, and mutation guards can evaluate explicitly rather than switching policy implicitly mid-flow
* must declare the affected continuity controls, their evidence contracts, and one exact `ReleaseContractVerificationMatrix` so route, frontend, settlement, recovery, and continuity verification can stay pinned to the same candidate tuple from compile onward
* any domain pack that still mixes patient-routing, service-obligation, acknowledgement-visibility, and source-admission law into one opaque object must be rejected at compile time; the bundle must carry explicit subpack tuples where those policy families have different runtime consumers

#### 1.20 FallbackReviewCase

Fields:

* `fallbackCaseId`
* `lineageScope = envelope | request | episode`
* `envelopeId`
* `requestId`
* `triggerClass = ingest_failure | safety_engine_failure | artifact_quarantine | auth_recovery | degraded_dependency`
* `patientVisibleState = draft_recoverable | submitted_degraded | under_manual_review | recovered | closed`
* `manualOwnerQueue`
* `slaAnchorAt`
* `receiptIssuedAt`
* `createdAt`
* `updatedAt`

Semantics:

* preserves accepted user progress when automated ingest, evidence handling, or safety execution cannot safely complete
* must keep the same lineage, public tracking state, and audit chain rather than spawning an unlinked side ticket
* `auth_recovery` here is limited to degraded grant or access recovery after accepted progress; wrong-patient or binding disputes still require `IdentityRepairCase`
* is a closure blocker until the failure has been recovered, superseded by governed manual action, or explicitly closed under policy

#### 1.21 RouteIntentBinding

Fields:

* `routeIntentId`
* `routeFamily`
* `actionScope`
* `governingObjectRef`
* `canonicalObjectDescriptorRef`
* `governingBoundedContextRef`
* `governingObjectVersionRef`
* `lineageScope`
* `routeContractDigestRef`
* `requiredContextBoundaryRefs[]`
* `parentAnchorRef`
* `subjectRef`
* `sessionEpochRef`
* `subjectBindingVersionRef`
* `grantRef`
* `grantFamily`
* `manifestVersionRef`
* `releaseApprovalFreezeRef`
* `minimumBridgeCapabilitiesRef`
* `channelReleaseFreezeState = monitoring | frozen | kill_switch_active | rollback_recommended | released`
* `fenceEpoch`
* `routeIntentTupleHash`
* `bindingState = live | stale | superseded | recovery_only`
* `issuedAt`
* `expiresAt`

Semantics:

* every writable patient, support, staff, hub, pharmacy, operations, or embedded route must bind to exactly one current governing object descriptor, one governing object ref, one governing object version or fence, one route family, one action scope, one parent anchor, one lineage scope, and one access posture
* `governingBoundedContextRef` names the lifecycle owner for the route's authoritative mutation target; feature contributors, observer panels, and sibling workflows may not substitute their own context simply because they launched the route
* `routeIntentTupleHash` is the immutable digest over that exact target tuple; writable actionability may be reconstructed only from this tuple, not from URL params, detached projection fragments, or stale capability tiles
* any route that depends on another context's evidence, preview, recommendation, or gateway translation must name the active `requiredContextBoundaryRefs[]`; hidden sibling-context reach-through is forbidden
* session drift, subject-binding drift, grant supersession, manifest drift, channel freeze, or any mismatch between the current authoritative target tuple and the bound tuple must downgrade the route to recovery or read-only posture rather than leaving stale mutation CTAs live
* legacy or partial route intents that lack `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeContractDigestRef`, `parentAnchorRef`, or `routeIntentTupleHash` are `recovery_only` and must be reissued before writable posture resumes

#### 1.22 CommandActionRecord

Fields:

* `actionRecordId`
* `actionScope`
* `governingObjectRef`
* `canonicalObjectDescriptorRef`
* `initiatingBoundedContextRef`
* `governingBoundedContextRef`
* `governingObjectVersionRef`
* `lineageScope`
* `routeIntentRef`
* `routeContractDigestRef`
* `requiredContextBoundaryRefs[]`
* `parentAnchorRef`
* `routeIntentTupleHash`
* `edgeCorrelationId`
* `initiatingUiEventRef`
* `initiatingUiEventCausalityFrameRef`
* `actingContextRef`
* `policyBundleRef`
* `lineageFenceEpoch`
* `sourceCommandId`
* `transportCorrelationId`
* `semanticPayloadHash`
* `idempotencyKey`
* `idempotencyRecordRef`
* `commandFollowingTokenRef`
* `expectedEffectSetHash`
* `causalToken`
* `createdAt`
* `settledAt`

Semantics:

* `edgeCorrelationId`, `initiatingUiEventRef`, and `initiatingUiEventCausalityFrameRef` make the submitted browser intent, any restored or replayed shell posture, and the persisted command joinable across retries, outbox dispatch, projection apply, and audit review
* `initiatingBoundedContextRef` records which context surface launched the action, while `governingBoundedContextRef` records which context owns the authoritative target; those two may differ only when `requiredContextBoundaryRefs[]` declare the crossing explicitly
* `CommandActionRecord` must be sufficient to reconstruct the exact route-intent tuple and authoritative governing-object target that were proven at write time; settlement, replay, and audit may not infer that target later from mutable projections, route params, or local UI state

#### 1.23 CommandSettlementRecord

Fields:

* `settlementId`
* `actionRecordRef`
* `replayDecisionClass = exact_replay | semantic_replay | distinct | collision_review`
* `result = pending | applied | projection_pending | awaiting_external | stale_recoverable | blocked_policy | denied_scope | review_required | reconciliation_required | failed | expired`
* `processingAcceptanceState = not_started | accepted_for_processing | awaiting_external_confirmation | externally_accepted | externally_rejected | timed_out`
* `externalObservationState = unobserved | projection_visible | external_effect_observed | review_disposition_observed | recovery_observed | disputed | failed | expired`
* `authoritativeOutcomeState = pending | projection_pending | awaiting_external | review_required | stale_recoverable | recovery_required | reconciliation_required | settled | failed | expired | superseded`
* `authoritativeProofClass = not_yet_authoritative | projection_visible | external_confirmation | review_disposition | recovery_disposition`
* `settlementRevision`
* `supersedesSettlementRef`
* `externalEffectRefs[]`
* `sameShellRecoveryRef`
* `projectionVersionRef`
* `uiTransitionSettlementRef`
* `projectionVisibilityRef`
* `auditRecordRef`
* `blockingRefs[]`
* `quietEligibleAt`
* `staleAfterAt`
* `recordedAt`

Semantics:

* every post-submit mutation must write one immutable `CommandActionRecord` and one authoritative `CommandSettlementRecord`
* `result` is the coarse canonical settlement class for replay, routing, and policy. It is intentionally not rich enough to tell the UI whether a user just saw local acknowledgement, accepted-for-processing state, external evidence, or final business settlement.
* `processingAcceptanceState` records whether any server, worker, provider, or external system accepted the command for further work. It may widen pending guidance, but it may not drive calm completion, closure, or quiet success copy on its own.
* `externalObservationState` records what the platform has independently observed on the same action chain, such as projection visibility, provider evidence, review evidence, or recovery evidence. Observation may support truth, but it is not final outcome by itself.
* `authoritativeOutcomeState` is the only settlement dimension allowed to drive calm success, terminal status, closed posture, or next-step reassurance. If this field is not `settled`, the surface must remain pending, review, reconciliation, stale, recovery, or failure-aware even when local feedback, processing acceptance, or external observation already exist.
* `blockingRefs[]` identifies authoritative blockers that must clear before calm or writable posture may return
* `quietEligibleAt` is the earliest instant at which a shell may return to calm success or next-step posture; it is derived from `authoritativeOutcomeState = settled`, required command-following token visibility, and per-surface calm-return policy rather than guessed in the UI
* `staleAfterAt` is the explicit freshness deadline for command-following settlement, not an inferred spinner timeout
* `settlementRevision` and `supersedesSettlementRef` make settlement monotone across retries, callbacks, and deferred confirmation; later authoritative evidence may advance one action from `pending` or `awaiting_external`, but it may not create a competing success chain
* settlement may advance only the immutable action record that already bound one exact route-intent tuple and governing-object target; tuple drift or governing-version drift must open stale recovery and a new action record rather than being folded into the old chain
* `result = applied` is not by itself permission for calm success copy or shell collapse; user-visible completion must still satisfy `authoritativeOutcomeState = settled`, `authoritativeProofClass`, and any required `projectionVisibilityRef`, `sameShellRecoveryRef`, and `auditRecordRef`
* when `result = stale_recoverable | blocked_policy | denied_scope | expired`, `sameShellRecoveryRef` must point to one authoritative patient or operator recovery envelope for the same action chain; route-local error pages, redirects, or detached retry buttons are forbidden substitutes
* the current settlement revision must preserve the last safe anchor, same-shell return target, and allowed summary tier whenever the result remains recoverable; expiry, scope denial, or policy block may suppress writable detail, but they may not erase lineage-safe recovery context
* shells may advance from local acknowledgement only as a temporary bridge; authoritative success, pending, review, stale, reconciliation, or recovery posture must follow `CommandSettlementRecord` or command-following projection truth mapped into `TransitionEnvelope`

#### 1.23A ReplayCollisionReview

Fields:

* `replayCollisionReviewId`
* `idempotencyRecordRef`
* `actionScope`
* `governingLineageRef`
* `existingActionRecordRef`
* `existingSettlementRef`
* `incomingSourceCommandId`
* `incomingTransportCorrelationId`
* `incomingSemanticPayloadHash`
* `incomingEffectSetHash`
* `collisionClass = source_id_reuse | transport_correlation_reuse | idempotency_key_reuse | callback_scope_drift`
* `reviewState = open | resolved_replay | resolved_distinct | resolved_abuse_blocked`
* `createdAt`
* `resolvedAt`

Semantics:

* is the only canonical place to hold reused identifiers that diverge semantically or target the wrong governing scope
* collision review stops automatic mutation, replay acknowledgement, and external dispatch until a human or policy-owned resolution closes the case

#### 1.23B AdapterDispatchAttempt

Fields:

* `dispatchAttemptId`
* `actionRecordRef`
* `adapterContractProfileRef`
* `effectScope`
* `effectKey`
* `transportPayloadHash`
* `semanticPayloadHash`
* `providerCorrelationRef`
* `status = pending | dispatched | transport_acked | awaiting_callback | confirmed | duplicate_accepted | collision_review | failed | superseded`
* `attemptCount`
* `firstDispatchedAt`
* `lastObservedAt`
* `confirmedSettlementRef`

Semantics:

* every externally consequential command must map to exactly one live `AdapterDispatchAttempt` for a given `effectKey`
* worker restarts, duplicate jobs, manual retries, or outbox replays must reuse the live attempt and may not create a second external side effect while the first attempt is still canonical

#### 1.23C AdapterReceiptCheckpoint

Fields:

* `receiptCheckpointId`
* `adapterContractProfileRef`
* `effectKey`
* `providerCorrelationRef`
* `transportMessageId`
* `orderingKey`
* `rawReceiptHash`
* `semanticReceiptHash`
* `decisionClass = accepted_new | exact_replay | semantic_replay | stale_ignored | collision_review`
* `linkedDispatchAttemptRef`
* `linkedSettlementRef`
* `recordedAt`

Semantics:

* is the canonical inbox and callback dedupe checkpoint for adapter-facing acknowledgements, confirmations, and webhooks
* duplicate or out-of-order callbacks may advance the same action's authoritative settlement chain, but they may not create a second domain mutation, second appointment record, second message send, or second closure side effect

#### 1.24 ReleaseApprovalFreeze

Fields:

* `releaseApprovalFreezeId`
* `releaseCandidateRef`
* `governanceReviewPackageRef`
* `standardsDependencyWatchlistRef`
* `compiledPolicyBundleRef`
* `baselineTupleHash`
* `scopeTupleHash`
* `compilationTupleHash`
* `approvalTupleHash`
* `reviewPackageHash`
* `standardsWatchlistHash`
* `artifactDigestSetHash`
* `surfaceSchemaSetHash`
* `bridgeCapabilitySetHash`
* `migrationPlanHash`
* `compatibilityEvidenceRef`
* `approvedBy`
* `approvedAt`
* `freezeState = active | superseded | expired`

Semantics:

* production-facing mutating routes must pin one approved release tuple rather than relying on a floating bundle hash alone
* artifacts, policies, schemas, bridge capabilities, migration posture, immutable baseline, and approval package must promote and roll back as one coherent approval unit
* the freeze must also pin one exact `GovernanceReviewPackage`; release tooling, shells, and gateways may not reconstruct that reviewed package from adjacent tuple members after approval
* the freeze must also pin one exact `StandardsDependencyWatchlist`; compile, approval, and release gates may not reinterpret legacy references, unsupported dependencies, or exceptions from stale side channels after approval
* `baselineTupleHash`, `scopeTupleHash`, `compilationTupleHash`, `approvalTupleHash`, `reviewPackageHash`, and `standardsWatchlistHash` are the machine-checkable proof that the frozen release still matches the exact governance baseline, scope, compiled package, approval bundle, immutable review package, and candidate-bound standards watchlist that were reviewed; promotion, widening, or writable posture may not reuse a `ReleaseApprovalFreeze` once any of those hashes drift

#### 1.24A GovernanceReviewPackage

Fields:

* `governanceReviewPackageId`
* `scopeTokenRef`
* `actingScopeTupleRef`
* `scopeTupleHash`
* `changeEnvelopeRef`
* `baselineSnapshotRef`
* `baselineTupleHash`
* `configWorkspaceContextRef`
* `configCompilationRecordRef`
* `configSimulationEnvelopeRef`
* `standardsDependencyWatchlistRef`
* `communicationsGovernanceWorkspaceRef`
* `communicationsSimulationEnvelopeRef`
* `templatePolicyImpactDigestRef`
* `impactPreviewRef`
* `continuityControlImpactDigestRef`
* `governanceContinuityEvidenceBundleRef`
* `approvalEvidenceBundleRef`
* `releaseApprovalFreezeRef`
* `compiledPolicyBundleRef`
* `releaseWatchTupleRef`
* `watchTupleHash`
* `compilationTupleHash`
* `approvalTupleHash`
* `standardsWatchlistHash`
* `settlementLineageRef`
* `reviewPackageHash`
* `packageState = current | stale | superseded | blocked`
* `assembledAt`

Semantics:

* `GovernanceReviewPackage` is the immutable review unit for governance diff, impact, simulation, standards watchlist, continuity evidence, approval, and release-tuple verification for one exact scope and baseline
* it must be minted from one exact freshness epoch and one exact settlement lineage; config simulation, communications simulation, standards watchlist, continuity impact, approval evidence, and release-freeze verification may not be recomputed independently while the same review package remains open
* every visible governance lane must consume the same `GovernanceReviewPackage`; tuple parity is proof of that package, not a substitute for a missing package object
* any drift in scope, baseline, compiled bundle, standards watchlist, communications candidate, impact digest, continuity evidence, approval bundle, release watch tuple, or authoritative settlement supersedes the package and forces same-shell revalidation or bounded recovery instead of mixing members from different epochs

#### 1.24B StandardsDependencyWatchlist

Fields:

* `standardsDependencyWatchlistId`
* `candidateBundleHash`
* `liveBundleHash`
* `environmentRef`
* `tenantScopeRef`
* `scopeTupleHash`
* `reviewPackageHash`
* `standardsBaselineMapRef`
* `dependencyLifecycleRecordRefs[]`
* `legacyReferenceFindingRefs[]`
* `policyCompatibilityAlertRefs[]`
* `standardsExceptionRecordRefs[]`
* `affectedRouteFamilyRefs[]`
* `affectedTenantScopeRefs[]`
* `affectedSurfaceSchemaRefs[]`
* `affectedLiveChannelRefs[]`
* `affectedSimulationRefs[]`
* `blockingFindingRefs[]`
* `advisoryFindingRefs[]`
* `compileGateState = pass | review_required | blocked`
* `promotionGateState = pass | review_required | blocked`
* `watchlistState = current | stale | superseded | blocked`
* `watchlistHash`
* `generatedAt`

Semantics:

* `StandardsDependencyWatchlist` is the immutable candidate-bound hygiene authority for standards baselines, dependency lifecycle posture, legacy references, compatibility alerts, and approved exceptions
* compile, approval, and release surfaces must consume the same watchlist for one exact `candidateBundleHash`; dashboards, package-manager output, spreadsheets, or stale audit exports are not substitute authority
* every blocking or advisory finding in the watchlist must preserve owner, replacement path, remediation deadline, blast radius, and affected route or simulation refs through the linked source records; warning text without actionable ownership is incomplete evidence
* exceptions may only downgrade or defer findings while the linked `StandardsExceptionRecord` remains approved, time-bounded, and attached to the same candidate and review package; expiry or revocation immediately supersedes the watchlist and reopens the blocked findings

#### 1.24C ReleaseWatchEvidenceCockpit

Fields:

* `releaseWatchEvidenceCockpitId`
* `governanceReviewPackageRef`
* `releaseApprovalFreezeRef`
* `releaseWatchTupleRef`
* `watchTupleHash`
* `runtimePublicationBundleRef`
* `releasePublicationParityRef`
* `waveGuardrailSnapshotRef`
* `waveObservationPolicyRef`
* `waveControlFenceRef`
* `operationalReadinessSnapshotRef`
* `activeWaveActionImpactPreviewRef`
* `activeWaveActionExecutionReceiptRef`
* `activeWaveActionObservationWindowRef`
* `activeWaveActionLineageRef`
* `activeWaveActionSettlementRef`
* `rollbackTargetPublicationBundleRef`
* `rollbackRunbookBindingRefs[]`
* `rollbackReadinessEvidenceRefs[]`
* `governanceContinuityEvidenceBundleRef`
* `governanceEvidencePackArtifactRef`
* `activeChannelFreezeRefs[]`
* `recoveryDispositionRefs[]`
* `previewState = exact | stale | missing`
* `executionState = none | accepted | rejected | deduplicated | stale`
* `observationState = pending | satisfied | constrained | rollback_required | freeze_conflict | stale`
* `rollbackReadinessState = ready | constrained | blocked | stale`
* `cockpitState = active | stale | superseded | closed`
* `cockpitHash`
* `publishedAt`
* `supersededAt`

Semantics:

* `ReleaseWatchEvidenceCockpit` is the single watch and rollback evidence authority for one exact promoted `ReleaseWatchTuple`; governance shells, runtime wave controls, operations handoff, and evidence-pack exports must resolve this cockpit rather than stitching preview, receipt, observation, parity, and rollback facts from separate records
* it must stay bound to the same `GovernanceReviewPackage`, `ReleaseApprovalFreeze`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, `WaveGuardrailSnapshot`, `WaveObservationPolicy`, and `WaveControlFence` that justified the promoted tuple; post-promotion watch may not silently drift onto a different package or publication generation
* `activeWaveActionImpactPreviewRef`, `activeWaveActionExecutionReceiptRef`, `activeWaveActionObservationWindowRef`, `activeWaveActionLineageRef`, and `activeWaveActionSettlementRef` must always describe one causal chain over the same tuple; pause, resume, rollback, rollforward, widen, and kill-switch actions may not branch through hidden dashboards or operator memory
* `executionState = accepted` or `deduplicated` is not live convergence; `observationState = satisfied` and `rollbackReadinessState = ready | constrained` may be published only after the linked observation window, parity, continuity evidence, recovery dispositions, and runbook bindings have all been validated for the same cockpit hash
* rollback posture must remain visible before and after action acceptance through `rollbackTargetPublicationBundleRef`, `rollbackRunbookBindingRefs[]`, and `rollbackReadinessEvidenceRefs[]`; an unbound panic button, stale runbook, or remembered rollback target is invalid
* `cockpitHash` must be derived from at least `reviewPackageHash`, `approvalTupleHash`, `watchTupleHash`, `releasePublicationParityRef`, `waveGuardrailSnapshotRef`, `waveObservationPolicyRef`, `waveControlFenceRef`, `operationalReadinessSnapshotRef`, `activeWaveActionSettlementRef`, `activeWaveActionObservationWindowRef`, `rollbackTargetPublicationBundleRef`, `rollbackRunbookBindingRefs[]`, `rollbackReadinessEvidenceRefs[]`, `activeChannelFreezeRefs[]`, and `recoveryDispositionRefs[]`
* any drift in reviewed package, approved freeze, published runtime bundle, parity, guardrail snapshot, watch tuple, action lineage, rollback evidence, or recovery posture supersedes the cockpit and forces same-shell revalidation or bounded recovery instead of allowing a greener watch surface to persist

#### 1.25 ChannelReleaseFreezeRecord

Fields:

* `channelFreezeId`
* `channelFamily`
* `manifestVersionRef`
* `releaseApprovalFreezeRef`
* `minimumBridgeCapabilitiesRef`
* `channelState = monitoring | frozen | kill_switch_active | rollback_recommended | released`
* `effectiveAt`
* `updatedAt`

Semantics:

* embedded or channel-specific write access must validate the active channel freeze record before revealing mutable posture
* frozen, kill-switched, or bridge-incompatible channels may preserve continuity, but they must fail closed to supported browser handoff, read-only posture, or governed recovery

#### 1.26 AssuranceSliceTrustRecord

Fields:

* `sliceTrustId`
* `sliceNamespace`
* `producerScopeRef`
* `trustState = trusted | degraded | quarantined | unknown`
* `completenessState = complete | partial | blocked`
* `reasonCode`
* `trustScore`
* `trustLowerBound`
* `freshnessScore`
* `coverageScore`
* `lineageScore`
* `replayScore`
* `consistencyScore`
* `hardBlockState`
* `blockingProducerRefs[]`
* `blockingNamespaceRefs[]`
* `evaluationModelRef`
* `evaluationInputHash`
* `evidenceRef`
* `effectiveAt`
* `reviewDueAt`
* `updatedAt`

Semantics:

* trust is assessed per assurance slice or producer scope, not as a single global platform switch
* let `F_s = exp(-max(0, lagMs_s - lagBudgetMs_s) / tau_s)` be the freshness score for slice `s`
* let `C_hat_s = sum_r w_r * 1[present_r and valid_r] / sum_r w_r` over the required evidence rules `r` for the slice
* let `n_eff = (sum_r w_r)^2 / max(1e-6, sum_r w_r^2)` and `LB(p, n, z) = (p + z^2/(2n) - z * sqrt(p(1-p)/n + z^2/(4n^2))) / (1 + z^2/n)` be the Wilson lower bound used for weighted completeness, lineage, replay, and consistency ratios
* derive `C_s^-`, `L_s^-`, `R_s^-`, and `X_s^-` from that bound for completeness, lineage, replay, and cross-slice consistency respectively
* compute `trustScore_s = exp(sum_k alpha_k * ln(max(1e-6, q_{s,k})))` from point scores and `trustLowerBound_s = exp(alpha_F * ln(max(1e-6, F_s)) + alpha_C * ln(max(1e-6, C_s^-)) + alpha_L * ln(max(1e-6, L_s^-)) + alpha_R * ln(max(1e-6, R_s^-)) + alpha_X * ln(max(1e-6, X_s^-)))`, with `sum_k alpha_k = 1`
* set `hardBlockState = true` on schema incompatibility, missing mandatory evidence, failed hash or lineage verification, failed redaction parity, replay divergence on command-following projections, or quarantined mandatory producers
* `unknown` applies before the first successful evaluation on the current model version or whenever required evaluation inputs are unavailable under policy
* `trusted` is eligible only when `hardBlockState = false`, `trustLowerBound >= 0.85`, and `completenessState = complete`; later operational promotion rules may impose stricter hysteresis around that floor
* `degraded` is the only truthful state for bounded diagnostic posture when `0.40 <= trustLowerBound < 0.85` or completeness is partial
* `quarantined` is mandatory when `hardBlockState = true`, `completenessState = blocked`, or `trustLowerBound < 0.40`
* `degraded` slices may remain diagnostically visible, but they may not drive authoritative supply, dispatch, assistive writeback, or promotion truth; `quarantined` slices may not drive operational decisions at all

#### 1.26A ReleaseTrustFreezeVerdict

Fields:

* `releaseTrustFreezeVerdictId`
* `audienceSurface`
* `routeFamilyRef`
* `releaseApprovalFreezeRef`
* `releaseWatchTupleRef`
* `waveGuardrailSnapshotRef`
* `runtimePublicationBundleRef`
* `releasePublicationParityRef`
* `requiredChannelFreezeRefs[]`
* `requiredAssuranceSliceTrustRefs[]`
* `provenanceConsumptionState = publishable | blocked | withdrawn`
* `surfaceAuthorityState = live | diagnostic_only | recovery_only | blocked`
* `calmTruthState = allowed | suppressed`
* `mutationAuthorityState = enabled | governed_recovery | observe_only | blocked`
* `governingRecoveryDispositionRef`
* `blockerRefs[]`
* `evaluatedAt`

Semantics:

* `ReleaseTrustFreezeVerdict` is the single machine-readable verdict that joins release freeze, channel freeze, assurance trust, watch-tuple generation, parity, and provenance into one authority contract for one audience surface and route family
* runtime gateways, shells, operations boards, governance handoff flows, and assurance or resilience workbenches may not reconstruct live authority from raw `ReleaseApprovalFreeze`, `ChannelReleaseFreezeRecord`, `AssuranceSliceTrustRecord`, `WaveGuardrailSnapshot`, or parity fragments once this verdict exists
* `surfaceAuthorityState = live` is legal only when the linked release freeze is still `active`, the release watch tuple is `active`, the guardrail snapshot is `green`, parity is `exact`, provenance remains `publishable`, every required channel freeze is not `frozen | kill_switch_active | rollback_recommended`, and every required assurance slice is `trusted` with `completenessState = complete`
* `surfaceAuthorityState = diagnostic_only` is mandatory when no hard freeze is active but any required assurance slice is merely `degraded`, the guardrail snapshot is `constrained`, or the governing watch tuple is still exact enough for bounded diagnostics but not for calm live or writable posture
* `surfaceAuthorityState = recovery_only` is mandatory when parity drifts, publication becomes stale or withdrawn, a required channel freeze becomes active, the guardrail snapshot is `frozen | rollback_review_required`, or the governing recovery route is the only safe posture that may still preserve shell continuity
* `surfaceAuthorityState = blocked` is mandatory when required verdict inputs are missing, contradictory, stale beyond policy, or lack one published bounded recovery path
* `calmTruthState = allowed` is legal only while `surfaceAuthorityState = live`; degraded trust, constrained guardrails, active freezes, or stale tuples must suppress calm success, healthy-empty, and stable-ready language even if the last local projection looked green
* `mutationAuthorityState = enabled` is legal only while `surfaceAuthorityState = live`; `diagnostic_only`, `recovery_only`, and `blocked` verdicts may explain, observe, or route to governed recovery, but they may not arm authoritative actions

#### 1.27 PatientNavUrgencyDigest

Fields:

* `digestId`
* `subjectRef`
* `audienceTier`
* `homeSurfaceRef`
* `activeEntityContinuityKey`
* `patientShellConsistencyRef`
* `spotlightDecisionRef`
* `decisionUseWindowRef`
* `governingSettlementRef`
* `selectedCapabilityLeaseRef`
* `selectedWritableEligibilityFenceRef`
* `settlementState = actionable | pending | recovery_required | read_only`
* `highestUrgencyRef`
* `awaitedPartyDescriptor`
* `returnContractRef`
* `continuityEvidenceRef`
* `continuityValidationState = live | degraded | blocked`
* `releaseApprovalFreezeRef`
* `channelReleaseFreezeRef`
* `releaseTrustFreezeVerdictRef`
* `selectionTupleHash`
* `generatedAt`

Semantics:

* patient home, spotlight, record, and notification entry points must derive actionability from one authoritative digest rather than from page-local heuristics
* the digest must remain bound to the current `PatientShellConsistencyProjection`, active `entityContinuityKey`, current `PatientSpotlightDecisionProjection`, and `PatientNavReturnContract`; patient CTA truth may not be recomputed independently by the launching card, row, tile, or home-card refresh order
* `settlementState = actionable` is legal only while the linked `PatientSpotlightDecisionProjection.decisionState = live`, the selected capability lease is still live, the linked `WritableEligibilityFence` is still writable, and the current `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live`
* when the same governing patient object is still active, the digest must preserve or refresh the same return contract rather than swapping the patient to a fresh section or shell target
* if settlement, release, channel, trust, or continuity posture drifts, the digest must hold or downgrade the CTA in place rather than leaving stale navigation live
* if the spotlight remains the same but writable posture degrades, `selectionTupleHash` may stay stable while the digest falls to `pending | recovery_required | read_only`; home calmness may not be re-inferred from a fresher but weaker local card payload

#### 1.27A PatientSpotlightDecisionProjection

Fields:

* `patientSpotlightDecisionProjectionId`
* `subjectRef`
* `homeSurfaceRef`
* `patientShellConsistencyRef`
* `candidateDigestRefs[]`
* `candidateSetHash`
* `currentSpotlightEntityContinuityKey`
* `selectedEntityContinuityKey`
* `selectedAnchorRef`
* `selectedCapabilityLeaseRef`
* `selectedWritableEligibilityFenceRef`
* `selectedReleaseTrustFreezeVerdictRef`
* `selectedContinuityEvidenceRef`
* `selectedReturnContractRef`
* `quietHomeDecisionRef`
* `decisionTier = urgent_safety | patient_action | dependency_repair | watchful_attention | quiet_home`
* `decisionUseWindowRef`
* `hysteresisPolicyRef`
* `selectionTupleHash`
* `decisionState = live | pinned_pending | pinned_recovery | read_only | quiet_home | blocked`
* `computedAt`
* `staleAt`

Semantics:

* is the only authority for which patient entity owns the home spotlight; request, booking, callback, message, record, repair, and consent projections may contribute candidate digests, but they may not promote themselves directly into spotlight position
* every candidate digest must be materialized under the same current `PatientShellConsistencyProjection`, `VisibilityProjectionPolicy`, `ReleaseTrustFreezeVerdict`, and `ExperienceContinuityControlEvidence(controlCode = patient_nav)` family before it can participate in ranking
* spotlight ranking must be lexicographic by decision tier, blocker severity, patient-owed action, active dependency failure, authoritative due time, latest meaningful update, and stable entity reference; weighted-sum or freshness-only promotion is forbidden
* the selected spotlight may change immediately only when a challenger wins on a higher decision tier or an explicit superseding trigger invalidates the current decision; same-tier freshness churn must not rotate the spotlight while the linked use window is still live
* the spotlight CTA must come from `selectedCapabilityLeaseRef` and `selectedWritableEligibilityFenceRef` bound to the selected entity; home may not pair one entity's card with another entity's action or a global optimistic shortcut
* if the selected entity remains the same while settlement or trust posture worsens, the card must stay pinned in place and degrade through `decisionState = pinned_pending | pinned_recovery | read_only` instead of vanishing or switching to a fresher optimistic entity
* `decisionState = quiet_home` is legal only when `quietHomeDecisionRef` is eligible under the current shell, trust, and continuity posture

#### 1.27B PatientSpotlightDecisionUseWindow

Fields:

* `patientSpotlightDecisionUseWindowId`
* `subjectRef`
* `patientShellConsistencyRef`
* `selectedEntityContinuityKey`
* `candidateSetHash`
* `enteredAt`
* `revalidateAt`
* `expiresAt`
* `supersedingTriggerRefs[]`
* `windowState = live | revalidate_only | expired | superseded`

Semantics:

* is the hysteresis contract that keeps home spotlight selection from oscillating on projection freshness churn alone
* while `windowState = live`, same-tier or lower-tier challengers may refresh summary content but they may not replace the selected entity
* `windowState = superseded` is mandatory immediately on safety escalation, identity-hold onset, trust or freeze drift, continuity block, capability-lease invalidation, or explicit patient navigation away from the owning shell
* quiet-home may be entered only after the current window expires or is superseded and the replacement evaluation still proves that no candidate outranks the quiet threshold

#### 1.27C PatientQuietHomeDecision

Fields:

* `patientQuietHomeDecisionId`
* `subjectRef`
* `patientShellConsistencyRef`
* `eligibilityGateRef`
* `supportingCandidateDigestRefs[]`
* `highestSuppressedTier = none | watchful_attention | quiet_only`
* `gentleNextActionRef`
* `blockedByRecoveryRefs[]`
* `decisionState = eligible | recovery_only | blocked`
* `computedAt`

Semantics:

* is the only authority for rendering calm quiet-home posture when no patient entity currently outranks the quiet threshold
* quiet-home may not be inferred from an empty feed, missing projection, or temporarily absent candidate set; the decision must explicitly prove that there is no higher-tier repair, recovery, or patient-owed action waiting
* if blocked contact repair, consent renewal, delivery dispute, delayed release, embedded freeze, or read-only recovery still dominates, `decisionState = recovery_only | blocked` must promote that repair or recovery path instead of dashboard filler
* quiet-home must preserve one gentle next step and explain why the surface is quiet now without implying that the shell is stale-free or fully writable

#### 1.28 PatientNavReturnContract

Fields:

* `returnContractId`
* `subjectRef`
* `sectionRef`
* `originRouteIntentRef`
* `originRouteFamilyRef`
* `originContinuityKey`
* `patientShellConsistencyRef`
* `originSpotlightDecisionRef`
* `originSelectionTupleHash`
* `decisionUseWindowRef`
* `selectedAnchorRef`
* `expandedDisclosureRef`
* `filterStateRef`
* `scrollStateRef`
* `surfacePostureFrameRef`
* `returnTargetRef`
* `governingSettlementRef`
* `continuityEvidenceRef`
* `recoveryContinuationRef`
* `staleDisposition = same_shell_recover | read_only_return | recovery_only_return | full_reselect`
* `issuedAt`
* `expiresAt`

Semantics:

* a patient route entered from home, spotlight, records, or messages must preserve an authoritative return path to the same shell family until the initiating task settles or expires
* the return contract is the authoritative same-shell return bundle for section, anchor, disclosure, filter, scroll, and last-safe posture; browser history, alias routes, or local cache may not substitute for it
* home- or section-entry routes launched from spotlight must preserve the originating spotlight decision tuple so same-shell return can restore the same card anchor and downgrade that card in place if the tuple is no longer live
* when continuity evidence, settlement truth, or shell consistency drifts, the same contract must degrade to `same_shell_recover | read_only_return | recovery_only_return` rather than falling back to generic home, list default, or detached success handling
* return behavior may not silently fall back to a generic home refresh when a governed recovery or read-only return is required

#### 1.29 RecordActionContextToken

Fields:

* `recordActionContextId`
* `subjectRef`
* `recordRef`
* `recordVersionRef`
* `sourceRouteIntentRef`
* `sourceRouteFamilyRef`
* `governingObjectRef`
* `shellContinuityKey`
* `returnContractRef`
* `selectedAnchorRef`
* `oneExpandedItemGroupRef`
* `visibilityEnvelopeRef`
* `releaseGateRef`
* `stepUpCheckpointRef`
* `summarySafetyTier`
* `artifactPresentationContractRef`
* `continuityEvidenceContractRef`
* `experienceContinuityEvidenceRefs[]`
* `recordOriginContinuationRef`
* `continuationTokenRef`
* `issuedAt`
* `expiresAt`

Semantics:

* any record-origin action that can escalate into booking, callback, messaging, request-detail repair, artifact recovery, or governed handoff must carry the originating record anchor, expanded group, release gate, and visibility fence explicitly
* step-up, release drift, or recovery may pause the action, but they may not discard the originating record context, nearest safe return, or the continuity evidence that made the action safe to launch

#### 1.29A RecordOriginContinuationEnvelope

Fields:

* `recordOriginContinuationId`
* `recordActionContextRef`
* `recoveryContinuationTokenRef`
* `subjectRef`
* `recordRef`
* `recordVersionRef`
* `sourceRouteFamilyRef`
* `targetRouteFamilyRef`
* `selectedAnchorRef`
* `oneExpandedItemGroupRef`
* `visibilityEnvelopeRef`
* `releaseGateRef`
* `stepUpCheckpointRef`
* `summarySafetyTier`
* `artifactPresentationContractRef`
* `returnContractRef`
* `requestReturnBundleRef`
* `continuityEvidenceContractRef`
* `experienceContinuityEvidenceRefs[]`
* `continuationState = armed | consumed | stale | blocked | recovery_only | returned`
* `issuedAt`
* `expiresAt`
* `usedAt`
* `returnedAt`

Semantics:

* is the only legal bridge from a result, document, letter, or other record item into booking, messaging, callback, request-detail recovery, or artifact recovery flow
* binds the exact record version, release gate, visibility envelope, step-up checkpoint, selected anchor, expanded group, and continuity evidence into one continuation witness so downstream routes cannot reconstruct their own calmer context from stale params or local cache
* may reopen writable or calmly trustworthy child posture only while the linked record fence and continuity evidence still match; otherwise the child route must degrade to bounded recovery and return to the same record shell

#### 1.30 RecoveryContinuationToken

Fields:

* `continuationTokenId`
* `lineageScope`
* `routeFamily`
* `routeIntentRef`
* `resumeObjectRef`
* `recordActionContextRef`
* `recordOriginContinuationRef`
* `returnContractRef`
* `patientShellConsistencyRef`
* `shellContinuityKey`
* `restoreSectionRef`
* `surfacePostureFrameRef`
* `sessionEpochRef`
* `recordVersionRef`
* `selectedAnchorRef`
* `oneExpandedItemGroupRef`
* `recordReleaseGateRef`
* `recordVisibilityEnvelopeRef`
* `releaseApprovalFreezeRef`
* `channelReleaseFreezeRef`
* `requestReturnBundleRef`
* `patientActionRecoveryEnvelopeRef`
* `summarySafetyTier`
* `continuityEvidenceContractRef`
* `experienceContinuityEvidenceRefs[]`
* `recoveryReasonCode`
* `recoveryTupleHash`
* `issuedAt`
* `expiresAt`

Semantics:

* recovery after step-up, session drift, embedded downgrade, or release drift must resume through one governed continuation token, not by replaying stale route params or client cache
* the token must carry the active same-shell return contract, last safe posture, and selected anchor so recovery can reopen the owning patient shell rather than a generic section landing
* when the interrupted flow is a stale, expired, denied-scope, or blocked-policy patient action, the token must also carry the current `PatientActionRecoveryEnvelope` and any `PatientRequestReturnBundle` so secure-link, authenticated, embedded, and child-route recovery can reopen the same bounded shell state without re-deriving context from the entry channel
* continuation may restore the current shell only while lineage, route, settlement, freeze posture, the linked `PatientShellConsistencyProjection`, and any linked `RecordOriginContinuationEnvelope` still match the bound record context and continuity evidence

#### 1.30A PatientActionRecoveryEnvelope

Fields:

* `patientActionRecoveryEnvelopeId`
* `actionRecordRef`
* `settlementRef`
* `routeIntentRef`
* `governingObjectRef`
* `canonicalObjectDescriptorRef`
* `entryChannelRef = secure_link | authenticated | embedded | deep_link | child_route`
* `subjectRef`
* `audienceTier`
* `identityBindingRef`
* `subjectBindingVersionRef`
* `sessionEpochRef`
* `returnContractRef`
* `requestReturnBundleRef`
* `recoveryContinuationRef`
* `selectedAnchorRef`
* `surfacePostureFrameRef`
* `lastSafeSummaryRef`
* `summarySafetyTier`
* `recoveryReasonCode`
* `blockedActionRef`
* `nextSafeActionRef`
* `sameShellRecoveryState = live_recovery | read_only_recovery | blocked`
* `recoveryTupleHash`
* `issuedAt`

Semantics:

* is the only patient-facing authority for stale, expired, denied-scope, blocked-policy, or otherwise recoverable action posture once a live CTA or route has drifted
* secure-link, authenticated, embedded, deep-link, and child-route entry paths must all resolve the same stale-action reason, preserved summary, selected anchor, and next safe action from this envelope when they are recovering the same underlying action chain
* the envelope may preserve only the last safe summary that is still legal for the current audience tier, identity binding, and visibility posture; it may not leak PHI simply because the original route was richer
* ordinary calm or writable posture may return only after typed routing, the current `RouteIntentBinding`, any `PatientRequestReturnBundle`, the current shell-consistency projection, and any linked continuity evidence all revalidate against the same governing object chain; local acknowledgement, stale params, or browser history are insufficient

#### 1.31 PatientConversationPreviewDigest

Fields:

* `digestId`
* `clusterRef`
* `patientShellConsistencyRef`
* `visibilityProjectionRef`
* `audienceTier`
* `latestReceiptEnvelopeRef`
* `latestSettlementRef`
* `latestCallbackStatusRef`
* `reachabilityAssessmentRef`
* `reachabilityEpoch`
* `unreadCount`
* `replyNeededState`
* `awaitingReviewState`
* `repairRequiredState`
* `deliveryRiskState = on_track | at_risk | likely_failed | disputed`
* `authoritativeOutcomeState = awaiting_delivery_truth | awaiting_reply | callback_scheduled | awaiting_review | reviewed | settled | recovery_required`
* `stateConfidenceBand = high | medium | low`
* `dominantNextActionRef`
* `placeholderContractRef`
* `experienceContinuityEvidenceRef`
* `receiptGrammarVersionRef`
* `monotoneRevision`
* `computedAt`

Semantics:

* conversation list rows, thread mastheads, reminder rows, and typed subthread affordances must derive unread, reply-needed, review, repair, and calmness posture from one typed conversation receipt grammar: the current `ConversationThreadProjection`, currently selected `ConversationSubthreadProjection`, current `PatientCommunicationVisibilityProjection`, latest `PatientReceiptEnvelope`, latest `ConversationCommandSettlement`, latest `PatientCallbackStatusProjection`, and current `PatientExperienceContinuityEvidenceProjection(controlCode = conversation_settlement)`
* if preview text exceeds the current audience tier or step-up posture, the digest must preserve the cluster and render a governed placeholder rather than hiding the work item or leaking richer text than policy allows
* unread, `replyNeededState`, `awaitingReviewState`, `repairRequiredState`, `reviewed`, and `settled` posture may advance only when the receipt-grammar tuple agrees on the current `receiptGrammarVersionRef` and `monotoneRevision`; local draft state, scroll position, transport acceptance, or transient delivery callbacks are not valid substitutes
* the digest may not appear calmer than the bound `ReachabilityAssessmentRecord` or the linked `experienceContinuityEvidenceRef`; stale-verification, stale-demographic, stale-preference, disputed, degraded, or blocked posture must surface as pending, repair, or recovery guidance instead of quiet sendability
* `dominantNextActionRef` must resolve from the current repair, review, callback, typed subthread, and settlement truth for the active cluster, not from whichever child surface refreshed last

#### 1.32 PatientReceiptEnvelope

Fields:

* `envelopeId`
* `clusterRef`
* `patientShellConsistencyRef`
* `visibilityProjectionRef`
* `audienceTier`
* `governingCommandRef`
* `placeholderContractRef`
* `localAckState = none | shown | superseded`
* `transportAckState = none | accepted | rejected | timed_out`
* `deliveryEvidenceState = pending | delivered | failed | disputed | expired | suppressed`
* `reachabilityAssessmentRef`
* `reachabilityEpoch`
* `deliveryRiskState = on_track | at_risk | likely_failed | disputed`
* `authoritativeOutcomeState = awaiting_delivery_truth | awaiting_reply | callback_scheduled | awaiting_review | reviewed | settled | recovery_required`
* `stateConfidenceBand = high | medium | low`
* `settlementRef`
* `experienceContinuityEvidenceRef`
* `receiptGrammarVersionRef`
* `causalToken`
* `monotoneRevision`
* `issuedAt`

Semantics:

* patient-visible communication rows may not infer delivered, opened, callback-complete, reviewed, or settled state from local acknowledgement or transport acknowledgement alone
* `localAckState`, `transportAckState`, `deliveryEvidenceState`, callback truth, and `authoritativeOutcomeState` must remain distinguishable inside the same receipt envelope so provisional progress can appear without collapsing into false final reassurance
* `deliveryEvidenceState = delivered` requires current delivery evidence for the active fence epoch; probabilistic risk may widen pending or repair copy, but it may not manufacture success
* receipt calmness is bounded by the current `ReachabilityAssessmentRecord`, `visibilityProjectionRef`, and linked `experienceContinuityEvidenceRef`; if route authority, visibility, or continuity posture is stale, disputed, degraded, or blocked, local acknowledgement and older delivery evidence must fail closed to pending, repair, placeholder, or recovery posture
* when visibility, delivery truth, or continuity posture is partial or delayed, the receipt envelope must preserve safe summary, placeholder, and recovery posture instead of dropping the item, over-revealing detail, or rolling the shell back to calm success

#### 1.33 ConversationCommandSettlement

Fields:

* `conversationSettlementId`
* `actionRecordRef`
* `clusterRef`
* `latestReceiptEnvelopeRef`
* `latestCallbackStatusRef`
* `visibilityProjectionRef`
* `result = accepted_in_place | review_pending | awaiting_external | repair_required | stale_recoverable | blocked_policy | denied_scope | expired`
* `localAckState = none | shown | superseded`
* `transportState = local_only | provider_accepted | provider_rejected | timed_out`
* `externalObservationState = unobserved | delivered | answered | failed | disputed | expired`
* `authoritativeOutcomeState = awaiting_external | awaiting_reply | callback_scheduled | awaiting_review | reviewed | settled | recovery_required`
* `stateConfidenceBand = high | medium | low`
* `sameShellRecoveryRef`
* `experienceContinuityEvidenceRef`
* `receiptGrammarVersionRef`
* `causalToken`
* `monotoneRevision`
* `recordedAt`

Semantics:

* thread reply, callback response, and similar patient conversation actions must persist one authoritative settlement distinct from local composer acknowledgement
* settlement must reconcile only events bound to the current dispatch or attempt fence; stale-fence events are ignored, and contradictory same-fence terminal evidence resolve to `externalObservationState = disputed` rather than optimistic success
* shells may show provisional local acknowledgement or transport acceptance, but they may not collapse to calm success until the current settlement, callback status, visibility posture, and linked continuity evidence all permit it
* if `receiptGrammarVersionRef` or `monotoneRevision` drifts across settlement, receipt, callback status, or preview digest, the shell must freeze mutating controls and reopen the same cluster through bounded recovery rather than replaying outdated reassurance

#### 1.33A Conversation receipt grammar

Use this derivation law for message-list rows, thread mastheads, callback cards, and patient reply affordances:

1. resolve the current `PatientCommunicationVisibilityProjection` and current `PatientExperienceContinuityEvidenceProjection(controlCode = conversation_settlement)` for the active cluster before rendering any preview, receipt, callback, or composer state
2. bind the latest unsuperseded `PatientReceiptEnvelope`, latest `ConversationCommandSettlement`, latest `PatientCallbackStatusProjection`, current `ReachabilityAssessmentRecord`, current `PatientComposerLease`, current `ConversationThreadProjection`, and the currently selected `ConversationSubthreadProjection` to the same `threadId`, `clusterRef`, `selectedAnchorRef`, `reachabilityEpoch`, `receiptGrammarVersionRef`, and nondecreasing `monotoneRevision`
3. derive `replyNeededState`, `awaitingReviewState`, `repairRequiredState`, `deliveryRiskState`, `authoritativeOutcomeState`, and `dominantNextActionRef` only from that tuple; local draft state, transient provider callbacks, scroll position, or toast acknowledgement are forbidden inputs
4. if preview text or receipt detail cannot be shown at the current audience tier, render the same cluster through `placeholderContractRef` with safe next-step guidance; a live work item may not disappear simply because richer content is hidden
5. permit calm `reviewed` or `settled` posture only when visibility permits the surface, continuity evidence is current, no repair or diversion is active, and the authoritative outcome from the current settlement or callback status supports that posture
6. if step-up, link expiry, identity hold, route repair, or stale-cluster recovery interrupts the flow, preserve the same selected anchor, typed subthread, and composer draft, issue or consume `RecoveryContinuationToken`, and reopen the same cluster rather than a generic inbox or fresh composer

#### 1.34 SupportReplayRestoreSettlement

Fields:

* `restoreSettlementId`
* `replaySessionRef`
* `replayCheckpointRef`
* `replayEvidenceBoundaryRef`
* `supportTicketRef`
* `supportLineageBindingRef`
* `supportLineageBindingHash`
* `primaryScopeMemberRef`
* `targetWorkObjectRef`
* `restoreSource = replay_exit | observe_return | deep_link_restore | transfer_return`
* `currentMaskScopeRef`
* `routeIntentTupleHash`
* `selectedAnchorRef`
* `selectedAnchorTupleHash`
* `checkpointHash`
* `boundaryHash`
* `draftHoldRef`
* `latestMutationAttemptRef`
* `latestActionSettlementRef`
* `draftRestoreState = resumed | summary_only_hold | discarded`
* `pendingExternalState = none | awaiting_external | disputed`
* `continuityValidationState = trusted | degraded | stale | blocked`
* `result = live_restored | awaiting_external_hold | stale_reacquire | read_only_recovery | escalate_recovery`
* `requiredRevalidationRefs[]`
* `latestSettlementRef`
* `continuityEvidenceRef`
* `recordedAt`

Semantics:

* support replay exit, observe return, and governed support re-entry are restores, not shortcuts back into live mutation
* `result = live_restored` is legal only when the current route-intent tuple, selected anchor tuple, replay checkpoint hash, evidence-boundary hash, current mask scope, current `SupportLineageBinding`, held-draft disposition, latest mutation or settlement chain, and continuity evidence all reconcile to the same support-ticket anchor and the same actionable scope member
* held drafts remain outside replay proof and may re-enter live mutation only when `draftRestoreState = resumed`; otherwise they must remain summary-only or be explicitly discarded through governed recovery
* until restore reaches `result = live_restored`, the shell must remain in awaiting-external, stale reacquire, read-only, or escalation recovery posture with explicit revalidation steps
* restore posture must prove the current mask scope, selected anchor, replay evidence boundary, and latest continuity evidence before writable controls re-arm

#### 1.34A SupportLineageBinding

Fields:

* `supportLineageBindingId`
* `supportTicketRef`
* `subjectRef`
* `primaryRequestLineageRef`
* `primaryLineageCaseLinkRef`
* `primaryScopeMemberRef`
* `governingObjectDescriptorRef`
* `governingObjectRef`
* `governingObjectVersionRef`
* `scopeMemberRefs[]`
* `sourceLineageRefs[]`
* `sourceThreadRefs[]`
* `sourceArtifactRefs[]`
* `maskScopeRef`
* `disclosureCeilingRef`
* `bindingHash`
* `supersedesSupportLineageBindingRef`
* `bindingState = active | stale | superseded | closed`
* `createdAt`
* `supersededAt`

Semantics:

* is the sole canonical join between one `SupportTicket` and the underlying current request lineage, child case links, governing object, thread context, and visible artifact scope
* every support projection, action lease, mutation attempt, replay checkpoint, restore settlement, resolution snapshot, and deep-link restore must bind one current `SupportLineageBinding` before live or calmly trustworthy posture is legal
* support may investigate or repair multiple related lineage objects only through this binding; subject-only clustering, copied thread refs, or ticket-local arrays are insufficient canonical scope

#### 1.34B SupportLineageScopeMember

Fields:

* `supportLineageScopeMemberId`
* `supportLineageBindingRef`
* `requestLineageRef`
* `lineageCaseLinkRef`
* `domainCaseRef`
* `governingObjectDescriptorRef`
* `governingObjectRef`
* `governingObjectVersionRef`
* `sourceThreadRef`
* `sourceArtifactRef`
* `memberRole = primary_action_target | communication_context | recovery_dependency | identity_repair_dependency | related_case_context | artifact_provenance`
* `continuityWitnessRef`
* `visibilityMode = masked_summary | bounded_detail | repair_actionable`
* `actionability = observe_only | governed_mutation | artifact_only`
* `memberState = active | stale | superseded | released`
* `addedAt`
* `releasedAt`

Semantics:

* is the typed support-scope record for each canonical lineage object or artifact family visible inside a `SupportTicket`
* exactly one active member may supply live mutation authority for a support action; sibling members may add context, but they may not become implicit alternative targets
* repeat-contact clustering, multi-lineage investigation, identity-repair review, and communication recovery may share one ticket only when each governed object is enumerated through explicit scope members

#### 1.34C SupportLineageArtifactBinding

Fields:

* `supportLineageArtifactBindingId`
* `supportLineageBindingRef`
* `supportLineageScopeMemberRef`
* `supportTicketRef`
* `sourceLineageRef`
* `sourceLineageCaseLinkRef`
* `sourceEvidenceSnapshotRef`
* `sourceArtifactRef`
* `derivedArtifactRef`
* `noteOrSummaryRef`
* `maskScopeRef`
* `disclosureCeilingRef`
* `parityDigestRef`
* `bindingState = active | superseded | blocked`
* `createdAt`
* `supersededAt`

Semantics:

* is the required provenance join for any support-visible derived artifact, transcript excerpt, resend note, recovery note, resolution summary, or export that cites canonical evidence or lineage state
* support-authored summaries may stage locally, but they may not become durable timeline, replay, or resolution truth until one `SupportLineageArtifactBinding` cites the exact source lineage, source artifact or snapshot, and current masking scope
* prevents detached ticket attachments, copied transcript snippets, and local recovery notes from masquerading as canonical support evidence after lineage or mask scope drifts

#### 1.35 PatientShellConsistencyProjection

Fields:

* `patientShellConsistencyProjectionId`
* `subjectRef`
* `shellContinuityKey`
* `channelProfile = browser | embedded | constrained_browser`
* `selectedSectionRef`
* `activeRouteFamilyRef`
* `selectedAnchorRef`
* `activeReturnContractRef`
* `bundleVersion`
* `audienceTier`
* `governingObjectRefs`
* `entityVersionRefs`
* `continuityEvidenceRefs[]`
* `shellConsistencyState = live | revalidate_only | recovery_only | blocked`
* `computedAt`
* `staleAt`
* `causalConsistencyState`

Semantics:

* patient home, inbox, request, record, and message surfaces must assemble beneath one consistency envelope rather than stitching together unrelated reads
* the projection is the only authority for patient-shell reuse across home, requests, booking, records, messages, callback, pharmacy, and recovery child routes while the same shell continuity key remains valid
* refresh, deep-link resolution, recovery-token consume, step-up return, and embedded-channel adaptation must preserve the same shell, section, anchor, and active return contract whenever `shellConsistencyState != blocked`
* if header, status strip, `DecisionDock`, or route-level actionability diverge from this envelope, mutating affordances must freeze and the shell must fall to bounded refresh or governed recovery in place

#### 1.36 AudienceSurfaceRouteContract

Fields:

* `surfaceRouteContractId`
* `audienceSurface`
* `routeFamilyRefs`
* `owningBoundedContextRef`
* `contributingBoundedContextRefs[]`
* `requiredContextBoundaryRefs[]`
* `allowedActionScopeRefs`
* `projectionSchemaSetRef`
* `visibilityCoverageRefs[]`
* `projectionFamilyRefs[]`
* `allowedPreviewModes[]`
* `allowedArtifactModes[]`
* `allowedPurposeOfUseRefs[]`
* `actingContextMode = none | optional | required`
* `breakGlassMode = forbidden | summary_only | bounded_detail`
* `requiredRouteIntentState`
* `requiredReleaseApprovalFreezeRef`
* `requiredChannelFreezeRefs[]`
* `requiredAssuranceSliceTrustRefs[]`
* `requiredPublicationParityState = exact`
* `requiredEmbeddedSessionState = not_embedded | embedded_validated | embedded_read_only_ok`
* `commandSettlementSchemaRef`
* `transitionEnvelopeSchemaRef`
* `sameShellRecoveryPolicyRef`
* `declaredReleaseRecoveryDispositionRef`
* `declaredRouteFreezeDispositionRef`
* `routeContractDigestRef`
* `generatedAt`

Semantics:

* every mutating browser-facing or shell-facing route family must bind to one explicit contract before writable posture appears
* `owningBoundedContextRef` names the single context that owns lifecycle truth for the route family's governing object; contributing contexts may enrich, preview, or advise, but they may not redefine the mutation target or outcome semantics
* the contract makes route intent, release or channel freeze posture, assurance trust, embedded requirements, and same-shell recovery explicit to runtime consumers
* `requiredContextBoundaryRefs[]` name every non-owning context dependency that is allowed to influence the route through milestone, projection, governance, or anti-corruption seams; undeclared sibling-context writes or route-local joins are invalid
* every preview, timeline, receipt, artifact, and mutation posture reachable through the route must map to one of the declared `visibilityCoverageRefs[]`; undeclared widening or route-local masking logic is forbidden
* route names, client code, or stale local schema cannot substitute for a published contract
* a published route contract is necessary but not sufficient for writable posture; shells and gateways must consume it through one current `AudienceSurfaceRuntimeBinding`

#### 1.37 AudienceSurfacePublicationRef

Fields:

* `surfacePublicationId`
* `audienceSurface`
* `routeContractRef`
* `runtimePublicationBundleRef`
* `releasePublicationParityRef`
* `surfaceTupleHash`
* `provenanceConsumptionState = publishable | blocked | withdrawn`
* `publicationState = published | stale | conflict | withdrawn`
* `publishedAt`
* `withdrawnAt`

Semantics:

* each live audience surface must carry one publication reference so shells, gateways, and operators can prove the current contract is actually live against one exact runtime tuple
* writable posture must freeze when publication becomes `stale`, `conflict`, or `withdrawn`

#### 1.37A DesignContractPublicationBundle

Fields:

* `designContractPublicationBundleId`
* `audienceSurface`
* `routeFamilyRefs[]`
* `shellType`
* `breakpointCoverageRefs[]`
* `modeTupleCoverageRef`
* `designTokenExportArtifactRef`
* `visualTokenProfileRefs[]`
* `surfaceStateSemanticsProfileRefs[]`
* `automationAnchorMapRefs[]`
* `telemetryBindingProfileRefs[]`
* `artifactModePresentationProfileRefs[]`
* `designContractVocabularyTupleRefs[]`
* `designContractDigestRef`
* `structuralSnapshotRefs[]`
* `lintVerdictRef`
* `publicationState = published | stale | blocked | withdrawn`
* `publishedAt`

Semantics:

* one `DesignContractPublicationBundle` is the machine-readable surface contract joining token export, state semantics, automation markers, telemetry vocabulary, and artifact posture for one audience surface and route-family set
* route-local CSS constants, px or hex overrides, test-id alias maps, and ad hoc telemetry names may extend diagnostics only when the active bundle still remains authoritative for meaning-bearing state and observability
* calm or writable posture is illegal once the governing design-contract bundle is `stale`, `blocked`, or `withdrawn`; shells may preserve the last safe summary and anchor, but they may not continue to imply verified design, accessibility, or observability parity

#### 1.37B DesignContractLintVerdict

Fields:

* `designContractLintVerdictId`
* `designContractPublicationBundleRef`
* `tokenLatticeState = exact | drifted | blocked`
* `modeResolutionState = exact | drifted | blocked`
* `surfaceSemanticsState = exact | drifted | blocked`
* `automationTelemetryParityState = exact | drifted | blocked`
* `artifactModeParityState = exact | drifted | blocked`
* `surfaceRoleUsageState = exact | drifted | blocked`
* `structuralSnapshotState = exact | stale | missing`
* `result = pass | blocked`
* `recordedAt`

Semantics:

* one `DesignContractLintVerdict` is the fail-closed proof that the active design-contract bundle still matches the canonical token graph, the published DOM and telemetry vocabulary, the surface-state contract, and the artifact-mode contract
* token drift, missing mode coverage, mismatched automation and telemetry names, or stale structural evidence are release and publication blockers, not advisory styling warnings

#### 1.38 RuntimePublicationBundle

Fields:

* `runtimePublicationBundleId`
* `releaseRef`
* `releaseApprovalFreezeRef`
* `watchTupleHash`
* `routeContractDigestRefs`
* `designContractPublicationBundleRefs[]`
* `designContractDigestRefs[]`
* `designContractLintVerdictRefs[]`
* `releaseContractVerificationMatrixRef`
* `releaseContractMatrixHash`
* `commandSettlementSchemaSetRef`
* `transitionEnvelopeSchemaSetRef`
* `recoveryDispositionSetRef`
* `routeFreezeDispositionRefs[]`
* `surfacePublicationRefs[]`
* `surfaceRuntimeBindingRefs[]`
* `releasePublicationParityRef`
* `bundleTupleHash`
* `provenanceState = verified | quarantined | revoked`
* `provenanceConsumptionState = publishable | blocked | withdrawn`
* `publicationState = pending | published | stale | conflict | withdrawn`
* `publishedAt`

Semantics:

* one runtime publication bundle is the machine-readable contract consumed by shells, gateways, operations, and governance for the currently promoted release tuple
* writable routes must fail closed when publication is stale, conflicting, withdrawn, or backed by quarantined or revoked provenance
* route contracts, design-contract bundles, settlement schemas, transition envelopes, recovery dispositions, continuity controls, and the current `ReleaseContractVerificationMatrix` are not runtime truth until the current bundle and its `surfaceRuntimeBindingRefs[]` are published together against one exact watch tuple

#### 1.38A AudienceSurfaceRuntimeBinding

Fields:

* `audienceSurfaceRuntimeBindingId`
* `audienceSurface`
* `routeFamilyRef`
* `surfaceRouteContractRef`
* `surfacePublicationRef`
* `runtimePublicationBundleRef`
* `releasePublicationParityRef`
* `designContractPublicationBundleRef`
* `designContractLintVerdictRef`
* `visibilityCoverageRefs[]`
* `coverageState = exact | stale | blocked`
* `designContractState = exact | stale | blocked`
* `requiredPublicationParityState = exact`
* `releaseApprovalFreezeRef`
* `requiredChannelFreezeRefs[]`
* `requiredAssuranceSliceTrustRefs[]`
* `routeFreezeDispositionRef`
* `releaseRecoveryDispositionRef`
* `bindingState = publishable_live | recovery_only | read_only | blocked`
* `surfaceTupleHash`
* `validatedAt`

Semantics:

* `AudienceSurfaceRuntimeBinding` is the single runtime tuple consumed by shells, gateways, operations, governance, and support to decide whether a surface may appear writable, calmly trustworthy, recovery-only, or blocked
* writable or calm posture is legal only while `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `designContractPublicationBundleRef`, `designContractLintVerdictRef`, and the bound `visibilityCoverageRefs[]` all still agree on one exact tuple, provenance remains publishable, and the active freeze or trust posture still permits live behavior
* `bindingState = publishable_live` is legal only while `coverageState = exact`, `designContractState = exact`, `DesignContractLintVerdict.result = pass`, and each bound route, projection family, preview mode, artifact mode, automation marker, and telemetry name still matches the published coverage rows for the active purpose of use
* route-local cache, compiled client state, or a stale published contract may not reopen mutating affordances after the binding has fallen out of `publishable_live`

#### 1.39 ReleaseRecoveryDisposition

Fields:

* `releaseRecoveryDispositionId`
* `routeFamilyRef`
* `audienceSurface`
* `triggerClass = release_freeze | channel_freeze | assurance_untrusted | publication_stale | publication_parity_drift | provenance_blocked | embedded_session_mismatch | bridge_capability_loss`
* `allowedModes = placeholder | read_only | bounded_refresh | safe_browser_handoff | governance_handoff`
* `preferredReturnContractRef`
* `supportCodeRef`
* `messageTemplateRef`

Semantics:

* every known release, channel, trust, or publication mismatch must resolve to one governed recovery mode rather than generic failure
* the same disposition must be testable in simulation, runtime, and operator tooling

#### 1.40 PatientEmbeddedSessionProjection

Fields:

* `patientEmbeddedSessionProjectionId`
* `subjectRef`
* `sessionEpochRef`
* `subjectBindingVersionRef`
* `manifestVersionRef`
* `releaseApprovalFreezeRef`
* `channelReleaseFreezeState = monitoring | frozen | kill_switch_active | rollback_recommended | released`
* `minimumBridgeCapabilitiesRef`
* `currentBridgeCapabilityMatrixRef`
* `routeFreezeDispositionRef`
* `recoveryRouteRef`
* `computedAt`

Semantics:

* any embedded patient route must validate session lineage, manifest tuple, release posture, and bridge capability through one projection before live actionability is exposed
* if the embedded projection drifts from route or shell truth, the same shell must degrade through the bound route-freeze disposition

#### 1.40A EssentialFunctionMap

Fields:

* `essentialFunctionMapId`
* `functionCode`
* `audienceScopeRefs[]`
* `businessOwnerRef`
* `recoveryTierRef`
* `supportingSystemRefs[]`
* `supportingDataRefs[]`
* `dependencyOrderRefs[]`
* `degradedModeRefs[]`
* `currentRunbookBindingRefs[]`
* `currentOperationalReadinessSnapshotRef`
* `functionState = mapped | rehearsal_due | recovery_only | retired`
* `updatedAt`

Semantics:

* essential functions are the recovery unit for restore, failover, degraded-mode, and operational-readiness truth; infrastructure inventories may support the map, but they may not replace it
* dashboard slices, runbook bindings, restore order, and journey-level proof must anchor to the same essential-function set so resilience posture stays comparable across runtime, operations, governance, and assurance

#### 1.40B RecoveryTier

Fields:

* `recoveryTierId`
* `functionCode`
* `rto`
* `rpo`
* `maxDiagnosticOnlyWindow`
* `degradedModeDefinitionRef`
* `restorePriority`
* `requiredJourneyProofRefs[]`
* `requiredBackupScopeRefs[]`
* `tierState = active | superseded | retired`
* `updatedAt`

Semantics:

* `RecoveryTier` is the authoritative resilience policy for one essential function; route-local fallback copy, wiki tables, or dashboard legends may not redefine restore priority or degraded-mode ceiling
* backup scope, runbook scope, journey proof, and operational-readiness posture must all reconcile to the same tier before a function may advertise ready recovery

#### 1.40BA EssentialFunctionHealthEnvelope

Fields:

* `essentialFunctionHealthEnvelopeId`
* `functionCode`
* `boardScopeRef`
* `boardTupleHash`
* `requiredAssuranceSliceTrustRefs[]`
* `requiredChannelFreezeRefs[]`
* `releaseTrustFreezeVerdictRef`
* `fallbackReadinessRef`
* `currentOperationalReadinessSnapshotRef`
* `recoveryControlPostureRef`
* `blockingDependencyRefs[]`
* `blockingNamespaceRefs[]`
* `blastRadiusRef`
* `healthState = healthy | degraded_but_operating | fallback_active | blocked | unknown_or_stale`
* `overlayState = live_trusted | constrained_fallback | diagnostic_only | recovery_only | blocked`
* `mitigationAuthorityState = enabled | constrained | observe_only | blocked`
* `allowedActionRefs[]`
* `blockedActionRefs[]`
* `watchReasonRefs[]`
* `lastStableSnapshotRef`
* `evaluatedAt`

Semantics:

* `EssentialFunctionHealthEnvelope` is the single authority that joins assurance trust, channel-freeze posture, release authority, fallback sufficiency, dependency degradation, and resilience posture for one essential function on operator-facing boards
* operations boards, readiness artifacts, stable-service digests, health drill paths, and mitigation surfaces may not reconstruct function health from raw `AssuranceSliceTrustRecord`, `ChannelReleaseFreezeRecord`, `ReleaseTrustFreezeVerdict`, `FallbackReadinessDigest`, `OperationalReadinessSnapshot`, or `RecoveryControlPosture` fragments once the envelope exists
* `healthState = healthy` is legal only while required assurance slices are `trusted` and complete, the linked `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live`, no blocking dependency or namespace remains unresolved, fallback is not active, and current recovery posture does not constrain ordinary operation
* `healthState = fallback_active` is mandatory whenever the function is currently serving through fallback or another degraded-mode path, even when service remains available and operator-visible SLOs still look acceptable
* `healthState = degraded_but_operating` is mandatory whenever the function remains available but trust, fallback sufficiency, dependency health, or mitigation authority is constrained enough that the function cannot be represented as fully healthy
* `healthState = unknown_or_stale` is mandatory when required trust, release, fallback, or resilience inputs are missing, stale, contradictory, or tuple-mismatched for the current board scope
* `overlayState = live_trusted` is legal only while `healthState = healthy` and `mitigationAuthorityState = enabled`; constrained, diagnostic, recovery-only, or blocked verdicts must suppress calm healthy-empty language even if the last local projection looked green
* `mitigationAuthorityState = enabled` is legal only while the linked release verdict remains live, no required channel freeze blocks mitigation, fallback sufficiency is not unsafe or exhausted, and the current recovery posture does not narrow actionability below ordinary operational controls
* stable-service and healthy-summary surfaces may include only `overlayState = live_trusted` functions in their top healthy signals; time-bounded fallback, constrained mitigation, degraded trust, or active freeze must remain explicit as watch or guarded items

#### 1.40C BackupSetManifest

Fields:

* `backupSetManifestId`
* `datasetScopeRef`
* `essentialFunctionRefs[]`
* `snapshotTime`
* `immutabilityState = immutable | mutable | disputed`
* `checksumBundleRef`
* `restoreCompatibilityDigestRef`
* `runtimePublicationBundleRef`
* `manifestTupleHash`
* `manifestState = current | stale | superseded | withdrawn`
* `verifiedAt`

Semantics:

* backup existence is not sufficient recovery truth; each manifest must prove immutability, checksum coverage, and compatibility with the runtime tuple it claims to protect
* stale, superseded, mutable, or tuple-mismatched manifests may inform diagnostics, but they may not satisfy live restore-validation posture

#### 1.40D RestoreRun

Fields:

* `restoreRunId`
* `essentialFunctionRefs[]`
* `targetEnvironmentRef`
* `backupSetManifestRefs[]`
* `operationalReadinessSnapshotRef`
* `runbookBindingRefs[]`
* `restoreTupleHash`
* `dependencyValidationState = pending | complete | blocked`
* `journeyValidationState = pending | complete | blocked`
* `resultState = running | data_restored | journey_validation_pending | succeeded | failed | superseded`
* `evidenceArtifactRefs[]`
* `resilienceActionSettlementRef`
* `initiatedAt`
* `completedAt`

Semantics:

* `RestoreRun` is authoritative only for the bound tuple named by `restoreTupleHash`, current `OperationalReadinessSnapshot`, and current `RunbookBindingRecord` set; a historic clean restore does not remain current truth after tuple drift
* restore success requires dependency-order validation and journey-level proof, not only data rehydration or subsystem boot

#### 1.40E FailoverRun

Fields:

* `failoverRunId`
* `scenarioRef`
* `essentialFunctionRefs[]`
* `operationalReadinessSnapshotRef`
* `runbookBindingRefs[]`
* `failoverTupleHash`
* `degradedModeRef`
* `validationState = pending | complete | blocked`
* `resultState = armed | active | validation_pending | stood_down | failed | superseded`
* `evidenceArtifactRefs[]`
* `resilienceActionSettlementRef`
* `startedAt`
* `completedAt`

Semantics:

* failover posture must remain distinguishable from failover design. A scenario definition is not proof that the current failover actually activated, validated, or stood down safely
* a prior `FailoverRun` may not satisfy current readiness once publication, trust, guardrail, or runbook tuple has changed

#### 1.40F ChaosRun

Fields:

* `chaosRunId`
* `experimentRef`
* `essentialFunctionRefs[]`
* `operationalReadinessSnapshotRef`
* `runbookBindingRefs[]`
* `chaosTupleHash`
* `blastRadiusRef`
* `guardrailState = approved | constrained | blocked`
* `resultState = scheduled | running | halted | completed | failed | superseded`
* `evidenceArtifactRefs[]`
* `resilienceActionSettlementRef`
* `startedAt`
* `completedAt`

Semantics:

* chaos posture is governed operational history, not a notebook artifact; live guardrails, scope, and tuple binding must remain attached to the recorded run
* superseded, stale-scope, or blocked chaos runs remain evidence, but they may not keep later shells in live-control posture

#### 1.40G OperationalReadinessSnapshot

Fields:

* `operationalReadinessSnapshotId`
* `releaseRef`
* `runtimePublicationBundleRef`
* `releaseWatchTupleRef`
* `watchTupleHash`
* `requiredAssuranceSliceRefs[]`
* `releaseTrustFreezeVerdictRefs[]`
* `essentialFunctionRefs[]`
* `recoveryTierRefs[]`
* `runbookBindingRefs[]`
* `latestRecoveryEvidencePackRef`
* `latestRestoreRunRefs[]`
* `latestFailoverRunRefs[]`
* `latestChaosRunRefs[]`
* `latestJourneyRecoveryProofRefs[]`
* `freshnessState = fresh | stale | incomplete`
* `readinessState = ready | constrained | blocked`
* `capturedAt`

Semantics:

* `OperationalReadinessSnapshot` is the release-scoped restore authority for runbooks, rehearsal coverage, restore evidence, and recovery posture; dashboard links, bookmarks, and human memory are not equivalent authority
* readiness must downgrade immediately when required verdicts, runbook bindings, or recovery evidence drift away from the live runtime tuple

#### 1.40H RunbookBindingRecord

Fields:

* `runbookBindingRecordId`
* `runbookRef`
* `releaseRef`
* `audienceScope`
* `routeFamilyRefs[]`
* `essentialFunctionRefs[]`
* `recoveryTierRefs[]`
* `runtimePublicationBundleRef`
* `releaseWatchTupleRef`
* `watchTupleHash`
* `releaseRecoveryDispositionRefs[]`
* `lastRehearsedAt`
* `lastRehearsalSettlementRef`
* `latestRecoveryEvidenceArtifactRefs[]`
* `bindingState = published | stale | rehearsal_required | withdrawn`

Semantics:

* runbooks are tuple-bound governed artifacts. A wiki page or shared document link may reference the runbook, but it may not stand in for the binding record that proves the live tuple, rehearsal state, and audience recovery dispositions
* unrehearsed, stale, withdrawn, or tuple-mismatched runbooks downgrade readiness and recovery posture even if their text still exists

#### 1.40I ResilienceSurfaceRuntimeBinding

Fields:

* `resilienceSurfaceRuntimeBindingId`
* `routeFamilyRef`
* `audienceSurfaceRuntimeBindingRef`
* `surfacePublicationRef`
* `runtimePublicationBundleRef`
* `releasePublicationParityRef`
* `releaseTrustFreezeVerdictRef`
* `operationalReadinessSnapshotRef`
* `requiredRunbookBindingRefs[]`
* `recoveryControlPostureRef`
* `releaseRecoveryDispositionRef`
* `bindingState = live | diagnostic_only | recovery_only | blocked`

Semantics:

* resilience routes are not exempt from runtime publication law. Restore, failover, and chaos controls may appear only while the same route family is live under current publication, parity, trust, readiness, and bound runbook state
* the binding must preserve diagnostic evidence when posture downgrades, but it may not leave stale live controls armed

#### 1.40J RecoveryControlPosture

Fields:

* `recoveryControlPostureId`
* `scopeRef`
* `operationalReadinessSnapshotRef`
* `releaseTrustFreezeVerdictRef`
* `requiredRunbookBindingRefs[]`
* `restoreValidationFreshnessState = fresh | stale | expired | missing`
* `dependencyCoverageState = complete | partial | blocked`
* `journeyRecoveryCoverageState = exact | partial | missing`
* `backupManifestState = current | stale | missing`
* `postureState = live_control | diagnostic_only | governed_recovery | blocked`
* `allowedActionRefs[]`
* `blockerRefs[]`
* `releaseRecoveryDispositionRef`
* `lastComputedAt`

Semantics:

* `RecoveryControlPosture` is the single runtime verdict for restore, failover, and chaos authority on one scope. Dashboards, runbooks, evidence packs, and shells may not reconstruct live recovery authority from fragments once this posture exists
* `postureState = live_control` is legal only while publication and trust remain live, the current readiness snapshot is fresh enough for the scope, required runbooks are published and rehearsed, restore validation is fresh, dependency coverage is complete, journey recovery coverage is exact, and required backup manifests are current

#### 1.40K ResilienceActionRecord

Fields:

* `resilienceActionRecordId`
* `routeIntentBindingRef`
* `actionType = restore_prepare | restore_start | restore_validate | failover_activate | failover_validate | failover_stand_down | chaos_schedule | chaos_start | chaos_abort | recovery_pack_attest`
* `scopeRef`
* `operationalReadinessSnapshotRef`
* `recoveryControlPostureRef`
* `submittedBy`
* `submittedAt`
* `commandActionRecordRef`

Semantics:

* restore, failover, chaos, and recovery-pack mutation are first-class governed mutations. Scripts, shell buttons, and ticket acknowledgements may launch the request, but they may not become authoritative without the canonical action record
* every action must bind to the current route intent, readiness snapshot, and recovery posture so stale scope or reheated controls fail closed

#### 1.40L ResilienceActionSettlement

Fields:

* `resilienceActionSettlementId`
* `resilienceActionRecordRef`
* `commandSettlementRef`
* `transitionEnvelopeRef`
* `authoritativeRunRefs[]`
* `recoveryEvidenceArtifactRefs[]`
* `result = accepted_pending_evidence | applied | blocked_publication | blocked_trust | blocked_readiness | frozen | stale_scope | failed | superseded`
* `recordedPostureRef`
* `releaseRecoveryDispositionRef`
* `settledAt`

Semantics:

* local acknowledgement, command acceptance, and subsystem log lines are not authoritative restore or failover truth. The shell may not imply completion until the matching settlement proves the current scope, tuple, posture, and evidence set
* `superseded` and `stale_scope` remain visible as operational history, but they may not satisfy current restore-validation or failover authority

#### 1.40M RecoveryEvidenceArtifact

Fields:

* `recoveryEvidenceArtifactId`
* `artifactType = restore_report | failover_report | chaos_report | recovery_pack_export | dependency_restore_explainer | journey_recovery_proof | backup_manifest_report | runbook_bundle`
* `scopeRef`
* `operationalReadinessSnapshotRef`
* `runbookBindingRefs[]`
* `producingRunRef`
* `summaryRef`
* `artifactPresentationContractRef`
* `artifactSurfaceContextRef`
* `artifactModeTruthProjectionRef`
* `artifactTransferSettlementRef`
* `artifactFallbackDispositionRef`
* `outboundNavigationGrantPolicyRef`
* `maskingPolicyRef`
* `artifactState = summary_only | governed_preview | external_handoff_ready | recovery_only`
* `producedAt`

Semantics:

* recovery evidence is part of the assurance spine, not detached operational folklore. Reports, journey proofs, backup explainers, and runbook bundles must bind to current tuple, masking, and presentation contracts before they can inform readiness or export
* summary-first rendering is mandatory; richer preview or handoff may remain live only while the current `ArtifactModeTruthProjection` still validates parity, masking scope, and return-safe continuity. Raw storage links and detached document portals are forbidden recovery UX

#### 1.40N PatientDegradedModeProjection

Fields:

* `patientDegradedModeProjectionId`
* `routeFamilyRef`
* `sectionRef`
* `patientShellConsistencyRef`
* `patientPortalEntryProjectionRef`
* `patientSectionSurfaceStateRef`
* `patientExperienceContinuityEvidenceProjectionRef`
* `releaseRecoveryDispositionRef`
* `routeFreezeDispositionRef`
* `patientEmbeddedSessionProjectionRef`
* `patientActionRecoveryProjectionRef`
* `patientIdentityHoldProjectionRef`
* `selectedWritableEligibilityFenceRef`
* `artifactFallbackDispositionRefs[]`
* `selectedAnchorRef`
* `lastSafeSummaryRef`
* `nextSafeActionRef`
* `messageTemplateRef`
* `supportCodeRef`
* `audienceTierCeiling`
* `currentMode = live | pending | read_only | placeholder_only | bounded_recovery | safe_browser_handoff | identity_hold`
* `modeReason = continuity_stale | writable_withdrawn | release_or_publication_mismatch | embedded_mismatch | action_recovery | identity_hold | artifact_fallback | blocked_policy`
* `truthTupleHash`
* `computedAt`

Semantics:

* `PatientDegradedModeProjection` is the single patient-facing truth adapter over release recovery, route freeze, action recovery, identity hold, continuity evidence, writable eligibility, and artifact fallback. Patient shells may specialize wording, but they may not invent a second degraded-state grammar.
* `currentMode = live` is legal only while the current continuity evidence is trusted, any bound `WritableEligibilityFence` still permits the visible action, no governing `ReleaseRecoveryDisposition` or `RouteFreezeDisposition` has withdrawn ordinary posture, and any patient-visible artifact action promoted in the current shell remains lawful under the active `ArtifactFallbackDisposition`.
* `pending` preserves the same shell, selected anchor, last safe summary, and honest timeline evidence while authoritative settlement, continuity refresh, or governed return is still outstanding; it may not present fresh writable posture or calm final reassurance.
* `read_only`, `placeholder_only`, `bounded_recovery`, `safe_browser_handoff`, and `identity_hold` are the only patient degraded steady states. Generic error pages, silent route disappearance, contradictory reassurance, and stale writable controls are forbidden substitutes.
* `PatientPortalEntryProjection`, `PatientSectionSurfaceState`, `PatientActionRecoveryProjection`, `PatientIdentityHoldProjection`, `PatientEmbeddedSessionProjection`, and any patient-visible artifact surface are patient-shell views over this projection. If those surfaces disagree, the stricter `currentMode` wins.
* `selectedAnchorRef`, `lastSafeSummaryRef`, and `nextSafeActionRef` are mandatory whenever the current route family remains same-shell recoverable. A patient route may not withdraw actionability by also withdrawing orientation.
* legacy patient routes or cached shells that lack a current `PatientDegradedModeProjection` are `recovery_only`; rollout and backfill must mint a fresh projection on next render instead of assuming inherited live posture.

#### 1.41 RouteFreezeDisposition

Fields:

* `routeFreezeDispositionId`
* `routeFamilyRef`
* `triggerState = manifest_drift | release_frozen | channel_frozen | bridge_incompatible | session_drift | publication_stale | publication_parity_drift | provenance_blocked`
* `dispositionMode = placeholder_only | read_only | safe_browser_handoff | bounded_recovery`
* `placeholderContractRef`
* `recoveryRouteRef`
* `browserHandoffPolicyRef`

Semantics:

* embedded or channel-specific route freezes must degrade in place rather than disappearing or hard-failing generically
* the disposition controls whether the patient remains read-only, sees a governed placeholder, or is handed off safely to a supported browser route

#### 1.42 ArtifactPresentationContract

Fields:

* `artifactPresentationContractId`
* `artifactRefPattern`
* `audienceSurface`
* `visibilityCoverageRef`
* `minimumNecessaryContractRef`
* `primaryMode = structured_summary | byte_download | external_delivery`
* `previewVisibility = hidden | awareness_only | summary_only | governed_preview`
* `fullBodyMode = forbidden | step_up_required | allowed`
* `summarySafetyTier`
* `summaryContractRef`
* `inlinePreviewContractRef`
* `downloadContractRef`
* `printContractRef`
* `handoffContractRef`
* `placeholderContractRef`
* `redactionPolicyRef`
* `maxInlineBytes`
* `requiresStepUpForFullBody`
* `allowedFallbackModes`
* `channelSpecificNoticeRef`

Semantics:

* patient-visible records, letters, instructions, and completion artifacts must default to structured summary when policy allows
* structured summary, inline preview, download, print, and browser or cross-app handoff are independently governed modes; allowing one mode does not imply any other mode is lawful
* artifact preview, inline body, download, print, and handoff posture may not widen beyond the bound `AudienceVisibilityCoverage`, `MinimumNecessaryContract`, or mode-specific contracts; if the coverage row permits only awareness or summary, the artifact contract must degrade in place rather than synthesize richer access
* contract permission alone is not enough to keep richer preview, byte delivery, print, or handoff live; those modes may remain active only while the current `ArtifactModeTruthProjection` confirms the same mode under current parity, channel viability, grant posture, masking, and return continuity
* a route may not synthesize richer artifact access than the contract or any of its bound mode-specific contracts permit

#### 1.42A ArtifactModeTruthProjection

Fields:

* `artifactModeTruthProjectionId`
* `artifactPresentationContractRef`
* `artifactSurfaceContextRef`
* `artifactParityDigestRef`
* `binaryArtifactDeliveryRef`
* `artifactByteGrantRef`
* `outboundNavigationGrantRef`
* `bridgeCapabilityMatrixRef`
* `patientEmbeddedNavEligibilityRef`
* `channelProfile = browser | embedded | constrained_browser`
* `previewTruthState = summary_only | preview_ready | preview_provisional | preview_blocked`
* `byteDeliveryTruthState = not_requested | byte_ready | size_blocked | grant_missing | bridge_unavailable | delivery_pending | returned | recovery_required | blocked`
* `printTruthState = forbidden | ready | blocked`
* `handoffTruthState = not_needed | handoff_ready | handoff_pending | returned | recovery_required | blocked`
* `maskingTruthState = current | stale | blocked`
* `returnTruthState = anchor_bound | return_pending | stale | blocked`
* `currentSafeMode = structured_summary | governed_preview | governed_download | print_preview | external_handoff | secure_send_later | placeholder_only | recovery_only`
* `blockingRefs[]`
* `truthTupleHash`
* `computedAt`

Semantics:

* `ArtifactModeTruthProjection` is the single live authority for what an artifact surface may currently do, not just what its static contract allows in principle
* the source artifact remains authoritative even when summary parity is verified. `verified` means the current structured summary faithfully represents the current source artifact, masking scope, and release tuple; it does not make the derivative interchangeable with the source bytes
* summary, inline preview, byte delivery, print, and browser or cross-app handoff must all derive from this projection rather than from route-local capability checks, filename heuristics, mime type assumptions, browser events, or raw bridge availability
* constrained-channel viability, byte-size ceilings, parity state, masking scope, navigation grant state, selected-anchor continuity, and return-safe posture must all resolve into the same `truthTupleHash`; if any input drifts, richer artifact posture must degrade in place while the last safe summary remains visible
* stale, superseded, or mismatched byte grants, navigation grants, bridge capability matrices, or return contracts may remain auditable, but they may not keep preview, download, print, or handoff controls live once the current projection has moved to `secure_send_later | placeholder_only | recovery_only`

#### 1.42B RecordArtifactParityWitness

Fields:

* `recordArtifactParityWitnessId`
* `recordRef`
* `recordVersionRef`
* `recordVisibilityEnvelopeRef`
* `recordReleaseGateRef`
* `recordStepUpCheckpointRef`
* `artifactSurfaceBindingRef`
* `artifactParityDigestRef`
* `artifactModeTruthProjectionRef`
* `structuredSummaryRef`
* `structuredSummaryHash`
* `summaryDerivationPackageRef`
* `summaryRedactionTransformRef`
* `sourceArtifactRef`
* `sourceArtifactBundleRef`
* `sourceArtifactHash`
* `sourceRedactionTransformRef`
* `sourceAuthorityState = source_authoritative | summary_verified | summary_provisional | source_only | recovery_only`
* `recordGateState = visible | delayed_release | step_up_required | identity_hold | recovery_only`
* `blockingRefs[]`
* `parityTupleHash`
* `checkedAt`

Semantics:

* is the record-specific authority witness joining one structured summary, one source artifact bundle, one derivation package, the current redaction transforms, and the current record visibility, release, and step-up fences for exactly one `recordVersionRef`
* does not replace `ArtifactParityDigest`; it specializes that generic digest for result, letter, document, attachment, and longitudinal-record routes so overview, detail, preview, download, and handoff all prove the same source-authority tuple before they can look calm or verified
* `sourceAuthorityState = summary_verified` is legal only while the linked `ArtifactParityDigest`, source artifact refs and hashes, summary artifact refs and hashes, derivation package, redaction transforms, visibility envelope, release gate, and step-up checkpoint all still match the same current record tuple
* delayed-release cursor drift, step-up invalidation, identity hold, parity drift, derivation supersession, or redaction drift must supersede this witness and demote the record route in place to provisional, source-only, placeholder, or recovery posture rather than leaving older verified summary copy or richer artifact actions armed

#### 1.43 OutboundNavigationGrant

Fields:

* `outboundNavigationGrantId`
* `routeFamilyRef`
* `destinationClass = browser_overlay | external_browser | app_page`
* `scrubbedUrlRef`
* `allowedHostRef`
* `allowedPathPattern`
* `returnContractRef`
* `selectedAnchorRef`
* `maskingPolicyRef`
* `channelProfile = browser | embedded | constrained_browser`
* `bridgeCapabilityMatrixRef`
* `patientEmbeddedNavEligibilityRef`
* `truthTupleHash`
* `manifestVersionRef`
* `sessionEpochRef`
* `lineageFenceEpoch`
* `issuedAt`
* `expiresAt`
* `grantState`

Semantics:

* external browser, overlay, and cross-app handoff requires a short-lived grant rather than raw URL navigation
* a live grant must stay bound to the same selected anchor, masking posture, channel profile, and `ArtifactModeTruthProjection.truthTupleHash` that armed the handoff; if any of those drift, the grant must fail closed back into the same shell
* stale or mismatched grants must fail closed back into the same shell with governed return posture

#### 1.44 StaffWorkspaceConsistencyProjection

Fields:

* `workspaceConsistencyProjectionId`
* `taskId`
* `requestId`
* `bundleVersion`
* `audienceTier`
* `governingObjectRefs`
* `entityVersionRefs`
* `queueChangeBatchRef`
* `reviewVersionRef`
* `computedAt`
* `staleAt`
* `causalConsistencyState`

Semantics:

* staff queue, review, and decision surfaces must assemble beneath one consistency envelope
* `StaffWorkspaceConsistencyProjection` is necessary but not sufficient for writable or calm workspace posture; it must feed the current `WorkspaceTrustEnvelope` before queue, task, or interruption surfaces stay interactive
* stale bundle, review, or governing-object drift must freeze mutation and require bounded refresh or recovery instead of optimistic commit

#### 1.45 WorkspaceSliceTrustProjection

Fields:

* `workspaceSliceTrustProjectionId`
* `taskId`
* `queueSliceTrustState`
* `taskSliceTrustState`
* `attachmentSliceTrustState`
* `assistiveSliceTrustState`
* `dependencySliceTrustState`
* `assuranceSliceTrustRefs[]`
* `renderMode = interactive | observe_only | recovery_required`
* `evaluatedAt`

Semantics:

* degraded queue, attachment, assistive, or dependency truth must remain explicit and may not be flattened into an ordinary healthy state
* `WorkspaceSliceTrustProjection` feeds the current `WorkspaceTrustEnvelope` and any current `AssistiveCapabilityTrustEnvelope`; trust slices may orient the operator on their own, but they may not independently restore writable posture, visible assistive actionability, quiet completion, or interruption pacing
* slices marked untrusted may stay visible for orientation or diagnostics, but they may not authorize routine mutation

#### 1.45A WorkspaceTrustEnvelope

Fields:

* `workspaceTrustEnvelopeId`
* `workspaceFamily = staff_review | support_ticket | hub_coordination | governance_review | ops_intervention`
* `workspaceRef`
* `taskOrCaseRef`
* `workspaceConsistencyProjectionRef`
* `workspaceSliceTrustProjectionRef`
* `primaryActionLeaseRef`
* `requestLifecycleLeaseRef`
* `focusProtectionLeaseRef`
* `protectedCompositionStateRef`
* `taskCompletionSettlementEnvelopeRef`
* `surfaceRuntimeBindingRef`
* `surfacePublicationRef`
* `runtimePublicationBundleRef`
* `selectedAnchorRef`
* `selectedAnchorTupleHashRef`
* `sourceQueueRankSnapshotRef`
* `continuityEvidenceRef`
* `consistencyTupleHash`
* `trustTupleHash`
* `envelopeState = interactive | observe_only | stale_recoverable | recovery_required | reassigned`
* `mutationAuthorityState = live | frozen | blocked`
* `interruptionPacingState = live | buffered | blocking_only | recovery_only`
* `completionCalmState = not_eligible | pending_settlement | eligible | blocked`
* `blockingReasonRefs[]`
* `computedAt`

Semantics:

* `WorkspaceTrustEnvelope` is the sole authority for whether a human-review workspace may appear writable, interruption-buffered, or calmly complete; queue rows, task canvas, interruption digest, `DecisionDock`, assistive stage, and next-task launch may not appear healthier or more actionable than the current envelope
* `envelopeState = interactive` is legal only when the bound consistency projection is current enough, the bound slice-trust projection still permits interactive posture, the bound publication tuple is live, and any current action lease still matches the governing ownership and anchor tuple
* `mutationAuthorityState` is derived from the same envelope, not from queue-row state, local draft acknowledgment, cached review version, or detached trust badges; if ownership, review version, publication, trust, lineage, or selected-anchor truth drifts, mutation must freeze in place immediately
* `interruptionPacingState` is derived from `WorkspaceFocusProtectionLease`, `ProtectedCompositionState`, and blocking deltas; queue churn, anomaly promotion, assistive escalation, and background next-task warm paths may not bypass that pacing by route-local policy
* `completionCalmState` is derived from the current `TaskCompletionSettlementEnvelope`, continuity evidence, and next-task launch eligibility; local success, queue reorder, projection visibility, or accepted-for-processing posture may widen pending explanation but may not restore quiet completion or launch the next task early
* support, hub, governance, and operations workspaces may specialize their producer projections or primary leases, but they must still materialize one current `WorkspaceTrustEnvelope` rather than inventing route-local calmness or writability rules

#### 1.45B AssistiveCapabilityTrustEnvelope

Fields:

* `assistiveCapabilityTrustEnvelopeId`
* `assistiveSessionRef`
* `capabilityCode`
* `surfaceMode = same_shell_companion | standalone_control`
* `assistiveSurfaceBindingRef`
* `assistiveInvocationGrantRef`
* `assistiveRunSettlementRef`
* `assistiveVisibilityPolicyRef`
* `assistiveCapabilityWatchTupleRef`
* `assistiveCapabilityTrustProjectionRef`
* `assistiveProvenanceEnvelopeRefs[]`
* `assistiveConfidenceDigestRefs[]`
* `assistiveFreezeFrameRef`
* `assistiveKillSwitchStateRef`
* `assistiveReleaseFreezeRecordRef`
* `assistiveFreezeDispositionRef`
* `owningShellTrustRef`
* `staffWorkspaceConsistencyProjectionRef`
* `workspaceSliceTrustProjectionRef`
* `workspaceTrustEnvelopeRef`
* `reviewActionLeaseRef`
* `surfaceRouteContractRef`
* `surfacePublicationRef`
* `runtimePublicationBundleRef`
* `releaseRecoveryDispositionRef`
* `assistiveContinuityEvidenceProjectionRef`
* `continuityEvidenceRef`
* `selectedAnchorRef`
* `selectedAnchorTupleHashRef`
* `draftInsertionPointRef`
* `draftPatchLeaseRef`
* `watchTupleHash`
* `policyBundleRef`
* `entityContinuityKey`
* `trustState = trusted | degraded | quarantined | shadow_only | frozen`
* `surfacePostureState = interactive | observe_only | provenance_only | placeholder_only | hidden`
* `actionabilityState = enabled | regenerate_only | observe_only | blocked_by_policy | blocked`
* `confidencePostureState = conservative_band | suppressed | hidden`
* `completionAdjacencyState = blocked | observe_only | allowed`
* `blockingReasonRefs[]`
* `computedAt`

Semantics:

* `AssistiveCapabilityTrustEnvelope` is the sole authority for whether an assistive companion or control surface may appear renderable, confidence-bearing, insert-ready, regenerate-only, or completion-adjacent; raw model output, cached watch posture, local freeze ribbons, and feature flags may not imply healthier state on their own
* capability availability, intended-use approval, publication posture, trust state, shell continuity, and visible actionability are separate producers that converge only through this envelope; one producer staying green may not silently widen another producer's posture
* `surfacePostureState = interactive` is legal only when the bound `AssistiveSurfaceBinding`, `AssistiveInvocationGrant`, `AssistiveRunSettlement`, `AssistiveVisibilityPolicy`, current trust projection, current shell-truth contract, current publication tuple, selected-anchor tuple, and any active insertion target all still agree and `trustState = trusted`
* `trustState = degraded | quarantined | shadow_only | frozen` must map to governed posture rather than improvised UI behavior: degraded assistive truth may show observe-only summary or provenance plus governed regenerate or recovery, quarantined and shadow-only posture may not imply clinical trust or live insertion, and frozen posture may preserve visible provenance only under the current `AssistiveFreezeDisposition`
* `actionabilityState` and `completionAdjacencyState` are derived from the same envelope, not from a live artifact body, stale insertion lease, local acknowledgement, or capability badge; accept, insert, regenerate, dismiss, export, browser-handoff, and completion-adjacent affordances must freeze immediately when trust, publication, continuity, selected-anchor, or insertion-target truth drifts
* confidence and provenance posture derive from the current envelope as well; raw probabilities, success-green semantics, detached model labels, or stale provenance footers may not overclaim certainty once trust, publication, or continuity posture has degraded
* kill switches, release freezes, shadow-only rollout posture, and governed recovery must materialize through the same envelope so the shell degrades in place rather than silently hiding assistive context or leaving stale controls armed

#### 1.45C AssistiveFeedbackChain

Fields:

* `assistiveFeedbackChainId`
* `assistiveSessionRef`
* `assistiveCapabilityTrustEnvelopeRef`
* `artifactRef`
* `artifactHash`
* `capabilityCode`
* `taskRef`
* `routeIntentBindingRef`
* `selectedAnchorRef`
* `reviewVersionRef`
* `decisionEpochRef`
* `policyBundleRef`
* `lineageFenceEpoch`
* `actionRecordRefs[]`
* `latestActionRecordRef`
* `overrideRecordRefs[]`
* `currentOverrideRecordRef`
* `approvalGateAssessmentRefs[]`
* `currentApprovalGateAssessmentRef`
* `currentFinalHumanArtifactRef`
* `feedbackEligibilityFlagRef`
* `incidentLinkRefs[]`
* `supersedesFeedbackChainRef`
* `supersededByFeedbackChainRef`
* `chainState = in_review | approval_pending | settled_clean | adjudication_pending | excluded | revoked | superseded`
* `openedAt`
* `settledAt`
* `revokedAt`

Semantics:

* `AssistiveFeedbackChain` is the sole end-to-end contract that binds a visible assistive artifact to the human gestures, override reasoning, approval burden, final human artifact truth, incident linkage, and training eligibility that follow from it
* one visible assistive artifact revision under one selected-anchor, review-version, decision-epoch, and policy tuple may have only one current feedback chain; regenerate, artifact-hash change, or lineage supersession must append a superseding chain rather than mutating the prior chain in place
* training, adjudication, incident review, and replay may reason only from the chain's bound action, override, approval, final-artifact, and settlement evidence; analytics counts, missing edits, or raw model-output presence are not substitutes

#### 1.45A SelfCareBoundaryDecision

Fields:

* `selfCareBoundaryDecisionId`
* `requestRef`
* `evidenceSnapshotRef`
* `decisionEpochRef`
* `decisionSupersessionRecordRef`
* `decisionState = self_care | admin_resolution | clinician_review_required | blocked_pending_review`
* `clinicalMeaningState = informational_only | bounded_admin_only | clinician_reentry_required`
* `operationalFollowUpScope = none | self_serve_guidance | bounded_admin_resolution`
* `adminMutationAuthorityState = none | bounded_admin_only | frozen`
* `reasonCodeRefs[]`
* `adminResolutionSubtypeRef`
* `routeIntentBindingRef`
* `selectedAnchorRef`
* `lineageFenceEpoch`
* `dependencySetRef`
* `adviceRenderSettlementRef`
* `adminResolutionCaseRef`
* `selfCareExperienceProjectionRef`
* `adminResolutionExperienceProjectionRef`
* `reopenTriggerRefs[]`
* `reopenState = stable | reopen_required | reopened | blocked_pending_review`
* `boundaryState = live | superseded | reopened | blocked`
* `boundaryTupleHash`
* `compiledPolicyBundleRef`
* `decidedAt`

Semantics:

* is the sole classifier for whether the request remains informational self-care, enters bounded admin-resolution, or must reopen clinician-governed review
* route labels, patient-safe wording, subtype names, and child-route families may soften presentation, but they may not redefine self-care versus admin consequence once the tuple is published
* self-care issue, advice render, admin notify, and admin completion may proceed only while the current unsuperseded `DecisionEpoch`, `lineageFenceEpoch`, and `boundaryTupleHash` still match the bound route and mutation authority

#### 1.45B AdviceAdminDependencySet

Fields:

* `adviceAdminDependencySetId`
* `requestRef`
* `boundaryDecisionRef`
* `boundaryTupleHash`
* `reachabilityDependencyRef`
* `contactRepairJourneyRef`
* `deliveryDisputeRef`
* `consentCheckpointRef`
* `identityRepairCaseRef`
* `externalDependencyRef`
* `dominantRecoveryRouteRef`
* `reopenTriggerRefs[]`
* `clinicalReentryTriggerRefs[]`
* `dependencyState = clear | repair_required | disputed | blocked_pending_identity | blocked_pending_consent | blocked_pending_external_confirmation`
* `reopenState = stable | reopen_required | reopened | blocked_pending_review`
* `evaluatedAt`

Semantics:

* is the canonical reopen and blocker fence for self-care advice and bounded admin follow-up
* dependency repair may explain why work is blocked, but only this set may say whether bounded admin action is still legal or whether the request has crossed back into clinician-governed review

#### 1.45C AdviceRenderSettlement

Fields:

* `adviceRenderSettlementId`
* `boundaryDecisionRef`
* `boundaryTupleHash`
* `decisionEpochRef`
* `decisionSupersessionRecordRef`
* `adviceBundleVersionRef`
* `adviceVariantSetRef`
* `routeIntentBindingRef`
* `commandActionRef`
* `commandSettlementRef`
* `surfaceRouteContractRef`
* `surfacePublicationRef`
* `runtimePublicationBundleRef`
* `dependencySetRef`
* `clinicalMeaningState`
* `operationalFollowUpScope`
* `reopenState`
* `renderState = renderable | withheld | invalidated | superseded | quarantined`
* `trustState = trusted | degraded | quarantined`
* `artifactPresentationContractRef`
* `transitionEnvelopeRef`
* `recoveryDispositionRef`
* `visibilityTier`
* `summarySafetyTier`
* `placeholderContractRef`
* `recoveryRouteRef`
* `settledAt`

Semantics:

* is the authoritative settlement for patient-visible self-care advice render, withholding, invalidation, supersession, or quarantine
* every visible advice artifact, leaflet handoff, or summary-first advice state must echo the current `boundaryTupleHash`; accepted render on an older or mismatched tuple must settle `stale_recoverable` or invalidate rather than retargeting patient consequence

#### 1.45D SelfCareExperienceProjection

Fields:

* `selfCareExperienceProjectionId`
* `requestRef`
* `boundaryDecisionRef`
* `boundaryTupleHash`
* `decisionEpochRef`
* `adviceRenderSettlementRef`
* `dependencySetRef`
* `adminResolutionCaseRef`
* `patientShellConsistencyProjectionRef`
* `patientEmbeddedSessionProjectionRef`
* `consistencyProjectionRef`
* `routeFamilyRef`
* `surfaceRouteContractRef`
* `surfacePublicationRef`
* `runtimePublicationBundleRef`
* `transitionEnvelopeRef`
* `selectedAnchorRef`
* `clinicalMeaningState`
* `operationalFollowUpScope`
* `adminMutationAuthorityState = none | bounded_admin_only | blocked`
* `boundaryReopenState = stable | reopen_required | reopened | blocked_pending_review`
* `releaseState`
* `visibilityTier`
* `summarySafetyTier`
* `placeholderContractRef`
* `routeFreezeDispositionRef`
* `dominantNextActionRef`
* `projectionState = fresh | stale | recovery_required`
* `computedAt`

Semantics:

* is the patient- and staff-facing self-care surface adapter over the current boundary decision
* informational advice copy, safety-net summary, and any bounded admin handoff placeholder must all read from the same `boundaryTupleHash`, `clinicalMeaningState`, and `operationalFollowUpScope`; otherwise the experience must degrade to bounded recovery instead of letting wording imply a different class of work

#### 1.45E AdminResolutionCase

Fields:

* `adminResolutionCaseId`
* `requestRef`
* `requestLineageRef`
* `lineageCaseLinkRef`
* `sourceTriageTaskRef`
* `adminResolutionSubtypeRef`
* `boundaryDecisionRef`
* `boundaryTupleHash`
* `clinicalMeaningState`
* `operationalFollowUpScope`
* `adminMutationAuthorityState = bounded_admin_only | frozen`
* `decisionEpochRef`
* `decisionSupersessionRecordRef`
* `policyBundleRef`
* `lineageFenceEpoch`
* `caseVersionRef`
* `currentOwnerRef`
* `waitingState = none | awaiting_internal_action | awaiting_external_dependency | awaiting_practice_action | patient_document_return | identity_verification`
* `currentActionRecordRef`
* `completionArtifactRef`
* `dependencySetRef`
* `reopenState`
* `experienceProjectionRef`
* `openedAt`
* `closedAt`

Semantics:

* is the canonical bounded admin follow-up aggregate for request work that remains operational and non-clinical
* subtype labels, queue names, or soft wording may not widen this case into clinical meaning; once `clinicalMeaningState != bounded_admin_only` or `reopenState != stable`, the case may remain visible as provenance but further admin consequence must freeze

#### 1.45F AdminResolutionSettlement

Fields:

* `adminResolutionSettlementId`
* `adminResolutionCaseRef`
* `boundaryDecisionRef`
* `boundaryTupleHash`
* `decisionEpochRef`
* `decisionSupersessionRecordRef`
* `commandSettlementRef`
* `transitionEnvelopeRef`
* `dependencySetRef`
* `result = queued | patient_notified | waiting_dependency | completed | reopened_for_review | blocked_pending_safety | stale_recoverable`
* `trustState = trusted | degraded | quarantined`
* `completionArtifactRef`
* `recoveryDispositionRef`
* `visibilityTier`
* `summarySafetyTier`
* `placeholderContractRef`
* `recoveryRouteRef`
* `recordedAt`

Semantics:

* is the sole authoritative settlement for bounded admin follow-up state changes, waiting posture, patient notification, completion, and reopen
* `completed` is legal only when the settlement and matching completion artifact both echo the current `boundaryTupleHash`; local UI acknowledgement or subtype-local workflow progress is not sufficient

#### 1.45G AdminResolutionExperienceProjection

Fields:

* `adminResolutionExperienceProjectionId`
* `adminResolutionCaseRef`
* `boundaryDecisionRef`
* `boundaryTupleHash`
* `decisionEpochRef`
* `currentSettlementRef`
* `completionArtifactRef`
* `dependencySetRef`
* `patientShellConsistencyProjectionRef`
* `patientEmbeddedSessionProjectionRef`
* `staffWorkspaceConsistencyProjectionRef`
* `workspaceSliceTrustProjectionRef`
* `consistencyProjectionRef`
* `routeFamilyRef`
* `surfaceRouteContractRef`
* `surfacePublicationRef`
* `runtimePublicationBundleRef`
* `transitionEnvelopeRef`
* `selectedAnchorRef`
* `clinicalMeaningState`
* `operationalFollowUpScope`
* `adminMutationAuthorityState = bounded_admin_only | frozen`
* `boundaryReopenState = stable | reopen_required | reopened | blocked_pending_review`
* `releaseState`
* `trustState = trusted | degraded | quarantined`
* `visibilityTier`
* `summarySafetyTier`
* `placeholderContractRef`
* `routeFreezeDispositionRef`
* `dominantNextActionRef`
* `projectionState = fresh | stale | recovery_required`
* `computedAt`

Semantics:

* is the only patient- and staff-visible admin follow-up shell allowed for this lineage
* completion wording, waiting posture, and bounded operational next steps must derive from the same `boundaryTupleHash` and `adminMutationAuthorityState`; if the boundary reopens or clinician re-entry is required, the projection must preserve provenance but freeze further admin consequence in place
* patient and staff surfaces may adapt wording, but they may not disagree about whether the current tuple is still informational self-care, bounded admin-only work, or reopened clinician review

#### 1.46 ReviewActionLease

Fields:

* `reviewActionLeaseId`
* `actionType = claim | start_review | request_more_info | send_more_info | draft_insert | commit_decision | issue_advice | complete_admin_resolution | send_message | next_task_launch`
* `taskId`
* `sourceQueueKey`
* `reviewVersionRef`
* `workspaceSnapshotVersion`
* `queueChangeBatchRef`
* `selectedAnchorRef`
* `lineageFenceEpoch`
* `workspaceConsistencyProjectionRef`
* `issuedToActorRef`
* `ownershipEpochRef`
* `fencingToken`
* `staleOwnerRecoveryRef`
* `issuedAt`
* `expiresAt`
* `leaseState`

Semantics:

* every staff mutation must hold one live review-action lease
* review-action lease authority is subordinate to the current `RequestLifecycleLease`; `ownershipEpochRef` and `fencingToken` must still match the governing writable owner before the command is dispatched
* stale queue rank, review version, lineage drift, or stale ownership must fail closed before the command is dispatched
* lease expiry or takeover must preserve the current shell and reopen through canonical stale-owner recovery rather than detached toast-level failure

#### 1.47 WorkspaceFocusProtectionLease

Fields:

* `focusProtectionLeaseId`
* `taskId`
* `reviewActionLeaseRef`
* `requestLifecycleLeaseRef`
* `focusReason = composing | comparing | confirming | assistive_review | delivery_dispute_review | reading_delta`
* `reviewVersionRef`
* `ownershipEpochRef`
* `fencingToken`
* `lineageFenceEpoch`
* `workspaceConsistencyProjectionRef`
* `workspaceSliceTrustProjectionRef`
* `surfaceRuntimeBindingRef`
* `selectedAnchorRef`
* `compareAnchorRefs[]`
* `protectedRegionRef`
* `priorQuietRegionRef`
* `bufferedDeltaRefs[]`
* `bufferedQueueBatchRefs[]`
* `releaseGateRef`
* `leaseState = active | release_pending | invalidated | released | superseded`
* `invalidatingDriftState = none | ownership | lineage | review_version | publication | trust | anchor_invalidated | compare_target_invalidated | settlement_drift`
* `startedAt`
* `releaseRequestedAt`
* `releasedAt`

Semantics:

* when protected work is active, disruptive queue, evidence, or assistive deltas must buffer rather than displacing the current decision context
* ownership, lineage, review-version, publication, trust, settlement, anchor, or compare-target drift may not silently replace the current composer, compare surface, or consequence review; the lease must instead become `invalidated`, freeze mutation in place, and preserve the protected context until explicit recovery, reacquire, or release
* release of the focus-protection lease is explicit and bounded by `releaseGateRef`; silent loss of composition context, quiet-return target, or reading position is forbidden

#### 1.47A ProtectedCompositionState

Fields:

* `protectedCompositionStateId`
* `taskId`
* `focusProtectionLeaseRef`
* `compositionMode = drafting | compare_review | delta_review | approval_review | handoff_review | consequence_confirm | delivery_dispute_review`
* `draftArtifactRefs[]`
* `primarySelectedAnchorRef`
* `compareAnchorRefs[]`
* `assistiveInsertionPointRef`
* `primaryReadingTargetRef`
* `quietReturnTargetRef`
* `allowedLivePatchMode = blocking_only | non_disruptive_plus_blocking | local_ack_only`
* `stateValidity = live | stale_recoverable | recovery_only`
* `releaseGateRef`
* `startedAt`
* `releasedAt`

Semantics:

* every active `WorkspaceFocusProtectionLease` must pair with exactly one `ProtectedCompositionState`
* draft text, compare subjects, selected anchor, insertion point, and current reading target must remain stable while the state is `live | stale_recoverable`; incoming deltas may annotate or invalidate them, but they may not retarget to a different editor, comparison subject, or neighboring task
* if the state becomes `stale_recoverable | recovery_only`, the shell must keep the protected work visible as frozen provenance with exact recovery or recheck actions; generic stale panels and silent resets are forbidden
* once `releaseGateRef` clears and no blocker remains, the shell must restore `quietReturnTargetRef`, the current selected anchor, and the last safe reading target rather than dropping to a generic task default

#### 1.48 TaskCompletionSettlementEnvelope

Fields:

* `taskCompletionSettlementEnvelopeId`
* `taskId`
* `actionType`
* `selectedAnchorRef`
* `sourceQueueRankSnapshotRef`
* `localAckState`
* `authoritativeSettlementState = pending | settled | recovery_required | manual_handoff_required | stale_recoverable`
* `nextOwnerRef`
* `closureSummaryRef`
* `blockingReasonRefs[]`
* `nextTaskLaunchState = blocked | gated | ready | launched`
* `nextTaskLaunchLeaseRef`
* `experienceContinuityEvidenceRef`
* `settledAt`

Semantics:

* task closure, downstream handoff, and next-task launch must wait for authoritative settlement or governed recovery
* local success messaging is insufficient to collapse the current task or advance the workspace
* the next-task CTA must remain in one stable shell location with exact blocking reasons until `nextTaskLaunchState = ready`; settlement lag may not auto-advance, hide blockers, or silently retarget the recommended next task
* departing-task summary and anchor context must remain available until an explicit next-task launch succeeds or the operator dismisses the return stub under governed recovery

#### 1.48A NextTaskPrefetchWindow

Fields:

* `nextTaskPrefetchWindowId`
* `sourceTaskRef`
* `launchContextRef`
* `candidateTaskRefs[]`
* `sourceQueueKey`
* `sourceRankSnapshotRef`
* `continuityEvidenceRef`
* `prefetchBudget = summary_only | summary_plus_delta_stub`
* `prefetchState = idle | active | cancelled | stale | blocked | warmed`
* `blockingReasonRefs[]`
* `issuedAt`
* `expiresAt`

Semantics:

* background prefetch may warm only summary-first queue and task context for explicit next-task candidates; it may not mint `ReviewActionLease`, clear changed-since-seen state, hydrate heavy media, reserve ownership, or impersonate task-open
* snapshot drift, settlement drift, continuity-evidence drift, active focus protection, or operator scan cancellation must cancel the window and degrade next-task readiness to blocked or recovery posture rather than launching stale work
* prefetched data is an optimization hint only; authoritative launch still requires one explicit `NextTaskLaunchLease` bound to the current completion settlement and continuity evidence

### 2. Required platform services

#### 2.1 LifecycleCoordinator

Responsibilities:

* is the sole logical policy authority for episode closure and governed reopen
* runs as a replicated deterministic state machine partitioned by `episodeId`
* issues and validates `LineageFence.currentEpoch`
* materializes and clears `currentConfirmationGateRefs[]` and `currentClosureBlockerRefs[]` from leases, repair cases, duplicate review, fallback recovery, grants, and degraded external promises
* persists `RequestClosureRecord`
* may set `Request.workflowState = closed` only after successful close evaluation

Logical centralization is mandatory; single-instance operational fragility is forbidden.

#### 2.2 ReservationAuthority

Responsibilities:

* is the sole serializer for any patient-facing or staff-facing claim on `canonicalReservationKey`
* arbitrates local booking, waitlist offers, staff booking, and hub booking
* owns `CapacityReservation` lifecycle
* forbids false exclusivity when only nonexclusive or weak supply evidence exists

#### 2.2A IdentityBindingAuthority

Responsibilities:

* is the sole serializer for `IdentityBinding` candidate, provisional, verified, claimed, corrected, and revoked versions
* freezes one candidate-set and match-evidence basis before any binding version is settled
* advances `Episode.currentIdentityBindingRef`, `Request.currentIdentityBindingRef`, derived `patientRef`, `identityState`, and subject-binding version only through compare-and-set against the current lineage binding
* rejects direct binding writes from auth handlers, telephony workers, support tools, imports, backfills, or projection rebuilds; those paths may submit intents only
* emits the binding supersession chain used by `PatientLink`, `SessionGovernor`, `AccessGrantService`, projections, and repair workflows

#### 2.3 AccessGrantService

Responsibilities:

* issues, redeems, revokes, rotates, and supersedes all patient-access grants
* issues one immutable `AccessGrantScopeEnvelope` for every redeemable grant and binds it to the current governing object, route family, and runtime tuple
* settles one exact-once `AccessGrantRedemptionRecord` before session creation, route re-entry, or replacement-grant issuance proceeds
* emits `AccessGrantSupersessionRecord` for grant rotation, reissue, drift invalidation, claim uplift, draft promotion, logout, and repair-driven revocation
* enforces family-specific subject binding, replay control, and scope narrowing
* pins grant ceilings to the valid `RouteIntentBinding` and never widens route or embedded capability scope through redemption alone
* blocks grant replay, family drift, and scope widening
* treats `manual_only` as a no-grant routing outcome
* returns the current redemption or supersession settlement on exact replay instead of executing a second side effect
* may redeem URL-borne grants only into a current `Session` posture decided by `SessionGovernor`; anonymous or mismatched sessions may not be upgraded in place

#### 2.3A AuthBridge

Responsibilities:

* freezes `AuthScopeBundle` and `PostAuthReturnIntent` before redirect
* validates NHS login callback state, nonce, PKCE, issuer, audience, and token times
* settles `AuthTransaction` exactly once and never emits local session or claim side effects directly

#### 2.3B SessionGovernor

Responsibilities:

* issues, rotates, reuses, restricts, and terminates local `Session` rows
* emits `SessionEstablishmentDecision` and `SessionTerminationSettlement`
* advances `sessionEpoch` and session cookies on subject switch, privilege elevation, binding-version advance, wrong-patient hold, or cookie-key mismatch
* forbids anonymous, stale, or mismatched-session upgrade in place

#### 2.3C EvidenceAssimilationCoordinator

Responsibilities:

* is the sole gateway for post-submit evidence ingress on active lineages
* settles one `EvidenceAssimilationRecord` and one `MaterialDeltaAssessment` for patient replies, callback outcomes, booking narratives, pharmacy returns, support-side structured capture, adapter observations, late artifacts, async enrichment, and operator overrides
* decides whether the ingress becomes `new_snapshot`, `derivative_only`, `replay_existing`, or `hold_pending_review` under the immutable evidence rules
* coalesces exact replay, semantic replay, and overlapping inflight assimilation for the same lineage so re-safety triggers remain monotonic and exact-once
* invokes `SafetyOrchestrator` only when `MaterialDeltaAssessment.triggerDecision = re_safety_required | blocked_manual_review | coalesced_with_pending_preemption`
* forbids domain-local workflow advance, closure, or calm projection refresh while the owning assimilation record remains pending or blocked

#### 2.4 SafetyOrchestrator

Responsibilities:

* classifies inbound evidence after `EvidenceAssimilationCoordinator` has frozen the candidate snapshot or event batch and settled `MaterialDeltaAssessment`
* consumes settled reachability posture from `ReachabilityAssessmentRecord`
* maintains the canonical feature-support lattice, contradiction state, and dependency-trigger graph for each request
* appends immutable `EvidenceClassificationDecision`, `SafetyPreemptionRecord`, `SafetyDecisionRecord`, and when required `UrgentDiversionSettlement`
* re-runs canonical safety on materially new evidence using incremental impacted-rule recomputation rather than whole-pack rescoring when only a bounded feature delta changed
* computes calibrated urgent and residual-risk probabilities from authored rule packs without allowing soft calibration to override any hard-stop rule
* advances `Request.currentEvidenceClassificationRef`, `currentSafetyPreemptionRef`, `currentSafetyDecisionRef`, `currentUrgentDiversionSettlementRef`, and `safetyDecisionEpoch`
* prevents routine continuation until safety or contact-risk resolution is complete
* supports conservative urgent handling before full evidence-readiness completes

#### 2.4A ReachabilityGovernor

Responsibilities:

* freezes `ContactRouteSnapshot` before any delivery, callback, reminder, or pharmacy promise depends on a route
* appends `ReachabilityObservation` from verification, delivery evidence, bounce, preference change, demographic drift, support capture, and manual dispute sources
* settles one append-only `ReachabilityAssessmentRecord` for each materially changed dependency posture and advances `ReachabilityDependency.currentReachabilityAssessmentRef`, `routeAuthorityState`, `routeHealthState`, `deliveryRiskState`, `repairState`, and `reachabilityEpoch`
* rejects route-health inference from transport acknowledgement, send attempts, or mutable profile rows alone
* returns the current assessment on exact replay or repeated observation ingest instead of creating conflicting dependency posture

#### 2.5 IdentityRepairOrchestrator

Responsibilities:

* opens and advances `IdentityRepairCase`
* records `IdentityRepairSignal` and settles one `IdentityRepairFreezeRecord`
* freezes access and outward comms where required
* revokes derivative grants and supersedes stale route intents
* enumerates `IdentityRepairBranchDisposition` for every affected downstream branch
* rebuilds projections, coordinates downstream compensation, and emits `IdentityRepairReleaseSettlement`

#### 2.6 VisibilityPolicyCompiler

Responsibilities:

* compiles per-audience and per-purpose field allow-lists, section contracts, preview contracts, minimum-necessary contracts, and artifact mode contracts
* rejects projection contracts that rely on collapse-only hiding or on route-family-coupled redaction branches
* emits testable schemas for hub, servicing site, support, and patient audiences

#### 2.6A ActingContextGovernor

Responsibilities:

* materializes `StaffIdentityContext`, `ActingContext`, `ActingScopeTuple`, and any governance-specialized scope token from the authenticated subject, approved memberships, published visibility coverage rows, and current runtime bindings
* supersedes the current tuple whenever tenant scope, organisation scope, environment, policy plane, purpose of use, elevation posture, break-glass state, or required coverage row changes
* writes `ActingContextDriftRecord` and freezes writable posture in place when organisation switch, elevation expiry, break-glass revocation, or visibility drift invalidates the current tuple
* refuses raw role-string, ambient session, or browser-local tenant selectors as authority for governance approval, support recovery, hub coordination, or cross-organisation visibility
* keeps blast radius explicit for `multi_tenant` and `platform` scope so release, approval, and authority-link work cannot silently widen beyond the current tuple

#### 2.7 AssuranceSupervisor

Responsibilities:

* enforces minimum pre-live control pack
* quarantines bad assurance producers at namespace or producer scope rather than globally blinding observability
* materializes and refreshes `AssuranceSliceTrustRecord`
* materializes and refreshes the current `AssuranceEvidenceGraphSnapshot` and `AssuranceGraphCompletenessVerdict` so assurance packs, replay, exports, incidents, CAPA, retention, and recovery artifacts consume one admissibility graph instead of parallel local joins
* prevents `degraded` or `quarantined` assurance slices from being treated as authoritative operational truth
* blocks sign-off, export, replay exit, deletion, and archive certification when the current assurance graph is stale, blocked, cross-scope, or structurally incomplete even if the underlying artifacts still exist
* monitors queue lag, lease lag, public-link state, and restore readiness

#### 2.8 ScopedMutationGate

Responsibilities:

* is the sole mutation gateway for patient, staff, support, hub, and operations commands after initial ingest
* resolves acting context, role scope, break-glass state, the current `ActingScopeTuple`, grant family, and minimum required assurance before writable state is loaded
* resolves the current `RouteIntentBinding`, its exact target tuple, the current release tuple, and the current channel-compatibility contract before write access is granted
* enforces expiry, supersession, replay control, rate limits, idempotency keys, exact action-to-governing-object binding, and governing-version parity
* rejects heuristic or ambiguous governing-object selection; if more than one current candidate could satisfy a route family plus `actionScope`, the gateway must require explicit reissued disambiguation instead of guessing
* writes one `CommandActionRecord` and returns one `CommandSettlementRecord` for every post-submit mutation path
* validates `LineageFence.currentEpoch` and command-following freshness before any invariant-changing mutation is dispatched
* freezes mutation in place when `ActingScopeTuple`, governance scope, organisation switch generation, purpose-of-use row, elevation posture, or minimum-necessary contract drifts under the visible shell
* routes stale, orphaned, expired, superseded, or target-drifted actions to recovery or re-check rather than mutating state from a stale view

#### 2.9 ExceptionOrchestrator

Responsibilities:

* owns `FallbackReviewCase`, degraded transport and booking exceptions, unresolved confirmation gates, and contact-route repair escalation
* fans failures to the correct owning queue or recovery flow without using generic triage as a catch-all
* ensures unresolved manual, degraded, or disputed states remain visible and closure-blocking until policy explicitly downgrades them

#### 2.10 RuntimeContractPublisher

Responsibilities:

* compiles and publishes `AudienceVisibilityCoverage`, `AudienceSurfaceRouteContract`, `AudienceSurfacePublicationRef`, `DesignContractPublicationBundle`, `RuntimePublicationBundle`, and `ReleaseRecoveryDisposition` for every live audience surface
* compiles and publishes one `AudienceSurfaceRuntimeBinding` and one `ReleasePublicationParityRecord` for every live audience surface and route family
* compiles and publishes one `DesignContractLintVerdict` for every published design-contract bundle and active surface tuple
* marks publication stale, conflicting, withdrawn, or recovery-only when visibility-coverage hashes, route-contract digests, design-contract digests, lint verdicts, settlement schemas, recovery dispositions, parity verdicts, or provenance state drift
* exposes the active runtime contract set to gateways, shells, operations, governance, and support so writable posture can be proven rather than inferred

#### 2.10A ResilienceOrchestrator

Responsibilities:

* materializes and refreshes `OperationalReadinessSnapshot`, `RunbookBindingRecord`, `ResilienceSurfaceRuntimeBinding`, and `RecoveryControlPosture`
* opens, advances, and supersedes `RestoreRun`, `FailoverRun`, and `ChaosRun` under the current runtime tuple and current essential-function map
* refuses restore, failover, chaos, or recovery-pack mutation when publication, trust, freeze, runbook rehearsal, backup-manifest freshness, dependency coverage, or journey-recovery proof has drifted
* writes `ResilienceActionRecord`, returns `ResilienceActionSettlement`, and emits `RecoveryEvidenceArtifact` so operator acknowledgement cannot outrun authoritative recovery posture
* writes recovery evidence back into the assurance spine and invalidates stale readiness snapshots when a live tuple, watch tuple, recovery disposition, or rehearsal binding changes

#### 2.11 QueueRankingCoordinator

Responsibilities:

* evaluates queue eligibility from one consistent task, safety, trust, and policy fact cut under one active `QueueRankPlan`
* materializes `QueueRankSnapshot`, `QueueRankEntry`, and `QueueAssignmentSuggestionSnapshot`
* persists overload and fairness-merge state so projection rebuilds, worker restarts, and supervisor drill-down replay the same queue order
* ensures reviewer-specific assignment heuristics can advise, suggest, or governed-auto-claim only after canonical queue ordering is fixed
* supplies one committed rank snapshot to workbench projections, next-task launch, queue-change batching, and operations queue-pressure views so mixed-snapshot resorting is impossible

### 3. Non-negotiable invariants

1. One `Episode` represents one clinical episode.
2. One `Request` represents one governed submission lineage inside one `Episode`.
3. Drafts, telephony capture stubs, partial continuation flows, and evidence that is not yet safe to promote must live in `SubmissionEnvelope`, not in `Request`.
4. Authentication, phone verification, SMS continuation redemption, NHS App launch, or support intervention must not directly overwrite `Request.patientRef` or `Episode.patientRef`.
5. `patientRef` may only be established or corrected via governed `IdentityBinding` and, for post-bind corrections, `IdentityRepairCase`.
5A. `IdentityBinding.patientRef`, `ownershipState`, `bindingVersion`, and all derived lineage patient references may advance only through `IdentityBindingAuthority` compare-and-set on `currentIdentityBindingRef`; auth callbacks, telephony verification, support actions, imports, backfills, adapter callbacks, and projection rebuilds may submit evidence or intents, but they may not write binding truth directly.
5B. Any redeemable `AccessGrant` may authorize only the immutable `AccessGrantScopeEnvelope` it was issued with; one-time or rotating grants must settle through exactly one `AccessGrantRedemptionRecord`, and any replacement or invalidation must be evidenced by `AccessGrantSupersessionRecord` before the old grant stops being accepted.
6. `same_episode_candidate` is never merge-safe by itself.
7. Automatic attach is allowed only for strict idempotent retry or explicitly proven same-request continuation under the attach rules below.
8. Any clinically meaningful new evidence must create a new immutable snapshot and must pass through canonical safety preemption before routine flow continues.
8A. Any inbound evidence batch that can affect safety, reachability, or routine bypass must first settle one immutable `EvidenceClassificationDecision`; route-local heuristics, transport callbacks, or UI state may not silently downgrade evidence below the governed class.
8B. Any writable or calmly reassuring action must validate the current `Request.safetyDecisionEpoch` and current `SafetyDecisionRecord`; if the epoch advanced, a preemption remains pending, or urgent issuance is still unsettled, routine mutation and calm completion must fail closed.
8C. `Request.safetyState = urgent_diverted` is legal only after one `UrgentDiversionSettlement(settlementState = issued)` bound to the current `SafetyDecisionRecord`; urgent-required and urgent-issued are separate durable states.
8D. Unreadable, partially parsed, or degraded evidence that could still alter clinical or contact-safety meaning must fail closed to governed review or urgent handling; it may not be treated as `technical_metadata` or `screen_clear`.
8E. Any post-submit evidence ingress, including patient reply, callback outcome, support-side structured capture, booking narrative, pharmacy return, adapter observation, async enrichment, or operator override, must first settle one `EvidenceAssimilationRecord` and one `MaterialDeltaAssessment` before workflow, queue, or reassurance state may advance.
8F. `MaterialDeltaAssessment` is the only authority allowed to decide whether newly arrived post-submit evidence triggers canonical re-safety; domain-local “nonclinical enough” shortcuts are forbidden.
8G. While `EvidenceAssimilationRecord.assimilationState = pending_materiality | pending_classification | pending_preemption | blocked_manual_review`, calm queue eligibility, final downstream completion, and patient, staff, or support reassurance are forbidden even if the last settled safety decision was clear.
9. Any active `ReachabilityDependency` can convert delivery failure, contact-route change, or preference change into a preemption-triggering event, and the resulting blocker must bind to one `ContactRouteRepairJourney` rather than a detached settings detour.
9A. Any contact-route or deliverability judgement used by callback, messaging, booking, hub, pharmacy, support, or patient-shell logic must settle through the current `ContactRouteSnapshot` and `ReachabilityAssessmentRecord`; send attempts, transport acknowledgements, or mutable profile rows may not imply `routeHealthState = clear`.
9B. `ReachabilityAssessmentRecord.routeAuthorityState = stale_verification | stale_demographics | stale_preferences | disputed | superseded` must fail closed to `assessmentState = at_risk | blocked | disputed`; calm callback, reminder, waitlist, pharmacy, or outcome reassurance is forbidden until a newer assessment clears the dependency.
9C. Patient, staff, support, callback, booking, hub, and pharmacy projections that expose an active dependency must reference the same current `ReachabilityAssessmentRecord` or degrade to governed recovery; route-local health copies are forbidden.
10. Telephony and live-call channels must support a conservative urgent path before transcript readiness; urgent callers must not wait for transcript or manual audio review before urgent diversion can begin.
10A. `TelephonyEvidenceReadinessAssessment` is the only authority allowed to declare a phone capture `urgent_live_only`, `safety_usable`, `manual_review_only`, or `unusable_terminal`; recording availability, transcript job state, keypad completion, or continuation grant issuance alone are insufficient.
10B. Telephony may issue `continuation_seeded_verified` or `continuation_challenge` only from a settled `TelephonyContinuationEligibility` derived from the current `TelephonyEvidenceReadinessAssessment`; seeded continuation is forbidden while readiness is only `awaiting_recording | awaiting_transcript | awaiting_structured_capture | urgent_live_only | manual_review_only | unusable_terminal`.
11. No domain-local service may close an episode or request.
12. Only `LifecycleCoordinator` may set `Request.workflowState = closed`.
13. All long-running workflow branches must hold a `RequestLifecycleLease` with TTL, heartbeat, monotonic `ownershipEpoch`, and fencing, and stale-owner expiry must open governed recovery before work continues.
14. All cross-domain invariant-changing commands must present the current `LineageFence.currentEpoch`.
15. No user-facing flow may imply exclusivity unless `CapacityReservation.state = held` and the `CapacityIdentity` is strong enough to support exclusivity.
16. Weak or manual external dispatch or booking modes are degraded modes and must be modeled as such through `ExternalConfirmationGate`.
17. No pharmacy or hub case may auto-close from weakly correlated, email-only, shared-mailbox-only, or manually entered evidence without trusted correlation or governed human reconciliation.
18. Minimum-necessary access must be enforced before projection materialization, not only in presentation.
19. Patient-visible top-level state may be compressed into macro-states only if a secondary descriptor, awaited-party descriptor, and provisional-state flag remain visible when clinically or operationally necessary.
20. One prioritized next action may exist, but simultaneous blocking obligations must remain visible.
21. Unified timelines may exist, but typed subthreads must remain explicit where reply target, expiry, or owner semantics differ.
22. Urgent or decision-blocking deltas must not be silently buffered behind a subtle badge when a user is performing a safety-critical action.
23. Support actions that affect identity, access scope, or secure-link recovery require tiered access, just-in-time scope, and dual control where specified below.
23A. Governance, support, hub, servicing-site, and cross-organisation staff work must bind one current `ActingScopeTuple` and, where applicable, one current `GovernanceScopeToken`; ambient session role, raw tenant selector, or remembered organisation state is not sufficient authority.
23B. Organisation switch, tenant-scope change, purpose-of-use change, elevation expiry, break-glass revocation, or minimum-necessary coverage drift must supersede the current tuple and freeze mutation in place until the shell is revalidated under a fresh tuple.
24. No production traffic may be routed through this model until the minimum pre-live control pack in section 14 is active.
25. Every patient, staff, support, hub, or operations mutation after initial ingest must pass through `ScopedMutationGate`; direct mutation from a projection, recovered link, or client-side cache is forbidden.
25A. Any writable command must prove one exact target tuple across `RouteIntentBinding`, current governing object, current governing object version or fence, route-contract digest, parent anchor, any capability or action-routing projection, and the emitted `CommandActionRecord`; URL params, detached projection fragments, copied CTA state, or client-local caches may not supply missing authority.
25B. If multiple candidate governing objects, sibling records, or superseded versions could satisfy the same route family and `actionScope`, the system must require fresh explicit disambiguation and reissue `RouteIntentBinding`; nearest-match or last-viewed mutation is forbidden.
25C. `RouteIntentBinding`, capability projections, and action-routing projections that lack `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeContractDigestRef`, `parentAnchorRef`, or `routeIntentTupleHash` are `recovery_only` until reissued or backfilled under the current runtime contract.
25D. Any domain capability-resolution or adapter-selection record that can arm an external-effect mutation must bind the same target tuple plus its governing capability source and chosen provider-adapter contract. Route-local vendor checks, inferred integration modes, cached linkage hints, or copied CTA state may not substitute for the bound `providerCapabilityMatrixRef`, `bookingProviderAdapterBindingRef`, `adapterContractProfileRef`, and `capabilityTupleHash`.
25E. Search normalization, temporal handling, revalidation, reservation semantics, commit proof, and manage support for one booking or hub mutation must come from one current `BookingProviderAdapterBinding`. Adapters may translate and correlate supplier payloads only; they may not own ranking, waitlist fallback, policy choice, or patient-surface meaning.
26. Any unsafe, unreadable, malicious, or unsupported artifact must remain quarantined and may only proceed through `FallbackReviewCase` or an explicit governed recovery path; automatic discard is forbidden.
27. Any accepted user progress that later hits ingest or safety-engine failure must open `FallbackReviewCase`, issue a degraded receipt or recovery state, and surface visible work in the same lineage.
28. `DuplicateCluster(review_required)` must surface as explicit review work and invalidate any auto-attach or auto-merge assumption until resolved.
28A. Replay recognition, same-request attach, same-episode clustering, and related-episode linkage are separate authorities. `IdempotencyRecord` owns replay; `DuplicateResolutionDecision(decisionClass = same_request_attach)` owns same-request attach; `DuplicateCluster` owns review; none may silently stand in for the others.
28B. Automatic same-request attach is legal only when one immutable `DuplicatePairEvidence` proves the thresholds, one explicit continuity witness exists, and the winning candidate also beats every competing candidate request by the required `candidateMargin`; pairwise class probability alone is insufficient.
28C. Duplicate resolution must be append-only and reversible by supersession. If later evidence, review, or corrected calibration overturns a prior attach or separate decision, the platform must append a superseding `DuplicateResolutionDecision` and invalidate stale downstream assumptions rather than rewriting lineage history in place.
29. Any wrong-patient or identity-dispute signal must invalidate PHI-bearing transactional entry and attach lineage-level identity-hold metadata through `IdentityRepairCase`; in-place patient overwrite is forbidden.
29A. An active `IdentityRepairFreezeRecord(freezeState = active)` must suppress PHI-bearing visibility and writable action across patient, staff, support, hub, pharmacy, callback, and messaging surfaces unless the current projection is the governed identity-hold or repair workspace.
29B. Historical evidence, decisions, communications, and audit entries keep the `IdentityBinding` version and patient scope that were in force when they were recorded; correction may supersede visibility or require review, but it may not rewrite prior attribution in place.
29C. Any appointment, referral, callback promise, message thread, secure link, artifact, or outbound communication issued under a frozen binding must materialize one `IdentityRepairBranchDisposition` and be revalidated, compensated, or explicitly suppressed before release.
30. Delivery or contact-route failure on an active `ReachabilityDependency` must rotate stale grants, create or refresh the current `ContactRouteRepairJourney`, and surface explicit same-shell repair state; silent stale assurances and detached repair redirects are forbidden.
30A. Repair completion requires a fresh `ContactRouteSnapshot`, a fresh `ReachabilityAssessmentRecord(assessmentState = clear, routeAuthorityState = current)`, and a rebound dependency on the current `reachabilityEpoch`; editing a route row alone is insufficient.
31. No pharmacy dispatch or redispatch may occur without valid unexpired consent bound to the current provider, pathway, and referral scope.
32. Policy-bundle promotion must be staged with effective-at, canary, and rollback control; hidden mid-case rule drift is forbidden.
33. Bad or incompatible event producers must be quarantined with scoped replay; one poisoned stream must not block unrelated projections or assurance slices.
34. Mutations from stale or causally incomplete projections must be blocked or forced through a governed re-check before commit.
35. Expired, superseded, or orphaned transactional links may recover or rebind, but they may never mutate state directly.
35A. Auth callback, secure-link uplift, and continuation redemption may not directly establish writable or claim posture. They must first settle the current `CapabilityDecision`, `SessionEstablishmentDecision`, and `RouteIntentBinding`.
35B. Subject switch, privilege elevation, or binding-version advance must rotate the session identifier, CSRF secret, and `sessionEpoch`; anonymous or different-subject session upgrade in place is forbidden.
36. Every post-submit mutation must bind exactly one live `RouteIntentBinding`; stale session, subject, manifest, release, or channel posture may recover, but it may not mutate directly.
37. Every post-submit command that can alter user-visible state must yield an authoritative `CommandSettlementRecord`; optimistic UI state alone is never a durable outcome.
37A. Every post-submit evidence path that can alter safety, chronology, contradiction burden, reachability, or routine-bypass posture must yield one authoritative `EvidenceAssimilationRecord` and `MaterialDeltaAssessment`; optimistic projection refresh or local note capture alone is never a durable reason to skip re-safety.
38. Any embedded or channel-specific mutating surface must validate a compatible `ReleaseApprovalFreeze` and `ChannelReleaseFreezeRecord` before writable state is exposed.
39. `AssuranceSliceTrustRecord(trustState = degraded | quarantined)` may inform diagnostics, but it may not serve as authoritative supply, dispatch, assistive writeback, or promotion truth until trust is restored.
40. Any patient home, spotlight, or portal section CTA that can launch live work must derive actionability from `PatientNavUrgencyDigest` and return posture from `PatientNavReturnContract`; card-local heuristics are forbidden.
40A. Patient route entry, refresh, back-forward restore, deep-link resolution, step-up return, and recovery resume must resolve the current `PatientShellConsistencyProjection`, `PatientNavReturnContract`, and applicable continuity evidence before ordinary CTA truth appears; browser history and route aliases may not define shell continuity on their own.
40B. Patient home spotlight selection and quiet-home posture must derive from one current `PatientSpotlightDecisionProjection`, `PatientSpotlightDecisionUseWindow`, and `PatientQuietHomeDecision`; projection freshness churn, empty-feed gaps, or per-card scores may not rotate the spotlight or invent calmness.
40C. A home spotlight CTA may be live only while the selected entity's own capability lease, writable-eligibility fence, release-trust verdict, and continuity evidence still validate the same `selectionTupleHash`; if that tuple drifts, the same card must downgrade in place rather than handing control to a fresher optimistic entity.
41. Any record-origin action that can enter booking, callback, messaging, or repair flow must carry `RecordActionContextToken` and `RecoveryContinuationToken`; loss of the originating record anchor is forbidden.
42. Conversation preview state, unread state, and reply actionability must derive from `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement`; transport delivery or local acknowledgement alone is insufficient.
43. Support replay may not restore live mutation posture until `SupportReplayRestoreSettlement.result = live_restored` and the current route-intent tuple, selected anchor tuple, replay checkpoint hash, evidence-boundary hash, mask scope, `SupportLineageBinding`, and continuity evidence still validate the same ticket anchor and the same actionable scope member; replay exit must otherwise remain recovery-bound or read-only.
43A. `SupportLineageBinding` is the sole authority allowed to join one `SupportTicket` to request lineage, child case links, governing communication chains, replay scope, and live recovery targets. `linkedLineageRefs[]`, copied thread refs, subject-only clustering, or route-local ticket summaries are insufficient for live mutation or replay restore.
43B. A support ticket may span multiple related lineages only through explicit `SupportLineageScopeMember` rows, and every support-visible transcript excerpt, derived artifact, resend note, recovery note, resolution summary, or export must cite one `SupportLineageArtifactBinding` before it can be treated as durable timeline, replay, or settlement truth.
44. Any writable patient, staff, support, hub, or operations route must bind one current `AudienceSurfaceRuntimeBinding`; stale or withdrawn publication, parity drift, or provenance block may recover, but it may not remain writable.
44A. Any preview, timeline, receipt, communication digest, or artifact surface reachable from that route must resolve one current `AudienceVisibilityCoverage`, the bound `MinimumNecessaryContract`, and the required section, preview, or artifact contracts; parent-route coverage alone is insufficient.
44B. Acting-context elevation, purpose-of-use changes, and break-glass review must switch to a separately published coverage row, minimum-necessary contract, and projection family before detail widens; post-materialization field trimming is forbidden.
44C. Redaction evolution must resolve through named policy refs and compile evidence; route-family-specific masking branches are forbidden substitutes for visibility contracts.
44D. Any writable governance, support, hub, servicing-site, or cross-organisation route must bind the same current `ActingScopeTuple` across `AudienceVisibilityCoverage`, `MinimumNecessaryContract`, runtime binding, route intent, and governing object version. Mixed tuple assembly is forbidden.
44E. Multi-tenant or platform-scoped governance and release work must surface explicit `affectedTenantCount` and `affectedOrganisationCount` from the current tuple before approval, promotion, rollback, or authority-link mutation may settle.
45. Patient-facing shells must derive live actionability from `PatientShellConsistencyProjection`; embedded variants must also validate `PatientEmbeddedSessionProjection` and degrade through `RouteFreezeDisposition` rather than exposing stale embedded affordances.
45A. If patient-shell continuity, return posture, or linked continuity evidence becomes stale, blocked, or recovery-only, the current section summary or selected anchor must remain visible and the shell must degrade in place; generic home redirects, expired-link pages, and detached success receipts are forbidden for same-shell recovery.
45B. If a patient action settles to `stale_recoverable | blocked_policy | denied_scope | expired`, the current shell must materialize one `PatientActionRecoveryEnvelope` plus any `RecoveryContinuationToken` and `PatientRequestReturnBundle` required for the same lineage; entry-channel-specific redirects, blank failures, and subject-confusing reopen paths are forbidden.
45C. Secure-link, authenticated, embedded, deep-link, and child-route recovery for the same patient action must reuse the same recovery tuple, preserved summary tier, selected anchor, and next safe action until typed routing and causal-read fences prove that calm or writable posture may return.
45D. Patient-facing entry, section, repair, identity-hold, embedded, and artifact routes must all resolve one current `PatientDegradedModeProjection`; route-local degraded banners or empty states may specialize wording only after they inherit the same `currentMode`, `modeReason`, preserved anchor, and next safe action.
45E. No patient CTA, quiet-home reassurance, or embedded or browser handoff may outlive the current `PatientDegradedModeProjection.truthTupleHash`; when `currentMode != live`, the shell must preserve the same section or anchor and explain the withdrawal in place.
45F. Patient-facing self-care and admin-resolution routes may expose live advice, notify, or complete controls only while the current `SelfCareBoundaryDecision`, `SelfCareExperienceProjection` or `AdminResolutionExperienceProjection`, route intent, shell-consistency projection, and any embedded-session posture still agree on one `boundaryTupleHash`; softer copy, subtype names, or cached child status are descriptive only.
46. Staff review, advice, messaging, and admin-resolution mutations must hold `ReviewActionLease` whose `ownershipEpochRef` and `fencingToken` still match the governing writable owner; composition, compare, confirm, or dispute-review posture must preserve draft, compare-target, selected-anchor, and quiet-return context through `WorkspaceFocusProtectionLease` plus `ProtectedCompositionState`.
46A. Self-care issue and admin-resolution completion may proceed only while one current `SelfCareBoundaryDecision` proves the same `boundaryTupleHash`, `clinicalMeaningState`, and `operationalFollowUpScope`, and while `AdviceAdminDependencySet.reopenState = stable`; route labels, localized wording, and subtype profiles may not smuggle bounded admin work through an informational advice path or keep admin consequence live after clinical re-entry is required.
47. Patient-visible artifacts and any external, overlay, or cross-app handoff must resolve through `ArtifactPresentationContract` and, when navigation leaves the shell, `OutboundNavigationGrant`.
47A. `ArtifactPresentationContract` may not advertise preview, inline body, download, print, or handoff modes that exceed the bound `AudienceVisibilityCoverage`, `MinimumNecessaryContract`, or any declared mode-specific contracts.
48. Release, channel, trust, publication, or embedded-session mismatch must resolve through governed `ReleaseRecoveryDisposition` or `RouteFreezeDisposition`; generic failure is not a valid steady-state response.
49. Draft autosave, resume, and rebind posture may appear authoritative only while `DraftContinuityEvidenceProjection(controlCode = intake_resume)` still validates the same lineage, session, and shell; local autosave calmness alone is never sufficient.
50. Appointment cancel, reschedule, reminder, and detail-update posture may remain writable or calmly settled only while `BookingContinuityEvidenceProjection(controlCode = booking_manage)` still validates the same appointment lineage and published route posture.
50A. Patient more-info reply posture may remain calmly actionable only while `PatientExperienceContinuityEvidenceProjection(controlCode = more_info_reply)` still validates the same request lineage, question anchor, and reply settlement chain; local question visibility or cached draft text alone is never sufficient.
50B. Hub commit, confirmation-pending, and post-book manage posture may remain calmly actionable only while `HubContinuityEvidenceProjection(controlCode = hub_booking_manage)` still validates the same hub route family, selected anchor tuple, and canonical settlement or continuation chain.
51. Visible assistive accept, insert, regenerate, or completion-adjacent calmness may remain live only while `AssistiveContinuityEvidenceProjection(controlCode = assistive_session)` still validates the same task shell, review version, and publication posture.
51A. Every visible assistive accept, edit, reject, regenerate, dismiss, abstention acknowledgement, or stale-recovery gesture must persist exactly one authoritative `AssistiveArtifactActionRecord` on one current `AssistiveFeedbackChain`; duplicate UI events, retries, and local acknowledgements may not fork conflicting truths for the same human gesture.
51B. Any materially reviewed assistive artifact that is accepted unchanged, accepted after edit, rejected to an alternative, or explicitly abstained from must settle one current `OverrideRecord` on the same `AssistiveFeedbackChain`, with reason capture enforced by the chain's current artifact hash, confidence posture, trust posture, and policy burden.
51C. `FeedbackEligibilityFlag.eligibleForTraining = true` is legal only when the same `AssistiveFeedbackChain` has one current `FinalHumanArtifact`, any required `HumanApprovalGateAssessment` has settled, the bound workflow settlement is authoritative, and no incident, supersession, exclusion, or revocation state remains open.
52. Task completion and next-task launch may remain calmly actionable only while `WorkspaceContinuityEvidenceProjection(controlCode = workspace_task_completion)` still validates the same task shell and settlement chain; queue-local completion inference is forbidden.
52A. Queue preview and background next-task prefetch may hydrate only summary-first, read-only projections bound to one committed `QueueRankSnapshot`; they may not mint `ReviewActionLease`, clear changed-since-seen state, hydrate heavy media, or alter queue focus or row order.
52B. `TaskLaunchContext.nextTaskCandidateRefs`, `NextTaskPrefetchWindow`, `NextTaskLaunchLease`, and `TaskCompletionSettlementEnvelope.sourceQueueRankSnapshotRef` must agree on the same committed queue snapshot unless the shell explicitly degrades to stale or recovery posture.
52C. Next-task progression requires one explicit operator launch under live `NextTaskLaunchLease`, current `TaskCompletionSettlementEnvelope`, and current `WorkspaceContinuityEvidenceProjection`; auto-advance after local success is forbidden.
52D. Staff, support, hub, governance, and operations workspaces may render calm or writable queue or task posture only while one current `WorkspaceTrustEnvelope` still agrees with the active consistency projection, trust projection, primary action lease, publication tuple, selected-anchor tuple, and completion settlement chain; route-local calmness or writability inference is forbidden.
52E. Assistive companion or control surfaces may render visible, confidence-bearing, or action-ready posture only while one current `AssistiveCapabilityTrustEnvelope` still agrees with the active `AssistiveSurfaceBinding`, `AssistiveInvocationGrant`, `AssistiveRunSettlement`, `AssistiveVisibilityPolicy`, watch tuple, trust projection, kill-switch or freeze state, owning-shell trust, publication tuple, selected-anchor tuple, and any active insertion-target or continuity tuple; route-local badges, stale run state, or model-returned text are not sufficient authority.
53. Pharmacy-shell release, reopen, or closure posture may remain calmly settled only while `PharmacyConsoleContinuityEvidenceProjection(controlCode = pharmacy_console_settlement)` still validates the same mission scope and canonical settlement chain.
53A. Operations, assurance, and audit diagnosis for `patient_nav`, `record_continuation`, `conversation_settlement`, `more_info_reply`, `support_replay_restore`, `intake_resume`, `booking_manage`, `hub_booking_manage`, `assistive_session`, `workspace_task_completion`, and `pharmacy_console_settlement` must resolve through one current `ContinuityControlHealthProjection`, one current `OpsContinuityEvidenceSlice`, and one preserved `InvestigationDrawerSession`; generic queue, freshness, or delivery metrics may support but may not replace the governing continuity proof.
53B. Return from audit, assurance, governance, workspace, or workflow-specific continuity drill paths may restore live operations posture only while the current `OpsReturnToken`, `continuityQuestionHash`, `continuitySetHash`, required trust rows, and preserved board snapshot still validate the same diagnostic question; otherwise the board must remain diagnostic or recovery-only and show delta against the preserved base.
54. Any canonical staff queue order must derive only from one committed `QueueRankSnapshot` produced from durable facts and one versioned `QueueRankPlan`; browser-local sort, reviewer-local heuristics, or timing-only recomputation are forbidden.
55. Reviewer skill, continuity preference, WIP headroom, and focus protection may influence only `QueueAssignmentSuggestionSnapshot`; they may not rewrite canonical task ordinals or eligibility.
56. `QueueWorkbenchProjection`, `QueuePreviewDigest`, `TaskLaunchContext.nextTaskCandidateRefs`, `NextTaskLaunchLease`, and operations or supervisor queue drill-down for the same queue state must reference the same committed `QueueRankSnapshot` or explicitly degrade to stale or recovery posture.
57. Tasks with open `SafetyPreemptionRecord`, blocked trust slices, or excluded-scope posture may not appear in routine queue order; they must surface in explicit hold, escalation, or recovery views instead.
58. Queue reorder while a queue is in active use must materialize only through `QueueChangeBatch(sourceRankSnapshotRef, targetRankSnapshotRef)`; silent resort from mixed snapshots is forbidden.
59. Any writable or calmly trustworthy audience surface must resolve one current `AudienceSurfaceRuntimeBinding(bindingState = publishable_live)` plus one current `DesignContractPublicationBundle(publicationState = published)` with `DesignContractLintVerdict.result = pass`; route contract, surface publication, runtime bundle, token export, or generated CSS alone are insufficient.
60. `ReleasePublicationParityRecord(parityState = exact)` is mandatory for writable or calmly trustworthy posture; stale, missing, conflicting, withdrawn, or provenance-blocked parity must suppress mutation before route-local cache, compiled code, or stale projection truth can reopen it.
61. `AudienceSurfaceRuntimeBinding.surfaceTupleHash` must match the active route-contract digest, active design-contract digest, published recovery dispositions, approved watch tuple, and provenance-consumption state for that audience surface; mixed-source tuple assembly is forbidden.
61A. Any route family whose rendered DOM markers, telemetry event names, token aliases, or artifact-mode labels are not reachable from the current `DesignContractPublicationBundle` must fall to read-only, summary-only, or recovery posture until a fresh bundle and passing lint verdict are published.
62. Operations, governance, support, and embedded recovery surfaces may preserve context under drift, but they may not appear greener or more writable than the governing `AudienceSurfaceRuntimeBinding`.
62A. Any restore, failover, chaos, or recovery-pack action exposed to operators must resolve one current `ResilienceSurfaceRuntimeBinding` and one current `RecoveryControlPosture`; dashboards, runbook links, and shell-local script affordances may diagnose, but they may not imply live recovery authority on their own.
62B. `OperationalReadinessSnapshot` and `RunbookBindingRecord` are the only release-scoped authorities for restore readiness, rehearsal freshness, and audience recovery posture. Wiki links, bookmarks, or human memory are not valid substitutes.
62C. `RecoveryControlPosture.postureState = live_control` is legal only while the bound `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live`, the linked `OperationalReadinessSnapshot` is fresh, required runbook bindings are `published`, restore validation freshness is `fresh`, dependency coverage is `complete`, journey recovery coverage is `exact`, and required backup manifests are current.
62D. `RestoreRun`, `FailoverRun`, and `ChaosRun` may not satisfy current restore-validation or failover-readiness posture once the bound runtime-publication tuple, release-watch tuple, runbook binding, or declared recovery disposition has drifted; stale or superseded runs are diagnostic history only.
62E. Restore, failover, and chaos completion are authoritative only after one `ResilienceActionSettlement(result = applied)` bound to the current route intent, current `RecoveryControlPosture`, and current evidence artifacts. Local acknowledgement, transport success, or subsystem logs alone are insufficient.
62F. Recovery reports, journey proofs, backup explainers, runbook bundles, and recovery-pack exports must write back into the assurance spine through `RecoveryEvidenceArtifact`; detached ticket attachments or dashboard side panels are not authoritative recovery evidence.
62G. Any PHI-bearing restore, failover, chaos, or recovery-pack artifact or external handoff must resolve through `ArtifactPresentationContract` and `OutboundNavigationGrant`; raw object-store links are forbidden.
62H. `AssuranceEvidenceGraphSnapshot` and `AssuranceGraphCompletenessVerdict` are the only authorities for proving pack, audit, replay, incident, CAPA, retention, deletion-certificate, archive-manifest, and recovery-evidence completeness; loose evidence references, spreadsheet joins, or export-local manifests are insufficient.
62I. Any attestation, sign-off, export, replay, deletion, or archive action that depends on assurance evidence must bind the current graph snapshot, completeness verdict, standards version map, redaction policy, and scope token. If any required node, edge, continuity section, incident link, CAPA link, or retention link is stale, missing, superseded ambiguously, or cross-scope, the action must fail closed to recovery, archive-only, or blocked posture.

### 4. Canonical ingest, pre-submission capture, promotion, and episode formation

#### 4.1 Command ingest and envelope creation

For every inbound command or evidence-bearing message:

1. Canonicalize the inbound command into both:

   * `h_raw = H(raw_bytes)`
   * `h_sem = H(Canon_sem(payload))`, where `Canon_sem(.)` removes transport-only noise, field-order variance, trace fields, duplicate whitespace, and other non-semantic decorations but preserves actor-, scope-, lineage-, and intent-bearing content
2. Build the deterministic replay key and resolve `IdempotencyRecord` under compare-and-set on `(actionScope, governingLineageRef, replayKey, scopeFingerprint)` using:
   `k_replay = H(actionScope || governingLineageRef || effectiveActorRef || h_sem || causalParentRef || intentGeneration)`
   and persist:

   * source command id
   * transport correlation id
   * `k_replay`
   * prior lineage reference
   * session or continuation lineage
3. Classify the inbound command as exactly one of:

   * `exact_replay` when source identifiers or `k_replay` match, `h_sem` matches, governing scope matches, and no intervening divergent settlement exists
   * `semantic_replay` when governing scope and `h_sem` match after canonicalization but `h_raw` differs because only transport framing or non-semantic fields changed
   * `collision_review` when a source identifier is reused but `h_sem` or governing scope diverges
   * `distinct`
4. If classification = `exact_replay` or `semantic_replay` and the prior accepted settlement is still `pending | projection_pending | awaiting_external`, return that same live authoritative settlement chain, command-following token, and recovery posture and stop.
5. If classification = `exact_replay` or `semantic_replay` and the prior accepted settlement is terminal, return the prior accepted result and stop.
6. If classification = `collision_review`, freeze one immutable `EvidenceCaptureBundle`, derive the canonical normalization package from that frozen input, persist the new immutable `EvidenceSnapshot`, open `ReplayCollisionReview`, quarantine automatic replay handling, route to explicit review, and stop ordinary promotion flow; never idempotently acknowledge a semantically divergent command just because a transport identifier was reused.
7. Otherwise freeze one immutable `EvidenceCaptureBundle`, derive the canonical normalization package from that frozen input, and persist a new immutable `EvidenceSnapshot` before normalization or state advancement.
8. Resolve one active `IntakeConvergenceContract` from the true ingress family plus the current shell posture. Standalone browser and NHS App embedded entry may differ in `surfaceChannelProfile`, but they must resolve the same `ingressChannel = self_service_form` contract and the same canonical field meanings.
9. If no `SubmissionEnvelope` exists for the source lineage, create one bound to that originating ingress channel, initial surface profile, and `IntakeConvergenceContract`.
10. Append one immutable `SubmissionIngressRecord` carrying the active ingress channel, surface profile, promotion intent, channel capability ceiling, contact-authority class, evidence-readiness state, transport correlation, and receipt or status consistency keys before any duplicate, promotion, or safety decision depends on the inbound batch.
11. If the inbound data is not yet a governed submit, append the snapshot and latest ingress record to `SubmissionEnvelope`.
12. A `SubmissionEnvelope` may move through:

   * `draft`
   * `evidence_pending`
   * `ready_to_promote`
   * `promoted`
   * `abandoned`
   * `expired`
13. `Request` must not be created merely because draft or partial evidence exists.

#### 4.2 Immediate urgent-live triage rule for telephony and live channels

Before transcript readiness or full normalization:

1. Evaluate minimal urgent-live signals, including:

   * explicit urgent keypad or menu selection
   * explicit caller declaration of urgent danger
   * staff-observed urgent declaration
   * configured high-confidence red-flag keyword or phrase detection
   * live operational rule requiring conservative urgent handling
2. If an urgent-live signal exists:

   * append one `TelephonyUrgentLiveAssessment(assessmentOutcome = urgent_live_required)`
   * create `SafetyPreemptionRecord(priority = urgent_live, status = pending)`
   * create or reacquire the urgent diversion or live triage path immediately
   * mark the `SubmissionEnvelope` as `evidence_pending`
   * continue evidence capture and transcript processing in parallel
3. The system must not wait for transcript readiness before it can choose a conservative urgent response.

#### 4.2A Telephony evidence-readiness and continuation-eligibility gate

For `ingressChannel = telephony_capture`:

1. append or refresh `TelephonyTranscriptReadinessRecord` whenever recording availability, transcript execution, structured keypad capture, or fact-extraction sufficiency changes
2. derive one `TelephonyEvidenceReadinessAssessment` from the current urgent-live assessment, transcript-readiness verdict, structured capture completeness, identity posture, and any open manual-review disposition
3. only `TelephonyEvidenceReadinessAssessment.usabilityState = safety_usable` may allow routine `SubmissionIngressRecord.evidenceReadinessState = safety_usable` and `promotionReadiness = ready_to_promote`
4. `usabilityState = urgent_live_only` may keep urgent diversion active and may allow bounded recovery or manual-only follow-up, but it may not allow routine promotion, calm receipt issuance, or normal triage entry
5. `usabilityState = manual_review_only` must open `TelephonyManualReviewDisposition` and keep the lineage blocked from routine promotion until the review settles a new readiness assessment
6. seeded or challenge continuation may be recommended only by one `TelephonyContinuationEligibility` derived from the latest readiness assessment; controllers, workers, or SMS dispatch code may not infer grant family directly from identity score, transcript job state, or caller-ID heuristics
7. if recording never becomes usable, transcript remains clinically insufficient, or contradictory capture leaves safety meaning unresolved, keep the call lineage in `manual_review_only | unusable_terminal` and route to governed manual follow-up rather than seeding or promoting the request
8. any later transcript rerun, manual transcription, or structured-capture correction must append a fresh readiness assessment before telephony evidence may newly qualify for routine promotion or broader continuation scope

#### 4.3 Promotion readiness

A `SubmissionEnvelope` may become `ready_to_promote` only when all are true:

* evidence is safety-usable for the channel and pathway
* required submit intent or governed promotion intent exists
* required minimal identity or subject context for the pathway exists
* no unresolved urgent-live decision is still pending
* the latest `SubmissionIngressRecord` still validates the bound `IntakeConvergenceContract`, including canonical field completeness, channel capability ceiling, contact-authority posture, and receipt or status consistency keys for the promotion path
* if the ingress family is telephony, the latest `TelephonyEvidenceReadinessAssessment` must show `usabilityState = safety_usable` and `promotionReadiness = ready_to_promote`

Promotion from `SubmissionEnvelope` to `Request` is a governed action and must be explicit.

Promotion must also obey these exact-once rules:

1. acquire one compare-and-set on the current `SubmissionEnvelope.state`, `latestEvidenceSnapshotRef`, and, where draft mutation existed, the latest settled draft version
2. freeze the promoted snapshot, normalized submission, route bundle, receipt or status consistency keys, and continuity handoff in one immutable `SubmissionPromotionRecord`; the record must point to exactly one `SubmissionEnvelope`, exactly one `Request`, exactly one resulting `RequestLineage`, and any resulting patient-facing `PatientJourneyLineage`
3. create the `Request`, set `SubmissionEnvelope.promotedRequestRef` and `promotionRecordRef`, and advance `SubmissionEnvelope.state = promoted` in the same transaction
4. supersede or revoke all active `draft_resume_minimal` grants and active `DraftSessionLease`s in the same transaction; after promotion, stale draft resume may land only in read-only recovery or the mapped request shell
5. exact or semantic submit replays after promotion must return the prior `SubmissionPromotionRecord` and settled outcome rather than creating a second `Request`, a second promotion side effect, or a second mutable draft lane

#### 4.3A Artifact quarantine and fallback review

1. If any upload, transcript, or inbound evidence is malicious, unreadable, unsupported, or otherwise not safely processable, keep it quarantined and do not promote it into routine flow.
2. If user progress has already been accepted or the platform now owes a response, open `FallbackReviewCase` under the same lineage, anchor SLA timing, and issue degraded receipt or recovery guidance.
3. `FallbackReviewCase` must route to the owning manual queue with the quarantined artifact reference, failure reason, and current visibility limits.
4. Recovery may replace the artifact, mark it unusable while preserving the rest of the lineage, or continue through governed manual confirmation when policy allows.
5. Engine, projection, or dependency failure must never silently discard a governed submission or strand it without patient-visible state.

#### 4.3B Evidence immutability, derivation, and parity

1. Freeze raw inbound payload, attachment manifests, audio references, and source metadata into exactly one `EvidenceCaptureBundle` before any canonical normalization, extraction, or summary generation runs.
2. Canonical normalization, transcript generation, structured fact extraction, safety feature computation, patient-safe summaries, and staff-review summaries must each materialize as immutable `EvidenceDerivationPackage` rows pinned to the source bundle hash and derivation version; reruns append new packages and may never overwrite old output.
3. `EvidenceSnapshot` must point to exactly one frozen source bundle, exactly one authoritative normalized payload, and at most one authoritative derived-facts package plus one current `EvidenceSummaryParityRecord`; those refs and `snapshotHash` never change after creation.
4. Redaction, masking, excerpting, and export preparation must create `EvidenceRedactionTransform` rows that preserve source hash and policy version; they may narrow visibility, but they may not rewrite source or derived history.
5. Any patient-visible or staff-visible structured summary, transcript stub, or review digest must resolve through `EvidenceSummaryParityRecord(parityState = verified)` before it may present itself as authoritative. If parity is `stale | blocked | superseded`, the surface must degrade to bounded provisional or recovery posture instead of silently reusing calm summary copy.
6. If late transcript improvement, manual correction, schema migration, enrichment, or redaction-policy change enters an active lineage, route it through `EvidenceAssimilationCoordinator`. Only when the resulting `MaterialDeltaAssessment` shows that safety meaning, triage meaning, delivery meaning, or patient-visible interpretation changed may the platform mint a new `EvidenceSnapshot` linked by supersession and rerun the owning workflow gate. If the resulting assessment is `technical_only | operational_nonclinical`, keep the new derivative unattached and do not mutate prior snapshot truth.

#### 4.4 Episode relation rules

When a `SubmissionEnvelope` is ready to promote, derive candidate relation against a bounded recent-open-request window using a calibrated multiclass relation model. Durable relation outputs remain:

* `retry`
* `same_episode_candidate`
* `same_episode_confirmed`
* `related_episode`
* `new_episode`

First materialize one candidate window `W(s)` over open requests and recently closed-but-reopenable requests under the active duplicate policy. The window must be explicit, deterministic, and replayable from the same policy bundle and evidence cut; browser-local or reviewer-local candidate browsing is not an authority.

For each candidate pair `(s, r)` of incoming submission `s` and candidate request `r` in `W(s)`, build a missingness-aware feature vector `phi(s, r)` that includes at minimum:

* exact replay indicators such as source-command match, transport-correlation match, `h_sem` match, and `k_replay` match
* lineage continuity indicators such as source-lineage match, continuation access-grant match, telephony continuation-context match, call-session match, more-info-thread match, and workflow-return-token match
* patient continuity `P_patient_same(s, r)` from the latest governed `IdentityBinding` evidence rather than raw demographic coincidence
* semantic alignment `sim_sem(s, r)`
* temporal alignment `sim_time(s, r)`
* request-type, pathway, and channel compatibility indicators
* explicit conflict indicators including distinct-intent acknowledgement, contradictory onset or reason, divergent clinician decision, divergent downstream lease, divergent handoff, patient mismatch, or closed-lineage constraints

Define the semantic and temporal similarities as:

* `sim_sem(s, r) = w_text * cos(e_s, e_r) + w_struct * J_w(C_s, C_r) + w_path * 1[pathway_s = pathway_r] + w_onset * IoU(I_s, I_r)`
* `sim_time(s, r) = exp(-max(0, |t_submit(s) - t_submit(r)| - g_submit) / tau_submit) * exp(-max(0, d_onset(s, r) - g_onset) / tau_onset)`

where `J_w` is weighted Jaccard over normalized concern, body-site, and structured-symptom tokens, `e_*` is the versioned semantic embedding, `I_*` is the normalized onset interval, `d_onset` is interval distance, and missing components renormalize the active weights so absent data does not masquerade as disagreement.

For relation classes `c in {retry, same_request_attach, same_episode, related_episode, new_episode}`, compute:

* `l_c(s, r) = alpha_c + beta_c^T phi(s, r) - M * 1[hard_blocker(c, s, r)]`
* `pi(s, r) = Cal_relation_version(softmax(l(s, r)))`, with `pi_c(s, r)` denoting class component `c`

Let `c1 = argmax_c pi_c(s, r)`, let `c2` be the runner-up class, let `margin(s, r) = log((pi_c1(s, r) + eps) / (pi_c2(s, r) + eps))`, and let normalized uncertainty be `u(s, r) = -sum_c pi_c(s, r) * log(pi_c(s, r) + eps) / log(5)`, with `eps = 1e-6`.

Also define candidate-to-candidate competition for each decision class `d in {retry, same_request_attach, same_episode, related_episode}`:

* `best_d(s) = argmax_{r in W(s)} pi_d(s, r)`
* `runner_d(s) = argmax_{r in W(s), r != best_d(s)} pi_d(s, r)`, defaulting to `0` when absent
* `candidateMargin_d(s) = log((pi_d(s, best_d(s)) + eps) / (runner_d(s) + eps))`

Persist one immutable `DuplicatePairEvidence` for every `(s, r)` carrying `pi_*`, `margin`, `candidateMargin_d(s)` for the applicable class, the current model version, the current channel calibration, and any hard blockers.

Use conservative defaults until pathway- and channel-specific calibration exists:

* `tau_retry_auto = 0.999`, `delta_retry = log(50)`
* `tau_attach_auto = 0.995`
* `tau_episode_auto = 0.990`, `delta_auto = log(9)`
* `tau_related_auto = 0.950`
* `tau_review = 0.350`
* `tau_block_identity = 0.250`, `tau_patient_episode = 0.990`, `tau_sem_episode = 0.850`
* `u_auto_max = 0.35`
* `delta_target_auto = log(9)`

Decision mapping:

* emit `retry` only when deterministic replay evidence exists, `pi_retry >= tau_retry_auto`, `margin >= delta_retry`, `candidateMargin_retry(s) >= delta_retry`, and no hard blocker or divergent settlement exists
* emit `same_episode_confirmed` only when explicit continuity or governed workflow return exists, `pi_same_episode >= tau_episode_auto`, `candidateMargin_same_episode(s) >= delta_target_auto`, `P_patient_same >= tau_patient_episode(routeSensitivity)`, `sim_sem >= tau_sem_episode(routeSensitivity)`, `u <= u_auto_max`, and no hard blocker exists; same-request attach remains a stricter internal decision class, not a durable public relation label
* emit `same_episode_candidate` when same-episode evidence exists but confidence, separation, or blocker state is insufficient for auto-confirmation; create review work rather than forcing a premature merge or split
* emit `related_episode` when `pi_related_episode >= tau_related_auto`, `pi_same_episode < tau_episode_auto`, and no same-request attach proof exists
* emit `new_episode` otherwise

All other suspected matches remain distinct. Cross-channel auto-attach or auto-confirm may use a stricter `channelCalibrationRef`; if the current intake source or channel pair has no validated calibration, auto-confirmation must fail closed to review-required clustering or separation.

#### 4.5 Episode and request creation algorithm

1. If relation = `retry`, settle one `DuplicateResolutionDecision(decisionClass = exact_retry_collapse, reviewMode = replay_authority, continuityWitnessClass = deterministic_replay)` from the winning `DuplicatePairEvidence`, acknowledge idempotently, and stop.
2. If relation = `new_episode`, create a new `Episode`, a new `Request`, and a new `RequestLineage(branchClass = primary_submission)`.
3. If relation = `related_episode`, create a new `Request`; create a new `Episode` unless policy explicitly keeps the new request inside the existing episode graph as a related branch; persist one `DuplicateResolutionDecision(decisionClass = related_episode_link)` from the winning pair evidence; and create a new `RequestLineage(branchClass = related_episode_branch, branchDecisionRef = persisted related-episode duplicate decision)`.
4. If relation = `same_episode_candidate`, create a new `Request`, a new `RequestLineage(branchClass = same_episode_branch)`, and a `DuplicateCluster(relationType = review_required)`; persist all relevant `DuplicatePairEvidence`, `candidateRequestRefs[]`, the current `channelCalibrationRef`, and one `DuplicateResolutionDecision(decisionClass = review_required)`; do not auto-attach.
5. If relation = `same_episode_confirmed`, apply the attach rules:

   * if `pi_same_request_attach >= tau_attach_auto`, `margin >= delta_auto`, `candidateMargin_same_request_attach(s) >= delta_target_auto`, `u <= u_auto_max`, the evidence is a continuation inside the same open submit lineage or an explicitly linked workflow return, one explicit continuity witness exists, and no attach blocker exists, append the new snapshot to the existing `Request` only after one `DuplicateResolutionDecision(decisionClass = same_request_attach)` is persisted from the winning pair evidence; the existing `RequestLineage` must remain the sole continuity anchor
   * otherwise create a new `Request` inside the same `Episode`, create a new `RequestLineage(branchClass = same_episode_branch, branchDecisionRef = persisted same-episode duplicate decision)`, persist one `DuplicateResolutionDecision(decisionClass = same_episode_link)`, and link it as confirmed same-episode related work rather than collapsing it into the existing request
6. Only a new `Request` may traverse:

   * `submitted -> intake_normalized`
7. An attached same-request continuation must not recreate `submitted` or `intake_normalized`.

#### 4.6 Pre-submission retention and expiry

1. `SubmissionEnvelope` objects that never promote must expire under their narrower retention rules unless policy upgrades them because the evidence is clinically material or safety-relevant.
2. Expiry of an envelope must not delete any evidence required for urgent handling, audit, or incident investigation.
3. Promotion must create an immutable mapping from `SubmissionEnvelope` to `Request`.

### 5. Identity binding, ownership, claim, and correction algorithm

#### 5.1 Separation of concerns

* authentication establishes subject identity
* matching establishes candidate patient identity
* claiming establishes request ownership
* these are separate steps and must not be collapsed

#### 5.2 Identity state mapping

Map request identity state from `IdentityBinding`:

* `anonymous` = no verified subject and no verified patient
* `partial_match` = verified subject or candidate patient exists, but patient is not safely unique
* `matched` = patient uniquely verified, but ownership not yet established
* `claimed` = patient uniquely verified and request ownership established

#### 5.3 Auto-link rules

Automatic patient linking is allowed only if all are true:

* for each candidate `p`, compute calibrated posterior `P_link(p) = Cal_link_version(z(p))` and confidence bounds `LCB_link_alpha(p)` and `UCB_link_alpha(p)` at confidence `1 - alpha_link`
* let `p_star = argmax_p P_link(p)` and let `p_2` be the runner-up candidate or a null candidate with `P_link(p_2) = 0`
* compute `gap_logit = log((P_link(p_star) + eps) / (1 - P_link(p_star) + eps)) - log((P_link(p_2) + eps) / (1 - P_link(p_2) + eps))`, with `eps = 1e-6`
* compute subject-to-patient proof lower bound `LCB_subject_alpha`
* `confidenceModelState = calibrated`
* `LCB_link_alpha(p_star) >= tau_high(routeSensitivity)`
* `UCB_link_alpha(p_2) <= tau_runner_up(routeSensitivity)`
* `gap_logit >= delta_logit(routeSensitivity)`
* `LCB_subject_alpha >= tau_subject(routeSensitivity)`
* policy explicitly permits auto-link at that assurance level
* no downstream irreversible action has yet occurred unless the bind is already `verified_patient`

If the lower-bound tests are strong enough for safe progress but not yet strong enough for durable external consequences, use `bindingState = provisional_verified`.

A single demographic candidate without step-up challenge, calibrated lower-bound separation, and subject-proof support is `partial_match`, not `matched`.

#### 5.3A Binding authority and supersession rules

1. Freeze the full candidate universe, search scope, and match-evidence set for each link attempt before any binding version is settled; later demographic refresh may produce a new candidate set, but it may not rewrite the basis of an already settled bind.
2. `IdentityBindingAuthority` is the only service allowed to create candidate, provisional, verified, claimed, corrected, or revoked `IdentityBinding` versions.
3. Each binding transition must append a new immutable `IdentityBinding` version with `supersedesBindingRef`, `bindingVersion`, `decisionClass`, and the settled `patientRef` or null result; the prior version is never edited into a new truth state.
4. The authority must compare-and-set `Episode.currentIdentityBindingRef`, `Request.currentIdentityBindingRef`, derived `patientRef`, and `identityState` against the current lineage binding before publishing the new version.
5. Any transition that changes bound patient, ownership state, or effective writable scope must also advance the lineage binding fence used by sessions, grants, and route intents so stale recovery cannot resurrect the prior bind.
6. Auth callback, telephony verification, support correction, import, backfill, and manual review paths may submit binding intents or evidence, but they may not settle lineage binding without `IdentityBindingAuthority`.
7. `IdentityBinding(decisionClass = correction_applied | revoked)` is legal only while one active `IdentityRepairCase` references the superseded binding, one `IdentityRepairFreezeRecord(freezeState = active)` is already settled, and later continuity release will be controlled by `IdentityRepairReleaseSettlement`.

#### 5.4 patientRef write control

1. `Request.patientRef` and `Episode.patientRef` are derived only from `currentIdentityBindingRef.patientRef` and may advance only in the same transaction that `IdentityBindingAuthority` settles a new binding version.
2. Any post-bind correction requires:

   * `IdentityRepairCase`
   * `IdentityRepairFreezeRecord`
   * `IdentityBindingAuthority`
   * supervisor approval
   * independent review
   * full audit record
   * immediate revocation of derivative grants
   * one `IdentityRepairBranchDisposition` for every affected downstream branch
   * quarantine and rebuild of affected projections
   * one `IdentityRepairReleaseSettlement` before ordinary continuity resumes
   * downstream compensation where needed
3. No ordinary runtime path, support tool, import, backfill, or adapter callback may silently replace the derived patient binding or `ownershipState`.

#### 5.4A Auth callback, session establishment, and post-auth return algorithm

On NHS login callback, authenticated uplift, or subject-bearing auth recovery:

1. resolve one `AuthTransaction`, `AuthScopeBundle`, and `PostAuthReturnIntent`; reject any callback or return that does not match the frozen transaction fence
2. accept callback only through compare-and-swap on `AuthTransaction.transactionState`; duplicate retries, stale callbacks, or parallel deliveries must settle the same transaction as `replayed | expired | denied` rather than opening a second side effect path
3. derive or refresh one current `PatientLink` from the latest settled `IdentityBinding` version and current auth evidence, and issue any new binding intent through `IdentityBindingAuthority` rather than mutating lineage patient references directly
4. compare any existing browser session to the resolved auth subject and secure-link posture:

   * no session -> `create_fresh`
   * same subject and same binding -> `reuse_existing` only if capability ceiling and return intent do not widen writable authority
   * same subject with binding-version advance, prior anonymous posture, or privilege elevation -> `rotate_existing`
   * different subject, mismatched secure-link subject, or stale session fence -> `bounded_recovery | deny`
5. persist one `SessionEstablishmentDecision` with `writableAuthorityState = auth_read_only | claim_pending | writable | none`; successful auth may still be read-only or claim-pending
6. create or rotate the local `Session` only from the approved `SessionEstablishmentDecision`, binding it to the current `CapabilityDecision`, `PatientLink`, `IdentityBinding`, `PostAuthReturnIntent`, `sessionEpoch`, and `subjectBindingVersion`
7. convert `PostAuthReturnIntent` into one `RouteIntentBinding` only if the resolved subject, current `IdentityBinding`, lineage fence, return authority, session epoch, binding version, and any embedded or channel fences still align
8. if the return intent targets pre-submit draft resume, verify that the same `SubmissionEnvelope` is still unpromoted, that `DraftContinuityEvidenceProjection` still validates writable resume under the resolved session and channel posture, and that `returnAuthority = writable_resume`; if `SubmissionPromotionRecord` now exists or authority is only `auth_only | claim_pending`, redirect into the mapped request shell, claim shell, or bounded recovery
9. auth callback success may not directly claim a request, redeem a PHI-bearing continuation, or reopen writable draft mutation without the later claim or grant algorithm also succeeding under current fences
10. any non-success outcome must settle `AuthTransaction`, preserve only bounded same-shell summary context, and route through the intent's fallback or recovery target; arbitrary redirect strings are forbidden

#### 5.5 Claim algorithm

On claim attempt:

1. Resolve request and episode lineage.
2. Resolve live grant or authenticated claim route, then validate the current `Session(sessionState = active)`, `SessionEstablishmentDecision(writableAuthorityState = claim_pending | writable)`, `CapabilityDecision`, `RouteIntentBinding`, `LineageFence.currentEpoch`, session epoch, and subject-binding version before writable state is exposed.
3. Verify the grant is not expired, not redeemed contrary to policy, not revoked, not superseded, and still bound to the current lineage and subject fence.
4. Evaluate the current `IdentityBinding` and the latest `PatientLink` derived from it.
5. If high-assurance patient binding does not exist, or if the current capability ceiling is only `auth_read_only`, require step-up verification or bounded recovery; successful auth alone is insufficient.
6. If the request is already claimed by another subject, deny ordinary claim and route to governed support workflow.
7. If verification succeeds:

   * advance `LineageFence(issuedFor = ownership_change)` before issuing any replacement grant or writable route intent
   * request `IdentityBindingAuthority` to append one new `IdentityBinding(decisionClass = claim_confirmed, ownershipState = claimed)` version and compare-and-set it against the current lineage binding
   * derive request ownership, `Request.identityState = claimed`, and any updated `patientRef` only from that settled binding version
   * rotate the active `Session` through `SessionGovernor` whenever claim changes `subjectBindingVersion`, patient scope, or writable authority
   * revoke superseded grants
   * issue replacement grant only if still needed under current policy
   * rebuild projections under the new access scope

#### 5.6 Wrong-patient correction algorithm

If a wrong-patient bind is suspected after a durable bind exists:

1. append one immutable `IdentityRepairSignal` and either open or reuse one active `IdentityRepairCase` keyed to the current `frozenIdentityBindingRef`; auth subject conflict, secure-link subject conflict, support escalation, telephony contradiction, or downstream contradiction on the same frozen binding must converge on the same case
2. settle one `IdentityRepairFreezeRecord` under compare-and-set before review continues:

   * attach the repair case to `Episode.activeIdentityRepairCaseRef`, add it to `Episode.currentClosureBlockerRefs[]` and each affected `Request.currentClosureBlockerRefs[]`, and mark lineage visibility as identity-held under repair metadata rather than rewriting workflow milestones
   * advance `LineageFence(issuedFor = identity_repair)` so any stale session, grant, route intent, or shell continuity token bound to the frozen binding fails closed before repair work continues
   * terminate or rotate active sessions through `SessionGovernor`, supersede all live PHI-bearing and transactional grants through `AccessGrantSupersessionRecord`, and supersede live route intents
   * freeze non-essential outbound communications, reminders, and patient-facing promises that would otherwise continue under the frozen binding
3. degrade patient-public, patient-authenticated, embedded, support, staff, hub, servicing-site, and downstream projections to summary-only, read-only, or recovery-only posture from `IdentityRepairFreezeRecord`; PHI cached or previously rendered under the frozen binding may not be replayed after the freeze commits
4. enumerate every affected downstream branch into `IdentityRepairBranchDisposition`, including booking, hub coordination, pharmacy dispatch or outcome, callback promises, message threads, support recovery flows, presentation artifacts, and outbound communications
5. any branch that already caused an external side effect must move to `compensation_pending` or `manual_review_only`; any branch that only staged or rendered local state must move to `quarantined`
6. complete supervisor approval and independent review on the frozen evidence basis; later evidence may append signals or candidate sets, but it may not rewrite the case-opening basis or release the freeze implicitly
7. persist corrected or revoked `IdentityBinding` only through `IdentityBindingAuthority`, superseding the prior version and advancing the subject-binding fence
8. rebuild derived projections and action surfaces against the resulting binding while preserving historical evidence, decisions, communications, and audit rows under the binding version that was current when they were produced
9. reopen, revalidate, compensate, or suppress each `IdentityRepairBranchDisposition` under the corrected binding:

   * booking, hub, pharmacy, callback, messaging, support, and artifact branches may reopen only if the new binding, lineage fence, route runtime posture, and policy all still allow it
   * otherwise persist compensation, cancellation, or manual-review outcome and keep the branch read-only or recovery-only
10. issue fresh sessions, grants, and route intents only from one `IdentityRepairReleaseSettlement` after every downstream branch disposition is `released` or has terminal compensation recorded
11. `IdentityRepairReleaseSettlement.releaseMode` may be `read_only_resume`, `claim_pending_resume`, `writable_resume`, or `manual_follow_up_only`; correction never implies automatic restoration of prior writable scope
12. only after release settlement may the case clear episode and request blocker refs, release `IdentityRepairFreezeRecord`, release outward communications, and close
13. exact replay of stale patient, staff, or support entry during an active repair case must resolve to the governed identity-hold or repair workspace; no stale session, grant, deep link, or cached route may reopen live PHI-bearing continuity

#### 5.7 Source-of-truth separation

The following sources must remain distinct and must not overwrite each other implicitly:

* submitted contact claims
* external demographic source
* verified route source
* patient communication preference source
* imported or backfilled identity evidence

### 6. Unified AccessGrant and secure-link rules

#### 6.1 Default grant policy

Unless a stricter rule exists:

* all grants are short-lived
* any grant that can reveal PHI is single-redemption or strictly rotating
* any PHI-bearing grant is subject-bound or hard-route-bound
* every redeemable grant must carry one immutable `AccessGrantScopeEnvelope`
* every state-changing redemption, rotation, reissue, revoke, or expiry sweep must settle through `AccessGrantRedemptionRecord` or `AccessGrantSupersessionRecord`
* all grant rotations revoke superseded grants immediately
* each grant family must validate against its own action allow-list
* `manual_only` is a routing outcome and must create no redeemable grant

#### 6.2 Grant family semantics

`draft_resume_minimal`

* valid only for `SubmissionEnvelope`
* reveals no patient-linked prior narrative unless identity challenge later succeeds
* is not interchangeable with `public_status_minimal`

`public_status_minimal`

* may expose only receipt confirmation, safe generic status, and generic next-step messaging
* may not expose narrative content, attachments, clinical detail, or patient-linked demographics

`claim_step_up`

* may guide the user into a claim or identity challenge route
* may not expose PHI before subject and assurance checks succeed

`continuation_seeded_verified`

* valid only when the destination route is already verified and bound to the same lineage
* may reveal seeded continuation data only after binding checks pass

`continuation_challenge`

* opens a minimal route with no patient-linked data before challenge success

`transaction_action_minimal`

* must be action-scoped and single-purpose
* valid uses include:

  * respond to more-info
  * accept or decline waitlist offer
  * accept or decline hub alternative offer
  * appointment manage entry
  * pharmacy status or instructions entry
  * callback status or callback response entry
  * clinician message thread entry or reply
  * contact-route repair when a live dependency failed
* entry scopes that can surface PHI-bearing timeline or thread content must still force any higher-assurance step before PHI is revealed
* one transaction action grant must not silently authorize another action family

`support_recovery_minimal`

* may only re-establish previously authorized minimal entry routes
* must never widen scope beyond the immediately prior authorized minimal scope without fresh binding

#### 6.2A Grant fence invariant and token handling

Define immutable scope matching as:

`scope_match(c, se) = 1[ c.routeFamily = se.routeFamilyRef and c.actionScope = se.actionScope and c.lineageScope = se.lineageScope and c.governingObjectRef = se.governingObjectRef and c.governingVersionRef = se.governingVersionRef and (se.requiredIdentityBindingRef is null or c.identityBindingRef = se.requiredIdentityBindingRef) and (se.requiredReleaseApprovalFreezeRef is null or c.releaseApprovalFreezeRef = se.requiredReleaseApprovalFreezeRef) and (se.requiredChannelReleaseFreezeRef is null or c.channelReleaseFreezeRef = se.requiredChannelReleaseFreezeRef) and (se.requiredAudienceSurfaceRuntimeBindingRef is null or c.audienceSurfaceRuntimeBindingRef = se.requiredAudienceSurfaceRuntimeBindingRef) and bridge_and_trust_posture_ok(c, se) ]`

Define the authorization fence for any redeemable grant as:

`F_grant(g) = (g.issuedLineageFenceEpoch, g.issuedSessionEpochRef, g.issuedSubjectBindingVersionRef, g.issuedIdentityBindingRef, g.tokenKeyVersionRef, g.grantFamily, g.actionScope, g.lineageScope, g.grantScopeEnvelopeRef.scopeHash)`

For request context `c` at time `t`, evaluate:

`valid_grant(g, c, t) = 1[ g.grantState = live and g.supersededByGrantRef is null and g.latestSupersessionRef is null and t < g.expiresAt and g.redemptionCount < g.maxRedemptions and scope_match(c, g.grantScopeEnvelopeRef) and c.lineageFenceEpoch = g.issuedLineageFenceEpoch and (g.issuedSessionEpochRef is null or c.sessionEpoch = g.issuedSessionEpochRef) and (g.issuedSubjectBindingVersionRef is null or c.subjectBindingVersion = g.issuedSubjectBindingVersionRef) and (g.issuedIdentityBindingRef is null or c.identityBindingRef = g.issuedIdentityBindingRef) and c.tokenKeyVersion = g.tokenKeyVersionRef ]`

`authorize_grant(g, c, t)` returns:

* `allow` only when `valid_grant = 1` and the current route requires no stronger assurance than the grant or bound session provides
* `step_up` when `valid_grant = 1` but stronger current subject or assurance proof is required before PHI or mutation
* `recover` when the only failed predicates are stale fence, session drift, supersession, governing-version drift, release or publication drift, or expiry and a same-lineage bounded recovery route exists
* `deny` otherwise

One-time and rotating grants must first claim `live -> redeeming` and later settle through one immutable `AccessGrantRedemptionRecord` plus, when applicable, `AccessGrantSupersessionRecord`, using compare-and-swap on `(grantId, grantState, redemptionCount)`. Duplicate clicks, delayed SMS or email opens, cross-device retries, or webhook races must return the current redemption or supersession settlement instead of double-spending the grant.

#### 6.3 Redemption algorithm

On redemption:

1. hash the presented token, resolve exactly one candidate grant in the correct family and key namespace, and load its immutable `AccessGrantScopeEnvelope`
2. resolve the current request context `c`, including governing object and version, current `RouteIntentBinding`, current `IdentityBinding`, session epoch, subject-binding version, lineage fence, release tuple, publication parity, audience-surface runtime binding, and any embedded bridge posture
3. for `replayPolicy = one_time | rotating`, claim the grant by compare-and-set `live -> redeeming`; if compare-and-set loses because `currentRedemptionRef` or `latestSupersessionRef` already exists, return that recorded settlement or bounded recovery instead of re-evaluating the token as a fresh attempt
4. evaluate `authorize_grant(g, c, t)` against the immutable scope envelope, current fences, and current governing-object version before any PHI is revealed, session is created, or mutation route is armed
5. if `authorize_grant = deny`, write one `AccessGrantRedemptionRecord(decision = deny)` and settle the presented grant to `revoked | expired | superseded` as family policy requires; one-time and rotating grants may not remain live after a terminal deny
6. if `authorize_grant = recover`, write one `AccessGrantRedemptionRecord(decision = recover)` and return only the scope envelope's `recoveryRouteRef` or same-lineage recovery target; do not keep the presented one-time or rotating grant live for retrial
7. if `authorize_grant = step_up`, write one `AccessGrantRedemptionRecord(decision = step_up)`, issue only a narrower replacement grant if policy allows, and settle the presented grant through `AccessGrantSupersessionRecord`; the original token may not remain live after stronger proof is demanded
8. if `authorize_grant = allow`, reveal only the minimum material allowed for that grant family and action scope
9. for any URL-borne grant, mint a fresh server-side secure-link session and CSRF secret on first successful redemption; no subsequent mutation may accept the URL token directly
   * if the browser already holds an anonymous, stale, or different-subject session, settle one `SessionEstablishmentDecision(create_fresh | rotate_existing | bounded_recovery)` first rather than upgrading that session in place
10. consume, rotate, or supersede the grant according to its replay policy, persist one `AccessGrantRedemptionRecord`, append any required `AccessGrantSupersessionRecord`, and only then emit replacement grant or route-entry state
11. append immutable audit

#### 6.3A Supersession, replacement, and reissue algorithm

On any grant rotation, support reissue, draft promotion, claim uplift, logout, identity repair, route drift, publication drift, or expiry sweep:

1. enumerate the live grants bound to the affected lineage, governing object, route family, and subject or binding fence
2. create one `AccessGrantSupersessionRecord` naming every superseded grant and any replacement grant
3. atomically mark the affected grants `superseded | revoked | expired` before the replacement grant is delivered, rendered, or queued for transport
4. issue any replacement grant with a fresh token, fresh `AccessGrantScopeEnvelope`, current route intent or governing version, and current release or runtime tuple
5. replacement grants may preserve or narrow the previously allowed visible scope, but they may not widen scope unless fresh current binding, session, release, and policy checks justify the wider family explicitly
6. support reissue and channel repair may never clone a used, superseded, or drifted grant; they must derive new minimal scope from the current authoritative state and the immediately prior allowed minimal scope only

#### 6.3B Replay return rule

1. If a one-time or rotating grant already has `currentRedemptionRef` or `latestSupersessionRef`, exact repeats must return that recorded outcome or same-lineage bounded recovery rather than creating a second session, second replacement grant, or second route re-entry side effect.
2. Multi-device opens, delayed transport deliveries, browser refreshes, and copied-link replays must obey the same rule; token secrecy alone is not a replay control.

#### 6.3C Legacy-grant migration and compatibility rule

1. Any legacy live grant that lacks the current `AccessGrantScopeEnvelope`, exact redemption settlement, or supersession lineage must be treated as `recover_only` on first touch; if access is still warranted, `AccessGrantService` must issue a fresh canonical replacement grant and supersede the legacy token before ordinary entry continues.
2. Migration must not infer prior successful redemption or safe remaining scope from transport logs, browser history, or old projection state alone. Unknown prior use is a recovery or revoke case, not optimistic reuse.
3. Old draft, status, continuation, or support links may preserve same-lineage recovery and summary context, but they must not remain writable or PHI-bearing until a current grant under the new model has been issued.

#### 6.4 No-family-drift rule

The following are forbidden:

* inventing local grant types outside the canonical family list
* treating `manual_only` as a grant type
* reusing a status grant to perform a transactional action
* widening a minimal recovery grant into a seeded or PHI-bearing grant without fresh binding
* reissuing or rotating a grant without a fresh `AccessGrantScopeEnvelope`
* cloning a used, superseded, or drifted grant into support recovery, secure-link reissue, or continuation delivery without `AccessGrantSupersessionRecord`
* trusting frontend gating, browser state, or link shape when backend `AccessGrantScopeEnvelope` or `AccessGrantRedemptionRecord` disagrees

#### 6.5 Typed transaction-action routing rule

<!-- Architectural correction: patient self-service commands are typed and domain-owned so booking, callback, messaging, pharmacy, and contact-repair flows do not collapse back into generic triage unless safety or reachability policy explicitly requires it. -->

On any patient-originated command from the authenticated shell or a redeemed `transaction_action_minimal` grant:

1. resolve the command to exactly one `actionScope` and one route family
2. resolve the active `RouteIntentBinding` and one current `AudienceSurfaceRuntimeBinding`, then validate grant family, session epoch, subject binding, fence epoch, exact route-contract digest, exact `routeIntentTupleHash`, and, when applicable, `PatientEmbeddedSessionProjection`, manifest, release-freeze, bridge-capability, channel-freeze posture, and exact publication parity before writable state is loaded
3. bind the command to one current governing object descriptor, one current governing object, one current governing-object version or fence, one parent anchor, and one lineage; `respond_more_info` must also bind the current `MoreInfoReplyWindowCheckpoint` and latest `MoreInfoResponseDisposition` before writable posture is exposed. If the authoritative target tuple differs from the bound route intent, or if more than one current candidate target exists, reject or recover the action before mutation, and do not insert it into the generic triage queue as a fallback
4. write one `CommandActionRecord` with `actionScope`, governing object, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeContractDigestRef`, `parentAnchorRef`, `routeIntentTupleHash`, route intent, acting context, fence epoch, idempotency key, and causal token
5. route by scope:

   * `respond_more_info` -> active `MoreInfoCycle` plus its current `MoreInfoReplyWindowCheckpoint`
   * `waitlist_offer` -> active `WaitlistOffer`
   * `alternative_offer` -> active `AlternativeOfferSession`
   * `appointment_manage_entry` -> `BookingCase` or `HubCoordinationCase`
   * `pharmacy_status_entry` -> `PharmacyCase`
   * `callback_status_entry` and `callback_response` -> `CallbackCase`
   * `message_thread_entry` and `message_reply` -> `ClinicianMessageThread`
   * `contact_route_repair` -> the current `ContactRouteRepairJourney` bound to the affected `ReachabilityDependency` and its owning domain object
6. resolve the current `Request.currentSafetyDecisionRef`, `currentSafetyPreemptionRef`, and `safetyDecisionEpoch`; if the caller is behind the current epoch, or if a preemption or urgent-diversion issuance is still pending, return governed review or recovery posture rather than mutating from stale routine context
6A. when the resolved `actionScope` depends on an active `ReachabilityDependency`, validate the current `ReachabilityAssessmentRecord`, `ContactRouteSnapshot`, and `reachabilityEpoch`; if the assessment is not `clear` with `routeAuthorityState = current`, return governed `repair_required | stale_recoverable | blocked_policy` posture in the same shell rather than mutating from inferred healthy contact state
7. any submitted payload that can alter lineage evidence, chronology, contradiction burden, reachability, or routine-bypass posture must first traverse the canonical evidence-assimilation path, settling one immutable `EvidenceClassificationDecision`, one immutable `MaterialDeltaAssessment`, and one immutable `EvidenceAssimilationRecord`; exact or semantic replay returns the current assimilation chain rather than opening a second re-safety path
8. only after that settled classification may the owning service treat the submitted payload as `technical_metadata`, `operationally_material_nonclinical`, `contact_safety_relevant`, or `potentially_clinical`; low-confidence or degraded classifications must fail closed to review
9. only when the current `MaterialDeltaAssessment.triggerDecision = re_safety_required | blocked_manual_review` and the classification's `dominantEvidenceClass` is `potentially_clinical` or `contact_safety_relevant` may the owning service create `SafetyPreemptionRecord`, append `SafetyDecisionRecord`, and reacquire triage or urgent handling
10. persist `CommandSettlementRecord` for applied, pending, review, stale, blocked, or expired outcomes, bind it to the `TransitionEnvelope` required by the active surface contract, and attach the governing `ReleaseRecoveryDisposition` or `RouteFreezeDisposition` from the current `AudienceSurfaceRuntimeBinding` whenever ordinary writable posture is no longer valid
11. authenticated portal routes and secure-link routes must use the same typed routing table and route-intent contract so the same patient action behaves identically regardless of entry channel

`RouteIntentBinding`, `PatientActionRoutingProjection`, capability leases, and any redeemed `transaction_action_minimal` grant that lack the current target-tuple fields are `recovery_only`. Rollout and backfill must therefore reissue live writable CTAs on next render or redemption instead of allowing legacy partial bindings to keep mutating under the new model.

#### 6.5A More-info reply-window and late-response contract

When `actionScope = respond_more_info`:

1. resolve exactly one current `MoreInfoCycle`, its current `MoreInfoReplyWindowCheckpoint`, latest `MoreInfoReminderSchedule`, latest `MoreInfoResponseDisposition`, and current request-shell return target before writable UI or mutation is exposed
2. `MoreInfoReplyWindowCheckpoint` is the single authority for patient-visible due date, late-reply grace, reminder eligibility, and expiry posture. Client countdowns, link TTL, cached queue badges, copied email text, and local browser time are derived views only and may not compute independent actionability
3. any `transaction_action_minimal` grant or secure-link session for `respond_more_info` may be narrower than the checkpoint, but it may not extend or redefine that checkpoint. If the grant, embedded session, or secure-link session expires while the checkpoint is `open | reminder_due | late_review`, the shell must reopen same-lineage bounded recovery or step-up into the same cycle instead of presenting a false terminal expiry; if the checkpoint is `expired | superseded | settled`, live reply posture is forbidden even when a token still exists
4. reminder creation or send must compare-and-set the current checkpoint state, cycle supersession state, reachability epoch, and lineage fence. No reminder may send once checkpoint state becomes `late_review | expired | superseded | settled`, once contact repair is active, or after a later cycle supersedes the current one
5. every inbound reply must append one `MoreInfoResponseDisposition` with exactly one disposition from `accepted_in_window | accepted_late_review | superseded_duplicate | expired_rejected | blocked_repair` before evidence assimilation or queue resume continues
6. `accepted_late_review` is legal only while checkpoint state is `late_review`, the cycle is still current, request closure has not settled, and policy still allows late review. It must reopen the same request lineage in explicit review posture and may not render ordinary on-time receipt wording or schedule fresh reminders
7. `superseded_duplicate` and `expired_rejected` replies may preserve minimal receipt, audit, and bounded recovery context, but they may not mint a second `EvidenceSnapshot`, a second resume event, a second live composer, or a second more-info loop
8. if identity, release, publication, or continuity fences drift between route entry and submission, keep the same shell, preserve the last safe cycle summary, and return governed recovery or read-only posture instead of silently accepting or dropping the reply

#### 6.5B Contact-route repair continuity rule

When delivery failure, contact-route invalidation, or preference change threatens an active `ReachabilityDependency`:

1. create or refresh one `ContactRouteRepairJourney` bound to the dependency, current blocked assessment, owning domain object, blocked action scopes, current selected anchor, the current request return target where present, and current `resumeContinuationRef`
2. rotate or revoke any stale grants, route intents, or callback or message entry links that depended on the failed route; only the minimal `contact_route_repair` entry may remain live
3. preserve the blocked action summary and the current patient shell while suppressing ordinary reply, callback, reminder, waitlist, alternative-offer, pharmacy, or admin-resolution mutation controls
4. route any contact edit, verification, or route switch through one `ContactRouteVerificationCheckpoint`; applying a new route is not enough until verification succeeds, a new `ContactRouteSnapshot` is minted, a new `ReachabilityAssessmentRecord` is appended, and dependency rebind succeeds
5. resume the interrupted action only after `ContactRouteVerificationCheckpoint.verificationState = verified`, `rebindState = rebound`, the resulting `ReachabilityAssessmentRecord` is `clear` with `routeAuthorityState = current`, and the current return target, continuity evidence, and governing object version still match
6. if lineage, session, governing-object, or publication posture drifts while repair is active, keep the same shell and downgrade to bounded recovery rather than redirecting to generic settings, home, or detached success chrome

#### 6.6 Scoped mutation gate

All post-submit mutations from patient portal, secure links, staff consoles, hub desks, operations tools, or support tools must traverse `ScopedMutationGate`.

Algorithm:

1. resolve acting context, audience tier, break-glass status, and minimum necessary field scope before loading writable state
1A. resolve the current `StaffIdentityContext`, `ActingContext`, and `ActingScopeTuple` for the shell and route family; if tenant scope, organisation scope, environment, policy plane, purpose of use, elevation posture, break-glass state, visibility coverage, or runtime binding no longer matches the visible shell, return same-shell `stale_recoverable | denied_scope` posture instead of mutating
2. validate the current `CompiledPolicyBundle`, pinned `ReleaseApprovalFreeze`, any required `ChannelReleaseFreezeRecord`, the active `AudienceSurfaceRuntimeBinding`, and the route family that initiated the command
2A. for governance, support, hub, servicing-site, or cross-organisation actions, validate that the current route, `RouteIntentBinding`, and any governance or authority-link object still bind the same `ActingScopeTuple.tupleHash`; ambient session scope, raw role names, or browser-local selectors may not fill gaps
3. validate grant family or role scope, `actionScope`, `lineageScope`, active `RouteIntentBinding`, session epoch, subject binding version, expiry, supersession, redemption budget, token-key posture, exact route-contract digest, exact `routeIntentTupleHash`, and rate or abuse limits
4. resolve exactly one governing object descriptor, exactly one governing object, the current governing-object version or fence, the current parent anchor, the current `LineageFence.currentEpoch`, the current `Request.safetyDecisionEpoch`, and the latest settled `SafetyDecisionRecord` or active `SafetyPreemptionRecord` for the lineage; if the authoritative tuple does not exactly match the bound `RouteIntentBinding`, return same-shell `stale_recoverable | denied_scope` recovery instead of mutating
5. if projection freshness, causal token coverage, or safety-epoch coverage is insufficient for this action, force a command-following re-read or return a recovery response; do not mutate from a stale view
5A. if the current lineage has `SafetyPreemptionRecord.status = pending | blocked_manual_review`, or the latest `SafetyDecisionRecord.decisionState = pending_settlement`, or the latest `UrgentDiversionSettlement.settlementState = pending`, return governed `review_required | stale_recoverable | blocked_policy` posture in the same shell rather than mutating from stale calm state
5B. if the action depends on callback, message, reminder, waitlist, alternative-offer, pharmacy-contact, urgent-return, or outcome-confirmation reachability, resolve the current `ReachabilityDependency`, `currentReachabilityAssessmentRef`, `reachabilityEpoch`, and any active `ContactRouteRepairJourney`; stale, blocked, disputed, or superseded reachability posture must return same-shell repair or recovery rather than mutating from inferred healthy contact state
6. resolve or create `IdempotencyRecord` from `actionScope`, governing lineage, the current `routeIntentTupleHash` folded into governing scope fingerprint, source command id, transport correlation id, semantic payload hash, causal parent, and expected effect set; if the result is `exact_replay` or `semantic_replay`, return the current authoritative settlement and stop, and if the result is `collision_review`, open `ReplayCollisionReview`, quarantine automatic dispatch, and return governed review or recovery instead of mutating
7. attach idempotency key, fence epoch, correlation ID, actor reason code, policy-bundle reference, route-intent reference, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeContractDigestRef`, `parentAnchorRef`, and `routeIntentTupleHash`, write `CommandActionRecord`, then dispatch
8. on orphaned, expired, superseded, freeze-blocked, publication-stale, publication-parity-drifted, provenance-blocked, embedded-mismatch, ambiguous-target, or target-tuple-drifted actions, rotate or revoke stale grants and return `CommandSettlementRecord(result = stale_recoverable | denied_scope | blocked_policy | expired)` with the governing `ReleaseRecoveryDisposition` or `RouteFreezeDisposition` and recovery guidance in the same shell or workflow family
9. any inbound payload that can alter lineage evidence, chronology, contradiction burden, reachability, or routine-bypass posture must first traverse canonical evidence assimilation, settling one immutable `EvidenceClassificationDecision`, one immutable `MaterialDeltaAssessment`, and one immutable `EvidenceAssimilationRecord`; exact or semantic replay returns the current assimilation chain rather than opening a second re-safety path
10. if the current `MaterialDeltaAssessment.triggerDecision = blocked_manual_review`, fail closed to governed review or fallback-manual-review rather than allowing routine mutation or calm reassurance to continue
11. if the current `MaterialDeltaAssessment.triggerDecision = re_safety_required` and the classification is degraded, unreadable, or low-confidence in a safety-material path, fail closed to review or fallback-manual-review rather than silently downgrading it
12. if the current `MaterialDeltaAssessment.triggerDecision = re_safety_required` and the current `EvidenceClassificationDecision.dominantEvidenceClass` is `potentially_clinical` or `contact_safety_relevant`, create immutable snapshot, `SafetyPreemptionRecord`, and `SafetyDecisionRecord`, advance `safetyDecisionEpoch`, and only then allow routine downstream mutation or reacquired urgent handling to continue
13. when mutation completes, defers, or fails, persist `CommandSettlementRecord`; UI may advance only from that settlement or command-following projection truth

#### 6.6A Adapter outbox, inbox, and callback replay rule

Every externally consequential mutation must also obey one adapter-effect ledger:

1. derive `effectKey = H(actionRecordId || actionScope || governingObjectRef || expectedEffectSetHash || intentGeneration)` before the first external send
2. create or reuse one live `AdapterDispatchAttempt` for that `effectKey`; duplicate workers, retries, or replayed jobs must return the same attempt instead of issuing a second external side effect
3. dispatch only from a persisted outbox or equivalent durable queue position that points back to the owning `CommandActionRecord`
4. treat transport acknowledgement as evidence only; it may advance `AdapterDispatchAttempt.status`, but it may not imply authoritative domain success without the governing receipt or read-after-write proof
5. accept inbound webhooks, callbacks, and receipts only through `AdapterReceiptCheckpoint`, keyed by the adapter profile's correlation and ordering policy; exact or semantic replay updates the linked attempt, stale out-of-order receipts are ignored safely, and semantically divergent receipts open `ReplayCollisionReview`
6. only one authoritative settlement chain may emerge from a given `effectKey`; duplicate or reordered callbacks may supersede pending or ambiguous posture, but they may not create a second command result, second external confirmation, or second domain object

### 7. Universal safety-preemption and reachability-risk algorithm

#### 7.1 Evidence classification

Every inbound evidence item must be classified as:

* `technical_metadata`
* `operationally_material_nonclinical`
* `contact_safety_relevant`
* `potentially_clinical`

Only explicit allow-listed items may be classified as `technical_metadata`, including:

* delivery receipt
* transport acknowledgement
* attachment scan state
* virus scan state
* template render state
* read receipt

`operationally_material_nonclinical` includes items such as:

* non-critical preference change
* non-critical route metadata update
* grant issue or revoke event that does not alter a live contact dependency

`contact_safety_relevant` includes:

* delivery failure where an active `ReachabilityDependency` exists
* contact-route change that invalidates a route required by an active dependency
* preference change that prevents timely execution of an active dependency
* inability to contact during callback, urgent return, or required pharmacy follow-up

All other new evidence defaults to `potentially_clinical`.

Clinical chronology and system chronology must both be preserved. Safety reconciliation orders symptom and timing facts by `observedAt` when the source can supply it, but uses `recordedAt` for idempotency, fencing, and replay. A late-arriving backdated item must create a new immutable snapshot and force re-safety; it may not silently rewrite a previously issued urgent or routine outcome.

#### 7.1A Classification authority and fail-closed rules

Every classification pass must first append one immutable `EvidenceClassificationDecision` over the triggering snapshot or event batch. That decision is the only authority allowed to explain why evidence was routed as nonclinical, contact-safety-relevant, clinically material, or fail-closed review.

Apply these rules:

1. when one command or ingest batch carries multiple evidence items, compute the dominant class as the highest-safety class across the batch; routine items may not hide one safety-material item behind a calmer majority
2. unreadable attachments, partial transcript output, OCR or extractor failure, parser timeout, or conflicting extractor outputs may not downgrade a batch to `technical_metadata` or `operationally_material_nonclinical` when safety meaning is unresolved; classify it as `potentially_clinical` or settle `misclassificationRiskState = fail_closed_review`
3. only explicit allow-list policy may classify a batch as `technical_metadata`; transport or adapter convenience is never enough
4. dependency-triggered upgrades to `contact_safety_relevant` must record the exact `ReachabilityDependency` refs and reason codes so later repair or override cannot pretend the upgrade was heuristic noise
5. manual override may supersede a prior classification only by appending a new `EvidenceClassificationDecision`; past misclassification history remains part of the lineage audit

#### 7.1B Canonical evidence assimilation and material-delta gate

Every post-submit evidence ingress must first traverse one canonical assimilation gate before queue ranking, workflow continuation, patient reassurance, or downstream completion can advance.

Apply this algorithm:

1. freeze the inbound reply, callback outcome, support capture, booking narrative, pharmacy outcome, adapter observation, or late artifact into immutable evidence or event form
2. resolve the governing lineage, governing object, prior composite snapshot, and any currently pending assimilation or preemption for that lineage
3. on exact or semantic replay, return the live `EvidenceAssimilationRecord` and do not mint a second snapshot, second preemption, or second downstream continuation
4. derive the candidate snapshot or derivative package under the Phase 0 immutability rules; non-material enrichments may remain derivative-only, but they may not decide that locally
5. settle one immutable `EvidenceClassificationDecision` for the incoming batch
6. settle one immutable `MaterialDeltaAssessment` comparing the candidate evidence against the prior composite evidence, chronology, contradiction state, active dependencies, and current materiality policy
7. write one `EvidenceAssimilationRecord` that binds the ingress batch, candidate snapshot or derivative, classification, material-delta decision, and resulting preemption or no-trigger settlement
8. if `MaterialDeltaAssessment.triggerDecision = no_re_safety`, only then may the owning domain continue with projection or workflow updates, and only from the settled assimilation record
9. if `triggerDecision = re_safety_required | blocked_manual_review`, open or reuse the governed re-safety path immediately; routine continuation, calm queue posture, and quiet patient or staff reassurance must stay blocked until the safety chain settles

`MaterialDeltaAssessment` is therefore the explicit answer to “why did this input reopen safety” or “why did it not,” and no domain-local heuristic may replace it.

#### 7.1.1 Composite evidence, reliability, and contradiction handling

For composite snapshot `S` and derived clinical feature `f`, maintain a governed support lattice rather than a last-write-wins field overwrite:

* `rho(e) = rho_source(e) * rho_integrity(e) * rho_binding(e)` for evidence item `e`, with each factor in `[0,1]`
* `m_f^+(S) = sum_{e in S} 1[e supports f] * rho(e)`
* `m_f^-(S) = sum_{e in S} 1[e contradicts f] * rho(e)`
* `conf_f(S) = min(m_f^+(S), m_f^-(S)) / (m_f^+(S) + m_f^-(S) + epsilon)`

Resolve each feature into a tri-state value:

* `state_f(S) = present` if `m_f^+(S) - m_f^-(S) >= delta_f^+` and `conf_f(S) <= gamma_f`
* `state_f(S) = absent` if `m_f^-(S) - m_f^+(S) >= delta_f^-` and `conf_f(S) <= gamma_f`
* `state_f(S) = unresolved` otherwise

`rho_source`, `delta_f^+`, `delta_f^-`, and `gamma_f` must be policy-bundle values, versioned by evidence source and feature family. Hard-stop antecedents never use plain last-writer precedence. A lower-assurance contradiction may open `unresolved`, but it may not clear a previously supported urgent antecedent without an explicit clinician-resolution event or a higher-assurance governed override. This keeps red-flag monotonicity intact under conflicting inputs.

Define the critical-feature burden terms:

* `m_crit(S) = |{f in F_crit : state_f(S) = unresolved}| / max(1, |F_crit|)`
* `c_crit(S) = max_{f in F_crit} conf_f(S)`

where `F_crit` is the pack-versioned set of features whose absence, contradiction, or unresolved state is safety-material for the request type.

#### 7.1.2 Reachability-risk function

For each active `ReachabilityDependency` `d`, compute a bounded contact-risk term:

* `p_contact_success(d,S)` from the current `ReachabilityAssessmentRecord` under the current `ContactRouteSnapshot`; use `1` only when `assessmentState = clear`, `routeAuthorityState = current`, and current policy allows the observed or verified route posture to count as durably reachable
* use `0` when `assessmentState = blocked`, `deliverabilityState = confirmed_failed`, or the current route authority is `disputed | superseded`
* use a bounded risk prior only when `assessmentState = at_risk`, `routeAuthorityState = current`, and `falseNegativeGuardState = pass`; stale verification, stale demographics, stale preferences, or insufficient observation must fail into the configured fail-closed risk band rather than reusing a calm channel prior
* `time_pressure_d(S) = exp(-max(0, workingMinutesBetween(now, deadlineAt_d)) / tau_d)`
* `w_fail(d) = 1.0` for `failureEffect = escalate`, `0.8` for `urgent_review`, `0.4` for `requeue`, and `0.2` for `invalidate_pending_action`
* `kappa_d(S) = w_fail(d) * (1 - p_contact_success(d,S)) * time_pressure_d(S)`

Then derive:

* `kappa_U(S) = max_{d active and failureEffect in {escalate, urgent_review}} kappa_d(S)`
* `kappa_R(S) = max_{d active} kappa_d(S)`

This makes a near-deadline failed urgent return dominate a far-future routine reminder miss, which is the correct operational ordering.

#### 7.2 Mandatory preemption rule

For any evidence batch whose settled `MaterialDeltaAssessment.triggerDecision = re_safety_required | blocked_manual_review`, and whose `EvidenceClassificationDecision.dominantEvidenceClass = potentially_clinical | contact_safety_relevant`:

1. persist immutable snapshot
2. settle one immutable `EvidenceClassificationDecision`
3. create `SafetyPreemptionRecord(status = pending, openingSafetyEpoch = Request.safetyDecisionEpoch + 1)` bound to that classification decision and the blocked action scopes
4. recompute latest composite evidence
5. run canonical safety or contact-risk policy and append one `SafetyDecisionRecord(decisionState = pending_settlement, resultingSafetyEpoch = openingSafetyEpoch)`
6. block routine continuation until the decision, and when urgent is required the urgent-diversion issuance, is complete

This rule applies equally to:

* more-info replies
* SMS continuation details
* clinician-message replies
* callback outcomes
* support-side structured capture or governed override evidence
* duplicate-resolution candidate evidence
* booking notes or booking change narratives
* hub return notes
* pharmacy bounce-backs
* external observations and async enrichment that materially change chronology, contradiction burden, or interpreted clinical meaning
* manual structured capture containing clinically meaningful content
* reachability failures on active callback, more-info, waitlist, alternative-offer, pharmacy-contact, or urgent-return dependencies

For any evidence batch whose `EvidenceClassificationDecision.misclassificationRiskState = fail_closed_review | urgent_hold`, the platform must keep the new `SafetyPreemptionRecord` open and settle `SafetyDecisionRecord.decisionOutcome = fallback_manual_review` or the appropriate urgent outcome rather than silently clearing to routine flow.

#### 7.2.1 Canonical urgent and residual-risk functions

The canonical engine remains rules-first, not model-first. It evaluates authored decision tables first, then uses a calibrated monotone aggregation layer for soft evidence accumulation. For rule `r`, let `I_r(S) in {0,1}` be the authored rule result under the tri-state feature semantics above. Rules are partitioned into dependency groups `G_g` so correlated findings are not double-counted. Let `lambda_r >= 0` be the pack-versioned log-likelihood contribution for rule `r`, and let `C_g^U` and `C_g^R` cap the maximum urgent and residual contribution of dependency group `g`.

Compute:

* `z_U(S) = beta_U + sum_g min(C_g^U, sum_{r in G_g^U} I_r(S) * lambda_r) + beta_kU * kappa_U(S) + beta_mU * m_crit(S)`
* `z_R(S) = beta_R + sum_g min(C_g^R, sum_{r in G_g^R} I_r(S) * lambda_r) + beta_kR * kappa_R(S) + beta_cR * c_crit(S) + beta_mR * m_crit(S)`
* `p_U(S) = g_U(sigma(z_U(S)))`
* `p_R(S) = g_R(sigma(z_R(S)))`

where `sigma(x) = 1 / (1 + exp(-x))`, and `g_U` and `g_R` are versioned non-decreasing calibration maps. Until a pathway has enough adjudicated challenge cases to support calibration safely, use the identity map. Once calibration is enabled, fit it only at policy-bundle promotion boundaries, never mid-case, and persist the calibrator version on every settled safety decision. Monotone calibration such as isotonic regression is appropriate here because it preserves the ordering induced by the authored rule pack while correcting miscalibrated soft scores. ([Zadrozny and Elkan][6])

Hard-stop rules always dominate the soft scores. Let `H(S) = 1` if any hard-stop rule fires, including any rule whose `missingnessMode = conservative_hold` and whose critical antecedent remains `unresolved`. Then the decision boundary is:

* urgent if `H(S) = 1` or `p_U(S) >= theta_U`
* residual-risk if urgent is false and (`p_R(S) >= theta_R` or `c_crit(S) >= theta_conf` or `m_crit(S) >= theta_miss`)
* clear otherwise

Thresholds must be derived from explicit harm ratios, not intuition alone:

* `theta_U = C_FP^U / (C_FP^U + C_FN^U)`
* `theta_R = C_FP^R / (C_FP^R + C_FN^R)`

where `C_FN^U` is the harm of leaving an urgent case in routine flow, `C_FP^U` is the harm of unnecessary urgent diversion, `C_FN^R` is the harm of wrongly clearing a case that should remain flagged, and `C_FP^R` is the operational cost of unnecessary review. Choose and sign off these costs clinically, keep them pack-versioned, and verify them on a held-out challenge set. This follows the standard threshold approach to clinical decision-making rather than ad hoc numeric cut-offs. ([Pauker and Kassirer][7])

Each release of the soft-score layer must report, at minimum, urgent sensitivity at `theta_U`, residual-review capture at `theta_R`, Brier score, calibration intercept, and calibration slope for each request-type or pathway stratum that has enough volume to support separate reporting. ([Murphy][8])

#### 7.2.2 Monotonic and safety-preserving invariants

The following invariants are mandatory:

1. adding non-contradicted support to a fired hard-stop antecedent may keep or increase urgency, but may never decrease it
2. a request may not transition to `screen_clear` while any critical feature remains `unresolved` because of contradiction or missingness above threshold
3. a lower-assurance contradiction may open a conflict state, but only clinician-resolution or higher-assurance governed override may clear the corresponding urgent antecedent
4. the calibration maps `g_U` and `g_R` must be non-decreasing; recalibration may change probability values, but may not invert ordering for the same rule-pack output
5. for the same immutable snapshot, same rule pack, and same calibrator version, the engine must return the same decision tuple `(H, p_U, p_R, c_crit, m_crit)`

#### 7.3 Pending assimilation and preemption behavior

While any `EvidenceAssimilationRecord.assimilationState = pending_materiality | pending_classification | pending_preemption | blocked_manual_review`, or any `SafetyPreemptionRecord.status = pending`:

* request closure is forbidden
* final routine completion messaging is forbidden
* final downstream completion handoff is forbidden
* automatic queue resumption is forbidden
* routine reassurance that ignores the new evidence is forbidden
* safety-critical commit actions must remain blocked until the delta is acknowledged or resolved
* any command whose expected `safetyDecisionEpoch` is stale must fail closed into review, recovery, or safety-preempted posture rather than mutating from the earlier calm state
* patient, staff, booking, callback, hub, pharmacy, and support shells may keep the same shell and anchor, but they may not render calm actionable posture unless the latest `EvidenceAssimilationRecord` is settled, the latest `MaterialDeltaAssessment` has either recorded `no_re_safety` or produced a settled safety chain, and any required `UrgentDiversionSettlement` has also settled

#### 7.4 Safety outcomes

If safety or contact-risk outcome is urgent:

* settle `SafetyDecisionRecord(decisionOutcome = urgent_required | urgent_live, requestedSafetyState = urgent_diversion_required, decisionState = settled)` for the current epoch
* mark preemption `escalated_urgent`
* set `Request.safetyState = urgent_diversion_required`
* preempt routine flow immediately
* create or refresh one `UrgentDiversionSettlement(settlementState = pending)`
* reacquire triage ownership or urgent diversion path
* emit an urgent non-bufferable UI delta under section 12
* move to `urgent_diverted` only after `UrgentDiversionSettlement.settlementState = issued`

If outcome remains routine but above the residual threshold:

* settle `SafetyDecisionRecord(decisionOutcome = residual_review, requestedSafetyState = residual_risk_flagged, decisionState = settled)` for the current epoch
* mark preemption `cleared_routine`
* set `Request.safetyState = residual_risk_flagged`
* persist the active residual-risk band, conflict vector, and contributing rule IDs on the request lineage
* resume the appropriate owner path
* reopen triage if policy requires human reassessment
* if the issue was reachability-only, execute the configured requeue, route repair, or dependency-failure policy

If the outcome is clear:

* settle `SafetyDecisionRecord(decisionOutcome = clear_routine, requestedSafetyState = screen_clear, decisionState = settled)` for the current epoch
* mark preemption `cleared_routine`
* set `Request.safetyState = screen_clear`
* resume the appropriate owner path without residual-risk elevation

If the engine, parser, or evidence basis cannot safely distinguish clear, residual, and urgent handling:

* settle `SafetyDecisionRecord(decisionOutcome = fallback_manual_review, decisionState = settled)` for the current epoch
* keep `SafetyPreemptionRecord.status = blocked_manual_review`
* suppress calm routine reassurance
* open the governed fallback review or urgent manual path instead of silently clearing

#### 7.5 Incremental re-safety, bounded churn, and runtime complexity

Persist, per request, the latest feature-support vector, rule-hit bitmap, dependency-group sums, calibrator version, and settled decision tuple. On new snapshot `S'`, derive the changed feature set `Delta_F` and active dependency delta `Delta_D`, then recompute only:

* rules whose antecedent graph touches `Delta_F`
* all hard-stop rules
* all active reachability rules touched by `Delta_D`

This makes steady-state re-safety `O(|Delta_F| + |adj(Delta_F)| + |Delta_D|)` instead of `O(|R|)` full-pack rescoring for every reply or route repair. Cache invalidation must be keyed by rule-pack version, calibrator version, and request-type stratum.

Add churn protection: if more than `N_reopen_max = 3` safety preemptions or reopen-clears occur for the same request inside a rolling `W_reopen = 24h` window without any new high-assurance evidence or clinician-resolution event, freeze automatic routine resumption and escalate supervisor review. This prevents oscillation under noisy, conflicting, or duplicate inputs while still preserving every immutable snapshot and preemption decision.

### 8. Duplicate detection, clustering, and attach discipline

#### 8.1 Candidate generation

Candidate generation must maximize recall without relying on one brittle blocking key. For incoming entity `x`, search over the union of blocking keys from:

* verified `patientRef`
* any candidate patient with `P_link >= tau_block_identity`
* exact or canonical `k_replay`
* source lineage, continuation access grant, telephony continuation context, workflow return token, or more-info thread
* telephony session or channel correlation
* request type and pathway
* temporal buckets around `submittedAt` and any normalized onset interval
* approximate nearest neighbours over versioned semantic fingerprints or embeddings

Time may suppress impossible comparisons, but time alone must never prove replay, same-episode continuity, or distinctness.

#### 8.2 Pairwise similarity, replay, and relation scoring

For every candidate pair `(x, y)`, compute a missingness-aware feature vector `phi(x, y)` and retain explicit missingness flags. At minimum include:

* deterministic replay agreement: source-command match, transport-correlation match, `h_sem` match, `k_replay` match
* lineage continuity: source-lineage match, continuation access-grant match, telephony continuation-context match, workflow-return-token match, call-session match, more-info-thread match
* patient continuity posterior `P_patient_same(x, y)`
* semantic similarity `sim_sem(x, y)`
* temporal similarity `sim_time(x, y)`
* channel and pathway compatibility indicators
* hard conflict indicators: explicit distinct-intent acknowledgement, contradictory onset or reason, divergent clinician decision, divergent downstream lease or handoff, patient mismatch, or closed-lineage constraints

Define:

* `sim_sem(x, y) = w_text * cos(e_x, e_y) + w_struct * J_w(C_x, C_y) + w_path * 1[pathway_x = pathway_y] + w_onset * IoU(I_x, I_y)`
* `sim_time(x, y) = exp(-max(0, |t_submit(x) - t_submit(y)| - g_submit) / tau_submit) * exp(-max(0, d_onset(x, y) - g_onset) / tau_onset)`

where `J_w` is weighted Jaccard on normalized concern, body-site, route, and structured-symptom tokens; `I_*` is the normalized onset interval; `d_onset` is interval distance; and missing components renormalize the active weights so absent evidence is not misread as disagreement.

For classes `c in {retry, same_request_attach, same_episode, related_episode, new_episode}`:

* `l_c(x, y) = alpha_c + beta_c^T phi(x, y) - M * 1[hard_blocker(c, x, y)]`
* `pi(x, y) = Cal_relation_version(softmax(l(x, y)))`, with `pi_c(x, y)` denoting class component `c`

Let `c1` and `c2` be the top two classes, let `margin(x, y) = log((pi_c1(x, y) + eps) / (pi_c2(x, y) + eps))`, and let normalized uncertainty be `u(x, y) = -sum_c pi_c(x, y) * log(pi_c(x, y) + eps) / log(5)`, with `eps = 1e-6`.

Use the same conservative defaults from section 4.4, and use `tau_review = 0.350` when no pathway-specific review threshold exists.

#### 8.3 Automatic retry collapse and attach rules

Automatic retry collapse is allowed only for strict idempotent replay and only when all are true:

* deterministic replay evidence is present
* `pi_retry >= tau_retry_auto`
* `margin >= delta_retry`
* `u <= u_auto_max`
* no hard blocker or divergent settlement exists

Automatic attach to an existing `Request` is allowed only when all are true:

* the internal class `same_request_attach` wins with `pi_same_request_attach >= tau_attach_auto`, `margin >= delta_auto`, and `u <= u_auto_max`
* explicit continuity token, same submit lineage, or explicitly linked workflow return exists
* `P_patient_same >= tau_patient_episode(routeSensitivity)`
* `sim_sem >= tau_sem_episode(routeSensitivity)`
* no separate patient acknowledgement of a distinct contact exists
* no divergent clinician decision exists
* no separate downstream lease or acknowledged handoff exists, unless a human explicitly confirms same-request continuation

If `pi_same_episode >= tau_episode_auto` but attach conditions fail, create a separate `Request` inside the same `Episode`. Same-episode truth is not the same as same-request attach safety.

#### 8.4 Metadata handling

`technical_metadata` may attach without safety rerun only when replay or same-request continuity is already proven.

`operationally_material_nonclinical` may update the same request only when same-request continuity is already proven, the relevant access, communications, or dependency policy is re-evaluated, and the update does not alter the semantic episode fingerprint.

The following are never merge-safe metadata by default:

* new narrative text
* new structured answers
* manual notes
* clinically interpretable attachments
* new symptom detail
* new risk detail

#### 8.5 Cluster formation and review thresholds

Build a pairwise graph on requests and snapshots after exact replays are stripped.

* `retry` edges are allowed only from deterministic replay-safe pairs and may collapse to the same accepted command outcome.
* `same_episode_confirmed` auto-clustering must be canonical-centered:
  1. choose provisional canonical request `r_star = argmax_r sum_{i != r} log(pi_same_episode(i, r) + pi_same_request_attach(i, r) + eps)`
  2. admit member `i` only if `pi_same_episode(i, r_star) >= tau_episode_auto`, `P_patient_same(i, r_star) >= tau_patient_episode(routeSensitivity)`, `sim_sem(i, r_star) >= tau_sem_episode(routeSensitivity)`, `margin(i, r_star) >= delta_auto`, `candidateMargin_same_episode(i) >= delta_target_auto`, `u(i, r_star) <= u_auto_max`, and no hard conflict exists between `i` and `r_star`
  3. reject transitive chaining where `i` matches `j` and `j` matches `k` but `i` conflicts with `k` or with `r_star`

Review clusters may use connected components over candidate edges with `max(pi_same_request_attach, pi_same_episode, pi_related_episode) >= tau_review`, but connectedness is an operator convenience only and never by itself proof of attach, merge, or same-episode truth.

Define cluster confidence for an auto-confirmed episode cluster as `conf_cluster = min_i pi_same_episode(i, r_star)` and recompute it whenever a new member, new evidence snapshot, or new downstream divergence enters the cluster.

#### 8.6 Review-required cluster handling

1. `DuplicateCluster(review_required)` must create explicit review work linked from `TriageTask.duplicateClusterRef` or equivalent queue artifact.
2. While unresolved, it blocks auto-attach, auto-merge, final closure, and any cached decision that assumed one lineage.
3. Patient-visible actions may continue only on the specific governing object they were issued for; cross-lineage shortcuts are invalid.
4. Resolving the cluster must persist one append-only `DuplicateResolutionDecision` naming the winning `DuplicatePairEvidence`, competing candidates, continuity witness when attach is chosen, actor, reason, and lineage mapping, and must invalidate stale approvals, stale offers, stale transactional links, and stale analytics joins on every affected request.
5. Reversal of an earlier attach, retry collapse, or same-episode confirmation must append a superseding `DuplicateResolutionDecision`; past lineage history and prior audit must stay intact.
6. Any cluster with explicit conflict indicators, high normalized uncertainty, low candidate margin, or oscillation across recomputations must stay in review even if one pairwise score is high; unstable clusters are not auto-confirm safe.

### 9. Request and episode lifecycle, concurrency, reopen, and closure algorithm

#### 9.1 Lease acquisition

Every active workflow object must acquire a `RequestLifecycleLease`, including:

* triage task
* more-info cycle
* approval checkpoint
* callback case
* clinician-message thread
* booking case
* hub coordination case
* pharmacy case
* reconciliation case
* exception case
* identity repair case

Lease acquisition rules:

1. `LeaseAuthority` must resolve the current lease pointer, `ownershipEpoch`, governing object version, and permitted transition set before any claimant becomes writable.
2. Successful acquire or supervised takeover must compare-and-set those expected values, mint one fresh `ownershipEpoch` plus `fencingToken`, append the new `RequestLifecycleLease`, and update the governing object's current lease reference atomically.
3. Reopening writable posture after disconnect is legal only while the claimant still presents the current `ownershipEpoch`, `fencingToken`, and owning session or worker reference; otherwise recovery or takeover rules apply.

#### 9.2 Lease heartbeat and stale-owner fencing

1. Every active lease must declare `leaseTtlSeconds = clamp(k_ttl * p99CriticalSectionSeconds(domain) + delta_net + delta_clock, ttl_min, ttl_max)`.
2. The owning worker or session must heartbeat on `min(leaseTtlSeconds / 3, heartbeatMaxSeconds)` with bounded jitter before TTL expiry.
3. Every lease mutation must include both `fencingToken` and expected `ownershipEpoch`, minted from monotonic sequences in `LeaseAuthority`.
4. Commands from stale owners or superseded ownership epochs must fail, create or reuse one `StaleOwnershipRecoveryRecord`, and surface bounded reacquire posture instead of silently retrying.
5. If a lease expires without release:

   * mark it `expired`
   * compute `breakEligibleAt = heartbeatAt + leaseTtlSeconds + breakGuardSeconds`
   * create operator-visible recovery work bound to one open `StaleOwnershipRecoveryRecord`
   * freeze downstream mutation and closure posture until that recovery is resolved
   * allow governed stale-lease break only after `breakEligibleAt` under audited procedure
6. Reacquisition after transient disconnect may reuse writable posture only while the claimant still presents the current `fencingToken`, current `ownershipEpoch`, and same owning session or worker reference; otherwise a new token and epoch must be minted and the old one fenced off.
7. Supervisor takeover or stale-lease break must append one `LeaseTakeoverRecord`, mint fresh `ownershipEpoch` and `fencingToken`, supersede the prior lease, and invalidate old writable projections or workers before the new owner may commit.
8. Closure evaluation must treat `active`, `releasing`, and not-yet-remediated `expired` or `broken` leases, open `StaleOwnershipRecoveryRecord`, or pending takeover as blockers.

#### 9.3 Lineage fence rule

The following commands must present the current `LineageFence.currentEpoch`:

* close
* reopen
* ownership transfer
* identity correction
* urgent preemption transition
* cross-domain commit that changes episode terminality
* compensation that resolves an external confirmation gate

If the epoch is stale:

* reject the command
* re-read authoritative state
* reevaluate

#### 9.4 Workflow state ownership

1. Domain services may propose milestone changes.
2. Only `LifecycleCoordinator` may make cross-domain closure or governed reopen decisions.
3. `Request.workflowState` is derived under coordinator control.
4. `Episode.state` may become `resolved` only when all related requests and branches satisfy closure policy.
5. `RequestLineage` and `LineageCaseLink` preserve continuity and child-work ownership, but they may not themselves masquerade as lifecycle truth.

#### 9.5 Required workflow semantics

* `triage_ready` only when triage work is eligible
* `triage_active` while any triage-side lease is active or reacquired
* `handoff_active` while booking, hub, or pharmacy work is active
* `outcome_recorded` when a terminal local outcome exists but global closure is not yet safe
* unresolved confirmation, outcome reconciliation, identity repair, duplicate review, fallback recovery, and reachability repair live in `currentConfirmationGateRefs[]` or `currentClosureBlockerRefs[]`; they do not create extra `Request.workflowState` values
* `closed` only after persisted `RequestClosureRecord` and an empty blocker set

#### 9.6 Closure evaluation algorithm

`LifecycleCoordinator` must evaluate all of the following before closure:

1. no active, releasing, unremediated expired, or broken lifecycle lease remains
2. no pending `SafetyPreemptionRecord` remains
3. no approval or `ExternalConfirmationGate` remains unresolved, except where policy explicitly downgrades it to an operational follow-up that is not required for safe closure
4. no disputed booking, dispatch, pharmacy outcome, or external confirmation state remains
5. no active `PharmacyOutcomeReconciliationGate(blockingClosureState = blocks_close)` or equivalent unresolved weak-match review seam remains on the lineage
6. no active `IdentityRepairCase`, unresolved `DuplicateCluster(review_required)`, or open `FallbackReviewCase` remains on the lineage
7. no active reachability repair or contact-route dependency remains for any promise still represented as current
8. no active PHI-bearing public, continuation, or transactional grant remains
9. `Request.currentClosureBlockerRefs[]`, `Request.currentConfirmationGateRefs[]`, and their episode-level equivalents are empty after coordinator materialization
10. no `LineageCaseLink` on the request lineage remains in `proposed | acknowledged | active | returned` without a corresponding governed return, completion, supersession, or compensation settlement
11. required `command_following` projections have consumed the required causal token
12. a terminal outcome exists for the request
13. if episode-level closure is being evaluated, all sibling requests and branches satisfy episode closure policy
14. if practice acknowledgement is pending for a hub booking, or the latest required acknowledgement generation has not been satisfied for the latest material continuity delta, it blocks closure only when policy marks it as clinically, legally, or operationally required for safe continuity; otherwise it becomes an escalated operational dependency, not a perpetual closure blocker
15. no active consent-pending dependency or degraded confirmation gate remains for any live patient promise still being represented as current

If any check fails:

* persist `RequestClosureRecord(decision = defer)`
* do not close

If all checks succeed:

* persist `RequestClosureRecord(decision = close)`
* set `Request.workflowState = closed`

#### 9.7 Reopen triggers

For new inbound or reconciled evidence `e` on lineage `l`, compute:

* `u_urgent(e) in {0,1}` from urgent GP action, safeguarding, or other hard preemption
* `u_unable(e) in {0,1}` from unable-to-complete or equivalent failed-completion signal
* `u_contact(e) in [0,1]` from unable-to-contact or contact-route failure severity
* `u_bounce(e) in [0,1]` from clinically meaningful bounce-back content
* `u_revocation(e) in [0,1]` from post-dispatch consent revocation or withdrawal that changes current safety posture
* `u_contradiction(e) in [0,1]` from materially conflicting booking, dispatch, provider, or identity evidence
* `delta_j(e,l) in [0,1]` for new clinical, contact, provider, consent, timing, or identity information relative to the last settled lineage state
* `materialChange(e,l) = 1 - product_j (1 - nu_j * delta_j(e,l))`, with `nu_j >= 0` and `sum nu_j = 1`
* `loopRisk(e,l) = min(returnCount_l / B_loop, 1) * (1 - materialChange(e,l))`
* `reopenSignal(e,l) = max(u_urgent(e), u_unable(e), u_contact(e), u_bounce(e), u_revocation(e), u_contradiction(e))`

The lineage must reacquire triage or equivalent governing ownership and prevent closure when `u_urgent(e) = 1` or `reopenSignal(e,l) >= tau_reopen`.

At minimum, the trigger families include:

* materially new evidence
* urgent bounce-back
* pharmacy unable-to-complete
* callback escalation
* wrong-patient correction
* booking dispute or ambiguous confirmation
* hub return requiring reassessment
* contact dependency failure where policy requires reassessment

When reopen occurs, persist `reopenSignal`, `materialChange`, and `loopRisk`, then derive `reopenPriorityBand = max(originPriorityBand_l, 3 * 1[u_urgent(e) = 1], 2 * 1[max(u_unable(e), u_contact(e)) >= tau_reopen_secondary], 1 * 1[loopRisk(e,l) >= tau_loop])`.

If `loopRisk(e,l) >= tau_loop`, escalate to supervisor review and block automatic redispatch or automatic re-close until governed review completes.

### 10. Capacity reservation, ranking, waitlist, and hub arbitration algorithm

#### 10.1 Canonical capacity identity

Every schedulable offer must resolve to `CapacityIdentity`.

Reservation serialization must use `canonicalReservationKey`, not a naive universal slot assumption.

#### 10.2 Urgency-first ordering rule

Within any clinically acceptable search space:

1. partition candidates by clinically safe timeliness band
2. rank earliest clinically safe supply before convenience or continuity preferences can reorder across bands
3. allow preference optimization only inside the same medically acceptable band unless policy explicitly states otherwise

Timeliness must not compete directly with convenience once the patient is near the edge of the clinically safe window.

#### 10.2A Canonical capacity rank proof and explanation

Create and refresh:

- `CapacityRankProof`
- `CapacityRankExplanation`
- `CapacityRankDisclosurePolicy`

Where:

- `CapacityRankProof` serializes one stable candidate universe, one rank-plan version, one visible order, and one frontier or dominance result for a local-booking snapshot or network decision plan
- `CapacityRankExplanation` serializes why one candidate sits at its current ordinal, including patient-safe reason cues plus staff, support, and operations replay detail for that same ordered proof
- `CapacityRankDisclosurePolicy` binds audience-safe explanation grammar to the same proof so patient copy, staff coordination, support replay, and operations diagnostics cannot fork into separate local ranking stories

**CapacityRankProof**
`capacityRankProofId`, `rankingScope = local_booking | network_hub | alternative_offer`, `sourceSnapshotRef`, `sourceDecisionPlanRef`, `rankPlanVersionRef`, `candidateUniverseHash`, `orderedCandidateRefs[]`, `frontierCandidateRefs[]`, `dominatedCandidateRefs[]`, `patientOfferableCandidateRefs[]`, `explanationRefs[]`, `tieBreakSchemaRef`, `generatedAt`, `supersededAt`

**CapacityRankExplanation**
`capacityRankExplanationId`, `capacityRankProofRef`, `candidateRef`, `rankOrdinal`, `windowClass`, `frontierState = frontier_ranked | non_frontier | dominated_removed | filtered_out | explanation_only`, `sourceTrustState = trusted | degraded | quarantined | not_applicable`, `normalizedFeatureVectorRef`, `reasonCodeRefs[]`, `patientReasonCueRefs[]`, `staffExplanationRefs[]`, `supportExplanationRefs[]`, `opsDiagnosticRefs[]`, `uncertaintyRadius`, `robustFit`, `dominanceDisposition = none | retained | removed_by_dominance | retained_after_tie`, `canonicalTieBreakKey`, `rankPlanVersionRef`, `explanationTupleHash`, `generatedAt`

**CapacityRankDisclosurePolicy**
`capacityRankDisclosurePolicyId`, `surfaceFamily = patient_booking | patient_network_offer | staff_booking | hub_console | support_replay | operations_capacity`, `audienceTier`, `plainLanguageTemplateSetRef`, `allowedReasonCodeRefs[]`, `numericExposureMode = hidden | bucketed | diagnostic`, `uncertaintyDisclosureMode = hidden | patient_plain_language | diagnostic`, `dominanceDisclosureMode = hidden | patient_plain_language | diagnostic`, `tieBreakDisclosureMode = hidden | simple_order | diagnostic`, `policyState = active | superseded`, `publishedAt`

Rules:

1. `SlotSetSnapshot`, `SnapshotCandidateIndex`, `OfferSession`, `PatientAppointmentWorkspaceProjection`, `NetworkCandidateSnapshot`, `CrossSiteDecisionPlan`, `AlternativeOfferSession`, `HubOptionCardProjection`, and any support or operations replay surface that explains capacity order must bind one current `CapacityRankProof` plus the applicable `CapacityRankDisclosurePolicy`.
2. Day grouping, site grouping, compare mode, pagination, selected-card pinning, and filter toggles may hide or cluster candidates, but they may not alter the relative order of still-visible candidates unless a newer `CapacityRankProof` supersedes the old one.
3. `CapacityRankExplanation` is append-only by supersession. If the rank-plan version, frontier boundary, dominance relation, trust tier, uncertainty model, or candidate universe changes, the platform must mint a new proof and explanation set instead of mutating rendered reason text in place.
4. Patient surfaces may render only `patientReasonCueRefs[]` or policy-rendered plain-language templates from the current proof. Raw `softScore`, `baseUtility`, `robustFit`, exact feature weights, or exact uncertainty radius are not patient-safe disclosure.
5. Staff and support surfaces may render structured feature contributions, trust, dominance, tie-break, and uncertainty only within the current `VisibilityProjectionPolicy` and `CapacityRankDisclosurePolicy`; screenshots, queue order, or browser-local resort are not authoritative replay evidence.
6. Operations, assurance, and audit may inspect the full explanation tuple, but they must still read the persisted proof rather than recomputing browser-side scores from raw slot payloads or stale cached candidate rows.

#### 10.3 Reservation authority control

All patient-facing and staff-facing offer creation must go through `ReservationAuthority`.

No other service may create a user-visible exclusivity claim independently.

Define reservation truth for reservation `r` on key `k` at time `t` as:

`ReservationTruth(r,t) = 1[r.revalidatedAt <= t <= r.expiresAt] * 1[t - r.supplierObservedAt <= Delta_supplier(k)] * 1[r.truthBasisHash matches the current capacity identity and governing policy bundle]`

Enforce these invariants for every `canonicalReservationKey = k`:

* `ExclusiveCount(k,t) = sum_r 1[key(r)=k and state(r) in {held, pending_confirmation, confirmed} and commitMode(r)=exclusive_hold] <= 1`
* `TruthfulOfferCount(k,t) = sum_r 1[key(r)=k and state(r)=soft_selected and commitMode(r)=truthful_nonexclusive and expiresAt(r) > t] <= L_k`
* `reservationVersion` must advance monotonically on every state-changing write for `k`, and any stale `activeFencingToken` must be rejected
* terminal transitions must be monotone-safe: once a reservation for `k` reaches `released | expired | disputed | confirmed`, any later visible claim must come from a newer reservation version or a superseding reservation, never by silently reviving the old visible claim in place

If `ReservationTruth(r,t) = 0`, the platform may preserve provenance, but it may not expose writable exclusivity or calm final-booked reassurance from that reservation.

Every patient-facing or staff-facing claim that uses reservation language, hold timers, slot assurance, or waitlist-offer urgency must resolve through one current `ReservationTruthProjection` bound to the same `CapacityReservation`, `canonicalReservationKey`, selected anchor, and route or offer context. `OfferSession.expiresAt`, `WaitlistOffer.offerExpiryAt`, selection TTL, local countdowns, or optimistic client state are descriptive only unless the current `ReservationTruthProjection` also authorizes the same visible claim.

#### 10.4 Reservation state machine

`none -> soft_selected -> held -> pending_confirmation -> confirmed`

Alternative exits:

* `soft_selected -> released`
* `held -> released`
* `pending_confirmation -> released`
* `pending_confirmation -> disputed`
* any temporary state -> `expired`

`released`, `expired`, and superseded reservations remain auditable history only. They may keep the last selected anchor or explanatory copy visible as provenance, but they may not resume active exclusivity or active countdown behavior without a newer reservation truth projection.

#### 10.5 Exclusivity rules

1. Patient-facing exclusivity language is allowed only when:

   * `CapacityReservation.state = held`
   * `CapacityReservation.commitMode = exclusive_hold`
   * `CapacityIdentity.normalizationConfidence = strong`
   * the current `ReservationTruthProjection.displayExclusivityState = exclusive`
2. If supplier provides no real hold:

   * use `soft_selected` or `truthful_nonexclusive`
   * do not show fake hold countdown
   * do not imply exclusivity
   * acceptance must revalidate live state immediately
3. A selected slot may stay visually pinned while the route moves through `soft_selected`, `truthful_nonexclusive`, `pending_confirmation`, `released`, `expired`, or `revalidation_required`, but the label, countdown, and dominant action must morph from the current `ReservationTruthProjection` rather than from selection persistence alone.

#### 10.6 Waitlist throughput rule when no true hold exists

1. The default must remain truthful.
2. When true hold does not exist, policy may choose one of:

   * single active truthful offer per `canonicalReservationKey`
   * short-window cascading truthful offers
   * carefully bounded multi-offer strategy with explicit nonexclusive wording
3. Any nonexclusive multi-offer policy must:

   * never imply exclusivity
   * declare the offer as subject to live confirmation
   * preserve per-key serialization of actual commit attempts
   * emit `ReservationTruthProjection(truthState = truthful_nonexclusive, displayExclusivityState = nonexclusive, countdownMode = none)` for every visible offer in the batch
4. For any bounded multi-offer policy, choose the smallest concurrency cap `L_k` satisfying

   `1 - prod_{j=1}^{L_k} (1 - p_accept(j,k)) >= eta_fill(k)`

   with `1 <= L_k <= L_policy(k)`. If no audited acceptance model exists for key `k`, set `L_k = 1`.
5. Supply-efficiency optimizations may not fabricate a hold.

#### 10.6A Waitlist deadline and fallback obligation

Local waitlist throughput is safe only while the platform can still tell the truth about the next safe continuation. Deadline pressure, offer expiry, and no-slot fallback may not be computed independently in different routes.

Create and refresh:

- `WaitlistDeadlineEvaluation`
- `WaitlistFallbackObligation`
- `WaitlistContinuationTruthProjection`

Where:

- `WaitlistDeadlineEvaluation` serializes the current waitlist-safe window, derived laxity, offerability state, and the exact reason local waitlist may still continue or must stop
- `WaitlistFallbackObligation` is the authoritative debt to create and durably link callback, hub handoff, or explicit booking-failure continuation once local waitlist is no longer safe
- `WaitlistContinuationTruthProjection` is the sole visible truth for patient, staff, booking-manage, request-detail, and hub-entry waitlist posture

For waitlist entry `w` at time `t`, define:

- `expectedService_w = max(s_wait_min, expectedOfferServiceMinutes_w)`
- `safeWaitlistUntil_w = deadlineAt_w - expectedService_w`

Rules:

1. Join, reevaluation, offer creation, offer open, offer acceptance, offer expiry, offer supersession, commit failure, eligibility-window drift, stale capacity truth, and any policy or clinical deadline change must mint a new `WaitlistDeadlineEvaluation` and refresh the linked `WaitlistFallbackObligation` plus `WaitlistContinuationTruthProjection`.
2. Local waitlist posture is legal only while `t < safeWaitlistUntil_w`, the current eligibility window remains valid, and the current evaluation still says `offerabilityState = waitlist_safe | at_risk`.
3. If `t >= safeWaitlistUntil_w`, no eligible supply remains, the active offer chain is exhausted, or stale capacity truth means another local offer would no longer be truthful or useful, the platform must set `WaitlistDeadlineEvaluation.offerabilityState = fallback_required | overdue`, open or refresh `WaitlistFallbackObligation`, and rotate `WaitlistContinuationTruthProjection` so the dominant next step becomes callback, hub handoff, or explicit booking failure.
4. Waitlist-offer acceptance does not clear the current `WaitlistFallbackObligation`. The obligation remains armed until the same offer yields authoritative booking truth or the fallback is durably transferred and published.
5. Offer expiry, supersession, stale TTL, or truthful-nonexclusive race loss may preserve provenance, but they may not reset `safeWaitlistUntil_w`, clear the current `WaitlistFallbackObligation`, or leave calm `waiting_for_offer` posture live.
6. Patient, staff, booking-manage, request-detail, and hub-entry waitlist language must derive timing, risk, and next-step guidance only from the current `WaitlistContinuationTruthProjection`; `deadlineAt`, `offerExpiryAt`, `expectedOfferServiceMinutes`, and local countdowns are descriptive only.

#### 10.6B Booking provider adapter binding

1. Before slot search, revalidation, commit, cancellation, reschedule, reminder change, detail update, assisted booking, or hub-native booking begins, resolve the current `ProviderCapabilityMatrix` row for the exact tenant, practice, supplier, integration mode, deployment type, audience, and requested `actionScope`.
2. Compile or look up one current `BookingProviderAdapterBinding` that names the only legal `AdapterContractProfile`, degradation profile, search-normalization contract, temporal-normalization contract, revalidation contract, reservation semantics, commit contract, authoritative-read contract, and manage-support contract for that context.
3. `SlotSearchSession`, `ProviderSearchSlice`, `SlotSetSnapshot`, `OfferSession`, `BookingTransaction`, `AppointmentManageCommand`, `HubCommitAttempt`, and staff-assisted booking sessions must all carry the same `bookingProviderAdapterBindingRef` and `bindingHash` for one mutation or continuation chain. Mixed binding assembly is forbidden.
4. Adapters may translate supplier query syntax, pagination, callback correlation, and payload shape into canonical slot, reservation, appointment, and receipt evidence only. They may not rank candidates, enforce patient-policy filtering beyond binding-declared hard supplier impossibility, author waitlist fallback choice, or emit patient-surface meaning.
5. If the binding says an action is unsupported, requires GP linkage, requires a local consumer, or is in `recovery_only | blocked`, the shell may preserve the selected anchor and strongest safe summary, but it must fail closed into the declared fallback or recovery route. Selecting a second adapter or silently widening from patient self-service to a different supplier mode is forbidden.
6. Confirmation, read-after-write proof, manual evidence, and callback replay may advance only through the binding's declared commit and authoritative-read contracts. Supplier-local status strings or legacy vendor heuristics are descriptive only until normalized under the binding.

#### 10.7 Booking commit algorithm

1. run preflight revalidation against live supplier state and the full original policy envelope through the current `BookingProviderAdapterBinding.revalidationContractRef` without holding exclusive lock longer than needed
2. acquire `ReservationAuthority` lock for `canonicalReservationKey` and mint a `fencingToken`
3. re-check supplier freshness and reservation version under that `fencingToken`
4. if supported by `BookingProviderAdapterBinding.reservationSemantics`, convert to `held`
5. submit booking command through the current `BookingProviderAdapterBinding.commitContractRef` with idempotency key and `fencingToken`
6. if success is authoritative for the current `canonicalReservationKey` under `BookingProviderAdapterBinding.authoritativeReadContractRef`, either by durable provider reference or same-commit read-after-write proof:

   * create appointment record
   * set reservation `confirmed`
   * release competing soft selections
   * move request toward `outcome_recorded`
7. if response is async or ambiguous under the same binding:

   * set reservation `pending_confirmation` or `disputed`
   * create `ExternalConfirmationGate`
   * block request closure
   * do not emit final booked assurance text
8. if failure:

   * release reservation
   * return to offers, waitlist, fallback, or failure state according to policy

Every patient-facing, staff-facing, support, request-detail, appointment-manage, reminder, export, print, or handoff surface that communicates booking outcome must resolve through one current `BookingConfirmationTruthProjection` bound to the same `BookingCase`, `BookingTransaction`, selected anchor, and active `ExternalConfirmationGate` when present. `AppointmentRecord` presence, provider-reference echoes, reminder-plan existence, detached artifact bytes, or local success toasts are descriptive only until the current projection permits confirmed posture.

`ReservationAuthority` lock scope must stay short and fenced. It must not be held across avoidable retries, notification fan-out, or projection work.

#### 10.8 Hub booking and manual degraded mode

Hub-originated or hub-assisted bookings must use the same `ReservationAuthority` or a bridge that serializes on the same `canonicalReservationKey`.

If hub booking uses a manual or weakly assured path:

* set `commitMode = degraded_manual_pending`
* create `ExternalConfirmationGate(assuranceLevel = weak or manual)`
* record structured proof
* do not create final booked assurance text
* do not close until independent authoritative confirmation arrives or a governed exception policy executes

### 11. Pharmacy choice, dispatch, consent, and outcome reconciliation algorithm

#### 11.1 Provider-choice rule with timing guardrails

Patient choice remains real, but pathway-sensitive timing guardrails are mandatory.

Create and refresh one canonical choice tuple:

- `PharmacyDirectorySourceSnapshot`
- `PharmacyProviderCapabilitySnapshot`
- `PharmacyChoiceProof`
- `PharmacyChoiceExplanation`
- `PharmacyChoiceDisclosurePolicy`
- `PharmacyChoiceOverrideAcknowledgement`

**PharmacyDirectorySourceSnapshot**
`directorySourceSnapshotId`, `directorySnapshotRef`, `discoveryMode`, `adapterContractRef`, `adapterVersionRef`, `sourceQueryHash`, `sourcePayloadHash`, `providerRecordRefs[]`, `capturedAt`

**PharmacyProviderCapabilitySnapshot**
`providerCapabilitySnapshotId`, `directorySnapshotRef`, `providerRef`, `supportedTransportModes[]`, `manualFallbackState = not_needed | allowed | required | unavailable`, `capabilityEvidenceRefs[]`, `capabilityState = direct_supported | manual_supported | unsupported`, `capabilityTupleHash`, `capturedAt`

**PharmacyChoiceProof**
`pharmacyChoiceProofId`, `pharmacyCaseRef`, `directorySnapshotRef`, `providerCapabilitySnapshotRefs[]`, `compiledPolicyBundleRef`, `pathwayTimingGuardrailRef`, `candidateUniverseHash`, `orderedProviderRefs[]`, `recommendedProviderRefs[]`, `warningVisibleProviderRefs[]`, `suppressedUnsafeProviderRefs[]`, `invalidHiddenProviderRefs[]`, `explanationRefs[]`, `disclosurePolicyRefs[]`, `directoryTupleHash`, `rankingTupleHash`, `generatedAt`, `supersededAt`

**PharmacyChoiceExplanation**
`pharmacyChoiceExplanationId`, `pharmacyChoiceProofRef`, `providerRef`, `rankOrdinal`, `serviceFitClass`, `timingBand`, `recommendationScore`, `visibilityDisposition = recommended_visible | visible_with_warning | suppressed_unsafe | invalid_hidden`, `reasonCodeRefs[]`, `patientReasonCueRefs[]`, `staffExplanationRefs[]`, `supportExplanationRefs[]`, `warningCopyRef`, `suppressionReasonCodeRef`, `overrideRequirementState = none | warned_choice_ack_required | policy_override_required`, `disclosureTupleHash`, `generatedAt`

**PharmacyChoiceDisclosurePolicy**
`pharmacyChoiceDisclosurePolicyId`, `surfaceFamily = patient_pharmacy | patient_request_detail | staff_pharmacy | support_replay | assurance_audit`, `audienceTier`, `allowedReasonCodeRefs[]`, `numericExposureMode = hidden | bucketed | diagnostic`, `warningDisclosureMode = plain_language | detailed | diagnostic`, `suppressionDisclosureMode = summary_only | provider_specific | diagnostic`, `recommendationDisclosureMode = advisory_only | advisory_plus_reason | diagnostic`, `policyState = active | superseded`, `publishedAt`

**PharmacyChoiceOverrideAcknowledgement**
`choiceOverrideAcknowledgementId`, `pharmacyCaseRef`, `choiceSessionRef`, `pharmacyChoiceProofRef`, `pharmacyChoiceExplanationRef`, `selectedProviderRef`, `overrideRequirementState`, `acknowledgedByActorType = patient | staff_proxy | staff`, `acknowledgementTextRef`, `selectionBindingHash`, `capturedAt`, `supersededAt`

1. the full valid provider set may remain visible unless pathway policy explicitly restricts it
2. when time-to-service materially affects safety or expected benefit, compute for each valid provider `p`:

   * `dispatchCapabilityState_p in {direct_supported, manual_supported}` from the current `PharmacyProviderCapabilitySnapshot`; unsupported providers must already have been removed from the valid set
   * `t_ready(p) = max(now, nextSafeContactWindow_p)`
   * `delay_p = max(0, minutesBetween(now, t_ready(p)))`
   * `timingBand_p = 2` when `delay_p <= maxRecommendedDelayMinutes`, `1` when `maxRecommendedDelayMinutes < delay_p <= maxAllowedDelayMinutes` and policy still allows warned choice, and `0` otherwise
   * `h_timing(p) = exp(-max(0, delay_p - maxRecommendedDelayMinutes) / tau_delay)`
   * `h_access(p), h_travel(p), h_fresh(p) in [0,1]`
   * `providerScore(p) = product_k max(epsilon, h_k(p))^{lambda_k}` over the active non-safety ranking features, with `sum lambda_k = 1`
3. sort valid providers lexicographically by `timingBand_p` descending, `serviceFitClass_p` descending, `providerScore(p)` descending, then stable tie-breakers such as provider name or ID
4. derive `recommendedProviderRefs` from the same visible ordered proof, not from a hidden top-`K` slice. Let `b_star = max_p timingBand_p` over visible providers, `s_star = max_p serviceFitClass_p` within `b_star`, and `r_star = max_p providerScore(p)` within `(b_star, s_star)`. Then `recommendedProviderRefs = {p : visibilityDisposition_p = recommended_visible, timingBand_p = b_star, serviceFitClass_p = s_star, providerScore(p) >= r_star - delta_recommend_frontier}`. If more than one provider satisfies the frontier, highlight them all.
5. the UI must not treat all valid choices as equally time-safe when they are not

Timing band is a hard lexical guard. Convenience, travel, and familiarity may optimize only within the same timing band unless policy explicitly permits otherwise.

6. `open now`, published consultation-mode hints, capability-summary posture, travel, accessibility, and directory freshness may influence `recommendationScore` and explanation, but they may not hide a valid provider unless the provider is organisationally invalid, has no viable dispatch capability under the current `PharmacyProviderCapabilitySnapshot`, or is suppressed unsafe by the active `PathwayTimingGuardrail`
7. patient surfaces may render only `patientReasonCueRefs[]` or policy-rendered warning and suppression text from the current explanation set. Staff, support, and assurance surfaces may disclose more only through the current `PharmacyChoiceDisclosurePolicy`. Browser-local resort, local recommendation chips, or detached convenience labels are not authoritative ranking truth.
8. `patientOverrideRequired = true` only when the currently selected provider's `PharmacyChoiceExplanation.overrideRequirementState != none`. Selecting a warned or policy-overridden provider must append one current `PharmacyChoiceOverrideAcknowledgement`; consent, dispatch, recovery, and replay must all bind the same `selectionBindingHash`.
9. any change in candidate universe, directory freshness, provider capability, timing guardrail, route-intent tuple, or policy bundle must mint a new `PharmacyChoiceProof` and explanation set. Older proofs remain auditable history only.

Discovery may classify provider capability as `direct_supported`, `manual_supported`, or `unsupported`, but it may not resolve the transport mode, `TransportAssuranceProfile`, `DispatchAdapterBinding`, or outbound payload. Those transport-bound decisions begin only after `PharmacyReferralPackage` is frozen.

#### 11.2 Dispatch-proof and degraded transport rule

Consent control precedes dispatch proof. Every pharmacy lineage must materialize one current `PharmacyConsentCheckpoint` from the latest `PharmacyConsentRecord`, selected provider, pathway, referral scope, current or prospective package fingerprint, and same-shell continuity posture. `PharmacyConsentCheckpoint` is the single authority for dispatch, redispatch, and calm patient or staff reassurance. Its checkpoint state must distinguish at least `satisfied`, renewal-required, withdrawn, post-dispatch revoked, and withdrawal-reconciliation posture; provider change, pathway change, referral-scope drift, package-fingerprint drift, supersession, expiry, or withdrawal must immediately invalidate any older checkpoint and any frozen package that depended on it.

If consent is revoked after dispatch, create `PharmacyConsentRevocationRecord` and keep the active checkpoint in a non-satisfied revocation posture until downstream withdrawal settles or policy records that withdrawal is impossible after handoff. Package presence, prior dispatch proof, or stale patient return state may not stand in for current checkpoint truth.

Transport control follows package freeze, not discovery ranking. Every outbound referral must therefore resolve one exact `PharmacyDispatchPlan` over the frozen package, selected provider, current `PharmacyProviderCapabilitySnapshot`, chosen `TransportAssuranceProfile`, chosen `DispatchAdapterBinding`, transform contract, and outbound payload hash before a send can begin. Discovery-source details and transport-plan details may inform each other only through that explicit handoff; they may not be re-inferred later from provider rows, adapter defaults, or retry code.

Before any outbound dispatch:

* create `PharmacyCorrelationRecord`
* create or update `ExternalConfirmationGate`
* persist all outbound references
* record provider, patient, service type, directory tuple, and transport-plan tuple

Transport modes must be classified by assurance:

* strong: structured, trusted, machine-correlatable paths
* moderate: structured but async or partially trusted
* weak: shared mailbox, email-like, or loosely correlated paths
* manual: operator-assisted or manual dispatch

For dispatch attempt `a`, let `E_a^+` be correlated positive proof events and `E_a^-` correlated contradictory or disputed events. Compute:

* `pi_j(a) = sourceTrust_j * correlationConfidence_j * freshnessFactor_j` for each `j in E_a^+`
* `proofConfidence(a) = 1 - product_{j in E_a^+}(1 - pi_j(a))`
* `rho_k(a) in [0,1]` for each contradictory event `k in E_a^-`
* `contradictionScore(a) = 1 - product_{k in E_a^-}(1 - rho_k(a))`
* `dispatchConfidence(a) = proofConfidence(a) * (1 - contradictionScore(a))^{lambda_dispatch_contra}`

The active `TransportAssuranceProfile` must supply class-specific dispatch thresholds and contradiction ceilings for the selected assurance class.

Transport acceptance, provider acceptance, delivery evidence, and authoritative dispatch proof are distinct evidence lanes. Transport or provider acceptance may explain why a case remains pending, but they may not satisfy dispatch truth unless the active `TransportAssuranceProfile` explicitly permits that class and the linked `ExternalConfirmationGate` is satisfied. Every accepted proof mutation must still bind to the same `packageHash`, `providerRef`, `transportMode`, `dispatchPlanHash`, `dispatchAdapterBindingRef`, and `outboundReferenceSetHash`; if any of those drift, the old attempt becomes auditable history only and a fresh attempt must own later proof.

Shared mailbox and manual dispatch are degraded modes. They require:

* shorter confirmation timers
* exception-first monitoring
* explicit independent confirmation deadlines
* no final patient reassurance until the gate is satisfied

#### 11.3 Dispatch algorithm

1. confirm that a provider has been selected
2. evaluate the current `PharmacyConsentCheckpoint` for that provider, active `PharmacyChoiceProof`, selected `PharmacyChoiceExplanation`, any current `PharmacyChoiceOverrideAcknowledgement`, pathway, referral scope, current or prospective package fingerprint, and continuity posture; if the checkpoint is not satisfied, set `consent_pending`, route to same-shell renewal or recovery, and stop
3. create the canonical package and `PharmacyCorrelationRecord`, binding them to that checkpoint and to the active discovery tuple; the package is transport-neutral and may not carry adapter-specific payload assumptions
4. resolve one current `PharmacyDispatchPlan` from the frozen package, selected provider, current `PharmacyProviderCapabilitySnapshot`, chosen `TransportAssuranceProfile`, and chosen `DispatchAdapterBinding`
5. create dispatch attempt with idempotency key, bound `PharmacyDispatchPlan`, proof ledger, and move the case to `dispatch_pending`
6. immediately before adapter send commits, recheck that the same checkpoint remains satisfied, that `selectionBindingHash` still matches the current provider, choice proof, explanation, override acknowledgement, pathway, scope, and package lineage, and that the bound dispatch plan still matches the same provider-capability snapshot, transport assurance profile, adapter binding, and payload hash; if consent has expired, been withdrawn, been superseded, or drifted on provider, pathway, scope, choice proof, package lineage, or transport-plan tuple, invalidate the package or plan, settle stale-choice-or-consent, and do not send
7. transform and send the package only through the chosen `PharmacyDispatchPlan`
8. record provider-facing references on `PharmacyCorrelationRecord`
9. update `DispatchProofEnvelope` whenever transport receipts, durable-send proof, manual attestation, or disputed provider responses arrive, and recompute `dispatchConfidence(a)` on every proof mutation
   * persist transport acceptance, provider acceptance, delivery evidence, and authoritative proof on distinct evidence lanes tied to the same `PharmacyCorrelationRecord`; queue, patient, and staff copy may widen from these lanes, but only authoritative proof may promote calm `referred` posture
   * reject or quarantine any proof mutation whose `packageHash`, `providerRef`, `transportMode`, `dispatchPlanHash`, `dispatchAdapterBindingRef`, or `outboundReferenceSetHash` no longer matches the current attempt; stale or cross-attempt evidence remains auditable only
   * if a retry would change provider capability snapshot, transport mode, adapter binding, transform contract, dispatch payload hash, or outbound reference set, supersede the old `PharmacyDispatchPlan` and attempt instead of mutating the old proof chain in place
10. move the case to live referral only when:

   * `dispatchConfidence(a) >= active TransportAssuranceProfile.dispatchConfidenceThreshold`
   * `contradictionScore(a) <= active TransportAssuranceProfile.contradictionThreshold`
   * the relevant `ExternalConfirmationGate` is satisfied enough for the transport class
   * the proof is correlated to the current attempt rather than a duplicate or stale send
   * current consent checkpoint, provider, and package fingerprints still match the lineage
11. if proof is absent, contradictory, duplicated, ambiguous, or the active consent checkpoint is no longer satisfied by the proof deadline:

   * remain in `dispatch_pending` or transition the pharmacy case to its local review-pending state
   * create or keep the relevant `ExternalConfirmationGate` attached to the request lineage
   * persist a current `PharmacyDispatchSettlement(result = pending_ack | reconciliation_required)` plus visible watch or recovery posture; a missed proof deadline may not remain implicit in logs or timers alone
   * do not imply live referral completion

#### 11.4 Post-dispatch consent revocation

If consent is revoked after dispatch:

1. create `PharmacyConsentRevocationRecord` and move the active checkpoint to post-dispatch-revoked posture
2. suspend redispatch, replacement dispatch, and calm referred or resolved copy while revocation is unsettled
3. attempt downstream cancellation or revocation according to transport mode and provider capability
4. capture whether revocation was acknowledged, attempted but not confirmed, disputed, or impossible after handoff
5. update patient and staff projections honestly about what was and was not withdrawn, and keep the same-shell withdrawal-reconciliation route visible
6. keep the case open or reconciliable until the downstream state is known enough for policy

#### 11.5 Outcome matching and weak-source restrictions

Outcome matching order:

1. exact correlation-chain match
2. otherwise, only keep candidate lineages `c` that satisfy hard floors for inbound outcome `e`:

   * `m_patient(c,e) >= tau_patient_floor`
   * `m_service(c,e) >= tau_service_floor`
   * if outbound dispatch exists, `max(m_provider(c,e), m_transport(c,e)) >= tau_route_floor`
3. for each remaining eligible candidate lineage `c`, compute:

   * `m_patient(c,e) in [0,1]` from verified patient identity agreement
   * `m_provider(c,e) in [0,1]` from provider or organisation agreement
   * `m_service(c,e) in [0,1]` from service-type agreement
   * `m_time(c,e) = exp(-abs(minutesBetween(observedAt_e, expectedWindowMidpoint_c)) / tau_match_time)`
   * `m_transport(c,e) in [0,1]` from dispatch, acknowledgement, or transport evidence
   * `m_contra(c,e) in [0,1]` from conflicting patient, provider, service, or timing evidence
   * `sourceFloor_e in [0,1]` from the trusted-source policy class of the inbound evidence
   * `rawMatch(c,e) = product_k max(epsilon, m_k(c,e))^{omega_k}`, with `sum omega_k = 1`
   * `matchScore(c,e) = sourceFloor_e * rawMatch(c,e) * (1 - m_contra(c,e))^{lambda_match_contra}`
4. if no eligible candidate lineage exists, create `PharmacyOutcomeReconciliationGate(blockingClosureState = blocks_close)` or equivalent unmatched-review work and do not advance outcome or closure truth
5. let `c_star = argmax_c matchScore(c,e)` and let `c_2` be the runner-up candidate lineage, or a null candidate with `matchScore(c_2,e) = 0`
6. compute `posterior(c | e) = exp(kappa_match * matchScore(c,e)) / sum_{c'} exp(kappa_match * matchScore(c',e))`
7. auto-apply a terminal outcome only when all of the following hold:

   * `matchScore(c_star,e) >= tau_strong_match`
   * `posterior(c_star | e) >= tau_posterior_strong`
   * `matchScore(c_star,e) - matchScore(c_2,e) >= delta_match`
   * `m_contra(c_star,e) <= tau_contra_apply`
8. otherwise create or refresh `PharmacyOutcomeReconciliationGate(blockingClosureState = blocks_close)`, route to reconciliation, and keep patient, practice, and request-level calmness in review or placeholder posture

The hard floors, strong-match weights, and thresholds must come from a versioned reconciliation policy pack; they are not local adapter constants.

`PharmacyOutcomeReconciliationGate` is the dedicated weak-match review seam for pharmacy outcomes. It is case-local, blocks closure while open, and is the only authority allowed to convert ambiguous, contradictory, or low-confidence outcome evidence into `resolved_by_pharmacy`, `reopened_for_safety`, or `unmatched`.

If the winning score, posterior confidence, or separation is below configured strong threshold:

* do not auto-apply terminal outcome
* create or refresh `PharmacyOutcomeReconciliationGate(blockingClosureState = blocks_close)`
* keep patient and practice outcome calmness in bounded review or placeholder posture

Evidence from:

* email ingest
* shared mailbox ingest
* manual structured capture
* free-text operator entry

may only auto-update the case up to its local review-pending state unless:

* trusted correlation chain exists
* policy-defined transport validation passes
* a governed human resolves the current `PharmacyOutcomeReconciliationGate` for apply

When a human confirms a weak-source correlation:

* the actor who confirms correlation must not be the sole actor who performs terminal closure
* a second control or later coordinator evaluation must still exist
* that confirmation must resolve the current `PharmacyOutcomeReconciliationGate`; no silent threshold re-check may bypass the gate after human review begins

#### 11.6 Auto-close restrictions

Auto-close is allowed only if:

* source is trusted for its transport class
* `matchScore(c_star,e)`, `posterior(c_star | e)`, and separation all meet strong thresholds
* `m_contra(c_star,e) <= tau_contra_apply`
* no active `PharmacyOutcomeReconciliationGate(blockingClosureState = blocks_close)` remains unresolved
* no urgent or failed-completion signal exists
* no pending safety preemption exists
* no `ExternalConfirmationGate` remains unresolved

The following must always drive `reopenSignal >= tau_reopen` and force safety preemption plus reopen logic:

* urgent GP action
* unable to complete
* unable to contact
* bounce-back with clinically meaningful content
* consent revocation or dispatch contradiction that changes current safety posture

If `loopRisk(e,l) >= tau_loop`, escalate to supervisor review and block automatic redispatch or automatic close until the new evidence is governed.

Absence of message, absence of update record, or timer expiry is never proof of completion.

### 12. Audience-tier projection, communication semantics, and UI-state safety algorithm

#### 12.1 Mandatory audience tiers

At minimum:

* `patient_public`
* `patient_authenticated`
* `origin_practice`
* `hub_desk`
* `servicing_site`
* `support`

Every published patient, staff, support, hub, servicing-site, governance, operations, audit, embedded, preview, receipt, communication, and artifact surface must bind one `AudienceVisibilityCoverage` row for the active tier and purpose of use.

That row is incomplete unless the active `MinimumNecessaryContract`, required section and preview contracts, and required artifact contracts all resolve for the published surface.

Minimum coverage expectations:

* `patient_public`: route families are limited to public status, secure-link entry before proof, and governed recovery; projection families are summary or placeholder only; timelines show neutral status and delivery or repair awareness without PHI-bearing body preview; mutation authority is limited to claim, re-auth, or recovery initiation under a minimal grant
* `patient_authenticated`: route families may include request, booking, callback, messaging, records, pharmacy, and document shells only after current session, binding, and release checks pass; projection families must be distinct from public shapes when richer truth exists; communications, receipts, and artifacts may render governed previews or inline detail only through the active `VisibilityProjectionPolicy` and `ArtifactPresentationContract`
* `origin_practice`: practice-owned route families may expose practice-operational and clinically necessary detail for the current organisation, but they may not inherit hub, support, or cross-organisation payloads by trimming after assembly; practice visibility debt, acknowledgements, and outbound receipts require practice-specific projection families and placeholders when confirmation is pending
* `hub_desk`: coordination route families may reveal scheduling, routing, travel or access constraints, safe-summary clinical context, practice-ack debt, and coordination history, but not full narrative, full attachment bodies, or unrelated conversation detail; hub timelines, offer previews, and receipts require dedicated coordination projections rather than support-safe or clinician-full payloads
* `servicing_site`: encounter-delivery route families may reveal only the detail needed to deliver, confirm, or recover the booked service for that site; local operational detail may be richer than hub detail but may not widen into support investigation history, unrelated downstream branches, or cross-tenant context
* `support`: support route families default to masked summary, chronology, and consequence-preview projections; subject history, replay, secure-link reissue, identity correction, and break-glass-supported detail must each resolve distinct purpose-of-use coverage rows with an explicit disclosure ceiling, mask scope, and recovery posture
* governance, operations, assurance, and break-glass review surfaces are not exempt; when they render cross-organisation or PHI-adjacent detail, they must publish purpose-of-use-specific coverage rows rather than consuming ordinary staff or support payloads in a richer shell

#### 12.2 Field-level projection materialization rule

Projection generation must enforce `VisibilityProjectionPolicy`, `MinimumNecessaryContract`, and any bound section, preview, or artifact contracts before data is materialized.

Collapsed UI sections do not satisfy minimum-necessary access.

At minimum:

* `hub_desk` may receive only the minimum data needed to coordinate safely, such as operational routing state, timing needs, modality needs, travel or access constraints, safe clinical-routing summary, and coordination history
* `hub_desk` must not receive full narrative, full attachments, or broader clinical content by default
* `servicing_site` may receive only what is required to deliver the booked encounter or manage that site’s capacity
* `support` must default to masked views and must require stronger policy for identity or access-affecting actions
* timelines, previews, receipts, communications, practice-visibility surfaces, and support replay surfaces each require explicit `AudienceVisibilityCoverage`; it is not enough to govern only the parent detail route
* sections, alerts, timeline rows, communication previews, and artifact modes each require their own bound contract; the parent detail-route policy is not sufficient on its own
* if a surface may show awareness but not detail, it must render governed placeholder or summary tokens from the bound section or preview contract instead of silent omission or full-body preview
* any break-glass or acting-context upgrade must materialize a separate purpose-of-use projection family and corresponding audit evidence before deeper detail appears
* redaction rules must resolve through named policy refs that can evolve independently from route families; route-local masking branches are invalid

#### 12.3 Patient-visible state contract

Patient-visible state must include all of:

* one macro-state
* one `microStateDescriptor`
* one `awaitedPartyDescriptor`
* one `riskDescriptor` where timing, urgency, or provisionality materially matters
* one `provisionalStateFlag` whenever final external confirmation is not yet present

Macro-state compression is allowed only if these secondary descriptors remain visible where needed.

#### 12.4 Action hierarchy rule

Patient and staff projections must emit `ProjectionActionSet`.

Rules:

1. one prioritized `primaryActionRef` may exist
2. any blocking secondary obligations must remain visible
3. pending dependencies must remain visible
4. the absence of a visible primary action must not imply there is nothing important outstanding

#### 12.4A Patient navigation digest and return rule

Patient home, inbox, spotlight, and section-entry surfaces must materialize one `PatientNavUrgencyDigest` and one `PatientNavReturnContract` for the current audience and subject.

Rules:

1. patient CTA enablement must derive from the current `PatientSpotlightDecisionProjection`, `PatientNavUrgencyDigest.governingSettlementRef`, `settlementState`, the active `PatientShellConsistencyProjection`, and any bound release or channel freeze posture rather than from local card freshness alone
2. spotlight selection may change only through a higher-tier challenger, `PatientSpotlightDecisionUseWindow` expiry, or an explicit superseding trigger; same-tier freshness churn may refresh summary copy but may not rotate the owning entity
3. when settlement becomes pending, stale, blocked, recovery-bound, or inconsistent with the current shell-consistency projection, the existing card or row must hold the last safe summary and downgrade in place instead of disappearing or remaining falsely actionable
4. quiet-home is legal only when one current `PatientQuietHomeDecision` proves no candidate outranks the quiet threshold and no repair or recovery route must be promoted instead
5. when `channelType = embedded`, a live CTA also requires `PatientEmbeddedSessionProjection`; manifest drift, session drift, bridge-capability loss, or frozen channel posture must degrade through `RouteFreezeDisposition` rather than exposing stale embedded actionability
6. any child route entered from the digest must preserve `PatientNavReturnContract` so same-shell return, read-only return, or governed recovery is explicit when the initiating state drifts
7. `PatientNavReturnContract` must carry the active section, anchor, disclosure, filter, scroll, and last safe posture for the current shell family; browser back or refresh may replay that contract, but they may not replace it
8. if continuity evidence, shell consistency, governing settlement, or spotlight decision tuple drifts before the child route settles, the patient must recover back into the same shell with the prior anchor and bounded guidance rather than a generic home or list reset

#### 12.5 Unified timeline with typed subthreads

A unified request-level timeline may exist only as an ordered `ConversationThreadProjection` over `ConversationSubthreadProjection` rows and their current `CommunicationEnvelope` chain. Each communication branch must retain typed semantics, including at minimum:

* `information`
* `more_info_request`
* `callback`
* `reminder`
* `instruction`
* `transactional_offer`
* `patient_reply`
* `outcome_notice`

Each typed subthread must retain:

* reply target
* owner
* expiry or TTL if relevant
* whether replying is still valid
* which workflow branch it affects
* channel and governed payload contract

Rules:

1. callback cases, reminder chains, more-info cycles, clinician-message exchanges, instruction acknowledgements, and patient-reply contexts that can change patient actionability must each mint or reuse one current `ConversationSubthreadProjection`
2. `ConversationThreadProjection` may reorder or visually collapse quiet history, but it may not merge distinct subthreads whose owner, reply target, expiry, workflow-branch effect, or current envelope chain differs
3. same-shell recovery, step-up return, stale-link re-entry, and support repair must reopen the same `subthreadProjectionId` and `selectedAnchorRef` whenever the canonical branch is unchanged

A generic chat metaphor must not erase typed workflow semantics.

#### 12.5A Record-origin continuation rule

If a patient launches a live action from records, results, letters, or other longitudinal history:

1. issue `RecordActionContextToken` and one `RecordOriginContinuationEnvelope` before leaving the originating record surface
2. bind any step-up, release drift, artifact handoff, or recovery path to `RecoveryContinuationToken` through that envelope
3. preserve the originating record anchor, expanded group, release gate, visibility envelope, nearest safe return target, and continuity key until the action settles or is explicitly abandoned
4. if the context token, continuation envelope, or recovery token can no longer be revalidated, degrade to read-only or recovery-only return with the original record breadcrumb rather than a generic route reset

#### 12.5B Conversation receipt and settlement rule

Communication lists, thread previews, and reply surfaces must be governed by `ConversationThreadProjection`, `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement`.

Rules:

1. list rows, thread mastheads, callback cards, reminder notices, and composer affordances must read one current receipt-grammar tuple: `ConversationThreadProjection`, `ConversationSubthreadProjection`, `CommunicationEnvelope`, `PatientCommunicationVisibilityProjection`, `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, `ConversationCommandSettlement`, `PatientCallbackStatusProjection`, and `PatientExperienceContinuityEvidenceProjection(controlCode = conversation_settlement)`
2. unread, `replyNeededState`, `awaitingReviewState`, `repairRequiredState`, reminder reassurance, and quiet-success posture must derive from the preview digest, current subthread projection, and latest receipt envelope, not from transport receipt, scroll position, local composer state, or transient delivery callbacks alone
3. local acknowledgement may appear immediately, but unread clearance, reply readiness, `reviewed`, or `settled` posture may advance only when the current settlement, callback status, visibility posture, and continuity evidence all permit it
4. delayed-release, partial-visibility, or placeholder states must remain explicitly bound to `ConversationThreadProjection`, `ConversationSubthreadProjection`, `PatientReceiptEnvelope`, and `PatientCommunicationVisibilityProjection`; governed preview limits may not hide the cluster entirely
5. reminder send, delivery failure, callback fallback, and delivery repair must update the same `threadId` through `CommunicationEnvelope` and `ConversationSubthreadProjection`; appointment reminders may contribute a typed subthread, but they may not become a detached conversation silo
6. if preview, receipt, settlement, callback status, reminder plan, subthread tuple, or continuity evidence revisions drift, the shell must freeze mutating controls and fall to bounded pending or recovery posture instead of rendering contradictory calmness
7. verification must cover local-acknowledgement replay, delivery-only callbacks, reminder failure or callback fallback, partial-visibility placeholders, stale continuity evidence, and same-cluster recovery so a patient never loses the active anchor or draft while authoritative outcome remains unsettled

#### 12.5C Controlled resend and delivery-repair rule

Support-side resend, reissue, channel change, and attachment recovery for conversation work must be governed by the same authoritative communication chain.

Rules:

1. before any new external effect is armed, the support action must bind the current `MessageDispatchEnvelope`, current `MessageDeliveryEvidenceBundle`, latest `ThreadExpectationEnvelope`, and current `ThreadResolutionGate`
2. if the same repair scope already has a live `SupportMutationAttempt` or live dispatch fence without terminal evidence, duplicate operator submits, replay restore, or worker retries must return that same authoritative chain rather than creating a second send or repair side effect
3. `SupportActionSettlement`, patient receipt copy, and thread preview posture may acknowledge local or transport progress, but `sent`, `delivered`, `reviewed`, `settled`, or `repaired` truth requires the current evidence bundle or explicit authoritative fallback on that same chain

#### 12.6 Urgent and decision-blocking delta rule

The following deltas are non-bufferable:

* urgent safety escalation
* new evidence that invalidates the action currently being confirmed
* wrong-patient correction hold
* booking or dispatch dispute that invalidates the current assurance
* active dependency failure that changes who the system is waiting on

If such a delta arrives while a user is editing or confirming a safety-critical action:

* interrupt with a bounded, explicit alert
* preserve context
* block the affected commit until the delta is acknowledged or reconciled

#### 12.7 Causal read rule

Commands that change any of the following must return a causal token:

* ownership or claim
* booking confirmation or release
* pharmacy outcome
* closure
* patient-binding correction
* access freeze or identity hold
* transactional offer acceptance or expiry

Any `command_following` read must:

* wait until the projection consumes the causal token, or
* return a command-side confirmation view instead of a stale projection

### 13. Support governance, derived artifact control, and retention freezing

#### 13.1 Support governance

Support actions must be tiered:

* `support_view_only`
* `support_recovery_ops`
* `support_identity_access_admin`

Rules:

1. masked views must be default
2. just-in-time scope is required for any patient-specific recovery action
3. secure-link reissue, identity correction escalation, or access-affecting action must be reason-coded
4. identity-affecting or access-widening actions require dual control under policy
5. support must not directly mutate patient binding outside `IdentityRepairCase`
6. leaving replay or investigation mode for live support work must pass through `SupportReplayRestoreSettlement`; stale or partially revalidated replay sessions may explain or queue work, but they may not silently reopen live mutation or merge held drafts into live state until the restore settlement attests the current route-intent tuple, mask scope, replay checkpoint, and authoritative action chain
6A. every actionable support shell, replay proof, action lease, and restore settlement must bind one current `SupportLineageBinding`; ticket-local linked refs or copied summaries may not define current lineage truth
6B. support may investigate more than one related lineage object only through explicit `SupportLineageScopeMember` rows; subject-level coincidence, copied callback refs, or local thread lists are insufficient scope for live repair posture
6C. any support-visible transcript excerpt, derived artifact, resend note, recovery note, or resolution summary must cite one `SupportLineageArtifactBinding` before it can become durable timeline, replay, or handoff truth
7. support resend or delivery-repair tooling may not arm a second live external effect while the linked `SupportMutationAttempt` or `MessageDispatchEnvelope` remains `awaiting_external`; same-shell provisional or read-only recovery is mandatory until the authoritative chain settles
8. macro apply, playbook launch, fallback-channel suggestion launch, and `knowledge_gap` capture that can alter support actionability must be reason-coded, bound to one live `SupportKnowledgeAssistLease`, and when mutating must settle through `SupportActionRecord` plus `SupportActionSettlement` rather than as local rail state

#### 13.2 Derived artifact minimization

For audio, transcript, concept extraction, and similar derived artifacts:

* the source artifact remains authoritative
* derived artifacts must reference the source lineage
* every derived artifact must also reference the frozen `EvidenceCaptureBundle` or parent immutable derivative it came from; mutable latest-job pointers are forbidden
* any structured summary, document summary, result summary, or patient-visible artifact derivative must also cite one current parity tuple binding the exact source artifact ref and hash, derived summary artifact ref and hash, current masking scope, current visibility envelope, and any current release or step-up gate. If the source object is a patient record, result, document, letter, or attachment, the derivative must also materialize one `RecordArtifactParityWitness` over that tuple. If either the tuple or witness drifts, the derivative may remain visible only as provisional, source-only, or recovery-only context
* non-essential derived artifacts must have shorter retention and stricter access than or equal to source
* access policy for derivatives must never be weaker than for the source
* derivative persistence must be minimized to what is operationally required
* new transcript, extraction, or summary versions may supersede prior derivations, but they may not rewrite the package referenced by an existing `EvidenceSnapshot`

#### 13.3 Conservative retention freeze for high-risk episodes

If an episode is disputed, safety-significant, identity-repaired, security-relevant, or externally contested, apply this preservation algorithm:

The retention-freeze algorithm requires five corrections:

1. retention freeze now has first-class record and manifest contracts rather than a prose-only instruction
2. freeze activation now follows a deterministic trigger-and-scope algorithm instead of best-effort operator judgment
3. bundle capture now requires explicit completeness proof beyond ordinary dependency graphs
4. frozen bundles now carry sealed integrity, chain-of-custody, and minimum-necessary investigation access rules
5. freeze state now integrates cleanly with later retention, legal-hold, export, and release workflows without overloading request lifecycle state

Create these preservation objects:

**RetentionFreezeRecord**
`freezeId`, `scopeType = episode | request`, `scopeRef`, `freezeScopeHash`, `triggerClasses[]`, `openedByMode = automatic | operator | governance`, `openedAt`, `state = collecting | sealed | gap_detected | review_pending | released | superseded`, `bundleManifestRef`, `retentionLifecycleBindingRefs[]`, `legalHoldState = none | pending_review | active`, `currentLegalHoldRefs[]`, `minimumRetentionOverrideRef`, `dispositionBlockExplainerRef`, `supersedesFreezeRef`, `supersededByFreezeRef`, `reviewDueAt`, `releasedAt`, `releasedBy`, `releaseReason`

**FreezeBundleManifest**
`manifestId`, `freezeId`, `canonicalScopeRef`, `governingScopeHash`, `sourceArtifactRefs[]`, `derivedArtifactRefs[]`, `projectionRefs[]`, `decisionRefs[]`, `communicationRefs[]`, `externalReferenceRefs[]`, `policyBundleRefs[]`, `visibilityPolicyRefs[]`, `retentionLifecycleBindingRefs[]`, `retentionDecisionRefs[]`, `completenessState = collecting | sealed | gap_detected | superseded`, `missingArtifactRefs[]`, `missingReasonCodes[]`, `manifestHash`, `sealedAt`, `sealedBy`

Rules:

1. Retention freeze is a preservation control-plane fact, not a new `Request.workflowState` or `Episode.state`.
2. At most one active `RetentionFreezeRecord` may exist for the same `freezeScopeHash`; new qualifying triggers append to that record or create a governed superseding manifest rather than opening parallel ambiguous freezes.
3. Ordinary deletion, archive compaction, derivative cleanup, preview regeneration, and retention jobs must check active freeze state through the current `RetentionLifecycleBinding` set before mutating artifacts in scope; raw storage-prefix matching or batch-local scope inference is forbidden.
4. A freeze may coexist with ordinary clinical closure; it blocks deletion, lifecycle compaction, and investigation-bundle release changes unless the underlying trigger already produces a separate workflow blocker under the canonical lifecycle rules.

Use this trigger-and-scope algorithm:

1. open or reuse `RetentionFreezeRecord` immediately when any of the following occurs: identity repair, safety-significant incident or severe-harm review, security incident, external dispute of outcome or communication truth, or explicit governance or legal preservation request
2. default to `scopeType = episode`; allow `request` scope only when policy proves the contested path is isolated and sibling requests cannot materially explain the incident
3. attach the trigger class, opening reason, actor mode, one canonical `freezeScopeHash`, and current `CompiledPolicyBundle` reference before any ordinary retention or derivative-cleanup job proceeds
4. if the trigger is discovered after any relevant artifact has already been archived, expired, or compacted, set `state = gap_detected`, materialize the missing refs or reason codes, and create operator-visible recovery work rather than pretending the bundle is complete
5. repeated triggers while the freeze is active may widen scope or append evidence, but they may not silently narrow preserved scope or fork a second active preservation chain for the same contested lineage

Use this bundle-composition algorithm:

1. seed the manifest from authoritative categories, not only from the dependency graph:
   * source evidence and immutable snapshots
   * derived artifacts required to interpret source evidence
   * patient and staff communications
   * decisions, approvals, escalations, and reopen records
   * projections and summaries that were actually rendered to users or operators
   * external handoff, dispatch, booking, pharmacy, or callback references
   * current `RetentionLifecycleBinding`, `RetentionDecision`, and any active `LegalHoldRecord` refs for in-scope artifacts
   * governing `CompiledPolicyBundle` refs, visibility-policy refs, and route or view versions needed to explain what the user or operator saw
2. then walk dependency and lineage links recursively to collect additional required artifacts, but do not treat pre-modeled links as sufficient proof of completeness
3. seal `FreezeBundleManifest` only when all required categories are present or every gap is explicitly recorded with reason code and approved under policy
4. when new materially relevant evidence arrives after sealing, append it through a new superseding manifest; do not mutate the sealed manifest in place

Use these integrity, access, and compatibility rules:

1. sealing a manifest must compute `manifestHash`, preserve artifact ordering, and emit at least `retention.freeze.created`, `retention.freeze.sealed`, `retention.freeze.gap_detected`, and `retention.freeze.released`
2. frozen bundles must preserve chain-of-custody: every export, archive move, review access, or release decision references `freezeId`, `manifestId`, and `manifestHash`
3. access to frozen bundles must follow minimum necessary scope; routine support may see existence and reason state, but investigation-grade content requires the approved governance or incident-review path
4. while a freeze is active, retention policy must upgrade affected artifacts to preserve-or-archive behavior; Phase 9 later materializes that state into `RetentionDecision`, `LegalHoldRecord`, and `ArchiveManifest` without losing the original `freezeId`
5. any later `LegalHoldRecord`, `RetentionDecision`, `ArchiveManifest`, or `DeletionCertificate` for the frozen scope must retain `freezeId`, `freezeScopeHash`, and the governing `manifestHash`; later lifecycle automation may not sever the original preservation lineage
6. releasing a freeze requires documented reason, policy authority, and confirmation that no active legal hold, open incident review, unresolved assurance dependency, or current disposition-block assessment still requires preservation

### 14. Assurance, resilience, and configuration promotion algorithm

#### 14.1 Minimum pre-live control pack

Before any production or pilot traffic is allowed, all of the following must exist and be tested:

* restore-tested backups for canonical stores
* queue lag and lease lag observability
* producer and consumer health alarms
* public-link kill switch and revocation audit
* break-glass review workflow
* support action governance
* stale-lease scavenger and recovery procedure
* external confirmation gate monitoring
* incident response workflow
* degraded-mode runbooks for booking, hub, and pharmacy paths

These are go-live prerequisites, not later hardening.

#### 14.2 Assurance ingestion fail-closed isolation rule

If assurance ingestion sees unknown namespace, incompatible schema, or untrusted producer behavior:

* quarantine the affected producer or namespace
* materialize or refresh `AssuranceSliceTrustRecord` for the affected slice
* preserve ingestion for unaffected producers
* raise immediate operator alarms
* mark the affected assurance slice untrusted

Fail-closed must stop trust in the affected slice, not necessarily blind all assurance and monitoring.

#### 14.2A Assurance slice trust rule

Operational consumers must treat `AssuranceSliceTrustRecord` as authoritative and must gate automation on `trustLowerBound`, not optimistic point estimates:

* `trusted` slices may drive authoritative automation within their declared scope only when `hardBlockState = false`, `trustLowerBound >= 0.85`, and required replay or redaction parity checks pass; a slice may remain diagnostically labeled `trusted` under hysteresis while automation is still held below this operational floor
* `degraded` slices may remain visible for diagnostics, but they may not drive booking truth, dispatch truth, assistive writeback, or promotion approval
* `quarantined` slices may not drive user-visible assertions or operational ranking, and they require explicit governed recovery plus successful deterministic replay before reuse
* `unknown` slices remain observe-only until the current evaluation model has produced a governed trust result
* trust-state transitions must be monotone-safe: promotion to `trusted` requires two consecutive successful evaluations on the current model version, while any hard block or replay mismatch demotes immediately

#### 14.3 Modular bundle compilation

Before production promotion, compile one `CompiledPolicyBundle` composed of domain packs, including at minimum:

* routing pack
* SLA and ETA pack
* identity and access-grant pack
* duplicate and continuity pack
* visibility and audience pack
* waitlist and booking pack
* hub coordination pack
* callback and messaging pack
* pharmacy pack
* provider capability pack
* tenant override pack

Each pack must have an independent hash, compatibility contract, canary scope, and rollback path.

The hub coordination pack must itself compile one explicit subpack tuple:

* `HubRoutingPolicyPack`
* `HubVarianceWindowPolicy`
* `HubServiceObligationPolicy`
* `HubPracticeVisibilityPolicy`
* `HubCapacityIngestionPolicy`

Replay, governance review, capacity ranking, practice acknowledgement debt, and manage-exposure recovery must all cite the exact hub policy subpack refs plus one `policyTupleHash`; a naked hub-pack version is not sufficient.

#### 14.4 Mandatory bundle validation

Compilation must fail if the effective bundle would allow any of the following:

* PHI exposure through a public, superseded, or mismatched grant family, or through grant redemption that lacks a current `AccessGrantScopeEnvelope`, exact-once `AccessGrantRedemptionRecord`, and authoritative `AccessGrantSupersessionRecord`
* automatic patient binding below required assurance
* automatic attach from `same_episode_candidate`
* duplicate, replay, or same-episode decisions driven by uncalibrated scores, stale model versions, missing `DuplicatePairEvidence`, missing `DuplicateResolutionDecision`, or transitive candidate edges without canonical-centered validation and candidate-to-candidate competition margins
* closure with active lease, pending preemption, unresolved external confirmation, or unresolved identity repair
* exclusive slot language without true `held` reservation on a strong `CapacityIdentity`
* booking, waitlist, or equivalent offer surfaces that can render hold urgency, reserved language, or slot-assurance copy without one current `ReservationTruthProjection` bound to the live reservation version
* waitlist, request-detail, appointment-manage, or hub-entry surfaces that can present calm `waiting for an offer` posture, or suppress required callback or hub escalation, without one current `WaitlistDeadlineEvaluation`, `WaitlistFallbackObligation`, and `WaitlistContinuationTruthProjection`
* booking confirmation, request-detail booking, appointment-manage, reminder, or appointment-artifact surfaces that can render booked reassurance, writable manage posture, or export or handoff readiness without one current `BookingConfirmationTruthProjection` bound to the live booking transaction and any active `ExternalConfirmationGate`
* pharmacy or hub final assurance from degraded manual or weak evidence
* any hub candidate-offerability, alternative-offer visibility, or direct-commit frontier that depends on undeclared routing, variance-window, or capacity-ingestion policy instead of an explicit compiled hub policy tuple
* any Enhanced Access service-obligation, reminder, cancellation make-up, or minutes-per-1,000 rule that silently reorders patient or coordinator-visible candidates instead of producing a typed obligation evaluation and exception record
* any practice-acknowledgement debt, no-ack exception, or hub-manage exposure that cannot be replayed from the current `HubPracticeVisibilityPolicy`, current `NetworkCoordinationPolicyEvaluation`, and current `ackGeneration`
* booking, waitlist, alternative-offer, or appointment-manage actionability that is not derived from one current provider-capability row, one current `BookingProviderAdapterBinding`, one current `AdapterContractProfile`, the declared degradation profile, and the same live route and publication tuple
* any external-effect command path that can select an adapter other than the one published by the bound capability decision
* any booking search, revalidation, commit, or manage path that lets adapter-local ranking, fallback choice, or patient-surface meaning escape the published `BookingProviderAdapterBinding`
* any clinically meaningful inbound evidence path that bypasses safety preemption
* audience-tier projection containing fields outside the allow-list
* support tier capable of direct identity overwrite
* global assurance blackout caused by one bad producer
* writable embedded or channel-specific routes without a compatible `ReleaseApprovalFreeze`, `ChannelReleaseFreezeRecord`, declared bridge capability floor, and governed `RouteFreezeDisposition`
* authoritative operational decisions driven by `AssuranceSliceTrustRecord(trustState = degraded | quarantined)`
* post-submit mutation routes that lack one authoritative action-record and settlement contract
* writable patient, staff, support, hub, or operations routes without one current `AudienceSurfaceRuntimeBinding`, exact `ReleasePublicationParityRecord`, and declared `ReleaseRecoveryDisposition`
* staff, support, hub, governance, or operations workspaces that can render queue, task, or intervention posture as calmly writable, interruption-buffered, or completion-ready without one current `WorkspaceTrustEnvelope` bound to the live consistency tuple, trust tuple, primary action lease, selected-anchor tuple, and settlement chain
* assistive companion or control surfaces that can render summary, provenance, confidence, accept, insert, regenerate, export, or completion-adjacent posture without one current `AssistiveCapabilityTrustEnvelope` bound to the live surface binding, invocation grant, run settlement, trust projection, kill-switch or freeze state, shell-truth contract, publication tuple, and continuity or insertion tuple
* patient-visible artifact or document routes that lack `ArtifactPresentationContract`, or embedded or external handoff routes that lack governed `OutboundNavigationGrant`

#### 14.5 Promotion gate

Production promotion is allowed only after:

* successful compile
* reference-case simulation
* immutable audit of approved bundle hash and domain pack hashes
* explicit authorization by approved actor
* canary strategy exists for high-risk packs
* rollback path exists for each promoted pack
* each promoted bundle or pack carries an `effectiveAt` boundary that is visible to routing, replay, and audit
* one `ReleaseApprovalFreeze` binds promoted artifacts, bundle hashes, schemas, bridge capabilities, migration posture, and compatibility evidence as a single approval tuple
* one published `RuntimePublicationBundle` binds live route-contract digests, design-contract digests, passing design-contract lint verdicts, settlement schemas, transition-envelope schemas, recovery dispositions, surface publication refs, and `AudienceSurfaceRuntimeBinding` tuple membership to that same approval tuple
* promotion evidence proves that embedded and frozen routes degrade through the declared `RouteFreezeDisposition` or `ReleaseRecoveryDisposition`, and that patient-visible artifact exits require the declared `OutboundNavigationGrant` policy rather than raw browser navigation
* in-flight irreversible commands pin or re-check the applicable bundle instead of silently switching policy mid-commit

### 15. Downstream conformance requirements

Any downstream document or implementation that references this canonical segment must conform to all of the following:

1. Any design that stores drafts as `Request(workflowState = draft)` must be replaced with `SubmissionEnvelope.state = draft`.
2. Any flow that treats `manual_only` as an `AccessGrant` type must be replaced so that `manual_only` is only a routing disposition and issues no redeemable grant.
3. Any flow that auto-attaches on `same_episode_candidate` must be replaced so that `same_episode_candidate` is clustering only; attach requires `same_episode_confirmed`, immutable `DuplicatePairEvidence`, immutable `DuplicateResolutionDecision`, and the attach rules in section 8.
4. Any hub, servicing-site, or support view that relies on collapsed UI as the privacy boundary must be replaced with field-level allow-lists plus explicit section, preview, and artifact-mode contracts.
5. Any patient or staff view that shows only “one clear next action” must be replaced with `ProjectionActionSet`, which supports one primary action plus visible blocking secondary actions and dependencies.
6. Any unified communication thread must preserve typed subthreads and reply semantics.
7. Any buffering logic must implement the non-bufferable urgent and decision-blocking delta rule.
8. Any waitlist logic that uses nonexclusive supply may optimize throughput only through truthful nonexclusive policies and never through fake hold language.
9. Any manual hub booking or weak pharmacy transport path must use `ExternalConfirmationGate` and may not emit final assurance text before authoritative confirmation.
10. Any live rollout plan must satisfy the minimum pre-live control pack in section 14.
11. Any post-submit mutation route that lacks `RouteIntentBinding` and authoritative `CommandSettlementRecord` semantics must be replaced.
12. Any auth, telephony, patient, or support flow that reissues, rotates, or redeems grants without exact-once `AccessGrantRedemptionRecord` and `AccessGrantSupersessionRecord` settlement must be replaced.
13. Any embedded or channel-specific write surface that does not validate manifest, release-freeze, and bridge-compatibility posture must be replaced.
14. Any duplicate policy that lacks channel-specific calibration, candidate-to-candidate competition margins, or explicit continuity-witness requirements for same-request attach must be replaced.
15. Any operational consumer that treats `AssuranceSliceTrustRecord(trustState = degraded | quarantined)` as authoritative truth must be replaced.
16. Any writable audience surface that does not bind one current `AudienceSurfaceRuntimeBinding` with exact publication parity must be replaced.
17. Any patient shell that does not derive live CTA posture from `PatientShellConsistencyProjection`, and where applicable `PatientEmbeddedSessionProjection` plus `RouteFreezeDisposition`, must be replaced.
18. Any staff mutation surface that does not gate advice, messaging, admin-resolution, or next-task launch through `ReviewActionLease`, `WorkspaceFocusProtectionLease`, `ProtectedCompositionState`, and `TaskCompletionSettlementEnvelope` must be replaced.
19. Any patient-visible artifact or document route that does not use `ArtifactPresentationContract`, and any external or overlay handoff that does not use `OutboundNavigationGrant`, must be replaced.
20. Any route family, shell, or release gate that treats token export, state semantics, automation markers, or telemetry vocabulary as implicit build output rather than one current `DesignContractPublicationBundle` plus one passing `DesignContractLintVerdict` must be replaced.
20. Any known release, channel, publication, or embedded-session mismatch that falls through to generic failure instead of `ReleaseRecoveryDisposition` or `RouteFreezeDisposition` must be replaced.
21. Any operations, assurance, or audit diagnostic surface that explains continuity-sensitive degradation from generic queue, delivery, or freshness metrics without bound `ContinuityControlHealthProjection`, `OpsContinuityEvidenceSlice`, and preserved `InvestigationDrawerSession` semantics must be replaced.

## Canonical real-time interaction, motion, and live-projection experience algorithm

### 0. Purpose

This segment defines the mandatory UI and interaction algorithm for all patient, staff, hub, pharmacy, support, operations, and embedded surfaces.

It codifies the **Signal Atlas Live** interaction model. Vecells must behave as a continuous case system with stable object identity, local asynchronous acknowledgement, calm real-time projection updates, and explicit trust signaling rather than as a set of detached pages, CRUD detail views, or generic enterprise dashboards.

This revision adds the **Quiet Clarity** overlay: keep continuity, safety, and trust cues intact while reducing simultaneous surface count, duplicated status chrome, and unnecessary visual escalation.

The platform-wide continuity law is:

**same object, same shell**

The low-noise operating law is:

**one screen, one question, one dominant action, one promoted support region**

Every major surface must default to a single focal task region. History, evidence, context, and assistive surfaces may remain available, but only one of them may be promoted automatically at a time unless a true blocker, compare task, or explicit user pin justifies more.

If the user is still working the same canonical request, booking case, hub case, pharmacy case, callback case, support investigation, or tightly related lineage object, the shell must remain stable while child states morph in place.

The experience must be:

* state-driven
* projection-backed
* real-time where safe
* locally acknowledged before remotely settled
* shell-stable across adjacent child states
* selected-anchor-preserving across validation, pending, settlement, invalidation, and failure
* explicit about freshness, trust, causality, ownership, and next action
* quiet by default with progressive disclosure
* list-first with visualization on demand
* soft-transitioned between adjacent lifecycle states
* calm under asynchronous change
* keyboard-first and accessibility-safe
* verifiable in browser automation without brittle selectors
* free of disruptive full-page reloads except at true shell, security, permission, or schema-divergence boundaries

Any local rule that implies hard navigation, contradictory status presentation, silent freshness loss, focus theft, selected-object disappearance, spinner-led waiting for an already-known entity, or multiple competing primary signals in the same viewport is invalid unless it matches an explicit exception in this segment.

### 0.1 Compatibility bridge

This segment upgrades the visual and interaction model while preserving downstream terminology compatibility.

Compatibility aliases:

* `AnchorCard` maps to `CasePulse`
* `LiveTimeline` maps to `StateBraid`
* `ActionDock` maps to `DecisionDock`
* `AmbientStateRibbon` and `FreshnessChip` render as one shared status strip in quiet mode
* `ContextConstellation` may render as a closed or peeked context drawer in quiet mode

Any existing phase or screen contract that still uses the compatibility names inherits the semantics defined here.

Where this segment overlaps with `platform-frontend-blueprint.md` and `canonical-ui-contract-kernel.md`, those blueprints are canonical for shell reuse, shared IA rules, visual token math, state-severity precedence, `SurfaceStateFrame`, `ArtifactStage`, status arbitration, automation-anchor vocabulary, and responsive `mission_stack` behavior. Phase 0 remains the compatibility bridge and the source definition for shared cross-phase contracts such as `ArtifactPresentationContract` and `OutboundNavigationGrant`.

### 0.2 Continuity key and shell law

Define `entityContinuityKey = audienceTier + canonicalEntityRef + lineageScope`.

Where:

* `canonicalEntityRef` is the stable object the user is meaningfully working
* `lineageScope` is the minimal downstream scope that may share one shell without confusing object identity

Rules:

1. If the incoming surface resolves to the same `entityContinuityKey`, reuse the existing `PersistentShell`.
2. If only child view, access scope, sub-task, or downstream phase changes within the same `entityContinuityKey`, morph the child surface in place.
3. When the same continuity key remains active, preserve `CasePulse`, the shared status strip, `DecisionDock`, `StateBraid`, open side stages where still valid, scroll where safe, focus where safe, and any active `SelectedAnchor`.
4. Only replace the shell when one of the allowed hard-boundary conditions in this segment is met.
5. Route changes within the same `entityContinuityKey` must never imply loss of object identity or blank-page reset.
6. Access expansion after claim, sign-in, verification, or embedded deep-link validation must reveal newly authorized detail progressively inside the same shell whenever the continuity key is unchanged.
7. A continuity-preserving transition must also preserve the current disclosure posture unless a blocker, conflict, or explicit user action requires more detail.
8. When a temporary blocker, conflict, or compare posture resolves, restore the prior quiet posture unless the user explicitly pinned a richer layout.
9. Embedded, constrained-browser, or browser-handoff posture may change `channelProfile`, shell chrome, or governed delivery options inside the current shell, but it must not change `shellType` while the same continuity key, canonical object, and audience tier remain valid.

### 1. Required experience topology and primitives

#### 1.1 PersistentShell

Fields:

* `shellId`
* `shellType = patient | staff | hub | pharmacy | support | operations | governance | assistive`
* `audienceTier`
* `channelProfile = browser | embedded | constrained_browser`
* `entityContinuityKey`
* `layoutTopology = focus_frame | two_plane | three_plane | mission_stack | embedded_strip`
* `clarityMode = essential | expanded | diagnostic`
* `attentionBudgetRef`
* `activeEntityRef`
* `activeChildView`
* `childSurfaceRef`
* `promotedSupportRegionRef`
* `suppressedRegionRefs[]`
* `signalRailState`
* `caseSpineState`
* `contextConstellationState = closed | peek | open | pinned`
* `pinnedContextRefs[]`
* `selectedAnchorRefs[]`
* `preservedPanels`
* `lastQuietPostureRef`
* `preservedScrollOffsets`
* `preservedFocusRef`
* `liveMode = live | buffered | paused`
* `liveProtectionMode = normal | buffered | composition_protected`
* `freshnessSummary`
* `shellHydrationState = partial | hydrated | degraded`
* `reducedMotionEnabled`

Semantics:

* is the durable visual container for a single active entity or tightly related lineage cluster

* must survive adjacent state changes of the same continuity key

* must preserve context across soft route changes

* must treat embedded or otherwise constrained channel posture as a channel adaptation of the owning shell rather than as a second shell identity; when the same continuity key remains valid, the shell may morph `channelProfile`, chrome, and governed delivery options without changing `shellType`

* must render the canonical Vecells layout topology:

  * patient and lightweight flows default to `focus_frame`
  * staff, hub, support, operations, governance, and standalone assistive control shells default to `two_plane`
  * `three_plane` is reserved for comparison-heavy, blocker-heavy, or explicitly pinned context states
  * mobile and narrow tablet default to `mission_stack`
  * `embedded_strip` is reserved for `channelProfile = embedded` or another constrained channel profile when the owning shell must retain continuity with reduced chrome

* may use `shellType = assistive` only for standalone evaluation, replay, monitoring, or release-control work; assistive suggestion rails and provenance panels attached to active care or support work remain bounded companions inside the owning shell

* must start in `clarityMode = essential` unless a blocker, conflict, or diagnostic task requires more detail

* must carry the active `AttentionBudget` for the shell and respect its surface-promotion limits

* in `clarityMode = essential`, must promote at most one support region in addition to the primary work surface unless a true blocker, compare mode, or explicit user pin justifies more

* must preserve active command context, open side stage, and pinned comparison context where still valid

* must preserve any active `SelectedAnchor` unless an explicit release rule is met

* must restore the last user-approved quiet posture after a temporary blocker, conflict, or compare promotion ends unless the user explicitly pinned a richer layout

#### 1.1A AttentionBudget

Fields:

* `budgetId`
* `entityContinuityKey`
* `clarityMode`
* `dominantQuestionRef`
* `dominantActionRef`
* `promotedSupportRegionRef = none | state_braid | evidence_prism | context_constellation | inline_side_stage`
* `lastQuietSupportRegionRef = none | state_braid | evidence_prism | context_constellation | inline_side_stage`
* `maxPromotedRegions = 0 | 1 | 2`
* `allowedPlaneCount = 1 | 2 | 3`
* `promotionReason = none | blocker | conflict | reopen | compare | explicit_user_request | urgent`
* `promotionLockReason = none | composing | comparing | confirming | reading_delta`
* `deltaPriorityMode = summary_first | diff_first`
* `suppressionWindowMs`
* `promotionCooldownMs`
* `lastPromotionAt`
* `suppressedSignalRefs[]`
* `quietReturnTokenRef`
* `returnToQuietPolicy = on_resolve | on_commit | manual_only`

Semantics:

* is the explicit cognitive contract emitted by `CognitiveLoadGovernor`
* constrains simultaneous promoted surfaces, status cues, and plane count for the current shell
* must default patient and routine staff work to `maxPromotedRegions <= 1`
* must allow `allowedPlaneCount = 3` only for blocker-heavy, compare-heavy, pinned, or diagnostic work
* must prefer demotion to summary stubs before introducing new banners, rails, or panels
* must freeze auto-promotion while the user is composing, comparing, confirming, or reading a materially changed delta unless blocker severity increases
* must rate-limit repeated shell-level cue promotion and demotion so the interface does not thrash under live change
* on operations routes, `dominantQuestionRef`, `dominantActionRef`, and any promoted support region must resolve from the current `OpsBoardPosture` and `OpsProminenceDecision`; only the promoted anomaly surface plus `InterventionWorkbench` may remain elevated, and other abnormal surfaces must collapse to stable secondary summaries
* reopen, return, and materially changed review flows must set `deltaPriorityMode = diff_first` until the authoritative delta packet is acknowledged or recommitted; local highlight heuristics are insufficient
* when a temporary promotion resolves, must restore `lastQuietSupportRegionRef` through `quietReturnTokenRef` unless the user pinned a richer view

#### 1.2 CasePulse

Fields:

* `entityRef`
* `entityType`
* `macroState`
* `stateAxes.lifecycle`
* `stateAxes.ownership`
* `stateAxes.trust`
* `stateAxes.urgency`
* `stateAxes.interaction`
* `headline`
* `subheadline`
* `primaryNextActionRef`
* `statusTone`
* `freshnessState`
* `ownershipOrActorSummary`
* `urgencyBand`
* `confirmationPosture`
* `slaArc`
* `lastMeaningfulUpdateAt`
* `changedSinceSeen`
* `secondaryMetaState = collapsed | expanded`
* `pendingTransitionRefs[]`

Semantics:

* is the stable identity surface for the active object
* is the compact truth layer for the case
* must remain visually present while child states change
* must expose one shared `macroState` plus the five secondary `stateAxes`
* must foreground headline, macro state, and next best action cue before any secondary metadata
* must be shared across adjacent views of the same request, booking, hub case, pharmacy case, callback case, or support investigation
* must never contradict the authoritative patient-safe or staff-precise state mapping supplied by `MacroStateMapper`

#### 1.3 StateBraid

Fields:

* `timelineId`
* `entityRef`
* `audienceTier`
* `businessStateEventRefs[]`
* `communicationEventRefs[]`
* `externalConfirmationEventRefs[]`
* `exceptionRecoveryEventRefs[]`
* `reviewRequiredRefs[]`
* `returnEventRefs[]`
* `unseenEventRefs[]`
* `highlightedDeltaRefs[]`
* `currentTaskRef`
* `defaultWindow = latest_relevant | full_history`
* `collapsedEventCount`
* `liveInsertMode = immediate | buffered`
* `resumeMode = normal | diff_first`

Semantics:

* is the continuity spine for state change, communication, external confirmation, recovery, and re-check requirements
* replaces simplistic single-lane activity feeds
* must update in place
* must support changed-since-seen cues
* must preserve chronology while making causality legible
* must default to the latest relevant events in `clarityMode = essential`
* must support diff-first emphasis on reopen, return, and materially changed review flows

#### 1.4 EvidencePrism

Fields:

* `prismId`
* `entityRef`
* `factRefs[]`
* `inferredRefs[]`
* `thirdPartyConfirmationRefs[]`
* `ambiguousRefs[]`
* `staleRefs[]`
* `conflictRefs[]`
* `reviewRequiredReasonRefs[]`
* `sourceOpenState`
* `freshnessState`
* `defaultDensity = summary | expanded`
* `autoExpandReason = none | conflict | stale | blocker | requested`
* `reviewVersion`
* `lastAcknowledgedSnapshotRef`
* `authoritativeDeltaPacketRef`
* `changedSinceSeenRefs[]`
* `supersededContextRefs[]`
* `deltaAcknowledgementState = none | pending_review | acknowledged | recommit_required`
* `quietReturnEligibility = blocked | on_ack | on_resolve`
* `diffFirstTargetRef`

Semantics:

* is the canonical evidence surface
* must distinguish user-entered facts, system-derived inference, third-party confirmation, ambiguous evidence, stale evidence, and conflicting evidence
* must support inline source inspection without leaving the current task
* must support diff-first rendering against the last acknowledged evidence snapshot through one authoritative `EvidenceDeltaPacket`
* must default to a summary posture in `clarityMode = essential`
* must auto-expand only when conflict, staleness, a blocking review requirement, or explicit user intent makes more detail necessary
* must remain explicit when new evidence invalidates an in-progress decision
* must keep superseded endpoint, ownership, duplicate-lineage, and approval context visible with explicit markers until the reviewer rechecks and recommits intentionally
* decisive and consequential delta cues may decay from initial emphasis, but they may not disappear or collapse to ordinary history before `deltaAcknowledgementState` advances

#### 1.5 DecisionDock

Fields:

* `dockId`
* `entityRef`
* `location = bottom | side`
* `primaryActionRef`
* `secondaryActionRefs[]`
* `secondaryActionMode = inline | overflow`
* `recommendationReasonRef`
* `confidenceLevel`
* `consequencePreviewRef`
* `transitionEnvelopeRef`
* `anchorPersistenceRef`
* `stateStability = stable | pending | blocked | invalidated | reconciled`
* `blockingReason`
* `isSticky`

Semantics:

* is the single bounded action zone for the current moment
* must remain stable during live updates
* must expose asynchronous progress without moving the user to a different page
* must surface the dominant next action while keeping secondary actions subordinate or overflowed
* must show consequence and confidence before irreversible or externally consequential action
* must explain why an action is blocked, stale, invalidated, or awaiting re-check

#### 1.6 AmbientStateRibbon

Fields:

* `ribbonId`
* `entityRef`
* `freshnessEnvelopeRef`
* `saveState = idle | saving | saved | failed`
* `syncState = fresh | updating | stale | disconnected | paused`
* `transportState = live | reconnecting | disconnected | paused`
* `pendingExternalState = none | awaiting_confirmation | awaiting_reply | awaiting_ack`
* `bufferState = none | queued_updates | review_required`
* `localFeedbackState = none | shown | queued | superseded`
* `processingAcceptanceState = none | accepted_for_processing | awaiting_external_confirmation | rejected | timed_out`
* `authoritativeOutcomeState = none | pending | review_required | recovery_required | settled | failed`
* `attentionTone = quiet | caution | urgent`
* `renderMode = integrated_status_strip | promoted_banner`
* `message`
* `lastChangedAt`

Semantics:

* provides lightweight always-available feedback for save, sync, freshness, pending external work, and buffered live updates
* `syncState` is the rendered shell-level verdict from `ProjectionFreshnessEnvelope`; `transportState` is transport health only and may not stand in for projection truth, freshness, or actionability
* `localFeedbackState`, `processingAcceptanceState`, and `authoritativeOutcomeState` are a shell-level summary over the bound canonical settlement chain; the ribbon may explain provisional progress, but it may not invent or advance final success on its own
* must replace silent waiting
* must visually merge with `FreshnessChip` into one shared status strip on routine surfaces
* must not dominate the viewport unless an urgent action or blocking trust state exists
* must communicate live buffering and re-check requirements without breaking shell continuity
* local acknowledgement, reconnect, queue drain, or worker acceptance may widen pending explanation, but quiet completion copy requires `authoritativeOutcomeState = settled` from the governing settlement source
* reconnect, poll success, or queued delta arrival may widen transport explanation, but they may not clear stale, blocked, or recovery posture until the bound freshness envelope proves the current projection truth is fresh enough again

#### 1.7 FreshnessChip

Fields:

* `chipId`
* `projectionRef`
* `freshnessEnvelopeRef`
* `consistencyClass = informational_eventual | operational_guarded | command_following`
* `scope = shell | region | anchor | command_following`
* `freshnessState = fresh | updating | stale | disconnected | paused`
* `transportState = live | reconnecting | disconnected | paused`
* `renderMode = integrated_status_strip | standalone`
* `freshnessAgeMs`
* `staleAfterAt`
* `requiredForCurrentAction`
* `actionabilityState = live | guarded | frozen | recovery_only`
* `degradeReasonRefs[]`
* `lastKnownGoodSnapshotRef`
* `lastProjectionVersion`
* `lastCausalTokenApplied`

Semantics:

* declares how trustworthy the visible data currently is
* derives from `ProjectionFreshnessEnvelope`, not directly from socket health, poll success, or cursor movement
* must be available on all projection-backed detail, list, board, and spatial-comparison surfaces
* must render inside the shared status strip in `clarityMode = essential`
* may promote to standalone only when freshness is directly decision-blocking or when dense operational boards need per-surface trust signaling
* must be visible at shell level when freshness loss affects safe action
* must make freshness loss explicit before any unsafe follow-up action is allowed
* `transportState = live` is not enough to render `fresh`, and `freshnessState = fresh` is illegal while `actionabilityState = frozen | recovery_only` or while awaited command-following truth is past `staleAfterAt`
* shell-level freshness may stay calmer than a localized region only when the current envelope proves the dominant action, selected anchor, and shell interpretation remain safe

#### 1.7A ProjectionFreshnessEnvelope

Fields:

* `projectionFreshnessEnvelopeId`
* `continuityKey`
* `entityScope`
* `surfaceRef`
* `selectedAnchorRef`
* `consistencyClass = informational_eventual | operational_guarded | command_following`
* `scope = shell | region | anchor | command_following`
* `projectionFreshnessState = fresh | updating | stale_review | blocked_recovery`
* `transportState = live | reconnecting | disconnected | paused`
* `actionabilityState = live | guarded | frozen | recovery_only`
* `lastProjectionVersionRef`
* `lastCausalTokenApplied`
* `lastKnownGoodSnapshotRef`
* `lastKnownGoodAt`
* `staleAfterAt`
* `reasonRefs[]`
* `localizedDegradationRefs[]`
* `derivedFromRefs[]`
* `evaluatedAt`

Semantics:

* is the sole freshness authority for `AmbientStateRibbon`, `FreshnessChip`, `SurfacePostureFrame`, any writable-actionability fence, and `FreshnessAccessibilityContract`
* separates projection-truth freshness from transport health so connected channels cannot masquerade as current truth and disconnected transport cannot by itself overstate stale severity
* may localize degradation to shell, region, anchor, or command-following scope, but the shell-level envelope may stay calm only when the dominant action, selected anchor, and global interpretation remain safe
* command-following scopes must remain `guarded | frozen | recovery_only` until the awaited causal token, governed pending disposition, or authoritative recovery path satisfies the current freshness contract
* legacy surfaces that expose only `syncState`, websocket health, or poll success without a current `ProjectionFreshnessEnvelope` are `read_only | recovery_only` for calm or writable posture until the envelope is emitted or backfilled

#### 1.8 ProjectionSubscription

Fields:

* `subscriptionId`
* `projectionRef`
* `entityScope`
* `entityContinuityKey`
* `audienceTier`
* `consistencyClass`
* `applyMode = live_patch | batch_when_idle | manual_apply`
* `pauseReason`
* `transportState = live | reconnecting | disconnected | paused`
* `lastEventCursor`
* `lastVersion`
* `lastCausalToken`
* `bufferedDeltaCount`
* `impactProfilePolicyRef`
* `deltaPolicyRef`

Semantics:

* is the real-time data-binding contract between UI state and projection state
* must support in-place patching, buffering, manual apply, and pause-live behavior
* must preserve continuity while still surfacing trust-impacting changes quickly

#### 1.9 TransitionEnvelope

Fields:

* `transitionId`
* `entityRef`
* `commandRef`
* `affectedAnchorRef`
* `originState`
* `targetIntent`
* `localAckState = queued | local_ack | optimistic_applied | superseded`
* `processingAcceptanceState = not_sent | accepted_for_processing | awaiting_external_confirmation | externally_accepted | externally_rejected | timed_out`
* `externalObservationState = unobserved | projection_visible | external_effect_observed | review_disposition_observed | recovery_observed | disputed | failed | expired`
* `authoritativeOutcomeState = pending | review_required | recovery_required | reconciliation_required | settled | reverted | failed | expired`
* `causalToken`
* `settlementRevisionRef`
* `settlementPolicy = projection_token | external_ack | manual_review`
* `userVisibleMessage`
* `visibleScope = local_component | active_card | active_shell`
* `startedAt`
* `updatedAt`
* `failureReason`
* `recoveryActionRef`
* `invalidateOnConflict`

Semantics:

* is the required bridge state for every asynchronous command or meaningful user action
* prevents dead spinners and page resets
* makes async progress explicit and local to the affected object
* must persist until authoritative settlement, explicit failure, or governed expiry
* must be able to enter `review_required` when optimistic assumptions are invalidated by later evidence or projection truth
* `localAckState`, `processingAcceptanceState`, `externalObservationState`, and `authoritativeOutcomeState` are intentionally distinct; the same shell may show all four, but it may never collapse them into one generic success token

#### 1.10 DeferredUIDelta

Fields:

* `deltaId`
* `entityRef`
* `projectionRef`
* `targetRegionRef`
* `deltaClass = non_disruptive | contextual | disruptive`
* `impactClass = bufferable | review_required | non_bufferable`
* `reasonBuffered`
* `summaryMessage`
* `invalidatesCurrentAction`
* `announcementPriority = silent | polite | assertive`
* `bufferedAt`
* `flushDeadlineAt`
* `causalTokenBoundary`
* `applyWhen = immediate | idle | explicit_user_apply | after_edit_commit`

Semantics:

* holds live updates that would otherwise steal focus or destabilize the layout
* must be used when the user is typing, reading deeply, comparing options, composing a reply, or working a focused case
* `impactClass = non_bufferable` is mandatory when the delta changes safety, identity, ownership, lease validity, lineage fence, route writability, or invalidates the currently selected candidate or action with no safe equivalent
* every buffered delta must carry an explicit `flushDeadlineAt`; indefinite buffering is forbidden
* must communicate when buffered deltas materially change the safety or validity of the current decision

#### 1.11 QueueChangeBatch

Fields:

* `batchId`
* `queueRef`
* `sourceRankSnapshotRef`
* `targetRankSnapshotRef`
* `preservedAnchorRef`
* `preservedAnchorTupleHash`
* `insertedRefs[]`
* `updatedRefs[]`
* `priorityShiftRefs[]`
* `rankPlanVersion`
* `applyPolicy = idle_only | explicit_apply | immediate_if_safe`
* `batchImpactClass = bufferable | review_required`
* `focusProtectedRef`
* `invalidatedAnchorRefs[]`
* `replacementAnchorRefs[]`
* `anchorApplyState = preserved | invalidated | replaced | released`
* `summaryMessage`
* `firstBufferedAt`
* `flushDeadlineAt`
* `batchState = available | applied | dismissed`
* `createdAt`

Semantics:

* is the only allowed mechanism for introducing disruptive live queue changes while a queue is in active use
* protects staff cognition and focus
* must bridge one committed canonical queue order to another; mixed-snapshot reorder is forbidden
* must preserve the exact currently pinned row or card through `preservedAnchorRef` plus `preservedAnchorTupleHash`; row label, ordinal, scroll position, highlight, or DOM focus alone are not proof of continuity
* if the target snapshot cannot preserve that same anchor tuple, the batch must publish invalidation or explicit replacement before apply; silent neighbor substitution is forbidden
* must apply in stable order: focused item first, then background rows in canonical ranked order for the active `rankPlanVersion`
* batches may coalesce only while `now < flushDeadlineAt`; after that deadline they must either apply or escalate to `review_required`

#### 1.11A QueueRankPlan

Fields:

* `queueRankPlanId`
* `queueFamilyRef`
* `eligibilityRuleSetRef`
* `lexicographicTierPolicyRef`
* `withinTierWeightSetRef`
* `fairnessMergePolicyRef`
* `overloadGuardPolicyRef`
* `assignmentSuggestionPolicyRef`
* `explanationSchemaRef`
* `canonicalTieBreakPolicyRef`
* `planHash`
* `effectiveAt`

Semantics:

* is the only versioned source of canonical queue ordering for a queue family
* must declare the exact eligibility, lexicographic precedence, within-tier factors, fairness merge, overload guardrails, explanation shape, and stable tie-break policy used for ranking
* the same durable fact cut plus the same `QueueRankPlan` must yield the same queue order, explanation payloads, and next-task candidates on replay
* reviewer-specific skill, current assignee preference, or browser-local sort may not enter canonical ranking through `QueueRankPlan`; those concerns belong only to downstream suggestion policy

#### 1.11B QueueRankSnapshot

Fields:

* `rankSnapshotId`
* `queueRef`
* `queueRankPlanRef`
* `asOfAt`
* `sourceFactCutRef`
* `trustInputRefs[]`
* `eligibleTaskRefs[]`
* `excludedTaskRefs[]`
* `overloadState = nominal | overload_critical`
* `fairnessCycleStateRef`
* `rowOrderHash`
* `generatedAt`

Semantics:

* is the replayable canonical ordering cut for one queue at one governed instant
* must be materialized before queue rows, preview digests, next-task candidates, supervisor explanations, or operations queue-pressure boards are published
* binds one queue order to one consistent cut of task facts, trust inputs, and one active `QueueRankPlan`; partial recomputation from mixed freshness is forbidden

#### 1.11C QueueRankEntry

Fields:

* `rankEntryId`
* `rankSnapshotRef`
* `taskRef`
* `ordinal`
* `eligibilityState = eligible | held_preemption | held_trust | excluded_scope`
* `lexicographicTier`
* `urgencyScore`
* `residualBand`
* `contactRiskBand`
* `duplicateReviewFlag`
* `urgencyCarry`
* `fairnessBandRef`
* `fairnessCreditBefore`
* `fairnessCreditAfter`
* `canonicalTieBreakKey`
* `explanationPayloadRef`
* `generatedAt`

Semantics:

* stores the durable reasons why one task outranks another inside a specific `QueueRankSnapshot`
* must carry enough factor, tier, and fairness detail for exact supervisor explanation and deterministic rebuild verification
* is the only source for row ordinal, rank explanation, and next-task candidate continuity inside the same queue snapshot

#### 1.11D QueueAssignmentSuggestionSnapshot

Fields:

* `suggestionSnapshotId`
* `rankSnapshotRef`
* `reviewerScopeRef`
* `candidateWindowSize`
* `suggestionRows[]`
* `governedAutoClaimRefs[]`
* `generatedAt`

Semantics:

* is the derived reviewer-suggestion or governed auto-claim view over an already-committed `QueueRankSnapshot`
* may optimize reviewer fit, continuity, and focus protection only after canonical queue order is fixed
* may not rewrite task ordinals, eligibility, or explanation payloads from the source `QueueRankSnapshot`

#### 1.12 QueueLens

Fields:

* `lensId`
* `queueRef`
* `rankSnapshotRef`
* `focusedItemRef`
* `focusedRankEntryRef`
* `densityHorizonRef`
* `priorityLayers[]`
* `ownershipGhostRefs[]`
* `changedSinceSeenRefs[]`
* `burstIndicatorState`
* `bulkActionRailState`
* `queuedUpdateBadgeState`
* `liveGuardState = live | buffered | paused`
* `viewMode = list | board | compact`

Semantics:

* is the canonical worklist surface for staff-facing operational work
* is not a passive table
* must support scan, compare, inline inspect, inline act, bulk act, and pivot to the active case without losing the working set
* must render resting order from one `rankSnapshotRef` rather than client-side ad hoc sort
* must keep the focused item visually pinned while open

#### 1.13 InlineSideStage

Fields:

* `stageId`
* `hostSurfaceRef`
* `subjectRef`
* `subjectContinuityKey`
* `openState`
* `comparisonSubjectRefs[]`
* `returnFocusRef`
* `preservedDraftRef`
* `widthMode = narrow | standard | wide`

Semantics:

* is the bounded inline expansion surface for inspecting a related object, comparison target, or compose action
* replaces most modal stacks and detached detail pages
* must preserve the working set and restore focus on close
* must inherit continuity semantics when inspecting tightly related child objects

#### 1.13C CommunicationEnvelope

Fields:

* `communicationEnvelopeId`
* `threadId`
* `clusterRef`
* `subthreadRef`
* `governingObjectRef`
* `communicationKind = clinician_message | callback_expectation | callback_outcome | more_info_request | reminder | instruction | patient_reply | delivery_repair_notice | outcome_notice`
* `channel = sms | email | portal | push | voice | internal_task | none`
* `payloadRef`
* `payloadChecksum`
* `transportAckState = none | accepted | rejected | timed_out`
* `deliveryEvidenceState = pending | delivered | disputed | failed | expired | suppressed`
* `deliveryRiskState = on_track | at_risk | likely_failed | disputed`
* `authoritativeOutcomeState = awaiting_delivery_truth | awaiting_reply | callback_scheduled | awaiting_review | reviewed | settled | recovery_required | suppressed`
* `latestReceiptEnvelopeRef`
* `latestConversationSettlementRef`
* `latestCallbackStatusRef`
* `latestReminderPlanRef`
* `reachabilityAssessmentRef`
* `experienceContinuityEvidenceRef`
* `causalToken`
* `monotoneRevision`
* `recordedAt`

Semantics:

* is the sole request-centered communication row authority across message sends, callback promises or outcomes, reminders, more-info asks, instructions, repair notices, and patient replies
* keeps `transportAckState`, `deliveryEvidenceState`, `deliveryRiskState`, and `authoritativeOutcomeState` explicit so patient and staff surfaces can acknowledge transport progress without manufacturing calm conversational success
* must be emitted or refreshed by `MessageDispatchEnvelope`, `CallbackExpectationEnvelope`, `NetworkReminderPlan`, reply or callback settlements, and delivery-repair flows rather than by route-local timeline joins or toast state
* all thread lists, preview rows, callback cards, reminder notices, and open-thread history must cite the current `CommunicationEnvelope` for the same `threadId` and `subthreadRef`; local draft state or callback receipts are descriptive only until reflected through the envelope

#### 1.13D ConversationSubthreadProjection

Fields:

* `subthreadProjectionId`
* `threadId`
* `clusterRef`
* `subthreadType = clinician_message | callback | more_info | reminder | instruction`
* `governingObjectRef`
* `ownerRef`
* `replyTargetRef`
* `replyWindowRef`
* `latestCommunicationEnvelopeRef`
* `latestReceiptEnvelopeRef`
* `latestSettlementRef`
* `latestReminderPlanRef`
* `latestThreadExpectationEnvelopeRef`
* `latestThreadResolutionGateRef`
* `latestCallbackStatusRef`
* `selectedAnchorRef`
* `deliveryRiskState`
* `authoritativeOutcomeState`
* `replyCapabilityState = live | blocked_route_repair | blocked_visibility | blocked_safety | expired | review_only | none`
* `subthreadState = active | awaiting_reply | awaiting_review | reminder_pending | repair_required | closed | superseded`
* `continuityEvidenceRef`
* `receiptGrammarVersionRef`
* `subthreadTupleHash`
* `computedAt`

Semantics:

* preserves typed semantics inside the unified conversation surface so callback promises, reminders, follow-up asks, replies, and clinician messages do not collapse into one generic timeline row
* must retain owner, reply target, reply validity, expiry, and workflow-branch meaning for the active subthread even when the parent thread is rendered in compact or quiet mode
* must carry the current expectation, resolution, and callback-status chain for the active branch so reminder fallback, callback repair, or support resend can widen guidance without rewriting the subthread's owner, reply target, or expiry semantics
* reminder and callback fallback behavior must remain visible as typed subthreads in the same cluster instead of detaching into unrelated appointment, callback, or repair mini-flows

#### 1.14 ConversationThreadProjection

Fields:

* `threadId`
* `clusterRef`
* `requestRef`
* `audienceTier`
* `selectedAnchorRef`
* `typedSubthreadRefs[]`
* `communicationEnvelopeRefs[]`
* `messageRefs[]`
* `callbackRefs[]`
* `reminderRefs[]`
* `moreInfoRefs[]`
* `instructionRefs[]`
* `intentGroupRefs[]`
* `pendingReplyRefs[]`
* `reviewMarkerRefs[]`
* `latestPreviewDigestRef`
* `latestReceiptEnvelopeRef`
* `latestConversationSettlementRef`
* `latestCallbackStatusRef`
* `activeComposerLeaseRef`
* `latestThreadExpectationEnvelopeRef`
* `latestThreadResolutionGateRef`
* `visibilityProjectionRef`
* `placeholderContractRef`
* `requestReturnBundleRef`
* `recoveryContinuationRef`
* `latestContinuityEvidenceRef`
* `lastSeenCursor`
* `currentActionRef`
* `replyCapabilityState`
* `receiptGrammarVersionRef`
* `threadTupleHash`
* `threadState = active | pending | review_required | repair_required | settled | recovery_only`
* `surfaceMode = unified_request_thread`

Semantics:

* unifies messages, follow-up questions, callback expectations, reminder notices, patient replies, and actionable instructions into one request-centered communication surface
* must prevent siloed communication experiences
* must support live insertion, reply pending states, changed-since-seen cues, reminder or callback fallback morphs, and smooth return-to-review transitions without dropping the active anchor, draft, or typed subthread into a detached mini-flow
* must resolve one current communication tuple for the active `threadId`: the ordered `CommunicationEnvelope` set, ordered `ConversationSubthreadProjection` set, current preview digest, current receipt envelope, current settlement, current callback status, current composer lease, current visibility posture, and current continuity evidence for the same `selectedAnchorRef`, `receiptGrammarVersionRef`, and `threadTupleHash`
* transport acknowledgement, delivery evidence, and delivery risk may widen or block guidance, but they may not rewrite authoritative conversational outcome or typed subthread meaning; if thread, subthread, visibility, or continuity posture drifts, the same shell must freeze mutating controls and recover the active anchor rather than reopening a generic messages landing page

#### 1.15 ConsequencePreview

Fields:

* `previewId`
* `actionRef`
* `entityRef`
* `immediateEffects[]`
* `downstreamEffects[]`
* `blockingConditions[]`
* `fallbackActionRefs[]`
* `projectedMacroState`
* `projectedStateAxes`
* `requiresExplicitConfirm`

Semantics:

* is the required disclosure surface for irreversible, externally consequential, or high-risk actions
* must appear before commit for actions that can change downstream ownership, patient-visible status, capacity, messaging, or pharmacy/network execution
* must clarify what state language and trust posture will change after commit

#### 1.16 MotionIntentToken

Fields:

* `intent = reveal | morph | settle | pending | invalidate | diff | reopen | degrade | recover | handoff | escalate`
* `legacyIntentAlias = commit -> settle`
* `timingBand = instant | standard | deliberate | urgent`
* `sourceOriginRef`
* `amplitude = silent | low | medium | urgent`
* `movementProfile = none | opacity_only | anchored_translate | anchored_morph | outline_emphasis | status_pulse`
* `easingFamily = standard_enter | standard_exit | anchored_morph_spring | deterministic_linear`
* `interruptionPolicy = replace_by_higher_priority | merge_same_target | finish_then_static | preserve_until_authoritative`
* `motionBudgetMs`
* `delayMs`
* `settleHint`
* `reducedMotionFallback`
* `staticEquivalentRef`

Semantics:

* encodes motion meaning
* `commit` is a deprecated compatibility alias and must normalize to `settle` before render
* motion must represent state change, not decoration
* motion must originate from the changed object, command source, or selected anchor rather than from a generic page container
* urgency is expressed through timing, contrast, and explicit state language, not through larger travel or decorative flourish
* motion budgets must remain subordinate to responsiveness and comprehension

#### 1.17 SelectedAnchor

Fields:

* `anchorId`
* `entityRef`
* `anchorType = slot | provider | pharmacy | queue_row | message | evidence_cluster | comparison_candidate | action_card`
* `hostSurfaceRef`
* `continuityFrameRef`
* `governingObjectVersionRef`
* `anchorTupleHash`
* `visualIdentityRef`
* `stabilityState = stable | validating | pending | invalidated | recovered | replaced`
* `fallbackAlternativesRef[]`
* `invalidatingReasonRefs[]`
* `replacementAnchorRef`
* `compareAnchorRefs[]`
* `preserveUntil = settle | review_acknowledged | explicit_dismiss | entity_switch`
* `lastKnownLabel`
* `lastKnownPositionRef`
* `lastValidatedAt`

Semantics:

* is the visual object-permanence contract for the user’s current selection or focus anchor
* `anchorTupleHash` is the canonical identity for continuity; label, list position, highlight, or focus ring alone are not proof that the user is still acting on the same object
* selected objects must not disappear during async work or remote revalidation
* in-place patching is legal only while `anchorTupleHash`, `continuityFrameRef`, and governing-object continuity still match; otherwise the anchor must become `invalidated` or `replaced` explicitly
* invalidated anchors must remain visible until explicit re-check, causal replacement, or dismissal
* recovered anchors may resolve in place without a shell jump or neighbor substitution
* compare targets and side-by-side candidates must carry durable anchor identity as well; compare mode may not silently swap one candidate for another under a preserved card shell
* must be used for selected slot, chosen provider, selected pharmacy, focused queue row, compare target, or any equivalently important user choice

#### 1.18 SurfacePostureFrame

Fields:

* `surfacePostureFrameId`
* `hostShellRef`
* `surfaceRef`
* `entityContinuityKey`
* `freshnessEnvelopeRef`
* `dominantQuestionRef`
* `dominantActionRef`
* `postureState = loading_summary | ready | empty_actionable | empty_informational | stale_review | blocked_recovery | settled_pending_confirmation | read_only`
* `lastStableSnapshotRef`
* `selectedAnchorRef`
* `placeholderContractRef`
* `recoveryActionRef`
* `promotedSupportRegionRef`
* `skeletonPolicyRef`
* `statusOwnershipRef`
* `renderedAt`

Semantics:

* is the only allowed posture frame for primary-region loading, empty, stale, blocked, pending-confirmation, and read-only states
* must keep the same shell, dominant question, dominant action, and selected anchor visible while truth changes
* must prefer a last-stable summary or anchor over a blank reset whenever the entity is already known
* empty states must explain why the surface is empty and what safe action, if any, comes next
* locally acknowledged but unsettled actions must remain inside the same surface posture rather than navigating to a detached success page
* `postureState = ready` is illegal while the bound freshness envelope is `stale_review | blocked_recovery` or its `actionabilityState = frozen | recovery_only`, even if transport remains live

#### 1.19 ArtifactSurfaceFrame

Fields:

* `artifactSurfaceFrameId`
* `artifactRef`
* `entityContinuityKey`
* `artifactPresentationContractRef`
* `summaryRef`
* `sourceArtifactHash`
* `summarySafetyTier`
* `sourceParityState = verified | provisional | stale | blocked`
* `primaryPresentation = summary | inline_preview | placeholder`
* `secondaryDeliveryModes[] = download | print | export | external_handoff`
* `deliveryGrantRefs[]`
* `returnTargetRef`
* `freshnessState`
* `renderedAt`

Semantics:

* is the frontend rendering contract for any artifact-bearing surface or export-capable workflow
* must present source, summary, freshness, and parity before secondary delivery actions
* download, print, export, and external handoff are always secondary and may execute only while grants, scope, and parity remain valid
* stale or blocked artifact parity must degrade in place rather than launching detached artifact routes or misleading previews

### 2. Required frontend services

#### 2.1 LiveProjectionBridge

Responsibilities:

* subscribe to scoped projections
* apply in-place patches
* buffer disruptive deltas
* expose freshness state
* expose delta-rate, buffer pressure, and reconnect health so motion and batching can downgrade safely
* reconcile optimistic UI and server-confirmed state
* feed `ProjectionFreshnessEnvelope`; transport and cursor movement may inform freshness, but they may not substitute for authoritative freshness truth

#### 2.2 TransitionCoordinator

Responsibilities:

* create and advance `TransitionEnvelope`
* control soft route changes
* preserve shell, case pulse, state braid, decision dock, and selected anchors
* decide when a transition settles, reverts, expires, or remains pending
* merge or cancel superseded cues when invalidation, recovery, or reopen truth outranks an in-flight local cue
* convert conflicting projection truth into `review_required` rather than silent overwrite

#### 2.3 MotionSemanticRegistry

Responsibilities:

* normalize legacy intent aliases such as `commit -> settle`
* map `MotionIntentToken` to deterministic timing, delay, easing, amplitude, and static-equivalent rules
* arbitrate one dominant cue per region and one animated region per continuity key except for a declared handoff follower
* enforce consistent motion meaning across patient and staff surfaces
* enforce reduced-motion, low-power, low-frame-stability, and live-churn fallbacks
* ensure motion originates from the changed object or initiating control

#### 2.4 FreshnessSupervisor

Responsibilities:

* classify projections as fresh, updating, stale, disconnected, or paused
* block unsafe destructive actions when required freshness is not met
* surface freshness at component and shell level

#### 2.5 MacroStateMapper

Responsibilities:

* translate internal workflow states into canonical audience-facing macro states
* ensure request, booking, hub, pharmacy, callback, and communication surfaces never contradict each other at top level
* provide patient-safe and staff-precise state language without divergence of underlying truth

#### 2.6 FocusIntegrityGuard

Responsibilities:

* enforce pinned focus law
* prevent live updates from moving the active case, active row, active slot, or active draft unexpectedly
* preserve cursor, selection, and scroll position where safe

#### 2.7 EvidenceLineageResolver

Responsibilities:

* classify evidence into fact, inference, third-party confirmation, ambiguous, stale, and conflicting layers
* compute diff against the last acknowledged review snapshot
* attach source lineage and freshness to each evidence cluster

#### 2.8 InteractionContractRegistry

Responsibilities:

* guarantee stable semantic roles and accessible names for critical controls and regions
* ensure custom components remain keyboard-operable and automation-verifiable
* expose explicit success, warning, locked, stale, failed, invalidated, and reconciled DOM states

#### 2.9 ContinuityOrchestrator

Responsibilities:

* derive `entityContinuityKey`
* decide shell reuse versus shell replacement
* prevent same-entity reloads and same-entity shell churn
* coordinate child-surface morphs, access-expansion reveals, and return-to-context behavior

#### 2.10 SelectedAnchorPreserver

Responsibilities:

* create, update, and release `SelectedAnchor`
* preserve `anchorTupleHash`, governing-object version, and compare-anchor membership through validation, buffering, refresh, restore, and settlement
* keep selected row, card, provider, or slot visible through validation, pending, settlement, and failure
* represent invalidation without disappearance
* publish invalidation or replacement stubs before any sibling object can occupy the released anchor slot
* surface nearest safe alternatives without losing causality

#### 2.11 LiveAnnouncementGovernor

Responsibilities:

* bound live region noise
* turn batched updates into concise, prioritized announcements
* escalate only blocking, urgent, or review-required changes
* prevent repetitive announcements for routine autosave, trivial freshness refreshes, or low-risk list churn

#### 2.12 ResponsivenessLedger

Responsibilities:

* emit continuity, acknowledgement, settle, focus-loss, and anchor-preservation telemetry
* emit breakpoint-class, effective-inline-size, fold-state, compare-fallback, and embedded-strip telemetry for resize, rotate, zoom, and host-resize transitions
* detect same-entity reload regressions
* support automation assertions for local acknowledgement, projection settlement, and focus integrity
* measure perceived responsiveness as speed of stable feedback and comprehension, not only page load time

#### 2.13 CognitiveLoadGovernor

Responsibilities:

* derive and update `AttentionBudget`
* set `PersistentShell.clarityMode`
* choose the single auto-promoted support region for the current task
* cap simultaneously promoted support regions and other expanded secondary surfaces
* collapse secondary context, history, and explanation by default
* auto-promote only the specific hidden region required by a blocker, conflict, reopen delta, compare task, or explicit user request
* restore the last quiet posture once a temporary promotion resolves unless the user pinned richer context
* prevent duplicated status presentation across header, banner, chip, toast, and side rail
* apply promotion hysteresis so live deltas cannot repeatedly switch the promoted support region during active decision moments
* keep non-blocking pending, stale, and acknowledgement states inline or in the shared status strip unless a new user decision is required

#### 2.14 SurfacePostureGovernor

Responsibilities:

* derive `SurfacePostureFrame` from projection completeness, continuity evidence, and settlement state
* preserve the last stable snapshot or selected anchor during refresh, stale review, and blocked recovery
* choose actionable versus informational empty posture without adding duplicate shell chrome
* keep one dominant question and one dominant action visible in the primary region

#### 2.15 ArtifactExperienceCoordinator

Responsibilities:

* derive `ArtifactSurfaceFrame` from `ArtifactPresentationContract`, current grants, and summary parity
* enforce summary-first artifact rendering and same-shell return targets
* keep print, export, download, and external handoff in secondary action zones
* fail closed to placeholder or in-place recovery when parity, grant, or scope posture drifts

### 3. Non-negotiable invariants

1. The same `entityContinuityKey` must reuse the same `PersistentShell`.
2. Adjacent lifecycle states of the same entity must render within the same `PersistentShell`.
3. Any route transition within the same continuity key must use soft navigation and preserve shell context.
4. Patient and lightweight shells must default to `focus_frame`; staff, hub, support, and operations shells must default to `two_plane`; `three_plane` is allowed only when comparison, blockers, or explicit pinning justify the extra noise; mobile and narrow-tablet shells must default to `mission_stack`; only embedded or constrained shells may use `embedded_strip`. Responsive topology must derive from `ResponsiveViewportProfile` and `ShellResponsiveProfile`, measured at the shell container rather than raw device labels.
   * `three_plane` requires `usableInlinePx >= 1280`
   * `two_plane` requires `usableInlinePx >= 960`
   * `mission_stack` is the same-shell fold below split-plane thresholds or whenever zoom or text scale makes split planes unsafe
   * `embedded_strip` is reserved for embedded or constrained shells whose contract requires compressed chrome, especially below `usableInlinePx = 840`
5. Every major entity surface must include a `CasePulse`, one shared status strip implemented through `AmbientStateRibbon` plus `FreshnessChip`, and a single current `DecisionDock`.
6. Every major entity surface must expose one shared `macroState` plus the five `stateAxes`.
7. `StateBraid` and `EvidencePrism` must exist where history or trust matter, but they may open as summary stubs or collapsed panels until the user requests more detail or a blocker, conflict, or reopen flow requires it.
8. At most one dominant primary action and one expanded support region may compete for attention within the same viewport.
   * `AttentionBudget` must be computed for every major entity surface.
   * In `clarityMode = essential`, only `CasePulse`, one shared status strip, one primary work region, and one `DecisionDock` may remain at full prominence by default.
   * `StateBraid`, `EvidencePrism`, `ContextConstellation`, and assistive surfaces must stay collapsed, summary-level, or closed unless explicitly promoted or needed for safe action.
   * When a temporary promotion resolves, the shell must return to the last quiet posture unless the user pinned a richer view.
9. Every anchor-bearing selection or focus-critical choice must create or update a `SelectedAnchor`.
10. Selected anchors must remain visible through validation, pending, settlement, invalidation, and failure unless the user dismisses them or a true entity switch occurs.
11. Projection-backed state changes must patch in place; they must not trigger full-page reloads.
12. A full-screen loading state is forbidden once the active entity is known and at least one viable projection snapshot exists.
13. Every asynchronous action must create a `TransitionEnvelope`.
14. Every irreversible, externally consequential, or high-risk action must render a `ConsequencePreview` before commit.
15. Live updates must not steal focus, reset scroll, collapse open context, or discard partially entered user input.
16. Selected staff work items must remain visually pinned while the user is actively working them.
17. Patient-visible statuses across request, booking, hub, pharmacy, callback, and messaging views must derive from one shared `MacroStateMapper`.
18. Messages, follow-up questions, callback expectations, reminder notices, and actionable patient communications for a request must be unified inside one `ConversationThreadProjection`.
19. Waiting and in-review states must remain living shells with visible continuity, not dead status pages.
20. Evidence origin and trust class must never be flattened into a single undifferentiated content block.
21. Spatial comparison surfaces such as booking orbit or network lattice must always have an accessible list or table fallback and may not displace the calmer list-first default.
22. All critical controls and regions must expose stable semantic roles and accessible names.
23. Color is a secondary signal only; state meaning must also be conveyed by text, iconography, layout, or motion.
24. Reduced-motion mode must preserve all state meaning without requiring spatial animation.
25. Countdown or exclusivity language must not appear unless the underlying business state genuinely supports it.
26. Hard navigation is allowed only for:

* initial shell load
* explicit entity switch
* explicit workspace switch
* true authentication boundary
* permission boundary
* unrecoverable projection or schema divergence

27. Assistive suggestions must remain supplementary and must never displace primary clinical or operational content without user intent.
28. Modal-on-modal stacks are forbidden for adjacent inspection, comparison, or compose flows that can be handled by `InlineSideStage`.
29. Queue reorder, queue insertion, and queue priority shift while a queue is in active use must flow through `QueueChangeBatch`.
30. A live update that materially invalidates an in-progress review must mark that review as `review_required`; it must not silently overwrite or auto-submit the user’s current decision context.
31. Staleness, disconnection, and paused-live mode must be visible when they affect safe action.
32. Route change alone is not an acceptable representation of state change; the relevant object state must also be reflected in the DOM.
33. Same-entity async completion must not create history-stack spam or navigate to a visually unrelated page.
34. Duplicating the same status across multiple simultaneous banners, chips, and toasts is forbidden unless the duplicated state is blocking and the duplication is localized to the active action.
35. Continuity, anchor preservation, focus integrity, and avoidable noise regressions are product defects, not cosmetic issues.
36. Auto-promotion may not switch support regions while the user is composing, comparing, confirming, or actively reading a highlighted delta unless urgency or blocker severity strictly increases.
37. Non-blocking pending, stale, acknowledgement, and capability states must stay local to the active card or the shared status strip; they may not escalate to persistent full-width banners by default.
38. Every primary region must resolve through one `SurfacePostureFrame`; loading, empty, stale, blocked, pending-confirmation, and read-only states may not each invent competing shell chrome.
39. Once the active entity is known, refresh and settlement must preserve the last stable summary or selected anchor in place; generic blank resets and detached success pages are forbidden.
40. Every artifact-bearing surface and export-capable workflow must resolve through one `ArtifactSurfaceFrame`; summary-first presentation is mandatory when policy allows, and download, print, export, or external handoff remain secondary, grant-bound actions.
41. Narrow-screen folds must preserve the same `SurfacePostureFrame`, dominant question, dominant action, and promoted support region rather than inventing a separate mobile-only journey.

### 4. Canonical real-time rendering algorithm

#### 4.0 Continuity resolution algorithm

On route entry, route update, projection apply, sign-in change, claim completion, or access-scope change:

1. Resolve `canonicalEntityRef`, `lineageScope`, `audienceTier`, `entityContinuityKey`, and the relevant shell-consistency projection for the current audience surface.

2. Compare the resolved `entityContinuityKey` to the current shell.

3. If the key is unchanged:

   * reuse the existing `PersistentShell`
   * preserve current `CasePulse`, the shared status strip, `DecisionDock`, `StateBraid`, the current disclosure posture, and active `SelectedAnchor`
   * morph only the child surface that changed
   * when `shellType = patient`, also preserve the current section, active return contract, and last safe posture for request, booking, record, message, callback, pharmacy, or recovery child work; refresh, deep-link resolution, or recovery consume may not reset to generic home, default bucket, or detached success while the same shell continuity key remains valid
   * if a pending `TransitionEnvelope` or same-entity local acknowledgement exists, preserve the last authoritative snapshot and selected anchor until an equal-or-newer `causalToken` or `monotoneRevision` arrives; out-of-order projections may widen pending or recovery posture, but they may not roll the shell back to a calmer state
   * if the active `PatientShellConsistencyProjection`, `StaffWorkspaceConsistencyProjection`, surface publication state, or embedded-session posture no longer matches the current route, keep the shell but freeze mutation and apply bounded refresh or the governing recovery disposition instead of resetting page context

4. If the key is unchanged but authorization expands:

   * reveal newly authorized regions in place
   * do not discard currently visible safe context

5. If the key changes because of an explicit entity switch, workspace switch, true auth boundary, permission boundary, or unrecoverable schema divergence:

   * create a new shell
   * preserve safe return context where possible

6. Emit continuity telemetry for reuse, preservation, or boundary replacement.

7. Never blank the whole screen solely because a child phase or downstream status changed for the same continuity key.

#### 4.1 Initial mount algorithm

On entry to an entity-backed route:

1. Resolve the active entity scope, continuity key, audience tier, channel profile, access grant posture, and derive `ResponsiveViewportProfile` from layout viewport size, shell-container size, dynamic viewport height, safe-area insets, zoom band, text-scale band, and pointer precision.

2. Choose `PersistentShell.layoutTopology` from `ResponsiveViewportProfile`, `ShellResponsiveProfile`, and the current task posture:

   * `three_plane` only when the opening task already requires pinned comparison or blocking context and `usableInlinePx >= 1280`
   * `two_plane` for routine staff, hub, support, and operations surfaces only when `usableInlinePx >= 960`
   * `focus_frame` for patient and lightweight task surfaces when `usableInlinePx >= 600` and no lawful split-plane promotion is active
   * `mission_stack` for any same-shell surface below its split-plane threshold or whenever zoom, text scale, or focus protection makes split planes unsafe
   * `embedded_strip` only for intentionally embedded or constrained experiences that remain on the same shell continuity and whose contract requires compressed chrome, especially below `usableInlinePx = 840`

3. Set `PersistentShell.clarityMode = essential` unless a blocker, conflict, or diagnostic route contract requires a higher detail posture.

4. Ask `CognitiveLoadGovernor` to derive the initial `AttentionBudget` from route class, blocker state, compare posture, and explicit user pins.

5. Create or reuse `PersistentShell`.

6. Render shell chrome immediately:

   * compact `GlobalSignalRail` or mission anchor
   * `CaseSpine`
   * `ContextConstellation` as closed or peeked by default, or stacked context drawer on narrow surfaces unless `AttentionBudget` explicitly promotes it

7. If a current projection snapshot exists:

   * render `CasePulse`
   * render `DecisionDock`
   * render one shared status strip using `AmbientStateRibbon` plus `FreshnessChip`
   * render the budget-approved primary work region at full prominence
   * render non-promoted `StateBraid`, `EvidencePrism`, assistive surfaces, and context as summary stubs, tabs, or closed drawers
   * restore any valid `SelectedAnchor`
   * subscribe in background

8. If only a last-stable snapshot exists for the same continuity key:

   * hydrate the shell from that last-stable snapshot
   * mark freshness as `updating`
   * do not show a blank reset

9. If no snapshot exists:

   * render bounded skeleton regions only for missing panels
   * do not block shell creation

10. Establish `ProjectionSubscription` for all required projections.

11. Mark freshness as `updating` until the first authoritative snapshot arrives.

12. When the snapshot arrives:

* patch missing or stale regions in place
* use `MotionIntentToken(intent = reveal)`
* do not blank the shell
* do not rebuild unaffected regions
* do not auto-expand secondary context unless safe action requires it

13. If the entity was already visible in an adjacent state, morph the child work surface rather than recreating the shell.
14. If verification or claim expands access during mount, reveal newly authorized detail progressively inside the current shell.

#### 4.1A Attention budget algorithm

On shell mount, route morph, blocker change, compare request, reopen, or explicit pin toggle:

1. Start from `clarityMode = essential` and assume the lowest viable surface count.
2. Set `maxPromotedRegions = 0` for simple patient intake, receipt, and quiet status-tracking views.
3. Set `maxPromotedRegions = 1` for routine review, conversation, booking selection, and ordinary staff operational work.
4. Raise to `maxPromotedRegions = 2` and allow `allowedPlaneCount = 3` only when:

   * a blocking trust conflict and comparison task are both present
   * the user explicitly pins context while compare mode is active
   * diagnostic or support replay mode is requested

5. Choose `promotedSupportRegionRef` by decision priority:

   * blocker, stale-trust, or conflict resolution -> `evidence_prism`
   * reopen, return, or materially changed chronology -> `state_braid`
   * active compare task -> `inline_side_stage`
   * policy note or linked context needed for safe action -> `context_constellation`
   * assistive suggestion review -> `inline_side_stage` only when the user requests it or when the suggestion itself is the current review subject

6. If `promotionLockReason != none`, freeze the current promoted support region unless the incoming signal is urgent or blocking with strictly higher severity.
7. Apply `promotionCooldownMs` before switching auto-promoted regions for the same continuity key unless the current promoted region no longer explains the active blocker or conflict.
8. Demote all non-promoted support regions to summary stubs, tabs, closed drawers, or quiet badges.
9. Never auto-promote more than one support region at a time.
10. When the promotion reason resolves, restore `lastQuietPostureRef` unless the user pinned a richer layout.

#### 4.1B Status suppression algorithm

Build status suppression around these contracts:

**StatusCueRecord**
`statusCueId`, `continuityKey`, `entityScope`, `semanticState`, `blockingReason`, `actionScope`, `severityBand`, `freshnessEnvelopeRef`, `sourceSurfaceRef`, `sourceTransitionEnvelopeRef`, `causalToken`, `cueEpoch`, `createdAt`, `resolvedAt`

**StatusSuppressionLedger**
`statusSuppressionLedgerId`, `continuityKey`, `cueHash`, `lastRenderedCueRef`, `lastRenderedAt`, `lastAcknowledgementRef`, `lastRestoreEpoch`, `suppressionState = active | expired | invalidated`

**StatusArbitrationDecision**
`statusArbitrationDecisionId`, `continuityKey`, `shellFreshnessEnvelopeRef`, `candidateCueRefs`, `statusStripCueRef`, `promotedBannerCueRef`, `localCueRefs`, `surfaceStateFrameRefs[]`, `decisionBasisRef`, `decidedAt`

**StatusAcknowledgementScope**
`statusAcknowledgementScopeId`, `continuityKey`, `statusCueRef`, `ackMode = strip | banner | local_control | batch_apply`, `ackEntityScope`, `ackActionScope`, `ackEpoch`, `createdByActionRef`, `expiresAt`

**StatusCueSettlement**
`statusCueSettlementId`, `statusCueRef`, `settlementState = provisional | authoritative | superseded | resolved | disputed`, `resolutionCueRef`, `settlementToken`, `settledAt`

At render and on every delta apply:

1. Resolve the current shell, region, anchor, and any active command-following `ProjectionFreshnessEnvelope` objects before collecting status cues.
2. Collect candidate status cues from save, sync, freshness envelopes, review-required, pending external work, SLA risk, and active `TransitionEnvelope` objects, normalizing each one into `StatusCueRecord` with continuity key, causal token, cue epoch, freshness envelope, and source surface.
3. Collapse equivalent cues only when `semanticState`, `entityScope`, `blockingReason`, `actionScope`, `freshnessEnvelopeRef`, and `StatusCueSettlement.settlementState` all match; provisional and authoritative cues are never equivalent.
4. Hash each remaining cue by `continuityKey + entityScope + semanticState + blockingReason + actionScope + cueEpoch`, consult `StatusSuppressionLedger`, and suppress repeats inside `suppressionWindowMs` only while continuity, restore epoch, settlement class, and freshness-envelope verdict remain unchanged.
5. Run one `StatusArbitrationDecision` to choose exactly one shared-status-strip cue, zero or one promoted banner cue, any remaining local control cues, and any localized `SurfaceStateFrame` owner for the affected region; write the strip outcome into `StatusStripAuthority` and do not let chrome improvise its own independent winner.
6. If the dominant region, selected anchor, or current command-following envelope is `stale_review | blocked_recovery` with `actionabilityState = frozen | recovery_only`, the shared status strip may not render `fresh` or routine quietness even when unrelated regions remain live.
7. Keep control-specific acknowledgement on the initiating control or affected card only, and bind it through `StatusAcknowledgementScope`; local acknowledgement may not silence a broader shell cue unless entity scope, action scope, cue epoch, and freshness envelope all match.
8. Promote to banner only when the state is blocking, urgent, or requires a new user decision and cannot be safely resolved by the shared status strip plus a localized `SurfaceStateFrame`, and only while `StatusCueSettlement.settlementState != resolved`.
9. Suppress routine toasts for save success, fresh projection arrival, and low-risk queue churn, but never suppress a cue whose severity increased, whose settlement changed from provisional to authoritative, whose freshness envelope degraded in actionability, or whose continuity was restored from a different epoch.
10. When a blocking or urgent state resolves, supersedes, or downgrades, emit `StatusCueSettlement` first and then demote it back to the shared status strip or local control state through one stable render pass rather than disappearing abruptly.
11. On shell restore, deep-link re-entry, or continuity-key fork, invalidate stale `StatusSuppressionLedger` rows and recompute `StatusArbitrationDecision` before any prior quiet state is replayed.

#### 4.1C Assistive announcement batching and dedupe algorithm

High-priority announcement failures in this layer:

1. surface-local live regions can still speak before shell-level status, focus, and freshness arbitration settle, so users can hear duplicate or contradictory narration
2. batching and dedupe are still too message-text-centric, which lets local acknowledgement, processing acceptance, and authoritative settlement collapse into the same cue
3. restore, reconnect, queue flush, and replay can still sound like fresh user-driven activity because announcement delivery is not explicitly tied to `UIEventEmissionCheckpoint`
4. focus restore and announcement wording can still drift apart, leaving assistive users on one anchor while the announcement describes another
5. timeout and validation surfaces can still repeat their full message on every tick, keystroke, or retry instead of speaking one stable repair state

Build live announcements around these contracts:

**AssistiveAnnouncementIntent**
`assistiveAnnouncementIntentId`, `surfaceRef`, `continuityFrameRef`, `announcementClass = surface_summary | local_acknowledgement | routine_status | authoritative_settlement | blocker | recovery | form_error_summary | timeout_warning | timeout_expired | freshness_actionability`, `announcementPriority = silent | polite | assertive`, `messageRef`, `messageHash`, `sourceSettlementClass = none | local_acknowledgement | processing_acceptance | external_observation | authoritative_outcome`, `selectedAnchorRef`, `dominantActionRef`, `focusTransitionRef`, `freshnessAccessibilityContractRef`, `statusAcknowledgementScopeRef`, `emissionCheckpointRef`, `governingTupleHash`, `intentState = proposed | coalesced | emitted | suppressed | invalidated`, `createdAt`

**AssistiveAnnouncementTruthProjection**
`assistiveAnnouncementTruthProjectionId`, `surfaceRef`, `continuityFrameRef`, `activeIntentRef`, `coalescedIntentRefs[]`, `lowestEventSequence`, `highestEventSequence`, `announcementTupleHash`, `deliveryDisposition = emit | suppress | deduplicate | replay_current_state | invalidate`, `publishedChannel = off | polite | assertive`, `publishedMessageRef`, `focusImpact = none | advisory | required`, `projectionState = collecting | sealed | emitted | superseded`, `publishedAt`

At render, delta apply, restore, recovery, and submit-result time:

1. Resolve the current `SelectedAnchor`, `FocusTransitionContract`, `StatusArbitrationDecision`, `FreshnessAccessibilityContract`, any active `FormErrorSummaryContract`, any active `TimeoutRecoveryContract`, and the latest committed `UIEventEmissionCheckpoint` window before building live announcements.
2. Let each surface contribute `AssistiveAnnouncementIntent` objects only for surface summary, local acknowledgement, routine status, authoritative settlement, blocker, recovery, form error summary, timeout warning or expiry, and freshness actionability changes.
3. Normalize every intent with `announcementClass`, `sourceSettlementClass`, `selectedAnchorRef`, `dominantActionRef`, `governingTupleHash`, and `emissionCheckpointRef`; if a local component cannot provide those fields, it may not publish a live announcement.
4. Batch only `local_acknowledgement`, `routine_status`, and non-blocking `freshness_actionability` intents whose `announcementPriority != assertive` and whose checkpoint window remains inside one continuity frame. `blocker`, `recovery`, `form_error_summary`, and `timeout_expired` bypass routine batching but may still supersede lower-priority queued text.
5. Coalesce candidate intents only when `announcementClass`, `sourceSettlementClass`, `selectedAnchorRef`, `dominantActionRef`, `governingTupleHash`, `StatusAcknowledgementScope`, focus target, and checkpoint sequence window all match. Shared wording alone is never sufficient.
6. `local_acknowledgement` may announce only on the initiating control or affected card unless the pending state outlives the local acknowledgement budget and the shared status strip is now the dominant explanation. It may never reuse the wording or urgency reserved for authoritative settlement.
7. `processing_acceptance` or transport-level progress may widen pending explanation, but it must stay `announcementPriority = polite` and may not emit the same message hash as `authoritative_settlement`, `review_required`, or `recovery_required`.
8. When `FocusTransitionContract` moves focus, the surviving announcement must reference the same target or recovery action. If focus remains anchored, suppress repeated heading or shell-chrome narration and emit only the changed summary.
9. On restore, reconnect, replay, queue batch apply, or buffer flush, do not replay historical intents. Recompute one current `AssistiveAnnouncementTruthProjection` from current truth and emit at most one `replay_current_state` summary per surface and restore epoch.
10. `FormErrorSummaryContract` may emit one assertive summary per blocked-submit epoch; field-level validation after that stays local, polite, or silent until a new submission epoch begins.
11. `TimeoutRecoveryContract` warnings may emit only at declared thresholds or posture changes. Per-second countdown announcements are forbidden; expiry or new loss of writability may escalate once.
12. `FreshnessAccessibilityContract` announcements must describe changed trust or actionability, not raw transport chatter. Autosave, trivial resort, and low-risk list churn stay silent unless the next safe action, dominant action, or selected anchor changed.
13. `AssistiveAnnouncementTruthProjection` is the only source allowed to publish `AssistiveAnnouncementContract`; toasts, local widgets, and chart chrome may render visuals but may not speak independently.
14. Verification must cover restore-epoch dedupe, local-ack versus authoritative-settlement wording, threshold-based timeout warnings, form-error-summary dedupe, and buffered-queue-digest ordering against the preserved anchor.

#### 4.1D Reference implementation shape

Use reducer-style, deterministic front-end code so quiet-mode decisions stay inspectable in review and testable in automation. A TypeScript-style shape is sufficient:

```ts
export type PromotionLockReason =
  | 'none'
  | 'composing'
  | 'comparing'
  | 'confirming'
  | 'reading_delta';

export function deriveAttentionBudget(input: AttentionBudgetInput): AttentionBudget {
  const current = input.currentBudget;
  const rankedSignals = rankSignals(input.signals);
  const nextRegion = selectPromotedRegion({
    rankedSignals,
    currentRegion: current?.promotedSupportRegionRef ?? 'none',
    promotionLockReason: input.promotionLockReason,
    cooldownMs: current?.promotionCooldownMs ?? 1200,
    now: input.now,
  });

  return {
    ...current,
    clarityMode: input.requiresDiagnostic ? 'expanded' : 'essential',
    maxPromotedRegions: input.routeClass === 'quiet_patient' ? 0 : nextRegion.allowCompare ? 2 : 1,
    promotedSupportRegionRef: nextRegion.region,
    promotionLockReason: input.promotionLockReason,
    suppressionWindowMs: 2500,
    promotionCooldownMs: 1200,
    lastPromotionAt: nextRegion.changed ? input.now : current?.lastPromotionAt ?? input.now,
  };
}
```

#### 4.1E Surface posture algorithm

For every primary region on mount, refresh, settlement transition, or recovery entry:

1. Create or update one `ProjectionFreshnessEnvelope` for the current shell, region, selected anchor, and any active command-following scope from projection versions, causal tokens, continuity evidence, and transport state before status or CTA render occurs.
2. Create or update one `SurfacePostureFrame` bound to the current shell, continuity key, dominant question, dominant action, the governing freshness envelope, and any valid `SelectedAnchor`.
3. If the active entity is known and a last-stable snapshot exists:

   * keep `CasePulse`, the shared status strip, and the last-stable summary or anchor visible
   * set `postureState = loading_summary`, `stale_review`, `blocked_recovery`, or `read_only` as appropriate
   * explain why live truth is incomplete, stale, or blocked without clearing the primary region

4. If the entity is known but no stable snapshot exists yet:

   * render bounded skeletons inside the existing shell
   * keep shell chrome, route identity, and the primary-region question visible
   * do not replace the whole surface with a full-page loader

5. If the current projection resolves to no results:

   * choose `postureState = empty_actionable` when a safe next step exists
   * choose `postureState = empty_informational` when calm observation is the correct answer
   * preserve filter context, scope context, and any valid anchor rather than swapping in generic empty-state decoration

6. If a command is locally acknowledged but authoritative settlement is still pending:

   * set `postureState = settled_pending_confirmation`
   * preserve the initiating object, consequence summary, and recovery path in place
   * suppress detached success pages, celebratory banners, and history-stack churn

7. If transport disconnects or pauses while projection truth is still within budget, keep the last stable snapshot visible, render transport change through the shared status strip, and degrade the region only if the bound freshness envelope says actionability is no longer safe.
8. On narrow surfaces, fold the same `SurfacePostureFrame` into `mission_stack`; do not compute a second dominant question or competing CTA for mobile.
9. Bind automation and accessibility state from `SurfacePostureFrame.postureState`, `dominantQuestionRef`, `dominantActionRef`, and the current freshness envelope so loading, empty, stale, blocked, and pending states remain testable and screen-reader legible.

#### 4.2 Soft navigation algorithm

When navigating between adjacent views of the same entity:

1. Reuse the existing `PersistentShell`.

2. Preserve:

   * `CasePulse`
   * the shared status strip
   * `DecisionDock`
   * open `InlineSideStage` where still valid
   * open drawers where still valid
   * current `clarityMode`
   * scroll and focus where safe
   * selected option cards, chosen provider cards, active queue rows, and active comparison context where still valid

3. Update URL by client-side route transition only.

4. Replace or morph only the child work surface in `CaseSpine`.

5. Use `MotionIntentToken(intent = morph or handoff)` for the child surface.

6. Do not blank the whole screen.

7. Do not re-fetch unrelated projections if the current subscription is still valid.

8. Do not detach the user from the working set to inspect a closely related child object if that inspection can be satisfied by `InlineSideStage`.

9. Do not swap to a different shell for booking, messaging, hub, pharmacy, callback, or review work that still belongs to the same request continuity key.

#### 4.3 Projection delta classification algorithm

For each live delta from `ProjectionSubscription`:

1. Compute an impact profile:

   * `surfaceScope = local | regional | shell`
   * `focusImpact = none | soft | disruptive`
   * `anchorImpact = preserves_anchor | updates_anchor | invalidates_anchor`
   * `trustImpact = none | caution | blocking`
   * `macroStateImpact = none | secondary_axis_only | macro_state_change`
   * `routeImpact = none | child_surface_change | boundary_change`
   * `announcementPriority = silent | polite | assertive`

2. Map the impact profile to one of:

   * `non_disruptive`
   * `contextual`
   * `disruptive`

3. `non_disruptive` deltas:

   * patch immediately
   * use minimal `reveal` or `settle` motion
   * do not disturb the active anchor or focused region

4. `contextual` deltas:

   * patch non-focused areas immediately
   * mark changed sections with changed-since-seen cues
   * if the changed area is currently focused, buffer via `DeferredUIDelta`

5. `disruptive` deltas:

   * buffer if the user is editing, reading a selected case, comparing options, composing a reply, or in a decision-critical step
   * otherwise apply through a controlled `QueueChangeBatch` or explicit patch

6. If `anchorImpact = invalidates_anchor`:

   * keep the prior `SelectedAnchor` visible
   * mark it `invalidated`
   * preserve its label and spatial anchor where possible
   * surface nearest safe alternatives in context
   * do not silently remove the anchor from the user’s mental model

7. If `trustImpact = caution` or `trustImpact = blocking`:

   * update `EvidencePrism`
   * create a diff against the last acknowledged snapshot
   * update `CasePulse.stateAxes.trust`
   * update the shared status strip
   * update `DecisionDock` blockers or re-check messaging
   * let `CognitiveLoadGovernor` update `AttentionBudget` and auto-promote only the single hidden evidence or context region needed to resolve the blocker
   * demote other support regions to summary posture unless the user pinned them
   * mark the active review surface as `review_required` if policy requires a fresh human check

8. If `macroStateImpact = macro_state_change` and the continuity key is unchanged:

   * update `CasePulse`
   * append the change to `StateBraid`
   * update the shared status strip
   * keep the shell stable

9. Never force-scroll the viewport to the changed area.

10. Never discard local draft input because of remote updates.

11. Never silently replace a focused decision surface with an unacknowledged remote state.

12. Never mutate browser history or route solely because a live delta arrived.

13. When buffered deltas are waiting, expose a subtle count and summary in the shared status strip or local queue badge without breaking concentration.

14. Live announcements must be bounded and prioritized by `announcementPriority` through the current `AssistiveAnnouncementTruthProjection`; buffered or replayed deltas may emit at most one batch digest for the active surface and continuity frame.
15. When the reason for a temporary promotion clears, restore `lastQuietPostureRef` unless the user pinned a richer layout.

#### 4.4 Command and async transition algorithm

For any user action that changes state:

1. Classify the action as:

   * reversible local
   * externally consequential
   * policy-sensitive
   * freshness-sensitive
   * anchor-specific

2. If the action is irreversible, externally consequential, or policy-sensitive:

   * construct `ConsequencePreview`
   * disclose immediate effects, downstream effects, blockers, and fallback actions
   * disclose projected `macroState` and state-axis changes
   * require explicit confirm where policy says so

3. Create `TransitionEnvelope(localAckState = local_ack)` or `TransitionEnvelope(localAckState = queued)` if dispatch is intentionally deferred, using the schema and same-shell recovery policy declared by the active `AudienceSurfaceRouteContract`.

4. If the action is anchor-specific:

   * bind the envelope to the relevant `SelectedAnchor`
   * create the anchor if it does not already exist

5. Within the local acknowledgement budget:

   * apply bounded control-level or card-level acknowledgement
   * prefer low-amplitude button compression, label change, or card settle on the initiating element
   * do not show a generic full-screen spinner

6. If the action is safe for optimistic feedback:

   * apply bounded local visual acknowledgement
   * set `localAckState = optimistic_applied`

7. Send the command.

8. On server acceptance:

   * store returned `causalToken`
   * set `processingAcceptanceState = accepted_for_processing`
   * advance or create `UITransitionSettlementRecord(settlementState = accepted, authoritativeSource = not_yet_authoritative, authoritativeOutcomeState = pending)`
   * keep the user in the same shell

9. If further external completion is required:

   * set `processingAcceptanceState = awaiting_external_confirmation`
   * morph the affected anchor or action region into a provisional pending state
   * update the shared status strip
   * keep prior confirmed artifacts visible but clearly subordinate to pending truth

10. When the corresponding projection consumes the `causalToken` or an authoritative completion event arrives:

* set `externalObservationState = projection_visible` at minimum, or the richer observed state carried by the current `CommandSettlementRecord`
* write or supersede `UIProjectionVisibilityReceipt` with the visible projection version, shell-decision class, selected-anchor change class, continuity evidence, and governing visibility coverage row
* patch the UI in place
* append the result to `StateBraid`
* update `CasePulse`
* settle or release the relevant `SelectedAnchor` according to policy
* advance `UITransitionSettlementRecord` with the matching `projectionVisibilityRef`, `externalObservationState`, `authoritativeSource`, `authoritativeOutcomeState`, `settlementRevision`, and `auditRecordRef`
* if the current `CommandSettlementRecord.authoritativeOutcomeState = settled`, set `authoritativeOutcomeState = settled`

11. If returned projection truth materially conflicts with the optimistic or assumed path:

* set `authoritativeOutcomeState = review_required`
* keep the current context visible
* surface diff-first explanation
* block unsafe follow-up actions until the user re-checks

12. On failure, governed expiry, or loss of writable posture from release, channel, publication, or embedded-session drift:

* revert only the affected local region
* set `authoritativeOutcomeState = failed`, `reverted`, or `expired`
* set `externalObservationState = failed | expired` where the evidence chain supports that conclusion
* preserve shell and selected anchor context where possible
* expose the recovery action declared by `ReleaseRecoveryDisposition` or `RouteFreezeDisposition` in `DecisionDock`

13. Under no circumstance may async completion move the user to a visually unrelated page without an explicit entity change.

#### 4.5 Command-following read rule

For components marked `command_following`, define `t_warn = p95_command_following + delta_net`, `t_stale = p99_command_following + delta_net + delta_proj`, and `t_quiet = clamp(k_quiet * emaPatchInterarrivalMs(region), t_quiet_min, t_quiet_max)` from per-surface telemetry and use them to derive `quietEligibleAt` and `staleAfterAt` on authoritative settlement.

1. After a successful command, wait for a projection version that includes the relevant `causalToken`.

2. Until it arrives:

   * keep the old stable entity visible
   * show provisional transition state locally
   * set the bound `ProjectionFreshnessEnvelope(scope = command_following).projectionFreshnessState = updating` and `actionabilityState = guarded`
   * do not hard refresh

3. If the token has not arrived by `t_warn`, keep the shell stable but elevate the local transition to `pending`.

4. If the token has not arrived by `staleAfterAt` when present, otherwise by `t_stale`:

   * set the bound `ProjectionFreshnessEnvelope(scope = command_following).projectionFreshnessState = stale_review`
   * set `actionabilityState = frozen | recovery_only` according to the declared route recovery contract
   * show bounded fallback messaging
   * keep context intact

5. Destructive follow-up actions must remain blocked when required command-following freshness is absent; transport reconnect, cursor movement, or unrelated patch arrival may not clear that block.

6. If transport disconnects before the awaited token arrives, update `transportState = disconnected | reconnecting` on the same freshness envelope without clearing the stale-review or guarded truth posture.
7. If a conflicting authoritative state arrives before the awaited token, convert the transition to `review_required` or `failed`; do not silently settle.

8. Quiet return is legal only when the awaited token has arrived or a governed pending state has become authoritative, the bound freshness envelope has returned to `projectionFreshnessState = fresh | updating` with `actionabilityState = live | guarded`, the matching `UIProjectionVisibilityReceipt` exists, the required `AuditRecord` has been appended for that causal chain, `now >= quietEligibleAt`, and no blocker or recovery path remains.

#### 4.6 Focus and composition protection algorithm

If the user is:

* typing
* editing a draft
* composing a reply
* selecting a slot
* comparing hub candidates
* reviewing a focused case
* reading an audit trail or diff
* using keyboard navigation inside a queue
* examining evidence lineage or consequences

then disruptive projection deltas must be classified against the active protected region `r`:

* `impact(delta,r) = non_bufferable` when `delta` changes safety, identity, lease ownership or validity, lineage fence, route writability, or invalidates the selected candidate or current action with no safe equivalent
* `impact(delta,r) = review_required` when `delta` materially changes evidence or consequence in the protected region but can preserve context long enough for explicit re-check
* `impact(delta,r) = bufferable` otherwise

Apply `non_bufferable` deltas immediately in place and freeze mutating controls. Buffer `review_required` and `bufferable` deltas into `DeferredUIDelta` or `QueueChangeBatch` until:

* idle state is reached
* the draft is saved or submitted
* the comparison is closed
* the user explicitly applies updates

For every buffered delta set `flushDeadlineAt = min(bufferedAt + T_buffer_max[impactClass], nextKnownActionBoundaryAt)`; if the active protection contract, settlement envelope, or recovery contract yields an earlier concrete safe-settle boundary, that earlier time wins.

While buffered:

* show a subtle available-update indicator
* preserve current focus and selection
* preserve current queue position and active row
* preserve current draft text
* preserve current comparison anchors
* preserve the current `SelectedAnchor`

If buffered updates invalidate the current action, or if `now >= flushDeadlineAt` and the pending batch is not purely `bufferable`:

* mark the relevant region as `review_required`
* keep the current context visible until the user acknowledges the change
* land re-check emphasis on the changed region first, not on a generic page top

When the user explicitly applies updates, or when a purely `bufferable` batch reaches `flushDeadlineAt`:

* settle the active anchor region first
* then settle peripheral regions
* coalesce patches within `delta_batch_calm` so the user sees one calm settlement rather than jittery micro-refreshes
* do not reorder the entire shell before the focused region is stable
* once the focused region is stable and no blocker remains, restore the last quiet posture unless the user pinned a richer view

#### 4.7 Degraded and disconnected algorithm

On transient subscription loss or backend lag:

1. Keep the last stable UI state visible.
2. Change the shared status strip to `stale`, `disconnected`, or `paused` by updating `FreshnessChip` and `AmbientStateRibbon` together.
3. Disable only those actions that require fresh authoritative state.
4. Continue local draft capture where safe.
5. Keep `DecisionDock`, `CasePulse`, `StateBraid`, and any current `SelectedAnchor` visible.
6. Allow manual refresh or resume where appropriate without destroying shell context.
7. Resume live patching automatically when the connection recovers and health remains good for `T_resume_stable`; then apply queued deltas as one calm batch.
8. Do not clear the page or destroy the active shell.
9. Only on unrecoverable projection or schema divergence may the shell be replaced with a bounded recovery surface.

#### 4.8 Inline side-stage algorithm

When a user opens a related row, candidate, message, or compare target:

1. Open an `InlineSideStage` attached to the host surface.
2. Keep the originating working set visible.
3. Preserve keyboard focus order and return focus to the invoker on close.
4. Support compare mode for multiple related candidates where relevant.
5. Preserve draft or partially entered text within the side stage until explicit discard or commit.
6. Do not replace the whole entity shell for adjacent inspection or compare work unless a true entity switch is requested.
7. If the side-stage subject shares the same continuity key, inherit the shell and anchor-preservation rules.

#### 4.9 Evidence and diff algorithm

Whenever new material evidence enters an active case:

1. Classify it through `EvidenceLineageResolver`.

2. Insert it into `EvidencePrism` with source, freshness, and trust class.

3. Compute diff against the last acknowledged evidence snapshot.

4. Surface the changed regions first on reopen or resume flows.

5. If the new evidence conflicts with a previously confirmed fact:

   * keep the prior fact visible
   * mark the conflict explicitly
   * do not silently overwrite the prior fact

6. If a pending action depends on evidence that is now stale, conflicted, or superseded:

   * block unsafe commit
   * explain the reason in `DecisionDock`
   * mark the relevant review path as `review_required`

#### 4.10 Selected anchor lifecycle algorithm

When a user selects a slot, provider, pharmacy, queue row, comparison candidate, or equivalent focal object:

1. Create or update a `SelectedAnchor`.

2. Preserve the anchor’s `anchorTupleHash`, label, local position reference, and visual identity throughout validation and async work.

3. While the anchor is being validated or is awaiting external completion:

   * set `stabilityState = validating` or `pending`
   * morph the anchor in place
   * keep it visibly connected to the command that caused the transition
   * do not let a competing anchor or neighbor row take the primary anchor slot while the current tuple is still validating or pending

4. If the anchor becomes invalid:

   * set `stabilityState = invalidated`
   * keep the anchor visible
   * explain the invalidation in context
   * present nearest safe alternatives without removing the original anchor first or reusing its shell for a different tuple

5. Release or replace the anchor only when:

   * the transition settles with a confirmed replacement
   * the user explicitly dismisses it
   * a true entity switch occurs

6. If the anchor is referenced in a receipt, timeline event, or downstream status card, preserve lineage wording so the user can recognize the same object across states.

#### 4.11 Artifact rendering and handoff algorithm

On entry to an artifact-bearing route, inline artifact open, print or export request, or governed external handoff:

1. Resolve the active `ArtifactPresentationContract`, current `ArtifactSurfaceContext`, current `ArtifactModeTruthProjection`, visibility tier, summary safety tier, continuity key, channel profile, current parity state, and any required delivery or `OutboundNavigationGrant`. If the source object is a result, document, letter, attachment, or other patient record artifact, also resolve the current `RecordArtifactParityWitness`.
2. Create or update one `ArtifactSurfaceFrame` bound to the current shell, source artifact ref and hash, summary version, source-authority state, parity state, current `truthTupleHash`, and return target.
3. Render in this order:

   * source label, freshness, and trust or parity state
   * structured summary or governed placeholder
   * inline preview only when `ArtifactModeTruthProjection.currentSafeMode = governed_preview`
   * secondary delivery actions in overflow or subordinate controls only

4. If `ArtifactModeTruthProjection.previewTruthState = preview_provisional | preview_blocked`, if `sourceParityState = provisional`, `stale`, or `blocked`, or if a required `RecordArtifactParityWitness.recordGateState != visible`:

   * keep the summary visible
   * annotate the provisional, blocked, or constrained-channel state explicitly
   * label the source artifact as the authoritative record and any structured summary as verified, provisional, or source-only according to the current parity tuple
   * freeze preview, print, export, or handoff actions that require verified parity or a richer `currentSafeMode`
   * promote `ArtifactFallbackDisposition` whenever byte delivery, print, or handoff is no longer lawful for the current tuple

5. Download, print, export, and external handoff may execute only through the resolved grants and only while `ArtifactModeTruthProjection.byteDeliveryTruthState | printTruthState | handoffTruthState` still authorize the requested mode for the same continuity, scope, route lineage, session posture, and selected anchor.
6. Constrained or embedded channels may not attempt unsupported print, oversized byte delivery, or browser-only preview. If `ArtifactModeTruthProjection.currentSafeMode = structured_summary | secure_send_later | placeholder_only | recovery_only`, the shell must keep the last safe summary visible and route the user through that bounded mode instead of probing browser behavior opportunistically.
7. Grant expiry, byte-grant supersession, masking-scope drift, parity failure, bridge-capability drift, or stale return posture must return the surface to in-place recovery with the last safe summary still visible; raw artifact URLs, detached print pages, and detached download-success pages are forbidden.
8. When the artifact closes or a handoff returns, restore focus to the initiating anchor or the stable return target recorded in `ArtifactSurfaceFrame.returnTargetRef` only after the current `ArtifactModeTruthProjection.returnTruthState = anchor_bound | return_pending` and any linked `ArtifactTransferSettlement.authoritativeTransferState` has settled to a lawful return or recovery posture.

### 5. Patient lifecycle experience algorithm

#### 5.1 Patient macro-state mapping

All patient-visible request surfaces must map internal state into one of:

* `drafting`
* `received`
* `in_review`
* `we_need_you`
* `choose_or_confirm`
* `action_in_progress`
* `reviewing_next_steps`
* `completed`
* `urgent_action`

Rules:

1. `CasePulse.macroState` is the single top-level state language for patients.
2. Booking, hub, pharmacy, callback, and messaging states must map into this same set.
3. Detailed internal state may appear in timeline entries, but must not contradict the top-level macro state.
4. Patient wording must be calm, explicit, and consequence-aware.
5. `received`, `in_review`, `action_in_progress`, and `reviewing_next_steps` must remain living shells with visible last meaningful update, next expected step, and freshness state; they must not collapse into dead status pages.
6. `stateAxes` may provide secondary cues for urgency, trust, ownership, and interaction posture, but must remain subordinate to the shared patient macro state.
7. Patient shells must foreground one next step and one current status at a time; secondary detail belongs in progressive disclosure.

#### 5.2 Intake and draft algorithm

During intake:

1. Render the draft in one continuous shell.

2. On mobile and narrow surfaces, use `mission_stack`.

3. Form progression must behave like a structured interview, not a paperwork dump.

4. Patient and public flows should default to one question or one tightly related decision at a time unless repeat-use evidence shows that a merged step is faster and clearer.

5. Conditional questions must reveal in place from the control or section that triggered them.

6. Autosave must update the shared status strip as:

   * `saving`
   * `saved`
   * `failed`

7. On autosave success:

   * use `MotionIntentToken(intent = settle, timingBand = instant or standard)`
   * do not show disruptive toast if the save is routine

8. Attachment upload must remain inside the same shell as a persistent tray or panel.

9. If a sync conflict occurs:

   * keep the current draft visible
   * show a bounded merge or review layer
   * never dump the user to a generic error page

10. Field-level validation, upload retry, and partial save failure must remain local to the affected region and must not reset scroll.

11. Bounded help, hints, or supporting detail should open in side stages, drawers, or in-place reveals rather than full navigation.

12. Inline summaries, previous answers, and saved details should support recognition over recall and must not duplicate the full form unless the user requests review mode.
13. In `clarityMode = essential`, only the current question, one short rationale or help region, and one next action may be expanded at once; additional explanation must replace the current helper region rather than stack beneath it.

#### 5.3 Submission to receipt morph algorithm

On successful submission:

1. Do not navigate to an unrelated receipt page with a blank reset.
2. Transform the draft review surface into the receipt surface in place.
3. Preserve the summary of what was just submitted, including attachment references where relevant.
4. Append a receipt event to `StateBraid`.
5. Update `CasePulse.macroState` to `received` or `in_review`.
6. Surface next steps immediately in the same shell.
7. If downstream triage status or acknowledgement arrives shortly after submit, patch the current shell in place; do not perform a second page transition solely to show that change.

#### 5.4 Claim, secure-link, and embedded access algorithm

When access scope changes because of sign-in, claim, verified continuation, or embedded deep link:

1. Preserve the current shell and active request where possible.
2. Resolve or refresh the active `RouteIntentBinding`, `PatientShellConsistencyProjection`, and `AudienceSurfaceRuntimeBinding` against current session, grant family, subject binding, continuity key, and exact publication parity before writable posture is exposed.
3. If the route is embedded or channel-specific, validate trusted context and `PatientEmbeddedSessionProjection`, including `manifestVersionRef`, `ReleaseApprovalFreeze`, `ChannelReleaseFreezeRecord`, route-level `minimumBridgeCapabilitiesRef`, and current publication posture before revealing mutating affordances.
4. Keep the same `CasePulse`.
5. Reveal newly authorized sections progressively only after verification succeeds and the current route intent, shell-consistency projection, and surface publication state remain valid.
6. Do not reveal patient-linked detail before the relevant access grant or challenge completes.
7. If embedded compatibility, publication state, release freeze, or channel state fails, preserve continuity but downgrade through the active `RouteFreezeDisposition` or `ReleaseRecoveryDisposition` to supported browser handoff, read-only posture, placeholder, or governed recovery in the same shell.
8. Use a `reveal` or `morph` semantic transition, not a disruptive redirect, unless a true auth boundary requires shell replacement.
9. If the continuity key is unchanged, do not reset the request, receipt, or active conversation thread.

#### 5.4A Patient degraded-mode resolution algorithm

On patient route entry, section switch, step-up return, secure-link redemption, embedded bridge return, command settlement, artifact return, continuity-evidence refresh, or release or channel drift:

1. resolve the current `PatientShellConsistencyProjection`, `PatientPortalEntryProjection`, and any applicable `PatientExperienceContinuityEvidenceProjection`, `AudienceSurfaceRuntimeBinding`, `ReleaseRecoveryDisposition`, `RouteFreezeDisposition`, `PatientEmbeddedSessionProjection`, active `PatientActionRecoveryProjection`, active `PatientIdentityHoldProjection`, current `WritableEligibilityFence`, and active `ArtifactFallbackDisposition`
2. synthesize one `PatientDegradedModeProjection` for the current route family and section before calm copy, success tone, or live CTA renders. `PatientPortalEntryProjection.entryState`, `PatientSectionSurfaceState.surfaceState`, and any patient artifact delivery or embedded error surface must derive from the same `currentMode` rather than recomputing local degraded posture
3. if `currentMode = live`, the shell may expose ordinary route-local actionability. If `currentMode = pending`, preserve the last safe summary and selected anchor, show authoritative pending or refresh guidance, and suppress fresh mutation or final reassurance
4. if `currentMode = read_only | placeholder_only | bounded_recovery | safe_browser_handoff | identity_hold`, keep the same section, active card, request, thread, record, appointment, or artifact anchor visible where policy allows, withdraw stale writable controls, and render exactly one governed next safe action or explanation path from the projection
5. artifact preview, download, print, and handoff may not remain richer than the current patient degraded mode. When `modeReason = artifact_fallback | embedded_mismatch | release_or_publication_mismatch`, the shell must keep the last safe artifact summary or placeholder in place and reopen through governed fallback rather than detached transfer or generic failure
6. if a fresher tuple arrives that changes `currentMode` or `truthTupleHash`, morph the current shell in place, preserve the last safe summary until the new summary is proven, and treat any previously rendered live CTA as withdrawn until the new projection settles

#### 5.5 Unified care conversation algorithm

For every patient request:

1. Render one `ConversationThreadProjection`.

2. The thread must unify:

   * clinician messages
   * follow-up questions
   * callback expectations and outcomes
   * reminder notices and callback fallback
   * patient replies
   * actionable instructions linked to the same request

3. The current required action must be pinned above or within the thread.

4. Show the latest relevant items first in quiet mode, with full history available on demand.

5. New thread items and typed subthread state changes must insert in place through `CommunicationEnvelope` with changed-since-seen markers.

6. Reply submission must remain in the same shell and create a `TransitionEnvelope`.

7. If the reply returns the case to review, the UI must morph to `in_review` without page reload.

8. Callback prompts, reminder failures, more-info questions, and instruction acknowledgements must not fork to unrelated pages or disconnected mini-flows for the same request.
9. In `clarityMode = essential`, keep either the current required action composer or the latest relevant history cluster expanded, not both; older history stays collapsed until requested.

#### 5.5A Patient record and results visualization algorithm

1. Patient record routes must open inside the signed-in patient shell with the same primary navigation and the same quiet posture as requests, appointments, and messages.
2. The record overview must foreground latest changes, action-needed items, and last-updated metadata before full chronology.
3. Each result detail must render a patient-safe title, plain-language summary, measured value and range, trend or comparison, next step, and source metadata in that order.
4. Charts are optional compare surfaces only; one `VisualizationFallbackContract`, one `VisualizationTableContract`, and one current `VisualizationParityProjection` are required, and the visual, summary, and table views must agree on row set, units, comparison meaning, current selection, and freshness posture.
4A. Any record route that renders a structured summary plus source bytes must also resolve one current `RecordArtifactParityWitness`; overview, detail, document summary, attachment view, preview stage, and download or handoff affordance may not mix summary, source, redaction, release, or step-up posture from different witnesses.
5. When detail is sensitivity-gated, explain why, preserve shell context, and surface the safest next action instead of a blank or generic access-denied state.
6. Documents and letters must resolve through `ArtifactPresentationContract`; when the contract permits, prefer structured in-browser rendering and reserve byte delivery or external exit as secondary behaviour.
7. Any overlay, browser, or cross-app handoff from a record, result, letter, or attachment route must consume a short-lived `OutboundNavigationGrant` bound to the current route lineage, manifest or session posture, and safe return contract rather than launching a raw URL.
8. In `clarityMode = essential`, expand one record card, one result detail, or one document summary at a time; technical detail stays behind a clearly labeled disclosure.
9. Record routes linked to an active request, appointment, or message thread must preserve lineage links and return paths without changing the owning shell unless the canonical entity changes.
10. If release, visibility, or freshness posture degrades below parity-safe detail, the same result anchor must remain visible but the visualization must degrade in place to `table_only`, `summary_only`, or governed placeholder posture; a chart may not continue implying trend or comparison meaning that the current table or summary cannot lawfully reproduce.

#### 5.6 Booking, waitlist, hub, and pharmacy continuity algorithm

1. Booking, waitlist, hub alternatives, and pharmacy progression for the same request must reuse the same request shell.

2. Selected option cards must persist through `SelectedAnchor`.

3. The default booking and routing surface should be a calm ranked list or table. Spatial views such as booking orbit or network lattice are optional compare modes and must have an accessible list or table fallback.

4. Slot selection, confirmation, alternative selection, or pharmacy choice may have distinct route contracts, but they must render as adjacent child states inside the same shell and expand inline or in a bounded sheet or drawer rather than resetting the page.

5. Confirmation pending must render as a provisional in-place state on the selected card.

6. If no true hold exists:

   * do not show hold countdown
   * do not imply exclusivity

7. Waitlist and hub offers must reuse the same action language and card grammar as booking.
7A. When the current `WaitlistContinuationTruthProjection` changes from `waiting_for_offer | offer_available` to callback, hub, or expired fallback posture, the same selected card or preference summary must stay visible, but the dominant action must switch to that governed fallback path in place.

8. Pharmacy instructions and status must keep the chosen provider card visually persistent.

9. If a selected option becomes invalidated, keep it visible, mark it invalidated, and present nearest safe alternatives in context without losing the request shell.
10. In `clarityMode = essential`, only one candidate detail or compare surface may be expanded at a time; opening another must collapse the previous one unless the user explicitly enters compare mode.

#### 5.7 Reopen and bounce-back algorithm

When a request reopens or a downstream path returns work:

1. Keep prior confirmed artifacts visible but visually superseded.
2. Change `CasePulse.macroState` to `reviewing_next_steps` or `urgent_action` as appropriate.
3. Insert the return event into `StateBraid`.
4. Surface the new next action in the existing `DecisionDock`.
5. Use `MotionIntentToken(intent = reopen)` to signal reversal without disorientation.
6. Land the user on the changed evidence, changed instructions, or changed options first rather than forcing a full re-read.
7. If reopening was triggered by new external information or a conflicting confirmation, present a diff-first summary before expanding the full history.

### 6. Staff, hub, support, and operations experience algorithm

#### 6.1 Staff queue algorithm

For active worklists:

1. `QueueLens` is the default queue surface; simple table rendering is a fallback mode, not the only mode.

2. The selected row or card must remain pinned while open.

3. New work must enter through `QueueChangeBatch`, and queue plus active-task truth must assemble beneath `StaffWorkspaceConsistencyProjection` and `WorkspaceSliceTrustProjection`.
3A. `QueueLens`, task canvas, interruption digest, `DecisionDock`, and next-task affordances must also resolve through one current `WorkspaceTrustEnvelope`; local row state, cached preview, or detached trust badges may not independently keep any of those surfaces calm or writable.

4. Priority changes for the focused item must appear as local signals, not forced list jumps.

5. Background items may reorder only when:

   * the user is idle
   * the user applies queued updates
   * the queue is not in active focused use

6. Keyboard position and focus must be preserved.

7. Bulk action controls must remain stable while the queue updates.

8. Queue surfaces may enter buffered or paused mode while the user is reading, typing, or deciding; queued changes must remain visible as a count and summary without displacing the current item.

9. Opening a case must not destroy or forget the current working set, and it must mint `ReviewActionLease` from the current queue batch, selected anchor, and review version so stale queue or lineage drift fails closed before mutation.
9A. Opening a case must also refresh or create the current `WorkspaceTrustEnvelope` from the same queue snapshot, consistency tuple, trust tuple, action lease, selected-anchor tuple, and publication tuple; if any of those cannot be proven, the shell must open in observe-only or recovery posture rather than optimistic review mode.

10. Queue scan must progress through `QueueScanSession = scanning -> preview_peek -> preview_pinned -> task_open`; preview must render through `QueuePreviewDigest`, remain read-only, and may not mint `ReviewActionLease` or clear changed-since-seen state.

10A. Summary-first preview and background next-task prefetch may warm only decisive summary, blockers, ownership, and next-action context bound to the active `QueueRankSnapshot`; attachment media, full chronology, compose state, and irreversible action scaffolding must wait for explicit task-open.

10B. If fast scan cancel, queued re-rank, focus protection, settlement drift, or continuity-evidence drift occurs, cancel any active `NextTaskPrefetchWindow`, keep the current row or task pinned, and surface exact blocking or stale reasons instead of silently swapping the warmed candidate set.
10C. When focus protection, trust downgrade, stale ownership, or settlement drift is active, `WorkspaceTrustEnvelope.interruptionPacingState` must remain `buffered | blocking_only | recovery_only`; non-blocking queue reorders, anomaly promotions, and assistive promotions may not seize the primary region until the envelope re-enters interactive pacing.
10D. Assistive summary stubs, rails, provenance panes, confidence chips, insert actions, regenerate actions, and completion-adjacent cues must also resolve through one current `AssistiveCapabilityTrustEnvelope`; a live run settlement, watch tuple, or local freeze badge may not independently restore interactive, confidence-bearing, or action-ready posture after publication, shell-truth, continuity, or insertion-target drift.

11. `QueueRowPresentationContract` must keep queue rows in a stable two-line scan posture; tertiary detail, large evidence snippets, and heavyweight attachment affordances belong in preview or the task canvas, not the resting row.

12. When a case is active, demote secondary queue summaries, charts, and board widgets to a slim index or collapsed stubs; the review canvas must remain the dominant surface.

#### 6.2 Case review algorithm

On opening a case:

1. Keep queue, review canvas, and decision surface within one stable shell.

2. Default to `two_plane` composition:

   * context and patient or request summary in the main review canvas
   * `DecisionDock`

3. Render the main reading surface through one `TaskCanvasFrame(summaryStackRef -> deltaStackRef -> evidenceStackRef -> consequenceStackRef -> referenceStackRef)`; resumed review must open on the changed decision surface before full history.

4. Reveal `EvidencePrism` as a summary by default and expand it only when conflict, staleness, blocker state, or explicit reviewer intent requires deeper inspection.

4A. If materially changed evidence exists since `EvidencePrism.lastAcknowledgedSnapshotRef`, materialize one authoritative `EvidenceDeltaPacket`, bind it to `deltaStackRef` and `EvidencePrism.authoritativeDeltaPacketRef`, and render that packet before expanding chronology or reference detail.

5. New evidence must land through `EvidenceDeltaPacket` and remain highlighted in place wherever possible.

6. If a case reopens with new material:

   * default to diff-first presentation
   * do not force full case re-reading without highlighting changes

7. Assistive suggestions must appear in a supplementary rail or drawer and must not reflow the primary content unexpectedly.

8. Any material change to evidence, endpoint, approval state, or merge lineage must invalidate stale decision assumptions, require explicit re-check before commit, and revalidate the current `ReviewActionLease` before any advice, message, or admin-resolution mutation is dispatched.

8A. Consequence-bearing review actions must bind one current `DecisionEpoch`. If evidence, selected anchor, review version, ownership epoch, trust posture, publication tuple, duplicate lineage, or approval burden drifts materially, the platform must supersede that epoch, append one replayable `DecisionSupersessionRecord`, and fail closed before any new direct resolution, escalation, booking seed, pharmacy seed, self-care issue, or admin-resolution completion may launch.

9. If endpoint, ownership, or merge lineage changes while a review is open, keep the prior judgment context visible with explicit supersession markers rather than silently replacing it.

9A. Prior endpoint assumptions, approval posture, ownership context, and duplicate-lineage interpretation must remain visible as superseded context until the reviewer acknowledges the delta packet and recommits or dismisses the stale path through governed recovery.

10. While the reviewer is composing, comparing, confirming, reading a highlighted delta, or working a delivery or dependency dispute, create `WorkspaceFocusProtectionLease` plus one `ProtectedCompositionState` bound to the current `ReviewActionLease`, selected anchor, any compare anchors, current reading target, and quiet-return target; disruptive queue, evidence, or assistive deltas must buffer until the protected action settles or the reviewer explicitly releases focus.

10A. If ownership, lineage fence, review version, publication, trust, settlement, selected-anchor validity, or compare-target validity drifts while protection is active, mark `WorkspaceFocusProtectionLease.leaseState = invalidated`, freeze mutating controls in place, and keep the protected draft, compare target, insertion point, and superseded judgment context visible as `stale_recoverable | recovery_only` posture rather than replacing the task canvas or retargeting the active editor.

10B. Release of protected work must satisfy `ProtectedCompositionState.releaseGateRef`; once release succeeds and no blocker remains, restore the prior quiet posture, selected anchor, and primary reading target instead of a generic task reset or neighbor substitution.

11. `EvidenceDeltaPacket.deltaClass = decisive | consequential` may invalidate commit posture and force explicit re-check; `contextual | clerical` may annotate in place without stealing focus or collapsing the canvas.

12. `WorkspaceProminenceDecision` is the only contract allowed to auto-promote `EvidencePrism`, `StateBraid`, approval review, handoff review, duplicate compare, or assistive review; routine review may auto-promote only one support region at a time.

12A. `WorkspaceProminenceDecision` must carry the last quiet support region and the current authoritative delta source; when conflict, compare, or blocker posture resolves, promoted detail must demote back to the stored quiet posture unless the reviewer pinned the richer region.

13. Approval, consequence preview, and handoff baton must remain in-shell through `ApprovalReviewFrame`, `DecisionCommitEnvelope`, and `OperatorHandoffFrame`; detached approval pages, success pages, or handoff popouts are forbidden.

14. Case closure, downstream handoff, and next-task launch may proceed only after `DecisionCommitEnvelope` and `TaskCompletionSettlementEnvelope` reflect authoritative downstream settlement or governed recovery; local success is not sufficient to collapse the current task.

14A. The next-task CTA must stay in one stable location and expose exact blocking reasons until `TaskCompletionSettlementEnvelope.nextTaskLaunchState = ready`; pending settlement, stale queue snapshot, blocked continuity evidence, or superseded candidates must disable launch in place rather than auto-advancing or hiding the control.

14B. Explicit operator launch is the only legal transition into the next task. When that launch succeeds, preserve a short-lived return stub for the departing task until the new task reaches stable shell posture; stale or blocked launch must leave the operator in the current shell with bounded recovery.

15. In routine review, `EvidencePrism`, `StateBraid`, `ContextConstellation`, and assistive suggestions may not all remain fully expanded together; `AttentionBudget` must promote only the single support region most relevant to the current decision.

16. When a conflict, blocker, or compare posture resolves, the review shell must return to the last quiet posture unless the reviewer explicitly pinned more detail.

#### 6.3 Booking and network comparison algorithm

For booking and network decision surfaces:

1. Start with a ranked list or table. Spatial comparison views may be used for slots, candidates, or routes, but must always have an accessible fallback representation and may not be the only first view.

2. The selected candidate must remain visually persistent through validation, provisional pending, and confirmation.

3. Constraint changes must reshape the visible option field without losing the selected anchor where still valid.

4. Alternatives should remain visible before the current route fully fails, when policy allows.

5. If a chosen option becomes invalid during review:

   * keep it visible
   * mark it invalidated
   * present nearest safe alternatives in context

6. Any booking, network, or downstream comparison surface launched from triage must bind the current source `DecisionEpoch`. If that epoch is superseded while options are visible, the selected candidate may remain visible as invalidated provenance, but confirm, dispatch, or route-commit controls must freeze immediately and require bounded in-shell recovery.
7. Comparison surfaces may patch non-focused candidates live but must buffer changes that would reflow the selected candidate under pointer or keyboard focus.
8. In `clarityMode = essential`, only one candidate detail or comparison side stage may be expanded automatically; multi-candidate compare is an explicit mode, not the resting state.

#### 6.4 Hub and pharmacy desk algorithm

For hub and pharmacy operational surfaces:

1. Ranking changes must use low-amplitude, non-jarring motion.
2. Time-sensitive states must be represented through ambient urgency cues, not flashing or aggressive motion.
3. Practice acknowledgement pending, dispatch pending, or confirmation pending must remain local to the active card or pane.
4. Returning work must reopen in the same shell with clear diff and status cues.
5. Chain-of-custody or acknowledgement events must enter `StateBraid` rather than disappear into detached logs.
6. Chosen practice, provider, or pharmacy cards must persist as `SelectedAnchor` objects through pending, invalidation, failure, and settlement.
7. Hub and pharmacy cards created from triage handoff must also carry the source `DecisionEpoch` and latest supersession truth; if the source epoch is later superseded or reopened, the desk must freeze stale fulfillment actions in place, show the supersession reason, and route work back through governed recovery instead of acting on the old handoff.

#### 6.5 Support and replay algorithm

For support and investigation surfaces:

1. Default to `two_plane` composition with queue or workboard context on one side and the active `SupportTicket` mission frame in the main plane.
2. The mission frame must unify ticket summary, one current `SupportLineageBinding`, omnichannel timeline, and one active response or recovery form without route-breaking context switches.
3. `SupportSubject360Projection`, `SupportKnowledgeStackProjection`, policy notes, and replay controls must enter as summary cards, tabs, or quiet chips by default; `AttentionBudget` may auto-promote only one of them at a time.
4. In `clarityMode = essential`, keep either the active composer or recovery form, or the latest unresolved history cluster expanded; older history stays collapsed until requested.
5. Switching from conversation to recovery, escalation, or resolution must preserve draft state, scroll position, and the selected message or event anchor.
6. Knowledge-base articles, macros, and playbooks must open inline or in a bounded side stage with freshness and applicability cues; they must not navigate the agent away from the ticket.
7. The promoted knowledge region must be backed by a live `SupportKnowledgeStackProjection` and `SupportKnowledgeBinding`; if ticket version, selected anchor, policy version, mask scope, or runtime publication drifts, the rail must degrade in place to summary-only, observe-only, or refresh-required posture instead of leaving stale guidance armed.
8. Macro apply, playbook launch, fallback-channel suggestion launch, and `knowledge_gap` capture must require a live `SupportKnowledgeAssistLease`; if the action changes the active response or recovery path, it must settle through `SupportActionRecord`, `SupportActionSettlement`, and the active `TransitionEnvelope`.
9. Any reveal from summary into deeper history, linked-object detail, or break-glass-supported subject context must create a reason-coded `SupportContextDisclosureRecord`; expiry or revocation must collapse that reveal back into governed summary without ejecting the agent from the ticket.
10. Replay and timeline inspection must occur within a stable shell.
11. Live updates must be pausable.
12. Pausing live updates must preserve current context while new events queue in the background.
13. Resuming live updates must apply queued changes in an ordered, reviewable way.
13A. Replay exit, observe return, and support deep-link restore must revalidate the current replay checkpoint or observe session, selected anchor, mask scope, current `SupportLineageBinding`, actionable scope member, held-draft disposition, and latest settlement chain before any live control re-arms.
14. Support actions such as link reissue, communication replay, attachment recovery, identity correction, or access review must open in bounded side panels or drawers, not context-destroying page swaps.
12. Replay surfaces must provide event grouping, diff markers, explicit freshness state, and a clear return-to-ticket control.
13. Re-entering the queue from an active ticket must restore the previous working set, filter state, and keyboard position.

#### 6.6 Operations board algorithm

For real-time operational boards:

1. Tiles, tables, and strip metrics must update in place and retain stable object identity.
2. Operations shells must default to `two_plane` composition with a dominant anomaly field in the main plane and a persistent `InterventionWorkbench` in the secondary plane.
3. `three_plane` is allowed only for explicit compare, incident-command, or deep diagnostic work; it may not be the resting state of `/ops/overview`.
4. `NorthStarBand`, `BottleneckRadar`, `CapacityAllocator`, `ServiceHealthGrid`, `CohortImpactMatrix`, and `InterventionWorkbench` are the canonical overview surfaces; no operations landing page may substitute a wall of unrelated charts for that structure.
5. One current `OpsBoardPosture` plus one `OpsProminenceDecision` must decide `dominantQuestionRef`, `dominantActionRef`, promoted surface, and secondary summaries for the shell; individual tiles may request elevation but may not self-promote.
6. Only one board region may hold escalated visual priority at a time; `BottleneckRadar` owns dominant visual weight while `InterventionWorkbench` owns dominant action weight, and `ServiceHealthGrid` or `CohortImpactMatrix` may expand beyond summary posture only when the same decision promotes them or the operator explicitly pins compare or diagnostic context.
7. Operators must be able to pause live updates during diagnosis, planning, or incident command.
8. Active hover, keyboard focus, compare, compose, or investigation on an operations surface must mint one `OpsFocusProtectionFence`; while the fence is active, resorting, dominant-region swaps, auto-expand or collapse, and highlight transfer must freeze and live deltas must patch in place or buffer into queued summaries.
9. Threshold-cross promotion and demotion must use `OpsEscalationCooldownWindow` with explicit entry and exit criteria so borderline anomalies cannot thrash the board.
10. Staleness must be visible at shell, board, and component level.
11. Critical threshold breaches may elevate presentation tone, but must not hijack the user’s viewport.
12. Resource reallocation proposals must present current state, projected relief, confidence, and policy guardrails before commit.
13. Drill-in from the board must open an `InvestigationDrawer` or continuity-preserving split view and must serialize an `OpsReturnToken` so the operator can return without losing filters, scroll, selected anomaly, or horizon.
13A. `ServiceHealthGrid`, health drill paths, health action posture, and calm stable-service posture must resolve one current `EssentialFunctionHealthEnvelope` per essential function in scope; no health surface may appear healthier, calmer, or more actionable than the bound envelope.
13B. Time-bounded fallback, constrained mitigation, active channel freeze, degraded trust, or recovery-only posture for an essential function must render directly in the affected health cell and in stable-service watch posture; hidden side panels, tooltip-only warnings, or decorative green summaries are invalid.
13C. `NorthStarBand`, `BottleneckRadar`, `CapacityAllocator`, `ServiceHealthGrid`, and `CohortImpactMatrix` must each bind one `VisualizationFallbackContract`, one `VisualizationTableContract`, and one current `VisualizationParityProjection`; heat cells, trend strips, confidence bands, and matrices may not carry severity, ranking, comparison direction, or selection meaning that the summary and table fallback cannot reproduce from the same parity tuple.
13D. If freshness, masking, release, or trust posture degrades, the board must keep the last safe summary and selected scope visible but downgrade the affected surface to `table_only`, `summary_only`, or placeholder posture with timestamps and next safe action; chart or heat intensity alone may not imply live authority.
13E. Continuity-rooted operational questions must materialize one current `ContinuityControlHealthProjection` and one current `OpsContinuityEvidenceSlice` from the same assurance spine before the board implies explanation, calmness, or mitigation readiness. Queue age, delivery lag, backlog, or freshness may remain visible as symptoms, but they may not substitute for the named settlement, continuation, or restore chain governing the affected shell.
13F. Opening a continuity-rooted drill path must mint one `InvestigationDrawerSession` against the preserved `OpsBoardStateSnapshot`, exact `continuityQuestionHash`, exact `continuitySetHash`, and required `AssuranceSliceTrustRecord` rows. Fresher proof may add drift or supersession markers, but it may not silently rebase the active diagnostic question.
14. Promoted anomalies, intervention targets, and health nodes must hold explicit selection leases bound to the current board snapshot tuple; when the tuple, trust posture, release posture, or governing prominence inputs drift, actions degrade in place to `stale_reacquire`, `observe_only`, or read-only recovery rather than silently retargeting a live CTA.
15. Paused-live, compare, diagnostic, and incident-command modes must open a delta gate against a preserved board basis; queued deltas may inform diagnostics, but they may not re-arm commit-ready controls or trigger a new dominant surface until the gate resolves to deterministic apply or explicit reacquire.
15A. If the current `InvestigationDrawerSession` for a continuity-rooted question reports `deltaState = drifted | superseded | blocked`, or if its preserved `continuityQuestionHash`, `continuitySetHash`, or required trust rows no longer match the active board, `InterventionWorkbench` and any live operations control must fall to `observe_only`, `stale_reacquire`, or governed handoff posture immediately.
16. Batched board changes must animate as grouped settlement through `OpsMotionEnvelope`; `changeCause` must distinguish live delta, threshold cross, batch apply, route morph, restore, degraded mode, and manual pin, and reduced-motion equivalents must preserve the same causal meaning.
17. High-churn metrics must favor calm value morphs or number updates over repeated resorting that breaks scanability.
18. Launching from an operations board into a request, incident, audit trace, queue entity, or specialist workspace must preserve originating board context and support one-step return, but return may restore writable posture only after the current board tuple, route intent, selection lease, trust-freeze verdict, and governing prominence inputs revalidate.
19. Full operations-console interaction, hierarchy, and drill-down rules are defined in `operations-console-frontend-blueprint.md`.

### 7. Canonical motion, accessibility, and verification system

High-priority motion-system defects in this layer:

1. motion intents overload action submission and authoritative settlement under `commit`, so invalidation, recovery, and settlement cues can collapse into one ambiguous animation
2. region-level motion competition is under-specified, so shell, card, ribbon, and local-control motion can still animate at the same time without one authoritative winner
3. timing bands are ranges only; there is no deterministic duration, delay, easing, or amplitude model to keep controls, cards, queues, and shell strips aligned
4. reduced-motion rules cover visual simplification, but not explicit keyboard, screen-reader, and sequencing equivalence
5. the system does not yet define degraded-performance fallback when churn, low power, or frame instability make semantic motion unsafe
6. verification is implied, but the motion layer does not yet produce deterministic traces that tests can assert against

Add the supporting motion and verification contracts:

**MotionCueEnvelope**
`motionCueEnvelopeId`, `continuityKey`, `motionIntent`, `causalToken`, `targetAnchorRef`, `targetRegionRef`, `targetScope = initiating_control | selected_anchor | local_region | shell_status_strip | recovery_region`, `settlementPhase = local_ack | provisional | authoritative | invalidated | recovered | superseded | resolved`, `delayMs`, `durationMs`, `easingTokenRef`, `amplitudePx`, `staticEquivalentRef`, `suppressionState = active | merged | deferred | static_only | cancelled`, `createdAt`

`MotionCueEnvelope` is the source of truth for visible motion. Every animation, emphasis pulse, or static degraded equivalent must derive from one cue envelope that knows what changed, where it changed, and whether the change is local acknowledgement, provisional truth, authoritative truth, invalidation, or recovery.

**MotionRegionArbitration**
`motionRegionArbitrationId`, `continuityKey`, `targetRegionRef`, `candidateCueRefs[]`, `dominantCueRef`, `mergedCueRefs[]`, `deferredCueRefs[]`, `staticCueRefs[]`, `arbitrationWindowMs`, `dominantUntilAt`, `decisionReasonRef`, `decidedAt`

`MotionRegionArbitration` prevents motion pile-up. A region may have many candidate updates, but only one dominant cue may animate at full emphasis at a time; the others must merge, defer, or settle statically according to policy.

**ReducedMotionProfile**
`reducedMotionProfileId`, `profileState = full | reduced | minimal | static_only`, `triggerClassRefs[] = user_preference | low_power | low_frame_stability | live_churn | assistive_context`, `maxAnimatedRegions`, `maxTransformPx`, `maxScaleDelta`, `maxOpacityDelta`, `loopAllowanceState = never | determinate_only`, `keyboardSequencingMode`, `screenReaderAnnouncementMode`, `staticEquivalentPolicyRef`, `effectiveUntil`

`ReducedMotionProfile` makes accessibility and runtime degradation explicit. It is the runtime clamp over the active design-token `motionMode`. Reducing motion must not alter the causal order of announcements, focus movement, or interaction readiness, and users must still understand provisional, authoritative, invalidated, recovered, and failed states without perceiving animation.

**AccessibilityEquivalenceCheck**
`accessibilityEquivalenceCheckId`, `motionCueRef`, `focusPathRef`, `announcementSequenceRef`, `nonVisualOutcomeRef`, `equivalenceState = verified | degraded | blocked`, `checkedAt`

`AccessibilityEquivalenceCheck` proves that non-visual and reduced-motion users receive the same operational meaning as full-motion users. Motion is not considered valid if focus, announcement order, or meaning diverges.

**MotionVerificationTrace**
`motionVerificationTraceId`, `uiEventRef`, `motionCueRefs[]`, `arbitrationRefs[]`, `reducedMotionProfileRef`, `staticEquivalentRefs[]`, `renderOutcomeRef`, `overlapCount`, `traceState = complete | incomplete | mismatch`

`MotionVerificationTrace` is the deterministic test artifact for motion behavior. Playwright and runtime diagnostics must be able to inspect what cue fired, what region won arbitration, what accessibility or degradation mode was active, whether any overlap occurred, and whether the rendered outcome matched policy.

#### 7.1 Motion intent meanings and hierarchy

Canonical visible phases for one causal token:

1. `local_ack` belongs on the initiating control only.
2. `provisional` belongs on the affected object or `SelectedAnchor`.
3. `authoritative`, `invalidated`, or `recovered` lands on the affected object first, then mirrors statically into `CasePulse`, `StateBraid`, or the shared status strip.
4. `resolved` is static only. Once resolved, the same cue may not continue animating.

Required semantic intents:

* `reveal`: disclose new content or newly available detail from the triggering control or anchor
* `morph`: transform the same object into an adjacent state while preserving identity
* `settle`: confirm authoritative convergence of a previously pending or provisional change
* `pending`: indicate that work is in progress elsewhere without implying final success
* `invalidate`: mark a previously actionable or selected object as no longer valid while keeping it visible
* `diff`: draw attention to what changed relative to the last acknowledged snapshot
* `reopen`: communicate reversal from settled to active work
* `degrade`: communicate stale, disconnected, read-only, or fallback mode
* `recover`: guide attention from degraded or blocked posture to the next recovery path or restored readiness
* `handoff`: shift emphasis between closely related child panels without breaking shell continuity
* `escalate`: signal urgent or high-attention transition when the state itself is urgent

Intent law:

* `commit` is deprecated and must normalize to `settle` before any cue is emitted.
* `invalidate` is not a synonym for `reopen`; invalidation preserves the current anchor and freezes unsafe action, while reopen reactivates the workflow.
* `recover` is not a synonym for `reveal`; recovery must point to the bounded next safe action after degradation, conflict, or freeze.
* `pending` must never outrank `invalidate`, `recover`, `reopen`, or `escalate` for the same anchor.

Typical domain mappings:

* autosave success -> `settle`
* submit-to-receipt -> `morph`
* selected option validation -> `pending`
* evidence change requiring re-check -> `diff` or `invalidate` depending on whether the current action remains legal
* request returned to active work -> `reopen`
* stale or disconnected state -> `degrade`
* reconnect or same-shell recovery completion -> `recover`
* authoritative confirmation -> `settle`

#### 7.2 Motion timing, delay, and easing model

All durations, delays, amplitudes, and travel distances must resolve through the shared motion tokens from `design-token-foundation.md`; the model below selects deterministic outcomes from canonical duration and distance buckets rather than minting route-local animation values.

Use the following deterministic timing model:

* canonical duration tokens are `120ms`, `180ms`, `240ms`, and `320ms`
* canonical distance tokens are `0px`, `4px`, `8px`, and `12px`
* `baseDuration[intent] = { reveal: 180, morph: 240, settle: 120, pending: 120, invalidate: 120, diff: 120, reopen: 240, degrade: 120, recover: 180, handoff: 240, escalate: 120 }`
* `durationMs` must snap to one canonical duration token according to `intent`, `timingBand`, and whether the cue stays local, follows the selected anchor, or performs an anchor-preserving handoff
* `delayMs = 0` for the initiating control, selected anchor, invalidation, or recovery cue; otherwise exactly one causal follower may use `delayMs = 40`

Rules:

1. `instant` is for acknowledgements, invalidation freezes, and fast settle feedback.
2. `standard` is for ordinary reveal, settle, degrade, and diff cues.
3. `deliberate` is reserved for anchor-preserving morphs, handoffs, and reopen transitions where continuity would otherwise be lost.
4. `urgent` is for high-attention state changes without dramatic flourish; it shortens time, not distance.
5. Secondary shell-strip acknowledgement may trail a dominant object cue by `delayMs`, but shell and anchor motion may not start together.

Use these easing families:

* `standard_enter = cubic-bezier(0.2, 0.0, 0, 1.0)`
* `standard_exit = cubic-bezier(0.3, 0, 1, 1)`
* `deterministic_linear = linear` for determinate progress only
* `anchored_morph_spring`: critically damped, no-overshoot interpolation `x(t) = 1 - e^(-ωt) (1 + ωt)` with `ω = 4.74 / durationMs`

Easing law:

* use `anchored_morph_spring` only for `morph`, `handoff`, or `reopen` when connected-object continuity matters
* use `standard_enter` for `reveal`, `settle`, `recover`, `diff`, and most `degrade` cues
* use `standard_exit` only for the leaving leg of a bounded handoff or collapse
* bounce, elastic, overshoot, parallax, rotation, blur-zoom, and multi-axis motion are forbidden

#### 7.3 Amplitude and movement profiles

Amplitude law:

* `silent`: `0px` translation, `0` scale delta, static state change only
* `low`: `4px` translation or `<= 0.01` scale delta
* `medium`: `8px` translation or `<= 0.02` scale delta and is allowed only for `morph`, `reopen`, or `handoff`
* `urgent`: `<= 8px` translation, no extra scale, no extra travel beyond the matching `low` or `medium` profile; urgency comes from timing, contrast, and explicit wording
* absolute caps in `profileState = full` are `12px` translation, `0.02` scale delta, and `0.16` opacity delta

Movement-profile law:

1. `reveal` and `recover` may use anchored fade plus `4px` rise or lateral reveal from the initiating control.
2. `morph`, `handoff`, and `reopen` may use connected-object interpolation or single-axis slide inside the local region only.
3. `settle` must be a short confirmatory settle on the target object and may not become a celebratory bounce or shell-wide flourish.
4. `pending` must not move the object through space. Use determinate progress where available; otherwise allow at most two low-amplitude pulses before freezing to a static busy state.
5. `invalidate` must not displace or remove the current anchor. Freeze unsafe controls, preserve the object, and express invalidation through outline, badge, icon, text, or low-amplitude emphasis.
6. `diff` must use localized wash, outline, or emphasis fade and must not reorder or translate the active object to make the point.
7. `degrade` must prefer static state shifts in the affected card, control, or shared status strip; it may not fake ordinary calmness through decorative animation.
8. Shell-wide motion is forbidden when the active object is already known and continuity is unchanged.

#### 7.4 Arbitration, interruptibility, and live-churn suppression

Use the following arbitration constants:

* `W_merge = 80ms`
* `priority(intent) = { invalidate: 90, recover: 80, reopen: 70, settle: 60, morph: 50, reveal: 40, diff: 30, pending: 20, degrade: 10, handoff: 50, escalate: 95 }`
* `scopePriority = { selected_anchor: 4, focused_region: 3, local_card: 2, shell_status_strip: 1, peripheral_region: 0 }`
* `score = 100 * scopePriority + priority(intent)`

Arbitration law:

1. Merge candidate cues for the same target anchor or region when they arrive within `W_merge`.
2. The dominant cue is the candidate with the greatest `score`; ties break by the most recent authoritative or invalidating cue.
3. At any moment, `animatedRegions(entityContinuityKey) <= 1`. A second animated region is allowed only as one declared handoff follower that begins after the primary cue has passed `70%` progress.
4. Non-dominant shell, banner, or status-strip cues for the same causal token must resolve as static equivalents while the dominant cue is active.
5. `invalidate`, `recover`, `reopen`, and `escalate` may interrupt lower-priority cues immediately. `settle` may finish the final `30%` of an active local acknowledgement, then must resolve the older cue statically.
6. Reversible business actions must use reversible motion: a pending or provisional cue may be replaced by invalidate, recover, reopen, or settle without visual discontinuity.
7. Lists, queues, and boards may not animate resorting while a `SelectedAnchor`, composition lease, or focused queue position is active. Preserve position, patch values in place, and batch reorder only on explicit apply or idle.

Churn-suppression law:

* `delta_batch_calm = 120ms`
* if `candidateCueRatePerSecond > 3` over the trailing `2s`, or `frameDropRatio > 0.10`, downgrade to `profileState = minimal`
* if `candidateCueRatePerSecond > 6` over the trailing `2s`, or `frameDropRatio > 0.20`, downgrade to `profileState = static_only`
* urgent non-bufferable invalidation and recovery still bypass buffering, but peripheral motion remains suppressed
* repeated low-risk deltas must coalesce inside `delta_batch_calm` and settle the active anchor region first, peripheral regions second, and the shared status strip last

#### 7.4A Operations-board prominence and motion parity

1. Any operations-shell change in dominant anomaly, dominant action emphasis, or secondary-summary expansion must originate from the current `OpsProminenceDecision` and emit one `OpsMotionEnvelope`; widget-local pulses or tile-level resorting without the shell decision are invalid.
2. `OpsMotionEnvelope.changeCause`, causal copy, DOM markers, and reduced-motion or static equivalents must agree on whether the board changed because of live delta, threshold cross, batch apply, restore, degraded mode, or manual pin.
3. While `OpsFocusProtectionFence.fenceState = active` or `AttentionBudget.promotionLockReason != none`, `MotionRegionArbitration` must keep the currently promoted operations surface and `InterventionWorkbench` stable; competing anomalies may surface only as secondary summaries or queued-delta digests.
4. Threshold-cross promote and demote flows for operations boards must record the governing `OpsEscalationCooldownWindow` in `MotionVerificationTrace` so automation can prove hysteresis, cooldown release, and reduced-motion parity.

#### 7.5 Reduced-motion rule and accessibility equivalence

When reduced motion or runtime degradation is active:

1. `prefers-reduced-motion: reduce` or an equivalent user setting must force at least `profileState = reduced`.
2. `reduced` allows `<= 4px` translation, no scale, no multi-axis motion, and no looping; use fades, highlights, iconography, and explicit text.
3. `minimal` allows no translation and only short opacity or outline emphasis up to `120ms`.
4. `static_only` allows `0ms` motion; state, focus, icon, text, and DOM markers still change.
5. `loopAllowanceState = never` for `reduced`, `minimal`, and `static_only`; determinate progress is the only allowed moving indicator.
6. Keyboard, screen-reader, and pointer readiness must be equivalent across `full`, `reduced`, `minimal`, and `static_only` according to `AccessibilityEquivalenceCheck`.

Intent-specific reduced-motion fallbacks:

* `reveal` -> instant expand or short fade with updated disclosure semantics
* `morph` -> same-box crossfade or static replace while preserving anchor and focus
* `settle` -> static settle badge, icon, or text on the affected object
* `pending` -> inline busy text or determinate progressbar, then static busy state
* `invalidate` -> persistent invalidated badge, explanation text, frozen CTA, no movement
* `diff` -> static diff chip, outline, or changed-since-seen marker
* `reopen` -> in-place state copy change plus anchor preservation, no reverse travel
* `degrade` -> shared strip and local card state change plus disabled unsafe actions
* `recover` -> focus-compatible recovery callout or restored-ready marker, no flourish
* `handoff` -> static emphasis swap between local panels
* `escalate` -> higher-contrast state plus assertive wording, not larger motion

#### 7.6 Feedback timing and microinteraction contract

Use these timing constants:

* pressed, focus, and hover feedback must render within `50ms` or the next paint, whichever is sooner
* `TransitionEnvelope.localAckState = local_ack | queued` must produce visible acknowledgement within `120ms`
* if authoritative progress is still unknown at `150ms`, render `pending` on the initiating control or selected anchor
* `T_strip_mirror = min(96ms, 0.5 * durationMs)`
* `T_pending_motion_max = 1200ms` or two pulses, whichever comes first
* `T_diff_dwell = 1600ms`
* `T_invalidation_hold_min = 4000ms`
* `T_settle_dwell = 800ms`
* `T_recovery_callout = 1200ms`
* `T_buffer_max[bufferable] = 1500ms`
* `T_buffer_max[review_required] = 250ms`
* `T_resume_stable = 1200ms`

Microinteraction law:

1. Local acknowledgement starts on the initiating control first, then on the affected anchor or card, then mirrors statically into shell status if the action remains pending.
2. Status-strip mirrors must never pre-empt a dominant local cue.
3. Pending visuals must become static after `T_pending_motion_max`; indefinite looping spinners are forbidden.
4. Diff emphasis decays to passive state after `T_diff_dwell`, but the changed-since-seen marker remains until acknowledged.
5. Invalidation freezes the unsafe action within `100ms` of the authoritative delta and keeps the invalidated anchor visible for at least `T_invalidation_hold_min` or until explicit re-check, replacement, or dismissal.
6. Settlement may animate once for up to `T_settle_dwell`, then must resolve to static evidence in the object, `StateBraid`, or shared status strip.
7. Recovery may animate once for up to `T_recovery_callout`, then must remain as a stable recovery or restored-ready state.
8. Field-level validation must stay local to the field or field group; shell strips and banners are reserved for cross-field or cross-surface consequences.
9. Motion may not delay focus availability, keyboard readiness, pointer cancellation, or the next safe action.

#### 7.7 Accessibility and interaction contract

The canonical cross-shell semantic, keyboard, focus, form-repair, timeout-recovery, freshness, visualization, and assistive-copy rules are defined in `accessibility-and-content-system-contract.md`. Phase 0 still sets the minimum platform law, but local route families must bind to the shared contract before implementation is considered complete.

1. All core workflows must be fully operable by keyboard.
2. Focus indicators must be visible, high-contrast, and never hidden behind sticky chrome.
3. Every custom control must expose a semantic role and stable accessible name.
4. Every spatial comparison surface must have a semantic fallback.
5. No state may rely on color alone.
6. Reflow, zoom, and narrow-width rendering must preserve the primary action path.
7. Live regions must be bounded and must not create noisy repeated announcements for routine updates.
8. Assertive announcements are reserved for blocking, urgent, or review-required changes.
9. Buffered update announcements must summarize batches rather than narrate every individual patch.
10. Drag-only interaction patterns are forbidden unless a full keyboard and screen-reader alternative exists.
11. Focus restore after same-shell recovery, placeholder clearance, or browser return must target the current `SelectedAnchor`, the dominant recovery action, or the preserved composer rather than the document top.
12. Loading, placeholder, and empty states must expose concise accessible summaries that state reason, current actionability, and whether more content is still loading.
13. Virtualized lists, dense grids, and queue workboards must preserve keyboard position, row or column semantics, and current-set or current-position cues for assistive technology.
14. Sticky status strips, decision docks, drawers, and side stages must not create tab-order loops, obscured focus, or reading-order jumps at `200%` zoom, reflow, or narrow widths.
15. Any artifact preview, governed download, print preview, or browser handoff must announce progress and return state without requiring sighted interpretation.
16. Every `SurfaceStateFrame` must expose a labeled region, concise state summary, and explicit dominant-action relationship that screen readers can traverse without hearing duplicate shell chrome first.
17. Every `ArtifactStage` must expose artifact title, current mode, provenance summary, and return target in a stable reading order before any print, download, or external handoff controls.
18. Reduced-motion, minimal, and static-only modes must preserve the same causal order of focus, announcement, and action readiness as full motion.
19. Each active shell and primary region must resolve live narration through one `AssistiveAnnouncementTruthProjection` bound to the current `UIEventEmissionCheckpoint`, `StatusAcknowledgementScope`, `FocusTransitionContract`, `FreshnessAccessibilityContract`, `FormErrorSummaryContract`, and `TimeoutRecoveryContract`; local components may propose intent but may not publish standalone live regions.
20. Restore, reconnect, queue flush, and buffer replay may emit at most one current-state summary per surface and restore epoch; historical acknowledgements, autosave ticks, and low-risk batch replays may not sound like fresh activity.
21. Local acknowledgement, processing acceptance, authoritative settlement, blocker, and recovery copy must stay semantically distinct in wording and urgency; identical announcement reuse across those classes is forbidden.
22. Every chart, heat surface, matrix, and forecast band must implement `VisualizationFallbackContract`, `VisualizationTableContract`, `VisualizationParityProjection`, and `AssistiveTextPolicy` so summary text, units, interval meaning, current selection, filter context, sort state, and non-color encodings stay equivalent across visual and assistive paths.
23. When `VisualizationParityProjection.parityState != visual_and_table`, the downgraded table, summary, or placeholder posture becomes the authoritative view; the visual may not continue as the dominant meaning surface.
23A. Every route family must publish one `AccessibilitySemanticCoverageProfile` bound to the current `DesignContractPublicationBundle`, its required `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, `FreshnessAccessibilityContract`, `AutomationAnchorProfile`, and the relevant `SurfaceStateSemanticsProfile`.
23B. `AccessibilitySemanticCoverageProfile.coverageState = complete` is required before a route may remain calm, writable, visual-dominant, or fully interactive. Breakpoint, `mission_stack`, host-resize, safe-area, reduced-motion, or buffered-update drift must demote the same shell into summary-first, table-first, placeholder, or recovery posture rather than leaving semantically partial controls armed.
23C. `AutomationAnchorProfile`, `AutomationAnchorMap`, `TelemetryBindingProfile`, and route-level accessibility semantics must use one shared kernel vocabulary. DOM markers and accessible summaries may not disagree on state class, dominant action, selected anchor, or recovery posture.
23D. Stale, degraded, blocked, pending, placeholder, read-only, and recovery surfaces must remain semantically equivalent to the current `SurfaceStateSemanticsProfile` and `FreshnessAccessibilityContract`; visible calmness without matching accessible calmness is invalid.

#### 7.8 Verification and Playwright contract

1. Prefer semantic HTML and accessible roles before test IDs.
2. Every critical workflow must expose deterministic success and failure markers in the DOM.
3. Loading, stale, locked, processing, empty, warning, failed, invalidated, recovered, review-required, and reconciled states must be explicit in the DOM and visually distinct.
4. Do not use animation to hide readiness or delay actionability.
5. `CasePulse`, `StateBraid`, `EvidencePrism`, `DecisionDock`, `QueueLens`, `InlineSideStage`, and `SelectedAnchor` surfaces must have stable automation anchors.
6. `EssentialShellFrame`, `PrimaryRegionBinding`, `StatusStripAuthority`, active degraded or recovery posture, and any active `MissionStackFoldPlan` fold toggle must also be observable through deterministic DOM markers or semantic attributes.
7. Route change alone is not an acceptable assertion of state change; the relevant object state must also be reflected in the DOM.
8. Continuity reuse, selected-anchor preservation, freshness state, re-check state, quiet-settlement pending or disputed posture, and restore readiness must all be observable in automation without relying on visual timing guesses.
9. Active shells and dominant action regions must expose stable `data-shell-type`, `data-channel-profile`, `data-route-family`, `data-writable-state`, and `data-anchor-state` markers.
10. `SurfaceStateFrame`, placeholder, hydration, artifact-transfer, and restore surfaces must expose stable automation anchors plus deterministic `data-surface-state`, `data-state-owner`, `data-state-reason`, `data-dominant-action`, `data-artifact-stage`, `data-artifact-mode`, `data-transfer-state`, and `data-return-anchor` or equivalent contract-safe markers.
10A. Visualization surfaces must expose stable `data-visualization-parity-state`, `data-visualization-selection`, `data-visualization-filter-context`, `data-visualization-sort-state`, and `data-visualization-authority` markers or equivalent contract-safe semantics so automation can prove when the chart, table, summary, or placeholder is the authoritative meaning surface.
11. `mission_stack` fold, unfold, rotate, restore, and breakpoint transitions must be observable in automation without relying on visual timing guesses.
12. Active motion targets must expose stable `data-motion-intent`, `data-motion-phase`, `data-motion-profile`, `data-motion-region`, and `data-motion-suppressed` markers or contract-safe equivalents.
13. Automation must be able to assert `animated_region_overlap_count = 0` for a continuity key unless the route explicitly declares one causal handoff follower.
13A. Active route roots must also expose stable `data-accessibility-coverage-state`, `data-semantic-surface`, `data-keyboard-model`, `data-focus-transition-scope`, and `data-live-announce-state` markers or equivalent contract-safe semantics so automation can prove which `AccessibilitySemanticCoverageProfile` governs the rendered route family and whether the current shell is allowed to remain calm or interactive.
14. Buffered live-apply windows must expose `data-batch-window-ms`, `data-buffer-impact`, and `data-motion-suppression-state` or equivalent contract-safe markers.
15. Invalidated anchors must expose `data-anchor-state = invalidated` until explicit re-check, replacement, or dismissal; disappearance is a defect.
16. `MotionVerificationTrace` must record the winning cue, suppressed cues, effective reduced-motion profile, rendered static equivalent, and overlap count for every animated or suppressed transition.
17. Operations boards must expose stable `data-ops-prominence-state`, `data-ops-promoted-surface`, `data-ops-secondary-summaries`, `data-ops-focus-fence-state`, `data-ops-cooldown-state`, and `data-ops-motion-cause` markers or equivalent contract-safe markers whenever anomaly arbitration is active.
18. Automation must be able to assert that exactly one operations surface is dominant, that the visible dominant surface matches `OpsProminenceDecision.promotedSurfaceRef`, that `InterventionWorkbench` remains the sole dominant action region, and that non-promoted surfaces stay summary-level.
19. `MotionVerificationTrace` for operations boards must join the winning cue to the governing `OpsProminenceDecision`, `OpsMotionEnvelope`, `OpsFocusProtectionFence`, and `OpsEscalationCooldownWindow`, including the reduced-motion or static-equivalent outcome.
20. Operations health surfaces must expose stable `data-health-state`, `data-health-overlay-state`, `data-fallback-sufficiency-state`, `data-guardrail-state`, and `data-mitigation-authority-state` markers or equivalent contract-safe markers whenever `ServiceHealthGrid` is present.
21. Automation must be able to assert that `OpsStableServiceDigest.topHealthySignals[]` include only `EssentialFunctionHealthEnvelope.overlayState = live_trusted` functions and that time-bounded fallback, freeze-constrained, or degraded-trust functions remain visible as watch or guarded items rather than calm healthy tiles.

#### 7.9 Responsiveness budgets and continuity measures

Required measures:

* `interaction_to_local_ack_ms`
* `interaction_to_server_accept_ms`
* `interaction_to_projection_seen_ms`
* `delta_to_visible_patch_ms`
* `same_entity_shell_reuse_rate`
* `selected_anchor_preservation_rate`
* `focus_loss_rate`
* `same_entity_full_reload_count`
* `buffered_delta_apply_lag_ms`
* `mission_stack_restore_success_rate`
* `artifact_stage_return_success_rate`
* `animated_region_overlap_count`
* `motion_downgrade_rate`
* `invalidation_to_freeze_ms`

Rules:

1. Optimize for time to stable local acknowledgement and time to stable comprehension, not only network completion.

2. Target budgets for core flows:

   * local acknowledgement should normally occur within `150ms` of interaction
   * invalidation freeze should normally occur within `100ms` of the authoritative delta reaching the client
   * non-disruptive projection deltas should normally patch visibly within `250ms` of receipt
   * same-entity full reload count must be `0` by design
   * focus loss rate for protected workflows must be `0` by design
   * animated-region overlap count must be `0` by design

3. Regressions in continuity, anchor preservation, focus integrity, invalidation latency, or motion arbitration are product defects.

4. Responsiveness must be judged by whether the user can understand what is happening without losing context, not by whether a new page loaded quickly.

### 8. Required UI events

High-priority UI-event defects in this layer:

1. the event list names signals, but does not define one canonical UI-event envelope, so shells and surfaces can emit incompatible payloads for the same interaction
2. continuity, restore, and route-morph events are not bound to one causal chain, so operators and auditors cannot reconstruct why a shell was reused, recovered, or replaced
3. quiet-mode decisions such as status suppression, support-region promotion, and reduced-motion adaptation are not emitted as first-class decision records, so review cannot prove why chrome stayed calm
4. transition events exist, but they do not bind provisional acknowledgement, server acceptance, projection truth, and dispute into one settlement record, so optimistic and authoritative states can blur in telemetry
5. the event list has no explicit disclosure fence, so PHI-bearing routes risk leaking raw identifiers, route details, or record context into UI telemetry
6. announcement batching, dedupe, and replay are not emitted as first-class event families, so assistive behaviour cannot be reconstructed or tested against causal truth

Build UI telemetry around these contracts:

**UIEventEnvelope**
`uiEventId`, `eventName`, `contractVersionRef`, `eventVersion`, `continuityKey`, `continuityFrameRef`, `routeFamilyRef`, `routeIntentRef`, `canonicalObjectDescriptorRef`, `canonicalEntityRef`, `shellInstanceRef`, `surfaceRef`, `audienceTier`, `channelContextRef`, `eventClass = shell | continuity | transition | projection | queue | anchor | side_stage | live | announcement | motion | review | recovery`, `eventState = provisional | authoritative | buffered | resolved | failed`, `occurredAt`, `correlationId`, `edgeCorrelationId`, `actionRecordRef`, `commandSettlementRef`, `projectionVisibilityRef`, `selectedAnchorRef`, `shellDecisionClass = created | reused | restored | recovered | replaced | frozen`, `auditRecordRef`, `disclosureClass`

`contractVersionRef` versions the shared envelope contract, while `eventVersion` versions any event-family-specific payload carried under that envelope. `canonicalEntityRef` is the canonical object reference for emitted UI telemetry; route-local payloads that still speak in terms of `entityRef` must normalize into `canonicalEntityRef` before emission. `edgeCorrelationId` is the immutable ingress join key that ties browser intent, command dispatch, projection visibility, and audit together; `correlationId` remains the sink-local transport or trace correlation and may rotate across hops.

**UIEventCausalityFrame**
`uiEventCausalityFrameId`, `continuityFrameRef`, `causalToken`, `edgeCorrelationId`, `routeIntentRef`, `initiatingActionRef`, `actionRecordRef`, `commandSettlementRef`, `relatedEnvelopeRefs[]`, `sequenceWindowRef`, `settlementRef`, `projectionVisibilityRef`, `auditRecordRef`, `triggerType = route_morph | projection_delta | action_submit | action_settlement | restore | manual_pin | recovery_render | continuity_preserve | continuity_break | stale_posture | anchor_change | shell_reuse_decision`, `transitionEnvelopeRef`, `motionIntentRef`, `selectedAnchorRef`, `selectedAnchorChangeClass = preserved | changed | invalidated | released`, `shellDecisionClass = created | reused | restored | recovered | replaced | frozen`, `snapshotRef`, `frameState = open | superseded | settled | expired`, `causalState = direct | derived | replayed`

**UIPresentationDecisionRecord**
`uiPresentationDecisionRecordId`, `uiEventRef`, `attentionBudgetRef`, `promotedSupportRegionRef`, `statusCueRef`, `suppressionLedgerRef`, `reducedMotionState`, `decisionOutcome`, `decidedAt`

**UITransitionSettlementRecord**
`uiTransitionSettlementRecordId`, `uiEventRef`, `continuityFrameRef`, `edgeCorrelationId`, `actionRecordRef`, `commandSettlementRef`, `transitionEnvelopeRef`, `localAckState`, `processingAcceptanceState`, `externalObservationState`, `projectionVisibilityState = unseen | visible | stale | superseded`, `projectionVisibilityRef`, `auditRecordRef`, `authoritativeSource = not_yet_authoritative | projection_visible | external_confirmation | review_disposition | recovery_disposition`, `authoritativeOutcomeState = pending | review_required | recovery_required | reconciliation_required | settled | reverted | failed | expired`, `settlementState = provisional | accepted | authoritative | reverted | disputed | expired`, `settlementRevision`, `settledAt`

**UIProjectionVisibilityReceipt**
`uiProjectionVisibilityReceiptId`, `continuityFrameRef`, `causalToken`, `edgeCorrelationId`, `routeIntentRef`, `actionRecordRef`, `commandSettlementRef`, `commandFollowingTokenRef`, `projectionVersionRef`, `shellInstanceRef`, `surfaceRef`, `selectedAnchorRef`, `selectedAnchorChangeClass = preserved | changed | invalidated | released`, `shellDecisionClass = created | reused | restored | recovered | replaced | frozen`, `continuityEvidenceRef`, `visibilityCoverageRef`, `visibleAt`, `visibilityState = buffered | visible | stale | superseded | blocked`

**UIEventEmissionCheckpoint**
`uiEventEmissionCheckpointId`, `envelopeHash`, `continuityFrameRef`, `eventSequence`, `restoreEpoch`, `bufferEpoch`, `deliveryState = pending | emitted | deduplicated | replayed | rejected`, `emissionSinkRef`, `emittedAt`

`UIEventEmissionCheckpoint` guarantees deterministic ordering and idempotent replay across reconnect, restore, queue batch apply, announcement batching, and buffer flush.

**UITelemetryDisclosureFence**
`uiTelemetryDisclosureFenceId`, `uiEventRef`, `edgeCorrelationId`, `routeIntentRef`, `visibilityCoverageRef`, `audienceTier`, `routeSensitivity`, `allowedIdentifierClass`, `allowedPayloadClass`, `allowedFieldRefs[]`, `safeDescriptorHash`, `safeRouteScopeHash`, `redactionPolicyRef`, `maskingPolicyVersionRef`, `fenceState = enforced | blocked | mismatched`

Rules:

- every emitted UI event must use `UIEventEnvelope`; route-level bespoke payloads may extend it, but may not replace continuity, object, audience, or disclosure fields
- continuity, shell-restore, deep-link recovery, stale-posture, and selected-anchor events must also emit `UIEventCausalityFrame` so replay can distinguish live user movement from replayed, restored, or derived UI state
- any event that changes visible shell posture, selected-anchor posture, or command-following truth must also persist one `UIProjectionVisibilityReceipt`; replay must be able to answer which projection version, continuity evidence, and shell-decision class became visible
- status suppression, banner promotion, support-region promotion, and reduced-motion adaptations must emit `UIPresentationDecisionRecord`; calm UI is not allowed to be unexplainable UI
- `UIEventEmissionCheckpoint.eventSequence` must order shell, transition, projection, queue, live, announcement, anchor, and recovery emissions deterministically inside one continuity frame; replayed or deduplicated emissions may not look like fresh user activity
- `ui.transition.*` events must be correlated through `UITransitionSettlementRecord`; no analytics consumer may infer authoritative completion from `ui.transition.server_accepted` alone, and `settlementState = authoritative` is illegal while `authoritativeSource = not_yet_authoritative` or `authoritativeOutcomeState != settled`
- `ui.announcement.*` events must share one `AssistiveAnnouncementTruthProjection`, `announcementTupleHash`, and `UIEventEmissionCheckpoint` sequence window; `deduplicated` or `replayed` announcement events may not be emitted as fresh `queued` or `emitted` events
- command-following or continuity-preserving surfaces may emit calm success, restored-ready, or shell-reused posture only after the matching `UIProjectionVisibilityReceipt` and `AuditRecord` are bound to the same `edgeCorrelationId`, `causalToken`, and `continuityFrameRef`
- every UI event emitted from PHI-bearing, embedded, or recovery routes must pass `UITelemetryDisclosureFence`; raw record titles, identifiers, route params, anchor labels, and payload fragments outside the allowed disclosure class are forbidden in telemetry, but canonical descriptor hashes, route-family hashes, shell-decision classes, and causal tokens must remain available for replay-safe reconstruction
- assistive gesture capture, provenance reveal, override-reason entry, and feedback-adjudication events must also pass `UITelemetryDisclosureFence`; raw prompt fragments, hidden evidence spans, free-text override notes, and route params may not leak into telemetry even when the same gesture is replay-safe

Emit the following events where applicable:

* `ui.shell.created`
* `ui.shell.reused`
* `ui.shell.restore_requested`
* `ui.shell.restore_applied`
* `ui.shell.restore_failed`
* `ui.shell.recovery_reused`
* `ui.continuity.resolved`
* `ui.continuity.preserved`
* `ui.continuity.broken`
* `ui.continuity.recovered`
* `ui.continuity.superseded`
* `ui.recovery.entered`
* `ui.recovery.resolved`
* `ui.freeze.entered`
* `ui.freeze.cleared`
* `ui.case_pulse.rendered`
* `ui.attention_budget.changed`
* `ui.support_region.promoted`
* `ui.support_region.demoted`
* `ui.status_suppressed`
* `ui.status.arbitrated`
* `ui.status.acknowledged`
* `ui.state_axes.changed`
* `ui.state_braid.rendered`
* `ui.evidence_prism.rendered`
* `ui.decision_dock.rendered`
* `ui.selected_anchor.created`
* `ui.selected_anchor.changed`
* `ui.selected_anchor.preserved`
* `ui.selected_anchor.invalidated`
* `ui.selected_anchor.released`
* `ui.transition.started`
* `ui.transition.server_accepted`
* `ui.transition.awaiting_external`
* `ui.transition.projection_seen`
* `ui.transition.settled`
* `ui.transition.disputed`
* `ui.transition.reverted`
* `ui.transition.failed`
* `ui.transition.expired`
* `ui.consequence.previewed`
* `ui.projection.subscribed`
* `ui.projection.delta_received`
* `ui.projection.delta_buffered`
* `ui.projection.delta_applied`
* `ui.freshness.changed`
* `ui.freshness.stale_entered`
* `ui.freshness.stale_cleared`
* `ui.queue.batch_available`
* `ui.queue.batch_applied`
* `ui.queue.focus_pinned`
* `ui.side_stage.opened`
* `ui.side_stage.closed`
* `ui.live.paused`
* `ui.live.resumed`
* `ui.buffer.state_changed`
* `ui.buffer.flushed`
* `ui.announcement.queued`
* `ui.announcement.emitted`
* `ui.announcement.deduplicated`
* `ui.announcement.replayed`
* `ui.announcement.invalidated`
* `ui.diff.revealed`
* `ui.review.required`
* `ui.motion.reduced_enabled`
* `ui.route.recovery_rendered`
* `ui.visibility.placeholder_rendered`
* `ui.telemetry.redacted`

### 9. Forbidden behaviors

The following behaviors are explicitly forbidden:

1. hard reloading the page for a projection-backed adjacent state change
2. showing a blank or full-screen loading state when the active entity is already known
3. replacing the whole request surface when only a child panel, evidence cluster, selected card, or status has changed
4. resetting focus or scroll because a live update arrived
5. reordering or removing the currently open staff item while it is being worked
6. splitting messages, callback expectations, and follow-up questions into unrelated silo pages for the same request
7. showing fake exclusivity, fake hold countdown, or fake real-time confidence
8. using generic endless spinners instead of explicit bridge states
9. allowing live updates to overwrite partially entered user text
10. using animation that flashes, bounces, or dramatizes urgent states
11. relying on route changes alone to communicate state change
12. presenting contradictory top-level status across patient-facing surfaces for the same request
13. hiding staleness or disconnection when fresh data is required for safe action
14. using assistive suggestions in a way that displaces primary clinical or operational content without user intent
15. stacking modal on top of modal for adjacent compare, inspect, or compose work that can be served by `InlineSideStage`
16. flattening evidence origin, confidence, and freshness into one undifferentiated content block
17. exposing irreversible or externally consequential actions without `ConsequencePreview`
18. relying on color-only severity or urgency signalling
19. shipping bespoke controls that are not keyboard-operable or lack stable semantic naming
20. presenting a spatial-only selection surface without an accessible fallback representation
21. removing a `SelectedAnchor` during validation, pending, invalidation, or failure without explicit replacement or dismissal
22. sending the user to a different shell for messaging, booking, hub, callback, pharmacy, or review work that still belongs to the same request continuity key
23. using transient toast alone as the only evidence that a state change occurred
24. force-scrolling to new timeline entries or live deltas while the user is reading, typing, or deciding
25. treating `received`, `in_review`, or `action_in_progress` as dead static pages
26. silently settling a transition when later projection truth conflicts with the optimistic path
27. applying high-churn board updates as jittery per-item resort loops that break scanability
28. hiding buffered live changes until they silently apply without user awareness
29. duplicating the same status across header, banner, chip, toast, and side rail when one shared status strip would do
30. auto-expanding more than one support region for the same state change unless diagnostic mode or an explicit user pin justifies it
31. leaving blocker-only evidence, context, or compare chrome expanded after the reason has resolved when the user did not pin it
32. defaulting a routine task into `three_plane` layout when `focus_frame` or `two_plane` would preserve clarity
33. creating browser-history noise for every async sub-state or projection refresh
34. measuring speed only by page load while ignoring continuity loss, focus loss, anchor loss, or avoidable noise
35. stacking persistent full-width banners for pending, stale, assistive, or capability states that could remain local to the active card or the shared status strip

## 0G. Observability, security plumbing, and operational controls

Now make the platform operable.

Every request should get one immutable `edgeCorrelationId` at the edge and carry it through browser, API, command handler, event bus, worker, projection, UI visibility receipt, and audit. Without that, later debugging becomes miserable.

Add:

- structured logs
- distributed tracing
- metrics for latency, error rate, queue depth, retries, and projection lag
- feature flags
- config versioning
- secret rotation hooks
- PII redaction rules
- health endpoints
- readiness and liveness probes
- alert definitions
- synthetic transactions

On the client side, add:

- error boundaries
- frontend telemetry
- release version tagging
- route transition timing
- causality reconstruction checkpoints for shell reuse, restore, stale downgrade, selected-anchor change, and authoritative settlement
- safe redaction before telemetry emit

This is also the right moment to define failure language in the UI. Not generic "something went wrong," but product-grade failure states that later map to telephony outage, GP system outage, notification delay, stale queue, or auth failure.

**Tests that must pass before 0G is done**

- Correlation IDs appear end to end
- Local acknowledgement or server acceptance alone cannot satisfy authoritative UI or audit settlement
- Continuity, restore, recovery, stale, and selected-anchor replay remains reconstructable from PHI-safe telemetry
- Telemetry excludes PHI
- Alert rules fire in test environments
- Feature flags can enable or disable surfaces without redeploy
- Secrets can rotate without code changes
- Synthetic probes detect degraded dependencies

**Exit state**  
The system is observable enough that later feature work does not become guesswork.

[1]: https://digital.nhs.uk/services/gp-connect?utm_source=chatgpt.com "GP Connect"
[2]: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works "How NHS login works - NHS England Digital"
[3]: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards "Clinical risk management standards - NHS England Digital"
[4]: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration "IM1 Pairing integration - NHS England Digital"
[5]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration "NHS App web integration - NHS England Digital"
[6]: https://dl.acm.org/doi/pdf/10.1145/775047.775151 "Transforming classifier scores into accurate multiclass probability estimates - Zadrozny and Elkan"
[7]: https://www.nejm.org/doi/abs/10.1056/NEJM198005153022003 "The Threshold Approach to Clinical Decision Making - Pauker and Kassirer"
[8]: https://journals.ametsoc.org/view/journals/mwre/114/12/1520-0493_1986_114_2671_andotb_2_0_co_2.pdf "A New Decomposition of the Brier Score - Murphy"
