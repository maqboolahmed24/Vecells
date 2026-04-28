import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  createPhase9AssurancePackFactoryFixture,
  type Phase9AssurancePackFactoryFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-assurance-pack-factory.ts",
  "data/contracts/440_phase9_assurance_pack_factory_contract.json",
  "data/fixtures/440_phase9_assurance_pack_factory_fixtures.json",
  "data/analysis/440_phase9_assurance_pack_factory_summary.md",
  "data/analysis/440_algorithm_alignment_notes.md",
  "data/analysis/440_assurance_pack_framework_matrix.csv",
  "tools/test/run_phase9_assurance_pack_factory.ts",
  "tools/analysis/validate_440_phase9_assurance_pack_factory.ts",
  "tests/unit/440_assurance_pack_factory.spec.ts",
  "tests/integration/440_assurance_pack_factory_artifacts.spec.ts",
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
  packageJson.scripts?.["test:phase9:assurance-pack-factory"] ===
    "pnpm exec tsx ./tools/test/run_phase9_assurance_pack_factory.ts && pnpm exec vitest run tests/unit/440_assurance_pack_factory.spec.ts tests/integration/440_assurance_pack_factory_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:assurance-pack-factory",
);
assert(
  packageJson.scripts?.["validate:440-phase9-assurance-pack-factory"] ===
    "pnpm exec tsx ./tools/analysis/validate_440_phase9_assurance_pack_factory.ts",
  "PACKAGE_SCRIPT_MISSING:validate:440-phase9-assurance-pack-factory",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_440_/m.test(checklist), "CHECKLIST_TASK_440_NOT_CLAIMED_OR_COMPLETE");

for (const [relativePath, version] of [
  ["data/contracts/431_phase8_exit_packet.json", undefined],
  ["data/contracts/432_phase9_assurance_ledger_contracts.json", "432.phase9.assurance-ledger-contracts.v1"],
  ["data/contracts/433_phase9_operational_projection_contracts.json", "433.phase9.operational-projection-contracts.v1"],
  ["data/contracts/434_phase9_governance_control_contracts.json", "434.phase9.governance-control-contracts.v1"],
  ["data/contracts/435_phase9_assurance_ingest_service_contract.json", "435.phase9.assurance-ingest-service.v1"],
  ["data/contracts/436_phase9_graph_verdict_engine_contract.json", "436.phase9.graph-verdict-engine.v1"],
  ["data/contracts/439_phase9_investigation_timeline_service_contract.json", "439.phase9.investigation-timeline-service.v1"],
] as const) {
  assert(fs.existsSync(path.join(root, relativePath)), `UPSTREAM_ARTIFACT_MISSING:${relativePath}`);
  if (version) {
    assert(readJson<{ schemaVersion?: string }>(relativePath).schemaVersion === version, `UPSTREAM_VERSION_DRIFT:${relativePath}`);
  }
}

const contract = readJson<{
  schemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  frameworkCodes?: readonly string[];
  producedObjects?: readonly string[];
  requiredHashes?: readonly string[];
  deterministicReplay?: {
    baselinePackVersionHash?: string;
    changedTemplatePackVersionHash?: string;
  };
  failClosedCases?: Record<string, string>;
  actionSettlementSurface?: Record<string, string>;
  noGapArtifactRequired?: boolean;
}>("data/contracts/440_phase9_assurance_pack_factory_contract.json");

