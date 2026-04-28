import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_GOVERNANCE_CONTRACT_VERSION,
  PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
  PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION,
  createPhase9TenantConfigGovernanceFixture,
  type Phase9TenantConfigGovernanceFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-tenant-config-governance.ts",
  "data/contracts/448_phase9_tenant_config_governance_contract.json",
  "data/fixtures/448_phase9_tenant_config_governance_fixtures.json",
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_448_CONFIG_SCHEMA_CONFLICT.json",
  "data/analysis/448_phase9_tenant_config_governance_summary.md",
  "data/analysis/448_algorithm_alignment_notes.md",
  "data/analysis/448_tenant_baseline_diff_matrix.csv",
  "data/analysis/448_dependency_watchlist_register.csv",
  "tools/test/run_phase9_tenant_config_governance.ts",
  "tools/analysis/validate_448_phase9_tenant_config_governance.ts",
  "tests/unit/448_tenant_config_governance.spec.ts",
  "tests/integration/448_tenant_config_governance_artifacts.spec.ts",
];

const requiredTestTokens = [
  "config immutability and parent chain hashing",
  "tenant drift detection",
  "policy-pack compatibility",
  "visibility/minimum-necessary compile blocking",
  "stale provider choice and expired consent rejection",
  "stale assistive session invalidation",
  "legacy reference scanner detection and resolution",
  "standards change impact workflow",
  "standards watchlist hash parity",
  "exception expiry reopening findings",
  "approval-gate bypass prevention",
  "promotion invalidation on watchlist or migration tuple drift",
  "tenant isolation and authorization",
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
  packageJson.scripts?.["test:phase9:tenant-config-governance"] ===
    "pnpm exec tsx ./tools/test/run_phase9_tenant_config_governance.ts && pnpm exec vitest run tests/unit/448_tenant_config_governance.spec.ts tests/integration/448_tenant_config_governance_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:tenant-config-governance",
);
assert(
  packageJson.scripts?.["validate:448-phase9-tenant-config-governance"] ===
    "pnpm exec tsx ./tools/analysis/validate_448_phase9_tenant_config_governance.ts",
  "PACKAGE_SCRIPT_MISSING:validate:448-phase9-tenant-config-governance",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_448_/m.test(checklist), "CHECKLIST_TASK_448_NOT_CLAIMED_OR_COMPLETE");

for (const [relativePath, version] of [
  [
    "data/contracts/434_phase9_governance_control_contracts.json",
    PHASE9_GOVERNANCE_CONTRACT_VERSION,
  ],
  [
    "data/contracts/447_phase9_incident_reportability_workflow_contract.json",
    PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
  ],
] as const) {
  assert(fs.existsSync(path.join(root, relativePath)), `UPSTREAM_ARTIFACT_MISSING:${relativePath}`);
  assert(
    readJson<{ schemaVersion?: string }>(relativePath).schemaVersion === version,
    `UPSTREAM_VERSION_DRIFT:${relativePath}`,
  );
}

