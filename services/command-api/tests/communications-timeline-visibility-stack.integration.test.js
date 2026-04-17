import { describe, expect, it } from "vitest";
import {
  COMMUNICATIONS_TIMELINE_ASSEMBLER_NAME,
  COMMUNICATION_VISIBILITY_RESOLVER_NAME,
  createAuthenticatedPortalProjectionApplication,
} from "../src/authenticated-portal-projections.ts";

function baseRouteContext(overrides = {}) {
  return {
    subjectRef: "nhs_subject_214",
    audienceTier: "patient_authenticated",
    purposeOfUse: "authenticated_self_service",
    routeFamilyRef: "patient_messages",
    sessionEpochRef: "session_epoch_214_v1",
    expectedSessionEpochRef: "session_epoch_214_v1",
    subjectBindingVersionRef: "binding_version_214_v1",
    expectedSubjectBindingVersionRef: "binding_version_214_v1",
    routeIntentBindingRef: "route_intent_214_v1",
    expectedRouteIntentBindingRef: "route_intent_214_v1",
    lineageFenceRef: "lineage_fence_214_v1",
    expectedLineageFenceRef: "lineage_fence_214_v1",
    trustPosture: "trusted",
    commandConsistencyState: "consistent",
    coverageRowRefs: ["coverage_row_214_messages"],
    observedAt: "2026-04-16T14:00:00.000Z",
    ...overrides,
  };
}

function callbackStatus(overrides = {}) {
  return {
    projectionName: "PatientCallbackStatusProjection",
    callbackStatusProjectionRef: "patient_callback_status_214_a",
    coverageProjectionRef: "coverage_214_callback_source",
    requestRef: "request_214_a",
    requestLineageRef: "lineage_214_a",
    clusterRef: "cluster_214_message_a",
    callbackCaseRef: "callback_214_a",
    callbackCaseVersionRef: "callback_214_a_v3",
    expectationEnvelopeRef: "CallbackExpectationEnvelope_214_a",
    outcomeEvidenceBundleRef: null,
    resolutionGateRef: "CallbackResolutionGate_214_a",
    patientVisibleState: "scheduled",
    windowRiskState: "on_track",
    windowLowerAt: "2026-04-16T15:00:00.000Z",
    windowUpperAt: "2026-04-16T17:00:00.000Z",
    stateConfidenceBand: "high",
    monotoneRevision: 4,
    routeRepairRequiredState: false,
    dominantActionRef: "callback_response",
    reachabilitySummaryProjectionRef: "reachability_summary_214_clear",
    contactRepairProjectionRef: null,
    requestShellRouteRef: "/v1/me/requests/request_214_a/callback/callback_214_a",
    messageShellRouteRef: "/v1/me/messages/cluster_214_message_a/callback/callback_214_a",
    requestReturnBundleRef: "return_bundle_214_a",
    continuityEvidenceRef: "continuity_214_callback",
    authoritativeBasisRefs: ["CallbackExpectationEnvelope_214_a", "CallbackResolutionGate_214_a"],
    computedAt: "2026-04-16T13:55:00.000Z",
    createdByAuthority: "AuthenticatedPortalProjectionService",
    ...overrides,
  };
}

