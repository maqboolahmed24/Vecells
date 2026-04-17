import { createHash } from "node:crypto";
import type {
  CreateNormalizedSubmissionInput,
  IntakeRequestType,
  NormalizedSubmissionSnapshot,
} from "../../../packages/domains/intake_request/src/index";
import type {
  SubmissionSourceChannel,
  SurfaceChannelProfile,
} from "../../../packages/domain-kernel/src/index";
import {
  createNormalizedSubmissionApplication,
  type NormalizedSubmissionApplication,
} from "./normalized-submission";
import {
  createSubmissionBackboneApplication,
  type SubmissionBackboneApplication,
} from "./submission-backbone";
import type { TelephonyEvidenceReadinessAssessment } from "./telephony-readiness-pipeline";

export const TELEPHONY_CONVERGENCE_SERVICE_NAME = "TelephonyConvergencePipeline";
export const TELEPHONY_CONVERGENCE_SCHEMA_VERSION = "193.phase2.telephony-convergence.v1";
export const TELEPHONY_CONVERGENCE_POLICY_VERSION = "phase2-telephony-convergence-193.v1";
export const TELEPHONY_CONVERGENCE_INGRESS_MAPPING_POLICY_VERSION =
  "phase2-ingress-channel-mapping-193.v1";
export const TELEPHONY_CONVERGENCE_RECEIPT_POLICY_VERSION = "phase2-receipt-consistency-193.v1";
export const TELEPHONY_CONVERGENCE_FIELD_PRECEDENCE_POLICY_VERSION =
  "phase2-field-precedence-193.v1";
export const TELEPHONY_CONVERGENCE_DUPLICATE_POLICY_VERSION =
  "phase2-cross-channel-duplicate-calibration-193.v1";
export const TELEPHONY_CONVERGENCE_LATE_READINESS_POLICY_VERSION =
  "phase2-late-readiness-resume-193.v1";

export const telephonyConvergencePersistenceTables = [
  "phase2_telephony_frozen_capture_bundles",
  "phase2_telephony_evidence_snapshots",
  "phase2_submission_ingress_records",
  "phase2_telephony_duplicate_pair_evidences",
  "phase2_telephony_duplicate_resolution_decisions",
  "phase2_telephony_convergence_outcomes",
  "phase2_receipt_status_consistency_projections",
] as const;

export const telephonyConvergenceMigrationPlanRefs = [
  "services/command-api/migrations/108_phase2_telephony_convergence_pipeline.sql",
] as const;

export const telephonyConvergenceGapResolutions = [
  "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_INGRESS_CHANNEL_SURFACE_PROFILE_MAPPING",
  "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_RECEIPT_CONSISTENCY_KEY_SERIALIZATION",
  "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_PHONE_CONTINUATION_FIELD_PRECEDENCE",
  "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_CROSS_CHANNEL_CALIBRATION_BOUNDARY",
  "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_LATE_READINESS_RESUME",
] as const;

export const telephonyConvergenceReasonCatalog = [
  "TEL_CONV_193_FREEZE_BEFORE_NORMALIZE",
  "TEL_CONV_193_CANONICAL_SUBMISSION_INGRESS_CREATED",
  "TEL_CONV_193_NORMALIZED_SUBMISSION_CANONICAL",
  "TEL_CONV_193_FIELD_PRECEDENCE_FROZEN",
  "TEL_CONV_193_EXACT_REPLAY_RETURNED",
  "TEL_CONV_193_SEMANTIC_REPLAY_RETURNED",
  "TEL_CONV_193_COLLISION_REVIEW_FROZEN",
  "TEL_CONV_193_DUPLICATE_POLICY_CHANNEL_AGNOSTIC",
  "TEL_CONV_193_CROSS_CHANNEL_CALIBRATION_FAIL_CLOSED",
  "TEL_CONV_193_SAME_REQUEST_ATTACH_REQUIRES_WITNESS",
  "TEL_CONV_193_SAME_REQUEST_ATTACH_NO_SECOND_PROMOTION_OR_RECEIPT",
  "TEL_CONV_193_EVIDENCE_PENDING_BLOCKS_ROUTINE_PROMOTION",
  "TEL_CONV_193_URGENT_LIVE_BLOCKS_ROUTINE_PROMOTION",
  "TEL_CONV_193_MANUAL_REVIEW_BLOCKS_ROUTINE_PROMOTION",
  "TEL_CONV_193_EXACT_ONCE_PROMOTION",
  "TEL_CONV_193_RECEIPT_STATUS_KEYS_CHANNEL_NEUTRAL",
  "TEL_CONV_193_SUPPORT_ASSISTED_SHARED_PATH",
  "TEL_CONV_193_LATE_READINESS_RESUMED_FROM_FROZEN_INGRESS",
] as const;

export type ConvergenceIngressChannel = SubmissionSourceChannel;
export type ConvergenceSurfaceChannelProfile = SurfaceChannelProfile;

export type ConvergenceCaptureAuthorityClass =
  | "patient_self_entered"
  | "patient_spoken"
  | "patient_verified_reply"
  | "support_assisted"
  | "staff_transcribed";

export type ConvergencePromotionIntentClass =
  | "draft_mutation"
  | "governed_submit"
  | "continuation_append"
  | "support_seed_only";

export type ConvergenceContactAuthorityClass =
  | "self_asserted"
  | "nhs_login_claim"
  | "verified_destination"
  | "authority_confirmed"
  | "support_attested";

export type ConvergenceEvidenceReadinessState =
  | "evidence_pending"
  | "urgent_live_only"
  | "safety_usable"
  | "manual_review_only"
  | "unusable_terminal";

export type ConvergenceDuplicateRelationClass =
  | "retry"
  | "same_episode_candidate"
  | "same_episode_confirmed"
  | "related_episode"
  | "new_episode";

export type ConvergenceDuplicateDecisionClass =
  | "exact_retry_collapse"
  | "same_request_attach"
  | "same_episode_link"
  | "related_episode_link"
  | "separate_request"
  | "review_required";

export type ConvergenceReplayClassification =
  | "new_command"
  | "exact_replay"
  | "semantic_replay"
  | "collision_review";

export type ConvergencePromotionReadiness =
  | "ready_to_promote"
  | "hold_evidence_pending"
  | "blocked_urgent_live"
  | "blocked_manual_review"
  | "blocked_unusable_terminal"
  | "blocked_collision_review"
  | "retry_collapsed"
  | "same_request_attach_no_promotion";

export interface ConvergenceChannelCapabilityCeiling {
  readonly canUploadFiles: boolean;
  readonly canRenderTrackStatus: boolean;
  readonly canRenderEmbedded: boolean;
  readonly mutatingResumeState: "allowed" | "rebind_required" | "blocked";
  readonly maxDisclosurePosture:
    | "full_self_service"
    | "minimal_secure_link"
    | "support_console"
    | "manual_only";
}

export interface ConvergenceIdentityContext {
  readonly bindingState:
    | "anonymous"
    | "partial"
    | "verified"
    | "uplift_pending"
    | "identity_repair_required";
  readonly subjectRefPresence: "none" | "masked" | "bound";
  readonly claimResumeState: "not_required" | "pending" | "granted" | "blocked";
  readonly actorBindingState:
    | "anonymous"
    | "partial"
    | "verified"
    | "uplift_pending"
    | "identity_repair_required";
  readonly identityEvidenceRefs: readonly string[];
  readonly contactRouteEvidenceRefs: readonly string[];
  readonly authorityBindingRef: string | null;
}

export interface ConvergenceNarrativeSources {
  readonly web?: string | null;
  readonly spoken?: string | null;
  readonly transcript?: string | null;
  readonly keypad?: string | null;
  readonly continuation?: string | null;
  readonly support?: string | null;
}

export interface ConvergenceStructuredAnswerSources {
  readonly web?: Record<string, unknown>;
  readonly spoken?: Record<string, unknown>;
  readonly transcript?: Record<string, unknown>;
  readonly keypad?: Record<string, unknown>;
  readonly continuation?: Record<string, unknown>;
  readonly support?: Record<string, unknown>;
}

export interface ConvergenceDuplicateProbe {
  readonly relationClass: ConvergenceDuplicateRelationClass;
  readonly candidateRequestRef?: string | null;
  readonly candidateEpisodeRef?: string | null;
  readonly candidateRequestLineageRef?: string | null;
  readonly channelCalibrationRef?: string | null;
  readonly calibratedForChannelMix?: boolean;
  readonly explicitContinuityWitness?: boolean;
  readonly continuityWitnessClass?:
    | "deterministic_replay"
    | "submit_lineage"
    | "workflow_return"
    | "more_info_cycle"
    | "telephony_continuation"
    | "human_review"
    | "none";
  readonly continuityWitnessRef?: string | null;
  readonly noMaterialDivergence?: boolean;
  readonly candidateMargin?: number;
  readonly classMargin?: number;
  readonly uncertaintyScore?: number;
  readonly hardBlockerRefs?: readonly string[];
  readonly competingCandidateRefs?: readonly string[];
}

