import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
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

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function saveWithCas<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  } else if (current) {
    invariant(
      current.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, row);
}

function setSecondaryKey(map: Map<string, string>, secondaryKey: string, primaryKey: string): void {
  map.set(secondaryKey, primaryKey);
}

function assertUniqueSecondaryKey(
  map: Map<string, string>,
  secondaryKey: string,
  primaryKey: string,
  errorCode: string,
  fieldName: string,
): void {
  const current = map.get(secondaryKey);
  invariant(
    current === undefined || current === primaryKey,
    errorCode,
    `${fieldName} ${secondaryKey} is already bound to ${current}.`,
  );
}

function sha256Hex(value: string | Uint8Array): string {
  const hash = createHash("sha256");
  hash.update(value);
  return hash.digest("hex");
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(value);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

const TRANSPORT_ONLY_KEYS = new Set([
  "trace",
  "traceId",
  "trace_id",
  "spanId",
  "span_id",
  "requestId",
  "request_id",
  "receivedAt",
  "received_at",
  "deliveredAt",
  "delivered_at",
  "transportTimestamp",
  "transport_timestamp",
  "transportFrame",
  "transport_frame",
  "transportAttempt",
  "transport_attempt",
  "signature",
  "nonce",
  "headerDigest",
  "header_digest",
  "userAgent",
  "user_agent",
  "xTrace",
  "x_trace",
]);

function canonicalizeSemanticValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return normalizeWhitespace(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeSemanticValue(item));
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString("base64");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key, nested]) => !TRANSPORT_ONLY_KEYS.has(key) && nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalizeSemanticValue(nested)] as const);
    return Object.fromEntries(entries);
  }
  return String(value);
}

function rawPayloadBytes(payload: unknown): string | Uint8Array {
  if (typeof payload === "string" || payload instanceof Uint8Array) {
    return payload;
  }
  return stableJsonStringify(payload);
}

function compositeKey(parts: readonly (string | number | null | undefined)[]): string {
  return parts.map((part) => (part === null || part === undefined ? "" : String(part))).join("::");
}

function orderingRank(orderingKey: string): string {
  const trimmed = orderingKey.trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed.padStart(20, "0");
  }
  return trimmed;
}

function compareOrderingKeys(left: string, right: string): number {
  return orderingRank(left).localeCompare(orderingRank(right));
}

export type IdempotencyDecisionClass =
  | "exact_replay"
  | "semantic_replay"
  | "collision_review"
  | "distinct";

export type ReplayCollisionClass =
  | "source_id_reuse"
  | "transport_correlation_reuse"
  | "idempotency_key_reuse"
  | "callback_scope_drift";

export type ReplayCollisionReviewState =
  | "open"
  | "resolved_replay"
  | "resolved_distinct"
  | "resolved_abuse_blocked";

export type AdapterDispatchAttemptStatus =
  | "pending"
  | "dispatched"
  | "transport_acked"
  | "awaiting_callback"
  | "confirmed"
  | "duplicate_accepted"
  | "collision_review"
  | "failed"
  | "superseded";

export type AdapterReceiptDecisionClass =
  | "accepted_new"
  | "exact_replay"
  | "semantic_replay"
  | "stale_ignored"
  | "collision_review";

export type SourceCommandIdentifierFamily = "command_id" | "idempotency_key";

export interface ReplayScopeComponents {
  governingObjectRef: string;
  governingObjectVersionRef?: string | null;
  routeIntentTupleHash?: string | null;
  routeContractDigestRef?: string | null;
  audienceSurfaceRuntimeBindingRef?: string | null;
  releaseTrustFreezeVerdictRef?: string | null;
}

export interface CanonicalReplayHashInput {
  actionScope: string;
  governingLineageRef: string;
  effectiveActorRef: string;
  causalParentRef?: string | null;
  intentGeneration: number;
  scope: ReplayScopeComponents;
  expectedEffectSetRefs: readonly string[];
  rawPayload: unknown;
  semanticPayload: unknown;
}

export interface CanonicalReplayHashOutput {
  rawPayloadHash: string;
  semanticPayloadHash: string;
  replayKey: string;
  scopeFingerprint: string;
  expectedEffectSetHash: string;
  effectScopeKey: string;
  semanticCanonicalPayload: string;
}

export function canonicalizeSemanticPayload(payload: unknown): string {
  return stableJsonStringify(canonicalizeSemanticValue(payload));
}

export function buildCanonicalReplayHashes(
  input: CanonicalReplayHashInput,
): CanonicalReplayHashOutput {
  const semanticCanonicalPayload = canonicalizeSemanticPayload(input.semanticPayload);
  const rawPayloadHash = sha256Hex(rawPayloadBytes(input.rawPayload));
  const semanticPayloadHash = sha256Hex(semanticCanonicalPayload);
  const expectedEffectSetHash = sha256Hex(
    stableJsonStringify(uniqueSortedRefs(input.expectedEffectSetRefs)),
  );
  const scopeFingerprint = sha256Hex(
    compositeKey([
      input.actionScope,
      input.governingLineageRef,
      input.scope.governingObjectRef,
      optionalRef(input.scope.governingObjectVersionRef),
      optionalRef(input.scope.routeIntentTupleHash),
      optionalRef(input.scope.routeContractDigestRef),
      optionalRef(input.scope.audienceSurfaceRuntimeBindingRef),
      optionalRef(input.scope.releaseTrustFreezeVerdictRef),
    ]),
  );
  const replayKey = sha256Hex(
    compositeKey([
      input.actionScope,
      input.governingLineageRef,
      requireRef(input.effectiveActorRef, "effectiveActorRef"),
      semanticPayloadHash,
      optionalRef(input.causalParentRef),
      input.intentGeneration,
    ]),
  );
  const effectScopeKey = sha256Hex(
    compositeKey([
      input.actionScope,
      input.governingLineageRef,
      scopeFingerprint,
      expectedEffectSetHash,
      input.intentGeneration,
    ]),
  );

  return {
    rawPayloadHash,
    semanticPayloadHash,
    replayKey,
    scopeFingerprint,
    expectedEffectSetHash,
    effectScopeKey,
    semanticCanonicalPayload,
  };
}

export interface IdempotencyRecordSnapshot {
  idempotencyRecordId: string;
  actionScope: string;
  governingLineageRef: string;
  sourceCommandId: string | null;
  sourceCommandIdFamily: SourceCommandIdentifierFamily;
  transportCorrelationId: string | null;
  rawPayloadHash: string;
  semanticPayloadHash: string;
  replayKey: string;
  scopeFingerprint: string;
  effectScopeKey: string;
  causalParentRef: string | null;
  intentGeneration: number;
  expectedEffectSetHash: string;
  decisionClass: IdempotencyDecisionClass;
  firstAcceptedActionRecordRef: string;
  acceptedSettlementRef: string;
  collisionReviewRef: string | null;
  decisionBasisRef: string;
  replayWindowClosedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedIdempotencyRecordRow extends IdempotencyRecordSnapshot {
  aggregateType: "IdempotencyRecord";
  persistenceSchemaVersion: 1;
}

export class IdempotencyRecordDocument {
  private readonly snapshot: IdempotencyRecordSnapshot;

  private constructor(snapshot: IdempotencyRecordSnapshot) {
    this.snapshot = IdempotencyRecordDocument.normalize(snapshot);
  }

  static create(snapshot: IdempotencyRecordSnapshot): IdempotencyRecordDocument {
    return new IdempotencyRecordDocument(snapshot);
  }

  static hydrate(snapshot: IdempotencyRecordSnapshot): IdempotencyRecordDocument {
    return new IdempotencyRecordDocument(snapshot);
  }

  private static normalize(snapshot: IdempotencyRecordSnapshot): IdempotencyRecordSnapshot {
    invariant(
      snapshot.intentGeneration >= 0,
      "INVALID_INTENT_GENERATION",
      "IdempotencyRecord.intentGeneration must be >= 0.",
    );
    invariant(snapshot.version >= 1, "INVALID_VERSION", "IdempotencyRecord version must be >= 1.");
    invariant(
      snapshot.decisionClass !== "collision_review" || !!snapshot.collisionReviewRef,
      "COLLISION_REVIEW_REQUIRES_REFERENCE",
      "collision_review requires collisionReviewRef.",
    );
    return {
      ...snapshot,
      sourceCommandId: optionalRef(snapshot.sourceCommandId),
      transportCorrelationId: optionalRef(snapshot.transportCorrelationId),
      causalParentRef: optionalRef(snapshot.causalParentRef),
      collisionReviewRef: optionalRef(snapshot.collisionReviewRef),
      replayWindowClosedAt: optionalRef(snapshot.replayWindowClosedAt),
      decisionBasisRef: requireRef(snapshot.decisionBasisRef, "decisionBasisRef"),
      actionScope: requireRef(snapshot.actionScope, "actionScope"),
      governingLineageRef: requireRef(snapshot.governingLineageRef, "governingLineageRef"),
      replayKey: requireRef(snapshot.replayKey, "replayKey"),
      scopeFingerprint: requireRef(snapshot.scopeFingerprint, "scopeFingerprint"),
      effectScopeKey: requireRef(snapshot.effectScopeKey, "effectScopeKey"),
      expectedEffectSetHash: requireRef(snapshot.expectedEffectSetHash, "expectedEffectSetHash"),
      rawPayloadHash: requireRef(snapshot.rawPayloadHash, "rawPayloadHash"),
      semanticPayloadHash: requireRef(snapshot.semanticPayloadHash, "semanticPayloadHash"),
      firstAcceptedActionRecordRef: requireRef(
        snapshot.firstAcceptedActionRecordRef,
        "firstAcceptedActionRecordRef",
      ),
      acceptedSettlementRef: requireRef(snapshot.acceptedSettlementRef, "acceptedSettlementRef"),
    };
  }

