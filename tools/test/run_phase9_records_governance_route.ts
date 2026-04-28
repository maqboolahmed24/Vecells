import fs from "node:fs";
import path from "node:path";
import {
  RECORDS_GOVERNANCE_SCHEMA_VERSION,
  createRecordsGovernanceFixture,
} from "../../apps/governance-console/src/records-governance-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "455_phase9_records_governance_route_contract.json");
const fixturePath = path.join(fixturesDir, "455_phase9_records_governance_route_fixtures.json");
const notePath = path.join(analysisDir, "455_records_governance_implementation_note.md");

const fixture = createRecordsGovernanceFixture();
const normal = fixture.scenarioProjections.normal;
const stale = fixture.scenarioProjections.stale;
const settlementPending = fixture.scenarioProjections.settlement_pending;
const protectedRows = normal.lifecycleLedgerRows.filter(
  (row) => row.graphCriticality === "worm" || row.graphCriticality === "replay_critical",
);

const contractArtifact = {
  schemaVersion: RECORDS_GOVERNANCE_SCHEMA_VERSION,
  routes: fixture.routes,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  automationAnchors: fixture.automationAnchors,
  recordsPosture: {
    normalBinding: normal.bindingState,
    normalGraph: normal.graphCompletenessState,
    staleBinding: stale.bindingState,
    staleActionControl: stale.actionControlState,
    settlementPendingActionControl: settlementPending.actionControlState,
    artifactState: normal.archiveManifestStage.artifactState,
  },
  lifecycleSafety: {
    lifecycleRowsRenderCurrentRefsTogether: normal.lifecycleLedgerRows.every(
      (row) =>
        row.retentionLifecycleBindingRef.length > 0 &&
        row.retentionDecisionRef.length > 0 &&
        row.dispositionEligibilityAssessmentRef.length > 0,
    ),
    noRawBatchCandidates: Object.values(fixture.scenarioProjections).every((projection) =>
      projection.lifecycleLedgerRows.every((row) => row.rawBatchCandidate === false),
    ),
    protectedRowsSuppressDelete: protectedRows.every(
      (row) => row.deleteControlState === "suppressed",
    ),
    holdReleaseRequiresSupersedingAssessment: settlementPending.legalHoldQueue.some(
      (hold) => hold.supersessionState === "released_needs_assessment",
    ),
    dispositionJobsUseCurrentAssessments: normal.dispositionJobs.every(
      (job) => job.admissionBasis === "current_assessment",
    ),
  },
  artifactContracts: {
    deletionCertificate: normal.deletionCertificateStage.artifactPresentationContractRef,
    archiveManifest: normal.archiveManifestStage.artifactPresentationContractRef,
    outboundGrant: normal.archiveManifestStage.outboundNavigationGrantRef,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(
  notePath,
  [
    "# Phase 9 Records Governance Route Implementation Note",
    "",
    "Task 455 adds `/ops/governance/records`, `/ops/governance/records/holds`, and `/ops/governance/records/disposition` to the governance shell. The route keeps lifecycle binding, retention decision, freeze refs, legal hold refs, and current disposition assessment together in the lifecycle ledger.",
    "",
    "Disposition jobs are rendered from current `DispositionEligibilityAssessment` rows only. Raw batch candidates, storage metadata, bucket paths, and operator CSV posture are not represented as safe inputs.",
    "",
    "WORM, hash-chained, and replay-critical artifacts suppress deletion controls. Legal hold release remains separate from delete authority until a superseding assessment exists.",
    "",
    "Deletion certificate and archive manifest stages are summary-first and bound to `ArtifactPresentationContract`, `ArtifactTransferSettlement`, and `OutboundNavigationGrant` refs.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 records governance route contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 records governance route fixture: ${path.relative(root, fixturePath)}`);
