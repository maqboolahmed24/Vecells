import { hashAssurancePayload, orderedSetHash } from "./phase9-assurance-ledger-contracts";
import {
  PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
  createPhase9DispositionExecutionFixture,
} from "./phase9-disposition-execution-engine";

export const PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION =
  "444.phase9.operational-readiness-posture.v1";

export type EssentialFunctionState = "mapped" | "rehearsal_due" | "recovery_only" | "retired";
export type RecoveryTierState = "active" | "superseded" | "retired";
export type BackupImmutabilityState = "immutable" | "mutable" | "disputed";
export type BackupRestoreTestState = "current" | "stale" | "blocked" | "missing";
export type BackupManifestState = "current" | "stale" | "superseded" | "withdrawn" | "missing";
export type OperationalReadinessVerdictCoverageState = "exact" | "stale" | "blocked";
export type OperationalReadinessFreshnessState = "fresh" | "stale" | "incomplete" | "blocked";
export type OperationalReadinessState = "ready" | "constrained" | "blocked";
export type RunbookBindingState = "published" | "stale" | "rehearsal_required" | "withdrawn";
export type RecoveryFreshnessState = "fresh" | "stale" | "expired" | "missing";
export type DependencyCoverageState = "complete" | "partial" | "blocked";
export type JourneyRecoveryCoverageState = "exact" | "partial" | "missing";
export type EvidencePackAdmissibilityState = "exact" | "stale" | "blocked";
export type RecoveryControlPostureState =
  | "live_control"
  | "diagnostic_only"
  | "governed_recovery"
  | "blocked";
export type RecoveryPublicationState = "current" | "stale" | "withdrawn" | "quarantined";
export type RecoveryTrustState = "trusted" | "degraded" | "blocked";
export type RecoveryFreezeState = "clear" | "active" | "blocked";
export type SyntheticCoverageState = "exact" | "stale" | "blocked" | "missing";
export type RecoveryEvidencePackState = "current" | "stale" | "blocked" | "superseded" | "missing";

export interface ReadinessActorContext {
  readonly tenantId: string;
  readonly actorRef: string;
  readonly roleRefs: readonly string[];
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly idempotencyKey: string;
  readonly scopeTokenRef: string;
  readonly generatedAt: string;
}

export interface EssentialFunctionMap {
  readonly essentialFunctionMapId: string;
  readonly functionCode: string;
  readonly audienceScopeRefs: readonly string[];
  readonly businessOwnerRef: string;
  readonly recoveryTierRef: string;
  readonly supportingSystemRefs: readonly string[];
  readonly supportingDataRefs: readonly string[];
  readonly dependencyOrderRef: string;
  readonly degradedModeRefs: readonly string[];
  readonly runbookBindingRefs: readonly string[];
  readonly currentOperationalReadinessSnapshotRef: string;
  readonly functionState: EssentialFunctionState;
}

export interface RecoveryTier {
  readonly recoveryTierId: string;
  readonly functionCode: string;
  readonly rto: string;
  readonly rpo: string;
  readonly maxDiagnosticOnlyWindow: string;
  readonly degradedModeDefinitionRef: string;
  readonly restorePriority: number;
  readonly requiredJourneyProofRefs: readonly string[];
  readonly requiredDependencyRestoreProofRefs: readonly string[];
  readonly requiredFailoverScenarioRefs: readonly string[];
  readonly requiredChaosExperimentRefs: readonly string[];
  readonly requiredBackupScopeRefs: readonly string[];
  readonly tierState: RecoveryTierState;
}

export interface BackupSetManifest {
  readonly backupSetManifestId: string;
  readonly datasetScopeRef: string;
  readonly essentialFunctionRefs: readonly string[];
  readonly recoveryTierRefs: readonly string[];
  readonly snapshotTime: string;
  readonly immutabilityState: BackupImmutabilityState;
  readonly restoreTestState: BackupRestoreTestState;
  readonly checksumBundleRef: string;
  readonly restoreCompatibilityDigestRef: string;
  readonly dependencyOrderDigestRef: string;
  readonly requiredJourneyProofContractRefs: readonly string[];
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly latestRecoveryEvidencePackRef: string;
  readonly latestResilienceActionSettlementRef: string;
  readonly resilienceTupleHash: string;
  readonly manifestTupleHash: string;
  readonly manifestState: BackupManifestState;
  readonly verifiedAt: string;
}

export interface SyntheticRecoveryCoverageRecord {
  readonly syntheticRecoveryCoverageRecordId: string;
  readonly functionCode: string;
  readonly journeyProofRef: string;
  readonly resilienceTupleHash: string;
  readonly coverageState: SyntheticCoverageState;
  readonly executedAt: string;
}

export interface RecoveryEvidencePackSummary {
  readonly recoveryEvidencePackId: string;
  readonly functionCode: string;
  readonly packState: RecoveryEvidencePackState;
  readonly resilienceTupleHash: string;
  readonly artifactRefs: readonly string[];
  readonly validUntil: string;
}

export interface OperationalReadinessSnapshot {
  readonly operationalReadinessSnapshotId: string;
  readonly releaseRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly waveObservationPolicyRef: string;
  readonly requiredAssuranceSliceRefs: readonly string[];
  readonly releaseTrustFreezeVerdictRefs: readonly string[];
  readonly dashboardBundleRefs: readonly string[];
  readonly runbookBindingRefs: readonly string[];
  readonly syntheticCoverageRefs: readonly string[];
  readonly essentialFunctionRefs: readonly string[];
  readonly essentialFunctionHealthEnvelopeRefs: readonly string[];
  readonly recoveryTierRefs: readonly string[];
  readonly backupSetManifestRefs: readonly string[];
  readonly resilienceSurfaceRuntimeBindingRefs: readonly string[];
  readonly recoveryControlPostureRefs: readonly string[];
  readonly recoveryEvidencePackRefs: readonly string[];
  readonly latestRecoveryEvidencePackRef: string;
  readonly latestRestoreRunRefs: readonly string[];
  readonly latestFailoverRunRefs: readonly string[];
  readonly latestChaosRunRefs: readonly string[];
  readonly latestJourneyRecoveryProofRefs: readonly string[];
  readonly latestResilienceActionSettlementRefs: readonly string[];
  readonly resilienceTupleHash: string;
  readonly ownerCoverageState: string;
  readonly verdictCoverageState: OperationalReadinessVerdictCoverageState;
  readonly freshnessState: OperationalReadinessFreshnessState;
  readonly rehearsalFreshnessState: OperationalReadinessFreshnessState;
  readonly readinessState: OperationalReadinessState;
  readonly capturedAt: string;
}

export interface RunbookBindingRecord {
  readonly runbookBindingRecordId: string;
  readonly runbookRef: string;
  readonly releaseRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly audienceScope: string;
  readonly routeFamilyRefs: readonly string[];
  readonly essentialFunctionRefs: readonly string[];
  readonly recoveryTierRefs: readonly string[];
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly releaseRecoveryDispositionRefs: readonly string[];
  readonly watchTupleHash: string;
  readonly requiredBackupSetManifestRefs: readonly string[];
  readonly requiredRecoveryEvidencePackRefs: readonly string[];
  readonly requiredSyntheticRecoveryCoverageRefs: readonly string[];
  readonly versionHash: string;
  readonly lastRehearsedAt: string;
  readonly lastRehearsalSettlementRef: string;
  readonly latestRecoveryEvidenceArtifactRefs: readonly string[];
  readonly latestResilienceActionSettlementRefs: readonly string[];
  readonly resilienceTupleHash: string;
  readonly bindingHash: string;
  readonly bindingState: RunbookBindingState;
}

