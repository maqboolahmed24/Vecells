import { createHash } from "node:crypto";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
} from "../../../domain-kernel/src/index";
import {
  emitIntakeAttachmentInitiated,
  emitIntakeAttachmentPreviewGenerated,
  emitIntakeAttachmentPromoted,
  emitIntakeAttachmentQuarantined,
  emitIntakeAttachmentRemoved,
  emitIntakeAttachmentReplaced,
  emitIntakeAttachmentSafe,
  emitIntakeAttachmentScanning,
  emitIntakeAttachmentUploaded,
  type SubmissionLineageEventEnvelope,
} from "../../../event-contracts/src/index";
import {
  phase1AttachmentAcceptancePolicy,
  phase1AttachmentReasonCodes,
  resolvePhase1AttachmentArtifactMode,
  resolvePhase1AttachmentOutcome,
  resolvePhase1AttachmentRule,
  type Phase1AttachmentClassificationOutcome,
} from "./attachment-policy";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function stableDigest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function encodeChecksum(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function nextVersion(version: number): number {
  return version + 1;
}

function saveVersionedRow<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const existing = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      existing?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${existing?.version ?? "missing"}.`,
    );
  } else if (existing) {
    invariant(
      existing.version < row.version,
      "NON_MONOTONE_ATTACHMENT_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, row);
}

function normalizeFileName(fileName: string): string {
  return requireRef(fileName, "fileName").replace(/\s+/g, "_");
}

function extractExtension(fileName: string): string {
  const normalized = normalizeFileName(fileName).toLowerCase();
  const dot = normalized.lastIndexOf(".");
  return dot >= 0 ? normalized.slice(dot) : "";
}

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === "string" ? Buffer.from(input, "utf8") : input;
}

function nowOr(value: string | undefined): string {
  return value ?? new Date().toISOString();
}

export type AttachmentLifecycleState =
  | "initiated"
  | "upload_pending"
  | "uploaded_unverified"
  | "scanning"
  | "safe_pending_promotion"
  | "promoted"
  | "quarantined"
  | "rejected_policy"
  | "scan_failed_retryable"
  | "removed"
  | "replaced";

export type AttachmentDuplicateDisposition =
  | "new_capture"
  | "idempotent_replay"
  | "replacement_capture";

export type AttachmentScannerVerdict =
  | "clean"
  | "malware"
  | "integrity_failure"
  | "unsupported_type"
  | "unreadable"
  | "size_exceeded"
  | "timeout_retryable";

export type AttachmentSafeMode =
  | "structured_summary"
  | "governed_preview"
  | "placeholder_only"
  | "recovery_only";

export type AttachmentZone = "quarantine" | "durable" | "derivative";

export interface AttachmentReasonCodeRow {
  reasonCode: string;
  severity: "error" | "warning" | "info";
  description: string;
}

export interface AttachmentUploadTarget {
  method: "PUT";
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
  transport: "direct_to_object_storage";
}

export interface AttachmentUploadSession {
  sessionSchemaVersion: "ATTACHMENT_UPLOAD_SESSION_V1";
  uploadSessionId: string;
  attachmentPublicId: string;
  draftPublicId: string;
  duplicateDisposition: AttachmentDuplicateDisposition;
  signedUploadTarget: AttachmentUploadTarget | null;
  quarantineObjectKey: string | null;
  idempotencyKey: string;
  transportState: "active" | "uploaded" | "expired" | "replayed";
  initiatedAt: string;
  expiresAt: string | null;
  replacementForAttachmentPublicId: string | null;
}

export interface AttachmentScanSettlement {
  settlementSchemaVersion: "ATTACHMENT_SCAN_SETTLEMENT_V1";
  attachmentPublicId: string;
  draftPublicId: string;
  lifecycleState: AttachmentLifecycleState;
  scanAttemptRef: string | null;
  classificationOutcome: string | null;
  outcomeRef: string;
  reasonCodes: readonly string[];
  currentSafeMode: AttachmentSafeMode;
  documentReferenceState: "created" | "not_created" | "pending";
  quarantineState: "not_quarantined" | "quarantined" | "processing" | "unknown";
  durableObjectKey: string | null;
  previewObjectKey: string | null;
  documentReferenceRef: string | null;
  settledAt: string;
}

export interface AttachmentDocumentReferenceLink {
  linkSchemaVersion: "ATTACHMENT_DOCUMENT_REFERENCE_LINK_V1";
  linkRef: string;
  attachmentPublicId: string;
  draftPublicId: string;
  requestPublicId: string | null;
  documentReferenceLogicalId: string;
  documentReferenceRecordRef: string;
  representationSetRef: string;
  durableObjectKey: string;
  checksumSha256: string;
  linkedAt: string;
}

export interface AttachmentArtifactPresentationContract {
  contractId: string;
  artifactKind: "intake_attachment";
  summaryRequired: true;
  previewPolicy: string;
  downloadPolicy: string;
  printPolicy: string;
  handoffPolicy: string;
  requiredSummaryAuthority: "verified_or_provisional";
  source_refs: readonly string[];
}

export interface AttachmentOutboundNavigationGrant {
  grantId: string;
  state: "active" | "expired";
  destinationLabel: string;
  destinationType: "browser_overlay" | "external_browser";
  routeFamilyRef: string;
  continuityKey: string;
  selectedAnchorRef: string;
  returnTargetRef: string;
  expiresAt: string | null;
  scrubbedDestination: string;
  reason: string;
  source_refs: readonly string[];
}

export interface DraftAttachmentProjectionCard {
  attachmentPublicId: string;
  draftPublicId: string;
  fileName: string;
  byteSize: number;
  lifecycleState: AttachmentLifecycleState;
  classificationOutcome: string | null;
  currentSafeMode: AttachmentSafeMode;
  documentReferenceState: "created" | "not_created" | "pending";
  quarantineState: "not_quarantined" | "quarantined" | "processing" | "unknown";
  summaryLabel: string;
  allowedActions: readonly string[];
  reasonCodes: readonly string[];
  artifactModeRef: string | null;
}

export interface PromotedRequestAttachmentSummary {
  requestPublicId: string;
  attachmentPublicId: string;
  fileName: string;
  documentReferenceRef: string;
  currentSafeMode: AttachmentSafeMode;
  linkedAt: string;
}

export interface AttachmentArtifactPresentationView {
  attachmentPublicId: string;
  classificationOutcome: string | null;
  contract: AttachmentArtifactPresentationContract;
  summary: {
    title: string;
    detail: string;
    parityState: "governed_preview" | "placeholder_only" | "recovery_only";
  };
  grant: AttachmentOutboundNavigationGrant | null;
}

export interface SubmissionAttachmentStateView {
  attachmentRef: string;
  outcomeRef: string;
  submitDisposition:
    | "routine_submit_allowed"
    | "retry_before_submit"
    | "replace_or_remove_then_review"
    | "state_unknown";
  currentSafeMode: AttachmentSafeMode;
  documentReferenceState: "created" | "not_created" | "pending";
  quarantineState: "not_quarantined" | "quarantined" | "processing" | "unknown";
}

export interface AttachmentObjectDescriptor {
  objectKey: string;
  zone: AttachmentZone;
  byteSize: number;
  mediaType: string;
  checksumSha256: string;
  contentHash: string;
  fileName: string;
  createdAt: string;
  sourceObjectKey: string | null;
}

export interface AttachmentScannerInput {
  attachmentPublicId: string;
  draftPublicId: string;
  fileName: string;
  declaredMimeType: string;
  detectedMimeType: string;
  byteSize: number;
  checksumSha256: string;
  suppliedChecksumSha256: string | null;
  quarantineObjectKey: string;
  simulatorScenarioId: string | null;
  startedAt: string;
}

export interface AttachmentScannerResult {
  scannerRef: string;
  scenarioId: string;
  verdict: AttachmentScannerVerdict;
  detectedMimeType: string;
  reasonCodes: readonly string[];
  settledAt: string;
}

export interface AttachmentScannerAdapter {
  scanAttachment(input: AttachmentScannerInput): Promise<AttachmentScannerResult>;
}

export interface AttachmentReadTokenResult {
  transportToken: string;
  scrubbedDestination: string;
  expiresAt: string;
}

export interface AttachmentObjectStorageAdapter {
  issueQuarantineUploadTarget(input: {
    attachmentPublicId: string;
    draftPublicId: string;
    fileName: string;
    declaredMimeType: string;
    expiresAt: string;
  }): Promise<{
    uploadToken: string;
    objectKey: string;
    target: AttachmentUploadTarget;
  }>;
  settleQuarantineUpload(input: {
    uploadToken: string;
    fileName: string;
    reportedMimeType: string;
    checksumSha256: string | null;
    bytes: Uint8Array;
    uploadedAt: string;
  }): Promise<AttachmentObjectDescriptor & { suppliedChecksumSha256: string | null }>;
  getObject(objectKey: string): Promise<AttachmentObjectDescriptor | undefined>;
  promoteObject(input: {
    sourceObjectKey: string;
    attachmentPublicId: string;
    fileName: string;
    promotedAt: string;
  }): Promise<AttachmentObjectDescriptor>;
  createDerivative(input: {
    sourceObjectKey: string;
    attachmentPublicId: string;
    fileName: string;
    durableMediaType: string;
    durableByteSize: number;
    durableChecksumSha256: string;
    simulatorScenarioId: string | null;
    generatedAt: string;
  }): Promise<{
    settlementState: "generated" | "failed" | "not_required";
    descriptor: AttachmentObjectDescriptor | null;
    reasonCodes: readonly string[];
  }>;
  issueReadToken(input: {
    attachmentPublicId: string;
    objectKey: string;
    action: "open_in_browser" | "download" | "external_handoff";
    expiresAt: string;
  }): Promise<AttachmentReadTokenResult>;
}

export interface Phase1AttachmentRecordSnapshot {
  attachmentId: string;
  attachmentPublicId: string;
  draftPublicId: string;
  requestPublicId: string | null;
  uploadSessionId: string | null;
  fileName: string;
  normalizedFileName: string;
  extension: string;
  declaredMimeType: string;
  detectedMimeType: string | null;
  byteSize: number;
  checksumSha256: string | null;
  contentFingerprint: string | null;
  lifecycleState: AttachmentLifecycleState;
  classificationOutcome: string | null;
  outcomeRef: string;
  currentSafeMode: AttachmentSafeMode;
  documentReferenceState: "created" | "not_created" | "pending";
  quarantineState: "not_quarantined" | "quarantined" | "processing" | "unknown";
  artifactModeRef: string | null;
  quarantineObjectKey: string | null;
  durableObjectKey: string | null;
  previewObjectKey: string | null;
  latestScanAttemptRef: string | null;
  latestDerivativeRef: string | null;
  documentReferenceRef: string | null;
  simulatorScenarioId: string | null;
  replacementForAttachmentPublicId: string | null;
  replacedByAttachmentPublicId: string | null;
  removedAt: string | null;
  promotedAt: string | null;
  reasonCodes: readonly string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AttachmentUploadSessionSnapshot extends AttachmentUploadSession {
  uploadToken: string | null;
  version: number;
}

export interface AttachmentScanAttemptSnapshot {
  scanAttemptRef: string;
  attachmentPublicId: string;
  draftPublicId: string;
  scannerRef: string;
  scenarioId: string;
  verdict: AttachmentScannerVerdict;
  detectedMimeType: string;
  reasonCodes: readonly string[];
  startedAt: string;
  settledAt: string;
  version: number;
}

export interface AttachmentDerivativeSettlementSnapshot {
  derivativeRef: string;
  attachmentPublicId: string;
  settlementState: "generated" | "failed" | "not_required";
  derivativeObjectKey: string | null;
  reasonCodes: readonly string[];
  generatedAt: string;
  version: number;
}

export interface AttachmentDocumentReferenceLinkSnapshot extends AttachmentDocumentReferenceLink {
  version: number;
}

export interface AttachmentReadGrantSnapshot extends AttachmentOutboundNavigationGrant {
  attachmentPublicId: string;
  objectKey: string;
  action: "open_in_browser" | "download" | "external_handoff";
  version: number;
}

export interface Phase1AttachmentPipelineRepositories {
  getAttachment(attachmentPublicId: string): Promise<Phase1AttachmentRecordSnapshot | undefined>;
  saveAttachment(
    record: Phase1AttachmentRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAttachmentsByDraftPublicId(
    draftPublicId: string,
  ): Promise<readonly Phase1AttachmentRecordSnapshot[]>;
  listAttachmentsByRequestPublicId(
    requestPublicId: string,
  ): Promise<readonly Phase1AttachmentRecordSnapshot[]>;
  findAttachmentByFingerprint(
    draftPublicId: string,
    contentFingerprint: string,
  ): Promise<Phase1AttachmentRecordSnapshot | undefined>;
  listAttachmentHistory(
    attachmentPublicId: string,
  ): Promise<readonly Phase1AttachmentRecordSnapshot[]>;
  listAllAttachments(): Promise<readonly Phase1AttachmentRecordSnapshot[]>;

  getUploadSession(uploadSessionId: string): Promise<AttachmentUploadSessionSnapshot | undefined>;
  saveUploadSession(
    session: AttachmentUploadSessionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findUploadSessionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<AttachmentUploadSessionSnapshot | undefined>;

  saveScanAttempt(record: AttachmentScanAttemptSnapshot): Promise<void>;
  listScanAttemptsForAttachment(
    attachmentPublicId: string,
  ): Promise<readonly AttachmentScanAttemptSnapshot[]>;

  saveDerivativeSettlement(record: AttachmentDerivativeSettlementSnapshot): Promise<void>;
  listDerivativeSettlementsForAttachment(
    attachmentPublicId: string,
  ): Promise<readonly AttachmentDerivativeSettlementSnapshot[]>;

  saveDocumentReferenceLink(record: AttachmentDocumentReferenceLinkSnapshot): Promise<void>;
  getDocumentReferenceLinkForAttachment(
    attachmentPublicId: string,
  ): Promise<AttachmentDocumentReferenceLinkSnapshot | undefined>;

  saveReadGrant(record: AttachmentReadGrantSnapshot): Promise<void>;
  getReadGrant(grantId: string): Promise<AttachmentReadGrantSnapshot | undefined>;
}

export class InMemoryPhase1AttachmentPipelineStore implements Phase1AttachmentPipelineRepositories {
  private readonly attachments = new Map<string, Phase1AttachmentRecordSnapshot>();
  private readonly attachmentHistory = new Map<string, Phase1AttachmentRecordSnapshot[]>();
  private readonly attachmentsByDraft = new Map<string, Set<string>>();
  private readonly attachmentsByRequest = new Map<string, Set<string>>();
  private readonly attachmentsByFingerprint = new Map<string, string>();
  private readonly uploadSessions = new Map<string, AttachmentUploadSessionSnapshot>();
  private readonly uploadSessionByIdempotency = new Map<string, string>();
  private readonly scanAttemptsByAttachment = new Map<string, AttachmentScanAttemptSnapshot[]>();
  private readonly derivativeByAttachment = new Map<string, AttachmentDerivativeSettlementSnapshot[]>();
  private readonly documentLinks = new Map<string, AttachmentDocumentReferenceLinkSnapshot>();
  private readonly readGrants = new Map<string, AttachmentReadGrantSnapshot>();

  async getAttachment(attachmentPublicId: string) {
    const row = this.attachments.get(attachmentPublicId);
    return row ? { ...row, reasonCodes: [...row.reasonCodes] } : undefined;
  }

  async saveAttachment(
    record: Phase1AttachmentRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveVersionedRow(this.attachments, record.attachmentPublicId, record, options);
    if (!this.attachmentsByDraft.has(record.draftPublicId)) {
      this.attachmentsByDraft.set(record.draftPublicId, new Set());
    }
    this.attachmentsByDraft.get(record.draftPublicId)?.add(record.attachmentPublicId);
    if (record.requestPublicId) {
      if (!this.attachmentsByRequest.has(record.requestPublicId)) {
        this.attachmentsByRequest.set(record.requestPublicId, new Set());
      }
      this.attachmentsByRequest.get(record.requestPublicId)?.add(record.attachmentPublicId);
    }
    if (record.contentFingerprint) {
      this.attachmentsByFingerprint.set(
        `${record.draftPublicId}::${record.contentFingerprint}`,
        record.attachmentPublicId,
      );
    }
    const history = this.attachmentHistory.get(record.attachmentPublicId) ?? [];
    history.push({ ...record, reasonCodes: [...record.reasonCodes] });
    this.attachmentHistory.set(record.attachmentPublicId, history);
  }

  async listAttachmentsByDraftPublicId(draftPublicId: string) {
    return [...(this.attachmentsByDraft.get(draftPublicId) ?? [])]
      .map((attachmentPublicId) => this.attachments.get(attachmentPublicId))
      .filter((value): value is Phase1AttachmentRecordSnapshot => Boolean(value))
      .map((row) => ({ ...row, reasonCodes: [...row.reasonCodes] }));
  }

  async listAttachmentsByRequestPublicId(requestPublicId: string) {
    return [...(this.attachmentsByRequest.get(requestPublicId) ?? [])]
      .map((attachmentPublicId) => this.attachments.get(attachmentPublicId))
      .filter((value): value is Phase1AttachmentRecordSnapshot => Boolean(value))
      .map((row) => ({ ...row, reasonCodes: [...row.reasonCodes] }));
  }

  async findAttachmentByFingerprint(draftPublicId: string, contentFingerprint: string) {
    const key = this.attachmentsByFingerprint.get(`${draftPublicId}::${contentFingerprint}`);
    return key ? this.getAttachment(key) : undefined;
  }

  async listAttachmentHistory(attachmentPublicId: string) {
    return (this.attachmentHistory.get(attachmentPublicId) ?? []).map((row) => ({
      ...row,
      reasonCodes: [...row.reasonCodes],
    }));
  }

  async listAllAttachments() {
    return [...this.attachments.values()].map((row) => ({
      ...row,
      reasonCodes: [...row.reasonCodes],
    }));
  }

  async getUploadSession(uploadSessionId: string) {
    const row = this.uploadSessions.get(uploadSessionId);
    return row
      ? {
          ...row,
          signedUploadTarget: row.signedUploadTarget
            ? { ...row.signedUploadTarget, headers: { ...row.signedUploadTarget.headers } }
            : null,
        }
      : undefined;
  }

  async saveUploadSession(
    session: AttachmentUploadSessionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveVersionedRow(this.uploadSessions, session.uploadSessionId, session, options);
    this.uploadSessionByIdempotency.set(session.idempotencyKey, session.uploadSessionId);
  }

  async findUploadSessionByIdempotencyKey(idempotencyKey: string) {
    const uploadSessionId = this.uploadSessionByIdempotency.get(idempotencyKey);
    return uploadSessionId ? this.getUploadSession(uploadSessionId) : undefined;
  }

  async saveScanAttempt(record: AttachmentScanAttemptSnapshot): Promise<void> {
    const history = this.scanAttemptsByAttachment.get(record.attachmentPublicId) ?? [];
    history.push({ ...record, reasonCodes: [...record.reasonCodes] });
    this.scanAttemptsByAttachment.set(record.attachmentPublicId, history);
  }

  async listScanAttemptsForAttachment(attachmentPublicId: string) {
    return (this.scanAttemptsByAttachment.get(attachmentPublicId) ?? []).map((row) => ({
      ...row,
      reasonCodes: [...row.reasonCodes],
    }));
  }

  async saveDerivativeSettlement(record: AttachmentDerivativeSettlementSnapshot): Promise<void> {
    const history = this.derivativeByAttachment.get(record.attachmentPublicId) ?? [];
    history.push({ ...record, reasonCodes: [...record.reasonCodes] });
    this.derivativeByAttachment.set(record.attachmentPublicId, history);
  }

  async listDerivativeSettlementsForAttachment(attachmentPublicId: string) {
    return (this.derivativeByAttachment.get(attachmentPublicId) ?? []).map((row) => ({
      ...row,
      reasonCodes: [...row.reasonCodes],
    }));
  }

  async saveDocumentReferenceLink(record: AttachmentDocumentReferenceLinkSnapshot): Promise<void> {
    this.documentLinks.set(record.attachmentPublicId, record);
  }

  async getDocumentReferenceLinkForAttachment(attachmentPublicId: string) {
    const record = this.documentLinks.get(attachmentPublicId);
    return record ? { ...record } : undefined;
  }

  async saveReadGrant(record: AttachmentReadGrantSnapshot): Promise<void> {
    this.readGrants.set(record.grantId, record);
  }

  async getReadGrant(grantId: string) {
    const record = this.readGrants.get(grantId);
    return record ? { ...record, source_refs: [...record.source_refs] } : undefined;
  }
}

export class InMemoryAttachmentObjectStorage implements AttachmentObjectStorageAdapter {
  private readonly pendingUploads = new Map<
    string,
    {
      objectKey: string;
      fileName: string;
      declaredMimeType: string;
      expiresAt: string;
    }
  >();
  private readonly objects = new Map<
    string,
    AttachmentObjectDescriptor & { bytes: Uint8Array; suppliedChecksumSha256: string | null }
  >();

  async issueQuarantineUploadTarget(input: {
    attachmentPublicId: string;
    draftPublicId: string;
    fileName: string;
    declaredMimeType: string;
    expiresAt: string;
  }) {
    const uploadToken = `upl_${stableDigest(`${input.attachmentPublicId}::${input.expiresAt}`).slice(0, 18)}`;
    const objectKey = `quarantine/${input.draftPublicId}/${input.attachmentPublicId}/${normalizeFileName(input.fileName)}`;
    this.pendingUploads.set(uploadToken, {
      objectKey,
      fileName: normalizeFileName(input.fileName),
      declaredMimeType: input.declaredMimeType.toLowerCase(),
      expiresAt: input.expiresAt,
    });
    return {
      uploadToken,
      objectKey,
      target: {
        method: "PUT" as const,
        url: `simulator://quarantine-upload/${uploadToken}`,
        headers: {
          "content-type": input.declaredMimeType,
          "x-vecells-upload-token": uploadToken,
        },
        expiresAt: input.expiresAt,
        transport: "direct_to_object_storage" as const,
      },
    };
  }

  async settleQuarantineUpload(input: {
    uploadToken: string;
    fileName: string;
    reportedMimeType: string;
    checksumSha256: string | null;
    bytes: Uint8Array;
    uploadedAt: string;
  }) {
    const pending = this.pendingUploads.get(input.uploadToken);
    invariant(!!pending, "ATTACHMENT_UPLOAD_TOKEN_UNKNOWN", "Upload token is not active.");
    const checksumSha256 = encodeChecksum(input.bytes);
    const descriptor = {
      objectKey: pending.objectKey,
      zone: "quarantine" as const,
      byteSize: input.bytes.byteLength,
      mediaType: input.reportedMimeType.toLowerCase(),
      checksumSha256,
      contentHash: stableDigest(Buffer.from(input.bytes).toString("base64")),
      fileName: pending.fileName,
      createdAt: input.uploadedAt,
      sourceObjectKey: null,
      bytes: input.bytes,
      suppliedChecksumSha256: input.checksumSha256,
    };
    this.objects.set(descriptor.objectKey, descriptor);
    return descriptor;
  }

  async getObject(objectKey: string) {
    const row = this.objects.get(objectKey);
    if (!row) {
      return undefined;
    }
    return {
      objectKey: row.objectKey,
      zone: row.zone,
      byteSize: row.byteSize,
      mediaType: row.mediaType,
      checksumSha256: row.checksumSha256,
      contentHash: row.contentHash,
      fileName: row.fileName,
      createdAt: row.createdAt,
      sourceObjectKey: row.sourceObjectKey,
    };
  }

  async promoteObject(input: {
    sourceObjectKey: string;
    attachmentPublicId: string;
    fileName: string;
    promotedAt: string;
  }) {
    const source = this.objects.get(input.sourceObjectKey);
    invariant(!!source, "ATTACHMENT_SOURCE_OBJECT_MISSING", "Quarantine object is required before promotion.");
    const objectKey = `durable/${input.attachmentPublicId}/${source.checksumSha256.slice(0, 12)}-${normalizeFileName(input.fileName)}`;
    const descriptor = {
      ...source,
      objectKey,
      zone: "durable" as const,
      createdAt: input.promotedAt,
      sourceObjectKey: source.objectKey,
    };
    this.objects.set(objectKey, descriptor);
    return {
      objectKey: descriptor.objectKey,
      zone: descriptor.zone,
      byteSize: descriptor.byteSize,
      mediaType: descriptor.mediaType,
      checksumSha256: descriptor.checksumSha256,
      contentHash: descriptor.contentHash,
      fileName: descriptor.fileName,
      createdAt: descriptor.createdAt,
      sourceObjectKey: descriptor.sourceObjectKey,
    };
  }

  async createDerivative(input: {
    sourceObjectKey: string;
    attachmentPublicId: string;
    fileName: string;
    durableMediaType: string;
    durableByteSize: number;
    durableChecksumSha256: string;
    simulatorScenarioId: string | null;
    generatedAt: string;
  }) {
    if (input.simulatorScenarioId === "preview_failure") {
      return {
        settlementState: "failed" as const,
        descriptor: null,
        reasonCodes: ["ATTACH_REASON_PREVIEW_GENERATION_FAILED"],
      };
    }
    if (input.durableByteSize > phase1AttachmentAcceptancePolicy.maxInlinePreviewBytes) {
      return {
        settlementState: "not_required" as const,
        descriptor: null,
        reasonCodes: [],
      };
    }
    const derivativeKey = `derivative/${input.attachmentPublicId}/preview-${stableDigest(input.sourceObjectKey).slice(0, 12)}.png`;
    const mediaType =
      input.durableMediaType === "application/pdf" ? "image/png" : "image/png";
    const descriptor = {
      objectKey: derivativeKey,
      zone: "derivative" as const,
      byteSize: Math.min(input.durableByteSize, 262_144),
      mediaType,
      checksumSha256: stableDigest(`${input.durableChecksumSha256}::preview`),
      contentHash: stableDigest(`${input.sourceObjectKey}::preview`),
      fileName: `${normalizeFileName(input.fileName)}.preview.png`,
      createdAt: input.generatedAt,
      sourceObjectKey: input.sourceObjectKey,
      bytes: Buffer.from(`preview:${input.attachmentPublicId}`),
      suppliedChecksumSha256: null,
    };
    this.objects.set(derivativeKey, descriptor);
    return {
      settlementState: "generated" as const,
      descriptor: {
        objectKey: descriptor.objectKey,
        zone: descriptor.zone,
        byteSize: descriptor.byteSize,
        mediaType: descriptor.mediaType,
        checksumSha256: descriptor.checksumSha256,
        contentHash: descriptor.contentHash,
        fileName: descriptor.fileName,
        createdAt: descriptor.createdAt,
        sourceObjectKey: descriptor.sourceObjectKey,
      },
      reasonCodes: [],
    };
  }

  async issueReadToken(input: {
    attachmentPublicId: string;
    objectKey: string;
    action: "open_in_browser" | "download" | "external_handoff";
    expiresAt: string;
  }) {
    const transportToken = `rdg_${stableDigest(`${input.attachmentPublicId}::${input.objectKey}::${input.action}::${input.expiresAt}`).slice(0, 22)}`;
    return {
      transportToken,
      scrubbedDestination: `artifact://attachment-grant/${transportToken}`,
      expiresAt: input.expiresAt,
    };
  }
}

