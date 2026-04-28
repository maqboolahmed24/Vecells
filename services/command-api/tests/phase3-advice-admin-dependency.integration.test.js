import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_ADVICE_ADMIN_DEPENDENCY_QUERY_SURFACES,
  PHASE3_ADVICE_ADMIN_DEPENDENCY_SCHEMA_VERSION,
  PHASE3_ADVICE_ADMIN_DEPENDENCY_SERVICE_NAME,
  createPhase3AdviceAdminDependencyApplication,
  phase3AdviceAdminDependencyMigrationPlanRefs,
  phase3AdviceAdminDependencyPersistenceTables,
  phase3AdviceAdminDependencyRoutes,
} from "../src/phase3-advice-admin-dependency.ts";

function document(snapshot) {
  return {
    toSnapshot() {
      return snapshot;
    },
  };
}

function buildFixture(seed, overrides = {}) {
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
    lastHeartbeatAt: "2026-04-17T11:59:00.000Z",
    staleOwnerRecoveryRef: null,
    activeReviewSessionRef: `review_session_${seed}`,
    duplicateClusterRef: null,
    currentEndpointDecisionRef: `endpoint_${seed}`,
    currentDecisionEpochRef: `decision_epoch_${seed}`,
    latestDecisionSupersessionRef: null,
    duplicateResolutionDecisionRef: null,
    duplicateReviewSnapshotRef: null,
    releaseRecoveryDispositionRef: null,
    createdAt: "2026-04-17T11:00:00.000Z",
    updatedAt: "2026-04-17T12:00:00.000Z",
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
    createdAt: "2026-04-17T11:00:00.000Z",
    updatedAt: "2026-04-17T12:00:00.000Z",
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
    decidedAt: "2026-04-17T12:00:00.000Z",
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

  if (overrides.task) {
    Object.assign(task, overrides.task);
  }
  if (overrides.request) {
    Object.assign(request, overrides.request);
  }
  if (overrides.boundaryDecision) {
    Object.assign(boundaryDecision, overrides.boundaryDecision);
  }
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

function buildApplication(fixture, overrides = {}) {
  return createPhase3AdviceAdminDependencyApplication({
    triageApplication: {
      triageRepositories: {
        async getTask(taskId) {
          expect(taskId).toBe(fixture.task.taskId);
          return document(fixture.task);
        },
      },
      controlPlaneRepositories: {
        async getRequest(requestId) {
          expect(requestId).toBe(fixture.request.requestId);
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
    identityBlockingPort: overrides.identityBlockingPort ?? {
      async queryRequestIdentityBlocking() {
        return null;
      },
    },
  });
}

describe("phase 3 advice-admin dependency application", () => {
  it("publishes the 252 dependency routes in the command-api route catalog", () => {
    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));
    for (const route of phase3AdviceAdminDependencyRoutes) {
      expect(routeIds.has(route.routeId)).toBe(true);
    }

    expect(PHASE3_ADVICE_ADMIN_DEPENDENCY_SERVICE_NAME).toBe(
      "Phase3AdviceAdminDependencyApplication",
    );
    expect(PHASE3_ADVICE_ADMIN_DEPENDENCY_SCHEMA_VERSION).toBe(
      "252.phase3.advice-admin-dependency-set.v1",
    );
    expect(PHASE3_ADVICE_ADMIN_DEPENDENCY_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/advice-admin-dependency",
    ]);
    expect(phase3AdviceAdminDependencyPersistenceTables).toContain(
      "phase3_advice_admin_dependency_sets",
    );
    expect(phase3AdviceAdminDependencyMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/128_phase3_advice_admin_dependency_set_engine.sql",
    );
  });

  it("derives repair_required from the live communication repair chain and exposes the current set through the query surface", async () => {
    const fixture = buildFixture("252_repair", {
      messageRepair: {
        binding: {
          bindingState: "repair_required",
          reachabilityDependencyRef: "reachability_dependency_252",
          activeRepairJourneyRef: "repair_journey_252",
          currentReachabilityEpoch: 3,
          recoveryRouteRef: "/workspace/tasks/task_252_repair/communications/repair",
        },
        assessment: {
          assessmentState: "blocked",
          routeAuthorityState: "stale_verification",
        },
      },
    });
    const application = buildApplication(fixture);

    const evaluated = await application.evaluateAdviceAdminDependencySet({
      taskId: "task_252_repair",
      actorRef: "actor_252",
      evaluatedAt: "2026-04-17T12:05:00.000Z",
    });
    expect(evaluated.result).toBe("applied");
    expect(evaluated.dependencyBundle.currentAdviceAdminDependencySet.dependencyState).toBe(
      "repair_required",
    );
    expect(
      evaluated.dependencyBundle.currentAdviceAdminDependencySet.dominantRecoveryRouteRef,
    ).toBe("/workspace/tasks/task_252_repair/communications/repair");

    const queried = await application.queryTaskAdviceAdminDependency("task_252_repair");
    expect(queried.dependencyBundle.currentAdviceAdminDependencySet.adviceAdminDependencySetId).toBe(
      evaluated.currentDependencySetRef,
    );
  });

  it("returns stale_recoverable when the caller presents a stale tuple hash", async () => {
    const fixture = buildFixture("252_stale");
    const application = buildApplication(fixture);

    const result = await application.evaluateAdviceAdminDependencySet({
      taskId: "task_252_stale",
      actorRef: "actor_252",
      evaluatedAt: "2026-04-17T12:06:00.000Z",
      presentedBoundaryTupleHash: "boundary_tuple_stale_previous",
    });

    expect(result.result).toBe("stale_recoverable");
    expect(result.reasonCodeRefs).toContain("stale_boundary_tuple_hash");
    expect(result.currentBoundaryTupleHash).toBe("boundary_tuple_252_stale");
  });

  it("maps identity blocking, consent checkpoint, and invalidated advice into the same dependency evaluator", async () => {
    const fixture = buildFixture("252_identity", {
      adviceRenderSettlement: {
        renderState: "invalidated",
      },
      activeComposerLease: {
        consentCheckpointRef: "consent_checkpoint_252",
      },
    });
    const application = buildApplication(fixture, {
      identityBlockingPort: {
        async queryRequestIdentityBlocking() {
          return {
            requestRef: "request_252_identity",
            identityRepairCaseRef: "identity_case_252",
            blockingVersionRef: "identity_version_252",
            blockingState: "blocked_pending_identity",
            recoveryRouteRef: "/workspace/tasks/task_252_identity/identity-repair",
            reasonCodeRefs: ["identity_blocking_required"],
          };
        },
      },
    });

    const result = await application.refreshAdviceAdminDependencySet({
      taskId: "task_252_identity",
      actorRef: "actor_252",
      evaluatedAt: "2026-04-17T12:07:00.000Z",
    });

    expect(result.result).toBe("applied");
    expect(result.dependencyBundle.currentAdviceAdminDependencySet.dependencyState).toBe(
      "blocked_pending_identity",
    );
    expect(result.dependencyBundle.currentAdviceAdminDependencySet.reopenState).toBe(
      "reopen_required",
    );
    expect(result.dependencyBundle.currentAdviceAdminDependencySet.reasonCodeRefs).toContain(
      "advice_render_invalidated_requires_reopen",
    );
  });

  it("reuses the current set on repeat refresh for the same tuple", async () => {
    const fixture = buildFixture("252_refresh_reuse");
    const application = buildApplication(fixture);

    const first = await application.refreshAdviceAdminDependencySet({
      taskId: "task_252_refresh_reuse",
      actorRef: "actor_252",
      evaluatedAt: "2026-04-17T12:08:00.000Z",
    });
    const second = await application.recalculateAdviceAdminReopenState({
      taskId: "task_252_refresh_reuse",
      actorRef: "actor_252",
      evaluatedAt: "2026-04-17T12:09:00.000Z",
      presentedDependencySetRef: first.currentDependencySetRef,
      presentedBoundaryTupleHash: first.currentBoundaryTupleHash,
      presentedDecisionEpochRef: first.currentDecisionEpochRef,
    });

    expect(second.result).toBe("applied");
    expect(second.currentDependencySetRef).toBe(first.currentDependencySetRef);
  });
});