export interface RecoveryControlPosture {
  readonly recoveryControlPostureId: string;
  readonly scopeRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly publicationState: RecoveryPublicationState;
  readonly trustState: RecoveryTrustState;
  readonly freezeState: RecoveryFreezeState;
  readonly releaseTrustFreezeVerdictRef: string;
  readonly operationalReadinessSnapshotRef: string;
  readonly requiredRunbookBindingRefs: readonly string[];
  readonly recoveryTierRefs: readonly string[];
  readonly requiredBackupSetManifestRefs: readonly string[];
  readonly requiredSyntheticRecoveryCoverageRefs: readonly string[];
  readonly latestRestoreRunRef: string;
  readonly latestFailoverRunRef: string;
  readonly latestChaosRunRef: string;
  readonly currentRecoveryEvidencePackRef: string;
  readonly latestRecoveryEvidencePackRef: string;
  readonly latestResilienceActionSettlementRefs: readonly string[];
  readonly restoreValidationFreshnessState: RecoveryFreshnessState;
  readonly failoverValidationFreshnessState: RecoveryFreshnessState;
  readonly chaosValidationFreshnessState: RecoveryFreshnessState;
  readonly dependencyCoverageState: DependencyCoverageState;
  readonly journeyRecoveryCoverageState: JourneyRecoveryCoverageState;
  readonly backupManifestState: "current" | "stale" | "missing";
  readonly evidencePackAdmissibilityState: EvidencePackAdmissibilityState;
  readonly postureState: RecoveryControlPostureState;
  readonly allowedActionRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly authoritativeScopeTupleHash: string;
  readonly controlTupleHash: string;
  readonly releaseRecoveryDispositionRef: string;
  readonly lastComputedAt: string;
}

export interface ResilienceTupleMembers {
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly operationalReadinessSnapshotRef?: string;
  readonly runbookBindingRefs: readonly string[];
  readonly backupSetManifestRefs: readonly string[];
  readonly recoveryEvidencePackRefs: readonly string[];
  readonly syntheticRecoveryCoverageRefs: readonly string[];
}

export interface DependencyOrderValidationResult {
  readonly dependencyOrderRef: string;
  readonly orderedFunctionRefs: readonly string[];
  readonly dependencyOrderDigestRef: string;
  readonly cycleDetected: boolean;
  readonly cyclePathRefs: readonly string[];
}

export interface RecoveryProofDebtRecord {
  readonly recoveryProofDebtRecordId: string;
  readonly functionCode: string;
  readonly missingProofRefs: readonly string[];
  readonly staleRunbookRefs: readonly string[];
  readonly staleBackupManifestRefs: readonly string[];
  readonly nextRehearsalDueAt: string;
  readonly blockerRefs: readonly string[];
}

export interface ReadinessPosturePage<T> {
  readonly rows: readonly T[];
  readonly nextCursor?: string;
}

export interface Phase9OperationalReadinessPostureFixture {
  readonly schemaVersion: typeof PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION;
  readonly upstreamDispositionSchemaVersion: typeof PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly producedObjects: readonly string[];
  readonly apiSurface: readonly string[];
  readonly essentialFunctions: readonly EssentialFunctionMap[];
  readonly recoveryTiers: readonly RecoveryTier[];
  readonly backupManifests: readonly BackupSetManifest[];
  readonly runbookBindings: readonly RunbookBindingRecord[];
  readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
  readonly recoveryEvidencePacks: readonly RecoveryEvidencePackSummary[];
  readonly readySnapshot: OperationalReadinessSnapshot;
  readonly staleRunbookSnapshot: OperationalReadinessSnapshot;
  readonly livePosture: RecoveryControlPosture;
  readonly stalePublicationPosture: RecoveryControlPosture;
  readonly degradedTrustPosture: RecoveryControlPosture;
  readonly activeFreezePosture: RecoveryControlPosture;
  readonly missingBackupPosture: RecoveryControlPosture;
  readonly missingRunbookPosture: RecoveryControlPosture;
  readonly staleEvidencePackPosture: RecoveryControlPosture;
  readonly missingJourneyProofPosture: RecoveryControlPosture;
  readonly partialDependencyPosture: RecoveryControlPosture;
  readonly dependencyOrderValidation: DependencyOrderValidationResult;
  readonly dependencyCycleValidation: DependencyOrderValidationResult;
  readonly proofDebt: readonly RecoveryProofDebtRecord[];
  readonly tupleCompatibleRestoreDigest: string;
  readonly deterministicPostureReplay: RecoveryControlPosture;
  readonly tenantDeniedErrorCode: string;
  readonly scopeDeniedErrorCode: string;
  readonly replayHash: string;
}

export class Phase9OperationalReadinessPostureError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9OperationalReadinessPostureError";
    this.code = code;
  }
}

function readinessInvariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9OperationalReadinessPostureError(code, message);
  }
}

function omitUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => omitUndefined(entry));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, omitUndefined(entry)]),
    );
  }
  return value;
}

function readinessHash(value: unknown, namespace: string): string {
  return hashAssurancePayload(omitUndefined(value), namespace);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
}

function scopeMatchesTenant(scopeRef: string, tenantId: string): boolean {
  return scopeRef.includes(tenantId);
}

function requireReadinessActor(actor: ReadinessActorContext, action: string): void {
  readinessInvariant(
    actor.roleRefs.includes("resilience_governance") ||
      actor.roleRefs.includes("records_governance"),
    "READINESS_ACTOR_ROLE_DENIED",
    `${action} requires resilience_governance or records_governance role.`,
  );
  readinessInvariant(
    actor.purposeOfUseRef.startsWith("resilience:") ||
      actor.purposeOfUseRef.startsWith("records:governance"),
    "READINESS_PURPOSE_OF_USE_DENIED",
    `${action} requires resilience or records governance purpose.`,
  );
  readinessInvariant(
    actor.reasonRef.length > 0,
    "READINESS_REASON_REQUIRED",
    `${action} requires a reason ref.`,
  );
  readinessInvariant(
    actor.idempotencyKey.length > 0,
    "READINESS_IDEMPOTENCY_KEY_REQUIRED",
    `${action} requires an idempotency key.`,
  );
  readinessInvariant(
    scopeMatchesTenant(actor.scopeTokenRef, actor.tenantId),
    "READINESS_SCOPE_TENANT_DENIED",
    `${action} scope token must match tenant.`,
  );
}

function stateSeverity(state: RecoveryControlPostureState): number {
  return {
    live_control: 0,
    diagnostic_only: 1,
    governed_recovery: 2,
    blocked: 3,
  }[state];
}

function worstPostureState(
  states: readonly RecoveryControlPostureState[],
): RecoveryControlPostureState {
  return (
    [...states].sort((left, right) => stateSeverity(right) - stateSeverity(left))[0] ??
    "live_control"
  );
}

export class Phase9OperationalReadinessPostureService {
  createResilienceTupleHash(members: ResilienceTupleMembers): string {
    return orderedSetHash(
      [
        members.verificationScenarioRef,
        members.releaseContractVerificationMatrixRef,
        members.releaseContractMatrixHash,
        members.runtimePublicationBundleRef,
        members.releasePublicationParityRef,
        members.releaseWatchTupleRef,
        members.watchTupleHash,
        members.operationalReadinessSnapshotRef ?? "operational-readiness-snapshot:pending",
        sortedUnique(members.runbookBindingRefs),
        sortedUnique(members.backupSetManifestRefs),
        sortedUnique(members.recoveryEvidencePackRefs),
        sortedUnique(members.syntheticRecoveryCoverageRefs),
      ],
      "phase9.444.resilience-tuple",
    );
  }

  deriveDependencyOrder(input: {
    readonly dependencyOrderRef: string;
    readonly edges: readonly {
      readonly beforeFunctionCode: string;
      readonly afterFunctionCode: string;
    }[];
    readonly functionCodes: readonly string[];
  }): DependencyOrderValidationResult {
    const adjacency = new Map<string, string[]>();
    for (const functionCode of input.functionCodes) {
      adjacency.set(functionCode, []);
    }
    for (const edge of input.edges) {
      adjacency.set(edge.beforeFunctionCode, [
        ...(adjacency.get(edge.beforeFunctionCode) ?? []),
        edge.afterFunctionCode,
      ]);
    }
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const ordered: string[] = [];
    const cyclePath: string[] = [];
    let cycleDetected = false;
    const visit = (functionCode: string, path: readonly string[]): void => {
      if (visiting.has(functionCode)) {
        cycleDetected = true;
        cyclePath.push(...path, functionCode);
        return;
      }
      if (visited.has(functionCode)) {
        return;
      }
      visiting.add(functionCode);
      for (const next of adjacency.get(functionCode) ?? []) {
        visit(next, [...path, functionCode]);
      }
      visiting.delete(functionCode);
      visited.add(functionCode);
      ordered.unshift(functionCode);
    };
    for (const functionCode of [...input.functionCodes].sort()) {
      visit(functionCode, []);
    }
    const orderedFunctionRefs = sortedUnique(ordered).sort(
      (left, right) => ordered.indexOf(left) - ordered.indexOf(right),
    );
    return {
      dependencyOrderRef: input.dependencyOrderRef,
      orderedFunctionRefs,
      dependencyOrderDigestRef: readinessHash(
        {
          dependencyOrderRef: input.dependencyOrderRef,
          orderedFunctionRefs,
          edges: input.edges,
        },
        "phase9.444.dependency-order",
      ),
      cycleDetected,
      cyclePathRefs: sortedUnique(cyclePath),
    };
  }

