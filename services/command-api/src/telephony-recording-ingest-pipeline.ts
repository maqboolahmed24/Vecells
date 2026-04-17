import { createHash } from "node:crypto";

export const TELEPHONY_RECORDING_INGEST_SERVICE_NAME = "TelephonyRecordingIngestPipeline";
export const TELEPHONY_RECORDING_INGEST_SCHEMA_VERSION = "190.phase2.recording-ingest.v1";
export const TELEPHONY_RECORDING_INGEST_POLICY_VERSION = "phase2-recording-ingest-190.v1";
export const RECORDING_FETCH_RETRY_POLICY_VERSION = "phase2-recording-fetch-retry-190.v1";
export const RECORDING_AUDIO_SCAN_POLICY_VERSION = "phase2-audio-format-scan-policy-190.v1";
export const RECORDING_GOVERNED_OBJECT_POLICY_VERSION =
  "phase2-audio-governed-object-policy-190.v1";

export const recordingIngestPersistenceTables = [
  "phase2_recording_fetch_jobs",
  "phase2_recording_quarantine_objects",
  "phase2_recording_asset_quarantine_assessments",
  "phase2_recording_governed_audio_objects",
  "phase2_recording_document_reference_links",
  "phase2_recording_ingest_settlements",
  "phase2_recording_manual_review_dispositions",
] as const;

export const recordingIngestMigrationPlanRefs = [
  "services/command-api/migrations/105_phase2_recording_ingest_pipeline.sql",
] as const;

export const recordingIngestGapResolutions = [
  "GAP_RESOLVED_PHASE2_RECORDING_TIMEOUT_RETRY_LAW",
  "GAP_RESOLVED_PHASE2_RECORDING_AUDIO_FORMAT_POLICY",
  "GAP_RESOLVED_PHASE2_RECORDING_DUPLICATE_ASSET_DETECTION",
  "GAP_RESOLVED_PHASE2_RECORDING_PARTIAL_PROGRESS_CLEANUP",
  "GAP_RESOLVED_PHASE2_RECORDING_PROVIDER_URL_LEAKAGE",
] as const;

export const allowedRecordingAudioMediaTypes = [
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/webm",
] as const;

export type RecordingAudioMediaType = (typeof allowedRecordingAudioMediaTypes)[number];

export const recordingAudioFormatPolicy = {
  policyVersion: RECORDING_AUDIO_SCAN_POLICY_VERSION,
  allowedMediaTypes: allowedRecordingAudioMediaTypes,
  expectedDurationSeconds: 60,
  hardMaxDurationSeconds: 120,
  maxByteSize: 25 * 1024 * 1024,
  quarantineRequiredBeforePromotion: true,
  scannerVerdictRequired: "clean",
  documentReferenceUrlScheme: "artifact://",
} as const;

export const recordingFetchTimeoutRetryLaw = {
  policyVersion: RECORDING_FETCH_RETRY_POLICY_VERSION,
  maxAttemptsBeforeManualReview: 4,
  fetchAttemptTimeoutSeconds: 30,
  backoffSeconds: [30, 120, 300, 900],
  timeoutTerminalOutcome: "recording_missing",
  retryableProviderOutcomes: ["delayed", "provider_unavailable"] as const,
} as const;

export type RecordingFetchJobPhase =
  | "scheduled"
  | "fetch_pending"
  | "fetch_in_progress"
  | "fetched_to_quarantine"
  | "quarantine_assessed"
  | "governed_storage_settled"
  | "document_reference_linked"
  | "terminal_blocked"
  | "terminal_succeeded";

export type RecordingFetchTerminalOutcome =
  | "pending"
  | "succeeded"
  | "recording_missing"
  | "provider_unavailable_retryable"
  | "corrupt_or_integrity_failed"
  | "unsupported_format"
  | "malware_or_scan_blocked"
  | "size_or_duration_exceeded"
  | "provider_ref_mismatch"
  | "manual_audio_review_required";

export type RecordingFetchTimeoutPosture =
  | "within_provider_sla"
  | "retry_backoff_active"
  | "timeout_manual_review"
  | "terminal";

export interface RecordingFetchJob {
  readonly recordingFetchJobRef: string;
  readonly schemaVersion: typeof TELEPHONY_RECORDING_INGEST_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_RECORDING_INGEST_POLICY_VERSION;
  readonly retryPolicyVersion: typeof RECORDING_FETCH_RETRY_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly providerRecordingRef: string;
  readonly canonicalEventRef: string;
  readonly idempotencyKey: string;
  readonly retryCount: number;
  readonly nextRetryAt: string | null;
  readonly timeoutPosture: RecordingFetchTimeoutPosture;
  readonly currentPhase: RecordingFetchJobPhase;
  readonly quarantineAssessmentRef: string | null;
  readonly objectStorageRef: string | null;
  readonly documentReferenceRef: string | null;
  readonly terminalOutcome: RecordingFetchTerminalOutcome;
  readonly terminalOutcomeAt: string | null;
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly recordedBy: typeof TELEPHONY_RECORDING_INGEST_SERVICE_NAME;
}

export interface ScheduleRecordingFetchJobInput {
  readonly callSessionRef: string;
  readonly providerRecordingRef: string;
  readonly canonicalEventRef: string;
  readonly idempotencyKey: string;
  readonly timeoutPosture?: RecordingFetchTimeoutPosture;
  readonly observedAt?: string;
}

export type ProviderRecordingAssetAvailability =
  | "available"
  | "delayed"
  | "missing"
  | "expired"
  | "provider_unavailable";

export interface ProviderRecordingAsset {
  readonly providerRecordingRef: string;
  readonly providerCallRef: string;
  readonly assetAvailability: "available";
  readonly mediaType: string;
  readonly byteSize: number;
  readonly durationSeconds: number;
  readonly checksumSha256: string | null;
  readonly body: Uint8Array;
  readonly providerAuthenticated: boolean;
  readonly fetchedAt: string;
}

export interface ProviderRecordingFetchInput {
  readonly recordingFetchJobRef: string;
  readonly callSessionRef: string;
  readonly providerRecordingRef: string;
  readonly canonicalEventRef: string;
  readonly attemptNumber: number;
  readonly requestedAt: string;
}

export interface ProviderRecordingFetchResult {
  readonly availability: ProviderRecordingAssetAvailability;
  readonly asset: ProviderRecordingAsset | null;
  readonly retryAfterSeconds: number | null;
  readonly reasonCodes: readonly string[];
  readonly fetchedAt: string;
}

export interface ProviderRecordingAdapter {
  fetchRecording(input: ProviderRecordingFetchInput): Promise<ProviderRecordingFetchResult>;
}

export type RecordingTransportIntegrityState = "passed" | "failed" | "not_supplied";
export type RecordingProviderAuthenticityState = "passed" | "failed";
export type RecordingFormatPolicyState = "allowed" | "unsupported" | "size_or_duration_exceeded";
export type RecordingMalwareScanState = "clean" | "malware" | "unreadable" | "scanner_timeout";
export type RecordingQuarantineOutcome =
  | "clean"
  | "retryable_hold"
  | "blocked_malware"
  | "blocked_integrity"
  | "blocked_unsupported_format"
  | "blocked_missing"
  | "blocked_size_duration"
  | "blocked_provider_ref_mismatch";

export interface RecordingQuarantineObject {
  readonly quarantineObjectRef: string;
  readonly recordingFetchJobRef: string;
  readonly callSessionRef: string;
  readonly providerRecordingRef: string;
  readonly byteSize: number;
  readonly contentDigest: string;
  readonly mediaType: string;
  readonly createdAt: string;
}

