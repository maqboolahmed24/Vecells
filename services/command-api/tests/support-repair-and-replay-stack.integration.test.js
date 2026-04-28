import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  REPLAY_CHECKPOINT_SERVICE_NAME,
  REPLAY_RESTORE_SERVICE_NAME,
  SUPPORT_REPAIR_CHAIN_ASSEMBLER_NAME,
  SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID,
  SUPPORT_REPAIR_REPLAY_QUERY_SURFACES,
  SUPPORT_REPAIR_REPLAY_VISUAL_MODE,
  createSupportRepairAndReplayApplication,
  supportProviderWebhookSignatureControls,
  supportRepairAndReplayRoutes,
  validateProviderMetadataHygiene,
} from "../src/support-repair-and-replay.ts";

function repairInput(overrides = {}) {
  return {
    supportTicketId: SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID,
    repairKind: "controlled_resend",
    requestedChannel: "email",
    requestedByRef: "support_user_219_primary",
    idempotencyKey: "idem_219_repair_click_a",
    requestedAt: "2026-04-16T14:06:00.000Z",
    ...overrides,
  };
}

function replayStartInput(overrides = {}) {
  return {
    supportTicketId: SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID,
    startedByRef: "support_user_219_primary",
    idempotencyKey: "idem_219_replay_start_a",
    startedAt: "2026-04-16T14:11:00.000Z",
    ...overrides,
  };
}

