import { describe, expect, it } from "vitest";
import {
  Phase9OperationalProjectionEngine,
  createPhase9OperationalProjectionEngineFixture,
  evaluateMetricAnomaly,
  projectPhase9OperationalWindow,
  type OperationalProjectionEvent,
} from "../../packages/domains/analytics_assurance/src/index.ts";

function totalQueueDepth(events: readonly { depth: number }[]): number {
  return events.reduce((total, snapshot) => total + snapshot.depth, 0);
}

describe("437 Phase 9 operational projection engine", () => {
  it("event stream -> deterministic queue snapshot", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();
    const replay = projectPhase9OperationalWindow({
      events: [...fixture.baselineEvents].reverse(),
      window: fixture.baselineResult.window,
      trustRecords: fixture.baselineTrustRecords,
      graphVerdict: fixture.baselineGraphVerdict,
    });

    expect(replay.queueHealthSnapshots).toEqual(fixture.baselineResult.queueHealthSnapshots);
    expect(replay.snapshotHash).toBe(fixture.baselineResult.snapshotHash);
  });

  it("breach-risk probability increases as slack decreases", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();
    const generousEvents = fixture.baselineEvents.map((event) =>
      event.entityRef === "triage-task:001"
        ? { ...event, targetWindowCloseAt: "2026-04-27T12:00:00.000Z" }
        : event,
    );
    const tightEvents = fixture.baselineEvents.map((event) =>
      event.entityRef === "triage-task:001"
        ? { ...event, targetWindowCloseAt: "2026-04-27T09:12:00.000Z" }
        : event,
    );
    const generous = projectPhase9OperationalWindow({
      events: generousEvents,
      window: fixture.baselineResult.window,
      trustRecords: fixture.baselineTrustRecords,
      graphVerdict: fixture.baselineGraphVerdict,
    }).breachRiskRecords.find((record) => record.entityRef === "triage-task:001");
    const tight = projectPhase9OperationalWindow({
      events: tightEvents,
      window: fixture.baselineResult.window,
      trustRecords: fixture.baselineTrustRecords,
      graphVerdict: fixture.baselineGraphVerdict,
    }).breachRiskRecords.find((record) => record.entityRef === "triage-task:001");

    expect(tight?.predictedProbability).toBeGreaterThan(generous?.predictedProbability ?? 0);
  });

  it("dependency delay raises breach risk", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();
    const withoutDelay = fixture.baselineEvents.map((event) =>
      event.eventType === "dependency_state"
        ? { ...event, dependencyDelayMeanMinutes: 0, dependencyDelayVarianceMinutesSquared: 0 }
        : event,
    );
    const withDelay = fixture.baselineEvents.map((event) =>
      event.eventType === "dependency_state"
        ? { ...event, dependencyDelayMeanMinutes: 35, dependencyDelayVarianceMinutesSquared: 25 }
        : event,
    );
    const low = projectPhase9OperationalWindow({
      events: withoutDelay,
      window: fixture.baselineResult.window,
      trustRecords: fixture.baselineTrustRecords,
      graphVerdict: fixture.baselineGraphVerdict,
    }).breachRiskRecords.find((record) => record.entityRef === "triage-task:001");
    const high = projectPhase9OperationalWindow({
      events: withDelay,
      window: fixture.baselineResult.window,
      trustRecords: fixture.baselineTrustRecords,
      graphVerdict: fixture.baselineGraphVerdict,
    }).breachRiskRecords.find((record) => record.entityRef === "triage-task:001");

    expect(high?.predictedProbability).toBeGreaterThan(low?.predictedProbability ?? 0);
  });

  it("low support degrades confidence", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();

    expect(fixture.lowSupportResult.breachRiskExplanationVectors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityRef: "triage-task:low-support",
          confidenceState: "low_support",
          calibrationEffectiveSampleSize: 6,
        }),
      ]),
    );
  });

  it("anomaly hysteresis prevents flapping", () => {
    const first = evaluateMetricAnomaly({
      metricAnomalySnapshotId: "mas_437_hysteresis_1",
      metricDefinitionRef: "omd_437_triage_queue_health",
      observedValue: 1,
      expectedValue: 0,
      sigmaHat: 0.1,
      sigmaFloor: 0.1,
      support: 100,
      minimumSupport: 30,
      thresholdPolicyRef: "threshold:437:hysteresis",
      capturedAt: "2026-04-27T09:00:00.000Z",
      policy: { lambda: 1, elevatedScore: 2, criticalScore: 5, exitHoldEvaluations: 2 },
    });
    const second = evaluateMetricAnomaly({
      metricAnomalySnapshotId: "mas_437_hysteresis_2",
      metricDefinitionRef: "omd_437_triage_queue_health",
      observedValue: 0.02,
      expectedValue: 0,
      sigmaHat: 0.1,
      sigmaFloor: 0.1,
      previousAlertState: first.snapshot.alertState,
      previousExitHoldCount: first.exitHoldCount,
      support: 100,
      minimumSupport: 30,
      thresholdPolicyRef: "threshold:437:hysteresis",
      capturedAt: "2026-04-27T09:01:00.000Z",
      policy: { lambda: 1, elevatedScore: 2, criticalScore: 5, exitHoldEvaluations: 2 },
    });

    expect(first.snapshot.alertState).toBe("critical");
    expect(second.snapshot.alertState).toBe("critical");
  });

  it("equity slice low support marked insufficient", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();
    const lowSupportEquityEvent: OperationalProjectionEvent = {
      ...fixture.baselineEvents.find((event) => event.eventId === "evt-437-008")!,
      eventId: "evt-437-low-equity-001",
      dedupeKey: "dedupe:evt-437-low-equity-001",
      equitySliceDefinition: "language:rare-demo",
      equitySampleSize: 4,
      equityVarianceMagnitude: 0.01,
      support: 4,
    };
    const result = projectPhase9OperationalWindow({
      events: [...fixture.baselineEvents, lowSupportEquityEvent],
      window: fixture.baselineResult.window,
      trustRecords: fixture.baselineTrustRecords,
      graphVerdict: fixture.baselineGraphVerdict,
    });

    expect(result.equitySliceMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sliceDefinition: "language:rare-demo",
          varianceState: "insufficient_support",
          persistenceState: "insufficient_support",
        }),
      ]),
    );
  });

  it("stale assurance trust blocks normal dashboard state", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();

    expect(
      fixture.staleTrustResult.opsOverviewSliceEnvelopes.every(
        (envelope) => envelope.renderMode !== "interactive",
      ),
    ).toBe(true);
    expect(
      fixture.staleTrustResult.dashboardTiles.every((tile) => tile.stateLabel !== "Normal"),
    ).toBe(true);
    expect(fixture.staleTrustResult.projectionHealthSnapshot.trustState).toBe("degraded");
  });

  it("late event triggers rebuild or correction path", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();

    expect(fixture.lateCorrectionResult.replay.lateEventRefs).toContain("evt-437-late-001");
    expect(fixture.lateCorrectionResult.replay.correctionState).not.toBe("none");
    expect(fixture.lateCorrectionResult.projectionHealthSnapshot.rebuildState).toBe("queued");
  });

  it("duplicate event does not double-count", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();

    expect(fixture.duplicateResult.replay.duplicateEventRefs).toContain("evt-437-duplicate-001");
    expect(totalQueueDepth(fixture.duplicateResult.queueHealthSnapshots)).toBe(
      totalQueueDepth(fixture.baselineResult.queueHealthSnapshots),
    );
    expect(fixture.duplicateResult.breachRiskRecords).toHaveLength(
      fixture.baselineResult.breachRiskRecords.length,
    );
  });

  it("cross-tenant aggregation denied", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();
    const engine = new Phase9OperationalProjectionEngine();

    expect(() =>
      engine.project({
        events: [
          { ...fixture.baselineEvents[0]!, tenantId: "tenant:other" },
          ...fixture.baselineEvents.slice(1),
        ],
        window: fixture.baselineResult.window,
        trustRecords: fixture.baselineTrustRecords,
        graphVerdict: fixture.baselineGraphVerdict,
      }),
    ).toThrow(/CROSS_TENANT_AGGREGATION_DENIED/);
  });

  it("continuity-control health requires exact settlement/restore evidence", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();
    const brokenEvents = fixture.baselineEvents.map((event) =>
      event.continuityControlCode === "patient_nav"
        ? { ...event, settlementOrRestoreRef: "", returnOrContinuationRef: "" }
        : event,
    );
    const result = projectPhase9OperationalWindow({
      events: brokenEvents,
      window: fixture.baselineResult.window,
      trustRecords: fixture.baselineTrustRecords,
      graphVerdict: fixture.baselineGraphVerdict,
    });
    const patientNav = result.continuityControlHealthProjections.find(
      (projection) => projection.controlCode === "patient_nav",
    );

    expect(patientNav?.validationState).toBe("blocked");
    expect(patientNav?.blockingRefs).toEqual(
      expect.arrayContaining([
        "continuity:patient_nav:missing-settlement-or-restore",
        "continuity:patient_nav:missing-return-or-continuation",
      ]),
    );
  });

  it("replay from same events produces identical snapshots and hashes", () => {
    const fixture = createPhase9OperationalProjectionEngineFixture();
    const engine = new Phase9OperationalProjectionEngine();
    const first = engine.project({
      events: fixture.baselineEvents,
      window: fixture.baselineResult.window,
      trustRecords: fixture.baselineTrustRecords,
      graphVerdict: fixture.baselineGraphVerdict,
    });
    const second = engine.replay({
      events: fixture.baselineEvents,
      window: fixture.baselineResult.window,
      trustRecords: fixture.baselineTrustRecords,
      graphVerdict: fixture.baselineGraphVerdict,
    });

    expect(second.snapshotHash).toBe(first.snapshotHash);
    expect(second.projectionHealthSnapshot.snapshotHash).toBe(
      first.projectionHealthSnapshot.snapshotHash,
    );
    expect(second.queueHealthSnapshots.map((snapshot) => snapshot.queueSnapshotHash)).toEqual(
      first.queueHealthSnapshots.map((snapshot) => snapshot.queueSnapshotHash),
    );
  });
});
