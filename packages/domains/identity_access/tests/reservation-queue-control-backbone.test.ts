import { describe, expect, it } from "vitest";
import {
  createReservationQueueServices,
  createReservationQueueSimulationHarness,
} from "../src/index.ts";

function baseTask(input: {
  taskRef: string;
  queueEnteredAt: string;
  slaTargetAt: string;
  expectedHandleMinutes: number;
  clinicalPriorityBand: number;
  residualRisk: number;
  contactRisk: number;
  fairnessBandRef: string;
  escalated?: boolean;
  returned?: boolean;
  lastMaterialReturnAt?: string;
  evidenceDeltaSeverity?: number;
  urgencyCarry?: number;
}) {
  return {
    taskRef: input.taskRef,
    queueEnteredAt: input.queueEnteredAt,
    slaTargetAt: input.slaTargetAt,
    expectedHandleMinutes: input.expectedHandleMinutes,
    clinicalPriorityBand: input.clinicalPriorityBand,
    residualRisk: input.residualRisk,
    contactRisk: input.contactRisk,
    assimilationPending: false,
    preemptionPending: false,
    escalated: input.escalated ?? false,
    returned: input.returned ?? false,
    lastMaterialReturnAt: input.lastMaterialReturnAt ?? null,
    evidenceDeltaSeverity: input.evidenceDeltaSeverity ?? 0,
    urgencyCarry: input.urgencyCarry ?? 0,
    vulnerability: 0.2,
    coverageFit: 0.86,
    duplicateReviewFlag: false,
    fairnessBandRef: input.fairnessBandRef,
    trustState: "trusted" as const,
    missingTrustInputRefs: [],
    scopeExcluded: false,
    archetypeRef: "triage_review",
  };
}

function buildFactCut(overrides?: {
  scenarioId?: string;
  generatedAt?: string;
  asOfAt?: string;
  telemetry?: {
    criticalArrivalRatePerHour: number;
    empiricalServiceRatePerHour: number;
    activeReviewerCount: number;
  };
}) {
  const scenarioId = overrides?.scenarioId ?? "queue_backbone";
  return {
    queueRef: `queue_${scenarioId}`,
    queueFamilyRef: "staff_review_routine",
    sourceFactCutRef: `fact_cut_${scenarioId}`,
    asOfAt: overrides?.asOfAt ?? "2026-04-12T09:00:00Z",
    generatedAt: overrides?.generatedAt ?? "2026-04-12T09:00:05Z",
    trustInputRefs: ["trust_slice_queue", "trust_slice_reachability"],
    telemetry: overrides?.telemetry ?? {
      criticalArrivalRatePerHour: 0.45,
      empiricalServiceRatePerHour: 1.25,
      activeReviewerCount: 4,
    },
    taskFacts: [
      baseTask({
        taskRef: "task_escalated",
        queueEnteredAt: "2026-04-12T08:10:00Z",
        slaTargetAt: "2026-04-12T10:15:00Z",
        expectedHandleMinutes: 18,
        clinicalPriorityBand: 5,
        residualRisk: 0.92,
        contactRisk: 0.2,
        fairnessBandRef: "band_routine",
        escalated: true,
        urgencyCarry: 0.55,
      }),
      baseTask({
        taskRef: "task_return",
        queueEnteredAt: "2026-04-12T08:00:00Z",
        slaTargetAt: "2026-04-12T10:35:00Z",
        expectedHandleMinutes: 12,
        clinicalPriorityBand: 4,
        residualRisk: 0.61,
        contactRisk: 0.24,
        fairnessBandRef: "band_returned_review",
        returned: true,
        lastMaterialReturnAt: "2026-04-12T08:52:00Z",
        evidenceDeltaSeverity: 0.7,
      }),
      baseTask({
        taskRef: "task_routine",
        queueEnteredAt: "2026-04-12T07:45:00Z",
        slaTargetAt: "2026-04-12T11:00:00Z",
        expectedHandleMinutes: 14,
        clinicalPriorityBand: 3,
        residualRisk: 0.28,
        contactRisk: 0.16,
        fairnessBandRef: "band_risk_attention",
      }),
    ],
  } as const;
}

