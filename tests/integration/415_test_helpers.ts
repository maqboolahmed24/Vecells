import {
  type AssistiveMonitoringActorContext,
  type AssistiveMonitoringActorRole,
  type RegisterReleaseGuardThresholdCommand,
  type RegisterWatchTupleCommand,
} from "../../packages/domains/assistive_monitoring/src/index.ts";

export const fixedClock = { now: () => "2026-04-28T01:15:00.000Z" };

export function actor(
  actorRole: AssistiveMonitoringActorRole,
  purposeOfUse = "phase8_monitoring_test",
): AssistiveMonitoringActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse,
    routeIntentBindingRef: "route-intent:assistive-monitoring",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

export function watchTupleCommand(): RegisterWatchTupleCommand {
  return {
    capabilityCode: "documentation.note_draft",
    releaseCandidateRef: "assistive-release-candidate:rc1",
    rolloutLadderPolicyRef: "assistive-rollout-ladder:doc:v1",
    modelVersionRef: "model-version:gpt-5.4:clinical-doc:v1",
    promptBundleHash: "prompt-bundle-hash:doc:v1",
    policyBundleRef: "compiled-policy-bundle:phase8:v1",
    releaseCohortRef: "release-cohort:staff-pilot-a",
    surfaceRouteContractRefs: ["surface-route-contract:clinical-workspace:v1"],
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    calibrationBundleRef: "calibration-bundle:doc:v1",
    uncertaintySelectorVersionRef: "uncertainty-selector:doc:v1",
    conformalBundleRef: "conformal-bundle:doc:v1",
    thresholdSetRef: "threshold-set:doc:v1",
  };
}

export function precisionThresholdCommand(): RegisterReleaseGuardThresholdCommand {
  return {
    capabilityCode: "documentation.note_draft",
    metricCode: "precision_slice",
    metricLevel: "visible",
    targetRiskAlpha: 0.05,
    minimumSampleSize: 30,
    intervalMethodRef: "wilson_95",
    sequentialDetectorPolicyRef: "sequential-detector:anytime-risk:v1",
    warningLevel: 0.82,
    blockLevel: 0.72,
    effectSizeFloor: 0.08,
    evidenceBoundary: 0.8,
    metricDirection: "higher_is_better",
    penaltyWeight: 1,
  };
}

export function driftThresholdCommand(): RegisterReleaseGuardThresholdCommand {
  return {
    capabilityCode: "documentation.note_draft",
    metricCode: "output_js",
    metricLevel: "release",
    targetRiskAlpha: 0.05,
    minimumSampleSize: 50,
    intervalMethodRef: "beta_binomial_95",
    sequentialDetectorPolicyRef: "sequential-detector:js-boundary:v1",
    warningLevel: 0.2,
    blockLevel: 0.35,
    effectSizeFloor: 0.12,
    evidenceBoundary: 0.9,
    metricDirection: "lower_is_better",
    penaltyWeight: 1,
  };
}
