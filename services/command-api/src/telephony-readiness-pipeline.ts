import { createHash } from "node:crypto";
import type { AudioIngestSettlement } from "./telephony-recording-ingest-pipeline";

export const TELEPHONY_READINESS_SERVICE_NAME = "TelephonyReadinessPipeline";
export const TELEPHONY_READINESS_SCHEMA_VERSION = "191.phase2.telephony-readiness.v1";
export const TELEPHONY_TRANSCRIPT_READINESS_POLICY_VERSION = "phase2-transcript-readiness-191.v1";
export const TELEPHONY_EVIDENCE_READINESS_POLICY_VERSION = "phase2-evidence-readiness-191.v1";
export const TELEPHONY_FACT_EXTRACTION_VERSION = "phase2-telephony-fact-extractor-191.v1";
export const TELEPHONY_COVERAGE_SUFFICIENCY_POLICY_VERSION = "phase2-coverage-sufficiency-191.v1";
export const TELEPHONY_CONTRADICTION_POLICY_VERSION = "phase2-contradiction-resolution-191.v1";

export const telephonyReadinessPersistenceTables = [
  "phase2_transcript_jobs",
  "phase2_transcript_derivation_packages",
  "phase2_telephony_safety_facts",
  "phase2_telephony_transcript_readiness_records",
  "phase2_telephony_evidence_readiness_assessments",
  "phase2_manual_audio_review_queue_entries",
] as const;

export const telephonyReadinessMigrationPlanRefs = [
  "services/command-api/migrations/106_phase2_telephony_readiness_pipeline.sql",
] as const;

export const telephonyReadinessGapResolutions = [
  "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_COVERAGE_SUFFICIENCY_LAW",
  "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_CONTRADICTION_RESOLUTION",
  "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_TERMINAL_UNUSABILITY",
  "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_RERUN_SUPERSESSION_PROJECTION",
  "GAP_RESOLVED_PHASE2_TELEPHONY_READINESS_WORKER_COMPLETION_SHORTCUT",
] as const;

export const transcriptCoverageSufficiencyPolicy = {
  policyVersion: TELEPHONY_COVERAGE_SUFFICIENCY_POLICY_VERSION,
  clinicallySufficientMinWordCount: 6,
  clinicallySufficientRequiresSignal: true,
  allowedReadyQualityBands: ["medium", "high"] as const,
  failClosedCoverageClasses: ["none", "keyword_only", "partial_utterance"] as const,
  workerCompletionAloneIsNeverSufficient: true,
} as const;

export const telephonyEvidenceReadinessReasonCatalog = {
  catalogVersion: "191.telephony-evidence-readiness-reasons.v1",
  reasonCodes: [
    "TEL_READY_191_TRANSCRIPT_JOB_QUEUED",
    "TEL_READY_191_TRANSCRIPT_JOB_RUNNING",
    "TEL_READY_191_TRANSCRIPT_READY_CLINICALLY_SUFFICIENT",
    "TEL_READY_191_TRANSCRIPT_DEGRADED_MANUAL_REVIEW",
    "TEL_READY_191_TRANSCRIPT_FAILED_MANUAL_REVIEW",
    "TEL_READY_191_TRANSCRIPT_TERMINAL_UNUSABLE",
    "TEL_READY_191_AWAITING_RECORDING",
    "TEL_READY_191_AWAITING_TRANSCRIPT",
    "TEL_READY_191_AWAITING_STRUCTURED_CAPTURE",
    "TEL_READY_191_STRUCTURED_CAPTURE_CONFLICT",
    "TEL_READY_191_URGENT_LIVE_ONLY_BLOCKS_ROUTINE",
    "TEL_READY_191_SAFETY_USABLE_READY_TO_PROMOTE",
    "TEL_READY_191_WORKER_COMPLETION_NOT_PROMOTION_AUTHORITY",
    "TEL_READY_191_RERUN_APPENDED_SUPERSEDING_PRIOR_READINESS",
  ],
} as const;

export type TranscriptJobState = "queued" | "running" | "succeeded" | "degraded" | "failed";
export type TelephonyTranscriptState =
  | "not_started"
  | "queued"
  | "running"
  | "partial"
  | "ready"
  | "degraded"
  | "failed"
  | "superseded";
export type TranscriptCoverageClass =
  | "none"
  | "keyword_only"
  | "partial_utterance"
  | "clinically_sufficient";
export type TranscriptQualityBand = "unknown" | "low" | "medium" | "high";
export type ContradictionPosture = "none" | "suspected" | "unresolved" | "resolved";
export type SegmentCompletenessPosture = "missing" | "partial" | "complete";
export type ExtractionCompletenessPosture = "not_started" | "partial" | "complete" | "failed";
export type EvidenceUsabilityState =
  | "awaiting_recording"
  | "awaiting_transcript"
  | "awaiting_structured_capture"
  | "urgent_live_only"
  | "safety_usable"
  | "manual_review_only"
  | "unusable_terminal";
export type PromotionReadiness =
  | "blocked"
  | "continuation_only"
  | "ready_to_seed"
  | "ready_to_promote";
export type StructuredCaptureFactFamily =
  | "request_type"
  | "symptom"
  | "duration"
  | "medication"
  | "administrative"
  | "results"
  | "urgent_signal";
export type ManualAudioReviewTriggerClass =
  | "recording_missing"
  | "transcript_degraded"
  | "contradictory_capture"
  | "identity_ambiguous"
  | "handset_untrusted"
  | "urgent_live_without_routine_evidence";
export type ManualAudioReviewMode =
  | "audio_review"
  | "callback_required"
  | "staff_transcription"
  | "follow_up_needed"
  | "abandon";

export interface TelephonyStructuredCaptureFact {
  readonly structuredCaptureRef: string;
  readonly factFamily: StructuredCaptureFactFamily;
  readonly normalizedValue: string | boolean;
  readonly source: "keypad" | "operator" | "ivr" | "system";
  readonly confidenceBand: "low" | "medium" | "high";
}

export interface TranscriptJobContract {
  readonly transcriptJobRef: string;
  readonly schemaVersion: typeof TELEPHONY_READINESS_SCHEMA_VERSION;
  readonly callSessionRef: string;
  readonly recordingArtifactRef: string;
  readonly audioIngestSettlementRef: string;
  readonly recordingDocumentReferenceRef: string;
  readonly idempotencyKey: string;
  readonly jobState: TranscriptJobState;
  readonly workerAttemptCount: number;
  readonly supersedesTranscriptJobRef: string | null;
  readonly derivationPackageRef: string | null;
  readonly transcriptReadinessRef: string | null;
  readonly evidenceReadinessAssessmentRef: string | null;
  readonly terminalOutcome: "pending" | "ready" | "degraded" | "failed" | "unusable_terminal";
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly recordedBy: typeof TELEPHONY_READINESS_SERVICE_NAME;
}

export interface EnqueueTranscriptJobInput {
  readonly callSessionRef: string;
  readonly recordingArtifactRef: string;
  readonly audioIngestSettlementRef: string;
  readonly recordingDocumentReferenceRef: string;
  readonly idempotencyKey: string;
  readonly structuredCaptures?: readonly TelephonyStructuredCaptureFact[];
  readonly structuredCaptureRequirement?: "not_required" | "required";
  readonly urgentLiveAssessmentRef?: string | null;
  readonly urgentLiveOutcome?: "none" | "urgent_live_required";
  readonly identityEvidenceRefs?: readonly string[];
  readonly contactRouteEvidenceRefs?: readonly string[];
  readonly submissionEnvelopeRef?: string | null;
  readonly observedAt?: string;
}

export interface TranscriptWorkerInput {
  readonly transcriptJobRef?: string;
  readonly workerRunRef: string;
  readonly maxJobs?: number;
  readonly runAt?: string;
}

export interface TranscriptWorkerResult {
  readonly workerRunRef: string;
  readonly processedJobRefs: readonly string[];
  readonly transcriptReadinessRecords: readonly TelephonyTranscriptReadinessRecord[];
  readonly evidenceReadinessAssessments: readonly TelephonyEvidenceReadinessAssessment[];
}