  get idempotencyRecordId(): string {
    return this.snapshot.idempotencyRecordId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): IdempotencyRecordSnapshot {
    return { ...this.snapshot };
  }

  recordDecision(input: {
    decisionClass: Exclude<IdempotencyDecisionClass, "distinct">;
    collisionReviewRef?: string | null;
    updatedAt: string;
    replayWindowClosedAt?: string | null;
  }): IdempotencyRecordDocument {
    return new IdempotencyRecordDocument({
      ...this.snapshot,
      decisionClass: input.decisionClass,
      collisionReviewRef:
        input.decisionClass === "collision_review"
          ? requireRef(input.collisionReviewRef, "collisionReviewRef")
          : this.snapshot.collisionReviewRef,
      replayWindowClosedAt:
        input.replayWindowClosedAt !== undefined
          ? optionalRef(input.replayWindowClosedAt)
          : this.snapshot.replayWindowClosedAt,
      updatedAt: input.updatedAt,
      version: this.snapshot.version + 1,
    });
  }
}

export interface ReplayCollisionReviewSnapshot {
  replayCollisionReviewId: string;
  idempotencyRecordRef: string;
  actionScope: string;
  governingLineageRef: string;
  existingActionRecordRef: string;
  existingSettlementRef: string;
  incomingSourceCommandId: string | null;
  incomingTransportCorrelationId: string | null;
  incomingSemanticPayloadHash: string;
  incomingEffectSetHash: string;
  collisionClass: ReplayCollisionClass;
  reviewState: ReplayCollisionReviewState;
  createdAt: string;
  resolvedAt: string | null;
  version: number;
}

export interface PersistedReplayCollisionReviewRow extends ReplayCollisionReviewSnapshot {
  aggregateType: "ReplayCollisionReview";
  persistenceSchemaVersion: 1;
}

export class ReplayCollisionReviewDocument {
  private readonly snapshot: ReplayCollisionReviewSnapshot;

  private constructor(snapshot: ReplayCollisionReviewSnapshot) {
    this.snapshot = ReplayCollisionReviewDocument.normalize(snapshot);
  }

  static open(snapshot: ReplayCollisionReviewSnapshot): ReplayCollisionReviewDocument {
    return new ReplayCollisionReviewDocument(snapshot);
  }

  static hydrate(snapshot: ReplayCollisionReviewSnapshot): ReplayCollisionReviewDocument {
    return new ReplayCollisionReviewDocument(snapshot);
  }

  private static normalize(snapshot: ReplayCollisionReviewSnapshot): ReplayCollisionReviewSnapshot {
    invariant(
      snapshot.reviewState === "open" ? !snapshot.resolvedAt : !!snapshot.resolvedAt,
      "INVALID_COLLISION_REVIEW_RESOLUTION_STATE",
      "Open collision reviews may not have resolvedAt and closed reviews must have resolvedAt.",
    );
    return {
      ...snapshot,
      actionScope: requireRef(snapshot.actionScope, "actionScope"),
      governingLineageRef: requireRef(snapshot.governingLineageRef, "governingLineageRef"),
      idempotencyRecordRef: requireRef(snapshot.idempotencyRecordRef, "idempotencyRecordRef"),
      existingActionRecordRef: requireRef(
        snapshot.existingActionRecordRef,
        "existingActionRecordRef",
      ),
      existingSettlementRef: requireRef(snapshot.existingSettlementRef, "existingSettlementRef"),
      incomingSourceCommandId: optionalRef(snapshot.incomingSourceCommandId),
      incomingTransportCorrelationId: optionalRef(snapshot.incomingTransportCorrelationId),
      incomingSemanticPayloadHash: requireRef(
        snapshot.incomingSemanticPayloadHash,
        "incomingSemanticPayloadHash",
      ),
      incomingEffectSetHash: requireRef(snapshot.incomingEffectSetHash, "incomingEffectSetHash"),
      resolvedAt: optionalRef(snapshot.resolvedAt),
    };
  }

  get replayCollisionReviewId(): string {
    return this.snapshot.replayCollisionReviewId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ReplayCollisionReviewSnapshot {
    return { ...this.snapshot };
  }

  resolve(input: {
    reviewState: Exclude<ReplayCollisionReviewState, "open">;
    resolvedAt: string;
  }): ReplayCollisionReviewDocument {
    return new ReplayCollisionReviewDocument({
      ...this.snapshot,
      reviewState: input.reviewState,
      resolvedAt: input.resolvedAt,
      version: this.snapshot.version + 1,
    });
  }
}

export interface AdapterDispatchAttemptSnapshot {
  dispatchAttemptId: string;
  idempotencyRecordRef: string;
  actionScope: string;
  governingLineageRef: string;
  actionRecordRef: string;
  adapterContractProfileRef: string;
  effectScope: string;
  effectKey: string;
  transportPayloadHash: string;
  semanticPayloadHash: string;
  providerCorrelationRef: string | null;
  status: AdapterDispatchAttemptStatus;
  attemptCount: number;
  firstDispatchedAt: string;
  lastObservedAt: string;
  confirmedSettlementRef: string | null;
  version: number;
}

export interface PersistedAdapterDispatchAttemptRow extends AdapterDispatchAttemptSnapshot {
  aggregateType: "AdapterDispatchAttempt";
  persistenceSchemaVersion: 1;
}

export class AdapterDispatchAttemptDocument {
  private readonly snapshot: AdapterDispatchAttemptSnapshot;

  private constructor(snapshot: AdapterDispatchAttemptSnapshot) {
    this.snapshot = AdapterDispatchAttemptDocument.normalize(snapshot);
  }

  static create(snapshot: AdapterDispatchAttemptSnapshot): AdapterDispatchAttemptDocument {
    return new AdapterDispatchAttemptDocument(snapshot);
  }

  static hydrate(snapshot: AdapterDispatchAttemptSnapshot): AdapterDispatchAttemptDocument {
    return new AdapterDispatchAttemptDocument(snapshot);
  }

  private static normalize(
    snapshot: AdapterDispatchAttemptSnapshot,
  ): AdapterDispatchAttemptSnapshot {
    invariant(
      snapshot.attemptCount >= 1,
      "INVALID_ATTEMPT_COUNT",
      "AdapterDispatchAttempt.attemptCount must be >= 1.",
    );
    return {
      ...snapshot,
      idempotencyRecordRef: requireRef(snapshot.idempotencyRecordRef, "idempotencyRecordRef"),
      actionScope: requireRef(snapshot.actionScope, "actionScope"),
      governingLineageRef: requireRef(snapshot.governingLineageRef, "governingLineageRef"),
      actionRecordRef: requireRef(snapshot.actionRecordRef, "actionRecordRef"),
      adapterContractProfileRef: requireRef(
        snapshot.adapterContractProfileRef,
        "adapterContractProfileRef",
      ),
      effectScope: requireRef(snapshot.effectScope, "effectScope"),
      effectKey: requireRef(snapshot.effectKey, "effectKey"),
      transportPayloadHash: requireRef(snapshot.transportPayloadHash, "transportPayloadHash"),
      semanticPayloadHash: requireRef(snapshot.semanticPayloadHash, "semanticPayloadHash"),
      providerCorrelationRef: optionalRef(snapshot.providerCorrelationRef),
      confirmedSettlementRef: optionalRef(snapshot.confirmedSettlementRef),
    };
  }

