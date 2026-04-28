import { createHash } from "node:crypto";

export type ISODateString = string;

export type TranscriptActorRole =
  | "audio_capture_worker"
  | "transcript_pipeline_worker"
  | "clinical_reviewer"
  | "clinical_safety_lead"
  | "retention_policy_engine"
  | "artifact_presentation_worker"
  | "documentation_composer"
  | "system";

export type AudioSourceType =
  | "telephony_recording"
  | "uploaded_audio_artifact"
  | "clinician_dictation_clip"
  | "live_ambient_capture"
  | "uploaded_text_artifact";

export type AudioCaptureMode =
  | "existing_recording"
  | "uploaded_artifact"
  | "manual_dictation"
  | "manual_start_ambient"
  | "automatic_ambient";

export type PermissionState =
  | "not_required_prior_capture"
  | "informed"
  | "explicit_granted"
  | "objected"
  | "withdrawn"
  | "blocked"
  | "policy_pending";

export type ArtifactQuarantineState = "quarantined" | "cleared" | "blocked";

export type AudioCaptureSessionState = "open" | "ended" | "blocked" | "superseded";

export type TranscriptJobStatus = "scheduled" | "running" | "completed" | "quarantined" | "failed_closed" | "cancelled";

export type DiarisationMode = "none" | "single_speaker" | "multi_speaker";

export type LanguageMode = "english_uk" | "english_second_language" | "multilingual_review_required";

export type AudioQualityState = "clear" | "noisy" | "low_quality" | "unsupported";

export type DiarisationUncertaintyState = "complete" | "uncertain" | "failed";

export type TranscriptArtifactState = "candidate" | "normalized" | "quarantined" | "ready_for_drafting" | "superseded" | "revoked";

export type RedactionState = "pending" | "settled" | "failed" | "not_required";

export type RetentionArtifactType =
  | "audio_capture"
  | "raw_transcript"
  | "speaker_segments"
  | "clinical_concept_spans"
  | "redacted_transcript"
  | "transcript_presentation";

export type RetentionDecisionState = "retained" | "delete_due" | "blocked_legal_hold" | "blocked_policy_conflict";

export type TranscriptPresentationArtifactState =
  | "summary_only"
  | "inline_renderable"
  | "external_handoff_ready"
  | "recovery_only"
  | "blocked"
  | "revoked";

