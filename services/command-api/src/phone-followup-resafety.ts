import { createHash } from "node:crypto";
import {
  createAssimilationSafetyServices,
  createAssimilationSafetyStore,
  type AssimilationSafetyDependencies,
  type AssimilationSafetyServices,
  type EvidenceAssimilationRecordSnapshot,
  type EvidenceBatchItem,
  type EvidenceClass,
  type EvidenceClassificationDecisionSnapshot,
  type EvidenceIngressSourceDomain,
  type MaterialDeltaAssessmentSnapshot,
  type MaterialDeltaDecisionBasis,
  type MaterialityClass,
  type SafetyDecisionRecordSnapshot,
  type SafetyPreemptionRecordSnapshot,
  type UrgentDiversionSettlementSnapshot,
} from "@vecells/domain-intake-safety";

export const PHONE_FOLLOWUP_SERVICE_NAME = "PhoneFollowupResafetyService";
export const PHONE_FOLLOWUP_SCHEMA_VERSION = "194.phase2.phone-followup-resafety.v1";
export const PHONE_FOLLOWUP_POLICY_VERSION = "phase2-phone-followup-resafety-194.v1";
export const PHONE_FOLLOWUP_CONTINUITY_WITNESS_POLICY_VERSION =
  "phase2-phone-followup-continuity-witness-194.v1";
export const PHONE_FOLLOWUP_DUPLICATE_DIGEST_POLICY_VERSION =
  "phase2-phone-followup-duplicate-digest-194.v1";
export const PHONE_FOLLOWUP_PROJECTION_HOLD_POLICY_VERSION =
  "phase2-phone-followup-projection-hold-194.v1";
export const PHONE_FOLLOWUP_REQUEST_EPISODE_SPLIT_POLICY_VERSION =
  "phase2-phone-followup-request-episode-split-194.v1";

export const phoneFollowupPersistenceTables = [
  "phase2_phone_followup_frozen_evidence_batches",
  "phase2_phone_followup_duplicate_digests",
  "phase2_phone_followup_duplicate_evaluations",
  "phase2_phone_followup_projection_holds",
  "phase2_phone_followup_assimilation_outcomes",
] as const;

export const phoneFollowupMigrationPlanRefs = [
  "services/command-api/migrations/109_phase2_phone_followup_resafety.sql",
] as const;

export const phoneFollowupGapResolutions = [
  "GAP_RESOLVED_PHASE2_PHONE_FOLLOWUP_CONTINUITY_WITNESS_CATALOG",
  "GAP_RESOLVED_PHASE2_PHONE_FOLLOWUP_DUPLICATE_DIGEST_STRATEGY",
  "GAP_RESOLVED_PHASE2_PHONE_FOLLOWUP_PATIENT_PENDING_STATE_TRUTH",
  "GAP_RESOLVED_PHASE2_PHONE_FOLLOWUP_TRANSCRIPT_DEGRADATION_AFTER_ATTACHMENT",
  "GAP_RESOLVED_PHASE2_PHONE_FOLLOWUP_REQUEST_EPISODE_SPLIT_BOUNDARY",
] as const;

export const phoneFollowupContinuityWitnessCatalog = [
  "active_continuation_lineage",
  "telephony_lineage_authority",
  "operator_confirmed_case_id",
  "same_request_convergence_outcome",
  "human_review_override",
] as const;

export const phoneFollowupReasonCatalog = [
  "PHONE_FOLLOWUP_194_GOVERNED_INGRESS_FROZEN",
  "PHONE_FOLLOWUP_194_CANONICAL_DUPLICATE_DIGEST",
  "PHONE_FOLLOWUP_194_EXACT_REPLAY_RETURNED",
  "PHONE_FOLLOWUP_194_SEMANTIC_REPLAY_RETURNED",
  "PHONE_FOLLOWUP_194_IDEMPOTENCY_COLLISION_REVIEW",
  "PHONE_FOLLOWUP_194_SAME_REQUEST_ATTACH_REQUIRES_CONTINUITY_WITNESS",
  "PHONE_FOLLOWUP_194_CONTINUITY_WITNESS_ACCEPTED",
  "PHONE_FOLLOWUP_194_CONTINUITY_WITNESS_MISSING_OR_DRIFTED",
  "PHONE_FOLLOWUP_194_SCORE_ONLY_ATTACH_FORBIDDEN",
  "PHONE_FOLLOWUP_194_SAME_EPISODE_REVIEW_REQUIRED",
  "PHONE_FOLLOWUP_194_SAME_EPISODE_LINK_WITHOUT_ATTACH",
  "PHONE_FOLLOWUP_194_SEPARATE_REQUEST_CONTINUITY_NOT_PROVEN",
  "PHONE_FOLLOWUP_194_EVIDENCE_CLASSIFICATION_DECISION_SETTLED",
  "PHONE_FOLLOWUP_194_MATERIAL_DELTA_ASSESSMENT_SETTLED",
  "PHONE_FOLLOWUP_194_EVIDENCE_ASSIMILATION_RECORD_SETTLED",
  "PHONE_FOLLOWUP_194_DEGRADED_TRANSCRIPT_FAIL_CLOSED",
  "PHONE_FOLLOWUP_194_CONTACT_SAFETY_MATERIAL_DELTA",
  "PHONE_FOLLOWUP_194_CLINICAL_MATERIAL_DELTA",
  "PHONE_FOLLOWUP_194_TECHNICAL_OR_OPERATIONAL_ONLY",
  "PHONE_FOLLOWUP_194_RESAFETY_TRIGGERED",
  "PHONE_FOLLOWUP_194_BLOCKED_MANUAL_REVIEW",
  "PHONE_FOLLOWUP_194_PROJECTION_HOLD_REVIEW_PENDING",
  "PHONE_FOLLOWUP_194_PROJECTION_HOLD_DETAIL_BEING_CHECKED",
  "PHONE_FOLLOWUP_194_PROJECTION_HOLD_URGENT_REVIEW_OPENED",
  "PHONE_FOLLOWUP_194_PROJECTION_HOLD_DEGRADED_EVIDENCE",
  "PHONE_FOLLOWUP_194_NO_STALE_CALM_STATUS",
] as const;

export type PhoneFollowupEvidenceChannel =
  | "post_submit_phone_call"
  | "sms_continuation"
  | "support_transcribed_followup"
  | "duplicate_attachment";

export type PhoneFollowupEvidenceKind =
  | "audio"
  | "transcript"
  | "form_supplement"
  | "attachment"
  | "contact_route"
  | "support_transcription";

export type FollowupEvidenceQuality = "accepted" | "degraded" | "contradictory" | "unknown";

export type FollowupReplayClassification =
  | "new_command"
  | "exact_replay"
  | "semantic_replay"
  | "collision_review";

export type FollowupDuplicateRelationClass =
  | "retry"
  | "duplicate_attachment"
  | "same_request_attach"
  | "same_episode_candidate"
  | "same_episode_link"
  | "separate_request";

export type FollowupDuplicateDecisionClass =
  | "exact_retry_collapse"
  | "same_request_attach"
  | "review_required"
  | "same_episode_link"
  | "separate_request";

export type FollowupContinuityWitnessClass =
  | (typeof phoneFollowupContinuityWitnessCatalog)[number]
  | "none";

export type PhoneFollowupProjectionHoldState =
  | "review_pending"
  | "detail_received_being_checked"
  | "urgent_review_opened"
  | "blocked_by_degraded_followup_evidence"
  | "separate_request_created_continuity_not_proven"
  | "detail_added_no_resafety";

export interface FollowupContinuityWitness {
  readonly witnessClass: FollowupContinuityWitnessClass;
  readonly witnessRef: string | null;
  readonly requestId: string | null;
  readonly episodeId: string | null;
  readonly requestLineageRef?: string | null;
  readonly sourceLineageRef?: string | null;
  readonly activeContinuationLineageRef?: string | null;
  readonly telephonyLineageRef?: string | null;
  readonly authoritativeRequestContextRef?: string | null;
  readonly operatorConfirmedCaseIdRef?: string | null;
  readonly routeFenceCurrent: boolean;
  readonly subjectFenceCurrent: boolean;
  readonly releaseFenceCurrent?: boolean;
  readonly verifiedAt: string;
  readonly verifiedByRef: string;
}

