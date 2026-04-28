import fs from "node:fs";
import path from "node:path";
import {
  COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF,
  COMPLIANCE_LEDGER_SCHEMA_VERSION,
  createComplianceLedgerFixture,
  createComplianceLedgerProjection,
} from "../../apps/ops-console/src/compliance-ledger-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "459_phase9_compliance_ledger_route_contract.json");
const fixturePath = path.join(fixturesDir, "459_compliance_ledger_fixtures.json");
const notePath = path.join(analysisDir, "459_compliance_ledger_implementation_note.md");

const fixture = createComplianceLedgerFixture();
const exact = fixture.scenarioProjections.exact;
const stale = fixture.scenarioProjections.stale;
const blocked = fixture.scenarioProjections.graph_drift;
const permissionDenied = fixture.scenarioProjections.permission_denied;
const overdueOwner = fixture.scenarioProjections.overdue_owner;
const dspt = createComplianceLedgerProjection({
  scenarioState: "normal",
  selectedFrameworkCode: "DSPT",
});

const contractArtifact = {
  schemaVersion: COMPLIANCE_LEDGER_SCHEMA_VERSION,
  route: fixture.route,
  visualMode: fixture.visualMode,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  interfaceGapArtifactRef: COMPLIANCE_LEDGER_INTERFACE_GAP_ARTIFACT_REF,
  automationAnchors: fixture.automationAnchors,
  routeIntegration: {
    path: "/ops/assurance",
    noAdjacentDashboard: true,
    assuranceFrameworkSelectorShared: dspt.selectedFrameworkCode === "DSPT",
    ledgerUsesAssuranceGraph:
      exact.evidenceGraphMiniMap.graphHash === exact.ledgerRows[0]?.graphHash &&
      exact.graphCompletenessVerdictRef === exact.evidenceGraphMiniMap.graphCompletenessVerdictRef,
  },
  projectionCoverage: {
    ledgerRows: exact.ledgerRows.length,
    gapQueueItems: exact.gapQueue.items.length,
    frameworkContexts: exact.standardsVersionContexts.length,
    safeHandoffTargets: exact.safeHandoffLinks.map((link) => link.targetSurface),
    typedProjectionNames: [
      "ComplianceLedgerProjection",
      "ControlEvidenceGapQueueProjection",
      "ControlEvidenceGraphMiniMapProjection",
      "ControlOwnerBurdenProjection",
      "GapQueueFilterSetProjection",
      "GapResolutionActionPreviewProjection",
    ],
  },
  graphDowngrades: {
    staleDiagnosticOnly:
      stale.graphBlocker.graphVerdictState === "stale" &&
      stale.actionControlState === "diagnostic_only" &&
      stale.resolutionActionPreview.actionAllowed === false,
    blockedFailsClosed:
      blocked.graphBlocker.graphVerdictState === "blocked" &&
      blocked.actionControlState === "blocked" &&
      blocked.resolutionActionPreview.actionAllowed === false,
    permissionDeniedMetadataOnly:
      permissionDenied.actionControlState === "metadata_only" &&
      permissionDenied.resolutionActionPreview.actionAllowed === false,
  },
  ownerBurden: {
    overdueOwnerCount: overdueOwner.ownerBurden.items.filter((owner) => owner.overdueGapCount > 0)
      .length,
    overloadedOwnerCount: overdueOwner.ownerBurden.overloadedOwnerCount,
    overdueQueueItems: overdueOwner.gapQueue.items.filter((gap) => gap.queueStatus === "overdue")
      .length,
  },
  artifactSafety: {
    noRawArtifactUrls: exact.noRawArtifactUrls === true,
    allHandoffsSuppressRawUrls: exact.safeHandoffLinks.every(
      (link) => link.rawArtifactUrlSuppressed === true,
    ),
    serializedProjectionHasNoHttpUrls: !JSON.stringify(fixture).match(/https?:\/\//),
  },
  scenarioCoverage: Object.fromEntries(
    Object.entries(fixture.scenarioProjections).map(([scenarioState, projection]) => [
      scenarioState,
      {
        graphVerdictState: projection.graphBlocker.graphVerdictState,
        actionControlState: projection.actionControlState,
        queueState: projection.gapQueue.queueState,
        selectedControlRef: projection.selectedControlRef,
      },
    ]),
  ),
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(
  notePath,
  [
    "# Phase 9 Compliance Ledger Implementation Note",
    "",
    "Task 459 adds a compliance ledger and control evidence gap queue to `/ops/assurance`.",
    "",
    "The projection is a bounded adapter over the existing assurance graph, pack preview, control heat map, gap queue, CAPA tracker, settlement, and artifact-presentation state. Because no named ComplianceLedgerProjection contract existed, the implementation records the required interface-gap artifact and publishes the task 459 projection schema.",
    "",
    "The UI fails closed: stale graphs are diagnostic-only, blocked graphs prevent handoffs, permission-denied state shows metadata only, and all handoff links suppress raw artifact URLs.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 compliance ledger contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 compliance ledger fixture: ${path.relative(root, fixturePath)}`);
