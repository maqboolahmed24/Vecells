import { describe, expect, it } from "vitest";
import {
  createPhase3PatientConversationTupleService,
  PHASE3_PATIENT_CONVERSATION_TUPLE_SCHEMA_VERSION,
} from "../src/phase3-patient-conversation-tuple";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    taskId: "task_247_a",
    requestId: "request_247_a",
    requestLineageRef: "request_lineage_247_a",
    episodeRef: "episode_247_a",
    audienceTier: "patient_authenticated",
    trustPosture: "trusted",
    selectedAnchorRef: "anchor_247_latest_reply",
    patientShellConsistencyRef: "patient_shell_consistency_247_a",
    routeIntentBindingRef: "route_intent_247_a",
    experienceContinuityEvidenceRef: "continuity_247_a",
    latestCallbackStatusRef: "callback_expectation_247_a",
    latestSupportActionSettlementRef: "support_action_settlement_247_a",
    reachabilityDependencyRef: "reachability_dependency_247_a",
    reachabilityAssessmentRef: "reachability_assessment_247_a",
    reachabilityEpoch: 4,
    contactRepairJourneyRef: null,
    requiredReleaseApprovalFreezeRef: null,
    channelReleaseFreezeState: "permitted",
    requiredAssuranceSliceTrustRefs: [],
    legacyBackfillState: "none",
    continuityDriftReasonRefs: [],
    computedAt: "2026-04-17T16:00:00.000Z",
    rows: [
      {
        rowRef: "message_dispatch_247_a",
        sourceDomain: "clinician_message_thread",
        sourceRef: "thread_247_a",
        communicationKind: "clinician_message",
        subthreadRef: "secure_message_247_a",
        subthreadType: "secure_message",
        ownerRef: "clinician_247",
        replyTargetRef: "thread_247_a",
        replyWindowRef: "reply_window_247_a",
        workflowMeaningRef: "clinician_follow_up",
        replyCapabilityState: "reply_allowed",
        authoredBy: "clinician",
        patientSafeSummary: "The clinician asked for a clearer photo and current symptoms.",
        publicSafeSummary: "A clinician message is available.",
        visibleSnippetRef: "snippet_247_message_safe",
        sentAt: "2026-04-17T12:00:00.000Z",
        sortAt: "2026-04-17T12:00:00.000Z",
        localAckState: "none",
        transportAckState: "accepted",
        deliveryEvidenceState: "delivered",
        deliveryRiskState: "on_track",
        authoritativeOutcomeState: "awaiting_reply",
        settlementRef: "conversation_settlement_247_message",
        rowRevision: 2,
      },
      {
        rowRef: "patient_reply_247_a",
        sourceDomain: "clinician_message_thread",
        sourceRef: "message_reply_247_a",
        communicationKind: "patient_message_reply",
        subthreadRef: "secure_message_247_a",
        subthreadType: "secure_message",
        ownerRef: "patient_247",
        replyTargetRef: "thread_247_a",
        replyWindowRef: "reply_window_247_a",
        workflowMeaningRef: "patient_reply",
        replyCapabilityState: "read_only",
        authoredBy: "patient",
        patientSafeSummary: "You sent a clearer photo and symptom update.",
        publicSafeSummary: "A reply was sent.",
        visibleSnippetRef: "snippet_247_reply_safe",
        sentAt: "2026-04-17T12:30:00.000Z",
        sortAt: "2026-04-17T12:30:00.000Z",
        localAckState: "shown",
        transportAckState: "accepted",
        deliveryEvidenceState: "pending",
        deliveryRiskState: "at_risk",
        authoritativeOutcomeState: "awaiting_review",
        settlementRef: "conversation_settlement_247_reply",
        rowRevision: 3,
      },
      {
        rowRef: "callback_expectation_247_a",
        sourceDomain: "callback_case",
        sourceRef: "callback_case_247_a",
        communicationKind: "callback_update",
        subthreadRef: "callback_247_a",
        subthreadType: "callback",
        ownerRef: "practice_247",
        replyTargetRef: "callback_case_247_a",
        replyWindowRef: "callback_window_247_a",
        workflowMeaningRef: "callback_expectation",
        replyCapabilityState: "reply_allowed",
        authoredBy: "practice",
        patientSafeSummary: "A callback is booked for this afternoon.",
        publicSafeSummary: "A callback update is available.",
        visibleSnippetRef: "snippet_247_callback_safe",
        sentAt: "2026-04-17T13:00:00.000Z",
        sortAt: "2026-04-17T13:00:00.000Z",
        localAckState: "none",
        transportAckState: "accepted",
        deliveryEvidenceState: "pending",
        deliveryRiskState: "on_track",
        authoritativeOutcomeState: "callback_scheduled",
        callbackVisibleState: "scheduled",
        callbackWindowRiskState: "on_track",
        rowRevision: 4,
      },
      {
        rowRef: "more_info_reminder_247_a",
        sourceDomain: "more_info_cycle",
        sourceRef: "cycle_247_a",
        communicationKind: "reminder",
        subthreadRef: "more_info_247_a",
        subthreadType: "more_info",
        ownerRef: "system_247",
        replyTargetRef: "cycle_247_a",
        replyWindowRef: "more_info_reply_window_247_a",
        workflowMeaningRef: "more_info_reminder",
        replyCapabilityState: "reply_allowed",
        authoredBy: "system",
        patientSafeSummary: "Reminder sent for the requested more-info response.",
        publicSafeSummary: "A reminder update is available.",
        sentAt: "2026-04-17T13:30:00.000Z",
        sortAt: "2026-04-17T13:30:00.000Z",
        localAckState: "none",
        transportAckState: "accepted",
        deliveryEvidenceState: "delivered",
        deliveryRiskState: "on_track",
        authoritativeOutcomeState: "awaiting_reply",
        reminderPlanRef: "reminder_schedule_247_a",
        rowRevision: 1,
      },
    ],
    ...overrides,
  };
}

