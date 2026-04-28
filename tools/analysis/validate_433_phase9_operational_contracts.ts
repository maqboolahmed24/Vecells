import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_OPERATIONAL_CONTRACT_VERSION,
  REQUIRED_PHASE9_OPERATIONAL_CONTRACTS,
  OPS_DASHBOARD_DATA_BOUNDARY_FIELDS,
  createPhase9OperationalProjectionFixture,
  phase9OperationalContractDefinitions,
  validateDashboardMetricTileContract,
  validateOperationalContractDefinitionCoverage,
  validateOperationalContractObject,
  type Phase9OperationalContractDefinition,
  type Phase9OperationalProjectionFixture,
} from "../../packages/domains/analytics_assurance/src/phase9-operational-projection-contracts.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-operational-projection-contracts.ts",
  "data/contracts/433_phase9_operational_projection_contracts.json",
  "data/fixtures/433_phase9_operational_projection_fixtures.json",
  "data/analysis/433_phase9_operational_contract_summary.md",
  "data/analysis/433_algorithm_alignment_notes.md",
  "data/analysis/433_operational_metric_definition_matrix.csv",
  "tools/test/run_phase9_operational_contracts.ts",
  "tools/analysis/validate_433_phase9_operational_contracts.ts",
  "tests/unit/433_operational_projection_contracts.spec.ts",
  "tests/integration/433_operational_projection_artifacts.spec.ts",
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
  packageJson.scripts?.["test:phase9:operational-contracts"] ===
    "pnpm exec tsx ./tools/test/run_phase9_operational_contracts.ts && pnpm exec vitest run tests/unit/433_operational_projection_contracts.spec.ts tests/integration/433_operational_projection_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:operational-contracts",
);
assert(
  packageJson.scripts?.["validate:433-phase9-operational-contracts"] ===
    "pnpm exec tsx ./tools/analysis/validate_433_phase9_operational_contracts.ts",
  "PACKAGE_SCRIPT_MISSING:validate:433-phase9-operational-contracts",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_433_/m.test(checklist), "CHECKLIST_TASK_433_NOT_CLAIMED_OR_COMPLETE");

const phase8ExitPacket = readJson<{ verdict?: string; phase?: number }>("data/contracts/431_phase8_exit_packet.json");
assert(phase8ExitPacket.phase === 8, "PHASE8_EXIT_PACKET_PHASE_DRIFT");
assert(phase8ExitPacket.verdict === "approved_for_phase9", "PHASE8_EXIT_PACKET_NOT_APPROVED");
const phase9AssuranceContracts = readJson<{ schemaVersion?: string }>(
  "data/contracts/432_phase9_assurance_ledger_contracts.json",
);
assert(
  phase9AssuranceContracts.schemaVersion === "432.phase9.assurance-ledger-contracts.v1",
  "PHASE9_ASSURANCE_CONTRACTS_MISSING_OR_DRIFTED",
);

const coverage = validateOperationalContractDefinitionCoverage(phase9OperationalContractDefinitions);
assert(coverage.valid, `OPERATIONAL_CONTRACT_COVERAGE_FAILED:${coverage.errors.join(";")}`);