export interface InitiateAttachmentUploadInput {
  draftPublicId: string;
  fileName: string;
  declaredMimeType: string;
  byteSize: number;
  initiatedAt: string;
  checksumSha256?: string | null;
  clientUploadId?: string | null;
  replacementForAttachmentPublicId?: string | null;
  simulatorScenarioId?: string | null;
}

export interface InitiateAttachmentUploadResult {
  accepted: boolean;
  uploadSession: AttachmentUploadSession | null;
  attachment: Phase1AttachmentRecordSnapshot;
  duplicateReplayOfAttachmentPublicId: string | null;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface RecordAttachmentUploadInput {
  uploadSessionId: string;
  fileName: string;
  reportedMimeType: string;
  checksumSha256?: string | null;
  bytes: Uint8Array | string;
  uploadedAt: string;
}

export interface RecordAttachmentUploadResult {
  attachment: Phase1AttachmentRecordSnapshot;
  uploadSession: AttachmentUploadSession;
  replayedToAttachmentPublicId: string | null;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface AttachmentWorkerRunResult {
  changedDraftPublicIds: readonly string[];
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
  settlements: readonly AttachmentScanSettlement[];
}

export interface RemoveAttachmentInput {
  attachmentPublicId: string;
  removedAt: string;
  reasonCode?: string;
}

export interface RemoveAttachmentResult {
  attachment: Phase1AttachmentRecordSnapshot;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface ReplaceAttachmentBindingInput {
  supersededAttachmentPublicId: string;
  replacementAttachmentPublicId: string;
  replacedAt: string;
}

export interface BindPromotedRequestInput {
  attachmentPublicId: string;
  requestPublicId: string;
  boundAt: string;
}

export class Phase1AttachmentPipelineService {
  private readonly repositories: Phase1AttachmentPipelineRepositories;
  private readonly objectStorage: AttachmentObjectStorageAdapter;
  private readonly scanner: AttachmentScannerAdapter;
  private readonly idGenerator: BackboneIdGenerator;

