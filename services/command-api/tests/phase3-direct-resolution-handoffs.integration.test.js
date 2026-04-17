import { describe, expect, it } from "vitest";
import { evaluateGovernedApprovalRequirement } from "@vecells/domain-triage-workspace";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_DIRECT_RESOLUTION_QUERY_SURFACES,
  PHASE3_DIRECT_RESOLUTION_SCHEMA_VERSION,
  PHASE3_DIRECT_RESOLUTION_SERVICE_NAME,
  createPhase3DirectResolutionApplication,
  phase3DirectResolutionMigrationPlanRefs,
  phase3DirectResolutionPersistenceTables,
  phase3DirectResolutionRoutes,
} from "../src/phase3-direct-resolution-handoffs.ts";

function createTaskInput(seed) {
  return {
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    episodeId: `episode_${seed}`,
    requestLineageRef: `lineage_${seed}`,
    queueKey: `queue_${seed}`,
    sourceQueueRankSnapshotRef: `rank_${seed}`,
    returnAnchorRef: `anchor_${seed}`,
    returnAnchorTupleHash: `anchor_hash_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
    selectedAnchorTupleHash: `anchor_hash_${seed}`,
    workspaceTrustEnvelopeRef: `trust_${seed}`,
    surfaceRouteContractRef: `route_contract_${seed}`,
    surfacePublicationRef: `publication_${seed}`,
    runtimePublicationBundleRef: `runtime_${seed}`,
    taskCompletionSettlementEnvelopeRef: `completion_${seed}`,
    createdAt: "2026-04-16T09:00:00.000Z",
  };
}

async function seedReviewTask(application, seed) {
  const created = await application.triageApplication.createTask(createTaskInput(seed));
  const queued = await application.triageApplication.moveTaskToQueue({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    queuedAt: "2026-04-16T09:01:00.000Z",
  });
  const claimed = await application.triageApplication.claimTask({
    taskId: queued.task.taskId,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-16T09:02:00.000Z",
  });
  return application.triageApplication.enterReview({
    taskId: claimed.task.taskId,
    actorRef: `actor_${seed}`,
    openedAt: "2026-04-16T09:03:00.000Z",
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_slice_${seed}`,
    audienceSurfaceRuntimeBindingRef: `runtime_binding_${seed}`,
    reviewActionLeaseRef: `review_action_${seed}`,
    selectedAnchorRef: `anchor_review_${seed}`,
    selectedAnchorTupleHashRef: `anchor_review_hash_${seed}`,
  });
}

function payloadFor(endpoint, overrides = {}) {
  const base = {
    admin_resolution: { summary: "Administrative fix only." },
    self_care_and_safety_net: {
      summary: "Self-care is appropriate.",
      safetyNetAdvice: "Seek urgent review if breathing worsens.",
    },
    clinician_message: {
      messageSubject: "Follow-up",
      messageBody: "Please confirm wheeze frequency.",
    },
    clinician_callback: {
      callbackWindow: "after_18_00",
      summary: "Call to confirm symptom change.",
    },
    appointment_required: {
      appointmentReason: "Needs clinician assessment.",
      priorityBand: "same_day",
      timeframe: "today",
      modality: "telephone",
      clinicianType: "gp",
      continuityPreference: "usual_team",
      patientPreferenceSummary: "Prefers late-afternoon call.",
    },
    pharmacy_first_candidate: {
      suspectedPathway: "pharmacy_first",
      eligibilityFacts: ["patient_meets_default_pathway"],
      exclusionFlags: [],
      patientChoicePending: true,
    },
  };
  return {
    ...base[endpoint],
    ...overrides,
  };
}