export interface TranscriptProviderResult {
  readonly transcriptState: "ready" | "degraded" | "failed";
  readonly transcriptText: string;
  readonly qualityBand: TranscriptQualityBand;
  readonly segmentCompletenessPosture: SegmentCompletenessPosture;
  readonly extractionCompletenessPosture: ExtractionCompletenessPosture;
  readonly providerRunRef: string;
  readonly terminalUnusable?: boolean;
  readonly reasonCodes: readonly string[];
  readonly completedAt: string;
}

export interface TranscriptProviderInput {
  readonly transcriptJobRef: string;
  readonly callSessionRef: string;
  readonly recordingArtifactRef: string;
  readonly attemptNumber: number;
  readonly requestedAt: string;
}

export interface TranscriptProviderAdapter {
  transcribe(input: TranscriptProviderInput): Promise<TranscriptProviderResult>;
}

export interface EvidenceDerivationPackage {
  readonly derivationPackageRef: string;
  readonly schemaVersion: typeof TELEPHONY_READINESS_SCHEMA_VERSION;
  readonly callSessionRef: string;
  readonly transcriptJobRef: string;
  readonly captureBundleRef: string;
  readonly derivationClass: "telephony_transcript_and_fact_extraction";
  readonly inputArtifactRefs: readonly string[];
  readonly derivationVersionRef: typeof TELEPHONY_FACT_EXTRACTION_VERSION;
  readonly outputRef: string;
  readonly outputHash: string;
  readonly transcriptArtifactRef: `artifact://telephony-transcript/${string}`;
  readonly transcriptArtifactDigest: string;
  readonly materialityClass: "clinically_material";
  readonly supersedesDerivationPackageRef: string | null;
  readonly derivedAt: string;
  readonly recordedBy: typeof TELEPHONY_READINESS_SERVICE_NAME;
}

export interface TelephonySafetyFactSignal {
  readonly signalRef: string;
  readonly factFamily: "symptom" | "request_type" | "red_flag" | "structured_capture";
  readonly normalizedCode: string;
  readonly confidenceBand: "low" | "medium" | "high";
  readonly evidenceSpanRefs: readonly string[];
}

export interface TelephonySafetyFacts {
  readonly telephonySafetyFactsRef: string;
  readonly schemaVersion: typeof TELEPHONY_READINESS_SCHEMA_VERSION;
  readonly callSessionRef: string;
  readonly transcriptJobRef: string;
  readonly derivationPackageRef: string;
  readonly extractionVersionRef: typeof TELEPHONY_FACT_EXTRACTION_VERSION;
  readonly transcriptDigest: string;
  readonly transcriptWordCount: number;
  readonly transcriptFactSignals: readonly TelephonySafetyFactSignal[];
  readonly keypadFactSignals: readonly TelephonySafetyFactSignal[];
  readonly operatorSupplementRefs: readonly string[];
  readonly contradictionFlags: readonly string[];
  readonly coverageGaps: readonly string[];
  readonly clinicallyRelevantSnippetRefs: readonly string[];
  readonly factCompleteness: "none" | "partial" | "complete";
  readonly createdAt: string;
  readonly recordedBy: typeof TELEPHONY_READINESS_SERVICE_NAME;
}

export interface TelephonyTranscriptReadinessRecord {
  readonly telephonyTranscriptReadinessRecordRef: string;
  readonly schemaVersion: typeof TELEPHONY_READINESS_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_TRANSCRIPT_READINESS_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly recordingArtifactRef: string;
  readonly transcriptJobRef: string;
  readonly transcriptState: TelephonyTranscriptState;
  readonly coverageClass: TranscriptCoverageClass;
  readonly qualityBand: TranscriptQualityBand;
  readonly contradictionPosture: ContradictionPosture;
  readonly segmentCompletenessPosture: SegmentCompletenessPosture;
  readonly extractionCompletenessPosture: ExtractionCompletenessPosture;
  readonly derivationPackageRef: string | null;
  readonly derivedFactsPackageRef: string | null;
  readonly blockingReasonCodes: readonly string[];
  readonly supersedesTranscriptReadinessRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly checkedAt: string;
  readonly recordedBy: typeof TELEPHONY_READINESS_SERVICE_NAME;
}

export interface TelephonyEvidenceReadinessAssessment {
  readonly telephonyEvidenceReadinessAssessmentRef: string;
  readonly schemaVersion: typeof TELEPHONY_READINESS_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_EVIDENCE_READINESS_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly submissionEnvelopeRef: string | null;
  readonly urgentLiveAssessmentRef: string | null;
  readonly transcriptReadinessRef: string | null;
  readonly structuredCaptureRefs: readonly string[];
  readonly identityEvidenceRefs: readonly string[];
  readonly contactRouteEvidenceRefs: readonly string[];
  readonly manualReviewDispositionRef: string | null;
  readonly continuationEligibilityRef: string | null;
  readonly usabilityState: EvidenceUsabilityState;
  readonly promotionReadiness: PromotionReadiness;
  readonly governingInputRefs: readonly string[];
  readonly supersedesEvidenceReadinessAssessmentRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly assessedAt: string;
  readonly recordedBy: typeof TELEPHONY_READINESS_SERVICE_NAME;
}

export interface ManualAudioReviewQueueEntry {
  readonly manualAudioReviewQueueEntryRef: string;
  readonly schemaVersion: typeof TELEPHONY_READINESS_SCHEMA_VERSION;
  readonly manualReviewDispositionRef: string;
  readonly callSessionRef: string;
  readonly triggerClass: ManualAudioReviewTriggerClass;
  readonly reviewMode: ManualAudioReviewMode;
  readonly reviewState: "open";
  readonly transcriptReadinessRef: string | null;
  readonly evidenceReadinessAssessmentRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly recordedBy: typeof TELEPHONY_READINESS_SERVICE_NAME;
}

interface TranscriptContext {
  readonly callSessionRef: string;
  readonly structuredCaptures: readonly TelephonyStructuredCaptureFact[];
  readonly structuredCaptureRequirement: "not_required" | "required";
  readonly urgentLiveAssessmentRef: string | null;
  readonly urgentLiveOutcome: "none" | "urgent_live_required";
  readonly identityEvidenceRefs: readonly string[];
  readonly contactRouteEvidenceRefs: readonly string[];
  readonly submissionEnvelopeRef: string | null;
}

export interface TelephonyReadinessSnapshots {
  readonly transcriptJobs: readonly TranscriptJobContract[];
  readonly derivationPackages: readonly EvidenceDerivationPackage[];
  readonly safetyFacts: readonly TelephonySafetyFacts[];
  readonly transcriptReadinessRecords: readonly TelephonyTranscriptReadinessRecord[];
  readonly evidenceReadinessAssessments: readonly TelephonyEvidenceReadinessAssessment[];
  readonly manualAudioReviewQueueEntries: readonly ManualAudioReviewQueueEntry[];
}

export interface TelephonyReadinessRepository {
  getTranscriptJobByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<TranscriptJobContract | undefined>;
  getTranscriptJob(transcriptJobRef: string): Promise<TranscriptJobContract | undefined>;
  getLatestTranscriptJobForRecording(
    callSessionRef: string,
    recordingArtifactRef: string,
  ): Promise<TranscriptJobContract | undefined>;
  saveTranscriptJob(job: TranscriptJobContract): Promise<void>;
  listRunnableTranscriptJobs(limit: number): Promise<readonly TranscriptJobContract[]>;
  saveTranscriptContext(transcriptJobRef: string, context: TranscriptContext): Promise<void>;
  getTranscriptContext(transcriptJobRef: string): Promise<TranscriptContext | undefined>;
  saveDerivationPackage(record: EvidenceDerivationPackage): Promise<void>;
  getLatestDerivationPackage(
    callSessionRef: string,
  ): Promise<EvidenceDerivationPackage | undefined>;
  saveSafetyFacts(record: TelephonySafetyFacts): Promise<void>;
  getSafetyFacts(telephonySafetyFactsRef: string): Promise<TelephonySafetyFacts | undefined>;
  saveTranscriptReadinessRecord(record: TelephonyTranscriptReadinessRecord): Promise<void>;
  getLatestTranscriptReadinessRecord(
    callSessionRef: string,
  ): Promise<TelephonyTranscriptReadinessRecord | undefined>;
  saveEvidenceReadinessAssessment(record: TelephonyEvidenceReadinessAssessment): Promise<void>;
  getLatestEvidenceReadinessAssessment(
    callSessionRef: string,
  ): Promise<TelephonyEvidenceReadinessAssessment | undefined>;
  saveManualAudioReviewQueueEntry(record: ManualAudioReviewQueueEntry): Promise<void>;
  getManualAudioReviewQueueEntry(
    manualReviewDispositionRef: string,
  ): Promise<ManualAudioReviewQueueEntry | undefined>;
  snapshots(): TelephonyReadinessSnapshots;
}