export interface RecordingAssetQuarantineAssessment {
  readonly quarantineAssessmentRef: string;
  readonly schemaVersion: typeof TELEPHONY_RECORDING_INGEST_SCHEMA_VERSION;
  readonly policyVersion: typeof RECORDING_AUDIO_SCAN_POLICY_VERSION;
  readonly recordingFetchJobRef: string;
  readonly callSessionRef: string;
  readonly providerRecordingRef: string;
  readonly quarantineObjectRef: string | null;
  readonly mediaFamily: "audio";
  readonly detectedMediaType: string | null;
  readonly byteSize: number | null;
  readonly durationSeconds: number | null;
  readonly checksumSha256: string | null;
  readonly transportIntegrityState: RecordingTransportIntegrityState;
  readonly providerAuthenticityState: RecordingProviderAuthenticityState;
  readonly formatPolicyState: RecordingFormatPolicyState;
  readonly malwareScanState: RecordingMalwareScanState;
  readonly quarantineOutcome: RecordingQuarantineOutcome;
  readonly manualReviewDispositionRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly assessedAt: string;
  readonly recordedBy: typeof TELEPHONY_RECORDING_INGEST_SERVICE_NAME;
}

export interface RecordingScannerInput {
  readonly recordingFetchJobRef: string;
  readonly callSessionRef: string;
  readonly providerRecordingRef: string;
  readonly quarantineObjectRef: string;
  readonly contentDigest: string;
  readonly mediaType: string;
  readonly byteSize: number;
  readonly durationSeconds: number;
  readonly requestedAt: string;
}

export interface RecordingScanResult {
  readonly scannerRef: string;
  readonly malwareScanState: RecordingMalwareScanState;
  readonly reasonCodes: readonly string[];
  readonly scannedAt: string;
}

export interface RecordingScannerAdapter {
  scan(input: RecordingScannerInput): Promise<RecordingScanResult>;
}

export interface GovernedAudioObject {
  readonly objectStorageRef: string;
  readonly canonicalObjectRef: string;
  readonly recordingFetchJobRef: string;
  readonly callSessionRef: string;
  readonly providerRecordingRef: string;
  readonly quarantineObjectRef: string;
  readonly storageClass: "governed_audio";
  readonly retentionClass: "clinical_audio_evidence";
  readonly encryptionKeyLineageRef: string;
  readonly contentDigest: string;
  readonly byteSize: number;
  readonly durationSeconds: number;
  readonly mediaType: string;
  readonly disclosureClass: "clinical_evidence_audio";
  readonly duplicateAssetDetectionRef: string;
  readonly ingestedAt: string;
}

export type AudioIngestSettlementOutcome =
  | "governed_audio_ready"
  | "recording_missing"
  | "manual_audio_review_required"
  | "retry_scheduled"
  | "blocked_terminal";

export interface AudioIngestSettlement {
  readonly audioIngestSettlementRef: string;
  readonly schemaVersion: typeof TELEPHONY_RECORDING_INGEST_SCHEMA_VERSION;
  readonly recordingFetchJobRef: string;
  readonly callSessionRef: string;
  readonly providerRecordingRef: string;
  readonly quarantineAssessmentRef: string | null;
  readonly objectStorageRef: string | null;
  readonly documentReferenceRef: string | null;
  readonly settlementOutcome: AudioIngestSettlementOutcome;
  readonly noOrphanGuarantee:
    | "quarantine_only_no_governed_object"
    | "governed_object_has_document_reference"
    | "retry_without_storage";
  readonly callSessionEventType:
    | "recording_available"
    | "manual_followup_requested"
    | "recording_fetch_retry_scheduled";
  readonly callSessionEventPayloadRef: string;
  readonly reasonCodes: readonly string[];
  readonly settledAt: string;
  readonly recordedBy: typeof TELEPHONY_RECORDING_INGEST_SERVICE_NAME;
}

export interface RecordingDocumentReferenceLink {
  readonly documentReferenceLinkRef: string;
  readonly schemaVersion: typeof TELEPHONY_RECORDING_INGEST_SCHEMA_VERSION;
  readonly documentReferenceRef: string;
  readonly documentReferenceLogicalId: string;
  readonly representationSetRef: string;
  readonly documentReferenceRecordRef: string;
  readonly callSessionRef: string;
  readonly providerRecordingRef: string;
  readonly objectStorageRef: string;
  readonly canonicalObjectRef: string;
  readonly contentDigest: string;
  readonly mediaType: string;
  readonly byteSize: number;
  readonly durationSeconds: number;
  readonly artifactUrl: `artifact://${string}`;
  readonly sourceAggregateRefs: readonly string[];
  readonly linkedAt: string;
  readonly recordedBy: typeof TELEPHONY_RECORDING_INGEST_SERVICE_NAME;
}

export interface TelephonyRecordingManualReviewDisposition {
  readonly manualReviewDispositionRef: string;
  readonly callSessionRef: string;
  readonly recordingFetchJobRef: string;
  readonly providerRecordingRef: string;
  readonly triggerClass: "recording_missing" | "unusable_audio";
  readonly reviewMode:
    | "audio_review"
    | "callback_required"
    | "staff_transcription"
    | "follow_up_needed";
  readonly reviewState: "open";
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly recordedBy: typeof TELEPHONY_RECORDING_INGEST_SERVICE_NAME;
}

export interface RecordingFetchWorkerInput {
  readonly recordingFetchJobRef?: string;
  readonly workerRunRef: string;
  readonly maxJobs?: number;
  readonly runAt?: string;
}

export interface RecordingFetchWorkerResult {
  readonly workerRunRef: string;
  readonly processedJobRefs: readonly string[];
  readonly settlements: readonly AudioIngestSettlement[];
}

export interface RecordingIngestSnapshots {
  readonly jobs: readonly RecordingFetchJob[];
  readonly quarantineObjects: readonly RecordingQuarantineObject[];
  readonly quarantineAssessments: readonly RecordingAssetQuarantineAssessment[];
  readonly governedObjects: readonly GovernedAudioObject[];
  readonly documentReferenceLinks: readonly RecordingDocumentReferenceLink[];
  readonly settlements: readonly AudioIngestSettlement[];
  readonly manualReviewDispositions: readonly TelephonyRecordingManualReviewDisposition[];
}

export interface TelephonyRecordingIngestRepository {
  getJobByIdempotencyKey(idempotencyKey: string): Promise<RecordingFetchJob | undefined>;
  getJobByProviderRecordingRef(
    callSessionRef: string,
    providerRecordingRef: string,
  ): Promise<RecordingFetchJob | undefined>;
  getJob(recordingFetchJobRef: string): Promise<RecordingFetchJob | undefined>;
  saveJob(job: RecordingFetchJob): Promise<void>;
  listProcessableJobs(limit: number): Promise<readonly RecordingFetchJob[]>;
  saveQuarantineObject(object: RecordingQuarantineObject): Promise<void>;
  getQuarantineObject(recordingFetchJobRef: string): Promise<RecordingQuarantineObject | undefined>;
  saveQuarantineAssessment(assessment: RecordingAssetQuarantineAssessment): Promise<void>;
  getLatestQuarantineAssessment(
    recordingFetchJobRef: string,
  ): Promise<RecordingAssetQuarantineAssessment | undefined>;
  saveGovernedObject(object: GovernedAudioObject): Promise<void>;
  getGovernedObjectByDuplicateKey(
    providerRecordingRef: string,
    contentDigest: string,
  ): Promise<GovernedAudioObject | undefined>;
  getGovernedObjectForJob(recordingFetchJobRef: string): Promise<GovernedAudioObject | undefined>;
  saveDocumentReferenceLink(link: RecordingDocumentReferenceLink): Promise<void>;
  getDocumentReferenceLink(
    callSessionRef: string,
    providerRecordingRef: string,
  ): Promise<RecordingDocumentReferenceLink | undefined>;
  getDocumentReferenceLinkForObject(
    objectStorageRef: string,
  ): Promise<RecordingDocumentReferenceLink | undefined>;
  saveSettlement(settlement: AudioIngestSettlement): Promise<void>;
  getTerminalSettlement(recordingFetchJobRef: string): Promise<AudioIngestSettlement | undefined>;
  saveManualReviewDisposition(
    disposition: TelephonyRecordingManualReviewDisposition,
  ): Promise<void>;
  getManualReviewDisposition(
    recordingFetchJobRef: string,
  ): Promise<TelephonyRecordingManualReviewDisposition | undefined>;
  snapshots(): RecordingIngestSnapshots;
}

