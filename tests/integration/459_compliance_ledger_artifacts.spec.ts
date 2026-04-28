import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

describe("task 459 compliance ledger artifacts", () => {
  it("publishes route contract and fixtures", () => {
    const contract = readJson<any>(
      "data/contracts/459_phase9_compliance_ledger_route_contract.json",
    );
    const fixture = readJson<any>("data/fixtures/459_compliance_ledger_fixtures.json");

    expect(contract.schemaVersion).toBe("459.phase9.compliance-ledger-and-gap-queue.v1");
    expect(contract.routeIntegration.path).toBe("/ops/assurance");
    expect(contract.routeIntegration.noAdjacentDashboard).toBe(true);
    expect(contract.projectionCoverage.typedProjectionNames).toEqual(
      expect.arrayContaining([
        "ComplianceLedgerProjection",
        "ControlEvidenceGapQueueProjection",
        "ControlEvidenceGraphMiniMapProjection",
        "ControlOwnerBurdenProjection",
        "GapQueueFilterSetProjection",
        "GapResolutionActionPreviewProjection",
      ]),
    );
    expect(fixture.scenarioProjections.exact.visualMode).toBe(
      "Compliance_Ledger_Calm_Accountability",
    );
  });

  it("documents the required interface gap and external references", () => {
    const gap = readJson<any>(
      "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_459_COMPLIANCE_LEDGER_PROJECTION.json",
    );
    const externalRefs = readJson<any>("data/analysis/459_external_reference_notes.json");

    expect(gap.status).toBe("bounded_adapter_created");
    expect(gap.adapter.readPolicy).toBe("canonical_assurance_objects_only");
    expect(externalRefs.references.map((ref: any) => ref.label)).toEqual(
      expect.arrayContaining([
        "NHS England DTAC guidance",
        "WCAG 2.2",
        "Playwright ARIA snapshots",
      ]),
    );
  });

  it("captures fail-closed graph and artifact safety in the contract", () => {
    const contract = readJson<any>(
      "data/contracts/459_phase9_compliance_ledger_route_contract.json",
    );

    expect(contract.graphDowngrades.staleDiagnosticOnly).toBe(true);
    expect(contract.graphDowngrades.blockedFailsClosed).toBe(true);
    expect(contract.graphDowngrades.permissionDeniedMetadataOnly).toBe(true);
    expect(contract.artifactSafety.noRawArtifactUrls).toBe(true);
    expect(contract.artifactSafety.serializedProjectionHasNoHttpUrls).toBe(true);
  });
});
