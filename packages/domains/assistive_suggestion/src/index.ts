import { createHash } from "node:crypto";

export type ISODateString = string;

export type SuggestionActorRole =
  | "bounded_suggestion_orchestrator"
  | "clinical_reviewer"
  | "clinical_safety_lead"
  | "calibration_release_manager"
  | "artifact_presentation_worker"
  | "system";

export type ConfidenceDescriptor = "suppressed" | "insufficient" | "guarded" | "supported" | "strong";
export type Severity = "low" | "medium" | "high" | "critical";
export type RuleGuardState = "allowed" | "blocked_by_guard" | "hard_stop";
export type PredictionSetState = "in_set" | "out_of_set" | "blocked_by_guard";
export type SuggestionAbstentionState = "none" | "review_only" | "full";
export type ReviewOnlyState = "observe_only" | "blocked" | "full_abstain";
export type CalibrationWindowState = "validated" | "missing" | "expired" | "invalid";
export type SuggestionSurfaceBindingState = "live" | "observe_only" | "stale" | "blocked";
export type SuggestionDraftInsertionLeaseState = "live" | "consumed" | "stale" | "expired" | "revoked";
export type SuggestionActionType = "insert_draft" | "regenerate" | "dismiss" | "acknowledge_abstain";
export type SuggestionActionSettlementResult =
  | "draft_inserted"
  | "regenerated"
  | "dismissed"
  | "abstention_acknowledged"
  | "observe_only"
  | "stale_recoverable"
  | "blocked_policy"
  | "blocked_posture"
  | "failed";
export type SuggestionPresentationArtifactType =
  | "endpoint_explainer"
  | "risk_signal_summary"
  | "question_set_preview"
  | "abstention_notice";
export type SuggestionPresentationArtifactState = "summary_only" | "interactive_same_shell" | "recovery_only" | "blocked";

export interface SuggestionActorContext {
  actorRef: string;
  actorRole: SuggestionActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface SuggestionAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: SuggestionActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface ConfidenceBucket {
  descriptor: Exclude<ConfidenceDescriptor, "suppressed">;
  minScore: number;
}

export interface ThresholdSet {
  gammaFloor: number;
  gammaVisible: number;
  uBlock: number;
  uVisible: number;
  thetaVisible: number;
  cVisible: number;
  piInsert: number;
  marginInsert: number;
  disallowedMassFloor: number;
  hMax: number;
  buckets: readonly ConfidenceBucket[];
}

export interface LossMatrixEntry {
  predictedEndpointCode: string;
  trueEndpointCode: string;
  loss: number;
}

export interface SuggestionCalibrationBundle {
  calibrationBundleId: string;
  capabilityCode: string;
  releaseCohortRef: string;
  watchTupleRef: string;
  calibrationVersion: string;
  riskMatrixVersion: string;
  uncertaintySelectorVersionRef: string;
  conformalBundleRef: string;
  thresholdSetRef: string;
  validatedCalibrationState: CalibrationWindowState;
  validatedUncertaintySelectorState: CalibrationWindowState;
  validatedConformalState: CalibrationWindowState;
  fixedHypothesisSpace: readonly string[];
  coverageTarget: number;
  riskTarget: number;
  nonconformityVersion: string;
  qAlpha: number;
  thresholds: ThresholdSet;
  lossMatrix: readonly LossMatrixEntry[];
  createdAt: ISODateString;
}

export interface RiskSignal {
  riskSignalId: string;
  signalType: string;
  severity: Severity;
  supportingEvidenceRefs: readonly string[];
  posteriorProbability: number;
  confidenceDescriptor: ConfidenceDescriptor;
  ruleGuardState: RuleGuardState;
  evidenceCoverage: number;
}

export interface QuestionSetRecommendation {
  recommendationId: string;
  questionSetRef: string;
  triggerReason: string;
  posteriorProbability: number;
  confidenceDescriptor: ConfidenceDescriptor;
  evidenceRefs: readonly string[];
  evidenceCoverage: number;
}

export interface EndpointHypothesis {
  hypothesisId: string;
  endpointCode: string;
  rankingPosition: number;
  rationaleRef: string;
  supportingEvidenceRefs: readonly string[];
  posteriorProbability: number;
  allowedConditionalProbability: number;
  confidenceDescriptor: ConfidenceDescriptor;
  expectedHarm: number;
  evidenceCoverage: number;
  marginToRunnerUp: number;
  predictionSetState: PredictionSetState;
  ruleGuardState: RuleGuardState;
  insertEligible: boolean;
}

export interface ConformalPredictionSet {
  predictionSetId: string;
  capabilityCode: string;
  contextSnapshotId: string;
  includedHypotheses: readonly string[];
  coverageTarget: number;
  riskTarget: number;
  nonconformityVersion: string;
  constructedAt: ISODateString;
}

export interface AbstentionRecord {
  abstentionId: string;
  suggestionEnvelopeRef: string;
  capabilityCode: string;
  reasonCode: string;
  contextSnapshotId: string;
  reviewVersionRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  diagnosticMetricRef: string;
  reviewOnlyState: ReviewOnlyState;
  createdAt: ISODateString;
}

export interface RuleGuardResult {
  guardResultId: string;
  capabilityCode: string;
  contextSnapshotId: string;
  hardStopTriggered: boolean;
  conflictFlags: readonly string[];
  blockedEndpointCodes: readonly string[];
  allowedSuggestionSet: readonly string[];
  allowedSuggestionSetHash: string;
  createdAt: ISODateString;
}

export interface SuggestionEnvelope {
  suggestionEnvelopeId: string;
  contextSnapshotId: string;
  capabilityCode: string;
  priorityBandSuggestion: string;
  riskSignalRefs: readonly string[];
  endpointHypotheses: readonly string[];
  questionRecommendations: readonly string[];
  topHypothesisRef?: string;
  confidenceDescriptor: ConfidenceDescriptor;
  allowedSetMass: number;
  epistemicUncertainty: number;
  predictionSetRef: string;
  abstentionState: SuggestionAbstentionState;
  calibrationVersion: string;
  riskMatrixVersion: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  allowedSuggestionSetHash: string;
  surfaceBindingRef: string;
  oneClickInsertState: "armed" | "observe_only" | "blocked";
  staleAt?: ISODateString;
  invalidatedAt?: ISODateString;
  createdAt: ISODateString;
}

export interface SuggestionDraftInsertionLease {
  suggestionDraftInsertionLeaseId: string;
  assistiveSessionRef: string;
  suggestionEnvelopeRef: string;
  decisionEpochRef: string;
  selectedAnchorRef: string;
  decisionDockRef: string;
  draftInsertionPointRef: string;
  reviewVersionRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  allowedSuggestionSetHash: string;
  slotHash: string;
  leaseState: SuggestionDraftInsertionLeaseState;
  issuedAt: ISODateString;
  expiresAt: ISODateString;
}

export interface SuggestionSurfaceBinding {
  suggestionSurfaceBindingId: string;
  suggestionEnvelopeRef: string;
  routeFamilyRef: string;
  assistiveSurfaceBindingRef: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  audienceSurfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  placeholderContractRef: string;
  bindingState: SuggestionSurfaceBindingState;
  createdAt: ISODateString;
}

export interface SuggestionActionRecord {
  suggestionActionRecordId: string;
  assistiveSessionRef: string;
  routeIntentBindingRef: string;
  suggestionEnvelopeRef: string;
  suggestionDraftInsertionLeaseRef?: string;
  assistiveArtifactActionRecordRef: string;
  actionType: SuggestionActionType;
  decisionDockRef: string;
  decisionEpochRef: string;
  selectedAnchorRef: string;
  reviewVersionRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  allowedSuggestionSetHash: string;
  submittedBy: string;
  submittedAt: ISODateString;
  commandActionRecordRef: string;
}

export interface SuggestionActionSettlement {
  suggestionActionSettlementId: string;
  suggestionActionRecordRef: string;
  commandSettlementRecordRef: string;
  transitionEnvelopeRef: string;
  result: SuggestionActionSettlementResult;
  releaseRecoveryDispositionRef: string;
  settledAt: ISODateString;
}

export interface SuggestionPresentationArtifact {
  suggestionPresentationArtifactId: string;
  artifactType: SuggestionPresentationArtifactType;
  suggestionEnvelopeRef: string;
  summaryRef: string;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef?: string;
  maskingPolicyRef: string;
  externalHandoffPolicyRef?: string;
  artifactState: SuggestionPresentationArtifactState;
  blockingReasonCodes: readonly string[];
  createdAt: ISODateString;
}

export interface AssistiveSuggestionStore {
  calibrationBundles: Map<string, SuggestionCalibrationBundle>;
  riskSignals: Map<string, RiskSignal>;
  questionRecommendations: Map<string, QuestionSetRecommendation>;
  endpointHypotheses: Map<string, EndpointHypothesis>;
  predictionSets: Map<string, ConformalPredictionSet>;
  abstentionRecords: Map<string, AbstentionRecord>;
  ruleGuardResults: Map<string, RuleGuardResult>;
  envelopes: Map<string, SuggestionEnvelope>;
  insertionLeases: Map<string, SuggestionDraftInsertionLease>;
  surfaceBindings: Map<string, SuggestionSurfaceBinding>;
  actionRecords: Map<string, SuggestionActionRecord>;
  actionSettlements: Map<string, SuggestionActionSettlement>;
  presentationArtifacts: Map<string, SuggestionPresentationArtifact>;
  auditRecords: SuggestionAuditRecord[];
  idempotencyKeys: Map<string, string>;
}

export interface SuggestionClock {
  now(): ISODateString;
}

export interface SuggestionIdGenerator {
  next(prefix: string): string;
}

export interface RegisterSuggestionCalibrationBundleCommand {
  calibrationBundleId: string;
  capabilityCode: string;
  releaseCohortRef: string;
  watchTupleRef: string;
  calibrationVersion: string;
  riskMatrixVersion: string;
  uncertaintySelectorVersionRef: string;
  conformalBundleRef: string;
  thresholdSetRef: string;
  validatedCalibrationState: CalibrationWindowState;
  validatedUncertaintySelectorState: CalibrationWindowState;
  validatedConformalState: CalibrationWindowState;
  fixedHypothesisSpace: readonly string[];
  coverageTarget: number;
  riskTarget: number;
  nonconformityVersion: string;
  qAlpha: number;
  thresholds: ThresholdSet;
  lossMatrix: readonly LossMatrixEntry[];
  idempotencyKey?: string;
}

export interface RiskSignalInput {
  signalType: string;
  severity: Severity;
  supportingEvidenceRefs: readonly string[];
  posteriorProbability: number;
  evidenceCoverage: number;
}

export interface QuestionRecommendationInput {
  questionSetRef: string;
  triggerReason: string;
  posteriorProbability: number;
  evidenceRefs: readonly string[];
  evidenceCoverage: number;
}

export interface EndpointScoreInput {
  endpointCode: string;
  rawScore: number;
  fullSpaceCalibratedProbability: number;
  rationaleRef: string;
  supportingEvidenceRefs: readonly string[];
  supportedEvidenceWeight: number;
  requiredEvidenceWeight: number;
  nonconformityScore: number;
  severityRank: number;
}

export interface RuleGuardInput {
  blockedEndpointCodes?: readonly string[];
  hardStopReasonCodes?: readonly string[];
  conflictFlags?: readonly string[];
}

export interface SurfaceBindingInput {
  routeFamilyRef: string;
  assistiveSurfaceBindingRef: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  audienceSurfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  placeholderContractRef: string;
  bindingState?: SuggestionSurfaceBindingState;
}

export interface CreateSuggestionEnvelopeCommand {
  contextSnapshotId: string;
  capabilityCode: string;
  priorityBandSuggestion: string;
  calibrationBundleRef: string;
  activeReleaseCohortRef?: string;
  activeWatchTupleRef?: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  riskSignals?: readonly RiskSignalInput[];
  questionRecommendations?: readonly QuestionRecommendationInput[];
  endpointScores: readonly EndpointScoreInput[];
  ruleGuard?: RuleGuardInput;
  epistemicUncertainty: number;
  surfaceBinding: SurfaceBindingInput;
  rawRationaleText?: string;
  idempotencyKey?: string;
}

export interface IssueSuggestionDraftInsertionLeaseCommand {
  assistiveSessionRef: string;
  suggestionEnvelopeRef: string;
  selectedAnchorRef: string;
  decisionDockRef: string;
  draftInsertionPointRef: string;
  slotHash: string;
  expiresAt: ISODateString;
  idempotencyKey?: string;
}

export interface SubmitSuggestionActionCommand {
  assistiveSessionRef: string;
  suggestionEnvelopeRef: string;
  suggestionDraftInsertionLeaseRef?: string;
  assistiveArtifactActionRecordRef: string;
  actionType: SuggestionActionType;
  decisionDockRef: string;
  selectedAnchorRef: string;
  allowedSuggestionSetHash: string;
  submittedBy: string;
  commandActionRecordRef: string;
  routeIntentBindingRef?: string;
  idempotencyKey?: string;
}

export interface SettleSuggestionActionCommand {
  suggestionActionRecordRef: string;
  commandSettlementRecordRef: string;
  transitionEnvelopeRef: string;
  requestedResult: SuggestionActionSettlementResult;
  releaseRecoveryDispositionRef: string;
  idempotencyKey?: string;
}

export interface CreateSuggestionPresentationArtifactCommand {
  artifactType: SuggestionPresentationArtifactType;
  suggestionEnvelopeRef: string;
  summaryRef: string;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef?: string;
  maskingPolicyRef: string;
  externalHandoffPolicyRef?: string;
  requestedArtifactState?: SuggestionPresentationArtifactState;
  rawArtifactUrl?: string;
  idempotencyKey?: string;
}

interface SuggestionRuntime {
  store: AssistiveSuggestionStore;
  clock: SuggestionClock;
  idGenerator: SuggestionIdGenerator;
}

interface ResolvedCalibration {
  bundle: SuggestionCalibrationBundle;
  visibleConfidenceAllowed: boolean;
  reasonCodes: readonly string[];
}

export class AssistiveSuggestionError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly reasonCodes: readonly string[] = [],
  ) {
    super(message);
    this.name = "AssistiveSuggestionError";
  }
}

