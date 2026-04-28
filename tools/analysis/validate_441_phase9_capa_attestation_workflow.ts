import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  createPhase9CapaAttestationWorkflowFixture,
  type Phase9CapaAttestationWorkflowFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-capa-attestation-workflow.ts",
  "data/contracts/441_phase9_capa_attestation_workflow_contract.json",
  "data/fixtures/441_phase9_capa_attestation_workflow_fixtures.json",
  "data/analysis/441_phase9_capa_attestation_workflow_summary.md",
  "data/analysis/441_algorithm_alignment_notes.md",
  "data/analysis/441_capa_attestation_blocking_matrix.csv",
  "tools/test/run_phase9_capa_attestation_workflow.ts",
  "tools/analysis/validate_441_phase9_capa_attestation_workflow.ts",
  "tests/unit/441_capa_attestation_workflow.spec.ts",
  "tests/integration/441_capa_attestation_workflow_artifacts.spec.ts",
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
  packageJson.scripts?.["test:phase9:capa-attestation-workflow"] ===
    "pnpm exec tsx ./tools/test/run_phase9_capa_attestation_workflow.ts && pnpm exec vitest run tests/unit/441_capa_attestation_workflow.spec.ts tests/integration/441_capa_attestation_workflow_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:capa-attestation-workflow",
);
assert(
  packageJson.scripts?.["validate:441-phase9-capa-attestation-workflow"] ===
    "pnpm exec tsx ./tools/analysis/validate_441_phase9_capa_attestation_workflow.ts",
  "PACKAGE_SCRIPT_MISSING:validate:441-phase9-capa-attestation-workflow",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_441_/m.test(checklist), "CHECKLIST_TASK_441_NOT_CLAIMED_OR_COMPLETE");

for (const [relativePath, version] of [
  ["data/contracts/432_phase9_assurance_ledger_contracts.json", "432.phase9.assurance-ledger-contracts.v1"],
  ["data/contracts/436_phase9_graph_verdict_engine_contract.json", "436.phase9.graph-verdict-engine.v1"],
  ["data/contracts/440_phase9_assurance_pack_factory_contract.json", "440.phase9.assurance-pack-factory.v1"],
] as const) {
  assert(fs.existsSync(path.join(root, relativePath)), `UPSTREAM_ARTIFACT_MISSING:${relativePath}`);
  assert(readJson<{ schemaVersion?: string }>(relativePath).schemaVersion === version, `UPSTREAM_VERSION_DRIFT:${relativePath}`);
}

const contract = readJson<{
  schemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  producedObjects?: readonly string[];
  apiSurface?: readonly string[];
  gapTypes?: readonly string[];
  capaStatuses?: readonly string[];
  settlementResults?: Record<string, string>;
  deterministicReplay?: {
    replayHash?: string;
    firstRetrySettlementId?: string;
    secondRetrySettlementId?: string;
  };
  auditCoverage?: Record<string, number>;
  queueDtoFields?: readonly string[];
  noGapArtifactRequired?: boolean;
}>("data/contracts/441_phase9_capa_attestation_workflow_contract.json");