export interface TranscriptActorContext {
  actorRef: string;
  actorRole: TranscriptActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface TranscriptAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: TranscriptActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface AudioCaptureSession {
  audioCaptureSessionId: string;
  sourceType: AudioSourceType;
  captureMode: AudioCaptureMode;
  permissionState: PermissionState;
  permissionEvidenceRef: string;
  tenantAmbientPolicyRef?: string;
  localGovernanceApprovalRef?: string;
  retentionPolicyRef: string;
  retentionEnvelopeRef?: string;
  startedAt: ISODateString;
  endedAt?: ISODateString;
  artifactRef: string;
  sourceCaptureBundleRef?: string;
  artifactQuarantineState: ArtifactQuarantineState;
  captureSessionState: AudioCaptureSessionState;
  blockingReasonCodes: readonly string[];
}

export interface TranscriptJob {
  transcriptJobId: string;
  audioCaptureSessionRef: string;
  audioArtifactRef: string;
  sourceCaptureBundleRef: string;
  diarisationMode: DiarisationMode;
  languageMode: LanguageMode;
  status: TranscriptJobStatus;
  modelVersionRef: string;
  transcriptModelPolicyRef: string;
  outputRef?: string;
  errorRef?: string;
  supersedesTranscriptArtifactRef?: string;
  scheduledAt: ISODateString;
  completedAt?: ISODateString;
}

export interface SpeakerSegment {
  segmentId: string;
  speakerLabel: string;
  startMs: number;
  endMs: number;
  textRef: string;
  confidence: number;
}

export interface ClinicalConceptSpan {
  conceptSpanId: string;
  sourceSegmentRef: string;
  conceptType: string;
  valueRef: string;
  confidence: number;
  normalizationRef: string;
}

export interface RedactionSpan {
  redactionSpanId: string;
  sourceSegmentRef: string;
  redactionClass: string;
  startOffset: number;
  endOffset: number;
  replacementRef: string;
  policyRef: string;
}

export interface EvidenceDerivationPackage {
  derivationPackageId: string;
  sourceCaptureBundleRef: string;
  transcriptJobRef: string;
  modelVersionRef: string;
  diarisationMode: DiarisationMode;
  languageMode: LanguageMode;
  audioQualityState: AudioQualityState;
  diarisationUncertaintyState: DiarisationUncertaintyState;
  normalizationVersionRef: string;
  conceptExtractionVersionRef?: string;
  redactionPolicyRef?: string;
  supersedesDerivationPackageRef?: string;
  derivationHash: string;
  immutabilityState: "immutable";
  createdAt: ISODateString;
}

export interface TranscriptArtifact {
  transcriptArtifactId: string;
  audioCaptureSessionRef: string;
  sourceCaptureBundleRef: string;
  derivationPackageRef: string;
  rawTranscriptRef: string;
  speakerSegmentsRef: string;
  speakerSegmentRefs: readonly string[];
  confidenceSummary: string;
  clinicalConceptRefs: readonly string[];
  redactionRefs: readonly string[];
  redactionState: RedactionState;
  retentionEnvelopeRef: string;
  artifactState: TranscriptArtifactState;
  referencedByFrozenEvidenceSnapshotRefs: readonly string[];
  supersedesTranscriptArtifactRef?: string;
  createdAt: ISODateString;
}

export interface RetentionEnvelope {
  retentionEnvelopeId: string;
  artifactType: RetentionArtifactType;
  artifactRef: string;
  retentionBasis: string;
  deleteAfter: ISODateString;
  reviewSchedule: string;
  legalHoldRef?: string;
  retentionFreezeRef?: string;
  policyConflictRef?: string;
  envelopeState: "active" | "delete_due" | "blocked" | "superseded";
  createdAt: ISODateString;
}

export interface TranscriptPresentationArtifact {
  transcriptPresentationArtifactId: string;
  transcriptArtifactRef: string;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef?: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  artifactState: TranscriptPresentationArtifactState;
  blockingReasonCodes: readonly string[];
  createdAt: ISODateString;
}

export interface TranscriptDomainEvent {
  eventId: string;
  eventName: "assistive.transcript.ready" | "assistive.context.snapshot.created";
  subjectRef: string;
  payloadHash: string;
  emittedAt: ISODateString;
}

export interface AssistiveTranscriptStore {
  audioCaptureSessions: Map<string, AudioCaptureSession>;
  transcriptJobs: Map<string, TranscriptJob>;
  speakerSegments: Map<string, SpeakerSegment>;
  conceptSpans: Map<string, ClinicalConceptSpan>;
  redactionSpans: Map<string, RedactionSpan>;
  derivationPackages: Map<string, EvidenceDerivationPackage>;
  transcriptArtifacts: Map<string, TranscriptArtifact>;
  retentionEnvelopes: Map<string, RetentionEnvelope>;
  presentationArtifacts: Map<string, TranscriptPresentationArtifact>;
  auditRecords: TranscriptAuditRecord[];
  events: TranscriptDomainEvent[];
  idempotencyKeys: Map<string, string>;
}

export interface TranscriptClock {
  now(): ISODateString;
}

export interface TranscriptIdGenerator {
  next(prefix: string): string;
}

export interface CreateAudioCaptureSessionCommand {
  sourceType: AudioSourceType;
  captureMode: AudioCaptureMode;
  permissionState: PermissionState;
  permissionEvidenceRef: string;
  retentionPolicyRef: string;
  artifactRef: string;
  startedAt?: ISODateString;
  tenantAmbientPolicyRef?: string;
  localGovernanceApprovalRef?: string;
  ambientCaptureApproved?: boolean;
  idempotencyKey?: string;
}

export interface AttachRetentionEnvelopeCommand {
  artifactType: RetentionArtifactType;
  artifactRef: string;
  retentionBasis: string;
  deleteAfter: ISODateString;
  reviewSchedule: string;
  legalHoldRef?: string;
  retentionFreezeRef?: string;
  policyConflictRef?: string;
  idempotencyKey?: string;
}

export interface ReleaseCaptureQuarantineCommand {
  audioCaptureSessionId: string;
  sourceCaptureBundleRef: string;
  malwareScanRef: string;
}

export interface ScheduleTranscriptJobCommand {
  audioCaptureSessionRef: string;
  diarisationMode: DiarisationMode;
  languageMode: LanguageMode;
  modelVersionRef: string;
  transcriptModelPolicyRef: string;
  supersedesTranscriptArtifactRef?: string;
  idempotencyKey?: string;
}

export interface CompleteTranscriptJobCommand {
  transcriptJobId: string;
  rawTranscriptRef: string;
  speakerSegments: readonly Omit<SpeakerSegment, "segmentId">[];
  confidenceSummary: string;
  audioQualityState: AudioQualityState;
  diarisationUncertaintyState: DiarisationUncertaintyState;
  normalizationVersionRef: string;
  rawTranscriptText?: string;
}

export interface ApplyRedactionsCommand {
  transcriptArtifactId: string;
  redactionPolicyRef: string;
  redactionTransformHash: string;
  spans: readonly Omit<RedactionSpan, "redactionSpanId" | "policyRef">[];
  rawTranscriptText?: string;
}

export interface ExtractConceptSpansCommand {
  transcriptArtifactId: string;
  extractionVersionRef: string;
  spans: readonly Omit<ClinicalConceptSpan, "conceptSpanId">[];
  rawTranscriptText?: string;
}

export interface EnforceRetentionCommand {
  retentionEnvelopeId: string;
  evaluatedAt?: ISODateString;
}

export interface GenerateTranscriptPresentationCommand {
  transcriptArtifactRef: string;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef?: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  requestedArtifactState?: TranscriptPresentationArtifactState;
  rawBlobUrl?: string;
  directDownloadUrl?: string;
  permissionStateOverride?: PermissionState;
  recoveryState?: "normal" | "recovery_only" | "hard_block";
  idempotencyKey?: string;
}

export interface MarkTranscriptReadyCommand {
  transcriptArtifactId: string;
  frozenContextSnapshotRef: string;
}

interface TranscriptRuntime {
  store: AssistiveTranscriptStore;
  clock: TranscriptClock;
  idGenerator: TranscriptIdGenerator;
}

export class AssistiveTranscriptError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly reasonCodes: readonly string[] = [],
  ) {
    super(message);
    this.name = "AssistiveTranscriptError";
  }
}

export const assistiveTranscriptServiceNames = [
  "AudioCaptureSessionService",
  "TranscriptJobOrchestrator",
  "TranscriptNormalizationPipeline",
  "TranscriptArtifactService",
  "TranscriptRedactionService",
  "ClinicalConceptSpanExtractor",
  "RetentionEnvelopeService",
  "TranscriptPresentationArtifactService",
] as const;

export function createAssistiveTranscriptStore(): AssistiveTranscriptStore {
  return {
    audioCaptureSessions: new Map(),
    transcriptJobs: new Map(),
    speakerSegments: new Map(),
    conceptSpans: new Map(),
    redactionSpans: new Map(),
    derivationPackages: new Map(),
    transcriptArtifacts: new Map(),
    retentionEnvelopes: new Map(),
    presentationArtifacts: new Map(),
    auditRecords: [],
    events: [],
    idempotencyKeys: new Map(),
  };
}

export function createDeterministicTranscriptIdGenerator(): TranscriptIdGenerator {
  const counters = new Map<string, number>();
  return {
    next(prefix: string): string {
      const nextValue = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, nextValue);
      return `${prefix}_${String(nextValue).padStart(6, "0")}`;
    },
  };
}

