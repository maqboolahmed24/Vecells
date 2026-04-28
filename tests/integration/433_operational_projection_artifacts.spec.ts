import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_OPERATIONAL_CONTRACT_VERSION,
  REQUIRED_PHASE9_OPERATIONAL_CONTRACTS,
  calculateQueueAggregateBreachProbability,
  createPhase9OperationalProjectionFixture,
  hashOperationalMetricDefinition,
  validateDashboardMetricTileContract,
  validateOperationalContractDefinitionCoverage,
  validateOperationalContractObject,
  type Phase9OperationalContractDefinition,
  type Phase9OperationalProjectionFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("433 Phase 9 operational projection artifacts", () => {
  it("publishes frozen contract definitions for downstream dashboards and task 437", () => {
    const artifact = readJson<{
      schemaVersion: string;
      contractSetHash: string;
      contracts: Phase9OperationalContractDefinition[];
      requiredFormulas: Record<string, string>;
      requiredInvariants: string[];
    }>("data/contracts/433_phase9_operational_projection_contracts.json");
    const coverage = validateOperationalContractDefinitionCoverage();

    expect(artifact.schemaVersion).toBe(PHASE9_OPERATIONAL_CONTRACT_VERSION);
    expect(coverage).toEqual({ valid: true, errors: [] });
    expect(artifact.contracts.map((definition) => definition.contractName)).toEqual(
      [...REQUIRED_PHASE9_OPERATIONAL_CONTRACTS],
    );
    expect(artifact.requiredInvariants).toHaveLength(10);
    expect(artifact.requiredFormulas.breachRisk).toContain("mu_l^-");
    expect(artifact.requiredFormulas.anomaly).toContain("EWMA");
  });

  it("materializes deterministic fixtures and versioned hashable metric definitions", () => {
    const fixture = readJson<Phase9OperationalProjectionFixture>(
      "data/fixtures/433_phase9_operational_projection_fixtures.json",
    );
    const recomputed = createPhase9OperationalProjectionFixture();

    expect(fixture.schemaVersion).toBe(PHASE9_OPERATIONAL_CONTRACT_VERSION);
    expect(fixture.contractSetHash).toBe(recomputed.contractSetHash);
    expect(fixture.metricDefinitionSetHash).toBe(recomputed.metricDefinitionSetHash);
    expect(fixture.metricDefinitions).toHaveLength(19);
    expect(fixture.metricDefinitions.every((definition) => definition.normalizationVersionRef)).toBe(true);
    expect(hashOperationalMetricDefinition(fixture.metricDefinitions[0]!)).toBe(
      hashOperationalMetricDefinition(recomputed.metricDefinitions[0]!),
    );
    for (const contractName of REQUIRED_PHASE9_OPERATIONAL_CONTRACTS) {
      expect(validateOperationalContractObject(contractName, fixture.examples[contractName])).toEqual({
        valid: true,
        errors: [],
      });
    }
  });

  it("preserves queue aggregate breach probability and dashboard data boundary", () => {
    const fixture = readJson<Phase9OperationalProjectionFixture>(
      "data/fixtures/433_phase9_operational_projection_fixtures.json",
    );
    const recomputed = createPhase9OperationalProjectionFixture();

    expect(fixture.queueAggregateBreachProbability).toBe(recomputed.queueAggregateBreachProbability);
    expect(calculateQueueAggregateBreachProbability([fixture.examples.BreachRiskRecord])).toBeCloseTo(
      fixture.examples.BreachRiskRecord.predictedProbability,
      10,
    );
    expect(fixture.dashboardDataBoundaryFields).toEqual([
      "stateLabel",
      "stateReason",
      "primaryValue",
      "confidenceOrBound",
      "lastUpdated",
      "freshnessState",
      "trustState",
      "completenessState",
      "blockingRefs",
      "allowedDrillIns",
      "investigationScopeSeed",
    ]);
    expect(
      validateDashboardMetricTileContract({
        stateLabel: "Degraded",
        stateReason: "Projection is stale.",
        primaryValue: "42",
        confidenceOrBound: "0.22-0.31",
        lastUpdated: fixture.generatedAt,
        freshnessState: "stale_review",
        trustState: "degraded",
        completenessState: "partial",
        blockingRefs: ["projection:stale"],
        allowedDrillIns: ["triage_queue"],
        investigationScopeSeed: "scope:triage",
      }).valid,
    ).toBe(true);
  });

  it("writes operator-readable summary, algorithm notes, and metric matrix", () => {
    const summary = readText("data/analysis/433_phase9_operational_contract_summary.md");
    const notes = readText("data/analysis/433_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/433_operational_metric_definition_matrix.csv");

    expect(summary).toContain("Contract count: 13");
    expect(summary).toContain("Metric definition count: 19");
    expect(summary).toContain("Dashboard Boundary");
    expect(notes).toContain("Breach risk freezes working-minute slack");
    expect(notes).toContain("Anomaly state freezes expected value source");
    expect(matrix).toContain("metricCode,sourceProjection");
    expect(matrix).toContain("patient_message_delivery");
    expect(matrix).toContain("projection_rebuild_health");
  });

  it("records that no operational metric source gap artifact is needed", () => {
    const contractSource = readText(
      "packages/domains/analytics_assurance/src/phase9-operational-projection-contracts.ts",
    );
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_433_OPERATIONAL_METRIC_SOURCE.json",
    );

    for (const token of [
      "WaitlistContinuationTruthProjection",
      "PharmacyDispatchTruthProjection",
      "PatientCommunicationVisibilityProjection",
      "AssuranceEvidenceGraphSnapshot",
      "ProjectionHealthSnapshot",
    ]) {
      expect(contractSource).toContain(token);
    }
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
