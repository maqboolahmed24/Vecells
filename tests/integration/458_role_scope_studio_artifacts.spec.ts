import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const contractPath = path.join(
  root,
  "data",
  "contracts",
  "458_phase9_role_scope_studio_route_contract.json",
);
const fixturePath = path.join(root, "data", "fixtures", "458_role_scope_studio_fixtures.json");
const gapPath = path.join(
  root,
  "data",
  "contracts",
  "PHASE9_BATCH_458_472_INTERFACE_GAP_458_ACCESS_PREVIEW_READ_MODEL.json",
);
const schemaPath = path.join(
  root,
  "data",
  "contracts",
  "458_governance_role_scope_studio_projection.schema.json",
);

describe("458 role scope studio generated artifacts", () => {
  it("writes contract, fixture, gap, and schema artifacts", () => {
    expect(fs.existsSync(contractPath)).toBe(true);
    expect(fs.existsSync(fixturePath)).toBe(true);
    expect(fs.existsSync(gapPath)).toBe(true);
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it("captures matrix, masking, freeze, and denied-action invariants", () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    expect(contract.schemaVersion).toBe("458.phase9.governance-role-scope-studio.v1");
    expect(contract.routes).toContain("/ops/access/role-scope-studio");
    expect(contract.matrixCoverage.columnCount).toBe(7);
    expect(contract.matrixCoverage.requiredStatesPresent).toBe(true);
    expect(contract.matrixCoverage.navigationIsNotAuthorization).toBe(true);
    expect(contract.accessPreviewSafety.hiddenFieldsNotRendered).toBe(true);
    expect(contract.accessPreviewSafety.telemetryRedacted).toBe(true);
    expect(contract.freezeCardCoverage.requiredKindsPresent).toBe(true);
    expect(contract.deniedActionSafety.allExplainSourcePredicateConsequenceAndNextAction).toBe(
      true,
    );
  });

  it("preserves upstream dependencies and scenario coverage", () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

    expect(contract.upstreamSchemaVersions["448"]).toBe("448.phase9.tenant-config-governance.v1");
    expect(contract.upstreamSchemaVersions["449"]).toBe("449.phase9.cross-phase-conformance.v1");
    expect(contract.upstreamSchemaVersions["457"]).toBe("457.phase9.tenant-governance-route.v1");
    expect(Object.keys(contract.scenarioCoverage).sort()).toEqual(
      Object.keys(fixture.scenarioProjections).sort(),
    );
  });
});