export interface FollowupDuplicateProbe {
  readonly relationClass: FollowupDuplicateRelationClass;
  readonly candidateRequestRef?: string | null;
  readonly candidateEpisodeRef?: string | null;
  readonly candidateRequestLineageRef?: string | null;
  readonly candidateScore?: number;
  readonly scoreOnly?: boolean;
  readonly noMaterialDivergence?: boolean;
  readonly calibratedForLateEvidence?: boolean;
  readonly competingCandidateRefs?: readonly string[];
  readonly hardBlockerRefs?: readonly string[];
}

export interface FollowupMaterialSignals {
  readonly clinicalMeaningChanged?: boolean;
  readonly urgentRedFlag?: boolean;
  readonly respiratoryDistress?: boolean;
  readonly symptomWorsened?: boolean;
  readonly chronologyChanged?: boolean;
  readonly backdatedEvent?: boolean;
  readonly timingConflict?: boolean;
  readonly contradictionPresent?: boolean;
  readonly routineBypassSignal?: boolean;
  readonly contactRouteChanged?: boolean;
  readonly contactPreferenceChanged?: boolean;
  readonly deliveryFailureThreatensReachability?: boolean;
  readonly degradedTranscript?: boolean;
  readonly transcriptContradictory?: boolean;
  readonly technicalOnly?: boolean;
}

export interface FollowupEvidenceIngressCommand {
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly tenantId: string;
  readonly requestId: string;
  readonly episodeId: string;
  readonly requestLineageRef: string;
  readonly requestTypeRef: string;
  readonly sourceLineageRef: string;
  readonly followupChannel: PhoneFollowupEvidenceChannel;
  readonly evidenceKind: PhoneFollowupEvidenceKind;
  readonly evidenceRefs?: readonly string[];
  readonly audioRefs?: readonly string[];
  readonly transcriptRefs?: readonly string[];
  readonly attachmentRefs?: readonly string[];
  readonly formSupplementRefs?: readonly string[];
  readonly contactRouteEvidenceRefs?: readonly string[];
  readonly supportTranscriptionRefs?: readonly string[];
  readonly narrative?: string | null;
  readonly structuredFacts?: Readonly<Record<string, unknown>>;
  readonly evidenceQuality?: FollowupEvidenceQuality;
  readonly sourceTimestamp: string;
  readonly receivedAt?: string;
  readonly provenance?: Readonly<Record<string, unknown>>;
  readonly duplicateProbe?: FollowupDuplicateProbe | null;
  readonly continuityWitness?: FollowupContinuityWitness | null;
  readonly materialSignals?: FollowupMaterialSignals;
  readonly currentSafetyDecisionEpoch?: number;
  readonly currentPendingPreemptionRef?: string | null;
  readonly currentPendingSafetyEpoch?: number | null;
  readonly priorCompositeSnapshotRef?: string | null;
  readonly observedAt?: string;
}

export interface FollowupDuplicateDigest {
  readonly duplicateDigestRef: string;
  readonly schemaVersion: typeof PHONE_FOLLOWUP_SCHEMA_VERSION;
  readonly policyVersion: typeof PHONE_FOLLOWUP_DUPLICATE_DIGEST_POLICY_VERSION;
  readonly requestId: string;
  readonly sourceLineageRef: string;
  readonly exactDigest: string;
  readonly semanticDigest: string;
  readonly replayKey: string;
  readonly componentDigests: Readonly<Record<PhoneFollowupEvidenceKind, string>>;
  readonly evidenceRefs: readonly string[];
  readonly digestBasis: readonly string[];
  readonly createdAt: string;
}

export interface FrozenFollowupEvidenceBatch {
  readonly followupBatchRef: string;
  readonly schemaVersion: typeof PHONE_FOLLOWUP_SCHEMA_VERSION;
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly tenantId: string;
  readonly requestId: string;
  readonly episodeId: string;
  readonly requestLineageRef: string;
  readonly sourceLineageRef: string;
  readonly followupChannel: PhoneFollowupEvidenceChannel;
  readonly evidenceKind: PhoneFollowupEvidenceKind;
  readonly sourceHash: string;
  readonly semanticHash: string;
  readonly duplicateDigestRef: string;
  readonly frozenEvidenceRefs: readonly string[];
  readonly groupedEvidenceRefs: Readonly<Record<PhoneFollowupEvidenceKind, readonly string[]>>;
  readonly provenanceRefs: Readonly<Record<string, unknown>>;
  readonly sourceTimestamp: string;
  readonly frozenAt: string;
  readonly recordedBy: typeof PHONE_FOLLOWUP_SERVICE_NAME;
}

export interface FollowupContinuityWitnessDecision {
  readonly accepted: boolean;
  readonly witnessClass: FollowupContinuityWitnessClass;
  readonly witnessRef: string | null;
  readonly failureReasonCodes: readonly string[];
}

export interface FollowupDuplicateEvaluation {
  readonly duplicateEvaluationRef: string;
  readonly schemaVersion: typeof PHONE_FOLLOWUP_SCHEMA_VERSION;
  readonly policyVersion: typeof PHONE_FOLLOWUP_POLICY_VERSION;
  readonly requestId: string;
  readonly episodeId: string;
  readonly incomingBatchRef: string;
  readonly duplicateDigestRef: string;
  readonly relationClass: FollowupDuplicateRelationClass;
  readonly decisionClass: FollowupDuplicateDecisionClass;
  readonly targetRequestRef: string | null;
  readonly targetEpisodeRef: string | null;
  readonly targetRequestLineageRef: string | null;
  readonly continuityWitness: FollowupContinuityWitnessDecision;
  readonly scoreOnlyAttachRejected: boolean;
  readonly reviewRequired: boolean;
  readonly reasonCodes: readonly string[];
  readonly decidedAt: string;
  readonly decidedByRef: typeof PHONE_FOLLOWUP_SERVICE_NAME;
}

export interface PhoneFollowupAssimilationChain {
  readonly assimilationRecord: EvidenceAssimilationRecordSnapshot;
  readonly materialDelta: MaterialDeltaAssessmentSnapshot;
  readonly classification: EvidenceClassificationDecisionSnapshot;
  readonly resultingSnapshotRef: string | null;
  readonly preemption: SafetyPreemptionRecordSnapshot | null;
  readonly safetyDecision: SafetyDecisionRecordSnapshot | null;
  readonly urgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null;
  readonly replayDisposition:
    | "distinct"
    | "exact_replay"
    | "semantic_replay"
    | "coalesced_inflight";
}

export interface PhoneFollowupProjectionHold {
  readonly projectionHoldRef: string;
  readonly schemaVersion: typeof PHONE_FOLLOWUP_SCHEMA_VERSION;
  readonly policyVersion: typeof PHONE_FOLLOWUP_PROJECTION_HOLD_POLICY_VERSION;
  readonly requestId: string;
  readonly episodeId: string;
  readonly evidenceAssimilationRef: string;
  readonly materialDeltaAssessmentRef: string;
  readonly classificationDecisionRef: string;
  readonly safetyPreemptionRef: string | null;
  readonly holdState: PhoneFollowupProjectionHoldState;
  readonly patientVisibleCalmStatusAllowed: boolean;
  readonly patientVisibleState:
    | "review_pending"
    | "detail_received_being_checked"
    | "urgent_review_opened"
    | "blocked_by_degraded_followup_evidence"
    | "separate_request_created"
    | "detail_added";
  readonly staffActionability:
    | "manual_review_required"
    | "read_only_until_resafety"
    | "urgent_review_queue"
    | "new_request_link_required"
    | "ordinary_actions_allowed";
  readonly staleRoutineProjectionSuppressed: boolean;
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
}

