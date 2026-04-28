import { hashAssurancePayload, orderedSetHash } from "./phase9-assurance-ledger-contracts";
import { PHASE9_GOVERNANCE_CONTRACT_VERSION } from "./phase9-governance-control-contracts";
import { PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION } from "./phase9-incident-reportability-workflow";

export const PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION = "448.phase9.tenant-config-governance.v1";

export type TenantApprovalState = "draft" | "approved" | "blocked" | "superseded";
export type ConfigChangeType =
  | "create"
  | "update"
  | "approval"
  | "promote"
  | "rollback"
  | "supersede";
export type PolicyPackType =
  | "routing"
  | "sla_eta"
  | "identity_grants"
  | "duplicate_policy"
  | "provider_overrides"
  | "waitlist_booking"
  | "hub_coordination"
  | "callback_messaging"
  | "pharmacy"
  | "communications"
  | "access"
  | "visibility"
  | "provider_capability_matrix"
  | "tenant_overrides";
export type DependencySupportState =
  | "supported"
  | "maintenance_only"
  | "deprecated"
  | "end_of_life"
  | "emergency_blocked";
export type LegacyRiskState = "none" | "watch" | "migration_required" | "blocked";
export type StandardsFrameworkCode =
  | "DSPT"
  | "DTAC"
  | "DCB0129"
  | "DCB0160"
  | "NHS_APP"
  | "FHIR"
  | "IM1";
export type CompileGateState = "pass" | "review_required" | "blocked";
export type PromotionGateState = "pass" | "review_required" | "blocked";
export type WatchlistState = "current" | "stale" | "superseded" | "blocked";
export type BaselineState = "exact" | "stale" | "missing" | "blocked";
export type DependencyLifecycleState = DependencySupportState;
export type PromotionImpact = "none" | "warn" | "compile_block" | "promotion_block";
export type FindingSeverity = "info" | "warn" | "compile_block" | "promotion_block";
export type FindingState = "open" | "excepted" | "resolved" | "superseded";
export type CompatibilityClass = "advisory" | "compile_blocking" | "promotion_blocking";
export type AlertState = "open" | "excepted" | "resolved" | "superseded";
export type StandardsExceptionState = "proposed" | "approved" | "expired" | "revoked";
export type ConfigCompileState = "ready" | "blocked" | "superseded";
export type ConfigReadinessState = "ready" | "blocked" | "invalidated" | "superseded";
export type PromotionReadinessState = "pass" | "blocked" | "invalidated";

export interface TenantConfigActorContext {
  readonly tenantId: string;
  readonly actorRef: string;
  readonly roleRefs: readonly string[];
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly idempotencyKey: string;
  readonly scopeTokenRef: string;
  readonly generatedAt: string;
}

export interface TenantBaselineProfile {
  readonly tenantBaselineProfileId: string;
  readonly tenantId: string;
  readonly enabledCapabilities: readonly string[];
  readonly policyPackRefs: readonly string[];
  readonly integrationRefs: readonly string[];
  readonly standardsVersionRefs: readonly string[];
  readonly approvalState: TenantApprovalState;
  readonly baselineHash: string;
  readonly createdAt: string;
}

export interface TenantBaselineDiffRow {
  readonly fieldName:
    | "enabledCapabilities"
    | "policyPackRefs"
    | "integrationRefs"
    | "standardsVersionRefs"
    | "approvalState";
  readonly diffType: "added" | "removed" | "changed";
  readonly liveValueRefs: readonly string[];
  readonly candidateValueRefs: readonly string[];
  readonly tenantId: string;
}

export interface ConfigVersion {
  readonly configVersionId: string;
  readonly tenantId: string;
  readonly scope: string;
  readonly hash: string;
  readonly parentVersionRef: string;
  readonly changedBy: string;
  readonly changedAt: string;
  readonly changeType: ConfigChangeType;
  readonly attestationRef: string;
  readonly reasonRef: string;
  readonly compilationRecordRef: string;
  readonly simulationEnvelopeRef: string;
  readonly configPayloadHash: string;
  readonly chainHash: string;
}

export interface PolicyPackVersion {
  readonly policyPackVersionId: string;
  readonly tenantId: string;
  readonly packType: PolicyPackType;
  readonly effectiveFrom: string;
  readonly effectiveTo: string;
  readonly changeSummaryRef: string;
  readonly compatibilityRefs: readonly string[];
  readonly packHash: string;
  readonly createdAt: string;
}

export interface DependencyRegistryEntry {
  readonly dependencyRegistryEntryId: string;
  readonly dependencyCode: string;
  readonly sourceAuthority: string;
  readonly currentVersion: string;
  readonly supportState: DependencySupportState;
  readonly legacyRiskState: LegacyRiskState;
  readonly replacementPathRef: string;
  readonly ownerRef: string;
  readonly recordedAt: string;
}

export interface StandardsChangeNotice {
  readonly noticeId: string;
  readonly frameworkCode: StandardsFrameworkCode;
  readonly currentVersionRef: string;
  readonly newVersionRef: string;
  readonly impactAssessmentRef: string;
  readonly ownerRef: string;
  readonly affectedTenantScopeRefs: readonly string[];
  readonly noticeHash: string;
  readonly createdAt: string;
}

export interface CompiledPolicyGuardrailClaims {
  readonly phiExposureGrantState: "none" | "public" | "superseded" | "mismatched";
  readonly patientBindingAssurance: "meets_required" | "below_required";
  readonly duplicateMergeControl: "canonical_replay" | "missing";
  readonly sameRequestAttachControl: "same_episode_confirmed_strict" | "missing";
  readonly closureDependencyState:
    | "clear"
    | "active_lease"
    | "pending_preemption"
    | "unresolved_reconciliation";
  readonly capacityReservationState: "held" | "missing_for_exclusive_slot";
  readonly pharmacyEvidenceState: "strongly_correlated" | "weakly_correlated";
  readonly evidenceAssimilationCoverage: "complete" | "bypassed";
  readonly visibilityMinimumNecessaryState: "within_policy" | "outside_policy";
  readonly providerChoiceState: "current" | "stale";
  readonly consentScopeState: "current" | "expired";
  readonly dispatchCorrelationState: "matched" | "mismatched";
  readonly assistiveSessionState: "valid" | "invalidated";
  readonly assistiveReviewVersionState: "current" | "drifted";
  readonly policyBundleChangeState: "unchanged" | "changed_after_suggestion";
}

export interface CompiledPolicyBundle {
  readonly bundleId: string;
  readonly tenantId: string;
  readonly domainPackRefs: readonly string[];
  readonly domainPackHashes: Record<string, string>;
  readonly subpackTupleRefs: readonly string[];
  readonly dependencyGraphHash: string;
  readonly requiredContinuityControlRefs: readonly string[];
  readonly continuityEvidenceContractRefs: readonly string[];
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly compatibilityState: "valid" | "invalid";
  readonly simulationEvidenceRef: string;
  readonly approvedBy: string;
  readonly approvedAt: string;
  readonly effectiveAt: string;
  readonly canaryScope: string;
  readonly rollbackRefs: readonly string[];
  readonly guardrailClaims: CompiledPolicyGuardrailClaims;
  readonly bundleHash: string;
}

export interface CompileGateVerdict {
  readonly candidateBundleHash: string;
  readonly compileGateState: CompileGateState;
  readonly blockerRefs: readonly string[];
  readonly advisoryRefs: readonly string[];
  readonly verdictHash: string;
}

export interface StandardsBaselineMap {
  readonly baselineMapId: string;
  readonly environmentRef: string;
  readonly tenantScopeRef: string;
  readonly candidateBundleHash: string;
  readonly liveBundleHash: string;
  readonly requiredStandardRefs: readonly string[];
  readonly standardsVersionRefs: readonly string[];
  readonly requiredByDateRefs: readonly string[];
  readonly blockingDeltaRefs: readonly string[];
  readonly affectedRouteFamilyRefs: readonly string[];
  readonly affectedTenantScopeRefs: readonly string[];
  readonly affectedSurfaceSchemaRefs: readonly string[];
  readonly affectedLiveChannelRefs: readonly string[];
  readonly affectedSimulationRefs: readonly string[];
  readonly watchlistRef: string;
  readonly watchlistHash: string;
  readonly baselineState: BaselineState;
  readonly generatedAt: string;
}

export interface DependencyLifecycleRecord {
  readonly dependencyLifecycleRecordId: string;
  readonly dependencyRef: string;
  readonly candidateBundleHash: string;
  readonly liveBundleHash: string;
  readonly ownerRef: string;
  readonly owningTeamRef: string;
  readonly lifecycleState: DependencyLifecycleState;
  readonly supportedUntil: string;
  readonly replacementRef: string;
  readonly remediationDueAt: string;
  readonly affectedRouteFamilyRefs: readonly string[];
  readonly affectedTenantScopeRefs: readonly string[];
  readonly affectedSurfaceSchemaRefs: readonly string[];
  readonly affectedLiveChannelRefs: readonly string[];
  readonly affectedSimulationRefs: readonly string[];
  readonly watchlistRef: string;
  readonly watchlistHash: string;
  readonly currentExceptionRefs: readonly string[];
  readonly promotionImpact: PromotionImpact;
  readonly recordState: "current" | "stale" | "superseded";
  readonly recordedAt: string;
}

export interface LegacyReferenceFinding {
  readonly legacyReferenceFindingId: string;
  readonly referenceClass: string;
  readonly candidateBundleHash: string;
  readonly liveBundleHash: string;
  readonly ownerRef: string;
  readonly replacementRef: string;
  readonly remediationDueAt: string;
  readonly affectedRouteRefs: readonly string[];
  readonly affectedRouteFamilyRefs: readonly string[];
  readonly affectedTenantScopeRefs: readonly string[];
  readonly affectedBundleRefs: readonly string[];
  readonly affectedSurfaceSchemaRefs: readonly string[];
  readonly affectedLiveChannelRefs: readonly string[];
  readonly affectedSimulationRefs: readonly string[];
  readonly watchlistRef: string;
  readonly watchlistHash: string;
  readonly findingSeverity: FindingSeverity;
  readonly migrationPathRef: string;
  readonly findingState: FindingState;
  readonly recordedAt: string;
}

export interface PolicyCompatibilityAlert {
  readonly policyCompatibilityAlertId: string;
  readonly candidateBundleHash: string;
  readonly liveBundleHash: string;
  readonly affectedPolicyDomains: readonly string[];
  readonly affectedSurfaceSchemas: readonly string[];
  readonly affectedRouteFamilyRefs: readonly string[];
  readonly affectedTenantScopeRefs: readonly string[];
  readonly affectedLiveChannelRefs: readonly string[];
  readonly affectedSimulationRefs: readonly string[];
  readonly ownerRef: string;
  readonly replacementRef: string;
  readonly remediationDueAt: string;
  readonly watchlistRef: string;
  readonly watchlistHash: string;
  readonly compatibilityClass: CompatibilityClass;
  readonly evidenceRefs: readonly string[];
  readonly recoveryActionRef: string;
  readonly linkedExceptionRef: string;
  readonly alertState: AlertState;
  readonly expiresAt: string;
}

export interface StandardsExceptionRecord {
  readonly standardsExceptionRecordId: string;
  readonly scopeRef: string;
  readonly candidateBundleHash: string;
  readonly liveBundleHash: string;
  readonly reviewPackageHash: string;
  readonly approvalTupleHash: string;
  readonly approvalEvidenceBundleRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly linkedFindingRefs: readonly string[];
  readonly affectedRouteFamilyRefs: readonly string[];
  readonly affectedTenantScopeRefs: readonly string[];
  readonly affectedSurfaceSchemaRefs: readonly string[];
  readonly affectedLiveChannelRefs: readonly string[];
  readonly affectedSimulationRefs: readonly string[];
  readonly watchlistRef: string;
  readonly watchlistHash: string;
  readonly justificationRef: string;
  readonly mitigationRef: string;
  readonly ownerRef: string;
  readonly approvedByRef: string;
  readonly approvedAt: string;
  readonly expiresAt: string;
  readonly revokedAt: string;
  readonly requiredReopenFindingRefs: readonly string[];
  readonly exceptionState: StandardsExceptionState;
}

