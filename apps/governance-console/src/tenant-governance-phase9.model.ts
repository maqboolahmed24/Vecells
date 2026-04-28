export const TENANT_GOVERNANCE_TASK_ID = "par_457";
export const TENANT_GOVERNANCE_SCHEMA_VERSION = "457.phase9.tenant-governance-route.v1";
export const PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION = "448.phase9.tenant-config-governance.v1";

export type TenantGovernanceScenarioState =
  | "normal"
  | "empty"
  | "stale"
  | "degraded"
  | "blocked"
  | "permission_denied"
  | "settlement_pending";
export type TenantGovernanceRouteMode =
  | "governance_tenants"
  | "config_tenants"
  | "config_bundles"
  | "config_promotions"
  | "release";
export type TenantGovernanceBindingState =
  | "live"
  | "review_only"
  | "revalidation_required"
  | "blocked";
export type TenantGovernanceActionControlState =
  | "review_required"
  | "settlement_pending"
  | "revalidation_required"
  | "blocked"
  | "metadata_only";
export type TenantGovernanceWatchlistState =
  | "current"
  | "stale"
  | "blocked"
  | "empty"
  | "metadata_only";
export type TenantGovernanceGateState =
  | "pass"
  | "review_required"
  | "settlement_pending"
  | "revalidation_required"
  | "blocked"
  | "unavailable";
export type TenantGovernanceMatrixFilter = "all" | "drift" | "blocked" | "overridden";
export type TenantGovernanceInheritanceState = "inherited" | "overridden" | "exact";
export type TenantGovernanceDriftState = "none" | "candidate_delta" | "stale" | "blocked";
export type TenantGovernanceFindingType =
  | "dependency_lifecycle"
  | "legacy_reference"
  | "policy_compatibility"
  | "standards_exception"
  | "watchlist_drift";
export type TenantGovernanceFindingSeverity = "blocking" | "advisory" | "legacy";
export type TenantGovernanceFindingState =
  | "open"
  | "exception_active"
  | "expired_reopened"
  | "resolved"
  | "metadata_only";
export type TenantGovernanceActionType =
  | "compile_candidate"
  | "promote_bundle"
  | "approve_exception"
  | "revalidate_watchlist"
  | "return_to_ops";

export type TenantMatrixDomainRef =
  | "enabled_capabilities"
  | "policy_packs"
  | "integrations"
  | "standards_versions"
  | "visibility_access_policy"
  | "pharmacy_overrides"
  | "callback_messaging_policy"
  | "migration_backfill_posture"
  | "approval_state"
  | "drift_state";

export interface TenantGovernanceMatrixDomain {
  readonly domainRef: TenantMatrixDomainRef;
  readonly label: string;
}

export interface TenantGovernanceScopeStrip {
  readonly tenantRef: string;
  readonly tenantLabel: string;
  readonly organisationRef: string;
  readonly environmentRef: string;
  readonly scopeTupleHash: string;
  readonly liveBundleHash: string;
  readonly candidateBundleHash: string;
  readonly reviewPackageHash: string;
  readonly configCompilationRecordRef: string;
  readonly configSimulationEnvelopeRef: string;
  readonly watchlistRef: string;
  readonly watchlistHash: string;
  readonly releaseFreezeTupleHash: string;
  readonly freshnessState: "current" | "stale" | "blocked" | "metadata_only";
  readonly bindingState: TenantGovernanceBindingState;
  readonly actionControlState: TenantGovernanceActionControlState;
  readonly summary: string;
}

export interface TenantBaselineMatrixCell {
  readonly domainRef: TenantMatrixDomainRef;
  readonly domainLabel: string;
  readonly exactValue: string;
  readonly effectiveValue: string;
  readonly inheritanceState: TenantGovernanceInheritanceState;
  readonly versionRef: string;
  readonly driftState: TenantGovernanceDriftState;
  readonly affectedRouteFamilies: readonly string[];
  readonly policyRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly compileGateState: TenantGovernanceGateState;
  readonly promotionGateState: TenantGovernanceGateState;
  readonly selected: boolean;
}

export interface TenantBaselineMatrixRow {
  readonly shellObjectId: string;
  readonly tenantRef: string;
  readonly tenantLabel: string;
  readonly scopeRef: string;
  readonly tenantBaselineProfileRef: string;
  readonly baselineHash: string;
  readonly candidateBaselineHash: string;
  readonly approvalState: string;
  readonly rowDriftState: TenantGovernanceDriftState;
  readonly cells: readonly TenantBaselineMatrixCell[];
  readonly expandedPolicyRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly selected: boolean;
  readonly preservedByFilter: boolean;
}

export interface TenantConfigDiffEntry {
  readonly domainRef: TenantMatrixDomainRef;
  readonly title: string;
  readonly beforeSummary: string;
  readonly afterSummary: string;
  readonly baselineLiveValue: string;
  readonly candidateValue: string;
  readonly impactSummary: string;
  readonly evidenceRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly affectedRouteFamilies: readonly string[];
  readonly selected: boolean;
}

export interface TenantPolicyPackHistoryRow {
  readonly policyPackVersionId: string;
  readonly tenantId: string;
  readonly packType: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string;
  readonly changeSummaryRef: string;
  readonly compatibilityRefs: readonly string[];
  readonly packHash: string;
  readonly selected: boolean;
}

export interface TenantGovernanceWatchlistFinding {
  readonly findingRef: string;
  readonly findingType: TenantGovernanceFindingType;
  readonly severity: TenantGovernanceFindingSeverity;
  readonly findingState: TenantGovernanceFindingState;
  readonly ownerRef: string;
  readonly replacementRef: string;
  readonly deadline: string;
  readonly affectedRouteFamilies: readonly string[];
  readonly affectedTenantScopes: readonly string[];
  readonly affectedChannels: readonly string[];
  readonly affectedSimulations: readonly string[];
  readonly compileGateState: TenantGovernanceGateState;
  readonly promotionGateState: TenantGovernanceGateState;
  readonly watchlistHash: string;
  readonly settlementRef: string;
  readonly actionLabel: string;
  readonly summary: string;
  readonly selected: boolean;
}

export interface TenantStandardsWatchlistProjection {
  readonly standardsDependencyWatchlistRef: string;
  readonly watchlistState: TenantGovernanceWatchlistState;
  readonly candidateBundleHash: string;
  readonly liveBundleHash: string;
  readonly standardsBaselineMapRef: string;
  readonly compileGateState: TenantGovernanceGateState;
  readonly promotionGateState: TenantGovernanceGateState;
  readonly watchlistHash: string;
  readonly blockingFindingRefs: readonly string[];
  readonly advisoryFindingRefs: readonly string[];
  readonly affectedRouteFamilyRefs: readonly string[];
  readonly affectedTenantScopeRefs: readonly string[];
  readonly affectedSurfaceSchemaRefs: readonly string[];
  readonly affectedLiveChannelRefs: readonly string[];
  readonly affectedSimulationRefs: readonly string[];
  readonly findings: readonly TenantGovernanceWatchlistFinding[];
}

