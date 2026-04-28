import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_COMMUNICATION_REPAIR_QUERY_SURFACES,
  PHASE3_COMMUNICATION_REPAIR_SCHEMA_VERSION,
  PHASE3_COMMUNICATION_REPAIR_SERVICE_NAME,
  createPhase3CommunicationReachabilityRepairApplication,
  phase3CommunicationRepairMigrationPlanRefs,
  phase3CommunicationRepairPersistenceTables,
  phase3CommunicationRepairRoutes,
} from "../src/phase3-communication-reachability-repair.ts";

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
    createdAt: "2026-04-17T10:00:00.000Z",
  };
}

const CALLBACK_WEBHOOK_SECRET = "phase3_callback_simulator_secret";
const CALLBACK_WEBHOOK_SIGNATURE_HEADER = "x-vecells-simulator-signature";
const CALLBACK_WEBHOOK_TIMESTAMP_HEADER = "x-vecells-simulator-timestamp";

function buildCallbackSignedHeaders(timestamp, rawReceipt) {
  const signature = createHmac("sha256", CALLBACK_WEBHOOK_SECRET)
    .update(`${timestamp}.${JSON.stringify(rawReceipt)}`)
    .digest("hex");
  return {
    [CALLBACK_WEBHOOK_TIMESTAMP_HEADER]: timestamp,
    [CALLBACK_WEBHOOK_SIGNATURE_HEADER]: signature,
  };
}

