import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
  createPhase9ResilienceActionSettlementFixture,
  phase9ResilienceActionSettlementMatrixCsv,
  phase9ResilienceActionSettlementSummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "445_phase9_resilience_action_settlement_contract.json",
);
const fixturePath = path.join(fixturesDir, "445_phase9_resilience_action_settlement_fixtures.json");
const summaryPath = path.join(analysisDir, "445_phase9_resilience_action_settlement_summary.md");
const notesPath = path.join(analysisDir, "445_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "445_settlement_result_matrix.csv");
const artifactCatalogPath = path.join(analysisDir, "445_recovery_evidence_artifact_catalog.csv");

const fixture = createPhase9ResilienceActionSettlementFixture();

const contractArtifact = {
  schemaVersion: PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
  upstreamReadinessSchemaVersion: fixture.upstreamReadinessSchemaVersion,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  producedObjects: fixture.producedObjects,
  apiSurface: fixture.apiSurface,
  readinessInputs: fixture.readinessInputs,
  settlementAuthority: {
    restoreResult: fixture.restoreValidatedRun.resultState,
    restoreSettlementRef: fixture.restoreValidatedRun.resilienceActionSettlementRef,
    failoverStandDownResult: fixture.failoverStoodDownRun.resultState,
    chaosGuardrailResult: fixture.chaosGuardrailBlockedSettlement.result,
    duplicateIdempotencyStable:
      fixture.duplicateIdempotencySettlement.resilienceActionSettlementId ===
      fixture.duplicateIdempotencyReplaySettlement.resilienceActionSettlementId,
  },
  recoveryEvidenceWriteback: {
    ledgerEntryHash: fixture.recoveryEvidenceGraphWriteback.assuranceLedgerEntry.hash,
    ledgerEntryType: fixture.recoveryEvidenceGraphWriteback.assuranceLedgerEntry.entryType,
    replayDecisionClass:
      fixture.recoveryEvidenceGraphWriteback.assuranceLedgerEntry.replayDecisionClass,
    graphEdgeRefs: fixture.recoveryEvidenceGraphWriteback.graphEdgeRefs,
    writebackHash: fixture.recoveryEvidenceGraphWriteback.writebackHash,
  },
  deterministicReplay: {
    replayHash: fixture.replayHash,
    deterministicArtifactHash: fixture.deterministicArtifactHash,
    deterministicArtifactReplayHash: fixture.deterministicArtifactReplayHash,
  },
  noGapArtifactRequired: true,
};

const artifactCatalogRows = [
  [
    "recoveryEvidenceArtifactId",
    "artifactType",
    "artifactState",
    "summaryRef",
    "graphHash",
    "artifactHash",
  ],
  ...fixture.recoveryEvidenceArtifacts.map((artifact) => [
    artifact.recoveryEvidenceArtifactId,
    artifact.artifactType,
    artifact.artifactState,
    artifact.summaryRef,
    artifact.graphHash,
    artifact.artifactHash,
  ]),
];

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9ResilienceActionSettlementSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Restore, Failover, Chaos Action Settlement Alignment",
    "",
    "Task 445 consumes the task 444 readiness tuple and turns restore, failover, chaos, and recovery-pack attestation into settled command outcomes. Local run completion is retained as evidence only; live authority comes from ResilienceActionSettlement.",
    "",
    "Every command carries an idempotency key, role, purpose, reason, expected posture hash, expected readiness hash, expected tuple hash, and tenant-bound scope token. Publication, trust, freeze, readiness, guardrail, and tuple drift all fail closed before controls can be treated as live.",
    "",
    "Recovery evidence is summary-first and graph-pinned. The generated artifacts use governed presentation, transfer, fallback, masking, outbound-navigation policy, and return-intent references; raw object-store refs are rejected.",
    "",
  ].join("\n"),
);
fs.writeFileSync(matrixPath, phase9ResilienceActionSettlementMatrixCsv(fixture));
fs.writeFileSync(
  artifactCatalogPath,
  `${artifactCatalogRows.map((row) => row.join(",")).join("\n")}\n`,
);

console.log(`Phase 9 resilience action settlement contract: ${path.relative(root, contractPath)}`);
console.log(`Replay hash: ${fixture.replayHash}`);
