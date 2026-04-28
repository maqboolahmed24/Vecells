import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

describe("task 460 conformance scorecard artifacts", () => {
  it("publishes route contract and fixtures", () => {
    const contract = readJson<any>(
      "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
    );
    const fixture = readJson<any>("data/fixtures/460_conformance_scorecard_fixtures.json");

    expect(contract.schemaVersion).toBe("460.phase9.service-owner-conformance-scorecard.v1");
    expect(contract.routeIntegration.path).toBe("/ops/conformance");
    expect(contract.routeIntegration.serviceOwnerSurface).toBe(true);
    expect(contract.routeIntegration.noExecutiveRag).toBe(true);
    expect(contract.projectionCoverage.typedProjectionNames).toEqual(
      expect.arrayContaining([
        "CrossPhaseConformanceScorecardProjection",
        "PhaseConformanceRowProjection",
        "ConformanceBlockerQueueProjection",
        "BAUSignoffReadinessProjection",
        "ConformanceSourceTraceProjection",
        "ConformanceRowDiffProjection",
      ]),
    );
    expect(fixture.scenarioProjections.exact.visualMode).toBe("Service_Owner_Conformance_Ledger");
  });

  it("documents the interface gap and external references", () => {
    const gap = readJson<any>(
      "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_460_CONFORMANCE_PROJECTION.json",
    );
    const externalRefs = readJson<any>("data/analysis/460_external_reference_notes.json");

    expect(gap.status).toBe("bounded_adapter_created");
    expect(gap.adapter.readPolicy).toBe("canonical_phase_conformance_rows_and_scorecards_only");
    expect(externalRefs.references.map((ref: any) => ref.label)).toEqual(
      expect.arrayContaining([
        "Government Analysis Function dashboard guidance",
        "GOV.UK Design System table component",
        "NHS service manual accessibility content",
        "Playwright ARIA snapshots",
      ]),
    );
  });

  it("captures fail-closed BAU gating and artifact safety", () => {
    const contract = readJson<any>(
      "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
    );

    expect(contract.bauGating.exactReady).toBe(true);
    expect(contract.bauGating.staleDiagnosticOnly).toBe(true);
    expect(contract.bauGating.summaryDriftBlocked).toBe(true);
    expect(contract.bauGating.missingVerificationBlocked).toBe(true);
    expect(contract.bauGating.staleRuntimeBlocked).toBe(true);
    expect(contract.bauGating.missingOpsProofBlocked).toBe(true);
    expect(contract.bauGating.permissionDeniedUnavailable).toBe(true);
    expect(contract.artifactSafety.noRawArtifactUrls).toBe(true);
    expect(contract.artifactSafety.serializedProjectionHasNoHttpUrls).toBe(true);
  });
});
