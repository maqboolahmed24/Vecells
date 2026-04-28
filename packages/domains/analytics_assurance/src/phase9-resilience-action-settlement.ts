import {
  GENESIS_ASSURANCE_LEDGER_HASH,
  buildAssuranceLedgerEntry,
  hashAssurancePayload,
  orderedSetHash,
  type AssuranceLedgerEntry,
} from "./phase9-assurance-ledger-contracts";
import {
  PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
  createPhase9OperationalReadinessPostureFixture,
  type BackupSetManifest,
  type EssentialFunctionMap,
  type OperationalReadinessSnapshot,
  type ReadinessActorContext,
  type RecoveryControlPosture,
  type RecoveryTier,
  type RunbookBindingRecord,
  type SyntheticRecoveryCoverageRecord,
} from "./phase9-operational-readiness-posture";

export const PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION =
  "445.phase9.resilience-action-settlement.v1";

export type RestoreDependencyValidationState = "pending" | "complete" | "blocked";
export type RestoreJourneyValidationState = "pending" | "complete" | "blocked";
export type RestoreRunResultState =
  | "running"
  | "data_restored"
  | "journey_validation_pending"
  | "succeeded"
  | "failed"
  | "superseded";
export type FailoverScenarioState = "draft" | "approved" | "withdrawn";
export type FailoverRunValidationState = "pending" | "complete" | "blocked";
export type FailoverRunResultState =
  | "armed"
  | "active"
  | "validation_pending"
  | "stood_down"
  | "failed"
  | "superseded";
export type ChaosExperimentState = "draft" | "approved" | "withdrawn";
export type ChaosGuardrailState = "approved" | "constrained" | "blocked";
export type ChaosRunResultState =
  | "scheduled"
  | "running"
  | "halted"
  | "completed"
  | "failed"
  | "superseded";
export type ResilienceRecoveryEvidencePackState = "current" | "stale" | "blocked" | "superseded";
export type RecoveryEvidencePackAttestationState = "draft" | "attested" | "rejected";
export type ResilienceSurfaceRuntimeBindingState =
  | "live"
  | "diagnostic_only"
  | "recovery_only"
  | "blocked";
export type ResilienceActionType =
  | "restore_prepare"
  | "restore_start"
  | "restore_validate"
  | "failover_activate"
  | "failover_validate"
  | "failover_stand_down"
  | "chaos_schedule"
  | "chaos_start"
  | "chaos_abort"
  | "recovery_pack_attest";
export type ResilienceActionSettlementResult =
  | "accepted_pending_evidence"
  | "applied"
  | "blocked_publication"
  | "blocked_trust"
  | "blocked_readiness"
  | "blocked_guardrail"
  | "frozen"
  | "stale_scope"
  | "failed"
  | "superseded";
export type RecoveryEvidenceArtifactType =
  | "restore_report"
  | "failover_report"
  | "chaos_report"
  | "recovery_pack_export"
  | "dependency_restore_explainer"
  | "journey_recovery_proof"
  | "backup_manifest_report"
  | "runbook_bundle"
  | "readiness_snapshot_summary";
export type RecoveryEvidenceArtifactState =
  | "summary_only"
  | "governed_preview"
  | "external_handoff_ready"
  | "recovery_only";

export interface ResilienceCommandActorContext extends ReadinessActorContext {
  readonly expectedPostureHash: string;
  readonly expectedReadinessHash: string;
  readonly expectedTupleHash: string;
}

export interface RestoreRun {
  readonly restoreRunId: string;
  readonly releaseRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly essentialFunctionRefs: readonly string[];
  readonly recoveryTierRefs: readonly string[];
  readonly targetEnvironmentRef: string;
  readonly backupSetManifestRefs: readonly string[];
  readonly operationalReadinessSnapshotRef: string;
  readonly runbookBindingRefs: readonly string[];
  readonly recoveryControlPostureRef: string;
  readonly dependencyOrderDigestRef: string;
  readonly dependencyProofArtifactRefs: readonly string[];
  readonly journeyProofArtifactRefs: readonly string[];
  readonly syntheticRecoveryCoverageRefs: readonly string[];
  readonly restoreTupleHash: string;
  readonly resilienceTupleHash: string;
  readonly scopeTupleHash: string;
  readonly dependencyValidationState: RestoreDependencyValidationState;
  readonly journeyValidationState: RestoreJourneyValidationState;
  readonly initiatedAt: string;
  readonly completedAt: string;
  readonly resultState: RestoreRunResultState;
  readonly evidenceArtifactRefs: readonly string[];
  readonly recoveryEvidencePackRef: string;
  readonly resilienceActionSettlementRef: string;
}

export interface FailoverScenario {
  readonly failoverScenarioId: string;
  readonly targetFunction: string;
  readonly essentialFunctionRefs: readonly string[];
  readonly recoveryTierRefs: readonly string[];
  readonly triggerType: string;
  readonly degradedModeRef: string;
  readonly successCriteriaRef: string;
  readonly requiredRunbookBindingRefs: readonly string[];
  readonly requiredSyntheticRecoveryCoverageRefs: readonly string[];
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly activationPolicyRef: string;
  readonly scopeTupleHash: string;
  readonly scenarioHash: string;
  readonly scenarioState: FailoverScenarioState;
}

export interface FailoverRun {
  readonly failoverRunId: string;
  readonly releaseRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly failoverScenarioRef: string;
  readonly essentialFunctionRefs: readonly string[];
  readonly recoveryTierRefs: readonly string[];
  readonly operationalReadinessSnapshotRef: string;
  readonly runbookBindingRefs: readonly string[];
  readonly recoveryControlPostureRef: string;
  readonly failoverTupleHash: string;
  readonly resilienceTupleHash: string;
  readonly scopeTupleHash: string;
  readonly degradedModeRef: string;
  readonly dependencyOrderDigestRef: string;
  readonly journeyProofArtifactRefs: readonly string[];
  readonly syntheticRecoveryCoverageRefs: readonly string[];
  readonly validationState: FailoverRunValidationState;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly resultState: FailoverRunResultState;
  readonly evidenceArtifactRefs: readonly string[];
  readonly recoveryEvidencePackRef: string;
  readonly resilienceActionSettlementRef: string;
}

export interface ChaosExperiment {
  readonly chaosExperimentId: string;
  readonly blastRadiusRef: string;
  readonly essentialFunctionRefs: readonly string[];
  readonly recoveryTierRefs: readonly string[];
  readonly hypothesisRef: string;
  readonly guardrailRefs: readonly string[];
  readonly requiredSyntheticRecoveryCoverageRefs: readonly string[];
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly approvalPolicyRef: string;
  readonly approvedScopeTupleHash: string;
  readonly experimentHash: string;
  readonly experimentState: ChaosExperimentState;
}

export interface ChaosRun {
  readonly chaosRunId: string;
  readonly releaseRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly chaosExperimentRef: string;
  readonly essentialFunctionRefs: readonly string[];
  readonly recoveryTierRefs: readonly string[];
  readonly operationalReadinessSnapshotRef: string;
  readonly runbookBindingRefs: readonly string[];
  readonly recoveryControlPostureRef: string;
  readonly chaosTupleHash: string;
  readonly resilienceTupleHash: string;
  readonly scopeTupleHash: string;
  readonly blastRadiusRef: string;
  readonly guardrailState: ChaosGuardrailState;
  readonly journeyProofArtifactRefs: readonly string[];
  readonly syntheticRecoveryCoverageRefs: readonly string[];
  readonly startedAt: string;
  readonly completedAt: string;
  readonly resultState: ChaosRunResultState;
  readonly evidenceArtifactRefs: readonly string[];
  readonly recoveryEvidencePackRef: string;
  readonly resilienceActionSettlementRef: string;
}

export interface RecoveryEvidencePack {
  readonly recoveryEvidencePackId: string;
  readonly releaseRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly periodWindow: string;
  readonly operationalReadinessSnapshotRef: string;
  readonly recoveryTierRefs: readonly string[];
  readonly backupSetManifestRefs: readonly string[];
  readonly restoreRunRefs: readonly string[];
  readonly failoverRunRefs: readonly string[];
  readonly chaosRunRefs: readonly string[];
  readonly syntheticRecoveryCoverageRefs: readonly string[];
  readonly latestResilienceActionSettlementRefs: readonly string[];
  readonly readinessStateAtPackTime: string;
  readonly packTupleHash: string;
  readonly resilienceTupleHash: string;
  readonly artifactRefs: readonly string[];
  readonly attestationState: RecoveryEvidencePackAttestationState;
  readonly packState: ResilienceRecoveryEvidencePackState;
}

export interface ResilienceSurfaceRuntimeBinding {
  readonly resilienceSurfaceRuntimeBindingId: string;
  readonly routeFamilyRef: string;
  readonly audienceSurfaceRuntimeBindingRef: string;
  readonly audienceSurfaceRouteContractRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly requiredAssuranceSliceRefs: readonly string[];
  readonly releaseTrustFreezeVerdictRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly operationalReadinessSnapshotRef: string;
  readonly requiredRunbookBindingRefs: readonly string[];
  readonly requiredRecoveryTierRefs: readonly string[];
  readonly requiredBackupSetManifestRefs: readonly string[];
  readonly latestRecoveryEvidencePackRef: string;
  readonly requiredSyntheticRecoveryCoverageRefs: readonly string[];
  readonly latestResilienceActionSettlementRefs: readonly string[];
  readonly recoveryControlPostureRef: string;
  readonly releaseRecoveryDispositionRef: string;
  readonly bindingTupleHash: string;
  readonly bindingState: ResilienceSurfaceRuntimeBindingState;
}

export interface ResilienceActionRecord {
  readonly resilienceActionRecordId: string;
  readonly routeIntentBindingRef: string;
  readonly actionType: ResilienceActionType;
  readonly scopeRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly resilienceSurfaceRuntimeBindingRef: string;
  readonly operationalReadinessSnapshotRef: string;
  readonly recoveryControlPostureRef: string;
  readonly backupSetManifestRefs: readonly string[];
  readonly requiredSyntheticRecoveryCoverageRefs: readonly string[];
  readonly scopeTupleHash: string;
  readonly submittedBy: string;
  readonly submittedAt: string;
  readonly commandActionRecordRef: string;
  readonly actionRecordHash: string;
}

export interface ResilienceActionSettlement {
  readonly resilienceActionSettlementId: string;
  readonly resilienceActionRecordRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly commandSettlementRef: string;
  readonly transitionEnvelopeRef: string;
  readonly authoritativeRunRefs: readonly string[];
  readonly recoveryEvidencePackRef: string;
  readonly syntheticRecoveryCoverageRefs: readonly string[];
  readonly recoveryEvidenceArtifactRefs: readonly string[];
  readonly result: ResilienceActionSettlementResult;
  readonly recordedPostureRef: string;
  readonly scopeTupleHash: string;
  readonly controlTupleHash: string;
  readonly releaseRecoveryDispositionRef: string;
  readonly settledAt: string;
  readonly settlementHash: string;
}

export interface RecoveryEvidenceArtifact {
  readonly recoveryEvidenceArtifactId: string;
  readonly artifactType: RecoveryEvidenceArtifactType;
  readonly scopeRef: string;
  readonly verificationScenarioRef: string;
  readonly releaseContractVerificationMatrixRef: string;
  readonly releaseContractMatrixHash: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly operationalReadinessSnapshotRef: string;
  readonly recoveryControlPostureRef: string;
  readonly runbookBindingRefs: readonly string[];
  readonly backupSetManifestRefs: readonly string[];
  readonly producingRunRef: string;
  readonly recoveryEvidencePackRef: string;
  readonly syntheticRecoveryCoverageRefs: readonly string[];
  readonly latestResilienceActionSettlementRefs: readonly string[];
  readonly summaryRef: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly artifactPresentationContractRef: string;
  readonly artifactSurfaceContextRef: string;
  readonly artifactModeTruthProjectionRef: string;
  readonly artifactTransferSettlementRef: string;
  readonly artifactFallbackDispositionRef: string;
  readonly outboundNavigationGrantPolicyRef: string;
  readonly maskingPolicyRef: string;
  readonly externalHandoffPolicyRef: string;
  readonly selectedAnchorRef: string;
  readonly returnIntentTokenRef: string;
  readonly resilienceTupleHash: string;
  readonly artifactState: RecoveryEvidenceArtifactState;
  readonly artifactHash: string;
}

