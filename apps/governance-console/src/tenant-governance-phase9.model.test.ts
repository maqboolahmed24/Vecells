import { describe, expect, it } from "vitest";
import {
  TENANT_GOVERNANCE_SCHEMA_VERSION,
  createTenantGovernanceFixture,
  createTenantGovernanceProjection,
  tenantGovernanceAutomationAnchors,
  tenantGovernanceRouteModeForPath,
} from "./tenant-governance-phase9.model";

describe("tenant governance phase 9 model", () => {
  it("normalizes route modes and publishes required routes", () => {
    expect(tenantGovernanceRouteModeForPath("/ops/governance/tenants")).toBe("governance_tenants");
    expect(tenantGovernanceRouteModeForPath("/ops/config/tenants")).toBe("config_tenants");
    expect(tenantGovernanceRouteModeForPath("/ops/config/bundles")).toBe("config_bundles");
    expect(tenantGovernanceRouteModeForPath("/ops/config/promotions")).toBe("config_promotions");
    expect(tenantGovernanceRouteModeForPath("/ops/release")).toBe("release");

    const fixture = createTenantGovernanceFixture();
    expect(fixture.schemaVersion).toBe(TENANT_GOVERNANCE_SCHEMA_VERSION);
    expect(fixture.routes).toEqual([
      "/ops/governance/tenants",
      "/ops/config/tenants",
      "/ops/config/bundles",
      "/ops/config/promotions",
      "/ops/release",
    ]);
  });

  it("renders tenant baseline matrix domains with exact, effective, inherited, and drift values", () => {
    const projection = createTenantGovernanceProjection({
      scenarioState: "normal",
      selectedTenantRef: "tenant:demo-gp",
      selectedDomainRef: "policy_packs",
    });

    expect(projection.matrixDomains).toHaveLength(10);
    expect(projection.tenantBaselineMatrix.length).toBeGreaterThanOrEqual(3);
    expect(projection.selectedMatrixRow.cells).toHaveLength(10);
    expect(
      projection.selectedMatrixRow.cells.every(
        (cell) => cell.exactValue && cell.effectiveValue && cell.versionRef,
      ),
    ).toBe(true);
    expect(
      projection.selectedMatrixRow.cells.some((cell) => cell.inheritanceState === "overridden"),
    ).toBe(true);
  });

  it("preserves the selected tenant anchor when matrix filters narrow the row set", () => {
    const projection = createTenantGovernanceProjection({
      scenarioState: "normal",
      selectedTenantRef: "tenant:harbour-west",
      matrixFilter: "blocked",
    });

    expect(projection.tenantBaselineMatrix[0]?.tenantRef).toBe("tenant:harbour-west");
    expect(projection.tenantBaselineMatrix[0]?.preservedByFilter).toBe(true);
    expect(projection.selectedTenantRef).toBe("tenant:harbour-west");
  });

  it("binds standards watchlist, compilation, simulation, and promotion evidence to 448", () => {
    const projection = createTenantGovernanceProjection({ scenarioState: "normal" });

    expect(projection.upstreamSchemaVersions["448"]).toBe("448.phase9.tenant-config-governance.v1");
    expect(projection.standardsWatchlist.standardsDependencyWatchlistRef).toBe(
      "sdw_448_7e3d2ba5df078e15",
    );
    expect(projection.promotionApprovalStatus.configCompilationRecordRef).toBe(
      "ccr_448_a5c8e178d266ad67",
    );
    expect(projection.promotionApprovalStatus.configSimulationEnvelopeRef).toBe(
      "cse_448_3f7afde42b5fcdf3",
    );
    expect(projection.noInterfaceGapRequired).toBe(true);
  });

  it("freezes compile and promote controls for stale, blocked, denied, and pending posture", () => {
    for (const scenarioState of ["stale", "blocked", "permission-denied", "settlement-pending"]) {
      const projection = createTenantGovernanceProjection({ scenarioState });

      expect(
        projection.actionRail.find((action) => action.actionType === "compile_candidate")?.allowed,
      ).toBe(false);
      expect(
        projection.actionRail.find((action) => action.actionType === "promote_bundle")?.allowed,
      ).toBe(false);
    }
  });

  it("exposes mandatory automation anchors", () => {
    const fixture = createTenantGovernanceFixture();

    expect(fixture.automationAnchors).toEqual(tenantGovernanceAutomationAnchors);
  });
});
