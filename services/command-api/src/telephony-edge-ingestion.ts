import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import {
  createIdentityAuditAndMaskingService,
  createInMemoryIdentityAuditAndMaskingRepository,
  type IdentityAuditAndMaskingService,
} from "./identity-audit-and-masking";

export const TELEPHONY_EDGE_SERVICE_NAME = "TelephonyEdgeService";
export const TELEPHONY_WEBHOOK_WORKER_SERVICE_NAME = "TelephonyWebhookWorker";
export const TELEPHONY_EDGE_SCHEMA_VERSION = "187.phase2.telephony-edge.v1";
export const TELEPHONY_EDGE_NORMALIZER_VERSION = "telephony-edge-normalizer-187.v1";
export const TELEPHONY_EDGE_SIGNATURE_POLICY_VERSION = "telephony-edge-signature-hmac-sha256-v1";

export const telephonyEdgePersistenceTables = [
  "phase2_telephony_provider_adapter_contracts",
  "phase2_telephony_raw_webhook_receipts",
  "phase2_telephony_normalized_events",
  "phase2_telephony_ingestion_idempotency_records",
  "phase2_telephony_disorder_buffer_entries",
  "phase2_telephony_call_session_bootstrap_records",
  "phase2_telephony_webhook_worker_outbox",
] as const;

export const telephonyEdgeMigrationPlanRefs = [
  "services/command-api/migrations/102_phase2_telephony_edge_ingestion.sql",
] as const;

export const telephonyEdgeGapClosures = [
  "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_VENDOR_PAYLOAD_LEAKAGE_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_UNSIGNED_CALLBACK_TRUST_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_DUPLICATE_CALLBACK_SIDE_EFFECTS_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_OUT_OF_ORDER_BLINDNESS_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_REPLAY_PATH_V1",
] as const;

export const TELEPHONY_EDGE_REASON_CODES = [
  "TEL_EDGE_187_SIGNATURE_VALIDATED",
  "TEL_EDGE_187_SIGNATURE_REJECTED",
  "TEL_EDGE_187_RAW_RECEIPT_QUARANTINED",
  "TEL_EDGE_187_VENDOR_PAYLOAD_STOPPED_AT_EDGE",
  "TEL_EDGE_187_CANONICAL_EVENT_NORMALIZED",
  "TEL_EDGE_187_IDEMPOTENCY_ACCEPTED",
  "TEL_EDGE_187_DUPLICATE_REPLAY_COLLAPSED",
  "TEL_EDGE_187_IDEMPOTENCY_COLLISION_REJECTED",
  "TEL_EDGE_187_OUT_OF_ORDER_BUFFERED",
  "TEL_EDGE_187_OUT_OF_ORDER_REPLAYED",
  "TEL_EDGE_187_CALL_SESSION_BOOTSTRAPPED",
  "TEL_EDGE_187_CALL_SESSION_ADVANCED",
  "TEL_EDGE_187_CALL_SESSION_TERMINAL_PRESERVED",
  "TEL_EDGE_187_URGENT_ASSESSMENT_OPENED",
  "TEL_EDGE_187_RECORDING_REF_ONLY",
  "TEL_EDGE_187_PROVIDER_ERROR_NORMALIZED",
] as const;

export type TelephonyEdgeReasonCode = (typeof TELEPHONY_EDGE_REASON_CODES)[number];
export type TelephonyProviderRef = "telephony_provider_simulator";
export type TelephonyIngressSource = "webhook" | "polling" | "simulator";
export type TelephonyWebhookValidationState = "validated" | "signature_failed";
export type TelephonyReplayDisposition =
  | "accepted"
  | "duplicate_replayed"
  | "idempotency_collision_rejected";
export type TelephonyWebhookOutboxState = "pending" | "applied" | "buffered" | "failed";
export type TelephonyDisorderBufferState = "waiting_for_call_started" | "replayed" | "superseded";
export type TelephonyRawReceiptRetentionClass = "edge_quarantine_short_retention";
export type TelephonyPayloadStorageRule = "normalization_boundary_only";
export type TelephonyPayloadDisclosureBoundary = "provider_payload_shape_stops_at_normalizer";

export type TelephonyProviderEventFamily =
  | "provider_call_started"
  | "provider_menu_input"
  | "provider_identity_input"
  | "provider_recording_expected"
  | "provider_recording_available"
  | "provider_recording_timeout"
  | "provider_transcript_ready"
  | "provider_transcript_failed"
  | "provider_call_abandoned"
  | "provider_error"
  | "provider_continuation_delivery";

export type TelephonyCanonicalEventType =
  | "call_started"
  | "menu_selection_captured"
  | "identity_capture_started"
  | "identity_resolved"
  | "identity_partial"
  | "identity_failed"
  | "recording_expected"
  | "recording_available"
  | "recording_missing"
  | "audio_quarantined"
  | "transcript_job_queued"
  | "transcript_ready"
  | "transcript_degraded"
  | "evidence_readiness_assessed"
  | "urgent_live_preempted"
  | "continuation_eligibility_settled"
  | "continuation_sent"
  | "request_seeded"
  | "submission_promoted"
  | "call_closed"
  | "call_abandoned"
  | "provider_error_recorded"
  | "manual_review_opened"
  | "manual_followup_opened";

export type TelephonyIdempotencyKeyBasis =
  | "provider_event_id_plus_call_session"
  | "provider_call_id_plus_event_type_plus_occurred_at"
  | "polling_resource_version_plus_call_session"
  | "payload_digest_plus_call_session";

export type TelephonyMenuSelection = "symptoms" | "medications" | "admin" | "results" | "unknown";

export type TelephonyCallState =
  | "initiated"
  | "menu_selected"
  | "identity_in_progress"
  | "identity_resolved"
  | "identity_partial"
  | "recording_expected"
  | "recording_available"
  | "evidence_preparing"
  | "evidence_pending"
  | "urgent_live_only"
  | "continuation_eligible"
  | "evidence_ready"
  | "continuation_sent"
  | "request_seeded"
  | "submitted"
  | "closed"
  | "identity_failed"
  | "abandoned"
  | "provider_error"
  | "manual_followup_required"
  | "manual_audio_review_required"
  | "recording_missing"
  | "transcript_degraded";

export interface TelephonyProviderAdapterContract {
  readonly providerAdapterContractRef: string;
  readonly providerRef: TelephonyProviderRef;
  readonly adapterMode: "simulator_backed";
  readonly signatureHeaderName: "x-vecells-simulator-signature";
  readonly timestampHeaderName: "x-vecells-simulator-timestamp";
  readonly signatureAlgorithm: "hmac-sha256";
  readonly acknowledgementMode: "empty_fast_ack";
  readonly rawPayloadBoundary: TelephonyPayloadDisclosureBoundary;
  readonly policyVersion: typeof TELEPHONY_EDGE_SIGNATURE_POLICY_VERSION;
  readonly createdByAuthority: typeof TELEPHONY_EDGE_SERVICE_NAME;
}

export interface TelephonyWebhookValidationResult {
  readonly validationState: TelephonyWebhookValidationState;
  readonly providerRef: TelephonyProviderRef;
  readonly signatureKeyVersionRef: string;
  readonly reasonCodes: readonly TelephonyEdgeReasonCode[];
}

