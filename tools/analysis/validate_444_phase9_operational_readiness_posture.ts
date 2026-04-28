import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
  PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
  createPhase9OperationalReadinessPostureFixture,
  type Phase9OperationalReadinessPostureFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-operational-readiness-posture.ts",
  "data/contracts/444_phase9_operational_readiness_posture_contract.json",
  "data/fixtures/444_phase9_operational_readiness_posture_fixtures.json",
  "data/analysis/444_phase9_operational_readiness_posture_summary.md",
  "data/analysis/444_algorithm_alignment_notes.md",
  "data/analysis/444_recovery_control_posture_matrix.csv",
  "data/analysis/444_recovery_proof_debt.csv",
  "tools/test/run_phase9_operational_readiness_posture.ts",
  "tools/analysis/validate_444_phase9_operational_readiness_posture.ts",
  "tests/unit/444_operational_readiness_posture.spec.ts",
  "tests/integration/444_operational_readiness_posture_artifacts.spec.ts",
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
  packageJson.scripts?.["test:phase9:operational-readiness-posture"] ===
    "pnpm exec tsx ./tools/test/run_phase9_operational_readiness_posture.ts && pnpm exec vitest run tests/unit/444_operational_readiness_posture.spec.ts tests/integration/444_operational_readiness_posture_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:operational-readiness-posture",
);
assert(
  packageJson.scripts?.["validate:444-phase9-operational-readiness-posture"] ===
    "pnpm exec tsx ./tools/analysis/validate_444_phase9_operational_readiness_posture.ts",
  "PACKAGE_SCRIPT_MISSING:validate:444-phase9-operational-readiness-posture",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_444_/m.test(checklist), "CHECKLIST_TASK_444_NOT_CLAIMED_OR_COMPLETE");

for (const [relativePath, version] of [
  [
    "data/contracts/443_phase9_disposition_execution_engine_contract.json",
    PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
  ],
  [
    "data/contracts/434_phase9_governance_control_contracts.json",
    "434.phase9.governance-control-contracts.v1",
  ],
  [
    "data/contracts/436_phase9_graph_verdict_engine_contract.json",
    "436.phase9.graph-verdict-engine.v1",
  ],
] as const) {
  assert(fs.existsSync(path.join(root, relativePath)), `UPSTREAM_ARTIFACT_MISSING:${relativePath}`);
  assert(
    readJson<{ schemaVersion?: string }>(relativePath).schemaVersion === version,
    `UPSTREAM_VERSION_DRIFT:${relativePath}`,
  );
}

const contract = readJson<{
  schemaVersion?: string;
  upstreamDispositionSchemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  producedObjects?: readonly string[];
  apiSurface?: readonly string[];
  readinessAuthority?: Record<string, string | number>;
  postureDowngrades?: Record<string, string>;
  deterministicReplay?: Record<string, string | undefined>;
  noGapArtifactRequired?: boolean;
}>("data/contracts/444_phase9_operational_readiness_posture_contract.json");

