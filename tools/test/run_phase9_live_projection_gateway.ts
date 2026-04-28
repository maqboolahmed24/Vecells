import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_LIVE_PROJECTION_GAP_ARTIFACT_REF,
  PHASE9_LIVE_PROJECTION_SCHEMA_VERSION,
  createLivePhase9ProjectionGatewayProjection,
  createPhase9LiveProjectionGatewayFixture,
  requiredPhase9LiveSurfaceCodes,
} from "../../packages/domains/operations/src/index";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "464_phase9_live_projection_gateway_contract.json");
const fixturePath = path.join(fixturesDir, "464_live_projection_gateway_fixtures.json");
const evidencePath = path.join(
  analysisDir,
  "464_live_projection_gateway_verification_evidence.json",
);

const fixture = createPhase9LiveProjectionGatewayFixture();
const normal = fixture.scenarioProjections.normal;
const versionMismatch = fixture.scenarioProjections.projection_version_mismatch;
const missingBinding = fixture.scenarioProjections.missing_runtime_binding;
const graphDrift = fixture.scenarioProjections.graph_drift;
const quarantine = fixture.scenarioProjections.quarantined_incident_producer;
const deltaGate = fixture.scenarioProjections.delta_gate_open;
const returnDrift = fixture.scenarioProjections.return_token_drift;

const contractArtifact = {
  schemaVersion: PHASE9_LIVE_PROJECTION_SCHEMA_VERSION,
  visualMode: fixture.visualMode,
  interfaceGapArtifactRef: PHASE9_LIVE_PROJECTION_GAP_ARTIFACT_REF,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  automationAnchors: fixture.automationAnchors,
  requiredPhase9LiveSurfaceCodes,
  surfaceCoverage: {
    channelCount: normal.channelContracts.length,
    allSurfacesCovered: requiredPhase9LiveSurfaceCodes.every((surfaceCode) =>
      normal.surfaces.some((surface) => surface.surfaceCode === surfaceCode),
    ),
    allSubscriptionKeysUnique:
      new Set(normal.channelContracts.map((contract) => contract.subscriptionKey)).size ===
      normal.channelContracts.length,
    allRuntimeBindingsRequired: normal.channelContracts.every(
      (contract) => contract.requiresRuntimeBinding === true,
    ),
    rawEventBrowserJoinAllowed: normal.rawEventBrowserJoinAllowed,
    rawDomainEventPayloadAllowed: normal.rawDomainEventPayloadAllowed,
  },
  failClosedCoverage: {
    versionMismatchBlocks:
      versionMismatch.selectedSurface.projectionState === "blocked" &&
      versionMismatch.selectedSurface.channelContract.failureMode ===
        "block_on_missing_projection_version",
    missingRuntimeBindingBlocks:
      missingBinding.selectedSurface.projectionState === "blocked" &&
      missingBinding.selectedSurface.runtimeBindingState === "missing",
    graphDriftBlocksSignoff:
      graphDrift.selectedSurface.graphVerdictState === "stale" &&
      graphDrift.selectedSurface.actionSettlementState === "stale_reacquire",
    deltaGatePreservesAnchor:
      deltaGate.selectedSurface.deltaGateState === "queued" &&
      deltaGate.selectedSurface.selectedAnchorPreserved === true,
    returnTokenDriftRecoversReadOnly:
      returnDrift.selectedSurface.returnTokenState === "partial_restore" &&
      returnDrift.selectedSurface.actionSettlementState === "read_only_recovery",
    telemetryRedacted: normal.telemetryFenceRedacted === true,
    cleanupProven: normal.subscriptionCleanupProven === true,
  },
  quarantineCoverage: {
    quarantinedSurfaces: quarantine.surfaces
      .filter((surface) => surface.projectionState === "quarantined")
      .map((surface) => surface.surfaceCode),
    unaffectedCurrentSurfaces: quarantine.surfaces
      .filter((surface) => surface.projectionState === "current")
      .map((surface) => surface.surfaceCode),
    sliceBounded:
      quarantine.quarantinedCount === 3 &&
      quarantine.surfaces.some(
        (surface) =>
          surface.surfaceCode === "records_governance" && surface.projectionState === "current",
      ),
  },
  scenarioCoverage: Object.fromEntries(
    Object.entries(fixture.scenarioProjections).map(([scenarioState, projection]) => [
      scenarioState,
      {
        selectedSurfaceCode: projection.selectedSurfaceCode,
        projectionState: projection.selectedSurface.projectionState,
        runtimeBindingState: projection.selectedSurface.runtimeBindingState,
        actionSettlementState: projection.selectedSurface.actionSettlementState,
        graphVerdictState: projection.selectedSurface.graphVerdictState,
        deltaGateState: projection.selectedSurface.deltaGateState,
        returnTokenState: projection.selectedSurface.returnTokenState,
        rawEventBrowserJoinAllowed: projection.rawEventBrowserJoinAllowed,
      },
    ]),
  ),
};

const evidence = {
  schemaVersion: "464.phase9.live-projection-gateway-evidence.v1",
  generatedAt: "2026-04-28T12:25:00Z",
  replayProjection: createLivePhase9ProjectionGatewayProjection({
    scenarioState: "normal",
    selectedSurfaceCode: "operations_overview",
  }),
  graphDriftProjection: createLivePhase9ProjectionGatewayProjection({
    scenarioState: "graph_drift",
    selectedSurfaceCode: "assurance_center",
  }),
  returnTokenProjection: createLivePhase9ProjectionGatewayProjection({
    scenarioState: "return_token_drift",
    selectedSurfaceCode: "records_governance",
  }),
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`Phase 9 live projection gateway contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 live projection gateway fixture: ${path.relative(root, fixturePath)}`);
console.log(`Phase 9 live projection gateway evidence: ${path.relative(root, evidencePath)}`);
