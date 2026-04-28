import { createHash } from "node:crypto";
import {
  RequestBackboneInvariantError,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import type {
  BookingAuthoritativeProofClass,
  BookingCommitObservationKind,
  BookingTransactionAuthoritativeOutcomeState,
} from "./phase4-booking-commit-engine";

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

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1 inclusive.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function deterministicId(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(value).slice(0, 24)}`;
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
  map.set(key, structuredClone(row));
}

function encodeJson(value: unknown): string {
  return JSON.stringify(value);
}

function decodeJsonArray<T>(value: string, field: string): readonly T[] {
  try {
    const parsed = JSON.parse(value);
    invariant(Array.isArray(parsed), `INVALID_${field.toUpperCase()}_JSON`, `${field} must encode an array.`);
    return parsed as readonly T[];
  } catch (error) {
    throw new RequestBackboneInvariantError(
      `INVALID_${field.toUpperCase()}_JSON`,
      `${field} must be valid JSON.${error instanceof Error ? ` ${error.message}` : ""}`,
    );
  }
}

export const PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION =
  "292.phase4.booking-reconciliation-worker.v1" as const;

export type BookingReconciliationState =
  | "pending"
  | "poll_due"
  | "awaiting_callback"
  | "disputed"
  | "manual_attention"
  | "confirmed"
  | "failed"
  | "expired"
  | "superseded";

export type BookingReconciliationTrigger =
  | "commit_pending"
  | "commit_disputed"
  | "provider_callback"
  | "scheduled_read"
  | "manual_retry"
  | "manual_resolution"
  | "worker_restart";

export type BookingReconciliationAttemptAction =
  | "observe_pending"
  | "observe_dispute"
  | "observe_confirmed"
  | "observe_failed"
  | "observe_expired"
  | "manual_reconcile"
  | "queue_only"
  | "noop";

export type BookingReconciliationAttemptOutcome =
  | "pending"
  | "disputed"
  | "confirmed"
  | "failed"
  | "expired"
  | "superseded"
  | "ignored"
  | "security_rejected";

export type BookingReconciliationManualDisputeState = "none" | "open" | "resolved";

export interface BookingReconciliationEvidenceAtomSnapshot {
  evidenceRef: string;
  sourceFamily: string;
  proofRef?: string | null;
  logLikelihoodWeight: number;
  polarity: "positive" | "negative";
  satisfiesHardMatchRefs?: readonly string[];
  failsHardMatchRefs?: readonly string[];
  contradictory?: boolean;
}

export interface BookingReconciliationRecordSnapshot {
  bookingReconciliationRecordId: string;
  schemaVersion: typeof PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION;
  bookingCaseRef: string;
  bookingTransactionRef: string;
  requestLineageRef: string;
  offerSessionRef: string;
  selectedSlotRef: string;
  reservationTruthProjectionRef: string | null;
  confirmationTruthProjectionRef: string | null;
  appointmentRecordRef: string | null;
  externalConfirmationGateRef: string | null;
  latestReceiptCheckpointRef: string | null;
  currentAttemptRef: string | null;
  currentAttemptOrdinal: number;
  authoritativeReadAndConfirmationPolicyRef: string;
  authoritativeReadMode: "durable_provider_reference" | "read_after_write" | "gate_required";
  reconcileState: BookingReconciliationState;
  manualAttentionRequired: boolean;
  manualDisputeState: BookingReconciliationManualDisputeState;
  queueEntryRef: string | null;
  gateState: string | null;
  gateConfidence: number | null;
  competingGateMargin: number | null;
  confirmationDeadlineAt: string;
  firstObservedAt: string;
  lastObservedAt: string;
  lastSettledAt: string | null;
  nextAttemptAt: string | null;
  finalOutcomeState: BookingTransactionAuthoritativeOutcomeState;
  latestReasonCodes: readonly string[];
  evidenceRefs: readonly string[];
  monotoneRevision: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BookingReconciliationAttemptSnapshot {
  bookingReconciliationAttemptId: string;
  schemaVersion: typeof PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION;
  bookingReconciliationRecordRef: string;
  bookingCaseRef: string;
  bookingTransactionRef: string;
  attemptKey: string;
  attemptOrdinal: number;
  trigger: BookingReconciliationTrigger;
  workerRunRef: string;
  action: BookingReconciliationAttemptAction;
  outcome: BookingReconciliationAttemptOutcome;
  observationKind: BookingCommitObservationKind | null;
  authoritativeProofClass: BookingAuthoritativeProofClass;
  providerReference: string | null;
  receiptCheckpointRef: string | null;
  gateRef: string | null;
  reasonCodes: readonly string[];
  evidenceRefs: readonly string[];
  evidenceAtomsJson: string;
  competingGateConfidencesJson: string;
  manualOverrideRequested: boolean;
  nextAttemptAt: string | null;
  startedAt: string;
  completedAt: string;
  version: number;
}

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

class StoredDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

export interface BookingReconciliationBundle {
  record: BookingReconciliationRecordSnapshot;
  attempts: readonly BookingReconciliationAttemptSnapshot[];
}

export interface Phase4BookingReconciliationRepositories {
  getBookingReconciliationRecord(
    bookingReconciliationRecordId: string,
  ): Promise<SnapshotDocument<BookingReconciliationRecordSnapshot> | null>;
  findBookingReconciliationRecordByTransactionRef(
    bookingTransactionRef: string,
  ): Promise<SnapshotDocument<BookingReconciliationRecordSnapshot> | null>;
  listBookingReconciliationRecords(): Promise<
    readonly SnapshotDocument<BookingReconciliationRecordSnapshot>[]
  >;
  listDueBookingReconciliationRecords(
    dueAt: string,
    limit?: number | null,
  ): Promise<readonly SnapshotDocument<BookingReconciliationRecordSnapshot>[]>;
  getCurrentBookingReconciliationRecordRefForBookingCase(
    bookingCaseRef: string,
  ): Promise<string | null>;
  setCurrentBookingReconciliationRecordRefForBookingCase(
    bookingCaseRef: string,
    bookingReconciliationRecordId: string | null,
  ): Promise<void>;
  saveBookingReconciliationRecord(
    snapshot: BookingReconciliationRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getBookingReconciliationAttempt(
    bookingReconciliationAttemptId: string,
  ): Promise<SnapshotDocument<BookingReconciliationAttemptSnapshot> | null>;
  findBookingReconciliationAttemptByKey(
    attemptKey: string,
  ): Promise<SnapshotDocument<BookingReconciliationAttemptSnapshot> | null>;
  saveBookingReconciliationAttempt(
    snapshot: BookingReconciliationAttemptSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listBookingReconciliationAttemptsForRecord(
    bookingReconciliationRecordRef: string,
  ): Promise<readonly SnapshotDocument<BookingReconciliationAttemptSnapshot>[]>;
}

function normalizeEvidenceAtom(
  atom: BookingReconciliationEvidenceAtomSnapshot,
): BookingReconciliationEvidenceAtomSnapshot {
  return {
    evidenceRef: requireRef(atom.evidenceRef, "evidenceRef"),
    sourceFamily: requireRef(atom.sourceFamily, "sourceFamily"),
    proofRef: optionalRef(atom.proofRef),
    logLikelihoodWeight: Number.isFinite(atom.logLikelihoodWeight) ? atom.logLikelihoodWeight : 0,
    polarity: atom.polarity,
    satisfiesHardMatchRefs: uniqueSorted(atom.satisfiesHardMatchRefs ?? []),
    failsHardMatchRefs: uniqueSorted(atom.failsHardMatchRefs ?? []),
    contradictory: Boolean(atom.contradictory),
  };
}

function normalizeRecord(snapshot: BookingReconciliationRecordSnapshot): BookingReconciliationRecordSnapshot {
  return {
    ...snapshot,
    bookingReconciliationRecordId: requireRef(
      snapshot.bookingReconciliationRecordId,
      "bookingReconciliationRecordId",
    ),
    schemaVersion: PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION,
    bookingCaseRef: requireRef(snapshot.bookingCaseRef, "bookingCaseRef"),
    bookingTransactionRef: requireRef(snapshot.bookingTransactionRef, "bookingTransactionRef"),
    requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
    offerSessionRef: requireRef(snapshot.offerSessionRef, "offerSessionRef"),
    selectedSlotRef: requireRef(snapshot.selectedSlotRef, "selectedSlotRef"),
    reservationTruthProjectionRef: optionalRef(snapshot.reservationTruthProjectionRef),
    confirmationTruthProjectionRef: optionalRef(snapshot.confirmationTruthProjectionRef),
    appointmentRecordRef: optionalRef(snapshot.appointmentRecordRef),
    externalConfirmationGateRef: optionalRef(snapshot.externalConfirmationGateRef),
    latestReceiptCheckpointRef: optionalRef(snapshot.latestReceiptCheckpointRef),
    currentAttemptRef: optionalRef(snapshot.currentAttemptRef),
    currentAttemptOrdinal: ensureNonNegativeInteger(
      snapshot.currentAttemptOrdinal,
      "currentAttemptOrdinal",
    ),
    authoritativeReadAndConfirmationPolicyRef: requireRef(
      snapshot.authoritativeReadAndConfirmationPolicyRef,
      "authoritativeReadAndConfirmationPolicyRef",
    ),
    authoritativeReadMode: snapshot.authoritativeReadMode,
    reconcileState: snapshot.reconcileState,
    manualAttentionRequired: Boolean(snapshot.manualAttentionRequired),
    manualDisputeState: snapshot.manualDisputeState,
    queueEntryRef: optionalRef(snapshot.queueEntryRef),
    gateState: optionalRef(snapshot.gateState),
    gateConfidence:
      snapshot.gateConfidence === null ? null : ensureUnitInterval(snapshot.gateConfidence, "gateConfidence"),
    competingGateMargin:
      snapshot.competingGateMargin === null
        ? null
        : (invariant(
            Number.isFinite(snapshot.competingGateMargin),
            "INVALID_COMPETING_GATE_MARGIN",
            "competingGateMargin must be finite.",
          ),
          snapshot.competingGateMargin),
    confirmationDeadlineAt: ensureIsoTimestamp(
      snapshot.confirmationDeadlineAt,
      "confirmationDeadlineAt",
    ),
    firstObservedAt: ensureIsoTimestamp(snapshot.firstObservedAt, "firstObservedAt"),
    lastObservedAt: ensureIsoTimestamp(snapshot.lastObservedAt, "lastObservedAt"),
    lastSettledAt:
      snapshot.lastSettledAt === null
        ? null
        : ensureIsoTimestamp(snapshot.lastSettledAt, "lastSettledAt"),
    nextAttemptAt:
      snapshot.nextAttemptAt === null ? null : ensureIsoTimestamp(snapshot.nextAttemptAt, "nextAttemptAt"),
    finalOutcomeState: snapshot.finalOutcomeState,
    latestReasonCodes: uniqueSorted(snapshot.latestReasonCodes),
    evidenceRefs: uniqueSorted(snapshot.evidenceRefs),
    monotoneRevision: ensurePositiveInteger(snapshot.monotoneRevision, "monotoneRevision"),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeAttempt(
  snapshot: BookingReconciliationAttemptSnapshot,
): BookingReconciliationAttemptSnapshot {
  const evidenceAtoms = decodeJsonArray<BookingReconciliationEvidenceAtomSnapshot>(
    snapshot.evidenceAtomsJson,
    "evidenceAtomsJson",
  ).map((atom) => normalizeEvidenceAtom(atom));
  const competingGateConfidences = decodeJsonArray<number>(
    snapshot.competingGateConfidencesJson,
    "competingGateConfidencesJson",
  ).map((value) => ensureUnitInterval(value, "competingGateConfidence"));

  return {
    ...snapshot,
    bookingReconciliationAttemptId: requireRef(
      snapshot.bookingReconciliationAttemptId,
      "bookingReconciliationAttemptId",
    ),
    schemaVersion: PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION,
    bookingReconciliationRecordRef: requireRef(
      snapshot.bookingReconciliationRecordRef,
      "bookingReconciliationRecordRef",
    ),
    bookingCaseRef: requireRef(snapshot.bookingCaseRef, "bookingCaseRef"),
    bookingTransactionRef: requireRef(snapshot.bookingTransactionRef, "bookingTransactionRef"),
    attemptKey: requireRef(snapshot.attemptKey, "attemptKey"),
    attemptOrdinal: ensurePositiveInteger(snapshot.attemptOrdinal, "attemptOrdinal"),
    trigger: snapshot.trigger,
    workerRunRef: requireRef(snapshot.workerRunRef, "workerRunRef"),
    action: snapshot.action,
    outcome: snapshot.outcome,
    observationKind: snapshot.observationKind,
    authoritativeProofClass: snapshot.authoritativeProofClass,
    providerReference: optionalRef(snapshot.providerReference),
    receiptCheckpointRef: optionalRef(snapshot.receiptCheckpointRef),
    gateRef: optionalRef(snapshot.gateRef),
    reasonCodes: uniqueSorted(snapshot.reasonCodes),
    evidenceRefs: uniqueSorted(snapshot.evidenceRefs),
    evidenceAtomsJson: encodeJson(evidenceAtoms),
    competingGateConfidencesJson: encodeJson(competingGateConfidences),
    manualOverrideRequested: Boolean(snapshot.manualOverrideRequested),
    nextAttemptAt:
      snapshot.nextAttemptAt === null ? null : ensureIsoTimestamp(snapshot.nextAttemptAt, "nextAttemptAt"),
    startedAt: ensureIsoTimestamp(snapshot.startedAt, "startedAt"),
    completedAt: ensureIsoTimestamp(snapshot.completedAt, "completedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export function createPhase4BookingReconciliationStore(): Phase4BookingReconciliationRepositories {
  const records = new Map<string, BookingReconciliationRecordSnapshot>();
  const currentRecordByCase = new Map<string, string>();
  const recordRefByTransaction = new Map<string, string>();
  const attempts = new Map<string, BookingReconciliationAttemptSnapshot>();
  const attemptRefsByRecord = new Map<string, string[]>();
  const attemptRefByKey = new Map<string, string>();

  return {
    async getBookingReconciliationRecord(bookingReconciliationRecordId) {
      const row = records.get(bookingReconciliationRecordId);
      return row ? new StoredDocument(row) : null;
    },
    async findBookingReconciliationRecordByTransactionRef(bookingTransactionRef) {
      const ref = recordRefByTransaction.get(bookingTransactionRef);
      if (!ref) {
        return null;
      }
      const row = records.get(ref);
      return row ? new StoredDocument(row) : null;
    },
    async listBookingReconciliationRecords() {
      return [...records.values()]
        .sort((left, right) => compareIso(left.updatedAt, right.updatedAt))
        .map((row) => new StoredDocument(row));
    },
    async listDueBookingReconciliationRecords(dueAt, limit) {
      const normalizedDueAt = ensureIsoTimestamp(dueAt, "dueAt");
      const max = limit === null || limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, limit);
      return [...records.values()]
        .filter(
          (row) =>
            row.nextAttemptAt !== null &&
            compareIso(row.nextAttemptAt, normalizedDueAt) <= 0 &&
            row.reconcileState !== "confirmed" &&
            row.reconcileState !== "failed" &&
            row.reconcileState !== "expired" &&
            row.reconcileState !== "superseded",
        )
        .sort((left, right) => compareIso(left.nextAttemptAt!, right.nextAttemptAt!))
        .slice(0, max)
        .map((row) => new StoredDocument(row));
    },
    async getCurrentBookingReconciliationRecordRefForBookingCase(bookingCaseRef) {
      return currentRecordByCase.get(bookingCaseRef) ?? null;
    },
    async setCurrentBookingReconciliationRecordRefForBookingCase(
      bookingCaseRef,
      bookingReconciliationRecordId,
    ) {
      if (bookingReconciliationRecordId === null) {
        currentRecordByCase.delete(bookingCaseRef);
        return;
      }
      currentRecordByCase.set(bookingCaseRef, bookingReconciliationRecordId);
    },
    async saveBookingReconciliationRecord(snapshot, options) {
      const normalized = normalizeRecord(snapshot);
      saveWithCas(records, normalized.bookingReconciliationRecordId, normalized, options);
      recordRefByTransaction.set(
        normalized.bookingTransactionRef,
        normalized.bookingReconciliationRecordId,
      );
    },
    async getBookingReconciliationAttempt(bookingReconciliationAttemptId) {
      const row = attempts.get(bookingReconciliationAttemptId);
      return row ? new StoredDocument(row) : null;
    },
    async findBookingReconciliationAttemptByKey(attemptKey) {
      const ref = attemptRefByKey.get(attemptKey);
      if (!ref) {
        return null;
      }
      const row = attempts.get(ref);
      return row ? new StoredDocument(row) : null;
    },
    async saveBookingReconciliationAttempt(snapshot, options) {
      const normalized = normalizeAttempt(snapshot);
      saveWithCas(attempts, normalized.bookingReconciliationAttemptId, normalized, options);
      attemptRefByKey.set(normalized.attemptKey, normalized.bookingReconciliationAttemptId);
      const existingRefs = attemptRefsByRecord.get(normalized.bookingReconciliationRecordRef) ?? [];
      if (!existingRefs.includes(normalized.bookingReconciliationAttemptId)) {
        attemptRefsByRecord.set(normalized.bookingReconciliationRecordRef, [
          ...existingRefs,
          normalized.bookingReconciliationAttemptId,
        ]);
      }
    },
    async listBookingReconciliationAttemptsForRecord(bookingReconciliationRecordRef) {
      return (attemptRefsByRecord.get(bookingReconciliationRecordRef) ?? [])
        .map((ref) => attempts.get(ref))
        .filter((row): row is BookingReconciliationAttemptSnapshot => Boolean(row))
        .sort((left, right) => left.attemptOrdinal - right.attemptOrdinal)
        .map((row) => new StoredDocument(row));
    },
  };
}

function reconciliationStateRank(state: BookingReconciliationState): number {
  switch (state) {
    case "pending":
      return 1;
    case "poll_due":
      return 2;
    case "awaiting_callback":
      return 3;
    case "disputed":
      return 4;
    case "manual_attention":
      return 5;
    case "confirmed":
    case "failed":
    case "expired":
      return 6;
    case "superseded":
      return 7;
  }
}

function outcomeRank(state: BookingTransactionAuthoritativeOutcomeState): number {
  switch (state) {
    case "pending":
      return 1;
    case "confirmation_pending":
      return 2;
    case "reconciliation_required":
      return 3;
    case "booked":
    case "failed":
    case "expired":
      return 4;
    case "superseded":
      return 5;
  }
}

function isTerminalReconciliationState(state: BookingReconciliationState): boolean {
  return (
    state === "confirmed" ||
    state === "failed" ||
    state === "expired" ||
    state === "superseded"
  );
}

export interface SyncBookingReconciliationInput {
  bookingReconciliationRecordId?: string | null;
  bookingCaseRef: string;
  bookingTransactionRef: string;
  requestLineageRef: string;
  offerSessionRef: string;
  selectedSlotRef: string;
  reservationTruthProjectionRef?: string | null;
  confirmationTruthProjectionRef?: string | null;
  appointmentRecordRef?: string | null;
  externalConfirmationGateRef?: string | null;
  latestReceiptCheckpointRef?: string | null;
  queueEntryRef?: string | null;
  authoritativeReadAndConfirmationPolicyRef: string;
  authoritativeReadMode: BookingReconciliationRecordSnapshot["authoritativeReadMode"];
  reconcileState: BookingReconciliationState;
  manualAttentionRequired?: boolean;
  manualDisputeState?: BookingReconciliationManualDisputeState;
  gateState?: string | null;
  gateConfidence?: number | null;
  competingGateMargin?: number | null;
  confirmationDeadlineAt: string;
  nextAttemptAt?: string | null;
  finalOutcomeState: BookingTransactionAuthoritativeOutcomeState;
  latestReasonCodes?: readonly string[];
  evidenceRefs?: readonly string[];
  observedAt: string;
}

export interface RecordBookingReconciliationAttemptInput {
  bookingReconciliationRecordRef: string;
  bookingCaseRef: string;
  bookingTransactionRef: string;
  attemptKey?: string | null;
  trigger: BookingReconciliationTrigger;
  workerRunRef: string;
  action: BookingReconciliationAttemptAction;
  outcome: BookingReconciliationAttemptOutcome;
  observationKind?: BookingCommitObservationKind | null;
  authoritativeProofClass?: BookingAuthoritativeProofClass | null;
  providerReference?: string | null;
  receiptCheckpointRef?: string | null;
  gateRef?: string | null;
  reasonCodes?: readonly string[];
  evidenceRefs?: readonly string[];
  evidenceAtoms?: readonly BookingReconciliationEvidenceAtomSnapshot[];
  competingGateConfidences?: readonly number[];
  manualOverrideRequested?: boolean;
  nextAttemptAt?: string | null;
  startedAt: string;
  completedAt: string;
}

export interface QueryBookingReconciliationInput {
  bookingReconciliationRecordId?: string | null;
  bookingTransactionRef?: string | null;
  bookingCaseRef?: string | null;
}

export interface BookingReconciliationAttemptMutationResult {
  record: BookingReconciliationRecordSnapshot;
  attempt: BookingReconciliationAttemptSnapshot;
  replayed: boolean;
}

export interface Phase4BookingReconciliationService {
  repositories: Phase4BookingReconciliationRepositories;
  queryCurrentBookingReconciliation(
    input: QueryBookingReconciliationInput,
  ): Promise<BookingReconciliationBundle | null>;
  syncBookingReconciliation(input: SyncBookingReconciliationInput): Promise<BookingReconciliationBundle>;
  recordBookingReconciliationAttempt(
    input: RecordBookingReconciliationAttemptInput,
  ): Promise<BookingReconciliationAttemptMutationResult>;
  listDueBookingReconciliations(
    dueAt: string,
    limit?: number | null,
  ): Promise<readonly BookingReconciliationBundle[]>;
}

export function createPhase4BookingReconciliationService(input?: {
  repositories?: Phase4BookingReconciliationRepositories;
}): Phase4BookingReconciliationService {
  const repositories =
    input?.repositories ?? createPhase4BookingReconciliationStore();

  async function loadBundle(
    record: BookingReconciliationRecordSnapshot,
  ): Promise<BookingReconciliationBundle> {
    const attempts = (
      await repositories.listBookingReconciliationAttemptsForRecord(
        record.bookingReconciliationRecordId,
      )
    ).map((entry) => entry.toSnapshot());
    return {
      record,
      attempts,
    };
  }

  async function resolveRecord(
    input: QueryBookingReconciliationInput,
  ): Promise<BookingReconciliationRecordSnapshot | null> {
    const explicitRecordRef = optionalRef(input.bookingReconciliationRecordId);
    if (explicitRecordRef) {
      return (
        (await repositories.getBookingReconciliationRecord(explicitRecordRef))?.toSnapshot() ?? null
      );
    }
    const transactionRef = optionalRef(input.bookingTransactionRef);
    if (transactionRef) {
      return (
        (await repositories.findBookingReconciliationRecordByTransactionRef(transactionRef))?.toSnapshot() ??
        null
      );
    }
    const bookingCaseRef = optionalRef(input.bookingCaseRef);
    if (bookingCaseRef) {
      const currentRef = await repositories.getCurrentBookingReconciliationRecordRefForBookingCase(
        bookingCaseRef,
      );
      if (!currentRef) {
        return null;
      }
      return (await repositories.getBookingReconciliationRecord(currentRef))?.toSnapshot() ?? null;
    }
    return null;
  }

  return {
    repositories,

    async queryCurrentBookingReconciliation(input) {
      const record = await resolveRecord(input);
      return record ? loadBundle(record) : null;
    },

    async syncBookingReconciliation(command) {
      const observedAt = ensureIsoTimestamp(command.observedAt, "observedAt");
      const existing =
        (optionalRef(command.bookingReconciliationRecordId)
          ? await repositories.getBookingReconciliationRecord(
              requireRef(command.bookingReconciliationRecordId, "bookingReconciliationRecordId"),
            )
          : null) ??
        (await repositories.findBookingReconciliationRecordByTransactionRef(
          requireRef(command.bookingTransactionRef, "bookingTransactionRef"),
        ));
      const current = existing?.toSnapshot() ?? null;

      const keepExistingFinalState =
        current !== null &&
        isTerminalReconciliationState(current.reconcileState) &&
        reconciliationStateRank(command.reconcileState) < reconciliationStateRank(current.reconcileState);
      const keepExistingFinalOutcome =
        current !== null &&
        outcomeRank(command.finalOutcomeState) < outcomeRank(current.finalOutcomeState);

      const next: BookingReconciliationRecordSnapshot = normalizeRecord({
        bookingReconciliationRecordId:
          current?.bookingReconciliationRecordId ??
          deterministicId("booking_reconciliation", {
            bookingCaseRef: command.bookingCaseRef,
            bookingTransactionRef: command.bookingTransactionRef,
          }),
        schemaVersion: PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION,
        bookingCaseRef: requireRef(command.bookingCaseRef, "bookingCaseRef"),
        bookingTransactionRef: requireRef(command.bookingTransactionRef, "bookingTransactionRef"),
        requestLineageRef: requireRef(command.requestLineageRef, "requestLineageRef"),
        offerSessionRef: requireRef(command.offerSessionRef, "offerSessionRef"),
        selectedSlotRef: requireRef(command.selectedSlotRef, "selectedSlotRef"),
        reservationTruthProjectionRef:
          optionalRef(command.reservationTruthProjectionRef) ??
          current?.reservationTruthProjectionRef ??
          null,
        confirmationTruthProjectionRef:
          optionalRef(command.confirmationTruthProjectionRef) ??
          current?.confirmationTruthProjectionRef ??
          null,
        appointmentRecordRef:
          optionalRef(command.appointmentRecordRef) ?? current?.appointmentRecordRef ?? null,
        externalConfirmationGateRef:
          optionalRef(command.externalConfirmationGateRef) ??
          current?.externalConfirmationGateRef ??
          null,
        latestReceiptCheckpointRef:
          optionalRef(command.latestReceiptCheckpointRef) ??
          current?.latestReceiptCheckpointRef ??
          null,
        currentAttemptRef: current?.currentAttemptRef ?? null,
        currentAttemptOrdinal: current?.currentAttemptOrdinal ?? 0,
        authoritativeReadAndConfirmationPolicyRef: requireRef(
          command.authoritativeReadAndConfirmationPolicyRef,
          "authoritativeReadAndConfirmationPolicyRef",
        ),
        authoritativeReadMode: command.authoritativeReadMode,
        reconcileState: keepExistingFinalState ? current!.reconcileState : command.reconcileState,
        manualAttentionRequired:
          keepExistingFinalState && current !== null
            ? current.manualAttentionRequired
            : Boolean(command.manualAttentionRequired ?? current?.manualAttentionRequired),
        manualDisputeState:
          command.manualDisputeState ??
          current?.manualDisputeState ??
          "none",
        queueEntryRef: optionalRef(command.queueEntryRef) ?? current?.queueEntryRef ?? null,
        gateState: optionalRef(command.gateState) ?? current?.gateState ?? null,
        gateConfidence:
          command.gateConfidence ?? current?.gateConfidence ?? null,
        competingGateMargin:
          command.competingGateMargin ?? current?.competingGateMargin ?? null,
        confirmationDeadlineAt:
          ensureIsoTimestamp(command.confirmationDeadlineAt, "confirmationDeadlineAt"),
        firstObservedAt: current?.firstObservedAt ?? observedAt,
        lastObservedAt: observedAt,
        lastSettledAt:
          keepExistingFinalState && current !== null
            ? current.lastSettledAt
            : isTerminalReconciliationState(command.reconcileState)
              ? observedAt
              : current?.lastSettledAt ?? null,
        nextAttemptAt:
          keepExistingFinalState && current !== null
            ? current.nextAttemptAt
            : optionalRef(command.nextAttemptAt) ??
              (isTerminalReconciliationState(command.reconcileState) ? null : current?.nextAttemptAt ?? null),
        finalOutcomeState: keepExistingFinalOutcome
          ? current!.finalOutcomeState
          : command.finalOutcomeState,
        latestReasonCodes: uniqueSorted([
          ...(current?.latestReasonCodes ?? []),
          ...(command.latestReasonCodes ?? []),
        ]),
        evidenceRefs: uniqueSorted([
          ...(current?.evidenceRefs ?? []),
          ...(command.evidenceRefs ?? []),
        ]),
        monotoneRevision: (current?.monotoneRevision ?? 0) + 1,
        createdAt: current?.createdAt ?? observedAt,
        updatedAt: observedAt,
        version: (current?.version ?? 0) + 1,
      });

      await repositories.saveBookingReconciliationRecord(next, {
        expectedVersion: current?.version,
      });
      await repositories.setCurrentBookingReconciliationRecordRefForBookingCase(
        next.bookingCaseRef,
        next.bookingReconciliationRecordId,
      );
      return loadBundle(next);
    },

    async recordBookingReconciliationAttempt(command) {
      const recordDocument = await repositories.getBookingReconciliationRecord(
        requireRef(command.bookingReconciliationRecordRef, "bookingReconciliationRecordRef"),
      );
      invariant(
        recordDocument,
        "BOOKING_RECONCILIATION_RECORD_NOT_FOUND",
        `BookingReconciliationRecord ${command.bookingReconciliationRecordRef} was not found.`,
      );
      const record = recordDocument.toSnapshot();
      const startedAt = ensureIsoTimestamp(command.startedAt, "startedAt");
      const completedAt = ensureIsoTimestamp(command.completedAt, "completedAt");
      invariant(
        compareIso(completedAt, startedAt) >= 0,
        "RECONCILIATION_ATTEMPT_COMPLETED_BEFORE_STARTED",
        "completedAt may not precede startedAt.",
      );
      const attemptKey =
        optionalRef(command.attemptKey) ??
        deterministicId("booking_reconciliation_attempt_key", {
          bookingReconciliationRecordRef: record.bookingReconciliationRecordId,
          trigger: command.trigger,
          workerRunRef: command.workerRunRef,
          action: command.action,
          outcome: command.outcome,
          observationKind: command.observationKind ?? null,
          authoritativeProofClass: command.authoritativeProofClass ?? "none",
          providerReference: command.providerReference ?? null,
          reasonCodes: uniqueSorted(command.reasonCodes ?? []),
          evidenceRefs: uniqueSorted(command.evidenceRefs ?? []),
          evidenceAtoms: (command.evidenceAtoms ?? []).map((atom) => normalizeEvidenceAtom(atom)),
          startedAt,
          completedAt,
        });

      const existingAttempt =
        await repositories.findBookingReconciliationAttemptByKey(attemptKey);
      if (existingAttempt) {
        return {
          record,
          attempt: existingAttempt.toSnapshot(),
          replayed: true,
        };
      }

      const attempt: BookingReconciliationAttemptSnapshot = normalizeAttempt({
        bookingReconciliationAttemptId: deterministicId("booking_reconciliation_attempt", {
          bookingReconciliationRecordRef: record.bookingReconciliationRecordId,
          attemptKey,
          attemptOrdinal: record.currentAttemptOrdinal + 1,
        }),
        schemaVersion: PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION,
        bookingReconciliationRecordRef: record.bookingReconciliationRecordId,
        bookingCaseRef: requireRef(command.bookingCaseRef, "bookingCaseRef"),
        bookingTransactionRef: requireRef(command.bookingTransactionRef, "bookingTransactionRef"),
        attemptKey,
        attemptOrdinal: record.currentAttemptOrdinal + 1,
        trigger: command.trigger,
        workerRunRef: requireRef(command.workerRunRef, "workerRunRef"),
        action: command.action,
        outcome: command.outcome,
        observationKind: command.observationKind ?? null,
        authoritativeProofClass: command.authoritativeProofClass ?? "none",
        providerReference: optionalRef(command.providerReference),
        receiptCheckpointRef: optionalRef(command.receiptCheckpointRef),
        gateRef: optionalRef(command.gateRef),
        reasonCodes: uniqueSorted(command.reasonCodes ?? []),
        evidenceRefs: uniqueSorted(command.evidenceRefs ?? []),
        evidenceAtomsJson: encodeJson(
          (command.evidenceAtoms ?? []).map((atom) => normalizeEvidenceAtom(atom)),
        ),
        competingGateConfidencesJson: encodeJson(command.competingGateConfidences ?? []),
        manualOverrideRequested: Boolean(command.manualOverrideRequested),
        nextAttemptAt: optionalRef(command.nextAttemptAt),
        startedAt,
        completedAt,
        version: 1,
      });
      await repositories.saveBookingReconciliationAttempt(attempt);

      const nextRecord = normalizeRecord({
        ...record,
        currentAttemptRef: attempt.bookingReconciliationAttemptId,
        currentAttemptOrdinal: attempt.attemptOrdinal,
        latestReceiptCheckpointRef:
          attempt.receiptCheckpointRef ?? record.latestReceiptCheckpointRef,
        externalConfirmationGateRef: attempt.gateRef ?? record.externalConfirmationGateRef,
        latestReasonCodes: uniqueSorted([
          ...record.latestReasonCodes,
          ...attempt.reasonCodes,
        ]),
        evidenceRefs: uniqueSorted([
          ...record.evidenceRefs,
          ...attempt.evidenceRefs,
        ]),
        lastObservedAt: completedAt,
        nextAttemptAt: attempt.nextAttemptAt,
        updatedAt: completedAt,
        version: record.version + 1,
      });
      await repositories.saveBookingReconciliationRecord(nextRecord, {
        expectedVersion: record.version,
      });

      return {
        record: nextRecord,
        attempt,
        replayed: false,
      };
    },

    async listDueBookingReconciliations(dueAt, limit) {
      const dueRecords = await repositories.listDueBookingReconciliationRecords(
        dueAt,
        limit ?? null,
      );
      const bundles: BookingReconciliationBundle[] = [];
      for (const document of dueRecords) {
        bundles.push(await loadBundle(document.toSnapshot()));
      }
      return bundles;
    },
  };
}

export function parseBookingReconciliationEvidenceAtoms(
  attempt: BookingReconciliationAttemptSnapshot,
): readonly BookingReconciliationEvidenceAtomSnapshot[] {
  return decodeJsonArray<BookingReconciliationEvidenceAtomSnapshot>(
    attempt.evidenceAtomsJson,
    "evidenceAtomsJson",
  ).map((atom) => normalizeEvidenceAtom(atom));
}

export function parseBookingReconciliationCompetingGateConfidences(
  attempt: BookingReconciliationAttemptSnapshot,
): readonly number[] {
  return decodeJsonArray<number>(
    attempt.competingGateConfidencesJson,
    "competingGateConfidencesJson",
  ).map((value) => ensureUnitInterval(value, "competingGateConfidence"));
}
