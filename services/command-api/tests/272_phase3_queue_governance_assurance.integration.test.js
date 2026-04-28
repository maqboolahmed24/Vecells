import { describe, expect, it } from "vitest";

import { validateQueueConsumerSnapshotRefs } from "../../../packages/api-contracts/src/queue-ranking.ts";
import { createDuplicateReviewApplication } from "../src/duplicate-review.ts";
import { createPhase3TriageKernelApplication } from "../src/phase3-triage-kernel.ts";
import { createQueueRankingApplication } from "../src/queue-ranking.ts";
import { createReservationQueueControlApplication } from "../src/reservation-queue-control.ts";

function createTaskInput(seed) {
  return {
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    episodeId: `episode_${seed}`,
    requestLineageRef: `lineage_${seed}`,
    queueKey: `queue_${seed}`,
    sourceQueueRankSnapshotRef: `rank_${seed}`,
    returnAnchorRef: `queue-row-${seed}`,
    returnAnchorTupleHash: `queue-row-${seed}::tuple`,
    selectedAnchorRef: `queue-row-${seed}`,
    selectedAnchorTupleHash: `queue-row-${seed}::tuple`,
    workspaceTrustEnvelopeRef: `trust_${seed}`,
    surfaceRouteContractRef: `route_contract_${seed}`,
    surfacePublicationRef: `publication_${seed}`,
    runtimePublicationBundleRef: `runtime_${seed}`,
    taskCompletionSettlementEnvelopeRef: `completion_${seed}`,
    createdAt: "2026-04-18T10:00:00.000Z",
  };
}

function buildReplayFactCut(sourceFactCutRef, generatedAt, includeEscalated = false) {
  const taskFacts = [
    {
      taskRef: "task_a",
      queueEnteredAt: "2026-04-18T08:10:00Z",
      slaTargetAt: "2026-04-18T11:00:00Z",
      expectedHandleMinutes: 15,
      clinicalPriorityBand: 4,
      residualRisk: 0.61,
      contactRisk: 0.22,
      assimilationPending: false,
      preemptionPending: false,
      escalated: false,
      returned: true,
      evidenceDeltaSeverity: 0.65,
      urgencyCarry: 0.15,
      vulnerability: 0.1,
      coverageFit: 0.82,
      duplicateReviewFlag: true,
      fairnessBandRef: "band_returned_review",
      trustState: "trusted",
      missingTrustInputRefs: [],
      scopeExcluded: false,
      archetypeRef: "duplicate_review",
    },
    {
      taskRef: "task_b",
      queueEnteredAt: "2026-04-18T08:20:00Z",
      slaTargetAt: "2026-04-18T11:10:00Z",
      expectedHandleMinutes: 12,
      clinicalPriorityBand: 3,
      residualRisk: 0.4,
      contactRisk: 0.18,
      assimilationPending: false,
      preemptionPending: false,
      escalated: false,
      returned: false,
      evidenceDeltaSeverity: 0,
      urgencyCarry: 0.08,
      vulnerability: 0.06,
      coverageFit: 0.86,
      duplicateReviewFlag: false,
      fairnessBandRef: "band_risk_attention",
      trustState: "trusted",
      missingTrustInputRefs: [],
      scopeExcluded: false,
      archetypeRef: "routine_triage",
    },
    {
      taskRef: "task_c",
      queueEnteredAt: "2026-04-18T08:30:00Z",
      slaTargetAt: "2026-04-18T11:20:00Z",
      expectedHandleMinutes: 11,
      clinicalPriorityBand: 2,
      residualRisk: 0.2,
      contactRisk: 0.1,
      assimilationPending: false,
      preemptionPending: true,
      escalated: false,
      returned: false,
      evidenceDeltaSeverity: 0,
      urgencyCarry: 0,
      vulnerability: 0.02,
      coverageFit: 0.9,
      duplicateReviewFlag: false,
      fairnessBandRef: "band_routine",
      trustState: "trusted",
      missingTrustInputRefs: [],
      scopeExcluded: false,
      archetypeRef: "routine_triage",
    },
  ];

  if (includeEscalated) {
    taskFacts.push({
      taskRef: "task_d",
      queueEnteredAt: "2026-04-18T08:05:00Z",
      slaTargetAt: "2026-04-18T10:50:00Z",
      expectedHandleMinutes: 13,
      clinicalPriorityBand: 5,
      residualRisk: 0.8,
      contactRisk: 0.31,
      assimilationPending: false,
      preemptionPending: false,
      escalated: true,
      returned: false,
      evidenceDeltaSeverity: 0,
      urgencyCarry: 0.21,
      vulnerability: 0.12,
      coverageFit: 0.8,
      duplicateReviewFlag: false,
      fairnessBandRef: "band_routine",
      trustState: "trusted",
      missingTrustInputRefs: [],
      scopeExcluded: false,
      archetypeRef: "triage_safety_escalation",
    });
  }

  return {
    queueKey: "repair",
    asOfAt: "2026-04-18T09:00:00Z",
    generatedAt,
    sourceFactCutRef,
    trustInputRefs: ["trust_a", "trust_b"],
    taskFacts,
  };
}