const contract = readJson<{
  schemaVersion?: string;
  upstreamGovernanceContractVersion?: string;
  upstreamIncidentWorkflowVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  producedObjects?: readonly string[];
  apiSurface?: readonly string[];
  canonicalAdapterPosture?: {
    compiledPolicyBundle?: string;
    standardsDependencyWatchlist?: string;
    legacyReferenceFinding?: string;
    schemaConflictGapRequired?: boolean;
    schemaConflictGapRef?: string;
  };
  immutabilityAuthority?: {
    parentChainLinked?: boolean;
    rootHash?: string;
    childHash?: string;
    childChainHash?: string;
  };
  tenantBaselineAuthority?: {
    liveTenantRef?: string;
    candidateTenantRef?: string;
    diffFields?: readonly string[];
    diffCount?: number;
  };
  policyPackAuthority?: {
    packCount?: number;
    packTypes?: readonly string[];
    allPackHashesCanonical?: boolean;
    validCompileGateState?: string;
  };
  compileGateAuthority?: {
    validGateState?: string;
    visibilityBlockers?: readonly string[];
    staleProviderConsentBlockers?: readonly string[];
    staleAssistiveBlockers?: readonly string[];
  };
  standardsDependencyWatchlistAuthority?: {
    standardsBaselineMapRef?: string;
    dependencyLifecycleRecordRefs?: readonly string[];
    legacyReferenceFindingRefs?: readonly string[];
    policyCompatibilityAlertRef?: string;
    standardsExceptionRecordRef?: string;
    blockedCompileGateState?: string;
    blockedPromotionGateState?: string;
    cleanCompileGateState?: string;
    cleanPromotionGateState?: string;
    blockedHashParity?: boolean;
    reopenedFindingRefs?: readonly string[];
    affectedRouteFamilyRefs?: readonly string[];
    affectedTenantScopeRefs?: readonly string[];
    affectedSurfaceSchemaRefs?: readonly string[];
    affectedLiveChannelRefs?: readonly string[];
    affectedSimulationRefs?: readonly string[];
  };
  standardsChangeAuthority?: {
    frameworkCode?: string;
    currentVersionRef?: string;
    newVersionRef?: string;
    affectedTenantScopeRefs?: readonly string[];
  };
  promotionAuthority?: {
    compileState?: string;
    simulationReadinessState?: string;
    readyPromotionState?: string;
    approvalBypassState?: string;
    approvalBypassBlockers?: readonly string[];
    promotionDriftState?: string;
    promotionDriftBlockers?: readonly string[];
    compilationTupleHash?: string;
    standardsWatchlistHash?: string;
  };
  authAuthority?: {
    tenantDeniedErrorCode?: string;
    authorizationDeniedErrorCode?: string;
  };
  deterministicReplay?: { replayHash?: string };
}>("data/contracts/448_phase9_tenant_config_governance_contract.json");

