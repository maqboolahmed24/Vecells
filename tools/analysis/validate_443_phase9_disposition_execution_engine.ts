import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
  PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
  createPhase9DispositionExecutionFixture,
  type Phase9DispositionExecutionFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-disposition-execution-engine.ts",
  "data/contracts/443_phase9_disposition_execution_engine_contract.json",
  "data/fixtures/443_phase9_disposition_execution_engine_fixtures.json",
  "data/analysis/443_phase9_disposition_execution_engine_summary.md",
  "data/analysis/443_algorithm_alignment_notes.md",
  "data/analysis/443_disposition_blocking_matrix.csv",
  "tools/test/run_phase9_disposition_execution_engine.ts",
  "tools/analysis/validate_443_phase9_disposition_execution_engine.ts",
  "tests/unit/443_disposition_execution_engine.spec.ts",
  "tests/integration/443_disposition_execution_engine_artifacts.spec.ts",
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
  packageJson.scripts?.["test:phase9:disposition-execution-engine"] ===
    "pnpm exec tsx ./tools/test/run_phase9_disposition_execution_engine.ts && pnpm exec vitest run tests/unit/443_disposition_execution_engine.spec.ts tests/integration/443_disposition_execution_engine_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:disposition-execution-engine",
);
assert(
  packageJson.scripts?.["validate:443-phase9-disposition-execution-engine"] ===
    "pnpm exec tsx ./tools/analysis/validate_443_phase9_disposition_execution_engine.ts",
  "PACKAGE_SCRIPT_MISSING:validate:443-phase9-disposition-execution-engine",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_443_/m.test(checklist), "CHECKLIST_TASK_443_NOT_CLAIMED_OR_COMPLETE");