export interface TelephonyConvergenceCommand {
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly tenantId: string;
  readonly sourceLineageRef: string;
  readonly submissionEnvelopeRef?: string | null;
  readonly requestLineageRef?: string | null;
  readonly ingressChannel: ConvergenceIngressChannel;
  readonly surfaceChannelProfile?: ConvergenceSurfaceChannelProfile | null;
  readonly captureAuthorityClass?: ConvergenceCaptureAuthorityClass;
  readonly promotionIntentClass?: ConvergencePromotionIntentClass;
  readonly requestType: IntakeRequestType;
  readonly narratives?: ConvergenceNarrativeSources;
  readonly structuredAnswers?: ConvergenceStructuredAnswerSources;
  readonly channelMetadata?: Record<string, unknown>;
  readonly identityContext: ConvergenceIdentityContext;
  readonly attachmentRefs?: readonly string[];
  readonly audioRefs?: readonly string[];
  readonly contactPreferencesRef?: string | null;
  readonly sourceTimestamp: string;
  readonly patientMatchConfidenceRef?: string | null;
  readonly dedupeFingerprintRef?: string | null;
  readonly evidenceReadinessAssessment?: TelephonyEvidenceReadinessAssessment | null;
  readonly evidenceReadinessState?: ConvergenceEvidenceReadinessState;
  readonly channelCapabilityCeiling: ConvergenceChannelCapabilityCeiling;
  readonly contactAuthorityClass: ConvergenceContactAuthorityClass;
  readonly routeFamilyRef?: string | null;
  readonly routeIntentBindingRef?: string | null;
  readonly audienceSurfaceRuntimeBindingRef?: string | null;
  readonly releaseApprovalFreezeRef?: string | null;
  readonly manifestVersionRef?: string | null;
  readonly sessionEpochRef?: string | null;
  readonly receiptSeedRef?: string | null;
  readonly duplicateProbe?: ConvergenceDuplicateProbe | null;
  readonly supersededAccessGrantRefs?: readonly string[];
  readonly supersededDraftLeaseRefs?: readonly string[];
  readonly observedAt?: string;
}

export interface FrozenTelephonyCaptureBundle {
  readonly captureBundleRef: string;
  readonly schemaVersion: typeof TELEPHONY_CONVERGENCE_SCHEMA_VERSION;
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly sourceLineageRef: string;
  readonly ingressChannel: ConvergenceIngressChannel;
  readonly surfaceChannelProfile: ConvergenceSurfaceChannelProfile;
  readonly captureAuthorityClass: ConvergenceCaptureAuthorityClass;
  readonly requestType: IntakeRequestType;
  readonly sourceHash: string;
  readonly semanticHash: string;
  readonly replayKey: string;
  readonly fieldSourceManifest: Record<string, string>;
  readonly narrativeSource: string;
  readonly attachmentRefs: readonly string[];
  readonly audioRefs: readonly string[];
  readonly sourceTimestamp: string;
  readonly frozenAt: string;
  readonly recordedBy: typeof TELEPHONY_CONVERGENCE_SERVICE_NAME;
}

export interface TelephonyEvidenceSnapshot {
  readonly evidenceSnapshotRef: string;
  readonly schemaVersion: typeof TELEPHONY_CONVERGENCE_SCHEMA_VERSION;
  readonly captureBundleRef: string;
  readonly sourceLineageRef: string;
  readonly ingressChannel: ConvergenceIngressChannel;
  readonly governingInputRefs: readonly string[];
  readonly evidenceReadinessState: ConvergenceEvidenceReadinessState;
  readonly normalizedInputHash: string;
  readonly sourceHash: string;
  readonly semanticHash: string;
  readonly createdAt: string;
  readonly recordedBy: typeof TELEPHONY_CONVERGENCE_SERVICE_NAME;
}

export interface SubmissionIngressRecord {
  readonly ingressRecordId: string;
  readonly schemaVersion: typeof TELEPHONY_CONVERGENCE_SCHEMA_VERSION;
  readonly submissionEnvelopeRef: string;
  readonly requestLineageRef: string | null;
  readonly intakeConvergenceContractRef: string;
  readonly sourceLineageRef: string;
  readonly ingressChannel: ConvergenceIngressChannel;
  readonly surfaceChannelProfile: ConvergenceSurfaceChannelProfile;
  readonly captureAuthorityClass: ConvergenceCaptureAuthorityClass;
  readonly promotionIntentClass: ConvergencePromotionIntentClass;
  readonly channelCapabilityCeiling: ConvergenceChannelCapabilityCeiling;
  readonly contactAuthorityClass: ConvergenceContactAuthorityClass;
  readonly identityEvidenceRefs: readonly string[];
  readonly contactRouteEvidenceRefs: readonly string[];
  readonly evidenceReadinessState: ConvergenceEvidenceReadinessState;
  readonly evidenceReadinessRef: string | null;
  readonly normalizedSubmissionRef: string;
  readonly transportCorrelationId: string;
  readonly channelPayloadRef: string;
  readonly channelPayloadHash: string;
  readonly receiptConsistencyKey: string;
  readonly statusConsistencyKey: string;
  readonly supersedesIngressRecordRef: string | null;
  readonly createdAt: string;
  readonly recordedBy: typeof TELEPHONY_CONVERGENCE_SERVICE_NAME;
}

export interface ConvergenceDuplicatePairEvidence {
  readonly pairEvidenceId: string;
  readonly incomingLineageRef: string;
  readonly incomingSnapshotRef: string;
  readonly candidateRequestRef: string | null;
  readonly candidateEpisodeRef: string | null;
  readonly replaySignalRefs: readonly string[];
  readonly continuitySignalRefs: readonly string[];
  readonly conflictSignalRefs: readonly string[];
  readonly relationModelVersionRef: string;
  readonly channelCalibrationRef: string;
  readonly thresholdPolicyRef: string;
  readonly featureVectorHash: string;
  readonly piRetry: number;
  readonly piSameRequestAttach: number;
  readonly piSameEpisode: number;
  readonly piRelatedEpisode: number;
  readonly piNewEpisode: number;
  readonly classMargin: number;
  readonly candidateMargin: number;
  readonly uncertaintyScore: number;
  readonly hardBlockerRefs: readonly string[];
  readonly evidenceState: "active" | "superseded";
  readonly createdAt: string;
}

export interface ConvergenceDuplicateResolutionDecision {
  readonly duplicateResolutionDecisionId: string;
  readonly incomingLineageRef: string;
  readonly incomingSnapshotRef: string;
  readonly targetRequestRef: string | null;
  readonly targetEpisodeRef: string | null;
  readonly winningPairEvidenceRef: string | null;
  readonly competingPairEvidenceRefs: readonly string[];
  readonly relationClass: ConvergenceDuplicateRelationClass;
  readonly decisionClass: ConvergenceDuplicateDecisionClass;
  readonly continuityWitnessClass:
    | "deterministic_replay"
    | "submit_lineage"
    | "workflow_return"
    | "more_info_cycle"
    | "telephony_continuation"
    | "human_review"
    | "none";
  readonly continuityWitnessRef: string | null;
  readonly reviewMode: "auto" | "human_review" | "replay_authority";
  readonly reasonCodes: readonly string[];
  readonly decisionState: "applied" | "superseded" | "reverted";
  readonly decidedByRef: typeof TELEPHONY_CONVERGENCE_SERVICE_NAME;
  readonly decidedAt: string;
}

export interface ReceiptConsistencyKeyContract {
  readonly keyRef: string;
  readonly serializationVersion: typeof TELEPHONY_CONVERGENCE_RECEIPT_POLICY_VERSION;
  readonly receiptConsistencyKey: string;
  readonly statusConsistencyKey: string;
  readonly semanticMeaningHash: string;
  readonly lineageConsistencySeed: string;
  readonly etaBucket: "same_day" | "next_working_day" | "manual_review" | "urgent_live";
  readonly promiseState:
    | "submitted"
    | "received_pending_evidence"
    | "manual_review"
    | "urgent_live"
    | "attached_no_new_receipt"
    | "retry_collapsed"
    | "collision_review";
  readonly recoveryPosture:
    | "track_status_available"
    | "same_shell_pending"
    | "manual_follow_up"
    | "urgent_live_follow_up"
    | "same_request_shell"
    | "review_required";
}

export interface ChannelParityProjection {
  readonly projectionRef: string;
  readonly schemaVersion: typeof TELEPHONY_CONVERGENCE_SCHEMA_VERSION;
  readonly ingressRecordRef: string;
  readonly normalizedSubmissionRef: string;
  readonly ingressChannel: ConvergenceIngressChannel;
  readonly surfaceChannelProfile: ConvergenceSurfaceChannelProfile;
  readonly canonicalMeaningHash: string;
  readonly canonicalDedupeFingerprint: string;
  readonly sameFactsSameSafetyKey: string;
  readonly receiptConsistencyKey: string;
  readonly statusConsistencyKey: string;
  readonly provenanceVisible: true;
  readonly channelSpecificRequestModel: false;
  readonly reasonCodes: readonly string[];
}

export interface ReceiptStatusProjection {
  readonly projectionRef: string;
  readonly receiptConsistencyKey: string;
  readonly statusConsistencyKey: string;
  readonly receiptIssued: boolean;
  readonly submittedEventEmitted: boolean;
  readonly intakeNormalizedEventEmitted: boolean;
  readonly promiseState: ReceiptConsistencyKeyContract["promiseState"];
  readonly etaBucket: ReceiptConsistencyKeyContract["etaBucket"];
  readonly recoveryPosture: ReceiptConsistencyKeyContract["recoveryPosture"];
  readonly visibleProvenanceLabel: string;
  readonly createdAt: string;
}

