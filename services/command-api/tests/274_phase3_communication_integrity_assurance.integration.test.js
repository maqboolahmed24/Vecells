import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPhase3CallbackDomainApplication } from "../src/phase3-callback-domain.ts";
import { createPhase3ClinicianMessageDomainApplication } from "../src/phase3-clinician-message-domain.ts";
import { createPhase3CommunicationReachabilityRepairApplication } from "../src/phase3-communication-reachability-repair.ts";
import { createPhase3SupportCommunicationLinkageApplication } from "../src/phase3-support-communication-linkage.ts";

const CALLBACK_WEBHOOK_SECRET = "phase3_callback_simulator_secret";
const CALLBACK_WEBHOOK_SIGNATURE_HEADER = "x-vecells-simulator-signature";
const CALLBACK_WEBHOOK_TIMESTAMP_HEADER = "x-vecells-simulator-timestamp";
const MESSAGE_WEBHOOK_SECRET = "phase3_clinician_message_simulator_secret";
const MESSAGE_WEBHOOK_SIGNATURE_HEADER = "x-vecells-message-signature";
const MESSAGE_WEBHOOK_TIMESTAMP_HEADER = "x-vecells-message-timestamp";

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
    createdAt: "2026-04-18T10:00:00.000Z",
  };
}

async function seedReviewTask(application, seed) {
  const created = await application.triageApplication.createTask(createTaskInput(seed));
  await application.triageApplication.moveTaskToQueue({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    queuedAt: "2026-04-18T10:01:00.000Z",
  });
  await application.triageApplication.claimTask({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-18T10:02:00.000Z",
  });
  return application.triageApplication.enterReview({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    openedAt: "2026-04-18T10:03:00.000Z",
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_slice_${seed}`,
    audienceSurfaceRuntimeBindingRef: `runtime_binding_${seed}`,
    reviewActionLeaseRef: `review_action_${seed}`,
    selectedAnchorRef: `anchor_review_${seed}`,
    selectedAnchorTupleHashRef: `anchor_review_hash_${seed}`,
  });
}

async function createLiveCallbackSeed(application, seed) {
  await seedReviewTask(application, seed);
  const selected =
    await application.directResolutionApplication.endpointApplication.selectEndpoint({
      taskId: `task_${seed}`,
      actorRef: `reviewer_${seed}`,
      recordedAt: "2026-04-18T10:04:00.000Z",
      chosenEndpoint: "clinician_callback",
      reasoningText: "Callback is enough for the next step.",
      payload: {
        callbackWindow: "after_18_00",
        summary: "Call to confirm the latest symptoms.",
      },
    });
  await application.directResolutionApplication.endpointApplication.submitEndpointDecision({
    taskId: `task_${seed}`,
    decisionId: selected.decision.decisionId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-18T10:05:00.000Z",
  });
  return application.directResolutionApplication.commitDirectResolution({
    taskId: `task_${seed}`,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-18T10:06:00.000Z",
  });
}

async function createCallbackCase(application, seed, routeRef = "route_mobile_primary") {
  await createLiveCallbackSeed(application, seed);
  return application.createCallbackCase({
    taskId: `task_${seed}`,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-18T10:07:00.000Z",
    callbackUrgencyRef: "routine_same_day",
    preferredWindowRef: "after_18_00",
    serviceWindowRef: "service_window_daytime",
    contactRouteRef: routeRef,
    fallbackRouteRef: `${routeRef}_fallback`,
    retryPolicyRef: "retry_policy_callback_standard",
    pathwayRef: "routine_callback",
  });
}

async function createReadyCallbackCase(application, seed, routeRef = "route_mobile_primary") {
  const created = await createCallbackCase(application, seed, routeRef);
  await application.scheduleCallbackCase({
    taskId: `task_${seed}`,
    callbackCaseId: created.callbackCase.callbackCaseId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-18T10:08:00.000Z",
    callbackUrgencyRef: "routine_same_day",
    preferredWindowRef: "after_18_00",
    serviceWindowRef: "service_window_daytime",
    contactRouteRef: routeRef,
    fallbackRouteRef: `${routeRef}_fallback`,
    retryPolicyRef: "retry_policy_callback_standard",
    pathwayRef: "routine_callback",
    routeAuthorityState: "current",
  });
  return application.armCallbackReady({
    taskId: `task_${seed}`,
    callbackCaseId: created.callbackCase.callbackCaseId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-18T10:09:00.000Z",
    pathwayRef: "routine_callback",
    routeAuthorityState: "current",
  });
}

async function createLiveMessageSeed(application, seed) {
  await seedReviewTask(application, seed);
  const selected =
    await application.directResolutionApplication.endpointApplication.selectEndpoint({
      taskId: `task_${seed}`,
      actorRef: `reviewer_${seed}`,
      recordedAt: "2026-04-18T10:04:00.000Z",
      chosenEndpoint: "clinician_message",
      reasoningText: "A secure clinician message is the right next step.",
      payload: {
        messageSubject: "Follow-up",
        messageBody: "Please confirm whether the wheeze is worse at night.",
      },
    });
  await application.directResolutionApplication.endpointApplication.submitEndpointDecision({
    taskId: `task_${seed}`,
    decisionId: selected.decision.decisionId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-18T10:05:00.000Z",
  });
  return application.directResolutionApplication.commitDirectResolution({
    taskId: `task_${seed}`,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-18T10:06:00.000Z",
  });
}

async function createMessageThread(application, seed) {
  await createLiveMessageSeed(application, seed);
  return application.createMessageThread({
    taskId: `task_${seed}`,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-18T10:07:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
  });
}

async function createSentMessageThread(application, seed, routeRef = "route_message_primary") {
  const created = await createMessageThread(application, seed);
  await application.saveDraft({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-18T10:08:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
    messageSubject: "Follow-up",
    messageBody: "Please confirm whether the wheeze is worse at night.",
  });
  await application.approveDraft({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    actorRef: `approver_${seed}`,
    recordedAt: "2026-04-18T10:09:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
  });
  return application.sendThread({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-18T10:10:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
    contactRouteRef: routeRef,
    repairIntent: "initial_send",
    providerCorrelationRef: `provider_message_${seed}`,
  });
}

async function freezeVerifiedRoute(application, input) {
  return application.identityAccessApplication.reachabilityGovernor.freezeContactRouteSnapshot({
    subjectRef: input.subjectRef,
    routeRef: input.routeRef,
    routeVersionRef: input.routeVersionRef,
    routeKind: input.routeKind,
    normalizedAddressRef: input.normalizedAddressRef,
    preferenceProfileRef: input.preferenceProfileRef,
    verificationState: "verified_current",
    demographicFreshnessState: "current",
    preferenceFreshnessState: "current",
    sourceAuthorityClass: "patient_confirmed",
    createdAt: input.createdAt,
  });
}

function buildCallbackSignedHeaders(timestamp, rawReceipt) {
  const signature = createHmac("sha256", CALLBACK_WEBHOOK_SECRET)
    .update(`${timestamp}.${JSON.stringify(rawReceipt)}`)
    .digest("hex");
  return {
    [CALLBACK_WEBHOOK_TIMESTAMP_HEADER]: timestamp,
    [CALLBACK_WEBHOOK_SIGNATURE_HEADER]: signature,
  };
}

async function recordCallbackReceipt(application, taskSeed, callbackCaseId, providerCorrelationRef, statusClass) {
  const recordedAt = "2026-04-18T10:10:30.000Z";
  const rawReceipt = {
    statusClass,
    providerCorrelationRef,
    callSid: providerCorrelationRef,
  };
  return application.recordProviderReceipt({
    taskId: `task_${taskSeed}`,
    callbackCaseId,
    recordedAt,
    requestUrl: "https://callback.example.test/receipt",
    headers: buildCallbackSignedHeaders(recordedAt, rawReceipt),
    transportMessageId: `telephony_msg_${taskSeed}`,
    orderingKey: "0001",
    rawReceipt,
    semanticReceipt: rawReceipt,
  });
}

function canonicalReceiptPayload(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function buildMessageSignedHeaders(timestamp, rawReceipt) {
  const signature = createHmac("sha256", MESSAGE_WEBHOOK_SECRET)
    .update(`${timestamp}.${canonicalReceiptPayload(rawReceipt)}`)
    .digest("hex");
  return {
    [MESSAGE_WEBHOOK_TIMESTAMP_HEADER]: timestamp,
    [MESSAGE_WEBHOOK_SIGNATURE_HEADER]: signature,
  };
}

describe("274 phase 3 communication integrity assurance", () => {
  it("keeps callback scheduling, rescheduling, cancellation, and expiry authority on the live CallbackIntentLease chain", async () => {
    const application = createPhase3CallbackDomainApplication();
    const created = await createCallbackCase(application, "274_callback_schedule");
    const scheduled = await application.scheduleCallbackCase({
      taskId: "task_274_callback_schedule",
      callbackCaseId: created.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_schedule",
      recordedAt: "2026-04-18T10:08:00.000Z",
      callbackUrgencyRef: "routine_same_day",
      preferredWindowRef: "after_18_00",
      serviceWindowRef: "service_window_daytime",
      contactRouteRef: "route_mobile_primary",
      fallbackRouteRef: "route_mobile_secondary",
      retryPolicyRef: "retry_policy_callback_standard",
      pathwayRef: "routine_callback",
      routeAuthorityState: "current",
    });
    const rescheduled = await application.rescheduleCallbackCase({
      taskId: "task_274_callback_schedule",
      callbackCaseId: created.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_schedule",
      recordedAt: "2026-04-18T10:09:00.000Z",
      callbackUrgencyRef: "routine_same_day",
      preferredWindowRef: "before_noon",
      serviceWindowRef: "service_window_early",
      contactRouteRef: "route_mobile_backup",
      fallbackRouteRef: "route_sms_backup",
      retryPolicyRef: "retry_policy_callback_standard",
      pathwayRef: "routine_callback",
      routeAuthorityState: "current",
    });
    const cancelled = await application.cancelCallbackCase({
      taskId: "task_274_callback_schedule",
      callbackCaseId: created.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_schedule",
      recordedAt: "2026-04-18T10:10:00.000Z",
      explicitDecision: "cancel",
      cancelReasonRef: "patient_declined_callback",
    });

    const expiryReady = await createReadyCallbackCase(application, "274_callback_expire");
    await application.initiateCallbackAttempt({
      taskId: "task_274_callback_expire",
      callbackCaseId: expiryReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_expire",
      recordedAt: "2026-04-18T10:10:30.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_274_callback_expire",
    });
    await recordCallbackReceipt(
      application,
      "274_callback_expire",
      expiryReady.callbackCase.callbackCaseId,
      "call_274_callback_expire",
      "no_answer",
    );
    await application.recordOutcomeEvidence({
      taskId: "task_274_callback_expire",
      callbackCaseId: expiryReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_expire",
      recordedAt: "2026-04-18T10:11:00.000Z",
      outcome: "no_answer",
      routeEvidenceRef: "route_evidence_274_callback_expire",
      providerDispositionRef: "provider_no_answer_274_callback_expire",
      patientAcknowledgementRef: null,
      safetyClassification: "technical_only",
      safetyPreemptionState: "clear",
      pathwayRef: "routine_callback",
    });
    const expired = await application.settleResolutionGate({
      taskId: "task_274_callback_expire",
      callbackCaseId: expiryReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_expire",
      recordedAt: "2026-04-18T10:12:00.000Z",
      explicitDecision: "expire",
    });

    expect(scheduled.callbackCase.state).toBe("scheduled");
    expect(rescheduled.currentIntentLease.callbackIntentLeaseId).not.toBe(
      scheduled.currentIntentLease.callbackIntentLeaseId,
    );
    expect(rescheduled.currentIntentLease.contactRouteRef).toBe("route_mobile_backup");
    expect(cancelled.callbackCase.state).toBe("closed");
    expect(cancelled.currentIntentLease?.leaseMode).toBe("scheduled");
    expect(cancelled.currentResolutionGate.decision).toBe("cancel");
    expect(expired.callbackCase.state).toBe("closed");
    expect(expired.currentIntentLease?.leaseMode).toBe("ready_for_attempt");
    expect(expired.currentResolutionGate.decision).toBe("expire");
  });

  it("governs callback attempts and outcome evidence for answered, no-answer, voicemail, invalid-route, provider-failure, and dedupe", async () => {
    const application = createPhase3CallbackDomainApplication();

    const answeredReady = await createReadyCallbackCase(application, "274_callback_answered");
    const answeredCaseId = answeredReady.callbackCase.callbackCaseId;
    const answeredAttempt = await application.initiateCallbackAttempt({
      taskId: "task_274_callback_answered",
      callbackCaseId: answeredCaseId,
      actorRef: "reviewer_274_callback_answered",
      recordedAt: "2026-04-18T10:10:00.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_274_callback_answered",
    });
    const answeredReplay = await application.initiateCallbackAttempt({
      taskId: "task_274_callback_answered",
      callbackCaseId: answeredCaseId,
      actorRef: "reviewer_274_callback_answered",
      recordedAt: "2026-04-18T10:10:10.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_274_callback_answered",
    });
    const answeredReceipt = {
      statusClass: "completed",
      providerCorrelationRef: "call_274_callback_answered",
      callSid: "call_274_callback_answered",
      answeredBy: "human",
    };
    await application.recordProviderReceipt({
      taskId: "task_274_callback_answered",
      callbackCaseId: answeredCaseId,
      recordedAt: "2026-04-18T10:10:30.000Z",
      requestUrl: "https://callback.example.test/receipt",
      headers: buildCallbackSignedHeaders("2026-04-18T10:10:30.000Z", answeredReceipt),
      transportMessageId: "telephony_msg_274_callback_answered",
      orderingKey: "0001",
      rawReceipt: answeredReceipt,
      semanticReceipt: answeredReceipt,
    });
    await expect(
      application.settleResolutionGate({
        taskId: "task_274_callback_answered",
        callbackCaseId: answeredCaseId,
        actorRef: "reviewer_274_callback_answered",
        recordedAt: "2026-04-18T10:10:40.000Z",
      }),
    ).rejects.toThrow("CALLBACK_OUTCOME_EVIDENCE_REQUIRED");
    await application.recordOutcomeEvidence({
      taskId: "task_274_callback_answered",
      callbackCaseId: answeredCaseId,
      actorRef: "reviewer_274_callback_answered",
      recordedAt: "2026-04-18T10:11:00.000Z",
      outcome: "answered",
      routeEvidenceRef: "route_evidence_274_callback_answered",
      providerDispositionRef: "provider_answered_274_callback_answered",
      patientAcknowledgementRef: "patient_ack_274_callback_answered",
      safetyClassification: "technical_only",
      safetyPreemptionState: "clear",
      pathwayRef: "routine_callback",
    });
    const answeredClosed = await application.settleResolutionGate({
      taskId: "task_274_callback_answered",
      callbackCaseId: answeredCaseId,
      actorRef: "reviewer_274_callback_answered",
      recordedAt: "2026-04-18T10:11:30.000Z",
    });

    const noAnswerReady = await createReadyCallbackCase(application, "274_callback_no_answer");
    await application.initiateCallbackAttempt({
      taskId: "task_274_callback_no_answer",
      callbackCaseId: noAnswerReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_no_answer",
      recordedAt: "2026-04-18T10:12:00.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_274_callback_no_answer",
    });
    await recordCallbackReceipt(
      application,
      "274_callback_no_answer",
      noAnswerReady.callbackCase.callbackCaseId,
      "call_274_callback_no_answer",
      "no_answer",
    );
    await application.recordOutcomeEvidence({
      taskId: "task_274_callback_no_answer",
      callbackCaseId: noAnswerReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_no_answer",
      recordedAt: "2026-04-18T10:12:30.000Z",
      outcome: "no_answer",
      routeEvidenceRef: "route_evidence_274_callback_no_answer",
      providerDispositionRef: "provider_no_answer_274_callback_no_answer",
      patientAcknowledgementRef: null,
      safetyClassification: "technical_only",
      safetyPreemptionState: "clear",
      pathwayRef: "routine_callback",
    });
    const noAnswerSettled = await application.settleResolutionGate({
      taskId: "task_274_callback_no_answer",
      callbackCaseId: noAnswerReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_no_answer",
      recordedAt: "2026-04-18T10:13:00.000Z",
    });

    const voicemailReady = await createReadyCallbackCase(application, "274_callback_voicemail");
    await application.initiateCallbackAttempt({
      taskId: "task_274_callback_voicemail",
      callbackCaseId: voicemailReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_voicemail",
      recordedAt: "2026-04-18T10:14:00.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_274_callback_voicemail",
    });
    await recordCallbackReceipt(
      application,
      "274_callback_voicemail",
      voicemailReady.callbackCase.callbackCaseId,
      "call_274_callback_voicemail",
      "completed",
    );
    await expect(
      application.recordOutcomeEvidence({
        taskId: "task_274_callback_voicemail",
        callbackCaseId: voicemailReady.callbackCase.callbackCaseId,
        actorRef: "reviewer_274_callback_voicemail",
        recordedAt: "2026-04-18T10:14:30.000Z",
        outcome: "voicemail_left",
        routeEvidenceRef: "route_evidence_274_callback_voicemail",
        providerDispositionRef: "provider_voicemail_274_callback_voicemail",
        patientAcknowledgementRef: null,
        safetyClassification: "technical_only",
        safetyPreemptionState: "clear",
        pathwayRef: "routine_callback",
        explicitPermissionState: "unknown",
        containsClinicalContent: false,
        verifiedTargetState: "unknown",
        voicemailEvidenceRefs: ["CALLBACK_243_VOICEMAIL_RECORDING_CAPTURED"],
      }),
    ).rejects.toThrow("CALLBACK_VOICEMAIL_POLICY_BLOCKED");
    await application.recordOutcomeEvidence({
      taskId: "task_274_callback_voicemail",
      callbackCaseId: voicemailReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_voicemail",
      recordedAt: "2026-04-18T10:15:00.000Z",
      outcome: "voicemail_left",
      routeEvidenceRef: "route_evidence_274_callback_voicemail",
      providerDispositionRef: "provider_voicemail_274_callback_voicemail",
      patientAcknowledgementRef: null,
      safetyClassification: "technical_only",
      safetyPreemptionState: "clear",
      pathwayRef: "routine_callback",
      explicitPermissionState: "granted",
      containsClinicalContent: false,
      verifiedTargetState: "verified",
      tenantPolicyRef: "callback_voicemail_policy_allowed_274",
      voicemailEvidenceRefs: [
        "CALLBACK_243_VOICEMAIL_RECORDING_CAPTURED",
        "CALLBACK_243_VOICEMAIL_SCRIPT_ATTESTED",
      ],
    });
    const voicemailSettled = await application.settleResolutionGate({
      taskId: "task_274_callback_voicemail",
      callbackCaseId: voicemailReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_voicemail",
      recordedAt: "2026-04-18T10:15:30.000Z",
    });

    const invalidRouteReady = await createReadyCallbackCase(application, "274_callback_invalid_route");
    await application.initiateCallbackAttempt({
      taskId: "task_274_callback_invalid_route",
      callbackCaseId: invalidRouteReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_invalid_route",
      recordedAt: "2026-04-18T10:16:00.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_274_callback_invalid_route",
    });
    await recordCallbackReceipt(
      application,
      "274_callback_invalid_route",
      invalidRouteReady.callbackCase.callbackCaseId,
      "call_274_callback_invalid_route",
      "failed",
    );
    await application.recordOutcomeEvidence({
      taskId: "task_274_callback_invalid_route",
      callbackCaseId: invalidRouteReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_invalid_route",
      recordedAt: "2026-04-18T10:16:30.000Z",
      outcome: "route_invalid",
      routeEvidenceRef: "route_evidence_274_callback_invalid_route",
      providerDispositionRef: "provider_route_invalid_274_callback_invalid_route",
      patientAcknowledgementRef: null,
      safetyClassification: "technical_only",
      safetyPreemptionState: "clear",
      pathwayRef: "routine_callback",
    });
    const invalidRouteSettled = await application.settleResolutionGate({
      taskId: "task_274_callback_invalid_route",
      callbackCaseId: invalidRouteReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_invalid_route",
      recordedAt: "2026-04-18T10:17:00.000Z",
      routeAuthorityState: "repair_required",
    });

    const providerFailureReady = await createReadyCallbackCase(application, "274_callback_provider_failure");
    await application.initiateCallbackAttempt({
      taskId: "task_274_callback_provider_failure",
      callbackCaseId: providerFailureReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_provider_failure",
      recordedAt: "2026-04-18T10:18:00.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_274_callback_provider_failure",
    });
    await recordCallbackReceipt(
      application,
      "274_callback_provider_failure",
      providerFailureReady.callbackCase.callbackCaseId,
      "call_274_callback_provider_failure",
      "failed",
    );
    await application.recordOutcomeEvidence({
      taskId: "task_274_callback_provider_failure",
      callbackCaseId: providerFailureReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_provider_failure",
      recordedAt: "2026-04-18T10:18:30.000Z",
      outcome: "provider_failure",
      routeEvidenceRef: "route_evidence_274_callback_provider_failure",
      providerDispositionRef: "provider_failure_274_callback_provider_failure",
      patientAcknowledgementRef: null,
      safetyClassification: "technical_only",
      safetyPreemptionState: "clear",
      pathwayRef: "routine_callback",
    });
    const providerFailureSettled = await application.settleResolutionGate({
      taskId: "task_274_callback_provider_failure",
      callbackCaseId: providerFailureReady.callbackCase.callbackCaseId,
      actorRef: "reviewer_274_callback_provider_failure",
      recordedAt: "2026-04-18T10:19:00.000Z",
    });

    expect(answeredAttempt.latestAttempt.callbackAttemptRecordId).toBe(
      answeredReplay.latestAttempt.callbackAttemptRecordId,
    );
    expect(answeredClosed.callbackCase.state).toBe("closed");
    expect(answeredClosed.currentResolutionGate.decision).toBe("complete");
    expect(noAnswerSettled.callbackCase.state).toBe("awaiting_retry");
    expect(noAnswerSettled.currentResolutionGate.decision).toBe("retry");
    expect(
      voicemailSettled.latestOutcomeEvidenceBundle.voicemailPolicyRef?.includes("allowed"),
    ).toBe(true);
    expect(voicemailSettled.currentResolutionGate.decision).toBe("retry");
    expect(invalidRouteSettled.callbackCase.state).toBe("contact_route_repair_pending");
    expect(invalidRouteSettled.currentResolutionGate.decision).toBe("retry");
    expect(providerFailureSettled.callbackCase.state).toBe("awaiting_retry");
    expect(providerFailureSettled.currentResolutionGate.decision).toBe("retry");
  });

  it("keeps clinician-message delivery truth bound to dispatch, receipts, disputes, and governed repair authorizations", async () => {
    const application = createPhase3ClinicianMessageDomainApplication();
    const sent = await createSentMessageThread(application, "274_message_pending");
    const pendingThreadId = sent.messageThread.threadId;
    const acceptedReceipt = {
      messageId: "provider_message_274_message_pending",
      providerCorrelationRef: "provider_message_274_message_pending",
      statusClass: "accepted",
    };
    const accepted = await application.recordProviderReceipt({
      taskId: "task_274_message_pending",
      threadId: pendingThreadId,
      recordedAt: "2026-04-18T10:11:00.000Z",
      requestUrl: "https://message.example.test/receipt",
      headers: buildMessageSignedHeaders("2026-04-18T10:11:00.000Z", acceptedReceipt),
      transportMessageId: "transport_message_274_message_pending",
      orderingKey: "0001",
      rawReceipt: acceptedReceipt,
      semanticReceipt: acceptedReceipt,
    });
    expect(accepted.currentDeliveryEvidenceBundle).toBeNull();

    const delivered = await application.recordDeliveryEvidence({
      taskId: "task_274_message_pending",
      threadId: pendingThreadId,
      actorRef: "reviewer_274_message_pending",
      recordedAt: "2026-04-18T10:12:00.000Z",
      reviewActionLeaseRef: "review_action_274_message_pending",
      deliveryState: "delivered",
      evidenceStrength: "direct_provider_receipt",
      providerDispositionRef: "provider_delivered_274_message_pending",
      deliveryArtifactRefs: ["artifact_delivery_274_message_pending"],
    });

    const contradictionApp = createPhase3ClinicianMessageDomainApplication();
    const contradictionSent = await createSentMessageThread(contradictionApp, "274_message_dispute");
    const contradictionReceipt = {
      messageId: "provider_message_274_message_dispute",
      providerCorrelationRef: "provider_message_274_message_dispute",
      statusClass: "accepted",
    };
    await contradictionApp.recordProviderReceipt({
      taskId: "task_274_message_dispute",
      threadId: contradictionSent.messageThread.threadId,
      recordedAt: "2026-04-18T10:11:00.000Z",
      requestUrl: "https://message.example.test/receipt",
      headers: buildMessageSignedHeaders("2026-04-18T10:11:00.000Z", contradictionReceipt),
      transportMessageId: "transport_message_274_message_dispute",
      orderingKey: "0001",
      rawReceipt: contradictionReceipt,
      semanticReceipt: contradictionReceipt,
    });
    await contradictionApp.recordDeliveryEvidence({
      taskId: "task_274_message_dispute",
      threadId: contradictionSent.messageThread.threadId,
      actorRef: "reviewer_274_message_dispute",
      recordedAt: "2026-04-18T10:12:00.000Z",
      reviewActionLeaseRef: "review_action_274_message_dispute",
      deliveryState: "delivered",
      evidenceStrength: "direct_provider_receipt",
      providerDispositionRef: "provider_delivered_274_message_dispute",
      deliveryArtifactRefs: ["artifact_delivery_274_message_dispute"],
    });
    const contradictoryFailure = {
      messageId: "provider_message_274_message_dispute",
      providerCorrelationRef: "provider_message_274_message_dispute",
      statusClass: "failed",
    };
    await expect(
      contradictionApp.recordDeliveryEvidence({
        taskId: "task_274_message_dispute",
        threadId: contradictionSent.messageThread.threadId,
        actorRef: "reviewer_274_message_dispute",
        recordedAt: "2026-04-18T10:13:00.000Z",
        reviewActionLeaseRef: "review_action_274_message_dispute",
        deliveryState: "failed",
        evidenceStrength: "contradictory_signal",
        providerDispositionRef: "provider_bounced_after_delivery_274_message_dispute",
        deliveryArtifactRefs: ["artifact_delivery_274_message_dispute_late_fail"],
      }),
    ).rejects.toThrow("MESSAGE_DELIVERY_CONTRADICTION_REQUIRES_DISPUTE");

    const repairApp = createPhase3CommunicationReachabilityRepairApplication();
    await freezeVerifiedRoute(repairApp, {
      subjectRef: "subject_message_274_repair",
      routeRef: "route_message_primary_274",
      routeVersionRef: "route_message_primary_274@v1",
      routeKind: "app_message",
      normalizedAddressRef: "normalized_message_primary_274",
      preferenceProfileRef: "prefs_message_primary_274",
      createdAt: "2026-04-18T09:58:00.000Z",
    });
    const repairSent = await createSentMessageThread(
      repairApp.clinicianMessageApplication,
      "274_message_repair",
      "route_message_primary_274",
    );
    const repairReceipt = {
      messageId: "provider_message_274_message_repair",
      providerCorrelationRef: "provider_message_274_message_repair",
      statusClass: "accepted",
    };
    await repairApp.clinicianMessageApplication.recordProviderReceipt({
      taskId: "task_274_message_repair",
      threadId: repairSent.messageThread.threadId,
      recordedAt: "2026-04-18T10:11:00.000Z",
      requestUrl: "https://message.example.test/receipt",
      headers: buildMessageSignedHeaders("2026-04-18T10:11:00.000Z", repairReceipt),
      transportMessageId: "transport_message_274_message_repair",
      orderingKey: "0001",
      rawReceipt: repairReceipt,
      semanticReceipt: repairReceipt,
    });
    const repair = await repairApp.recordMessageReachability({
      taskId: "task_274_message_repair",
      threadId: repairSent.messageThread.threadId,
      actorRef: "reviewer_274_message_repair",
      recordedAt: "2026-04-18T10:11:30.000Z",
      deliveryState: "failed",
      evidenceStrength: "direct_provider_receipt",
      providerDispositionRef: "provider_invalid_route_274_message_repair",
      deliveryArtifactRefs: ["artifact_invalid_route_274_message_repair"],
    });
    const blockedResend = await repairApp.authorizeMessageRepairAction({
      taskId: "task_274_message_repair",
      threadId: repairSent.messageThread.threadId,
      actorRef: "reviewer_274_message_repair",
      recordedAt: "2026-04-18T10:12:00.000Z",
      authorizationKind: "controlled_resend",
    });
    await repairApp.attachCandidateRoute({
      taskId: "task_274_message_repair",
      bindingId: repair.binding.bindingId,
      actorRef: "reviewer_274_message_repair",
      recordedAt: "2026-04-18T10:12:30.000Z",
      subjectRef: "subject_message_274_repair",
      routeRef: "route_message_repaired_274",
      routeVersionRef: "route_message_repaired_274@v1",
      routeKind: "app_message",
      normalizedAddressRef: "normalized_message_repaired_274",
      preferenceProfileRef: "prefs_message_repaired_274",
      verificationState: "unverified",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
    });
    const issued = await repairApp.issueVerificationCheckpoint({
      taskId: "task_274_message_repair",
      bindingId: repair.binding.bindingId,
      actorRef: "reviewer_274_message_repair",
      recordedAt: "2026-04-18T10:13:00.000Z",
      contactRouteRef: "route_message_repaired_274",
      contactRouteVersionRef: "route_message_repaired_274@v1",
      verificationMethod: "one_time_code",
    });
    await repairApp.settleVerificationCheckpoint({
      taskId: "task_274_message_repair",
      bindingId: repair.binding.bindingId,
      actorRef: "reviewer_274_message_repair",
      checkpointId: issued.verificationCheckpoint.checkpointId,
      recordedAt: "2026-04-18T10:13:30.000Z",
      verificationState: "verified",
    });
    const authorizedResend = await repairApp.authorizeMessageRepairAction({
      taskId: "task_274_message_repair",
      threadId: repairSent.messageThread.threadId,
      actorRef: "reviewer_274_message_repair",
      recordedAt: "2026-04-18T10:14:00.000Z",
      authorizationKind: "controlled_resend",
    });
    const authorizedChannelChange = await repairApp.authorizeMessageRepairAction({
      taskId: "task_274_message_repair",
      threadId: repairSent.messageThread.threadId,
      actorRef: "reviewer_274_message_repair",
      recordedAt: "2026-04-18T10:14:10.000Z",
      authorizationKind: "channel_change",
    });
    const authorizedAttachmentRecovery = await repairApp.authorizeMessageRepairAction({
      taskId: "task_274_message_repair",
      threadId: repairSent.messageThread.threadId,
      actorRef: "reviewer_274_message_repair",
      recordedAt: "2026-04-18T10:14:20.000Z",
      authorizationKind: "attachment_recovery",
    });

    expect(delivered.currentDeliveryEvidenceBundle.deliveryState).toBe("delivered");
    expect(blockedResend.outcome).toBe("blocked_existing_chain");
    expect(authorizedResend.outcome).toBe("authorized");
    expect(authorizedResend.authorization.authorizationKind).toBe("controlled_resend");
    expect(authorizedChannelChange.authorization.authorizationKind).toBe("channel_change");
    expect(authorizedAttachmentRecovery.authorization.authorizationKind).toBe(
      "attachment_recovery",
    );
  });

  it("requires a fresh reachability epoch before calmness returns and blocks repair when identity or consent freshness drifts", async () => {
    const application = createPhase3CommunicationReachabilityRepairApplication();
    await freezeVerifiedRoute(application, {
      subjectRef: "subject_message_274_rebound",
      routeRef: "route_message_primary_274_rebound",
      routeVersionRef: "route_message_primary_274_rebound@v1",
      routeKind: "app_message",
      normalizedAddressRef: "normalized_message_primary_274_rebound",
      preferenceProfileRef: "prefs_message_primary_274_rebound",
      createdAt: "2026-04-18T09:58:00.000Z",
    });
    const sent = await createSentMessageThread(
      application.clinicianMessageApplication,
      "274_message_rebound",
      "route_message_primary_274_rebound",
    );
    const repair = await application.recordMessageReachability({
      taskId: "task_274_message_rebound",
      threadId: sent.messageThread.threadId,
      actorRef: "reviewer_274_message_rebound",
      recordedAt: "2026-04-18T10:11:00.000Z",
      deliveryState: "failed",
      evidenceStrength: "direct_provider_receipt",
      providerDispositionRef: "provider_invalid_route_274_message_rebound",
      deliveryArtifactRefs: ["artifact_invalid_route_274_message_rebound"],
    });
    await application.attachCandidateRoute({
      taskId: "task_274_message_rebound",
      bindingId: repair.binding.bindingId,
      actorRef: "reviewer_274_message_rebound",
      recordedAt: "2026-04-18T10:12:00.000Z",
      subjectRef: "subject_message_274_rebound",
      routeRef: "route_message_repaired_274_rebound",
      routeVersionRef: "route_message_repaired_274_rebound@v1",
      routeKind: "app_message",
      normalizedAddressRef: "normalized_message_repaired_274_rebound",
      preferenceProfileRef: "prefs_message_repaired_274_rebound",
      verificationState: "unverified",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
    });
    const issued = await application.issueVerificationCheckpoint({
      taskId: "task_274_message_rebound",
      bindingId: repair.binding.bindingId,
      actorRef: "reviewer_274_message_rebound",
      recordedAt: "2026-04-18T10:13:00.000Z",
      contactRouteRef: "route_message_repaired_274_rebound",
      contactRouteVersionRef: "route_message_repaired_274_rebound@v1",
      verificationMethod: "one_time_code",
    });
    const settled = await application.settleVerificationCheckpoint({
      taskId: "task_274_message_rebound",
      bindingId: repair.binding.bindingId,
      actorRef: "reviewer_274_message_rebound",
      checkpointId: issued.verificationCheckpoint.checkpointId,
      recordedAt: "2026-04-18T10:14:00.000Z",
      verificationState: "verified",
    });

    await freezeVerifiedRoute(application, {
      subjectRef: "subject_message_274_identity",
      routeRef: "route_message_primary_274_identity",
      routeVersionRef: "route_message_primary_274_identity@v1",
      routeKind: "app_message",
      normalizedAddressRef: "normalized_message_primary_274_identity",
      preferenceProfileRef: "prefs_message_primary_274_identity",
      createdAt: "2026-04-18T09:58:00.000Z",
    });
    const identitySent = await createSentMessageThread(
      application.clinicianMessageApplication,
      "274_message_identity_block",
      "route_message_primary_274_identity",
    );
    const identityRepair = await application.recordMessageReachability({
      taskId: "task_274_message_identity_block",
      threadId: identitySent.messageThread.threadId,
      actorRef: "reviewer_274_message_identity_block",
      recordedAt: "2026-04-18T10:15:00.000Z",
      deliveryState: "failed",
      evidenceStrength: "direct_provider_receipt",
      providerDispositionRef: "provider_invalid_route_274_message_identity_block",
      deliveryArtifactRefs: ["artifact_invalid_route_274_message_identity_block"],
    });
    await application.attachCandidateRoute({
      taskId: "task_274_message_identity_block",
      bindingId: identityRepair.binding.bindingId,
      actorRef: "reviewer_274_message_identity_block",
      recordedAt: "2026-04-18T10:16:00.000Z",
      subjectRef: "subject_message_274_identity",
      routeRef: "route_message_identity_candidate_274",
      routeVersionRef: "route_message_identity_candidate_274@v1",
      routeKind: "app_message",
      normalizedAddressRef: "normalized_message_identity_candidate_274",
      preferenceProfileRef: "prefs_message_identity_candidate_274",
      verificationState: "unverified",
      demographicFreshnessState: "stale",
      preferenceFreshnessState: "stale",
      sourceAuthorityClass: "patient_confirmed",
    });
    const identityIssued = await application.issueVerificationCheckpoint({
      taskId: "task_274_message_identity_block",
      bindingId: identityRepair.binding.bindingId,
      actorRef: "reviewer_274_message_identity_block",
      recordedAt: "2026-04-18T10:17:00.000Z",
      contactRouteRef: "route_message_identity_candidate_274",
      contactRouteVersionRef: "route_message_identity_candidate_274@v1",
      verificationMethod: "manual_confirmed",
    });
    const identitySettled = await application.settleVerificationCheckpoint({
      taskId: "task_274_message_identity_block",
      bindingId: identityRepair.binding.bindingId,
      actorRef: "reviewer_274_message_identity_block",
      checkpointId: identityIssued.verificationCheckpoint.checkpointId,
      recordedAt: "2026-04-18T10:18:00.000Z",
      verificationState: "verified",
    });
    const blocked = await application.authorizeMessageRepairAction({
      taskId: "task_274_message_identity_block",
      threadId: identitySent.messageThread.threadId,
      actorRef: "reviewer_274_message_identity_block",
      recordedAt: "2026-04-18T10:18:30.000Z",
      authorizationKind: "controlled_resend",
    });

    expect(settled.assessment.assessmentState).toBe("clear");
    expect(settled.lastReboundRecord.resultingReachabilityEpoch).toBeGreaterThan(
      repair.binding.currentReachabilityEpoch,
    );
    expect(identitySettled.assessment.assessmentState).toBe("blocked");
    expect(identitySettled.binding.bindingState).toBe("repair_required");
    expect(blocked.outcome).toBe("blocked_existing_chain");
  });

  it("keeps support-linked recovery subordinate to the live message failure chain until an accepted settlement exists", async () => {
    const repairApplication = createPhase3CommunicationReachabilityRepairApplication();
    await freezeVerifiedRoute(repairApplication, {
      subjectRef: "subject_support_274",
      routeRef: "route_support_message_primary_274",
      routeVersionRef: "route_support_message_primary_274@v1",
      routeKind: "app_message",
      normalizedAddressRef: "normalized_support_message_primary_274",
      preferenceProfileRef: "prefs_support_message_primary_274",
      createdAt: "2026-04-18T09:58:00.000Z",
    });
    const sent = await createSentMessageThread(
      repairApplication.clinicianMessageApplication,
      "274_support_message",
      "route_support_message_primary_274",
    );
    const receipt = {
      messageId: "provider_message_274_support_message",
      providerCorrelationRef: "provider_message_274_support_message",
      statusClass: "accepted",
    };
    await repairApplication.clinicianMessageApplication.recordProviderReceipt({
      taskId: "task_274_support_message",
      threadId: sent.messageThread.threadId,
      recordedAt: "2026-04-18T10:11:00.000Z",
      requestUrl: "https://message.example.test/receipt",
      headers: buildMessageSignedHeaders("2026-04-18T10:11:00.000Z", receipt),
      transportMessageId: "transport_message_274_support_message",
      orderingKey: "0001",
      rawReceipt: receipt,
      semanticReceipt: receipt,
    });
    await repairApplication.recordMessageReachability({
      taskId: "task_274_support_message",
      threadId: sent.messageThread.threadId,
      actorRef: "reviewer_274_support_message",
      recordedAt: "2026-04-18T10:11:30.000Z",
      deliveryState: "failed",
      evidenceStrength: "direct_provider_receipt",
      providerDispositionRef: "provider_invalid_route_274_support_message",
      deliveryArtifactRefs: ["artifact_invalid_route_274_support_message"],
    });

    const supportApplication = createPhase3SupportCommunicationLinkageApplication({
      clinicianMessageApplication: {
        queryTaskClinicianMessageDomain: (taskId) =>
          repairApplication.clinicianMessageApplication.queryTaskClinicianMessageDomain(taskId),
      },
      callbackApplication: {
        queryTaskCallbackDomain: (taskId) =>
          repairApplication.callbackApplication.queryTaskCallbackDomain(taskId),
      },
      communicationRepairApplication: {
        queryTaskCommunicationRepair: (taskId) =>
          repairApplication.queryTaskCommunicationRepair(taskId),
      },
    });

    const opened = await supportApplication.openOrAttachSupportCommunicationFailure({
      taskId: "task_274_support_message",
      communicationDomain: "clinician_message_thread",
      requestedByRef: "support_user_274",
      reasonCode: "delivery_failed",
      idempotencyKey: "support_open_274",
      requestedAt: "2026-04-18T10:12:00.000Z",
    });
    const provisional = await supportApplication.recordSupportCommunicationAction({
      supportTicketId: opened.supportTicket.supportTicketId,
      actionScope: "controlled_resend",
      result: "awaiting_external",
      recordedByRef: "support_user_274",
      reasonCode: "controlled_resend_authorized",
      idempotencyKey: "support_action_274_provisional",
      recordedAt: "2026-04-18T10:12:30.000Z",
      noteOrSummaryRef: "support_note_274_provisional",
      sourceArtifactRef: "artifact_invalid_route_274_support_message",
      sourceEvidenceSnapshotRef: "artifact_invalid_route_274_support_message",
      expectedTicketVersionRef: opened.supportTicket.ticketVersionRef,
      expectedBindingHash: opened.supportLineageBinding.bindingHash,
      expectedCommunicationTupleHash: opened.communicationContext.governingThreadTupleHash,
    });
    const accepted = await supportApplication.recordSupportCommunicationAction({
      supportTicketId: opened.supportTicket.supportTicketId,
      actionScope: "manual_handoff",
      result: "manual_handoff_required",
      recordedByRef: "support_user_274",
      reasonCode: "manual_handoff_accepted",
      idempotencyKey: "support_action_274_accepted",
      recordedAt: "2026-04-18T10:13:00.000Z",
      noteOrSummaryRef: "support_note_274_accepted",
      sourceArtifactRef: "artifact_invalid_route_274_support_message",
      sourceEvidenceSnapshotRef: "artifact_invalid_route_274_support_message",
      expectedTicketVersionRef: provisional.supportTicket.ticketVersionRef,
      expectedBindingHash: provisional.supportLineageBinding.bindingHash,
      expectedCommunicationTupleHash: provisional.communicationContext.governingThreadTupleHash,
      acceptedTransfer: true,
    });
    const published = await supportApplication.publishSupportResolutionSnapshot({
      supportTicketId: opened.supportTicket.supportTicketId,
      supportActionSettlementId: accepted.settlement.supportActionSettlementId,
      resolutionCode: "handoff_summary",
      summaryRef: "support_resolution_274_handoff",
      handoffSummaryRef: "support_handoff_274_handoff",
      sourceArtifactRef: "artifact_invalid_route_274_support_message",
      sourceEvidenceSnapshotRef: "artifact_invalid_route_274_support_message",
      noteOrSummaryRef: "support_note_274_resolution",
      idempotencyKey: "support_publish_274_resolution",
      createdAt: "2026-04-18T10:13:30.000Z",
    });

    expect(provisional.settlement.authoritativeOutcomeState).toBe("awaiting_external");
    expect(provisional.communicationContext.failureState).toBe("failed");
    expect(provisional.latestResolutionSnapshot).toBeNull();
    expect(accepted.settlement.result).toBe("manual_handoff_required");
    expect(published.resolutionSnapshot.confirmationState).toBe("accepted_transfer");
    expect(published.supportTicket.lastResolutionSummaryRef).toBe(
      "support_resolution_274_handoff",
    );
  });
});
