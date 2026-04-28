import { describe, expect, it } from "vitest";
import {
  calculateBreachRisk,
  calculateQueueAggregateBreachProbability,
  createPhase9OperationalProjectionFixture,
  deriveInterventionCandidateEligibility,
  derivePermittedDashboardPosture,
  evaluateEquitySliceMetric,
  evaluateMetricAnomaly,
  hashOperationalMetricDefinition,
  validateDashboardMetricTileContract,
  validateMetricAggregationTenantScope,
  validateOperationalContractDefinitionCoverage,
  validateOperationalContractObject,
  validateOpsOverviewSliceEnvelope,
  type OpsOverviewSliceEnvelope,
} from "../../packages/domains/analytics_assurance/src/phase9-operational-projection-contracts.ts";

function baseRiskInput() {
  const fixture = createPhase9OperationalProjectionFixture();
  return {
    breachRiskRecordId: "brr_test",
    entityType: "triage_task",
    entityRef: "triage-task:test",
    riskType: "sla_breach" as const,
    severity: "high" as const,
    predictedAt: fixture.generatedAt,
    windowCloseAt: "2026-04-27T10:00:00.000Z",
    effectiveWorkloadAheadMinutes: 40,
    laneCapacityP10WorkloadMinutesPerWorkingMinute: 2,
    staffedAvailabilityMultiplier: 1,
    dependencyDegradationMultiplier: 1,
    serviceMeanMinutes: 10,
    serviceVarianceMinutesSquared: 9,
    dependencyDelayMeanMinutes: 0,
    dependencyDelayVarianceMinutesSquared: 0,
    severityWeight: 2,
    breachWindowMinutes: 60,
    queueSnapshotHash: fixture.examples.QueueHealthSnapshot.queueHealthSnapshotId.padEnd(64, "a").slice(0, 64),
    supportingMetricRefs: ["omd_433_triage_queue_health"],
    explanationVectorRef: "explain:test",
  };
}

