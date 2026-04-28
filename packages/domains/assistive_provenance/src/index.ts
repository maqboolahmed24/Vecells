import { createHash } from "node:crypto";

export type ISODateString = string;

export type AssistiveProvenanceActorRole =
  | "prompt_registry"
  | "prompt_snapshot_store"
  | "inference_logger"
  | "provenance_writer"
  | "replay_manifest_assembler"
  | "feedback_eligibility_materializer"
  | "trainability_revocation_service"
  | "provenance_export_guard"
  | "clinical_safety_lead"
  | "system";

export type PromptPackageState = "draft" | "active" | "superseded" | "revoked";
export type PromptSnapshotState = "current" | "superseded" | "revoked";
export type MaskingClass = "minimum_necessary" | "redacted" | "pseudonymised" | "internal_only";
export type DisclosureClass = "summary_safe" | "clinical_internal" | "replay_restricted";
export type ReplayabilityState = "replayable" | "degraded" | "blocked";
export type ProvenanceFreshnessState = "current" | "aging" | "stale" | "invalidated";
export type TrustState = "trusted" | "degraded" | "quarantined" | "unknown";
export type ContinuityValidationState = "trusted" | "degraded" | "stale" | "blocked";
export type ReplayManifestState = "assembled" | "blocked" | "superseded";
export type FeedbackEligibilityState =
  | "pending_settlement"
  | "requires_adjudication"
  | "eligible"
  | "excluded"
  | "revoked";
export type LabelQualityState = "pending" | "routine_clean" | "adjudicated" | "excluded";
export type CounterfactualCompletenessState = "complete" | "partial" | "absent" | "not_applicable";
export type TrainabilityRevocationReason =
  | "incident_linked"
  | "final_artifact_superseded"
  | "adjudication_outcome"
  | "exclusion_decision"
  | "provenance_invalidated";
export type ExportAudience = "same_shell_ui" | "assurance" | "safety" | "external_handoff";
export type ExportLayer = "compact_footer" | "bounded_explainer" | "full_replay";
export type ExportDecisionState = "allowed" | "blocked" | "redacted_summary_only";

export const ASSISTIVE_PROVENANCE_INVARIANT_MARKERS = {
  prompt_snapshot_immutable: "prompt_snapshot_immutable",
  prompt_snapshot_binds_release_or_watch_tuple: "prompt_snapshot_binds_release_or_watch_tuple",
  inference_log_refs_hashes_only: "inference_log_refs_hashes_only",
  replay_critical_raw_content_protected_artifact: "replay_critical_raw_content_protected_artifact",
  provenance_envelope_one_per_artifact_revision: "provenance_envelope_one_per_artifact_revision",
  feedback_eligibility_settlement_backed: "feedback_eligibility_settlement_backed",
  trainability_revocation_appends_not_mutates: "trainability_revocation_appends_not_mutates",
  replay_manifest_pins_model_prompt_evidence_policy_runtime:
    "replay_manifest_pins_model_prompt_evidence_policy_runtime",
  missing_provenance_fail_closed: "missing_provenance_fail_closed",
  provenance_export_guard_blocks_raw_content: "provenance_export_guard_blocks_raw_content",
  no_routine_prompt_fragment_telemetry: "no_routine_prompt_fragment_telemetry",
} as const;