export interface ConvergenceOutcome {
  readonly convergenceOutcomeRef: string;
  readonly schemaVersion: typeof TELEPHONY_CONVERGENCE_SCHEMA_VERSION;
  readonly idempotencyKey: string;
  readonly replayClassification: ConvergenceReplayClassification;
  readonly replayed: boolean;
  readonly captureBundle: FrozenTelephonyCaptureBundle;
  readonly evidenceSnapshot: TelephonyEvidenceSnapshot;
  readonly ingressRecord: SubmissionIngressRecord;
  readonly normalizedSubmission: NormalizedSubmissionSnapshot;
  readonly duplicatePairEvidences: readonly ConvergenceDuplicatePairEvidence[];
  readonly duplicateResolutionDecision: ConvergenceDuplicateResolutionDecision;
  readonly promotionReadiness: ConvergencePromotionReadiness;
  readonly promotionRecord: {
    readonly promotionRecordRef: string;
    readonly requestRef: string;
    readonly requestLineageRef: string;
    readonly submittedEventEmitted: boolean;
    readonly intakeNormalizedEventEmitted: boolean;
  } | null;
  readonly attachedToRequestRef: string | null;
  readonly receiptKey: ReceiptConsistencyKeyContract;
  readonly receiptStatusProjection: ReceiptStatusProjection;
  readonly channelParityProjection: ChannelParityProjection;
  readonly sideEffects: {
    readonly createdCaptureBundle: boolean;
    readonly createdEvidenceSnapshot: boolean;
    readonly createdIngressRecord: boolean;
    readonly createdNormalizedSubmission: boolean;
    readonly createdPromotion: boolean;
    readonly createdReceipt: boolean;
  };
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly recordedBy: typeof TELEPHONY_CONVERGENCE_SERVICE_NAME;
}

export interface ResumePausedIngressInput {
  readonly resumeIdempotencyKey: string;
  readonly convergenceOutcomeRef: string;
  readonly evidenceReadinessAssessment: TelephonyEvidenceReadinessAssessment;
  readonly observedAt?: string;
}

export interface TelephonyConvergenceRepositorySnapshots {
  readonly captureBundles: readonly FrozenTelephonyCaptureBundle[];
  readonly evidenceSnapshots: readonly TelephonyEvidenceSnapshot[];
  readonly ingressRecords: readonly SubmissionIngressRecord[];
  readonly duplicatePairEvidences: readonly ConvergenceDuplicatePairEvidence[];
  readonly duplicateResolutionDecisions: readonly ConvergenceDuplicateResolutionDecision[];
  readonly receiptStatusProjections: readonly ReceiptStatusProjection[];
  readonly outcomes: readonly ConvergenceOutcome[];
}

export interface TelephonyConvergenceRepository {
  getOutcomeByIdempotencyKey(idempotencyKey: string): Promise<ConvergenceOutcome | null>;
  getOutcomeByReplayKey(replayKey: string): Promise<ConvergenceOutcome | null>;
  getCollisionOutcome(
    idempotencyKey: string,
    sourceHash: string,
  ): Promise<ConvergenceOutcome | null>;
  getOutcomeByRef(convergenceOutcomeRef: string): Promise<ConvergenceOutcome | null>;
  getEnvelopeRefBySourceLineage(sourceLineageRef: string): Promise<string | null>;
  getCurrentIngressForEnvelope(
    submissionEnvelopeRef: string,
  ): Promise<SubmissionIngressRecord | null>;
  saveEnvelopeMapping(sourceLineageRef: string, submissionEnvelopeRef: string): Promise<void>;
  saveCaptureBundle(record: FrozenTelephonyCaptureBundle): Promise<void>;
  saveEvidenceSnapshot(record: TelephonyEvidenceSnapshot): Promise<void>;
  saveIngressRecord(record: SubmissionIngressRecord): Promise<void>;
  saveDuplicatePairEvidence(record: ConvergenceDuplicatePairEvidence): Promise<void>;
  saveDuplicateResolutionDecision(record: ConvergenceDuplicateResolutionDecision): Promise<void>;
  saveReceiptStatusProjection(record: ReceiptStatusProjection): Promise<void>;
  saveOutcome(record: ConvergenceOutcome): Promise<void>;
  snapshots(): TelephonyConvergenceRepositorySnapshots;
}

function nowIso(): string {
  return new Date().toISOString();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function stableDigest(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableRef(prefix: string, value: unknown): string {
  return `${prefix}_${stableDigest(value).slice(0, 24)}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function compactReasonCodes(values: readonly (string | null | undefined | false)[]): string[] {
  return uniqueSorted(values.filter((value): value is string => typeof value === "string"));
}

function canonicalizeText(value: string | null | undefined): string {
  return (value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
}

function assertIso(value: string, field: string): string {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} must be a valid ISO timestamp.`);
  }
  return value;
}

function normalizeUnit(value: number | undefined, fallback: number): number {
  const candidate = value ?? fallback;
  return Math.min(1, Math.max(0, candidate));
}

function surfaceProfileFor(
  ingressChannel: ConvergenceIngressChannel,
  requested: ConvergenceSurfaceChannelProfile | null | undefined,
): ConvergenceSurfaceChannelProfile {
  if (requested) return requested;
  if (ingressChannel === "self_service_form") return "browser";
  if (ingressChannel === "telephony_capture") return "telephony";
  if (ingressChannel === "secure_link_continuation") return "secure_link";
  return "support_console";
}

function captureAuthorityFor(input: TelephonyConvergenceCommand): ConvergenceCaptureAuthorityClass {
  if (input.captureAuthorityClass) return input.captureAuthorityClass;
  if (input.ingressChannel === "self_service_form") return "patient_self_entered";
  if (input.ingressChannel === "secure_link_continuation") return "patient_verified_reply";
  if (input.ingressChannel === "support_assisted_capture") return "support_assisted";
  return "patient_spoken";
}

function promotionIntentFor(input: TelephonyConvergenceCommand): ConvergencePromotionIntentClass {
  if (input.promotionIntentClass) return input.promotionIntentClass;
  if (input.ingressChannel === "secure_link_continuation") return "continuation_append";
  if (input.ingressChannel === "support_assisted_capture") return "governed_submit";
  return "governed_submit";
}

function evidenceReadinessFor(
  input: TelephonyConvergenceCommand,
): ConvergenceEvidenceReadinessState {
  if (input.evidenceReadinessState) return input.evidenceReadinessState;
  const assessment = input.evidenceReadinessAssessment;
  if (!assessment)
    return input.ingressChannel === "telephony_capture" ? "evidence_pending" : "safety_usable";
  if (
    assessment.usabilityState === "awaiting_recording" ||
    assessment.usabilityState === "awaiting_transcript" ||
    assessment.usabilityState === "awaiting_structured_capture"
  ) {
    return "evidence_pending";
  }
  if (assessment.usabilityState === "urgent_live_only") return "urgent_live_only";
  if (assessment.usabilityState === "manual_review_only") return "manual_review_only";
  if (assessment.usabilityState === "unusable_terminal") return "unusable_terminal";
  return "safety_usable";
}

function normalizerEvidenceReadiness(
  state: ConvergenceEvidenceReadinessState,
): "urgent_live_only" | "safety_usable" | "manual_review_only" {
  if (state === "urgent_live_only") return "urgent_live_only";
  if (state === "safety_usable") return "safety_usable";
  return "manual_review_only";
}

function normalizerContactAuthorityState(
  state: ConvergenceContactAuthorityClass,
):
  | "verified"
  | "nhs_login_claim"
  | "verified_destination"
  | "support_attested"
  | "assumed_self_service_browser_minimum"
  | "rebind_required"
  | "blocked" {
  if (state === "authority_confirmed") return "verified";
  if (state === "nhs_login_claim") return "nhs_login_claim";
  if (state === "verified_destination") return "verified_destination";
  if (state === "support_attested") return "support_attested";
  return "assumed_self_service_browser_minimum";
}

function precedenceOrderFor(
  ingressChannel: ConvergenceIngressChannel,
): readonly (keyof ConvergenceStructuredAnswerSources & keyof ConvergenceNarrativeSources)[] {
  if (ingressChannel === "self_service_form") {
    return ["web", "continuation", "support", "keypad", "transcript", "spoken"];
  }
  if (ingressChannel === "secure_link_continuation") {
    return ["continuation", "web", "support", "keypad", "transcript", "spoken"];
  }
  if (ingressChannel === "support_assisted_capture") {
    return ["support", "continuation", "keypad", "transcript", "spoken", "web"];
  }
  return ["continuation", "keypad", "transcript", "spoken", "support", "web"];
}

function mergeStructuredAnswers(input: TelephonyConvergenceCommand): {
  answers: Record<string, unknown>;
  sources: Record<string, string>;
} {
  const answers: Record<string, unknown> = {};
  const sources: Record<string, string> = {};
  const answerSources = input.structuredAnswers ?? {};
  for (const sourceName of precedenceOrderFor(input.ingressChannel)) {
    const source = answerSources[sourceName] ?? {};
    for (const [key, value] of Object.entries(source)) {
      if (key in answers) continue;
      answers[key] = value;
      sources[key] = sourceName;
    }
  }
  return { answers, sources };
}

function mergeNarrative(input: TelephonyConvergenceCommand): {
  narrative: string;
  source: string;
} {
  const narratives = input.narratives ?? {};
  for (const sourceName of precedenceOrderFor(input.ingressChannel)) {
    const candidate = canonicalizeText(narratives[sourceName]);
    if (candidate.length > 0) {
      return { narrative: candidate, source: sourceName };
    }
  }
  return { narrative: "", source: "none" };
}

