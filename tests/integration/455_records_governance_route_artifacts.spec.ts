import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const contractPath = path.join(
  root,
  "data",
  "contracts",
  "455_phase9_records_governance_route_contract.json",
);
const fixturePath = path.join(
  root,
  "data",
  "fixtures",
  "455_phase9_records_governance_route_fixtures.json",
);
const notePath = path.join(
  root,
  "data",
  "analysis",
  "455_records_governance_implementation_note.md",
);

describe("455 records governance generated artifacts", () => {
  it("writes route contract, fixtures, and implementation note", () => {
    expect(fs.existsSync(contractPath)).toBe(true);
    expect(fs.existsSync(fixturePath)).toBe(true);
    expect(fs.existsSync(notePath)).toBe(true);
  });

  it("captures lifecycle safety invariants in the contract", () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    expect(contract.schemaVersion).toBe("455.phase9.records-governance-route.v1");
    expect(contract.routes).toEqual([
      "/ops/governance/records",
      "/ops/governance/records/holds",
      "/ops/governance/records/disposition",
    ]);
    expect(contract.lifecycleSafety.lifecycleRowsRenderCurrentRefsTogether).toBe(true);
    expect(contract.lifecycleSafety.noRawBatchCandidates).toBe(true);
    expect(contract.lifecycleSafety.protectedRowsSuppressDelete).toBe(true);
    expect(contract.lifecycleSafety.holdReleaseRequiresSupersedingAssessment).toBe(true);
    expect(contract.noGapArtifactRequired).toBe(true);
  });

  it("preserves upstream 442 and 443 contract dependency", () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    expect(contract.upstreamSchemaVersions["442"]).toBe("442.phase9.retention-lifecycle-engine.v1");
    expect(contract.upstreamSchemaVersions["443"]).toBe(
      "443.phase9.disposition-execution-engine.v1",
    );
    expect(
      fs.existsSync(
        path.join(root, "data", "contracts", "442_phase9_retention_lifecycle_engine_contract.json"),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          root,
          "data",
          "contracts",
          "443_phase9_disposition_execution_engine_contract.json",
        ),
      ),
    ).toBe(true);
  });
});