export interface TelephonyRecordingIngestApplication {
  readonly service: TelephonyRecordingIngestService;
  readonly repository: TelephonyRecordingIngestRepository;
  readonly persistenceTables: typeof recordingIngestPersistenceTables;
  readonly migrationPlanRefs: typeof recordingIngestMigrationPlanRefs;
  readonly gapResolutions: typeof recordingIngestGapResolutions;
  readonly formatPolicy: typeof recordingAudioFormatPolicy;
  readonly retryLaw: typeof recordingFetchTimeoutRetryLaw;
}

export interface TelephonyRecordingIngestService {
  scheduleRecordingFetchJob(input: ScheduleRecordingFetchJobInput): Promise<RecordingFetchJob>;
  drainRecordingFetchJobs(input: RecordingFetchWorkerInput): Promise<RecordingFetchWorkerResult>;
  getRecordingDocumentReference(input: {
    readonly callSessionRef: string;
    readonly providerRecordingRef: string;
  }): Promise<RecordingDocumentReferenceLink | null>;
  repairNoOrphanRecordingIngest(input: {
    readonly recordingFetchJobRef: string;
    readonly repairedAt?: string;
  }): Promise<AudioIngestSettlement | null>;
}

interface CreateTelephonyRecordingIngestApplicationInput {
  readonly repository?: TelephonyRecordingIngestRepository;
  readonly providerAdapter: ProviderRecordingAdapter;
  readonly scannerAdapter?: RecordingScannerAdapter;
}

interface ProviderRecordingFixture {
  readonly providerRecordingRef: string;
  readonly providerCallRef?: string;
  readonly mediaType: string;
  readonly body: Uint8Array | string;
  readonly durationSeconds: number;
  readonly checksumSha256?: string | null;
  readonly providerAuthenticated?: boolean;
}

interface InMemoryProviderRecordingAdapterInput {
  readonly assets?: readonly ProviderRecordingFixture[];
  readonly scriptedAvailability?: Readonly<
    Record<string, readonly ProviderRecordingAssetAvailability[]>
  >;
}

interface StaticRecordingScannerInput {
  readonly verdictByProviderRecordingRef?: Readonly<Record<string, RecordingMalwareScanState>>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function stableDigest(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function toBytes(value: string | Uint8Array): Uint8Array {
  if (typeof value === "string") {
    return new TextEncoder().encode(value);
  }
  return value;
}

function stableRef(prefix: string, parts: Readonly<Record<string, unknown>>): string {
  return `${prefix}_${stableDigest(JSON.stringify(parts)).slice(0, 24)}`;
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values)).sort();
}

function nextRetryAt(at: string, retryCount: number): string {
  const delayIndex = Math.min(
    Math.max(retryCount - 1, 0),
    recordingFetchTimeoutRetryLaw.backoffSeconds.length - 1,
  );
  const delaySeconds = recordingFetchTimeoutRetryLaw.backoffSeconds[delayIndex] ?? 900;
  return new Date(Date.parse(at) + delaySeconds * 1000).toISOString();
}

function terminalSettlementOutcomes(settlement: AudioIngestSettlement): boolean {
  return settlement.settlementOutcome !== "retry_scheduled";
}

function requireJob(
  job: RecordingFetchJob | undefined,
  recordingFetchJobRef: string,
): RecordingFetchJob {
  if (!job) {
    throw new Error(`RECORDING_FETCH_JOB_NOT_FOUND:${recordingFetchJobRef}`);
  }
  return job;
}

function isAllowedRecordingMediaType(mediaType: string): mediaType is RecordingAudioMediaType {
  return allowedRecordingAudioMediaTypes.includes(mediaType as RecordingAudioMediaType);
}

function computeTransportIntegrity(
  input: ProviderRecordingAsset,
): RecordingTransportIntegrityState {
  if (!input.checksumSha256) {
    return "not_supplied";
  }
  return stableDigest(input.body) === input.checksumSha256 ? "passed" : "failed";
}

function createManualReviewDisposition(input: {
  readonly job: RecordingFetchJob;
  readonly triggerClass: TelephonyRecordingManualReviewDisposition["triggerClass"];
  readonly reviewMode: TelephonyRecordingManualReviewDisposition["reviewMode"];
  readonly reasonCodes: readonly string[];
  readonly at: string;
}): TelephonyRecordingManualReviewDisposition {
  return {
    manualReviewDispositionRef: stableRef("tel_recording_manual_review_190", {
      job: input.job.recordingFetchJobRef,
      triggerClass: input.triggerClass,
    }),
    callSessionRef: input.job.callSessionRef,
    recordingFetchJobRef: input.job.recordingFetchJobRef,
    providerRecordingRef: input.job.providerRecordingRef,
    triggerClass: input.triggerClass,
    reviewMode: input.reviewMode,
    reviewState: "open",
    reasonCodes: uniqueSorted(input.reasonCodes),
    createdAt: input.at,
    recordedBy: TELEPHONY_RECORDING_INGEST_SERVICE_NAME,
  };
}

function createBlockedAssessment(input: {
  readonly job: RecordingFetchJob;
  readonly outcome: RecordingQuarantineOutcome;
  readonly reasonCodes: readonly string[];
  readonly at: string;
  readonly manualReviewDispositionRef?: string | null;
  readonly quarantineObjectRef?: string | null;
  readonly asset?: ProviderRecordingAsset | null;
  readonly transportIntegrityState?: RecordingTransportIntegrityState;
  readonly providerAuthenticityState?: RecordingProviderAuthenticityState;
  readonly formatPolicyState?: RecordingFormatPolicyState;
  readonly malwareScanState?: RecordingMalwareScanState;
}): RecordingAssetQuarantineAssessment {
  return {
    quarantineAssessmentRef: stableRef("tel_recording_quarantine_assessment_190", {
      job: input.job.recordingFetchJobRef,
      outcome: input.outcome,
      at: input.at,
    }),
    schemaVersion: TELEPHONY_RECORDING_INGEST_SCHEMA_VERSION,
    policyVersion: RECORDING_AUDIO_SCAN_POLICY_VERSION,
    recordingFetchJobRef: input.job.recordingFetchJobRef,
    callSessionRef: input.job.callSessionRef,
    providerRecordingRef: input.job.providerRecordingRef,
    quarantineObjectRef: input.quarantineObjectRef ?? null,
    mediaFamily: "audio",
    detectedMediaType: input.asset?.mediaType ?? null,
    byteSize: input.asset?.byteSize ?? null,
    durationSeconds: input.asset?.durationSeconds ?? null,
    checksumSha256: input.asset?.checksumSha256 ?? null,
    transportIntegrityState: input.transportIntegrityState ?? "not_supplied",
    providerAuthenticityState: input.providerAuthenticityState ?? "passed",
    formatPolicyState: input.formatPolicyState ?? "allowed",
    malwareScanState: input.malwareScanState ?? "clean",
    quarantineOutcome: input.outcome,
    manualReviewDispositionRef: input.manualReviewDispositionRef ?? null,
    reasonCodes: uniqueSorted(input.reasonCodes),
    assessedAt: input.at,
    recordedBy: TELEPHONY_RECORDING_INGEST_SERVICE_NAME,
  };
}

