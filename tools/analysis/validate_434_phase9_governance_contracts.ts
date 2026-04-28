import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_GOVERNANCE_CONTRACT_VERSION,
  REQUIRED_PHASE9_GOVERNANCE_CONTRACTS,
  createPhase9GovernanceControlFixture,
  dispositionBlockReasonValues,
  phase9GovernanceContractDefinitions,
  validateGovernanceContractDefinitionCoverage,
  validateGovernanceContractObject,
  validateIncidentReportabilityEvidence,
  validateRecoveryEvidenceWriteback,
  type Phase9GovernanceContractDefinition,
  type Phase9GovernanceControlFixture,
} from "../../packages/domains/analytics_assurance/src/phase9-governance-control-contracts.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-governance-control-contracts.ts",
  "data/contracts/434_phase9_governance_control_contracts.json",
  "data/fixtures/434_phase9_governance_control_fixtures.json",
  "data/analysis/434_phase9_governance_contract_summary.md",
  "data/analysis/434_algorithm_alignment_notes.md",
  "data/analysis/434_governance_contract_matrix.csv",
  "tools/test/run_phase9_governance_contracts.ts",
  "tools/analysis/validate_434_phase9_governance_contracts.ts",
  "tests/unit/434_governance_control_contracts.spec.ts",
  "tests/integration/434_governance_contract_artifacts.spec.ts",
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
  packageJson.scripts?.["test:phase9:governance-contracts"] ===
    "pnpm exec tsx ./tools/test/run_phase9_governance_contracts.ts && pnpm exec vitest run tests/unit/434_governance_control_contracts.spec.ts tests/integration/434_governance_contract_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:governance-contracts",
);
assert(
  packageJson.scripts?.["validate:434-phase9-governance-contracts"] ===
    "pnpm exec tsx ./tools/analysis/validate_434_phase9_governance_contracts.ts",
  "PACKAGE_SCRIPT_MISSING:validate:434-phase9-governance-contracts",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_434_/m.test(checklist), "CHECKLIST_TASK_434_NOT_CLAIMED_OR_COMPLETE");

const phase8ExitPacket = readJson<{ verdict?: string; phase?: number }>("data/contracts/431_phase8_exit_packet.json");
assert(phase8ExitPacket.phase === 8, "PHASE8_EXIT_PACKET_PHASE_DRIFT");
assert(phase8ExitPacket.verdict === "approved_for_phase9", "PHASE8_EXIT_PACKET_NOT_APPROVED");
assert(
  readJson<{ schemaVersion?: string }>("data/contracts/432_phase9_assurance_ledger_contracts.json").schemaVersion ===
    "432.phase9.assurance-ledger-contracts.v1",
  "PHASE9_ASSURANCE_CONTRACTS_MISSING_OR_DRIFTED",
);
assert(
  readJson<{ schemaVersion?: string }>("data/contracts/433_phase9_operational_projection_contracts.json")
    .schemaVersion === "433.phase9.operational-projection-contracts.v1",
  "PHASE9_OPERATIONAL_CONTRACTS_MISSING_OR_DRIFTED",
);

const coverage = validateGovernanceContractDefinitionCoverage(phase9GovernanceContractDefinitions);
assert(coverage.valid, `GOVERNANCE_CONTRACT_COVERAGE_FAILED:${coverage.errors.join(";")}`);

