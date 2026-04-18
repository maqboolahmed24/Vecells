import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import { createPhase3MoreInfoResponseResafetyService } from "@vecells/domain-triage-workspace";
import { createPhase3MoreInfoKernelApplication } from "../src/phase3-more-info-kernel.ts";
import { createPhase3MoreInfoResponseResafetyApplication } from "../src/phase3-more-info-response-resafety.ts";
import { createPhase3EndpointDecisionEngineApplication } from "../src/phase3-endpoint-decision-engine.ts";
import { createPhase3ApprovalEscalationApplication } from "../src/phase3-approval-escalation.ts";

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
    createdAt: "2026-04-18T09:00:00.000Z",
  };
}

async function seedReviewTask(triageApplication, seed) {
  const created = await triageApplication.createTask(createTaskInput(seed));
  const queued = await triageApplication.moveTaskToQueue({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    queuedAt: "2026-04-18T09:01:00.000Z",
  });
  const claimed = await triageApplication.claimTask({
    taskId: queued.task.taskId,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-18T09:02:00.000Z",
  });
  await triageApplication.enterReview({
    taskId: claimed.task.taskId,
    actorRef: `actor_${seed}`,
    openedAt: "2026-04-18T09:03:00.000Z",
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_slice_${seed}`,
    audienceSurfaceRuntimeBindingRef: `runtime_binding_${seed}`,
    reviewActionLeaseRef: `review_action_${seed}`,
    selectedAnchorRef: `anchor_review_${seed}`,
    selectedAnchorTupleHashRef: `anchor_review_hash_${seed}`,
  });
}

async function requestMoreInfo(application, seed, overrides = {}) {
  await seedReviewTask(application.triageApplication, seed);
  return application.requestMoreInfo({
    taskId: `task_${seed}`,
    actorRef: `actor_${seed}`,
    recordedAt: "2026-04-18T09:04:00.000Z",
    promptSetRef: `question_set_${seed}.v1`,
    channelRef: "sms_outbound",
    responseRouteFamilyRef: "patient_more_info",
    dueAt: "2026-04-18T09:20:00.000Z",
    expiresAt: "2026-04-18T10:20:00.000Z",
    reminderOffsetsMinutes: [5, 10],
    cadencePolicyRef: "reply_window_policy_v1",
    quietHoursWindow: null,
    ...overrides,
  });
}

async function requestMoreInfoForResponse(application, seed, overrides = {}) {
  await seedReviewTask(application.moreInfoApplication.triageApplication, seed);
  return application.moreInfoApplication.requestMoreInfo({
    taskId: `task_${seed}`,
    actorRef: `actor_${seed}`,
    recordedAt: "2026-04-18T09:04:00.000Z",
    promptSetRef: `question_set_${seed}.v1`,
    channelRef: "sms_outbound",
    responseRouteFamilyRef: "patient_more_info",
    dueAt: "2026-04-18T09:20:00.000Z",
    expiresAt: "2026-04-18T10:20:00.000Z",
    reminderOffsetsMinutes: [5, 10],
    cadencePolicyRef: "reply_window_policy_v1",
    quietHoursWindow: null,
    ...overrides,
  });
}

async function seedDecisionReviewTask(application, seed) {
  await seedReviewTask(application.triageApplication, seed);
}

function payloadFor(endpoint, overrides = {}) {
  const base = {
    admin_resolution: { summary: "Administrative fix only." },
    self_care_and_safety_net: {
      summary: "Self-care is appropriate.",
      safetyNetAdvice: "Book urgent review if breathing worsens.",
    },
    clinician_message: { messageBody: "Please confirm current wheeze frequency." },
    clinician_callback: { callbackWindow: "after_18_00" },
    appointment_required: { appointmentReason: "Needs same-day examination." },
    pharmacy_first_candidate: { medicationQuestion: "Possible inhaler side effect." },
    duty_clinician_escalation: { escalationReason: "Potential deterioration." },
  };
  return {
    ...base[endpoint],
    ...overrides,
  };
}

describe("273 phase 3 decision-cycle assurance", () => {
  it("keeps more-info checkpoint, reminder, supersession, and expiry authority on the live checkpoint chain", async () => {
    const application = createPhase3MoreInfoKernelApplication();
    const requested = await requestMoreInfo(application, "273_checkpoint", {
      dueAt: "2026-04-18T09:20:00.000Z",
      expiresAt: "2026-04-18T10:40:00.000Z",
      reminderOffsetsMinutes: [5],
      promptSetRef: "question_set_273_checkpoint.v1",
    });

    const initial = await application.drainReminderWorker({
      evaluatedAt: "2026-04-18T09:04:05.000Z",
    });
    const reminderDue = await application.recomputeCheckpoint({
      cycleId: requested.cycle.cycleId,
      evaluatedAt: "2026-04-18T09:15:00.000Z",
    });
    const reminder = await application.drainReminderWorker({
      evaluatedAt: "2026-04-18T09:15:05.000Z",
    });
    const reminderReplay = await application.drainReminderWorker({
      evaluatedAt: "2026-04-18T09:15:05.000Z",
    });
    const lateReview = await application.recomputeCheckpoint({
      cycleId: requested.cycle.cycleId,
      evaluatedAt: "2026-04-18T09:21:00.000Z",
    });
    const replacement = await application.requestMoreInfo({
      taskId: "task_273_checkpoint",
      actorRef: "actor_273_checkpoint",
      recordedAt: "2026-04-18T09:22:00.000Z",
      promptSetRef: "question_set_273_checkpoint.v2",
      channelRef: "sms_outbound",
      responseRouteFamilyRef: "patient_more_info",
      dueAt: "2026-04-18T09:50:00.000Z",
      expiresAt: "2026-04-18T10:50:00.000Z",
      reminderOffsetsMinutes: [5],
      cadencePolicyRef: "reply_window_policy_v2",
      quietHoursWindow: null,
      supersedeActiveCycleId: requested.cycle.cycleId,
    });
    const expiryCycle = await requestMoreInfo(application, "273_checkpoint_expiry", {
      dueAt: "2026-04-18T09:08:00.000Z",
      expiresAt: "2026-04-18T09:12:00.000Z",
      reminderOffsetsMinutes: [1],
      promptSetRef: "question_set_273_checkpoint_expiry.v1",
    });
    const expired = await application.expireCycle({
      cycleId: expiryCycle.cycle.cycleId,
      actorRef: "actor_273_checkpoint_expiry",
      recordedAt: "2026-04-18T09:13:00.000Z",
    });

    expect(initial.dispatched.map((entry) => entry.effectType)).toEqual([
      "initial_delivery",
    ]);
    expect(reminderDue.checkpoint.replyWindowState).toBe("reminder_due");
    expect(reminder.dispatched.map((entry) => entry.effectType)).toEqual([
      "reminder_send",
    ]);
    expect(
      reminderReplay.outboxEntries.filter(
        (entry) => entry.effectType === "reminder_send",
      ),
    ).toHaveLength(1);
    expect(lateReview.checkpoint.replyWindowState).toBe("late_review");
    expect(replacement.cycle.promptSetRef).toBe("question_set_273_checkpoint.v2");
    expect(replacement.supersededCycle?.cycle.promptSetRef).toBe(
      "question_set_273_checkpoint.v1",
    );
    expect(replacement.supersededCycle?.checkpoint.replyWindowState).toBe(
      "superseded",
    );
    expect(
      application
        .listOutboxEntries()
        .filter(
          (entry) =>
            entry.cycleId === requested.cycle.cycleId &&
            entry.dispatchState === "pending",
        ),
    ).toHaveLength(0);
    expect(expired.cycle.state).toBe("expired");
    expect(expired.checkpoint.replyWindowState).toBe("expired");
  });

  it("distinguishes accepted, late, superseded, expired, blocked, and mismatched reply dispositions", async () => {
    const application = createPhase3MoreInfoResponseResafetyApplication();

    const inWindow = await requestMoreInfoForResponse(application, "273_in_window");
    const accepted = await application.receiveMoreInfoReply({
      taskId: "task_273_in_window",
      cycleId: inWindow.cycle.cycleId,
      actorRef: "actor_273_in_window",
      idempotencyKey: "reply_273_in_window",
      receivedAt: "2026-04-18T09:10:00.000Z",
      messageText: "Breathing is much worse and I feel faint.",
      structuredFacts: { worsening: true, faint: true },
      changedFeatureRefs: ["urgent_red_flag", "symptom_worsened"],
      autoReturnToQueue: true,
    });

    const late = await requestMoreInfoForResponse(application, "273_late_review", {
      dueAt: "2026-04-18T09:05:00.000Z",
      expiresAt: "2026-04-18T09:30:00.000Z",
    });
    await application.moreInfoApplication.recomputeCheckpoint({
      cycleId: late.cycle.cycleId,
      evaluatedAt: "2026-04-18T09:10:00.000Z",
    });
    const acceptedLate = await application.receiveMoreInfoReply({
      taskId: "task_273_late_review",
      cycleId: late.cycle.cycleId,
      actorRef: "actor_273_late_review",
      idempotencyKey: "reply_273_late_review",
      receivedAt: "2026-04-18T09:11:00.000Z",
      messageText: "The rash spread overnight.",
      structuredFacts: { rashSpread: true },
      changedFeatureRefs: ["new_clinical_detail"],
      autoReturnToQueue: true,
    });

    const superseded = await requestMoreInfoForResponse(application, "273_superseded");
    await application.moreInfoApplication.requestMoreInfo({
      taskId: "task_273_superseded",
      actorRef: "actor_273_superseded",
      recordedAt: "2026-04-18T09:06:00.000Z",
      promptSetRef: "question_set_273_superseded.v2",
      channelRef: "sms_outbound",
      responseRouteFamilyRef: "patient_more_info",
      dueAt: "2026-04-18T09:40:00.000Z",
      expiresAt: "2026-04-18T10:40:00.000Z",
      reminderOffsetsMinutes: [5],
      cadencePolicyRef: "reply_window_policy_v2",
      quietHoursWindow: null,
      supersedeActiveCycleId: superseded.cycle.cycleId,
    });
    const supersededReply = await application.receiveMoreInfoReply({
      taskId: "task_273_superseded",
      cycleId: superseded.cycle.cycleId,
      actorRef: "actor_273_superseded",
      idempotencyKey: "reply_273_superseded",
      receivedAt: "2026-04-18T09:08:00.000Z",
      messageText: "Replying on the older secure link.",
    });

    const expired = await requestMoreInfoForResponse(application, "273_expired", {
      dueAt: "2026-04-18T09:05:00.000Z",
      expiresAt: "2026-04-18T09:15:00.000Z",
    });
    await application.moreInfoApplication.expireCycle({
      cycleId: expired.cycle.cycleId,
      actorRef: "actor_273_expired",
      recordedAt: "2026-04-18T09:16:00.000Z",
    });
    const expiredReply = await application.receiveMoreInfoReply({
      taskId: "task_273_expired",
      cycleId: expired.cycle.cycleId,
      actorRef: "actor_273_expired",
      idempotencyKey: "reply_273_expired",
      receivedAt: "2026-04-18T09:17:00.000Z",
      messageText: "Replying after the authoritative window.",
    });

    const blocked = await requestMoreInfoForResponse(application, "273_blocked");
    const blockedReply = await application.receiveMoreInfoReply({
      taskId: "task_273_blocked",
      cycleId: blocked.cycle.cycleId,
      actorRef: "actor_273_blocked",
      idempotencyKey: "reply_273_blocked",
      receivedAt: "2026-04-18T09:10:00.000Z",
      messageText: "I cannot use this route until my contact repair finishes.",
      repairBlockReasonRefs: ["contact_route_disputed"],
    });

    await expect(
      application.receiveMoreInfoReply({
        taskId: "task_273_wrong_request",
        cycleId: blocked.cycle.cycleId,
        actorRef: "actor_273_blocked",
        idempotencyKey: "reply_273_mismatch",
        receivedAt: "2026-04-18T09:11:00.000Z",
        messageText: "This should fail closed.",
      }),
    ).rejects.toThrow("MORE_INFO_TASK_CYCLE_MISMATCH");

    expect(accepted.disposition.dispositionClass).toBe("accepted_in_window");
    expect(accepted.routingOutcome).toBe("urgent_return");
    expect(accepted.safetyDecision?.requestedSafetyState).toBe(
      "urgent_diversion_required",
    );

    expect(acceptedLate.disposition.dispositionClass).toBe("accepted_late_review");
    expect(acceptedLate.routingOutcome).toBe("review_resumed_then_queued");

    expect(supersededReply.disposition.dispositionClass).toBe(
      "superseded_duplicate",
    );
    expect(supersededReply.responseAssimilation).toBeNull();

    expect(expiredReply.disposition.dispositionClass).toBe("expired_rejected");
    expect(expiredReply.responseAssimilation).toBeNull();

    expect(blockedReply.disposition.dispositionClass).toBe("blocked_repair");
    expect(blockedReply.responseAssimilation).toBeNull();
  });

  it("keeps re-safety bounded on technical-only replies, fails contradictions closed, and raises churn guard after repeated reopen oscillation", async () => {
    const application = createPhase3MoreInfoResponseResafetyApplication();

    const bounded = await requestMoreInfoForResponse(application, "273_bounded");
    const boundedResult = await application.receiveMoreInfoReply({
      taskId: "task_273_bounded",
      cycleId: bounded.cycle.cycleId,
      actorRef: "actor_273_bounded",
      idempotencyKey: "reply_273_bounded",
      receivedAt: "2026-04-18T09:09:00.000Z",
      messageText: "The rash spread slightly but I am not faint or breathless.",
      structuredFacts: { rashSpread: true, noBreathlessness: true },
      changedFeatureRefs: ["new_clinical_detail"],
      autoReturnToQueue: true,
    });

    const contradiction = await requestMoreInfoForResponse(
      application,
      "273_contradiction",
    );
    await expect(
      application.receiveMoreInfoReply({
        taskId: "task_273_contradiction",
        cycleId: contradiction.cycle.cycleId,
        actorRef: "actor_273_contradiction",
        idempotencyKey: "reply_273_contradiction",
        receivedAt: "2026-04-18T09:10:00.000Z",
        messageText: "The timing sounds different but the parse is low confidence.",
        changedFeatureRefs: ["critical_contradiction"],
        degradedParsing: true,
        autoReturnToQueue: true,
      }),
    ).rejects.toMatchObject({
      code: "SNAPSHOT_PARITY_RECORD_NOT_VERIFIED",
    });

    const supervisor = await requestMoreInfoForResponse(application, "273_supervisor");
    const seedingService = createPhase3MoreInfoResponseResafetyService(
      application.responseRepositories,
      {
        idGenerator: createDeterministicBackboneIdGenerator(
          "phase3_more_info_response_resafety_273_supervisor_seed",
        ),
      },
    );
    for (const [index, recordedAt] of [
      "2026-04-18T00:30:00.000Z",
      "2026-04-18T05:30:00.000Z",
      "2026-04-18T08:30:00.000Z",
    ].entries()) {
      await seedingService.createResponseAssimilationRecord({
        dispositionRef: `seed_disposition_273_${index + 1}`,
        taskId: "task_273_supervisor",
        cycleId: `seed_cycle_273_${index + 1}`,
        requestId: "request_273_supervisor",
        requestLineageRef: "lineage_273_supervisor",
        evidenceCaptureBundleRef: `seed_capture_273_${index + 1}`,
        evidenceAssimilationRef: `seed_assimilation_273_${index + 1}`,
        materialDeltaAssessmentRef: `seed_delta_273_${index + 1}`,
        classificationDecisionRef: `seed_classification_273_${index + 1}`,
        requestedSafetyState: "residual_risk_flagged",
        safetyDecisionOutcome: "residual_review",
        resultingSafetyDecisionEpoch: index + 1,
        routingOutcome: "review_resumed_then_queued",
        recordedAt,
      });
    }
    const supervisorResult = await application.receiveMoreInfoReply({
      taskId: "task_273_supervisor",
      cycleId: supervisor.cycle.cycleId,
      actorRef: "actor_273_supervisor",
      idempotencyKey: "reply_273_supervisor",
      receivedAt: "2026-04-18T09:11:00.000Z",
      messageText: "The swelling is back again.",
      structuredFacts: { swelling: "recurred" },
      changedFeatureRefs: ["new_clinical_detail"],
      autoReturnToQueue: true,
    });

    expect(boundedResult.routingOutcome).toBe("review_resumed_then_queued");
    expect(boundedResult.safetyDecision?.requestedSafetyState).toBe(
      "residual_risk_flagged",
    );
    expect(boundedResult.safetyDecision?.requestedSafetyState).not.toBe(
      "urgent_diversion_required",
    );

    expect(supervisorResult.routingOutcome).toBe("supervisor_review_required");
    expect(supervisorResult.supervisorReviewRequirement).not.toBeNull();
  });

  it("enforces endpoint payload minimum, current DecisionEpoch fencing, summary-first preview, and blocked approval submit", async () => {
    const application = createPhase3EndpointDecisionEngineApplication();
    await seedDecisionReviewTask(application, "273_endpoint");

    await expect(
      application.selectEndpoint({
        taskId: "task_273_endpoint",
        actorRef: "reviewer_273_endpoint",
        recordedAt: "2026-04-18T10:00:00.000Z",
        chosenEndpoint: "appointment_required",
        reasoningText: "Needs examination.",
        payload: {},
      }),
    ).rejects.toMatchObject({
      code: "ENDPOINT_PAYLOAD_MINIMUM_NOT_MET",
    });

    const selected = await application.selectEndpoint({
      taskId: "task_273_endpoint",
      actorRef: "reviewer_273_endpoint",
      recordedAt: "2026-04-18T10:01:00.000Z",
      chosenEndpoint: "clinician_message",
      reasoningText: "Message before direct next step.",
      payload: payloadFor("clinician_message"),
    });
    const preview = await application.previewEndpointOutcome({
      taskId: "task_273_endpoint",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_273_endpoint",
      recordedAt: "2026-04-18T10:02:00.000Z",
    });
    const current = await application.queryTaskEndpointDecision("task_273_endpoint");
    const invalidated = await application.invalidateStaleDecision({
      taskId: "task_273_endpoint",
      decisionId: selected.decision.decisionId,
      actorRef: "reviewer_273_endpoint",
      recordedAt: "2026-04-18T10:03:00.000Z",
      fenceOverrides: {
        selectedAnchorRef: "anchor_review_273_endpoint_shifted",
        selectedAnchorTupleHashRef: "anchor_review_hash_273_endpoint_shifted",
      },
    });
    const previewArtifacts = await application.decisionRepositories.listPreviewArtifactsForTask(
      "task_273_endpoint",
    );
    const originalPreview = previewArtifacts.find(
      (artifact) =>
        artifact.previewArtifactId === preview.previewArtifact.previewArtifactId,
    );

    await seedDecisionReviewTask(application, "273_approval_gate");
    const approvalSelected = await application.selectEndpoint({
      taskId: "task_273_approval_gate",
      actorRef: "reviewer_273_approval_gate",
      recordedAt: "2026-04-18T10:10:00.000Z",
      chosenEndpoint: "appointment_required",
      reasoningText: "Symptoms need same-day examination.",
      payload: payloadFor("appointment_required"),
    });
    const blockedSubmit = await application.submitEndpointDecision({
      taskId: "task_273_approval_gate",
      decisionId: approvalSelected.decision.decisionId,
      actorRef: "reviewer_273_approval_gate",
      recordedAt: "2026-04-18T10:11:00.000Z",
    });

    expect(current?.binding.bindingState).toBe("live");
    expect(preview.previewArtifact.previewDigest).toBeTruthy();
    expect(invalidated.settlement.result).toBe("stale_recoverable");
    expect(
      invalidated.supersessionRecord?.reasonCodeRefs,
    ).toContain("DECISION_238_SELECTED_ANCHOR_DRIFT");
    expect(originalPreview?.artifactState).toBe("recovery_only");

    expect(blockedSubmit.settlement.result).toBe("blocked_approval_gate");
    expect(blockedSubmit.decision.decisionState).toBe("awaiting_approval");
  });

  it("blocks approval bypass, invalidates stale checkpoints on decision supersession, and binds urgent escalation attempts to the live epoch", async () => {
    const application = createPhase3ApprovalEscalationApplication();
    await seedDecisionReviewTask(application, "273_approval");

    const approvalSelected = await application.endpointApplication.selectEndpoint({
      taskId: "task_273_approval",
      actorRef: "reviewer_273_approval",
      recordedAt: "2026-04-18T10:20:00.000Z",
      chosenEndpoint: "self_care_and_safety_net",
      reasoningText: "Symptoms fit self-care with safety-net advice.",
      payload: payloadFor("self_care_and_safety_net"),
    });
    const evaluated = await application.evaluateApprovalRequirement({
      taskId: "task_273_approval",
      actorRef: "reviewer_273_approval",
      recordedAt: "2026-04-18T10:21:00.000Z",
    });
    await application.requestApproval({
      taskId: "task_273_approval",
      checkpointId: evaluated.checkpoint.checkpointId,
      actorRef: "reviewer_273_approval",
      recordedAt: "2026-04-18T10:22:00.000Z",
    });

    await expect(
      application.approveDecision({
        taskId: "task_273_approval",
        checkpointId: evaluated.checkpoint.checkpointId,
        actorRef: "reviewer_273_approval",
        recordedAt: "2026-04-18T10:23:00.000Z",
        presentedRoleRefs: ["clinical_supervisor"],
      }),
    ).rejects.toMatchObject({
      code: "SELF_APPROVAL_BLOCKED",
    });

    await expect(
      application.approveDecision({
        taskId: "task_273_approval",
        checkpointId: evaluated.checkpoint.checkpointId,
        actorRef: "clinical_reviewer_273",
        recordedAt: "2026-04-18T10:24:00.000Z",
        presentedRoleRefs: ["queue_reviewer"],
      }),
    ).rejects.toMatchObject({
      code: "APPROVER_ROLE_REQUIRED",
    });

    const invalidated = await application.endpointApplication.invalidateStaleDecision({
      taskId: "task_273_approval",
      decisionId: approvalSelected.decision.decisionId,
      actorRef: "reviewer_273_approval",
      recordedAt: "2026-04-18T10:25:00.000Z",
      manualReplace: true,
    });
    const invalidatedCheckpoint = await application.repositories.getCheckpoint(
      evaluated.checkpoint.checkpointId,
    );

    await seedDecisionReviewTask(application, "273_escalation");
    const escalationSelected = await application.endpointApplication.selectEndpoint({
      taskId: "task_273_escalation",
      actorRef: "reviewer_273_escalation",
      recordedAt: "2026-04-18T10:26:00.000Z",
      chosenEndpoint: "duty_clinician_escalation",
      reasoningText: "Residual risk needs urgent escalation.",
      payload: payloadFor("duty_clinician_escalation"),
    });
    const started = await application.startUrgentEscalation({
      taskId: "task_273_escalation",
      actorRef: "reviewer_273_escalation",
      recordedAt: "2026-04-18T10:27:00.000Z",
      triggerMode: "reviewer_manual",
      triggerReasonCode: "residual_high_risk",
      severityBand: "urgent",
    });
    const firstAttempt = await application.recordUrgentContactAttempt({
      taskId: "task_273_escalation",
      escalationId: started.escalation.dutyEscalationRecordId,
      actorRef: "reviewer_273_escalation",
      recordedAt: "2026-04-18T10:28:00.000Z",
      attemptReplayKey: "urgent_attempt_273_1",
      contactRouteClass: "primary_phone",
      attemptState: "no_answer",
    });
    const replayedAttempt = await application.recordUrgentContactAttempt({
      taskId: "task_273_escalation",
      escalationId: started.escalation.dutyEscalationRecordId,
      actorRef: "reviewer_273_escalation",
      recordedAt: "2026-04-18T10:28:30.000Z",
      attemptReplayKey: "urgent_attempt_273_1",
      contactRouteClass: "primary_phone",
      attemptState: "no_answer",
    });
    await application.endpointApplication.invalidateStaleDecision({
      taskId: "task_273_escalation",
      decisionId: escalationSelected.decision.decisionId,
      actorRef: "reviewer_273_escalation",
      recordedAt: "2026-04-18T10:29:00.000Z",
      manualReplace: true,
    });

    await expect(
      application.recordUrgentContactAttempt({
        taskId: "task_273_escalation",
        escalationId: started.escalation.dutyEscalationRecordId,
        actorRef: "reviewer_273_escalation",
        recordedAt: "2026-04-18T10:30:00.000Z",
        attemptReplayKey: "urgent_attempt_273_2",
        contactRouteClass: "primary_phone",
        attemptState: "connected",
      }),
    ).rejects.toThrow("STALE_ESCALATION_EPOCH");

    expect(invalidated.supersessionRecord).toBeTruthy();
    expect(invalidatedCheckpoint?.state).toBe("superseded");
    expect(invalidatedCheckpoint?.decisionSupersessionRecordRef).toBe(
      invalidated.supersessionRecord?.decisionSupersessionRecordId,
    );
    expect(replayedAttempt.attempt.urgentContactAttemptId).toBe(
      firstAttempt.attempt.urgentContactAttemptId,
    );
  });
});
