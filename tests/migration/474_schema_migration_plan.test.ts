import { describe, expect, it } from "vitest";
import { build474CutoverArtifacts } from "../../tools/migration/plan_474_cutover";

describe("task 474 schema migration plan", () => {
  it("publishes hashed migration plans with contractive and rollforward guards", () => {
    const { schemaMigrationPlan } = build474CutoverArtifacts();

    expect(schemaMigrationPlan.planSetHash).toMatch(/^[a-f0-9]{64}$/);
    expect(schemaMigrationPlan.executionOrder).toEqual(["expand", "migrate", "contract"]);
    expect(
      schemaMigrationPlan.migrationPlans.every((plan) =>
        plan.migrationPlanHash.match(/^[a-f0-9]{64}$/),
      ),
    ).toBe(true);

    const contractive = schemaMigrationPlan.migrationPlans.find(
      (plan) => plan.changeType === "contractive",
    );
    expect(contractive?.state).toBe("blocked");
    expect(contractive?.contractiveRemovalPermitted).toBe(false);
    expect(contractive?.blockerRefs).toContain(
      "blocker:474:legacy-patient-status-read-path-active",
    );

    const rollforwardOnly = schemaMigrationPlan.migrationPlans.find(
      (plan) => plan.changeType === "rollforward_only",
    );
    expect(rollforwardOnly?.rollbackMode).toBe("rollforward_only");
    expect(rollforwardOnly?.manualFallbackBindingRef).toBe(
      "manual-fallback:474:fhir-last-known-good-route",
    );

    expect(schemaMigrationPlan.edgeCaseGuards.map((guard) => guard.edgeCaseId)).toEqual(
      expect.arrayContaining([
        "contractive_migration_legacy_patient_status_active",
        "rollforward_only_requires_manual_fallback_route",
        "new_command_schema_before_read_path_window",
      ]),
    );
    expect(schemaMigrationPlan.sourceFileHashes.length).toBeGreaterThan(5);
  });
});
