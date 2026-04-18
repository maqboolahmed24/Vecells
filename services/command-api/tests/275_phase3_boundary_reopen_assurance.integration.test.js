import { describe, expect, it } from "vitest";
import { createPhase3SelfCareBoundaryApplication } from "../src/phase3-self-care-boundary-grants.ts";
import { createPhase3AdviceRenderApplication } from "../src/phase3-advice-render-settlement.ts";
import { createPhase3AdminResolutionPolicyApplication } from "../src/phase3-admin-resolution-policy.ts";
import { createPhase3AdviceAdminDependencyApplication } from "../src/phase3-advice-admin-dependency.ts";
import { createPhase3SelfCareOutcomeAnalyticsApplication } from "../src/phase3-self-care-outcome-analytics.ts";
import { createPhase3AdminResolutionSettlementApplication } from "../src/phase3-admin-resolution-settlement.ts";

function document(snapshotRef) {
  return {
    toSnapshot() {
      return structuredClone(snapshotRef);
    },
  };
}

function buildBoundaryFixture(seed, mode = "self_care", overrides = {}) {
  const endpointCode =
    mode === "admin_resolution" ? "admin_resolution" : "self_care_and_safety_net";
  const task = {
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    status: "reviewing",
    currentLineageFenceEpoch: 4,
    currentDecisionEpochRef: `decision_epoch_${seed}`,
    activeReviewSessionRef: `review_session_key_${seed}`,
    currentEndpointDecisionRef: `decision_${seed}`,
    latestDecisionSupersessionRef: null,
    surfaceRouteContractRef: `surface_route_contract_${seed}`,
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
  };
  const request = {
    requestId: task.requestId,
    requestLineageRef: `request_lineage_${seed}`,
    currentEvidenceSnapshotRef: `evidence_${seed}`,
    currentSafetyDecisionRef: `safety_decision_${seed}`,
    currentSafetyPreemptionRef: null,
    currentUrgentDiversionSettlementRef: null,
    currentIdentityBindingRef: `subject_binding_${seed}_v1`,
    safetyState: "clear",
  };
  const reviewSession = {
    reviewSessionId: `review_session_${seed}_v1`,
    sessionState: "active",
    selectedAnchorRef: `anchor_${seed}`,
    audienceSurfaceRuntimeBindingRef: `audience_surface_${seed}`,
    surfaceRouteContractRef: `surface_route_contract_${seed}`,
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    workspaceSliceTrustProjectionRef: `trust_projection_${seed}_v1`,
  };
  const endpointBundle = {
    epoch: {
      epochId: `decision_epoch_${seed}`,
      taskId: task.taskId,
      requestId: request.requestId,
      reviewSessionRef: reviewSession.reviewSessionId,
      reviewVersionRef: 2,
      selectedAnchorRef: reviewSession.selectedAnchorRef,
      selectedAnchorTupleHashRef: `anchor_tuple_hash_${seed}`,
      governingSnapshotRef: `governing_snapshot_${seed}`,
      evidenceSnapshotRef: request.currentEvidenceSnapshotRef,
      compiledPolicyBundleRef: "policy_bundle_275_v1",
      safetyDecisionEpochRef: `safety_epoch_${seed}`,
      duplicateLineageRef: null,
      lineageFenceEpoch: 4,
      ownershipEpochRef: 2,
      audienceSurfaceRuntimeBindingRef: reviewSession.audienceSurfaceRuntimeBindingRef,
      surfaceRouteContractRef: reviewSession.surfaceRouteContractRef,
      surfacePublicationRef: reviewSession.surfacePublicationRef,
      runtimePublicationBundleRef: reviewSession.runtimePublicationBundleRef,
      releasePublicationParityRef: `release_parity_${seed}`,
      workspaceSliceTrustProjectionRef: reviewSession.workspaceSliceTrustProjectionRef,
      continuityEvidenceRef: `continuity_${seed}`,
      decisionTupleHash: `decision_tuple_hash_${seed}`,
      epochState: "live",
      createdAt: "2026-04-18T11:00:00.000Z",
      updatedAt: "2026-04-18T11:00:00.000Z",
      supersededAt: null,
      supersededByEpochRef: null,
      version: 1,
    },
    decision: {
      decisionId: `decision_${seed}`,
      taskId: task.taskId,
      requestId: request.requestId,
      decisionEpochRef: `decision_epoch_${seed}`,
      chosenEndpoint: endpointCode,
      decisionVersion: 1,
      payloadHash: `payload_hash_${seed}`,
      reasoningText:
        mode === "admin_resolution"
          ? "Bounded admin is enough for this request."
          : "Informational self-care is sufficient here.",
      payload:
        mode === "admin_resolution"
          ? { adminResolutionSubtypeRef: "demographic_correction" }
          : {},
      requiredApprovalMode: "not_required",
      previewArtifactRef: null,
      previewDigestRef: null,
      approvalAssessmentRef: `approval_assessment_${seed}`,
      boundaryTupleRef: null,
      decisionState: "submitted",
      createdAt: "2026-04-18T11:00:00.000Z",
      updatedAt: "2026-04-18T11:00:00.000Z",
      supersededAt: null,
      supersededByDecisionRef: null,
      version: 1,
    },
    binding: {
      bindingId: `binding_${seed}`,
      taskId: task.taskId,
      decisionId: `decision_${seed}`,
      decisionEpochRef: `decision_epoch_${seed}`,
      boundaryTupleHash: `binding_tuple_hash_${seed}`,
      boundaryDecisionState: "aligned",
      clinicalMeaningState: mode === "admin_resolution" ? "bounded_admin_only" : "informational_only",
      operationalFollowUpScope:
        mode === "admin_resolution" ? "bounded_admin_resolution" : "self_serve_guidance",
      selectedAnchorRef: reviewSession.selectedAnchorRef,
      selectedAnchorTupleHashRef: `anchor_tuple_hash_${seed}`,
      surfaceRouteContractRef: reviewSession.surfaceRouteContractRef,
      surfacePublicationRef: reviewSession.surfacePublicationRef,
      runtimePublicationBundleRef: reviewSession.runtimePublicationBundleRef,
      workspaceSliceTrustProjectionRef: reviewSession.workspaceSliceTrustProjectionRef,
      releaseRecoveryDispositionRef: `release_recovery_${seed}`,
      approvalAssessmentRef: `approval_assessment_${seed}`,
      boundaryTupleRef: null,
      bindingState: "live",
      evaluatedAt: "2026-04-18T11:00:00.000Z",
      version: 1,
    },
    approvalAssessment: {
      approvalRequirementAssessmentId: `approval_assessment_${seed}`,
      taskId: task.taskId,
      requestId: request.requestId,
      decisionEpochRef: `decision_epoch_${seed}`,
      decisionId: `decision_${seed}`,
      endpointCode,
      actionType: endpointCode === "admin_resolution" ? "commit_admin_resolution" : "commit_self_care",
      approvalPolicyMatrixRef: "228.approval-policy-matrix.v1",
      tenantPolicyRef: "tenant_policy_default",
      pathwayRef: endpointCode === "admin_resolution" ? "bounded_admin_resolution" : "self_serve_guidance",
      riskBurdenClass: endpointCode === "admin_resolution" ? "moderate" : "low",
      assistiveProvenanceState: "none",
      sensitiveOverrideState: "none",
      matchedPolicyRuleRefs: ["AP_TEST_275"],
      requiredApprovalMode: "not_required",
      checkpointState: "not_required",
      reasonCodeRefs: ["policy_allows_direct_resolution"],
      approverRoleRefs: [],
      tupleHash: `approval_tuple_hash_${seed}`,
      evaluatedAt: "2026-04-18T11:00:00.000Z",
      version: 1,
    },
    boundaryTuple: null,
    previewArtifact: null,
    latestSupersession: null,
  };
  const approvalBundle = {
    approvalAssessment: {
      requiredApprovalMode: "not_required",
    },
    checkpoint: null,
    escalation: null,
    attempts: [],
    outcome: null,
    reopenRecord: null,
  };
  const directResolutionBundle = {
    settlement: {
      settlementId: `settlement_${seed}`,
      taskId: task.taskId,
      requestId: request.requestId,
      requestLineageRef: request.requestLineageRef,
      decisionEpochRef: endpointBundle.epoch.epochId,
      decisionId: endpointBundle.decision.decisionId,
      endpointCode,
      settlementClass: mode === "admin_resolution" ? "admin_resolution" : "self_care",
      triageTaskStatus: "resolved_without_appointment",
      callbackSeedRef: null,
      clinicianMessageSeedRef: null,
      selfCareStarterRef: mode === "admin_resolution" ? null : `self_care_starter_${seed}`,
      adminResolutionStarterRef:
        mode === "admin_resolution" ? `admin_resolution_starter_${seed}` : null,
      bookingIntentRef: null,
      pharmacyIntentRef: null,
      lineageCaseLinkRef: `lineage_case_link_${seed}`,
      presentationArtifactRef: `presentation_artifact_${seed}`,
      patientStatusProjectionRef: `status_projection_${seed}`,
      lifecycleHookEffectRef: `lifecycle_hook_${seed}`,
      closureEvaluationEffectRef: null,
      settlementState: "settled",
      commandActionRecordRef: `command_action_${seed}`,
      commandSettlementRecordRef: `command_settlement_${seed}`,
      routeIntentBindingRef: `route_intent_${seed}`,
      decisionSupersessionRecordRef: null,
      recordedAt: "2026-04-18T11:00:00.000Z",
      version: 1,
    },
    callbackSeed: null,
    clinicianMessageSeed: null,
    selfCareStarter:
      mode === "admin_resolution"
        ? null
        : {
            selfCareStarterId: `self_care_starter_${seed}`,
            taskId: task.taskId,
            requestId: request.requestId,
            requestLineageRef: request.requestLineageRef,
            decisionEpochRef: endpointBundle.epoch.epochId,
            decisionId: endpointBundle.decision.decisionId,
            boundaryTupleRef: null,
            adviceSummary: "Self-care guidance remains bounded to this evidence tuple.",
            safetyNetAdvice: "Reopen if symptoms worsen or new evidence arrives.",
            commandActionRecordRef: `command_action_${seed}`,
            commandSettlementRecordRef: `command_settlement_${seed}`,
            starterState: "live",
            decisionSupersessionRecordRef: null,
            createdAt: "2026-04-18T11:00:00.000Z",
            updatedAt: "2026-04-18T11:00:00.000Z",
            version: 1,
          },
    adminResolutionStarter:
      mode === "admin_resolution"
        ? {
            adminResolutionStarterId: `admin_resolution_starter_${seed}`,
            taskId: task.taskId,
            requestId: request.requestId,
            requestLineageRef: request.requestLineageRef,
            episodeRef: `episode_${seed}`,
            decisionEpochRef: endpointBundle.epoch.epochId,
            decisionId: endpointBundle.decision.decisionId,
            lineageCaseLinkRef: `lineage_case_link_${seed}`,
            lifecycleLeaseRef: `lifecycle_lease_${seed}`,
            leaseAuthorityRef: "lease_authority_admin_resolution_seed",
            leaseTtlSeconds: 600,
            ownershipEpoch: 2,
            fencingToken: `fencing_token_${seed}`,
            currentLineageFenceEpoch: 4,
            adminResolutionSubtypeRef: "demographic_correction",
            summaryText: "Update demographics through bounded admin flow.",
            commandActionRecordRef: `command_action_${seed}`,
            commandSettlementRecordRef: `command_settlement_${seed}`,
            starterState: "live",
            decisionSupersessionRecordRef: null,
            createdAt: "2026-04-18T11:00:00.000Z",
            updatedAt: "2026-04-18T11:00:00.000Z",
            version: 1,
          }
        : null,
    bookingIntent: null,
    pharmacyIntent: null,
    presentationArtifact: null,
    patientStatusProjection: null,
    outboxEntries: [],
  };
  const endpointActions = [
    {
      decisionId: endpointBundle.decision.decisionId,
      routeIntentBindingRef: `route_intent_${seed}`,
      recordedAt: "2026-04-18T11:00:00.000Z",
    },
  ];

  if (overrides.task) {
    Object.assign(task, overrides.task);
  }
  if (overrides.request) {
    Object.assign(request, overrides.request);
  }
  if (overrides.reviewSession) {
    Object.assign(reviewSession, overrides.reviewSession);
  }
  if (overrides.endpointEpoch) {
    Object.assign(endpointBundle.epoch, overrides.endpointEpoch);
  }
  if (overrides.endpointDecision) {
    Object.assign(endpointBundle.decision, overrides.endpointDecision);
  }
  if (overrides.endpointBinding) {
    Object.assign(endpointBundle.binding, overrides.endpointBinding);
  }
  if (overrides.directResolutionSettlement) {
    Object.assign(directResolutionBundle.settlement, overrides.directResolutionSettlement);
  }

  return {
    task,
    request,
    reviewSession,
    endpointBundle,
    approvalBundle,
    directResolutionBundle,
    endpointActions,
  };
}