export interface AssistiveProvenanceActorContext {
  actorRef: string;
  actorRole: AssistiveProvenanceActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface AssistiveProvenanceAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: AssistiveProvenanceActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface AssistivePromptPackage {
  promptPackageId: string;
  capabilityCode: string;
  promptPackageRef: string;
  promptBundleHash: string;
  releaseCandidateRef?: string;
  watchTupleHash?: string;
  variableSchemaRef: string;
  variableSchemaHash: string;
  maskingClass: MaskingClass;
  disclosureClass: DisclosureClass;
  storageArtifactRef: string;
  packageState: PromptPackageState;
  canonicalHash: string;
  createdAt: ISODateString;
}

export interface AssistivePromptSnapshot {
  promptSnapshotId: string;
  capabilityCode: string;
  promptPackageRef: string;
  releaseCandidateRef?: string;
  watchTupleHash?: string;
  maskingClass: MaskingClass;
  disclosureClass: DisclosureClass;
  variableSchemaRef: string;
  variableSchemaHash: string;
  renderedPromptArtifactRef?: string;
  protectedPromptArtifactRef?: string;
  canonicalHash: string;
  snapshotState: PromptSnapshotState;
  createdAt: ISODateString;
}

export interface AssistiveInferenceLog {
  assistiveInferenceLogId: string;
  assistiveRunRef: string;
  capabilityCode: string;
  modelVersionRef: string;
  promptSnapshotRef: string;
  inputEvidenceSnapshotRefs: readonly string[];
  inputEvidenceSnapshotHash: string;
  inputCaptureBundleRef: string;
  inputDerivationPackageRefs: readonly string[];
  policyBundleRef: string;
  outputSchemaBundleRef: string;
  calibrationBundleRef: string;
  runtimeImageRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  outputArtifactRefs: readonly string[];
  assistiveRunSettlementRef: string;
  feedbackChainRef?: string;
  protectedInputArtifactRefs: readonly string[];
  logHash: string;
  replayabilityState: ReplayabilityState;
  recordedAt: ISODateString;
}

export interface AssistiveProvenanceEnvelope {
  provenanceEnvelopeId: string;
  artifactRef: string;
  artifactRevisionRef: string;
  capabilityCode: string;
  assistiveInferenceLogRef: string;
  inputEvidenceSnapshotRef: string;
  inputEvidenceSnapshotHash: string;
  inputCaptureBundleRef: string;
  inputDerivationPackageRefs: readonly string[];
  modelVersionRef: string;
  promptSnapshotRef: string;
  outputSchemaBundleRef: string;
  calibrationBundleRef: string;
  policyBundleRef: string;
  runtimeImageRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  feedbackChainRef?: string;
  finalHumanArtifactRef?: string;
  authoritativeWorkflowSettlementRef?: string;
  freshnessState: ProvenanceFreshnessState;
  trustState: TrustState;
  continuityValidationState: ContinuityValidationState;
  maskingClass: MaskingClass;
  disclosureClass: DisclosureClass;
  replayabilityState: ReplayabilityState;
  envelopeHash: string;
  createdAt: ISODateString;
}

export interface AssistiveReplayManifest {
  replayManifestId: string;
  provenanceEnvelopeRef: string;
  assistiveInferenceLogRef: string;
  modelVersionRef: string;
  promptSnapshotRef: string;
  inputEvidenceSnapshotRefs: readonly string[];
  inputEvidenceSnapshotHash: string;
  inputCaptureBundleRef: string;
  inputDerivationPackageRefs: readonly string[];
  outputSchemaBundleRef: string;
  calibrationBundleRef: string;
  policyBundleRef: string;
  runtimeImageRef: string;
  runtimePublicationBundleRef: string;
  releaseCandidateRef?: string;
  watchTupleHash?: string;
  replayHarnessVersionRef: string;
  protectedArtifactRefs: readonly string[];
  manifestHash: string;
  manifestState: ReplayManifestState;
  assembledAt: ISODateString;
}

export interface FeedbackEligibilityFlag {
  feedbackFlagId: string;
  assistiveFeedbackChainRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  overrideRecordId?: string;
  finalHumanArtifactRef?: string;
  authoritativeWorkflowSettlementRef?: string;
  provenanceEnvelopeRef: string;
  eligibleForTraining: boolean;
  eligibilityState: FeedbackEligibilityState;
  exclusionReason?: string;
  requiresAdjudication: boolean;
  adjudicationCaseRef?: string;
  latestIncidentLinkRef?: string;
  labelQualityState: LabelQualityState;
  counterfactualCompletenessState: CounterfactualCompletenessState;
  supersedesFeedbackFlagRef?: string;
  evaluatedAt: ISODateString;
  revokedAt?: ISODateString;
}

export interface TrainabilityRevocationRecord {
  revocationRecordId: string;
  previousFeedbackFlagRef: string;
  replacementFeedbackFlagRef: string;
  assistiveFeedbackChainRef: string;
  revocationReason: TrainabilityRevocationReason;
  evidenceRef: string;
  incidentLinkRef?: string;
  adjudicationCaseRef?: string;
  recordedAt: ISODateString;
}

export interface AssistiveProvenanceExportDecision {
  exportDecisionId: string;
  provenanceEnvelopeRef: string;
  replayManifestRef?: string;
  exportAudience: ExportAudience;
  requestedLayer: ExportLayer;
  outboundNavigationGrantRef?: string;
  artifactPresentationContractRef: string;
  decisionState: ExportDecisionState;
  allowedArtifactRefs: readonly string[];
  blockingReasonCodes: readonly string[];
  decidedAt: ISODateString;
}

export interface AssistiveProvenanceStore {
  promptPackages: Map<string, AssistivePromptPackage>;
  promptSnapshots: Map<string, AssistivePromptSnapshot>;
  inferenceLogs: Map<string, AssistiveInferenceLog>;
  provenanceEnvelopes: Map<string, AssistiveProvenanceEnvelope>;
  replayManifests: Map<string, AssistiveReplayManifest>;
  feedbackEligibilityFlags: Map<string, FeedbackEligibilityFlag>;
  revocationRecords: Map<string, TrainabilityRevocationRecord>;
  exportDecisions: Map<string, AssistiveProvenanceExportDecision>;
  auditRecords: AssistiveProvenanceAuditRecord[];
  idempotencyKeys: Map<string, string>;
  provenanceEnvelopeByArtifactRevision: Map<string, string>;
  currentFeedbackFlagByChain: Map<string, string>;
}

export interface AssistiveProvenanceClock {
  now(): ISODateString;
}

export interface AssistiveProvenanceIdGenerator {
  next(prefix: string): string;
}

export interface AssistiveProvenanceRuntime {
  store: AssistiveProvenanceStore;
  clock: AssistiveProvenanceClock;
  idGenerator: AssistiveProvenanceIdGenerator;
}

export interface RegisterPromptPackageCommand {
  promptPackageId?: string;
  capabilityCode: string;
  promptPackageRef: string;
  promptBundleHash: string;
  releaseCandidateRef?: string;
  watchTupleHash?: string;
  variableSchemaRef: string;
  variableSchemaHash: string;
  maskingClass: MaskingClass;
  disclosureClass: DisclosureClass;
  storageArtifactRef: string;
  packageState?: PromptPackageState;
  idempotencyKey?: string;
}

export interface StorePromptSnapshotCommand {
  promptSnapshotId?: string;
  capabilityCode: string;
  promptPackageRef: string;
  releaseCandidateRef?: string;
  watchTupleHash?: string;
  maskingClass: MaskingClass;
  disclosureClass: DisclosureClass;
  variableSchemaRef: string;
  variableSchemaHash: string;
  renderedPromptArtifactRef?: string;
  protectedPromptArtifactRef?: string;
  idempotencyKey?: string;
}

export interface RecordInferenceLogCommand {
  assistiveInferenceLogId?: string;
  assistiveRunRef: string;
  capabilityCode: string;
  modelVersionRef: string;
  promptSnapshotRef: string;
  inputEvidenceSnapshotRefs: readonly string[];
  inputEvidenceSnapshotHash: string;
  inputCaptureBundleRef: string;
  inputDerivationPackageRefs: readonly string[];
  policyBundleRef: string;
  outputSchemaBundleRef: string;
  calibrationBundleRef: string;
  runtimeImageRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  outputArtifactRefs: readonly string[];
  assistiveRunSettlementRef: string;
  feedbackChainRef?: string;
  protectedInputArtifactRefs?: readonly string[];
  idempotencyKey?: string;
}

export interface WriteProvenanceEnvelopeCommand {
  provenanceEnvelopeId?: string;
  artifactRef: string;
  artifactRevisionRef: string;
  capabilityCode: string;
  assistiveInferenceLogRef: string;
  feedbackChainRef?: string;
  finalHumanArtifactRef?: string;
  authoritativeWorkflowSettlementRef?: string;
  freshnessState?: ProvenanceFreshnessState;
  trustState: TrustState;
  continuityValidationState: ContinuityValidationState;
  maskingClass: MaskingClass;
  disclosureClass: DisclosureClass;
  idempotencyKey?: string;
}

export interface AssembleReplayManifestCommand {
  replayManifestId?: string;
  provenanceEnvelopeRef: string;
  replayHarnessVersionRef: string;
  releaseCandidateRef?: string;
  watchTupleHash?: string;
  idempotencyKey?: string;
}

export interface MaterializeFeedbackEligibilityCommand {
  feedbackFlagId?: string;
  assistiveFeedbackChainRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  overrideRecordId?: string;
  finalHumanArtifactRef?: string;
  authoritativeWorkflowSettlementRef?: string;
  provenanceEnvelopeRef: string;
  workflowSettlementState?: "pending" | "settled" | "superseded" | "incident_held" | "excluded";
  chainState:
    | "in_review"
    | "approval_pending"
    | "settled_clean"
    | "adjudication_pending"
    | "excluded"
    | "revoked"
    | "superseded";
  incidentLinkRefs?: readonly string[];
  highSeverityCase?: boolean;
  dualReviewCase?: boolean;
  policyExceptionOverride?: boolean;
  regenerateOnlyFlow?: boolean;
  dismissedSuggestion?: boolean;
  staleRecoveryAction?: boolean;
  exclusionReason?: string;
  adjudicationCaseRef?: string;
  labelQualityState: LabelQualityState;
  counterfactualCompletenessState: CounterfactualCompletenessState;
  idempotencyKey?: string;
}

export interface RevokeTrainabilityCommand {
  previousFeedbackFlagRef: string;
  revocationReason: TrainabilityRevocationReason;
  evidenceRef: string;
  incidentLinkRef?: string;
  adjudicationCaseRef?: string;
  idempotencyKey?: string;
}

export interface GuardProvenanceExportCommand {
  exportDecisionId?: string;
  provenanceEnvelopeRef: string;
  replayManifestRef?: string;
  exportAudience: ExportAudience;
  requestedLayer: ExportLayer;
  outboundNavigationGrantRef?: string;
  artifactPresentationContractRef: string;
  allowRawPromptOrEvidenceContent?: boolean;
  idempotencyKey?: string;
}

export class AssistivePromptPackageRegistry {
  public constructor(private readonly runtime: AssistiveProvenanceRuntime) {}

