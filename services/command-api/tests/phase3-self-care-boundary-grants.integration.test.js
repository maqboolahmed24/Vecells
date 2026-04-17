import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_SELF_CARE_BOUNDARY_QUERY_SURFACES,
  PHASE3_SELF_CARE_BOUNDARY_SCHEMA_VERSION,
  PHASE3_SELF_CARE_BOUNDARY_SERVICE_NAME,
  createPhase3SelfCareBoundaryApplication,
  phase3SelfCareBoundaryRoutes,
} from "../src/phase3-self-care-boundary-grants.ts";

function document(snapshotRef) {
  return {
    toSnapshot() {
      return structuredClone(snapshotRef);
    },
  };
}

function buildFixture(seed, mode = "self_care") {
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
  const endpointCode =
    mode === "admin_resolution" ? "admin_resolution" : "self_care_and_safety_net";
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
      compiledPolicyBundleRef: "policy_bundle_249_v1",
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
      createdAt: "2026-04-17T10:00:00.000Z",
      updatedAt: "2026-04-17T10:00:00.000Z",
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
      reasoningText: "249 test decision",
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
      createdAt: "2026-04-17T10:00:00.000Z",
      updatedAt: "2026-04-17T10:00:00.000Z",
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
      clinicalMeaningState: "bounded",
      operationalFollowUpScope: "direct_resolution",
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
      evaluatedAt: "2026-04-17T10:00:00.000Z",
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
      riskBurdenClass: "moderate",
      assistiveProvenanceState: "none",
      sensitiveOverrideState: "none",
      matchedPolicyRuleRefs: ["AP_TEST_249"],
      requiredApprovalMode: "not_required",
      checkpointState: "not_required",
      reasonCodeRefs: ["policy_allows_direct_resolution"],
      approverRoleRefs: [],
      tupleHash: `approval_tuple_hash_${seed}`,
      evaluatedAt: "2026-04-17T10:00:00.000Z",
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
      recordedAt: "2026-04-17T10:00:00.000Z",
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
            adviceSummary: "Self-care advice summary",
            safetyNetAdvice: "Escalate if symptoms worsen",
            commandActionRecordRef: `command_action_${seed}`,
            commandSettlementRecordRef: `command_settlement_${seed}`,
            starterState: "live",
            decisionSupersessionRecordRef: null,
            createdAt: "2026-04-17T10:00:00.000Z",
            updatedAt: "2026-04-17T10:00:00.000Z",
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
            createdAt: "2026-04-17T10:00:00.000Z",
            updatedAt: "2026-04-17T10:00:00.000Z",
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
      recordedAt: "2026-04-17T10:00:00.000Z",
    },
  ];
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