export interface RecoveryEvidenceGraphWriteback {
  readonly writebackId: string;
  readonly producingRunRef: string;
  readonly recoveryEvidencePackRef: string;
  readonly assuranceLedgerEntry: AssuranceLedgerEntry;
  readonly graphEdgeRefs: readonly string[];
  readonly affectedOperationalReadinessSnapshotRef: string;
  readonly affectedRunbookBindingRefs: readonly string[];
  readonly affectedResilienceSurfaceRuntimeBindingRef: string;
  readonly affectedRecoveryControlPostureRef: string;
  readonly writebackHash: string;
  readonly writtenAt: string;
}

export interface LatestResilienceRunAndSettlementState {
  readonly actionType: ResilienceActionType;
  readonly latestRunRef: string;
  readonly latestSettlementRef: string;
  readonly latestSettlementResult: ResilienceActionSettlementResult;
  readonly visibleActionableState: "live" | "pending_evidence" | "blocked" | "recovery_only";
  readonly blockerRefs: readonly string[];
}

export interface ResilienceActionSettlementPage<T> {
  readonly rows: readonly T[];
  readonly nextCursor?: string;
}

export interface Phase9ResilienceActionSettlementFixture {
  readonly schemaVersion: typeof PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION;
  readonly upstreamReadinessSchemaVersion: typeof PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly producedObjects: readonly string[];
  readonly apiSurface: readonly string[];
  readonly readinessInputs: {
    readonly essentialFunctionCount: number;
    readonly recoveryTierCount: number;
    readonly backupManifestCount: number;
    readonly readinessHash: string;
    readonly postureHash: string;
    readonly tupleHash: string;
  };
  readonly surfaceBindingLive: ResilienceSurfaceRuntimeBinding;
  readonly surfaceBindingDiagnostic: ResilienceSurfaceRuntimeBinding;
  readonly restorePreparedSettlement: ResilienceActionSettlement;
  readonly restoreStartedRun: RestoreRun;
  readonly restoreValidatedRun: RestoreRun;
  readonly dependencyBlockedRestoreRun: RestoreRun;
  readonly missingJourneyProofRestoreRun: RestoreRun;
  readonly approvedFailoverScenario: FailoverScenario;
  readonly staleFailoverScenario: FailoverScenario;
  readonly failoverActivatedRun: FailoverRun;
  readonly failoverStoodDownRun: FailoverRun;
  readonly staleFailoverSettlement: ResilienceActionSettlement;
  readonly approvedChaosExperiment: ChaosExperiment;
  readonly blockedChaosExperiment: ChaosExperiment;
  readonly chaosScheduledRun: ChaosRun;
  readonly chaosRunningRun: ChaosRun;
  readonly chaosGuardrailBlockedSettlement: ResilienceActionSettlement;
  readonly blockedEveryActionTypeSettlements: readonly ResilienceActionSettlement[];
  readonly latestSettlementState: LatestResilienceRunAndSettlementState;
  readonly recoveryEvidencePack: RecoveryEvidencePack;
  readonly recoveryEvidenceArtifacts: readonly RecoveryEvidenceArtifact[];
  readonly deterministicArtifactHash: string;
  readonly deterministicArtifactReplayHash: string;
  readonly recoveryEvidenceGraphWriteback: RecoveryEvidenceGraphWriteback;
  readonly oldRestoreRunAfterTupleDrift: RestoreRun;
  readonly oldFailoverRunAfterTupleDrift: FailoverRun;
  readonly oldChaosRunAfterTupleDrift: ChaosRun;
  readonly tupleDriftSettlement: ResilienceActionSettlement;
  readonly duplicateIdempotencySettlement: ResilienceActionSettlement;
  readonly duplicateIdempotencyReplaySettlement: ResilienceActionSettlement;
  readonly authorizationDeniedErrorCode: string;
  readonly tenantDeniedErrorCode: string;
  readonly rawObjectStoreLinkDeniedErrorCode: string;
  readonly replayHash: string;
}

export class Phase9ResilienceActionSettlementError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9ResilienceActionSettlementError";
    this.code = code;
  }
}

function resilienceInvariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9ResilienceActionSettlementError(code, message);
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

function resilienceHash(value: unknown, namespace: string): string {
  return hashAssurancePayload(omitUndefined(value), namespace);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
}

function scopeMatchesTenant(scopeRef: string, tenantId: string): boolean {
  return scopeRef.includes(tenantId);
}

function startsWithRawObjectStoreRef(ref: string): boolean {
  return (
    ref.startsWith("s3://") ||
    ref.startsWith("gs://") ||
    ref.startsWith("blob://") ||
    ref.startsWith("azure://") ||
    ref.startsWith("http://object-store") ||
    ref.startsWith("https://object-store") ||
    ref.startsWith("https://s3.") ||
    ref.includes(".s3.amazonaws.com/")
  );
}

function requireResilienceActor(actor: ResilienceCommandActorContext, action: string): void {
  resilienceInvariant(
    actor.roleRefs.includes("resilience_operator") ||
      actor.roleRefs.includes("resilience_governance"),
    "RESILIENCE_ACTION_ROLE_DENIED",
    `${action} requires resilience_operator or resilience_governance role.`,
  );
  resilienceInvariant(
    actor.purposeOfUseRef.startsWith("resilience:action"),
    "RESILIENCE_ACTION_PURPOSE_DENIED",
    `${action} requires resilience:action purpose.`,
  );
  resilienceInvariant(
    actor.reasonRef.length > 0,
    "RESILIENCE_ACTION_REASON_REQUIRED",
    `${action} requires a reason ref.`,
  );
  resilienceInvariant(
    actor.idempotencyKey.length > 0,
    "RESILIENCE_ACTION_IDEMPOTENCY_REQUIRED",
    `${action} requires an idempotency key.`,
  );
  resilienceInvariant(
    scopeMatchesTenant(actor.scopeTokenRef, actor.tenantId),
    "RESILIENCE_ACTION_SCOPE_TENANT_DENIED",
    `${action} scope token must match tenant.`,
  );
}

function artifactInputFromArtifact(
  artifact: RecoveryEvidenceArtifact,
): Omit<RecoveryEvidenceArtifact, "recoveryEvidenceArtifactId" | "artifactHash"> {
  const {
    recoveryEvidenceArtifactId: _recoveryEvidenceArtifactId,
    artifactHash: _artifactHash,
    ...input
  } = artifact;
  return input;
}

function settlementResultFromPosture(input: {
  readonly snapshot: OperationalReadinessSnapshot;
  readonly posture: RecoveryControlPosture;
  readonly binding: ResilienceSurfaceRuntimeBinding;
  readonly expectedPostureHash: string;
  readonly expectedReadinessHash: string;
  readonly expectedTupleHash: string;
  readonly scopeTupleHash: string;
  readonly guardrailAllowed?: boolean;
}): ResilienceActionSettlementResult | undefined {
  if (
    input.expectedPostureHash !== input.posture.controlTupleHash ||
    input.expectedReadinessHash !== input.snapshot.resilienceTupleHash ||
    input.expectedTupleHash !== input.scopeTupleHash
  ) {
    return "stale_scope";
  }
  if (input.posture.publicationState !== "current") {
    return "blocked_publication";
  }
  if (input.posture.trustState !== "trusted") {
    return "blocked_trust";
  }
  if (input.posture.freezeState !== "clear") {
    return "frozen";
  }
  if (input.snapshot.readinessState !== "ready" || input.posture.postureState === "blocked") {
    return "blocked_readiness";
  }
  if (input.binding.bindingState === "blocked") {
    return "blocked_readiness";
  }
  if (input.guardrailAllowed === false) {
    return "blocked_guardrail";
  }
  if (
    input.binding.bindingState !== "live" ||
    input.posture.postureState !== "live_control" ||
    input.binding.bindingTupleHash !== input.snapshot.resilienceTupleHash
  ) {
    return "stale_scope";
  }
  return undefined;
}

export class Phase9ResilienceActionSettlementService {
  private readonly actionRecordsByIdempotency = new Map<string, ResilienceActionRecord>();
  private readonly settlementsByIdempotency = new Map<string, ResilienceActionSettlement>();
  private readonly settlementsById = new Map<string, ResilienceActionSettlement>();
  private readonly artifactsById = new Map<string, RecoveryEvidenceArtifact>();
  private readonly latestStateByActionType = new Map<
    ResilienceActionType,
    LatestResilienceRunAndSettlementState
  >();

  createScopeTupleHash(input: {
    readonly scopeRef: string;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
  }): string {
    return resilienceHash(
      {
        scopeRef: input.scopeRef,
        operationalReadinessSnapshotRef: input.snapshot.operationalReadinessSnapshotId,
        resilienceTupleHash: input.snapshot.resilienceTupleHash,
        recoveryControlPostureRef: input.posture.recoveryControlPostureId,
        controlTupleHash: input.posture.controlTupleHash,
        authoritativeScopeTupleHash: input.posture.authoritativeScopeTupleHash,
      },
      "phase9.445.scope-tuple",
    );
  }

  createResilienceSurfaceRuntimeBinding(input: {
    readonly routeFamilyRef: string;
    readonly audienceSurfaceRuntimeBindingRef: string;
    readonly audienceSurfaceRouteContractRef: string;
    readonly surfacePublicationRef: string;
    readonly requiredAssuranceSliceRefs: readonly string[];
    readonly snapshot: OperationalReadinessSnapshot;
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly recoveryControlPosture: RecoveryControlPosture;
    readonly latestRecoveryEvidencePackRef: string;
    readonly latestRecoveryEvidencePackState: ResilienceRecoveryEvidencePackState;
    readonly latestResilienceActionSettlementRefs: readonly string[];
    readonly audienceBindingCurrent?: boolean;
    readonly releaseTrustFreezeSurfaceAuthorityState?: "live" | "diagnostic_only" | "blocked";
  }): ResilienceSurfaceRuntimeBinding {
    const authorityState = input.releaseTrustFreezeSurfaceAuthorityState ?? "live";
    const audienceCurrent = input.audienceBindingCurrent ?? true;
    const bindingTupleHash =
      input.recoveryControlPosture.postureState === "live_control"
        ? input.snapshot.resilienceTupleHash
        : resilienceHash(
            {
              snapshotTuple: input.snapshot.resilienceTupleHash,
              postureTuple: input.recoveryControlPosture.controlTupleHash,
              blockerRefs: input.recoveryControlPosture.blockerRefs,
            },
            "phase9.445.binding-diagnostic-tuple",
          );
    const bindingState: ResilienceSurfaceRuntimeBindingState =
      !audienceCurrent ||
      authorityState === "blocked" ||
      input.snapshot.readinessState === "blocked" ||
      input.recoveryControlPosture.postureState === "blocked"
        ? "blocked"
        : authorityState !== "live" ||
            input.recoveryControlPosture.freezeState !== "clear" ||
            input.latestRecoveryEvidencePackState !== "current"
          ? "recovery_only"
          : input.recoveryControlPosture.postureState === "live_control" &&
              input.snapshot.readinessState === "ready" &&
              input.recoveryControlPosture.publicationState === "current" &&
              input.recoveryControlPosture.trustState === "trusted" &&
              bindingTupleHash !== ""
            ? "live"
            : "diagnostic_only";

    return {
      resilienceSurfaceRuntimeBindingId: `rsrb_445_${resilienceHash(
        {
          routeFamilyRef: input.routeFamilyRef,
          snapshotRef: input.snapshot.operationalReadinessSnapshotId,
          postureRef: input.recoveryControlPosture.recoveryControlPostureId,
          bindingTupleHash,
          bindingState,
        },
        "phase9.445.surface-binding.id",
      ).slice(0, 16)}`,
      routeFamilyRef: input.routeFamilyRef,
      audienceSurfaceRuntimeBindingRef: input.audienceSurfaceRuntimeBindingRef,
      audienceSurfaceRouteContractRef: input.audienceSurfaceRouteContractRef,
      surfacePublicationRef: input.surfacePublicationRef,
      runtimePublicationBundleRef: input.snapshot.runtimePublicationBundleRef,
      releasePublicationParityRef: input.snapshot.releasePublicationParityRef,
      verificationScenarioRef: input.snapshot.verificationScenarioRef,
      releaseContractVerificationMatrixRef: input.snapshot.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.snapshot.releaseContractMatrixHash,
      requiredAssuranceSliceRefs: sortedUnique(input.requiredAssuranceSliceRefs),
      releaseTrustFreezeVerdictRef: input.recoveryControlPosture.releaseTrustFreezeVerdictRef,
      releaseWatchTupleRef: input.snapshot.releaseWatchTupleRef,
      watchTupleHash: input.snapshot.watchTupleHash,
      operationalReadinessSnapshotRef: input.snapshot.operationalReadinessSnapshotId,
      requiredRunbookBindingRefs: sortedUnique(
        input.runbookBindings.map((binding) => binding.runbookBindingRecordId),
      ),
      requiredRecoveryTierRefs: sortedUnique(
        input.recoveryTiers.map((tier) => tier.recoveryTierId),
      ),
      requiredBackupSetManifestRefs: sortedUnique(
        input.backupManifests.map((manifest) => manifest.backupSetManifestId),
      ),
      latestRecoveryEvidencePackRef: input.latestRecoveryEvidencePackRef,
      requiredSyntheticRecoveryCoverageRefs: sortedUnique(
        input.syntheticCoverage.map((coverage) => coverage.syntheticRecoveryCoverageRecordId),
      ),
      latestResilienceActionSettlementRefs: sortedUnique(
        input.latestResilienceActionSettlementRefs,
      ),
      recoveryControlPostureRef: input.recoveryControlPosture.recoveryControlPostureId,
      releaseRecoveryDispositionRef: input.recoveryControlPosture.releaseRecoveryDispositionRef,
      bindingTupleHash,
      bindingState,
    };
  }