  get dispatchAttemptId(): string {
    return this.snapshot.dispatchAttemptId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  get effectKey(): string {
    return this.snapshot.effectKey;
  }

  get confirmedSettlementRef(): string | null {
    return this.snapshot.confirmedSettlementRef;
  }

  toSnapshot(): AdapterDispatchAttemptSnapshot {
    return { ...this.snapshot };
  }

  observeReceipt(input: {
    decisionClass: AdapterReceiptDecisionClass;
    linkedSettlementRef?: string | null;
    observedAt: string;
  }): AdapterDispatchAttemptDocument {
    const linkedSettlementRef = optionalRef(input.linkedSettlementRef);
    const nextStatus: AdapterDispatchAttemptStatus =
      input.decisionClass === "collision_review"
        ? "collision_review"
        : input.decisionClass === "accepted_new"
          ? linkedSettlementRef
            ? "confirmed"
            : "transport_acked"
          : input.decisionClass === "stale_ignored"
            ? this.snapshot.status
            : this.snapshot.confirmedSettlementRef
              ? "confirmed"
              : "duplicate_accepted";

    return new AdapterDispatchAttemptDocument({
      ...this.snapshot,
      status: nextStatus,
      confirmedSettlementRef:
        linkedSettlementRef ?? this.snapshot.confirmedSettlementRef ?? linkedSettlementRef,
      lastObservedAt: input.observedAt,
      version: this.snapshot.version + 1,
    });
  }
}

export interface AdapterReceiptCheckpointSnapshot {
  receiptCheckpointId: string;
  adapterContractProfileRef: string;
  effectKey: string;
  providerCorrelationRef: string | null;
  transportMessageId: string;
  orderingKey: string;
  rawReceiptHash: string;
  semanticReceiptHash: string;
  decisionClass: AdapterReceiptDecisionClass;
  linkedDispatchAttemptRef: string;
  linkedSettlementRef: string | null;
  recordedAt: string;
  version: number;
}

export interface PersistedAdapterReceiptCheckpointRow extends AdapterReceiptCheckpointSnapshot {
  aggregateType: "AdapterReceiptCheckpoint";
  persistenceSchemaVersion: 1;
}

export class AdapterReceiptCheckpointDocument {
  private readonly snapshot: AdapterReceiptCheckpointSnapshot;

  private constructor(snapshot: AdapterReceiptCheckpointSnapshot) {
    this.snapshot = AdapterReceiptCheckpointDocument.normalize(snapshot);
  }

  static create(snapshot: AdapterReceiptCheckpointSnapshot): AdapterReceiptCheckpointDocument {
    return new AdapterReceiptCheckpointDocument(snapshot);
  }

  static hydrate(snapshot: AdapterReceiptCheckpointSnapshot): AdapterReceiptCheckpointDocument {
    return new AdapterReceiptCheckpointDocument(snapshot);
  }

  private static normalize(
    snapshot: AdapterReceiptCheckpointSnapshot,
  ): AdapterReceiptCheckpointSnapshot {
    return {
      ...snapshot,
      adapterContractProfileRef: requireRef(
        snapshot.adapterContractProfileRef,
        "adapterContractProfileRef",
      ),
      effectKey: requireRef(snapshot.effectKey, "effectKey"),
      providerCorrelationRef: optionalRef(snapshot.providerCorrelationRef),
      transportMessageId: requireRef(snapshot.transportMessageId, "transportMessageId"),
      orderingKey: requireRef(snapshot.orderingKey, "orderingKey"),
      rawReceiptHash: requireRef(snapshot.rawReceiptHash, "rawReceiptHash"),
      semanticReceiptHash: requireRef(snapshot.semanticReceiptHash, "semanticReceiptHash"),
      linkedDispatchAttemptRef: requireRef(
        snapshot.linkedDispatchAttemptRef,
        "linkedDispatchAttemptRef",
      ),
      linkedSettlementRef: optionalRef(snapshot.linkedSettlementRef),
    };
  }

