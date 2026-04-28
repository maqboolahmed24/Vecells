import fs from "node:fs";
import path from "node:path";
import {
  CONFORMANCE_SCORECARD_GAP_ARTIFACT_REF,
  CONFORMANCE_SCORECARD_SCHEMA_VERSION,
  createCrossPhaseConformanceScorecardFixture,
  createCrossPhaseConformanceScorecardProjection,
} from "../../apps/ops-console/src/conformance-scorecard-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "460_phase9_conformance_scorecard_route_contract.json",
);
const fixturePath = path.join(fixturesDir, "460_conformance_scorecard_fixtures.json");
const notePath = path.join(analysisDir, "460_conformance_scorecard_implementation_note.md");

const fixture = createCrossPhaseConformanceScorecardFixture();
const exact = fixture.scenarioProjections.exact;
const stale = fixture.scenarioProjections.stale;
const blocked = fixture.scenarioProjections.blocked;
const summaryDrift = fixture.scenarioProjections.summary_drift;
const missingVerification = fixture.scenarioProjections.missing_verification;
const staleRuntime = fixture.scenarioProjections.stale_runtime_tuple;
const missingOpsProof = fixture.scenarioProjections.missing_ops_proof;
const deferred = fixture.scenarioProjections.deferred_channel;
const noBlocker = fixture.scenarioProjections.no_blocker;
const permissionDenied = fixture.scenarioProjections.permission_denied;
const ownerFiltered = createCrossPhaseConformanceScorecardProjection({
  scenarioState: "blocked",
  ownerFilter: "operations",
  blockerFilter: "has_blocker",
});

const contractArtifact = {
  schemaVersion: CONFORMANCE_SCORECARD_SCHEMA_VERSION,
  route: fixture.route,
  visualMode: fixture.visualMode,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  interfaceGapArtifactRef: CONFORMANCE_SCORECARD_GAP_ARTIFACT_REF,
  automationAnchors: fixture.automationAnchors,
  routeIntegration: {
    path: "/ops/conformance",
    serviceOwnerSurface: true,
    noExecutiveRag: true,
    noAdjacentDashboard: true,
    sameShellMissionStack:
      exact.shellContinuityKey ===
      "operations:tenant-demo-gp:ops-board:24h-rolling:scope-policy-ops-service-owner-read",
  },
  projectionCoverage: {
    phaseRows: exact.phaseRows.length,
    matrixFamilies: exact.controlFamilyMatrix.families.length,
    matrixDimensions: exact.controlFamilyMatrix.dimensions.length,
    sourceTraceSteps: exact.sourceTrace.steps.length,
    safeHandoffTargets: exact.safeHandoffLinks.map((link) => link.targetSurface),
    typedProjectionNames: [
      "CrossPhaseConformanceScorecardProjection",
      "PhaseConformanceRowProjection",
      "ConformanceBlockerQueueProjection",
      "BAUSignoffReadinessProjection",
      "ConformanceSourceTraceProjection",
      "ConformanceRowDiffProjection",
    ],
    componentNames: [
      "ConformanceScorecardShell",
      "PhaseRowProofTable",
      "CrossPhaseControlFamilyMatrix",
      "RuntimeTupleCoverageBand",
      "GovernanceOpsProofRail",
      "BAUSignoffBlockerQueue",
      "ConformanceSourceTraceDrawer",
      "ScorecardHashCard",
      "SummaryAlignmentDiffPanel",
    ],
  },
  bauGating: {
    exactReady: exact.bauSignoffReadiness.actionState === "ready",
    staleDiagnosticOnly: stale.bauSignoffReadiness.actionState === "diagnostic_only",
    blockedFailsClosed: blocked.bauSignoffReadiness.actionState === "blocked",
    summaryDriftBlocked: summaryDrift.bauSignoffReadiness.actionState === "blocked",
    missingVerificationBlocked: missingVerification.bauSignoffReadiness.actionState === "blocked",
    staleRuntimeBlocked: staleRuntime.bauSignoffReadiness.actionState === "blocked",
    missingOpsProofBlocked: missingOpsProof.bauSignoffReadiness.actionState === "blocked",
    deferredChannelExplicit:
      deferred.phaseRows.some((row) => row.rowKind === "deferred_channel") &&
      deferred.bauSignoffReadiness.actionState === "ready",
    noBlockerReady:
      noBlocker.blockerQueue.blockerCount === 0 &&
      noBlocker.bauSignoffReadiness.actionState === "ready",
    permissionDeniedUnavailable:
      permissionDenied.bauSignoffReadiness.actionState === "permission_denied",
  },
  filterCoverage: {
    ownerFilteredCount: ownerFiltered.visibleRows.length,
    ownerFilteredAllOperations: ownerFiltered.visibleRows.every(
      (row) => row.ownerKey === "operations",
    ),
    blockerQueueFilteredCount: ownerFiltered.blockerQueue.items.length,
  },
  sourceTrace: {
    returnTokenRef: exact.sourceTrace.returnTokenRef,
    steps: exact.sourceTrace.steps.map((step) => step.stepKey),
    selectedRowRef: exact.sourceTrace.selectedRowRef,
  },
  artifactSafety: {
    noRawArtifactUrls: exact.noRawArtifactUrls === true,
    allHandoffsSuppressRawUrls: exact.safeHandoffLinks.every(
      (link) => link.rawArtifactUrlSuppressed === true,
    ),
    serializedProjectionHasNoHttpUrls: !JSON.stringify(fixture).match(/https?:\/\//),
  },
  scenarioCoverage: Object.fromEntries(
    Object.entries(fixture.scenarioProjections).map(([scenarioState, projection]) => [
      scenarioState,
      {
        scorecardState: projection.scorecardHash.scorecardState,
        bauActionState: projection.bauSignoffReadiness.actionState,
        blockerQueueState: projection.blockerQueue.queueState,
        selectedRowRef: projection.selectedRowRef,
      },
    ]),
  ),
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(
  notePath,
  [
    "# Phase 9 Conformance Scorecard Implementation Note",
    "",
    "Task 460 adds `/ops/conformance` as the service-owner proof surface for CrossPhaseConformanceScorecard and PhaseConformanceRow state.",
    "",
    "The projection is a bounded read-only adapter over task 449 canonical conformance rows and scorecards. The route rejects summary-only optimism, keeps Phase 7 deferred-channel rows explicit, disables BAU signoff whenever row, runtime, governance, operations, recovery, or permission proof is not exact, and carries same-shell handoff return tokens without raw artifact URLs.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 conformance scorecard contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 conformance scorecard fixture: ${path.relative(root, fixturePath)}`);
