import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_ENDPOINT_DECISION_QUERY_SURFACES,
  PHASE3_ENDPOINT_DECISION_SCHEMA_VERSION,
  PHASE3_ENDPOINT_DECISION_SERVICE_NAME,
  createPhase3EndpointDecisionEngineApplication,
  phase3EndpointDecisionMigrationPlanRefs,
  phase3EndpointDecisionPersistenceTables,
  phase3EndpointDecisionRoutes,
} from "../src/phase3-endpoint-decision-engine.ts";

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
      safetyNetAdvice: "Book urgent review if breathlessness worsens.",
    },
    clinician_message: { messageBody: "Please confirm wheeze frequency." },
    clinician_callback: { callbackWindow: "after_18_00" },
    appointment_required: { appointmentReason: "Needs examination." },
    pharmacy_first_candidate: { medicationQuestion: "Possible inhaler side effect." },
    duty_clinician_escalation: { escalationReason: "Potential deterioration." },
  };
  return {
    ...base[endpoint],
    ...overrides,
  };
}

describe("phase 3 endpoint decision engine seam", () => {
  it("publishes the endpoint decision routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(routeIds).toEqual(
      expect.arrayContaining([
        "workspace_task_endpoint_decision_current",
        "workspace_task_select_endpoint",
        "workspace_task_update_endpoint_payload",
        "workspace_task_preview_endpoint_outcome",
        "workspace_task_regenerate_endpoint_preview",
        "workspace_task_submit_endpoint_decision",
        "workspace_task_invalidate_endpoint_decision",
      ]),
    );
    expect(phase3EndpointDecisionRoutes).toHaveLength(7);
    expect(PHASE3_ENDPOINT_DECISION_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/:taskId/endpoint-decision",
    ]);
  });

  it("commits a live self-care decision through preview and submit without reminting the DecisionEpoch", async () => {
    const application = createPhase3EndpointDecisionEngineApplication();
    await seedReviewTask(application, "238_selfcare");

    const selected = await application.selectEndpoint({
      taskId: "task_238_selfcare",
      actorRef: "reviewer_238",
      recordedAt: "2026-04-16T10:00:00.000Z",
      chosenEndpoint: "self_care_and_safety_net",
      reasoningText: "No red flags and clear self-care path.",
      payload: payloadFor("self_care_and_safety_net"),
    });
    const preview = await application.previewEndpointOutcome({
      taskId: "task_238_selfcare",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_238",
      recordedAt: "2026-04-16T10:01:00.000Z",
    });
    const submit = await application.submitEndpointDecision({
      taskId: "task_238_selfcare",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_238",
      recordedAt: "2026-04-16T10:02:00.000Z",
    });
    const currentTask = await application.triageApplication.triageRepositories.getTask(
      "task_238_selfcare",
    );
    const currentBundle = await application.queryTaskEndpointDecision("task_238_selfcare");

    expect(application.serviceName).toBe(PHASE3_ENDPOINT_DECISION_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_ENDPOINT_DECISION_SCHEMA_VERSION);
    expect(application.migrationPlanRefs).toEqual(phase3EndpointDecisionMigrationPlanRefs);
    expect(phase3EndpointDecisionPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_decision_epochs",
        "phase3_endpoint_decisions",
        "phase3_endpoint_decision_bindings",
        "phase3_endpoint_decision_action_records",
        "phase3_endpoint_decision_settlements",
        "phase3_endpoint_outcome_preview_artifacts",
        "phase3_decision_supersession_records",
      ]),
    );
    expect(selected.epoch.epochId).toBe(preview.epoch.epochId);
    expect(submit.epoch.epochState).toBe("committed");
    expect(submit.settlement.result).toBe("submitted");
    expect(preview.previewArtifact.previewDigest).toBeTruthy();
    expect(currentTask?.toSnapshot().status).toBe("endpoint_selected");
    expect(currentTask?.toSnapshot().currentDecisionEpochRef).toBe(submit.epoch.epochId);
    expect(currentTask?.toSnapshot().currentEndpointDecisionRef).toBe(submit.decision.decisionId);
    expect(currentBundle?.decision.decisionState).toBe("submitted");
    expect(currentBundle?.binding.bindingState).toBe("live");
  });

  it("holds appointment_required behind blocked_approval_gate and leaves the triage task in review", async () => {
    const application = createPhase3EndpointDecisionEngineApplication();
    await seedReviewTask(application, "238_approval");

    const selected = await application.selectEndpoint({
      taskId: "task_238_approval",
      actorRef: "reviewer_238",
      recordedAt: "2026-04-16T10:10:00.000Z",
      chosenEndpoint: "appointment_required",
      reasoningText: "Symptoms need same-day examination.",
      payload: payloadFor("appointment_required"),
    });
    const submit = await application.submitEndpointDecision({
      taskId: "task_238_approval",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_238",
      recordedAt: "2026-04-16T10:11:00.000Z",
    });
    const currentTask = await application.triageApplication.triageRepositories.getTask(
      "task_238_approval",
    );

    expect(selected.approvalAssessment.requiredApprovalMode).toBe("required");
    expect(submit.settlement.result).toBe("blocked_approval_gate");
    expect(submit.decision.decisionState).toBe("awaiting_approval");
    expect(currentTask?.toSnapshot().status).toBe("in_review");
    expect(currentTask?.toSnapshot().currentDecisionEpochRef).toBeNull();
  });

  it("supersedes stale preview posture on anchor drift and keeps the old preview as recovery-only provenance", async () => {
    const application = createPhase3EndpointDecisionEngineApplication();
    await seedReviewTask(application, "238_stale");

    const selected = await application.selectEndpoint({
      taskId: "task_238_stale",
      actorRef: "reviewer_238",
      recordedAt: "2026-04-16T10:20:00.000Z",
      chosenEndpoint: "clinician_message",
      reasoningText: "Message is enough before direct next step.",
      payload: payloadFor("clinician_message"),
    });
    const preview = await application.previewEndpointOutcome({
      taskId: "task_238_stale",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_238",
      recordedAt: "2026-04-16T10:21:00.000Z",
    });
    const invalidated = await application.invalidateStaleDecision({
      taskId: "task_238_stale",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_238",
      recordedAt: "2026-04-16T10:22:00.000Z",
      fenceOverrides: {
        selectedAnchorRef: "anchor_review_238_stale_shifted",
        selectedAnchorTupleHashRef: "anchor_review_hash_238_stale_shifted",
      },
    });
    const previewArtifacts = await application.decisionRepositories.listPreviewArtifactsForTask(
      "task_238_stale",
    );
    const originalPreview = previewArtifacts.find(
      (artifact) => artifact.previewArtifactId === preview.previewArtifact.previewArtifactId,
    );

    expect(invalidated.settlement.result).toBe("stale_recoverable");
    expect(invalidated.supersessionRecord?.reasonCodeRefs).toContain(
      "DECISION_238_SELECTED_ANCHOR_DRIFT",
    );
    expect(invalidated.epoch.epochId).not.toBe(preview.epoch.epochId);
    expect(originalPreview?.artifactState).toBe("recovery_only");
  });

  it("surfaces preview_only binding when consequence publication is frozen", async () => {
    const application = createPhase3EndpointDecisionEngineApplication();
    await seedReviewTask(application, "238_preview_only");

    const selected = await application.selectEndpoint({
      taskId: "task_238_preview_only",
      actorRef: "reviewer_238",
      recordedAt: "2026-04-16T10:30:00.000Z",
      chosenEndpoint: "admin_resolution",
      reasoningText: "Admin fix only.",
      payload: payloadFor("admin_resolution"),
      fenceOverrides: {
        writeState: "preview_only",
      },
    });
    const submit = await application.submitEndpointDecision({
      taskId: "task_238_preview_only",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_238",
      recordedAt: "2026-04-16T10:31:00.000Z",
      fenceOverrides: {
        writeState: "preview_only",
      },
    });

    expect(selected.binding.bindingState).toBe("preview_only");
    expect(submit.settlement.result).toBe("blocked_policy");
    expect(submit.boundaryTuple?.endpointCode).toBe("admin_resolution");
  });
});
