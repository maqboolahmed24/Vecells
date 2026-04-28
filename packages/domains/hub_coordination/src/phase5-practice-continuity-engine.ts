import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import {
  createPhase5ActingScopeVisibilityService,
  type CrossOrganisationVisibilityEnvelopeSnapshot,
  type HubCommandAuthorityDecision,
  type HubCommandAuthorityInput,
  type MinimumNecessaryProjectionResult,
  type Phase5ActingScopeVisibilityService,
} from "./phase5-acting-context-visibility-kernel";
import {
  createPhase5AlternativeOfferEngineStore,
  type HubOfferToConfirmationTruthProjectionSnapshot,
  type Phase5AlternativeOfferEngineRepositories,
} from "./phase5-alternative-offer-engine";
import {
  createPhase5EnhancedAccessPolicyService,
  type NetworkPolicyEvaluationResult,
  type Phase5EnhancedAccessPolicyService,
  type PolicyEvaluationFactsSnapshot,
} from "./phase5-enhanced-access-policy-engine";
import {
  createPhase5HubCaseKernelService,
  type HubCaseBundle,
  type HubCaseTransitionCommandInput,
  type HubCaseTransitionResult,
  type HubCoordinationCaseSnapshot,
  type Phase5HubCaseKernelService,
} from "./phase5-hub-case-kernel";
import {
  createPhase5HubCommitEngineStore,
  type HubAppointmentRecordSnapshot,
  type HubContinuityEvidenceProjectionSnapshot,
  type HubSupplierMirrorStateSnapshot,
  type Phase5HubCommitEngineRepositories,
} from "./phase5-hub-commit-engine";

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

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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
  "blueprint/phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility",
  "blueprint/phase-0-the-foundation-protocol.md#adapter-receipts-checkpoints-and-external-settlement",
  "blueprint/phase-cards.md#Card-6",
  "docs/architecture/313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md",
  "docs/api/321_hub_commit_and_confirmation_api.md",
].sort();

const PRACTICE_CONTINUITY_DELIVERY_MODEL_VERSION = "phase5.practice_continuity.delivery.v1";

export const practiceContinuityChannels = [
  "mesh",
  "direct_api",
  "manual_secure_mail",
  "internal_transfer",
] as const;
export type PracticeContinuityChannel = (typeof practiceContinuityChannels)[number];

export const practiceContinuityTransportStates = [
  "not_dispatched",
  "queued",
  "accepted",
  "rejected",
] as const;
export type PracticeContinuityTransportState =
  (typeof practiceContinuityTransportStates)[number];

export const practiceContinuityTransportAckStates = [
  "none",
  "accepted",
  "rejected",
  "timed_out",
] as const;
export type PracticeContinuityTransportAckState =
  (typeof practiceContinuityTransportAckStates)[number];

export const practiceContinuityDeliveryStates = [
  "unknown",
  "available_for_collection",
  "downloaded",
  "expired",
  "failed",
] as const;
export type PracticeContinuityDeliveryState =
  (typeof practiceContinuityDeliveryStates)[number];

export const practiceContinuityDeliveryEvidenceStates = [
  "pending",
  "delivered",
  "failed",
  "disputed",
  "expired",
] as const;
export type PracticeContinuityDeliveryEvidenceState =
  (typeof practiceContinuityDeliveryEvidenceStates)[number];

export const practiceContinuityDeliveryRiskStates = [
  "none",
  "awaiting_download",
  "non_delivery_risk",
  "failed",
] as const;
export type PracticeContinuityDeliveryRiskState =
  (typeof practiceContinuityDeliveryRiskStates)[number];

export const practiceContinuityDeliveryRiskPostures = [
  "on_track",
  "at_risk",
  "likely_failed",
  "disputed",
] as const;
export type PracticeContinuityDeliveryRiskPosture =
  (typeof practiceContinuityDeliveryRiskPostures)[number];

export const practiceContinuityAckEvidenceStates = [
  "ack_missing",
  "ack_received",
  "ack_superseded",
  "ack_exception_recorded",
] as const;
export type PracticeContinuityAcknowledgementEvidenceState =
  (typeof practiceContinuityAckEvidenceStates)[number];

export const practiceContinuityAckStates = [
  "not_required",
  "pending",
  "acknowledged",
  "disputed",
  "overdue",
  "recovery_required",
] as const;
export type PracticeContinuityAckState = (typeof practiceContinuityAckStates)[number];

export const practiceContinuityMessageStates = ["current", "superseded"] as const;
export type PracticeContinuityMessageState = (typeof practiceContinuityMessageStates)[number];

export const practiceContinuityDispatchStates = [
  "queued",
  "accepted",
  "rejected",
  "timed_out",
] as const;
export type PracticeContinuityDispatchState =
  (typeof practiceContinuityDispatchStates)[number];

export const practiceContinuityReceiptKinds = [
  "transport_accepted",
  "transport_rejected",
  "transport_timed_out",
  "delivery_available",
  "delivery_downloaded",
  "delivery_expired",
  "delivery_failed",
  "delivery_disputed",
  "acknowledgement_captured",
  "policy_exception_recorded",
] as const;
export type PracticeContinuityReceiptKind =
  (typeof practiceContinuityReceiptKinds)[number];

export const practiceAcknowledgementRecordStates = [
  "pending",
  "received",
  "superseded",
  "exception_recorded",
] as const;
export type PracticeAcknowledgementRecordState =
  (typeof practiceAcknowledgementRecordStates)[number];

export const practiceAcknowledgementEvidenceKinds = [
  "message_reply",
  "api_receipt",
  "manual_attestation",
  "policy_exception",
] as const;
export type PracticeAcknowledgementEvidenceKind =
  (typeof practiceAcknowledgementEvidenceKinds)[number];

export const practiceVisibilityDeltaReasons = [
  "truth_changed",
  "ack_generation_incremented",
  "manage_capability_degraded",
  "appointment_version_changed",
  "policy_tuple_changed",
  "reminder_failure",
] as const;
export type PracticeVisibilityDeltaReason = (typeof practiceVisibilityDeltaReasons)[number];

export const practiceVisibilityMonotoneValidations = [
  "valid",
  "rejected_lower_generation",
  "rejected_stale_envelope",
] as const;
export type PracticeVisibilityMonotoneValidation =
  (typeof practiceVisibilityMonotoneValidations)[number];

export const practiceContinuityConfidenceBands = ["high", "medium", "low"] as const;
export type PracticeContinuityConfidenceBand =
  (typeof practiceContinuityConfidenceBands)[number];