export interface PhoneFollowupAssimilationOutcome {
  readonly followupOutcomeRef: string;
  readonly schemaVersion: typeof PHONE_FOLLOWUP_SCHEMA_VERSION;
  readonly idempotencyKey: string;
  readonly replayClassification: FollowupReplayClassification;
  readonly replayed: boolean;
  readonly frozenBatch: FrozenFollowupEvidenceBatch;
  readonly duplicateDigest: FollowupDuplicateDigest;
  readonly duplicateEvaluation: FollowupDuplicateEvaluation;
  readonly assimilationChain: PhoneFollowupAssimilationChain;
  readonly projectionHold: PhoneFollowupProjectionHold;
  readonly sideEffects: {
    readonly createdFrozenBatch: boolean;
    readonly createdDuplicateDecision: boolean;
    readonly createdAssimilationChain: boolean;
    readonly createdSafetyPreemption: boolean;
    readonly createdProjectionHold: boolean;
    readonly createdReceipt: false;
  };
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly recordedBy: typeof PHONE_FOLLOWUP_SERVICE_NAME;
}

export interface PhoneFollowupResafetyRepository {
  getOutcomeByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PhoneFollowupAssimilationOutcome | null>;
  getOutcomeByReplayKey(replayKey: string): Promise<PhoneFollowupAssimilationOutcome | null>;
  getCollisionOutcome(
    idempotencyKey: string,
    sourceHash: string,
  ): Promise<PhoneFollowupAssimilationOutcome | null>;
  saveFrozenBatch(record: FrozenFollowupEvidenceBatch): Promise<void>;
  saveDuplicateDigest(record: FollowupDuplicateDigest): Promise<void>;
  saveDuplicateEvaluation(record: FollowupDuplicateEvaluation): Promise<void>;
  saveProjectionHold(record: PhoneFollowupProjectionHold): Promise<void>;
  saveOutcome(record: PhoneFollowupAssimilationOutcome): Promise<void>;
  snapshots(): {
    readonly frozenBatches: readonly FrozenFollowupEvidenceBatch[];
    readonly duplicateDigests: readonly FollowupDuplicateDigest[];
    readonly duplicateEvaluations: readonly FollowupDuplicateEvaluation[];
    readonly projectionHolds: readonly PhoneFollowupProjectionHold[];
    readonly outcomes: readonly PhoneFollowupAssimilationOutcome[];
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function assertIso(value: string, field: string): string {
  if (!value || Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} must be a valid ISO-8601 timestamp.`);
  }
  return value;
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

function canonicalText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function uniqueSorted(values: readonly (string | null | undefined)[]): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])].sort();
}

function compactReasonCodes(values: readonly (string | false | null | undefined)[]): string[] {
  return uniqueSorted(values.filter(Boolean) as string[]);
}

function clone<T>(value: T): T {
  return value === null ? value : JSON.parse(JSON.stringify(value));
}

function groupedEvidenceRefs(
  command: FollowupEvidenceIngressCommand,
): Readonly<Record<PhoneFollowupEvidenceKind, readonly string[]>> {
  return {
    audio: uniqueSorted(command.audioRefs ?? []),
    transcript: uniqueSorted(command.transcriptRefs ?? []),
    form_supplement: uniqueSorted(command.formSupplementRefs ?? []),
    attachment: uniqueSorted(command.attachmentRefs ?? []),
    contact_route: uniqueSorted(command.contactRouteEvidenceRefs ?? []),
    support_transcription: uniqueSorted(command.supportTranscriptionRefs ?? []),
  };
}

function allEvidenceRefs(command: FollowupEvidenceIngressCommand): string[] {
  const grouped = groupedEvidenceRefs(command);
  return uniqueSorted([
    ...(command.evidenceRefs ?? []),
    ...grouped.audio,
    ...grouped.transcript,
    ...grouped.form_supplement,
    ...grouped.attachment,
    ...grouped.contact_route,
    ...grouped.support_transcription,
  ]);
}

function sourceDomainFor(channel: PhoneFollowupEvidenceChannel): EvidenceIngressSourceDomain {
  if (channel === "support_transcribed_followup") return "support_capture";
  if (channel === "duplicate_attachment") return "adapter_observation";
  return "patient_reply";
}

function duplicateDigestFor(input: {
  command: FollowupEvidenceIngressCommand;
  sourceHash: string;
  semanticHash: string;
  at: string;
}): FollowupDuplicateDigest {
  const grouped = groupedEvidenceRefs(input.command);
  const componentDigests: Record<PhoneFollowupEvidenceKind, string> = {
    audio: stableDigest(grouped.audio),
    transcript: stableDigest({
      refs: grouped.transcript,
      narrative: canonicalText(input.command.narrative),
      degraded: Boolean(input.command.materialSignals?.degradedTranscript),
    }),
    form_supplement: stableDigest({
      refs: grouped.form_supplement,
      facts: input.command.structuredFacts ?? {},
    }),
    attachment: stableDigest(grouped.attachment),
    contact_route: stableDigest(grouped.contact_route),
    support_transcription: stableDigest(grouped.support_transcription),
  };
  const replayKey = stableDigest({
    requestId: input.command.requestId,
    requestLineageRef: input.command.requestLineageRef,
    semanticHash: input.semanticHash,
  });
  return {
    duplicateDigestRef: stableRef("followup_duplicate_digest_194", {
      requestId: input.command.requestId,
      semanticHash: input.semanticHash,
    }),
    schemaVersion: PHONE_FOLLOWUP_SCHEMA_VERSION,
    policyVersion: PHONE_FOLLOWUP_DUPLICATE_DIGEST_POLICY_VERSION,
    requestId: input.command.requestId,
    sourceLineageRef: input.command.sourceLineageRef,
    exactDigest: input.sourceHash,
    semanticDigest: input.semanticHash,
    replayKey,
    componentDigests,
    evidenceRefs: allEvidenceRefs(input.command),
    digestBasis: [
      "audio refs",
      "transcript refs and normalized narrative",
      "form supplement refs and structured facts",
      "attachment refs",
      "contact-route evidence refs",
      "support transcription refs",
    ],
    createdAt: input.at,
  };
}

function freezeBatch(input: {
  command: FollowupEvidenceIngressCommand;
  sourceHash: string;
  semanticHash: string;
  digest: FollowupDuplicateDigest;
  at: string;
}): FrozenFollowupEvidenceBatch {
  return {
    followupBatchRef: stableRef("followup_batch_194", {
      commandId: input.command.commandId,
      sourceHash: input.sourceHash,
    }),
    schemaVersion: PHONE_FOLLOWUP_SCHEMA_VERSION,
    commandId: input.command.commandId,
    idempotencyKey: input.command.idempotencyKey,
    tenantId: input.command.tenantId,
    requestId: input.command.requestId,
    episodeId: input.command.episodeId,
    requestLineageRef: input.command.requestLineageRef,
    sourceLineageRef: input.command.sourceLineageRef,
    followupChannel: input.command.followupChannel,
    evidenceKind: input.command.evidenceKind,
    sourceHash: input.sourceHash,
    semanticHash: input.semanticHash,
    duplicateDigestRef: input.digest.duplicateDigestRef,
    frozenEvidenceRefs: input.digest.evidenceRefs,
    groupedEvidenceRefs: groupedEvidenceRefs(input.command),
    provenanceRefs: input.command.provenance ?? {},
    sourceTimestamp: assertIso(input.command.sourceTimestamp, "sourceTimestamp"),
    frozenAt: input.at,
    recordedBy: PHONE_FOLLOWUP_SERVICE_NAME,
  };
}

function validateContinuityWitness(
  command: FollowupEvidenceIngressCommand,
): FollowupContinuityWitnessDecision {
  const witness = command.continuityWitness;
  if (!witness) {
    return {
      accepted: false,
      witnessClass: "none",
      witnessRef: null,
      failureReasonCodes: ["PHONE_FOLLOWUP_194_CONTINUITY_WITNESS_MISSING_OR_DRIFTED"],
    };
  }
  const allowListed = phoneFollowupContinuityWitnessCatalog.includes(
    witness.witnessClass as (typeof phoneFollowupContinuityWitnessCatalog)[number],
  );
  const lineageMatches =
    !witness.requestLineageRef || witness.requestLineageRef === command.requestLineageRef;
  const targetMatches =
    witness.requestId === command.requestId && witness.episodeId === command.episodeId;
  const fencesCurrent =
    witness.routeFenceCurrent &&
    witness.subjectFenceCurrent &&
    witness.releaseFenceCurrent !== false;
  const hasClassAuthority =
    witness.witnessClass === "active_continuation_lineage"
      ? Boolean(witness.activeContinuationLineageRef)
      : witness.witnessClass === "telephony_lineage_authority"
        ? Boolean(witness.telephonyLineageRef && witness.authoritativeRequestContextRef)
        : witness.witnessClass === "operator_confirmed_case_id"
          ? Boolean(witness.operatorConfirmedCaseIdRef && witness.authoritativeRequestContextRef)
          : witness.witnessClass === "same_request_convergence_outcome"
            ? Boolean(witness.authoritativeRequestContextRef)
            : witness.witnessClass === "human_review_override"
              ? Boolean(witness.verifiedByRef)
              : false;
  const accepted =
    allowListed &&
    Boolean(witness.witnessRef) &&
    targetMatches &&
    lineageMatches &&
    fencesCurrent &&
    hasClassAuthority;
  return {
    accepted,
    witnessClass: witness.witnessClass,
    witnessRef: witness.witnessRef,
    failureReasonCodes: accepted
      ? []
      : ["PHONE_FOLLOWUP_194_CONTINUITY_WITNESS_MISSING_OR_DRIFTED"],
  };
}

function duplicateEvaluationFor(input: {
  command: FollowupEvidenceIngressCommand;
  frozenBatch: FrozenFollowupEvidenceBatch;
  digest: FollowupDuplicateDigest;
  replayClassification: FollowupReplayClassification;
  at: string;
}): FollowupDuplicateEvaluation {
  const probe = input.command.duplicateProbe;
  const relationClass =
    input.replayClassification === "collision_review"
      ? "same_episode_candidate"
      : (probe?.relationClass ?? "same_episode_candidate");
  const continuityWitness = validateContinuityWitness(input.command);
  const scoreOnlyAttachRejected =
    relationClass === "same_request_attach" && Boolean(probe?.scoreOnly);
  const calibrated = probe?.calibratedForLateEvidence ?? true;
  const noMaterialDivergence = probe?.noMaterialDivergence ?? true;
  const hardBlockerRefs = uniqueSorted([
    ...(probe?.hardBlockerRefs ?? []),
    ...(!calibrated ? ["late_evidence_calibration_missing"] : []),
    ...(scoreOnlyAttachRejected ? ["score_only_same_request_attach_attempt"] : []),
    ...(!noMaterialDivergence ? ["same_request_material_divergence"] : []),
  ]);
  const sameRequestAttachAllowed =
    relationClass === "same_request_attach" &&
    continuityWitness.accepted &&
    !scoreOnlyAttachRejected &&
    calibrated &&
    noMaterialDivergence &&
    hardBlockerRefs.length === 0;
  const decisionClass: FollowupDuplicateDecisionClass =
    input.replayClassification === "collision_review"
      ? "review_required"
      : relationClass === "retry"
        ? "exact_retry_collapse"
        : sameRequestAttachAllowed
          ? "same_request_attach"
          : relationClass === "separate_request"
            ? "separate_request"
            : relationClass === "same_episode_link" && continuityWitness.accepted
              ? "same_episode_link"
              : relationClass === "duplicate_attachment" && continuityWitness.accepted
                ? "same_request_attach"
                : relationClass === "same_request_attach"
                  ? "review_required"
                  : "review_required";

  const targetRequestRef =
    decisionClass === "separate_request"
      ? null
      : (probe?.candidateRequestRef ?? input.command.requestId);
  const targetEpisodeRef =
    decisionClass === "separate_request"
      ? null
      : (probe?.candidateEpisodeRef ?? input.command.episodeId);
  const continuityNotProven =
    decisionClass === "review_required" &&
    (relationClass === "same_request_attach" || relationClass === "same_episode_candidate") &&
    !continuityWitness.accepted;
  return {
    duplicateEvaluationRef: stableRef("followup_duplicate_evaluation_194", {
      batch: input.frozenBatch.followupBatchRef,
      relationClass,
      decisionClass,
    }),
    schemaVersion: PHONE_FOLLOWUP_SCHEMA_VERSION,
    policyVersion: PHONE_FOLLOWUP_POLICY_VERSION,
    requestId: input.command.requestId,
    episodeId: input.command.episodeId,
    incomingBatchRef: input.frozenBatch.followupBatchRef,
    duplicateDigestRef: input.digest.duplicateDigestRef,
    relationClass,
    decisionClass,
    targetRequestRef,
    targetEpisodeRef,
    targetRequestLineageRef:
      decisionClass === "separate_request"
        ? null
        : (probe?.candidateRequestLineageRef ?? input.command.requestLineageRef),
    continuityWitness,
    scoreOnlyAttachRejected,
    reviewRequired: decisionClass === "review_required",
    reasonCodes: compactReasonCodes([
      "PHONE_FOLLOWUP_194_SAME_REQUEST_ATTACH_REQUIRES_CONTINUITY_WITNESS",
      continuityWitness.accepted && "PHONE_FOLLOWUP_194_CONTINUITY_WITNESS_ACCEPTED",
      ...continuityWitness.failureReasonCodes,
      scoreOnlyAttachRejected && "PHONE_FOLLOWUP_194_SCORE_ONLY_ATTACH_FORBIDDEN",
      decisionClass === "review_required" && "PHONE_FOLLOWUP_194_SAME_EPISODE_REVIEW_REQUIRED",
      decisionClass === "same_episode_link" &&
        "PHONE_FOLLOWUP_194_SAME_EPISODE_LINK_WITHOUT_ATTACH",
      (decisionClass === "separate_request" || continuityNotProven) &&
        "PHONE_FOLLOWUP_194_SEPARATE_REQUEST_CONTINUITY_NOT_PROVEN",
      input.replayClassification === "collision_review" &&
        "PHONE_FOLLOWUP_194_IDEMPOTENCY_COLLISION_REVIEW",
    ]),
    decidedAt: input.at,
    decidedByRef: PHONE_FOLLOWUP_SERVICE_NAME,
  };
}

function evidenceClassFor(
  command: FollowupEvidenceIngressCommand,
  signals: FollowupMaterialSignals,
): EvidenceClass {
  if (
    signals.clinicalMeaningChanged ||
    signals.urgentRedFlag ||
    signals.respiratoryDistress ||
    signals.symptomWorsened ||
    signals.chronologyChanged ||
    signals.contradictionPresent ||
    signals.routineBypassSignal ||
    signals.degradedTranscript ||
    signals.transcriptContradictory
  ) {
    return "potentially_clinical";
  }
  if (
    signals.contactRouteChanged ||
    signals.contactPreferenceChanged ||
    signals.deliveryFailureThreatensReachability ||
    command.evidenceKind === "contact_route"
  ) {
    return "contact_safety_relevant";
  }
  if (command.evidenceKind === "attachment" || command.followupChannel === "duplicate_attachment") {
    return "operationally_material_nonclinical";
  }
  return "technical_metadata";
}

function evidenceItemsFor(command: FollowupEvidenceIngressCommand): EvidenceBatchItem[] {
  const signals = command.materialSignals ?? {};
  const suggestedClass = evidenceClassFor(command, signals);
  const confidence =
    command.evidenceQuality === "degraded" ||
    command.evidenceQuality === "contradictory" ||
    signals.degradedTranscript ||
    signals.transcriptContradictory
      ? 0.25
      : suggestedClass === "technical_metadata"
        ? 0.92
        : 0.84;
  return allEvidenceRefs(command).map((evidenceRef) => ({
    evidenceRef,
    suggestedClass,
    confidence,
    allowListRef:
      suggestedClass === "technical_metadata"
        ? "phase2-phone-followup-technical-metadata-allow-list-194.v1"
        : null,
    dependencyRef:
      suggestedClass === "contact_safety_relevant" ? "reachability_urgent_return" : null,
    signalRef: stableRef("followup_evidence_signal_194", {
      evidenceRef,
      suggestedClass,
      degraded: confidence < 0.5,
    }),
  }));
}

function materialityFor(input: {
  command: FollowupEvidenceIngressCommand;
  duplicate: FollowupDuplicateEvaluation;
}): {
  materialityClass: MaterialityClass;
  decisionBasis: MaterialDeltaDecisionBasis;
  changedFeatureRefs: readonly string[];
  changedDependencyRefs: readonly string[];
  changedChronologyRefs: readonly string[];
  reasonCodes: readonly string[];
  degradedFailClosed: boolean;
} {
  const signals = input.command.materialSignals ?? {};
  const degraded =
    input.command.evidenceQuality === "degraded" ||
    input.command.evidenceQuality === "contradictory" ||
    Boolean(signals.degradedTranscript || signals.transcriptContradictory);
  const changedFeatureRefs = uniqueSorted([
    signals.urgentRedFlag ? "urgent_red_flag" : null,
    signals.respiratoryDistress ? "respiratory_distress" : null,
    signals.symptomWorsened ? "symptom_worsened" : null,
    signals.clinicalMeaningChanged ? "new_clinical_detail" : null,
    signals.contradictionPresent || signals.transcriptContradictory
      ? "critical_contradiction"
      : null,
    signals.routineBypassSignal ? "routine_bypass" : null,
  ]);
  const changedDependencyRefs = uniqueSorted([
    signals.contactRouteChanged ? "contact_route" : null,
    signals.contactPreferenceChanged ? "contact_preference" : null,
    signals.deliveryFailureThreatensReachability ? "reachability_urgent_return" : null,
  ]);
  const changedChronologyRefs = uniqueSorted([
    signals.chronologyChanged ? "chronology_shift" : null,
    signals.backdatedEvent ? "backdated_event" : null,
    signals.timingConflict ? "timing_conflict" : null,
  ]);
  const materialityClass: MaterialityClass = degraded
    ? "unresolved"
    : changedDependencyRefs.length > 0
      ? "contact_safety_material"
      : changedFeatureRefs.length > 0 || changedChronologyRefs.length > 0
        ? "safety_material"
        : input.command.evidenceKind === "attachment" ||
            input.command.followupChannel === "duplicate_attachment"
          ? "operational_nonclinical"
          : "technical_only";
  const decisionBasis: MaterialDeltaDecisionBasis = degraded
    ? "degraded_fail_closed"
    : changedDependencyRefs.length > 0
      ? "dependency_delta"
      : changedChronologyRefs.length > 0
        ? "chronology_delta"
        : changedFeatureRefs.includes("critical_contradiction")
          ? "contradiction_delta"
          : changedFeatureRefs.length > 0
            ? "feature_delta"
            : "no_semantic_delta";
  return {
    materialityClass,
    decisionBasis,
    changedFeatureRefs,
    changedDependencyRefs,
    changedChronologyRefs,
    degradedFailClosed: degraded,
    reasonCodes: compactReasonCodes([
      degraded && "PHONE_FOLLOWUP_194_DEGRADED_TRANSCRIPT_FAIL_CLOSED",
      materialityClass === "contact_safety_material" &&
        "PHONE_FOLLOWUP_194_CONTACT_SAFETY_MATERIAL_DELTA",
      materialityClass === "safety_material" && "PHONE_FOLLOWUP_194_CLINICAL_MATERIAL_DELTA",
      (materialityClass === "technical_only" || materialityClass === "operational_nonclinical") &&
        "PHONE_FOLLOWUP_194_TECHNICAL_OR_OPERATIONAL_ONLY",
      input.duplicate.decisionClass === "review_required" &&
        "PHONE_FOLLOWUP_194_SAME_EPISODE_REVIEW_REQUIRED",
    ]),
  };
}

function featureStatesFor(
  signals: FollowupMaterialSignals,
): Record<string, "present" | "absent" | "unresolved"> {
  const degraded = Boolean(signals.degradedTranscript || signals.transcriptContradictory);
  return {
    urgent_red_flag: signals.urgentRedFlag ? "present" : "absent",
    respiratory_distress: signals.respiratoryDistress ? "present" : "absent",
    severe_bleeding: "absent",
    urgent_contact_failure: signals.deliveryFailureThreatensReachability ? "present" : "absent",
    callback_unreachable: signals.deliveryFailureThreatensReachability ? "present" : "absent",
    critical_contradiction:
      signals.contradictionPresent || signals.transcriptContradictory
        ? "present"
        : degraded
          ? "unresolved"
          : "absent",
    new_clinical_detail: signals.clinicalMeaningChanged ? "present" : "absent",
    symptom_worsened: signals.symptomWorsened ? "present" : "absent",
    backdated_event: signals.backdatedEvent ? "present" : "absent",
    timing_conflict: signals.timingConflict ? "present" : "absent",
    consent_withdrawn: "absent",
    weak_pharmacy_match: "absent",
  };
}

function mediaTypeFor(kind: PhoneFollowupEvidenceKind): string {
  if (kind === "audio") return "audio/mpeg";
  if (kind === "transcript" || kind === "support_transcription") return "text/plain";
  if (kind === "attachment") return "application/octet-stream";
  return "application/json";
}

function assimilationChainFor(settlement: {
  assimilationRecord: EvidenceAssimilationRecordSnapshot;
  materialDelta: MaterialDeltaAssessmentSnapshot;
  classification: EvidenceClassificationDecisionSnapshot;
  resultingSnapshot: { evidenceSnapshotId: string } | null;
  preemption: SafetyPreemptionRecordSnapshot | null;
  safetyDecision: SafetyDecisionRecordSnapshot | null;
  urgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null;
  replayDisposition: "distinct" | "exact_replay" | "semantic_replay" | "coalesced_inflight";
}): PhoneFollowupAssimilationChain {
  return {
    assimilationRecord: settlement.assimilationRecord,
    materialDelta: settlement.materialDelta,
    classification: settlement.classification,
    resultingSnapshotRef: settlement.resultingSnapshot?.evidenceSnapshotId ?? null,
    preemption: settlement.preemption,
    safetyDecision: settlement.safetyDecision,
    urgentDiversionSettlement: settlement.urgentDiversionSettlement,
    replayDisposition: settlement.replayDisposition,
  };
}

function projectionHoldFor(input: {
  command: FollowupEvidenceIngressCommand;
  duplicate: FollowupDuplicateEvaluation;
  chain: PhoneFollowupAssimilationChain;
  at: string;
}): PhoneFollowupProjectionHold {
  const degraded =
    input.chain.classification.misclassificationRiskState === "fail_closed_review" ||
    input.chain.materialDelta.decisionBasis === "degraded_fail_closed";
  const urgent =
    input.chain.safetyDecision?.requestedSafetyState === "urgent_diversion_required" ||
    input.chain.preemption?.priority === "urgent_review";
  const holdState: PhoneFollowupProjectionHoldState =
    input.duplicate.decisionClass === "separate_request"
      ? "separate_request_created_continuity_not_proven"
      : degraded || input.chain.assimilationRecord.assimilationState === "blocked_manual_review"
        ? "blocked_by_degraded_followup_evidence"
        : urgent
          ? "urgent_review_opened"
          : input.duplicate.reviewRequired
            ? "review_pending"
            : input.chain.preemption ||
                input.chain.materialDelta.triggerDecision === "re_safety_required" ||
                input.chain.materialDelta.triggerDecision === "coalesced_with_pending_preemption"
              ? "detail_received_being_checked"
              : "detail_added_no_resafety";
  const calmAllowed = holdState === "detail_added_no_resafety";
  return {
    projectionHoldRef: stableRef("phone_followup_projection_hold_194", {
      evidenceAssimilationRef: input.chain.assimilationRecord.evidenceAssimilationId,
      holdState,
    }),
    schemaVersion: PHONE_FOLLOWUP_SCHEMA_VERSION,
    policyVersion: PHONE_FOLLOWUP_PROJECTION_HOLD_POLICY_VERSION,
    requestId: input.command.requestId,
    episodeId: input.command.episodeId,
    evidenceAssimilationRef: input.chain.assimilationRecord.evidenceAssimilationId,
    materialDeltaAssessmentRef: input.chain.materialDelta.materialDeltaAssessmentId,
    classificationDecisionRef: input.chain.classification.classificationDecisionId,
    safetyPreemptionRef: input.chain.preemption?.preemptionId ?? null,
    holdState,
    patientVisibleCalmStatusAllowed: calmAllowed,
    patientVisibleState:
      holdState === "detail_received_being_checked"
        ? "detail_received_being_checked"
        : holdState === "urgent_review_opened"
          ? "urgent_review_opened"
          : holdState === "blocked_by_degraded_followup_evidence"
            ? "blocked_by_degraded_followup_evidence"
            : holdState === "separate_request_created_continuity_not_proven"
              ? "separate_request_created"
              : holdState === "review_pending"
                ? "review_pending"
                : "detail_added",
    staffActionability:
      holdState === "urgent_review_opened"
        ? "urgent_review_queue"
        : holdState === "blocked_by_degraded_followup_evidence" || holdState === "review_pending"
          ? "manual_review_required"
          : holdState === "separate_request_created_continuity_not_proven"
            ? "new_request_link_required"
            : holdState === "detail_received_being_checked"
              ? "read_only_until_resafety"
              : "ordinary_actions_allowed",
    staleRoutineProjectionSuppressed: !calmAllowed,
    reasonCodes: compactReasonCodes([
      holdState === "review_pending" && "PHONE_FOLLOWUP_194_PROJECTION_HOLD_REVIEW_PENDING",
      holdState === "detail_received_being_checked" &&
        "PHONE_FOLLOWUP_194_PROJECTION_HOLD_DETAIL_BEING_CHECKED",
      holdState === "urgent_review_opened" &&
        "PHONE_FOLLOWUP_194_PROJECTION_HOLD_URGENT_REVIEW_OPENED",
      holdState === "blocked_by_degraded_followup_evidence" &&
        "PHONE_FOLLOWUP_194_PROJECTION_HOLD_DEGRADED_EVIDENCE",
      !calmAllowed && "PHONE_FOLLOWUP_194_NO_STALE_CALM_STATUS",
    ]),
    createdAt: input.at,
  };
}

export function createInMemoryPhoneFollowupResafetyRepository(): PhoneFollowupResafetyRepository {
  const frozenBatches = new Map<string, FrozenFollowupEvidenceBatch>();
  const duplicateDigests = new Map<string, FollowupDuplicateDigest>();
  const duplicateEvaluations = new Map<string, FollowupDuplicateEvaluation>();
  const projectionHolds = new Map<string, PhoneFollowupProjectionHold>();
  const outcomes = new Map<string, PhoneFollowupAssimilationOutcome>();
  const outcomeByIdempotency = new Map<string, string>();
  const outcomeByReplayKey = new Map<string, string>();
  const collisionByIdempotencyAndHash = new Map<string, string>();

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
    async saveFrozenBatch(record) {
      frozenBatches.set(record.followupBatchRef, clone(record));
    },
    async saveDuplicateDigest(record) {
      duplicateDigests.set(record.duplicateDigestRef, clone(record));
    },
    async saveDuplicateEvaluation(record) {
      duplicateEvaluations.set(record.duplicateEvaluationRef, clone(record));
    },
    async saveProjectionHold(record) {
      projectionHolds.set(record.projectionHoldRef, clone(record));
    },
    async saveOutcome(record) {
      outcomes.set(record.followupOutcomeRef, clone(record));
      if (record.replayClassification === "collision_review") {
        collisionByIdempotencyAndHash.set(
          `${record.idempotencyKey}::${record.frozenBatch.sourceHash}`,
          record.followupOutcomeRef,
        );
      } else {
        outcomeByIdempotency.set(record.idempotencyKey, record.followupOutcomeRef);
        outcomeByReplayKey.set(record.duplicateDigest.replayKey, record.followupOutcomeRef);
      }
    },
    snapshots() {
      return clone({
        frozenBatches: [...frozenBatches.values()],
        duplicateDigests: [...duplicateDigests.values()],
        duplicateEvaluations: [...duplicateEvaluations.values()],
        projectionHolds: [...projectionHolds.values()],
        outcomes: [...outcomes.values()],
      });
    },
  };
}

function replayedOutcome(
  outcome: PhoneFollowupAssimilationOutcome,
  replayClassification: Exclude<FollowupReplayClassification, "new_command">,
): PhoneFollowupAssimilationOutcome {
  const replayCode =
    replayClassification === "exact_replay"
      ? "PHONE_FOLLOWUP_194_EXACT_REPLAY_RETURNED"
      : replayClassification === "semantic_replay"
        ? "PHONE_FOLLOWUP_194_SEMANTIC_REPLAY_RETURNED"
        : "PHONE_FOLLOWUP_194_IDEMPOTENCY_COLLISION_REVIEW";
  return {
    ...outcome,
    replayClassification,
    replayed: true,
    assimilationChain: {
      ...outcome.assimilationChain,
      replayDisposition:
        replayClassification === "semantic_replay" ? "semantic_replay" : "exact_replay",
    },
    sideEffects: {
      createdFrozenBatch: false,
      createdDuplicateDecision: false,
      createdAssimilationChain: false,
      createdSafetyPreemption: false,
      createdProjectionHold: false,
      createdReceipt: false,
    },
    reasonCodes: compactReasonCodes([...outcome.reasonCodes, replayCode]),
  };
}

export class PhoneFollowupResafetyService {
  constructor(
    private readonly repository: PhoneFollowupResafetyRepository,
    private readonly assimilationSafety: AssimilationSafetyServices,
  ) {}

  async ingestFollowupEvidence(
    command: FollowupEvidenceIngressCommand,
  ): Promise<PhoneFollowupAssimilationOutcome> {
    const at = assertIso(command.observedAt ?? command.receivedAt ?? nowIso(), "observedAt");
    const evidenceRefs = allEvidenceRefs(command);
    if (evidenceRefs.length === 0) {
      throw new Error("Follow-up evidence ingress requires at least one evidence ref.");
    }
    const sourceHash = stableDigest({
      commandId: command.commandId,
      idempotencyKey: command.idempotencyKey,
      requestId: command.requestId,
      episodeId: command.episodeId,
      requestLineageRef: command.requestLineageRef,
      sourceLineageRef: command.sourceLineageRef,
      followupChannel: command.followupChannel,
      evidenceKind: command.evidenceKind,
      evidenceRefs,
      groupedEvidenceRefs: groupedEvidenceRefs(command),
      narrative: canonicalText(command.narrative),
      structuredFacts: command.structuredFacts ?? {},
      evidenceQuality: command.evidenceQuality ?? "unknown",
      materialSignals: command.materialSignals ?? {},
      sourceTimestamp: command.sourceTimestamp,
    });
    const semanticHash = stableDigest({
      requestId: command.requestId,
      episodeId: command.episodeId,
      requestLineageRef: command.requestLineageRef,
      evidenceRefs,
      narrative: canonicalText(command.narrative),
      structuredFacts: command.structuredFacts ?? {},
      materialSignals: command.materialSignals ?? {},
    });
    const digest = duplicateDigestFor({ command, sourceHash, semanticHash, at });
    const priorByIdempotency = await this.repository.getOutcomeByIdempotencyKey(
      command.idempotencyKey,
    );
    if (priorByIdempotency) {
      if (priorByIdempotency.frozenBatch.sourceHash === sourceHash) {
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
        sourceHash,
        semanticHash,
        digest,
        replayClassification: "collision_review",
      });
    }
    const semanticReplay = await this.repository.getOutcomeByReplayKey(digest.replayKey);
    if (semanticReplay) return replayedOutcome(semanticReplay, "semantic_replay");
    return await this.materializeOutcome({
      command,
      at,
      sourceHash,
      semanticHash,
      digest,
      replayClassification: "new_command",
    });
  }

  private async materializeOutcome(input: {
    command: FollowupEvidenceIngressCommand;
    at: string;
    sourceHash: string;
    semanticHash: string;
    digest: FollowupDuplicateDigest;
    replayClassification: FollowupReplayClassification;
  }): Promise<PhoneFollowupAssimilationOutcome> {
    const frozenBatch = freezeBatch({
      command: input.command,
      sourceHash: input.sourceHash,
      semanticHash: input.semanticHash,
      digest: input.digest,
      at: input.at,
    });
    await this.repository.saveDuplicateDigest(input.digest);
    await this.repository.saveFrozenBatch(frozenBatch);

    const duplicateEvaluation = duplicateEvaluationFor({
      command: input.command,
      frozenBatch,
      digest: input.digest,
      replayClassification: input.replayClassification,
      at: input.at,
    });
    await this.repository.saveDuplicateEvaluation(duplicateEvaluation);

    const materiality = materialityFor({ command: input.command, duplicate: duplicateEvaluation });
    const evidenceItems = evidenceItemsFor(input.command);
    const suggestedClass = evidenceClassFor(input.command, input.command.materialSignals ?? {});
    const attachAllowed = duplicateEvaluation.decisionClass === "same_request_attach";
    const createCandidateSnapshot =
      attachAllowed &&
      !materiality.degradedFailClosed &&
      (materiality.materialityClass === "safety_material" ||
        materiality.materialityClass === "contact_safety_material");
    const candidateSnapshotIntent = createCandidateSnapshot
      ? await this.prepareCandidateSnapshotIntent({
          command: input.command,
          frozenBatch,
          semanticHash: input.semanticHash,
          at: input.at,
        })
      : null;
    const changedEvidenceRefs = input.digest.evidenceRefs;
    const activeReachabilityDependencyRefs = uniqueSorted([
      ...materiality.changedDependencyRefs,
      input.command.materialSignals?.deliveryFailureThreatensReachability
        ? "reachability_urgent_return"
        : null,
    ]);
    const settlement = await this.assimilationSafety.coordinator.assimilateEvidence({
      episodeId: input.command.episodeId,
      requestId: input.command.requestId,
      sourceDomain: sourceDomainFor(input.command.followupChannel),
      governingObjectRef: duplicateEvaluation.targetRequestRef ?? input.command.requestId,
      ingressEvidenceRefs: input.digest.evidenceRefs,
      decidedAt: input.at,
      currentSafetyDecisionEpoch: input.command.currentSafetyDecisionEpoch ?? 0,
      currentPendingPreemptionRef: input.command.currentPendingPreemptionRef ?? null,
      currentPendingSafetyEpoch: input.command.currentPendingSafetyEpoch ?? null,
      priorCompositeSnapshotRef: input.command.priorCompositeSnapshotRef ?? null,
      candidateSnapshotIntent,
      materialDelta: {
        changedEvidenceRefs,
        changedFeatureRefs: materiality.changedFeatureRefs,
        changedDependencyRefs: materiality.changedDependencyRefs,
        changedChronologyRefs: materiality.changedChronologyRefs,
        materialityPolicyRef: PHONE_FOLLOWUP_POLICY_VERSION,
        explicitMaterialityClass: materiality.materialityClass,
        explicitDecisionBasis: materiality.decisionBasis,
        degradedFailClosed: materiality.degradedFailClosed,
        currentPendingPreemptionRef: input.command.currentPendingPreemptionRef ?? null,
        reasonCodes: materiality.reasonCodes,
        decidedByRef: PHONE_FOLLOWUP_SERVICE_NAME,
      },
      classification: {
        classifierVersionRef: "phase2-phone-followup-classifier-194.v1",
        evidenceItems,
        activeDependencyRefs: activeReachabilityDependencyRefs,
        triggerReasonCodes: compactReasonCodes([
          "PHONE_FOLLOWUP_194_EVIDENCE_CLASSIFICATION_DECISION_SETTLED",
          ...materiality.reasonCodes,
        ]),
        confidenceBand: materiality.degradedFailClosed ? "low" : "high",
        explicitDominantEvidenceClass:
          materiality.degradedFailClosed && suggestedClass === "technical_metadata"
            ? "potentially_clinical"
            : suggestedClass,
        explicitMisclassificationRiskState: materiality.degradedFailClosed
          ? "fail_closed_review"
          : undefined,
        manualReviewOverride: duplicateEvaluation.reviewRequired || materiality.degradedFailClosed,
        decidedByRef: PHONE_FOLLOWUP_SERVICE_NAME,
      },
      safetyEvaluation: {
        requestTypeRef: input.command.requestTypeRef,
        featureStates: featureStatesFor(input.command.materialSignals ?? {}),
        deltaFeatureRefs: materiality.changedFeatureRefs,
        deltaDependencyRefs: materiality.changedDependencyRefs,
        activeReachabilityDependencyRefs,
        conflictVectorRef:
          materiality.decisionBasis === "contradiction_delta"
            ? stableRef("followup_conflict_vector_194", frozenBatch.followupBatchRef)
            : null,
        criticalMissingnessRef: materiality.degradedFailClosed
          ? stableRef("followup_degraded_missingness_194", frozenBatch.followupBatchRef)
          : null,
        priorityHint:
          input.command.materialSignals?.urgentRedFlag ||
          input.command.materialSignals?.deliveryFailureThreatensReachability
            ? "urgent_review"
            : "routine_review",
        blockingActionScopeRefs: ["request_closure", "routine_reassurance", "patient_calm_status"],
        reasonCode: materiality.degradedFailClosed
          ? "PHONE_FOLLOWUP_194_BLOCKED_MANUAL_REVIEW"
          : "PHONE_FOLLOWUP_194_RESAFETY_TRIGGERED",
        urgentDiversionIntent:
          input.command.materialSignals?.urgentRedFlag ||
          input.command.materialSignals?.deliveryFailureThreatensReachability
            ? {
                actionMode: "urgent_callback_opened",
                settlementState: "pending",
                presentationArtifactRef: stableRef(
                  "followup_urgent_review_artifact_194",
                  frozenBatch.followupBatchRef,
                ),
              }
            : null,
        preferredRulePackVersionRef: "phase2-phone-followup-safety-rules-194.v1",
        preferredCalibratorVersionRef: "phase2-phone-followup-safety-calibrator-194.v1",
      },
      replayClassHint:
        input.replayClassification === "new_command" ||
        input.replayClassification === "collision_review"
          ? null
          : input.replayClassification,
    });
    const assimilationChain = assimilationChainFor(settlement);
    const projectionHold = projectionHoldFor({
      command: input.command,
      duplicate: duplicateEvaluation,
      chain: assimilationChain,
      at: input.at,
    });
    await this.repository.saveProjectionHold(projectionHold);

    const outcome: PhoneFollowupAssimilationOutcome = {
      followupOutcomeRef: stableRef("phone_followup_outcome_194", {
        idempotencyKey: input.command.idempotencyKey,
        batch: frozenBatch.followupBatchRef,
        replayClassification: input.replayClassification,
      }),
      schemaVersion: PHONE_FOLLOWUP_SCHEMA_VERSION,
      idempotencyKey: input.command.idempotencyKey,
      replayClassification: input.replayClassification,
      replayed: false,
      frozenBatch,
      duplicateDigest: input.digest,
      duplicateEvaluation,
      assimilationChain,
      projectionHold,
      sideEffects: {
        createdFrozenBatch: true,
        createdDuplicateDecision: true,
        createdAssimilationChain: true,
        createdSafetyPreemption: assimilationChain.preemption !== null,
        createdProjectionHold: true,
        createdReceipt: false,
      },
      reasonCodes: compactReasonCodes([
        "PHONE_FOLLOWUP_194_GOVERNED_INGRESS_FROZEN",
        "PHONE_FOLLOWUP_194_CANONICAL_DUPLICATE_DIGEST",
        "PHONE_FOLLOWUP_194_EVIDENCE_ASSIMILATION_RECORD_SETTLED",
        "PHONE_FOLLOWUP_194_MATERIAL_DELTA_ASSESSMENT_SETTLED",
        "PHONE_FOLLOWUP_194_EVIDENCE_CLASSIFICATION_DECISION_SETTLED",
        input.replayClassification === "collision_review" &&
          "PHONE_FOLLOWUP_194_IDEMPOTENCY_COLLISION_REVIEW",
        assimilationChain.preemption && "PHONE_FOLLOWUP_194_RESAFETY_TRIGGERED",
        assimilationChain.assimilationRecord.assimilationState === "blocked_manual_review" &&
          "PHONE_FOLLOWUP_194_BLOCKED_MANUAL_REVIEW",
        ...duplicateEvaluation.reasonCodes,
        ...materiality.reasonCodes,
        ...projectionHold.reasonCodes,
      ]),
      createdAt: input.at,
      recordedBy: PHONE_FOLLOWUP_SERVICE_NAME,
    };
    await this.repository.saveOutcome(outcome);
    return outcome;
  }

  private async prepareCandidateSnapshotIntent(input: {
    command: FollowupEvidenceIngressCommand;
    frozenBatch: FrozenFollowupEvidenceBatch;
    semanticHash: string;
    at: string;
  }) {
    for (const evidenceRef of input.frozenBatch.frozenEvidenceRefs) {
      await this.assimilationSafety.evidenceBackbone.artifacts.registerSourceArtifact({
        artifactId: evidenceRef,
        locator: `ref://${evidenceRef}`,
        checksum: stableDigest({
          evidenceRef,
          batch: input.frozenBatch.followupBatchRef,
        }),
        mediaType: mediaTypeFor(input.command.evidenceKind),
        byteLength: Math.max(1, evidenceRef.length),
        createdAt: input.at,
      });
    }
    await this.assimilationSafety.evidenceBackbone.captureBundles.freezeCaptureBundle({
      captureBundleId: input.frozenBatch.followupBatchRef,
      evidenceLineageRef: input.command.requestId,
      sourceChannel: input.command.followupChannel,
      replayClass: "distinct",
      transportCorrelationRef: input.command.sourceLineageRef,
      capturePolicyVersion: PHONE_FOLLOWUP_POLICY_VERSION,
      sourceHash: input.frozenBatch.sourceHash,
      semanticHash: input.semanticHash,
      sourceArtifactRefs: input.frozenBatch.frozenEvidenceRefs,
      attachmentArtifactRefs: input.frozenBatch.groupedEvidenceRefs.attachment,
      audioArtifactRefs: input.frozenBatch.groupedEvidenceRefs.audio,
      metadataArtifactRefs: [
        ...input.frozenBatch.groupedEvidenceRefs.contact_route,
        ...input.frozenBatch.groupedEvidenceRefs.form_supplement,
      ],
      createdAt: input.at,
    });

    const normalizedArtifactRef = stableRef("followup_norm_artifact_194", {
      batch: input.frozenBatch.followupBatchRef,
    });
    const factsArtifactRef = stableRef("followup_facts_artifact_194", {
      batch: input.frozenBatch.followupBatchRef,
    });
    await this.assimilationSafety.evidenceBackbone.artifacts.registerDerivedArtifact({
      artifactId: normalizedArtifactRef,
      locator: `derived://${normalizedArtifactRef}`,
      checksum: stableDigest({
        normalized: input.semanticHash,
        batch: input.frozenBatch.followupBatchRef,
      }),
      mediaType: "application/json",
      byteLength: Math.max(1, input.semanticHash.length),
      createdAt: input.at,
    });
    await this.assimilationSafety.evidenceBackbone.artifacts.registerDerivedArtifact({
      artifactId: factsArtifactRef,
      locator: `derived://${factsArtifactRef}`,
      checksum: stableDigest({
        facts: input.command.structuredFacts ?? {},
        materialSignals: input.command.materialSignals ?? {},
      }),
      mediaType: "application/json",
      byteLength: Math.max(1, stableStringify(input.command.structuredFacts ?? {}).length),
      createdAt: input.at,
    });

    const normalizedPackageRef = stableRef("followup_norm_pkg_194", {
      batch: input.frozenBatch.followupBatchRef,
    });
    const factsPackageRef = stableRef("followup_facts_pkg_194", {
      batch: input.frozenBatch.followupBatchRef,
    });
    await this.assimilationSafety.evidenceBackbone.derivations.createDerivationPackage({
      derivationPackageId: normalizedPackageRef,
      captureBundleRef: input.frozenBatch.followupBatchRef,
      derivationClass: "canonical_normalization",
      derivationVersion: PHONE_FOLLOWUP_SCHEMA_VERSION,
      policyVersionRef: PHONE_FOLLOWUP_POLICY_VERSION,
      derivedArtifactRef: normalizedArtifactRef,
      structuredDigest: input.semanticHash,
      createdAt: input.at,
    });
    await this.assimilationSafety.evidenceBackbone.derivations.createDerivationPackage({
      derivationPackageId: factsPackageRef,
      captureBundleRef: input.frozenBatch.followupBatchRef,
      derivationClass: "structured_fact_extraction",
      derivationVersion: PHONE_FOLLOWUP_SCHEMA_VERSION,
      policyVersionRef: PHONE_FOLLOWUP_POLICY_VERSION,
      derivedArtifactRef: factsArtifactRef,
      structuredDigest: stableDigest(input.command.materialSignals ?? {}),
      createdAt: input.at,
    });

    return {
      evidenceSnapshotId: stableRef("phone_followup_evidence_snapshot_194", {
        batch: input.frozenBatch.followupBatchRef,
        semanticHash: input.semanticHash,
      }),
      captureBundleRef: input.frozenBatch.followupBatchRef,
      authoritativeNormalizedDerivationPackageRef: normalizedPackageRef,
      authoritativeDerivedFactsPackageRef: factsPackageRef,
      currentSummaryParityRecordRef: null,
      createdAt: input.at,
    };
  }
}