  constructor(input: {
    repositories: Phase1AttachmentPipelineRepositories;
    objectStorage: AttachmentObjectStorageAdapter;
    scanner: AttachmentScannerAdapter;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.repositories = input.repositories;
    this.objectStorage = input.objectStorage;
    this.scanner = input.scanner;
    this.idGenerator =
      input.idGenerator ?? createDeterministicBackboneIdGenerator("phase1_attachment_pipeline");
  }

  private nextRef(kind: string): string {
    return (this.idGenerator.nextId as unknown as (value: string) => string)(kind);
  }

  private createAttachmentPublicId(seed: string): string {
    return `att_${stableDigest(seed).slice(0, 14)}`;
  }

  private createIdempotencyKey(input: {
    draftPublicId: string;
    checksumSha256: string | null;
    byteSize: number;
    declaredMimeType: string;
    clientUploadId: string | null;
  }): string {
    if (input.checksumSha256) {
      return stableDigest(
        `${input.draftPublicId}::${input.checksumSha256}::${input.byteSize}::${input.declaredMimeType.toLowerCase()}`,
      );
    }
    return stableDigest(
      `${input.draftPublicId}::${input.clientUploadId ?? "no-client-id"}::${input.byteSize}::${input.declaredMimeType.toLowerCase()}`,
    );
  }

  private toContentFingerprint(record: {
    checksumSha256: string;
    byteSize: number;
    detectedMimeType: string;
  }): string {
    return stableDigest(
      `${record.checksumSha256}::${record.byteSize}::${record.detectedMimeType.toLowerCase()}`,
    );
  }

  private summarizeAttachment(record: Phase1AttachmentRecordSnapshot): DraftAttachmentProjectionCard {
    return {
      attachmentPublicId: record.attachmentPublicId,
      draftPublicId: record.draftPublicId,
      fileName: record.fileName,
      byteSize: record.byteSize,
      lifecycleState: record.lifecycleState,
      classificationOutcome: record.classificationOutcome,
      currentSafeMode: record.currentSafeMode,
      documentReferenceState: record.documentReferenceState,
      quarantineState: record.quarantineState,
      summaryLabel:
        resolvePhase1AttachmentOutcome(record.classificationOutcome ?? "")?.patientVisiblePosture ??
        record.lifecycleState.replaceAll("_", " "),
      allowedActions:
        record.lifecycleState === "removed" || record.lifecycleState === "replaced"
          ? []
          : record.lifecycleState === "promoted"
            ? ["replace", "remove", "open_with_grant", "download_with_grant"]
            : ["replace", "remove"],
      reasonCodes: [...record.reasonCodes],
      artifactModeRef: record.artifactModeRef,
    };
  }

  private toSubmissionAttachmentState(
    record: Phase1AttachmentRecordSnapshot,
  ): SubmissionAttachmentStateView {
    const submitDisposition =
      record.lifecycleState === "promoted"
        ? "routine_submit_allowed"
        : record.lifecycleState === "quarantined" ||
            record.lifecycleState === "rejected_policy"
          ? "replace_or_remove_then_review"
          : "retry_before_submit";
    return {
      attachmentRef: record.attachmentPublicId,
      outcomeRef: record.outcomeRef,
      submitDisposition,
      currentSafeMode: record.currentSafeMode,
      documentReferenceState: record.documentReferenceState,
      quarantineState: record.quarantineState,
    };
  }

  private createAttachmentRecord(input: {
    attachmentPublicId: string;
    draftPublicId: string;
    uploadSessionId: string | null;
    fileName: string;
    declaredMimeType: string;
    byteSize: number;
    initiatedAt: string;
    replacementForAttachmentPublicId?: string | null;
    simulatorScenarioId?: string | null;
    lifecycleState: AttachmentLifecycleState;
    outcomeRef: string;
    currentSafeMode?: AttachmentSafeMode;
    reasonCodes?: readonly string[];
  }): Phase1AttachmentRecordSnapshot {
    return {
      attachmentId: this.nextRef("attachmentRecord"),
      attachmentPublicId: input.attachmentPublicId,
      draftPublicId: input.draftPublicId,
      requestPublicId: null,
      uploadSessionId: input.uploadSessionId,
      fileName: normalizeFileName(input.fileName),
      normalizedFileName: normalizeFileName(input.fileName).toLowerCase(),
      extension: extractExtension(input.fileName),
      declaredMimeType: input.declaredMimeType.toLowerCase(),
      detectedMimeType: null,
      byteSize: input.byteSize,
      checksumSha256: null,
      contentFingerprint: null,
      lifecycleState: input.lifecycleState,
      classificationOutcome: null,
      outcomeRef: input.outcomeRef,
      currentSafeMode: input.currentSafeMode ?? "structured_summary",
      documentReferenceState: "not_created",
      quarantineState: "unknown",
      artifactModeRef: null,
      quarantineObjectKey: null,
      durableObjectKey: null,
      previewObjectKey: null,
      latestScanAttemptRef: null,
      latestDerivativeRef: null,
      documentReferenceRef: null,
      simulatorScenarioId: optionalRef(input.simulatorScenarioId),
      replacementForAttachmentPublicId: optionalRef(input.replacementForAttachmentPublicId),
      replacedByAttachmentPublicId: null,
      removedAt: null,
      promotedAt: null,
      reasonCodes: uniqueSorted(input.reasonCodes ?? []),
      createdAt: input.initiatedAt,
      updatedAt: input.initiatedAt,
      version: 1,
    };
  }

  async initiateUpload(input: InitiateAttachmentUploadInput): Promise<InitiateAttachmentUploadResult> {
    invariant(
      phase1AttachmentAcceptancePolicy.policyId === "AAP_141_PHASE1_ATTACHMENT_POLICY_V1",
      "ATTACHMENT_POLICY_MISSING",
      "The frozen seq_141 attachment policy is missing or stale.",
    );
    const idempotencyKey = this.createIdempotencyKey({
      draftPublicId: input.draftPublicId,
      checksumSha256: optionalRef(input.checksumSha256),
      byteSize: input.byteSize,
      declaredMimeType: input.declaredMimeType,
      clientUploadId: optionalRef(input.clientUploadId),
    });
    const existingSession = await this.repositories.findUploadSessionByIdempotencyKey(idempotencyKey);
    if (existingSession) {
      const existingAttachment = await this.repositories.getAttachment(existingSession.attachmentPublicId);
      invariant(!!existingAttachment, "ATTACHMENT_REPLAY_TARGET_MISSING", "Replayed upload session is missing its attachment.");
      return {
        accepted: true,
        uploadSession: existingSession,
        attachment: existingAttachment,
        duplicateReplayOfAttachmentPublicId: existingAttachment.attachmentPublicId,
        events: [],
      };
    }

    const rule = resolvePhase1AttachmentRule(input.fileName, input.declaredMimeType);
    const rejectionReasons: string[] = [];
    if (!rule) {
      rejectionReasons.push(
        extractExtension(input.fileName) ? "ATTACH_REASON_UNSUPPORTED_MIME" : "ATTACH_REASON_UNSUPPORTED_EXTENSION",
      );
      if (!phase1AttachmentAcceptancePolicy.acceptedMimeFamilies.includes(input.declaredMimeType.toLowerCase())) {
        rejectionReasons.push("ATTACH_REASON_UNSUPPORTED_MIME");
      }
    }
    if (input.byteSize > phase1AttachmentAcceptancePolicy.maxAcceptedBytes) {
      rejectionReasons.push("ATTACH_REASON_SIZE_EXCEEDED");
    }
    const attachmentPublicId = this.createAttachmentPublicId(
      `${input.draftPublicId}::${idempotencyKey}::${input.fileName}::${input.initiatedAt}`,
    );
    if (rejectionReasons.length > 0) {
      const rejected = this.createAttachmentRecord({
        attachmentPublicId,
        draftPublicId: input.draftPublicId,
        uploadSessionId: null,
        fileName: input.fileName,
        declaredMimeType: input.declaredMimeType,
        byteSize: input.byteSize,
        initiatedAt: input.initiatedAt,
        replacementForAttachmentPublicId: input.replacementForAttachmentPublicId,
        simulatorScenarioId: input.simulatorScenarioId,
        lifecycleState: "rejected_policy",
        outcomeRef: rejectionReasons.includes("ATTACH_REASON_SIZE_EXCEEDED")
          ? "ATTACH_OUTCOME_QUARANTINED_SIZE_EXCEEDED"
          : "ATTACH_REASON_UNSUPPORTED_MIME",
        currentSafeMode: "recovery_only",
        reasonCodes: rejectionReasons,
      });
      await this.repositories.saveAttachment(rejected);
      return {
        accepted: false,
        uploadSession: null,
        attachment: rejected,
        duplicateReplayOfAttachmentPublicId: null,
        events: [],
      };
    }

    const uploadSessionId = this.nextRef("attachmentUploadSession");
    const expiresAt = new Date(Date.parse(input.initiatedAt) + 15 * 60_000).toISOString();
    const uploadTarget = await this.objectStorage.issueQuarantineUploadTarget({
      attachmentPublicId,
      draftPublicId: input.draftPublicId,
      fileName: input.fileName,
      declaredMimeType: input.declaredMimeType,
      expiresAt,
    });
    const attachment = this.createAttachmentRecord({
      attachmentPublicId,
      draftPublicId: input.draftPublicId,
      uploadSessionId,
      fileName: input.fileName,
      declaredMimeType: input.declaredMimeType,
      byteSize: input.byteSize,
      initiatedAt: input.initiatedAt,
      replacementForAttachmentPublicId: input.replacementForAttachmentPublicId,
      simulatorScenarioId: input.simulatorScenarioId,
      lifecycleState: "upload_pending",
      outcomeRef: "ATTACH_RUNTIME_UPLOAD_PENDING",
      currentSafeMode: "structured_summary",
      reasonCodes: [],
    });
    const session: AttachmentUploadSessionSnapshot = {
      sessionSchemaVersion: "ATTACHMENT_UPLOAD_SESSION_V1",
      uploadSessionId,
      attachmentPublicId,
      draftPublicId: input.draftPublicId,
      duplicateDisposition: input.replacementForAttachmentPublicId
        ? "replacement_capture"
        : "new_capture",
      signedUploadTarget: uploadTarget.target,
      quarantineObjectKey: uploadTarget.objectKey,
      idempotencyKey,
      transportState: "active",
      initiatedAt: input.initiatedAt,
      expiresAt,
      replacementForAttachmentPublicId: optionalRef(input.replacementForAttachmentPublicId),
      uploadToken: uploadTarget.uploadToken,
      version: 1,
    };
    const events = [
      emitIntakeAttachmentInitiated({
        attachmentPublicId,
        draftPublicId: input.draftPublicId,
        uploadSessionId,
        duplicateDisposition: session.duplicateDisposition,
      }),
    ];
    await this.repositories.saveAttachment(attachment);
    await this.repositories.saveUploadSession(session);
    return {
      accepted: true,
      uploadSession: session,
      attachment,
      duplicateReplayOfAttachmentPublicId: null,
      events,
    };
  }

  async recordUpload(input: RecordAttachmentUploadInput): Promise<RecordAttachmentUploadResult> {
    const session = await this.repositories.getUploadSession(input.uploadSessionId);
    invariant(!!session, "ATTACHMENT_UPLOAD_SESSION_NOT_FOUND", "Unknown attachment upload session.");
    const attachment = await this.repositories.getAttachment(session.attachmentPublicId);
    invariant(!!attachment, "ATTACHMENT_RECORD_NOT_FOUND", "Unknown attachment record.");

    const bytes = toBytes(input.bytes);
    const settled = await this.objectStorage.settleQuarantineUpload({
      uploadToken: requireRef(session.uploadToken, "uploadToken"),
      fileName: input.fileName,
      reportedMimeType: input.reportedMimeType,
      checksumSha256: optionalRef(input.checksumSha256),
      bytes,
      uploadedAt: input.uploadedAt,
    });
    const fingerprint = this.toContentFingerprint({
      checksumSha256: settled.checksumSha256,
      byteSize: settled.byteSize,
      detectedMimeType: settled.mediaType,
    });
    const duplicate = await this.repositories.findAttachmentByFingerprint(
      attachment.draftPublicId,
      fingerprint,
    );
    if (duplicate && duplicate.attachmentPublicId !== attachment.attachmentPublicId) {
      const replayedAttachment: Phase1AttachmentRecordSnapshot = {
        ...attachment,
        detectedMimeType: settled.mediaType,
        checksumSha256: settled.checksumSha256,
        contentFingerprint: fingerprint,
        lifecycleState: "replaced",
        outcomeRef: "ATTACH_REASON_DUPLICATE_REPLAY",
        currentSafeMode: "recovery_only",
        quarantineState: "not_quarantined",
        reasonCodes: uniqueSorted([...attachment.reasonCodes, "ATTACH_REASON_DUPLICATE_REPLAY"]),
        replacedByAttachmentPublicId: duplicate.attachmentPublicId,
        updatedAt: input.uploadedAt,
        version: nextVersion(attachment.version),
      };
      const replayedSession: AttachmentUploadSessionSnapshot = {
        ...session,
        duplicateDisposition: "idempotent_replay",
        signedUploadTarget: null,
        transportState: "replayed",
        expiresAt: null,
        version: nextVersion(session.version),
      };
      await this.repositories.saveAttachment(replayedAttachment, {
        expectedVersion: attachment.version,
      });
      await this.repositories.saveUploadSession(replayedSession, {
        expectedVersion: session.version,
      });
      return {
        attachment: replayedAttachment,
        uploadSession: replayedSession,
        replayedToAttachmentPublicId: duplicate.attachmentPublicId,
        events: [],
      };
    }

    const updatedAttachment: Phase1AttachmentRecordSnapshot = {
      ...attachment,
      byteSize: settled.byteSize,
      detectedMimeType: settled.mediaType,
      checksumSha256: settled.checksumSha256,
      contentFingerprint: fingerprint,
      quarantineObjectKey: settled.objectKey,
      lifecycleState: "uploaded_unverified",
      outcomeRef: "ATTACH_RUNTIME_UPLOADED_UNVERIFIED",
      currentSafeMode: "structured_summary",
      quarantineState: "processing",
      updatedAt: input.uploadedAt,
      version: nextVersion(attachment.version),
    };
    const updatedSession: AttachmentUploadSessionSnapshot = {
      ...session,
      transportState: "uploaded",
      quarantineObjectKey: settled.objectKey,
      version: nextVersion(session.version),
    };
    await this.repositories.saveAttachment(updatedAttachment, {
      expectedVersion: attachment.version,
    });
    await this.repositories.saveUploadSession(updatedSession, {
      expectedVersion: session.version,
    });
    return {
      attachment: updatedAttachment,
      uploadSession: updatedSession,
      replayedToAttachmentPublicId: null,
      events: [
        emitIntakeAttachmentUploaded({
          attachmentPublicId: updatedAttachment.attachmentPublicId,
          draftPublicId: updatedAttachment.draftPublicId,
          quarantineObjectKey: requireRef(updatedAttachment.quarantineObjectKey, "quarantineObjectKey"),
          checksumSha256: requireRef(updatedAttachment.checksumSha256, "checksumSha256"),
        }),
      ],
    };
  }

  private quarantineOutcome(
    verdict: AttachmentScannerResult,
  ): Phase1AttachmentClassificationOutcome | undefined {
    switch (verdict.verdict) {
      case "malware":
        return resolvePhase1AttachmentOutcome("quarantined_malware");
      case "integrity_failure":
        return resolvePhase1AttachmentOutcome("quarantined_integrity_failure");
      case "unsupported_type":
        return resolvePhase1AttachmentOutcome("quarantined_unsupported_type");
      case "unreadable":
        return resolvePhase1AttachmentOutcome("quarantined_unreadable");
      case "size_exceeded":
        return resolvePhase1AttachmentOutcome("quarantined_size_exceeded");
      default:
        return undefined;
    }
  }

  async runWorkerCycle(options?: { now?: string }): Promise<AttachmentWorkerRunResult> {
    const events: SubmissionLineageEventEnvelope<unknown>[] = [];
    const settlements: AttachmentScanSettlement[] = [];
    const changedDraftPublicIds = new Set<string>();
    const now = nowOr(options?.now);
    const worklist = await this.collectPendingAttachments();
    for (const attachment of worklist) {
      changedDraftPublicIds.add(attachment.draftPublicId);
      const scanningAttachment: Phase1AttachmentRecordSnapshot = {
        ...attachment,
        lifecycleState: "scanning",
        outcomeRef: "ATTACH_RUNTIME_SCANNING",
        currentSafeMode: "structured_summary",
        quarantineState: "processing",
        updatedAt: now,
        version: nextVersion(attachment.version),
      };
      await this.repositories.saveAttachment(scanningAttachment, {
        expectedVersion: attachment.version,
      });
      events.push(
        emitIntakeAttachmentScanning({
          attachmentPublicId: scanningAttachment.attachmentPublicId,
          draftPublicId: scanningAttachment.draftPublicId,
          scanAttemptRef: `${scanningAttachment.attachmentPublicId}::pending`,
          quarantineObjectKey: requireRef(scanningAttachment.quarantineObjectKey, "quarantineObjectKey"),
        }),
      );
      const quarantineObject = await this.objectStorage.getObject(
        requireRef(scanningAttachment.quarantineObjectKey, "quarantineObjectKey"),
      );
      invariant(!!quarantineObject, "ATTACHMENT_QUARANTINE_OBJECT_MISSING", "Quarantine object is required before scanning.");
      const scanResult = await this.scanner.scanAttachment({
        attachmentPublicId: scanningAttachment.attachmentPublicId,
        draftPublicId: scanningAttachment.draftPublicId,
        fileName: scanningAttachment.fileName,
        declaredMimeType: scanningAttachment.declaredMimeType,
        detectedMimeType: quarantineObject.mediaType,
        byteSize: quarantineObject.byteSize,
        checksumSha256: quarantineObject.checksumSha256,
        suppliedChecksumSha256: scanningAttachment.checksumSha256,
        quarantineObjectKey: quarantineObject.objectKey,
        simulatorScenarioId: scanningAttachment.simulatorScenarioId,
        startedAt: now,
      });
      const scanAttemptRef = this.nextRef("attachmentScanAttempt");
      await this.repositories.saveScanAttempt({
        scanAttemptRef,
        attachmentPublicId: scanningAttachment.attachmentPublicId,
        draftPublicId: scanningAttachment.draftPublicId,
        scannerRef: scanResult.scannerRef,
        scenarioId: scanResult.scenarioId,
        verdict: scanResult.verdict,
        detectedMimeType: scanResult.detectedMimeType,
        reasonCodes: uniqueSorted(scanResult.reasonCodes),
        startedAt: now,
        settledAt: scanResult.settledAt,
        version: 1,
      });
      if (scanResult.verdict === "timeout_retryable") {
        const retryableAttachment: Phase1AttachmentRecordSnapshot = {
          ...scanningAttachment,
          detectedMimeType: scanResult.detectedMimeType,
          latestScanAttemptRef: scanAttemptRef,
          lifecycleState: "scan_failed_retryable",
          outcomeRef: "ATTACH_REASON_SCAN_TIMEOUT",
          currentSafeMode: "recovery_only",
          quarantineState: "processing",
          reasonCodes: uniqueSorted([...scanResult.reasonCodes, "ATTACH_REASON_SCAN_TIMEOUT"]),
          updatedAt: scanResult.settledAt,
          version: nextVersion(scanningAttachment.version),
        };
        await this.repositories.saveAttachment(retryableAttachment, {
          expectedVersion: scanningAttachment.version,
        });
        settlements.push({
          settlementSchemaVersion: "ATTACHMENT_SCAN_SETTLEMENT_V1",
          attachmentPublicId: retryableAttachment.attachmentPublicId,
          draftPublicId: retryableAttachment.draftPublicId,
          lifecycleState: retryableAttachment.lifecycleState,
          scanAttemptRef,
          classificationOutcome: null,
          outcomeRef: retryableAttachment.outcomeRef,
          reasonCodes: retryableAttachment.reasonCodes,
          currentSafeMode: retryableAttachment.currentSafeMode,
          documentReferenceState: retryableAttachment.documentReferenceState,
          quarantineState: retryableAttachment.quarantineState,
          durableObjectKey: retryableAttachment.durableObjectKey,
          previewObjectKey: retryableAttachment.previewObjectKey,
          documentReferenceRef: retryableAttachment.documentReferenceRef,
          settledAt: retryableAttachment.updatedAt,
        });
        continue;
      }

      const quarantineOutcome = this.quarantineOutcome(scanResult);
      if (quarantineOutcome) {
        const quarantinedAttachment: Phase1AttachmentRecordSnapshot = {
          ...scanningAttachment,
          detectedMimeType: scanResult.detectedMimeType,
          latestScanAttemptRef: scanAttemptRef,
          lifecycleState: "quarantined",
          classificationOutcome: quarantineOutcome.outcome,
          outcomeRef: quarantineOutcome.outcomeRef,
          currentSafeMode: "recovery_only",
          quarantineState: "quarantined",
          artifactModeRef: resolvePhase1AttachmentArtifactMode(quarantineOutcome.outcome)?.modeKey ?? null,
          reasonCodes: uniqueSorted(scanResult.reasonCodes),
          updatedAt: scanResult.settledAt,
          version: nextVersion(scanningAttachment.version),
        };
        await this.repositories.saveAttachment(quarantinedAttachment, {
          expectedVersion: scanningAttachment.version,
        });
        events.push(
          emitIntakeAttachmentQuarantined({
            attachmentPublicId: quarantinedAttachment.attachmentPublicId,
            draftPublicId: quarantinedAttachment.draftPublicId,
            scanAttemptRef,
            classificationOutcome: quarantineOutcome.outcome as
              | "quarantined_malware"
              | "quarantined_integrity_failure"
              | "quarantined_unsupported_type"
              | "quarantined_unreadable"
              | "quarantined_size_exceeded",
          }),
        );
        settlements.push({
          settlementSchemaVersion: "ATTACHMENT_SCAN_SETTLEMENT_V1",
          attachmentPublicId: quarantinedAttachment.attachmentPublicId,
          draftPublicId: quarantinedAttachment.draftPublicId,
          lifecycleState: quarantinedAttachment.lifecycleState,
          scanAttemptRef,
          classificationOutcome: quarantinedAttachment.classificationOutcome,
          outcomeRef: quarantinedAttachment.outcomeRef,
          reasonCodes: quarantinedAttachment.reasonCodes,
          currentSafeMode: quarantinedAttachment.currentSafeMode,
          documentReferenceState: quarantinedAttachment.documentReferenceState,
          quarantineState: quarantinedAttachment.quarantineState,
          durableObjectKey: quarantinedAttachment.durableObjectKey,
          previewObjectKey: quarantinedAttachment.previewObjectKey,
          documentReferenceRef: quarantinedAttachment.documentReferenceRef,
          settledAt: quarantinedAttachment.updatedAt,
        });
        continue;
      }

      const promotedObject = await this.objectStorage.promoteObject({
        sourceObjectKey: requireRef(scanningAttachment.quarantineObjectKey, "quarantineObjectKey"),
        attachmentPublicId: scanningAttachment.attachmentPublicId,
        fileName: scanningAttachment.fileName,
        promotedAt: scanResult.settledAt,
      });
      const derivative = await this.objectStorage.createDerivative({
        sourceObjectKey: promotedObject.objectKey,
        attachmentPublicId: scanningAttachment.attachmentPublicId,
        fileName: scanningAttachment.fileName,
        durableMediaType: promotedObject.mediaType,
        durableByteSize: promotedObject.byteSize,
        durableChecksumSha256: promotedObject.checksumSha256,
        simulatorScenarioId: scanningAttachment.simulatorScenarioId,
        generatedAt: scanResult.settledAt,
      });
      const derivativeRef = this.nextRef("attachmentDerivativeSettlement");
      await this.repositories.saveDerivativeSettlement({
        derivativeRef,
        attachmentPublicId: scanningAttachment.attachmentPublicId,
        settlementState: derivative.settlementState,
        derivativeObjectKey: derivative.descriptor?.objectKey ?? null,
        reasonCodes: uniqueSorted(derivative.reasonCodes),
        generatedAt: scanResult.settledAt,
        version: 1,
      });
      const classificationOutcome =
        derivative.settlementState === "failed" || derivative.settlementState === "not_required"
          ? resolvePhase1AttachmentOutcome("preview_unavailable_but_file_kept")
          : resolvePhase1AttachmentOutcome("accepted_safe");
      invariant(
        !!classificationOutcome,
        "ATTACHMENT_CLASSIFICATION_OUTCOME_MISSING",
        "Safe attachment classification outcome must exist.",
      );
      const documentReferenceLogicalId = `docref_${stableDigest(`${scanningAttachment.attachmentPublicId}::${promotedObject.checksumSha256}`).slice(0, 16)}`;
      const link: AttachmentDocumentReferenceLinkSnapshot = {
        linkSchemaVersion: "ATTACHMENT_DOCUMENT_REFERENCE_LINK_V1",
        linkRef: this.nextRef("attachmentDocumentReferenceLink"),
        attachmentPublicId: scanningAttachment.attachmentPublicId,
        draftPublicId: scanningAttachment.draftPublicId,
        requestPublicId: scanningAttachment.requestPublicId,
        documentReferenceLogicalId,
        documentReferenceRecordRef: `fhir_record_${documentReferenceLogicalId}`,
        representationSetRef: `fhir_set_attachment_${scanningAttachment.attachmentPublicId}`,
        durableObjectKey: promotedObject.objectKey,
        checksumSha256: promotedObject.checksumSha256,
        linkedAt: scanResult.settledAt,
        version: 1,
      };
      await this.repositories.saveDocumentReferenceLink(link);
      const promotedAttachment: Phase1AttachmentRecordSnapshot = {
        ...scanningAttachment,
        detectedMimeType: scanResult.detectedMimeType,
        checksumSha256: promotedObject.checksumSha256,
        latestScanAttemptRef: scanAttemptRef,
        latestDerivativeRef: derivativeRef,
        lifecycleState: "promoted",
        classificationOutcome: classificationOutcome.outcome,
        outcomeRef: classificationOutcome.outcomeRef,
        currentSafeMode:
          classificationOutcome.outcome === "accepted_safe"
            ? "governed_preview"
            : "placeholder_only",
        documentReferenceState: "created",
        quarantineState: "not_quarantined",
        artifactModeRef: resolvePhase1AttachmentArtifactMode(classificationOutcome.outcome)?.modeKey ?? null,
        durableObjectKey: promotedObject.objectKey,
        previewObjectKey: derivative.descriptor?.objectKey ?? null,
        documentReferenceRef: link.linkRef,
        promotedAt: scanResult.settledAt,
        reasonCodes: uniqueSorted(derivative.reasonCodes),
        updatedAt: scanResult.settledAt,
        version: nextVersion(scanningAttachment.version),
      };
      await this.repositories.saveAttachment(promotedAttachment, {
        expectedVersion: scanningAttachment.version,
      });
      events.push(
        emitIntakeAttachmentSafe({
          attachmentPublicId: promotedAttachment.attachmentPublicId,
          draftPublicId: promotedAttachment.draftPublicId,
          scanAttemptRef,
          classificationOutcome: classificationOutcome.outcome as
            | "accepted_safe"
            | "preview_unavailable_but_file_kept",
        }),
      );
      if (derivative.descriptor) {
        events.push(
          emitIntakeAttachmentPreviewGenerated({
            attachmentPublicId: promotedAttachment.attachmentPublicId,
            draftPublicId: promotedAttachment.draftPublicId,
            thumbnailKey: derivative.descriptor.objectKey,
          }),
        );
      }
      events.push(
        emitIntakeAttachmentPromoted({
          attachmentPublicId: promotedAttachment.attachmentPublicId,
          draftPublicId: promotedAttachment.draftPublicId,
          documentReferenceRef: link.linkRef,
          durableObjectKey: promotedObject.objectKey,
        }),
      );
      settlements.push({
        settlementSchemaVersion: "ATTACHMENT_SCAN_SETTLEMENT_V1",
        attachmentPublicId: promotedAttachment.attachmentPublicId,
        draftPublicId: promotedAttachment.draftPublicId,
        lifecycleState: promotedAttachment.lifecycleState,
        scanAttemptRef,
        classificationOutcome: promotedAttachment.classificationOutcome,
        outcomeRef: promotedAttachment.outcomeRef,
        reasonCodes: promotedAttachment.reasonCodes,
        currentSafeMode: promotedAttachment.currentSafeMode,
        documentReferenceState: promotedAttachment.documentReferenceState,
        quarantineState: promotedAttachment.quarantineState,
        durableObjectKey: promotedAttachment.durableObjectKey,
        previewObjectKey: promotedAttachment.previewObjectKey,
        documentReferenceRef: promotedAttachment.documentReferenceRef,
        settledAt: promotedAttachment.updatedAt,
      });
      if (promotedAttachment.replacementForAttachmentPublicId) {
        const superseded = await this.repositories.getAttachment(
          promotedAttachment.replacementForAttachmentPublicId,
        );
        if (superseded && superseded.lifecycleState !== "removed" && superseded.lifecycleState !== "replaced") {
          const replaced: Phase1AttachmentRecordSnapshot = {
            ...superseded,
            lifecycleState: "replaced",
            outcomeRef: "ATTACH_REASON_REPLACED_SUPERSEDED",
            currentSafeMode: "recovery_only",
            replacedByAttachmentPublicId: promotedAttachment.attachmentPublicId,
            reasonCodes: uniqueSorted([...superseded.reasonCodes, "ATTACH_REASON_REPLACED_SUPERSEDED"]),
            updatedAt: promotedAttachment.updatedAt,
            version: nextVersion(superseded.version),
          };
          await this.repositories.saveAttachment(replaced, { expectedVersion: superseded.version });
          events.push(
            emitIntakeAttachmentReplaced({
              attachmentPublicId: replaced.attachmentPublicId,
              draftPublicId: replaced.draftPublicId,
              replacedByAttachmentPublicId: promotedAttachment.attachmentPublicId,
            }),
          );
        }
      }
    }
    return {
      changedDraftPublicIds: [...changedDraftPublicIds].sort(),
      events,
      settlements,
    };
  }

  private async collectPendingAttachments(): Promise<readonly Phase1AttachmentRecordSnapshot[]> {
    return (await this.repositories.listAllAttachments())
      .filter(
        (attachment) =>
          attachment.lifecycleState === "uploaded_unverified" ||
          attachment.lifecycleState === "scan_failed_retryable",
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async removeAttachment(input: RemoveAttachmentInput): Promise<RemoveAttachmentResult> {
    const attachment = await this.repositories.getAttachment(input.attachmentPublicId);
    invariant(!!attachment, "ATTACHMENT_RECORD_NOT_FOUND", "Unknown attachment record.");
    if (attachment.lifecycleState === "removed") {
      return { attachment, events: [] };
    }
    const removed: Phase1AttachmentRecordSnapshot = {
      ...attachment,
      lifecycleState: "removed",
      outcomeRef: input.reasonCode ?? "ATTACH_REASON_REMOVED_BY_USER",
      currentSafeMode: "recovery_only",
      reasonCodes: uniqueSorted([...attachment.reasonCodes, input.reasonCode ?? "ATTACH_REASON_REMOVED_BY_USER"]),
      removedAt: input.removedAt,
      updatedAt: input.removedAt,
      version: nextVersion(attachment.version),
    };
    await this.repositories.saveAttachment(removed, { expectedVersion: attachment.version });
    return {
      attachment: removed,
      events: [
        emitIntakeAttachmentRemoved({
          attachmentPublicId: removed.attachmentPublicId,
          draftPublicId: removed.draftPublicId,
          reasonCode: input.reasonCode ?? "ATTACH_REASON_REMOVED_BY_USER",
        }),
      ],
    };
  }

  async bindReplacement(input: ReplaceAttachmentBindingInput): Promise<Phase1AttachmentRecordSnapshot> {
    const current = await this.repositories.getAttachment(input.supersededAttachmentPublicId);
    invariant(!!current, "ATTACHMENT_RECORD_NOT_FOUND", "Unknown attachment record.");
    const replaced: Phase1AttachmentRecordSnapshot = {
      ...current,
      lifecycleState: "replaced",
      outcomeRef: "ATTACH_REASON_REPLACED_SUPERSEDED",
      currentSafeMode: "recovery_only",
      replacedByAttachmentPublicId: input.replacementAttachmentPublicId,
      reasonCodes: uniqueSorted([...current.reasonCodes, "ATTACH_REASON_REPLACED_SUPERSEDED"]),
      updatedAt: input.replacedAt,
      version: nextVersion(current.version),
    };
    await this.repositories.saveAttachment(replaced, { expectedVersion: current.version });
    return replaced;
  }

  async getAttachment(attachmentPublicId: string): Promise<Phase1AttachmentRecordSnapshot | undefined> {
    return this.repositories.getAttachment(attachmentPublicId);
  }

  async getDocumentReferenceLink(
    attachmentPublicId: string,
  ): Promise<AttachmentDocumentReferenceLinkSnapshot | undefined> {
    return this.repositories.getDocumentReferenceLinkForAttachment(attachmentPublicId);
  }

  async bindPromotedRequest(
    input: BindPromotedRequestInput,
  ): Promise<Phase1AttachmentRecordSnapshot> {
    const attachment = await this.repositories.getAttachment(input.attachmentPublicId);
    invariant(!!attachment, "ATTACHMENT_RECORD_NOT_FOUND", "Unknown attachment record.");
    const updated: Phase1AttachmentRecordSnapshot = {
      ...attachment,
      requestPublicId: input.requestPublicId,
      updatedAt: input.boundAt,
      version: nextVersion(attachment.version),
    };
    await this.repositories.saveAttachment(updated, { expectedVersion: attachment.version });
    const link = await this.repositories.getDocumentReferenceLinkForAttachment(input.attachmentPublicId);
    if (link) {
      await this.repositories.saveDocumentReferenceLink({
        ...link,
        requestPublicId: input.requestPublicId,
        version: nextVersion(link.version),
      });
    }
    return updated;
  }

  async listActiveAttachmentRefsForDraft(draftPublicId: string): Promise<readonly string[]> {
    const attachments = await this.repositories.listAttachmentsByDraftPublicId(draftPublicId);
    return attachments
      .filter(
        (attachment) =>
          attachment.lifecycleState !== "removed" && attachment.lifecycleState !== "replaced",
      )
      .map((attachment) => attachment.attachmentPublicId)
      .sort();
  }

  async listDraftAttachmentProjection(
    draftPublicId: string,
  ): Promise<readonly DraftAttachmentProjectionCard[]> {
    const attachments = await this.repositories.listAttachmentsByDraftPublicId(draftPublicId);
    return attachments
      .filter(
        (attachment) =>
          attachment.lifecycleState !== "removed" && attachment.lifecycleState !== "replaced",
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map((attachment) => this.summarizeAttachment(attachment));
  }

  async listPromotedRequestAttachmentSummaries(
    requestPublicId: string,
  ): Promise<readonly PromotedRequestAttachmentSummary[]> {
    const attachments = await this.repositories.listAttachmentsByRequestPublicId(requestPublicId);
    return attachments
      .filter((attachment) => attachment.lifecycleState === "promoted" && !!attachment.documentReferenceRef)
      .map((attachment) => ({
        requestPublicId,
        attachmentPublicId: attachment.attachmentPublicId,
        fileName: attachment.fileName,
        documentReferenceRef: requireRef(attachment.documentReferenceRef, "documentReferenceRef"),
        currentSafeMode: attachment.currentSafeMode,
        linkedAt: attachment.promotedAt ?? attachment.updatedAt,
      }));
  }

  async buildSubmissionAttachmentStates(
    draftPublicId: string,
  ): Promise<readonly SubmissionAttachmentStateView[]> {
    const attachments = await this.repositories.listAttachmentsByDraftPublicId(draftPublicId);
    return attachments
      .filter(
        (attachment) =>
          attachment.lifecycleState !== "removed" && attachment.lifecycleState !== "replaced",
      )
      .map((attachment) => this.toSubmissionAttachmentState(attachment));
  }

  async createArtifactPresentation(input: {
    attachmentPublicId: string;
    action: "open_in_browser" | "download" | "external_handoff";
    routeFamilyRef: string;
    continuityKey: string;
    selectedAnchorRef: string;
    returnTargetRef: string;
    requestedAt: string;
  }): Promise<AttachmentArtifactPresentationView> {
    const attachment = await this.repositories.getAttachment(input.attachmentPublicId);
    invariant(!!attachment, "ATTACHMENT_RECORD_NOT_FOUND", "Unknown attachment record.");
    const contract: AttachmentArtifactPresentationContract = {
      contractId: phase1AttachmentAcceptancePolicy.artifactPresentationContract.artifactPresentationContractId,
      artifactKind: "intake_attachment",
      summaryRequired: true,
      previewPolicy:
        attachment.currentSafeMode === "governed_preview"
          ? "governed_preview"
          : attachment.currentSafeMode === "placeholder_only"
            ? "summary_only"
            : "hidden",
      downloadPolicy:
        attachment.lifecycleState === "promoted" ? "grant_required" : "forbidden",
      printPolicy: "forbidden",
      handoffPolicy:
        attachment.lifecycleState === "promoted" ? "grant_required" : "forbidden",
      requiredSummaryAuthority: "verified_or_provisional",
      source_refs: phase1AttachmentAcceptancePolicy.sourcePrecedence,
    };
    let grant: AttachmentOutboundNavigationGrant | null = null;
    if (attachment.lifecycleState === "promoted") {
      const objectKey =
        input.action === "open_in_browser" && attachment.previewObjectKey
          ? attachment.previewObjectKey
          : attachment.durableObjectKey;
      invariant(
        !!objectKey,
        "ATTACHMENT_ARTIFACT_OBJECT_MISSING",
        "Promoted attachments require a durable or preview object.",
      );
      const expiresAt = new Date(Date.parse(input.requestedAt) + 5 * 60_000).toISOString();
      const token = await this.objectStorage.issueReadToken({
        attachmentPublicId: attachment.attachmentPublicId,
        objectKey,
        action: input.action,
        expiresAt,
      });
      grant = {
        grantId: this.nextRef("attachmentReadGrant"),
        state: "active",
        destinationLabel: attachment.fileName,
        destinationType:
          input.action === "external_handoff" ? "external_browser" : "browser_overlay",
        routeFamilyRef: input.routeFamilyRef,
        continuityKey: input.continuityKey,
        selectedAnchorRef: input.selectedAnchorRef,
        returnTargetRef: input.returnTargetRef,
        expiresAt: token.expiresAt,
        scrubbedDestination: token.scrubbedDestination,
        reason: input.action,
        source_refs: phase1AttachmentAcceptancePolicy.sourcePrecedence,
      };
      await this.repositories.saveReadGrant({
        ...grant,
        attachmentPublicId: attachment.attachmentPublicId,
        objectKey,
        action: input.action,
        version: 1,
      });
    }
    return {
      attachmentPublicId: attachment.attachmentPublicId,
      classificationOutcome: attachment.classificationOutcome,
      contract,
      summary: {
        title: attachment.fileName,
        detail:
          resolvePhase1AttachmentOutcome(attachment.classificationOutcome ?? "")?.patientVisiblePosture ??
          attachment.lifecycleState.replaceAll("_", " "),
        parityState:
          attachment.currentSafeMode === "governed_preview"
            ? "governed_preview"
            : attachment.currentSafeMode === "placeholder_only"
              ? "placeholder_only"
              : "recovery_only",
      },
      grant,
    };
  }
}

export function createPhase1AttachmentPipelineStore() {
  return new InMemoryPhase1AttachmentPipelineStore();
}

export function createInMemoryAttachmentObjectStorage() {
  return new InMemoryAttachmentObjectStorage();
}

export function createPhase1AttachmentPipelineService(input: {
  repositories?: Phase1AttachmentPipelineRepositories;
  objectStorage?: AttachmentObjectStorageAdapter;
  scanner: AttachmentScannerAdapter;
  idGenerator?: BackboneIdGenerator;
}) {
  return new Phase1AttachmentPipelineService({
    repositories: input.repositories ?? createPhase1AttachmentPipelineStore(),
    objectStorage: input.objectStorage ?? createInMemoryAttachmentObjectStorage(),
    scanner: input.scanner,
    idGenerator: input.idGenerator,
  });
}

export const phase1AttachmentPipelineContract = {
  artifactId: "PHASE1_ATTACHMENT_PIPELINE_V1",
  taskRef: "par_146",
  policyRef: phase1AttachmentAcceptancePolicy.policyId,
  publicSchemas: [
    "AttachmentUploadSession",
    "AttachmentScanSettlement",
    "AttachmentDocumentReferenceLink",
  ],
  lifecycleStates: [
    "initiated",
    "upload_pending",
    "uploaded_unverified",
    "scanning",
    "safe_pending_promotion",
    "promoted",
    "quarantined",
    "rejected_policy",
    "scan_failed_retryable",
    "removed",
    "replaced",
  ] satisfies readonly AttachmentLifecycleState[],
  reasonCodes: phase1AttachmentReasonCodes.map((row) => row.reasonCode),
  sourceRefs: [
    "prompt/146.md",
    "prompt/shared_operating_contract_146_to_155.md",
    "data/contracts/141_attachment_acceptance_policy.json",
    "data/contracts/141_attachment_projection_and_artifact_modes.json",
  ],
} as const;
