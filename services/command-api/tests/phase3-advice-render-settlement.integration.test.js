import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_ADVICE_RENDER_QUERY_SURFACES,
  PHASE3_ADVICE_RENDER_SCHEMA_VERSION,
  PHASE3_ADVICE_RENDER_SERVICE_NAME,
  createPhase3AdviceRenderApplication,
  phase3AdviceRenderMigrationPlanRefs,
  phase3AdviceRenderPersistenceTables,
  phase3AdviceRenderRoutes,
} from "../src/phase3-advice-render-settlement.ts";
import { createPhase3SelfCareBoundaryApplication } from "../src/phase3-self-care-boundary-grants.ts";

function document(snapshotRef) {
  return {
    toSnapshot() {
      return structuredClone(snapshotRef);
    },
  };
}

function buildFixture(seed) {
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
      compiledPolicyBundleRef: "policy_bundle_250_v1",
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
      chosenEndpoint: "self_care_and_safety_net",
      decisionVersion: 1,
      payloadHash: `payload_hash_${seed}`,
      reasoningText: "250 test self-care decision",
      payload: {},
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
      clinicalMeaningState: "informational_only",
      operationalFollowUpScope: "self_serve_guidance",
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
      endpointCode: "self_care_and_safety_net",
      actionType: "commit_self_care",
      approvalPolicyMatrixRef: "228.approval-policy-matrix.v1",
      tenantPolicyRef: "tenant_policy_default",
      pathwayRef: "self_serve_guidance",
      riskBurdenClass: "low",
      assistiveProvenanceState: "none",
      sensitiveOverrideState: "none",
      matchedPolicyRuleRefs: ["AP_TEST_250"],
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
      endpointCode: "self_care_and_safety_net",
      settlementClass: "self_care",
      triageTaskStatus: "resolved_without_appointment",
      callbackSeedRef: null,
      clinicianMessageSeedRef: null,
      selfCareStarterRef: `self_care_starter_${seed}`,
      adminResolutionStarterRef: null,
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
    selfCareStarter: {
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
    adminResolutionStarter: null,
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

async function classifyAndIssueLiveGrant(boundaryApp, taskId, adviceBundleVersionRef) {
  await boundaryApp.classifySelfCareBoundary({
    taskId,
    actorRef: "reviewer_250",
    recordedAt: "2026-04-17T10:05:00.000Z",
    reasonCodeRefs: ["integration_test_classification"],
  });
  const queried = await boundaryApp.queryTaskSelfCareBoundary(taskId);
  return boundaryApp.issueAdviceEligibilityGrant({
    taskId,
    boundaryDecisionId:
      queried.boundaryBundle.currentBoundaryDecision.selfCareBoundaryDecisionId,
    actorRef: "reviewer_250",
    issuedAt: "2026-04-17T10:06:00.000Z",
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
    compiledPolicyBundleRef: "policy_bundle_250_v1",
    approvedAudienceTierRefs: ["authenticated"],
    approvedChannelRefs: ["portal_web"],
    approvedLocaleRefs: ["en-GB"],
    approvedReadingLevelRefs: ["standard"],
    approvedAccessibilityVariantRefs: ["screen_reader"],
    approvalState: "approved",
    approvedByRef: "clinical_reviewer_250",
    approvedAt: "2026-04-17T10:07:00.000Z",
    validFrom: "2026-04-17T10:07:00.000Z",
    validUntil: "2030-01-01T00:00:00.000Z",
  });
  await app.registerContentReviewSchedule({
    pathwayRef: "self_serve_guidance",
    adviceBundleVersionRef: bundleId,
    reviewCadenceRef: "cadence_90d",
    reviewState: "current",
    lastReviewedAt: "2026-04-17T10:08:00.000Z",
    nextReviewDueAt: "2030-01-01T00:00:00.000Z",
    reviewOwnerRef: "clinical_reviewer_250",
  });
  await app.registerAdviceBundleVersion({
    adviceBundleVersionId: bundleId,
    pathwayRef: "self_serve_guidance",
    compiledPolicyBundleRef: "policy_bundle_250_v1",
    clinicalIntentRef: "clinical_intent_self_care",
    audienceTierRefs: ["authenticated"],
    variantSetRef: `variant_family_${bundleId}`,
    safetyNetInstructionSetRef: `safety_net_${bundleId}`,
    effectiveFrom: "2026-04-17T10:09:00.000Z",
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

describe("250 advice render settlement and content approval binding", () => {
  it("publishes the 250 advice-render routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(routeIds).toEqual(
      expect.arrayContaining([
        "workspace_task_advice_render_current",
        "workspace_advice_content_approval_register",
        "workspace_advice_content_review_schedule_register",
        "workspace_advice_bundle_version_register",
        "workspace_advice_variant_set_register",
        "workspace_task_render_advice",
        "workspace_task_invalidate_advice_render",
        "workspace_task_supersede_advice_render",
        "workspace_task_quarantine_advice_render",
      ]),
    );
    expect(phase3AdviceRenderRoutes).toHaveLength(9);
    expect(PHASE3_ADVICE_RENDER_SERVICE_NAME).toBe(
      "Phase3AdviceRenderSettlementApplication",
    );
    expect(PHASE3_ADVICE_RENDER_SCHEMA_VERSION).toBe(
      "250.phase3.advice-render-settlement.v1",
    );
    expect(PHASE3_ADVICE_RENDER_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/advice-render",
    ]);
    expect(phase3AdviceRenderPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_clinical_content_approval_records",
        "phase3_content_review_schedules",
        "phase3_advice_bundle_versions",
        "phase3_advice_variant_sets",
        "phase3_advice_render_settlements",
      ]),
    );
    expect(phase3AdviceRenderMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/126_phase3_advice_render_settlement_and_content_approval.sql",
    );
  });

  it("renders live advice from the current 249 boundary and grant tuple", async () => {
    const fixture = buildFixture("250_live_render");
    const boundaryApp = buildBoundaryApp(fixture);
    const app = createPhase3AdviceRenderApplication({
      selfCareBoundaryApplication: boundaryApp,
    });

    await classifyAndIssueLiveGrant(app.selfCareBoundaryApplication, fixture.task.taskId, "advice_bundle_250_live_render_v1");
    const variant = await registerRenderableContent(app, "advice_bundle_250_live_render_v1");
    const rendered = await app.renderAdvice({
      taskId: fixture.task.taskId,
      actorRef: "reviewer_250",
      settledAt: "2026-04-17T10:10:00.000Z",
      readingLevelRef: "standard",
      accessibilityVariantRefs: ["screen_reader"],
    });

    expect(rendered.selfCareBoundaryBundle.effectiveAdviceGrantState).toBe("live");
    expect(rendered.selectedAdviceBundleVersion?.adviceBundleVersionId).toBe(
      "advice_bundle_250_live_render_v1",
    );
    expect(rendered.selectedAdviceVariantSet?.adviceVariantSetId).toBe(
      variant.adviceVariantSetId,
    );
    expect(rendered.renderBundle.currentRenderSettlement?.renderState).toBe("renderable");
    expect(rendered.effectiveRenderState).toBe("renderable");
    expect(rendered.renderBundle.currentRenderSettlement?.artifactPresentationContractRef).toBe(
      "artifact_presentation_contract.advice_bundle_250_live_render_v1",
    );
  });

  it("invalidates the effective render posture when the upstream 249 tuple drifts after render", async () => {
    const fixture = buildFixture("250_drift_after_render");
    const boundaryApp = buildBoundaryApp(fixture);
    const app = createPhase3AdviceRenderApplication({
      selfCareBoundaryApplication: boundaryApp,
    });

    await classifyAndIssueLiveGrant(app.selfCareBoundaryApplication, fixture.task.taskId, "advice_bundle_250_drift_v1");
    await registerRenderableContent(app, "advice_bundle_250_drift_v1");
    await app.renderAdvice({
      taskId: fixture.task.taskId,
      actorRef: "reviewer_250",
      settledAt: "2026-04-17T10:10:00.000Z",
      readingLevelRef: "standard",
      accessibilityVariantRefs: ["screen_reader"],
    });

    fixture.request.currentEvidenceSnapshotRef = "evidence_250_drift_after_render_v2";
    const drifted = await app.queryTaskAdviceRender(fixture.task.taskId);

    expect(drifted.renderBundle.currentRenderSettlement?.renderState).toBe("renderable");
    expect(drifted.effectiveRenderState).toBe("invalidated");
    expect(drifted.effectiveReasonCodeRefs).toContain("evidence_snapshot_drift");
    expect(drifted.effectiveReasonCodeRefs).toContain("advice_grant_invalidated");
  });

  it("quarantines render settlement on release-trust quarantine and rejects raw artifact refs", async () => {
    const fixture = buildFixture("250_quarantine");
    const boundaryApp = buildBoundaryApp(fixture);
    const app = createPhase3AdviceRenderApplication({
      selfCareBoundaryApplication: boundaryApp,
    });

    await classifyAndIssueLiveGrant(app.selfCareBoundaryApplication, fixture.task.taskId, "advice_bundle_250_quarantine_v1");
    await registerRenderableContent(app, "advice_bundle_250_quarantine_v1");

    await expect(
      app.registerAdviceVariantSet({
        adviceBundleVersionRef: "advice_bundle_250_quarantine_v1",
        channelRef: "portal_web",
        localeRef: "en-GB",
        readingLevelRef: "standard",
        contentBlocksRef: "content_blocks_raw_url",
        previewChecksum: "checksum_raw_url",
        translationVersionRef: "translation_raw_url",
        linkedArtifactContractRefs: ["https://example.com/uncontrolled.pdf"],
      }),
    ).rejects.toThrowError(/raw external urls/i);

    const quarantined = await app.renderAdvice({
      taskId: fixture.task.taskId,
      actorRef: "reviewer_250",
      settledAt: "2026-04-17T10:10:00.000Z",
      readingLevelRef: "standard",
      accessibilityVariantRefs: ["screen_reader"],
      releaseTrustState: "quarantined",
    });

    expect(quarantined.renderBundle.currentRenderSettlement?.renderState).toBe("quarantined");
    expect(quarantined.renderBundle.currentRenderSettlement?.trustState).toBe("quarantined");
    expect(quarantined.effectiveRenderState).toBe("quarantined");
    expect(quarantined.effectiveReasonCodeRefs).toContain("release_trust_quarantined");
  });
});
