import { describe, expect, it } from "vitest";
import {
  build479DressRehearsalArtifacts,
  hashValue,
} from "../../tools/testing/run_479_dress_rehearsal";

const requiredEdgeCases = [
  "edge_479_patient_resume_after_projection_refresh",
  "edge_479_red_flag_diversion_preserves_audit",
  "edge_479_staff_queue_resort_selected_item_in_flight",
  "edge_479_booking_slot_invalidates_safe_state",
  "edge_479_pharmacy_provider_unavailable_manual_fallback",
  "edge_479_assistive_trust_downgrade_suppresses_insert",
  "edge_479_nhs_app_deferred_core_web_passes",
  "edge_479_network_reconnect_no_duplicate_settlement",
] as const;

describe("479 production-like dress rehearsal contract", () => {
  it("covers required primary flows and edge cases with deterministic scenario records", () => {
    const manifest = build479DressRehearsalArtifacts();
    const scenarios = manifest.scenarios;
    const edgeCases = new Set(scenarios.flatMap((scenario) => scenario.requiredEdgeCaseRefs));

    expect(scenarios.length).toBeGreaterThanOrEqual(8);
    expect(new Set(scenarios.map((scenario) => scenario.scenarioFamily))).toEqual(
      new Set(["patient", "staff", "hub_pharmacy_booking", "assistive_channel"]),
    );
    for (const edgeCase of requiredEdgeCases) {
      expect(edgeCases.has(edgeCase)).toBe(true);
    }
    expect(
      scenarios.find(
        (scenario) => scenario.scenarioId === "drs_479_nhs_app_deferred_core_web_passes",
      )?.launchClassification,
    ).toBe("constrained_launch");
  });

  it("binds personas, tenant scopes, release waves, runbooks, rollback practice, and probes", () => {
    const manifest = build479DressRehearsalArtifacts();
    expect(manifest.patientPersonas.length).toBeGreaterThanOrEqual(3);
    expect(manifest.staffPersonas.length).toBeGreaterThanOrEqual(5);
    expect(manifest.tenantScopes.map((scope) => scope.tenantScopeId)).toContain(
      "tenant_scope_479_wave1_core_web",
    );
    expect(manifest.releaseWaveDressRehearsalBindings.length).toBeGreaterThanOrEqual(3);

    for (const scenario of manifest.scenarios) {
      expect(scenario.runbookRefs.length).toBeGreaterThan(0);
      expect(scenario.observationProbeRefs.length).toBeGreaterThan(0);
      expect(scenario.rollbackPracticeRefs.length).toBeGreaterThan(0);
      expect(scenario.runtimePublicationBundleRef).toBe("rpb::local::authoritative");
    }
  });

  it("keeps command settlement fail-closed and duplicate reconnect settlement impossible", () => {
    const manifest = build479DressRehearsalArtifacts();
    expect(
      manifest.runbookExerciseBindings.every(
        (binding) => binding.settlementRequiredBeforeCompletionClaim === true,
      ),
    ).toBe(true);
    expect(
      manifest.observationProbeEvidence.every(
        (probe) => probe.completionClaimPermittedBeforeSettlement === false,
      ),
    ).toBe(true);
    expect(
      manifest.rollbackPracticeEvidence.every(
        (rollback) => rollback.completionClaimPermittedBeforeSettlement === false,
      ),
    ).toBe(true);
    expect(
      manifest.scenarios.find(
        (scenario) => scenario.scenarioId === "drs_479_network_reconnect_no_duplicate_settlement",
      )?.requiredEdgeCaseRefs,
    ).toContain("edge_479_network_reconnect_no_duplicate_settlement");
  });

  it("uses synthetic-only fixture data and stable record hashes", () => {
    const manifest = build479DressRehearsalArtifacts();
    const serialized = JSON.stringify(manifest);
    expect(serialized).not.toMatch(
      /patientNhs|nhsNumber|Bearer |access_token|refresh_token|PRIVATE KEY|sk_live/i,
    );

    const { recordHash, ...withoutHash } = manifest;
    expect(recordHash).toBe(hashValue(withoutHash));
    for (const scenario of manifest.scenarios) {
      const { recordHash: scenarioHash, ...scenarioWithoutHash } = scenario;
      expect(scenarioHash).toBe(hashValue(scenarioWithoutHash));
    }
  });
});
