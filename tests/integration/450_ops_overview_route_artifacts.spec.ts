import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPS_OVERVIEW_SCHEMA_VERSION,
  createOpsOverviewFixture,
} from "../../apps/ops-console/src/operations-overview-phase9.model";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("450 operations overview artifacts", () => {
  it("publishes deterministic route contract and fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      route: string;
      requiredSurfaces: string[];
      automationAnchors: string[];
      scenarioStates: string[];
      failClosedStates: Record<string, string>;
      parityProof: { northStarMetricCount: number; serviceHealthCellCount: number };
      noGapArtifactRequired: boolean;
    }>("data/contracts/450_phase9_ops_overview_route_contract.json");
    const fixture = readJson<ReturnType<typeof createOpsOverviewFixture>>(
      "data/fixtures/450_phase9_ops_overview_route_fixtures.json",
    );
    const recomputed = createOpsOverviewFixture();

    expect(contract.schemaVersion).toBe(OPS_OVERVIEW_SCHEMA_VERSION);
    expect(contract.route).toBe("/ops/overview");
    expect(contract.requiredSurfaces).toEqual(
      expect.arrayContaining(["NorthStarBand", "ServiceHealthGrid", "OpsStableServiceDigest"]),
    );
    expect(contract.automationAnchors).toEqual(
      expect.arrayContaining(["ops-overview", "ops-health-cell", "ops-return-token-target"]),
    );
    expect(contract.scenarioStates).toEqual(
      expect.arrayContaining(["normal", "stable_service", "quarantined", "permission_denied"]),
    );
    expect(contract.failClosedStates.quarantined).toBe("quarantined");
    expect(contract.failClosedStates.freeze).toBe("release_freeze");
    expect(contract.parityProof.northStarMetricCount).toBe(6);
    expect(contract.parityProof.serviceHealthCellCount).toBe(6);
    expect(contract.noGapArtifactRequired).toBe(true);
    expect(fixture.scenarioProjections.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.normal.boardStateDigestRef,
    );
  });

  it("records visual hierarchy and fail-closed implementation notes", () => {
    const notes = readText("data/analysis/450_ops_overview_implementation_note.md");

    expect(notes).toContain("NorthStarBand as compact operational vitals");
    expect(notes).toContain("Stable-service posture renders one OpsStableServiceDigest");
    expect(notes).toContain("Stale, degraded, quarantined, blocked");
  });

  it("does not publish a task 450 shell-contract gap", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_450_OPS_SHELL_CONTRACTS.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