function receiptContractFor(input: {
  command: TelephonyConvergenceCommand;
  semanticMeaningHash: string;
  evidenceReadinessState: ConvergenceEvidenceReadinessState;
  duplicateDecisionClass: ConvergenceDuplicateDecisionClass | "pending";
}): ReceiptConsistencyKeyContract {
  const lineageConsistencySeed =
    input.command.receiptSeedRef?.trim() ||
    input.command.patientMatchConfidenceRef?.trim() ||
    input.command.sourceLineageRef;
  const base = {
    version: TELEPHONY_CONVERGENCE_RECEIPT_POLICY_VERSION,
    tenantId: input.command.tenantId,
    lineageConsistencySeed,
    requestType: input.command.requestType,
    semanticMeaningHash: input.semanticMeaningHash,
  };
  const receiptConsistencyKey = `receipt:v193:${stableDigest({ ...base, class: "receipt" }).slice(0, 32)}`;
  const statusConsistencyKey = `status:v193:${stableDigest({ ...base, class: "status" }).slice(0, 32)}`;
  const etaBucket =
    input.evidenceReadinessState === "urgent_live_only"
      ? "urgent_live"
      : input.evidenceReadinessState === "safety_usable"
        ? "same_day"
        : "manual_review";
  const promiseState =
    input.duplicateDecisionClass === "same_request_attach"
      ? "attached_no_new_receipt"
      : input.duplicateDecisionClass === "exact_retry_collapse"
        ? "retry_collapsed"
        : input.evidenceReadinessState === "evidence_pending"
          ? "received_pending_evidence"
          : input.evidenceReadinessState === "urgent_live_only"
            ? "urgent_live"
            : input.evidenceReadinessState === "safety_usable"
              ? "submitted"
              : "manual_review";
  const recoveryPosture =
    promiseState === "submitted"
      ? "track_status_available"
      : promiseState === "received_pending_evidence"
        ? "same_shell_pending"
        : promiseState === "urgent_live"
          ? "urgent_live_follow_up"
          : promiseState === "attached_no_new_receipt"
            ? "same_request_shell"
            : promiseState === "retry_collapsed"
              ? "same_request_shell"
              : "manual_follow_up";
  return {
    keyRef: stableRef("receipt_key_193", base),
    serializationVersion: TELEPHONY_CONVERGENCE_RECEIPT_POLICY_VERSION,
    receiptConsistencyKey,
    statusConsistencyKey,
    semanticMeaningHash: input.semanticMeaningHash,
    lineageConsistencySeed,
    etaBucket,
    promiseState,
    recoveryPosture,
  };
}

function duplicatePolicyFor(input: {
  command: TelephonyConvergenceCommand;
  snapshotRef: string;
  semanticHash: string;
  at: string;
}): {
  pairEvidence: ConvergenceDuplicatePairEvidence | null;
  decision: ConvergenceDuplicateResolutionDecision;
} {
  const probe = input.command.duplicateProbe;
  const relationClass = probe?.relationClass ?? "new_episode";
  const candidateRequestRef = probe?.candidateRequestRef ?? null;
  const candidateEpisodeRef = probe?.candidateEpisodeRef ?? null;
  const calibrated = probe?.calibratedForChannelMix ?? true;
  const explicitWitness = probe?.explicitContinuityWitness ?? false;
  const noDivergence = probe?.noMaterialDivergence ?? true;
  const channelCalibrationRef =
    probe?.channelCalibrationRef ?? TELEPHONY_CONVERGENCE_DUPLICATE_POLICY_VERSION;
  const hardBlockerRefs = uniqueSorted([
    ...(probe?.hardBlockerRefs ?? []),
    ...(!calibrated ? ["cross_channel_calibration_missing"] : []),
    ...(relationClass === "same_episode_confirmed" && !noDivergence
      ? ["same_request_attach_material_divergence"]
      : []),
  ]);

  const candidatePresent = candidateRequestRef !== null && candidateEpisodeRef !== null;
  const pairEvidence = candidatePresent
    ? ({
        pairEvidenceId: stableRef("duplicate_pair_193", {
          sourceLineageRef: input.command.sourceLineageRef,
          snapshot: input.snapshotRef,
          candidateRequestRef,
          relationClass,
        }),
        incomingLineageRef: input.command.sourceLineageRef,
        incomingSnapshotRef: input.snapshotRef,
        candidateRequestRef,
        candidateEpisodeRef,
        replaySignalRefs: relationClass === "retry" ? [input.command.idempotencyKey] : [],
        continuitySignalRefs:
          explicitWitness && probe?.continuityWitnessRef ? [probe.continuityWitnessRef] : [],
        conflictSignalRefs: hardBlockerRefs,
        relationModelVersionRef: TELEPHONY_CONVERGENCE_DUPLICATE_POLICY_VERSION,
        channelCalibrationRef,
        thresholdPolicyRef: "phase2-duplicate-thresholds-193.v1",
        featureVectorHash: stableDigest({
          relationClass,
          semanticHash: input.semanticHash,
          candidateRequestRef,
          channelCalibrationRef,
        }),
        piRetry: relationClass === "retry" ? 0.9996 : 0.001,
        piSameRequestAttach:
          relationClass === "same_episode_confirmed" && explicitWitness && noDivergence
            ? 0.996
            : relationClass === "same_episode_confirmed"
              ? 0.72
              : 0.001,
        piSameEpisode:
          relationClass === "same_episode_candidate"
            ? 0.82
            : relationClass === "same_episode_confirmed"
              ? 0.992
              : 0.001,
        piRelatedEpisode: relationClass === "related_episode" ? 0.96 : 0.001,
        piNewEpisode: relationClass === "new_episode" ? 0.99 : 0.001,
        classMargin: probe?.classMargin ?? (hardBlockerRefs.length > 0 ? 0.2 : 3.1),
        candidateMargin: probe?.candidateMargin ?? (hardBlockerRefs.length > 0 ? 0.2 : 3.2),
        uncertaintyScore: normalizeUnit(
          probe?.uncertaintyScore,
          hardBlockerRefs.length > 0 ? 0.44 : 0.08,
        ),
        hardBlockerRefs,
        evidenceState: "active",
        createdAt: input.at,
      } satisfies ConvergenceDuplicatePairEvidence)
    : null;

  const attachAllowed =
    relationClass === "same_episode_confirmed" &&
    explicitWitness &&
    noDivergence &&
    calibrated &&
    (probe?.continuityWitnessRef ?? null) !== null &&
    hardBlockerRefs.length === 0;
  const decisionClass: ConvergenceDuplicateDecisionClass =
    relationClass === "retry"
      ? "exact_retry_collapse"
      : relationClass === "same_episode_candidate" || !calibrated
        ? "review_required"
        : relationClass === "same_episode_confirmed"
          ? attachAllowed
            ? "same_request_attach"
            : "same_episode_link"
          : relationClass === "related_episode"
            ? "related_episode_link"
            : "separate_request";
  const continuityWitnessClass =
    decisionClass === "exact_retry_collapse"
      ? "deterministic_replay"
      : decisionClass === "same_request_attach"
        ? (probe?.continuityWitnessClass ?? "telephony_continuation")
        : decisionClass === "review_required" || decisionClass === "same_episode_link"
          ? "human_review"
          : "none";
  const continuityWitnessRef =
    decisionClass === "exact_retry_collapse"
      ? input.command.idempotencyKey
      : decisionClass === "same_request_attach"
        ? (probe?.continuityWitnessRef ?? null)
        : null;
  const decision: ConvergenceDuplicateResolutionDecision = {
    duplicateResolutionDecisionId: stableRef("duplicate_decision_193", {
      sourceLineageRef: input.command.sourceLineageRef,
      snapshot: input.snapshotRef,
      relationClass,
      decisionClass,
    }),
    incomingLineageRef: input.command.sourceLineageRef,
    incomingSnapshotRef: input.snapshotRef,
    targetRequestRef: candidateRequestRef,
    targetEpisodeRef: candidateEpisodeRef,
    winningPairEvidenceRef: pairEvidence?.pairEvidenceId ?? null,
    competingPairEvidenceRefs: uniqueSorted(probe?.competingCandidateRefs ?? []),
    relationClass,
    decisionClass,
    continuityWitnessClass,
    continuityWitnessRef,
    reviewMode:
      decisionClass === "exact_retry_collapse"
        ? "replay_authority"
        : decisionClass === "review_required"
          ? "human_review"
          : "auto",
    reasonCodes: compactReasonCodes([
      "TEL_CONV_193_DUPLICATE_POLICY_CHANNEL_AGNOSTIC",
      !calibrated && "TEL_CONV_193_CROSS_CHANNEL_CALIBRATION_FAIL_CLOSED",
      relationClass === "same_episode_confirmed" &&
        "TEL_CONV_193_SAME_REQUEST_ATTACH_REQUIRES_WITNESS",
      decisionClass === "same_request_attach" &&
        "TEL_CONV_193_SAME_REQUEST_ATTACH_NO_SECOND_PROMOTION_OR_RECEIPT",
    ]),
    decisionState: "applied",
    decidedByRef: TELEPHONY_CONVERGENCE_SERVICE_NAME,
    decidedAt: input.at,
  };
  return { pairEvidence, decision };
}

function promotionReadinessFor(input: {
  replayClassification: ConvergenceReplayClassification;
  evidenceReadinessState: ConvergenceEvidenceReadinessState;
  duplicateDecisionClass: ConvergenceDuplicateDecisionClass;
}): ConvergencePromotionReadiness {
  if (input.replayClassification === "collision_review") return "blocked_collision_review";
  if (input.duplicateDecisionClass === "exact_retry_collapse") return "retry_collapsed";
  if (input.duplicateDecisionClass === "same_request_attach") {
    return "same_request_attach_no_promotion";
  }
  if (input.evidenceReadinessState === "evidence_pending") return "hold_evidence_pending";
  if (input.evidenceReadinessState === "urgent_live_only") return "blocked_urgent_live";
  if (input.evidenceReadinessState === "manual_review_only") return "blocked_manual_review";
  if (input.evidenceReadinessState === "unusable_terminal") return "blocked_unusable_terminal";
  return "ready_to_promote";
}

function visibleProvenanceLabelFor(input: {
  ingressChannel: ConvergenceIngressChannel;
  captureAuthorityClass: ConvergenceCaptureAuthorityClass;
}): string {
  if (input.ingressChannel === "telephony_capture") return "Started by phone";
  if (input.ingressChannel === "secure_link_continuation") return "Continued through secure link";
  if (input.ingressChannel === "support_assisted_capture") {
    return input.captureAuthorityClass === "staff_transcribed"
      ? "Transcribed by support"
      : "Captured with support";
  }
  return "Started online";
}