export interface TenantPromotionApprovalStatus {
  readonly configCompilationRecordRef: string;
  readonly configSimulationEnvelopeRef: string;
  readonly compiledPolicyBundleRef: string;
  readonly compileGateState: TenantGovernanceGateState;
  readonly simulationReadinessState: TenantGovernanceGateState;
  readonly promotionReadinessState: TenantGovernanceGateState;
  readonly approvalEvidenceRefs: readonly string[];
  readonly compilationTupleHash: string;
  readonly standardsWatchlistHash: string;
  readonly migrationExecutionTupleHash: string;
  readonly blockerRefs: readonly string[];
  readonly releaseApprovalFreezeRef: string;
}

export interface TenantReleaseWatchStatus {
  readonly releaseFreezeTupleRef: string;
  readonly releaseFreezeTupleHash: string;
  readonly releaseWatchTupleRef: string;
  readonly waveObservationRef: string;
  readonly waveSettlementState: "settled" | "pending" | "blocked" | "metadata_only";
  readonly recoveryDispositionRefs: readonly string[];
  readonly rollbackReadinessState: TenantGovernanceGateState;
  readonly activeReleaseWatchState: TenantGovernanceGateState;
  readonly summary: string;
}

export interface TenantMigrationPosture {
  readonly migrationExecutionBindingRef: string;
  readonly migrationExecutionTupleHash: string;
  readonly readPathCompatibilityDigestRef: string;
  readonly projectionBackfillLedgerRef: string;
  readonly readPathCompatibilityState: TenantGovernanceGateState;
  readonly projectionBackfillState: TenantGovernanceGateState;
  readonly backfillWindow: string;
  readonly blockerRefs: readonly string[];
}

export interface TenantGovernanceActionProjection {
  readonly actionType: TenantGovernanceActionType;
  readonly label: string;
  readonly allowed: boolean;
  readonly gateState: TenantGovernanceGateState;
  readonly settlementRef: string;
  readonly disabledReason: string;
}

export interface TenantGovernanceProjection {
  readonly taskId: typeof TENANT_GOVERNANCE_TASK_ID;
  readonly schemaVersion: typeof TENANT_GOVERNANCE_SCHEMA_VERSION;
  readonly upstreamSchemaVersions: Record<"448", typeof PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION>;
  readonly route:
    | "/ops/governance/tenants"
    | "/ops/config/tenants"
    | "/ops/config/bundles"
    | "/ops/config/promotions"
    | "/ops/release";
  readonly routeMode: TenantGovernanceRouteMode;
  readonly scenarioState: TenantGovernanceScenarioState;
  readonly matrixFilter: TenantGovernanceMatrixFilter;
  readonly selectedTenantRef: string;
  readonly selectedShellObjectId: string;
  readonly selectedDomainRef: TenantMatrixDomainRef;
  readonly selectedFindingRef: string;
  readonly bindingState: TenantGovernanceBindingState;
  readonly actionControlState: TenantGovernanceActionControlState;
  readonly watchlistState: TenantGovernanceWatchlistState;
  readonly surfaceSummary: string;
  readonly scopeStrip: TenantGovernanceScopeStrip;
  readonly matrixDomains: readonly TenantGovernanceMatrixDomain[];
  readonly tenantBaselineMatrix: readonly TenantBaselineMatrixRow[];
  readonly selectedMatrixRow: TenantBaselineMatrixRow;
  readonly configDiffViewer: readonly TenantConfigDiffEntry[];
  readonly selectedDiffEntry: TenantConfigDiffEntry;
  readonly policyPackHistory: readonly TenantPolicyPackHistoryRow[];
  readonly standardsWatchlist: TenantStandardsWatchlistProjection;
  readonly selectedFinding: TenantGovernanceWatchlistFinding | null;
  readonly legacyReferenceFindings: readonly TenantGovernanceWatchlistFinding[];
  readonly policyCompatibilityAlerts: readonly TenantGovernanceWatchlistFinding[];
  readonly standardsExceptions: readonly TenantGovernanceWatchlistFinding[];
  readonly promotionApprovalStatus: TenantPromotionApprovalStatus;
  readonly releaseWatchStatus: TenantReleaseWatchStatus;
  readonly migrationPosture: TenantMigrationPosture;
  readonly actionRail: readonly TenantGovernanceActionProjection[];
  readonly automationAnchors: readonly string[];
  readonly sourceAlgorithmRefs: readonly string[];
  readonly noInterfaceGapRequired: boolean;
}

export const tenantGovernanceAutomationAnchors = [
  "tenant-governance",
  "tenant-baseline-matrix",
  "config-diff-viewer",
  "policy-pack-history",
  "standards-watchlist",
  "legacy-reference-findings",
  "promotion-approval-status",
  "release-watch-status",
  "migration-posture",
] as const;

export const tenantGovernanceScenarioStates = [
  "normal",
  "empty",
  "stale",
  "degraded",
  "blocked",
  "permission_denied",
  "settlement_pending",
] as const satisfies readonly TenantGovernanceScenarioState[];

export const tenantGovernanceRoutes = [
  "/ops/governance/tenants",
  "/ops/config/tenants",
  "/ops/config/bundles",
  "/ops/config/promotions",
  "/ops/release",
] as const;

export const tenantGovernanceMatrixDomains = [
  { domainRef: "enabled_capabilities", label: "Enabled capabilities" },
  { domainRef: "policy_packs", label: "Policy packs" },
  { domainRef: "integrations", label: "Integrations" },
  { domainRef: "standards_versions", label: "Standards versions" },
  { domainRef: "visibility_access_policy", label: "Visibility/access policy" },
  { domainRef: "pharmacy_overrides", label: "Pharmacy overrides" },
  { domainRef: "callback_messaging_policy", label: "Callback/messaging policy" },
  { domainRef: "migration_backfill_posture", label: "Migration/backfill posture" },
  { domainRef: "approval_state", label: "Approval state" },
  { domainRef: "drift_state", label: "Drift state" },
] as const satisfies readonly TenantGovernanceMatrixDomain[];

const sourceAlgorithmRefs = [
  "blueprint/phase-9-the-assurance-ledger.md#9H",
  "blueprint/platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
  "blueprint/governance-admin-console-frontend-blueprint.md#TenantConfigMatrix",
  "data/contracts/448_phase9_tenant_config_governance_contract.json",
] as const;

const canonicalObjectTypeRefs = [
  "TenantBaselineProfile",
  "ConfigVersion",
  "PolicyPackVersion",
  "StandardsDependencyWatchlist",
  "LegacyReferenceFinding",
  "PolicyCompatibilityAlert",
  "StandardsExceptionRecord",
] as const;

const upstreamSchemaVersions = {
  "448": PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION,
} as const;