assert(contract.schemaVersion === PHASE9_ASSURANCE_PACK_FACTORY_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
for (const sourceRef of ["#9D", "#9A", "#9C", "#9E", "431_phase8_exit_packet", "439_phase9_investigation"]) {
  assert(contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)), `SOURCE_REF_MISSING:${sourceRef}`);
}
for (const framework of ["DSPT", "DTAC", "DCB0129", "DCB0160", "NHS_APP_CHANNEL", "IM1_CHANGE", "LOCAL_TENANT"]) {
  assert(contract.frameworkCodes?.includes(framework), `FRAMEWORK_CODE_MISSING:${framework}`);
}
for (const objectName of [
  "StandardsVersionMap",
  "AssuranceControlRecord",
  "FrameworkPackGenerator",
  "MonthlyAssurancePack",
  "ContinuityEvidencePackSection",
  "GeneratedAssurancePack",
  "EvidenceGapRecord",
  "AssurancePackActionRecord",
  "AssurancePackSettlement",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const hashName of [
  "evidenceSetHash",
  "continuitySetHash",
  "queryPlanHash",
  "renderTemplateHash",
  "redactionPolicyHash",
  "graphHash",
  "serializedArtifactHash",
  "exportManifestHash",
  "reproductionHash",
  "packVersionHash",
]) {
  assert(contract.requiredHashes?.includes(hashName), `HASH_FIELD_MISSING:${hashName}`);
}
assert(
  contract.deterministicReplay?.baselinePackVersionHash !== contract.deterministicReplay?.changedTemplatePackVersionHash,
  "RENDER_TEMPLATE_CHANGE_DID_NOT_CHANGE_PACK_VERSION_HASH",
);
for (const [caseName, state] of Object.entries(contract.failClosedCases ?? {})) {
  assert(
    ["blocked_graph", "blocked_trust", "stale_pack", "denied_scope"].includes(state),
    `FAIL_CLOSED_CASE_NOT_BLOCKED:${caseName}:${state}`,
  );
}
assert(contract.actionSettlementSurface?.signoffResult === "signed_off", "SIGNOFF_SETTLEMENT_MISSING");
assert(contract.actionSettlementSurface?.exportReadyResult === "export_ready", "EXPORT_READY_SETTLEMENT_MISSING");
assert(contract.noGapArtifactRequired === true, "GAP_ARTIFACT_POSTURE_MISSING");

const fixture = readJson<Phase9AssurancePackFactoryFixture>("data/fixtures/440_phase9_assurance_pack_factory_fixtures.json");
const recomputed = createPhase9AssurancePackFactoryFixture();
assert(fixture.schemaVersion === PHASE9_ASSURANCE_PACK_FACTORY_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(fixture.baselineResult.pack.packVersionHash === recomputed.baselineResult.pack.packVersionHash, "PACK_VERSION_HASH_DRIFT");
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(fixture.baselineResult.pack.packState === "ready_for_attestation", "BASELINE_PACK_NOT_READY");
assert(fixture.baselineResult.pack.retentionLifecycleBindingRef !== "retention-binding:missing", "RETENTION_BINDING_MISSING");
assert(fixture.baselineResult.continuitySections.length > 0, "CONTINUITY_SECTION_MISSING");
assert(fixture.dryRunResult.persisted === false, "DRY_RUN_PERSISTED");
assert(fixture.reproductionSettlement.reproductionState === "exact", "REPRODUCTION_NOT_EXACT");

const gapPath = "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_440_ASSURANCE_PACK_FACTORY.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_ASSURANCE_PACK_FACTORY_GAP");

const sourceText = readText("packages/domains/analytics_assurance/src/phase9-assurance-pack-factory.ts");
for (const token of [
  "Phase9AssurancePackFactory",
  "StandardsVersionMap",
  "AssuranceControlRecord",
  "FrameworkPackGenerator",
  "MonthlyAssurancePack",
  "ContinuityEvidencePackSection",
  "AssurancePackActionRecord",
  "AssurancePackSettlement",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/440_assurance_pack_factory.spec.ts")}\n${readText(
  "tests/integration/440_assurance_pack_factory_artifacts.spec.ts",
)}`;
for (const token of [
  "same inputs produce identical pack hashes",
  "graph verdict missing blocks pack",
  "stale evidence blocks or marks stale according to framework policy",
  "missing redaction policy blocks export-ready state",
  "ambiguous standards version blocks generation",
  "wrong tenant evidence denied",
  "superseded evidence not used as current",
  "continuity section required and missing -> blocked",
  "generated artifact has retention lifecycle binding",
  "dry-run does not persist authoritative pack",
  "reproduction from hashes succeeds",
  "render template version change changes pack version hash",
  "preview/export uses artifact presentation policy",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/440_phase9_assurance_pack_factory_summary.md");
for (const token of ["Schema version", "Framework mappings", "Pack version hash", "Evidence set hash"]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}
const matrix = readText("data/analysis/440_assurance_pack_framework_matrix.csv");
assert(matrix.includes("DSPT"), "MATRIX_DSPT_MISSING");
assert(matrix.includes("NHS_APP_CHANNEL"), "MATRIX_NHS_APP_MISSING");

console.log("440 phase9 assurance pack factory validated.");
