import { createHash } from "node:crypto";

export * from "./phase8-offline-regression";
export {
  PHASE8_INVOCATION_REGRESSION_EVALUATOR_VERSION,
  PHASE8_PROHIBITED_MUTATION_ENDPOINTS,
  buildDraftInsertionCommand,
  detectProhibitedMutationRequests,
  enforceDisclosureFence,
  evaluateInvocationPolicy,
  evaluatePhase8InvocationCorpus,
  evaluatePhase8InvocationFixture,
  evaluateRolloutSlice,
  hashFor as hashForPhase8Invocation,
  highestPrecedenceKillSwitch,
  phase8InvocationThresholdsToCsv,
  settleDraftInsertionCommand,
  summarizePhase8InvocationReport,
  type Phase8ArtifactPresentationProof,
  type Phase8AudienceSurface,
  type Phase8CommandAuthority,
  type Phase8CommandInitiator,
  type Phase8CommandSettlementProof,
  type Phase8DeviceLayout,
  type Phase8DisclosureScope,
  type Phase8DraftInsertionCommand,
  type Phase8DraftPosture,
  type Phase8InvocationFailure,
  type Phase8InvocationFailureSeverity,
  type Phase8InvocationFailureType,
  type Phase8InvocationFixtureExpectation,
  type Phase8InvocationFixtureVerdict,
  type Phase8InvocationObservedState,
  type Phase8InvocationPolicyDecision,
  type Phase8InvocationRegressionCorpus,
  type Phase8InvocationRegressionFixture,
  type Phase8InvocationRegressionReport,
  type Phase8InvocationReportMetadata,
  type Phase8InvocationRole,
  type Phase8InvocationRouteFamily,
  type Phase8InvocationThresholdComparison,
  type Phase8InvocationThresholdConfig,
  type Phase8InvocationThresholdDefinition,
  type Phase8InvocationTrustState,
  type Phase8KillSwitchLevel,
  type Phase8OutputPosture,
  type Phase8PublicationState,
  type Phase8RecoveryPath,
  type Phase8RolloutState,
} from "./phase8-invocation-regression";
export {
  PHASE8_TRUST_ROLLOUT_EVALUATOR_VERSION,
  PHASE8_TRUST_ROLLOUT_PROHIBITED_ENDPOINTS,
  detectTrustRolloutProhibitedRequests,
  evaluateFeedbackRecord,
  evaluatePhase8TrustRolloutCorpus,
  evaluatePhase8TrustRolloutFixture,
  evaluateRolloutVerdict,
  expectedTrustLabel,
  hashFor as hashForPhase8TrustRollout,
  phase8TrustRolloutThresholdsToCsv,
  summarizePhase8TrustRolloutReport,
  type Phase8CitationState,
  type Phase8ConfidenceBand as Phase8TrustRolloutConfidenceBand,
  type Phase8DraftState,
  type Phase8FailureSeverity as Phase8TrustRolloutFailureSeverity,
  type Phase8FeedbackEventType,
  type Phase8FeedbackRecord,
  type Phase8FreshnessState as Phase8TrustRolloutFreshnessState,
  type Phase8InsertionPermission,
  type Phase8RolloutPublicationState,
  type Phase8RolloutRenderPosture,
  type Phase8RolloutRung,
  type Phase8RolloutScenario,
  type Phase8RolloutVerdict,
  type Phase8SliceMembershipState,
  type Phase8TrustAudienceSurface,
  type Phase8TrustEnvelope,
  type Phase8TrustEnvelopeState,
  type Phase8TrustFixtureCategory,
  type Phase8TrustPropagationSurface,
  type Phase8TrustRolloutCorpus,
  type Phase8TrustRolloutExpected,
  type Phase8TrustRolloutFailure,
  type Phase8TrustRolloutFailureType,
  type Phase8TrustRolloutFixture,
  type Phase8TrustRolloutFixtureVerdict,
  type Phase8TrustRolloutObserved,
  type Phase8TrustRolloutReport,
  type Phase8TrustRolloutReportMetadata,
  type Phase8TrustRolloutThresholdComparison,
  type Phase8TrustRolloutThresholdConfig,
  type Phase8TrustRolloutThresholdDefinition,
  type Phase8TrustRouteFamily,
  type Phase8TrustState as Phase8TrustRolloutTrustState,
} from "./phase8-trust-rollout-regression";
export * from "./phase8-exit-gate";

export type ISODateString = string;

export type EvaluationDatasetPartitionId = "gold" | "shadow_live" | "feedback";

export type EvaluationActorRole =
  | "evaluation_data_steward"
  | "clinical_safety_lead"
  | "shadow_dataset_capture_job"
  | "feedback_chain_settlement_job"
  | "replay_harness"
  | "release_gate"
  | "clinical_reviewer"
  | "senior_clinician"
  | "policy_owner"
  | "incident_owner"
  | "evaluation_workbench"
  | "monitoring_pipeline"
  | "training_eligibility_export"
  | "system";

export type DatasetPartitionManifestState =
  | "draft"
  | "candidate"
  | "published"
  | "superseded"
  | "revoked";

export type CaseReplayBundleState =
  | "draft"
  | "frozen"
  | "published"
  | "superseded"
  | "quarantined"
  | "revoked";

export type GroundTruthLabelState = "draft" | "submitted" | "superseded" | "excluded" | "revoked";

export type LabelAdjudicationState =
  | "not_required"
  | "pending"
  | "in_review"
  | "adjudicated"
  | "disputed"
  | "superseded"
  | "revoked";

export type ErrorTaxonomyState = "draft" | "confirmed" | "disputed" | "superseded" | "revoked";

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export type AdjudicationRoutingDisposition =
  | "not_required"
  | "queued"
  | "requires_adjudication"
  | "settled_clean"
  | "settled_excluded"
  | "settled_revoked";

export type ReplayRunState = "scheduled" | "completed" | "failed_closed" | "cancelled";

export type ShadowCompletenessState = "complete" | "stale" | "missing" | "blocked";

export type ShadowCaptureState = "captured" | "quarantined" | "blocked";

export type EvaluationExportArtifactState =
  | "summary_only"
  | "inline_renderable"
  | "external_handoff_ready"
  | "recovery_only"
  | "blocked"
  | "revoked";

export type AssistiveEvaluationSurfaceBindingState =
  | "live"
  | "observe_only"
  | "recovery_only"
  | "blocked"
  | "withdrawn";

export interface EvaluationActorContext {
  actorRef: string;
  actorRole: EvaluationActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  assertedAt?: ISODateString;
}

export interface EvaluationAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: EvaluationActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface DatasetPartitionManifest {
  datasetPartitionManifestId: string;
  partitionId: EvaluationDatasetPartitionId;
  partitionVersion: string;
  caseReplayBundleRefs: readonly string[];
  labelSetRefs: readonly string[];
  adjudicationSetRefs: readonly string[];
  feedbackEligibilityFlagRefs: readonly string[];
  accessPolicyRef: string;
  goldSetVersionRef?: string;
  manifestHash: string;
  publicationState: DatasetPartitionManifestState;
  publishedAt?: ISODateString;
  createdAt: ISODateString;
}

export interface CaseReplayBundle {
  replayBundleId: string;
  requestRef: string;
  taskRef: string;
  requestLineageRef: string;
  taskLineageRef: string;
  evidenceSnapshotRefs: readonly string[];
  evidenceCaptureBundleRefs: readonly string[];
  evidenceDerivationPackageRefs: readonly string[];
  expectedOutputsRef: string;
  featureSnapshotRefs: readonly string[];
  promptTemplateVersionRef: string;
  modelRegistryEntryRef: string;
  outputSchemaVersionRef: string;
  runtimeConfigHash: string;
  datasetPartition: EvaluationDatasetPartitionId;
  sensitivityTag: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  telemetryDisclosureFenceRef: string;
  feedbackEligibilityFlagRef?: string;
  bundleHash: string;
  bundleState: CaseReplayBundleState;
  manifestRef?: string;
  createdAt: ISODateString;
}