for (const [relativePath, version] of [
  [
    "data/contracts/436_phase9_graph_verdict_engine_contract.json",
    "436.phase9.graph-verdict-engine.v1",
  ],
  [
    "data/contracts/440_phase9_assurance_pack_factory_contract.json",
    "440.phase9.assurance-pack-factory.v1",
  ],
  [
    "data/contracts/441_phase9_capa_attestation_workflow_contract.json",
    "441.phase9.capa-attestation-workflow.v1",
  ],
  [
    "data/contracts/442_phase9_retention_lifecycle_engine_contract.json",
    PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
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
  upstreamSchemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  producedObjects?: readonly string[];
  apiSurface?: readonly string[];
  admissionPosture?: Record<string, string>;
  deterministicReplay?: Record<string, string | undefined>;
  blockers?: Record<string, readonly string[]>;
  lifecycleWriteback?: Record<string, number | string | undefined>;
  noGapArtifactRequired?: boolean;
}>("data/contracts/443_phase9_disposition_execution_engine_contract.json");

assert(
  contract.schemaVersion === PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
  "CONTRACT_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamSchemaVersion === PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
  "UPSTREAM_SCHEMA_VERSION_DRIFT",
);
for (const sourceRef of [
  "#9E",
  "#9F",
  "442_phase9_retention",
  "436_phase9_graph",
  "440_phase9_assurance_pack",
  "441_phase9_capa",
]) {
  assert(
    contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const objectName of [
  "DispositionJob",
  "DispositionBlockExplainer",
  "DeletionCertificate",
  "ArchiveManifest",
  "DispositionExecutionAuditRecord",
  "DispositionLifecycleEventRecord",
  "ArtifactChecksumRecord",
  "ArtifactPresentationPolicy",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const methodName of [
  "queueArchiveJob",
  "queueDeleteJob",
  "validateDispositionJobCandidates",
  "executeDispositionJobSafely",
  "abortOrBlockDispositionJob",
  "retrieveArchiveManifest",
  "retrieveDeletionCertificate",
  "listDispositionBlockers",
  "generateDispositionBlockExplainer",
  "emitLifecycleEvidenceForAssuranceGraph",
]) {
  assert(contract.apiSurface?.includes(methodName), `API_SURFACE_MISSING:${methodName}`);
}
assert(
  contract.admissionPosture?.archiveFromCurrentAssessment === "queued",
  "ARCHIVE_CURRENT_ASSESSMENT_NOT_QUEUED",
);
assert(
  contract.admissionPosture?.deleteFromCurrentAssessment === "queued",
  "DELETE_CURRENT_ASSESSMENT_NOT_QUEUED",
);
for (const caseName of ["rawStorageScan", "staleAssessment", "staleGraph", "staleHoldState"]) {
  assert(contract.blockers?.[caseName]?.length, `BLOCKERS_MISSING:${caseName}`);
}
assert(contract.admissionPosture?.rawStorageScan === "blocked", "RAW_STORAGE_SCAN_NOT_BLOCKED");
assert(
  contract.admissionPosture?.replayCriticalArchive === "queued",
  "REPLAY_CRITICAL_ARCHIVE_NOT_QUEUED",
);
assert(
  contract.deterministicReplay?.manifestHash === contract.deterministicReplay?.manifestReplayHash,
  "ARCHIVE_MANIFEST_HASH_DRIFT",
);
assert(
  contract.deterministicReplay?.certificateHash ===
    contract.deterministicReplay?.certificateReplayHash,
  "DELETION_CERTIFICATE_HASH_DRIFT",
);
assert(
  (contract.lifecycleWriteback?.archiveEvents as number) > 0,
  "ARCHIVE_LIFECYCLE_EVENTS_MISSING",
);
assert(
  (contract.lifecycleWriteback?.deleteEvents as number) > 0,
  "DELETE_LIFECYCLE_EVENTS_MISSING",
);
assert(
  typeof contract.lifecycleWriteback?.firstLedgerHash === "string",
  "ASSURANCE_LEDGER_WRITEBACK_HASH_MISSING",
);
assert(contract.noGapArtifactRequired === true, "GAP_ARTIFACT_POSTURE_MISSING");

const fixture = readJson<Phase9DispositionExecutionFixture>(
  "data/fixtures/443_phase9_disposition_execution_engine_fixtures.json",
);
const recomputed = createPhase9DispositionExecutionFixture();
assert(
  fixture.schemaVersion === PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
  "FIXTURE_SCHEMA_VERSION_DRIFT",
);
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(fixture.archiveQueuedResult.job.resultState === "queued", "ARCHIVE_JOB_NOT_QUEUED");
assert(fixture.archiveExecutionResult.job.resultState === "completed", "ARCHIVE_JOB_NOT_COMPLETED");
assert(
  fixture.archiveExecutionResult.manifest?.manifestHash ===
    fixture.archiveReplayExecutionResult.manifest?.manifestHash,
  "MANIFEST_NOT_DETERMINISTIC",
);
assert(fixture.deleteQueuedResult.job.resultState === "queued", "DELETE_JOB_NOT_QUEUED");
assert(fixture.deleteExecutionResult.job.resultState === "completed", "DELETE_JOB_NOT_COMPLETED");
assert(
  fixture.deleteExecutionResult.deletionCertificates[0]?.certificateHash ===
    fixture.deleteReplayExecutionResult.deletionCertificates[0]?.certificateHash,
  "CERTIFICATE_NOT_DETERMINISTIC",
);
assert(
  fixture.deleteExecutionResult.certificateLifecycleBindings[0]?.graphCriticality ===
    "hash_chained",
  "CERTIFICATE_LIFECYCLE_NOT_IMMUTABLE",
);
assert(fixture.rawScanBlockedResult.job.resultState === "blocked", "RAW_SCAN_FIXTURE_NOT_BLOCKED");
assert(
  fixture.wormDeleteBlockedResult.job.blockerRefs.some((ref) => ref.includes("immutable")),
  "WORM_IMMUTABLE_BLOCKER_MISSING",
);
assert(
  fixture.replayCriticalDeleteBlockedResult.job.blockerRefs.some((ref) =>
    ref.includes("replay-critical"),
  ),
  "REPLAY_CRITICAL_BLOCKER_MISSING",
);
assert(
  fixture.staleAssessmentBlockedResult.job.blockerRefs.some((ref) =>
    ref.includes("assessment:stale"),
  ),
  "STALE_ASSESSMENT_BLOCKER_MISSING",
);
assert(
  fixture.staleGraphBlockedResult.job.blockerRefs.some((ref) => ref.includes("graph:")),
  "STALE_GRAPH_BLOCKER_MISSING",
);
assert(
  fixture.staleHoldStateBlockedResult.job.blockerRefs.some((ref) => ref.includes("hold-state")),
  "STALE_HOLD_BLOCKER_MISSING",
);
assert(
  fixture.partialArchiveResult.job.resultState === "partially_completed",
  "PARTIAL_ARCHIVE_NOT_RECORDED",
);
assert(
  fixture.partialRecoveryResult.job.resultState === "completed",
  "PARTIAL_RECOVERY_NOT_COMPLETED",
);
assert(
  fixture.duplicateQueueFirstResult.job.dispositionJobId ===
    fixture.duplicateQueueSecondResult.job.dispositionJobId,
  "DUPLICATE_IDEMPOTENCY_NOT_STABLE",
);
assert(
  fixture.tenantDeniedErrorCode === "DISPOSITION_TENANT_SCOPE_DENIED",
  "TENANT_SCOPE_DENIAL_MISSING",
);
assert(
  fixture.purposeDeniedErrorCode === "DISPOSITION_PURPOSE_OF_USE_DENIED",
  "PURPOSE_DENIAL_MISSING",
);
assert(
  fixture.blockExplainerResult.blockExplainers[0]?.summaryProjectionRef.startsWith(
    "summary:redacted:",
  ),
  "EXPLAINER_REDACTION_MISSING",
);
assert(
  fixture.lifecycleWritebackResult.lifecycleEvents[0]?.assuranceLedgerEntry.hash.length === 64,
  "ASSURANCE_LEDGER_WRITEBACK_INVALID",
);

const gapPath =
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_443_RETENTION_ELIGIBILITY_INPUTS.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_DISPOSITION_EXECUTION_GAP");

const sourceText = readText(
  "packages/domains/analytics_assurance/src/phase9-disposition-execution-engine.ts",
);
for (const token of [
  "DispositionJob",
  "DispositionBlockExplainer",
  "DeletionCertificate",
  "ArchiveManifest",
  "raw_storage_scan",
  "bucket_prefix",
  "object_store_manifest",
  "operator_csv",
  "executeDispositionJobSafely",
  "buildAssuranceLedgerEntry",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/443_disposition_execution_engine.spec.ts")}\n${readText(
  "tests/integration/443_disposition_execution_engine_artifacts.spec.ts",
)}`;
for (const token of [
  "disposition job admission from current assessments only",
  "rejection of raw storage scan candidates",
  "WORM/hash-chain/audit/assurance-ledger deletion exclusion",
  "replay-critical archive-only protection",
  "stale assessment, stale graph, and stale hold-state blocking",
  "archive checksum determinism and manifest hash reproducibility",
  "deletion certificate hash reproducibility",
  "certificate immutability and lifecycle binding",
  "graph dependency preservation for assurance packs, investigations, CAPA, recovery artifacts, archive manifests, and certificates",
  "legal hold release requiring a superseding assessment before job execution",
  "partially completed job recovery",
  "duplicate idempotency-key and duplicate scheduler safety",
  "tenant-crossing and purpose-of-use denial",
  "explainer redaction and audience-safe presentation",
  "assurance-ledger lifecycle event writeback",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/443_phase9_disposition_execution_engine_summary.md");
for (const token of [
  "Schema version",
  "Archive manifest hash",
  "Deletion certificate hash",
  "Replay hash",
]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}
const notes = readText("data/analysis/443_algorithm_alignment_notes.md");
assert(
  notes.includes("only archive/delete authority"),
  "NOTES_CURRENT_ASSESSMENT_AUTHORITY_MISSING",
);
const matrix = readText("data/analysis/443_disposition_blocking_matrix.csv");
assert(matrix.includes("raw_storage_scan"), "MATRIX_RAW_STORAGE_SCAN_MISSING");
assert(matrix.includes("stale_hold_state"), "MATRIX_STALE_HOLD_MISSING");

console.log("443 phase9 disposition execution engine validated.");
