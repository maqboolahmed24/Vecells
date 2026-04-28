import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
  Phase9AssuranceIngestService,
  createDefaultPhase9AssuranceProducerRegistration,
  createPhase9AssuranceProducerEnvelope,
  createPhase9GraphVerdictFixture,
  type Phase9GraphVerdictFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-assurance-graph-verdict-engine.ts",
  "data/contracts/436_phase9_graph_verdict_engine_contract.json",
  "data/fixtures/436_phase9_graph_verdict_engine_fixtures.json",
  "data/analysis/436_phase9_graph_verdict_engine_summary.md",
  "data/analysis/436_algorithm_alignment_notes.md",
  "data/analysis/436_graph_verdict_context_matrix.csv",
  "tools/test/run_phase9_graph_verdict_engine.ts",
  "tools/analysis/validate_436_phase9_graph_verdict_engine.ts",
  "tests/unit/436_graph_verdict_engine.spec.ts",
  "tests/integration/436_graph_verdict_artifacts.spec.ts",
];

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const relativePath of requiredFiles) {
  assert(fs.existsSync(path.join(root, relativePath)), `MISSING_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
assert(
  packageJson.scripts?.["test:phase9:graph-verdict"] ===
    "pnpm exec tsx ./tools/test/run_phase9_graph_verdict_engine.ts && pnpm exec vitest run tests/unit/436_graph_verdict_engine.spec.ts tests/integration/436_graph_verdict_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:graph-verdict",
);
assert(
  packageJson.scripts?.["validate:436-phase9-graph-verdict"] ===
    "pnpm exec tsx ./tools/analysis/validate_436_phase9_graph_verdict_engine.ts",
  "PACKAGE_SCRIPT_MISSING:validate:436-phase9-graph-verdict",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_436_/m.test(checklist), "CHECKLIST_TASK_436_NOT_CLAIMED_OR_COMPLETE");
assert(
  readJson<{ schemaVersion?: string }>("data/contracts/432_phase9_assurance_ledger_contracts.json").schemaVersion ===
    "432.phase9.assurance-ledger-contracts.v1",
  "PHASE9_ASSURANCE_CONTRACTS_MISSING_OR_DRIFTED",
);
assert(
  readJson<{ schemaVersion?: string }>("data/contracts/435_phase9_assurance_ingest_service_contract.json").schemaVersion ===
    "435.phase9.assurance-ingest-service.v1",
  "PHASE9_ASSURANCE_INGEST_CONTRACT_MISSING_OR_DRIFTED",
);

const contractArtifact = readJson<{
  schemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  consumerContexts?: readonly string[];
  verdictDimensions?: readonly string[];
  apiSurface?: readonly string[];
  blockedReasonCodes?: readonly string[];
}>("data/contracts/436_phase9_graph_verdict_engine_contract.json");
assert(contractArtifact.schemaVersion === PHASE9_GRAPH_VERDICT_ENGINE_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
for (const sourceRef of ["#9A", "#9C", "#9D", "#9E", "432_phase9_assurance", "435_phase9_assurance"]) {
  assert(
    contractArtifact.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const context of [
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
]) {
  assert(contractArtifact.consumerContexts?.includes(context), `CONSUMER_CONTEXT_MISSING:${context}`);
}
for (const dimension of ["orphan edge", "missing required edge", "stale evidence", "low trust", "retention dependency gap"]) {
  assert(contractArtifact.verdictDimensions?.includes(dimension), `VERDICT_DIMENSION_MISSING:${dimension}`);
}
for (const api of ["fetch verdict by id", "compare two verdicts", "run dry-run evaluation without mutating authoritative state"]) {
  assert(contractArtifact.apiSurface?.includes(api), `API_SURFACE_MISSING:${api}`);
}
for (const reason of ["ORPHAN_EDGE", "VISIBILITY_GAP", "LOW_TRUST", "REPLAY_MISMATCH", "RETENTION_DEPENDENCY_GAP"]) {
  assert(contractArtifact.blockedReasonCodes?.includes(reason), `BLOCKED_REASON_MISSING:${reason}`);
}

const fixture = readJson<Phase9GraphVerdictFixture>("data/fixtures/436_phase9_graph_verdict_engine_fixtures.json");
const ingest = new Phase9AssuranceIngestService([createDefaultPhase9AssuranceProducerRegistration()]);
ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
const graph = ingest.materializeGraphSnapshot({
  tenantScopeRef: "tenant:demo-gp",
  generatedAt: "2026-04-27T09:05:00.000Z",
  controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
});
const recomputed = createPhase9GraphVerdictFixture(graph.snapshot, graph.edges);
assert(fixture.schemaVersion === PHASE9_GRAPH_VERDICT_ENGINE_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(fixture.completeVerdict.verdictHash === recomputed.completeVerdict.verdictHash, "FIXTURE_COMPLETE_HASH_DRIFT");
assert(fixture.blockedVerdict.verdictHash === recomputed.blockedVerdict.verdictHash, "FIXTURE_BLOCKED_HASH_DRIFT");
assert(fixture.completeVerdict.state === "complete", "FIXTURE_COMPLETE_VERDICT_NOT_COMPLETE");
assert(fixture.blockedVerdict.state === "blocked", "FIXTURE_BLOCKED_VERDICT_NOT_BLOCKED");
assert(fixture.staleDashboardVerdict.state === "stale", "FIXTURE_DASHBOARD_STALE_DRIFT");
assert(fixture.strictStaleVerdict.state === "blocked", "FIXTURE_STRICT_STALE_DRIFT");

const gapPath = "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_436_GRAPH_SNAPSHOT_INPUTS.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_GRAPH_SNAPSHOT_INPUT_GAP");

const sourceText = readText("packages/domains/analytics_assurance/src/phase9-assurance-graph-verdict-engine.ts");
for (const token of [
  "Phase9GraphVerdictEngine",
  "evaluatePhase9GraphVerdict",
  "traverseAssuranceGraph",
  "assertConsumerHasCompleteVerdict",
  "evaluateLatestGraph",
  "compareVerdicts",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/436_graph_verdict_engine.spec.ts")}\n${readText(
  "tests/integration/436_graph_verdict_artifacts.spec.ts",
)}`;
for (const token of [
  "complete graph returns complete",
  "orphan artifact edge",
  "missing required control edge",
  "stale evidence",
  "tenant-crossing edge",
  "visibility gap",
  "low trust lower-bound",
  "superseded evidence",
  "cycle traversal",
  "identical verdict hash",
  "different context profiles",
  "cache invalidates",
  "downstream consumer cannot bypass",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/436_phase9_graph_verdict_engine_summary.md");
for (const token of ["Schema version", "Blocked reason codes", "Support replay stale state"]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}
const matrix = readText("data/analysis/436_graph_verdict_context_matrix.csv");
assert(matrix.includes("assurance_pack,blocked,strict"), "MATRIX_ASSURANCE_PACK_MISSING");
assert(matrix.includes("operational_dashboard,stale"), "MATRIX_OPERATIONAL_DASHBOARD_MISSING");

console.log("436 phase9 graph verdict engine validated.");
