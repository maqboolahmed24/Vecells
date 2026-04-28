import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  createReservationConfirmationAuthorityService,
  createReservationConfirmationStore,
  defaultReservationConfirmationThresholdPolicy,
  type CapacityReservationSnapshot,
  type ConfirmationEvidenceAtom,
  type ExternalConfirmationGateSnapshot,
  type ReservationConfirmationDependencies,
} from "../../identity_access/src/index";

import type {
  HubCommandAuthorityDecision,
  HubCommandAuthorityInput,
  Phase5ActingScopeVisibilityService,
} from "./phase5-acting-context-visibility-kernel";
import type {
  NetworkPolicyEvaluationResult,
  Phase5EnhancedAccessPolicyService,
  PolicyEvaluationFactsSnapshot,
} from "./phase5-enhanced-access-policy-engine";
import type {
  HubCaseBundle,
  HubCaseTransitionCommandInput,
  HubCaseTransitionResult,
  HubCoordinationCaseSnapshot,
  Phase5HubCaseKernelService,
} from "./phase5-hub-case-kernel";
import type {
  AlternativeOfferSessionSnapshot,
  HubOfferToConfirmationTruthProjectionSnapshot,
  OfferProjectionSelectionSource,
  Phase5AlternativeOfferEngineRepositories,
} from "./phase5-alternative-offer-engine";
import type {
  HubCapacityAdapterBindingSnapshot,
  NetworkCandidateSnapshot,
  NetworkSlotCandidateSnapshot,
  Phase5NetworkCapacityPipelineRepositories,
} from "./phase5-network-capacity-pipeline";

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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function driftSeverity(state: HubSupplierMirrorDriftState): number {
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

function addMinutes(timestamp: string, minutes: number): string {
  const date = new Date(timestamp);
  date.setTime(date.getTime() + minutes * 60_000);
  return date.toISOString();
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

const DEFAULT_SOURCE_REFS = [
  "blueprint/phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging",
  "blueprint/phase-0-the-foundation-protocol.md#1.14 CapacityReservation",
  "blueprint/phase-0-the-foundation-protocol.md#1.15 ExternalConfirmationGate",
  "blueprint/phase-0-the-foundation-protocol.md#10.7 Booking commit algorithm",
  "blueprint/phase-0-the-foundation-protocol.md#10.8 Hub booking and manual degraded mode",
  "blueprint/phase-cards.md#Card-6",
  "docs/api/313_phase5_commit_and_practice_visibility_api_contract.md",
  "docs/architecture/320_alternative_offer_optimisation_and_secure_choice_backend.md",
].sort();

export const phase5HubCommitModes = [
  "native_api",
  "manual_pending_confirmation",
  "imported_confirmation",
] as const;
export type Phase5HubCommitMode = (typeof phase5HubCommitModes)[number];

export const hubCommitActionScopes = [
  "commit_native_booking",
  "record_manual_confirmation",
  "import_supplier_confirmation",
] as const;
export type HubCommitActionScope = (typeof hubCommitActionScopes)[number];

export const hubCommitAttemptStates = [
  "draft",
  "executing",
  "awaiting_confirmation",
  "reconciliation_required",
  "disputed",
  "confirmed",
  "failed",
  "superseded",
] as const;
export type HubCommitAttemptState = (typeof hubCommitAttemptStates)[number];

export const hubCommitJournalStates = [
  "prepared",
  "intent_written",
  "external_dispatch_recorded",
  "settled",
] as const;
export type HubCommitJournalState = (typeof hubCommitJournalStates)[number];

export const hubCommitExternalResponseStates = [
  "not_started",
  "manual_recorded",
  "imported_received",
  "accepted_pending",
  "authoritative_confirmed",
  "timeout_unknown",
  "rejected",
  "reconciliation_required",
  "drift_blocked",
] as const;
export type HubCommitExternalResponseState =
  (typeof hubCommitExternalResponseStates)[number];

export const hubCommitSettlementResults = [
  "pending_confirmation",
  "booked_pending_ack",
  "stale_candidate",
  "reconciliation_required",
  "imported_disputed",
  "confirmation_disputed",
  "confirmation_expired",
  "denied_scope",
] as const;
export type HubCommitSettlementResultState =
  (typeof hubCommitSettlementResults)[number];

export const hubCommitConfidenceBands = ["high", "medium", "low"] as const;
export type HubCommitConfidenceBand = (typeof hubCommitConfidenceBands)[number];

export const hubConfirmationHardMatchResults = [
  "pending",
  "passed",
  "failed",
] as const;
export type HubConfirmationHardMatchResult =
  (typeof hubConfirmationHardMatchResults)[number];

export const hubAppointmentStates = [
  "pending_confirmation",
  "confirmed_pending_practice_ack",
  "confirmed",
  "disputed",
  "cancelled",
] as const;
export type HubAppointmentState = (typeof hubAppointmentStates)[number];

export const hubPracticeAcknowledgementStates = [
  "not_required",
  "ack_pending",
  "acknowledged",
  "exception_recorded",
  "superseded",
] as const;
export type HubPracticeAcknowledgementState =
  (typeof hubPracticeAcknowledgementStates)[number];

export const hubContinuityValidationStates = [
  "trusted",
  "degraded",
  "stale",
  "blocked",
] as const;
export type HubContinuityValidationState =
  (typeof hubContinuityValidationStates)[number];

export const hubSupplierMirrorDriftStates = [
  "aligned",
  "pending_review",
  "drift_detected",
  "disputed",
  "reconciled",
] as const;
export type HubSupplierMirrorDriftState =
  (typeof hubSupplierMirrorDriftStates)[number];

export const hubSupplierMirrorFreezeStates = ["live", "frozen"] as const;
export type HubSupplierMirrorFreezeState =
  (typeof hubSupplierMirrorFreezeStates)[number];

export const hubSupplierObservedStatuses = [
  "booked",
  "rescheduled",
  "cancelled",
  "unknown",
] as const;
export type HubSupplierObservedStatus =
  (typeof hubSupplierObservedStatuses)[number];

export const hubCommitReconciliationStates = [
  "pending_review",
  "resolved",
  "cancelled",
] as const;
export type HubCommitReconciliationState =
  (typeof hubCommitReconciliationStates)[number];

export const hubCommitReconciliationClasses = [
  "external_timeout_unknown",
  "local_write_failed_after_external_success",
  "duplicate_supplier_signal",
  "provider_response_conflict",
] as const;
export type HubCommitReconciliationClass =
  (typeof hubCommitReconciliationClasses)[number];

export const hubSupplierDriftHookStates = [
  "open",
  "consumed",
  "superseded",
] as const;
export type HubSupplierDriftHookState = (typeof hubSupplierDriftHookStates)[number];

export interface HubActionRecordSnapshot {
  hubActionRecordId: string;
  hubCoordinationCaseId: string;
  actionScope: HubCommitActionScope;
  governingObjectRef: string;
  caseVersionRef: string;
  reservationFenceToken: string;
  actingContextRef: string | null;
  compiledPolicyBundleRef: string | null;
  enhancedAccessPolicyRef: string | null;
  policyEvaluationRef: string | null;
  policyTupleHash: string;
  lineageFenceEpoch: number;
  idempotencyKey: string;
  createdByRef: string;
  createdAt: string;
  settledAt: string | null;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubCommitAttemptSnapshot {
  commitAttemptId: string;
  hubCoordinationCaseId: string;
  commitMode: Phase5HubCommitMode;
  selectedCandidateRef: string;
  selectedOfferSessionRef: string | null;
  selectedOfferEntryRef: string | null;
  capacityUnitRef: string;
  reservationRef: string;
  reservationTruthProjectionRef: string | null;
  reservationFenceToken: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  providerSourceVersion: string;
  truthTupleHash: string;
  policyTupleHash: string;
  lineageFenceEpoch: number;
  idempotencyKey: string;
  attemptState: HubCommitAttemptState;
  journalState: HubCommitJournalState;
  externalResponseState: HubCommitExternalResponseState;
  externalBookingRef: string | null;
  adapterCorrelationKey: string | null;
  confirmationGateRef: string | null;
  primaryEvidenceBundleRef: string;
  confirmationConfidence: number;
  competingAttemptMargin: number;
  continuityEvidenceProjectionRef: string | null;
  blockingReasonRefs: readonly string[];
  commandActionRef: string;
  commandSettlementRef: string;
  routeIntentBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string | null;
  routeFamilyRef: string;
  routeContinuityEvidenceContractRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  transitionEnvelopeRef: string;
  continuityEnvelopeVersionRef: string;
  experienceContinuityEvidenceRef: string;
  confirmationDeadlineAt: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubManualBookingEvidenceSnapshot {
  hubSiteRef: string;
  dateAt: string;
  timeAt: string;
  modality: string;
  clinicianRef: string | null;
  clinicianType: string;
  nativeBookingReference: string | null;
  operatorIdentityRef: string;
  confirmationSource: string;
  independentConfirmationMethod: string;
  confirmationDueAt: string;
  evidenceSourceFamilies: readonly string[];
}

export interface HubImportedConfirmationEvidenceSnapshot {
  importedEvidenceRef: string;
  sourceVersion: string;
  supplierBookingReference: string;
  supplierAppointmentRef: string | null;
  supplierCorrelationKey: string | null;
  matchedWindowMinutes: number;
  evidenceSourceFamilies: readonly string[];
}

export interface HubBookingEvidenceBundleSnapshot {
  evidenceBundleId: string;
  hubCoordinationCaseId: string;
  commitAttemptId: string;
  commitMode: Phase5HubCommitMode;
  independentConfirmationState: "none" | "pending" | "disputed" | "confirmed";
  confirmationConfidence: number;
  competingAttemptMargin: number;
  importedEvidenceRef: string | null;
  nativeBookingReceiptRef: string | null;
  hardMatchResult: HubConfirmationHardMatchResult;
  evidenceCapturedAt: string;
  truthTupleHash: string;
  evidenceSourceFamilies: readonly string[];
  hardMatchRefsPassed: readonly string[];
  hardMatchRefsFailed: readonly string[];
  contradictoryEvidenceRefs: readonly string[];
  providerBookingReference: string | null;
  supplierAppointmentRef: string | null;
  manualEvidence: HubManualBookingEvidenceSnapshot | null;
  importedEvidence: HubImportedConfirmationEvidenceSnapshot | null;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubAppointmentRecordSnapshot {
  hubAppointmentId: string;
  hubCoordinationCaseId: string;
  commitAttemptId: string;
  sourceBookingReference: string;
  supplierAppointmentRef: string | null;
  patientFacingReference: string;
  appointmentVersionRef: string;
  appointmentState: HubAppointmentState;
  externalConfirmationState: "none" | "pending" | "disputed" | "confirmed";
  practiceAcknowledgementState: HubPracticeAcknowledgementState;
  manageCapabilitiesRef: string | null;
  truthTupleHash: string;
  selectedCandidateRef: string;
  capacityUnitRef: string;
  providerAdapterBindingHash: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubCommitSettlementSnapshot {
  hubCommitSettlementId: string;
  hubCoordinationCaseId: string;
  hubActionRecordRef: string;
  commitAttemptRef: string;
  result: HubCommitSettlementResultState;
  experienceContinuityEvidenceRef: string | null;
  causalToken: string;
  transitionEnvelopeRef: string | null;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string | null;
  stateConfidenceBand: HubCommitConfidenceBand;
  recoveryRouteRef: string | null;
  presentationArtifactRef: string | null;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubContinuityEvidenceProjectionSnapshot {
  hubContinuityEvidenceProjectionId: string;
  hubCoordinationCaseId: string;
  controlCode: "hub_booking_manage";
  routeFamilyRef: string;
  routeContinuityEvidenceContractRef: string;
  governingObjectRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  continuityEnvelopeVersionRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  latestSettlementRef: string | null;
  latestContinuationRef: string | null;
  experienceContinuityEvidenceRef: string | null;
  continuityTupleHash: string;
  validationState: HubContinuityValidationState;
  blockingRefs: readonly string[];
  causalToken: string;
  monotoneRevision: number;
  capturedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubCommitReconciliationRecordSnapshot {
  hubCommitReconciliationRecordId: string;
  hubCoordinationCaseId: string;
  commitAttemptId: string;
  idempotencyKey: string;
  reconciliationClass: HubCommitReconciliationClass;
  reasonCode: string;
  state: HubCommitReconciliationState;
  providerCorrelationRef: string | null;
  externalBookingRef: string | null;
  latestReceiptCheckpointRef: string | null;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubSupplierMirrorStateSnapshot {
  hubSupplierMirrorStateId: string;
  hubCoordinationCaseId: string;
  hubAppointmentId: string;
  supplierSystem: string;
  supplierVersion: string;
  lastSyncAt: string;
  nextSyncDueAt: string;
  driftState: HubSupplierMirrorDriftState;
  manageFreezeState: HubSupplierMirrorFreezeState;
  lastObservedStatus: HubSupplierObservedStatus;
  latestContinuityMessageRef: string | null;
  latestDriftHookRef: string | null;
  transitionEnvelopeRef: string | null;
  stateConfidenceBand: HubCommitConfidenceBand;
  causalToken: string;
  monotoneRevision: number;
  reopenTaskRef: string | null;
  truthTupleHash: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubSupplierDriftHookSnapshot {
  hubSupplierDriftHookId: string;
  hubCoordinationCaseId: string;
  hubAppointmentId: string;
  hubSupplierMirrorStateId: string;
  truthTupleHash: string;
  driftReasonRefs: readonly string[];
  manageFreezeState: HubSupplierMirrorFreezeState;
  hookState: HubSupplierDriftHookState;
  recordedAt: string;
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

export interface Phase5HubCommitEngineRepositories {
  getActionRecord(
    hubActionRecordId: string,
  ): Promise<SnapshotDocument<HubActionRecordSnapshot> | null>;
  saveActionRecord(
    snapshot: HubActionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCommitAttempt(
    commitAttemptId: string,
  ): Promise<SnapshotDocument<HubCommitAttemptSnapshot> | null>;
  saveCommitAttempt(
    snapshot: HubCommitAttemptSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listCommitAttemptsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<HubCommitAttemptSnapshot>[]>;
  findCommitAttemptByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<SnapshotDocument<HubCommitAttemptSnapshot> | null>;
  getEvidenceBundle(
    evidenceBundleId: string,
  ): Promise<SnapshotDocument<HubBookingEvidenceBundleSnapshot> | null>;
  saveEvidenceBundle(
    snapshot: HubBookingEvidenceBundleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listEvidenceBundlesForAttempt(
    commitAttemptId: string,
  ): Promise<readonly SnapshotDocument<HubBookingEvidenceBundleSnapshot>[]>;
  getAppointmentRecord(
    hubAppointmentId: string,
  ): Promise<SnapshotDocument<HubAppointmentRecordSnapshot> | null>;
  saveAppointmentRecord(
    snapshot: HubAppointmentRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAppointmentsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<HubAppointmentRecordSnapshot>[]>;
  findAppointmentBySourceBookingReference(
    sourceBookingReference: string,
  ): Promise<SnapshotDocument<HubAppointmentRecordSnapshot> | null>;
  getSettlement(
    hubCommitSettlementId: string,
  ): Promise<SnapshotDocument<HubCommitSettlementSnapshot> | null>;
  saveSettlement(
    snapshot: HubCommitSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSettlementsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<HubCommitSettlementSnapshot>[]>;
  getContinuityProjectionForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<HubContinuityEvidenceProjectionSnapshot> | null>;
  saveContinuityProjection(
    snapshot: HubContinuityEvidenceProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  appendReconciliationRecord(
    snapshot: HubCommitReconciliationRecordSnapshot,
  ): Promise<void>;
  listReconciliationRecordsForAttempt(
    commitAttemptId: string,
  ): Promise<readonly SnapshotDocument<HubCommitReconciliationRecordSnapshot>[]>;
  getMirrorStateForAppointment(
    hubAppointmentId: string,
  ): Promise<SnapshotDocument<HubSupplierMirrorStateSnapshot> | null>;
  saveMirrorState(
    snapshot: HubSupplierMirrorStateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  appendSupplierDriftHook(snapshot: HubSupplierDriftHookSnapshot): Promise<void>;
  listSupplierDriftHooksForMirror(
    hubSupplierMirrorStateId: string,
  ): Promise<readonly SnapshotDocument<HubSupplierDriftHookSnapshot>[]>;
}

export class Phase5HubCommitEngineStore
  implements Phase5HubCommitEngineRepositories
{
  private readonly actionRecords = new Map<string, HubActionRecordSnapshot>();
  private readonly attempts = new Map<string, HubCommitAttemptSnapshot>();
  private readonly caseAttempts = new Map<string, string[]>();
  private readonly attemptsByIdempotency = new Map<string, string>();
  private readonly evidenceBundles = new Map<string, HubBookingEvidenceBundleSnapshot>();
  private readonly evidenceByAttempt = new Map<string, string[]>();
  private readonly appointments = new Map<string, HubAppointmentRecordSnapshot>();
  private readonly appointmentsByCase = new Map<string, string[]>();
  private readonly appointmentByBookingReference = new Map<string, string>();
  private readonly settlements = new Map<string, HubCommitSettlementSnapshot>();
  private readonly settlementsByCase = new Map<string, string[]>();
  private readonly continuityByCase = new Map<string, HubContinuityEvidenceProjectionSnapshot>();
  private readonly reconciliationByAttempt = new Map<string, HubCommitReconciliationRecordSnapshot[]>();
  private readonly mirrorByAppointment = new Map<string, HubSupplierMirrorStateSnapshot>();
  private readonly driftHooksByMirror = new Map<string, HubSupplierDriftHookSnapshot[]>();

  async getActionRecord(hubActionRecordId: string) {
    const row = this.actionRecords.get(hubActionRecordId);
    return row ? new StoredDocument(row) : null;
  }

  async saveActionRecord(
    snapshot: HubActionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.actionRecords, snapshot.hubActionRecordId, snapshot, options);
  }

  async getCommitAttempt(commitAttemptId: string) {
    const row = this.attempts.get(commitAttemptId);
    return row ? new StoredDocument(row) : null;
  }

  async saveCommitAttempt(
    snapshot: HubCommitAttemptSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.attempts, snapshot.commitAttemptId, snapshot, options);
    const current = this.caseAttempts.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.commitAttemptId)) {
      this.caseAttempts.set(snapshot.hubCoordinationCaseId, [...current, snapshot.commitAttemptId]);
    }
    this.attemptsByIdempotency.set(snapshot.idempotencyKey, snapshot.commitAttemptId);
  }

  async listCommitAttemptsForCase(hubCoordinationCaseId: string) {
    return (this.caseAttempts.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.attempts.get(id))
      .filter((row): row is HubCommitAttemptSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => new StoredDocument(row));
  }

  async findCommitAttemptByIdempotencyKey(idempotencyKey: string) {
    const commitAttemptId = this.attemptsByIdempotency.get(idempotencyKey);
    return commitAttemptId ? this.getCommitAttempt(commitAttemptId) : null;
  }

  async getEvidenceBundle(evidenceBundleId: string) {
    const row = this.evidenceBundles.get(evidenceBundleId);
    return row ? new StoredDocument(row) : null;
  }

  async saveEvidenceBundle(
    snapshot: HubBookingEvidenceBundleSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.evidenceBundles, snapshot.evidenceBundleId, snapshot, options);
    const current = this.evidenceByAttempt.get(snapshot.commitAttemptId) ?? [];
    if (!current.includes(snapshot.evidenceBundleId)) {
      this.evidenceByAttempt.set(snapshot.commitAttemptId, [...current, snapshot.evidenceBundleId]);
    }
  }

  async listEvidenceBundlesForAttempt(commitAttemptId: string) {
    return (this.evidenceByAttempt.get(commitAttemptId) ?? [])
      .map((id) => this.evidenceBundles.get(id))
      .filter((row): row is HubBookingEvidenceBundleSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.evidenceCapturedAt, right.evidenceCapturedAt))
      .map((row) => new StoredDocument(row));
  }

  async getAppointmentRecord(hubAppointmentId: string) {
    const row = this.appointments.get(hubAppointmentId);
    return row ? new StoredDocument(row) : null;
  }

  async saveAppointmentRecord(
    snapshot: HubAppointmentRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.appointments, snapshot.hubAppointmentId, snapshot, options);
    const current = this.appointmentsByCase.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.hubAppointmentId)) {
      this.appointmentsByCase.set(snapshot.hubCoordinationCaseId, [...current, snapshot.hubAppointmentId]);
    }
    this.appointmentByBookingReference.set(
      snapshot.sourceBookingReference,
      snapshot.hubAppointmentId,
    );
  }

  async listAppointmentsForCase(hubCoordinationCaseId: string) {
    return (this.appointmentsByCase.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.appointments.get(id))
      .filter((row): row is HubAppointmentRecordSnapshot => row !== undefined)
      .map((row) => new StoredDocument(row));
  }

  async findAppointmentBySourceBookingReference(sourceBookingReference: string) {
    const appointmentId = this.appointmentByBookingReference.get(sourceBookingReference);
    return appointmentId ? this.getAppointmentRecord(appointmentId) : null;
  }

  async getSettlement(hubCommitSettlementId: string) {
    const row = this.settlements.get(hubCommitSettlementId);
    return row ? new StoredDocument(row) : null;
  }

  async saveSettlement(
    snapshot: HubCommitSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.settlements, snapshot.hubCommitSettlementId, snapshot, options);
    const current = this.settlementsByCase.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.hubCommitSettlementId)) {
      this.settlementsByCase.set(snapshot.hubCoordinationCaseId, [
        ...current,
        snapshot.hubCommitSettlementId,
      ]);
    }
  }

  async listSettlementsForCase(hubCoordinationCaseId: string) {
    return (this.settlementsByCase.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.settlements.get(id))
      .filter((row): row is HubCommitSettlementSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => new StoredDocument(row));
  }

  async getContinuityProjectionForCase(hubCoordinationCaseId: string) {
    const row = this.continuityByCase.get(hubCoordinationCaseId);
    return row ? new StoredDocument(row) : null;
  }

  async saveContinuityProjection(
    snapshot: HubContinuityEvidenceProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.continuityByCase, snapshot.hubCoordinationCaseId, snapshot, options);
  }

  async appendReconciliationRecord(snapshot: HubCommitReconciliationRecordSnapshot) {
    const current = this.reconciliationByAttempt.get(snapshot.commitAttemptId) ?? [];
    this.reconciliationByAttempt.set(snapshot.commitAttemptId, [...current, structuredClone(snapshot)]);
  }

  async listReconciliationRecordsForAttempt(commitAttemptId: string) {
    return (this.reconciliationByAttempt.get(commitAttemptId) ?? [])
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => new StoredDocument(row));
  }

  async getMirrorStateForAppointment(hubAppointmentId: string) {
    const row = this.mirrorByAppointment.get(hubAppointmentId);
    return row ? new StoredDocument(row) : null;
  }

  async saveMirrorState(
    snapshot: HubSupplierMirrorStateSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.mirrorByAppointment, snapshot.hubAppointmentId, snapshot, options);
  }

  async appendSupplierDriftHook(snapshot: HubSupplierDriftHookSnapshot) {
    const current = this.driftHooksByMirror.get(snapshot.hubSupplierMirrorStateId) ?? [];
    this.driftHooksByMirror.set(snapshot.hubSupplierMirrorStateId, [
      ...current,
      structuredClone(snapshot),
    ]);
  }

  async listSupplierDriftHooksForMirror(hubSupplierMirrorStateId: string) {
    return (this.driftHooksByMirror.get(hubSupplierMirrorStateId) ?? [])
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => new StoredDocument(row));
  }
}

export function createPhase5HubCommitEngineStore() {
  return new Phase5HubCommitEngineStore();
}

export function providerAdapterBindingHashFromSnapshot(
  binding: HubCapacityAdapterBindingSnapshot,
): string {
  return sha256Hex(
    stableStringify({
      bindingRef: binding.bindingRef,
      sourceMode: binding.sourceMode,
      sourceRef: binding.sourceRef,
      sourceIdentity: binding.sourceIdentity,
      sourceVersion: binding.sourceVersion,
    }),
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
      confirmationTruthState: snapshot.confirmationTruthState,
      commitAttemptRef: snapshot.commitAttemptRef,
      evidenceBundleRef: snapshot.bookingEvidenceRef,
      appointmentRecordRef: snapshot.hubAppointmentId,
      continuityEvidenceRef: snapshot.experienceContinuityEvidenceRef,
      blockingRefs: [...snapshot.blockingRefs].sort(),
    }),
  );
}

