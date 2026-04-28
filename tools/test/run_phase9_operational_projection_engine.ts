import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  createPhase9OperationalProjectionEngineFixture,
  phase9OperationalProjectionEngineSummary,
  phase9OperationalProjectionEventAdapterMatrixCsv,
  validateOperationalProjectionEventAdapters,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "437_phase9_operational_projection_engine_contract.json",
);
const fixturePath = path.join(
  fixturesDir,
  "437_phase9_operational_projection_engine_fixtures.json",
);
const summaryPath = path.join(analysisDir, "437_phase9_operational_projection_engine_summary.md");
const notesPath = path.join(analysisDir, "437_algorithm_alignment_notes.md");
const adapterMatrixPath = path.join(
  analysisDir,
  "437_operational_projection_event_adapter_matrix.csv",
);

const fixture = createPhase9OperationalProjectionEngineFixture();
const adapterErrors = validateOperationalProjectionEventAdapters(fixture.eventAdapters);
if (adapterErrors.length > 0) {
  throw new Error(`Operational event adapter coverage failed: ${adapterErrors.join("; ")}`);
}

const contractArtifact = {
  schemaVersion: PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  contractVersion: fixture.baselineResult.contractVersion,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  projectionInputs: fixture.eventAdapters.map((adapter) => ({
    eventFamily: adapter.eventFamily,
    sourceProjection: adapter.sourceProjection,
    requiredFields: adapter.requiredFields,
    orderingKey: adapter.orderingKey,
    dedupeKey: adapter.dedupeKey,
    tenantScope: adapter.tenantScope,
    timestampSemantics: adapter.timestampSemantics,
    lateEventHandling: adapter.lateEventHandling,
    sourceTrustDependency: adapter.sourceTrustDependency,
  })),
  producedObjects: [
    "QueueHealthSnapshot",
    "BreachRiskRecord",
    "DependencyHealthRecord",
    "MetricAnomalySnapshot",
    "EquitySliceMetric",
    "ContinuityControlHealthProjection",
    "ProjectionHealthSnapshot",
    "OpsOverviewContextFrame",
    "OpsOverviewSliceEnvelope",
    "LiveBoardDeltaWindow",
  ],
  queueHealthFields: [
    "depth",
    "medianAge",
    "p95Age",
    "arrivalRate",
    "clearRate",
    "utilization",
    "aggregateBreachProbability",
    "breachRiskCount",
    "escalationCount",
    "anomalyState",
    "capturedAt",
    "sourceWindowHash",
    "trustState",
    "completenessState",
  ],
  dependencyCodes: fixture.baselineResult.dependencyHealthRecords.map(
    (record) => record.dependencyCode,
  ),
  continuityControls: fixture.baselineResult.continuityControlHealthProjections.map(
    (projection) => projection.controlCode,
  ),
  deterministicReplay: {
    baselineSnapshotHash: fixture.baselineResult.snapshotHash,
    replayHash: fixture.replayHash,
    duplicateSnapshotHash: fixture.duplicateResult.snapshotHash,
    lateCorrectionState: fixture.lateCorrectionResult.replay.correctionState,
  },
  failClosedDashboardPosture: {
    staleTrustRenderModes: fixture.staleTrustResult.opsOverviewSliceEnvelopes.map(
      (envelope) => envelope.renderMode,
    ),
    staleTrustTileLabels: fixture.staleTrustResult.dashboardTiles.map((tile) => tile.stateLabel),
  },
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9OperationalProjectionEngineSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Operational Projection Engine Algorithm Alignment",
    "",
    "The engine composes the frozen task 433 operational contracts and the task 436 graph verdict posture. It does not calculate queue health from UI state.",
    "",
    "Projection replay is deterministic: events are validated by typed adapters, deduped by declared dedupe keys, ordered by domain timestamp, ordering key, sequence, and event id, then hashed through the Phase 9 assurance canonical hash helpers.",
    "",
    "Breach risk uses the frozen working-minute slack, effective workload, conservative capacity, service time, dependency delay, Gamma survival, calibration, Wilson bounds, and queue aggregate formulas.",
    "",
    "Continuity-control health requires exact settlement or restore refs, return or continuation refs, experience continuity evidence refs, continuity hashes, and required AssuranceSliceTrustRecord rows. Queue age and dependency delay remain supporting symptoms only.",
    "",
    "Dashboard DTOs carry freshness, trust, completeness, blockers, drill-in scope, graph verdict refs, projection health refs, and risk bounds so stale, untrusted, or incomplete projections fail closed.",
    "",
  ].join("\n"),
);
fs.writeFileSync(
  adapterMatrixPath,
  phase9OperationalProjectionEventAdapterMatrixCsv(fixture.eventAdapters),
);

console.log(`Phase 9 operational projection engine contract: ${path.relative(root, contractPath)}`);
console.log(`Baseline snapshot hash: ${fixture.baselineResult.snapshotHash}`);
console.log(`Replay hash: ${fixture.replayHash}`);