  public registerPromptPackage(
    command: RegisterPromptPackageCommand,
    actor: AssistiveProvenanceActorContext,
  ): AssistivePromptPackage {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.promptPackages,
      () => {
        assertReleaseOrWatchTuple(command.releaseCandidateRef, command.watchTupleHash);
        requireNonEmpty(command.promptBundleHash, "promptBundleHash");
        requireNonEmpty(command.variableSchemaHash, "variableSchemaHash");
        const canonicalHash = stableAssistiveProvenanceHash({
          capabilityCode: command.capabilityCode,
          promptPackageRef: command.promptPackageRef,
          promptBundleHash: command.promptBundleHash,
          releaseCandidateRef: command.releaseCandidateRef,
          watchTupleHash: command.watchTupleHash,
          variableSchemaHash: command.variableSchemaHash,
          maskingClass: command.maskingClass,
          disclosureClass: command.disclosureClass,
        });
        const promptPackage: AssistivePromptPackage = {
          promptPackageId: command.promptPackageId ?? `assistive-prompt-package:${canonicalHash}`,
          capabilityCode: command.capabilityCode,
          promptPackageRef: command.promptPackageRef,
          promptBundleHash: command.promptBundleHash,
          releaseCandidateRef: command.releaseCandidateRef,
          watchTupleHash: command.watchTupleHash,
          variableSchemaRef: command.variableSchemaRef,
          variableSchemaHash: command.variableSchemaHash,
          maskingClass: command.maskingClass,
          disclosureClass: command.disclosureClass,
          storageArtifactRef: command.storageArtifactRef,
          packageState: command.packageState ?? "active",
          canonicalHash,
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.promptPackages.set(promptPackage.promptPackageId, promptPackage);
        recordAudit(
          this.runtime,
          "AssistivePromptPackageRegistry",
          "registerPromptPackage",
          actor,
          promptPackage.promptPackageId,
          "accepted",
          [ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.prompt_snapshot_binds_release_or_watch_tuple],
        );
        return promptPackage;
      },
    );
  }
}

export class AssistivePromptSnapshotStore {
  public constructor(private readonly runtime: AssistiveProvenanceRuntime) {}

  public storePromptSnapshot(
    command: StorePromptSnapshotCommand,
    actor: AssistiveProvenanceActorContext,
  ): AssistivePromptSnapshot {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.promptSnapshots,
      () => {
        assertReleaseOrWatchTuple(command.releaseCandidateRef, command.watchTupleHash);
        requireNonEmpty(command.variableSchemaHash, "variableSchemaHash");
        const promptPackage = requirePromptPackage(this.runtime, command.promptPackageRef);
        if (promptPackage.capabilityCode !== command.capabilityCode) {
          throw new Error("Prompt snapshot capability must match prompt package.");
        }
        const canonicalHash = stableAssistiveProvenanceHash({
          capabilityCode: command.capabilityCode,
          promptPackageRef: command.promptPackageRef,
          releaseCandidateRef: command.releaseCandidateRef,
          watchTupleHash: command.watchTupleHash,
          maskingClass: command.maskingClass,
          disclosureClass: command.disclosureClass,
          variableSchemaRef: command.variableSchemaRef,
          variableSchemaHash: command.variableSchemaHash,
          renderedPromptArtifactRef: command.renderedPromptArtifactRef,
          protectedPromptArtifactRef: command.protectedPromptArtifactRef,
        });
        const promptSnapshotId =
          command.promptSnapshotId ?? `assistive-prompt-snapshot:${canonicalHash}`;
        const existing = this.runtime.store.promptSnapshots.get(promptSnapshotId);
        if (existing && existing.canonicalHash !== canonicalHash) {
          throw new Error(
            `${ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.prompt_snapshot_immutable}: ${promptSnapshotId}`,
          );
        }
        const snapshot: AssistivePromptSnapshot = {
          promptSnapshotId,
          capabilityCode: command.capabilityCode,
          promptPackageRef: command.promptPackageRef,
          releaseCandidateRef: command.releaseCandidateRef,
          watchTupleHash: command.watchTupleHash,
          maskingClass: command.maskingClass,
          disclosureClass: command.disclosureClass,
          variableSchemaRef: command.variableSchemaRef,
          variableSchemaHash: command.variableSchemaHash,
          renderedPromptArtifactRef: command.renderedPromptArtifactRef,
          protectedPromptArtifactRef: command.protectedPromptArtifactRef,
          canonicalHash,
          snapshotState: "current",
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.promptSnapshots.set(snapshot.promptSnapshotId, snapshot);
        recordAudit(
          this.runtime,
          "AssistivePromptSnapshotStore",
          "storePromptSnapshot",
          actor,
          snapshot.promptSnapshotId,
          "accepted",
          [
            ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.prompt_snapshot_immutable,
            ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.no_routine_prompt_fragment_telemetry,
          ],
        );
        return snapshot;
      },
    );
  }
}

export class AssistiveInferenceLogService {
  public constructor(private readonly runtime: AssistiveProvenanceRuntime) {}

