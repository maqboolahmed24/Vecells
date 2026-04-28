import { describe, expect, it } from "vitest";
import {
  COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF,
  COMPLIANCE_LEDGER_SCHEMA_VERSION,
  COMPLIANCE_LEDGER_VISUAL_MODE,
  createComplianceLedgerFixture,
  createComplianceLedgerProjection,
  normalizeComplianceLedgerScenarioState,
} from "./compliance-ledger-phase9.model";

describe("task 459 compliance ledger projection", () => {
  it("normalizes ledger-only scenario aliases", () => {
    expect(normalizeComplianceLedgerScenarioState("exact")).toBe("exact");
    expect(normalizeComplianceLedgerScenarioState("graph-drift")).toBe("graph_drift");
    expect(normalizeComplianceLedgerScenarioState("overdue")).toBe("overdue_owner");
    expect(normalizeComplianceLedgerScenarioState("permission-denied")).toBe("permission_denied");
  });

  it("projects a graph-complete ledger from the assurance graph", () => {
    const projection = createComplianceLedgerProjection({ scenarioState: "exact" });

    expect(projection.schemaVersion).toBe(COMPLIANCE_LEDGER_SCHEMA_VERSION);
    expect(projection.visualMode).toBe(COMPLIANCE_LEDGER_VISUAL_MODE);
    expect(projection.route).toBe("/ops/assurance");
    expect(projection.graphBlocker.graphVerdictState).toBe("complete");
    expect(projection.actionControlState).toBe("review_ready");
    expect(projection.ledgerRows).toHaveLength(6);
    expect(projection.gapQueue.items.length).toBeGreaterThan(0);
    expect(projection.noRawArtifactUrls).toBe(true);
  });

  it("downgrades stale and blocked graphs without allowing mutation handoffs", () => {
    const stale = createComplianceLedgerProjection({ scenarioState: "stale" });
    const blocked = createComplianceLedgerProjection({ scenarioState: "graph_drift" });

    expect(stale.graphBlocker.graphVerdictState).toBe("stale");
    expect(stale.actionControlState).toBe("diagnostic_only");
    expect(stale.resolutionActionPreview.actionAllowed).toBe(false);
    expect(blocked.graphBlocker.graphVerdictState).toBe("blocked");
    expect(blocked.actionControlState).toBe("blocked");
    expect(blocked.graphBlocker.blockerRefs).toContain(
      COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF,
    );
  });

  it("keeps permission denied metadata visible without artifact URLs", () => {
    const projection = createComplianceLedgerProjection({ scenarioState: "permission-denied" });

    expect(projection.actionControlState).toBe("metadata_only");
    expect(projection.resolutionActionPreview.actionAllowed).toBe(false);
    expect(projection.safeHandoffLinks.every((link) => link.rawArtifactUrlSuppressed)).toBe(true);
    expect(JSON.stringify(projection)).not.toMatch(/https?:\/\//);
  });

  it("sorts and filters the gap queue deterministically", () => {
    const projection = createComplianceLedgerProjection({
      scenarioState: "overdue_owner",
      activeFilter: "overdue",
      activeSort: "owner",
    });

    expect(projection.ownerBurden.overloadedOwnerCount).toBeGreaterThan(0);
    expect(projection.gapQueue.items.every((gap) => gap.queueStatus === "overdue")).toBe(true);
    expect(projection.gapQueueFilterSet.activeSort).toBe("owner");
  });

  it("publishes deterministic scenario and framework fixtures", () => {
    const fixture = createComplianceLedgerFixture();
    const recomputed = createComplianceLedgerFixture();

    expect(fixture.schemaVersion).toBe(COMPLIANCE_LEDGER_SCHEMA_VERSION);
    expect(fixture.scenarioProjections.exact.ledgerProjectionRef).toBe(
      recomputed.scenarioProjections.exact.ledgerProjectionRef,
    );
    expect(fixture.frameworkProjections.DSPT.selectedFrameworkCode).toBe("DSPT");
    expect(fixture.automationAnchors).toEqual(
      expect.arrayContaining([
        "compliance-ledger-panel",
        "control-evidence-gap-queue",
        "evidence-gap-resolution-drawer",
      ]),
    );
  });
});
