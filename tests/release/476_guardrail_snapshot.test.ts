import { describe, expect, it } from "vitest";
import { build476ReleaseWaveArtifacts } from "../../tools/release/plan_476_release_waves";

describe("task 476 guardrail snapshots and edge cases", () => {
  it("defines interval guardrails for latency, errors, incidents, projection lag, support load, and safety signals", () => {
    const { waveGuardrailSnapshots } = build476ReleaseWaveArtifacts();
    const wave1 = waveGuardrailSnapshots.snapshots.find(
      (snapshot: any) => snapshot.snapshotId === "wgs_476_wave1_core_web",
    );

    expect(wave1.state).toBe("green");
    expect(wave1.runtimePublicationBundleRef).toBe("rpb::local::authoritative");
    expect(wave1.releaseWatchTupleHash).toMatch(/^[a-f0-9]{64}$/);

    const ruleKinds = wave1.guardrailRules.map((rule: any) => rule.ruleKind);
    expect(ruleKinds).toEqual(
      expect.arrayContaining([
        "latency_budget",
        "error_budget",
        "incident_ceiling",
        "support_load",
        "projection_lag",
        "clinical_safety",
      ]),
    );
    expect(wave1.staleEvidencePolicy).toContain("blocks widening");
  });

  it("blocks superseded runtime bundle, reference-data rollback gap, too-short observation, and cohort regroup widening", () => {
    const {
      waveGuardrailSnapshots,
      waveObservationPolicies,
      waveEligibilityVerdicts,
      blastRadiusMatrix,
      tenantCohortRolloutPlan,
    } = build476ReleaseWaveArtifacts();

    const superseded = waveGuardrailSnapshots.snapshots.find(
      (snapshot: any) => snapshot.snapshotId === "wgs_476_superseded_runtime_bundle_edge_case",
    );
    expect(superseded.state).toBe("blocked");
    expect(superseded.runtimePublicationBundleRef).toContain("superseded");
    expect(superseded.blockerRefs).toContain("blocker:476:runtime-publication-bundle-superseded");

    const rollbackGap = tenantCohortRolloutPlan.rollbackBindings.find(
      (binding: any) =>
        binding.rollbackBindingId === "wrb_476_wave2_feature_surface_reference_data_gap",
    );
    expect(rollbackGap.state).toBe("blocked");
    expect(rollbackGap.featureSurfaceRollbackRef).toBeTruthy();
    expect(rollbackGap.referenceDataRollbackRef).toBeNull();
    expect(rollbackGap.blockerRefs).toContain("blocker:476:reference-data-rollback-gap");

    const shortObservation = waveObservationPolicies.policies.find(
      (policy: any) => policy.policyId === "wop_476_too_short_observation_edge_case",
    );
    expect(shortObservation.state).toBe("blocked");
    expect(shortObservation.dwellWindow).toBe("PT4H");
    expect(shortObservation.minimumObservationHours).toBe(24);
    expect(shortObservation.blockerRefs).toContain(
      "blocker:476:observation-window-too-short-for-incident-support-metrics",
    );

    const regroupingProof = blastRadiusMatrix.edgeCaseProofs.find(
      (proof: any) => proof.edgeCaseId === "edge_476_cohort_selector_regrouping",
    );
    expect(regroupingProof.proofState).toBe("blocked");
    expect(regroupingProof.originalSelectorDigest).not.toBe(
      regroupingProof.regroupedSelectorDigest,
    );

    const regroupingVerdict = waveEligibilityVerdicts.edgeCaseVerdicts.find(
      (verdict: any) => verdict.verdictId === "wev_476_edge_cohort_selector_widened",
    );
    expect(regroupingVerdict.verdict).toBe("blocked");
  });

  it("keeps NHS App and assistive edge cases explicitly constrained instead of hidden behind flags", () => {
    const { tenantCohortRolloutPlan, waveEligibilityVerdicts } = build476ReleaseWaveArtifacts();

    const nhsAppVerdict = waveEligibilityVerdicts.edgeCaseVerdicts.find(
      (verdict: any) => verdict.verdictId === "wev_476_edge_core_web_not_nhs_app",
    );
    expect(nhsAppVerdict.verdict).toBe("eligible_with_constraints");
    expect(nhsAppVerdict.deniedScopes).toContain("nhs_app");

    const patientNoPharmacy = waveEligibilityVerdicts.edgeCaseVerdicts.find(
      (verdict: any) => verdict.verdictId === "wev_476_edge_patient_routes_not_pharmacy",
    );
    expect(patientNoPharmacy.verdict).toBe("eligible_with_constraints");
    expect(patientNoPharmacy.deniedScopes).toContain("pharmacy_dispatch");

    const assistiveScope = tenantCohortRolloutPlan.assistiveScopes.find(
      (scope: any) => scope.assistiveScopeId === "was_476_assistive_visible_narrow_staff",
    );
    expect(assistiveScope.visibleModePermitted).toBe(true);
    expect(assistiveScope.visibleStaffCohort).toEqual([
      "clinical_safety_officer",
      "clinician_superuser",
    ]);
    expect(assistiveScope.allStaffPermitted).toBe(false);
    expect(assistiveScope.patientFacingPermitted).toBe(false);
  });
});