  public recordInferenceLog(
    command: RecordInferenceLogCommand,
    actor: AssistiveProvenanceActorContext,
  ): AssistiveInferenceLog {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.inferenceLogs,
      () => {
        requirePromptSnapshot(this.runtime, command.promptSnapshotRef);
        const missingReasons = inferenceLogMissingReasons(command);
        if (missingReasons.length > 0) {
          recordAudit(
            this.runtime,
            "AssistiveInferenceLogService",
            "recordInferenceLog",
            actor,
            command.assistiveRunRef,
            "failed_closed",
            missingReasons,
          );
          throw new Error(
            `${ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.missing_provenance_fail_closed}: ${missingReasons.join(",")}`,
          );
        }
        const protectedInputArtifactRefs = [...(command.protectedInputArtifactRefs ?? [])];
        const logHash = stableAssistiveProvenanceHash({
          assistiveRunRef: command.assistiveRunRef,
          capabilityCode: command.capabilityCode,
          modelVersionRef: command.modelVersionRef,
          promptSnapshotRef: command.promptSnapshotRef,
          inputEvidenceSnapshotRefs: command.inputEvidenceSnapshotRefs,
          inputEvidenceSnapshotHash: command.inputEvidenceSnapshotHash,
          inputDerivationPackageRefs: command.inputDerivationPackageRefs,
          policyBundleRef: command.policyBundleRef,
          outputSchemaBundleRef: command.outputSchemaBundleRef,
          calibrationBundleRef: command.calibrationBundleRef,
          runtimeImageRef: command.runtimeImageRef,
          outputArtifactRefs: command.outputArtifactRefs,
          assistiveRunSettlementRef: command.assistiveRunSettlementRef,
        });
        const log: AssistiveInferenceLog = {
          assistiveInferenceLogId:
            command.assistiveInferenceLogId ?? `assistive-inference-log:${logHash}`,
          assistiveRunRef: command.assistiveRunRef,
          capabilityCode: command.capabilityCode,
          modelVersionRef: command.modelVersionRef,
          promptSnapshotRef: command.promptSnapshotRef,
          inputEvidenceSnapshotRefs: [...command.inputEvidenceSnapshotRefs],
          inputEvidenceSnapshotHash: command.inputEvidenceSnapshotHash,
          inputCaptureBundleRef: command.inputCaptureBundleRef,
          inputDerivationPackageRefs: [...command.inputDerivationPackageRefs],
          policyBundleRef: command.policyBundleRef,
          outputSchemaBundleRef: command.outputSchemaBundleRef,
          calibrationBundleRef: command.calibrationBundleRef,
          runtimeImageRef: command.runtimeImageRef,
          surfacePublicationRef: command.surfacePublicationRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          outputArtifactRefs: [...command.outputArtifactRefs],
          assistiveRunSettlementRef: command.assistiveRunSettlementRef,
          feedbackChainRef: command.feedbackChainRef,
          protectedInputArtifactRefs,
          logHash,
          replayabilityState: "replayable",
          recordedAt: this.runtime.clock.now(),
        };
        this.runtime.store.inferenceLogs.set(log.assistiveInferenceLogId, log);
        recordAudit(
          this.runtime,
          "AssistiveInferenceLogService",
          "recordInferenceLog",
          actor,
          log.assistiveInferenceLogId,
          "accepted",
          [
            ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.inference_log_refs_hashes_only,
            ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.replay_critical_raw_content_protected_artifact,
          ],
        );
        return log;
      },
    );
  }
}

export class AssistiveProvenanceEnvelopeWriter {
  public constructor(private readonly runtime: AssistiveProvenanceRuntime) {}

  public writeProvenanceEnvelope(
    command: WriteProvenanceEnvelopeCommand,
    actor: AssistiveProvenanceActorContext,
  ): AssistiveProvenanceEnvelope {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.provenanceEnvelopes,
      () => {
        const artifactTupleHash = stableAssistiveProvenanceHash({
          artifactRef: command.artifactRef,
          artifactRevisionRef: command.artifactRevisionRef,
        });
        const existingEnvelopeRef =
          this.runtime.store.provenanceEnvelopeByArtifactRevision.get(artifactTupleHash);
        if (existingEnvelopeRef) {
          return requireProvenanceEnvelope(this.runtime, existingEnvelopeRef);
        }
        const log = requireInferenceLog(this.runtime, command.assistiveInferenceLogRef);
        if (log.replayabilityState !== "replayable") {
          throw new Error(
            `${ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.missing_provenance_fail_closed}: inference log is not replayable`,
          );
        }
        const envelopeHash = stableAssistiveProvenanceHash({
          artifactRef: command.artifactRef,
          artifactRevisionRef: command.artifactRevisionRef,
          assistiveInferenceLogRef: command.assistiveInferenceLogRef,
          modelVersionRef: log.modelVersionRef,
          promptSnapshotRef: log.promptSnapshotRef,
          inputEvidenceSnapshotHash: log.inputEvidenceSnapshotHash,
          policyBundleRef: log.policyBundleRef,
          outputSchemaBundleRef: log.outputSchemaBundleRef,
          calibrationBundleRef: log.calibrationBundleRef,
          runtimeImageRef: log.runtimeImageRef,
        });
        const envelope: AssistiveProvenanceEnvelope = {
          provenanceEnvelopeId:
            command.provenanceEnvelopeId ?? `assistive-provenance-envelope:${envelopeHash}`,
          artifactRef: command.artifactRef,
          artifactRevisionRef: command.artifactRevisionRef,
          capabilityCode: command.capabilityCode,
          assistiveInferenceLogRef: command.assistiveInferenceLogRef,
          inputEvidenceSnapshotRef: log.inputEvidenceSnapshotRefs[0] ?? "",
          inputEvidenceSnapshotHash: log.inputEvidenceSnapshotHash,
          inputCaptureBundleRef: log.inputCaptureBundleRef,
          inputDerivationPackageRefs: [...log.inputDerivationPackageRefs],
          modelVersionRef: log.modelVersionRef,
          promptSnapshotRef: log.promptSnapshotRef,
          outputSchemaBundleRef: log.outputSchemaBundleRef,
          calibrationBundleRef: log.calibrationBundleRef,
          policyBundleRef: log.policyBundleRef,
          runtimeImageRef: log.runtimeImageRef,
          surfacePublicationRef: log.surfacePublicationRef,
          runtimePublicationBundleRef: log.runtimePublicationBundleRef,
          feedbackChainRef: command.feedbackChainRef ?? log.feedbackChainRef,
          finalHumanArtifactRef: command.finalHumanArtifactRef,
          authoritativeWorkflowSettlementRef: command.authoritativeWorkflowSettlementRef,
          freshnessState: command.freshnessState ?? "current",
          trustState: command.trustState,
          continuityValidationState: command.continuityValidationState,
          maskingClass: command.maskingClass,
          disclosureClass: command.disclosureClass,
          replayabilityState: log.replayabilityState,
          envelopeHash,
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.provenanceEnvelopes.set(envelope.provenanceEnvelopeId, envelope);
        this.runtime.store.provenanceEnvelopeByArtifactRevision.set(
          artifactTupleHash,
          envelope.provenanceEnvelopeId,
        );
        recordAudit(
          this.runtime,
          "AssistiveProvenanceEnvelopeWriter",
          "writeProvenanceEnvelope",
          actor,
          envelope.provenanceEnvelopeId,
          "accepted",
          [ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.provenance_envelope_one_per_artifact_revision],
        );
        return envelope;
      },
    );
  }
}

