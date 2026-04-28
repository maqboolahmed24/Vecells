import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  createPhase9AssurancePackFactoryFixture,
  phase9AssurancePackFactoryMatrixCsv,
  phase9AssurancePackFactorySummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "440_phase9_assurance_pack_factory_contract.json");
const fixturePath = path.join(fixturesDir, "440_phase9_assurance_pack_factory_fixtures.json");
const summaryPath = path.join(analysisDir, "440_phase9_assurance_pack_factory_summary.md");
const notesPath = path.join(analysisDir, "440_algorithm_alignment_notes.md");
const matrixPath = path.join(analysisDir, "440_assurance_pack_framework_matrix.csv");

const fixture = createPhase9AssurancePackFactoryFixture();

const contractArtifact = {
  schemaVersion: PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  frameworkCodes: fixture.standardsVersionMaps.map((map) => map.frameworkCode),
  producedObjects: [
    "StandardsVersionMap",
    "AssuranceControlRecord",
    "FrameworkPackGenerator",
    "MonthlyAssurancePack",
    "ContinuityEvidencePackSection",
    "GeneratedAssurancePack",
    "EvidenceGapRecord",
    "AssurancePackActionRecord",
    "AssurancePackSettlement",
  ],
  requiredHashes: [
    "evidenceSetHash",
    "continuitySetHash",
    "queryPlanHash",
    "renderTemplateHash",
    "redactionPolicyHash",
    "graphHash",
    "serializedArtifactHash",
    "exportManifestHash",
    "reproductionHash",
    "packVersionHash",
  ],
  deterministicReplay: {
    baselinePackVersionHash: fixture.baselineResult.pack.packVersionHash,
    baselineSerializedArtifactHash: fixture.baselineResult.pack.serializedArtifactHash,
    replayHash: fixture.replayHash,
    changedTemplatePackVersionHash: fixture.changedTemplateResult.pack.packVersionHash,
  },
  failClosedCases: {
    missingGraphVerdict: fixture.missingGraphVerdictResult.pack.packState,
    staleEvidence: fixture.staleEvidenceResult.pack.packState,
    missingRedactionExport: fixture.missingRedactionSettlement.result,
    ambiguousStandards: fixture.ambiguousStandardsResult.pack.packState,
    wrongTenant: fixture.wrongTenantResult.pack.packState,
    supersededEvidence: fixture.supersededEvidenceResult.pack.packState,
    missingContinuity: fixture.missingContinuityResult.pack.packState,
  },
  actionSettlementSurface: {
    signoffResult: fixture.reproductionSettlement.result,
    exportReadyResult: fixture.exportReadySettlement.result,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9AssurancePackFactorySummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Assurance Pack Factory Algorithm Alignment",
    "",
    "The pack factory follows Phase 9 section 9D: StandardsVersionMap rows are versioned, framework-specific generators build deterministic query plans, admissible evidence comes from graph-backed control and evidence rows, and generated packs pin graph verdict, trust, freshness, redaction, retention, continuity, and reproduction hashes.",
    "",
    "The implementation supports DSPT, DTAC, DCB0129, DCB0160, NHS App/channel, IM1 change, and local tenant framework families. It blocks or degrades on missing graph verdicts, stale or superseded evidence, missing redaction policy, ambiguous standards versions, tenant mismatch, missing continuity evidence, and missing retention lifecycle binding.",
    "",
    "AssurancePackActionRecord and AssurancePackSettlement are emitted for signoff, publish, export-ready, and blocked outcomes so task 441 can consume pack state for attestation, signoff, CAPA, and export handoff workflow.",
    "",
  ].join("\n"),
);
fs.writeFileSync(matrixPath, phase9AssurancePackFactoryMatrixCsv());

console.log(`Phase 9 assurance pack factory contract: ${path.relative(root, contractPath)}`);
console.log(`Pack version hash: ${fixture.baselineResult.pack.packVersionHash}`);
console.log(`Replay hash: ${fixture.replayHash}`);
