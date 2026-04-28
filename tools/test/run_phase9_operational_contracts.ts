import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_OPERATIONAL_CONTRACT_VERSION,
  createPhase9OperationalProjectionFixture,
  phase9OperationalAlgorithmAlignmentNotes,
  phase9OperationalContractDefinitions,
  phase9OperationalMetricMatrixToCsv,
  summarizePhase9OperationalContractFreeze,
  validateOperationalContractDefinitionCoverage,
} from "../../packages/domains/analytics_assurance/src/phase9-operational-projection-contracts.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "433_phase9_operational_projection_contracts.json");
const fixturePath = path.join(fixturesDir, "433_phase9_operational_projection_fixtures.json");
const summaryPath = path.join(analysisDir, "433_phase9_operational_contract_summary.md");
const notesPath = path.join(analysisDir, "433_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "433_operational_metric_definition_matrix.csv");

const coverage = validateOperationalContractDefinitionCoverage();
if (!coverage.valid) {
  throw new Error(`Phase 9 operational contract coverage failed: ${coverage.errors.join("; ")}`);
}

const fixture = createPhase9OperationalProjectionFixture();
const contractArtifact = {
  schemaVersion: PHASE9_OPERATIONAL_CONTRACT_VERSION,
  sourceAlgorithmRef: "blueprint/phase-9-the-assurance-ledger.md#9B",
  phase8ExitPacketRef: fixture.phase8ExitPacketRef,
  phase9AssuranceContractsRef: fixture.phase9AssuranceContractsRef,
  requiredFormulas: {
    breachRisk:
      "d_i, B_i, mu_l^-, W_i, S_i, D_i, T_i, Gamma(k, theta), calibrated P_breach_i, Wilson bounds, P_any_breach_q, priority_i",
    anomaly:
      "y_m, yhat_m, standardized residual, EWMA, positive CUSUM, negative CUSUM, minimum support, hysteresis, alert state",
    dashboard:
      "freshness, trust, completeness, graph or assurance refs, blocking refs, permitted render posture, bounded drill scope",
  },
  requiredInvariants: [
    "Breach probability is monotone non-decreasing as slack decreases under fixed workload, capacity, service, and dependency assumptions.",
    "Queue aggregate breach probability is computed as one minus the product of non-breach probabilities after deduplicating mutually exclusive timers.",
    "Conservative capacity lower bounds degrade when staffed availability, dependency health, fallback sufficiency, or trust posture degrades.",
    "Dependency delay increases risk when all other inputs are fixed.",
    "Stale, degraded, quarantined, or incomplete dashboard slices cannot render as normal or interactive.",
    "Low-support equity slices are marked insufficient_support rather than normal.",
    "Anomaly hysteresis prevents alert flapping and requires lower exit thresholds for de-escalation.",
    "Dashboard DTOs require freshnessState, trustState, completenessState, blockers, allowed drill-ins, and investigation scope seed.",
    "Cross-tenant metric aggregation is denied unless a governed scope says otherwise.",
    "Metric definitions are versioned, deterministic, and hashable.",
  ],
  dashboardDataBoundaryFields: fixture.dashboardDataBoundaryFields,
  downstreamReadiness: {
    "437": "live operational projections, queue health, breach risk, anomaly state, dashboard envelopes, leases, and live-delta windows",
    "438": "waitlist conversion, pharmacy bounce-back/outcome latency, and notification delivery metric sources",
    "439": "investigation drawer sessions and bounded scope seeds for timeline reconstruction",
    "440": "assurance pack evidence for operational SLO and dashboard trust posture",
    "441": "CAPA gap routing from metric anomaly and breach-risk records",
    "442": "retention lifecycle decisions consuming operational projection health and dependency evidence",
  },
  contractSetHash: fixture.contractSetHash,
  metricDefinitionSetHash: fixture.metricDefinitionSetHash,
  contracts: phase9OperationalContractDefinitions,
  metricDefinitions: fixture.metricDefinitions,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, summarizePhase9OperationalContractFreeze(fixture));
fs.writeFileSync(notesPath, phase9OperationalAlgorithmAlignmentNotes());
fs.writeFileSync(matrixPath, phase9OperationalMetricMatrixToCsv(fixture.metricDefinitions));

console.log(`Phase 9 operational contracts: ${path.relative(root, contractPath)}`);
console.log(`Contract count: ${phase9OperationalContractDefinitions.length}`);
console.log(`Metric definitions: ${fixture.metricDefinitions.length}`);
console.log(`Contract set hash: ${fixture.contractSetHash}`);
console.log(`Metric definition set hash: ${fixture.metricDefinitionSetHash}`);
