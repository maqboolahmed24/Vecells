import { describe, expect, it } from "vitest";
import {
  createTenantGovernanceFixture,
  createTenantGovernanceProjection,
  tenantGovernanceAutomationAnchors,
} from "../../apps/governance-console/src/tenant-governance-phase9.model";

describe("457 tenant governance route contract", () => {
  it("publishes mandatory automation anchors and upstream schema version", () => {
    const fixture = createTenantGovernanceFixture();

    expect(fixture.upstreamSchemaVersions["448"]).toBe("448.phase9.tenant-config-governance.v1");
    expect(fixture.automationAnchors).toEqual(tenantGovernanceAutomationAnchors);
  });

  it("covers required scenario states without creating a watchlist interface gap", () => {
    const fixture = createTenantGovernanceFixture();

    expect(Object.keys(fixture.scenarioProjections).sort()).toEqual([
      "blocked",
      "degraded",
      "empty",
      "normal",
      "permission_denied",
      "settlement_pending",
      "stale",
    ]);
    expect(
      Object.values(fixture.scenarioProjections).every(
        (projection) => projection.noInterfaceGapRequired,
      ),
    ).toBe(true);
  });

  it("keeps selected cells attached to the config diff viewer", () => {
    const projection = createTenantGovernanceProjection({
      selectedDomainRef: "pharmacy_overrides",
      selectedTenantRef: "tenant:demo-gp",
    });

    expect(projection.selectedDomainRef).toBe("pharmacy_overrides");
    expect(projection.selectedDiffEntry.domainRef).toBe("pharmacy_overrides");
    expect(projection.selectedDiffEntry.affectedRouteFamilies).toContain("route-family:pharmacy");
  });

  it("separates legacy references, policy compatibility alerts, and standards exceptions", () => {
    const blocked = createTenantGovernanceProjection({ scenarioState: "blocked" });

    expect(
      blocked.legacyReferenceFindings.some((finding) => finding.findingRef.startsWith("lrf_448")),
    ).toBe(true);
    expect(
      blocked.policyCompatibilityAlerts.some((finding) => finding.findingRef.startsWith("pca_448")),
    ).toBe(true);
    expect(
      blocked.standardsExceptions.some((finding) => finding.findingRef.startsWith("ser_448")),
    ).toBe(true);
  });

  it("requires governed settlement before compile or promote controls become available", () => {
    const normal = createTenantGovernanceProjection({ scenarioState: "normal" });
    const compile = normal.actionRail.find((action) => action.actionType === "compile_candidate");
    const promote = normal.actionRail.find((action) => action.actionType === "promote_bundle");
    const exception = normal.actionRail.find((action) => action.actionType === "approve_exception");

    expect(compile?.allowed).toBe(false);
    expect(promote?.allowed).toBe(false);
    expect(exception?.allowed).toBe(true);
    expect(exception?.settlementRef).toContain("gas_457");
  });
});