function createReceiptStatusProjection(input: {
  ingressRecord: SubmissionIngressRecord;
  receiptKey: ReceiptConsistencyKeyContract;
  promotionReadiness: ConvergencePromotionReadiness;
  captureAuthorityClass: ConvergenceCaptureAuthorityClass;
  createdAt: string;
}): ReceiptStatusProjection {
  const promoted = input.promotionReadiness === "ready_to_promote";
  const attachOrRetry =
    input.promotionReadiness === "same_request_attach_no_promotion" ||
    input.promotionReadiness === "retry_collapsed";
  return {
    projectionRef: stableRef("receipt_status_projection_193", {
      ingressRecord: input.ingressRecord.ingressRecordId,
      receipt: input.receiptKey.receiptConsistencyKey,
      readiness: input.promotionReadiness,
    }),
    receiptConsistencyKey: input.receiptKey.receiptConsistencyKey,
    statusConsistencyKey: input.receiptKey.statusConsistencyKey,
    receiptIssued: promoted,
    submittedEventEmitted: promoted,
    intakeNormalizedEventEmitted: promoted && !attachOrRetry,
    promiseState:
      input.promotionReadiness === "blocked_collision_review"
        ? "collision_review"
        : input.receiptKey.promiseState,
    etaBucket: input.receiptKey.etaBucket,
    recoveryPosture:
      input.promotionReadiness === "blocked_collision_review"
        ? "review_required"
        : input.receiptKey.recoveryPosture,
    visibleProvenanceLabel: visibleProvenanceLabelFor({
      ingressChannel: input.ingressRecord.ingressChannel,
      captureAuthorityClass: input.captureAuthorityClass,
    }),
    createdAt: input.createdAt,
  };
}

function createChannelParityProjection(input: {
  ingressRecord: SubmissionIngressRecord;
  normalized: NormalizedSubmissionSnapshot;
  receiptKey: ReceiptConsistencyKeyContract;
}): ChannelParityProjection {
  const sameFactsSameSafetyKey = stableDigest({
    requestType: input.normalized.requestType,
    normalizedHash: input.normalized.normalizedHash,
    evidenceReadinessState: input.normalized.evidenceReadinessState,
  });
  return {
    projectionRef: stableRef("channel_parity_projection_193", {
      ingressRecord: input.ingressRecord.ingressRecordId,
      normalized: input.normalized.normalizedSubmissionId,
    }),
    schemaVersion: TELEPHONY_CONVERGENCE_SCHEMA_VERSION,
    ingressRecordRef: input.ingressRecord.ingressRecordId,
    normalizedSubmissionRef: input.normalized.normalizedSubmissionId,
    ingressChannel: input.ingressRecord.ingressChannel,
    surfaceChannelProfile: input.ingressRecord.surfaceChannelProfile,
    canonicalMeaningHash: input.normalized.normalizedHash,
    canonicalDedupeFingerprint: input.normalized.dedupeFingerprint,
    sameFactsSameSafetyKey,
    receiptConsistencyKey: input.receiptKey.receiptConsistencyKey,
    statusConsistencyKey: input.receiptKey.statusConsistencyKey,
    provenanceVisible: true,
    channelSpecificRequestModel: false,
    reasonCodes: [
      "TEL_CONV_193_NORMALIZED_SUBMISSION_CANONICAL",
      "TEL_CONV_193_RECEIPT_STATUS_KEYS_CHANNEL_NEUTRAL",
    ],
  };
}

export function createInMemoryTelephonyConvergenceRepository(): TelephonyConvergenceRepository {
  const captureBundles = new Map<string, FrozenTelephonyCaptureBundle>();
  const evidenceSnapshots = new Map<string, TelephonyEvidenceSnapshot>();
  const ingressRecords = new Map<string, SubmissionIngressRecord>();
  const duplicatePairEvidences = new Map<string, ConvergenceDuplicatePairEvidence>();
  const duplicateResolutionDecisions = new Map<string, ConvergenceDuplicateResolutionDecision>();
  const receiptStatusProjections = new Map<string, ReceiptStatusProjection>();
  const outcomes = new Map<string, ConvergenceOutcome>();
  const outcomeByIdempotency = new Map<string, string>();
  const outcomeByReplayKey = new Map<string, string>();
  const collisionByIdempotencyAndHash = new Map<string, string>();
  const envelopeBySourceLineage = new Map<string, string>();
  const currentIngressByEnvelope = new Map<string, string>();

  return {
    async getOutcomeByIdempotencyKey(idempotencyKey) {
      const ref = outcomeByIdempotency.get(idempotencyKey);
      return ref ? clone(outcomes.get(ref) ?? null) : null;
    },
    async getOutcomeByReplayKey(replayKey) {
      const ref = outcomeByReplayKey.get(replayKey);
      return ref ? clone(outcomes.get(ref) ?? null) : null;
    },
    async getCollisionOutcome(idempotencyKey, sourceHash) {
      const ref = collisionByIdempotencyAndHash.get(`${idempotencyKey}::${sourceHash}`);
      return ref ? clone(outcomes.get(ref) ?? null) : null;
    },
    async getOutcomeByRef(convergenceOutcomeRef) {
      return clone(outcomes.get(convergenceOutcomeRef) ?? null);
    },
    async getEnvelopeRefBySourceLineage(sourceLineageRef) {
      return envelopeBySourceLineage.get(sourceLineageRef) ?? null;
    },
    async getCurrentIngressForEnvelope(submissionEnvelopeRef) {
      const ref = currentIngressByEnvelope.get(submissionEnvelopeRef);
      return ref ? clone(ingressRecords.get(ref) ?? null) : null;
    },
    async saveEnvelopeMapping(sourceLineageRef, submissionEnvelopeRef) {
      envelopeBySourceLineage.set(sourceLineageRef, submissionEnvelopeRef);
    },
    async saveCaptureBundle(record) {
      captureBundles.set(record.captureBundleRef, clone(record));
    },
    async saveEvidenceSnapshot(record) {
      evidenceSnapshots.set(record.evidenceSnapshotRef, clone(record));
    },
    async saveIngressRecord(record) {
      ingressRecords.set(record.ingressRecordId, clone(record));
      currentIngressByEnvelope.set(record.submissionEnvelopeRef, record.ingressRecordId);
    },
    async saveDuplicatePairEvidence(record) {
      duplicatePairEvidences.set(record.pairEvidenceId, clone(record));
    },
    async saveDuplicateResolutionDecision(record) {
      duplicateResolutionDecisions.set(record.duplicateResolutionDecisionId, clone(record));
    },
    async saveReceiptStatusProjection(record) {
      receiptStatusProjections.set(record.projectionRef, clone(record));
    },
    async saveOutcome(record) {
      outcomes.set(record.convergenceOutcomeRef, clone(record));
      if (record.replayClassification === "collision_review") {
        collisionByIdempotencyAndHash.set(
          `${record.idempotencyKey}::${record.captureBundle.sourceHash}`,
          record.convergenceOutcomeRef,
        );
      } else {
        outcomeByIdempotency.set(record.idempotencyKey, record.convergenceOutcomeRef);
        outcomeByReplayKey.set(record.captureBundle.replayKey, record.convergenceOutcomeRef);
      }
    },
    snapshots() {
      return clone({
        captureBundles: [...captureBundles.values()],
        evidenceSnapshots: [...evidenceSnapshots.values()],
        ingressRecords: [...ingressRecords.values()],
        duplicatePairEvidences: [...duplicatePairEvidences.values()],
        duplicateResolutionDecisions: [...duplicateResolutionDecisions.values()],
        receiptStatusProjections: [...receiptStatusProjections.values()],
        outcomes: [...outcomes.values()],
      });
    },
  };
}

function replayedOutcome(
  outcome: ConvergenceOutcome,
  replayClassification: Exclude<ConvergenceReplayClassification, "new_command">,
): ConvergenceOutcome {
  const reasonCode =
    replayClassification === "exact_replay"
      ? "TEL_CONV_193_EXACT_REPLAY_RETURNED"
      : replayClassification === "semantic_replay"
        ? "TEL_CONV_193_SEMANTIC_REPLAY_RETURNED"
        : "TEL_CONV_193_COLLISION_REVIEW_FROZEN";
  return {
    ...outcome,
    replayClassification,
    replayed: true,
    sideEffects: {
      createdCaptureBundle: false,
      createdEvidenceSnapshot: false,
      createdIngressRecord: false,
      createdNormalizedSubmission: false,
      createdPromotion: false,
      createdReceipt: false,
    },
    reasonCodes: compactReasonCodes([...outcome.reasonCodes, reasonCode]),
  };
}

export class TelephonyConvergencePipelineService {
  constructor(
    private readonly repository: TelephonyConvergenceRepository,
    private readonly submissionBackbone: SubmissionBackboneApplication,
    private readonly normalizedSubmission: NormalizedSubmissionApplication,
  ) {}