const contractArtifact = readJson<{
  schemaVersion?: string;
  contracts?: Phase9OperationalContractDefinition[];
  metricDefinitions?: unknown[];
  requiredFormulas?: Record<string, string>;
  requiredInvariants?: string[];
  dashboardDataBoundaryFields?: readonly string[];
  downstreamReadiness?: Record<string, string>;
}>("data/contracts/433_phase9_operational_projection_contracts.json");
assert(contractArtifact.schemaVersion === PHASE9_OPERATIONAL_CONTRACT_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
assert(contractArtifact.contracts?.length === REQUIRED_PHASE9_OPERATIONAL_CONTRACTS.length, "CONTRACT_COUNT_DRIFT");
assert((contractArtifact.metricDefinitions?.length ?? 0) >= 19, "ESSENTIAL_METRIC_DEFINITION_COUNT_TOO_SMALL");
assert(contractArtifact.requiredInvariants?.length === 10, "REQUIRED_INVARIANT_COUNT_DRIFT");
for (const formula of ["breachRisk", "anomaly", "dashboard"]) {
  assert(contractArtifact.requiredFormulas?.[formula], `FORMULA_MISSING:${formula}`);
}
for (const fieldName of OPS_DASHBOARD_DATA_BOUNDARY_FIELDS) {
  assert(contractArtifact.dashboardDataBoundaryFields?.includes(fieldName), `DASHBOARD_BOUNDARY_FIELD_MISSING:${fieldName}`);
}
for (const downstreamTask of ["437", "438", "439", "440", "441", "442"]) {
  assert(contractArtifact.downstreamReadiness?.[downstreamTask], `DOWNSTREAM_READINESS_MISSING:${downstreamTask}`);
}

const artifactNames = new Set((contractArtifact.contracts ?? []).map((definition) => definition.contractName));
for (const requiredName of REQUIRED_PHASE9_OPERATIONAL_CONTRACTS) {
  assert(artifactNames.has(requiredName), `CONTRACT_ARTIFACT_MISSING:${requiredName}`);
}

const fixture = readJson<Phase9OperationalProjectionFixture>(
  "data/fixtures/433_phase9_operational_projection_fixtures.json",
);
const recomputed = createPhase9OperationalProjectionFixture();
assert(fixture.schemaVersion === PHASE9_OPERATIONAL_CONTRACT_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(fixture.contractSetHash === recomputed.contractSetHash, "FIXTURE_CONTRACT_SET_HASH_DRIFT");
assert(
  fixture.metricDefinitionSetHash === recomputed.metricDefinitionSetHash,
  "FIXTURE_METRIC_DEFINITION_SET_HASH_DRIFT",
);
assert(fixture.metricDefinitions.length >= 19, "FIXTURE_METRIC_DEFINITIONS_TOO_SMALL");
assert(
  fixture.queueAggregateBreachProbability === recomputed.queueAggregateBreachProbability,
  "QUEUE_AGGREGATE_HASH_OR_FORMULA_DRIFT",
);

for (const contractName of REQUIRED_PHASE9_OPERATIONAL_CONTRACTS) {
  const example = fixture.examples[contractName];
  assert(example, `FIXTURE_EXAMPLE_MISSING:${contractName}`);
  const validation = validateOperationalContractObject(contractName, example);
  assert(validation.valid, `FIXTURE_EXAMPLE_INVALID:${contractName}:${validation.errors.join(";")}`);
}

assert(
  validateDashboardMetricTileContract({
    stateLabel: "Watch",
    stateReason: "Triage queue approaching SLA threshold.",
    primaryValue: "42 open",
    confidenceOrBound: "0.31-0.42",
    lastUpdated: fixture.generatedAt,
    freshnessState: "fresh",
    trustState: "trusted",
    completenessState: "complete",
    blockingRefs: [],
    allowedDrillIns: ["triage_queue"],
    investigationScopeSeed: "scope:triage:demo",
  }).valid,
  "DASHBOARD_BOUNDARY_VALID_EXAMPLE_FAILED",
);

const gapPath = "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_433_OPERATIONAL_METRIC_SOURCE.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_OPERATIONAL_METRIC_SOURCE_GAP");

const sourceText = readText("packages/domains/analytics_assurance/src/phase9-operational-projection-contracts.ts");
for (const token of [
  "workingMinuteSlack",
  "effectiveWorkloadAheadMinutes",
  "conservativeCapacityLowerBound",
  "dependencyDelayMeanMinutes",
  "calculateQueueAggregateBreachProbability",
  "evaluateMetricAnomaly",
  "insufficient_support",
  "derivePermittedDashboardPosture",
  "deriveInterventionCandidateEligibility",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/433_phase9_operational_contract_summary.md");
for (const token of [
  "Schema version: 433.phase9.operational-projection-contracts.v1",
  "Metric definition count",
  "Queue-level breach probability",
  "Dashboard Boundary",
]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}

const notes = readText("data/analysis/433_algorithm_alignment_notes.md");
for (const token of ["Breach risk", "Anomaly state", "Essential-function metrics", "Trust and completeness"]) {
  assert(notes.includes(token), `NOTES_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/433_operational_projection_contracts.spec.ts")}\n${readText(
  "tests/integration/433_operational_projection_artifacts.spec.ts",
)}`;
for (const token of [
  "slack decreases",
  "aggregate breach probability",
  "capacity lower-bound",
  "dependency delay",
  "stale projection",
  "low-support equity",
  "anomaly hysteresis",
  "missing trust/completeness",
  "cross-tenant",
  "versioned and hashable",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

console.log("433 phase9 operational contracts validated.");
