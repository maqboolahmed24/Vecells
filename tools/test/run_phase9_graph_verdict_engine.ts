import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
  Phase9AssuranceIngestService,
  createDefaultPhase9AssuranceProducerRegistration,
  createPhase9AssuranceProducerEnvelope,
  createPhase9GraphVerdictFixture,
  phase9GraphVerdictMatrixCsv,
  phase9GraphVerdictSummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "436_phase9_graph_verdict_engine_contract.json");
const fixturePath = path.join(fixturesDir, "436_phase9_graph_verdict_engine_fixtures.json");
const summaryPath = path.join(analysisDir, "436_phase9_graph_verdict_engine_summary.md");
const notesPath = path.join(analysisDir, "436_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "436_graph_verdict_context_matrix.csv");

const ingest = new Phase9AssuranceIngestService([createDefaultPhase9AssuranceProducerRegistration()]);
ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
const graph = ingest.materializeGraphSnapshot({
  tenantScopeRef: "tenant:demo-gp",
  generatedAt: "2026-04-27T09:05:00.000Z",
  controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
});
const fixture = createPhase9GraphVerdictFixture(graph.snapshot, graph.edges);
const contractArtifact = {
  schemaVersion: PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
  sourceAlgorithmRefs: [
    "blueprint/phase-9-the-assurance-ledger.md#9A",
    "blueprint/phase-9-the-assurance-ledger.md#9C",
    "blueprint/phase-9-the-assurance-ledger.md#9D",
    "blueprint/phase-9-the-assurance-ledger.md#9E",
    "data/contracts/432_phase9_assurance_ledger_contracts.json",
    "data/contracts/435_phase9_assurance_ingest_service_contract.json",
  ],
  consumerContexts: [
    "assurance_pack",
    "audit_timeline",
    "support_replay",
    "retention_disposition",
    "archive_or_delete",
    "operational_dashboard",
    "incident_follow_up",
    "recovery_proof",
    "tenant_governance",
    "generic_read",
  ],
  verdictDimensions: [
    "orphan edge",
    "missing required edge",
    "stale evidence",
    "superseded evidence",
    "schema mismatch",
    "graph watermark mismatch",
    "tenant boundary violation",
    "visibility gap",
    "contradiction",
    "low trust",
    "replay mismatch",
    "retention dependency gap",
    "unsealed snapshot",
  ],
  apiSurface: [
    "evaluate one graph snapshot/context/scope",
    "evaluate latest graph for a consumer context",
    "fetch verdict by id",
    "list blockers for a graph/scope",
    "explain why a consumer path is blocked",
    "compare two verdicts",
    "run dry-run evaluation without mutating authoritative state",
  ],
  completeVerdictHash: fixture.completeVerdict.verdictHash,
  blockedVerdictHash: fixture.blockedVerdict.verdictHash,
  blockedReasonCodes: fixture.blockedVerdict.reasonCodes,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9GraphVerdictSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Graph Verdict Algorithm Alignment",
    "",
    "The verdict engine consumes AssuranceEvidenceGraphSnapshot and AssuranceEvidenceGraphEdge rows from the 435 snapshot service and emits a frozen AssuranceGraphCompletenessVerdict plus a richer structured blocker record.",
    "",
    "Evaluation is deterministic: edges are ordered by hash, traversals are bounded and cycle-safe, reason codes are sorted, and verdict hashes include graph hash, consumer context, scope, evaluator version, and policy hash.",
    "",
    "Consumer contexts fail closed by default. Audit, replay, pack, retention, archive/delete, incident follow-up, and recovery-proof contexts treat stale evidence as blocking; operational dashboard and generic read contexts degrade to stale diagnostic posture.",
    "",
    "Downstream consumers must present a matching complete verdict before using graph state as authority.",
    "",
  ].join("\n"),
);
fs.writeFileSync(matrixPath, phase9GraphVerdictMatrixCsv());

console.log(`Phase 9 graph verdict contract: ${path.relative(root, contractPath)}`);
console.log(`Complete verdict: ${fixture.completeVerdict.verdictHash}`);
console.log(`Blocked verdict: ${fixture.blockedVerdict.verdictHash}`);