export interface StandardsDependencyWatchlist {
  readonly standardsDependencyWatchlistId: string;
  readonly candidateBundleHash: string;
  readonly liveBundleHash: string;
  readonly environmentRef: string;
  readonly tenantScopeRef: string;
  readonly scopeTupleHash: string;
  readonly reviewPackageHash: string;
  readonly standardsBaselineMapRef: string;
  readonly dependencyLifecycleRecordRefs: readonly string[];
  readonly legacyReferenceFindingRefs: readonly string[];
  readonly policyCompatibilityAlertRefs: readonly string[];
  readonly standardsExceptionRecordRefs: readonly string[];
  readonly affectedRouteFamilyRefs: readonly string[];
  readonly affectedTenantScopeRefs: readonly string[];
  readonly affectedSurfaceSchemaRefs: readonly string[];
  readonly affectedLiveChannelRefs: readonly string[];
  readonly affectedSimulationRefs: readonly string[];
  readonly blockingFindingRefs: readonly string[];
  readonly advisoryFindingRefs: readonly string[];
  readonly compileGateState: CompileGateState;
  readonly promotionGateState: PromotionGateState;
  readonly watchlistState: WatchlistState;
  readonly watchlistHash: string;
  readonly generatedAt: string;
}

export interface ConfigCompilationRecord {
  readonly configCompilationRecordId: string;
  readonly workspaceContextRef: string;
  readonly changeEnvelopeRef: string;
  readonly baselineSnapshotRef: string;
  readonly baselineTupleHash: string;
  readonly candidateBundleHash: string;
  readonly candidateConfigVersionSet: readonly string[];
  readonly requiredCompiledPolicyDomains: readonly string[];
  readonly compiledPolicyBundleRef: string;
  readonly compiledDomainPackHashes: Record<string, string>;
  readonly referenceScenarioSetRef: string;
  readonly surfaceSchemaSetRef: string;
  readonly blastRadiusDigestRef: string;
  readonly continuityControlImpactDigestRef: string;
  readonly visibilityCoverageImpactDigestRef: string;
  readonly boundedContextImpactDigestRef: string;
  readonly policyCompatibilityAlertRefs: readonly string[];
  readonly standardsDependencyWatchlistRef: string;
  readonly standardsWatchlistHash: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly configDriftFenceRef: string;
  readonly simulationEnvelopeRef: string;
  readonly compileState: ConfigCompileState;
  readonly releaseFreezeReadinessState: Exclude<ConfigReadinessState, "superseded">;
  readonly compilationTupleHash: string;
  readonly compiledAt: string;
}

export interface ConfigSimulationEnvelope {
  readonly simulationEnvelopeId: string;
  readonly workspaceContextRef: string;
  readonly configCompilationRecordRef: string;
  readonly baselineTupleHash: string;
  readonly compiledPolicyBundleRef: string;
  readonly candidateBundleHash: string;
  readonly referenceScenarioSetRef: string;
  readonly surfaceSchemaSetRef: string;
  readonly compatibilityEvidenceRefs: readonly string[];
  readonly continuityEvidenceRefs: readonly string[];
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly blastRadiusDigestRef: string;
  readonly continuityControlImpactDigestRef: string;
  readonly visibilityCoverageImpactDigestRef: string;
  readonly boundedContextImpactDigestRef: string;
  readonly policyCompatibilityAlertRefs: readonly string[];
  readonly standardsDependencyWatchlistRef: string;
  readonly standardsWatchlistHash: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly configDriftFenceRef: string;
  readonly governanceReviewPackageRef: string;
  readonly reviewPackageHash: string;
  readonly continuityValidationState: "complete" | "stale" | "missing" | "blocked";
  readonly compileReadinessState: ConfigReadinessState;
  readonly releaseFreezeReadinessState: Exclude<ConfigReadinessState, "superseded">;
  readonly blockingReasonCodes: readonly string[];
  readonly compilationTupleHash: string;
  readonly generatedAt: string;
}

export interface PromotionReadinessAssessment {
  readonly promotionReadinessAssessmentId: string;
  readonly candidateBundleHash: string;
  readonly state: PromotionReadinessState;
  readonly blockerRefs: readonly string[];
  readonly compilationTupleHash: string;
  readonly standardsWatchlistHash: string;
  readonly migrationExecutionTupleHash: string;
  readonly assessmentHash: string;
  readonly assessedAt: string;
}

export interface Phase9TenantConfigGovernanceFixture {
  readonly schemaVersion: typeof PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION;
  readonly generatedAt: string;
  readonly upstreamGovernanceContractVersion: typeof PHASE9_GOVERNANCE_CONTRACT_VERSION;
  readonly upstreamIncidentWorkflowVersion: typeof PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly producedObjects: readonly string[];
  readonly apiSurface: readonly string[];
  readonly canonicalSchemaConflictGapRef: string;
  readonly liveBaseline: TenantBaselineProfile;
  readonly candidateBaseline: TenantBaselineProfile;
  readonly tenantDiffRows: readonly TenantBaselineDiffRow[];
  readonly rootConfigVersion: ConfigVersion;
  readonly childConfigVersion: ConfigVersion;
  readonly policyPackVersions: readonly PolicyPackVersion[];
  readonly validBundle: CompiledPolicyBundle;
  readonly validCompileVerdict: CompileGateVerdict;
  readonly visibilityBlockedVerdict: CompileGateVerdict;
  readonly staleProviderConsentVerdict: CompileGateVerdict;
  readonly staleAssistiveVerdict: CompileGateVerdict;
  readonly dependencyRegistryEntries: readonly DependencyRegistryEntry[];
  readonly dependencyLifecycleRecords: readonly DependencyLifecycleRecord[];
  readonly legacyReferenceFindings: readonly LegacyReferenceFinding[];
  readonly resolvedLegacyFinding: LegacyReferenceFinding;
  readonly policyCompatibilityAlert: PolicyCompatibilityAlert;
  readonly standardsChangeNotice: StandardsChangeNotice;
  readonly standardsBaselineMap: StandardsBaselineMap;
  readonly blockedWatchlist: StandardsDependencyWatchlist;
  readonly repeatedBlockedWatchlist: StandardsDependencyWatchlist;
  readonly cleanWatchlist: StandardsDependencyWatchlist;
  readonly expiredException: StandardsExceptionRecord;
  readonly reopenedFindingRefs: readonly string[];
  readonly compilationRecord: ConfigCompilationRecord;
  readonly simulationEnvelope: ConfigSimulationEnvelope;
  readonly promotionReadyAssessment: PromotionReadinessAssessment;
  readonly approvalBypassAssessment: PromotionReadinessAssessment;
  readonly promotionDriftAssessment: PromotionReadinessAssessment;
  readonly tenantDeniedErrorCode: string;
  readonly authorizationDeniedErrorCode: string;
  readonly replayHash: string;
}

export class Phase9TenantConfigGovernanceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9TenantConfigGovernanceError";
    this.code = code;
  }
}

function fail(code: string, message: string): never {
  throw new Phase9TenantConfigGovernanceError(code, message);
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    fail(code, message);
  }
}

function sortedUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function governanceHash(value: unknown, namespace = "phase9.448.tenant-config"): string {
  return hashAssurancePayload(value, namespace);
}

function toMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  invariant(
    !Number.isNaN(parsed),
    "TENANT_CONFIG_INVALID_TIMESTAMP",
    `Invalid timestamp ${timestamp}.`,
  );
  return parsed;
}

function requireTenantConfigActor(actor: TenantConfigActorContext, action: string): void {
  invariant(
    actor.roleRefs.some((role) =>
      ["tenant_governance_admin", "platform_governance", "release_manager"].includes(role),
    ),
    "TENANT_CONFIG_ROLE_DENIED",
    `${action} requires tenant governance or release role.`,
  );
  invariant(
    actor.purposeOfUseRef.startsWith("governance:tenant-config") ||
      actor.purposeOfUseRef.startsWith("assurance:tenant-governance"),
    "TENANT_CONFIG_PURPOSE_DENIED",
    `${action} requires tenant configuration purpose-of-use.`,
  );
  invariant(
    actor.reasonRef.length > 0,
    "TENANT_CONFIG_REASON_REQUIRED",
    `${action} requires a reason.`,
  );
  invariant(
    actor.idempotencyKey.length > 0,
    "TENANT_CONFIG_IDEMPOTENCY_REQUIRED",
    `${action} requires an idempotency key.`,
  );
  invariant(
    actor.scopeTokenRef.includes(actor.tenantId),
    "TENANT_CONFIG_SCOPE_DENIED",
    `${action} requires a tenant-bound scope token.`,
  );
}

function requireScopeMatchesTenant(actor: TenantConfigActorContext, scope: string): void {
  invariant(
    scope.includes(actor.tenantId),
    "TENANT_CONFIG_SCOPE_DENIED",
    "Config scope must be bound to actor tenant.",
  );
}

function packCoversRequiredDomains(packs: readonly PolicyPackVersion[]): boolean {
  const required: readonly PolicyPackType[] = [
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
  ];
  const seen = new Set(packs.map((pack) => pack.packType));
  return required.every((packType) => seen.has(packType));
}

function impactRank(impact: PromotionImpact): number {
  return { none: 0, warn: 1, compile_block: 3, promotion_block: 4 }[impact];
}

function severityRank(severity: FindingSeverity): number {
  return { info: 0, warn: 1, compile_block: 3, promotion_block: 4 }[severity];
}

function isExceptionCurrent(exception: StandardsExceptionRecord, at: string): boolean {
  return (
    exception.exceptionState === "approved" &&
    !exception.revokedAt &&
    toMs(exception.expiresAt) > toMs(at)
  );
}

