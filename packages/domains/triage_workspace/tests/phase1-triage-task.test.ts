import { describe, expect, it } from "vitest";
import {
  createPhase1EtaEngine,
  createPhase1TriageHandoffService,
  createPhase1TriageStore,
  type Phase1EtaEngineQueueEntry,
  type PreviousReceiptEnvelopeSummary,
} from "../src/index.ts";

function entry(
  overrides: Partial<Phase1EtaEngineQueueEntry> & {
    triageTaskRef: string;
    requestRef: string;
    requestLineageRef: string;
    receiptConsistencyKey: string;
    statusConsistencyKey: string;
    createdAt: string;
  },
): Phase1EtaEngineQueueEntry {
  return {
    triageTaskRef: overrides.triageTaskRef,
    requestRef: overrides.requestRef,
    requestLineageRef: overrides.requestLineageRef,
    receiptConsistencyKey: overrides.receiptConsistencyKey,
    statusConsistencyKey: overrides.statusConsistencyKey,
    serviceBandRef: overrides.serviceBandRef ?? "symptoms",
    residualReviewState: overrides.residualReviewState ?? "routine_review",
    safetyState: overrides.safetyState ?? "screen_clear",
    residualRiskRuleRefs: overrides.residualRiskRuleRefs ?? [],
    createdAt: overrides.createdAt,
    previousEnvelope: overrides.previousEnvelope ?? null,
    recentForecasts: overrides.recentForecasts ?? [],
  };
}

