import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
  createPhase9InvestigationTimelineFixture,
  phase9InvestigationTimelineSourceMatrixCsv,
  phase9InvestigationTimelineSummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "439_phase9_investigation_timeline_service_contract.json",
);
const fixturePath = path.join(
  fixturesDir,
  "439_phase9_investigation_timeline_service_fixtures.json",
);
const summaryPath = path.join(analysisDir, "439_phase9_investigation_timeline_service_summary.md");
const notesPath = path.join(analysisDir, "439_algorithm_alignment_notes.md");
const sourceMatrixPath = path.join(analysisDir, "439_investigation_timeline_source_matrix.csv");

const fixture = createPhase9InvestigationTimelineFixture();

const contractArtifact = {
  schemaVersion: PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  producedObjects: [
    "InvestigationScopeEnvelope",
    "AuditQuerySession",
    "InvestigationTimelineReconstruction",
    "AccessEventIndex",
    "BreakGlassReviewRecord",
    "SupportReplaySession",
    "DataSubjectTrace",
    "InvestigationReadAuditRecord",
  ],
  scopeEnvelopeFields: [
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
  ],
  auditQuerySessionFields: [
    "filtersRef",
    "investigationScopeEnvelopeRef",
    "purposeOfUse",
    "visibilityCoverageRefs",
    "actingContextRef",
    "breakGlassReviewRef",
    "coverageState",
    "requiredEdgeCorrelationId",
    "requiredContinuityFrameRefs",
    "selectedAnchorRef",
    "selectedAnchorTupleHashRef",
    "investigationQuestionHash",
    "missingJoinRefs",
    "causalityState",
    "artifactPresentationContractRef",
    "outboundNavigationGrantPolicyRef",
    "baseLedgerWatermarkRef",
    "reconstructionInputHash",
    "timelineHash",
    "graphHash",
  ],
  deterministicReplay: {
    baselineTimelineHash: fixture.baselineResult.timelineReconstruction.timelineHash,
    baselineResultHash: fixture.baselineResult.resultHash,
    replayHash: fixture.replayHash,
    supportReplayTimelineHash: fixture.supportReplaySession.timelineHash,
  },
  failClosedCases: {
    missingGraphVerdict: fixture.missingGraphVerdictResult.auditQuerySession.coverageState,
    orphanGraphEdge: fixture.orphanGraphEdgeResult.auditQuerySession.coverageState,
    visibilityGap: fixture.visibilityGapResult.auditQuerySession.coverageState,
    breakGlassAbsent: fixture.breakGlassAbsentResult.auditQuerySession.coverageState,
    breakGlassExpired: fixture.breakGlassExpiredResult.auditQuerySession.coverageState,
    exportDenied: fixture.exportDeniedPreview.previewState,
  },
  noPhiPosture: {
    recordsCarryIdsAndHashesOnly: true,
    privilegedReadAuditsCarryTargetHashesOnly: true,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9InvestigationTimelineSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Investigation Timeline Algorithm Alignment",
    "",
    "The service follows Phase 9 section 9C: InvestigationScopeEnvelope is issued before any sensitive audit search, and every AuditQuerySession, BreakGlassReviewRecord, SupportReplaySession, and DataSubjectTrace pins the same timeline reconstruction for one diagnostic question.",
    "",
    "Timeline reconstruction consumes WORM audit records, AssuranceLedgerEntry rows, assurance graph edges, data-subject trace joins, continuity refs, causal tokens, command settlements, UI transition settlements, projection visibility refs, and artifact refs. It orders by event time, source sequence ref, assurance ledger entry id, and deterministic fallback id.",
    "",
    "The timeline hash is built from ordered ledger hashes, audit hashes, and the graph hash. Support replay cannot rebuild a separate chronology and export/preview cannot proceed without ArtifactPresentationContract and OutboundNavigationGrant policy refs.",
    "",
    "Missing or expired scope, missing purpose evidence, absent or expired break-glass review, visibility gaps, graph blockers, orphan edges, timeline join gaps, selected-anchor mismatch, tenant crossing, runtime mismatch, and disclosure-ceiling violations fail closed.",
    "",
  ].join("\n"),
);
fs.writeFileSync(sourceMatrixPath, phase9InvestigationTimelineSourceMatrixCsv());

console.log(`Phase 9 investigation timeline service contract: ${path.relative(root, contractPath)}`);
console.log(`Timeline hash: ${fixture.baselineResult.timelineReconstruction.timelineHash}`);
console.log(`Replay hash: ${fixture.replayHash}`);