function createSettlement(input: {
  readonly job: RecordingFetchJob;
  readonly outcome: AudioIngestSettlementOutcome;
  readonly assessmentRef: string | null;
  readonly objectStorageRef: string | null;
  readonly documentReferenceRef: string | null;
  readonly noOrphanGuarantee: AudioIngestSettlement["noOrphanGuarantee"];
  readonly callSessionEventType: AudioIngestSettlement["callSessionEventType"];
  readonly reasonCodes: readonly string[];
  readonly at: string;
}): AudioIngestSettlement {
  return {
    audioIngestSettlementRef: stableRef("tel_recording_ingest_settlement_190", {
      job: input.job.recordingFetchJobRef,
      outcome: input.outcome,
      assessment: input.assessmentRef,
      object: input.objectStorageRef,
      document: input.documentReferenceRef,
      retryCount: input.outcome === "retry_scheduled" ? input.job.retryCount : "terminal",
    }),
    schemaVersion: TELEPHONY_RECORDING_INGEST_SCHEMA_VERSION,
    recordingFetchJobRef: input.job.recordingFetchJobRef,
    callSessionRef: input.job.callSessionRef,
    providerRecordingRef: input.job.providerRecordingRef,
    quarantineAssessmentRef: input.assessmentRef,
    objectStorageRef: input.objectStorageRef,
    documentReferenceRef: input.documentReferenceRef,
    settlementOutcome: input.outcome,
    noOrphanGuarantee: input.noOrphanGuarantee,
    callSessionEventType: input.callSessionEventType,
    callSessionEventPayloadRef: stableRef("call_session_event_payload_190", {
      job: input.job.recordingFetchJobRef,
      outcome: input.outcome,
    }),
    reasonCodes: uniqueSorted(input.reasonCodes),
    settledAt: input.at,
    recordedBy: TELEPHONY_RECORDING_INGEST_SERVICE_NAME,
  };
}

export function createInMemoryTelephonyRecordingIngestRepository(): TelephonyRecordingIngestRepository {
  const jobsByRef = new Map<string, RecordingFetchJob>();
  const jobsByIdempotency = new Map<string, string>();
  const jobsByProviderRecording = new Map<string, string>();
  const quarantineObjectsByJob = new Map<string, RecordingQuarantineObject>();
  const quarantineAssessmentsByJob = new Map<string, RecordingAssetQuarantineAssessment>();
  const governedObjectsByDuplicateKey = new Map<string, GovernedAudioObject>();
  const governedObjectsByJob = new Map<string, GovernedAudioObject>();
  const documentLinksByRecording = new Map<string, RecordingDocumentReferenceLink>();
  const documentLinksByObject = new Map<string, RecordingDocumentReferenceLink>();
  const settlementsByRef = new Map<string, AudioIngestSettlement>();
  const terminalSettlementsByJob = new Map<string, string>();
  const manualReviewsByJob = new Map<string, TelephonyRecordingManualReviewDisposition>();

  function recordingKey(callSessionRef: string, providerRecordingRef: string): string {
    return `${callSessionRef}::${providerRecordingRef}`;
  }

  function duplicateKey(providerRecordingRef: string, contentDigest: string): string {
    return `${providerRecordingRef}::${contentDigest}`;
  }

  return {
    async getJobByIdempotencyKey(idempotencyKey) {
      const ref = jobsByIdempotency.get(idempotencyKey);
      return ref ? jobsByRef.get(ref) : undefined;
    },
    async getJobByProviderRecordingRef(callSessionRef, providerRecordingRef) {
      const ref = jobsByProviderRecording.get(recordingKey(callSessionRef, providerRecordingRef));
      return ref ? jobsByRef.get(ref) : undefined;
    },
    async getJob(recordingFetchJobRef) {
      return jobsByRef.get(recordingFetchJobRef);
    },
    async saveJob(job) {
      jobsByRef.set(job.recordingFetchJobRef, job);
      jobsByIdempotency.set(job.idempotencyKey, job.recordingFetchJobRef);
      jobsByProviderRecording.set(
        recordingKey(job.callSessionRef, job.providerRecordingRef),
        job.recordingFetchJobRef,
      );
    },
    async listProcessableJobs(limit) {
      return Array.from(jobsByRef.values())
        .filter((job) => !job.terminalOutcomeAt)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .slice(0, limit);
    },
    async saveQuarantineObject(object) {
      quarantineObjectsByJob.set(object.recordingFetchJobRef, object);
    },
    async getQuarantineObject(recordingFetchJobRef) {
      return quarantineObjectsByJob.get(recordingFetchJobRef);
    },
    async saveQuarantineAssessment(assessment) {
      quarantineAssessmentsByJob.set(assessment.recordingFetchJobRef, assessment);
    },
    async getLatestQuarantineAssessment(recordingFetchJobRef) {
      return quarantineAssessmentsByJob.get(recordingFetchJobRef);
    },
    async saveGovernedObject(object) {
      governedObjectsByDuplicateKey.set(
        duplicateKey(object.providerRecordingRef, object.contentDigest),
        object,
      );
      governedObjectsByJob.set(object.recordingFetchJobRef, object);
    },
    async getGovernedObjectByDuplicateKey(providerRecordingRef, contentDigest) {
      return governedObjectsByDuplicateKey.get(duplicateKey(providerRecordingRef, contentDigest));
    },
    async getGovernedObjectForJob(recordingFetchJobRef) {
      return governedObjectsByJob.get(recordingFetchJobRef);
    },
    async saveDocumentReferenceLink(link) {
      documentLinksByRecording.set(
        recordingKey(link.callSessionRef, link.providerRecordingRef),
        link,
      );
      documentLinksByObject.set(link.objectStorageRef, link);
    },
    async getDocumentReferenceLink(callSessionRef, providerRecordingRef) {
      return documentLinksByRecording.get(recordingKey(callSessionRef, providerRecordingRef));
    },
    async getDocumentReferenceLinkForObject(objectStorageRef) {
      return documentLinksByObject.get(objectStorageRef);
    },
    async saveSettlement(settlement) {
      settlementsByRef.set(settlement.audioIngestSettlementRef, settlement);
      if (terminalSettlementOutcomes(settlement)) {
        terminalSettlementsByJob.set(
          settlement.recordingFetchJobRef,
          settlement.audioIngestSettlementRef,
        );
      }
    },
    async getTerminalSettlement(recordingFetchJobRef) {
      const ref = terminalSettlementsByJob.get(recordingFetchJobRef);
      return ref ? settlementsByRef.get(ref) : undefined;
    },
    async saveManualReviewDisposition(disposition) {
      manualReviewsByJob.set(disposition.recordingFetchJobRef, disposition);
    },
    async getManualReviewDisposition(recordingFetchJobRef) {
      return manualReviewsByJob.get(recordingFetchJobRef);
    },
    snapshots() {
      return {
        jobs: Array.from(jobsByRef.values()),
        quarantineObjects: Array.from(quarantineObjectsByJob.values()),
        quarantineAssessments: Array.from(quarantineAssessmentsByJob.values()),
        governedObjects: Array.from(governedObjectsByJob.values()),
        documentReferenceLinks: Array.from(documentLinksByRecording.values()),
        settlements: Array.from(settlementsByRef.values()),
        manualReviewDispositions: Array.from(manualReviewsByJob.values()),
      };
    },
  };
}

