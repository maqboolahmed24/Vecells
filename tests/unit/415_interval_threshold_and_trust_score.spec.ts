import { describe, expect, it } from "vitest";
import { createAssistiveMonitoringPlane } from "../../packages/domains/assistive_monitoring/src/index.ts";
import {
  actor,
  driftThresholdCommand,
  fixedClock,
  precisionThresholdCommand,
  watchTupleCommand,
} from "../integration/415_test_helpers.ts";

describe("415 interval-aware thresholds and trust scoring", () => {
  it("does not treat tiny fairness slices as healthy and blocks decisive interval breaches", () => {
    const plane = createAssistiveMonitoringPlane({ clock: fixedClock });
    const watchTuple = plane.watchTuples.registerWatchTuple(
      watchTupleCommand(),
      actor("watch_tuple_registry"),
    );
    const threshold = plane.thresholds.registerThreshold(
      precisionThresholdCommand(),
      actor("release_guard_threshold_service"),
    );

    const tinySlice = plane.fairnessMetrics.recordSliceMetric(
      {
        capabilityCode: "documentation.note_draft",
        watchTupleHash: watchTuple.watchTupleHash,
        sliceDefinition: "accent:north-east",
        clinicallyComparableStratumRef: "stratum:minor-illness-docs",
        metricCode: "precision_slice",
        metricDirection: "higher_is_better",
        numerator: 4,
        denominator: 5,
        referenceSliceRef: "slice:all-staff",
        metricSet: "fairness-visible-v1",
        windowRef: "window:2026w18",
        thresholdRef: threshold.thresholdId,
      },
      actor("fairness_slice_metric_service"),
    );

    expect(tinySlice.actionState).toBe("insufficient_evidence");

    const failingSlice = plane.fairnessMetrics.recordSliceMetric(
      {
        capabilityCode: "documentation.note_draft",
        watchTupleHash: watchTuple.watchTupleHash,
        sliceDefinition: "accent:north-east",
        clinicallyComparableStratumRef: "stratum:minor-illness-docs",
        metricCode: "precision_slice",
        metricDirection: "higher_is_better",
        numerator: 50,
        denominator: 100,
        referenceSliceRef: "slice:all-staff",
        metricSet: "fairness-visible-v1",
        windowRef: "window:2026w19",
        thresholdRef: threshold.thresholdId,
      },
      actor("fairness_slice_metric_service"),
    );

    expect(failingSlice.intervalLow).toBeLessThan(0.72);
    expect(failingSlice.actionState).toBe("block");
  });

  it("requires both drift effect size and sequential evidence before blocking trust", () => {
    const plane = createAssistiveMonitoringPlane({ clock: fixedClock });
    const watchTuple = plane.watchTuples.registerWatchTuple(
      watchTupleCommand(),
      actor("watch_tuple_registry"),
    );
    const threshold = plane.thresholds.registerThreshold(
      driftThresholdCommand(),
      actor("release_guard_threshold_service"),
    );

    const noisySignal = plane.driftDetection.recordDriftSignal(
      {
        capabilityCode: "documentation.note_draft",
        watchTupleHash: watchTuple.watchTupleHash,
        metricCode: "output_js",
        segmentKey: "route:clinical-workspace",
        detectorType: "output_js",
        effectSize: 0.5,
        evidenceValue: 0.3,
        thresholdRef: threshold.thresholdId,
      },
      actor("drift_detection_orchestrator"),
    );

    expect(noisySignal.triggerState).toBe("watch");

    const decisiveSignal = plane.driftDetection.recordDriftSignal(
      {
        capabilityCode: "documentation.note_draft",
        watchTupleHash: watchTuple.watchTupleHash,
        metricCode: "output_js",
        segmentKey: "route:clinical-workspace",
        detectorType: "output_js",
        effectSize: 0.5,
        evidenceValue: 0.96,
        thresholdRef: threshold.thresholdId,
      },
      actor("drift_detection_orchestrator"),
    );

    const projection = plane.trustProjections.materializeTrustProjection(
      {
        watchTupleHash: watchTuple.watchTupleHash,
        audienceTier: "staff",
        assuranceSliceTrustRefs: ["assurance-slice:assistive-doc"],
        surfacePublicationState: "published",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        runtimePublicationState: "current",
        assistiveKillSwitchState: "inactive",
        freezeState: "none",
        releaseRecoveryDispositionRef: "release-recovery:assistive:v1",
        driftSignalRefs: [decisiveSignal.driftSignalId],
        calibrationEvidenceState: "complete",
        uncertaintyEvidenceState: "complete",
        outcomeEvidenceState: "complete",
        visibleEvidenceState: "complete",
        disclosureFenceState: "healthy",
      },
      actor("trust_projection_engine"),
    );

    expect(decisiveSignal.triggerState).toBe("block");
    expect(projection.thresholdState).toBe("block");
    expect(projection.trustState).toBe("quarantined");
    expect(projection.blockingReasonCodes).toContain("release_guard_threshold_block");
  });
});
