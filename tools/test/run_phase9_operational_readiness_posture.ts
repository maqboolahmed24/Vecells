import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
  createPhase9OperationalReadinessPostureFixture,
  phase9OperationalReadinessPostureMatrixCsv,
  phase9OperationalReadinessPostureSummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "444_phase9_operational_readiness_posture_contract.json",
);
const fixturePath = path.join(
  fixturesDir,
  "444_phase9_operational_readiness_posture_fixtures.json",
);
const summaryPath = path.join(analysisDir, "444_phase9_operational_readiness_posture_summary.md");
const notesPath = path.join(analysisDir, "444_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "444_recovery_control_posture_matrix.csv");
const proofDebtPath = path.join(analysisDir, "444_recovery_proof_debt.csv");

const fixture = createPhase9OperationalReadinessPostureFixture();

const contractArtifact = {
  schemaVersion: PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
  upstreamDispositionSchemaVersion: fixture.upstreamDispositionSchemaVersion,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  producedObjects: fixture.producedObjects,
  apiSurface: fixture.apiSurface,
  readinessAuthority: {
    essentialFunctionCount: fixture.essentialFunctions.length,
    recoveryTierCount: fixture.recoveryTiers.length,
    readySnapshotState: fixture.readySnapshot.readinessState,
    staleRunbookSnapshotState: fixture.staleRunbookSnapshot.readinessState,
    tupleHash: fixture.readySnapshot.resilienceTupleHash,
  },
  postureDowngrades: {
    live: fixture.livePosture.postureState,
    stalePublication: fixture.stalePublicationPosture.postureState,
    degradedTrust: fixture.degradedTrustPosture.postureState,
    activeFreeze: fixture.activeFreezePosture.postureState,
    missingBackup: fixture.missingBackupPosture.postureState,
    missingRunbook: fixture.missingRunbookPosture.postureState,
    staleEvidencePack: fixture.staleEvidencePackPosture.postureState,
    missingJourneyProof: fixture.missingJourneyProofPosture.postureState,
    partialDependency: fixture.partialDependencyPosture.postureState,
  },
  deterministicReplay: {
    replayHash: fixture.replayHash,
    liveControlTupleHash: fixture.livePosture.controlTupleHash,
    deterministicReplayControlTupleHash: fixture.deterministicPostureReplay.controlTupleHash,
    tupleCompatibleRestoreDigest: fixture.tupleCompatibleRestoreDigest,
  },
  noGapArtifactRequired: true,
};

const proofDebtRows = [
  [
    "functionCode",
    "missingProofRefs",
    "staleRunbookRefs",
    "staleBackupManifestRefs",
    "nextRehearsalDueAt",
    "blockers",
  ],
  ...fixture.proofDebt.map((debt) => [
    debt.functionCode,
    debt.missingProofRefs.join("|"),
    debt.staleRunbookRefs.join("|"),
    debt.staleBackupManifestRefs.join("|"),
    debt.nextRehearsalDueAt,
    debt.blockerRefs.join("|"),
  ]),
];

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9OperationalReadinessPostureSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Operational Readiness And Recovery Control Posture Algorithm Alignment",
    "",
    "Task 444 materializes the resilience authority tuple before task 445 executes restore, failover, or chaos actions. It maps platform essential functions, recovery tiers, backup manifests, tuple-bound readiness snapshots, runbook bindings, synthetic coverage, evidence-pack freshness, and recovery-control posture.",
    "",
    "Readiness is derived from the current tuple only. Stale publication, degraded trust, active freeze, missing backup manifests, missing or withdrawn runbooks, stale recovery evidence packs, missing journey proof, and partial dependency coverage all downgrade posture before live controls can be shown.",
    "",
    "Recovery evidence artifact retention remains linked to task 443 archive manifest and certificate posture so readiness proof is treated as governed evidence rather than a loose dashboard link.",
    "",
  ].join("\n"),
);
fs.writeFileSync(matrixPath, phase9OperationalReadinessPostureMatrixCsv(fixture));
fs.writeFileSync(proofDebtPath, `${proofDebtRows.map((row) => row.join(",")).join("\n")}\n`);

console.log(`Phase 9 operational readiness posture contract: ${path.relative(root, contractPath)}`);
console.log(`Replay hash: ${fixture.replayHash}`);