export interface GroundTruthLabel {
  labelId: string;
  replayBundleId: string;
  labelType: string;
  labelValueRef: string;
  labelSchemaVersionRef: string;
  annotatorRef: string;
  annotatorRole: EvaluationActorRole;
  labelProvenanceRef: string;
  errorTaxonomyRefs: readonly string[];
  adjudicationState: LabelAdjudicationState;
  supersedesLabelRef?: string;
  labelState: GroundTruthLabelState;
  createdAt: ISODateString;
}

export interface LabelAdjudicationRecord {
  adjudicationId: string;
  replayBundleId: string;
  candidateLabelRefs: readonly string[];
  adjudicatorRef: string;
  adjudicatorRole: EvaluationActorRole;
  adjudicationReasonCodes: readonly string[];
  finalLabelRef: string;
  decisionRationaleRef: string;
  adjudicationState: LabelAdjudicationState;
  supersedesAdjudicationRef?: string;
  createdAt: ISODateString;
}

export interface ErrorTaxonomyRecord {
  errorId: string;
  replayBundleId: string;
  capabilityCode: string;
  errorClass: string;
  severity: ErrorSeverity;
  sourceStage: string;
  reviewOutcome: string;
  evidenceSpanRefs: readonly string[];
  harmPotential: string;
  routingDisposition: AdjudicationRoutingDisposition;
  errorState: ErrorTaxonomyState;
  createdAt: ISODateString;
}

export interface ReplayRunRecord {
  replayRunId: string;
  replayBundleRef: string;
  replayHarnessVersionRef: string;
  replayInputHash: string;
  runState: ReplayRunState;
  outputRef?: string;
  outputHash?: string;
  outputSchemaVersionRef?: string;
  runtimeConfigHash?: string;
  comparisonSummaryRef?: string;
  failureReasonCodes: readonly string[];
  liveWorkflowMutationRef?: never;
  scheduledAt: ISODateString;
  completedAt?: ISODateString;
}

export interface ShadowDatasetCaptureRecord {
  shadowCaptureId: string;
  replayBundleRef: string;
  requestRef: string;
  taskRef: string;
  capabilityCode: string;
  datasetPartition: "shadow_live";
  shadowModeEvidenceRequirementRef: string;
  assistiveEvaluationSurfaceBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  telemetryDisclosureFenceRef: string;
  releaseRecoveryDispositionRef: string;
  assistiveOutputVisibleToEndUsers: false;
  completenessState: ShadowCompletenessState;
  captureState: ShadowCaptureState;
  capturedAt: ISODateString;
}

export interface EvaluationExportArtifact {
  evaluationExportArtifactId: string;
  replayBundleRef: string;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef?: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  redactionTransformHash: string;
  artifactState: EvaluationExportArtifactState;
  exportFormat: string;
  containsRawPhi: boolean;
  blockingReasonCodes: readonly string[];
  createdAt: ISODateString;
}

export interface AssistiveEvaluationSurfaceBinding {
  assistiveEvaluationSurfaceBindingId: string;
  routeFamilyRef: string;
  surfaceRouteContractRef?: string;
  surfacePublicationRef?: string;
  runtimePublicationBundleRef?: string;
  requiredTrustRefs: readonly string[];
  releaseRecoveryDispositionRef?: string;
  telemetryDisclosureFenceRef?: string;
  bindingState: AssistiveEvaluationSurfaceBindingState;
  blockingReasonCodes: readonly string[];
  validatedAt: ISODateString;
}

export interface EvaluationPlaneStore {
  manifests: Map<string, DatasetPartitionManifest>;
  replayBundles: Map<string, CaseReplayBundle>;
  labels: Map<string, GroundTruthLabel>;
  adjudications: Map<string, LabelAdjudicationRecord>;
  errorTaxonomyRecords: Map<string, ErrorTaxonomyRecord>;
  replayRuns: Map<string, ReplayRunRecord>;
  shadowCaptures: Map<string, ShadowDatasetCaptureRecord>;
  exportArtifacts: Map<string, EvaluationExportArtifact>;
  surfaceBindings: Map<string, AssistiveEvaluationSurfaceBinding>;
  auditRecords: EvaluationAuditRecord[];
  idempotencyKeys: Map<string, string>;
}

export interface EvaluationPlaneClock {
  now(): ISODateString;
}

export interface EvaluationPlaneIdGenerator {
  next(prefix: string): string;
}

export class EvaluationPlaneError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly reasonCodes: readonly string[] = [],
  ) {
    super(message);
    this.name = "EvaluationPlaneError";
  }
}

export interface CreateDatasetPartitionManifestCommand {
  partitionId: EvaluationDatasetPartitionId;
  partitionVersion: string;
  accessPolicyRef: string;
  caseReplayBundleRefs?: readonly string[];
  labelSetRefs?: readonly string[];
  adjudicationSetRefs?: readonly string[];
  feedbackEligibilityFlagRefs?: readonly string[];
  goldSetVersionRef?: string;
  publicationState?: DatasetPartitionManifestState;
  idempotencyKey?: string;
}

export interface AddBundleToManifestCommand {
  datasetPartitionManifestId: string;
  replayBundleRef: string;
}

export interface CreateCaseReplayBundleCommand {
  requestRef: string;
  taskRef: string;
  requestLineageRef: string;
  taskLineageRef: string;
  evidenceSnapshotRefs: readonly string[];
  evidenceCaptureBundleRefs: readonly string[];
  evidenceDerivationPackageRefs: readonly string[];
  expectedOutputsRef: string;
  featureSnapshotRefs: readonly string[];
  promptTemplateVersionRef: string;
  modelRegistryEntryRef: string;
  outputSchemaVersionRef: string;
  runtimeConfigHash: string;
  datasetPartition: EvaluationDatasetPartitionId;
  sensitivityTag: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  telemetryDisclosureFenceRef: string;
  feedbackEligibilityFlagRef?: string;
  manifestRef?: string;
  mutableCurrentTaskStateRef?: string;
  mutableInputRefs?: readonly string[];
  idempotencyKey?: string;
}

export interface RecordGroundTruthLabelCommand {
  replayBundleId: string;
  labelType: string;
  labelValueRef: string;
  labelSchemaVersionRef: string;
  annotatorRef: string;
  annotatorRole: EvaluationActorRole;
  labelProvenanceRef: string;
  errorTaxonomyRefs?: readonly string[];
  adjudicationState?: LabelAdjudicationState;
  supersedesLabelRef?: string;
  labelState?: GroundTruthLabelState;
  idempotencyKey?: string;
}

export interface AdjudicateLabelsCommand {
  replayBundleId: string;
  candidateLabelRefs: readonly string[];
  adjudicatorRef: string;
  adjudicatorRole: EvaluationActorRole;
  adjudicationReasonCodes: readonly string[];
  finalLabelRef: string;
  decisionRationaleRef: string;
  supersedesAdjudicationRef?: string;
  idempotencyKey?: string;
}

export interface RecordErrorTaxonomyCommand {
  replayBundleId: string;
  capabilityCode: string;
  errorClass: string;
  severity: ErrorSeverity;
  sourceStage: string;
  reviewOutcome: string;
  evidenceSpanRefs?: readonly string[];
  harmPotential: string;
  routingDisposition?: AdjudicationRoutingDisposition;
  errorState?: ErrorTaxonomyState;
  idempotencyKey?: string;
}

export interface ScheduleReplayRunCommand {
  replayBundleRef: string;
  replayHarnessVersionRef: string;
  idempotencyKey?: string;
}

export interface ExecuteReplayRunCommand {
  replayRunId: string;
  outputRef: string;
  outputSchemaVersionRef: string;
  runtimeConfigHash: string;
  comparisonSummaryRef?: string;
  executorVersionRef?: string;
  liveWorkflowMutationRef?: string;
}

