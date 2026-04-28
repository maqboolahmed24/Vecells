import fs from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import {
  OPS_ASSURANCE_SCHEMA_VERSION,
  OPS_ASSURANCE_TASK_ID,
  createOpsAssuranceFixture,
} from "../../apps/ops-console/src/operations-assurance-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "454_phase9_ops_assurance_route_contract.json");
const fixturePath = path.join(fixturesDir, "454_phase9_ops_assurance_route_fixtures.json");
const notesPath = path.join(analysisDir, "454_ops_assurance_implementation_note.md");

const fixture = createOpsAssuranceFixture();

async function formatJson(value: unknown, filePath: string): Promise<string> {
  const config = (await resolveConfig(filePath)) ?? {};
  return format(JSON.stringify(value, null, 2), { ...config, filepath: filePath });
}

const normal = fixture.scenarioProjections.normal;
const stale = fixture.scenarioProjections.stale;
const degraded = fixture.scenarioProjections.degraded;
const quarantined = fixture.scenarioProjections.quarantined;
const blocked = fixture.scenarioProjections.blocked;
const permissionDenied = fixture.scenarioProjections.permission_denied;
const settlementPending = fixture.scenarioProjections.settlement_pending;

const contractArtifact = {
  taskId: OPS_ASSURANCE_TASK_ID,
  schemaVersion: OPS_ASSURANCE_SCHEMA_VERSION,
  routes: fixture.routes,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  requiredSurfaces: [
    "AssuranceCenter",
    "FrameworkSelector",
    "ControlHeatMap",
    "ControlHeatTable",
    "EvidenceGapQueue",
    "CapaTracker",
    "PackPreview",
    "PackSettlement",
    "PackExportState",
  ],
  automationAnchors: fixture.automationAnchors,
  scenarioStates: Object.keys(fixture.scenarioProjections),
  frameworkCodes: Object.keys(fixture.frameworkProjections),
  assuranceAuthority: {
    selectedFrameworkCode: normal.selectedFrameworkCode,
    bindingState: normal.runtimeBinding.bindingState,
    packState: normal.packPreview.packState,
    settlementResult: normal.latestSettlement.result,
    controlCount: normal.controlHeatMap.length,
    evidenceGapCount: normal.evidenceGapQueue.length,
    capaCount: normal.capaTracker.length,
    continuitySectionCount: normal.continuitySections.length,
    artifactState: normal.artifactStage.artifactState,
  },
  triadProof: {
    normalFreshness: normal.controlHeatMap[0]?.freshnessState,
    normalTrust: normal.controlHeatMap[0]?.trustState,
    normalCompleteness: normal.controlHeatMap[0]?.completenessState,
    staleGraph: stale.completenessSummary.graphVerdictState,
    degradedTrust: degraded.completenessSummary.trustState,
    degradedGate: degraded.degradedSliceAttestation.gateState,
    quarantinedTrust: quarantined.completenessSummary.trustState,
    quarantinedGate: quarantined.degradedSliceAttestation.gateState,
    blockedGraph: blocked.completenessSummary.graphVerdictState,
    deniedScopeSettlement: permissionDenied.latestSettlement.result,
    pendingSettlement: settlementPending.latestSettlement.result,
  },
  packPreviewProof: {
    packVersionHash: normal.packPreview.packVersionHash,
    evidenceSetHash: normal.packPreview.evidenceSetHash,
    continuitySetHash: normal.packPreview.continuitySetHash,
    graphHash: normal.packPreview.graphHash,
    graphDecisionHash: normal.packPreview.graphDecisionHash,
    queryPlanHash: normal.packPreview.queryPlanHash,
    renderTemplateHash: normal.packPreview.renderTemplateHash,
    redactionPolicyHash: normal.packPreview.redactionPolicyHash,
    reproductionState: normal.packPreview.reproductionState,
    artifactPresentationContractRef: normal.packPreview.artifactPresentationContractRef,
    artifactTransferSettlementRef: normal.packPreview.artifactTransferSettlementRef,
    outboundNavigationGrantRef: normal.packPreview.outboundNavigationGrantRef,
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
    "# Task 454 Operations Assurance Implementation Note",
    "",
    "`/ops/assurance` now renders a same-shell Assurance Center with framework selection, control heat-map triads, table parity, evidence completeness status, evidence-gap queue, CAPA tracker, continuity evidence, settlement state, pack preview, and export manifest posture.",
    "",
    "Each control cell renders freshness, trust, and completeness as separate text-bearing states. The table fallback carries the same triad values, graph verdict, evidence counts, and blockers.",
    "",
    "Pack preview is summary-first and exposes pack version hash, evidence-set hash, continuity-set hash, graph hash, graph verdict decision hash, query plan hash, render template hash, redaction policy hash, reproduction state, required trust refs, and governed artifact handoff refs before any export control is armed.",
    "",
    "Attestation, signoff, publish, and export controls are bound to `AssurancePackSettlement`; local button acknowledgement never implies export readiness.",
    "",
    "Task 454 reuses task 440 assurance pack factory, task 441 CAPA/attestation workflow, and task 446 slice quarantine contracts, so no pack settlement interface gap artifact is required.",
    "",
    "Playwright evidence is written to `.artifacts/operations-assurance-454` for normal, empty, stale, degraded, quarantined, blocked, permission-denied, settlement-pending, freeze, framework selection, control selection, keyboard action, reduced-motion, desktop, laptop, tablet, and narrow mission-stack states.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 ops assurance contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 ops assurance fixture: ${path.relative(root, fixturePath)}`);