export function createInMemoryProviderRecordingAdapter(
  input: InMemoryProviderRecordingAdapterInput = {},
): ProviderRecordingAdapter {
  const assets = new Map<string, ProviderRecordingFixture>();
  for (const asset of input.assets ?? []) {
    assets.set(asset.providerRecordingRef, asset);
  }
  const attemptCounts = new Map<string, number>();

  return {
    async fetchRecording(fetchInput) {
      const currentAttempt = (attemptCounts.get(fetchInput.providerRecordingRef) ?? 0) + 1;
      attemptCounts.set(fetchInput.providerRecordingRef, currentAttempt);
      const script = input.scriptedAvailability?.[fetchInput.providerRecordingRef];
      const scriptedAvailability = script?.[currentAttempt - 1];
      const fixture = assets.get(fetchInput.providerRecordingRef);
      const availability =
        scriptedAvailability ?? (fixture ? ("available" as const) : ("missing" as const));
      const fetchedAt = fetchInput.requestedAt;

      if (availability !== "available" || !fixture) {
        return {
          availability,
          asset: null,
          retryAfterSeconds:
            availability === "delayed" || availability === "provider_unavailable" ? 120 : null,
          reasonCodes: uniqueSorted([
            availability === "delayed"
              ? "REC_190_PROVIDER_RECORDING_DELAYED"
              : availability === "provider_unavailable"
                ? "REC_190_PROVIDER_UNAVAILABLE_RETRYABLE"
                : "REC_190_PROVIDER_RECORDING_MISSING",
          ]),
          fetchedAt,
        };
      }

      const body = toBytes(fixture.body);
      return {
        availability: "available",
        asset: {
          providerRecordingRef: fixture.providerRecordingRef,
          providerCallRef: fixture.providerCallRef ?? fetchInput.callSessionRef,
          assetAvailability: "available",
          mediaType: fixture.mediaType,
          byteSize: body.byteLength,
          durationSeconds: fixture.durationSeconds,
          checksumSha256: fixture.checksumSha256 ?? stableDigest(body),
          body,
          providerAuthenticated: fixture.providerAuthenticated ?? true,
          fetchedAt,
        },
        retryAfterSeconds: null,
        reasonCodes: ["REC_190_PROVIDER_ASSET_FETCHED"],
        fetchedAt,
      };
    },
  };
}

export function createStaticRecordingScanner(
  input: StaticRecordingScannerInput = {},
): RecordingScannerAdapter {
  return {
    async scan(scanInput) {
      const malwareScanState =
        input.verdictByProviderRecordingRef?.[scanInput.providerRecordingRef] ?? "clean";
      return {
        scannerRef: stableRef("recording_scanner_190", {
          job: scanInput.recordingFetchJobRef,
          digest: scanInput.contentDigest,
        }),
        malwareScanState,
        reasonCodes: uniqueSorted([
          malwareScanState === "clean"
            ? "REC_190_SCANNER_CLEAN"
            : malwareScanState === "malware"
              ? "REC_190_SCANNER_MALWARE_BLOCKED"
              : malwareScanState === "scanner_timeout"
                ? "REC_190_SCANNER_TIMEOUT_RETRYABLE_HOLD"
                : "REC_190_SCANNER_UNREADABLE_AUDIO",
        ]),
        scannedAt: scanInput.requestedAt,
      };
    },
  };
}

class TelephonyRecordingIngestServiceImpl implements TelephonyRecordingIngestService {
  constructor(
    private readonly repository: TelephonyRecordingIngestRepository,
    private readonly providerAdapter: ProviderRecordingAdapter,
    private readonly scannerAdapter: RecordingScannerAdapter,
  ) {}

  async scheduleRecordingFetchJob(
    input: ScheduleRecordingFetchJobInput,
  ): Promise<RecordingFetchJob> {
    const existingByIdempotency = await this.repository.getJobByIdempotencyKey(
      input.idempotencyKey,
    );
    if (existingByIdempotency) {
      return existingByIdempotency;
    }
    const existingByProvider = await this.repository.getJobByProviderRecordingRef(
      input.callSessionRef,
      input.providerRecordingRef,
    );
    if (existingByProvider) {
      return existingByProvider;
    }

    const observedAt = input.observedAt ?? nowIso();
    const job: RecordingFetchJob = {
      recordingFetchJobRef: stableRef("tel_recording_fetch_job_190", {
        callSessionRef: input.callSessionRef,
        providerRecordingRef: input.providerRecordingRef,
        canonicalEventRef: input.canonicalEventRef,
      }),
      schemaVersion: TELEPHONY_RECORDING_INGEST_SCHEMA_VERSION,
      policyVersion: TELEPHONY_RECORDING_INGEST_POLICY_VERSION,
      retryPolicyVersion: RECORDING_FETCH_RETRY_POLICY_VERSION,
      callSessionRef: input.callSessionRef,
      providerRecordingRef: input.providerRecordingRef,
      canonicalEventRef: input.canonicalEventRef,
      idempotencyKey: input.idempotencyKey,
      retryCount: 0,
      nextRetryAt: observedAt,
      timeoutPosture: input.timeoutPosture ?? "within_provider_sla",
      currentPhase: "scheduled",
      quarantineAssessmentRef: null,
      objectStorageRef: null,
      documentReferenceRef: null,
      terminalOutcome: "pending",
      terminalOutcomeAt: null,
      reasonCodes: ["REC_190_FETCH_JOB_SCHEDULED"],
      createdAt: observedAt,
      updatedAt: observedAt,
      recordedBy: TELEPHONY_RECORDING_INGEST_SERVICE_NAME,
    };
    await this.repository.saveJob(job);
    return job;
  }

  async drainRecordingFetchJobs(
    input: RecordingFetchWorkerInput,
  ): Promise<RecordingFetchWorkerResult> {
    const at = input.runAt ?? nowIso();
    const jobs = input.recordingFetchJobRef
      ? [
          requireJob(
            await this.repository.getJob(input.recordingFetchJobRef),
            input.recordingFetchJobRef,
          ),
        ]
      : await this.repository.listProcessableJobs(input.maxJobs ?? 10);
    const settlements: AudioIngestSettlement[] = [];

    for (const job of jobs) {
      const settlement = await this.processJob(job, at);
      settlements.push(settlement);
    }

    return {
      workerRunRef: input.workerRunRef,
      processedJobRefs: jobs.map((job) => job.recordingFetchJobRef),
      settlements,
    };
  }

  async getRecordingDocumentReference(input: {
    readonly callSessionRef: string;
    readonly providerRecordingRef: string;
  }): Promise<RecordingDocumentReferenceLink | null> {
    return (
      (await this.repository.getDocumentReferenceLink(
        input.callSessionRef,
        input.providerRecordingRef,
      )) ?? null
    );
  }

  async repairNoOrphanRecordingIngest(input: {
    readonly recordingFetchJobRef: string;
    readonly repairedAt?: string;
  }): Promise<AudioIngestSettlement | null> {
    const job = requireJob(
      await this.repository.getJob(input.recordingFetchJobRef),
      input.recordingFetchJobRef,
    );
    const governedObject = await this.repository.getGovernedObjectForJob(job.recordingFetchJobRef);
    if (!governedObject) {
      return null;
    }
    return this.settleDocumentReferenceLink(job, governedObject, input.repairedAt ?? nowIso(), [
      "REC_190_NO_ORPHAN_REPLAY_REPAIRED_DOCUMENT_REFERENCE",
    ]);
  }