export interface TelephonyRawWebhookReceipt {
  readonly rawReceiptRef: string;
  readonly providerRef: TelephonyProviderRef;
  readonly receivedAt: string;
  readonly sourceIpRef: string | null;
  readonly requestUrl: string;
  readonly headerDigest: string;
  readonly payloadDigest: string;
  readonly rawPayload: string;
  readonly rawPayloadQuarantineRef: string;
  readonly retentionClass: TelephonyRawReceiptRetentionClass;
  readonly validationState: TelephonyWebhookValidationState;
  readonly signatureKeyVersionRef: string;
  readonly disclosureBoundary: TelephonyPayloadDisclosureBoundary;
  readonly reasonCodes: readonly TelephonyEdgeReasonCode[];
  readonly createdByAuthority: typeof TELEPHONY_EDGE_SERVICE_NAME;
}

export interface TelephonyNormalizedPayload {
  readonly menuSelection?: TelephonyMenuSelection;
  readonly maskedCallerRef?: string;
  readonly maskedCallerFragment?: string;
  readonly recordingArtifactRef?: string;
  readonly recordingJobRef?: string;
  readonly providerErrorRef?: string;
  readonly providerStatusClass?: string;
  readonly reasonCodes: readonly string[];
}

export interface NormalizedTelephonyEvent {
  readonly schemaVersion: typeof TELEPHONY_EDGE_SCHEMA_VERSION;
  readonly canonicalEventId: string;
  readonly providerEventFamily: TelephonyProviderEventFamily;
  readonly canonicalEventType: TelephonyCanonicalEventType;
  readonly ingressSource: TelephonyIngressSource;
  readonly providerRef: TelephonyProviderRef;
  readonly providerCallRef: string;
  readonly providerEventRef: string;
  readonly providerPayloadRef: string;
  readonly payloadDigest: string;
  readonly payloadStorageRule: TelephonyPayloadStorageRule;
  readonly payloadDisclosureBoundary: TelephonyPayloadDisclosureBoundary;
  readonly idempotencyKeyBasis: TelephonyIdempotencyKeyBasis;
  readonly idempotencyKey: string;
  readonly callSessionRef: string;
  readonly sequence: number | null;
  readonly edgeCorrelationId: string;
  readonly occurredAt: string;
  readonly normalizedAt: string;
  readonly normalizerVersionRef: typeof TELEPHONY_EDGE_NORMALIZER_VERSION;
  readonly normalizedPayload: TelephonyNormalizedPayload;
  readonly createdByAuthority: typeof TELEPHONY_EDGE_SERVICE_NAME;
}

export interface TelephonyIngestionIdempotencyRecord {
  readonly idempotencyRecordRef: string;
  readonly idempotencyKey: string;
  readonly callSessionRef: string;
  readonly canonicalEventType: TelephonyCanonicalEventType;
  readonly canonicalEventRef: string;
  readonly payloadDigest: string;
  readonly firstRawReceiptRef: string;
  readonly replayDisposition: TelephonyReplayDisposition;
  readonly firstAcceptedAt: string;
  readonly duplicateCount: number;
  readonly reasonCodes: readonly TelephonyEdgeReasonCode[];
  readonly createdByAuthority: typeof TELEPHONY_EDGE_SERVICE_NAME;
}

export interface TelephonyWebhookWorkerOutboxEntry {
  readonly outboxEntryRef: string;
  readonly canonicalEventRef: string;
  readonly callSessionRef: string;
  readonly orderingKey: string;
  readonly dispatchState: TelephonyWebhookOutboxState;
  readonly createdAt: string;
  readonly appliedAt: string | null;
  readonly reasonCodes: readonly TelephonyEdgeReasonCode[];
  readonly createdByAuthority: typeof TELEPHONY_WEBHOOK_WORKER_SERVICE_NAME;
}

export interface TelephonyDisorderBufferEntry {
  readonly disorderBufferEntryRef: string;
  readonly canonicalEventRef: string;
  readonly callSessionRef: string;
  readonly canonicalEventType: TelephonyCanonicalEventType;
  readonly bufferState: TelephonyDisorderBufferState;
  readonly bufferedReasonCode: TelephonyEdgeReasonCode;
  readonly bufferedAt: string;
  readonly replayedAt: string | null;
  readonly createdByAuthority: typeof TELEPHONY_WEBHOOK_WORKER_SERVICE_NAME;
}

