import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_CONVERSATION_CONTROL_QUERY_SURFACES,
  PHASE3_CONVERSATION_CONTROL_SCHEMA_VERSION,
  PHASE3_CONVERSATION_CONTROL_SERVICE_NAME,
  createPhase3ConversationControlApplication,
  phase3ConversationControlRoutes,
} from "../src/phase3-conversation-control.ts";

function tupleSnapshot(seed, overrides = {}) {
  return {
    tupleId: `conversation_tuple_${seed}`,
    taskId: overrides.taskId ?? `task_${seed}`,
    clusterRef: `cluster_${seed}`,
    threadId: overrides.threadId ?? `thread_${seed}`,
    subthreadRef: overrides.subthreadRef ?? `subthread_${seed}`,
    selectedAnchorRef: overrides.selectedAnchorRef ?? `anchor_${seed}`,
    typedSubthreadRefs: [overrides.subthreadRef ?? `subthread_${seed}`],
    latestCommunicationEnvelopeRef: `communication_envelope_${seed}`,
    latestReminderPlanRef: `reminder_plan_${seed}`,
    latestReceiptEnvelopeRef: `receipt_${seed}`,
    latestSettlementRef: `settlement_${seed}`,
    latestCallbackStatusRef: `callback_status_${seed}`,
    latestSupportActionSettlementRef: `support_settlement_${seed}`,
    patientShellConsistencyRef: `shell_consistency_${seed}`,
    visibilityProjectionRef: `visibility_${seed}`,
    visibilityTier: "authenticated",
    previewMode: overrides.previewMode ?? "full",
    releaseState: "live",
    routeIntentBindingRef: `route_intent_${seed}`,
    requiredReleaseApprovalFreezeRef: null,
    channelReleaseFreezeState: "permitted",
    requiredAssuranceSliceTrustRefs: [`assurance_${seed}`],
    embeddedSessionRef: null,
    reachabilityDependencyRef: `reachability_dependency_${seed}`,
    reachabilityAssessmentRef: `reachability_assessment_${seed}`,
    reachabilityEpoch: 4,
    contactRepairJourneyRef: overrides.contactRepairJourneyRef ?? null,
    messageExpectationState: overrides.messageExpectationState ?? "reply_needed",
    callbackVisibleState: "scheduled",
    callbackWindowRiskState: "on_track",
    unreadCount: overrides.unreadCount ?? 2,
    deliveryRiskState: overrides.deliveryRiskState ?? "on_track",
    authoritativeOutcomeState: overrides.authoritativeOutcomeState ?? "awaiting_reply",
    dominantNextActionRef: `dominant_action_${seed}`,
    placeholderContractRef: `placeholder_${seed}`,
    experienceContinuityEvidenceRef: `continuity_${seed}`,
    continuityValidationState: overrides.continuityValidationState ?? "trusted",
    receiptGrammarVersionRef: "receipt_grammar_v1",
    threadTupleHash: `thread_tuple_hash_${seed}`,
    monotoneRevision: 5,
    tupleAvailabilityState: overrides.tupleAvailabilityState ?? "authoritative",
    computedAt: "2026-04-17T13:00:00.000Z",
    version: 1,
  };
}

