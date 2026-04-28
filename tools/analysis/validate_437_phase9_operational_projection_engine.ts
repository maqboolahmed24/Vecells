import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  createPhase9OperationalProjectionEngineFixture,
  validateOperationalProjectionEventAdapters,
  type Phase9OperationalProjectionEngineFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-operational-projection-engine.ts",
  "data/contracts/437_phase9_operational_projection_engine_contract.json",
  "data/fixtures/437_phase9_operational_projection_engine_fixtures.json",
  "data/analysis/437_phase9_operational_projection_engine_summary.md",
  "data/analysis/437_algorithm_alignment_notes.md",
  "data/analysis/437_operational_projection_event_adapter_matrix.csv",
  "tools/test/run_phase9_operational_projection_engine.ts",
  "tools/analysis/validate_437_phase9_operational_projection_engine.ts",
  "tests/unit/437_operational_projection_engine.spec.ts",
  "tests/integration/437_operational_projection_engine_artifacts.spec.ts",
];

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const relativePath of requiredFiles) {
  assert(fs.existsSync(path.join(root, relativePath)), `MISSING_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
assert(
  packageJson.scripts?.["test:phase9:operational-projection-engine"] ===
    "pnpm exec tsx ./tools/test/run_phase9_operational_projection_engine.ts && pnpm exec vitest run tests/unit/437_operational_projection_engine.spec.ts tests/integration/437_operational_projection_engine_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:operational-projection-engine",
);
assert(
  packageJson.scripts?.["validate:437-phase9-operational-projection-engine"] ===
    "pnpm exec tsx ./tools/analysis/validate_437_phase9_operational_projection_engine.ts",
  "PACKAGE_SCRIPT_MISSING:validate:437-phase9-operational-projection-engine",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_437_/m.test(checklist), "CHECKLIST_TASK_437_NOT_CLAIMED_OR_COMPLETE");

assert(
  readJson<{ schemaVersion?: string }>("data/contracts/432_phase9_assurance_ledger_contracts.json")
    .schemaVersion === "432.phase9.assurance-ledger-contracts.v1",
  "PHASE9_ASSURANCE_CONTRACTS_MISSING_OR_DRIFTED",
);
assert(
  readJson<{ schemaVersion?: string }>(
    "data/contracts/433_phase9_operational_projection_contracts.json",
  ).schemaVersion === "433.phase9.operational-projection-contracts.v1",
  "PHASE9_OPERATIONAL_CONTRACTS_MISSING_OR_DRIFTED",
);
assert(
  readJson<{ schemaVersion?: string }>(
    "data/contracts/436_phase9_graph_verdict_engine_contract.json",
  ).schemaVersion === "436.phase9.graph-verdict-engine.v1",
  "PHASE9_GRAPH_VERDICT_CONTRACT_MISSING_OR_DRIFTED",
);

const contract = readJson<{
  schemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  projectionInputs?: readonly { eventFamily: string; sourceTrustDependency: string }[];
  producedObjects?: readonly string[];
  queueHealthFields?: readonly string[];
  deterministicReplay?: {
    baselineSnapshotHash?: string;
    duplicateSnapshotHash?: string;
    lateCorrectionState?: string;
  };
  failClosedDashboardPosture?: {
    staleTrustRenderModes?: readonly string[];
    staleTrustTileLabels?: readonly string[];
  };
}>("data/contracts/437_phase9_operational_projection_engine_contract.json");
assert(
  contract.schemaVersion === PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  "CONTRACT_SCHEMA_VERSION_DRIFT",
);
for (const sourceRef of [
  "#9A",
  "#9B",
  "432_phase9_assurance",
  "433_phase9_operational",
  "436_phase9_graph",
]) {
  assert(
    contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const family of [
  "request_intake",
  "triage_queue",
  "more_info_loop",
  "booking_search_commit",
  "waitlist_movement",
  "hub_coordination",
  "pharmacy_dispatch_outcome",
  "communications_delivery_receipt",
  "patient_navigation_continuity",
  "support_replay_investigation",
  "assistive_session_trust_continuity",
  "assurance_graph_slice_trust",
]) {
  assert(
    contract.projectionInputs?.some((input) => input.eventFamily === family),
    `EVENT_FAMILY_MISSING:${family}`,
  );
}
for (const objectName of [
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
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const field of [
  "sourceWindowHash",
  "trustState",
  "completenessState",
  "aggregateBreachProbability",
]) {
  assert(contract.queueHealthFields?.includes(field), `QUEUE_HEALTH_FIELD_MISSING:${field}`);
}
assert(
  contract.deterministicReplay?.lateCorrectionState !== "none",
  "LATE_EVENT_CORRECTION_NOT_RECORDED",
);
assert(
  contract.failClosedDashboardPosture?.staleTrustRenderModes?.every(
    (mode) => mode !== "interactive",
  ),
  "STALE_TRUST_RENDERED_INTERACTIVE",
);
assert(
  contract.failClosedDashboardPosture?.staleTrustTileLabels?.every((label) => label !== "Normal"),
  "STALE_TRUST_TILE_MARKED_NORMAL",
);

const fixture = readJson<Phase9OperationalProjectionEngineFixture>(
  "data/fixtures/437_phase9_operational_projection_engine_fixtures.json",
);
const recomputed = createPhase9OperationalProjectionEngineFixture();
assert(
  fixture.schemaVersion === PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  "FIXTURE_SCHEMA_VERSION_DRIFT",
);
assert(
  fixture.baselineResult.snapshotHash === recomputed.baselineResult.snapshotHash,
  "BASELINE_HASH_DRIFT",
);
assert(
  fixture.duplicateResult.snapshotHash === recomputed.duplicateResult.snapshotHash,
  "DUPLICATE_HASH_DRIFT",
);
assert(fixture.lateCorrectionResult.replay.correctionState !== "none", "LATE_REPLAY_STATE_MISSING");
assert(
  fixture.duplicateResult.queueHealthSnapshots[0]?.depth ===
    fixture.baselineResult.queueHealthSnapshots[0]?.depth,
  "DUPLICATE_DOUBLE_COUNTED",
);
assert(
  fixture.lowSupportResult.breachRiskExplanationVectors.some(
    (vector) => vector.confidenceState === "low_support",
  ),
  "LOW_SUPPORT_CONFIDENCE_MISSING",
);
assert(
  fixture.staleTrustResult.dashboardTiles.every((tile) => tile.stateLabel !== "Normal"),
  "STALE_TRUST_DASHBOARD_NOT_BLOCKED",
);
assert(
  validateOperationalProjectionEventAdapters(fixture.eventAdapters).length === 0,
  "FIXTURE_ADAPTERS_INVALID",
);

const gapPath =
  "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_437_OPERATIONAL_EVENT_SOURCE.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_OPERATIONAL_EVENT_SOURCE_GAP");

const sourceText = readText(
  "packages/domains/analytics_assurance/src/phase9-operational-projection-engine.ts",
);
for (const token of [
  "Phase9OperationalProjectionEngine",
  "projectPhase9OperationalWindow",
  "getDefaultOperationalProjectionEventAdapters",
  "calculateBreachRisk",
  "calculateQueueAggregateBreachProbability",
  "ContinuityControlHealthProjection",
  "validateMetricAggregationTenantScope",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/437_operational_projection_engine.spec.ts")}\n${readText(
  "tests/integration/437_operational_projection_engine_artifacts.spec.ts",
)}`;
for (const token of [
  "event stream -> deterministic queue snapshot",
  "breach-risk probability increases as slack decreases",
  "dependency delay raises breach risk",
  "low support degrades confidence",
  "anomaly hysteresis prevents flapping",
  "equity slice low support marked insufficient",
  "stale assurance trust blocks normal dashboard state",
  "late event triggers rebuild or correction path",
  "duplicate event does not double-count",
  "cross-tenant aggregation denied",
  "continuity-control health requires exact settlement/restore evidence",
  "replay from same events produces identical snapshots and hashes",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/437_phase9_operational_projection_engine_summary.md");
for (const token of [
  "Schema version",
  "Adapter count",
  "Baseline snapshot hash",
  "Continuity controls",
]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}
const matrix = readText("data/analysis/437_operational_projection_event_adapter_matrix.csv");
assert(matrix.includes("eventFamily,sourceProjection"), "ADAPTER_MATRIX_HEADER_MISSING");
assert(matrix.includes("triage_queue,TriageQueueProjection"), "ADAPTER_MATRIX_TRIAGE_MISSING");
assert(
  matrix.includes("assurance_graph_slice_trust,AssuranceEvidenceGraphSnapshot"),
  "ADAPTER_MATRIX_GRAPH_MISSING",
);

console.log("437 phase9 operational projection engine validated.");