const bundleRefs = {
  liveBaselineRef: "tbp_448_76d3ce60b09b0523",
  candidateBaselineRef: "tbp_448_59d1985dd5cc1504",
  liveBundleHash: "76d3ce60b09b05231bb15e3f7b5115d1a859450f6c3737165a491de0ddf82374",
  candidateBundleHash: "292c447710fe955ab16fbdd61c4603d295cbded5587406d3ee3a2e34af19f34e",
  candidateBaselineHash: "59d1985dd5cc15044574c4db855ee4d5c25243f6922a1de4a628dd9a0b200c5d",
  cleanWatchlistRef: "sdw_448_7e3d2ba5df078e15",
  cleanWatchlistHash: "7e3d2ba5df078e15285a2b8960d8c5dfae4de5bb9aae6504370d5130b2e0cfaa",
  blockedWatchlistRef: "sdw_448_8a5c422818da8250",
  blockedWatchlistHash: "8a5c422818da82507b1434a4b7233a0bbb6c43c103dbdb8939e55a97e6625f05",
  standardsBaselineMapRef: "sbm_448_70dc05506ccc22b0",
  compilationRecordRef: "ccr_448_a5c8e178d266ad67",
  simulationEnvelopeRef: "cse_448_3f7afde42b5fcdf3",
  compiledPolicyBundleRef: "cpb_448_292c447710fe955a",
  compilationTupleHash: "92ae3a3ed8f342b474ce72749677e14a6cbd8336a58404311631f4d7ec9d3e66",
  migrationExecutionTupleHash: "d2c68820516a1dbc8328a2f422dea8e1bae91cec86323db7c497d60df797e723",
  reviewPackageHash: "review-package-hash:448",
  scopeTupleHash: "scope-tuple-hash:448",
  releaseFreezeTupleHash: "release-freeze-tuple-hash:457:tenant-config",
} as const;

const routeFamilies = [
  "route-family:governance-config",
  "route-family:patient-records",
  "route-family:pharmacy",
  "route-family:release",
] as const;
const tenantScopes = ["tenant:demo-gp"] as const;
const surfaceSchemas = [
  "surface-schema:governance-config",
  "surface-schema:patient-record-preview",
  "surface-schema:release",
] as const;
const liveChannels = ["live-channel:ops-governance", "live-channel:web"] as const;
const simulations = [
  "simulation:patient-record-preview",
  "simulation:reference-case:tenant-config",
  "simulation:release-contract",
] as const;

const baseTenants = [
  {
    shellObjectId: "tenant-north-river",
    tenantRef: "tenant:demo-gp",
    tenantLabel: "North River ICS",
    scopeRef: "tenant:demo-gp:production",
    approvalState: "draft_review",
    baselineHash: bundleRefs.liveBundleHash,
    candidateBaselineHash: bundleRefs.candidateBaselineHash,
    rowDriftState: "candidate_delta",
    expandedPolicyRefs: [
      "policy-pack:pharmacy:v1",
      "policy-pack:routing:v2",
      "policy-pack:visibility:v2",
    ],
    evidenceRefs: [
      bundleRefs.compilationRecordRef,
      bundleRefs.simulationEnvelopeRef,
      bundleRefs.cleanWatchlistRef,
    ],
  },
  {
    shellObjectId: "tenant-city-east",
    tenantRef: "tenant:city-east",
    tenantLabel: "City East Partnership",
    scopeRef: "tenant:city-east:production",
    approvalState: "blocked_watchlist",
    baselineHash: "cebase45776d3ce60b09b05231bb15e3f7b5115d1a859450f6c373716",
    candidateBaselineHash: "cecand45759d1985dd5cc15044574c4db855ee4d5c25243f6922a1",
    rowDriftState: "blocked",
    expandedPolicyRefs: ["policy-pack:routing:v2", "policy-pack:visibility:v2"],
    evidenceRefs: [bundleRefs.blockedWatchlistRef, "pra_448_46b1cdb70d3907c3"],
  },
  {
    shellObjectId: "tenant-harbour-west",
    tenantRef: "tenant:harbour-west",
    tenantLabel: "Harbour West Network",
    scopeRef: "tenant:harbour-west:production",
    approvalState: "approved_current",
    baselineHash: "hwbase45776d3ce60b09b05231bb15e3f7b5115d1a859450f6c373716",
    candidateBaselineHash: "hwbase45776d3ce60b09b05231bb15e3f7b5115d1a859450f6c373716",
    rowDriftState: "none",
    expandedPolicyRefs: ["policy-pack:routing:v1", "policy-pack:visibility:v1"],
    evidenceRefs: [bundleRefs.cleanWatchlistRef, "approval-evidence:448"],
  },
] as const;

const cellTextByDomain: Record<
  TenantMatrixDomainRef,
  {
    readonly exactValue: string;
    readonly effectiveValue: string;
    readonly candidateValue: string;
    readonly versionRef: string;
    readonly policyRefs: readonly string[];
    readonly evidenceRefs: readonly string[];
    readonly driftState: TenantGovernanceDriftState;
    readonly inheritanceState: TenantGovernanceInheritanceState;
  }
> = {
  enabled_capabilities: {
    exactValue: "booking, messaging, records",
    effectiveValue: "booking, messaging, pharmacy, records",
    candidateValue: "pharmacy capability added behind release watch",
    versionRef: "tbp_448_59d1985dd5cc1504",
    policyRefs: ["policy-pack:pharmacy:v1"],
    evidenceRefs: ["capability-diff:448:pharmacy"],
    driftState: "candidate_delta",
    inheritanceState: "overridden",
  },
  policy_packs: {
    exactValue: "routing:v1, visibility:v1",
    effectiveValue: "pharmacy:v1, routing:v2, visibility:v2",
    candidateValue: "compiled policy bundle cpb_448_292c447710fe955a",
    versionRef: "cpb_448_292c447710fe955a",
    policyRefs: ["policy-pack:pharmacy:v1", "policy-pack:routing:v2", "policy-pack:visibility:v2"],
    evidenceRefs: [bundleRefs.compilationRecordRef],
    driftState: "candidate_delta",
    inheritanceState: "overridden",
  },
  integrations: {
    exactValue: "fhir-r4, nhs-login",
    effectiveValue: "fhir-r4, nhs-app, nhs-login",
    candidateValue: "NHS App dependency enters watchlist",
    versionRef: "integration-set:448:nhs-app",
    policyRefs: ["policy-pack:communications:v1"],
    evidenceRefs: ["integration-diff:448:nhs-app"],
    driftState: "candidate_delta",
    inheritanceState: "overridden",
  },
  standards_versions: {
    exactValue: "DSPT:2025, DTAC:2025-03",
    effectiveValue: "DCB0160:2026-review, DSPT:2026, DTAC:2026-03",
    candidateValue: "standards baseline map sbm_448_70dc05506ccc22b0",
    versionRef: bundleRefs.standardsBaselineMapRef,
    policyRefs: ["standards-map:DSPT:2026", "standards-map:DTAC:2026-03"],
    evidenceRefs: [bundleRefs.cleanWatchlistRef],
    driftState: "candidate_delta",
    inheritanceState: "overridden",
  },
  visibility_access_policy: {
    exactValue: "minimum necessary public grant excluded",
    effectiveValue: "visibility v2 with PHI exposure guard",
    candidateValue: "minimum-necessary compatibility alert requires review",
    versionRef: "policy-pack:visibility:v2",
    policyRefs: ["policy-pack:visibility:v2", "policy-pack:identity_grants:v1"],
    evidenceRefs: ["pca_448_da6737c9ef9e161c"],
    driftState: "candidate_delta",
    inheritanceState: "overridden",
  },
  pharmacy_overrides: {
    exactValue: "not enabled",
    effectiveValue: "pharmacy routing enabled for production release",
    candidateValue: "pharmacy overrides bound to route-family:pharmacy",
    versionRef: "policy-pack:pharmacy:v1",
    policyRefs: ["policy-pack:pharmacy:v1", "policy-pack:provider_overrides:v1"],
    evidenceRefs: ["simulation:release-contract"],
    driftState: "candidate_delta",
    inheritanceState: "overridden",
  },
  callback_messaging_policy: {
    exactValue: "callback fallback v1",
    effectiveValue: "callback fallback v2 with channel freeze guard",
    candidateValue: "messaging policy waits on watch tuple",
    versionRef: "policy-pack:callback_messaging:v1",
    policyRefs: ["policy-pack:callback_messaging:v1", "policy-pack:communications:v1"],
    evidenceRefs: ["continuity:tenant-config:448"],
    driftState: "candidate_delta",
    inheritanceState: "overridden",
  },
  migration_backfill_posture: {
    exactValue: "dual-read off, backfill settled",
    effectiveValue: "dual-read staged, projection backfill pending",
    candidateValue: "migration tuple d2c688... binds read path and backfill ledger",
    versionRef: "migration-execution-binding:448",
    policyRefs: ["migration:tenant-config:448"],
    evidenceRefs: ["projection-backfill-ledger:448"],
    driftState: "candidate_delta",
    inheritanceState: "overridden",
  },
  approval_state: {
    exactValue: "approved",
    effectiveValue: "draft review",
    candidateValue: "approval evidence must bind watchlist hash",
    versionRef: "approval-evidence:448",
    policyRefs: ["approval-policy:no-self-approval"],
    evidenceRefs: ["approval-evidence:448", "release-freeze:448"],
    driftState: "candidate_delta",
    inheritanceState: "exact",
  },
  drift_state: {
    exactValue: "no live drift",
    effectiveValue: "candidate differs from live baseline",
    candidateValue: "diff remains fenced by config-drift-fence:448:clear",
    versionRef: "config-drift-fence:448:clear",
    policyRefs: ["config-drift-fence:448"],
    evidenceRefs: ["pra_448_31ec78d93c3092a3"],
    driftState: "candidate_delta",
    inheritanceState: "exact",
  },
};

