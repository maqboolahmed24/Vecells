import { describe, expect, it } from "vitest";
import {
  createReleaseTrustFreezeApplication,
  releaseTrustFreezeMigrationPlanRefs,
  releaseTrustFreezePersistenceTables,
  releaseTrustFreezeWorkspaceScenarioIds,
} from "../src/release-trust-freeze.ts";

describe("release trust freeze command-api seam", () => {
  it("publishes the frozen release-trust simulator cases with stable authority outcomes", async () => {
    const application = createReleaseTrustFreezeApplication();
    const results = await application.simulation.runAllScenarios();
    const byScenario = Object.fromEntries(results.map((result) => [result.scenarioId, result]));

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/075_release_approval_freeze_channel_release_freeze_and_assurance_slice_trust_models.sql",
    );
    expect(application.migrationPlanRefs).toEqual(releaseTrustFreezeMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(releaseTrustFreezePersistenceTables);
    expect(application.parallelInterfaceGaps).toHaveLength(2);
    expect(results).toHaveLength(6);
    expect(releaseTrustFreezeWorkspaceScenarioIds).toHaveLength(6);

    expect(byScenario.live_exact_parity_trusted_slices.surfaceAuthorityState).toBe("live");
    expect(byScenario.diagnostic_only_degraded_slice.surfaceAuthorityState).toBe("diagnostic_only");
    expect(byScenario.recovery_only_active_channel_freeze.surfaceAuthorityState).toBe(
      "recovery_only",
    );
    expect(byScenario.blocked_missing_inputs.surfaceAuthorityState).toBe("blocked");
    expect(byScenario.blocked_standards_watchlist_drift.surfaceAuthorityState).toBe("blocked");
    expect(byScenario.recovery_only_parity_or_provenance_drift.surfaceAuthorityState).toBe(
      "recovery_only",
    );

    expect(byScenario.live_exact_parity_trusted_slices.verdict.calmTruthState).toBe("allowed");
    expect(byScenario.diagnostic_only_degraded_slice.verdict.mutationAuthorityState).toBe(
      "observe_only",
    );
    expect(byScenario.recovery_only_active_channel_freeze.verdict.mutationAuthorityState).toBe(
      "governed_recovery",
    );
    expect(byScenario.blocked_missing_inputs.blockers.length).toBeGreaterThan(0);
    expect(byScenario.blocked_standards_watchlist_drift.blockers).toContain(
      "DRIFT_STANDARDS_WATCHLIST_NOT_CURRENT",
    );
    expect(byScenario.recovery_only_parity_or_provenance_drift.blockers).toContain(
      "BLOCKER_RELEASE_PARITY_NOT_EXACT",
    );
  });
});
