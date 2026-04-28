import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
  createPhase9AssuranceIngestFixture,
  validateLedgerPreviousHashContinuity,
  type AssuranceIngestFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-assurance-ingest-service.ts",
  "data/contracts/435_phase9_assurance_ingest_service_contract.json",
  "data/fixtures/435_phase9_assurance_ingest_service_fixtures.json",
  "data/analysis/435_phase9_assurance_ingest_service_summary.md",
  "data/analysis/435_algorithm_alignment_notes.md",
  "data/analysis/435_assurance_ingest_api_matrix.csv",
  "tools/test/run_phase9_assurance_ingest_service.ts",
  "tools/analysis/validate_435_phase9_assurance_ingest_service.ts",
  "tests/unit/435_assurance_ingest_service.spec.ts",
  "tests/integration/435_assurance_ingest_artifacts.spec.ts",
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
  packageJson.scripts?.["test:phase9:assurance-ingest"] ===
    "pnpm exec tsx ./tools/test/run_phase9_assurance_ingest_service.ts && pnpm exec vitest run tests/unit/435_assurance_ingest_service.spec.ts tests/integration/435_assurance_ingest_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:assurance-ingest",
);
assert(
  packageJson.scripts?.["validate:435-phase9-assurance-ingest"] ===
    "pnpm exec tsx ./tools/analysis/validate_435_phase9_assurance_ingest_service.ts",
  "PACKAGE_SCRIPT_MISSING:validate:435-phase9-assurance-ingest",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_435_/m.test(checklist), "CHECKLIST_TASK_435_NOT_CLAIMED_OR_COMPLETE");

assert(
  readJson<{ verdict?: string; phase?: number }>("data/contracts/431_phase8_exit_packet.json").verdict ===
    "approved_for_phase9",
  "PHASE8_EXIT_PACKET_NOT_APPROVED",
);
assert(
  readJson<{ schemaVersion?: string }>("data/contracts/432_phase9_assurance_ledger_contracts.json").schemaVersion ===
    "432.phase9.assurance-ledger-contracts.v1",
  "PHASE9_ASSURANCE_CONTRACTS_MISSING_OR_DRIFTED",
);
assert(
  readJson<{ schemaVersion?: string }>("data/contracts/434_phase9_governance_control_contracts.json").schemaVersion ===
    "434.phase9.governance-control-contracts.v1",
  "PHASE9_GOVERNANCE_CONTRACTS_MISSING_OR_DRIFTED",
);

const contractArtifact = readJson<{
  schemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  requiredCapabilities?: readonly string[];
  quarantineReasons?: readonly string[];
  graphHash?: string;
  rebuildHash?: string;
}>("data/contracts/435_phase9_assurance_ingest_service_contract.json");
assert(contractArtifact.schemaVersion === PHASE9_ASSURANCE_INGEST_SERVICE_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
for (const sourceRef of ["#9A", "#9C", "#9D", "#9E", "432_phase9_assurance"]) {
  assert(
    contractArtifact.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const capability of [
  "ingest one producer event",
  "query checkpoint",
  "query quarantine records",
  "rebuild ledger and graph from accepted raw events",
  "materialize and seal graph snapshot",
  "fetch latest snapshot reference for a tenant scope",
]) {
  assert(contractArtifact.requiredCapabilities?.includes(capability), `CAPABILITY_MISSING:${capability}`);
}
for (const reason of [
  "UNSUPPORTED_SCHEMA",
  "SEQUENCE_GAP",
  "DUPLICATE_DIFFERENT_HASH",
  "PREVIOUS_HASH_DISCONTINUITY",
  "INVALID_BOUNDED_CONTEXT_OWNER",
  "CROSS_TENANT_REFERENCE",
  "GRAPH_EDGE_SOURCE_REF_MISSING",
]) {
  assert(contractArtifact.quarantineReasons?.includes(reason), `QUARANTINE_REASON_MISSING:${reason}`);
}

const fixture = readJson<AssuranceIngestFixture>("data/fixtures/435_phase9_assurance_ingest_service_fixtures.json");
const recomputed = createPhase9AssuranceIngestFixture();
assert(fixture.schemaVersion === PHASE9_ASSURANCE_INGEST_SERVICE_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(fixture.acceptedReceipt.decision === "accepted", "FIXTURE_ACCEPTED_RECEIPT_NOT_ACCEPTED");
assert(fixture.duplicateReceipt.decision === "idempotent_replay", "FIXTURE_DUPLICATE_NOT_IDEMPOTENT");
assert(fixture.snapshot.graphHash === recomputed.snapshot.graphHash, "FIXTURE_GRAPH_HASH_DRIFT");
assert(fixture.rebuildHash === recomputed.rebuildHash, "FIXTURE_REBUILD_HASH_DRIFT");
assert(fixture.healthMetrics.acceptedCount === 1, "FIXTURE_ACCEPTED_COUNT_DRIFT");
assert(fixture.healthMetrics.rebuildState === "exact", "FIXTURE_REBUILD_NOT_EXACT");
assert(
  validateLedgerPreviousHashContinuity([fixture.acceptedReceipt.ledgerEntry!]).valid,
  "FIXTURE_LEDGER_CONTINUITY_FAILED",
);

const gapPath = "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_435_ASSURANCE_INGEST_PRODUCER.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_ASSURANCE_INGEST_PRODUCER_GAP");

const sourceText = readText("packages/domains/analytics_assurance/src/phase9-assurance-ingest-service.ts");
for (const token of [
  "Phase9AssuranceIngestService",
  "canonicalProducerEventHash",
  "AssuranceIngestCheckpoint",
  "AssuranceLedgerEntry",
  "EvidenceArtifact",
  "AssuranceEvidenceGraphSnapshot",
  "rebuildFromAcceptedRawEvents",
  "assertEvidenceArtifactImmutable",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/435_assurance_ingest_service.spec.ts")}\n${readText(
  "tests/integration/435_assurance_ingest_artifacts.spec.ts",
)}`;
for (const token of [
  "valid event accepted",
  "duplicate same hash",
  "duplicate different hash",
  "out-of-order sequence",
  "unsupported schema",
  "missing bounded-context owner",
  "cross-tenant reference",
  "previous-hash continuity",
  "canonical hash determinism",
  "evidence artifact immutability",
  "graph snapshot deterministic ordering",
  "rebuild from raw accepted inputs",
  "concurrent ingest",
  "authorization denial",
  "no PHI in logs",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/435_phase9_assurance_ingest_service_summary.md");
for (const token of ["Service version", "Duplicate decision: idempotent_replay", "Graph hash", "Rebuild hash"]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}

const matrix = readText("data/analysis/435_assurance_ingest_api_matrix.csv");
assert(matrix.includes("ingestEvent"), "MATRIX_INGEST_EVENT_MISSING");
assert(matrix.includes("fetchGraphEdges"), "MATRIX_FETCH_GRAPH_EDGES_MISSING");

console.log("435 phase9 assurance ingest service validated.");
