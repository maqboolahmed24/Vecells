import { describe, expect, it } from "vitest";
import { evaluateGovernedApprovalRequirement } from "@vecells/domain-triage-workspace";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_REOPEN_LAUNCH_QUERY_SURFACES,
  PHASE3_REOPEN_LAUNCH_SCHEMA_VERSION,
  PHASE3_REOPEN_LAUNCH_SERVICE_NAME,
  createPhase3ReopenLaunchApplication,
  phase3ReopenLaunchMigrationPlanRefs,
  phase3ReopenLaunchPersistenceTables,
  phase3ReopenLaunchRoutes,
} from "../src/phase3-reopen-launch-leases.ts";

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
    clinician_callback: {
      callbackWindow: "after_18_00",
      summary: "Callback is enough for the next step.",
    },
    appointment_required: {
      appointmentReason: "Needs clinician assessment.",
      priorityBand: "same_day",
      timeframe: "today",
      modality: "telephone",
      clinicianType: "gp",
      continuityPreference: "usual_team",
      patientPreferenceSummary: "Prefers an afternoon call.",
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
  return application.approvalApplication.service.approveCheckpoint({
    checkpointId: evaluated.checkpoint.checkpointId,
    approvedBy: input.approverRef,
    approvedAt: input.approvedAt,
    presentedRoleRefs: ["clinical_supervisor"],
  });
}

