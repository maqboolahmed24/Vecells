import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3ConversationControlService,
  createPhase3ConversationControlStore,
  type ConversationAuthoritativeOutcomeState,
  type ConversationContinuityValidationState,
  type ConversationDeliveryRiskState,
  type ConversationTupleAvailabilityState,
} from "../src/index.ts";

function createHarness(seed: string) {
  const repositories = createPhase3ConversationControlStore();
  const service = createPhase3ConversationControlService(repositories, {
    idGenerator: createDeterministicBackboneIdGenerator(`phase3_conversation_control_${seed}`),
  });
  return { repositories, service };
}

function tupleSnapshot(
  seed: string,
  overrides: Partial<{
    tupleAvailabilityState: ConversationTupleAvailabilityState;
    continuityValidationState: ConversationContinuityValidationState;
    deliveryRiskState: ConversationDeliveryRiskState;
    authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
    messageExpectationState:
      | "reply_needed"
      | "awaiting_review"
      | "reviewed"
      | "reply_blocked"
      | "delivery_repair_required"
      | "closed"
      | null;
    previewMode: "full" | "public_safe_summary" | "step_up_required" | "suppressed_recovery_only";
    contactRepairJourneyRef: string | null;
    unreadCount: number;
  }> = {},
) {
  return {
    tupleId: `conversation_tuple_${seed}`,
    taskId: `task_${seed}`,
    clusterRef: `cluster_${seed}`,
    threadId: `thread_${seed}`,
    subthreadRef: `subthread_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
    typedSubthreadRefs: [`subthread_${seed}`],
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
    callbackVisibleState: "scheduled" as const,
    callbackWindowRiskState: "on_track" as const,
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
    computedAt: "2026-04-17T12:00:00.000Z",
    version: 1,
  };
}

describe("phase 3 conversation control kernel", () => {
  it("derives reply-needed digest posture only from the canonical tuple and not from draft presence", async () => {
    const { service } = createHarness("246_digest");
    await service.saveTupleCompatibility(tupleSnapshot("246_digest"));

    const digest = await service.recomputeDigest(
      "cluster_246_digest",
      "2026-04-17T12:05:00.000Z",
    );

    expect(digest.replyNeededState).toBe("reply_needed");
    expect(digest.awaitingReviewState).toBe("none");
    expect(digest.repairRequiredState).toBe("none");
    expect(digest.authoritativeOutcomeState).toBe("awaiting_reply");
    expect(digest.unreadCount).toBe(2);
  });

  it("fails closed into recovery posture whenever tuple availability or continuity is not calm", async () => {
    for (const tupleAvailabilityState of ["placeholder", "missing"] as const) {
      const { service } = createHarness(`246_guard_${tupleAvailabilityState}`);
      await service.saveTupleCompatibility(
        tupleSnapshot(`246_guard_${tupleAvailabilityState}`, {
          tupleAvailabilityState,
        }),
      );
      const digest = await service.recomputeDigest(
        `cluster_246_guard_${tupleAvailabilityState}`,
        "2026-04-17T12:05:00.000Z",
      );
      expect(digest.authoritativeOutcomeState).toBe("recovery_required");
      expect(digest.stateConfidenceBand).toBe("low");
    }

    for (const continuityValidationState of ["stale", "blocked"] as const) {
      const { service } = createHarness(`246_continuity_${continuityValidationState}`);
      await service.saveTupleCompatibility(
        tupleSnapshot(`246_continuity_${continuityValidationState}`, {
          continuityValidationState,
          authoritativeOutcomeState: "settled",
        }),
      );
      const digest = await service.recomputeDigest(
        `cluster_246_continuity_${continuityValidationState}`,
        "2026-04-17T12:05:00.000Z",
      );
      expect(digest.authoritativeOutcomeState).toBe("recovery_required");
      expect(digest.replyNeededState).toBe("read_only");
    }
  });

  it("reuses one live composer lease for the same cluster and preserves the original draft and anchor", async () => {
    const { service } = createHarness("246_composer");
    await service.saveTupleCompatibility(tupleSnapshot("246_composer"));

    const first = await service.acquireComposerLease({
      taskId: "task_246_composer",
      clusterRef: "cluster_246_composer",
      composerScope: "reply",
      lineageFenceEpoch: 8,
      selectedAnchorRef: "anchor_original",
      draftRef: "draft_original",
      recordedAt: "2026-04-17T12:10:00.000Z",
    });
    const replay = await service.acquireComposerLease({
      taskId: "task_246_composer",
      clusterRef: "cluster_246_composer",
      composerScope: "acknowledgement",
      lineageFenceEpoch: 8,
      selectedAnchorRef: "anchor_new",
      draftRef: "draft_new",
      recordedAt: "2026-04-17T12:11:00.000Z",
    });

    expect(first.lease.leaseState).toBe("active");
    expect(replay.reusedExisting).toBe(true);
    expect(replay.lease.leaseId).toBe(first.lease.leaseId);
    expect(replay.lease.selectedAnchorRef).toBe("anchor_original");
    expect(replay.lease.draftRef).toBe("draft_original");
  });

  it("freezes the active composer in place when urgent diversion becomes current", async () => {
    const { service } = createHarness("246_urgent");
    await service.saveTupleCompatibility(tupleSnapshot("246_urgent"));
    const acquired = await service.acquireComposerLease({
      taskId: "task_246_urgent",
      clusterRef: "cluster_246_urgent",
      composerScope: "reply",
      lineageFenceEpoch: 3,
      selectedAnchorRef: "anchor_urgent",
      draftRef: "draft_urgent",
      recordedAt: "2026-04-17T12:10:00.000Z",
    });

    await service.recomputeUrgentDiversion({
      clusterRef: "cluster_246_urgent",
      currentEvidenceAssimilationRef: "assimilation_urgent",
      currentMaterialDeltaAssessmentRef: "material_delta_urgent",
      currentEvidenceClassificationRef: "classification_urgent",
      currentSafetyPreemptionRef: "preemption_urgent",
      currentSafetyDecisionRef: "safety_decision_urgent",
      currentUrgentDiversionSettlementRef: "urgent_settlement_urgent",
      safetyDecisionEpoch: 11,
      triggerReasonCode: "ASYNC_UNSAFE",
      severityBand: "urgent",
      surfaceState: "urgent_required",
      diversionGuidanceRef: "call_111",
      reentryRuleRef: "urgent_reentry_after_clinician_clearance",
      recordedAt: "2026-04-17T12:12:00.000Z",
    });

    const bundle = await service.queryCluster("cluster_246_urgent");

    expect(acquired.lease.draftRef).toBe("draft_urgent");
    expect(bundle?.activeComposerLease?.selectedAnchorRef).toBe("anchor_urgent");
    expect(bundle?.activeComposerLease?.draftRef).toBe("draft_urgent");
    expect(bundle?.activeComposerLease?.leaseState).toBe("blocked");
    expect(bundle?.urgentDiversion?.asyncMessagingAllowedState).toBe("blocked");
  });

  it("deduplicates settlements on the same command settlement ref and issues recovery continuation for review and repair results", async () => {
    const { service } = createHarness("246_settlement");
    await service.saveTupleCompatibility(tupleSnapshot("246_settlement"));

    const first = await service.recordSettlement({
      taskId: "task_246_settlement",
      clusterRef: "cluster_246_settlement",
      actionRecordRef: "command_action_246_settlement",
      commandSettlementRef: "command_settlement_246_settlement",
      actionScope: "message_reply",
      governingObjectRef: "thread_246_settlement",
      routeIntentBindingRef: "route_intent_246_settlement",
      causalToken: "causal_246_settlement",
      result: "review_pending",
      localAckState: "shown",
      transportState: "local_only",
      externalObservationState: "unobserved",
      authoritativeOutcomeState: "awaiting_review",
      recordedAt: "2026-04-17T12:15:00.000Z",
    });
    const replay = await service.recordSettlement({
      taskId: "task_246_settlement",
      clusterRef: "cluster_246_settlement",
      actionRecordRef: "command_action_246_settlement_replay",
      commandSettlementRef: "command_settlement_246_settlement",
      actionScope: "message_reply",
      governingObjectRef: "thread_246_settlement",
      routeIntentBindingRef: "route_intent_246_settlement",
      causalToken: "causal_246_settlement_replay",
      result: "repair_required",
      localAckState: "shown",
      transportState: "local_only",
      externalObservationState: "failed",
      authoritativeOutcomeState: "recovery_required",
      recordedAt: "2026-04-17T12:16:00.000Z",
    });

    expect(first.reusedExisting).toBe(false);
    expect(first.recoveryContinuation?.clusterRef).toBe("cluster_246_settlement");
    expect(replay.reusedExisting).toBe(true);
    expect(replay.settlement.conversationSettlementId).toBe(
      first.settlement.conversationSettlementId,
    );
    expect(replay.settlement.result).toBe("review_pending");
  });
});