function buildApp(fixture) {
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
          return taskId === fixture.task.taskId
            ? structuredClone(fixture.endpointActions)
            : [];
        },
      },
    },
    approvalApplication: {
      async queryTaskApprovalEscalation(taskId) {
        return taskId === fixture.task.taskId
          ? structuredClone(fixture.approvalBundle)
          : null;
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

async function classifyAndIssueLiveGrant(app, taskId) {
  await app.classifySelfCareBoundary({
    taskId,
    actorRef: "reviewer_249",
    recordedAt: "2026-04-17T10:05:00.000Z",
    reasonCodeRefs: ["integration_test_classification"],
  });
  return app.issueAdviceEligibilityGrant({
    taskId,
    boundaryDecisionId: (await app.queryTaskSelfCareBoundary(taskId)).boundaryBundle
      .currentBoundaryDecision.selfCareBoundaryDecisionId,
    actorRef: "reviewer_249",
    issuedAt: "2026-04-17T10:06:00.000Z",
    expiresAt: "2030-01-01T00:00:00.000Z",
    routeFamily: "patient_portal",
    audienceTier: "authenticated",
    channelRef: "portal_web",
    localeRef: "en-GB",
    adviceBundleVersionRef: "advice_bundle_249_v1",
  });
}

describe("249 self-care boundary and advice grants", () => {
  it("publishes the 249 self-care-boundary routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);
    for (const routeId of [
      "workspace_task_self_care_boundary_current",
      "workspace_task_classify_self_care_boundary",
      "workspace_task_issue_advice_eligibility_grant",
      "workspace_task_supersede_self_care_boundary",
      "workspace_task_invalidate_advice_eligibility_grant",
      "workspace_task_expire_advice_eligibility_grant",
      "workspace_self_care_boundary_expire_due_grants",
    ]) {
      expect(routeIds).toContain(routeId);
    }

    expect(PHASE3_SELF_CARE_BOUNDARY_SERVICE_NAME).toBe(
      "Phase3SelfCareBoundaryAndAdviceGrantApplication",
    );
    expect(PHASE3_SELF_CARE_BOUNDARY_SCHEMA_VERSION).toBe(
      "249.phase3.self-care-boundary-and-grants.v1",
    );
    expect(phase3SelfCareBoundaryRoutes).toHaveLength(7);
    expect(PHASE3_SELF_CARE_BOUNDARY_QUERY_SURFACES).toContain(
      "GET /v1/workspace/tasks/{taskId}/self-care-boundary",
    );
  });

  it("classifies one authoritative informational self-care tuple and issues one live grant that 250 can consume", async () => {
    const fixture = buildFixture("249_live_self_care");
    const app = buildApp(fixture);

    const classified = await app.classifySelfCareBoundary({
      taskId: fixture.task.taskId,
      actorRef: "reviewer_249",
      recordedAt: "2026-04-17T10:05:00.000Z",
      reasonCodeRefs: ["integration_test_classification"],
    });
    const granted = await app.issueAdviceEligibilityGrant({
      taskId: fixture.task.taskId,
      boundaryDecisionId:
        classified.boundaryBundle.currentBoundaryDecision.selfCareBoundaryDecisionId,
      actorRef: "reviewer_249",
      issuedAt: "2026-04-17T10:06:00.000Z",
      expiresAt: "2030-01-01T00:00:00.000Z",
      routeFamily: "patient_portal",
      audienceTier: "authenticated",
      channelRef: "portal_web",
      localeRef: "en-GB",
      adviceBundleVersionRef: "advice_bundle_249_v1",
    });

    expect(classified.boundaryBundle.currentBoundaryDecision.decisionState).toBe("self_care");
    expect(classified.boundaryBundle.currentBoundaryDecision.clinicalMeaningState).toBe(
      "informational_only",
    );
    expect(granted.boundaryBundle.currentAdviceEligibilityGrant.grantState).toBe("live");
    expect(granted.boundaryBundle.currentAdviceEligibilityGrant.routeFamily).toBe(
      "patient_portal",
    );
    expect(granted.effectiveAdviceGrantState).toBe("live");
  });

  it("classifies bounded admin-resolution without inventing a live advice grant so 251 can consume one stable boundary tuple", async () => {
    const fixture = buildFixture("249_admin_boundary", "admin_resolution");
    const app = buildApp(fixture);

    const classified = await app.classifySelfCareBoundary({
      taskId: fixture.task.taskId,
      actorRef: "reviewer_249",
      recordedAt: "2026-04-17T10:05:00.000Z",
      reasonCodeRefs: ["integration_test_admin_boundary"],
    });
    const queried = await app.queryTaskSelfCareBoundary(fixture.task.taskId);

    expect(classified.boundaryBundle.currentBoundaryDecision.decisionState).toBe(
      "admin_resolution",
    );
    expect(classified.boundaryBundle.currentBoundaryDecision.operationalFollowUpScope).toBe(
      "bounded_admin_resolution",
    );
    expect(classified.boundaryBundle.currentBoundaryDecision.adminResolutionSubtypeRef).toBe(
      "demographic_correction",
    );
    expect(queried.boundaryBundle.currentAdviceEligibilityGrant).toBeNull();
    expect(queried.directResolutionBundle.adminResolutionStarter.adminResolutionStarterId).toBe(
      "admin_resolution_starter_249_admin_boundary",
    );
  });

  it("blocks advice grant issuance when the current decision epoch has drifted from the stored boundary tuple", async () => {
    const fixture = buildFixture("249_decision_epoch_drift");
    const app = buildApp(fixture);

    const classified = await app.classifySelfCareBoundary({
      taskId: fixture.task.taskId,
      actorRef: "reviewer_249",
      recordedAt: "2026-04-17T10:05:00.000Z",
      reasonCodeRefs: ["integration_test_epoch_drift"],
    });
    fixture.task.currentDecisionEpochRef = "decision_epoch_249_decision_epoch_drift_v2";

    const granted = await app.issueAdviceEligibilityGrant({
      taskId: fixture.task.taskId,
      boundaryDecisionId:
        classified.boundaryBundle.currentBoundaryDecision.selfCareBoundaryDecisionId,
      actorRef: "reviewer_249",
      issuedAt: "2026-04-17T10:06:00.000Z",
      expiresAt: "2030-01-01T00:00:00.000Z",
      routeFamily: "patient_portal",
      audienceTier: "authenticated",
      channelRef: "portal_web",
      localeRef: "en-GB",
      adviceBundleVersionRef: "advice_bundle_249_v1",
    });

    expect(granted.boundaryBundle.currentAdviceEligibilityGrant.grantState).toBe("blocked");
    expect(granted.effectiveAdviceGrantState).toBe("blocked");
    expect(granted.effectiveAdviceGrantReasonCodeRefs).toContain("decision_epoch_drift");
  });

  it("invalidates a live advice grant when the evidence snapshot drifts", async () => {
    const fixture = buildFixture("249_evidence_drift");
    const app = buildApp(fixture);

    await classifyAndIssueLiveGrant(app, fixture.task.taskId);
    fixture.request.currentEvidenceSnapshotRef = "evidence_249_evidence_drift_v2";

    const queried = await app.queryTaskSelfCareBoundary(fixture.task.taskId);

    expect(queried.effectiveAdviceGrantState).toBe("invalidated");
    expect(queried.effectiveAdviceGrantReasonCodeRefs).toContain("evidence_snapshot_drift");
  });

  it("invalidates a live advice grant when the session epoch drifts", async () => {
    const fixture = buildFixture("249_session_drift");
    const app = buildApp(fixture);

    await classifyAndIssueLiveGrant(app, fixture.task.taskId);
    fixture.reviewSession.reviewSessionId = "review_session_249_session_drift_v2";

    const queried = await app.queryTaskSelfCareBoundary(fixture.task.taskId);

    expect(queried.effectiveAdviceGrantState).toBe("invalidated");
    expect(queried.effectiveAdviceGrantReasonCodeRefs).toContain("session_epoch_drift");
  });

  it("invalidates a live advice grant when the publication tuple drifts", async () => {
    const fixture = buildFixture("249_publication_drift");
    const app = buildApp(fixture);

    await classifyAndIssueLiveGrant(app, fixture.task.taskId);
    fixture.reviewSession.surfacePublicationRef = "surface_publication_249_publication_drift_v2";

    const queried = await app.queryTaskSelfCareBoundary(fixture.task.taskId);

    expect(queried.effectiveAdviceGrantState).toBe("invalidated");
    expect(queried.effectiveAdviceGrantReasonCodeRefs).toContain("surface_publication_drift");
  });
});