  get receiptCheckpointId(): string {
    return this.snapshot.receiptCheckpointId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): AdapterReceiptCheckpointSnapshot {
    return { ...this.snapshot };
  }
}

export interface IdempotencyRecordRepository {
  getIdempotencyRecord(idempotencyRecordId: string): Promise<IdempotencyRecordDocument | undefined>;
  saveIdempotencyRecord(
    idempotencyRecord: IdempotencyRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findIdempotencyRecordByComposite(
    actionScope: string,
    governingLineageRef: string,
    replayKey: string,
    scopeFingerprint: string,
  ): Promise<IdempotencyRecordDocument | undefined>;
  findIdempotencyRecordBySourceCommand(
    actionScope: string,
    governingLineageRef: string,
    sourceCommandId: string,
  ): Promise<IdempotencyRecordDocument | undefined>;
  findIdempotencyRecordByTransportCorrelation(
    actionScope: string,
    governingLineageRef: string,
    transportCorrelationId: string,
  ): Promise<IdempotencyRecordDocument | undefined>;
  findIdempotencyRecordByEffectScopeKey(
    effectScopeKey: string,
  ): Promise<IdempotencyRecordDocument | undefined>;
  listIdempotencyRecords(): Promise<readonly IdempotencyRecordDocument[]>;
}

export interface ReplayCollisionReviewRepository {
  getReplayCollisionReview(
    replayCollisionReviewId: string,
  ): Promise<ReplayCollisionReviewDocument | undefined>;
  saveReplayCollisionReview(
    review: ReplayCollisionReviewDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findReplayCollisionReviewByNaturalKey(
    naturalKey: string,
  ): Promise<ReplayCollisionReviewDocument | undefined>;
  listReplayCollisionReviews(): Promise<readonly ReplayCollisionReviewDocument[]>;
}

export interface AdapterDispatchAttemptRepository {
  getAdapterDispatchAttempt(
    dispatchAttemptId: string,
  ): Promise<AdapterDispatchAttemptDocument | undefined>;
  saveAdapterDispatchAttempt(
    attempt: AdapterDispatchAttemptDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findAdapterDispatchAttemptByEffectKey(
    effectKey: string,
  ): Promise<AdapterDispatchAttemptDocument | undefined>;
  listAdapterDispatchAttempts(): Promise<readonly AdapterDispatchAttemptDocument[]>;
}

export interface AdapterReceiptCheckpointRepository {
  getAdapterReceiptCheckpoint(
    receiptCheckpointId: string,
  ): Promise<AdapterReceiptCheckpointDocument | undefined>;
  saveAdapterReceiptCheckpoint(
    checkpoint: AdapterReceiptCheckpointDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findAdapterReceiptCheckpointByCanonicalKey(
    adapterContractProfileRef: string,
    effectKey: string,
    providerCorrelationRef: string | null,
    orderingKey: string,
  ): Promise<AdapterReceiptCheckpointDocument | undefined>;
  findLatestAdapterReceiptCheckpointByEffectKey(
    effectKey: string,
  ): Promise<AdapterReceiptCheckpointDocument | undefined>;
  findAdapterReceiptCheckpointByProviderCorrelation(
    adapterContractProfileRef: string,
    providerCorrelationRef: string,
  ): Promise<AdapterReceiptCheckpointDocument | undefined>;
  listAdapterReceiptCheckpoints(): Promise<readonly AdapterReceiptCheckpointDocument[]>;
}

export interface ReplayResolutionBoundaryRepository {
  withReplayResolutionBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

export interface AdapterReceiptBoundaryRepository {
  withReceiptCheckpointBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

export class InMemoryReplayCollisionStore
  implements
    IdempotencyRecordRepository,
    ReplayCollisionReviewRepository,
    AdapterDispatchAttemptRepository,
    AdapterReceiptCheckpointRepository,
    ReplayResolutionBoundaryRepository,
    AdapterReceiptBoundaryRepository
{
  private readonly idempotencyRecords = new Map<string, PersistedIdempotencyRecordRow>();
  private readonly idempotencyByCompositeKey = new Map<string, string>();
  private readonly idempotencyBySourceCommandKey = new Map<string, string>();
  private readonly idempotencyByTransportKey = new Map<string, string>();
  private readonly idempotencyByEffectScopeKey = new Map<string, string>();
  private readonly replayCollisionReviews = new Map<string, PersistedReplayCollisionReviewRow>();
  private readonly replayCollisionReviewByNaturalKey = new Map<string, string>();
  private readonly adapterDispatchAttempts = new Map<string, PersistedAdapterDispatchAttemptRow>();
  private readonly dispatchAttemptByEffectKey = new Map<string, string>();
  private readonly adapterReceiptCheckpoints = new Map<
    string,
    PersistedAdapterReceiptCheckpointRow
  >();
  private readonly receiptCheckpointByCanonicalKey = new Map<string, string>();
  private readonly receiptCheckpointByProviderCorrelation = new Map<string, string>();
  private replayResolutionQueue: Promise<void> = Promise.resolve();
  private receiptCheckpointQueue: Promise<void> = Promise.resolve();

  async getIdempotencyRecord(
    idempotencyRecordId: string,
  ): Promise<IdempotencyRecordDocument | undefined> {
    const row = this.idempotencyRecords.get(idempotencyRecordId);
    return row ? IdempotencyRecordDocument.hydrate(row) : undefined;
  }

  async saveIdempotencyRecord(
    idempotencyRecord: IdempotencyRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = idempotencyRecord.toSnapshot();
    const composite = compositeKey([
      snapshot.actionScope,
      snapshot.governingLineageRef,
      snapshot.replayKey,
      snapshot.scopeFingerprint,
    ]);
    const sourceKey = snapshot.sourceCommandId
      ? compositeKey([snapshot.actionScope, snapshot.governingLineageRef, snapshot.sourceCommandId])
      : null;
    const transportKey = snapshot.transportCorrelationId
      ? compositeKey([
          snapshot.actionScope,
          snapshot.governingLineageRef,
          snapshot.transportCorrelationId,
        ])
      : null;

    assertUniqueSecondaryKey(
      this.idempotencyByCompositeKey,
      composite,
      idempotencyRecord.idempotencyRecordId,
      "DUPLICATE_IDEMPOTENCY_COMPOSITE_KEY",
      "replayCompositeKey",
    );
    assertUniqueSecondaryKey(
      this.idempotencyByEffectScopeKey,
      snapshot.effectScopeKey,
      idempotencyRecord.idempotencyRecordId,
      "DUPLICATE_IDEMPOTENCY_EFFECT_SCOPE_KEY",
      "effectScopeKey",
    );
    if (sourceKey) {
      assertUniqueSecondaryKey(
        this.idempotencyBySourceCommandKey,
        sourceKey,
        idempotencyRecord.idempotencyRecordId,
        "DUPLICATE_IDEMPOTENCY_SOURCE_COMMAND_KEY",
        "sourceCommandId",
      );
    }
    if (transportKey) {
      assertUniqueSecondaryKey(
        this.idempotencyByTransportKey,
        transportKey,
        idempotencyRecord.idempotencyRecordId,
        "DUPLICATE_IDEMPOTENCY_TRANSPORT_KEY",
        "transportCorrelationId",
      );
    }

    saveWithCas(
      this.idempotencyRecords,
      idempotencyRecord.idempotencyRecordId,
      {
        aggregateType: "IdempotencyRecord",
        persistenceSchemaVersion: 1,
        ...snapshot,
      },
      options,
    );
    setSecondaryKey(
      this.idempotencyByCompositeKey,
      composite,
      idempotencyRecord.idempotencyRecordId,
    );
    setSecondaryKey(
      this.idempotencyByEffectScopeKey,
      snapshot.effectScopeKey,
      idempotencyRecord.idempotencyRecordId,
    );
    if (sourceKey) {
      setSecondaryKey(
        this.idempotencyBySourceCommandKey,
        sourceKey,
        idempotencyRecord.idempotencyRecordId,
      );
    }
    if (transportKey) {
      setSecondaryKey(
        this.idempotencyByTransportKey,
        transportKey,
        idempotencyRecord.idempotencyRecordId,
      );
    }
  }

  async findIdempotencyRecordByComposite(
    actionScope: string,
    governingLineageRef: string,
    replayKey: string,
    scopeFingerprint: string,
  ): Promise<IdempotencyRecordDocument | undefined> {
    const composite = compositeKey([actionScope, governingLineageRef, replayKey, scopeFingerprint]);
    const idempotencyRecordId = this.idempotencyByCompositeKey.get(composite);
    const row = idempotencyRecordId ? this.idempotencyRecords.get(idempotencyRecordId) : undefined;
    return row ? IdempotencyRecordDocument.hydrate(row) : undefined;
  }

  async findIdempotencyRecordBySourceCommand(
    actionScope: string,
    governingLineageRef: string,
    sourceCommandId: string,
  ): Promise<IdempotencyRecordDocument | undefined> {
    const key = compositeKey([actionScope, governingLineageRef, sourceCommandId]);
    const idempotencyRecordId = this.idempotencyBySourceCommandKey.get(key);
    const row = idempotencyRecordId ? this.idempotencyRecords.get(idempotencyRecordId) : undefined;
    return row ? IdempotencyRecordDocument.hydrate(row) : undefined;
  }

  async findIdempotencyRecordByTransportCorrelation(
    actionScope: string,
    governingLineageRef: string,
    transportCorrelationId: string,
  ): Promise<IdempotencyRecordDocument | undefined> {
    const key = compositeKey([actionScope, governingLineageRef, transportCorrelationId]);
    const idempotencyRecordId = this.idempotencyByTransportKey.get(key);
    const row = idempotencyRecordId ? this.idempotencyRecords.get(idempotencyRecordId) : undefined;
    return row ? IdempotencyRecordDocument.hydrate(row) : undefined;
  }

  async findIdempotencyRecordByEffectScopeKey(
    effectScopeKey: string,
  ): Promise<IdempotencyRecordDocument | undefined> {
    const idempotencyRecordId = this.idempotencyByEffectScopeKey.get(effectScopeKey);
    const row = idempotencyRecordId ? this.idempotencyRecords.get(idempotencyRecordId) : undefined;
    return row ? IdempotencyRecordDocument.hydrate(row) : undefined;
  }

  async listIdempotencyRecords(): Promise<readonly IdempotencyRecordDocument[]> {
    return [...this.idempotencyRecords.values()].map((row) =>
      IdempotencyRecordDocument.hydrate(row),
    );
  }

  async getReplayCollisionReview(
    replayCollisionReviewId: string,
  ): Promise<ReplayCollisionReviewDocument | undefined> {
    const row = this.replayCollisionReviews.get(replayCollisionReviewId);
    return row ? ReplayCollisionReviewDocument.hydrate(row) : undefined;
  }

  async saveReplayCollisionReview(
    review: ReplayCollisionReviewDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = review.toSnapshot();
    const naturalKey = buildCollisionNaturalKey(snapshot);
    assertUniqueSecondaryKey(
      this.replayCollisionReviewByNaturalKey,
      naturalKey,
      review.replayCollisionReviewId,
      "DUPLICATE_REPLAY_COLLISION_REVIEW_NATURAL_KEY",
      "replayCollisionReviewNaturalKey",
    );
    saveWithCas(
      this.replayCollisionReviews,
      review.replayCollisionReviewId,
      {
        aggregateType: "ReplayCollisionReview",
        persistenceSchemaVersion: 1,
        ...snapshot,
      },
      options,
    );
    setSecondaryKey(
      this.replayCollisionReviewByNaturalKey,
      naturalKey,
      review.replayCollisionReviewId,
    );
  }

  async findReplayCollisionReviewByNaturalKey(
    naturalKey: string,
  ): Promise<ReplayCollisionReviewDocument | undefined> {
    const reviewId = this.replayCollisionReviewByNaturalKey.get(naturalKey);
    const row = reviewId ? this.replayCollisionReviews.get(reviewId) : undefined;
    return row ? ReplayCollisionReviewDocument.hydrate(row) : undefined;
  }

  async listReplayCollisionReviews(): Promise<readonly ReplayCollisionReviewDocument[]> {
    return [...this.replayCollisionReviews.values()].map((row) =>
      ReplayCollisionReviewDocument.hydrate(row),
    );
  }

  async getAdapterDispatchAttempt(
    dispatchAttemptId: string,
  ): Promise<AdapterDispatchAttemptDocument | undefined> {
    const row = this.adapterDispatchAttempts.get(dispatchAttemptId);
    return row ? AdapterDispatchAttemptDocument.hydrate(row) : undefined;
  }

  async saveAdapterDispatchAttempt(
    attempt: AdapterDispatchAttemptDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = attempt.toSnapshot();
    assertUniqueSecondaryKey(
      this.dispatchAttemptByEffectKey,
      snapshot.effectKey,
      attempt.dispatchAttemptId,
      "DUPLICATE_DISPATCH_ATTEMPT_EFFECT_KEY",
      "effectKey",
    );
    saveWithCas(
      this.adapterDispatchAttempts,
      attempt.dispatchAttemptId,
      {
        aggregateType: "AdapterDispatchAttempt",
        persistenceSchemaVersion: 1,
        ...snapshot,
      },
      options,
    );
    setSecondaryKey(this.dispatchAttemptByEffectKey, snapshot.effectKey, attempt.dispatchAttemptId);
  }

  async findAdapterDispatchAttemptByEffectKey(
    effectKey: string,
  ): Promise<AdapterDispatchAttemptDocument | undefined> {
    const dispatchAttemptId = this.dispatchAttemptByEffectKey.get(effectKey);
    const row = dispatchAttemptId ? this.adapterDispatchAttempts.get(dispatchAttemptId) : undefined;
    return row ? AdapterDispatchAttemptDocument.hydrate(row) : undefined;
  }

  async listAdapterDispatchAttempts(): Promise<readonly AdapterDispatchAttemptDocument[]> {
    return [...this.adapterDispatchAttempts.values()].map((row) =>
      AdapterDispatchAttemptDocument.hydrate(row),
    );
  }

  async getAdapterReceiptCheckpoint(
    receiptCheckpointId: string,
  ): Promise<AdapterReceiptCheckpointDocument | undefined> {
    const row = this.adapterReceiptCheckpoints.get(receiptCheckpointId);
    return row ? AdapterReceiptCheckpointDocument.hydrate(row) : undefined;
  }

  async saveAdapterReceiptCheckpoint(
    checkpoint: AdapterReceiptCheckpointDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = checkpoint.toSnapshot();
    const canonicalKey = compositeKey([
      snapshot.adapterContractProfileRef,
      snapshot.effectKey,
      optionalRef(snapshot.providerCorrelationRef),
      snapshot.orderingKey,
    ]);
    assertUniqueSecondaryKey(
      this.receiptCheckpointByCanonicalKey,
      canonicalKey,
      checkpoint.receiptCheckpointId,
      "DUPLICATE_RECEIPT_CHECKPOINT_CANONICAL_KEY",
      "receiptCheckpointCanonicalKey",
    );
    saveWithCas(
      this.adapterReceiptCheckpoints,
      checkpoint.receiptCheckpointId,
      {
        aggregateType: "AdapterReceiptCheckpoint",
        persistenceSchemaVersion: 1,
        ...snapshot,
      },
      options,
    );
    setSecondaryKey(
      this.receiptCheckpointByCanonicalKey,
      canonicalKey,
      checkpoint.receiptCheckpointId,
    );
    if (snapshot.providerCorrelationRef) {
      setSecondaryKey(
        this.receiptCheckpointByProviderCorrelation,
        compositeKey([snapshot.adapterContractProfileRef, snapshot.providerCorrelationRef]),
        checkpoint.receiptCheckpointId,
      );
    }
  }

  async findAdapterReceiptCheckpointByCanonicalKey(
    adapterContractProfileRef: string,
    effectKey: string,
    providerCorrelationRef: string | null,
    orderingKey: string,
  ): Promise<AdapterReceiptCheckpointDocument | undefined> {
    const checkpointId = this.receiptCheckpointByCanonicalKey.get(
      compositeKey([
        adapterContractProfileRef,
        effectKey,
        optionalRef(providerCorrelationRef),
        orderingKey,
      ]),
    );
    const row = checkpointId ? this.adapterReceiptCheckpoints.get(checkpointId) : undefined;
    return row ? AdapterReceiptCheckpointDocument.hydrate(row) : undefined;
  }

  async findLatestAdapterReceiptCheckpointByEffectKey(
    effectKey: string,
  ): Promise<AdapterReceiptCheckpointDocument | undefined> {
    const rows = [...this.adapterReceiptCheckpoints.values()]
      .filter((row) => row.effectKey === effectKey)
      .sort((left, right) => compareOrderingKeys(right.orderingKey, left.orderingKey));
    return rows[0] ? AdapterReceiptCheckpointDocument.hydrate(rows[0]) : undefined;
  }

  async findAdapterReceiptCheckpointByProviderCorrelation(
    adapterContractProfileRef: string,
    providerCorrelationRef: string,
  ): Promise<AdapterReceiptCheckpointDocument | undefined> {
    const checkpointId = this.receiptCheckpointByProviderCorrelation.get(
      compositeKey([adapterContractProfileRef, providerCorrelationRef]),
    );
    const row = checkpointId ? this.adapterReceiptCheckpoints.get(checkpointId) : undefined;
    return row ? AdapterReceiptCheckpointDocument.hydrate(row) : undefined;
  }

  async listAdapterReceiptCheckpoints(): Promise<readonly AdapterReceiptCheckpointDocument[]> {
    return [...this.adapterReceiptCheckpoints.values()].map((row) =>
      AdapterReceiptCheckpointDocument.hydrate(row),
    );
  }

  async withReplayResolutionBoundary<T>(operation: () => Promise<T>): Promise<T> {
    const prior = this.replayResolutionQueue;
    let release: (() => void) | undefined;
    this.replayResolutionQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await prior;
    try {
      return await operation();
    } finally {
      release?.();
    }
  }

  async withReceiptCheckpointBoundary<T>(operation: () => Promise<T>): Promise<T> {
    const prior = this.receiptCheckpointQueue;
    let release: (() => void) | undefined;
    this.receiptCheckpointQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await prior;
    try {
      return await operation();
    } finally {
      release?.();
    }
  }

  dumpPersistenceSnapshot() {
    return {
      idempotencyRecords: [...this.idempotencyRecords.values()],
      replayCollisionReviews: [...this.replayCollisionReviews.values()],
      adapterDispatchAttempts: [...this.adapterDispatchAttempts.values()],
      adapterReceiptCheckpoints: [...this.adapterReceiptCheckpoints.values()],
    } as const;
  }
}

function buildCollisionNaturalKey(snapshot: {
  idempotencyRecordRef: string;
  actionScope: string;
  governingLineageRef: string;
  incomingSourceCommandId: string | null;
  incomingTransportCorrelationId: string | null;
  incomingSemanticPayloadHash: string;
  incomingEffectSetHash: string;
  collisionClass: ReplayCollisionClass;
}): string {
  return compositeKey([
    snapshot.idempotencyRecordRef,
    snapshot.actionScope,
    snapshot.governingLineageRef,
    optionalRef(snapshot.incomingSourceCommandId),
    optionalRef(snapshot.incomingTransportCorrelationId),
    snapshot.incomingSemanticPayloadHash,
    snapshot.incomingEffectSetHash,
    snapshot.collisionClass,
  ]);
}

export interface ReplayCollisionDependencies
  extends IdempotencyRecordRepository,
    ReplayCollisionReviewRepository,
    AdapterDispatchAttemptRepository,
    AdapterReceiptCheckpointRepository,
    ReplayResolutionBoundaryRepository,
    AdapterReceiptBoundaryRepository {}

export interface ResolveInboundCommand {
  actionScope: string;
  governingLineageRef: string;
  effectiveActorRef: string;
  sourceCommandId?: string | null;
  sourceCommandIdFamily?: SourceCommandIdentifierFamily;
  transportCorrelationId?: string | null;
  causalParentRef?: string | null;
  intentGeneration: number;
  expectedEffectSetRefs: readonly string[];
  scope: ReplayScopeComponents;
  rawPayload: unknown;
  semanticPayload: unknown;
  firstAcceptedActionRecordRef?: string | null;
  acceptedSettlementRef?: string | null;
  decisionBasisRef?: string | null;
  observedAt: string;
}

export interface ResolveInboundCommandResult {
  decisionClass: IdempotencyDecisionClass;
  idempotencyRecord: IdempotencyRecordDocument;
  collisionReview?: ReplayCollisionReviewDocument;
  authoritativeActionRecordRef: string;
  authoritativeSettlementRef: string;
  canonicalHashes: CanonicalReplayHashOutput;
  blockedAutomaticMutation: boolean;
  reusedExistingRecord: boolean;
}

export interface EnsureAdapterDispatchAttemptCommand {
  idempotencyRecordRef: string;
  actionScope: string;
  governingLineageRef: string;
  actionRecordRef: string;
  adapterContractProfileRef: string;
  effectScope: string;
  effectKey: string;
  transportPayload: unknown;
  semanticPayload: unknown;
  providerCorrelationRef?: string | null;
  firstDispatchedAt: string;
}

export interface EnsureAdapterDispatchAttemptResult {
  dispatchAttempt: AdapterDispatchAttemptDocument;
  reusedExistingAttempt: boolean;
}

export interface RecordAdapterReceiptCheckpointCommand {
  actionScope: string;
  governingLineageRef: string;
  adapterContractProfileRef: string;
  effectKey: string;
  providerCorrelationRef?: string | null;
  transportMessageId: string;
  orderingKey: string;
  rawReceipt: unknown;
  semanticReceipt: unknown;
  linkedSettlementRef?: string | null;
  recordedAt: string;
}

export interface RecordAdapterReceiptCheckpointResult {
  decisionClass: AdapterReceiptDecisionClass;
  checkpoint: AdapterReceiptCheckpointDocument;
  dispatchAttempt: AdapterDispatchAttemptDocument;
  collisionReview?: ReplayCollisionReviewDocument;
}

export interface ReplayLedgerValidationIssue {
  code: string;
  message: string;
  refs: readonly string[];
  severity: "error" | "warning";
}

export class ReplayCollisionAuthorityService {
  private readonly repositories: ReplayCollisionDependencies;
  private readonly idGenerator: BackboneIdGenerator;