assert(contract.schemaVersion === PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
for (const sourceRef of ["#9D", "#9A", "#9G", "phase-0-the-foundation-protocol", "440_phase9_assurance_pack_factory"]) {
  assert(contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)), `SOURCE_REF_MISSING:${sourceRef}`);
}
for (const objectName of [
  "EvidenceGapQueueRecord",
  "CAPAAction",
  "AssurancePackActionRecord",
  "AssurancePackSettlement",
  "AssuranceWorkflowAuditRecord",
  "EvidenceGapQueueDto",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const methodName of [
  "deriveEvidenceGaps",
  "listEvidenceGaps",
  "getEvidenceGapDetail",
  "createCapaAction",
  "addEvidenceArtifactToCapa",
  "transitionCapaStatus",
  "performPackAction",
  "explainBlockReasons",
]) {
  assert(contract.apiSurface?.includes(methodName), `API_SURFACE_MISSING:${methodName}`);
}
for (const gapType of [
  "missing_evidence",
  "stale_evidence",
  "blocked_graph",
  "low_trust",
  "missing_redaction",
  "missing_continuity_proof",
  "missing_attestation",
  "superseded_evidence",
  "policy_version_mismatch",
  "tenant_scope_mismatch",
  "incident_capa_follow_up_required",
]) {
  assert(contract.gapTypes?.includes(gapType), `GAP_TYPE_MISSING:${gapType}`);
}
for (const status of ["open", "in_progress", "awaiting_evidence", "awaiting_attestation", "completed", "rejected", "superseded", "cancelled"]) {
  assert(contract.capaStatuses?.includes(status), `CAPA_STATUS_MISSING:${status}`);
}
assert(contract.settlementResults?.attest === "pending_attestation", "ATTEST_SETTLEMENT_MISSING");
assert(contract.settlementResults?.signoffBlockedOpenGap === "stale_pack", "SIGNOFF_OPEN_GAP_NOT_BLOCKED");
assert(contract.settlementResults?.signoffBlockedStaleHash === "stale_pack", "SIGNOFF_STALE_HASH_NOT_BLOCKED");
assert(contract.settlementResults?.publishBlockedGraph === "blocked_graph", "PUBLISH_GRAPH_NOT_BLOCKED");
assert(contract.settlementResults?.exportRedactionBlocked === "denied_scope", "EXPORT_REDACTION_NOT_DENIED");
assert(contract.settlementResults?.actorDenied === "denied_scope", "ACTOR_DENIAL_MISSING");
assert(contract.settlementResults?.selfApprovalDenied === "denied_scope", "SELF_APPROVAL_DENIAL_MISSING");
assert(
  contract.deterministicReplay?.firstRetrySettlementId === contract.deterministicReplay?.secondRetrySettlementId,
  "IDEMPOTENT_RETRY_NOT_STABLE",
);
for (const [name, count] of Object.entries(contract.auditCoverage ?? {})) {
  assert(count > 0, `AUDIT_COVERAGE_MISSING:${name}`);
}
for (const field of ["gapRef", "severity", "reason", "controlRef", "frameworkRef", "ownerRef", "dueAt", "nextSafeAction", "blockerRefs", "auditRefs"]) {
  assert(contract.queueDtoFields?.includes(field), `QUEUE_DTO_FIELD_MISSING:${field}`);
}
assert(contract.noGapArtifactRequired === true, "GAP_ARTIFACT_POSTURE_MISSING");

const fixture = readJson<Phase9CapaAttestationWorkflowFixture>(
  "data/fixtures/441_phase9_capa_attestation_workflow_fixtures.json",
);
const recomputed = createPhase9CapaAttestationWorkflowFixture();
assert(fixture.schemaVersion === PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(fixture.missingEvidenceGaps.length === 1, "MISSING_EVIDENCE_GAP_NOT_DERIVED");
assert(fixture.dedupedMissingEvidenceGaps.length === 1, "GAP_DEDUPLICATION_FAILED");
assert(fixture.capaCreateResult.capaAction.status === "open", "CAPA_CREATE_NOT_OPEN");
assert(fixture.capaInProgressResult.capaAction.status === "in_progress", "CAPA_TRANSITION_FAILED");
assert(fixture.capaClosureBlockedResult.result === "blocked", "CAPA_UNRESOLVED_CLOSURE_NOT_BLOCKED");
assert(fixture.capaCompletedResult.capaAction.status === "completed", "CAPA_COMPLETION_FAILED");
assert(fixture.overdueCapaRef.startsWith("capa_441_"), "CAPA_OVERDUE_NOT_DERIVED");
assert(fixture.concurrentUpdateErrorCode === "CAPA_CONCURRENCY_VERSION_MISMATCH", "CONCURRENCY_ERROR_MISSING");
assert(fixture.attestSuccessResult.result === "pending_attestation", "ATTEST_SUCCESS_MISSING");
assert(fixture.signoffBlockedOpenGapResult.result === "stale_pack", "SIGNOFF_OPEN_GAP_BLOCK_MISSING");
assert(fixture.signoffBlockedStaleHashResult.result === "stale_pack", "SIGNOFF_STALE_HASH_BLOCK_MISSING");
assert(fixture.publishBlockedGraphResult.result === "blocked_graph", "PUBLISH_GRAPH_BLOCK_MISSING");
assert(fixture.exportRedactionBlockedResult.result === "denied_scope", "EXPORT_REDACTION_BLOCK_MISSING");
assert(fixture.actorDeniedResult.result === "denied_scope", "ACTOR_DENIAL_MISSING");
assert(fixture.selfApprovalDeniedResult.result === "denied_scope", "SELF_APPROVAL_DENIAL_MISSING");
assert(
  fixture.idempotentRetryFirstResult.settlement.assurancePackSettlementId ===
    fixture.idempotentRetrySecondResult.settlement.assurancePackSettlementId,
  "IDEMPOTENT_RETRY_SETTLEMENT_DRIFT",
);
assert(fixture.queueDtos.length > 0, "QUEUE_DTO_MISSING");

const gapPath = "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_441_CAPA_ATTESTATION_WORKFLOW.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_CAPA_ATTESTATION_GAP");

const sourceText = readText("packages/domains/analytics_assurance/src/phase9-capa-attestation-workflow.ts");
for (const token of [
  "Phase9CapaAttestationWorkflowService",
  "EvidenceGapQueueRecord",
  "CAPAAction",
  "AssurancePackActionRecord",
  "AssurancePackSettlement",
  "CAPA_CONCURRENCY_VERSION_MISMATCH",
  "separation:self-approval-denied",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/441_capa_attestation_workflow.spec.ts")}\n${readText(
  "tests/integration/441_capa_attestation_workflow_artifacts.spec.ts",
)}`;
for (const token of [
  "gap derivation from missing evidence",
  "gap de-duplication by control/scope/reason/hash",
  "CAPA creation and status transition",
  "CAPA closure blocked when evidence unresolved",
  "overdue derivation",
  "pack attestation success",
  "signoff blocked by open gap",
  "signoff blocked by stale pack hash",
  "publish blocked by graph verdict change",
  "export-ready blocked by redaction policy mismatch",
  "actor without role denied",
  "self-approval denied where policy requires separation",
  "idempotent retry returns same settlement",
  "concurrent update fails cleanly",
  "audit records written for every mutation",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/441_phase9_capa_attestation_workflow_summary.md");
for (const token of ["Schema version", "Baseline pack ref", "Derived gap count", "Replay hash"]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}
const matrix = readText("data/analysis/441_capa_attestation_blocking_matrix.csv");
assert(matrix.includes("signoff_open_gap"), "MATRIX_SIGNOFF_OPEN_GAP_MISSING");
assert(matrix.includes("export_redaction"), "MATRIX_EXPORT_REDACTION_MISSING");

console.log("441 phase9 CAPA attestation workflow validated.");
