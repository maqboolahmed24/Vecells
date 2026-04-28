import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  createPhase3SupportCommunicationLinkageApplication,
  PHASE3_SUPPORT_COMMUNICATION_LINKAGE_QUERY_SURFACES,
  phase3SupportCommunicationLinkageRoutes,
} from "../src/phase3-support-communication-linkage.ts";

function buildMessageFixture(taskId = "task_248_message") {
  return {
    task: { taskId },
    clinicianMessageSeedRef: "message_seed_248_a",
    messageThread: {
      threadId: "message_thread_248_a",
      requestId: "request_248_a",
      requestLineageRef: "request_lineage_248_a",
      lineageCaseLinkRef: "lineage_case_link_248_message",
      patientVisibleExpectationState: "delivery_repair_required",
      reachabilityDependencyRef: "reachability_dependency_248_message",
      version: 5,
    },
    currentDispatchEnvelope: {
      messageDispatchEnvelopeId: "message_dispatch_248_a",
      routeIntentBindingRef: "route_intent_248_message",
    },
    currentDeliveryEvidenceBundle: {
      messageDeliveryEvidenceBundleId: "message_delivery_248_a",
      deliveryState: "failed",
      supportActionSettlementRef: null,
    },
    currentExpectationEnvelope: {
      threadExpectationEnvelopeId: "message_expectation_248_a",
      routeIntentBindingRef: "route_intent_248_message",
      patientVisibleState: "delivery_repair_required",
    },
    currentResolutionGate: {
      threadResolutionGateId: "message_resolution_gate_248_a",
    },
    latestReply: null,
  };
}

function buildCallbackFixture(taskId = "task_248_callback") {
  return {
    task: { taskId },
    callbackSeedRef: "callback_seed_248_a",
    callbackCase: {
      callbackCaseId: "callback_case_248_a",
      requestId: "request_248_b",
      requestLineageRef: "request_lineage_248_b",
      lineageCaseLinkRef: "lineage_case_link_248_callback",
      patientVisibleExpectationState: "route_repair_required",
      reachabilityDependencyRef: "reachability_dependency_248_callback",
      version: 4,
    },
    currentIntentLease: null,
    latestAttempt: null,
    currentExpectationEnvelope: {
      expectationEnvelopeId: "callback_expectation_248_a",
      routeIntentBindingRef: "route_intent_248_callback",
      patientVisibleState: "route_repair_required",
    },
    latestOutcomeEvidenceBundle: {
      callbackOutcomeEvidenceBundleId: "callback_outcome_248_a",
      outcome: "route_invalid",
    },
    currentResolutionGate: {
      callbackResolutionGateId: "callback_resolution_gate_248_a",
    },
  };
}

function buildRepairBundle(taskId, domain) {
  const messageRepair =
    domain === "message"
      ? {
          binding: {
            bindingId: "communication_repair_binding_248_message",
            taskId,
            episodeRef: "episode_248_a",
            requestId: "request_248_a",
            requestLineageRef: "request_lineage_248_a",
            reachabilityDependencyRef: "reachability_dependency_248_message",
            currentReachabilityAssessmentRef: "reachability_assessment_248_message",
            currentReachabilityEpoch: 2,
            activeRepairJourneyRef: "repair_journey_248_message",
            bindingState: "repair_required",
          },
        }
      : null;
  const callbackRepair =
    domain === "callback"
      ? {
          binding: {
            bindingId: "communication_repair_binding_248_callback",
            taskId,
            episodeRef: "episode_248_b",
            requestId: "request_248_b",
            requestLineageRef: "request_lineage_248_b",
            reachabilityDependencyRef: "reachability_dependency_248_callback",
            currentReachabilityAssessmentRef: "reachability_assessment_248_callback",
            currentReachabilityEpoch: 3,
            activeRepairJourneyRef: "repair_journey_248_callback",
            bindingState: "repair_required",
          },
        }
      : null;
  return {
    taskId,
    messageRepair,
    callbackRepair,
  };
}

