import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
  createPhase9RetentionLifecycleEngineFixture,
  phase9RetentionLifecycleBlockingMatrixCsv,
  phase9RetentionLifecycleEngineSummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "442_phase9_retention_lifecycle_engine_contract.json");
const fixturePath = path.join(fixturesDir, "442_phase9_retention_lifecycle_engine_fixtures.json");
const summaryPath = path.join(analysisDir, "442_phase9_retention_lifecycle_engine_summary.md");
const notesPath = path.join(analysisDir, "442_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "442_retention_lifecycle_blocking_matrix.csv");

const fixture = createPhase9RetentionLifecycleEngineFixture();

const contractArtifact = {
  schemaVersion: PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  producedObjects: fixture.producedObjects,
  apiSurface: [
    "createRetentionClass",
    "supersedeRetentionClass",
    "bindLifecycleForArtifact",
    "getLifecycleBinding",
    "deriveRetentionDecision",
    "placeLegalHold",
    "releaseLegalHold",
    "createDependencyLink",
    "deriveDependencyLinksFromGraph",
    "runDispositionEligibilityAssessment",
    "listBlockers",
    "explainWhyArtifactCannotBeDisposed",
    "emitLifecycleEvidenceForAssuranceGraph",
  ],
  dispositionResults: {
    artifactCreation: fixture.artifactCreationResult.result,
    missingRetentionClass: fixture.missingRetentionClassResult.result,
    notDue: fixture.notDueAssessment.result,
    legalHold: fixture.legalHoldBlockedAssessment.result,
    releasedHold: fixture.reassessmentAfterRelease.result,
    transitiveDependency: fixture.transitiveDependencyAssessment.result,
    dependencyCycle: fixture.dependencyCycleAssessment.result,
    wormHashChained: fixture.wormHashChainedAssessment.result,
    replayCritical: fixture.replayCriticalAssessment.result,
    assurancePackDependency: fixture.assurancePackDependencyAssessment.result,
    missingGraphVerdict: fixture.missingGraphVerdictAssessment.result,
    rawStorageScan: fixture.rawStorageScanAssessment.result,
  },
  requiredBlockers: {
    legalHold: fixture.legalHoldBlockedAssessment.blockerRefs,
    transitiveDependency: fixture.transitiveDependencyAssessment.blockerRefs,
    dependencyCycle: fixture.dependencyCycleAssessment.blockerRefs,
    wormHashChained: fixture.wormHashChainedAssessment.blockerRefs,
    replayCritical: fixture.replayCriticalAssessment.blockerRefs,
    assurancePackDependency: fixture.assurancePackDependencyAssessment.blockerRefs,
    missingGraphVerdict: fixture.missingGraphVerdictAssessment.blockerRefs,
    rawStorageScan: fixture.rawStorageScanAssessment.blockerRefs,
  },
  deterministicReplay: {
    replayHash: fixture.replayHash,
    baselineDecisionHash: fixture.baselineDecision.decisionHash,
    deterministicDecisionReplayHash: fixture.deterministicDecisionReplay.decisionHash,
  },
  auditCoverage: {
    bindLifecycle: fixture.artifactCreationResult.auditRecords.length,
    placeLegalHold: fixture.legalHoldResult.auditRecords.length,
    releaseLegalHold: fixture.releasedLegalHoldResult.auditRecords.length,
    assessDisposition: fixture.reassessmentAfterRelease.auditRecords.length,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9RetentionLifecycleEngineSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Retention Lifecycle Engine Algorithm Alignment",
    "",
    "The engine follows Phase 9 section 9E: lifecycle binding is minted at artifact creation time, retention decisions are hash-addressed, and disposition eligibility assessments are the only archive/delete authority. It does not infer lifecycle policy from paths, blob names, raw storage scans, or operator CSVs.",
    "",
    "Legal holds and freezes converge into one preservation-first scope. Active holds, freeze refs, transitive dependencies, WORM/hash-chain criticality, replay-critical dependencies, assurance pack dependencies, CAPA links, tenant mismatches, and missing graph verdicts all fail closed.",
    "",
    "The generated lifecycle evidence record is suitable for assurance graph ingestion and for task 443 archive/delete executors to consume without recomputing retention law.",
    "",
  ].join("\n"),
);
fs.writeFileSync(matrixPath, phase9RetentionLifecycleBlockingMatrixCsv(fixture));

console.log(`Phase 9 retention lifecycle engine contract: ${path.relative(root, contractPath)}`);
console.log(`Replay hash: ${fixture.replayHash}`);
