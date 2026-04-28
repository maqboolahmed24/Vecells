import { describe, expect, it } from "vitest";
import {
  createSubmissionBackboneApplication,
  submissionBackboneMigrationPlanRefs,
  submissionBackbonePersistenceTables,
} from "../src/submission-backbone.ts";
import { runAllSubmissionPromotionReplayScenarios } from "../src/submission-promotion-simulator.ts";

describe("submission backbone application seam", () => {
  it("composes the canonical submission-to-request promotion boundary", async () => {
    const application = createSubmissionBackboneApplication();

    const { envelope } = await application.commands.createEnvelope({
      sourceChannel: "self_service_form",
      initialSurfaceChannelProfile: "browser",
      intakeConvergenceContractRef: "icc_001",
      sourceLineageRef: "source_lineage_001",
      createdAt: "2026-04-12T10:00:00Z",
    });

    await application.commands.appendEnvelopeIngress({
      envelopeId: envelope.envelopeId,
      ingressRecordRef: "ingress_001",
      updatedAt: "2026-04-12T10:01:00Z",
    });
    await application.commands.attachEnvelopeEvidence({
      envelopeId: envelope.envelopeId,
      evidenceSnapshotRef: "snapshot_001",
      updatedAt: "2026-04-12T10:02:00Z",
    });
    await application.commands.attachEnvelopeNormalization({
      envelopeId: envelope.envelopeId,
      normalizedSubmissionRef: "normalized_001",
      updatedAt: "2026-04-12T10:03:00Z",
    });
    await application.commands.markEnvelopeReady({
      envelopeId: envelope.envelopeId,
      promotionDecisionRef: "promotion_decision_001",
      updatedAt: "2026-04-12T10:04:00Z",
    });

    const firstPromotion = await application.commands.promoteEnvelope({
      envelopeId: envelope.envelopeId,
      promotedAt: "2026-04-12T10:05:00Z",
      tenantId: "tenant_001",
      requestType: "clinical_question",
      episodeFingerprint: "episode_fingerprint_001",
      promotionCommandActionRecordRef: "action_001",
      promotionCommandSettlementRecordRef: "settlement_001",
    });
    const replayPromotion = await application.commands.promoteEnvelope({
      envelopeId: envelope.envelopeId,
      promotedAt: "2026-04-12T10:06:00Z",
      tenantId: "tenant_001",
      requestType: "clinical_question",
      episodeFingerprint: "episode_fingerprint_001",
      promotionCommandActionRecordRef: "action_001",
      promotionCommandSettlementRecordRef: "settlement_001",
    });

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/066_submission_promotion_exactly_once.sql",
    );
    expect(application.migrationPlanRefs).toEqual(submissionBackboneMigrationPlanRefs);
    expect(submissionBackbonePersistenceTables).toEqual([
      "submission_envelopes",
      "submission_promotion_records",
      "episodes",
      "requests",
      "request_lineages",
      "lineage_case_links",
    ]);
    expect(firstPromotion.replayed).toBe(false);
    expect(replayPromotion.replayed).toBe(true);
    expect(replayPromotion.request.requestId).toBe(firstPromotion.request.requestId);
    expect(replayPromotion.promotionRecord.promotionRecordId).toBe(
      firstPromotion.promotionRecord.promotionRecordId,
    );
    expect(replayPromotion.handoff.request.requestId).toBe(firstPromotion.request.requestId);
  });

  it("runs the replay simulator harness across same-tab, cross-tab, auth-return, support, and delayed retry paths", async () => {
    const results = await runAllSubmissionPromotionReplayScenarios();

    expect(results).toHaveLength(5);

    for (const result of results) {
      expect(result.replayed).toBe(true);
      expect(result.replayRequestId).toBe(result.committedRequestId);
      expect(result.transactionEvents).toContain("intake.promotion.started");
      expect(result.transactionEvents).toContain("intake.promotion.committed");
      expect(result.transactionEvents).toContain("intake.promotion.superseded_grants_applied");
    }

    const crossTab = results.find((result) => result.scenarioId === "cross_tab_submit_race");
    expect(crossTab?.replayEvents).toEqual(["intake.promotion.replay_returned"]);

    const supportResume = results.find(
      (result) => result.scenarioId === "support_resume_promoted_lineage",
    );
    expect(supportResume?.replayLookupField).toBe("sourceLineageRef");
    expect(supportResume?.replayEvents).toEqual(["authoritative_request_shell"]);
  });
});