export interface PhoneFollowupResafetyApplication {
  readonly repository: PhoneFollowupResafetyRepository;
  readonly service: PhoneFollowupResafetyService;
  readonly assimilationRepositories: AssimilationSafetyDependencies;
  readonly assimilationSafety: AssimilationSafetyServices;
  readonly persistenceTables: typeof phoneFollowupPersistenceTables;
  readonly migrationPlanRefs: typeof phoneFollowupMigrationPlanRefs;
  readonly gapResolutions: typeof phoneFollowupGapResolutions;
  readonly continuityWitnessCatalog: typeof phoneFollowupContinuityWitnessCatalog;
  readonly reasonCatalog: typeof phoneFollowupReasonCatalog;
}

export function createPhoneFollowupResafetyApplication(options?: {
  repository?: PhoneFollowupResafetyRepository;
  assimilationRepositories?: AssimilationSafetyDependencies;
  assimilationSafety?: AssimilationSafetyServices;
}): PhoneFollowupResafetyApplication {
  const repository = options?.repository ?? createInMemoryPhoneFollowupResafetyRepository();
  const assimilationRepositories =
    options?.assimilationRepositories ?? createAssimilationSafetyStore();
  const assimilationSafety =
    options?.assimilationSafety ?? createAssimilationSafetyServices(assimilationRepositories);
  return {
    repository,
    service: new PhoneFollowupResafetyService(repository, assimilationSafety),
    assimilationRepositories,
    assimilationSafety,
    persistenceTables: phoneFollowupPersistenceTables,
    migrationPlanRefs: phoneFollowupMigrationPlanRefs,
    gapResolutions: phoneFollowupGapResolutions,
    continuityWitnessCatalog: phoneFollowupContinuityWitnessCatalog,
    reasonCatalog: phoneFollowupReasonCatalog,
  };
}