describe("phase 3 reopen and next-task launch lease seam", () => {
  it("publishes the reopen and launch-lease routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(routeIds).toEqual(
      expect.arrayContaining([
        "workspace_task_reopen_launch_current",
        "workspace_task_reopen_from_resolved",
        "workspace_task_reopen_from_handoff",
        "workspace_task_reopen_from_invalidation",
        "workspace_task_issue_next_task_launch_lease",
        "workspace_task_validate_next_task_launch_lease",
        "workspace_task_invalidate_next_task_launch_lease",
      ]),
    );
    expect(phase3ReopenLaunchRoutes).toHaveLength(7);
    expect(PHASE3_REOPEN_LAUNCH_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/reopen-launch",
    ]);
  });

  it("reopens from resolved direct outcome, recalculates priority and urgency floor, and keeps replay idempotent", async () => {
    const application = createPhase3ReopenLaunchApplication();
    await seedReviewTask(application, "241_resolved");

    const selected = await application.endpointApplication.selectEndpoint({
      taskId: "task_241_resolved",
      actorRef: "reviewer_241_resolved",
      recordedAt: "2026-04-16T10:00:00.000Z",
      chosenEndpoint: "clinician_callback",
      reasoningText: "Callback is enough for the next step.",
      payload: payloadFor("clinician_callback"),
    });
    await application.endpointApplication.submitEndpointDecision({
      taskId: "task_241_resolved",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_241_resolved",
      recordedAt: "2026-04-16T10:01:00.000Z",
    });
    await application.directResolutionApplication.commitDirectResolution({
      taskId: "task_241_resolved",
      actorRef: "reviewer_241_resolved",
      recordedAt: "2026-04-16T10:02:00.000Z",
    });

    const closedTask = await application.triageApplication.triageRepositories.getTask(
      "task_241_resolved",
    );
    const reopened = await application.reopenFromResolved({
      taskId: "task_241_resolved",
      actorRef: "reviewer_241_resolved",
      recordedAt: "2026-04-16T10:03:00.000Z",
      sourceDomain: "callback",
      reasonCode: "callback_delivery_failed",
      evidenceRefs: ["callback_transport_failure"],
      priorityOverride: "same_day_return",
      reopenedByMode: "reviewer_manual",
    });
    const replay = await application.reopenFromResolved({
      taskId: "task_241_resolved",
      actorRef: "reviewer_241_resolved",
      recordedAt: "2026-04-16T10:04:00.000Z",
      sourceDomain: "callback",
      reasonCode: "callback_delivery_failed",
      evidenceRefs: ["callback_transport_failure"],
      priorityOverride: "same_day_return",
      reopenedByMode: "reviewer_manual",
    });
    const task = await application.triageApplication.triageRepositories.getTask(
      "task_241_resolved",
    );
    const request = await application.triageApplication.controlPlaneRepositories.getRequest(
      "request_241_resolved",
    );
    const bundle = await application.directResolutionApplication.queryTaskDirectResolution(
      "task_241_resolved",
    );

    expect(application.serviceName).toBe(PHASE3_REOPEN_LAUNCH_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_REOPEN_LAUNCH_SCHEMA_VERSION);
    expect(application.migrationPlanRefs).toEqual(phase3ReopenLaunchMigrationPlanRefs);
    expect(phase3ReopenLaunchPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_triage_reopen_records",
        "phase3_next_task_launch_leases",
      ]),
    );
    expect(reopened.reopenRecord.sourceDomain).toBe("callback");
    expect(reopened.reopenRecord.reasonCode).toBe("callback_delivery_failed");
    expect(reopened.priorityAdjustment).toEqual({
      priorityBand: "same_day",
      urgencyCarryFloor: 0.72,
    });
    expect(reopened.reopenedTaskTransition?.task.status).toBe("reopened");
    expect(reopened.queuedTaskTransition?.task.status).toBe("queued");
    expect(replay.reopenRecord.reopenRecordId).toBe(reopened.reopenRecord.reopenRecordId);
    expect(task?.toSnapshot().status).toBe("queued");
    expect(request?.toSnapshot().workflowState).toBe("triage_active");
    expect(request?.toSnapshot().priorityBand).toBe("same_day");
    expect(bundle.settlement?.decisionSupersessionRecordRef).toBe(
      reopened.decisionSupersessionRecordRef,
    );
    expect(bundle.callbackSeed?.decisionSupersessionRecordRef).toBe(
      reopened.decisionSupersessionRecordRef,
    );

    await expect(
      application.triageApplication.triageService.claimTask({
        taskId: "task_241_resolved",
        actorRef: "stale_tab_actor",
        presentedOwnershipEpoch: closedTask.toSnapshot().ownershipEpoch,
        presentedFencingToken: closedTask.toSnapshot().fencingToken,
        presentedLineageFenceEpoch: closedTask.toSnapshot().currentLineageFenceEpoch,
        nextOwnershipEpoch: closedTask.toSnapshot().ownershipEpoch + 1,
        nextLineageFenceEpoch: closedTask.toSnapshot().currentLineageFenceEpoch + 1,
        nextFencingToken: "stale_tab_reopen_claim",
        lifecycleLeaseRef: "lease_stale_tab_reopen_claim",
        leaseAuthorityRef: "lease_authority_triage_workspace",
        leaseTtlSeconds: 300,
        claimedAt: "2026-04-16T10:05:00.000Z",
        command: {
          actorRef: "stale_tab_actor",
          routeIntentTupleHash: "stale_tab_route_tuple",
          routeIntentBindingRef: "stale_tab_route_binding",
          commandActionRecordRef: "stale_tab_action",
          commandSettlementRecordRef: "stale_tab_settlement",
          transitionEnvelopeRef: "stale_tab_transition",
          releaseRecoveryDispositionRef: "stale_tab_recovery",
          causalToken: "stale_tab_cause",
          recordedAt: "2026-04-16T10:05:00.000Z",
        },
      }),
    ).rejects.toThrow(/stale/i);
  });

  it("reopens from handoff bounce-back and preserves lineage to the invalidated booking path", async () => {
    const application = createPhase3ReopenLaunchApplication();
    await seedReviewTask(application, "241_handoff");

    const selected = await application.endpointApplication.selectEndpoint({
      taskId: "task_241_handoff",
      actorRef: "reviewer_241_handoff",
      recordedAt: "2026-04-16T10:10:00.000Z",
      chosenEndpoint: "appointment_required",
      reasoningText: "A booking handoff is required.",
      payload: payloadFor("appointment_required"),
    });
    await application.endpointApplication.submitEndpointDecision({
      taskId: "task_241_handoff",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_241_handoff",
      recordedAt: "2026-04-16T10:11:00.000Z",
    });
    await materializeApprovedCheckpoint(application, {
      taskId: "task_241_handoff",
      actorRef: "reviewer_241_handoff",
      approverRef: "clinical_supervisor_241_handoff",
      evaluatedAt: "2026-04-16T10:11:30.000Z",
      requestedAt: "2026-04-16T10:11:40.000Z",
      approvedAt: "2026-04-16T10:11:50.000Z",
    });
    await application.directResolutionApplication.commitDirectResolution({
      taskId: "task_241_handoff",
      actorRef: "reviewer_241_handoff",
      recordedAt: "2026-04-16T10:12:00.000Z",
    });

    const reopened = await application.reopenFromHandoff({
      taskId: "task_241_handoff",
      actorRef: "reviewer_241_handoff",
      recordedAt: "2026-04-16T10:13:00.000Z",
      reasonCode: "booking_service_rejected",
      evidenceRefs: ["booking_capacity_reject_1"],
      priorityOverride: "urgent_return",
      reopenedByMode: "reviewer_manual",
    });
    const bundle = await application.directResolutionApplication.queryTaskDirectResolution(
      "task_241_handoff",
    );
    const task = await application.triageApplication.triageRepositories.getTask(
      "task_241_handoff",
    );

    expect(reopened.reopenRecord.sourceDomain).toBe("booking_handoff");
    expect(reopened.priorityAdjustment).toEqual({
      priorityBand: "urgent",
      urgencyCarryFloor: 0.92,
    });
    expect(reopened.launchContext.returnAnchorRef).toBe("anchor_241_handoff");
    expect(bundle.bookingIntent?.decisionSupersessionRecordRef).toBe(
      reopened.decisionSupersessionRecordRef,
    );
    expect(bundle.settlement?.decisionSupersessionRecordRef).toBe(
      reopened.decisionSupersessionRecordRef,
    );
    expect(task?.toSnapshot().status).toBe("queued");
  });

  it("issues a ready NextTaskLaunchLease, degrades it on drift, and does not infer calm completion from issuance alone", async () => {
    const application = createPhase3ReopenLaunchApplication();
    const created = await application.triageApplication.createTask(createTaskInput("241_launch"));
    const launchContext = await application.triageApplication.triageRepositories.getLaunchContext(
      created.task.launchContextRef,
    );
    await application.triageApplication.triageRepositories.saveLaunchContext(
      launchContext.update({
        nextTaskCandidateRefs: ["task_241_launch_candidate"],
        nextTaskRankSnapshotRef: "rank_241_launch_next",
        updatedAt: "2026-04-16T10:20:00.000Z",
      }),
      { expectedVersion: launchContext.version },
    );

    const issued = await application.issueNextTaskLaunchLease({
      taskId: "task_241_launch",
      actorRef: "reviewer_241_launch",
      recordedAt: "2026-04-16T10:21:00.000Z",
      nextTaskCandidateRef: "task_241_launch_candidate",
      continuityEvidenceRef: "continuity_241_launch",
      sourceSettlementEnvelopeRef: "completion_241_launch",
      sourceRankSnapshotRef: "rank_241_launch_next",
      expiresAt: "2026-04-16T10:31:00.000Z",
    });
    const rankDrift = await application.validateNextTaskLaunchLease({
      taskId: "task_241_launch",
      actorRef: "reviewer_241_launch",
      nextTaskLaunchLeaseId: issued.nextTaskLaunchLeaseId,
      recordedAt: "2026-04-16T10:22:00.000Z",
      currentSourceRankSnapshotRef: "rank_241_launch_newer",
    });
    const reissued = await application.issueNextTaskLaunchLease({
      taskId: "task_241_launch",
      actorRef: "reviewer_241_launch",
      recordedAt: "2026-04-16T10:23:00.000Z",
      nextTaskCandidateRef: "task_241_launch_candidate",
      continuityEvidenceRef: "continuity_241_launch",
      sourceSettlementEnvelopeRef: "completion_241_launch",
      sourceRankSnapshotRef: "rank_241_launch_next",
      expiresAt: "2026-04-16T10:33:00.000Z",
    });
    const continuityDrift = await application.validateNextTaskLaunchLease({
      taskId: "task_241_launch",
      actorRef: "reviewer_241_launch",
      nextTaskLaunchLeaseId: reissued.nextTaskLaunchLeaseId,
      recordedAt: "2026-04-16T10:24:00.000Z",
      currentContinuityEvidenceRef: "continuity_241_launch_shifted",
    });
    const task = await application.triageApplication.triageRepositories.getTask("task_241_launch");
    const bundle = await application.queryTaskReopenLaunch("task_241_launch");

    expect(issued.launchEligibilityState).toBe("ready");
    expect(rankDrift.launchEligibilityState).toBe("stale");
    expect(rankDrift.leaseState).toBe("invalidated");
    expect(continuityDrift.launchEligibilityState).toBe("continuity_blocked");
    expect(continuityDrift.leaseState).toBe("invalidated");
    expect(task?.toSnapshot().status).toBe("triage_ready");
    expect(task?.toSnapshot().taskCompletionSettlementEnvelopeRef).toBe("completion_241_launch");
    expect(bundle.nextTaskLaunchLease?.nextTaskLaunchLeaseId).toBe(
      continuityDrift.nextTaskLaunchLeaseId,
    );
  });

  it("blocks next-task launch when stale-owner recovery is open on reopen-sensitive work", async () => {
    const application = createPhase3ReopenLaunchApplication();
    await seedReviewTask(application, "241_stale_owner");
    const taskBeforeBreak = await application.triageApplication.triageRepositories.getTask(
      "task_241_stale_owner",
    );
    const launchContext = await application.triageApplication.triageRepositories.getLaunchContext(
      taskBeforeBreak.toSnapshot().launchContextRef,
    );
    await application.triageApplication.triageRepositories.saveLaunchContext(
      launchContext.update({
        nextTaskCandidateRefs: ["task_241_stale_owner_candidate"],
        nextTaskRankSnapshotRef: "rank_241_stale_owner_next",
        updatedAt: "2026-04-16T10:30:00.000Z",
      }),
      { expectedVersion: launchContext.version },
    );
    await application.triageApplication.markStaleOwnerDetected({
      taskId: "task_241_stale_owner",
      authorizedByRef: "supervisor_241_stale_owner",
      detectedAt: "2026-04-16T10:31:00.000Z",
      breakReason: "stale_tab_reopen_sensitive_work",
      breakGuardSeconds: 0,
    });

    const issued = await application.issueNextTaskLaunchLease({
      taskId: "task_241_stale_owner",
      actorRef: "reviewer_241_stale_owner",
      recordedAt: "2026-04-16T10:32:00.000Z",
      nextTaskCandidateRef: "task_241_stale_owner_candidate",
      continuityEvidenceRef: "continuity_241_stale_owner",
      sourceSettlementEnvelopeRef: "completion_241_stale_owner",
      sourceRankSnapshotRef: "rank_241_stale_owner_next",
      expiresAt: "2026-04-16T10:42:00.000Z",
    });

    expect(issued.launchEligibilityState).toBe("blocked");
    expect(issued.blockingReasonRefs.some((reason) => reason.startsWith("TASK_241_STALE_OWNER_RECOVERY:"))).toBe(true);
  });
});