async function seedReviewTask(application, seed) {
  const created = await application.triageApplication.createTask(createTaskInput(seed));
  await application.triageApplication.moveTaskToQueue({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    queuedAt: "2026-04-17T10:01:00.000Z",
  });
  await application.triageApplication.claimTask({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-17T10:02:00.000Z",
  });
  return application.triageApplication.enterReview({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    openedAt: "2026-04-17T10:03:00.000Z",
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_slice_${seed}`,
    audienceSurfaceRuntimeBindingRef: `runtime_binding_${seed}`,
    reviewActionLeaseRef: `review_action_${seed}`,
    selectedAnchorRef: `anchor_review_${seed}`,
    selectedAnchorTupleHashRef: `anchor_review_hash_${seed}`,
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

async function createLiveMessageSeed(application, seed) {
  await seedReviewTask(application, seed);
  const selected =
    await application.directResolutionApplication.endpointApplication.selectEndpoint({
      taskId: `task_${seed}`,
      actorRef: `reviewer_${seed}`,
      recordedAt: "2026-04-17T10:04:00.000Z",
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
    recordedAt: "2026-04-17T10:05:00.000Z",
  });
  return application.directResolutionApplication.commitDirectResolution({
    taskId: `task_${seed}`,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:06:00.000Z",
  });
}

async function createSentMessageThread(application, seed, routeRef) {
  await createLiveMessageSeed(application, seed);
  const created = await application.clinicianMessageApplication.createMessageThread({
    taskId: `task_${seed}`,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:07:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
  });
  await application.clinicianMessageApplication.saveDraft({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:08:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
    messageSubject: "Follow-up",
    messageBody: "Please confirm whether the wheeze is worse at night.",
  });
  await application.clinicianMessageApplication.approveDraft({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    actorRef: `approver_${seed}`,
    recordedAt: "2026-04-17T10:09:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
  });
  return application.clinicianMessageApplication.sendThread({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:10:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
    contactRouteRef: routeRef,
    repairIntent: "initial_send",
    providerCorrelationRef: `provider_message_${seed}`,
  });
}

async function createLiveCallbackSeed(application, seed) {
  await seedReviewTask(application, seed);
  const selected =
    await application.directResolutionApplication.endpointApplication.selectEndpoint({
      taskId: `task_${seed}`,
      actorRef: `reviewer_${seed}`,
      recordedAt: "2026-04-17T10:04:00.000Z",
      chosenEndpoint: "clinician_callback",
      reasoningText: "Callback is enough for the next step.",
      payload: {
        callbackWindow: "after_18_00",
        summary: "Call to confirm symptom change.",
      },
    });
  await application.directResolutionApplication.endpointApplication.submitEndpointDecision({
    taskId: `task_${seed}`,
    decisionId: selected.decision.decisionId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:05:00.000Z",
  });
  return application.directResolutionApplication.commitDirectResolution({
    taskId: `task_${seed}`,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:06:00.000Z",
  });
}

async function createReadyCallbackCase(application, seed, routeRef) {
  await createLiveCallbackSeed(application, seed);
  const created = await application.callbackApplication.createCallbackCase({
    taskId: `task_${seed}`,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:07:00.000Z",
    callbackUrgencyRef: "routine_same_day",
    preferredWindowRef: "after_18_00",
    serviceWindowRef: "service_window_daytime",
    contactRouteRef: routeRef,
    fallbackRouteRef: `${routeRef}_fallback`,
    retryPolicyRef: "retry_policy_callback_standard",
    pathwayRef: "routine_callback",
  });
  await application.callbackApplication.scheduleCallbackCase({
    taskId: `task_${seed}`,
    callbackCaseId: created.callbackCase.callbackCaseId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:08:00.000Z",
    callbackUrgencyRef: "routine_same_day",
    preferredWindowRef: "after_18_00",
    serviceWindowRef: "service_window_daytime",
    contactRouteRef: routeRef,
    fallbackRouteRef: `${routeRef}_fallback`,
    retryPolicyRef: "retry_policy_callback_standard",
    pathwayRef: "routine_callback",
    routeAuthorityState: "current",
  });
  await application.callbackApplication.armCallbackReady({
    taskId: `task_${seed}`,
    callbackCaseId: created.callbackCase.callbackCaseId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:09:00.000Z",
    pathwayRef: "routine_callback",
    routeAuthorityState: "current",
  });
  const initiated = await application.callbackApplication.initiateCallbackAttempt({
    taskId: `task_${seed}`,
    callbackCaseId: created.callbackCase.callbackCaseId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:10:00.000Z",
    dialTargetRef: routeRef,
    providerCorrelationRef: `call_${seed}`,
  });
  const rawReceipt = {
    statusClass: "no_answer",
    providerCorrelationRef: `call_${seed}`,
    callSid: `call_${seed}`,
  };
  await application.callbackApplication.recordProviderReceipt({
    taskId: `task_${seed}`,
    callbackCaseId: created.callbackCase.callbackCaseId,
    recordedAt: "2026-04-17T10:10:30.000Z",
    requestUrl: "https://callback.example.test/receipt",
    headers: buildCallbackSignedHeaders("2026-04-17T10:10:30.000Z", rawReceipt),
    transportMessageId: `telephony_msg_${seed}`,
    orderingKey: "0001",
    rawReceipt,
    semanticReceipt: rawReceipt,
  });
  return initiated;
}

describe("phase 3 communication reachability repair seam", () => {
  it("publishes the 245 communication repair routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(routeIds).toEqual(
      expect.arrayContaining([
        "workspace_task_communication_repair_current",
        "workspace_task_record_callback_reachability",
        "workspace_task_record_message_reachability",
        "workspace_task_attach_contact_route_candidate",
        "workspace_task_issue_contact_route_verification",
        "workspace_task_settle_contact_route_verification",
        "workspace_task_authorize_message_repair_action",
        "workspace_task_authorize_callback_reschedule",
      ]),
    );
    expect(phase3CommunicationRepairRoutes).toHaveLength(8);
    expect(PHASE3_COMMUNICATION_REPAIR_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/communication-repair",
    ]);
  });

  it("opens one canonical repair journey for bounced message delivery and keeps duplicate failure on the same repair chain", async () => {
    const application = createPhase3CommunicationReachabilityRepairApplication();
    await freezeVerifiedRoute(application, {
      subjectRef: "subject_message_245",
      routeRef: "route_message_primary_245",
      routeVersionRef: "route_message_primary_245@v1",
      routeKind: "app_message",
      normalizedAddressRef: "normalized_message_primary_245",
      preferenceProfileRef: "prefs_message_primary_245",
      createdAt: "2026-04-17T09:59:00.000Z",
    });
    const sent = await createSentMessageThread(
      application,
      "245_message",
      "route_message_primary_245",
    );
    const first = await application.recordMessageReachability({
      taskId: "task_245_message",
      threadId: sent.messageThread.threadId,
      actorRef: "reviewer_245_message",
      recordedAt: "2026-04-17T10:11:00.000Z",
      deliveryState: "failed",
      evidenceStrength: "direct_provider_receipt",
      providerDispositionRef: "provider_bounce",
      deliveryArtifactRefs: ["artifact_bounce_245"],
    });
    const second = await application.recordMessageReachability({
      taskId: "task_245_message",
      threadId: sent.messageThread.threadId,
      actorRef: "reviewer_245_message",
      recordedAt: "2026-04-17T10:12:00.000Z",
      deliveryState: "failed",
      evidenceStrength: "direct_provider_receipt",
      providerDispositionRef: "provider_bounce",
      deliveryArtifactRefs: ["artifact_bounce_245"],
    });
    const messageBundle =
      await application.clinicianMessageApplication.queryTaskClinicianMessageDomain(
        "task_245_message",
      );

    expect(application.serviceName).toBe(PHASE3_COMMUNICATION_REPAIR_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_COMMUNICATION_REPAIR_SCHEMA_VERSION);
    expect(application.migrationPlanRefs).toEqual(phase3CommunicationRepairMigrationPlanRefs);
    expect(phase3CommunicationRepairPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_communication_repair_bindings",
        "phase3_communication_repair_authorizations",
        "phase3_communication_rebound_records",
      ]),
    );
    expect(first.assessment.dominantReasonCode).toBe("DELIVERY_BOUNCE_RECORDED");
    expect(first.binding.bindingState).toBe("repair_required");
    expect(first.binding.activeRepairJourneyRef).toBeTruthy();
    expect(first.binding.activeRepairEntryGrantRef).toBeTruthy();
    expect(first.repairJourney.repairJourneyId).toBe(second.repairJourney.repairJourneyId);
    expect(messageBundle.messageThread.state).toBe("contact_route_repair_pending");
    expect(messageBundle.currentResolutionGate.decision).toBe("repair_route");
  });

  it("requires fresh verification and rebound before controlled resend can be authorized", async () => {
    const application = createPhase3CommunicationReachabilityRepairApplication();
    await freezeVerifiedRoute(application, {
      subjectRef: "subject_message_245_rebound",
      routeRef: "route_message_primary_245_rebound",
      routeVersionRef: "route_message_primary_245_rebound@v1",
      routeKind: "app_message",
      normalizedAddressRef: "normalized_message_primary_245_rebound",
      preferenceProfileRef: "prefs_message_primary_245_rebound",
      createdAt: "2026-04-17T09:59:00.000Z",
    });
    const sent = await createSentMessageThread(
      application,
      "245_message_rebound",
      "route_message_primary_245_rebound",
    );
    const repair = await application.recordMessageReachability({
      taskId: "task_245_message_rebound",
      threadId: sent.messageThread.threadId,
      actorRef: "reviewer_245_message_rebound",
      recordedAt: "2026-04-17T10:11:00.000Z",
      deliveryState: "failed",
      evidenceStrength: "direct_provider_receipt",
      providerDispositionRef: "provider_invalid_route",
      deliveryArtifactRefs: ["artifact_invalid_route_245"],
    });

    await application.attachCandidateRoute({
      taskId: "task_245_message_rebound",
      bindingId: repair.binding.bindingId,
      actorRef: "reviewer_245_message_rebound",
      recordedAt: "2026-04-17T10:12:00.000Z",
      subjectRef: "subject_message_245_rebound",
      routeRef: "route_message_repaired_245",
      routeVersionRef: "route_message_repaired_245@v1",
      routeKind: "app_message",
      normalizedAddressRef: "normalized_message_repaired_245",
      preferenceProfileRef: "prefs_message_repaired_245",
      verificationState: "unverified",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
    });
    const issued = await application.issueVerificationCheckpoint({
      taskId: "task_245_message_rebound",
      bindingId: repair.binding.bindingId,
      actorRef: "reviewer_245_message_rebound",
      recordedAt: "2026-04-17T10:13:00.000Z",
      contactRouteRef: "route_message_repaired_245",
      contactRouteVersionRef: "route_message_repaired_245@v1",
      verificationMethod: "one_time_code",
    });

    const blocked = await application.authorizeMessageRepairAction({
      taskId: "task_245_message_rebound",
      threadId: sent.messageThread.threadId,
      actorRef: "reviewer_245_message_rebound",
      recordedAt: "2026-04-17T10:13:30.000Z",
      authorizationKind: "controlled_resend",
    });

    const settled = await application.settleVerificationCheckpoint({
      taskId: "task_245_message_rebound",
      bindingId: repair.binding.bindingId,
      actorRef: "reviewer_245_message_rebound",
      checkpointId: issued.verificationCheckpoint.checkpointId,
      recordedAt: "2026-04-17T10:14:00.000Z",
      verificationState: "verified",
    });

    const [authorizedA, authorizedB] = await Promise.all([
      application.authorizeMessageRepairAction({
        taskId: "task_245_message_rebound",
        threadId: sent.messageThread.threadId,
        actorRef: "reviewer_245_message_rebound",
        recordedAt: "2026-04-17T10:15:00.000Z",
        authorizationKind: "controlled_resend",
      }),
      application.authorizeMessageRepairAction({
        taskId: "task_245_message_rebound",
        threadId: sent.messageThread.threadId,
        actorRef: "reviewer_245_message_rebound",
        recordedAt: "2026-04-17T10:15:00.000Z",
        authorizationKind: "controlled_resend",
      }),
    ]);

    expect(blocked.outcome).toBe("blocked_existing_chain");
    expect(blocked.authorization).toBeNull();
    expect(settled.binding.bindingState).toBe("clear");
    expect(settled.assessment.assessmentState).toBe("clear");
    expect(settled.binding.activeRepairJourneyRef).toBeNull();
    expect(settled.binding.activeRepairEntryGrantRef).toBeNull();
    expect(settled.lastReboundRecord.resultingReachabilityEpoch).toBeGreaterThan(
      repair.binding.currentReachabilityEpoch,
    );
    expect(authorizedA.authorization.authorizationId).toBe(
      authorizedB.authorization.authorizationId,
    );
    expect(authorizedA.authorization.authorizationKind).toBe("controlled_resend");
  });

  it("treats repeated no-answer as governed repair and authorizes callback reschedule only after rebound", async () => {
    const application = createPhase3CommunicationReachabilityRepairApplication();
    await freezeVerifiedRoute(application, {
      subjectRef: "subject_callback_245",
      routeRef: "route_callback_primary_245",
      routeVersionRef: "route_callback_primary_245@v1",
      routeKind: "voice",
      normalizedAddressRef: "normalized_callback_primary_245",
      preferenceProfileRef: "prefs_callback_primary_245",
      createdAt: "2026-04-17T09:59:00.000Z",
    });
    const ready = await createReadyCallbackCase(
      application,
      "245_callback",
      "route_callback_primary_245",
    );

    const first = await application.recordCallbackReachability({
      taskId: "task_245_callback",
      callbackCaseId: ready.callbackCase.callbackCaseId,
      actorRef: "reviewer_245_callback",
      recordedAt: "2026-04-17T10:11:00.000Z",
      outcome: "no_answer",
      routeEvidenceRef: "route_evidence_245_callback_first",
      pathwayRef: "routine_callback",
      explicitPermissionState: "unknown",
      containsClinicalContent: false,
      verifiedTargetState: "verified",
      safetyClassification: "technical_only",
      safetyPreemptionState: "clear",
    });
    const second = await application.recordCallbackReachability({
      taskId: "task_245_callback",
      callbackCaseId: ready.callbackCase.callbackCaseId,
      actorRef: "reviewer_245_callback",
      recordedAt: "2026-04-17T10:12:00.000Z",
      outcome: "no_answer",
      routeEvidenceRef: "route_evidence_245_callback_second",
      pathwayRef: "routine_callback",
      explicitPermissionState: "unknown",
      containsClinicalContent: false,
      verifiedTargetState: "verified",
      safetyClassification: "technical_only",
      safetyPreemptionState: "clear",
    });

    expect(first.binding.activeRepairJourneyRef).toBeNull();
    expect(second.binding.activeRepairJourneyRef).toBeTruthy();

    const callbackBundle =
      await application.callbackApplication.queryTaskCallbackDomain("task_245_callback");
    expect(callbackBundle.callbackCase.state).toBe("contact_route_repair_pending");
    expect(callbackBundle.currentResolutionGate.decision).toBe("retry");

    await application.attachCandidateRoute({
      taskId: "task_245_callback",
      bindingId: second.binding.bindingId,
      actorRef: "reviewer_245_callback",
      recordedAt: "2026-04-17T10:13:00.000Z",
      subjectRef: "subject_callback_245",
      routeRef: "route_callback_repaired_245",
      routeVersionRef: "route_callback_repaired_245@v1",
      routeKind: "voice",
      normalizedAddressRef: "normalized_callback_repaired_245",
      preferenceProfileRef: "prefs_callback_repaired_245",
      verificationState: "unverified",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
    });
    const issued = await application.issueVerificationCheckpoint({
      taskId: "task_245_callback",
      bindingId: second.binding.bindingId,
      actorRef: "reviewer_245_callback",
      recordedAt: "2026-04-17T10:14:00.000Z",
      contactRouteRef: "route_callback_repaired_245",
      contactRouteVersionRef: "route_callback_repaired_245@v1",
      verificationMethod: "manual_confirmed",
    });
    await application.settleVerificationCheckpoint({
      taskId: "task_245_callback",
      bindingId: second.binding.bindingId,
      actorRef: "reviewer_245_callback",
      checkpointId: issued.verificationCheckpoint.checkpointId,
      recordedAt: "2026-04-17T10:15:00.000Z",
      verificationState: "verified",
    });

    const [authorizedA, authorizedB] = await Promise.all([
      application.authorizeCallbackReschedule({
        taskId: "task_245_callback",
        callbackCaseId: ready.callbackCase.callbackCaseId,
        actorRef: "reviewer_245_callback",
        recordedAt: "2026-04-17T10:16:00.000Z",
      }),
      application.authorizeCallbackReschedule({
        taskId: "task_245_callback",
        callbackCaseId: ready.callbackCase.callbackCaseId,
        actorRef: "reviewer_245_callback",
        recordedAt: "2026-04-17T10:16:00.000Z",
      }),
    ]);

    expect(authorizedA.outcome).toBe("authorized");
    expect(authorizedA.authorization.authorizationId).toBe(
      authorizedB.authorization.authorizationId,
    );
    expect(authorizedA.authorization.authorizationKind).toBe("callback_reschedule");
  });
});