function computeContinuityTupleHash(
  snapshot: Omit<HubContinuityEvidenceProjectionSnapshot, "continuityTupleHash"> & {
    continuityTupleHash?: string;
  },
): string {
  return sha256Hex(
    stableStringify({
      controlCode: snapshot.controlCode,
      routeFamilyRef: snapshot.routeFamilyRef,
      routeContinuityEvidenceContractRef: snapshot.routeContinuityEvidenceContractRef,
      governingObjectRef: snapshot.governingObjectRef,
      selectedAnchorRef: snapshot.selectedAnchorRef,
      selectedAnchorTupleHashRef: snapshot.selectedAnchorTupleHashRef,
      continuityEnvelopeVersionRef: snapshot.continuityEnvelopeVersionRef,
      surfacePublicationRef: snapshot.surfacePublicationRef,
      runtimePublicationBundleRef: snapshot.runtimePublicationBundleRef,
      latestSettlementRef: snapshot.latestSettlementRef,
      latestContinuationRef: snapshot.latestContinuationRef,
      experienceContinuityEvidenceRef: snapshot.experienceContinuityEvidenceRef,
      validationState: snapshot.validationState,
      blockingRefs: [...snapshot.blockingRefs].sort(),
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

function updateContinuityProjection(
  current: HubContinuityEvidenceProjectionSnapshot,
  input: Partial<HubContinuityEvidenceProjectionSnapshot>,
  capturedAt: string,
): HubContinuityEvidenceProjectionSnapshot {
  const nextCore = {
    ...current,
    ...input,
    capturedAt,
    monotoneRevision: current.monotoneRevision + 1,
    version: nextVersion(current.version),
  };
  return {
    ...nextCore,
    continuityTupleHash: computeContinuityTupleHash({
      ...nextCore,
      continuityTupleHash: undefined as never,
    }),
  };
}

function confidenceBandFor(value: number): HubCommitConfidenceBand {
  if (value >= 0.82) {
    return "high";
  }
  if (value >= 0.55) {
    return "medium";
  }
  return "low";
}

function actionScopeForMode(mode: Phase5HubCommitMode): HubCommitActionScope {
  switch (mode) {
    case "native_api":
      return "commit_native_booking";
    case "manual_pending_confirmation":
      return "record_manual_confirmation";
    case "imported_confirmation":
      return "import_supplier_confirmation";
  }
}

function liveAttemptStates(state: HubCommitAttemptState): boolean {
  return [
    "draft",
    "executing",
    "awaiting_confirmation",
    "reconciliation_required",
    "disputed",
  ].includes(state);
}

function deriveReservationCommitMode(
  commitMode: Phase5HubCommitMode,
  supportsExclusiveHold: boolean,
): "exclusive_hold" | "truthful_nonexclusive" | "degraded_manual_pending" {
  if (commitMode === "manual_pending_confirmation") {
    return "degraded_manual_pending";
  }
  return supportsExclusiveHold ? "exclusive_hold" : "truthful_nonexclusive";
}

function deriveGateAssuranceLevel(
  commitMode: Phase5HubCommitMode,
  responseClass: "pending" | "confirmed" | "manual" | "imported",
): "strong" | "moderate" | "weak" | "manual" {
  if (commitMode === "manual_pending_confirmation") {
    return "manual";
  }
  if (responseClass === "confirmed") {
    return "strong";
  }
  if (responseClass === "pending") {
    return "weak";
  }
  if (commitMode === "imported_confirmation" || responseClass === "imported") {
    return "weak";
  }
  return "moderate";
}

function providerSystemFromBinding(binding: HubCapacityAdapterBindingSnapshot): string {
  return `${binding.sourceMode}:${binding.sourceIdentity}`;
}

function caseVersionRef(hubCase: HubCoordinationCaseSnapshot): string {
  return `${hubCase.hubCoordinationCaseId}@v${hubCase.version}`;
}

function canonicalReservationKeyForCapacityUnit(capacityUnitRef: string): string {
  return `hub_booking::${capacityUnitRef}`;
}

function evidenceWeightForSourceFamily(sourceFamily: string): number {
  switch (sourceFamily) {
    case "same_commit_read_after_write":
      return 1.95;
    case "durable_provider_reference":
      return 1.75;
    case "supplier_webhook":
      return 1.15;
    case "imported_supplier_message":
      return 1.05;
    case "supplier_portal_export":
      return 0.85;
    case "adapter_receipt":
      return 0.55;
    case "manual_operator_entry":
      return 0.3;
    case "manual_independent_call_back":
      return 0.85;
    case "manual_readback":
      return 0.55;
    default:
      return 0.35;
  }
}

function buildEvidenceAtoms(input: {
  commitMode: Phase5HubCommitMode;
  evidenceSourceFamilies: readonly string[];
  hardMatchRefsPassed: readonly string[];
  hardMatchRefsFailed: readonly string[];
  contradictoryEvidenceRefs: readonly string[];
  providerBookingReference?: string | null;
  importedEvidenceRef?: string | null;
  receiptRef?: string | null;
  capturedAt: string;
}): ConfirmationEvidenceAtom[] {
  const atoms: ConfirmationEvidenceAtom[] = [];
  for (const family of uniqueSortedRefs(input.evidenceSourceFamilies)) {
    atoms.push({
      evidenceRef: `${family}:${input.capturedAt}`,
      sourceFamily: family,
      proofRef:
        input.providerBookingReference ??
        input.importedEvidenceRef ??
        input.receiptRef ??
        `${family}_proof`,
      logLikelihoodWeight: evidenceWeightForSourceFamily(family),
      polarity: "positive",
    });
  }
  if (input.hardMatchRefsPassed.length > 0) {
    atoms.push({
      evidenceRef: `hard_match_pass:${input.capturedAt}`,
      sourceFamily: "hard_match",
      proofRef: input.providerBookingReference ?? input.importedEvidenceRef ?? "hard_match_pass",
      logLikelihoodWeight: 1.35,
      polarity: "positive",
      satisfiesHardMatchRefs: uniqueSortedRefs(input.hardMatchRefsPassed),
    });
  }
  if (input.hardMatchRefsFailed.length > 0) {
    atoms.push({
      evidenceRef: `hard_match_fail:${input.capturedAt}`,
      sourceFamily: "hard_match",
      proofRef: input.providerBookingReference ?? input.importedEvidenceRef ?? "hard_match_fail",
      logLikelihoodWeight: 2.4,
      polarity: "negative",
      failsHardMatchRefs: uniqueSortedRefs(input.hardMatchRefsFailed),
      contradictory: true,
    });
  }
  for (const contradictoryRef of uniqueSortedRefs(input.contradictoryEvidenceRefs)) {
    atoms.push({
      evidenceRef: contradictoryRef,
      sourceFamily: "contradiction",
      proofRef: contradictoryRef,
      logLikelihoodWeight: 1.6,
      polarity: "negative",
      contradictory: true,
    });
  }
  if (
    input.commitMode === "manual_pending_confirmation" &&
    new Set(input.evidenceSourceFamilies).size < defaultReservationConfirmationThresholdPolicy.weakManualMinSourceFamilies
  ) {
    atoms.push({
      evidenceRef: `manual_corroboration_missing:${input.capturedAt}`,
      sourceFamily: "manual_corroboration_guard",
      proofRef: "manual_corroboration_guard",
      logLikelihoodWeight: 0.95,
      polarity: "negative",
    });
  }
  return atoms;
}

function deriveCommitTruthState(input: {
  gateState?: ExternalConfirmationGateSnapshot["state"] | null;
  settlementResult?: HubCommitSettlementResultState | null;
  mirrorDriftState?: HubSupplierMirrorDriftState | null;
}):
  | "candidate_revalidating"
  | "native_booking_pending"
  | "confirmation_pending"
  | "confirmed_pending_practice_ack"
  | "confirmed"
  | "disputed"
  | "expired"
  | "blocked_by_drift" {
  if (input.mirrorDriftState && input.mirrorDriftState !== "aligned" && input.mirrorDriftState !== "reconciled") {
    return "blocked_by_drift";
  }
  if (input.settlementResult === "booked_pending_ack") {
    return "confirmed_pending_practice_ack";
  }
  switch (input.gateState) {
    case "confirmed":
      return "confirmed_pending_practice_ack";
    case "disputed":
      return "disputed";
    case "expired":
      return "expired";
    case "pending":
      return "confirmation_pending";
    default:
      return "native_booking_pending";
  }
}

function derivePatientVisibilityState(input: {
  confirmationTruthState:
    | "candidate_revalidating"
    | "native_booking_pending"
    | "confirmation_pending"
    | "confirmed_pending_practice_ack"
    | "confirmed"
    | "disputed"
    | "expired"
    | "blocked_by_drift";
}): "choice_visible" | "provisional_receipt" | "confirmed_visible" | "fallback_visible" | "recovery_required" {
  switch (input.confirmationTruthState) {
    case "confirmed_pending_practice_ack":
    case "confirmed":
      return "confirmed_visible";
    case "blocked_by_drift":
    case "disputed":
    case "expired":
      return "recovery_required";
    default:
      return "provisional_receipt";
  }
}

function derivePracticeVisibilityState(input: {
  confirmationTruthState:
    | "candidate_revalidating"
    | "native_booking_pending"
    | "confirmation_pending"
    | "confirmed_pending_practice_ack"
    | "confirmed"
    | "disputed"
    | "expired"
    | "blocked_by_drift";
}): "not_started" | "continuity_pending" | "ack_pending" | "acknowledged" | "exception_granted" | "recovery_required" {
  switch (input.confirmationTruthState) {
    case "confirmed_pending_practice_ack":
      return "ack_pending";
    case "confirmed":
      return "acknowledged";
    case "blocked_by_drift":
    case "disputed":
    case "expired":
      return "recovery_required";
    case "confirmation_pending":
      return "continuity_pending";
    default:
      return "not_started";
  }
}

function deriveClosureState(input: {
  confirmationTruthState:
    | "candidate_revalidating"
    | "native_booking_pending"
    | "confirmation_pending"
    | "confirmed_pending_practice_ack"
    | "confirmed"
    | "disputed"
    | "expired"
    | "blocked_by_drift";
  practiceVisibilityState:
    | "not_started"
    | "continuity_pending"
    | "ack_pending"
    | "acknowledged"
    | "exception_granted"
    | "recovery_required";
  fallbackLinkState: HubOfferToConfirmationTruthProjectionSnapshot["fallbackLinkState"];
}):
  | "blocked_by_offer"
  | "blocked_by_confirmation"
  | "blocked_by_practice_visibility"
  | "blocked_by_fallback_linkage"
  | "blocked_by_supplier_drift"
  | "closable" {
  if (input.confirmationTruthState === "blocked_by_drift") {
    return "blocked_by_supplier_drift";
  }
  if (input.fallbackLinkState === "callback_pending_link" || input.fallbackLinkState === "return_pending_link") {
    return "blocked_by_fallback_linkage";
  }
  if (
    input.confirmationTruthState !== "confirmed_pending_practice_ack" &&
    input.confirmationTruthState !== "confirmed"
  ) {
    return "blocked_by_confirmation";
  }
  if (
    input.practiceVisibilityState !== "acknowledged" &&
    input.practiceVisibilityState !== "exception_granted"
  ) {
    return "blocked_by_practice_visibility";
  }
  return "closable";
}

function deriveBlockingRefs(input: {
  settlementResult?: HubCommitSettlementResultState | null;
  confirmationTruthState:
    | "candidate_revalidating"
    | "native_booking_pending"
    | "confirmation_pending"
    | "confirmed_pending_practice_ack"
    | "confirmed"
    | "disputed"
    | "expired"
    | "blocked_by_drift";
  practiceVisibilityState:
    | "not_started"
    | "continuity_pending"
    | "ack_pending"
    | "acknowledged"
    | "exception_granted"
    | "recovery_required";
  closureState:
    | "blocked_by_offer"
    | "blocked_by_confirmation"
    | "blocked_by_practice_visibility"
    | "blocked_by_fallback_linkage"
    | "blocked_by_supplier_drift"
    | "closable";
  additionalReasonRefs?: readonly string[];
}): string[] {
  return uniqueSortedRefs([
    input.confirmationTruthState === "confirmation_pending" ? "confirmation_gate_pending" : "",
    input.confirmationTruthState === "disputed" ? "confirmation_disputed" : "",
    input.confirmationTruthState === "expired" ? "confirmation_expired" : "",
    input.confirmationTruthState === "blocked_by_drift" ? "supplier_drift_detected" : "",
    input.practiceVisibilityState === "ack_pending" ? "practice_ack_pending" : "",
    input.practiceVisibilityState === "continuity_pending" ? "practice_continuity_pending" : "",
    input.closureState === "blocked_by_fallback_linkage" ? "fallback_linkage_pending" : "",
    input.settlementResult === "reconciliation_required" ? "split_brain_reconciliation_required" : "",
    ...(input.additionalReasonRefs ?? []),
  ]);
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

async function requireCurrentTruthProjection(
  repositories: Phase5AlternativeOfferEngineRepositories,
  hubCoordinationCaseId: string,
): Promise<HubOfferToConfirmationTruthProjectionSnapshot> {
  return requireSnapshot(
    repositories.getTruthProjectionForCase(hubCoordinationCaseId),
    "HUB_OFFER_TRUTH_NOT_FOUND",
    "HubOfferToConfirmationTruthProjection is required before commit can begin.",
  );
}

async function requireSession(
  repositories: Phase5AlternativeOfferEngineRepositories,
  alternativeOfferSessionId: string,
): Promise<AlternativeOfferSessionSnapshot> {
  return requireSnapshot(
    repositories.getSession(alternativeOfferSessionId),
    "ALTERNATIVE_OFFER_SESSION_NOT_FOUND",
    "AlternativeOfferSession could not be found.",
  );
}

function requireHubCaseBundle(bundle: HubCaseBundle | null, hubCoordinationCaseId: string): HubCaseBundle {
  invariant(
    bundle !== null,
    "HUB_CASE_BUNDLE_NOT_FOUND",
    `Hub case bundle ${hubCoordinationCaseId} was not found.`,
  );
  return bundle;
}

function derivePolicyFacts(input: {
  candidateSnapshot: NetworkCandidateSnapshot;
  selectedCandidate: NetworkSlotCandidateSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  minimumNecessaryContractRef: string | null;
  evaluatedAt: string;
  overrides?: Partial<PolicyEvaluationFactsSnapshot>;
}): PolicyEvaluationFactsSnapshot {
  const sourceAdmissionSummary = uniqueSortedRefs(
    input.candidateSnapshot.candidateRefs.map((value) => value),
  );
  return {
    routeToNetworkRequested: true,
    urgentBounceRequired: false,
    requiredWindowFit: input.selectedCandidate.requiredWindowFit,
    sourceAdmissionSummary: sourceAdmissionSummary.map((sourceRef) => ({
      sourceRef,
      sourceTrustState: input.selectedCandidate.sourceTrustState,
      candidateCount: 1,
    })),
    staleCapacityDetected:
      input.selectedCandidate.sourceFreshnessState === "stale" ||
      Date.parse(input.candidateSnapshot.expiresAt) <= Date.parse(input.evaluatedAt),
    adjustedPopulation: null,
    deliveredMinutes: null,
    availableMinutes: null,
    cancelledMinutes: null,
    replacementMinutes: null,
    commissionerExceptionRef: null,
    minimumNecessaryContractRef: input.minimumNecessaryContractRef,
    ackDebtOpen: input.truthProjection.practiceAckGeneration > 0,
    visibilityDeltaRequired: input.truthProjection.practiceVisibilityState !== "not_started",
    ...(input.overrides ?? {}),
  };
}

export interface BeginHubCommitAttemptInput {
  hubCoordinationCaseId: string;
  commitMode: Phase5HubCommitMode;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  idempotencyKey: string;
  providerAdapterBinding: HubCapacityAdapterBindingSnapshot;
  presentedTruthTupleHash: string;
  selectedCandidateRef?: string | null;
  selectedOfferSessionRef?: string | null;
  selectedOfferEntryRef?: string | null;
  supportsExclusiveHold?: boolean;
  reservationExpiresAt?: string | null;
  confirmationDeadlineAt?: string | null;
  sourceRefs?: readonly string[];
  authority?: HubCommandAuthorityInput;
  policyFacts?: Partial<PolicyEvaluationFactsSnapshot>;
}

export interface HubNativeCommitResponseInput {
  responseClass:
    | "accepted_pending"
    | "authoritative_confirmed"
    | "timeout_unknown"
    | "rejected"
    | "split_brain_uncertain";
  receiptCheckpointRef?: string | null;
  adapterCorrelationKey?: string | null;
  providerBookingReference?: string | null;
  supplierAppointmentRef?: string | null;
  sourceFamilies: readonly string[];
  hardMatchRefsPassed?: readonly string[];
  hardMatchRefsFailed?: readonly string[];
  contradictoryEvidenceRefs?: readonly string[];
  authoritativeProofClass?: "durable_provider_reference" | "same_commit_read_after_write";
  failureReasonCode?: string | null;
  reconciliationDueAt?: string | null;
}

export interface SubmitNativeHubCommitInput {
  commitAttemptId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  presentedTruthTupleHash: string;
  presentedProviderAdapterBindingHash: string;
  presentedReservationFenceToken: string;
  sourceRefs?: readonly string[];
  authority?: HubCommandAuthorityInput;
  policyFacts?: Partial<PolicyEvaluationFactsSnapshot>;
  response: HubNativeCommitResponseInput;
}

export interface CaptureManualHubBookingEvidenceInput {
  commitAttemptId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  presentedTruthTupleHash: string;
  presentedProviderAdapterBindingHash: string;
  presentedReservationFenceToken: string;
  sourceRefs?: readonly string[];
  authority?: HubCommandAuthorityInput;
  policyFacts?: Partial<PolicyEvaluationFactsSnapshot>;
  evidence: HubManualBookingEvidenceSnapshot;
}

export interface IngestImportedHubConfirmationInput {
  hubCoordinationCaseId: string;
  commitAttemptId?: string | null;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  idempotencyKey: string;
  providerAdapterBinding: HubCapacityAdapterBindingSnapshot;
  presentedTruthTupleHash: string;
  selectedCandidateRef?: string | null;
  selectedOfferSessionRef?: string | null;
  selectedOfferEntryRef?: string | null;
  supportsExclusiveHold?: boolean;
  sourceRefs?: readonly string[];
  authority?: HubCommandAuthorityInput;
  policyFacts?: Partial<PolicyEvaluationFactsSnapshot>;
  importedEvidence: HubImportedConfirmationEvidenceSnapshot;
}

export interface RecomputeHubConfirmationGateInput {
  commitAttemptId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  presentedTruthTupleHash: string;
  sourceRefs?: readonly string[];
  authority?: HubCommandAuthorityInput;
  autoFinalizeWhenConfirmed?: boolean;
  practiceAckDueAt?: string | null;
}

export interface RecordHubCommitReconciliationRequiredInput {
  commitAttemptId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  reasonCode: string;
  reconciliationClass: HubCommitReconciliationClass;
  providerCorrelationRef?: string | null;
  latestReceiptCheckpointRef?: string | null;
  dueAt?: string | null;
  sourceRefs?: readonly string[];
}

export interface FinalizeHubBookedPendingPracticeAckInput {
  commitAttemptId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  sourceBookingReference: string;
  patientFacingReference: string;
  appointmentVersionRef: string;
  supplierAppointmentRef?: string | null;
  manageCapabilitiesRef?: string | null;
  practiceAckDueAt?: string | null;
  sourceRefs?: readonly string[];
  authority?: HubCommandAuthorityInput;
  policyFacts?: Partial<PolicyEvaluationFactsSnapshot>;
}

export interface StartHubSupplierMirrorMonitoringInput {
  hubAppointmentId: string;
  supplierSystem: string;
  supplierVersion: string;
  startedAt: string;
  nextSyncDueAt?: string | null;
  sourceRefs?: readonly string[];
}

export interface RecordHubSupplierMirrorObservationInput {
  hubAppointmentId: string;
  observedAt: string;
  observedStatus: HubSupplierObservedStatus;
  supplierVersion: string;
  driftReasonRefs?: readonly string[];
  sourceRefs?: readonly string[];
}

export interface BeginHubCommitAttemptResult {
  actionRecord: HubActionRecordSnapshot;
  commitAttempt: HubCommitAttemptSnapshot;
  reservation: CapacityReservationSnapshot;
  confirmationGate: ExternalConfirmationGateSnapshot | null;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  policyEvaluation: NetworkPolicyEvaluationResult;
  authorityDecision: HubCommandAuthorityDecision | null;
  hubTransition: HubCaseTransitionResult | null;
  replayed: boolean;
}

export interface HubCommitMutationResult {
  actionRecord: HubActionRecordSnapshot;
  commitAttempt: HubCommitAttemptSnapshot;
  settlement: HubCommitSettlementSnapshot;
  evidenceBundle: HubBookingEvidenceBundleSnapshot | null;
  confirmationGate: ExternalConfirmationGateSnapshot | null;
  appointment: HubAppointmentRecordSnapshot | null;
  continuityProjection: HubContinuityEvidenceProjectionSnapshot | null;
  mirrorState: HubSupplierMirrorStateSnapshot | null;
  reconciliationRecord: HubCommitReconciliationRecordSnapshot | null;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  policyEvaluation: NetworkPolicyEvaluationResult | null;
  authorityDecision: HubCommandAuthorityDecision | null;
  hubTransition: HubCaseTransitionResult | null;
}

export interface HubSupplierMirrorObservationResult {
  mirrorState: HubSupplierMirrorStateSnapshot;
  driftHook: HubSupplierDriftHookSnapshot | null;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  continuityProjection: HubContinuityEvidenceProjectionSnapshot | null;
}

export interface CurrentHubCommitState {
  liveAttempt: HubCommitAttemptSnapshot | null;
  evidenceBundle: HubBookingEvidenceBundleSnapshot | null;
  appointment: HubAppointmentRecordSnapshot | null;
  latestSettlement: HubCommitSettlementSnapshot | null;
  latestContinuityProjection: HubContinuityEvidenceProjectionSnapshot | null;
  mirrorState: HubSupplierMirrorStateSnapshot | null;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot | null;
}

export interface Phase5HubCommitEngineService {
  repositories: Phase5HubCommitEngineRepositories;
  beginCommitAttempt(input: BeginHubCommitAttemptInput): Promise<BeginHubCommitAttemptResult>;
  submitNativeApiCommit(input: SubmitNativeHubCommitInput): Promise<HubCommitMutationResult>;
  captureManualBookingEvidence(
    input: CaptureManualHubBookingEvidenceInput,
  ): Promise<HubCommitMutationResult>;
  ingestImportedConfirmation(
    input: IngestImportedHubConfirmationInput,
  ): Promise<HubCommitMutationResult>;
  recomputeConfirmationGate(
    input: RecomputeHubConfirmationGateInput,
  ): Promise<HubCommitMutationResult>;
  finalizeBookedPendingPracticeAck(
    input: FinalizeHubBookedPendingPracticeAckInput,
  ): Promise<HubCommitMutationResult>;
  recordReconciliationRequired(
    input: RecordHubCommitReconciliationRequiredInput,
  ): Promise<HubCommitMutationResult>;
  startSupplierMirrorMonitoring(
    input: StartHubSupplierMirrorMonitoringInput,
  ): Promise<HubSupplierMirrorStateSnapshot>;
  recordSupplierMirrorObservation(
    input: RecordHubSupplierMirrorObservationInput,
  ): Promise<HubSupplierMirrorObservationResult>;
  queryCurrentCommitState(hubCoordinationCaseId: string): Promise<CurrentHubCommitState>;
}

export interface CreatePhase5HubCommitEngineServiceOptions {
  repositories: Phase5HubCommitEngineRepositories;
  hubCaseService: Phase5HubCaseKernelService;
  offerRepositories: Phase5AlternativeOfferEngineRepositories;
  capacityRepositories: Phase5NetworkCapacityPipelineRepositories;
  policyService: Phase5EnhancedAccessPolicyService;
  actingScopeService?: Phase5ActingScopeVisibilityService;
  reservationDependencies?: ReservationConfirmationDependencies;
  idGenerator?: BackboneIdGenerator;
}

function buildSettlement(
  idGenerator: BackboneIdGenerator,
  input: {
    hubCoordinationCaseId: string;
    actionRecord: HubActionRecordSnapshot;
    commitAttempt: HubCommitAttemptSnapshot;
    result: HubCommitSettlementResultState;
    stateConfidenceBand: HubCommitConfidenceBand;
    recordedAt: string;
    presentationArtifactRef?: string | null;
    sourceRefs?: readonly string[];
  },
): HubCommitSettlementSnapshot {
  return {
    hubCommitSettlementId: nextId(idGenerator, "hubCommitSettlement"),
    hubCoordinationCaseId: input.hubCoordinationCaseId,
    hubActionRecordRef: input.actionRecord.hubActionRecordId,
    commitAttemptRef: input.commitAttempt.commitAttemptId,
    result: input.result,
    experienceContinuityEvidenceRef: input.commitAttempt.experienceContinuityEvidenceRef,
    causalToken: nextId(idGenerator, "hubCommitSettlementCausalToken"),
    transitionEnvelopeRef: input.commitAttempt.transitionEnvelopeRef,
    surfaceRouteContractRef: input.commitAttempt.surfaceRouteContractRef,
    surfacePublicationRef: input.commitAttempt.surfacePublicationRef,
    runtimePublicationBundleRef: input.commitAttempt.runtimePublicationBundleRef,
    releaseRecoveryDispositionRef: input.commitAttempt.releaseRecoveryDispositionRef,
    stateConfidenceBand: input.stateConfidenceBand,
    recoveryRouteRef:
      input.result === "reconciliation_required" ||
      input.result === "confirmation_disputed" ||
      input.result === "imported_disputed"
        ? "hub_case_detail"
        : null,
    presentationArtifactRef: optionalRef(input.presentationArtifactRef),
    recordedAt: input.recordedAt,
    sourceRefs: uniqueSortedRefs([
      ...DEFAULT_SOURCE_REFS,
      ...(input.sourceRefs ?? []),
    ]),
    version: 1,
  };
}

function buildActionRecord(
  idGenerator: BackboneIdGenerator,
  input: {
    hubCase: HubCoordinationCaseSnapshot;
    actionScope: HubCommitActionScope;
    governingObjectRef: string;
    reservationFenceToken: string;
    actingContextRef: string | null;
    compiledPolicyBundleRef: string | null;
    enhancedAccessPolicyRef: string | null;
    policyEvaluationRef: string | null;
    policyTupleHash: string;
    idempotencyKey: string;
    createdByRef: string;
    createdAt: string;
    sourceRefs?: readonly string[];
  },
): HubActionRecordSnapshot {
  return {
    hubActionRecordId: nextId(idGenerator, "hubActionRecord"),
    hubCoordinationCaseId: input.hubCase.hubCoordinationCaseId,
    actionScope: input.actionScope,
    governingObjectRef: input.governingObjectRef,
    caseVersionRef: caseVersionRef(input.hubCase),
    reservationFenceToken: input.reservationFenceToken,
    actingContextRef: input.actingContextRef,
    compiledPolicyBundleRef: input.compiledPolicyBundleRef,
    enhancedAccessPolicyRef: input.enhancedAccessPolicyRef,
    policyEvaluationRef: input.policyEvaluationRef,
    policyTupleHash: input.policyTupleHash,
    lineageFenceEpoch: input.hubCase.ownershipEpoch,
    idempotencyKey: input.idempotencyKey,
    createdByRef: input.createdByRef,
    createdAt: input.createdAt,
    settledAt: null,
    sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
    version: 1,
  };
}

function buildAttemptBlockingReasons(input: {
  selectedCandidate: NetworkSlotCandidateSnapshot;
  candidateSnapshot: NetworkCandidateSnapshot;
  directCommitFrontierRefs: readonly string[];
  policyEvaluation: NetworkPolicyEvaluationResult;
  providerBindingHash: string;
  currentTruthTupleHash: string;
  presentedTruthTupleHash: string;
  presentedCandidateRef: string;
  asOf: string;
}): string[] {
  const reasons: string[] = [];
  if (input.presentedTruthTupleHash !== input.currentTruthTupleHash) {
    reasons.push("truth_tuple_drift");
  }
  if (input.selectedCandidate.candidateId !== input.presentedCandidateRef) {
    reasons.push("selected_candidate_drift");
  }
  if (Date.parse(input.candidateSnapshot.expiresAt) <= Date.parse(input.asOf)) {
    reasons.push("candidate_snapshot_expired");
  }
  if (
    input.selectedCandidate.sourceFreshnessState === "stale" ||
    input.selectedCandidate.sourceTrustState !== "trusted"
  ) {
    reasons.push("source_trust_or_freshness_invalid");
  }
  if (
    input.selectedCandidate.offerabilityState !== "direct_commit" ||
    !input.directCommitFrontierRefs.includes(input.selectedCandidate.candidateId)
  ) {
    reasons.push("candidate_not_direct_commit_eligible");
  }
  if (input.policyEvaluation.evaluation.capacityAdmissionDisposition !== "trusted_admitted") {
    reasons.push(`capacity_admission_${input.policyEvaluation.evaluation.capacityAdmissionDisposition}`);
  }
  if (
    input.policyEvaluation.exceptions.some(
      (exception) => exception.severity === "blocking",
    )
  ) {
    reasons.push(
      ...input.policyEvaluation.exceptions
        .filter((exception) => exception.severity === "blocking")
        .map((exception) => exception.exceptionCode.toLowerCase()),
    );
  }
  if (input.providerBindingHash.length === 0) {
    reasons.push("provider_binding_missing");
  }
  return uniqueSortedRefs(reasons);
}

export function createPhase5HubCommitEngineService(
  options: CreatePhase5HubCommitEngineServiceOptions,
): Phase5HubCommitEngineService {
  const repositories = options.repositories;
  const idGenerator =
    options.idGenerator ?? createDeterministicBackboneIdGenerator("phase5-hub-commit-engine");
  const reservationDependencies =
    options.reservationDependencies ?? createReservationConfirmationStore();
  const reservationAuthority = createReservationConfirmationAuthorityService(
    reservationDependencies,
    idGenerator,
  );

  async function assertAuthority(
    authority: HubCommandAuthorityInput | undefined,
  ): Promise<HubCommandAuthorityDecision | null> {
    if (!options.actingScopeService || !authority) {
      return null;
    }
    return options.actingScopeService.assertCurrentHubCommandScope(authority);
  }

  async function resolveCommitContext(input: {
    hubCoordinationCaseId: string;
    selectedCandidateRef?: string | null;
    selectedOfferSessionRef?: string | null;
    presentedTruthTupleHash: string;
    providerAdapterBinding: HubCapacityAdapterBindingSnapshot;
    policyFacts?: Partial<PolicyEvaluationFactsSnapshot>;
    minimumNecessaryContractRef?: string | null;
    evaluatedAt: string;
  }) {
    const hubCaseBundle = requireHubCaseBundle(
      await options.hubCaseService.queryHubCaseBundle(input.hubCoordinationCaseId),
      input.hubCoordinationCaseId,
    );
    const truthProjection = await requireCurrentTruthProjection(
      options.offerRepositories,
      input.hubCoordinationCaseId,
    );
    const selectedCandidateRef =
      optionalRef(input.selectedCandidateRef) ?? truthProjection.selectedCandidateRef;
    invariant(
      selectedCandidateRef !== null,
      "SELECTED_CANDIDATE_REQUIRED",
      "A selected candidate is required before commit can begin.",
    );
    const selectedCandidate = await requireSnapshot(
      options.capacityRepositories.getCandidate(selectedCandidateRef),
      "NETWORK_SLOT_CANDIDATE_NOT_FOUND",
      "Selected candidate could not be found.",
    );
    const candidateSnapshot = await requireSnapshot(
      options.capacityRepositories.getSnapshot(
        requireRef(hubCaseBundle.hubCase.candidateSnapshotRef, "candidateSnapshotRef"),
      ),
      "NETWORK_CANDIDATE_SNAPSHOT_NOT_FOUND",
      "Hub case candidate snapshot could not be found.",
    );
    const decisionPlan = await requireSnapshot(
      options.capacityRepositories.getDecisionPlan(
        requireRef(hubCaseBundle.hubCase.crossSiteDecisionPlanRef, "crossSiteDecisionPlanRef"),
      ),
      "CROSS_SITE_DECISION_PLAN_NOT_FOUND",
      "Hub case cross-site decision plan could not be found.",
    );
    const selectedOfferSessionRef =
      optionalRef(input.selectedOfferSessionRef) ?? truthProjection.offerSessionRef;
    const session =
      selectedOfferSessionRef === null
        ? null
        : await requireSession(options.offerRepositories, selectedOfferSessionRef);
    const policyEvaluation = await options.policyService.evaluateHubCaseAgainstPolicy({
      hubCoordinationCaseId: input.hubCoordinationCaseId,
      pcnRef: hubCaseBundle.hubCase.servingPcnId,
      evaluationScope: "commit_attempt",
      evaluatedAt: input.evaluatedAt,
      presentedPolicyTupleHash:
        truthProjection.policyTupleHash || hubCaseBundle.hubCase.policyTupleHash || undefined,
      facts: derivePolicyFacts({
        candidateSnapshot,
        selectedCandidate,
        truthProjection,
        minimumNecessaryContractRef: input.minimumNecessaryContractRef ?? null,
        evaluatedAt: input.evaluatedAt,
        overrides: input.policyFacts,
      }),
    });
    const providerAdapterBindingHash = providerAdapterBindingHashFromSnapshot(
      input.providerAdapterBinding,
    );
    return {
      hubCaseBundle,
      truthProjection,
      selectedCandidate,
      candidateSnapshot,
      decisionPlan,
      session,
      policyEvaluation,
      providerAdapterBindingHash,
    };
  }

  function buildTransitionCommand(
    hubCase: HubCoordinationCaseSnapshot,
    input: {
      actorRef: string;
      routeIntentBindingRef: string;
      commandActionRecordRef: string;
      commandSettlementRecordRef: string;
      recordedAt: string;
      reasonCode: string;
      selectedCandidateRef?: string | null;
      bookingEvidenceRef?: string | null;
      networkAppointmentRef?: string | null;
      offerToConfirmationTruthRef?: string | null;
      activeAlternativeOfferSessionRef?: string | null;
      activeOfferOptimisationPlanRef?: string | null;
      latestOfferRegenerationSettlementRef?: string | null;
      practiceAckGeneration?: number | null;
      practiceAckDueAt?: string | null;
      carriedOpenCaseBlockerRefs?: readonly string[];
    },
  ): HubCaseTransitionCommandInput {
    return {
      hubCoordinationCaseId: hubCase.hubCoordinationCaseId,
      actorRef: input.actorRef,
      routeIntentBindingRef: input.routeIntentBindingRef,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      recordedAt: input.recordedAt,
      reasonCode: input.reasonCode,
      expectedOwnershipEpoch: hubCase.ownershipEpoch,
      expectedOwnershipFenceToken: hubCase.ownershipFenceToken,
      currentLineageFenceEpoch: hubCase.ownershipEpoch,
      sourceBookingBranchState: "active",
      leaseFreshness: "active",
      selectedCandidateRef: input.selectedCandidateRef ?? undefined,
      bookingEvidenceRef: input.bookingEvidenceRef ?? undefined,
      networkAppointmentRef: input.networkAppointmentRef ?? undefined,
      offerToConfirmationTruthRef: input.offerToConfirmationTruthRef ?? undefined,
      activeAlternativeOfferSessionRef: input.activeAlternativeOfferSessionRef ?? undefined,
      activeOfferOptimisationPlanRef: input.activeOfferOptimisationPlanRef ?? undefined,
      latestOfferRegenerationSettlementRef:
        input.latestOfferRegenerationSettlementRef ?? undefined,
      practiceAckGeneration: input.practiceAckGeneration ?? undefined,
      practiceAckDueAt: input.practiceAckDueAt ?? undefined,
      carriedOpenCaseBlockerRefs: input.carriedOpenCaseBlockerRefs ?? undefined,
    };
  }

  async function saveAttemptAndTruth(input: {
    attempt: HubCommitAttemptSnapshot;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    actionRecord?: HubActionRecordSnapshot | null;
    evidenceBundle?: HubBookingEvidenceBundleSnapshot | null;
    appointment?: HubAppointmentRecordSnapshot | null;
    continuityProjection?: HubContinuityEvidenceProjectionSnapshot | null;
    settlement?: HubCommitSettlementSnapshot | null;
    reservation?: CapacityReservationSnapshot | null;
    confirmationGate?: ExternalConfirmationGateSnapshot | null;
  }): Promise<void> {
    const existingAttempt = await repositories.getCommitAttempt(input.attempt.commitAttemptId);
    await repositories.saveCommitAttempt(input.attempt, {
      expectedVersion: existingAttempt?.toSnapshot().version,
    });
    if (input.actionRecord) {
      const existingAction = await repositories.getActionRecord(input.actionRecord.hubActionRecordId);
      await repositories.saveActionRecord(input.actionRecord, {
        expectedVersion: existingAction?.toSnapshot().version,
      });
    }
    if (input.evidenceBundle) {
      const existingEvidence = await repositories.getEvidenceBundle(input.evidenceBundle.evidenceBundleId);
      await repositories.saveEvidenceBundle(input.evidenceBundle, {
        expectedVersion: existingEvidence?.toSnapshot().version,
      });
    }
    if (input.appointment) {
      const existingAppointment = await repositories.getAppointmentRecord(input.appointment.hubAppointmentId);
      await repositories.saveAppointmentRecord(input.appointment, {
        expectedVersion: existingAppointment?.toSnapshot().version,
      });
    }
    if (input.settlement) {
      const existingSettlement = await repositories.getSettlement(input.settlement.hubCommitSettlementId);
      await repositories.saveSettlement(input.settlement, {
        expectedVersion: existingSettlement?.toSnapshot().version,
      });
    }
    if (input.continuityProjection) {
      const existingContinuity = await repositories.getContinuityProjectionForCase(
        input.continuityProjection.hubCoordinationCaseId,
      );
      await repositories.saveContinuityProjection(input.continuityProjection, {
        expectedVersion: existingContinuity?.toSnapshot().version,
      });
    }
    const existingTruth = await options.offerRepositories.getTruthProjectionForCase(
      input.truthProjection.hubCoordinationCaseId,
    );
    await options.offerRepositories.saveTruthProjection(input.truthProjection, {
      expectedVersion: existingTruth?.toSnapshot().version,
    });
    if (input.reservation) {
      const currentReservation = await reservationDependencies.getCapacityReservation(
        input.reservation.reservationId,
      );
      if (currentReservation?.version !== input.reservation.reservationVersion) {
        await reservationAuthority.recordCapacityReservation(input.reservation, {
          expectedVersion: currentReservation?.version,
        });
      }
    }
    if (input.confirmationGate) {
      const currentGate = await reservationDependencies.getExternalConfirmationGate(
        input.confirmationGate.gateId,
      );
      if (currentGate?.version !== input.confirmationGate.gateRevision) {
        await reservationAuthority.refreshExternalConfirmationGate(
          {
            gateId: input.confirmationGate.gateId,
            episodeId: input.confirmationGate.episodeId,
            domain: input.confirmationGate.domain,
            domainObjectRef: input.confirmationGate.domainObjectRef,
            transportMode: input.confirmationGate.transportMode,
            assuranceLevel: input.confirmationGate.assuranceLevel,
            evidenceModelVersionRef: input.confirmationGate.evidenceModelVersionRef,
            requiredHardMatchRefs: input.confirmationGate.requiredHardMatchRefs,
            evidenceAtoms: input.confirmationGate.proofRefs.map((proofRef) => ({
              evidenceRef: proofRef,
              sourceFamily: "replayed_gate_atom",
              proofRef,
              logLikelihoodWeight: 0.01,
              polarity: "positive",
            })),
            confirmationDeadlineAt: input.confirmationGate.confirmationDeadlineAt,
            priorProbability: input.confirmationGate.priorProbability,
            createdAt: input.confirmationGate.createdAt,
            updatedAt: input.confirmationGate.updatedAt,
            gateRevision: input.confirmationGate.gateRevision,
            thresholdPolicy: defaultReservationConfirmationThresholdPolicy,
          },
          {
            expectedVersion: currentGate?.version,
          },
        );
      }
    }
  }

  async function writeSettlementAndTruth(input: {
    attempt: HubCommitAttemptSnapshot;
    actionRecord: HubActionRecordSnapshot;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    evidenceBundle?: HubBookingEvidenceBundleSnapshot | null;
    appointment?: HubAppointmentRecordSnapshot | null;
    continuityProjection?: HubContinuityEvidenceProjectionSnapshot | null;
    mirrorState?: HubSupplierMirrorStateSnapshot | null;
    reconciliationRecord?: HubCommitReconciliationRecordSnapshot | null;
    reservation?: CapacityReservationSnapshot | null;
    confirmationGate?: ExternalConfirmationGateSnapshot | null;
    result: HubCommitSettlementResultState;
    recordedAt: string;
    sourceRefs?: readonly string[];
    hubTransition?: HubCaseTransitionResult | null;
    policyEvaluation?: NetworkPolicyEvaluationResult | null;
    authorityDecision?: HubCommandAuthorityDecision | null;
  }): Promise<HubCommitMutationResult> {
    const settlement = buildSettlement(idGenerator, {
      hubCoordinationCaseId: input.attempt.hubCoordinationCaseId,
      actionRecord: {
        ...input.actionRecord,
        settledAt: input.recordedAt,
        version: nextVersion(input.actionRecord.version),
      },
      commitAttempt: input.attempt,
      result: input.result,
      stateConfidenceBand: confidenceBandFor(input.attempt.confirmationConfidence),
      recordedAt: input.recordedAt,
      presentationArtifactRef:
        input.appointment?.hubAppointmentId ?? input.evidenceBundle?.evidenceBundleId ?? null,
      sourceRefs: input.sourceRefs,
    });
    const settledActionRecord: HubActionRecordSnapshot = {
      ...input.actionRecord,
      settledAt: input.recordedAt,
      version: nextVersion(input.actionRecord.version),
    };
    const settledAttempt: HubCommitAttemptSnapshot = {
      ...input.attempt,
      journalState: "settled",
      updatedAt: input.recordedAt,
      finalizedAt:
        input.attempt.attemptState === "confirmed" ||
        input.attempt.attemptState === "failed" ||
        input.attempt.attemptState === "disputed" ||
        input.attempt.attemptState === "reconciliation_required"
          ? input.recordedAt
          : input.attempt.finalizedAt,
      version: nextVersion(input.attempt.version),
    };
    await saveAttemptAndTruth({
      attempt: settledAttempt,
      truthProjection: input.truthProjection,
      actionRecord: settledActionRecord,
      evidenceBundle: input.evidenceBundle,
      appointment: input.appointment,
      continuityProjection: input.continuityProjection,
      settlement,
      reservation: input.reservation ?? null,
      confirmationGate: input.confirmationGate ?? null,
    });
    if (input.reconciliationRecord) {
      await repositories.appendReconciliationRecord(input.reconciliationRecord);
    }
    if (input.mirrorState) {
      const currentMirror = await repositories.getMirrorStateForAppointment(
        input.mirrorState.hubAppointmentId,
      );
      await repositories.saveMirrorState(input.mirrorState, {
        expectedVersion: currentMirror?.toSnapshot().version,
      });
    }
    return {
      actionRecord: settledActionRecord,
      commitAttempt: settledAttempt,
      settlement,
      evidenceBundle: input.evidenceBundle ?? null,
      confirmationGate: input.confirmationGate ?? null,
      appointment: input.appointment ?? null,
      continuityProjection: input.continuityProjection ?? null,
      mirrorState: input.mirrorState ?? null,
      reconciliationRecord: input.reconciliationRecord ?? null,
      truthProjection: input.truthProjection,
      policyEvaluation: input.policyEvaluation ?? null,
      authorityDecision: input.authorityDecision ?? null,
      hubTransition: input.hubTransition ?? null,
    };
  }

  async function finalizeBookedPendingPracticeAckInternal(input: {
    attempt: HubCommitAttemptSnapshot;
    actionRecord: HubActionRecordSnapshot;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    evidenceBundle: HubBookingEvidenceBundleSnapshot;
    confirmationGate: ExternalConfirmationGateSnapshot;
    recordedAt: string;
    actorRef: string;
    routeIntentBindingRef: string;
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    sourceBookingReference: string;
    patientFacingReference: string;
    appointmentVersionRef: string;
    supplierAppointmentRef?: string | null;
    manageCapabilitiesRef?: string | null;
    practiceAckDueAt?: string | null;
    sourceRefs?: readonly string[];
    authorityDecision?: HubCommandAuthorityDecision | null;
    policyFacts?: Partial<PolicyEvaluationFactsSnapshot>;
  }): Promise<HubCommitMutationResult> {
    invariant(
      input.confirmationGate.state === "confirmed",
      "CONFIRMATION_GATE_NOT_CLEARED",
      "Booked truth is legal only when the confirmation gate is confirmed.",
    );
    const hubCaseBundle = requireHubCaseBundle(
      await options.hubCaseService.queryHubCaseBundle(input.attempt.hubCoordinationCaseId),
      input.attempt.hubCoordinationCaseId,
    );
    const currentTruth = await requireCurrentTruthProjection(
      options.offerRepositories,
      input.attempt.hubCoordinationCaseId,
    );
    invariant(
      currentTruth.truthTupleHash === input.attempt.truthTupleHash &&
        currentTruth.selectedCandidateRef === input.attempt.selectedCandidateRef,
      "TRUTH_TUPLE_DRIFTED",
      "Current truth tuple drifted before booked truth could be finalized.",
    );
    invariant(
      input.attempt.providerAdapterBindingHash.length > 0,
      "PROVIDER_BINDING_HASH_REQUIRED",
      "Provider binding hash is required before finalization.",
    );
    const duplicateAppointment = await repositories.findAppointmentBySourceBookingReference(
      input.sourceBookingReference,
    );
    invariant(
      duplicateAppointment === null ||
        duplicateAppointment.toSnapshot().hubCoordinationCaseId === input.attempt.hubCoordinationCaseId,
      "DUPLICATE_SUPPLIER_BOOKING_REFERENCE",
      "Supplier booking reference is already bound to another hub appointment.",
    );

    const appointment = duplicateAppointment
      ? {
          ...duplicateAppointment.toSnapshot(),
          commitAttemptId: input.attempt.commitAttemptId,
          supplierAppointmentRef: optionalRef(input.supplierAppointmentRef),
          patientFacingReference: requireRef(input.patientFacingReference, "patientFacingReference"),
          appointmentVersionRef: requireRef(input.appointmentVersionRef, "appointmentVersionRef"),
          appointmentState: "confirmed_pending_practice_ack" as const,
          externalConfirmationState: "confirmed" as const,
          practiceAcknowledgementState: "ack_pending" as const,
          manageCapabilitiesRef: optionalRef(input.manageCapabilitiesRef),
          truthTupleHash: input.attempt.truthTupleHash,
          selectedCandidateRef: input.attempt.selectedCandidateRef,
          capacityUnitRef: input.attempt.capacityUnitRef,
          providerAdapterBindingHash: input.attempt.providerAdapterBindingHash,
          sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
          version: nextVersion(duplicateAppointment.toSnapshot().version),
        }
      : ({
          hubAppointmentId: nextId(idGenerator, "hubAppointment"),
          hubCoordinationCaseId: input.attempt.hubCoordinationCaseId,
          commitAttemptId: input.attempt.commitAttemptId,
          sourceBookingReference: requireRef(input.sourceBookingReference, "sourceBookingReference"),
          supplierAppointmentRef: optionalRef(input.supplierAppointmentRef),
          patientFacingReference: requireRef(input.patientFacingReference, "patientFacingReference"),
          appointmentVersionRef: requireRef(input.appointmentVersionRef, "appointmentVersionRef"),
          appointmentState: "confirmed_pending_practice_ack",
          externalConfirmationState: "confirmed",
          practiceAcknowledgementState: "ack_pending",
          manageCapabilitiesRef: optionalRef(input.manageCapabilitiesRef),
          truthTupleHash: input.attempt.truthTupleHash,
          selectedCandidateRef: input.attempt.selectedCandidateRef,
          capacityUnitRef: input.attempt.capacityUnitRef,
          providerAdapterBindingHash: input.attempt.providerAdapterBindingHash,
          sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
          version: 1,
        } satisfies HubAppointmentRecordSnapshot);

    const practiceVisibilityPolicy = await options.policyService.evaluateHubCaseAgainstPolicy({
      hubCoordinationCaseId: input.attempt.hubCoordinationCaseId,
      pcnRef: hubCaseBundle.hubCase.servingPcnId,
      evaluationScope: "practice_visibility_generation",
      evaluatedAt: input.recordedAt,
      presentedPolicyTupleHash: currentTruth.policyTupleHash,
      facts: derivePolicyFacts({
        candidateSnapshot: await requireSnapshot(
          options.capacityRepositories.getSnapshot(
            requireRef(hubCaseBundle.hubCase.candidateSnapshotRef, "candidateSnapshotRef"),
          ),
          "NETWORK_CANDIDATE_SNAPSHOT_NOT_FOUND",
          "Hub case candidate snapshot could not be found.",
        ),
        selectedCandidate: await requireSnapshot(
          options.capacityRepositories.getCandidate(input.attempt.selectedCandidateRef),
          "NETWORK_SLOT_CANDIDATE_NOT_FOUND",
          "Selected candidate could not be found.",
        ),
        truthProjection: currentTruth,
        minimumNecessaryContractRef:
          input.authorityDecision?.actingContext.minimumNecessaryContractRef ?? null,
        evaluatedAt: input.recordedAt,
        overrides: {
          ackDebtOpen: true,
          visibilityDeltaRequired: true,
          ...(input.policyFacts ?? {}),
        },
      }),
    });

    const reservationDocument = await reservationDependencies.getCapacityReservation(
      input.attempt.reservationRef,
    );
    invariant(
      reservationDocument !== null,
      "CAPACITY_RESERVATION_NOT_FOUND",
      "CapacityReservation is required before finalization.",
    );
    const reservation = reservationDocument.toSnapshot();
    const confirmedReservation = await reservationAuthority.recordCapacityReservation(
      {
        reservationId: reservation.reservationId,
        capacityIdentityRef: reservation.capacityIdentityRef,
        canonicalReservationKey: reservation.canonicalReservationKey,
        sourceDomain: reservation.sourceDomain,
        holderRef: reservation.holderRef,
        state: "confirmed",
        commitMode: reservation.commitMode,
        reservationVersion: reservation.reservationVersion + 1,
        activeFencingToken: reservation.activeFencingToken,
        truthBasisHash: reservation.truthBasisHash,
        supplierObservedAt: input.recordedAt,
        revalidatedAt: input.recordedAt,
        confirmedAt: input.recordedAt,
        expiresAt:
          reservation.expiresAt === null || compareIso(reservation.expiresAt, input.recordedAt) < 0
            ? input.recordedAt
            : reservation.expiresAt,
      },
      { expectedVersion: reservationDocument.version },
    );

    const continuityCurrent = (
      await repositories.getContinuityProjectionForCase(input.attempt.hubCoordinationCaseId)
    )?.toSnapshot();
    const continuityProjection = continuityCurrent
      ? updateContinuityProjection(
          continuityCurrent,
          {
            governingObjectRef: appointment.hubAppointmentId,
            latestSettlementRef: null,
            latestContinuationRef: appointment.hubAppointmentId,
            experienceContinuityEvidenceRef: input.attempt.experienceContinuityEvidenceRef,
            validationState: "trusted",
            blockingRefs: ["practice_ack_pending"],
            causalToken: nextId(idGenerator, "hubContinuityProjectionCausalToken"),
          },
          input.recordedAt,
        )
      : ({
          hubContinuityEvidenceProjectionId: nextId(idGenerator, "hubContinuityEvidenceProjection"),
          hubCoordinationCaseId: input.attempt.hubCoordinationCaseId,
          controlCode: "hub_booking_manage",
          routeFamilyRef: input.attempt.routeFamilyRef,
          routeContinuityEvidenceContractRef: input.attempt.routeContinuityEvidenceContractRef,
          governingObjectRef: appointment.hubAppointmentId,
          selectedAnchorRef: input.attempt.selectedAnchorRef,
          selectedAnchorTupleHashRef: input.attempt.selectedAnchorTupleHashRef,
          continuityEnvelopeVersionRef: input.attempt.continuityEnvelopeVersionRef,
          surfacePublicationRef: input.attempt.surfacePublicationRef,
          runtimePublicationBundleRef: input.attempt.runtimePublicationBundleRef,
          latestSettlementRef: null,
          latestContinuationRef: appointment.hubAppointmentId,
          experienceContinuityEvidenceRef: input.attempt.experienceContinuityEvidenceRef,
          validationState: "trusted",
          blockingRefs: ["practice_ack_pending"],
          causalToken: nextId(idGenerator, "hubContinuityProjectionCausalToken"),
          monotoneRevision: 1,
          capturedAt: input.recordedAt,
          sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
          version: 1,
          continuityTupleHash: "",
        } satisfies Omit<HubContinuityEvidenceProjectionSnapshot, "continuityTupleHash"> & {
          continuityTupleHash: string;
        });
    const normalizedContinuity =
      "continuityTupleHash" in continuityProjection && continuityProjection.continuityTupleHash.length > 0
        ? continuityProjection
        : {
            ...continuityProjection,
            continuityTupleHash: computeContinuityTupleHash({
              ...continuityProjection,
              continuityTupleHash: undefined as never,
            }),
          };

    const confirmationTruthState = deriveCommitTruthState({
      gateState: "confirmed",
      settlementResult: "booked_pending_ack",
    });
    const practiceVisibilityState = derivePracticeVisibilityState({
      confirmationTruthState,
    });
    const closureState = deriveClosureState({
      confirmationTruthState,
      practiceVisibilityState,
      fallbackLinkState: currentTruth.fallbackLinkState,
    });
    const updatedTruth = updateTruthProjection(
      currentTruth,
      {
        commitAttemptRef: input.attempt.commitAttemptId,
        bookingEvidenceRef: input.evidenceBundle.evidenceBundleId,
        confirmationGateRef: input.confirmationGate.gateId,
        hubAppointmentId: appointment.hubAppointmentId,
        confirmationTruthState,
        patientVisibilityState: derivePatientVisibilityState({ confirmationTruthState }),
        practiceVisibilityState,
        closureState,
        experienceContinuityEvidenceRef: normalizedContinuity.hubContinuityEvidenceProjectionId,
        blockingRefs: deriveBlockingRefs({
          settlementResult: "booked_pending_ack",
          confirmationTruthState,
          practiceVisibilityState,
          closureState,
        }),
      },
      input.recordedAt,
    );

    const nextAckGeneration = hubCaseBundle.hubCase.practiceAckGeneration + 1;
    const hubTransition =
      await options.hubCaseService.markBookedPendingPracticeAcknowledgement(
        buildTransitionCommand(hubCaseBundle.hubCase, {
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          recordedAt: input.recordedAt,
          reasonCode: "hub_commit_confirmed_pending_ack",
          networkAppointmentRef: appointment.hubAppointmentId,
          offerToConfirmationTruthRef: updatedTruth.hubOfferToConfirmationTruthProjectionId,
          practiceAckGeneration: nextAckGeneration,
          practiceAckDueAt:
            optionalRef(input.practiceAckDueAt) ?? addMinutes(input.recordedAt, 120),
          carriedOpenCaseBlockerRefs: updatedTruth.blockingRefs,
        }),
      );

    const confirmedAttempt: HubCommitAttemptSnapshot = {
      ...input.attempt,
      attemptState: "confirmed",
      externalResponseState: "authoritative_confirmed",
      externalBookingRef: input.sourceBookingReference,
      continuityEvidenceProjectionRef: normalizedContinuity.hubContinuityEvidenceProjectionId,
      truthTupleHash: updatedTruth.truthTupleHash,
      confirmationConfidence: input.confirmationGate.confirmationConfidence,
      competingAttemptMargin: input.confirmationGate.competingGateMargin,
      updatedAt: input.recordedAt,
      finalizedAt: input.recordedAt,
      version: nextVersion(input.attempt.version),
    };

    const existingMirror = (
      await repositories.getMirrorStateForAppointment(appointment.hubAppointmentId)
    )?.toSnapshot();
    const mirrorState: HubSupplierMirrorStateSnapshot = existingMirror
      ? {
          ...existingMirror,
          supplierVersion: input.attempt.providerSourceVersion,
          lastSyncAt: input.recordedAt,
          nextSyncDueAt: addMinutes(input.recordedAt, 60),
          driftState: "aligned",
          manageFreezeState: "live",
          lastObservedStatus: "booked",
          stateConfidenceBand: "high",
          truthTupleHash: updatedTruth.truthTupleHash,
          monotoneRevision: existingMirror.monotoneRevision + 1,
          sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
          version: nextVersion(existingMirror.version),
        }
      : {
          hubSupplierMirrorStateId: nextId(idGenerator, "hubSupplierMirrorState"),
          hubCoordinationCaseId: appointment.hubCoordinationCaseId,
          hubAppointmentId: appointment.hubAppointmentId,
          supplierSystem: providerSystemFromBinding({
            bindingRef: input.attempt.providerAdapterBindingRef,
            sourceMode: "native_api_feed",
            sourceRef: input.attempt.providerAdapterBindingRef,
            sourceIdentity: input.attempt.providerAdapterBindingRef,
            sourceVersion: input.attempt.providerSourceVersion,
            fetchedAt: input.recordedAt,
            trustRecord: {
              sourceTrustRef: "derived",
              trustLowerBound: 1,
              completenessState: "complete",
              hardBlock: false,
              observedTrustState: "trusted",
              evaluatedAt: input.recordedAt,
              reviewDueAt: addMinutes(input.recordedAt, 60),
            },
            capacityRows: [],
            sourceRefs: [],
          }),
          supplierVersion: input.attempt.providerSourceVersion,
          lastSyncAt: input.recordedAt,
          nextSyncDueAt: addMinutes(input.recordedAt, 60),
          driftState: "aligned",
          manageFreezeState: "live",
          lastObservedStatus: "booked",
          latestContinuityMessageRef: null,
          latestDriftHookRef: null,
          transitionEnvelopeRef: null,
          stateConfidenceBand: "high",
          causalToken: nextId(idGenerator, "hubSupplierMirrorCausalToken"),
          monotoneRevision: 1,
          reopenTaskRef: null,
          truthTupleHash: updatedTruth.truthTupleHash,
          sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
          version: 1,
        };

    return writeSettlementAndTruth({
      attempt: confirmedAttempt,
      actionRecord: input.actionRecord,
      truthProjection: updatedTruth,
      evidenceBundle: input.evidenceBundle,
      appointment,
      continuityProjection: normalizedContinuity,
      mirrorState,
      reservation: confirmedReservation.toSnapshot(),
      confirmationGate: input.confirmationGate,
      result: "booked_pending_ack",
      recordedAt: input.recordedAt,
      sourceRefs: input.sourceRefs,
      hubTransition,
      policyEvaluation: practiceVisibilityPolicy,
      authorityDecision: input.authorityDecision ?? null,
    });
  }

  async function upsertContinuityProjection(input: {
    attempt: HubCommitAttemptSnapshot;
    currentTruth: HubOfferToConfirmationTruthProjectionSnapshot;
    recordedAt: string;
    validationState: HubContinuityValidationState;
    blockingRefs: readonly string[];
    latestSettlementRef?: string | null;
    latestContinuationRef?: string | null;
    sourceRefs?: readonly string[];
  }): Promise<HubContinuityEvidenceProjectionSnapshot> {
    const existing = (
      await repositories.getContinuityProjectionForCase(input.attempt.hubCoordinationCaseId)
    )?.toSnapshot();
    if (existing) {
      return updateContinuityProjection(
        existing,
        {
          governingObjectRef: input.attempt.commitAttemptId,
          selectedAnchorRef: input.attempt.selectedAnchorRef,
          selectedAnchorTupleHashRef: input.attempt.selectedAnchorTupleHashRef,
          continuityEnvelopeVersionRef: input.attempt.continuityEnvelopeVersionRef,
          surfacePublicationRef: input.attempt.surfacePublicationRef,
          runtimePublicationBundleRef: input.attempt.runtimePublicationBundleRef,
          latestSettlementRef:
            input.latestSettlementRef === undefined
              ? existing.latestSettlementRef
              : input.latestSettlementRef,
          latestContinuationRef:
            input.latestContinuationRef === undefined
              ? existing.latestContinuationRef
              : input.latestContinuationRef,
          experienceContinuityEvidenceRef: input.attempt.experienceContinuityEvidenceRef,
          validationState: input.validationState,
          blockingRefs: uniqueSortedRefs(input.blockingRefs),
          causalToken: nextId(idGenerator, "hubContinuityProjectionCausalToken"),
        },
        input.recordedAt,
      );
    }
    const createdCore = {
      hubContinuityEvidenceProjectionId: nextId(idGenerator, "hubContinuityEvidenceProjection"),
      hubCoordinationCaseId: input.attempt.hubCoordinationCaseId,
      controlCode: "hub_booking_manage" as const,
      routeFamilyRef: input.attempt.routeFamilyRef,
      routeContinuityEvidenceContractRef: input.attempt.routeContinuityEvidenceContractRef,
      governingObjectRef: input.attempt.commitAttemptId,
      selectedAnchorRef: input.attempt.selectedAnchorRef,
      selectedAnchorTupleHashRef: input.attempt.selectedAnchorTupleHashRef,
      continuityEnvelopeVersionRef: input.attempt.continuityEnvelopeVersionRef,
      surfacePublicationRef: input.attempt.surfacePublicationRef,
      runtimePublicationBundleRef: input.attempt.runtimePublicationBundleRef,
      latestSettlementRef: input.latestSettlementRef ?? null,
      latestContinuationRef: input.latestContinuationRef ?? null,
      experienceContinuityEvidenceRef: input.attempt.experienceContinuityEvidenceRef,
      validationState: input.validationState,
      blockingRefs: uniqueSortedRefs(input.blockingRefs),
      causalToken: nextId(idGenerator, "hubContinuityProjectionCausalToken"),
      monotoneRevision: 1,
      capturedAt: input.recordedAt,
      sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
      version: 1,
    };
    return {
      ...createdCore,
      continuityTupleHash: computeContinuityTupleHash({
        ...createdCore,
        continuityTupleHash: undefined as never,
      }),
    };
  }

  const service: Phase5HubCommitEngineService = {
    repositories,

    async beginCommitAttempt(input) {
      const existingReplay = await repositories.findCommitAttemptByIdempotencyKey(input.idempotencyKey);
      if (existingReplay) {
        const replayAttempt = existingReplay.toSnapshot();
        const replayTruth = await requireCurrentTruthProjection(
          options.offerRepositories,
          replayAttempt.hubCoordinationCaseId,
        );
        const replayReservation = await reservationDependencies.getCapacityReservation(
          replayAttempt.reservationRef,
        );
        invariant(replayReservation !== null, "CAPACITY_RESERVATION_NOT_FOUND", "CapacityReservation is missing.");
        const replayAction = await requireSnapshot(
          repositories.getActionRecord(replayAttempt.commandActionRef),
          "HUB_ACTION_RECORD_NOT_FOUND",
          "HubActionRecord is missing for replayed attempt.",
        );
        const replayPolicy = await options.policyService.evaluateHubCaseAgainstPolicy({
          hubCoordinationCaseId: replayAttempt.hubCoordinationCaseId,
          evaluationScope: "commit_attempt",
          evaluatedAt: input.recordedAt,
        });
        const replayBundle = requireHubCaseBundle(
          await options.hubCaseService.queryHubCaseBundle(replayAttempt.hubCoordinationCaseId),
          replayAttempt.hubCoordinationCaseId,
        );
        return {
          actionRecord: replayAction,
          commitAttempt: replayAttempt,
          reservation: replayReservation.toSnapshot(),
          confirmationGate: replayAttempt.confirmationGateRef
            ? (
                await reservationDependencies.getExternalConfirmationGate(
                  replayAttempt.confirmationGateRef,
                )
              )?.toSnapshot() ?? null
            : null,
          truthProjection: replayTruth,
          policyEvaluation: replayPolicy,
          authorityDecision: null,
          hubTransition:
            replayBundle.hubCase.status === "native_booking_pending"
              ? null
              : await options.hubCaseService.enterNativeBookingPending(
                  buildTransitionCommand(replayBundle.hubCase, {
                    actorRef: input.actorRef,
                    routeIntentBindingRef: input.routeIntentBindingRef,
                    commandActionRecordRef: input.commandActionRecordRef,
                    commandSettlementRecordRef: input.commandSettlementRecordRef,
                    recordedAt: input.recordedAt,
                    reasonCode: "hub_commit_replay",
                    bookingEvidenceRef: replayAttempt.primaryEvidenceBundleRef,
                    carriedOpenCaseBlockerRefs: replayTruth.blockingRefs,
                  }),
                ),
          replayed: true,
        };
      }

      const authorityDecision = await assertAuthority(input.authority);
      const context = await resolveCommitContext({
        hubCoordinationCaseId: input.hubCoordinationCaseId,
        selectedCandidateRef: input.selectedCandidateRef,
        selectedOfferSessionRef: input.selectedOfferSessionRef,
        presentedTruthTupleHash: input.presentedTruthTupleHash,
        providerAdapterBinding: input.providerAdapterBinding,
        policyFacts: input.policyFacts,
        minimumNecessaryContractRef:
          authorityDecision?.actingContext.minimumNecessaryContractRef ?? null,
        evaluatedAt: input.recordedAt,
      });

      const existingLiveAttempt = (await repositories.listCommitAttemptsForCase(input.hubCoordinationCaseId))
        .map((document) => document.toSnapshot())
        .find(
          (attempt) =>
            liveAttemptStates(attempt.attemptState) &&
            attempt.capacityUnitRef === context.selectedCandidate.capacityUnitRef,
        );
      if (existingLiveAttempt) {
        const liveReservation = await reservationDependencies.getCapacityReservation(
          existingLiveAttempt.reservationRef,
        );
        invariant(liveReservation !== null, "CAPACITY_RESERVATION_NOT_FOUND", "CapacityReservation is missing.");
        const liveAction = await requireSnapshot(
          repositories.getActionRecord(existingLiveAttempt.commandActionRef),
          "HUB_ACTION_RECORD_NOT_FOUND",
          "HubActionRecord is missing for live attempt.",
        );
        const liveBundle = requireHubCaseBundle(
          await options.hubCaseService.queryHubCaseBundle(input.hubCoordinationCaseId),
          input.hubCoordinationCaseId,
        );
        return {
          actionRecord: liveAction,
          commitAttempt: existingLiveAttempt,
          reservation: liveReservation.toSnapshot(),
          confirmationGate: existingLiveAttempt.confirmationGateRef
            ? (
                await reservationDependencies.getExternalConfirmationGate(
                  existingLiveAttempt.confirmationGateRef,
                )
              )?.toSnapshot() ?? null
            : null,
          truthProjection: context.truthProjection,
          policyEvaluation: context.policyEvaluation,
          authorityDecision,
          hubTransition:
            liveBundle.hubCase.status === "native_booking_pending"
              ? null
              : await options.hubCaseService.enterNativeBookingPending(
                  buildTransitionCommand(liveBundle.hubCase, {
                    actorRef: input.actorRef,
                    routeIntentBindingRef: input.routeIntentBindingRef,
                    commandActionRecordRef: input.commandActionRecordRef,
                    commandSettlementRecordRef: input.commandSettlementRecordRef,
                    recordedAt: input.recordedAt,
                    reasonCode: "hub_commit_existing_live_attempt",
                    bookingEvidenceRef: existingLiveAttempt.primaryEvidenceBundleRef,
                    carriedOpenCaseBlockerRefs: context.truthProjection.blockingRefs,
                  }),
                ),
          replayed: true,
        };
      }

      const blockingReasonRefs = buildAttemptBlockingReasons({
        selectedCandidate: context.selectedCandidate,
        candidateSnapshot: context.candidateSnapshot,
        directCommitFrontierRefs: context.decisionPlan.directCommitFrontierRefs,
        policyEvaluation: context.policyEvaluation,
        providerBindingHash: context.providerAdapterBindingHash,
        currentTruthTupleHash: context.truthProjection.truthTupleHash,
        presentedTruthTupleHash: input.presentedTruthTupleHash,
        presentedCandidateRef:
          optionalRef(input.selectedCandidateRef) ?? context.truthProjection.selectedCandidateRef ?? "",
        asOf: input.recordedAt,
      });

      const commitAttemptId = nextId(idGenerator, "hubCommitAttempt");
      const primaryEvidenceBundleRef = nextId(idGenerator, "hubBookingEvidenceBundle");
      const reservationCommitMode = deriveReservationCommitMode(
        input.commitMode,
        input.supportsExclusiveHold ?? true,
      );
      const initialReservationState =
        blockingReasonRefs.length > 0
          ? "released"
          : reservationCommitMode === "exclusive_hold"
            ? "held"
            : "soft_selected";
      const initialReservation = await reservationAuthority.recordCapacityReservation({
        reservationId: nextId(idGenerator, "capacityReservation"),
        capacityIdentityRef: context.selectedCandidate.capacityUnitRef,
        canonicalReservationKey: canonicalReservationKeyForCapacityUnit(
          context.selectedCandidate.capacityUnitRef,
        ),
        sourceDomain: "hub_booking",
        holderRef: commitAttemptId,
        state: initialReservationState,
        commitMode: reservationCommitMode,
        supplierObservedAt: input.recordedAt,
        revalidatedAt: input.recordedAt,
        expiresAt: optionalRef(input.reservationExpiresAt) ?? addMinutes(input.recordedAt, 15),
        releasedAt: blockingReasonRefs.length > 0 ? input.recordedAt : undefined,
        terminalReasonCode:
          blockingReasonRefs.length > 0 ? blockingReasonRefs[0] ?? "stale_candidate" : undefined,
      });
      const initialReservationSnapshot = initialReservation.toSnapshot();
      const reservationProjection = await reservationAuthority.refreshReservationTruthProjection({
        reservationId: initialReservationSnapshot.reservationId,
        sourceObjectRef: commitAttemptId,
        selectedAnchorRef: context.selectedCandidate.candidateId,
        projectionFreshnessEnvelopeRef: `${commitAttemptId}::freshness`,
        generatedAt: input.recordedAt,
        currentTruthBasisHash: initialReservationSnapshot.truthBasisHash,
      });

      const actionRecord = buildActionRecord(idGenerator, {
        hubCase: context.hubCaseBundle.hubCase,
        actionScope: actionScopeForMode(input.commitMode),
        governingObjectRef: commitAttemptId,
        reservationFenceToken: requireRef(
          initialReservationSnapshot.activeFencingToken,
          "activeFencingToken",
        ),
        actingContextRef: authorityDecision?.actingContext.actingContextId ?? null,
        compiledPolicyBundleRef: context.policyEvaluation.compiledPolicy.compiledPolicyBundleRef,
        enhancedAccessPolicyRef: context.policyEvaluation.compiledPolicy.policyId,
        policyEvaluationRef: context.policyEvaluation.evaluation.policyEvaluationId,
        policyTupleHash: context.policyEvaluation.evaluation.policyTupleHash,
        idempotencyKey: input.idempotencyKey,
        createdByRef: input.actorRef,
        createdAt: input.recordedAt,
        sourceRefs: input.sourceRefs,
      });

      const commitAttempt: HubCommitAttemptSnapshot = {
        commitAttemptId,
        hubCoordinationCaseId: input.hubCoordinationCaseId,
        commitMode: input.commitMode,
        selectedCandidateRef: context.selectedCandidate.candidateId,
        selectedOfferSessionRef:
          optionalRef(input.selectedOfferSessionRef) ?? context.truthProjection.offerSessionRef,
        selectedOfferEntryRef:
          optionalRef(input.selectedOfferEntryRef),
        capacityUnitRef: context.selectedCandidate.capacityUnitRef,
        reservationRef: initialReservationSnapshot.reservationId,
        reservationTruthProjectionRef: reservationProjection.reservationTruthProjectionId,
        reservationFenceToken: requireRef(
          initialReservationSnapshot.activeFencingToken,
          "activeFencingToken",
        ),
        providerAdapterBindingRef: input.providerAdapterBinding.bindingRef,
        providerAdapterBindingHash: context.providerAdapterBindingHash,
        providerSourceVersion: input.providerAdapterBinding.sourceVersion,
        truthTupleHash: context.truthProjection.truthTupleHash,
        policyTupleHash: context.policyEvaluation.evaluation.policyTupleHash,
        lineageFenceEpoch: context.hubCaseBundle.hubCase.ownershipEpoch,
        idempotencyKey: input.idempotencyKey,
        attemptState: blockingReasonRefs.length > 0 ? "failed" : "executing",
        journalState: "intent_written",
        externalResponseState: "not_started",
        externalBookingRef: null,
        adapterCorrelationKey: null,
        confirmationGateRef: null,
        primaryEvidenceBundleRef,
        confirmationConfidence: 0,
        competingAttemptMargin: 0,
        continuityEvidenceProjectionRef: null,
        blockingReasonRefs,
        commandActionRef: actionRecord.hubActionRecordId,
        commandSettlementRef: input.commandSettlementRecordRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        surfaceRouteContractRef:
          context.session?.surfaceRouteContractRef ?? "hub_case_detail_surface_contract_v1",
        surfacePublicationRef:
          context.session?.surfacePublicationRef ?? "hub_case_detail_publication_v1",
        runtimePublicationBundleRef:
          context.session?.runtimePublicationBundleRef ?? "hub_case_detail_runtime_bundle_v1",
        releaseRecoveryDispositionRef: context.session?.releaseRecoveryDispositionRef ?? null,
        routeFamilyRef: context.session?.routeFamilyRef ?? "hub_case_detail",
        routeContinuityEvidenceContractRef: "HubContinuityEvidenceContract.commit.v1",
        selectedAnchorRef: context.session?.selectedAnchorRef ?? context.selectedCandidate.candidateId,
        selectedAnchorTupleHashRef:
          context.session?.selectedAnchorTupleHashRef ?? context.truthProjection.truthTupleHash,
        transitionEnvelopeRef:
          context.session?.transitionEnvelopeRef ?? `${commitAttemptId}::transition`,
        continuityEnvelopeVersionRef:
          context.session?.visibilityEnvelopeVersionRef ?? `${commitAttemptId}::continuity`,
        experienceContinuityEvidenceRef:
          context.session?.experienceContinuityEvidenceRef ?? `${commitAttemptId}::continuity`,
        confirmationDeadlineAt:
          optionalRef(input.confirmationDeadlineAt) ?? addMinutes(input.recordedAt, 60),
        createdAt: input.recordedAt,
        updatedAt: input.recordedAt,
        finalizedAt: blockingReasonRefs.length > 0 ? input.recordedAt : null,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version: 1,
      };

      const revalidatingTransition = await options.hubCaseService.enterCandidateRevalidating(
        buildTransitionCommand(context.hubCaseBundle.hubCase, {
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          recordedAt: input.recordedAt,
          reasonCode: "hub_commit_candidate_revalidated",
          selectedCandidateRef: context.selectedCandidate.candidateId,
          carriedOpenCaseBlockerRefs: blockingReasonRefs,
        }),
      );

      if (blockingReasonRefs.length > 0) {
        const staleTruthState = deriveCommitTruthState({
          settlementResult: "stale_candidate",
          gateState: "disputed",
        });
        const truthProjection = updateTruthProjection(
          context.truthProjection,
          {
            commitAttemptRef: commitAttemptId,
            bookingEvidenceRef: primaryEvidenceBundleRef,
            confirmationTruthState: staleTruthState,
            patientVisibilityState: derivePatientVisibilityState({
              confirmationTruthState: staleTruthState,
            }),
            practiceVisibilityState: derivePracticeVisibilityState({
              confirmationTruthState: staleTruthState,
            }),
            closureState: deriveClosureState({
              confirmationTruthState: staleTruthState,
              practiceVisibilityState: derivePracticeVisibilityState({
                confirmationTruthState: staleTruthState,
              }),
              fallbackLinkState: context.truthProjection.fallbackLinkState,
            }),
            blockingRefs: deriveBlockingRefs({
              settlementResult: "stale_candidate",
              confirmationTruthState: staleTruthState,
              practiceVisibilityState: derivePracticeVisibilityState({
                confirmationTruthState: staleTruthState,
              }),
              closureState: deriveClosureState({
                confirmationTruthState: staleTruthState,
                practiceVisibilityState: derivePracticeVisibilityState({
                  confirmationTruthState: staleTruthState,
                }),
                fallbackLinkState: context.truthProjection.fallbackLinkState,
              }),
              additionalReasonRefs: blockingReasonRefs,
            }),
          },
          input.recordedAt,
        );
        const releasedReservation = await reservationAuthority.recordCapacityReservation(
          {
            reservationId: initialReservationSnapshot.reservationId,
            capacityIdentityRef: initialReservationSnapshot.capacityIdentityRef,
            canonicalReservationKey: initialReservationSnapshot.canonicalReservationKey,
            sourceDomain: initialReservationSnapshot.sourceDomain,
            holderRef: initialReservationSnapshot.holderRef,
            state: "released",
            commitMode: initialReservationSnapshot.commitMode,
            reservationVersion: initialReservationSnapshot.reservationVersion + 1,
            activeFencingToken: initialReservationSnapshot.activeFencingToken,
            truthBasisHash: initialReservationSnapshot.truthBasisHash,
            supplierObservedAt: input.recordedAt,
            revalidatedAt: input.recordedAt,
            releasedAt: input.recordedAt,
            terminalReasonCode: blockingReasonRefs[0] ?? "stale_candidate",
          },
          { expectedVersion: initialReservation.version },
        );
        const staleTruthTupleHash = truthProjection.truthTupleHash;
        const staleAttempt: HubCommitAttemptSnapshot = {
          ...commitAttempt,
          truthTupleHash: staleTruthTupleHash,
        };
        const alternativesTransition = context.hubCaseBundle.hubCase.activeAlternativeOfferSessionRef
          ? await options.hubCaseService.enterAlternativesOffered(
              buildTransitionCommand(revalidatingTransition.hubCase, {
                actorRef: input.actorRef,
                routeIntentBindingRef: input.routeIntentBindingRef,
                commandActionRecordRef: input.commandActionRecordRef,
                commandSettlementRecordRef: input.commandSettlementRecordRef,
                recordedAt: input.recordedAt,
                reasonCode: "hub_commit_stale_candidate",
                activeAlternativeOfferSessionRef:
                  context.hubCaseBundle.hubCase.activeAlternativeOfferSessionRef,
                activeOfferOptimisationPlanRef:
                  context.hubCaseBundle.hubCase.activeOfferOptimisationPlanRef,
                latestOfferRegenerationSettlementRef:
                  context.hubCaseBundle.hubCase.latestOfferRegenerationSettlementRef,
                offerToConfirmationTruthRef:
                  context.hubCaseBundle.hubCase.offerToConfirmationTruthRef,
                carriedOpenCaseBlockerRefs: truthProjection.blockingRefs,
              }),
            )
          : revalidatingTransition;
        const settlement = buildSettlement(idGenerator, {
          hubCoordinationCaseId: input.hubCoordinationCaseId,
          actionRecord,
          commitAttempt: staleAttempt,
          result: "stale_candidate",
          stateConfidenceBand: "low",
          recordedAt: input.recordedAt,
          sourceRefs: input.sourceRefs,
        });
        await repositories.saveActionRecord(actionRecord);
        await repositories.saveCommitAttempt(staleAttempt);
        await options.offerRepositories.saveTruthProjection(truthProjection);
        await repositories.saveSettlement(settlement);
        return {
          actionRecord,
          commitAttempt: staleAttempt,
          reservation: releasedReservation.toSnapshot(),
          confirmationGate: null,
          truthProjection,
          policyEvaluation: context.policyEvaluation,
          authorityDecision,
          hubTransition: alternativesTransition,
          replayed: false,
        };
      }

      const nativePendingTransition = await options.hubCaseService.enterNativeBookingPending(
        buildTransitionCommand(revalidatingTransition.hubCase, {
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          recordedAt: input.recordedAt,
          reasonCode: "hub_commit_attempt_started",
          bookingEvidenceRef: primaryEvidenceBundleRef,
          carriedOpenCaseBlockerRefs: ["confirmation_gate_pending"],
        }),
      );

      const truthProjection = updateTruthProjection(
        context.truthProjection,
        {
          commitAttemptRef: commitAttemptId,
          bookingEvidenceRef: primaryEvidenceBundleRef,
          selectedCandidateRef: context.selectedCandidate.candidateId,
          selectedCapacityUnitRef: context.selectedCandidate.capacityUnitRef,
          selectedCandidateSourceVersion: context.selectedCandidate.sourceRef,
          confirmationTruthState: "native_booking_pending",
          patientVisibilityState: "provisional_receipt",
          practiceVisibilityState: "not_started",
          closureState: "blocked_by_confirmation",
          blockingRefs: ["confirmation_gate_pending"],
        },
        input.recordedAt,
      );
      const executingAttempt: HubCommitAttemptSnapshot = {
        ...commitAttempt,
        truthTupleHash: truthProjection.truthTupleHash,
      };

      await repositories.saveActionRecord(actionRecord);
      await repositories.saveCommitAttempt(executingAttempt);
      await options.offerRepositories.saveTruthProjection(truthProjection);

      return {
        actionRecord,
        commitAttempt: executingAttempt,
        reservation: initialReservationSnapshot,
        confirmationGate: null,
        truthProjection,
        policyEvaluation: context.policyEvaluation,
        authorityDecision,
        hubTransition: nativePendingTransition,
        replayed: false,
      };
    },

    async submitNativeApiCommit(input) {
      const authorityDecision = await assertAuthority(input.authority);
      const attempt = await requireSnapshot(
        repositories.getCommitAttempt(input.commitAttemptId),
        "HUB_COMMIT_ATTEMPT_NOT_FOUND",
        "HubCommitAttempt could not be found.",
      );
      invariant(
        attempt.commitMode === "native_api",
        "INVALID_COMMIT_MODE",
        "submitNativeApiCommit requires a native_api attempt.",
      );
      if (
        attempt.attemptState === "awaiting_confirmation" ||
        attempt.attemptState === "confirmed" ||
        attempt.attemptState === "reconciliation_required"
      ) {
        const currentTruth = await requireCurrentTruthProjection(
          options.offerRepositories,
          attempt.hubCoordinationCaseId,
        );
        const currentAction = await requireSnapshot(
          repositories.getActionRecord(attempt.commandActionRef),
          "HUB_ACTION_RECORD_NOT_FOUND",
          "HubActionRecord is missing.",
        );
        const currentEvidence = (
          await repositories.getEvidenceBundle(attempt.primaryEvidenceBundleRef)
        )?.toSnapshot() ?? null;
        const currentAppointment =
          currentTruth.hubAppointmentId === null
            ? null
            : ((await repositories.getAppointmentRecord(currentTruth.hubAppointmentId))?.toSnapshot() ??
              null);
        const currentSettlement = (await repositories.listSettlementsForCase(attempt.hubCoordinationCaseId))
          .map((document) => document.toSnapshot())
          .at(-1);
        invariant(currentSettlement, "HUB_COMMIT_SETTLEMENT_NOT_FOUND", "Settlement is missing.");
        return {
          actionRecord: currentAction,
          commitAttempt: attempt,
          settlement: currentSettlement,
          evidenceBundle: currentEvidence,
          confirmationGate: attempt.confirmationGateRef
            ? (
                await reservationDependencies.getExternalConfirmationGate(attempt.confirmationGateRef)
              )?.toSnapshot() ?? null
            : null,
          appointment: currentAppointment,
          continuityProjection:
            (await repositories.getContinuityProjectionForCase(attempt.hubCoordinationCaseId))?.toSnapshot() ??
            null,
          mirrorState:
            currentAppointment === null
              ? null
              : (
                  await repositories.getMirrorStateForAppointment(currentAppointment.hubAppointmentId)
                )?.toSnapshot() ?? null,
          reconciliationRecord:
            (await repositories.listReconciliationRecordsForAttempt(attempt.commitAttemptId))
              .map((document) => document.toSnapshot())
              .at(-1) ?? null,
          truthProjection: currentTruth,
          policyEvaluation: null,
          authorityDecision,
          hubTransition: null,
        };
      }
      invariant(
        attempt.truthTupleHash === input.presentedTruthTupleHash,
        "STALE_TRUTH_TUPLE",
        "Current truth tuple drifted before native commit submission.",
      );
      invariant(
        attempt.providerAdapterBindingHash === input.presentedProviderAdapterBindingHash,
        "STALE_PROVIDER_BINDING",
        "Current provider binding drifted before native commit submission.",
      );
      invariant(
        attempt.reservationFenceToken === input.presentedReservationFenceToken,
        "STALE_RESERVATION_FENCE",
        "Reservation fence token drifted before native commit submission.",
      );

      const currentTruth = await requireCurrentTruthProjection(
        options.offerRepositories,
        attempt.hubCoordinationCaseId,
      );
      const actionRecord = await requireSnapshot(
        repositories.getActionRecord(attempt.commandActionRef),
        "HUB_ACTION_RECORD_NOT_FOUND",
        "HubActionRecord is missing.",
      );
      const context = await resolveCommitContext({
        hubCoordinationCaseId: attempt.hubCoordinationCaseId,
        selectedCandidateRef: attempt.selectedCandidateRef,
        selectedOfferSessionRef: attempt.selectedOfferSessionRef,
        presentedTruthTupleHash: input.presentedTruthTupleHash,
        providerAdapterBinding: {
          bindingRef: attempt.providerAdapterBindingRef,
          sourceMode: "native_api_feed",
          sourceRef: attempt.providerAdapterBindingRef,
          sourceIdentity: attempt.providerAdapterBindingRef,
          sourceVersion: attempt.providerSourceVersion,
          fetchedAt: input.recordedAt,
          trustRecord: {
            sourceTrustRef: "derived",
            trustLowerBound: 1,
            completenessState: "complete",
            hardBlock: false,
            observedTrustState: "trusted",
            evaluatedAt: input.recordedAt,
            reviewDueAt: addMinutes(input.recordedAt, 60),
          },
          capacityRows: [],
          sourceRefs: [],
        },
        policyFacts: input.policyFacts,
        minimumNecessaryContractRef:
          authorityDecision?.actingContext.minimumNecessaryContractRef ?? null,
        evaluatedAt: input.recordedAt,
      });
      const reservationDocument = await reservationDependencies.getCapacityReservation(
        attempt.reservationRef,
      );
      invariant(
        reservationDocument !== null,
        "CAPACITY_RESERVATION_NOT_FOUND",
        "CapacityReservation is required before native commit submission.",
      );
      const reservation = reservationDocument.toSnapshot();

      if (
        input.response.responseClass === "timeout_unknown" ||
        input.response.responseClass === "split_brain_uncertain"
      ) {
        return this.recordReconciliationRequired({
          commitAttemptId: attempt.commitAttemptId,
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          recordedAt: input.recordedAt,
          reasonCode:
            input.response.responseClass === "timeout_unknown"
              ? "native_timeout_unknown"
              : "split_brain_uncertain",
          reconciliationClass:
            input.response.responseClass === "timeout_unknown"
              ? "external_timeout_unknown"
              : "local_write_failed_after_external_success",
          providerCorrelationRef: input.response.adapterCorrelationKey,
          latestReceiptCheckpointRef: input.response.receiptCheckpointRef,
          dueAt: input.response.reconciliationDueAt ?? addMinutes(input.recordedAt, 30),
          sourceRefs: input.sourceRefs,
        });
      }

      const hardMatchRefsPassed = uniqueSortedRefs(
        input.response.hardMatchRefsPassed ??
          (input.response.responseClass === "authoritative_confirmed"
            ? ["selected_candidate", "capacity_unit", "provider_binding"]
            : []),
      );
      const hardMatchRefsFailed = uniqueSortedRefs(input.response.hardMatchRefsFailed ?? []);
      const contradictoryEvidenceRefs = uniqueSortedRefs(
        input.response.contradictoryEvidenceRefs ?? [],
      );
      const evidenceBundle: HubBookingEvidenceBundleSnapshot = {
        evidenceBundleId: attempt.primaryEvidenceBundleRef,
        hubCoordinationCaseId: attempt.hubCoordinationCaseId,
        commitAttemptId: attempt.commitAttemptId,
        commitMode: attempt.commitMode,
        independentConfirmationState:
          input.response.responseClass === "authoritative_confirmed"
            ? "confirmed"
            : input.response.responseClass === "rejected"
              ? "disputed"
              : "pending",
        confirmationConfidence: 0,
        competingAttemptMargin: 0,
        importedEvidenceRef: null,
        nativeBookingReceiptRef: optionalRef(input.response.receiptCheckpointRef),
        hardMatchResult:
          hardMatchRefsFailed.length > 0
            ? "failed"
            : input.response.responseClass === "authoritative_confirmed"
              ? "passed"
              : "pending",
        evidenceCapturedAt: input.recordedAt,
        truthTupleHash: attempt.truthTupleHash,
        evidenceSourceFamilies: uniqueSortedRefs(input.response.sourceFamilies),
        hardMatchRefsPassed,
        hardMatchRefsFailed,
        contradictoryEvidenceRefs,
        providerBookingReference: optionalRef(input.response.providerBookingReference),
        supplierAppointmentRef: optionalRef(input.response.supplierAppointmentRef),
        manualEvidence: null,
        importedEvidence: null,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version:
          ((await repositories.getEvidenceBundle(attempt.primaryEvidenceBundleRef))?.toSnapshot().version ??
            0) + 1,
      };

      const gateDocument = await reservationAuthority.refreshExternalConfirmationGate({
        gateId: attempt.confirmationGateRef ?? undefined,
        episodeId: context.hubCaseBundle.hubCase.episodeRef,
        domain: "hub_booking",
        domainObjectRef: `${attempt.hubCoordinationCaseId}::${attempt.capacityUnitRef}`,
        transportMode: "native_api",
        assuranceLevel: deriveGateAssuranceLevel(
          attempt.commitMode,
          input.response.responseClass === "authoritative_confirmed" ? "confirmed" : "pending",
        ),
        evidenceModelVersionRef: "hub_booking_confirmation_gate.v1",
        requiredHardMatchRefs: [
          "selected_candidate",
          "capacity_unit",
          "provider_binding",
        ],
        evidenceAtoms: buildEvidenceAtoms({
          commitMode: attempt.commitMode,
          evidenceSourceFamilies: evidenceBundle.evidenceSourceFamilies,
          hardMatchRefsPassed,
          hardMatchRefsFailed,
          contradictoryEvidenceRefs,
          providerBookingReference: evidenceBundle.providerBookingReference,
          receiptRef: evidenceBundle.nativeBookingReceiptRef,
          capturedAt: input.recordedAt,
        }),
        confirmationDeadlineAt: attempt.confirmationDeadlineAt,
        priorProbability: 0.42,
        createdAt: attempt.createdAt,
        updatedAt: input.recordedAt,
        thresholdPolicy: defaultReservationConfirmationThresholdPolicy,
      });
      const confirmationGate = gateDocument.toSnapshot();

      const updatedAttempt: HubCommitAttemptSnapshot = {
        ...attempt,
        attemptState:
          confirmationGate.state === "confirmed"
            ? "confirmed"
            : confirmationGate.state === "disputed"
              ? "disputed"
              : confirmationGate.state === "expired"
                ? "failed"
                : "awaiting_confirmation",
        externalResponseState:
          input.response.responseClass === "authoritative_confirmed"
            ? "authoritative_confirmed"
            : input.response.responseClass === "rejected"
              ? "rejected"
              : "accepted_pending",
        externalBookingRef: optionalRef(input.response.providerBookingReference),
        adapterCorrelationKey: optionalRef(input.response.adapterCorrelationKey),
        confirmationGateRef: confirmationGate.gateId,
        confirmationConfidence: confirmationGate.confirmationConfidence,
        competingAttemptMargin: confirmationGate.competingGateMargin,
        updatedAt: input.recordedAt,
        finalizedAt:
          confirmationGate.state === "confirmed" ||
          confirmationGate.state === "disputed" ||
          confirmationGate.state === "expired"
            ? input.recordedAt
            : null,
        version: nextVersion(attempt.version),
      };

      const confirmationTruthState = deriveCommitTruthState({
        gateState: confirmationGate.state,
      });
      const practiceVisibilityState = derivePracticeVisibilityState({
        confirmationTruthState,
      });
      const closureState = deriveClosureState({
        confirmationTruthState,
        practiceVisibilityState,
        fallbackLinkState: currentTruth.fallbackLinkState,
      });
      const continuityProjection = await upsertContinuityProjection({
        attempt: updatedAttempt,
        currentTruth,
        recordedAt: input.recordedAt,
        validationState:
          confirmationGate.state === "confirmed"
            ? "trusted"
            : confirmationGate.state === "pending"
              ? "degraded"
              : "blocked",
        blockingRefs:
          confirmationGate.state === "confirmed"
            ? ["practice_ack_pending"]
            : confirmationGate.state === "pending"
              ? ["confirmation_gate_pending"]
              : ["confirmation_disputed"],
        sourceRefs: input.sourceRefs,
      });
      const updatedTruth = updateTruthProjection(
        currentTruth,
        {
          commitAttemptRef: updatedAttempt.commitAttemptId,
          bookingEvidenceRef: evidenceBundle.evidenceBundleId,
          confirmationGateRef: confirmationGate.gateId,
          experienceContinuityEvidenceRef: continuityProjection.hubContinuityEvidenceProjectionId,
          confirmationTruthState,
          patientVisibilityState: derivePatientVisibilityState({ confirmationTruthState }),
          practiceVisibilityState,
          closureState,
          blockingRefs: deriveBlockingRefs({
            confirmationTruthState,
            practiceVisibilityState,
            closureState,
          }),
        },
        input.recordedAt,
      );
      const attemptWithCurrentTruth: HubCommitAttemptSnapshot = {
        ...updatedAttempt,
        truthTupleHash: updatedTruth.truthTupleHash,
      };

      if (confirmationGate.state === "confirmed") {
        return finalizeBookedPendingPracticeAckInternal({
          attempt: updatedAttempt,
          actionRecord,
          truthProjection: updatedTruth,
          evidenceBundle: {
            ...evidenceBundle,
            independentConfirmationState: "confirmed",
            confirmationConfidence: confirmationGate.confirmationConfidence,
            competingAttemptMargin: confirmationGate.competingGateMargin,
          },
          confirmationGate,
          recordedAt: input.recordedAt,
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          sourceBookingReference:
            optionalRef(input.response.providerBookingReference) ??
            `booking_ref_${updatedAttempt.commitAttemptId}`,
          patientFacingReference:
            optionalRef(input.response.providerBookingReference) ??
            `patient_ref_${updatedAttempt.commitAttemptId}`,
          appointmentVersionRef: `appt_version_${updatedAttempt.commitAttemptId}_v1`,
          supplierAppointmentRef: input.response.supplierAppointmentRef,
          sourceRefs: input.sourceRefs,
          authorityDecision,
          policyFacts: input.policyFacts,
        });
      }

      const hubTransition =
        confirmationGate.state === "pending"
          ? await options.hubCaseService.markConfirmationPending(
              buildTransitionCommand(context.hubCaseBundle.hubCase, {
                actorRef: input.actorRef,
                routeIntentBindingRef: input.routeIntentBindingRef,
                commandActionRecordRef: input.commandActionRecordRef,
                commandSettlementRecordRef: input.commandSettlementRecordRef,
                recordedAt: input.recordedAt,
                reasonCode: "hub_commit_confirmation_pending",
                carriedOpenCaseBlockerRefs: updatedTruth.blockingRefs,
              }),
            )
          : null;

      const result: HubCommitSettlementResultState =
        confirmationGate.state === "pending"
          ? "pending_confirmation"
          : confirmationGate.state === "expired"
            ? "confirmation_expired"
            : "confirmation_disputed";
      const terminalReservation =
        confirmationGate.state === "expired" || confirmationGate.state === "disputed"
          ? (
              await reservationAuthority.recordCapacityReservation(
                {
                  reservationId: reservation.reservationId,
                  capacityIdentityRef: reservation.capacityIdentityRef,
                  canonicalReservationKey: reservation.canonicalReservationKey,
                  sourceDomain: reservation.sourceDomain,
                  holderRef: reservation.holderRef,
                  state: "released",
                  commitMode: reservation.commitMode,
                  reservationVersion: reservation.reservationVersion + 1,
                  activeFencingToken: reservation.activeFencingToken,
                  truthBasisHash: reservation.truthBasisHash,
                  supplierObservedAt: input.recordedAt,
                  revalidatedAt: input.recordedAt,
                  releasedAt: input.recordedAt,
                  terminalReasonCode:
                    result === "confirmation_expired"
                      ? "confirmation_expired"
                      : "confirmation_disputed",
                },
                { expectedVersion: reservationDocument.version },
              )
            ).toSnapshot()
          : reservation;

      return writeSettlementAndTruth({
        attempt: attemptWithCurrentTruth,
        actionRecord,
        truthProjection: updatedTruth,
        evidenceBundle: {
          ...evidenceBundle,
          independentConfirmationState:
            confirmationGate.state === "disputed"
              ? "disputed"
              : confirmationGate.state === "expired"
                ? "none"
                : "pending",
          confirmationConfidence: confirmationGate.confirmationConfidence,
          competingAttemptMargin: confirmationGate.competingGateMargin,
        },
        continuityProjection,
        reservation: terminalReservation,
        confirmationGate,
        result,
        recordedAt: input.recordedAt,
        sourceRefs: input.sourceRefs,
        hubTransition,
        policyEvaluation: context.policyEvaluation,
        authorityDecision,
      });
    },

    async captureManualBookingEvidence(input) {
      const authorityDecision = await assertAuthority(input.authority);
      const attempt = await requireSnapshot(
        repositories.getCommitAttempt(input.commitAttemptId),
        "HUB_COMMIT_ATTEMPT_NOT_FOUND",
        "HubCommitAttempt could not be found.",
      );
      invariant(
        attempt.commitMode === "manual_pending_confirmation",
        "INVALID_COMMIT_MODE",
        "captureManualBookingEvidence requires a manual_pending_confirmation attempt.",
      );
      invariant(
        attempt.truthTupleHash === input.presentedTruthTupleHash,
        "STALE_TRUTH_TUPLE",
        "Current truth tuple drifted before manual evidence capture.",
      );
      invariant(
        attempt.providerAdapterBindingHash === input.presentedProviderAdapterBindingHash,
        "STALE_PROVIDER_BINDING",
        "Current provider binding drifted before manual evidence capture.",
      );
      invariant(
        attempt.reservationFenceToken === input.presentedReservationFenceToken,
        "STALE_RESERVATION_FENCE",
        "Reservation fence token drifted before manual evidence capture.",
      );
      const currentTruth = await requireCurrentTruthProjection(
        options.offerRepositories,
        attempt.hubCoordinationCaseId,
      );
      const actionRecord = await requireSnapshot(
        repositories.getActionRecord(attempt.commandActionRef),
        "HUB_ACTION_RECORD_NOT_FOUND",
        "HubActionRecord is missing.",
      );
      const candidate = await requireSnapshot(
        options.capacityRepositories.getCandidate(attempt.selectedCandidateRef),
        "NETWORK_SLOT_CANDIDATE_NOT_FOUND",
        "Selected candidate could not be found.",
      );
      const hardMatchRefsPassed: string[] = [];
      const hardMatchRefsFailed: string[] = [];
      if (input.evidence.modality === candidate.modality) {
        hardMatchRefsPassed.push("modality");
      } else {
        hardMatchRefsFailed.push("modality");
      }
      if (input.evidence.clinicianType === candidate.clinicianType) {
        hardMatchRefsPassed.push("clinician_type");
      } else {
        hardMatchRefsFailed.push("clinician_type");
      }
      if (input.evidence.nativeBookingReference) {
        hardMatchRefsPassed.push("native_booking_reference_present");
      }
      const evidenceBundle: HubBookingEvidenceBundleSnapshot = {
        evidenceBundleId: attempt.primaryEvidenceBundleRef,
        hubCoordinationCaseId: attempt.hubCoordinationCaseId,
        commitAttemptId: attempt.commitAttemptId,
        commitMode: attempt.commitMode,
        independentConfirmationState: "pending",
        confirmationConfidence: 0,
        competingAttemptMargin: 0,
        importedEvidenceRef: null,
        nativeBookingReceiptRef: input.evidence.nativeBookingReference,
        hardMatchResult:
          hardMatchRefsFailed.length > 0
            ? "failed"
            : new Set(input.evidence.evidenceSourceFamilies).size >=
                  defaultReservationConfirmationThresholdPolicy.weakManualMinSourceFamilies
              ? "passed"
              : "pending",
        evidenceCapturedAt: input.recordedAt,
        truthTupleHash: attempt.truthTupleHash,
        evidenceSourceFamilies: uniqueSortedRefs(input.evidence.evidenceSourceFamilies),
        hardMatchRefsPassed,
        hardMatchRefsFailed,
        contradictoryEvidenceRefs: [],
        providerBookingReference: optionalRef(input.evidence.nativeBookingReference),
        supplierAppointmentRef: null,
        manualEvidence: input.evidence,
        importedEvidence: null,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version:
          ((await repositories.getEvidenceBundle(attempt.primaryEvidenceBundleRef))?.toSnapshot().version ??
            0) + 1,
      };
      const gateDocument = await reservationAuthority.refreshExternalConfirmationGate({
        gateId: attempt.confirmationGateRef ?? undefined,
        episodeId: requireHubCaseBundle(
          await options.hubCaseService.queryHubCaseBundle(attempt.hubCoordinationCaseId),
          attempt.hubCoordinationCaseId,
        ).hubCase.episodeRef,
        domain: "hub_booking",
        domainObjectRef: `${attempt.hubCoordinationCaseId}::${attempt.capacityUnitRef}`,
        transportMode: "manual_capture",
        assuranceLevel: "manual",
        evidenceModelVersionRef: "hub_booking_confirmation_gate.v1",
        requiredHardMatchRefs: ["modality", "clinician_type"],
        evidenceAtoms: buildEvidenceAtoms({
          commitMode: attempt.commitMode,
          evidenceSourceFamilies: evidenceBundle.evidenceSourceFamilies,
          hardMatchRefsPassed,
          hardMatchRefsFailed,
          contradictoryEvidenceRefs: evidenceBundle.contradictoryEvidenceRefs,
          providerBookingReference: evidenceBundle.providerBookingReference,
          capturedAt: input.recordedAt,
        }),
        confirmationDeadlineAt: input.evidence.confirmationDueAt,
        priorProbability: 0.28,
        createdAt: attempt.createdAt,
        updatedAt: input.recordedAt,
        thresholdPolicy: defaultReservationConfirmationThresholdPolicy,
      });
      const confirmationGate = gateDocument.toSnapshot();
      const updatedAttempt: HubCommitAttemptSnapshot = {
        ...attempt,
        attemptState:
          confirmationGate.state === "confirmed"
            ? "confirmed"
            : confirmationGate.state === "disputed"
              ? "disputed"
              : confirmationGate.state === "expired"
                ? "failed"
                : "awaiting_confirmation",
        externalResponseState: "manual_recorded",
        externalBookingRef: optionalRef(input.evidence.nativeBookingReference),
        confirmationGateRef: confirmationGate.gateId,
        confirmationConfidence: confirmationGate.confirmationConfidence,
        competingAttemptMargin: confirmationGate.competingGateMargin,
        updatedAt: input.recordedAt,
        finalizedAt:
          confirmationGate.state === "confirmed" ||
          confirmationGate.state === "disputed" ||
          confirmationGate.state === "expired"
            ? input.recordedAt
            : null,
        version: nextVersion(attempt.version),
      };
      const confirmationTruthState = deriveCommitTruthState({
        gateState: confirmationGate.state,
      });
      const practiceVisibilityState = derivePracticeVisibilityState({
        confirmationTruthState,
      });
      const closureState = deriveClosureState({
        confirmationTruthState,
        practiceVisibilityState,
        fallbackLinkState: currentTruth.fallbackLinkState,
      });
      const continuityProjection = await upsertContinuityProjection({
        attempt: updatedAttempt,
        currentTruth,
        recordedAt: input.recordedAt,
        validationState: confirmationGate.state === "pending" ? "degraded" : "blocked",
        blockingRefs:
          confirmationGate.state === "pending"
            ? ["confirmation_gate_pending"]
            : ["confirmation_disputed"],
        sourceRefs: input.sourceRefs,
      });
      const updatedTruth = updateTruthProjection(
        currentTruth,
        {
          commitAttemptRef: updatedAttempt.commitAttemptId,
          bookingEvidenceRef: evidenceBundle.evidenceBundleId,
          confirmationGateRef: confirmationGate.gateId,
          experienceContinuityEvidenceRef: continuityProjection.hubContinuityEvidenceProjectionId,
          confirmationTruthState,
          patientVisibilityState: derivePatientVisibilityState({ confirmationTruthState }),
          practiceVisibilityState,
          closureState,
          blockingRefs: deriveBlockingRefs({
            confirmationTruthState,
            practiceVisibilityState,
            closureState,
          }),
        },
        input.recordedAt,
      );
      const attemptWithCurrentTruth: HubCommitAttemptSnapshot = {
        ...updatedAttempt,
        truthTupleHash: updatedTruth.truthTupleHash,
      };
      if (confirmationGate.state === "confirmed") {
        return finalizeBookedPendingPracticeAckInternal({
          attempt: updatedAttempt,
          actionRecord,
          truthProjection: updatedTruth,
          evidenceBundle: {
            ...evidenceBundle,
            independentConfirmationState: "confirmed",
            confirmationConfidence: confirmationGate.confirmationConfidence,
            competingAttemptMargin: confirmationGate.competingGateMargin,
          },
          confirmationGate,
          recordedAt: input.recordedAt,
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          sourceBookingReference:
            evidenceBundle.providerBookingReference ?? `manual_booking_${updatedAttempt.commitAttemptId}`,
          patientFacingReference:
            evidenceBundle.providerBookingReference ?? `manual_patient_ref_${updatedAttempt.commitAttemptId}`,
          appointmentVersionRef: `manual_appt_version_${updatedAttempt.commitAttemptId}_v1`,
          sourceRefs: input.sourceRefs,
          authorityDecision,
          policyFacts: input.policyFacts,
        });
      }
      const hubTransition =
        confirmationGate.state === "pending"
          ? await options.hubCaseService.markConfirmationPending(
              buildTransitionCommand(
                requireHubCaseBundle(
                  await options.hubCaseService.queryHubCaseBundle(attempt.hubCoordinationCaseId),
                  attempt.hubCoordinationCaseId,
                ).hubCase,
                {
                  actorRef: input.actorRef,
                  routeIntentBindingRef: input.routeIntentBindingRef,
                  commandActionRecordRef: input.commandActionRecordRef,
                  commandSettlementRecordRef: input.commandSettlementRecordRef,
                  recordedAt: input.recordedAt,
                  reasonCode: "manual_confirmation_pending",
                  carriedOpenCaseBlockerRefs: updatedTruth.blockingRefs,
                },
              ),
            )
          : null;
      return writeSettlementAndTruth({
        attempt: attemptWithCurrentTruth,
        actionRecord,
        truthProjection: updatedTruth,
        evidenceBundle: {
          ...evidenceBundle,
          independentConfirmationState:
            confirmationGate.state === "disputed" ? "disputed" : "pending",
          confirmationConfidence: confirmationGate.confirmationConfidence,
          competingAttemptMargin: confirmationGate.competingGateMargin,
        },
        continuityProjection,
        confirmationGate,
        result:
          confirmationGate.state === "expired"
            ? "confirmation_expired"
            : confirmationGate.state === "disputed"
              ? "confirmation_disputed"
              : "pending_confirmation",
        recordedAt: input.recordedAt,
        sourceRefs: input.sourceRefs,
        hubTransition,
        policyEvaluation: null,
        authorityDecision,
      });
    },

    async ingestImportedConfirmation(input) {
      const authorityDecision = await assertAuthority(input.authority);
      let effectivePresentedTruthTupleHash = input.presentedTruthTupleHash;
      let attempt =
        input.commitAttemptId === undefined || input.commitAttemptId === null
          ? null
          : await requireSnapshot(
              repositories.getCommitAttempt(input.commitAttemptId),
              "HUB_COMMIT_ATTEMPT_NOT_FOUND",
              "HubCommitAttempt could not be found.",
            );
      if (attempt === null) {
        const begin = await this.beginCommitAttempt({
          hubCoordinationCaseId: input.hubCoordinationCaseId,
          commitMode: "imported_confirmation",
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          recordedAt: input.recordedAt,
          idempotencyKey: input.idempotencyKey,
          providerAdapterBinding: input.providerAdapterBinding,
          presentedTruthTupleHash: input.presentedTruthTupleHash,
          selectedCandidateRef: input.selectedCandidateRef,
          selectedOfferSessionRef: input.selectedOfferSessionRef,
          selectedOfferEntryRef: input.selectedOfferEntryRef,
          supportsExclusiveHold: input.supportsExclusiveHold,
          sourceRefs: input.sourceRefs,
          authority: input.authority,
          policyFacts: input.policyFacts,
        });
        attempt = begin.commitAttempt;
        effectivePresentedTruthTupleHash = begin.commitAttempt.truthTupleHash;
      }
      invariant(
        attempt.commitMode === "imported_confirmation",
        "INVALID_COMMIT_MODE",
        "ingestImportedConfirmation requires an imported_confirmation attempt.",
      );
      invariant(
        attempt.truthTupleHash === effectivePresentedTruthTupleHash,
        "STALE_TRUTH_TUPLE",
        "Current truth tuple drifted before imported confirmation ingestion.",
      );
      invariant(
        attempt.providerAdapterBindingHash === providerAdapterBindingHashFromSnapshot(input.providerAdapterBinding),
        "STALE_PROVIDER_BINDING",
        "Current provider binding drifted before imported confirmation ingestion.",
      );
      const currentTruth = await requireCurrentTruthProjection(
        options.offerRepositories,
        attempt.hubCoordinationCaseId,
      );
      const actionRecord = await requireSnapshot(
        repositories.getActionRecord(attempt.commandActionRef),
        "HUB_ACTION_RECORD_NOT_FOUND",
        "HubActionRecord is missing.",
      );
      const hardMatchRefsPassed: string[] = [];
      const hardMatchRefsFailed: string[] = [];
      if (input.importedEvidence.sourceVersion === attempt.providerSourceVersion) {
        hardMatchRefsPassed.push("source_version");
      } else {
        hardMatchRefsFailed.push("source_version");
      }
      if (attempt.externalBookingRef === null || attempt.externalBookingRef === input.importedEvidence.supplierBookingReference) {
        hardMatchRefsPassed.push("supplier_booking_reference");
      } else {
        hardMatchRefsFailed.push("supplier_booking_reference");
      }
      if (attempt.selectedCandidateRef === (input.selectedCandidateRef ?? attempt.selectedCandidateRef)) {
        hardMatchRefsPassed.push("selected_candidate");
      } else {
        hardMatchRefsFailed.push("selected_candidate");
      }
      if (
        attempt.capacityUnitRef ===
        requireRef(attempt.capacityUnitRef, "capacityUnitRef")
      ) {
        hardMatchRefsPassed.push("capacity_unit");
      }
      const duplicateAppointment = await repositories.findAppointmentBySourceBookingReference(
        input.importedEvidence.supplierBookingReference,
      );
      if (
        duplicateAppointment !== null &&
        duplicateAppointment.toSnapshot().hubCoordinationCaseId !== attempt.hubCoordinationCaseId
      ) {
        hardMatchRefsFailed.push("late_duplicate_booking_reference");
      }
      const evidenceBundle: HubBookingEvidenceBundleSnapshot = {
        evidenceBundleId: attempt.primaryEvidenceBundleRef,
        hubCoordinationCaseId: attempt.hubCoordinationCaseId,
        commitAttemptId: attempt.commitAttemptId,
        commitMode: attempt.commitMode,
        independentConfirmationState: "pending",
        confirmationConfidence: 0,
        competingAttemptMargin: 0,
        importedEvidenceRef: input.importedEvidence.importedEvidenceRef,
        nativeBookingReceiptRef: null,
        hardMatchResult:
          hardMatchRefsFailed.length > 0
            ? "failed"
            : hardMatchRefsPassed.length >= 4
              ? "passed"
              : "pending",
        evidenceCapturedAt: input.recordedAt,
        truthTupleHash: attempt.truthTupleHash,
        evidenceSourceFamilies: uniqueSortedRefs(input.importedEvidence.evidenceSourceFamilies),
        hardMatchRefsPassed,
        hardMatchRefsFailed,
        contradictoryEvidenceRefs: [],
        providerBookingReference: input.importedEvidence.supplierBookingReference,
        supplierAppointmentRef: optionalRef(input.importedEvidence.supplierAppointmentRef),
        manualEvidence: null,
        importedEvidence: input.importedEvidence,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version:
          ((await repositories.getEvidenceBundle(attempt.primaryEvidenceBundleRef))?.toSnapshot().version ??
            0) + 1,
      };
      const gateDocument = await reservationAuthority.refreshExternalConfirmationGate({
        gateId: attempt.confirmationGateRef ?? undefined,
        episodeId: requireHubCaseBundle(
          await options.hubCaseService.queryHubCaseBundle(attempt.hubCoordinationCaseId),
          attempt.hubCoordinationCaseId,
        ).hubCase.episodeRef,
        domain: "hub_booking",
        domainObjectRef: `${attempt.hubCoordinationCaseId}::${attempt.capacityUnitRef}`,
        transportMode: "imported_supplier_confirmation",
        assuranceLevel: "weak",
        evidenceModelVersionRef: "hub_booking_confirmation_gate.v1",
        requiredHardMatchRefs: [
          "selected_candidate",
          "capacity_unit",
          "source_version",
          "supplier_booking_reference",
        ],
        evidenceAtoms: buildEvidenceAtoms({
          commitMode: attempt.commitMode,
          evidenceSourceFamilies: evidenceBundle.evidenceSourceFamilies,
          hardMatchRefsPassed,
          hardMatchRefsFailed,
          contradictoryEvidenceRefs: [],
          providerBookingReference: evidenceBundle.providerBookingReference,
          importedEvidenceRef: evidenceBundle.importedEvidenceRef,
          capturedAt: input.recordedAt,
        }),
        confirmationDeadlineAt: attempt.confirmationDeadlineAt,
        priorProbability: 0.35,
        createdAt: attempt.createdAt,
        updatedAt: input.recordedAt,
        thresholdPolicy: defaultReservationConfirmationThresholdPolicy,
      });
      const confirmationGate = gateDocument.toSnapshot();
      const updatedAttempt: HubCommitAttemptSnapshot = {
        ...attempt,
        attemptState:
          confirmationGate.state === "confirmed"
            ? "confirmed"
            : confirmationGate.state === "disputed"
              ? "disputed"
              : confirmationGate.state === "expired"
                ? "failed"
                : "awaiting_confirmation",
        externalResponseState: "imported_received",
        externalBookingRef: evidenceBundle.providerBookingReference,
        confirmationGateRef: confirmationGate.gateId,
        confirmationConfidence: confirmationGate.confirmationConfidence,
        competingAttemptMargin: confirmationGate.competingGateMargin,
        updatedAt: input.recordedAt,
        finalizedAt:
          confirmationGate.state === "confirmed" ||
          confirmationGate.state === "disputed" ||
          confirmationGate.state === "expired"
            ? input.recordedAt
            : null,
        version: nextVersion(attempt.version),
      };
      const confirmationTruthState = deriveCommitTruthState({
        gateState: confirmationGate.state,
      });
      const practiceVisibilityState = derivePracticeVisibilityState({
        confirmationTruthState,
      });
      const closureState = deriveClosureState({
        confirmationTruthState,
        practiceVisibilityState,
        fallbackLinkState: currentTruth.fallbackLinkState,
      });
      const continuityProjection = await upsertContinuityProjection({
        attempt: updatedAttempt,
        currentTruth,
        recordedAt: input.recordedAt,
        validationState:
          confirmationGate.state === "confirmed"
            ? "trusted"
            : confirmationGate.state === "pending"
              ? "degraded"
              : "blocked",
        blockingRefs:
          confirmationGate.state === "confirmed"
            ? ["practice_ack_pending"]
            : confirmationGate.state === "pending"
              ? ["confirmation_gate_pending"]
              : ["imported_confirmation_disputed"],
        sourceRefs: input.sourceRefs,
      });
      const updatedTruth = updateTruthProjection(
        currentTruth,
        {
          commitAttemptRef: updatedAttempt.commitAttemptId,
          bookingEvidenceRef: evidenceBundle.evidenceBundleId,
          confirmationGateRef: confirmationGate.gateId,
          experienceContinuityEvidenceRef: continuityProjection.hubContinuityEvidenceProjectionId,
          selectionSource: "imported_confirmation" as OfferProjectionSelectionSource,
          confirmationTruthState,
          patientVisibilityState: derivePatientVisibilityState({ confirmationTruthState }),
          practiceVisibilityState,
          closureState,
          blockingRefs: deriveBlockingRefs({
            confirmationTruthState,
            practiceVisibilityState,
            closureState,
          }),
        },
        input.recordedAt,
      );
      const attemptWithCurrentTruth: HubCommitAttemptSnapshot = {
        ...updatedAttempt,
        truthTupleHash: updatedTruth.truthTupleHash,
      };
      if (confirmationGate.state === "confirmed") {
        return finalizeBookedPendingPracticeAckInternal({
          attempt: updatedAttempt,
          actionRecord,
          truthProjection: updatedTruth,
          evidenceBundle: {
            ...evidenceBundle,
            independentConfirmationState: "confirmed",
            confirmationConfidence: confirmationGate.confirmationConfidence,
            competingAttemptMargin: confirmationGate.competingGateMargin,
          },
          confirmationGate,
          recordedAt: input.recordedAt,
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          sourceBookingReference: evidenceBundle.providerBookingReference ?? `imported_ref_${attempt.commitAttemptId}`,
          patientFacingReference: evidenceBundle.providerBookingReference ?? `imported_patient_ref_${attempt.commitAttemptId}`,
          appointmentVersionRef: `imported_appt_version_${attempt.commitAttemptId}_v1`,
          supplierAppointmentRef: evidenceBundle.supplierAppointmentRef,
          sourceRefs: input.sourceRefs,
          authorityDecision,
          policyFacts: input.policyFacts,
        });
      }
      return writeSettlementAndTruth({
        attempt: attemptWithCurrentTruth,
        actionRecord,
        truthProjection: updatedTruth,
        evidenceBundle: {
          ...evidenceBundle,
          independentConfirmationState:
            confirmationGate.state === "disputed" ? "disputed" : "pending",
          confirmationConfidence: confirmationGate.confirmationConfidence,
          competingAttemptMargin: confirmationGate.competingGateMargin,
        },
        continuityProjection,
        confirmationGate,
        result:
          confirmationGate.state === "expired"
            ? "confirmation_expired"
            : confirmationGate.state === "disputed"
              ? "imported_disputed"
              : "pending_confirmation",
        recordedAt: input.recordedAt,
        sourceRefs: input.sourceRefs,
        hubTransition:
          confirmationGate.state === "pending"
            ? await options.hubCaseService.markConfirmationPending(
                buildTransitionCommand(
                  requireHubCaseBundle(
                    await options.hubCaseService.queryHubCaseBundle(attempt.hubCoordinationCaseId),
                    attempt.hubCoordinationCaseId,
                  ).hubCase,
                  {
                    actorRef: input.actorRef,
                    routeIntentBindingRef: input.routeIntentBindingRef,
                    commandActionRecordRef: input.commandActionRecordRef,
                    commandSettlementRecordRef: input.commandSettlementRecordRef,
                    recordedAt: input.recordedAt,
                    reasonCode: "imported_confirmation_pending",
                    carriedOpenCaseBlockerRefs: updatedTruth.blockingRefs,
                  },
                ),
              )
            : null,
        policyEvaluation: null,
        authorityDecision,
      });
    },

    async recomputeConfirmationGate(input) {
      const authorityDecision = await assertAuthority(input.authority);
      const attempt = await requireSnapshot(
        repositories.getCommitAttempt(input.commitAttemptId),
        "HUB_COMMIT_ATTEMPT_NOT_FOUND",
        "HubCommitAttempt could not be found.",
      );
      invariant(
        attempt.truthTupleHash === input.presentedTruthTupleHash,
        "STALE_TRUTH_TUPLE",
        "Current truth tuple drifted before confirmation-gate recompute.",
      );
      const evidenceBundle = await requireSnapshot(
        repositories.getEvidenceBundle(attempt.primaryEvidenceBundleRef),
        "HUB_BOOKING_EVIDENCE_BUNDLE_NOT_FOUND",
        "HubBookingEvidenceBundle could not be found.",
      );
      const actionRecord = await requireSnapshot(
        repositories.getActionRecord(attempt.commandActionRef),
        "HUB_ACTION_RECORD_NOT_FOUND",
        "HubActionRecord is missing.",
      );
      const gateDocument = await reservationAuthority.refreshExternalConfirmationGate({
        gateId: attempt.confirmationGateRef ?? undefined,
        episodeId: requireHubCaseBundle(
          await options.hubCaseService.queryHubCaseBundle(attempt.hubCoordinationCaseId),
          attempt.hubCoordinationCaseId,
        ).hubCase.episodeRef,
        domain: "hub_booking",
        domainObjectRef: `${attempt.hubCoordinationCaseId}::${attempt.capacityUnitRef}`,
        transportMode:
          attempt.commitMode === "native_api"
            ? "native_api"
            : attempt.commitMode === "manual_pending_confirmation"
              ? "manual_capture"
              : "imported_supplier_confirmation",
        assuranceLevel: deriveGateAssuranceLevel(
          attempt.commitMode,
          evidenceBundle.independentConfirmationState === "confirmed" ? "confirmed" : "pending",
        ),
        evidenceModelVersionRef: "hub_booking_confirmation_gate.v1",
        requiredHardMatchRefs: evidenceBundle.hardMatchRefsPassed,
        evidenceAtoms: buildEvidenceAtoms({
          commitMode: attempt.commitMode,
          evidenceSourceFamilies: evidenceBundle.evidenceSourceFamilies,
          hardMatchRefsPassed: evidenceBundle.hardMatchRefsPassed,
          hardMatchRefsFailed: evidenceBundle.hardMatchRefsFailed,
          contradictoryEvidenceRefs: evidenceBundle.contradictoryEvidenceRefs,
          providerBookingReference: evidenceBundle.providerBookingReference,
          importedEvidenceRef: evidenceBundle.importedEvidenceRef,
          receiptRef: evidenceBundle.nativeBookingReceiptRef,
          capturedAt: input.recordedAt,
        }),
        confirmationDeadlineAt: attempt.confirmationDeadlineAt,
        priorProbability:
          attempt.commitMode === "manual_pending_confirmation"
            ? 0.28
            : attempt.commitMode === "imported_confirmation"
              ? 0.35
              : 0.42,
        createdAt: attempt.createdAt,
        updatedAt: input.recordedAt,
        thresholdPolicy: defaultReservationConfirmationThresholdPolicy,
      });
      const confirmationGate = gateDocument.toSnapshot();
      const updatedAttempt: HubCommitAttemptSnapshot = {
        ...attempt,
        confirmationGateRef: confirmationGate.gateId,
        confirmationConfidence: confirmationGate.confirmationConfidence,
        competingAttemptMargin: confirmationGate.competingGateMargin,
        attemptState:
          confirmationGate.state === "confirmed"
            ? "confirmed"
            : confirmationGate.state === "disputed"
              ? "disputed"
              : confirmationGate.state === "expired"
                ? "failed"
                : "awaiting_confirmation",
        updatedAt: input.recordedAt,
        finalizedAt:
          confirmationGate.state === "confirmed" ||
          confirmationGate.state === "disputed" ||
          confirmationGate.state === "expired"
            ? input.recordedAt
            : null,
        version: nextVersion(attempt.version),
      };
      const currentTruth = await requireCurrentTruthProjection(
        options.offerRepositories,
        attempt.hubCoordinationCaseId,
      );
      const confirmationTruthState = deriveCommitTruthState({
        gateState: confirmationGate.state,
      });
      const practiceVisibilityState = derivePracticeVisibilityState({
        confirmationTruthState,
      });
      const closureState = deriveClosureState({
        confirmationTruthState,
        practiceVisibilityState,
        fallbackLinkState: currentTruth.fallbackLinkState,
      });
      const continuityProjection = await upsertContinuityProjection({
        attempt: updatedAttempt,
        currentTruth,
        recordedAt: input.recordedAt,
        validationState:
          confirmationGate.state === "pending"
            ? "degraded"
            : confirmationGate.state === "confirmed"
              ? "trusted"
              : "blocked",
        blockingRefs:
          confirmationGate.state === "confirmed"
            ? ["practice_ack_pending"]
            : confirmationGate.state === "pending"
              ? ["confirmation_gate_pending"]
              : ["confirmation_gate_terminal"],
        sourceRefs: input.sourceRefs,
      });
      const updatedTruth = updateTruthProjection(
        currentTruth,
        {
          confirmationGateRef: confirmationGate.gateId,
          confirmationTruthState,
          patientVisibilityState: derivePatientVisibilityState({ confirmationTruthState }),
          practiceVisibilityState,
          closureState,
          experienceContinuityEvidenceRef: continuityProjection.hubContinuityEvidenceProjectionId,
          blockingRefs: deriveBlockingRefs({
            confirmationTruthState,
            practiceVisibilityState,
            closureState,
          }),
        },
        input.recordedAt,
      );
      const attemptWithCurrentTruth: HubCommitAttemptSnapshot = {
        ...updatedAttempt,
        truthTupleHash: updatedTruth.truthTupleHash,
      };
      if (confirmationGate.state === "confirmed" && input.autoFinalizeWhenConfirmed) {
        return finalizeBookedPendingPracticeAckInternal({
          attempt: updatedAttempt,
          actionRecord,
          truthProjection: updatedTruth,
          evidenceBundle: {
            ...evidenceBundle,
            independentConfirmationState: "confirmed",
            confirmationConfidence: confirmationGate.confirmationConfidence,
            competingAttemptMargin: confirmationGate.competingGateMargin,
          },
          confirmationGate,
          recordedAt: input.recordedAt,
          actorRef: input.actorRef,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          sourceBookingReference:
            evidenceBundle.providerBookingReference ?? `recomputed_ref_${attempt.commitAttemptId}`,
          patientFacingReference:
            evidenceBundle.providerBookingReference ??
            `recomputed_patient_ref_${attempt.commitAttemptId}`,
          appointmentVersionRef: `recomputed_appt_${attempt.commitAttemptId}_v1`,
          practiceAckDueAt: input.practiceAckDueAt,
          sourceRefs: input.sourceRefs,
          authorityDecision,
        });
      }
      return writeSettlementAndTruth({
        attempt: attemptWithCurrentTruth,
        actionRecord,
        truthProjection: updatedTruth,
        evidenceBundle: {
          ...evidenceBundle,
          independentConfirmationState:
            confirmationGate.state === "confirmed"
              ? "confirmed"
              : confirmationGate.state === "disputed"
                ? "disputed"
                : "pending",
          confirmationConfidence: confirmationGate.confirmationConfidence,
          competingAttemptMargin: confirmationGate.competingGateMargin,
        },
        continuityProjection,
        confirmationGate,
        result:
          confirmationGate.state === "expired"
            ? "confirmation_expired"
            : confirmationGate.state === "disputed"
              ? "confirmation_disputed"
              : "pending_confirmation",
        recordedAt: input.recordedAt,
        sourceRefs: input.sourceRefs,
        policyEvaluation: null,
        authorityDecision,
      });
    },

    async finalizeBookedPendingPracticeAck(input) {
      const authorityDecision = await assertAuthority(input.authority);
      const attempt = await requireSnapshot(
        repositories.getCommitAttempt(input.commitAttemptId),
        "HUB_COMMIT_ATTEMPT_NOT_FOUND",
        "HubCommitAttempt could not be found.",
      );
      const evidenceBundle = await requireSnapshot(
        repositories.getEvidenceBundle(attempt.primaryEvidenceBundleRef),
        "HUB_BOOKING_EVIDENCE_BUNDLE_NOT_FOUND",
        "HubBookingEvidenceBundle could not be found.",
      );
      const confirmationGate = await requireSnapshot(
        Promise.resolve(
          attempt.confirmationGateRef
            ? (reservationDependencies.getExternalConfirmationGate(attempt.confirmationGateRef) as Promise<{
                toSnapshot(): ExternalConfirmationGateSnapshot;
              } | null>)
            : Promise.resolve(null),
        ),
        "EXTERNAL_CONFIRMATION_GATE_NOT_FOUND",
        "ExternalConfirmationGate could not be found.",
      );
      const actionRecord = await requireSnapshot(
        repositories.getActionRecord(attempt.commandActionRef),
        "HUB_ACTION_RECORD_NOT_FOUND",
        "HubActionRecord is missing.",
      );
      const truthProjection = await requireCurrentTruthProjection(
        options.offerRepositories,
        attempt.hubCoordinationCaseId,
      );
      return finalizeBookedPendingPracticeAckInternal({
        attempt,
        actionRecord,
        truthProjection,
        evidenceBundle,
        confirmationGate,
        recordedAt: input.recordedAt,
        actorRef: input.actorRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        sourceBookingReference: input.sourceBookingReference,
        patientFacingReference: input.patientFacingReference,
        appointmentVersionRef: input.appointmentVersionRef,
        supplierAppointmentRef: input.supplierAppointmentRef,
        manageCapabilitiesRef: input.manageCapabilitiesRef,
        practiceAckDueAt: input.practiceAckDueAt,
        sourceRefs: input.sourceRefs,
        authorityDecision,
        policyFacts: input.policyFacts,
      });
    },

    async recordReconciliationRequired(input) {
      const attempt = await requireSnapshot(
        repositories.getCommitAttempt(input.commitAttemptId),
        "HUB_COMMIT_ATTEMPT_NOT_FOUND",
        "HubCommitAttempt could not be found.",
      );
      const actionRecord = await requireSnapshot(
        repositories.getActionRecord(attempt.commandActionRef),
        "HUB_ACTION_RECORD_NOT_FOUND",
        "HubActionRecord is missing.",
      );
      const currentTruth = await requireCurrentTruthProjection(
        options.offerRepositories,
        attempt.hubCoordinationCaseId,
      );
      const reconciliationRecord: HubCommitReconciliationRecordSnapshot = {
        hubCommitReconciliationRecordId: nextId(idGenerator, "hubCommitReconciliationRecord"),
        hubCoordinationCaseId: attempt.hubCoordinationCaseId,
        commitAttemptId: attempt.commitAttemptId,
        idempotencyKey: attempt.idempotencyKey,
        reconciliationClass: input.reconciliationClass,
        reasonCode: requireRef(input.reasonCode, "reasonCode"),
        state: "pending_review",
        providerCorrelationRef: optionalRef(input.providerCorrelationRef),
        externalBookingRef: attempt.externalBookingRef,
        latestReceiptCheckpointRef: optionalRef(input.latestReceiptCheckpointRef),
        dueAt: optionalRef(input.dueAt) ?? addMinutes(input.recordedAt, 30),
        createdAt: input.recordedAt,
        updatedAt: input.recordedAt,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version: 1,
      };
      const continuityProjection = await upsertContinuityProjection({
        attempt: {
          ...attempt,
          attemptState: "reconciliation_required",
          externalResponseState: "reconciliation_required",
        },
        currentTruth,
        recordedAt: input.recordedAt,
        validationState: "blocked",
        blockingRefs: ["split_brain_reconciliation_required"],
        sourceRefs: input.sourceRefs,
      });
      const updatedTruth = updateTruthProjection(
        currentTruth,
        {
          confirmationTruthState: "disputed",
          patientVisibilityState: "recovery_required",
          practiceVisibilityState: "recovery_required",
          closureState: "blocked_by_confirmation",
          experienceContinuityEvidenceRef: continuityProjection.hubContinuityEvidenceProjectionId,
          blockingRefs: deriveBlockingRefs({
            settlementResult: "reconciliation_required",
            confirmationTruthState: "disputed",
            practiceVisibilityState: "recovery_required",
            closureState: "blocked_by_confirmation",
            additionalReasonRefs: ["split_brain_reconciliation_required"],
          }),
        },
        input.recordedAt,
      );
      const updatedAttempt: HubCommitAttemptSnapshot = {
        ...attempt,
        attemptState: "reconciliation_required",
        externalResponseState: "reconciliation_required",
        blockingReasonRefs: uniqueSortedRefs([
          ...attempt.blockingReasonRefs,
          input.reasonCode,
        ]),
        truthTupleHash: updatedTruth.truthTupleHash,
        updatedAt: input.recordedAt,
        finalizedAt: input.recordedAt,
        version: nextVersion(attempt.version),
      };
      return writeSettlementAndTruth({
        attempt: updatedAttempt,
        actionRecord,
        truthProjection: updatedTruth,
        continuityProjection,
        reconciliationRecord,
        result: "reconciliation_required",
        recordedAt: input.recordedAt,
        sourceRefs: input.sourceRefs,
      });
    },

    async startSupplierMirrorMonitoring(input) {
      const appointment = await requireSnapshot(
        repositories.getAppointmentRecord(input.hubAppointmentId),
        "HUB_APPOINTMENT_NOT_FOUND",
        "HubAppointmentRecord could not be found.",
      );
      const existing = (
        await repositories.getMirrorStateForAppointment(input.hubAppointmentId)
      )?.toSnapshot();
      if (existing) {
        return existing;
      }
      const mirrorCore = {
        hubSupplierMirrorStateId: nextId(idGenerator, "hubSupplierMirrorState"),
        hubCoordinationCaseId: appointment.hubCoordinationCaseId,
        hubAppointmentId: appointment.hubAppointmentId,
        supplierSystem: requireRef(input.supplierSystem, "supplierSystem"),
        supplierVersion: requireRef(input.supplierVersion, "supplierVersion"),
        lastSyncAt: input.startedAt,
        nextSyncDueAt: optionalRef(input.nextSyncDueAt) ?? addMinutes(input.startedAt, 60),
        driftState: "aligned" as const,
        manageFreezeState: "live" as const,
        lastObservedStatus: "booked" as const,
        latestContinuityMessageRef: null,
        latestDriftHookRef: null,
        transitionEnvelopeRef: null,
        stateConfidenceBand: "high" as const,
        causalToken: nextId(idGenerator, "hubSupplierMirrorCausalToken"),
        monotoneRevision: 1,
        reopenTaskRef: null,
        truthTupleHash: appointment.truthTupleHash,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version: 1,
      };
      const mirrorState: HubSupplierMirrorStateSnapshot = {
        ...mirrorCore,
      };
      await repositories.saveMirrorState(mirrorState);
      return mirrorState;
    },

    async recordSupplierMirrorObservation(input) {
      const appointment = await requireSnapshot(
        repositories.getAppointmentRecord(input.hubAppointmentId),
        "HUB_APPOINTMENT_NOT_FOUND",
        "HubAppointmentRecord could not be found.",
      );
      const currentMirror = await requireSnapshot(
        repositories.getMirrorStateForAppointment(input.hubAppointmentId),
        "HUB_SUPPLIER_MIRROR_STATE_NOT_FOUND",
        "HubSupplierMirrorState could not be found.",
      );
      const currentTruth = await requireCurrentTruthProjection(
        options.offerRepositories,
        appointment.hubCoordinationCaseId,
      );
      if (input.observedStatus === "booked") {
        if (
          compareIso(input.observedAt, currentMirror.lastSyncAt) <= 0 ||
          currentMirror.manageFreezeState === "frozen" ||
          driftSeverity(currentMirror.driftState) > 0
        ) {
          return {
            mirrorState: currentMirror,
            driftHook: null,
            truthProjection: currentTruth,
            continuityProjection:
              (
                await repositories.getContinuityProjectionForCase(
                  appointment.hubCoordinationCaseId,
                )
              )?.toSnapshot() ?? null,
          };
        }
        const updatedMirror: HubSupplierMirrorStateSnapshot = {
          ...currentMirror,
          supplierVersion: requireRef(input.supplierVersion, "supplierVersion"),
          lastSyncAt: input.observedAt,
          nextSyncDueAt: addMinutes(input.observedAt, 60),
          driftState: "aligned",
          manageFreezeState: "live",
          lastObservedStatus: "booked",
          stateConfidenceBand: "high",
          monotoneRevision: currentMirror.monotoneRevision + 1,
          version: nextVersion(currentMirror.version),
        };
        await repositories.saveMirrorState(updatedMirror, {
          expectedVersion: currentMirror.version,
        });
        return {
          mirrorState: updatedMirror,
          driftHook: null,
          truthProjection: currentTruth,
          continuityProjection:
            (await repositories.getContinuityProjectionForCase(appointment.hubCoordinationCaseId))?.toSnapshot() ??
            null,
        };
      }

      const driftHook: HubSupplierDriftHookSnapshot = {
        hubSupplierDriftHookId: nextId(idGenerator, "hubSupplierDriftHook"),
        hubCoordinationCaseId: appointment.hubCoordinationCaseId,
        hubAppointmentId: appointment.hubAppointmentId,
        hubSupplierMirrorStateId: currentMirror.hubSupplierMirrorStateId,
        truthTupleHash: appointment.truthTupleHash,
        driftReasonRefs: uniqueSortedRefs(
          input.driftReasonRefs ?? [`supplier_status_${input.observedStatus}`],
        ),
        manageFreezeState: "frozen",
        hookState: "open",
        recordedAt: input.observedAt,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(input.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.appendSupplierDriftHook(driftHook);

      const updatedMirror: HubSupplierMirrorStateSnapshot = {
        ...currentMirror,
        supplierVersion: requireRef(input.supplierVersion, "supplierVersion"),
        lastSyncAt: input.observedAt,
        nextSyncDueAt: addMinutes(input.observedAt, 15),
        driftState: "drift_detected",
        manageFreezeState: "frozen",
        lastObservedStatus: input.observedStatus,
        latestDriftHookRef: driftHook.hubSupplierDriftHookId,
        stateConfidenceBand: "medium",
        monotoneRevision: currentMirror.monotoneRevision + 1,
        truthTupleHash: appointment.truthTupleHash,
        version: nextVersion(currentMirror.version),
      };
      await repositories.saveMirrorState(updatedMirror, { expectedVersion: currentMirror.version });

      const continuityProjection = await upsertContinuityProjection({
        attempt: await requireSnapshot(
          repositories.getCommitAttempt(appointment.commitAttemptId),
          "HUB_COMMIT_ATTEMPT_NOT_FOUND",
          "HubCommitAttempt could not be found.",
        ),
        currentTruth,
        recordedAt: input.observedAt,
        validationState: "blocked",
        blockingRefs: ["supplier_drift_detected"],
        latestContinuationRef: driftHook.hubSupplierDriftHookId,
        sourceRefs: input.sourceRefs,
      });
      const updatedTruth = updateTruthProjection(
        currentTruth,
        {
          confirmationTruthState: "blocked_by_drift",
          patientVisibilityState: "recovery_required",
          practiceVisibilityState: "recovery_required",
          closureState: "blocked_by_supplier_drift",
          experienceContinuityEvidenceRef: continuityProjection.hubContinuityEvidenceProjectionId,
          blockingRefs: deriveBlockingRefs({
            confirmationTruthState: "blocked_by_drift",
            practiceVisibilityState: "recovery_required",
            closureState: "blocked_by_supplier_drift",
            additionalReasonRefs: driftHook.driftReasonRefs,
          }),
        },
        input.observedAt,
      );
      await options.offerRepositories.saveTruthProjection(updatedTruth, {
        expectedVersion: currentTruth.version,
      });
      await repositories.saveContinuityProjection(continuityProjection, {
        expectedVersion:
          (
            await repositories.getContinuityProjectionForCase(appointment.hubCoordinationCaseId)
          )?.toSnapshot().version,
      });
      return {
        mirrorState: updatedMirror,
        driftHook,
        truthProjection: updatedTruth,
        continuityProjection,
      };
    },

    async queryCurrentCommitState(hubCoordinationCaseId) {
      const truthProjection = (
        await options.offerRepositories.getTruthProjectionForCase(hubCoordinationCaseId)
      )?.toSnapshot() ?? null;
      const liveAttempt = (await repositories.listCommitAttemptsForCase(hubCoordinationCaseId))
        .map((document) => document.toSnapshot())
        .reverse()
        .find((attempt) => liveAttemptStates(attempt.attemptState)) ?? null;
      const appointment =
        truthProjection?.hubAppointmentId === null || truthProjection?.hubAppointmentId === undefined
          ? null
          : ((await repositories.getAppointmentRecord(truthProjection.hubAppointmentId))?.toSnapshot() ??
            null);
      const latestSettlement = (await repositories.listSettlementsForCase(hubCoordinationCaseId))
        .map((document) => document.toSnapshot())
        .at(-1) ?? null;
      const evidenceBundle =
        liveAttempt === null
          ? null
          : ((await repositories.getEvidenceBundle(liveAttempt.primaryEvidenceBundleRef))?.toSnapshot() ??
            null);
      const latestContinuityProjection =
        (await repositories.getContinuityProjectionForCase(hubCoordinationCaseId))?.toSnapshot() ??
        null;
      const mirrorState =
        appointment === null
          ? null
          : ((await repositories.getMirrorStateForAppointment(appointment.hubAppointmentId))?.toSnapshot() ??
            null);
      return {
        liveAttempt,
        evidenceBundle,
        appointment,
        latestSettlement,
        latestContinuityProjection,
        mirrorState,
        truthProjection,
      };
    },
  };

  return service;
}