function sourceCluster(overrides = {}) {
  const clusterRef = overrides.clusterRef ?? "cluster_214_message_a";
  const threadId = overrides.threadId ?? "thread_214_a";
  return {
    clusterRef,
    clusterVersionRef: `${clusterRef}_v5`,
    threadId,
    threadVersionRef: `${threadId}_v5`,
    governingRequestRef: "request_214_a",
    requestLineageRef: "lineage_214_a",
    careEpisodeRef: "episode_214_skin",
    ownerSubjectRef: "nhs_subject_214",
    patientSafeSubject: "Skin photo follow-up",
    publicSafeSubject: "Message update",
    selectedAnchorRef: "envelope_214_reply",
    latestMeaningfulUpdateAt: "2026-04-16T13:45:00.000Z",
    receiptGrammarVersionRef: "receipt_grammar_214_v1",
    monotoneRevision: 7,
    previewVisibilityContractRef: "PreviewVisibilityContract_214_messages",
    summarySafetyTier: "patient_safe",
    messageThreadRefs: [threadId],
    callbackCaseRefs: ["callback_214_a"],
    reminderPlanRefs: ["reminder_214_a"],
    communicationEnvelopes: [
      {
        envelopeRef: "envelope_214_clinician",
        envelopeVersionRef: "envelope_214_clinician_v2",
        clusterRef,
        threadId,
        subthreadRef: "secure_message_214",
        subthreadType: "clinician_reply",
        channel: "secure_message",
        authoredBy: "clinician",
        patientSafeSummary: "The clinician asked for a clearer photo.",
        publicSafeSummary: "A new message is available.",
        sentAt: "2026-04-16T10:30:00.000Z",
        sortAt: "2026-04-16T10:30:00.000Z",
        visibleSnippetRef: "snippet_214_clinician_safe",
        transportAcceptanceState: "accepted",
        deliveryEvidenceState: "delivered",
        deliveryRiskState: "on_track",
        localAckState: "seen",
        authoritativeOutcomeState: "awaiting_reply",
      },
      {
        envelopeRef: "envelope_214_callback",
        envelopeVersionRef: "envelope_214_callback_v1",
        clusterRef,
        threadId,
        subthreadRef: "callback_214",
        subthreadType: "callback",
        channel: "phone",
        authoredBy: "practice",
        patientSafeSummary: "A callback is scheduled this afternoon.",
        publicSafeSummary: "A callback update is available.",
        sentAt: "2026-04-16T11:00:00.000Z",
        sortAt: "2026-04-16T11:00:00.000Z",
        visibleSnippetRef: "snippet_214_callback_safe",
        transportAcceptanceState: "accepted",
        deliveryEvidenceState: "pending",
        deliveryRiskState: "on_track",
        localAckState: "none",
        authoritativeOutcomeState: "callback_scheduled",
      },
      {
        envelopeRef: "envelope_214_reminder",
        envelopeVersionRef: "envelope_214_reminder_v1",
        clusterRef,
        threadId,
        subthreadRef: "reminder_214",
        subthreadType: "reminder",
        channel: "sms",
        authoredBy: "system",
        patientSafeSummary: "Reminder sent for the follow-up photo.",
        publicSafeSummary: "A reminder update is available.",
        sentAt: "2026-04-16T12:00:00.000Z",
        sortAt: "2026-04-16T12:00:00.000Z",
        reminderPlanRef: "reminder_214_a",
        transportAcceptanceState: "accepted",
        deliveryEvidenceState: "delivered",
        deliveryRiskState: "on_track",
        localAckState: "none",
        authoritativeOutcomeState: "settled",
      },
      {
        envelopeRef: "envelope_214_reply",
        envelopeVersionRef: "envelope_214_reply_v1",
        clusterRef,
        threadId,
        subthreadRef: "secure_message_214",
        subthreadType: "secure_message",
        channel: "secure_message",
        authoredBy: "patient",
        patientSafeSummary: "Patient sent a replacement photo.",
        publicSafeSummary: "A reply was sent.",
        sentAt: "2026-04-16T13:45:00.000Z",
        sortAt: "2026-04-16T13:45:00.000Z",
        visibleSnippetRef: "snippet_214_reply_safe",
        receiptRef: "PatientReceiptEnvelope_214_reply",
        settlementRef: "ConversationCommandSettlement_214_reply",
        transportAcceptanceState: "accepted",
        deliveryEvidenceState: "pending",
        deliveryRiskState: "at_risk",
        localAckState: "accepted_locally",
        authoritativeOutcomeState: "awaiting_review",
      },
    ],
    callbackStatusProjections: [callbackStatus({ clusterRef })],
    ...overrides,
  };
}