export class AssistiveReplayManifestAssembler {
  public constructor(private readonly runtime: AssistiveProvenanceRuntime) {}

  public assembleReplayManifest(
    command: AssembleReplayManifestCommand,
    actor: AssistiveProvenanceActorContext,
  ): AssistiveReplayManifest {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.replayManifests,
      () => {
        const envelope = requireProvenanceEnvelope(this.runtime, command.provenanceEnvelopeRef);
        const log = requireInferenceLog(this.runtime, envelope.assistiveInferenceLogRef);
        const promptSnapshot = requirePromptSnapshot(this.runtime, envelope.promptSnapshotRef);
        const protectedArtifactRefs = unique(
          [
            ...log.protectedInputArtifactRefs,
            promptSnapshot.protectedPromptArtifactRef,
            promptSnapshot.renderedPromptArtifactRef,
          ].filter(isString),
        );
        const blockingReasons =
          envelope.replayabilityState === "replayable" ? [] : ["provenance_not_replayable"];
        const manifestHash = stableAssistiveProvenanceHash({
          provenanceEnvelopeRef: command.provenanceEnvelopeRef,
          modelVersionRef: envelope.modelVersionRef,
          promptSnapshotRef: envelope.promptSnapshotRef,
          inputEvidenceSnapshotHash: envelope.inputEvidenceSnapshotHash,
          outputSchemaBundleRef: envelope.outputSchemaBundleRef,
          calibrationBundleRef: envelope.calibrationBundleRef,
          policyBundleRef: envelope.policyBundleRef,
          runtimeImageRef: envelope.runtimeImageRef,
          replayHarnessVersionRef: command.replayHarnessVersionRef,
          protectedArtifactRefs,
        });
        const manifest: AssistiveReplayManifest = {
          replayManifestId: command.replayManifestId ?? `assistive-replay-manifest:${manifestHash}`,
          provenanceEnvelopeRef: envelope.provenanceEnvelopeId,
          assistiveInferenceLogRef: envelope.assistiveInferenceLogRef,
          modelVersionRef: envelope.modelVersionRef,
          promptSnapshotRef: envelope.promptSnapshotRef,
          inputEvidenceSnapshotRefs: [...log.inputEvidenceSnapshotRefs],
          inputEvidenceSnapshotHash: envelope.inputEvidenceSnapshotHash,
          inputCaptureBundleRef: envelope.inputCaptureBundleRef,
          inputDerivationPackageRefs: [...envelope.inputDerivationPackageRefs],
          outputSchemaBundleRef: envelope.outputSchemaBundleRef,
          calibrationBundleRef: envelope.calibrationBundleRef,
          policyBundleRef: envelope.policyBundleRef,
          runtimeImageRef: envelope.runtimeImageRef,
          runtimePublicationBundleRef: envelope.runtimePublicationBundleRef,
          releaseCandidateRef: command.releaseCandidateRef ?? promptSnapshot.releaseCandidateRef,
          watchTupleHash: command.watchTupleHash ?? promptSnapshot.watchTupleHash,
          replayHarnessVersionRef: command.replayHarnessVersionRef,
          protectedArtifactRefs,
          manifestHash,
          manifestState: blockingReasons.length === 0 ? "assembled" : "blocked",
          assembledAt: this.runtime.clock.now(),
        };
        this.runtime.store.replayManifests.set(manifest.replayManifestId, manifest);
        recordAudit(
          this.runtime,
          "AssistiveReplayManifestAssembler",
          "assembleReplayManifest",
          actor,
          manifest.replayManifestId,
          manifest.manifestState === "assembled" ? "accepted" : "failed_closed",
          [
            ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.replay_manifest_pins_model_prompt_evidence_policy_runtime,
            ...blockingReasons,
          ],
        );
        return manifest;
      },
    );
  }
}

export class FeedbackEligibilityMaterializer {
  public constructor(private readonly runtime: AssistiveProvenanceRuntime) {}