export interface CaptureShadowDatasetCommand {
  requestRef: string;
  taskRef: string;
  requestLineageRef: string;
  taskLineageRef: string;
  evidenceSnapshotRefs: readonly string[];
  evidenceCaptureBundleRefs: readonly string[];
  evidenceDerivationPackageRefs: readonly string[];
  expectedOutputsRef: string;
  featureSnapshotRefs: readonly string[];
  promptTemplateVersionRef: string;
  modelRegistryEntryRef: string;
  outputSchemaVersionRef: string;
  runtimeConfigHash: string;
  capabilityCode: string;
  sensitivityTag: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  telemetryDisclosureFenceRef: string;
  releaseRecoveryDispositionRef: string;
  assistiveEvaluationSurfaceBindingRef: string;
  shadowModeEvidenceRequirementRef: string;
  completenessState: ShadowCompletenessState;
  assistiveOutputVisibleToEndUsers: boolean;
  idempotencyKey?: string;
}

export interface GenerateEvaluationExportArtifactCommand {
  replayBundleRef: string;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef?: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  redactionTransformHash: string;
  requestedArtifactState?: EvaluationExportArtifactState;
  exportFormat?: "json_summary" | "pdf_summary" | "csv_phi" | "raw_replay_dump";
  containsRawPhi?: boolean;
  directStorageUrl?: string;
  idempotencyKey?: string;
}

export interface ResolveAssistiveEvaluationSurfaceBindingCommand {
  routeFamilyRef: string;
  surfaceRouteContractRef?: string;
  surfacePublicationRef?: string;
  runtimePublicationBundleRef?: string;
  requiredTrustRefs?: readonly string[];
  releaseRecoveryDispositionRef?: string;
  telemetryDisclosureFenceRef?: string;
  publicationState?: "published" | "current" | "stale" | "withdrawn" | "blocked";
  runtimeState?: "published" | "current" | "stale" | "suspended" | "revoked" | "blocked";
  trustState?: "trusted" | "degraded" | "quarantined" | "shadow_only" | "frozen" | "unknown";
  recoveryState?: "normal" | "observe_only" | "recovery_only" | "hard_block" | "rollback_only";
  idempotencyKey?: string;
}

interface PartitionRule {
  allowedWriters: readonly EvaluationActorRole[];
  allowedReaders: readonly EvaluationActorRole[];
  mutability: string;
}

interface EvaluationPlaneRuntime {
  store: EvaluationPlaneStore;
  clock: EvaluationPlaneClock;
  idGenerator: EvaluationPlaneIdGenerator;
}

const partitionRules: Record<EvaluationDatasetPartitionId, PartitionRule> = {
  gold: {
    allowedWriters: ["evaluation_data_steward", "clinical_safety_lead"],
    allowedReaders: ["replay_harness", "release_gate", "clinical_safety_lead"],
    mutability: "immutable_after_publication",
  },
  shadow_live: {
    allowedWriters: ["shadow_dataset_capture_job"],
    allowedReaders: ["replay_harness", "evaluation_workbench", "monitoring_pipeline"],
    mutability: "append_only_with_versioned_cuts",
  },
  feedback: {
    allowedWriters: ["feedback_chain_settlement_job"],
    allowedReaders: ["evaluation_workbench", "training_eligibility_export", "clinical_safety_lead"],
    mutability: "append_only_with_revocation",
  },
};

const labelWriterRoles: readonly EvaluationActorRole[] = [
  "clinical_reviewer",
  "senior_clinician",
  "evaluation_data_steward",
  "clinical_safety_lead",
];

const adjudicatorRoles: readonly EvaluationActorRole[] = [
  "senior_clinician",
  "clinical_safety_lead",
  "policy_owner",
  "incident_owner",
];

const replayRoles: readonly EvaluationActorRole[] = [
  "replay_harness",
  "evaluation_data_steward",
  "clinical_safety_lead",
  "release_gate",
];

const exportRoles: readonly EvaluationActorRole[] = [
  "evaluation_workbench",
  "evaluation_data_steward",
  "clinical_safety_lead",
  "release_gate",
];

export const assistiveEvaluationServiceNames = [
  "EvaluationDatasetPartitionService",
  "CaseReplayBundleService",
  "GroundTruthLabelService",
  "ReplayAdjudicationService",
  "ErrorTaxonomyService",
  "ReplayHarnessOrchestrator",
  "ShadowDatasetCaptureService",
  "EvaluationExportArtifactService",
  "AssistiveEvaluationSurfaceBindingResolver",
] as const;

export function createEvaluationPlaneStore(): EvaluationPlaneStore {
  return {
    manifests: new Map(),
    replayBundles: new Map(),
    labels: new Map(),
    adjudications: new Map(),
    errorTaxonomyRecords: new Map(),
    replayRuns: new Map(),
    shadowCaptures: new Map(),
    exportArtifacts: new Map(),
    surfaceBindings: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
  };
}

export function createDeterministicEvaluationIdGenerator(): EvaluationPlaneIdGenerator {
  const counters = new Map<string, number>();
  return {
    next(prefix: string): string {
      const nextValue = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, nextValue);
      return `${prefix}_${String(nextValue).padStart(6, "0")}`;
    },
  };
}

export function stableEvaluationHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export class EvaluationDatasetPartitionService {
  public constructor(private readonly runtime: EvaluationPlaneRuntime) {}

  public getPartitionRule(partitionId: EvaluationDatasetPartitionId): PartitionRule {
    return partitionRules[partitionId];
  }

  public assertCanWritePartition(partitionId: EvaluationDatasetPartitionId, actor: EvaluationActorContext): void {
    const rule = this.getPartitionRule(partitionId);
    requireRole(actor, rule.allowedWriters, "EVAL_PARTITION_WRITE_FORBIDDEN", `Role ${actor.actorRole} cannot write ${partitionId}.`);
  }

  public createManifest(
    command: CreateDatasetPartitionManifestCommand,
    actor: EvaluationActorContext,
  ): DatasetPartitionManifest {
    this.assertCanWritePartition(command.partitionId, actor);
    const existing = getIdempotent(this.runtime, "manifest", command.idempotencyKey, this.runtime.store.manifests);
    if (existing) {
      return existing;
    }

    requireNonEmpty(command.partitionVersion, "partitionVersion");
    requireNonEmpty(command.accessPolicyRef, "accessPolicyRef");
    if (command.partitionId === "gold") {
      requireNonEmpty(command.goldSetVersionRef, "goldSetVersionRef");
    }

    const manifestWithoutHash = {
      datasetPartitionManifestId: this.runtime.idGenerator.next("eval_manifest"),
      partitionId: command.partitionId,
      partitionVersion: command.partitionVersion,
      caseReplayBundleRefs: [...(command.caseReplayBundleRefs ?? [])],
      labelSetRefs: [...(command.labelSetRefs ?? [])],
      adjudicationSetRefs: [...(command.adjudicationSetRefs ?? [])],
      feedbackEligibilityFlagRefs: [...(command.feedbackEligibilityFlagRefs ?? [])],
      accessPolicyRef: command.accessPolicyRef,
      goldSetVersionRef: command.goldSetVersionRef,
      publicationState: command.publicationState ?? "draft",
      createdAt: this.runtime.clock.now(),
    };
    const manifest: DatasetPartitionManifest = {
      ...manifestWithoutHash,
      manifestHash: stableEvaluationHash(manifestWithoutHash),
    };
    this.runtime.store.manifests.set(manifest.datasetPartitionManifestId, manifest);
    setIdempotent(this.runtime, "manifest", command.idempotencyKey, manifest.datasetPartitionManifestId);
    writeAudit(this.runtime, "EvaluationDatasetPartitionService", "createManifest", actor, manifest.datasetPartitionManifestId, "accepted", []);
    return manifest;
  }

  public addBundleToManifest(
    command: AddBundleToManifestCommand,
    actor: EvaluationActorContext,
  ): DatasetPartitionManifest {
    const manifest = requireFromMap(
      this.runtime.store.manifests,
      command.datasetPartitionManifestId,
      "EVAL_MANIFEST_NOT_FOUND",
    );
    this.assertCanWritePartition(manifest.partitionId, actor);
    assertManifestMutable(manifest);
    requireFromMap(this.runtime.store.replayBundles, command.replayBundleRef, "EVAL_REPLAY_BUNDLE_NOT_FOUND");
    if (manifest.caseReplayBundleRefs.includes(command.replayBundleRef)) {
      return manifest;
    }

    const updated: DatasetPartitionManifest = {
      ...manifest,
      caseReplayBundleRefs: [...manifest.caseReplayBundleRefs, command.replayBundleRef],
      manifestHash: stableEvaluationHash({
        ...manifest,
        caseReplayBundleRefs: [...manifest.caseReplayBundleRefs, command.replayBundleRef],
      }),
    };
    this.runtime.store.manifests.set(updated.datasetPartitionManifestId, updated);
    writeAudit(
      this.runtime,
      "EvaluationDatasetPartitionService",
      "addBundleToManifest",
      actor,
      updated.datasetPartitionManifestId,
      "accepted",
      [],
    );
    return updated;
  }

  public publishManifest(datasetPartitionManifestId: string, actor: EvaluationActorContext): DatasetPartitionManifest {
    const manifest = requireFromMap(this.runtime.store.manifests, datasetPartitionManifestId, "EVAL_MANIFEST_NOT_FOUND");
    this.assertCanWritePartition(manifest.partitionId, actor);
    if (manifest.publicationState === "published") {
      return manifest;
    }
    if (manifest.partitionId === "gold") {
      requireNonEmptyArray(manifest.caseReplayBundleRefs, "gold.caseReplayBundleRefs");
      requireNonEmptyArray(manifest.labelSetRefs, "gold.labelSetRefs");
      requireNonEmptyArray(manifest.adjudicationSetRefs, "gold.adjudicationSetRefs");
    }
    if (manifest.partitionId === "feedback") {
      requireNonEmptyArray(manifest.feedbackEligibilityFlagRefs, "feedback.feedbackEligibilityFlagRefs");
    }

    const published: DatasetPartitionManifest = {
      ...manifest,
      publicationState: "published",
      publishedAt: this.runtime.clock.now(),
      manifestHash: stableEvaluationHash({
        ...manifest,
        publicationState: "published",
      }),
    };
    this.runtime.store.manifests.set(datasetPartitionManifestId, published);
    writeAudit(
      this.runtime,
      "EvaluationDatasetPartitionService",
      "publishManifest",
      actor,
      datasetPartitionManifestId,
      "accepted",
      [],
    );
    return published;
  }
}

