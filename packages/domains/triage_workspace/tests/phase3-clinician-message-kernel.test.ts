import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3ClinicianMessageKernelService,
  createPhase3ClinicianMessageKernelStore,
} from "../src/index.ts";

function createHarness(seed: string) {
  const repositories = createPhase3ClinicianMessageKernelStore();
  const service = createPhase3ClinicianMessageKernelService(repositories, {
    idGenerator: createDeterministicBackboneIdGenerator(`phase3_clinician_message_${seed}`),
  });
  return { repositories, service };
}

function createExpectationEnvelope(seed: string, state: "reply_blocked" | "reply_needed" | "awaiting_review" | "closed", createdAt: string) {
  return {
    threadExpectationEnvelopeId: `thread_expectation_envelope_${seed}_${state}`,
    reachabilityDependencyRef: null,
    contactRepairJourneyRef: null,
    identityRepairBranchDispositionRef: null,
    patientVisibleState: state,
    replyWindowRef: `reply_window_${state}`,
    deliveryRiskState: "on_track" as const,
    stateConfidenceBand: "high" as const,
    fallbackGuidanceRef: `THREAD_${seed}_${state.toUpperCase()}`,
    routeIntentBindingRef: `route_intent_${seed}_${state}`,
    requiredReleaseApprovalFreezeRef: null,
    channelReleaseFreezeState: "open",
    requiredAssuranceSliceTrustRefs: [] as const,
    latestSupportActionSettlementRef: null,
    transitionEnvelopeRef: `transition_envelope_${seed}_${state}`,
    continuityEvidenceRef: `continuity_${seed}_${state}`,
    freezeDispositionRef: null,
    causalToken: `causal_${seed}_${state}`,
    createdAt,
  };
}

async function createThread(seed: string) {
  const harness = createHarness(seed);
  const created = await harness.service.createMessageThread({
    threadId: `thread_${seed}`,
    sourceTriageTaskRef: `task_${seed}`,
    clinicianMessageSeedRef: `message_seed_${seed}`,
    episodeRef: `episode_${seed}`,
    requestId: `request_${seed}`,
    requestLineageRef: `lineage_${seed}`,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    decisionEpochRef: `epoch_${seed}`,
    decisionId: `decision_${seed}`,
    threadPurposeRef: "operational_follow_up",
    closureRuleRef: "close_after_review_or_callback",
    authorActorRef: `reviewer_${seed}`,
    approvalRequiredState: "required",
    messageSubject: "Follow-up",
    messageBody: "Please confirm symptom change.",
    requestLifecycleLeaseRef: `lease_${seed}`,
    leaseAuthorityRef: "lease_authority_clinician_message_thread",
    ownershipEpoch: 2,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 3,
    createdAt: "2026-04-17T09:00:00.000Z",
    initialExpectationEnvelope: createExpectationEnvelope(
      seed,
      "reply_blocked",
      "2026-04-17T09:00:00.000Z",
    ),
  });
  return { ...harness, created };
}

