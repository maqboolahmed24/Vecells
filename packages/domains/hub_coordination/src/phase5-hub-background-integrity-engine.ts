import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import type { HubCommandAuthorityInput } from "./phase5-acting-context-visibility-kernel";
import type {
  AlternativeOfferSessionSnapshot,
  HubOfferToConfirmationTruthProjectionSnapshot,
  Phase5AlternativeOfferEngineRepositories,
} from "./phase5-alternative-offer-engine";
import {
  providerAdapterBindingHashFromSnapshot,
  type CurrentHubCommitState,
  type HubAppointmentRecordSnapshot,
  type HubCommitAttemptSnapshot,
  type HubCommitMutationResult,
  type HubCommitReconciliationRecordSnapshot,
  type HubCommitConfidenceBand,
  type HubImportedConfirmationEvidenceSnapshot,
  type HubSupplierMirrorFreezeState,
  type HubSupplierMirrorStateSnapshot,
  type HubSupplierObservedStatus,
  type Phase5HubCommitEngineRepositories,
  type Phase5HubCommitEngineService,
} from "./phase5-hub-commit-engine";
import type { HubCapacityAdapterBindingSnapshot } from "./phase5-network-capacity-pipeline";
import type { Phase5HubCaseKernelService } from "./phase5-hub-case-kernel";
import type {
  HubCoordinationExceptionClass,
  HubCoordinationExceptionEscalationState,
  HubCoordinationExceptionRetryState,
  HubCoordinationExceptionSnapshot,
  Phase5HubFallbackEngineService,
  Phase5HubFallbackRepositories,
} from "./phase5-hub-fallback-engine";
import type {
  CurrentPracticeContinuityState,
  Phase5PracticeContinuityService,
} from "./phase5-practice-continuity-engine";
import type {
  CurrentReminderManageVisibilityState,
  Phase5ReminderManageVisibilityService,
} from "./phase5-reminders-manage-visibility-engine";

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

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function addMinutes(timestamp: string, minutes: number): string {
  const date = new Date(timestamp);
  date.setTime(date.getTime() + minutes * 60_000);
  return date.toISOString();
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

function liveAttemptStates(state: HubCommitAttemptSnapshot["attemptState"]): boolean {
  return ["draft", "executing", "awaiting_confirmation", "reconciliation_required", "disputed"].includes(
    state,
  );
}

function computeTruthTupleHash(
  snapshot: Omit<HubOfferToConfirmationTruthProjectionSnapshot, "truthTupleHash"> & {
    truthTupleHash?: string;
  },
): string {
  return sha256Hex(
    stableStringify({
      offerSessionRef: snapshot.offerSessionRef,
      selectedCandidateRef: snapshot.selectedCandidateRef,
      fallbackCardRef: snapshot.fallbackCardRef,
      offerSetHash: snapshot.offerSetHash,
      offerState: snapshot.offerState,
      offerActionabilityState: snapshot.offerActionabilityState,
      fallbackLinkState: snapshot.fallbackLinkState,
      patientVisibilityState: snapshot.patientVisibilityState,
      practiceVisibilityState: snapshot.practiceVisibilityState,
      closureState: snapshot.closureState,
      latestRegenerationSettlementRef: snapshot.latestRegenerationSettlementRef,
      currentAckGeneration: snapshot.practiceAckGeneration,
      policyTupleHash: snapshot.policyTupleHash,
      monotoneRevision: snapshot.monotoneRevision,
    }),
  );
}

function updateTruthProjection(
  current: HubOfferToConfirmationTruthProjectionSnapshot,
  input: Partial<HubOfferToConfirmationTruthProjectionSnapshot>,
  generatedAt: string,
): HubOfferToConfirmationTruthProjectionSnapshot {
  const nextCore = {
    ...current,
    ...input,
    generatedAt,
    monotoneRevision: current.monotoneRevision + 1,
    version: nextVersion(current.version),
  };
  return {
    ...nextCore,
    truthTupleHash: computeTruthTupleHash({
      ...nextCore,
      truthTupleHash: undefined as never,
    }),
  };
}

function currentTruthProjectionRef(
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot,
): string {
  return `${truthProjection.hubOfferToConfirmationTruthProjectionId}@v${truthProjection.version}`;
}

function driftSeverity(state: HubSupplierMirrorStateSnapshot["driftState"]): number {
  switch (state) {
    case "aligned":
      return 0;
    case "reconciled":
      return 1;
    case "pending_review":
      return 2;
    case "drift_detected":
      return 3;
    case "disputed":
      return 4;
  }
}

const DEFAULT_SOURCE_REFS = [
  "blueprint/phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging",
  "blueprint/phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility",
  "blueprint/phase-0-the-foundation-protocol.md#1.15 ExternalConfirmationGate",
  "blueprint/phase-0-the-foundation-protocol.md#10.7 Booking commit algorithm",
  "docs/architecture/321_hub_commit_attempts_confirmation_gates_and_appointment_truth.md",
  "docs/architecture/322_practice_continuity_message_and_acknowledgement_chain.md",
  "docs/architecture/324_network_reminders_manage_and_practice_visibility_backend.md",
].sort();

export const hubReconciliationLeaseStates = [
  "active",
  "completed",
  "expired",
  "superseded",
] as const;
export type HubReconciliationLeaseState = (typeof hubReconciliationLeaseStates)[number];

export const hubReconciliationOutcomeStates = [
  "pending",
  "resolved",
  "disputed",
  "stalled",
  "replayed",
] as const;
export type HubReconciliationOutcomeState =
  (typeof hubReconciliationOutcomeStates)[number];

export const hubImportedConfirmationCorrelationStates = [
  "accepted",
  "evidence_only",
  "disputed",
  "duplicate",
  "replayed",
] as const;
export type HubImportedConfirmationCorrelationState =
  (typeof hubImportedConfirmationCorrelationStates)[number];

export const hubSupplierObservationFreshnessStates = [
  "current",
  "stale",
  "replayed",
] as const;
export type HubSupplierObservationFreshnessState =
  (typeof hubSupplierObservationFreshnessStates)[number];

export const hubSupplierObservationDispositions = [
  "aligned",
  "drift_detected",
  "ignored_stale",
  "ignored_weaker",
  "replayed",
] as const;
export type HubSupplierObservationDisposition =
  (typeof hubSupplierObservationDispositions)[number];

export const hubExceptionWorkStates = [
  "open",
  "claimed",
  "retry_scheduled",
  "escalated",
  "resolved",
  "suppressed",
] as const;
export type HubExceptionWorkState = (typeof hubExceptionWorkStates)[number];

export const hubExceptionLeaseStates = ["idle", "active", "expired"] as const;
export type HubExceptionLeaseState = (typeof hubExceptionLeaseStates)[number];

export const hubExceptionAuditActionKinds = [
  "opened",
  "claimed",
  "retried",
  "escalated",
  "resolved",
  "suppressed",
  "expired_lease",
  "replayed",
  "stale_owner_detected",
] as const;
export type HubExceptionAuditActionKind =
  (typeof hubExceptionAuditActionKinds)[number];

export const hubBackfillCursorStates = [
  "idle",
  "processed",
  "ambiguous",
  "repair_required",
] as const;
export type HubBackfillCursorState = (typeof hubBackfillCursorStates)[number];

export const hubBackfillVerdicts = ["no_change", "repaired", "ambiguous"] as const;
export type HubBackfillVerdict = (typeof hubBackfillVerdicts)[number];

export const hubReconciliationResolutionKinds = [
  "confirmed_from_imported_evidence",
  "duplicate_no_truth",
  "manual_dispute",
  "stalled_retryable",
] as const;
export type HubReconciliationResolutionKind =
  (typeof hubReconciliationResolutionKinds)[number];

export interface HubReconciliationWorkLeaseSnapshot {
  hubReconciliationWorkLeaseId: string;
  hubCoordinationCaseId: string;
  commitAttemptId: string;
  reconciliationRecordRef: string;
  workerRef: string;
  workerRunRef: string;
  leaseState: HubReconciliationLeaseState;
  leaseFenceToken: string;
  claimedAt: string;
  leaseExpiresAt: string;
  releasedAt: string | null;
  outcomeState: HubReconciliationOutcomeState;
  outcomeReasonRefs: readonly string[];
  resultingCommitAttemptRef: string | null;
  resultingAppointmentRef: string | null;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubImportedConfirmationCorrelationSnapshot {
  hubImportedConfirmationCorrelationId: string;
  hubCoordinationCaseId: string;
  dedupeKey: string;
  importedEvidenceRef: string;
  supplierCorrelationKey: string | null;
  supplierBookingReference: string;
  matchedCommitAttemptRef: string | null;
  matchedAppointmentRef: string | null;
  providerAdapterBindingHash: string;
  truthTupleHash: string;
  correlationState: HubImportedConfirmationCorrelationState;
  resultCommitAttemptRef: string | null;
  resultAppointmentRef: string | null;
  reasonRefs: readonly string[];
  recordedAt: string;
  updatedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubSupplierObservationSnapshot {
  hubSupplierObservationId: string;
  hubCoordinationCaseId: string;
  hubAppointmentId: string;
  payloadId: string;
  supplierVersion: string;
  observedStatus: HubSupplierObservedStatus;
  freshnessState: HubSupplierObservationFreshnessState;
  observationDisposition: HubSupplierObservationDisposition;
  confidenceBand: HubCommitConfidenceBand;
  previousMirrorRevision: number;
  observedAt: string;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubSupplierMirrorCheckpointSnapshot {
  hubSupplierMirrorCheckpointId: string;
  hubCoordinationCaseId: string;
  hubAppointmentId: string;
  hubSupplierMirrorStateId: string;
  supplierObservationRef: string;
  driftState: HubSupplierMirrorStateSnapshot["driftState"];
  manageFreezeState: HubSupplierMirrorFreezeState;
  truthTupleHash: string;
  continuityRefreshRequired: boolean;
  visibilityDebtReopened: boolean;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubExceptionWorkItemSnapshot {
  hubExceptionWorkItemId: string;
  exceptionRef: string;
  hubCoordinationCaseId: string;
  exceptionClass: HubCoordinationExceptionClass;
  workState: HubExceptionWorkState;
  retryCount: number;
  retryAfterAt: string | null;
  nextEscalationAt: string | null;
  workerRef: string | null;
  workerRunRef: string | null;
  leaseFenceToken: string | null;
  leaseState: HubExceptionLeaseState;
  leaseExpiresAt: string | null;
  lastAuditRowRef: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubExceptionAuditRowSnapshot {
  hubExceptionAuditRowId: string;
  exceptionWorkItemRef: string;
  exceptionRef: string;
  hubCoordinationCaseId: string;
  actionKind: HubExceptionAuditActionKind;
  reasonCode: string;
  recordedAt: string;
  details: Record<string, unknown>;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubProjectionBackfillCursorSnapshot {
  hubProjectionBackfillCursorId: string;
  hubCoordinationCaseId: string;
  cursorState: HubBackfillCursorState;
  lastVerdict: HubBackfillVerdict;
  lastTruthTupleHash: string | null;
  lastProjectionRef: string | null;
  ambiguityReasonRefs: readonly string[];
  workerRef: string;
  workerRunRef: string;
  leaseFenceToken: string;
  processedAt: string;
  sourceRefs: readonly string[];
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

export interface Phase5HubBackgroundIntegrityRepositories {
  getReconciliationWorkLeaseForAttempt(
    commitAttemptId: string,
  ): Promise<SnapshotDocument<HubReconciliationWorkLeaseSnapshot> | null>;
  saveReconciliationWorkLease(
    snapshot: HubReconciliationWorkLeaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listReconciliationWorkLeasesForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<HubReconciliationWorkLeaseSnapshot>[]>;
  findImportedConfirmationCorrelationByDedupeKey(
    dedupeKey: string,
  ): Promise<SnapshotDocument<HubImportedConfirmationCorrelationSnapshot> | null>;
  saveImportedConfirmationCorrelation(
    snapshot: HubImportedConfirmationCorrelationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listImportedConfirmationCorrelationsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<HubImportedConfirmationCorrelationSnapshot>[]>;
  findSupplierObservationByPayloadId(
    payloadId: string,
  ): Promise<SnapshotDocument<HubSupplierObservationSnapshot> | null>;
  appendSupplierObservation(snapshot: HubSupplierObservationSnapshot): Promise<void>;
  listSupplierObservationsForAppointment(
    hubAppointmentId: string,
  ): Promise<readonly SnapshotDocument<HubSupplierObservationSnapshot>[]>;
  saveSupplierMirrorCheckpoint(
    snapshot: HubSupplierMirrorCheckpointSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSupplierMirrorCheckpointsForAppointment(
    hubAppointmentId: string,
  ): Promise<readonly SnapshotDocument<HubSupplierMirrorCheckpointSnapshot>[]>;
  getExceptionWorkItemForException(
    exceptionId: string,
  ): Promise<SnapshotDocument<HubExceptionWorkItemSnapshot> | null>;
  saveExceptionWorkItem(
    snapshot: HubExceptionWorkItemSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listExceptionWorkItemsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<HubExceptionWorkItemSnapshot>[]>;
  appendExceptionAuditRow(snapshot: HubExceptionAuditRowSnapshot): Promise<void>;
  listExceptionAuditRowsForWorkItem(
    hubExceptionWorkItemId: string,
  ): Promise<readonly SnapshotDocument<HubExceptionAuditRowSnapshot>[]>;
  getBackfillCursorForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<HubProjectionBackfillCursorSnapshot> | null>;
  saveBackfillCursor(
    snapshot: HubProjectionBackfillCursorSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export class Phase5HubBackgroundIntegrityStore
  implements Phase5HubBackgroundIntegrityRepositories
{
  private readonly reconciliationLeases = new Map<string, HubReconciliationWorkLeaseSnapshot>();
  private readonly reconciliationLeaseByAttempt = new Map<string, string>();
  private readonly reconciliationLeaseIdsByCase = new Map<string, string[]>();
  private readonly importedCorrelations = new Map<string, HubImportedConfirmationCorrelationSnapshot>();
  private readonly importedCorrelationByDedupe = new Map<string, string>();
  private readonly importedCorrelationIdsByCase = new Map<string, string[]>();
  private readonly supplierObservations = new Map<string, HubSupplierObservationSnapshot>();
  private readonly supplierObservationByPayload = new Map<string, string>();
  private readonly supplierObservationIdsByAppointment = new Map<string, string[]>();
  private readonly mirrorCheckpoints = new Map<string, HubSupplierMirrorCheckpointSnapshot>();
  private readonly mirrorCheckpointIdsByAppointment = new Map<string, string[]>();
  private readonly exceptionWorkItems = new Map<string, HubExceptionWorkItemSnapshot>();
  private readonly exceptionWorkItemByException = new Map<string, string>();
  private readonly exceptionWorkItemIdsByCase = new Map<string, string[]>();
  private readonly exceptionAuditRows = new Map<string, HubExceptionAuditRowSnapshot[]>();
  private readonly backfillCursorsByCase = new Map<string, HubProjectionBackfillCursorSnapshot>();

  async getReconciliationWorkLeaseForAttempt(commitAttemptId: string) {
    const leaseId = this.reconciliationLeaseByAttempt.get(commitAttemptId);
    return leaseId ? new StoredDocument(this.reconciliationLeases.get(leaseId)!) : null;
  }

  async saveReconciliationWorkLease(
    snapshot: HubReconciliationWorkLeaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.reconciliationLeases, snapshot.hubReconciliationWorkLeaseId, snapshot, options);
    this.reconciliationLeaseByAttempt.set(snapshot.commitAttemptId, snapshot.hubReconciliationWorkLeaseId);
    const current = this.reconciliationLeaseIdsByCase.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.hubReconciliationWorkLeaseId)) {
      this.reconciliationLeaseIdsByCase.set(snapshot.hubCoordinationCaseId, [
        ...current,
        snapshot.hubReconciliationWorkLeaseId,
      ]);
    }
  }

  async listReconciliationWorkLeasesForCase(hubCoordinationCaseId: string) {
    return (this.reconciliationLeaseIdsByCase.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.reconciliationLeases.get(id))
      .filter((row): row is HubReconciliationWorkLeaseSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.claimedAt, right.claimedAt))
      .map((row) => new StoredDocument(row));
  }

  async findImportedConfirmationCorrelationByDedupeKey(dedupeKey: string) {
    const correlationId = this.importedCorrelationByDedupe.get(dedupeKey);
    return correlationId ? new StoredDocument(this.importedCorrelations.get(correlationId)!) : null;
  }

  async saveImportedConfirmationCorrelation(
    snapshot: HubImportedConfirmationCorrelationSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.importedCorrelations,
      snapshot.hubImportedConfirmationCorrelationId,
      snapshot,
      options,
    );
    this.importedCorrelationByDedupe.set(snapshot.dedupeKey, snapshot.hubImportedConfirmationCorrelationId);
    const current = this.importedCorrelationIdsByCase.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.hubImportedConfirmationCorrelationId)) {
      this.importedCorrelationIdsByCase.set(snapshot.hubCoordinationCaseId, [
        ...current,
        snapshot.hubImportedConfirmationCorrelationId,
      ]);
    }
  }

  async listImportedConfirmationCorrelationsForCase(hubCoordinationCaseId: string) {
    return (this.importedCorrelationIdsByCase.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.importedCorrelations.get(id))
      .filter((row): row is HubImportedConfirmationCorrelationSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => new StoredDocument(row));
  }

  async findSupplierObservationByPayloadId(payloadId: string) {
    const observationId = this.supplierObservationByPayload.get(payloadId);
    return observationId ? new StoredDocument(this.supplierObservations.get(observationId)!) : null;
  }

  async appendSupplierObservation(snapshot: HubSupplierObservationSnapshot) {
    saveWithCas(this.supplierObservations, snapshot.hubSupplierObservationId, snapshot);
    this.supplierObservationByPayload.set(snapshot.payloadId, snapshot.hubSupplierObservationId);
    const current = this.supplierObservationIdsByAppointment.get(snapshot.hubAppointmentId) ?? [];
    if (!current.includes(snapshot.hubSupplierObservationId)) {
      this.supplierObservationIdsByAppointment.set(snapshot.hubAppointmentId, [
        ...current,
        snapshot.hubSupplierObservationId,
      ]);
    }
  }

  async listSupplierObservationsForAppointment(hubAppointmentId: string) {
    return (this.supplierObservationIdsByAppointment.get(hubAppointmentId) ?? [])
      .map((id) => this.supplierObservations.get(id))
      .filter((row): row is HubSupplierObservationSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => new StoredDocument(row));
  }

  async saveSupplierMirrorCheckpoint(
    snapshot: HubSupplierMirrorCheckpointSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.mirrorCheckpoints, snapshot.hubSupplierMirrorCheckpointId, snapshot, options);
    const current = this.mirrorCheckpointIdsByAppointment.get(snapshot.hubAppointmentId) ?? [];
    if (!current.includes(snapshot.hubSupplierMirrorCheckpointId)) {
      this.mirrorCheckpointIdsByAppointment.set(snapshot.hubAppointmentId, [
        ...current,
        snapshot.hubSupplierMirrorCheckpointId,
      ]);
    }
  }

  async listSupplierMirrorCheckpointsForAppointment(hubAppointmentId: string) {
    return (this.mirrorCheckpointIdsByAppointment.get(hubAppointmentId) ?? [])
      .map((id) => this.mirrorCheckpoints.get(id))
      .filter((row): row is HubSupplierMirrorCheckpointSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => new StoredDocument(row));
  }

  async getExceptionWorkItemForException(exceptionId: string) {
    const workItemId = this.exceptionWorkItemByException.get(exceptionId);
    return workItemId ? new StoredDocument(this.exceptionWorkItems.get(workItemId)!) : null;
  }

  async saveExceptionWorkItem(
    snapshot: HubExceptionWorkItemSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.exceptionWorkItems, snapshot.hubExceptionWorkItemId, snapshot, options);
    this.exceptionWorkItemByException.set(snapshot.exceptionRef, snapshot.hubExceptionWorkItemId);
    const current = this.exceptionWorkItemIdsByCase.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.hubExceptionWorkItemId)) {
      this.exceptionWorkItemIdsByCase.set(snapshot.hubCoordinationCaseId, [
        ...current,
        snapshot.hubExceptionWorkItemId,
      ]);
    }
  }

  async listExceptionWorkItemsForCase(hubCoordinationCaseId: string) {
    return (this.exceptionWorkItemIdsByCase.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.exceptionWorkItems.get(id))
      .filter((row): row is HubExceptionWorkItemSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => new StoredDocument(row));
  }

  async appendExceptionAuditRow(snapshot: HubExceptionAuditRowSnapshot) {
    const current = this.exceptionAuditRows.get(snapshot.exceptionWorkItemRef) ?? [];
    this.exceptionAuditRows.set(snapshot.exceptionWorkItemRef, [...current, structuredClone(snapshot)]);
  }

  async listExceptionAuditRowsForWorkItem(hubExceptionWorkItemId: string) {
    return (this.exceptionAuditRows.get(hubExceptionWorkItemId) ?? [])
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => new StoredDocument(row));
  }

  async getBackfillCursorForCase(hubCoordinationCaseId: string) {
    const row = this.backfillCursorsByCase.get(hubCoordinationCaseId);
    return row ? new StoredDocument(row) : null;
  }

  async saveBackfillCursor(
    snapshot: HubProjectionBackfillCursorSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.backfillCursorsByCase, snapshot.hubCoordinationCaseId, snapshot, options);
  }
}

export function createPhase5HubBackgroundIntegrityStore(): Phase5HubBackgroundIntegrityStore {
  return new Phase5HubBackgroundIntegrityStore();
}

async function requireSnapshot<T>(
  loader: Promise<SnapshotDocument<T> | null>,
  code: string,
  message: string,
): Promise<T> {
  const document = await loader;
  invariant(document, code, message);
  return document.toSnapshot();
}

function correlationDedupeKey(input: {
  hubCoordinationCaseId: string;
  importedEvidence: HubImportedConfirmationEvidenceSnapshot;
}): string {
  return `${input.hubCoordinationCaseId}::${input.importedEvidence.importedEvidenceRef}`;
}

function supplierObservationPayloadKey(input: {
  hubAppointmentId: string;
  payloadId: string;
}): string {
  return `${input.hubAppointmentId}::${input.payloadId}`;
}

function exceptionWorkDefaults(
  exceptionClass: HubCoordinationExceptionClass,
  recordedAt: string,
): {
  retryState: HubCoordinationExceptionRetryState;
  escalationState: HubCoordinationExceptionEscalationState;
  retryAfterAt: string | null;
  nextEscalationAt: string | null;
} {
  switch (exceptionClass) {
    case "reconciliation_stalled":
      return {
        retryState: "retryable",
        escalationState: "none",
        retryAfterAt: addMinutes(recordedAt, 15),
        nextEscalationAt: addMinutes(recordedAt, 120),
      };
    case "supplier_drift_detected":
    case "practice_acknowledgement_overdue":
      return {
        retryState: "retryable",
        escalationState: "none",
        retryAfterAt: addMinutes(recordedAt, 30),
        nextEscalationAt: addMinutes(recordedAt, 180),
      };
    case "stale_owner_or_stale_lease":
      return {
        retryState: "retryable",
        escalationState: "supervisor_review_required",
        retryAfterAt: addMinutes(recordedAt, 10),
        nextEscalationAt: addMinutes(recordedAt, 60),
      };
    case "callback_transfer_blocked":
    case "imported_confirmation_disputed":
    case "backfill_ambiguity_supervision":
    case "return_link_missing":
    case "callback_link_missing":
    case "loop_prevention":
    case "stale_offer_provenance":
    case "illegal_fallback_route":
      return {
        retryState: "waiting_manual",
        escalationState: "supervisor_review_required",
        retryAfterAt: null,
        nextEscalationAt: addMinutes(recordedAt, 60),
      };
  }
}

function deriveCorrelationReasonRefs(input: {
  currentTruth: HubOfferToConfirmationTruthProjectionSnapshot;
  liveAttempt: HubCommitAttemptSnapshot | null;
  appointment: HubAppointmentRecordSnapshot | null;
  providerAdapterBindingHash: string;
  importedEvidence: HubImportedConfirmationEvidenceSnapshot;
  presentedTruthTupleHash?: string | null;
  duplicateAppointmentCaseId?: string | null;
  selectedCandidateRef?: string | null;
}): string[] {
  const reasonRefs: string[] = [];
  if (
    input.presentedTruthTupleHash !== undefined &&
    input.presentedTruthTupleHash !== null &&
    input.presentedTruthTupleHash !== input.currentTruth.truthTupleHash
  ) {
    reasonRefs.push("truth_tuple_drift");
  }
  const expectedBindingHash =
    input.liveAttempt?.providerAdapterBindingHash ?? input.appointment?.providerAdapterBindingHash ?? null;
  if (expectedBindingHash !== null && expectedBindingHash !== input.providerAdapterBindingHash) {
    reasonRefs.push("provider_binding_mismatch");
  }
  if (
    input.liveAttempt !== null &&
    input.importedEvidence.sourceVersion !== input.liveAttempt.providerSourceVersion
  ) {
    reasonRefs.push("source_version_mismatch");
  }
  if (
    input.selectedCandidateRef !== undefined &&
    input.selectedCandidateRef !== null &&
    input.currentTruth.selectedCandidateRef !== null &&
    input.selectedCandidateRef !== input.currentTruth.selectedCandidateRef
  ) {
    reasonRefs.push("selected_candidate_mismatch");
  }
  if (
    input.liveAttempt !== null &&
    input.currentTruth.selectedCandidateRef !== null &&
    input.liveAttempt.selectedCandidateRef !== input.currentTruth.selectedCandidateRef
  ) {
    reasonRefs.push("live_attempt_candidate_drift");
  }
  if (
    input.appointment !== null &&
    input.appointment.sourceBookingReference !== input.importedEvidence.supplierBookingReference
  ) {
    reasonRefs.push("existing_appointment_reference_mismatch");
  }
  if (input.duplicateAppointmentCaseId && input.duplicateAppointmentCaseId !== input.currentTruth.hubCoordinationCaseId) {
    reasonRefs.push("duplicate_booking_reference_other_case");
  }
  return uniqueSortedRefs(reasonRefs);
}

function appointmentTupleConflicts(
  appointment: HubAppointmentRecordSnapshot | null,
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot,
): string[] {
  if (appointment === null) {
    return [];
  }
  const reasonRefs: string[] = [];
  if (
    truthProjection.hubAppointmentId !== null &&
    truthProjection.hubAppointmentId !== appointment.hubAppointmentId
  ) {
    reasonRefs.push("appointment_ref_conflict");
  }
  if (
    truthProjection.selectedCandidateRef !== null &&
    truthProjection.selectedCandidateRef !== appointment.selectedCandidateRef
  ) {
    reasonRefs.push("appointment_candidate_conflict");
  }
  return reasonRefs;
}

function continuityTupleConflicts(
  continuityState: CurrentPracticeContinuityState,
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot,
): string[] {
  const reasonRefs: string[] = [];
  if (
    continuityState.currentMessage !== null &&
    continuityState.currentMessage.truthTupleHash !== truthProjection.truthTupleHash
  ) {
    reasonRefs.push("continuity_message_tuple_conflict");
  }
  if (
    continuityState.currentAcknowledgement !== null &&
    continuityState.currentAcknowledgement.truthTupleHash !== truthProjection.truthTupleHash
  ) {
    reasonRefs.push("acknowledgement_tuple_conflict");
  }
  return reasonRefs;
}

function reminderTupleConflicts(
  reminderState: CurrentReminderManageVisibilityState | null,
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot,
): string[] {
  if (reminderState === null) {
    return [];
  }
  const reasonRefs: string[] = [];
  if (
    reminderState.currentManageCapabilities !== null &&
    reminderState.currentManageCapabilities.truthTupleHash !== truthProjection.truthTupleHash
  ) {
    reasonRefs.push("manage_capability_tuple_conflict");
  }
  if (
    reminderState.practiceVisibilityProjection !== null &&
    reminderState.practiceVisibilityProjection.truthTupleHash !== truthProjection.truthTupleHash
  ) {
    reasonRefs.push("practice_visibility_tuple_conflict");
  }
  return reasonRefs;
}

function defaultVisibilityEnvelopeId(input: {
  continuityState: CurrentPracticeContinuityState;
  reminderState: CurrentReminderManageVisibilityState | null;
}): string | null {
  return (
    input.reminderState?.practiceVisibilityProjection?.visibilityEnvelopeVersionRef ??
    input.reminderState?.currentManageCapabilities?.visibilityEnvelopeVersionRef ??
    input.continuityState.currentMessage?.visibilityEnvelopeVersionRef ??
    input.continuityState.currentAcknowledgement?.visibilityEnvelopeVersionRef ??
    null
  );
}

function isSevereMirrorState(
  mirrorState: HubSupplierMirrorStateSnapshot | null,
): boolean {
  if (mirrorState === null) {
    return false;
  }
  return mirrorState.manageFreezeState === "frozen" || driftSeverity(mirrorState.driftState) >= 3;
}

export interface ClaimHubReconciliationAttemptInput {
  commitAttemptId: string;
  workerRef: string;
  workerRunRef: string;
  claimedAt: string;
  leaseMinutes?: number;
  sourceRefs?: readonly string[];
}

export interface ClaimHubReconciliationAttemptResult {
  workLease: HubReconciliationWorkLeaseSnapshot | null;
  reconciliationRecord: HubCommitReconciliationRecordSnapshot;
  replayed: boolean;
  blockedByActiveLease: boolean;
}

export interface CorrelateImportedConfirmationInput {
  hubCoordinationCaseId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  idempotencyKey: string;
  providerAdapterBinding: HubCapacityAdapterBindingSnapshot;
  presentedTruthTupleHash?: string | null;
  selectedCandidateRef?: string | null;
  selectedOfferSessionRef?: string | null;
  selectedOfferEntryRef?: string | null;
  sourceRefs?: readonly string[];
  authority?: HubCommandAuthorityInput;
  importedEvidence: HubImportedConfirmationEvidenceSnapshot;
  allowSupersedeLiveAttempt?: boolean;
}

export interface CorrelateImportedConfirmationResult {
  correlation: HubImportedConfirmationCorrelationSnapshot;
  commitResult: HubCommitMutationResult | null;
  exception: HubCoordinationExceptionSnapshot | null;
  exceptionWorkItem: HubExceptionWorkItemSnapshot | null;
  replayed: boolean;
}

export interface ResolveHubReconciliationAttemptInput {
  commitAttemptId: string;
  workerRef: string;
  workerRunRef: string;
  recordedAt: string;
  resolutionKind: HubReconciliationResolutionKind;
  importedCorrelation?: Omit<
    CorrelateImportedConfirmationInput,
    "hubCoordinationCaseId" | "allowSupersedeLiveAttempt"
  > | null;
  sourceRefs?: readonly string[];
}

export interface ResolveHubReconciliationAttemptResult {
  workLease: HubReconciliationWorkLeaseSnapshot;
  correlation: HubImportedConfirmationCorrelationSnapshot | null;
  resultingCommitState: CurrentHubCommitState;
  exception: HubCoordinationExceptionSnapshot | null;
  exceptionWorkItem: HubExceptionWorkItemSnapshot | null;
}

export interface IngestHubSupplierMirrorObservationInput {
  hubAppointmentId: string;
  payloadId: string;
  supplierSystem: string;
  supplierVersion: string;
  observedAt: string;
  recordedAt: string;
  observedStatus: HubSupplierObservedStatus;
  confidenceBand?: HubCommitConfidenceBand;
  driftReasonRefs?: readonly string[];
  sourceRefs?: readonly string[];
  reopenPracticeAcknowledgement?: boolean;
  refreshPracticeVisibility?: boolean;
}

export interface IngestHubSupplierMirrorObservationResult {
  observation: HubSupplierObservationSnapshot;
  checkpoint: HubSupplierMirrorCheckpointSnapshot;
  mirrorState: HubSupplierMirrorStateSnapshot;
  exception: HubCoordinationExceptionSnapshot | null;
  exceptionWorkItem: HubExceptionWorkItemSnapshot | null;
  replayed: boolean;
}

export interface OpenHubExceptionWorkInput {
  hubCoordinationCaseId: string;
  exceptionClass: HubCoordinationExceptionClass;
  reasonCode: string;
  truthProjectionRef?: string | null;
  truthTupleHash: string;
  recordedAt: string;
  sourceRefs?: readonly string[];
  details?: Record<string, unknown>;
}

export interface OpenHubExceptionWorkResult {
  exception: HubCoordinationExceptionSnapshot;
  workItem: HubExceptionWorkItemSnapshot;
  replayed: boolean;
}

export interface ClaimHubExceptionWorkInput {
  exceptionId: string;
  workerRef: string;
  workerRunRef: string;
  claimedAt: string;
  leaseMinutes?: number;
  sourceRefs?: readonly string[];
}

export interface ClaimHubExceptionWorkResult {
  exception: HubCoordinationExceptionSnapshot;
  workItem: HubExceptionWorkItemSnapshot;
  replayed: boolean;
  blockedByActiveLease: boolean;
}

export interface ProcessHubExceptionWorkInput {
  exceptionId: string;
  workerRef: string;
  workerRunRef: string;
  recordedAt: string;
  action: "retry" | "escalate" | "resolve" | "suppress";
  reasonCode: string;
  retryAfterMinutes?: number;
  sourceRefs?: readonly string[];
  details?: Record<string, unknown>;
}

export interface ProcessHubExceptionWorkResult {
  exception: HubCoordinationExceptionSnapshot;
  workItem: HubExceptionWorkItemSnapshot;
  auditRow: HubExceptionAuditRowSnapshot;
}

export interface RunHubProjectionBackfillInput {
  hubCoordinationCaseId: string;
  workerRef: string;
  workerRunRef: string;
  recordedAt: string;
  sourceRefs?: readonly string[];
}

export interface RunHubProjectionBackfillResult {
  cursor: HubProjectionBackfillCursorSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  exception: HubCoordinationExceptionSnapshot | null;
  exceptionWorkItem: HubExceptionWorkItemSnapshot | null;
}

export interface CurrentHubBackgroundIntegrityState {
  currentWorkLease: HubReconciliationWorkLeaseSnapshot | null;
  latestImportedCorrelation: HubImportedConfirmationCorrelationSnapshot | null;
  latestSupplierObservation: HubSupplierObservationSnapshot | null;
  latestMirrorCheckpoint: HubSupplierMirrorCheckpointSnapshot | null;
  exceptionBacklog: readonly HubExceptionWorkItemSnapshot[];
  latestBackfillCursor: HubProjectionBackfillCursorSnapshot | null;
  commitState: CurrentHubCommitState;
  continuityState: CurrentPracticeContinuityState;
  reminderState: CurrentReminderManageVisibilityState | null;
}

export interface Phase5HubBackgroundIntegrityService {
  repositories: Phase5HubBackgroundIntegrityRepositories;
  claimReconciliationAttempt(
    input: ClaimHubReconciliationAttemptInput,
  ): Promise<ClaimHubReconciliationAttemptResult>;
  resolveReconciliationAttempt(
    input: ResolveHubReconciliationAttemptInput,
  ): Promise<ResolveHubReconciliationAttemptResult>;
  correlateImportedConfirmation(
    input: CorrelateImportedConfirmationInput,
  ): Promise<CorrelateImportedConfirmationResult>;
  ingestSupplierMirrorObservation(
    input: IngestHubSupplierMirrorObservationInput,
  ): Promise<IngestHubSupplierMirrorObservationResult>;
  openExceptionWork(input: OpenHubExceptionWorkInput): Promise<OpenHubExceptionWorkResult>;
  claimExceptionWork(input: ClaimHubExceptionWorkInput): Promise<ClaimHubExceptionWorkResult>;
  processExceptionWork(
    input: ProcessHubExceptionWorkInput,
  ): Promise<ProcessHubExceptionWorkResult>;
  runProjectionBackfill(
    input: RunHubProjectionBackfillInput,
  ): Promise<RunHubProjectionBackfillResult>;
  queryCurrentIntegrityState(
    hubCoordinationCaseId: string,
  ): Promise<CurrentHubBackgroundIntegrityState>;
}

export interface CreatePhase5HubBackgroundIntegrityServiceOptions {
  repositories: Phase5HubBackgroundIntegrityRepositories;
  hubCaseService: Phase5HubCaseKernelService;
  offerRepositories: Phase5AlternativeOfferEngineRepositories;
  commitRepositories: Phase5HubCommitEngineRepositories;
  commitService: Phase5HubCommitEngineService;
  practiceContinuityService: Phase5PracticeContinuityService;
  reminderManageService?: Phase5ReminderManageVisibilityService;
  fallbackRepositories: Phase5HubFallbackRepositories;
  fallbackService: Phase5HubFallbackEngineService;
  idGenerator?: BackboneIdGenerator;
}

export function createPhase5HubBackgroundIntegrityService(
  options: CreatePhase5HubBackgroundIntegrityServiceOptions,
): Phase5HubBackgroundIntegrityService {
  const repositories = options.repositories;
  const idGenerator =
    options.idGenerator ??
    createDeterministicBackboneIdGenerator("phase5-hub-background-integrity");

  async function loadCaseContext(hubCoordinationCaseId: string) {
    const truthProjection = await requireSnapshot(
      options.offerRepositories.getTruthProjectionForCase(hubCoordinationCaseId),
      "HUB_TRUTH_PROJECTION_NOT_FOUND",
      "HubOfferToConfirmationTruthProjection could not be found.",
    );
    const commitState = await options.commitService.queryCurrentCommitState(hubCoordinationCaseId);
    const continuityState =
      await options.practiceContinuityService.queryCurrentPracticeContinuityState(hubCoordinationCaseId);
    const reminderState = options.reminderManageService
      ? await options.reminderManageService.queryCurrentReminderManageVisibilityState(
          hubCoordinationCaseId,
        )
      : null;
    const fallbackRecord =
      (await options.fallbackRepositories.getCurrentFallbackForCase(hubCoordinationCaseId))?.toSnapshot() ??
      null;
    return {
      truthProjection,
      commitState,
      continuityState,
      reminderState,
      fallbackRecord,
    };
  }

  async function saveExceptionAuditRow(input: {
    workItem: HubExceptionWorkItemSnapshot;
    actionKind: HubExceptionAuditActionKind;
    reasonCode: string;
    recordedAt: string;
    details?: Record<string, unknown>;
    sourceRefs?: readonly string[];
  }): Promise<HubExceptionAuditRowSnapshot> {
    const row: HubExceptionAuditRowSnapshot = {
      hubExceptionAuditRowId: nextId(idGenerator, "hubExceptionAuditRow"),
      exceptionWorkItemRef: input.workItem.hubExceptionWorkItemId,
      exceptionRef: input.workItem.exceptionRef,
      hubCoordinationCaseId: input.workItem.hubCoordinationCaseId,
      actionKind: input.actionKind,
      reasonCode: requireRef(input.reasonCode, "reasonCode"),
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      details: structuredClone(input.details ?? {}),
      sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
      version: 1,
    };
    await repositories.appendExceptionAuditRow(row);
    return row;
  }

  async function currentOpenExceptionByClass(
    hubCoordinationCaseId: string,
    exceptionClass: HubCoordinationExceptionClass,
  ): Promise<HubCoordinationExceptionSnapshot | null> {
    const exceptions = (await options.fallbackRepositories.listHubCoordinationExceptionsForCase(
      hubCoordinationCaseId,
    ))
      .map((document) => document.toSnapshot())
      .filter(
        (row) => row.exceptionState === "open" && row.exceptionClass === exceptionClass,
      )
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
    return exceptions.at(-1) ?? null;
  }

  async function patchException(
    current: HubCoordinationExceptionSnapshot,
    input: Partial<HubCoordinationExceptionSnapshot>,
  ): Promise<HubCoordinationExceptionSnapshot> {
    const updated: HubCoordinationExceptionSnapshot = {
      ...current,
      ...input,
      version: nextVersion(current.version),
      updatedAt: input.updatedAt ?? current.updatedAt,
    };
    await options.fallbackRepositories.saveHubCoordinationException(updated, {
      expectedVersion: current.version,
    });
    return updated;
  }

  async function openExceptionWorkInternal(
    input: OpenHubExceptionWorkInput,
  ): Promise<OpenHubExceptionWorkResult> {
    const existing = await currentOpenExceptionByClass(
      input.hubCoordinationCaseId,
      input.exceptionClass,
    );
    if (existing && existing.truthTupleHash === input.truthTupleHash) {
      const currentWorkItem =
        (await repositories.getExceptionWorkItemForException(existing.exceptionId))?.toSnapshot() ?? null;
      invariant(
        currentWorkItem !== null,
        "HUB_EXCEPTION_WORK_ITEM_MISSING",
        "HubExceptionWorkItem is required for an open exception.",
      );
      return {
        exception: existing,
        workItem: currentWorkItem,
        replayed: true,
      };
    }

    const defaults = exceptionWorkDefaults(input.exceptionClass, input.recordedAt);
    const exception = await options.fallbackService.raiseHubCoordinationException({
      hubCoordinationCaseId: input.hubCoordinationCaseId,
      exceptionClass: input.exceptionClass,
      reasonCode: input.reasonCode,
      truthProjectionRef: optionalRef(input.truthProjectionRef),
      truthTupleHash: input.truthTupleHash,
      retryState: defaults.retryState,
      escalationState: defaults.escalationState,
      details: input.details,
      recordedAt: input.recordedAt,
      sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
    });
    const workItem: HubExceptionWorkItemSnapshot = {
      hubExceptionWorkItemId: nextId(idGenerator, "hubExceptionWorkItem"),
      exceptionRef: exception.exceptionId,
      hubCoordinationCaseId: input.hubCoordinationCaseId,
      exceptionClass: input.exceptionClass,
      workState: "open",
      retryCount: 0,
      retryAfterAt: defaults.retryAfterAt,
      nextEscalationAt: defaults.nextEscalationAt,
      workerRef: null,
      workerRunRef: null,
      leaseFenceToken: null,
      leaseState: "idle",
      leaseExpiresAt: null,
      lastAuditRowRef: null,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      resolvedAt: null,
      sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
      version: 1,
    };
    await repositories.saveExceptionWorkItem(workItem);
    const auditRow = await saveExceptionAuditRow({
      workItem,
      actionKind: "opened",
      reasonCode: input.reasonCode,
      recordedAt: input.recordedAt,
      details: input.details,
      sourceRefs: input.sourceRefs,
    });
    const updatedWorkItem: HubExceptionWorkItemSnapshot = {
      ...workItem,
      lastAuditRowRef: auditRow.hubExceptionAuditRowId,
      version: nextVersion(workItem.version),
    };
    await repositories.saveExceptionWorkItem(updatedWorkItem, {
      expectedVersion: workItem.version,
    });
    return {
      exception,
      workItem: updatedWorkItem,
      replayed: false,
    };
  }

  async function markAttemptTerminal(
    attempt: HubCommitAttemptSnapshot,
    recordedAt: string,
    nextState: "failed" | "superseded",
    additionalReasonRefs: readonly string[],
  ): Promise<HubCommitAttemptSnapshot> {
    const updatedAttempt: HubCommitAttemptSnapshot = {
      ...attempt,
      attemptState: nextState,
      blockingReasonRefs: uniqueSortedRefs([
        ...attempt.blockingReasonRefs,
        ...additionalReasonRefs,
      ]),
      updatedAt: recordedAt,
      finalizedAt: recordedAt,
      version: nextVersion(attempt.version),
    };
    await options.commitRepositories.saveCommitAttempt(updatedAttempt, {
      expectedVersion: attempt.version,
    });
    return updatedAttempt;
  }

  async function convertAttemptToImportedConfirmation(
    attempt: HubCommitAttemptSnapshot,
    recordedAt: string,
  ): Promise<HubCommitAttemptSnapshot> {
    if (attempt.commitMode === "imported_confirmation") {
      return attempt;
    }
    const updatedAttempt: HubCommitAttemptSnapshot = {
      ...attempt,
      commitMode: "imported_confirmation",
      updatedAt: recordedAt,
      version: nextVersion(attempt.version),
    };
    await options.commitRepositories.saveCommitAttempt(updatedAttempt, {
      expectedVersion: attempt.version,
    });
    return updatedAttempt;
  }

  async function claimActiveLeaseOrThrow(
    commitAttemptId: string,
    workerRunRef: string,
    recordedAt: string,
  ): Promise<HubReconciliationWorkLeaseSnapshot> {
    const currentLease = await requireSnapshot(
      repositories.getReconciliationWorkLeaseForAttempt(commitAttemptId),
      "HUB_RECONCILIATION_WORK_LEASE_NOT_FOUND",
      "HubReconciliationWorkLease could not be found.",
    );
    invariant(
      currentLease.leaseState === "active",
      "HUB_RECONCILIATION_LEASE_NOT_ACTIVE",
      "HubReconciliationWorkLease is not active.",
    );
    invariant(
      currentLease.workerRunRef === workerRunRef,
      "HUB_RECONCILIATION_STALE_OWNER",
      "HubReconciliationWorkLease is owned by a different worker run.",
    );
    invariant(
      compareIso(currentLease.leaseExpiresAt, recordedAt) > 0,
      "HUB_RECONCILIATION_STALE_LEASE",
      "HubReconciliationWorkLease expired before work resumed.",
    );
    return currentLease;
  }

  return {
    repositories,

    async claimReconciliationAttempt(input) {
      const attempt = await requireSnapshot(
        options.commitRepositories.getCommitAttempt(input.commitAttemptId),
        "HUB_COMMIT_ATTEMPT_NOT_FOUND",
        "HubCommitAttempt could not be found.",
      );
      invariant(
        attempt.attemptState === "reconciliation_required",
        "HUB_COMMIT_ATTEMPT_NOT_RECONCILIATION_REQUIRED",
        "HubCommitAttempt must be in reconciliation_required before it can be claimed.",
      );
      const reconciliationRecord = (await options.commitRepositories.listReconciliationRecordsForAttempt(
        input.commitAttemptId,
      ))
        .map((document) => document.toSnapshot())
        .at(-1);
      invariant(
        reconciliationRecord,
        "HUB_RECONCILIATION_RECORD_NOT_FOUND",
        "HubCommitReconciliationRecord could not be found.",
      );

      const claimedAt = ensureIsoTimestamp(input.claimedAt, "claimedAt");
      const leaseMinutes = ensurePositiveInteger(input.leaseMinutes ?? 15, "leaseMinutes");
      const existingLease =
        (await repositories.getReconciliationWorkLeaseForAttempt(input.commitAttemptId))?.toSnapshot() ??
        null;
      if (
        existingLease !== null &&
        existingLease.leaseState === "active" &&
        compareIso(existingLease.leaseExpiresAt, claimedAt) > 0
      ) {
        if (existingLease.workerRunRef === input.workerRunRef) {
          return {
            workLease: existingLease,
            reconciliationRecord,
            replayed: true,
            blockedByActiveLease: false,
          };
        }
        return {
          workLease: existingLease,
          reconciliationRecord,
          replayed: false,
          blockedByActiveLease: true,
        };
      }

      if (existingLease !== null && existingLease.leaseState === "active") {
        const expiredLease: HubReconciliationWorkLeaseSnapshot = {
          ...existingLease,
          leaseState: "expired",
          releasedAt: claimedAt,
          outcomeState: "stalled",
          outcomeReasonRefs: uniqueSortedRefs([
            ...existingLease.outcomeReasonRefs,
            "lease_expired_before_reclaim",
          ]),
          version: nextVersion(existingLease.version),
        };
        await repositories.saveReconciliationWorkLease(expiredLease, {
          expectedVersion: existingLease.version,
        });
        await openExceptionWorkInternal({
          hubCoordinationCaseId: attempt.hubCoordinationCaseId,
          exceptionClass: "stale_owner_or_stale_lease",
          reasonCode: "reconciliation_lease_expired",
          truthProjectionRef: null,
          truthTupleHash: attempt.truthTupleHash,
          recordedAt: claimedAt,
          sourceRefs: input.sourceRefs,
          details: {
            commitAttemptId: attempt.commitAttemptId,
            priorWorkerRunRef: existingLease.workerRunRef,
          },
        });
      }

      const workLease: HubReconciliationWorkLeaseSnapshot = {
        hubReconciliationWorkLeaseId: nextId(idGenerator, "hubReconciliationWorkLease"),
        hubCoordinationCaseId: attempt.hubCoordinationCaseId,
        commitAttemptId: attempt.commitAttemptId,
        reconciliationRecordRef: reconciliationRecord.hubCommitReconciliationRecordId,
        workerRef: requireRef(input.workerRef, "workerRef"),
        workerRunRef: requireRef(input.workerRunRef, "workerRunRef"),
        leaseState: "active",
        leaseFenceToken: nextId(idGenerator, "hubReconciliationLeaseFence"),
        claimedAt,
        leaseExpiresAt: addMinutes(claimedAt, leaseMinutes),
        releasedAt: null,
        outcomeState: "pending",
        outcomeReasonRefs: [],
        resultingCommitAttemptRef: null,
        resultingAppointmentRef: null,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.saveReconciliationWorkLease(workLease);
      return {
        workLease,
        reconciliationRecord,
        replayed: false,
        blockedByActiveLease: false,
      };
    },

    async correlateImportedConfirmation(input) {
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const dedupeKey = correlationDedupeKey({
        hubCoordinationCaseId: input.hubCoordinationCaseId,
        importedEvidence: input.importedEvidence,
      });
      const replayed =
        (await repositories.findImportedConfirmationCorrelationByDedupeKey(dedupeKey))?.toSnapshot() ??
        null;
      if (replayed) {
        return {
          correlation: replayed,
          commitResult: null,
          exception: null,
          exceptionWorkItem: null,
          replayed: true,
        };
      }

      const current = await loadCaseContext(input.hubCoordinationCaseId);
      const duplicateAppointment = await options.commitRepositories.findAppointmentBySourceBookingReference(
        input.importedEvidence.supplierBookingReference,
      );
      const duplicateAppointmentSnapshot = duplicateAppointment?.toSnapshot() ?? null;
      const providerBindingHash = providerAdapterBindingHashFromSnapshot(input.providerAdapterBinding);
      const reasonRefs = deriveCorrelationReasonRefs({
        currentTruth: current.truthProjection,
        liveAttempt: current.commitState.liveAttempt,
        appointment: current.commitState.appointment,
        providerAdapterBindingHash: providerBindingHash,
        importedEvidence: input.importedEvidence,
        presentedTruthTupleHash: input.presentedTruthTupleHash,
        duplicateAppointmentCaseId: duplicateAppointmentSnapshot?.hubCoordinationCaseId ?? null,
        selectedCandidateRef: input.selectedCandidateRef ?? null,
      });

      let correlationState: HubImportedConfirmationCorrelationState = "accepted";
      if (reasonRefs.includes("duplicate_booking_reference_other_case")) {
        correlationState = "disputed";
      } else if (reasonRefs.some((value) => value.endsWith("_mismatch") || value.endsWith("_drift"))) {
        correlationState = "evidence_only";
      } else if (
        current.commitState.appointment !== null &&
        current.commitState.appointment.sourceBookingReference ===
          input.importedEvidence.supplierBookingReference
      ) {
        correlationState = "duplicate";
      }

      let commitResult: HubCommitMutationResult | null = null;
      let exception: HubCoordinationExceptionSnapshot | null = null;
      let exceptionWorkItem: HubExceptionWorkItemSnapshot | null = null;
      let activeAttempt = current.commitState.liveAttempt;

      const shouldSupersedeLiveAttempt =
        input.allowSupersedeLiveAttempt !== false &&
        current.commitState.liveAttempt !== null &&
        current.commitState.liveAttempt.commitMode !== "imported_confirmation" &&
        (
          current.commitState.liveAttempt.attemptState === "reconciliation_required" ||
          current.commitState.liveAttempt.attemptState === "awaiting_confirmation"
        ) &&
        correlationState === "accepted";

      if (correlationState === "accepted") {
        if (shouldSupersedeLiveAttempt && current.commitState.liveAttempt !== null) {
          activeAttempt = await convertAttemptToImportedConfirmation(
            current.commitState.liveAttempt,
            recordedAt,
          );
        }

        if (activeAttempt !== null && activeAttempt.commitMode === "imported_confirmation") {
          commitResult = await options.commitService.ingestImportedConfirmation({
            hubCoordinationCaseId: input.hubCoordinationCaseId,
            commitAttemptId: activeAttempt.commitAttemptId,
            actorRef: input.actorRef,
            routeIntentBindingRef: input.routeIntentBindingRef,
            commandActionRecordRef: input.commandActionRecordRef,
            commandSettlementRecordRef: input.commandSettlementRecordRef,
            recordedAt,
            idempotencyKey: input.idempotencyKey,
            providerAdapterBinding: input.providerAdapterBinding,
            presentedTruthTupleHash: current.truthProjection.truthTupleHash,
            selectedCandidateRef:
              input.selectedCandidateRef ?? current.truthProjection.selectedCandidateRef ?? undefined,
            selectedOfferSessionRef:
              input.selectedOfferSessionRef ?? current.truthProjection.offerSessionRef ?? undefined,
            selectedOfferEntryRef: input.selectedOfferEntryRef ?? undefined,
            sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
            authority: input.authority,
            importedEvidence: input.importedEvidence,
          });
        } else if (current.commitState.appointment === null) {
          commitResult = await options.commitService.ingestImportedConfirmation({
            hubCoordinationCaseId: input.hubCoordinationCaseId,
            actorRef: input.actorRef,
            routeIntentBindingRef: input.routeIntentBindingRef,
            commandActionRecordRef: input.commandActionRecordRef,
            commandSettlementRecordRef: input.commandSettlementRecordRef,
            recordedAt,
            idempotencyKey: input.idempotencyKey,
            providerAdapterBinding: input.providerAdapterBinding,
            presentedTruthTupleHash: current.truthProjection.truthTupleHash,
            selectedCandidateRef:
              input.selectedCandidateRef ?? current.truthProjection.selectedCandidateRef ?? undefined,
            selectedOfferSessionRef:
              input.selectedOfferSessionRef ?? current.truthProjection.offerSessionRef ?? undefined,
            selectedOfferEntryRef: input.selectedOfferEntryRef ?? undefined,
            sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
            authority: input.authority,
            importedEvidence: input.importedEvidence,
          });
        } else {
          correlationState = "duplicate";
        }
      }

      if (correlationState === "disputed" || correlationState === "evidence_only") {
        const opened = await openExceptionWorkInternal({
          hubCoordinationCaseId: input.hubCoordinationCaseId,
          exceptionClass: "imported_confirmation_disputed",
          reasonCode:
            correlationState === "disputed"
              ? "imported_confirmation_disputed"
              : "imported_confirmation_evidence_only",
          truthProjectionRef: currentTruthProjectionRef(current.truthProjection),
          truthTupleHash: current.truthProjection.truthTupleHash,
          recordedAt,
          sourceRefs: input.sourceRefs,
          details: {
            importedEvidenceRef: input.importedEvidence.importedEvidenceRef,
            reasonRefs,
          },
        });
        exception = opened.exception;
        exceptionWorkItem = opened.workItem;
      }

      const correlation: HubImportedConfirmationCorrelationSnapshot = {
        hubImportedConfirmationCorrelationId: nextId(
          idGenerator,
          "hubImportedConfirmationCorrelation",
        ),
        hubCoordinationCaseId: input.hubCoordinationCaseId,
        dedupeKey,
        importedEvidenceRef: input.importedEvidence.importedEvidenceRef,
        supplierCorrelationKey: optionalRef(input.importedEvidence.supplierCorrelationKey),
        supplierBookingReference: input.importedEvidence.supplierBookingReference,
        matchedCommitAttemptRef: current.commitState.liveAttempt?.commitAttemptId ?? null,
        matchedAppointmentRef: current.commitState.appointment?.hubAppointmentId ?? null,
        providerAdapterBindingHash: providerBindingHash,
        truthTupleHash: current.truthProjection.truthTupleHash,
        correlationState,
        resultCommitAttemptRef: commitResult?.commitAttempt.commitAttemptId ?? null,
        resultAppointmentRef: commitResult?.appointment?.hubAppointmentId ?? null,
        reasonRefs,
        recordedAt,
        updatedAt: recordedAt,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.saveImportedConfirmationCorrelation(correlation);

      return {
        correlation,
        commitResult,
        exception,
        exceptionWorkItem,
        replayed: false,
      };
    },

    async resolveReconciliationAttempt(input) {
      const currentLease = await claimActiveLeaseOrThrow(
        input.commitAttemptId,
        input.workerRunRef,
        input.recordedAt,
      );
      const attempt = await requireSnapshot(
        options.commitRepositories.getCommitAttempt(input.commitAttemptId),
        "HUB_COMMIT_ATTEMPT_NOT_FOUND",
        "HubCommitAttempt could not be found.",
      );
      const current = await loadCaseContext(attempt.hubCoordinationCaseId);
      let nextLease = currentLease;
      let correlation: HubImportedConfirmationCorrelationSnapshot | null = null;
      let exception: HubCoordinationExceptionSnapshot | null = null;
      let exceptionWorkItem: HubExceptionWorkItemSnapshot | null = null;

      if (input.resolutionKind === "confirmed_from_imported_evidence") {
        invariant(
          input.importedCorrelation,
          "IMPORTED_CORRELATION_REQUIRED",
          "Imported correlation input is required to confirm reconciliation from imported evidence.",
        );
        const correlationResult = await this.correlateImportedConfirmation({
          hubCoordinationCaseId: attempt.hubCoordinationCaseId,
          allowSupersedeLiveAttempt: true,
          ...input.importedCorrelation,
        });
        correlation = correlationResult.correlation;
        exception = correlationResult.exception;
        exceptionWorkItem = correlationResult.exceptionWorkItem;
        invariant(
          correlation.correlationState === "accepted" && correlationResult.commitResult !== null,
          "RECONCILIATION_CONFIRMATION_FAILED",
          "Imported confirmation could not settle reconciliation to an accepted booking result.",
        );
        nextLease = {
          ...currentLease,
          leaseState: "completed",
          releasedAt: input.recordedAt,
          outcomeState: "resolved",
          outcomeReasonRefs: uniqueSortedRefs([
            ...currentLease.outcomeReasonRefs,
            "confirmed_from_imported_evidence",
          ]),
          resultingCommitAttemptRef: correlation.resultCommitAttemptRef,
          resultingAppointmentRef: correlation.resultAppointmentRef,
          version: nextVersion(currentLease.version),
        };
      } else if (input.resolutionKind === "duplicate_no_truth") {
        await markAttemptTerminal(attempt, input.recordedAt, "failed", [
          "duplicate_supplier_signal_resolved",
        ]);
        nextLease = {
          ...currentLease,
          leaseState: "completed",
          releasedAt: input.recordedAt,
          outcomeState: "resolved",
          outcomeReasonRefs: uniqueSortedRefs([
            ...currentLease.outcomeReasonRefs,
            "duplicate_no_truth",
          ]),
          version: nextVersion(currentLease.version),
        };
      } else if (input.resolutionKind === "manual_dispute") {
        await markAttemptTerminal(attempt, input.recordedAt, "failed", [
          "manual_dispute_required",
        ]);
        const opened = await openExceptionWorkInternal({
          hubCoordinationCaseId: attempt.hubCoordinationCaseId,
          exceptionClass: "imported_confirmation_disputed",
          reasonCode: "reconciliation_manual_dispute",
          truthProjectionRef: currentTruthProjectionRef(current.truthProjection),
          truthTupleHash: current.truthProjection.truthTupleHash,
          recordedAt: input.recordedAt,
          sourceRefs: input.sourceRefs,
          details: {
            commitAttemptId: attempt.commitAttemptId,
          },
        });
        exception = opened.exception;
        exceptionWorkItem = opened.workItem;
        nextLease = {
          ...currentLease,
          leaseState: "completed",
          releasedAt: input.recordedAt,
          outcomeState: "disputed",
          outcomeReasonRefs: uniqueSortedRefs([
            ...currentLease.outcomeReasonRefs,
            "manual_dispute",
          ]),
          version: nextVersion(currentLease.version),
        };
      } else {
        const opened = await openExceptionWorkInternal({
          hubCoordinationCaseId: attempt.hubCoordinationCaseId,
          exceptionClass: "reconciliation_stalled",
          reasonCode: "reconciliation_stalled_retryable",
          truthProjectionRef: currentTruthProjectionRef(current.truthProjection),
          truthTupleHash: current.truthProjection.truthTupleHash,
          recordedAt: input.recordedAt,
          sourceRefs: input.sourceRefs,
          details: {
            commitAttemptId: attempt.commitAttemptId,
          },
        });
        exception = opened.exception;
        exceptionWorkItem = opened.workItem;
        nextLease = {
          ...currentLease,
          leaseState: "completed",
          releasedAt: input.recordedAt,
          outcomeState: "stalled",
          outcomeReasonRefs: uniqueSortedRefs([
            ...currentLease.outcomeReasonRefs,
            "stalled_retryable",
          ]),
          version: nextVersion(currentLease.version),
        };
      }

      await repositories.saveReconciliationWorkLease(nextLease, {
        expectedVersion: currentLease.version,
      });
      return {
        workLease: nextLease,
        correlation,
        resultingCommitState: await options.commitService.queryCurrentCommitState(
          attempt.hubCoordinationCaseId,
        ),
        exception,
        exceptionWorkItem,
      };
    },

    async ingestSupplierMirrorObservation(input) {
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const payloadKey = supplierObservationPayloadKey({
        hubAppointmentId: input.hubAppointmentId,
        payloadId: input.payloadId,
      });
      const replayed =
        (await repositories.findSupplierObservationByPayloadId(payloadKey))?.toSnapshot() ?? null;
      if (replayed) {
        const checkpoint = (
          await repositories.listSupplierMirrorCheckpointsForAppointment(input.hubAppointmentId)
        )
          .map((document) => document.toSnapshot())
          .at(-1);
        invariant(
          checkpoint,
          "HUB_SUPPLIER_MIRROR_CHECKPOINT_NOT_FOUND",
          "HubSupplierMirrorCheckpoint could not be found for a replayed observation.",
        );
        const mirrorState = await requireSnapshot(
          options.commitRepositories.getMirrorStateForAppointment(input.hubAppointmentId),
          "HUB_SUPPLIER_MIRROR_STATE_NOT_FOUND",
          "HubSupplierMirrorState could not be found.",
        );
        return {
          observation: replayed,
          checkpoint,
          mirrorState,
          exception: null,
          exceptionWorkItem: null,
          replayed: true,
        };
      }

      const appointment = await requireSnapshot(
        options.commitRepositories.getAppointmentRecord(input.hubAppointmentId),
        "HUB_APPOINTMENT_NOT_FOUND",
        "HubAppointmentRecord could not be found.",
      );
      let mirrorState =
        (await options.commitRepositories.getMirrorStateForAppointment(input.hubAppointmentId))?.toSnapshot() ??
        null;
      if (mirrorState === null) {
        mirrorState = await options.commitService.startSupplierMirrorMonitoring({
          hubAppointmentId: input.hubAppointmentId,
          supplierSystem: requireRef(input.supplierSystem, "supplierSystem"),
          supplierVersion: requireRef(input.supplierVersion, "supplierVersion"),
          startedAt: recordedAt,
          sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        });
      }

      const freshnessState: HubSupplierObservationFreshnessState =
        compareIso(input.observedAt, mirrorState.lastSyncAt) <= 0 ? "stale" : "current";
      const confidenceBand = input.confidenceBand ?? (input.observedStatus === "booked" ? "medium" : "high");

      let observationDisposition: HubSupplierObservationDisposition;
      let checkpointMirror = mirrorState;
      let continuityRefreshRequired = false;
      let visibilityDebtReopened = false;
      let exception: HubCoordinationExceptionSnapshot | null = null;
      let exceptionWorkItem: HubExceptionWorkItemSnapshot | null = null;

      if (freshnessState === "stale") {
        observationDisposition = "ignored_stale";
      } else if (
        input.observedStatus === "booked" &&
        (mirrorState.manageFreezeState === "frozen" || driftSeverity(mirrorState.driftState) > 0)
      ) {
        observationDisposition = "ignored_weaker";
      } else if (input.observedStatus === "booked") {
        const result = await options.commitService.recordSupplierMirrorObservation({
          hubAppointmentId: input.hubAppointmentId,
          observedAt: input.observedAt,
          observedStatus: input.observedStatus,
          supplierVersion: input.supplierVersion,
          sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        });
        checkpointMirror = result.mirrorState;
        observationDisposition = "aligned";
      } else {
        const result = await options.commitService.recordSupplierMirrorObservation({
          hubAppointmentId: input.hubAppointmentId,
          observedAt: input.observedAt,
          observedStatus: input.observedStatus,
          supplierVersion: input.supplierVersion,
          driftReasonRefs: input.driftReasonRefs,
          sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        });
        checkpointMirror = result.mirrorState;
        observationDisposition = "drift_detected";
        continuityRefreshRequired = true;
        const continuityState =
          await options.practiceContinuityService.queryCurrentPracticeContinuityState(
            appointment.hubCoordinationCaseId,
          );
        const shouldReopenVisibility =
          input.reopenPracticeAcknowledgement !== false &&
          (
            continuityState.currentAcknowledgement?.ackState === "received" ||
            continuityState.currentMessage?.ackState === "pending"
          );
        if (shouldReopenVisibility) {
          await options.practiceContinuityService.reopenPracticeAcknowledgementDebt({
            hubCoordinationCaseId: appointment.hubCoordinationCaseId,
            actorRef: `worker_${input.supplierSystem}`,
            routeIntentBindingRef: `route_${input.supplierSystem}_supplier_drift`,
            commandActionRecordRef: `action_${input.supplierSystem}_supplier_drift`,
            commandSettlementRecordRef: `settlement_${input.supplierSystem}_supplier_drift`,
            recordedAt,
            changeClass: "supplier_drift_detected",
            deltaReason: "truth_changed",
            sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
          });
          visibilityDebtReopened = true;
          const reopenedTruth = await requireSnapshot(
            options.offerRepositories.getTruthProjectionForCase(appointment.hubCoordinationCaseId),
            "HUB_TRUTH_PROJECTION_NOT_FOUND",
            "HubOfferToConfirmationTruthProjection could not be found after reopening acknowledgement debt.",
          );
          const driftTruth = updateTruthProjection(
            reopenedTruth,
            {
              confirmationTruthState: "blocked_by_drift",
              patientVisibilityState: "recovery_required",
              practiceVisibilityState: "recovery_required",
              closureState: "blocked_by_supplier_drift",
              blockingRefs: uniqueSortedRefs([
                ...reopenedTruth.blockingRefs,
                "supplier_drift_detected",
              ]),
            },
            recordedAt,
          );
          await options.offerRepositories.saveTruthProjection(driftTruth, {
            expectedVersion: reopenedTruth.version,
          });
          const reopenedAppointment = await requireSnapshot(
            options.commitRepositories.getAppointmentRecord(input.hubAppointmentId),
            "HUB_APPOINTMENT_NOT_FOUND",
            "HubAppointmentRecord could not be found after reopening acknowledgement debt.",
          );
          await options.commitRepositories.saveAppointmentRecord(
            {
              ...reopenedAppointment,
              truthTupleHash: driftTruth.truthTupleHash,
              version: nextVersion(reopenedAppointment.version),
            },
            {
              expectedVersion: reopenedAppointment.version,
            },
          );
        }
        if (input.refreshPracticeVisibility !== false && options.reminderManageService) {
          const refreshedState =
            await options.practiceContinuityService.queryCurrentPracticeContinuityState(
              appointment.hubCoordinationCaseId,
            );
          const reminderState =
            await options.reminderManageService.queryCurrentReminderManageVisibilityState(
              appointment.hubCoordinationCaseId,
            );
          const visibilityEnvelopeId = defaultVisibilityEnvelopeId({
            continuityState: refreshedState,
            reminderState,
          });
          if (visibilityEnvelopeId) {
            await options.reminderManageService.refreshPracticeVisibilityProjection({
              hubCoordinationCaseId: appointment.hubCoordinationCaseId,
              visibilityEnvelopeId,
              recordedAt,
              sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
            });
          }
        }
        const opened = await openExceptionWorkInternal({
          hubCoordinationCaseId: appointment.hubCoordinationCaseId,
          exceptionClass: "supplier_drift_detected",
          reasonCode: `supplier_status_${input.observedStatus}`,
          truthProjectionRef: null,
          truthTupleHash: checkpointMirror.truthTupleHash,
          recordedAt,
          sourceRefs: input.sourceRefs,
          details: {
            hubAppointmentId: input.hubAppointmentId,
            driftReasonRefs: input.driftReasonRefs ?? [],
          },
        });
        exception = opened.exception;
        exceptionWorkItem = opened.workItem;
      }

      const observation: HubSupplierObservationSnapshot = {
        hubSupplierObservationId: nextId(idGenerator, "hubSupplierObservation"),
        hubCoordinationCaseId: appointment.hubCoordinationCaseId,
        hubAppointmentId: input.hubAppointmentId,
        payloadId: payloadKey,
        supplierVersion: requireRef(input.supplierVersion, "supplierVersion"),
        observedStatus: input.observedStatus,
        freshnessState,
        observationDisposition,
        confidenceBand,
        previousMirrorRevision: mirrorState.monotoneRevision,
        observedAt: ensureIsoTimestamp(input.observedAt, "observedAt"),
        recordedAt,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.appendSupplierObservation(observation);

      const checkpoint: HubSupplierMirrorCheckpointSnapshot = {
        hubSupplierMirrorCheckpointId: nextId(idGenerator, "hubSupplierMirrorCheckpoint"),
        hubCoordinationCaseId: appointment.hubCoordinationCaseId,
        hubAppointmentId: input.hubAppointmentId,
        hubSupplierMirrorStateId: checkpointMirror.hubSupplierMirrorStateId,
        supplierObservationRef: observation.hubSupplierObservationId,
        driftState: checkpointMirror.driftState,
        manageFreezeState: checkpointMirror.manageFreezeState,
        truthTupleHash: checkpointMirror.truthTupleHash,
        continuityRefreshRequired,
        visibilityDebtReopened,
        recordedAt,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.saveSupplierMirrorCheckpoint(checkpoint);

      return {
        observation,
        checkpoint,
        mirrorState: checkpointMirror,
        exception,
        exceptionWorkItem,
        replayed: false,
      };
    },

    async openExceptionWork(input) {
      return openExceptionWorkInternal(input);
    },

    async claimExceptionWork(input) {
      const exception = await requireSnapshot(
        options.fallbackRepositories.getHubCoordinationException(input.exceptionId),
        "HUB_COORDINATION_EXCEPTION_NOT_FOUND",
        "HubCoordinationException could not be found.",
      );
      const workItem = await requireSnapshot(
        repositories.getExceptionWorkItemForException(input.exceptionId),
        "HUB_EXCEPTION_WORK_ITEM_NOT_FOUND",
        "HubExceptionWorkItem could not be found.",
      );
      const claimedAt = ensureIsoTimestamp(input.claimedAt, "claimedAt");
      const leaseMinutes = ensurePositiveInteger(input.leaseMinutes ?? 15, "leaseMinutes");

      if (
        workItem.leaseState === "active" &&
        workItem.leaseExpiresAt !== null &&
        compareIso(workItem.leaseExpiresAt, claimedAt) > 0
      ) {
        if (workItem.workerRunRef === input.workerRunRef) {
          return {
            exception,
            workItem,
            replayed: true,
            blockedByActiveLease: false,
          };
        }
        return {
          exception,
          workItem,
          replayed: false,
          blockedByActiveLease: true,
        };
      }

      let currentWorkItem = workItem;
      if (workItem.leaseState === "active" && workItem.leaseExpiresAt !== null) {
        currentWorkItem = {
          ...workItem,
          leaseState: "expired",
          workState: workItem.workState === "claimed" ? "retry_scheduled" : workItem.workState,
          updatedAt: claimedAt,
          version: nextVersion(workItem.version),
        };
        await repositories.saveExceptionWorkItem(currentWorkItem, {
          expectedVersion: workItem.version,
        });
        await saveExceptionAuditRow({
          workItem: currentWorkItem,
          actionKind: "expired_lease",
          reasonCode: "lease_expired_before_reclaim",
          recordedAt: claimedAt,
          sourceRefs: input.sourceRefs,
        });
        await openExceptionWorkInternal({
          hubCoordinationCaseId: workItem.hubCoordinationCaseId,
          exceptionClass: "stale_owner_or_stale_lease",
          reasonCode: "exception_lease_expired",
          truthProjectionRef: null,
          truthTupleHash: exception.truthTupleHash,
          recordedAt: claimedAt,
          sourceRefs: input.sourceRefs,
          details: {
            exceptionId: input.exceptionId,
            priorWorkerRunRef: workItem.workerRunRef,
          },
        });
      }

      const claimedWorkItem: HubExceptionWorkItemSnapshot = {
        ...currentWorkItem,
        workState: "claimed",
        workerRef: requireRef(input.workerRef, "workerRef"),
        workerRunRef: requireRef(input.workerRunRef, "workerRunRef"),
        leaseFenceToken: nextId(idGenerator, "hubExceptionLeaseFence"),
        leaseState: "active",
        leaseExpiresAt: addMinutes(claimedAt, leaseMinutes),
        updatedAt: claimedAt,
        version: nextVersion(currentWorkItem.version),
      };
      await repositories.saveExceptionWorkItem(claimedWorkItem, {
        expectedVersion: currentWorkItem.version,
      });
      const auditRow = await saveExceptionAuditRow({
        workItem: claimedWorkItem,
        actionKind: "claimed",
        reasonCode: "claimed_for_processing",
        recordedAt: claimedAt,
        sourceRefs: input.sourceRefs,
      });
      const auditedWorkItem: HubExceptionWorkItemSnapshot = {
        ...claimedWorkItem,
        lastAuditRowRef: auditRow.hubExceptionAuditRowId,
        version: nextVersion(claimedWorkItem.version),
      };
      await repositories.saveExceptionWorkItem(auditedWorkItem, {
        expectedVersion: claimedWorkItem.version,
      });
      return {
        exception,
        workItem: auditedWorkItem,
        replayed: false,
        blockedByActiveLease: false,
      };
    },

    async processExceptionWork(input) {
      const exception = await requireSnapshot(
        options.fallbackRepositories.getHubCoordinationException(input.exceptionId),
        "HUB_COORDINATION_EXCEPTION_NOT_FOUND",
        "HubCoordinationException could not be found.",
      );
      const workItem = await requireSnapshot(
        repositories.getExceptionWorkItemForException(input.exceptionId),
        "HUB_EXCEPTION_WORK_ITEM_NOT_FOUND",
        "HubExceptionWorkItem could not be found.",
      );
      invariant(
        workItem.leaseState === "active" &&
          workItem.workerRunRef === input.workerRunRef &&
          workItem.workerRef === input.workerRef &&
          workItem.leaseExpiresAt !== null &&
          compareIso(workItem.leaseExpiresAt, input.recordedAt) > 0,
        "HUB_EXCEPTION_STALE_OWNER",
        "HubExceptionWorkItem must be claimed by the current worker before it can be processed.",
      );

      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      let nextException = exception;
      let nextWorkItem: HubExceptionWorkItemSnapshot;
      let actionKind: HubExceptionAuditActionKind;
      switch (input.action) {
        case "retry":
          nextException = await patchException(exception, {
            retryState: "retryable",
            updatedAt: recordedAt,
          });
          nextWorkItem = {
            ...workItem,
            workState: "retry_scheduled",
            retryCount: workItem.retryCount + 1,
            retryAfterAt: addMinutes(recordedAt, input.retryAfterMinutes ?? 15),
            leaseState: "idle",
            leaseExpiresAt: null,
            updatedAt: recordedAt,
            version: nextVersion(workItem.version),
          };
          actionKind = "retried";
          break;
        case "escalate":
          nextException = await patchException(exception, {
            escalationState: "supervisor_review_required",
            updatedAt: recordedAt,
          });
          nextWorkItem = {
            ...workItem,
            workState: "escalated",
            nextEscalationAt: null,
            leaseState: "idle",
            leaseExpiresAt: null,
            updatedAt: recordedAt,
            version: nextVersion(workItem.version),
          };
          actionKind = "escalated";
          break;
        case "suppress":
          nextException = await options.fallbackService.resolveHubCoordinationException(
            exception.exceptionId,
            recordedAt,
          );
          nextWorkItem = {
            ...workItem,
            workState: "suppressed",
            resolvedAt: recordedAt,
            leaseState: "idle",
            leaseExpiresAt: null,
            updatedAt: recordedAt,
            version: nextVersion(workItem.version),
          };
          actionKind = "suppressed";
          break;
        case "resolve":
          nextException = await options.fallbackService.resolveHubCoordinationException(
            exception.exceptionId,
            recordedAt,
          );
          nextWorkItem = {
            ...workItem,
            workState: "resolved",
            resolvedAt: recordedAt,
            leaseState: "idle",
            leaseExpiresAt: null,
            updatedAt: recordedAt,
            version: nextVersion(workItem.version),
          };
          actionKind = "resolved";
          break;
      }
      await repositories.saveExceptionWorkItem(nextWorkItem, {
        expectedVersion: workItem.version,
      });
      const auditRow = await saveExceptionAuditRow({
        workItem: nextWorkItem,
        actionKind,
        reasonCode: input.reasonCode,
        recordedAt,
        details: input.details,
        sourceRefs: input.sourceRefs,
      });
      const auditedWorkItem: HubExceptionWorkItemSnapshot = {
        ...nextWorkItem,
        lastAuditRowRef: auditRow.hubExceptionAuditRowId,
        version: nextVersion(nextWorkItem.version),
      };
      await repositories.saveExceptionWorkItem(auditedWorkItem, {
        expectedVersion: nextWorkItem.version,
      });
      return {
        exception: nextException,
        workItem: auditedWorkItem,
        auditRow,
      };
    },

    async runProjectionBackfill(input) {
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const current = await loadCaseContext(input.hubCoordinationCaseId);
      const durableAppointment =
        current.commitState.appointment ??
        (await options.commitRepositories.listAppointmentsForCase(input.hubCoordinationCaseId))
          .map((document) => document.toSnapshot())
          .at(-1) ??
        null;
      const durableMirrorState =
        durableAppointment === null
          ? current.commitState.mirrorState
          : current.commitState.mirrorState ??
            (
              await options.commitRepositories.getMirrorStateForAppointment(
                durableAppointment.hubAppointmentId,
              )
            )?.toSnapshot() ??
            null;
      const allLiveAttempts = (await options.commitRepositories.listCommitAttemptsForCase(
        input.hubCoordinationCaseId,
      ))
        .map((document) => document.toSnapshot())
        .filter((attempt) => liveAttemptStates(attempt.attemptState));
      const ambiguityReasonRefs = uniqueSortedRefs([
        ...(allLiveAttempts.length > 1 ? ["multiple_live_commit_attempts"] : []),
        ...appointmentTupleConflicts(durableAppointment, current.truthProjection),
        ...continuityTupleConflicts(current.continuityState, current.truthProjection),
        ...reminderTupleConflicts(current.reminderState, current.truthProjection),
        ...(
          current.fallbackRecord !== null &&
          current.truthProjection.fallbackRef !== null &&
          current.truthProjection.fallbackRef !== current.fallbackRecord.hubFallbackRecordId
            ? ["fallback_ref_conflict"]
            : []
        ),
      ]);

      let truthProjection = current.truthProjection;
      let exception: HubCoordinationExceptionSnapshot | null = null;
      let exceptionWorkItem: HubExceptionWorkItemSnapshot | null = null;
      let verdict: HubBackfillVerdict = "no_change";

      if (ambiguityReasonRefs.length > 0) {
        truthProjection = updateTruthProjection(
          current.truthProjection,
          {
            confirmationTruthState: "disputed",
            patientVisibilityState: "recovery_required",
            practiceVisibilityState: "recovery_required",
            closureState: "blocked_by_confirmation",
            blockingRefs: uniqueSortedRefs([
              ...current.truthProjection.blockingRefs,
              ...ambiguityReasonRefs,
            ]),
          },
          recordedAt,
        );
        if (truthProjection.truthTupleHash !== current.truthProjection.truthTupleHash) {
          await options.offerRepositories.saveTruthProjection(truthProjection, {
            expectedVersion: current.truthProjection.version,
          });
        }
        verdict = "ambiguous";
        const opened = await openExceptionWorkInternal({
          hubCoordinationCaseId: input.hubCoordinationCaseId,
          exceptionClass: "backfill_ambiguity_supervision",
          reasonCode: "projection_backfill_ambiguity",
          truthProjectionRef: currentTruthProjectionRef(truthProjection),
          truthTupleHash: truthProjection.truthTupleHash,
          recordedAt,
          sourceRefs: input.sourceRefs,
          details: {
            ambiguityReasonRefs,
          },
        });
        exception = opened.exception;
        exceptionWorkItem = opened.workItem;
      } else {
        const nextBlockingRefs = uniqueSortedRefs([
          ...current.truthProjection.blockingRefs.filter((value) => value !== "supplier_drift_detected"),
          ...(isSevereMirrorState(durableMirrorState) ? ["supplier_drift_detected"] : []),
        ]);
        const nextTruthProjection = updateTruthProjection(
          current.truthProjection,
          {
            commitAttemptRef:
              current.commitState.liveAttempt?.commitAttemptId ?? current.truthProjection.commitAttemptRef,
            bookingEvidenceRef:
              current.commitState.liveAttempt?.primaryEvidenceBundleRef ??
              current.truthProjection.bookingEvidenceRef,
            hubAppointmentId:
              durableAppointment?.hubAppointmentId ?? current.truthProjection.hubAppointmentId,
            practiceAcknowledgementRef:
              current.continuityState.currentAcknowledgement?.acknowledgementId ??
              current.truthProjection.practiceAcknowledgementRef,
            fallbackRef:
              current.fallbackRecord?.hubFallbackRecordId ?? current.truthProjection.fallbackRef,
            experienceContinuityEvidenceRef:
              current.commitState.latestContinuityProjection?.hubContinuityEvidenceProjectionId ??
              current.truthProjection.experienceContinuityEvidenceRef,
            blockingRefs: nextBlockingRefs,
            confirmationTruthState:
              isSevereMirrorState(durableMirrorState)
                ? "blocked_by_drift"
                : current.truthProjection.confirmationTruthState,
            patientVisibilityState:
              isSevereMirrorState(durableMirrorState)
                ? "recovery_required"
                : current.truthProjection.patientVisibilityState,
            practiceVisibilityState:
              isSevereMirrorState(durableMirrorState)
                ? "recovery_required"
                : current.truthProjection.practiceVisibilityState,
            closureState:
              isSevereMirrorState(durableMirrorState)
                ? "blocked_by_supplier_drift"
                : current.truthProjection.closureState,
          },
          recordedAt,
        );
        if (stableStringify(nextTruthProjection) !== stableStringify(current.truthProjection)) {
          await options.offerRepositories.saveTruthProjection(nextTruthProjection, {
            expectedVersion: current.truthProjection.version,
          });
          truthProjection = nextTruthProjection;
          verdict = "repaired";
        }

        const currentMessage = current.continuityState.currentMessage;
        if (
          currentMessage !== null &&
          currentMessage.ackState !== "acknowledged" &&
          compareIso(currentMessage.ackDueAt, recordedAt) < 0
        ) {
          const opened = await openExceptionWorkInternal({
            hubCoordinationCaseId: input.hubCoordinationCaseId,
            exceptionClass: "practice_acknowledgement_overdue",
            reasonCode: "practice_acknowledgement_overdue",
            truthProjectionRef: currentTruthProjectionRef(truthProjection),
            truthTupleHash: truthProjection.truthTupleHash,
            recordedAt,
            sourceRefs: input.sourceRefs,
            details: {
              ackDueAt: currentMessage.ackDueAt,
            },
          });
          exception = opened.exception;
          exceptionWorkItem = opened.workItem;
        }
      }

      const priorCursor =
        (await repositories.getBackfillCursorForCase(input.hubCoordinationCaseId))?.toSnapshot() ?? null;
      const cursor: HubProjectionBackfillCursorSnapshot = {
        hubProjectionBackfillCursorId:
          priorCursor?.hubProjectionBackfillCursorId ??
          nextId(idGenerator, "hubProjectionBackfillCursor"),
        hubCoordinationCaseId: input.hubCoordinationCaseId,
        cursorState:
          verdict === "ambiguous"
            ? "ambiguous"
            : verdict === "repaired"
              ? "repair_required"
              : "processed",
        lastVerdict: verdict,
        lastTruthTupleHash: truthProjection.truthTupleHash,
        lastProjectionRef: currentTruthProjectionRef(truthProjection),
        ambiguityReasonRefs,
        workerRef: requireRef(input.workerRef, "workerRef"),
        workerRunRef: requireRef(input.workerRunRef, "workerRunRef"),
        leaseFenceToken: nextId(idGenerator, "hubBackfillLeaseFence"),
        processedAt: recordedAt,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version: priorCursor ? nextVersion(priorCursor.version) : 1,
      };
      await repositories.saveBackfillCursor(cursor, priorCursor ? { expectedVersion: priorCursor.version } : undefined);

      return {
        cursor,
        truthProjection,
        exception,
        exceptionWorkItem,
      };
    },

    async queryCurrentIntegrityState(hubCoordinationCaseId) {
      const context = await loadCaseContext(hubCoordinationCaseId);
      const currentWorkLease =
        context.commitState.liveAttempt === null
          ? null
          : ((await repositories.getReconciliationWorkLeaseForAttempt(
              context.commitState.liveAttempt.commitAttemptId,
            ))?.toSnapshot() ?? null);
      const latestImportedCorrelation = (
        await repositories.listImportedConfirmationCorrelationsForCase(hubCoordinationCaseId)
      )
        .map((document) => document.toSnapshot())
        .at(-1) ?? null;
      const latestSupplierObservation =
        context.commitState.appointment === null
          ? null
          : (
              await repositories.listSupplierObservationsForAppointment(
                context.commitState.appointment.hubAppointmentId,
              )
            )
              .map((document) => document.toSnapshot())
              .at(-1) ?? null;
      const latestMirrorCheckpoint =
        context.commitState.appointment === null
          ? null
          : (
              await repositories.listSupplierMirrorCheckpointsForAppointment(
                context.commitState.appointment.hubAppointmentId,
              )
            )
              .map((document) => document.toSnapshot())
              .at(-1) ?? null;
      const exceptionBacklog = (await repositories.listExceptionWorkItemsForCase(hubCoordinationCaseId))
        .map((document) => document.toSnapshot())
        .filter((item) => item.workState !== "resolved" && item.workState !== "suppressed");
      const latestBackfillCursor =
        (await repositories.getBackfillCursorForCase(hubCoordinationCaseId))?.toSnapshot() ?? null;
      return {
        currentWorkLease,
        latestImportedCorrelation,
        latestSupplierObservation,
        latestMirrorCheckpoint,
        exceptionBacklog,
        latestBackfillCursor,
        commitState: context.commitState,
        continuityState: context.continuityState,
        reminderState: context.reminderState,
      };
    },
  };
}