export class CaseReplayBundleService {
  public constructor(
    private readonly runtime: EvaluationPlaneRuntime,
    private readonly partitionService: EvaluationDatasetPartitionService,
  ) {}

  public createReplayBundle(command: CreateCaseReplayBundleCommand, actor: EvaluationActorContext): CaseReplayBundle {
    this.partitionService.assertCanWritePartition(command.datasetPartition, actor);
    const existing = getIdempotent(this.runtime, "replay_bundle", command.idempotencyKey, this.runtime.store.replayBundles);
    if (existing) {
      return existing;
    }

    validateReplayBundleInputs(command);
    if (command.datasetPartition === "feedback") {
      requireNonEmpty(command.feedbackEligibilityFlagRef, "feedbackEligibilityFlagRef");
    }

    const pinnedInput = {
      requestRef: command.requestRef,
      taskRef: command.taskRef,
      requestLineageRef: command.requestLineageRef,
      taskLineageRef: command.taskLineageRef,
      evidenceSnapshotRefs: [...command.evidenceSnapshotRefs],
      evidenceCaptureBundleRefs: [...command.evidenceCaptureBundleRefs],
      evidenceDerivationPackageRefs: [...command.evidenceDerivationPackageRefs],
      expectedOutputsRef: command.expectedOutputsRef,
      featureSnapshotRefs: [...command.featureSnapshotRefs],
      promptTemplateVersionRef: command.promptTemplateVersionRef,
      modelRegistryEntryRef: command.modelRegistryEntryRef,
      outputSchemaVersionRef: command.outputSchemaVersionRef,
      runtimeConfigHash: command.runtimeConfigHash,
      datasetPartition: command.datasetPartition,
      sensitivityTag: command.sensitivityTag,
      surfaceRouteContractRef: command.surfaceRouteContractRef,
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
      telemetryDisclosureFenceRef: command.telemetryDisclosureFenceRef,
      feedbackEligibilityFlagRef: command.feedbackEligibilityFlagRef,
    };
    const bundle: CaseReplayBundle = {
      replayBundleId: this.runtime.idGenerator.next("eval_replay_bundle"),
      ...pinnedInput,
      bundleHash: stableEvaluationHash(pinnedInput),
      bundleState: "frozen",
      manifestRef: command.manifestRef,
      createdAt: this.runtime.clock.now(),
    };
    this.runtime.store.replayBundles.set(bundle.replayBundleId, bundle);
    setIdempotent(this.runtime, "replay_bundle", command.idempotencyKey, bundle.replayBundleId);

    if (command.manifestRef) {
      this.partitionService.addBundleToManifest(
        {
          datasetPartitionManifestId: command.manifestRef,
          replayBundleRef: bundle.replayBundleId,
        },
        actor,
      );
    }

    writeAudit(this.runtime, "CaseReplayBundleService", "createReplayBundle", actor, bundle.replayBundleId, "accepted", []);
    return bundle;
  }

  public publishReplayBundle(replayBundleId: string, actor: EvaluationActorContext): CaseReplayBundle {
    const bundle = requireFromMap(this.runtime.store.replayBundles, replayBundleId, "EVAL_REPLAY_BUNDLE_NOT_FOUND");
    this.partitionService.assertCanWritePartition(bundle.datasetPartition, actor);
    assertReplayBundleReplayable(bundle);
    const published: CaseReplayBundle = {
      ...bundle,
      bundleState: "published",
    };
    this.runtime.store.replayBundles.set(replayBundleId, published);
    writeAudit(this.runtime, "CaseReplayBundleService", "publishReplayBundle", actor, replayBundleId, "accepted", []);
    return published;
  }
}

export class GroundTruthLabelService {
  public constructor(private readonly runtime: EvaluationPlaneRuntime) {}

  public recordLabel(command: RecordGroundTruthLabelCommand, actor: EvaluationActorContext): GroundTruthLabel {
    requireRole(actor, labelWriterRoles, "EVAL_LABEL_WRITE_FORBIDDEN", "Actor cannot record ground-truth labels.");
    requireFromMap(this.runtime.store.replayBundles, command.replayBundleId, "EVAL_REPLAY_BUNDLE_NOT_FOUND");
    const existing = getIdempotent(this.runtime, "label", command.idempotencyKey, this.runtime.store.labels);
    if (existing) {
      return existing;
    }
    requireNonEmpty(command.labelType, "labelType");
    requireNonEmpty(command.labelValueRef, "labelValueRef");
    requireNonEmpty(command.labelSchemaVersionRef, "labelSchemaVersionRef");
    requireNonEmpty(command.annotatorRef, "annotatorRef");
    requireNonEmpty(command.labelProvenanceRef, "labelProvenanceRef");

    const labelState = command.labelState ?? "draft";
    const label: GroundTruthLabel = {
      labelId: this.runtime.idGenerator.next("eval_label"),
      replayBundleId: command.replayBundleId,
      labelType: command.labelType,
      labelValueRef: command.labelValueRef,
      labelSchemaVersionRef: command.labelSchemaVersionRef,
      annotatorRef: command.annotatorRef,
      annotatorRole: command.annotatorRole,
      labelProvenanceRef: command.labelProvenanceRef,
      errorTaxonomyRefs: [...(command.errorTaxonomyRefs ?? [])],
      adjudicationState: command.adjudicationState ?? (labelState === "submitted" ? "pending" : "pending"),
      supersedesLabelRef: command.supersedesLabelRef,
      labelState,
      createdAt: this.runtime.clock.now(),
    };
    this.runtime.store.labels.set(label.labelId, label);
    setIdempotent(this.runtime, "label", command.idempotencyKey, label.labelId);
    writeAudit(this.runtime, "GroundTruthLabelService", "recordLabel", actor, label.labelId, "accepted", []);
    return label;
  }