const policyPackHistory = [
  ["ppv_448_42dfd17a31e0fdb1", "routing"],
  ["ppv_448_d8c2ef92392a1d3d", "sla_eta"],
  ["ppv_448_6ebcd6acb8a52bac", "identity_grants"],
  ["ppv_448_0ea80b4ff74ebf79", "duplicate_policy"],
  ["ppv_448_3006b372e2ca23a8", "provider_overrides"],
  ["ppv_448_3f70b41021bbad1a", "waitlist_booking"],
  ["ppv_448_465645c7962b9052", "pharmacy"],
  ["ppv_448_27855636c382e25c", "visibility"],
  ["ppv_448_2a0a5953d380522d", "callback_messaging"],
  ["ppv_448_a2d2b6c33d62cde2", "communications"],
  ["ppv_448_6538d4db1c5241e9", "tenant_overrides"],
  ["ppv_448_718aa64fe4aba17d", "hub_coordination"],
  ["ppv_448_8c07c234b433f121", "access"],
  ["ppv_448_9b1113f2b7196fce", "provider_capability_matrix"],
] as const;

function normalizeGateForScenario(
  scenarioState: TenantGovernanceScenarioState,
  cleanGate: TenantGovernanceGateState = "review_required",
): TenantGovernanceGateState {
  switch (scenarioState) {
    case "blocked":
    case "permission_denied":
      return "blocked";
    case "stale":
      return "revalidation_required";
    case "settlement_pending":
      return "settlement_pending";
    case "empty":
      return "unavailable";
    case "normal":
    case "degraded":
    default:
      return cleanGate;
  }
}

export function normalizeTenantGovernanceScenarioState(
  value: string | null | undefined,
): TenantGovernanceScenarioState {
  const normalized = (value ?? "normal").replace(/-/g, "_");
  return tenantGovernanceScenarioStates.includes(normalized as TenantGovernanceScenarioState)
    ? (normalized as TenantGovernanceScenarioState)
    : "normal";
}

export function normalizeTenantGovernanceMatrixFilter(
  value: string | null | undefined,
): TenantGovernanceMatrixFilter {
  const normalized = value ?? "all";
  return ["all", "drift", "blocked", "overridden"].includes(normalized)
    ? (normalized as TenantGovernanceMatrixFilter)
    : "all";
}

export function tenantGovernanceRouteModeForPath(pathname: string): TenantGovernanceRouteMode {
  if (pathname === "/ops/config/tenants") return "config_tenants";
  if (pathname === "/ops/config/bundles") return "config_bundles";
  if (pathname === "/ops/config/promotions") return "config_promotions";
  if (pathname === "/ops/release") return "release";
  return "governance_tenants";
}

function routeForMode(mode: TenantGovernanceRouteMode): TenantGovernanceProjection["route"] {
  switch (mode) {
    case "config_tenants":
      return "/ops/config/tenants";
    case "config_bundles":
      return "/ops/config/bundles";
    case "config_promotions":
      return "/ops/config/promotions";
    case "release":
      return "/ops/release";
    case "governance_tenants":
    default:
      return "/ops/governance/tenants";
  }
}

function bindingStateForScenario(
  scenarioState: TenantGovernanceScenarioState,
): TenantGovernanceBindingState {
  switch (scenarioState) {
    case "stale":
      return "revalidation_required";
    case "degraded":
    case "settlement_pending":
      return "review_only";
    case "blocked":
    case "permission_denied":
      return "blocked";
    case "normal":
    case "empty":
    default:
      return "live";
  }
}

function actionControlForScenario(
  scenarioState: TenantGovernanceScenarioState,
): TenantGovernanceActionControlState {
  switch (scenarioState) {
    case "stale":
      return "revalidation_required";
    case "settlement_pending":
      return "settlement_pending";
    case "blocked":
      return "blocked";
    case "permission_denied":
      return "metadata_only";
    case "normal":
    case "degraded":
    case "empty":
    default:
      return "review_required";
  }
}

function watchlistStateForScenario(
  scenarioState: TenantGovernanceScenarioState,
): TenantGovernanceWatchlistState {
  switch (scenarioState) {
    case "empty":
      return "empty";
    case "stale":
      return "stale";
    case "blocked":
      return "blocked";
    case "permission_denied":
      return "metadata_only";
    case "normal":
    case "degraded":
    case "settlement_pending":
    default:
      return "current";
  }
}

function selectedTenant(
  selectedTenantRef: string | null | undefined,
): (typeof baseTenants)[number] {
  return (
    baseTenants.find(
      (tenant) =>
        tenant.tenantRef === selectedTenantRef || tenant.shellObjectId === selectedTenantRef,
    ) ?? baseTenants[0]!
  );
}