async function seedActiveReviewTask(app, seed) {
  const taskId = `task_${seed}`;
  await app.triageApplication.createTask({
    taskId,
    requestId: `request_${seed}`,
    queueKey: "repair",
    sourceQueueRankSnapshotRef: `queue_rank_snapshot_${seed}`,
    returnAnchorRef: `queue_row_${seed}`,
    returnAnchorTupleHash: `return_anchor_tuple_hash_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
    selectedAnchorTupleHash: `anchor_tuple_hash_${seed}`,
    workspaceTrustEnvelopeRef: `workspace_trust_envelope_${seed}`,
    surfaceRouteContractRef: `surface_route_contract_${seed}`,
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    taskCompletionSettlementEnvelopeRef: `task_completion_${seed}`,
    createdAt: "2026-04-17T13:00:00.000Z",
    episodeId: `episode_${seed}`,
    requestLineageRef: `request_lineage_${seed}`,
  });
  await app.triageApplication.moveTaskToQueue({
    taskId,
    actorRef: `reviewer_${seed}`,
    queuedAt: "2026-04-17T13:01:00.000Z",
  });
  await app.triageApplication.claimTask({
    taskId,
    actorRef: `reviewer_${seed}`,
    claimedAt: "2026-04-17T13:02:00.000Z",
    ownerSessionRef: `owner_session_${seed}`,
  });
  await app.triageApplication.enterReview({
    taskId,
    actorRef: `reviewer_${seed}`,
    openedAt: "2026-04-17T13:03:00.000Z",
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_trust_${seed}`,
    audienceSurfaceRuntimeBindingRef: `audience_surface_runtime_binding_${seed}`,
    reviewActionLeaseRef: `review_action_lease_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
    selectedAnchorTupleHashRef: `anchor_tuple_hash_${seed}`,
  });
  return {
    taskId,
    reviewActionLeaseRef: `review_action_lease_${seed}`,
  };
}

describe("Phase 3 conversation digest and settlement control", () => {
  it("publishes the 246 conversation-control routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);
    for (const routeId of [
      "workspace_task_conversation_control_current",
      "patient_portal_conversation_control_current",
      "internal_conversation_tuple_publish",
      "patient_portal_conversation_acquire_composer",
      "patient_portal_conversation_release_composer",
      "internal_conversation_urgent_diversion_recompute",
      "internal_message_conversation_settlement_record",
      "internal_callback_conversation_settlement_record",
    ]) {
      expect(routeIds).toContain(routeId);
    }

    expect(PHASE3_CONVERSATION_CONTROL_SERVICE_NAME).toBe(
      "Phase3ConversationDigestSettlementApplication",
    );
    expect(PHASE3_CONVERSATION_CONTROL_SCHEMA_VERSION).toBe(
      "246.phase3.conversation-digest-settlement.v1",
    );
    expect(phase3ConversationControlRoutes).toHaveLength(8);
    expect(PHASE3_CONVERSATION_CONTROL_QUERY_SURFACES).toContain(
      "GET /v1/workspace/tasks/{taskId}/conversation-control",
    );
  });

  it("derives one canonical digest, keeps one live composer, and freezes it in place under urgent diversion", async () => {
    const app = createPhase3ConversationControlApplication();
    await app.publishConversationTuple(tupleSnapshot("246_cluster"));

    const firstLease = await app.acquireComposerLease({
      taskId: "task_246_cluster",
      clusterRef: "cluster_246_cluster",
      composerScope: "reply",
      lineageFenceEpoch: 7,
      selectedAnchorRef: "anchor_original",
      draftRef: "draft_original",
      recordedAt: "2026-04-17T13:05:00.000Z",
    });
    const replayLease = await app.acquireComposerLease({
      taskId: "task_246_cluster",
      clusterRef: "cluster_246_cluster",
      composerScope: "acknowledgement",
      lineageFenceEpoch: 7,
      selectedAnchorRef: "anchor_new",
      draftRef: "draft_new",
      recordedAt: "2026-04-17T13:06:00.000Z",
    });

    expect(firstLease.lease.leaseState).toBe("active");
    expect(replayLease.reusedExisting).toBe(true);
    expect(replayLease.lease.leaseId).toBe(firstLease.lease.leaseId);
    expect(replayLease.lease.selectedAnchorRef).toBe("anchor_original");
    expect(replayLease.lease.draftRef).toBe("draft_original");

    const frozen = await app.recomputeUrgentDiversion({
      clusterRef: "cluster_246_cluster",
      currentEvidenceAssimilationRef: "assimilation_246_cluster",
      currentMaterialDeltaAssessmentRef: "material_delta_246_cluster",
      currentEvidenceClassificationRef: "classification_246_cluster",
      currentSafetyPreemptionRef: "preemption_246_cluster",
      currentSafetyDecisionRef: "safety_decision_246_cluster",
      currentUrgentDiversionSettlementRef: "urgent_settlement_246_cluster",
      safetyDecisionEpoch: 12,
      triggerReasonCode: "ASYNC_UNSAFE",
      severityBand: "urgent",
      surfaceState: "urgent_required",
      diversionGuidanceRef: "call_111_now",
      reentryRuleRef: "urgent_reentry_after_clinician_clearance",
      recordedAt: "2026-04-17T13:07:00.000Z",
    });

    expect(frozen.digest.authoritativeOutcomeState).toBe("recovery_required");
    expect(frozen.activeComposerLease?.leaseState).toBe("blocked");
    expect(frozen.activeComposerLease?.selectedAnchorRef).toBe("anchor_original");
    expect(frozen.urgentDiversion?.asyncMessagingAllowedState).toBe("blocked");
  });

  it("deduplicates message-settlement replay while preserving the shared receipt grammar ladder", async () => {
    const app = createPhase3ConversationControlApplication();
    await app.publishConversationTuple(tupleSnapshot("246_message"));

    const first = await app.recordMessageMutationSettlement({
      taskId: "task_246_message",
      clusterRef: "cluster_246_message",
      threadId: "thread_246_message",
      actorKind: "patient",
      actionRecordRef: "message_action_246_message",
      commandSettlementRef: "message_command_settlement_246_message",
      actionScope: "patient_message_reply",
      routeIntentBindingRef: "route_intent_246_message",
      causalToken: "causal_246_message",
      result: "review_pending",
      localAckState: "shown",
      transportState: "provider_accepted",
      externalObservationState: "unobserved",
      authoritativeOutcomeState: "awaiting_review",
      latestCommunicationEnvelopeRef: "message_envelope_246_message",
      latestReceiptEnvelopeRef: "message_receipt_246_message",
      recordedAt: "2026-04-17T13:08:00.000Z",
    });
    const replay = await app.recordMessageMutationSettlement({
      taskId: "task_246_message",
      clusterRef: "cluster_246_message",
      threadId: "thread_246_message",
      actorKind: "patient",
      actionRecordRef: "message_action_246_message_replay",
      commandSettlementRef: "message_command_settlement_246_message",
      actionScope: "patient_message_reply",
      routeIntentBindingRef: "route_intent_246_message",
      causalToken: "causal_246_message_replay",
      result: "accepted_in_place",
      localAckState: "shown",
      transportState: "provider_accepted",
      externalObservationState: "delivered",
      authoritativeOutcomeState: "settled",
      recordedAt: "2026-04-17T13:09:00.000Z",
    });

    expect(first.reusedExisting).toBe(false);
    expect(first.settlement.localAckState).toBe("shown");
    expect(first.settlement.transportState).toBe("provider_accepted");
    expect(first.settlement.externalObservationState).toBe("unobserved");
    expect(first.settlement.authoritativeOutcomeState).toBe("awaiting_review");
    expect(first.recoveryContinuation?.clusterRef).toBe("cluster_246_message");
    expect(replay.reusedExisting).toBe(true);
    expect(replay.settlement.conversationSettlementId).toBe(
      first.settlement.conversationSettlementId,
    );
    expect(replay.settlement.result).toBe("review_pending");
  });

  it("fails closed on stale tuple calmness and returns recovery-only callback settlement posture", async () => {
    const app = createPhase3ConversationControlApplication();
    await app.publishConversationTuple(
      tupleSnapshot("246_callback", {
        continuityValidationState: "stale",
        authoritativeOutcomeState: "settled",
      }),
    );

    const settlement = await app.recordCallbackMutationSettlement({
      taskId: "task_246_callback",
      clusterRef: "cluster_246_callback",
      callbackCaseId: "callback_case_246_callback",
      actorKind: "patient",
      actionRecordRef: "callback_action_246_callback",
      commandSettlementRef: "callback_command_settlement_246_callback",
      actionScope: "patient_callback_confirm",
      routeIntentBindingRef: "route_intent_246_callback",
      causalToken: "causal_246_callback",
      result: "accepted_in_place",
      localAckState: "shown",
      transportState: "provider_accepted",
      externalObservationState: "answered",
      authoritativeOutcomeState: "settled",
      latestCallbackStatusRef: "callback_status_246_callback_v2",
      recordedAt: "2026-04-17T13:10:00.000Z",
    });

    expect(settlement.settlement.result).toBe("stale_recoverable");
    expect(settlement.settlement.authoritativeOutcomeState).toBe("recovery_required");
    expect(settlement.recoveryContinuation?.sameShellRecoveryRef).toContain(
      "/patient/messages/cluster_246_callback/recover",
    );
    expect(settlement.cluster.digest.replyNeededState).toBe("read_only");
  });

  it("requires the current staff review lease and live protected composition for guarded staff mutations", async () => {
    const app = createPhase3ConversationControlApplication();
    const seeded = await seedActiveReviewTask(app, "246_staff");
    await app.publishConversationTuple(
      tupleSnapshot("246_staff", {
        taskId: seeded.taskId,
      }),
    );

    await expect(
      app.recordMessageMutationSettlement({
        taskId: seeded.taskId,
        clusterRef: "cluster_246_staff",
        threadId: "thread_246_staff",
        actorKind: "staff",
        actionRecordRef: "staff_message_action_missing_lease",
        commandSettlementRef: "staff_message_command_missing_lease",
        actionScope: "staff_message_send",
        routeIntentBindingRef: "route_intent_246_staff",
        causalToken: "causal_246_staff_missing",
        result: "accepted_in_place",
        localAckState: "shown",
        transportState: "provider_accepted",
        externalObservationState: "unobserved",
        authoritativeOutcomeState: "awaiting_delivery_truth",
        recordedAt: "2026-04-17T13:11:00.000Z",
      }),
    ).rejects.toThrow(/ReviewActionLease/);

    await expect(
      app.recordMessageMutationSettlement({
        taskId: seeded.taskId,
        clusterRef: "cluster_246_staff",
        threadId: "thread_246_staff",
        actorKind: "staff",
        actionRecordRef: "staff_message_action_missing_focus",
        commandSettlementRef: "staff_message_command_missing_focus",
        actionScope: "staff_delivery_dispute_settle",
        routeIntentBindingRef: "route_intent_246_staff",
        causalToken: "causal_246_staff_focus",
        result: "accepted_in_place",
        localAckState: "shown",
        transportState: "provider_accepted",
        externalObservationState: "disputed",
        authoritativeOutcomeState: "awaiting_review",
        recordedAt: "2026-04-17T13:12:00.000Z",
        staffGuards: {
          reviewActionLeaseRef: seeded.reviewActionLeaseRef,
          protectedCompositionMode: "delivery_dispute_review",
          forceProtectedContext: true,
        },
      }),
    ).rejects.toThrow(/WorkspaceFocusProtectionLease/);

    const accepted = await app.recordMessageMutationSettlement({
      taskId: seeded.taskId,
      clusterRef: "cluster_246_staff",
      threadId: "thread_246_staff",
      actorKind: "staff",
      actionRecordRef: "staff_message_action_live",
      commandSettlementRef: "staff_message_command_live",
      actionScope: "staff_delivery_dispute_settle",
      routeIntentBindingRef: "route_intent_246_staff",
      causalToken: "causal_246_staff_live",
      result: "review_pending",
      localAckState: "shown",
      transportState: "provider_accepted",
      externalObservationState: "disputed",
      authoritativeOutcomeState: "awaiting_review",
      recordedAt: "2026-04-17T13:13:00.000Z",
      staffGuards: {
        reviewActionLeaseRef: seeded.reviewActionLeaseRef,
        focusProtectionLeaseRef: "focus_protection_246_staff",
        focusProtectionLeaseState: "active",
        protectedCompositionStateRef: "protected_composition_state_246_staff",
        protectedCompositionMode: "delivery_dispute_review",
        protectedCompositionValidityState: "live",
        invalidatingDriftState: "none",
        forceProtectedContext: true,
      },
    });

    expect(accepted.settlement.result).toBe("review_pending");
    expect(accepted.cluster.latestSettlement?.commandSettlementRef).toBe(
      "staff_message_command_live",
    );
  });
});