  private async processJob(job: RecordingFetchJob, at: string): Promise<AudioIngestSettlement> {
    const existingTerminalSettlement = await this.repository.getTerminalSettlement(
      job.recordingFetchJobRef,
    );
    if (existingTerminalSettlement) {
      return existingTerminalSettlement;
    }

    const repaired = await this.reconcilePartialProgress(job, at);
    if (repaired) {
      return repaired;
    }

    await this.repository.saveJob({
      ...job,
      currentPhase: "fetch_in_progress",
      updatedAt: at,
      reasonCodes: uniqueSorted([...job.reasonCodes, "REC_190_FETCH_WORKER_STARTED"]),
    });
    const activeJob = requireJob(
      await this.repository.getJob(job.recordingFetchJobRef),
      job.recordingFetchJobRef,
    );

    const fetchResult = await this.providerAdapter.fetchRecording({
      recordingFetchJobRef: activeJob.recordingFetchJobRef,
      callSessionRef: activeJob.callSessionRef,
      providerRecordingRef: activeJob.providerRecordingRef,
      canonicalEventRef: activeJob.canonicalEventRef,
      attemptNumber: activeJob.retryCount + 1,
      requestedAt: at,
    });

    if (
      fetchResult.availability === "delayed" ||
      fetchResult.availability === "provider_unavailable"
    ) {
      return this.scheduleRetry(activeJob, fetchResult, at);
    }

    if (fetchResult.availability !== "available" || !fetchResult.asset) {
      return this.blockMissingRecording(activeJob, fetchResult.reasonCodes, at);
    }

    return this.assessAndSettleFetchedAsset(activeJob, fetchResult.asset, at);
  }

  private async reconcilePartialProgress(
    job: RecordingFetchJob,
    at: string,
  ): Promise<AudioIngestSettlement | null> {
    const governedObject = await this.repository.getGovernedObjectForJob(job.recordingFetchJobRef);
    if (!governedObject) {
      return null;
    }
    const existingLink = await this.repository.getDocumentReferenceLinkForObject(
      governedObject.objectStorageRef,
    );
    if (existingLink) {
      const existingTerminalSettlement = await this.repository.getTerminalSettlement(
        job.recordingFetchJobRef,
      );
      if (existingTerminalSettlement) {
        return existingTerminalSettlement;
      }
      const settlement = createSettlement({
        job: {
          ...job,
          objectStorageRef: governedObject.objectStorageRef,
          documentReferenceRef: existingLink.documentReferenceRef,
        },
        outcome: "governed_audio_ready",
        assessmentRef: job.quarantineAssessmentRef,
        objectStorageRef: governedObject.objectStorageRef,
        documentReferenceRef: existingLink.documentReferenceRef,
        noOrphanGuarantee: "governed_object_has_document_reference",
        callSessionEventType: "recording_available",
        reasonCodes: ["REC_190_REPLAY_RETURNED_SETTLED_DOCUMENT_REFERENCE"],
        at,
      });
      await this.repository.saveSettlement(settlement);
      return settlement;
    }
    return this.settleDocumentReferenceLink(job, governedObject, at, [
      "REC_190_PARTIAL_PROGRESS_GOVERNED_OBJECT_RELINKED",
    ]);
  }

  private async scheduleRetry(
    job: RecordingFetchJob,
    fetchResult: ProviderRecordingFetchResult,
    at: string,
  ): Promise<AudioIngestSettlement> {
    const retryCount = job.retryCount + 1;
    if (retryCount >= recordingFetchTimeoutRetryLaw.maxAttemptsBeforeManualReview) {
      return this.blockMissingRecording(
        job,
        [...fetchResult.reasonCodes, "REC_190_PROVIDER_TIMEOUT_RETRY_LAW_EXHAUSTED"],
        at,
      );
    }
    const retryJob: RecordingFetchJob = {
      ...job,
      retryCount,
      nextRetryAt: fetchResult.retryAfterSeconds
        ? new Date(Date.parse(at) + fetchResult.retryAfterSeconds * 1000).toISOString()
        : nextRetryAt(at, retryCount),
      timeoutPosture: "retry_backoff_active",
      currentPhase: "fetch_pending",
      terminalOutcome: "pending",
      terminalOutcomeAt: null,
      reasonCodes: uniqueSorted([...job.reasonCodes, ...fetchResult.reasonCodes]),
      updatedAt: at,
    };
    await this.repository.saveJob(retryJob);
    const settlement = createSettlement({
      job: retryJob,
      outcome: "retry_scheduled",
      assessmentRef: null,
      objectStorageRef: null,
      documentReferenceRef: null,
      noOrphanGuarantee: "retry_without_storage",
      callSessionEventType: "recording_fetch_retry_scheduled",
      reasonCodes: retryJob.reasonCodes,
      at,
    });
    await this.repository.saveSettlement(settlement);
    return settlement;
  }

  private async blockMissingRecording(
    job: RecordingFetchJob,
    reasonCodes: readonly string[],
    at: string,
  ): Promise<AudioIngestSettlement> {
    const disposition = await this.ensureManualReviewDisposition(job, {
      triggerClass: "recording_missing",
      reviewMode: "callback_required",
      reasonCodes: [...reasonCodes, "REC_190_RECORDING_MISSING_MANUAL_REVIEW"],
      at,
    });
    const assessment = createBlockedAssessment({
      job,
      outcome: "blocked_missing",
      reasonCodes: [...reasonCodes, "REC_190_NO_GOVERNED_OBJECT_FOR_MISSING_RECORDING"],
      at,
      manualReviewDispositionRef: disposition.manualReviewDispositionRef,
      providerAuthenticityState: "passed",
      formatPolicyState: "allowed",
      malwareScanState: "clean",
    });
    await this.repository.saveQuarantineAssessment(assessment);
    const blockedJob: RecordingFetchJob = {
      ...job,
      timeoutPosture: "terminal",
      currentPhase: "terminal_blocked",
      quarantineAssessmentRef: assessment.quarantineAssessmentRef,
      terminalOutcome: "recording_missing",
      terminalOutcomeAt: at,
      reasonCodes: uniqueSorted([...job.reasonCodes, ...assessment.reasonCodes]),
      updatedAt: at,
    };
    await this.repository.saveJob(blockedJob);
    const settlement = createSettlement({
      job: blockedJob,
      outcome: "recording_missing",
      assessmentRef: assessment.quarantineAssessmentRef,
      objectStorageRef: null,
      documentReferenceRef: null,
      noOrphanGuarantee: "quarantine_only_no_governed_object",
      callSessionEventType: "manual_followup_requested",
      reasonCodes: blockedJob.reasonCodes,
      at,
    });
    await this.repository.saveSettlement(settlement);
    return settlement;
  }

  private async assessAndSettleFetchedAsset(
    job: RecordingFetchJob,
    asset: ProviderRecordingAsset,
    at: string,
  ): Promise<AudioIngestSettlement> {
    const contentDigest = stableDigest(asset.body);
    const quarantineObject: RecordingQuarantineObject = {
      quarantineObjectRef: stableRef("tel_recording_quarantine_object_190", {
        job: job.recordingFetchJobRef,
        digest: contentDigest,
      }),
      recordingFetchJobRef: job.recordingFetchJobRef,
      callSessionRef: job.callSessionRef,
      providerRecordingRef: job.providerRecordingRef,
      byteSize: asset.byteSize,
      contentDigest,
      mediaType: asset.mediaType,
      createdAt: at,
    };
    await this.repository.saveQuarantineObject(quarantineObject);
    const fetchedJob: RecordingFetchJob = {
      ...job,
      currentPhase: "fetched_to_quarantine",
      nextRetryAt: null,
      reasonCodes: uniqueSorted([...job.reasonCodes, "REC_190_ASSET_WRITTEN_TO_QUARANTINE"]),
      updatedAt: at,
    };
    await this.repository.saveJob(fetchedJob);

    const assessment = await this.assessQuarantine(fetchedJob, asset, quarantineObject, at);
    await this.repository.saveQuarantineAssessment(assessment);
    const assessedJob: RecordingFetchJob = {
      ...fetchedJob,
      currentPhase: "quarantine_assessed",
      quarantineAssessmentRef: assessment.quarantineAssessmentRef,
      reasonCodes: uniqueSorted([...fetchedJob.reasonCodes, ...assessment.reasonCodes]),
      updatedAt: at,
    };
    await this.repository.saveJob(assessedJob);

    if (assessment.quarantineOutcome !== "clean") {
      return this.blockUnusableAudio(assessedJob, assessment, at);
    }

    const governedObject = await this.promoteToGovernedObject(
      assessedJob,
      asset,
      quarantineObject,
      contentDigest,
      at,
    );
    return this.settleDocumentReferenceLink(assessedJob, governedObject, at, [
      "REC_190_GOVERNED_AUDIO_READY",
    ]);
  }