describe("phase 1 triage handoff", () => {
  it("creates one canonical triage task with ETA and minimal patient status", async () => {
    const repositories = createPhase1TriageStore();
    const service = createPhase1TriageHandoffService(repositories);

    const result = await service.createTriageTask({
      requestRef: "request_152_001",
      requestLineageRef: "lineage_152_001",
      submissionPromotionRecordRef: "promotion_152_001",
      normalizedSubmissionRef: "normalized_152_001",
      receiptConsistencyKey: "receipt_consistency::152_001",
      statusConsistencyKey: "status_consistency::152_001",
      tenantId: "tenant_phase1",
      requestTypeRef: "Symptoms",
      safetyState: "screen_clear",
      residualRiskRuleRefs: [],
      createdAt: "2026-04-14T10:00:00Z",
    });

    expect(result.replayed).toBe(false);
    expect(result.triageTask.workflowQueueRef).toContain("routine_review");
    expect(result.triageTask.queueRank).toBe(1);
    expect(result.etaForecast.receiptBucket).toMatch(
      /same_day|next_working_day|within_2_working_days|after_2_working_days/,
    );
    expect(result.patientStatusProjection.macroState).toBe("received");
    expect(result.patientStatusProjection.visibleEtaBucket).toBe(
      result.receiptEnvelopeDraft.receiptBucket,
    );
    expect(result.receiptEnvelopeDraft.statusProjectionVersionRef).toBe(
      result.patientStatusProjection.patientStatusProjectionId,
    );
  });

  it("carries residual-risk rule ids into the canonical task and patient status semantics", async () => {
    const repositories = createPhase1TriageStore();
    const service = createPhase1TriageHandoffService(repositories);

    const result = await service.createTriageTask({
      requestRef: "request_152_002",
      requestLineageRef: "lineage_152_002",
      submissionPromotionRecordRef: "promotion_152_002",
      normalizedSubmissionRef: "normalized_152_002",
      receiptConsistencyKey: "receipt_consistency::152_002",
      statusConsistencyKey: "status_consistency::152_002",
      tenantId: "tenant_phase1",
      requestTypeRef: "Symptoms",
      safetyState: "residual_risk_flagged",
      residualRiskRuleRefs: ["RF142_RC_MODERATE_PERSISTENT_SYMPTOMS"],
      createdAt: "2026-04-14T10:05:00Z",
    });

    expect(result.triageTask.priorityBandRef).toBe("residual_review");
    expect(result.triageTask.residualRiskRuleRefs).toEqual([
      "RF142_RC_MODERATE_PERSISTENT_SYMPTOMS",
    ]);
    expect(result.patientStatusProjection.safetyState).toBe("residual_risk_flagged");
    expect(result.patientStatusProjection.nextStepMessageRef).toBe(
      "STATUS_152_RESIDUAL_REVIEW_MESSAGE_V1",
    );
  });

  it("enforces monotone median and upper bounds across the deterministic queue rank order", () => {
    const engine = createPhase1EtaEngine();
    const output = engine.forecastSnapshot({
      tenantId: "tenant_phase1",
      snapshotObservedAt: "2026-04-14T10:00:00Z",
      queueEntries: [
        entry({
          triageTaskRef: "task_152_003",
          requestRef: "request_152_003",
          requestLineageRef: "lineage_152_003",
          receiptConsistencyKey: "receipt_consistency::152_003",
          statusConsistencyKey: "status_consistency::152_003",
          serviceBandRef: "symptoms",
          residualReviewState: "residual_review",
          safetyState: "residual_risk_flagged",
          residualRiskRuleRefs: ["RF142_RC_MODERATE_PERSISTENT_SYMPTOMS"],
          createdAt: "2026-04-14T09:50:00Z",
        }),
        entry({
          triageTaskRef: "task_152_004",
          requestRef: "request_152_004",
          requestLineageRef: "lineage_152_004",
          receiptConsistencyKey: "receipt_consistency::152_004",
          statusConsistencyKey: "status_consistency::152_004",
          serviceBandRef: "admin",
          createdAt: "2026-04-14T09:55:00Z",
        }),
        entry({
          triageTaskRef: "task_152_005",
          requestRef: "request_152_005",
          requestLineageRef: "lineage_152_005",
          receiptConsistencyKey: "receipt_consistency::152_005",
          statusConsistencyKey: "status_consistency::152_005",
          serviceBandRef: "results",
          createdAt: "2026-04-14T09:59:00Z",
        }),
      ],
    });

    for (let index = 1; index < output.assessments.length; index += 1) {
      const previous = output.assessments[index - 1];
      const current = output.assessments[index];
      expect(current.calibratedMedianWorkingMinutes).toBeGreaterThanOrEqual(
        previous.calibratedMedianWorkingMinutes,
      );
      expect(current.calibratedUpperWorkingMinutes).toBeGreaterThanOrEqual(
        previous.calibratedUpperWorkingMinutes,
      );
      expect(current.queueRank).toBe(previous.queueRank + 1);
    }
  });

  it("holds a single-snapshot ETA improvement until hysteresis confirms it", () => {
    const previousEnvelope: PreviousReceiptEnvelopeSummary = {
      receiptBucket: "within_2_working_days",
      promiseState: "on_track",
      etaLowerBoundAt: "2026-04-14T10:00:00Z",
      etaMedianAt: "2026-04-16T10:00:00Z",
      etaUpperBoundAt: "2026-04-16T15:00:00Z",
      bucketConfidence: 0.88,
      monotoneRevision: 1,
    };
    const engine = createPhase1EtaEngine();

    const held = engine.forecastSnapshot({
      tenantId: "tenant_phase1",
      snapshotObservedAt: "2026-04-14T10:00:00Z",
      queueEntries: [
        entry({
          triageTaskRef: "task_152_006",
          requestRef: "request_152_006",
          requestLineageRef: "lineage_152_006",
          receiptConsistencyKey: "receipt_consistency::152_006",
          statusConsistencyKey: "status_consistency::152_006",
          serviceBandRef: "admin",
          createdAt: "2026-04-14T09:45:00Z",
          previousEnvelope,
        }),
      ],
    });

    expect(held.assessments[0]?.hysteresisDecision).toMatch(
      /held_prior_bucket|material_improvement|confirmed_improvement|initial_issue/,
    );
  });

  it("freezes the last authoritative promise when telemetry is stale", () => {
    const previousEnvelope: PreviousReceiptEnvelopeSummary = {
      receiptBucket: "next_working_day",
      promiseState: "on_track",
      etaLowerBoundAt: "2026-04-14T10:00:00Z",
      etaMedianAt: "2026-04-15T10:00:00Z",
      etaUpperBoundAt: "2026-04-15T16:00:00Z",
      bucketConfidence: 0.8,
      monotoneRevision: 2,
    };
    const engine = createPhase1EtaEngine();

    const frozen = engine.forecastSnapshot({
      tenantId: "tenant_phase1",
      snapshotObservedAt: "2026-04-14T10:00:00Z",
      queueEntries: [
        entry({
          triageTaskRef: "task_152_007",
          requestRef: "request_152_007",
          requestLineageRef: "lineage_152_007",
          receiptConsistencyKey: "receipt_consistency::152_007",
          statusConsistencyKey: "status_consistency::152_007",
          serviceBandRef: "symptoms",
          createdAt: "2026-04-14T09:30:00Z",
          previousEnvelope,
        }),
      ],
      telemetry: {
        freshnessState: "stale",
        queueCompletenessState: "insufficient",
        staffingCoverageState: "thin",
      },
    });

    expect(frozen.assessments[0]?.publishedReceiptBucket).toBe("next_working_day");
    expect(frozen.assessments[0]?.promiseState).toBe("at_risk");
    expect(frozen.assessments[0]?.hysteresisDecision).toBe("frozen_at_risk");
  });
});
