import fs from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import {
  PHASE9_CROSS_PHASE_CONFORMANCE_VERSION,
  createPhase9CrossPhaseConformanceFixture,
  phase9BAUSignoffBlockersCsv,
  phase9ConformanceRowsCsv,
  phase9CrossPhaseConformanceSummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "449_phase9_cross_phase_conformance_contract.json");
const fixturePath = path.join(fixturesDir, "449_phase9_cross_phase_conformance_fixtures.json");
const summaryPath = path.join(analysisDir, "449_phase9_cross_phase_conformance_summary.md");
const notesPath = path.join(analysisDir, "449_algorithm_alignment_notes.md");
const rowsCsvPath = path.join(analysisDir, "449_phase_conformance_rows.csv");
const blockersCsvPath = path.join(analysisDir, "449_bau_signoff_blockers.csv");

const fixture = createPhase9CrossPhaseConformanceFixture();

async function formatJson(value: unknown, filePath: string): Promise<string> {
  const config = (await resolveConfig(filePath)) ?? {};
  return format(JSON.stringify(value, null, 2), { ...config, filepath: filePath });
}

const contractArtifact = {
  schemaVersion: PHASE9_CROSS_PHASE_CONFORMANCE_VERSION,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  producedObjects: fixture.producedObjects,
  apiSurface: fixture.apiSurface,
  conformanceAuthority: {
    exactPhaseRowRefs: fixture.exactPhaseRows.map((row) => row.phaseConformanceRowId),
    exactScorecardRef: fixture.exactScorecard.crossPhaseConformanceScorecardId,
    exactScorecardHash: fixture.exactScorecard.scorecardHash,
    exactScorecardState: fixture.exactScorecard.scorecardState,
    staleScorecardState: fixture.staleScorecardAfterProofDrift.scorecardState,
    blockedScorecardState: fixture.blockedScorecard.scorecardState,
    summaryContradictionState: fixture.summaryContradictionRow.summaryAlignmentState,
    missingRuntimePublicationState: fixture.missingRuntimePublicationRow.verificationCoverageState,
    missingVerificationScenarioState:
      fixture.missingVerificationScenarioRow.verificationCoverageState,
    staleControlSliceState: fixture.staleControlSliceTrustRow.operationalProofState,
    staleContinuityState: fixture.staleContinuityEvidenceRow.operationalProofState,
    missingGovernanceOpsState: fixture.missingGovernanceOpsProofRow.operationalProofState,
  },
  bauAuthority: {
    signedOffPackRef: fixture.signedOffBauReadinessPack.bauReadinessPackId,
    signedOffState: fixture.signedOffBauReadinessPack.signoffState,
    blockedPackRef: fixture.blockedBauReadinessPack.bauReadinessPackId,
    blockedPackState: fixture.blockedBauReadinessPack.signoffState,
    blockedPackBlockers: fixture.blockedBauReadinessPack.blockerRefs,
    releaseToBAURecordRef: fixture.releaseToBAURecord.releaseToBAURecordId,
    blockedReleaseAttemptState: fixture.blockedReleaseToBAUAttempt.state,
    blockedReleaseAttemptBlockers: fixture.blockedReleaseToBAUAttempt.blockerRefs,
  },
  runbookAndOnCallAuthority: {
    validOnCallState: fixture.validOnCallMatrix.contactValidationState,
    blockedOnCallState: fixture.blockedOnCallMatrix.contactValidationState,
    blockedOnCallBlockers: fixture.blockedOnCallMatrix.blockerRefs,
    currentRunbookState: fixture.currentRunbookBundle.rehearsalFreshnessState,
    staleRunbookState: fixture.staleRunbookBundle.rehearsalFreshnessState,
    staleRunbookBlockers: fixture.staleRunbookBundle.blockerRefs,
  },
  exerciseAuthority: {
    exerciseTypes: fixture.exerciseEvidenceRecords.map((record) => record.exerciseType),
    exactExerciseCount: fixture.exerciseEvidenceRecords.filter(
      (record) => record.resultState === "exact",
    ).length,
  },
  blockerAuthority: {
    missingProofRefs: fixture.missingProofRefs,
    blockerRefs: fixture.blockerExplanation.blockerRefs,
    phaseBlockerRefs: fixture.blockerExplanation.phaseBlockerRefs,
    bauBlockerRefs: fixture.blockerExplanation.bauBlockerRefs,
  },
  authAuthority: {
    tenantDeniedErrorCode: fixture.tenantDeniedErrorCode,
    authorizationDeniedErrorCode: fixture.authorizationDeniedErrorCode,
  },
  deterministicReplay: {
    replayHash: fixture.replayHash,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, await formatJson(contractArtifact, contractPath));
fs.writeFileSync(fixturePath, await formatJson(fixture, fixturePath));
fs.writeFileSync(summaryPath, phase9CrossPhaseConformanceSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Cross-Phase Conformance Algorithm Alignment",
    "",
    "Task 449 implements section 9I as the final programme-truth backend. Phase rows bind planning summaries, canonical blueprint refs, control status, slice trust, continuity evidence, operations proof, governance proof, runtime publication, verification scenarios, release recovery disposition, and final proof refs.",
    "",
    "The CrossPhaseConformanceScorecard is exact only when every required row is exact and the scorecard hash still matches the current planning, verification, runtime publication, continuity-proof, and final-proof tuple.",
    "",
    "BAU readiness is blocked by stale or blocked scorecards, non-exact continuity review, open risks, stale runbooks, invalid on-call contacts, and incomplete exercise evidence. Release-to-BAU record creation is blocked until the scorecard is exact.",
    "",
  ].join("\n"),
);
fs.writeFileSync(rowsCsvPath, phase9ConformanceRowsCsv(fixture));
fs.writeFileSync(blockersCsvPath, phase9BAUSignoffBlockersCsv(fixture));

console.log(`Phase 9 cross-phase conformance contract: ${path.relative(root, contractPath)}`);
console.log(`Replay hash: ${fixture.replayHash}`);