  async submitConvergenceCommand(
    command: TelephonyConvergenceCommand,
  ): Promise<ConvergenceOutcome> {
    const at = assertIso(command.observedAt ?? nowIso(), "observedAt");
    const surfaceChannelProfile = surfaceProfileFor(
      command.ingressChannel,
      command.surfaceChannelProfile,
    );
    const captureAuthorityClass = captureAuthorityFor(command);
    const promotionIntentClass = promotionIntentFor(command);
    const evidenceReadinessState = evidenceReadinessFor(command);
    const { answers, sources } = mergeStructuredAnswers(command);
    const narrative = mergeNarrative(command);
    const sourceHash = stableDigest({
      commandId: command.commandId,
      idempotencyKey: command.idempotencyKey,
      sourceLineageRef: command.sourceLineageRef,
      ingressChannel: command.ingressChannel,
      surfaceChannelProfile,
      captureAuthorityClass,
      requestType: command.requestType,
      narratives: command.narratives ?? {},
      structuredAnswers: command.structuredAnswers ?? {},
      attachmentRefs: command.attachmentRefs ?? [],
      audioRefs: command.audioRefs ?? [],
      sourceTimestamp: command.sourceTimestamp,
    });
    const semanticHash = stableDigest({
      requestType: command.requestType,
      answers,
      narrative: narrative.narrative,
      attachmentRefs: uniqueSorted(command.attachmentRefs ?? []),
      contactPreferencesRef: command.contactPreferencesRef ?? null,
      patientMatchConfidenceRef: command.patientMatchConfidenceRef ?? null,
    });
    const replayKey = stableDigest({
      sourceLineageRef: command.sourceLineageRef,
      semanticHash,
      receiptSeedRef: command.receiptSeedRef ?? null,
    });

    const priorByIdempotency = await this.repository.getOutcomeByIdempotencyKey(
      command.idempotencyKey,
    );
    if (priorByIdempotency) {
      if (priorByIdempotency.captureBundle.sourceHash === sourceHash) {
        return replayedOutcome(priorByIdempotency, "exact_replay");
      }
      const collision = await this.repository.getCollisionOutcome(
        command.idempotencyKey,
        sourceHash,
      );
      if (collision) return replayedOutcome(collision, "collision_review");
      return await this.materializeOutcome({
        command,
        at,
        replayClassification: "collision_review",
        surfaceChannelProfile,
        captureAuthorityClass,
        promotionIntentClass,
        evidenceReadinessState,
        answers,
        answerSources: sources,
        narrative,
        sourceHash,
        semanticHash,
        replayKey,
        reasonCodes: ["TEL_CONV_193_COLLISION_REVIEW_FROZEN"],
      });
    }

    const semanticReplay = await this.repository.getOutcomeByReplayKey(replayKey);
    if (semanticReplay) return replayedOutcome(semanticReplay, "semantic_replay");

    return await this.materializeOutcome({
      command,
      at,
      replayClassification: "new_command",
      surfaceChannelProfile,
      captureAuthorityClass,
      promotionIntentClass,
      evidenceReadinessState,
      answers,
      answerSources: sources,
      narrative,
      sourceHash,
      semanticHash,
      replayKey,
      reasonCodes: [],
    });
  }

  async resumePausedIngress(input: ResumePausedIngressInput): Promise<ConvergenceOutcome> {
    const priorReplay = await this.repository.getOutcomeByIdempotencyKey(
      input.resumeIdempotencyKey,
    );
    if (priorReplay) return replayedOutcome(priorReplay, "exact_replay");
    const prior = await this.repository.getOutcomeByRef(input.convergenceOutcomeRef);
    if (!prior) {
      throw new Error(`Missing convergence outcome ${input.convergenceOutcomeRef}`);
    }
    if (prior.promotionRecord) return replayedOutcome(prior, "semantic_replay");
    if (input.evidenceReadinessAssessment.usabilityState !== "safety_usable") {
      return replayedOutcome(prior, "semantic_replay");
    }

    const at = assertIso(input.observedAt ?? nowIso(), "observedAt");
    const supersedingIngress: SubmissionIngressRecord = {
      ...prior.ingressRecord,
      ingressRecordId: stableRef("ingress_193", {
        prior: prior.ingressRecord.ingressRecordId,
        readiness: input.evidenceReadinessAssessment.telephonyEvidenceReadinessAssessmentRef,
      }),
      evidenceReadinessState: "safety_usable",
      evidenceReadinessRef:
        input.evidenceReadinessAssessment.telephonyEvidenceReadinessAssessmentRef,
      supersedesIngressRecordRef: prior.ingressRecord.ingressRecordId,
      createdAt: at,
    };
    await this.repository.saveIngressRecord(supersedingIngress);
    await this.submissionBackbone.commands.appendEnvelopeIngress({
      envelopeId: supersedingIngress.submissionEnvelopeRef,
      ingressRecordRef: supersedingIngress.ingressRecordId,
      updatedAt: at,
    });
    await this.submissionBackbone.commands.markEnvelopeReady({
      envelopeId: supersedingIngress.submissionEnvelopeRef,
      promotionDecisionRef: stableRef("promotion_decision_193", {
        ingress: supersedingIngress.ingressRecordId,
      }),
      updatedAt: at,
    });
    const promoted = await this.submissionBackbone.commands.promoteEnvelope({
      envelopeId: supersedingIngress.submissionEnvelopeRef,
      promotedAt: at,
      tenantId: prior.receiptKey.lineageConsistencySeed,
      requestType: prior.normalizedSubmission.requestType,
      episodeFingerprint: stableDigest({
        requestType: prior.normalizedSubmission.requestType,
        dedupe: prior.normalizedSubmission.dedupeFingerprint,
      }),
      promotionCommandActionRecordRef: stableRef("promotion_action_193", {
        ingress: supersedingIngress.ingressRecordId,
      }),
      promotionCommandSettlementRecordRef: stableRef("promotion_settlement_193", {
        ingress: supersedingIngress.ingressRecordId,
      }),
      receiptConsistencyKey: prior.receiptKey.receiptConsistencyKey,
      statusConsistencyKey: prior.receiptKey.statusConsistencyKey,
      attachmentRefs: prior.normalizedSubmission.attachmentRefs,
      contactPreferencesRef: prior.normalizedSubmission.contactPreferencesRef,
    });
    const promotionSnapshot = promoted.promotionRecord.toSnapshot();
    const promotionRecord = {
      promotionRecordRef: promotionSnapshot.promotionRecordId,
      requestRef: promotionSnapshot.requestRef,
      requestLineageRef: promotionSnapshot.requestLineageRef,
      submittedEventEmitted: true,
      intakeNormalizedEventEmitted: true,
    };
    const receiptStatusProjection = createReceiptStatusProjection({
      ingressRecord: supersedingIngress,
      receiptKey: {
        ...prior.receiptKey,
        promiseState: "submitted",
        etaBucket: "same_day",
        recoveryPosture: "track_status_available",
      },
      promotionReadiness: "ready_to_promote",
      captureAuthorityClass: supersedingIngress.captureAuthorityClass,
      createdAt: at,
    });
    const outcome: ConvergenceOutcome = {
      ...prior,
      convergenceOutcomeRef: stableRef("convergence_outcome_193", {
        resume: input.resumeIdempotencyKey,
        prior: prior.convergenceOutcomeRef,
      }),
      idempotencyKey: input.resumeIdempotencyKey,
      replayClassification: "new_command",
      replayed: false,
      ingressRecord: supersedingIngress,
      promotionReadiness: "ready_to_promote",
      promotionRecord,
      receiptStatusProjection,
      sideEffects: {
        createdCaptureBundle: false,
        createdEvidenceSnapshot: false,
        createdIngressRecord: true,
        createdNormalizedSubmission: false,
        createdPromotion: true,
        createdReceipt: true,
      },
      reasonCodes: compactReasonCodes([
        ...prior.reasonCodes,
        "TEL_CONV_193_LATE_READINESS_RESUMED_FROM_FROZEN_INGRESS",
        "TEL_CONV_193_EXACT_ONCE_PROMOTION",
      ]),
      createdAt: at,
    };
    await this.repository.saveReceiptStatusProjection(receiptStatusProjection);
    await this.repository.saveOutcome(outcome);
    return outcome;
  }