  createEssentialFunctionMap(
    input: Omit<EssentialFunctionMap, "functionState">,
  ): EssentialFunctionMap {
    const missingCriticalRefs = [
      input.recoveryTierRef,
      input.dependencyOrderRef,
      ...input.supportingSystemRefs,
      ...input.supportingDataRefs,
      ...input.runbookBindingRefs,
    ].filter((ref) => ref.length === 0);
    return {
      ...input,
      functionState: missingCriticalRefs.length > 0 ? "rehearsal_due" : "mapped",
    };
  }

  createRecoveryTier(
    input: Omit<RecoveryTier, "tierState"> & { readonly tierState?: RecoveryTierState },
  ): RecoveryTier {
    const complete =
      input.requiredJourneyProofRefs.length > 0 &&
      input.requiredDependencyRestoreProofRefs.length > 0 &&
      input.requiredFailoverScenarioRefs.length > 0 &&
      input.requiredChaosExperimentRefs.length > 0 &&
      input.requiredBackupScopeRefs.length > 0;
    return {
      ...input,
      tierState: input.tierState ?? (complete ? "active" : "superseded"),
    };
  }

  createBackupSetManifest(
    input: Omit<BackupSetManifest, "manifestTupleHash" | "manifestState">,
  ): BackupSetManifest {
    const manifestState: BackupManifestState =
      input.immutabilityState === "immutable" &&
      input.restoreTestState === "current" &&
      input.checksumBundleRef.length > 0 &&
      input.restoreCompatibilityDigestRef.length > 0 &&
      input.dependencyOrderDigestRef.length > 0
        ? "current"
        : "stale";
    const manifestBase = {
      ...input,
      essentialFunctionRefs: sortedUnique(input.essentialFunctionRefs),
      recoveryTierRefs: sortedUnique(input.recoveryTierRefs),
      requiredJourneyProofContractRefs: sortedUnique(input.requiredJourneyProofContractRefs),
      manifestState,
    };
    return {
      ...manifestBase,
      manifestTupleHash: readinessHash(manifestBase, "phase9.444.backup-set-manifest"),
    };
  }

  deriveTupleCompatibleRestoreDigest(input: {
    readonly backupManifest: BackupSetManifest;
    readonly dependencyOrder: DependencyOrderValidationResult;
    readonly requiredJourneyProofRefs: readonly string[];
  }): string {
    return readinessHash(
      {
        backupSetManifestId: input.backupManifest.backupSetManifestId,
        checksumBundleRef: input.backupManifest.checksumBundleRef,
        restoreCompatibilityDigestRef: input.backupManifest.restoreCompatibilityDigestRef,
        dependencyOrderDigestRef: input.dependencyOrder.dependencyOrderDigestRef,
        requiredJourneyProofRefs: sortedUnique(input.requiredJourneyProofRefs),
        resilienceTupleHash: input.backupManifest.resilienceTupleHash,
      },
      "phase9.444.tuple-compatible-restore-digest",
    );
  }

  createRunbookBindingRecord(
    input: Omit<RunbookBindingRecord, "bindingHash" | "bindingState"> & {
      readonly bindingState?: RunbookBindingState;
    },
  ): RunbookBindingRecord {
    const state =
      input.bindingState ??
      (input.lastRehearsedAt.length === 0
        ? "rehearsal_required"
        : input.runbookRef.includes("withdrawn")
          ? "withdrawn"
          : "published");
    const base = {
      ...input,
      routeFamilyRefs: sortedUnique(input.routeFamilyRefs),
      essentialFunctionRefs: sortedUnique(input.essentialFunctionRefs),
      recoveryTierRefs: sortedUnique(input.recoveryTierRefs),
      releaseRecoveryDispositionRefs: sortedUnique(input.releaseRecoveryDispositionRefs),
      requiredBackupSetManifestRefs: sortedUnique(input.requiredBackupSetManifestRefs),
      requiredRecoveryEvidencePackRefs: sortedUnique(input.requiredRecoveryEvidencePackRefs),
      requiredSyntheticRecoveryCoverageRefs: sortedUnique(
        input.requiredSyntheticRecoveryCoverageRefs,
      ),
      latestRecoveryEvidenceArtifactRefs: sortedUnique(input.latestRecoveryEvidenceArtifactRefs),
      latestResilienceActionSettlementRefs: sortedUnique(
        input.latestResilienceActionSettlementRefs,
      ),
      bindingState: state,
    };
    return {
      ...base,
      bindingHash: readinessHash(base, "phase9.444.runbook-binding"),
    };
  }

