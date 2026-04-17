import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_CALLBACK_QUERY_SURFACES,
  PHASE3_CALLBACK_SCHEMA_VERSION,
  PHASE3_CALLBACK_SERVICE_NAME,
  createPhase3CallbackDomainApplication,
  phase3CallbackMigrationPlanRefs,
  phase3CallbackPersistenceTables,
  phase3CallbackRoutes,
} from "../src/phase3-callback-domain.ts";

const CALLBACK_WEBHOOK_SECRET = "phase3_callback_simulator_secret";
const CALLBACK_WEBHOOK_SIGNATURE_HEADER = "x-vecells-simulator-signature";
const CALLBACK_WEBHOOK_TIMESTAMP_HEADER = "x-vecells-simulator-timestamp";

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

async function createCallbackCase(application, seed) {
  await createLiveCallbackSeed(application, seed);
  return application.createCallbackCase({
    taskId: `task_${seed}`,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:07:00.000Z",
    callbackUrgencyRef: "routine_same_day",
    preferredWindowRef: "after_18_00",
    serviceWindowRef: "service_window_daytime",
    contactRouteRef: "route_mobile_primary",
    fallbackRouteRef: "route_mobile_secondary",
    retryPolicyRef: "retry_policy_callback_standard",
    pathwayRef: "routine_callback",
  });
}

async function createReadyCallbackCase(application, seed) {
  const created = await createCallbackCase(application, seed);
  await application.scheduleCallbackCase({
    taskId: `task_${seed}`,
    callbackCaseId: created.callbackCase.callbackCaseId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:08:00.000Z",
    callbackUrgencyRef: "routine_same_day",
    preferredWindowRef: "after_18_00",
    serviceWindowRef: "service_window_daytime",
    contactRouteRef: "route_mobile_primary",
    fallbackRouteRef: "route_mobile_secondary",
    retryPolicyRef: "retry_policy_callback_standard",
    pathwayRef: "routine_callback",
    routeAuthorityState: "current",
  });
  return application.armCallbackReady({
    taskId: `task_${seed}`,
    callbackCaseId: created.callbackCase.callbackCaseId,
    actorRef: `reviewer_${seed}`,
    recordedAt: "2026-04-17T10:09:00.000Z",
    pathwayRef: "routine_callback",
    routeAuthorityState: "current",
  });
}

