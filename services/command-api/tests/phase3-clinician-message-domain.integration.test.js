import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_CLINICIAN_MESSAGE_QUERY_SURFACES,
  PHASE3_CLINICIAN_MESSAGE_SCHEMA_VERSION,
  PHASE3_CLINICIAN_MESSAGE_SERVICE_NAME,
  createPhase3ClinicianMessageDomainApplication,
  phase3ClinicianMessageMigrationPlanRefs,
  phase3ClinicianMessagePersistenceTables,
  phase3ClinicianMessageRoutes,
} from "../src/phase3-clinician-message-domain.ts";

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
    createdAt: "2026-04-17T10:00:00.000Z",
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

async function createMessageThread(application, seed) {
  await createLiveMessageSeed(application, seed);
  return application.createMessageThread({
    taskId: `task_${seed}`,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:07:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
  });
}

async function createDeliveredThread(application, seed) {
  const created = await createMessageThread(application, seed);
  await application.saveDraft({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:08:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
    messageSubject: "Follow-up",
    messageBody: "Please confirm whether the wheeze is worse at night.",
  });
  await application.approveDraft({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    actorRef: `approver_${seed}`,
    recordedAt: "2026-04-17T10:09:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
  });
  const sent = await application.sendThread({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:10:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
    providerCorrelationRef: `provider_message_${seed}`,
  });
  const timestamp = "2026-04-17T10:11:00.000Z";
  const rawReceipt = {
    messageId: `provider_message_${seed}`,
    providerCorrelationRef: `provider_message_${seed}`,
    statusClass: "accepted",
  };
  await application.recordProviderReceipt({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    recordedAt: timestamp,
    requestUrl: "https://message.example.test/receipt",
    headers: buildSignedHeaders(timestamp, rawReceipt),
    transportMessageId: `transport_message_${seed}`,
    orderingKey: "0001",
    rawReceipt,
    semanticReceipt: rawReceipt,
  });
  return application.recordDeliveryEvidence({
    taskId: `task_${seed}`,
    threadId: created.messageThread.threadId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:12:00.000Z",
    reviewActionLeaseRef: `review_action_${seed}`,
    deliveryState: "delivered",
    evidenceStrength: "direct_provider_receipt",
    providerDispositionRef: "provider_delivered",
    deliveryArtifactRefs: [`artifact_delivery_${seed}`],
  });
}