  captureOperationalReadinessSnapshot(input: {
    readonly releaseRef: string;
    readonly tuple: ResilienceTupleMembers;
    readonly waveObservationPolicyRef: string;
    readonly requiredAssuranceSliceRefs: readonly string[];
    readonly releaseTrustFreezeVerdictRefs: readonly string[];
    readonly dashboardBundleRefs: readonly string[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly essentialFunctions: readonly EssentialFunctionMap[];
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly recoveryEvidencePacks: readonly RecoveryEvidencePackSummary[];
    readonly latestRestoreRunRefs: readonly string[];
    readonly latestFailoverRunRefs: readonly string[];
    readonly latestChaosRunRefs: readonly string[];
    readonly latestJourneyRecoveryProofRefs: readonly string[];
    readonly latestResilienceActionSettlementRefs: readonly string[];
    readonly capturedAt: string;
  }): OperationalReadinessSnapshot {
    const resilienceTupleHash = this.createResilienceTupleHash(input.tuple);
    const hasStaleRunbook = input.runbookBindings.some(
      (binding) => binding.bindingState !== "published",
    );
    const hasStaleCoverage = input.syntheticCoverage.some(
      (coverage) => coverage.coverageState !== "exact",
    );
    const hasStaleManifest = input.backupManifests.some(
      (manifest) => manifest.manifestState !== "current",
    );
    const hasStalePack = input.recoveryEvidencePacks.some((pack) => pack.packState !== "current");
    const hasTupleDrift =
      input.runbookBindings.some(
        (binding) => binding.resilienceTupleHash !== resilienceTupleHash,
      ) ||
      input.backupManifests.some(
        (manifest) => manifest.resilienceTupleHash !== resilienceTupleHash,
      ) ||
      input.recoveryEvidencePacks.some(
        (pack) => pack.resilienceTupleHash !== resilienceTupleHash,
      ) ||
      input.syntheticCoverage.some(
        (coverage) => coverage.resilienceTupleHash !== resilienceTupleHash,
      );
    const verdictCoverageState: OperationalReadinessVerdictCoverageState = hasTupleDrift
      ? "stale"
      : input.releaseTrustFreezeVerdictRefs.some((ref) => ref.includes("blocked"))
        ? "blocked"
        : "exact";
    const freshnessState: OperationalReadinessFreshnessState =
      hasTupleDrift || hasStaleManifest || hasStalePack ? "stale" : "fresh";
    const rehearsalFreshnessState: OperationalReadinessFreshnessState =
      hasStaleRunbook || hasStaleCoverage ? "stale" : "fresh";
    const readinessState: OperationalReadinessState =
      verdictCoverageState === "blocked"
        ? "blocked"
        : freshnessState === "fresh" && rehearsalFreshnessState === "fresh"
          ? "ready"
          : "constrained";
    const snapshotBase = {
      releaseRef: input.releaseRef,
      verificationScenarioRef: input.tuple.verificationScenarioRef,
      releaseContractVerificationMatrixRef: input.tuple.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.tuple.releaseContractMatrixHash,
      runtimePublicationBundleRef: input.tuple.runtimePublicationBundleRef,
      releasePublicationParityRef: input.tuple.releasePublicationParityRef,
      releaseWatchTupleRef: input.tuple.releaseWatchTupleRef,
      watchTupleHash: input.tuple.watchTupleHash,
      resilienceTupleHash,
      readinessState,
      capturedAt: input.capturedAt,
    };
    const snapshotId = `ors_444_${readinessHash(snapshotBase, "phase9.444.readiness-snapshot.id").slice(0, 16)}`;
    return {
      operationalReadinessSnapshotId: snapshotId,
      ...snapshotBase,
      waveObservationPolicyRef: input.waveObservationPolicyRef,
      requiredAssuranceSliceRefs: sortedUnique(input.requiredAssuranceSliceRefs),
      releaseTrustFreezeVerdictRefs: sortedUnique(input.releaseTrustFreezeVerdictRefs),
      dashboardBundleRefs: sortedUnique(input.dashboardBundleRefs),
      runbookBindingRefs: sortedUnique(
        input.runbookBindings.map((binding) => binding.runbookBindingRecordId),
      ),
      syntheticCoverageRefs: sortedUnique(
        input.syntheticCoverage.map((coverage) => coverage.syntheticRecoveryCoverageRecordId),
      ),
      essentialFunctionRefs: sortedUnique(
        input.essentialFunctions.map((map) => map.essentialFunctionMapId),
      ),
      essentialFunctionHealthEnvelopeRefs: sortedUnique(
        input.essentialFunctions.map((map) => `efhe_444_${map.functionCode}`),
      ),
      recoveryTierRefs: sortedUnique(input.recoveryTiers.map((tier) => tier.recoveryTierId)),
      backupSetManifestRefs: sortedUnique(
        input.backupManifests.map((manifest) => manifest.backupSetManifestId),
      ),
      resilienceSurfaceRuntimeBindingRefs: ["rsrb_444_ops_resilience"],
      recoveryControlPostureRefs: ["rcp_444_pending"],
      recoveryEvidencePackRefs: sortedUnique(
        input.recoveryEvidencePacks.map((pack) => pack.recoveryEvidencePackId),
      ),
      latestRecoveryEvidencePackRef:
        input.recoveryEvidencePacks[0]?.recoveryEvidencePackId ?? "recovery-pack:missing",
      latestRestoreRunRefs: sortedUnique(input.latestRestoreRunRefs),
      latestFailoverRunRefs: sortedUnique(input.latestFailoverRunRefs),
      latestChaosRunRefs: sortedUnique(input.latestChaosRunRefs),
      latestJourneyRecoveryProofRefs: sortedUnique(input.latestJourneyRecoveryProofRefs),
      latestResilienceActionSettlementRefs: sortedUnique(
        input.latestResilienceActionSettlementRefs,
      ),
      ownerCoverageState: input.essentialFunctions.every((map) => map.businessOwnerRef.length > 0)
        ? "complete"
        : "partial",
      verdictCoverageState,
      freshnessState,
      rehearsalFreshnessState,
    };
  }

  deriveRecoveryControlPosture(input: {
    readonly scopeRef: string;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly recoveryEvidencePacks: readonly RecoveryEvidencePackSummary[];
    readonly publicationState: RecoveryPublicationState;
    readonly trustState: RecoveryTrustState;
    readonly freezeState: RecoveryFreezeState;
    readonly releaseTrustFreezeVerdictRef: string;
    readonly latestRestoreRunRef: string;
    readonly latestFailoverRunRef: string;
    readonly latestChaosRunRef: string;
    readonly restoreValidationFreshnessState: RecoveryFreshnessState;
    readonly failoverValidationFreshnessState: RecoveryFreshnessState;
    readonly chaosValidationFreshnessState: RecoveryFreshnessState;
    readonly dependencyCoverageState: DependencyCoverageState;
    readonly journeyRecoveryCoverageState: JourneyRecoveryCoverageState;
    readonly evidencePackAdmissibilityState?: EvidencePackAdmissibilityState;
    readonly releaseRecoveryDispositionRef: string;
    readonly computedAt: string;
  }): RecoveryControlPosture {
    const blockerRefs = new Set<string>();
    const states: RecoveryControlPostureState[] = ["live_control"];
    const missingRunbook =
      input.runbookBindings.length === 0 ||
      input.runbookBindings.some((binding) => binding.bindingState !== "published");
    const backupManifestState =
      input.backupManifests.length === 0
        ? "missing"
        : input.backupManifests.some((manifest) => manifest.manifestState === "missing")
          ? "missing"
          : input.backupManifests.some((manifest) => manifest.manifestState !== "current")
            ? "stale"
            : "current";
    const evidencePackAdmissibilityState =
      input.evidencePackAdmissibilityState ??
      (input.recoveryEvidencePacks.some(
        (pack) => pack.packState === "blocked" || pack.packState === "missing",
      )
        ? "blocked"
        : input.recoveryEvidencePacks.some((pack) => pack.packState !== "current")
          ? "stale"
          : "exact");

    if (input.publicationState !== "current") {
      blockerRefs.add(`publication:${input.publicationState}`);
      states.push("diagnostic_only");
    }
    if (input.trustState !== "trusted") {
      blockerRefs.add(`trust:${input.trustState}`);
      states.push(input.trustState === "blocked" ? "blocked" : "diagnostic_only");
    }
    if (input.freezeState !== "clear") {
      blockerRefs.add(`freeze:${input.freezeState}`);
      states.push("governed_recovery");
    }
    if (input.snapshot.readinessState !== "ready") {
      blockerRefs.add(`readiness:${input.snapshot.readinessState}`);
      states.push(input.snapshot.readinessState === "blocked" ? "blocked" : "diagnostic_only");
    }
    if (missingRunbook) {
      blockerRefs.add("runbook:missing-or-stale");
      states.push("diagnostic_only");
    }
    if (backupManifestState !== "current") {
      blockerRefs.add(`backup:${backupManifestState}`);
      states.push(backupManifestState === "missing" ? "blocked" : "diagnostic_only");
    }
    if (evidencePackAdmissibilityState !== "exact") {
      blockerRefs.add(`evidence-pack:${evidencePackAdmissibilityState}`);
      states.push(evidencePackAdmissibilityState === "blocked" ? "blocked" : "diagnostic_only");
    }
    for (const [name, state] of [
      ["restore", input.restoreValidationFreshnessState],
      ["failover", input.failoverValidationFreshnessState],
      ["chaos", input.chaosValidationFreshnessState],
    ] as const) {
      if (state !== "fresh") {
        blockerRefs.add(`${name}-validation:${state}`);
        states.push(state === "missing" ? "blocked" : "diagnostic_only");
      }
    }
    if (input.dependencyCoverageState !== "complete") {
      blockerRefs.add(`dependency-coverage:${input.dependencyCoverageState}`);
      states.push(input.dependencyCoverageState === "blocked" ? "blocked" : "diagnostic_only");
    }
    if (input.journeyRecoveryCoverageState !== "exact") {
      blockerRefs.add(`journey-proof:${input.journeyRecoveryCoverageState}`);
      states.push(input.journeyRecoveryCoverageState === "missing" ? "blocked" : "diagnostic_only");
    }
    const postureState = worstPostureState(states);
    const allowedActionRefs =
      postureState === "live_control"
        ? ["restore_prepare", "restore_validate", "failover_validate", "chaos_schedule"]
        : postureState === "governed_recovery"
          ? ["restore_prepare", "recovery_pack_attest"]
          : [];
    const authoritativeScopeTupleHash = readinessHash(
      {
        scopeRef: input.scopeRef,
        snapshotRef: input.snapshot.operationalReadinessSnapshotId,
        resilienceTupleHash: input.snapshot.resilienceTupleHash,
      },
      "phase9.444.authoritative-scope-tuple",
    );
    const postureBase = {
      scopeRef: input.scopeRef,
      snapshotRef: input.snapshot.operationalReadinessSnapshotId,
      publicationState: input.publicationState,
      trustState: input.trustState,
      freezeState: input.freezeState,
      restoreValidationFreshnessState: input.restoreValidationFreshnessState,
      failoverValidationFreshnessState: input.failoverValidationFreshnessState,
      chaosValidationFreshnessState: input.chaosValidationFreshnessState,
      dependencyCoverageState: input.dependencyCoverageState,
      journeyRecoveryCoverageState: input.journeyRecoveryCoverageState,
      backupManifestState,
      evidencePackAdmissibilityState,
      postureState,
      blockerRefs: sortedUnique([...blockerRefs]),
      authoritativeScopeTupleHash,
      releaseRecoveryDispositionRef: input.releaseRecoveryDispositionRef,
      computedAt: input.computedAt,
    };
    const controlTupleHash = readinessHash(postureBase, "phase9.444.recovery-control-posture");
    return {
      recoveryControlPostureId: `rcp_444_${controlTupleHash.slice(0, 16)}`,
      scopeRef: input.scopeRef,
      verificationScenarioRef: input.snapshot.verificationScenarioRef,
      releaseContractVerificationMatrixRef: input.snapshot.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.snapshot.releaseContractMatrixHash,
      runtimePublicationBundleRef: input.snapshot.runtimePublicationBundleRef,
      releasePublicationParityRef: input.snapshot.releasePublicationParityRef,
      releaseWatchTupleRef: input.snapshot.releaseWatchTupleRef,
      watchTupleHash: input.snapshot.watchTupleHash,
      publicationState: input.publicationState,
      trustState: input.trustState,
      freezeState: input.freezeState,
      releaseTrustFreezeVerdictRef: input.releaseTrustFreezeVerdictRef,
      operationalReadinessSnapshotRef: input.snapshot.operationalReadinessSnapshotId,
      requiredRunbookBindingRefs: sortedUnique(
        input.runbookBindings.map((binding) => binding.runbookBindingRecordId),
      ),
      recoveryTierRefs: sortedUnique(input.recoveryTiers.map((tier) => tier.recoveryTierId)),
      requiredBackupSetManifestRefs: sortedUnique(
        input.backupManifests.map((manifest) => manifest.backupSetManifestId),
      ),
      requiredSyntheticRecoveryCoverageRefs: sortedUnique(
        input.syntheticCoverage.map((coverage) => coverage.syntheticRecoveryCoverageRecordId),
      ),
      latestRestoreRunRef: input.latestRestoreRunRef,
      latestFailoverRunRef: input.latestFailoverRunRef,
      latestChaosRunRef: input.latestChaosRunRef,
      currentRecoveryEvidencePackRef:
        input.recoveryEvidencePacks[0]?.recoveryEvidencePackId ?? "recovery-pack:missing",
      latestRecoveryEvidencePackRef:
        input.recoveryEvidencePacks[0]?.recoveryEvidencePackId ?? "recovery-pack:missing",
      latestResilienceActionSettlementRefs: input.snapshot.latestResilienceActionSettlementRefs,
      restoreValidationFreshnessState: input.restoreValidationFreshnessState,
      failoverValidationFreshnessState: input.failoverValidationFreshnessState,
      chaosValidationFreshnessState: input.chaosValidationFreshnessState,
      dependencyCoverageState: input.dependencyCoverageState,
      journeyRecoveryCoverageState: input.journeyRecoveryCoverageState,
      backupManifestState,
      evidencePackAdmissibilityState,
      postureState,
      allowedActionRefs,
      blockerRefs: sortedUnique([...blockerRefs]),
      authoritativeScopeTupleHash,
      controlTupleHash,
      releaseRecoveryDispositionRef: input.releaseRecoveryDispositionRef,
      lastComputedAt: input.computedAt,
    };
  }

  listEssentialFunctions(input: {
    readonly actor: ReadinessActorContext;
    readonly rows: readonly EssentialFunctionMap[];
  }) {
    requireReadinessActor(input.actor, "listEssentialFunctions");
    return input.rows;
  }

  listRecoveryTiers(input: {
    readonly actor: ReadinessActorContext;
    readonly rows: readonly RecoveryTier[];
  }) {
    requireReadinessActor(input.actor, "listRecoveryTiers");
    return input.rows;
  }

  getCurrentReadinessSnapshotByFunction(input: {
    readonly actor: ReadinessActorContext;
    readonly functionCode: string;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly essentialFunctions: readonly EssentialFunctionMap[];
  }): OperationalReadinessSnapshot {
    requireReadinessActor(input.actor, "getCurrentReadinessSnapshotByFunction");
    readinessInvariant(
      input.essentialFunctions.some((map) => map.functionCode === input.functionCode),
      "READINESS_FUNCTION_NOT_FOUND",
      "Unknown essential function.",
    );
    return input.snapshot;
  }

  getRunbookBindingState(input: {
    readonly actor: ReadinessActorContext;
    readonly runbookBinding: RunbookBindingRecord;
  }): RunbookBindingState {
    requireReadinessActor(input.actor, "getRunbookBindingState");
    return input.runbookBinding.bindingState;
  }

  getBackupManifestFreshness(input: {
    readonly actor: ReadinessActorContext;
    readonly backupManifest: BackupSetManifest;
  }): Pick<
    BackupSetManifest,
    "backupSetManifestId" | "manifestState" | "checksumBundleRef" | "immutabilityState"
  > {
    requireReadinessActor(input.actor, "getBackupManifestFreshness");
    return {
      backupSetManifestId: input.backupManifest.backupSetManifestId,
      manifestState: input.backupManifest.manifestState,
      checksumBundleRef: input.backupManifest.checksumBundleRef,
      immutabilityState: input.backupManifest.immutabilityState,
    };
  }

  getRecoveryControlPosture(input: {
    readonly actor: ReadinessActorContext;
    readonly posture: RecoveryControlPosture;
  }): RecoveryControlPosture {
    requireReadinessActor(input.actor, "getRecoveryControlPosture");
    return input.posture;
  }

  explainRecoveryControlBlockers(input: {
    readonly actor: ReadinessActorContext;
    readonly posture: RecoveryControlPosture;
  }): readonly string[] {
    requireReadinessActor(input.actor, "explainRecoveryControlBlockers");
    return input.posture.blockerRefs.length > 0
      ? input.posture.blockerRefs.map((blocker) => `blocked:${blocker}`)
      : ["live:current-resilience-tuple"];
  }

  listRecoveryProofDebt(input: {
    readonly actor: ReadinessActorContext;
    readonly essentialFunctions: readonly EssentialFunctionMap[];
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly generatedAt: string;
  }): readonly RecoveryProofDebtRecord[] {
    requireReadinessActor(input.actor, "listRecoveryProofDebt");
    return input.essentialFunctions.map((map) => {
      const tier = input.recoveryTiers.find(
        (candidate) => candidate.recoveryTierId === map.recoveryTierRef,
      );
      const staleRunbookRefs = input.runbookBindings
        .filter(
          (binding) =>
            map.runbookBindingRefs.includes(binding.runbookBindingRecordId) &&
            binding.bindingState !== "published",
        )
        .map((binding) => binding.runbookBindingRecordId);
      const staleBackupManifestRefs = input.backupManifests
        .filter(
          (manifest) =>
            tier?.requiredBackupScopeRefs.some(
              (scopeRef) => manifest.datasetScopeRef === scopeRef,
            ) && manifest.manifestState !== "current",
        )
        .map((manifest) => manifest.backupSetManifestId);
      const coverageRefs = new Set(
        input.syntheticCoverage
          .filter(
            (coverage) =>
              coverage.functionCode === map.functionCode && coverage.coverageState === "exact",
          )
          .map((coverage) => coverage.journeyProofRef),
      );
      const missingProofRefs = sortedUnique(
        (tier?.requiredJourneyProofRefs ?? []).filter((proofRef) => !coverageRefs.has(proofRef)),
      );
      const blockerRefs = sortedUnique([
        ...staleRunbookRefs.map((ref) => `runbook:${ref}`),
        ...staleBackupManifestRefs.map((ref) => `backup:${ref}`),
        ...missingProofRefs.map((ref) => `journey-proof:${ref}`),
      ]);
      return {
        recoveryProofDebtRecordId: `rpdr_444_${readinessHash(
          { functionCode: map.functionCode, blockerRefs },
          "phase9.444.recovery-proof-debt",
        ).slice(0, 16)}`,
        functionCode: map.functionCode,
        missingProofRefs,
        staleRunbookRefs,
        staleBackupManifestRefs,
        nextRehearsalDueAt: blockerRefs.length > 0 ? input.generatedAt : "2026-05-27T13:00:00.000Z",
        blockerRefs,
      };
    });
  }

  listWithCursor<T>(rows: readonly T[], cursor?: string, limit = 25): ReadinessPosturePage<T> {
    const offset = cursor?.startsWith("cursor:") ? Number(cursor.slice("cursor:".length)) : 0;
    const pageRows = rows.slice(offset, offset + limit);
    const nextOffset = offset + pageRows.length;
    return {
      rows: pageRows,
      nextCursor: nextOffset < rows.length ? `cursor:${nextOffset}` : undefined,
    };
  }
}

const functionCodes = [
  "digital_intake",
  "safety_gate",
  "triage_queue",
  "patient_status_secure_links",
  "local_booking",
  "hub_coordination",
  "pharmacy_referral_loop",
  "outbound_communications",
  "audit_search",
  "assistive_layer_downgrade",
] as const;

function makeCommonTuple(): Omit<
  ResilienceTupleMembers,
  | "runbookBindingRefs"
  | "backupSetManifestRefs"
  | "recoveryEvidencePackRefs"
  | "syntheticRecoveryCoverageRefs"
> {
  return {
    verificationScenarioRef: "verification:phase9:resilience-current",
    releaseContractVerificationMatrixRef: "rcvm_444_current",
    releaseContractMatrixHash: readinessHash("release-contract-matrix:444", "phase9.444.fixture"),
    runtimePublicationBundleRef: "rpb_444_current",
    releasePublicationParityRef: "rpp_444_exact",
    releaseWatchTupleRef: "rwt_444_current",
    watchTupleHash: readinessHash("watch-tuple:444", "phase9.444.fixture"),
  };
}

function createCoverage(
  service: Phase9OperationalReadinessPostureService,
  tuple: ResilienceTupleMembers,
  state: SyntheticCoverageState = "exact",
): SyntheticRecoveryCoverageRecord[] {
  const tupleHash = service.createResilienceTupleHash(tuple);
  return functionCodes.flatMap((functionCode) => [
    {
      syntheticRecoveryCoverageRecordId: `src_444_${functionCode}_primary`,
      functionCode,
      journeyProofRef: `journey:${functionCode}:primary`,
      resilienceTupleHash: tupleHash,
      coverageState: state,
      executedAt: "2026-04-27T13:05:00.000Z",
    },
  ]);
}

export function createPhase9OperationalReadinessPostureFixture(): Phase9OperationalReadinessPostureFixture {
  const generatedAt = "2026-04-27T13:15:00.000Z";
  const service = new Phase9OperationalReadinessPostureService();
  const dispositionFixture = createPhase9DispositionExecutionFixture();
  const common = makeCommonTuple();
  const actor: ReadinessActorContext = {
    tenantId: "tenant:demo-gp",
    actorRef: "actor:resilience-governance-444",
    roleRefs: ["resilience_governance", "records_governance"],
    purposeOfUseRef: "resilience:readiness:manage",
    reasonRef: "reason:444:readiness-authority",
    idempotencyKey: "idem:444:readiness",
    scopeTokenRef: "scope-token:tenant:demo-gp:resilience",
    generatedAt,
  };

  const dependencyOrderValidation = service.deriveDependencyOrder({
    dependencyOrderRef: "dependency-order:444:essential-functions",
    functionCodes,
    edges: [
      { beforeFunctionCode: "audit_search", afterFunctionCode: "digital_intake" },
      { beforeFunctionCode: "digital_intake", afterFunctionCode: "safety_gate" },
      { beforeFunctionCode: "safety_gate", afterFunctionCode: "triage_queue" },
      { beforeFunctionCode: "triage_queue", afterFunctionCode: "patient_status_secure_links" },
      { beforeFunctionCode: "triage_queue", afterFunctionCode: "local_booking" },
      { beforeFunctionCode: "local_booking", afterFunctionCode: "hub_coordination" },
      { beforeFunctionCode: "hub_coordination", afterFunctionCode: "pharmacy_referral_loop" },
      { beforeFunctionCode: "triage_queue", afterFunctionCode: "outbound_communications" },
      { beforeFunctionCode: "audit_search", afterFunctionCode: "assistive_layer_downgrade" },
    ],
  });
  const dependencyCycleValidation = service.deriveDependencyOrder({
    dependencyOrderRef: "dependency-order:444:cycle",
    functionCodes: ["digital_intake", "safety_gate", "triage_queue"],
    edges: [
      { beforeFunctionCode: "digital_intake", afterFunctionCode: "safety_gate" },
      { beforeFunctionCode: "safety_gate", afterFunctionCode: "triage_queue" },
      { beforeFunctionCode: "triage_queue", afterFunctionCode: "digital_intake" },
    ],
  });

  const recoveryTiers = functionCodes.map((functionCode, index) =>
    service.createRecoveryTier({
      recoveryTierId: `rt_444_${functionCode}`,
      functionCode,
      rto: index < 3 ? "PT30M" : index < 8 ? "PT60M" : "PT45M",
      rpo: index < 3 ? "PT5M" : "PT15M",
      maxDiagnosticOnlyWindow: "PT4H",
      degradedModeDefinitionRef: `degraded-mode:444:${functionCode}`,
      restorePriority: index + 1,
      requiredJourneyProofRefs: [`journey:${functionCode}:primary`],
      requiredDependencyRestoreProofRefs: [`dependency-proof:${functionCode}:order`],
      requiredFailoverScenarioRefs: [`failover-scenario:${functionCode}:degraded`],
      requiredChaosExperimentRefs: [`chaos-experiment:${functionCode}:guardrail`],
      requiredBackupScopeRefs: [
        "dataset:transactional-domain",
        index % 2 === 0 ? "dataset:event-spine" : "dataset:projection-read-models",
        "dataset:worm-audit",
      ],
    }),
  );

  const runbookBindingRefs = functionCodes.map((functionCode) => `rbr_444_${functionCode}`);
  const backupSetManifestRefs = [
    "bsm_444_transactional",
    "bsm_444_event_spine",
    "bsm_444_projection",
    "bsm_444_worm",
  ];
  const recoveryEvidencePackRefs = ["rep_444_current"] as const;
  const syntheticCoverageRefs = functionCodes.map(
    (functionCode) => `src_444_${functionCode}_primary`,
  );
  const tuple: ResilienceTupleMembers = {
    ...common,
    runbookBindingRefs,
    backupSetManifestRefs,
    recoveryEvidencePackRefs,
    syntheticRecoveryCoverageRefs: syntheticCoverageRefs,
  };
  const resilienceTupleHash = service.createResilienceTupleHash(tuple);

  const essentialFunctions = functionCodes.map((functionCode, index) =>
    service.createEssentialFunctionMap({
      essentialFunctionMapId: `efm_444_${functionCode}`,
      functionCode,
      audienceScopeRefs: [
        `audience:${index < 4 ? "patient" : index < 8 ? "operations" : "governance"}`,
      ],
      businessOwnerRef: `owner:444:${functionCode}`,
      recoveryTierRef: `rt_444_${functionCode}`,
      supportingSystemRefs: [`system:${functionCode}:primary`, `system:${functionCode}:projection`],
      supportingDataRefs: [
        "dataset:transactional-domain",
        index % 2 === 0 ? "dataset:event-spine" : "dataset:projection-read-models",
      ],
      dependencyOrderRef: dependencyOrderValidation.dependencyOrderRef,
      degradedModeRefs: [`degraded-mode:444:${functionCode}`],
      runbookBindingRefs: [`rbr_444_${functionCode}`],
      currentOperationalReadinessSnapshotRef: "ors_444_pending",
    }),
  );

  const backupManifestDefinitions = [
    ["bsm_444_transactional", "dataset:transactional-domain"],
    ["bsm_444_event_spine", "dataset:event-spine"],
    ["bsm_444_projection", "dataset:projection-read-models"],
    ["bsm_444_worm", "dataset:worm-audit"],
  ] as const;
  const backupManifests = backupManifestDefinitions.map(([backupSetManifestId, datasetScopeRef]) =>
    service.createBackupSetManifest({
      backupSetManifestId,
      datasetScopeRef,
      essentialFunctionRefs: functionCodes,
      recoveryTierRefs: recoveryTiers.map((tier) => tier.recoveryTierId),
      snapshotTime: "2026-04-27T13:00:00.000Z",
      immutabilityState: "immutable",
      restoreTestState: "current",
      checksumBundleRef: `checksum-bundle:444:${datasetScopeRef}`,
      restoreCompatibilityDigestRef: readinessHash(
        { datasetScopeRef, runtimePublicationBundleRef: tuple.runtimePublicationBundleRef },
        "phase9.444.restore-compatibility",
      ),
      dependencyOrderDigestRef: dependencyOrderValidation.dependencyOrderDigestRef,
      requiredJourneyProofContractRefs: functionCodes.map(
        (functionCode) => `journey:${functionCode}:primary`,
      ),
      runtimePublicationBundleRef: tuple.runtimePublicationBundleRef,
      releasePublicationParityRef: tuple.releasePublicationParityRef,
      verificationScenarioRef: tuple.verificationScenarioRef,
      releaseContractVerificationMatrixRef: tuple.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: tuple.releaseContractMatrixHash,
      releaseWatchTupleRef: tuple.releaseWatchTupleRef,
      watchTupleHash: tuple.watchTupleHash,
      latestRecoveryEvidencePackRef: recoveryEvidencePackRefs[0],
      latestResilienceActionSettlementRef: "ras_444_restore_current",
      resilienceTupleHash,
      verifiedAt: "2026-04-27T13:05:00.000Z",
    }),
  );
  const missingBackupManifest = {
    ...backupManifests[0]!,
    backupSetManifestId: "bsm_444_missing",
    manifestState: "missing" as const,
    immutabilityState: "disputed" as const,
    restoreTestState: "missing" as const,
    checksumBundleRef: "",
  };
  const staleBackupManifest = {
    ...backupManifests[0]!,
    backupSetManifestId: "bsm_444_stale",
    manifestState: "stale" as const,
    restoreTestState: "stale" as const,
  };

  const runbookBindings = functionCodes.map((functionCode, index) =>
    service.createRunbookBindingRecord({
      runbookBindingRecordId: `rbr_444_${functionCode}`,
      runbookRef: `runbook:444:${functionCode}`,
      releaseRef: "release:phase9:444",
      verificationScenarioRef: tuple.verificationScenarioRef,
      releaseContractVerificationMatrixRef: tuple.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: tuple.releaseContractMatrixHash,
      audienceScope: index < 4 ? "patient" : index < 8 ? "operations" : "governance",
      routeFamilyRefs: [`route-family:${functionCode}`],
      essentialFunctionRefs: [`efm_444_${functionCode}`],
      recoveryTierRefs: [`rt_444_${functionCode}`],
      runtimePublicationBundleRef: tuple.runtimePublicationBundleRef,
      releasePublicationParityRef: tuple.releasePublicationParityRef,
      releaseWatchTupleRef: tuple.releaseWatchTupleRef,
      releaseRecoveryDispositionRefs: ["rrd_444_recovery"],
      watchTupleHash: tuple.watchTupleHash,
      requiredBackupSetManifestRefs: backupSetManifestRefs,
      requiredRecoveryEvidencePackRefs: recoveryEvidencePackRefs,
      requiredSyntheticRecoveryCoverageRefs: [`src_444_${functionCode}_primary`],
      versionHash: readinessHash(`runbook:${functionCode}:v1`, "phase9.444.runbook-version"),
      lastRehearsedAt: "2026-04-27T12:00:00.000Z",
      lastRehearsalSettlementRef: `ras_444_${functionCode}`,
      latestRecoveryEvidenceArtifactRefs: [`rea_444_${functionCode}`],
      latestResilienceActionSettlementRefs: [`ras_444_${functionCode}`],
      resilienceTupleHash,
    }),
  );
  const staleRunbookBinding = service.createRunbookBindingRecord({
    ...runbookBindings[0]!,
    runbookBindingRecordId: "rbr_444_stale_digital_intake",
    bindingState: "stale",
  });
  const withdrawnRunbookBinding = service.createRunbookBindingRecord({
    ...runbookBindings[1]!,
    runbookBindingRecordId: "rbr_444_withdrawn_safety_gate",
    runbookRef: "runbook:withdrawn:safety_gate",
    bindingState: "withdrawn",
  });
  const syntheticCoverage = createCoverage(service, tuple);
  const missingJourneyCoverage = syntheticCoverage.filter(
    (coverage) => coverage.functionCode !== "digital_intake",
  );
  const recoveryEvidencePacks: RecoveryEvidencePackSummary[] = [
    {
      recoveryEvidencePackId: recoveryEvidencePackRefs[0],
      functionCode: "all",
      packState: "current",
      resilienceTupleHash,
      artifactRefs: [
        "recovery-evidence-artifact:444:readiness-summary",
        dispositionFixture.archiveExecutionResult.manifest?.archiveManifestId ??
          "archive-manifest:443",
      ],
      validUntil: "2026-04-28T13:00:00.000Z",
    },
  ];
  const staleRecoveryEvidencePacks: RecoveryEvidencePackSummary[] = [
    {
      ...recoveryEvidencePacks[0]!,
      recoveryEvidencePackId: "rep_444_stale",
      packState: "stale",
      validUntil: "2026-04-26T13:00:00.000Z",
    },
  ];

  const readySnapshot = service.captureOperationalReadinessSnapshot({
    releaseRef: "release:phase9:444",
    tuple,
    waveObservationPolicyRef: "wop_444_current",
    requiredAssuranceSliceRefs: [
      "slice:runtime-publication",
      "slice:release-watch",
      "slice:resilience",
    ],
    releaseTrustFreezeVerdictRefs: ["rtfv_444_live"],
    dashboardBundleRefs: ["dashboard:ops-resilience"],
    runbookBindings,
    syntheticCoverage,
    essentialFunctions,
    recoveryTiers,
    backupManifests,
    recoveryEvidencePacks,
    latestRestoreRunRefs: ["restore_444_current"],
    latestFailoverRunRefs: ["failover_444_current"],
    latestChaosRunRefs: ["chaos_444_current"],
    latestJourneyRecoveryProofRefs: functionCodes.map(
      (functionCode) => `journey:${functionCode}:primary`,
    ),
    latestResilienceActionSettlementRefs: ["ras_444_restore_current"],
    capturedAt: generatedAt,
  });
  const staleRunbookSnapshot = service.captureOperationalReadinessSnapshot({
    releaseRef: "release:phase9:444",
    tuple,
    waveObservationPolicyRef: "wop_444_current",
    requiredAssuranceSliceRefs: [
      "slice:runtime-publication",
      "slice:release-watch",
      "slice:resilience",
    ],
    releaseTrustFreezeVerdictRefs: ["rtfv_444_live"],
    dashboardBundleRefs: ["dashboard:ops-resilience"],
    runbookBindings: [staleRunbookBinding, ...runbookBindings.slice(1)],
    syntheticCoverage,
    essentialFunctions,
    recoveryTiers,
    backupManifests,
    recoveryEvidencePacks,
    latestRestoreRunRefs: ["restore_444_current"],
    latestFailoverRunRefs: ["failover_444_current"],
    latestChaosRunRefs: ["chaos_444_current"],
    latestJourneyRecoveryProofRefs: functionCodes.map(
      (functionCode) => `journey:${functionCode}:primary`,
    ),
    latestResilienceActionSettlementRefs: ["ras_444_restore_current"],
    capturedAt: generatedAt,
  });

  const postureInput = {
    scopeRef: "scope:tenant:demo-gp:resilience",
    snapshot: readySnapshot,
    runbookBindings,
    recoveryTiers,
    backupManifests,
    syntheticCoverage,
    recoveryEvidencePacks,
    publicationState: "current" as const,
    trustState: "trusted" as const,
    freezeState: "clear" as const,
    releaseTrustFreezeVerdictRef: "rtfv_444_live",
    latestRestoreRunRef: "restore_444_current",
    latestFailoverRunRef: "failover_444_current",
    latestChaosRunRef: "chaos_444_current",
    restoreValidationFreshnessState: "fresh" as const,
    failoverValidationFreshnessState: "fresh" as const,
    chaosValidationFreshnessState: "fresh" as const,
    dependencyCoverageState: "complete" as const,
    journeyRecoveryCoverageState: "exact" as const,
    releaseRecoveryDispositionRef: "rrd_444_live",
    computedAt: generatedAt,
  };
  const livePosture = service.deriveRecoveryControlPosture(postureInput);
  const deterministicPostureReplay = service.deriveRecoveryControlPosture(postureInput);
  const stalePublicationPosture = service.deriveRecoveryControlPosture({
    ...postureInput,
    publicationState: "stale",
  });
  const degradedTrustPosture = service.deriveRecoveryControlPosture({
    ...postureInput,
    trustState: "degraded",
  });
  const activeFreezePosture = service.deriveRecoveryControlPosture({
    ...postureInput,
    freezeState: "active",
  });
  const missingBackupPosture = service.deriveRecoveryControlPosture({
    ...postureInput,
    backupManifests: [missingBackupManifest],
  });
  const missingRunbookPosture = service.deriveRecoveryControlPosture({
    ...postureInput,
    runbookBindings: [withdrawnRunbookBinding],
  });
  const staleEvidencePackPosture = service.deriveRecoveryControlPosture({
    ...postureInput,
    recoveryEvidencePacks: staleRecoveryEvidencePacks,
  });
  const missingJourneyProofPosture = service.deriveRecoveryControlPosture({
    ...postureInput,
    syntheticCoverage: missingJourneyCoverage,
    journeyRecoveryCoverageState: "missing",
  });
  const partialDependencyPosture = service.deriveRecoveryControlPosture({
    ...postureInput,
    dependencyCoverageState: "partial",
  });

  const proofDebt = service.listRecoveryProofDebt({
    actor,
    essentialFunctions,
    recoveryTiers,
    runbookBindings: [staleRunbookBinding, ...runbookBindings.slice(1)],
    backupManifests: [staleBackupManifest, ...backupManifests.slice(1)],
    syntheticCoverage: missingJourneyCoverage,
    generatedAt,
  });

  let tenantDeniedErrorCode = "";
  try {
    service.listEssentialFunctions({
      actor: {
        ...actor,
        idempotencyKey: "idem:444:tenant-denied",
        scopeTokenRef: "scope-token:tenant:other",
      },
      rows: essentialFunctions,
    });
  } catch (error) {
    tenantDeniedErrorCode =
      error instanceof Phase9OperationalReadinessPostureError ? error.code : "UNKNOWN";
  }
  let scopeDeniedErrorCode = "";
  try {
    service.getRecoveryControlPosture({
      actor: {
        ...actor,
        idempotencyKey: "idem:444:purpose-denied",
        purposeOfUseRef: "assurance:read",
      },
      posture: livePosture,
    });
  } catch (error) {
    scopeDeniedErrorCode =
      error instanceof Phase9OperationalReadinessPostureError ? error.code : "UNKNOWN";
  }

  return {
    schemaVersion: PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
    upstreamDispositionSchemaVersion: PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
    generatedAt,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9F",
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9B",
      "blueprint/platform-runtime-and-release-blueprint.md#OperationalReadinessSnapshot",
      "blueprint/platform-runtime-and-release-blueprint.md#RunbookBindingRecord",
      "data/contracts/443_phase9_disposition_execution_engine_contract.json",
    ],
    producedObjects: [
      "EssentialFunctionMap",
      "RecoveryTier",
      "BackupSetManifest",
      "OperationalReadinessSnapshot",
      "RunbookBindingRecord",
      "RecoveryControlPosture",
      "SyntheticRecoveryCoverageRecord",
      "RecoveryEvidencePackSummary",
      "RecoveryProofDebtRecord",
    ],
    apiSurface: [
      "listEssentialFunctions",
      "listRecoveryTiers",
      "getCurrentReadinessSnapshotByFunction",
      "getRunbookBindingState",
      "getBackupManifestFreshness",
      "getRecoveryControlPosture",
      "explainRecoveryControlBlockers",
      "listRecoveryProofDebt",
      "listWithCursor",
      "createResilienceTupleHash",
      "deriveDependencyOrder",
      "captureOperationalReadinessSnapshot",
      "deriveRecoveryControlPosture",
    ],
    essentialFunctions,
    recoveryTiers,
    backupManifests,
    runbookBindings,
    syntheticCoverage,
    recoveryEvidencePacks,
    readySnapshot,
    staleRunbookSnapshot,
    livePosture,
    stalePublicationPosture,
    degradedTrustPosture,
    activeFreezePosture,
    missingBackupPosture,
    missingRunbookPosture,
    staleEvidencePackPosture,
    missingJourneyProofPosture,
    partialDependencyPosture,
    dependencyOrderValidation,
    dependencyCycleValidation,
    proofDebt,
    tupleCompatibleRestoreDigest: service.deriveTupleCompatibleRestoreDigest({
      backupManifest: backupManifests[0]!,
      dependencyOrder: dependencyOrderValidation,
      requiredJourneyProofRefs: functionCodes.map(
        (functionCode) => `journey:${functionCode}:primary`,
      ),
    }),
    deterministicPostureReplay,
    tenantDeniedErrorCode,
    scopeDeniedErrorCode,
    replayHash: orderedSetHash(
      [
        readySnapshot.resilienceTupleHash,
        livePosture.controlTupleHash,
        deterministicPostureReplay.controlTupleHash,
        resilienceTupleHash,
        dispositionFixture.archiveExecutionResult.manifest?.manifestHash ?? "",
      ],
      "phase9.444.fixture.replay",
    ),
  };
}

