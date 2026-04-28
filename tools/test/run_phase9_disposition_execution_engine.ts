import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
  createPhase9DispositionExecutionFixture,
  phase9DispositionBlockingMatrixCsv,
  phase9DispositionExecutionEngineSummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "443_phase9_disposition_execution_engine_contract.json",
);
const fixturePath = path.join(fixturesDir, "443_phase9_disposition_execution_engine_fixtures.json");
const summaryPath = path.join(analysisDir, "443_phase9_disposition_execution_engine_summary.md");
const notesPath = path.join(analysisDir, "443_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "443_disposition_blocking_matrix.csv");

const fixture = createPhase9DispositionExecutionFixture();

const contractArtifact = {
  schemaVersion: PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
  upstreamSchemaVersion: fixture.upstreamSchemaVersion,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  producedObjects: fixture.producedObjects,
  apiSurface: fixture.apiSurface,
  admissionPosture: {
    archiveFromCurrentAssessment: fixture.archiveQueuedResult.job.resultState,
    deleteFromCurrentAssessment: fixture.deleteQueuedResult.job.resultState,
    rawStorageScan: fixture.rawScanBlockedResult.job.resultState,
    staleAssessment: fixture.staleAssessmentBlockedResult.job.resultState,
    staleGraph: fixture.staleGraphBlockedResult.job.resultState,
    staleHoldState: fixture.staleHoldStateBlockedResult.job.resultState,
    replayCriticalArchive: fixture.replayCriticalArchiveQueuedResult.job.resultState,
  },
  deterministicReplay: {
    replayHash: fixture.replayHash,
    manifestHash: fixture.archiveExecutionResult.manifest?.manifestHash,
    manifestReplayHash: fixture.archiveReplayExecutionResult.manifest?.manifestHash,
    certificateHash: fixture.deleteExecutionResult.deletionCertificates[0]?.certificateHash,
    certificateReplayHash:
      fixture.deleteReplayExecutionResult.deletionCertificates[0]?.certificateHash,
  },
  blockers: {
    rawStorageScan: fixture.rawScanBlockedResult.job.blockerRefs,
    wormHashChained: fixture.wormDeleteBlockedResult.job.blockerRefs,
    replayCriticalDelete: fixture.replayCriticalDeleteBlockedResult.job.blockerRefs,
    staleAssessment: fixture.staleAssessmentBlockedResult.job.blockerRefs,
    staleGraph: fixture.staleGraphBlockedResult.job.blockerRefs,
    staleHoldState: fixture.staleHoldStateBlockedResult.job.blockerRefs,
  },
  lifecycleWriteback: {
    archiveEvents: fixture.archiveExecutionResult.lifecycleEvents.length,
    deleteEvents: fixture.deleteExecutionResult.lifecycleEvents.length,
    firstLedgerHash: fixture.lifecycleWritebackResult.lifecycleEvents[0]?.assuranceLedgerEntry.hash,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9DispositionExecutionEngineSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Disposition Execution Engine Algorithm Alignment",
    "",
    "Task 443 consumes task 442 DispositionEligibilityAssessment records as the only archive/delete authority. It deliberately rejects raw storage scans, bucket-prefix candidates, object-store manifests, operator CSV imports, stale assessment refs, stale graph hashes, stale hold-state hashes, tenant crossing, and presentation-ineligible candidates.",
    "",
    "Archive execution writes summary-first ArchiveManifest artifacts with deterministic manifest hashes, checksum bundle evidence, and same-snapshot graph proof. Delete execution writes DeletionCertificate artifacts before completion, binds the certificates to immutable retention lifecycle metadata, and emits assurance-ledger lifecycle writeback events.",
    "",
    "Replay-critical artifacts remain archive-only while active dependencies exist. WORM, hash-chain, audit-ledger, assurance-ledger, archive manifest, deletion certificate, legal-hold, and freeze artifacts are excluded from deletion.",
    "",
  ].join("\n"),
);
fs.writeFileSync(matrixPath, phase9DispositionBlockingMatrixCsv(fixture));

console.log(`Phase 9 disposition execution engine contract: ${path.relative(root, contractPath)}`);
console.log(`Replay hash: ${fixture.replayHash}`);