function canonicalReceiptPayload(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function buildSignedHeaders(timestamp, rawReceipt) {
  const signature = createHmac("sha256", MESSAGE_WEBHOOK_SECRET)
    .update(`${timestamp}.${canonicalReceiptPayload(rawReceipt)}`)
    .digest("hex");
  return {
    [MESSAGE_WEBHOOK_TIMESTAMP_HEADER]: timestamp,
    [MESSAGE_WEBHOOK_SIGNATURE_HEADER]: signature,
  };
}

describe("phase 3 clinician message domain seam", () => {
  it("publishes the 244 clinician message routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(routeIds).toEqual(
      expect.arrayContaining([
        "workspace_task_message_thread_current",
        "workspace_task_create_message_thread",
        "workspace_task_save_message_draft",
        "workspace_task_approve_message_draft",
        "workspace_task_send_message_thread",
        "workspace_task_record_message_provider_receipt",
        "workspace_task_record_message_delivery_evidence",
        "workspace_task_ingest_message_reply",
        "workspace_task_settle_message_resolution_gate",
        "workspace_task_reopen_message_thread",
      ]),
    );
    expect(phase3ClinicianMessageRoutes).toHaveLength(10);
    expect(PHASE3_CLINICIAN_MESSAGE_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/message-thread",
    ]);
  });

  it("creates the clinician message thread from the live seed and reuses one immutable MessageDispatchEnvelope for duplicate send", async () => {
    const application = createPhase3ClinicianMessageDomainApplication();
    const created = await createMessageThread(application, "244_send");
    const replayedThread = await application.createMessageThread({
      taskId: "task_244_send",
      actorRef: "reviewer_244_send",
      recordedAt: "2026-04-17T10:07:30.000Z",
      reviewActionLeaseRef: "review_action_244_send",
    });
    await application.saveDraft({
      taskId: "task_244_send",
      threadId: created.messageThread.threadId,
      actorRef: "reviewer_244_send",
      recordedAt: "2026-04-17T10:08:00.000Z",
      reviewActionLeaseRef: "review_action_244_send",
      messageSubject: "Follow-up",
      messageBody: "Please confirm whether the wheeze is worse at night.",
    });
    await application.approveDraft({
      taskId: "task_244_send",
      threadId: created.messageThread.threadId,
      actorRef: "approver_244_send",
      recordedAt: "2026-04-17T10:09:00.000Z",
      reviewActionLeaseRef: "review_action_244_send",
    });
    const firstSend = await application.sendThread({
      taskId: "task_244_send",
      threadId: created.messageThread.threadId,
      actorRef: "reviewer_244_send",
      recordedAt: "2026-04-17T10:10:00.000Z",
      reviewActionLeaseRef: "review_action_244_send",
      providerCorrelationRef: "provider_message_244_send",
    });
    const replaySend = await application.sendThread({
      taskId: "task_244_send",
      threadId: created.messageThread.threadId,
      actorRef: "reviewer_244_send",
      recordedAt: "2026-04-17T10:10:30.000Z",
      reviewActionLeaseRef: "review_action_244_send",
      providerCorrelationRef: "provider_message_244_send",
    });
    const outboxEntries = application
      .listOutboxEntries()
      .filter((entry) => entry.effectKey.includes("::projection_refresh::dispatch::"));

    expect(application.serviceName).toBe(PHASE3_CLINICIAN_MESSAGE_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_CLINICIAN_MESSAGE_SCHEMA_VERSION);
    expect(application.migrationPlanRefs).toEqual(phase3ClinicianMessageMigrationPlanRefs);
    expect(phase3ClinicianMessagePersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_clinician_message_threads",
        "phase3_message_dispatch_envelopes",
        "phase3_message_delivery_evidence_bundles",
        "phase3_thread_expectation_envelopes",
        "phase3_thread_resolution_gates",
        "phase3_message_patient_replies",
        "phase3_message_thread_outbox_entries",
      ]),
    );
    expect(replayedThread.messageThread.threadId).toBe(created.messageThread.threadId);
    expect(firstSend.currentDispatchEnvelope?.messageDispatchEnvelopeId).toBeTruthy();
    expect(replaySend.currentDispatchEnvelope?.messageDispatchEnvelopeId).toBe(
      firstSend.currentDispatchEnvelope?.messageDispatchEnvelopeId,
    );
    expect(outboxEntries).toHaveLength(1);
  });

  it("keeps provider acceptance provisional until MessageDeliveryEvidenceBundle is written and rejects contradictory late failure evidence", async () => {
    const application = createPhase3ClinicianMessageDomainApplication();
    const created = await createMessageThread(application, "244_delivery");
    await application.approveDraft({
      taskId: "task_244_delivery",
      threadId: created.messageThread.threadId,
      actorRef: "approver_244_delivery",
      recordedAt: "2026-04-17T10:09:00.000Z",
      reviewActionLeaseRef: "review_action_244_delivery",
    });
    await application.sendThread({
      taskId: "task_244_delivery",
      threadId: created.messageThread.threadId,
      actorRef: "reviewer_244_delivery",
      recordedAt: "2026-04-17T10:10:00.000Z",
      reviewActionLeaseRef: "review_action_244_delivery",
      providerCorrelationRef: "provider_message_244_delivery",
    });
    const timestamp = "2026-04-17T10:11:00.000Z";
    const rawReceipt = {
      messageId: "provider_message_244_delivery",
      providerCorrelationRef: "provider_message_244_delivery",
      statusClass: "accepted",
    };
    const afterReceipt = await application.recordProviderReceipt({
      taskId: "task_244_delivery",
      threadId: created.messageThread.threadId,
      recordedAt: timestamp,
      requestUrl: "https://message.example.test/receipt",
      headers: buildSignedHeaders(timestamp, rawReceipt),
      transportMessageId: "transport_message_244_delivery",
      orderingKey: "0001",
      rawReceipt,
      semanticReceipt: rawReceipt,
    });
    const delivered = await application.recordDeliveryEvidence({
      taskId: "task_244_delivery",
      threadId: created.messageThread.threadId,
      actorRef: "reviewer_244_delivery",
      recordedAt: "2026-04-17T10:12:00.000Z",
      reviewActionLeaseRef: "review_action_244_delivery",
      deliveryState: "delivered",
      evidenceStrength: "direct_provider_receipt",
      providerDispositionRef: "provider_delivered",
      deliveryArtifactRefs: ["artifact_delivery_244_delivery"],
    });

    expect(afterReceipt.messageThread.state).toBe("sent");
    expect(afterReceipt.currentDispatchEnvelope.transportState).toBe("provider_accepted");
    expect(afterReceipt.currentDeliveryEvidenceBundle).toBeNull();
    expect(delivered.messageThread.state).toBe("delivered");
    expect(delivered.currentExpectationEnvelope.patientVisibleState).toBe("reply_needed");

    await expect(
      application.recordDeliveryEvidence({
        taskId: "task_244_delivery",
        threadId: created.messageThread.threadId,
        actorRef: "reviewer_244_delivery",
        recordedAt: "2026-04-17T10:13:00.000Z",
        reviewActionLeaseRef: "review_action_244_delivery",
        deliveryState: "failed",
        evidenceStrength: "contradictory_signal",
        providerDispositionRef: "provider_bounced_after_delivery",
        deliveryArtifactRefs: ["artifact_delivery_244_delivery_late_fail"],
      }),
    ).rejects.toThrow(/MESSAGE_DELIVERY_CONTRADICTION_REQUIRES_DISPUTE/);
  });

  it("rejects unsigned provider receipts under the clinician message webhook policy", async () => {
    const application = createPhase3ClinicianMessageDomainApplication();
    const created = await createMessageThread(application, "244_signature");
    await application.approveDraft({
      taskId: "task_244_signature",
      threadId: created.messageThread.threadId,
      actorRef: "approver_244_signature",
      recordedAt: "2026-04-17T10:09:00.000Z",
      reviewActionLeaseRef: "review_action_244_signature",
    });
    await application.sendThread({
      taskId: "task_244_signature",
      threadId: created.messageThread.threadId,
      actorRef: "reviewer_244_signature",
      recordedAt: "2026-04-17T10:10:00.000Z",
      reviewActionLeaseRef: "review_action_244_signature",
      providerCorrelationRef: "provider_message_244_signature",
    });

    await expect(
      application.recordProviderReceipt({
        taskId: "task_244_signature",
        threadId: created.messageThread.threadId,
        recordedAt: "2026-04-17T10:11:00.000Z",
        requestUrl: "https://message.example.test/receipt",
        headers: {
          [MESSAGE_WEBHOOK_TIMESTAMP_HEADER]: "2026-04-17T10:11:00.000Z",
          [MESSAGE_WEBHOOK_SIGNATURE_HEADER]: "invalid",
        },
        transportMessageId: "transport_message_244_signature",
        orderingKey: "0001",
        rawReceipt: {
          messageId: "provider_message_244_signature",
          providerCorrelationRef: "provider_message_244_signature",
          statusClass: "accepted",
        },
        semanticReceipt: {
          messageId: "provider_message_244_signature",
          providerCorrelationRef: "provider_message_244_signature",
          statusClass: "accepted",
        },
      }),
    ).rejects.toThrow(/MESSAGE_WEBHOOK_SIGNATURE_REJECTED/);
  });

  it("routes the patient reply onto the current thread and emits the 237 assimilation hook before callback escalation", async () => {
    const application = createPhase3ClinicianMessageDomainApplication();
    const delivered = await createDeliveredThread(application, "244_reply");
    const replied = await application.ingestPatientReply({
      taskId: "task_244_reply",
      threadId: delivered.messageThread.threadId,
      recordedAt: "2026-04-17T10:13:00.000Z",
      replyRouteFamilyRef: "secure_message_reply",
      replyChannelRef: "app_secure_message",
      replyText: "The wheeze is worse overnight and I am struggling to sleep.",
      replyArtifactRefs: ["artifact_reply_244_reply"],
      providerCorrelationRef: "provider_reply_244_reply",
      secureEntryGrantRef: "grant_reply_244_reply",
      classificationHint: "potentially_clinical",
    });
    const reviewPending = await application.settleResolutionGate({
      taskId: "task_244_reply",
      threadId: delivered.messageThread.threadId,
      actorRef: "reviewer_244_reply",
      recordedAt: "2026-04-17T10:14:00.000Z",
      reviewActionLeaseRef: "review_action_244_reply",
      explicitDecision: "review_pending",
    });
    const escalated = await application.settleResolutionGate({
      taskId: "task_244_reply",
      threadId: delivered.messageThread.threadId,
      actorRef: "reviewer_244_reply",
      recordedAt: "2026-04-17T10:15:00.000Z",
      reviewActionLeaseRef: "review_action_244_reply",
      explicitDecision: "escalate_to_callback",
      callbackEscalationRef: "callback_case_seeded_from_message_244_reply",
    });

    expect(replied.messageThread.state).toBe("patient_replied");
    expect(replied.latestReply.needsAssimilation).toBe(true);
    expect(reviewPending.messageThread.state).toBe("awaiting_clinician_review");
    expect(reviewPending.currentResolutionGate.decision).toBe("review_pending");
    expect(
      application
        .listOutboxEntries()
        .some((entry) => entry.effectType === "reply_assimilation" && entry.patientReplyRef === replied.latestReply.messagePatientReplyId),
    ).toBe(true);
    expect(escalated.messageThread.state).toBe("escalated_to_callback");
    expect(escalated.currentResolutionGate.decision).toBe("escalate_to_callback");
    expect(
      application
        .listOutboxEntries()
        .some((entry) => entry.effectType === "callback_escalation"),
    ).toBe(true);
  });

  it("closes only through ThreadResolutionGate and then reacquires a fresh lease on reopen", async () => {
    const application = createPhase3ClinicianMessageDomainApplication();
    const delivered = await createDeliveredThread(application, "244_reopen");
    const closed = await application.settleResolutionGate({
      taskId: "task_244_reopen",
      threadId: delivered.messageThread.threadId,
      actorRef: "reviewer_244_reopen",
      recordedAt: "2026-04-17T10:13:00.000Z",
      reviewActionLeaseRef: "review_action_244_reopen",
      explicitDecision: "close",
    });
    const reopened = await application.reopenThread({
      taskId: "task_244_reopen",
      threadId: delivered.messageThread.threadId,
      actorRef: "reviewer_244_reopen",
      recordedAt: "2026-04-17T10:14:00.000Z",
      reviewActionLeaseRef: "review_action_244_reopen",
    });

    expect(closed.messageThread.state).toBe("closed");
    expect(closed.currentResolutionGate.decision).toBe("close");
    expect(reopened.messageThread.state).toBe("reopened");
    expect(reopened.currentExpectationEnvelope.patientVisibleState).toBe("awaiting_review");
    expect(reopened.messageThread.requestLifecycleLeaseRef).not.toBe(
      closed.messageThread.requestLifecycleLeaseRef,
    );
  });
});