function buildBoundaryApp(fixture) {
  return createPhase3SelfCareBoundaryApplication({
    triageApplication: {
      triageRepositories: {
        async getTask(taskId) {
          return taskId === fixture.task.taskId ? document(fixture.task) : null;
        },
        async getReviewSession(reviewSessionRef) {
          return reviewSessionRef === fixture.task.activeReviewSessionRef
            ? document(fixture.reviewSession)
            : null;
        },
      },
      controlPlaneRepositories: {
        async getRequest(requestId) {
          return requestId === fixture.request.requestId ? document(fixture.request) : null;
        },
      },
    },
    endpointApplication: {
      async queryTaskEndpointDecision(taskId) {
        return taskId === fixture.task.taskId ? structuredClone(fixture.endpointBundle) : null;
      },
      decisionRepositories: {
        async listActionRecordsForTask(taskId) {
          return taskId === fixture.task.taskId ? structuredClone(fixture.endpointActions) : [];
        },
      },
    },
    approvalApplication: {
      async queryTaskApprovalEscalation(taskId) {
        return taskId === fixture.task.taskId ? structuredClone(fixture.approvalBundle) : null;
      },
    },
    directResolutionApplication: {
      async queryTaskDirectResolution(taskId) {
        return taskId === fixture.task.taskId
          ? structuredClone(fixture.directResolutionBundle)
          : null;
      },
    },
  });
}