  private async assessQuarantine(
    job: RecordingFetchJob,
    asset: ProviderRecordingAsset,
    quarantineObject: RecordingQuarantineObject,
    at: string,
  ): Promise<RecordingAssetQuarantineAssessment> {
    const transportIntegrityState = computeTransportIntegrity(asset);
    const providerAuthenticityState = asset.providerAuthenticated ? "passed" : "failed";
    const sizeOrDurationExceeded =
      asset.byteSize > recordingAudioFormatPolicy.maxByteSize ||
      asset.durationSeconds > recordingAudioFormatPolicy.hardMaxDurationSeconds;
    const formatPolicyState: RecordingFormatPolicyState = sizeOrDurationExceeded
      ? "size_or_duration_exceeded"
      : isAllowedRecordingMediaType(asset.mediaType)
        ? "allowed"
        : "unsupported";
    const providerRefMatches = asset.providerRecordingRef === job.providerRecordingRef;

    if (!providerRefMatches) {
      return createBlockedAssessment({
        job,
        outcome: "blocked_provider_ref_mismatch",
        reasonCodes: ["REC_190_PROVIDER_RECORDING_REF_MISMATCH_BLOCKED"],
        at,
        quarantineObjectRef: quarantineObject.quarantineObjectRef,
        asset,
        transportIntegrityState,
        providerAuthenticityState,
        formatPolicyState,
        malwareScanState: "clean",
      });
    }

    if (providerAuthenticityState === "failed" || transportIntegrityState === "failed") {
      return createBlockedAssessment({
        job,
        outcome: "blocked_integrity",
        reasonCodes: [
          providerAuthenticityState === "failed"
            ? "REC_190_PROVIDER_AUTHENTICITY_FAILED"
            : "REC_190_TRANSPORT_CHECKSUM_FAILED",
        ],
        at,
        quarantineObjectRef: quarantineObject.quarantineObjectRef,
        asset,
        transportIntegrityState,
        providerAuthenticityState,
        formatPolicyState,
        malwareScanState: "clean",
      });
    }

    if (formatPolicyState === "unsupported") {
      return createBlockedAssessment({
        job,
        outcome: "blocked_unsupported_format",
        reasonCodes: ["REC_190_AUDIO_FORMAT_UNSUPPORTED"],
        at,
        quarantineObjectRef: quarantineObject.quarantineObjectRef,
        asset,
        transportIntegrityState,
        providerAuthenticityState,
        formatPolicyState,
        malwareScanState: "clean",
      });
    }

    if (formatPolicyState === "size_or_duration_exceeded") {
      return createBlockedAssessment({
        job,
        outcome: "blocked_size_duration",
        reasonCodes: ["REC_190_AUDIO_SIZE_OR_DURATION_EXCEEDED"],
        at,
        quarantineObjectRef: quarantineObject.quarantineObjectRef,
        asset,
        transportIntegrityState,
        providerAuthenticityState,
        formatPolicyState,
        malwareScanState: "clean",
      });
    }

    const scanResult = await this.scannerAdapter.scan({
      recordingFetchJobRef: job.recordingFetchJobRef,
      callSessionRef: job.callSessionRef,
      providerRecordingRef: job.providerRecordingRef,
      quarantineObjectRef: quarantineObject.quarantineObjectRef,
      contentDigest: quarantineObject.contentDigest,
      mediaType: asset.mediaType,
      byteSize: asset.byteSize,
      durationSeconds: asset.durationSeconds,
      requestedAt: at,
    });

    if (scanResult.malwareScanState !== "clean") {
      return createBlockedAssessment({
        job,
        outcome:
          scanResult.malwareScanState === "scanner_timeout" ? "retryable_hold" : "blocked_malware",
        reasonCodes: scanResult.reasonCodes,
        at,
        quarantineObjectRef: quarantineObject.quarantineObjectRef,
        asset,
        transportIntegrityState,
        providerAuthenticityState,
        formatPolicyState,
        malwareScanState: scanResult.malwareScanState,
      });
    }

    return createBlockedAssessment({
      job,
      outcome: "clean",
      reasonCodes: ["REC_190_QUARANTINE_SCAN_CLEAN"],
      at,
      quarantineObjectRef: quarantineObject.quarantineObjectRef,
      asset,
      transportIntegrityState,
      providerAuthenticityState,
      formatPolicyState,
      malwareScanState: "clean",
    });
  }

  private async blockUnusableAudio(
    job: RecordingFetchJob,
    assessment: RecordingAssetQuarantineAssessment,
    at: string,
  ): Promise<AudioIngestSettlement> {
    const triggerClass =
      assessment.quarantineOutcome === "blocked_missing" ? "recording_missing" : "unusable_audio";
    const disposition = await this.ensureManualReviewDisposition(job, {
      triggerClass,
      reviewMode:
        assessment.quarantineOutcome === "retryable_hold" ? "audio_review" : "staff_transcription",
      reasonCodes: [...assessment.reasonCodes, "REC_190_UNUSABLE_AUDIO_MANUAL_REVIEW"],
      at,
    });
    const linkedAssessment: RecordingAssetQuarantineAssessment = {
      ...assessment,
      manualReviewDispositionRef: disposition.manualReviewDispositionRef,
      reasonCodes: uniqueSorted([
        ...assessment.reasonCodes,
        "REC_190_UNUSABLE_AUDIO_MANUAL_REVIEW",
      ]),
    };
    await this.repository.saveQuarantineAssessment(linkedAssessment);
    const terminalOutcome = this.terminalOutcomeForAssessment(linkedAssessment);
    const blockedJob: RecordingFetchJob = {
      ...job,
      currentPhase: "terminal_blocked",
      terminalOutcome,
      terminalOutcomeAt: at,
      reasonCodes: uniqueSorted([
        ...job.reasonCodes,
        ...linkedAssessment.reasonCodes,
        disposition.manualReviewDispositionRef,
      ]),
      updatedAt: at,
    };
    await this.repository.saveJob(blockedJob);
    const settlement = createSettlement({
      job: blockedJob,
      outcome:
        terminalOutcome === "recording_missing"
          ? "recording_missing"
          : "manual_audio_review_required",
      assessmentRef: linkedAssessment.quarantineAssessmentRef,
      objectStorageRef: null,
      documentReferenceRef: null,
      noOrphanGuarantee: "quarantine_only_no_governed_object",
      callSessionEventType: "manual_followup_requested",
      reasonCodes: blockedJob.reasonCodes,
      at,
    });
    await this.repository.saveSettlement(settlement);
    return settlement;
  }

  private terminalOutcomeForAssessment(
    assessment: RecordingAssetQuarantineAssessment,
  ): RecordingFetchTerminalOutcome {
    switch (assessment.quarantineOutcome) {
      case "blocked_missing":
        return "recording_missing";
      case "blocked_integrity":
        return "corrupt_or_integrity_failed";
      case "blocked_unsupported_format":
        return "unsupported_format";
      case "blocked_size_duration":
        return "size_or_duration_exceeded";
      case "blocked_provider_ref_mismatch":
        return "provider_ref_mismatch";
      case "blocked_malware":
      case "retryable_hold":
        return "malware_or_scan_blocked";
      case "clean":
        return "pending";
    }
  }

