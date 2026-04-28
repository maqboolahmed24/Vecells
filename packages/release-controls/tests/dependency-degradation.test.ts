import { describe, expect, it } from "vitest";
import {
  createDependencyDegradationSimulationHarness,
  resolveDependencyDegradationDecision,
  resolveIntegrationDispatchDegradation,
  resolveProjectionPublicationDegradation,
} from "../src/index.ts";

describe("dependency degradation execution engine", () => {
  it("enforces bounded escalation ceilings for requested workload families", () => {
    const decision = resolveDependencyDegradationDecision({
      dependencyCode: "dep_nhs_login_rail",
      environmentRing: "local",
      routeFamilyRef: "rf_patient_home",
      observedFailureModeClass: "callback_ambiguity",
      healthState: "degraded",
      requestedWorkloadFamilyRefs: ["wf_command_orchestration", "wf_shadow_runtime_family"],
    });

    expect(decision.outcomeState).toBe("blocked");
    expect(decision.boundedWorkloadFamilyRefs).toContain("wf_command_orchestration");
    expect(decision.blockedEscalationFamilyRefs).toContain("wf_shadow_runtime_family");
  });

  it("keeps patient routes calm and read-only for identity callback ambiguity", () => {
    const decision = resolveDependencyDegradationDecision({
      dependencyCode: "dep_nhs_login_rail",
      environmentRing: "local",
      routeFamilyRef: "rf_patient_home",
      observedFailureModeClass: "callback_ambiguity",
      healthState: "degraded",
    });

    expect(decision.gatewayReadResolution.mode).toBe("read_only");
    expect(decision.browserMutationResolution.mode).toBe("refuse");
    expect(decision.primaryAudienceFallback.audienceType).toBe("patient");
    expect(decision.primaryAudienceFallback.fallbackMode).toBe("patient_safe_placeholder");
    expect(decision.assurancePublicationState).toBe("degraded");
  });

  it("marks transcript degradation as projection stale instead of halting unrelated dispatch", () => {
    const decision = resolveProjectionPublicationDegradation({
      dependencyCode: "dep_transcription_processing_provider",
      environmentRing: "integration",
      routeFamilyRef: "rf_support_replay_observe",
      observedFailureModeClass: "transport_loss",
      healthState: "degraded",
    });

    expect(decision.projectionPublicationResolution.mode).toBe("projection_stale");
    expect(decision.integrationDispatchResolution.mode).toBe("hold_current");
    expect(decision.primaryAudienceFallback.postureState).toBe("read_only");
  });

  it("keeps delivery failures queue-only instead of widening to platform command halt", () => {
    const decision = resolveIntegrationDispatchDegradation({
      dependencyCode: "dep_sms_notification_provider",
      environmentRing: "preprod",
      routeFamilyRef: "rf_patient_messages",
      observedFailureModeClass: "callback_ambiguity",
      healthState: "degraded",
    });

    expect(decision.integrationDispatchResolution.mode).toBe("queue_only");
    expect(decision.gatewayReadResolution.mode).toBe("summary_only");
    expect(decision.browserMutationResolution.mode).toBe("recovery_only");
  });

  it("holds recovery until publication and trust gates clear", () => {
    const decision = resolveDependencyDegradationDecision({
      dependencyCode: "dep_nhs_login_rail",
      environmentRing: "local",
      routeFamilyRef: "rf_patient_secure_link_recovery",
      observedFailureModeClass: "callback_ambiguity",
      healthState: "recovering",
      runtimePublicationState: "stale",
      parityState: "stale",
      routeExposureState: "frozen",
      trustFreezeLive: false,
      assuranceHardBlock: true,
    });

    expect(decision.decisionState).toBe("recovery_held");
    expect(decision.recoveryGate.readyToClear).toBe(false);
    expect(decision.recoveryGate.blockerRefs).toContain("RUNTIME_PUBLICATION_STALE");
    expect(decision.recoveryGate.blockerRefs).toContain("ASSURANCE_HARD_BLOCK");
  });

  it("publishes deterministic simulation scenarios and metrics", () => {
    const harness = createDependencyDegradationSimulationHarness();

    expect(harness.catalog.taskId).toBe("par_098");
    expect(harness.decisions).toHaveLength(6);
    expect(harness.metrics.degradedEntryCount).toBeGreaterThan(0);
    expect(harness.timeline).toHaveLength(6);
  });
});