export interface TelephonyReadinessService {
  enqueueTranscriptJob(input: EnqueueTranscriptJobInput): Promise<{
    readonly transcriptJob: TranscriptJobContract;
    readonly transcriptReadinessRecord: TelephonyTranscriptReadinessRecord;
    readonly evidenceReadinessAssessment: TelephonyEvidenceReadinessAssessment;
  }>;
  markTranscriptJobRunning(input: {
    readonly transcriptJobRef: string;
    readonly runAt?: string;
  }): Promise<{
    readonly transcriptJob: TranscriptJobContract;
    readonly transcriptReadinessRecord: TelephonyTranscriptReadinessRecord;
    readonly evidenceReadinessAssessment: TelephonyEvidenceReadinessAssessment;
  }>;
  drainTranscriptJobs(input: TranscriptWorkerInput): Promise<TranscriptWorkerResult>;
  enqueueTranscriptRerun(
    input: EnqueueTranscriptJobInput & {
      readonly supersedesTranscriptJobRef: string;
      readonly rerunReasonCode: string;
    },
  ): Promise<{
    readonly transcriptJob: TranscriptJobContract;
    readonly transcriptReadinessRecord: TelephonyTranscriptReadinessRecord;
    readonly evidenceReadinessAssessment: TelephonyEvidenceReadinessAssessment;
  }>;
  assessEvidenceWithoutRecording(input: {
    readonly callSessionRef: string;
    readonly reasonCode: string;
    readonly observedAt?: string;
  }): Promise<TelephonyEvidenceReadinessAssessment>;
  getCurrentEvidenceReadiness(input: {
    readonly callSessionRef: string;
  }): Promise<TelephonyEvidenceReadinessAssessment | null>;
}

export interface TelephonyReadinessApplication {
  readonly service: TelephonyReadinessService;
  readonly repository: TelephonyReadinessRepository;
  readonly persistenceTables: typeof telephonyReadinessPersistenceTables;
  readonly migrationPlanRefs: typeof telephonyReadinessMigrationPlanRefs;
  readonly gapResolutions: typeof telephonyReadinessGapResolutions;
  readonly coveragePolicy: typeof transcriptCoverageSufficiencyPolicy;
  readonly reasonCatalog: typeof telephonyEvidenceReadinessReasonCatalog;
}

interface CreateTelephonyReadinessApplicationInput {
  readonly repository?: TelephonyReadinessRepository;
  readonly transcriptProvider: TranscriptProviderAdapter;
}

interface InMemoryTranscriptProviderInput {
  readonly resultsByRecordingArtifactRef?: Readonly<
    Record<string, TranscriptProviderResultFixture>
  >;
}

interface TranscriptProviderResultFixture {
  readonly transcriptState: "ready" | "degraded" | "failed";
  readonly transcriptText: string;
  readonly qualityBand?: TranscriptQualityBand;
  readonly segmentCompletenessPosture?: SegmentCompletenessPosture;
  readonly extractionCompletenessPosture?: ExtractionCompletenessPosture;
  readonly terminalUnusable?: boolean;
  readonly reasonCodes?: readonly string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function stableDigest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableRef(prefix: string, parts: Readonly<Record<string, unknown>>): string {
  return `${prefix}_${stableDigest(JSON.stringify(parts)).slice(0, 24)}`;
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values)).sort();
}

function requireJob(
  job: TranscriptJobContract | undefined,
  transcriptJobRef: string,
): TranscriptJobContract {
  if (!job) {
    throw new Error(`TRANSCRIPT_JOB_NOT_FOUND:${transcriptJobRef}`);
  }
  return job;
}

function defaultContext(input: EnqueueTranscriptJobInput): TranscriptContext {
  return {
    callSessionRef: input.callSessionRef,
    structuredCaptures: input.structuredCaptures ?? [],
    structuredCaptureRequirement: input.structuredCaptureRequirement ?? "not_required",
    urgentLiveAssessmentRef: input.urgentLiveAssessmentRef ?? null,
    urgentLiveOutcome: input.urgentLiveOutcome ?? "none",
    identityEvidenceRefs: input.identityEvidenceRefs ?? [],
    contactRouteEvidenceRefs: input.contactRouteEvidenceRefs ?? [],
    submissionEnvelopeRef: input.submissionEnvelopeRef ?? null,
  };
}

function createTranscriptReadinessRecord(input: {
  readonly job: TranscriptJobContract;
  readonly transcriptState: TelephonyTranscriptState;
  readonly coverageClass: TranscriptCoverageClass;
  readonly qualityBand: TranscriptQualityBand;
  readonly contradictionPosture: ContradictionPosture;
  readonly segmentCompletenessPosture: SegmentCompletenessPosture;
  readonly extractionCompletenessPosture: ExtractionCompletenessPosture;
  readonly derivationPackageRef: string | null;
  readonly derivedFactsPackageRef: string | null;
  readonly blockingReasonCodes: readonly string[];
  readonly supersedesTranscriptReadinessRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly checkedAt: string;
}): TelephonyTranscriptReadinessRecord {
  return {
    telephonyTranscriptReadinessRecordRef: stableRef("tel_transcript_readiness_191", {
      job: input.job.transcriptJobRef,
      state: input.transcriptState,
      derivation: input.derivationPackageRef,
      at: input.checkedAt,
    }),
    schemaVersion: TELEPHONY_READINESS_SCHEMA_VERSION,
    policyVersion: TELEPHONY_TRANSCRIPT_READINESS_POLICY_VERSION,
    callSessionRef: input.job.callSessionRef,
    recordingArtifactRef: input.job.recordingArtifactRef,
    transcriptJobRef: input.job.transcriptJobRef,
    transcriptState: input.transcriptState,
    coverageClass: input.coverageClass,
    qualityBand: input.qualityBand,
    contradictionPosture: input.contradictionPosture,
    segmentCompletenessPosture: input.segmentCompletenessPosture,
    extractionCompletenessPosture: input.extractionCompletenessPosture,
    derivationPackageRef: input.derivationPackageRef,
    derivedFactsPackageRef: input.derivedFactsPackageRef,
    blockingReasonCodes: uniqueSorted(input.blockingReasonCodes),
    supersedesTranscriptReadinessRef: input.supersedesTranscriptReadinessRef,
    reasonCodes: uniqueSorted(input.reasonCodes),
    checkedAt: input.checkedAt,
    recordedBy: TELEPHONY_READINESS_SERVICE_NAME,
  };
}

function signalRef(prefix: string, callSessionRef: string, code: string): string {
  return stableRef(prefix, { callSessionRef, code });
}