export class Phase9TenantConfigGovernanceService {
  createTenantBaselineProfile(input: {
    readonly actor: TenantConfigActorContext;
    readonly enabledCapabilities: readonly string[];
    readonly policyPackRefs: readonly string[];
    readonly integrationRefs: readonly string[];
    readonly standardsVersionRefs: readonly string[];
    readonly approvalState: TenantApprovalState;
  }): TenantBaselineProfile {
    requireTenantConfigActor(input.actor, "createTenantBaselineProfile");
    const base = {
      tenantId: input.actor.tenantId,
      enabledCapabilities: sortedUnique(input.enabledCapabilities),
      policyPackRefs: sortedUnique(input.policyPackRefs),
      integrationRefs: sortedUnique(input.integrationRefs),
      standardsVersionRefs: sortedUnique(input.standardsVersionRefs),
      approvalState: input.approvalState,
      idempotencyKey: input.actor.idempotencyKey,
    };
    const baselineHash = governanceHash(base, "phase9.448.tenant-baseline.hash");
    return {
      tenantBaselineProfileId: `tbp_448_${baselineHash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      enabledCapabilities: base.enabledCapabilities,
      policyPackRefs: base.policyPackRefs,
      integrationRefs: base.integrationRefs,
      standardsVersionRefs: base.standardsVersionRefs,
      approvalState: input.approvalState,
      baselineHash,
      createdAt: input.actor.generatedAt,
    };
  }

  listTenantBaselineDiff(input: {
    readonly liveProfile: TenantBaselineProfile;
    readonly candidateProfile: TenantBaselineProfile;
  }): readonly TenantBaselineDiffRow[] {
    invariant(
      input.liveProfile.tenantId === input.candidateProfile.tenantId,
      "TENANT_CONFIG_DIFF_TENANT_MISMATCH",
      "Tenant baseline diff requires matching tenant.",
    );
    const rows: TenantBaselineDiffRow[] = [];
    for (const fieldName of [
      "enabledCapabilities",
      "policyPackRefs",
      "integrationRefs",
      "standardsVersionRefs",
    ] as const) {
      const live = sortedUnique(input.liveProfile[fieldName]);
      const candidate = sortedUnique(input.candidateProfile[fieldName]);
      const added = candidate.filter((value) => !live.includes(value));
      const removed = live.filter((value) => !candidate.includes(value));
      if (added.length > 0) {
        rows.push({
          fieldName,
          diffType: "added",
          liveValueRefs: live,
          candidateValueRefs: added,
          tenantId: input.liveProfile.tenantId,
        });
      }
      if (removed.length > 0) {
        rows.push({
          fieldName,
          diffType: "removed",
          liveValueRefs: removed,
          candidateValueRefs: candidate,
          tenantId: input.liveProfile.tenantId,
        });
      }
    }
    if (input.liveProfile.approvalState !== input.candidateProfile.approvalState) {
      rows.push({
        fieldName: "approvalState",
        diffType: "changed",
        liveValueRefs: [input.liveProfile.approvalState],
        candidateValueRefs: [input.candidateProfile.approvalState],
        tenantId: input.liveProfile.tenantId,
      });
    }
    return rows.sort((left, right) => left.fieldName.localeCompare(right.fieldName));
  }

  createConfigVersion(input: {
    readonly actor: TenantConfigActorContext;
    readonly scope: string;
    readonly parentVersion?: ConfigVersion;
    readonly changeType: ConfigChangeType;
    readonly attestationRef?: string;
    readonly compilationRecordRef: string;
    readonly simulationEnvelopeRef: string;
    readonly payload: unknown;
  }): ConfigVersion {
    requireTenantConfigActor(input.actor, "createConfigVersion");
    requireScopeMatchesTenant(input.actor, input.scope);
    const requiresAttestation = input.changeType === "approval" || input.changeType === "promote";
    invariant(
      !requiresAttestation || Boolean(input.attestationRef),
      "TENANT_CONFIG_ATTESTATION_REQUIRED",
      "Approval and promotion config versions require attestation.",
    );
    const configPayloadHash = governanceHash(input.payload, "phase9.448.config.payload");
    const parentVersionRef = input.parentVersion?.configVersionId ?? "config-version:genesis";
    const base = {
      tenantId: input.actor.tenantId,
      scope: input.scope,
      parentVersionRef,
      parentHash: input.parentVersion?.hash ?? "0".repeat(64),
      changedBy: input.actor.actorRef,
      changedAt: input.actor.generatedAt,
      changeType: input.changeType,
      attestationRef: input.attestationRef ?? "attestation:not-required",
      reasonRef: input.actor.reasonRef,
      compilationRecordRef: input.compilationRecordRef,
      simulationEnvelopeRef: input.simulationEnvelopeRef,
      configPayloadHash,
    };
    const hash = governanceHash(base, "phase9.448.config-version.hash");
    const chainHash = orderedSetHash(
      [
        base.parentHash,
        hash,
        configPayloadHash,
        input.compilationRecordRef,
        input.simulationEnvelopeRef,
      ],
      "phase9.448.config-version.chain",
    );
    return {
      configVersionId: `cv_448_${hash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      scope: input.scope,
      hash,
      parentVersionRef,
      changedBy: input.actor.actorRef,
      changedAt: input.actor.generatedAt,
      changeType: input.changeType,
      attestationRef: base.attestationRef,
      reasonRef: input.actor.reasonRef,
      compilationRecordRef: input.compilationRecordRef,
      simulationEnvelopeRef: input.simulationEnvelopeRef,
      configPayloadHash,
      chainHash,
    };
  }

  listConfigHistory(input: {
    readonly tenantId: string;
    readonly versions: readonly ConfigVersion[];
  }): readonly ConfigVersion[] {
    return input.versions
      .filter((version) => version.tenantId === input.tenantId)
      .sort(
        (left, right) =>
          left.changedAt.localeCompare(right.changedAt) ||
          Number(left.parentVersionRef !== "config-version:genesis") -
            Number(right.parentVersionRef !== "config-version:genesis") ||
          left.configVersionId.localeCompare(right.configVersionId),
      );
  }

  createPolicyPackVersion(input: {
    readonly actor: TenantConfigActorContext;
    readonly packType: PolicyPackType;
    readonly effectiveFrom: string;
    readonly effectiveTo: string;
    readonly changeSummaryRef: string;
    readonly compatibilityRefs: readonly string[];
  }): PolicyPackVersion {
    requireTenantConfigActor(input.actor, "createPolicyPackVersion");
    const base = {
      tenantId: input.actor.tenantId,
      packType: input.packType,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      changeSummaryRef: input.changeSummaryRef,
      compatibilityRefs: sortedUnique(input.compatibilityRefs),
    };
    const packHash = governanceHash(base, "phase9.448.policy-pack.hash");
    return {
      policyPackVersionId: `ppv_448_${packHash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      packType: input.packType,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      changeSummaryRef: input.changeSummaryRef,
      compatibilityRefs: base.compatibilityRefs,
      packHash,
      createdAt: input.actor.generatedAt,
    };
  }

  listPolicyPackHistory(input: {
    readonly tenantId: string;
    readonly packs: readonly PolicyPackVersion[];
    readonly packType?: PolicyPackType;
  }): readonly PolicyPackVersion[] {
    return input.packs
      .filter((pack) => pack.tenantId === input.tenantId)
      .filter((pack) => !input.packType || pack.packType === input.packType)
      .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom));
  }

  createCompiledPolicyBundle(input: {
    readonly actor: TenantConfigActorContext;
    readonly domainPacks: readonly PolicyPackVersion[];
    readonly subpackTupleRefs: readonly string[];
    readonly requiredContinuityControlRefs: readonly string[];
    readonly continuityEvidenceContractRefs: readonly string[];
    readonly releaseContractVerificationMatrixRef: string;
    readonly releaseContractMatrixHash: string;
    readonly compatibilityState: "valid" | "invalid";
    readonly simulationEvidenceRef: string;
    readonly effectiveAt: string;
    readonly canaryScope: string;
    readonly rollbackRefs: readonly string[];
    readonly guardrailClaims: CompiledPolicyGuardrailClaims;
  }): CompiledPolicyBundle {
    requireTenantConfigActor(input.actor, "createCompiledPolicyBundle");
    invariant(
      packCoversRequiredDomains(input.domainPacks),
      "TENANT_CONFIG_POLICY_PACK_COVERAGE_BLOCKED",
      "CompiledPolicyBundle requires all canonical policy pack families.",
    );
    const domainPackHashes = Object.fromEntries(
      input.domainPacks
        .map((pack) => [pack.packType, pack.packHash] as const)
        .sort(([left], [right]) => left.localeCompare(right)),
    );
    const withoutHash = {
      tenantId: input.actor.tenantId,
      domainPackRefs: input.domainPacks.map((pack) => pack.policyPackVersionId).sort(),
      domainPackHashes,
      subpackTupleRefs: sortedUnique(input.subpackTupleRefs),
      dependencyGraphHash: orderedSetHash(
        Object.values(domainPackHashes),
        "phase9.448.bundle.dependency-graph",
      ),
      requiredContinuityControlRefs: sortedUnique(input.requiredContinuityControlRefs),
      continuityEvidenceContractRefs: sortedUnique(input.continuityEvidenceContractRefs),
      releaseContractVerificationMatrixRef: input.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.releaseContractMatrixHash,
      compatibilityState: input.compatibilityState,
      simulationEvidenceRef: input.simulationEvidenceRef,
      approvedBy: input.actor.actorRef,
      approvedAt: input.actor.generatedAt,
      effectiveAt: input.effectiveAt,
      canaryScope: input.canaryScope,
      rollbackRefs: sortedUnique(input.rollbackRefs),
      guardrailClaims: input.guardrailClaims,
    };
    const bundleHash = governanceHash(withoutHash, "phase9.448.compiled-policy-bundle.hash");
    return {
      bundleId: `cpb_448_${bundleHash.slice(0, 16)}`,
      ...withoutHash,
      bundleHash,
    };
  }

  validateCompiledPolicyBundle(input: {
    readonly bundle: CompiledPolicyBundle;
  }): CompileGateVerdict {
    const claims = input.bundle.guardrailClaims;
    const blockerRefs: string[] = [];
    if (input.bundle.compatibilityState !== "valid") {
      blockerRefs.push("bundle:compatibility-invalid");
    }
    if (claims.phiExposureGrantState !== "none") {
      blockerRefs.push(`visibility:phi-exposure-grant:${claims.phiExposureGrantState}`);
    }
    if (claims.patientBindingAssurance !== "meets_required") {
      blockerRefs.push("identity:patient-binding-below-required-assurance");
    }
    if (claims.duplicateMergeControl !== "canonical_replay") {
      blockerRefs.push("duplicate:canonical-replay-missing");
    }
    if (claims.sameRequestAttachControl !== "same_episode_confirmed_strict") {
      blockerRefs.push("duplicate:same-request-attach-threshold-missing");
    }
    if (claims.closureDependencyState !== "clear") {
      blockerRefs.push(`closure:${claims.closureDependencyState}`);
    }
    if (claims.capacityReservationState !== "held") {
      blockerRefs.push("booking:exclusive-slot-without-held-reservation");
    }
    if (claims.pharmacyEvidenceState !== "strongly_correlated") {
      blockerRefs.push("pharmacy:auto-close-weak-evidence");
    }
    if (claims.evidenceAssimilationCoverage !== "complete") {
      blockerRefs.push("assimilation:canonical-path-bypassed");
    }
    if (claims.visibilityMinimumNecessaryState !== "within_policy") {
      blockerRefs.push("visibility:minimum-necessary-coverage-blocked");
    }
    if (claims.providerChoiceState !== "current") {
      blockerRefs.push("pharmacy:stale-provider-choice");
    }
    if (claims.consentScopeState !== "current") {
      blockerRefs.push("pharmacy:expired-consent-scope");
    }
    if (claims.dispatchCorrelationState !== "matched") {
      blockerRefs.push("pharmacy:dispatch-correlation-mismatch");
    }
    if (claims.assistiveSessionState !== "valid") {
      blockerRefs.push("assistive:session-invalidated");
    }
    if (claims.assistiveReviewVersionState !== "current") {
      blockerRefs.push("assistive:review-version-drift");
    }
    if (claims.policyBundleChangeState !== "unchanged") {
      blockerRefs.push("assistive:policy-bundle-changed-after-suggestion");
    }
    const verdictBase = {
      candidateBundleHash: input.bundle.bundleHash,
      blockerRefs: sortedUnique(blockerRefs),
      advisoryRefs: [] as readonly string[],
    };
    return {
      ...verdictBase,
      compileGateState: blockerRefs.length > 0 ? "blocked" : "pass",
      verdictHash: governanceHash(verdictBase, "phase9.448.compile-verdict.hash"),
    };
  }

  runDependencyHygieneScan(input: {
    readonly entries: readonly DependencyRegistryEntry[];
    readonly candidateBundleHash: string;
    readonly liveBundleHash: string;
    readonly watchlistRef: string;
    readonly watchlistHash: string;
    readonly affectedTenantScopeRefs: readonly string[];
    readonly affectedRouteFamilyRefs: readonly string[];
    readonly generatedAt: string;
  }): readonly DependencyLifecycleRecord[] {
    return input.entries
      .map((entry) => {
        const promotionImpact: PromotionImpact =
          entry.supportState === "emergency_blocked" || entry.legacyRiskState === "blocked"
            ? "compile_block"
            : entry.supportState === "end_of_life"
              ? "promotion_block"
              : entry.supportState === "deprecated" ||
                  entry.legacyRiskState === "migration_required"
                ? "warn"
                : "none";
        const base = {
          dependencyRef: entry.dependencyRegistryEntryId,
          candidateBundleHash: input.candidateBundleHash,
          liveBundleHash: input.liveBundleHash,
          promotionImpact,
          replacementRef: entry.replacementPathRef,
        };
        const recordHash = governanceHash(base, "phase9.448.dependency-lifecycle.id");
        return {
          dependencyLifecycleRecordId: `dlr_448_${recordHash.slice(0, 16)}`,
          dependencyRef: entry.dependencyRegistryEntryId,
          candidateBundleHash: input.candidateBundleHash,
          liveBundleHash: input.liveBundleHash,
          ownerRef: entry.ownerRef,
          owningTeamRef: `team:${entry.ownerRef}`,
          lifecycleState: entry.supportState,
          supportedUntil:
            entry.supportState === "supported"
              ? "2027-04-27T00:00:00.000Z"
              : "2026-06-30T00:00:00.000Z",
          replacementRef: entry.replacementPathRef,
          remediationDueAt:
            promotionImpact === "none" ? "2027-04-27T00:00:00.000Z" : "2026-05-31T17:00:00.000Z",
          affectedRouteFamilyRefs: sortedUnique(input.affectedRouteFamilyRefs),
          affectedTenantScopeRefs: sortedUnique(input.affectedTenantScopeRefs),
          affectedSurfaceSchemaRefs: ["surface-schema:governance-config"],
          affectedLiveChannelRefs: ["live-channel:web", "live-channel:ops-governance"],
          affectedSimulationRefs: ["simulation:reference-case:tenant-config"],
          watchlistRef: input.watchlistRef,
          watchlistHash: input.watchlistHash,
          currentExceptionRefs: [],
          promotionImpact,
          recordState: "current" as const,
          recordedAt: input.generatedAt,
        };
      })
      .sort(
        (left, right) =>
          impactRank(right.promotionImpact) - impactRank(left.promotionImpact) ||
          left.dependencyLifecycleRecordId.localeCompare(right.dependencyLifecycleRecordId),
      );
  }

  runLegacyReferenceScan(input: {
    readonly references: readonly {
      readonly referenceRef: string;
      readonly content: string;
      readonly ownerRef: string;
      readonly affectedRouteRefs: readonly string[];
      readonly affectedRouteFamilyRefs: readonly string[];
      readonly affectedTenantScopeRefs: readonly string[];
      readonly affectedBundleRefs: readonly string[];
      readonly affectedSurfaceSchemaRefs: readonly string[];
      readonly affectedLiveChannelRefs: readonly string[];
      readonly affectedSimulationRefs: readonly string[];
    }[];
    readonly candidateBundleHash: string;
    readonly liveBundleHash: string;
    readonly watchlistRef: string;
    readonly watchlistHash: string;
    readonly generatedAt: string;
  }): readonly LegacyReferenceFinding[] {
    const findings: LegacyReferenceFinding[] = [];
    for (const reference of input.references) {
      const content = reference.content.toLowerCase();
      const matched =
        content.includes("developer.nhs.uk") ||
        content.includes("fhir.nhs.uk") ||
        content.includes("route-contract:v0") ||
        content.includes("unsupported transport") ||
        content.includes("fax");
      if (!matched) {
        continue;
      }
      const referenceClass = content.includes("developer.nhs.uk")
        ? "retired_documentation_endpoint"
        : content.includes("fhir.nhs.uk")
          ? "obsolete_fhir_server"
          : content.includes("route-contract:v0")
            ? "stale_route_contract"
            : "unsupported_transport_assumption";
      const findingSeverity: FindingSeverity =
        referenceClass === "retired_documentation_endpoint" ||
        referenceClass === "obsolete_fhir_server"
          ? "compile_block"
          : referenceClass === "stale_route_contract"
            ? "promotion_block"
            : "warn";
      const base = {
        referenceRef: reference.referenceRef,
        referenceClass,
        candidateBundleHash: input.candidateBundleHash,
        affectedRouteRefs: sortedUnique(reference.affectedRouteRefs),
      };
      const findingHash = governanceHash(base, "phase9.448.legacy-finding.id");
      findings.push({
        legacyReferenceFindingId: `lrf_448_${findingHash.slice(0, 16)}`,
        referenceClass,
        candidateBundleHash: input.candidateBundleHash,
        liveBundleHash: input.liveBundleHash,
        ownerRef: reference.ownerRef,
        replacementRef: `replacement:${referenceClass}:current`,
        remediationDueAt: "2026-05-31T17:00:00.000Z",
        affectedRouteRefs: sortedUnique(reference.affectedRouteRefs),
        affectedRouteFamilyRefs: sortedUnique(reference.affectedRouteFamilyRefs),
        affectedTenantScopeRefs: sortedUnique(reference.affectedTenantScopeRefs),
        affectedBundleRefs: sortedUnique(reference.affectedBundleRefs),
        affectedSurfaceSchemaRefs: sortedUnique(reference.affectedSurfaceSchemaRefs),
        affectedLiveChannelRefs: sortedUnique(reference.affectedLiveChannelRefs),
        affectedSimulationRefs: sortedUnique(reference.affectedSimulationRefs),
        watchlistRef: input.watchlistRef,
        watchlistHash: input.watchlistHash,
        findingSeverity,
        migrationPathRef: `migration:${referenceClass}:canonical`,
        findingState: "open",
        recordedAt: input.generatedAt,
      });
    }
    return findings.sort(
      (left, right) =>
        severityRank(right.findingSeverity) - severityRank(left.findingSeverity) ||
        left.legacyReferenceFindingId.localeCompare(right.legacyReferenceFindingId),
    );
  }

  createPolicyCompatibilityAlert(input: {
    readonly candidateBundleHash: string;
    readonly liveBundleHash: string;
    readonly affectedPolicyDomains: readonly string[];
    readonly affectedSurfaceSchemas: readonly string[];
    readonly affectedRouteFamilyRefs: readonly string[];
    readonly affectedTenantScopeRefs: readonly string[];
    readonly affectedLiveChannelRefs: readonly string[];
    readonly affectedSimulationRefs: readonly string[];
    readonly ownerRef: string;
    readonly replacementRef: string;
    readonly remediationDueAt: string;
    readonly watchlistRef: string;
    readonly watchlistHash: string;
    readonly compatibilityClass: CompatibilityClass;
    readonly evidenceRefs: readonly string[];
    readonly recoveryActionRef: string;
    readonly linkedExceptionRef?: string;
    readonly expiresAt: string;
  }): PolicyCompatibilityAlert {
    const base = {
      candidateBundleHash: input.candidateBundleHash,
      affectedPolicyDomains: sortedUnique(input.affectedPolicyDomains),
      compatibilityClass: input.compatibilityClass,
      evidenceRefs: sortedUnique(input.evidenceRefs),
    };
    const alertHash = governanceHash(base, "phase9.448.policy-compatibility-alert.id");
    return {
      policyCompatibilityAlertId: `pca_448_${alertHash.slice(0, 16)}`,
      candidateBundleHash: input.candidateBundleHash,
      liveBundleHash: input.liveBundleHash,
      affectedPolicyDomains: sortedUnique(input.affectedPolicyDomains),
      affectedSurfaceSchemas: sortedUnique(input.affectedSurfaceSchemas),
      affectedRouteFamilyRefs: sortedUnique(input.affectedRouteFamilyRefs),
      affectedTenantScopeRefs: sortedUnique(input.affectedTenantScopeRefs),
      affectedLiveChannelRefs: sortedUnique(input.affectedLiveChannelRefs),
      affectedSimulationRefs: sortedUnique(input.affectedSimulationRefs),
      ownerRef: input.ownerRef,
      replacementRef: input.replacementRef,
      remediationDueAt: input.remediationDueAt,
      watchlistRef: input.watchlistRef,
      watchlistHash: input.watchlistHash,
      compatibilityClass: input.compatibilityClass,
      evidenceRefs: sortedUnique(input.evidenceRefs),
      recoveryActionRef: input.recoveryActionRef,
      linkedExceptionRef: input.linkedExceptionRef ?? "standards-exception:none",
      alertState: "open",
      expiresAt: input.expiresAt,
    };
  }

  createStandardsChangeNotice(input: {
    readonly actor: TenantConfigActorContext;
    readonly frameworkCode: StandardsFrameworkCode;
    readonly currentVersionRef: string;
    readonly newVersionRef: string;
    readonly impactAssessmentRef: string;
    readonly ownerRef: string;
    readonly affectedTenantScopeRefs: readonly string[];
  }): StandardsChangeNotice {
    requireTenantConfigActor(input.actor, "createStandardsChangeNotice");
    const base = {
      frameworkCode: input.frameworkCode,
      currentVersionRef: input.currentVersionRef,
      newVersionRef: input.newVersionRef,
      impactAssessmentRef: input.impactAssessmentRef,
      affectedTenantScopeRefs: sortedUnique(input.affectedTenantScopeRefs),
    };
    const noticeHash = governanceHash(base, "phase9.448.standards-change-notice");
    return {
      noticeId: `scn_448_${noticeHash.slice(0, 16)}`,
      frameworkCode: input.frameworkCode,
      currentVersionRef: input.currentVersionRef,
      newVersionRef: input.newVersionRef,
      impactAssessmentRef: input.impactAssessmentRef,
      ownerRef: input.ownerRef,
      affectedTenantScopeRefs: sortedUnique(input.affectedTenantScopeRefs),
      noticeHash,
      createdAt: input.actor.generatedAt,
    };
  }

  createStandardsBaselineMap(input: {
    readonly environmentRef: string;
    readonly tenantScopeRef: string;
    readonly candidateBundleHash: string;
    readonly liveBundleHash: string;
    readonly requiredStandardRefs: readonly string[];
    readonly standardsVersionRefs: readonly string[];
    readonly requiredByDateRefs: readonly string[];
    readonly blockingDeltaRefs: readonly string[];
    readonly affectedRouteFamilyRefs: readonly string[];
    readonly affectedTenantScopeRefs: readonly string[];
    readonly affectedSurfaceSchemaRefs: readonly string[];
    readonly affectedLiveChannelRefs: readonly string[];
    readonly affectedSimulationRefs: readonly string[];
    readonly watchlistRef: string;
    readonly watchlistHash: string;
    readonly baselineState: BaselineState;
    readonly generatedAt: string;
  }): StandardsBaselineMap {
    const base = {
      environmentRef: input.environmentRef,
      tenantScopeRef: input.tenantScopeRef,
      candidateBundleHash: input.candidateBundleHash,
      liveBundleHash: input.liveBundleHash,
      standardsVersionRefs: sortedUnique(input.standardsVersionRefs),
      blockingDeltaRefs: sortedUnique(input.blockingDeltaRefs),
    };
    const mapHash = governanceHash(base, "phase9.448.standards-baseline-map.id");
    return {
      baselineMapId: `sbm_448_${mapHash.slice(0, 16)}`,
      environmentRef: input.environmentRef,
      tenantScopeRef: input.tenantScopeRef,
      candidateBundleHash: input.candidateBundleHash,
      liveBundleHash: input.liveBundleHash,
      requiredStandardRefs: sortedUnique(input.requiredStandardRefs),
      standardsVersionRefs: sortedUnique(input.standardsVersionRefs),
      requiredByDateRefs: sortedUnique(input.requiredByDateRefs),
      blockingDeltaRefs: sortedUnique(input.blockingDeltaRefs),
      affectedRouteFamilyRefs: sortedUnique(input.affectedRouteFamilyRefs),
      affectedTenantScopeRefs: sortedUnique(input.affectedTenantScopeRefs),
      affectedSurfaceSchemaRefs: sortedUnique(input.affectedSurfaceSchemaRefs),
      affectedLiveChannelRefs: sortedUnique(input.affectedLiveChannelRefs),
      affectedSimulationRefs: sortedUnique(input.affectedSimulationRefs),
      watchlistRef: input.watchlistRef,
      watchlistHash: input.watchlistHash,
      baselineState: input.baselineState,
      generatedAt: input.generatedAt,
    };
  }

  createStandardsExceptionRecord(input: {
    readonly scopeRef: string;
    readonly candidateBundleHash: string;
    readonly liveBundleHash: string;
    readonly reviewPackageHash: string;
    readonly approvalTupleHash: string;
    readonly approvalEvidenceBundleRef: string;
    readonly releaseApprovalFreezeRef: string;
    readonly linkedFindingRefs: readonly string[];
    readonly affectedRouteFamilyRefs: readonly string[];
    readonly affectedTenantScopeRefs: readonly string[];
    readonly affectedSurfaceSchemaRefs: readonly string[];
    readonly affectedLiveChannelRefs: readonly string[];
    readonly affectedSimulationRefs: readonly string[];
    readonly watchlistRef: string;
    readonly watchlistHash: string;
    readonly justificationRef: string;
    readonly mitigationRef: string;
    readonly ownerRef: string;
    readonly approvedByRef: string;
    readonly approvedAt: string;
    readonly expiresAt: string;
    readonly revokedAt?: string;
    readonly exceptionState: StandardsExceptionState;
  }): StandardsExceptionRecord {
    const base = {
      scopeRef: input.scopeRef,
      candidateBundleHash: input.candidateBundleHash,
      linkedFindingRefs: sortedUnique(input.linkedFindingRefs),
      approvalTupleHash: input.approvalTupleHash,
      exceptionState: input.exceptionState,
    };
    const exceptionHash = governanceHash(base, "phase9.448.standards-exception.id");
    return {
      standardsExceptionRecordId: `ser_448_${exceptionHash.slice(0, 16)}`,
      scopeRef: input.scopeRef,
      candidateBundleHash: input.candidateBundleHash,
      liveBundleHash: input.liveBundleHash,
      reviewPackageHash: input.reviewPackageHash,
      approvalTupleHash: input.approvalTupleHash,
      approvalEvidenceBundleRef: input.approvalEvidenceBundleRef,
      releaseApprovalFreezeRef: input.releaseApprovalFreezeRef,
      linkedFindingRefs: sortedUnique(input.linkedFindingRefs),
      affectedRouteFamilyRefs: sortedUnique(input.affectedRouteFamilyRefs),
      affectedTenantScopeRefs: sortedUnique(input.affectedTenantScopeRefs),
      affectedSurfaceSchemaRefs: sortedUnique(input.affectedSurfaceSchemaRefs),
      affectedLiveChannelRefs: sortedUnique(input.affectedLiveChannelRefs),
      affectedSimulationRefs: sortedUnique(input.affectedSimulationRefs),
      watchlistRef: input.watchlistRef,
      watchlistHash: input.watchlistHash,
      justificationRef: input.justificationRef,
      mitigationRef: input.mitigationRef,
      ownerRef: input.ownerRef,
      approvedByRef: input.approvedByRef,
      approvedAt: input.approvedAt,
      expiresAt: input.expiresAt,
      revokedAt: input.revokedAt ?? "",
      requiredReopenFindingRefs: sortedUnique(input.linkedFindingRefs),
      exceptionState: input.exceptionState,
    };
  }

  resolveExceptOrSupersedeFinding(input: {
    readonly finding: LegacyReferenceFinding;
    readonly nextState: Extract<FindingState, "resolved" | "excepted" | "superseded">;
    readonly recordedAt: string;
    readonly linkedExceptionRef?: string;
  }): LegacyReferenceFinding {
    const updatedBase = {
      ...input.finding,
      findingState: input.nextState,
      recordedAt: input.recordedAt,
      migrationPathRef:
        input.nextState === "excepted" && input.linkedExceptionRef
          ? input.linkedExceptionRef
          : input.finding.migrationPathRef,
    };
    return {
      ...updatedBase,
      legacyReferenceFindingId:
        input.nextState === "superseded"
          ? `lrf_448_${governanceHash(updatedBase, "phase9.448.legacy-finding.superseded").slice(0, 16)}`
          : input.finding.legacyReferenceFindingId,
    };
  }

  reopenFindingsForExpiredExceptions(input: {
    readonly exceptions: readonly StandardsExceptionRecord[];
    readonly at: string;
  }): readonly string[] {
    return sortedUnique(
      input.exceptions.flatMap((exception) =>
        isExceptionCurrent(exception, input.at) ? [] : exception.requiredReopenFindingRefs,
      ),
    );
  }

  generateStandardsDependencyWatchlist(input: {
    readonly candidateBundleHash: string;
    readonly liveBundleHash: string;
    readonly environmentRef: string;
    readonly tenantScopeRef: string;
    readonly scopeTupleHash: string;
    readonly reviewPackageHash: string;
    readonly standardsBaselineMap: StandardsBaselineMap;
    readonly dependencyLifecycleRecords: readonly DependencyLifecycleRecord[];
    readonly legacyReferenceFindings: readonly LegacyReferenceFinding[];
    readonly policyCompatibilityAlerts: readonly PolicyCompatibilityAlert[];
    readonly standardsExceptionRecords: readonly StandardsExceptionRecord[];
    readonly generatedAt: string;
  }): StandardsDependencyWatchlist {
    const currentExceptionFindingRefs = new Set(
      input.standardsExceptionRecords
        .filter((exception) => isExceptionCurrent(exception, input.generatedAt))
        .flatMap((exception) => exception.linkedFindingRefs),
    );
    const reopenedFindingRefs = this.reopenFindingsForExpiredExceptions({
      exceptions: input.standardsExceptionRecords,
      at: input.generatedAt,
    });
    const dependencyBlockers = input.dependencyLifecycleRecords
      .filter((record) => record.recordState === "current")
      .filter(
        (record) =>
          record.promotionImpact === "compile_block" ||
          record.promotionImpact === "promotion_block",
      )
      .map((record) => record.dependencyLifecycleRecordId)
      .filter((ref) => !currentExceptionFindingRefs.has(ref));
    const legacyBlockers = input.legacyReferenceFindings
      .filter(
        (finding) =>
          finding.findingState === "open" ||
          reopenedFindingRefs.includes(finding.legacyReferenceFindingId),
      )
      .filter(
        (finding) =>
          finding.findingSeverity === "compile_block" ||
          finding.findingSeverity === "promotion_block",
      )
      .map((finding) => finding.legacyReferenceFindingId)
      .filter((ref) => !currentExceptionFindingRefs.has(ref));
    const alertBlockers = input.policyCompatibilityAlerts
      .filter((alert) => alert.alertState === "open")
      .filter(
        (alert) =>
          alert.compatibilityClass === "compile_blocking" ||
          alert.compatibilityClass === "promotion_blocking",
      )
      .map((alert) => alert.policyCompatibilityAlertId)
      .filter((ref) => !currentExceptionFindingRefs.has(ref));
    const advisoryFindingRefs = sortedUnique([
      ...input.dependencyLifecycleRecords
        .filter((record) => record.promotionImpact === "warn")
        .map((record) => record.dependencyLifecycleRecordId),
      ...input.legacyReferenceFindings
        .filter((finding) => finding.findingSeverity === "warn")
        .map((finding) => finding.legacyReferenceFindingId),
      ...input.policyCompatibilityAlerts
        .filter((alert) => alert.compatibilityClass === "advisory")
        .map((alert) => alert.policyCompatibilityAlertId),
    ]);
    const blockingFindingRefs = sortedUnique([
      ...dependencyBlockers,
      ...legacyBlockers,
      ...alertBlockers,
      ...reopenedFindingRefs,
    ]);
    const activeBlockerRefSet = new Set(blockingFindingRefs);
    const hasCompileBlock =
      input.dependencyLifecycleRecords.some(
        (record) =>
          activeBlockerRefSet.has(record.dependencyLifecycleRecordId) &&
          record.promotionImpact === "compile_block",
      ) ||
      input.legacyReferenceFindings.some(
        (finding) =>
          activeBlockerRefSet.has(finding.legacyReferenceFindingId) &&
          finding.findingSeverity === "compile_block",
      ) ||
      input.policyCompatibilityAlerts.some(
        (alert) =>
          activeBlockerRefSet.has(alert.policyCompatibilityAlertId) &&
          alert.compatibilityClass === "compile_blocking",
      );
    const hasPromotionBlock =
      input.dependencyLifecycleRecords.some(
        (record) =>
          activeBlockerRefSet.has(record.dependencyLifecycleRecordId) &&
          record.promotionImpact === "promotion_block",
      ) ||
      input.legacyReferenceFindings.some(
        (finding) =>
          activeBlockerRefSet.has(finding.legacyReferenceFindingId) &&
          finding.findingSeverity === "promotion_block",
      ) ||
      input.policyCompatibilityAlerts.some(
        (alert) =>
          activeBlockerRefSet.has(alert.policyCompatibilityAlertId) &&
          alert.compatibilityClass === "promotion_blocking",
      );
    const compileGateState: CompileGateState = hasCompileBlock
      ? "blocked"
      : advisoryFindingRefs.length > 0
        ? "review_required"
        : "pass";
    const promotionGateState: PromotionGateState =
      hasCompileBlock || hasPromotionBlock
        ? "blocked"
        : advisoryFindingRefs.length > 0
          ? "review_required"
          : "pass";
    const watchlistState: WatchlistState = reopenedFindingRefs.length > 0 ? "blocked" : "current";
    const baseWithoutHash = {
      candidateBundleHash: input.candidateBundleHash,
      liveBundleHash: input.liveBundleHash,
      environmentRef: input.environmentRef,
      tenantScopeRef: input.tenantScopeRef,
      scopeTupleHash: input.scopeTupleHash,
      reviewPackageHash: input.reviewPackageHash,
      standardsBaselineMapRef: input.standardsBaselineMap.baselineMapId,
      dependencyLifecycleRecordRefs: sortedUnique(
        input.dependencyLifecycleRecords.map((record) => record.dependencyLifecycleRecordId),
      ),
      legacyReferenceFindingRefs: sortedUnique(
        input.legacyReferenceFindings.map((finding) => finding.legacyReferenceFindingId),
      ),
      policyCompatibilityAlertRefs: sortedUnique(
        input.policyCompatibilityAlerts.map((alert) => alert.policyCompatibilityAlertId),
      ),
      standardsExceptionRecordRefs: sortedUnique(
        input.standardsExceptionRecords.map((exception) => exception.standardsExceptionRecordId),
      ),
      affectedRouteFamilyRefs: sortedUnique([
        ...input.standardsBaselineMap.affectedRouteFamilyRefs,
        ...input.dependencyLifecycleRecords.flatMap((record) => record.affectedRouteFamilyRefs),
        ...input.legacyReferenceFindings.flatMap((finding) => finding.affectedRouteFamilyRefs),
        ...input.policyCompatibilityAlerts.flatMap((alert) => alert.affectedRouteFamilyRefs),
      ]),
      affectedTenantScopeRefs: sortedUnique([
        ...input.standardsBaselineMap.affectedTenantScopeRefs,
        ...input.dependencyLifecycleRecords.flatMap((record) => record.affectedTenantScopeRefs),
        ...input.legacyReferenceFindings.flatMap((finding) => finding.affectedTenantScopeRefs),
        ...input.policyCompatibilityAlerts.flatMap((alert) => alert.affectedTenantScopeRefs),
      ]),
      affectedSurfaceSchemaRefs: sortedUnique([
        ...input.standardsBaselineMap.affectedSurfaceSchemaRefs,
        ...input.dependencyLifecycleRecords.flatMap((record) => record.affectedSurfaceSchemaRefs),
        ...input.legacyReferenceFindings.flatMap((finding) => finding.affectedSurfaceSchemaRefs),
        ...input.policyCompatibilityAlerts.flatMap((alert) => alert.affectedSurfaceSchemas),
      ]),
      affectedLiveChannelRefs: sortedUnique([
        ...input.standardsBaselineMap.affectedLiveChannelRefs,
        ...input.dependencyLifecycleRecords.flatMap((record) => record.affectedLiveChannelRefs),
        ...input.legacyReferenceFindings.flatMap((finding) => finding.affectedLiveChannelRefs),
        ...input.policyCompatibilityAlerts.flatMap((alert) => alert.affectedLiveChannelRefs),
      ]),
      affectedSimulationRefs: sortedUnique([
        ...input.standardsBaselineMap.affectedSimulationRefs,
        ...input.dependencyLifecycleRecords.flatMap((record) => record.affectedSimulationRefs),
        ...input.legacyReferenceFindings.flatMap((finding) => finding.affectedSimulationRefs),
        ...input.policyCompatibilityAlerts.flatMap((alert) => alert.affectedSimulationRefs),
      ]),
      blockingFindingRefs,
      advisoryFindingRefs,
      compileGateState,
      promotionGateState,
      watchlistState,
      generatedAt: input.generatedAt,
    };
    const watchlistHash = governanceHash(baseWithoutHash, "phase9.448.standards-watchlist.hash");
    return {
      standardsDependencyWatchlistId: `sdw_448_${watchlistHash.slice(0, 16)}`,
      ...baseWithoutHash,
      watchlistHash,
    };
  }

  buildConfigCompilationRecord(input: {
    readonly actor: TenantConfigActorContext;
    readonly workspaceContextRef: string;
    readonly changeEnvelopeRef: string;
    readonly baselineSnapshotRef: string;
    readonly baselineTupleHash: string;
    readonly bundle: CompiledPolicyBundle;
    readonly configVersions: readonly ConfigVersion[];
    readonly requiredCompiledPolicyDomains: readonly string[];
    readonly referenceScenarioSetRef: string;
    readonly surfaceSchemaSetRef: string;
    readonly watchlist: StandardsDependencyWatchlist;
    readonly compileVerdict: CompileGateVerdict;
    readonly configDriftFenceRef: string;
    readonly simulationEnvelopeRef: string;
  }): ConfigCompilationRecord {
    requireTenantConfigActor(input.actor, "buildConfigCompilationRecord");
    const compileState: ConfigCompileState =
      input.compileVerdict.compileGateState === "pass" &&
      input.watchlist.compileGateState !== "blocked"
        ? "ready"
        : "blocked";
    const releaseFreezeReadinessState: Exclude<ConfigReadinessState, "superseded"> =
      compileState === "ready" && input.watchlist.promotionGateState !== "blocked"
        ? "ready"
        : "blocked";
    const compilationTupleHash = orderedSetHash(
      [
        input.baselineTupleHash,
        input.bundle.bundleHash,
        input.configVersions.map((version) => version.chainHash),
        input.watchlist.watchlistHash,
        input.bundle.releaseContractMatrixHash,
      ],
      "phase9.448.compilation-tuple",
    );
    const base = {
      workspaceContextRef: input.workspaceContextRef,
      baselineTupleHash: input.baselineTupleHash,
      candidateBundleHash: input.bundle.bundleHash,
      compilationTupleHash,
      standardsWatchlistHash: input.watchlist.watchlistHash,
    };
    const recordHash = governanceHash(base, "phase9.448.config-compilation-record.id");
    return {
      configCompilationRecordId: `ccr_448_${recordHash.slice(0, 16)}`,
      workspaceContextRef: input.workspaceContextRef,
      changeEnvelopeRef: input.changeEnvelopeRef,
      baselineSnapshotRef: input.baselineSnapshotRef,
      baselineTupleHash: input.baselineTupleHash,
      candidateBundleHash: input.bundle.bundleHash,
      candidateConfigVersionSet: sortedUnique(
        input.configVersions.map((version) => version.configVersionId),
      ),
      requiredCompiledPolicyDomains: sortedUnique(input.requiredCompiledPolicyDomains),
      compiledPolicyBundleRef: input.bundle.bundleId,
      compiledDomainPackHashes: input.bundle.domainPackHashes,
      referenceScenarioSetRef: input.referenceScenarioSetRef,
      surfaceSchemaSetRef: input.surfaceSchemaSetRef,
      blastRadiusDigestRef: "blast-radius:tenant-config-448",
      continuityControlImpactDigestRef: "continuity-impact:tenant-config-448",
      visibilityCoverageImpactDigestRef: "visibility-impact:tenant-config-448",
      boundedContextImpactDigestRef: "bounded-context-impact:tenant-config-448",
      policyCompatibilityAlertRefs: [],
      standardsDependencyWatchlistRef: input.watchlist.standardsDependencyWatchlistId,
      standardsWatchlistHash: input.watchlist.watchlistHash,
      releaseContractVerificationMatrixRef: input.bundle.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.bundle.releaseContractMatrixHash,
      configDriftFenceRef: input.configDriftFenceRef,
      simulationEnvelopeRef: input.simulationEnvelopeRef,
      compileState,
      releaseFreezeReadinessState,
      compilationTupleHash,
      compiledAt: input.actor.generatedAt,
    };
  }

  buildConfigSimulationEnvelope(input: {
    readonly actor: TenantConfigActorContext;
    readonly compilationRecord: ConfigCompilationRecord;
    readonly watchlist: StandardsDependencyWatchlist;
    readonly graphSnapshotRef: string;
    readonly graphVerdictRef: string;
    readonly graphHash: string;
    readonly continuityValidationState: ConfigSimulationEnvelope["continuityValidationState"];
    readonly governanceReviewPackageRef: string;
    readonly reviewPackageHash: string;
  }): ConfigSimulationEnvelope {
    requireTenantConfigActor(input.actor, "buildConfigSimulationEnvelope");
    const blockerRefs = [
      ...(input.compilationRecord.compileState === "ready" ? [] : ["compile:not-ready"]),
      ...(input.watchlist.watchlistState === "current"
        ? []
        : [`watchlist:${input.watchlist.watchlistState}`]),
      ...(input.watchlist.compileGateState !== "blocked" ? [] : ["watchlist:compile-blocked"]),
      ...(input.continuityValidationState === "complete"
        ? []
        : [`continuity:${input.continuityValidationState}`]),
    ];
    const readiness: ConfigReadinessState = blockerRefs.length > 0 ? "blocked" : "ready";
    const base = {
      compilationRecordRef: input.compilationRecord.configCompilationRecordId,
      candidateBundleHash: input.compilationRecord.candidateBundleHash,
      standardsWatchlistHash: input.watchlist.watchlistHash,
      blockerRefs: sortedUnique(blockerRefs),
    };
    const envelopeHash = governanceHash(base, "phase9.448.config-simulation-envelope.id");
    return {
      simulationEnvelopeId: `cse_448_${envelopeHash.slice(0, 16)}`,
      workspaceContextRef: input.compilationRecord.workspaceContextRef,
      configCompilationRecordRef: input.compilationRecord.configCompilationRecordId,
      baselineTupleHash: input.compilationRecord.baselineTupleHash,
      compiledPolicyBundleRef: input.compilationRecord.compiledPolicyBundleRef,
      candidateBundleHash: input.compilationRecord.candidateBundleHash,
      referenceScenarioSetRef: input.compilationRecord.referenceScenarioSetRef,
      surfaceSchemaSetRef: input.compilationRecord.surfaceSchemaSetRef,
      compatibilityEvidenceRefs: ["compatibility:reference-case:448"],
      continuityEvidenceRefs: ["continuity:tenant-config:448"],
      assuranceEvidenceGraphSnapshotRef: input.graphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: input.graphVerdictRef,
      graphHash: input.graphHash,
      blastRadiusDigestRef: input.compilationRecord.blastRadiusDigestRef,
      continuityControlImpactDigestRef: input.compilationRecord.continuityControlImpactDigestRef,
      visibilityCoverageImpactDigestRef: input.compilationRecord.visibilityCoverageImpactDigestRef,
      boundedContextImpactDigestRef: input.compilationRecord.boundedContextImpactDigestRef,
      policyCompatibilityAlertRefs: input.compilationRecord.policyCompatibilityAlertRefs,
      standardsDependencyWatchlistRef: input.watchlist.standardsDependencyWatchlistId,
      standardsWatchlistHash: input.watchlist.watchlistHash,
      releaseContractVerificationMatrixRef:
        input.compilationRecord.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.compilationRecord.releaseContractMatrixHash,
      configDriftFenceRef: input.compilationRecord.configDriftFenceRef,
      governanceReviewPackageRef: input.governanceReviewPackageRef,
      reviewPackageHash: input.reviewPackageHash,
      continuityValidationState: input.continuityValidationState,
      compileReadinessState: readiness,
      releaseFreezeReadinessState: readiness === "ready" ? "ready" : "blocked",
      blockingReasonCodes: sortedUnique(blockerRefs),
      compilationTupleHash: input.compilationRecord.compilationTupleHash,
      generatedAt: input.actor.generatedAt,
    };
  }

  assessPromotionReadiness(input: {
    readonly actor: TenantConfigActorContext;
    readonly compilationRecord?: ConfigCompilationRecord;
    readonly simulationEnvelope?: ConfigSimulationEnvelope;
    readonly watchlist?: StandardsDependencyWatchlist;
    readonly approvedBundleHash: string;
    readonly releaseCandidateBundleHash: string;
    readonly approvedCompilationTupleHash: string;
    readonly approvedStandardsWatchlistHash: string;
    readonly approvedReleaseContractMatrixHash: string;
    readonly migrationExecutionTupleHash: string;
    readonly expectedMigrationExecutionTupleHash: string;
    readonly approvalAuditRef: string;
  }): PromotionReadinessAssessment {
    requireTenantConfigActor(input.actor, "assessPromotionReadiness");
    const blockerRefs: string[] = [];
    if (!input.compilationRecord) {
      blockerRefs.push("compilation:missing");
    } else {
      if (input.compilationRecord.compileState !== "ready") {
        blockerRefs.push(`compilation:${input.compilationRecord.compileState}`);
      }
      if (input.compilationRecord.releaseFreezeReadinessState !== "ready") {
        blockerRefs.push(`release-freeze:${input.compilationRecord.releaseFreezeReadinessState}`);
      }
      if (input.compilationRecord.compilationTupleHash !== input.approvedCompilationTupleHash) {
        blockerRefs.push("compilation:tuple-drift");
      }
      if (input.compilationRecord.standardsWatchlistHash !== input.approvedStandardsWatchlistHash) {
        blockerRefs.push("standards-watchlist:compilation-hash-drift");
      }
      if (
        input.compilationRecord.releaseContractMatrixHash !==
        input.approvedReleaseContractMatrixHash
      ) {
        blockerRefs.push("release-contract-matrix:drift");
      }
    }
    if (!input.simulationEnvelope) {
      blockerRefs.push("simulation:missing");
    } else {
      if (input.simulationEnvelope.compileReadinessState !== "ready") {
        blockerRefs.push(`simulation:${input.simulationEnvelope.compileReadinessState}`);
      }
      if (
        input.compilationRecord &&
        input.simulationEnvelope.compilationTupleHash !==
          input.compilationRecord.compilationTupleHash
      ) {
        blockerRefs.push("simulation:compilation-tuple-mismatch");
      }
      if (
        input.simulationEnvelope.standardsWatchlistHash !== input.approvedStandardsWatchlistHash
      ) {
        blockerRefs.push("standards-watchlist:simulation-hash-drift");
      }
    }
    if (!input.watchlist) {
      blockerRefs.push("standards-watchlist:missing");
    } else {
      if (input.watchlist.watchlistState !== "current") {
        blockerRefs.push(`standards-watchlist:${input.watchlist.watchlistState}`);
      }
      if (input.watchlist.promotionGateState === "blocked") {
        blockerRefs.push("standards-watchlist:promotion-blocked");
      }
      if (input.watchlist.watchlistHash !== input.approvedStandardsWatchlistHash) {
        blockerRefs.push("standards-watchlist:approval-hash-drift");
      }
    }
    if (input.approvedBundleHash !== input.releaseCandidateBundleHash) {
      blockerRefs.push("approval:bundle-hash-mismatch");
    }
    if (!input.approvalAuditRef) {
      blockerRefs.push("approval:audit-missing");
    }
    if (input.migrationExecutionTupleHash !== input.expectedMigrationExecutionTupleHash) {
      blockerRefs.push("migration:execution-tuple-drift");
    }
    const state: PromotionReadinessState = blockerRefs.some(
      (blocker) => blocker.includes("drift") || blocker.includes("mismatch"),
    )
      ? "invalidated"
      : blockerRefs.length > 0
        ? "blocked"
        : "pass";
    const base = {
      candidateBundleHash: input.releaseCandidateBundleHash,
      state,
      blockerRefs: sortedUnique(blockerRefs),
      compilationTupleHash: input.approvedCompilationTupleHash,
      standardsWatchlistHash: input.approvedStandardsWatchlistHash,
      migrationExecutionTupleHash: input.migrationExecutionTupleHash,
    };
    const assessmentHash = governanceHash(base, "phase9.448.promotion-readiness");
    return {
      promotionReadinessAssessmentId: `pra_448_${assessmentHash.slice(0, 16)}`,
      candidateBundleHash: input.releaseCandidateBundleHash,
      state,
      blockerRefs: sortedUnique(blockerRefs),
      compilationTupleHash: input.approvedCompilationTupleHash,
      standardsWatchlistHash: input.approvedStandardsWatchlistHash,
      migrationExecutionTupleHash: input.migrationExecutionTupleHash,
      assessmentHash,
      assessedAt: input.actor.generatedAt,
    };
  }

  explainCompileOrPromotionBlocker(input: {
    readonly compileVerdict?: CompileGateVerdict;
    readonly promotionAssessment?: PromotionReadinessAssessment;
  }): readonly string[] {
    return sortedUnique([
      ...(input.compileVerdict?.blockerRefs ?? []),
      ...(input.promotionAssessment?.blockerRefs ?? []),
    ]);
  }
}

function allGuardrailsPass(): CompiledPolicyGuardrailClaims {
  return {
    phiExposureGrantState: "none",
    patientBindingAssurance: "meets_required",
    duplicateMergeControl: "canonical_replay",
    sameRequestAttachControl: "same_episode_confirmed_strict",
    closureDependencyState: "clear",
    capacityReservationState: "held",
    pharmacyEvidenceState: "strongly_correlated",
    evidenceAssimilationCoverage: "complete",
    visibilityMinimumNecessaryState: "within_policy",
    providerChoiceState: "current",
    consentScopeState: "current",
    dispatchCorrelationState: "matched",
    assistiveSessionState: "valid",
    assistiveReviewVersionState: "current",
    policyBundleChangeState: "unchanged",
  };
}

function createDefaultPolicyPacks(
  service: Phase9TenantConfigGovernanceService,
  actor: TenantConfigActorContext,
): readonly PolicyPackVersion[] {
  const packTypes: readonly PolicyPackType[] = [
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
  ];
  return packTypes.map((packType) =>
    service.createPolicyPackVersion({
      actor: {
        ...actor,
        idempotencyKey: `idem:448:policy-pack:${packType}`,
      },
      packType,
      effectiveFrom: "2026-04-27T12:00:00.000Z",
      effectiveTo: "2026-10-27T12:00:00.000Z",
      changeSummaryRef: `change-summary:448:${packType}`,
      compatibilityRefs: [`compatibility:448:${packType}:canonical`],
    }),
  );
}

export function createPhase9TenantConfigGovernanceFixture(): Phase9TenantConfigGovernanceFixture {
  const generatedAt = "2026-04-27T13:00:00.000Z";
  const service = new Phase9TenantConfigGovernanceService();
  const actor: TenantConfigActorContext = {
    tenantId: "tenant:demo-gp",
    actorRef: "actor:tenant-governance-448",
    roleRefs: ["tenant_governance_admin", "release_manager"],
    purposeOfUseRef: "governance:tenant-config:compile",
    reasonRef: "reason:448:tenant-config-governance",
    idempotencyKey: "idem:448:base",
    scopeTokenRef: "scope-token:tenant:demo-gp:governance",
    generatedAt,
  };
  const liveBaseline = service.createTenantBaselineProfile({
    actor: { ...actor, idempotencyKey: "idem:448:baseline-live" },
    enabledCapabilities: ["booking", "messaging", "records"],
    policyPackRefs: ["policy-pack:routing:v1", "policy-pack:visibility:v1"],
    integrationRefs: ["integration:nhs-login", "integration:fhir-r4"],
    standardsVersionRefs: ["DTAC:2025-03", "DSPT:2025"],
    approvalState: "approved",
  });
  const candidateBaseline = service.createTenantBaselineProfile({
    actor: { ...actor, idempotencyKey: "idem:448:baseline-candidate" },
    enabledCapabilities: ["booking", "messaging", "records", "pharmacy"],
    policyPackRefs: [
      "policy-pack:routing:v2",
      "policy-pack:visibility:v2",
      "policy-pack:pharmacy:v1",
    ],
    integrationRefs: ["integration:nhs-login", "integration:fhir-r4", "integration:nhs-app"],
    standardsVersionRefs: ["DTAC:2026-03", "DSPT:2026", "DCB0160:2026-review"],
    approvalState: "draft",
  });
  const tenantDiffRows = service.listTenantBaselineDiff({
    liveProfile: liveBaseline,
    candidateProfile: candidateBaseline,
  });
  const rootConfigVersion = service.createConfigVersion({
    actor: { ...actor, idempotencyKey: "idem:448:config-root" },
    scope: "tenant:demo-gp:config:visibility",
    changeType: "create",
    compilationRecordRef: "compilation:bootstrap",
    simulationEnvelopeRef: "simulation:bootstrap",
    payload: { visibilityPolicy: "summary-first", standards: liveBaseline.standardsVersionRefs },
  });
  const childConfigVersion = service.createConfigVersion({
    actor: { ...actor, idempotencyKey: "idem:448:config-child" },
    scope: "tenant:demo-gp:config:visibility",
    parentVersion: rootConfigVersion,
    changeType: "promote",
    attestationRef: "attestation:448:visibility-policy",
    compilationRecordRef: "compilation:448:current",
    simulationEnvelopeRef: "simulation:448:current",
    payload: {
      visibilityPolicy: "summary-first",
      standards: candidateBaseline.standardsVersionRefs,
    },
  });
  const policyPackVersions = createDefaultPolicyPacks(service, actor);
  const validBundle = service.createCompiledPolicyBundle({
    actor: { ...actor, idempotencyKey: "idem:448:bundle-valid" },
    domainPacks: policyPackVersions,
    subpackTupleRefs: ["hub-routing:v1", "hub-variance-window:v1", "hub-service-obligation:v1"],
    requiredContinuityControlRefs: ["continuity:patient-nav", "continuity:support-replay"],
    continuityEvidenceContractRefs: [
      "continuity-contract:patient-nav",
      "continuity-contract:support-replay",
    ],
    releaseContractVerificationMatrixRef: "release-contract-matrix:448",
    releaseContractMatrixHash: "448".padEnd(64, "0"),
    compatibilityState: "valid",
    simulationEvidenceRef: "simulation-evidence:448:reference-case",
    effectiveAt: "2026-05-01T00:00:00.000Z",
    canaryScope: "canary:tenant-demo:10-percent",
    rollbackRefs: ["rollback:448:routing", "rollback:448:visibility"],
    guardrailClaims: allGuardrailsPass(),
  });
  const validCompileVerdict = service.validateCompiledPolicyBundle({ bundle: validBundle });
  const visibilityBlockedBundle = {
    ...validBundle,
    bundleId: "cpb_448_visibility_blocked",
    compatibilityState: "invalid" as const,
    guardrailClaims: {
      ...validBundle.guardrailClaims,
      phiExposureGrantState: "public" as const,
      visibilityMinimumNecessaryState: "outside_policy" as const,
    },
    bundleHash: governanceHash(
      { base: validBundle.bundleHash, blocker: "visibility" },
      "phase9.448.fixture.bundle",
    ),
  };
  const staleProviderConsentBundle = {
    ...validBundle,
    bundleId: "cpb_448_stale_provider",
    guardrailClaims: {
      ...validBundle.guardrailClaims,
      providerChoiceState: "stale" as const,
      consentScopeState: "expired" as const,
      dispatchCorrelationState: "mismatched" as const,
    },
    bundleHash: governanceHash(
      { base: validBundle.bundleHash, blocker: "stale-provider-consent" },
      "phase9.448.fixture.bundle",
    ),
  };
  const staleAssistiveBundle = {
    ...validBundle,
    bundleId: "cpb_448_stale_assistive",
    guardrailClaims: {
      ...validBundle.guardrailClaims,
      assistiveSessionState: "invalidated" as const,
      assistiveReviewVersionState: "drifted" as const,
      policyBundleChangeState: "changed_after_suggestion" as const,
    },
    bundleHash: governanceHash(
      { base: validBundle.bundleHash, blocker: "assistive" },
      "phase9.448.fixture.bundle",
    ),
  };
  const visibilityBlockedVerdict = service.validateCompiledPolicyBundle({
    bundle: visibilityBlockedBundle,
  });
  const staleProviderConsentVerdict = service.validateCompiledPolicyBundle({
    bundle: staleProviderConsentBundle,
  });
  const staleAssistiveVerdict = service.validateCompiledPolicyBundle({
    bundle: staleAssistiveBundle,
  });
  const dependencyRegistryEntries: readonly DependencyRegistryEntry[] = [
    {
      dependencyRegistryEntryId: "dre_448_nhs-login",
      dependencyCode: "nhs-login-oidc",
      sourceAuthority: "NHS Login",
      currentVersion: "2026.1",
      supportState: "supported",
      legacyRiskState: "none",
      replacementPathRef: "replacement:not-required",
      ownerRef: "owner:identity-platform",
      recordedAt: generatedAt,
    },
    {
      dependencyRegistryEntryId: "dre_448_legacy-fhir",
      dependencyCode: "legacy-fhir-endpoint",
      sourceAuthority: "NHS Digital retired endpoint",
      currentVersion: "2019.archive",
      supportState: "end_of_life",
      legacyRiskState: "migration_required",
      replacementPathRef: "replacement:fhir-r4-current",
      ownerRef: "owner:integration-platform",
      recordedAt: generatedAt,
    },
  ];
  const candidateBundleHash = validBundle.bundleHash;
  const liveBundleHash = liveBaseline.baselineHash;
  const dependencyLifecycleRecords = service.runDependencyHygieneScan({
    entries: dependencyRegistryEntries,
    candidateBundleHash,
    liveBundleHash,
    watchlistRef: "watchlist:pending",
    watchlistHash: "watchlist-hash:pending",
    affectedTenantScopeRefs: ["tenant:demo-gp"],
    affectedRouteFamilyRefs: ["route-family:patient-records", "route-family:pharmacy"],
    generatedAt,
  });
  const legacyReferenceFindings = service.runLegacyReferenceScan({
    references: [
      {
        referenceRef: "legacy-ref:developer-nhs-uk",
        content: "https://developer.nhs.uk/apis and fhir.nhs.uk/STU3 are still referenced",
        ownerRef: "owner:integration-platform",
        affectedRouteRefs: ["route:/ops/config/bundles"],
        affectedRouteFamilyRefs: ["route-family:governance-config"],
        affectedTenantScopeRefs: ["tenant:demo-gp"],
        affectedBundleRefs: [validBundle.bundleId],
        affectedSurfaceSchemaRefs: ["surface-schema:governance-config"],
        affectedLiveChannelRefs: ["live-channel:web"],
        affectedSimulationRefs: ["simulation:reference-case:tenant-config"],
      },
      {
        referenceRef: "legacy-ref:route-v0",
        content: "route-contract:v0 still appears in release notes",
        ownerRef: "owner:release-platform",
        affectedRouteRefs: ["route:/ops/release"],
        affectedRouteFamilyRefs: ["route-family:release"],
        affectedTenantScopeRefs: ["tenant:demo-gp"],
        affectedBundleRefs: [validBundle.bundleId],
        affectedSurfaceSchemaRefs: ["surface-schema:release"],
        affectedLiveChannelRefs: ["live-channel:web"],
        affectedSimulationRefs: ["simulation:release-contract"],
      },
    ],
    candidateBundleHash,
    liveBundleHash,
    watchlistRef: "watchlist:pending",
    watchlistHash: "watchlist-hash:pending",
    generatedAt,
  });
  const resolvedLegacyFinding = service.resolveExceptOrSupersedeFinding({
    finding: legacyReferenceFindings[0]!,
    nextState: "resolved",
    recordedAt: "2026-04-27T13:10:00.000Z",
  });
  const policyCompatibilityAlert = service.createPolicyCompatibilityAlert({
    candidateBundleHash,
    liveBundleHash,
    affectedPolicyDomains: ["visibility", "minimum-necessary"],
    affectedSurfaceSchemas: ["surface-schema:patient-record-preview"],
    affectedRouteFamilyRefs: ["route-family:patient-records"],
    affectedTenantScopeRefs: ["tenant:demo-gp"],
    affectedLiveChannelRefs: ["live-channel:web"],
    affectedSimulationRefs: ["simulation:patient-record-preview"],
    ownerRef: "owner:governance-policy",
    replacementRef: "replacement:visibility-policy-v2",
    remediationDueAt: "2026-05-08T17:00:00.000Z",
    watchlistRef: "watchlist:pending",
    watchlistHash: "watchlist-hash:pending",
    compatibilityClass: "compile_blocking",
    evidenceRefs: visibilityBlockedVerdict.blockerRefs,
    recoveryActionRef: "recovery:minimum-necessary-policy-recompile",
    expiresAt: "2026-05-15T00:00:00.000Z",
  });
  const standardsChangeNotice = service.createStandardsChangeNotice({
    actor: { ...actor, idempotencyKey: "idem:448:standards-change" },
    frameworkCode: "DTAC",
    currentVersionRef: "DTAC:2025-03",
    newVersionRef: "DTAC:2026-03",
    impactAssessmentRef: "impact:dtac-2026-refresh",
    ownerRef: "owner:clinical-safety",
    affectedTenantScopeRefs: ["tenant:demo-gp"],
  });
  const standardsBaselineMap = service.createStandardsBaselineMap({
    environmentRef: "environment:production",
    tenantScopeRef: "tenant:demo-gp",
    candidateBundleHash,
    liveBundleHash,
    requiredStandardRefs: ["DSPT", "DTAC", "DCB0160"],
    standardsVersionRefs: candidateBaseline.standardsVersionRefs,
    requiredByDateRefs: ["required-by:DTAC:2026-06-30"],
    blockingDeltaRefs: [standardsChangeNotice.noticeId],
    affectedRouteFamilyRefs: ["route-family:governance-config", "route-family:patient-records"],
    affectedTenantScopeRefs: ["tenant:demo-gp"],
    affectedSurfaceSchemaRefs: ["surface-schema:governance-config"],
    affectedLiveChannelRefs: ["live-channel:web"],
    affectedSimulationRefs: ["simulation:reference-case:tenant-config"],
    watchlistRef: "watchlist:pending",
    watchlistHash: "watchlist-hash:pending",
    baselineState: "exact",
    generatedAt,
  });
  const expiredException = service.createStandardsExceptionRecord({
    scopeRef: "tenant:demo-gp:standards-exception",
    candidateBundleHash,
    liveBundleHash,
    reviewPackageHash: "review-package-hash:448",
    approvalTupleHash: "approval-tuple-hash:448",
    approvalEvidenceBundleRef: "approval-evidence:448",
    releaseApprovalFreezeRef: "release-freeze:448",
    linkedFindingRefs: [legacyReferenceFindings[1]!.legacyReferenceFindingId],
    affectedRouteFamilyRefs: ["route-family:release"],
    affectedTenantScopeRefs: ["tenant:demo-gp"],
    affectedSurfaceSchemaRefs: ["surface-schema:release"],
    affectedLiveChannelRefs: ["live-channel:web"],
    affectedSimulationRefs: ["simulation:release-contract"],
    watchlistRef: "watchlist:pending",
    watchlistHash: "watchlist-hash:pending",
    justificationRef: "justification:temporary-route-contract-v0",
    mitigationRef: "mitigation:route-contract-upgrade",
    ownerRef: "owner:release-platform",
    approvedByRef: actor.actorRef,
    approvedAt: "2026-04-01T12:00:00.000Z",
    expiresAt: "2026-04-20T12:00:00.000Z",
    exceptionState: "approved",
  });
  const blockedWatchlist = service.generateStandardsDependencyWatchlist({
    candidateBundleHash,
    liveBundleHash,
    environmentRef: "environment:production",
    tenantScopeRef: "tenant:demo-gp",
    scopeTupleHash: "scope-tuple-hash:448",
    reviewPackageHash: "review-package-hash:448",
    standardsBaselineMap,
    dependencyLifecycleRecords,
    legacyReferenceFindings,
    policyCompatibilityAlerts: [policyCompatibilityAlert],
    standardsExceptionRecords: [expiredException],
    generatedAt,
  });
  const repeatedBlockedWatchlist = service.generateStandardsDependencyWatchlist({
    candidateBundleHash,
    liveBundleHash,
    environmentRef: "environment:production",
    tenantScopeRef: "tenant:demo-gp",
    scopeTupleHash: "scope-tuple-hash:448",
    reviewPackageHash: "review-package-hash:448",
    standardsBaselineMap,
    dependencyLifecycleRecords,
    legacyReferenceFindings,
    policyCompatibilityAlerts: [policyCompatibilityAlert],
    standardsExceptionRecords: [expiredException],
    generatedAt,
  });
  const cleanWatchlist = service.generateStandardsDependencyWatchlist({
    candidateBundleHash,
    liveBundleHash,
    environmentRef: "environment:production",
    tenantScopeRef: "tenant:demo-gp",
    scopeTupleHash: "scope-tuple-hash:448",
    reviewPackageHash: "review-package-hash:448",
    standardsBaselineMap: { ...standardsBaselineMap, blockingDeltaRefs: [] },
    dependencyLifecycleRecords: dependencyLifecycleRecords.filter(
      (record) => record.promotionImpact === "none",
    ),
    legacyReferenceFindings: [resolvedLegacyFinding],
    policyCompatibilityAlerts: [
      {
        ...policyCompatibilityAlert,
        alertState: "resolved",
        compatibilityClass: "advisory",
      },
    ],
    standardsExceptionRecords: [],
    generatedAt,
  });
  const reopenedFindingRefs = service.reopenFindingsForExpiredExceptions({
    exceptions: [expiredException],
    at: generatedAt,
  });
  const compilationRecord = service.buildConfigCompilationRecord({
    actor: { ...actor, idempotencyKey: "idem:448:compilation" },
    workspaceContextRef: "workspace:tenant-config:448",
    changeEnvelopeRef: "change-envelope:448",
    baselineSnapshotRef: liveBaseline.tenantBaselineProfileId,
    baselineTupleHash: liveBaseline.baselineHash,
    bundle: validBundle,
    configVersions: [rootConfigVersion, childConfigVersion],
    requiredCompiledPolicyDomains: policyPackVersions.map((pack) => pack.packType),
    referenceScenarioSetRef: "reference-scenario-set:448",
    surfaceSchemaSetRef: "surface-schema-set:448",
    watchlist: cleanWatchlist,
    compileVerdict: validCompileVerdict,
    configDriftFenceRef: "config-drift-fence:448:clear",
    simulationEnvelopeRef: "simulation-envelope:448:placeholder",
  });
  const simulationEnvelope = service.buildConfigSimulationEnvelope({
    actor: { ...actor, idempotencyKey: "idem:448:simulation" },
    compilationRecord,
    watchlist: cleanWatchlist,
    graphSnapshotRef: "graph-snapshot:448",
    graphVerdictRef: "graph-verdict:448",
    graphHash: "448graph".padEnd(64, "0"),
    continuityValidationState: "complete",
    governanceReviewPackageRef: "governance-review-package:448",
    reviewPackageHash: "review-package-hash:448",
  });
  const migrationTuple = orderedSetHash(
    ["migration-execution:448", "read-path-digest:448", "projection-backfill:448"],
    "phase9.448.migration-tuple",
  );
  const promotionReadyAssessment = service.assessPromotionReadiness({
    actor: { ...actor, idempotencyKey: "idem:448:promotion-ready" },
    compilationRecord,
    simulationEnvelope,
    watchlist: cleanWatchlist,
    approvedBundleHash: validBundle.bundleHash,
    releaseCandidateBundleHash: validBundle.bundleHash,
    approvedCompilationTupleHash: compilationRecord.compilationTupleHash,
    approvedStandardsWatchlistHash: cleanWatchlist.watchlistHash,
    approvedReleaseContractMatrixHash: validBundle.releaseContractMatrixHash,
    migrationExecutionTupleHash: migrationTuple,
    expectedMigrationExecutionTupleHash: migrationTuple,
    approvalAuditRef: "approval-audit:448",
  });
  const approvalBypassAssessment = service.assessPromotionReadiness({
    actor: { ...actor, idempotencyKey: "idem:448:approval-bypass" },
    compilationRecord,
    simulationEnvelope,
    watchlist: cleanWatchlist,
    approvedBundleHash: "wrong-bundle-hash",
    releaseCandidateBundleHash: validBundle.bundleHash,
    approvedCompilationTupleHash: compilationRecord.compilationTupleHash,
    approvedStandardsWatchlistHash: cleanWatchlist.watchlistHash,
    approvedReleaseContractMatrixHash: validBundle.releaseContractMatrixHash,
    migrationExecutionTupleHash: migrationTuple,
    expectedMigrationExecutionTupleHash: migrationTuple,
    approvalAuditRef: "",
  });
  const promotionDriftAssessment = service.assessPromotionReadiness({
    actor: { ...actor, idempotencyKey: "idem:448:promotion-drift" },
    compilationRecord,
    simulationEnvelope,
    watchlist: blockedWatchlist,
    approvedBundleHash: validBundle.bundleHash,
    releaseCandidateBundleHash: validBundle.bundleHash,
    approvedCompilationTupleHash: compilationRecord.compilationTupleHash,
    approvedStandardsWatchlistHash: cleanWatchlist.watchlistHash,
    approvedReleaseContractMatrixHash: validBundle.releaseContractMatrixHash,
    migrationExecutionTupleHash: `${migrationTuple}:drift`,
    expectedMigrationExecutionTupleHash: migrationTuple,
    approvalAuditRef: "approval-audit:448",
  });
  let tenantDeniedErrorCode = "";
  try {
    service.createConfigVersion({
      actor: {
        ...actor,
        tenantId: "tenant:other",
        scopeTokenRef: "scope-token:tenant:other:governance",
        idempotencyKey: "idem:448:tenant-denied",
      },
      scope: "tenant:demo-gp:config:visibility",
      changeType: "update",
      compilationRecordRef: "compilation:denied",
      simulationEnvelopeRef: "simulation:denied",
      payload: { denied: true },
    });
  } catch (error) {
    tenantDeniedErrorCode =
      error instanceof Phase9TenantConfigGovernanceError ? error.code : "UNKNOWN";
  }
  let authorizationDeniedErrorCode = "";
  try {
    service.createCompiledPolicyBundle({
      actor: {
        ...actor,
        roleRefs: [],
        idempotencyKey: "idem:448:auth-denied",
      },
      domainPacks: policyPackVersions,
      subpackTupleRefs: [],
      requiredContinuityControlRefs: [],
      continuityEvidenceContractRefs: [],
      releaseContractVerificationMatrixRef: "release-contract-matrix:denied",
      releaseContractMatrixHash: "denied".padEnd(64, "0"),
      compatibilityState: "valid",
      simulationEvidenceRef: "simulation:denied",
      effectiveAt: generatedAt,
      canaryScope: "canary:denied",
      rollbackRefs: ["rollback:denied"],
      guardrailClaims: allGuardrailsPass(),
    });
  } catch (error) {
    authorizationDeniedErrorCode =
      error instanceof Phase9TenantConfigGovernanceError ? error.code : "UNKNOWN";
  }
  return {
    schemaVersion: PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION,
    generatedAt,
    upstreamGovernanceContractVersion: PHASE9_GOVERNANCE_CONTRACT_VERSION,
    upstreamIncidentWorkflowVersion: PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9H",
      "blueprint/phase-0-the-foundation-protocol.md#1.19-CompiledPolicyBundle",
      "blueprint/phase-0-the-foundation-protocol.md#14-Assurance-resilience-and-configuration-promotion-algorithm",
      "blueprint/platform-admin-and-config-blueprint.md#ConfigCompilationRecord",
      "blueprint/platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
      "blueprint/governance-admin-console-frontend-blueprint.md#TenantConfigMatrix",
      "data/contracts/434_phase9_governance_contracts.json",
      "data/contracts/447_phase9_incident_reportability_workflow_contract.json",
    ],
    producedObjects: [
      "TenantBaselineProfile",
      "ConfigVersion",
      "PolicyPackVersion",
      "DependencyRegistryEntry",
      "StandardsChangeNotice",
      "CompiledPolicyBundle",
      "ConfigCompilationRecord",
      "ConfigSimulationEnvelope",
      "StandardsBaselineMap",
      "DependencyLifecycleRecord",
      "LegacyReferenceFinding",
      "PolicyCompatibilityAlert",
      "StandardsExceptionRecord",
      "StandardsDependencyWatchlist",
      "PromotionReadinessAssessment",
    ],
    apiSurface: [
      "createTenantBaselineProfile",
      "listTenantBaselineDiff",
      "createConfigVersion",
      "listConfigHistory",
      "createPolicyPackVersion",
      "listPolicyPackHistory",
      "createCompiledPolicyBundle",
      "validateCompiledPolicyBundle",
      "runDependencyHygieneScan",
      "runLegacyReferenceScan",
      "createStandardsChangeNotice",
      "generateStandardsDependencyWatchlist",
      "resolveExceptOrSupersedeFinding",
      "createStandardsExceptionRecord",
      "reopenFindingsForExpiredExceptions",
      "buildConfigCompilationRecord",
      "buildConfigSimulationEnvelope",
      "assessPromotionReadiness",
      "explainCompileOrPromotionBlocker",
    ],
    canonicalSchemaConflictGapRef:
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_448_CONFIG_SCHEMA_CONFLICT.json",
    liveBaseline,
    candidateBaseline,
    tenantDiffRows,
    rootConfigVersion,
    childConfigVersion,
    policyPackVersions,
    validBundle,
    validCompileVerdict,
    visibilityBlockedVerdict,
    staleProviderConsentVerdict,
    staleAssistiveVerdict,
    dependencyRegistryEntries,
    dependencyLifecycleRecords,
    legacyReferenceFindings,
    resolvedLegacyFinding,
    policyCompatibilityAlert,
    standardsChangeNotice,
    standardsBaselineMap,
    blockedWatchlist,
    repeatedBlockedWatchlist,
    cleanWatchlist,
    expiredException,
    reopenedFindingRefs,
    compilationRecord,
    simulationEnvelope,
    promotionReadyAssessment,
    approvalBypassAssessment,
    promotionDriftAssessment,
    tenantDeniedErrorCode,
    authorizationDeniedErrorCode,
    replayHash: orderedSetHash(
      [
        liveBaseline.baselineHash,
        candidateBaseline.baselineHash,
        childConfigVersion.chainHash,
        validBundle.bundleHash,
        cleanWatchlist.watchlistHash,
        blockedWatchlist.watchlistHash,
        compilationRecord.compilationTupleHash,
        simulationEnvelope.simulationEnvelopeId,
        promotionReadyAssessment.assessmentHash,
      ],
      "phase9.448.fixture.replay",
    ),
  };
}

export function phase9TenantConfigGovernanceSummary(
  fixture: Phase9TenantConfigGovernanceFixture = createPhase9TenantConfigGovernanceFixture(),
): string {
  return [
    "# 448 Phase 9 Tenant Config Governance",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Generated at: ${fixture.generatedAt}`,
    `Candidate bundle hash: ${fixture.validBundle.bundleHash}`,
    `Config chain hash: ${fixture.childConfigVersion.chainHash}`,
    `Watchlist hash: ${fixture.cleanWatchlist.watchlistHash}`,
    `Promotion readiness: ${fixture.promotionReadyAssessment.state}`,
    `Schema conflict gap: ${fixture.canonicalSchemaConflictGapRef}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
    "## Workflow Contract",
    "",
    "- Tenant baselines preserve tenant-specific capabilities, policy packs, integrations, standards versions, and approval state.",
    "- Config versions are append-only, parent-hash chained, actor-bound, reason-bound, and tied to compilation and simulation evidence.",
    "- Policy packs cover the canonical routing, SLA, identity, duplicate, provider, booking, hub, callback, pharmacy, communications, access, visibility, provider-capability, and tenant-override families.",
    "- CompiledPolicyBundle validation reuses the Phase 0 compile gate blockers for PHI exposure, minimum-necessary visibility, stale provider choice, expired consent, and stale assistive sessions.",
    "- StandardsDependencyWatchlist uses the platform-admin baseline, dependency lifecycle, legacy finding, compatibility alert, and exception contracts as the canonical adapter source.",
    "- Promotion readiness fails closed on watchlist drift, compilation drift, approval bypass, and migration tuple drift.",
    "",
  ].join("\n");
}

export function phase9TenantBaselineDiffMatrixCsv(
  fixture: Phase9TenantConfigGovernanceFixture = createPhase9TenantConfigGovernanceFixture(),
): string {
  const rows = [
    ["fieldName", "diffType", "liveValueRefs", "candidateValueRefs"],
    ...fixture.tenantDiffRows.map((row) => [
      row.fieldName,
      row.diffType,
      row.liveValueRefs.join("|"),
      row.candidateValueRefs.join("|"),
    ]),
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}

export function phase9DependencyWatchlistRegisterCsv(
  fixture: Phase9TenantConfigGovernanceFixture = createPhase9TenantConfigGovernanceFixture(),
): string {
  const rows = [
    ["watchlistRef", "compileGate", "promotionGate", "blockingFindingRefs", "advisoryFindingRefs"],
    [
      fixture.blockedWatchlist.standardsDependencyWatchlistId,
      fixture.blockedWatchlist.compileGateState,
      fixture.blockedWatchlist.promotionGateState,
      fixture.blockedWatchlist.blockingFindingRefs.join("|"),
      fixture.blockedWatchlist.advisoryFindingRefs.join("|"),
    ],
    [
      fixture.cleanWatchlist.standardsDependencyWatchlistId,
      fixture.cleanWatchlist.compileGateState,
      fixture.cleanWatchlist.promotionGateState,
      fixture.cleanWatchlist.blockingFindingRefs.join("|"),
      fixture.cleanWatchlist.advisoryFindingRefs.join("|"),
    ],
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}
