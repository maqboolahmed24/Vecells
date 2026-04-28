import { describe, expect, it } from "vitest";
import { createAssistiveMonitoringPlane } from "../../packages/domains/assistive_monitoring/src/index.ts";
import {
  actor,
  driftThresholdCommand,
  fixedClock,
  precisionThresholdCommand,
  watchTupleCommand,
} from "./415_test_helpers.ts";

describe("415 drift, fairness, and incident linkage pipeline", () => {
  it("ingests shadow evidence, interval metrics, drift, and incidents into one conservative trust projection", () => {
    const plane = createAssistiveMonitoringPlane({ clock: fixedClock });
    const watchTuple = plane.watchTuples.registerWatchTuple(
      watchTupleCommand(),
      actor("watch_tuple_registry"),
    );
    const precisionThreshold = plane.thresholds.registerThreshold(
      precisionThresholdCommand(),
      actor("release_guard_threshold_service"),
    );
    const driftThreshold = plane.thresholds.registerThreshold(
      driftThresholdCommand(),
      actor("release_guard_threshold_service"),
    );

    const comparison = plane.shadowComparisons.recordShadowComparisonRun(
      {
        assistiveSessionRef: "assistive-session:case-001",
        humanOutcomeRef: "final-human-artifact:case-001",
        modelOutcomeRef: "assistive-artifact:case-001",
        deltaMetricsRef: "delta-metrics:case-001",
        overrideDispositionRef: "override-disposition:material-edit",
        decisionLatencyMs: 4200,
        evidenceLevel: "live_shadow",
        routeFamilyRef: "clinical-workspace",
        tenantRef: "tenant:practice-a",
        releaseCohortRef: "release-cohort:staff-pilot-a",
        watchTupleHash: watchTuple.watchTupleHash,
        metricWindowRef: "window:2026w18",
      },
      actor("shadow_comparison_runner"),
    );

    const fairness = plane.fairnessMetrics.recordSliceMetric(
      {
        capabilityCode: "documentation.note_draft",
        watchTupleHash: watchTuple.watchTupleHash,
        sliceDefinition: "channel:telephone",
        clinicallyComparableStratumRef: "stratum:minor-illness-docs",
        metricCode: "precision_slice",
        metricDirection: "higher_is_better",
        numerator: 40,
        denominator: 90,
        referenceSliceRef: "slice:all-staff",
        metricSet: "fairness-visible-v1",
        windowRef: "window:2026w18",
        thresholdRef: precisionThreshold.thresholdId,
      },
      actor("fairness_slice_metric_service"),
    );
    const drift = plane.driftDetection.recordDriftSignal(
      {
        capabilityCode: "documentation.note_draft",
        watchTupleHash: watchTuple.watchTupleHash,
        metricCode: "output_js",
        segmentKey: "tenant:practice-a",
        detectorType: "output_js",
        effectSize: 0.42,
        evidenceValue: 0.94,
        thresholdRef: driftThreshold.thresholdId,
      },
      actor("drift_detection_orchestrator"),
    );
    const incident = plane.incidentLinks.linkIncident(
      {
        assistiveSessionRef: comparison.assistiveSessionRef,
        watchTupleHash: watchTuple.watchTupleHash,
        incidentSystemRef: "incident:unsafe-omission-001",
        severity: "high",
        investigationState: "investigating",
      },
      actor("incident_link_service"),
    );

    const projection = plane.trustProjections.materializeTrustProjection(
      {
        watchTupleHash: watchTuple.watchTupleHash,
        audienceTier: "staff",
        assuranceSliceTrustRefs: ["assurance-slice:assistive-doc"],
        incidentRateRef: "incident-rate:window-2026w18",
        surfacePublicationState: "published",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        runtimePublicationState: "current",
        assistiveKillSwitchStateRef: "kill-switch-state:inactive",
        assistiveKillSwitchState: "inactive",
        freezeState: "none",
        releaseRecoveryDispositionRef: "release-recovery:assistive:v1",
        driftSignalRefs: [drift.driftSignalId],
        biasSliceMetricRefs: [fairness.sliceMetricId],
        incidentLinkRefs: [incident.incidentLinkId],
        calibrationEvidenceState: "complete",
        uncertaintyEvidenceState: "complete",
        outcomeEvidenceState: "complete",
        visibleEvidenceState: "complete",
        disclosureFenceState: "healthy",
      },
      actor("trust_projection_engine"),
    );

    expect(comparison.deltaMetricsRef).toBe("delta-metrics:case-001");
    expect(projection.trustState).toBe("quarantined");
    expect(projection.thresholdBreachRefs).toEqual(
      expect.arrayContaining([drift.driftSignalId, fairness.sliceMetricId]),
    );
    expect(projection.incidentLinkRefs).toEqual([incident.incidentLinkId]);
    expect(projection.blockingReasonCodes).toEqual(
      expect.arrayContaining([
        "release_guard_threshold_block",
        "active_high_severity_incident_link",
      ]),
    );
  });
});