async function materializeApprovedCheckpoint(application, input) {
  const bundle = await application.endpointApplication.queryTaskEndpointDecision(input.taskId);
  const evaluatedRequirement = evaluateGovernedApprovalRequirement({
    taskId: input.taskId,
    requestId: bundle.epoch.requestId,
    decisionEpochRef: bundle.epoch.epochId,
    decisionId: bundle.decision.decisionId,
    endpointCode: bundle.decision.chosenEndpoint,
    payload: bundle.decision.payload,
    evaluatedAt: input.evaluatedAt,
  });
  const requiredApprovalMode = bundle.approvalAssessment.requiredApprovalMode;
  const evaluated = await application.approvalApplication.service.evaluateApprovalRequirement({
    assessment: {
      assessmentId: `approval_assessment_${input.taskId}_${evaluatedRequirement.tupleHash}`,
      taskId: input.taskId,
      requestId: bundle.epoch.requestId,
      decisionEpochRef: bundle.epoch.epochId,
      decisionId: bundle.decision.decisionId,
      endpointClass: bundle.decision.chosenEndpoint,
      approvalPolicyMatrixRef: evaluatedRequirement.approvalPolicyMatrixRef,
      tenantPolicyRef: evaluatedRequirement.tenantPolicyRef,
      pathwayRef: evaluatedRequirement.pathwayRef,
      riskBurdenClass: evaluatedRequirement.riskBurdenClass,
      assistiveProvenanceState: evaluatedRequirement.assistiveProvenanceState,
      sensitiveOverrideState: evaluatedRequirement.sensitiveOverrideState,
      matchedPolicyRuleRefs: evaluatedRequirement.matchedPolicyRuleRefs,
      requiredApprovalMode,
      checkpointState: requiredApprovalMode,
      reasonCodeRefs: evaluatedRequirement.reasonCodeRefs,
      evaluatedAt: input.evaluatedAt,
      tupleHash: evaluatedRequirement.tupleHash,
      version: 1,
    },
    checkpointId: `checkpoint_${input.taskId}`,
    actionType: evaluatedRequirement.actionType,
    requestedBy: input.actorRef,
    requestedAt: input.evaluatedAt,
    lifecycleLeaseRef: `lease_${input.taskId}`,
    leaseAuthorityRef: "lease_authority_triage_approval",
    leaseTtlSeconds: 1800,
    lastHeartbeatAt: input.evaluatedAt,
    fencingToken: `fence_${input.taskId}`,
    ownershipEpoch: 1,
    currentLineageFenceEpoch: bundle.epoch.lineageFenceEpoch ?? 1,
  });
  await application.approvalApplication.service.requestApproval({
    checkpointId: evaluated.checkpoint.checkpointId,
    requestedBy: input.actorRef,
    requestedAt: input.requestedAt,
  });
  const approved = await application.approvalApplication.service.approveCheckpoint({
    checkpointId: evaluated.checkpoint.checkpointId,
    approvedBy: input.approverRef,
    approvedAt: input.approvedAt,
    presentedRoleRefs: ["clinical_supervisor"],
  });

  return { evaluated, approved };
}

async function selectAndSubmit(application, input) {
  const selected = await application.endpointApplication.selectEndpoint({
    taskId: input.taskId,
    actorRef: input.actorRef,
    recordedAt: input.selectedAt,
    chosenEndpoint: input.endpoint,
    reasoningText: input.reasoningText,
    payload: input.payload,
  });
  const initialSubmit = await application.endpointApplication.submitEndpointDecision({
    taskId: input.taskId,
    decisionId: selected.decision.decisionId,
    actorRef: input.actorRef,
    recordedAt: input.submittedAt,
  });
  return { selected, initialSubmit };
}

