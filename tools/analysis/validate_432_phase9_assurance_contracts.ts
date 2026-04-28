import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_ASSURANCE_CONTRACT_VERSION,
  REQUIRED_PHASE9_ASSURANCE_CONTRACTS,
  assertGraphCompletenessRequiredForConsumer,
  assertNoParallelEvidenceListWhenGraphAvailable,
  createPhase9AssuranceContractFixture,
  phase9AssuranceContractDefinitions,
  validateContractDefinitionCoverage,
  validateContractObject,
  validateLedgerPreviousHashContinuity,
  type AssuranceEvidenceGraphSnapshot,
  type AssuranceGraphCompletenessVerdict,
  type AssuranceLedgerEntry,
  type Phase9AssuranceContractDefinition,
  type Phase9AssuranceContractFixture,
} from "../../packages/domains/analytics_assurance/src/phase9-assurance-ledger-contracts.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-assurance-ledger-contracts.ts",
  "data/contracts/432_phase9_assurance_ledger_contracts.json",
  "data/fixtures/432_phase9_assurance_contract_fixtures.json",
  "data/analysis/432_phase9_assurance_contract_summary.md",
  "data/analysis/432_algorithm_alignment_notes.md",
  "data/analysis/432_phase9_assurance_contract_matrix.csv",
  "tools/test/run_phase9_assurance_contracts.ts",
  "tools/analysis/validate_432_phase9_assurance_contracts.ts",
  "tests/unit/432_assurance_contract_invariants.spec.ts",
  "tests/integration/432_assurance_contract_artifacts.spec.ts",
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
  packageJson.scripts?.["test:phase9:assurance-contracts"] ===
    "pnpm exec tsx ./tools/test/run_phase9_assurance_contracts.ts && pnpm exec vitest run tests/unit/432_assurance_contract_invariants.spec.ts tests/integration/432_assurance_contract_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:assurance-contracts",
);
assert(
  packageJson.scripts?.["validate:432-phase9-assurance-contracts"] ===
    "pnpm exec tsx ./tools/analysis/validate_432_phase9_assurance_contracts.ts",
  "PACKAGE_SCRIPT_MISSING:validate:432-phase9-assurance-contracts",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_432_/m.test(checklist), "CHECKLIST_TASK_432_NOT_CLAIMED_OR_COMPLETE");

const phase8ExitPacket = readJson<{ verdict?: string; phase?: number }>("data/contracts/431_phase8_exit_packet.json");
assert(phase8ExitPacket.phase === 8, "PHASE8_EXIT_PACKET_PHASE_DRIFT");
assert(phase8ExitPacket.verdict === "approved_for_phase9", "PHASE8_EXIT_PACKET_NOT_APPROVED");

const coverage = validateContractDefinitionCoverage(phase9AssuranceContractDefinitions);
assert(coverage.valid, `CONTRACT_DEFINITION_COVERAGE_FAILED:${coverage.errors.join(";")}`);