describe("272 phase 3 queue governance assurance", () => {
  it("replays the same fact cut deterministically, holds preemption work out of the routine queue, and fails closed on mixed snapshot truth", async () => {
    const application = createQueueRankingApplication();

    const first = await application.refreshQueueSnapshot(
      buildReplayFactCut("fact_cut_custom", "2026-04-18T09:00:05Z"),
    );
    const second = await application.refreshQueueSnapshot(
      buildReplayFactCut("fact_cut_custom", "2026-04-18T09:00:06Z"),
    );
    const changed = await application.refreshQueueSnapshot(
      buildReplayFactCut("fact_cut_custom_2", "2026-04-18T09:05:00Z", true),
    );

    expect(first.snapshot.rowOrderHash).toBe("queue-row-order::350468f55e725562872644da2eddbbd2");
    expect(second.snapshot.rowOrderHash).toBe(first.snapshot.rowOrderHash);
    expect(first.entries.map((entry) => entry.taskRef)).toEqual(["task_a", "task_b", "task_c"]);
    expect(first.entries.at(-1)?.eligibilityState).toBe("held_preemption");
    expect(first.snapshot.eligibleTaskRefs).toEqual(["task_a", "task_b"]);
    expect(first.snapshot.excludedTaskRefs).toEqual(["task_c"]);
    expect(first.entries.map((entry) => entry.explanationPayloadRef)).toEqual(
      second.entries.map((entry) => entry.explanationPayloadRef),
    );

    expect(changed.snapshot.rowOrderHash).toBe("queue-row-order::8889e1d16eb9463b7ed23d67c3180ce9");
    expect(changed.snapshot.rowOrderHash).not.toBe(first.snapshot.rowOrderHash);
    expect(changed.entries.map((entry) => entry.taskRef)).toEqual([
      "task_d",
      "task_a",
      "task_b",
      "task_c",
    ]);
    expect(first.snapshot.rowOrderHash).toBe("queue-row-order::350468f55e725562872644da2eddbbd2");

    expect(() =>
      validateQueueConsumerSnapshotRefs({
        sourceQueueRankSnapshotRef: first.snapshot.rankSnapshotId,
        queueRowSnapshotRefs: [first.snapshot.rankSnapshotId],
        previewSnapshotRefs: [first.snapshot.rankSnapshotId],
        nextTaskSnapshotRefs: [first.snapshot.rankSnapshotId, changed.snapshot.rankSnapshotId],
      }),
    ).toThrow(/Mixed-snapshot queue truth is forbidden/i);
  });

  it("keeps fairness honest, suggestions downstream, and duplicate review authoritative", async () => {
    const queueApplication = createQueueRankingApplication();
    const overload = await queueApplication.runScenarioById("overload_critical_posture");
    const fairness = await queueApplication.runScenarioById("fairness_band_rotation");
    const suggestions = await queueApplication.runScenarioById("reviewer_suggestion_downstream_only");

    expect(overload.overloadState).toBe("overload_critical");
    expect(overload.rowOrderHash).toBe("queue-row-order::dc548765637ca546ce440856c19698c8");
    expect(fairness.orderedTaskRefs).toEqual([
      "task_fair_return",
      "task_fair_risk",
      "task_fair_routine",
      "task_fair_low",
    ]);
    expect(suggestions.rowOrderHash).toBe("queue-row-order::46e39d13703aa6549ded8ab79502de2f");
    expect(suggestions.suggestionSnapshotId).toBeTruthy();
    expect(suggestions.governedAutoClaimRefs).toEqual([
      "task_suggest_escalated",
      "task_suggest_returned",
      "task_suggest_routine",
    ]);

    const duplicateApplication = createDuplicateReviewApplication();
    const initial = await duplicateApplication.queryTaskDuplicateReview(
      "phase3_duplicate_review_task_234_primary",
    );

    expect(initial.snapshot.authorityBoundary.duplicateClusterAuthority).toBe("DuplicateCluster");
    expect(initial.snapshot.authorityBoundary.sameRequestAttachAuthority).toBe(
      "DuplicateResolutionDecision",
    );
    expect(initial.snapshot.authorityBoundary.replayAuthority).toBe("IdempotencyRecord");
    expect(initial.snapshot.queueRelevance.queueBlockingState).toBe("explicit_review_required");

    const attached = await duplicateApplication.resolveTaskDuplicateReview(
      "phase3_duplicate_review_task_234_primary",
      {
        duplicateReviewSnapshotRef: initial.snapshot.duplicateReviewSnapshotId,
        decisionClass: "same_request_attach",
        winningPairEvidenceRef:
          initial.snapshot.winningPairEvidenceRef ?? initial.snapshot.pairEvidenceRefs[0],
        continuityWitnessClass: "workflow_return",
        continuityWitnessRef: "witness_272_workflow_return",
        reviewMode: "human_review",
        reasonCodes: ["WORKFLOW_RETURN_CONFIRMED"],
        decidedByRef: "reviewer_272_duplicate",
        decidedAt: "2026-04-18T09:11:00.000Z",
      },
    );

    const reversed = await duplicateApplication.resolveTaskDuplicateReview(
      "phase3_duplicate_review_task_234_primary",
      {
        duplicateReviewSnapshotRef: attached.snapshot.duplicateReviewSnapshotId,
        decisionClass: "separate_request",
        winningPairEvidenceRef:
          attached.snapshot.winningPairEvidenceRef ?? attached.snapshot.pairEvidenceRefs[0],
        reviewMode: "human_review",
        reasonCodes: ["LATE_EVIDENCE_DELTA", "ATTACH_NO_LONGER_SAFE"],
        decidedByRef: "reviewer_272_duplicate",
        decidedAt: "2026-04-18T09:12:00.000Z",
      },
    );

    expect(attached.decision.decisionClass).toBe("same_request_attach");
    expect(reversed.decision.decisionClass).toBe("separate_request");
    expect(reversed.supersededDecisionRef).toBe(attached.decision.duplicateResolutionDecisionId);
    expect(reversed.invalidations.map((entry) => entry.targetType)).toEqual(
      expect.arrayContaining([
        "endpoint_decision",
        "approval_checkpoint",
        "endpoint_outcome_preview",
        "booking_intent",
        "pharmacy_intent",
        "analytics_join",
        "workspace_assumption",
        "handoff_seed",
      ]),
    );
  });

  it("serializes claim races, preserves stale-owner continuity, blocks next-task launch on stale owner, and keeps release continuity explicit", async () => {
    const queueApplication = createQueueRankingApplication();
    const claimRace = await queueApplication.runScenarioById("soft_claim_race_serialized");
    expect(claimRace.softClaimOutcome).toBe("blocked_race");
    expect(claimRace.rowOrderHash).toBe("queue-row-order::f9011dc3da77d857333bba46794880f8");

    const triageApplication = createPhase3TriageKernelApplication();
    await triageApplication.createTask(createTaskInput("272_takeover"));
    await triageApplication.moveTaskToQueue({
      taskId: "task_272_takeover",
      actorRef: "actor_272",
      queuedAt: "2026-04-18T10:01:00.000Z",
    });
    const claimed = await triageApplication.claimTask({
      taskId: "task_272_takeover",
      actorRef: "actor_272",
      claimedAt: "2026-04-18T10:02:00.000Z",
    });
    await triageApplication.enterReview({
      taskId: "task_272_takeover",
      actorRef: "actor_272",
      openedAt: "2026-04-18T10:03:00.000Z",
      staffWorkspaceConsistencyProjectionRef: "workspace_consistency_272",
      workspaceSliceTrustProjectionRef: "workspace_slice_272",
      audienceSurfaceRuntimeBindingRef: "runtime_binding_272",
      reviewActionLeaseRef: "review_action_272",
      selectedAnchorRef: "anchor_review_272",
      selectedAnchorTupleHashRef: "anchor_review_hash_272",
    });
    const stale = await triageApplication.markStaleOwnerDetected({
      taskId: "task_272_takeover",
      authorizedByRef: "supervisor_272_takeover",
      detectedAt: "2026-04-18T10:06:00.000Z",
      breakReason: "queue_governance_suite_recovery",
      breakGuardSeconds: 0,
    });
    const takeover = await triageApplication.takeOverStaleTask({
      taskId: "task_272_takeover",
      actorRef: "reviewer_replacement_272",
      authorizedByRef: "supervisor_272_takeover",
      takeoverAt: "2026-04-18T10:07:00.000Z",
      takeoverReason: "governed_supervisor_takeover",
      ownerSessionRef: "replacement_session_272",
      leaseTtlSeconds: 300,
    });

    expect(stale.task.ownershipState).toBe("broken");
    expect(stale.task.staleOwnerRecoveryRef).toBe(
      "command_api_phase3_triage_kernel_stale_ownership_recovery_0001",
    );
    expect(stale.task.launchContextRef).toBe(claimed.task.launchContextRef);
    expect(stale.task.currentLineageFenceEpoch).toBe(2);
    expect(takeover.task.assignedTo).toBe("reviewer_replacement_272");
    expect(takeover.task.ownershipEpoch).toBe(2);
    expect(takeover.task.currentLineageFenceEpoch).toBe(3);
    expect(takeover.task.launchContextRef).toBe(claimed.task.launchContextRef);

    await triageApplication.createTask(createTaskInput("272_release"));
    await triageApplication.moveTaskToQueue({
      taskId: "task_272_release",
      actorRef: "actor_272_release",
      queuedAt: "2026-04-18T11:01:00.000Z",
    });
    const releaseClaimed = await triageApplication.claimTask({
      taskId: "task_272_release",
      actorRef: "actor_272_release",
      claimedAt: "2026-04-18T11:02:00.000Z",
    });
    await triageApplication.enterReview({
      taskId: "task_272_release",
      actorRef: "actor_272_release",
      openedAt: "2026-04-18T11:03:00.000Z",
      staffWorkspaceConsistencyProjectionRef: "workspace_consistency_272_release",
      workspaceSliceTrustProjectionRef: "workspace_slice_272_release",
      audienceSurfaceRuntimeBindingRef: "runtime_binding_272_release",
      reviewActionLeaseRef: "review_action_272_release",
      selectedAnchorRef: "anchor_review_272_release",
      selectedAnchorTupleHashRef: "anchor_review_hash_272_release",
    });
    const released = await triageApplication.releaseTask({
      taskId: "task_272_release",
      actorRef: "actor_272_release",
      releasedAt: "2026-04-18T11:04:00.000Z",
    });
    expect(released.task.ownershipState).toBe("releasing");
    expect(released.task.launchContextRef).toBe(releaseClaimed.task.launchContextRef);
    expect(released.transitionJournalEntry?.reasonCode).toBe("lease_release_requested");

    const reservationQueueControl = createReservationQueueControlApplication();
    const queueScenarios = await reservationQueueControl.simulation.runAllScenarios();
    const blockedNextTask = queueScenarios.find(
      (entry) => entry.scenarioId === "next_task_advice_blocked_on_stale_owner",
    );

    expect(blockedNextTask?.queueCommit?.snapshot.rowOrderHash).toBe(
      "queue-row-order::7119f3934a865b4911ecc9456087db5f",
    );
    expect(blockedNextTask?.advisory?.snapshot.advisoryState).toBe("blocked_stale_owner");
    expect(blockedNextTask?.advisory?.snapshot.blockedReasonRefs).toEqual([
      "stale_owner_recovery_required",
    ]);
    expect(blockedNextTask?.advisory?.snapshot.staleOwnerRecoveryRefs).toEqual([
      "owner_recovery_case_081",
    ]);
  });
});
