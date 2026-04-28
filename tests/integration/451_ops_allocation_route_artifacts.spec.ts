import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPS_ALLOCATION_SCHEMA_VERSION,
  createOpsAllocationFixture,
} from "../../apps/ops-console/src/operations-allocation-phase9.model";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("451 operations allocation artifacts", () => {
  it("publishes deterministic route contract and fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      routes: string[];
      requiredSurfaces: string[];
      automationAnchors: string[];
      actionEligibilityProof: Record<string, string | Record<string, string>>;
      parityProof: {
        bottleneckRows: number;
        capacityRows: number;
        cohortRows: number;
        lowSamplePromotionBlocked: boolean;
      };
      noGapArtifactRequired: boolean;
    }>("data/contracts/451_phase9_ops_allocation_route_contract.json");
    const fixture = readJson<ReturnType<typeof createOpsAllocationFixture>>(
      "data/fixtures/451_phase9_ops_allocation_route_fixtures.json",
    );
    const recomputed = createOpsAllocationFixture();

    expect(contract.schemaVersion).toBe(OPS_ALLOCATION_SCHEMA_VERSION);
    expect(contract.routes).toEqual(expect.arrayContaining(["/ops/queues", "/ops/capacity"]));
    expect(contract.requiredSurfaces).toEqual(
      expect.arrayContaining([
        "BottleneckRadar",
        "CapacityAllocator",
        "CohortImpactMatrix",
        "InterventionWorkbench",
      ]),
    );
    expect(contract.automationAnchors).toEqual(
      expect.arrayContaining([
        "bottleneck-radar",
        "capacity-allocator",
        "cohort-impact-matrix",
        "intervention-workbench",
        "action-eligibility-state",
        "scenario-compare",
        "ops-governance-handoff",
      ]),
    );
    expect(contract.actionEligibilityProof.normal).toBe("executable");
    expect(contract.actionEligibilityProof.stale).toBe("stale_reacquire");
    expect(contract.actionEligibilityProof.quarantined).toBe("read_only_recovery");
    expect(contract.parityProof.bottleneckRows).toBe(5);
    expect(contract.parityProof.capacityRows).toBe(3);
    expect(contract.parityProof.cohortRows).toBe(4);
    expect(contract.parityProof.lowSamplePromotionBlocked).toBe(true);
    expect(contract.noGapArtifactRequired).toBe(true);
    expect(fixture.scenarioProjections.queues.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.queues.normal.boardStateDigestRef,
    );
  });

  it("records allocation visual grammar and action safety notes", () => {
    const notes = readText("data/analysis/451_ops_allocation_implementation_note.md");

    expect(notes).toContain("ranked ladder");
    expect(notes).toContain("sample-gated");
    expect(notes).toContain("InterventionCandidateLease");
    expect(notes).toContain("OpsActionEligibilityFence");
  });

  it("does not publish a task 451 intervention eligibility gap", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_451_INTERVENTION_ELIGIBILITY.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