  constructor(
    repositories: ReplayCollisionDependencies,
    idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
      "replay_collision_authority",
    ),
  ) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
  }

  async resolveInboundCommand(
    command: ResolveInboundCommand,
  ): Promise<ResolveInboundCommandResult> {
    const canonicalHashes = buildCanonicalReplayHashes({
      actionScope: command.actionScope,
      governingLineageRef: command.governingLineageRef,
      effectiveActorRef: command.effectiveActorRef,
      causalParentRef: command.causalParentRef,
      intentGeneration: command.intentGeneration,
      scope: command.scope,
      expectedEffectSetRefs: command.expectedEffectSetRefs,
      rawPayload: command.rawPayload,
      semanticPayload: command.semanticPayload,
    });

    return this.repositories.withReplayResolutionBoundary(async () => {
      const byComposite = await this.repositories.findIdempotencyRecordByComposite(
        command.actionScope,
        command.governingLineageRef,
        canonicalHashes.replayKey,
        canonicalHashes.scopeFingerprint,
      );
      if (byComposite) {
        return this.handleReplayMatch(byComposite, canonicalHashes, command.observedAt);
      }

      const sourceCandidate = command.sourceCommandId
        ? await this.repositories.findIdempotencyRecordBySourceCommand(
            command.actionScope,
            command.governingLineageRef,
            command.sourceCommandId,
          )
        : undefined;
      const transportCandidate = command.transportCorrelationId
        ? await this.repositories.findIdempotencyRecordByTransportCorrelation(
            command.actionScope,
            command.governingLineageRef,
            command.transportCorrelationId,
          )
        : undefined;
      const effectScopeCandidate = await this.repositories.findIdempotencyRecordByEffectScopeKey(
        canonicalHashes.effectScopeKey,
      );

      const candidates = [sourceCandidate, transportCandidate, effectScopeCandidate].filter(
        (candidate): candidate is IdempotencyRecordDocument => Boolean(candidate),
      );
      const distinctCandidateIds = new Set(
        candidates.map((candidate) => candidate.idempotencyRecordId),
      );
      invariant(
        distinctCandidateIds.size <= 1,
        "REPLAY_IDENTIFIER_CONFLICT",
        `Replay identifiers resolved to conflicting idempotency records ${[...distinctCandidateIds].join(", ")}.`,
      );

      const candidate = candidates[0];
      if (candidate) {
        const candidateSnapshot = candidate.toSnapshot();
        const sameSemantic =
          candidateSnapshot.semanticPayloadHash === canonicalHashes.semanticPayloadHash &&
          candidateSnapshot.scopeFingerprint === canonicalHashes.scopeFingerprint;
        if (sameSemantic && candidateSnapshot.decisionClass !== "collision_review") {
          return this.handleReplayMatch(candidate, canonicalHashes, command.observedAt);
        }

        const collisionClass: ReplayCollisionClass =
          sourceCandidate && sourceCandidate.idempotencyRecordId === candidate.idempotencyRecordId
            ? (command.sourceCommandIdFamily ?? "command_id") === "idempotency_key"
              ? "idempotency_key_reuse"
              : "source_id_reuse"
            : transportCandidate &&
                transportCandidate.idempotencyRecordId === candidate.idempotencyRecordId
              ? "transport_correlation_reuse"
              : "idempotency_key_reuse";

        return this.openCollisionReview({
          existingRecord: candidate,
          actionScope: command.actionScope,
          governingLineageRef: command.governingLineageRef,
          incomingSourceCommandId: command.sourceCommandId ?? null,
          incomingTransportCorrelationId: command.transportCorrelationId ?? null,
          incomingSemanticPayloadHash: canonicalHashes.semanticPayloadHash,
          incomingEffectSetHash: canonicalHashes.expectedEffectSetHash,
          collisionClass,
          observedAt: command.observedAt,
          canonicalHashes,
        });
      }

      const idempotencyRecord = IdempotencyRecordDocument.create({
        idempotencyRecordId: this.idGenerator.nextId("idempotencyRecord"),
        actionScope: command.actionScope,
        governingLineageRef: command.governingLineageRef,
        sourceCommandId: command.sourceCommandId ?? null,
        sourceCommandIdFamily: command.sourceCommandIdFamily ?? "command_id",
        transportCorrelationId: command.transportCorrelationId ?? null,
        rawPayloadHash: canonicalHashes.rawPayloadHash,
        semanticPayloadHash: canonicalHashes.semanticPayloadHash,
        replayKey: canonicalHashes.replayKey,
        scopeFingerprint: canonicalHashes.scopeFingerprint,
        effectScopeKey: canonicalHashes.effectScopeKey,
        causalParentRef: command.causalParentRef ?? null,
        intentGeneration: command.intentGeneration,
        expectedEffectSetHash: canonicalHashes.expectedEffectSetHash,
        decisionClass: "distinct",
        firstAcceptedActionRecordRef: requireRef(
          command.firstAcceptedActionRecordRef,
          "firstAcceptedActionRecordRef",
        ),
        acceptedSettlementRef: requireRef(command.acceptedSettlementRef, "acceptedSettlementRef"),
        collisionReviewRef: null,
        decisionBasisRef:
          optionalRef(command.decisionBasisRef) ??
          `decision_basis::${command.actionScope}::${canonicalHashes.replayKey}`,
        replayWindowClosedAt: null,
        createdAt: command.observedAt,
        updatedAt: command.observedAt,
        version: 1,
      });
      await this.repositories.saveIdempotencyRecord(idempotencyRecord);

      return {
        decisionClass: "distinct",
        idempotencyRecord,
        authoritativeActionRecordRef: idempotencyRecord.toSnapshot().firstAcceptedActionRecordRef,
        authoritativeSettlementRef: idempotencyRecord.toSnapshot().acceptedSettlementRef,
        canonicalHashes,
        blockedAutomaticMutation: false,
        reusedExistingRecord: false,
      };
    });
  }

