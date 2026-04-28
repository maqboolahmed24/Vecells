import fs from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import {
  PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION,
  createPhase9TenantConfigGovernanceFixture,
  phase9DependencyWatchlistRegisterCsv,
  phase9TenantBaselineDiffMatrixCsv,
  phase9TenantConfigGovernanceSummary,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "448_phase9_tenant_config_governance_contract.json");
const fixturePath = path.join(fixturesDir, "448_phase9_tenant_config_governance_fixtures.json");
const gapPath = path.join(
  contractsDir,
  "PHASE9_BATCH_443_457_INTERFACE_GAP_448_CONFIG_SCHEMA_CONFLICT.json",
);
const summaryPath = path.join(analysisDir, "448_phase9_tenant_config_governance_summary.md");
const notesPath = path.join(analysisDir, "448_algorithm_alignment_notes.md");
const baselineDiffPath = path.join(analysisDir, "448_tenant_baseline_diff_matrix.csv");
const watchlistRegisterPath = path.join(analysisDir, "448_dependency_watchlist_register.csv");

const fixture = createPhase9TenantConfigGovernanceFixture();

async function formatJson(value: unknown, filePath: string): Promise<string> {
  const config = (await resolveConfig(filePath)) ?? {};
  return format(JSON.stringify(value, null, 2), { ...config, filepath: filePath });
}

const contractArtifact = {
  schemaVersion: PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION,
  upstreamGovernanceContractVersion: fixture.upstreamGovernanceContractVersion,
  upstreamIncidentWorkflowVersion: fixture.upstreamIncidentWorkflowVersion,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  producedObjects: fixture.producedObjects,
  apiSurface: fixture.apiSurface,
  canonicalAdapterPosture: {
    compiledPolicyBundle: "phase-0-canonical",
    standardsDependencyWatchlist: "platform-admin-canonical",
    legacyReferenceFinding: "platform-admin-canonical",
    schemaConflictGapRequired: true,
    schemaConflictGapRef: fixture.canonicalSchemaConflictGapRef,
  },
  immutabilityAuthority: {
    rootConfigVersionRef: fixture.rootConfigVersion.configVersionId,
    childConfigVersionRef: fixture.childConfigVersion.configVersionId,
    childParentVersionRef: fixture.childConfigVersion.parentVersionRef,
    parentChainLinked:
      fixture.childConfigVersion.parentVersionRef === fixture.rootConfigVersion.configVersionId,
    rootHash: fixture.rootConfigVersion.hash,
    childHash: fixture.childConfigVersion.hash,
    childChainHash: fixture.childConfigVersion.chainHash,
    compilationRecordRef: fixture.childConfigVersion.compilationRecordRef,
    simulationEnvelopeRef: fixture.childConfigVersion.simulationEnvelopeRef,
  },
  tenantBaselineAuthority: {
    liveTenantRef: fixture.liveBaseline.tenantId,
    candidateTenantRef: fixture.candidateBaseline.tenantId,
    liveApprovalState: fixture.liveBaseline.approvalState,
    candidateApprovalState: fixture.candidateBaseline.approvalState,
    diffFields: fixture.tenantDiffRows.map((row) => row.fieldName),
    diffCount: fixture.tenantDiffRows.length,
  },
  policyPackAuthority: {
    packCount: fixture.policyPackVersions.length,
    packTypes: fixture.policyPackVersions.map((pack) => pack.packType),
    allPackHashesCanonical: fixture.policyPackVersions.every((pack) =>
      /^[a-f0-9]{64}$/.test(pack.packHash),
    ),
    validBundleHash: fixture.validBundle.bundleHash,
    validCompileGateState: fixture.validCompileVerdict.compileGateState,
  },
  compileGateAuthority: {
    validGateState: fixture.validCompileVerdict.compileGateState,
    visibilityBlockers: fixture.visibilityBlockedVerdict.blockerRefs,
    staleProviderConsentBlockers: fixture.staleProviderConsentVerdict.blockerRefs,
    staleAssistiveBlockers: fixture.staleAssistiveVerdict.blockerRefs,
  },
  standardsDependencyWatchlistAuthority: {
    standardsBaselineMapRef: fixture.standardsBaselineMap.baselineMapId,
    dependencyLifecycleRecordRefs: fixture.dependencyLifecycleRecords.map(
      (record) => record.dependencyLifecycleRecordId,
    ),
    legacyReferenceFindingRefs: fixture.legacyReferenceFindings.map(
      (finding) => finding.legacyReferenceFindingId,
    ),
    policyCompatibilityAlertRef: fixture.policyCompatibilityAlert.policyCompatibilityAlertId,
    standardsExceptionRecordRef: fixture.expiredException.standardsExceptionRecordId,
    blockedWatchlistRef: fixture.blockedWatchlist.standardsDependencyWatchlistId,
    cleanWatchlistRef: fixture.cleanWatchlist.standardsDependencyWatchlistId,
    blockedCompileGateState: fixture.blockedWatchlist.compileGateState,
    blockedPromotionGateState: fixture.blockedWatchlist.promotionGateState,
    cleanCompileGateState: fixture.cleanWatchlist.compileGateState,
    cleanPromotionGateState: fixture.cleanWatchlist.promotionGateState,
    blockedHashParity:
      fixture.blockedWatchlist.watchlistHash === fixture.repeatedBlockedWatchlist.watchlistHash,
    reopenedFindingRefs: fixture.reopenedFindingRefs,
    affectedRouteFamilyRefs: fixture.blockedWatchlist.affectedRouteFamilyRefs,
    affectedTenantScopeRefs: fixture.blockedWatchlist.affectedTenantScopeRefs,
    affectedSurfaceSchemaRefs: fixture.blockedWatchlist.affectedSurfaceSchemaRefs,
    affectedLiveChannelRefs: fixture.blockedWatchlist.affectedLiveChannelRefs,
    affectedSimulationRefs: fixture.blockedWatchlist.affectedSimulationRefs,
  },
  standardsChangeAuthority: {
    noticeRef: fixture.standardsChangeNotice.noticeId,
    frameworkCode: fixture.standardsChangeNotice.frameworkCode,
    currentVersionRef: fixture.standardsChangeNotice.currentVersionRef,
    newVersionRef: fixture.standardsChangeNotice.newVersionRef,
    affectedTenantScopeRefs: fixture.standardsChangeNotice.affectedTenantScopeRefs,
  },
  promotionAuthority: {
    compileState: fixture.compilationRecord.compileState,
    simulationReadinessState: fixture.simulationEnvelope.compileReadinessState,
    readyPromotionState: fixture.promotionReadyAssessment.state,
    approvalBypassState: fixture.approvalBypassAssessment.state,
    approvalBypassBlockers: fixture.approvalBypassAssessment.blockerRefs,
    promotionDriftState: fixture.promotionDriftAssessment.state,
    promotionDriftBlockers: fixture.promotionDriftAssessment.blockerRefs,
    compilationTupleHash: fixture.compilationRecord.compilationTupleHash,
    standardsWatchlistHash: fixture.cleanWatchlist.watchlistHash,
  },
  authAuthority: {
    tenantDeniedErrorCode: fixture.tenantDeniedErrorCode,
    authorizationDeniedErrorCode: fixture.authorizationDeniedErrorCode,
  },
  deterministicReplay: {
    replayHash: fixture.replayHash,
  },
};

