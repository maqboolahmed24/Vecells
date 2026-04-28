import { describe, expect, it } from "vitest";
import {
  createInitialGovernanceShellState,
  deriveGovernanceRecoveryPosture,
  deriveGovernanceVisualizationAuthority,
  parseGovernancePath,
  resolveGovernanceShellSnapshot,
} from "./governance-shell-seed.model";

describe("governance shell seed model", () => {
  it("maps route grammar and scope-bound defaults correctly", () => {
    const location = parseGovernancePath("/ops/config/bundles");

    expect(location.routeKey).toBe("config_bundles");
    expect(location.routeFamilyRef).toBe("rf_governance_shell");
    expect(location.anchorKey).toBe("governance-diff");
    expect(location.supportRegion).toBe("impact");
  });

  it("maps records lifecycle child routes into the governance shell", () => {
    const holds = parseGovernancePath("/ops/governance/records/holds");
    const disposition = parseGovernancePath("/ops/governance/records/disposition");

    expect(holds.routeKey).toBe("governance_records_holds");
    expect(holds.routeFamilyRef).toBe("rf_governance_shell");
    expect(holds.defaultObjectId).toBe("records-hold-09");
    expect(disposition.routeKey).toBe("governance_records_disposition");
    expect(disposition.defaultObjectId).toBe("records-disposition-31");
  });

  it("derives freeze posture and visualization authority truthfully", () => {
    expect(deriveGovernanceRecoveryPosture("writable")).toBe("live");
    expect(deriveGovernanceRecoveryPosture("review_only")).toBe("read_only");
    expect(deriveGovernanceRecoveryPosture("freeze_conflict")).toBe("recovery_only");
    expect(deriveGovernanceRecoveryPosture("scope_drift")).toBe("blocked");

    expect(deriveGovernanceVisualizationAuthority("writable")).toBe("visual_table_summary");
    expect(deriveGovernanceVisualizationAuthority("freeze_conflict")).toBe("summary_only");
  });

  it("composes release support data without widening writable posture", () => {
    const state = createInitialGovernanceShellState("/ops/release", {
      freezeDisposition: "freeze_conflict",
    });
    const snapshot = resolveGovernanceShellSnapshot(state, 1440);

    expect(snapshot.supportRegion).toBe("release");
    expect(snapshot.releaseTuple.publicationState).toContain("drifted");
    expect(snapshot.recoveryPosture).toBe("recovery_only");
    expect(snapshot.artifactModeState).toBe("governed_preview");
  });
});