  async ensureAdapterDispatchAttempt(
    command: EnsureAdapterDispatchAttemptCommand,
  ): Promise<EnsureAdapterDispatchAttemptResult> {
    return this.repositories.withReplayResolutionBoundary(async () => {
      const existing = await this.repositories.findAdapterDispatchAttemptByEffectKey(
        command.effectKey,
      );
      if (existing) {
        return {
          dispatchAttempt: existing,
          reusedExistingAttempt: true,
        };
      }

      const dispatchAttempt = AdapterDispatchAttemptDocument.create({
        dispatchAttemptId: this.idGenerator.nextId("adapterDispatchAttempt"),
        idempotencyRecordRef: command.idempotencyRecordRef,
        actionScope: command.actionScope,
        governingLineageRef: command.governingLineageRef,
        actionRecordRef: command.actionRecordRef,
        adapterContractProfileRef: command.adapterContractProfileRef,
        effectScope: command.effectScope,
        effectKey: command.effectKey,
        transportPayloadHash: sha256Hex(rawPayloadBytes(command.transportPayload)),
        semanticPayloadHash: sha256Hex(canonicalizeSemanticPayload(command.semanticPayload)),
        providerCorrelationRef: command.providerCorrelationRef ?? null,
        status: "pending",
        attemptCount: 1,
        firstDispatchedAt: command.firstDispatchedAt,
        lastObservedAt: command.firstDispatchedAt,
        confirmedSettlementRef: null,
        version: 1,
      });
      await this.repositories.saveAdapterDispatchAttempt(dispatchAttempt);
      return {
        dispatchAttempt,
        reusedExistingAttempt: false,
      };
    });
  }

