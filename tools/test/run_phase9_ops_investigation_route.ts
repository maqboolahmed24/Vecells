import fs from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import {
  OPS_INVESTIGATION_SCHEMA_VERSION,
  OPS_INVESTIGATION_TASK_ID,
  createOpsInvestigationFixture,
} from "../../apps/ops-console/src/operations-investigation-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "452_phase9_ops_investigation_route_contract.json");
const fixturePath = path.join(fixturesDir, "452_phase9_ops_investigation_route_fixtures.json");
const notesPath = path.join(analysisDir, "452_ops_investigation_implementation_note.md");

const fixture = createOpsInvestigationFixture();

async function formatJson(value: unknown, filePath: string): Promise<string> {
  const config = (await resolveConfig(filePath)) ?? {};
  return format(JSON.stringify(value, null, 2), { ...config, filepath: filePath });
}

const normalOverview = fixture.scenarioProjections.overview.normal;
const staleOverview = fixture.scenarioProjections.overview.stale;
const blockedAudit = fixture.scenarioProjections.audit.blocked;
const permissionDeniedAudit = fixture.scenarioProjections.audit.permission_denied;
const settlementAudit = fixture.scenarioProjections.audit.settlement_pending;
const quarantinedAudit = fixture.scenarioProjections.audit.quarantined;

const contractArtifact = {
  taskId: OPS_INVESTIGATION_TASK_ID,
  schemaVersion: OPS_INVESTIGATION_SCHEMA_VERSION,
  routes: fixture.routes,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  requiredSurfaces: [
    "InvestigationDrawer",
    "AuditExplorer",
    "TimelineLadder",
    "EvidenceGraphMiniMap",
    "BreakGlassReview",
    "SupportReplayBoundary",
    "InvestigationBundleExport",
  ],
  automationAnchors: fixture.automationAnchors,
  scenarioStates: Object.keys(fixture.scenarioProjections.audit),
  shellContinuityContract: {
    shellContinuityKey: normalOverview.shellContinuityKey,
    boardStateDigestRef: normalOverview.boardStateDigestRef,
    boardTupleHash: normalOverview.boardTupleHash,
    boardScopeRef: normalOverview.boardScopeRef,
    timeHorizon: normalOverview.timeHorizon,
    scopePolicyRef: normalOverview.scopePolicyRef,
    investigationQuestionHash: normalOverview.investigationQuestionHash,
    scopeHash: normalOverview.scopeEnvelope.scopeHash,
    timelineHash: normalOverview.timelineReconstruction.timelineHash,
    graphHash: normalOverview.timelineReconstruction.graphHash,
  },
  routeContinuityProof: {
    preservedQuestionStableUnderDrift:
      staleOverview.investigationQuestionHash === normalOverview.investigationQuestionHash,
    drawerDeltaStateWhenStale: staleOverview.drawerSession.deltaState,
    safeReturnFocusTarget: normalOverview.drillContextAnchor.returnFocusTargetRef,
    preservedProofBasisVisible: Boolean(normalOverview.preservedProofBasis),
  },
  graphAndExportProof: {
    normalGraphVerdict: normalOverview.evidenceGraph.verdictState,
    normalExportState: normalOverview.bundleExport.exportState,
    staleGraphVerdict: staleOverview.evidenceGraph.verdictState,
    staleExportState: staleOverview.bundleExport.exportState,
    quarantinedGraphVerdict: quarantinedAudit.evidenceGraph.verdictState,
    blockedExportState: blockedAudit.bundleExport.exportState,
    settlementExportState: settlementAudit.bundleExport.exportState,
  },
  auditExplorerProof: {
    causalityState: normalOverview.auditQuerySession.causalityState,
    eventCount: normalOverview.timelineEvents.length,
    graphRowCount: normalOverview.evidenceGraph.graphRows.length,
    breakGlassReviewState: permissionDeniedAudit.breakGlassReview.reviewState,
    breakGlassAuthorizedVisibility: permissionDeniedAudit.breakGlassReview.authorizedVisibility,
    supportReplayBlockedState: permissionDeniedAudit.supportReplayBoundary.restoreEligibilityState,
  },
  dispositionContractRefs: {
    artifactPresentationContractRef: normalOverview.bundleExport.artifactPresentationContractRef,
    artifactTransferSettlementRef: normalOverview.bundleExport.artifactTransferSettlementRef,
    artifactFallbackDispositionRef: normalOverview.bundleExport.artifactFallbackDispositionRef,
    outboundNavigationGrantRef: normalOverview.bundleExport.outboundNavigationGrantRef,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });

fs.writeFileSync(contractPath, await formatJson(contractArtifact, contractPath));
fs.writeFileSync(fixturePath, await formatJson(fixture, fixturePath));
fs.writeFileSync(
  notesPath,
  [
    "# Task 452 Operations Investigation Implementation Note",
    "",
    "`/ops/:lens/investigations/:opsRouteIntentId` now renders a same-shell `InvestigationDrawer` with a preserved proof basis, question hash, scope hash, timeline hash, graph verdict, and safe-return target.",
    "",
    "`/ops/audit` mounts the `AuditExplorer` route surface with scoped filters, timeline ladder, event evidence table, evidence graph mini-map, break-glass review, support replay boundary, and governed bundle export preview.",
    "",
    "The drawer never silently rebases when live proof drifts. Newer proof appears as a delta state while the original `investigationQuestionHash` remains the continuity base.",
    "",
    "Graph incompleteness fails closed. Stale graphs downgrade to summary-only or redaction review; quarantined, blocked, and permission-denied states block export and replay exit as appropriate.",
    "",
    "Task 452 reuses the existing task 439 investigation timeline service contract and task 443 disposition execution engine contract, so no interface gap artifact is required.",
    "",
    "Playwright evidence is written to `.artifacts/operations-investigation-452` for drawer, audit explorer, normal, empty, stale, degraded, quarantined, blocked, permission-denied, settlement-pending, safe return, keyboard, reduced-motion, desktop, laptop, tablet, and narrow mission-stack states.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 ops investigation contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 ops investigation fixture: ${path.relative(root, fixturePath)}`);