  createActionRecord(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly actionType: ResilienceActionType;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly backupManifests: readonly BackupSetManifest[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly scopeTupleHash: string;
  }): ResilienceActionRecord {
    requireResilienceActor(input.actor, input.actionType);
    const idempotencyKey = `${input.actor.tenantId}:${input.actor.idempotencyKey}:${input.actionType}:${input.scopeTupleHash}`;
    const existing = this.actionRecordsByIdempotency.get(idempotencyKey);
    if (existing) {
      return existing;
    }
    const base = {
      routeIntentBindingRef: input.routeIntentBindingRef,
      actionType: input.actionType,
      scopeRef: input.scopeRef,
      verificationScenarioRef: input.snapshot.verificationScenarioRef,
      releaseContractVerificationMatrixRef: input.snapshot.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.snapshot.releaseContractMatrixHash,
      runtimePublicationBundleRef: input.snapshot.runtimePublicationBundleRef,
      releasePublicationParityRef: input.snapshot.releasePublicationParityRef,
      releaseWatchTupleRef: input.snapshot.releaseWatchTupleRef,
      watchTupleHash: input.snapshot.watchTupleHash,
      resilienceSurfaceRuntimeBindingRef: input.binding.resilienceSurfaceRuntimeBindingId,
      operationalReadinessSnapshotRef: input.snapshot.operationalReadinessSnapshotId,
      recoveryControlPostureRef: input.posture.recoveryControlPostureId,
      backupSetManifestRefs: sortedUnique(
        input.backupManifests.map((manifest) => manifest.backupSetManifestId),
      ),
      requiredSyntheticRecoveryCoverageRefs: sortedUnique(
        input.syntheticCoverage.map((coverage) => coverage.syntheticRecoveryCoverageRecordId),
      ),
      scopeTupleHash: input.scopeTupleHash,
      submittedBy: input.actor.actorRef,
      submittedAt: input.actor.generatedAt,
      commandActionRecordRef: `car_445_${resilienceHash(
        { actor: input.actor.actorRef, idempotencyKey: input.actor.idempotencyKey },
        "phase9.445.command-action-ref",
      ).slice(0, 16)}`,
    };
    const actionRecordHash = resilienceHash(base, "phase9.445.action-record");
    const record: ResilienceActionRecord = {
      resilienceActionRecordId: `rar_445_${actionRecordHash.slice(0, 16)}`,
      ...base,
      actionRecordHash,
    };
    this.actionRecordsByIdempotency.set(idempotencyKey, record);
    return record;
  }