const contractArtifact = readJson<{
  schemaVersion?: string;
  contractSetHash?: string;
  contracts?: Phase9AssuranceContractDefinition[];
  requiredInvariants?: string[];
  canonicalizationRule?: Record<string, string>;
  downstreamReadiness?: Record<string, string>;
}>("data/contracts/432_phase9_assurance_ledger_contracts.json");
assert(contractArtifact.schemaVersion === PHASE9_ASSURANCE_CONTRACT_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
assert(contractArtifact.contracts?.length === REQUIRED_PHASE9_ASSURANCE_CONTRACTS.length, "CONTRACT_COUNT_DRIFT");
assert(contractArtifact.requiredInvariants?.length === 10, "REQUIRED_INVARIANT_COUNT_DRIFT");
assert(contractArtifact.canonicalizationRule?.hashAlgorithm === "SHA-256 hex", "CANONICAL_HASH_RULE_MISSING");
assert(
  contractArtifact.canonicalizationRule?.arrayOrdering?.includes("arrays preserve source order"),
  "ARRAY_ORDERING_RULE_MISSING",
);
for (const downstreamTask of ["435", "436", "437", "439", "440", "441", "442"]) {
  assert(contractArtifact.downstreamReadiness?.[downstreamTask], `DOWNSTREAM_READINESS_MISSING:${downstreamTask}`);
}

const artifactNames = new Set((contractArtifact.contracts ?? []).map((definition) => definition.contractName));
for (const requiredName of REQUIRED_PHASE9_ASSURANCE_CONTRACTS) {
  assert(artifactNames.has(requiredName), `CONTRACT_ARTIFACT_MISSING:${requiredName}`);
}

const fixture = readJson<Phase9AssuranceContractFixture>("data/fixtures/432_phase9_assurance_contract_fixtures.json");
const recomputed = createPhase9AssuranceContractFixture();
assert(fixture.schemaVersion === PHASE9_ASSURANCE_CONTRACT_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(fixture.contractSetHash === recomputed.contractSetHash, "FIXTURE_CONTRACT_SET_HASH_DRIFT");
assert(fixture.graphSnapshot.graphHash === recomputed.graphSnapshot.graphHash, "FIXTURE_GRAPH_HASH_DRIFT");
assert(fixture.graphCompletenessVerdict.verdictState === "complete", "FIXTURE_GRAPH_VERDICT_NOT_COMPLETE");
assert(fixture.ledgerEntries.length >= 2, "FIXTURE_LEDGER_ENTRIES_TOO_SMALL");
assert(validateLedgerPreviousHashContinuity(fixture.ledgerEntries as readonly AssuranceLedgerEntry[]).valid, "LEDGER_CONTINUITY_FAILED");

for (const contractName of REQUIRED_PHASE9_ASSURANCE_CONTRACTS) {
  const example = fixture.examples[contractName];
  assert(example, `FIXTURE_EXAMPLE_MISSING:${contractName}`);
  const validation = validateContractObject(contractName, example);
  assert(validation.valid, `FIXTURE_EXAMPLE_INVALID:${contractName}:${validation.errors.join(";")}`);
}

assertGraphCompletenessRequiredForConsumer(
  "pack_export",
  fixture.graphSnapshot as AssuranceEvidenceGraphSnapshot,
  fixture.graphCompletenessVerdict as AssuranceGraphCompletenessVerdict,
);
assertNoParallelEvidenceListWhenGraphAvailable(fixture.graphSnapshot as AssuranceEvidenceGraphSnapshot, []);

const contractText = readText("packages/domains/analytics_assurance/src/phase9-assurance-ledger-contracts.ts");
for (const token of [
  "replayDecisionClass",
  "effectKeyRef",
  "sourceBoundedContextRef",
  "governingBoundedContextRef",
  "trustLowerBound >= 0.88",
  "PARALLEL_LOCAL_EVIDENCE_LIST_FORBIDDEN",
]) {
  assert(contractText.includes(token), `CONTRACT_SOURCE_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/432_phase9_assurance_contract_summary.md");
for (const token of [
  "Schema version: 432.phase9.assurance-ledger-contracts.v1",
  "Completeness verdict: complete",
  "AssuranceLedgerEntry",
  "AssuranceGraphCompletenessVerdict",
]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}

const notes = readText("data/analysis/432_algorithm_alignment_notes.md");
for (const token of ["Canonicalization rule", "Ledger invariant", "Evidence graph invariant", "Trust invariant"]) {
  assert(notes.includes(token), `NOTES_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/432_assurance_contract_invariants.spec.ts")}\n${readText(
  "tests/integration/432_assurance_contract_artifacts.spec.ts",
)}`;
for (const token of [
  "missing required",
  "invalid enum",
  "cross-tenant",
  "missing evidence",
  "mutation after seal",
  "hash determinism",
  "previous-hash continuity",
  "unsupported schema",
  "bypass graph verdict",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

console.log("432 phase9 assurance contracts validated.");