function classifyTranscriptSignals(
  callSessionRef: string,
  transcriptText: string,
): {
  readonly signals: readonly TelephonySafetyFactSignal[];
  readonly snippetRefs: readonly string[];
  readonly wordCount: number;
} {
  const normalized = transcriptText.toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const signalSpecs = [
    { token: "cough", factFamily: "symptom", code: "symptom_cough" },
    { token: "fever", factFamily: "symptom", code: "symptom_fever" },
    { token: "rash", factFamily: "symptom", code: "symptom_rash" },
    { token: "pain", factFamily: "symptom", code: "symptom_pain" },
    { token: "prescription", factFamily: "request_type", code: "request_medication" },
    { token: "medication", factFamily: "request_type", code: "request_medication" },
    { token: "results", factFamily: "request_type", code: "request_results" },
    { token: "chest pain", factFamily: "red_flag", code: "red_flag_chest_pain" },
    { token: "stroke", factFamily: "red_flag", code: "red_flag_stroke" },
    { token: "breathless", factFamily: "red_flag", code: "red_flag_breathlessness" },
    { token: "bleeding", factFamily: "red_flag", code: "red_flag_bleeding" },
    { token: "suicidal", factFamily: "red_flag", code: "red_flag_suicidal" },
  ] as const;
  const signals: TelephonySafetyFactSignal[] = [];
  const snippetRefs: string[] = [];

  for (const spec of signalSpecs) {
    const index = normalized.indexOf(spec.token);
    if (index >= 0) {
      const spanRef = stableRef("tel_transcript_span_191", {
        callSessionRef,
        token: spec.token,
        index,
      });
      snippetRefs.push(spanRef);
      signals.push({
        signalRef: signalRef("tel_transcript_signal_191", callSessionRef, spec.code),
        factFamily: spec.factFamily,
        normalizedCode: spec.code,
        confidenceBand: "medium",
        evidenceSpanRefs: [spanRef],
      });
    }
  }

  return { signals, snippetRefs: uniqueSorted(snippetRefs), wordCount: words.length };
}

function structuredCaptureSignals(
  callSessionRef: string,
  captures: readonly TelephonyStructuredCaptureFact[],
): readonly TelephonySafetyFactSignal[] {
  return captures.map((capture) => ({
    signalRef: signalRef(
      "tel_structured_signal_191",
      callSessionRef,
      `${capture.factFamily}_${String(capture.normalizedValue)}`,
    ),
    factFamily:
      capture.factFamily === "urgent_signal"
        ? "red_flag"
        : capture.factFamily === "request_type"
          ? "request_type"
          : capture.factFamily === "symptom"
            ? "symptom"
            : "structured_capture",
    normalizedCode: `${capture.factFamily}_${String(capture.normalizedValue)}`,
    confidenceBand: capture.confidenceBand,
    evidenceSpanRefs: [capture.structuredCaptureRef],
  }));
}

function contradictionFlags(
  transcriptSignals: readonly TelephonySafetyFactSignal[],
  captures: readonly TelephonyStructuredCaptureFact[],
): readonly string[] {
  const transcriptCodes = new Set(transcriptSignals.map((signal) => signal.normalizedCode));
  const flags: string[] = [];
  for (const capture of captures) {
    if (capture.factFamily !== "request_type") continue;
    const captureValue = String(capture.normalizedValue).toLowerCase();
    const transcriptLooksClinical =
      transcriptCodes.has("symptom_cough") ||
      transcriptCodes.has("symptom_fever") ||
      transcriptCodes.has("symptom_rash") ||
      transcriptCodes.has("symptom_pain") ||
      Array.from(transcriptCodes).some((code) => code.startsWith("red_flag_"));
    if (captureValue === "medication" && transcriptLooksClinical) {
      flags.push("TEL_READY_191_STRUCTURED_CAPTURE_CONFLICT_MEDICATION_VS_SYMPTOM");
    }
    if (captureValue === "results" && transcriptLooksClinical) {
      flags.push("TEL_READY_191_STRUCTURED_CAPTURE_CONFLICT_RESULTS_VS_SYMPTOM");
    }
  }
  return uniqueSorted(flags);
}

function coverageClassFor(input: {
  readonly providerResult: TranscriptProviderResult;
  readonly transcriptSignalCount: number;
  readonly structuredSignalCount: number;
  readonly wordCount: number;
}): TranscriptCoverageClass {
  if (input.providerResult.transcriptState === "failed" || input.wordCount === 0) {
    return "none";
  }
  const hasSignal = input.transcriptSignalCount > 0 || input.structuredSignalCount > 0;
  if (
    input.wordCount >= transcriptCoverageSufficiencyPolicy.clinicallySufficientMinWordCount &&
    hasSignal &&
    input.providerResult.segmentCompletenessPosture === "complete"
  ) {
    return "clinically_sufficient";
  }
  if (input.transcriptSignalCount > 0 && input.wordCount < 4) {
    return "keyword_only";
  }
  return "partial_utterance";
}

function factCompletenessFor(input: {
  readonly coverageClass: TranscriptCoverageClass;
  readonly extractionCompletenessPosture: ExtractionCompletenessPosture;
  readonly signalCount: number;
}): "none" | "partial" | "complete" {
  if (input.signalCount === 0 || input.extractionCompletenessPosture === "failed") return "none";
  if (
    input.coverageClass === "clinically_sufficient" &&
    input.extractionCompletenessPosture === "complete"
  ) {
    return "complete";
  }
  return "partial";
}

function transcriptStateForProvider(
  providerResult: TranscriptProviderResult,
  coverageClass: TranscriptCoverageClass,
): TelephonyTranscriptState {
  if (providerResult.transcriptState === "failed") return "failed";
  if (providerResult.transcriptState === "degraded") return "degraded";
  if (coverageClass === "clinically_sufficient") return "ready";
  return "partial";
}

function manualReviewModeFor(triggerClass: ManualAudioReviewTriggerClass): ManualAudioReviewMode {
  if (triggerClass === "recording_missing") return "callback_required";
  if (triggerClass === "contradictory_capture") return "follow_up_needed";
  if (triggerClass === "urgent_live_without_routine_evidence") return "audio_review";
  return "staff_transcription";
}

export function createInMemoryTelephonyReadinessRepository(): TelephonyReadinessRepository {
  const jobsByRef = new Map<string, TranscriptJobContract>();
  const jobsByIdempotency = new Map<string, string>();
  const jobsByRecording = new Map<string, string[]>();
  const contextsByJob = new Map<string, TranscriptContext>();
  const derivationPackages = new Map<string, EvidenceDerivationPackage>();
  const safetyFacts = new Map<string, TelephonySafetyFacts>();
  const transcriptReadinessRecords = new Map<string, TelephonyTranscriptReadinessRecord>();
  const transcriptReadinessByCall = new Map<string, string[]>();
  const evidenceReadinessAssessments = new Map<string, TelephonyEvidenceReadinessAssessment>();
  const evidenceReadinessByCall = new Map<string, string[]>();
  const manualReviewQueueEntries = new Map<string, ManualAudioReviewQueueEntry>();

  function recordingKey(callSessionRef: string, recordingArtifactRef: string): string {
    return `${callSessionRef}::${recordingArtifactRef}`;
  }

  return {
    async getTranscriptJobByIdempotencyKey(idempotencyKey) {
      const ref = jobsByIdempotency.get(idempotencyKey);
      return ref ? jobsByRef.get(ref) : undefined;
    },
    async getTranscriptJob(transcriptJobRef) {
      return jobsByRef.get(transcriptJobRef);
    },
    async getLatestTranscriptJobForRecording(callSessionRef, recordingArtifactRef) {
      const refs = jobsByRecording.get(recordingKey(callSessionRef, recordingArtifactRef)) ?? [];
      const ref = refs.at(-1);
      return ref ? jobsByRef.get(ref) : undefined;
    },
    async saveTranscriptJob(job) {
      jobsByRef.set(job.transcriptJobRef, job);
      jobsByIdempotency.set(job.idempotencyKey, job.transcriptJobRef);
      const key = recordingKey(job.callSessionRef, job.recordingArtifactRef);
      const refs = jobsByRecording.get(key) ?? [];
      if (!refs.includes(job.transcriptJobRef)) refs.push(job.transcriptJobRef);
      jobsByRecording.set(key, refs);
    },
    async listRunnableTranscriptJobs(limit) {
      return Array.from(jobsByRef.values())
        .filter((job) => job.jobState === "queued" || job.jobState === "running")
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .slice(0, limit);
    },
    async saveTranscriptContext(transcriptJobRef, context) {
      contextsByJob.set(transcriptJobRef, context);
    },
    async getTranscriptContext(transcriptJobRef) {
      return contextsByJob.get(transcriptJobRef);
    },
    async saveDerivationPackage(record) {
      derivationPackages.set(record.derivationPackageRef, record);
    },
    async getLatestDerivationPackage(callSessionRef) {
      return Array.from(derivationPackages.values())
        .filter((record) => record.callSessionRef === callSessionRef)
        .sort((left, right) => left.derivedAt.localeCompare(right.derivedAt))
        .at(-1);
    },
    async saveSafetyFacts(record) {
      safetyFacts.set(record.telephonySafetyFactsRef, record);
    },
    async getSafetyFacts(telephonySafetyFactsRef) {
      return safetyFacts.get(telephonySafetyFactsRef);
    },
    async saveTranscriptReadinessRecord(record) {
      transcriptReadinessRecords.set(record.telephonyTranscriptReadinessRecordRef, record);
      const refs = transcriptReadinessByCall.get(record.callSessionRef) ?? [];
      if (!refs.includes(record.telephonyTranscriptReadinessRecordRef)) {
        refs.push(record.telephonyTranscriptReadinessRecordRef);
      }
      transcriptReadinessByCall.set(record.callSessionRef, refs);
    },
    async getLatestTranscriptReadinessRecord(callSessionRef) {
      const ref = (transcriptReadinessByCall.get(callSessionRef) ?? []).at(-1);
      return ref ? transcriptReadinessRecords.get(ref) : undefined;
    },
    async saveEvidenceReadinessAssessment(record) {
      evidenceReadinessAssessments.set(record.telephonyEvidenceReadinessAssessmentRef, record);
      const refs = evidenceReadinessByCall.get(record.callSessionRef) ?? [];
      if (!refs.includes(record.telephonyEvidenceReadinessAssessmentRef))
        refs.push(record.telephonyEvidenceReadinessAssessmentRef);
      evidenceReadinessByCall.set(record.callSessionRef, refs);
    },
    async getLatestEvidenceReadinessAssessment(callSessionRef) {
      const ref = (evidenceReadinessByCall.get(callSessionRef) ?? []).at(-1);
      return ref ? evidenceReadinessAssessments.get(ref) : undefined;
    },
    async saveManualAudioReviewQueueEntry(record) {
      manualReviewQueueEntries.set(record.manualReviewDispositionRef, record);
    },
    async getManualAudioReviewQueueEntry(manualReviewDispositionRef) {
      return manualReviewQueueEntries.get(manualReviewDispositionRef);
    },
    snapshots() {
      return {
        transcriptJobs: Array.from(jobsByRef.values()),
        derivationPackages: Array.from(derivationPackages.values()),
        safetyFacts: Array.from(safetyFacts.values()),
        transcriptReadinessRecords: Array.from(transcriptReadinessRecords.values()),
        evidenceReadinessAssessments: Array.from(evidenceReadinessAssessments.values()),
        manualAudioReviewQueueEntries: Array.from(manualReviewQueueEntries.values()),
      };
    },
  };
}

