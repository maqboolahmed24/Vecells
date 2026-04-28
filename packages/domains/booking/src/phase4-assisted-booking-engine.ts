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

function deterministicId(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(value).slice(0, 24)}`;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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

export const PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION =
  "291.phase4.staff-assisted-booking-operations.v1" as const;

export type AssistedBookingSessionMode =
  | "summary"
  | "slot_compare"
  | "slot_confirm"
  | "waitlist_review"
  | "fallback_review"
  | "recovery_review";

export type AssistedBookingSessionState =
  | "active"
  | "stale_recoverable"
  | "recovery_required"
  | "settled"
  | "closed";

export type BookingExceptionFamily =
  | "supplier_endpoint_unavailable"
  | "slot_revalidation_failure"
  | "ambiguous_commit"
  | "patient_self_service_blocked"
  | "capability_mismatch"
  | "linkage_required_blocker"
  | "reminder_delivery_failure"
  | "stale_owner_or_publication_drift";

export type BookingExceptionQueueSeverity = "warn" | "blocking" | "critical";

export type BookingExceptionQueueEntryState =
  | "open"
  | "claimed"
  | "resolved"
  | "superseded";

export interface AssistedBookingSessionSnapshot {
  assistedBookingSessionId: string;
  schemaVersion: typeof PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION;
  bookingCaseId: string;
  taskRef: string;
  workspaceRef: string;
  staffUserRef: string;
  mode: AssistedBookingSessionMode;
  sessionState: AssistedBookingSessionState;
  startedAt: string;
  lastActivityAt: string;
  currentSnapshotRef: string | null;
  currentOfferSessionRef: string | null;
  currentReservationScopeRef: string | null;
  selectedSlotRef: string | null;
  compareAnchorRefs: readonly string[];
  capabilityResolutionRef: string;
  capabilityProjectionRef: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  adapterContractProfileRef: string;
  capabilityTupleHash: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  reviewActionLeaseRef: string;
  focusProtectionLeaseRef: string | null;
  workProtectionLeaseRef: string | null;
  protectedCompositionStateRef: string | null;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  taskCompletionSettlementEnvelopeRef: string;
  requestLifecycleLeaseRef: string;
  requestOwnershipEpochRef: number;
  currentConfirmationTruthProjectionRef: string | null;
  currentWaitlistEntryRef: string | null;
  currentFallbackObligationRef: string | null;
  staleOwnerRecoveryRef: string | null;
  blockedReasonRefs: readonly string[];
  updatedAt: string;
  version: number;
}

export interface BookingExceptionQueueEntrySnapshot {
  bookingExceptionQueueEntryId: string;
  schemaVersion: typeof PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION;
  bookingCaseRef: string;
  taskRef: string;
  assistedBookingSessionRef: string | null;
  queueKey: string;
  exceptionFamily: BookingExceptionFamily;
  severity: BookingExceptionQueueSeverity;
  entryState: BookingExceptionQueueEntryState;
  selectedAnchorRef: string;
  currentSnapshotRef: string | null;
  providerAdapterBindingRef: string | null;
  providerAdapterBindingHash: string | null;
  capabilityResolutionRef: string | null;
  capabilityTupleHash: string | null;
  staffWorkspaceConsistencyProjectionRef: string | null;
  workspaceSliceTrustProjectionRef: string | null;
  reviewActionLeaseRef: string | null;
  surfaceRouteContractRef: string | null;
  surfacePublicationRef: string | null;
  runtimePublicationBundleRef: string | null;
  taskCompletionSettlementEnvelopeRef: string | null;
  requestLifecycleLeaseRef: string | null;
  requestOwnershipEpochRef: number | null;
  staleOwnerRecoveryRef: string | null;
  reasonCodes: readonly string[];
  evidenceRefs: readonly string[];
  operatorVisibleDiagnosticRef: string | null;
  sameShellRecoveryRouteRef: string | null;
  claimedByRef: string | null;
  claimedAt: string | null;
  resolvedAt: string | null;
  observedAt: string;
  updatedAt: string;
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

export interface Phase4AssistedBookingRepositories {
  getAssistedBookingSession(
    assistedBookingSessionId: string,
  ): Promise<SnapshotDocument<AssistedBookingSessionSnapshot> | null>;
  saveAssistedBookingSession(
    snapshot: AssistedBookingSessionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAssistedBookingSessions(): Promise<readonly SnapshotDocument<AssistedBookingSessionSnapshot>[]>;
  getCurrentAssistedBookingSessionRefForBookingCase(
    bookingCaseId: string,
  ): Promise<string | null>;
  setCurrentAssistedBookingSessionRefForBookingCase(
    bookingCaseId: string,
    assistedBookingSessionId: string | null,
  ): Promise<void>;
  getBookingExceptionQueueEntry(
    bookingExceptionQueueEntryId: string,
  ): Promise<SnapshotDocument<BookingExceptionQueueEntrySnapshot> | null>;
  saveBookingExceptionQueueEntry(
    snapshot: BookingExceptionQueueEntrySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listBookingExceptionQueueEntries(): Promise<readonly SnapshotDocument<BookingExceptionQueueEntrySnapshot>[]>;
  listBookingExceptionQueueEntriesForBookingCase(
    bookingCaseId: string,
  ): Promise<readonly SnapshotDocument<BookingExceptionQueueEntrySnapshot>[]>;
  getCurrentBookingExceptionQueueEntryRef(
    bookingCaseId: string,
    exceptionFamily: BookingExceptionFamily,
  ): Promise<string | null>;
  setCurrentBookingExceptionQueueEntryRef(
    bookingCaseId: string,
    exceptionFamily: BookingExceptionFamily,
    bookingExceptionQueueEntryId: string | null,
  ): Promise<void>;
}

function normalizeSession(
  snapshot: AssistedBookingSessionSnapshot,
): AssistedBookingSessionSnapshot {
  return {
    ...snapshot,
    assistedBookingSessionId: requireRef(
      snapshot.assistedBookingSessionId,
      "assistedBookingSessionId",
    ),
    schemaVersion: PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION,
    bookingCaseId: requireRef(snapshot.bookingCaseId, "bookingCaseId"),
    taskRef: requireRef(snapshot.taskRef, "taskRef"),
    workspaceRef: requireRef(snapshot.workspaceRef, "workspaceRef"),
    staffUserRef: requireRef(snapshot.staffUserRef, "staffUserRef"),
    startedAt: ensureIsoTimestamp(snapshot.startedAt, "startedAt"),
    lastActivityAt: ensureIsoTimestamp(snapshot.lastActivityAt, "lastActivityAt"),
    currentSnapshotRef: optionalRef(snapshot.currentSnapshotRef),
    currentOfferSessionRef: optionalRef(snapshot.currentOfferSessionRef),
    currentReservationScopeRef: optionalRef(snapshot.currentReservationScopeRef),
    selectedSlotRef: optionalRef(snapshot.selectedSlotRef),
    compareAnchorRefs: uniqueSorted(snapshot.compareAnchorRefs),
    capabilityResolutionRef: requireRef(
      snapshot.capabilityResolutionRef,
      "capabilityResolutionRef",
    ),
    capabilityProjectionRef: requireRef(
      snapshot.capabilityProjectionRef,
      "capabilityProjectionRef",
    ),
    providerAdapterBindingRef: requireRef(
      snapshot.providerAdapterBindingRef,
      "providerAdapterBindingRef",
    ),
    providerAdapterBindingHash: requireRef(
      snapshot.providerAdapterBindingHash,
      "providerAdapterBindingHash",
    ),
    adapterContractProfileRef: requireRef(
      snapshot.adapterContractProfileRef,
      "adapterContractProfileRef",
    ),
    capabilityTupleHash: requireRef(snapshot.capabilityTupleHash, "capabilityTupleHash"),
    staffWorkspaceConsistencyProjectionRef: requireRef(
      snapshot.staffWorkspaceConsistencyProjectionRef,
      "staffWorkspaceConsistencyProjectionRef",
    ),
    workspaceSliceTrustProjectionRef: requireRef(
      snapshot.workspaceSliceTrustProjectionRef,
      "workspaceSliceTrustProjectionRef",
    ),
    reviewActionLeaseRef: requireRef(snapshot.reviewActionLeaseRef, "reviewActionLeaseRef"),
    focusProtectionLeaseRef: optionalRef(snapshot.focusProtectionLeaseRef),
    workProtectionLeaseRef:
      optionalRef(snapshot.workProtectionLeaseRef) ?? optionalRef(snapshot.focusProtectionLeaseRef),
    protectedCompositionStateRef: optionalRef(snapshot.protectedCompositionStateRef),
    surfaceRouteContractRef: requireRef(
      snapshot.surfaceRouteContractRef,
      "surfaceRouteContractRef",
    ),
    surfacePublicationRef: requireRef(snapshot.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      snapshot.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    taskCompletionSettlementEnvelopeRef: requireRef(
      snapshot.taskCompletionSettlementEnvelopeRef,
      "taskCompletionSettlementEnvelopeRef",
    ),
    requestLifecycleLeaseRef: requireRef(
      snapshot.requestLifecycleLeaseRef,
      "requestLifecycleLeaseRef",
    ),
    requestOwnershipEpochRef: ensurePositiveInteger(
      snapshot.requestOwnershipEpochRef,
      "requestOwnershipEpochRef",
    ),
    currentConfirmationTruthProjectionRef: optionalRef(
      snapshot.currentConfirmationTruthProjectionRef,
    ),
    currentWaitlistEntryRef: optionalRef(snapshot.currentWaitlistEntryRef),
    currentFallbackObligationRef: optionalRef(snapshot.currentFallbackObligationRef),
    staleOwnerRecoveryRef: optionalRef(snapshot.staleOwnerRecoveryRef),
    blockedReasonRefs: uniqueSorted(snapshot.blockedReasonRefs),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeQueueEntry(
  snapshot: BookingExceptionQueueEntrySnapshot,
): BookingExceptionQueueEntrySnapshot {
  return {
    ...snapshot,
    bookingExceptionQueueEntryId: requireRef(
      snapshot.bookingExceptionQueueEntryId,
      "bookingExceptionQueueEntryId",
    ),
    schemaVersion: PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION,
    bookingCaseRef: requireRef(snapshot.bookingCaseRef, "bookingCaseRef"),
    taskRef: requireRef(snapshot.taskRef, "taskRef"),
    assistedBookingSessionRef: optionalRef(snapshot.assistedBookingSessionRef),
    queueKey: requireRef(snapshot.queueKey, "queueKey"),
    selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
    currentSnapshotRef: optionalRef(snapshot.currentSnapshotRef),
    providerAdapterBindingRef: optionalRef(snapshot.providerAdapterBindingRef),
    providerAdapterBindingHash: optionalRef(snapshot.providerAdapterBindingHash),
    capabilityResolutionRef: optionalRef(snapshot.capabilityResolutionRef),
    capabilityTupleHash: optionalRef(snapshot.capabilityTupleHash),
    staffWorkspaceConsistencyProjectionRef: optionalRef(
      snapshot.staffWorkspaceConsistencyProjectionRef,
    ),
    workspaceSliceTrustProjectionRef: optionalRef(snapshot.workspaceSliceTrustProjectionRef),
    reviewActionLeaseRef: optionalRef(snapshot.reviewActionLeaseRef),
    surfaceRouteContractRef: optionalRef(snapshot.surfaceRouteContractRef),
    surfacePublicationRef: optionalRef(snapshot.surfacePublicationRef),
    runtimePublicationBundleRef: optionalRef(snapshot.runtimePublicationBundleRef),
    taskCompletionSettlementEnvelopeRef: optionalRef(
      snapshot.taskCompletionSettlementEnvelopeRef,
    ),
    requestLifecycleLeaseRef: optionalRef(snapshot.requestLifecycleLeaseRef),
    requestOwnershipEpochRef:
      snapshot.requestOwnershipEpochRef === null
        ? null
        : ensurePositiveInteger(snapshot.requestOwnershipEpochRef, "requestOwnershipEpochRef"),
    staleOwnerRecoveryRef: optionalRef(snapshot.staleOwnerRecoveryRef),
    reasonCodes: uniqueSorted(snapshot.reasonCodes),
    evidenceRefs: uniqueSorted(snapshot.evidenceRefs),
    operatorVisibleDiagnosticRef: optionalRef(snapshot.operatorVisibleDiagnosticRef),
    sameShellRecoveryRouteRef: optionalRef(snapshot.sameShellRecoveryRouteRef),
    claimedByRef: optionalRef(snapshot.claimedByRef),
    claimedAt: snapshot.claimedAt === null ? null : ensureIsoTimestamp(snapshot.claimedAt, "claimedAt"),
    resolvedAt:
      snapshot.resolvedAt === null ? null : ensureIsoTimestamp(snapshot.resolvedAt, "resolvedAt"),
    observedAt: ensureIsoTimestamp(snapshot.observedAt, "observedAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export function createPhase4AssistedBookingStore(): Phase4AssistedBookingRepositories {
  const sessions = new Map<string, AssistedBookingSessionSnapshot>();
  const currentSessionByBookingCase = new Map<string, string>();
  const queueEntries = new Map<string, BookingExceptionQueueEntrySnapshot>();
  const queueEntryRefsByBookingCase = new Map<string, Set<string>>();
  const currentQueueEntryByCaseFamily = new Map<string, string>();

  return {
    async getAssistedBookingSession(assistedBookingSessionId) {
      const row = sessions.get(assistedBookingSessionId);
      return row ? new StoredDocument(row) : null;
    },
    async saveAssistedBookingSession(snapshot, options) {
      const normalized = normalizeSession(snapshot);
      saveWithCas(sessions, normalized.assistedBookingSessionId, normalized, options);
      currentSessionByBookingCase.set(normalized.bookingCaseId, normalized.assistedBookingSessionId);
    },
    async listAssistedBookingSessions() {
      return [...sessions.values()]
        .sort((left, right) => compareIso(left.lastActivityAt, right.lastActivityAt))
        .map((row) => new StoredDocument(row));
    },
    async getCurrentAssistedBookingSessionRefForBookingCase(bookingCaseId) {
      return currentSessionByBookingCase.get(bookingCaseId) ?? null;
    },
    async setCurrentAssistedBookingSessionRefForBookingCase(bookingCaseId, assistedBookingSessionId) {
      if (assistedBookingSessionId) {
        currentSessionByBookingCase.set(bookingCaseId, assistedBookingSessionId);
        return;
      }
      currentSessionByBookingCase.delete(bookingCaseId);
    },
    async getBookingExceptionQueueEntry(bookingExceptionQueueEntryId) {
      const row = queueEntries.get(bookingExceptionQueueEntryId);
      return row ? new StoredDocument(row) : null;
    },
    async saveBookingExceptionQueueEntry(snapshot, options) {
      const normalized = normalizeQueueEntry(snapshot);
      saveWithCas(
        queueEntries,
        normalized.bookingExceptionQueueEntryId,
        normalized,
        options,
      );
      const refs = queueEntryRefsByBookingCase.get(normalized.bookingCaseRef) ?? new Set<string>();
      refs.add(normalized.bookingExceptionQueueEntryId);
      queueEntryRefsByBookingCase.set(normalized.bookingCaseRef, refs);
    },
    async listBookingExceptionQueueEntries() {
      return [...queueEntries.values()]
        .sort((left, right) => compareIso(left.updatedAt, right.updatedAt))
        .map((row) => new StoredDocument(row));
    },
    async listBookingExceptionQueueEntriesForBookingCase(bookingCaseId) {
      const refs = queueEntryRefsByBookingCase.get(bookingCaseId) ?? new Set<string>();
      return [...refs]
        .map((ref) => queueEntries.get(ref))
        .filter((row): row is BookingExceptionQueueEntrySnapshot => Boolean(row))
        .sort((left, right) => compareIso(left.updatedAt, right.updatedAt))
        .map((row) => new StoredDocument(row));
    },
    async getCurrentBookingExceptionQueueEntryRef(bookingCaseId, exceptionFamily) {
      return currentQueueEntryByCaseFamily.get(`${bookingCaseId}::${exceptionFamily}`) ?? null;
    },
    async setCurrentBookingExceptionQueueEntryRef(
      bookingCaseId,
      exceptionFamily,
      bookingExceptionQueueEntryId,
    ) {
      const key = `${bookingCaseId}::${exceptionFamily}`;
      if (bookingExceptionQueueEntryId) {
        currentQueueEntryByCaseFamily.set(key, bookingExceptionQueueEntryId);
        return;
      }
      currentQueueEntryByCaseFamily.delete(key);
    },
  };
}

export interface CreateOrRefreshAssistedBookingSessionInput {
  assistedBookingSessionId?: string | null;
  bookingCaseId: string;
  taskRef: string;
  workspaceRef: string;
  staffUserRef: string;
  mode: AssistedBookingSessionMode;
  sessionState: AssistedBookingSessionState;
  startedAt: string;
  lastActivityAt: string;
  currentSnapshotRef?: string | null;
  currentOfferSessionRef?: string | null;
  currentReservationScopeRef?: string | null;
  selectedSlotRef?: string | null;
  compareAnchorRefs?: readonly string[];
  capabilityResolutionRef: string;
  capabilityProjectionRef: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  adapterContractProfileRef: string;
  capabilityTupleHash: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  reviewActionLeaseRef: string;
  focusProtectionLeaseRef?: string | null;
  workProtectionLeaseRef?: string | null;
  protectedCompositionStateRef?: string | null;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  taskCompletionSettlementEnvelopeRef: string;
  requestLifecycleLeaseRef: string;
  requestOwnershipEpochRef: number;
  currentConfirmationTruthProjectionRef?: string | null;
  currentWaitlistEntryRef?: string | null;
  currentFallbackObligationRef?: string | null;
  staleOwnerRecoveryRef?: string | null;
  blockedReasonRefs?: readonly string[];
}

export interface RecordAssistedBookingSessionStateInput {
  assistedBookingSessionId: string;
  mode?: AssistedBookingSessionMode;
  sessionState?: AssistedBookingSessionState;
  lastActivityAt: string;
  currentSnapshotRef?: string | null;
  currentOfferSessionRef?: string | null;
  currentReservationScopeRef?: string | null;
  selectedSlotRef?: string | null;
  compareAnchorRefs?: readonly string[];
  focusProtectionLeaseRef?: string | null;
  workProtectionLeaseRef?: string | null;
  protectedCompositionStateRef?: string | null;
  currentConfirmationTruthProjectionRef?: string | null;
  currentWaitlistEntryRef?: string | null;
  currentFallbackObligationRef?: string | null;
  staleOwnerRecoveryRef?: string | null;
  blockedReasonRefs?: readonly string[];
}

export interface UpsertBookingExceptionQueueEntryInput {
  bookingExceptionQueueEntryId?: string | null;
  bookingCaseRef: string;
  taskRef: string;
  assistedBookingSessionRef?: string | null;
  queueKey?: string | null;
  exceptionFamily: BookingExceptionFamily;
  severity: BookingExceptionQueueSeverity;
  selectedAnchorRef: string;
  currentSnapshotRef?: string | null;
  providerAdapterBindingRef?: string | null;
  providerAdapterBindingHash?: string | null;
  capabilityResolutionRef?: string | null;
  capabilityTupleHash?: string | null;
  staffWorkspaceConsistencyProjectionRef?: string | null;
  workspaceSliceTrustProjectionRef?: string | null;
  reviewActionLeaseRef?: string | null;
  surfaceRouteContractRef?: string | null;
  surfacePublicationRef?: string | null;
  runtimePublicationBundleRef?: string | null;
  taskCompletionSettlementEnvelopeRef?: string | null;
  requestLifecycleLeaseRef?: string | null;
  requestOwnershipEpochRef?: number | null;
  staleOwnerRecoveryRef?: string | null;
  reasonCodes: readonly string[];
  evidenceRefs?: readonly string[];
  operatorVisibleDiagnosticRef?: string | null;
  sameShellRecoveryRouteRef?: string | null;
  observedAt: string;
}

export interface ClaimBookingExceptionQueueEntryInput {
  bookingExceptionQueueEntryId: string;
  claimedByRef: string;
  claimedAt: string;
}

export interface ReopenBookingExceptionQueueEntryInput {
  bookingExceptionQueueEntryId: string;
  reopenedAt: string;
  reasonCodes?: readonly string[];
}

export interface ResolveBookingExceptionQueueEntryInput {
  bookingExceptionQueueEntryId: string;
  resolvedAt: string;
  nextState?: Extract<BookingExceptionQueueEntryState, "resolved" | "superseded">;
  reasonCodes?: readonly string[];
}

export interface QueryBookingExceptionQueueInput {
  bookingCaseRef?: string | null;
  taskRef?: string | null;
  entryStates?: readonly BookingExceptionQueueEntryState[];
}

export interface AssistedBookingSessionMutationResult {
  session: AssistedBookingSessionSnapshot;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface BookingExceptionQueueEntryMutationResult {
  entry: BookingExceptionQueueEntrySnapshot;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface Phase4AssistedBookingService {
  repositories: Phase4AssistedBookingRepositories;
  queryCurrentAssistedBookingSession(
    bookingCaseId: string,
  ): Promise<AssistedBookingSessionSnapshot | null>;
  createOrRefreshAssistedBookingSession(
    input: CreateOrRefreshAssistedBookingSessionInput,
  ): Promise<AssistedBookingSessionMutationResult>;
  recordAssistedBookingSessionState(
    input: RecordAssistedBookingSessionStateInput,
  ): Promise<AssistedBookingSessionMutationResult>;
  queryBookingExceptionQueue(
    input?: QueryBookingExceptionQueueInput,
  ): Promise<readonly BookingExceptionQueueEntrySnapshot[]>;
  upsertBookingExceptionQueueEntry(
    input: UpsertBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntryMutationResult>;
  claimBookingExceptionQueueEntry(
    input: ClaimBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntryMutationResult>;
  reopenBookingExceptionQueueEntry(
    input: ReopenBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntryMutationResult>;
  resolveBookingExceptionQueueEntry(
    input: ResolveBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntryMutationResult>;
}

function severityRank(severity: BookingExceptionQueueSeverity): number {
  switch (severity) {
    case "critical":
      return 3;
    case "blocking":
      return 2;
    case "warn":
      return 1;
  }
}

function stateRank(state: BookingExceptionQueueEntryState): number {
  switch (state) {
    case "open":
      return 4;
    case "claimed":
      return 3;
    case "resolved":
      return 2;
    case "superseded":
      return 1;
  }
}

class Phase4AssistedBookingServiceImpl implements Phase4AssistedBookingService {
  constructor(readonly repositories: Phase4AssistedBookingRepositories) {}

  async queryCurrentAssistedBookingSession(
    bookingCaseId: string,
  ): Promise<AssistedBookingSessionSnapshot | null> {
    const currentRef =
      await this.repositories.getCurrentAssistedBookingSessionRefForBookingCase(
        requireRef(bookingCaseId, "bookingCaseId"),
      );
    if (!currentRef) {
      return null;
    }
    const document = await this.repositories.getAssistedBookingSession(currentRef);
    return document?.toSnapshot() ?? null;
  }

  async createOrRefreshAssistedBookingSession(
    input: CreateOrRefreshAssistedBookingSessionInput,
  ): Promise<AssistedBookingSessionMutationResult> {
    const current =
      (await this.queryCurrentAssistedBookingSession(input.bookingCaseId)) ??
      (input.assistedBookingSessionId
        ? (await this.repositories.getAssistedBookingSession(input.assistedBookingSessionId))?.toSnapshot() ??
          null
        : null);
    const assistedBookingSessionId =
      current?.assistedBookingSessionId ??
      optionalRef(input.assistedBookingSessionId) ??
      deterministicId("assisted_booking_session", {
        bookingCaseId: input.bookingCaseId,
        taskRef: input.taskRef,
      });
    const next = normalizeSession({
      assistedBookingSessionId,
      schemaVersion: PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION,
      bookingCaseId: requireRef(input.bookingCaseId, "bookingCaseId"),
      taskRef: requireRef(input.taskRef, "taskRef"),
      workspaceRef: requireRef(input.workspaceRef, "workspaceRef"),
      staffUserRef: requireRef(input.staffUserRef, "staffUserRef"),
      mode: input.mode,
      sessionState: input.sessionState,
      startedAt: current?.startedAt ?? ensureIsoTimestamp(input.startedAt, "startedAt"),
      lastActivityAt: ensureIsoTimestamp(input.lastActivityAt, "lastActivityAt"),
      currentSnapshotRef: optionalRef(input.currentSnapshotRef) ?? current?.currentSnapshotRef ?? null,
      currentOfferSessionRef:
        optionalRef(input.currentOfferSessionRef) ?? current?.currentOfferSessionRef ?? null,
      currentReservationScopeRef:
        optionalRef(input.currentReservationScopeRef) ??
        current?.currentReservationScopeRef ??
        null,
      selectedSlotRef: optionalRef(input.selectedSlotRef) ?? current?.selectedSlotRef ?? null,
      compareAnchorRefs:
        input.compareAnchorRefs !== undefined
          ? uniqueSorted(input.compareAnchorRefs)
          : current?.compareAnchorRefs ?? [],
      capabilityResolutionRef: requireRef(
        input.capabilityResolutionRef,
        "capabilityResolutionRef",
      ),
      capabilityProjectionRef: requireRef(
        input.capabilityProjectionRef,
        "capabilityProjectionRef",
      ),
      providerAdapterBindingRef: requireRef(
        input.providerAdapterBindingRef,
        "providerAdapterBindingRef",
      ),
      providerAdapterBindingHash: requireRef(
        input.providerAdapterBindingHash,
        "providerAdapterBindingHash",
      ),
      adapterContractProfileRef: requireRef(
        input.adapterContractProfileRef,
        "adapterContractProfileRef",
      ),
      capabilityTupleHash: requireRef(input.capabilityTupleHash, "capabilityTupleHash"),
      staffWorkspaceConsistencyProjectionRef: requireRef(
        input.staffWorkspaceConsistencyProjectionRef,
        "staffWorkspaceConsistencyProjectionRef",
      ),
      workspaceSliceTrustProjectionRef: requireRef(
        input.workspaceSliceTrustProjectionRef,
        "workspaceSliceTrustProjectionRef",
      ),
      reviewActionLeaseRef: requireRef(input.reviewActionLeaseRef, "reviewActionLeaseRef"),
      focusProtectionLeaseRef:
        optionalRef(input.focusProtectionLeaseRef) ?? current?.focusProtectionLeaseRef ?? null,
      workProtectionLeaseRef:
        optionalRef(input.workProtectionLeaseRef) ??
        optionalRef(input.focusProtectionLeaseRef) ??
        current?.workProtectionLeaseRef ??
        current?.focusProtectionLeaseRef ??
        null,
      protectedCompositionStateRef:
        optionalRef(input.protectedCompositionStateRef) ??
        current?.protectedCompositionStateRef ??
        null,
      surfaceRouteContractRef: requireRef(
        input.surfaceRouteContractRef,
        "surfaceRouteContractRef",
      ),
      surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
      runtimePublicationBundleRef: requireRef(
        input.runtimePublicationBundleRef,
        "runtimePublicationBundleRef",
      ),
      taskCompletionSettlementEnvelopeRef: requireRef(
        input.taskCompletionSettlementEnvelopeRef,
        "taskCompletionSettlementEnvelopeRef",
      ),
      requestLifecycleLeaseRef: requireRef(
        input.requestLifecycleLeaseRef,
        "requestLifecycleLeaseRef",
      ),
      requestOwnershipEpochRef: ensurePositiveInteger(
        input.requestOwnershipEpochRef,
        "requestOwnershipEpochRef",
      ),
      currentConfirmationTruthProjectionRef:
        optionalRef(input.currentConfirmationTruthProjectionRef) ??
        current?.currentConfirmationTruthProjectionRef ??
        null,
      currentWaitlistEntryRef:
        optionalRef(input.currentWaitlistEntryRef) ?? current?.currentWaitlistEntryRef ?? null,
      currentFallbackObligationRef:
        optionalRef(input.currentFallbackObligationRef) ??
        current?.currentFallbackObligationRef ??
        null,
      staleOwnerRecoveryRef:
        optionalRef(input.staleOwnerRecoveryRef) ?? current?.staleOwnerRecoveryRef ?? null,
      blockedReasonRefs:
        input.blockedReasonRefs !== undefined
          ? uniqueSorted(input.blockedReasonRefs)
          : current?.blockedReasonRefs ?? [],
      updatedAt: ensureIsoTimestamp(input.lastActivityAt, "lastActivityAt"),
      version: (current?.version ?? 0) + 1,
    });
    await this.repositories.saveAssistedBookingSession(next, {
      expectedVersion: current?.version,
    });
    await this.repositories.setCurrentAssistedBookingSessionRefForBookingCase(
      next.bookingCaseId,
      next.assistedBookingSessionId,
    );
    return {
      session: next,
      emittedEvents: [
        makeFoundationEvent(
          current
            ? "booking.assisted_session.refreshed"
            : "booking.assisted_session.started",
          {
            sessionRef: next.assistedBookingSessionId,
            bookingCaseRef: next.bookingCaseId,
            taskRef: next.taskRef,
            mode: next.mode,
            sessionState: next.sessionState,
          },
        ),
      ],
    };
  }

  async recordAssistedBookingSessionState(
    input: RecordAssistedBookingSessionStateInput,
  ): Promise<AssistedBookingSessionMutationResult> {
    const currentDocument = await this.repositories.getAssistedBookingSession(
      requireRef(input.assistedBookingSessionId, "assistedBookingSessionId"),
    );
    invariant(
      currentDocument !== null,
      "ASSISTED_BOOKING_SESSION_NOT_FOUND",
      `AssistedBookingSession ${input.assistedBookingSessionId} was not found.`,
    );
    const current = currentDocument.toSnapshot();
    return this.createOrRefreshAssistedBookingSession({
      ...current,
      assistedBookingSessionId: current.assistedBookingSessionId,
      mode: input.mode ?? current.mode,
      sessionState: input.sessionState ?? current.sessionState,
      lastActivityAt: input.lastActivityAt,
      currentSnapshotRef:
        input.currentSnapshotRef !== undefined
          ? input.currentSnapshotRef
          : current.currentSnapshotRef,
      currentOfferSessionRef:
        input.currentOfferSessionRef !== undefined
          ? input.currentOfferSessionRef
          : current.currentOfferSessionRef,
      currentReservationScopeRef:
        input.currentReservationScopeRef !== undefined
          ? input.currentReservationScopeRef
          : current.currentReservationScopeRef,
      selectedSlotRef:
        input.selectedSlotRef !== undefined ? input.selectedSlotRef : current.selectedSlotRef,
      compareAnchorRefs:
        input.compareAnchorRefs !== undefined
          ? input.compareAnchorRefs
          : current.compareAnchorRefs,
      focusProtectionLeaseRef:
        input.focusProtectionLeaseRef !== undefined
          ? input.focusProtectionLeaseRef
          : current.focusProtectionLeaseRef,
      workProtectionLeaseRef:
        input.workProtectionLeaseRef !== undefined
          ? input.workProtectionLeaseRef
          : current.workProtectionLeaseRef,
      protectedCompositionStateRef:
        input.protectedCompositionStateRef !== undefined
          ? input.protectedCompositionStateRef
          : current.protectedCompositionStateRef,
      currentConfirmationTruthProjectionRef:
        input.currentConfirmationTruthProjectionRef !== undefined
          ? input.currentConfirmationTruthProjectionRef
          : current.currentConfirmationTruthProjectionRef,
      currentWaitlistEntryRef:
        input.currentWaitlistEntryRef !== undefined
          ? input.currentWaitlistEntryRef
          : current.currentWaitlistEntryRef,
      currentFallbackObligationRef:
        input.currentFallbackObligationRef !== undefined
          ? input.currentFallbackObligationRef
          : current.currentFallbackObligationRef,
      staleOwnerRecoveryRef:
        input.staleOwnerRecoveryRef !== undefined
          ? input.staleOwnerRecoveryRef
          : current.staleOwnerRecoveryRef,
      blockedReasonRefs:
        input.blockedReasonRefs !== undefined
          ? input.blockedReasonRefs
          : current.blockedReasonRefs,
    });
  }

  async queryBookingExceptionQueue(
    input?: QueryBookingExceptionQueueInput,
  ): Promise<readonly BookingExceptionQueueEntrySnapshot[]> {
    const documents = input?.bookingCaseRef
      ? await this.repositories.listBookingExceptionQueueEntriesForBookingCase(
          input.bookingCaseRef,
        )
      : await this.repositories.listBookingExceptionQueueEntries();
    return documents
      .map((document) => document.toSnapshot())
      .filter(
        (entry) =>
          (input?.taskRef ? entry.taskRef === input.taskRef : true) &&
          (input?.entryStates?.length
            ? input.entryStates.includes(entry.entryState)
            : true),
      )
      .sort((left, right) => {
        const severityDelta = severityRank(right.severity) - severityRank(left.severity);
        if (severityDelta !== 0) {
          return severityDelta;
        }
        const stateDelta = stateRank(right.entryState) - stateRank(left.entryState);
        if (stateDelta !== 0) {
          return stateDelta;
        }
        return compareIso(right.updatedAt, left.updatedAt);
      });
  }

  async upsertBookingExceptionQueueEntry(
    input: UpsertBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntryMutationResult> {
    const currentRef =
      optionalRef(input.bookingExceptionQueueEntryId) ??
      (await this.repositories.getCurrentBookingExceptionQueueEntryRef(
        input.bookingCaseRef,
        input.exceptionFamily,
      ));
    const current = currentRef
      ? (await this.repositories.getBookingExceptionQueueEntry(currentRef))?.toSnapshot() ?? null
      : null;
    const bookingExceptionQueueEntryId =
      current?.bookingExceptionQueueEntryId ??
      deterministicId("booking_exception_queue_entry", {
        bookingCaseRef: input.bookingCaseRef,
        exceptionFamily: input.exceptionFamily,
      });
    const next = normalizeQueueEntry({
      bookingExceptionQueueEntryId,
      schemaVersion: PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION,
      bookingCaseRef: requireRef(input.bookingCaseRef, "bookingCaseRef"),
      taskRef: requireRef(input.taskRef, "taskRef"),
      assistedBookingSessionRef:
        optionalRef(input.assistedBookingSessionRef) ?? current?.assistedBookingSessionRef ?? null,
      queueKey:
        optionalRef(input.queueKey) ?? current?.queueKey ?? "booking_exception_attention",
      exceptionFamily: input.exceptionFamily,
      severity: input.severity,
      entryState:
        current?.entryState === "claimed" || current?.entryState === "open"
          ? current.entryState
          : "open",
      selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
      currentSnapshotRef: optionalRef(input.currentSnapshotRef) ?? current?.currentSnapshotRef ?? null,
      providerAdapterBindingRef:
        optionalRef(input.providerAdapterBindingRef) ?? current?.providerAdapterBindingRef ?? null,
      providerAdapterBindingHash:
        optionalRef(input.providerAdapterBindingHash) ??
        current?.providerAdapterBindingHash ??
        null,
      capabilityResolutionRef:
        optionalRef(input.capabilityResolutionRef) ?? current?.capabilityResolutionRef ?? null,
      capabilityTupleHash:
        optionalRef(input.capabilityTupleHash) ?? current?.capabilityTupleHash ?? null,
      staffWorkspaceConsistencyProjectionRef:
        optionalRef(input.staffWorkspaceConsistencyProjectionRef) ??
        current?.staffWorkspaceConsistencyProjectionRef ??
        null,
      workspaceSliceTrustProjectionRef:
        optionalRef(input.workspaceSliceTrustProjectionRef) ??
        current?.workspaceSliceTrustProjectionRef ??
        null,
      reviewActionLeaseRef:
        optionalRef(input.reviewActionLeaseRef) ?? current?.reviewActionLeaseRef ?? null,
      surfaceRouteContractRef:
        optionalRef(input.surfaceRouteContractRef) ?? current?.surfaceRouteContractRef ?? null,
      surfacePublicationRef:
        optionalRef(input.surfacePublicationRef) ?? current?.surfacePublicationRef ?? null,
      runtimePublicationBundleRef:
        optionalRef(input.runtimePublicationBundleRef) ??
        current?.runtimePublicationBundleRef ??
        null,
      taskCompletionSettlementEnvelopeRef:
        optionalRef(input.taskCompletionSettlementEnvelopeRef) ??
        current?.taskCompletionSettlementEnvelopeRef ??
        null,
      requestLifecycleLeaseRef:
        optionalRef(input.requestLifecycleLeaseRef) ?? current?.requestLifecycleLeaseRef ?? null,
      requestOwnershipEpochRef:
        input.requestOwnershipEpochRef ?? current?.requestOwnershipEpochRef ?? null,
      staleOwnerRecoveryRef:
        optionalRef(input.staleOwnerRecoveryRef) ?? current?.staleOwnerRecoveryRef ?? null,
      reasonCodes: uniqueSorted([
        ...(current?.reasonCodes ?? []),
        ...input.reasonCodes,
      ]),
      evidenceRefs: uniqueSorted([
        ...(current?.evidenceRefs ?? []),
        ...(input.evidenceRefs ?? []),
      ]),
      operatorVisibleDiagnosticRef:
        optionalRef(input.operatorVisibleDiagnosticRef) ??
        current?.operatorVisibleDiagnosticRef ??
        null,
      sameShellRecoveryRouteRef:
        optionalRef(input.sameShellRecoveryRouteRef) ??
        current?.sameShellRecoveryRouteRef ??
        null,
      claimedByRef: current?.claimedByRef ?? null,
      claimedAt: current?.claimedAt ?? null,
      resolvedAt: null,
      observedAt: ensureIsoTimestamp(input.observedAt, "observedAt"),
      updatedAt: ensureIsoTimestamp(input.observedAt, "observedAt"),
      version: (current?.version ?? 0) + 1,
    });
    await this.repositories.saveBookingExceptionQueueEntry(next, {
      expectedVersion: current?.version,
    });
    await this.repositories.setCurrentBookingExceptionQueueEntryRef(
      next.bookingCaseRef,
      next.exceptionFamily,
      next.bookingExceptionQueueEntryId,
    );
    return {
      entry: next,
      emittedEvents: [
        makeFoundationEvent(
          current ? "booking.exception_queue.updated" : "booking.exception_queue.opened",
          {
            bookingExceptionQueueEntryRef: next.bookingExceptionQueueEntryId,
            bookingCaseRef: next.bookingCaseRef,
            taskRef: next.taskRef,
            exceptionFamily: next.exceptionFamily,
            severity: next.severity,
            entryState: next.entryState,
          },
        ),
      ],
    };
  }

  async claimBookingExceptionQueueEntry(
    input: ClaimBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntryMutationResult> {
    const currentDocument = await this.repositories.getBookingExceptionQueueEntry(
      requireRef(input.bookingExceptionQueueEntryId, "bookingExceptionQueueEntryId"),
    );
    invariant(
      currentDocument !== null,
      "BOOKING_EXCEPTION_QUEUE_ENTRY_NOT_FOUND",
      `BookingExceptionQueueEntry ${input.bookingExceptionQueueEntryId} was not found.`,
    );
    const current = currentDocument.toSnapshot();
    invariant(
      current.entryState === "open" || current.entryState === "claimed",
      "BOOKING_EXCEPTION_QUEUE_ENTRY_NOT_CLAIMABLE",
      `BookingExceptionQueueEntry ${current.bookingExceptionQueueEntryId} is not claimable.`,
    );
    const next = normalizeQueueEntry({
      ...current,
      entryState: "claimed",
      claimedByRef: requireRef(input.claimedByRef, "claimedByRef"),
      claimedAt: ensureIsoTimestamp(input.claimedAt, "claimedAt"),
      updatedAt: ensureIsoTimestamp(input.claimedAt, "claimedAt"),
      version: current.version + 1,
    });
    await this.repositories.saveBookingExceptionQueueEntry(next, {
      expectedVersion: current.version,
    });
    await this.repositories.setCurrentBookingExceptionQueueEntryRef(
      next.bookingCaseRef,
      next.exceptionFamily,
      next.bookingExceptionQueueEntryId,
    );
    return {
      entry: next,
      emittedEvents: [
        makeFoundationEvent("booking.exception_queue.claimed", {
          bookingExceptionQueueEntryRef: next.bookingExceptionQueueEntryId,
          claimedByRef: next.claimedByRef,
          claimedAt: next.claimedAt,
        }),
      ],
    };
  }

  async reopenBookingExceptionQueueEntry(
    input: ReopenBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntryMutationResult> {
    const currentDocument = await this.repositories.getBookingExceptionQueueEntry(
      requireRef(input.bookingExceptionQueueEntryId, "bookingExceptionQueueEntryId"),
    );
    invariant(
      currentDocument !== null,
      "BOOKING_EXCEPTION_QUEUE_ENTRY_NOT_FOUND",
      `BookingExceptionQueueEntry ${input.bookingExceptionQueueEntryId} was not found.`,
    );
    const current = currentDocument.toSnapshot();
    const next = normalizeQueueEntry({
      ...current,
      entryState: "open",
      claimedByRef: null,
      claimedAt: null,
      resolvedAt: null,
      reasonCodes: uniqueSorted([...(current.reasonCodes ?? []), ...(input.reasonCodes ?? [])]),
      updatedAt: ensureIsoTimestamp(input.reopenedAt, "reopenedAt"),
      version: current.version + 1,
    });
    await this.repositories.saveBookingExceptionQueueEntry(next, {
      expectedVersion: current.version,
    });
    await this.repositories.setCurrentBookingExceptionQueueEntryRef(
      next.bookingCaseRef,
      next.exceptionFamily,
      next.bookingExceptionQueueEntryId,
    );
    return {
      entry: next,
      emittedEvents: [
        makeFoundationEvent("booking.exception_queue.reopened", {
          bookingExceptionQueueEntryRef: next.bookingExceptionQueueEntryId,
          bookingCaseRef: next.bookingCaseRef,
          exceptionFamily: next.exceptionFamily,
        }),
      ],
    };
  }

  async resolveBookingExceptionQueueEntry(
    input: ResolveBookingExceptionQueueEntryInput,
  ): Promise<BookingExceptionQueueEntryMutationResult> {
    const currentDocument = await this.repositories.getBookingExceptionQueueEntry(
      requireRef(input.bookingExceptionQueueEntryId, "bookingExceptionQueueEntryId"),
    );
    invariant(
      currentDocument !== null,
      "BOOKING_EXCEPTION_QUEUE_ENTRY_NOT_FOUND",
      `BookingExceptionQueueEntry ${input.bookingExceptionQueueEntryId} was not found.`,
    );
    const current = currentDocument.toSnapshot();
    const nextState = input.nextState ?? "resolved";
    const next = normalizeQueueEntry({
      ...current,
      entryState: nextState,
      reasonCodes: uniqueSorted([...(current.reasonCodes ?? []), ...(input.reasonCodes ?? [])]),
      resolvedAt: ensureIsoTimestamp(input.resolvedAt, "resolvedAt"),
      updatedAt: ensureIsoTimestamp(input.resolvedAt, "resolvedAt"),
      version: current.version + 1,
    });
    await this.repositories.saveBookingExceptionQueueEntry(next, {
      expectedVersion: current.version,
    });
    if (nextState === "resolved" || nextState === "superseded") {
      await this.repositories.setCurrentBookingExceptionQueueEntryRef(
        next.bookingCaseRef,
        next.exceptionFamily,
        null,
      );
    }
    return {
      entry: next,
      emittedEvents: [
        makeFoundationEvent("booking.exception_queue.resolved", {
          bookingExceptionQueueEntryRef: next.bookingExceptionQueueEntryId,
          bookingCaseRef: next.bookingCaseRef,
          exceptionFamily: next.exceptionFamily,
          entryState: next.entryState,
        }),
      ],
    };
  }
}

export function createPhase4AssistedBookingService(options?: {
  repositories?: Phase4AssistedBookingRepositories;
}): Phase4AssistedBookingService {
  return new Phase4AssistedBookingServiceImpl(
    options?.repositories ?? createPhase4AssistedBookingStore(),
  );
}