describe("248 support communication failure linkage", () => {
  it("publishes the 248 support communication routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);
    for (const routeId of [
      "workspace_task_open_support_communication_failure",
      "support_ticket_communication_failure_linkage_current",
      "support_ticket_record_communication_action",
      "support_ticket_publish_resolution_snapshot",
    ]) {
      expect(routeIds).toContain(routeId);
    }

    expect(phase3SupportCommunicationLinkageRoutes).toHaveLength(4);
    expect(PHASE3_SUPPORT_COMMUNICATION_LINKAGE_QUERY_SURFACES).toContain(
      "GET /ops/support/tickets/{supportTicketId}/communication-failure-linkage",
    );
  });

  it("opens one canonical support lineage for a message failure and reuses it on repeated entry", async () => {
    const messageFixture = buildMessageFixture();
    const app = createPhase3SupportCommunicationLinkageApplication({
      clinicianMessageApplication: {
        async queryTaskClinicianMessageDomain(taskId) {
          return taskId === messageFixture.task.taskId ? messageFixture : null;
        },
      },
      callbackApplication: {
        async queryTaskCallbackDomain() {
          return null;
        },
      },
      communicationRepairApplication: {
        async queryTaskCommunicationRepair(taskId) {
          return buildRepairBundle(taskId, "message");
        },
      },
    });

    const opened = await app.openOrAttachSupportCommunicationFailure({
      taskId: messageFixture.task.taskId,
      communicationDomain: "clinician_message_thread",
      requestedByRef: "support_user_248",
      reasonCode: "delivery_failed",
      idempotencyKey: "open_message_248_a",
      requestedAt: "2026-04-17T18:00:00.000Z",
    });
    const attached = await app.openOrAttachSupportCommunicationFailure({
      taskId: messageFixture.task.taskId,
      communicationDomain: "clinician_message_thread",
      requestedByRef: "support_user_248",
      reasonCode: "delivery_failed",
      idempotencyKey: "open_message_248_b",
      requestedAt: "2026-04-17T18:01:00.000Z",
    });

    expect(opened.dedupeDecision).toBe("created_new_ticket");
    expect(attached.dedupeDecision).toBe("attached_existing_ticket");
    expect(attached.supportTicket.supportTicketId).toBe(opened.supportTicket.supportTicketId);
    expect(opened.supportLineageScopeMembers).toHaveLength(3);
    expect(opened.supportWorkspace.supportTicketWorkspaceProjection.querySurfaceRef).toBe(
      "GET /ops/support/tickets/:supportTicketId",
    );
    expect(opened.communicationContext.failureState).toBe("failed");
  });

  it("opens callback failure support linkage on the callback chain instead of inventing a detached target", async () => {
    const callbackFixture = buildCallbackFixture();
    const app = createPhase3SupportCommunicationLinkageApplication({
      clinicianMessageApplication: {
        async queryTaskClinicianMessageDomain() {
          return null;
        },
      },
      callbackApplication: {
        async queryTaskCallbackDomain(taskId) {
          return taskId === callbackFixture.task.taskId ? callbackFixture : null;
        },
      },
      communicationRepairApplication: {
        async queryTaskCommunicationRepair(taskId) {
          return buildRepairBundle(taskId, "callback");
        },
      },
    });

    const opened = await app.openOrAttachSupportCommunicationFailure({
      taskId: callbackFixture.task.taskId,
      communicationDomain: "callback_case",
      requestedByRef: "support_user_248",
      reasonCode: "route_invalid",
      idempotencyKey: "open_callback_248_a",
      requestedAt: "2026-04-17T18:05:00.000Z",
    });

    expect(opened.supportLineageBinding.governingObjectRef).toBe("callback_case_248_a");
    expect(opened.communicationContext.callbackCaseRef).toBe("callback_case_248_a");
    expect(opened.supportLineageScopeMembers[0].domainCaseRef).toBe("callback_case_248_a");
    expect(opened.communicationContext.reasonCategory).toBe("callback_route_invalid");
  });

  it("fails closed when support tries to act on a stale governing tuple", async () => {
    const messageFixture = buildMessageFixture();
    const app = createPhase3SupportCommunicationLinkageApplication({
      clinicianMessageApplication: {
        async queryTaskClinicianMessageDomain() {
          return messageFixture;
        },
      },
      callbackApplication: {
        async queryTaskCallbackDomain() {
          return null;
        },
      },
      communicationRepairApplication: {
        async queryTaskCommunicationRepair(taskId) {
          return buildRepairBundle(taskId, "message");
        },
      },
    });

    const result = await app.openOrAttachSupportCommunicationFailure({
      taskId: messageFixture.task.taskId,
      communicationDomain: "clinician_message_thread",
      requestedByRef: "support_user_248",
      reasonCode: "delivery_failed",
      idempotencyKey: "open_message_248_stale",
      requestedAt: "2026-04-17T18:10:00.000Z",
      expectedCommunicationTupleHash: "stale_tuple_hash",
    });

    expect(result.dedupeDecision).toBe("stale_recoverable");
    expect(result.latestSettlement.result).toBe("stale_recoverable");
    expect(result.supportTicket.shellMode).toBe("read_only_recovery");
  });

  it("keeps provisional support acknowledgement subordinate to the live message failure chain", async () => {
    const messageFixture = buildMessageFixture();
    const app = createPhase3SupportCommunicationLinkageApplication({
      clinicianMessageApplication: {
        async queryTaskClinicianMessageDomain() {
          return messageFixture;
        },
      },
      callbackApplication: {
        async queryTaskCallbackDomain() {
          return null;
        },
      },
      communicationRepairApplication: {
        async queryTaskCommunicationRepair(taskId) {
          return buildRepairBundle(taskId, "message");
        },
      },
    });

    const opened = await app.openOrAttachSupportCommunicationFailure({
      taskId: messageFixture.task.taskId,
      communicationDomain: "clinician_message_thread",
      requestedByRef: "support_user_248",
      reasonCode: "delivery_failed",
      idempotencyKey: "open_message_248_ack",
      requestedAt: "2026-04-17T18:12:00.000Z",
    });
    const recorded = await app.recordSupportCommunicationAction({
      supportTicketId: opened.supportTicket.supportTicketId,
      actionScope: "controlled_resend",
      result: "awaiting_external",
      recordedByRef: "support_user_248",
      reasonCode: "controlled_resend_authorized",
      idempotencyKey: "support_action_248_awaiting_external",
      recordedAt: "2026-04-17T18:13:00.000Z",
      noteOrSummaryRef: "support_note_248_resend_pending",
      sourceArtifactRef: "message_delivery_248_a",
      sourceEvidenceSnapshotRef: "message_delivery_248_a",
      expectedTicketVersionRef: opened.supportTicket.ticketVersionRef,
      expectedBindingHash: opened.supportLineageBinding.bindingHash,
      expectedCommunicationTupleHash: opened.communicationContext.governingThreadTupleHash,
    });

    expect(recorded.settlement.result).toBe("awaiting_external");
    expect(recorded.settlement.authoritativeOutcomeState).toBe("awaiting_external");
    expect(recorded.communicationContext.failureState).toBe("failed");
    expect(recorded.latestResolutionSnapshot).toBeNull();
    expect(recorded.supportWorkspace.supportTicketWorkspaceProjection.resolutionSnapshotRef).toBeNull();
  });

  it("requires authoritative settlement and provenance before publishing a durable resolution snapshot", async () => {
    const messageFixture = buildMessageFixture();
    const app = createPhase3SupportCommunicationLinkageApplication({
      clinicianMessageApplication: {
        async queryTaskClinicianMessageDomain() {
          return messageFixture;
        },
      },
      callbackApplication: {
        async queryTaskCallbackDomain() {
          return null;
        },
      },
      communicationRepairApplication: {
        async queryTaskCommunicationRepair(taskId) {
          return buildRepairBundle(taskId, "message");
        },
      },
    });

    const opened = await app.openOrAttachSupportCommunicationFailure({
      taskId: messageFixture.task.taskId,
      communicationDomain: "clinician_message_thread",
      requestedByRef: "support_user_248",
      reasonCode: "delivery_failed",
      idempotencyKey: "open_message_248_resolution",
      requestedAt: "2026-04-17T18:15:00.000Z",
    });
    const provisional = await app.recordSupportCommunicationAction({
      supportTicketId: opened.supportTicket.supportTicketId,
      actionScope: "manual_handoff",
      result: "awaiting_external",
      recordedByRef: "support_user_248",
      reasonCode: "manual_handoff_started",
      idempotencyKey: "support_action_248_manual_handoff_pending",
      recordedAt: "2026-04-17T18:16:00.000Z",
      noteOrSummaryRef: "support_note_248_handoff_pending",
      sourceArtifactRef: "message_delivery_248_a",
      sourceEvidenceSnapshotRef: "message_delivery_248_a",
      expectedTicketVersionRef: opened.supportTicket.ticketVersionRef,
      expectedBindingHash: opened.supportLineageBinding.bindingHash,
      expectedCommunicationTupleHash: opened.communicationContext.governingThreadTupleHash,
    });

    await expect(
      app.publishSupportResolutionSnapshot({
        supportTicketId: opened.supportTicket.supportTicketId,
        supportActionSettlementId: provisional.settlement.supportActionSettlementId,
        resolutionCode: "handoff_summary",
        summaryRef: "support_resolution_248_not_allowed",
        handoffSummaryRef: "support_handoff_summary_248_not_allowed",
        sourceArtifactRef: "message_delivery_248_a",
        sourceEvidenceSnapshotRef: "message_delivery_248_a",
        noteOrSummaryRef: "support_note_248_resolution_not_allowed",
        idempotencyKey: "publish_resolution_248_blocked",
        createdAt: "2026-04-17T18:17:00.000Z",
      }),
    ).rejects.toThrow("RESOLUTION_PROVENANCE_REQUIRED");

    const accepted = await app.recordSupportCommunicationAction({
      supportTicketId: opened.supportTicket.supportTicketId,
      actionScope: "manual_handoff",
      result: "manual_handoff_required",
      recordedByRef: "support_user_248",
      reasonCode: "manual_handoff_accepted",
      idempotencyKey: "support_action_248_manual_handoff_accepted",
      recordedAt: "2026-04-17T18:18:00.000Z",
      noteOrSummaryRef: "support_note_248_handoff_accepted",
      sourceArtifactRef: "message_delivery_248_a",
      sourceEvidenceSnapshotRef: "message_delivery_248_a",
      expectedTicketVersionRef: provisional.supportTicket.ticketVersionRef,
      expectedBindingHash: provisional.supportLineageBinding.bindingHash,
      expectedCommunicationTupleHash: provisional.communicationContext.governingThreadTupleHash,
      acceptedTransfer: true,
    });
    const published = await app.publishSupportResolutionSnapshot({
      supportTicketId: opened.supportTicket.supportTicketId,
      supportActionSettlementId: accepted.settlement.supportActionSettlementId,
      resolutionCode: "handoff_summary",
      summaryRef: "support_resolution_248_handoff_accepted",
      handoffSummaryRef: "support_handoff_summary_248_accepted",
      sourceArtifactRef: "message_delivery_248_a",
      sourceEvidenceSnapshotRef: "message_delivery_248_a",
      noteOrSummaryRef: "support_note_248_resolution_allowed",
      idempotencyKey: "publish_resolution_248_allowed",
      createdAt: "2026-04-17T18:19:00.000Z",
    });

    expect(published.resolutionSnapshot.confirmationState).toBe("accepted_transfer");
    expect(published.resolutionSnapshot.supportLineageArtifactBindingRefs.length).toBeGreaterThan(0);
    expect(published.supportTicket.lastResolutionSummaryRef).toBe(
      "support_resolution_248_handoff_accepted",
    );
  });
});