function cellForDomain(
  tenant: (typeof baseTenants)[number],
  domain: TenantGovernanceMatrixDomain,
  scenarioState: TenantGovernanceScenarioState,
  selectedDomainRef: TenantMatrixDomainRef,
): TenantBaselineMatrixCell {
  const template = cellTextByDomain[domain.domainRef];
  const selected = domain.domainRef === selectedDomainRef;
  const gateState = normalizeGateForScenario(scenarioState);
  const permissionDenied = scenarioState === "permission_denied";
  const inheritedTenant = tenant.shellObjectId === "tenant-harbour-west";
  const blockedTenant = tenant.shellObjectId === "tenant-city-east";
  const scenarioDrift: TenantGovernanceDriftState =
    scenarioState === "stale"
      ? "stale"
      : scenarioState === "blocked" || permissionDenied || blockedTenant
        ? "blocked"
        : inheritedTenant
          ? "none"
          : template.driftState;

  return {
    domainRef: domain.domainRef,
    domainLabel: domain.label,
    exactValue: permissionDenied ? "metadata restricted" : template.exactValue,
    effectiveValue: permissionDenied
      ? "summary-only scope; values hidden"
      : inheritedTenant
        ? template.exactValue
        : blockedTenant && domain.domainRef !== "enabled_capabilities"
          ? `${template.effectiveValue} (blocked)`
          : template.effectiveValue,
    inheritanceState: inheritedTenant ? "inherited" : template.inheritanceState,
    versionRef: permissionDenied ? "scope-denied:tenant-config" : template.versionRef,
    driftState: scenarioDrift,
    affectedRouteFamilies: routeFamilies,
    policyRefs: permissionDenied ? ["policy:metadata-only"] : template.policyRefs,
    evidenceRefs: permissionDenied ? ["TENANT_CONFIG_SCOPE_DENIED"] : template.evidenceRefs,
    compileGateState: gateState,
    promotionGateState: gateState,
    selected,
  };
}

function rowMatchesFilter(
  row: TenantBaselineMatrixRow,
  matrixFilter: TenantGovernanceMatrixFilter,
): boolean {
  switch (matrixFilter) {
    case "drift":
      return row.cells.some((cell) => cell.driftState !== "none");
    case "blocked":
      return row.cells.some((cell) => cell.driftState === "blocked");
    case "overridden":
      return row.cells.some((cell) => cell.inheritanceState === "overridden");
    case "all":
    default:
      return true;
  }
}

function buildMatrixRows(
  scenarioState: TenantGovernanceScenarioState,
  matrixFilter: TenantGovernanceMatrixFilter,
  selectedTenantRef: string,
  selectedDomainRef: TenantMatrixDomainRef,
): readonly TenantBaselineMatrixRow[] {
  if (scenarioState === "empty") return [];
  const rows = baseTenants.map((tenant) => {
    const selected =
      tenant.tenantRef === selectedTenantRef || tenant.shellObjectId === selectedTenantRef;
    const cells = tenantGovernanceMatrixDomains.map((domain) =>
      cellForDomain(tenant, domain, scenarioState, selectedDomainRef),
    );
    const rowDriftState =
      scenarioState === "stale"
        ? "stale"
        : scenarioState === "blocked" || scenarioState === "permission_denied"
          ? "blocked"
          : tenant.rowDriftState;
    return {
      shellObjectId: tenant.shellObjectId,
      tenantRef: tenant.tenantRef,
      tenantLabel: tenant.tenantLabel,
      scopeRef: tenant.scopeRef,
      tenantBaselineProfileRef:
        tenant.tenantRef === "tenant:demo-gp"
          ? bundleRefs.candidateBaselineRef
          : `tbp_457_${tenant.shellObjectId}`,
      baselineHash: tenant.baselineHash,
      candidateBaselineHash: tenant.candidateBaselineHash,
      approvalState:
        scenarioState === "permission_denied"
          ? "metadata_only"
          : scenarioState === "stale"
            ? "revalidation_required"
            : tenant.approvalState,
      rowDriftState,
      cells,
      expandedPolicyRefs:
        scenarioState === "permission_denied" ? ["metadata-only"] : tenant.expandedPolicyRefs,
      evidenceRefs:
        scenarioState === "permission_denied"
          ? ["TENANT_CONFIG_SCOPE_DENIED"]
          : tenant.evidenceRefs,
      selected,
      preservedByFilter: false,
    } satisfies TenantBaselineMatrixRow;
  });
  const filteredRows = rows.filter((row) => rowMatchesFilter(row, matrixFilter));
  const selectedRow = rows.find((row) => row.selected);
  if (selectedRow && !filteredRows.some((row) => row.tenantRef === selectedRow.tenantRef)) {
    return [{ ...selectedRow, preservedByFilter: true }, ...filteredRows];
  }
  return filteredRows;
}

function buildDiffEntries(
  selectedDomainRef: TenantMatrixDomainRef,
  scenarioState: TenantGovernanceScenarioState,
): readonly TenantConfigDiffEntry[] {
  const gateState = normalizeGateForScenario(scenarioState);
  return tenantGovernanceMatrixDomains.map((domain) => {
    const template = cellTextByDomain[domain.domainRef];
    const blocked = gateState === "blocked" || gateState === "revalidation_required";
    return {
      domainRef: domain.domainRef,
      title: domain.label,
      beforeSummary: `${domain.label} live baseline remains ${template.exactValue}.`,
      afterSummary: `${domain.label} candidate becomes ${template.candidateValue}.`,
      baselineLiveValue:
        scenarioState === "permission_denied" ? "restricted baseline summary" : template.exactValue,
      candidateValue:
        scenarioState === "permission_denied"
          ? "restricted candidate summary"
          : template.effectiveValue,
      impactSummary:
        scenarioState === "stale"
          ? "Impact is frozen because watchlist and drift fence hashes no longer agree."
          : scenarioState === "blocked"
            ? "Impact contains compile-blocking findings and cannot be promoted."
            : `${domain.label} affects ${routeFamilies.join(", ")} and remains tied to the same compilation and simulation envelope.`,
      evidenceRefs: template.evidenceRefs,
      blockerRefs: blocked
        ? ["watchlist:requires-current-hash", "promotion:gate-not-satisfied"]
        : [],
      affectedRouteFamilies: routeFamilies,
      selected: domain.domainRef === selectedDomainRef,
    } satisfies TenantConfigDiffEntry;
  });
}

function baseFinding(
  findingRef: string,
  findingType: TenantGovernanceFindingType,
  severity: TenantGovernanceFindingSeverity,
  summary: string,
  ownerRef: string,
  replacementRef: string,
  deadline: string,
  watchlistHash: string,
): Omit<TenantGovernanceWatchlistFinding, "selected" | "compileGateState" | "promotionGateState"> {
  return {
    findingRef,
    findingType,
    severity,
    findingState:
      findingType === "standards_exception"
        ? "expired_reopened"
        : findingType === "legacy_reference"
          ? "open"
          : "open",
    ownerRef,
    replacementRef,
    deadline,
    affectedRouteFamilies: routeFamilies,
    affectedTenantScopes: tenantScopes,
    affectedChannels: liveChannels,
    affectedSimulations: simulations,
    watchlistHash,
    settlementRef: `gas_457_${findingRef.replace(/[^a-zA-Z0-9]+/g, "_")}`,
    actionLabel:
      findingType === "standards_exception"
        ? "request governed exception review"
        : "open governed resolution command",
    summary,
  };
}