  settleAction(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly actionRecord: ResilienceActionRecord;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly authoritativeRunRefs?: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly syntheticRecoveryCoverageRefs: readonly string[];
    readonly recoveryEvidenceArtifactRefs?: readonly string[];
    readonly result?: ResilienceActionSettlementResult;
    readonly guardrailAllowed?: boolean;
  }): ResilienceActionSettlement {
    requireResilienceActor(input.actor, input.actionRecord.actionType);
    const idempotencyKey = `${input.actor.tenantId}:${input.actor.idempotencyKey}:${input.actionRecord.actionRecordHash}`;
    const existing = this.settlementsByIdempotency.get(idempotencyKey);
    if (existing) {
      return existing;
    }
    const blockerResult = settlementResultFromPosture({
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      expectedPostureHash: input.actor.expectedPostureHash,
      expectedReadinessHash: input.actor.expectedReadinessHash,
      expectedTupleHash: input.actor.expectedTupleHash,
      scopeTupleHash: input.actionRecord.scopeTupleHash,
      guardrailAllowed: input.guardrailAllowed,
    });
    const result = input.result ?? blockerResult ?? "applied";
    const base = {
      resilienceActionRecordRef: input.actionRecord.resilienceActionRecordId,
      verificationScenarioRef: input.actionRecord.verificationScenarioRef,
      releaseContractVerificationMatrixRef: input.actionRecord.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.actionRecord.releaseContractMatrixHash,
      runtimePublicationBundleRef: input.actionRecord.runtimePublicationBundleRef,
      releasePublicationParityRef: input.actionRecord.releasePublicationParityRef,
      releaseWatchTupleRef: input.actionRecord.releaseWatchTupleRef,
      watchTupleHash: input.actionRecord.watchTupleHash,
      commandSettlementRef: `csr_445_${resilienceHash(
        { actionRecordHash: input.actionRecord.actionRecordHash, result },
        "phase9.445.command-settlement-ref",
      ).slice(0, 16)}`,
      transitionEnvelopeRef: `te_445_${input.actionRecord.actionRecordHash.slice(0, 16)}`,
      authoritativeRunRefs: sortedUnique(input.authoritativeRunRefs ?? []),
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      syntheticRecoveryCoverageRefs: sortedUnique(input.syntheticRecoveryCoverageRefs),
      recoveryEvidenceArtifactRefs: sortedUnique(input.recoveryEvidenceArtifactRefs ?? []),
      result,
      recordedPostureRef: input.posture.recoveryControlPostureId,
      scopeTupleHash: input.actionRecord.scopeTupleHash,
      controlTupleHash: input.posture.controlTupleHash,
      releaseRecoveryDispositionRef: input.posture.releaseRecoveryDispositionRef,
      settledAt: input.actor.generatedAt,
    };
    const settlementHash = resilienceHash(base, "phase9.445.action-settlement");
    const settlement: ResilienceActionSettlement = {
      resilienceActionSettlementId: `ras_445_${settlementHash.slice(0, 16)}`,
      ...base,
      settlementHash,
    };
    this.settlementsByIdempotency.set(idempotencyKey, settlement);
    this.settlementsById.set(settlement.resilienceActionSettlementId, settlement);
    const latestRunRef = base.authoritativeRunRefs[0] ?? "run:pending";
    const visibleActionableState =
      settlement.result === "applied"
        ? "live"
        : settlement.result === "accepted_pending_evidence"
          ? "pending_evidence"
          : settlement.result === "frozen" || settlement.result === "stale_scope"
            ? "recovery_only"
            : "blocked";
    this.latestStateByActionType.set(input.actionRecord.actionType, {
      actionType: input.actionRecord.actionType,
      latestRunRef,
      latestSettlementRef: settlement.resilienceActionSettlementId,
      latestSettlementResult: settlement.result,
      visibleActionableState,
      blockerRefs:
        settlement.result === "applied" ? [] : this.explainSettlementBlocker({ settlement }),
    });
    return settlement;
  }

  prepareRestore(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly targetEnvironmentRef: string;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly essentialFunctions: readonly EssentialFunctionMap[];
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly dependencyOrderDigestRef: string;
    readonly recoveryEvidencePackRef: string;
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
  } {
    const scopeTupleHash = this.createScopeTupleHash({
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
    });
    const actionRecord = this.createActionRecord({
      actor: input.actor,
      actionType: "restore_prepare",
      routeIntentBindingRef: input.routeIntentBindingRef,
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      backupManifests: input.backupManifests,
      syntheticCoverage: input.syntheticCoverage,
      scopeTupleHash,
    });
    const settlement = this.settleAction({
      actor: input.actor,
      actionRecord,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      syntheticRecoveryCoverageRefs: input.syntheticCoverage.map(
        (coverage) => coverage.syntheticRecoveryCoverageRecordId,
      ),
      result: "accepted_pending_evidence",
    });
    return { actionRecord, settlement };
  }

  startRestore(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly targetEnvironmentRef: string;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly essentialFunctions: readonly EssentialFunctionMap[];
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly dependencyOrderDigestRef: string;
    readonly dependencyProofArtifactRefs: readonly string[];
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly resultState?: RestoreRunResultState;
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly run: RestoreRun;
  } {
    const scopeTupleHash = this.createScopeTupleHash({
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
    });
    const actionRecord = this.createActionRecord({
      actor: input.actor,
      actionType: "restore_start",
      routeIntentBindingRef: input.routeIntentBindingRef,
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      backupManifests: input.backupManifests,
      syntheticCoverage: input.syntheticCoverage,
      scopeTupleHash,
    });
    const settlement = this.settleAction({
      actor: input.actor,
      actionRecord,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      syntheticRecoveryCoverageRefs: input.syntheticCoverage.map(
        (coverage) => coverage.syntheticRecoveryCoverageRecordId,
      ),
      result: undefined,
    });
    const run = this.createRestoreRun({
      ...input,
      scopeTupleHash,
      settlement,
      dependencyValidationState: "pending",
      journeyValidationState: "pending",
      resultState: input.resultState ?? "data_restored",
      completedAt: "",
      evidenceArtifactRefs: [],
    });
    return { actionRecord, settlement, run };
  }

  validateRestore(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly targetEnvironmentRef: string;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly essentialFunctions: readonly EssentialFunctionMap[];
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly dependencyOrderDigestRef: string;
    readonly dependencyProofArtifactRefs: readonly string[];
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly dependencyValidationState?: RestoreDependencyValidationState;
    readonly journeyValidationState?: RestoreJourneyValidationState;
    readonly evidenceArtifactRefs?: readonly string[];
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly run: RestoreRun;
  } {
    const scopeTupleHash = this.createScopeTupleHash({
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
    });
    const actionRecord = this.createActionRecord({
      actor: input.actor,
      actionType: "restore_validate",
      routeIntentBindingRef: input.routeIntentBindingRef,
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      backupManifests: input.backupManifests,
      syntheticCoverage: input.syntheticCoverage,
      scopeTupleHash,
    });
    const dependencyValidationState =
      input.dependencyValidationState ??
      (input.dependencyProofArtifactRefs.length >= input.essentialFunctions.length
        ? "complete"
        : "blocked");
    const requiredJourneyProofRefs = sortedUnique(
      input.recoveryTiers.flatMap((tier) => tier.requiredJourneyProofRefs),
    );
    const journeyValidationState =
      input.journeyValidationState ??
      (requiredJourneyProofRefs.every((proofRef) =>
        input.journeyProofArtifactRefs.includes(proofRef),
      )
        ? "complete"
        : "pending");
    const resultState: RestoreRunResultState =
      dependencyValidationState === "blocked"
        ? "failed"
        : journeyValidationState !== "complete"
          ? "journey_validation_pending"
          : "succeeded";
    const settlement = this.settleAction({
      actor: input.actor,
      actionRecord,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      syntheticRecoveryCoverageRefs: input.syntheticCoverage.map(
        (coverage) => coverage.syntheticRecoveryCoverageRecordId,
      ),
      recoveryEvidenceArtifactRefs: input.evidenceArtifactRefs ?? [],
      result:
        resultState === "succeeded"
          ? undefined
          : dependencyValidationState === "blocked"
            ? "failed"
            : "accepted_pending_evidence",
    });
    const run = this.createRestoreRun({
      ...input,
      scopeTupleHash,
      settlement,
      dependencyValidationState,
      journeyValidationState,
      resultState,
      completedAt: input.actor.generatedAt,
      evidenceArtifactRefs: input.evidenceArtifactRefs ?? [],
    });
    return { actionRecord, settlement, run };
  }

  approveFailoverScenario(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly targetFunction: string;
    readonly essentialFunctionRefs: readonly string[];
    readonly recoveryTierRefs: readonly string[];
    readonly triggerType: string;
    readonly degradedModeRef: string;
    readonly successCriteriaRef: string;
    readonly requiredRunbookBindingRefs: readonly string[];
    readonly requiredSyntheticRecoveryCoverageRefs: readonly string[];
    readonly releasePublicationParityRef: string;
    readonly releaseWatchTupleRef: string;
    readonly activationPolicyRef: string;
    readonly scopeTupleHash: string;
  }): FailoverScenario {
    requireResilienceActor(input.actor, "approveFailoverScenario");
    const base = {
      targetFunction: input.targetFunction,
      essentialFunctionRefs: sortedUnique(input.essentialFunctionRefs),
      recoveryTierRefs: sortedUnique(input.recoveryTierRefs),
      triggerType: input.triggerType,
      degradedModeRef: input.degradedModeRef,
      successCriteriaRef: input.successCriteriaRef,
      requiredRunbookBindingRefs: sortedUnique(input.requiredRunbookBindingRefs),
      requiredSyntheticRecoveryCoverageRefs: sortedUnique(
        input.requiredSyntheticRecoveryCoverageRefs,
      ),
      releasePublicationParityRef: input.releasePublicationParityRef,
      releaseWatchTupleRef: input.releaseWatchTupleRef,
      activationPolicyRef: input.activationPolicyRef,
      scopeTupleHash: input.scopeTupleHash,
      scenarioState: "approved" as const,
    };
    const scenarioHash = resilienceHash(base, "phase9.445.failover-scenario");
    return {
      failoverScenarioId: `fos_445_${scenarioHash.slice(0, 16)}`,
      ...base,
      scenarioHash,
    };
  }

  activateFailover(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly scenario: FailoverScenario;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly dependencyOrderDigestRef: string;
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly evidenceArtifactRefs?: readonly string[];
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly run: FailoverRun;
  } {
    return this.executeFailover({
      ...input,
      actionType: "failover_activate",
      resultState: "active",
      validationState: "pending",
      completedAt: "",
    });
  }

  validateFailover(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly scenario: FailoverScenario;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly dependencyOrderDigestRef: string;
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly evidenceArtifactRefs?: readonly string[];
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly run: FailoverRun;
  } {
    return this.executeFailover({
      ...input,
      actionType: "failover_validate",
      resultState: "validation_pending",
      validationState: "complete",
      completedAt: input.actor.generatedAt,
    });
  }

  standDownFailover(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly scenario: FailoverScenario;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly dependencyOrderDigestRef: string;
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly evidenceArtifactRefs?: readonly string[];
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly run: FailoverRun;
  } {
    return this.executeFailover({
      ...input,
      actionType: "failover_stand_down",
      resultState: "stood_down",
      validationState: "complete",
      completedAt: input.actor.generatedAt,
    });
  }

  approveChaosExperiment(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly blastRadiusRef: string;
    readonly essentialFunctionRefs: readonly string[];
    readonly recoveryTierRefs: readonly string[];
    readonly hypothesisRef: string;
    readonly guardrailRefs: readonly string[];
    readonly requiredSyntheticRecoveryCoverageRefs: readonly string[];
    readonly releasePublicationParityRef: string;
    readonly releaseWatchTupleRef: string;
    readonly approvalPolicyRef: string;
    readonly approvedScopeTupleHash: string;
  }): ChaosExperiment {
    requireResilienceActor(input.actor, "approveChaosExperiment");
    const guardrailsPresent = input.guardrailRefs.length > 0 && input.approvalPolicyRef.length > 0;
    const base = {
      blastRadiusRef: input.blastRadiusRef,
      essentialFunctionRefs: sortedUnique(input.essentialFunctionRefs),
      recoveryTierRefs: sortedUnique(input.recoveryTierRefs),
      hypothesisRef: input.hypothesisRef,
      guardrailRefs: sortedUnique(input.guardrailRefs),
      requiredSyntheticRecoveryCoverageRefs: sortedUnique(
        input.requiredSyntheticRecoveryCoverageRefs,
      ),
      releasePublicationParityRef: input.releasePublicationParityRef,
      releaseWatchTupleRef: input.releaseWatchTupleRef,
      approvalPolicyRef: input.approvalPolicyRef,
      approvedScopeTupleHash: input.approvedScopeTupleHash,
      experimentState: guardrailsPresent ? ("approved" as const) : ("draft" as const),
    };
    const experimentHash = resilienceHash(base, "phase9.445.chaos-experiment");
    return {
      chaosExperimentId: `cex_445_${experimentHash.slice(0, 16)}`,
      ...base,
      experimentHash,
    };
  }

  scheduleChaos(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly experiment: ChaosExperiment;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly evidenceArtifactRefs?: readonly string[];
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly run: ChaosRun;
  } {
    return this.executeChaos({
      ...input,
      actionType: "chaos_schedule",
      resultState: "scheduled",
      completedAt: "",
    });
  }

  startChaos(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly experiment: ChaosExperiment;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly evidenceArtifactRefs?: readonly string[];
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly run: ChaosRun;
  } {
    return this.executeChaos({
      ...input,
      actionType: "chaos_start",
      resultState: "running",
      completedAt: "",
    });
  }

  abortChaos(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly experiment: ChaosExperiment;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly evidenceArtifactRefs?: readonly string[];
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly run: ChaosRun;
  } {
    return this.executeChaos({
      ...input,
      actionType: "chaos_abort",
      resultState: "halted",
      completedAt: input.actor.generatedAt,
    });
  }

  attestRecoveryPack(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly restoreRunRefs: readonly string[];
    readonly failoverRunRefs: readonly string[];
    readonly chaosRunRefs: readonly string[];
    readonly artifactRefs: readonly string[];
    readonly periodWindow: string;
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly pack: RecoveryEvidencePack;
  } {
    const scopeTupleHash = this.createScopeTupleHash({
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
    });
    const actionRecord = this.createActionRecord({
      actor: input.actor,
      actionType: "recovery_pack_attest",
      routeIntentBindingRef: input.routeIntentBindingRef,
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      backupManifests: input.backupManifests,
      syntheticCoverage: input.syntheticCoverage,
      scopeTupleHash,
    });
    const packTupleHash = orderedSetHash(
      [
        scopeTupleHash,
        input.restoreRunRefs,
        input.failoverRunRefs,
        input.chaosRunRefs,
        input.artifactRefs,
      ],
      "phase9.445.recovery-pack-tuple",
    );
    const pack: RecoveryEvidencePack = {
      recoveryEvidencePackId: `rep_445_${packTupleHash.slice(0, 16)}`,
      releaseRef: input.snapshot.releaseRef,
      verificationScenarioRef: input.snapshot.verificationScenarioRef,
      releaseContractVerificationMatrixRef: input.snapshot.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.snapshot.releaseContractMatrixHash,
      runtimePublicationBundleRef: input.snapshot.runtimePublicationBundleRef,
      releasePublicationParityRef: input.snapshot.releasePublicationParityRef,
      releaseWatchTupleRef: input.snapshot.releaseWatchTupleRef,
      watchTupleHash: input.snapshot.watchTupleHash,
      periodWindow: input.periodWindow,
      operationalReadinessSnapshotRef: input.snapshot.operationalReadinessSnapshotId,
      recoveryTierRefs: sortedUnique(input.recoveryTiers.map((tier) => tier.recoveryTierId)),
      backupSetManifestRefs: sortedUnique(
        input.backupManifests.map((manifest) => manifest.backupSetManifestId),
      ),
      restoreRunRefs: sortedUnique(input.restoreRunRefs),
      failoverRunRefs: sortedUnique(input.failoverRunRefs),
      chaosRunRefs: sortedUnique(input.chaosRunRefs),
      syntheticRecoveryCoverageRefs: sortedUnique(
        input.syntheticCoverage.map((coverage) => coverage.syntheticRecoveryCoverageRecordId),
      ),
      latestResilienceActionSettlementRefs: sortedUnique(
        input.posture.latestResilienceActionSettlementRefs,
      ),
      readinessStateAtPackTime: input.snapshot.readinessState,
      packTupleHash,
      resilienceTupleHash: input.snapshot.resilienceTupleHash,
      artifactRefs: sortedUnique(input.artifactRefs),
      attestationState: "attested",
      packState:
        input.snapshot.readinessState === "ready" && input.posture.postureState === "live_control"
          ? "current"
          : "blocked",
    };
    const settlement = this.settleAction({
      actor: input.actor,
      actionRecord,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      authoritativeRunRefs: [
        ...input.restoreRunRefs,
        ...input.failoverRunRefs,
        ...input.chaosRunRefs,
      ],
      recoveryEvidencePackRef: pack.recoveryEvidencePackId,
      syntheticRecoveryCoverageRefs: pack.syntheticRecoveryCoverageRefs,
      recoveryEvidenceArtifactRefs: input.artifactRefs,
    });
    return { actionRecord, settlement, pack };
  }

  createRecoveryEvidenceArtifact(
    input: Omit<RecoveryEvidenceArtifact, "recoveryEvidenceArtifactId" | "artifactHash">,
  ): RecoveryEvidenceArtifact {
    const unsafeRefs = [
      input.summaryRef,
      input.artifactPresentationContractRef,
      input.artifactSurfaceContextRef,
      input.artifactModeTruthProjectionRef,
      input.artifactTransferSettlementRef,
      input.artifactFallbackDispositionRef,
      input.outboundNavigationGrantPolicyRef,
      input.externalHandoffPolicyRef,
    ].filter(startsWithRawObjectStoreRef);
    resilienceInvariant(
      unsafeRefs.length === 0,
      "RECOVERY_EVIDENCE_RAW_OBJECT_LINK_DENIED",
      "Recovery evidence artifacts must use governed artifact refs, not raw object-store URLs.",
    );
    const artifactHash = resilienceHash(input, "phase9.445.recovery-evidence-artifact");
    const artifact: RecoveryEvidenceArtifact = {
      recoveryEvidenceArtifactId: `rea_445_${artifactHash.slice(0, 16)}`,
      ...input,
      artifactHash,
    };
    this.artifactsById.set(artifact.recoveryEvidenceArtifactId, artifact);
    return artifact;
  }

  writeRecoveryEvidenceGraph(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly producingRunRef: string;
    readonly recoveryEvidencePackRef: string;
    readonly artifacts: readonly RecoveryEvidenceArtifact[];
    readonly settlement: ResilienceActionSettlement;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly posture: RecoveryControlPosture;
    readonly previousHash?: string;
  }): RecoveryEvidenceGraphWriteback {
    requireResilienceActor(input.actor, "writeRecoveryEvidenceGraph");
    const graphEdgeRefs = sortedUnique([
      `aege_445_ledger_pack_${input.recoveryEvidencePackRef}`,
      ...input.artifacts.map(
        (artifact) => `aege_445_artifact_${artifact.recoveryEvidenceArtifactId}`,
      ),
      `aege_445_settlement_${input.settlement.resilienceActionSettlementId}`,
    ]);
    const canonicalPayload = {
      producingRunRef: input.producingRunRef,
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      artifactRefs: input.artifacts.map((artifact) => artifact.recoveryEvidenceArtifactId),
      settlementRef: input.settlement.resilienceActionSettlementId,
      snapshotRef: input.snapshot.operationalReadinessSnapshotId,
      recoveryControlPostureRef: input.posture.recoveryControlPostureId,
    };
    const ledgerEntry = buildAssuranceLedgerEntry({
      assuranceLedgerEntryId: `ale_445_${resilienceHash(canonicalPayload, "phase9.445.ledger.id").slice(0, 16)}`,
      sourceEventRef: `event:resilience:${input.producingRunRef}`,
      entryType: "evidence_materialization",
      tenantId: input.actor.tenantId,
      producerRef: PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
      namespaceRef: "analytics_assurance.resilience",
      schemaVersionRef: PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
      normalizationVersionRef: "normalization:445:recovery-evidence-writeback:v1",
      sourceSequenceRef: `seq:${input.producingRunRef}:${input.settlement.resilienceActionSettlementId}`,
      sourceBoundedContextRef: "analytics_assurance",
      governingBoundedContextRef: "assurance_and_governance",
      requiredContextBoundaryRefs: ["phase9:assurance-ledger", "phase9:resilience"],
      edgeCorrelationId: input.settlement.resilienceActionSettlementId,
      commandActionRef: input.settlement.resilienceActionRecordRef,
      commandSettlementRef: input.settlement.commandSettlementRef,
      auditRecordRef: input.settlement.settlementHash,
      causalTokenRef: input.actor.idempotencyKey,
      replayDecisionClass: "exact_replay",
      effectKeyRef: `${input.producingRunRef}:${input.recoveryEvidencePackRef}:recovery-writeback`,
      controlRefs: [
        "control:resilience-evidence-writeback:445",
        "control:assurance-ledger-writeback",
      ],
      evidenceRefs: [
        input.recoveryEvidencePackRef,
        input.settlement.resilienceActionSettlementId,
        ...input.artifacts.map((artifact) => artifact.recoveryEvidenceArtifactId),
      ],
      graphEdgeRefs,
      previousHash: input.previousHash ?? GENESIS_ASSURANCE_LEDGER_HASH,
      createdAt: input.actor.generatedAt,
      canonicalPayload,
      inputSetValues: [
        input.settlement.settlementHash,
        input.recoveryEvidencePackRef,
        input.artifacts.map((artifact) => artifact.artifactHash),
      ],
    });
    const writebackBase = {
      producingRunRef: input.producingRunRef,
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      ledgerHash: ledgerEntry.hash,
      graphEdgeRefs,
      affectedOperationalReadinessSnapshotRef: input.snapshot.operationalReadinessSnapshotId,
      affectedRunbookBindingRefs: input.runbookBindings.map(
        (binding) => binding.runbookBindingRecordId,
      ),
      affectedResilienceSurfaceRuntimeBindingRef: input.binding.resilienceSurfaceRuntimeBindingId,
      affectedRecoveryControlPostureRef: input.posture.recoveryControlPostureId,
      writtenAt: input.actor.generatedAt,
    };
    const writebackHash = resilienceHash(writebackBase, "phase9.445.graph-writeback");
    return {
      writebackId: `regw_445_${writebackHash.slice(0, 16)}`,
      producingRunRef: input.producingRunRef,
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      assuranceLedgerEntry: ledgerEntry,
      graphEdgeRefs,
      affectedOperationalReadinessSnapshotRef: input.snapshot.operationalReadinessSnapshotId,
      affectedRunbookBindingRefs: sortedUnique(
        input.runbookBindings.map((binding) => binding.runbookBindingRecordId),
      ),
      affectedResilienceSurfaceRuntimeBindingRef: input.binding.resilienceSurfaceRuntimeBindingId,
      affectedRecoveryControlPostureRef: input.posture.recoveryControlPostureId,
      writebackHash,
      writtenAt: input.actor.generatedAt,
    };
  }

  getLatestRunAndSettlementState(input: {
    readonly actionType: ResilienceActionType;
  }): LatestResilienceRunAndSettlementState | undefined {
    return this.latestStateByActionType.get(input.actionType);
  }

  getRecoveryEvidenceArtifacts(input: {
    readonly artifactRefs?: readonly string[];
  }): readonly RecoveryEvidenceArtifact[] {
    const artifacts = [...this.artifactsById.values()].sort((left, right) =>
      left.recoveryEvidenceArtifactId.localeCompare(right.recoveryEvidenceArtifactId),
    );
    if (!input.artifactRefs) {
      return artifacts;
    }
    const refs = new Set(input.artifactRefs);
    return artifacts.filter((artifact) => refs.has(artifact.recoveryEvidenceArtifactId));
  }

  explainSettlementBlocker(input: {
    readonly settlement: ResilienceActionSettlement;
  }): readonly string[] {
    const blockerMap: Record<ResilienceActionSettlementResult, readonly string[]> = {
      accepted_pending_evidence: ["pending:evidence-artifacts-or-writeback"],
      applied: ["applied:current-settlement-authority"],
      blocked_publication: ["blocked:publication-not-current"],
      blocked_trust: ["blocked:trust-not-trusted"],
      blocked_readiness: ["blocked:readiness-or-posture-not-live"],
      blocked_guardrail: ["blocked:guardrail-or-blast-radius"],
      frozen: ["blocked:release-freeze-active"],
      stale_scope: ["blocked:scope-tuple-drift"],
      failed: ["blocked:run-validation-failed"],
      superseded: ["blocked:settlement-superseded"],
    };
    return blockerMap[input.settlement.result];
  }

  listWithCursor<T>(
    rows: readonly T[],
    cursor?: string,
    limit = 25,
  ): ResilienceActionSettlementPage<T> {
    const offset = cursor?.startsWith("cursor:") ? Number(cursor.slice("cursor:".length)) : 0;
    const pageRows = rows.slice(offset, offset + limit);
    const nextOffset = offset + pageRows.length;
    return {
      rows: pageRows,
      nextCursor: nextOffset < rows.length ? `cursor:${nextOffset}` : undefined,
    };
  }

  private createRestoreRun(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly targetEnvironmentRef: string;
    readonly scopeRef: string;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly essentialFunctions: readonly EssentialFunctionMap[];
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly dependencyOrderDigestRef: string;
    readonly dependencyProofArtifactRefs: readonly string[];
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly dependencyValidationState: RestoreDependencyValidationState;
    readonly journeyValidationState: RestoreJourneyValidationState;
    readonly resultState: RestoreRunResultState;
    readonly scopeTupleHash: string;
    readonly settlement: ResilienceActionSettlement;
    readonly completedAt: string;
    readonly evidenceArtifactRefs: readonly string[];
  }): RestoreRun {
    const restoreTupleHash = resilienceHash(
      {
        targetEnvironmentRef: input.targetEnvironmentRef,
        scopeTupleHash: input.scopeTupleHash,
        backupSetManifestRefs: input.backupManifests.map(
          (manifest) => manifest.backupSetManifestId,
        ),
        dependencyProofArtifactRefs: input.dependencyProofArtifactRefs,
        journeyProofArtifactRefs: input.journeyProofArtifactRefs,
        resultState: input.resultState,
      },
      "phase9.445.restore-run-tuple",
    );
    return {
      restoreRunId: `rr_445_${restoreTupleHash.slice(0, 16)}`,
      releaseRef: input.snapshot.releaseRef,
      verificationScenarioRef: input.snapshot.verificationScenarioRef,
      releaseContractVerificationMatrixRef: input.snapshot.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.snapshot.releaseContractMatrixHash,
      runtimePublicationBundleRef: input.snapshot.runtimePublicationBundleRef,
      releasePublicationParityRef: input.snapshot.releasePublicationParityRef,
      releaseWatchTupleRef: input.snapshot.releaseWatchTupleRef,
      watchTupleHash: input.snapshot.watchTupleHash,
      essentialFunctionRefs: sortedUnique(
        input.essentialFunctions.map((entry) => entry.essentialFunctionMapId),
      ),
      recoveryTierRefs: sortedUnique(input.recoveryTiers.map((tier) => tier.recoveryTierId)),
      targetEnvironmentRef: input.targetEnvironmentRef,
      backupSetManifestRefs: sortedUnique(
        input.backupManifests.map((manifest) => manifest.backupSetManifestId),
      ),
      operationalReadinessSnapshotRef: input.snapshot.operationalReadinessSnapshotId,
      runbookBindingRefs: sortedUnique(
        input.runbookBindings.map((binding) => binding.runbookBindingRecordId),
      ),
      recoveryControlPostureRef: input.posture.recoveryControlPostureId,
      dependencyOrderDigestRef: input.dependencyOrderDigestRef,
      dependencyProofArtifactRefs: sortedUnique(input.dependencyProofArtifactRefs),
      journeyProofArtifactRefs: sortedUnique(input.journeyProofArtifactRefs),
      syntheticRecoveryCoverageRefs: sortedUnique(
        input.syntheticCoverage.map((coverage) => coverage.syntheticRecoveryCoverageRecordId),
      ),
      restoreTupleHash,
      resilienceTupleHash: input.snapshot.resilienceTupleHash,
      scopeTupleHash: input.scopeTupleHash,
      dependencyValidationState: input.dependencyValidationState,
      journeyValidationState: input.journeyValidationState,
      initiatedAt: input.actor.generatedAt,
      completedAt: input.completedAt,
      resultState: input.resultState,
      evidenceArtifactRefs: sortedUnique(input.evidenceArtifactRefs),
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      resilienceActionSettlementRef: input.settlement.resilienceActionSettlementId,
    };
  }

  private executeFailover(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly scenario: FailoverScenario;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly dependencyOrderDigestRef: string;
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly evidenceArtifactRefs?: readonly string[];
    readonly actionType: "failover_activate" | "failover_validate" | "failover_stand_down";
    readonly resultState: FailoverRunResultState;
    readonly validationState: FailoverRunValidationState;
    readonly completedAt: string;
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly run: FailoverRun;
  } {
    const scopeTupleHash = this.createScopeTupleHash({
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
    });
    const actionRecord = this.createActionRecord({
      actor: input.actor,
      actionType: input.actionType,
      routeIntentBindingRef: input.routeIntentBindingRef,
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      backupManifests: input.backupManifests,
      syntheticCoverage: input.syntheticCoverage,
      scopeTupleHash,
    });
    const scenarioScopeValid =
      input.scenario.scenarioState === "approved" &&
      input.scenario.scopeTupleHash === scopeTupleHash;
    const settlement = this.settleAction({
      actor: input.actor,
      actionRecord,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      syntheticRecoveryCoverageRefs: input.syntheticCoverage.map(
        (coverage) => coverage.syntheticRecoveryCoverageRecordId,
      ),
      recoveryEvidenceArtifactRefs: input.evidenceArtifactRefs ?? [],
      result: scenarioScopeValid ? undefined : "stale_scope",
    });
    const failoverTupleHash = resilienceHash(
      {
        scenarioRef: input.scenario.failoverScenarioId,
        scopeTupleHash,
        resultState: scenarioScopeValid ? input.resultState : "failed",
        validationState: scenarioScopeValid ? input.validationState : "blocked",
      },
      "phase9.445.failover-run-tuple",
    );
    const run: FailoverRun = {
      failoverRunId: `fr_445_${failoverTupleHash.slice(0, 16)}`,
      releaseRef: input.snapshot.releaseRef,
      verificationScenarioRef: input.snapshot.verificationScenarioRef,
      releaseContractVerificationMatrixRef: input.snapshot.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.snapshot.releaseContractMatrixHash,
      runtimePublicationBundleRef: input.snapshot.runtimePublicationBundleRef,
      releasePublicationParityRef: input.snapshot.releasePublicationParityRef,
      releaseWatchTupleRef: input.snapshot.releaseWatchTupleRef,
      watchTupleHash: input.snapshot.watchTupleHash,
      failoverScenarioRef: input.scenario.failoverScenarioId,
      essentialFunctionRefs: input.scenario.essentialFunctionRefs,
      recoveryTierRefs: sortedUnique(input.recoveryTiers.map((tier) => tier.recoveryTierId)),
      operationalReadinessSnapshotRef: input.snapshot.operationalReadinessSnapshotId,
      runbookBindingRefs: sortedUnique(
        input.runbookBindings.map((binding) => binding.runbookBindingRecordId),
      ),
      recoveryControlPostureRef: input.posture.recoveryControlPostureId,
      failoverTupleHash,
      resilienceTupleHash: input.snapshot.resilienceTupleHash,
      scopeTupleHash,
      degradedModeRef: input.scenario.degradedModeRef,
      dependencyOrderDigestRef: input.dependencyOrderDigestRef,
      journeyProofArtifactRefs: sortedUnique(input.journeyProofArtifactRefs),
      syntheticRecoveryCoverageRefs: sortedUnique(
        input.syntheticCoverage.map((coverage) => coverage.syntheticRecoveryCoverageRecordId),
      ),
      validationState: scenarioScopeValid ? input.validationState : "blocked",
      startedAt: input.actor.generatedAt,
      completedAt: input.completedAt,
      resultState: scenarioScopeValid ? input.resultState : "failed",
      evidenceArtifactRefs: sortedUnique(input.evidenceArtifactRefs ?? []),
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      resilienceActionSettlementRef: settlement.resilienceActionSettlementId,
    };
    return { actionRecord, settlement, run };
  }

  private executeChaos(input: {
    readonly actor: ResilienceCommandActorContext;
    readonly routeIntentBindingRef: string;
    readonly scopeRef: string;
    readonly experiment: ChaosExperiment;
    readonly snapshot: OperationalReadinessSnapshot;
    readonly posture: RecoveryControlPosture;
    readonly binding: ResilienceSurfaceRuntimeBinding;
    readonly recoveryTiers: readonly RecoveryTier[];
    readonly backupManifests: readonly BackupSetManifest[];
    readonly runbookBindings: readonly RunbookBindingRecord[];
    readonly syntheticCoverage: readonly SyntheticRecoveryCoverageRecord[];
    readonly journeyProofArtifactRefs: readonly string[];
    readonly recoveryEvidencePackRef: string;
    readonly evidenceArtifactRefs?: readonly string[];
    readonly actionType: "chaos_schedule" | "chaos_start" | "chaos_abort";
    readonly resultState: ChaosRunResultState;
    readonly completedAt: string;
  }): {
    readonly actionRecord: ResilienceActionRecord;
    readonly settlement: ResilienceActionSettlement;
    readonly run: ChaosRun;
  } {
    const scopeTupleHash = this.createScopeTupleHash({
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
    });
    const actionRecord = this.createActionRecord({
      actor: input.actor,
      actionType: input.actionType,
      routeIntentBindingRef: input.routeIntentBindingRef,
      scopeRef: input.scopeRef,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      backupManifests: input.backupManifests,
      syntheticCoverage: input.syntheticCoverage,
      scopeTupleHash,
    });
    const guardrailApproved =
      input.experiment.experimentState === "approved" &&
      input.experiment.approvedScopeTupleHash === scopeTupleHash &&
      input.experiment.guardrailRefs.length > 0 &&
      !input.experiment.blastRadiusRef.includes("unbounded");
    const settlement = this.settleAction({
      actor: input.actor,
      actionRecord,
      snapshot: input.snapshot,
      posture: input.posture,
      binding: input.binding,
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      syntheticRecoveryCoverageRefs: input.syntheticCoverage.map(
        (coverage) => coverage.syntheticRecoveryCoverageRecordId,
      ),
      recoveryEvidenceArtifactRefs: input.evidenceArtifactRefs ?? [],
      guardrailAllowed: guardrailApproved,
    });
    const guardrailState: ChaosGuardrailState = guardrailApproved ? "approved" : "blocked";
    const resultState = guardrailApproved ? input.resultState : "failed";
    const chaosTupleHash = resilienceHash(
      {
        experimentRef: input.experiment.chaosExperimentId,
        scopeTupleHash,
        guardrailState,
        resultState,
      },
      "phase9.445.chaos-run-tuple",
    );
    const run: ChaosRun = {
      chaosRunId: `cr_445_${chaosTupleHash.slice(0, 16)}`,
      releaseRef: input.snapshot.releaseRef,
      verificationScenarioRef: input.snapshot.verificationScenarioRef,
      releaseContractVerificationMatrixRef: input.snapshot.releaseContractVerificationMatrixRef,
      releaseContractMatrixHash: input.snapshot.releaseContractMatrixHash,
      runtimePublicationBundleRef: input.snapshot.runtimePublicationBundleRef,
      releasePublicationParityRef: input.snapshot.releasePublicationParityRef,
      releaseWatchTupleRef: input.snapshot.releaseWatchTupleRef,
      watchTupleHash: input.snapshot.watchTupleHash,
      chaosExperimentRef: input.experiment.chaosExperimentId,
      essentialFunctionRefs: input.experiment.essentialFunctionRefs,
      recoveryTierRefs: sortedUnique(input.recoveryTiers.map((tier) => tier.recoveryTierId)),
      operationalReadinessSnapshotRef: input.snapshot.operationalReadinessSnapshotId,
      runbookBindingRefs: sortedUnique(
        input.runbookBindings.map((binding) => binding.runbookBindingRecordId),
      ),
      recoveryControlPostureRef: input.posture.recoveryControlPostureId,
      chaosTupleHash,
      resilienceTupleHash: input.snapshot.resilienceTupleHash,
      scopeTupleHash,
      blastRadiusRef: input.experiment.blastRadiusRef,
      guardrailState,
      journeyProofArtifactRefs: sortedUnique(input.journeyProofArtifactRefs),
      syntheticRecoveryCoverageRefs: sortedUnique(
        input.syntheticCoverage.map((coverage) => coverage.syntheticRecoveryCoverageRecordId),
      ),
      startedAt: input.actor.generatedAt,
      completedAt: input.completedAt,
      resultState,
      evidenceArtifactRefs: sortedUnique(input.evidenceArtifactRefs ?? []),
      recoveryEvidencePackRef: input.recoveryEvidencePackRef,
      resilienceActionSettlementRef: settlement.resilienceActionSettlementId,
    };
    return { actionRecord, settlement, run };
  }
}

