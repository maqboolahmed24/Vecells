import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
  Phase9AssuranceIngestService,
  Phase9GraphVerdictEngine,
  createDefaultPhase9AssuranceProducerRegistration,
  createPhase9AssuranceProducerEnvelope,
  createPhase9GraphVerdictFixture,
  type Phase9GraphVerdictFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function buildGraph() {
  const ingest = new Phase9AssuranceIngestService([createDefaultPhase9AssuranceProducerRegistration()]);
  ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
  return {
    ingest,
    graph: ingest.materializeGraphSnapshot({
      tenantScopeRef: "tenant:demo-gp",
      generatedAt: "2026-04-27T09:05:00.000Z",
      controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
    }),
  };
}

describe("436 Phase 9 graph verdict artifacts", () => {
  it("publishes graph verdict contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      consumerContexts: string[];
      verdictDimensions: string[];
      blockedReasonCodes: string[];
    }>("data/contracts/436_phase9_graph_verdict_engine_contract.json");
    const fixture = readJson<Phase9GraphVerdictFixture>(
      "data/fixtures/436_phase9_graph_verdict_engine_fixtures.json",
    );
    const { graph } = buildGraph();
    const recomputed = createPhase9GraphVerdictFixture(graph.snapshot, graph.edges);

    expect(contract.schemaVersion).toBe(PHASE9_GRAPH_VERDICT_ENGINE_VERSION);
    expect(contract.consumerContexts).toContain("retention_disposition");
    expect(contract.verdictDimensions).toContain("orphan edge");
    expect(contract.blockedReasonCodes).toContain("RETENTION_DEPENDENCY_GAP");
    expect(fixture.completeVerdict.verdictHash).toBe(recomputed.completeVerdict.verdictHash);
    expect(fixture.blockedVerdict.verdictHash).toBe(recomputed.blockedVerdict.verdictHash);
  });

  it("stores frozen AssuranceGraphCompletenessVerdict records inside the richer verdicts", () => {
    const fixture = readJson<Phase9GraphVerdictFixture>(
      "data/fixtures/436_phase9_graph_verdict_engine_fixtures.json",
    );

    expect(fixture.completeVerdict.contractVerdict.verdictState).toBe("complete");
    expect(fixture.blockedVerdict.contractVerdict.verdictState).toBe("blocked");
    expect(fixture.blockedVerdict.contractVerdict.decisionHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.blockedVerdict.reasonCodes).toEqual(
      expect.arrayContaining(["ORPHAN_EDGE", "VISIBILITY_GAP", "LOW_TRUST", "RETENTION_DEPENDENCY_GAP"]),
    );
  });

  it("evaluates latest graph through the 435 snapshot provider API", () => {
    const { ingest, graph } = buildGraph();
    const engine = new Phase9GraphVerdictEngine();
    const context = {
      tenantId: "tenant:demo-gp",
      role: "assurance_reader",
      purposeOfUseRef: "assurance.operations",
    };

    const verdict = engine.evaluateLatestGraph(
      ingest,
      "tenant:demo-gp",
      {
        context: "generic_read",
        scopeRef: "tenant:demo-gp",
        generatedAt: "2026-04-27T09:10:00.000Z",
        requiredNodeRefs: [...graph.snapshot.ledgerEntryRefs, ...graph.snapshot.evidenceArtifactRefs],
      },
      context,
    );

    expect(verdict.state).toBe("complete");
    expect(engine.fetchVerdictById(verdict.verdictId, context)?.verdictHash).toBe(verdict.verdictHash);
  });

  it("writes operator-readable summary, algorithm notes, and context matrix", () => {
    const summary = readText("data/analysis/436_phase9_graph_verdict_engine_summary.md");
    const notes = readText("data/analysis/436_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/436_graph_verdict_context_matrix.csv");

    expect(summary).toContain("Blocked reason codes");
    expect(notes).toContain("bounded and cycle-safe");
    expect(notes).toContain("matching complete verdict");
    expect(matrix).toContain("operational_dashboard,stale");
    expect(matrix).toContain("archive_or_delete,blocked,strict");
  });

  it("records that no graph snapshot input gap artifact is needed", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_436_GRAPH_SNAPSHOT_INPUTS.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