  public materializeFeedbackEligibility(
    command: MaterializeFeedbackEligibilityCommand,
    actor: AssistiveProvenanceActorContext,
  ): FeedbackEligibilityFlag {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.feedbackEligibilityFlags,
      () => {
        requireProvenanceEnvelope(this.runtime, command.provenanceEnvelopeRef);
        const latestIncidentLinkRef = command.incidentLinkRefs?.[0];
        const eligibility = resolveFeedbackEligibility(command);
        const flagHash = stableAssistiveProvenanceHash({
          assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
          provenanceEnvelopeRef: command.provenanceEnvelopeRef,
          eligibilityState: eligibility.eligibilityState,
          latestIncidentLinkRef,
          exclusionReason: eligibility.exclusionReason,
          labelQualityState: command.labelQualityState,
          counterfactualCompletenessState: command.counterfactualCompletenessState,
        });
        const flag: FeedbackEligibilityFlag = {
          feedbackFlagId: command.feedbackFlagId ?? `feedback-eligibility-flag:${flagHash}`,
          assistiveFeedbackChainRef: command.assistiveFeedbackChainRef,
          assistiveCapabilityTrustEnvelopeRef: command.assistiveCapabilityTrustEnvelopeRef,
          overrideRecordId: command.overrideRecordId,
          finalHumanArtifactRef: command.finalHumanArtifactRef,
          authoritativeWorkflowSettlementRef: command.authoritativeWorkflowSettlementRef,
          provenanceEnvelopeRef: command.provenanceEnvelopeRef,
          eligibleForTraining: eligibility.eligibleForTraining,
          eligibilityState: eligibility.eligibilityState,
          exclusionReason: eligibility.exclusionReason,
          requiresAdjudication: eligibility.requiresAdjudication,
          adjudicationCaseRef: command.adjudicationCaseRef,
          latestIncidentLinkRef,
          labelQualityState: command.labelQualityState,
          counterfactualCompletenessState: command.counterfactualCompletenessState,
          evaluatedAt: this.runtime.clock.now(),
        };
        this.runtime.store.feedbackEligibilityFlags.set(flag.feedbackFlagId, flag);
        this.runtime.store.currentFeedbackFlagByChain.set(
          flag.assistiveFeedbackChainRef,
          flag.feedbackFlagId,
        );
        recordAudit(
          this.runtime,
          "FeedbackEligibilityMaterializer",
          "materializeFeedbackEligibility",
          actor,
          flag.feedbackFlagId,
          flag.eligibleForTraining ? "accepted" : "blocked",
          [
            ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.feedback_eligibility_settlement_backed,
            flag.eligibilityState,
          ],
        );
        return flag;
      },
    );
  }
}

export class TrainabilityRevocationService {
  public constructor(private readonly runtime: AssistiveProvenanceRuntime) {}

  public revokeTrainability(
    command: RevokeTrainabilityCommand,
    actor: AssistiveProvenanceActorContext,
  ): {
    revocationRecord: TrainabilityRevocationRecord;
    replacementFlag: FeedbackEligibilityFlag;
  } {
    if (command.idempotencyKey) {
      const existingRevocationRef = this.runtime.store.idempotencyKeys.get(command.idempotencyKey);
      if (existingRevocationRef) {
        const existingRevocation = this.runtime.store.revocationRecords.get(existingRevocationRef);
        if (existingRevocation) {
          return {
            revocationRecord: existingRevocation,
            replacementFlag: requireFeedbackEligibilityFlag(
              this.runtime,
              existingRevocation.replacementFeedbackFlagRef,
            ),
          };
        }
      }
    }

    const previousFlag = requireFeedbackEligibilityFlag(
      this.runtime,
      command.previousFeedbackFlagRef,
    );
    const replacementFlagHash = stableAssistiveProvenanceHash({
      previousFeedbackFlagRef: previousFlag.feedbackFlagId,
      assistiveFeedbackChainRef: previousFlag.assistiveFeedbackChainRef,
      revocationReason: command.revocationReason,
      evidenceRef: command.evidenceRef,
    });
    const replacementFlag: FeedbackEligibilityFlag = {
      ...previousFlag,
      feedbackFlagId: `feedback-eligibility-flag:revoked:${replacementFlagHash}`,
      eligibleForTraining: false,
      eligibilityState: "revoked",
      exclusionReason: command.revocationReason,
      requiresAdjudication: false,
      adjudicationCaseRef: command.adjudicationCaseRef ?? previousFlag.adjudicationCaseRef,
      latestIncidentLinkRef: command.incidentLinkRef ?? previousFlag.latestIncidentLinkRef,
      supersedesFeedbackFlagRef: previousFlag.feedbackFlagId,
      evaluatedAt: this.runtime.clock.now(),
      revokedAt: this.runtime.clock.now(),
    };
    const revocationRecord: TrainabilityRevocationRecord = {
      revocationRecordId: `trainability-revocation:${stableAssistiveProvenanceHash({
        previousFeedbackFlagRef: previousFlag.feedbackFlagId,
        replacementFeedbackFlagRef: replacementFlag.feedbackFlagId,
        revocationReason: command.revocationReason,
        evidenceRef: command.evidenceRef,
      })}`,
      previousFeedbackFlagRef: previousFlag.feedbackFlagId,
      replacementFeedbackFlagRef: replacementFlag.feedbackFlagId,
      assistiveFeedbackChainRef: previousFlag.assistiveFeedbackChainRef,
      revocationReason: command.revocationReason,
      evidenceRef: command.evidenceRef,
      incidentLinkRef: command.incidentLinkRef,
      adjudicationCaseRef: command.adjudicationCaseRef,
      recordedAt: this.runtime.clock.now(),
    };
    this.runtime.store.feedbackEligibilityFlags.set(
      replacementFlag.feedbackFlagId,
      replacementFlag,
    );
    this.runtime.store.revocationRecords.set(revocationRecord.revocationRecordId, revocationRecord);
    if (command.idempotencyKey) {
      this.runtime.store.idempotencyKeys.set(
        command.idempotencyKey,
        revocationRecord.revocationRecordId,
      );
    }
    this.runtime.store.currentFeedbackFlagByChain.set(
      replacementFlag.assistiveFeedbackChainRef,
      replacementFlag.feedbackFlagId,
    );
    recordAudit(
      this.runtime,
      "TrainabilityRevocationService",
      "revokeTrainability",
      actor,
      revocationRecord.revocationRecordId,
      "accepted",
      [ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.trainability_revocation_appends_not_mutates],
    );
    return { revocationRecord, replacementFlag };
  }
}

export class AssistiveProvenanceExportGuard {
  public constructor(private readonly runtime: AssistiveProvenanceRuntime) {}

  public guardExport(
    command: GuardProvenanceExportCommand,
    actor: AssistiveProvenanceActorContext,
  ): AssistiveProvenanceExportDecision {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.exportDecisions,
      () => {
        const envelope = requireProvenanceEnvelope(this.runtime, command.provenanceEnvelopeRef);
        const blockingReasonCodes = exportBlockingReasons(command, envelope, this.runtime);
        const decisionState = exportDecisionState(command, blockingReasonCodes);
        const decisionHash = stableAssistiveProvenanceHash({
          provenanceEnvelopeRef: command.provenanceEnvelopeRef,
          replayManifestRef: command.replayManifestRef,
          exportAudience: command.exportAudience,
          requestedLayer: command.requestedLayer,
          decisionState,
          blockingReasonCodes,
        });
        const decision: AssistiveProvenanceExportDecision = {
          exportDecisionId:
            command.exportDecisionId ?? `assistive-provenance-export:${decisionHash}`,
          provenanceEnvelopeRef: command.provenanceEnvelopeRef,
          replayManifestRef: command.replayManifestRef,
          exportAudience: command.exportAudience,
          requestedLayer: command.requestedLayer,
          outboundNavigationGrantRef: command.outboundNavigationGrantRef,
          artifactPresentationContractRef: command.artifactPresentationContractRef,
          decisionState,
          allowedArtifactRefs:
            decisionState === "blocked"
              ? []
              : decisionState === "redacted_summary_only"
                ? [envelope.provenanceEnvelopeId]
                : [envelope.provenanceEnvelopeId, command.replayManifestRef].filter(isString),
          blockingReasonCodes,
          decidedAt: this.runtime.clock.now(),
        };
        this.runtime.store.exportDecisions.set(decision.exportDecisionId, decision);
        recordAudit(
          this.runtime,
          "AssistiveProvenanceExportGuard",
          "guardExport",
          actor,
          decision.exportDecisionId,
          decision.decisionState === "blocked" ? "failed_closed" : "accepted",
          [
            ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.provenance_export_guard_blocks_raw_content,
            ...blockingReasonCodes,
          ],
        );
        return decision;
      },
    );
  }
}