export function createPhase9ResilienceActionSettlementFixture(): Phase9ResilienceActionSettlementFixture {
  const generatedAt = "2026-04-27T14:15:00.000Z";
  const service = new Phase9ResilienceActionSettlementService();
  const readinessFixture = createPhase9OperationalReadinessPostureFixture();
  const scopeRef = "scope:tenant:demo-gp:resilience";
  const scopeTupleHash = service.createScopeTupleHash({
    scopeRef,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
  });
  const actor: ResilienceCommandActorContext = {
    tenantId: "tenant:demo-gp",
    actorRef: "actor:resilience-operator-445",
    roleRefs: ["resilience_operator", "resilience_governance"],
    purposeOfUseRef: "resilience:action:execute",
    reasonRef: "reason:445:exercise-authority",
    idempotencyKey: "idem:445:restore-prepare",
    scopeTokenRef: "scope-token:tenant:demo-gp:resilience",
    generatedAt,
    expectedPostureHash: readinessFixture.livePosture.controlTupleHash,
    expectedReadinessHash: readinessFixture.readySnapshot.resilienceTupleHash,
    expectedTupleHash: scopeTupleHash,
  };
  const routeIntentBindingRef = "rib_445_ops_resilience";
  const surfaceBindingLive = service.createResilienceSurfaceRuntimeBinding({
    routeFamilyRef: "/ops/resilience",
    audienceSurfaceRuntimeBindingRef: "asrb_445_ops_current",
    audienceSurfaceRouteContractRef: "asrc_445_ops_resilience",
    surfacePublicationRef: "surface-publication:445:ops-resilience",
    requiredAssuranceSliceRefs: [
      "slice:runtime-publication",
      "slice:release-watch",
      "slice:resilience",
    ],
    snapshot: readinessFixture.readySnapshot,
    runbookBindings: readinessFixture.runbookBindings,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    recoveryControlPosture: readinessFixture.livePosture,
    latestRecoveryEvidencePackRef:
      readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    latestRecoveryEvidencePackState: "current",
    latestResilienceActionSettlementRefs: ["ras_444_restore_current"],
  });
  const surfaceBindingDiagnostic = service.createResilienceSurfaceRuntimeBinding({
    routeFamilyRef: "/ops/resilience",
    audienceSurfaceRuntimeBindingRef: "asrb_445_ops_current",
    audienceSurfaceRouteContractRef: "asrc_445_ops_resilience",
    surfacePublicationRef: "surface-publication:445:ops-resilience",
    requiredAssuranceSliceRefs: [
      "slice:runtime-publication",
      "slice:release-watch",
      "slice:resilience",
    ],
    snapshot: readinessFixture.readySnapshot,
    runbookBindings: readinessFixture.runbookBindings,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    recoveryControlPosture: readinessFixture.stalePublicationPosture,
    latestRecoveryEvidencePackRef: "rep_444_stale",
    latestRecoveryEvidencePackState: "stale",
    latestResilienceActionSettlementRefs: ["ras_444_restore_current"],
  });
  const requiredJourneyProofRefs = sortedUnique(
    readinessFixture.recoveryTiers.flatMap((tier) => tier.requiredJourneyProofRefs),
  );
  const dependencyProofRefs = readinessFixture.essentialFunctions.map(
    (entry) => `dependency-proof:${entry.functionCode}:order`,
  );
  const restorePrepared = service.prepareRestore({
    actor,
    routeIntentBindingRef,
    scopeRef,
    targetEnvironmentRef: "clean-env:445:restore",
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    essentialFunctions: readinessFixture.essentialFunctions,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    dependencyOrderDigestRef: readinessFixture.dependencyOrderValidation.dependencyOrderDigestRef,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
  });
  const restoreStart = service.startRestore({
    actor: { ...actor, idempotencyKey: "idem:445:restore-start" },
    routeIntentBindingRef,
    scopeRef,
    targetEnvironmentRef: "clean-env:445:restore",
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    essentialFunctions: readinessFixture.essentialFunctions,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    dependencyOrderDigestRef: readinessFixture.dependencyOrderValidation.dependencyOrderDigestRef,
    dependencyProofArtifactRefs: dependencyProofRefs,
    journeyProofArtifactRefs: [],
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
  });
  const restoreValidate = service.validateRestore({
    actor: { ...actor, idempotencyKey: "idem:445:restore-validate" },
    routeIntentBindingRef,
    scopeRef,
    targetEnvironmentRef: "clean-env:445:restore",
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    essentialFunctions: readinessFixture.essentialFunctions,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    dependencyOrderDigestRef: readinessFixture.dependencyOrderValidation.dependencyOrderDigestRef,
    dependencyProofArtifactRefs: dependencyProofRefs,
    journeyProofArtifactRefs: requiredJourneyProofRefs,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    evidenceArtifactRefs: ["rea_445_restore_report"],
  });
  const dependencyBlockedRestore = service.validateRestore({
    actor: { ...actor, idempotencyKey: "idem:445:restore-dependency-blocked" },
    routeIntentBindingRef,
    scopeRef,
    targetEnvironmentRef: "clean-env:445:restore",
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    essentialFunctions: readinessFixture.essentialFunctions,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    dependencyOrderDigestRef: readinessFixture.dependencyCycleValidation.dependencyOrderDigestRef,
    dependencyProofArtifactRefs: [],
    journeyProofArtifactRefs: requiredJourneyProofRefs,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    dependencyValidationState: "blocked",
  });
  const missingJourneyProofRestore = service.validateRestore({
    actor: { ...actor, idempotencyKey: "idem:445:restore-journey-missing" },
    routeIntentBindingRef,
    scopeRef,
    targetEnvironmentRef: "clean-env:445:restore",
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    essentialFunctions: readinessFixture.essentialFunctions,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    dependencyOrderDigestRef: readinessFixture.dependencyOrderValidation.dependencyOrderDigestRef,
    dependencyProofArtifactRefs: dependencyProofRefs,
    journeyProofArtifactRefs: requiredJourneyProofRefs.slice(1),
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
  });
  const approvedFailoverScenario = service.approveFailoverScenario({
    actor: { ...actor, idempotencyKey: "idem:445:failover-scenario" },
    targetFunction: "digital_intake",
    essentialFunctionRefs: readinessFixture.essentialFunctions.map(
      (entry) => entry.essentialFunctionMapId,
    ),
    recoveryTierRefs: readinessFixture.recoveryTiers.map((tier) => tier.recoveryTierId),
    triggerType: "publication-region-loss",
    degradedModeRef: "degraded-mode:444:digital_intake",
    successCriteriaRef: "success:445:failover-digital-intake",
    requiredRunbookBindingRefs: readinessFixture.runbookBindings.map(
      (binding) => binding.runbookBindingRecordId,
    ),
    requiredSyntheticRecoveryCoverageRefs: readinessFixture.syntheticCoverage.map(
      (coverage) => coverage.syntheticRecoveryCoverageRecordId,
    ),
    releasePublicationParityRef: readinessFixture.readySnapshot.releasePublicationParityRef,
    releaseWatchTupleRef: readinessFixture.readySnapshot.releaseWatchTupleRef,
    activationPolicyRef: "activation-policy:445:ops-governed",
    scopeTupleHash,
  });
  const staleFailoverScenario = {
    ...approvedFailoverScenario,
    failoverScenarioId: "fos_445_stale_scope",
    scopeTupleHash: "stale-scope-tuple",
    scenarioHash: resilienceHash("stale-failover-scope", "phase9.445.fixture"),
  };
  const failoverActivate = service.activateFailover({
    actor: { ...actor, idempotencyKey: "idem:445:failover-activate" },
    routeIntentBindingRef,
    scopeRef,
    scenario: approvedFailoverScenario,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    dependencyOrderDigestRef: readinessFixture.dependencyOrderValidation.dependencyOrderDigestRef,
    journeyProofArtifactRefs: requiredJourneyProofRefs,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    evidenceArtifactRefs: ["rea_445_failover_report"],
  });
  const failoverStandDown = service.standDownFailover({
    actor: { ...actor, idempotencyKey: "idem:445:failover-stand-down" },
    routeIntentBindingRef,
    scopeRef,
    scenario: approvedFailoverScenario,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    dependencyOrderDigestRef: readinessFixture.dependencyOrderValidation.dependencyOrderDigestRef,
    journeyProofArtifactRefs: requiredJourneyProofRefs,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    evidenceArtifactRefs: ["rea_445_failover_stand_down"],
  });
  const staleFailover = service.activateFailover({
    actor: { ...actor, idempotencyKey: "idem:445:failover-stale" },
    routeIntentBindingRef,
    scopeRef,
    scenario: staleFailoverScenario,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    dependencyOrderDigestRef: readinessFixture.dependencyOrderValidation.dependencyOrderDigestRef,
    journeyProofArtifactRefs: requiredJourneyProofRefs,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
  });
  const approvedChaosExperiment = service.approveChaosExperiment({
    actor: { ...actor, idempotencyKey: "idem:445:chaos-experiment" },
    blastRadiusRef: "blast-radius:single-route-family",
    essentialFunctionRefs: readinessFixture.essentialFunctions.map(
      (entry) => entry.essentialFunctionMapId,
    ),
    recoveryTierRefs: readinessFixture.recoveryTiers.map((tier) => tier.recoveryTierId),
    hypothesisRef: "hypothesis:445:degraded-mode-remains-safe",
    guardrailRefs: ["guardrail:445:abort-window", "guardrail:445:patient-visible-readonly"],
    requiredSyntheticRecoveryCoverageRefs: readinessFixture.syntheticCoverage.map(
      (coverage) => coverage.syntheticRecoveryCoverageRecordId,
    ),
    releasePublicationParityRef: readinessFixture.readySnapshot.releasePublicationParityRef,
    releaseWatchTupleRef: readinessFixture.readySnapshot.releaseWatchTupleRef,
    approvalPolicyRef: "approval-policy:445:chaos-governance",
    approvedScopeTupleHash: scopeTupleHash,
  });
  const blockedChaosExperiment = service.approveChaosExperiment({
    actor: { ...actor, idempotencyKey: "idem:445:chaos-unbounded" },
    blastRadiusRef: "blast-radius:unbounded-production",
    essentialFunctionRefs: readinessFixture.essentialFunctions.map(
      (entry) => entry.essentialFunctionMapId,
    ),
    recoveryTierRefs: readinessFixture.recoveryTiers.map((tier) => tier.recoveryTierId),
    hypothesisRef: "hypothesis:445:unsafe",
    guardrailRefs: [],
    requiredSyntheticRecoveryCoverageRefs: readinessFixture.syntheticCoverage.map(
      (coverage) => coverage.syntheticRecoveryCoverageRecordId,
    ),
    releasePublicationParityRef: readinessFixture.readySnapshot.releasePublicationParityRef,
    releaseWatchTupleRef: readinessFixture.readySnapshot.releaseWatchTupleRef,
    approvalPolicyRef: "",
    approvedScopeTupleHash: scopeTupleHash,
  });
  const chaosSchedule = service.scheduleChaos({
    actor: { ...actor, idempotencyKey: "idem:445:chaos-schedule" },
    routeIntentBindingRef,
    scopeRef,
    experiment: approvedChaosExperiment,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    journeyProofArtifactRefs: requiredJourneyProofRefs,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    evidenceArtifactRefs: ["rea_445_chaos_schedule"],
  });
  const chaosStart = service.startChaos({
    actor: { ...actor, idempotencyKey: "idem:445:chaos-start" },
    routeIntentBindingRef,
    scopeRef,
    experiment: approvedChaosExperiment,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    journeyProofArtifactRefs: requiredJourneyProofRefs,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    evidenceArtifactRefs: ["rea_445_chaos_report"],
  });
  const chaosBlocked = service.startChaos({
    actor: { ...actor, idempotencyKey: "idem:445:chaos-blocked" },
    routeIntentBindingRef,
    scopeRef,
    experiment: blockedChaosExperiment,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    runbookBindings: readinessFixture.runbookBindings,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    journeyProofArtifactRefs: requiredJourneyProofRefs,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
  });
  const stalePostureCases: readonly {
    readonly posture: RecoveryControlPosture;
    readonly actionType: ResilienceActionType;
    readonly idempotencyKey: string;
  }[] = [
    {
      posture: readinessFixture.stalePublicationPosture,
      actionType: "restore_prepare",
      idempotencyKey: "idem:445:block-restore-prepare",
    },
    {
      posture: readinessFixture.stalePublicationPosture,
      actionType: "restore_start",
      idempotencyKey: "idem:445:block-restore-start",
    },
    {
      posture: readinessFixture.missingJourneyProofPosture,
      actionType: "restore_validate",
      idempotencyKey: "idem:445:block-restore-validate",
    },
    {
      posture: readinessFixture.degradedTrustPosture,
      actionType: "failover_activate",
      idempotencyKey: "idem:445:block-failover-activate",
    },
    {
      posture: readinessFixture.degradedTrustPosture,
      actionType: "failover_validate",
      idempotencyKey: "idem:445:block-failover-validate",
    },
    {
      posture: readinessFixture.activeFreezePosture,
      actionType: "failover_stand_down",
      idempotencyKey: "idem:445:block-failover-stand-down",
    },
    {
      posture: readinessFixture.activeFreezePosture,
      actionType: "chaos_schedule",
      idempotencyKey: "idem:445:block-chaos-schedule",
    },
    {
      posture: readinessFixture.activeFreezePosture,
      actionType: "chaos_start",
      idempotencyKey: "idem:445:block-chaos-start",
    },
    {
      posture: readinessFixture.missingJourneyProofPosture,
      actionType: "chaos_abort",
      idempotencyKey: "idem:445:block-chaos-abort",
    },
    {
      posture: readinessFixture.missingJourneyProofPosture,
      actionType: "recovery_pack_attest",
      idempotencyKey: "idem:445:block-pack-attest",
    },
  ];
  const blockedEveryActionTypeSettlements = stalePostureCases.map((caseInput) => {
    const blockedScopeTupleHash = service.createScopeTupleHash({
      scopeRef,
      snapshot: readinessFixture.readySnapshot,
      posture: caseInput.posture,
    });
    const blockedActor = {
      ...actor,
      idempotencyKey: caseInput.idempotencyKey,
      expectedPostureHash: caseInput.posture.controlTupleHash,
      expectedTupleHash: blockedScopeTupleHash,
    };
    const blockedBinding = service.createResilienceSurfaceRuntimeBinding({
      routeFamilyRef: "/ops/resilience",
      audienceSurfaceRuntimeBindingRef: "asrb_445_ops_current",
      audienceSurfaceRouteContractRef: "asrc_445_ops_resilience",
      surfacePublicationRef: "surface-publication:445:ops-resilience",
      requiredAssuranceSliceRefs: [
        "slice:runtime-publication",
        "slice:release-watch",
        "slice:resilience",
      ],
      snapshot: readinessFixture.readySnapshot,
      runbookBindings: readinessFixture.runbookBindings,
      recoveryTiers: readinessFixture.recoveryTiers,
      backupManifests: readinessFixture.backupManifests,
      syntheticCoverage: readinessFixture.syntheticCoverage,
      recoveryControlPosture: caseInput.posture,
      latestRecoveryEvidencePackRef:
        readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
      latestRecoveryEvidencePackState: "current",
      latestResilienceActionSettlementRefs: [],
    });
    const record = service.createActionRecord({
      actor: blockedActor,
      actionType: caseInput.actionType,
      routeIntentBindingRef,
      scopeRef,
      snapshot: readinessFixture.readySnapshot,
      posture: caseInput.posture,
      binding: blockedBinding,
      backupManifests: readinessFixture.backupManifests,
      syntheticCoverage: readinessFixture.syntheticCoverage,
      scopeTupleHash: blockedScopeTupleHash,
    });
    return service.settleAction({
      actor: blockedActor,
      actionRecord: record,
      snapshot: readinessFixture.readySnapshot,
      posture: caseInput.posture,
      binding: blockedBinding,
      recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
      syntheticRecoveryCoverageRefs: readinessFixture.syntheticCoverage.map(
        (coverage) => coverage.syntheticRecoveryCoverageRecordId,
      ),
    });
  });
  const restoreArtifact = service.createRecoveryEvidenceArtifact({
    artifactType: "restore_report",
    scopeRef,
    verificationScenarioRef: readinessFixture.readySnapshot.verificationScenarioRef,
    releaseContractVerificationMatrixRef:
      readinessFixture.readySnapshot.releaseContractVerificationMatrixRef,
    releaseContractMatrixHash: readinessFixture.readySnapshot.releaseContractMatrixHash,
    runtimePublicationBundleRef: readinessFixture.readySnapshot.runtimePublicationBundleRef,
    releasePublicationParityRef: readinessFixture.readySnapshot.releasePublicationParityRef,
    releaseWatchTupleRef: readinessFixture.readySnapshot.releaseWatchTupleRef,
    watchTupleHash: readinessFixture.readySnapshot.watchTupleHash,
    operationalReadinessSnapshotRef: readinessFixture.readySnapshot.operationalReadinessSnapshotId,
    recoveryControlPostureRef: readinessFixture.livePosture.recoveryControlPostureId,
    runbookBindingRefs: readinessFixture.runbookBindings.map(
      (binding) => binding.runbookBindingRecordId,
    ),
    backupSetManifestRefs: readinessFixture.backupManifests.map(
      (manifest) => manifest.backupSetManifestId,
    ),
    producingRunRef: restoreValidate.run.restoreRunId,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    syntheticRecoveryCoverageRefs: readinessFixture.syntheticCoverage.map(
      (coverage) => coverage.syntheticRecoveryCoverageRecordId,
    ),
    latestResilienceActionSettlementRefs: [restoreValidate.settlement.resilienceActionSettlementId],
    summaryRef: "artifact-summary:445:restore-report",
    assuranceEvidenceGraphSnapshotRef: "aegs_445_current",
    assuranceGraphCompletenessVerdictRef: "agcv_445_complete",
    graphHash: resilienceHash("graph:445:complete", "phase9.445.fixture"),
    artifactPresentationContractRef: "apc_445_recovery_summary",
    artifactSurfaceContextRef: "asc_445_ops_resilience",
    artifactModeTruthProjectionRef: "amtp_445_summary_first",
    artifactTransferSettlementRef: "ats_445_no_raw_handoff",
    artifactFallbackDispositionRef: "afd_445_same_shell",
    outboundNavigationGrantPolicyRef: "ongp_445_governed_export",
    maskingPolicyRef: "masking:445:resilience-minimum-necessary",
    externalHandoffPolicyRef: "handoff:445:governed",
    selectedAnchorRef: "anchor:445:restore-report",
    returnIntentTokenRef: "return-intent:445:ops-resilience",
    resilienceTupleHash: readinessFixture.readySnapshot.resilienceTupleHash,
    artifactState: "governed_preview",
  });
  const restoreArtifactReplay = service.createRecoveryEvidenceArtifact({
    ...artifactInputFromArtifact(restoreArtifact),
  });
  const recoveryPack = service.attestRecoveryPack({
    actor: { ...actor, idempotencyKey: "idem:445:pack-attest" },
    routeIntentBindingRef,
    scopeRef,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    recoveryTiers: readinessFixture.recoveryTiers,
    backupManifests: readinessFixture.backupManifests,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    restoreRunRefs: [restoreValidate.run.restoreRunId],
    failoverRunRefs: [failoverStandDown.run.failoverRunId],
    chaosRunRefs: [chaosStart.run.chaosRunId],
    artifactRefs: [restoreArtifact.recoveryEvidenceArtifactId],
    periodWindow: "2026-04-27T13:00:00.000Z/2026-04-27T14:15:00.000Z",
  });
  const graphWriteback = service.writeRecoveryEvidenceGraph({
    actor: { ...actor, idempotencyKey: "idem:445:graph-writeback" },
    producingRunRef: restoreValidate.run.restoreRunId,
    recoveryEvidencePackRef: recoveryPack.pack.recoveryEvidencePackId,
    artifacts: [restoreArtifact],
    settlement: restoreValidate.settlement,
    snapshot: readinessFixture.readySnapshot,
    runbookBindings: readinessFixture.runbookBindings,
    binding: surfaceBindingLive,
    posture: readinessFixture.livePosture,
  });
  const driftScopeTupleHash = resilienceHash("tuple-drift:445", "phase9.445.fixture");
  const oldRestoreRunAfterTupleDrift = {
    ...restoreValidate.run,
    restoreRunId: "rr_445_old_tuple",
    scopeTupleHash: driftScopeTupleHash,
    resilienceTupleHash: "0".repeat(64),
    resultState: "superseded" as const,
  };
  const oldFailoverRunAfterTupleDrift = {
    ...failoverStandDown.run,
    failoverRunId: "fr_445_old_tuple",
    scopeTupleHash: driftScopeTupleHash,
    resilienceTupleHash: "0".repeat(64),
    resultState: "superseded" as const,
  };
  const oldChaosRunAfterTupleDrift = {
    ...chaosStart.run,
    chaosRunId: "cr_445_old_tuple",
    scopeTupleHash: driftScopeTupleHash,
    resilienceTupleHash: "0".repeat(64),
    resultState: "superseded" as const,
  };
  const tupleDriftRecord = service.createActionRecord({
    actor: {
      ...actor,
      idempotencyKey: "idem:445:tuple-drift",
      expectedTupleHash: driftScopeTupleHash,
    },
    actionType: "restore_validate",
    routeIntentBindingRef,
    scopeRef,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    backupManifests: readinessFixture.backupManifests,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    scopeTupleHash,
  });
  const tupleDriftSettlement = service.settleAction({
    actor: {
      ...actor,
      idempotencyKey: "idem:445:tuple-drift",
      expectedTupleHash: driftScopeTupleHash,
    },
    actionRecord: tupleDriftRecord,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    authoritativeRunRefs: [
      oldRestoreRunAfterTupleDrift.restoreRunId,
      oldFailoverRunAfterTupleDrift.failoverRunId,
      oldChaosRunAfterTupleDrift.chaosRunId,
    ],
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    syntheticRecoveryCoverageRefs: readinessFixture.syntheticCoverage.map(
      (coverage) => coverage.syntheticRecoveryCoverageRecordId,
    ),
  });
  const duplicateRecord = service.createActionRecord({
    actor: { ...actor, idempotencyKey: "idem:445:duplicate" },
    actionType: "restore_start",
    routeIntentBindingRef,
    scopeRef,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    backupManifests: readinessFixture.backupManifests,
    syntheticCoverage: readinessFixture.syntheticCoverage,
    scopeTupleHash,
  });
  const duplicateIdempotencySettlement = service.settleAction({
    actor: { ...actor, idempotencyKey: "idem:445:duplicate" },
    actionRecord: duplicateRecord,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    syntheticRecoveryCoverageRefs: readinessFixture.syntheticCoverage.map(
      (coverage) => coverage.syntheticRecoveryCoverageRecordId,
    ),
  });
  const duplicateIdempotencyReplaySettlement = service.settleAction({
    actor: { ...actor, idempotencyKey: "idem:445:duplicate" },
    actionRecord: duplicateRecord,
    snapshot: readinessFixture.readySnapshot,
    posture: readinessFixture.livePosture,
    binding: surfaceBindingLive,
    recoveryEvidencePackRef: readinessFixture.recoveryEvidencePacks[0]!.recoveryEvidencePackId,
    syntheticRecoveryCoverageRefs: readinessFixture.syntheticCoverage.map(
      (coverage) => coverage.syntheticRecoveryCoverageRecordId,
    ),
  });
  let authorizationDeniedErrorCode = "";
  try {
    service.createActionRecord({
      actor: { ...actor, idempotencyKey: "idem:445:role-denied", roleRefs: ["support_agent"] },
      actionType: "restore_start",
      routeIntentBindingRef,
      scopeRef,
      snapshot: readinessFixture.readySnapshot,
      posture: readinessFixture.livePosture,
      binding: surfaceBindingLive,
      backupManifests: readinessFixture.backupManifests,
      syntheticCoverage: readinessFixture.syntheticCoverage,
      scopeTupleHash,
    });
  } catch (error) {
    authorizationDeniedErrorCode =
      error instanceof Phase9ResilienceActionSettlementError ? error.code : "UNKNOWN";
  }
  let tenantDeniedErrorCode = "";
  try {
    service.createActionRecord({
      actor: {
        ...actor,
        idempotencyKey: "idem:445:tenant-denied",
        scopeTokenRef: "scope-token:tenant:other",
      },
      actionType: "restore_start",
      routeIntentBindingRef,
      scopeRef,
      snapshot: readinessFixture.readySnapshot,
      posture: readinessFixture.livePosture,
      binding: surfaceBindingLive,
      backupManifests: readinessFixture.backupManifests,
      syntheticCoverage: readinessFixture.syntheticCoverage,
      scopeTupleHash,
    });
  } catch (error) {
    tenantDeniedErrorCode =
      error instanceof Phase9ResilienceActionSettlementError ? error.code : "UNKNOWN";
  }
  let rawObjectStoreLinkDeniedErrorCode = "";
  try {
    service.createRecoveryEvidenceArtifact({
      ...artifactInputFromArtifact(restoreArtifact),
      summaryRef: "s3://unsafe/raw-restore-report.json",
    });
  } catch (error) {
    rawObjectStoreLinkDeniedErrorCode =
      error instanceof Phase9ResilienceActionSettlementError ? error.code : "UNKNOWN";
  }

  return {
    schemaVersion: PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
    upstreamReadinessSchemaVersion: PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
    generatedAt,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9F",
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9D",
      "blueprint/phase-0-the-foundation-protocol.md#CommandActionRecord",
      "blueprint/phase-0-the-foundation-protocol.md#CommandSettlementRecord",
      "blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract",
      "data/contracts/444_phase9_operational_readiness_posture_contract.json",
    ],
    producedObjects: [
      "RestoreRun",
      "FailoverScenario",
      "FailoverRun",
      "ChaosExperiment",
      "ChaosRun",
      "RecoveryEvidencePack",
      "ResilienceSurfaceRuntimeBinding",
      "ResilienceActionRecord",
      "ResilienceActionSettlement",
      "RecoveryEvidenceArtifact",
      "RecoveryEvidenceGraphWriteback",
    ],
    apiSurface: [
      "approveFailoverScenario",
      "approveChaosExperiment",
      "prepareRestore",
      "startRestore",
      "validateRestore",
      "activateFailover",
      "validateFailover",
      "standDownFailover",
      "scheduleChaos",
      "startChaos",
      "abortChaos",
      "attestRecoveryPack",
      "getLatestRunAndSettlementState",
      "getRecoveryEvidenceArtifacts",
      "explainSettlementBlocker",
      "listWithCursor",
      "writeRecoveryEvidenceGraph",
    ],
    readinessInputs: {
      essentialFunctionCount: readinessFixture.essentialFunctions.length,
      recoveryTierCount: readinessFixture.recoveryTiers.length,
      backupManifestCount: readinessFixture.backupManifests.length,
      readinessHash: readinessFixture.readySnapshot.resilienceTupleHash,
      postureHash: readinessFixture.livePosture.controlTupleHash,
      tupleHash: scopeTupleHash,
    },
    surfaceBindingLive,
    surfaceBindingDiagnostic,
    restorePreparedSettlement: restorePrepared.settlement,
    restoreStartedRun: restoreStart.run,
    restoreValidatedRun: restoreValidate.run,
    dependencyBlockedRestoreRun: dependencyBlockedRestore.run,
    missingJourneyProofRestoreRun: missingJourneyProofRestore.run,
    approvedFailoverScenario,
    staleFailoverScenario,
    failoverActivatedRun: failoverActivate.run,
    failoverStoodDownRun: failoverStandDown.run,
    staleFailoverSettlement: staleFailover.settlement,
    approvedChaosExperiment,
    blockedChaosExperiment,
    chaosScheduledRun: chaosSchedule.run,
    chaosRunningRun: chaosStart.run,
    chaosGuardrailBlockedSettlement: chaosBlocked.settlement,
    blockedEveryActionTypeSettlements,
    latestSettlementState: {
      actionType: "chaos_start",
      latestRunRef: chaosBlocked.run.chaosRunId,
      latestSettlementRef: chaosBlocked.settlement.resilienceActionSettlementId,
      latestSettlementResult: chaosBlocked.settlement.result,
      visibleActionableState: "blocked",
      blockerRefs: service.explainSettlementBlocker({ settlement: chaosBlocked.settlement }),
    },
    recoveryEvidencePack: recoveryPack.pack,
    recoveryEvidenceArtifacts: [restoreArtifact],
    deterministicArtifactHash: restoreArtifact.artifactHash,
    deterministicArtifactReplayHash: restoreArtifactReplay.artifactHash,
    recoveryEvidenceGraphWriteback: graphWriteback,
    oldRestoreRunAfterTupleDrift,
    oldFailoverRunAfterTupleDrift,
    oldChaosRunAfterTupleDrift,
    tupleDriftSettlement,
    duplicateIdempotencySettlement,
    duplicateIdempotencyReplaySettlement,
    authorizationDeniedErrorCode,
    tenantDeniedErrorCode,
    rawObjectStoreLinkDeniedErrorCode,
    replayHash: orderedSetHash(
      [
        restoreValidate.run.restoreTupleHash,
        failoverStandDown.run.failoverTupleHash,
        chaosStart.run.chaosTupleHash,
        recoveryPack.pack.packTupleHash,
        graphWriteback.assuranceLedgerEntry.hash,
        duplicateIdempotencySettlement.settlementHash,
      ],
      "phase9.445.fixture.replay",
    ),
  };
}

