import { createSubmissionBackboneApplication } from "./submission-backbone";

export const submissionPromotionReplayScenarios = [
  {
    scenarioId: "same_tab_double_submit",
    replayClass: "duplicate_submit_same_tab",
    description: "A second submit from the same browser tab returns the prior promotion result.",
  },
  {
    scenarioId: "cross_tab_submit_race",
    replayClass: "duplicate_submit_cross_tab",
    description: "Two tabs race the same envelope and only one canonical request is created.",
  },
  {
    scenarioId: "auth_return_replay_after_commit",
    replayClass: "auth_return_replay",
    description:
      "An authentication callback arrives after promotion and resolves to request truth.",
  },
  {
    scenarioId: "support_resume_promoted_lineage",
    replayClass: "support_resume_replay",
    description: "Support resume resolves from source lineage to the authoritative request shell.",
  },
  {
    scenarioId: "delayed_network_retry_after_lost_response",
    replayClass: "delayed_network_retry",
    description: "A delayed client retry after response loss returns the committed promotion.",
  },
] as const;

type SubmissionPromotionReplayScenario =
  (typeof submissionPromotionReplayScenarios)[number]["scenarioId"];

async function seedPromotableEnvelope(
  application: ReturnType<typeof createSubmissionBackboneApplication>,
) {
  const { envelope } = await application.commands.createEnvelope({
    sourceChannel: "self_service_form",
    initialSurfaceChannelProfile: "browser",
    intakeConvergenceContractRef: "icc_sim_001",
    sourceLineageRef: "source_lineage_sim_001",
    createdAt: "2026-04-12T10:00:00Z",
  });

  await application.commands.appendEnvelopeIngress({
    envelopeId: envelope.envelopeId,
    ingressRecordRef: "ingress_sim_001",
    updatedAt: "2026-04-12T10:01:00Z",
  });
  await application.commands.attachEnvelopeEvidence({
    envelopeId: envelope.envelopeId,
    evidenceSnapshotRef: "snapshot_sim_001",
    updatedAt: "2026-04-12T10:02:00Z",
  });
  await application.commands.attachEnvelopeNormalization({
    envelopeId: envelope.envelopeId,
    normalizedSubmissionRef: "normalized_sim_001",
    updatedAt: "2026-04-12T10:03:00Z",
  });
  await application.commands.markEnvelopeReady({
    envelopeId: envelope.envelopeId,
    promotionDecisionRef: "promotion_decision_sim_001",
    updatedAt: "2026-04-12T10:04:00Z",
  });

  const repositories = application.repositories as {
    seedDraftAccessGrant?: (submissionEnvelopeRef: string, accessGrantRef: string) => void;
    seedDraftLease?: (submissionEnvelopeRef: string, draftLeaseRef: string) => void;
  };
  repositories.seedDraftAccessGrant?.(envelope.envelopeId, "grant_sim_001");
  repositories.seedDraftLease?.(envelope.envelopeId, "lease_sim_001");

  return envelope.envelopeId;
}

async function commitPromotion(
  application: ReturnType<typeof createSubmissionBackboneApplication>,
  envelopeId: string,
) {
  return await application.commands.promoteEnvelope({
    envelopeId,
    promotedAt: "2026-04-12T10:05:00Z",
    tenantId: "tenant_001",
    requestType: "clinical_question",
    episodeFingerprint: "episode_fingerprint_sim_001",
    promotionCommandActionRecordRef: "cmd_action_sim_001",
    promotionCommandSettlementRecordRef: "cmd_settlement_sim_001",
    supersededAccessGrantRefs: ["grant_sim_001"],
    supersededDraftLeaseRefs: ["lease_sim_001"],
  });
}

export async function simulateSubmissionPromotionReplayScenario(
  scenarioId: SubmissionPromotionReplayScenario,
) {
  const application = createSubmissionBackboneApplication();
  const envelopeId = await seedPromotableEnvelope(application);

  if (scenarioId === "cross_tab_submit_race") {
    const [left, right] = await Promise.all([
      commitPromotion(application, envelopeId),
      application.commands.promoteEnvelope({
        envelopeId,
        promotedAt: "2026-04-12T10:05:01Z",
        tenantId: "tenant_001",
        requestType: "clinical_question",
        episodeFingerprint: "episode_fingerprint_sim_001",
        promotionCommandActionRecordRef: "cmd_action_sim_001",
        promotionCommandSettlementRecordRef: "cmd_settlement_sim_001",
        replayClass: "duplicate_submit_cross_tab",
      }),
    ]);
    const committed = left.replayed ? right : left;
    const replay = left.replayed ? left : right;
    return {
      scenarioId,
      committedRequestId: committed.request.requestId,
      replayRequestId: replay.request.requestId,
      replayed: replay.replayed,
      replayLookupField: replay.lookupField,
      transactionEvents: committed.events.map((event) => event.eventType),
      replayEvents: replay.events.map((event) => event.eventType),
    };
  }

  const committed = await commitPromotion(application, envelopeId);
  const promotionSnapshot = committed.promotionRecord.toSnapshot();

  if (scenarioId === "support_resume_promoted_lineage") {
    const handoff = await application.commands.resolveAuthoritativeRequestShell({
      sourceLineageRef: "source_lineage_sim_001",
    });
    return {
      scenarioId,
      committedRequestId: committed.request.requestId,
      replayRequestId: handoff.request.requestId,
      replayed: true,
      replayLookupField: handoff.lookupField,
      transactionEvents: committed.events.map((event) => event.eventType),
      replayEvents: ["authoritative_request_shell"],
    };
  }

  const replay = await application.commands.promoteEnvelope({
    envelopeId,
    promotedAt: "2026-04-12T10:06:00Z",
    tenantId: "tenant_001",
    requestType: "clinical_question",
    episodeFingerprint: "episode_fingerprint_sim_001",
    promotionCommandActionRecordRef: "cmd_action_sim_001",
    promotionCommandSettlementRecordRef: "cmd_settlement_sim_001",
    receiptConsistencyKey: promotionSnapshot.receiptConsistencyKey,
    statusConsistencyKey: promotionSnapshot.statusConsistencyKey,
    replayClass:
      scenarioId === "same_tab_double_submit"
        ? "duplicate_submit_same_tab"
        : scenarioId === "auth_return_replay_after_commit"
          ? "auth_return_replay"
          : "delayed_network_retry",
  });

  return {
    scenarioId,
    committedRequestId: committed.request.requestId,
    replayRequestId: replay.request.requestId,
    replayed: replay.replayed,
    replayLookupField: replay.lookupField,
    transactionEvents: committed.events.map((event) => event.eventType),
    replayEvents: replay.events.map((event) => event.eventType),
  };
}

export async function runAllSubmissionPromotionReplayScenarios() {
  return await Promise.all(
    submissionPromotionReplayScenarios.map((scenario) =>
      simulateSubmissionPromotionReplayScenario(scenario.scenarioId),
    ),
  );
}