  public submitLabel(labelId: string, actor: EvaluationActorContext): GroundTruthLabel {
    requireRole(actor, labelWriterRoles, "EVAL_LABEL_WRITE_FORBIDDEN", "Actor cannot submit ground-truth labels.");
    const label = requireFromMap(this.runtime.store.labels, labelId, "EVAL_LABEL_NOT_FOUND");
    if (label.labelState === "revoked" || label.labelState === "excluded") {
      throw new EvaluationPlaneError("EVAL_LABEL_TERMINAL", "Terminal labels cannot be submitted.");
    }
    const submitted: GroundTruthLabel = {
      ...label,
      labelState: "submitted",
      adjudicationState: label.adjudicationState === "not_required" ? "not_required" : "pending",
    };
    this.runtime.store.labels.set(labelId, submitted);
    writeAudit(this.runtime, "GroundTruthLabelService", "submitLabel", actor, labelId, "accepted", []);
    return submitted;
  }

  public supersedeLabel(labelId: string, actor: EvaluationActorContext): GroundTruthLabel {
    requireRole(actor, labelWriterRoles, "EVAL_LABEL_WRITE_FORBIDDEN", "Actor cannot supersede ground-truth labels.");
    const label = requireFromMap(this.runtime.store.labels, labelId, "EVAL_LABEL_NOT_FOUND");
    const superseded: GroundTruthLabel = {
      ...label,
      labelState: "superseded",
    };
    this.runtime.store.labels.set(labelId, superseded);
    writeAudit(this.runtime, "GroundTruthLabelService", "supersedeLabel", actor, labelId, "accepted", []);
    return superseded;
  }

  public revokeLabel(labelId: string, actor: EvaluationActorContext): GroundTruthLabel {
    requireRole(actor, ["evaluation_data_steward", "clinical_safety_lead"], "EVAL_LABEL_REVOKE_FORBIDDEN", "Actor cannot revoke labels.");
    const label = requireFromMap(this.runtime.store.labels, labelId, "EVAL_LABEL_NOT_FOUND");
    const revoked: GroundTruthLabel = {
      ...label,
      labelState: "revoked",
      adjudicationState: "revoked",
    };
    this.runtime.store.labels.set(labelId, revoked);
    writeAudit(this.runtime, "GroundTruthLabelService", "revokeLabel", actor, labelId, "accepted", []);
    return revoked;
  }

  public canSupportFinalTruth(label: GroundTruthLabel): boolean {
    return label.labelState === "submitted" && ["not_required", "adjudicated"].includes(label.adjudicationState);
  }
}

export class ReplayAdjudicationService {
  public constructor(private readonly runtime: EvaluationPlaneRuntime) {}

  public adjudicateLabels(command: AdjudicateLabelsCommand, actor: EvaluationActorContext): LabelAdjudicationRecord {
    requireRole(actor, adjudicatorRoles, "EVAL_ADJUDICATION_FORBIDDEN", "Actor cannot adjudicate labels.");
    requireFromMap(this.runtime.store.replayBundles, command.replayBundleId, "EVAL_REPLAY_BUNDLE_NOT_FOUND");
    requireNonEmptyArray(command.candidateLabelRefs, "candidateLabelRefs");
    requireNonEmpty(command.finalLabelRef, "finalLabelRef");
    requireNonEmpty(command.decisionRationaleRef, "decisionRationaleRef");

    const existing = getIdempotent(this.runtime, "adjudication", command.idempotencyKey, this.runtime.store.adjudications);
    if (existing) {
      return existing;
    }

    for (const labelRef of command.candidateLabelRefs) {
      const candidate = requireFromMap(this.runtime.store.labels, labelRef, "EVAL_LABEL_NOT_FOUND");
      if (candidate.replayBundleId !== command.replayBundleId) {
        throw new EvaluationPlaneError("EVAL_LABEL_BUNDLE_MISMATCH", "Candidate labels must belong to the replay bundle.");
      }
      if (candidate.labelState !== "submitted") {
        throw new EvaluationPlaneError("EVAL_LABEL_NOT_SUBMITTED", "Candidate labels must be submitted before adjudication.");
      }
    }
    const finalLabel = requireFromMap(this.runtime.store.labels, command.finalLabelRef, "EVAL_LABEL_NOT_FOUND");
    if (finalLabel.replayBundleId !== command.replayBundleId || finalLabel.labelState !== "submitted") {
      throw new EvaluationPlaneError("EVAL_FINAL_LABEL_INVALID", "Final label must be a submitted label on the replay bundle.");
    }

    const adjudication: LabelAdjudicationRecord = {
      adjudicationId: this.runtime.idGenerator.next("eval_adjudication"),
      replayBundleId: command.replayBundleId,
      candidateLabelRefs: [...command.candidateLabelRefs],
      adjudicatorRef: command.adjudicatorRef,
      adjudicatorRole: command.adjudicatorRole,
      adjudicationReasonCodes: [...command.adjudicationReasonCodes],
      finalLabelRef: command.finalLabelRef,
      decisionRationaleRef: command.decisionRationaleRef,
      adjudicationState: "adjudicated",
      supersedesAdjudicationRef: command.supersedesAdjudicationRef,
      createdAt: this.runtime.clock.now(),
    };
    this.runtime.store.adjudications.set(adjudication.adjudicationId, adjudication);
    this.runtime.store.labels.set(command.finalLabelRef, {
      ...finalLabel,
      adjudicationState: "adjudicated",
    });
    setIdempotent(this.runtime, "adjudication", command.idempotencyKey, adjudication.adjudicationId);
    writeAudit(
      this.runtime,
      "ReplayAdjudicationService",
      "adjudicateLabels",
      actor,
      adjudication.adjudicationId,
      "accepted",
      [],
    );
    return adjudication;
  }
}

export class ErrorTaxonomyService {
  public constructor(private readonly runtime: EvaluationPlaneRuntime) {}

  public recordErrorTaxonomy(command: RecordErrorTaxonomyCommand, actor: EvaluationActorContext): ErrorTaxonomyRecord {
    requireRole(actor, [...labelWriterRoles, ...adjudicatorRoles], "EVAL_ERROR_TAXONOMY_FORBIDDEN", "Actor cannot record error taxonomy.");
    requireFromMap(this.runtime.store.replayBundles, command.replayBundleId, "EVAL_REPLAY_BUNDLE_NOT_FOUND");
    const existing = getIdempotent(this.runtime, "error_taxonomy", command.idempotencyKey, this.runtime.store.errorTaxonomyRecords);
    if (existing) {
      return existing;
    }
    requireNonEmpty(command.capabilityCode, "capabilityCode");
    requireNonEmpty(command.errorClass, "errorClass");
    requireNonEmpty(command.sourceStage, "sourceStage");
    requireNonEmpty(command.reviewOutcome, "reviewOutcome");
    requireNonEmpty(command.harmPotential, "harmPotential");

    const routingDisposition = command.routingDisposition ?? "not_required";
    if (["high", "critical"].includes(command.severity) && routingDisposition === "not_required") {
      throw new EvaluationPlaneError(
        "EVAL_ERROR_REQUIRES_ADJUDICATION",
        "Confirmed high and critical errors must route to adjudication.",
        ["confirmed_high_or_critical_requires_adjudication"],
      );
    }

    const record: ErrorTaxonomyRecord = {
      errorId: this.runtime.idGenerator.next("eval_error"),
      replayBundleId: command.replayBundleId,
      capabilityCode: command.capabilityCode,
      errorClass: command.errorClass,
      severity: command.severity,
      sourceStage: command.sourceStage,
      reviewOutcome: command.reviewOutcome,
      evidenceSpanRefs: [...(command.evidenceSpanRefs ?? [])],
      harmPotential: command.harmPotential,
      routingDisposition,
      errorState: command.errorState ?? "confirmed",
      createdAt: this.runtime.clock.now(),
    };
    this.runtime.store.errorTaxonomyRecords.set(record.errorId, record);
    setIdempotent(this.runtime, "error_taxonomy", command.idempotencyKey, record.errorId);
    writeAudit(this.runtime, "ErrorTaxonomyService", "recordErrorTaxonomy", actor, record.errorId, "accepted", []);
    return record;
  }
}

