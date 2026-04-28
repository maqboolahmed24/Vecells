import { describe, expect, it } from "vitest";
import {
  QueueRankPlanDocument,
  createDeterministicQueueRankingIdGenerator,
  createQueueRankingAuthorityService,
  createQueueRankingStore,
  queueDefaultPlan,
  validateQueueAssignmentSuggestionIsolation,
  validateQueueConsumerSnapshotRefs,
} from "../src/queue-ranking.ts";

function makeFactCut(overrides?: {
  generatedAt?: string;
  asOfAt?: string;
  telemetry?: {
    criticalArrivalRatePerHour: number;
    empiricalServiceRatePerHour: number;
    activeReviewerCount: number;
  } | null;
}) {
  return {
    queueRef: "queue_staff_review_north",
    queueFamilyRef: queueDefaultPlan.queueFamilyRef,
    sourceFactCutRef: "fact_cut_073_v1",
    asOfAt: overrides?.asOfAt ?? "2026-04-12T09:00:00Z",
    generatedAt: overrides?.generatedAt ?? "2026-04-12T09:00:05Z",
    trustInputRefs: ["trust_slice_queue", "trust_slice_reachability"],
    telemetry:
      overrides?.telemetry === undefined
        ? {
            criticalArrivalRatePerHour: 0.4,
            empiricalServiceRatePerHour: 1.2,
            activeReviewerCount: 4,
          }
        : overrides.telemetry,
    taskFacts: [
      {
        taskRef: "task_escalated",
        queueEnteredAt: "2026-04-12T08:10:00Z",
        slaTargetAt: "2026-04-12T10:30:00Z",
        expectedHandleMinutes: 18,
        clinicalPriorityBand: 5,
        residualRisk: 0.92,
        contactRisk: 0.2,
        assimilationPending: false,
        preemptionPending: false,
        escalated: true,
        returned: false,
        evidenceDeltaSeverity: 0,
        urgencyCarry: 0.6,
        vulnerability: 0.3,
        coverageFit: 0.55,
        duplicateReviewFlag: false,
        fairnessBandRef: "band_routine",
        trustState: "trusted",
        missingTrustInputRefs: [],
        scopeExcluded: false,
        archetypeRef: "triage_safety_escalation",
      },
      {
        taskRef: "task_duplicate",
        queueEnteredAt: "2026-04-12T07:40:00Z",
        slaTargetAt: "2026-04-12T09:45:00Z",
        expectedHandleMinutes: 12,
        clinicalPriorityBand: 4,
        residualRisk: 0.58,
        contactRisk: 0.32,
        assimilationPending: false,
        preemptionPending: false,
        escalated: false,
        returned: true,
        evidenceDeltaSeverity: 0.7,
        urgencyCarry: 0.3,
        vulnerability: 0.2,
        coverageFit: 0.74,
        duplicateReviewFlag: true,
        fairnessBandRef: "band_returned_review",
        trustState: "trusted",
        missingTrustInputRefs: [],
        scopeExcluded: false,
        lastMaterialReturnAt: "2026-04-12T08:45:00Z",
        archetypeRef: "duplicate_review",
      },
      {
        taskRef: "task_routine_a",
        queueEnteredAt: "2026-04-12T07:20:00Z",
        slaTargetAt: "2026-04-12T12:00:00Z",
        expectedHandleMinutes: 14,
        clinicalPriorityBand: 3,
        residualRisk: 0.28,
        contactRisk: 0.24,
        assimilationPending: false,
        preemptionPending: false,
        escalated: false,
        returned: false,
        evidenceDeltaSeverity: 0,
        urgencyCarry: 0.15,
        vulnerability: 0.1,
        coverageFit: 0.85,
        duplicateReviewFlag: false,
        fairnessBandRef: "band_risk_attention",
        trustState: "trusted",
        missingTrustInputRefs: [],
        scopeExcluded: false,
        archetypeRef: "routine_triage",
      },
      {
        taskRef: "task_routine_b",
        queueEnteredAt: "2026-04-12T07:05:00Z",
        slaTargetAt: "2026-04-12T11:30:00Z",
        expectedHandleMinutes: 15,
        clinicalPriorityBand: 3,
        residualRisk: 0.24,
        contactRisk: 0.2,
        assimilationPending: false,
        preemptionPending: false,
        escalated: false,
        returned: false,
        evidenceDeltaSeverity: 0,
        urgencyCarry: 0.05,
        vulnerability: 0.05,
        coverageFit: 0.88,
        duplicateReviewFlag: false,
        fairnessBandRef: "band_routine",
        trustState: "trusted",
        missingTrustInputRefs: [],
        scopeExcluded: false,
        archetypeRef: "routine_triage",
      },
      {
        taskRef: "task_trust_hold",
        queueEnteredAt: "2026-04-12T08:20:00Z",
        slaTargetAt: "2026-04-12T11:00:00Z",
        expectedHandleMinutes: 10,
        clinicalPriorityBand: 2,
        residualRisk: 0.18,
        contactRisk: 0.18,
        assimilationPending: false,
        preemptionPending: false,
        escalated: false,
        returned: false,
        evidenceDeltaSeverity: 0,
        urgencyCarry: 0,
        vulnerability: 0.05,
        coverageFit: 0.82,
        duplicateReviewFlag: false,
        fairnessBandRef: "band_routine",
        trustState: "stale",
        missingTrustInputRefs: ["reachability_dependency"],
        scopeExcluded: false,
        archetypeRef: "routine_triage",
      },
    ],
  } as const;
}