function findingsForScenario(
  scenarioState: TenantGovernanceScenarioState,
  selectedFindingRef: string | null | undefined,
): readonly TenantGovernanceWatchlistFinding[] {
  if (scenarioState === "empty") return [];
  const watchlistHash =
    scenarioState === "blocked" ? bundleRefs.blockedWatchlistHash : bundleRefs.cleanWatchlistHash;
  const cleanGate = normalizeGateForScenario(scenarioState);
  const advisoryFindings = [
    baseFinding(
      "dlr_448_ff31ff03026ca54c",
      "dependency_lifecycle",
      "advisory",
      "NHS App dependency lifecycle remains supported but has a replacement path and owner deadline.",
      "owner:integration-platform",
      "replacement:nhs-app-oauth-v2",
      "2026-06-01T17:00:00.000Z",
      watchlistHash,
    ),
    baseFinding(
      "lrf_448_93f0632c919ffc8f",
      "legacy_reference",
      "legacy",
      "Legacy route reference remains visible until the replacement route contract is verified.",
      "owner:release-platform",
      "replacement:route-contract-v2",
      "2026-05-20T17:00:00.000Z",
      watchlistHash,
    ),
    baseFinding(
      "pca_448_da6737c9ef9e161c",
      "policy_compatibility",
      "advisory",
      "Minimum-necessary visibility compatibility must be reviewed against patient-record-preview.",
      "owner:governance-policy",
      "replacement:visibility-policy-v2",
      "2026-05-08T17:00:00.000Z",
      watchlistHash,
    ),
  ];
  const blockedFindings = [
    baseFinding(
      "dlr_448_93c44b386c95d0ba",
      "dependency_lifecycle",
      "blocking",
      "FHIR dependency lifecycle support is blocking promotion until the replacement path is accepted.",
      "owner:integration-platform",
      "replacement:fhir-r4-validated-client",
      "2026-05-03T17:00:00.000Z",
      watchlistHash,
    ),
    baseFinding(
      "lrf_448_37fad05f1db76880",
      "legacy_reference",
      "blocking",
      "Expired standards exception reopened the legacy route finding for the release surface.",
      "owner:release-platform",
      "replacement:release-route-contract-v2",
      "2026-04-20T12:00:00.000Z",
      watchlistHash,
    ),
    baseFinding(
      "ser_448_f2ab81680b2e482b",
      "standards_exception",
      "blocking",
      "Standards exception expired and must reopen linked findings before promotion can resume.",
      "owner:release-platform",
      "mitigation:route-contract-upgrade",
      "2026-04-20T12:00:00.000Z",
      watchlistHash,
    ),
  ];
  const driftFinding = baseFinding(
    "watchlist-drift-457",
    "watchlist_drift",
    "blocking",
    "Candidate, approval, and release watch hashes drifted after the review opened.",
    "owner:platform-governance",
    "replacement:revalidated-watchlist",
    "2026-04-28T17:00:00.000Z",
    "watchlist-hash:stale-457",
  );
  const scenarioFindings =
    scenarioState === "blocked"
      ? [...blockedFindings, ...advisoryFindings]
      : scenarioState === "stale"
        ? [driftFinding, ...advisoryFindings]
        : scenarioState === "permission_denied"
          ? [
              baseFinding(
                "tenant-config-scope-denied-457",
                "watchlist_drift",
                "blocking",
                "Tenant config details are hidden because the current role lacks tenant-config authority.",
                "owner:tenant-governance",
                "replacement:authorized-reviewer",
                "2026-04-28T17:00:00.000Z",
                "metadata-only",
              ),
            ]
          : scenarioState === "degraded"
            ? advisoryFindings
            : scenarioState === "settlement_pending"
              ? advisoryFindings
              : advisoryFindings;
  return scenarioFindings.map((finding) => ({
    ...finding,
    findingState:
      scenarioState === "permission_denied"
        ? "metadata_only"
        : finding.findingType === "standards_exception"
          ? "expired_reopened"
          : finding.findingState,
    compileGateState:
      finding.severity === "blocking" || scenarioState === "stale" || scenarioState === "blocked"
        ? normalizeGateForScenario(scenarioState, "blocked")
        : cleanGate,
    promotionGateState:
      finding.severity === "blocking" || scenarioState === "stale" || scenarioState === "blocked"
        ? normalizeGateForScenario(scenarioState, "blocked")
        : cleanGate,
    selected:
      finding.findingRef === selectedFindingRef ||
      (!selectedFindingRef && finding.findingRef === scenarioFindings[0]?.findingRef),
  }));
}

function buildPolicyPackHistory(
  selectedDomainRef: TenantMatrixDomainRef,
): readonly TenantPolicyPackHistoryRow[] {
  return policyPackHistory.map(([policyPackVersionId, packType]) => ({
    policyPackVersionId,
    tenantId: "tenant:demo-gp",
    packType,
    effectiveFrom: "2026-04-27T12:00:00.000Z",
    effectiveTo: "2026-10-27T12:00:00.000Z",
    changeSummaryRef: `change-summary:448:${packType}`,
    compatibilityRefs: [`compatibility:448:${packType}:canonical`],
    packHash: `${policyPackVersionId.replace("ppv_448_", "")}${packType.replace(/_/g, "")}`
      .padEnd(64, "0")
      .slice(0, 64),
    selected:
      (selectedDomainRef === "policy_packs" && packType === "routing") ||
      (selectedDomainRef === "pharmacy_overrides" && packType === "pharmacy") ||
      (selectedDomainRef === "visibility_access_policy" && packType === "visibility"),
  }));
}

function surfaceSummaryForScenario(
  scenarioState: TenantGovernanceScenarioState,
  selectedTenantLabel: string,
): string {
  switch (scenarioState) {
    case "empty":
      return "No tenant baselines match the current scope; the governance shell keeps watchlist and route posture available for lookup.";
    case "stale":
      return `${selectedTenantLabel} remains anchored, but watchlist and release tuple hashes drifted and require revalidation.`;
    case "degraded":
      return `${selectedTenantLabel} is review-only while dependency hygiene and migration posture remain advisory.`;
    case "blocked":
      return `${selectedTenantLabel} is blocked by standards/dependency findings; compile and promote controls stay frozen.`;
    case "permission_denied":
      return "Tenant config authority is denied for this role; the surface is metadata-only and hides effective values.";
    case "settlement_pending":
      return `${selectedTenantLabel} has compilation and simulation evidence, but approval and release-watch settlement are still pending.`;
    case "normal":
    default:
      return `${selectedTenantLabel} is bound to the same compilation record, simulation envelope, watchlist hash, and release tuple.`;
  }
}

