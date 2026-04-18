import { createHash } from "node:crypto";
import {
  RequestBackboneInvariantError,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  makeFoundationEvent,
  type FoundationEventEnvelope,
} from "@vecells/event-contracts";

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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

const PHASE4_BOOKING_COMMIT_SCHEMA_VERSION =
  "287.phase4.booking-commit-confirmation.v1" as const;

export type BookingAuthoritativeProofClass =
  | "none"
  | "durable_provider_reference"
  | "same_commit_read_after_write"
  | "reconciled_confirmation";

export type BookingCommitRevalidationState = "pending" | "passed" | "failed" | "superseded";

export type BookingCommitHoldState =
  | "none"
  | "soft_selected"
  | "held"
  | "pending_confirmation"
  | "confirmed"
  | "released"
  | "expired"
  | "disputed";

export type BookingCommitDispatchState =
  | "created"
  | "preflight_failed"
  | "ready_to_dispatch"
  | "dispatch_pending"
  | "accepted_for_processing"
  | "confirmation_pending"
  | "reconciliation_required"
  | "confirmed"
  | "failed"
  | "expired"
  | "superseded";

export type BookingConfirmationState =
  | "booking_in_progress"
  | "confirmation_pending"
  | "reconciliation_required"
  | "confirmed"
  | "failed"
  | "expired"
  | "superseded";

export type BookingTransactionLocalAckState = "none" | "shown" | "superseded";

export type BookingTransactionProcessingAcceptanceState =
  | "not_started"
  | "accepted_for_processing"
  | "awaiting_external_confirmation"
  | "externally_accepted"
  | "externally_rejected"
  | "timed_out";

export type BookingTransactionExternalObservationState =
  | "unobserved"
  | "provider_reference_seen"
  | "read_after_write_seen"
  | "disputed"
  | "failed"
  | "expired";

export type BookingTransactionAuthoritativeOutcomeState =
  | "pending"
  | "confirmation_pending"
  | "reconciliation_required"
  | "booked"
  | "failed"
  | "expired"
  | "superseded";

export type BookingConfirmationPatientVisibilityState =
  | "selected_slot_pending"
  | "provisional_receipt"
  | "booked_summary"
  | "recovery_required";

export type BookingConfirmationManageExposureState = "hidden" | "summary_only" | "writable";
export type BookingConfirmationArtifactExposureState =
  | "hidden"
  | "summary_only"
  | "handoff_ready";
export type BookingConfirmationReminderExposureState =
  | "blocked"
  | "pending_schedule"
  | "scheduled";

export type BookingExceptionClass =
  | "preflight_failure"
  | "authoritative_failure"
  | "dispatch_ambiguity"
  | "receipt_divergence"
  | "local_compensation_required"
  | "supplier_reconciliation_required";

export type BookingExceptionState = "open" | "resolved" | "superseded";

export type BookingCommitObservationKind =
  | "durable_provider_reference"
  | "same_commit_read_after_write"
  | "reconciled_confirmation"
  | "confirmation_pending"
  | "reconciliation_required"
  | "authoritative_failure"
  | "expired";

export interface BookingCommitPolicySnapshot {
  authoritativeReadAndConfirmationPolicyRef: string;
  authoritativeReadMode: "durable_provider_reference" | "read_after_write" | "gate_required";
  allowedAuthoritativeProofClasses: readonly Exclude<BookingAuthoritativeProofClass, "none">[];
  supportsAsyncCommitConfirmation: boolean;
  supportsDisputeRecovery: boolean;
  manageExposureBeforeProof: "hidden" | "summary_only";
  patientVisibilityBeforeProof: "provisional_receipt" | "summary_only";
}