  async recordAdapterReceiptCheckpoint(
    command: RecordAdapterReceiptCheckpointCommand,
  ): Promise<RecordAdapterReceiptCheckpointResult> {
    const dispatchAttempt = await this.requireDispatchAttempt(command.effectKey);
    const rawReceiptHash = sha256Hex(rawPayloadBytes(command.rawReceipt));
    const semanticReceiptHash = sha256Hex(canonicalizeSemanticPayload(command.semanticReceipt));

    return this.repositories.withReceiptCheckpointBoundary(async () => {
      const providerCorrelationRef =
        command.providerCorrelationRef ?? dispatchAttempt.toSnapshot().providerCorrelationRef;
      const existing = await this.repositories.findAdapterReceiptCheckpointByCanonicalKey(
        command.adapterContractProfileRef,
        command.effectKey,
        providerCorrelationRef,
        command.orderingKey,
      );
      if (existing) {
        const existingSnapshot = existing.toSnapshot();
        const decisionClass: AdapterReceiptDecisionClass =
          existingSnapshot.rawReceiptHash === rawReceiptHash ? "exact_replay" : "semantic_replay";
        const nextAttempt = dispatchAttempt.observeReceipt({
          decisionClass,
          linkedSettlementRef: existingSnapshot.linkedSettlementRef,
          observedAt: command.recordedAt,
        });
        await this.repositories.saveAdapterDispatchAttempt(nextAttempt, {
          expectedVersion: dispatchAttempt.version,
        });
        return {
          decisionClass,
          checkpoint: existing,
          dispatchAttempt: nextAttempt,
        };
      }

      const latest = await this.repositories.findLatestAdapterReceiptCheckpointByEffectKey(
        command.effectKey,
      );
      const priorByProviderCorrelation =
        providerCorrelationRef === null
          ? undefined
          : await this.repositories.findAdapterReceiptCheckpointByProviderCorrelation(
              command.adapterContractProfileRef,
              providerCorrelationRef,
            );
      if (
        priorByProviderCorrelation &&
        priorByProviderCorrelation.toSnapshot().effectKey !== command.effectKey
      ) {
        const collision = await this.openCollisionReview({
          existingRecord: await this.requireIdempotencyRecord(
            dispatchAttempt.toSnapshot().idempotencyRecordRef,
          ),
          actionScope: command.actionScope,
          governingLineageRef: command.governingLineageRef,
          incomingSourceCommandId: command.transportMessageId,
          incomingTransportCorrelationId: providerCorrelationRef,
          incomingSemanticPayloadHash: semanticReceiptHash,
          incomingEffectSetHash: dispatchAttempt.toSnapshot().effectKey,
          collisionClass: "callback_scope_drift",
          observedAt: command.recordedAt,
          canonicalHashes: {
            rawPayloadHash: rawReceiptHash,
            semanticPayloadHash: semanticReceiptHash,
            replayKey: dispatchAttempt.toSnapshot().effectKey,
            scopeFingerprint: dispatchAttempt.toSnapshot().effectScope,
            expectedEffectSetHash: dispatchAttempt.toSnapshot().effectKey,
            effectScopeKey: dispatchAttempt.toSnapshot().effectKey,
            semanticCanonicalPayload: canonicalizeSemanticPayload(command.semanticReceipt),
          },
        });
        const collisionAttempt = dispatchAttempt.observeReceipt({
          decisionClass: "collision_review",
          observedAt: command.recordedAt,
        });
        await this.repositories.saveAdapterDispatchAttempt(collisionAttempt, {
          expectedVersion: dispatchAttempt.version,
        });
        const checkpoint = AdapterReceiptCheckpointDocument.create({
          receiptCheckpointId: this.idGenerator.nextId("adapterReceiptCheckpoint"),
          adapterContractProfileRef: command.adapterContractProfileRef,
          effectKey: command.effectKey,
          providerCorrelationRef,
          transportMessageId: command.transportMessageId,
          orderingKey: command.orderingKey,
          rawReceiptHash,
          semanticReceiptHash,
          decisionClass: "collision_review",
          linkedDispatchAttemptRef: collisionAttempt.dispatchAttemptId,
          linkedSettlementRef: collision.authoritativeSettlementRef,
          recordedAt: command.recordedAt,
          version: 1,
        });
        await this.repositories.saveAdapterReceiptCheckpoint(checkpoint);
        return {
          decisionClass: "collision_review",
          checkpoint,
          dispatchAttempt: collisionAttempt,
          collisionReview: collision.collisionReview,
        };
      }

      let decisionClass: AdapterReceiptDecisionClass = "accepted_new";
      if (latest && compareOrderingKeys(command.orderingKey, latest.toSnapshot().orderingKey) < 0) {
        decisionClass = "stale_ignored";
      }
      if (
        dispatchAttempt.confirmedSettlementRef &&
        command.linkedSettlementRef &&
        dispatchAttempt.confirmedSettlementRef !== command.linkedSettlementRef
      ) {
        const collision = await this.openCollisionReview({
          existingRecord: await this.requireIdempotencyRecord(
            dispatchAttempt.toSnapshot().idempotencyRecordRef,
          ),
          actionScope: command.actionScope,
          governingLineageRef: command.governingLineageRef,
          incomingSourceCommandId: command.transportMessageId,
          incomingTransportCorrelationId: providerCorrelationRef,
          incomingSemanticPayloadHash: semanticReceiptHash,
          incomingEffectSetHash: dispatchAttempt.toSnapshot().effectKey,
          collisionClass: "callback_scope_drift",
          observedAt: command.recordedAt,
          canonicalHashes: {
            rawPayloadHash: rawReceiptHash,
            semanticPayloadHash: semanticReceiptHash,
            replayKey: dispatchAttempt.toSnapshot().effectKey,
            scopeFingerprint: dispatchAttempt.toSnapshot().effectScope,
            expectedEffectSetHash: dispatchAttempt.toSnapshot().effectKey,
            effectScopeKey: dispatchAttempt.toSnapshot().effectKey,
            semanticCanonicalPayload: canonicalizeSemanticPayload(command.semanticReceipt),
          },
        });
        decisionClass = "collision_review";
        const nextAttempt = dispatchAttempt.observeReceipt({
          decisionClass,
          observedAt: command.recordedAt,
        });
        await this.repositories.saveAdapterDispatchAttempt(nextAttempt, {
          expectedVersion: dispatchAttempt.version,
        });
        const checkpoint = AdapterReceiptCheckpointDocument.create({
          receiptCheckpointId: this.idGenerator.nextId("adapterReceiptCheckpoint"),
          adapterContractProfileRef: command.adapterContractProfileRef,
          effectKey: command.effectKey,
          providerCorrelationRef,
          transportMessageId: command.transportMessageId,
          orderingKey: command.orderingKey,
          rawReceiptHash,
          semanticReceiptHash,
          decisionClass,
          linkedDispatchAttemptRef: nextAttempt.dispatchAttemptId,
          linkedSettlementRef: collision.authoritativeSettlementRef,
          recordedAt: command.recordedAt,
          version: 1,
        });
        await this.repositories.saveAdapterReceiptCheckpoint(checkpoint);
        return {
          decisionClass,
          checkpoint,
          dispatchAttempt: nextAttempt,
          collisionReview: collision.collisionReview,
        };
      }

      const checkpoint = AdapterReceiptCheckpointDocument.create({
        receiptCheckpointId: this.idGenerator.nextId("adapterReceiptCheckpoint"),
        adapterContractProfileRef: command.adapterContractProfileRef,
        effectKey: command.effectKey,
        providerCorrelationRef,
        transportMessageId: command.transportMessageId,
        orderingKey: command.orderingKey,
        rawReceiptHash,
        semanticReceiptHash,
        decisionClass,
        linkedDispatchAttemptRef: dispatchAttempt.dispatchAttemptId,
        linkedSettlementRef: command.linkedSettlementRef ?? dispatchAttempt.confirmedSettlementRef,
        recordedAt: command.recordedAt,
        version: 1,
      });
      await this.repositories.saveAdapterReceiptCheckpoint(checkpoint);

      const nextAttempt = dispatchAttempt.observeReceipt({
        decisionClass,
        linkedSettlementRef: command.linkedSettlementRef,
        observedAt: command.recordedAt,
      });
      await this.repositories.saveAdapterDispatchAttempt(nextAttempt, {
        expectedVersion: dispatchAttempt.version,
      });

      return {
        decisionClass,
        checkpoint,
        dispatchAttempt: nextAttempt,
      };
    });
  }

  async validateLedgerState(): Promise<readonly ReplayLedgerValidationIssue[]> {
    return validateReplayLedgerState({
      idempotencyRecords: await this.repositories.listIdempotencyRecords(),
      replayCollisionReviews: await this.repositories.listReplayCollisionReviews(),
      adapterDispatchAttempts: await this.repositories.listAdapterDispatchAttempts(),
      adapterReceiptCheckpoints: await this.repositories.listAdapterReceiptCheckpoints(),
    });
  }

  private async handleReplayMatch(
    existingRecord: IdempotencyRecordDocument,
    canonicalHashes: CanonicalReplayHashOutput,
    observedAt: string,
  ): Promise<ResolveInboundCommandResult> {
    const existingSnapshot = existingRecord.toSnapshot();
    if (
      existingSnapshot.decisionClass === "collision_review" &&
      existingSnapshot.collisionReviewRef
    ) {
      const collisionReview = await this.repositories.getReplayCollisionReview(
        existingSnapshot.collisionReviewRef,
      );
      return {
        decisionClass: "collision_review",
        idempotencyRecord: existingRecord,
        collisionReview: collisionReview ?? undefined,
        authoritativeActionRecordRef: existingSnapshot.firstAcceptedActionRecordRef,
        authoritativeSettlementRef: existingSnapshot.acceptedSettlementRef,
        canonicalHashes,
        blockedAutomaticMutation: true,
        reusedExistingRecord: true,
      };
    }

    const decisionClass: Exclude<IdempotencyDecisionClass, "collision_review" | "distinct"> =
      existingSnapshot.rawPayloadHash === canonicalHashes.rawPayloadHash
        ? "exact_replay"
        : "semantic_replay";
    const nextRecord = existingRecord.recordDecision({
      decisionClass,
      updatedAt: observedAt,
    });
    await this.repositories.saveIdempotencyRecord(nextRecord, {
      expectedVersion: existingRecord.version,
    });
    const nextSnapshot = nextRecord.toSnapshot();
    return {
      decisionClass,
      idempotencyRecord: nextRecord,
      authoritativeActionRecordRef: nextSnapshot.firstAcceptedActionRecordRef,
      authoritativeSettlementRef: nextSnapshot.acceptedSettlementRef,
      canonicalHashes,
      blockedAutomaticMutation: false,
      reusedExistingRecord: true,
    };
  }

