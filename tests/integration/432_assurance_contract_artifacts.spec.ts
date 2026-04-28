import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_ASSURANCE_CONTRACT_VERSION,
  REQUIRED_PHASE9_ASSURANCE_CONTRACTS,
  assertGraphCompletenessRequiredForConsumer,
  createPhase9AssuranceContractFixture,
  phase9AssuranceContractDefinitions,
  validateContractDefinitionCoverage,
  validateContractObject,
  validateLedgerPreviousHashContinuity,
  type Phase9AssuranceContractDefinition,
  type Phase9AssuranceContractFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("432 Phase 9 assurance contract artifacts", () => {
  it("publishes downstream-importable frozen contract definitions", () => {
    const artifact = readJson<{
      schemaVersion: string;
      contractSetHash: string;
      requiredInvariants: string[];
      contracts: Phase9AssuranceContractDefinition[];
    }>("data/contracts/432_phase9_assurance_ledger_contracts.json");
    const coverage = validateContractDefinitionCoverage(phase9AssuranceContractDefinitions);

    expect(artifact.schemaVersion).toBe(PHASE9_ASSURANCE_CONTRACT_VERSION);
    expect(coverage).toEqual({ valid: true, errors: [] });
    expect(artifact.contracts.map((definition) => definition.contractName)).toEqual(
      [...REQUIRED_PHASE9_ASSURANCE_CONTRACTS],
    );
    expect(artifact.requiredInvariants).toHaveLength(10);
    expect(artifact.requiredInvariants.join("\n")).toContain("previous-hash continuity");
    expect(artifact.requiredInvariants.join("\n")).toContain("parallel local evidence lists");
  });

  it("materializes deterministic valid fixtures and a complete graph verdict", () => {
    const fixture = readJson<Phase9AssuranceContractFixture>(
      "data/fixtures/432_phase9_assurance_contract_fixtures.json",
    );
    const recomputed = createPhase9AssuranceContractFixture();

    expect(fixture.contractSetHash).toBe(recomputed.contractSetHash);
    expect(fixture.graphSnapshot.graphHash).toBe(recomputed.graphSnapshot.graphHash);
    expect(fixture.graphCompletenessVerdict.decisionHash).toBe(recomputed.graphCompletenessVerdict.decisionHash);
    expect(fixture.graphCompletenessVerdict.verdictState).toBe("complete");
    expect(validateLedgerPreviousHashContinuity(fixture.ledgerEntries)).toEqual({ valid: true, errors: [] });
    assertGraphCompletenessRequiredForConsumer("support_replay", fixture.graphSnapshot, fixture.graphCompletenessVerdict);

    for (const contractName of REQUIRED_PHASE9_ASSURANCE_CONTRACTS) {
      expect(validateContractObject(contractName, fixture.examples[contractName])).toEqual({
        valid: true,
        errors: [],
      });
    }
  });

  it("writes audit-friendly summary, algorithm notes, and matrix outputs", () => {
    const summary = readText("data/analysis/432_phase9_assurance_contract_summary.md");
    const notes = readText("data/analysis/432_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/432_phase9_assurance_contract_matrix.csv");

    expect(summary).toContain("Contract count: 16");
    expect(summary).toContain("Completeness verdict: complete");
    expect(notes).toContain("Evidence graph invariant");
    expect(notes).toContain("Compatibility invariant");
    expect(matrix).toContain("contractName,requiredFieldCount,optionalFieldCount");
    expect(matrix).toContain("AssuranceGraphCompletenessVerdict");
  });

  it("documents that no Phase 8 to Phase 9 contract-name gap artifact is required", () => {
    const indexText = readText("packages/domains/analytics_assurance/src/index.ts");
    const contractSource = readText(
      "packages/domains/analytics_assurance/src/phase9-assurance-ledger-contracts.ts",
    );
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_432_ASSURANCE_CONTRACT_NAMES.json",
    );

    expect(indexText).toContain("phase9-assurance-ledger-contracts");
    for (const contractName of REQUIRED_PHASE9_ASSURANCE_CONTRACTS) {
      expect(contractSource).toContain(contractName);
    }
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
