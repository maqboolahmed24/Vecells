import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
  createPhase9RetentionLifecycleEngineFixture,
  type RetentionLifecycleEngineFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-retention-lifecycle-engine.ts",
  "data/contracts/442_phase9_retention_lifecycle_engine_contract.json",
  "data/fixtures/442_phase9_retention_lifecycle_engine_fixtures.json",
  "data/analysis/442_phase9_retention_lifecycle_engine_summary.md",
  "data/analysis/442_algorithm_alignment_notes.md",
  "data/analysis/442_retention_lifecycle_blocking_matrix.csv",
  "tools/test/run_phase9_retention_lifecycle_engine.ts",
  "tools/analysis/validate_442_phase9_retention_lifecycle_engine.ts",
  "tests/unit/442_retention_lifecycle_engine.spec.ts",
  "tests/integration/442_retention_lifecycle_engine_artifacts.spec.ts",
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
  packageJson.scripts?.["test:phase9:retention-lifecycle-engine"] ===
    "pnpm exec tsx ./tools/test/run_phase9_retention_lifecycle_engine.ts && pnpm exec vitest run tests/unit/442_retention_lifecycle_engine.spec.ts tests/integration/442_retention_lifecycle_engine_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:retention-lifecycle-engine",
);
assert(
  packageJson.scripts?.["validate:442-phase9-retention-lifecycle-engine"] ===
    "pnpm exec tsx ./tools/analysis/validate_442_phase9_retention_lifecycle_engine.ts",
  "PACKAGE_SCRIPT_MISSING:validate:442-phase9-retention-lifecycle-engine",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_442_/m.test(checklist), "CHECKLIST_TASK_442_NOT_CLAIMED_OR_COMPLETE");

for (const [relativePath, version] of [
  ["data/contracts/434_phase9_governance_control_contracts.json", "434.phase9.governance-control-contracts.v1"],
  ["data/contracts/435_phase9_assurance_ingest_service_contract.json", "435.phase9.assurance-ingest-service.v1"],
  ["data/contracts/436_phase9_graph_verdict_engine_contract.json", "436.phase9.graph-verdict-engine.v1"],
  ["data/contracts/440_phase9_assurance_pack_factory_contract.json", "440.phase9.assurance-pack-factory.v1"],
  ["data/contracts/441_phase9_capa_attestation_workflow_contract.json", "441.phase9.capa-attestation-workflow.v1"],
] as const) {
  assert(fs.existsSync(path.join(root, relativePath)), `UPSTREAM_ARTIFACT_MISSING:${relativePath}`);
  assert(readJson<{ schemaVersion?: string }>(relativePath).schemaVersion === version, `UPSTREAM_VERSION_DRIFT:${relativePath}`);
}

const contract = readJson<{
  schemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  producedObjects?: readonly string[];
  apiSurface?: readonly string[];
  dispositionResults?: Record<string, string>;
  requiredBlockers?: Record<string, readonly string[]>;
  deterministicReplay?: {
    replayHash?: string;
    baselineDecisionHash?: string;
    deterministicDecisionReplayHash?: string;
  };
  auditCoverage?: Record<string, number>;
  noGapArtifactRequired?: boolean;
}>("data/contracts/442_phase9_retention_lifecycle_engine_contract.json");

