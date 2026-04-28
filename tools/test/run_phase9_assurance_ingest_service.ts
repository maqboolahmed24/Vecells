import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_ASSURANCE_INGEST_REBUILD_VERSION,
  PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
  createPhase9AssuranceIngestFixture,
  phase9AssuranceIngestServiceMatrixCsv,
  phase9AssuranceIngestServiceSummary,
} from "../../packages/domains/analytics_assurance/src/phase9-assurance-ingest-service.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "435_phase9_assurance_ingest_service_contract.json");
const fixturePath = path.join(fixturesDir, "435_phase9_assurance_ingest_service_fixtures.json");
const summaryPath = path.join(analysisDir, "435_phase9_assurance_ingest_service_summary.md");
const notesPath = path.join(analysisDir, "435_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "435_assurance_ingest_api_matrix.csv");

const fixture = createPhase9AssuranceIngestFixture();
const contractArtifact = {
  schemaVersion: PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
  rebuildVersion: PHASE9_ASSURANCE_INGEST_REBUILD_VERSION,
  sourceAlgorithmRefs: [
    "blueprint/phase-9-the-assurance-ledger.md#9A",
    "blueprint/phase-9-the-assurance-ledger.md#9C",
    "blueprint/phase-9-the-assurance-ledger.md#9D",
    "blueprint/phase-9-the-assurance-ledger.md#9E",
    "blueprint/phase-0-the-foundation-protocol.md#canonical-events",
    "data/contracts/431_phase8_exit_packet.json",
    "data/contracts/432_phase9_assurance_ledger_contracts.json",
    "data/contracts/434_phase9_governance_control_contracts.json",
  ],
  requiredCapabilities: [
    "ingest one producer event",
    "ingest batch",
    "query checkpoint",
    "query quarantine records",
    "rebuild ledger and graph from accepted raw events",
    "materialize and seal graph snapshot",
    "fetch snapshot by id",
    "fetch graph edges for artifact, control, or timeline scope",
    "fetch latest snapshot reference for a tenant scope",
  ],
  quarantineReasons: [
    "MISSING_PRODUCER_REGISTRATION",
    "UNSUPPORTED_SCHEMA",
    "SEQUENCE_GAP",
    "SEQUENCE_REGRESSION",
    "DUPLICATE_DIFFERENT_HASH",
    "PREVIOUS_HASH_DISCONTINUITY",
    "INVALID_BOUNDED_CONTEXT_OWNER",
    "CROSS_TENANT_REFERENCE",
    "MALFORMED_PAYLOAD",
    "NORMALIZATION_FAILURE",
    "GRAPH_EDGE_SOURCE_REF_MISSING",
    "AUTHORIZATION_DENIED",
  ],
  acceptedFixtureHash: fixture.acceptedReceipt.ledgerEntry?.hash,
  graphHash: fixture.snapshot.graphHash,
  graphWatermark: fixture.graphWatermark,
  rebuildHash: fixture.rebuildHash,
  healthMetrics: fixture.healthMetrics,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9AssuranceIngestServiceSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Assurance Ingest Algorithm Alignment",
    "",
    "The service accepts only registered producers whose namespace, schema, tenant, bounded-context, and normalization metadata match the frozen Phase 9 assurance contracts.",
    "",
    "Checkpointing is exactly-once across producer, namespace, schema, tenant, and source sequence. Same-hash duplicates return idempotent replay receipts; conflicting or out-of-order inputs quarantine without appending ledger rows.",
    "",
    "Accepted envelopes are normalized into AssuranceLedgerEntry records using deterministic canonical payload and input-set hashes. Previous-hash continuity is enforced before acceptance.",
    "",
    "Evidence-producing events materialize immutable EvidenceArtifact rows, stage typed AssuranceEvidenceGraphEdge inputs, and seal AssuranceEvidenceGraphSnapshot records with deterministic edge ordering and Merkle graph hashes.",
    "",
    "Read APIs enforce tenant, role, and purpose-of-use constraints. Logs contain only ids and hashes, never event payloads or PHI fields.",
    "",
  ].join("\n"),
);
fs.writeFileSync(matrixPath, phase9AssuranceIngestServiceMatrixCsv());

console.log(`Phase 9 assurance ingest service contract: ${path.relative(root, contractPath)}`);
console.log(`Graph hash: ${fixture.snapshot.graphHash}`);
console.log(`Rebuild hash: ${fixture.rebuildHash}`);