export class ReplayHarnessOrchestrator {
  public constructor(private readonly runtime: EvaluationPlaneRuntime) {}

  public scheduleReplayRun(command: ScheduleReplayRunCommand, actor: EvaluationActorContext): ReplayRunRecord {
    requireRole(actor, replayRoles, "EVAL_REPLAY_FORBIDDEN", "Actor cannot schedule replay runs.");
    const existing = getIdempotent(this.runtime, "replay_run", command.idempotencyKey, this.runtime.store.replayRuns);
    if (existing) {
      return existing;
    }
    const bundle = requireFromMap(this.runtime.store.replayBundles, command.replayBundleRef, "EVAL_REPLAY_BUNDLE_NOT_FOUND");
    assertReplayBundleReplayable(bundle);
    requireNonEmpty(command.replayHarnessVersionRef, "replayHarnessVersionRef");

    const replayInputHash = stableEvaluationHash({
      replayBundleHash: bundle.bundleHash,
      replayHarnessVersionRef: command.replayHarnessVersionRef,
      evidenceSnapshotRefs: bundle.evidenceSnapshotRefs,
      featureSnapshotRefs: bundle.featureSnapshotRefs,
      promptTemplateVersionRef: bundle.promptTemplateVersionRef,
      modelRegistryEntryRef: bundle.modelRegistryEntryRef,
      outputSchemaVersionRef: bundle.outputSchemaVersionRef,
      runtimeConfigHash: bundle.runtimeConfigHash,
    });
    const run: ReplayRunRecord = {
      replayRunId: this.runtime.idGenerator.next("eval_replay_run"),
      replayBundleRef: bundle.replayBundleId,
      replayHarnessVersionRef: command.replayHarnessVersionRef,
      replayInputHash,
      runState: "scheduled",
      failureReasonCodes: [],
      scheduledAt: this.runtime.clock.now(),
    };
    this.runtime.store.replayRuns.set(run.replayRunId, run);
    setIdempotent(this.runtime, "replay_run", command.idempotencyKey, run.replayRunId);
    writeAudit(this.runtime, "ReplayHarnessOrchestrator", "scheduleReplayRun", actor, run.replayRunId, "accepted", []);
    return run;
  }

  public executeReplayRun(command: ExecuteReplayRunCommand, actor: EvaluationActorContext): ReplayRunRecord {
    requireRole(actor, replayRoles, "EVAL_REPLAY_FORBIDDEN", "Actor cannot execute replay runs.");
    const run = requireFromMap(this.runtime.store.replayRuns, command.replayRunId, "EVAL_REPLAY_RUN_NOT_FOUND");
    const bundle = requireFromMap(this.runtime.store.replayBundles, run.replayBundleRef, "EVAL_REPLAY_BUNDLE_NOT_FOUND");
    if (command.liveWorkflowMutationRef) {
      return this.failRun(run, actor, ["live_workflow_mutation_forbidden"]);
    }
    if (command.outputSchemaVersionRef !== bundle.outputSchemaVersionRef) {
      return this.failRun(run, actor, ["output_schema_version_mismatch"]);
    }
    if (command.runtimeConfigHash !== bundle.runtimeConfigHash) {
      return this.failRun(run, actor, ["runtime_config_hash_mismatch"]);
    }

    const outputHash = stableEvaluationHash({
      replayInputHash: run.replayInputHash,
      outputRef: command.outputRef,
      outputSchemaVersionRef: command.outputSchemaVersionRef,
      runtimeConfigHash: command.runtimeConfigHash,
      executorVersionRef: command.executorVersionRef ?? "executor_version_unspecified",
    });
    const completed: ReplayRunRecord = {
      ...run,
      runState: "completed",
      outputRef: command.outputRef,
      outputHash,
      outputSchemaVersionRef: command.outputSchemaVersionRef,
      runtimeConfigHash: command.runtimeConfigHash,
      comparisonSummaryRef: command.comparisonSummaryRef,
      completedAt: this.runtime.clock.now(),
    };
    this.runtime.store.replayRuns.set(run.replayRunId, completed);
    writeAudit(this.runtime, "ReplayHarnessOrchestrator", "executeReplayRun", actor, run.replayRunId, "accepted", []);
    return completed;
  }

  private failRun(run: ReplayRunRecord, actor: EvaluationActorContext, reasonCodes: readonly string[]): ReplayRunRecord {
    const failed: ReplayRunRecord = {
      ...run,
      runState: "failed_closed",
      failureReasonCodes: reasonCodes,
      completedAt: this.runtime.clock.now(),
    };
    this.runtime.store.replayRuns.set(run.replayRunId, failed);
    writeAudit(this.runtime, "ReplayHarnessOrchestrator", "executeReplayRun", actor, run.replayRunId, "failed_closed", reasonCodes);
    return failed;
  }
}

export class ShadowDatasetCaptureService {
  public constructor(
    private readonly runtime: EvaluationPlaneRuntime,
    private readonly caseReplayBundleService: CaseReplayBundleService,
  ) {}

  public captureShadowCase(command: CaptureShadowDatasetCommand, actor: EvaluationActorContext): ShadowDatasetCaptureRecord {
    requireRole(
      actor,
      ["shadow_dataset_capture_job"],
      "EVAL_SHADOW_CAPTURE_FORBIDDEN",
      "Only the governed shadow dataset capture job can write shadow_live.",
    );
    const existing = getIdempotent(this.runtime, "shadow_capture", command.idempotencyKey, this.runtime.store.shadowCaptures);
    if (existing) {
      return existing;
    }
    if (command.assistiveOutputVisibleToEndUsers) {
      throw new EvaluationPlaneError("EVAL_SHADOW_OUTPUT_VISIBLE", "Shadow capture may not expose assistive output to end users.", [
        "shadow_evidence_must_remain_invisible",
      ]);
    }
    requireNonEmpty(command.assistiveEvaluationSurfaceBindingRef, "assistiveEvaluationSurfaceBindingRef");
    requireNonEmpty(command.shadowModeEvidenceRequirementRef, "shadowModeEvidenceRequirementRef");
    if (command.completenessState === "blocked") {
      throw new EvaluationPlaneError("EVAL_SHADOW_CAPTURE_BLOCKED", "Blocked publication or runtime posture cannot capture shadow evidence.", [
        "shadow_publication_binding_blocked",
      ]);
    }

    const bundle = this.caseReplayBundleService.createReplayBundle(
      {
        ...command,
        datasetPartition: "shadow_live",
        idempotencyKey: command.idempotencyKey ? `shadow_bundle:${command.idempotencyKey}` : undefined,
      },
      actor,
    );
    const record: ShadowDatasetCaptureRecord = {
      shadowCaptureId: this.runtime.idGenerator.next("eval_shadow_capture"),
      replayBundleRef: bundle.replayBundleId,
      requestRef: command.requestRef,
      taskRef: command.taskRef,
      capabilityCode: command.capabilityCode,
      datasetPartition: "shadow_live",
      shadowModeEvidenceRequirementRef: command.shadowModeEvidenceRequirementRef,
      assistiveEvaluationSurfaceBindingRef: command.assistiveEvaluationSurfaceBindingRef,
      surfaceRouteContractRef: command.surfaceRouteContractRef,
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
      telemetryDisclosureFenceRef: command.telemetryDisclosureFenceRef,
      releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
      assistiveOutputVisibleToEndUsers: false,
      completenessState: command.completenessState,
      captureState: command.completenessState === "complete" ? "captured" : "quarantined",
      capturedAt: this.runtime.clock.now(),
    };
    this.runtime.store.shadowCaptures.set(record.shadowCaptureId, record);
    setIdempotent(this.runtime, "shadow_capture", command.idempotencyKey, record.shadowCaptureId);
    writeAudit(this.runtime, "ShadowDatasetCaptureService", "captureShadowCase", actor, record.shadowCaptureId, "accepted", []);
    return record;
  }
}

