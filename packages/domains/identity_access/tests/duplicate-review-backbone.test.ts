import { describe, expect, it } from "vitest";
import {
  createDuplicateReviewAuthorityService,
  createDuplicateReviewStore,
  createDuplicateReviewSimulationHarness,
  createPhase3DuplicateReviewAuthorityService,
  createPhase3DuplicateReviewStore,
  recommendDuplicateResolution,
  validateDuplicateLedgerState,
  validateNonTransitiveDecision,
} from "../src/index.ts";
import { RequestAggregate, createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import { EpisodeAggregate } from "../src/submission-lineage-backbone";

async function seedRequest(
  store: ReturnType<typeof createDuplicateReviewStore>,
  requestId: string,
  episodeId: string,
  requestLineageRef: string,
) {
  const existingEpisode = await store.getEpisode(episodeId);
  if (!existingEpisode) {
    await store.saveEpisode(
      EpisodeAggregate.create({
        episodeId,
        episodeFingerprint: `fp_${episodeId}`,
        openedAt: "2026-04-12T17:00:00Z",
      }),
    );
  }
  const existingRequest = await store.getRequest(requestId);
  if (!existingRequest) {
    await store.saveRequest(
      RequestAggregate.create({
        requestId,
        episodeId,
        originEnvelopeRef: `envelope_${requestId}`,
        promotionRecordRef: `promotion_${requestId}`,
        tenantId: "tenant_070",
        sourceChannel: "self_service_form",
        originIngressRecordRef: `ingress_${requestId}`,
        normalizedSubmissionRef: `normalized_${requestId}`,
        requestType: "clinical_question",
        requestLineageRef,
        createdAt: "2026-04-12T17:00:00Z",
      }),
    );
  }
}

describe("duplicate review backbone", () => {
  it("requires an explicit continuity witness for same_request_attach", async () => {
    const store = createDuplicateReviewStore();
    await seedRequest(
      store,
      "request_070_attach_only",
      "episode_070_attach_only",
      "lineage_attach",
    );
    const authority = createDuplicateReviewAuthorityService(
      store,
      createDeterministicBackboneIdGenerator("par070_attach_only"),
    );

    const withoutWitness = await authority.assessIncomingDuplicate({
      incomingLineageRef: "lineage_070_attach_input",
      incomingSnapshotRef: "snapshot_070_attach_input",
      decidedByRef: "duplicate_governor_070",
      decidedAt: "2026-04-12T17:01:00Z",
      candidatePairs: [
        {
          candidateRequestRef: "request_070_attach_only",
          candidateEpisodeRef: "episode_070_attach_only",
          continuitySignalRefs: ["signal_070_attach"],
          relationModelVersionRef: "duplicate_model_070_v1",
          channelCalibrationRef: "duplicate_calibration_v1",
          piRetry: 0.04,
          piSameRequestAttach: 0.64,
          piSameEpisode: 0.19,
          piRelatedEpisode: 0.05,
          piNewEpisode: 0.08,
          classMargin: 0.21,
          candidateMargin: 0.27,
          uncertaintyScore: 0.08,
        },
      ],
    });

    expect(withoutWitness.decision.toSnapshot().decisionClass).toBe("review_required");
    expect(withoutWitness.cluster.toSnapshot().relationType).toBe("same_episode_candidate");

    const withWitness = await authority.assessIncomingDuplicate({
      incomingLineageRef: "lineage_070_attach_input_witness",
      incomingSnapshotRef: "snapshot_070_attach_input_witness",
      continuityWitnessClass: "workflow_return",
      continuityWitnessRef: "witness_070_workflow_return",
      decidedByRef: "duplicate_governor_070",
      decidedAt: "2026-04-12T17:02:00Z",
      candidatePairs: [
        {
          candidateRequestRef: "request_070_attach_only",
          candidateEpisodeRef: "episode_070_attach_only",
          continuitySignalRefs: ["signal_070_attach"],
          relationModelVersionRef: "duplicate_model_070_v1",
          channelCalibrationRef: "duplicate_calibration_v1",
          piRetry: 0.04,
          piSameRequestAttach: 0.64,
          piSameEpisode: 0.19,
          piRelatedEpisode: 0.05,
          piNewEpisode: 0.08,
          classMargin: 0.21,
          candidateMargin: 0.27,
          uncertaintyScore: 0.08,
        },
      ],
    });

    expect(withWitness.decision.toSnapshot().decisionClass).toBe("same_request_attach");
    expect(withWitness.decision.toSnapshot().continuityWitnessClass).toBe("workflow_return");
  });

  it("fails closed when near-equal candidates would otherwise become transitive proof", async () => {
    const store = createDuplicateReviewStore();
    await seedRequest(
      store,
      "request_070_conflict_unit_a",
      "episode_070_conflict_unit",
      "lineage_conflict_a",
    );
    await seedRequest(
      store,
      "request_070_conflict_unit_b",
      "episode_070_conflict_unit",
      "lineage_conflict_b",
    );
    const authority = createDuplicateReviewAuthorityService(
      store,
      createDeterministicBackboneIdGenerator("par070_conflict"),
    );

    const assessed = await authority.assessIncomingDuplicate({
      incomingLineageRef: "lineage_070_conflict_input",
      incomingSnapshotRef: "snapshot_070_conflict_input",
      decidedByRef: "duplicate_governor_070",
      decidedAt: "2026-04-12T17:05:00Z",
      candidatePairs: [
        {
          candidateRequestRef: "request_070_conflict_unit_a",
          candidateEpisodeRef: "episode_070_conflict_unit",
          conflictSignalRefs: ["conflict_signal_a"],
          relationModelVersionRef: "duplicate_model_070_v1",
          channelCalibrationRef: "duplicate_calibration_v1",
          piRetry: 0.03,
          piSameRequestAttach: 0.06,
          piSameEpisode: 0.32,
          piRelatedEpisode: 0.29,
          piNewEpisode: 0.3,
          classMargin: 0.03,
          candidateMargin: 0.01,
          uncertaintyScore: 0.34,
        },
        {
          candidateRequestRef: "request_070_conflict_unit_b",
          candidateEpisodeRef: "episode_070_conflict_unit",
          conflictSignalRefs: ["conflict_signal_b"],
          relationModelVersionRef: "duplicate_model_070_v1",
          channelCalibrationRef: "duplicate_calibration_v1",
          piRetry: 0.03,
          piSameRequestAttach: 0.05,
          piSameEpisode: 0.31,
          piRelatedEpisode: 0.3,
          piNewEpisode: 0.31,
          classMargin: 0.02,
          candidateMargin: 0.01,
          uncertaintyScore: 0.36,
        },
      ],
    });

    expect(assessed.decision.toSnapshot().decisionClass).toBe("review_required");
    expect(assessed.cluster.toSnapshot().instabilityState).toBe("blocked_conflict");

    const recommendation = recommendDuplicateResolution({
      pairEvidences: assessed.pairEvidences,
    });
    expect(recommendation.decisionClass).toBe("review_required");
  });

  it("supports reversible supersession without rewriting earlier duplicate truth", async () => {
    const store = createDuplicateReviewStore();
    await seedRequest(
      store,
      "request_070_reversible",
      "episode_070_reversible",
      "lineage_reversible",
    );
    const authority = createDuplicateReviewAuthorityService(
      store,
      createDeterministicBackboneIdGenerator("par070_reversible"),
    );

    const assessed = await authority.assessIncomingDuplicate({
      incomingLineageRef: "lineage_070_reversible_incoming",
      incomingSnapshotRef: "snapshot_070_reversible_incoming",
      continuityWitnessClass: "workflow_return",
      continuityWitnessRef: "witness_070_reversible",
      decidedByRef: "duplicate_governor_070",
      decidedAt: "2026-04-12T17:10:00Z",
      candidatePairs: [
        {
          candidateRequestRef: "request_070_reversible",
          candidateEpisodeRef: "episode_070_reversible",
          continuitySignalRefs: ["continuity_signal_070_reversible"],
          relationModelVersionRef: "duplicate_model_070_v1",
          channelCalibrationRef: "duplicate_calibration_v1",
          piRetry: 0.03,
          piSameRequestAttach: 0.62,
          piSameEpisode: 0.2,
          piRelatedEpisode: 0.05,
          piNewEpisode: 0.1,
          classMargin: 0.2,
          candidateMargin: 0.24,
          uncertaintyScore: 0.08,
        },
      ],
    });

    const reverted = await authority.revertDecision({
      clusterId: assessed.cluster.clusterId,
      duplicateResolutionDecisionId: assessed.decision.duplicateResolutionDecisionId,
      revertedAt: "2026-04-12T17:11:00Z",
    });

    expect(reverted.decision.toSnapshot().decisionState).toBe("reverted");
    expect(reverted.cluster.toSnapshot().reviewStatus).toBe("open");

    const reapplied = await authority.applyResolutionDecision({
      clusterId: assessed.cluster.clusterId,
      decisionClass: "same_episode_link",
      winningPairEvidenceRef: assessed.pairEvidences[0]!.pairEvidenceId,
      reviewMode: "human_review",
      reasonCodes: ["MANUAL_REVIEW_CONFIRMED_SAME_EPISODE"],
      decidedByRef: "clinician_reviewer_070",
      decidedAt: "2026-04-12T17:12:00Z",
    });

    expect(reapplied.decision.toSnapshot().decisionClass).toBe("same_episode_link");
    expect(reapplied.cluster.toSnapshot().currentResolutionDecisionRef).toBe(
      reapplied.decision.duplicateResolutionDecisionId,
    );
    expect(reapplied.cluster.toSnapshot().resolutionDecisionRefs).toContain(
      assessed.decision.duplicateResolutionDecisionId,
    );
    expect(reapplied.cluster.toSnapshot().resolutionDecisionRefs).toContain(
      reapplied.decision.duplicateResolutionDecisionId,
    );
  });

  it("keeps the deterministic simulator and ledger validator coherent", async () => {
    const harness = createDuplicateReviewSimulationHarness();
    const results = await harness.runAllScenarios();
    const issues = await validateDuplicateLedgerState(
      (harness as unknown as { repositories: ReturnType<typeof createDuplicateReviewStore> })
        .repositories,
    );

    expect(results).toHaveLength(6);
    expect(results.map((result) => result.scenarioId)).toEqual([
      "exact_retry_collapse",
      "same_request_continuation_with_witness",
      "same_episode_candidate_high_similarity",
      "related_episode_link",
      "clear_separate_request",
      "conflicting_candidates_low_margin",
    ]);
    expect(issues).toEqual([]);
  });

  it("rejects manual auto-settlement when a competing candidate remains nearly equivalent", async () => {
    const store = createDuplicateReviewStore();
    await seedRequest(
      store,
      "request_070_manual_competition_a",
      "episode_070_manual_competition",
      "lineage_manual_a",
    );
    await seedRequest(
      store,
      "request_070_manual_competition_b",
      "episode_070_manual_competition",
      "lineage_manual_b",
    );
    const authority = createDuplicateReviewAuthorityService(
      store,
      createDeterministicBackboneIdGenerator("par070_manual_competition"),
    );

    const assessed = await authority.assessIncomingDuplicate({
      incomingLineageRef: "lineage_070_manual_competition",
      incomingSnapshotRef: "snapshot_070_manual_competition",
      decidedByRef: "duplicate_governor_070",
      decidedAt: "2026-04-12T17:20:00Z",
      candidatePairs: [
        {
          candidateRequestRef: "request_070_manual_competition_a",
          candidateEpisodeRef: "episode_070_manual_competition",
          relationModelVersionRef: "duplicate_model_070_v1",
          channelCalibrationRef: "duplicate_calibration_v1",
          piRetry: 0.02,
          piSameRequestAttach: 0.11,
          piSameEpisode: 0.45,
          piRelatedEpisode: 0.14,
          piNewEpisode: 0.28,
          classMargin: 0.07,
          candidateMargin: 0.03,
          uncertaintyScore: 0.21,
        },
        {
          candidateRequestRef: "request_070_manual_competition_b",
          candidateEpisodeRef: "episode_070_manual_competition",
          relationModelVersionRef: "duplicate_model_070_v1",
          channelCalibrationRef: "duplicate_calibration_v1",
          piRetry: 0.02,
          piSameRequestAttach: 0.1,
          piSameEpisode: 0.44,
          piRelatedEpisode: 0.15,
          piNewEpisode: 0.29,
          classMargin: 0.06,
          candidateMargin: 0.02,
          uncertaintyScore: 0.22,
        },
      ],
    });

    expect(() =>
      validateNonTransitiveDecision({
        decisionClass: "same_episode_link",
        winningPairEvidence: assessed.pairEvidences[0]!,
        relatedEvidence: assessed.pairEvidences,
        cluster: assessed.cluster,
      }),
    ).toThrow(/near-equal competing pair evidence/i);
  });

  it("publishes a task-scoped DuplicateReviewSnapshot with explicit authority boundaries", async () => {
    const store = createPhase3DuplicateReviewStore();
    await seedRequest(store, "request_234_snapshot_primary", "episode_234_snapshot", "lineage_234_a");
    await seedRequest(store, "request_234_snapshot_competing", "episode_234_snapshot", "lineage_234_b");
    const authority = createDuplicateReviewAuthorityService(
      store,
      createDeterministicBackboneIdGenerator("par234_snapshot_authority"),
    );
    const phase3Authority = createPhase3DuplicateReviewAuthorityService(
      store,
      createDeterministicBackboneIdGenerator("par234_snapshot_phase3"),
    );

    const assessed = await authority.assessIncomingDuplicate({
      incomingLineageRef: "lineage_234_snapshot_incoming",
      incomingSnapshotRef: "snapshot_234_snapshot_incoming",
      decidedByRef: "duplicate_governor_234",
      decidedAt: "2026-04-16T11:20:00Z",
      reviewMode: "human_review",
      candidatePairs: [
        {
          pairEvidenceId: "pair_evidence_234_snapshot_primary",
          candidateRequestRef: "request_234_snapshot_primary",
          candidateEpisodeRef: "episode_234_snapshot",
          continuitySignalRefs: ["workflow_return_signal_234_snapshot_primary"],
          relationModelVersionRef: "duplicate_model_234_v1",
          channelCalibrationRef: "duplicate_calibration_v1",
          piRetry: 0.03,
          piSameRequestAttach: 0.67,
          piSameEpisode: 0.15,
          piRelatedEpisode: 0.04,
          piNewEpisode: 0.11,
          classMargin: 0.23,
          candidateMargin: 0.29,
          uncertaintyScore: 0.08,
        },
        {
          pairEvidenceId: "pair_evidence_234_snapshot_competing",
          candidateRequestRef: "request_234_snapshot_competing",
          candidateEpisodeRef: "episode_234_snapshot",
          continuitySignalRefs: ["workflow_return_signal_234_snapshot_competing"],
          relationModelVersionRef: "duplicate_model_234_v1",
          channelCalibrationRef: "duplicate_calibration_v1",
          piRetry: 0.02,
          piSameRequestAttach: 0.21,
          piSameEpisode: 0.41,
          piRelatedEpisode: 0.08,
          piNewEpisode: 0.28,
          classMargin: 0.15,
          candidateMargin: 0.14,
          uncertaintyScore: 0.16,
        },
      ],
    });

    const snapshot = await phase3Authority.publishDuplicateReviewSnapshot({
      taskId: "phase3_duplicate_snapshot_task",
      duplicateClusterRef: assessed.cluster.clusterId,
      renderedAt: "2026-04-16T11:21:00Z",
    });

    expect(snapshot.toSnapshot().authorityBoundary.duplicateClusterAuthority).toBe("DuplicateCluster");
    expect(snapshot.toSnapshot().authorityBoundary.sameRequestAttachAuthority).toBe(
      "DuplicateResolutionDecision",
    );
    expect(snapshot.toSnapshot().authorityBoundary.replayAuthority).toBe("IdempotencyRecord");
    expect(snapshot.toSnapshot().queueRelevance.queueBlockingState).toBe(
      "explicit_review_required",
    );
    expect(snapshot.toSnapshot().workspaceRelevance.actionScope).toBe("resolve_duplicate_cluster");
    expect(snapshot.toSnapshot().candidateMembers).toHaveLength(2);
    expect(snapshot.toSnapshot().currentInvalidationBurden.totalCount).toBe(0);
    expect(assessed.pairEvidences[0]!.toSnapshot().version).toBe(1);
    expect(assessed.pairEvidences[0]!.toSnapshot().pairEvidenceId).toBe(
      "pair_evidence_234_snapshot_primary",
    );
  });

  it("emits append-only invalidation records when duplicate truth is overturned", async () => {
    const store = createPhase3DuplicateReviewStore();
    await seedRequest(store, "request_234_invalidation_primary", "episode_234_invalidation", "lineage_234_inv_a");
    const authority = createDuplicateReviewAuthorityService(
      store,
      createDeterministicBackboneIdGenerator("par234_invalidation_authority"),
    );
    const phase3Authority = createPhase3DuplicateReviewAuthorityService(
      store,
      createDeterministicBackboneIdGenerator("par234_invalidation_phase3"),
    );

    const assessed = await authority.assessIncomingDuplicate({
      incomingLineageRef: "lineage_234_invalidation_incoming",
      incomingSnapshotRef: "snapshot_234_invalidation_incoming",
      continuityWitnessClass: "workflow_return",
      continuityWitnessRef: "witness_234_invalidation",
      decidedByRef: "duplicate_governor_234",
      decidedAt: "2026-04-16T11:30:00Z",
      candidatePairs: [
        {
          pairEvidenceId: "pair_evidence_234_invalidation_primary",
          candidateRequestRef: "request_234_invalidation_primary",
          candidateEpisodeRef: "episode_234_invalidation",
          continuitySignalRefs: ["workflow_return_signal_234_invalidation"],
          relationModelVersionRef: "duplicate_model_234_v1",
          channelCalibrationRef: "duplicate_calibration_v1",
          piRetry: 0.03,
          piSameRequestAttach: 0.66,
          piSameEpisode: 0.17,
          piRelatedEpisode: 0.04,
          piNewEpisode: 0.1,
          classMargin: 0.22,
          candidateMargin: 0.27,
          uncertaintyScore: 0.07,
        },
      ],
    });

    const currentSnapshot = await phase3Authority.publishDuplicateReviewSnapshot({
      taskId: "phase3_duplicate_invalidation_task",
      duplicateClusterRef: assessed.cluster.clusterId,
      renderedAt: "2026-04-16T11:31:00Z",
    });

    const resolved = await phase3Authority.resolveDuplicateReview({
      taskId: "phase3_duplicate_invalidation_task",
      duplicateClusterRef: assessed.cluster.clusterId,
      duplicateReviewSnapshotRef: currentSnapshot.duplicateReviewSnapshotId,
      decisionClass: "separate_request",
      winningPairEvidenceRef: assessed.pairEvidences[0]!.pairEvidenceId,
      reviewMode: "human_review",
      reasonCodes: ["LATE_EVIDENCE_DELTA", "ATTACH_NO_LONGER_SAFE"],
      decidedByRef: "reviewer_234_primary",
      decidedAt: "2026-04-16T11:32:00Z",
    });

    const decisions = await store.listDuplicateResolutionDecisionsForCluster(assessed.cluster.clusterId);
    expect(decisions).toHaveLength(2);
    expect(resolved.supersededDecision?.toSnapshot().decisionState).toBe("superseded");
    expect(resolved.decision.toSnapshot().decisionClass).toBe("separate_request");
    expect(resolved.invalidations.map((entry) => entry.toSnapshot().targetType)).toEqual(
      expect.arrayContaining([
        "approval_checkpoint",
        "endpoint_outcome_preview",
        "booking_intent",
        "pharmacy_intent",
        "workspace_assumption",
      ]),
    );
    expect(resolved.snapshot.toSnapshot().currentInvalidationBurden.totalCount).toBe(
      resolved.invalidations.length,
    );
    expect(resolved.decision.toSnapshot().downstreamInvalidationRefs).toHaveLength(
      resolved.invalidations.length,
    );
  });
});