async function classifyBoundary(boundaryApp, taskId, recordedAt = "2026-04-18T11:05:00.000Z") {
  await boundaryApp.classifySelfCareBoundary({
    taskId,
    actorRef: "reviewer_275",
    recordedAt,
    reasonCodeRefs: ["boundary_assurance_classification"],
  });
  return boundaryApp.queryTaskSelfCareBoundary(taskId);
}

async function classifyAndIssueLiveGrant(boundaryApp, taskId, adviceBundleVersionRef) {
  await classifyBoundary(boundaryApp, taskId);
  const queried = await boundaryApp.queryTaskSelfCareBoundary(taskId);
  return boundaryApp.issueAdviceEligibilityGrant({
    taskId,
    boundaryDecisionId:
      queried.boundaryBundle.currentBoundaryDecision.selfCareBoundaryDecisionId,
    actorRef: "reviewer_275",
    issuedAt: "2026-04-18T11:06:00.000Z",
    expiresAt: "2030-01-01T00:00:00.000Z",
    routeFamily: "patient_portal",
    audienceTier: "authenticated",
    channelRef: "portal_web",
    localeRef: "en-GB",
    adviceBundleVersionRef,
  });
}

async function registerRenderableContent(app, bundleId) {
  const approval = await app.registerClinicalContentApprovalRecord({
    pathwayRef: "self_serve_guidance",
    adviceBundleVersionRef: bundleId,
    clinicalIntentRef: "clinical_intent_self_care",
    compiledPolicyBundleRef: "policy_bundle_275_v1",
    approvedAudienceTierRefs: ["authenticated"],
    approvedChannelRefs: ["portal_web"],
    approvedLocaleRefs: ["en-GB"],
    approvedReadingLevelRefs: ["standard"],
    approvedAccessibilityVariantRefs: ["screen_reader"],
    approvalState: "approved",
    approvedByRef: "clinical_reviewer_275",
    approvedAt: "2026-04-18T11:07:00.000Z",
    validFrom: "2026-04-18T11:07:00.000Z",
    validUntil: "2030-01-01T00:00:00.000Z",
  });
  await app.registerContentReviewSchedule({
    pathwayRef: "self_serve_guidance",
    adviceBundleVersionRef: bundleId,
    reviewCadenceRef: "cadence_90d",
    reviewState: "current",
    lastReviewedAt: "2026-04-18T11:08:00.000Z",
    nextReviewDueAt: "2030-01-01T00:00:00.000Z",
    reviewOwnerRef: "clinical_reviewer_275",
  });
  await app.registerAdviceBundleVersion({
    adviceBundleVersionId: bundleId,
    pathwayRef: "self_serve_guidance",
    compiledPolicyBundleRef: "policy_bundle_275_v1",
    clinicalIntentRef: "clinical_intent_self_care",
    audienceTierRefs: ["authenticated"],
    variantSetRef: `variant_family_${bundleId}`,
    safetyNetInstructionSetRef: `safety_net_${bundleId}`,
    effectiveFrom: "2026-04-18T11:09:00.000Z",
    effectiveTo: "2030-01-01T00:00:00.000Z",
    approvalRecordRef: approval.clinicalContentApprovalRecordId,
  });
  return app.registerAdviceVariantSet({
    adviceBundleVersionRef: bundleId,
    channelRef: "portal_web",
    localeRef: "en-GB",
    readingLevelRef: "standard",
    contentBlocksRef: `content_blocks_${bundleId}`,
    previewChecksum: `checksum_${bundleId}`,
    translationVersionRef: `translation_${bundleId}`,
    accessibilityVariantRefs: ["screen_reader"],
    linkedArtifactContractRefs: [`artifact_presentation_contract.${bundleId}`],
  });
}