export function createInMemoryTranscriptProvider(
  input: InMemoryTranscriptProviderInput = {},
): TranscriptProviderAdapter {
  return {
    async transcribe(transcriptInput) {
      const fixture = input.resultsByRecordingArtifactRef?.[
        transcriptInput.recordingArtifactRef
      ] ?? {
        transcriptState: "ready",
        transcriptText: "I have a cough and fever for two days and need clinical advice",
        qualityBand: "high",
        segmentCompletenessPosture: "complete",
        extractionCompletenessPosture: "complete",
        reasonCodes: ["TEL_READY_191_TRANSCRIPT_PROVIDER_READY"],
      };
      return {
        transcriptState: fixture.transcriptState,
        transcriptText: fixture.transcriptText,
        qualityBand: fixture.qualityBand ?? "medium",
        segmentCompletenessPosture: fixture.segmentCompletenessPosture ?? "complete",
        extractionCompletenessPosture: fixture.extractionCompletenessPosture ?? "complete",
        providerRunRef: stableRef("transcript_provider_run_191", {
          job: transcriptInput.transcriptJobRef,
          attempt: transcriptInput.attemptNumber,
        }),
        terminalUnusable: fixture.terminalUnusable ?? false,
        reasonCodes: fixture.reasonCodes ?? ["TEL_READY_191_TRANSCRIPT_PROVIDER_READY"],
        completedAt: transcriptInput.requestedAt,
      };
    },
  };
}

class TelephonyReadinessServiceImpl implements TelephonyReadinessService {
  constructor(
    private readonly repository: TelephonyReadinessRepository,
    private readonly transcriptProvider: TranscriptProviderAdapter,
  ) {}

  async enqueueTranscriptJob(input: EnqueueTranscriptJobInput) {
    return this.enqueueTranscriptJobInternal(input, null, ["TEL_READY_191_TRANSCRIPT_JOB_QUEUED"]);
  }

  async enqueueTranscriptRerun(
    input: EnqueueTranscriptJobInput & {
      readonly supersedesTranscriptJobRef: string;
      readonly rerunReasonCode: string;
    },
  ) {
    return this.enqueueTranscriptJobInternal(input, input.supersedesTranscriptJobRef, [
      "TEL_READY_191_TRANSCRIPT_JOB_QUEUED",
      "TEL_READY_191_RERUN_APPENDED_SUPERSEDING_PRIOR_READINESS",
      input.rerunReasonCode,
    ]);
  }

  async markTranscriptJobRunning(input: {
    readonly transcriptJobRef: string;
    readonly runAt?: string;
  }) {
    const at = input.runAt ?? nowIso();
    const job = requireJob(
      await this.repository.getTranscriptJob(input.transcriptJobRef),
      input.transcriptJobRef,
    );
    const runningJob: TranscriptJobContract = {
      ...job,
      jobState: "running",
      workerAttemptCount: job.workerAttemptCount + 1,
      reasonCodes: uniqueSorted([...job.reasonCodes, "TEL_READY_191_TRANSCRIPT_JOB_RUNNING"]),
      updatedAt: at,
    };
    await this.repository.saveTranscriptJob(runningJob);
    const priorReadiness = await this.repository.getLatestTranscriptReadinessRecord(
      job.callSessionRef,
    );
    const readiness = createTranscriptReadinessRecord({
      job: runningJob,
      transcriptState: "running",
      coverageClass: "none",
      qualityBand: "unknown",
      contradictionPosture: "none",
      segmentCompletenessPosture: "missing",
      extractionCompletenessPosture: "not_started",
      derivationPackageRef: null,
      derivedFactsPackageRef: null,
      blockingReasonCodes: ["TEL_READY_191_AWAITING_TRANSCRIPT"],
      supersedesTranscriptReadinessRef:
        priorReadiness?.telephonyTranscriptReadinessRecordRef ?? null,
      reasonCodes: ["TEL_READY_191_TRANSCRIPT_JOB_RUNNING"],
      checkedAt: at,
    });
    await this.repository.saveTranscriptReadinessRecord(readiness);
    const assessment = await this.assessFromReadiness(runningJob, readiness, null, at);
    return {
      transcriptJob: runningJob,
      transcriptReadinessRecord: readiness,
      evidenceReadinessAssessment: assessment,
    };
  }

  async drainTranscriptJobs(input: TranscriptWorkerInput): Promise<TranscriptWorkerResult> {
    const at = input.runAt ?? nowIso();
    const jobs = input.transcriptJobRef
      ? [
          requireJob(
            await this.repository.getTranscriptJob(input.transcriptJobRef),
            input.transcriptJobRef,
          ),
        ]
      : await this.repository.listRunnableTranscriptJobs(input.maxJobs ?? 10);
    const transcriptReadinessRecords: TelephonyTranscriptReadinessRecord[] = [];
    const evidenceReadinessAssessments: TelephonyEvidenceReadinessAssessment[] = [];

    for (const job of jobs) {
      const running =
        job.jobState === "running"
          ? job
          : (
              await this.markTranscriptJobRunning({
                transcriptJobRef: job.transcriptJobRef,
                runAt: at,
              })
            ).transcriptJob;
      const settled = await this.settleTranscriptJob(running, at);
      transcriptReadinessRecords.push(settled.transcriptReadinessRecord);
      evidenceReadinessAssessments.push(settled.evidenceReadinessAssessment);
    }

    return {
      workerRunRef: input.workerRunRef,
      processedJobRefs: jobs.map((job) => job.transcriptJobRef),
      transcriptReadinessRecords,
      evidenceReadinessAssessments,
    };
  }