assert(contract.schemaVersion === PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
for (const sourceRef of [
  "#9E",
  "#9A",
  "#9C",
  "#9D",
  "phase-0-the-foundation-protocol",
  "434_phase9_governance",
  "440_phase9_assurance_pack",
  "441_phase9_capa_attestation",
]) {
  assert(contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)), `SOURCE_REF_MISSING:${sourceRef}`);
}
for (const objectName of [
  "RetentionClass",
  "RetentionLifecycleBinding",
  "RetentionDecision",
  "ArtifactDependencyLink",
  "LegalHoldScopeManifest",
  "LegalHoldRecord",
  "DispositionEligibilityAssessment",
  "DispositionEligibilityAssessmentRecord",
  "RetentionLifecycleAuditRecord",
  "RetentionLifecycleEvidenceRecord",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const methodName of [
  "createRetentionClass",
  "supersedeRetentionClass",
  "bindLifecycleForArtifact",
  "deriveRetentionDecision",
  "placeLegalHold",
  "releaseLegalHold",
  "createDependencyLink",
  "deriveDependencyLinksFromGraph",
  "runDispositionEligibilityAssessment",
  "emitLifecycleEvidenceForAssuranceGraph",
]) {
  assert(contract.apiSurface?.includes(methodName), `API_SURFACE_MISSING:${methodName}`);
}
assert(contract.dispositionResults?.artifactCreation === "bound", "ARTIFACT_CREATION_NOT_BOUND");
assert(contract.dispositionResults?.missingRetentionClass === "quarantined", "MISSING_RETENTION_CLASS_NOT_QUARANTINED");
assert(contract.dispositionResults?.notDue === "not_due", "NOT_DUE_ASSESSMENT_MISSING");
for (const caseName of [
  "legalHold",
  "transitiveDependency",
  "dependencyCycle",
  "wormHashChained",
  "replayCritical",
  "assurancePackDependency",
  "missingGraphVerdict",
  "rawStorageScan",
]) {
  assert(contract.dispositionResults?.[caseName] === "blocked", `BLOCKED_CASE_NOT_BLOCKED:${caseName}`);
  assert((contract.requiredBlockers?.[caseName] ?? []).length > 0, `BLOCKERS_MISSING:${caseName}`);
}
assert(
  contract.deterministicReplay?.baselineDecisionHash === contract.deterministicReplay?.deterministicDecisionReplayHash,
  "RETENTION_DECISION_HASH_DRIFT",
);
for (const [name, count] of Object.entries(contract.auditCoverage ?? {})) {
  assert(count > 0, `AUDIT_COVERAGE_MISSING:${name}`);
}
assert(contract.noGapArtifactRequired === true, "GAP_ARTIFACT_POSTURE_MISSING");

const fixture = readJson<RetentionLifecycleEngineFixture>(
  "data/fixtures/442_phase9_retention_lifecycle_engine_fixtures.json",
);
const recomputed = createPhase9RetentionLifecycleEngineFixture();
assert(fixture.schemaVersion === PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(fixture.artifactCreationResult.binding?.retentionLifecycleBindingId, "LIFECYCLE_BINDING_MISSING");
assert(fixture.missingRetentionClassResult.result === "quarantined", "MISSING_RETENTION_CLASS_FIXTURE_NOT_QUARANTINED");
assert(fixture.baselineDecision.decisionHash === fixture.deterministicDecisionReplay.decisionHash, "DECISION_HASH_NOT_DETERMINISTIC");
assert(fixture.notDueAssessment.result === "not_due", "MINIMUM_RETENTION_NOT_DUE_MISSING");
assert(fixture.legalHoldBlockedAssessment.result === "blocked", "LEGAL_HOLD_NOT_BLOCKING");
assert(fixture.releasedLegalHoldResult.legalHold.supersedesHoldRef === fixture.legalHoldResult.legalHold.legalHoldRecordId, "LEGAL_HOLD_RELEASE_LINEAGE_MISSING");
assert(fixture.reassessmentAfterRelease.result === "eligible", "RELEASED_HOLD_REASSESSMENT_NOT_ELIGIBLE");
assert(fixture.transitiveDependencyAssessment.result === "blocked", "TRANSITIVE_DEPENDENCY_NOT_BLOCKING");
assert(fixture.dependencyCycleAssessment.blockerRefs.some((ref) => ref.includes("dependency:cycle")), "DEPENDENCY_CYCLE_NOT_RECORDED");
assert(fixture.wormHashChainedAssessment.result === "blocked", "WORM_HASH_CHAINED_NOT_BLOCKED");
assert(fixture.replayCriticalAssessment.result === "blocked", "REPLAY_CRITICAL_NOT_BLOCKED");
assert(fixture.assurancePackDependencyAssessment.result === "blocked", "ASSURANCE_PACK_DEPENDENCY_NOT_BLOCKED");
assert(fixture.missingGraphVerdictAssessment.result === "blocked", "MISSING_GRAPH_VERDICT_NOT_BLOCKED");
assert(fixture.crossTenantDependencyErrorCode === "CROSS_TENANT_DEPENDENCY_DENIED", "CROSS_TENANT_DEPENDENCY_NOT_DENIED");
assert(fixture.supersededRetentionClass.classState === "superseded", "RETENTION_CLASS_NOT_SUPERSEDED");
assert(
  fixture.oldDecisionAfterSupersession.retentionClassRef !== fixture.newDecisionAfterSupersession.retentionClassRef,
  "SUPERSEDED_CLASS_DECISION_LINEAGE_MISSING",
);
assert(fixture.rawStorageScanAssessment.result === "blocked", "RAW_STORAGE_SCAN_NOT_BLOCKED");
assert(fixture.lifecycleEvidenceRecord.lifecycleEvidenceHash.length === 64, "LIFECYCLE_EVIDENCE_HASH_INVALID");

const gapPath = "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_442_RETENTION_LIFECYCLE_ENGINE.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_RETENTION_LIFECYCLE_GAP");

const sourceText = readText("packages/domains/analytics_assurance/src/phase9-retention-lifecycle-engine.ts");
for (const token of [
  "Phase9RetentionLifecycleEngine",
  "RetentionClass",
  "RetentionLifecycleBinding",
  "RetentionDecision",
  "ArtifactDependencyLink",
  "LegalHoldScopeManifest",
  "LegalHoldRecord",
  "DispositionEligibilityAssessment",
  "raw_storage_scan",
  "CROSS_TENANT_DEPENDENCY_DENIED",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/442_retention_lifecycle_engine.spec.ts")}\n${readText(
  "tests/integration/442_retention_lifecycle_engine_artifacts.spec.ts",
)}`;
for (const token of [
  "artifact creation creates lifecycle binding",
  "missing retention class blocks artifact creation or quarantines according to source policy",
  "retention decision hash deterministic",
  "minimum retention not reached -> not due",
  "legal hold blocks disposition",
  "released legal hold allows reassessment but preserves lineage",
  "transitive dependency blocks disposition",
  "dependency cycle handled safely",
  "WORM/hash-chained artifact not delete-eligible",
  "replay-critical artifact blocks delete",
  "assurance pack dependency blocks delete",
  "graph verdict missing blocks assessment",
  "cross-tenant dependency denied",
  "superseded retention class preserves old decisions and allows new decisions",
  "no raw storage scan can mark artifact delete-ready",
  "audit records emitted for hold and assessment actions",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/442_phase9_retention_lifecycle_engine_summary.md");
for (const token of ["Schema version", "Retention classes", "Baseline decision hash", "Replay hash"]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}
const matrix = readText("data/analysis/442_retention_lifecycle_blocking_matrix.csv");
assert(matrix.includes("legal_hold"), "MATRIX_LEGAL_HOLD_MISSING");
assert(matrix.includes("raw_storage_scan"), "MATRIX_RAW_STORAGE_SCAN_MISSING");

console.log("442 phase9 retention lifecycle engine validated.");