describe("phase 3 direct-resolution and handoff seams", () => {
  it("publishes direct-resolution routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(routeIds).toEqual(
      expect.arrayContaining([
        "workspace_task_direct_resolution_current",
        "workspace_task_commit_direct_resolution",
        "workspace_task_publish_outcome_artifact",
        "workspace_task_reconcile_stale_direct_resolution",
        "workspace_direct_resolution_worker_drain",
      ]),
    );
    expect(phase3DirectResolutionRoutes).toHaveLength(5);
    expect(PHASE3_DIRECT_RESOLUTION_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/direct-resolution",
    ]);
  });

  it("commits callback consequence once, keeps replay idempotent, and closes the triage task only after settlement", async () => {
    const application = createPhase3DirectResolutionApplication();
    await seedReviewTask(application, "240_callback");

    const selected = await application.endpointApplication.selectEndpoint({
      taskId: "task_240_callback",
      actorRef: "reviewer_240_callback",
      recordedAt: "2026-04-16T10:00:00.000Z",
      chosenEndpoint: "clinician_callback",
      reasoningText: "Callback is enough for the next step.",
      payload: payloadFor("clinician_callback"),
    });
    const submitted = await application.endpointApplication.submitEndpointDecision({
      taskId: "task_240_callback",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_240_callback",
      recordedAt: "2026-04-16T10:01:00.000Z",
    });
    const committed = await application.commitDirectResolution({
      taskId: "task_240_callback",
      actorRef: "reviewer_240_callback",
      recordedAt: "2026-04-16T10:02:00.000Z",
    });
    const replay = await application.commitDirectResolution({
      taskId: "task_240_callback",
      actorRef: "reviewer_240_callback",
      recordedAt: "2026-04-16T10:03:00.000Z",
    });
    const task = await application.triageApplication.triageRepositories.getTask(
      "task_240_callback",
    );
    const callbackLink = await application.triageApplication.controlPlaneRepositories.getLineageCaseLink(
      committed.callbackSeed.lineageCaseLinkRef,
    );

    expect(application.serviceName).toBe(PHASE3_DIRECT_RESOLUTION_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_DIRECT_RESOLUTION_SCHEMA_VERSION);
    expect(application.migrationPlanRefs).toEqual(phase3DirectResolutionMigrationPlanRefs);
    expect(phase3DirectResolutionPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_callback_case_seeds",
        "phase3_booking_intents",
        "phase3_pharmacy_intents",
        "phase3_direct_resolution_settlements",
        "phase3_triage_outcome_presentation_artifacts",
        "phase3_patient_status_projection_updates",
        "phase3_direct_resolution_outbox_entries",
      ]),
    );
    expect(submitted.settlement.result).toBe("submitted");
    expect(committed.settlement.settlementId).toBe(replay.settlement.settlementId);
    expect(committed.callbackSeed.seedState).toBe("live");
    expect(committed.presentationArtifact.artifactType).toBe(
      "clinician_callback_confirmation",
    );
    expect(committed.patientStatusProjection.statusCode).toBe("callback_created");
    expect(committed.outboxEntries).toHaveLength(4);
    expect(task?.toSnapshot().status).toBe("closed");
    expect(callbackLink?.toSnapshot()).toMatchObject({
      caseFamily: "callback",
      linkReason: "operational_follow_up",
      ownershipState: "proposed",
      originDecisionEpochRef: committed.settlement.decisionEpochRef,
    });
  });

  it("commits self-care consequence through the summary-first artifact path and emits closure evaluation", async () => {
    const application = createPhase3DirectResolutionApplication();
    await seedReviewTask(application, "240_selfcare");

    const selected = await selectAndSubmit(application, {
      taskId: "task_240_selfcare",
      actorRef: "reviewer_240_selfcare",
      endpoint: "self_care_and_safety_net",
      payload: payloadFor("self_care_and_safety_net"),
      reasoningText: "Self-care is appropriate with a clear safety net.",
      selectedAt: "2026-04-16T10:10:00.000Z",
      submittedAt: "2026-04-16T10:11:00.000Z",
    });
    const committed = await application.commitDirectResolution({
      taskId: "task_240_selfcare",
      actorRef: "reviewer_240_selfcare",
      recordedAt: "2026-04-16T10:12:00.000Z",
    });

    expect(selected.initialSubmit.settlement.result).toBe("submitted");
    expect(committed.selfCareStarter).toBeTruthy();
    expect(
      committed.outboxEntries.some(
        (entry) => entry.effectType === "lifecycle_closure_evaluation",
      ),
    ).toBe(true);
  });

  it("blocks booking handoff seed until approval truth is present, then creates the proposed lineage link in the same commit path", async () => {
    const application = createPhase3DirectResolutionApplication();
    await seedReviewTask(application, "240_booking");

    const selected = await selectAndSubmit(application, {
      taskId: "task_240_booking",
      actorRef: "reviewer_240_booking",
      endpoint: "appointment_required",
      payload: payloadFor("appointment_required"),
      reasoningText: "Needs clinician assessment.",
      selectedAt: "2026-04-16T10:20:00.000Z",
      submittedAt: "2026-04-16T10:21:00.000Z",
    });
    await expect(
      application.commitDirectResolution({
        taskId: "task_240_booking",
        actorRef: "reviewer_240_booking",
        recordedAt: "2026-04-16T10:22:00.000Z",
      }),
    ).rejects.toThrow("APPROVAL_CHECKPOINT_NOT_APPROVED");

    const approval = await materializeApprovedCheckpoint(application, {
      taskId: "task_240_booking",
      actorRef: "reviewer_240_booking",
      approverRef: "clinical_supervisor_240_booking",
      evaluatedAt: "2026-04-16T10:23:00.000Z",
      requestedAt: "2026-04-16T10:24:00.000Z",
      approvedAt: "2026-04-16T10:25:00.000Z",
    });
    const committed = await application.commitDirectResolution({
      taskId: "task_240_booking",
      actorRef: "reviewer_240_booking",
      recordedAt: "2026-04-16T10:26:00.000Z",
    });
    const link = await application.triageApplication.controlPlaneRepositories.getLineageCaseLink(
      committed.bookingIntent.lineageCaseLinkRef,
    );
    const task = await application.triageApplication.triageRepositories.getTask("task_240_booking");

    expect(selected.initialSubmit.settlement.result).toBe("blocked_approval_gate");
    expect(approval.approved.state).toBe("approved");
    expect(committed.settlement.settlementClass).toBe("handoff_seed");
    expect(committed.settlement.triageTaskStatus).toBe("handoff_pending");
    expect(committed.bookingIntent.intentState).toBe("seeded");
    expect(committed.outboxEntries.some((entry) => entry.effectType === "lifecycle_handoff_active")).toBe(true);
    expect(link?.toSnapshot()).toMatchObject({
      caseFamily: "booking",
      linkReason: "direct_handoff",
      ownershipState: "proposed",
      originDecisionEpochRef: committed.settlement.decisionEpochRef,
    });
    expect(task?.toSnapshot().status).toBe("closed");
  });

});