  async assessEvidenceWithoutRecording(input: {
    readonly callSessionRef: string;
    readonly reasonCode: string;
    readonly observedAt?: string;
  }): Promise<TelephonyEvidenceReadinessAssessment> {
    const at = input.observedAt ?? nowIso();
    const previous = await this.repository.getLatestEvidenceReadinessAssessment(
      input.callSessionRef,
    );
    const assessment: TelephonyEvidenceReadinessAssessment = {
      telephonyEvidenceReadinessAssessmentRef: stableRef("tel_evidence_readiness_191", {
        callSessionRef: input.callSessionRef,
        state: "awaiting_recording",
        at,
      }),
      schemaVersion: TELEPHONY_READINESS_SCHEMA_VERSION,
      policyVersion: TELEPHONY_EVIDENCE_READINESS_POLICY_VERSION,
      callSessionRef: input.callSessionRef,
      submissionEnvelopeRef: null,
      urgentLiveAssessmentRef: null,
      transcriptReadinessRef: null,
      structuredCaptureRefs: [],
      identityEvidenceRefs: [],
      contactRouteEvidenceRefs: [],
      manualReviewDispositionRef: null,
      continuationEligibilityRef: null,
      usabilityState: "awaiting_recording",
      promotionReadiness: "blocked",
      governingInputRefs: [],
      supersedesEvidenceReadinessAssessmentRef:
        previous?.telephonyEvidenceReadinessAssessmentRef ?? null,
      reasonCodes: uniqueSorted(["TEL_READY_191_AWAITING_RECORDING", input.reasonCode]),
      assessedAt: at,
      recordedBy: TELEPHONY_READINESS_SERVICE_NAME,
    };
    await this.repository.saveEvidenceReadinessAssessment(assessment);
    return assessment;
  }

  async getCurrentEvidenceReadiness(input: {
    readonly callSessionRef: string;
  }): Promise<TelephonyEvidenceReadinessAssessment | null> {
    return (
      (await this.repository.getLatestEvidenceReadinessAssessment(input.callSessionRef)) ?? null
    );
  }

  private async enqueueTranscriptJobInternal(
    input: EnqueueTranscriptJobInput,
    supersedesTranscriptJobRef: string | null,
    reasonCodes: readonly string[],
  ) {
    const existing = await this.repository.getTranscriptJobByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      const readiness = await this.repository.getLatestTranscriptReadinessRecord(
        existing.callSessionRef,
      );
      const assessment = await this.repository.getLatestEvidenceReadinessAssessment(
        existing.callSessionRef,
      );
      if (!readiness || !assessment) {
        throw new Error(`TRANSCRIPT_JOB_REPLAY_INCOMPLETE:${existing.transcriptJobRef}`);
      }
      return {
        transcriptJob: existing,
        transcriptReadinessRecord: readiness,
        evidenceReadinessAssessment: assessment,
      };
    }