export interface PracticeContinuityPayloadDocumentSnapshot {
  practiceContinuityPayloadDocumentId: string;
  hubCoordinationCaseId: string;
  visibilityEnvelopeVersionRef: string;
  minimumNecessaryContractRef: string;
  placeholderContractRef: string;
  visibleFields: Readonly<Record<string, unknown>>;
  withheldFieldRefs: readonly string[];
  serializedPayload: string;
  payloadChecksum: string;
  createdAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface PracticeContinuityMessageSnapshot {
  practiceContinuityMessageId: string;
  hubCoordinationCaseId: string;
  appointmentRecordRef: string;
  hubAppointmentId: string;
  originPracticeOds: string;
  messageClass: "booked" | "refresh" | "recovery";
  payloadRef: string;
  payloadChecksum: string;
  dedupeKey: string;
  continuityChannel: PracticeContinuityChannel;
  dispatchWorkflowId: string;
  commandActionRecordRef: string;
  idempotencyRecordRef: string;
  adapterDispatchAttemptRef: string | null;
  latestReceiptCheckpointRef: string | null;
  visibilityEnvelopeVersionRef: string;
  deliveryModelVersionRef: string;
  practiceVisibilityPolicyRef: string;
  serviceObligationPolicyRef: string;
  policyEvaluationRef: string;
  policyTupleHash: string;
  transportState: PracticeContinuityTransportState;
  transportAckState: PracticeContinuityTransportAckState;
  transportAcceptedAt: string | null;
  deliveryState: PracticeContinuityDeliveryState;
  deliveryEvidenceState: PracticeContinuityDeliveryEvidenceState;
  deliveryEvidenceRef: string | null;
  deliveryRiskState: PracticeContinuityDeliveryRiskState;
  deliveryRiskPosture: PracticeContinuityDeliveryRiskPosture;
  deliveryAttemptCount: number;
  firstDeliveredAt: string | null;
  ackGeneration: number;
  ackState: PracticeContinuityAckState;
  ackDueAt: string;
  acknowledgementEvidenceState: PracticeContinuityAcknowledgementEvidenceState;
  acknowledgementEvidenceRef: string | null;
  truthProjectionRef: string;
  truthTupleHash: string;
  transitionEnvelopeRef: string | null;
  releaseRecoveryDispositionRef: string | null;
  stateConfidenceBand: PracticeContinuityConfidenceBand;
  causalToken: string;
  monotoneRevision: number;
  messageState: PracticeContinuityMessageState;
  supersededByMessageRef: string | null;
  sourceRefs: readonly string[];
  version: number;
}

export interface PracticeContinuityDispatchAttemptSnapshot {
  practiceContinuityDispatchAttemptId: string;
  practiceContinuityMessageRef: string;
  hubCoordinationCaseId: string;
  continuityChannel: PracticeContinuityChannel;
  dispatchState: PracticeContinuityDispatchState;
  attemptNumber: number;
  dedupeKey: string;
  adapterName: string;
  adapterCorrelationKey: string | null;
  externalDispatchRef: string | null;
  attemptedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface PracticeContinuityReceiptCheckpointSnapshot {
  practiceContinuityReceiptCheckpointId: string;
  practiceContinuityMessageRef: string;
  hubCoordinationCaseId: string;
  dispatchAttemptRef: string | null;
  checkpointKind: PracticeContinuityReceiptKind;
  evidenceRef: string | null;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface PracticeContinuityDeliveryEvidenceSnapshot {
  practiceContinuityDeliveryEvidenceId: string;
  practiceContinuityMessageRef: string;
  hubCoordinationCaseId: string;
  receiptCheckpointRef: string;
  evidenceKind: "mesh_receipt" | "api_receipt" | "manual_attestation" | "dispute_record";
  deliveryState: PracticeContinuityDeliveryEvidenceState;
  deliveryRiskPosture: PracticeContinuityDeliveryRiskPosture;
  evidenceRef: string | null;
  observedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface PracticeAcknowledgementRecordSnapshot {
  acknowledgementId: string;
  hubCoordinationCaseId: string;
  practiceContinuityMessageRef: string;
  hubAppointmentId: string;
  ackGeneration: number;
  truthTupleHash: string;
  causalToken: string;
  ackState: PracticeAcknowledgementRecordState;
  ackEvidenceKind: PracticeAcknowledgementEvidenceKind;
  acknowledgedAt: string | null;
  acknowledgedByRef: string | null;
  visibilityEnvelopeVersionRef: string;
  policyEvaluationRef: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface PracticeVisibilityDeltaRecordSnapshot {
  practiceVisibilityDeltaRecordId: string;
  hubCoordinationCaseId: string;
  hubAppointmentId: string;
  priorProjectionRef: string | null;
  nextProjectionRef: string;
  priorAckGeneration: number;
  nextAckGeneration: number;
  priorVisibilityEnvelopeVersionRef: string | null;
  nextVisibilityEnvelopeVersionRef: string;
  truthTupleHash: string;
  deltaReason: PracticeVisibilityDeltaReason;
  changeClass: string;
  continuityMessageRef: string | null;
  monotoneValidation: PracticeVisibilityMonotoneValidation;
  stateConfidenceBand: PracticeContinuityConfidenceBand;
  causalToken: string;
  monotoneRevision: number;
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

export interface Phase5PracticeContinuityRepositories {
  getPayloadDocument(
    practiceContinuityPayloadDocumentId: string,
  ): Promise<SnapshotDocument<PracticeContinuityPayloadDocumentSnapshot> | null>;
  savePayloadDocument(
    snapshot: PracticeContinuityPayloadDocumentSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getMessage(
    practiceContinuityMessageId: string,
  ): Promise<SnapshotDocument<PracticeContinuityMessageSnapshot> | null>;
  findMessageByDedupeKey(
    dedupeKey: string,
  ): Promise<SnapshotDocument<PracticeContinuityMessageSnapshot> | null>;
  getCurrentMessageForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<PracticeContinuityMessageSnapshot> | null>;
  saveMessage(
    snapshot: PracticeContinuityMessageSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listMessagesForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<PracticeContinuityMessageSnapshot>[]>;
  getDispatchAttempt(
    practiceContinuityDispatchAttemptId: string,
  ): Promise<SnapshotDocument<PracticeContinuityDispatchAttemptSnapshot> | null>;
  saveDispatchAttempt(
    snapshot: PracticeContinuityDispatchAttemptSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listDispatchAttemptsForMessage(
    practiceContinuityMessageId: string,
  ): Promise<readonly SnapshotDocument<PracticeContinuityDispatchAttemptSnapshot>[]>;
  appendReceiptCheckpoint(
    snapshot: PracticeContinuityReceiptCheckpointSnapshot,
  ): Promise<void>;
  listReceiptCheckpointsForMessage(
    practiceContinuityMessageId: string,
  ): Promise<readonly SnapshotDocument<PracticeContinuityReceiptCheckpointSnapshot>[]>;
  saveDeliveryEvidence(
    snapshot: PracticeContinuityDeliveryEvidenceSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listDeliveryEvidenceForMessage(
    practiceContinuityMessageId: string,
  ): Promise<readonly SnapshotDocument<PracticeContinuityDeliveryEvidenceSnapshot>[]>;
  getAcknowledgementRecord(
    acknowledgementId: string,
  ): Promise<SnapshotDocument<PracticeAcknowledgementRecordSnapshot> | null>;
  getAcknowledgementForMessage(
    practiceContinuityMessageId: string,
  ): Promise<SnapshotDocument<PracticeAcknowledgementRecordSnapshot> | null>;
  getCurrentAcknowledgementForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<PracticeAcknowledgementRecordSnapshot> | null>;
  saveAcknowledgementRecord(
    snapshot: PracticeAcknowledgementRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAcknowledgementsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<PracticeAcknowledgementRecordSnapshot>[]>;
  appendDeltaRecord(snapshot: PracticeVisibilityDeltaRecordSnapshot): Promise<void>;
  listDeltaRecordsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<PracticeVisibilityDeltaRecordSnapshot>[]>;
}

export class Phase5PracticeContinuityStore
  implements Phase5PracticeContinuityRepositories
{
  private readonly payloads = new Map<string, PracticeContinuityPayloadDocumentSnapshot>();
  private readonly messages = new Map<string, PracticeContinuityMessageSnapshot>();
  private readonly caseMessages = new Map<string, string[]>();
  private readonly currentMessageByCase = new Map<string, string>();
  private readonly dedupeMessage = new Map<string, string>();
  private readonly dispatchAttempts = new Map<string, PracticeContinuityDispatchAttemptSnapshot>();
  private readonly messageDispatches = new Map<string, string[]>();
  private readonly receiptCheckpoints = new Map<string, PracticeContinuityReceiptCheckpointSnapshot[]>();
  private readonly deliveryEvidence = new Map<string, PracticeContinuityDeliveryEvidenceSnapshot>();
  private readonly messageEvidence = new Map<string, string[]>();
  private readonly acknowledgements = new Map<string, PracticeAcknowledgementRecordSnapshot>();
  private readonly acknowledgementByMessage = new Map<string, string>();
  private readonly currentAcknowledgementByCase = new Map<string, string>();
  private readonly caseAcknowledgements = new Map<string, string[]>();
  private readonly deltaRecords = new Map<string, PracticeVisibilityDeltaRecordSnapshot[]>();

  private pushIndex(index: Map<string, string[]>, key: string, id: string) {
    const current = index.get(key) ?? [];
    if (!current.includes(id)) {
      index.set(key, [...current, id]);
    }
  }

  async getPayloadDocument(practiceContinuityPayloadDocumentId: string) {
    const row = this.payloads.get(practiceContinuityPayloadDocumentId);
    return row ? new StoredDocument(row) : null;
  }

  async savePayloadDocument(
    snapshot: PracticeContinuityPayloadDocumentSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.payloads,
      snapshot.practiceContinuityPayloadDocumentId,
      snapshot,
      options,
    );
  }

  async getMessage(practiceContinuityMessageId: string) {
    const row = this.messages.get(practiceContinuityMessageId);
    return row ? new StoredDocument(row) : null;
  }

  async findMessageByDedupeKey(dedupeKey: string) {
    const messageId = this.dedupeMessage.get(dedupeKey);
    return messageId ? this.getMessage(messageId) : null;
  }

  async getCurrentMessageForCase(hubCoordinationCaseId: string) {
    const messageId = this.currentMessageByCase.get(hubCoordinationCaseId);
    return messageId ? this.getMessage(messageId) : null;
  }

  async saveMessage(
    snapshot: PracticeContinuityMessageSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.messages, snapshot.practiceContinuityMessageId, snapshot, options);
    this.pushIndex(
      this.caseMessages,
      snapshot.hubCoordinationCaseId,
      snapshot.practiceContinuityMessageId,
    );
    this.dedupeMessage.set(snapshot.dedupeKey, snapshot.practiceContinuityMessageId);
    const currentMessageId = this.currentMessageByCase.get(snapshot.hubCoordinationCaseId);
    if (snapshot.messageState === "current") {
      this.currentMessageByCase.set(
        snapshot.hubCoordinationCaseId,
        snapshot.practiceContinuityMessageId,
      );
    } else if (currentMessageId === snapshot.practiceContinuityMessageId) {
      this.currentMessageByCase.delete(snapshot.hubCoordinationCaseId);
    }
  }

  async listMessagesForCase(hubCoordinationCaseId: string) {
    return (this.caseMessages.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.messages.get(id))
      .filter((value): value is PracticeContinuityMessageSnapshot => value !== undefined)
      .sort((left, right) => left.monotoneRevision - right.monotoneRevision)
      .map((value) => new StoredDocument(value));
  }

  async getDispatchAttempt(practiceContinuityDispatchAttemptId: string) {
    const row = this.dispatchAttempts.get(practiceContinuityDispatchAttemptId);
    return row ? new StoredDocument(row) : null;
  }

  async saveDispatchAttempt(
    snapshot: PracticeContinuityDispatchAttemptSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.dispatchAttempts,
      snapshot.practiceContinuityDispatchAttemptId,
      snapshot,
      options,
    );
    this.pushIndex(
      this.messageDispatches,
      snapshot.practiceContinuityMessageRef,
      snapshot.practiceContinuityDispatchAttemptId,
    );
  }

  async listDispatchAttemptsForMessage(practiceContinuityMessageId: string) {
    return (this.messageDispatches.get(practiceContinuityMessageId) ?? [])
      .map((id) => this.dispatchAttempts.get(id))
      .filter((value): value is PracticeContinuityDispatchAttemptSnapshot => value !== undefined)
      .sort((left, right) => compareIso(left.attemptedAt, right.attemptedAt))
      .map((value) => new StoredDocument(value));
  }

  async appendReceiptCheckpoint(snapshot: PracticeContinuityReceiptCheckpointSnapshot) {
    const current = this.receiptCheckpoints.get(snapshot.practiceContinuityMessageRef) ?? [];
    this.receiptCheckpoints.set(snapshot.practiceContinuityMessageRef, [
      ...current,
      structuredClone(snapshot),
    ]);
  }

  async listReceiptCheckpointsForMessage(practiceContinuityMessageId: string) {
    return (this.receiptCheckpoints.get(practiceContinuityMessageId) ?? [])
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => new StoredDocument(row));
  }

  async saveDeliveryEvidence(
    snapshot: PracticeContinuityDeliveryEvidenceSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.deliveryEvidence,
      snapshot.practiceContinuityDeliveryEvidenceId,
      snapshot,
      options,
    );
    this.pushIndex(
      this.messageEvidence,
      snapshot.practiceContinuityMessageRef,
      snapshot.practiceContinuityDeliveryEvidenceId,
    );
  }

  async listDeliveryEvidenceForMessage(practiceContinuityMessageId: string) {
    return (this.messageEvidence.get(practiceContinuityMessageId) ?? [])
      .map((id) => this.deliveryEvidence.get(id))
      .filter((value): value is PracticeContinuityDeliveryEvidenceSnapshot => value !== undefined)
      .sort((left, right) => compareIso(left.observedAt, right.observedAt))
      .map((value) => new StoredDocument(value));
  }

  async getAcknowledgementRecord(acknowledgementId: string) {
    const row = this.acknowledgements.get(acknowledgementId);
    return row ? new StoredDocument(row) : null;
  }

  async getAcknowledgementForMessage(practiceContinuityMessageId: string) {
    const acknowledgementId = this.acknowledgementByMessage.get(practiceContinuityMessageId);
    return acknowledgementId ? this.getAcknowledgementRecord(acknowledgementId) : null;
  }

  async getCurrentAcknowledgementForCase(hubCoordinationCaseId: string) {
    const acknowledgementId = this.currentAcknowledgementByCase.get(hubCoordinationCaseId);
    return acknowledgementId ? this.getAcknowledgementRecord(acknowledgementId) : null;
  }

  async saveAcknowledgementRecord(
    snapshot: PracticeAcknowledgementRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.acknowledgements, snapshot.acknowledgementId, snapshot, options);
    this.acknowledgementByMessage.set(
      snapshot.practiceContinuityMessageRef,
      snapshot.acknowledgementId,
    );
    this.pushIndex(
      this.caseAcknowledgements,
      snapshot.hubCoordinationCaseId,
      snapshot.acknowledgementId,
    );
    const currentId = this.currentAcknowledgementByCase.get(snapshot.hubCoordinationCaseId);
    if (snapshot.ackState === "pending" || snapshot.ackState === "received" || snapshot.ackState === "exception_recorded") {
      this.currentAcknowledgementByCase.set(
        snapshot.hubCoordinationCaseId,
        snapshot.acknowledgementId,
      );
    } else if (currentId === snapshot.acknowledgementId) {
      this.currentAcknowledgementByCase.delete(snapshot.hubCoordinationCaseId);
    }
  }

  async listAcknowledgementsForCase(hubCoordinationCaseId: string) {
    return (this.caseAcknowledgements.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.acknowledgements.get(id))
      .filter((value): value is PracticeAcknowledgementRecordSnapshot => value !== undefined)
      .sort((left, right) => compareIso(left.acknowledgedAt ?? "", right.acknowledgedAt ?? ""))
      .map((value) => new StoredDocument(value));
  }

  async appendDeltaRecord(snapshot: PracticeVisibilityDeltaRecordSnapshot) {
    const current = this.deltaRecords.get(snapshot.hubCoordinationCaseId) ?? [];
    this.deltaRecords.set(snapshot.hubCoordinationCaseId, [...current, structuredClone(snapshot)]);
  }

  async listDeltaRecordsForCase(hubCoordinationCaseId: string) {
    return (this.deltaRecords.get(hubCoordinationCaseId) ?? [])
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => new StoredDocument(row));
  }
}

export function createPhase5PracticeContinuityStore(): Phase5PracticeContinuityStore {
  return new Phase5PracticeContinuityStore();
}

export interface PracticeContinuityDispatchAdapterInput {
  message: PracticeContinuityMessageSnapshot;
  payload: PracticeContinuityPayloadDocumentSnapshot;
  attemptedAt: string;
}

export interface PracticeContinuityDispatchAdapterResult {
  outcome: "accepted" | "rejected" | "timed_out";
  adapterName: string;
  adapterCorrelationKey?: string | null;
  externalDispatchRef?: string | null;
  immediateCheckpointKind?: PracticeContinuityReceiptKind | null;
  evidenceRef?: string | null;
}

export interface PracticeContinuityDispatchAdapter {
  channel: PracticeContinuityChannel;
  dispatch(
    input: PracticeContinuityDispatchAdapterInput,
  ): Promise<PracticeContinuityDispatchAdapterResult>;
}

function createStaticDispatchAdapter(
  channel: PracticeContinuityChannel,
  adapterName: string,
  resultFactory: (input: PracticeContinuityDispatchAdapterInput) => PracticeContinuityDispatchAdapterResult,
): PracticeContinuityDispatchAdapter {
  return {
    channel,
    async dispatch(input) {
      return resultFactory(input);
    },
  };
}

export function createMeshPracticeContinuityAdapter(): PracticeContinuityDispatchAdapter {
  return createStaticDispatchAdapter("mesh", "mesh", (input) => ({
    outcome: "accepted",
    adapterName: "mesh",
    adapterCorrelationKey: `${input.message.practiceContinuityMessageId}::mesh`,
    externalDispatchRef: `${input.message.practiceContinuityMessageId}::mesh-dispatch`,
  }));
}

export function createDirectApiPracticeContinuityAdapter(): PracticeContinuityDispatchAdapter {
  return createStaticDispatchAdapter("direct_api", "direct_api", (input) => ({
    outcome: "accepted",
    adapterName: "direct_api",
    adapterCorrelationKey: `${input.message.practiceContinuityMessageId}::api`,
    externalDispatchRef: `${input.message.practiceContinuityMessageId}::api-dispatch`,
    immediateCheckpointKind: "delivery_available",
    evidenceRef: `${input.message.practiceContinuityMessageId}::api-delivered`,
  }));
}

export function createManualSecureMailPracticeContinuityAdapter(): PracticeContinuityDispatchAdapter {
  return createStaticDispatchAdapter("manual_secure_mail", "manual_secure_mail", (input) => ({
    outcome: "accepted",
    adapterName: "manual_secure_mail",
    adapterCorrelationKey: `${input.message.practiceContinuityMessageId}::mail`,
    externalDispatchRef: `${input.message.practiceContinuityMessageId}::mail-dispatch`,
  }));
}

export function createInternalTransferPracticeContinuityAdapter(): PracticeContinuityDispatchAdapter {
  return createStaticDispatchAdapter("internal_transfer", "internal_transfer", (input) => ({
    outcome: "accepted",
    adapterName: "internal_transfer",
    adapterCorrelationKey: `${input.message.practiceContinuityMessageId}::internal`,
    externalDispatchRef: `${input.message.practiceContinuityMessageId}::internal-dispatch`,
    immediateCheckpointKind: "delivery_downloaded",
    evidenceRef: `${input.message.practiceContinuityMessageId}::internal-downloaded`,
  }));
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

function computeContinuityTupleHash(
  snapshot: Omit<HubContinuityEvidenceProjectionSnapshot, "continuityTupleHash"> & {
    continuityTupleHash?: string;
  },
): string {
  return sha256Hex(
    stableStringify({
      routeFamilyRef: snapshot.routeFamilyRef,
      routeContinuityEvidenceContractRef: snapshot.routeContinuityEvidenceContractRef,
      governingObjectRef: snapshot.governingObjectRef,
      selectedAnchorRef: snapshot.selectedAnchorRef,
      selectedAnchorTupleHashRef: snapshot.selectedAnchorTupleHashRef,
      continuityEnvelopeVersionRef: snapshot.continuityEnvelopeVersionRef,
      latestSettlementRef: snapshot.latestSettlementRef,
      latestContinuationRef: snapshot.latestContinuationRef,
      experienceContinuityEvidenceRef: snapshot.experienceContinuityEvidenceRef,
      validationState: snapshot.validationState,
      blockingRefs: [...snapshot.blockingRefs].sort(),
      monotoneRevision: snapshot.monotoneRevision,
    }),
  );
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

function requireBundle(bundle: HubCaseBundle | null, hubCoordinationCaseId: string): HubCaseBundle {
  invariant(
    bundle !== null,
    "HUB_CASE_BUNDLE_NOT_FOUND",
    `HubCoordinationCase ${hubCoordinationCaseId} was not found.`,
  );
  return bundle;
}

async function requireSnapshot<T>(
  loader: Promise<SnapshotDocument<T> | null>,
  code: string,
  message: string,
): Promise<T> {
  const document = await loader;
  invariant(document !== null, code, message);
  return document.toSnapshot();
}

async function requireCurrentTruthProjection(
  repositories: Phase5AlternativeOfferEngineRepositories,
  hubCoordinationCaseId: string,
): Promise<HubOfferToConfirmationTruthProjectionSnapshot> {
  return requireSnapshot(
    repositories.getTruthProjectionForCase(hubCoordinationCaseId),
    "HUB_OFFER_TRUTH_NOT_FOUND",
    "HubOfferToConfirmationTruthProjection is required before practice continuity can proceed.",
  );
}

function deriveContinuationConfirmationTruthState(
  current: HubOfferToConfirmationTruthProjectionSnapshot["confirmationTruthState"],
  ackCleared: boolean,
): HubOfferToConfirmationTruthProjectionSnapshot["confirmationTruthState"] {
  if (current === "blocked_by_drift" || current === "disputed" || current === "expired") {
    return current;
  }
  return ackCleared ? "confirmed" : "confirmed_pending_practice_ack";
}

function derivePatientVisibilityState(
  confirmationTruthState: HubOfferToConfirmationTruthProjectionSnapshot["confirmationTruthState"],
): HubOfferToConfirmationTruthProjectionSnapshot["patientVisibilityState"] {
  switch (confirmationTruthState) {
    case "confirmed":
    case "confirmed_pending_practice_ack":
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
  confirmationTruthState: HubOfferToConfirmationTruthProjectionSnapshot["confirmationTruthState"];
  message: Pick<
    PracticeContinuityMessageSnapshot,
    "ackState" | "transportAckState" | "deliveryEvidenceState" | "deliveryState"
  >;
}): HubOfferToConfirmationTruthProjectionSnapshot["practiceVisibilityState"] {
  if (
    input.confirmationTruthState === "blocked_by_drift" ||
    input.confirmationTruthState === "disputed" ||
    input.confirmationTruthState === "expired"
  ) {
    return "recovery_required";
  }
  if (input.message.ackState === "acknowledged") {
    return "acknowledged";
  }
  if (input.message.ackState === "not_required") {
    return "exception_granted";
  }
  if (input.message.ackState === "recovery_required" || input.message.ackState === "disputed") {
    return "recovery_required";
  }
  if (
    input.message.deliveryEvidenceState === "delivered" ||
    input.message.deliveryState === "available_for_collection" ||
    input.message.deliveryState === "downloaded"
  ) {
    return "ack_pending";
  }
  if (input.message.transportAckState === "accepted") {
    return "continuity_pending";
  }
  return "continuity_pending";
}

function deriveClosureState(input: {
  confirmationTruthState: HubOfferToConfirmationTruthProjectionSnapshot["confirmationTruthState"];
  practiceVisibilityState: HubOfferToConfirmationTruthProjectionSnapshot["practiceVisibilityState"];
  fallbackLinkState: HubOfferToConfirmationTruthProjectionSnapshot["fallbackLinkState"];
}): HubOfferToConfirmationTruthProjectionSnapshot["closureState"] {
  if (input.confirmationTruthState === "blocked_by_drift") {
    return "blocked_by_supplier_drift";
  }
  if (
    input.fallbackLinkState === "callback_pending_link" ||
    input.fallbackLinkState === "return_pending_link"
  ) {
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
  practiceVisibilityState: HubOfferToConfirmationTruthProjectionSnapshot["practiceVisibilityState"];
  ackState: PracticeContinuityAckState;
  closureState: HubOfferToConfirmationTruthProjectionSnapshot["closureState"];
  transportAckState: PracticeContinuityTransportAckState;
  deliveryEvidenceState: PracticeContinuityDeliveryEvidenceState;
  extraRefs?: readonly string[];
}): string[] {
  return uniqueSortedRefs([
    input.practiceVisibilityState === "continuity_pending" ? "practice_continuity_pending" : "",
    input.practiceVisibilityState === "ack_pending" ? "practice_ack_pending" : "",
    input.ackState === "overdue" ? "practice_ack_overdue" : "",
    input.practiceVisibilityState === "recovery_required" ? "practice_visibility_recovery_required" : "",
    input.transportAckState === "timed_out" ? "practice_transport_timeout" : "",
    input.transportAckState === "rejected" ? "practice_transport_rejected" : "",
    input.deliveryEvidenceState === "failed" ? "practice_delivery_failed" : "",
    input.deliveryEvidenceState === "disputed" ? "practice_delivery_disputed" : "",
    input.deliveryEvidenceState === "expired" ? "practice_delivery_expired" : "",
    input.closureState === "blocked_by_fallback_linkage" ? "fallback_linkage_pending" : "",
    ...(input.extraRefs ?? []),
  ]);
}

function deriveMessageConfidenceBand(
  message: Pick<
    PracticeContinuityMessageSnapshot,
    "ackState" | "transportAckState" | "deliveryEvidenceState"
  >,
): PracticeContinuityConfidenceBand {
  if (message.ackState === "acknowledged" || message.ackState === "not_required") {
    return "high";
  }
  if (message.deliveryEvidenceState === "delivered" || message.transportAckState === "accepted") {
    return "medium";
  }
  return "low";
}

function deriveContinuityValidationState(
  message: Pick<
    PracticeContinuityMessageSnapshot,
    "ackState" | "deliveryEvidenceState" | "transportAckState"
  >,
): HubContinuityEvidenceProjectionSnapshot["validationState"] {
  if (message.ackState === "acknowledged" || message.ackState === "not_required") {
    return "trusted";
  }
  if (
    message.deliveryEvidenceState === "failed" ||
    message.deliveryEvidenceState === "expired" ||
    message.deliveryEvidenceState === "disputed" ||
    message.transportAckState === "rejected" ||
    message.transportAckState === "timed_out"
  ) {
    return "blocked";
  }
  return "degraded";
}

function deriveAppointmentAckState(
  message: Pick<PracticeContinuityMessageSnapshot, "ackState" | "messageState">,
): HubAppointmentRecordSnapshot["practiceAcknowledgementState"] {
  if (message.messageState === "superseded") {
    return "superseded";
  }
  if (message.ackState === "acknowledged") {
    return "acknowledged";
  }
  if (message.ackState === "not_required") {
    return "exception_recorded";
  }
  return "ack_pending";
}

function deriveHighLevelAckState(input: {
  ackDueAt: string;
  acknowledgementEvidenceState: PracticeContinuityAcknowledgementEvidenceState;
  transportAckState: PracticeContinuityTransportAckState;
  deliveryEvidenceState: PracticeContinuityDeliveryEvidenceState;
  asOf: string;
}): PracticeContinuityAckState {
  if (input.acknowledgementEvidenceState === "ack_exception_recorded") {
    return "not_required";
  }
  if (input.acknowledgementEvidenceState === "ack_received") {
    return "acknowledged";
  }
  if (
    input.transportAckState === "rejected" ||
    input.transportAckState === "timed_out" ||
    input.deliveryEvidenceState === "failed" ||
    input.deliveryEvidenceState === "disputed" ||
    input.deliveryEvidenceState === "expired"
  ) {
    return "recovery_required";
  }
  if (compareIso(input.asOf, input.ackDueAt) > 0) {
    return "overdue";
  }
  return "pending";
}

function deriveDeliveryEvidenceState(
  checkpointKind: PracticeContinuityReceiptKind,
  current: PracticeContinuityDeliveryEvidenceState,
): PracticeContinuityDeliveryEvidenceState {
  switch (checkpointKind) {
    case "delivery_available":
    case "delivery_downloaded":
      return "delivered";
    case "delivery_expired":
      return "expired";
    case "delivery_failed":
      return "failed";
    case "delivery_disputed":
      return "disputed";
    default:
      return current;
  }
}

function deriveDeliveryState(
  checkpointKind: PracticeContinuityReceiptKind,
  current: PracticeContinuityDeliveryState,
): PracticeContinuityDeliveryState {
  switch (checkpointKind) {
    case "delivery_available":
      return "available_for_collection";
    case "delivery_downloaded":
      return "downloaded";
    case "delivery_expired":
      return "expired";
    case "delivery_failed":
      return "failed";
    default:
      return current;
  }
}

function deriveDeliveryRiskState(
  checkpointKind: PracticeContinuityReceiptKind,
  current: PracticeContinuityDeliveryRiskState,
): PracticeContinuityDeliveryRiskState {
  switch (checkpointKind) {
    case "delivery_available":
      return "awaiting_download";
    case "delivery_downloaded":
      return "none";
    case "delivery_expired":
      return "non_delivery_risk";
    case "delivery_failed":
      return "failed";
    case "transport_timed_out":
      return "non_delivery_risk";
    default:
      return current;
  }
}

function deriveDeliveryRiskPosture(
  checkpointKind: PracticeContinuityReceiptKind,
  current: PracticeContinuityDeliveryRiskPosture,
): PracticeContinuityDeliveryRiskPosture {
  switch (checkpointKind) {
    case "delivery_available":
    case "delivery_downloaded":
      return "on_track";
    case "transport_timed_out":
      return "at_risk";
    case "delivery_expired":
    case "delivery_failed":
      return "likely_failed";
    case "delivery_disputed":
      return "disputed";
    default:
      return current;
  }
}

function buildPolicyFacts(
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot,
  minimumNecessaryContractRef: string,
  overrides?: Partial<PolicyEvaluationFactsSnapshot>,
): PolicyEvaluationFactsSnapshot {
  return {
    routeToNetworkRequested: true,
    urgentBounceRequired: false,
    requiredWindowFit: null,
    sourceAdmissionSummary: [],
    staleCapacityDetected: false,
    adjustedPopulation: null,
    deliveredMinutes: null,
    availableMinutes: null,
    cancelledMinutes: null,
    replacementMinutes: null,
    commissionerExceptionRef: null,
    minimumNecessaryContractRef,
    ackDebtOpen: truthProjection.practiceAckGeneration > 0,
    visibilityDeltaRequired: truthProjection.practiceVisibilityState !== "not_started",
    ...(overrides ?? {}),
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
    networkAppointmentRef?: string | null;
    offerToConfirmationTruthRef?: string | null;
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
    networkAppointmentRef: input.networkAppointmentRef ?? undefined,
    offerToConfirmationTruthRef: input.offerToConfirmationTruthRef ?? undefined,
    practiceAckGeneration: input.practiceAckGeneration ?? undefined,
    practiceAckDueAt: input.practiceAckDueAt ?? undefined,
    carriedOpenCaseBlockerRefs: input.carriedOpenCaseBlockerRefs ?? undefined,
  };
}

function practicePayloadFromProjection(input: {
  projection: MinimumNecessaryProjectionResult;
  envelope: CrossOrganisationVisibilityEnvelopeSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  appointment: HubAppointmentRecordSnapshot;
  policyEvaluation: NetworkPolicyEvaluationResult;
  ackState: PracticeContinuityAckState;
  recordedAt: string;
  hubCoordinationCaseId: string;
  idGenerator: BackboneIdGenerator;
  sourceRefs: readonly string[];
}): PracticeContinuityPayloadDocumentSnapshot {
  const canonicalFields: Record<string, unknown> = {
    request_lineage_ref: input.projection.visibleFields.requestLineageRef ?? null,
    macro_status:
      input.projection.visibleFields.macro_booking_status ?? input.truthProjection.confirmationTruthState,
    continuity_delta:
      input.projection.visibleFields.latest_continuity_delta ?? input.truthProjection.practiceVisibilityState,
    ack_state: input.ackState,
    ack_generation_state: input.truthProjection.practiceAckGeneration,
    patient_communication_state:
      input.projection.visibleFields.patient_communication_state ?? input.truthProjection.patientVisibilityState,
    fallback_reason_code: input.projection.visibleFields.fallback_reason_code ?? null,
    manage_capability_state:
      input.projection.visibleFields.manage_capability_state ??
      input.appointment.manageCapabilitiesRef ??
      "managed_by_hub",
    appointment_version_ref: input.appointment.appointmentVersionRef,
    visibility_policy_ref: input.policyEvaluation.evaluation.practiceVisibilityPolicyRef,
  };
  const serializedPayload = stableStringify({
    visibleFields: canonicalFields,
    placeholderContractRef: input.projection.placeholderContractRef,
    withheldFieldRefs: input.projection.withheldFieldRefs,
    visibilityEnvelopeVersionRef: input.envelope.crossOrganisationVisibilityEnvelopeId,
  });
  return {
    practiceContinuityPayloadDocumentId: nextId(input.idGenerator, "practiceContinuityPayloadDocument"),
    hubCoordinationCaseId: input.hubCoordinationCaseId,
    visibilityEnvelopeVersionRef: input.envelope.crossOrganisationVisibilityEnvelopeId,
    minimumNecessaryContractRef: input.envelope.minimumNecessaryContractRef,
    placeholderContractRef: input.projection.placeholderContractRef,
    visibleFields: canonicalFields,
    withheldFieldRefs: input.projection.withheldFieldRefs,
    serializedPayload,
    payloadChecksum: sha256Hex(serializedPayload),
    createdAt: input.recordedAt,
    sourceRefs: uniqueSortedRefs(input.sourceRefs),
    version: 1,
  };
}

export interface EnqueuePracticeContinuityMessageInput {
  hubCoordinationCaseId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  crossOrganisationVisibilityEnvelopeId: string;
  continuityChannel: PracticeContinuityChannel;
  dispatchWorkflowId: string;
  idempotencyRecordRef?: string | null;
  ackDueAt?: string | null;
  sourceRefs?: readonly string[];
  authority?: HubCommandAuthorityInput;
  policyFacts?: Partial<PolicyEvaluationFactsSnapshot>;
}

export interface DispatchPracticeContinuityMessageInput {
  practiceContinuityMessageId: string;
  attemptedAt: string;
  sourceRefs?: readonly string[];
}

export interface RecordPracticeContinuityReceiptInput {
  practiceContinuityMessageId: string;
  recordedAt: string;
  checkpointKind: PracticeContinuityReceiptKind;
  dispatchAttemptId?: string | null;
  evidenceRef?: string | null;
  sourceRefs?: readonly string[];
}

export interface CapturePracticeAcknowledgementInput {
  hubCoordinationCaseId: string;
  practiceContinuityMessageId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  ackEvidenceKind: PracticeAcknowledgementEvidenceKind;
  acknowledgedByRef?: string | null;
  presentedAckGeneration: number;
  presentedTruthTupleHash: string;
  presentedVisibilityEnvelopeVersionRef: string;
  sourceRefs?: readonly string[];
  authority?: HubCommandAuthorityInput;
  policyFacts?: Partial<PolicyEvaluationFactsSnapshot>;
}

export interface ReopenPracticeAcknowledgementDebtInput {
  hubCoordinationCaseId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  changeClass: string;
  deltaReason: PracticeVisibilityDeltaReason;
  incrementGeneration?: boolean;
  reopenedDueAt?: string | null;
  sourceRefs?: readonly string[];
  authority?: HubCommandAuthorityInput;
}

export interface PracticeContinuityMutationResult {
  message: PracticeContinuityMessageSnapshot | null;
  payload: PracticeContinuityPayloadDocumentSnapshot | null;
  dispatchAttempt: PracticeContinuityDispatchAttemptSnapshot | null;
  receiptCheckpoint: PracticeContinuityReceiptCheckpointSnapshot | null;
  deliveryEvidence: PracticeContinuityDeliveryEvidenceSnapshot | null;
  acknowledgement: PracticeAcknowledgementRecordSnapshot | null;
  deltaRecord: PracticeVisibilityDeltaRecordSnapshot | null;
  appointment: HubAppointmentRecordSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  continuityProjection: HubContinuityEvidenceProjectionSnapshot | null;
  mirrorState: HubSupplierMirrorStateSnapshot | null;
  policyEvaluation: NetworkPolicyEvaluationResult | null;
  visibilityEnvelope: CrossOrganisationVisibilityEnvelopeSnapshot | null;
  authorityDecision: HubCommandAuthorityDecision | null;
  hubTransition: HubCaseTransitionResult | null;
  replayed: boolean;
}

export interface CurrentPracticeContinuityState {
  currentMessage: PracticeContinuityMessageSnapshot | null;
  currentAcknowledgement: PracticeAcknowledgementRecordSnapshot | null;
  latestDispatchAttempt: PracticeContinuityDispatchAttemptSnapshot | null;
  latestReceiptCheckpoint: PracticeContinuityReceiptCheckpointSnapshot | null;
  latestDeliveryEvidence: PracticeContinuityDeliveryEvidenceSnapshot | null;
  latestDeltaRecord: PracticeVisibilityDeltaRecordSnapshot | null;
  appointment: HubAppointmentRecordSnapshot | null;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot | null;
}

export interface Phase5PracticeContinuityService {
  repositories: Phase5PracticeContinuityRepositories;
  hubCaseService: Phase5HubCaseKernelService;
  enqueuePracticeContinuityMessage(
    input: EnqueuePracticeContinuityMessageInput,
  ): Promise<PracticeContinuityMutationResult>;
  dispatchPracticeContinuityMessage(
    input: DispatchPracticeContinuityMessageInput,
  ): Promise<PracticeContinuityMutationResult>;
  recordReceiptCheckpoint(
    input: RecordPracticeContinuityReceiptInput,
  ): Promise<PracticeContinuityMutationResult>;
  capturePracticeAcknowledgement(
    input: CapturePracticeAcknowledgementInput,
  ): Promise<PracticeContinuityMutationResult>;
  reopenPracticeAcknowledgementDebt(
    input: ReopenPracticeAcknowledgementDebtInput,
  ): Promise<PracticeContinuityMutationResult>;
  queryCurrentPracticeContinuityState(
    hubCoordinationCaseId: string,
  ): Promise<CurrentPracticeContinuityState>;
}

export interface CreatePhase5PracticeContinuityServiceOptions {
  repositories: Phase5PracticeContinuityRepositories;
  hubCaseService: Phase5HubCaseKernelService;
  offerRepositories: Phase5AlternativeOfferEngineRepositories;
  commitRepositories: Phase5HubCommitEngineRepositories;
  policyService: Phase5EnhancedAccessPolicyService;
  actingScopeService?: Phase5ActingScopeVisibilityService;
  adapters?: readonly PracticeContinuityDispatchAdapter[];
  idGenerator?: BackboneIdGenerator;
}

export function createPhase5PracticeContinuityService(
  input?: Partial<CreatePhase5PracticeContinuityServiceOptions>,
): Phase5PracticeContinuityService {
  const hubCaseService = input?.hubCaseService ?? createPhase5HubCaseKernelService();
  const repositories = input?.repositories ?? createPhase5PracticeContinuityStore();
  const offerRepositories =
    input?.offerRepositories ?? createPhase5AlternativeOfferEngineStore();
  const commitRepositories = input?.commitRepositories ?? createPhase5HubCommitEngineStore();
  const policyService =
    input?.policyService ?? createPhase5EnhancedAccessPolicyService({ hubCaseService });
  const actingScopeService =
    input?.actingScopeService ?? createPhase5ActingScopeVisibilityService({ hubCaseService });
  const idGenerator =
    input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase5-practice-continuity");
  const adapters = new Map<PracticeContinuityChannel, PracticeContinuityDispatchAdapter>();
  for (const adapter of input?.adapters ?? [
    createMeshPracticeContinuityAdapter(),
    createDirectApiPracticeContinuityAdapter(),
    createManualSecureMailPracticeContinuityAdapter(),
    createInternalTransferPracticeContinuityAdapter(),
  ]) {
    adapters.set(adapter.channel, adapter);
  }

  async function loadCurrentContext(hubCoordinationCaseId: string) {
    const hubCaseBundle = requireBundle(
      await hubCaseService.queryHubCaseBundle(hubCoordinationCaseId),
      hubCoordinationCaseId,
    );
    const truthProjection = await requireCurrentTruthProjection(
      offerRepositories,
      hubCoordinationCaseId,
    );
    const appointments = (
      await commitRepositories.listAppointmentsForCase(hubCoordinationCaseId)
    ).map((row) => row.toSnapshot());
    invariant(
      appointments.length > 0,
      "HUB_APPOINTMENT_NOT_FOUND",
      "A HubAppointmentRecord is required before practice continuity can proceed.",
    );
    const appointment = appointments.sort((left, right) => left.version - right.version).at(-1)!;
    const continuityProjection = (
      await commitRepositories.getContinuityProjectionForCase(hubCoordinationCaseId)
    )?.toSnapshot() ?? null;
    const mirrorState = (
      await commitRepositories.getMirrorStateForAppointment(appointment.hubAppointmentId)
    )?.toSnapshot() ?? null;
    const currentMessage = (
      await repositories.getCurrentMessageForCase(hubCoordinationCaseId)
    )?.toSnapshot() ?? null;
    const currentAcknowledgement = (
      await repositories.getCurrentAcknowledgementForCase(hubCoordinationCaseId)
    )?.toSnapshot() ?? null;
    return {
      hubCaseBundle,
      truthProjection,
      appointment,
      continuityProjection,
      mirrorState,
      currentMessage,
      currentAcknowledgement,
    };
  }

  async function evaluatePracticeVisibilityPolicy(inputValue: {
    hubCase: HubCoordinationCaseSnapshot;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    minimumNecessaryContractRef: string;
    recordedAt: string;
    facts?: Partial<PolicyEvaluationFactsSnapshot>;
  }): Promise<NetworkPolicyEvaluationResult> {
    return policyService.evaluateHubCaseAgainstPolicy({
      hubCoordinationCaseId: inputValue.hubCase.hubCoordinationCaseId,
      pcnRef: inputValue.hubCase.servingPcnId,
      evaluationScope: "practice_visibility_generation",
      evaluatedAt: inputValue.recordedAt,
      presentedPolicyTupleHash: inputValue.hubCase.policyTupleHash,
      facts: buildPolicyFacts(
        inputValue.truthProjection,
        inputValue.minimumNecessaryContractRef,
        inputValue.facts,
      ),
    });
  }

  async function applyProjectionMutation(inputValue: {
    hubCase: HubCoordinationCaseSnapshot;
    appointment: HubAppointmentRecordSnapshot;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    continuityProjection: HubContinuityEvidenceProjectionSnapshot | null;
    mirrorState: HubSupplierMirrorStateSnapshot | null;
    message: PracticeContinuityMessageSnapshot | null;
    acknowledgement: PracticeAcknowledgementRecordSnapshot | null;
    generatedAt: string;
  }) {
    const nextConfirmationTruthState = deriveContinuationConfirmationTruthState(
      inputValue.truthProjection.confirmationTruthState,
      inputValue.message?.ackState === "acknowledged" || inputValue.message?.ackState === "not_required",
    );
    const nextPracticeVisibilityState =
      inputValue.message === null
        ? "recovery_required"
        : derivePracticeVisibilityState({
            confirmationTruthState: nextConfirmationTruthState,
            message: inputValue.message,
          });
    const closureState = deriveClosureState({
      confirmationTruthState: nextConfirmationTruthState,
      practiceVisibilityState: nextPracticeVisibilityState,
      fallbackLinkState: inputValue.truthProjection.fallbackLinkState,
    });
    const nextTruth = updateTruthProjection(
      inputValue.truthProjection,
      {
        confirmationTruthState: nextConfirmationTruthState,
        patientVisibilityState: derivePatientVisibilityState(nextConfirmationTruthState),
        practiceVisibilityState: nextPracticeVisibilityState,
        closureState,
        practiceAcknowledgementRef: inputValue.acknowledgement?.acknowledgementId ?? null,
        blockingRefs: deriveBlockingRefs({
          practiceVisibilityState: nextPracticeVisibilityState,
          ackState: inputValue.message?.ackState ?? "recovery_required",
          closureState,
          transportAckState: inputValue.message?.transportAckState ?? "none",
          deliveryEvidenceState: inputValue.message?.deliveryEvidenceState ?? "pending",
        }),
      },
      inputValue.generatedAt,
    );
    const nextAppointment: HubAppointmentRecordSnapshot = {
      ...inputValue.appointment,
      appointmentState:
        nextConfirmationTruthState === "confirmed"
          ? "confirmed"
          : "confirmed_pending_practice_ack",
      practiceAcknowledgementState:
        inputValue.message === null
          ? "ack_pending"
          : deriveAppointmentAckState(inputValue.message),
      truthTupleHash: nextTruth.truthTupleHash,
      version: nextVersion(inputValue.appointment.version),
    };
    const nextContinuity =
      inputValue.continuityProjection === null || inputValue.message === null
        ? inputValue.continuityProjection
        : updateContinuityProjection(
            inputValue.continuityProjection,
            {
              latestContinuationRef: inputValue.message.practiceContinuityMessageId,
              blockingRefs: deriveBlockingRefs({
                practiceVisibilityState: nextPracticeVisibilityState,
                ackState: inputValue.message.ackState,
                closureState,
                transportAckState: inputValue.message.transportAckState,
                deliveryEvidenceState: inputValue.message.deliveryEvidenceState,
              }),
              validationState: deriveContinuityValidationState(inputValue.message),
            },
            inputValue.generatedAt,
          );
    const nextMirror =
      inputValue.mirrorState === null || inputValue.message === null
        ? inputValue.mirrorState
        : {
            ...inputValue.mirrorState,
            latestContinuityMessageRef: inputValue.message.practiceContinuityMessageId,
            monotoneRevision: inputValue.mirrorState.monotoneRevision + 1,
            truthTupleHash: nextTruth.truthTupleHash,
            version: nextVersion(inputValue.mirrorState.version),
          };
    await offerRepositories.saveTruthProjection(nextTruth, {
      expectedVersion: inputValue.truthProjection.version,
    });
    await commitRepositories.saveAppointmentRecord(nextAppointment, {
      expectedVersion: inputValue.appointment.version,
    });
    if (nextContinuity !== null) {
      await commitRepositories.saveContinuityProjection(nextContinuity, {
        expectedVersion: inputValue.continuityProjection!.version,
      });
    }
    if (nextMirror !== null) {
      await commitRepositories.saveMirrorState(nextMirror, {
        expectedVersion: inputValue.mirrorState!.version,
      });
    }
    return {
      truthProjection: nextTruth,
      appointment: nextAppointment,
      continuityProjection: nextContinuity,
      mirrorState: nextMirror,
    };
  }

  async function supersedeCurrentChain(inputValue: {
    currentMessage: PracticeContinuityMessageSnapshot | null;
    currentAcknowledgement: PracticeAcknowledgementRecordSnapshot | null;
    supersededByMessageRef: string | null;
    recordedAt: string;
  }) {
    if (inputValue.currentMessage !== null) {
      const supersededMessage: PracticeContinuityMessageSnapshot = {
        ...inputValue.currentMessage,
        acknowledgementEvidenceState:
          inputValue.currentMessage.acknowledgementEvidenceState === "ack_received"
            ? "ack_superseded"
            : inputValue.currentMessage.acknowledgementEvidenceState,
        ackState: "recovery_required",
        messageState: "superseded",
        supersededByMessageRef: inputValue.supersededByMessageRef,
        stateConfidenceBand: "low",
        monotoneRevision: inputValue.currentMessage.monotoneRevision + 1,
        version: nextVersion(inputValue.currentMessage.version),
      };
      await repositories.saveMessage(supersededMessage, {
        expectedVersion: inputValue.currentMessage.version,
      });
    }
    if (inputValue.currentAcknowledgement !== null) {
      const supersededAcknowledgement: PracticeAcknowledgementRecordSnapshot = {
        ...inputValue.currentAcknowledgement,
        ackState:
          inputValue.currentAcknowledgement.ackState === "exception_recorded"
            ? "exception_recorded"
            : "superseded",
        acknowledgedAt:
          inputValue.currentAcknowledgement.ackState === "received" ||
          inputValue.currentAcknowledgement.ackState === "exception_recorded"
            ? inputValue.currentAcknowledgement.acknowledgedAt
            : inputValue.recordedAt,
        version: nextVersion(inputValue.currentAcknowledgement.version),
      };
      await repositories.saveAcknowledgementRecord(supersededAcknowledgement, {
        expectedVersion: inputValue.currentAcknowledgement.version,
      });
    }
  }

  return {
    repositories,
    hubCaseService,

    async enqueuePracticeContinuityMessage(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const context = await loadCurrentContext(command.hubCoordinationCaseId);
      invariant(
        context.hubCaseBundle.hubCase.status === "booked_pending_practice_ack" ||
          context.hubCaseBundle.hubCase.status === "booked",
        "PRACTICE_CONTINUITY_CASE_STATE_INVALID",
        "Practice continuity may only be queued once the case is booked or awaiting practice acknowledgement.",
      );
      const authorityDecision = command.authority
        ? await actingScopeService.assertCurrentHubCommandScope(command.authority)
        : null;
      const visibilityEnvelope = await actingScopeService.repositories.getVisibilityEnvelope(
        command.crossOrganisationVisibilityEnvelopeId,
      );
      invariant(
        visibilityEnvelope !== null,
        "VISIBILITY_ENVELOPE_NOT_FOUND",
        "A current CrossOrganisationVisibilityEnvelope is required for practice continuity.",
      );
      const minNecessaryProjection = await actingScopeService.materializeHubCaseAudienceProjection({
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        visibilityEnvelopeId: visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
      });
      const policyEvaluation = await evaluatePracticeVisibilityPolicy({
        hubCase: context.hubCaseBundle.hubCase,
        truthProjection: context.truthProjection,
        minimumNecessaryContractRef: visibilityEnvelope.minimumNecessaryContractRef,
        recordedAt,
        facts: command.policyFacts,
      });
      const prospectivePracticeVisibilityState =
        derivePracticeVisibilityState({
          confirmationTruthState: "confirmed_pending_practice_ack",
          message: {
            ackState: "pending",
            transportAckState: "none",
            deliveryEvidenceState: "pending",
            deliveryState: "unknown",
          },
        });
      const prospectiveClosureState = deriveClosureState({
        confirmationTruthState: "confirmed_pending_practice_ack",
        practiceVisibilityState: prospectivePracticeVisibilityState,
        fallbackLinkState: context.truthProjection.fallbackLinkState,
      });
      const prospectiveTruth = updateTruthProjection(
        context.truthProjection,
        {
          confirmationTruthState: "confirmed_pending_practice_ack",
          patientVisibilityState: "confirmed_visible",
          practiceVisibilityState: prospectivePracticeVisibilityState,
          closureState: prospectiveClosureState,
          practiceAcknowledgementRef: null,
          blockingRefs: deriveBlockingRefs({
            practiceVisibilityState: prospectivePracticeVisibilityState,
            ackState: "pending",
            closureState: prospectiveClosureState,
            transportAckState: "none",
            deliveryEvidenceState: "pending",
          }),
        },
        recordedAt,
      );
      const payload = practicePayloadFromProjection({
        projection: minNecessaryProjection,
        envelope: visibilityEnvelope,
        truthProjection: prospectiveTruth,
        appointment: context.appointment,
        policyEvaluation,
        ackState: "pending",
        recordedAt,
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        idGenerator,
        sourceRefs: [...DEFAULT_SOURCE_REFS, ...(command.sourceRefs ?? [])],
      });
      const dedupeKey = sha256Hex(
        stableStringify({
          hubCoordinationCaseId: command.hubCoordinationCaseId,
          hubAppointmentId: context.appointment.hubAppointmentId,
          ackGeneration: context.hubCaseBundle.hubCase.practiceAckGeneration,
          truthTupleHash: prospectiveTruth.truthTupleHash,
          visibilityEnvelopeVersionRef: visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
          continuityChannel: command.continuityChannel,
          payloadChecksum: payload.payloadChecksum,
        }),
      );
      if (
        context.currentMessage !== null &&
        context.currentMessage.messageState === "current" &&
        context.currentMessage.continuityChannel === command.continuityChannel &&
        context.currentMessage.visibilityEnvelopeVersionRef ===
          visibilityEnvelope.crossOrganisationVisibilityEnvelopeId &&
        context.currentMessage.payloadChecksum === payload.payloadChecksum &&
        context.currentMessage.ackGeneration === context.hubCaseBundle.hubCase.practiceAckGeneration
      ) {
        const replayedAck = (
          await repositories.getAcknowledgementForMessage(
            context.currentMessage.practiceContinuityMessageId,
          )
        )?.toSnapshot() ?? null;
        return {
          message: context.currentMessage,
          payload: (
            await repositories.getPayloadDocument(context.currentMessage.payloadRef)
          )?.toSnapshot() ?? null,
          dispatchAttempt: null,
          receiptCheckpoint: null,
          deliveryEvidence: null,
          acknowledgement: replayedAck,
          deltaRecord: null,
          appointment: context.appointment,
          truthProjection: context.truthProjection,
          continuityProjection: context.continuityProjection,
          mirrorState: context.mirrorState,
          policyEvaluation,
          visibilityEnvelope,
          authorityDecision,
          hubTransition: null,
          replayed: true,
        };
      }
      const replayedMessage = (await repositories.findMessageByDedupeKey(dedupeKey))?.toSnapshot();
      if (replayedMessage && replayedMessage.messageState === "current") {
        const replayedAck = (
          await repositories.getAcknowledgementForMessage(replayedMessage.practiceContinuityMessageId)
        )?.toSnapshot() ?? null;
        const projectionResult = await applyProjectionMutation({
          hubCase: context.hubCaseBundle.hubCase,
          appointment: context.appointment,
          truthProjection: context.truthProjection,
          continuityProjection: context.continuityProjection,
          mirrorState: context.mirrorState,
          message: replayedMessage,
          acknowledgement: replayedAck,
          generatedAt: recordedAt,
        });
        return {
          message: replayedMessage,
          payload: (await repositories.getPayloadDocument(replayedMessage.payloadRef))?.toSnapshot() ?? null,
          dispatchAttempt: null,
          receiptCheckpoint: null,
          deliveryEvidence: null,
          acknowledgement: replayedAck,
          deltaRecord: null,
          appointment: projectionResult.appointment,
          truthProjection: projectionResult.truthProjection,
          continuityProjection: projectionResult.continuityProjection,
          mirrorState: projectionResult.mirrorState,
          policyEvaluation,
          visibilityEnvelope,
          authorityDecision,
          hubTransition: null,
          replayed: true,
        };
      }

      const messageId = nextId(idGenerator, "practiceContinuityMessage");
      await supersedeCurrentChain({
        currentMessage: context.currentMessage,
        currentAcknowledgement: context.currentAcknowledgement,
        supersededByMessageRef: messageId,
        recordedAt,
      });
      const message: PracticeContinuityMessageSnapshot = {
        practiceContinuityMessageId: messageId,
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        appointmentRecordRef: context.appointment.hubAppointmentId,
        hubAppointmentId: context.appointment.hubAppointmentId,
        originPracticeOds: context.hubCaseBundle.networkBookingRequest.originPracticeOds,
        messageClass: context.currentMessage === null ? "booked" : "refresh",
        payloadRef: payload.practiceContinuityPayloadDocumentId,
        payloadChecksum: payload.payloadChecksum,
        dedupeKey,
        continuityChannel: command.continuityChannel,
        dispatchWorkflowId: requireRef(command.dispatchWorkflowId, "dispatchWorkflowId"),
        commandActionRecordRef: requireRef(command.commandActionRecordRef, "commandActionRecordRef"),
        idempotencyRecordRef:
          optionalRef(command.idempotencyRecordRef) ?? dedupeKey,
        adapterDispatchAttemptRef: null,
        latestReceiptCheckpointRef: null,
        visibilityEnvelopeVersionRef: visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
        deliveryModelVersionRef: PRACTICE_CONTINUITY_DELIVERY_MODEL_VERSION,
        practiceVisibilityPolicyRef: policyEvaluation.evaluation.practiceVisibilityPolicyRef,
        serviceObligationPolicyRef: policyEvaluation.evaluation.serviceObligationPolicyRef,
        policyEvaluationRef: policyEvaluation.evaluation.policyEvaluationId,
        policyTupleHash: policyEvaluation.evaluation.policyTupleHash,
        transportState: "queued",
        transportAckState: "none",
        transportAcceptedAt: null,
        deliveryState: "unknown",
        deliveryEvidenceState: "pending",
        deliveryEvidenceRef: null,
        deliveryRiskState: "none",
        deliveryRiskPosture: "on_track",
        deliveryAttemptCount: 0,
        firstDeliveredAt: null,
        ackGeneration: context.hubCaseBundle.hubCase.practiceAckGeneration,
        ackState: "pending",
        ackDueAt:
          optionalRef(command.ackDueAt) ??
          context.hubCaseBundle.hubCase.practiceAckDueAt ??
          addMinutes(recordedAt, 120),
        acknowledgementEvidenceState: "ack_missing",
        acknowledgementEvidenceRef: null,
        truthProjectionRef: context.truthProjection.hubOfferToConfirmationTruthProjectionId,
        truthTupleHash: prospectiveTruth.truthTupleHash,
        transitionEnvelopeRef: null,
        releaseRecoveryDispositionRef: null,
        stateConfidenceBand: "low",
        causalToken: nextId(idGenerator, "practiceContinuityCausalToken"),
        monotoneRevision: 1,
        messageState: "current",
        supersededByMessageRef: null,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(command.sourceRefs ?? [])]),
        version: 1,
      };
      const acknowledgement: PracticeAcknowledgementRecordSnapshot = {
        acknowledgementId: nextId(idGenerator, "practiceAcknowledgement"),
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        practiceContinuityMessageRef: message.practiceContinuityMessageId,
        hubAppointmentId: context.appointment.hubAppointmentId,
        ackGeneration: message.ackGeneration,
        truthTupleHash: message.truthTupleHash,
        causalToken: message.causalToken,
        ackState: "pending",
        ackEvidenceKind: "message_reply",
        acknowledgedAt: null,
        acknowledgedByRef: null,
        visibilityEnvelopeVersionRef: message.visibilityEnvelopeVersionRef,
        policyEvaluationRef: message.policyEvaluationRef,
        sourceRefs: message.sourceRefs,
        version: 1,
      };
      const projectionResult = await applyProjectionMutation({
        hubCase: context.hubCaseBundle.hubCase,
        appointment: context.appointment,
        truthProjection: context.truthProjection,
        continuityProjection: context.continuityProjection,
        mirrorState: context.mirrorState,
        message,
        acknowledgement,
        generatedAt: recordedAt,
      });
      await repositories.savePayloadDocument(payload);
      await repositories.saveMessage(message);
      await repositories.saveAcknowledgementRecord(acknowledgement);

      const deltaRecord: PracticeVisibilityDeltaRecordSnapshot = {
        practiceVisibilityDeltaRecordId: nextId(idGenerator, "practiceVisibilityDelta"),
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        hubAppointmentId: context.appointment.hubAppointmentId,
        priorProjectionRef:
          `${context.truthProjection.hubOfferToConfirmationTruthProjectionId}@v${context.truthProjection.version}`,
        nextProjectionRef:
          `${projectionResult.truthProjection.hubOfferToConfirmationTruthProjectionId}@v${projectionResult.truthProjection.version}`,
        priorAckGeneration: context.truthProjection.practiceAckGeneration,
        nextAckGeneration: projectionResult.truthProjection.practiceAckGeneration,
        priorVisibilityEnvelopeVersionRef: context.currentMessage?.visibilityEnvelopeVersionRef ?? null,
        nextVisibilityEnvelopeVersionRef: message.visibilityEnvelopeVersionRef,
        truthTupleHash: projectionResult.truthProjection.truthTupleHash,
        deltaReason:
          context.currentMessage === null ? "truth_changed" : "appointment_version_changed",
        changeClass: context.currentMessage === null ? "booked" : "refreshed",
        continuityMessageRef: message.practiceContinuityMessageId,
        monotoneValidation: "valid",
        stateConfidenceBand: message.stateConfidenceBand,
        causalToken: message.causalToken,
        monotoneRevision: 1,
        recordedAt,
        sourceRefs: message.sourceRefs,
        version: 1,
      };
      await repositories.appendDeltaRecord(deltaRecord);
      return {
        message,
        payload,
        dispatchAttempt: null,
        receiptCheckpoint: null,
        deliveryEvidence: null,
        acknowledgement,
        deltaRecord,
        appointment: projectionResult.appointment,
        truthProjection: projectionResult.truthProjection,
        continuityProjection: projectionResult.continuityProjection,
        mirrorState: projectionResult.mirrorState,
        policyEvaluation,
        visibilityEnvelope,
        authorityDecision,
        hubTransition: null,
        replayed: false,
      };
    },

    async dispatchPracticeContinuityMessage(command) {
      const attemptedAt = ensureIsoTimestamp(command.attemptedAt, "attemptedAt");
      const message = await requireSnapshot(
        repositories.getMessage(command.practiceContinuityMessageId),
        "PRACTICE_CONTINUITY_MESSAGE_NOT_FOUND",
        "PracticeContinuityMessage could not be found.",
      );
      invariant(
        message.messageState === "current",
        "PRACTICE_CONTINUITY_MESSAGE_STALE",
        "Only the current practice continuity message may be dispatched.",
      );
      const payload = await requireSnapshot(
        repositories.getPayloadDocument(message.payloadRef),
        "PRACTICE_CONTINUITY_PAYLOAD_NOT_FOUND",
        "Practice continuity payload could not be found.",
      );
      const adapter = adapters.get(message.continuityChannel);
      invariant(
        adapter !== undefined,
        "PRACTICE_CONTINUITY_ADAPTER_MISSING",
        `No dispatch adapter is configured for ${message.continuityChannel}.`,
      );
      const attempts = (
        await repositories.listDispatchAttemptsForMessage(message.practiceContinuityMessageId)
      ).map((row) => row.toSnapshot());
      const attemptNumber = attempts.length + 1;
      const adapterResult = await adapter.dispatch({
        message,
        payload,
        attemptedAt,
      });
      const dispatchAttempt: PracticeContinuityDispatchAttemptSnapshot = {
        practiceContinuityDispatchAttemptId: nextId(idGenerator, "practiceContinuityDispatchAttempt"),
        practiceContinuityMessageRef: message.practiceContinuityMessageId,
        hubCoordinationCaseId: message.hubCoordinationCaseId,
        continuityChannel: message.continuityChannel,
        dispatchState:
          adapterResult.outcome === "timed_out"
            ? "timed_out"
            : adapterResult.outcome,
        attemptNumber,
        dedupeKey: message.dedupeKey,
        adapterName: adapterResult.adapterName,
        adapterCorrelationKey: optionalRef(adapterResult.adapterCorrelationKey),
        externalDispatchRef: optionalRef(adapterResult.externalDispatchRef),
        attemptedAt,
        sourceRefs: uniqueSortedRefs([...message.sourceRefs, ...(command.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.saveDispatchAttempt(dispatchAttempt);
      let checkpointResult: PracticeContinuityMutationResult | null = null;
      if (adapterResult.outcome === "accepted") {
        checkpointResult = await this.recordReceiptCheckpoint({
          practiceContinuityMessageId: message.practiceContinuityMessageId,
          recordedAt: attemptedAt,
          checkpointKind: "transport_accepted",
          dispatchAttemptId: dispatchAttempt.practiceContinuityDispatchAttemptId,
          sourceRefs: command.sourceRefs,
        });
      } else if (adapterResult.outcome === "rejected") {
        checkpointResult = await this.recordReceiptCheckpoint({
          practiceContinuityMessageId: message.practiceContinuityMessageId,
          recordedAt: attemptedAt,
          checkpointKind: "transport_rejected",
          dispatchAttemptId: dispatchAttempt.practiceContinuityDispatchAttemptId,
          evidenceRef: adapterResult.evidenceRef,
          sourceRefs: command.sourceRefs,
        });
      } else {
        checkpointResult = await this.recordReceiptCheckpoint({
          practiceContinuityMessageId: message.practiceContinuityMessageId,
          recordedAt: attemptedAt,
          checkpointKind: "transport_timed_out",
          dispatchAttemptId: dispatchAttempt.practiceContinuityDispatchAttemptId,
          evidenceRef: adapterResult.evidenceRef,
          sourceRefs: command.sourceRefs,
        });
      }
      if (adapterResult.immediateCheckpointKind) {
        checkpointResult = await this.recordReceiptCheckpoint({
          practiceContinuityMessageId: message.practiceContinuityMessageId,
          recordedAt: attemptedAt,
          checkpointKind: adapterResult.immediateCheckpointKind,
          dispatchAttemptId: dispatchAttempt.practiceContinuityDispatchAttemptId,
          evidenceRef: adapterResult.evidenceRef,
          sourceRefs: command.sourceRefs,
        });
      }
      invariant(
        checkpointResult !== null,
        "PRACTICE_CONTINUITY_DISPATCH_CHECKPOINT_MISSING",
        "Dispatch must produce a transport checkpoint result.",
      );
      return {
        ...checkpointResult,
        payload,
        dispatchAttempt,
      };
    },

    async recordReceiptCheckpoint(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const message = await requireSnapshot(
        repositories.getMessage(command.practiceContinuityMessageId),
        "PRACTICE_CONTINUITY_MESSAGE_NOT_FOUND",
        "PracticeContinuityMessage could not be found.",
      );
      const context = await loadCurrentContext(message.hubCoordinationCaseId);
      invariant(
        message.messageState === "current",
        "PRACTICE_CONTINUITY_MESSAGE_STALE",
        "Only the current practice continuity message may accept new receipt checkpoints.",
      );
      const receiptCheckpoint: PracticeContinuityReceiptCheckpointSnapshot = {
        practiceContinuityReceiptCheckpointId: nextId(idGenerator, "practiceContinuityReceiptCheckpoint"),
        practiceContinuityMessageRef: message.practiceContinuityMessageId,
        hubCoordinationCaseId: message.hubCoordinationCaseId,
        dispatchAttemptRef: optionalRef(command.dispatchAttemptId),
        checkpointKind: command.checkpointKind,
        evidenceRef: optionalRef(command.evidenceRef),
        recordedAt,
        sourceRefs: uniqueSortedRefs([...message.sourceRefs, ...(command.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.appendReceiptCheckpoint(receiptCheckpoint);

      let nextMessage: PracticeContinuityMessageSnapshot = {
        ...message,
        latestReceiptCheckpointRef: receiptCheckpoint.practiceContinuityReceiptCheckpointId,
        version: nextVersion(message.version),
        monotoneRevision: message.monotoneRevision + 1,
      };
      switch (command.checkpointKind) {
        case "transport_accepted":
          nextMessage = {
            ...nextMessage,
            transportState: "accepted",
            transportAckState: "accepted",
            transportAcceptedAt: recordedAt,
            adapterDispatchAttemptRef: optionalRef(command.dispatchAttemptId),
          };
          break;
        case "transport_rejected":
          nextMessage = {
            ...nextMessage,
            transportState: "rejected",
            transportAckState: "rejected",
          };
          break;
        case "transport_timed_out":
          nextMessage = {
            ...nextMessage,
            transportAckState: "timed_out",
            deliveryRiskState: "non_delivery_risk",
            deliveryRiskPosture: "at_risk",
          };
          break;
        default:
          nextMessage = {
            ...nextMessage,
            deliveryState: deriveDeliveryState(command.checkpointKind, nextMessage.deliveryState),
            deliveryEvidenceState: deriveDeliveryEvidenceState(
              command.checkpointKind,
              nextMessage.deliveryEvidenceState,
            ),
            deliveryRiskState: deriveDeliveryRiskState(
              command.checkpointKind,
              nextMessage.deliveryRiskState,
            ),
            deliveryRiskPosture: deriveDeliveryRiskPosture(
              command.checkpointKind,
              nextMessage.deliveryRiskPosture,
            ),
            firstDeliveredAt:
              command.checkpointKind === "delivery_available" ||
              command.checkpointKind === "delivery_downloaded"
                ? nextMessage.firstDeliveredAt ?? recordedAt
                : nextMessage.firstDeliveredAt,
          };
      }
      const createsDeliveryEvidence = [
        "delivery_available",
        "delivery_downloaded",
        "delivery_expired",
        "delivery_failed",
        "delivery_disputed",
      ].includes(command.checkpointKind);
      const deliveryEvidence = createsDeliveryEvidence
        ? {
            practiceContinuityDeliveryEvidenceId: nextId(idGenerator, "practiceContinuityDeliveryEvidence"),
            practiceContinuityMessageRef: nextMessage.practiceContinuityMessageId,
            hubCoordinationCaseId: nextMessage.hubCoordinationCaseId,
            receiptCheckpointRef: receiptCheckpoint.practiceContinuityReceiptCheckpointId,
            evidenceKind:
              command.checkpointKind === "delivery_disputed"
                ? "dispute_record"
                : command.checkpointKind === "delivery_downloaded" || command.checkpointKind === "delivery_available"
                  ? "mesh_receipt"
                  : "api_receipt",
            deliveryState: nextMessage.deliveryEvidenceState,
            deliveryRiskPosture: nextMessage.deliveryRiskPosture,
            evidenceRef: optionalRef(command.evidenceRef),
            observedAt: recordedAt,
            sourceRefs: receiptCheckpoint.sourceRefs,
            version: 1,
          } satisfies PracticeContinuityDeliveryEvidenceSnapshot
        : null;
      if (deliveryEvidence !== null) {
        nextMessage = {
          ...nextMessage,
          deliveryEvidenceRef: deliveryEvidence.practiceContinuityDeliveryEvidenceId,
        };
      }
      nextMessage = {
        ...nextMessage,
        ackState: deriveHighLevelAckState({
          ackDueAt: nextMessage.ackDueAt,
          acknowledgementEvidenceState: nextMessage.acknowledgementEvidenceState,
          transportAckState: nextMessage.transportAckState,
          deliveryEvidenceState: nextMessage.deliveryEvidenceState,
          asOf: recordedAt,
        }),
      };
      nextMessage = {
        ...nextMessage,
        stateConfidenceBand: deriveMessageConfidenceBand(nextMessage),
      };
      await repositories.saveMessage(nextMessage, { expectedVersion: message.version });
      if (deliveryEvidence !== null) {
        await repositories.saveDeliveryEvidence(deliveryEvidence);
      }
      const acknowledgement = (
        await repositories.getAcknowledgementForMessage(nextMessage.practiceContinuityMessageId)
      )?.toSnapshot() ?? null;
      const projectionResult = await applyProjectionMutation({
        hubCase: context.hubCaseBundle.hubCase,
        appointment: context.appointment,
        truthProjection: context.truthProjection,
        continuityProjection: context.continuityProjection,
        mirrorState: context.mirrorState,
        message: nextMessage,
        acknowledgement,
        generatedAt: recordedAt,
      });
      const deltaRecord: PracticeVisibilityDeltaRecordSnapshot = {
        practiceVisibilityDeltaRecordId: nextId(idGenerator, "practiceVisibilityDelta"),
        hubCoordinationCaseId: nextMessage.hubCoordinationCaseId,
        hubAppointmentId: context.appointment.hubAppointmentId,
        priorProjectionRef:
          `${context.truthProjection.hubOfferToConfirmationTruthProjectionId}@v${context.truthProjection.version}`,
        nextProjectionRef:
          `${projectionResult.truthProjection.hubOfferToConfirmationTruthProjectionId}@v${projectionResult.truthProjection.version}`,
        priorAckGeneration: context.truthProjection.practiceAckGeneration,
        nextAckGeneration: projectionResult.truthProjection.practiceAckGeneration,
        priorVisibilityEnvelopeVersionRef: nextMessage.visibilityEnvelopeVersionRef,
        nextVisibilityEnvelopeVersionRef: nextMessage.visibilityEnvelopeVersionRef,
        truthTupleHash: projectionResult.truthProjection.truthTupleHash,
        deltaReason: "truth_changed",
        changeClass: command.checkpointKind,
        continuityMessageRef: nextMessage.practiceContinuityMessageId,
        monotoneValidation: "valid",
        stateConfidenceBand: nextMessage.stateConfidenceBand,
        causalToken: nextMessage.causalToken,
        monotoneRevision: nextMessage.monotoneRevision,
        recordedAt,
        sourceRefs: nextMessage.sourceRefs,
        version: 1,
      };
      await repositories.appendDeltaRecord(deltaRecord);
      return {
        message: nextMessage,
        payload: (await repositories.getPayloadDocument(nextMessage.payloadRef))?.toSnapshot() ?? null,
        dispatchAttempt:
          command.dispatchAttemptId === undefined
            ? null
            : (
                await repositories.getDispatchAttempt(requireRef(command.dispatchAttemptId, "dispatchAttemptId"))
              )?.toSnapshot() ?? null,
        receiptCheckpoint,
        deliveryEvidence,
        acknowledgement,
        deltaRecord,
        appointment: projectionResult.appointment,
        truthProjection: projectionResult.truthProjection,
        continuityProjection: projectionResult.continuityProjection,
        mirrorState: projectionResult.mirrorState,
        policyEvaluation: null,
        visibilityEnvelope: null,
        authorityDecision: null,
        hubTransition: null,
        replayed: false,
      };
    },

    async capturePracticeAcknowledgement(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const context = await loadCurrentContext(command.hubCoordinationCaseId);
      const authorityDecision = command.authority
        ? await actingScopeService.assertCurrentHubCommandScope(command.authority)
        : null;
      const message = await requireSnapshot(
        repositories.getMessage(command.practiceContinuityMessageId),
        "PRACTICE_CONTINUITY_MESSAGE_NOT_FOUND",
        "PracticeContinuityMessage could not be found.",
      );
      invariant(
        message.messageState === "current",
        "PRACTICE_CONTINUITY_MESSAGE_STALE",
        "Only the current practice continuity message may be acknowledged.",
      );
      invariant(
        command.presentedAckGeneration === context.hubCaseBundle.hubCase.practiceAckGeneration,
        "PRACTICE_ACK_GENERATION_STALE",
        "Only the live acknowledgement generation may clear current practice debt.",
      );
      invariant(
        command.presentedTruthTupleHash === context.truthProjection.truthTupleHash,
        "PRACTICE_ACK_TRUTH_TUPLE_STALE",
        "Acknowledgement evidence must match the live truth tuple.",
      );
      invariant(
        command.presentedVisibilityEnvelopeVersionRef === message.visibilityEnvelopeVersionRef,
        "PRACTICE_ACK_ENVELOPE_STALE",
        "Acknowledgement evidence must match the live visibility envelope version.",
      );
      const ackVisibilityEnvelope = await actingScopeService.repositories.getVisibilityEnvelope(
        message.visibilityEnvelopeVersionRef,
      );
      invariant(
        ackVisibilityEnvelope !== null,
        "PRACTICE_ACK_ENVELOPE_NOT_FOUND",
        "The live visibility envelope is required before acknowledgement can be accepted.",
      );
      const policyEvaluation = await evaluatePracticeVisibilityPolicy({
        hubCase: context.hubCaseBundle.hubCase,
        truthProjection: context.truthProjection,
        minimumNecessaryContractRef: ackVisibilityEnvelope.minimumNecessaryContractRef,
        recordedAt,
        facts: command.policyFacts,
      });
      invariant(
        policyEvaluation.evaluation.policyTupleHash === message.policyTupleHash,
        "PRACTICE_ACK_POLICY_TUPLE_STALE",
        "Acknowledgement evidence must match the live policy tuple.",
      );
      if (command.ackEvidenceKind === "manual_attestation") {
        invariant(
          message.deliveryEvidenceState === "delivered",
          "PRACTICE_ACK_DELIVERY_EVIDENCE_REQUIRED",
          "Manual acknowledgement requires delivery evidence on the current chain.",
        );
      }
      if (command.ackEvidenceKind === "policy_exception") {
        invariant(
          policyEvaluation.compiledPolicy.practiceVisibilityPolicyRef ===
            message.practiceVisibilityPolicyRef,
          "PRACTICE_ACK_EXCEPTION_POLICY_DRIFT",
          "Policy exceptions may only be granted under the live practice visibility policy.",
        );
      }
      const currentAcknowledgement = (
        await repositories.getAcknowledgementForMessage(message.practiceContinuityMessageId)
      )?.toSnapshot();
      invariant(
        currentAcknowledgement !== undefined && currentAcknowledgement !== null,
        "PRACTICE_ACK_RECORD_NOT_FOUND",
        "A pending PracticeAcknowledgementRecord is required for the current message.",
      );
      const nextAcknowledgement: PracticeAcknowledgementRecordSnapshot = {
        ...currentAcknowledgement,
        ackState:
          command.ackEvidenceKind === "policy_exception" ? "exception_recorded" : "received",
        ackEvidenceKind: command.ackEvidenceKind,
        acknowledgedAt: recordedAt,
        acknowledgedByRef: optionalRef(command.acknowledgedByRef),
        truthTupleHash: context.truthProjection.truthTupleHash,
        visibilityEnvelopeVersionRef: message.visibilityEnvelopeVersionRef,
        policyEvaluationRef: policyEvaluation.evaluation.policyEvaluationId,
        version: nextVersion(currentAcknowledgement.version),
      };
      const nextMessage: PracticeContinuityMessageSnapshot = {
        ...message,
        acknowledgementEvidenceState:
          command.ackEvidenceKind === "policy_exception"
            ? "ack_exception_recorded"
            : "ack_received",
        acknowledgementEvidenceRef: nextAcknowledgement.acknowledgementId,
        ackState:
          command.ackEvidenceKind === "policy_exception" ? "not_required" : "acknowledged",
        stateConfidenceBand: "high",
        monotoneRevision: message.monotoneRevision + 1,
        version: nextVersion(message.version),
      };
      await repositories.saveAcknowledgementRecord(nextAcknowledgement, {
        expectedVersion: currentAcknowledgement.version,
      });
      await repositories.saveMessage(nextMessage, { expectedVersion: message.version });
      const projectionResult = await applyProjectionMutation({
        hubCase: context.hubCaseBundle.hubCase,
        appointment: context.appointment,
        truthProjection: context.truthProjection,
        continuityProjection: context.continuityProjection,
        mirrorState: context.mirrorState,
        message: nextMessage,
        acknowledgement: nextAcknowledgement,
        generatedAt: recordedAt,
      });
      const hubTransition =
        context.hubCaseBundle.hubCase.status === "booked_pending_practice_ack"
          ? await hubCaseService.markBooked(
              buildTransitionCommand(context.hubCaseBundle.hubCase, {
                actorRef: command.actorRef,
                routeIntentBindingRef: command.routeIntentBindingRef,
                commandActionRecordRef: command.commandActionRecordRef,
                commandSettlementRecordRef: command.commandSettlementRecordRef,
                recordedAt,
                reasonCode:
                  command.ackEvidenceKind === "policy_exception"
                    ? "practice_ack_exception_recorded"
                    : "practice_acknowledged",
                carriedOpenCaseBlockerRefs: projectionResult.truthProjection.blockingRefs,
              }),
            )
          : null;
      const receiptCheckpoint: PracticeContinuityReceiptCheckpointSnapshot = {
        practiceContinuityReceiptCheckpointId: nextId(idGenerator, "practiceContinuityReceiptCheckpoint"),
        practiceContinuityMessageRef: nextMessage.practiceContinuityMessageId,
        hubCoordinationCaseId: nextMessage.hubCoordinationCaseId,
        dispatchAttemptRef: nextMessage.adapterDispatchAttemptRef,
        checkpointKind:
          command.ackEvidenceKind === "policy_exception"
            ? "policy_exception_recorded"
            : "acknowledgement_captured",
        evidenceRef: nextAcknowledgement.acknowledgementId,
        recordedAt,
        sourceRefs: uniqueSortedRefs([...nextMessage.sourceRefs, ...(command.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.appendReceiptCheckpoint(receiptCheckpoint);
      const deltaRecord: PracticeVisibilityDeltaRecordSnapshot = {
        practiceVisibilityDeltaRecordId: nextId(idGenerator, "practiceVisibilityDelta"),
        hubCoordinationCaseId: nextMessage.hubCoordinationCaseId,
        hubAppointmentId: context.appointment.hubAppointmentId,
        priorProjectionRef:
          `${context.truthProjection.hubOfferToConfirmationTruthProjectionId}@v${context.truthProjection.version}`,
        nextProjectionRef:
          `${projectionResult.truthProjection.hubOfferToConfirmationTruthProjectionId}@v${projectionResult.truthProjection.version}`,
        priorAckGeneration: context.truthProjection.practiceAckGeneration,
        nextAckGeneration: projectionResult.truthProjection.practiceAckGeneration,
        priorVisibilityEnvelopeVersionRef: nextMessage.visibilityEnvelopeVersionRef,
        nextVisibilityEnvelopeVersionRef: nextMessage.visibilityEnvelopeVersionRef,
        truthTupleHash: projectionResult.truthProjection.truthTupleHash,
        deltaReason: "truth_changed",
        changeClass:
          command.ackEvidenceKind === "policy_exception" ? "exception_recorded" : "acknowledged",
        continuityMessageRef: nextMessage.practiceContinuityMessageId,
        monotoneValidation: "valid",
        stateConfidenceBand: "high",
        causalToken: nextMessage.causalToken,
        monotoneRevision: nextMessage.monotoneRevision,
        recordedAt,
        sourceRefs: nextMessage.sourceRefs,
        version: 1,
      };
      await repositories.appendDeltaRecord(deltaRecord);
      return {
        message: nextMessage,
        payload: (await repositories.getPayloadDocument(nextMessage.payloadRef))?.toSnapshot() ?? null,
        dispatchAttempt: null,
        receiptCheckpoint,
        deliveryEvidence: null,
        acknowledgement: nextAcknowledgement,
        deltaRecord,
        appointment: projectionResult.appointment,
        truthProjection: projectionResult.truthProjection,
        continuityProjection: projectionResult.continuityProjection,
        mirrorState: projectionResult.mirrorState,
        policyEvaluation,
        visibilityEnvelope: null,
        authorityDecision,
        hubTransition,
        replayed: false,
      };
    },

    async reopenPracticeAcknowledgementDebt(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const authorityDecision = command.authority
        ? await actingScopeService.assertCurrentHubCommandScope(command.authority)
        : null;
      const context = await loadCurrentContext(command.hubCoordinationCaseId);
      invariant(
        context.hubCaseBundle.hubCase.status === "booked_pending_practice_ack" ||
          context.hubCaseBundle.hubCase.status === "booked",
        "PRACTICE_ACK_REOPEN_INVALID_STATE",
        "Practice acknowledgement debt may only be reopened once a booking exists.",
      );
      const nextAckGeneration = command.incrementGeneration === false
        ? context.hubCaseBundle.hubCase.practiceAckGeneration
        : context.hubCaseBundle.hubCase.practiceAckGeneration + 1;
      await supersedeCurrentChain({
        currentMessage: context.currentMessage,
        currentAcknowledgement: context.currentAcknowledgement,
        supersededByMessageRef: null,
        recordedAt,
      });
      const nextTruth = updateTruthProjection(
        context.truthProjection,
        {
          confirmationTruthState: "confirmed_pending_practice_ack",
          practiceVisibilityState: "recovery_required",
          practiceAcknowledgementRef: null,
          closureState: deriveClosureState({
            confirmationTruthState: "confirmed_pending_practice_ack",
            practiceVisibilityState: "recovery_required",
            fallbackLinkState: context.truthProjection.fallbackLinkState,
          }),
          blockingRefs: uniqueSortedRefs([
            ...context.truthProjection.blockingRefs,
            "practice_visibility_recovery_required",
          ]),
        },
        recordedAt,
      );
      const nextAppointment: HubAppointmentRecordSnapshot = {
        ...context.appointment,
        appointmentState: "confirmed_pending_practice_ack",
        practiceAcknowledgementState: "ack_pending",
        truthTupleHash: nextTruth.truthTupleHash,
        version: nextVersion(context.appointment.version),
      };
      await offerRepositories.saveTruthProjection(nextTruth, {
        expectedVersion: context.truthProjection.version,
      });
      await commitRepositories.saveAppointmentRecord(nextAppointment, {
        expectedVersion: context.appointment.version,
      });
      const hubTransition = await hubCaseService.markBookedPendingPracticeAcknowledgement(
        buildTransitionCommand(context.hubCaseBundle.hubCase, {
          actorRef: command.actorRef,
          routeIntentBindingRef: command.routeIntentBindingRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          recordedAt,
          reasonCode: requireRef(command.changeClass, "changeClass"),
          networkAppointmentRef: nextAppointment.hubAppointmentId,
          offerToConfirmationTruthRef: nextTruth.hubOfferToConfirmationTruthProjectionId,
          practiceAckGeneration: nextAckGeneration,
          practiceAckDueAt:
            optionalRef(command.reopenedDueAt) ??
            context.hubCaseBundle.hubCase.practiceAckDueAt ??
            addMinutes(recordedAt, 120),
          carriedOpenCaseBlockerRefs: nextTruth.blockingRefs,
        }),
      );
      const deltaRecord: PracticeVisibilityDeltaRecordSnapshot = {
        practiceVisibilityDeltaRecordId: nextId(idGenerator, "practiceVisibilityDelta"),
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        hubAppointmentId: nextAppointment.hubAppointmentId,
        priorProjectionRef:
          `${context.truthProjection.hubOfferToConfirmationTruthProjectionId}@v${context.truthProjection.version}`,
        nextProjectionRef:
          `${nextTruth.hubOfferToConfirmationTruthProjectionId}@v${nextTruth.version}`,
        priorAckGeneration: context.hubCaseBundle.hubCase.practiceAckGeneration,
        nextAckGeneration,
        priorVisibilityEnvelopeVersionRef: context.currentMessage?.visibilityEnvelopeVersionRef ?? null,
        nextVisibilityEnvelopeVersionRef: context.currentMessage?.visibilityEnvelopeVersionRef ?? "pending_reissue",
        truthTupleHash: nextTruth.truthTupleHash,
        deltaReason: command.deltaReason,
        changeClass: requireRef(command.changeClass, "changeClass"),
        continuityMessageRef: context.currentMessage?.practiceContinuityMessageId ?? null,
        monotoneValidation: "valid",
        stateConfidenceBand: "low",
        causalToken: nextId(idGenerator, "practiceContinuityCausalToken"),
        monotoneRevision: 1,
        recordedAt,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(command.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.appendDeltaRecord(deltaRecord);
      return {
        message: null,
        payload: null,
        dispatchAttempt: null,
        receiptCheckpoint: null,
        deliveryEvidence: null,
        acknowledgement: null,
        deltaRecord,
        appointment: nextAppointment,
        truthProjection: nextTruth,
        continuityProjection: context.continuityProjection,
        mirrorState: context.mirrorState,
        policyEvaluation: null,
        visibilityEnvelope: null,
        authorityDecision,
        hubTransition,
        replayed: false,
      };
    },

    async queryCurrentPracticeContinuityState(hubCoordinationCaseId) {
      const currentMessage = (
        await repositories.getCurrentMessageForCase(hubCoordinationCaseId)
      )?.toSnapshot() ?? null;
      const currentAcknowledgement = (
        await repositories.getCurrentAcknowledgementForCase(hubCoordinationCaseId)
      )?.toSnapshot() ?? null;
      const latestDispatchAttempt =
        currentMessage === null
          ? null
          : (
              await repositories.listDispatchAttemptsForMessage(
                currentMessage.practiceContinuityMessageId,
              )
            )
              .map((row) => row.toSnapshot())
              .at(-1) ?? null;
      const latestReceiptCheckpoint =
        currentMessage === null
          ? null
          : (
              await repositories.listReceiptCheckpointsForMessage(
                currentMessage.practiceContinuityMessageId,
              )
            )
              .map((row) => row.toSnapshot())
              .at(-1) ?? null;
      const latestDeliveryEvidence =
        currentMessage === null
          ? null
          : (
              await repositories.listDeliveryEvidenceForMessage(
                currentMessage.practiceContinuityMessageId,
              )
            )
              .map((row) => row.toSnapshot())
              .at(-1) ?? null;
      const latestDeltaRecord = (
        await repositories.listDeltaRecordsForCase(hubCoordinationCaseId)
      )
        .map((row) => row.toSnapshot())
        .at(-1) ?? null;
      const appointments = (
        await commitRepositories.listAppointmentsForCase(hubCoordinationCaseId)
      ).map((row) => row.toSnapshot());
      const appointment = appointments.at(-1) ?? null;
      const truthProjection = (
        await offerRepositories.getTruthProjectionForCase(hubCoordinationCaseId)
      )?.toSnapshot() ?? null;
      return {
        currentMessage,
        currentAcknowledgement,
        latestDispatchAttempt,
        latestReceiptCheckpoint,
        latestDeliveryEvidence,
        latestDeltaRecord,
        appointment,
        truthProjection,
      };
    },
  };
}