describe("phase 3 clinician message kernel", () => {
  it("creates one clinician message thread and reuses it when the same message seed is replayed", async () => {
    const { service, created } = await createThread("244_thread");
    const replay = await service.createMessageThread({
      threadId: "thread_244_thread_replay",
      sourceTriageTaskRef: "task_244_thread",
      clinicianMessageSeedRef: "message_seed_244_thread",
      episodeRef: "episode_244_thread",
      requestId: "request_244_thread",
      requestLineageRef: "lineage_244_thread",
      lineageCaseLinkRef: "lineage_case_link_244_thread",
      decisionEpochRef: "epoch_244_thread",
      decisionId: "decision_244_thread",
      threadPurposeRef: "operational_follow_up",
      closureRuleRef: "close_after_review_or_callback",
      authorActorRef: "reviewer_244_thread",
      approvalRequiredState: "required",
      messageSubject: "Follow-up",
      messageBody: "Please confirm symptom change.",
      requestLifecycleLeaseRef: "lease_244_thread",
      leaseAuthorityRef: "lease_authority_clinician_message_thread",
      ownershipEpoch: 2,
      fencingToken: "fencing_token_244_thread",
      currentLineageFenceEpoch: 3,
      createdAt: "2026-04-17T09:01:00.000Z",
      initialExpectationEnvelope: createExpectationEnvelope(
        "244_thread_replay",
        "reply_blocked",
        "2026-04-17T09:01:00.000Z",
      ),
    });

    expect(created.reusedExisting).toBe(false);
    expect(replay.reusedExisting).toBe(true);
    expect(replay.bundle.messageThread.threadId).toBe(created.bundle.messageThread.threadId);
  });

  it("reuses the same MessageDispatchEnvelope for duplicate send on the same dispatch fence and thread version", async () => {
    const { service, created } = await createThread("244_dispatch");
    await service.approveDraft({
      threadRef: created.bundle.messageThread.threadId,
      approvedByRef: "approver_244_dispatch",
      approvedAt: "2026-04-17T09:02:00.000Z",
    });

    const first = await service.dispatchThread({
      threadRef: created.bundle.messageThread.threadId,
      nextState: "sent",
      dispatchEnvelope: {
        messageDispatchEnvelopeId: "message_dispatch_envelope_244_dispatch",
        threadVersionRef: `${created.bundle.messageThread.threadId}@v2`,
        draftRef: `${created.bundle.messageThread.threadId}@draft.v1`,
        approvedByRef: "approver_244_dispatch",
        deliveryPlanRef: "delivery_plan_secure_message_standard",
        routeIntentBindingRef: "route_intent_message_send_244_dispatch",
        requestLifecycleLeaseRef: "lease_244_dispatch",
        dispatchFenceEpoch: 1,
        ownershipEpochRef: 2,
        fencingToken: "fencing_token_244_dispatch",
        commandActionRecordRef: "command_action_244_dispatch",
        idempotencyRecordRef: "idempotency_record_244_dispatch",
        adapterDispatchAttemptRef: "adapter_dispatch_attempt_244_dispatch",
        adapterEffectKey: "effect_key_244_dispatch",
        latestReceiptCheckpointRef: null,
        supportMutationAttemptRef: null,
        supportActionRecordRef: null,
        repairIntent: "initial_send",
        channelTemplateRef: "secure_message_template_follow_up_v1",
        transportState: "dispatching",
        deliveryEvidenceState: "unobserved",
        currentDeliveryConfidenceRef: "delivery_confidence_unobserved",
        deliveryModelVersionRef: "message_delivery_model_244.v1",
        calibrationVersion: "message_delivery_calibration_244.v1",
        causalToken: "causal_message_send_244_dispatch",
        idempotencyKey: "idempotency_key_244_dispatch",
        createdAt: "2026-04-17T09:03:00.000Z",
      },
      expectationEnvelope: createExpectationEnvelope(
        "244_dispatch_sent",
        "reply_blocked",
        "2026-04-17T09:03:00.000Z",
      ),
      dispatchedAt: "2026-04-17T09:03:00.000Z",
    });
    const replay = await service.dispatchThread({
      threadRef: created.bundle.messageThread.threadId,
      nextState: "sent",
      dispatchEnvelope: {
        messageDispatchEnvelopeId: "message_dispatch_envelope_244_dispatch_replay",
        threadVersionRef: `${created.bundle.messageThread.threadId}@v2`,
        draftRef: `${created.bundle.messageThread.threadId}@draft.v1`,
        approvedByRef: "approver_244_dispatch",
        deliveryPlanRef: "delivery_plan_secure_message_standard",
        routeIntentBindingRef: "route_intent_message_send_244_dispatch",
        requestLifecycleLeaseRef: "lease_244_dispatch",
        dispatchFenceEpoch: 1,
        ownershipEpochRef: 2,
        fencingToken: "fencing_token_244_dispatch",
        commandActionRecordRef: "command_action_244_dispatch_replay",
        idempotencyRecordRef: "idempotency_record_244_dispatch_replay",
        adapterDispatchAttemptRef: "adapter_dispatch_attempt_244_dispatch_replay",
        adapterEffectKey: "effect_key_244_dispatch",
        latestReceiptCheckpointRef: null,
        supportMutationAttemptRef: null,
        supportActionRecordRef: null,
        repairIntent: "initial_send",
        channelTemplateRef: "secure_message_template_follow_up_v1",
        transportState: "dispatching",
        deliveryEvidenceState: "unobserved",
        currentDeliveryConfidenceRef: "delivery_confidence_unobserved",
        deliveryModelVersionRef: "message_delivery_model_244.v1",
        calibrationVersion: "message_delivery_calibration_244.v1",
        causalToken: "causal_message_send_244_dispatch_replay",
        idempotencyKey: "idempotency_key_244_dispatch_replay",
        createdAt: "2026-04-17T09:04:00.000Z",
      },
      expectationEnvelope: createExpectationEnvelope(
        "244_dispatch_sent_replay",
        "reply_blocked",
        "2026-04-17T09:04:00.000Z",
      ),
      dispatchedAt: "2026-04-17T09:04:00.000Z",
    });

    expect(first.reusedExistingEnvelope).toBe(false);
    expect(replay.reusedExistingEnvelope).toBe(true);
    expect(replay.dispatchEnvelope.messageDispatchEnvelopeId).toBe(
      first.dispatchEnvelope.messageDispatchEnvelopeId,
    );
  });

  it("keeps provider acceptance separate from delivery truth until MessageDeliveryEvidenceBundle is written", async () => {
    const { service, created } = await createThread("244_receipt");
    await service.approveDraft({
      threadRef: created.bundle.messageThread.threadId,
      approvedByRef: "approver_244_receipt",
      approvedAt: "2026-04-17T09:02:00.000Z",
    });
    const dispatched = await service.dispatchThread({
      threadRef: created.bundle.messageThread.threadId,
      nextState: "sent",
      dispatchEnvelope: {
        messageDispatchEnvelopeId: "message_dispatch_envelope_244_receipt",
        threadVersionRef: `${created.bundle.messageThread.threadId}@v2`,
        draftRef: `${created.bundle.messageThread.threadId}@draft.v1`,
        approvedByRef: "approver_244_receipt",
        deliveryPlanRef: "delivery_plan_secure_message_standard",
        routeIntentBindingRef: "route_intent_message_send_244_receipt",
        requestLifecycleLeaseRef: "lease_244_receipt",
        dispatchFenceEpoch: 1,
        ownershipEpochRef: 2,
        fencingToken: "fencing_token_244_receipt",
        commandActionRecordRef: "command_action_244_receipt",
        idempotencyRecordRef: "idempotency_record_244_receipt",
        adapterDispatchAttemptRef: "adapter_dispatch_attempt_244_receipt",
        adapterEffectKey: "effect_key_244_receipt",
        latestReceiptCheckpointRef: null,
        supportMutationAttemptRef: null,
        supportActionRecordRef: null,
        repairIntent: "initial_send",
        channelTemplateRef: "secure_message_template_follow_up_v1",
        transportState: "dispatching",
        deliveryEvidenceState: "unobserved",
        currentDeliveryConfidenceRef: "delivery_confidence_unobserved",
        deliveryModelVersionRef: "message_delivery_model_244.v1",
        calibrationVersion: "message_delivery_calibration_244.v1",
        causalToken: "causal_message_send_244_receipt",
        idempotencyKey: "idempotency_key_244_receipt",
        createdAt: "2026-04-17T09:03:00.000Z",
      },
      expectationEnvelope: createExpectationEnvelope(
        "244_receipt_sent",
        "reply_blocked",
        "2026-04-17T09:03:00.000Z",
      ),
      dispatchedAt: "2026-04-17T09:03:00.000Z",
    });
    await service.observeProviderReceipt({
      threadRef: created.bundle.messageThread.threadId,
      messageDispatchEnvelopeId: dispatched.dispatchEnvelope.messageDispatchEnvelopeId,
      receiptCheckpointRef: "receipt_checkpoint_244_receipt",
      receiptDecisionClass: "accepted",
      nextTransportState: "provider_accepted",
      observedAt: "2026-04-17T09:04:00.000Z",
    });

    const afterReceipt = await service.queryThreadBundle(created.bundle.messageThread.threadId);

    expect(afterReceipt.messageThread.state).toBe("sent");
    expect(afterReceipt.currentDispatchEnvelope?.transportState).toBe("provider_accepted");
    expect(afterReceipt.currentDeliveryEvidenceBundle).toBeNull();
    expect(afterReceipt.currentExpectationEnvelope?.patientVisibleState).toBe("reply_blocked");
  });

  it("routes the patient reply through ClinicianMessageThread first and advances the expectation envelope to awaiting_review", async () => {
    const { service, created } = await createThread("244_reply");
    await service.approveDraft({
      threadRef: created.bundle.messageThread.threadId,
      approvedByRef: "approver_244_reply",
      approvedAt: "2026-04-17T09:02:00.000Z",
    });
    const dispatched = await service.dispatchThread({
      threadRef: created.bundle.messageThread.threadId,
      nextState: "sent",
      dispatchEnvelope: {
        messageDispatchEnvelopeId: "message_dispatch_envelope_244_reply",
        threadVersionRef: `${created.bundle.messageThread.threadId}@v2`,
        draftRef: `${created.bundle.messageThread.threadId}@draft.v1`,
        approvedByRef: "approver_244_reply",
        deliveryPlanRef: "delivery_plan_secure_message_standard",
        routeIntentBindingRef: "route_intent_message_send_244_reply",
        requestLifecycleLeaseRef: "lease_244_reply",
        dispatchFenceEpoch: 1,
        ownershipEpochRef: 2,
        fencingToken: "fencing_token_244_reply",
        commandActionRecordRef: "command_action_244_reply",
        idempotencyRecordRef: "idempotency_record_244_reply",
        adapterDispatchAttemptRef: "adapter_dispatch_attempt_244_reply",
        adapterEffectKey: "effect_key_244_reply",
        latestReceiptCheckpointRef: "receipt_checkpoint_244_reply",
        supportMutationAttemptRef: null,
        supportActionRecordRef: null,
        repairIntent: "initial_send",
        channelTemplateRef: "secure_message_template_follow_up_v1",
        transportState: "provider_accepted",
        deliveryEvidenceState: "unobserved",
        currentDeliveryConfidenceRef: "delivery_confidence_unobserved",
        deliveryModelVersionRef: "message_delivery_model_244.v1",
        calibrationVersion: "message_delivery_calibration_244.v1",
        causalToken: "causal_message_send_244_reply",
        idempotencyKey: "idempotency_key_244_reply",
        createdAt: "2026-04-17T09:03:00.000Z",
      },
      expectationEnvelope: createExpectationEnvelope(
        "244_reply_sent",
        "reply_blocked",
        "2026-04-17T09:03:00.000Z",
      ),
      dispatchedAt: "2026-04-17T09:03:00.000Z",
    });
    await service.recordDeliveryEvidence({
      threadRef: created.bundle.messageThread.threadId,
      nextState: "delivered",
      evidenceBundle: {
        messageDeliveryEvidenceBundleId: "message_delivery_evidence_bundle_244_reply",
        dispatchEnvelopeRef: dispatched.dispatchEnvelope.messageDispatchEnvelopeId,
        dispatchFenceEpoch: 1,
        threadVersionRef: dispatched.dispatchEnvelope.threadVersionRef,
        receiptCheckpointRef: "receipt_checkpoint_244_reply",
        deliveryState: "delivered",
        evidenceStrength: "direct_provider_receipt",
        providerDispositionRef: "provider_delivered",
        deliveryArtifactRefs: ["artifact_delivery_244_reply"],
        reachabilityDependencyRef: null,
        supportActionSettlementRef: null,
        causalToken: "causal_delivery_244_reply",
        recordedAt: "2026-04-17T09:04:00.000Z",
      },
      expectationEnvelope: createExpectationEnvelope(
        "244_reply_delivered",
        "reply_needed",
        "2026-04-17T09:04:00.000Z",
      ),
      recordedAt: "2026-04-17T09:04:00.000Z",
    });

    const replied = await service.ingestPatientReply({
      threadRef: created.bundle.messageThread.threadId,
      nextState: "patient_replied",
      reply: {
        messagePatientReplyId: "message_patient_reply_244_reply",
        requestId: "request_244_reply",
        requestLineageRef: "lineage_244_reply",
        dispatchEnvelopeRef: dispatched.dispatchEnvelope.messageDispatchEnvelopeId,
        threadVersionRef: dispatched.dispatchEnvelope.threadVersionRef,
        replyRouteFamilyRef: "secure_message_reply",
        replyChannelRef: "app_secure_message",
        replyText: "The wheeze is worse overnight.",
        replyArtifactRefs: ["artifact_reply_244_reply"],
        providerCorrelationRef: "provider_reply_244_reply",
        secureEntryGrantRef: "grant_reply_244_reply",
        classificationHint: "potentially_clinical",
        reSafetyRequired: true,
        needsAssimilation: true,
        causalToken: "reply_causal_244_reply",
        repliedAt: "2026-04-17T09:05:00.000Z",
      },
      expectationEnvelope: createExpectationEnvelope(
        "244_reply_review",
        "awaiting_review",
        "2026-04-17T09:05:00.000Z",
      ),
      recordedAt: "2026-04-17T09:05:00.000Z",
    });

    expect(replied.reusedExisting).toBe(false);
    expect(replied.bundle.messageThread.state).toBe("patient_replied");
    expect(replied.bundle.latestReply?.needsAssimilation).toBe(true);
    expect(replied.bundle.currentExpectationEnvelope?.patientVisibleState).toBe("awaiting_review");
  });

  it("makes close and reopen legal only through ThreadResolutionGate and fresh expectation revisions", async () => {
    const { service, created } = await createThread("244_resolution");
    await service.approveDraft({
      threadRef: created.bundle.messageThread.threadId,
      approvedByRef: "approver_244_resolution",
      approvedAt: "2026-04-17T09:02:00.000Z",
    });
    const dispatched = await service.dispatchThread({
      threadRef: created.bundle.messageThread.threadId,
      nextState: "sent",
      dispatchEnvelope: {
        messageDispatchEnvelopeId: "message_dispatch_envelope_244_resolution",
        threadVersionRef: `${created.bundle.messageThread.threadId}@v2`,
        draftRef: `${created.bundle.messageThread.threadId}@draft.v1`,
        approvedByRef: "approver_244_resolution",
        deliveryPlanRef: "delivery_plan_secure_message_standard",
        routeIntentBindingRef: "route_intent_message_send_244_resolution",
        requestLifecycleLeaseRef: "lease_244_resolution",
        dispatchFenceEpoch: 1,
        ownershipEpochRef: 2,
        fencingToken: "fencing_token_244_resolution",
        commandActionRecordRef: "command_action_244_resolution",
        idempotencyRecordRef: "idempotency_record_244_resolution",
        adapterDispatchAttemptRef: "adapter_dispatch_attempt_244_resolution",
        adapterEffectKey: "effect_key_244_resolution",
        latestReceiptCheckpointRef: "receipt_checkpoint_244_resolution",
        supportMutationAttemptRef: null,
        supportActionRecordRef: null,
        repairIntent: "initial_send",
        channelTemplateRef: "secure_message_template_follow_up_v1",
        transportState: "provider_accepted",
        deliveryEvidenceState: "unobserved",
        currentDeliveryConfidenceRef: "delivery_confidence_unobserved",
        deliveryModelVersionRef: "message_delivery_model_244.v1",
        calibrationVersion: "message_delivery_calibration_244.v1",
        causalToken: "causal_message_send_244_resolution",
        idempotencyKey: "idempotency_key_244_resolution",
        createdAt: "2026-04-17T09:03:00.000Z",
      },
      expectationEnvelope: createExpectationEnvelope(
        "244_resolution_sent",
        "reply_blocked",
        "2026-04-17T09:03:00.000Z",
      ),
      dispatchedAt: "2026-04-17T09:03:00.000Z",
    });
    await service.recordDeliveryEvidence({
      threadRef: created.bundle.messageThread.threadId,
      nextState: "delivered",
      evidenceBundle: {
        messageDeliveryEvidenceBundleId: "message_delivery_evidence_bundle_244_resolution",
        dispatchEnvelopeRef: dispatched.dispatchEnvelope.messageDispatchEnvelopeId,
        dispatchFenceEpoch: 1,
        threadVersionRef: dispatched.dispatchEnvelope.threadVersionRef,
        receiptCheckpointRef: "receipt_checkpoint_244_resolution",
        deliveryState: "delivered",
        evidenceStrength: "direct_provider_receipt",
        providerDispositionRef: "provider_delivered",
        deliveryArtifactRefs: ["artifact_delivery_244_resolution"],
        reachabilityDependencyRef: null,
        supportActionSettlementRef: null,
        causalToken: "causal_delivery_244_resolution",
        recordedAt: "2026-04-17T09:04:00.000Z",
      },
      expectationEnvelope: createExpectationEnvelope(
        "244_resolution_delivered",
        "reply_needed",
        "2026-04-17T09:04:00.000Z",
      ),
      recordedAt: "2026-04-17T09:04:00.000Z",
    });
    const closed = await service.settleResolutionGate({
      threadRef: created.bundle.messageThread.threadId,
      nextState: "closed",
      resolutionGate: {
        threadResolutionGateId: "thread_resolution_gate_244_resolution",
        latestDispatchRef: dispatched.dispatchEnvelope.messageDispatchEnvelopeId,
        latestReplyRef: null,
        latestExpectationEnvelopeRef: "thread_expectation_envelope_244_resolution_delivered",
        latestSupportActionSettlementRef: null,
        decision: "close",
        decisionReasonRef: "THREAD_244_CLOSE",
        sameShellRecoveryRef: null,
        requiresLifecycleReview: false,
        causalToken: "causal_resolution_244_resolution_close",
        decidedAt: "2026-04-17T09:05:00.000Z",
      },
      expectationEnvelope: createExpectationEnvelope(
        "244_resolution_closed",
        "closed",
        "2026-04-17T09:05:00.000Z",
      ),
      recordedAt: "2026-04-17T09:05:00.000Z",
    });
    const reopened = await service.reopenThread({
      threadRef: created.bundle.messageThread.threadId,
      nextState: "reopened",
      requestLifecycleLeaseRef: "lease_244_resolution_reopened",
      leaseAuthorityRef: "lease_authority_clinician_message_thread",
      ownershipEpoch: 3,
      fencingToken: "fencing_token_244_resolution_reopened",
      currentLineageFenceEpoch: 4,
      expectationEnvelope: createExpectationEnvelope(
        "244_resolution_reopened",
        "awaiting_review",
        "2026-04-17T09:06:00.000Z",
      ),
      reopenedAt: "2026-04-17T09:06:00.000Z",
    });

    expect(closed.currentResolutionGate?.decision).toBe("close");
    expect(closed.messageThread.state).toBe("closed");
    expect(closed.messageThread.closedAt).toBe("2026-04-17T09:05:00.000Z");
    expect(reopened.messageThread.state).toBe("reopened");
    expect(reopened.messageThread.closedAt).toBeNull();
    expect(reopened.currentExpectationEnvelope?.patientVisibleState).toBe("awaiting_review");
    expect(reopened.messageThread.requestLifecycleLeaseRef).toBe("lease_244_resolution_reopened");
  });
});
