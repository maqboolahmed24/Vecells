import { describe, expect, it } from "vitest";
import { evaluateGovernedApprovalRequirement } from "@vecells/domain-triage-workspace";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_TASK_COMPLETION_CONTINUITY_QUERY_SURFACES,
  PHASE3_TASK_COMPLETION_CONTINUITY_SCHEMA_VERSION,
  PHASE3_TASK_COMPLETION_CONTINUITY_SERVICE_NAME,
  createPhase3TaskCompletionContinuityApplication,
  phase3TaskCompletionContinuityMigrationPlanRefs,
  phase3TaskCompletionContinuityPersistenceTables,
  phase3TaskCompletionContinuityRoutes,
} from "../src/phase3-task-completion-continuity.ts";

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
    createdAt: "2026-04-16T13:00:00.000Z",
  };
}

async function seedReviewTask(application, seed) {
  const created = await application.reopenLaunchApplication.triageApplication.createTask(
    createTaskInput(seed),
  );
  await application.reopenLaunchApplication.triageApplication.moveTaskToQueue({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    queuedAt: "2026-04-16T13:01:00.000Z",
  });
  await application.reopenLaunchApplication.triageApplication.claimTask({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-16T13:02:00.000Z",
  });
  return application.reopenLaunchApplication.triageApplication.enterReview({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    openedAt: "2026-04-16T13:03:00.000Z",
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_slice_${seed}`,
    audienceSurfaceRuntimeBindingRef: `runtime_binding_${seed}`,
    reviewActionLeaseRef: `review_action_${seed}`,
    selectedAnchorRef: `anchor_review_${seed}`,
    selectedAnchorTupleHashRef: `anchor_review_hash_${seed}`,
  });
}

async function prepareNextTaskCandidate(application, taskId, nextTaskCandidateRef, rankSnapshotRef) {
  const task = await application.reopenLaunchApplication.triageApplication.triageRepositories.getTask(
    taskId,
  );
  const launchContext =
    await application.reopenLaunchApplication.triageApplication.triageRepositories.getLaunchContext(
      task.toSnapshot().launchContextRef,
    );
  const updated = launchContext.update({
    nextTaskCandidateRefs: [nextTaskCandidateRef],
    nextTaskRankSnapshotRef: rankSnapshotRef,
    nextTaskBlockingReasonRefs: ["TASK_242_NEXT_TASK_GATED"],
    nextTaskLaunchState: "gated",
    updatedAt: "2026-04-16T13:04:00.000Z",
  });
  await application.reopenLaunchApplication.triageApplication.triageRepositories.saveLaunchContext(
    updated,
    { expectedVersion: launchContext.version },
  );
}

function payloadFor(endpoint) {
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
  return base[endpoint];
}

async function materializeApprovedCheckpoint(application, taskId, actorRef, approverRef) {
  const bundle = await application.reopenLaunchApplication.endpointApplication.queryTaskEndpointDecision(
    taskId,
  );
  const evaluatedRequirement = evaluateGovernedApprovalRequirement({
    taskId,
    requestId: bundle.epoch.requestId,
    decisionEpochRef: bundle.epoch.epochId,
    decisionId: bundle.decision.decisionId,
    endpointCode: bundle.decision.chosenEndpoint,
    payload: bundle.decision.payload,
    evaluatedAt: "2026-04-16T13:20:30.000Z",
  });
  const evaluated = await application.reopenLaunchApplication.approvalApplication.service.evaluateApprovalRequirement(
    {
      assessment: {
        assessmentId: `approval_assessment_${taskId}_${evaluatedRequirement.tupleHash}`,
        taskId,
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
        requiredApprovalMode: bundle.approvalAssessment.requiredApprovalMode,
        checkpointState: bundle.approvalAssessment.requiredApprovalMode,
        reasonCodeRefs: evaluatedRequirement.reasonCodeRefs,
        evaluatedAt: "2026-04-16T13:20:30.000Z",
        tupleHash: evaluatedRequirement.tupleHash,
        version: 1,
      },
      checkpointId: `checkpoint_${taskId}`,
      actionType: evaluatedRequirement.actionType,
      requestedBy: actorRef,
      requestedAt: "2026-04-16T13:20:30.000Z",
      lifecycleLeaseRef: `lease_${taskId}`,
      leaseAuthorityRef: "lease_authority_triage_approval",
      leaseTtlSeconds: 1800,
      lastHeartbeatAt: "2026-04-16T13:20:30.000Z",
      fencingToken: `fence_${taskId}`,
      ownershipEpoch: 1,
      currentLineageFenceEpoch: bundle.epoch.lineageFenceEpoch ?? 1,
    },
  );
  await application.reopenLaunchApplication.approvalApplication.service.requestApproval({
    checkpointId: evaluated.checkpoint.checkpointId,
    requestedBy: actorRef,
    requestedAt: "2026-04-16T13:20:40.000Z",
  });
  return application.reopenLaunchApplication.approvalApplication.service.approveCheckpoint({
    checkpointId: evaluated.checkpoint.checkpointId,
    approvedBy: approverRef,
    approvedAt: "2026-04-16T13:20:50.000Z",
    presentedRoleRefs: ["clinical_supervisor"],
  });
}

describe("phase 3 task completion and continuity seam", () => {
  it("publishes the 242 completion and continuity routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(routeIds).toEqual(
      expect.arrayContaining([
        "workspace_task_completion_continuity_current",
        "workspace_task_settle_completion",
        "workspace_task_record_manual_handoff_requirement",
        "workspace_task_compute_continuity_evidence",
        "workspace_task_evaluate_next_task_readiness",
        "workspace_task_invalidate_stale_continuity",
      ]),
    );
    expect(phase3TaskCompletionContinuityRoutes).toHaveLength(6);
    expect(PHASE3_TASK_COMPLETION_CONTINUITY_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/completion-continuity",
    ]);
  });

  it("keeps calm completion gated until a live launch lease, stable continuity evidence, and queue snapshot align", async () => {
    const application = createPhase3TaskCompletionContinuityApplication();
    await seedReviewTask(application, "242_ready");
    await prepareNextTaskCandidate(
      application,
      "task_242_ready",
      "task_candidate_242_ready",
      "rank_242_ready_next",
    );

    const selected = await application.reopenLaunchApplication.endpointApplication.selectEndpoint({
      taskId: "task_242_ready",
      actorRef: "reviewer_242_ready",
      recordedAt: "2026-04-16T13:10:00.000Z",
      chosenEndpoint: "clinician_callback",
      reasoningText: "Callback is enough for the next step.",
      payload: payloadFor("clinician_callback"),
    });
    await application.reopenLaunchApplication.endpointApplication.submitEndpointDecision({
      taskId: "task_242_ready",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_242_ready",
      recordedAt: "2026-04-16T13:11:00.000Z",
    });
    await application.reopenLaunchApplication.directResolutionApplication.commitDirectResolution({
      taskId: "task_242_ready",
      actorRef: "reviewer_242_ready",
      recordedAt: "2026-04-16T13:12:00.000Z",
    });

    const settled = await application.settleTaskCompletion({
      taskId: "task_242_ready",
      actorRef: "reviewer_242_ready",
      recordedAt: "2026-04-16T13:13:00.000Z",
    });

    expect(application.serviceName).toBe(PHASE3_TASK_COMPLETION_CONTINUITY_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_TASK_COMPLETION_CONTINUITY_SCHEMA_VERSION);
    expect(application.migrationPlanRefs).toEqual(phase3TaskCompletionContinuityMigrationPlanRefs);
    expect(phase3TaskCompletionContinuityPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_task_completion_settlement_envelopes",
        "phase3_operator_handoff_frames",
        "phase3_workspace_continuity_evidence_projections",
        "phase3_workspace_trust_envelopes",
      ]),
    );
    expect(settled.completionEnvelope.authoritativeSettlementState).toBe("settled");
    expect(settled.completionEnvelope.nextTaskLaunchState).toBe("gated");
    expect(settled.workspaceContinuityEvidenceProjection.validationState).toBe("trusted");
    expect(settled.workspaceTrustEnvelope.completionCalmState).toBe("pending_settlement");

    await application.reopenLaunchApplication.issueNextTaskLaunchLease({
      taskId: "task_242_ready",
      actorRef: "reviewer_242_ready",
      recordedAt: "2026-04-16T13:14:00.000Z",
      nextTaskCandidateRef: "task_candidate_242_ready",
      continuityEvidenceRef: settled.completionEnvelope.experienceContinuityEvidenceRef,
      sourceSettlementEnvelopeRef:
        settled.completionEnvelope.taskCompletionSettlementEnvelopeId,
      sourceRankSnapshotRef: settled.completionEnvelope.sourceQueueRankSnapshotRef,
      expiresAt: "2026-04-16T13:44:00.000Z",
    });

    const ready = await application.evaluateNextTaskReadiness({
      taskId: "task_242_ready",
      actorRef: "reviewer_242_ready",
      recordedAt: "2026-04-16T13:15:00.000Z",
      currentSourceRankSnapshotRef: settled.completionEnvelope.sourceQueueRankSnapshotRef,
      currentSourceSettlementEnvelopeRef:
        settled.completionEnvelope.taskCompletionSettlementEnvelopeId,
      currentContinuityEvidenceRef: settled.completionEnvelope.experienceContinuityEvidenceRef,
      currentReturnAnchorRef: settled.launchContext.returnAnchorRef,
    });

    expect(ready.completionEnvelope.taskCompletionSettlementEnvelopeId).toBe(
      settled.completionEnvelope.taskCompletionSettlementEnvelopeId,
    );
    expect(ready.completionEnvelope.nextTaskLaunchState).toBe("ready");
    expect(ready.workspaceTrustEnvelope.completionCalmState).toBe("eligible");
    expect(ready.launchContext.nextTaskLaunchState).toBe("ready");
  });

  it("creates an explicit OperatorHandoffFrame for booking baton cases instead of hiding the blocker in notes", async () => {
    const application = createPhase3TaskCompletionContinuityApplication();
    await seedReviewTask(application, "242_handoff");

    const selected = await application.reopenLaunchApplication.endpointApplication.selectEndpoint({
      taskId: "task_242_handoff",
      actorRef: "reviewer_242_handoff",
      recordedAt: "2026-04-16T13:20:00.000Z",
      chosenEndpoint: "appointment_required",
      reasoningText: "A booking handoff is required.",
      payload: payloadFor("appointment_required"),
    });
    await application.reopenLaunchApplication.endpointApplication.submitEndpointDecision({
      taskId: "task_242_handoff",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_242_handoff",
      recordedAt: "2026-04-16T13:21:00.000Z",
    });
    await materializeApprovedCheckpoint(
      application,
      "task_242_handoff",
      "reviewer_242_handoff",
      "clinical_supervisor_242_handoff",
    );
    await application.reopenLaunchApplication.directResolutionApplication.commitDirectResolution({
      taskId: "task_242_handoff",
      actorRef: "reviewer_242_handoff",
      recordedAt: "2026-04-16T13:22:00.000Z",
    });

    const bundle = await application.settleTaskCompletion({
      taskId: "task_242_handoff",
      actorRef: "reviewer_242_handoff",
      recordedAt: "2026-04-16T13:23:00.000Z",
    });

    expect(bundle.completionEnvelope.authoritativeSettlementState).toBe(
      "manual_handoff_required",
    );
    expect(bundle.completionEnvelope.nextTaskLaunchState).toBe("blocked");
    expect(bundle.operatorHandoffFrame).toBeTruthy();
    expect(bundle.operatorHandoffFrame.handoffType).toBe("booking");
    expect(bundle.operatorHandoffFrame.nextOwnerRef).toBe("owner_booking_queue");
    expect(bundle.completionEnvelope.blockingReasonRefs).toContain(
      "TASK_242_MANUAL_HANDOFF_REQUIRED",
    );
  });

  it("computes trusted, degraded, stale, and blocked continuity states and invalidates reopened calm completion", async () => {
    const application = createPhase3TaskCompletionContinuityApplication();
    await seedReviewTask(application, "242_continuity");

    const selected = await application.reopenLaunchApplication.endpointApplication.selectEndpoint({
      taskId: "task_242_continuity",
      actorRef: "reviewer_242_continuity",
      recordedAt: "2026-04-16T13:30:00.000Z",
      chosenEndpoint: "clinician_callback",
      reasoningText: "Callback is enough for the next step.",
      payload: payloadFor("clinician_callback"),
    });
    await application.reopenLaunchApplication.endpointApplication.submitEndpointDecision({
      taskId: "task_242_continuity",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_242_continuity",
      recordedAt: "2026-04-16T13:31:00.000Z",
    });
    await application.reopenLaunchApplication.directResolutionApplication.commitDirectResolution({
      taskId: "task_242_continuity",
      actorRef: "reviewer_242_continuity",
      recordedAt: "2026-04-16T13:32:00.000Z",
    });
    const settled = await application.settleTaskCompletion({
      taskId: "task_242_continuity",
      actorRef: "reviewer_242_continuity",
      recordedAt: "2026-04-16T13:33:00.000Z",
    });

    const degraded = await application.computeContinuityEvidence({
      taskId: "task_242_continuity",
      recordedAt: "2026-04-16T13:34:00.000Z",
      continuitySourceQueueRankSnapshotRef: "rank_242_continuity_newer",
    });
    const stale = await application.computeContinuityEvidence({
      taskId: "task_242_continuity",
      recordedAt: "2026-04-16T13:35:00.000Z",
      currentSurfacePublicationRef: "publication_242_continuity_drifted",
    });
    const blocked = await application.computeContinuityEvidence({
      taskId: "task_242_continuity",
      recordedAt: "2026-04-16T13:36:00.000Z",
      continuitySelectedAnchorTupleHashRef: "anchor_hash_242_continuity_drifted",
    });
    const invalidated = await application.invalidateStaleContinuity({
      taskId: "task_242_continuity",
      actorRef: "reviewer_242_continuity",
      recordedAt: "2026-04-16T13:37:00.000Z",
      invalidationReason: "reopened",
    });

    expect(settled.workspaceContinuityEvidenceProjection.validationState).toBe("trusted");
    expect(degraded.workspaceContinuityEvidenceProjection.validationState).toBe("degraded");
    expect(stale.workspaceContinuityEvidenceProjection.validationState).toBe("stale");
    expect(blocked.workspaceContinuityEvidenceProjection.validationState).toBe("blocked");
    expect(blocked.completionEnvelope.blockingReasonRefs).toContain(
      "WORKSPACE_232_SELECTED_ANCHOR_LOST",
    );
    expect(invalidated.completionEnvelope.authoritativeSettlementState).toBe(
      "recovery_required",
    );
    expect(invalidated.workspaceTrustEnvelope.completionCalmState).toBe("blocked");
  });
});
