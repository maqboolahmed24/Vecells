import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_GOVERNANCE_CONTRACT_VERSION,
  REQUIRED_PHASE9_GOVERNANCE_CONTRACTS,
  createPhase9GovernanceControlFixture,
  dispositionBlockReasonValues,
  validateGovernanceContractDefinitionCoverage,
  validateGovernanceContractObject,
  validateIncidentReportabilityEvidence,
  validateRecoveryEvidenceWriteback,
  type Phase9GovernanceContractDefinition,
  type Phase9GovernanceControlFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("434 Phase 9 governance control artifacts", () => {
  it("publishes frozen governance contracts for retention, resilience, incident, and tenant governance", () => {
    const artifact = readJson<{
      schemaVersion: string;
      contracts: Phase9GovernanceContractDefinition[];
      requiredInvariants: string[];
      dispositionBlockReasonValues: readonly string[];
      sourceAlgorithmRefs: readonly string[];
    }>("data/contracts/434_phase9_governance_control_contracts.json");

    expect(artifact.schemaVersion).toBe(PHASE9_GOVERNANCE_CONTRACT_VERSION);
    expect(validateGovernanceContractDefinitionCoverage()).toEqual({ valid: true, errors: [] });
    expect(artifact.contracts.map((definition) => definition.contractName)).toEqual(
      [...REQUIRED_PHASE9_GOVERNANCE_CONTRACTS],
    );
    expect(artifact.requiredInvariants).toHaveLength(10);
    expect(artifact.dispositionBlockReasonValues).toEqual([...dispositionBlockReasonValues]);
    expect(artifact.sourceAlgorithmRefs.join("\n")).toContain("#9E");
    expect(artifact.sourceAlgorithmRefs.join("\n")).toContain("#9H");
  });

  it("materializes deterministic fixtures and valid examples", () => {
    const fixture = readJson<Phase9GovernanceControlFixture>(
      "data/fixtures/434_phase9_governance_control_fixtures.json",
    );
    const recomputed = createPhase9GovernanceControlFixture();

    expect(fixture.schemaVersion).toBe(PHASE9_GOVERNANCE_CONTRACT_VERSION);
    expect(fixture.contractSetHash).toBe(recomputed.contractSetHash);
    expect(fixture.dispositionAssessment.assessmentHash).toBe(recomputed.dispositionAssessment.assessmentHash);
    expect(fixture.dispositionAssessment.blockingReasonRefs).toEqual(
      expect.arrayContaining(["active_dependency", "transitive_legal_hold"]),
    );
    for (const contractName of REQUIRED_PHASE9_GOVERNANCE_CONTRACTS) {
      expect(validateGovernanceContractObject(contractName, fixture.examples[contractName])).toEqual({
        valid: true,
        errors: [],
      });
    }
  });

  it("preserves graph writeback and incident lineage examples", () => {
    const fixture = readJson<Phase9GovernanceControlFixture>(
      "data/fixtures/434_phase9_governance_control_fixtures.json",
    );

    expect(validateRecoveryEvidenceWriteback(fixture.examples.RecoveryEvidenceWriteback)).toEqual({
      valid: true,
      errors: [],
    });
    expect(
      validateIncidentReportabilityEvidence(fixture.examples.IncidentRecord, fixture.examples.ReportabilityAssessment, [
        fixture.examples.IncidentTimelineEntry,
      ]),
    ).toEqual({ valid: true, errors: [] });
  });

  it("writes operator-readable summary, algorithm notes, and contract matrix", () => {
    const summary = readText("data/analysis/434_phase9_governance_contract_summary.md");
    const notes = readText("data/analysis/434_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/434_governance_contract_matrix.csv");

    expect(summary).toContain("Contract count: 32");
    expect(summary).toContain("Disposition assessment state: blocked");
    expect(summary).toContain("Transitive dependency count");
    expect(notes).toContain("Retention lifecycle freezes the 9E algorithm");
    expect(notes).toContain("Tenant governance contracts freeze 9H");
    expect(matrix).toContain("contractName,sourceAlgorithmRef,sourceObjectAlias");
    expect(matrix).toContain("RetentionLifecycleBinding");
    expect(matrix).toContain("AdminActionSettlement");
  });

  it("records that no governance contract interface gap artifact is needed", () => {
    const source = readText("packages/domains/analytics_assurance/src/phase9-governance-control-contracts.ts");
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_434_GOVERNANCE_CONTRACTS.json",
    );

    for (const token of [
      "RetentionLifecycleBinding",
      "OperationalReadinessSnapshot",
      "SecurityIncident",
      "ConfigVersion",
      "DependencyLifecycleRecord",
    ]) {
      expect(source).toContain(token);
    }
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
