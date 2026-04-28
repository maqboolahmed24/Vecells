import { describe, expect, it } from "vitest";
import {
  COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF,
  createComplianceLedgerProjection,
} from "../../apps/ops-console/src/compliance-ledger-phase9.model";

describe("task 459 compliance ledger projection invariants", () => {
  it("binds ledger rows to graph and control snapshot refs", () => {
    const projection = createComplianceLedgerProjection({ scenarioState: "normal" });

    expect(projection.ledgerRows).toHaveLength(6);
    for (const row of projection.ledgerRows) {
      expect(row.controlStatusSnapshotId).toMatch(/^CSS_459_/);
      expect(row.assuranceControlRecordRef).toMatch(/^ACR_454_/);
      expect(row.graphHash).toBe(projection.evidenceGraphMiniMap.graphHash);
      expect(row.artifactRefs).toContain(
        projection.resolutionActionPreview.requiresArtifactPresentationContractRef,
      );
    }
  });

  it("does not render artifact URLs in handoff data", () => {
    const projection = createComplianceLedgerProjection({ scenarioState: "exact" });

    expect(projection.noRawArtifactUrls).toBe(true);
    expect(projection.safeHandoffLinks).toHaveLength(6);
    expect(JSON.stringify(projection.safeHandoffLinks)).not.toMatch(/https?:\/\//);
    expect(projection.safeHandoffLinks.every((link) => link.route.startsWith("/ops"))).toBe(true);
  });

  it("keeps graph-drift blocked and references the interface gap artifact", () => {
    const projection = createComplianceLedgerProjection({ scenarioState: "graph_drift" });

    expect(projection.graphBlocker.graphVerdictState).toBe("blocked");
    expect(projection.actionControlState).toBe("blocked");
    expect(projection.interfaceGapArtifactRef).toBe(COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF);
    expect(projection.graphBlocker.blockerRefs).toContain(
      COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF,
    );
  });

  it("drives the drawer from selected gap refs", () => {
    const initial = createComplianceLedgerProjection({ scenarioState: "overdue_owner" });
    const secondGap = initial.gapQueue.items[1]?.gapRef ?? initial.gapQueue.items[0]!.gapRef;
    const selected = createComplianceLedgerProjection({
      scenarioState: "overdue_owner",
      selectedGapRef: secondGap,
    });

    expect(selected.selectedGapRef).toBe(secondGap);
    expect(selected.resolutionActionPreview.selectedGapRef).toBe(secondGap);
  });
});