  private async openCollisionReview(input: {
    existingRecord: IdempotencyRecordDocument;
    actionScope: string;
    governingLineageRef: string;
    incomingSourceCommandId: string | null;
    incomingTransportCorrelationId: string | null;
    incomingSemanticPayloadHash: string;
    incomingEffectSetHash: string;
    collisionClass: ReplayCollisionClass;
    observedAt: string;
    canonicalHashes: CanonicalReplayHashOutput;
  }): Promise<ResolveInboundCommandResult> {
    const existingSnapshot = input.existingRecord.toSnapshot();
    const reviewNaturalKey = buildCollisionNaturalKey({
      idempotencyRecordRef: input.existingRecord.idempotencyRecordId,
      actionScope: input.actionScope,
      governingLineageRef: input.governingLineageRef,
      incomingSourceCommandId: input.incomingSourceCommandId,
      incomingTransportCorrelationId: input.incomingTransportCorrelationId,
      incomingSemanticPayloadHash: input.incomingSemanticPayloadHash,
      incomingEffectSetHash: input.incomingEffectSetHash,
      collisionClass: input.collisionClass,
    });
    const existingReview =
      await this.repositories.findReplayCollisionReviewByNaturalKey(reviewNaturalKey);
    const collisionReview =
      existingReview ??
      ReplayCollisionReviewDocument.open({
        replayCollisionReviewId: this.idGenerator.nextId("replayCollisionReview"),
        idempotencyRecordRef: input.existingRecord.idempotencyRecordId,
        actionScope: input.actionScope,
        governingLineageRef: input.governingLineageRef,
        existingActionRecordRef: existingSnapshot.firstAcceptedActionRecordRef,
        existingSettlementRef: existingSnapshot.acceptedSettlementRef,
        incomingSourceCommandId: input.incomingSourceCommandId,
        incomingTransportCorrelationId: input.incomingTransportCorrelationId,
        incomingSemanticPayloadHash: input.incomingSemanticPayloadHash,
        incomingEffectSetHash: input.incomingEffectSetHash,
        collisionClass: input.collisionClass,
        reviewState: "open",
        createdAt: input.observedAt,
        resolvedAt: null,
        version: 1,
      });
    if (!existingReview) {
      await this.repositories.saveReplayCollisionReview(collisionReview);
    }

    const nextRecord = input.existingRecord.recordDecision({
      decisionClass: "collision_review",
      collisionReviewRef: collisionReview.replayCollisionReviewId,
      updatedAt: input.observedAt,
    });
    await this.repositories.saveIdempotencyRecord(nextRecord, {
      expectedVersion: input.existingRecord.version,
    });

    return {
      decisionClass: "collision_review",
      idempotencyRecord: nextRecord,
      collisionReview,
      authoritativeActionRecordRef: existingSnapshot.firstAcceptedActionRecordRef,
      authoritativeSettlementRef: existingSnapshot.acceptedSettlementRef,
      canonicalHashes: input.canonicalHashes,
      blockedAutomaticMutation: true,
      reusedExistingRecord: true,
    };
  }

  private async requireDispatchAttempt(effectKey: string): Promise<AdapterDispatchAttemptDocument> {
    const attempt = await this.repositories.findAdapterDispatchAttemptByEffectKey(effectKey);
    invariant(!!attempt, "ADAPTER_DISPATCH_ATTEMPT_NOT_FOUND", `Unknown effectKey ${effectKey}.`);
    return attempt;
  }

  private async requireIdempotencyRecord(
    idempotencyRecordId: string,
  ): Promise<IdempotencyRecordDocument> {
    const record = await this.repositories.getIdempotencyRecord(idempotencyRecordId);
    invariant(
      !!record,
      "IDEMPOTENCY_RECORD_NOT_FOUND",
      `Unknown IdempotencyRecord ${idempotencyRecordId}.`,
    );
    return record;
  }
}

export function validateReplayLedgerState(input: {
  idempotencyRecords: readonly IdempotencyRecordDocument[] | readonly IdempotencyRecordSnapshot[];
  replayCollisionReviews:
    | readonly ReplayCollisionReviewDocument[]
    | readonly ReplayCollisionReviewSnapshot[];
  adapterDispatchAttempts:
    | readonly AdapterDispatchAttemptDocument[]
    | readonly AdapterDispatchAttemptSnapshot[];
  adapterReceiptCheckpoints:
    | readonly AdapterReceiptCheckpointDocument[]
    | readonly AdapterReceiptCheckpointSnapshot[];
}): readonly ReplayLedgerValidationIssue[] {
  const idempotencyRecords = input.idempotencyRecords.map((record) =>
    "toSnapshot" in record ? record.toSnapshot() : record,
  );
  const replayCollisionReviews = input.replayCollisionReviews.map((review) =>
    "toSnapshot" in review ? review.toSnapshot() : review,
  );
  const adapterDispatchAttempts = input.adapterDispatchAttempts.map((attempt) =>
    "toSnapshot" in attempt ? attempt.toSnapshot() : attempt,
  );
  const adapterReceiptCheckpoints = input.adapterReceiptCheckpoints.map((checkpoint) =>
    "toSnapshot" in checkpoint ? checkpoint.toSnapshot() : checkpoint,
  );

  const issues: ReplayLedgerValidationIssue[] = [];

  const collisionReviewById = new Map(
    replayCollisionReviews.map((review) => [review.replayCollisionReviewId, review]),
  );
  for (const record of idempotencyRecords) {
    if (record.decisionClass === "collision_review") {
      const review = record.collisionReviewRef
        ? collisionReviewById.get(record.collisionReviewRef)
        : undefined;
      if (!review) {
        issues.push({
          code: "MISSING_COLLISION_REVIEW_REFERENCE",
          message: `IdempotencyRecord ${record.idempotencyRecordId} is collision_review without a ReplayCollisionReview.`,
          refs: [record.idempotencyRecordId],
          severity: "error",
        });
      } else if (
        review.existingActionRecordRef !== record.firstAcceptedActionRecordRef ||
        review.existingSettlementRef !== record.acceptedSettlementRef
      ) {
        issues.push({
          code: "COLLISION_REVIEW_ALLOWED_SECOND_CHAIN",
          message:
            "A collision review points at a different authoritative action or settlement than the bound IdempotencyRecord.",
          refs: [record.idempotencyRecordId, review.replayCollisionReviewId],
          severity: "error",
        });
      }
    }
  }

  const recordsByEffectScope = new Map<string, IdempotencyRecordSnapshot[]>();
  for (const record of idempotencyRecords) {
    const current = recordsByEffectScope.get(record.effectScopeKey) ?? [];
    current.push(record);
    recordsByEffectScope.set(record.effectScopeKey, current);
  }
  for (const [effectScopeKey, records] of recordsByEffectScope) {
    const actionChains = new Set(records.map((record) => record.firstAcceptedActionRecordRef));
    if (actionChains.size > 1) {
      issues.push({
        code: "MULTIPLE_ACCEPTED_ACTION_CHAINS_FOR_EFFECT_SCOPE",
        message: `Effect scope ${effectScopeKey} has more than one accepted action chain.`,
        refs: records.map((record) => record.idempotencyRecordId),
        severity: "error",
      });
    }
  }

  const attemptsByEffectKey = new Map<string, AdapterDispatchAttemptSnapshot[]>();
  for (const attempt of adapterDispatchAttempts) {
    const current = attemptsByEffectKey.get(attempt.effectKey) ?? [];
    current.push(attempt);
    attemptsByEffectKey.set(attempt.effectKey, current);
  }
  for (const [effectKey, attempts] of attemptsByEffectKey) {
    if (attempts.length > 1) {
      issues.push({
        code: "MULTIPLE_DISPATCH_ATTEMPTS_FOR_EFFECT_KEY",
        message: `Effect key ${effectKey} has more than one live AdapterDispatchAttempt.`,
        refs: attempts.map((attempt) => attempt.dispatchAttemptId),
        severity: "error",
      });
    }
  }

  const checkpointsByEffectKey = new Map<string, AdapterReceiptCheckpointSnapshot[]>();
  for (const checkpoint of adapterReceiptCheckpoints) {
    const current = checkpointsByEffectKey.get(checkpoint.effectKey) ?? [];
    current.push(checkpoint);
    checkpointsByEffectKey.set(checkpoint.effectKey, current);
  }
  for (const [effectKey, checkpoints] of checkpointsByEffectKey) {
    const linkedSettlements = new Set(
      checkpoints
        .filter((checkpoint) => checkpoint.decisionClass !== "stale_ignored")
        .map((checkpoint) => checkpoint.linkedSettlementRef)
        .filter((linkedSettlementRef): linkedSettlementRef is string =>
          Boolean(linkedSettlementRef),
        ),
    );
    if (linkedSettlements.size > 1) {
      issues.push({
        code: "RECEIPT_CHECKPOINT_CREATED_SECOND_SETTLEMENT_CHAIN",
        message: `Effect key ${effectKey} is linked to multiple settlement chains.`,
        refs: checkpoints.map((checkpoint) => checkpoint.receiptCheckpointId),
        severity: "error",
      });
    }
  }

  return issues;
}

export function createReplayCollisionStore() {
  return new InMemoryReplayCollisionStore();
}

export function createReplayCollisionAuthorityService(
  repositories: ReplayCollisionDependencies,
  idGenerator?: BackboneIdGenerator,
) {
  return new ReplayCollisionAuthorityService(repositories, idGenerator);
}
