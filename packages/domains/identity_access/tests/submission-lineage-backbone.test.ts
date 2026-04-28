import { describe, expect, it } from "vitest";
import {
  EpisodeAggregate,
  createSubmissionBackboneCommandService,
  createSubmissionBackboneStore,
} from "../src/index";
import { RequestAggregate, createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";

async function seedPromotableEnvelope() {
  const store = createSubmissionBackboneStore();
  const service = createSubmissionBackboneCommandService(
    store,
    createDeterministicBackboneIdGenerator("par062"),
  );

  const { envelope } = await service.createEnvelope({
    sourceChannel: "self_service_form",
    initialSurfaceChannelProfile: "browser",
    intakeConvergenceContractRef: "icc_001",
    sourceLineageRef: "source_lineage_001",
    createdAt: "2026-04-12T09:00:00Z",
  });

  await service.appendEnvelopeIngress({
    envelopeId: envelope.envelopeId,
    ingressRecordRef: "ingress_001",
    updatedAt: "2026-04-12T09:01:00Z",
  });
  await service.attachEnvelopeEvidence({
    envelopeId: envelope.envelopeId,
    evidenceSnapshotRef: "snapshot_001",
    updatedAt: "2026-04-12T09:02:00Z",
  });
  await service.attachEnvelopeNormalization({
    envelopeId: envelope.envelopeId,
    normalizedSubmissionRef: "normalized_001",
    updatedAt: "2026-04-12T09:03:00Z",
  });
  await service.markEnvelopeReady({
    envelopeId: envelope.envelopeId,
    promotionDecisionRef: "promotion_decision_001",
    updatedAt: "2026-04-12T09:04:00Z",
  });

  return { store, service, envelopeId: envelope.envelopeId };
}

describe("submission-lineage backbone orchestration", () => {
  it("promotes an envelope exactly once and replays the same Request plus SubmissionPromotionRecord", async () => {
    const { service, store, envelopeId } = await seedPromotableEnvelope();
    store.seedDraftAccessGrant(envelopeId, "grant_001");
    store.seedDraftLease(envelopeId, "lease_001");

    const first = await service.promoteEnvelope({
      envelopeId,
      promotedAt: "2026-04-12T09:05:00Z",
      tenantId: "tenant_001",
      requestType: "clinical_question",
      episodeFingerprint: "episode_fingerprint_001",
      promotionCommandActionRecordRef: "cmd_action_001",
      promotionCommandSettlementRecordRef: "cmd_settlement_001",
      supersededAccessGrantRefs: ["grant_001"],
      supersededDraftLeaseRefs: ["lease_001"],
    });
    const replay = await service.promoteEnvelope({
      envelopeId,
      promotedAt: "2026-04-12T09:06:00Z",
      tenantId: "tenant_001",
      requestType: "clinical_question",
      episodeFingerprint: "episode_fingerprint_001",
      promotionCommandActionRecordRef: "cmd_action_001",
      promotionCommandSettlementRecordRef: "cmd_settlement_001",
      replayClass: "duplicate_submit_same_tab",
    });

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.replayClass).toBe("duplicate_submit_same_tab");
    expect(replay.request.requestId).toBe(first.request.requestId);
    expect(replay.promotionRecord.promotionRecordId).toBe(first.promotionRecord.promotionRecordId);
    expect(first.request.toSnapshot().patientRef).toBeNull();
    expect(first.episode.toSnapshot().patientRef).toBeNull();
    expect(first.events.map((event) => event.eventType)).toEqual([
      "intake.promotion.started",
      "intake.promotion.superseded_grants_applied",
      "intake.promotion.committed",
      "intake.promotion.settled",
      "request.created",
      "request.submitted",
    ]);
    expect(replay.events.map((event) => event.eventType)).toEqual([
      "intake.promotion.replay_returned",
    ]);
    expect(store.getDraftMutabilitySnapshot(envelopeId)).toEqual({
      liveAccessGrantRefs: [],
      liveDraftLeaseRefs: [],
    });
    expect(store.listDraftMutabilitySupersessionReceipts()).toHaveLength(1);
  });

  it("serializes concurrent promotion attempts and resolves the authoritative request shell by every continuity key", async () => {
    const { service, store, envelopeId } = await seedPromotableEnvelope();
    store.seedDraftAccessGrant(envelopeId, "grant_race_001");
    store.seedDraftLease(envelopeId, "lease_race_001");

    const [left, right] = await Promise.all([
      service.promoteEnvelope({
        envelopeId,
        promotedAt: "2026-04-12T09:05:00Z",
        tenantId: "tenant_001",
        requestType: "clinical_question",
        episodeFingerprint: "episode_fingerprint_001",
        promotionCommandActionRecordRef: "cmd_action_001",
        promotionCommandSettlementRecordRef: "cmd_settlement_001",
        supersededAccessGrantRefs: ["grant_race_001"],
        supersededDraftLeaseRefs: ["lease_race_001"],
      }),
      service.promoteEnvelope({
        envelopeId,
        promotedAt: "2026-04-12T09:05:01Z",
        tenantId: "tenant_001",
        requestType: "clinical_question",
        episodeFingerprint: "episode_fingerprint_001",
        promotionCommandActionRecordRef: "cmd_action_001",
        promotionCommandSettlementRecordRef: "cmd_settlement_001",
        replayClass: "duplicate_submit_cross_tab",
      }),
    ]);

    const committed = left.replayed ? right : left;
    const replay = left.replayed ? left : right;
    const promotionSnapshot = committed.promotionRecord.toSnapshot();

    expect(committed.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.replayClass).toBe("duplicate_submit_cross_tab");
    expect(replay.request.requestId).toBe(committed.request.requestId);
    expect(
      (await store.listSubmissionPromotionRecords()).map((record) => record.promotionRecordId),
    ).toEqual([committed.promotionRecord.promotionRecordId]);

    const byEnvelope = await service.resolveAuthoritativeRequestShell({
      submissionEnvelopeRef: envelopeId,
    });
    const bySourceLineage = await service.resolveAuthoritativeRequestShell({
      sourceLineageRef: "source_lineage_001",
    });
    const byRequestLineage = await service.resolveAuthoritativeRequestShell({
      requestLineageRef: committed.requestLineage.requestLineageId,
    });
    const byReceipt = await service.resolveAuthoritativeRequestShell({
      receiptConsistencyKey: promotionSnapshot.receiptConsistencyKey,
    });
    const byStatus = await service.resolveAuthoritativeRequestShell({
      statusConsistencyKey: promotionSnapshot.statusConsistencyKey,
    });

    expect(byEnvelope.request.requestId).toBe(committed.request.requestId);
    expect(bySourceLineage.request.requestId).toBe(committed.request.requestId);
    expect(byRequestLineage.request.requestId).toBe(committed.request.requestId);
    expect(byReceipt.request.requestId).toBe(committed.request.requestId);
    expect(byStatus.request.requestId).toBe(committed.request.requestId);
    expect(byReceipt.redirectTarget).toBe("authoritative_request_shell");
  });

  it("reuses the same lineage for same-request continuation and branches only with explicit decisions", async () => {
    const { service, store, envelopeId } = await seedPromotableEnvelope();
    const promoted = await service.promoteEnvelope({
      envelopeId,
      promotedAt: "2026-04-12T09:05:00Z",
      tenantId: "tenant_001",
      requestType: "clinical_question",
      episodeFingerprint: "episode_fingerprint_001",
      promotionCommandActionRecordRef: "cmd_action_001",
      promotionCommandSettlementRecordRef: "cmd_settlement_001",
    });

    const continued = await service.continueRequestLineage({
      requestLineageId: promoted.requestLineage.requestLineageId,
      continuityWitnessClass: "workflow_return",
      continuityWitnessRef: "workflow_return_001",
      updatedAt: "2026-04-12T09:07:00Z",
    });

    const sameEpisodeRequest = RequestAggregate.create({
      requestId: "request_same_episode_branch",
      episodeId: promoted.episode.episodeId,
      originEnvelopeRef: promoted.envelope.envelopeId,
      promotionRecordRef: promoted.promotionRecord.promotionRecordId,
      tenantId: "tenant_001",
      sourceChannel: "self_service_form",
      originIngressRecordRef: "ingress_001",
      normalizedSubmissionRef: "normalized_002",
      requestType: "same_episode_follow_up",
      requestLineageRef: "placeholder_lineage_same_episode",
      createdAt: "2026-04-12T09:08:00Z",
    });
    await store.saveRequest(sameEpisodeRequest);

    const relatedEpisode = EpisodeAggregate.create({
      episodeId: "episode_related_001",
      episodeFingerprint: "episode_fingerprint_related_001",
      openedAt: "2026-04-12T09:08:00Z",
      originRequestRef: sameEpisodeRequest.requestId,
    });
    await store.saveEpisode(relatedEpisode);
    const relatedEpisodeRequest = RequestAggregate.create({
      requestId: "request_related_episode_branch",
      episodeId: relatedEpisode.episodeId,
      originEnvelopeRef: promoted.envelope.envelopeId,
      promotionRecordRef: promoted.promotionRecord.promotionRecordId,
      tenantId: "tenant_001",
      sourceChannel: "self_service_form",
      originIngressRecordRef: "ingress_001",
      normalizedSubmissionRef: "normalized_003",
      requestType: "related_episode_follow_up",
      requestLineageRef: "placeholder_lineage_related_episode",
      createdAt: "2026-04-12T09:08:30Z",
    });
    await store.saveRequest(relatedEpisodeRequest);

    const sameEpisodeBranch = await service.branchRequestLineage({
      parentRequestLineageId: promoted.requestLineage.requestLineageId,
      requestRef: sameEpisodeRequest.requestId,
      branchClass: "same_episode_branch",
      branchDecisionRef: "branch_decision_same_episode",
      continuityWitnessClass: "duplicate_resolution",
      continuityWitnessRef: "duplicate_resolution_001",
      createdAt: "2026-04-12T09:09:00Z",
    });

    const relatedEpisodeBranch = await service.branchRequestLineage({
      parentRequestLineageId: promoted.requestLineage.requestLineageId,
      requestRef: relatedEpisodeRequest.requestId,
      branchClass: "related_episode_branch",
      branchDecisionRef: "branch_decision_related_episode",
      continuityWitnessClass: "manual_link",
      continuityWitnessRef: "manual_link_001",
      episodeRef: relatedEpisode.episodeId,
      createdAt: "2026-04-12T09:10:00Z",
    });

    expect(continued.requestLineage.requestLineageId).toBe(
      promoted.requestLineage.requestLineageId,
    );
    expect(sameEpisodeBranch.requestLineage.toSnapshot().branchDecisionRef).toBe(
      "branch_decision_same_episode",
    );
    expect(relatedEpisodeBranch.requestLineage.toSnapshot().branchDecisionRef).toBe(
      "branch_decision_related_episode",
    );
    expect(relatedEpisodeBranch.episode.episodeId).toBe(relatedEpisode.episodeId);
  });

  it("lets child-case links summarize ownership without rewriting canonical request workflow", async () => {
    const { service, envelopeId } = await seedPromotableEnvelope();
    const promoted = await service.promoteEnvelope({
      envelopeId,
      promotedAt: "2026-04-12T09:05:00Z",
      tenantId: "tenant_001",
      requestType: "clinical_question",
      episodeFingerprint: "episode_fingerprint_001",
      promotionCommandActionRecordRef: "cmd_action_001",
      promotionCommandSettlementRecordRef: "cmd_settlement_001",
    });

    const proposed = await service.proposeLineageCaseLink({
      requestLineageRef: promoted.requestLineage.requestLineageId,
      episodeRef: promoted.episode.episodeId,
      requestRef: promoted.request.requestId,
      caseFamily: "booking",
      domainCaseRef: "booking_case_001",
      linkReason: "direct_handoff",
      openedAt: "2026-04-12T09:06:00Z",
    });
    await service.transitionLineageCaseLink({
      lineageCaseLinkId: proposed.link.lineageCaseLinkId,
      nextState: "acknowledged",
      updatedAt: "2026-04-12T09:06:30Z",
    });
    const activated = await service.transitionLineageCaseLink({
      lineageCaseLinkId: proposed.link.lineageCaseLinkId,
      nextState: "active",
      updatedAt: "2026-04-12T09:07:00Z",
      latestMilestoneRef: "booking_handoff_001",
    });

    expect(activated.request.workflowState).toBe("submitted");
    expect(activated.request.toSnapshot().latestLineageCaseLinkRef).toBe(
      proposed.link.lineageCaseLinkId,
    );
    expect(activated.request.toSnapshot().activeLineageCaseLinkRefs).toEqual([
      proposed.link.lineageCaseLinkId,
    ]);
  });
});