const schemaConflictGapArtifact = {
  taskId: "448",
  missingSurface:
    "Canonical platform-admin StandardsDependencyWatchlist adapter conflicts with packages/domains/identity_access/src/release-trust-freeze-backbone.ts StandardsDependencyWatchlistRecord",
  expectedOwnerTask: "phase-0/platform-admin canonical config contracts",
  sourceBlueprintBlock:
    "blueprint/platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
  temporaryFallback:
    "Phase 9 tenant config governance uses the platform-admin canonical shape locally and treats the identity-access release-freeze record as a narrower downstream freeze projection.",
  riskIfUnresolved:
    "Release-freeze consumers can silently drop baseline maps, dependency lifecycle records, legacy findings, compatibility alerts, standards exceptions, affected surfaces, and simulation scope when adapting a tenant config watchlist.",
  followUpAction:
    "Create an explicit adapter from platform-admin StandardsDependencyWatchlist to identity-access StandardsDependencyWatchlistRecord or retire the narrower record after release-freeze consumers migrate.",
  whyFallbackPreservesAlgorithm:
    "The generated task 448 contract, fixture, watchlist hash, compile gate, promotion gate, and tests are derived from the platform-admin fields required by the Phase 0 promotion algorithm; no blocker input is sourced from the narrower identity-access record.",
  canonicalFieldsPreserved: [
    "standardsBaselineMapRef",
    "dependencyLifecycleRecordRefs",
    "legacyReferenceFindingRefs",
    "policyCompatibilityAlertRefs",
    "standardsExceptionRecordRefs",
    "affectedRouteFamilyRefs",
    "affectedTenantScopeRefs",
    "affectedSurfaceSchemaRefs",
    "affectedLiveChannelRefs",
    "affectedSimulationRefs",
    "compileGateState",
    "promotionGateState",
    "watchlistHash",
  ],
  generatedAt: fixture.generatedAt,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, await formatJson(contractArtifact, contractPath));
fs.writeFileSync(fixturePath, await formatJson(fixture, fixturePath));
fs.writeFileSync(gapPath, await formatJson(schemaConflictGapArtifact, gapPath));
fs.writeFileSync(summaryPath, phase9TenantConfigGovernanceSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Tenant Config Governance Algorithm Alignment",
    "",
    "Task 448 implements section 9H as an append-only tenant configuration service with baseline profiles, parent-chain config hashes, policy pack history, canonical compiled policy bundle validation, and candidate-bound standards dependency watchlists.",
    "",
    "The compile gate rejects PHI exposure through public or superseded grants, minimum-necessary visibility violations, stale provider choice, expired consent, dispatch-correlation mismatch, and stale assistive-session artifacts before they can enter promotion.",
    "",
    "Dependency hygiene and legacy-reference scanners feed the platform-admin StandardsDependencyWatchlist shape directly. The generated interface gap documents the narrower identity-access release-freeze record and preserves the platform-admin schema as the adapter source.",
    "",
    "Promotion readiness requires a ready compilation record, ready simulation envelope, immutable approval audit, exact approved bundle hash, exact compilation tuple, exact watchlist hash, release contract parity, and matching migration execution tuple.",
    "",
  ].join("\n"),
);
fs.writeFileSync(baselineDiffPath, phase9TenantBaselineDiffMatrixCsv(fixture));
fs.writeFileSync(watchlistRegisterPath, phase9DependencyWatchlistRegisterCsv(fixture));

console.log(`Phase 9 tenant config governance contract: ${path.relative(root, contractPath)}`);
console.log(`Schema conflict gap: ${path.relative(root, gapPath)}`);
console.log(`Replay hash: ${fixture.replayHash}`);