assert(
  contract.schemaVersion === PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
  "CONTRACT_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamDispositionSchemaVersion === PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
  "UPSTREAM_DISPOSITION_SCHEMA_VERSION_DRIFT",
);
for (const sourceRef of [
  "#9F",
  "#9A",
  "#9B",
  "OperationalReadinessSnapshot",
  "RunbookBindingRecord",
  "443_phase9_disposition",
]) {
  assert(
    contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const objectName of [
  "EssentialFunctionMap",
  "RecoveryTier",
  "BackupSetManifest",
  "OperationalReadinessSnapshot",
  "RunbookBindingRecord",
  "RecoveryControlPosture",
  "RecoveryProofDebtRecord",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const methodName of [
  "listEssentialFunctions",
  "listRecoveryTiers",
  "getCurrentReadinessSnapshotByFunction",
  "getRunbookBindingState",
  "getBackupManifestFreshness",
  "getRecoveryControlPosture",
  "explainRecoveryControlBlockers",
  "listRecoveryProofDebt",
  "listWithCursor",
  "deriveDependencyOrder",
  "captureOperationalReadinessSnapshot",
  "deriveRecoveryControlPosture",
]) {
  assert(contract.apiSurface?.includes(methodName), `API_SURFACE_MISSING:${methodName}`);
}
assert(
  contract.readinessAuthority?.essentialFunctionCount === 10,
  "ESSENTIAL_FUNCTION_COUNT_INVALID",
);
assert(contract.readinessAuthority?.readySnapshotState === "ready", "READY_SNAPSHOT_NOT_READY");
assert(
  contract.readinessAuthority?.staleRunbookSnapshotState === "constrained",
  "STALE_RUNBOOK_SNAPSHOT_NOT_CONSTRAINED",
);
assert(contract.postureDowngrades?.live === "live_control", "LIVE_POSTURE_NOT_LIVE");
for (const caseName of [
  "stalePublication",
  "degradedTrust",
  "activeFreeze",
  "missingBackup",
  "missingRunbook",
  "staleEvidencePack",
  "missingJourneyProof",
  "partialDependency",
]) {
  assert(
    contract.postureDowngrades?.[caseName] !== "live_control",
    `POSTURE_NOT_DOWNGRADED:${caseName}`,
  );
}
assert(
  contract.deterministicReplay?.liveControlTupleHash ===
    contract.deterministicReplay?.deterministicReplayControlTupleHash,
  "POSTURE_REPLAY_HASH_DRIFT",
);
assert(
  contract.deterministicReplay?.tupleCompatibleRestoreDigest?.length === 64,
  "RESTORE_DIGEST_INVALID",
);
assert(contract.noGapArtifactRequired === true, "GAP_ARTIFACT_POSTURE_MISSING");

const fixture = readJson<Phase9OperationalReadinessPostureFixture>(
  "data/fixtures/444_phase9_operational_readiness_posture_fixtures.json",
);
const recomputed = createPhase9OperationalReadinessPostureFixture();
assert(
  fixture.schemaVersion === PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
  "FIXTURE_SCHEMA_VERSION_DRIFT",
);
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(fixture.essentialFunctions.length === 10, "ESSENTIAL_FUNCTION_MAP_INCOMPLETE");
assert(
  fixture.essentialFunctions.every((entry) => entry.supportingSystemRefs.length > 0),
  "FUNCTION_SYSTEMS_MISSING",
);
assert(
  fixture.recoveryTiers.every((tier) => tier.tierState === "active"),
  "RECOVERY_TIER_INCOMPLETE",
);
assert(fixture.dependencyOrderValidation.cycleDetected === false, "DEPENDENCY_ORDER_FALSE_CYCLE");
assert(fixture.dependencyCycleValidation.cycleDetected === true, "DEPENDENCY_CYCLE_NOT_DETECTED");
assert(
  fixture.backupManifests.every((manifest) => manifest.manifestState === "current"),
  "BACKUP_MANIFEST_NOT_CURRENT",
);
assert(fixture.readySnapshot.resilienceTupleHash.length === 64, "READINESS_TUPLE_HASH_INVALID");
assert(
  fixture.staleRunbookSnapshot.readinessState === "constrained",
  "STALE_RUNBOOK_NOT_CONSTRAINED",
);
assert(fixture.livePosture.postureState === "live_control", "LIVE_POSTURE_FIXTURE_INVALID");
assert(
  fixture.deterministicPostureReplay.controlTupleHash === fixture.livePosture.controlTupleHash,
  "DETERMINISTIC_POSTURE_REPLAY_DRIFT",
);
assert(
  fixture.missingBackupPosture.backupManifestState === "missing",
  "MISSING_BACKUP_STATE_NOT_RECORDED",
);
assert(
  fixture.missingRunbookPosture.blockerRefs.some((ref) => ref.includes("runbook")),
  "RUNBOOK_BLOCKER_MISSING",
);
assert(
  fixture.staleEvidencePackPosture.blockerRefs.some((ref) => ref.includes("evidence-pack")),
  "EVIDENCE_PACK_BLOCKER_MISSING",
);
assert(
  fixture.missingJourneyProofPosture.blockerRefs.some((ref) => ref.includes("journey-proof")),
  "JOURNEY_PROOF_BLOCKER_MISSING",
);
assert(
  fixture.partialDependencyPosture.blockerRefs.some((ref) => ref.includes("dependency-coverage")),
  "DEPENDENCY_BLOCKER_MISSING",
);
assert(
  fixture.proofDebt.some((debt) => debt.blockerRefs.length > 0),
  "PROOF_DEBT_MISSING",
);
assert(fixture.tenantDeniedErrorCode === "READINESS_SCOPE_TENANT_DENIED", "TENANT_DENIAL_MISSING");
assert(
  fixture.scopeDeniedErrorCode === "READINESS_PURPOSE_OF_USE_DENIED",
  "PURPOSE_DENIAL_MISSING",
);

const gapPath =
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_444_READINESS_RUNTIME_CONTRACTS.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_READINESS_RUNTIME_GAP");

const sourceText = readText(
  "packages/domains/analytics_assurance/src/phase9-operational-readiness-posture.ts",
);
for (const token of [
  "EssentialFunctionMap",
  "RecoveryTier",
  "BackupSetManifest",
  "OperationalReadinessSnapshot",
  "RunbookBindingRecord",
  "RecoveryControlPosture",
  "createResilienceTupleHash",
  "deriveRecoveryControlPosture",
  "listRecoveryProofDebt",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/444_operational_readiness_posture.spec.ts")}\n${readText(
  "tests/integration/444_operational_readiness_posture_artifacts.spec.ts",
)}`;
for (const token of [
  "essential-function mapping completeness",
  "recovery tier proof requirements",
  "dependency order cycle detection",
  "backup-manifest checksum and immutability state",
  "tuple-compatible restore digest derivation",
  "operational-readiness snapshot tuple hashing",
  "runbook binding staleness and withdrawal downgrades",
  "recovery-control posture downgrade for stale publication, degraded trust, active freeze, missing backups, missing runbooks, stale evidence packs, missing journey proof, and partial dependency coverage",
  "tenant/scope authorization",
  "deterministic posture recomputation",
  "stable cursor APIs for board consumption",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/444_phase9_operational_readiness_posture_summary.md");
for (const token of [
  "Schema version",
  "Essential functions",
  "Readiness tuple hash",
  "Live control tuple hash",
]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}
const notes = readText("data/analysis/444_algorithm_alignment_notes.md");
assert(notes.includes("current tuple only"), "NOTES_CURRENT_TUPLE_AUTHORITY_MISSING");
const matrix = readText("data/analysis/444_recovery_control_posture_matrix.csv");
assert(matrix.includes("stale_publication"), "MATRIX_STALE_PUBLICATION_MISSING");
assert(matrix.includes("partial_dependency"), "MATRIX_PARTIAL_DEPENDENCY_MISSING");
const proofDebt = readText("data/analysis/444_recovery_proof_debt.csv");
assert(proofDebt.includes("functionCode"), "PROOF_DEBT_HEADER_MISSING");

console.log("444 phase9 operational readiness posture validated.");