export interface BookingTransactionSnapshot {
  bookingTransactionId: string;
  schemaVersion: typeof PHASE4_BOOKING_COMMIT_SCHEMA_VERSION;
  bookingCaseId: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  snapshotId: string;
  offerSessionRef: string;
  sourceDecisionEpochRef: string;
  sourceDecisionSupersessionRef: string | null;
  selectedSlotRef: string;
  canonicalReservationKey: string;
  selectedCandidateHash: string;
  selectionProofHash: string;
  policyBundleHash: string;
  capabilityResolutionRef: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  adapterContractProfileRef: string;
  authoritativeReadAndConfirmationPolicyRef: string;
  authoritativeReadMode: BookingCommitPolicySnapshot["authoritativeReadMode"];
  allowedAuthoritativeProofClasses: readonly Exclude<BookingAuthoritativeProofClass, "none">[];
  supportsAsyncCommitConfirmation: boolean;
  supportsDisputeRecovery: boolean;
  manageExposureBeforeProof: BookingCommitPolicySnapshot["manageExposureBeforeProof"];
  patientVisibilityBeforeProof: BookingCommitPolicySnapshot["patientVisibilityBeforeProof"];
  capabilityTupleHash: string;
  reservationTruthProjectionRef: string | null;
  confirmationTruthProjectionRef: string;
  idempotencyKey: string;
  preflightVersion: string;
  reservationVersion: number;
  reservationVersionRef: string;
  supplierObservedAt: string | null;
  revalidationProofHash: string;
  requestLifecycleLeaseRef: string;
  requestOwnershipEpochRef: number;
  reviewActionLeaseRef: string | null;
  fencingToken: string;
  dispatchEffectKeyRef: string;
  dispatchAttemptRef: string | null;
  latestReceiptCheckpointRef: string | null;
  externalConfirmationGateRef: string | null;
  appointmentRecordRef: string | null;
  bookingExceptionRef: string | null;
  commitAttempt: number;
  revalidationState: BookingCommitRevalidationState;
  holdState: BookingCommitHoldState;
  commitState: BookingCommitDispatchState;
  confirmationState: BookingConfirmationState;
  localAckState: BookingTransactionLocalAckState;
  processingAcceptanceState: BookingTransactionProcessingAcceptanceState;
  externalObservationState: BookingTransactionExternalObservationState;
  authoritativeOutcomeState: BookingTransactionAuthoritativeOutcomeState;
  settlementRevision: number;
  providerReference: string | null;
  authoritativeProofClass: BookingAuthoritativeProofClass;
  blockerReasonCodes: readonly string[];
  guardedRecheckReasonCodes: readonly string[];
  reconciliationReasonCodes: readonly string[];
  compensationReasonCodes: readonly string[];
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string | null;
  transitionEnvelopeRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BookingConfirmationTruthProjectionSnapshot {
  bookingConfirmationTruthProjectionId: string;
  schemaVersion: typeof PHASE4_BOOKING_COMMIT_SCHEMA_VERSION;
  bookingCaseRef: string;
  bookingTransactionRef: string;
  selectedSlotRef: string;
  appointmentRecordRef: string | null;
  externalConfirmationGateRef: string | null;
  commandSettlementRecordRef: string;
  latestReceiptCheckpointRef: string | null;
  providerReference: string | null;
  authoritativeProofClass: BookingAuthoritativeProofClass;
  confirmationTruthState: BookingConfirmationState;
  patientVisibilityState: BookingConfirmationPatientVisibilityState;
  manageExposureState: BookingConfirmationManageExposureState;
  artifactExposureState: BookingConfirmationArtifactExposureState;
  reminderExposureState: BookingConfirmationReminderExposureState;
  continuityEvidenceRef: string;
  truthBasisHash: string;
  projectionFreshnessEnvelopeRef: string;
  settlementRevision: number;
  generatedAt: string;
  version: number;
}

export interface AppointmentRecordSnapshot {
  appointmentRecordId: string;
  schemaVersion: typeof PHASE4_BOOKING_COMMIT_SCHEMA_VERSION;
  bookingCaseRef: string;
  bookingTransactionRef: string;
  selectedSlotRef: string;
  canonicalReservationKey: string;
  providerAdapterBindingRef: string;
  providerReference: string | null;
  authoritativeProofClass: Exclude<BookingAuthoritativeProofClass, "none">;
  appointmentStatus: "booked";
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BookingExceptionSnapshot {
  bookingExceptionId: string;
  schemaVersion: typeof PHASE4_BOOKING_COMMIT_SCHEMA_VERSION;
  bookingCaseRef: string;
  bookingTransactionRef: string;
  exceptionClass: BookingExceptionClass;
  exceptionState: BookingExceptionState;
  reasonCode: string;
  providerCorrelationRef: string | null;
  linkedReceiptCheckpointRef: string | null;
  detailsHash: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BookingTransactionJournalEntrySnapshot {
  bookingTransactionJournalEntryId: string;
  bookingTransactionRef: string;
  bookingCaseRef: string;
  previousAuthoritativeOutcomeState: BookingTransactionAuthoritativeOutcomeState | "none";
  nextAuthoritativeOutcomeState: BookingTransactionAuthoritativeOutcomeState;
  previousConfirmationTruthState: BookingConfirmationState | "none";
  nextConfirmationTruthState: BookingConfirmationState;
  previousCommitState: BookingCommitDispatchState | "none";
  nextCommitState: BookingCommitDispatchState;
  actionScope:
    | "begin_commit"
    | "authoritative_observation"
    | "reconcile_ambiguous"
    | "release_or_supersede_failed";
  reasonCodes: readonly string[];
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
  recordedAt: string;
  version: number;
}

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

class StoredSnapshotDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

export interface Phase4BookingCommitRepositories {
  getBookingTransaction(
    bookingTransactionId: string,
  ): Promise<SnapshotDocument<BookingTransactionSnapshot> | null>;
  findBookingTransactionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<SnapshotDocument<BookingTransactionSnapshot> | null>;
  listBookingTransactionsForCase(
    bookingCaseId: string,
  ): Promise<readonly SnapshotDocument<BookingTransactionSnapshot>[]>;
  saveBookingTransaction(
    snapshot: BookingTransactionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentBookingTransactionRef(bookingCaseId: string): Promise<string | null>;
  setCurrentBookingTransactionRef(
    bookingCaseId: string,
    bookingTransactionId: string | null,
  ): Promise<void>;
  getBookingConfirmationTruthProjection(
    bookingConfirmationTruthProjectionId: string,
  ): Promise<SnapshotDocument<BookingConfirmationTruthProjectionSnapshot> | null>;
  saveBookingConfirmationTruthProjection(
    snapshot: BookingConfirmationTruthProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentBookingConfirmationTruthProjectionRef(bookingCaseId: string): Promise<string | null>;
  setCurrentBookingConfirmationTruthProjectionRef(
    bookingCaseId: string,
    bookingConfirmationTruthProjectionId: string | null,
  ): Promise<void>;
  getAppointmentRecord(
    appointmentRecordId: string,
  ): Promise<SnapshotDocument<AppointmentRecordSnapshot> | null>;
  saveAppointmentRecord(
    snapshot: AppointmentRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentAppointmentRecordRef(bookingCaseId: string): Promise<string | null>;
  setCurrentAppointmentRecordRef(bookingCaseId: string, appointmentRecordId: string | null): Promise<void>;
  getBookingException(
    bookingExceptionId: string,
  ): Promise<SnapshotDocument<BookingExceptionSnapshot> | null>;
  saveBookingException(
    snapshot: BookingExceptionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listBookingExceptionsForCase(
    bookingCaseId: string,
  ): Promise<readonly SnapshotDocument<BookingExceptionSnapshot>[]>;
  appendBookingTransactionJournalEntry(
    snapshot: BookingTransactionJournalEntrySnapshot,
  ): Promise<void>;
  listBookingTransactionJournalEntries(
    bookingTransactionId: string,
  ): Promise<readonly SnapshotDocument<BookingTransactionJournalEntrySnapshot>[]>;
}

export function createPhase4BookingCommitStore(): Phase4BookingCommitRepositories {
  const transactions = new Map<string, BookingTransactionSnapshot>();
  const transactionByIdempotencyKey = new Map<string, string>();
  const currentTransactionByCase = new Map<string, string>();
  const confirmationTruths = new Map<string, BookingConfirmationTruthProjectionSnapshot>();
  const currentConfirmationTruthByCase = new Map<string, string>();
  const appointments = new Map<string, AppointmentRecordSnapshot>();
  const currentAppointmentByCase = new Map<string, string>();
  const exceptions = new Map<string, BookingExceptionSnapshot>();
  const exceptionRefsByCase = new Map<string, string[]>();
  const journals = new Map<string, BookingTransactionJournalEntrySnapshot[]>();

  return {
    async getBookingTransaction(bookingTransactionId) {
      const row = transactions.get(bookingTransactionId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async findBookingTransactionByIdempotencyKey(idempotencyKey) {
      const txId = transactionByIdempotencyKey.get(idempotencyKey);
      if (!txId) {
        return null;
      }
      const row = transactions.get(txId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async listBookingTransactionsForCase(bookingCaseId) {
      return [...transactions.values()]
        .filter((row) => row.bookingCaseId === bookingCaseId)
        .sort((left, right) => compareIso(left.createdAt, right.createdAt))
        .map((row) => new StoredSnapshotDocument(row));
    },
    async saveBookingTransaction(snapshot, options) {
      saveWithCas(transactions, snapshot.bookingTransactionId, snapshot, options);
      transactionByIdempotencyKey.set(snapshot.idempotencyKey, snapshot.bookingTransactionId);
    },
    async getCurrentBookingTransactionRef(bookingCaseId) {
      return currentTransactionByCase.get(bookingCaseId) ?? null;
    },
    async setCurrentBookingTransactionRef(bookingCaseId, bookingTransactionId) {
      if (bookingTransactionId === null) {
        currentTransactionByCase.delete(bookingCaseId);
        return;
      }
      currentTransactionByCase.set(bookingCaseId, bookingTransactionId);
    },
    async getBookingConfirmationTruthProjection(bookingConfirmationTruthProjectionId) {
      const row = confirmationTruths.get(bookingConfirmationTruthProjectionId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async saveBookingConfirmationTruthProjection(snapshot, options) {
      saveWithCas(
        confirmationTruths,
        snapshot.bookingConfirmationTruthProjectionId,
        snapshot,
        options,
      );
    },
    async getCurrentBookingConfirmationTruthProjectionRef(bookingCaseId) {
      return currentConfirmationTruthByCase.get(bookingCaseId) ?? null;
    },
    async setCurrentBookingConfirmationTruthProjectionRef(
      bookingCaseId,
      bookingConfirmationTruthProjectionId,
    ) {
      if (bookingConfirmationTruthProjectionId === null) {
        currentConfirmationTruthByCase.delete(bookingCaseId);
        return;
      }
      currentConfirmationTruthByCase.set(bookingCaseId, bookingConfirmationTruthProjectionId);
    },
    async getAppointmentRecord(appointmentRecordId) {
      const row = appointments.get(appointmentRecordId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async saveAppointmentRecord(snapshot, options) {
      saveWithCas(appointments, snapshot.appointmentRecordId, snapshot, options);
    },
    async getCurrentAppointmentRecordRef(bookingCaseId) {
      return currentAppointmentByCase.get(bookingCaseId) ?? null;
    },
    async setCurrentAppointmentRecordRef(bookingCaseId, appointmentRecordId) {
      if (appointmentRecordId === null) {
        currentAppointmentByCase.delete(bookingCaseId);
        return;
      }
      currentAppointmentByCase.set(bookingCaseId, appointmentRecordId);
    },
    async getBookingException(bookingExceptionId) {
      const row = exceptions.get(bookingExceptionId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async saveBookingException(snapshot, options) {
      saveWithCas(exceptions, snapshot.bookingExceptionId, snapshot, options);
      const existing = exceptionRefsByCase.get(snapshot.bookingCaseRef) ?? [];
      if (!existing.includes(snapshot.bookingExceptionId)) {
        exceptionRefsByCase.set(snapshot.bookingCaseRef, [...existing, snapshot.bookingExceptionId]);
      }
    },
    async listBookingExceptionsForCase(bookingCaseId) {
      return (exceptionRefsByCase.get(bookingCaseId) ?? [])
        .map((id) => exceptions.get(id))
        .filter((row): row is BookingExceptionSnapshot => Boolean(row))
        .sort((left, right) => compareIso(left.createdAt, right.createdAt))
        .map((row) => new StoredSnapshotDocument(row));
    },
    async appendBookingTransactionJournalEntry(snapshot) {
      const existing = journals.get(snapshot.bookingTransactionRef) ?? [];
      invariant(
        snapshot.version === (existing.at(-1)?.version ?? 0) + 1,
        "NON_MONOTONE_BOOKING_TRANSACTION_JOURNAL",
        `BookingTransaction journal for ${snapshot.bookingTransactionRef} must append monotonically.`,
      );
      journals.set(snapshot.bookingTransactionRef, [...existing, structuredClone(snapshot)]);
    },
    async listBookingTransactionJournalEntries(bookingTransactionId) {
      return (journals.get(bookingTransactionId) ?? []).map(
        (row) => new StoredSnapshotDocument(row),
      );
    },
  };
}

export type BeginCommitDispatchOutcomeInput =
  | {
      kind: "authoritative_success";
      authoritativeProofClass: Exclude<BookingAuthoritativeProofClass, "none">;
      providerReference?: string | null;
      settlementRef: string;
    }
  | {
      kind: "confirmation_pending";
      blockerReasonCode: string;
      recoveryMode: string;
      externalConfirmationGateRef: string | null;
      providerReference?: string | null;
    }
  | {
      kind: "reconciliation_required";
      blockerReasonCode: string;
      recoveryMode: string;
      externalConfirmationGateRef: string | null;
      providerReference?: string | null;
    }
  | {
      kind: "authoritative_failure";
      failureReasonCode: string;
      providerReference?: string | null;
    }
  | {
      kind: "dispatch_failed";
      failureReasonCode: string;
    };

export interface BeginBookingCommitInput {
  bookingTransactionId: string;
  bookingCaseId: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  snapshotId: string;
  offerSessionRef: string;
  sourceDecisionEpochRef: string;
  sourceDecisionSupersessionRef?: string | null;
  selectedSlotRef: string;
  canonicalReservationKey: string;
  selectedCandidateHash: string;
  selectionProofHash: string;
  policyBundleHash: string;
  capabilityResolutionRef: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  adapterContractProfileRef: string;
  capabilityTupleHash: string;
  authoritativeReadAndConfirmationPolicy: BookingCommitPolicySnapshot;
  reservationTruthProjectionRef?: string | null;
  idempotencyKey: string;
  preflightVersion: string;
  reservationVersion: number;
  reservationVersionRef: string;
  requestLifecycleLeaseRef: string;
  requestOwnershipEpochRef: number;
  reviewActionLeaseRef?: string | null;
  fencingToken: string;
  dispatchEffectKeyRef: string;
  dispatchAttemptRef?: string | null;
  latestReceiptCheckpointRef?: string | null;
  holdState: BookingCommitHoldState;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef?: string | null;
  transitionEnvelopeRef?: string | null;
  occurredAt: string;
  preflightFailureReasonCodes?: readonly string[];
  guardedRecheckFailureReasonCodes?: readonly string[];
  safetyPreemptionReasonCode?: string | null;
  compensationReasonCodes?: readonly string[];
  dispatchOutcome: BeginCommitDispatchOutcomeInput;
}

export interface IngestBookingCommitObservationInput {
  bookingTransactionId: string;
  latestReceiptCheckpointRef: string | null;
  receiptDecisionClass:
    | "accepted_new"
    | "exact_replay"
    | "semantic_replay"
    | "stale_ignored"
    | "collision_review";
  providerCorrelationRef?: string | null;
  observedAt: string;
  observationKind: BookingCommitObservationKind;
  authoritativeProofClass?: Exclude<BookingAuthoritativeProofClass, "none"> | null;
  providerReference?: string | null;
  externalConfirmationGateRef?: string | null;
  blockerReasonCode?: string | null;
  recoveryMode?: string | null;
  failureReasonCode?: string | null;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
}

export interface ReconcileAmbiguousBookingCommitInput {
  bookingTransactionId: string;
  reconciledAt: string;
  resolution:
    | {
        kind: "confirmed";
        authoritativeProofClass: Exclude<BookingAuthoritativeProofClass, "none">;
        providerReference?: string | null;
        externalConfirmationGateRef?: string | null;
      }
    | {
        kind: "failed";
        failureReasonCode: string;
      }
    | {
        kind: "expired";
        failureReasonCode: string;
      };
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
}

export interface ReleaseFailedBookingTransactionInput {
  bookingTransactionId: string;
  releasedAt: string;
  reasonCodes: readonly string[];
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
}

export interface BookingCommitReadResult {
  transaction: BookingTransactionSnapshot;
  confirmationTruthProjection: BookingConfirmationTruthProjectionSnapshot;
  appointmentRecord: AppointmentRecordSnapshot | null;
  bookingException: BookingExceptionSnapshot | null;
  journal: readonly BookingTransactionJournalEntrySnapshot[];
}

export interface BookingCommitProcessingResult extends BookingCommitReadResult {
  replayed: boolean;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

function nextEntityId(prefix: string, digest: string): string {
  return `${prefix}_${digest.slice(0, 24)}`;
}

function truthBasisHash(input: {
  bookingCaseRef: string;
  bookingTransactionRef: string;
  selectedSlotRef: string;
  appointmentRecordRef: string | null;
  externalConfirmationGateRef: string | null;
  providerReference: string | null;
  authoritativeProofClass: BookingAuthoritativeProofClass;
  confirmationTruthState: BookingConfirmationState;
  patientVisibilityState: BookingConfirmationPatientVisibilityState;
  manageExposureState: BookingConfirmationManageExposureState;
  artifactExposureState: BookingConfirmationArtifactExposureState;
  reminderExposureState: BookingConfirmationReminderExposureState;
  latestReceiptCheckpointRef: string | null;
}): string {
  return sha256(input);
}

function confirmationContinuityEvidenceRef(transaction: BookingTransactionSnapshot): string {
  return `continuity_evidence::${transaction.bookingCaseId}::${transaction.bookingTransactionId}`;
}

function confirmationProjectionFreshnessEnvelopeRef(transaction: BookingTransactionSnapshot): string {
  return `projection_freshness::${transaction.bookingCaseId}::${transaction.settlementRevision}`;
}

function allowedProof(
  policy: BookingCommitPolicySnapshot,
  proofClass: Exclude<BookingAuthoritativeProofClass, "none">,
  providerReference: string | null,
): boolean {
  if (!policy.allowedAuthoritativeProofClasses.includes(proofClass)) {
    return false;
  }
  if (proofClass === "durable_provider_reference") {
    return providerReference !== null;
  }
  return true;
}

function truthForState(input: {
  transaction: BookingTransactionSnapshot;
  authoritativeProofClass: BookingAuthoritativeProofClass;
  appointmentRecordRef: string | null;
  externalConfirmationGateRef: string | null;
  reasonCodes?: readonly string[];
}): Omit<BookingConfirmationTruthProjectionSnapshot, "bookingConfirmationTruthProjectionId" | "schemaVersion" | "commandSettlementRecordRef" | "settlementRevision" | "generatedAt" | "version" | "truthBasisHash" | "continuityEvidenceRef" | "projectionFreshnessEnvelopeRef"> {
  const reasonCodes = uniqueSorted(input.reasonCodes ?? []);
  const preProofPatientVisibility: BookingConfirmationPatientVisibilityState =
    input.transaction.patientVisibilityBeforeProof === "summary_only"
      ? "selected_slot_pending"
      : "provisional_receipt";
  const preProofManageExposure: BookingConfirmationManageExposureState =
    input.transaction.manageExposureBeforeProof === "summary_only" ? "summary_only" : "hidden";
  const policyVisibility =
    input.transaction.authoritativeOutcomeState === "pending"
      ? "selected_slot_pending"
      : input.transaction.authoritativeOutcomeState === "confirmation_pending" ||
          input.transaction.authoritativeOutcomeState === "reconciliation_required"
        ? preProofPatientVisibility
        : input.transaction.authoritativeOutcomeState === "booked"
          ? "booked_summary"
          : "recovery_required";
  const manageExposureState: BookingConfirmationManageExposureState =
    input.transaction.authoritativeOutcomeState === "booked"
      ? "writable"
      : input.transaction.authoritativeOutcomeState === "confirmation_pending" ||
          input.transaction.authoritativeOutcomeState === "reconciliation_required"
        ? preProofManageExposure
        : "hidden";
  const artifactExposureState: BookingConfirmationArtifactExposureState =
    input.transaction.authoritativeOutcomeState === "booked"
      ? "handoff_ready"
      : input.transaction.authoritativeOutcomeState === "confirmation_pending" ||
          input.transaction.authoritativeOutcomeState === "reconciliation_required"
        ? "summary_only"
        : "hidden";
  const reminderExposureState: BookingConfirmationReminderExposureState =
    input.transaction.authoritativeOutcomeState === "booked" ? "pending_schedule" : "blocked";

  return {
    bookingCaseRef: input.transaction.bookingCaseId,
    bookingTransactionRef: input.transaction.bookingTransactionId,
    selectedSlotRef: input.transaction.selectedSlotRef,
    appointmentRecordRef: input.appointmentRecordRef,
    externalConfirmationGateRef: input.externalConfirmationGateRef,
    latestReceiptCheckpointRef: input.transaction.latestReceiptCheckpointRef,
    providerReference: input.transaction.providerReference,
    authoritativeProofClass: input.authoritativeProofClass,
    confirmationTruthState:
      input.transaction.authoritativeOutcomeState === "pending"
        ? "booking_in_progress"
        : input.transaction.authoritativeOutcomeState === "confirmation_pending"
          ? "confirmation_pending"
          : input.transaction.authoritativeOutcomeState === "reconciliation_required"
            ? "reconciliation_required"
            : input.transaction.authoritativeOutcomeState === "booked"
              ? "confirmed"
              : input.transaction.authoritativeOutcomeState === "expired"
                ? "expired"
                : input.transaction.authoritativeOutcomeState === "superseded"
                  ? "superseded"
                  : "failed",
    patientVisibilityState:
      reasonCodes.includes("pending_summary_only")
        ? "selected_slot_pending"
        : (policyVisibility as BookingConfirmationPatientVisibilityState),
    manageExposureState,
    artifactExposureState,
    reminderExposureState,
  };
}

function monotoneTruthRank(state: BookingConfirmationState): number {
  switch (state) {
    case "booking_in_progress":
      return 1;
    case "confirmation_pending":
      return 2;
    case "reconciliation_required":
      return 3;
    case "confirmed":
      return 4;
    case "failed":
    case "expired":
      return 4;
    case "superseded":
      return 5;
  }
}

function buildBookingCommitStartedEvent(input: {
  transaction: BookingTransactionSnapshot;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.commit.started", {
    governingRef: input.transaction.bookingTransactionId,
    governingVersionRef: input.transaction.preflightVersion,
    previousState: "selection_verified",
    nextState: input.transaction.commitState,
    stateAxis: "booking_commit",
    commandActionRecordRef: input.transaction.commandActionRecordRef,
    commandSettlementRef: input.transaction.commandSettlementRecordRef,
    routeIntentRef: input.transaction.routeIntentBindingRef,
    subjectRef: input.transaction.subjectRef,
    payloadArtifactRef: input.transaction.payloadArtifactRef,
    edgeCorrelationId: input.transaction.edgeCorrelationId,
    occurredAt: input.transaction.createdAt,
  });
}

function buildBookingCommitPendingEvent(input: {
  eventName:
    | "booking.commit.confirmation_pending"
    | "booking.commit.reconciliation_pending";
  transaction: BookingTransactionSnapshot;
  blockerReasonCode: string;
  recoveryMode: string;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent(input.eventName, {
    governingRef: input.transaction.bookingTransactionId,
    blockerReasonCode: input.blockerReasonCode,
    blockerSetHash: sha256({
      blockerReasonCode: input.blockerReasonCode,
      recoveryMode: input.recoveryMode,
      transactionRef: input.transaction.bookingTransactionId,
    }),
    recoveryMode: input.recoveryMode,
    commandActionRecordRef: input.transaction.commandActionRecordRef,
    commandSettlementRef: input.transaction.commandSettlementRecordRef,
    routeIntentRef: input.transaction.routeIntentBindingRef,
    subjectRef: input.transaction.subjectRef,
    payloadArtifactRef: input.transaction.payloadArtifactRef,
    edgeCorrelationId: input.transaction.edgeCorrelationId,
    occurredAt: input.transaction.updatedAt,
  });
}

function buildBookingCommitConfirmedEvent(input: {
  transaction: BookingTransactionSnapshot;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.commit.confirmed", {
    governingRef: input.transaction.bookingTransactionId,
    settlementState: input.transaction.authoritativeOutcomeState,
    settlementRef: input.transaction.confirmationTruthProjectionRef,
    commandActionRecordRef: input.transaction.commandActionRecordRef,
    commandSettlementRef: input.transaction.commandSettlementRecordRef,
    routeIntentRef: input.transaction.routeIntentBindingRef,
    subjectRef: input.transaction.subjectRef,
    payloadArtifactRef: input.transaction.payloadArtifactRef,
    edgeCorrelationId: input.transaction.edgeCorrelationId,
    occurredAt: input.transaction.updatedAt,
  });
}

function buildBookingCommitAmbiguousEvent(input: {
  transaction: BookingTransactionSnapshot;
  previousState: BookingCommitDispatchState;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.commit.ambiguous", {
    governingRef: input.transaction.bookingTransactionId,
    governingVersionRef: `${input.transaction.bookingTransactionId}::${input.transaction.settlementRevision}`,
    previousState: input.previousState,
    nextState: input.transaction.commitState,
    stateAxis: "booking_commit",
    commandActionRecordRef: input.transaction.commandActionRecordRef,
    commandSettlementRef: input.transaction.commandSettlementRecordRef,
    routeIntentRef: input.transaction.routeIntentBindingRef,
    subjectRef: input.transaction.subjectRef,
    payloadArtifactRef: input.transaction.payloadArtifactRef,
    edgeCorrelationId: input.transaction.edgeCorrelationId,
    occurredAt: input.transaction.updatedAt,
  });
}

function buildBookingConfirmationTruthUpdatedEvent(input: {
  projection: BookingConfirmationTruthProjectionSnapshot;
  transaction: BookingTransactionSnapshot;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.confirmation.truth.updated", {
    governingRef: input.projection.bookingConfirmationTruthProjectionId,
    artifactRef: input.projection.bookingConfirmationTruthProjectionId,
    artifactHash: input.projection.truthBasisHash,
    evidenceClass: input.projection.confirmationTruthState,
    commandActionRecordRef: input.transaction.commandActionRecordRef,
    commandSettlementRef: input.transaction.commandSettlementRecordRef,
    routeIntentRef: input.transaction.routeIntentBindingRef,
    subjectRef: input.transaction.subjectRef,
    payloadArtifactRef: input.transaction.payloadArtifactRef,
    edgeCorrelationId: input.transaction.edgeCorrelationId,
    occurredAt: input.projection.generatedAt,
  });
}

function buildAppointmentCreatedEvent(input: {
  appointment: AppointmentRecordSnapshot;
  transaction: BookingTransactionSnapshot;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.appointment.created", {
    governingRef: input.appointment.appointmentRecordId,
    governingVersionRef: `${input.appointment.appointmentRecordId}::${input.appointment.version}`,
    previousState: "pending_confirmation",
    nextState: "booked",
    stateAxis: "appointment_record",
    selectedSlotRef: input.appointment.selectedSlotRef,
    commandActionRecordRef: input.transaction.commandActionRecordRef,
    commandSettlementRef: input.transaction.commandSettlementRecordRef,
    routeIntentRef: input.transaction.routeIntentBindingRef,
    subjectRef: input.transaction.subjectRef,
    payloadArtifactRef: input.transaction.payloadArtifactRef,
    edgeCorrelationId: input.transaction.edgeCorrelationId,
    occurredAt: input.appointment.createdAt,
  });
}

function buildConfirmationProjection(
  input: {
    bookingConfirmationTruthProjectionId: string;
    transaction: BookingTransactionSnapshot;
    authoritativeProofClass: BookingAuthoritativeProofClass;
    appointmentRecordRef: string | null;
    externalConfirmationGateRef: string | null;
    reasonCodes?: readonly string[];
  },
  existing?: BookingConfirmationTruthProjectionSnapshot | null,
): BookingConfirmationTruthProjectionSnapshot {
  const base = truthForState({
    transaction: input.transaction,
    authoritativeProofClass: input.authoritativeProofClass,
    appointmentRecordRef: input.appointmentRecordRef,
    externalConfirmationGateRef: input.externalConfirmationGateRef,
    reasonCodes: input.reasonCodes,
  });
  const generatedAt = input.transaction.updatedAt;
  const settlementRevision = input.transaction.settlementRevision;
  const truthBasis = truthBasisHash({
    ...base,
  });
  const next = {
    bookingConfirmationTruthProjectionId: input.bookingConfirmationTruthProjectionId,
    schemaVersion: PHASE4_BOOKING_COMMIT_SCHEMA_VERSION,
    ...base,
    commandSettlementRecordRef: input.transaction.commandSettlementRecordRef,
    continuityEvidenceRef: confirmationContinuityEvidenceRef(input.transaction),
    truthBasisHash: truthBasis,
    projectionFreshnessEnvelopeRef: confirmationProjectionFreshnessEnvelopeRef(input.transaction),
    settlementRevision,
    generatedAt,
    version: (existing?.version ?? 0) + 1,
  } satisfies BookingConfirmationTruthProjectionSnapshot;
  if (existing) {
    const previousRank = monotoneTruthRank(existing.confirmationTruthState);
    const nextRank = monotoneTruthRank(next.confirmationTruthState);
    invariant(
      next.confirmationTruthState === "superseded" || nextRank >= previousRank,
      "NON_MONOTONE_CONFIRMATION_TRUTH",
      "BookingConfirmationTruthProjection may not regress.",
    );
  }
  return next;
}

function buildAppointmentRecord(
  transaction: BookingTransactionSnapshot,
  proofClass: Exclude<BookingAuthoritativeProofClass, "none">,
  existing?: AppointmentRecordSnapshot | null,
): AppointmentRecordSnapshot {
  invariant(
    transaction.providerReference !== null || proofClass !== "durable_provider_reference",
    "DURABLE_PROVIDER_REFERENCE_REQUIRED",
    "durable_provider_reference requires providerReference.",
  );
  return {
    appointmentRecordId:
      existing?.appointmentRecordId ??
      nextEntityId(
        "appointment_record",
        sha256([
          transaction.bookingCaseId,
          transaction.bookingTransactionId,
          transaction.selectedSlotRef,
          transaction.providerReference,
          proofClass,
        ]),
      ),
    schemaVersion: PHASE4_BOOKING_COMMIT_SCHEMA_VERSION,
    bookingCaseRef: transaction.bookingCaseId,
    bookingTransactionRef: transaction.bookingTransactionId,
    selectedSlotRef: transaction.selectedSlotRef,
    canonicalReservationKey: transaction.canonicalReservationKey,
    providerAdapterBindingRef: transaction.providerAdapterBindingRef,
    providerReference: transaction.providerReference,
    authoritativeProofClass: proofClass,
    appointmentStatus: "booked",
    createdAt: existing?.createdAt ?? transaction.updatedAt,
    updatedAt: transaction.updatedAt,
    version: (existing?.version ?? 0) + 1,
  };
}

function buildBookingException(
  transaction: BookingTransactionSnapshot,
  exceptionClass: BookingExceptionClass,
  reasonCode: string,
  linkedReceiptCheckpointRef: string | null,
  providerCorrelationRef: string | null,
  existing?: BookingExceptionSnapshot | null,
): BookingExceptionSnapshot {
  return {
    bookingExceptionId:
      existing?.bookingExceptionId ??
      nextEntityId(
        "booking_exception",
        sha256([
          transaction.bookingCaseId,
          transaction.bookingTransactionId,
          exceptionClass,
          reasonCode,
          linkedReceiptCheckpointRef,
          providerCorrelationRef,
        ]),
      ),
    schemaVersion: PHASE4_BOOKING_COMMIT_SCHEMA_VERSION,
    bookingCaseRef: transaction.bookingCaseId,
    bookingTransactionRef: transaction.bookingTransactionId,
    exceptionClass,
    exceptionState: "open",
    reasonCode,
    providerCorrelationRef,
    linkedReceiptCheckpointRef,
    detailsHash: sha256({
      bookingCaseId: transaction.bookingCaseId,
      bookingTransactionId: transaction.bookingTransactionId,
      exceptionClass,
      reasonCode,
      linkedReceiptCheckpointRef,
      providerCorrelationRef,
    }),
    createdAt: existing?.createdAt ?? transaction.updatedAt,
    updatedAt: transaction.updatedAt,
    version: (existing?.version ?? 0) + 1,
  };
}

function buildJournalEntry(input: {
  bookingTransaction: BookingTransactionSnapshot;
  previousTransaction: BookingTransactionSnapshot | null;
  previousProjection: BookingConfirmationTruthProjectionSnapshot | null;
  nextProjection: BookingConfirmationTruthProjectionSnapshot;
  actionScope:
    | "begin_commit"
    | "authoritative_observation"
    | "reconcile_ambiguous"
    | "release_or_supersede_failed";
  reasonCodes: readonly string[];
}): BookingTransactionJournalEntrySnapshot {
  return {
    bookingTransactionJournalEntryId: nextEntityId(
      "booking_transaction_journal",
      sha256([
        input.bookingTransaction.bookingTransactionId,
        input.actionScope,
        input.bookingTransaction.settlementRevision,
      ]),
    ),
    bookingTransactionRef: input.bookingTransaction.bookingTransactionId,
    bookingCaseRef: input.bookingTransaction.bookingCaseId,
    previousAuthoritativeOutcomeState:
      input.previousTransaction?.authoritativeOutcomeState ?? "none",
    nextAuthoritativeOutcomeState: input.bookingTransaction.authoritativeOutcomeState,
    previousConfirmationTruthState: input.previousProjection?.confirmationTruthState ?? "none",
    nextConfirmationTruthState: input.nextProjection.confirmationTruthState,
    previousCommitState: input.previousTransaction?.commitState ?? "none",
    nextCommitState: input.bookingTransaction.commitState,
    actionScope: input.actionScope,
    reasonCodes: uniqueSorted(input.reasonCodes),
    commandActionRecordRef: input.bookingTransaction.commandActionRecordRef,
    commandSettlementRecordRef: input.bookingTransaction.commandSettlementRecordRef,
    payloadArtifactRef: input.bookingTransaction.payloadArtifactRef,
    edgeCorrelationId: input.bookingTransaction.edgeCorrelationId,
    recordedAt: input.bookingTransaction.updatedAt,
    version: input.bookingTransaction.settlementRevision,
  };
}

function transactionVersionRef(transaction: BookingTransactionSnapshot): string {
  return `${transaction.bookingTransactionId}::${transaction.settlementRevision}`;
}

function buildProcessingStateForObservation(
  kind: BookingCommitObservationKind,
): BookingTransactionProcessingAcceptanceState {
  switch (kind) {
    case "confirmation_pending":
    case "reconciliation_required":
      return "awaiting_external_confirmation";
    case "authoritative_failure":
      return "externally_rejected";
    case "expired":
      return "timed_out";
    default:
      return "externally_accepted";
  }
}

function buildExternalObservationState(
  kind: BookingCommitObservationKind,
  proofClass: Exclude<BookingAuthoritativeProofClass, "none"> | null,
): BookingTransactionExternalObservationState {
  if (kind === "authoritative_failure") {
    return "failed";
  }
  if (kind === "expired") {
    return "expired";
  }
  if (kind === "reconciliation_required") {
    return "disputed";
  }
  if (proofClass === "same_commit_read_after_write") {
    return "read_after_write_seen";
  }
  if (proofClass === "durable_provider_reference" || proofClass === "reconciled_confirmation") {
    return "provider_reference_seen";
  }
  return "unobserved";
}

function classifyBeginOutcome(input: {
  transaction: BookingTransactionSnapshot;
  policy: BookingCommitPolicySnapshot;
  dispatchOutcome: BeginCommitDispatchOutcomeInput;
  compensationReasonCodes: readonly string[];
}): {
  transaction: BookingTransactionSnapshot;
  exceptionClass: BookingExceptionClass | null;
  exceptionReasonCode: string | null;
  blockerReasonCode: string | null;
  recoveryMode: string | null;
} {
  const tx = input.transaction;
  if (input.compensationReasonCodes.length > 0) {
    return {
      transaction: {
        ...tx,
        commitState: "reconciliation_required",
        confirmationState: "reconciliation_required",
        processingAcceptanceState:
          tx.processingAcceptanceState === "not_started"
            ? "awaiting_external_confirmation"
            : tx.processingAcceptanceState,
        externalObservationState: "disputed",
        authoritativeOutcomeState: "reconciliation_required",
        compensationReasonCodes: input.compensationReasonCodes,
      },
      exceptionClass: "local_compensation_required",
      exceptionReasonCode: input.compensationReasonCodes[0] ?? "local_compensation_required",
      blockerReasonCode: input.compensationReasonCodes[0] ?? "local_compensation_required",
      recoveryMode: "reconcile_local_failure_after_supplier_success",
    };
  }

  switch (input.dispatchOutcome.kind) {
    case "authoritative_success": {
      if (
        !allowedProof(
          input.policy,
          input.dispatchOutcome.authoritativeProofClass,
          optionalRef(input.dispatchOutcome.providerReference),
        )
      ) {
        return {
          transaction: {
            ...tx,
            providerReference: optionalRef(input.dispatchOutcome.providerReference),
            authoritativeProofClass: input.dispatchOutcome.authoritativeProofClass,
            processingAcceptanceState: "externally_accepted",
            externalObservationState: buildExternalObservationState(
              "reconciled_confirmation",
              input.dispatchOutcome.authoritativeProofClass,
            ),
            authoritativeOutcomeState: "reconciliation_required",
            commitState: "reconciliation_required",
            confirmationState: "reconciliation_required",
            reconciliationReasonCodes: ["authoritative_proof_not_allowed_by_policy"],
          },
          exceptionClass: "dispatch_ambiguity",
          exceptionReasonCode: "authoritative_proof_not_allowed_by_policy",
          blockerReasonCode: "authoritative_proof_not_allowed_by_policy",
          recoveryMode: "policy_reconciliation_required",
        };
      }
      return {
        transaction: {
          ...tx,
          supplierObservedAt: tx.updatedAt,
          providerReference: optionalRef(input.dispatchOutcome.providerReference),
          authoritativeProofClass: input.dispatchOutcome.authoritativeProofClass,
          processingAcceptanceState: "externally_accepted",
          externalObservationState: buildExternalObservationState(
            "durable_provider_reference",
            input.dispatchOutcome.authoritativeProofClass,
          ),
          authoritativeOutcomeState: "booked",
          commitState: "confirmed",
          confirmationState: "confirmed",
          blockerReasonCodes: [],
          reconciliationReasonCodes: [],
        },
        exceptionClass: null,
        exceptionReasonCode: null,
        blockerReasonCode: null,
        recoveryMode: null,
      };
    }
    case "confirmation_pending":
      return {
        transaction: {
          ...tx,
          supplierObservedAt: tx.updatedAt,
          providerReference: optionalRef(input.dispatchOutcome.providerReference),
          externalConfirmationGateRef: input.dispatchOutcome.externalConfirmationGateRef,
          processingAcceptanceState: "awaiting_external_confirmation",
          externalObservationState: "unobserved",
          authoritativeOutcomeState: "confirmation_pending",
          commitState: "confirmation_pending",
          confirmationState: "confirmation_pending",
          blockerReasonCodes: [input.dispatchOutcome.blockerReasonCode],
        },
        exceptionClass: null,
        exceptionReasonCode: null,
        blockerReasonCode: input.dispatchOutcome.blockerReasonCode,
        recoveryMode: input.dispatchOutcome.recoveryMode,
      };
    case "reconciliation_required":
      return {
        transaction: {
          ...tx,
          supplierObservedAt: tx.updatedAt,
          providerReference: optionalRef(input.dispatchOutcome.providerReference),
          externalConfirmationGateRef: input.dispatchOutcome.externalConfirmationGateRef,
          processingAcceptanceState: "awaiting_external_confirmation",
          externalObservationState: "disputed",
          authoritativeOutcomeState: "reconciliation_required",
          commitState: "reconciliation_required",
          confirmationState: "reconciliation_required",
          reconciliationReasonCodes: [input.dispatchOutcome.blockerReasonCode],
        },
        exceptionClass: "supplier_reconciliation_required",
        exceptionReasonCode: input.dispatchOutcome.blockerReasonCode,
        blockerReasonCode: input.dispatchOutcome.blockerReasonCode,
        recoveryMode: input.dispatchOutcome.recoveryMode,
      };
    case "authoritative_failure":
      return {
        transaction: {
          ...tx,
          supplierObservedAt: tx.updatedAt,
          providerReference: optionalRef(input.dispatchOutcome.providerReference),
          processingAcceptanceState: "externally_rejected",
          externalObservationState: "failed",
          authoritativeOutcomeState: "failed",
          commitState: "failed",
          confirmationState: "failed",
          blockerReasonCodes: [input.dispatchOutcome.failureReasonCode],
        },
        exceptionClass: "authoritative_failure",
        exceptionReasonCode: input.dispatchOutcome.failureReasonCode,
        blockerReasonCode: input.dispatchOutcome.failureReasonCode,
        recoveryMode: "authoritative_failure",
      };
    case "dispatch_failed":
      return {
        transaction: {
          ...tx,
          processingAcceptanceState: "not_started",
          externalObservationState: "failed",
          authoritativeOutcomeState: "failed",
          commitState: "failed",
          confirmationState: "failed",
          blockerReasonCodes: [input.dispatchOutcome.failureReasonCode],
        },
        exceptionClass: "authoritative_failure",
        exceptionReasonCode: input.dispatchOutcome.failureReasonCode,
        blockerReasonCode: input.dispatchOutcome.failureReasonCode,
        recoveryMode: "dispatch_failed",
      };
  }
}

export interface Phase4BookingCommitService {
  repositories: Phase4BookingCommitRepositories;
  beginCommit(input: BeginBookingCommitInput): Promise<BookingCommitProcessingResult>;
  ingestAuthoritativeObservation(
    input: IngestBookingCommitObservationInput,
  ): Promise<BookingCommitProcessingResult>;
  reconcileAmbiguousTransaction(
    input: ReconcileAmbiguousBookingCommitInput,
  ): Promise<BookingCommitProcessingResult>;
  releaseOrSupersedeFailedTransaction(
    input: ReleaseFailedBookingTransactionInput,
  ): Promise<BookingCommitProcessingResult>;
  queryCurrentBookingCommit(bookingCaseId: string): Promise<BookingCommitReadResult | null>;
}

export function createPhase4BookingCommitService(input?: {
  repositories?: Phase4BookingCommitRepositories;
}): Phase4BookingCommitService {
  const repositories = input?.repositories ?? createPhase4BookingCommitStore();

  async function loadCurrentArtifacts(transaction: BookingTransactionSnapshot) {
    const projectionDocument = await repositories.getBookingConfirmationTruthProjection(
      transaction.confirmationTruthProjectionRef,
    );
    invariant(
      projectionDocument,
      "BOOKING_CONFIRMATION_TRUTH_NOT_FOUND",
      `BookingConfirmationTruthProjection ${transaction.confirmationTruthProjectionRef} was not found.`,
    );
    const projection = projectionDocument.toSnapshot();
    const appointmentDocument = transaction.appointmentRecordRef
      ? await repositories.getAppointmentRecord(transaction.appointmentRecordRef)
      : null;
    const bookingExceptionDocument = transaction.bookingExceptionRef
      ? await repositories.getBookingException(transaction.bookingExceptionRef)
      : null;
    const journal = (await repositories.listBookingTransactionJournalEntries(
      transaction.bookingTransactionId,
    )).map((entry) => entry.toSnapshot());
    return {
      projection,
      appointment: appointmentDocument?.toSnapshot() ?? null,
      bookingException: bookingExceptionDocument?.toSnapshot() ?? null,
      journal,
    };
  }

  async function writeCurrentResult(input: {
    transaction: BookingTransactionSnapshot;
    previousTransaction: BookingTransactionSnapshot | null;
    existingProjection: BookingConfirmationTruthProjectionSnapshot | null;
    appointment: AppointmentRecordSnapshot | null;
    bookingException: BookingExceptionSnapshot | null;
    reasonCodes: readonly string[];
    actionScope:
      | "begin_commit"
      | "authoritative_observation"
      | "reconcile_ambiguous"
      | "release_or_supersede_failed";
    emitPendingEvent?: {
      eventName: "booking.commit.confirmation_pending" | "booking.commit.reconciliation_pending";
      blockerReasonCode: string;
      recoveryMode: string;
    } | null;
    emitAmbiguousEvent?: boolean;
    emitConfirmedEvent?: boolean;
    emitAppointmentCreatedEvent?: boolean;
  }): Promise<BookingCommitProcessingResult> {
    await repositories.saveBookingTransaction(input.transaction, {
      expectedVersion: input.previousTransaction?.version,
    });
    await repositories.setCurrentBookingTransactionRef(
      input.transaction.bookingCaseId,
      input.transaction.bookingTransactionId,
    );

    const projection = buildConfirmationProjection(
      {
        bookingConfirmationTruthProjectionId: input.transaction.confirmationTruthProjectionRef,
        transaction: input.transaction,
        authoritativeProofClass: input.transaction.authoritativeProofClass,
        appointmentRecordRef: input.appointment?.appointmentRecordId ?? null,
        externalConfirmationGateRef: input.transaction.externalConfirmationGateRef,
        reasonCodes: input.reasonCodes,
      },
      input.existingProjection,
    );
    await repositories.saveBookingConfirmationTruthProjection(projection, {
      expectedVersion: input.existingProjection?.version,
    });
    await repositories.setCurrentBookingConfirmationTruthProjectionRef(
      input.transaction.bookingCaseId,
      projection.bookingConfirmationTruthProjectionId,
    );

    let emitAppointmentCreatedEvent = input.emitAppointmentCreatedEvent ?? false;
    if (input.appointment) {
      const existingAppointment = await repositories.getAppointmentRecord(
        input.appointment.appointmentRecordId,
      );
      await repositories.saveAppointmentRecord(input.appointment, {
        expectedVersion: existingAppointment?.toSnapshot().version,
      });
      await repositories.setCurrentAppointmentRecordRef(
        input.transaction.bookingCaseId,
        input.appointment.appointmentRecordId,
      );
      emitAppointmentCreatedEvent = emitAppointmentCreatedEvent && !existingAppointment;
    }

    if (input.bookingException) {
      const existingException = await repositories.getBookingException(
        input.bookingException.bookingExceptionId,
      );
      await repositories.saveBookingException(input.bookingException, {
        expectedVersion: existingException?.toSnapshot().version,
      });
    }

    const journalEntry = buildJournalEntry({
      bookingTransaction: input.transaction,
      previousTransaction: input.previousTransaction,
      previousProjection: input.existingProjection,
      nextProjection: projection,
      actionScope: input.actionScope,
      reasonCodes: input.reasonCodes,
    });
    await repositories.appendBookingTransactionJournalEntry(journalEntry);

    const emittedEvents: FoundationEventEnvelope<object>[] = [];
    if (input.actionScope === "begin_commit") {
      emittedEvents.push(buildBookingCommitStartedEvent({ transaction: input.transaction }));
    }
    if (input.emitPendingEvent) {
      emittedEvents.push(
        buildBookingCommitPendingEvent({
          eventName: input.emitPendingEvent.eventName,
          transaction: input.transaction,
          blockerReasonCode: input.emitPendingEvent.blockerReasonCode,
          recoveryMode: input.emitPendingEvent.recoveryMode,
        }),
      );
    }
    if (input.emitAmbiguousEvent) {
      emittedEvents.push(
        buildBookingCommitAmbiguousEvent({
          transaction: input.transaction,
          previousState: input.previousTransaction?.commitState ?? "created",
        }),
      );
    }
    if (input.emitConfirmedEvent) {
      emittedEvents.push(buildBookingCommitConfirmedEvent({ transaction: input.transaction }));
    }
    emittedEvents.push(
      buildBookingConfirmationTruthUpdatedEvent({
        projection,
        transaction: input.transaction,
      }),
    );
    if (input.appointment && emitAppointmentCreatedEvent) {
      emittedEvents.push(
        buildAppointmentCreatedEvent({
          appointment: input.appointment,
          transaction: input.transaction,
        }),
      );
    }

    const journal = (await repositories.listBookingTransactionJournalEntries(
      input.transaction.bookingTransactionId,
    )).map((entry) => entry.toSnapshot());

    return {
      transaction: input.transaction,
      confirmationTruthProjection: projection,
      appointmentRecord: input.appointment,
      bookingException: input.bookingException,
      journal,
      replayed: false,
      emittedEvents,
    };
  }

  return {
    repositories,

    async beginCommit(command) {
      const existingReplay = await repositories.findBookingTransactionByIdempotencyKey(
        command.idempotencyKey,
      );
      if (existingReplay) {
        const transaction = existingReplay.toSnapshot();
        const artifacts = await loadCurrentArtifacts(transaction);
        return {
          transaction,
          confirmationTruthProjection: artifacts.projection,
          appointmentRecord: artifacts.appointment,
          bookingException: artifacts.bookingException,
          journal: artifacts.journal,
          replayed: true,
          emittedEvents: [],
        };
      }

      const occurredAt = ensureIsoTimestamp(command.occurredAt, "occurredAt");
      const reasonCodes = uniqueSorted([
        ...(command.preflightFailureReasonCodes ?? []),
        ...(command.guardedRecheckFailureReasonCodes ?? []),
        ...(command.compensationReasonCodes ?? []),
        ...(command.safetyPreemptionReasonCode ? [command.safetyPreemptionReasonCode] : []),
      ]);

      const initialTransaction: BookingTransactionSnapshot = {
        bookingTransactionId: requireRef(command.bookingTransactionId, "bookingTransactionId"),
        schemaVersion: PHASE4_BOOKING_COMMIT_SCHEMA_VERSION,
        bookingCaseId: requireRef(command.bookingCaseId, "bookingCaseId"),
        episodeRef: requireRef(command.episodeRef, "episodeRef"),
        requestId: requireRef(command.requestId, "requestId"),
        requestLineageRef: requireRef(command.requestLineageRef, "requestLineageRef"),
        lineageCaseLinkRef: requireRef(command.lineageCaseLinkRef, "lineageCaseLinkRef"),
        snapshotId: requireRef(command.snapshotId, "snapshotId"),
        offerSessionRef: requireRef(command.offerSessionRef, "offerSessionRef"),
        sourceDecisionEpochRef: requireRef(command.sourceDecisionEpochRef, "sourceDecisionEpochRef"),
        sourceDecisionSupersessionRef: optionalRef(command.sourceDecisionSupersessionRef),
        selectedSlotRef: requireRef(command.selectedSlotRef, "selectedSlotRef"),
        canonicalReservationKey: requireRef(command.canonicalReservationKey, "canonicalReservationKey"),
        selectedCandidateHash: requireRef(command.selectedCandidateHash, "selectedCandidateHash"),
        selectionProofHash: requireRef(command.selectionProofHash, "selectionProofHash"),
        policyBundleHash: requireRef(command.policyBundleHash, "policyBundleHash"),
        capabilityResolutionRef: requireRef(command.capabilityResolutionRef, "capabilityResolutionRef"),
        providerAdapterBindingRef: requireRef(command.providerAdapterBindingRef, "providerAdapterBindingRef"),
        providerAdapterBindingHash: requireRef(command.providerAdapterBindingHash, "providerAdapterBindingHash"),
        adapterContractProfileRef: requireRef(command.adapterContractProfileRef, "adapterContractProfileRef"),
        authoritativeReadAndConfirmationPolicyRef: requireRef(
          command.authoritativeReadAndConfirmationPolicy.authoritativeReadAndConfirmationPolicyRef,
          "authoritativeReadAndConfirmationPolicyRef",
        ),
        authoritativeReadMode: command.authoritativeReadAndConfirmationPolicy.authoritativeReadMode,
        allowedAuthoritativeProofClasses: uniqueSorted(
          command.authoritativeReadAndConfirmationPolicy.allowedAuthoritativeProofClasses,
        ) as Exclude<BookingAuthoritativeProofClass, "none">[],
        supportsAsyncCommitConfirmation:
          command.authoritativeReadAndConfirmationPolicy.supportsAsyncCommitConfirmation,
        supportsDisputeRecovery:
          command.authoritativeReadAndConfirmationPolicy.supportsDisputeRecovery,
        manageExposureBeforeProof:
          command.authoritativeReadAndConfirmationPolicy.manageExposureBeforeProof,
        patientVisibilityBeforeProof:
          command.authoritativeReadAndConfirmationPolicy.patientVisibilityBeforeProof,
        capabilityTupleHash: requireRef(command.capabilityTupleHash, "capabilityTupleHash"),
        reservationTruthProjectionRef: optionalRef(command.reservationTruthProjectionRef),
        confirmationTruthProjectionRef: nextEntityId(
          "booking_confirmation_truth",
          sha256([
            command.bookingCaseId,
            command.bookingTransactionId,
            command.selectedSlotRef,
            occurredAt,
          ]),
        ),
        idempotencyKey: requireRef(command.idempotencyKey, "idempotencyKey"),
        preflightVersion: requireRef(command.preflightVersion, "preflightVersion"),
        reservationVersion: ensurePositiveInteger(command.reservationVersion, "reservationVersion"),
        reservationVersionRef: requireRef(command.reservationVersionRef, "reservationVersionRef"),
        supplierObservedAt: null,
        revalidationProofHash: sha256({
          snapshotId: command.snapshotId,
          preflightVersion: command.preflightVersion,
          capabilityTupleHash: command.capabilityTupleHash,
          providerAdapterBindingHash: command.providerAdapterBindingHash,
          reservationVersionRef: command.reservationVersionRef,
          preflightFailureReasonCodes: command.preflightFailureReasonCodes ?? [],
          guardedRecheckFailureReasonCodes: command.guardedRecheckFailureReasonCodes ?? [],
          safetyPreemptionReasonCode: command.safetyPreemptionReasonCode ?? null,
        }),
        requestLifecycleLeaseRef: requireRef(command.requestLifecycleLeaseRef, "requestLifecycleLeaseRef"),
        requestOwnershipEpochRef: ensurePositiveInteger(
          command.requestOwnershipEpochRef,
          "requestOwnershipEpochRef",
        ),
        reviewActionLeaseRef: optionalRef(command.reviewActionLeaseRef),
        fencingToken: requireRef(command.fencingToken, "fencingToken"),
        dispatchEffectKeyRef: requireRef(command.dispatchEffectKeyRef, "dispatchEffectKeyRef"),
        dispatchAttemptRef: optionalRef(command.dispatchAttemptRef),
        latestReceiptCheckpointRef: optionalRef(command.latestReceiptCheckpointRef),
        externalConfirmationGateRef: null,
        appointmentRecordRef: null,
        bookingExceptionRef: null,
        commitAttempt: 1,
        revalidationState: reasonCodes.length > 0 ? "failed" : "passed",
        holdState: command.holdState,
        commitState: reasonCodes.length > 0 ? "preflight_failed" : "dispatch_pending",
        confirmationState: "booking_in_progress",
        localAckState: "shown",
        processingAcceptanceState: "not_started",
        externalObservationState: "unobserved",
        authoritativeOutcomeState: "pending",
        settlementRevision: 1,
        providerReference: null,
        authoritativeProofClass: "none",
        blockerReasonCodes: uniqueSorted([
          ...(command.preflightFailureReasonCodes ?? []),
          ...(command.safetyPreemptionReasonCode ? [command.safetyPreemptionReasonCode] : []),
        ]),
        guardedRecheckReasonCodes: uniqueSorted(command.guardedRecheckFailureReasonCodes ?? []),
        reconciliationReasonCodes: [],
        compensationReasonCodes: uniqueSorted(command.compensationReasonCodes ?? []),
        commandActionRecordRef: requireRef(command.commandActionRecordRef, "commandActionRecordRef"),
        commandSettlementRecordRef: requireRef(
          command.commandSettlementRecordRef,
          "commandSettlementRecordRef",
        ),
        routeIntentBindingRef: requireRef(command.routeIntentBindingRef, "routeIntentBindingRef"),
        subjectRef: requireRef(command.subjectRef, "subjectRef"),
        payloadArtifactRef: requireRef(command.payloadArtifactRef, "payloadArtifactRef"),
        edgeCorrelationId: requireRef(command.edgeCorrelationId, "edgeCorrelationId"),
        surfaceRouteContractRef: requireRef(command.surfaceRouteContractRef, "surfaceRouteContractRef"),
        surfacePublicationRef: requireRef(command.surfacePublicationRef, "surfacePublicationRef"),
        runtimePublicationBundleRef: requireRef(
          command.runtimePublicationBundleRef,
          "runtimePublicationBundleRef",
        ),
        releaseRecoveryDispositionRef: optionalRef(command.releaseRecoveryDispositionRef),
        transitionEnvelopeRef: optionalRef(command.transitionEnvelopeRef),
        createdAt: occurredAt,
        updatedAt: occurredAt,
        version: 1,
      };

      const existingProjection = null;

      if (reasonCodes.length > 0) {
        const failedTransaction: BookingTransactionSnapshot = {
          ...initialTransaction,
          commitState: "preflight_failed",
          confirmationState: "failed",
          authoritativeOutcomeState: "failed",
          externalObservationState: "failed",
        };
        const bookingException = buildBookingException(
          failedTransaction,
          "preflight_failure",
          reasonCodes[0] ?? "preflight_failed",
          failedTransaction.latestReceiptCheckpointRef,
          null,
        );
        const nextTransaction = {
          ...failedTransaction,
          bookingExceptionRef: bookingException.bookingExceptionId,
        };
        return writeCurrentResult({
          transaction: nextTransaction,
          previousTransaction: null,
          existingProjection,
          appointment: null,
          bookingException,
          reasonCodes,
          actionScope: "begin_commit",
          emitPendingEvent: null,
        });
      }

      const classified = classifyBeginOutcome({
        transaction: initialTransaction,
        policy: command.authoritativeReadAndConfirmationPolicy,
        dispatchOutcome: command.dispatchOutcome,
        compensationReasonCodes: initialTransaction.compensationReasonCodes,
      });
      let nextTransaction: BookingTransactionSnapshot = {
        ...classified.transaction,
        externalConfirmationGateRef:
          classified.transaction.externalConfirmationGateRef ??
          (command.dispatchOutcome.kind === "confirmation_pending" ||
          command.dispatchOutcome.kind === "reconciliation_required"
            ? command.dispatchOutcome.externalConfirmationGateRef
            : null),
        version: 1,
      };
      let bookingException: BookingExceptionSnapshot | null = null;
      if (classified.exceptionClass && classified.exceptionReasonCode) {
        bookingException = buildBookingException(
          nextTransaction,
          classified.exceptionClass,
          classified.exceptionReasonCode,
          nextTransaction.latestReceiptCheckpointRef,
          null,
        );
        nextTransaction = {
          ...nextTransaction,
          bookingExceptionRef: bookingException.bookingExceptionId,
        };
      }
      let appointment: AppointmentRecordSnapshot | null = null;
      if (
        nextTransaction.authoritativeOutcomeState === "booked" &&
        nextTransaction.authoritativeProofClass !== "none"
      ) {
        appointment = buildAppointmentRecord(
          nextTransaction,
          nextTransaction.authoritativeProofClass,
        );
        nextTransaction = {
          ...nextTransaction,
          appointmentRecordRef: appointment.appointmentRecordId,
          confirmationState: "confirmed",
          commitState: "confirmed",
        };
      }

      return writeCurrentResult({
        transaction: nextTransaction,
        previousTransaction: null,
        existingProjection,
        appointment,
        bookingException,
        reasonCodes,
        actionScope: "begin_commit",
        emitPendingEvent:
          classified.blockerReasonCode && classified.recoveryMode
            ? {
                eventName:
                  nextTransaction.authoritativeOutcomeState === "reconciliation_required"
                    ? "booking.commit.reconciliation_pending"
                    : "booking.commit.confirmation_pending",
                blockerReasonCode: classified.blockerReasonCode,
                recoveryMode: classified.recoveryMode,
              }
            : null,
        emitAmbiguousEvent:
          nextTransaction.authoritativeOutcomeState === "reconciliation_required",
        emitConfirmedEvent: nextTransaction.authoritativeOutcomeState === "booked",
        emitAppointmentCreatedEvent: appointment !== null,
      });
    },

    async ingestAuthoritativeObservation(command) {
      const existing = await repositories.getBookingTransaction(command.bookingTransactionId);
      invariant(
        existing,
        "BOOKING_TRANSACTION_NOT_FOUND",
        `BookingTransaction ${command.bookingTransactionId} was not found.`,
      );
      const previousTransaction = existing.toSnapshot();
      const existingProjectionDocument = await repositories.getBookingConfirmationTruthProjection(
        previousTransaction.confirmationTruthProjectionRef,
      );
      invariant(existingProjectionDocument, "BOOKING_CONFIRMATION_TRUTH_NOT_FOUND", "Current booking confirmation truth projection was not found.");
      const existingProjection = existingProjectionDocument.toSnapshot();
      const existingAppointmentDocument = previousTransaction.appointmentRecordRef
        ? await repositories.getAppointmentRecord(previousTransaction.appointmentRecordRef)
        : null;
      const existingExceptionDocument = previousTransaction.bookingExceptionRef
        ? await repositories.getBookingException(previousTransaction.bookingExceptionRef)
        : null;

      if (
        command.receiptDecisionClass === "exact_replay" ||
        command.receiptDecisionClass === "semantic_replay" ||
        command.receiptDecisionClass === "stale_ignored"
      ) {
        const artifacts = await loadCurrentArtifacts(previousTransaction);
        return {
          transaction: previousTransaction,
          confirmationTruthProjection: artifacts.projection,
          appointmentRecord: artifacts.appointment,
          bookingException: artifacts.bookingException,
          journal: artifacts.journal,
          replayed: true,
          emittedEvents: [],
        };
      }

      let nextTransaction: BookingTransactionSnapshot = {
        ...previousTransaction,
        latestReceiptCheckpointRef: optionalRef(command.latestReceiptCheckpointRef),
        updatedAt: ensureIsoTimestamp(command.observedAt, "observedAt"),
        version: previousTransaction.version + 1,
        settlementRevision: previousTransaction.settlementRevision + 1,
        commandActionRecordRef: requireRef(command.commandActionRecordRef, "commandActionRecordRef"),
        commandSettlementRecordRef: requireRef(
          command.commandSettlementRecordRef,
          "commandSettlementRecordRef",
        ),
        routeIntentBindingRef: requireRef(command.routeIntentBindingRef, "routeIntentBindingRef"),
        subjectRef: requireRef(command.subjectRef, "subjectRef"),
        payloadArtifactRef: requireRef(command.payloadArtifactRef, "payloadArtifactRef"),
        edgeCorrelationId: requireRef(command.edgeCorrelationId, "edgeCorrelationId"),
      };

      const reasonCodes: string[] = [];
      let emitPendingEvent: {
        eventName: "booking.commit.confirmation_pending" | "booking.commit.reconciliation_pending";
        blockerReasonCode: string;
        recoveryMode: string;
      } | null = null;
      let emitAmbiguousEvent = false;
      let emitConfirmedEvent = false;
      let appointment = existingAppointmentDocument?.toSnapshot() ?? null;
      let bookingException = existingExceptionDocument?.toSnapshot() ?? null;

      if (command.receiptDecisionClass === "collision_review") {
        nextTransaction = {
          ...nextTransaction,
          processingAcceptanceState: "awaiting_external_confirmation",
          externalObservationState: "disputed",
          authoritativeOutcomeState: "reconciliation_required",
          commitState: "reconciliation_required",
          confirmationState: "reconciliation_required",
          reconciliationReasonCodes: ["receipt_collision_review"],
        };
        bookingException = buildBookingException(
          nextTransaction,
          "receipt_divergence",
          "receipt_collision_review",
          nextTransaction.latestReceiptCheckpointRef,
          optionalRef(command.providerCorrelationRef),
          bookingException,
        );
        nextTransaction = {
          ...nextTransaction,
          bookingExceptionRef: bookingException.bookingExceptionId,
        };
        reasonCodes.push("receipt_collision_review");
        emitPendingEvent = {
          eventName: "booking.commit.reconciliation_pending",
          blockerReasonCode: "receipt_collision_review",
          recoveryMode: "reconcile_divergent_receipt",
        };
        emitAmbiguousEvent = true;
      } else {
        const proofClass =
          command.observationKind === "durable_provider_reference" ||
          command.observationKind === "same_commit_read_after_write" ||
          command.observationKind === "reconciled_confirmation"
            ? (command.authoritativeProofClass ??
              (command.observationKind as Exclude<BookingAuthoritativeProofClass, "none">))
            : null;
        nextTransaction = {
          ...nextTransaction,
          processingAcceptanceState: buildProcessingStateForObservation(command.observationKind),
          externalObservationState: buildExternalObservationState(
            command.observationKind,
            proofClass,
          ),
          providerReference: optionalRef(command.providerReference) ?? previousTransaction.providerReference,
          externalConfirmationGateRef:
            optionalRef(command.externalConfirmationGateRef) ??
            previousTransaction.externalConfirmationGateRef,
        };

        if (
          (command.observationKind === "durable_provider_reference" ||
            command.observationKind === "same_commit_read_after_write" ||
            command.observationKind === "reconciled_confirmation") &&
          proofClass &&
          allowedProof(
            {
              authoritativeReadAndConfirmationPolicyRef:
                previousTransaction.authoritativeReadAndConfirmationPolicyRef,
              authoritativeReadMode: previousTransaction.authoritativeReadMode,
              allowedAuthoritativeProofClasses: previousTransaction.allowedAuthoritativeProofClasses,
              supportsAsyncCommitConfirmation:
                previousTransaction.supportsAsyncCommitConfirmation,
              supportsDisputeRecovery: previousTransaction.supportsDisputeRecovery,
              manageExposureBeforeProof: previousTransaction.manageExposureBeforeProof,
              patientVisibilityBeforeProof: previousTransaction.patientVisibilityBeforeProof,
            },
            proofClass,
            nextTransaction.providerReference,
          )
        ) {
          if (
            previousTransaction.authoritativeOutcomeState === "failed" ||
            previousTransaction.authoritativeOutcomeState === "expired"
          ) {
            nextTransaction = {
              ...nextTransaction,
              authoritativeOutcomeState: "reconciliation_required",
              commitState: "reconciliation_required",
              confirmationState: "reconciliation_required",
              authoritativeProofClass: proofClass,
              reconciliationReasonCodes: ["post_failure_confirmation_conflict"],
            };
            bookingException = buildBookingException(
              nextTransaction,
              "supplier_reconciliation_required",
              "post_failure_confirmation_conflict",
              nextTransaction.latestReceiptCheckpointRef,
              optionalRef(command.providerCorrelationRef),
              bookingException,
            );
            nextTransaction = {
              ...nextTransaction,
              bookingExceptionRef: bookingException.bookingExceptionId,
            };
            reasonCodes.push("post_failure_confirmation_conflict");
            emitPendingEvent = {
              eventName: "booking.commit.reconciliation_pending",
              blockerReasonCode: "post_failure_confirmation_conflict",
              recoveryMode: "manual_reconciliation_required",
            };
            emitAmbiguousEvent = true;
          } else {
            nextTransaction = {
              ...nextTransaction,
              authoritativeProofClass: proofClass,
              authoritativeOutcomeState: "booked",
              commitState: "confirmed",
              confirmationState: "confirmed",
            };
            appointment = buildAppointmentRecord(nextTransaction, proofClass, appointment);
            nextTransaction = {
              ...nextTransaction,
              appointmentRecordRef: appointment.appointmentRecordId,
            };
            emitConfirmedEvent = true;
          }
        } else if (command.observationKind === "confirmation_pending") {
          const blockerReasonCode =
            optionalRef(command.blockerReasonCode) ??
            (previousTransaction.supportsAsyncCommitConfirmation
              ? "awaiting_external_confirmation"
              : "async_confirmation_not_allowed_by_policy");
          nextTransaction = {
            ...nextTransaction,
            authoritativeOutcomeState: previousTransaction.supportsAsyncCommitConfirmation
              ? "confirmation_pending"
              : "reconciliation_required",
            commitState: previousTransaction.supportsAsyncCommitConfirmation
              ? "confirmation_pending"
              : "reconciliation_required",
            confirmationState: previousTransaction.supportsAsyncCommitConfirmation
              ? "confirmation_pending"
              : "reconciliation_required",
            blockerReasonCodes: previousTransaction.supportsAsyncCommitConfirmation
              ? [blockerReasonCode]
              : [],
            reconciliationReasonCodes: previousTransaction.supportsAsyncCommitConfirmation
              ? nextTransaction.reconciliationReasonCodes
              : [blockerReasonCode],
          };
          reasonCodes.push(blockerReasonCode);
          emitPendingEvent = {
            eventName: previousTransaction.supportsAsyncCommitConfirmation
              ? "booking.commit.confirmation_pending"
              : "booking.commit.reconciliation_pending",
            blockerReasonCode,
            recoveryMode:
              optionalRef(command.recoveryMode) ??
              (previousTransaction.supportsAsyncCommitConfirmation
                ? "awaiting_external_confirmation"
                : "policy_reconciliation_required"),
          };
          emitAmbiguousEvent = !previousTransaction.supportsAsyncCommitConfirmation;
        } else if (command.observationKind === "reconciliation_required") {
          const blockerReasonCode =
            optionalRef(command.blockerReasonCode) ?? "reconciliation_required";
          nextTransaction = {
            ...nextTransaction,
            authoritativeOutcomeState: "reconciliation_required",
            commitState: "reconciliation_required",
            confirmationState: "reconciliation_required",
            reconciliationReasonCodes: [blockerReasonCode],
          };
          bookingException = buildBookingException(
            nextTransaction,
            "supplier_reconciliation_required",
            blockerReasonCode,
            nextTransaction.latestReceiptCheckpointRef,
            optionalRef(command.providerCorrelationRef),
            bookingException,
          );
          nextTransaction = {
            ...nextTransaction,
            bookingExceptionRef: bookingException.bookingExceptionId,
          };
          reasonCodes.push(blockerReasonCode);
          emitPendingEvent = {
            eventName: "booking.commit.reconciliation_pending",
            blockerReasonCode,
            recoveryMode: optionalRef(command.recoveryMode) ?? "reconcile_supplier_observation",
          };
          emitAmbiguousEvent = true;
        } else if (command.observationKind === "authoritative_failure") {
          const failureReasonCode = optionalRef(command.failureReasonCode) ?? "authoritative_failure";
          if (previousTransaction.authoritativeOutcomeState === "booked") {
            nextTransaction = {
              ...nextTransaction,
              authoritativeOutcomeState: "reconciliation_required",
              commitState: "reconciliation_required",
              confirmationState: "reconciliation_required",
              reconciliationReasonCodes: [failureReasonCode],
            };
            bookingException = buildBookingException(
              nextTransaction,
              "receipt_divergence",
              failureReasonCode,
              nextTransaction.latestReceiptCheckpointRef,
              optionalRef(command.providerCorrelationRef),
              bookingException,
            );
            nextTransaction = {
              ...nextTransaction,
              bookingExceptionRef: bookingException.bookingExceptionId,
            };
            reasonCodes.push(failureReasonCode);
            emitPendingEvent = {
              eventName: "booking.commit.reconciliation_pending",
              blockerReasonCode: failureReasonCode,
              recoveryMode: "confirmed_booking_conflict",
            };
            emitAmbiguousEvent = true;
          } else {
            nextTransaction = {
              ...nextTransaction,
              authoritativeOutcomeState: "failed",
              commitState: "failed",
              confirmationState: "failed",
              blockerReasonCodes: [failureReasonCode],
            };
            bookingException = buildBookingException(
              nextTransaction,
              "authoritative_failure",
              failureReasonCode,
              nextTransaction.latestReceiptCheckpointRef,
              optionalRef(command.providerCorrelationRef),
              bookingException,
            );
            nextTransaction = {
              ...nextTransaction,
              bookingExceptionRef: bookingException.bookingExceptionId,
            };
            reasonCodes.push(failureReasonCode);
          }
        } else if (command.observationKind === "expired") {
          const failureReasonCode = optionalRef(command.failureReasonCode) ?? "confirmation_expired";
          nextTransaction = {
            ...nextTransaction,
            authoritativeOutcomeState: "expired",
            commitState: "expired",
            confirmationState: "expired",
            blockerReasonCodes: [failureReasonCode],
          };
          reasonCodes.push(failureReasonCode);
        }
      }

      return writeCurrentResult({
        transaction: nextTransaction,
        previousTransaction,
        existingProjection,
        appointment,
        bookingException,
        reasonCodes,
        actionScope: "authoritative_observation",
        emitPendingEvent,
        emitAmbiguousEvent,
        emitConfirmedEvent,
        emitAppointmentCreatedEvent:
          emitConfirmedEvent && existingAppointmentDocument === null && appointment !== null,
      });
    },

    async reconcileAmbiguousTransaction(command) {
      const existing = await repositories.getBookingTransaction(command.bookingTransactionId);
      invariant(existing, "BOOKING_TRANSACTION_NOT_FOUND", "BookingTransaction was not found.");
      const previousTransaction = existing.toSnapshot();
      invariant(
        previousTransaction.authoritativeOutcomeState === "confirmation_pending" ||
          previousTransaction.authoritativeOutcomeState === "reconciliation_required",
        "BOOKING_TRANSACTION_NOT_RECONCILABLE",
        "Only confirmation_pending or reconciliation_required transactions may be reconciled.",
      );
      const existingProjectionDocument = await repositories.getBookingConfirmationTruthProjection(
        previousTransaction.confirmationTruthProjectionRef,
      );
      invariant(existingProjectionDocument, "BOOKING_CONFIRMATION_TRUTH_NOT_FOUND", "Current booking confirmation truth projection was not found.");
      const existingProjection = existingProjectionDocument.toSnapshot();
      const existingAppointmentDocument = previousTransaction.appointmentRecordRef
        ? await repositories.getAppointmentRecord(previousTransaction.appointmentRecordRef)
        : null;
      const existingExceptionDocument = previousTransaction.bookingExceptionRef
        ? await repositories.getBookingException(previousTransaction.bookingExceptionRef)
        : null;

      let nextTransaction: BookingTransactionSnapshot = {
        ...previousTransaction,
        updatedAt: ensureIsoTimestamp(command.reconciledAt, "reconciledAt"),
        version: previousTransaction.version + 1,
        settlementRevision: previousTransaction.settlementRevision + 1,
        commandActionRecordRef: requireRef(command.commandActionRecordRef, "commandActionRecordRef"),
        commandSettlementRecordRef: requireRef(
          command.commandSettlementRecordRef,
          "commandSettlementRecordRef",
        ),
        routeIntentBindingRef: requireRef(command.routeIntentBindingRef, "routeIntentBindingRef"),
        subjectRef: requireRef(command.subjectRef, "subjectRef"),
        payloadArtifactRef: requireRef(command.payloadArtifactRef, "payloadArtifactRef"),
        edgeCorrelationId: requireRef(command.edgeCorrelationId, "edgeCorrelationId"),
      };
      let appointment = existingAppointmentDocument?.toSnapshot() ?? null;
      let bookingException = existingExceptionDocument?.toSnapshot() ?? null;
      const reasonCodes: string[] = [];
      let emitConfirmedEvent = false;
      let emitAppointmentCreatedEvent = false;

      if (command.resolution.kind === "confirmed") {
        invariant(
          allowedProof(
            {
              authoritativeReadAndConfirmationPolicyRef:
                previousTransaction.authoritativeReadAndConfirmationPolicyRef,
              authoritativeReadMode: previousTransaction.authoritativeReadMode,
              allowedAuthoritativeProofClasses: previousTransaction.allowedAuthoritativeProofClasses,
              supportsAsyncCommitConfirmation:
                previousTransaction.supportsAsyncCommitConfirmation,
              supportsDisputeRecovery: previousTransaction.supportsDisputeRecovery,
              manageExposureBeforeProof: previousTransaction.manageExposureBeforeProof,
              patientVisibilityBeforeProof: previousTransaction.patientVisibilityBeforeProof,
            },
            command.resolution.authoritativeProofClass,
            optionalRef(command.resolution.providerReference),
          ),
          "RECONCILED_PROOF_CLASS_NOT_ALLOWED",
          "Reconciled confirmation proof class is not allowed by the active policy.",
        );
        nextTransaction = {
          ...nextTransaction,
          authoritativeProofClass: command.resolution.authoritativeProofClass,
          providerReference: optionalRef(command.resolution.providerReference),
          externalConfirmationGateRef:
            optionalRef(command.resolution.externalConfirmationGateRef) ??
            previousTransaction.externalConfirmationGateRef,
          processingAcceptanceState: "externally_accepted",
          externalObservationState: buildExternalObservationState(
            "reconciled_confirmation",
            command.resolution.authoritativeProofClass,
          ),
          authoritativeOutcomeState: "booked",
          commitState: "confirmed",
          confirmationState: "confirmed",
          reconciliationReasonCodes: [],
        };
        appointment = buildAppointmentRecord(
          nextTransaction,
          command.resolution.authoritativeProofClass,
          appointment,
        );
        nextTransaction = {
          ...nextTransaction,
          appointmentRecordRef: appointment.appointmentRecordId,
        };
        emitConfirmedEvent = true;
        emitAppointmentCreatedEvent = existingAppointmentDocument === null;
      } else if (command.resolution.kind === "failed") {
        nextTransaction = {
          ...nextTransaction,
          processingAcceptanceState: "externally_rejected",
          externalObservationState: "failed",
          authoritativeOutcomeState: "failed",
          commitState: "failed",
          confirmationState: "failed",
          blockerReasonCodes: [command.resolution.failureReasonCode],
        };
        reasonCodes.push(command.resolution.failureReasonCode);
      } else {
        nextTransaction = {
          ...nextTransaction,
          processingAcceptanceState: "timed_out",
          externalObservationState: "expired",
          authoritativeOutcomeState: "expired",
          commitState: "expired",
          confirmationState: "expired",
          blockerReasonCodes: [command.resolution.failureReasonCode],
        };
        reasonCodes.push(command.resolution.failureReasonCode);
      }

      if (bookingException) {
        bookingException = {
          ...bookingException,
          exceptionState: nextTransaction.authoritativeOutcomeState === "booked" ? "resolved" : "superseded",
          updatedAt: nextTransaction.updatedAt,
          version: bookingException.version + 1,
        };
      }

      return writeCurrentResult({
        transaction: nextTransaction,
        previousTransaction,
        existingProjection,
        appointment,
        bookingException,
        reasonCodes,
        actionScope: "reconcile_ambiguous",
        emitPendingEvent: null,
        emitAmbiguousEvent: false,
        emitConfirmedEvent,
        emitAppointmentCreatedEvent,
      });
    },

    async releaseOrSupersedeFailedTransaction(command) {
      const existing = await repositories.getBookingTransaction(command.bookingTransactionId);
      invariant(existing, "BOOKING_TRANSACTION_NOT_FOUND", "BookingTransaction was not found.");
      const previousTransaction = existing.toSnapshot();
      invariant(
        previousTransaction.authoritativeOutcomeState === "failed" ||
          previousTransaction.authoritativeOutcomeState === "expired" ||
          previousTransaction.authoritativeOutcomeState === "reconciliation_required",
        "BOOKING_TRANSACTION_NOT_RELEASABLE",
        "Only failed, expired, or reconciliation-required transactions may be superseded.",
      );
      const existingProjectionDocument = await repositories.getBookingConfirmationTruthProjection(
        previousTransaction.confirmationTruthProjectionRef,
      );
      invariant(existingProjectionDocument, "BOOKING_CONFIRMATION_TRUTH_NOT_FOUND", "Current booking confirmation truth projection was not found.");
      const existingProjection = existingProjectionDocument.toSnapshot();
      const existingAppointmentDocument = previousTransaction.appointmentRecordRef
        ? await repositories.getAppointmentRecord(previousTransaction.appointmentRecordRef)
        : null;
      const existingExceptionDocument = previousTransaction.bookingExceptionRef
        ? await repositories.getBookingException(previousTransaction.bookingExceptionRef)
        : null;

      const nextTransaction: BookingTransactionSnapshot = {
        ...previousTransaction,
        updatedAt: ensureIsoTimestamp(command.releasedAt, "releasedAt"),
        version: previousTransaction.version + 1,
        settlementRevision: previousTransaction.settlementRevision + 1,
        authoritativeOutcomeState: "superseded",
        commitState: "superseded",
        confirmationState: "superseded",
        localAckState: "superseded",
        blockerReasonCodes: uniqueSorted(command.reasonCodes),
        commandActionRecordRef: requireRef(command.commandActionRecordRef, "commandActionRecordRef"),
        commandSettlementRecordRef: requireRef(
          command.commandSettlementRecordRef,
          "commandSettlementRecordRef",
        ),
        routeIntentBindingRef: requireRef(command.routeIntentBindingRef, "routeIntentBindingRef"),
        subjectRef: requireRef(command.subjectRef, "subjectRef"),
        payloadArtifactRef: requireRef(command.payloadArtifactRef, "payloadArtifactRef"),
        edgeCorrelationId: requireRef(command.edgeCorrelationId, "edgeCorrelationId"),
      };

      const bookingException = existingExceptionDocument
        ? {
            ...existingExceptionDocument.toSnapshot(),
            exceptionState: "superseded" as const,
            updatedAt: nextTransaction.updatedAt,
            version: existingExceptionDocument.toSnapshot().version + 1,
          }
        : null;

      return writeCurrentResult({
        transaction: nextTransaction,
        previousTransaction,
        existingProjection,
        appointment: existingAppointmentDocument?.toSnapshot() ?? null,
        bookingException,
        reasonCodes: command.reasonCodes,
        actionScope: "release_or_supersede_failed",
        emitPendingEvent: null,
        emitAmbiguousEvent: false,
        emitConfirmedEvent: false,
        emitAppointmentCreatedEvent: false,
      });
    },

    async queryCurrentBookingCommit(bookingCaseId) {
      const currentRef = await repositories.getCurrentBookingTransactionRef(
        requireRef(bookingCaseId, "bookingCaseId"),
      );
      if (!currentRef) {
        return null;
      }
      const current = await repositories.getBookingTransaction(currentRef);
      if (!current) {
        return null;
      }
      const transaction = current.toSnapshot();
      const artifacts = await loadCurrentArtifacts(transaction);
      return {
        transaction,
        confirmationTruthProjection: artifacts.projection,
        appointmentRecord: artifacts.appointment,
        bookingException: artifacts.bookingException,
        journal: artifacts.journal,
      };
    },
  };
}