  private async materializeOutcome(input: {
    command: TelephonyConvergenceCommand;
    at: string;
    replayClassification: ConvergenceReplayClassification;
    surfaceChannelProfile: ConvergenceSurfaceChannelProfile;
    captureAuthorityClass: ConvergenceCaptureAuthorityClass;
    promotionIntentClass: ConvergencePromotionIntentClass;
    evidenceReadinessState: ConvergenceEvidenceReadinessState;
    answers: Record<string, unknown>;
    answerSources: Record<string, string>;
    narrative: { narrative: string; source: string };
    sourceHash: string;
    semanticHash: string;
    replayKey: string;
    reasonCodes: readonly string[];
  }): Promise<ConvergenceOutcome> {
    const envelopeRef = await this.ensureSubmissionEnvelope(input);
    const normalizedSubmissionRef = stableRef("normalized_submission_193", {
      sourceLineageRef: input.command.sourceLineageRef,
      semanticHash: input.semanticHash,
      replayClassification: input.replayClassification,
    });
    const receiptKey = receiptContractFor({
      command: input.command,
      semanticMeaningHash: input.semanticHash,
      evidenceReadinessState: input.evidenceReadinessState,
      duplicateDecisionClass: "pending",
    });
    const captureBundle: FrozenTelephonyCaptureBundle = {
      captureBundleRef: stableRef("capture_bundle_193", {
        sourceLineageRef: input.command.sourceLineageRef,
        sourceHash: input.sourceHash,
      }),
      schemaVersion: TELEPHONY_CONVERGENCE_SCHEMA_VERSION,
      commandId: input.command.commandId,
      idempotencyKey: input.command.idempotencyKey,
      sourceLineageRef: input.command.sourceLineageRef,
      ingressChannel: input.command.ingressChannel,
      surfaceChannelProfile: input.surfaceChannelProfile,
      captureAuthorityClass: input.captureAuthorityClass,
      requestType: input.command.requestType,
      sourceHash: input.sourceHash,
      semanticHash: input.semanticHash,
      replayKey: input.replayKey,
      fieldSourceManifest: input.answerSources,
      narrativeSource: input.narrative.source,
      attachmentRefs: uniqueSorted(input.command.attachmentRefs ?? []),
      audioRefs: uniqueSorted(input.command.audioRefs ?? []),
      sourceTimestamp: assertIso(input.command.sourceTimestamp, "sourceTimestamp"),
      frozenAt: input.at,
      recordedBy: TELEPHONY_CONVERGENCE_SERVICE_NAME,
    };
    const evidenceSnapshot: TelephonyEvidenceSnapshot = {
      evidenceSnapshotRef: stableRef("evidence_snapshot_193", {
        captureBundle: captureBundle.captureBundleRef,
        semanticHash: input.semanticHash,
      }),
      schemaVersion: TELEPHONY_CONVERGENCE_SCHEMA_VERSION,
      captureBundleRef: captureBundle.captureBundleRef,
      sourceLineageRef: input.command.sourceLineageRef,
      ingressChannel: input.command.ingressChannel,
      governingInputRefs: uniqueSorted([
        captureBundle.captureBundleRef,
        ...(input.command.evidenceReadinessAssessment
          ? [input.command.evidenceReadinessAssessment.telephonyEvidenceReadinessAssessmentRef]
          : []),
      ]),
      evidenceReadinessState: input.evidenceReadinessState,
      normalizedInputHash: input.semanticHash,
      sourceHash: input.sourceHash,
      semanticHash: input.semanticHash,
      createdAt: input.at,
      recordedBy: TELEPHONY_CONVERGENCE_SERVICE_NAME,
    };
    const previousIngress = await this.repository.getCurrentIngressForEnvelope(envelopeRef);
    const ingressRecord: SubmissionIngressRecord = {
      ingressRecordId: stableRef("ingress_193", {
        envelopeRef,
        captureBundle: captureBundle.captureBundleRef,
      }),
      schemaVersion: TELEPHONY_CONVERGENCE_SCHEMA_VERSION,
      submissionEnvelopeRef: envelopeRef,
      requestLineageRef: input.command.requestLineageRef ?? null,
      intakeConvergenceContractRef:
        input.command.ingressChannel === "secure_link_continuation"
          ? "ICC_193_SECURE_LINK_CONTINUATION_V1"
          : input.command.ingressChannel === "support_assisted_capture"
            ? "ICC_193_SUPPORT_ASSISTED_CAPTURE_V1"
            : input.command.ingressChannel === "telephony_capture"
              ? "ICC_193_TELEPHONY_CAPTURE_V1"
              : "ICC_193_SELF_SERVICE_FORM_V1",
      sourceLineageRef: input.command.sourceLineageRef,
      ingressChannel: input.command.ingressChannel,
      surfaceChannelProfile: input.surfaceChannelProfile,
      captureAuthorityClass: input.captureAuthorityClass,
      promotionIntentClass: input.promotionIntentClass,
      channelCapabilityCeiling: input.command.channelCapabilityCeiling,
      contactAuthorityClass: input.command.contactAuthorityClass,
      identityEvidenceRefs: uniqueSorted(input.command.identityContext.identityEvidenceRefs),
      contactRouteEvidenceRefs: uniqueSorted(
        input.command.identityContext.contactRouteEvidenceRefs,
      ),
      evidenceReadinessState: input.evidenceReadinessState,
      evidenceReadinessRef:
        input.command.evidenceReadinessAssessment?.telephonyEvidenceReadinessAssessmentRef ?? null,
      normalizedSubmissionRef,
      transportCorrelationId: input.command.commandId,
      channelPayloadRef: captureBundle.captureBundleRef,
      channelPayloadHash: input.sourceHash,
      receiptConsistencyKey: receiptKey.receiptConsistencyKey,
      statusConsistencyKey: receiptKey.statusConsistencyKey,
      supersedesIngressRecordRef: previousIngress?.ingressRecordId ?? null,
      createdAt: input.at,
      recordedBy: TELEPHONY_CONVERGENCE_SERVICE_NAME,
    };

    await this.repository.saveCaptureBundle(captureBundle);
    await this.repository.saveEvidenceSnapshot(evidenceSnapshot);
    await this.repository.saveIngressRecord(ingressRecord);
    await this.submissionBackbone.commands.appendEnvelopeIngress({
      envelopeId: envelopeRef,
      ingressRecordRef: ingressRecord.ingressRecordId,
      updatedAt: input.at,
    });
    await this.submissionBackbone.commands.attachEnvelopeEvidence({
      envelopeId: envelopeRef,
      evidenceSnapshotRef: evidenceSnapshot.evidenceSnapshotRef,
      updatedAt: input.at,
    });

    const normalizedInput: CreateNormalizedSubmissionInput = {
      normalizedSubmissionId: normalizedSubmissionRef,
      governingSnapshotRef: evidenceSnapshot.evidenceSnapshotRef,
      primaryIngressRecordRef: ingressRecord.ingressRecordId,
      freeze: {
        submissionSnapshotFreezeRef: stableRef("submission_snapshot_freeze_193", {
          evidenceSnapshot: evidenceSnapshot.evidenceSnapshotRef,
        }),
        submissionEnvelopeRef: envelopeRef,
        sourceLineageRef: input.command.sourceLineageRef,
        draftPublicId: stableRef("draft_193", input.command.sourceLineageRef),
        requestType: input.command.requestType,
        intakeExperienceBundleRef: "IEB_140_BROWSER_STANDARD_V1",
        activeQuestionKeys: Object.keys(input.answers).sort((left, right) =>
          left.localeCompare(right),
        ),
        activeStructuredAnswers: input.answers,
        freeTextNarrative: input.narrative.narrative,
        attachmentRefs: captureBundle.attachmentRefs,
        audioRefs: captureBundle.audioRefs,
        contactPreferencesRef: input.command.contactPreferencesRef ?? null,
        routeFamilyRef: input.command.routeFamilyRef ?? "rf_intake_convergence_193",
        routeIntentBindingRef: input.command.routeIntentBindingRef ?? "RIB_193_INTAKE_CONVERGENCE",
        audienceSurfaceRuntimeBindingRef:
          input.command.audienceSurfaceRuntimeBindingRef ?? "ASRB_193_CANONICAL_INTAKE",
        releaseApprovalFreezeRef:
          input.command.releaseApprovalFreezeRef ?? "release_freeze_phase2_convergence_193",
        channelReleaseFreezeState: "monitoring",
        manifestVersionRef: input.command.manifestVersionRef ?? "manifest_phase2_convergence_193",
        sessionEpochRef: input.command.sessionEpochRef ?? null,
        surfaceChannelProfile: input.surfaceChannelProfile,
        ingressChannel: input.command.ingressChannel,
        intakeConvergenceContractRef: ingressRecord.intakeConvergenceContractRef,
        sourceHash: input.sourceHash,
        semanticHash: input.semanticHash,
        evidenceCaptureBundleRef: captureBundle.captureBundleRef,
        frozenAt: input.at,
        identityContext: {
          bindingState: input.command.identityContext.bindingState,
          subjectRefPresence: input.command.identityContext.subjectRefPresence,
          claimResumeState: input.command.identityContext.claimResumeState,
          actorBindingState: input.command.identityContext.actorBindingState,
        },
        channelCapabilityCeiling: {
          canUploadFiles: input.command.channelCapabilityCeiling.canUploadFiles,
          canRenderTrackStatus: input.command.channelCapabilityCeiling.canRenderTrackStatus,
          canRenderEmbedded: input.command.channelCapabilityCeiling.canRenderEmbedded,
          mutatingResumeState: input.command.channelCapabilityCeiling.mutatingResumeState,
        },
        contactAuthorityState: normalizerContactAuthorityState(input.command.contactAuthorityClass),
        contactAuthorityPolicyRef: "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_CONTACT_AUTHORITY_V1",
        evidenceReadinessStateOverride: normalizerEvidenceReadiness(input.evidenceReadinessState),
      },
      requestLineageRef: input.command.requestLineageRef ?? null,
      patientMatchConfidenceRef: input.command.patientMatchConfidenceRef ?? null,
      createdAt: input.at,
    };
    const normalized = await this.normalizedSubmission.normalizeAndPersist(normalizedInput);
    const normalizedSnapshot = normalized.toSnapshot();
    const duplicate = duplicatePolicyFor({
      command: input.command,
      snapshotRef: evidenceSnapshot.evidenceSnapshotRef,
      semanticHash: normalizedSnapshot.normalizedHash,
      at: input.at,
    });
    if (duplicate.pairEvidence) {
      await this.repository.saveDuplicatePairEvidence(duplicate.pairEvidence);
    }
    await this.repository.saveDuplicateResolutionDecision(duplicate.decision);
    await this.submissionBackbone.commands.attachEnvelopeNormalization({
      envelopeId: envelopeRef,
      normalizedSubmissionRef: normalizedSnapshot.normalizedSubmissionId,
      updatedAt: input.at,
      candidateEpisodeRef:
        duplicate.decision.decisionClass === "same_episode_link" ||
        duplicate.decision.decisionClass === "review_required"
          ? duplicate.decision.targetEpisodeRef
          : null,
      candidateRequestRef:
        duplicate.decision.decisionClass === "same_episode_link" ||
        duplicate.decision.decisionClass === "review_required"
          ? duplicate.decision.targetRequestRef
          : null,
    });

    const settledReceiptKey = receiptContractFor({
      command: input.command,
      semanticMeaningHash: input.semanticHash,
      evidenceReadinessState: input.evidenceReadinessState,
      duplicateDecisionClass: duplicate.decision.decisionClass,
    });
    const promotionReadiness = promotionReadinessFor({
      replayClassification: input.replayClassification,
      evidenceReadinessState: input.evidenceReadinessState,
      duplicateDecisionClass: duplicate.decision.decisionClass,
    });
    let promotionRecord: ConvergenceOutcome["promotionRecord"] = null;
    let promotionReplayed = false;
    if (promotionReadiness === "ready_to_promote") {
      await this.submissionBackbone.commands.markEnvelopeReady({
        envelopeId: envelopeRef,
        promotionDecisionRef: stableRef("promotion_decision_193", {
          ingress: ingressRecord.ingressRecordId,
        }),
        updatedAt: input.at,
      });
      const promoted = await this.submissionBackbone.commands.promoteEnvelope({
        envelopeId: envelopeRef,
        promotedAt: input.at,
        tenantId: input.command.tenantId,
        requestType: input.command.requestType,
        episodeFingerprint: stableDigest({
          requestType: input.command.requestType,
          dedupeFingerprint: normalizedSnapshot.dedupeFingerprint,
          patientMatchConfidenceRef: input.command.patientMatchConfidenceRef ?? null,
          duplicateDecisionClass: duplicate.decision.decisionClass,
        }),
        promotionCommandActionRecordRef: stableRef("promotion_action_193", {
          ingress: ingressRecord.ingressRecordId,
        }),
        promotionCommandSettlementRecordRef: stableRef("promotion_settlement_193", {
          ingress: ingressRecord.ingressRecordId,
        }),
        intakeExperienceBundleRef: normalizedSnapshot.intakeExperienceBundleRef,
        receiptConsistencyKey: settledReceiptKey.receiptConsistencyKey,
        statusConsistencyKey: settledReceiptKey.statusConsistencyKey,
        supersededAccessGrantRefs: input.command.supersededAccessGrantRefs ?? [],
        supersededDraftLeaseRefs: input.command.supersededDraftLeaseRefs ?? [],
        narrativeRef: normalizedSnapshot.narrativeRef,
        structuredDataRef: normalizedSnapshot.structuredAnswersRef,
        attachmentRefs: normalizedSnapshot.attachmentRefs,
        contactPreferencesRef: normalizedSnapshot.contactPreferencesRef,
      });
      promotionReplayed = promoted.replayed;
      const promotionSnapshot = promoted.promotionRecord.toSnapshot();
      promotionRecord = {
        promotionRecordRef: promotionSnapshot.promotionRecordId,
        requestRef: promotionSnapshot.requestRef,
        requestLineageRef: promotionSnapshot.requestLineageRef,
        submittedEventEmitted: !promotionReplayed,
        intakeNormalizedEventEmitted: !promotionReplayed,
      };
    }
    const rawReceiptStatusProjection = createReceiptStatusProjection({
      ingressRecord,
      receiptKey: settledReceiptKey,
      promotionReadiness,
      captureAuthorityClass: input.captureAuthorityClass,
      createdAt: input.at,
    });
    const receiptStatusProjection: ReceiptStatusProjection = promotionReplayed
      ? {
          ...rawReceiptStatusProjection,
          receiptIssued: false,
          submittedEventEmitted: false,
          intakeNormalizedEventEmitted: false,
        }
      : rawReceiptStatusProjection;
    const channelParityProjection = createChannelParityProjection({
      ingressRecord,
      normalized: normalizedSnapshot,
      receiptKey: settledReceiptKey,
    });
    const outcome: ConvergenceOutcome = {
      convergenceOutcomeRef: stableRef("convergence_outcome_193", {
        idempotencyKey: input.command.idempotencyKey,
        captureBundle: captureBundle.captureBundleRef,
        replayClassification: input.replayClassification,
      }),
      schemaVersion: TELEPHONY_CONVERGENCE_SCHEMA_VERSION,
      idempotencyKey: input.command.idempotencyKey,
      replayClassification: input.replayClassification,
      replayed: false,
      captureBundle,
      evidenceSnapshot,
      ingressRecord: {
        ...ingressRecord,
        receiptConsistencyKey: settledReceiptKey.receiptConsistencyKey,
        statusConsistencyKey: settledReceiptKey.statusConsistencyKey,
      },
      normalizedSubmission: normalizedSnapshot,
      duplicatePairEvidences: duplicate.pairEvidence ? [duplicate.pairEvidence] : [],
      duplicateResolutionDecision: duplicate.decision,
      promotionReadiness,
      promotionRecord,
      attachedToRequestRef:
        duplicate.decision.decisionClass === "same_request_attach"
          ? duplicate.decision.targetRequestRef
          : null,
      receiptKey: settledReceiptKey,
      receiptStatusProjection,
      channelParityProjection,
      sideEffects: {
        createdCaptureBundle: true,
        createdEvidenceSnapshot: true,
        createdIngressRecord: true,
        createdNormalizedSubmission: true,
        createdPromotion: promotionRecord !== null && !promotionReplayed,
        createdReceipt: receiptStatusProjection.receiptIssued,
      },
      reasonCodes: compactReasonCodes([
        "TEL_CONV_193_FREEZE_BEFORE_NORMALIZE",
        "TEL_CONV_193_CANONICAL_SUBMISSION_INGRESS_CREATED",
        "TEL_CONV_193_NORMALIZED_SUBMISSION_CANONICAL",
        "TEL_CONV_193_FIELD_PRECEDENCE_FROZEN",
        "TEL_CONV_193_RECEIPT_STATUS_KEYS_CHANNEL_NEUTRAL",
        promotionRecord && "TEL_CONV_193_EXACT_ONCE_PROMOTION",
        input.evidenceReadinessState === "evidence_pending" &&
          "TEL_CONV_193_EVIDENCE_PENDING_BLOCKS_ROUTINE_PROMOTION",
        input.evidenceReadinessState === "urgent_live_only" &&
          "TEL_CONV_193_URGENT_LIVE_BLOCKS_ROUTINE_PROMOTION",
        input.evidenceReadinessState === "manual_review_only" &&
          "TEL_CONV_193_MANUAL_REVIEW_BLOCKS_ROUTINE_PROMOTION",
        input.command.ingressChannel === "support_assisted_capture" &&
          "TEL_CONV_193_SUPPORT_ASSISTED_SHARED_PATH",
        ...duplicate.decision.reasonCodes,
        ...input.reasonCodes,
      ]),
      createdAt: input.at,
      recordedBy: TELEPHONY_CONVERGENCE_SERVICE_NAME,
    };
    await this.repository.saveReceiptStatusProjection(receiptStatusProjection);
    await this.repository.saveOutcome(outcome);
    return outcome;
  }

