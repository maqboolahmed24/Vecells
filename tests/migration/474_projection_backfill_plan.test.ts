import { describe, expect, it } from "vitest";
import { build474CutoverArtifacts } from "../../tools/migration/plan_474_cutover";

describe("task 474 projection backfill plan", () => {
  it("proves cursor resume, staff exact convergence, and stale pharmacy blocking", () => {
    const { projectionBackfillPlan, projectionReadinessVerdicts } = build474CutoverArtifacts();

    expect(projectionBackfillPlan.planHash).toMatch(/^[a-f0-9]{64}$/);
    expect(projectionBackfillPlan.cutoverReadinessState).toBe("ready_with_constraints");

    const staff = projectionBackfillPlan.convergenceRecords.find(
      (record) => record.projectionFamily === "staff_workspace",
    );
    const pharmacy = projectionBackfillPlan.convergenceRecords.find(
      (record) => record.projectionFamily === "pharmacy_console",
    );
    expect(staff?.convergenceState).toBe("exact");
    expect(staff?.lagEvents).toBe(0);
    expect(pharmacy?.convergenceState).toBe("stale");
    expect(pharmacy?.blockerRefs).toContain("blocker:474:pharmacy-console-projection-stale");

    expect(
      projectionBackfillPlan.resumeCheckpoints.every(
        (checkpoint) => checkpoint.duplicateWormRowsAfterResume === 0,
      ),
    ).toBe(true);
    expect(
      projectionBackfillPlan.cursors.every((cursor) =>
        cursor.crashRestartProofRef.includes("no-duplicate-worm"),
      ),
    ).toBe(true);

    const poison = projectionBackfillPlan.poisonRecords[0];
    expect(poison?.poisonState).toBe("quarantined");
    expect(poison?.tenantWideBlock).toBe(false);
    expect(poison?.safeToContinue).toBe(true);

    expect(projectionReadinessVerdicts.destructiveExecutionPermitted).toBe(false);
    expect(
      projectionReadinessVerdicts.verdicts.find(
        (verdict) => verdict.projectionFamily === "pharmacy_console",
      )?.allowDestructiveCutover,
    ).toBe(false);
  });

  it("can materialize a blocked stale-projection scenario", () => {
    const { projectionBackfillPlan, projectionReadinessVerdicts } =
      build474CutoverArtifacts("blocked");

    expect(projectionBackfillPlan.cutoverReadinessState).toBe("blocked");
    expect(
      projectionBackfillPlan.convergenceRecords.find(
        (record) => record.projectionFamily === "pharmacy_console",
      )?.convergenceState,
    ).toBe("blocked");
    expect(projectionReadinessVerdicts.dryRunPermitted).toBe(false);
  });
});