export const assistiveSuggestionServiceNames = [
  "SuggestionEnvelopeService",
  "RuleGuardEngine",
  "RiskSignalExtractor",
  "QuestionRecommendationService",
  "EndpointHypothesisRanker",
  "ConformalPredictionSetService",
  "AbstentionService",
  "SuggestionActionService",
  "SuggestionPresentationArtifactService",
] as const;

export function createAssistiveSuggestionStore(): AssistiveSuggestionStore {
  return {
    calibrationBundles: new Map(),
    riskSignals: new Map(),
    questionRecommendations: new Map(),
    endpointHypotheses: new Map(),
    predictionSets: new Map(),
    abstentionRecords: new Map(),
    ruleGuardResults: new Map(),
    envelopes: new Map(),
    insertionLeases: new Map(),
    surfaceBindings: new Map(),
    actionRecords: new Map(),
    actionSettlements: new Map(),
    presentationArtifacts: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
  };
}

export function createDeterministicSuggestionIdGenerator(): SuggestionIdGenerator {
  const counters = new Map<string, number>();
  return {
    next(prefix: string): string {
      const nextValue = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, nextValue);
      return `${prefix}_${String(nextValue).padStart(6, "0")}`;
    },
  };
}

export function stableSuggestionHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export class SuggestionCalibrationBundleService {
  public constructor(private readonly runtime: SuggestionRuntime) {}

  public registerCalibrationBundle(
    command: RegisterSuggestionCalibrationBundleCommand,
    actor: SuggestionActorContext,
  ): SuggestionCalibrationBundle {
    requireRole(actor, ["calibration_release_manager", "clinical_safety_lead", "system"], "SUGGESTION_CALIBRATION_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "suggestion_calibration", command.idempotencyKey, this.runtime.store.calibrationBundles);
    if (existing) {
      return existing;
    }
    for (const ref of [
      command.calibrationBundleId,
      command.capabilityCode,
      command.releaseCohortRef,
      command.watchTupleRef,
      command.calibrationVersion,
      command.riskMatrixVersion,
      command.uncertaintySelectorVersionRef,
      command.conformalBundleRef,
      command.thresholdSetRef,
      command.nonconformityVersion,
    ]) {
      requireFrozenReference(ref);
    }
    requireNonEmptyArray(command.fixedHypothesisSpace, "fixedHypothesisSpace");
    validateFrozenReferences(command.fixedHypothesisSpace, "fixedHypothesisSpace");
    validateUnique(command.fixedHypothesisSpace, "fixedHypothesisSpace");
    validateUnitInterval(command.coverageTarget, "coverageTarget");
    validateUnitInterval(command.riskTarget, "riskTarget");
    validateUnitInterval(command.qAlpha, "qAlpha");
    validateThresholdSet(command.thresholds);
    requireNonEmptyArray(command.lossMatrix, "lossMatrix");
    for (const loss of command.lossMatrix) {
      requireFrozenReference(loss.predictedEndpointCode);
      requireFrozenReference(loss.trueEndpointCode);
      validateNonNegative(loss.loss, "loss");
    }
    const bundle: SuggestionCalibrationBundle = Object.freeze({
      ...command,
      fixedHypothesisSpace: Object.freeze([...command.fixedHypothesisSpace]),
      thresholds: freezeThresholdSet(command.thresholds),
      lossMatrix: Object.freeze([...command.lossMatrix]),
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.calibrationBundles.set(bundle.calibrationBundleId, bundle);
    setIdempotent(this.runtime, "suggestion_calibration", command.idempotencyKey, bundle.calibrationBundleId);
    writeAudit(this.runtime, "SuggestionCalibrationBundleService", "registerCalibrationBundle", actor, bundle.calibrationBundleId, "accepted", []);
    return bundle;
  }

  public resolveCalibration(
    calibrationBundleRef: string,
    capabilityCode: string,
    activeReleaseCohortRef?: string,
    activeWatchTupleRef?: string,
  ): ResolvedCalibration {
    const bundle = requireFromMap(this.runtime.store.calibrationBundles, calibrationBundleRef, "SUGGESTION_CALIBRATION_BUNDLE_NOT_FOUND");
    if (bundle.capabilityCode !== capabilityCode) {
      throw new AssistiveSuggestionError("SUGGESTION_CALIBRATION_CAPABILITY_MISMATCH", "Calibration bundle capability does not match request.", [
        "calibration_capability_mismatch",
      ]);
    }
    const reasonCodes: string[] = [];
    if (bundle.validatedCalibrationState !== "validated") {
      reasonCodes.push("validated_calibration_set_missing");
    }
    if (bundle.validatedUncertaintySelectorState !== "validated") {
      reasonCodes.push("validated_uncertainty_selector_missing");
    }
    if (bundle.validatedConformalState !== "validated") {
      reasonCodes.push("validated_conformal_window_missing");
    }
    if (activeReleaseCohortRef && activeReleaseCohortRef !== bundle.releaseCohortRef) {
      reasonCodes.push("release_cohort_mismatch");
    }
    if (activeWatchTupleRef && activeWatchTupleRef !== bundle.watchTupleRef) {
      reasonCodes.push("watch_tuple_mismatch");
    }
    return {
      bundle,
      visibleConfidenceAllowed: reasonCodes.length === 0,
      reasonCodes,
    };
  }
}

export class RuleGuardEngine {
  public constructor(private readonly runtime: SuggestionRuntime) {}

  public evaluateRuleGuards(command: {
    capabilityCode: string;
    contextSnapshotId: string;
    fixedHypothesisSpace: readonly string[];
    ruleGuard?: RuleGuardInput;
  }): RuleGuardResult {
    requireFrozenReference(command.capabilityCode);
    requireFrozenReference(command.contextSnapshotId);
    const blockedEndpointCodes = unique(command.ruleGuard?.blockedEndpointCodes ?? []);
    validateFrozenReferences(blockedEndpointCodes, "blockedEndpointCodes");
    const allowedSuggestionSet = command.fixedHypothesisSpace.filter((endpointCode) => !blockedEndpointCodes.includes(endpointCode));
    const hardStopReasonCodes = command.ruleGuard?.hardStopReasonCodes ?? [];
    const conflictFlags = unique([...(command.ruleGuard?.conflictFlags ?? []), ...hardStopReasonCodes]);
    const result: RuleGuardResult = Object.freeze({
      guardResultId: this.runtime.idGenerator.next("rule_guard"),
      capabilityCode: command.capabilityCode,
      contextSnapshotId: command.contextSnapshotId,
      hardStopTriggered: hardStopReasonCodes.length > 0 || allowedSuggestionSet.length === 0,
      conflictFlags: Object.freeze(conflictFlags),
      blockedEndpointCodes: Object.freeze(blockedEndpointCodes),
      allowedSuggestionSet: Object.freeze(allowedSuggestionSet),
      allowedSuggestionSetHash: stableSuggestionHash({
        capabilityCode: command.capabilityCode,
        contextSnapshotId: command.contextSnapshotId,
        allowedSuggestionSet,
        blockedEndpointCodes,
        conflictFlags,
      }),
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.ruleGuardResults.set(result.guardResultId, result);
    return result;
  }
}

export class RiskSignalExtractor {
  public constructor(private readonly runtime: SuggestionRuntime) {}

  public extractRiskSignals(inputs: readonly RiskSignalInput[], guardResult: RuleGuardResult): readonly RiskSignal[] {
    return inputs.map((input) => {
      requireNonEmpty(input.signalType, "signalType");
      requireNonEmptyArray(input.supportingEvidenceRefs, "supportingEvidenceRefs");
      validateFrozenReferences(input.supportingEvidenceRefs, "supportingEvidenceRefs");
      validateUnitInterval(input.posteriorProbability, "posteriorProbability");
      validateUnitInterval(input.evidenceCoverage, "evidenceCoverage");
      const signal: RiskSignal = Object.freeze({
        riskSignalId: this.runtime.idGenerator.next("risk_signal"),
        signalType: input.signalType,
        severity: input.severity,
        supportingEvidenceRefs: Object.freeze([...input.supportingEvidenceRefs]),
        posteriorProbability: input.posteriorProbability,
        confidenceDescriptor: descriptorFromScore(Math.min(input.posteriorProbability, input.evidenceCoverage)),
        ruleGuardState: guardResult.hardStopTriggered ? "hard_stop" : "allowed",
        evidenceCoverage: input.evidenceCoverage,
      });
      this.runtime.store.riskSignals.set(signal.riskSignalId, signal);
      return signal;
    });
  }
}

export class QuestionRecommendationService {
  public constructor(private readonly runtime: SuggestionRuntime) {}

  public recommendQuestionSets(inputs: readonly QuestionRecommendationInput[]): readonly QuestionSetRecommendation[] {
    return inputs.map((input) => {
      requireFrozenReference(input.questionSetRef);
      requireNonEmpty(input.triggerReason, "triggerReason");
      requireNonEmptyArray(input.evidenceRefs, "evidenceRefs");
      validateFrozenReferences(input.evidenceRefs, "evidenceRefs");
      validateUnitInterval(input.posteriorProbability, "posteriorProbability");
      validateUnitInterval(input.evidenceCoverage, "evidenceCoverage");
      const recommendation: QuestionSetRecommendation = Object.freeze({
        recommendationId: this.runtime.idGenerator.next("question_recommendation"),
        questionSetRef: input.questionSetRef,
        triggerReason: input.triggerReason,
        posteriorProbability: input.posteriorProbability,
        confidenceDescriptor: descriptorFromScore(Math.min(input.posteriorProbability, input.evidenceCoverage)),
        evidenceRefs: Object.freeze([...input.evidenceRefs]),
        evidenceCoverage: input.evidenceCoverage,
      });
      this.runtime.store.questionRecommendations.set(recommendation.recommendationId, recommendation);
      return recommendation;
    });
  }
}

export class ConformalPredictionSetService {
  public constructor(private readonly runtime: SuggestionRuntime) {}

  public constructPredictionSet(
    capabilityCode: string,
    contextSnapshotId: string,
    endpointScores: readonly EndpointScoreInput[],
    bundle: SuggestionCalibrationBundle,
  ): ConformalPredictionSet {
    const includedHypotheses = endpointScores
      .filter((score) => score.nonconformityScore <= bundle.qAlpha)
      .map((score) => score.endpointCode);
    const predictionSet: ConformalPredictionSet = Object.freeze({
      predictionSetId: this.runtime.idGenerator.next("conformal_prediction_set"),
      capabilityCode,
      contextSnapshotId,
      includedHypotheses: Object.freeze(includedHypotheses),
      coverageTarget: bundle.coverageTarget,
      riskTarget: bundle.riskTarget,
      nonconformityVersion: bundle.nonconformityVersion,
      constructedAt: this.runtime.clock.now(),
    });
    this.runtime.store.predictionSets.set(predictionSet.predictionSetId, predictionSet);
    return predictionSet;
  }
}

export class EndpointHypothesisRanker {
  public constructor(private readonly runtime: SuggestionRuntime) {}

  public rankEndpointHypotheses(options: {
    endpointScores: readonly EndpointScoreInput[];
    calibration: ResolvedCalibration;
    guardResult: RuleGuardResult;
    predictionSet: ConformalPredictionSet;
    allowedSetMass: number;
    epistemicUncertainty: number;
  }): readonly EndpointHypothesis[] {
    validateEndpointScores(options.endpointScores, options.calibration.bundle);
    const allowedScores = options.endpointScores.filter((score) => options.guardResult.allowedSuggestionSet.includes(score.endpointCode));
    const allowedProbabilities = new Map(
      allowedScores.map((score) => [
        score.endpointCode,
        clamp01(score.fullSpaceCalibratedProbability / Math.max(0.00000001, options.allowedSetMass)),
      ]),
    );
    const rankedScores = [...options.endpointScores].sort((left, right) => {
      const probabilityDiff = (allowedProbabilities.get(right.endpointCode) ?? 0) - (allowedProbabilities.get(left.endpointCode) ?? 0);
      return probabilityDiff !== 0 ? probabilityDiff : left.endpointCode.localeCompare(right.endpointCode);
    });
    const visibleSet = this.computeVisibleSet(options, allowedProbabilities);
    const insertSet = visibleSet.filter((score) => {
      const pAllowed = allowedProbabilities.get(score.endpointCode) ?? 0;
      const margin = computeAllowedMargin(score.endpointCode, allowedProbabilities);
      return pAllowed >= options.calibration.bundle.thresholds.piInsert && margin >= options.calibration.bundle.thresholds.marginInsert;
    });

    return rankedScores.map((score, index) => {
      const pAllowed = allowedProbabilities.get(score.endpointCode) ?? 0;
      const coverage = evidenceCoverage(score.supportedEvidenceWeight, score.requiredEvidenceWeight);
      const expectedHarm = computeExpectedHarm(score.endpointCode, options.endpointScores, options.calibration.bundle);
      const inPredictionSet = options.predictionSet.includedHypotheses.includes(score.endpointCode);
      const allowed = options.guardResult.allowedSuggestionSet.includes(score.endpointCode);
      const confidenceBase = Math.min(
        pAllowed,
        options.allowedSetMass,
        coverage,
        1 - options.epistemicUncertainty,
        1 - expectedHarm / Math.max(0.000001, options.calibration.bundle.thresholds.hMax),
      );
      const hypothesis: EndpointHypothesis = Object.freeze({
        hypothesisId: this.runtime.idGenerator.next("endpoint_hypothesis"),
        endpointCode: score.endpointCode,
        rankingPosition: index + 1,
        rationaleRef: score.rationaleRef,
        supportingEvidenceRefs: Object.freeze([...score.supportingEvidenceRefs]),
        posteriorProbability: score.fullSpaceCalibratedProbability,
        allowedConditionalProbability: pAllowed,
        confidenceDescriptor: options.calibration.visibleConfidenceAllowed
          ? bucketConfidence(confidenceBase, options.calibration.bundle.thresholds.buckets)
          : "suppressed",
        expectedHarm,
        evidenceCoverage: coverage,
        marginToRunnerUp: computeAllowedMargin(score.endpointCode, allowedProbabilities),
        predictionSetState: inPredictionSet ? (allowed ? "in_set" : "blocked_by_guard") : "out_of_set",
        ruleGuardState: options.guardResult.hardStopTriggered ? "hard_stop" : allowed ? "allowed" : "blocked_by_guard",
        insertEligible: insertSet.length === 1 && insertSet[0]?.endpointCode === score.endpointCode && options.calibration.visibleConfidenceAllowed,
      });
      this.runtime.store.endpointHypotheses.set(hypothesis.hypothesisId, hypothesis);
      return hypothesis;
    });
  }

  private computeVisibleSet(
    options: {
      endpointScores: readonly EndpointScoreInput[];
      calibration: ResolvedCalibration;
      guardResult: RuleGuardResult;
      predictionSet: ConformalPredictionSet;
      allowedSetMass: number;
      epistemicUncertainty: number;
    },
    allowedProbabilities: Map<string, number>,
  ): readonly EndpointScoreInput[] {
    if (!options.calibration.visibleConfidenceAllowed) {
      return [];
    }
    return options.endpointScores.filter((score) => {
      if (!options.guardResult.allowedSuggestionSet.includes(score.endpointCode)) {
        return false;
      }
      if (!options.predictionSet.includedHypotheses.includes(score.endpointCode)) {
        return false;
      }
      const expectedHarm = computeExpectedHarm(score.endpointCode, options.endpointScores, options.calibration.bundle);
      return (
        evidenceCoverage(score.supportedEvidenceWeight, score.requiredEvidenceWeight) >= options.calibration.bundle.thresholds.cVisible &&
        options.allowedSetMass >= options.calibration.bundle.thresholds.gammaVisible &&
        options.epistemicUncertainty <= options.calibration.bundle.thresholds.uVisible &&
        expectedHarm <= options.calibration.bundle.thresholds.thetaVisible &&
        (allowedProbabilities.get(score.endpointCode) ?? 0) > 0
      );
    });
  }
}

export class AbstentionService {
  public constructor(private readonly runtime: SuggestionRuntime) {}

  public createAbstentionRecord(command: {
    suggestionEnvelopeRef: string;
    capabilityCode: string;
    reasonCode: string;
    contextSnapshotId: string;
    reviewVersionRef: string;
    policyBundleRef: string;
    lineageFenceEpoch: string;
    diagnosticMetricRef: string;
    reviewOnlyState: ReviewOnlyState;
  }): AbstentionRecord {
    const abstention: AbstentionRecord = Object.freeze({
      abstentionId: this.runtime.idGenerator.next("abstention"),
      ...command,
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.abstentionRecords.set(abstention.abstentionId, abstention);
    return abstention;
  }
}

export class SuggestionEnvelopeService {
  private readonly calibrationBundles: SuggestionCalibrationBundleService;
  private readonly ruleGuards: RuleGuardEngine;
  private readonly riskSignals: RiskSignalExtractor;
  private readonly questions: QuestionRecommendationService;
  private readonly predictionSets: ConformalPredictionSetService;
  private readonly ranker: EndpointHypothesisRanker;
  private readonly abstentions: AbstentionService;

  public constructor(private readonly runtime: SuggestionRuntime) {
    this.calibrationBundles = new SuggestionCalibrationBundleService(runtime);
    this.ruleGuards = new RuleGuardEngine(runtime);
    this.riskSignals = new RiskSignalExtractor(runtime);
    this.questions = new QuestionRecommendationService(runtime);
    this.predictionSets = new ConformalPredictionSetService(runtime);
    this.ranker = new EndpointHypothesisRanker(runtime);
    this.abstentions = new AbstentionService(runtime);
  }

  public createSuggestionEnvelope(command: CreateSuggestionEnvelopeCommand, actor: SuggestionActorContext): SuggestionEnvelope {
    requireRole(actor, ["bounded_suggestion_orchestrator", "system"], "SUGGESTION_ENVELOPE_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "suggestion_envelope", command.idempotencyKey, this.runtime.store.envelopes);
    if (existing) {
      return existing;
    }
    if (command.rawRationaleText) {
      throw new AssistiveSuggestionError("SUGGESTION_RAW_RATIONALE_FORBIDDEN", "Suggestion commands must use rationale refs, not raw rationale text.", [
        "raw_rationale_text_forbidden",
      ]);
    }
    for (const ref of [
      command.contextSnapshotId,
      command.capabilityCode,
      command.reviewVersionRef,
      command.decisionEpochRef,
      command.policyBundleRef,
      command.lineageFenceEpoch,
    ]) {
      requireFrozenReference(ref);
    }
    validateUnitInterval(command.epistemicUncertainty, "epistemicUncertainty");
    const calibration = this.calibrationBundles.resolveCalibration(
      command.calibrationBundleRef,
      command.capabilityCode,
      command.activeReleaseCohortRef,
      command.activeWatchTupleRef,
    );
    validateEndpointScores(command.endpointScores, calibration.bundle);
    const guardResult = this.ruleGuards.evaluateRuleGuards({
      capabilityCode: command.capabilityCode,
      contextSnapshotId: command.contextSnapshotId,
      fixedHypothesisSpace: calibration.bundle.fixedHypothesisSpace,
      ruleGuard: command.ruleGuard,
    });
    const allowedSetMass = computeAllowedSetMass(command.endpointScores, guardResult.allowedSuggestionSet);
    const predictionSet = this.predictionSets.constructPredictionSet(
      command.capabilityCode,
      command.contextSnapshotId,
      command.endpointScores,
      calibration.bundle,
    );
    const hypotheses = this.ranker.rankEndpointHypotheses({
      endpointScores: command.endpointScores,
      calibration,
      guardResult,
      predictionSet,
      allowedSetMass,
      epistemicUncertainty: command.epistemicUncertainty,
    });
    const signals = this.riskSignals.extractRiskSignals(command.riskSignals ?? [], guardResult);
    const questionRecommendations = this.questions.recommendQuestionSets(command.questionRecommendations ?? []);
    const abstentionDecision = deriveAbstentionDecision({
      command,
      calibration,
      guardResult,
      predictionSet,
      allowedSetMass,
      hypotheses,
    });
    const visibleHypotheses = hypotheses.filter(
      (hypothesis) => hypothesis.predictionSetState === "in_set" && hypothesis.ruleGuardState === "allowed" && hypothesis.confidenceDescriptor !== "suppressed",
    );
    const insertEligibleHypotheses = hypotheses.filter((hypothesis) => hypothesis.insertEligible);
    const topHypothesisRef =
      abstentionDecision.abstentionState === "none" && visibleHypotheses.length === 1 ? visibleHypotheses[0]?.hypothesisId : undefined;
    const envelopeId = this.runtime.idGenerator.next("suggestion_envelope");
    const surfaceBinding = this.createSurfaceBinding(envelopeId, command.surfaceBinding);
    const envelope: SuggestionEnvelope = Object.freeze({
      suggestionEnvelopeId: envelopeId,
      contextSnapshotId: command.contextSnapshotId,
      capabilityCode: command.capabilityCode,
      priorityBandSuggestion: command.priorityBandSuggestion,
      riskSignalRefs: Object.freeze(signals.map((signal) => signal.riskSignalId)),
      endpointHypotheses: Object.freeze(hypotheses.map((hypothesis) => hypothesis.hypothesisId)),
      questionRecommendations: Object.freeze(questionRecommendations.map((recommendation) => recommendation.recommendationId)),
      topHypothesisRef,
      confidenceDescriptor: topHypothesisRef
        ? requireFromMap(this.runtime.store.endpointHypotheses, topHypothesisRef, "SUGGESTION_HYPOTHESIS_NOT_FOUND").confidenceDescriptor
        : calibration.visibleConfidenceAllowed
          ? "guarded"
          : "suppressed",
      allowedSetMass,
      epistemicUncertainty: command.epistemicUncertainty,
      predictionSetRef: predictionSet.predictionSetId,
      abstentionState: abstentionDecision.abstentionState,
      calibrationVersion: calibration.bundle.calibrationVersion,
      riskMatrixVersion: calibration.bundle.riskMatrixVersion,
      reviewVersionRef: command.reviewVersionRef,
      decisionEpochRef: command.decisionEpochRef,
      policyBundleRef: command.policyBundleRef,
      lineageFenceEpoch: command.lineageFenceEpoch,
      allowedSuggestionSetHash: guardResult.allowedSuggestionSetHash,
      surfaceBindingRef: surfaceBinding.suggestionSurfaceBindingId,
      oneClickInsertState:
        abstentionDecision.abstentionState === "none" && insertEligibleHypotheses.length === 1 && surfaceBinding.bindingState === "live"
          ? "armed"
          : abstentionDecision.abstentionState === "full"
            ? "blocked"
            : "observe_only",
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.envelopes.set(envelope.suggestionEnvelopeId, envelope);
    if (abstentionDecision.reasonCode) {
      this.abstentions.createAbstentionRecord({
        suggestionEnvelopeRef: envelope.suggestionEnvelopeId,
        capabilityCode: command.capabilityCode,
        reasonCode: abstentionDecision.reasonCode,
        contextSnapshotId: command.contextSnapshotId,
        reviewVersionRef: command.reviewVersionRef,
        policyBundleRef: command.policyBundleRef,
        lineageFenceEpoch: command.lineageFenceEpoch,
        diagnosticMetricRef: `diagnostic:${stableSuggestionHash({
          allowedSetMass,
          epistemicUncertainty: command.epistemicUncertainty,
          predictionSetRef: predictionSet.predictionSetId,
        })}`,
        reviewOnlyState: abstentionDecision.abstentionState === "full" ? "full_abstain" : "observe_only",
      });
    }
    setIdempotent(this.runtime, "suggestion_envelope", command.idempotencyKey, envelope.suggestionEnvelopeId);
    writeAudit(
      this.runtime,
      "SuggestionEnvelopeService",
      "createSuggestionEnvelope",
      actor,
      envelope.suggestionEnvelopeId,
      envelope.abstentionState === "full" ? "blocked" : "accepted",
      abstentionDecision.reasonCode ? [abstentionDecision.reasonCode] : [],
    );
    return envelope;
  }

  public invalidateEnvelope(
    suggestionEnvelopeId: string,
    actor: SuggestionActorContext,
    reasonCode = "suggestion_context_drift_invalidated",
  ): SuggestionEnvelope {
    requireRole(actor, ["bounded_suggestion_orchestrator", "clinical_reviewer", "system"], "SUGGESTION_ENVELOPE_FORBIDDEN");
    const envelope = requireFromMap(this.runtime.store.envelopes, suggestionEnvelopeId, "SUGGESTION_ENVELOPE_NOT_FOUND");
    const updated: SuggestionEnvelope = Object.freeze({
      ...envelope,
      staleAt: envelope.staleAt ?? this.runtime.clock.now(),
      invalidatedAt: this.runtime.clock.now(),
      oneClickInsertState: "blocked",
    });
    this.runtime.store.envelopes.set(suggestionEnvelopeId, updated);
    writeAudit(this.runtime, "SuggestionEnvelopeService", "invalidateEnvelope", actor, suggestionEnvelopeId, "blocked", [reasonCode]);
    return updated;
  }

  public getSuggestionEnvelope(suggestionEnvelopeId: string): SuggestionEnvelope {
    return requireFromMap(this.runtime.store.envelopes, suggestionEnvelopeId, "SUGGESTION_ENVELOPE_NOT_FOUND");
  }

  private createSurfaceBinding(suggestionEnvelopeRef: string, input: SurfaceBindingInput): SuggestionSurfaceBinding {
    for (const ref of [
      input.routeFamilyRef,
      input.assistiveSurfaceBindingRef,
      input.staffWorkspaceConsistencyProjectionRef,
      input.workspaceSliceTrustProjectionRef,
      input.audienceSurfaceRouteContractRef,
      input.surfacePublicationRef,
      input.runtimePublicationBundleRef,
      input.releaseRecoveryDispositionRef,
      input.placeholderContractRef,
    ]) {
      requireFrozenReference(ref);
    }
    const binding: SuggestionSurfaceBinding = Object.freeze({
      suggestionSurfaceBindingId: this.runtime.idGenerator.next("suggestion_surface_binding"),
      suggestionEnvelopeRef,
      ...input,
      bindingState: input.bindingState ?? "live",
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.surfaceBindings.set(binding.suggestionSurfaceBindingId, binding);
    return binding;
  }
}

export class SuggestionActionService {
  public constructor(private readonly runtime: SuggestionRuntime) {}

  public issueDraftInsertionLease(
    command: IssueSuggestionDraftInsertionLeaseCommand,
    actor: SuggestionActorContext,
  ): SuggestionDraftInsertionLease {
    requireRole(actor, ["bounded_suggestion_orchestrator", "clinical_reviewer", "system"], "SUGGESTION_LEASE_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "suggestion_insertion_lease", command.idempotencyKey, this.runtime.store.insertionLeases);
    if (existing) {
      return existing;
    }
    const envelope = requireFromMap(this.runtime.store.envelopes, command.suggestionEnvelopeRef, "SUGGESTION_ENVELOPE_NOT_FOUND");
    for (const ref of [command.assistiveSessionRef, command.selectedAnchorRef, command.decisionDockRef, command.draftInsertionPointRef, command.slotHash]) {
      requireFrozenReference(ref);
    }
    if (envelope.oneClickInsertState !== "armed" || envelope.invalidatedAt || envelope.staleAt) {
      throw new AssistiveSuggestionError("SUGGESTION_INSERT_NOT_ARMED", "Draft insertion lease requires a fresh envelope with armed insert state.", [
        "suggestion_insert_not_armed",
      ]);
    }
    if (Date.parse(command.expiresAt) <= Date.parse(this.runtime.clock.now())) {
      throw new AssistiveSuggestionError("SUGGESTION_LEASE_EXPIRY_INVALID", "Draft insertion lease must expire in the future.");
    }
    const lease: SuggestionDraftInsertionLease = Object.freeze({
      suggestionDraftInsertionLeaseId: this.runtime.idGenerator.next("suggestion_insert_lease"),
      assistiveSessionRef: command.assistiveSessionRef,
      suggestionEnvelopeRef: envelope.suggestionEnvelopeId,
      decisionEpochRef: envelope.decisionEpochRef,
      selectedAnchorRef: command.selectedAnchorRef,
      decisionDockRef: command.decisionDockRef,
      draftInsertionPointRef: command.draftInsertionPointRef,
      reviewVersionRef: envelope.reviewVersionRef,
      policyBundleRef: envelope.policyBundleRef,
      lineageFenceEpoch: envelope.lineageFenceEpoch,
      allowedSuggestionSetHash: envelope.allowedSuggestionSetHash,
      slotHash: command.slotHash,
      leaseState: "live",
      issuedAt: this.runtime.clock.now(),
      expiresAt: command.expiresAt,
    });
    this.runtime.store.insertionLeases.set(lease.suggestionDraftInsertionLeaseId, lease);
    setIdempotent(this.runtime, "suggestion_insertion_lease", command.idempotencyKey, lease.suggestionDraftInsertionLeaseId);
    writeAudit(this.runtime, "SuggestionActionService", "issueDraftInsertionLease", actor, lease.suggestionDraftInsertionLeaseId, "accepted", []);
    return lease;
  }

  public submitAction(command: SubmitSuggestionActionCommand, actor: SuggestionActorContext): SuggestionActionRecord {
    requireRole(actor, ["clinical_reviewer", "bounded_suggestion_orchestrator", "system"], "SUGGESTION_ACTION_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "suggestion_action_record", command.idempotencyKey, this.runtime.store.actionRecords);
    if (existing) {
      return existing;
    }
    const envelope = requireFromMap(this.runtime.store.envelopes, command.suggestionEnvelopeRef, "SUGGESTION_ENVELOPE_NOT_FOUND");
    if (command.allowedSuggestionSetHash !== envelope.allowedSuggestionSetHash) {
      throw new AssistiveSuggestionError("SUGGESTION_ALLOWED_SET_HASH_MISMATCH", "Suggestion action must carry the live allowed-set hash.", [
        "allowed_suggestion_set_hash_mismatch",
      ]);
    }
    let lease: SuggestionDraftInsertionLease | undefined;
    if (command.actionType === "insert_draft") {
      if (!command.suggestionDraftInsertionLeaseRef) {
        throw new AssistiveSuggestionError("SUGGESTION_INSERT_LEASE_REQUIRED", "Insert requires a live draft insertion lease.", [
          "suggestion_draft_insertion_lease_required",
        ]);
      }
      lease = requireFromMap(this.runtime.store.insertionLeases, command.suggestionDraftInsertionLeaseRef, "SUGGESTION_INSERT_LEASE_NOT_FOUND");
      assertLeaseMatchesEnvelope(lease, envelope, command);
    }
    const record: SuggestionActionRecord = Object.freeze({
      suggestionActionRecordId: this.runtime.idGenerator.next("suggestion_action"),
      assistiveSessionRef: command.assistiveSessionRef,
      routeIntentBindingRef: command.routeIntentBindingRef ?? actor.routeIntentBindingRef,
      suggestionEnvelopeRef: envelope.suggestionEnvelopeId,
      suggestionDraftInsertionLeaseRef: command.suggestionDraftInsertionLeaseRef,
      assistiveArtifactActionRecordRef: command.assistiveArtifactActionRecordRef,
      actionType: command.actionType,
      decisionDockRef: command.decisionDockRef,
      decisionEpochRef: envelope.decisionEpochRef,
      selectedAnchorRef: command.selectedAnchorRef,
      reviewVersionRef: envelope.reviewVersionRef,
      policyBundleRef: envelope.policyBundleRef,
      lineageFenceEpoch: envelope.lineageFenceEpoch,
      allowedSuggestionSetHash: command.allowedSuggestionSetHash,
      submittedBy: command.submittedBy,
      submittedAt: this.runtime.clock.now(),
      commandActionRecordRef: command.commandActionRecordRef,
    });
    this.runtime.store.actionRecords.set(record.suggestionActionRecordId, record);
    setIdempotent(this.runtime, "suggestion_action_record", command.idempotencyKey, record.suggestionActionRecordId);
    writeAudit(this.runtime, "SuggestionActionService", "submitAction", actor, record.suggestionActionRecordId, "accepted", []);
    return record;
  }

  public settleAction(command: SettleSuggestionActionCommand, actor: SuggestionActorContext): SuggestionActionSettlement {
    requireRole(actor, ["bounded_suggestion_orchestrator", "clinical_reviewer", "system"], "SUGGESTION_ACTION_SETTLEMENT_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "suggestion_action_settlement", command.idempotencyKey, this.runtime.store.actionSettlements);
    if (existing) {
      return existing;
    }
    const action = requireFromMap(this.runtime.store.actionRecords, command.suggestionActionRecordRef, "SUGGESTION_ACTION_NOT_FOUND");
    const envelope = requireFromMap(this.runtime.store.envelopes, action.suggestionEnvelopeRef, "SUGGESTION_ENVELOPE_NOT_FOUND");
    let result = normalizeSettlementResult(action.actionType, command.requestedResult);
    if (envelope.invalidatedAt || envelope.staleAt) {
      result = "stale_recoverable";
    }
    if (action.actionType === "insert_draft") {
      const lease = requireFromMap(
        this.runtime.store.insertionLeases,
        action.suggestionDraftInsertionLeaseRef ?? "",
        "SUGGESTION_INSERT_LEASE_NOT_FOUND",
      );
      if (lease.leaseState !== "live" || Date.parse(lease.expiresAt) <= Date.parse(this.runtime.clock.now())) {
        result = "stale_recoverable";
      }
      this.runtime.store.insertionLeases.set(lease.suggestionDraftInsertionLeaseId, {
        ...lease,
        leaseState: result === "draft_inserted" ? "consumed" : "stale",
      });
    }
    const settlement: SuggestionActionSettlement = Object.freeze({
      suggestionActionSettlementId: this.runtime.idGenerator.next("suggestion_action_settlement"),
      suggestionActionRecordRef: action.suggestionActionRecordId,
      commandSettlementRecordRef: command.commandSettlementRecordRef,
      transitionEnvelopeRef: command.transitionEnvelopeRef,
      result,
      releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
      settledAt: this.runtime.clock.now(),
    });
    this.runtime.store.actionSettlements.set(settlement.suggestionActionSettlementId, settlement);
    setIdempotent(this.runtime, "suggestion_action_settlement", command.idempotencyKey, settlement.suggestionActionSettlementId);
    writeAudit(
      this.runtime,
      "SuggestionActionService",
      "settleAction",
      actor,
      settlement.suggestionActionSettlementId,
      ["blocked_policy", "blocked_posture", "failed", "stale_recoverable"].includes(result) ? "blocked" : "accepted",
      result === "stale_recoverable" ? ["suggestion_action_stale_recoverable"] : [],
    );
    return settlement;
  }
}

export class SuggestionPresentationArtifactService {
  public constructor(private readonly runtime: SuggestionRuntime) {}

  public createPresentationArtifact(
    command: CreateSuggestionPresentationArtifactCommand,
    actor: SuggestionActorContext,
  ): SuggestionPresentationArtifact {
    requireRole(
      actor,
      ["artifact_presentation_worker", "clinical_reviewer", "bounded_suggestion_orchestrator", "system"],
      "SUGGESTION_PRESENTATION_FORBIDDEN",
    );
    const existing = getIdempotent(this.runtime, "suggestion_presentation", command.idempotencyKey, this.runtime.store.presentationArtifacts);
    if (existing) {
      return existing;
    }
    const envelope = requireFromMap(this.runtime.store.envelopes, command.suggestionEnvelopeRef, "SUGGESTION_ENVELOPE_NOT_FOUND");
    for (const ref of [command.summaryRef, command.artifactPresentationContractRef, command.maskingPolicyRef]) {
      requireFrozenReference(ref);
    }
    const blockingReasonCodes = derivePresentationBlockingReasons(command, envelope);
    const artifactState =
      blockingReasonCodes.length > 0
        ? "blocked"
        : envelope.abstentionState === "full" || envelope.oneClickInsertState === "blocked"
          ? "recovery_only"
          : command.requestedArtifactState ?? "summary_only";
    const artifact: SuggestionPresentationArtifact = Object.freeze({
      suggestionPresentationArtifactId: this.runtime.idGenerator.next("suggestion_presentation"),
      artifactType: command.artifactType,
      suggestionEnvelopeRef: envelope.suggestionEnvelopeId,
      summaryRef: command.summaryRef,
      artifactPresentationContractRef: command.artifactPresentationContractRef,
      outboundNavigationGrantPolicyRef: command.outboundNavigationGrantPolicyRef,
      maskingPolicyRef: command.maskingPolicyRef,
      externalHandoffPolicyRef: command.externalHandoffPolicyRef,
      artifactState,
      blockingReasonCodes: Object.freeze(blockingReasonCodes),
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.presentationArtifacts.set(artifact.suggestionPresentationArtifactId, artifact);
    setIdempotent(this.runtime, "suggestion_presentation", command.idempotencyKey, artifact.suggestionPresentationArtifactId);
    writeAudit(
      this.runtime,
      "SuggestionPresentationArtifactService",
      "createPresentationArtifact",
      actor,
      artifact.suggestionPresentationArtifactId,
      artifactState === "blocked" ? "blocked" : "accepted",
      blockingReasonCodes,
    );
    return artifact;
  }
}

export function createAssistiveSuggestionOrchestratorPlane(options?: {
  store?: AssistiveSuggestionStore;
  clock?: SuggestionClock;
  idGenerator?: SuggestionIdGenerator;
}): {
  store: AssistiveSuggestionStore;
  calibrationBundles: SuggestionCalibrationBundleService;
  envelopes: SuggestionEnvelopeService;
  ruleGuards: RuleGuardEngine;
  riskSignals: RiskSignalExtractor;
  questionRecommendations: QuestionRecommendationService;
  endpointHypotheses: EndpointHypothesisRanker;
  predictionSets: ConformalPredictionSetService;
  abstentions: AbstentionService;
  actions: SuggestionActionService;
  presentationArtifacts: SuggestionPresentationArtifactService;
} {
  const runtime: SuggestionRuntime = {
    store: options?.store ?? createAssistiveSuggestionStore(),
    clock: options?.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options?.idGenerator ?? createDeterministicSuggestionIdGenerator(),
  };
  return {
    store: runtime.store,
    calibrationBundles: new SuggestionCalibrationBundleService(runtime),
    envelopes: new SuggestionEnvelopeService(runtime),
    ruleGuards: new RuleGuardEngine(runtime),
    riskSignals: new RiskSignalExtractor(runtime),
    questionRecommendations: new QuestionRecommendationService(runtime),
    endpointHypotheses: new EndpointHypothesisRanker(runtime),
    predictionSets: new ConformalPredictionSetService(runtime),
    abstentions: new AbstentionService(runtime),
    actions: new SuggestionActionService(runtime),
    presentationArtifacts: new SuggestionPresentationArtifactService(runtime),
  };
}

export const assistiveSuggestionOrchestratorContract = {
  contractId: "409_recommendation_orchestrator_contract",
  schemaVersion: "409.recommendation-orchestrator-contract.v1",
  upstreamContractRefs: [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/406_evaluation_runtime_contract.json",
    "data/contracts/408_documentation_composer_contract.json",
  ],
  services: assistiveSuggestionServiceNames,
  failClosedDefaults: [
    "full_space_calibration_required",
    "rule_guard_hard_stop",
    "allowed_set_mass_below_floor",
    "epistemic_uncertainty_blocked",
    "conformal_allowed_intersection_empty",
    "suggestion_draft_insertion_lease_required",
    "endpoint_decision_mutation_forbidden",
  ],
} as const;

function deriveAbstentionDecision(options: {
  command: CreateSuggestionEnvelopeCommand;
  calibration: ResolvedCalibration;
  guardResult: RuleGuardResult;
  predictionSet: ConformalPredictionSet;
  allowedSetMass: number;
  hypotheses: readonly EndpointHypothesis[];
}): { abstentionState: SuggestionAbstentionState; reasonCode?: string } {
  if (!options.calibration.visibleConfidenceAllowed) {
    return { abstentionState: "review_only", reasonCode: options.calibration.reasonCodes[0] ?? "visible_confidence_not_allowed" };
  }
  if (options.guardResult.hardStopTriggered) {
    return { abstentionState: "full", reasonCode: "rule_guard_hard_stop" };
  }
  if (options.allowedSetMass < options.calibration.bundle.thresholds.gammaFloor) {
    return { abstentionState: "full", reasonCode: "allowed_set_mass_below_floor" };
  }
  if (options.command.epistemicUncertainty > options.calibration.bundle.thresholds.uBlock) {
    return { abstentionState: "full", reasonCode: "epistemic_uncertainty_blocked" };
  }
  const allowedPredictionIntersection = options.predictionSet.includedHypotheses.filter((endpointCode) =>
    options.guardResult.allowedSuggestionSet.includes(endpointCode),
  );
  if (allowedPredictionIntersection.length === 0) {
    return { abstentionState: "full", reasonCode: "conformal_allowed_intersection_empty" };
  }
  const blockedMass = computeAllowedSetMass(options.command.endpointScores, options.guardResult.blockedEndpointCodes);
  if (blockedMass >= options.calibration.bundle.thresholds.disallowedMassFloor) {
    return { abstentionState: "review_only", reasonCode: "disallowed_or_higher_severity_mass_present" };
  }
  const visibleHypotheses = options.hypotheses.filter(
    (hypothesis) => hypothesis.predictionSetState === "in_set" && hypothesis.ruleGuardState === "allowed" && hypothesis.confidenceDescriptor !== "suppressed",
  );
  return visibleHypotheses.length > 0 ? { abstentionState: "none" } : { abstentionState: "review_only", reasonCode: "visible_candidate_set_not_sharp" };
}

function validateEndpointScores(endpointScores: readonly EndpointScoreInput[], bundle: SuggestionCalibrationBundle): void {
  requireNonEmptyArray(endpointScores, "endpointScores");
  const scoreCodes = endpointScores.map((score) => score.endpointCode);
  validateUnique(scoreCodes, "endpointScores.endpointCode");
  for (const endpointCode of bundle.fixedHypothesisSpace) {
    if (!scoreCodes.includes(endpointCode)) {
      throw new AssistiveSuggestionError("SUGGESTION_FULL_SPACE_CALIBRATION_REQUIRED", "Endpoint scores must cover the fixed full hypothesis space.", [
        "full_space_calibration_required",
      ]);
    }
  }
  for (const score of endpointScores) {
    requireFrozenReference(score.endpointCode);
    requireFrozenReference(score.rationaleRef);
    requireNonEmptyArray(score.supportingEvidenceRefs, "supportingEvidenceRefs");
    validateFrozenReferences(score.supportingEvidenceRefs, "supportingEvidenceRefs");
    validateUnitInterval(score.fullSpaceCalibratedProbability, "fullSpaceCalibratedProbability");
    validateUnitInterval(score.nonconformityScore, "nonconformityScore");
    validateNonNegative(score.supportedEvidenceWeight, "supportedEvidenceWeight");
    if (!Number.isFinite(score.requiredEvidenceWeight) || score.requiredEvidenceWeight <= 0) {
      throw new AssistiveSuggestionError("SUGGESTION_EVIDENCE_WEIGHT_INVALID", "requiredEvidenceWeight must be greater than zero.");
    }
    if (score.supportedEvidenceWeight > score.requiredEvidenceWeight) {
      throw new AssistiveSuggestionError("SUGGESTION_EVIDENCE_WEIGHT_INVALID", "supportedEvidenceWeight cannot exceed requiredEvidenceWeight.");
    }
  }
}

function computeAllowedSetMass(endpointScores: readonly EndpointScoreInput[], allowedSet: readonly string[]): number {
  return clamp01(
    endpointScores
      .filter((score) => allowedSet.includes(score.endpointCode))
      .reduce((sum, score) => sum + score.fullSpaceCalibratedProbability, 0),
  );
}

function computeAllowedMargin(endpointCode: string, allowedProbabilities: Map<string, number>): number {
  const current = allowedProbabilities.get(endpointCode) ?? 0;
  const runnerUp = [...allowedProbabilities.entries()]
    .filter(([candidate]) => candidate !== endpointCode)
    .reduce((max, [, probability]) => Math.max(max, probability), 0);
  return current - runnerUp;
}

function computeExpectedHarm(endpointCode: string, endpointScores: readonly EndpointScoreInput[], bundle: SuggestionCalibrationBundle): number {
  return endpointScores.reduce((sum, score) => {
    const loss = bundle.lossMatrix.find(
      (entry) => entry.predictedEndpointCode === endpointCode && entry.trueEndpointCode === score.endpointCode,
    )?.loss;
    return sum + (loss ?? (endpointCode === score.endpointCode ? 0 : bundle.thresholds.hMax)) * score.fullSpaceCalibratedProbability;
  }, 0);
}

function evidenceCoverage(supportedEvidenceWeight: number, requiredEvidenceWeight: number): number {
  return clamp01(supportedEvidenceWeight / Math.max(0.000001, requiredEvidenceWeight));
}

function assertLeaseMatchesEnvelope(
  lease: SuggestionDraftInsertionLease,
  envelope: SuggestionEnvelope,
  command: SubmitSuggestionActionCommand,
): void {
  const reasons: string[] = [];
  if (lease.suggestionEnvelopeRef !== envelope.suggestionEnvelopeId) {
    reasons.push("lease_envelope_mismatch");
  }
  if (lease.allowedSuggestionSetHash !== envelope.allowedSuggestionSetHash) {
    reasons.push("lease_allowed_set_hash_stale");
  }
  if (lease.decisionEpochRef !== envelope.decisionEpochRef || lease.reviewVersionRef !== envelope.reviewVersionRef) {
    reasons.push("lease_review_or_decision_epoch_stale");
  }
  if (lease.policyBundleRef !== envelope.policyBundleRef || lease.lineageFenceEpoch !== envelope.lineageFenceEpoch) {
    reasons.push("lease_policy_or_lineage_stale");
  }
  if (lease.decisionDockRef !== command.decisionDockRef || lease.selectedAnchorRef !== command.selectedAnchorRef) {
    reasons.push("lease_target_mismatch");
  }
  if (lease.leaseState !== "live") {
    reasons.push("lease_not_live");
  }
  if (reasons.length > 0) {
    throw new AssistiveSuggestionError("SUGGESTION_INSERT_LEASE_STALE", "Draft insertion lease is stale or mismatched.", reasons);
  }
}

function normalizeSettlementResult(
  actionType: SuggestionActionType,
  requestedResult: SuggestionActionSettlementResult,
): SuggestionActionSettlementResult {
  const legalResultsByAction: Record<SuggestionActionType, readonly SuggestionActionSettlementResult[]> = {
    insert_draft: ["draft_inserted", "observe_only", "stale_recoverable", "blocked_policy", "blocked_posture", "failed"],
    regenerate: ["regenerated", "observe_only", "stale_recoverable", "blocked_policy", "blocked_posture", "failed"],
    dismiss: ["dismissed", "observe_only", "stale_recoverable", "blocked_policy", "blocked_posture", "failed"],
    acknowledge_abstain: [
      "abstention_acknowledged",
      "observe_only",
      "stale_recoverable",
      "blocked_policy",
      "blocked_posture",
      "failed",
    ],
  };
  if (!legalResultsByAction[actionType].includes(requestedResult)) {
    throw new AssistiveSuggestionError("SUGGESTION_ACTION_RESULT_MISMATCH", "Settlement result must preserve action identity.", [
      "suggestion_action_result_identity_mismatch",
    ]);
  }
  return requestedResult;
}

function derivePresentationBlockingReasons(
  command: CreateSuggestionPresentationArtifactCommand,
  envelope: SuggestionEnvelope,
): readonly string[] {
  const reasons: string[] = [];
  if (command.rawArtifactUrl) {
    reasons.push("raw_artifact_url_forbidden");
  }
  if (command.externalHandoffPolicyRef && !command.outboundNavigationGrantPolicyRef) {
    reasons.push("outbound_navigation_grant_required");
  }
  if (envelope.invalidatedAt) {
    reasons.push("suggestion_envelope_invalidated");
  }
  return unique(reasons);
}

function validateThresholdSet(thresholds: ThresholdSet): void {
  for (const [fieldName, value] of Object.entries({
    gammaFloor: thresholds.gammaFloor,
    gammaVisible: thresholds.gammaVisible,
    uBlock: thresholds.uBlock,
    uVisible: thresholds.uVisible,
    thetaVisible: thresholds.thetaVisible,
    cVisible: thresholds.cVisible,
    piInsert: thresholds.piInsert,
    marginInsert: thresholds.marginInsert,
    disallowedMassFloor: thresholds.disallowedMassFloor,
  })) {
    validateUnitInterval(value, fieldName);
  }
  validateNonNegative(thresholds.hMax, "hMax");
  requireNonEmptyArray(thresholds.buckets, "buckets");
  for (const bucket of thresholds.buckets) {
    validateUnitInterval(bucket.minScore, "bucket.minScore");
  }
}

function freezeThresholdSet(thresholds: ThresholdSet): ThresholdSet {
  return Object.freeze({
    ...thresholds,
    buckets: Object.freeze([...thresholds.buckets]),
  });
}

function descriptorFromScore(score: number): ConfidenceDescriptor {
  if (score >= 0.85) {
    return "strong";
  }
  if (score >= 0.7) {
    return "supported";
  }
  if (score >= 0.5) {
    return "guarded";
  }
  return "insufficient";
}

function bucketConfidence(score: number, buckets: readonly ConfidenceBucket[]): ConfidenceDescriptor {
  const sortedBuckets = [...buckets].sort((left, right) => right.minScore - left.minScore);
  for (const bucket of sortedBuckets) {
    if (score >= bucket.minScore) {
      return bucket.descriptor;
    }
  }
  return "insufficient";
}

function requireRole(actor: SuggestionActorContext, allowedRoles: readonly SuggestionActorRole[], code: string): void {
  if (!allowedRoles.includes(actor.actorRole)) {
    throw new AssistiveSuggestionError(code, `Role ${actor.actorRole} is not allowed.`, [`role_${actor.actorRole}_not_allowed`]);
  }
}

function getIdempotent<T>(
  runtime: SuggestionRuntime,
  namespace: string,
  idempotencyKey: string | undefined,
  records: Map<string, T>,
): T | undefined {
  if (!idempotencyKey) {
    return undefined;
  }
  const recordId = runtime.store.idempotencyKeys.get(`${namespace}:${idempotencyKey}`);
  return recordId ? records.get(recordId) : undefined;
}

function setIdempotent(runtime: SuggestionRuntime, namespace: string, idempotencyKey: string | undefined, recordId: string): void {
  if (idempotencyKey) {
    runtime.store.idempotencyKeys.set(`${namespace}:${idempotencyKey}`, recordId);
  }
}

function writeAudit(
  runtime: SuggestionRuntime,
  serviceName: string,
  action: string,
  actor: SuggestionActorContext,
  subjectRef: string,
  outcome: SuggestionAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("suggestion_audit"),
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

function requireFromMap<T>(records: Map<string, T>, key: string, code: string): T {
  const record = records.get(key);
  if (!record) {
    throw new AssistiveSuggestionError(code, `Missing suggestion record: ${key}.`);
  }
  return record;
}

function requireFrozenReference(value: string | undefined): asserts value is string {
  requireNonEmpty(value, "ref");
  const lowered = value.toLowerCase();
  if (
    lowered.startsWith("mutable:") ||
    lowered.includes("mutable_current") ||
    lowered.endsWith(":latest") ||
    lowered.endsWith("/latest")
  ) {
    throw new AssistiveSuggestionError("SUGGESTION_MUTABLE_REF_FORBIDDEN", "Suggestion inputs must be frozen refs.", [
      "mutable_ref_forbidden",
    ]);
  }
}

function validateFrozenReferences(refs: readonly string[], fieldName: string): void {
  for (const ref of refs) {
    try {
      requireFrozenReference(ref);
    } catch (error) {
      if (error instanceof AssistiveSuggestionError) {
        throw new AssistiveSuggestionError(error.code, `${fieldName} contains a mutable or empty reference.`, error.reasonCodes);
      }
      throw error;
    }
  }
}

function requireNonEmpty(value: string | undefined, fieldName: string): asserts value is string {
  if (!value || value.trim().length === 0) {
    throw new AssistiveSuggestionError("SUGGESTION_REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}.`, [
      `${fieldName}_missing`,
    ]);
  }
}

function requireNonEmptyArray<T>(value: readonly T[], fieldName: string): void {
  if (value.length === 0) {
    throw new AssistiveSuggestionError("SUGGESTION_REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}.`, [
      `${fieldName}_missing`,
    ]);
  }
}

function validateUnitInterval(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new AssistiveSuggestionError("SUGGESTION_NUMERIC_FIELD_INVALID", `${fieldName} must be between 0 and 1.`, [
      `${fieldName}_invalid`,
    ]);
  }
}

function validateNonNegative(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new AssistiveSuggestionError("SUGGESTION_NUMERIC_FIELD_INVALID", `${fieldName} must be non-negative.`, [
      `${fieldName}_invalid`,
    ]);
  }
}

function validateUnique(values: readonly string[], fieldName: string): void {
  if (new Set(values).size !== values.length) {
    throw new AssistiveSuggestionError("SUGGESTION_DUPLICATE_VALUE", `${fieldName} must contain unique values.`, [
      `${fieldName}_duplicate`,
    ]);
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

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
