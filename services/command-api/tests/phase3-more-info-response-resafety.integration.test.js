import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import { createPhase3MoreInfoResponseResafetyService } from "@vecells/domain-triage-workspace";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  createPhase3MoreInfoKernelApplication,
} from "../src/phase3-more-info-kernel.ts";
import {
  PHASE3_MORE_INFO_RESPONSE_RESAFETY_SCHEMA_VERSION,
  PHASE3_MORE_INFO_RESPONSE_RESAFETY_SERVICE_NAME,
  createPhase3MoreInfoResponseResafetyApplication,
  phase3MoreInfoResponseResafetyMigrationPlanRefs,
  phase3MoreInfoResponseResafetyPersistenceTables,
  phase3MoreInfoResponseResafetyRoutes,
} from "../src/phase3-more-info-response-resafety.ts";

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
  const triage = application.moreInfoApplication.triageApplication;
  const created = await triage.createTask(createTaskInput(seed));
  const queued = await triage.moveTaskToQueue({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    queuedAt: "2026-04-16T09:01:00.000Z",
  });
  const claimed = await triage.claimTask({
    taskId: queued.task.taskId,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-16T09:02:00.000Z",
  });
  await triage.enterReview({
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

async function requestMoreInfo(application, seed, overrides = {}) {
  await seedReviewTask(application, seed);
  return application.moreInfoApplication.requestMoreInfo({
    taskId: `task_${seed}`,
    actorRef: `actor_${seed}`,
    recordedAt: "2026-04-16T09:04:00.000Z",
    promptSetRef: `prompt_${seed}`,
    channelRef: "sms_outbound",
    responseRouteFamilyRef: "patient_more_info",
    dueAt: "2026-04-16T09:20:00.000Z",
    expiresAt: "2026-04-16T10:20:00.000Z",
    reminderOffsetsMinutes: [5, 10],
    cadencePolicyRef: "reply_window_policy_v1",
    quietHoursWindow: null,
    ...overrides,
  });
}

describe("phase 3 more-info response resafety seam", () => {
  it("publishes the 237 reply disposition, assimilation, and resafety routes in the command-api catalog", () => {
    const application = createPhase3MoreInfoResponseResafetyApplication();
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(application.serviceName).toBe(PHASE3_MORE_INFO_RESPONSE_RESAFETY_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_MORE_INFO_RESPONSE_RESAFETY_SCHEMA_VERSION);
    expect(application.routes).toEqual(phase3MoreInfoResponseResafetyRoutes);
    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/113_phase3_more_info_response_resafety.sql",
    );
    expect(application.migrationPlanRefs).toEqual(
      phase3MoreInfoResponseResafetyMigrationPlanRefs,
    );
    expect(phase3MoreInfoResponseResafetyPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_more_info_response_dispositions",
        "phase3_response_assimilation_records",
        "phase3_more_info_supervisor_review_requirements",
      ]),
    );
    expect(routeIds).toEqual(
      expect.arrayContaining([
        "workspace_task_receive_more_info_reply",
        "workspace_task_evaluate_more_info_reply_disposition",
        "workspace_task_assimilate_more_info_reply",
        "workspace_task_classify_more_info_reply",
        "workspace_task_run_more_info_resafety",
        "workspace_task_settle_more_info_urgent_return",
        "workspace_task_settle_more_info_review_resumed_return",
        "workspace_task_mark_more_info_supervisor_review_required",
      ]),
    );
  });

  it("routes accepted urgent patient replies through canonical assimilation and returns the task to escalated handling", async () => {
    const application = createPhase3MoreInfoResponseResafetyApplication();
    const requested = await requestMoreInfo(application, "237_urgent");

    const result = await application.receiveMoreInfoReply({
      taskId: "task_237_urgent",
      cycleId: requested.cycle.cycleId,
      actorRef: "actor_237_urgent",
      idempotencyKey: "reply_237_urgent",
      receivedAt: "2026-04-16T09:10:00.000Z",
      messageText: "Breathing is much worse now and I feel faint.",
      structuredFacts: { worsening: true, faint: true },
      changedFeatureRefs: ["urgent_red_flag", "symptom_worsened"],
      autoReturnToQueue: true,
    });

    const task =
      await application.moreInfoApplication.triageApplication.triageRepositories.getTask(
        "task_237_urgent",
      );

    expect(result.disposition.dispositionClass).toBe("accepted_in_window");
    expect(result.responseAssimilation).not.toBeNull();
    expect(result.evidenceAssimilation).not.toBeNull();
    expect(result.materialDelta?.triggerDecision).toBe("re_safety_required");
    expect(result.classification?.dominantEvidenceClass).toBe("potentially_clinical");
    expect(result.preemption).not.toBeNull();
    expect(result.safetyDecision?.requestedSafetyState).toBe("urgent_diversion_required");
    expect(result.routingOutcome).toBe("urgent_return");
    expect(result.urgentDiversionSettlement).not.toBeNull();
    expect(result.queueReturnTransitionRef).toBeNull();
    expect(task?.toSnapshot().status).toBe("escalated");
  });

  it("keeps blocked repair replies explicit and durable without minting new evidence", async () => {
    const application = createPhase3MoreInfoResponseResafetyApplication();
    const requested = await requestMoreInfo(application, "237_blocked");

    const result = await application.receiveMoreInfoReply({
      taskId: "task_237_blocked",
      cycleId: requested.cycle.cycleId,
      actorRef: "actor_237_blocked",
      idempotencyKey: "reply_237_blocked",
      receivedAt: "2026-04-16T09:09:00.000Z",
      messageText: "I tried to reply but the contact route is disputed.",
      structuredFacts: { disputedRoute: true },
      repairBlockReasonRefs: ["contact_route_disputed"],
    });

    expect(result.disposition.dispositionClass).toBe("blocked_repair");
    expect(result.disposition.blockedRecoveryRouteRef).toBe("/workspace/tasks/task_237_blocked/recover");
    expect(result.responseAssimilation).toBeNull();
    expect(result.evidenceAssimilation).toBeNull();
    expect(result.materialDelta).toBeNull();
    expect(result.classification).toBeNull();
    expect(result.preemption).toBeNull();
    expect(result.safetyDecision).toBeNull();
    expect(result.routingOutcome).toBeNull();
  });

  it("reuses the same settled response path for semantic replay instead of minting a second assimilation", async () => {
    const application = createPhase3MoreInfoResponseResafetyApplication();
    const requested = await requestMoreInfo(application, "237_replay");

    const first = await application.receiveMoreInfoReply({
      taskId: "task_237_replay",
      cycleId: requested.cycle.cycleId,
      actorRef: "actor_237_replay",
      idempotencyKey: "reply_237_replay_first",
      receivedAt: "2026-04-16T09:10:00.000Z",
      messageText: "Still symptomatic today.",
      structuredFacts: { symptomatic: true },
      changedFeatureRefs: ["new_clinical_detail"],
      autoReturnToQueue: true,
    });
    const replay = await application.receiveMoreInfoReply({
      taskId: "task_237_replay",
      cycleId: requested.cycle.cycleId,
      actorRef: "actor_237_replay",
      idempotencyKey: "reply_237_replay_second",
      receivedAt: "2026-04-16T09:11:00.000Z",
      messageText: "Still symptomatic today.",
      structuredFacts: { symptomatic: true },
      changedFeatureRefs: ["new_clinical_detail"],
      autoReturnToQueue: true,
    });

    const assimilations =
      await application.responseRepositories.listResponseAssimilationRecordsByRequest(
        "request_237_replay",
      );

    expect(first.routingOutcome).toBe("review_resumed_then_queued");
    expect(first.safetyDecision?.requestedSafetyState).toBe("residual_risk_flagged");
    expect(replay.replayed).toBe(true);
    expect(replay.disposition.dispositionId).toBe(first.disposition.dispositionId);
    expect(replay.responseAssimilation?.responseAssimilationRecordId).toBe(
      first.responseAssimilation?.responseAssimilationRecordId,
    );
    expect(assimilations).toHaveLength(1);
  });

  it("suppresses automatic requeue and records supervisor review after repeated reopen oscillation", async () => {
    const application = createPhase3MoreInfoResponseResafetyApplication();
    const requested = await requestMoreInfo(application, "237_supervisor");
    const seedingService = createPhase3MoreInfoResponseResafetyService(
      application.responseRepositories,
      {
        idGenerator: createDeterministicBackboneIdGenerator(
          "phase3_more_info_response_resafety_supervisor_seed",
        ),
      },
    );

    await seedingService.createResponseAssimilationRecord({
      dispositionRef: "seed_disposition_1",
      taskId: "task_237_supervisor",
      cycleId: "seed_cycle_1",
      requestId: "request_237_supervisor",
      requestLineageRef: "lineage_237_supervisor",
      evidenceCaptureBundleRef: "seed_capture_1",
      evidenceAssimilationRef: "seed_assimilation_1",
      materialDeltaAssessmentRef: "seed_delta_1",
      classificationDecisionRef: "seed_classification_1",
      requestedSafetyState: "residual_risk_flagged",
      safetyDecisionOutcome: "residual_review",
      resultingSafetyDecisionEpoch: 1,
      routingOutcome: "review_resumed_then_queued",
      recordedAt: "2026-04-16T00:30:00.000Z",
    });
    await seedingService.createResponseAssimilationRecord({
      dispositionRef: "seed_disposition_2",
      taskId: "task_237_supervisor",
      cycleId: "seed_cycle_2",
      requestId: "request_237_supervisor",
      requestLineageRef: "lineage_237_supervisor",
      evidenceCaptureBundleRef: "seed_capture_2",
      evidenceAssimilationRef: "seed_assimilation_2",
      materialDeltaAssessmentRef: "seed_delta_2",
      classificationDecisionRef: "seed_classification_2",
      requestedSafetyState: "residual_risk_flagged",
      safetyDecisionOutcome: "residual_review",
      resultingSafetyDecisionEpoch: 2,
      routingOutcome: "review_resumed_then_queued",
      recordedAt: "2026-04-16T05:30:00.000Z",
    });
    await seedingService.createResponseAssimilationRecord({
      dispositionRef: "seed_disposition_3",
      taskId: "task_237_supervisor",
      cycleId: "seed_cycle_3",
      requestId: "request_237_supervisor",
      requestLineageRef: "lineage_237_supervisor",
      evidenceCaptureBundleRef: "seed_capture_3",
      evidenceAssimilationRef: "seed_assimilation_3",
      materialDeltaAssessmentRef: "seed_delta_3",
      classificationDecisionRef: "seed_classification_3",
      requestedSafetyState: "residual_risk_flagged",
      safetyDecisionOutcome: "residual_review",
      resultingSafetyDecisionEpoch: 3,
      routingOutcome: "review_resumed_then_queued",
      recordedAt: "2026-04-16T08:30:00.000Z",
    });

    const result = await application.receiveMoreInfoReply({
      taskId: "task_237_supervisor",
      cycleId: requested.cycle.cycleId,
      actorRef: "actor_237_supervisor",
      idempotencyKey: "reply_237_supervisor",
      receivedAt: "2026-04-16T09:10:00.000Z",
      messageText: "Symptoms are still present.",
      structuredFacts: { symptomatic: true },
      changedFeatureRefs: ["new_clinical_detail"],
      autoReturnToQueue: true,
    });
    const task =
      await application.moreInfoApplication.triageApplication.triageRepositories.getTask(
        "task_237_supervisor",
      );

    expect(result.routingOutcome).toBe("supervisor_review_required");
    expect(result.safetyDecision?.requestedSafetyState).toBe("residual_risk_flagged");
    expect(result.supervisorReviewRequirement).not.toBeNull();
    expect(result.supervisorReviewRequirement?.reopenCountWithinWindow).toBe(4);
    expect(result.queueReturnTransitionRef).toBeNull();
    expect(task?.toSnapshot().status).toBe("awaiting_patient_info");
  });

  it("fails closed when the current cycle drifts before assimilation commit and leaves no reply assimilation record behind", async () => {
    const moreInfoApplication = createPhase3MoreInfoKernelApplication();
    const application = createPhase3MoreInfoResponseResafetyApplication({
      moreInfoApplication,
      beforeAssimilationCommitHook: async ({ taskId, cycleId, recordedAt }) => {
        await moreInfoApplication.requestMoreInfo({
          taskId,
          actorRef: "actor_237_drift",
          recordedAt,
          promptSetRef: "prompt_237_drift_replacement",
          channelRef: "sms_outbound",
          responseRouteFamilyRef: "patient_more_info",
          dueAt: "2026-04-16T09:40:00.000Z",
          expiresAt: "2026-04-16T10:40:00.000Z",
          reminderOffsetsMinutes: [5],
          cadencePolicyRef: "reply_window_policy_v1",
          quietHoursWindow: null,
          supersedeActiveCycleId: cycleId,
        });
      },
    });
    const requested = await requestMoreInfo(application, "237_drift");

    await expect(
      application.receiveMoreInfoReply({
        taskId: "task_237_drift",
        cycleId: requested.cycle.cycleId,
        actorRef: "actor_237_drift",
        idempotencyKey: "reply_237_drift",
        receivedAt: "2026-04-16T09:10:00.000Z",
        messageText: "New detail arrived.",
        structuredFacts: { newDetail: true },
        changedFeatureRefs: ["new_clinical_detail"],
      }),
    ).rejects.toThrow(/CURRENT_CYCLE_DRIFT/);

    const dispositions = await application.responseRepositories.listDispositionsByRequest(
      "request_237_drift",
    );
    const assimilations =
      await application.responseRepositories.listResponseAssimilationRecordsByRequest(
        "request_237_drift",
      );
    const current = await moreInfoApplication.queryTaskMoreInfo("task_237_drift");

    expect(dispositions).toHaveLength(0);
    expect(assimilations).toHaveLength(0);
    expect(current?.cycle.cycleId).not.toBe(requested.cycle.cycleId);
    expect(current?.cycle.supersedesCycleRef).toBe(requested.cycle.cycleId);
  });
});