export function createAssistiveProvenancePlane(
  options: {
    clock?: AssistiveProvenanceClock;
    idGenerator?: AssistiveProvenanceIdGenerator;
    store?: AssistiveProvenanceStore;
  } = {},
) {
  const runtime: AssistiveProvenanceRuntime = {
    store: options.store ?? createAssistiveProvenanceStore(),
    clock: options.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options.idGenerator ?? createSequentialIdGenerator(),
  };
  return {
    runtime,
    promptPackages: new AssistivePromptPackageRegistry(runtime),
    promptSnapshots: new AssistivePromptSnapshotStore(runtime),
    inferenceLogs: new AssistiveInferenceLogService(runtime),
    provenanceEnvelopes: new AssistiveProvenanceEnvelopeWriter(runtime),
    replayManifests: new AssistiveReplayManifestAssembler(runtime),
    feedbackEligibility: new FeedbackEligibilityMaterializer(runtime),
    trainabilityRevocations: new TrainabilityRevocationService(runtime),
    exportGuard: new AssistiveProvenanceExportGuard(runtime),
  };
}

export function createAssistiveProvenanceStore(): AssistiveProvenanceStore {
  return {
    promptPackages: new Map(),
    promptSnapshots: new Map(),
    inferenceLogs: new Map(),
    provenanceEnvelopes: new Map(),
    replayManifests: new Map(),
    feedbackEligibilityFlags: new Map(),
    revocationRecords: new Map(),
    exportDecisions: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
    provenanceEnvelopeByArtifactRevision: new Map(),
    currentFeedbackFlagByChain: new Map(),
  };
}

export function stableAssistiveProvenanceHash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 32);
}

function createSequentialIdGenerator(): AssistiveProvenanceIdGenerator {
  let counter = 0;
  return {
    next(prefix: string): string {
      counter += 1;
      return `${prefix}:${counter.toString().padStart(6, "0")}`;
    },
  };
}

function withIdempotency<T extends object>(
  runtime: AssistiveProvenanceRuntime,
  idempotencyKey: string | undefined,
  map: Map<string, T>,
  producer: () => T,
): T {
  if (idempotencyKey) {
    const existingId = runtime.store.idempotencyKeys.get(idempotencyKey);
    if (existingId) {
      const existing = map.get(existingId);
      if (existing) {
        return existing;
      }
    }
  }
  const produced = producer();
  if (idempotencyKey) {
    const objectId = firstStringValueEndingWithId(produced);
    if (objectId) {
      runtime.store.idempotencyKeys.set(idempotencyKey, objectId);
    }
  }
  return produced;
}

function firstStringValueEndingWithId(value: object): string | undefined {
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key.endsWith("Id") && typeof entry === "string") {
      return entry;
    }
  }
  return undefined;
}

function recordAudit(
  runtime: AssistiveProvenanceRuntime,
  serviceName: string,
  action: string,
  actor: AssistiveProvenanceActorContext,
  subjectRef: string,
  outcome: AssistiveProvenanceAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("assistive-provenance-audit"),
    serviceName,
    action,
    actorRef: actor.actorRef,
    actorRole: actor.actorRole,
    routeIntentBindingRef: actor.routeIntentBindingRef,
    auditCorrelationId: actor.auditCorrelationId,
    purposeOfUse: actor.purposeOfUse,
    subjectRef,
    outcome,
    reasonCodes: [...reasonCodes],
    recordedAt: runtime.clock.now(),
  });
}

function requirePromptPackage(
  runtime: AssistiveProvenanceRuntime,
  promptPackageId: string,
): AssistivePromptPackage {
  const promptPackage = runtime.store.promptPackages.get(promptPackageId);
  if (!promptPackage) {
    throw new Error(`AssistivePromptPackage not found: ${promptPackageId}`);
  }
  return promptPackage;
}

function requirePromptSnapshot(
  runtime: AssistiveProvenanceRuntime,
  promptSnapshotId: string,
): AssistivePromptSnapshot {
  const snapshot = runtime.store.promptSnapshots.get(promptSnapshotId);
  if (!snapshot) {
    throw new Error(`AssistivePromptSnapshot not found: ${promptSnapshotId}`);
  }
  return snapshot;
}

function requireInferenceLog(
  runtime: AssistiveProvenanceRuntime,
  assistiveInferenceLogId: string,
): AssistiveInferenceLog {
  const log = runtime.store.inferenceLogs.get(assistiveInferenceLogId);
  if (!log) {
    throw new Error(`AssistiveInferenceLog not found: ${assistiveInferenceLogId}`);
  }
  return log;
}

function requireProvenanceEnvelope(
  runtime: AssistiveProvenanceRuntime,
  provenanceEnvelopeId: string,
): AssistiveProvenanceEnvelope {
  const envelope = runtime.store.provenanceEnvelopes.get(provenanceEnvelopeId);
  if (!envelope) {
    throw new Error(`AssistiveProvenanceEnvelope not found: ${provenanceEnvelopeId}`);
  }
  return envelope;
}

function requireReplayManifest(
  runtime: AssistiveProvenanceRuntime,
  replayManifestId: string,
): AssistiveReplayManifest {
  const manifest = runtime.store.replayManifests.get(replayManifestId);
  if (!manifest) {
    throw new Error(`AssistiveReplayManifest not found: ${replayManifestId}`);
  }
  return manifest;
}

