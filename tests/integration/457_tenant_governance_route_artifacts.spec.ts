import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const contractPath = path.join(
  root,
  "data",
  "contracts",
  "457_phase9_tenant_governance_route_contract.json",
);
const fixturePath = path.join(
  root,
  "data",
  "fixtures",
  "457_phase9_tenant_governance_route_fixtures.json",
);
const notePath = path.join(
  root,
  "data",
  "analysis",
  "457_tenant_governance_implementation_note.md",
);

describe("457 tenant governance generated artifacts", () => {
  it("writes route contract, fixtures, and implementation note", () => {
    expect(fs.existsSync(contractPath)).toBe(true);
    expect(fs.existsSync(fixturePath)).toBe(true);
    expect(fs.existsSync(notePath)).toBe(true);
  });

  it("captures matrix, watchlist, and promotion invariants in the contract", () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    expect(contract.schemaVersion).toBe("457.phase9.tenant-governance-route.v1");
    expect(contract.routes).toContain("/ops/governance/tenants");
    expect(contract.routes).toContain("/ops/config/tenants");
    expect(contract.matrixCoverage.domainCount).toBe(10);
    expect(contract.matrixCoverage.selectedTenantPreservedUnderFilters).toBe(true);
    expect(contract.watchlistAuthority.noInterfaceGapRequired).toBe(true);
    expect(contract.watchlistAuthority.usesTask448Contract).toBe(true);
    expect(contract.promotionSafety.compileAndPromoteFrozenUntilAllTuplesSettle).toBe(true);
  });

  it("preserves upstream 448 tenant-config governance dependency", () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    expect(contract.upstreamSchemaVersions["448"]).toBe("448.phase9.tenant-config-governance.v1");
    expect(
      fs.existsSync(
        path.join(root, "data", "contracts", "448_phase9_tenant_config_governance_contract.json"),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          root,
          "data",
          "contracts",
          "PHASE9_BATCH_443_457_INTERFACE_GAP_457_TENANT_WATCHLIST_INPUTS.json",
        ),
      ),
    ).toBe(false);
  });
});