export function phase9ResilienceActionSettlementSummary(
  fixture: Phase9ResilienceActionSettlementFixture = createPhase9ResilienceActionSettlementFixture(),
): string {
  return [
    "# Phase 9 Resilience Action Settlement",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Readiness tuple hash: ${fixture.readinessInputs.readinessHash}`,
    `Recovery control posture hash: ${fixture.readinessInputs.postureHash}`,
    `Action scope tuple hash: ${fixture.readinessInputs.tupleHash}`,
    `Live surface binding: ${fixture.surfaceBindingLive.bindingState}`,
    `Restore validation result: ${fixture.restoreValidatedRun.resultState}`,
    `Failover stand-down settlement: ${fixture.failoverStoodDownRun.resilienceActionSettlementRef}`,
    `Chaos guardrail blocked: ${fixture.chaosGuardrailBlockedSettlement.result}`,
    `Recovery evidence writeback hash: ${fixture.recoveryEvidenceGraphWriteback.writebackHash}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
  ].join("\n");
}

export function phase9ResilienceActionSettlementMatrixCsv(
  fixture: Phase9ResilienceActionSettlementFixture = createPhase9ResilienceActionSettlementFixture(),
): string {
  const rows = [
    ["case", "runOrSettlementRef", "result", "blocker"],
    [
      "clean_restore",
      fixture.restoreValidatedRun.restoreRunId,
      fixture.restoreValidatedRun.resultState,
      fixture.restoreValidatedRun.resilienceActionSettlementRef,
    ],
    [
      "dependency_blocked",
      fixture.dependencyBlockedRestoreRun.restoreRunId,
      fixture.dependencyBlockedRestoreRun.resultState,
      fixture.dependencyBlockedRestoreRun.dependencyValidationState,
    ],
    [
      "journey_pending",
      fixture.missingJourneyProofRestoreRun.restoreRunId,
      fixture.missingJourneyProofRestoreRun.resultState,
      fixture.missingJourneyProofRestoreRun.journeyValidationState,
    ],
    [
      "failover_stale_scope",
      fixture.staleFailoverSettlement.resilienceActionSettlementId,
      fixture.staleFailoverSettlement.result,
      fixture.staleFailoverSettlement.scopeTupleHash,
    ],
    [
      "chaos_guardrail",
      fixture.chaosGuardrailBlockedSettlement.resilienceActionSettlementId,
      fixture.chaosGuardrailBlockedSettlement.result,
      fixture.blockedChaosExperiment.blastRadiusRef,
    ],
    ...fixture.blockedEveryActionTypeSettlements.map((settlement) => [
      `blocked_${settlement.result}`,
      settlement.resilienceActionSettlementId,
      settlement.result,
      settlement.recordedPostureRef,
    ]),
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}