const contractArtifact = readJson<{
  schemaVersion?: string;
  contracts?: Phase9GovernanceContractDefinition[];
  requiredInvariants?: string[];
  dispositionBlockReasonValues?: readonly string[];
  sourceAlgorithmRefs?: readonly string[];
  downstreamReadiness?: Record<string, string>;
}>("data/contracts/434_phase9_governance_control_contracts.json");
assert(contractArtifact.schemaVersion === PHASE9_GOVERNANCE_CONTRACT_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
assert(contractArtifact.contracts?.length === REQUIRED_PHASE9_GOVERNANCE_CONTRACTS.length, "CONTRACT_COUNT_DRIFT");
assert(contractArtifact.requiredInvariants?.length === 10, "REQUIRED_INVARIANT_COUNT_DRIFT");
for (const reason of dispositionBlockReasonValues) {
  assert(contractArtifact.dispositionBlockReasonValues?.includes(reason), `DISPOSITION_REASON_MISSING:${reason}`);
}
for (const sourceRef of ["#9E", "#9F", "#9G", "#9H", "OperationalReadinessSnapshot", "AdminActionSettlement"]) {
  assert(
    contractArtifact.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const downstreamTask of ["435", "436", "437", "441", "442"]) {
  assert(contractArtifact.downstreamReadiness?.[downstreamTask], `DOWNSTREAM_READINESS_MISSING:${downstreamTask}`);
}

const artifactNames = new Set((contractArtifact.contracts ?? []).map((definition) => definition.contractName));
for (const requiredName of REQUIRED_PHASE9_GOVERNANCE_CONTRACTS) {
  assert(artifactNames.has(requiredName), `CONTRACT_ARTIFACT_MISSING:${requiredName}`);
}

const fixture = readJson<Phase9GovernanceControlFixture>(
  "data/fixtures/434_phase9_governance_control_fixtures.json",
);
const recomputed = createPhase9GovernanceControlFixture();
assert(fixture.schemaVersion === PHASE9_GOVERNANCE_CONTRACT_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(fixture.contractSetHash === recomputed.contractSetHash, "FIXTURE_CONTRACT_SET_HASH_DRIFT");
assert(
  fixture.dispositionAssessment.assessmentHash === recomputed.dispositionAssessment.assessmentHash,
  "FIXTURE_DISPOSITION_ASSESSMENT_DRIFT",
);
assert(fixture.dispositionAssessment.eligibilityState === "blocked", "FIXTURE_DISPOSITION_NOT_BLOCKED");
assert(
  fixture.dispositionAssessment.blockingReasonRefs.includes("transitive_legal_hold"),
  "FIXTURE_TRANSITIVE_LEGAL_HOLD_MISSING",
);

for (const contractName of REQUIRED_PHASE9_GOVERNANCE_CONTRACTS) {
  const example = fixture.examples[contractName];
  assert(example, `FIXTURE_EXAMPLE_MISSING:${contractName}`);
  const validation = validateGovernanceContractObject(contractName, example);
  assert(validation.valid, `FIXTURE_EXAMPLE_INVALID:${contractName}:${validation.errors.join(";")}`);
}

assert(
  validateRecoveryEvidenceWriteback(fixture.examples.RecoveryEvidenceWriteback).valid,
  "RECOVERY_EVIDENCE_WRITEBACK_FIXTURE_INVALID",
);
assert(
  validateIncidentReportabilityEvidence(fixture.examples.IncidentRecord, fixture.examples.ReportabilityAssessment, [
    fixture.examples.IncidentTimelineEntry,
  ]).valid,
  "INCIDENT_REPORTABILITY_FIXTURE_INVALID",
);

const gapPath = "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_434_GOVERNANCE_CONTRACTS.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_GOVERNANCE_CONTRACT_GAP");

const sourceText = readText("packages/domains/analytics_assurance/src/phase9-governance-control-contracts.ts");
for (const token of [
  "RetentionLifecycleBinding",
  "DispositionEligibilityAssessment",
  "resolveTransitiveArtifactDependencies",
  "validateImmutableConfigCannotMutateInPlace",
  "validateIncidentReportabilityEvidence",
  "validateRecoveryEvidenceWriteback",
  "validateGovernanceTenantIsolation",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/434_phase9_governance_contract_summary.md");
for (const token of [
  "Schema version: 434.phase9.governance-control-contracts.v1",
  "Contract count: 32",
  "Disposition assessment state: blocked",
  "Frozen Families",
]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}

const notes = readText("data/analysis/434_algorithm_alignment_notes.md");
for (const token of ["Retention lifecycle", "Legal hold", "Resilience contracts", "Incident contracts", "Tenant governance"]) {
  assert(notes.includes(token), `NOTES_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/434_governance_control_contracts.spec.ts")}\n${readText(
  "tests/integration/434_governance_contract_artifacts.spec.ts",
)}`;
for (const token of [
  "disposition without assessment",
  "dependency cycle",
  "legal hold blocks disposition transitively",
  "immutable config cannot be mutated in place",
  "version hash",
  "reportability requires audit",
  "recovery evidence missing graph ref",
  "missing owner or scope",
  "override without expiry",
  "cross-tenant reference",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

console.log("434 phase9 governance contracts validated.");