export interface TelephonyEdgeCallSession {
  readonly callSessionRef: string;
  readonly providerCallRef: string;
  readonly callState: TelephonyCallState;
  readonly menuSelection: TelephonyMenuSelection | null;
  readonly maskedCallerRef: string | null;
  readonly maskedCallerFragment: string | null;
  readonly recordingRefs: readonly string[];
  readonly urgentLiveAssessmentRef: string;
  readonly firstEventRef: string;
  readonly lastEventRef: string;
  readonly stateRevision: number;
  readonly reasonCodes: readonly TelephonyEdgeReasonCode[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByAuthority: typeof TELEPHONY_WEBHOOK_WORKER_SERVICE_NAME;
}

export interface TelephonyProviderAdapter {
  readonly contract: TelephonyProviderAdapterContract;
  validateWebhook(input: {
    readonly headers: Record<string, string>;
    readonly rawBody: string;
    readonly receivedAt: string;
  }): TelephonyWebhookValidationResult;
  normalizeWebhook(input: {
    readonly headers: Record<string, string>;
    readonly rawBody: string;
    readonly rawReceipt: TelephonyRawWebhookReceipt;
    readonly receivedAt: string;
    readonly maskingService: Pick<IdentityAuditAndMaskingService, "redactIdentityPayload">;
  }): NormalizedTelephonyEventDraft;
}

export interface NormalizedTelephonyEventDraft {
  readonly providerEventFamily: TelephonyProviderEventFamily;
  readonly canonicalEventType: TelephonyCanonicalEventType;
  readonly ingressSource: TelephonyIngressSource;
  readonly providerRef: TelephonyProviderRef;
  readonly providerCallRef: string;
  readonly providerEventRef: string;
  readonly idempotencyKeyBasis: TelephonyIdempotencyKeyBasis;
  readonly idempotencySemanticKey: string;
  readonly callSessionRef: string;
  readonly sequence: number | null;
  readonly edgeCorrelationId: string;
  readonly occurredAt: string;
  readonly normalizedPayload: TelephonyNormalizedPayload;
}

export interface ReceiveTelephonyWebhookInput {
  readonly providerRef?: TelephonyProviderRef;
  readonly requestUrl: string;
  readonly headers: Record<string, string>;
  readonly rawBody: string;
  readonly receivedAt?: string;
  readonly sourceIpRef?: string | null;
}

export interface TelephonyWebhookAck {
  readonly statusCode: 204 | 401 | 409;
  readonly body: null;
  readonly queuedForWorker: boolean;
  readonly responseMode: "empty_fast_ack";
}

export interface ReceiveTelephonyWebhookResult {
  readonly acknowledgement: TelephonyWebhookAck;
  readonly validation: TelephonyWebhookValidationResult;
  readonly rawReceiptRef: string;
  readonly replayDisposition: TelephonyReplayDisposition;
  readonly normalizedEvent: NormalizedTelephonyEvent | null;
  readonly outboxEntry: TelephonyWebhookWorkerOutboxEntry | null;
  readonly reasonCodes: readonly TelephonyEdgeReasonCode[];
}

export interface TelephonyWebhookWorkerResult {
  readonly canonicalEventRef: string;
  readonly callSessionRef: string;
  readonly outboxEntryRef: string;
  readonly dispatchState: TelephonyWebhookOutboxState;
  readonly callSession: TelephonyEdgeCallSession | null;
  readonly replayedBufferedEventRefs: readonly string[];
  readonly reasonCodes: readonly TelephonyEdgeReasonCode[];
}

export interface TelephonyEdgeRepository {
  saveAdapterContract(contract: TelephonyProviderAdapterContract): Promise<void>;
  saveRawReceipt(receipt: TelephonyRawWebhookReceipt): Promise<void>;
  saveNormalizedEvent(event: NormalizedTelephonyEvent): Promise<void>;
  getNormalizedEvent(canonicalEventRef: string): Promise<NormalizedTelephonyEvent | undefined>;
  findIdempotencyRecord(
    idempotencyKey: string,
  ): Promise<TelephonyIngestionIdempotencyRecord | undefined>;
  saveIdempotencyRecord(record: TelephonyIngestionIdempotencyRecord): Promise<void>;
  incrementDuplicateCount(idempotencyKey: string): Promise<void>;
  saveOutboxEntry(entry: TelephonyWebhookWorkerOutboxEntry): Promise<void>;
  listPendingOutboxEntries(): Promise<readonly TelephonyWebhookWorkerOutboxEntry[]>;
  updateOutboxEntry(input: {
    readonly outboxEntryRef: string;
    readonly dispatchState: TelephonyWebhookOutboxState;
    readonly appliedAt: string | null;
    readonly reasonCodes: readonly TelephonyEdgeReasonCode[];
  }): Promise<void>;
  findCallSession(callSessionRef: string): Promise<TelephonyEdgeCallSession | undefined>;
  saveCallSession(session: TelephonyEdgeCallSession): Promise<void>;
  saveDisorderBufferEntry(entry: TelephonyDisorderBufferEntry): Promise<void>;
  listBufferedEvents(callSessionRef: string): Promise<readonly TelephonyDisorderBufferEntry[]>;
  markDisorderBufferReplayed(input: {
    readonly disorderBufferEntryRef: string;
    readonly replayedAt: string;
  }): Promise<void>;
  snapshots?(): TelephonyEdgeRepositorySnapshot;
}

export interface TelephonyEdgeRepositorySnapshot {
  readonly adapterContracts: readonly TelephonyProviderAdapterContract[];
  readonly rawReceipts: readonly TelephonyRawWebhookReceipt[];
  readonly normalizedEvents: readonly NormalizedTelephonyEvent[];
  readonly idempotencyRecords: readonly TelephonyIngestionIdempotencyRecord[];
  readonly outboxEntries: readonly TelephonyWebhookWorkerOutboxEntry[];
  readonly callSessions: readonly TelephonyEdgeCallSession[];
  readonly disorderBufferEntries: readonly TelephonyDisorderBufferEntry[];
}

export interface TelephonyEdgeService {
  readonly providerAdapters: readonly TelephonyProviderAdapterContract[];
  readonly receiveProviderWebhook: (
    input: ReceiveTelephonyWebhookInput,
  ) => Promise<ReceiveTelephonyWebhookResult>;
}

export interface TelephonyWebhookWorker {
  readonly processPending: (limit?: number) => Promise<readonly TelephonyWebhookWorkerResult[]>;
  readonly applyNormalizedEvent: (
    event: NormalizedTelephonyEvent,
  ) => Promise<TelephonyWebhookWorkerResult>;
}

export interface TelephonyEdgeIngestionApplication {
  readonly migrationPlanRef: (typeof telephonyEdgeMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof telephonyEdgeMigrationPlanRefs;
  readonly persistenceTables: typeof telephonyEdgePersistenceTables;
  readonly gapClosures: typeof telephonyEdgeGapClosures;
  readonly telephonyEdgeService: TelephonyEdgeService;
  readonly telephonyWebhookWorker: TelephonyWebhookWorker;
  readonly repository: TelephonyEdgeRepository;
}

interface SimulatorWebhookPayload {
  readonly eventId: string;
  readonly providerCallId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly sequence?: number;
  readonly callerNumber?: string;
  readonly menuSelection?: string;
  readonly dtmfDigits?: string;
  readonly recordingId?: string;
  readonly recordingUrl?: string;
  readonly errorCode?: string;
  readonly status?: string;
}

const terminalCallStates = new Set<TelephonyCallState>(["abandoned", "closed"]);

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
  }
}

function ensureIsoTimestamp(value: string, fieldName: string): string {
  const parsed = Date.parse(value);
  invariant(!Number.isNaN(parsed), "INVALID_TIMESTAMP", `${fieldName} must be an ISO timestamp.`);
  return new Date(parsed).toISOString();
}

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function digestHex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function digest(value: unknown): string {
  return digestHex(stableStringify(value));
}

function sha256Ref(value: string): string {
  return `sha256:${digestHex(value)}`;
}

function stableRef(prefix: string, value: unknown): string {
  return `${prefix}_${digest(value).slice(0, 24)}`;
}