describe("433 Phase 9 operational projection contracts", () => {
  it("validates frozen operational contract definitions and valid examples", () => {
    const coverage = validateOperationalContractDefinitionCoverage();
    const fixture = createPhase9OperationalProjectionFixture();

    expect(coverage).toEqual({ valid: true, errors: [] });
    for (const contractName of fixture.contractNames) {
      expect(validateOperationalContractObject(contractName, fixture.examples[contractName])).toEqual({
        valid: true,
        errors: [],
      });
    }
  });

  it("breach probability rises when slack decreases", () => {
    const input = baseRiskInput();
    const generous = calculateBreachRisk({ ...input, workingMinuteSlack: 90 });
    const tight = calculateBreachRisk({ ...input, workingMinuteSlack: 30 });
    const overdue = calculateBreachRisk({ ...input, workingMinuteSlack: -5 });

    expect(tight.record.predictedProbability).toBeGreaterThan(generous.record.predictedProbability);
    expect(overdue.record.predictedProbability).toBe(1);
  });

  it("computes queue-level aggregate breach probability", () => {
    const aggregate = calculateQueueAggregateBreachProbability([
      { entityRef: "a", riskType: "sla_breach", predictedProbability: 0.2 },
      { entityRef: "b", riskType: "sla_breach", predictedProbability: 0.5 },
      { entityRef: "b", riskType: "sla_breach", predictedProbability: 0.1 },
    ]);

    expect(aggregate).toBeCloseTo(0.6, 10);
  });

  it("applies conservative capacity lower-bound behaviour", () => {
    const input = baseRiskInput();
    const normal = calculateBreachRisk({ ...input, dependencyDegradationMultiplier: 1 });
    const degraded = calculateBreachRisk({ ...input, dependencyDegradationMultiplier: 0.5 });

    expect(degraded.conservativeCapacityLowerBound).toBeLessThan(normal.conservativeCapacityLowerBound);
    expect(degraded.estimatedWaitMinutes).toBeGreaterThan(normal.estimatedWaitMinutes);
    expect(degraded.record.predictedProbability).toBeGreaterThan(normal.record.predictedProbability);
  });

  it("raises risk when dependency delay increases", () => {
    const input = baseRiskInput();
    const withoutDependencyDelay = calculateBreachRisk({
      ...input,
      dependencyDelayMeanMinutes: 0,
      dependencyDelayVarianceMinutesSquared: 0,
    });
    const withDependencyDelay = calculateBreachRisk({
      ...input,
      dependencyDelayMeanMinutes: 25,
      dependencyDelayVarianceMinutesSquared: 16,
    });

    expect(withDependencyDelay.dependencyDelayMeanMinutes).toBeGreaterThan(0);
    expect(withDependencyDelay.record.predictedProbability).toBeGreaterThan(
      withoutDependencyDelay.record.predictedProbability,
    );
  });

  it("prevents a stale projection from being trusted as interactive", () => {
    const fixture = createPhase9OperationalProjectionFixture();
    const staleProjection: OpsOverviewSliceEnvelope = {
      ...fixture.examples.OpsOverviewSliceEnvelope,
      freshnessState: "stale_review",
      renderMode: "interactive",
    };

    expect(derivePermittedDashboardPosture(staleProjection)).toBe("observe_only");
    expect(validateOpsOverviewSliceEnvelope(staleProjection).errors).toContain(
      `DASHBOARD_POSTURE_MISMATCH:${staleProjection.sliceEnvelopeId}:observe_only`,
    );
  });

  it("marks a low-support equity slice as insufficient rather than normal", () => {
    const lowSupport = evaluateEquitySliceMetric({
      equitySliceMetricId: "esm_low_support",
      sliceDefinition: "postcode_decile:demo",
      metricSetRef: "metric-set:waitlist",
      periodWindow: {
        periodStart: "2026-04-01T00:00:00.000Z",
        periodEnd: "2026-04-27T00:00:00.000Z",
      },
      effectiveSampleSize: 8,
      varianceMagnitude: 0.01,
      confidenceBandRef: "confidence:low-support",
      minimumSupport: 30,
    });

    expect(lowSupport.varianceState).toBe("insufficient_support");
    expect(lowSupport.persistenceState).toBe("insufficient_support");
  });

  it("uses anomaly hysteresis to prevent alert flapping", () => {
    const first = evaluateMetricAnomaly({
      metricAnomalySnapshotId: "mas_hysteresis_1",
      metricDefinitionRef: "omd_433_triage_queue_health",
      observedValue: 1,
      expectedValue: 0,
      sigmaHat: 0.1,
      sigmaFloor: 0.1,
      support: 100,
      minimumSupport: 30,
      thresholdPolicyRef: "threshold:test",
      capturedAt: "2026-04-27T09:00:00.000Z",
      policy: { lambda: 1, elevatedScore: 2, criticalScore: 5, exitHoldEvaluations: 2 },
    });
    const second = evaluateMetricAnomaly({
      metricAnomalySnapshotId: "mas_hysteresis_2",
      metricDefinitionRef: "omd_433_triage_queue_health",
      observedValue: 0.02,
      expectedValue: 0,
      sigmaHat: 0.1,
      sigmaFloor: 0.1,
      previousAlertState: first.snapshot.alertState,
      previousExitHoldCount: first.exitHoldCount,
      support: 100,
      minimumSupport: 30,
      thresholdPolicyRef: "threshold:test",
      capturedAt: "2026-04-27T09:01:00.000Z",
      policy: { lambda: 1, elevatedScore: 2, criticalScore: 5, exitHoldEvaluations: 2 },
    });
    const third = evaluateMetricAnomaly({
      metricAnomalySnapshotId: "mas_hysteresis_3",
      metricDefinitionRef: "omd_433_triage_queue_health",
      observedValue: 0.01,
      expectedValue: 0,
      sigmaHat: 0.1,
      sigmaFloor: 0.1,
      previousAlertState: second.snapshot.alertState,
      previousExitHoldCount: second.exitHoldCount,
      support: 100,
      minimumSupport: 30,
      thresholdPolicyRef: "threshold:test",
      capturedAt: "2026-04-27T09:02:00.000Z",
      policy: { lambda: 1, elevatedScore: 2, criticalScore: 5, exitHoldEvaluations: 2 },
    });

    expect(first.snapshot.alertState).toBe("critical");
    expect(second.snapshot.alertState).toBe("critical");
    expect(third.snapshot.alertState).toBe("normal");
  });

  it("blocks dashboard DTOs with missing trust/completeness state", () => {
    const result = validateDashboardMetricTileContract({
      stateLabel: "Normal",
      stateReason: "Looks fine locally.",
      primaryValue: "42",
      confidenceOrBound: "n/a",
      lastUpdated: "2026-04-27T09:00:00.000Z",
      freshnessState: "fresh",
      blockingRefs: [],
      allowedDrillIns: [],
      investigationScopeSeed: "scope:test",
    });

    expect(result.errors).toEqual([
      "DASHBOARD_FIELD_MISSING:trustState",
      "DASHBOARD_FIELD_MISSING:completenessState",
    ]);
  });

  it("denies cross-tenant metric aggregation", () => {
    const result = validateMetricAggregationTenantScope("tenant:a", [
      { sourceRef: "metric:a", tenantScope: "tenant:a" },
      { sourceRef: "metric:b", tenantScope: "tenant:b" },
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["CROSS_TENANT_METRIC_SOURCE:metric:b"]);
  });

  it("keeps metric definitions versioned and hashable", () => {
    const fixture = createPhase9OperationalProjectionFixture();
    const definition = fixture.metricDefinitions[0]!;
    const reordered = {
      normalizationVersionRef: definition.normalizationVersionRef,
      thresholdPolicyRef: definition.thresholdPolicyRef,
      minimumSupport: definition.minimumSupport,
      baselineModelRef: definition.baselineModelRef,
      ownerRole: definition.ownerRole,
      tenantScope: definition.tenantScope,
      aggregationWindow: definition.aggregationWindow,
      denominatorSpec: definition.denominatorSpec,
      numeratorSpec: definition.numeratorSpec,
      sourceProjection: definition.sourceProjection,
      metricCode: definition.metricCode,
      metricDefinitionId: definition.metricDefinitionId,
    };

    expect(definition.normalizationVersionRef).toBe("phase9.operational.metric-normalization.v1");
    expect(hashOperationalMetricDefinition(reordered)).toBe(hashOperationalMetricDefinition(definition));
  });

  it("degrades intervention leases when continuity proof or board tuples drift", () => {
    const fixture = createPhase9OperationalProjectionFixture();
    const sourceSlice = fixture.examples.OpsOverviewSliceEnvelope;

    expect(
      deriveInterventionCandidateEligibility({
        sourceSlice,
        boardTupleHash: sourceSlice.boardTupleHash,
        selectedEntityTupleHash: sourceSlice.selectedEntityTupleHash,
        selectionLeaseState: "live",
        deltaGateState: "safe_apply",
        releaseSurfaceAuthorityState: "live",
        drawerDeltaState: "aligned",
        continuityMatchesSession: true,
      }),
    ).toBe("executable");
    expect(
      deriveInterventionCandidateEligibility({
        sourceSlice,
        boardTupleHash: "f".repeat(64),
        selectedEntityTupleHash: sourceSlice.selectedEntityTupleHash,
        selectionLeaseState: "live",
        deltaGateState: "safe_apply",
        releaseSurfaceAuthorityState: "live",
        drawerDeltaState: "drifted",
        continuityMatchesSession: false,
      }),
    ).toBe("stale_reacquire");
  });
});
