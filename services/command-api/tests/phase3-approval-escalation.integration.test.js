import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_APPROVAL_ESCALATION_QUERY_SURFACES,
  PHASE3_APPROVAL_ESCALATION_SCHEMA_VERSION,
  PHASE3_APPROVAL_ESCALATION_SERVICE_NAME,
  createPhase3ApprovalEscalationApplication,
  phase3ApprovalEscalationMigrationPlanRefs,
  phase3ApprovalEscalationPersistenceTables,
  phase3ApprovalEscalationRoutes,
} from "../src/phase3-approval-escalation.ts";

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
      safetyNetAdvice: "Book urgent review if breathing worsens.",
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

describe("phase 3 approval and urgent escalation seam", () => {
  it("publishes the approval and urgent escalation routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(routeIds).toEqual(
      expect.arrayContaining([
        "workspace_task_approval_escalation_current",
        "workspace_task_evaluate_approval_requirement",
        "workspace_task_request_approval",
        "workspace_task_approve_decision",
        "workspace_task_reject_decision",
        "workspace_task_invalidate_approval",
        "workspace_task_start_urgent_escalation",
        "workspace_task_record_urgent_contact_attempt",
        "workspace_task_record_urgent_outcome",
      ]),
    );
    expect(phase3ApprovalEscalationRoutes).toHaveLength(9);
    expect(PHASE3_APPROVAL_ESCALATION_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/approval-escalation",
    ]);
  });

  it("evaluates self-care closure into an explicit ApprovalCheckpoint and settles approval with a different approver", async () => {
    const application = createPhase3ApprovalEscalationApplication();
    await seedReviewTask(application, "239_approval");

    const selected = await application.endpointApplication.selectEndpoint({
      taskId: "task_239_approval",
      actorRef: "reviewer_239",
      recordedAt: "2026-04-16T10:00:00.000Z",
      chosenEndpoint: "self_care_and_safety_net",
      reasoningText: "Symptoms fit self-care with clear safety-net advice.",
      payload: payloadFor("self_care_and_safety_net"),
    });
    const evaluated = await application.evaluateApprovalRequirement({
      taskId: "task_239_approval",
      actorRef: "reviewer_239",
      recordedAt: "2026-04-16T10:01:00.000Z",
    });
    const pending = await application.requestApproval({
      taskId: "task_239_approval",
      checkpointId: evaluated.checkpoint.checkpointId,
      actorRef: "reviewer_239",
      recordedAt: "2026-04-16T10:02:00.000Z",
    });
    const approved = await application.approveDecision({
      taskId: "task_239_approval",
      checkpointId: evaluated.checkpoint.checkpointId,
      actorRef: "clinical_supervisor_239",
      recordedAt: "2026-04-16T10:03:00.000Z",
      presentedRoleRefs: ["clinical_supervisor"],
    });
    const current = await application.queryTaskApprovalEscalation("task_239_approval");

    expect(application.serviceName).toBe(PHASE3_APPROVAL_ESCALATION_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_APPROVAL_ESCALATION_SCHEMA_VERSION);
    expect(application.migrationPlanRefs).toEqual(phase3ApprovalEscalationMigrationPlanRefs);
    expect(phase3ApprovalEscalationPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_governed_approval_assessments",
        "phase3_approval_checkpoints",
        "phase3_duty_escalation_records",
        "phase3_urgent_contact_attempts",
        "phase3_urgent_escalation_outcomes",
      ]),
    );
    expect(selected.decision.chosenEndpoint).toBe("self_care_and_safety_net");
    expect(evaluated.approvalAssessment.requiredApprovalMode).toBe("required");
    expect(evaluated.approvalAssessment.matchedPolicyRuleRefs).toEqual([
      "AP_228_SELF_CARE_CLOSURE",
    ]);
    expect(pending.state).toBe("pending");
    expect(approved.state).toBe("approved");
    expect(current.checkpoint?.state).toBe("approved");
  });

  it("routes a duty-clinician urgent direct outcome into resolved_without_appointment", async () => {
    const application = createPhase3ApprovalEscalationApplication();
    await seedReviewTask(application, "239_urgent_direct");

    await application.endpointApplication.selectEndpoint({
      taskId: "task_239_urgent_direct",
      actorRef: "reviewer_urgent_direct",
      recordedAt: "2026-04-16T10:10:00.000Z",
      chosenEndpoint: "duty_clinician_escalation",
      reasoningText: "Residual high risk requires urgent duty clinician contact.",
      payload: payloadFor("duty_clinician_escalation"),
    });
    const started = await application.startUrgentEscalation({
      taskId: "task_239_urgent_direct",
      actorRef: "reviewer_urgent_direct",
      recordedAt: "2026-04-16T10:11:00.000Z",
      triggerMode: "reviewer_manual",
      triggerReasonCode: "residual_high_risk",
      severityBand: "urgent",
    });
    await application.recordUrgentContactAttempt({
      taskId: "task_239_urgent_direct",
      escalationId: started.escalation.dutyEscalationRecordId,
      actorRef: "reviewer_urgent_direct",
      recordedAt: "2026-04-16T10:12:00.000Z",
      attemptReplayKey: "urgent_direct_call_1",
      contactRouteClass: "primary_phone",
      attemptState: "connected",
      completedAt: "2026-04-16T10:13:00.000Z",
      outcomeNote: "Duty clinician provided definitive advice.",
    });
    const outcome = await application.recordUrgentOutcome({
      taskId: "task_239_urgent_direct",
      escalationId: started.escalation.dutyEscalationRecordId,
      actorRef: "reviewer_urgent_direct",
      recordedAt: "2026-04-16T10:14:00.000Z",
      outcomeClass: "direct_non_appointment",
      endpointDecisionSettlementRef: "urgent_direct_settlement_1",
      presentationArtifactRef: "urgent_direct_artifact_1",
    });
    const task = await application.triageApplication.triageRepositories.getTask(
      "task_239_urgent_direct",
    );
    const current = await application.queryTaskApprovalEscalation("task_239_urgent_direct");

    expect(started.taskTransition?.task.status).toBe("escalated");
    expect(outcome.outcomeClass).toBe("direct_non_appointment");
    expect(task?.toSnapshot().status).toBe("resolved_without_appointment");
    expect(current.escalation?.escalationState).toBe("direct_outcome_recorded");
    expect(current.outcome?.outcomeClass).toBe("direct_non_appointment");
  });

  it("cancels stale urgent escalation posture when the DecisionEpoch is superseded before another contact attempt lands", async () => {
    const application = createPhase3ApprovalEscalationApplication();
    await seedReviewTask(application, "239_stale_escalation");

    const selected = await application.endpointApplication.selectEndpoint({
      taskId: "task_239_stale_escalation",
      actorRef: "reviewer_stale_escalation",
      recordedAt: "2026-04-16T10:20:00.000Z",
      chosenEndpoint: "duty_clinician_escalation",
      reasoningText: "Residual risk needs urgent escalation.",
      payload: payloadFor("duty_clinician_escalation"),
    });
    const started = await application.startUrgentEscalation({
      taskId: "task_239_stale_escalation",
      actorRef: "reviewer_stale_escalation",
      recordedAt: "2026-04-16T10:21:00.000Z",
      triggerMode: "reviewer_manual",
      triggerReasonCode: "residual_high_risk",
      severityBand: "urgent",
    });

    await application.endpointApplication.invalidateStaleDecision({
      taskId: "task_239_stale_escalation",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_stale_escalation",
      recordedAt: "2026-04-16T10:22:00.000Z",
      manualReplace: true,
    });

    await expect(
      application.recordUrgentContactAttempt({
        taskId: "task_239_stale_escalation",
        escalationId: started.escalation.dutyEscalationRecordId,
        actorRef: "reviewer_stale_escalation",
        recordedAt: "2026-04-16T10:23:00.000Z",
        attemptReplayKey: "stale_attempt_1",
        contactRouteClass: "primary_phone",
        attemptState: "no_answer",
      }),
    ).rejects.toThrow("STALE_ESCALATION_EPOCH");

    const current = await application.queryTaskApprovalEscalation(
      "task_239_stale_escalation",
    );

    expect(current.escalation?.escalationState).toBe("cancelled");
    expect(current.escalation?.decisionSupersessionRecordRef).toBeTruthy();
  });
});
