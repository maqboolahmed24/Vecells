import { describe, expect, it } from "vitest";
import { build488ScenarioRecords } from "../../tools/archive/archive_488_launch_evidence";

describe("488 retention, legal hold and export posture", () => {
  it("protects every active launch evidence item from deletion", () => {
    const records = build488ScenarioRecords("sealed_with_exceptions", []);

    expect(records.retentionClassifications.every((row) => row.classificationState === "classified")).toBe(
      true,
    );
    expect(records.legalHoldBindings.some((binding) => binding.legalHoldState === "active")).toBe(
      true,
    );
    expect(records.deletionVerdicts.every((verdict) => verdict.deletionPermitted === false)).toBe(
      true,
    );
    expect(records.deletionVerdicts.every((verdict) => verdict.replayDependencyProtected)).toBe(true);
  });

  it("blocks legal-hold deletion conflicts", () => {
    const records = build488ScenarioRecords("legal_hold_deletion_conflict", []);

    expect(records.manifest.archiveVerdict).toBe("blocked");
    expect(records.legalHoldBindings.some((binding) => binding.conflictState === "blocked")).toBe(
      true,
    );
    expect(records.manifest.blockerRefs).toContain(
      "blocker:488:legal-hold-conflicts-with-deletion",
    );
  });

  it("quarantines sensitive trace artifacts and blocks unauthorized export", () => {
    const quarantine = build488ScenarioRecords("trace_sensitive_quarantine", []);
    expect(quarantine.exportPosture.exportState).toBe("quarantined");
    expect(quarantine.items.some((item) => item.quarantineState === "quarantined")).toBe(true);

    const unauthorized = build488ScenarioRecords("unauthorized_export", []);
    expect(unauthorized.accessGrant.grantState).toBe("denied");
    expect(unauthorized.exportPosture.exportState).toBe("blocked");
    expect(unauthorized.manifest.blockerRefs).toContain("blocker:488:archive-export-role-denied");
  });
});