export class EvaluationExportArtifactService {
  public constructor(private readonly runtime: EvaluationPlaneRuntime) {}

  public generateExportArtifact(
    command: GenerateEvaluationExportArtifactCommand,
    actor: EvaluationActorContext,
  ): EvaluationExportArtifact {
    requireRole(actor, exportRoles, "EVAL_EXPORT_FORBIDDEN", "Actor cannot generate evaluation exports.");
    requireFromMap(this.runtime.store.replayBundles, command.replayBundleRef, "EVAL_REPLAY_BUNDLE_NOT_FOUND");
    const existing = getIdempotent(this.runtime, "export_artifact", command.idempotencyKey, this.runtime.store.exportArtifacts);
    if (existing) {
      return existing;
    }
    requireNonEmpty(command.artifactPresentationContractRef, "artifactPresentationContractRef");
    requireNonEmpty(command.surfaceRouteContractRef, "surfaceRouteContractRef");
    requireNonEmpty(command.surfacePublicationRef, "surfacePublicationRef");
    requireNonEmpty(command.runtimePublicationBundleRef, "runtimePublicationBundleRef");
    requireNonEmpty(command.placeholderContractRef, "placeholderContractRef");
    requireNonEmpty(command.redactionTransformHash, "redactionTransformHash");

    const exportFormat = command.exportFormat ?? "json_summary";
    const blockingReasonCodes = deriveExportBlockingReasons(command, exportFormat);
    const artifactState =
      blockingReasonCodes.length > 0 ? "blocked" : command.requestedArtifactState ?? "summary_only";
    const artifact: EvaluationExportArtifact = {
      evaluationExportArtifactId: this.runtime.idGenerator.next("eval_export_artifact"),
      replayBundleRef: command.replayBundleRef,
      artifactPresentationContractRef: command.artifactPresentationContractRef,
      outboundNavigationGrantPolicyRef: command.outboundNavigationGrantPolicyRef,
      surfaceRouteContractRef: command.surfaceRouteContractRef,
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
      visibilityTier: command.visibilityTier,
      summarySafetyTier: command.summarySafetyTier,
      placeholderContractRef: command.placeholderContractRef,
      redactionTransformHash: command.redactionTransformHash,
      artifactState,
      exportFormat,
      containsRawPhi: command.containsRawPhi ?? false,
      blockingReasonCodes,
      createdAt: this.runtime.clock.now(),
    };
    this.runtime.store.exportArtifacts.set(artifact.evaluationExportArtifactId, artifact);
    setIdempotent(this.runtime, "export_artifact", command.idempotencyKey, artifact.evaluationExportArtifactId);
    writeAudit(
      this.runtime,
      "EvaluationExportArtifactService",
      "generateExportArtifact",
      actor,
      artifact.evaluationExportArtifactId,
      artifactState === "blocked" ? "blocked" : "accepted",
      blockingReasonCodes,
    );
    return artifact;
  }
}

export class AssistiveEvaluationSurfaceBindingResolver {
  public constructor(private readonly runtime: EvaluationPlaneRuntime) {}

  public resolveBinding(
    command: ResolveAssistiveEvaluationSurfaceBindingCommand,
    actor: EvaluationActorContext,
  ): AssistiveEvaluationSurfaceBinding {
    const existing = getIdempotent(this.runtime, "surface_binding", command.idempotencyKey, this.runtime.store.surfaceBindings);
    if (existing) {
      return existing;
    }
    requireNonEmpty(command.routeFamilyRef, "routeFamilyRef");
    const requiredTrustRefs = [...(command.requiredTrustRefs ?? [])];
    const blockingReasonCodes = deriveBindingBlockingReasons(command, requiredTrustRefs);
    const bindingState = deriveBindingState(command, requiredTrustRefs, blockingReasonCodes);
    const binding: AssistiveEvaluationSurfaceBinding = {
      assistiveEvaluationSurfaceBindingId: this.runtime.idGenerator.next("eval_surface_binding"),
      routeFamilyRef: command.routeFamilyRef,
      surfaceRouteContractRef: command.surfaceRouteContractRef,
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
      requiredTrustRefs,
      releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
      telemetryDisclosureFenceRef: command.telemetryDisclosureFenceRef,
      bindingState,
      blockingReasonCodes,
      validatedAt: this.runtime.clock.now(),
    };
    this.runtime.store.surfaceBindings.set(binding.assistiveEvaluationSurfaceBindingId, binding);
    setIdempotent(this.runtime, "surface_binding", command.idempotencyKey, binding.assistiveEvaluationSurfaceBindingId);
    writeAudit(
      this.runtime,
      "AssistiveEvaluationSurfaceBindingResolver",
      "resolveBinding",
      actor,
      binding.assistiveEvaluationSurfaceBindingId,
      bindingState === "blocked" ? "blocked" : "accepted",
      blockingReasonCodes,
    );
    return binding;
  }
}

export function createAssistiveEvaluationPlane(options?: {
  store?: EvaluationPlaneStore;
  clock?: EvaluationPlaneClock;
  idGenerator?: EvaluationPlaneIdGenerator;
}): {
  store: EvaluationPlaneStore;
  datasetPartitions: EvaluationDatasetPartitionService;
  replayBundles: CaseReplayBundleService;
  labels: GroundTruthLabelService;
  adjudications: ReplayAdjudicationService;
  errorTaxonomy: ErrorTaxonomyService;
  replayHarness: ReplayHarnessOrchestrator;
  shadowCapture: ShadowDatasetCaptureService;
  exports: EvaluationExportArtifactService;
  surfaceBindings: AssistiveEvaluationSurfaceBindingResolver;
} {
  const runtime: EvaluationPlaneRuntime = {
    store: options?.store ?? createEvaluationPlaneStore(),
    clock: options?.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options?.idGenerator ?? createDeterministicEvaluationIdGenerator(),
  };
  const datasetPartitions = new EvaluationDatasetPartitionService(runtime);
  const replayBundles = new CaseReplayBundleService(runtime, datasetPartitions);
  return {
    store: runtime.store,
    datasetPartitions,
    replayBundles,
    labels: new GroundTruthLabelService(runtime),
    adjudications: new ReplayAdjudicationService(runtime),
    errorTaxonomy: new ErrorTaxonomyService(runtime),
    replayHarness: new ReplayHarnessOrchestrator(runtime),
    shadowCapture: new ShadowDatasetCaptureService(runtime, replayBundles),
    exports: new EvaluationExportArtifactService(runtime),
    surfaceBindings: new AssistiveEvaluationSurfaceBindingResolver(runtime),
  };
}

export const assistiveEvaluationRuntimeContract = {
  contractId: "406_evaluation_runtime_contract",
  schemaVersion: "406.evaluation-runtime-contract.v1",
  upstreamContractRefs: [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/404_feedback_eligibility_contracts.json",
    "data/contracts/404_shadow_mode_evidence_requirements.json",
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/405_regulatory_change_control_rules.json",
  ],
  services: assistiveEvaluationServiceNames,
  partitions: ["gold", "shadow_live", "feedback"],
  failClosedDefaults: ["missing_pinned_replay_input", "mutable_current_task_state_ref", "visible_shadow_output", "raw_phi_export"],
} as const;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

function getIdempotent<T>(
  runtime: EvaluationPlaneRuntime,
  namespace: string,
  idempotencyKey: string | undefined,
  records: Map<string, T>,
): T | undefined {
  if (!idempotencyKey) {
    return undefined;
  }
  const recordId = runtime.store.idempotencyKeys.get(`${namespace}:${idempotencyKey}`);
  if (!recordId) {
    return undefined;
  }
  return records.get(recordId);
}

function setIdempotent(
  runtime: EvaluationPlaneRuntime,
  namespace: string,
  idempotencyKey: string | undefined,
  recordId: string,
): void {
  if (idempotencyKey) {
    runtime.store.idempotencyKeys.set(`${namespace}:${idempotencyKey}`, recordId);
  }
}

