import { describe, expect, it } from "vitest";
import { build474CutoverArtifacts } from "../../tools/migration/plan_474_cutover";

describe("task 474 read-path compatibility", () => {
  it("blocks contractive removal and premature command schema flags", () => {
    const { readPathCompatibilityWindow } = build474CutoverArtifacts();

    const contractive = readPathCompatibilityWindow.windows.find(
      (window) => window.windowKind === "contractive",
    );
    expect(contractive?.state).toBe("blocked");
    expect(contractive?.legacyReadPathActive).toBe(true);
    expect(contractive?.blockerRefs).toContain(
      "blocker:474:legacy-patient-status-read-path-active",
    );

    const commandSchemaGuard = readPathCompatibilityWindow.featureFlagGuards.find(
      (guard) => guard.guardId === "ffg_474_new_command_schema_window_start",
    );
    expect(commandSchemaGuard?.state).toBe("blocked");
    expect(commandSchemaGuard?.reason).toMatch(/cannot enable before/i);

    expect(
      readPathCompatibilityWindow.routeBindings.every(
        (binding) =>
          binding.routeContractDigestRef.startsWith("route-contract-digest::") &&
          binding.frontendContractDigestRef.startsWith("frontend-contract-digest::") &&
          binding.projectionQueryDigestRef.startsWith("projection-query-digest::") &&
          binding.mutationCommandDigestRef.startsWith("mutation-command-digest::"),
      ),
    ).toBe(true);
  });

  it("keeps stale pharmacy projection from enabling destructive cutover", () => {
    const { projectionReadinessVerdicts, cutoverRunbook } = build474CutoverArtifacts();
    const pharmacy = projectionReadinessVerdicts.verdicts.find(
      (verdict) => verdict.projectionFamily === "pharmacy_console",
    );

    expect(pharmacy?.convergenceState).toBe("stale");
    expect(pharmacy?.allowDestructiveCutover).toBe(false);
    expect(cutoverRunbook.programmeCutoverPlan.destructiveExecutionPermitted).toBe(false);
    expect(cutoverRunbook.programmeCutoverPlan.blockerRefs).toContain(
      "blocker:474:pharmacy-console-projection-stale",
    );
  });
});