describe("queue ranking contract runtime", () => {
  it("replays to the same row-order hash and explanation refs for the same fact cut", async () => {
    const store = createQueueRankingStore();
    await store.saveQueueRankPlan(QueueRankPlanDocument.fromSnapshot(queueDefaultPlan));

    const authorityA = createQueueRankingAuthorityService(
      store,
      createDeterministicQueueRankingIdGenerator("queue_ranking_replay_a"),
    );
    const authorityB = createQueueRankingAuthorityService(
      store,
      createDeterministicQueueRankingIdGenerator("queue_ranking_replay_b"),
    );

    const first = await authorityA.materializeRankSnapshot(
      queueDefaultPlan.queueRankPlanId,
      makeFactCut(),
    );
    const second = await authorityB.materializeRankSnapshot(
      queueDefaultPlan.queueRankPlanId,
      makeFactCut(),
    );

    expect(first.snapshot.toSnapshot().rowOrderHash).toBe(
      second.snapshot.toSnapshot().rowOrderHash,
    );
    expect(first.entries.map((entry) => entry.toSnapshot().taskRef)).toEqual(
      second.entries.map((entry) => entry.toSnapshot().taskRef),
    );
    expect(first.entries.map((entry) => entry.toSnapshot().explanationPayloadRef)).toEqual(
      second.entries.map((entry) => entry.toSnapshot().explanationPayloadRef),
    );
    expect(first.entries.map((entry) => entry.toSnapshot().taskRef)).toEqual([
      "task_escalated",
      "task_duplicate",
      "task_routine_a",
      "task_routine_b",
      "task_trust_hold",
    ]);
    expect(first.entries.at(-1)?.toSnapshot().eligibilityState).toBe("held_trust");
  });

  it("computes within-tier urgency from the frozen 227 formula and constants", async () => {
    const store = createQueueRankingStore();
    await store.saveQueueRankPlan(QueueRankPlanDocument.fromSnapshot(queueDefaultPlan));
    const authority = createQueueRankingAuthorityService(
      store,
      createDeterministicQueueRankingIdGenerator("queue_rank_formula"),
    );

    const ranking = await authority.materializeRankSnapshot(
      queueDefaultPlan.queueRankPlanId,
      makeFactCut(),
    );

    const entry = ranking.entries
      .map((item) => item.toSnapshot())
      .find((item) => item.taskRef === "task_duplicate");
    expect(entry).toBeTruthy();
    const explanation = entry!.normalizedExplanationPayload;
    const weights = queueDefaultPlan.policyBundle.withinTierWeightSet;
    const expectedUrgency =
      1 -
      Math.exp(
        -(
          weights.weightSla * explanation.normalizedFactors.slaPressure +
          weights.weightAge * explanation.normalizedFactors.ageLift +
          weights.weightResidual * explanation.policyFactors.residual +
          weights.weightContact * explanation.policyFactors.contactRisk +
          weights.weightReturn * explanation.normalizedFactors.returnLift +
          weights.weightCarry * explanation.normalizedFactors.urgencyCarry +
          weights.weightVulnerability * explanation.normalizedFactors.vulnerability
        ),
      );

    expect(entry!.urgencyScore).toBeCloseTo(expectedUrgency, 6);
    expect(explanation.policyFactors.slaWarn).toBeGreaterThan(0);
    expect(explanation.policyFactors.priorityOrdinal).toBe(4);
    expect(explanation.policyFactors.duplicateReviewFlag).toBe(true);
  });

  it("suppresses fairness promises under overload-critical posture", async () => {
    const store = createQueueRankingStore();
    await store.saveQueueRankPlan(QueueRankPlanDocument.fromSnapshot(queueDefaultPlan));
    const authority = createQueueRankingAuthorityService(
      store,
      createDeterministicQueueRankingIdGenerator("queue_rank_overload"),
    );

    const result = await authority.materializeRankSnapshot(
      queueDefaultPlan.queueRankPlanId,
      makeFactCut({
        telemetry: {
          criticalArrivalRatePerHour: 2.4,
          empiricalServiceRatePerHour: 0.4,
          activeReviewerCount: 1,
        },
      }),
    );

    expect(result.snapshot.toSnapshot().overloadState).toBe("overload_critical");
    for (const entry of result.entries
      .map((item) => item.toSnapshot())
      .filter((item) => item.eligibilityState === "eligible")) {
      expect(entry.normalizedExplanationPayload.fairnessTransition.promiseState).toBe(
        "suppressed_overload",
      );
    }
  });

  it("keeps reviewer suggestions downstream of canonical order", async () => {
    const store = createQueueRankingStore();
    await store.saveQueueRankPlan(QueueRankPlanDocument.fromSnapshot(queueDefaultPlan));
    const authority = createQueueRankingAuthorityService(
      store,
      createDeterministicQueueRankingIdGenerator("queue_rank_suggestions"),
    );

    const ranking = await authority.materializeRankSnapshot(
      queueDefaultPlan.queueRankPlanId,
      makeFactCut(),
    );
    const suggestions = await authority.deriveAssignmentSuggestionSnapshot({
      rankSnapshotRef: ranking.snapshot.toSnapshot().rankSnapshotId,
      reviewerScopeRef: "reviewer_scope_triage",
      generatedAt: "2026-04-12T09:00:10Z",
      reviewers: [
        {
          reviewerRef: "reviewer_alex",
          freeCapacity: 2,
          loadHeadroom: 0.8,
          eligibleTaskRefs: ["task_escalated", "task_duplicate", "task_routine_a"],
          skillScores: {
            task_escalated: 0.95,
            task_duplicate: 0.4,
            task_routine_a: 0.55,
          },
          continuityScores: {
            task_duplicate: 0.7,
          },
          sameContextTaskRefs: ["task_duplicate"],
          contextSwitchCosts: {
            task_escalated: 0.1,
          },
          focusPenaltyByTaskRef: {},
        },
        {
          reviewerRef: "reviewer_bea",
          freeCapacity: 2,
          loadHeadroom: 0.6,
          skillScores: {
            task_escalated: 0.5,
            task_duplicate: 0.92,
            task_routine_a: 0.65,
          },
          continuityScores: {
            task_duplicate: 0.95,
          },
          sameContextTaskRefs: ["task_duplicate"],
          contextSwitchCosts: {},
          focusPenaltyByTaskRef: {
            task_routine_a: 0.2,
          },
        },
      ],
    });

    const suggestionSnapshot = suggestions.snapshot.toSnapshot();
    const entrySnapshots = ranking.entries.map((entry) => entry.toSnapshot());
    expect(suggestionSnapshot.suggestionRows[0]?.ordinal).toBe(entrySnapshots[0]?.ordinal);
    expect(suggestionSnapshot.suggestionRows[0]?.explanationPayloadRef).toBe(
      entrySnapshots[0]?.explanationPayloadRef,
    );
    expect(suggestionSnapshot.governedAutoClaimRefs.length).toBeGreaterThan(0);

    const mutated = {
      ...suggestionSnapshot,
      suggestionRows: suggestionSnapshot.suggestionRows.map((row, index) =>
        index === 0 ? { ...row, ordinal: row.ordinal + 1 } : row,
      ),
    };
    expect(() =>
      validateQueueAssignmentSuggestionIsolation({
        rankSnapshot: ranking.snapshot.toSnapshot(),
        entries: entrySnapshots,
        suggestionSnapshot: mutated,
      }),
    ).toThrow("canonical ordinals");
  });

  it("rotates non-critical work through deterministic fairness bands", async () => {
    const store = createQueueRankingStore();
    await store.saveQueueRankPlan(QueueRankPlanDocument.fromSnapshot(queueDefaultPlan));
    const authority = createQueueRankingAuthorityService(
      store,
      createDeterministicQueueRankingIdGenerator("queue_rank_fairness"),
    );

    const ranking = await authority.materializeRankSnapshot(queueDefaultPlan.queueRankPlanId, {
      queueRef: "queue_fairness_rotation",
      queueFamilyRef: queueDefaultPlan.queueFamilyRef,
      sourceFactCutRef: "fact_cut_fairness_rotation",
      asOfAt: "2026-04-16T10:00:00Z",
      generatedAt: "2026-04-16T10:00:05Z",
      trustInputRefs: ["trust_slice_queue", "trust_slice_reachability"],
      telemetry: {
        criticalArrivalRatePerHour: 0.35,
        empiricalServiceRatePerHour: 1.4,
        activeReviewerCount: 5,
      },
      taskFacts: [
        {
          ...makeFactCut().taskFacts[1],
          taskRef: "fair_return",
          duplicateReviewFlag: false,
          urgencyCarry: 0.1,
        },
        {
          ...makeFactCut().taskFacts[2],
          taskRef: "fair_risk",
          fairnessBandRef: "band_risk_attention",
          residualRisk: 0.55,
          contactRisk: 0.52,
          queueEnteredAt: "2026-04-16T07:25:00Z",
        },
        {
          ...makeFactCut().taskFacts[3],
          taskRef: "fair_routine",
          fairnessBandRef: "band_routine",
          queueEnteredAt: "2026-04-16T07:10:00Z",
        },
        {
          ...makeFactCut().taskFacts[3],
          taskRef: "fair_low",
          fairnessBandRef: "band_low_intensity",
          clinicalPriorityBand: 2,
          residualRisk: 0.12,
          contactRisk: 0.09,
          expectedHandleMinutes: 8,
          queueEnteredAt: "2026-04-16T07:00:00Z",
        },
      ],
    });

    expect(ranking.entries.map((entry) => entry.toSnapshot().taskRef)).toEqual([
      "fair_return",
      "fair_risk",
      "fair_routine",
      "fair_low",
    ]);
  });

  it("fails closed when a task references an unsupported fairness band", async () => {
    const store = createQueueRankingStore();
    await store.saveQueueRankPlan(QueueRankPlanDocument.fromSnapshot(queueDefaultPlan));
    const authority = createQueueRankingAuthorityService(
      store,
      createDeterministicQueueRankingIdGenerator("queue_rank_fail_closed"),
    );

    await expect(
      authority.materializeRankSnapshot(queueDefaultPlan.queueRankPlanId, {
        ...makeFactCut(),
        taskFacts: [
          {
            ...makeFactCut().taskFacts[0],
            taskRef: "task_bad_band",
            fairnessBandRef: "band_unknown",
          },
        ],
      }),
    ).rejects.toThrow("unsupported fairness band");
  });

  it("rejects mixed snapshot refs across rows, preview, and next-task candidates", () => {
    expect(() =>
      validateQueueConsumerSnapshotRefs({
        sourceQueueRankSnapshotRef: "snapshot_A",
        queueRowSnapshotRefs: ["snapshot_A", "snapshot_A"],
        nextTaskSnapshotRefs: ["snapshot_A", "snapshot_B"],
        previewSnapshotRefs: ["snapshot_A"],
      }),
    ).toThrow("Mixed-snapshot queue truth is forbidden");
  });
});