describe("Support controlled repair and replay control stack", () => {
  it("publishes the 219 API surfaces in the command route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);
    for (const routeId of [
      "support_communication_repair_preview",
      "support_communication_repair_commit",
      "support_replay_start",
      "support_replay_release",
      "support_ticket_timeline_current",
      "support_repair_restore_status",
    ]) {
      expect(routeIds).toContain(routeId);
    }

    const routeText = JSON.stringify(serviceDefinition.routeCatalog);
    for (const marker of [
      "SupportOmnichannelTimelineProjection",
      "SupportMutationAttempt",
      "SupportActionRecord",
      "SupportActionSettlement",
      "CommunicationReplayRecord",
      "SupportReplayCheckpoint",
      "SupportReplayEvidenceBoundary",
      "SupportReplayDeltaReview",
      "SupportReplayReleaseDecision",
      "SupportReplayRestoreSettlement",
      "SupportRouteIntentToken",
      "SupportContinuityEvidenceProjection",
      "SupportReadOnlyFallbackProjection",
    ]) {
      expect(routeText).toContain(marker);
    }
    expect(supportRepairAndReplayRoutes).toHaveLength(6);
    expect(SUPPORT_REPAIR_REPLAY_QUERY_SURFACES).toContain(
      "POST /ops/support/tickets/:supportTicketId/communication-repair/commit",
    );
  });

  it("assembles the canonical communication and support lineage chain for repair", () => {
    const app = createSupportRepairAndReplayApplication();
    const chain = app.supportRepairChainAssembler.resolveRepairChain(repairInput());

    expect(SUPPORT_REPAIR_CHAIN_ASSEMBLER_NAME).toBe("SupportRepairChainAssembler");
    expect(chain.projectionName).toBe("SupportRepairChainView");
    expect(chain.messageDispatchEnvelope.projectionName).toBe("MessageDispatchEnvelope");
    expect(chain.latestDeliveryEvidenceBundle.projectionName).toBe("MessageDeliveryEvidenceBundle");
    expect(chain.latestThreadExpectationEnvelope.projectionName).toBe("ThreadExpectationEnvelope");
    expect(chain.latestThreadResolutionGate.projectionName).toBe("ThreadResolutionGate");
    expect(chain.supportLineageBinding.projectionName).toBe("SupportLineageBinding");
    expect(chain.supportLineageScopeMember.actionability).toBe("governed_mutation");
    expect(chain.freshRepairAuthorized).toBe(true);
    expect(chain.canonicalChainHash).toHaveLength(24);
  });

  it("uses one live SupportMutationAttempt across duplicate clicks and retries", () => {
    const app = createSupportRepairAndReplayApplication();
    const service = app.supportRepairReplayControlService;
    const first = service.commitCommunicationRepair(repairInput());
    const exactReplay = service.commitCommunicationRepair(repairInput());
    const retry = service.commitCommunicationRepair(
      repairInput({ idempotencyKey: "idem_219_repair_worker_retry_b" }),
    );

    expect(first.dedupeDecision).toBe("created_new_attempt");
    expect(first.supportMutationAttempt?.projectionName).toBe("SupportMutationAttempt");
    expect(first.supportActionRecord?.projectionName).toBe("SupportActionRecord");
    expect(first.supportActionSettlement.projectionName).toBe("SupportActionSettlement");
    expect(exactReplay.dedupeDecision).toBe("exact_replay");
    expect(retry.dedupeDecision).toBe("reuse_live_attempt");
    expect(retry.supportMutationAttempt?.supportMutationAttemptId).toBe(
      first.supportMutationAttempt?.supportMutationAttemptId,
    );
    expect(retry.externalEffectCount).toBe(1);
    expect(retry.supportActionSettlement.result).toBe("awaiting_external");
  });

  it("denies a fresh resend when the gate and evidence do not authorize repair", () => {
    const app = createSupportRepairAndReplayApplication();
    const service = app.supportRepairReplayControlService;
    const preview = service.previewCommunicationRepair(
      repairInput({
        simulateEvidenceStatus: "delivered",
        simulateGateDecision: "hold",
      }),
    );
    const commit = service.commitCommunicationRepair(
      repairInput({
        idempotencyKey: "idem_219_denied",
        simulateEvidenceStatus: "delivered",
        simulateGateDecision: "hold",
      }),
    );

    expect(preview.dedupeDecision).toBe("denied_scope");
    expect(commit.supportMutationAttempt).toBeNull();
    expect(commit.supportActionSettlement.result).toBe("denied_scope");
    expect(commit.externalEffectCount).toBe(0);
  });

  it("validates provider callbacks and reconciles accepted callbacks onto the same chain", () => {
    const app = createSupportRepairAndReplayApplication();
    const service = app.supportRepairReplayControlService;
    const commit = service.commitCommunicationRepair(repairInput());
    expect(validateProviderMetadataHygiene(commit.providerMetadata)).toBe(true);
    expect(supportProviderWebhookSignatureControls.twilio).toContain("X-Twilio-Signature");
    expect(supportProviderWebhookSignatureControls.sendgrid).toContain(
      "X-Twilio-Email-Event-Webhook-Signature",
    );

    const rejected = service.reconcileProviderCallback({
      supportTicketId: SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID,
      supportMutationAttemptRef: commit.supportMutationAttempt.supportMutationAttemptId,
      providerName: "sendgrid",
      providerMessageRef: "sendgrid_message_219_a",
      observedStatus: "delivered",
      signatureValid: false,
    });
    expect(rejected.acceptedAsTruth).toBe(false);
    expect(rejected.adapterReceiptCheckpoint.projectionName).toBe("AdapterReceiptCheckpoint");
    expect(rejected.adapterReceiptCheckpoint.webhookSignatureState).toBe(
      "quarantined_invalid_signature",
    );
    expect(rejected.supportActionSettlement.result).toBe("awaiting_external");

    const accepted = service.reconcileProviderCallback({
      supportTicketId: SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID,
      supportMutationAttemptRef: commit.supportMutationAttempt.supportMutationAttemptId,
      providerName: "sendgrid",
      providerMessageRef: "sendgrid_message_219_a",
      observedStatus: "delivered",
      signatureValid: true,
    });
    expect(accepted.acceptedAsTruth).toBe(true);
    expect(commit.providerMetadata.projectionName).toBe("ProviderSafeMetadataBundle");
    expect(accepted.supportMutationAttempt.mutationEnvelopeState).toBe("settled");
    expect(accepted.supportActionSettlement.patientReceiptParity).toBe("authoritative");
    expect(accepted.supportActionSettlement.messageDispatchEnvelopeRef).toBe(
      commit.supportMutationAttempt.messageDispatchEnvelopeRef,
    );
  });

  it("keeps timeline, action settlement, and patient receipt parity aligned", () => {
    const app = createSupportRepairAndReplayApplication();
    const service = app.supportRepairReplayControlService;
    const commit = service.commitCommunicationRepair(repairInput());
    let timeline = service.getSupportTimeline({
      supportTicketId: SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID,
    });
    expect(timeline.projectionName).toBe("SupportOmnichannelTimelineProjection");
    expect(timeline.supportActionSettlementRef).toBe(
      commit.supportActionSettlement.supportActionSettlementId,
    );
    expect(timeline.supportActionWorkbenchProjection.projectionName).toBe(
      "SupportActionWorkbenchProjection",
    );
    expect(timeline.supportReachabilityPostureProjection.projectionName).toBe(
      "SupportReachabilityPostureProjection",
    );
    expect(timeline.patientReceiptParity).toBe("provisional");
    expect(timeline.provisionalEventRefs).toContain(
      commit.supportActionSettlement.supportActionSettlementId,
    );

    service.reconcileProviderCallback({
      supportTicketId: SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID,
      supportMutationAttemptRef: commit.supportMutationAttempt.supportMutationAttemptId,
      providerName: "sendgrid",
      providerMessageRef: "sendgrid_message_219_b",
      observedStatus: "delivered",
      signatureValid: true,
    });
    timeline = service.getSupportTimeline({
      supportTicketId: SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID,
    });
    expect(timeline.patientReceiptParity).toBe("authoritative");
    expect(timeline.authoritativeEventRefs).toContain(
      commit.supportActionSettlement.supportActionSettlementId,
    );
  });

  it("starts replay with an explicit checkpoint and evidence boundary excluding drafts", () => {
    const app = createSupportRepairAndReplayApplication();
    const service = app.supportRepairReplayControlService;
    const replay = service.startReplay(replayStartInput());

    expect(REPLAY_CHECKPOINT_SERVICE_NAME).toBe("ReplayCheckpointService");
    expect(replay.communicationReplayRecord.projectionName).toBe("CommunicationReplayRecord");
    expect(replay.supportReplayCheckpoint.projectionName).toBe("SupportReplayCheckpoint");
    expect(replay.supportReplayEvidenceBoundary.projectionName).toBe(
      "SupportReplayEvidenceBoundary",
    );
    expect(replay.communicationReplayRecord.mutatingControlsSuspended).toBe(true);
    expect(replay.supportReplayEvidenceBoundary.excludedDraftRefs).toContain(
      "support_draft_219_uncommitted_response",
    );
    expect(replay.supportOmnichannelTimelineProjection.freshness).toBe("paused_replay");
    expect(
      replay.supportOmnichannelTimelineProjection.supportActionWorkbenchProjection
        .mutatingControlsState,
    ).toBe("suspended_for_replay");
  });

  it("releases replay to live only with delta review, route intent, continuity, and lineage proof", () => {
    const app = createSupportRepairAndReplayApplication();
    const service = app.supportRepairReplayControlService;
    const replay = service.startReplay(replayStartInput());
    const release = service.releaseReplay({
      supportTicketId: SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID,
      supportReplayCheckpointRef: replay.supportReplayCheckpoint.supportReplayCheckpointId,
      releasedByRef: "support_user_219_primary",
      idempotencyKey: "idem_219_replay_release_a",
      releasedAt: "2026-04-16T14:18:00.000Z",
    });

    expect(REPLAY_RESTORE_SERVICE_NAME).toBe("ReplayRestoreService");
    expect(release.supportReplayDeltaReview.reviewState).toBe("accepted");
    expect(release.supportRouteIntentToken.projectionName).toBe("SupportRouteIntentToken");
    expect(release.supportContinuityEvidenceProjection.projectionName).toBe(
      "SupportContinuityEvidenceProjection",
    );
    expect(release.supportReplayReleaseDecision.decision).toBe("restore_live");
    expect(release.supportReplayRestoreSettlement.result).toBe("live_restored");
    expect(release.supportReadOnlyFallbackProjection).toBeNull();
  });

  it("falls back same-shell when replay release sees route drift or unsettled external proof", () => {
    const app = createSupportRepairAndReplayApplication();
    const service = app.supportRepairReplayControlService;
    const commit = service.commitCommunicationRepair(
      repairInput({ idempotencyKey: "idem_219_pending_external_a" }),
    );
    const replay = service.startReplay(
      replayStartInput({ idempotencyKey: "idem_219_replay_start_b" }),
    );
    const release = service.releaseReplay({
      supportTicketId: SUPPORT_REPAIR_REPLAY_FIXTURE_TICKET_ID,
      supportReplayCheckpointRef: replay.supportReplayCheckpoint.supportReplayCheckpointId,
      idempotencyKey: "idem_219_replay_release_b",
      simulateRouteIntentState: "route_drift",
      simulateContinuityTrustState: "stale",
      simulatePendingExternal: true,
    });

    expect(release.supportReplayReleaseDecision.decision).toBe("awaiting_external_hold");
    expect(release.supportReplayRestoreSettlement.result).toBe("awaiting_external_hold");
    expect(release.supportReplayRestoreSettlement.heldSupportMutationAttemptRefs).toContain(
      commit.supportMutationAttempt.supportMutationAttemptId,
    );
    expect(release.supportReadOnlyFallbackProjection.projectionName).toBe(
      "SupportReadOnlyFallbackProjection",
    );
    expect(release.supportReadOnlyFallbackProjection.preservedAnchorRef).toBeTruthy();
    expect(release.supportReadOnlyFallbackProjection.reacquireActionRef).toBe(
      "support_action_reacquire_replay_restore_219",
    );
    expect(SUPPORT_REPAIR_REPLAY_VISUAL_MODE).toBe("Support_Replay_Control_Atlas");
  });
});
