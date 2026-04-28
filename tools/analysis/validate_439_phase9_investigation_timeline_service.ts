import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
  createPhase9InvestigationTimelineFixture,
  type Phase9InvestigationTimelineFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-investigation-timeline-service.ts",
  "data/contracts/439_phase9_investigation_timeline_service_contract.json",
  "data/fixtures/439_phase9_investigation_timeline_service_fixtures.json",
  "data/analysis/439_phase9_investigation_timeline_service_summary.md",
  "data/analysis/439_algorithm_alignment_notes.md",
  "data/analysis/439_investigation_timeline_source_matrix.csv",
  "tools/test/run_phase9_investigation_timeline_service.ts",
  "tools/analysis/validate_439_phase9_investigation_timeline_service.ts",
  "tests/unit/439_investigation_timeline_service.spec.ts",
  "tests/integration/439_investigation_timeline_artifacts.spec.ts",
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
  packageJson.scripts?.["test:phase9:investigation-timeline"] ===
    "pnpm exec tsx ./tools/test/run_phase9_investigation_timeline_service.ts && pnpm exec vitest run tests/unit/439_investigation_timeline_service.spec.ts tests/integration/439_investigation_timeline_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:investigation-timeline",
);
assert(
  packageJson.scripts?.["validate:439-phase9-investigation-timeline"] ===
    "pnpm exec tsx ./tools/analysis/validate_439_phase9_investigation_timeline_service.ts",
  "PACKAGE_SCRIPT_MISSING:validate:439-phase9-investigation-timeline",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_439_/m.test(checklist), "CHECKLIST_TASK_439_NOT_CLAIMED_OR_COMPLETE");

assert(
  readJson<{ schemaVersion?: string }>(
    "data/contracts/435_phase9_assurance_ingest_service_contract.json",
  ).schemaVersion === "435.phase9.assurance-ingest-service.v1",
  "PHASE9_ASSURANCE_INGEST_MISSING_OR_DRIFTED",
);
assert(
  readJson<{ schemaVersion?: string }>(
    "data/contracts/436_phase9_graph_verdict_engine_contract.json",
  ).schemaVersion === "436.phase9.graph-verdict-engine.v1",
  "PHASE9_GRAPH_VERDICT_MISSING_OR_DRIFTED",
);
assert(
  readJson<{ schemaVersion?: string }>(
    "data/contracts/438_phase9_essential_function_metrics_contract.json",
  ).schemaVersion === "438.phase9.essential-function-metrics.v1",
  "PHASE9_438_METRICS_MISSING_OR_DRIFTED",
);