export function createTenantGovernanceProjection(
  input: {
    readonly routePath?: string;
    readonly scenarioState?: string | null;
    readonly selectedTenantRef?: string | null;
    readonly selectedDomainRef?: string | null;
    readonly selectedFindingRef?: string | null;
    readonly matrixFilter?: string | null;
  } = {},
): TenantGovernanceProjection {
  const routeMode = tenantGovernanceRouteModeForPath(input.routePath ?? "/ops/governance/tenants");
  const scenarioState = normalizeTenantGovernanceScenarioState(input.scenarioState);
  const matrixFilter = normalizeTenantGovernanceMatrixFilter(input.matrixFilter);
  const selectedTenantRow = selectedTenant(input.selectedTenantRef);
  const selectedDomainRef = tenantGovernanceMatrixDomains.some(
    (domain) => domain.domainRef === input.selectedDomainRef,
  )
    ? (input.selectedDomainRef as TenantMatrixDomainRef)
    : "policy_packs";
  const bindingState = bindingStateForScenario(scenarioState);
  const actionControlState = actionControlForScenario(scenarioState);
  const watchlistState = watchlistStateForScenario(scenarioState);
  const watchlistHash =
    watchlistState === "blocked"
      ? bundleRefs.blockedWatchlistHash
      : watchlistState === "stale"
        ? "watchlist-hash:stale-457"
        : watchlistState === "metadata_only"
          ? "metadata-only"
          : bundleRefs.cleanWatchlistHash;
  const watchlistRef =
    watchlistState === "blocked" ? bundleRefs.blockedWatchlistRef : bundleRefs.cleanWatchlistRef;
  const compileGateState = normalizeGateForScenario(scenarioState);
  const promotionGateState = normalizeGateForScenario(scenarioState);
  const tenantBaselineMatrix = buildMatrixRows(
    scenarioState,
    matrixFilter,
    selectedTenantRow.tenantRef,
    selectedDomainRef,
  );
  const selectedMatrixRow =
    tenantBaselineMatrix.find((row) => row.selected) ??
    buildMatrixRows("normal", "all", selectedTenantRow.tenantRef, selectedDomainRef).find(
      (row) => row.selected,
    ) ??
    buildMatrixRows("normal", "all", baseTenants[0]!.tenantRef, selectedDomainRef)[0]!;
  const configDiffViewer = buildDiffEntries(selectedDomainRef, scenarioState);
  const selectedDiffEntry =
    configDiffViewer.find((entry) => entry.selected) ?? configDiffViewer[0]!;
  const findings = findingsForScenario(scenarioState, input.selectedFindingRef);
  const selectedFinding = findings.find((finding) => finding.selected) ?? findings[0] ?? null;
  const blockingFindingRefs = findings
    .filter((finding) => finding.severity === "blocking")
    .map((finding) => finding.findingRef);
  const advisoryFindingRefs = findings
    .filter((finding) => finding.severity !== "blocking")
    .map((finding) => finding.findingRef);
  const permissionDenied = scenarioState === "permission_denied";
  const staleOrBlocked = scenarioState === "stale" || scenarioState === "blocked";
  const settlementPending = scenarioState === "settlement_pending";
  const migrationTupleHash =
    scenarioState === "stale" || scenarioState === "blocked"
      ? `${bundleRefs.migrationExecutionTupleHash}:drift`
      : bundleRefs.migrationExecutionTupleHash;

  const scopeStrip: TenantGovernanceScopeStrip = {
    tenantRef: selectedMatrixRow.tenantRef,
    tenantLabel: selectedMatrixRow.tenantLabel,
    organisationRef: "org:platform-governance",
    environmentRef: "environment:production",
    scopeTupleHash: permissionDenied ? "metadata-only" : bundleRefs.scopeTupleHash,
    liveBundleHash: permissionDenied ? "metadata-only" : bundleRefs.liveBundleHash,
    candidateBundleHash: permissionDenied ? "metadata-only" : bundleRefs.candidateBundleHash,
    reviewPackageHash: permissionDenied ? "metadata-only" : bundleRefs.reviewPackageHash,
    configCompilationRecordRef: permissionDenied
      ? "metadata-only"
      : bundleRefs.compilationRecordRef,
    configSimulationEnvelopeRef: permissionDenied
      ? "metadata-only"
      : bundleRefs.simulationEnvelopeRef,
    watchlistRef: permissionDenied ? "metadata-only" : watchlistRef,
    watchlistHash,
    releaseFreezeTupleHash: permissionDenied ? "metadata-only" : bundleRefs.releaseFreezeTupleHash,
    freshnessState:
      scenarioState === "stale"
        ? "stale"
        : scenarioState === "blocked"
          ? "blocked"
          : permissionDenied
            ? "metadata_only"
            : "current",
    bindingState,
    actionControlState,
    summary: surfaceSummaryForScenario(scenarioState, selectedMatrixRow.tenantLabel),
  };

  const standardsWatchlist: TenantStandardsWatchlistProjection = {
    standardsDependencyWatchlistRef: scopeStrip.watchlistRef,
    watchlistState,
    candidateBundleHash: scopeStrip.candidateBundleHash,
    liveBundleHash: scopeStrip.liveBundleHash,
    standardsBaselineMapRef: permissionDenied
      ? "metadata-only"
      : bundleRefs.standardsBaselineMapRef,
    compileGateState,
    promotionGateState,
    watchlistHash,
    blockingFindingRefs,
    advisoryFindingRefs,
    affectedRouteFamilyRefs: permissionDenied ? [] : routeFamilies,
    affectedTenantScopeRefs: permissionDenied ? [] : tenantScopes,
    affectedSurfaceSchemaRefs: permissionDenied ? [] : surfaceSchemas,
    affectedLiveChannelRefs: permissionDenied ? [] : liveChannels,
    affectedSimulationRefs: permissionDenied ? [] : simulations,
    findings,
  };

  const promotionApprovalStatus: TenantPromotionApprovalStatus = {
    configCompilationRecordRef: scopeStrip.configCompilationRecordRef,
    configSimulationEnvelopeRef: scopeStrip.configSimulationEnvelopeRef,
    compiledPolicyBundleRef: permissionDenied
      ? "metadata-only"
      : bundleRefs.compiledPolicyBundleRef,
    compileGateState,
    simulationReadinessState: normalizeGateForScenario(
      scenarioState,
      scenarioState === "degraded" ? "review_required" : "pass",
    ),
    promotionReadinessState:
      scenarioState === "normal" ? "review_required" : normalizeGateForScenario(scenarioState),
    approvalEvidenceRefs: permissionDenied
      ? ["TENANT_CONFIG_ROLE_DENIED"]
      : ["approval-evidence:448", "release-freeze:448", watchlistHash],
    compilationTupleHash: permissionDenied ? "metadata-only" : bundleRefs.compilationTupleHash,
    standardsWatchlistHash: watchlistHash,
    migrationExecutionTupleHash: permissionDenied ? "metadata-only" : migrationTupleHash,
    blockerRefs:
      scenarioState === "normal"
        ? ["approval:review-required", "release-watch:settlement-required"]
        : scenarioState === "degraded"
          ? ["dependency:hygiene-advisory", "migration:backfill-observation-required"]
          : scenarioState === "settlement_pending"
            ? ["governance-action-settlement:pending", "release-watch:wave-observation-pending"]
            : staleOrBlocked
              ? [
                  "migration:execution-tuple-drift",
                  "standards-watchlist:approval-hash-drift",
                  ...blockingFindingRefs,
                ]
              : permissionDenied
                ? ["authorization:TENANT_CONFIG_ROLE_DENIED"]
                : [],
    releaseApprovalFreezeRef: permissionDenied ? "metadata-only" : "release-freeze:448",
  };

  const releaseWatchStatus: TenantReleaseWatchStatus = {
    releaseFreezeTupleRef: permissionDenied ? "metadata-only" : "release-freeze-tuple:457",
    releaseFreezeTupleHash: scopeStrip.releaseFreezeTupleHash,
    releaseWatchTupleRef: permissionDenied
      ? "metadata-only"
      : "release-watch-tuple:457:tenant-config",
    waveObservationRef: permissionDenied ? "metadata-only" : "wave-observation:457:blue-42",
    waveSettlementState: permissionDenied
      ? "metadata_only"
      : scenarioState === "settlement_pending"
        ? "pending"
        : staleOrBlocked
          ? "blocked"
          : "settled",
    recoveryDispositionRefs:
      scenarioState === "blocked" || scenarioState === "stale"
        ? ["recovery-disposition:watchlist-revalidation", "rollback-ready:blue-42"]
        : [],
    rollbackReadinessState: normalizeGateForScenario(
      scenarioState,
      scenarioState === "normal" ? "review_required" : "pass",
    ),
    activeReleaseWatchState: promotionGateState,
    summary:
      scenarioState === "settlement_pending"
        ? "Release watch is observing the same freeze tuple while wave settlement completes."
        : staleOrBlocked
          ? "Release watch is frozen until watchlist, migration, and approval hashes revalidate."
          : "Release watch is bound to the same compilation, simulation, watchlist, and migration tuple.",
  };

  const migrationPosture: TenantMigrationPosture = {
    migrationExecutionBindingRef: permissionDenied
      ? "metadata-only"
      : "migration-execution-binding:448",
    migrationExecutionTupleHash: permissionDenied ? "metadata-only" : migrationTupleHash,
    readPathCompatibilityDigestRef: permissionDenied
      ? "metadata-only"
      : "read-path-compatibility:448",
    projectionBackfillLedgerRef: permissionDenied
      ? "metadata-only"
      : "projection-backfill-ledger:448",
    readPathCompatibilityState: normalizeGateForScenario(
      scenarioState,
      scenarioState === "normal" ? "review_required" : "pass",
    ),
    projectionBackfillState:
      scenarioState === "settlement_pending"
        ? "settlement_pending"
        : normalizeGateForScenario(scenarioState, "review_required"),
    backfillWindow:
      scenarioState === "empty"
        ? "no active window"
        : "2026-04-27T13:00:00.000Z/PT4H governed observation",
    blockerRefs:
      scenarioState === "normal"
        ? ["projection-backfill:observation-required"]
        : scenarioState === "settlement_pending"
          ? ["projection-backfill:settlement-pending"]
          : staleOrBlocked
            ? ["migration:execution-tuple-drift"]
            : [],
  };

  const allPromotionRequirementsSatisfied =
    compileGateState === "pass" &&
    promotionApprovalStatus.simulationReadinessState === "pass" &&
    promotionApprovalStatus.promotionReadinessState === "pass" &&
    migrationPosture.readPathCompatibilityState === "pass" &&
    migrationPosture.projectionBackfillState === "pass" &&
    releaseWatchStatus.waveSettlementState === "settled" &&
    blockingFindingRefs.length === 0;
  const canRevalidate = scenarioState === "stale";
  const canApproveException =
    scenarioState === "normal" &&
    advisoryFindingRefs.length > 0 &&
    blockingFindingRefs.length === 0;

  return {
    taskId: TENANT_GOVERNANCE_TASK_ID,
    schemaVersion: TENANT_GOVERNANCE_SCHEMA_VERSION,
    upstreamSchemaVersions,
    route: routeForMode(routeMode),
    routeMode,
    scenarioState,
    matrixFilter,
    selectedTenantRef: selectedMatrixRow.tenantRef,
    selectedShellObjectId: selectedMatrixRow.shellObjectId,
    selectedDomainRef,
    selectedFindingRef: selectedFinding?.findingRef ?? "",
    bindingState,
    actionControlState,
    watchlistState,
    surfaceSummary: scopeStrip.summary,
    scopeStrip,
    matrixDomains: tenantGovernanceMatrixDomains,
    tenantBaselineMatrix,
    selectedMatrixRow,
    configDiffViewer,
    selectedDiffEntry,
    policyPackHistory: buildPolicyPackHistory(selectedDomainRef),
    standardsWatchlist,
    selectedFinding,
    legacyReferenceFindings: findings.filter(
      (finding) => finding.findingType === "legacy_reference",
    ),
    policyCompatibilityAlerts: findings.filter(
      (finding) => finding.findingType === "policy_compatibility",
    ),
    standardsExceptions: findings.filter(
      (finding) => finding.findingType === "standards_exception",
    ),
    promotionApprovalStatus,
    releaseWatchStatus,
    migrationPosture,
    actionRail: [
      {
        actionType: "compile_candidate",
        label: "compile candidate",
        allowed: allPromotionRequirementsSatisfied,
        gateState: compileGateState,
        settlementRef: "gas_457_compile_candidate",
        disabledReason: allPromotionRequirementsSatisfied
          ? "All compilation prerequisites are satisfied."
          : "Compile requires current compilation, simulation, watchlist hash, migration/backfill posture, approval evidence, and release tuple parity.",
      },
      {
        actionType: "promote_bundle",
        label: "promote bundle",
        allowed: allPromotionRequirementsSatisfied,
        gateState: promotionGateState,
        settlementRef: "gas_457_promote_bundle",
        disabledReason: allPromotionRequirementsSatisfied
          ? "Promotion is available for the exact candidate and watchlist hashes."
          : "Promotion stays frozen until compilation, simulation, watchlist, approvals, migration/backfill, continuity evidence, and release watch settle.",
      },
      {
        actionType: "approve_exception",
        label: "approve exception review",
        allowed: canApproveException,
        gateState: canApproveException
          ? "review_required"
          : normalizeGateForScenario(scenarioState),
        settlementRef: "gas_457_exception_review",
        disabledReason: canApproveException
          ? "Exception review must be settled through GovernanceActionSettlement."
          : "Exception approval is unavailable for blocked, stale, denied, empty, or pending settlement posture.",
      },
      {
        actionType: "revalidate_watchlist",
        label: "revalidate watchlist",
        allowed: canRevalidate,
        gateState: canRevalidate
          ? "revalidation_required"
          : normalizeGateForScenario(scenarioState),
        settlementRef: "gas_457_revalidate_watchlist",
        disabledReason: canRevalidate
          ? "Revalidation command will mint a fresh StandardsDependencyWatchlist hash."
          : "Revalidation is only available when the selected watchlist is stale.",
      },
      {
        actionType: "return_to_ops",
        label: "return to ops handoff",
        allowed: scenarioState !== "permission_denied",
        gateState: scenarioState === "permission_denied" ? "blocked" : "review_required",
        settlementRef: "return-intent:ops:tenant-governance",
        disabledReason:
          scenarioState === "permission_denied"
            ? "Return handoff is hidden until tenant-config authority is available."
            : "Return intent preserves selected tenant, domain, watchlist, and release tuple context.",
      },
    ],
    automationAnchors: tenantGovernanceAutomationAnchors,
    sourceAlgorithmRefs,
    noInterfaceGapRequired: true,
  };
}

export function createTenantGovernanceFixture() {
  const scenarioProjections = Object.fromEntries(
    tenantGovernanceScenarioStates.map((scenarioState) => [
      scenarioState,
      createTenantGovernanceProjection({ scenarioState }),
    ]),
  ) as Record<TenantGovernanceScenarioState, TenantGovernanceProjection>;
  const routeProjections = Object.fromEntries(
    tenantGovernanceRoutes.map((route) => [
      tenantGovernanceRouteModeForPath(route),
      createTenantGovernanceProjection({ routePath: route }),
    ]),
  ) as Record<TenantGovernanceRouteMode, TenantGovernanceProjection>;

  return {
    taskId: TENANT_GOVERNANCE_TASK_ID,
    schemaVersion: TENANT_GOVERNANCE_SCHEMA_VERSION,
    routes: tenantGovernanceRoutes,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors: tenantGovernanceAutomationAnchors,
    scenarioProjections,
    routeProjections,
    noInterfaceGapRequired: true,
  };
}