function buildAdminPolicyFixture(seed, overrides = {}) {
  const boundaryDecision = {
    selfCareBoundaryDecisionId: `boundary_${seed}`,
    taskId: `task_${seed}`,
    requestRef: `request_${seed}`,
    evidenceSnapshotRef: `evidence_${seed}`,
    decisionEpochRef: `decision_epoch_${seed}`,
    decisionSupersessionRecordRef: null,
    decisionState: "admin_resolution",
    clinicalMeaningState: "bounded_admin_only",
    operationalFollowUpScope: "bounded_admin_resolution",
    adminMutationAuthorityState: "bounded_admin_only",
    reasonCodeRefs: ["current_endpoint_admin_resolution"],
    adminResolutionSubtypeRef: "demographic_correction",
    routeIntentBindingRef: `route_intent_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
    lineageFenceEpoch: 4,
    dependencySetRef: `dependency_${seed}`,
    adviceRenderSettlementRef: null,
    adminResolutionCaseRef: null,
    selfCareExperienceProjectionRef: null,
    adminResolutionExperienceProjectionRef: null,
    reopenTriggerRefs: [],
    reopenState: "stable",
    boundaryState: "live",
    boundaryTupleHash: `boundary_tuple_${seed}`,
    compiledPolicyBundleRef: "policy_bundle_251_v1",
    decidedAt: "2026-04-18T12:00:00.000Z",
    version: 1,
  };
  const adminResolutionStarter = {
    adminResolutionStarterId: `admin_resolution_starter_${seed}`,
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    requestLineageRef: `request_lineage_${seed}`,
    episodeRef: `episode_${seed}`,
    decisionEpochRef: `decision_epoch_${seed}`,
    decisionId: `decision_${seed}`,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    lifecycleLeaseRef: `lifecycle_lease_${seed}`,
    leaseAuthorityRef: "lease_authority_admin_resolution_seed",
    leaseTtlSeconds: 600,
    ownershipEpoch: 2,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 4,
    adminResolutionSubtypeRef: "demographic_correction",
    summaryText: "Update demographics through bounded admin flow.",
    commandActionRecordRef: `command_action_${seed}`,
    commandSettlementRecordRef: `command_settlement_${seed}`,
    starterState: "live",
    decisionSupersessionRecordRef: null,
    createdAt: "2026-04-18T12:00:00.000Z",
    updatedAt: "2026-04-18T12:00:00.000Z",
    version: 1,
  };

  const fixture = {
    boundaryDecision,
    adminResolutionStarter,
    bundle: {
      boundaryBundle: {
        currentBoundaryDecision: boundaryDecision,
        currentAdviceEligibilityGrant: null,
        boundaryDecisions: [boundaryDecision],
        adviceEligibilityGrants: [],
        latestBoundarySupersessionRecord: null,
        latestGrantTransitionRecord: null,
      },
      endpointBundle: null,
      approvalBundle: null,
      directResolutionBundle: {
        settlement: {
          settlementId: `settlement_${seed}`,
          taskId: `task_${seed}`,
          requestId: `request_${seed}`,
          requestLineageRef: `request_lineage_${seed}`,
          decisionEpochRef: `decision_epoch_${seed}`,
          decisionId: `decision_${seed}`,
          endpointCode: "admin_resolution",
          settlementClass: "direct_resolution",
          triageTaskStatus: "resolved_without_appointment",
          callbackSeedRef: null,
          clinicianMessageSeedRef: null,
          selfCareStarterRef: null,
          adminResolutionStarterRef: `admin_resolution_starter_${seed}`,
          bookingIntentRef: null,
          pharmacyIntentRef: null,
          lineageCaseLinkRef: `lineage_case_link_${seed}`,
          presentationArtifactRef: `presentation_${seed}`,
          patientStatusProjectionRef: `status_projection_${seed}`,
          lifecycleHookEffectRef: `lifecycle_hook_${seed}`,
          closureEvaluationEffectRef: null,
          settlementState: "settled",
          commandActionRecordRef: `command_action_${seed}`,
          commandSettlementRecordRef: `command_settlement_${seed}`,
          routeIntentBindingRef: `route_intent_${seed}`,
          decisionSupersessionRecordRef: null,
          recordedAt: "2026-04-18T12:00:00.000Z",
          version: 1,
        },
        callbackSeed: null,
        clinicianMessageSeed: null,
        selfCareStarter: null,
        adminResolutionStarter,
        bookingIntent: null,
        pharmacyIntent: null,
        presentationArtifact: null,
        patientStatusProjection: null,
        outboxEntries: [],
      },
      effectiveAdviceGrantState: null,
      effectiveAdviceGrantReasonCodeRefs: [],
    },
  };

  if (overrides.boundaryDecision) {
    Object.assign(boundaryDecision, overrides.boundaryDecision);
  }
  if (overrides.adminResolutionStarter) {
    Object.assign(adminResolutionStarter, overrides.adminResolutionStarter);
  }

  return fixture;
}

function buildAdminPolicyApplication(fixture) {
  return createPhase3AdminResolutionPolicyApplication({
    selfCareBoundaryApplication: {
      async queryTaskSelfCareBoundary() {
        return fixture.bundle;
      },
    },
  });
}

function buildDependencyFixture(seed, overrides = {}) {
  const task = {
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    queueKey: "routine_triage",
    assignedTo: null,
    status: "resolved_without_appointment",
    reviewVersion: 4,
    ownershipEpoch: 2,
    fencingToken: `fencing_${seed}`,
    currentLineageFenceEpoch: 6,
    ownershipState: "owned",
    reviewFreshnessState: "fresh",
    launchContextRef: `launch_${seed}`,
    workspaceTrustEnvelopeRef: `trust_${seed}`,
    surfaceRouteContractRef: "workspace.task",
    surfacePublicationRef: "publication.task",
    runtimePublicationBundleRef: "runtime.task",
    taskCompletionSettlementEnvelopeRef: `completion_${seed}`,
    lifecycleLeaseRef: `lease_${seed}`,
    leaseAuthorityRef: "lease_authority_triage",
    leaseTtlSeconds: 300,
    lastHeartbeatAt: "2026-04-18T11:59:00.000Z",
    staleOwnerRecoveryRef: null,
    activeReviewSessionRef: `review_session_${seed}`,
    duplicateClusterRef: null,
    currentEndpointDecisionRef: `endpoint_${seed}`,
    currentDecisionEpochRef: `decision_epoch_${seed}`,
    latestDecisionSupersessionRef: null,
    duplicateResolutionDecisionRef: null,
    duplicateReviewSnapshotRef: null,
    releaseRecoveryDispositionRef: null,
    createdAt: "2026-04-18T11:00:00.000Z",
    updatedAt: "2026-04-18T12:00:00.000Z",
    version: 1,
  };

  const request = {
    requestId: `request_${seed}`,
    episodeId: `episode_${seed}`,
    originEnvelopeRef: `origin_${seed}`,
    promotionRecordRef: `promotion_${seed}`,
    requestVersion: 1,
    tenantId: "tenant_252",
    sourceChannel: "support_assisted_capture",
    originIngressRecordRef: `ingress_${seed}`,
    normalizedSubmissionRef: `normalized_${seed}`,
    requestType: "clinical_question",
    narrativeRef: null,
    structuredDataRef: null,
    attachmentRefs: [],
    contactPreferencesRef: null,
    workflowState: "triage_active",
    safetyState: "needs_review",
    identityState: "claimed",
    priorityBand: null,
    pathwayRef: null,
    assignedQueueRef: null,
    patientRef: null,
    currentIdentityBindingRef: `identity_binding_${seed}`,
    currentEvidenceSnapshotRef: `evidence_${seed}`,
    currentEvidenceAssimilationRef: null,
    currentMaterialDeltaAssessmentRef: null,
    currentEvidenceClassificationRef: null,
    currentSafetyPreemptionRef: null,
    currentSafetyDecisionRef: null,
    currentUrgentDiversionSettlementRef: null,
    safetyDecisionEpoch: 1,
    requestLineageRef: `lineage_${seed}`,
    currentTriageTaskRef: `task_${seed}`,
    latestLineageCaseLinkRef: null,
    activeLineageCaseLinkRefs: [],
    currentConfirmationGateRefs: [],
    currentClosureBlockerRefs: [],
    slaClockRef: null,
    createdAt: "2026-04-18T11:00:00.000Z",
    updatedAt: "2026-04-18T12:00:00.000Z",
    version: 1,
  };

  const boundaryDecision = {
    selfCareBoundaryDecisionId: `boundary_${seed}`,
    taskId: `task_${seed}`,
    requestRef: `request_${seed}`,
    evidenceSnapshotRef: `evidence_${seed}`,
    decisionEpochRef: `decision_epoch_${seed}`,
    decisionSupersessionRecordRef: null,
    decisionState: "admin_resolution",
    clinicalMeaningState: "bounded_admin_only",
    operationalFollowUpScope: "bounded_admin_resolution",
    adminMutationAuthorityState: "bounded_admin_only",
    reasonCodeRefs: ["current_endpoint_admin_resolution"],
    adminResolutionSubtypeRef: "registration_or_demographic_update",
    routeIntentBindingRef: `route_intent_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
    lineageFenceEpoch: 6,
    dependencySetRef: null,
    adviceRenderSettlementRef: `advice_render_${seed}`,
    adminResolutionCaseRef: `admin_case_${seed}`,
    selfCareExperienceProjectionRef: null,
    adminResolutionExperienceProjectionRef: null,
    reopenTriggerRefs: [],
    reopenState: "stable",
    boundaryState: "live",
    boundaryTupleHash: `boundary_tuple_${seed}`,
    compiledPolicyBundleRef: "policy_bundle_252_v1",
    decidedAt: "2026-04-18T12:00:00.000Z",
    version: 1,
  };

  const adviceRenderBundle = {
    renderBundle: {
      currentRenderSettlement: {
        adviceRenderSettlementId: `advice_render_${seed}`,
        boundaryDecisionRef: `boundary_${seed}`,
        boundaryTupleHash: `boundary_tuple_${seed}`,
        decisionEpochRef: `decision_epoch_${seed}`,
        renderState: "renderable",
        trustState: "trusted",
      },
    },
    effectiveRenderState: "renderable",
    effectiveReasonCodeRefs: [],
  };

  const adminResolutionBundle = {
    adminResolutionBundle: {
      currentAdminResolutionCase: {
        adminResolutionCaseId: `admin_case_${seed}`,
        adminResolutionSubtypeRef: "registration_or_demographic_update",
        decisionEpochRef: `decision_epoch_${seed}`,
        caseState: "queued",
        waitingState: "none",
        waitingDependencyShape: null,
        waitingReasonCodeRef: null,
        waitingExpiryOrRepairRuleRef: null,
        caseVersionRef: `case_version_${seed}`,
      },
    },
    continuityEvaluation: {
      effectiveCaseState: "queued",
    },
    effectiveCaseState: "queued",
    effectiveReasonCodeRefs: [],
    normalizedBoundarySubtypeRef: "registration_or_demographic_update",
  };

  const communicationRepairBundle = {
    taskId: `task_${seed}`,
    callbackRepair: null,
    messageRepair: null,
  };

  const conversationProjection = {
    taskId: `task_${seed}`,
    controlCluster: {
      digest: {
        digestId: `digest_${seed}`,
        latestSettlementRef: `settlement_${seed}`,
        latestReceiptEnvelopeRef: `receipt_${seed}`,
        deliveryDisputeState: "none",
        reachabilityDependencyRef: "",
        contactRepairJourneyRef: "",
        reachabilityEpoch: 0,
        repairRequiredState: "none",
        recoveryRouteRef: "",
      },
      activeComposerLease: null,
      urgentDiversion: null,
    },
  };

  if (overrides.task) Object.assign(task, overrides.task);
  if (overrides.request) Object.assign(request, overrides.request);
  if (overrides.boundaryDecision) Object.assign(boundaryDecision, overrides.boundaryDecision);
  if (overrides.adviceRenderSettlement) {
    Object.assign(adviceRenderBundle.renderBundle.currentRenderSettlement, overrides.adviceRenderSettlement);
  }
  if (overrides.adminResolutionCase) {
    Object.assign(adminResolutionBundle.adminResolutionBundle.currentAdminResolutionCase, overrides.adminResolutionCase);
  }
  if (overrides.digest) {
    Object.assign(conversationProjection.controlCluster.digest, overrides.digest);
  }
  if (overrides.activeComposerLease !== undefined) {
    conversationProjection.controlCluster.activeComposerLease = overrides.activeComposerLease;
  }
  if (overrides.urgentDiversion !== undefined) {
    conversationProjection.controlCluster.urgentDiversion = overrides.urgentDiversion;
  }
  if (overrides.messageRepair !== undefined) {
    communicationRepairBundle.messageRepair = overrides.messageRepair;
  }
  if (overrides.callbackRepair !== undefined) {
    communicationRepairBundle.callbackRepair = overrides.callbackRepair;
  }
  if (overrides.adminReasonCodeRefs) {
    adminResolutionBundle.effectiveReasonCodeRefs = overrides.adminReasonCodeRefs;
  }
  if (overrides.renderReasonCodeRefs) {
    adviceRenderBundle.effectiveReasonCodeRefs = overrides.renderReasonCodeRefs;
  }

  return {
    task,
    request,
    selfCareBoundaryBundle: {
      boundaryBundle: {
        currentBoundaryDecision: boundaryDecision,
      },
    },
    adviceRenderBundle,
    adminResolutionBundle,
    communicationRepairBundle,
    conversationProjection,
  };
}