export function phase9OperationalReadinessPostureSummary(
  fixture: Phase9OperationalReadinessPostureFixture = createPhase9OperationalReadinessPostureFixture(),
): string {
  return [
    "# 444 Phase 9 Operational Readiness And Recovery Control Posture",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Generated at: ${fixture.generatedAt}`,
    `Essential functions: ${fixture.essentialFunctions.length}`,
    `Ready snapshot: ${fixture.readySnapshot.operationalReadinessSnapshotId}`,
    `Readiness tuple hash: ${fixture.readySnapshot.resilienceTupleHash}`,
    `Live posture: ${fixture.livePosture.postureState}`,
    `Live control tuple hash: ${fixture.livePosture.controlTupleHash}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
    "## Posture Derivation",
    "",
    "- Essential functions are mapped from platform capabilities, not infrastructure components.",
    "- Recovery tiers must declare dependency proof, journey proof, failover scenario, chaos experiment, and backup scope requirements.",
    "- Backup manifests are current only when checksum, immutable storage, release tuple, dependency order, and restore-test proof are current.",
    "- Operational readiness snapshots and runbook bindings are tuple-bound inputs for every restore, failover, chaos, and recovery evidence posture.",
    "- Recovery control posture downgrades immediately for stale publication, degraded trust, active freeze, missing backups, missing runbooks, stale evidence packs, missing journey proof, or partial dependency coverage.",
    "",
  ].join("\n");
}