function requireFeedbackEligibilityFlag(
  runtime: AssistiveProvenanceRuntime,
  feedbackFlagId: string,
): FeedbackEligibilityFlag {
  const flag = runtime.store.feedbackEligibilityFlags.get(feedbackFlagId);
  if (!flag) {
    throw new Error(`FeedbackEligibilityFlag not found: ${feedbackFlagId}`);
  }
  return flag;
}

function assertReleaseOrWatchTuple(releaseCandidateRef?: string, watchTupleHash?: string): void {
  if (!releaseCandidateRef && !watchTupleHash) {
    throw new Error(
      ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.prompt_snapshot_binds_release_or_watch_tuple,
    );
  }
}

function inferenceLogMissingReasons(command: RecordInferenceLogCommand): string[] {
  const reasons: string[] = [];
  for (const [label, value] of [
    ["assistiveRunRef", command.assistiveRunRef],
    ["capabilityCode", command.capabilityCode],
    ["modelVersionRef", command.modelVersionRef],
    ["promptSnapshotRef", command.promptSnapshotRef],
    ["inputEvidenceSnapshotHash", command.inputEvidenceSnapshotHash],
    ["inputCaptureBundleRef", command.inputCaptureBundleRef],
    ["policyBundleRef", command.policyBundleRef],
    ["outputSchemaBundleRef", command.outputSchemaBundleRef],
    ["calibrationBundleRef", command.calibrationBundleRef],
    ["runtimeImageRef", command.runtimeImageRef],
    ["surfacePublicationRef", command.surfacePublicationRef],
    ["runtimePublicationBundleRef", command.runtimePublicationBundleRef],
    ["assistiveRunSettlementRef", command.assistiveRunSettlementRef],
  ] as const) {
    if (!value || value.trim().length === 0) {
      reasons.push(`missing_${label}`);
    }
  }
  if (command.inputEvidenceSnapshotRefs.length === 0) {
    reasons.push("missing_inputEvidenceSnapshotRefs");
  }
  if (command.inputDerivationPackageRefs.length === 0) {
    reasons.push("missing_inputDerivationPackageRefs");
  }
  if (command.outputArtifactRefs.length === 0) {
    reasons.push("missing_outputArtifactRefs");
  }
  return reasons;
}

function resolveFeedbackEligibility(command: MaterializeFeedbackEligibilityCommand): {
  eligibleForTraining: boolean;
  eligibilityState: FeedbackEligibilityState;
  exclusionReason?: string;
  requiresAdjudication: boolean;
} {
  const incidentLinked = (command.incidentLinkRefs?.length ?? 0) > 0;
  if (
    !command.finalHumanArtifactRef ||
    !command.authoritativeWorkflowSettlementRef ||
    command.workflowSettlementState !== "settled"
  ) {
    return {
      eligibleForTraining: false,
      eligibilityState: "pending_settlement",
      requiresAdjudication: false,
    };
  }
  if (command.chainState === "revoked" || command.chainState === "superseded") {
    return {
      eligibleForTraining: false,
      eligibilityState: "revoked",
      exclusionReason: command.chainState,
      requiresAdjudication: false,
    };
  }
  if (
    command.chainState === "excluded" ||
    command.regenerateOnlyFlow ||
    command.dismissedSuggestion ||
    command.staleRecoveryAction ||
    command.counterfactualCompletenessState === "absent" ||
    command.labelQualityState === "excluded"
  ) {
    return {
      eligibleForTraining: false,
      eligibilityState: "excluded",
      exclusionReason:
        command.exclusionReason ?? "excluded_or_non_trainable_assistive_feedback_path",
      requiresAdjudication: false,
    };
  }
  if (
    incidentLinked ||
    command.highSeverityCase ||
    command.dualReviewCase ||
    command.policyExceptionOverride ||
    command.counterfactualCompletenessState === "partial" ||
    command.labelQualityState === "pending"
  ) {
    return {
      eligibleForTraining: false,
      eligibilityState: "requires_adjudication",
      exclusionReason: command.exclusionReason,
      requiresAdjudication: true,
    };
  }
  if (
    command.chainState === "settled_clean" &&
    (command.labelQualityState === "routine_clean" ||
      command.labelQualityState === "adjudicated") &&
    (command.counterfactualCompletenessState === "complete" ||
      command.counterfactualCompletenessState === "not_applicable")
  ) {
    return {
      eligibleForTraining: true,
      eligibilityState: "eligible",
      requiresAdjudication: false,
    };
  }
  return {
    eligibleForTraining: false,
    eligibilityState: "requires_adjudication",
    requiresAdjudication: true,
  };
}

function exportBlockingReasons(
  command: GuardProvenanceExportCommand,
  envelope: AssistiveProvenanceEnvelope,
  runtime: AssistiveProvenanceRuntime,
): string[] {
  const reasons: string[] = [];
  if (envelope.replayabilityState !== "replayable") {
    reasons.push(ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.missing_provenance_fail_closed);
  }
  if (command.allowRawPromptOrEvidenceContent) {
    reasons.push(ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.provenance_export_guard_blocks_raw_content);
  }
  if (command.requestedLayer === "full_replay" && !command.replayManifestRef) {
    reasons.push("full_replay_requires_replay_manifest");
  }
  if (command.replayManifestRef) {
    const manifest = requireReplayManifest(runtime, command.replayManifestRef);
    if (manifest.manifestState !== "assembled") {
      reasons.push("replay_manifest_not_assembled");
    }
  }
  if (command.exportAudience === "external_handoff" && !command.outboundNavigationGrantRef) {
    reasons.push("external_handoff_requires_outbound_navigation_grant");
  }
  if (!command.artifactPresentationContractRef) {
    reasons.push("artifact_presentation_contract_required");
  }
  if (
    command.requestedLayer === "full_replay" &&
    command.exportAudience !== "assurance" &&
    command.exportAudience !== "safety"
  ) {
    reasons.push("full_replay_restricted_to_assurance_or_safety");
  }
  return unique(reasons);
}

function exportDecisionState(
  command: GuardProvenanceExportCommand,
  blockingReasons: readonly string[],
): ExportDecisionState {
  if (blockingReasons.length === 0) {
    return "allowed";
  }
  if (
    command.requestedLayer !== "full_replay" &&
    !blockingReasons.includes(
      ASSISTIVE_PROVENANCE_INVARIANT_MARKERS.provenance_export_guard_blocks_raw_content,
    )
  ) {
    return "redacted_summary_only";
  }
  return "blocked";
}

function requireNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function stableStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return '"__undefined__"';
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}