describe("Communications timeline visibility and callback projection stack", () => {
  it("assembles tuple-aligned timeline rows, thread mastheads, callback cards, receipts, and composer leases", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.listPatientMessages({
      ...baseRouteContext(),
      sourceClusters: [sourceCluster()],
    });

    expect(COMMUNICATIONS_TIMELINE_ASSEMBLER_NAME).toBe("CommunicationsTimelineAssembler");
    expect(COMMUNICATION_VISIBILITY_RESOLVER_NAME).toBe("CommunicationVisibilityResolver");
    expect(result.timeline.projectionName).toBe("PatientCommunicationsTimelineProjection");
    expect(result.timeline.visualMode).toBe("Conversation_Braid_Atlas");
    expect(result.conversationClusters[0].projectionName).toBe("PatientConversationCluster");
    expect(result.conversationThreads[0].projectionName).toBe("ConversationThreadProjection");
    expect(result.conversationSubthreads[0].projectionName).toBe("ConversationSubthreadProjection");
    expect(result.previewDigests[0].projectionName).toBe("PatientConversationPreviewDigest");
    expect("PatientCommunicationVisibilityProjection").toBe(
      "PatientCommunicationVisibilityProjection",
    );
    expect(result.callbackCards[0].projectionName).toBe("ConversationCallbackCardProjection");
    expect(result.receiptEnvelopes[0].projectionName).toBe("PatientReceiptEnvelope");
    expect(result.commandSettlements[0].projectionName).toBe("ConversationCommandSettlement");
    expect(result.composerLeases[0].projectionName).toBe("PatientComposerLease");
    expect("ConversationTimelineAnchor").toBe("ConversationTimelineAnchor");
    expect(result.timeline.reasonCodes).toContain("PORTAL_214_COMMUNICATION_TIMELINE_ASSEMBLED");
    expect(result.timeline.reasonCodes).toContain("PORTAL_214_TUPLE_ALIGNMENT_VERIFIED");

    const tuple = result.conversationClusters[0].threadTupleHash;
    expect(result.conversationThreads[0].threadTupleHash).toBe(tuple);
    expect(result.previewDigests[0].threadTupleHash).toBe(tuple);
    expect(result.callbackCards[0].threadTupleHash).toBe(tuple);
    expect(result.conversationClusters[0].receiptGrammarVersionRef).toBe("receipt_grammar_214_v1");
    expect(result.conversationThreads[0].monotoneRevision).toBe(7);
    expect(result.callbackCards[0].callbackStatusProjectionRef).toBe(
      "patient_callback_status_214_a",
    );
    expect(result.timeline.timelineAnchors.map((anchor) => anchor.sourceRef)).toContain(
      "envelope_214_reply",
    );
    expect(result.composerLeases[0].leaseState).toBe("active");
  });

  it("keeps hidden previews as governed placeholders instead of omitting clusters", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const publicResult = await application.authenticatedPortalProjectionService.listPatientMessages(
      {
        ...baseRouteContext({
          audienceTier: "patient_public",
          purposeOfUse: "public_status",
          trustPosture: "reduced",
        }),
        sourceClusters: [sourceCluster()],
      },
    );
    const stepUpResult = await application.authenticatedPortalProjectionService.listPatientMessages(
      {
        ...baseRouteContext({ trustPosture: "step_up_required" }),
        sourceClusters: [sourceCluster()],
      },
    );
    const recoveryResult =
      await application.authenticatedPortalProjectionService.listPatientMessages({
        ...baseRouteContext({
          audienceTier: "secure_link_recovery",
          purposeOfUse: "secure_link_recovery",
          trustPosture: "repair_hold",
        }),
        sourceClusters: [sourceCluster()],
      });

    expect(publicResult.timeline.conversationClusterRefs).toHaveLength(1);
    expect(publicResult.previewDigests[0].placeholderKind).toBe("public_safe");
    expect(publicResult.previewDigests[0].reasonCodes).toContain(
      "PORTAL_214_PREVIEW_SUPPRESSED_PLACEHOLDER",
    );
    expect(stepUpResult.previewDigests[0].placeholderKind).toBe("step_up");
    expect(stepUpResult.previewDigests[0].reasonCodes).toContain("PORTAL_214_STEP_UP_PLACEHOLDER");
    expect(recoveryResult.previewDigests[0].placeholderKind).toBe("recovery_only");
    expect(recoveryResult.previewDigests[0].reasonCodes).toContain(
      "PORTAL_214_RECOVERY_ONLY_PLACEHOLDER",
    );
    expect(recoveryResult.communicationVisibility[0].previewMode).toBe("suppressed_recovery_only");
  });

  it("does not inflate local acknowledgement or transport acceptance into settled language", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.listPatientMessages({
      ...baseRouteContext(),
      sourceClusters: [sourceCluster()],
    });
    const replyReceipt = result.receiptEnvelopes.find(
      (receipt) => receipt.sourceEnvelopeRef === "envelope_214_reply",
    );
    const replySettlement = result.commandSettlements.find(
      (settlement) => settlement.sourceEnvelopeRef === "envelope_214_reply",
    );

    expect(replyReceipt.authoritativeOutcomeState).toBe("awaiting_review");
    expect(replySettlement.calmSettledLanguageAllowed).toBe(false);
    expect(result.previewDigests[0].localSuccessFinalityWarningRef).toBe(
      "local_ack_is_not_authoritative_settlement_214",
    );
    expect(result.previewDigests[0].reasonCodes).toContain("PORTAL_214_LOCAL_SUCCESS_NOT_FINAL");
  });

  it("keeps delivery failures and provider disputes visible with repair-first dominance", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.listPatientMessages({
      ...baseRouteContext(),
      sourceClusters: [
        sourceCluster({
          communicationEnvelopes: [
            {
              ...sourceCluster().communicationEnvelopes[0],
              envelopeRef: "envelope_214_bounced",
              subthreadType: "delivery_failure",
              deliveryEvidenceState: "bounced",
              deliveryRiskState: "likely_failed",
              failureEvidenceRef: "delivery_failure_evidence_214_sms",
              patientSafeSummary: "SMS reminder could not be delivered.",
            },
            {
              ...sourceCluster().communicationEnvelopes[1],
              envelopeRef: "envelope_214_disputed",
              subthreadType: "provider_dispute",
              deliveryEvidenceState: "disputed",
              deliveryRiskState: "disputed",
              disputeEvidenceRef: "provider_dispute_evidence_214_sms",
              patientSafeSummary: "The reminder delivery evidence is disputed.",
            },
          ],
        }),
      ],
    });

    expect(result.timeline.clusterSummaries[0].deliveryRiskState).toBe("disputed");
    expect(result.conversationClusters[0].reasonCodes).toContain(
      "PORTAL_214_DELIVERY_FAILURE_VISIBLE",
    );
    expect(result.conversationClusters[0].reasonCodes).toContain("PORTAL_214_DISPUTE_VISIBLE");
    expect(result.conversationClusters[0].dominantNextActionRef).toBe("contact_route_repair");
    expect(result.conversationClusters[0].reasonCodes).toContain(
      "PORTAL_214_BLOCKER_REPAIR_DOMINATES",
    );
    expect(result.composerLeases[0].leaseState).toBe("blocked");
    expect(result.receiptEnvelopes.map((receipt) => receipt.receiptKind)).toEqual([
      "delivery_failure",
      "dispute",
    ]);
  });

  it("uses PatientCallbackStatusProjection as the callback truth for callback route hydration", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientMessageCallback(
      {
        ...baseRouteContext(),
        clusterId: "cluster_214_message_a",
        callbackCaseId: "callback_214_a",
        sourceClusters: [sourceCluster()],
      },
    );

    expect(result.callbackStatus.projectionName).toBe("PatientCallbackStatusProjection");
    expect(result.callbackCard.callbackStatusProjectionRef).toBe(
      result.callbackStatus.callbackStatusProjectionRef,
    );
    expect(result.callbackCard.reasonCodes).toContain("PORTAL_214_CALLBACK_STATUS_COMPATIBILITY");
  });

  it("freezes composer leases and exposes tuple drift placeholders when tuple alignment fails", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientMessageThread({
      ...baseRouteContext(),
      clusterId: "cluster_214_message_a",
      threadId: "thread_214_a",
      sourceClusters: [sourceCluster({ forceTupleDrift: true })],
    });

    expect(result.conversationThread.tupleAlignmentState).toBe("drifted");
    expect(result.previewDigests[0].placeholderKind).toBe("tuple_drift");
    expect(result.composerLeases[0].leaseState).toBe("blocked");
    expect(result.timeline.reasonCodes).toContain("PORTAL_214_TUPLE_ALIGNMENT_DRIFT");
  });
});