function reviewers() {
  return [
    {
      reviewerRef: "reviewer_alex",
      freeCapacity: 2,
      loadHeadroom: 0.84,
      eligibleTaskRefs: ["task_escalated", "task_return", "task_routine"],
      skillScores: {
        task_escalated: 0.95,
        task_return: 0.5,
        task_routine: 0.42,
      },
      continuityScores: {
        task_return: 0.72,
      },
      sameContextTaskRefs: ["task_return"],
      contextSwitchCosts: {
        task_escalated: 0.1,
      },
      focusPenaltyByTaskRef: {},
    },
    {
      reviewerRef: "reviewer_bea",
      freeCapacity: 2,
      loadHeadroom: 0.7,
      skillScores: {
        task_escalated: 0.6,
        task_return: 0.85,
        task_routine: 0.88,
      },
      continuityScores: {
        task_routine: 0.4,
      },
      sameContextTaskRefs: ["task_routine"],
      contextSwitchCosts: {
        task_return: 0.05,
      },
      focusPenaltyByTaskRef: {
        task_escalated: 0.15,
      },
    },
  ] as const;
}

describe("reservation queue control backbone", () => {
  it("serializes overlapping exclusive claims on one canonical reservation key", async () => {
    const services = createReservationQueueServices();
    const [local, hub] = await Promise.all([
      services.reservationAuthority.claimReservation({
        capacityIdentityRef: "capacity_081_conflict",
        canonicalReservationKey: "canonical_reservation_key_081_conflict",
        sourceDomain: "booking_local",
        holderRef: "holder_local_081_conflict",
        sourceObjectRef: "offer_local_081_conflict",
        selectedAnchorRef: "slot_local_081_conflict",
        projectionFreshnessEnvelopeRef: "freshness::081_conflict_local",
        requestedState: "held",
        supplierObservedAt: "2026-04-12T09:05:00Z",
        expiresAt: "2026-04-12T09:20:00Z",
      }),
      services.reservationAuthority.claimReservation({
        capacityIdentityRef: "capacity_081_conflict",
        canonicalReservationKey: "canonical_reservation_key_081_conflict",
        sourceDomain: "hub_booking",
        holderRef: "holder_hub_081_conflict",
        sourceObjectRef: "offer_hub_081_conflict",
        selectedAnchorRef: "slot_hub_081_conflict",
        projectionFreshnessEnvelopeRef: "freshness::081_conflict_hub",
        requestedState: "held",
        supplierObservedAt: "2026-04-12T09:05:05Z",
        expiresAt: "2026-04-12T09:18:00Z",
      }),
    ]);

    expect(local.conflictBlocked).toBe(false);
    expect(hub.conflictBlocked).toBe(true);
    expect(local.projection?.toSnapshot().truthState).toBe("exclusive_held");
    expect(hub.blockingFence?.reservationFenceRecordId).toBe(local.fence.reservationFenceRecordId);

    const fences = await services.repositories.listReservationFenceRecordsByCanonicalKey(
      "canonical_reservation_key_081_conflict",
    );
    expect(fences).toHaveLength(2);
    expect(fences.filter((record) => record.toSnapshot().state === "active")).toHaveLength(1);
    expect(fences.find((record) => record.toSnapshot().state === "conflict_blocked")).toBeTruthy();
  });

  it("reuses the same reservation and fencing token for exact replay", async () => {
    const services = createReservationQueueServices();
    const first = await services.reservationAuthority.claimReservation({
      capacityIdentityRef: "capacity_081_replay",
      canonicalReservationKey: "canonical_reservation_key_081_replay",
      sourceDomain: "booking_local",
      holderRef: "holder_081_replay",
      sourceObjectRef: "offer_081_replay",
      selectedAnchorRef: "slot_081_replay",
      projectionFreshnessEnvelopeRef: "freshness::081_replay",
      requestedState: "held",
      supplierObservedAt: "2026-04-12T09:10:00Z",
      expiresAt: "2026-04-12T09:22:00Z",
    });
    const replay = await services.reservationAuthority.claimReservation({
      capacityIdentityRef: "capacity_081_replay",
      canonicalReservationKey: "canonical_reservation_key_081_replay",
      sourceDomain: "booking_local",
      holderRef: "holder_081_replay",
      sourceObjectRef: "offer_081_replay",
      selectedAnchorRef: "slot_081_replay",
      projectionFreshnessEnvelopeRef: "freshness::081_replay",
      requestedState: "held",
      supplierObservedAt: "2026-04-12T09:10:00Z",
      expiresAt: "2026-04-12T09:22:00Z",
    });

    expect(replay.replayed).toBe(true);
    expect(replay.fence.fenceToken).toBe(first.fence.fenceToken);
    expect(replay.reservation?.reservationId).toBe(first.reservation?.reservationId);
  });

  it("rejects stale fencing tokens on release", async () => {
    const services = createReservationQueueServices();
    const claim = await services.reservationAuthority.claimReservation({
      capacityIdentityRef: "capacity_081_release",
      canonicalReservationKey: "canonical_reservation_key_081_release",
      sourceDomain: "booking_local",
      holderRef: "holder_081_release",
      sourceObjectRef: "offer_081_release",
      selectedAnchorRef: "slot_081_release",
      projectionFreshnessEnvelopeRef: "freshness::081_release",
      requestedState: "held",
      supplierObservedAt: "2026-04-12T09:15:00Z",
      expiresAt: "2026-04-12T09:30:00Z",
    });

    await expect(
      services.reservationAuthority.releaseReservation({
        canonicalReservationKey: "canonical_reservation_key_081_release",
        fenceToken: "a".repeat(64),
        observedAt: "2026-04-12T09:18:00Z",
        terminalReasonCode: "USER_CANCELLED",
      }),
    ).rejects.toThrow(/latest active fencing token/i);

    const released = await services.reservationAuthority.releaseReservation({
      canonicalReservationKey: "canonical_reservation_key_081_release",
      fenceToken: claim.fence.fenceToken,
      observedAt: "2026-04-12T09:18:00Z",
      terminalReasonCode: "USER_CANCELLED",
    });
    expect(released.fence.toSnapshot().state).toBe("released");
    expect(released.projection.toSnapshot().truthState).toBe("released");
  });

  it("commits snapshots, escalates overload, and preserves base queue in suggestions", async () => {
    const services = createReservationQueueServices();
    const overload = await services.queueRankingCoordinator.commitRankSnapshot({
      factCut: buildFactCut({
        scenarioId: "overload",
        asOfAt: "2026-04-12T09:20:00Z",
        generatedAt: "2026-04-12T09:20:05Z",
        telemetry: {
          criticalArrivalRatePerHour: 2.5,
          empiricalServiceRatePerHour: 0.4,
          activeReviewerCount: 1,
        },
      }),
    });

    expect(overload.commit.toSnapshot().overloadState).toBe("overload_critical");
    expect(overload.commit.toSnapshot().fairnessMergeState).toBe("suppressed_overload");
    expect(overload.escalation?.toSnapshot().pressureRatio).toBeGreaterThan(1);

    const committed = await services.queueRankingCoordinator.commitRankSnapshot({
      factCut: buildFactCut({
        scenarioId: "suggestions",
        asOfAt: "2026-04-12T09:30:00Z",
        generatedAt: "2026-04-12T09:30:05Z",
      }),
    });
    const advice = await services.queueRankingCoordinator.refreshAssignmentAdvice({
      rankSnapshotRef: committed.snapshot.toSnapshot().rankSnapshotId,
      reviewerScopeRef: "reviewer_scope_081",
      generatedAt: "2026-04-12T09:30:10Z",
      reviewers: reviewers(),
    });

    const entriesByTask = new Map(
      advice.sourceEntries.map((entry) => [entry.toSnapshot().taskRef, entry.toSnapshot()]),
    );
    for (const row of advice.suggestion.toSnapshot().suggestionRows) {
      const entry = entriesByTask.get(row.taskRef);
      expect(row.ordinal).toBe(entry?.ordinal);
      expect(row.canonicalTieBreakKey).toBe(entry?.canonicalTieBreakKey);
      expect(row.explanationPayloadRef).toBe(entry?.explanationPayloadRef);
    }
    expect(advice.advisory.toSnapshot().advisoryState).toBe("ready");
  });

  it("blocks next-task advice on stale owner recovery or mixed snapshot drift", async () => {
    const services = createReservationQueueServices();
    const committed = await services.queueRankingCoordinator.commitRankSnapshot({
      factCut: buildFactCut({
        scenarioId: "next_task_blocks",
        asOfAt: "2026-04-12T09:40:00Z",
        generatedAt: "2026-04-12T09:40:05Z",
      }),
    });

    const staleOwner = await services.queueRankingCoordinator.refreshAssignmentAdvice({
      rankSnapshotRef: committed.snapshot.toSnapshot().rankSnapshotId,
      reviewerScopeRef: "reviewer_scope_081_stale",
      generatedAt: "2026-04-12T09:40:10Z",
      reviewers: reviewers(),
      staleOwnerRecoveryRefs: ["owner_recovery_081"],
    });
    expect(staleOwner.advisory.toSnapshot().advisoryState).toBe("blocked_stale_owner");
    expect(staleOwner.advisory.toSnapshot().blockedReasonRefs).toContain(
      "stale_owner_recovery_required",
    );

    const mixed = await services.queueRankingCoordinator.refreshAssignmentAdvice({
      rankSnapshotRef: committed.snapshot.toSnapshot().rankSnapshotId,
      reviewerScopeRef: "reviewer_scope_081_mixed",
      generatedAt: "2026-04-12T09:40:20Z",
      reviewers: reviewers(),
      previewSnapshotRefs: ["different_snapshot_ref"],
    });
    expect(mixed.advisory.toSnapshot().advisoryState).toBe("blocked_mixed_snapshot");
    expect(mixed.advisory.toSnapshot().blockedReasonRefs).toContain(
      "mixed_snapshot_queue_truth_forbidden",
    );
  });

  it("publishes the deterministic scenario harness required by later tracks", async () => {
    const harness = createReservationQueueSimulationHarness();
    const results = await harness.runAllScenarios();

    expect(results).toHaveLength(9);
    const byScenario = Object.fromEntries(results.map((result) => [result.scenarioId, result]));
    expect(
      byScenario.soft_selected_supply_no_exclusive_hold.projection?.toSnapshot().truthState,
    ).toBe("truthful_nonexclusive");
    expect(
      byScenario.real_held_reservation_with_expiry_and_revalidation.projection?.toSnapshot()
        .truthState,
    ).toBe("exclusive_held");
    expect(
      byScenario.pending_confirmation_requires_truthful_nonfinal_copy.projection?.toSnapshot()
        .truthState,
    ).toBe("pending_confirmation");
    expect(byScenario.overlapping_local_and_hub_claims_same_key.fence?.toSnapshot().state).toBe(
      "conflict_blocked",
    );
    expect(byScenario.overload_queue_pressure_escalated.escalation).toBeTruthy();
    expect(
      byScenario.assignment_suggestions_preserve_base_queue.advisory?.toSnapshot().advisoryState,
    ).toBe("ready");
    expect(
      byScenario.next_task_advice_blocked_on_stale_owner.advisory?.toSnapshot().advisoryState,
    ).toBe("blocked_stale_owner");
  });
});