function writeAudit(
  runtime: EvaluationPlaneRuntime,
  serviceName: string,
  action: string,
  actor: EvaluationActorContext,
  subjectRef: string,
  outcome: EvaluationAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("eval_audit"),
    serviceName,
    action,
    actorRef: actor.actorRef,
    actorRole: actor.actorRole,
    routeIntentBindingRef: actor.routeIntentBindingRef,
    auditCorrelationId: actor.auditCorrelationId,
    purposeOfUse: actor.purposeOfUse,
    subjectRef,
    outcome,
    reasonCodes,
    recordedAt: runtime.clock.now(),
  });
}

function requireRole(
  actor: EvaluationActorContext,
  allowedRoles: readonly EvaluationActorRole[],
  code: string,
  message: string,
): void {
  if (!allowedRoles.includes(actor.actorRole)) {
    throw new EvaluationPlaneError(code, message, [`role_${actor.actorRole}_not_allowed`]);
  }
}

function requireFromMap<T>(records: Map<string, T>, key: string, code: string): T {
  const record = records.get(key);
  if (!record) {
    throw new EvaluationPlaneError(code, `Missing evaluation record: ${key}.`);
  }
  return record;
}

function requireNonEmpty(value: string | undefined, fieldName: string): asserts value is string {
  if (!value || value.trim().length === 0) {
    throw new EvaluationPlaneError("EVAL_REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}.`, [
      `${fieldName}_missing`,
    ]);
  }
}

function requireNonEmptyArray<T>(value: readonly T[], fieldName: string): void {
  if (value.length === 0) {
    throw new EvaluationPlaneError("EVAL_REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}.`, [
      `${fieldName}_missing`,
    ]);
  }
}

function assertManifestMutable(manifest: DatasetPartitionManifest): void {
  if (manifest.publicationState === "published") {
    throw new EvaluationPlaneError("EVAL_MANIFEST_IMMUTABLE", "Published dataset manifests are immutable.", [
      `${manifest.partitionId}_manifest_published`,
    ]);
  }
}

function validateReplayBundleInputs(command: CreateCaseReplayBundleCommand): void {
  for (const [fieldName, value] of [
    ["requestRef", command.requestRef],
    ["taskRef", command.taskRef],
    ["requestLineageRef", command.requestLineageRef],
    ["taskLineageRef", command.taskLineageRef],
    ["expectedOutputsRef", command.expectedOutputsRef],
    ["promptTemplateVersionRef", command.promptTemplateVersionRef],
    ["modelRegistryEntryRef", command.modelRegistryEntryRef],
    ["outputSchemaVersionRef", command.outputSchemaVersionRef],
    ["runtimeConfigHash", command.runtimeConfigHash],
    ["sensitivityTag", command.sensitivityTag],
    ["surfaceRouteContractRef", command.surfaceRouteContractRef],
    ["surfacePublicationRef", command.surfacePublicationRef],
    ["runtimePublicationBundleRef", command.runtimePublicationBundleRef],
    ["telemetryDisclosureFenceRef", command.telemetryDisclosureFenceRef],
  ] as const) {
    requireNonEmpty(value, fieldName);
  }
  requireNonEmptyArray(command.evidenceSnapshotRefs, "evidenceSnapshotRefs");
  requireNonEmptyArray(command.evidenceCaptureBundleRefs, "evidenceCaptureBundleRefs");
  requireNonEmptyArray(command.evidenceDerivationPackageRefs, "evidenceDerivationPackageRefs");
  requireNonEmptyArray(command.featureSnapshotRefs, "featureSnapshotRefs");
  if (command.mutableCurrentTaskStateRef) {
    throw new EvaluationPlaneError("EVAL_MUTABLE_INPUT_REF", "Replay bundles may not reference mutable current task state.", [
      "mutable_current_task_state_ref",
    ]);
  }
  const mutableRefs = [...allReplayRefs(command), ...(command.mutableInputRefs ?? [])].filter(isMutableRef);
  if (mutableRefs.length > 0) {
    throw new EvaluationPlaneError("EVAL_MUTABLE_INPUT_REF", "Replay bundles may use only frozen refs.", [
      "mutable_replay_input_ref",
    ]);
  }
}

function allReplayRefs(command: CreateCaseReplayBundleCommand): readonly string[] {
  return [
    command.requestRef,
    command.taskRef,
    command.requestLineageRef,
    command.taskLineageRef,
    ...command.evidenceSnapshotRefs,
    ...command.evidenceCaptureBundleRefs,
    ...command.evidenceDerivationPackageRefs,
    command.expectedOutputsRef,
    ...command.featureSnapshotRefs,
    command.promptTemplateVersionRef,
    command.modelRegistryEntryRef,
    command.outputSchemaVersionRef,
  ];
}

function isMutableRef(ref: string): boolean {
  const normalised = ref.toLowerCase();
  return normalised.startsWith("mutable:") || normalised.includes("mutable_current_task_state");
}

function assertReplayBundleReplayable(bundle: CaseReplayBundle): void {
  if (!["frozen", "published"].includes(bundle.bundleState)) {
    throw new EvaluationPlaneError("EVAL_REPLAY_BUNDLE_NOT_FROZEN", "Replay requires a frozen or published bundle.");
  }
  validateReplayBundleInputs({
    ...bundle,
    mutableInputRefs: [],
  });
}

function deriveExportBlockingReasons(
  command: GenerateEvaluationExportArtifactCommand,
  exportFormat: string,
): readonly string[] {
  const reasons: string[] = [];
  if (command.containsRawPhi) {
    reasons.push("raw_phi_export_forbidden");
  }
  if (exportFormat === "csv_phi") {
    reasons.push("phi_csv_export_forbidden");
  }
  if (exportFormat === "raw_replay_dump") {
    reasons.push("raw_replay_dump_forbidden");
  }
  if (command.directStorageUrl) {
    reasons.push("direct_storage_url_forbidden");
  }
  if (command.requestedArtifactState === "external_handoff_ready" && !command.outboundNavigationGrantPolicyRef) {
    reasons.push("outbound_navigation_grant_required");
  }
  return reasons;
}

function deriveBindingBlockingReasons(
  command: ResolveAssistiveEvaluationSurfaceBindingCommand,
  requiredTrustRefs: readonly string[],
): readonly string[] {
  const reasons: string[] = [];
  if (command.publicationState === "withdrawn" || command.publicationState === "blocked") {
    reasons.push("surface_publication_blocked");
  }
  if (["suspended", "revoked", "blocked"].includes(command.runtimeState ?? "")) {
    reasons.push("runtime_publication_blocked");
  }
  if (command.recoveryState === "hard_block" || command.recoveryState === "rollback_only") {
    reasons.push("release_recovery_blocks_surface");
  }
  if (!command.telemetryDisclosureFenceRef) {
    reasons.push("telemetry_disclosure_fence_missing");
  }
  if (command.trustState === "quarantined") {
    reasons.push("trust_quarantined");
  }
  if (requiredTrustRefs.some((ref) => isMutableRef(ref))) {
    reasons.push("mutable_trust_ref");
  }
  return reasons;
}

function deriveBindingState(
  command: ResolveAssistiveEvaluationSurfaceBindingCommand,
  requiredTrustRefs: readonly string[],
  blockingReasonCodes: readonly string[],
): AssistiveEvaluationSurfaceBindingState {
  if (blockingReasonCodes.length > 0) {
    return "blocked";
  }
  if (
    !command.surfaceRouteContractRef ||
    !command.surfacePublicationRef ||
    !command.runtimePublicationBundleRef ||
    !command.releaseRecoveryDispositionRef ||
    requiredTrustRefs.length === 0
  ) {
    return "observe_only";
  }
  if (command.publicationState === "stale" || command.runtimeState === "stale") {
    return "observe_only";
  }
  if (command.recoveryState === "recovery_only") {
    return "recovery_only";
  }
  if (["degraded", "shadow_only", "frozen", "unknown"].includes(command.trustState ?? "unknown")) {
    return "observe_only";
  }
  return "live";
}
