import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_ASSURANCE_CONTRACT_VERSION,
  createPhase9AssuranceContractFixture,
  phase9AssuranceAlgorithmAlignmentNotes,
  phase9AssuranceContractDefinitions,
  phase9AssuranceContractMatrixToCsv,
  summarizePhase9AssuranceContractFreeze,
  validateContractDefinitionCoverage,
} from "../../packages/domains/analytics_assurance/src/phase9-assurance-ledger-contracts.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "432_phase9_assurance_ledger_contracts.json");
const fixturePath = path.join(fixturesDir, "432_phase9_assurance_contract_fixtures.json");
const summaryPath = path.join(analysisDir, "432_phase9_assurance_contract_summary.md");
const notesPath = path.join(analysisDir, "432_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "432_phase9_assurance_contract_matrix.csv");

const coverage = validateContractDefinitionCoverage();
if (!coverage.valid) {
  throw new Error(`Phase 9 contract definition coverage failed: ${coverage.errors.join("; ")}`);
}

const fixture = createPhase9AssuranceContractFixture();
const contractArtifact = {
  schemaVersion: PHASE9_ASSURANCE_CONTRACT_VERSION,
  sourceAlgorithmRef: "blueprint/phase-9-the-assurance-ledger.md#9A",
  phase8ExitPacketRef: fixture.phase8ExitPacketRef,
  canonicalizationRule: fixture.canonicalizationRule,
  requiredInvariants: [
    "AssuranceLedgerEntry preserves producer provenance, namespace, schema version, normalization version, source sequence, bounded-context ownership, replay decision class, effect key, and previous-hash continuity.",
    "Canonical payload hashes are deterministic over JCS-equivalent canonical payloads.",
    "Complete AssuranceEvidenceGraphSnapshot records are immutable once sealed.",
    "AssuranceEvidenceGraphEdge rows carry relation semantics plus source ledger or evidence refs.",
    "AssuranceGraphCompletenessVerdict is required before pack export, support replay, retention disposition, deletion/archive, recovery proof, or authoritative dashboard display.",
    "Incomplete graph state fails closed.",
    "AssuranceSliceTrustRecord.trustLowerBound governs visible dashboards and operations shell posture.",
    "EvidenceArtifact preserves source capture, derivation, summary parity, redaction transform, retention class, and visibility scope.",
    "ControlStatusSnapshot accounts for freshness, validation basis, supersession, coverage, lineage, reproducibility, and graph verdict.",
    "Phase 9 consumers may not maintain parallel local evidence lists when a graph snapshot is available.",
  ],
  migrationCompatibilityGuardrails: [
    "Schema version pins are mandatory for ledger ingest and contract import.",
    "Normalization version refs are mandatory for accepted ledger entries.",
    "Standards/framework refs are carried on ControlObjective and AssuranceEvidenceGraphSnapshot.",
    "Graph snapshot version refs are frozen by contract artifact version.",
    "Trust evaluation model refs are mandatory on AssuranceSliceTrustRecord.",
    "Replay and determinism version refs are pinned by this artifact and must trigger rebuild on change.",
    "Unsupported schema versions quarantine before append.",
  ],
  downstreamReadiness: {
    "435": "ledger ingest and graph snapshot service imports ledger, artifact, snapshot, and hash helpers",
    "436": "graph completeness verdict engine imports edge, snapshot, and verdict gates",
    "437": "operational projection trust integration imports ProjectionHealthSnapshot and AssuranceSliceTrustRecord",
    "439": "timeline reconstruction consumes ledger continuity and graph edges",
    "440": "assurance pack generation requires graph snapshot plus completeness verdict",
    "441": "CAPA and attestation workflow consumes ControlStatusSnapshot and AttestationRecord",
    "442": "retention lifecycle binding consumes graph completeness and retention refs",
  },
  contractSetHash: fixture.contractSetHash,
  contracts: phase9AssuranceContractDefinitions,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, summarizePhase9AssuranceContractFreeze(fixture));
fs.writeFileSync(notesPath, phase9AssuranceAlgorithmAlignmentNotes());
fs.writeFileSync(matrixPath, phase9AssuranceContractMatrixToCsv());

console.log(`Phase 9 assurance contracts: ${path.relative(root, contractPath)}`);
console.log(`Contract count: ${phase9AssuranceContractDefinitions.length}`);
console.log(`Contract set hash: ${fixture.contractSetHash}`);
console.log(`Completeness verdict: ${fixture.graphCompletenessVerdict.verdictState}`);
