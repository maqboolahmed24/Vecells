import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  buildMoreInfoResponsePayloadHash,
  buildMoreInfoResponseReplayKey,
  createPhase3MoreInfoResponseResafetyService,
  createPhase3MoreInfoResponseResafetyStore,
  evaluateMoreInfoResponseChurnGuard,
  resolveMoreInfoResponseDisposition,
} from "../src/index.ts";

describe("phase 3 more-info response resafety domain", () => {
  it("resolves the exact required disposition vocabulary from checkpoint and cycle posture", () => {
    const cases = [
      {
        scenario: "in window",
        input: {
          targetCycleId: "cycle_live",
          currentCycleId: "cycle_live",
          cycleState: "awaiting_patient_reply",
          checkpointState: "open",
          requestClosed: false,
        } as const,
        expected: "accepted_in_window",
      },
      {
        scenario: "late review",
        input: {
          targetCycleId: "cycle_live",
          currentCycleId: "cycle_live",
          cycleState: "awaiting_late_review",
          checkpointState: "late_review",
          requestClosed: false,
        } as const,
        expected: "accepted_late_review",
      },
      {
        scenario: "blocked repair",
        input: {
          targetCycleId: "cycle_live",
          currentCycleId: "cycle_live",
          cycleState: "awaiting_patient_reply",
          checkpointState: "open",
          requestClosed: false,
          repairBlockReasonRefs: ["contact_route_disputed"],
        } as const,
        expected: "blocked_repair",
      },
      {
        scenario: "superseded duplicate",
        input: {
          targetCycleId: "cycle_old",
          currentCycleId: "cycle_live",
          cycleState: "superseded",
          checkpointState: "superseded",
          requestClosed: false,
          replayAlreadyAssimilated: true,
        } as const,
        expected: "superseded_duplicate",
      },
      {
        scenario: "expired rejected",
        input: {
          targetCycleId: "cycle_live",
          currentCycleId: "cycle_live",
          cycleState: "expired",
          checkpointState: "expired",
          requestClosed: false,
        } as const,
        expected: "expired_rejected",
      },
    ];

    for (const testCase of cases) {
      const resolved = resolveMoreInfoResponseDisposition(testCase.input);
      expect(resolved.dispositionClass, testCase.scenario).toBe(testCase.expected);
    }
  });

  it("builds stable payload and replay hashes for exact reply replay detection", () => {
    const payloadHash = buildMoreInfoResponsePayloadHash({
      cycleId: "cycle_hash",
      messageText: "still breathless today",
      structuredFacts: { shortnessOfBreath: true, hoursSinceOnset: 2 },
      attachmentRefs: ["attachment_b", "attachment_a", "attachment_a"],
      sourceArtifactRefs: ["source_raw_reply"],
      responseGrantRef: "grant_hash",
    });
    const replayKey = buildMoreInfoResponseReplayKey({
      requestLineageRef: "lineage_hash",
      cycleId: "cycle_hash",
      payloadHash,
    });

    expect(
      buildMoreInfoResponsePayloadHash({
        cycleId: "cycle_hash",
        messageText: "still breathless today",
        structuredFacts: { hoursSinceOnset: 2, shortnessOfBreath: true },
        attachmentRefs: ["attachment_a", "attachment_b"],
        sourceArtifactRefs: ["source_raw_reply"],
        responseGrantRef: "grant_hash",
      }),
    ).toBe(payloadHash);
    expect(
      buildMoreInfoResponseReplayKey({
        requestLineageRef: "lineage_hash",
        cycleId: "cycle_hash",
        payloadHash,
      }),
    ).toBe(replayKey);
  });

  it("suppresses automatic requeue after more than three reopen cycles inside twenty-four hours without a stable clear", () => {
    const guard = evaluateMoreInfoResponseChurnGuard({
      priorResponseAssimilations: [
        {
          recordedAt: "2026-04-16T00:30:00.000Z",
          requestedSafetyState: "residual_risk_flagged",
          routingOutcome: "review_resumed_then_queued",
        },
        {
          recordedAt: "2026-04-16T05:30:00.000Z",
          requestedSafetyState: "residual_risk_flagged",
          routingOutcome: "review_resumed_then_queued",
        },
        {
          recordedAt: "2026-04-16T09:30:00.000Z",
          requestedSafetyState: "residual_risk_flagged",
          routingOutcome: "review_resumed_then_queued",
        },
      ],
      currentRecordedAt: "2026-04-16T12:30:00.000Z",
      currentRequestedSafetyState: "residual_risk_flagged",
    });

    expect(guard.requiresSupervisorReview).toBe(true);
    expect(guard.reopenCountWithinWindow).toBe(4);
    expect(guard.suppressAutomaticRoutineQueue).toBe(true);
  });

  it("persists append-only dispositions, assimilation records, and supervisor requirements", async () => {
    const repositories = createPhase3MoreInfoResponseResafetyStore();
    const service = createPhase3MoreInfoResponseResafetyService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_more_info_response_test"),
    });

    const disposition = await service.createDisposition({
      taskId: "task_store",
      cycleId: "cycle_store",
      checkpointRef: "checkpoint_store",
      requestId: "request_store",
      requestLineageRef: "lineage_store",
      responseGrantRef: "grant_store",
      checkpointRevision: 2,
      ownershipEpoch: 3,
      currentLineageFenceEpoch: 4,
      idempotencyKey: "idempotency_store",
      replayKey: "replay_store",
      sourcePayloadHash: "payload_store",
      dispositionClass: "accepted_late_review",
      reasonCodeRefs: ["reply_accepted_during_late_review"],
      receivedAt: "2026-04-16T10:00:00.000Z",
    });
    const assimilation = await service.createResponseAssimilationRecord({
      dispositionRef: disposition.dispositionId,
      taskId: disposition.taskId,
      cycleId: disposition.cycleId,
      requestId: disposition.requestId,
      requestLineageRef: disposition.requestLineageRef,
      evidenceCaptureBundleRef: "capture_store",
      evidenceSnapshotRef: "snapshot_store",
      evidenceAssimilationRef: "assimilation_store",
      materialDeltaAssessmentRef: "delta_store",
      classificationDecisionRef: "classification_store",
      safetyPreemptionRef: "preemption_store",
      safetyDecisionRef: "safety_store",
      deltaFeatureRefs: ["symptom_worsened"],
      impactedRuleRefs: ["rule_urgent_1"],
      requestedSafetyState: "urgent_diversion_required",
      safetyDecisionOutcome: "urgent_required",
      resultingSafetyDecisionEpoch: 7,
      routingOutcome: "urgent_return",
      recordedAt: "2026-04-16T10:01:00.000Z",
    });
    const requirement = await service.createSupervisorReviewRequirement({
      taskId: disposition.taskId,
      cycleId: disposition.cycleId,
      requestId: disposition.requestId,
      requestLineageRef: disposition.requestLineageRef,
      triggeringResponseAssimilationRef: assimilation.responseAssimilationRecordId,
      windowStartAt: "2026-04-15T10:01:00.000Z",
      windowEndsAt: "2026-04-16T10:01:00.000Z",
      reopenCountWithinWindow: 4,
      suppressAutomaticRoutineQueue: true,
      reasonCodeRefs: ["reopen_oscillation_threshold_exceeded"],
      createdAt: "2026-04-16T10:01:00.000Z",
    });

    expect(
      await repositories.findDispositionByIdempotencyKey("idempotency_store"),
    ).toMatchObject({ dispositionId: disposition.dispositionId });
    expect(
      await repositories.findAssimilationByDispositionRef(disposition.dispositionId),
    ).toMatchObject({ responseAssimilationRecordId: assimilation.responseAssimilationRecordId });
    expect(await repositories.listSupervisorReviewRequirementsByTask("task_store")).toMatchObject([
      { supervisorReviewRequirementId: requirement.supervisorReviewRequirementId },
    ]);
  });
});