function unique<TValue extends string>(values: readonly TValue[]): TValue[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function parseSimulatorPayload(rawBody: string): SimulatorWebhookPayload {
  const parsed = JSON.parse(rawBody) as Partial<SimulatorWebhookPayload>;
  invariant(typeof parsed.eventId === "string", "SIMULATOR_EVENT_ID_REQUIRED", "eventId required.");
  invariant(
    typeof parsed.providerCallId === "string",
    "SIMULATOR_PROVIDER_CALL_ID_REQUIRED",
    "providerCallId required.",
  );
  invariant(
    typeof parsed.eventType === "string",
    "SIMULATOR_EVENT_TYPE_REQUIRED",
    "eventType required.",
  );
  invariant(
    typeof parsed.occurredAt === "string",
    "SIMULATOR_OCCURRED_AT_REQUIRED",
    "occurredAt required.",
  );
  return {
    eventId: parsed.eventId,
    providerCallId: parsed.providerCallId,
    eventType: parsed.eventType,
    occurredAt: parsed.occurredAt,
    sequence: parsed.sequence,
    callerNumber: parsed.callerNumber,
    menuSelection: parsed.menuSelection,
    dtmfDigits: parsed.dtmfDigits,
    recordingId: parsed.recordingId,
    recordingUrl: parsed.recordingUrl,
    errorCode: parsed.errorCode,
    status: parsed.status,
  };
}

function normalizeMenuSelection(value: string | undefined): TelephonyMenuSelection {
  const normalized = (value ?? "").trim().toLowerCase();
  if (["1", "symptom", "symptoms", "clinical"].includes(normalized)) return "symptoms";
  if (["2", "med", "meds", "medication", "medications"].includes(normalized)) return "medications";
  if (["3", "admin", "administration"].includes(normalized)) return "admin";
  if (["4", "result", "results"].includes(normalized)) return "results";
  return "unknown";
}

function maskCallerReference(input: {
  readonly callerNumber: string | undefined;
  readonly maskingService: Pick<IdentityAuditAndMaskingService, "redactIdentityPayload">;
}): Pick<TelephonyNormalizedPayload, "maskedCallerFragment" | "maskedCallerRef"> {
  if (!input.callerNumber) return {};
  const redaction = input.maskingService.redactIdentityPayload(
    { callerNumber: input.callerNumber },
    "operational_log",
  );
  const redactedRecord = redaction.redactedValue as Record<string, unknown>;
  const maskedCallerFragment = String(redactedRecord.callerNumber ?? "masked");
  return {
    maskedCallerFragment,
    maskedCallerRef: stableRef("masked_caller_187", {
      maskedCallerFragment,
      payloadHash: redaction.payloadHash,
    }),
  };
}

function normalizedEventMapping(payload: SimulatorWebhookPayload): {
  readonly providerEventFamily: TelephonyProviderEventFamily;
  readonly canonicalEventType: TelephonyCanonicalEventType;
  readonly idempotencyKeyBasis: TelephonyIdempotencyKeyBasis;
  readonly statusClass: string;
} {
  switch (payload.eventType) {
    case "call.started":
    case "call.ringing":
    case "call.answered":
      return {
        providerEventFamily: "provider_call_started",
        canonicalEventType: "call_started",
        idempotencyKeyBasis: "provider_event_id_plus_call_session",
        statusClass: payload.eventType,
      };
    case "menu.selected":
    case "ivr.branch":
      return {
        providerEventFamily: "provider_menu_input",
        canonicalEventType: "menu_selection_captured",
        idempotencyKeyBasis: "provider_event_id_plus_call_session",
        statusClass: "menu_selection",
      };
    case "recording.expected":
      return {
        providerEventFamily: "provider_recording_expected",
        canonicalEventType: "recording_expected",
        idempotencyKeyBasis: "provider_call_id_plus_event_type_plus_occurred_at",
        statusClass: "recording_expected",
      };
    case "recording.available":
    case "recording.status.available":
      return {
        providerEventFamily: "provider_recording_available",
        canonicalEventType: "recording_available",
        idempotencyKeyBasis: "provider_event_id_plus_call_session",
        statusClass: "recording_available",
      };
    case "call.completed":
    case "call.abandoned":
    case "call.hangup":
      return {
        providerEventFamily: "provider_call_abandoned",
        canonicalEventType: "call_abandoned",
        idempotencyKeyBasis: "provider_event_id_plus_call_session",
        statusClass: "provider_completed_not_platform_closed",
      };
    case "continuation.delivery":
      return {
        providerEventFamily: "provider_continuation_delivery",
        canonicalEventType: "continuation_sent",
        idempotencyKeyBasis: "provider_event_id_plus_call_session",
        statusClass: "continuation_delivery",
      };
    case "provider.error":
    case "delivery.failed":
      return {
        providerEventFamily: "provider_error",
        canonicalEventType: "provider_error_recorded",
        idempotencyKeyBasis: "payload_digest_plus_call_session",
        statusClass: "provider_error",
      };
    default:
      return {
        providerEventFamily: "provider_error",
        canonicalEventType: "provider_error_recorded",
        idempotencyKeyBasis: "payload_digest_plus_call_session",
        statusClass: "unknown_provider_event_type",
      };
  }
}

function idempotencySemanticKey(input: {
  readonly basis: TelephonyIdempotencyKeyBasis;
  readonly payload: SimulatorWebhookPayload;
  readonly callSessionRef: string;
  readonly canonicalEventType: TelephonyCanonicalEventType;
  readonly payloadDigest: string;
}): string {
  if (input.basis === "provider_call_id_plus_event_type_plus_occurred_at") {
    return `${input.payload.providerCallId}:${input.canonicalEventType}:${input.payload.occurredAt}`;
  }
  if (input.basis === "payload_digest_plus_call_session") {
    return `${input.callSessionRef}:${input.payloadDigest}`;
  }
  if (input.basis === "polling_resource_version_plus_call_session") {
    return `${input.callSessionRef}:${input.payload.eventId}`;
  }
  return `${input.callSessionRef}:${input.payload.eventId}`;
}

export function signSimulatorWebhookPayload(input: {
  readonly rawBody: string;
  readonly secret: string;
  readonly timestamp: string;
}): string {
  const digestValue = createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.rawBody}`)
    .digest("hex");
  return `v1=${digestValue}`;
}

export function createSimulatorTelephonyProviderAdapter(options: {
  readonly secret: string;
  readonly signatureKeyVersionRef?: string;
  readonly allowedSkewSeconds?: number;
}): TelephonyProviderAdapter {
  const signatureKeyVersionRef = options.signatureKeyVersionRef ?? "simulator-hmac-key-v1";
  const allowedSkewSeconds = options.allowedSkewSeconds ?? 300;
  const contract: TelephonyProviderAdapterContract = {
    providerAdapterContractRef: "provider_adapter_187_telephony_provider_simulator",
    providerRef: "telephony_provider_simulator",
    adapterMode: "simulator_backed",
    signatureHeaderName: "x-vecells-simulator-signature",
    timestampHeaderName: "x-vecells-simulator-timestamp",
    signatureAlgorithm: "hmac-sha256",
    acknowledgementMode: "empty_fast_ack",
    rawPayloadBoundary: "provider_payload_shape_stops_at_normalizer",
    policyVersion: TELEPHONY_EDGE_SIGNATURE_POLICY_VERSION,
    createdByAuthority: TELEPHONY_EDGE_SERVICE_NAME,
  };

  return {
    contract,
    validateWebhook(input) {
      const headers = normalizeHeaders(input.headers);
      const signature = headers[contract.signatureHeaderName];
      const timestamp = headers[contract.timestampHeaderName];
      if (!signature || !timestamp) {
        return {
          validationState: "signature_failed",
          providerRef: contract.providerRef,
          signatureKeyVersionRef,
          reasonCodes: ["TEL_EDGE_187_SIGNATURE_REJECTED"],
        };
      }
      const timestampMs = Date.parse(timestamp);
      const receivedMs = Date.parse(input.receivedAt);
      const skewSeconds = Math.abs(receivedMs - timestampMs) / 1000;
      const expected = signSimulatorWebhookPayload({
        rawBody: input.rawBody,
        secret: options.secret,
        timestamp,
      });
      const supplied = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expected);
      const valid =
        supplied.length === expectedBuffer.length &&
        timingSafeEqual(supplied, expectedBuffer) &&
        !Number.isNaN(skewSeconds) &&
        skewSeconds <= allowedSkewSeconds;
      return {
        validationState: valid ? "validated" : "signature_failed",
        providerRef: contract.providerRef,
        signatureKeyVersionRef,
        reasonCodes: valid
          ? ["TEL_EDGE_187_SIGNATURE_VALIDATED"]
          : ["TEL_EDGE_187_SIGNATURE_REJECTED"],
      };
    },
    normalizeWebhook(input) {
      const payload = parseSimulatorPayload(input.rawBody);
      const occurredAt = ensureIsoTimestamp(payload.occurredAt, "occurredAt");
      const mapping = normalizedEventMapping(payload);
      const providerCallRef = stableRef("provider_call_187", {
        providerRef: contract.providerRef,
        providerCallId: payload.providerCallId,
      });
      const callSessionRef = stableRef("call_session_187", {
        providerRef: contract.providerRef,
        providerCallRef,
      });
      const providerEventRef = stableRef("provider_event_187", {
        providerRef: contract.providerRef,
        eventId: payload.eventId,
      });
      const idempotencyKey = idempotencySemanticKey({
        basis: mapping.idempotencyKeyBasis,
        payload,
        callSessionRef,
        canonicalEventType: mapping.canonicalEventType,
        payloadDigest: input.rawReceipt.payloadDigest,
      });
      const callerMask = maskCallerReference({
        callerNumber: payload.callerNumber,
        maskingService: input.maskingService,
      });
      const recordingArtifactRef =
        payload.recordingId || payload.recordingUrl
          ? stableRef("recording_artifact_187", {
              recordingId: payload.recordingId,
              recordingUrlDigest: payload.recordingUrl ? sha256Ref(payload.recordingUrl) : null,
            })
          : undefined;
      const providerErrorRef = payload.errorCode
        ? stableRef("provider_error_187", {
            providerEventRef,
            errorCode: payload.errorCode,
          })
        : undefined;
      const menuSelection = normalizeMenuSelection(payload.menuSelection ?? payload.dtmfDigits);
      return {
        providerEventFamily: mapping.providerEventFamily,
        canonicalEventType: mapping.canonicalEventType,
        ingressSource: "webhook",
        providerRef: contract.providerRef,
        providerCallRef,
        providerEventRef,
        idempotencyKeyBasis: mapping.idempotencyKeyBasis,
        idempotencySemanticKey: idempotencyKey,
        callSessionRef,
        sequence: typeof payload.sequence === "number" ? payload.sequence : null,
        edgeCorrelationId: stableRef("edge_corr_tel_187", {
          providerEventRef,
          callSessionRef,
        }),
        occurredAt,
        normalizedPayload: {
          ...(mapping.canonicalEventType === "menu_selection_captured" ? { menuSelection } : {}),
          ...callerMask,
          ...(recordingArtifactRef ? { recordingArtifactRef } : {}),
          ...(recordingArtifactRef
            ? {
                recordingJobRef: stableRef("recording_fetch_job_187", {
                  recordingArtifactRef,
                  callSessionRef,
                }),
              }
            : {}),
          ...(providerErrorRef ? { providerErrorRef } : {}),
          providerStatusClass: mapping.statusClass,
          reasonCodes: [
            "TEL_EDGE_187_VENDOR_PAYLOAD_STOPPED_AT_EDGE",
            "TEL_EDGE_187_CANONICAL_EVENT_NORMALIZED",
            ...(recordingArtifactRef ? ["TEL_EDGE_187_RECORDING_REF_ONLY"] : []),
            ...(mapping.canonicalEventType === "provider_error_recorded"
              ? ["TEL_EDGE_187_PROVIDER_ERROR_NORMALIZED"]
              : []),
          ],
        },
      };
    },
  };
}

function createRawReceipt(input: {
  readonly providerRef: TelephonyProviderRef;
  readonly requestUrl: string;
  readonly headers: Record<string, string>;
  readonly rawBody: string;
  readonly receivedAt: string;
  readonly sourceIpRef: string | null;
  readonly validation: TelephonyWebhookValidationResult;
}): TelephonyRawWebhookReceipt {
  const payloadDigest = sha256Ref(input.rawBody);
  const headerDigest = sha256Ref(stableStringify(normalizeHeaders(input.headers)));
  return {
    rawReceiptRef: stableRef("tel_raw_receipt_187", {
      providerRef: input.providerRef,
      payloadDigest,
      receivedAt: input.receivedAt,
      headerDigest,
    }),
    providerRef: input.providerRef,
    receivedAt: input.receivedAt,
    sourceIpRef: input.sourceIpRef,
    requestUrl: input.requestUrl,
    headerDigest,
    payloadDigest,
    rawPayload: input.rawBody,
    rawPayloadQuarantineRef: stableRef("tel_payload_quarantine_187", {
      providerRef: input.providerRef,
      payloadDigest,
    }),
    retentionClass: "edge_quarantine_short_retention",
    validationState: input.validation.validationState,
    signatureKeyVersionRef: input.validation.signatureKeyVersionRef,
    disclosureBoundary: "provider_payload_shape_stops_at_normalizer",
    reasonCodes: unique([
      "TEL_EDGE_187_RAW_RECEIPT_QUARANTINED",
      "TEL_EDGE_187_VENDOR_PAYLOAD_STOPPED_AT_EDGE",
      ...input.validation.reasonCodes,
    ]),
    createdByAuthority: TELEPHONY_EDGE_SERVICE_NAME,
  };
}

function createNormalizedEvent(input: {
  readonly draft: NormalizedTelephonyEventDraft;
  readonly rawReceipt: TelephonyRawWebhookReceipt;
  readonly normalizedAt: string;
}): NormalizedTelephonyEvent {
  const idempotencyKey = stableRef("tel_idem_key_187", {
    callSessionRef: input.draft.callSessionRef,
    canonicalEventType: input.draft.canonicalEventType,
    basis: input.draft.idempotencyKeyBasis,
    semanticKey: input.draft.idempotencySemanticKey,
  });
  const canonicalEventId = stableRef("tel_evt_187", {
    providerRef: input.draft.providerRef,
    providerEventRef: input.draft.providerEventRef,
    callSessionRef: input.draft.callSessionRef,
    canonicalEventType: input.draft.canonicalEventType,
    payloadDigest: input.rawReceipt.payloadDigest,
  });
  return {
    schemaVersion: TELEPHONY_EDGE_SCHEMA_VERSION,
    canonicalEventId,
    providerEventFamily: input.draft.providerEventFamily,
    canonicalEventType: input.draft.canonicalEventType,
    ingressSource: input.draft.ingressSource,
    providerRef: input.draft.providerRef,
    providerCallRef: input.draft.providerCallRef,
    providerEventRef: input.draft.providerEventRef,
    providerPayloadRef: input.rawReceipt.rawPayloadQuarantineRef,
    payloadDigest: input.rawReceipt.payloadDigest,
    payloadStorageRule: "normalization_boundary_only",
    payloadDisclosureBoundary: "provider_payload_shape_stops_at_normalizer",
    idempotencyKeyBasis: input.draft.idempotencyKeyBasis,
    idempotencyKey,
    callSessionRef: input.draft.callSessionRef,
    sequence: input.draft.sequence,
    edgeCorrelationId: input.draft.edgeCorrelationId,
    occurredAt: input.draft.occurredAt,
    normalizedAt: input.normalizedAt,
    normalizerVersionRef: TELEPHONY_EDGE_NORMALIZER_VERSION,
    normalizedPayload: input.draft.normalizedPayload,
    createdByAuthority: TELEPHONY_EDGE_SERVICE_NAME,
  };
}

function createIdempotencyRecord(input: {
  readonly event: NormalizedTelephonyEvent;
  readonly rawReceipt: TelephonyRawWebhookReceipt;
}): TelephonyIngestionIdempotencyRecord {
  return {
    idempotencyRecordRef: stableRef("tel_idempotency_187", {
      idempotencyKey: input.event.idempotencyKey,
    }),
    idempotencyKey: input.event.idempotencyKey,
    callSessionRef: input.event.callSessionRef,
    canonicalEventType: input.event.canonicalEventType,
    canonicalEventRef: input.event.canonicalEventId,
    payloadDigest: input.event.payloadDigest,
    firstRawReceiptRef: input.rawReceipt.rawReceiptRef,
    replayDisposition: "accepted",
    firstAcceptedAt: input.event.normalizedAt,
    duplicateCount: 0,
    reasonCodes: ["TEL_EDGE_187_IDEMPOTENCY_ACCEPTED"],
    createdByAuthority: TELEPHONY_EDGE_SERVICE_NAME,
  };
}

function createOutboxEntry(event: NormalizedTelephonyEvent): TelephonyWebhookWorkerOutboxEntry {
  return {
    outboxEntryRef: stableRef("tel_webhook_outbox_187", {
      canonicalEventRef: event.canonicalEventId,
      idempotencyKey: event.idempotencyKey,
    }),
    canonicalEventRef: event.canonicalEventId,
    callSessionRef: event.callSessionRef,
    orderingKey: event.callSessionRef,
    dispatchState: "pending",
    createdAt: event.normalizedAt,
    appliedAt: null,
    reasonCodes: [],
    createdByAuthority: TELEPHONY_WEBHOOK_WORKER_SERVICE_NAME,
  };
}

function createDisorderBufferEntry(event: NormalizedTelephonyEvent): TelephonyDisorderBufferEntry {
  return {
    disorderBufferEntryRef: stableRef("tel_disorder_187", {
      canonicalEventRef: event.canonicalEventId,
      callSessionRef: event.callSessionRef,
    }),
    canonicalEventRef: event.canonicalEventId,
    callSessionRef: event.callSessionRef,
    canonicalEventType: event.canonicalEventType,
    bufferState: "waiting_for_call_started",
    bufferedReasonCode: "TEL_EDGE_187_OUT_OF_ORDER_BUFFERED",
    bufferedAt: event.normalizedAt,
    replayedAt: null,
    createdByAuthority: TELEPHONY_WEBHOOK_WORKER_SERVICE_NAME,
  };
}

function bootstrapSession(
  event: NormalizedTelephonyEvent,
  callState: TelephonyCallState,
): TelephonyEdgeCallSession {
  return {
    callSessionRef: event.callSessionRef,
    providerCallRef: event.providerCallRef,
    callState,
    menuSelection: event.normalizedPayload.menuSelection ?? null,
    maskedCallerRef: event.normalizedPayload.maskedCallerRef ?? null,
    maskedCallerFragment: event.normalizedPayload.maskedCallerFragment ?? null,
    recordingRefs: event.normalizedPayload.recordingArtifactRef
      ? [event.normalizedPayload.recordingArtifactRef]
      : [],
    urgentLiveAssessmentRef: stableRef("tel_urgent_live_assessment_187", {
      callSessionRef: event.callSessionRef,
    }),
    firstEventRef: event.canonicalEventId,
    lastEventRef: event.canonicalEventId,
    stateRevision: 1,
    reasonCodes: unique([
      "TEL_EDGE_187_CALL_SESSION_BOOTSTRAPPED",
      "TEL_EDGE_187_URGENT_ASSESSMENT_OPENED",
      ...(event.normalizedPayload.recordingArtifactRef
        ? (["TEL_EDGE_187_RECORDING_REF_ONLY"] as const)
        : []),
    ]),
    createdAt: event.normalizedAt,
    updatedAt: event.normalizedAt,
    createdByAuthority: TELEPHONY_WEBHOOK_WORKER_SERVICE_NAME,
  };
}

function advanceSession(
  session: TelephonyEdgeCallSession,
  event: NormalizedTelephonyEvent,
  patch: {
    readonly callState?: TelephonyCallState;
    readonly menuSelection?: TelephonyMenuSelection | null;
    readonly recordingRef?: string;
    readonly reasonCodes?: readonly TelephonyEdgeReasonCode[];
  },
): TelephonyEdgeCallSession {
  const recordingRefs = unique([
    ...session.recordingRefs,
    ...(patch.recordingRef ? [patch.recordingRef] : []),
  ]);
  return {
    ...session,
    callState: patch.callState ?? session.callState,
    menuSelection: patch.menuSelection === undefined ? session.menuSelection : patch.menuSelection,
    maskedCallerRef: session.maskedCallerRef ?? event.normalizedPayload.maskedCallerRef ?? null,
    maskedCallerFragment:
      session.maskedCallerFragment ?? event.normalizedPayload.maskedCallerFragment ?? null,
    recordingRefs,
    lastEventRef: event.canonicalEventId,
    stateRevision: session.stateRevision + 1,
    reasonCodes: unique([
      ...session.reasonCodes,
      "TEL_EDGE_187_CALL_SESSION_ADVANCED",
      ...(patch.reasonCodes ?? []),
    ]),
    updatedAt: event.normalizedAt,
  };
}

function stateForEvent(event: NormalizedTelephonyEvent): TelephonyCallState {
  switch (event.canonicalEventType) {
    case "call_started":
      return "initiated";
    case "menu_selection_captured":
      return "menu_selected";
    case "recording_expected":
      return "recording_expected";
    case "recording_available":
      return "recording_available";
    case "provider_error_recorded":
      return "provider_error";
    case "call_abandoned":
    case "call_closed":
      return "abandoned";
    case "continuation_sent":
      return "continuation_sent";
    default:
      return "provider_error";
  }
}

export function createInMemoryTelephonyEdgeRepository(): TelephonyEdgeRepository {
  const adapterContracts = new Map<string, TelephonyProviderAdapterContract>();
  const rawReceipts: TelephonyRawWebhookReceipt[] = [];
  const normalizedEvents = new Map<string, NormalizedTelephonyEvent>();
  const idempotencyRecords = new Map<string, TelephonyIngestionIdempotencyRecord>();
  const outboxEntries = new Map<string, TelephonyWebhookWorkerOutboxEntry>();
  const callSessions = new Map<string, TelephonyEdgeCallSession>();
  const disorderBufferEntries = new Map<string, TelephonyDisorderBufferEntry>();

  return {
    async saveAdapterContract(contract) {
      adapterContracts.set(contract.providerAdapterContractRef, contract);
    },
    async saveRawReceipt(receipt) {
      rawReceipts.push(receipt);
    },
    async saveNormalizedEvent(event) {
      normalizedEvents.set(event.canonicalEventId, event);
    },
    async getNormalizedEvent(canonicalEventRef) {
      return normalizedEvents.get(canonicalEventRef);
    },
    async findIdempotencyRecord(idempotencyKey) {
      return idempotencyRecords.get(idempotencyKey);
    },
    async saveIdempotencyRecord(record) {
      idempotencyRecords.set(record.idempotencyKey, record);
    },
    async incrementDuplicateCount(idempotencyKey) {
      const existing = idempotencyRecords.get(idempotencyKey);
      if (!existing) return;
      idempotencyRecords.set(idempotencyKey, {
        ...existing,
        duplicateCount: existing.duplicateCount + 1,
        replayDisposition: "duplicate_replayed",
        reasonCodes: unique([...existing.reasonCodes, "TEL_EDGE_187_DUPLICATE_REPLAY_COLLAPSED"]),
      });
    },
    async saveOutboxEntry(entry) {
      outboxEntries.set(entry.outboxEntryRef, entry);
    },
    async listPendingOutboxEntries() {
      return [...outboxEntries.values()]
        .filter((entry) => entry.dispatchState === "pending")
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    },
    async updateOutboxEntry(input) {
      const existing = outboxEntries.get(input.outboxEntryRef);
      invariant(existing, "OUTBOX_ENTRY_NOT_FOUND", `Missing outbox ${input.outboxEntryRef}.`);
      outboxEntries.set(input.outboxEntryRef, {
        ...existing,
        dispatchState: input.dispatchState,
        appliedAt: input.appliedAt,
        reasonCodes: input.reasonCodes,
      });
    },
    async findCallSession(callSessionRef) {
      return callSessions.get(callSessionRef);
    },
    async saveCallSession(session) {
      callSessions.set(session.callSessionRef, session);
    },
    async saveDisorderBufferEntry(entry) {
      disorderBufferEntries.set(entry.disorderBufferEntryRef, entry);
    },
    async listBufferedEvents(callSessionRef) {
      return [...disorderBufferEntries.values()]
        .filter(
          (entry) =>
            entry.callSessionRef === callSessionRef &&
            entry.bufferState === "waiting_for_call_started",
        )
        .sort((left, right) => left.bufferedAt.localeCompare(right.bufferedAt));
    },
    async markDisorderBufferReplayed(input) {
      const existing = disorderBufferEntries.get(input.disorderBufferEntryRef);
      invariant(
        existing,
        "DISORDER_BUFFER_ENTRY_NOT_FOUND",
        `Missing disorder buffer ${input.disorderBufferEntryRef}.`,
      );
      disorderBufferEntries.set(input.disorderBufferEntryRef, {
        ...existing,
        bufferState: "replayed",
        replayedAt: input.replayedAt,
      });
    },
    snapshots() {
      return {
        adapterContracts: [...adapterContracts.values()],
        rawReceipts: [...rawReceipts],
        normalizedEvents: [...normalizedEvents.values()],
        idempotencyRecords: [...idempotencyRecords.values()],
        outboxEntries: [...outboxEntries.values()],
        callSessions: [...callSessions.values()],
        disorderBufferEntries: [...disorderBufferEntries.values()],
      };
    },
  };
}

export function createTelephonyEdgeService(options: {
  readonly repository: TelephonyEdgeRepository;
  readonly adapters: readonly TelephonyProviderAdapter[];
  readonly maskingService: Pick<IdentityAuditAndMaskingService, "redactIdentityPayload">;
}): TelephonyEdgeService {
  const adapterByProviderRef = new Map(
    options.adapters.map((adapter) => [adapter.contract.providerRef, adapter]),
  );
  return {
    providerAdapters: options.adapters.map((adapter) => adapter.contract),
    async receiveProviderWebhook(input) {
      const providerRef = input.providerRef ?? "telephony_provider_simulator";
      const adapter = adapterByProviderRef.get(providerRef);
      invariant(adapter, "UNKNOWN_TELEPHONY_PROVIDER", `No adapter registered for ${providerRef}.`);
      const receivedAt = ensureIsoTimestamp(
        input.receivedAt ?? new Date(0).toISOString(),
        "receivedAt",
      );
      const validation = adapter.validateWebhook({
        headers: input.headers,
        rawBody: input.rawBody,
        receivedAt,
      });
      const rawReceipt = createRawReceipt({
        providerRef,
        requestUrl: input.requestUrl,
        headers: input.headers,
        rawBody: input.rawBody,
        receivedAt,
        sourceIpRef: input.sourceIpRef ?? null,
        validation,
      });
      await options.repository.saveRawReceipt(rawReceipt);
      if (validation.validationState !== "validated") {
        return {
          acknowledgement: {
            statusCode: 401,
            body: null,
            queuedForWorker: false,
            responseMode: "empty_fast_ack",
          },
          validation,
          rawReceiptRef: rawReceipt.rawReceiptRef,
          replayDisposition: "idempotency_collision_rejected",
          normalizedEvent: null,
          outboxEntry: null,
          reasonCodes: unique([...validation.reasonCodes, "TEL_EDGE_187_RAW_RECEIPT_QUARANTINED"]),
        };
      }
      const draft = adapter.normalizeWebhook({
        headers: input.headers,
        rawBody: input.rawBody,
        rawReceipt,
        receivedAt,
        maskingService: options.maskingService,
      });
      const normalizedAt = receivedAt;
      const event = createNormalizedEvent({ draft, rawReceipt, normalizedAt });
      const existingIdempotency = await options.repository.findIdempotencyRecord(
        event.idempotencyKey,
      );
      if (existingIdempotency) {
        if (existingIdempotency.payloadDigest !== event.payloadDigest) {
          return {
            acknowledgement: {
              statusCode: 409,
              body: null,
              queuedForWorker: false,
              responseMode: "empty_fast_ack",
            },
            validation,
            rawReceiptRef: rawReceipt.rawReceiptRef,
            replayDisposition: "idempotency_collision_rejected",
            normalizedEvent: null,
            outboxEntry: null,
            reasonCodes: [
              "TEL_EDGE_187_IDEMPOTENCY_COLLISION_REJECTED",
              "TEL_EDGE_187_VENDOR_PAYLOAD_STOPPED_AT_EDGE",
            ],
          };
        }
        await options.repository.incrementDuplicateCount(event.idempotencyKey);
        return {
          acknowledgement: {
            statusCode: 204,
            body: null,
            queuedForWorker: false,
            responseMode: "empty_fast_ack",
          },
          validation,
          rawReceiptRef: rawReceipt.rawReceiptRef,
          replayDisposition: "duplicate_replayed",
          normalizedEvent:
            (await options.repository.getNormalizedEvent(existingIdempotency.canonicalEventRef)) ??
            null,
          outboxEntry: null,
          reasonCodes: [
            "TEL_EDGE_187_DUPLICATE_REPLAY_COLLAPSED",
            "TEL_EDGE_187_VENDOR_PAYLOAD_STOPPED_AT_EDGE",
          ],
        };
      }
      const outboxEntry = createOutboxEntry(event);
      await options.repository.saveNormalizedEvent(event);
      await options.repository.saveIdempotencyRecord(
        createIdempotencyRecord({ event, rawReceipt }),
      );
      await options.repository.saveOutboxEntry(outboxEntry);
      return {
        acknowledgement: {
          statusCode: 204,
          body: null,
          queuedForWorker: true,
          responseMode: "empty_fast_ack",
        },
        validation,
        rawReceiptRef: rawReceipt.rawReceiptRef,
        replayDisposition: "accepted",
        normalizedEvent: event,
        outboxEntry,
        reasonCodes: unique([
          "TEL_EDGE_187_SIGNATURE_VALIDATED",
          "TEL_EDGE_187_RAW_RECEIPT_QUARANTINED",
          "TEL_EDGE_187_CANONICAL_EVENT_NORMALIZED",
          "TEL_EDGE_187_IDEMPOTENCY_ACCEPTED",
          "TEL_EDGE_187_VENDOR_PAYLOAD_STOPPED_AT_EDGE",
        ]),
      };
    },
  };
}

export function createTelephonyWebhookWorker(
  repository: TelephonyEdgeRepository,
): TelephonyWebhookWorker {
  async function applyBufferedEvents(
    callSessionRef: string,
    replayedAt: string,
  ): Promise<readonly string[]> {
    const buffered = await repository.listBufferedEvents(callSessionRef);
    const replayedEventRefs: string[] = [];
    for (const entry of buffered) {
      const event = await repository.getNormalizedEvent(entry.canonicalEventRef);
      if (!event) continue;
      await repository.markDisorderBufferReplayed({
        disorderBufferEntryRef: entry.disorderBufferEntryRef,
        replayedAt,
      });
      await applyEventToSession(event, { replayingBufferedEvent: true });
      replayedEventRefs.push(event.canonicalEventId);
    }
    return replayedEventRefs;
  }

  async function applyEventToSession(
    event: NormalizedTelephonyEvent,
    options?: { readonly replayingBufferedEvent?: boolean },
  ): Promise<{
    readonly callSession: TelephonyEdgeCallSession | null;
    readonly dispatchState: TelephonyWebhookOutboxState;
    readonly replayedBufferedEventRefs: readonly string[];
    readonly reasonCodes: readonly TelephonyEdgeReasonCode[];
  }> {
    const existing = await repository.findCallSession(event.callSessionRef);
    if (!existing && event.canonicalEventType !== "call_started") {
      await repository.saveDisorderBufferEntry(createDisorderBufferEntry(event));
      return {
        callSession: null,
        dispatchState: "buffered",
        replayedBufferedEventRefs: [],
        reasonCodes: ["TEL_EDGE_187_OUT_OF_ORDER_BUFFERED"],
      };
    }

    if (!existing) {
      const session = bootstrapSession(event, stateForEvent(event));
      await repository.saveCallSession(session);
      const replayedBufferedEventRefs = await applyBufferedEvents(
        event.callSessionRef,
        event.normalizedAt,
      );
      return {
        callSession: (await repository.findCallSession(event.callSessionRef)) ?? session,
        dispatchState: "applied",
        replayedBufferedEventRefs,
        reasonCodes: unique([
          "TEL_EDGE_187_CALL_SESSION_BOOTSTRAPPED",
          "TEL_EDGE_187_URGENT_ASSESSMENT_OPENED",
          ...(replayedBufferedEventRefs.length > 0
            ? (["TEL_EDGE_187_OUT_OF_ORDER_REPLAYED"] as const)
            : []),
        ]),
      };
    }

    let session = existing;
    if (terminalCallStates.has(session.callState)) {
      session = advanceSession(session, event, {
        recordingRef: event.normalizedPayload.recordingArtifactRef,
        reasonCodes: [
          "TEL_EDGE_187_CALL_SESSION_TERMINAL_PRESERVED",
          ...(event.normalizedPayload.recordingArtifactRef
            ? (["TEL_EDGE_187_RECORDING_REF_ONLY"] as const)
            : []),
        ],
      });
      await repository.saveCallSession(session);
      return {
        callSession: session,
        dispatchState: "applied",
        replayedBufferedEventRefs: [],
        reasonCodes: ["TEL_EDGE_187_CALL_SESSION_TERMINAL_PRESERVED"],
      };
    }

    switch (event.canonicalEventType) {
      case "call_started":
        session = advanceSession(session, event, {
          reasonCodes: ["TEL_EDGE_187_DUPLICATE_REPLAY_COLLAPSED"],
        });
        break;
      case "menu_selection_captured":
        session = advanceSession(session, event, {
          callState: "menu_selected",
          menuSelection: event.normalizedPayload.menuSelection ?? "unknown",
        });
        break;
      case "recording_expected":
        session = advanceSession(session, event, { callState: "recording_expected" });
        break;
      case "recording_available":
        session = advanceSession(session, event, {
          callState: "recording_available",
          recordingRef: event.normalizedPayload.recordingArtifactRef,
          reasonCodes: ["TEL_EDGE_187_RECORDING_REF_ONLY"],
        });
        break;
      case "call_abandoned":
      case "call_closed":
        session = advanceSession(session, event, {
          callState: "abandoned",
          reasonCodes: ["TEL_EDGE_187_CALL_SESSION_TERMINAL_PRESERVED"],
        });
        break;
      case "provider_error_recorded":
        session = advanceSession(session, event, {
          callState: "provider_error",
          reasonCodes: ["TEL_EDGE_187_PROVIDER_ERROR_NORMALIZED"],
        });
        break;
      case "continuation_sent":
        session = advanceSession(session, event, { callState: "continuation_sent" });
        break;
      default:
        session = advanceSession(session, event, {
          callState: "provider_error",
          reasonCodes: ["TEL_EDGE_187_PROVIDER_ERROR_NORMALIZED"],
        });
    }
    await repository.saveCallSession(session);
    return {
      callSession: session,
      dispatchState: "applied",
      replayedBufferedEventRefs: [],
      reasonCodes: unique([
        "TEL_EDGE_187_CALL_SESSION_ADVANCED",
        ...(options?.replayingBufferedEvent
          ? (["TEL_EDGE_187_OUT_OF_ORDER_REPLAYED"] as const)
          : []),
      ]),
    };
  }

  return {
    async processPending(limit = 50) {
      const pending = (await repository.listPendingOutboxEntries()).slice(0, limit);
      const results: TelephonyWebhookWorkerResult[] = [];
      for (const outboxEntry of pending) {
        const event = await repository.getNormalizedEvent(outboxEntry.canonicalEventRef);
        invariant(event, "NORMALIZED_EVENT_NOT_FOUND", `Missing ${outboxEntry.canonicalEventRef}.`);
        const applied = await applyEventToSession(event);
        await repository.updateOutboxEntry({
          outboxEntryRef: outboxEntry.outboxEntryRef,
          dispatchState: applied.dispatchState,
          appliedAt: applied.dispatchState === "applied" ? event.normalizedAt : null,
          reasonCodes: applied.reasonCodes,
        });
        results.push({
          canonicalEventRef: event.canonicalEventId,
          callSessionRef: event.callSessionRef,
          outboxEntryRef: outboxEntry.outboxEntryRef,
          dispatchState: applied.dispatchState,
          callSession: applied.callSession,
          replayedBufferedEventRefs: applied.replayedBufferedEventRefs,
          reasonCodes: applied.reasonCodes,
        });
      }
      return results;
    },
    async applyNormalizedEvent(event) {
      const applied = await applyEventToSession(event);
      return {
        canonicalEventRef: event.canonicalEventId,
        callSessionRef: event.callSessionRef,
        outboxEntryRef: stableRef("tel_direct_worker_187", event.canonicalEventId),
        dispatchState: applied.dispatchState,
        callSession: applied.callSession,
        replayedBufferedEventRefs: applied.replayedBufferedEventRefs,
        reasonCodes: applied.reasonCodes,
      };
    },
  };
}

export async function createTelephonyEdgeIngestionApplication(options?: {
  readonly repository?: TelephonyEdgeRepository;
  readonly adapters?: readonly TelephonyProviderAdapter[];
  readonly maskingService?: Pick<IdentityAuditAndMaskingService, "redactIdentityPayload">;
  readonly simulatorSecret?: string;
}): Promise<TelephonyEdgeIngestionApplication> {
  const repository = options?.repository ?? createInMemoryTelephonyEdgeRepository();
  const maskingService =
    options?.maskingService ??
    createIdentityAuditAndMaskingService(createInMemoryIdentityAuditAndMaskingRepository());
  const adapters = options?.adapters ?? [
    createSimulatorTelephonyProviderAdapter({
      secret: options?.simulatorSecret ?? "local-telephony-simulator-secret",
    }),
  ];
  for (const adapter of adapters) {
    await repository.saveAdapterContract(adapter.contract);
  }
  return {
    migrationPlanRef: telephonyEdgeMigrationPlanRefs[0],
    migrationPlanRefs: telephonyEdgeMigrationPlanRefs,
    persistenceTables: telephonyEdgePersistenceTables,
    gapClosures: telephonyEdgeGapClosures,
    telephonyEdgeService: createTelephonyEdgeService({
      repository,
      adapters,
      maskingService,
    }),
    telephonyWebhookWorker: createTelephonyWebhookWorker(repository),
    repository,
  };
}