function buildDependencyApplication(fixture, overrides = {}) {
  return createPhase3AdviceAdminDependencyApplication({
    triageApplication: {
      triageRepositories: {
        async getTask() {
          return document(fixture.task);
        },
      },
      controlPlaneRepositories: {
        async getRequest() {
          return document(fixture.request);
        },
      },
    },
    selfCareBoundaryApplication: {
      async queryTaskSelfCareBoundary() {
        return fixture.selfCareBoundaryBundle;
      },
    },
    adviceRenderApplication: {
      async queryTaskAdviceRender() {
        return fixture.adviceRenderBundle;
      },
    },
    adminResolutionApplication: {
      async queryTaskAdminResolution() {
        return fixture.adminResolutionBundle;
      },
    },
    communicationRepairApplication: {
      async queryTaskCommunicationRepair() {
        return fixture.communicationRepairBundle;
      },
    },
    patientConversationProjectionApplication: {
      async queryTaskPatientConversationProjection() {
        return fixture.conversationProjection;
      },
    },
    identityBlockingPort:
      overrides.identityBlockingPort ?? {
        async queryRequestIdentityBlocking() {
          return null;
        },
      },
  });
}

function buildSettlementContinuityBundle(seed, mode = "interactive") {
  const isRecovery = mode === "recovery_required";
  return {
    task: {
      taskId: `task_${seed}`,
      taskCompletionSettlementEnvelopeRef: `task_completion_envelope_${seed}_${mode}`,
      fencingToken: `fencing_token_${seed}_${mode}`,
    },
    reviewSession: {
      reviewSessionId: `review_session_${seed}_${mode}`,
      surfaceRouteContractRef: "surface_route_contract.workspace.admin_resolution",
      surfacePublicationRef: "surface_publication.workspace.admin_resolution.current",
      runtimePublicationBundleRef: "runtime_publication_bundle.workspace.admin_resolution.current",
      selectedAnchorRef: `anchor_${seed}_${mode}`,
      reviewActionLeaseRef: `review_action_lease_${seed}_${mode}`,
    },
    launchContext: {},
    completionEnvelope: {
      taskCompletionSettlementEnvelopeId: `task_completion_envelope_${seed}_${mode}`,
    },
    operatorHandoffFrame: null,
    workspaceContinuityEvidenceProjection: {
      workspaceContinuityEvidenceProjectionId: `workspace_continuity_projection_${seed}_${mode}`,
      validationState: isRecovery ? "blocked" : "trusted",
    },
    workspaceTrustEnvelope: {
      workspaceTrustEnvelopeId: `workspace_trust_envelope_${seed}_${mode}`,
      envelopeState: mode,
      mutationAuthorityState: isRecovery ? "recovery_only" : "live",
      workspaceConsistencyProjectionRef: `workspace_consistency_projection_${seed}_${mode}`,
      workspaceSliceTrustProjectionRef: `workspace_slice_trust_projection_${seed}_${mode}`,
      blockingReasonRefs: isRecovery ? ["reopen_requires_review"] : [],
    },
    nextTaskLaunchLease: null,
    directResolution: {},
    approval: {},
    reopenRecord: null,
  };
}