const contract = readJson<{
  schemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  producedObjects?: readonly string[];
  scopeEnvelopeFields?: readonly string[];
  auditQuerySessionFields?: readonly string[];
  deterministicReplay?: {
    baselineTimelineHash?: string;
    replayHash?: string;
    supportReplayTimelineHash?: string;
  };
  failClosedCases?: Record<string, string>;
  noGapArtifactRequired?: boolean;
}>("data/contracts/439_phase9_investigation_timeline_service_contract.json");
assert(contract.schemaVersion === PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
for (const sourceRef of [
  "#9C",
  "#9A",
  "#9D",
  "#9E",
  "phase-0-the-foundation-protocol",
  "435_phase9_assurance_ingest",
  "436_phase9_graph_verdict",
]) {
  assert(
    contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const objectName of [
  "InvestigationScopeEnvelope",
  "AuditQuerySession",
  "InvestigationTimelineReconstruction",
  "AccessEventIndex",
  "BreakGlassReviewRecord",
  "SupportReplaySession",
  "DataSubjectTrace",
  "InvestigationReadAuditRecord",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const field of [
  "originAudienceSurface",
  "originRouteIntentRef",
  "originOpsReturnTokenRef",
  "purposeOfUse",
  "actingContextRef",
  "maskingPolicyRef",
  "disclosureCeilingRef",
  "visibilityCoverageRefs",
  "scopeEntityRefs",
  "selectedAnchorRef",
  "selectedAnchorTupleHashRef",
  "investigationQuestionHash",
  "requiredBreakGlassReviewRef",
  "requiredSupportLineageBindingRef",
  "scopeHash",
  "issuedAt",
  "expiresAt",
]) {
  assert(contract.scopeEnvelopeFields?.includes(field), `SCOPE_FIELD_MISSING:${field}`);
}
for (const field of [
  "filtersRef",
  "investigationScopeEnvelopeRef",
  "coverageState",
  "requiredEdgeCorrelationId",
  "requiredContinuityFrameRefs",
  "missingJoinRefs",
  "causalityState",
  "baseLedgerWatermarkRef",
  "reconstructionInputHash",
  "timelineHash",
  "graphHash",
]) {
  assert(contract.auditQuerySessionFields?.includes(field), `SESSION_FIELD_MISSING:${field}`);
}
for (const [caseName, state] of Object.entries(contract.failClosedCases ?? {})) {
  assert(state === "blocked" || state === "denied", `FAIL_CLOSED_CASE_NOT_BLOCKED:${caseName}:${state}`);
}
assert(
  contract.deterministicReplay?.baselineTimelineHash ===
    contract.deterministicReplay?.supportReplayTimelineHash,
  "SUPPORT_REPLAY_TIMELINE_HASH_DRIFT",
);
assert(contract.noGapArtifactRequired === true, "GAP_ARTIFACT_POSTURE_MISSING");

const fixture = readJson<Phase9InvestigationTimelineFixture>(
  "data/fixtures/439_phase9_investigation_timeline_service_fixtures.json",
);
const recomputed = createPhase9InvestigationTimelineFixture();
assert(fixture.schemaVersion === PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(
  fixture.baselineResult.timelineReconstruction.timelineHash ===
    recomputed.baselineResult.timelineReconstruction.timelineHash,
  "TIMELINE_HASH_DRIFT",
);
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(fixture.baselineResult.auditQuerySession.coverageState === "exact", "BASELINE_QUERY_NOT_EXACT");
assert(fixture.baselineResult.auditQuerySession.causalityState === "complete", "BASELINE_CAUSALITY_NOT_COMPLETE");
assert(
  fixture.supportReplaySession.timelineHash === fixture.baselineResult.timelineReconstruction.timelineHash,
  "SUPPORT_REPLAY_DID_NOT_SHARE_TIMELINE",
);
assert(
  fixture.baselineResult.privilegedReadAuditRecords.length >=
    fixture.baselineResult.returnedAuditRecords.length + 1,
  "PRIVILEGED_READ_AUDIT_RECORDS_MISSING",
);
assert(fixture.exportDeniedPreview.previewState === "denied", "EXPORT_PREVIEW_NOT_DENIED_WITHOUT_POLICY");

const gapPath =
  "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_439_INVESTIGATION_TIMELINE_SOURCES.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_INVESTIGATION_TIMELINE_SOURCE_GAP");

const sourceText = readText(
  "packages/domains/analytics_assurance/src/phase9-investigation-timeline-service.ts",
);
for (const token of [
  "Phase9InvestigationTimelineService",
  "InvestigationScopeEnvelope",
  "AuditQuerySession",
  "InvestigationTimelineReconstruction",
  "BreakGlassReviewRecord",
  "SupportReplaySession",
  "DataSubjectTrace",
  "INVESTIGATION_SCOPE_ENVELOPE_REQUIRED",
  "CROSS_TENANT_INVESTIGATION_REFERENCE_DENIED",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/439_investigation_timeline_service.spec.ts")}\n${readText(
  "tests/integration/439_investigation_timeline_artifacts.spec.ts",
)}`;
for (const token of [
  "query without envelope rejected",
  "envelope with expired scope rejected",
  "valid scoped query returns only scoped records",
  "break-glass required and absent -> blocked",
  "break-glass with expired grant -> blocked",
  "deterministic timeline ordering",
  "missing graph verdict -> blocked",
  "orphan graph edge -> blocked",
  "visibility gap -> blocked",
  "cross-tenant subject denied",
  "timeline hash stable for same inputs",
  "support replay uses same timeline reconstruction",
  "export/preview denied without artifact presentation policy",
  "all privileged reads produce audit records",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/439_phase9_investigation_timeline_service_summary.md");
for (const token of [
  "Schema version",
  "Scope envelope",
  "Timeline hash",
  "Support replay session",
]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}

const matrix = readText("data/analysis/439_investigation_timeline_source_matrix.csv");
assert(matrix.includes("InvestigationScopeEnvelope"), "SOURCE_MATRIX_SCOPE_MISSING");
assert(matrix.includes("AssuranceLedgerEntry"), "SOURCE_MATRIX_LEDGER_MISSING");
assert(matrix.includes("BreakGlassReviewRecord"), "SOURCE_MATRIX_BREAK_GLASS_MISSING");

console.log("439 phase9 investigation timeline service validated.");
