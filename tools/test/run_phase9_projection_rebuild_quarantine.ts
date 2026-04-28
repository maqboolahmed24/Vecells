import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  createPhase9ProjectionRebuildQuarantineFixture,
  phase9ProjectionRebuildQuarantineMatrixCsv,
  phase9ProjectionRebuildQuarantineSummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "446_phase9_projection_rebuild_quarantine_contract.json",
);
const fixturePath = path.join(
  fixturesDir,
  "446_phase9_projection_rebuild_quarantine_fixtures.json",
);
const summaryPath = path.join(analysisDir, "446_phase9_projection_rebuild_quarantine_summary.md");
const notesPath = path.join(analysisDir, "446_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "446_projection_rebuild_quarantine_matrix.csv");
const impactPath = path.join(analysisDir, "446_quarantine_impact_register.csv");

const fixture = createPhase9ProjectionRebuildQuarantineFixture();

const contractArtifact = {
  schemaVersion: PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  upstreamIngestSchemaVersion: fixture.upstreamIngestSchemaVersion,
  upstreamGraphVerdictSchemaVersion: fixture.upstreamGraphVerdictSchemaVersion,
  upstreamOperationalProjectionSchemaVersion: fixture.upstreamOperationalProjectionSchemaVersion,
  upstreamMetricSchemaVersion: fixture.upstreamMetricSchemaVersion,
  upstreamResilienceSchemaVersion: fixture.upstreamResilienceSchemaVersion,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  producedObjects: fixture.producedObjects,
  apiSurface: fixture.apiSurface,
  rebuildAuthority: {
    deterministicRunState: fixture.deterministicRebuildRun.runState,
    divergentRunState: fixture.divergentRebuildRun.runState,
    commandFollowingRunState: fixture.commandFollowingRun.runState,
    exactReplayFrozen: fixture.commandFollowingRun.runState === "blocked",
    matchingComparisonEqual: fixture.matchingComparison.equal,
    divergentComparisonEqual: fixture.divergentComparison.equal,
  },
  quarantineAuthority: {
    conflictingDuplicate: fixture.conflictingDuplicateDecision.quarantineRecord?.quarantineReason,
    outOfOrder: fixture.outOfOrderDecision.quarantineRecord?.quarantineReason,
    incompatibleSchema: fixture.incompatibleSchemaDecision.quarantineRecord?.quarantineReason,
    unknownNamespace: fixture.unknownNamespaceDecision.quarantineRecord?.quarantineReason,
    hardBlockedTrustState: fixture.hardBlockedSliceEvaluation.trustState,
    unaffectedTrustState: fixture.unaffectedSliceEvaluation.trustState,
    releasedQuarantineState: fixture.releasedQuarantineRecord.quarantineState,
  },
  ledgerWriteback: {
    quarantineLedgerHash: fixture.quarantineLedgerWriteback.assuranceLedgerEntry.hash,
    releaseLedgerHash: fixture.releaseLedgerWriteback.assuranceLedgerEntry.hash,
    quarantineReplayClass:
      fixture.quarantineLedgerWriteback.assuranceLedgerEntry.replayDecisionClass,
    releasePreviousHash: fixture.releaseLedgerWriteback.assuranceLedgerEntry.previousHash,
  },
  deterministicReplay: {
    replayHash: fixture.replayHash,
  },
  noGapArtifactRequired: true,
};

const impactRows = [
  [
    "scopeRef",
    "sliceRef",
    "trustRecordRef",
    "impactedSurfaces",
    "affectedControls",
    "affectedPacks",
    "affectedRetentionJobs",
    "affectedResiliencePostures",
    "operationsRenderMode",
    "blockers",
  ],
  [
    fixture.quarantineImpactExplanation.scopeRef,
    fixture.quarantineImpactExplanation.sliceRef,
    fixture.quarantineImpactExplanation.trustRecordRef,
    fixture.quarantineImpactExplanation.impactedSurfaces.join("|"),
    fixture.quarantineImpactExplanation.affectedControlRefs.join("|"),
    fixture.quarantineImpactExplanation.affectedPackRefs.join("|"),
    fixture.quarantineImpactExplanation.affectedRetentionJobRefs.join("|"),
    fixture.quarantineImpactExplanation.affectedResiliencePostureRefs.join("|"),
    fixture.quarantineImpactExplanation.operationsRenderMode,
    fixture.quarantineImpactExplanation.blockerRefs.join("|"),
  ],
];

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9ProjectionRebuildQuarantineSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Projection Rebuild And Slice Quarantine Algorithm Alignment",
    "",
    "Task 446 proves projection integrity as a control-plane concern. Rebuilds replay raw inputs in deterministic order, compare canonical rebuild hashes to stored snapshot hashes, and freeze command-following actionability on exact replay divergence.",
    "",
    "Producer and namespace quarantine is slice-bounded. Conflicting duplicates, out-of-order mandatory sequences, incompatible schemas, unknown mandatory namespaces, and hard trust blocks quarantine only dependent slices while preserving unaffected producers and slices.",
    "",
    "Slice trust uses the Phase 9 hysteresis thresholds: two consecutive lower-bound evaluations at or above 0.88 are required to enter trusted, trusted state leaves below 0.82, and hard blocks or lower bounds below 0.40 quarantine immediately.",
    "",
    "Quarantine and governed release both write trust-evaluation evidence to the assurance ledger so operations, packs, retention, and resilience surfaces can explain which producers and namespaces are blocking authority.",
    "",
  ].join("\n"),
);
fs.writeFileSync(matrixPath, phase9ProjectionRebuildQuarantineMatrixCsv(fixture));
fs.writeFileSync(impactPath, `${impactRows.map((row) => row.join(",")).join("\n")}\n`);

console.log(`Phase 9 projection rebuild quarantine contract: ${path.relative(root, contractPath)}`);
console.log(`Replay hash: ${fixture.replayHash}`);