export function phase9OperationalReadinessPostureMatrixCsv(
  fixture: Phase9OperationalReadinessPostureFixture = createPhase9OperationalReadinessPostureFixture(),
): string {
  const rows = [
    ["case", "postureState", "blockers"],
    ["live", fixture.livePosture.postureState, fixture.livePosture.blockerRefs.join("|")],
    [
      "stale_publication",
      fixture.stalePublicationPosture.postureState,
      fixture.stalePublicationPosture.blockerRefs.join("|"),
    ],
    [
      "degraded_trust",
      fixture.degradedTrustPosture.postureState,
      fixture.degradedTrustPosture.blockerRefs.join("|"),
    ],
    [
      "active_freeze",
      fixture.activeFreezePosture.postureState,
      fixture.activeFreezePosture.blockerRefs.join("|"),
    ],
    [
      "missing_backup",
      fixture.missingBackupPosture.postureState,
      fixture.missingBackupPosture.blockerRefs.join("|"),
    ],
    [
      "missing_runbook",
      fixture.missingRunbookPosture.postureState,
      fixture.missingRunbookPosture.blockerRefs.join("|"),
    ],
    [
      "stale_evidence_pack",
      fixture.staleEvidencePackPosture.postureState,
      fixture.staleEvidencePackPosture.blockerRefs.join("|"),
    ],
    [
      "missing_journey_proof",
      fixture.missingJourneyProofPosture.postureState,
      fixture.missingJourneyProofPosture.blockerRefs.join("|"),
    ],
    [
      "partial_dependency",
      fixture.partialDependencyPosture.postureState,
      fixture.partialDependencyPosture.blockerRefs.join("|"),
    ],
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}
