import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  createPhase9CapaAttestationWorkflowFixture,
  phase9CapaAttestationWorkflowMatrixCsv,
  phase9CapaAttestationWorkflowSummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "441_phase9_capa_attestation_workflow_contract.json");
const fixturePath = path.join(fixturesDir, "441_phase9_capa_attestation_workflow_fixtures.json");
const summaryPath = path.join(analysisDir, "441_phase9_capa_attestation_workflow_summary.md");
const notesPath = path.join(analysisDir, "441_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "441_capa_attestation_blocking_matrix.csv");

const fixture = createPhase9CapaAttestationWorkflowFixture();

const contractArtifact = {
  schemaVersion: PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  producedObjects: fixture.producedObjects,
  apiSurface: [
    "deriveEvidenceGaps",
    "listEvidenceGaps",
    "getEvidenceGapDetail",
    "createCapaAction",
    "addEvidenceArtifactToCapa",
    "transitionCapaStatus",
    "isCapaOverdue",
    "performPackAction",
    "explainBlockReasons",
    "toQueueDtos",
  ],
  gapTypes: [
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
  ],
  capaStatuses: [
    "open",
    "in_progress",
    "awaiting_evidence",
    "awaiting_attestation",
    "completed",
    "rejected",
    "superseded",
    "cancelled",
  ],
  settlementResults: {
    attest: fixture.attestSuccessResult.result,
    signoffBlockedOpenGap: fixture.signoffBlockedOpenGapResult.result,
    signoffBlockedStaleHash: fixture.signoffBlockedStaleHashResult.result,
    publishBlockedGraph: fixture.publishBlockedGraphResult.result,
    exportRedactionBlocked: fixture.exportRedactionBlockedResult.result,
    actorDenied: fixture.actorDeniedResult.result,
    selfApprovalDenied: fixture.selfApprovalDeniedResult.result,
  },
  deterministicReplay: {
    replayHash: fixture.replayHash,
    firstRetrySettlementId: fixture.idempotentRetryFirstResult.settlement.assurancePackSettlementId,
    secondRetrySettlementId: fixture.idempotentRetrySecondResult.settlement.assurancePackSettlementId,
  },
  auditCoverage: {
    capaCreateAuditCount: fixture.capaCreateResult.auditRecords.length,
    capaTransitionAuditCount: fixture.capaInProgressResult.auditRecords.length,
    packActionAuditCount: fixture.attestSuccessResult.auditRecords.length,
  },
  queueDtoFields: Object.keys(fixture.queueDtos[0] ?? {}),
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9CapaAttestationWorkflowSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 CAPA And Attestation Workflow Algorithm Alignment",
    "",
    "The workflow follows Phase 9 section 9D: EvidenceGapRecord rows become queue records, CAPAAction lifecycle state is version-hash guarded, and assurance pack actions emit AssurancePackActionRecord plus AssurancePackSettlement rows bound to pack hashes, graph verdict, trust, redaction, route intent, scope token, and idempotency key.",
    "",
    "The workflow consumes task 440 pack output directly. It blocks stale pack hashes, graph verdict changes, open gaps, incomplete CAPA actions, redaction drift, missing actor role or purpose, self-approval, and stale route publication posture without recalculating pack business rules.",
    "",
    "Queue DTOs are intentionally UI-ready for a future governance queue but contain no PHI payloads. They expose graph-backed reason codes, next safe action, blockers, evidence refs, and audit refs.",
    "",
  ].join("\n"),
);
fs.writeFileSync(matrixPath, phase9CapaAttestationWorkflowMatrixCsv(fixture));

console.log(`Phase 9 CAPA attestation workflow contract: ${path.relative(root, contractPath)}`);
console.log(`Replay hash: ${fixture.replayHash}`);