function buildSignedHeaders(timestamp, rawReceipt) {
  const payload = JSON.stringify(rawReceipt);
  const signature = createHmac("sha256", CALLBACK_WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return {
    [CALLBACK_WEBHOOK_TIMESTAMP_HEADER]: timestamp,
    [CALLBACK_WEBHOOK_SIGNATURE_HEADER]: signature,
  };
}

describe("phase 3 callback domain seam", () => {
  it("publishes the 243 callback routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(routeIds).toEqual(
      expect.arrayContaining([
        "workspace_task_callback_case_current",
        "workspace_task_create_callback_case",
        "workspace_task_schedule_callback_case",
        "workspace_task_reschedule_callback_case",
        "workspace_task_cancel_callback_case",
        "workspace_task_arm_callback_ready",
        "workspace_task_initiate_callback_attempt",
        "workspace_task_record_callback_provider_receipt",
        "workspace_task_record_callback_outcome_evidence",
        "workspace_task_settle_callback_resolution_gate",
        "workspace_task_reopen_callback_case",
      ]),
    );
    expect(phase3CallbackRoutes).toHaveLength(11);
    expect(PHASE3_CALLBACK_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/callback-case",
    ]);
  });

  it("creates the callback case from the live callback seed and rotates the intent lease when material schedule drift occurs", async () => {
    const application = createPhase3CallbackDomainApplication();
    const created = await createCallbackCase(application, "243_schedule");
    const scheduled = await application.scheduleCallbackCase({
      taskId: "task_243_schedule",
      callbackCaseId: created.callbackCase.callbackCaseId,
      actorRef: "reviewer_243_schedule",
      recordedAt: "2026-04-17T10:08:00.000Z",
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
      taskId: "task_243_schedule",
      callbackCaseId: created.callbackCase.callbackCaseId,
      actorRef: "reviewer_243_schedule",
      recordedAt: "2026-04-17T10:10:00.000Z",
      callbackUrgencyRef: "routine_same_day",
      preferredWindowRef: "before_noon",
      serviceWindowRef: "service_window_early",
      contactRouteRef: "route_mobile_backup",
      fallbackRouteRef: "route_sms_repair",
      retryPolicyRef: "retry_policy_callback_standard",
      pathwayRef: "routine_callback",
      routeAuthorityState: "current",
    });

    expect(application.serviceName).toBe(PHASE3_CALLBACK_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_CALLBACK_SCHEMA_VERSION);
    expect(application.migrationPlanRefs).toEqual(phase3CallbackMigrationPlanRefs);
    expect(phase3CallbackPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase3_callback_cases",
        "phase3_callback_intent_leases",
        "phase3_callback_attempt_records",
        "phase3_callback_expectation_envelopes",
        "phase3_callback_outcome_evidence_bundles",
        "phase3_callback_resolution_gates",
      ]),
    );
    expect(created.callbackSeedRef).toContain("phase3_callback_case_seed");
    expect(scheduled.callbackCase.state).toBe("scheduled");
    expect(scheduled.currentExpectationEnvelope.patientVisibleState).toBe("scheduled");
    expect(rescheduled.currentIntentLease.callbackIntentLeaseId).not.toBe(
      scheduled.currentIntentLease.callbackIntentLeaseId,
    );
    expect(rescheduled.currentIntentLease.contactRouteRef).toBe("route_mobile_backup");
    expect(rescheduled.currentExpectationEnvelope.expectedWindowRef).toContain("before_noon");
  });

  it("reuses the same CallbackAttemptRecord for duplicate initiation and collapses exact provider receipt replay onto one checkpoint", async () => {
    const application = createPhase3CallbackDomainApplication();
    const ready = await createReadyCallbackCase(application, "243_attempt");
    const callbackCaseId = ready.callbackCase.callbackCaseId;

    const firstAttempt = await application.initiateCallbackAttempt({
      taskId: "task_243_attempt",
      callbackCaseId,
      actorRef: "reviewer_243_attempt",
      recordedAt: "2026-04-17T10:10:00.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_243_attempt",
    });
    const replayAttempt = await application.initiateCallbackAttempt({
      taskId: "task_243_attempt",
      callbackCaseId,
      actorRef: "reviewer_243_attempt",
      recordedAt: "2026-04-17T10:10:30.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_243_attempt",
    });

    const rawReceipt = {
      statusClass: "completed",
      providerCorrelationRef: "call_243_attempt",
      callSid: "call_243_attempt",
      answeredBy: "human",
    };
    const timestamp = "2026-04-17T10:11:00.000Z";
    const firstReceipt = await application.recordProviderReceipt({
      taskId: "task_243_attempt",
      callbackCaseId,
      recordedAt: timestamp,
      requestUrl: "https://callback.example.test/receipt",
      headers: buildSignedHeaders(timestamp, rawReceipt),
      transportMessageId: "telephony_msg_243_attempt",
      orderingKey: "0001",
      rawReceipt,
      semanticReceipt: rawReceipt,
    });
    const replayReceipt = await application.recordProviderReceipt({
      taskId: "task_243_attempt",
      callbackCaseId,
      recordedAt: "2026-04-17T10:11:10.000Z",
      requestUrl: "https://callback.example.test/receipt",
      headers: buildSignedHeaders(timestamp, rawReceipt),
      transportMessageId: "telephony_msg_243_attempt",
      orderingKey: "0001",
      rawReceipt,
      semanticReceipt: rawReceipt,
    });
    const receiptCheckpoints =
      await application.replayApplication.repositories.listAdapterReceiptCheckpoints();

    expect(firstAttempt.latestAttempt.callbackAttemptRecordId).toBe(
      replayAttempt.latestAttempt.callbackAttemptRecordId,
    );
    expect(firstAttempt.latestAttempt.latestReceiptCheckpointRef).toBeNull();
    expect(firstReceipt.latestAttempt.latestReceiptCheckpointRef).toBe(
      replayReceipt.latestAttempt.latestReceiptCheckpointRef,
    );
    expect(replayReceipt.latestAttempt.settlementState).toBe("outcome_pending");
    expect(receiptCheckpoints).toHaveLength(1);
  });

  it("rejects unsigned provider receipts under the callback webhook policy", async () => {
    const application = createPhase3CallbackDomainApplication();
    const ready = await createReadyCallbackCase(application, "243_signature");
    const callbackCaseId = ready.callbackCase.callbackCaseId;

    await application.initiateCallbackAttempt({
      taskId: "task_243_signature",
      callbackCaseId,
      actorRef: "reviewer_243_signature",
      recordedAt: "2026-04-17T10:10:00.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_243_signature",
    });

    await expect(
      application.recordProviderReceipt({
        taskId: "task_243_signature",
        callbackCaseId,
        recordedAt: "2026-04-17T10:11:00.000Z",
        requestUrl: "https://callback.example.test/receipt",
        headers: {
          [CALLBACK_WEBHOOK_TIMESTAMP_HEADER]: "2026-04-17T10:11:00.000Z",
          [CALLBACK_WEBHOOK_SIGNATURE_HEADER]: "invalid_signature",
        },
        transportMessageId: "telephony_msg_243_signature",
        orderingKey: "0001",
        rawReceipt: { statusClass: "completed" },
        semanticReceipt: { statusClass: "completed" },
      }),
    ).rejects.toThrow("CALLBACK_WEBHOOK_SIGNATURE_REJECTED");
  });

  it("blocks voicemail_left until an explicit allowed voicemail policy and evidence chain are present", async () => {
    const application = createPhase3CallbackDomainApplication();
    const ready = await createReadyCallbackCase(application, "243_voicemail");
    const callbackCaseId = ready.callbackCase.callbackCaseId;

    await application.initiateCallbackAttempt({
      taskId: "task_243_voicemail",
      callbackCaseId,
      actorRef: "reviewer_243_voicemail",
      recordedAt: "2026-04-17T10:10:00.000Z",
      dialTargetRef: "route_mobile_primary",
      providerCorrelationRef: "call_243_voicemail",
    });

    await expect(
      application.recordOutcomeEvidence({
        taskId: "task_243_voicemail",
        callbackCaseId,
        actorRef: "reviewer_243_voicemail",
        recordedAt: "2026-04-17T10:11:00.000Z",
        outcome: "voicemail_left",
        routeEvidenceRef: "route_evidence_243_voicemail",
        providerDispositionRef: "provider_voicemail_detected",
        patientAcknowledgementRef: null,
        safetyClassification: "technical_only",
        safetyPreemptionState: "clear",
        pathwayRef: "routine_callback",
        tenantPolicyRef: null,
        explicitPermissionState: "unknown",
        containsClinicalContent: false,
        verifiedTargetState: "unknown",
        voicemailEvidenceRefs: ["CALLBACK_243_VOICEMAIL_RECORDING_CAPTURED"],
      }),
    ).rejects.toThrow("CALLBACK_VOICEMAIL_POLICY_BLOCKED");
  });
});