assert(
  contract.schemaVersion === PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION,
  "CONTRACT_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamGovernanceContractVersion === PHASE9_GOVERNANCE_CONTRACT_VERSION,
  "UPSTREAM_GOVERNANCE_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamIncidentWorkflowVersion === PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
  "UPSTREAM_INCIDENT_SCHEMA_VERSION_DRIFT",
);
for (const sourceRef of [
  "#9H",
  "phase-0-the-foundation-protocol",
  "platform-admin-and-config-blueprint",
  "governance-admin-console",
  "434_phase9",
  "447_phase9",
]) {
  assert(
    contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const objectName of [
  "TenantBaselineProfile",
  "ConfigVersion",
  "PolicyPackVersion",
  "DependencyRegistryEntry",
  "StandardsChangeNotice",
  "CompiledPolicyBundle",
  "ConfigCompilationRecord",
  "ConfigSimulationEnvelope",
  "StandardsDependencyWatchlist",
  "StandardsBaselineMap",
  "DependencyLifecycleRecord",
  "LegacyReferenceFinding",
  "PolicyCompatibilityAlert",
  "StandardsExceptionRecord",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const methodName of [
  "createTenantBaselineProfile",
  "listTenantBaselineDiff",
  "createConfigVersion",
  "listConfigHistory",
  "createPolicyPackVersion",
  "listPolicyPackHistory",
  "runDependencyHygieneScan",
  "runLegacyReferenceScan",
  "createStandardsChangeNotice",
  "generateStandardsDependencyWatchlist",
  "resolveExceptOrSupersedeFinding",
  "assessPromotionReadiness",
  "explainCompileOrPromotionBlocker",
]) {
  assert(contract.apiSurface?.includes(methodName), `API_SURFACE_MISSING:${methodName}`);
}
assert(
  contract.canonicalAdapterPosture?.compiledPolicyBundle === "phase-0-canonical",
  "COMPILED_POLICY_BUNDLE_NOT_CANONICAL",
);
assert(
  contract.canonicalAdapterPosture?.standardsDependencyWatchlist === "platform-admin-canonical",
  "WATCHLIST_NOT_PLATFORM_ADMIN_CANONICAL",
);
assert(
  contract.canonicalAdapterPosture?.schemaConflictGapRequired === true,
  "SCHEMA_GAP_NOT_REQUIRED",
);
assert(
  contract.immutabilityAuthority?.parentChainLinked === true,
  "CONFIG_PARENT_CHAIN_NOT_LINKED",
);
assert(
  contract.immutabilityAuthority?.rootHash?.match(/^[a-f0-9]{64}$/),
  "ROOT_CONFIG_HASH_INVALID",
);
assert(
  contract.immutabilityAuthority?.childHash?.match(/^[a-f0-9]{64}$/),
  "CHILD_CONFIG_HASH_INVALID",
);
assert(
  contract.immutabilityAuthority?.childChainHash?.match(/^[a-f0-9]{64}$/),
  "CHILD_CHAIN_HASH_INVALID",
);
assert(contract.tenantBaselineAuthority?.liveTenantRef === "tenant:demo-gp", "LIVE_TENANT_MISSING");
assert(
  contract.tenantBaselineAuthority?.candidateTenantRef === "tenant:demo-gp",
  "CANDIDATE_TENANT_MISSING",
);
assert((contract.tenantBaselineAuthority?.diffCount ?? 0) >= 4, "TENANT_DIFFS_MISSING");
assert(
  contract.tenantBaselineAuthority?.diffFields?.includes("standardsVersionRefs"),
  "STANDARDS_DIFF_MISSING",
);
assert(contract.policyPackAuthority?.packCount === 14, "POLICY_PACK_COVERAGE_COUNT_INVALID");
for (const packType of [
  "routing",
  "sla_eta",
  "identity_grants",
  "duplicate_policy",
  "provider_overrides",
  "waitlist_booking",
  "hub_coordination",
  "callback_messaging",
  "pharmacy",
  "communications",
  "access",
  "visibility",
  "provider_capability_matrix",
  "tenant_overrides",
]) {
  assert(
    contract.policyPackAuthority?.packTypes?.includes(packType),
    `POLICY_PACK_MISSING:${packType}`,
  );
}
assert(contract.policyPackAuthority?.allPackHashesCanonical === true, "POLICY_PACK_HASH_INVALID");
assert(contract.compileGateAuthority?.validGateState === "pass", "VALID_COMPILE_GATE_NOT_PASS");
assert(
  contract.compileGateAuthority?.visibilityBlockers?.includes(
    "visibility:minimum-necessary-coverage-blocked",
  ),
  "VISIBILITY_BLOCKER_MISSING",
);
assert(
  contract.compileGateAuthority?.staleProviderConsentBlockers?.includes(
    "pharmacy:stale-provider-choice",
  ),
  "STALE_PROVIDER_BLOCKER_MISSING",
);
assert(
  contract.compileGateAuthority?.staleProviderConsentBlockers?.includes(
    "pharmacy:expired-consent-scope",
  ),
  "EXPIRED_CONSENT_BLOCKER_MISSING",
);
assert(
  contract.compileGateAuthority?.staleAssistiveBlockers?.includes("assistive:session-invalidated"),
  "ASSISTIVE_SESSION_BLOCKER_MISSING",
);
assert(
  contract.standardsDependencyWatchlistAuthority?.standardsBaselineMapRef?.startsWith("sbm_448_"),
  "BASELINE_MAP_REF_MISSING",
);
assert(
  (contract.standardsDependencyWatchlistAuthority?.dependencyLifecycleRecordRefs?.length ?? 0) >= 2,
  "DEPENDENCY_LIFECYCLE_RECORDS_MISSING",
);
assert(
  (contract.standardsDependencyWatchlistAuthority?.legacyReferenceFindingRefs?.length ?? 0) >= 2,
  "LEGACY_REFERENCE_FINDINGS_MISSING",
);
assert(
  contract.standardsDependencyWatchlistAuthority?.blockedCompileGateState === "blocked",
  "BLOCKED_WATCHLIST_COMPILE_GATE_NOT_BLOCKED",
);
assert(
  contract.standardsDependencyWatchlistAuthority?.blockedPromotionGateState === "blocked",
  "BLOCKED_WATCHLIST_PROMOTION_GATE_NOT_BLOCKED",
);
assert(
  contract.standardsDependencyWatchlistAuthority?.blockedHashParity === true,
  "WATCHLIST_HASH_PARITY_MISSING",
);
assert(
  (contract.standardsDependencyWatchlistAuthority?.reopenedFindingRefs?.length ?? 0) > 0,
  "REOPENED_FINDINGS_MISSING",
);
for (const affectedField of [
  "affectedRouteFamilyRefs",
  "affectedTenantScopeRefs",
  "affectedSurfaceSchemaRefs",
  "affectedLiveChannelRefs",
  "affectedSimulationRefs",
] as const) {
  assert(
    (contract.standardsDependencyWatchlistAuthority?.[affectedField]?.length ?? 0) > 0,
    `WATCHLIST_SCOPE_MISSING:${affectedField}`,
  );
}
assert(
  contract.standardsChangeAuthority?.frameworkCode === "DTAC",
  "STANDARDS_CHANGE_FRAMEWORK_MISSING",
);
assert(
  contract.standardsChangeAuthority?.newVersionRef === "DTAC:2026-03",
  "STANDARDS_CHANGE_NEW_VERSION_MISSING",
);
assert(contract.promotionAuthority?.compileState === "ready", "COMPILATION_NOT_READY");
assert(contract.promotionAuthority?.simulationReadinessState === "ready", "SIMULATION_NOT_READY");
assert(contract.promotionAuthority?.readyPromotionState === "pass", "PROMOTION_NOT_PASS");
assert(
  contract.promotionAuthority?.approvalBypassBlockers?.includes("approval:bundle-hash-mismatch"),
  "APPROVAL_BYPASS_BLOCKER_MISSING",
);
assert(
  contract.promotionAuthority?.promotionDriftBlockers?.includes("migration:execution-tuple-drift"),
  "MIGRATION_DRIFT_BLOCKER_MISSING",
);
assert(
  contract.authAuthority?.tenantDeniedErrorCode === "TENANT_CONFIG_SCOPE_DENIED",
  "TENANT_DENIAL_MISSING",
);
assert(
  contract.authAuthority?.authorizationDeniedErrorCode === "TENANT_CONFIG_ROLE_DENIED",
  "AUTHORIZATION_DENIAL_MISSING",
);
assert(contract.deterministicReplay?.replayHash?.match(/^[a-f0-9]{64}$/), "REPLAY_HASH_INVALID");

const gap = readJson<{
  taskId?: string;
  missingSurface?: string;
  expectedOwnerTask?: string;
  sourceBlueprintBlock?: string;
  temporaryFallback?: string;
  riskIfUnresolved?: string;
  followUpAction?: string;
  whyFallbackPreservesAlgorithm?: string;
  canonicalFieldsPreserved?: readonly string[];
}>("data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_448_CONFIG_SCHEMA_CONFLICT.json");
assert(gap.taskId === "448", "GAP_TASK_ID_INVALID");
assert(
  gap.missingSurface?.includes("StandardsDependencyWatchlistRecord"),
  "GAP_MISSING_SURFACE_INVALID",
);
assert(
  gap.expectedOwnerTask === "phase-0/platform-admin canonical config contracts",
  "GAP_OWNER_INVALID",
);
assert(
  gap.sourceBlueprintBlock ===
    "blueprint/platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
  "GAP_SOURCE_BLOCK_INVALID",
);
assert(gap.temporaryFallback?.includes("platform-admin canonical shape"), "GAP_FALLBACK_INVALID");
assert(gap.riskIfUnresolved?.includes("baseline maps"), "GAP_RISK_INVALID");
assert(gap.followUpAction?.includes("adapter"), "GAP_FOLLOW_UP_INVALID");
assert(
  gap.whyFallbackPreservesAlgorithm?.includes("Phase 0 promotion algorithm"),
  "GAP_ALGORITHM_INVALID",
);
for (const fieldName of [
  "standardsBaselineMapRef",
  "dependencyLifecycleRecordRefs",
  "legacyReferenceFindingRefs",
  "policyCompatibilityAlertRefs",
  "standardsExceptionRecordRefs",
  "watchlistHash",
]) {
  assert(
    gap.canonicalFieldsPreserved?.includes(fieldName),
    `GAP_CANONICAL_FIELD_MISSING:${fieldName}`,
  );
}

const fixture = readJson<Phase9TenantConfigGovernanceFixture>(
  "data/fixtures/448_phase9_tenant_config_governance_fixtures.json",
);
const recomputed = createPhase9TenantConfigGovernanceFixture();
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(
  fixture.childConfigVersion.parentVersionRef === fixture.rootConfigVersion.configVersionId,
  "FIXTURE_CONFIG_PARENT_CHAIN_BROKEN",
);
assert(fixture.validCompileVerdict.compileGateState === "pass", "FIXTURE_VALID_COMPILE_NOT_PASS");
assert(
  fixture.visibilityBlockedVerdict.blockerRefs.includes(
    "visibility:minimum-necessary-coverage-blocked",
  ),
  "FIXTURE_VISIBILITY_BLOCKER_MISSING",
);
assert(
  fixture.staleProviderConsentVerdict.blockerRefs.includes("pharmacy:expired-consent-scope"),
  "FIXTURE_EXPIRED_CONSENT_BLOCKER_MISSING",
);
assert(
  fixture.staleAssistiveVerdict.blockerRefs.includes(
    "assistive:policy-bundle-changed-after-suggestion",
  ),
  "FIXTURE_ASSISTIVE_POLICY_CHANGE_BLOCKER_MISSING",
);
assert(
  fixture.blockedWatchlist.watchlistHash === fixture.repeatedBlockedWatchlist.watchlistHash,
  "FIXTURE_WATCHLIST_HASH_PARITY_DRIFT",
);
assert(fixture.reopenedFindingRefs.length > 0, "FIXTURE_REOPENED_FINDINGS_MISSING");
assert(fixture.compilationRecord.compileState === "ready", "FIXTURE_COMPILATION_NOT_READY");
assert(
  fixture.simulationEnvelope.compileReadinessState === "ready",
  "FIXTURE_SIMULATION_NOT_READY",
);
assert(fixture.promotionReadyAssessment.state === "pass", "FIXTURE_PROMOTION_NOT_PASS");
assert(
  fixture.approvalBypassAssessment.state === "invalidated",
  "FIXTURE_APPROVAL_BYPASS_NOT_INVALIDATED",
);
assert(
  fixture.promotionDriftAssessment.state === "invalidated",
  "FIXTURE_PROMOTION_DRIFT_NOT_INVALIDATED",
);
assert(
  fixture.tenantDeniedErrorCode === "TENANT_CONFIG_SCOPE_DENIED",
  "FIXTURE_TENANT_DENIAL_MISSING",
);
assert(
  fixture.authorizationDeniedErrorCode === "TENANT_CONFIG_ROLE_DENIED",
  "FIXTURE_AUTHZ_DENIAL_MISSING",
);

const unitSpec = readText("tests/unit/448_tenant_config_governance.spec.ts");
for (const token of requiredTestTokens) {
  assert(unitSpec.includes(token), `TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/448_phase9_tenant_config_governance_summary.md");
const notes = readText("data/analysis/448_algorithm_alignment_notes.md");
const diffMatrix = readText("data/analysis/448_tenant_baseline_diff_matrix.csv");
const register = readText("data/analysis/448_dependency_watchlist_register.csv");
assert(summary.includes("Tenant baselines preserve"), "SUMMARY_TENANT_BASELINE_MISSING");
assert(notes.includes("Promotion readiness requires"), "NOTES_PROMOTION_RULE_MISSING");
assert(diffMatrix.includes("standardsVersionRefs"), "DIFF_MATRIX_STANDARDS_MISSING");
assert(register.includes("blocked"), "WATCHLIST_REGISTER_BLOCKED_MISSING");

console.log("448 Phase 9 tenant config governance validation passed");