    const at = input.observedAt ?? nowIso();
    const job: TranscriptJobContract = {
      transcriptJobRef: stableRef("tel_transcript_job_191", {
        callSessionRef: input.callSessionRef,
        recordingArtifactRef: input.recordingArtifactRef,
        idempotencyKey: input.idempotencyKey,
      }),
      schemaVersion: TELEPHONY_READINESS_SCHEMA_VERSION,
      callSessionRef: input.callSessionRef,
      recordingArtifactRef: input.recordingArtifactRef,
      audioIngestSettlementRef: input.audioIngestSettlementRef,
      recordingDocumentReferenceRef: input.recordingDocumentReferenceRef,
      idempotencyKey: input.idempotencyKey,
      jobState: "queued",
      workerAttemptCount: 0,
      supersedesTranscriptJobRef,
      derivationPackageRef: null,
      transcriptReadinessRef: null,
      evidenceReadinessAssessmentRef: null,
      terminalOutcome: "pending",
      reasonCodes: uniqueSorted(reasonCodes),
      createdAt: at,
      updatedAt: at,
      recordedBy: TELEPHONY_READINESS_SERVICE_NAME,
    };
    await this.repository.saveTranscriptJob(job);
    await this.repository.saveTranscriptContext(job.transcriptJobRef, defaultContext(input));
    const priorReadiness = await this.repository.getLatestTranscriptReadinessRecord(
      input.callSessionRef,
    );
    const readiness = createTranscriptReadinessRecord({
      job,
      transcriptState: "queued",
      coverageClass: "none",
      qualityBand: "unknown",
      contradictionPosture: "none",
      segmentCompletenessPosture: "missing",
      extractionCompletenessPosture: "not_started",
      derivationPackageRef: null,
      derivedFactsPackageRef: null,
      blockingReasonCodes: ["TEL_READY_191_AWAITING_TRANSCRIPT"],
      supersedesTranscriptReadinessRef:
        supersedesTranscriptJobRef && priorReadiness
          ? priorReadiness.telephonyTranscriptReadinessRecordRef
          : null,
      reasonCodes,
      checkedAt: at,
    });
    await this.repository.saveTranscriptReadinessRecord(readiness);
    const assessment = await this.assessFromReadiness(job, readiness, null, at);
    const updatedJob: TranscriptJobContract = {
      ...job,
      transcriptReadinessRef: readiness.telephonyTranscriptReadinessRecordRef,
      evidenceReadinessAssessmentRef: assessment.telephonyEvidenceReadinessAssessmentRef,
      updatedAt: at,
    };
    await this.repository.saveTranscriptJob(updatedJob);
    return {
      transcriptJob: updatedJob,
      transcriptReadinessRecord: readiness,
      evidenceReadinessAssessment: assessment,
    };
  }

  private async settleTranscriptJob(job: TranscriptJobContract, at: string) {
    const providerResult = await this.transcriptProvider.transcribe({
      transcriptJobRef: job.transcriptJobRef,
      callSessionRef: job.callSessionRef,
      recordingArtifactRef: job.recordingArtifactRef,
      attemptNumber: job.workerAttemptCount,
      requestedAt: at,
    });
    const context = await this.repository.getTranscriptContext(job.transcriptJobRef);
    if (!context) {
      throw new Error(`TRANSCRIPT_CONTEXT_NOT_FOUND:${job.transcriptJobRef}`);
    }
    const extracted = classifyTranscriptSignals(job.callSessionRef, providerResult.transcriptText);
    const keypadSignals = structuredCaptureSignals(job.callSessionRef, context.structuredCaptures);
    const contradictions = contradictionFlags(extracted.signals, context.structuredCaptures);
    const coverageClass = coverageClassFor({
      providerResult,
      transcriptSignalCount: extracted.signals.length,
      structuredSignalCount: keypadSignals.length,
      wordCount: extracted.wordCount,
    });
    const factCompleteness = factCompletenessFor({
      coverageClass,
      extractionCompletenessPosture: providerResult.extractionCompletenessPosture,
      signalCount: extracted.signals.length + keypadSignals.length,
    });
    const safetyFactsRef = stableRef("tel_safety_facts_191", {
      job: job.transcriptJobRef,
      transcriptDigest: stableDigest(providerResult.transcriptText),
    });
    const derivationPackageRef = stableRef("evidence_derivation_package_191", {
      job: job.transcriptJobRef,
      output: safetyFactsRef,
    });
    const priorDerivation = await this.repository.getLatestDerivationPackage(job.callSessionRef);
    const safetyFacts: TelephonySafetyFacts = {
      telephonySafetyFactsRef: safetyFactsRef,
      schemaVersion: TELEPHONY_READINESS_SCHEMA_VERSION,
      callSessionRef: job.callSessionRef,
      transcriptJobRef: job.transcriptJobRef,
      derivationPackageRef,
      extractionVersionRef: TELEPHONY_FACT_EXTRACTION_VERSION,
      transcriptDigest: stableDigest(providerResult.transcriptText),
      transcriptWordCount: extracted.wordCount,
      transcriptFactSignals: extracted.signals,
      keypadFactSignals: keypadSignals,
      operatorSupplementRefs: context.structuredCaptures
        .filter((capture) => capture.source === "operator")
        .map((capture) => capture.structuredCaptureRef),
      contradictionFlags: contradictions,
      coverageGaps: coverageClass === "clinically_sufficient" ? [] : [`coverage_${coverageClass}`],
      clinicallyRelevantSnippetRefs: extracted.snippetRefs,
      factCompleteness,
      createdAt: at,
      recordedBy: TELEPHONY_READINESS_SERVICE_NAME,
    };
    const derivationPackage: EvidenceDerivationPackage = {
      derivationPackageRef,
      schemaVersion: TELEPHONY_READINESS_SCHEMA_VERSION,
      callSessionRef: job.callSessionRef,
      transcriptJobRef: job.transcriptJobRef,
      captureBundleRef: stableRef("telephony_capture_bundle_191", {
        callSessionRef: job.callSessionRef,
        recordingArtifactRef: job.recordingArtifactRef,
      }),
      derivationClass: "telephony_transcript_and_fact_extraction",
      inputArtifactRefs: uniqueSorted([
        job.recordingArtifactRef,
        job.audioIngestSettlementRef,
        job.recordingDocumentReferenceRef,
        ...context.structuredCaptures.map((capture) => capture.structuredCaptureRef),
      ]),
      derivationVersionRef: TELEPHONY_FACT_EXTRACTION_VERSION,
      outputRef: safetyFactsRef,
      outputHash: stableDigest(JSON.stringify(safetyFacts)),
      transcriptArtifactRef: `artifact://telephony-transcript/${derivationPackageRef}`,
      transcriptArtifactDigest: stableDigest(providerResult.transcriptText),
      materialityClass: "clinically_material",
      supersedesDerivationPackageRef: job.supersedesTranscriptJobRef
        ? (priorDerivation?.derivationPackageRef ?? null)
        : null,
      derivedAt: at,
      recordedBy: TELEPHONY_READINESS_SERVICE_NAME,
    };
    await this.repository.saveSafetyFacts(safetyFacts);
    await this.repository.saveDerivationPackage(derivationPackage);

    const transcriptState = transcriptStateForProvider(providerResult, coverageClass);
    const contradictionPosture: ContradictionPosture =
      contradictions.length > 0 ? "unresolved" : "none";
    const blockingReasonCodes = this.blockingReasonsForTerminalReadiness({
      providerResult,
      coverageClass,
      contradictionPosture,
      context,
      factCompleteness,
    });
    const priorReadiness = await this.repository.getLatestTranscriptReadinessRecord(
      job.callSessionRef,
    );
    const readiness = createTranscriptReadinessRecord({
      job,
      transcriptState,
      coverageClass,
      qualityBand: providerResult.qualityBand,
      contradictionPosture,
      segmentCompletenessPosture: providerResult.segmentCompletenessPosture,
      extractionCompletenessPosture: providerResult.extractionCompletenessPosture,
      derivationPackageRef,
      derivedFactsPackageRef: safetyFactsRef,
      blockingReasonCodes,
      supersedesTranscriptReadinessRef:
        priorReadiness?.telephonyTranscriptReadinessRecordRef ?? null,
      reasonCodes: uniqueSorted([
        ...providerResult.reasonCodes,
        "TEL_READY_191_WORKER_COMPLETION_NOT_PROMOTION_AUTHORITY",
        transcriptState === "ready"
          ? "TEL_READY_191_TRANSCRIPT_READY_CLINICALLY_SUFFICIENT"
          : transcriptState === "degraded" || transcriptState === "partial"
            ? "TEL_READY_191_TRANSCRIPT_DEGRADED_MANUAL_REVIEW"
            : "TEL_READY_191_TRANSCRIPT_FAILED_MANUAL_REVIEW",
      ]),
      checkedAt: at,
    });
    await this.repository.saveTranscriptReadinessRecord(readiness);
    const terminalJob: TranscriptJobContract = {
      ...job,
      jobState:
        transcriptState === "ready"
          ? "succeeded"
          : providerResult.transcriptState === "failed"
            ? "failed"
            : "degraded",
      derivationPackageRef,
      transcriptReadinessRef: readiness.telephonyTranscriptReadinessRecordRef,
      terminalOutcome: providerResult.terminalUnusable
        ? "unusable_terminal"
        : transcriptState === "ready"
          ? "ready"
          : providerResult.transcriptState === "failed"
            ? "failed"
            : "degraded",
      reasonCodes: uniqueSorted([...job.reasonCodes, ...readiness.reasonCodes]),
      updatedAt: at,
    };
    const assessment = await this.assessFromReadiness(
      terminalJob,
      readiness,
      safetyFacts,
      at,
      providerResult,
    );
    await this.repository.saveTranscriptJob({
      ...terminalJob,
      evidenceReadinessAssessmentRef: assessment.telephonyEvidenceReadinessAssessmentRef,
    });
    return {
      transcriptReadinessRecord: readiness,
      evidenceReadinessAssessment: assessment,
    };
  }

  private blockingReasonsForTerminalReadiness(input: {
    readonly providerResult: TranscriptProviderResult;
    readonly coverageClass: TranscriptCoverageClass;
    readonly contradictionPosture: ContradictionPosture;
    readonly context: TranscriptContext;
    readonly factCompleteness: "none" | "partial" | "complete";
  }): readonly string[] {
    const reasons: string[] = [];
    if (input.providerResult.terminalUnusable)
      reasons.push("TEL_READY_191_TRANSCRIPT_TERMINAL_UNUSABLE");
    if (input.providerResult.transcriptState === "failed")
      reasons.push("TEL_READY_191_TRANSCRIPT_FAILED_MANUAL_REVIEW");
    if (input.providerResult.transcriptState === "degraded")
      reasons.push("TEL_READY_191_TRANSCRIPT_DEGRADED_MANUAL_REVIEW");
    if (input.coverageClass !== "clinically_sufficient")
      reasons.push("TEL_READY_191_AWAITING_TRANSCRIPT");
    if (input.contradictionPosture === "unresolved")
      reasons.push("TEL_READY_191_STRUCTURED_CAPTURE_CONFLICT");
    if (
      input.context.structuredCaptureRequirement === "required" &&
      input.context.structuredCaptures.length === 0
    ) {
      reasons.push("TEL_READY_191_AWAITING_STRUCTURED_CAPTURE");
    }
    if (input.factCompleteness !== "complete") reasons.push("TEL_READY_191_AWAITING_TRANSCRIPT");
    return uniqueSorted(reasons);
  }

  private async assessFromReadiness(
    job: TranscriptJobContract,
    readiness: TelephonyTranscriptReadinessRecord,
    safetyFacts: TelephonySafetyFacts | null,
    at: string,
    providerResult?: TranscriptProviderResult,
  ): Promise<TelephonyEvidenceReadinessAssessment> {
    const context = await this.repository.getTranscriptContext(job.transcriptJobRef);
    if (!context) {
      throw new Error(`TRANSCRIPT_CONTEXT_NOT_FOUND:${job.transcriptJobRef}`);
    }
    const previous = await this.repository.getLatestEvidenceReadinessAssessment(job.callSessionRef);
    const manualTrigger = this.manualTriggerFor(readiness, context, providerResult);
    const manualEntry = manualTrigger
      ? await this.ensureManualReviewQueueEntry({
          job,
          readiness,
          triggerClass: manualTrigger,
          at,
          reasonCodes: readiness.blockingReasonCodes,
        })
      : null;
    const usabilityState = this.usabilityStateFor(readiness, context, manualEntry, providerResult);
    const promotionReadiness: PromotionReadiness =
      usabilityState === "safety_usable" ? "ready_to_promote" : "blocked";
    const assessment: TelephonyEvidenceReadinessAssessment = {
      telephonyEvidenceReadinessAssessmentRef: stableRef("tel_evidence_readiness_191", {
        callSessionRef: job.callSessionRef,
        transcriptReadinessRef: readiness.telephonyTranscriptReadinessRecordRef,
        state: usabilityState,
        at,
      }),
      schemaVersion: TELEPHONY_READINESS_SCHEMA_VERSION,
      policyVersion: TELEPHONY_EVIDENCE_READINESS_POLICY_VERSION,
      callSessionRef: job.callSessionRef,
      submissionEnvelopeRef: context.submissionEnvelopeRef,
      urgentLiveAssessmentRef: context.urgentLiveAssessmentRef,
      transcriptReadinessRef: readiness.telephonyTranscriptReadinessRecordRef,
      structuredCaptureRefs: context.structuredCaptures.map(
        (capture) => capture.structuredCaptureRef,
      ),
      identityEvidenceRefs: context.identityEvidenceRefs,
      contactRouteEvidenceRefs: context.contactRouteEvidenceRefs,
      manualReviewDispositionRef: manualEntry?.manualReviewDispositionRef ?? null,
      continuationEligibilityRef: null,
      usabilityState,
      promotionReadiness,
      governingInputRefs: uniqueSorted(
        [
          job.recordingArtifactRef,
          job.audioIngestSettlementRef,
          job.recordingDocumentReferenceRef,
          readiness.telephonyTranscriptReadinessRecordRef,
          safetyFacts?.telephonySafetyFactsRef ?? "",
          ...(manualEntry ? [manualEntry.manualReviewDispositionRef] : []),
        ].filter(Boolean),
      ),
      supersedesEvidenceReadinessAssessmentRef:
        previous?.telephonyEvidenceReadinessAssessmentRef ?? null,
      reasonCodes: uniqueSorted([
        ...readiness.reasonCodes,
        ...readiness.blockingReasonCodes,
        ...this.reasonCodesForUsability(usabilityState),
      ]),
      assessedAt: at,
      recordedBy: TELEPHONY_READINESS_SERVICE_NAME,
    };
    await this.repository.saveEvidenceReadinessAssessment(assessment);
    if (manualEntry) {
      await this.repository.saveManualAudioReviewQueueEntry({
        ...manualEntry,
        evidenceReadinessAssessmentRef: assessment.telephonyEvidenceReadinessAssessmentRef,
      });
    }
    return assessment;
  }

  private usabilityStateFor(
    readiness: TelephonyTranscriptReadinessRecord,
    context: TranscriptContext,
    manualEntry: ManualAudioReviewQueueEntry | null,
    providerResult?: TranscriptProviderResult,
  ): EvidenceUsabilityState {
    if (providerResult?.terminalUnusable) return "unusable_terminal";
    if (context.urgentLiveOutcome === "urgent_live_required") return "urgent_live_only";
    if (readiness.transcriptState === "queued" || readiness.transcriptState === "running") {
      return "awaiting_transcript";
    }
    if (
      context.structuredCaptureRequirement === "required" &&
      context.structuredCaptures.length === 0
    ) {
      return "awaiting_structured_capture";
    }
    if (manualEntry) return "manual_review_only";
    if (
      readiness.transcriptState === "ready" &&
      readiness.coverageClass === "clinically_sufficient" &&
      readiness.contradictionPosture !== "unresolved" &&
      readiness.extractionCompletenessPosture === "complete" &&
      transcriptCoverageSufficiencyPolicy.allowedReadyQualityBands.includes(
        readiness.qualityBand as "medium" | "high",
      )
    ) {
      return "safety_usable";
    }
    return "manual_review_only";
  }

  private manualTriggerFor(
    readiness: TelephonyTranscriptReadinessRecord,
    context: TranscriptContext,
    providerResult?: TranscriptProviderResult,
  ): ManualAudioReviewTriggerClass | null {
    if (providerResult?.terminalUnusable) return null;
    if (context.urgentLiveOutcome === "urgent_live_required") {
      return "urgent_live_without_routine_evidence";
    }
    if (readiness.contradictionPosture === "unresolved") return "contradictory_capture";
    if (
      readiness.transcriptState === "failed" ||
      readiness.transcriptState === "degraded" ||
      readiness.transcriptState === "partial"
    ) {
      return "transcript_degraded";
    }
    if (
      readiness.coverageClass !== "clinically_sufficient" &&
      readiness.transcriptState !== "queued" &&
      readiness.transcriptState !== "running"
    ) {
      return "transcript_degraded";
    }
    return null;
  }

  private reasonCodesForUsability(usabilityState: EvidenceUsabilityState): readonly string[] {
    switch (usabilityState) {
      case "awaiting_recording":
        return ["TEL_READY_191_AWAITING_RECORDING"];
      case "awaiting_transcript":
        return ["TEL_READY_191_AWAITING_TRANSCRIPT"];
      case "awaiting_structured_capture":
        return ["TEL_READY_191_AWAITING_STRUCTURED_CAPTURE"];
      case "urgent_live_only":
        return ["TEL_READY_191_URGENT_LIVE_ONLY_BLOCKS_ROUTINE"];
      case "safety_usable":
        return ["TEL_READY_191_SAFETY_USABLE_READY_TO_PROMOTE"];
      case "manual_review_only":
        return ["TEL_READY_191_TRANSCRIPT_DEGRADED_MANUAL_REVIEW"];
      case "unusable_terminal":
        return ["TEL_READY_191_TRANSCRIPT_TERMINAL_UNUSABLE"];
    }
  }

  private async ensureManualReviewQueueEntry(input: {
    readonly job: TranscriptJobContract;
    readonly readiness: TelephonyTranscriptReadinessRecord;
    readonly triggerClass: ManualAudioReviewTriggerClass;
    readonly reasonCodes: readonly string[];
    readonly at: string;
  }): Promise<ManualAudioReviewQueueEntry> {
    const manualReviewDispositionRef = stableRef("tel_manual_audio_review_191", {
      job: input.job.transcriptJobRef,
      triggerClass: input.triggerClass,
    });
    const existing = await this.repository.getManualAudioReviewQueueEntry(
      manualReviewDispositionRef,
    );
    if (existing) return existing;
    const entry: ManualAudioReviewQueueEntry = {
      manualAudioReviewQueueEntryRef: stableRef("manual_audio_review_queue_entry_191", {
        manualReviewDispositionRef,
      }),
      schemaVersion: TELEPHONY_READINESS_SCHEMA_VERSION,
      manualReviewDispositionRef,
      callSessionRef: input.job.callSessionRef,
      triggerClass: input.triggerClass,
      reviewMode: manualReviewModeFor(input.triggerClass),
      reviewState: "open",
      transcriptReadinessRef: input.readiness.telephonyTranscriptReadinessRecordRef,
      evidenceReadinessAssessmentRef: null,
      reasonCodes: uniqueSorted(input.reasonCodes),
      createdAt: input.at,
      recordedBy: TELEPHONY_READINESS_SERVICE_NAME,
    };
    await this.repository.saveManualAudioReviewQueueEntry(entry);
    return entry;
  }
}