export function stableTranscriptHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export class AudioCaptureSessionService {
  public constructor(private readonly runtime: TranscriptRuntime) {}

  public createSession(command: CreateAudioCaptureSessionCommand, actor: TranscriptActorContext): AudioCaptureSession {
    requireRole(actor, ["audio_capture_worker", "clinical_reviewer", "system"], "TRANSCRIPT_CAPTURE_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "audio_capture_session", command.idempotencyKey, this.runtime.store.audioCaptureSessions);
    if (existing) {
      return existing;
    }
    const blockingReasonCodes = validateCaptureCommand(command);
    if (blockingReasonCodes.length > 0) {
      writeAudit(this.runtime, "AudioCaptureSessionService", "createSession", actor, command.artifactRef, "blocked", blockingReasonCodes);
      throw new AssistiveTranscriptError("TRANSCRIPT_CAPTURE_BLOCKED", "Audio capture session failed permission or policy validation.", blockingReasonCodes);
    }
    requireNonEmpty(command.permissionEvidenceRef, "permissionEvidenceRef");
    requireNonEmpty(command.retentionPolicyRef, "retentionPolicyRef");
    requireNonEmpty(command.artifactRef, "artifactRef");

    const session: AudioCaptureSession = {
      audioCaptureSessionId: this.runtime.idGenerator.next("audio_capture_session"),
      sourceType: command.sourceType,
      captureMode: command.captureMode,
      permissionState: command.permissionState,
      permissionEvidenceRef: command.permissionEvidenceRef,
      tenantAmbientPolicyRef: command.tenantAmbientPolicyRef,
      localGovernanceApprovalRef: command.localGovernanceApprovalRef,
      retentionPolicyRef: command.retentionPolicyRef,
      startedAt: command.startedAt ?? this.runtime.clock.now(),
      artifactRef: command.artifactRef,
      artifactQuarantineState: "quarantined",
      captureSessionState: "open",
      blockingReasonCodes: [],
    };
    this.runtime.store.audioCaptureSessions.set(session.audioCaptureSessionId, session);
    setIdempotent(this.runtime, "audio_capture_session", command.idempotencyKey, session.audioCaptureSessionId);
    writeAudit(this.runtime, "AudioCaptureSessionService", "createSession", actor, session.audioCaptureSessionId, "accepted", []);
    return session;
  }

  public attachRetentionEnvelope(audioCaptureSessionId: string, retentionEnvelopeRef: string, actor: TranscriptActorContext): AudioCaptureSession {
    requireRole(actor, ["audio_capture_worker", "retention_policy_engine", "system"], "TRANSCRIPT_CAPTURE_FORBIDDEN");
    const session = requireFromMap(this.runtime.store.audioCaptureSessions, audioCaptureSessionId, "TRANSCRIPT_CAPTURE_SESSION_NOT_FOUND");
    requireFromMap(this.runtime.store.retentionEnvelopes, retentionEnvelopeRef, "TRANSCRIPT_RETENTION_ENVELOPE_NOT_FOUND");
    const updated = {
      ...session,
      retentionEnvelopeRef,
    };
    this.runtime.store.audioCaptureSessions.set(audioCaptureSessionId, updated);
    writeAudit(this.runtime, "AudioCaptureSessionService", "attachRetentionEnvelope", actor, audioCaptureSessionId, "accepted", []);
    return updated;
  }

  public releaseQuarantine(command: ReleaseCaptureQuarantineCommand, actor: TranscriptActorContext): AudioCaptureSession {
    requireRole(actor, ["audio_capture_worker", "transcript_pipeline_worker", "system"], "TRANSCRIPT_QUARANTINE_RELEASE_FORBIDDEN");
    const session = requireFromMap(this.runtime.store.audioCaptureSessions, command.audioCaptureSessionId, "TRANSCRIPT_CAPTURE_SESSION_NOT_FOUND");
    assertPermissionAllowsTranscription(session.permissionState);
    requireNonEmpty(command.sourceCaptureBundleRef, "sourceCaptureBundleRef");
    requireNonEmpty(command.malwareScanRef, "malwareScanRef");
    if (!session.retentionEnvelopeRef) {
      throw new AssistiveTranscriptError("TRANSCRIPT_RETENTION_REQUIRED", "Capture cannot leave quarantine without a retention envelope.", [
        "retention_envelope_missing",
      ]);
    }
    const updated: AudioCaptureSession = {
      ...session,
      sourceCaptureBundleRef: command.sourceCaptureBundleRef,
      artifactQuarantineState: "cleared",
    };
    this.runtime.store.audioCaptureSessions.set(session.audioCaptureSessionId, updated);
    writeAudit(this.runtime, "AudioCaptureSessionService", "releaseQuarantine", actor, session.audioCaptureSessionId, "accepted", []);
    return updated;
  }

  public endSession(audioCaptureSessionId: string, actor: TranscriptActorContext): AudioCaptureSession {
    requireRole(actor, ["audio_capture_worker", "clinical_reviewer", "system"], "TRANSCRIPT_CAPTURE_FORBIDDEN");
    const session = requireFromMap(this.runtime.store.audioCaptureSessions, audioCaptureSessionId, "TRANSCRIPT_CAPTURE_SESSION_NOT_FOUND");
    const updated: AudioCaptureSession = {
      ...session,
      endedAt: this.runtime.clock.now(),
      captureSessionState: session.captureSessionState === "blocked" ? "blocked" : "ended",
    };
    this.runtime.store.audioCaptureSessions.set(audioCaptureSessionId, updated);
    writeAudit(this.runtime, "AudioCaptureSessionService", "endSession", actor, audioCaptureSessionId, "accepted", []);
    return updated;
  }
}

export class RetentionEnvelopeService {
  public constructor(private readonly runtime: TranscriptRuntime) {}

  public createRetentionEnvelope(command: AttachRetentionEnvelopeCommand, actor: TranscriptActorContext): RetentionEnvelope {
    requireRole(actor, ["retention_policy_engine", "audio_capture_worker", "system"], "TRANSCRIPT_RETENTION_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "retention_envelope", command.idempotencyKey, this.runtime.store.retentionEnvelopes);
    if (existing) {
      return existing;
    }
    requireNonEmpty(command.artifactRef, "artifactRef");
    requireNonEmpty(command.retentionBasis, "retentionBasis");
    requireNonEmpty(command.deleteAfter, "deleteAfter");
    requireNonEmpty(command.reviewSchedule, "reviewSchedule");
    if (Number.isNaN(Date.parse(command.deleteAfter))) {
      throw new AssistiveTranscriptError("TRANSCRIPT_RETENTION_DATE_INVALID", "deleteAfter must be an ISO date.");
    }
    const envelope: RetentionEnvelope = {
      retentionEnvelopeId: this.runtime.idGenerator.next("transcript_retention"),
      artifactType: command.artifactType,
      artifactRef: command.artifactRef,
      retentionBasis: command.retentionBasis,
      deleteAfter: command.deleteAfter,
      reviewSchedule: command.reviewSchedule,
      legalHoldRef: command.legalHoldRef,
      retentionFreezeRef: command.retentionFreezeRef,
      policyConflictRef: command.policyConflictRef,
      envelopeState: command.legalHoldRef || command.retentionFreezeRef || command.policyConflictRef ? "blocked" : "active",
      createdAt: this.runtime.clock.now(),
    };
    this.runtime.store.retentionEnvelopes.set(envelope.retentionEnvelopeId, envelope);
    setIdempotent(this.runtime, "retention_envelope", command.idempotencyKey, envelope.retentionEnvelopeId);
    writeAudit(this.runtime, "RetentionEnvelopeService", "createRetentionEnvelope", actor, envelope.retentionEnvelopeId, "accepted", []);
    return envelope;
  }

  public enforceDeletionSchedule(command: EnforceRetentionCommand, actor: TranscriptActorContext): {
    retentionEnvelope: RetentionEnvelope;
    decisionState: RetentionDecisionState;
    reasonCodes: readonly string[];
  } {
    requireRole(actor, ["retention_policy_engine", "system"], "TRANSCRIPT_RETENTION_FORBIDDEN");
    const envelope = requireFromMap(this.runtime.store.retentionEnvelopes, command.retentionEnvelopeId, "TRANSCRIPT_RETENTION_ENVELOPE_NOT_FOUND");
    const evaluatedAt = command.evaluatedAt ?? this.runtime.clock.now();
    const reasonCodes: string[] = [];
    let decisionState: RetentionDecisionState = "retained";
    if (envelope.legalHoldRef || envelope.retentionFreezeRef) {
      decisionState = "blocked_legal_hold";
      reasonCodes.push("legal_hold_or_retention_freeze_active");
    } else if (envelope.policyConflictRef) {
      decisionState = "blocked_policy_conflict";
      reasonCodes.push("retention_policy_conflict");
    } else if (Date.parse(evaluatedAt) >= Date.parse(envelope.deleteAfter)) {
      decisionState = "delete_due";
      reasonCodes.push("retention_period_elapsed");
    }
    const updated: RetentionEnvelope = {
      ...envelope,
      envelopeState: decisionState === "delete_due" ? "delete_due" : decisionState === "retained" ? "active" : "blocked",
    };
    this.runtime.store.retentionEnvelopes.set(envelope.retentionEnvelopeId, updated);
    writeAudit(this.runtime, "RetentionEnvelopeService", "enforceDeletionSchedule", actor, envelope.retentionEnvelopeId, "accepted", reasonCodes);
    return {
      retentionEnvelope: updated,
      decisionState,
      reasonCodes,
    };
  }
}

export class TranscriptJobOrchestrator {
  public constructor(private readonly runtime: TranscriptRuntime) {}

  public scheduleTranscriptJob(command: ScheduleTranscriptJobCommand, actor: TranscriptActorContext): TranscriptJob {
    requireRole(actor, ["transcript_pipeline_worker", "system"], "TRANSCRIPT_JOB_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "transcript_job", command.idempotencyKey, this.runtime.store.transcriptJobs);
    if (existing) {
      return existing;
    }
    const session = requireFromMap(this.runtime.store.audioCaptureSessions, command.audioCaptureSessionRef, "TRANSCRIPT_CAPTURE_SESSION_NOT_FOUND");
    assertPermissionAllowsTranscription(session.permissionState);
    if (session.artifactQuarantineState !== "cleared") {
      throw new AssistiveTranscriptError("TRANSCRIPT_ARTIFACT_NOT_CLEARED", "Transcript jobs require quarantine-cleared artifacts.", [
        "quarantine_not_cleared",
      ]);
    }
    requireNonEmpty(session.sourceCaptureBundleRef, "sourceCaptureBundleRef");
    requireNonEmpty(command.modelVersionRef, "modelVersionRef");
    requireNonEmpty(command.transcriptModelPolicyRef, "transcriptModelPolicyRef");
    const job: TranscriptJob = {
      transcriptJobId: this.runtime.idGenerator.next("transcript_job"),
      audioCaptureSessionRef: session.audioCaptureSessionId,
      audioArtifactRef: session.artifactRef,
      sourceCaptureBundleRef: session.sourceCaptureBundleRef,
      diarisationMode: command.diarisationMode,
      languageMode: command.languageMode,
      status: "scheduled",
      modelVersionRef: command.modelVersionRef,
      transcriptModelPolicyRef: command.transcriptModelPolicyRef,
      supersedesTranscriptArtifactRef: command.supersedesTranscriptArtifactRef,
      scheduledAt: this.runtime.clock.now(),
    };
    this.runtime.store.transcriptJobs.set(job.transcriptJobId, job);
    setIdempotent(this.runtime, "transcript_job", command.idempotencyKey, job.transcriptJobId);
    writeAudit(this.runtime, "TranscriptJobOrchestrator", "scheduleTranscriptJob", actor, job.transcriptJobId, "accepted", []);
    return job;
  }

  public startTranscriptJob(transcriptJobId: string, actor: TranscriptActorContext): TranscriptJob {
    requireRole(actor, ["transcript_pipeline_worker", "system"], "TRANSCRIPT_JOB_FORBIDDEN");
    const job = requireFromMap(this.runtime.store.transcriptJobs, transcriptJobId, "TRANSCRIPT_JOB_NOT_FOUND");
    if (job.status !== "scheduled") {
      throw new AssistiveTranscriptError("TRANSCRIPT_JOB_NOT_SCHEDULED", "Only scheduled transcript jobs can start.");
    }
    const updated = {
      ...job,
      status: "running" as const,
    };
    this.runtime.store.transcriptJobs.set(transcriptJobId, updated);
    writeAudit(this.runtime, "TranscriptJobOrchestrator", "startTranscriptJob", actor, transcriptJobId, "accepted", []);
    return updated;
  }

  public failTranscriptJob(transcriptJobId: string, errorRef: string, actor: TranscriptActorContext): TranscriptJob {
    requireRole(actor, ["transcript_pipeline_worker", "system"], "TRANSCRIPT_JOB_FORBIDDEN");
    const job = requireFromMap(this.runtime.store.transcriptJobs, transcriptJobId, "TRANSCRIPT_JOB_NOT_FOUND");
    const updated: TranscriptJob = {
      ...job,
      status: "failed_closed",
      errorRef,
      completedAt: this.runtime.clock.now(),
    };
    this.runtime.store.transcriptJobs.set(transcriptJobId, updated);
    writeAudit(this.runtime, "TranscriptJobOrchestrator", "failTranscriptJob", actor, transcriptJobId, "failed_closed", ["pipeline_error_ref_recorded"]);
    return updated;
  }
}

export class TranscriptNormalizationPipeline {
  public constructor(private readonly runtime: TranscriptRuntime) {}

  public completeTranscriptJob(command: CompleteTranscriptJobCommand, actor: TranscriptActorContext): TranscriptArtifact {
    requireRole(actor, ["transcript_pipeline_worker", "system"], "TRANSCRIPT_NORMALIZATION_FORBIDDEN");
    if (command.rawTranscriptText) {
      throw new AssistiveTranscriptError("TRANSCRIPT_RAW_TEXT_FORBIDDEN", "Routine transcript pipeline commands must use refs, not raw transcript text.", [
        "raw_transcript_text_forbidden",
      ]);
    }
    const job = requireFromMap(this.runtime.store.transcriptJobs, command.transcriptJobId, "TRANSCRIPT_JOB_NOT_FOUND");
    if (!["scheduled", "running"].includes(job.status)) {
      throw new AssistiveTranscriptError("TRANSCRIPT_JOB_NOT_ACTIVE", "Only active transcript jobs can complete.");
    }
    requireNonEmpty(command.rawTranscriptRef, "rawTranscriptRef");
    requireNonEmpty(command.confidenceSummary, "confidenceSummary");
    requireNonEmpty(command.normalizationVersionRef, "normalizationVersionRef");
    requireNonEmptyArray(command.speakerSegments, "speakerSegments");

    const session = requireFromMap(this.runtime.store.audioCaptureSessions, job.audioCaptureSessionRef, "TRANSCRIPT_CAPTURE_SESSION_NOT_FOUND");
    if (!session.retentionEnvelopeRef) {
      throw new AssistiveTranscriptError("TRANSCRIPT_RETENTION_REQUIRED", "Transcript artifact requires source retention envelope.", [
        "retention_envelope_missing",
      ]);
    }
    const segmentRecords = command.speakerSegments.map((segment) => {
      if (segment.endMs <= segment.startMs) {
        throw new AssistiveTranscriptError("TRANSCRIPT_SEGMENT_INVALID", "Speaker segment endMs must be greater than startMs.");
      }
      return {
        ...segment,
        segmentId: this.runtime.idGenerator.next("speaker_segment"),
      };
    });
    for (const segment of segmentRecords) {
      this.runtime.store.speakerSegments.set(segment.segmentId, segment);
    }

    const previousArtifact = job.supersedesTranscriptArtifactRef
      ? requireFromMap(this.runtime.store.transcriptArtifacts, job.supersedesTranscriptArtifactRef, "TRANSCRIPT_ARTIFACT_NOT_FOUND")
      : undefined;
    const previousDerivation = previousArtifact
      ? requireFromMap(this.runtime.store.derivationPackages, previousArtifact.derivationPackageRef, "TRANSCRIPT_DERIVATION_NOT_FOUND")
      : undefined;
    const derivationInput = {
      sourceCaptureBundleRef: job.sourceCaptureBundleRef,
      transcriptJobRef: job.transcriptJobId,
      modelVersionRef: job.modelVersionRef,
      diarisationMode: job.diarisationMode,
      languageMode: job.languageMode,
      audioQualityState: command.audioQualityState,
      diarisationUncertaintyState: command.diarisationUncertaintyState,
      normalizationVersionRef: command.normalizationVersionRef,
      rawTranscriptRef: command.rawTranscriptRef,
      speakerSegmentRefs: segmentRecords.map((segment) => segment.segmentId),
      supersedesDerivationPackageRef: previousDerivation?.derivationPackageId,
    };
    const derivationPackage: EvidenceDerivationPackage = {
      derivationPackageId: this.runtime.idGenerator.next("evidence_derivation_package"),
      sourceCaptureBundleRef: job.sourceCaptureBundleRef,
      transcriptJobRef: job.transcriptJobId,
      modelVersionRef: job.modelVersionRef,
      diarisationMode: job.diarisationMode,
      languageMode: job.languageMode,
      audioQualityState: command.audioQualityState,
      diarisationUncertaintyState: command.diarisationUncertaintyState,
      normalizationVersionRef: command.normalizationVersionRef,
      supersedesDerivationPackageRef: previousDerivation?.derivationPackageId,
      derivationHash: stableTranscriptHash(derivationInput),
      immutabilityState: "immutable",
      createdAt: this.runtime.clock.now(),
    };
    this.runtime.store.derivationPackages.set(derivationPackage.derivationPackageId, derivationPackage);

    const artifactState =
      command.audioQualityState === "unsupported" ||
      command.audioQualityState === "low_quality" ||
      command.diarisationUncertaintyState === "failed"
        ? "quarantined"
        : "normalized";
    const artifact: TranscriptArtifact = {
      transcriptArtifactId: this.runtime.idGenerator.next("transcript_artifact"),
      audioCaptureSessionRef: session.audioCaptureSessionId,
      sourceCaptureBundleRef: job.sourceCaptureBundleRef,
      derivationPackageRef: derivationPackage.derivationPackageId,
      rawTranscriptRef: command.rawTranscriptRef,
      speakerSegmentsRef: `speaker-segments:${derivationPackage.derivationPackageId}`,
      speakerSegmentRefs: segmentRecords.map((segment) => segment.segmentId),
      confidenceSummary: command.confidenceSummary,
      clinicalConceptRefs: [],
      redactionRefs: [],
      redactionState: "pending",
      retentionEnvelopeRef: session.retentionEnvelopeRef,
      artifactState,
      referencedByFrozenEvidenceSnapshotRefs: [],
      supersedesTranscriptArtifactRef: previousArtifact?.transcriptArtifactId,
      createdAt: this.runtime.clock.now(),
    };
    this.runtime.store.transcriptArtifacts.set(artifact.transcriptArtifactId, artifact);
    if (previousArtifact) {
      this.runtime.store.transcriptArtifacts.set(previousArtifact.transcriptArtifactId, {
        ...previousArtifact,
        artifactState: "superseded",
      });
    }
    this.runtime.store.transcriptJobs.set(job.transcriptJobId, {
      ...job,
      status: artifactState === "quarantined" ? "quarantined" : "completed",
      outputRef: artifact.transcriptArtifactId,
      completedAt: this.runtime.clock.now(),
    });
    writeAudit(
      this.runtime,
      "TranscriptNormalizationPipeline",
      "completeTranscriptJob",
      actor,
      artifact.transcriptArtifactId,
      artifactState === "quarantined" ? "blocked" : "accepted",
      artifactState === "quarantined" ? ["audio_or_diarisation_quality_quarantined"] : [],
    );
    return artifact;
  }
}

export class TranscriptArtifactService {
  public constructor(private readonly runtime: TranscriptRuntime) {}

  public markReferencedByFrozenEvidence(
    transcriptArtifactId: string,
    evidenceSnapshotRef: string,
    actor: TranscriptActorContext,
  ): TranscriptArtifact {
    requireRole(actor, ["transcript_pipeline_worker", "clinical_safety_lead", "system"], "TRANSCRIPT_ARTIFACT_FORBIDDEN");
    const artifact = requireFromMap(this.runtime.store.transcriptArtifacts, transcriptArtifactId, "TRANSCRIPT_ARTIFACT_NOT_FOUND");
    if (artifact.referencedByFrozenEvidenceSnapshotRefs.includes(evidenceSnapshotRef)) {
      return artifact;
    }
    const updated: TranscriptArtifact = {
      ...artifact,
      referencedByFrozenEvidenceSnapshotRefs: [...artifact.referencedByFrozenEvidenceSnapshotRefs, evidenceSnapshotRef],
    };
    this.runtime.store.transcriptArtifacts.set(transcriptArtifactId, updated);
    writeAudit(this.runtime, "TranscriptArtifactService", "markReferencedByFrozenEvidence", actor, transcriptArtifactId, "accepted", []);
    return updated;
  }

  public markReadyForDrafting(command: MarkTranscriptReadyCommand, actor: TranscriptActorContext): TranscriptArtifact {
    requireRole(actor, ["transcript_pipeline_worker", "documentation_composer", "system"], "TRANSCRIPT_ARTIFACT_FORBIDDEN");
    const artifact = requireFromMap(this.runtime.store.transcriptArtifacts, command.transcriptArtifactId, "TRANSCRIPT_ARTIFACT_NOT_FOUND");
    const derivation = requireFromMap(this.runtime.store.derivationPackages, artifact.derivationPackageRef, "TRANSCRIPT_DERIVATION_NOT_FOUND");
    const session = requireFromMap(this.runtime.store.audioCaptureSessions, artifact.audioCaptureSessionRef, "TRANSCRIPT_CAPTURE_SESSION_NOT_FOUND");
    if (artifact.artifactState !== "normalized") {
      throw new AssistiveTranscriptError("TRANSCRIPT_ARTIFACT_NOT_NORMALIZED", "Only normalized artifacts can become drafting-ready.");
    }
    if (derivation.immutabilityState !== "immutable") {
      throw new AssistiveTranscriptError("TRANSCRIPT_DERIVATION_MUTABLE", "Drafting requires immutable derivation packages.");
    }
    assertPermissionAllowsTranscription(session.permissionState);
    if (!["settled", "not_required"].includes(artifact.redactionState)) {
      throw new AssistiveTranscriptError("TRANSCRIPT_REDACTION_NOT_SETTLED", "Drafting requires settled redaction posture.", [
        "redaction_not_settled",
      ]);
    }
    requireNonEmpty(command.frozenContextSnapshotRef, "frozenContextSnapshotRef");
    const updated: TranscriptArtifact = {
      ...artifact,
      artifactState: "ready_for_drafting",
    };
    this.runtime.store.transcriptArtifacts.set(artifact.transcriptArtifactId, updated);
    emitEvent(this.runtime, "assistive.transcript.ready", artifact.transcriptArtifactId, {
      derivationPackageRef: derivation.derivationPackageId,
      redactionState: artifact.redactionState,
    });
    emitEvent(this.runtime, "assistive.context.snapshot.created", command.frozenContextSnapshotRef, {
      transcriptArtifactRef: artifact.transcriptArtifactId,
      sourceCaptureBundleRef: artifact.sourceCaptureBundleRef,
    });
    writeAudit(this.runtime, "TranscriptArtifactService", "markReadyForDrafting", actor, artifact.transcriptArtifactId, "accepted", []);
    return updated;
  }
}

export class TranscriptRedactionService {
  public constructor(private readonly runtime: TranscriptRuntime) {}

  public applyRedactions(command: ApplyRedactionsCommand, actor: TranscriptActorContext): TranscriptArtifact {
    requireRole(actor, ["transcript_pipeline_worker", "clinical_reviewer", "system"], "TRANSCRIPT_REDACTION_FORBIDDEN");
    if (command.rawTranscriptText) {
      throw new AssistiveTranscriptError("TRANSCRIPT_RAW_TEXT_FORBIDDEN", "Redaction commands must not carry raw transcript text.", [
        "raw_transcript_text_forbidden",
      ]);
    }
    const artifact = requireFromMap(this.runtime.store.transcriptArtifacts, command.transcriptArtifactId, "TRANSCRIPT_ARTIFACT_NOT_FOUND");
    requireNonEmpty(command.redactionPolicyRef, "redactionPolicyRef");
    requireNonEmpty(command.redactionTransformHash, "redactionTransformHash");
    const redactionRecords = command.spans.map((span) => {
      if (span.endOffset <= span.startOffset) {
        throw new AssistiveTranscriptError("TRANSCRIPT_REDACTION_SPAN_INVALID", "Redaction span endOffset must be greater than startOffset.");
      }
      return {
        ...span,
        redactionSpanId: this.runtime.idGenerator.next("redaction_span"),
        policyRef: command.redactionPolicyRef,
      };
    });
    for (const span of redactionRecords) {
      this.runtime.store.redactionSpans.set(span.redactionSpanId, span);
    }
    const updated: TranscriptArtifact = {
      ...artifact,
      redactionRefs: [...artifact.redactionRefs, ...redactionRecords.map((span) => span.redactionSpanId)],
      redactionState: "settled",
    };
    this.runtime.store.transcriptArtifacts.set(artifact.transcriptArtifactId, updated);
    writeAudit(this.runtime, "TranscriptRedactionService", "applyRedactions", actor, artifact.transcriptArtifactId, "accepted", []);
    return updated;
  }

  public failRedaction(transcriptArtifactId: string, errorRef: string, actor: TranscriptActorContext): TranscriptArtifact {
    requireRole(actor, ["transcript_pipeline_worker", "clinical_reviewer", "system"], "TRANSCRIPT_REDACTION_FORBIDDEN");
    requireNonEmpty(errorRef, "errorRef");
    const artifact = requireFromMap(this.runtime.store.transcriptArtifacts, transcriptArtifactId, "TRANSCRIPT_ARTIFACT_NOT_FOUND");
    const updated: TranscriptArtifact = {
      ...artifact,
      redactionState: "failed",
      artifactState: "quarantined",
    };
    this.runtime.store.transcriptArtifacts.set(transcriptArtifactId, updated);
    writeAudit(this.runtime, "TranscriptRedactionService", "failRedaction", actor, transcriptArtifactId, "failed_closed", [
      "redaction_failure_quarantined",
    ]);
    return updated;
  }
}

export class ClinicalConceptSpanExtractor {
  public constructor(private readonly runtime: TranscriptRuntime) {}

  public extractConceptSpans(command: ExtractConceptSpansCommand, actor: TranscriptActorContext): TranscriptArtifact {
    requireRole(actor, ["transcript_pipeline_worker", "clinical_reviewer", "system"], "TRANSCRIPT_CONCEPT_EXTRACTION_FORBIDDEN");
    if (command.rawTranscriptText) {
      throw new AssistiveTranscriptError("TRANSCRIPT_RAW_TEXT_FORBIDDEN", "Concept extraction commands must use refs, not raw transcript text.", [
        "raw_transcript_text_forbidden",
      ]);
    }
    const artifact = requireFromMap(this.runtime.store.transcriptArtifacts, command.transcriptArtifactId, "TRANSCRIPT_ARTIFACT_NOT_FOUND");
    requireNonEmpty(command.extractionVersionRef, "extractionVersionRef");
    const conceptRecords = command.spans.map((span) => ({
      ...span,
      conceptSpanId: this.runtime.idGenerator.next("clinical_concept_span"),
    }));
    for (const span of conceptRecords) {
      this.runtime.store.conceptSpans.set(span.conceptSpanId, span);
    }
    const derivation = requireFromMap(this.runtime.store.derivationPackages, artifact.derivationPackageRef, "TRANSCRIPT_DERIVATION_NOT_FOUND");
    this.runtime.store.derivationPackages.set(derivation.derivationPackageId, {
      ...derivation,
      conceptExtractionVersionRef: command.extractionVersionRef,
      derivationHash: stableTranscriptHash({
        previousDerivationHash: derivation.derivationHash,
        conceptRefs: conceptRecords.map((span) => span.conceptSpanId),
        extractionVersionRef: command.extractionVersionRef,
      }),
    });
    const updated: TranscriptArtifact = {
      ...artifact,
      clinicalConceptRefs: [...artifact.clinicalConceptRefs, ...conceptRecords.map((span) => span.conceptSpanId)],
    };
    this.runtime.store.transcriptArtifacts.set(artifact.transcriptArtifactId, updated);
    writeAudit(this.runtime, "ClinicalConceptSpanExtractor", "extractConceptSpans", actor, artifact.transcriptArtifactId, "accepted", []);
    return updated;
  }
}

export class TranscriptPresentationArtifactService {
  public constructor(private readonly runtime: TranscriptRuntime) {}

  public generatePresentationArtifact(
    command: GenerateTranscriptPresentationCommand,
    actor: TranscriptActorContext,
  ): TranscriptPresentationArtifact {
    requireRole(actor, ["artifact_presentation_worker", "clinical_reviewer", "documentation_composer", "system"], "TRANSCRIPT_PRESENTATION_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "transcript_presentation", command.idempotencyKey, this.runtime.store.presentationArtifacts);
    if (existing) {
      return existing;
    }
    const artifact = requireFromMap(this.runtime.store.transcriptArtifacts, command.transcriptArtifactRef, "TRANSCRIPT_ARTIFACT_NOT_FOUND");
    requireNonEmpty(command.artifactPresentationContractRef, "artifactPresentationContractRef");
    requireNonEmpty(command.surfaceRouteContractRef, "surfaceRouteContractRef");
    requireNonEmpty(command.surfacePublicationRef, "surfacePublicationRef");
    requireNonEmpty(command.runtimePublicationBundleRef, "runtimePublicationBundleRef");
    requireNonEmpty(command.placeholderContractRef, "placeholderContractRef");
    const session = requireFromMap(this.runtime.store.audioCaptureSessions, artifact.audioCaptureSessionRef, "TRANSCRIPT_CAPTURE_SESSION_NOT_FOUND");
    const blockingReasonCodes = derivePresentationBlockingReasons(command, artifact, session);
    const artifactState = derivePresentationState(command, artifact, blockingReasonCodes);
    const presentation: TranscriptPresentationArtifact = {
      transcriptPresentationArtifactId: this.runtime.idGenerator.next("transcript_presentation"),
      transcriptArtifactRef: artifact.transcriptArtifactId,
      artifactPresentationContractRef: command.artifactPresentationContractRef,
      outboundNavigationGrantPolicyRef: command.outboundNavigationGrantPolicyRef,
      surfaceRouteContractRef: command.surfaceRouteContractRef,
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
      visibilityTier: command.visibilityTier,
      summarySafetyTier: command.summarySafetyTier,
      placeholderContractRef: command.placeholderContractRef,
      artifactState,
      blockingReasonCodes,
      createdAt: this.runtime.clock.now(),
    };
    this.runtime.store.presentationArtifacts.set(presentation.transcriptPresentationArtifactId, presentation);
    setIdempotent(this.runtime, "transcript_presentation", command.idempotencyKey, presentation.transcriptPresentationArtifactId);
    writeAudit(
      this.runtime,
      "TranscriptPresentationArtifactService",
      "generatePresentationArtifact",
      actor,
      presentation.transcriptPresentationArtifactId,
      artifactState === "blocked" ? "blocked" : "accepted",
      blockingReasonCodes,
    );
    return presentation;
  }
}

export function createAssistiveTranscriptPlane(options?: {
  store?: AssistiveTranscriptStore;
  clock?: TranscriptClock;
  idGenerator?: TranscriptIdGenerator;
}): {
  store: AssistiveTranscriptStore;
  audioCaptureSessions: AudioCaptureSessionService;
  transcriptJobs: TranscriptJobOrchestrator;
  normalization: TranscriptNormalizationPipeline;
  transcriptArtifacts: TranscriptArtifactService;
  redactions: TranscriptRedactionService;
  conceptSpans: ClinicalConceptSpanExtractor;
  retention: RetentionEnvelopeService;
  presentationArtifacts: TranscriptPresentationArtifactService;
} {
  const runtime: TranscriptRuntime = {
    store: options?.store ?? createAssistiveTranscriptStore(),
    clock: options?.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options?.idGenerator ?? createDeterministicTranscriptIdGenerator(),
  };
  return {
    store: runtime.store,
    audioCaptureSessions: new AudioCaptureSessionService(runtime),
    transcriptJobs: new TranscriptJobOrchestrator(runtime),
    normalization: new TranscriptNormalizationPipeline(runtime),
    transcriptArtifacts: new TranscriptArtifactService(runtime),
    redactions: new TranscriptRedactionService(runtime),
    conceptSpans: new ClinicalConceptSpanExtractor(runtime),
    retention: new RetentionEnvelopeService(runtime),
    presentationArtifacts: new TranscriptPresentationArtifactService(runtime),
  };
}

export const assistiveTranscriptRuntimeContract = {
  contractId: "407_transcript_runtime_contract",
  schemaVersion: "407.transcript-runtime-contract.v1",
  upstreamContractRefs: [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/406_evaluation_runtime_contract.json",
  ],
  services: assistiveTranscriptServiceNames,
  failClosedDefaults: [
    "blocked_permission_state",
    "ambient_capture_without_governance",
    "quarantine_not_cleared",
    "mutable_derivation_overwrite",
    "raw_blob_url",
  ],
} as const;

function validateCaptureCommand(command: CreateAudioCaptureSessionCommand): readonly string[] {
  const reasons: string[] = [];
  if (["objected", "withdrawn", "blocked", "policy_pending"].includes(command.permissionState)) {
    reasons.push("permission_state_blocks_transcription");
  }
  if (command.sourceType === "live_ambient_capture") {
    if (command.captureMode !== "manual_start_ambient") {
      reasons.push("live_ambient_requires_manual_start");
    }
    if (!command.tenantAmbientPolicyRef) {
      reasons.push("tenant_ambient_policy_missing");
    }
    if (!command.localGovernanceApprovalRef || command.ambientCaptureApproved !== true) {
      reasons.push("local_ambient_governance_approval_missing");
    }
    if (command.permissionState !== "explicit_granted") {
      reasons.push("live_ambient_requires_explicit_permission");
    }
  }
  if (command.captureMode === "automatic_ambient") {
    reasons.push("automatic_ambient_disabled_for_first_release");
  }
  return reasons;
}

function assertPermissionAllowsTranscription(permissionState: PermissionState): void {
  if (["objected", "withdrawn", "blocked", "policy_pending"].includes(permissionState)) {
    throw new AssistiveTranscriptError("TRANSCRIPT_PERMISSION_BLOCKED", "Permission state blocks transcription.", [
      "permission_state_blocks_transcription",
    ]);
  }
}

function derivePresentationBlockingReasons(
  command: GenerateTranscriptPresentationCommand,
  artifact: TranscriptArtifact,
  session: AudioCaptureSession,
): readonly string[] {
  const reasons: string[] = [];
  const permissionState = command.permissionStateOverride ?? session.permissionState;
  if (["objected", "withdrawn", "blocked", "policy_pending"].includes(permissionState)) {
    reasons.push("permission_state_blocks_presentation");
  }
  if (command.rawBlobUrl) {
    reasons.push("raw_blob_url_forbidden");
  }
  if (command.directDownloadUrl) {
    reasons.push("direct_download_url_forbidden");
  }
  if (command.requestedArtifactState === "external_handoff_ready" && !command.outboundNavigationGrantPolicyRef) {
    reasons.push("outbound_navigation_grant_required");
  }
  if (artifact.redactionState === "failed") {
    reasons.push("redaction_failed");
  }
  if (command.recoveryState === "hard_block") {
    reasons.push("recovery_hard_block");
  }
  return reasons;
}

function derivePresentationState(
  command: GenerateTranscriptPresentationCommand,
  artifact: TranscriptArtifact,
  blockingReasonCodes: readonly string[],
): TranscriptPresentationArtifactState {
  if (
    blockingReasonCodes.some((reason) =>
      ["raw_blob_url_forbidden", "direct_download_url_forbidden", "outbound_navigation_grant_required", "recovery_hard_block"].includes(reason),
    )
  ) {
    return "blocked";
  }
  if (blockingReasonCodes.length > 0 || command.recoveryState === "recovery_only" || artifact.artifactState === "quarantined") {
    return "recovery_only";
  }
  return command.requestedArtifactState ?? "summary_only";
}

function emitEvent(runtime: TranscriptRuntime, eventName: TranscriptDomainEvent["eventName"], subjectRef: string, payload: unknown): void {
  runtime.store.events.push({
    eventId: runtime.idGenerator.next("transcript_event"),
    eventName,
    subjectRef,
    payloadHash: stableTranscriptHash(payload),
    emittedAt: runtime.clock.now(),
  });
}

function getIdempotent<T>(
  runtime: TranscriptRuntime,
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

function setIdempotent(runtime: TranscriptRuntime, namespace: string, idempotencyKey: string | undefined, recordId: string): void {
  if (idempotencyKey) {
    runtime.store.idempotencyKeys.set(`${namespace}:${idempotencyKey}`, recordId);
  }
}

function writeAudit(
  runtime: TranscriptRuntime,
  serviceName: string,
  action: string,
  actor: TranscriptActorContext,
  subjectRef: string,
  outcome: TranscriptAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("transcript_audit"),
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

function requireRole(actor: TranscriptActorContext, allowedRoles: readonly TranscriptActorRole[], code: string): void {
  if (!allowedRoles.includes(actor.actorRole)) {
    throw new AssistiveTranscriptError(code, `Role ${actor.actorRole} is not allowed.`, [`role_${actor.actorRole}_not_allowed`]);
  }
}

function requireFromMap<T>(records: Map<string, T>, key: string, code: string): T {
  const record = records.get(key);
  if (!record) {
    throw new AssistiveTranscriptError(code, `Missing transcript record: ${key}.`);
  }
  return record;
}

function requireNonEmpty(value: string | undefined, fieldName: string): asserts value is string {
  if (!value || value.trim().length === 0) {
    throw new AssistiveTranscriptError("TRANSCRIPT_REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}.`, [
      `${fieldName}_missing`,
    ]);
  }
}

function requireNonEmptyArray<T>(value: readonly T[], fieldName: string): void {
  if (value.length === 0) {
    throw new AssistiveTranscriptError("TRANSCRIPT_REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}.`, [
      `${fieldName}_missing`,
    ]);
  }
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