  private async promoteToGovernedObject(
    job: RecordingFetchJob,
    asset: ProviderRecordingAsset,
    quarantineObject: RecordingQuarantineObject,
    contentDigest: string,
    at: string,
  ): Promise<GovernedAudioObject> {
    const existing = await this.repository.getGovernedObjectByDuplicateKey(
      job.providerRecordingRef,
      contentDigest,
    );
    if (existing) {
      await this.repository.saveJob({
        ...job,
        currentPhase: "governed_storage_settled",
        objectStorageRef: existing.objectStorageRef,
        reasonCodes: uniqueSorted([
          ...job.reasonCodes,
          "REC_190_DUPLICATE_ASSET_REUSED_EXISTING_GOVERNED_OBJECT",
        ]),
        updatedAt: at,
      });
      return existing;
    }

    const object: GovernedAudioObject = {
      objectStorageRef: stableRef("tel_recording_governed_object_190", {
        providerRecordingRef: job.providerRecordingRef,
        contentDigest,
      }),
      canonicalObjectRef: `governed-audio://${stableDigest(
        `${job.providerRecordingRef}::${contentDigest}`,
      ).slice(0, 32)}`,
      recordingFetchJobRef: job.recordingFetchJobRef,
      callSessionRef: job.callSessionRef,
      providerRecordingRef: job.providerRecordingRef,
      quarantineObjectRef: quarantineObject.quarantineObjectRef,
      storageClass: "governed_audio",
      retentionClass: "clinical_audio_evidence",
      encryptionKeyLineageRef: stableRef("kms_audio_lineage_190", {
        callSessionRef: job.callSessionRef,
      }),
      contentDigest,
      byteSize: asset.byteSize,
      durationSeconds: asset.durationSeconds,
      mediaType: asset.mediaType,
      disclosureClass: "clinical_evidence_audio",
      duplicateAssetDetectionRef: stableRef("duplicate_asset_detection_190", {
        providerRecordingRef: job.providerRecordingRef,
        contentDigest,
      }),
      ingestedAt: at,
    };
    await this.repository.saveGovernedObject(object);
    await this.repository.saveJob({
      ...job,
      currentPhase: "governed_storage_settled",
      objectStorageRef: object.objectStorageRef,
      reasonCodes: uniqueSorted([...job.reasonCodes, "REC_190_AUDIO_PROMOTED_TO_GOVERNED_STORAGE"]),
      updatedAt: at,
    });
    return object;
  }

  private async settleDocumentReferenceLink(
    job: RecordingFetchJob,
    governedObject: GovernedAudioObject,
    at: string,
    extraReasonCodes: readonly string[],
  ): Promise<AudioIngestSettlement> {
    const existingLink = await this.repository.getDocumentReferenceLink(
      job.callSessionRef,
      job.providerRecordingRef,
    );
    const link =
      existingLink ??
      ({
        documentReferenceLinkRef: stableRef("tel_recording_document_link_190", {
          callSessionRef: job.callSessionRef,
          providerRecordingRef: job.providerRecordingRef,
          objectStorageRef: governedObject.objectStorageRef,
        }),
        schemaVersion: TELEPHONY_RECORDING_INGEST_SCHEMA_VERSION,
        documentReferenceRef: stableRef("DocumentReference", {
          callSessionRef: job.callSessionRef,
          providerRecordingRef: job.providerRecordingRef,
          contentDigest: governedObject.contentDigest,
        }),
        documentReferenceLogicalId: `docref_recording_${stableDigest(
          `${job.callSessionRef}::${job.providerRecordingRef}::${governedObject.contentDigest}`,
        ).slice(0, 16)}`,
        representationSetRef: `fhir_set_recording_${stableDigest(job.callSessionRef).slice(0, 16)}`,
        documentReferenceRecordRef: stableRef("fhir_record_document_reference_190", {
          providerRecordingRef: job.providerRecordingRef,
          objectStorageRef: governedObject.objectStorageRef,
        }),
        callSessionRef: job.callSessionRef,
        providerRecordingRef: job.providerRecordingRef,
        objectStorageRef: governedObject.objectStorageRef,
        canonicalObjectRef: governedObject.canonicalObjectRef,
        contentDigest: governedObject.contentDigest,
        mediaType: governedObject.mediaType,
        byteSize: governedObject.byteSize,
        durationSeconds: governedObject.durationSeconds,
        artifactUrl: `artifact://recording-audio/${governedObject.objectStorageRef}`,
        sourceAggregateRefs: [
          job.callSessionRef,
          job.recordingFetchJobRef,
          governedObject.objectStorageRef,
        ],
        linkedAt: at,
        recordedBy: TELEPHONY_RECORDING_INGEST_SERVICE_NAME,
      } satisfies RecordingDocumentReferenceLink);

    if (!existingLink) {
      await this.repository.saveDocumentReferenceLink(link);
    }

    const terminalJob: RecordingFetchJob = {
      ...job,
      currentPhase: "terminal_succeeded",
      objectStorageRef: governedObject.objectStorageRef,
      documentReferenceRef: link.documentReferenceRef,
      terminalOutcome: "succeeded",
      terminalOutcomeAt: at,
      reasonCodes: uniqueSorted([
        ...job.reasonCodes,
        ...extraReasonCodes,
        existingLink
          ? "REC_190_DOCUMENT_REFERENCE_REUSED_EXACT_ONCE"
          : "REC_190_DOCUMENT_REFERENCE_CREATED_EXACT_ONCE",
      ]),
      updatedAt: at,
      timeoutPosture: "terminal",
    };
    await this.repository.saveJob(terminalJob);
    const settlement = createSettlement({
      job: terminalJob,
      outcome: "governed_audio_ready",
      assessmentRef: terminalJob.quarantineAssessmentRef,
      objectStorageRef: governedObject.objectStorageRef,
      documentReferenceRef: link.documentReferenceRef,
      noOrphanGuarantee: "governed_object_has_document_reference",
      callSessionEventType: "recording_available",
      reasonCodes: terminalJob.reasonCodes,
      at,
    });
    await this.repository.saveSettlement(settlement);
    return settlement;
  }

  private async ensureManualReviewDisposition(
    job: RecordingFetchJob,
    input: {
      readonly triggerClass: TelephonyRecordingManualReviewDisposition["triggerClass"];
      readonly reviewMode: TelephonyRecordingManualReviewDisposition["reviewMode"];
      readonly reasonCodes: readonly string[];
      readonly at: string;
    },
  ): Promise<TelephonyRecordingManualReviewDisposition> {
    const existing = await this.repository.getManualReviewDisposition(job.recordingFetchJobRef);
    if (existing) {
      return existing;
    }
    const disposition = createManualReviewDisposition({
      job,
      triggerClass: input.triggerClass,
      reviewMode: input.reviewMode,
      reasonCodes: input.reasonCodes,
      at: input.at,
    });
    await this.repository.saveManualReviewDisposition(disposition);
    return disposition;
  }
}

export function createTelephonyRecordingIngestApplication(
  input: CreateTelephonyRecordingIngestApplicationInput,
): TelephonyRecordingIngestApplication {
  const repository = input.repository ?? createInMemoryTelephonyRecordingIngestRepository();
  const scannerAdapter = input.scannerAdapter ?? createStaticRecordingScanner();
  return {
    service: new TelephonyRecordingIngestServiceImpl(
      repository,
      input.providerAdapter,
      scannerAdapter,
    ),
    repository,
    persistenceTables: recordingIngestPersistenceTables,
    migrationPlanRefs: recordingIngestMigrationPlanRefs,
    gapResolutions: recordingIngestGapResolutions,
    formatPolicy: recordingAudioFormatPolicy,
    retryLaw: recordingFetchTimeoutRetryLaw,
  };
}