describe("phase3 patient conversation tuple materializer", () => {
  it("groups callback, message, and more-info rows into one request-centered cluster with typed subthreads", () => {
    const service = createPhase3PatientConversationTupleService();
    const result = service.materializeConversation(baseInput());

    expect(result.schemaVersion).toBe(PHASE3_PATIENT_CONVERSATION_TUPLE_SCHEMA_VERSION);
    expect(result.cluster.clusterRef).toBe("patient_conversation_cluster_request_lineage_247_a");
    expect(result.thread.threadId).toBe("patient_conversation_thread_request_lineage_247_a");
    expect(result.subthreads).toHaveLength(3);
    expect(result.subthreads.map((subthread) => subthread.subthreadType)).toEqual([
      "more_info",
      "callback",
      "secure_message",
    ]);
    expect(result.communicationEnvelopes.map((row) => row.communicationKind)).toEqual([
      "clinician_message",
      "patient_message_reply",
      "callback_update",
      "reminder",
    ]);
    expect(result.thread.communicationEnvelopeRefs).toHaveLength(4);
    expect(result.cluster.previewMode).toBe("authenticated_summary");
    expect(result.tupleCompatibility.previewMode).toBe("full");
  });

  it("keeps receipt causality explicit instead of collapsing local acknowledgement, transport, and final outcome", () => {
    const service = createPhase3PatientConversationTupleService();
    const result = service.materializeConversation(baseInput());

    const patientReplyReceipt = result.receiptEnvelopes.find((receipt) =>
      receipt.sourceEnvelopeRef.includes("patient_reply_247_a"),
    );
    expect(patientReplyReceipt?.localAckState).toBe("shown");
    expect(patientReplyReceipt?.transportAckState).toBe("accepted");
    expect(patientReplyReceipt?.deliveryEvidenceState).toBe("pending");
    expect(patientReplyReceipt?.authoritativeOutcomeState).toBe("awaiting_review");
    expect(patientReplyReceipt?.summaryRef).toContain("queued for review");
    expect(result.tupleCompatibility.authoritativeOutcomeState).toBe("awaiting_review");
    expect(result.tupleCompatibility.deliveryRiskState).toBe("at_risk");
  });

  it("projects public-safe, step-up, and suppressed modes explicitly without hiding the cluster", () => {
    const service = createPhase3PatientConversationTupleService();

    const publicResult = service.materializeConversation(
      baseInput({
        audienceTier: "patient_public",
      }),
    );
    const stepUpResult = service.materializeConversation(
      baseInput({
        requiredAssuranceSliceTrustRefs: ["assurance_step_up_required"],
      }),
    );
    const suppressedResult = service.materializeConversation(
      baseInput({
        trustPosture: "repair_hold",
      }),
    );

    expect(publicResult.visibilityProjection.previewMode).toBe("public_safe_summary");
    expect(publicResult.cluster.clusterRef).toBeTruthy();
    expect(stepUpResult.visibilityProjection.previewMode).toBe("step_up_required");
    expect(stepUpResult.visibilityProjection.visibilityTier).toBe("placeholder_only");
    expect(suppressedResult.visibilityProjection.previewMode).toBe("suppressed_recovery_only");
    expect(suppressedResult.tupleCompatibility.continuityValidationState).toBe("blocked");
    expect(suppressedResult.thread.surfaceState).toBe("recovery_only");
  });

  it("degrades stale lineage or legacy backfill into placeholder and recovery posture instead of calming the thread", () => {
    const service = createPhase3PatientConversationTupleService();
    const result = service.materializeConversation(
      baseInput({
        legacyBackfillState: "placeholder_required",
        continuityDriftReasonRefs: ["request_lineage_tuple_drift"],
        rows: [
          {
            rowRef: "legacy_message_247_a",
            sourceDomain: "legacy_backfill",
            sourceRef: "legacy_thread_247_a",
            communicationKind: "legacy_placeholder",
            subthreadRef: "legacy_recovery_247_a",
            subthreadType: "legacy_recovery",
            ownerRef: null,
            replyTargetRef: null,
            replyWindowRef: null,
            workflowMeaningRef: "legacy_backfill_recovery",
            replyCapabilityState: "repair_required",
            authoredBy: "legacy",
            patientSafeSummary:
              "Historic communication is being reconciled before it can be shown in full.",
            publicSafeSummary: "Historic communication is being reconciled.",
            sentAt: "2026-04-17T09:00:00.000Z",
            sortAt: "2026-04-17T09:00:00.000Z",
            localAckState: "none",
            transportAckState: "not_started",
            deliveryEvidenceState: "not_applicable",
            deliveryRiskState: "likely_failed",
            authoritativeOutcomeState: "recovery_required",
            rowRevision: 1,
          },
        ],
      }),
    );

    expect(result.tupleCompatibility.tupleAvailabilityState).toBe("placeholder");
    expect(result.tupleCompatibility.continuityValidationState).toBe("stale");
    expect(result.cluster.tupleAvailabilityState).toBe("placeholder");
    expect(result.thread.surfaceState).toBe("pending");
    expect(result.visibilityProjection.hiddenContentReasonRefs).toContain(
      "request_lineage_tuple_drift",
    );
  });
});