function buildSettlementFixture(seed, overrides = {}) {
  const boundaryDecision = {
    selfCareBoundaryDecisionId: `boundary_${seed}`,
    requestRef: `request_${seed}`,
    boundaryTupleHash: `boundary_tuple_${seed}`,
    decisionEpochRef: `decision_epoch_${seed}`,
    decisionSupersessionRecordRef: null,
    clinicalMeaningState: "bounded_admin_only",
    operationalFollowUpScope: "bounded_admin_resolution",
    adminMutationAuthorityState: "bounded_admin_only",
    reopenState: "stable",
    boundaryState: "live",
    reasonCodeRefs: ["admin_resolution_boundary_current"],
    routeIntentBindingRef: `route_intent_binding_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
  };
  const currentCase = {
    adminResolutionCaseId: `admin_case_${seed}`,
    boundaryDecisionRef: boundaryDecision.selfCareBoundaryDecisionId,
    boundaryTupleHash: boundaryDecision.boundaryTupleHash,
    decisionEpochRef: boundaryDecision.decisionEpochRef,
    dependencySetRef: `dependency_set_${seed}`,
    policyBundleRef: "policy_bundle_254_v1",
    lineageFenceEpoch: 4,
    clinicalMeaningState: "bounded_admin_only",
    operationalFollowUpScope: "bounded_admin_resolution",
    adminMutationAuthorityState: "bounded_admin_only",
    reopenState: "stable",
    waitingState: "none",
    releaseWatchRef: `release_watch_${seed}`,
    caseState: "queued",
  };
  const currentCompletionArtifact = {
    adminResolutionCompletionArtifactId: `completion_artifact_${seed}`,
    patientExpectationTemplateRef: `patient_expectation_template_${seed}`,
    visibilityTier: "patient_authenticated",
    summarySafetyTier: "clinical_safe_summary",
    placeholderContractRef: "placeholder_contract.admin_resolution.default",
    releaseState: "current",
  };
  const currentSubtypeProfile = {
    patientExpectationTemplateRef: `patient_expectation_template_${seed}`,
  };
  const dependencySet = {
    adviceAdminDependencySetId: `dependency_set_${seed}`,
    reasonCodeRefs: [],
  };
  const dependencyProjection = {
    canContinueCurrentConsequence: true,
    reopenState: "stable",
    dominantRecoveryRouteRef: `/workspace/task/task_${seed}/admin-resolution`,
    dominantBlockerRef: null,
  };
  const continuity = {
    current: buildSettlementContinuityBundle(seed, "interactive"),
    recovery: buildSettlementContinuityBundle(seed, "recovery_required"),
  };

  const fixture = {
    boundaryDecision,
    currentCase,
    currentCompletionArtifact,
    currentSubtypeProfile,
    dependencySet,
    dependencyProjection,
    continuity,
  };

  if (overrides.boundaryDecision) Object.assign(boundaryDecision, overrides.boundaryDecision);
  if (overrides.currentCase) Object.assign(currentCase, overrides.currentCase);
  if (Object.prototype.hasOwnProperty.call(overrides, "currentCompletionArtifact")) {
    fixture.currentCompletionArtifact = overrides.currentCompletionArtifact;
  }
  if (overrides.currentSubtypeProfile) Object.assign(currentSubtypeProfile, overrides.currentSubtypeProfile);
  if (overrides.dependencySet) Object.assign(dependencySet, overrides.dependencySet);
  if (overrides.dependencyProjection) Object.assign(dependencyProjection, overrides.dependencyProjection);

  return fixture;
}

function buildSettlementApplication(fixture) {
  const selfCareBoundaryBundle = {
    boundaryBundle: {
      currentBoundaryDecision: fixture.boundaryDecision,
      currentAdviceEligibilityGrant: {
        audienceTier: "patient_authenticated",
      },
    },
  };
  const adminResolutionPolicyBundle = {
    adminResolutionBundle: {
      currentAdminResolutionCase: fixture.currentCase,
      currentCompletionArtifact: fixture.currentCompletionArtifact,
      currentSubtypeProfile: fixture.currentSubtypeProfile,
    },
    selfCareBoundaryBundle,
    continuityEvaluation: {},
    effectiveCaseState: fixture.currentCase.caseState,
    effectiveReasonCodeRefs: [],
    normalizedBoundarySubtypeRef: "registration_or_demographic_update",
    normalizedStarterSubtypeRef: "registration_or_demographic_update",
  };
  const dependencyBundle = {
    dependencyBundle: {
      currentAdviceAdminDependencySet: fixture.dependencySet,
    },
    projection: fixture.dependencyProjection,
    triageTask: null,
    selfCareBoundaryBundle,
    adviceRenderBundle: null,
    adminResolutionBundle: adminResolutionPolicyBundle,
    communicationRepairBundle: null,
    conversationProjection: null,
    identityBlocking: null,
    currentBoundaryTupleHash: fixture.boundaryDecision.boundaryTupleHash,
    currentDecisionEpochRef: fixture.boundaryDecision.decisionEpochRef,
    currentDependencySetRef: fixture.currentCase.dependencySetRef,
  };
  const analyticsBundle = {
    analyticsBundle: {
      patientExpectationTemplates: [],
      templateVersions: [],
      templateVariants: [],
      analyticsRecords: [],
      watchWindows: [],
    },
    selfCareBoundaryBundle,
    adviceRenderBundle: null,
    adminResolutionBundle: adminResolutionPolicyBundle,
    dependencyBundle,
    currentExpectationResolution: fixture.currentCompletionArtifact
      ? {
          patientExpectationTemplateRef:
            fixture.currentCompletionArtifact.patientExpectationTemplateRef,
        }
      : null,
    currentFollowUpWatchWindow: null,
  };

  return createPhase3AdminResolutionSettlementApplication({
    selfCareBoundaryApplication: {
      async queryTaskSelfCareBoundary() {
        return selfCareBoundaryBundle;
      },
    },
    adminResolutionPolicyApplication: {
      async queryTaskAdminResolution() {
        return adminResolutionPolicyBundle;
      },
    },
    dependencyApplication: {
      async queryTaskAdviceAdminDependency() {
        return dependencyBundle;
      },
    },
    analyticsApplication: {
      async queryTaskSelfCareOutcomeAnalytics() {
        return analyticsBundle;
      },
    },
    taskCompletionContinuityApplication: {
      async queryTaskCompletionContinuity() {
        return fixture.continuity.current;
      },
      async settleTaskCompletion() {
        return fixture.continuity.current;
      },
      async computeContinuityEvidence() {
        return fixture.continuity.current;
      },
      async invalidateStaleContinuity() {
        return fixture.continuity.recovery;
      },
    },
    reopenLaunchApplication: {
      async reopenFromInvalidation() {
        return {
          reopenRecord: {
            reopenRecordId: `reopen_record_${fixture.currentCase.adminResolutionCaseId}`,
          },
          decisionSupersessionRecordRef: `decision_supersession_${fixture.currentCase.adminResolutionCaseId}`,
          reopenedTaskTransition: null,
          queuedTaskTransition: {
            task: {
              taskId: `task_${fixture.currentCase.adminResolutionCaseId.replace("admin_case_", "")}`,
            },
          },
          launchContext: {},
          priorityAdjustment: {},
        };
      },
    },
  });
}

describe("275 phase 3 self-care, admin-resolution, and reopen assurance", () => {
  it("keeps self-care, bounded admin, reopened review, and blocked stale epochs separated by the canonical boundary decision", async () => {
    const selfCareFixture = buildBoundaryFixture("275_self_care", "self_care");
    const adminFixture = buildBoundaryFixture("275_admin", "admin_resolution");
    const reopenedFixture = buildBoundaryFixture("275_reopened", "admin_resolution", {
      task: { status: "reopened" },
    });
    const staleEpochFixture = buildBoundaryFixture("275_stale_epoch", "admin_resolution", {
      endpointEpoch: { epochState: "superseded" },
    });

    const selfCareBoundary = await classifyBoundary(buildBoundaryApp(selfCareFixture), "task_275_self_care");
    const adminBoundary = await classifyBoundary(buildBoundaryApp(adminFixture), "task_275_admin");
    const reopenedBoundary = await classifyBoundary(
      buildBoundaryApp(reopenedFixture),
      "task_275_reopened",
    );
    const staleEpochBoundary = await classifyBoundary(
      buildBoundaryApp(staleEpochFixture),
      "task_275_stale_epoch",
    );

    expect(selfCareBoundary.boundaryBundle.currentBoundaryDecision.decisionState).toBe("self_care");
    expect(selfCareBoundary.boundaryBundle.currentBoundaryDecision.clinicalMeaningState).toBe(
      "informational_only",
    );
    expect(selfCareBoundary.boundaryBundle.currentBoundaryDecision.operationalFollowUpScope).toBe(
      "self_serve_guidance",
    );

    expect(adminBoundary.boundaryBundle.currentBoundaryDecision.decisionState).toBe("admin_resolution");
    expect(adminBoundary.boundaryBundle.currentBoundaryDecision.clinicalMeaningState).toBe(
      "bounded_admin_only",
    );
    expect(adminBoundary.boundaryBundle.currentBoundaryDecision.operationalFollowUpScope).toBe(
      "bounded_admin_resolution",
    );

    expect(reopenedBoundary.boundaryBundle.currentBoundaryDecision.decisionState).toBe(
      "clinician_review_required",
    );
    expect(reopenedBoundary.boundaryBundle.currentBoundaryDecision.boundaryState).toBe(
      "reopened",
    );
    expect(reopenedBoundary.boundaryBundle.currentBoundaryDecision.reopenState).toBe("reopened");
    expect(reopenedBoundary.boundaryBundle.currentBoundaryDecision.reasonCodeRefs).toContain(
      "task_reopened_requires_clinician_review",
    );

    expect(staleEpochBoundary.boundaryBundle.currentBoundaryDecision.decisionState).toBe(
      "blocked_pending_review",
    );
    expect(staleEpochBoundary.boundaryBundle.currentBoundaryDecision.boundaryState).toBe("blocked");
    expect(staleEpochBoundary.boundaryBundle.currentBoundaryDecision.reopenState).toBe(
      "blocked_pending_review",
    );
    expect(staleEpochBoundary.boundaryBundle.currentBoundaryDecision.reasonCodeRefs).toContain(
      "decision_epoch_not_live",
    );
  });

  it("binds renderable advice and the patient expectation summary to the current approval, bundle, and release tuple", async () => {
    const fixture = buildBoundaryFixture("275_advice_live", "self_care");
    const boundaryApp = buildBoundaryApp(fixture);
    const renderApp = createPhase3AdviceRenderApplication({
      selfCareBoundaryApplication: boundaryApp,
    });

    await classifyAndIssueLiveGrant(
      boundaryApp,
      fixture.task.taskId,
      "advice_bundle_275_live_render_v1",
    );
    const variant = await registerRenderableContent(renderApp, "advice_bundle_275_live_render_v1");
    const rendered = await renderApp.renderAdvice({
      taskId: fixture.task.taskId,
      actorRef: "reviewer_275",
      settledAt: "2026-04-18T11:10:00.000Z",
      readingLevelRef: "standard",
      accessibilityVariantRefs: ["screen_reader"],
    });

    const analyticsApp = createPhase3SelfCareOutcomeAnalyticsApplication({
      selfCareBoundaryApplication: boundaryApp,
      adviceRenderApplication: renderApp,
      adminResolutionApplication: {
        async queryTaskAdminResolution() {
          return {
            adminResolutionBundle: {
              currentAdminResolutionCase: null,
              currentCompletionArtifact: null,
              currentSubtypeProfile: null,
            },
            effectiveReasonCodeRefs: [],
          };
        },
      },
      dependencyApplication: {
        async queryTaskAdviceAdminDependency() {
          return {
            projection: {
              canContinueCurrentConsequence: true,
              currentAdviceAdminDependencySet: { reasonCodeRefs: [] },
            },
          };
        },
      },
    });

    const analytics = await analyticsApp.queryTaskSelfCareOutcomeAnalytics(fixture.task.taskId);

    expect(rendered.renderBundle.currentRenderSettlement.renderState).toBe("renderable");
    expect(rendered.effectiveRenderState).toBe("renderable");
    expect(rendered.selectedAdviceVariantSet.adviceVariantSetId).toBe(
      variant.adviceVariantSetId,
    );
    expect(rendered.renderBundle.currentRenderSettlement.artifactPresentationContractRef).toBe(
      "artifact_presentation_contract.advice_bundle_275_live_render_v1",
    );
    expect(analytics.currentExpectationResolution.patientExpectationTemplateRef).toBe(
      "patient_expectation_template.self_care.self_serve_guidance",
    );
  });

  it("freezes fresh advice posture when evidence or release trust drifts underneath the current settlement", async () => {
    const driftFixture = buildBoundaryFixture("275_advice_drift", "self_care");
    const driftBoundaryApp = buildBoundaryApp(driftFixture);
    const driftApp = createPhase3AdviceRenderApplication({
      selfCareBoundaryApplication: driftBoundaryApp,
    });

    await classifyAndIssueLiveGrant(
      driftBoundaryApp,
      driftFixture.task.taskId,
      "advice_bundle_275_drift_v1",
    );
    await registerRenderableContent(driftApp, "advice_bundle_275_drift_v1");
    await driftApp.renderAdvice({
      taskId: driftFixture.task.taskId,
      actorRef: "reviewer_275",
      settledAt: "2026-04-18T11:10:00.000Z",
      readingLevelRef: "standard",
      accessibilityVariantRefs: ["screen_reader"],
    });

    driftFixture.request.currentEvidenceSnapshotRef = "evidence_275_advice_drift_v2";
    const invalidated = await driftApp.queryTaskAdviceRender(driftFixture.task.taskId);
    expect(invalidated.effectiveRenderState).toBe("invalidated");
    expect(invalidated.effectiveReasonCodeRefs).toContain("evidence_snapshot_drift");
    expect(invalidated.effectiveReasonCodeRefs).toContain("advice_grant_invalidated");

    const quarantineFixture = buildBoundaryFixture("275_advice_quarantine", "self_care");
    const quarantineBoundaryApp = buildBoundaryApp(quarantineFixture);
    const quarantineApp = createPhase3AdviceRenderApplication({
      selfCareBoundaryApplication: quarantineBoundaryApp,
    });
    await classifyAndIssueLiveGrant(
      quarantineBoundaryApp,
      quarantineFixture.task.taskId,
      "advice_bundle_275_quarantine_v1",
    );
    await registerRenderableContent(quarantineApp, "advice_bundle_275_quarantine_v1");
    const quarantined = await quarantineApp.renderAdvice({
      taskId: quarantineFixture.task.taskId,
      actorRef: "reviewer_275",
      settledAt: "2026-04-18T11:10:00.000Z",
      readingLevelRef: "standard",
      accessibilityVariantRefs: ["screen_reader"],
      releaseTrustState: "quarantined",
    });

    expect(quarantined.effectiveRenderState).toBe("quarantined");
    expect(quarantined.renderBundle.currentRenderSettlement.trustState).toBe("quarantined");
    expect(quarantined.effectiveReasonCodeRefs).toContain("release_trust_quarantined");
  });

  it("keeps admin waiting typed, rejects completion without an artifact, and settles only with the current artifact and expectation tuple", async () => {
    const adminFixture = buildAdminPolicyFixture("275_admin_waiting");
    const adminApp = buildAdminPolicyApplication(adminFixture);

    const opened = await adminApp.openAdminResolutionCase({
      taskId: "task_275_admin_waiting",
      actorRef: "actor_275",
      openedAt: "2026-04-18T12:05:00.000Z",
    });
    const waiting = await adminApp.enterAdminResolutionWaitingState({
      taskId: "task_275_admin_waiting",
      adminResolutionCaseId:
        opened.adminResolutionBundle.currentAdminResolutionCase.adminResolutionCaseId,
      waitingState: "identity_verification",
      waitingReasonCodeRef: "identity_evidence_requested",
      dependencyShape: "identity_verification",
      ownerRef: "actor_275",
      slaClockSourceRef: "sla_clock.identity_verification",
      expiryOrRepairRuleRef: "expiry_or_repair.identity_verification",
      recordedAt: "2026-04-18T12:10:00.000Z",
    });

    expect(waiting.adminResolutionBundle.currentAdminResolutionCase.caseState).toBe("waiting");
    expect(waiting.adminResolutionBundle.currentAdminResolutionCase.waitingState).toBe(
      "identity_verification",
    );
    expect(waiting.effectiveCaseState).toBe("waiting");

    const missingArtifactFixture = buildSettlementFixture("275_missing_artifact", {
      currentCompletionArtifact: null,
    });
    const missingArtifactApp = buildSettlementApplication(missingArtifactFixture);
    await expect(
      missingArtifactApp.settleAdminCompletion({
        taskId: "task_275_missing_artifact",
        adminResolutionCaseId: "admin_case_275_missing_artifact",
        actorRef: "actor_275",
        recordedAt: "2026-04-18T12:12:00.000Z",
      }),
    ).rejects.toThrow(/ADMIN_RESOLUTION_COMPLETION_ARTIFACT_REQUIRED|completion artifact/i);

    const validSettlementFixture = buildSettlementFixture("275_valid_completion");
    const validSettlementApp = buildSettlementApplication(validSettlementFixture);
    const settled = await validSettlementApp.settleAdminCompletion({
      taskId: "task_275_valid_completion",
      adminResolutionCaseId: "admin_case_275_valid_completion",
      actorRef: "actor_275",
      recordedAt: "2026-04-18T12:15:00.000Z",
    });

    expect(settled.settlementBundle.currentSettlement.result).toBe("completed");
    expect(settled.settlementBundle.currentSettlement.completionArtifactRef).toBe(
      "completion_artifact_275_valid_completion",
    );
    expect(settled.settlementBundle.currentSettlement.patientExpectationTemplateRef).toBe(
      "patient_expectation_template_275_valid_completion",
    );
  });

  it("derives dependency blockers and reopen triggers from the canonical dependency set and preserves provenance when bounded admin reopens", async () => {
    const repairFixture = buildDependencyFixture("275_repair", {
      messageRepair: {
        binding: {
          bindingState: "repair_required",
          reachabilityDependencyRef: "reachability_dependency_275",
          activeRepairJourneyRef: "repair_journey_275",
          currentReachabilityEpoch: 3,
          recoveryRouteRef: "/workspace/tasks/task_275_repair/communications/repair",
        },
        assessment: {
          assessmentState: "blocked",
          routeAuthorityState: "stale_verification",
        },
      },
    });
    const repairApp = buildDependencyApplication(repairFixture);
    const repairResult = await repairApp.evaluateAdviceAdminDependencySet({
      taskId: "task_275_repair",
      actorRef: "actor_275",
      evaluatedAt: "2026-04-18T12:20:00.000Z",
    });
    expect(repairResult.dependencyBundle.currentAdviceAdminDependencySet.dependencyState).toBe(
      "repair_required",
    );
    expect(
      repairResult.dependencyBundle.currentAdviceAdminDependencySet.dominantRecoveryRouteRef,
    ).toBe("/workspace/tasks/task_275_repair/communications/repair");

    const identityFixture = buildDependencyFixture("275_identity", {
      adviceRenderSettlement: {
        renderState: "invalidated",
      },
      activeComposerLease: {
        consentCheckpointRef: "consent_checkpoint_275",
      },
    });
    const identityApp = buildDependencyApplication(identityFixture, {
      identityBlockingPort: {
        async queryRequestIdentityBlocking() {
          return {
            requestRef: "request_275_identity",
            identityRepairCaseRef: "identity_case_275",
            blockingVersionRef: "identity_version_275",
            blockingState: "blocked_pending_identity",
            recoveryRouteRef: "/workspace/tasks/task_275_identity/identity-repair",
            reasonCodeRefs: ["identity_blocking_required"],
          };
        },
      },
    });
    const identityResult = await identityApp.refreshAdviceAdminDependencySet({
      taskId: "task_275_identity",
      actorRef: "actor_275",
      evaluatedAt: "2026-04-18T12:22:00.000Z",
    });
    expect(identityResult.dependencyBundle.currentAdviceAdminDependencySet.dependencyState).toBe(
      "blocked_pending_identity",
    );
    expect(identityResult.dependencyBundle.currentAdviceAdminDependencySet.reopenState).toBe(
      "reopen_required",
    );
    expect(identityResult.dependencyBundle.currentAdviceAdminDependencySet.reasonCodeRefs).toContain(
      "advice_render_invalidated_requires_reopen",
    );

    const reopenedFixture = buildSettlementFixture("275_reopen_for_review", {
      boundaryDecision: {
        reopenState: "reopen_required",
        boundaryState: "reopened",
        clinicalMeaningState: "clinician_reentry_required",
        operationalFollowUpScope: "none",
        adminMutationAuthorityState: "frozen",
      },
      currentCase: {
        reopenState: "reopen_required",
        clinicalMeaningState: "clinician_reentry_required",
        operationalFollowUpScope: "none",
        adminMutationAuthorityState: "frozen",
      },
      dependencyProjection: {
        canContinueCurrentConsequence: false,
        reopenState: "reopen_required",
        dominantRecoveryRouteRef: "/workspace/task/task_275_reopen_for_review/decision",
      },
    });
    const reopenedApp = buildSettlementApplication(reopenedFixture);
    const reopened = await reopenedApp.reopenAdminResolutionForReview({
      taskId: "task_275_reopen_for_review",
      adminResolutionCaseId: "admin_case_275_reopen_for_review",
      actorRef: "actor_275",
      recordedAt: "2026-04-18T12:24:00.000Z",
      reopenReasonCodeRefs: ["admin_resolution_manual_reopen_requested"],
    });

    expect(reopened.settlementBundle.currentSettlement.result).toBe("reopened_for_review");
    expect(reopened.settlementBundle.currentSettlement.reasonCodeRefs).toContain(
      "admin_resolution_manual_reopen_requested",
    );
    expect(reopened.settlementBundle.currentExperienceProjection.completionArtifactRef).toBe(
      "completion_artifact_275_reopen_for_review",
    );
    expect(reopened.settlementBundle.currentExperienceProjection.projectionState).toBe(
      "recovery_required",
    );
  });
});