  private async ensureSubmissionEnvelope(input: {
    command: TelephonyConvergenceCommand;
    at: string;
    surfaceChannelProfile: ConvergenceSurfaceChannelProfile;
    replayClassification: ConvergenceReplayClassification;
    sourceHash: string;
  }): Promise<string> {
    if (input.replayClassification === "collision_review") {
      const envelope = await this.submissionBackbone.commands.createEnvelope({
        sourceChannel: input.command.ingressChannel,
        initialSurfaceChannelProfile: input.surfaceChannelProfile,
        intakeConvergenceContractRef: "ICC_193_COLLISION_REVIEW_V1",
        sourceLineageRef: `${input.command.sourceLineageRef}:collision:${input.sourceHash.slice(0, 12)}`,
        createdAt: input.at,
      });
      return envelope.envelope.envelopeId;
    }

    const supplied = input.command.submissionEnvelopeRef?.trim();
    const existing =
      supplied ??
      (await this.repository.getEnvelopeRefBySourceLineage(input.command.sourceLineageRef));
    if (existing) return existing;

    const envelope = await this.submissionBackbone.commands.createEnvelope({
      sourceChannel: input.command.ingressChannel,
      initialSurfaceChannelProfile: input.surfaceChannelProfile,
      intakeConvergenceContractRef:
        input.command.ingressChannel === "secure_link_continuation"
          ? "ICC_193_SECURE_LINK_CONTINUATION_V1"
          : input.command.ingressChannel === "support_assisted_capture"
            ? "ICC_193_SUPPORT_ASSISTED_CAPTURE_V1"
            : input.command.ingressChannel === "telephony_capture"
              ? "ICC_193_TELEPHONY_CAPTURE_V1"
              : "ICC_193_SELF_SERVICE_FORM_V1",
      sourceLineageRef: input.command.sourceLineageRef,
      createdAt: input.at,
    });
    await this.repository.saveEnvelopeMapping(
      input.command.sourceLineageRef,
      envelope.envelope.envelopeId,
    );
    return envelope.envelope.envelopeId;
  }
}

export interface TelephonyConvergenceApplication {
  readonly repository: TelephonyConvergenceRepository;
  readonly service: TelephonyConvergencePipelineService;
  readonly submissionBackbone: SubmissionBackboneApplication;
  readonly normalizedSubmission: NormalizedSubmissionApplication;
  readonly persistenceTables: typeof telephonyConvergencePersistenceTables;
  readonly migrationPlanRefs: typeof telephonyConvergenceMigrationPlanRefs;
  readonly gapResolutions: typeof telephonyConvergenceGapResolutions;
  readonly reasonCatalog: typeof telephonyConvergenceReasonCatalog;
}

export function createTelephonyConvergenceApplication(options?: {
  repository?: TelephonyConvergenceRepository;
  submissionBackbone?: SubmissionBackboneApplication;
  normalizedSubmission?: NormalizedSubmissionApplication;
}): TelephonyConvergenceApplication {
  const repository = options?.repository ?? createInMemoryTelephonyConvergenceRepository();
  const submissionBackbone = options?.submissionBackbone ?? createSubmissionBackboneApplication();
  const normalizedSubmission =
    options?.normalizedSubmission ?? createNormalizedSubmissionApplication();
  return {
    repository,
    service: new TelephonyConvergencePipelineService(
      repository,
      submissionBackbone,
      normalizedSubmission,
    ),
    submissionBackbone,
    normalizedSubmission,
    persistenceTables: telephonyConvergencePersistenceTables,
    migrationPlanRefs: telephonyConvergenceMigrationPlanRefs,
    gapResolutions: telephonyConvergenceGapResolutions,
    reasonCatalog: telephonyConvergenceReasonCatalog,
  };
}
