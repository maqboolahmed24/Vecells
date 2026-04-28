import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_GOVERNANCE_CONTRACT_VERSION,
  createPhase9GovernanceControlFixture,
  phase9GovernanceAlgorithmAlignmentNotes,
  phase9GovernanceContractDefinitions,
  phase9GovernanceContractMatrixToCsv,
  summarizePhase9GovernanceContractFreeze,
  validateGovernanceContractDefinitionCoverage,
} from "../../packages/domains/analytics_assurance/src/phase9-governance-control-contracts.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "434_phase9_governance_control_contracts.json");
const fixturePath = path.join(fixturesDir, "434_phase9_governance_control_fixtures.json");
const summaryPath = path.join(analysisDir, "434_phase9_governance_contract_summary.md");
const notesPath = path.join(analysisDir, "434_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "434_governance_contract_matrix.csv");

const coverage = validateGovernanceContractDefinitionCoverage();
if (!coverage.valid) {
  throw new Error(`Phase 9 governance contract coverage failed: ${coverage.errors.join("; ")}`);
}

const fixture = createPhase9GovernanceControlFixture();
const contractArtifact = {
  schemaVersion: PHASE9_GOVERNANCE_CONTRACT_VERSION,
  sourceAlgorithmRefs: [
    "blueprint/phase-9-the-assurance-ledger.md#9E",
    "blueprint/phase-9-the-assurance-ledger.md#9F",
    "blueprint/phase-9-the-assurance-ledger.md#9G",
    "blueprint/phase-9-the-assurance-ledger.md#9H",
    "blueprint/platform-runtime-and-release-blueprint.md#OperationalReadinessSnapshot",
    "blueprint/platform-admin-and-config-blueprint.md#AdminActionSettlement",
    "blueprint/phase-0-the-foundation-protocol.md#CompiledPolicyBundle",
  ],
  requiredInvariants: fixture.invariantCoverage,
  dispositionBlockReasonValues: [
    "active_retention_freeze",
    "active_legal_hold",
    "transitive_legal_hold",
    "active_dependency",
    "dependency_cycle",
    "graph_missing",
    "graph_incomplete",
    "worm_or_hash_chained",
    "replay_critical_dependency",
    "missing_explicit_assessment",
    "cross_tenant_reference",
  ],
  downstreamReadiness: fixture.downstreamReadiness,
  contractSetHash: fixture.contractSetHash,
  contracts: phase9GovernanceContractDefinitions,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, summarizePhase9GovernanceContractFreeze(fixture));
fs.writeFileSync(notesPath, phase9GovernanceAlgorithmAlignmentNotes());
fs.writeFileSync(matrixPath, phase9GovernanceContractMatrixToCsv());

console.log(`Phase 9 governance contracts: ${path.relative(root, contractPath)}`);
console.log(`Contract count: ${phase9GovernanceContractDefinitions.length}`);
console.log(`Contract set hash: ${fixture.contractSetHash}`);
console.log(`Disposition blockers: ${fixture.dispositionAssessment.blockingReasonRefs.join(", ")}`);