export function audioIngestSettlementToTranscriptJobInput(input: {
  readonly settlement: AudioIngestSettlement;
  readonly idempotencyKey: string;
  readonly observedAt?: string;
}): EnqueueTranscriptJobInput {
  if (input.settlement.settlementOutcome !== "governed_audio_ready") {
    throw new Error(`AUDIO_NOT_READY_FOR_TRANSCRIPT:${input.settlement.audioIngestSettlementRef}`);
  }
  return {
    callSessionRef: input.settlement.callSessionRef,
    recordingArtifactRef:
      input.settlement.documentReferenceRef ?? input.settlement.objectStorageRef ?? "",
    audioIngestSettlementRef: input.settlement.audioIngestSettlementRef,
    recordingDocumentReferenceRef: input.settlement.documentReferenceRef ?? "",
    idempotencyKey: input.idempotencyKey,
    observedAt: input.observedAt,
  };
}

export function createTelephonyReadinessApplication(
  input: CreateTelephonyReadinessApplicationInput,
): TelephonyReadinessApplication {
  const repository = input.repository ?? createInMemoryTelephonyReadinessRepository();
  return {
    service: new TelephonyReadinessServiceImpl(repository, input.transcriptProvider),
    repository,
    persistenceTables: telephonyReadinessPersistenceTables,
    migrationPlanRefs: telephonyReadinessMigrationPlanRefs,
    gapResolutions: telephonyReadinessGapResolutions,
    coveragePolicy: transcriptCoverageSufficiencyPolicy,
    reasonCatalog: telephonyEvidenceReadinessReasonCatalog,
  };
}
