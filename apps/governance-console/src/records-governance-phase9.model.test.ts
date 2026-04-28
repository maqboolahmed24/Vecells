import { describe, expect, it } from "vitest";
import {
  RECORDS_GOVERNANCE_SCHEMA_VERSION,
  createRecordsGovernanceFixture,
  createRecordsGovernanceProjection,
  recordsGovernanceRouteModeForPath,
} from "./records-governance-phase9.model";

describe("records governance phase 9 model", () => {
  it("normalizes route modes and required routes", () => {
    expect(recordsGovernanceRouteModeForPath("/ops/governance/records")).toBe("records");
    expect(recordsGovernanceRouteModeForPath("/ops/governance/records/holds")).toBe("holds");
    expect(recordsGovernanceRouteModeForPath("/ops/governance/records/disposition")).toBe(
      "disposition",
    );

    const fixture = createRecordsGovernanceFixture();
    expect(fixture.schemaVersion).toBe(RECORDS_GOVERNANCE_SCHEMA_VERSION);
    expect(fixture.routes).toEqual([
      "/ops/governance/records",
      "/ops/governance/records/holds",
      "/ops/governance/records/disposition",
    ]);
  });

  it("renders all current lifecycle refs together for reviewed rows", () => {
    const projection = createRecordsGovernanceProjection({
      scenarioState: "normal",
      selectedObjectId: "records-hold-09",
    });
    const selected = projection.lifecycleLedgerRows.find((row) => row.selected);

    expect(selected?.retentionLifecycleBindingRef).toContain("rlb_442");
    expect(selected?.retentionDecisionRef).toContain("rd_442");
    expect(selected?.activeFreezeRefs).toContain("rfr_442_hold_h09_freeze");
    expect(selected?.activeLegalHoldRefs).toContain("lhr_442_h09_active");
    expect(selected?.dispositionEligibilityAssessmentRef).toContain("dea_442");
    expect(selected?.currentAssessmentOnly).toBe(true);
    expect(selected?.rawBatchCandidate).toBe(false);
  });

  it("keeps WORM and replay-critical artifacts out of delete-ready posture", () => {
    const projection = createRecordsGovernanceProjection({
      routePath: "/ops/governance/records/disposition",
      selectedObjectId: "records-freeze-archive-14",
    });
    const protectedRows = projection.lifecycleLedgerRows.filter(
      (row) => row.graphCriticality === "worm" || row.graphCriticality === "replay_critical",
    );

    expect(protectedRows.length).toBeGreaterThan(0);
    expect(protectedRows.every((row) => row.deleteControlState === "suppressed")).toBe(true);
    expect(
      projection.actionRail.find((action) => action.actionType === "approve_deletion_job")?.allowed,
    ).toBe(false);
  });

  it("requires superseding assessment after hold release before delete posture returns", () => {
    const projection = createRecordsGovernanceProjection({
      scenarioState: "settlement_pending",
      routePath: "/ops/governance/records/holds",
    });

    expect(projection.actionControlState).toBe("settlement_pending");
    expect(
      projection.legalHoldQueue.some(
        (hold) => hold.supersessionState === "released_needs_assessment",
      ),
    ).toBe(true);
    expect(
      projection.actionRail.find((action) => action.actionType === "approve_deletion_job")?.allowed,
    ).toBe(false);
  });

  it("freezes action controls on stale graph or denied scope", () => {
    const stale = createRecordsGovernanceProjection({ scenarioState: "stale" });
    const denied = createRecordsGovernanceProjection({ scenarioState: "permission-denied" });

    expect(stale.bindingState).toBe("revalidation_required");
    expect(stale.graphCompletenessState).toBe("stale");
    expect(stale.actionRail.every((action) => !action.allowed)).toBe(true);
    expect(denied.bindingState).toBe("blocked");
    expect(denied.actionRail.every((action) => !action.allowed)).toBe(true);
  });

  it("keeps artifact stages summary-first and contract-bound", () => {
    const projection = createRecordsGovernanceProjection({ scenarioState: "normal" });

    expect(projection.deletionCertificateStage.artifactPresentationContractRef).toContain(
      "apc_443",
    );
    expect(projection.archiveManifestStage.outboundNavigationGrantRef).toContain("ong_455");
    expect(projection.archiveManifestStage.artifactState).toBe("external_handoff_ready");
  });
});
