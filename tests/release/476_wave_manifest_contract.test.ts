import { describe, expect, it } from "vitest";
import {
  build476ReleaseWaveArtifacts,
  type ReleaseWave476Scenario,
} from "../../tools/release/plan_476_release_waves";

describe("task 476 release wave manifest contract", () => {
  it("publishes five typed waves bound to release, runtime, cohort, guardrail, observation, rollback, and fallback records", () => {
    const { releaseWaveManifest } = build476ReleaseWaveArtifacts();

    expect(releaseWaveManifest.recordType).toBe("ProgrammeReleaseWaveManifest");
    expect(releaseWaveManifest.deploymentWaves).toHaveLength(5);
    expect(releaseWaveManifest.activationPermitted).toBe(false);
    expect(releaseWaveManifest.wideningPermitted).toBe(false);
    expect(releaseWaveManifest.waveManifestHash).toMatch(/^[a-f0-9]{64}$/);

    for (const wave of releaseWaveManifest.deploymentWaves) {
      expect(wave.recordType).toBe("DeploymentWave");
      expect(wave.releaseCandidateRef).toBe("RC_LOCAL_V1");
      expect(wave.runtimePublicationBundleRef).toMatch(/^rpb::local::/);
      expect(wave.releasePublicationParityRef).toBe("rpp::local::authoritative");
      expect(wave.tenantCohortRef).toMatch(/^wtc_476_/);
      expect(wave.channelScopeRef).toMatch(/^wcs_476_/);
      expect(wave.assistiveScopeRef).toMatch(/^was_476_/);
      expect(wave.guardrailSnapshotRef).toMatch(/^wgs_476_/);
      expect(wave.observationPolicyRef).toMatch(/^wop_476_/);
      expect(wave.rollbackBindingRef).toMatch(/^wrb_476_/);
      expect(wave.manualFallbackBindingRef).toMatch(/^wmfb_476_/);
      expect(wave.commandTransitionPolicy.settlementRecordRequired).toBe(true);
      expect(wave.commandTransitionPolicy.informalFeatureFlagsPermitted).toBe(false);
      expect(wave.recordHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("keeps wave 1 as the smallest approved blast radius with NHS App, pharmacy, and assistive exposure excluded", () => {
    const { releaseWaveManifest, blastRadiusMatrix, tenantCohortRolloutPlan } =
      build476ReleaseWaveArtifacts();
    const wave1 = releaseWaveManifest.deploymentWaves.find(
      (wave: any) => wave.waveId === "wave_476_1_core_web_canary",
    );
    expect(wave1).toBeDefined();
    expect(wave1.state).toBe("approved");
    expect(wave1.verdict).toBe("eligible_with_constraints");
    expect(wave1.blastRadiusExposure).toMatchObject({
      patients: 25,
      staff: 6,
      pharmacy: 0,
      nhs_app: 0,
      assistive: 0,
    });

    const wave1Score = blastRadiusMatrix.waveScores.find(
      (score: any) => score.waveId === wave1.waveId,
    );
    const approvedScores = releaseWaveManifest.deploymentWaves
      .filter((wave: any) => wave.state === "approved")
      .map((wave: any) =>
        blastRadiusMatrix.waveScores.find((score: any) => score.waveId === wave.waveId),
      );
    expect(
      approvedScores.every(
        (score: any) => score.totalExposureScore >= wave1Score.totalExposureScore,
      ),
    ).toBe(true);
    expect(blastRadiusMatrix.smallestApprovedWaveProof.noInformalFeatureFlagsPermitted).toBe(true);

    const channelScope = tenantCohortRolloutPlan.channelScopes.find(
      (scope: any) => scope.scopeId === wave1.channelScopeRef,
    );
    expect(channelScope.explicitlyExcludedChannels).toContain("nhs_app");
    expect(channelScope.explicitlyExcludedChannels).toContain("pharmacy_dispatch");

    const assistiveScope = tenantCohortRolloutPlan.assistiveScopes.find(
      (scope: any) => scope.assistiveScopeId === wave1.assistiveScopeRef,
    );
    expect(assistiveScope.visibleModePermitted).toBe(false);
    expect(assistiveScope.allStaffPermitted).toBe(false);
  });

  it("models draft, active, paused, blocked, and superseded states without enabling production activation", () => {
    const scenarios: readonly ReleaseWave476Scenario[] = [
      "draft",
      "active",
      "paused",
      "blocked",
      "superseded",
    ];

    for (const scenario of scenarios) {
      const { releaseWaveManifest } = build476ReleaseWaveArtifacts(scenario);
      expect(releaseWaveManifest.scenarioState).toBe(scenario);
      expect(releaseWaveManifest.activationPermitted).toBe(false);
      expect(releaseWaveManifest.wideningPermitted).toBe(false);

      const wave1 = releaseWaveManifest.deploymentWaves.find(
        (wave: any) => wave.waveId === "wave_476_1_core_web_canary",
      );
      if (scenario === "superseded") {
        expect(wave1.state).toBe("superseded");
        expect(wave1.verdict).toBe("superseded");
        expect(wave1.blockerRefs).toContain("blocker:476:runtime-publication-bundle-superseded");
      }
      if (scenario === "blocked") {
        expect(releaseWaveManifest.overallReadinessVerdict).toBe("blocked");
        expect(wave1.verdict).toBe("blocked");
      }
      if (scenario === "active") expect(wave1.state).toBe("active");
      if (scenario === "paused") expect(wave1.state).toBe("paused");
      if (scenario === "draft") expect(wave1.state).toBe("draft");
    }
  });
});
