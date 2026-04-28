import { createHash } from "node:crypto";
import {
  QueueAssignmentSuggestionSnapshotDocument,
  QueueRankEntryDocument,
  QueueRankPlanDocument,
  QueueRankSnapshotDocument,
  createQueueRankingAuthorityService,
  createQueueRankingStore,
  queueDefaultPlan,
  type QueueAssignmentSuggestionSnapshot,
  type QueueOverloadState,
  type QueueRankTaskFact,
  type QueueRankingDependencies,
  type QueueRankingFactCut,
  type QueueReviewerFact,
  validateQueueConsumerSnapshotRefs,
} from "@vecells/api-contracts";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  buildReservationVersionRef,
  type CapacityCommitMode,
  type CapacityReservationSnapshot,
  type CapacityReservationState,
  type ReservationConfirmationDependencies,
  CapacityReservationDocument,
  ReservationTruthProjectionDocument,
  createReservationConfirmationAuthorityService,
  createReservationConfirmationStore,
} from "./reservation-confirmation-backbone";

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

function optionalIsoTimestamp(value: string | null | undefined, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return ensureIsoTimestamp(value, field);
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function ensureNonNegativeNumber(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative number.`,
  );
  return value;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function derivePostConfirmationTiming(input: {
  observedAt: string;
  revalidatedAt?: string | null;
  currentReservation: CapacityReservationSnapshot;
}): {
  supplierObservedAt: string;
  revalidatedAt: string | null;
} {
  const explicitRevalidatedAt =
    input.revalidatedAt === undefined ? undefined : optionalRef(input.revalidatedAt);
  if (
    input.currentReservation.confirmedAt !== null &&
    compareIso(input.observedAt, input.currentReservation.confirmedAt) > 0
  ) {
    return {
      supplierObservedAt: input.currentReservation.supplierObservedAt,
      revalidatedAt: explicitRevalidatedAt ?? input.observedAt,
    };
  }
  const carriedRevalidatedAt =
    input.currentReservation.revalidatedAt !== null &&
    compareIso(input.currentReservation.revalidatedAt, input.observedAt) >= 0
      ? input.currentReservation.revalidatedAt
      : input.observedAt;
  return {
    supplierObservedAt: input.observedAt,
    revalidatedAt: explicitRevalidatedAt ?? carriedRevalidatedAt,
  };
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function ensureHexHash(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    /^[a-f0-9]{64}$/i.test(normalized),
    `INVALID_${field.toUpperCase()}_HASH`,
    `${field} must be a 64-character hexadecimal digest.`,
  );
  return normalized.toLowerCase();
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

function nextReservationQueueControlId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function buildFenceToken(input: {
  canonicalReservationKey: string;
  holderRef: string;
  sourceDomain: string;
  sourceObjectRef: string;
  reservationState: CapacityReservationState;
  activatedAt: string;
}): string {
  return sha256Hex(
    stableStringify({
      canonicalReservationKey: requireRef(input.canonicalReservationKey, "canonicalReservationKey"),
      holderRef: requireRef(input.holderRef, "holderRef"),
      sourceDomain: requireRef(input.sourceDomain, "sourceDomain"),
      sourceObjectRef: requireRef(input.sourceObjectRef, "sourceObjectRef"),
      reservationState: input.reservationState,
      activatedAt: ensureIsoTimestamp(input.activatedAt, "activatedAt"),
    }),
  );
}

function deriveCommitMode(
  state: CapacityReservationState,
  preferred?: CapacityCommitMode,
): CapacityCommitMode {
  if (state === "held") {
    return "exclusive_hold";
  }
  if (state === "soft_selected" || state === "pending_confirmation") {
    return preferred === "degraded_manual_pending"
      ? "degraded_manual_pending"
      : "truthful_nonexclusive";
  }
  if (state === "confirmed" || state === "disputed") {
    return preferred ?? "degraded_manual_pending";
  }
  return preferred ?? "truthful_nonexclusive";
}

function activeConflictClass(
  state: CapacityReservationState,
): "exclusive" | "truthful_nonexclusive" {
  return ["held", "pending_confirmation", "confirmed"].includes(state)
    ? "exclusive"
    : "truthful_nonexclusive";
}

function isReservationConflict(
  existingState: CapacityReservationState,
  requestedState: CapacityReservationState,
): boolean {
  return (
    activeConflictClass(existingState) === "exclusive" ||
    activeConflictClass(requestedState) === "exclusive"
  );
}

export type ReservationFenceRecordState =
  | "active"
  | "released"
  | "expired"
  | "disputed"
  | "conflict_blocked";

export interface ReservationFenceRecordSnapshot {
  reservationFenceRecordId: string;
  canonicalReservationKey: string;
  capacityIdentityRef: string;
  holderRef: string;
  sourceDomain: string;
  sourceObjectRef: string;
  selectedAnchorRef: string;
  projectionFreshnessEnvelopeRef: string;
  fenceToken: string;
  reservationState: CapacityReservationState;
  commitMode: CapacityCommitMode;
  state: ReservationFenceRecordState;
  truthBasisHash: string | null;
  sourceReservationRef: string | null;
  sourceProjectionRef: string | null;
  activatedAt: string;
  expiresAt: string | null;
  releasedAt: string | null;
  expiredAt: string | null;
  disputedAt: string | null;
  blockingFenceRef: string | null;
  reasonRefs: readonly string[];
  version: number;
}

function validateReservationFenceRecordSnapshot(
  snapshot: ReservationFenceRecordSnapshot,
): ReservationFenceRecordSnapshot {
  const activatedAt = ensureIsoTimestamp(snapshot.activatedAt, "activatedAt");
  const expiresAt = optionalIsoTimestamp(snapshot.expiresAt, "expiresAt");
  const releasedAt = optionalIsoTimestamp(snapshot.releasedAt, "releasedAt");
  const expiredAt = optionalIsoTimestamp(snapshot.expiredAt, "expiredAt");
  const disputedAt = optionalIsoTimestamp(snapshot.disputedAt, "disputedAt");
  const truthBasisHash =
    snapshot.truthBasisHash === null || snapshot.truthBasisHash === undefined
      ? null
      : ensureHexHash(snapshot.truthBasisHash, "truthBasisHash");
  const sourceReservationRef = optionalRef(snapshot.sourceReservationRef);
  const sourceProjectionRef = optionalRef(snapshot.sourceProjectionRef);
  const blockingFenceRef = optionalRef(snapshot.blockingFenceRef);

  if (snapshot.state === "active") {
    invariant(
      blockingFenceRef === null &&
        releasedAt === null &&
        expiredAt === null &&
        disputedAt === null,
      "ACTIVE_FENCE_TERMINAL_FIELDS_FORBIDDEN",
      "Active ReservationFenceRecord rows may not carry terminal timestamps or blockers.",
    );
    invariant(
      sourceReservationRef !== null && sourceProjectionRef !== null && truthBasisHash !== null,
      "ACTIVE_FENCE_REQUIRES_AUTHORITY_REFS",
      "Active ReservationFenceRecord rows must bind reservation and truth projection refs.",
    );
  }

  if (snapshot.state === "released") {
    invariant(
      releasedAt !== null,
      "RELEASED_FENCE_REQUIRES_RELEASED_AT",
      "Released ReservationFenceRecord rows require releasedAt.",
    );
  }

  if (snapshot.state === "expired") {
    invariant(
      expiredAt !== null,
      "EXPIRED_FENCE_REQUIRES_EXPIRED_AT",
      "Expired ReservationFenceRecord rows require expiredAt.",
    );
  }

  if (snapshot.state === "disputed") {
    invariant(
      disputedAt !== null,
      "DISPUTED_FENCE_REQUIRES_DISPUTED_AT",
      "Disputed ReservationFenceRecord rows require disputedAt.",
    );
  }

  if (snapshot.state === "conflict_blocked") {
    invariant(
      blockingFenceRef !== null,
      "BLOCKED_FENCE_REQUIRES_BLOCKING_REF",
      "Conflict-blocked ReservationFenceRecord rows require blockingFenceRef.",
    );
  }

  if (expiresAt !== null) {
    invariant(
      compareIso(expiresAt, activatedAt) >= 0,
      "FENCE_EXPIRY_PRECEDES_ACTIVATION",
      "ReservationFenceRecord.expiresAt may not precede activatedAt.",
    );
  }

  return {
    reservationFenceRecordId: requireRef(
      snapshot.reservationFenceRecordId,
      "reservationFenceRecordId",
    ),
    canonicalReservationKey: requireRef(
      snapshot.canonicalReservationKey,
      "canonicalReservationKey",
    ),
    capacityIdentityRef: requireRef(snapshot.capacityIdentityRef, "capacityIdentityRef"),
    holderRef: requireRef(snapshot.holderRef, "holderRef"),
    sourceDomain: requireRef(snapshot.sourceDomain, "sourceDomain"),
    sourceObjectRef: requireRef(snapshot.sourceObjectRef, "sourceObjectRef"),
    selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
    projectionFreshnessEnvelopeRef: requireRef(
      snapshot.projectionFreshnessEnvelopeRef,
      "projectionFreshnessEnvelopeRef",
    ),
    fenceToken: ensureHexHash(snapshot.fenceToken, "fenceToken"),
    reservationState: snapshot.reservationState,
    commitMode: snapshot.commitMode,
    state: snapshot.state,
    truthBasisHash,
    sourceReservationRef,
    sourceProjectionRef,
    activatedAt,
    expiresAt,
    releasedAt,
    expiredAt,
    disputedAt,
    blockingFenceRef,
    reasonRefs: uniqueSortedRefs(snapshot.reasonRefs),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export class ReservationFenceRecordDocument {
  constructor(private readonly snapshot: ReservationFenceRecordSnapshot) {}

  static create(snapshot: ReservationFenceRecordSnapshot): ReservationFenceRecordDocument {
    return new ReservationFenceRecordDocument(validateReservationFenceRecordSnapshot(snapshot));
  }

  get reservationFenceRecordId(): string {
    return this.snapshot.reservationFenceRecordId;
  }

  get canonicalReservationKey(): string {
    return this.snapshot.canonicalReservationKey;
  }

  get fenceToken(): string {
    return this.snapshot.fenceToken;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ReservationFenceRecordSnapshot {
    return {
      ...this.snapshot,
      reasonRefs: [...this.snapshot.reasonRefs],
    };
  }
}

export type QueueFairnessMergeState = "steady" | "merged" | "suppressed_overload";

export interface QueueSnapshotCommitRecordSnapshot {
  queueSnapshotCommitRecordId: string;
  rankSnapshotRef: string;
  queueRef: string;
  queueFamilyRef: string;
  queueRankPlanRef: string;
  sourceFactCutRef: string;
  rowOrderHash: string;
  overloadState: QueueOverloadState;
  fairnessMergeState: QueueFairnessMergeState;
  fairnessMergeClasses: readonly string[];
  eligibleTaskRefs: readonly string[];
  heldTaskRefs: readonly string[];
  assignmentSuggestionRef: string | null;
  committedAt: string;
  version: number;
}

function validateQueueSnapshotCommitRecordSnapshot(
  snapshot: QueueSnapshotCommitRecordSnapshot,
): QueueSnapshotCommitRecordSnapshot {
  return {
    queueSnapshotCommitRecordId: requireRef(
      snapshot.queueSnapshotCommitRecordId,
      "queueSnapshotCommitRecordId",
    ),
    rankSnapshotRef: requireRef(snapshot.rankSnapshotRef, "rankSnapshotRef"),
    queueRef: requireRef(snapshot.queueRef, "queueRef"),
    queueFamilyRef: requireRef(snapshot.queueFamilyRef, "queueFamilyRef"),
    queueRankPlanRef: requireRef(snapshot.queueRankPlanRef, "queueRankPlanRef"),
    sourceFactCutRef: requireRef(snapshot.sourceFactCutRef, "sourceFactCutRef"),
    rowOrderHash: requireRef(snapshot.rowOrderHash, "rowOrderHash"),
    overloadState: snapshot.overloadState,
    fairnessMergeState: snapshot.fairnessMergeState,
    fairnessMergeClasses: uniqueSortedRefs(snapshot.fairnessMergeClasses),
    eligibleTaskRefs: uniqueSortedRefs(snapshot.eligibleTaskRefs),
    heldTaskRefs: uniqueSortedRefs(snapshot.heldTaskRefs),
    assignmentSuggestionRef: optionalRef(snapshot.assignmentSuggestionRef),
    committedAt: ensureIsoTimestamp(snapshot.committedAt, "committedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export class QueueSnapshotCommitRecordDocument {
  constructor(private readonly snapshot: QueueSnapshotCommitRecordSnapshot) {}

  static create(snapshot: QueueSnapshotCommitRecordSnapshot): QueueSnapshotCommitRecordDocument {
    return new QueueSnapshotCommitRecordDocument(
      validateQueueSnapshotCommitRecordSnapshot(snapshot),
    );
  }

  get queueSnapshotCommitRecordId(): string {
    return this.snapshot.queueSnapshotCommitRecordId;
  }

  get rankSnapshotRef(): string {
    return this.snapshot.rankSnapshotRef;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): QueueSnapshotCommitRecordSnapshot {
    return {
      ...this.snapshot,
      fairnessMergeClasses: [...this.snapshot.fairnessMergeClasses],
      eligibleTaskRefs: [...this.snapshot.eligibleTaskRefs],
      heldTaskRefs: [...this.snapshot.heldTaskRefs],
    };
  }
}

export interface QueuePressureEscalationRecordSnapshot {
  queuePressureEscalationRecordId: string;
  rankSnapshotRef: string;
  queueRef: string;
  overloadState: QueueOverloadState;
  pressureRatio: number;
  criticalArrivalRatePerHour: number;
  empiricalServiceRatePerHour: number;
  activeReviewerCount: number;
  reasonRefs: readonly string[];
  escalatedAt: string;
  version: number;
}

function validateQueuePressureEscalationRecordSnapshot(
  snapshot: QueuePressureEscalationRecordSnapshot,
): QueuePressureEscalationRecordSnapshot {
  return {
    queuePressureEscalationRecordId: requireRef(
      snapshot.queuePressureEscalationRecordId,
      "queuePressureEscalationRecordId",
    ),
    rankSnapshotRef: requireRef(snapshot.rankSnapshotRef, "rankSnapshotRef"),
    queueRef: requireRef(snapshot.queueRef, "queueRef"),
    overloadState: snapshot.overloadState,
    pressureRatio: ensureNonNegativeNumber(snapshot.pressureRatio, "pressureRatio"),
    criticalArrivalRatePerHour: ensureNonNegativeNumber(
      snapshot.criticalArrivalRatePerHour,
      "criticalArrivalRatePerHour",
    ),
    empiricalServiceRatePerHour: ensureNonNegativeNumber(
      snapshot.empiricalServiceRatePerHour,
      "empiricalServiceRatePerHour",
    ),
    activeReviewerCount: ensureNonNegativeNumber(
      snapshot.activeReviewerCount,
      "activeReviewerCount",
    ),
    reasonRefs: uniqueSortedRefs(snapshot.reasonRefs),
    escalatedAt: ensureIsoTimestamp(snapshot.escalatedAt, "escalatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export class QueuePressureEscalationRecordDocument {
  constructor(private readonly snapshot: QueuePressureEscalationRecordSnapshot) {}

  static create(
    snapshot: QueuePressureEscalationRecordSnapshot,
  ): QueuePressureEscalationRecordDocument {
    return new QueuePressureEscalationRecordDocument(
      validateQueuePressureEscalationRecordSnapshot(snapshot),
    );
  }

  get queuePressureEscalationRecordId(): string {
    return this.snapshot.queuePressureEscalationRecordId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): QueuePressureEscalationRecordSnapshot {
    return {
      ...this.snapshot,
      reasonRefs: [...this.snapshot.reasonRefs],
    };
  }
}

export type NextTaskAdvisoryState = "ready" | "blocked_stale_owner" | "blocked_mixed_snapshot";

export interface NextTaskAdvisorySnapshot {
  nextTaskAdvisorySnapshotId: string;
  rankSnapshotRef: string;
  reviewerScopeRef: string;
  advisoryState: NextTaskAdvisoryState;
  sourceSuggestionSnapshotRef: string | null;
  nextTaskRefs: readonly string[];
  governedAutoClaimRefs: readonly string[];
  blockedReasonRefs: readonly string[];
  staleOwnerRecoveryRefs: readonly string[];
  generatedAt: string;
  version: number;
}

function validateNextTaskAdvisorySnapshot(
  snapshot: NextTaskAdvisorySnapshot,
): NextTaskAdvisorySnapshot {
  const sourceSuggestionSnapshotRef = optionalRef(snapshot.sourceSuggestionSnapshotRef);
  if (snapshot.advisoryState === "ready") {
    invariant(
      sourceSuggestionSnapshotRef !== null,
      "READY_ADVISORY_REQUIRES_SUGGESTION",
      "Ready next-task advisories must bind a suggestion snapshot.",
    );
    invariant(
      snapshot.nextTaskRefs.length > 0,
      "READY_ADVISORY_REQUIRES_NEXT_TASKS",
      "Ready next-task advisories must publish at least one next task.",
    );
  }
  if (snapshot.advisoryState !== "ready") {
    invariant(
      snapshot.blockedReasonRefs.length > 0,
      "BLOCKED_ADVISORY_REQUIRES_REASONS",
      "Blocked next-task advisories must publish blockedReasonRefs.",
    );
  }
  return {
    nextTaskAdvisorySnapshotId: requireRef(
      snapshot.nextTaskAdvisorySnapshotId,
      "nextTaskAdvisorySnapshotId",
    ),
    rankSnapshotRef: requireRef(snapshot.rankSnapshotRef, "rankSnapshotRef"),
    reviewerScopeRef: requireRef(snapshot.reviewerScopeRef, "reviewerScopeRef"),
    advisoryState: snapshot.advisoryState,
    sourceSuggestionSnapshotRef,
    nextTaskRefs: uniqueSortedRefs(snapshot.nextTaskRefs),
    governedAutoClaimRefs: uniqueSortedRefs(snapshot.governedAutoClaimRefs),
    blockedReasonRefs: uniqueSortedRefs(snapshot.blockedReasonRefs),
    staleOwnerRecoveryRefs: uniqueSortedRefs(snapshot.staleOwnerRecoveryRefs),
    generatedAt: ensureIsoTimestamp(snapshot.generatedAt, "generatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export class NextTaskAdvisorySnapshotDocument {
  constructor(private readonly snapshot: NextTaskAdvisorySnapshot) {}

  static create(snapshot: NextTaskAdvisorySnapshot): NextTaskAdvisorySnapshotDocument {
    return new NextTaskAdvisorySnapshotDocument(validateNextTaskAdvisorySnapshot(snapshot));
  }

  get nextTaskAdvisorySnapshotId(): string {
    return this.snapshot.nextTaskAdvisorySnapshotId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): NextTaskAdvisorySnapshot {
    return {
      ...this.snapshot,
      nextTaskRefs: [...this.snapshot.nextTaskRefs],
      governedAutoClaimRefs: [...this.snapshot.governedAutoClaimRefs],
      blockedReasonRefs: [...this.snapshot.blockedReasonRefs],
      staleOwnerRecoveryRefs: [...this.snapshot.staleOwnerRecoveryRefs],
    };
  }
}

export interface ReservationQueueControlDependencies
  extends ReservationConfirmationDependencies,
    QueueRankingDependencies {
  getReservationFenceRecord(
    reservationFenceRecordId: string,
  ): Promise<ReservationFenceRecordDocument | null>;
  listReservationFenceRecords(): Promise<readonly ReservationFenceRecordDocument[]>;
  listReservationFenceRecordsByCanonicalKey(
    canonicalReservationKey: string,
  ): Promise<readonly ReservationFenceRecordDocument[]>;
  saveReservationFenceRecord(
    record: ReservationFenceRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getQueueSnapshotCommitRecord(
    queueSnapshotCommitRecordId: string,
  ): Promise<QueueSnapshotCommitRecordDocument | null>;
  getQueueSnapshotCommitRecordByRankSnapshotRef(
    rankSnapshotRef: string,
  ): Promise<QueueSnapshotCommitRecordDocument | null>;
  listQueueSnapshotCommitRecords(): Promise<readonly QueueSnapshotCommitRecordDocument[]>;
  saveQueueSnapshotCommitRecord(
    record: QueueSnapshotCommitRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getQueuePressureEscalationRecord(
    queuePressureEscalationRecordId: string,
  ): Promise<QueuePressureEscalationRecordDocument | null>;
  getQueuePressureEscalationRecordByRankSnapshotRef(
    rankSnapshotRef: string,
  ): Promise<QueuePressureEscalationRecordDocument | null>;
  listQueuePressureEscalationRecords(): Promise<readonly QueuePressureEscalationRecordDocument[]>;
  saveQueuePressureEscalationRecord(
    record: QueuePressureEscalationRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getNextTaskAdvisorySnapshot(
    nextTaskAdvisorySnapshotId: string,
  ): Promise<NextTaskAdvisorySnapshotDocument | null>;
  getLatestNextTaskAdvisoryByRankSnapshotRef(
    rankSnapshotRef: string,
  ): Promise<NextTaskAdvisorySnapshotDocument | null>;
  listNextTaskAdvisorySnapshots(): Promise<readonly NextTaskAdvisorySnapshotDocument[]>;
  saveNextTaskAdvisorySnapshot(
    snapshot: NextTaskAdvisorySnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

class InMemoryReservationQueueControlStore implements ReservationQueueControlDependencies {
  private readonly fenceRecords = new Map<string, ReservationFenceRecordSnapshot>();
  private readonly queueSnapshotCommitRecords = new Map<
    string,
    QueueSnapshotCommitRecordSnapshot
  >();
  private readonly queueSnapshotCommitByRankSnapshot = new Map<string, string>();
  private readonly queuePressureEscalationRecords = new Map<
    string,
    QueuePressureEscalationRecordSnapshot
  >();
  private readonly queuePressureEscalationByRankSnapshot = new Map<string, string>();
  private readonly nextTaskAdvisories = new Map<string, NextTaskAdvisorySnapshot>();
  private readonly latestNextTaskAdvisoryByRankSnapshot = new Map<string, string>();

  constructor(
    private readonly reservationStore: ReservationConfirmationDependencies,
    private readonly queueStore: QueueRankingDependencies,
  ) {}

  async getCapacityReservation(reservationId: string): Promise<CapacityReservationDocument | null> {
    return this.reservationStore.getCapacityReservation(reservationId);
  }

  async listCapacityReservations(): Promise<readonly CapacityReservationDocument[]> {
    return this.reservationStore.listCapacityReservations();
  }

  async listCapacityReservationsByCanonicalKey(
    canonicalReservationKey: string,
  ): Promise<readonly CapacityReservationDocument[]> {
    return this.reservationStore.listCapacityReservationsByCanonicalKey(canonicalReservationKey);
  }

  async saveCapacityReservation(
    reservation: CapacityReservationDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    return this.reservationStore.saveCapacityReservation(reservation, options);
  }

  async getReservationTruthProjection(
    reservationTruthProjectionId: string,
  ): Promise<ReservationTruthProjectionDocument | null> {
    return this.reservationStore.getReservationTruthProjection(reservationTruthProjectionId);
  }

  async getLatestReservationTruthProjectionForReservation(
    reservationId: string,
  ): Promise<ReservationTruthProjectionDocument | null> {
    return this.reservationStore.getLatestReservationTruthProjectionForReservation(reservationId);
  }

  async saveReservationTruthProjection(
    projection: ReservationTruthProjectionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    return this.reservationStore.saveReservationTruthProjection(projection, options);
  }

  async listReservationTruthProjections(): Promise<readonly ReservationTruthProjectionDocument[]> {
    return this.reservationStore.listReservationTruthProjections();
  }

  async getExternalConfirmationGate(gateId: string) {
    return this.reservationStore.getExternalConfirmationGate(gateId);
  }

  async listExternalConfirmationGates() {
    return this.reservationStore.listExternalConfirmationGates();
  }

  async listExternalConfirmationGatesForDomainObject(domain: string, domainObjectRef: string) {
    return this.reservationStore.listExternalConfirmationGatesForDomainObject(
      domain,
      domainObjectRef,
    );
  }

  async saveExternalConfirmationGate(gate: never, options?: CompareAndSetWriteOptions) {
    return this.reservationStore.saveExternalConfirmationGate(gate, options);
  }

  async getQueueRankPlan(planId: string) {
    return this.queueStore.getQueueRankPlan(planId);
  }

  async getLatestQueueRankPlanByFamily(queueFamilyRef: string) {
    return this.queueStore.getLatestQueueRankPlanByFamily(queueFamilyRef);
  }

  async saveQueueRankPlan(plan: QueueRankPlanDocument, options?: CompareAndSetWriteOptions) {
    return this.queueStore.saveQueueRankPlan(plan, options);
  }

  async getQueueRankSnapshot(rankSnapshotId: string) {
    return this.queueStore.getQueueRankSnapshot(rankSnapshotId);
  }

  async getLatestQueueRankSnapshotByQueue(queueRef: string) {
    return this.queueStore.getLatestQueueRankSnapshotByQueue(queueRef);
  }

  async saveQueueRankSnapshot(
    snapshot: QueueRankSnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    return this.queueStore.saveQueueRankSnapshot(snapshot, options);
  }

  async listQueueRankEntries(rankSnapshotRef: string) {
    return this.queueStore.listQueueRankEntries(rankSnapshotRef);
  }

  async saveQueueRankEntry(entry: QueueRankEntryDocument, options?: CompareAndSetWriteOptions) {
    return this.queueStore.saveQueueRankEntry(entry, options);
  }

  async getQueueAssignmentSuggestionSnapshot(suggestionSnapshotId: string) {
    return this.queueStore.getQueueAssignmentSuggestionSnapshot(suggestionSnapshotId);
  }

  async getLatestQueueAssignmentSuggestionByRankSnapshotRef(rankSnapshotRef: string) {
    return this.queueStore.getLatestQueueAssignmentSuggestionByRankSnapshotRef(rankSnapshotRef);
  }

  async saveQueueAssignmentSuggestionSnapshot(
    snapshot: QueueAssignmentSuggestionSnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    return this.queueStore.saveQueueAssignmentSuggestionSnapshot(snapshot, options);
  }

  async getReservationFenceRecord(
    reservationFenceRecordId: string,
  ): Promise<ReservationFenceRecordDocument | null> {
    const snapshot = this.fenceRecords.get(reservationFenceRecordId);
    return snapshot ? ReservationFenceRecordDocument.create(snapshot) : null;
  }

  async listReservationFenceRecords(): Promise<readonly ReservationFenceRecordDocument[]> {
    return [...this.fenceRecords.values()]
      .map((snapshot) => ReservationFenceRecordDocument.create(snapshot))
      .sort((left, right) =>
        left.toSnapshot().activatedAt.localeCompare(right.toSnapshot().activatedAt),
      );
  }

  async listReservationFenceRecordsByCanonicalKey(
    canonicalReservationKey: string,
  ): Promise<readonly ReservationFenceRecordDocument[]> {
    return (await this.listReservationFenceRecords()).filter(
      (record) => record.toSnapshot().canonicalReservationKey === canonicalReservationKey,
    );
  }

  async saveReservationFenceRecord(
    record: ReservationFenceRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.fenceRecords, record.reservationFenceRecordId, record.toSnapshot(), options);
  }

  async getQueueSnapshotCommitRecord(
    queueSnapshotCommitRecordId: string,
  ): Promise<QueueSnapshotCommitRecordDocument | null> {
    const snapshot = this.queueSnapshotCommitRecords.get(queueSnapshotCommitRecordId);
    return snapshot ? QueueSnapshotCommitRecordDocument.create(snapshot) : null;
  }

  async getQueueSnapshotCommitRecordByRankSnapshotRef(
    rankSnapshotRef: string,
  ): Promise<QueueSnapshotCommitRecordDocument | null> {
    const recordId = this.queueSnapshotCommitByRankSnapshot.get(rankSnapshotRef);
    return recordId ? this.getQueueSnapshotCommitRecord(recordId) : null;
  }

  async listQueueSnapshotCommitRecords(): Promise<readonly QueueSnapshotCommitRecordDocument[]> {
    return [...this.queueSnapshotCommitRecords.values()]
      .map((snapshot) => QueueSnapshotCommitRecordDocument.create(snapshot))
      .sort((left, right) =>
        left.toSnapshot().committedAt.localeCompare(right.toSnapshot().committedAt),
      );
  }

  async saveQueueSnapshotCommitRecord(
    record: QueueSnapshotCommitRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.queueSnapshotCommitRecords,
      record.queueSnapshotCommitRecordId,
      record.toSnapshot(),
      options,
    );
    this.queueSnapshotCommitByRankSnapshot.set(
      record.toSnapshot().rankSnapshotRef,
      record.queueSnapshotCommitRecordId,
    );
  }

  async getQueuePressureEscalationRecord(
    queuePressureEscalationRecordId: string,
  ): Promise<QueuePressureEscalationRecordDocument | null> {
    const snapshot = this.queuePressureEscalationRecords.get(queuePressureEscalationRecordId);
    return snapshot ? QueuePressureEscalationRecordDocument.create(snapshot) : null;
  }

  async getQueuePressureEscalationRecordByRankSnapshotRef(
    rankSnapshotRef: string,
  ): Promise<QueuePressureEscalationRecordDocument | null> {
    const recordId = this.queuePressureEscalationByRankSnapshot.get(rankSnapshotRef);
    return recordId ? this.getQueuePressureEscalationRecord(recordId) : null;
  }

  async listQueuePressureEscalationRecords(): Promise<
    readonly QueuePressureEscalationRecordDocument[]
  > {
    return [...this.queuePressureEscalationRecords.values()]
      .map((snapshot) => QueuePressureEscalationRecordDocument.create(snapshot))
      .sort((left, right) =>
        left.toSnapshot().escalatedAt.localeCompare(right.toSnapshot().escalatedAt),
      );
  }

  async saveQueuePressureEscalationRecord(
    record: QueuePressureEscalationRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.queuePressureEscalationRecords,
      record.queuePressureEscalationRecordId,
      record.toSnapshot(),
      options,
    );
    this.queuePressureEscalationByRankSnapshot.set(
      record.toSnapshot().rankSnapshotRef,
      record.queuePressureEscalationRecordId,
    );
  }

  async getNextTaskAdvisorySnapshot(
    nextTaskAdvisorySnapshotId: string,
  ): Promise<NextTaskAdvisorySnapshotDocument | null> {
    const snapshot = this.nextTaskAdvisories.get(nextTaskAdvisorySnapshotId);
    return snapshot ? NextTaskAdvisorySnapshotDocument.create(snapshot) : null;
  }

  async getLatestNextTaskAdvisoryByRankSnapshotRef(
    rankSnapshotRef: string,
  ): Promise<NextTaskAdvisorySnapshotDocument | null> {
    const advisoryId = this.latestNextTaskAdvisoryByRankSnapshot.get(rankSnapshotRef);
    return advisoryId ? this.getNextTaskAdvisorySnapshot(advisoryId) : null;
  }

  async listNextTaskAdvisorySnapshots(): Promise<readonly NextTaskAdvisorySnapshotDocument[]> {
    return [...this.nextTaskAdvisories.values()]
      .map((snapshot) => NextTaskAdvisorySnapshotDocument.create(snapshot))
      .sort((left, right) =>
        left.toSnapshot().generatedAt.localeCompare(right.toSnapshot().generatedAt),
      );
  }

  async saveNextTaskAdvisorySnapshot(
    snapshot: NextTaskAdvisorySnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.nextTaskAdvisories,
      snapshot.nextTaskAdvisorySnapshotId,
      snapshot.toSnapshot(),
      options,
    );
    this.latestNextTaskAdvisoryByRankSnapshot.set(
      snapshot.toSnapshot().rankSnapshotRef,
      snapshot.nextTaskAdvisorySnapshotId,
    );
  }
}

export function createReservationQueueControlStore(): ReservationQueueControlDependencies {
  return new InMemoryReservationQueueControlStore(
    createReservationConfirmationStore(),
    createQueueRankingStore(),
  );
}

export interface ClaimReservationInput {
  capacityIdentityRef: string;
  canonicalReservationKey: string;
  sourceDomain: string;
  holderRef: string;
  sourceObjectRef: string;
  selectedAnchorRef: string;
  projectionFreshnessEnvelopeRef: string;
  requestedState: Extract<
    CapacityReservationState,
    "soft_selected" | "held" | "pending_confirmation" | "confirmed"
  >;
  supplierObservedAt: string;
  generatedAt?: string;
  expiresAt?: string | null;
  revalidatedAt?: string | null;
  confirmedAt?: string | null;
  commitMode?: CapacityCommitMode;
  capacityIdentitySupportsExclusivity?: boolean;
}

export interface CompleteReservationInput {
  canonicalReservationKey: string;
  fenceToken: string;
  observedAt: string;
  terminalReasonCode: string;
  generatedAt?: string;
  expectedReservationVersionRef?: string | null;
}

export interface TransitionReservationInput {
  canonicalReservationKey: string;
  fenceToken: string;
  requestedState: Extract<
    CapacityReservationState,
    "soft_selected" | "held" | "pending_confirmation" | "confirmed" | "disputed"
  >;
  observedAt: string;
  generatedAt?: string;
  expectedReservationVersionRef?: string | null;
  expiresAt?: string | null;
  revalidatedAt?: string | null;
  confirmedAt?: string | null;
  terminalReasonCode?: string | null;
  projectionFreshnessEnvelopeRef?: string | null;
  sourceObjectRef?: string | null;
  selectedAnchorRef?: string | null;
  commitMode?: CapacityCommitMode;
  capacityIdentitySupportsExclusivity?: boolean;
}

export interface ReservationAuthorityClaimResult {
  fence: ReservationFenceRecordDocument;
  reservation: CapacityReservationDocument | null;
  projection: ReservationTruthProjectionDocument | null;
  replayed: boolean;
  conflictBlocked: boolean;
  blockingFence: ReservationFenceRecordDocument | null;
}

export interface ReservationAuthorityTransitionResult {
  fence: ReservationFenceRecordDocument;
  reservation: CapacityReservationDocument;
  projection: ReservationTruthProjectionDocument;
}

export class ReservationAuthority {
  private readonly serializers = new Map<string, Promise<void>>();

  constructor(
    private readonly repositories: ReservationQueueControlDependencies,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  private async serializeOnReservationKey<T>(
    canonicalReservationKey: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const key = requireRef(canonicalReservationKey, "canonicalReservationKey");
    const prior = this.serializers.get(key) ?? Promise.resolve();
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chain = prior.then(() => pending);
    this.serializers.set(key, chain);
    await prior;
    try {
      return await operation();
    } finally {
      release?.();
      if (this.serializers.get(key) === chain) {
        this.serializers.delete(key);
      }
    }
  }

  private async getLatestActiveFence(
    canonicalReservationKey: string,
  ): Promise<ReservationFenceRecordDocument | null> {
    const active = (
      await this.repositories.listReservationFenceRecordsByCanonicalKey(canonicalReservationKey)
    )
      .filter((record) => record.toSnapshot().state === "active")
      .sort((left, right) =>
        right.toSnapshot().activatedAt.localeCompare(left.toSnapshot().activatedAt),
      );
    return active[0] ?? null;
  }

  private assertExpectedReservationVersion(
    reservation: CapacityReservationDocument,
    expectedReservationVersionRef: string | null | undefined,
  ): void {
    const expected = optionalRef(expectedReservationVersionRef);
    if (expected === null) {
      return;
    }
    invariant(
      expected ===
        buildReservationVersionRef({
          reservationId: reservation.reservationId,
          reservationVersion: reservation.toSnapshot().reservationVersion,
        }),
      "STALE_RESERVATION_VERSION_REF",
      "Reservation transitions must supply the latest reservationVersionRef.",
    );
  }

  private async requireActiveFenceBundle(input: {
    canonicalReservationKey: string;
    fenceToken: string;
    expectedReservationVersionRef?: string | null;
  }): Promise<{
    fence: ReservationFenceRecordDocument;
    reservation: CapacityReservationDocument;
    projection: ReservationTruthProjectionDocument | null;
  }> {
    const activeFence = await this.getLatestActiveFence(input.canonicalReservationKey);
    invariant(
      activeFence !== null,
      "ACTIVE_RESERVATION_FENCE_MISSING",
      "A live ReservationFenceRecord is required before reservation transition.",
    );
    const fenceSnapshot = activeFence.toSnapshot();
    invariant(
      fenceSnapshot.fenceToken === ensureHexHash(input.fenceToken, "fenceToken"),
      "STALE_RESERVATION_FENCE_TOKEN",
      "Reservation transitions must supply the latest active fencing token.",
    );
    invariant(
      fenceSnapshot.sourceReservationRef !== null,
      "ACTIVE_FENCE_RESERVATION_REF_MISSING",
      "A live ReservationFenceRecord must bind a capacity reservation.",
    );
    const reservation = await this.repositories.getCapacityReservation(
      fenceSnapshot.sourceReservationRef,
    );
    invariant(
      reservation !== null,
      "ACTIVE_RESERVATION_ROW_MISSING",
      "The live ReservationFenceRecord references a missing capacity reservation.",
    );
    this.assertExpectedReservationVersion(reservation, input.expectedReservationVersionRef);
    const projection =
      fenceSnapshot.sourceProjectionRef === null
        ? null
        : await this.repositories.getReservationTruthProjection(fenceSnapshot.sourceProjectionRef);
    return {
      fence: activeFence,
      reservation,
      projection,
    };
  }

  private async findExactReplay(
    input: ClaimReservationInput,
    activeFence: ReservationFenceRecordDocument | null,
  ): Promise<ReservationAuthorityClaimResult | null> {
    if (!activeFence) {
      return null;
    }
    const fenceSnapshot = activeFence.toSnapshot();
    if (
      fenceSnapshot.holderRef !== input.holderRef ||
      fenceSnapshot.sourceDomain !== input.sourceDomain ||
      fenceSnapshot.sourceObjectRef !== input.sourceObjectRef ||
      fenceSnapshot.selectedAnchorRef !== input.selectedAnchorRef ||
      fenceSnapshot.projectionFreshnessEnvelopeRef !== input.projectionFreshnessEnvelopeRef ||
      fenceSnapshot.reservationState !== input.requestedState ||
      fenceSnapshot.expiresAt !== (input.expiresAt ?? null)
    ) {
      return null;
    }
    const reservation =
      fenceSnapshot.sourceReservationRef === null
        ? null
        : await this.repositories.getCapacityReservation(fenceSnapshot.sourceReservationRef);
    const projection =
      fenceSnapshot.sourceProjectionRef === null
        ? null
        : await this.repositories.getReservationTruthProjection(fenceSnapshot.sourceProjectionRef);
    invariant(
      reservation !== null && projection !== null,
      "ACTIVE_FENCE_MISSING_AUTHORITY_ROWS",
      "An active ReservationFenceRecord must reference reservation and projection rows.",
    );
    return {
      fence: activeFence,
      reservation,
      projection,
      replayed: true,
      conflictBlocked: false,
      blockingFence: null,
    };
  }

  private async supersedeSoftFence(
    activeFence: ReservationFenceRecordDocument,
    releasedAt: string,
  ): Promise<void> {
    const fenceSnapshot = activeFence.toSnapshot();
    const superseded = ReservationFenceRecordDocument.create({
      ...fenceSnapshot,
      state: "released",
      releasedAt,
      disputedAt: null,
      reasonRefs: uniqueSortedRefs([...fenceSnapshot.reasonRefs, "superseded_by_new_claim"]),
      version: fenceSnapshot.version + 1,
    });
    await this.repositories.saveReservationFenceRecord(superseded, {
      expectedVersion: fenceSnapshot.version,
    });
  }

  async claimReservation(input: ClaimReservationInput): Promise<ReservationAuthorityClaimResult> {
    return this.serializeOnReservationKey(input.canonicalReservationKey, async () => {
      const activeFence = await this.getLatestActiveFence(input.canonicalReservationKey);
      const replay = await this.findExactReplay(input, activeFence);
      if (replay) {
        return replay;
      }

      if (
        activeFence &&
        isReservationConflict(activeFence.toSnapshot().reservationState, input.requestedState)
      ) {
        const blockedFence = ReservationFenceRecordDocument.create({
          reservationFenceRecordId: nextReservationQueueControlId(
            this.idGenerator,
            "reservationFenceRecord",
          ),
          canonicalReservationKey: input.canonicalReservationKey,
          capacityIdentityRef: input.capacityIdentityRef,
          holderRef: input.holderRef,
          sourceDomain: input.sourceDomain,
          sourceObjectRef: input.sourceObjectRef,
          selectedAnchorRef: input.selectedAnchorRef,
          projectionFreshnessEnvelopeRef: input.projectionFreshnessEnvelopeRef,
          fenceToken: buildFenceToken({
            canonicalReservationKey: input.canonicalReservationKey,
            holderRef: input.holderRef,
            sourceDomain: input.sourceDomain,
            sourceObjectRef: input.sourceObjectRef,
            reservationState: input.requestedState,
            activatedAt: input.supplierObservedAt,
          }),
          reservationState: input.requestedState,
          commitMode: deriveCommitMode(input.requestedState, input.commitMode),
          state: "conflict_blocked",
          truthBasisHash: null,
          sourceReservationRef: null,
          sourceProjectionRef: null,
          activatedAt: input.supplierObservedAt,
          expiresAt: input.expiresAt ?? null,
          releasedAt: null,
          expiredAt: null,
          disputedAt: null,
          blockingFenceRef: activeFence.reservationFenceRecordId,
          reasonRefs: ["canonical_reservation_key_conflict", "exclusive_contention"],
          version: 1,
        });
        await this.repositories.saveReservationFenceRecord(blockedFence);
        return {
          fence: blockedFence,
          reservation: null,
          projection: null,
          replayed: false,
          conflictBlocked: true,
          blockingFence: activeFence,
        };
      }

      if (activeFence) {
        await this.supersedeSoftFence(activeFence, input.supplierObservedAt);
      }

      const reservationAuthority = createReservationConfirmationAuthorityService(
        this.repositories,
        this.idGenerator,
      );
      const reservation = await reservationAuthority.recordCapacityReservation({
        capacityIdentityRef: input.capacityIdentityRef,
        canonicalReservationKey: input.canonicalReservationKey,
        sourceDomain: input.sourceDomain,
        holderRef: input.holderRef,
        state: input.requestedState,
        commitMode: deriveCommitMode(input.requestedState, input.commitMode),
        supplierObservedAt: input.supplierObservedAt,
        expiresAt: input.expiresAt ?? null,
        revalidatedAt: input.revalidatedAt ?? null,
        confirmedAt: input.confirmedAt ?? null,
      });
      const projection = await reservationAuthority.refreshReservationTruthProjection({
        reservationId: reservation.reservationId,
        sourceObjectRef: input.sourceObjectRef,
        selectedAnchorRef: input.selectedAnchorRef,
        projectionFreshnessEnvelopeRef: input.projectionFreshnessEnvelopeRef,
        generatedAt: input.generatedAt ?? input.supplierObservedAt,
        capacityIdentitySupportsExclusivity: input.capacityIdentitySupportsExclusivity,
      });
      const reservationSnapshot = reservation.toSnapshot();
      const fence = ReservationFenceRecordDocument.create({
        reservationFenceRecordId: nextReservationQueueControlId(
          this.idGenerator,
          "reservationFenceRecord",
        ),
        canonicalReservationKey: input.canonicalReservationKey,
        capacityIdentityRef: input.capacityIdentityRef,
        holderRef: input.holderRef,
        sourceDomain: input.sourceDomain,
        sourceObjectRef: input.sourceObjectRef,
        selectedAnchorRef: input.selectedAnchorRef,
        projectionFreshnessEnvelopeRef: input.projectionFreshnessEnvelopeRef,
        fenceToken: reservationSnapshot.activeFencingToken,
        reservationState: reservationSnapshot.state,
        commitMode: reservationSnapshot.commitMode,
        state: "active",
        truthBasisHash: reservationSnapshot.truthBasisHash,
        sourceReservationRef: reservationSnapshot.reservationId,
      sourceProjectionRef: projection.toSnapshot().reservationTruthProjectionId,
      activatedAt: reservationSnapshot.supplierObservedAt,
      expiresAt: reservationSnapshot.expiresAt,
      releasedAt: null,
      expiredAt: null,
      disputedAt: null,
      blockingFenceRef: null,
      reasonRefs: uniqueSortedRefs([
        reservationSnapshot.state,
        reservationSnapshot.commitMode,
          reservationSnapshot.state === "soft_selected"
            ? "truthful_nonexclusive_offer"
            : "serialized_reservation_claim",
        ]),
        version: 1,
      });
      await this.repositories.saveReservationFenceRecord(fence);
      return {
        fence,
        reservation,
        projection,
        replayed: false,
        conflictBlocked: false,
        blockingFence: null,
      };
    });
  }

  async transitionReservation(
    input: TransitionReservationInput,
  ): Promise<ReservationAuthorityTransitionResult> {
    return this.serializeOnReservationKey(input.canonicalReservationKey, async () => {
      const bundle = await this.requireActiveFenceBundle({
        canonicalReservationKey: input.canonicalReservationKey,
        fenceToken: input.fenceToken,
        expectedReservationVersionRef: input.expectedReservationVersionRef,
      });
      const fenceSnapshot = bundle.fence.toSnapshot();
      const currentReservation = bundle.reservation.toSnapshot();
      const reservationAuthority = createReservationConfirmationAuthorityService(
        this.repositories,
        this.idGenerator,
      );

      let commitMode = currentReservation.commitMode;
      if (input.requestedState === "held") {
        commitMode = "exclusive_hold";
      } else if (input.requestedState === "soft_selected") {
        commitMode =
          input.commitMode === "degraded_manual_pending"
            ? "degraded_manual_pending"
            : "truthful_nonexclusive";
      } else if (input.commitMode) {
        commitMode = input.commitMode;
      }

      invariant(
        input.requestedState !== "held" || commitMode === "exclusive_hold",
        "HELD_TRANSITION_REQUIRES_EXCLUSIVE_HOLD",
        "held transitions must use exclusive_hold commit mode.",
      );
      invariant(
        input.requestedState !== "soft_selected" || commitMode !== "exclusive_hold",
        "SOFT_SELECTED_TRANSITION_FORBIDS_EXCLUSIVE_HOLD",
        "soft_selected transitions may not imply exclusive_hold semantics.",
      );
      invariant(
        input.requestedState !== "disputed" || optionalRef(input.terminalReasonCode) !== null,
        "DISPUTED_TRANSITION_REQUIRES_REASON",
        "disputed transitions require a terminalReasonCode.",
      );
      const timing = derivePostConfirmationTiming({
        observedAt: input.observedAt,
        revalidatedAt: input.revalidatedAt,
        currentReservation,
      });

      const updatedReservation = await reservationAuthority.recordCapacityReservation({
        reservationId: currentReservation.reservationId,
        capacityIdentityRef: currentReservation.capacityIdentityRef,
        canonicalReservationKey: currentReservation.canonicalReservationKey,
        sourceDomain: currentReservation.sourceDomain,
        holderRef: currentReservation.holderRef,
        state: input.requestedState,
        commitMode,
        supplierObservedAt: timing.supplierObservedAt,
        revalidatedAt: timing.revalidatedAt,
        expiresAt:
          input.requestedState === "held" || input.requestedState === "soft_selected"
            ? (input.expiresAt ?? currentReservation.expiresAt)
            : currentReservation.expiresAt,
        confirmedAt:
          input.requestedState === "confirmed"
            ? (input.confirmedAt ?? input.observedAt)
            : currentReservation.confirmedAt,
        terminalReasonCode:
          input.requestedState === "disputed"
            ? optionalRef(input.terminalReasonCode)
            : currentReservation.terminalReasonCode,
      });
      const projection = await reservationAuthority.refreshReservationTruthProjection({
        reservationId: updatedReservation.reservationId,
        reservationTruthProjectionId:
          fenceSnapshot.sourceProjectionRef ?? bundle.projection?.reservationTruthProjectionId,
        sourceObjectRef: optionalRef(input.sourceObjectRef) ?? fenceSnapshot.sourceObjectRef,
        selectedAnchorRef:
          optionalRef(input.selectedAnchorRef) ?? fenceSnapshot.selectedAnchorRef,
        projectionFreshnessEnvelopeRef:
          optionalRef(input.projectionFreshnessEnvelopeRef) ??
          fenceSnapshot.projectionFreshnessEnvelopeRef,
        generatedAt: input.generatedAt ?? input.observedAt,
        capacityIdentitySupportsExclusivity: input.capacityIdentitySupportsExclusivity,
      });
      const updatedFence = ReservationFenceRecordDocument.create({
        ...fenceSnapshot,
        sourceObjectRef: optionalRef(input.sourceObjectRef) ?? fenceSnapshot.sourceObjectRef,
        selectedAnchorRef:
          optionalRef(input.selectedAnchorRef) ?? fenceSnapshot.selectedAnchorRef,
        projectionFreshnessEnvelopeRef:
          optionalRef(input.projectionFreshnessEnvelopeRef) ??
          fenceSnapshot.projectionFreshnessEnvelopeRef,
        fenceToken: updatedReservation.toSnapshot().activeFencingToken,
        reservationState: updatedReservation.toSnapshot().state,
        commitMode: updatedReservation.toSnapshot().commitMode,
        state: input.requestedState === "disputed" ? "disputed" : "active",
        truthBasisHash: updatedReservation.toSnapshot().truthBasisHash,
        sourceProjectionRef: projection.toSnapshot().reservationTruthProjectionId,
        activatedAt: input.observedAt,
        expiresAt: updatedReservation.toSnapshot().expiresAt,
        releasedAt: null,
        expiredAt: null,
        disputedAt: input.requestedState === "disputed" ? input.observedAt : null,
        blockingFenceRef: null,
        reasonRefs: uniqueSortedRefs([
          ...fenceSnapshot.reasonRefs,
          input.requestedState,
          updatedReservation.toSnapshot().commitMode,
          optionalRef(input.terminalReasonCode) ?? "",
        ]),
        version: fenceSnapshot.version + 1,
      });
      await this.repositories.saveReservationFenceRecord(updatedFence, {
        expectedVersion: fenceSnapshot.version,
      });
      return {
        fence: updatedFence,
        reservation: updatedReservation,
        projection,
      };
    });
  }

  private async completeReservation(
    state: Extract<CapacityReservationState, "released" | "expired" | "disputed">,
    input: CompleteReservationInput,
  ): Promise<ReservationAuthorityTransitionResult> {
    return this.serializeOnReservationKey(input.canonicalReservationKey, async () => {
      const bundle = await this.requireActiveFenceBundle({
        canonicalReservationKey: input.canonicalReservationKey,
        fenceToken: input.fenceToken,
        expectedReservationVersionRef: input.expectedReservationVersionRef,
      });
      const fenceSnapshot = bundle.fence.toSnapshot();
      const reservationAuthority = createReservationConfirmationAuthorityService(
        this.repositories,
        this.idGenerator,
      );
      const currentReservation = bundle.reservation.toSnapshot();
      const timing = derivePostConfirmationTiming({
        observedAt: input.observedAt,
        currentReservation,
      });
      const terminalSupplierObservedAt =
        state === "expired" &&
        currentReservation.expiresAt !== null &&
        compareIso(currentReservation.expiresAt, timing.supplierObservedAt) < 0
          ? currentReservation.supplierObservedAt
          : timing.supplierObservedAt;
      const terminalRevalidatedAt =
        state === "expired" &&
        currentReservation.expiresAt !== null &&
        compareIso(currentReservation.expiresAt, timing.supplierObservedAt) < 0
          ? input.observedAt
          : timing.revalidatedAt;
      const updatedReservation = await reservationAuthority.recordCapacityReservation({
        reservationId: currentReservation.reservationId,
        capacityIdentityRef: currentReservation.capacityIdentityRef,
        canonicalReservationKey: currentReservation.canonicalReservationKey,
        sourceDomain: currentReservation.sourceDomain,
        holderRef: currentReservation.holderRef,
        state,
        commitMode: currentReservation.commitMode,
        supplierObservedAt: terminalSupplierObservedAt,
        revalidatedAt: terminalRevalidatedAt,
        expiresAt:
          state === "expired"
            ? (currentReservation.expiresAt ?? input.observedAt)
            : currentReservation.expiresAt,
        confirmedAt: currentReservation.confirmedAt,
        releasedAt: state === "released" ? input.observedAt : null,
        terminalReasonCode: input.terminalReasonCode,
      });
      const projection = await reservationAuthority.refreshReservationTruthProjection({
        reservationId: updatedReservation.reservationId,
        reservationTruthProjectionId: fenceSnapshot.sourceProjectionRef ?? undefined,
        sourceObjectRef: fenceSnapshot.sourceObjectRef,
        selectedAnchorRef: fenceSnapshot.selectedAnchorRef,
        projectionFreshnessEnvelopeRef: fenceSnapshot.projectionFreshnessEnvelopeRef,
        generatedAt: input.generatedAt ?? input.observedAt,
      });
      const completedFence = ReservationFenceRecordDocument.create({
        ...fenceSnapshot,
        reservationState: state,
        state: state === "disputed" ? "disputed" : state,
        truthBasisHash: updatedReservation.toSnapshot().truthBasisHash,
        sourceProjectionRef: projection.toSnapshot().reservationTruthProjectionId,
        releasedAt: state === "released" ? input.observedAt : null,
        expiredAt: state === "expired" ? input.observedAt : null,
        disputedAt: state === "disputed" ? input.observedAt : null,
        reasonRefs: uniqueSortedRefs([
          ...fenceSnapshot.reasonRefs,
          input.terminalReasonCode,
          state === "released"
            ? "reservation_released"
            : state === "expired"
              ? "hold_expired"
              : "reservation_disputed",
        ]),
        version: fenceSnapshot.version + 1,
      });
      await this.repositories.saveReservationFenceRecord(completedFence, {
        expectedVersion: fenceSnapshot.version,
      });
      return {
        fence: completedFence,
        reservation: updatedReservation,
        projection,
      };
    });
  }

  async releaseReservation(
    input: CompleteReservationInput,
  ): Promise<ReservationAuthorityTransitionResult> {
    return this.completeReservation("released", input);
  }

  async expireReservation(
    input: CompleteReservationInput,
  ): Promise<ReservationAuthorityTransitionResult> {
    return this.completeReservation("expired", input);
  }

  async disputeReservation(
    input: CompleteReservationInput,
  ): Promise<ReservationAuthorityTransitionResult> {
    return this.completeReservation("disputed", input);
  }
}

export interface CommitQueueRankSnapshotInput {
  factCut: QueueRankingFactCut;
  queueRankPlan?: typeof queueDefaultPlan;
}

export interface QueueSnapshotCommitResult {
  plan: QueueRankPlanDocument;
  snapshot: QueueRankSnapshotDocument;
  entries: readonly QueueRankEntryDocument[];
  commit: QueueSnapshotCommitRecordDocument;
  escalation: QueuePressureEscalationRecordDocument | null;
}

export interface RefreshAssignmentAdviceInput {
  rankSnapshotRef: string;
  reviewerScopeRef: string;
  generatedAt: string;
  reviewers: readonly QueueReviewerFact[];
  queueRowSnapshotRefs?: readonly string[];
  nextTaskSnapshotRefs?: readonly string[];
  previewSnapshotRefs?: readonly string[];
  staleOwnerRecoveryRefs?: readonly string[];
}

export interface RefreshAssignmentAdviceResult {
  suggestion: QueueAssignmentSuggestionSnapshotDocument;
  sourceSnapshot: QueueRankSnapshotDocument;
  sourceEntries: readonly QueueRankEntryDocument[];
  commit: QueueSnapshotCommitRecordDocument;
  advisory: NextTaskAdvisorySnapshotDocument;
}

export class QueueRankingCoordinator {
  private readonly authority: ReturnType<typeof createQueueRankingAuthorityService>;

  constructor(
    private readonly repositories: ReservationQueueControlDependencies,
    private readonly idGenerator: BackboneIdGenerator,
  ) {
    this.authority = createQueueRankingAuthorityService(this.repositories, {
      nextId: (kind) => nextReservationQueueControlId(this.idGenerator, kind),
    });
  }

  private async ensurePlan(
    planSnapshot: typeof queueDefaultPlan = queueDefaultPlan,
  ): Promise<QueueRankPlanDocument> {
    const existing = await this.repositories.getQueueRankPlan(planSnapshot.queueRankPlanId);
    if (existing) {
      return existing;
    }
    const plan = QueueRankPlanDocument.fromSnapshot(planSnapshot);
    await this.repositories.saveQueueRankPlan(plan);
    return plan;
  }

  private deriveFairnessMergeState(
    snapshot: QueueRankSnapshotDocument,
    entries: readonly QueueRankEntryDocument[],
  ): {
    state: QueueFairnessMergeState;
    classes: readonly string[];
  } {
    const eligibleEntries = entries
      .map((entry) => entry.toSnapshot())
      .filter((entry) => entry.eligibilityState === "eligible");
    const classes = uniqueSortedRefs(
      eligibleEntries.map(
        (entry) => entry.normalizedExplanationPayload.fairnessTransition.mergeClass,
      ),
    );
    if (snapshot.toSnapshot().overloadState === "overload_critical") {
      return {
        state: "suppressed_overload",
        classes,
      };
    }
    return {
      state: classes.includes("routine_fair_merge") ? "merged" : "steady",
      classes,
    };
  }

  async commitRankSnapshot(
    input: CommitQueueRankSnapshotInput,
  ): Promise<QueueSnapshotCommitResult> {
    const plan = await this.ensurePlan(input.queueRankPlan);
    const ranking = await this.authority.materializeRankSnapshot(
      plan.toSnapshot().queueRankPlanId,
      input.factCut,
    );
    const fairness = this.deriveFairnessMergeState(ranking.snapshot, ranking.entries);
    const commit = QueueSnapshotCommitRecordDocument.create({
      queueSnapshotCommitRecordId: nextReservationQueueControlId(
        this.idGenerator,
        "queueSnapshotCommitRecord",
      ),
      rankSnapshotRef: ranking.snapshot.toSnapshot().rankSnapshotId,
      queueRef: ranking.snapshot.toSnapshot().queueRef,
      queueFamilyRef: input.factCut.queueFamilyRef,
      queueRankPlanRef: ranking.snapshot.toSnapshot().queueRankPlanRef,
      sourceFactCutRef: ranking.snapshot.toSnapshot().sourceFactCutRef,
      rowOrderHash: ranking.snapshot.toSnapshot().rowOrderHash,
      overloadState: ranking.snapshot.toSnapshot().overloadState,
      fairnessMergeState: fairness.state,
      fairnessMergeClasses: fairness.classes,
      eligibleTaskRefs: ranking.snapshot.toSnapshot().eligibleTaskRefs,
      heldTaskRefs: ranking.entries
        .map((entry) => entry.toSnapshot())
        .filter((entry) => entry.eligibilityState !== "eligible")
        .map((entry) => entry.taskRef),
      assignmentSuggestionRef: null,
      committedAt: ranking.snapshot.toSnapshot().generatedAt,
      version: 1,
    });
    await this.repositories.saveQueueSnapshotCommitRecord(commit);

    let escalation: QueuePressureEscalationRecordDocument | null = null;
    if (
      ranking.snapshot.toSnapshot().overloadState === "overload_critical" &&
      input.factCut.telemetry
    ) {
      const denominator =
        input.factCut.telemetry.empiricalServiceRatePerHour *
          Math.max(input.factCut.telemetry.activeReviewerCount, 1) || 1;
      escalation = QueuePressureEscalationRecordDocument.create({
        queuePressureEscalationRecordId: nextReservationQueueControlId(
          this.idGenerator,
          "queuePressureEscalationRecord",
        ),
        rankSnapshotRef: ranking.snapshot.toSnapshot().rankSnapshotId,
        queueRef: ranking.snapshot.toSnapshot().queueRef,
        overloadState: ranking.snapshot.toSnapshot().overloadState,
        pressureRatio: Number(
          (input.factCut.telemetry.criticalArrivalRatePerHour / denominator).toFixed(6),
        ),
        criticalArrivalRatePerHour: input.factCut.telemetry.criticalArrivalRatePerHour,
        empiricalServiceRatePerHour: input.factCut.telemetry.empiricalServiceRatePerHour,
        activeReviewerCount: input.factCut.telemetry.activeReviewerCount,
        reasonRefs: ["overload_critical", "fairness_promises_suppressed"],
        escalatedAt: ranking.snapshot.toSnapshot().generatedAt,
        version: 1,
      });
      await this.repositories.saveQueuePressureEscalationRecord(escalation);
    }

    return {
      plan: ranking.plan,
      snapshot: ranking.snapshot,
      entries: ranking.entries,
      commit,
      escalation,
    };
  }

  private async createAdvisory(input: {
    rankSnapshotRef: string;
    reviewerScopeRef: string;
    suggestionSnapshot: QueueAssignmentSuggestionSnapshot;
    generatedAt: string;
    staleOwnerRecoveryRefs: readonly string[];
    queueRowSnapshotRefs: readonly string[];
    nextTaskSnapshotRefs: readonly string[];
    previewSnapshotRefs: readonly string[];
  }): Promise<NextTaskAdvisorySnapshotDocument> {
    const latest = await this.repositories.getLatestNextTaskAdvisoryByRankSnapshotRef(
      input.rankSnapshotRef,
    );
    let advisoryState: NextTaskAdvisoryState = "ready";
    let blockedReasonRefs: string[] = [];
    const staleOwnerRecoveryRefs = uniqueSortedRefs(input.staleOwnerRecoveryRefs);
    if (staleOwnerRecoveryRefs.length > 0) {
      advisoryState = "blocked_stale_owner";
      blockedReasonRefs = ["stale_owner_recovery_required"];
    } else {
      try {
        validateQueueConsumerSnapshotRefs({
          sourceQueueRankSnapshotRef: input.rankSnapshotRef,
          queueRowSnapshotRefs: input.queueRowSnapshotRefs,
          nextTaskSnapshotRefs: input.nextTaskSnapshotRefs,
          previewSnapshotRefs: input.previewSnapshotRefs,
        });
      } catch {
        advisoryState = "blocked_mixed_snapshot";
        blockedReasonRefs = ["mixed_snapshot_queue_truth_forbidden"];
      }
    }

    const nextTaskRefs =
      advisoryState === "ready"
        ? input.suggestionSnapshot.suggestionRows
            .filter((row) => row.reviewerRef !== null)
            .sort((left, right) => left.ordinal - right.ordinal)
            .slice(0, 3)
            .map((row) => row.taskRef)
        : [];
    const advisory = NextTaskAdvisorySnapshotDocument.create({
      nextTaskAdvisorySnapshotId: nextReservationQueueControlId(
        this.idGenerator,
        "nextTaskAdvisorySnapshot",
      ),
      rankSnapshotRef: input.rankSnapshotRef,
      reviewerScopeRef: input.reviewerScopeRef,
      advisoryState,
      sourceSuggestionSnapshotRef: input.suggestionSnapshot.suggestionSnapshotId,
      nextTaskRefs,
      governedAutoClaimRefs:
        advisoryState === "ready" ? input.suggestionSnapshot.governedAutoClaimRefs : [],
      blockedReasonRefs,
      staleOwnerRecoveryRefs,
      generatedAt: input.generatedAt,
      version: latest ? latest.toSnapshot().version + 1 : 1,
    });
    await this.repositories.saveNextTaskAdvisorySnapshot(advisory);
    return advisory;
  }

  async refreshAssignmentAdvice(
    input: RefreshAssignmentAdviceInput,
  ): Promise<RefreshAssignmentAdviceResult> {
    const commit = await this.repositories.getQueueSnapshotCommitRecordByRankSnapshotRef(
      input.rankSnapshotRef,
    );
    invariant(
      commit !== null,
      "QUEUE_SNAPSHOT_COMMIT_MISSING",
      "Assignment suggestions may only refresh from a committed QueueRankSnapshot.",
    );
    const suggestions = await this.authority.deriveAssignmentSuggestionSnapshot({
      rankSnapshotRef: input.rankSnapshotRef,
      reviewerScopeRef: input.reviewerScopeRef,
      generatedAt: input.generatedAt,
      reviewers: input.reviewers,
    });
    const commitSnapshot = commit.toSnapshot();
    const updatedCommit = QueueSnapshotCommitRecordDocument.create({
      ...commitSnapshot,
      assignmentSuggestionRef: suggestions.snapshot.toSnapshot().suggestionSnapshotId,
      version: commitSnapshot.version + 1,
    });
    await this.repositories.saveQueueSnapshotCommitRecord(updatedCommit, {
      expectedVersion: commitSnapshot.version,
    });
    const advisory = await this.createAdvisory({
      rankSnapshotRef: input.rankSnapshotRef,
      reviewerScopeRef: input.reviewerScopeRef,
      suggestionSnapshot: suggestions.snapshot.toSnapshot(),
      generatedAt: input.generatedAt,
      staleOwnerRecoveryRefs: input.staleOwnerRecoveryRefs ?? [],
      queueRowSnapshotRefs: input.queueRowSnapshotRefs ?? [input.rankSnapshotRef],
      nextTaskSnapshotRefs: input.nextTaskSnapshotRefs ?? [input.rankSnapshotRef],
      previewSnapshotRefs: input.previewSnapshotRefs ?? [input.rankSnapshotRef],
    });
    return {
      suggestion: suggestions.snapshot,
      sourceSnapshot: suggestions.sourceSnapshot,
      sourceEntries: suggestions.sourceEntries,
      commit: updatedCommit,
      advisory,
    };
  }
}

export function createReservationQueueServices(options?: {
  repositories?: ReservationQueueControlDependencies;
  idGenerator?: BackboneIdGenerator;
}) {
  const repositories = options?.repositories ?? createReservationQueueControlStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("reservation_queue_control_backbone");
  return {
    repositories,
    reservationAuthority: new ReservationAuthority(repositories, idGenerator),
    queueRankingCoordinator: new QueueRankingCoordinator(repositories, idGenerator),
  };
}

function baseTask(input: {
  taskRef: string;
  queueEnteredAt: string;
  slaTargetAt: string;
  expectedHandleMinutes: number;
  clinicalPriorityBand: number;
  residualRisk: number;
  contactRisk: number;
  fairnessBandRef: string;
  escalated?: boolean;
  returned?: boolean;
  lastMaterialReturnAt?: string;
  evidenceDeltaSeverity?: number;
  urgencyCarry?: number;
  vulnerability?: number;
  coverageFit?: number;
  duplicateReviewFlag?: boolean;
  assimilationPending?: boolean;
  preemptionPending?: boolean;
  trustState?: "trusted" | "stale" | "quarantined";
  missingTrustInputRefs?: readonly string[];
  scopeExcluded?: boolean;
  archetypeRef?: string;
}): QueueRankTaskFact {
  return {
    taskRef: input.taskRef,
    queueEnteredAt: input.queueEnteredAt,
    slaTargetAt: input.slaTargetAt,
    expectedHandleMinutes: input.expectedHandleMinutes,
    clinicalPriorityBand: input.clinicalPriorityBand,
    residualRisk: input.residualRisk,
    contactRisk: input.contactRisk,
    assimilationPending: input.assimilationPending ?? false,
    preemptionPending: input.preemptionPending ?? false,
    escalated: input.escalated ?? false,
    returned: input.returned ?? false,
    lastMaterialReturnAt: input.lastMaterialReturnAt ?? null,
    evidenceDeltaSeverity: input.evidenceDeltaSeverity ?? 0,
    urgencyCarry: input.urgencyCarry ?? 0,
    vulnerability: input.vulnerability ?? 0,
    coverageFit: input.coverageFit ?? 0.85,
    duplicateReviewFlag: input.duplicateReviewFlag ?? false,
    fairnessBandRef: input.fairnessBandRef,
    trustState: input.trustState ?? "trusted",
    missingTrustInputRefs: input.missingTrustInputRefs ?? [],
    scopeExcluded: input.scopeExcluded ?? false,
    archetypeRef: input.archetypeRef ?? "staff_review",
  };
}

function buildFactCut(input: {
  scenarioId: string;
  asOfAt: string;
  generatedAt: string;
  taskFacts: readonly QueueRankTaskFact[];
  telemetry?: QueueRankingFactCut["telemetry"];
}): QueueRankingFactCut {
  return {
    queueRef: `queue_${input.scenarioId}`,
    queueFamilyRef: queueDefaultPlan.queueFamilyRef,
    sourceFactCutRef: `fact_cut_${input.scenarioId}`,
    asOfAt: input.asOfAt,
    generatedAt: input.generatedAt,
    trustInputRefs: ["trust_slice_triage", "trust_slice_reachability"],
    taskFacts: input.taskFacts,
    telemetry: input.telemetry ?? null,
  };
}

function defaultReviewers(): readonly QueueReviewerFact[] {
  return [
    {
      reviewerRef: "reviewer_alex",
      freeCapacity: 2,
      loadHeadroom: 0.86,
      eligibleTaskRefs: ["task_assign_escalated", "task_assign_return", "task_assign_routine"],
      skillScores: {
        task_assign_escalated: 0.94,
        task_assign_return: 0.55,
        task_assign_routine: 0.48,
      },
      continuityScores: {
        task_assign_return: 0.7,
      },
      sameContextTaskRefs: ["task_assign_return"],
      contextSwitchCosts: {
        task_assign_escalated: 0.12,
      },
      focusPenaltyByTaskRef: {},
    },
    {
      reviewerRef: "reviewer_bea",
      freeCapacity: 2,
      loadHeadroom: 0.7,
      skillScores: {
        task_assign_escalated: 0.61,
        task_assign_return: 0.84,
        task_assign_routine: 0.88,
      },
      continuityScores: {
        task_assign_routine: 0.42,
      },
      sameContextTaskRefs: ["task_assign_routine"],
      contextSwitchCosts: {
        task_assign_return: 0.04,
      },
      focusPenaltyByTaskRef: {
        task_assign_escalated: 0.12,
      },
    },
  ];
}

export interface ReservationQueueSimulationScenarioResult {
  scenarioId: string;
  title: string;
  fence: ReservationFenceRecordDocument | null;
  blockingFence: ReservationFenceRecordDocument | null;
  reservation: CapacityReservationDocument | null;
  projection: ReservationTruthProjectionDocument | null;
  queueCommit: QueueSnapshotCommitRecordDocument | null;
  queueEntries: readonly QueueRankEntryDocument[];
  escalation: QueuePressureEscalationRecordDocument | null;
  suggestion: QueueAssignmentSuggestionSnapshotDocument | null;
  advisory: NextTaskAdvisorySnapshotDocument | null;
  eventNames: readonly string[];
}

class ReservationQueueSimulationHarness {
  constructor(
    private readonly reservationAuthority: ReservationAuthority,
    private readonly queueRankingCoordinator: QueueRankingCoordinator,
    private readonly repositories: ReservationQueueControlDependencies,
  ) {}

  async runAllScenarios(): Promise<readonly ReservationQueueSimulationScenarioResult[]> {
    const results: ReservationQueueSimulationScenarioResult[] = [];
    for (const operation of [
      () => this.runSoftSelectedScenario(),
      () => this.runHeldReservationScenario(),
      () => this.runPendingConfirmationScenario(),
      () => this.runOverlappingClaimScenario(),
      () => this.runNormalQueueScenario(),
      () => this.runOverloadQueueScenario(),
      () => this.runFairnessMergeScenario(),
      () => this.runAssignmentSuggestionScenario(),
      () => this.runBlockedNextTaskScenario(),
    ]) {
      results.push(await operation());
    }
    return results;
  }

  private async runSoftSelectedScenario(): Promise<ReservationQueueSimulationScenarioResult> {
    const claim = await this.reservationAuthority.claimReservation({
      capacityIdentityRef: "capacity_unit_081_soft_selected",
      canonicalReservationKey: "canonical_reservation_key_081_soft_selected",
      sourceDomain: "booking_local",
      holderRef: "offer_session_081_soft",
      sourceObjectRef: "offer_card_081_soft",
      selectedAnchorRef: "slot_card_081_soft",
      projectionFreshnessEnvelopeRef: "freshness::081_soft_selected",
      requestedState: "soft_selected",
      supplierObservedAt: "2026-04-12T11:00:00Z",
      generatedAt: "2026-04-12T11:00:02Z",
    });
    return {
      scenarioId: "soft_selected_supply_no_exclusive_hold",
      title: "Soft-selected supply keeps nonexclusive copy and still serializes through one fence.",
      fence: claim.fence,
      blockingFence: null,
      reservation: claim.reservation,
      projection: claim.projection,
      queueCommit: null,
      queueEntries: [],
      escalation: null,
      suggestion: null,
      advisory: null,
      eventNames: ["reservation.claimed"],
    };
  }

  private async runHeldReservationScenario(): Promise<ReservationQueueSimulationScenarioResult> {
    const initialClaim = await this.reservationAuthority.claimReservation({
      capacityIdentityRef: "capacity_unit_081_held",
      canonicalReservationKey: "canonical_reservation_key_081_held",
      sourceDomain: "booking_local",
      holderRef: "offer_session_081_held",
      sourceObjectRef: "offer_card_081_held",
      selectedAnchorRef: "slot_card_081_held",
      projectionFreshnessEnvelopeRef: "freshness::081_held",
      requestedState: "held",
      supplierObservedAt: "2026-04-12T11:05:00Z",
      generatedAt: "2026-04-12T11:05:02Z",
      expiresAt: "2026-04-12T11:10:00Z",
    });
    await this.reservationAuthority.expireReservation({
      canonicalReservationKey: "canonical_reservation_key_081_held",
      fenceToken: initialClaim.fence.fenceToken,
      observedAt: "2026-04-12T11:10:00Z",
      generatedAt: "2026-04-12T11:10:01Z",
      terminalReasonCode: "HOLD_WINDOW_ELAPSED",
    });
    const claim = await this.reservationAuthority.claimReservation({
      capacityIdentityRef: "capacity_unit_081_held",
      canonicalReservationKey: "canonical_reservation_key_081_held",
      sourceDomain: "booking_local",
      holderRef: "offer_session_081_held",
      sourceObjectRef: "offer_card_081_held_revalidated",
      selectedAnchorRef: "slot_card_081_held",
      projectionFreshnessEnvelopeRef: "freshness::081_held_revalidated",
      requestedState: "held",
      supplierObservedAt: "2026-04-12T11:10:05Z",
      generatedAt: "2026-04-12T11:10:06Z",
      revalidatedAt: "2026-04-12T11:10:05Z",
      expiresAt: "2026-04-12T11:15:00Z",
    });
    return {
      scenarioId: "real_held_reservation_with_expiry_and_revalidation",
      title:
        "Real holds preserve expiry and revalidation instead of reassuring from soft selection.",
      fence: claim.fence,
      blockingFence: null,
      reservation: claim.reservation,
      projection: claim.projection,
      queueCommit: null,
      queueEntries: [],
      escalation: null,
      suggestion: null,
      advisory: null,
      eventNames: ["reservation.claimed", "reservation.hold_expired"],
    };
  }

  private async runPendingConfirmationScenario(): Promise<ReservationQueueSimulationScenarioResult> {
    const claim = await this.reservationAuthority.claimReservation({
      capacityIdentityRef: "capacity_unit_081_pending",
      canonicalReservationKey: "canonical_reservation_key_081_pending",
      sourceDomain: "hub_booking",
      holderRef: "hub_offer_081_pending",
      sourceObjectRef: "hub_offer_card_081_pending",
      selectedAnchorRef: "hub_slot_081_pending",
      projectionFreshnessEnvelopeRef: "freshness::081_pending_confirmation",
      requestedState: "pending_confirmation",
      supplierObservedAt: "2026-04-12T11:10:00Z",
      generatedAt: "2026-04-12T11:10:05Z",
      commitMode: "truthful_nonexclusive",
    });
    return {
      scenarioId: "pending_confirmation_requires_truthful_nonfinal_copy",
      title:
        "Pending confirmation remains distinct from final success and does not imply exclusivity.",
      fence: claim.fence,
      blockingFence: null,
      reservation: claim.reservation,
      projection: claim.projection,
      queueCommit: null,
      queueEntries: [],
      escalation: null,
      suggestion: null,
      advisory: null,
      eventNames: ["reservation.claimed"],
    };
  }

  private async runOverlappingClaimScenario(): Promise<ReservationQueueSimulationScenarioResult> {
    const accepted = await this.reservationAuthority.claimReservation({
      capacityIdentityRef: "capacity_unit_081_overlap",
      canonicalReservationKey: "canonical_reservation_key_081_overlap",
      sourceDomain: "booking_local",
      holderRef: "local_offer_081_overlap",
      sourceObjectRef: "local_offer_card_081_overlap",
      selectedAnchorRef: "slot_card_081_overlap",
      projectionFreshnessEnvelopeRef: "freshness::081_overlap",
      requestedState: "held",
      supplierObservedAt: "2026-04-12T11:20:00Z",
      generatedAt: "2026-04-12T11:20:02Z",
      expiresAt: "2026-04-12T11:32:00Z",
    });
    const blocked = await this.reservationAuthority.claimReservation({
      capacityIdentityRef: "capacity_unit_081_overlap",
      canonicalReservationKey: "canonical_reservation_key_081_overlap",
      sourceDomain: "hub_booking",
      holderRef: "hub_offer_081_overlap",
      sourceObjectRef: "hub_offer_card_081_overlap",
      selectedAnchorRef: "hub_slot_081_overlap",
      projectionFreshnessEnvelopeRef: "freshness::081_overlap_hub",
      requestedState: "held",
      supplierObservedAt: "2026-04-12T11:20:10Z",
      generatedAt: "2026-04-12T11:20:12Z",
      expiresAt: "2026-04-12T11:31:00Z",
    });
    const released = await this.reservationAuthority.releaseReservation({
      canonicalReservationKey: "canonical_reservation_key_081_overlap",
      fenceToken: accepted.fence.fenceToken,
      observedAt: "2026-04-12T11:21:00Z",
      generatedAt: "2026-04-12T11:21:01Z",
      terminalReasonCode: "SERIALIZED_HANDOFF",
    });
    return {
      scenarioId: "overlapping_local_and_hub_claims_same_key",
      title: "Local and hub booking attempts serialize on one canonical reservation key.",
      fence: blocked.fence,
      blockingFence: released.fence,
      reservation: released.reservation,
      projection: released.projection,
      queueCommit: null,
      queueEntries: [],
      escalation: null,
      suggestion: null,
      advisory: null,
      eventNames: ["reservation.claimed", "reservation.released"],
    };
  }

  private async runNormalQueueScenario(): Promise<ReservationQueueSimulationScenarioResult> {
    const queue = await this.queueRankingCoordinator.commitRankSnapshot({
      factCut: buildFactCut({
        scenarioId: "081_normal_queue",
        asOfAt: "2026-04-12T12:00:00Z",
        generatedAt: "2026-04-12T12:00:03Z",
        telemetry: {
          criticalArrivalRatePerHour: 0.42,
          empiricalServiceRatePerHour: 1.25,
          activeReviewerCount: 4,
        },
        taskFacts: [
          baseTask({
            taskRef: "task_norm_escalated",
            queueEnteredAt: "2026-04-12T10:15:00Z",
            slaTargetAt: "2026-04-12T12:20:00Z",
            expectedHandleMinutes: 18,
            clinicalPriorityBand: 5,
            residualRisk: 0.92,
            contactRisk: 0.3,
            fairnessBandRef: "band_routine",
            escalated: true,
            urgencyCarry: 0.5,
            archetypeRef: "escalation_review",
          }),
          baseTask({
            taskRef: "task_norm_return",
            queueEnteredAt: "2026-04-12T09:55:00Z",
            slaTargetAt: "2026-04-12T12:40:00Z",
            expectedHandleMinutes: 12,
            clinicalPriorityBand: 4,
            residualRisk: 0.61,
            contactRisk: 0.24,
            fairnessBandRef: "band_returned_review",
            returned: true,
            lastMaterialReturnAt: "2026-04-12T11:32:00Z",
            evidenceDeltaSeverity: 0.68,
          }),
          baseTask({
            taskRef: "task_norm_routine",
            queueEnteredAt: "2026-04-12T09:30:00Z",
            slaTargetAt: "2026-04-12T13:05:00Z",
            expectedHandleMinutes: 14,
            clinicalPriorityBand: 3,
            residualRisk: 0.28,
            contactRisk: 0.17,
            fairnessBandRef: "band_risk_attention",
          }),
        ],
      }),
    });
    return {
      scenarioId: "fair_queue_normal_load_commits_snapshot",
      title: "Normal load commits one deterministic queue order from one fact cut.",
      fence: null,
      blockingFence: null,
      reservation: null,
      projection: null,
      queueCommit: queue.commit,
      queueEntries: queue.entries,
      escalation: null,
      suggestion: null,
      advisory: null,
      eventNames: ["queue.rank_snapshot.committed", "queue.fairness_merge.changed"],
    };
  }

  private async runOverloadQueueScenario(): Promise<ReservationQueueSimulationScenarioResult> {
    const queue = await this.queueRankingCoordinator.commitRankSnapshot({
      factCut: buildFactCut({
        scenarioId: "081_overload_queue",
        asOfAt: "2026-04-12T12:10:00Z",
        generatedAt: "2026-04-12T12:10:03Z",
        telemetry: {
          criticalArrivalRatePerHour: 2.4,
          empiricalServiceRatePerHour: 0.35,
          activeReviewerCount: 1,
        },
        taskFacts: [
          baseTask({
            taskRef: "task_overload_1",
            queueEnteredAt: "2026-04-12T10:40:00Z",
            slaTargetAt: "2026-04-12T12:18:00Z",
            expectedHandleMinutes: 22,
            clinicalPriorityBand: 5,
            residualRisk: 0.9,
            contactRisk: 0.42,
            fairnessBandRef: "band_routine",
            escalated: true,
          }),
          baseTask({
            taskRef: "task_overload_2",
            queueEnteredAt: "2026-04-12T10:52:00Z",
            slaTargetAt: "2026-04-12T12:25:00Z",
            expectedHandleMinutes: 16,
            clinicalPriorityBand: 4,
            residualRisk: 0.66,
            contactRisk: 0.35,
            fairnessBandRef: "band_returned_review",
            returned: true,
            lastMaterialReturnAt: "2026-04-12T11:55:00Z",
            evidenceDeltaSeverity: 0.61,
          }),
          baseTask({
            taskRef: "task_overload_3",
            queueEnteredAt: "2026-04-12T10:20:00Z",
            slaTargetAt: "2026-04-12T13:20:00Z",
            expectedHandleMinutes: 14,
            clinicalPriorityBand: 3,
            residualRisk: 0.31,
            contactRisk: 0.2,
            fairnessBandRef: "band_risk_attention",
          }),
        ],
      }),
    });
    return {
      scenarioId: "overload_queue_pressure_escalated",
      title:
        "Overload-critical posture emits one escalation record and suppresses fairness promises.",
      fence: null,
      blockingFence: null,
      reservation: null,
      projection: null,
      queueCommit: queue.commit,
      queueEntries: queue.entries,
      escalation: queue.escalation,
      suggestion: null,
      advisory: null,
      eventNames: ["queue.rank_snapshot.committed", "queue.pressure.escalated"],
    };
  }

  private async runFairnessMergeScenario(): Promise<ReservationQueueSimulationScenarioResult> {
    const queue = await this.queueRankingCoordinator.commitRankSnapshot({
      factCut: buildFactCut({
        scenarioId: "081_fairness_merge",
        asOfAt: "2026-04-12T12:20:00Z",
        generatedAt: "2026-04-12T12:20:03Z",
        telemetry: {
          criticalArrivalRatePerHour: 0.55,
          empiricalServiceRatePerHour: 1.4,
          activeReviewerCount: 5,
        },
        taskFacts: [
          baseTask({
            taskRef: "task_merge_return",
            queueEnteredAt: "2026-04-12T09:15:00Z",
            slaTargetAt: "2026-04-12T14:00:00Z",
            expectedHandleMinutes: 10,
            clinicalPriorityBand: 3,
            residualRisk: 0.38,
            contactRisk: 0.22,
            fairnessBandRef: "band_returned_review",
            returned: true,
            lastMaterialReturnAt: "2026-04-12T11:10:00Z",
            evidenceDeltaSeverity: 0.77,
          }),
          baseTask({
            taskRef: "task_merge_same_day",
            queueEnteredAt: "2026-04-12T09:05:00Z",
            slaTargetAt: "2026-04-12T14:15:00Z",
            expectedHandleMinutes: 12,
            clinicalPriorityBand: 3,
            residualRisk: 0.26,
            contactRisk: 0.16,
            fairnessBandRef: "band_risk_attention",
          }),
          baseTask({
            taskRef: "task_merge_routine",
            queueEnteredAt: "2026-04-12T08:55:00Z",
            slaTargetAt: "2026-04-12T14:30:00Z",
            expectedHandleMinutes: 13,
            clinicalPriorityBand: 3,
            residualRisk: 0.23,
            contactRisk: 0.14,
            fairnessBandRef: "band_routine",
          }),
        ],
      }),
    });
    return {
      scenarioId: "fairness_merge_rotates_routine_bands",
      title: "Fairness merge is explicit and replayable instead of leaking from local sorts.",
      fence: null,
      blockingFence: null,
      reservation: null,
      projection: null,
      queueCommit: queue.commit,
      queueEntries: queue.entries,
      escalation: null,
      suggestion: null,
      advisory: null,
      eventNames: ["queue.rank_snapshot.committed", "queue.fairness_merge.changed"],
    };
  }

  private async runAssignmentSuggestionScenario(): Promise<ReservationQueueSimulationScenarioResult> {
    const queue = await this.queueRankingCoordinator.commitRankSnapshot({
      factCut: buildFactCut({
        scenarioId: "081_assignment_suggestions",
        asOfAt: "2026-04-12T12:30:00Z",
        generatedAt: "2026-04-12T12:30:03Z",
        telemetry: {
          criticalArrivalRatePerHour: 0.48,
          empiricalServiceRatePerHour: 1.35,
          activeReviewerCount: 4,
        },
        taskFacts: [
          baseTask({
            taskRef: "task_assign_escalated",
            queueEnteredAt: "2026-04-12T11:00:00Z",
            slaTargetAt: "2026-04-12T12:45:00Z",
            expectedHandleMinutes: 20,
            clinicalPriorityBand: 5,
            residualRisk: 0.88,
            contactRisk: 0.28,
            fairnessBandRef: "band_routine",
            escalated: true,
            urgencyCarry: 0.45,
          }),
          baseTask({
            taskRef: "task_assign_return",
            queueEnteredAt: "2026-04-12T10:45:00Z",
            slaTargetAt: "2026-04-12T13:05:00Z",
            expectedHandleMinutes: 11,
            clinicalPriorityBand: 4,
            residualRisk: 0.57,
            contactRisk: 0.22,
            fairnessBandRef: "band_returned_review",
            returned: true,
            lastMaterialReturnAt: "2026-04-12T11:58:00Z",
            evidenceDeltaSeverity: 0.7,
          }),
          baseTask({
            taskRef: "task_assign_routine",
            queueEnteredAt: "2026-04-12T10:20:00Z",
            slaTargetAt: "2026-04-12T13:25:00Z",
            expectedHandleMinutes: 15,
            clinicalPriorityBand: 3,
            residualRisk: 0.24,
            contactRisk: 0.15,
            fairnessBandRef: "band_risk_attention",
          }),
        ],
      }),
    });
    const advice = await this.queueRankingCoordinator.refreshAssignmentAdvice({
      rankSnapshotRef: queue.snapshot.toSnapshot().rankSnapshotId,
      reviewerScopeRef: "reviewer_scope_081_assignment",
      generatedAt: "2026-04-12T12:30:06Z",
      reviewers: defaultReviewers(),
    });
    return {
      scenarioId: "assignment_suggestions_preserve_base_queue",
      title:
        "Assignment advice stays downstream from canonical queue order and preserves ordinals.",
      fence: null,
      blockingFence: null,
      reservation: null,
      projection: null,
      queueCommit: advice.commit,
      queueEntries: advice.sourceEntries,
      escalation: null,
      suggestion: advice.suggestion,
      advisory: advice.advisory,
      eventNames: ["queue.rank_snapshot.committed", "queue.assignment_suggestion.refreshed"],
    };
  }

  private async runBlockedNextTaskScenario(): Promise<ReservationQueueSimulationScenarioResult> {
    const queue = await this.queueRankingCoordinator.commitRankSnapshot({
      factCut: buildFactCut({
        scenarioId: "081_blocked_next_task",
        asOfAt: "2026-04-12T12:40:00Z",
        generatedAt: "2026-04-12T12:40:03Z",
        telemetry: {
          criticalArrivalRatePerHour: 0.46,
          empiricalServiceRatePerHour: 1.3,
          activeReviewerCount: 4,
        },
        taskFacts: [
          baseTask({
            taskRef: "task_next_escalated",
            queueEnteredAt: "2026-04-12T11:15:00Z",
            slaTargetAt: "2026-04-12T12:55:00Z",
            expectedHandleMinutes: 17,
            clinicalPriorityBand: 5,
            residualRisk: 0.86,
            contactRisk: 0.27,
            fairnessBandRef: "band_routine",
            escalated: true,
          }),
          baseTask({
            taskRef: "task_next_routine",
            queueEnteredAt: "2026-04-12T10:55:00Z",
            slaTargetAt: "2026-04-12T13:20:00Z",
            expectedHandleMinutes: 14,
            clinicalPriorityBand: 3,
            residualRisk: 0.27,
            contactRisk: 0.16,
            fairnessBandRef: "band_risk_attention",
          }),
        ],
      }),
    });
    const advice = await this.queueRankingCoordinator.refreshAssignmentAdvice({
      rankSnapshotRef: queue.snapshot.toSnapshot().rankSnapshotId,
      reviewerScopeRef: "reviewer_scope_081_next_task",
      generatedAt: "2026-04-12T12:40:07Z",
      reviewers: defaultReviewers(),
      staleOwnerRecoveryRefs: ["owner_recovery_case_081"],
    });
    return {
      scenarioId: "next_task_advice_blocked_on_stale_owner",
      title:
        "Next-task launch blocks until stale-owner recovery clears on the same committed snapshot.",
      fence: null,
      blockingFence: null,
      reservation: null,
      projection: null,
      queueCommit: advice.commit,
      queueEntries: advice.sourceEntries,
      escalation: null,
      suggestion: advice.suggestion,
      advisory: advice.advisory,
      eventNames: ["queue.rank_snapshot.committed", "queue.assignment_suggestion.refreshed"],
    };
  }
}

export function createReservationQueueSimulationHarness(options?: {
  repositories?: ReservationQueueControlDependencies;
  idGenerator?: BackboneIdGenerator;
}) {
  const services = createReservationQueueServices(options);
  return new ReservationQueueSimulationHarness(
    services.reservationAuthority,
    services.queueRankingCoordinator,
    services.repositories,
  );
}

export async function runReservationQueueControlSimulation(options?: {
  repositories?: ReservationQueueControlDependencies;
  idGenerator?: BackboneIdGenerator;
}): Promise<readonly ReservationQueueSimulationScenarioResult[]> {
  return createReservationQueueSimulationHarness(options).runAllScenarios();
}

export const reservationQueueCanonicalEventEntries = [
  {
    eventName: "reservation.claimed",
    description:
      "A reservation claim serialized on canonicalReservationKey produced authoritative reservation truth.",
  },
  {
    eventName: "reservation.released",
    description: "A live reservation fence was released with the latest active fencing token.",
  },
  {
    eventName: "reservation.hold_expired",
    description: "A held reservation expired and patient-visible exclusivity degraded immediately.",
  },
  {
    eventName: "queue.rank_snapshot.committed",
    description:
      "A committed QueueRankSnapshot fixed canonical order from one consistent fact cut.",
  },
  {
    eventName: "queue.assignment_suggestion.refreshed",
    description:
      "Reviewer suggestions refreshed downstream of canonical order without mutating ordinals or tie-break keys.",
  },
  {
    eventName: "queue.fairness_merge.changed",
    description:
      "Fairness merge posture changed and became replayable from persisted queue records.",
  },
  {
    eventName: "queue.pressure.escalated",
    description: "Overload-critical posture emitted a queue pressure escalation record.",
  },
] as const;

export const reservationQueueParallelInterfaceGaps = [
  {
    gapId: "PARALLEL_INTERFACE_GAP_081_LIVE_SUPPLIER_HOLD_FEED",
    stubInterface: "LiveSupplierHoldFeedPort",
    lifecycleState: "stubbed_parallel_interface_gap",
    rationale:
      "par_081 establishes reservation fencing and truthful queue commitment before live supplier hold feeds are wired in later booking tracks.",
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_081_HUB_CONTENTION_SIGNAL_PORT",
    stubInterface: "HubReservationContentionSignalPort",
    lifecycleState: "stubbed_parallel_interface_gap",
    rationale:
      "Hub contention signals will later feed the same canonical ReservationAuthority and may not bypass canonicalReservationKey serialization.",
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_081_WORKBENCH_NEXT_TASK_LAUNCH_PORT",
    stubInterface: "WorkbenchNextTaskLaunchPort",
    lifecycleState: "stubbed_parallel_interface_gap",
    rationale:
      "Workbench next-task launch consumers arrive later and must consume committed snapshot refs instead of recomputing local sort truth.",
  },
] as const;
