import { createHash } from "node:crypto";
import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
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

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function ensureFiniteNumber(value: number, field: string): number {
  invariant(Number.isFinite(value), `INVALID_${field.toUpperCase()}`, `${field} must be finite.`);
  return value;
}

function ensureUnitInterval(value: number, field: string): number {
  const normalized = ensureFiniteNumber(value, field);
  invariant(
    normalized >= 0 && normalized <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1.`,
  );
  return normalized;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function addMinutes(timestamp: string, minutes: number): string {
  return new Date(Date.parse(timestamp) + minutes * 60_000).toISOString();
}

function subtractMinutes(timestamp: string, minutes: number): string {
  return new Date(Date.parse(timestamp) - minutes * 60_000).toISOString();
}

function elapsedMinutes(start: string, end: string): number {
  return Math.floor((Date.parse(end) - Date.parse(start)) / 60_000);
}

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalize(entryValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function normalizeRecordId(prefix: string, digestSource: unknown): string {
  return `${prefix}_${sha256(digestSource).slice(0, 24)}`;
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

function localDayKey(instant: string, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date(instant));
}

function enumerateLocalDayKeys(startAt: string, endAt: string, timeZone: string): string[] {
  const dayKeys: string[] = [];
  const current = new Date(Date.parse(startAt));
  const end = Date.parse(endAt);
  while (current.getTime() <= end) {
    dayKeys.push(localDayKey(current.toISOString(), timeZone));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return uniqueSorted(dayKeys);
}

const WAITLIST_PRIORITY_RULE =
  "deadlineAt asc, joinedAt asc, waitlistEntryId asc" as const;
const WAITLIST_RANK_PLAN_VERSION = "290.smart-waitlist-rank-plan.v1" as const;
export const PHASE4_SMART_WAITLIST_SCHEMA_VERSION =
  "290.phase4.smart-waitlist-transactional-autofill.v1" as const;

export type WaitlistEntryActiveState = "active" | "paused" | "transferred" | "closed";

export type WaitlistContinuationState =
  | "waiting_local_supply"
  | "offer_pending"
  | "accepted_pending_confirmation"
  | "fallback_pending"
  | "callback_transferred"
  | "hub_transferred"
  | "booking_failed"
  | "closed";

export type WaitlistDeadlineClass = "on_track" | "warn" | "critical" | "expired";

export type WaitlistOfferabilityState =
  | "waitlist_safe"
  | "at_risk"
  | "fallback_required"
  | "overdue";

export type WaitlistFallbackRoute =
  | "stay_local_waitlist"
  | "callback"
  | "hub"
  | "booking_failed";

export type WaitlistFallbackTriggerClass =
  | "none"
  | "no_safe_laxity"
  | "no_eligible_supply"
  | "offer_chain_exhausted"
  | "stale_capacity_truth"
  | "policy_cutoff";

export type WaitlistFallbackTransferState =
  | "monitoring"
  | "armed"
  | "transfer_pending"
  | "transferred"
  | "satisfied"
  | "cancelled";

export type WaitlistPatientVisibleState =
  | "waiting_for_offer"
  | "offer_available"
  | "accepted_pending_booking"
  | "callback_expected"
  | "hub_review_pending"
  | "expired"
  | "closed";

export type WaitlistWindowRiskState = "on_track" | "at_risk" | "fallback_due" | "overdue";

export type WaitlistOfferTruthMode = "exclusive_hold" | "truthful_nonexclusive";

export type WaitlistOfferState =
  | "sent"
  | "opened"
  | "accepted"
  | "expired"
  | "superseded"
  | "lost_race"
  | "commit_failed"
  | "closed";

export type WaitlistReservationHoldState =
  | "none"
  | "soft_selected"
  | "held"
  | "pending_confirmation"
  | "confirmed"
  | "released"
  | "expired"
  | "disputed";

export interface WaitlistPreferenceEnvelopeSnapshot {
  modality: "in_person" | "remote" | "either";
  siteRefs: readonly string[];
  timeframeEarliest: string;
  timeframeLatest: string;
  timeZone: string;
  maxTravelMinutes: number;
  continuityPreference: string;
  offerMode: WaitlistOfferTruthMode;
  responseWindowMinutes: number;
  convenienceTags: readonly string[];
}

export interface WaitlistEligibilityIndexKeysSnapshot {
  modalityKeys: readonly string[];
  siteKeys: readonly string[];
  localDayKeys: readonly string[];
  continuityKeys: readonly string[];
}

export interface WaitlistEntrySnapshot {
  waitlistEntryId: string;
  schemaVersion: typeof PHASE4_SMART_WAITLIST_SCHEMA_VERSION;
  bookingCaseId: string;
  patientRef: string;
  requestRef: string;
  requestLineageRef: string;
  routeFamilyRef: string;
  selectionAudience: "patient" | "staff";
  selectedAnchorRef: string;
  activeState: WaitlistEntryActiveState;
  continuationState: WaitlistContinuationState;
  preferenceEnvelope: WaitlistPreferenceEnvelopeSnapshot;
  eligibilityHash: string;
  indexedEligibilityKeys: WaitlistEligibilityIndexKeysSnapshot;
  joinedAt: string;
  priorityKey: string;
  candidateCursor: string | null;
  activeOfferRef: string | null;
  offerHistoryRefs: readonly string[];
  latestDeadlineEvaluationRef: string;
  activeFallbackObligationRef: string;
  continuationTruthProjectionRef: string;
  deadlineAt: string;
  safeWaitlistUntilAt: string;
  expectedOfferServiceMinutes: number;
  responseWindowMinutes: number;
  lastEvaluatedAt: string;
  latestAllocationBatchRef: string | null;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  authoritativeReadAndConfirmationPolicyRef: string;
  reservationSemantics: WaitlistOfferTruthMode;
  rankPlanVersion: typeof WAITLIST_RANK_PLAN_VERSION;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface WaitlistDeadlineEvaluationSnapshot {
  waitlistDeadlineEvaluationId: string;
  schemaVersion: typeof PHASE4_SMART_WAITLIST_SCHEMA_VERSION;
  waitlistEntryRef: string;
  bookingCaseRef: string;
  rankPlanVersion: typeof WAITLIST_RANK_PLAN_VERSION;
  deadlineAt: string;
  expectedOfferServiceMinutes: number;
  safeWaitlistUntilAt: string;
  workingMinutesRemaining: number;
  laxityMinutes: number;
  deadlineClass: WaitlistDeadlineClass;
  offerabilityState: WaitlistOfferabilityState;
  reasonCode: string;
  deadlineWarnScore: number;
  deadlineLateScore: number;
  deadlinePressure: number;
  waitMinutes: number;
  ageLift: number;
  fairnessDebt: number;
  cooldown: number;
  evaluatedAt: string;
  version: number;
}

export interface WaitlistFallbackObligationSnapshot {
  waitlistFallbackObligationId: string;
  schemaVersion: typeof PHASE4_SMART_WAITLIST_SCHEMA_VERSION;
  bookingCaseRef: string;
  waitlistEntryRef: string;
  latestDeadlineEvaluationRef: string;
  requiredFallbackRoute: WaitlistFallbackRoute;
  triggerClass: WaitlistFallbackTriggerClass;
  transferState: WaitlistFallbackTransferState;
  callbackCaseRef: string | null;
  callbackExpectationEnvelopeRef: string | null;
  hubCoordinationCaseRef: string | null;
  bookingFailureReasonCode: string | null;
  createdAt: string;
  transferredAt: string | null;
  clearedAt: string | null;
  updatedAt: string;
  version: number;
}

export interface WaitlistContinuationTruthProjectionSnapshot {
  waitlistContinuationTruthProjectionId: string;
  schemaVersion: typeof PHASE4_SMART_WAITLIST_SCHEMA_VERSION;
  bookingCaseRef: string;
  waitlistEntryRef: string;
  activeWaitlistOfferRef: string | null;
  latestDeadlineEvaluationRef: string;
  fallbackObligationRef: string;
  reservationTruthProjectionRef: string | null;
  selectedAnchorRef: string;
  patientVisibleState: WaitlistPatientVisibleState;
  windowRiskState: WaitlistWindowRiskState;
  dominantActionRef: string;
  fallbackActionRef: string | null;
  nextEvaluationAt: string;
  projectionFreshnessEnvelopeRef: string;
  generatedAt: string;
  version: number;
}

export interface WaitlistOfferScoreVectorSnapshot {
  rankPlanVersion: typeof WAITLIST_RANK_PLAN_VERSION;
  deadlineClassOrdinal: 0 | 1 | 2 | 3;
  deadlinePressure: number;
  ageLift: number;
  fairnessDebt: number;
  preferenceFit: number;
  acceptanceProbability: number;
  cooldown: number;
  matchScore: number;
  pairUtility: number;
  stablePairOrderKey: string;
}

export interface WaitlistOfferSnapshot {
  waitlistOfferId: string;
  schemaVersion: typeof PHASE4_SMART_WAITLIST_SCHEMA_VERSION;
  waitlistEntryRef: string;
  deadlineEvaluationRef: string;
  fallbackObligationRef: string;
  continuationFenceEpoch: number;
  releasedSlotRef: string;
  selectedNormalizedSlotRef: string;
  selectedCanonicalSlotIdentityRef: string;
  sourceSlotSetSnapshotRef: string | null;
  capacityUnitRef: string;
  reservationRef: string;
  reservationTruthProjectionRef: string;
  allocationBatchRef: string;
  truthMode: WaitlistOfferTruthMode;
  scoreVector: WaitlistOfferScoreVectorSnapshot;
  offerOrdinal: number;
  offerState: WaitlistOfferState;
  holdState: WaitlistReservationHoldState;
  offerExpiryAt: string;
  exclusiveUntilAt: string | null;
  sentAt: string;
  openedAt: string | null;
  respondedAt: string | null;
  selectionToken: string;
  selectionProofHash: string;
  supersededByRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface WaitlistAllocationBatchSnapshot {
  waitlistAllocationBatchId: string;
  schemaVersion: typeof PHASE4_SMART_WAITLIST_SCHEMA_VERSION;
  batchingHorizonSeconds: number;
  releasedCapacityUnitRefs: readonly string[];
  releasedSlotRefs: readonly string[];
  assignmentTupleHash: string;
  eligiblePairCount: number;
  assignedPairCount: number;
  stablePairOrder: readonly string[];
  createdAt: string;
  version: number;
}

export interface WaitlistTransitionJournalEntrySnapshot {
  waitlistTransitionJournalEntryId: string;
  waitlistEntryRef: string;
  waitlistOfferRef: string | null;
  actionScope:
    | "join"
    | "refresh_deadline"
    | "issue_offer"
    | "accept_offer"
    | "expire_offer"
    | "supersede_offer"
    | "pause"
    | "close"
    | "fallback_transfer"
    | "commit_settlement";
  previousContinuationState: WaitlistContinuationState | "none";
  nextContinuationState: WaitlistContinuationState;
  previousVisibleState: WaitlistPatientVisibleState | "none";
  nextVisibleState: WaitlistPatientVisibleState;
  reasonCodes: readonly string[];
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
  recordedAt: string;
  version: number;
}

export interface SnapshotDocument<T> {
  toSnapshot(): T;
}

class StoredSnapshotDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

type EntryActivationState = "offerable" | "non_offerable";

function entryActivationState(entry: WaitlistEntrySnapshot): EntryActivationState {
  if (entry.activeState !== "active") {
    return "non_offerable";
  }
  if (
    entry.continuationState === "accepted_pending_confirmation" ||
    entry.continuationState === "callback_transferred" ||
    entry.continuationState === "hub_transferred" ||
    entry.continuationState === "booking_failed" ||
    entry.continuationState === "closed"
  ) {
    return "non_offerable";
  }
  return "offerable";
}

function updateIndexSet(index: Map<string, Set<string>>, key: string, entryId: string, present: boolean): void {
  if (!key) {
    return;
  }
  if (present) {
    const ids = index.get(key) ?? new Set<string>();
    ids.add(entryId);
    index.set(key, ids);
    return;
  }
  const current = index.get(key);
  if (!current) {
    return;
  }
  current.delete(entryId);
  if (current.size === 0) {
    index.delete(key);
  }
}

export interface Phase4SmartWaitlistRepositories {
  getWaitlistEntry(waitlistEntryId: string): Promise<SnapshotDocument<WaitlistEntrySnapshot> | null>;
  saveWaitlistEntry(snapshot: WaitlistEntrySnapshot, options?: CompareAndSetWriteOptions): Promise<void>;
  listWaitlistEntries(): Promise<readonly SnapshotDocument<WaitlistEntrySnapshot>[]>;
  queryIndexedCandidates(input: {
    modality: string;
    siteRef: string;
    localDayKey: string;
    continuityKeys: readonly string[];
  }): Promise<readonly SnapshotDocument<WaitlistEntrySnapshot>[]>;
  getCurrentWaitlistEntryRef(bookingCaseId: string): Promise<string | null>;
  setCurrentWaitlistEntryRef(bookingCaseId: string, waitlistEntryRef: string | null): Promise<void>;

  getDeadlineEvaluation(
    waitlistDeadlineEvaluationId: string,
  ): Promise<SnapshotDocument<WaitlistDeadlineEvaluationSnapshot> | null>;
  saveDeadlineEvaluation(
    snapshot: WaitlistDeadlineEvaluationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentDeadlineEvaluationRef(waitlistEntryId: string): Promise<string | null>;
  setCurrentDeadlineEvaluationRef(
    waitlistEntryId: string,
    waitlistDeadlineEvaluationRef: string | null,
  ): Promise<void>;

  getFallbackObligation(
    waitlistFallbackObligationId: string,
  ): Promise<SnapshotDocument<WaitlistFallbackObligationSnapshot> | null>;
  saveFallbackObligation(
    snapshot: WaitlistFallbackObligationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentFallbackObligationRef(waitlistEntryId: string): Promise<string | null>;
  setCurrentFallbackObligationRef(
    waitlistEntryId: string,
    waitlistFallbackObligationRef: string | null,
  ): Promise<void>;

  getContinuationTruth(
    waitlistContinuationTruthProjectionId: string,
  ): Promise<SnapshotDocument<WaitlistContinuationTruthProjectionSnapshot> | null>;
  saveContinuationTruth(
    snapshot: WaitlistContinuationTruthProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentContinuationTruthRef(waitlistEntryId: string): Promise<string | null>;
  setCurrentContinuationTruthRef(
    waitlistEntryId: string,
    waitlistContinuationTruthRef: string | null,
  ): Promise<void>;

  getWaitlistOffer(waitlistOfferId: string): Promise<SnapshotDocument<WaitlistOfferSnapshot> | null>;
  saveWaitlistOffer(snapshot: WaitlistOfferSnapshot, options?: CompareAndSetWriteOptions): Promise<void>;
  listWaitlistOffersForEntry(
    waitlistEntryId: string,
  ): Promise<readonly SnapshotDocument<WaitlistOfferSnapshot>[]>;
  getCurrentWaitlistOfferRef(waitlistEntryId: string): Promise<string | null>;
  setCurrentWaitlistOfferRef(waitlistEntryId: string, waitlistOfferRef: string | null): Promise<void>;

  getAllocationBatch(
    waitlistAllocationBatchId: string,
  ): Promise<SnapshotDocument<WaitlistAllocationBatchSnapshot> | null>;
  saveAllocationBatch(
    snapshot: WaitlistAllocationBatchSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;

  saveTransitionJournalEntry(
    snapshot: WaitlistTransitionJournalEntrySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listTransitionJournalEntries(
    waitlistEntryId: string,
  ): Promise<readonly SnapshotDocument<WaitlistTransitionJournalEntrySnapshot>[]>;
}

export function createPhase4SmartWaitlistStore(): Phase4SmartWaitlistRepositories {
  const entries = new Map<string, WaitlistEntrySnapshot>();
  const currentEntryRefs = new Map<string, string>();
  const deadlines = new Map<string, WaitlistDeadlineEvaluationSnapshot>();
  const currentDeadlineRefs = new Map<string, string>();
  const fallbacks = new Map<string, WaitlistFallbackObligationSnapshot>();
  const currentFallbackRefs = new Map<string, string>();
  const continuations = new Map<string, WaitlistContinuationTruthProjectionSnapshot>();
  const currentContinuationRefs = new Map<string, string>();
  const offers = new Map<string, WaitlistOfferSnapshot>();
  const entryOfferRefs = new Map<string, Set<string>>();
  const currentOfferRefs = new Map<string, string>();
  const allocationBatches = new Map<string, WaitlistAllocationBatchSnapshot>();
  const journal = new Map<string, WaitlistTransitionJournalEntrySnapshot>();
  const journalByEntry = new Map<string, string[]>();
  const modalityIndex = new Map<string, Set<string>>();
  const siteIndex = new Map<string, Set<string>>();
  const dayIndex = new Map<string, Set<string>>();
  const continuityIndex = new Map<string, Set<string>>();

  function applyIndexes(snapshot: WaitlistEntrySnapshot, present: boolean): void {
    const offerable = entryActivationState(snapshot) === "offerable";
    const active = present && offerable;
    for (const key of snapshot.indexedEligibilityKeys.modalityKeys) {
      updateIndexSet(modalityIndex, key, snapshot.waitlistEntryId, active);
    }
    for (const key of snapshot.indexedEligibilityKeys.siteKeys) {
      updateIndexSet(siteIndex, key, snapshot.waitlistEntryId, active);
    }
    for (const key of snapshot.indexedEligibilityKeys.localDayKeys) {
      updateIndexSet(dayIndex, key, snapshot.waitlistEntryId, active);
    }
    for (const key of snapshot.indexedEligibilityKeys.continuityKeys) {
      updateIndexSet(continuityIndex, key, snapshot.waitlistEntryId, active);
    }
  }

  return {
    async getWaitlistEntry(waitlistEntryId) {
      const row = entries.get(waitlistEntryId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async saveWaitlistEntry(snapshot, options) {
      const current = entries.get(snapshot.waitlistEntryId);
      if (current) {
        applyIndexes(current, false);
      }
      saveWithCas(entries, snapshot.waitlistEntryId, snapshot, options);
      applyIndexes(snapshot, true);
    },
    async listWaitlistEntries() {
      return [...entries.values()].map((row) => new StoredSnapshotDocument(row));
    },
    async queryIndexedCandidates(input) {
      const modalityIds = new Set<string>();
      for (const key of [`modality:${input.modality}`, "modality:any"]) {
        for (const entryId of modalityIndex.get(key) ?? []) {
          modalityIds.add(entryId);
        }
      }
      const siteIds = new Set<string>();
      for (const key of [`site:${input.siteRef}`, "site:any"]) {
        for (const entryId of siteIndex.get(key) ?? []) {
          siteIds.add(entryId);
        }
      }
      const dayIds = new Set<string>(dayIndex.get(`day:${input.localDayKey}`) ?? []);
      const continuityIds = new Set<string>();
      const requestedContinuityKeys = input.continuityKeys.length
        ? input.continuityKeys
        : ["continuity:any"];
      for (const key of uniqueSorted([...requestedContinuityKeys, "continuity:any"])) {
        for (const entryId of continuityIndex.get(key) ?? []) {
          continuityIds.add(entryId);
        }
      }

      const matchedIds = [...modalityIds].filter(
        (entryId) => siteIds.has(entryId) && dayIds.has(entryId) && continuityIds.has(entryId),
      );
      return matchedIds
        .map((entryId) => entries.get(entryId))
        .filter((row): row is WaitlistEntrySnapshot => row !== undefined)
        .map((row) => new StoredSnapshotDocument(row));
    },
    async getCurrentWaitlistEntryRef(bookingCaseId) {
      return currentEntryRefs.get(bookingCaseId) ?? null;
    },
    async setCurrentWaitlistEntryRef(bookingCaseId, waitlistEntryRef) {
      if (waitlistEntryRef) {
        currentEntryRefs.set(bookingCaseId, waitlistEntryRef);
      } else {
        currentEntryRefs.delete(bookingCaseId);
      }
    },

    async getDeadlineEvaluation(waitlistDeadlineEvaluationId) {
      const row = deadlines.get(waitlistDeadlineEvaluationId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async saveDeadlineEvaluation(snapshot, options) {
      saveWithCas(deadlines, snapshot.waitlistDeadlineEvaluationId, snapshot, options);
    },
    async getCurrentDeadlineEvaluationRef(waitlistEntryId) {
      return currentDeadlineRefs.get(waitlistEntryId) ?? null;
    },
    async setCurrentDeadlineEvaluationRef(waitlistEntryId, waitlistDeadlineEvaluationRef) {
      if (waitlistDeadlineEvaluationRef) {
        currentDeadlineRefs.set(waitlistEntryId, waitlistDeadlineEvaluationRef);
      } else {
        currentDeadlineRefs.delete(waitlistEntryId);
      }
    },

    async getFallbackObligation(waitlistFallbackObligationId) {
      const row = fallbacks.get(waitlistFallbackObligationId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async saveFallbackObligation(snapshot, options) {
      saveWithCas(fallbacks, snapshot.waitlistFallbackObligationId, snapshot, options);
    },
    async getCurrentFallbackObligationRef(waitlistEntryId) {
      return currentFallbackRefs.get(waitlistEntryId) ?? null;
    },
    async setCurrentFallbackObligationRef(waitlistEntryId, waitlistFallbackObligationRef) {
      if (waitlistFallbackObligationRef) {
        currentFallbackRefs.set(waitlistEntryId, waitlistFallbackObligationRef);
      } else {
        currentFallbackRefs.delete(waitlistEntryId);
      }
    },

    async getContinuationTruth(waitlistContinuationTruthProjectionId) {
      const row = continuations.get(waitlistContinuationTruthProjectionId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async saveContinuationTruth(snapshot, options) {
      saveWithCas(continuations, snapshot.waitlistContinuationTruthProjectionId, snapshot, options);
    },
    async getCurrentContinuationTruthRef(waitlistEntryId) {
      return currentContinuationRefs.get(waitlistEntryId) ?? null;
    },
    async setCurrentContinuationTruthRef(waitlistEntryId, waitlistContinuationTruthRef) {
      if (waitlistContinuationTruthRef) {
        currentContinuationRefs.set(waitlistEntryId, waitlistContinuationTruthRef);
      } else {
        currentContinuationRefs.delete(waitlistEntryId);
      }
    },

    async getWaitlistOffer(waitlistOfferId) {
      const row = offers.get(waitlistOfferId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async saveWaitlistOffer(snapshot, options) {
      saveWithCas(offers, snapshot.waitlistOfferId, snapshot, options);
      const refs = entryOfferRefs.get(snapshot.waitlistEntryRef) ?? new Set<string>();
      refs.add(snapshot.waitlistOfferId);
      entryOfferRefs.set(snapshot.waitlistEntryRef, refs);
    },
    async listWaitlistOffersForEntry(waitlistEntryId) {
      return [...(entryOfferRefs.get(waitlistEntryId) ?? new Set<string>())]
        .map((offerId) => offers.get(offerId))
        .filter((row): row is WaitlistOfferSnapshot => row !== undefined)
        .sort((left, right) => compareIso(left.sentAt, right.sentAt))
        .map((row) => new StoredSnapshotDocument(row));
    },
    async getCurrentWaitlistOfferRef(waitlistEntryId) {
      return currentOfferRefs.get(waitlistEntryId) ?? null;
    },
    async setCurrentWaitlistOfferRef(waitlistEntryId, waitlistOfferRef) {
      if (waitlistOfferRef) {
        currentOfferRefs.set(waitlistEntryId, waitlistOfferRef);
      } else {
        currentOfferRefs.delete(waitlistEntryId);
      }
    },

    async getAllocationBatch(waitlistAllocationBatchId) {
      const row = allocationBatches.get(waitlistAllocationBatchId);
      return row ? new StoredSnapshotDocument(row) : null;
    },
    async saveAllocationBatch(snapshot, options) {
      saveWithCas(allocationBatches, snapshot.waitlistAllocationBatchId, snapshot, options);
    },

    async saveTransitionJournalEntry(snapshot, options) {
      saveWithCas(journal, snapshot.waitlistTransitionJournalEntryId, snapshot, options);
      const entryRefs = journalByEntry.get(snapshot.waitlistEntryRef) ?? [];
      journalByEntry.set(snapshot.waitlistEntryRef, [...entryRefs, snapshot.waitlistTransitionJournalEntryId]);
    },
    async listTransitionJournalEntries(waitlistEntryId) {
      return (journalByEntry.get(waitlistEntryId) ?? [])
        .map((journalEntryId) => journal.get(journalEntryId))
        .filter((row): row is WaitlistTransitionJournalEntrySnapshot => row !== undefined)
        .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
        .map((row) => new StoredSnapshotDocument(row));
    },
  };
}

export interface WaitlistRankPlanSnapshot {
  thetaWaitCriticalMinutes: number;
  thetaWaitWarnMinutes: number;
  tauDeadlineMinutes: number;
  tauWaitLateMinutes: number;
  hWaitLateMinutes: number;
  tauWaitlistMinutes: number;
  ageWaitCapMinutes: number;
  fairnessFloorMinutes: number;
  fairnessHorizonMinutes: number;
  alphaDeadline: number;
  alphaAge: number;
  alphaFair: number;
  alphaPref: number;
  alphaCooldown: number;
  betaAge: number;
  betaFair: number;
  betaPref: number;
  betaAccept: number;
  betaCooldown: number;
  cooldownWindowMinutes: number;
  batchingHorizonSeconds: number;
}

export function defaultWaitlistRankPlan(): WaitlistRankPlanSnapshot {
  return {
    thetaWaitCriticalMinutes: 60,
    thetaWaitWarnMinutes: 180,
    tauDeadlineMinutes: 45,
    tauWaitLateMinutes: 60,
    hWaitLateMinutes: 480,
    tauWaitlistMinutes: 720,
    ageWaitCapMinutes: 4_320,
    fairnessFloorMinutes: 120,
    fairnessHorizonMinutes: 1_440,
    alphaDeadline: 0.35,
    alphaAge: 0.25,
    alphaFair: 0.2,
    alphaPref: 0.2,
    alphaCooldown: 0.15,
    betaAge: 0.3,
    betaFair: 0.25,
    betaPref: 0.35,
    betaAccept: 0,
    betaCooldown: 0.1,
    cooldownWindowMinutes: 120,
    batchingHorizonSeconds: 45,
  };
}

export interface CreateOrRefreshWaitlistEntryInput {
  bookingCaseId: string;
  patientRef: string;
  requestRef: string;
  requestLineageRef: string;
  routeFamilyRef: string;
  selectionAudience: "patient" | "staff";
  selectedAnchorRef: string;
  preferenceEnvelope: WaitlistPreferenceEnvelopeSnapshot;
  deadlineAt: string;
  expectedOfferServiceMinutes: number;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  authoritativeReadAndConfirmationPolicyRef: string;
  reservationSemantics: WaitlistOfferTruthMode;
  joinedAt: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  subjectRef: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface ReleasedCapacityInput {
  releasedSlotRef: string;
  selectedNormalizedSlotRef: string;
  selectedCanonicalSlotIdentityRef: string;
  sourceSlotSetSnapshotRef?: string | null;
  capacityUnitRef: string;
  supplierRef: string;
  scheduleOwnerRef: string;
  inventoryLineageRef: string;
  slotStartAt: string;
  slotEndAt: string;
  slotStartAtEpoch: number;
  slotEndAtEpoch: number;
  localDayKey: string;
  siteRef: string;
  modality: string;
  locationRef: string;
  practitionerRef: string;
  serviceRef: string;
  continuityScore: number;
  travelMinutes?: number | null;
  authoritativeReleaseState: "authoritative_cancelled" | "authoritative_released";
  releaseReasonCode: string;
}

export interface ProcessReleasedCapacityInput {
  releasedCapacity: readonly ReleasedCapacityInput[];
  processedAt: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  subjectRef: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface PlannedWaitlistOfferSnapshot {
  waitlistOfferId: string;
  waitlistEntryRef: string;
  deadlineEvaluationRef: string;
  fallbackObligationRef: string;
  continuationFenceEpoch: number;
  releasedCapacity: ReleasedCapacityInput;
  allocationBatchRef: string;
  truthMode: WaitlistOfferTruthMode;
  scoreVector: WaitlistOfferScoreVectorSnapshot;
  offerOrdinal: number;
  offerExpiryAt: string;
  exclusiveUntilAt: string | null;
  selectionToken: string;
  selectionProofHash: string;
}

export interface IssuePlannedWaitlistOfferInput {
  plannedOffer: PlannedWaitlistOfferSnapshot;
  reservationRef: string;
  reservationTruthProjectionRef: string;
  holdState: WaitlistReservationHoldState;
  sentAt: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface AcceptWaitlistOfferInput {
  waitlistOfferId: string;
  acceptedAt: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface ExpireWaitlistOfferInput {
  waitlistOfferId: string;
  expiredAt: string;
  reasonCode: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface SupersedeWaitlistOfferInput {
  waitlistOfferId: string;
  supersededAt: string;
  supersededByRef: string;
  reasonCode: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface RefreshFallbackObligationInput {
  waitlistEntryId: string;
  evaluatedAt: string;
  noEligibleSupply?: boolean;
  staleCapacityTruth?: boolean;
  policyCutoff?: boolean;
  callbackAllowed?: boolean;
  hubAllowed?: boolean;
  callbackCaseRef?: string | null;
  callbackExpectationEnvelopeRef?: string | null;
  hubCoordinationCaseRef?: string | null;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface PauseWaitlistEntryInput {
  waitlistEntryId: string;
  pausedAt: string;
  reasonCode: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface CloseWaitlistEntryInput {
  waitlistEntryId: string;
  closedAt: string;
  reasonCode: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface SettleWaitlistCommitOutcomeInput {
  waitlistOfferId: string;
  settledAt: string;
  outcome: "booked" | "confirmation_pending" | "reconciliation_required" | "failed" | "expired";
  reasonCodes?: readonly string[];
  callbackCaseRef?: string | null;
  callbackExpectationEnvelopeRef?: string | null;
  hubCoordinationCaseRef?: string | null;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface WaitlistBundle {
  entry: WaitlistEntrySnapshot;
  deadlineEvaluation: WaitlistDeadlineEvaluationSnapshot;
  fallbackObligation: WaitlistFallbackObligationSnapshot;
  continuationTruth: WaitlistContinuationTruthProjectionSnapshot;
  activeOffer: WaitlistOfferSnapshot | null;
  offers: readonly WaitlistOfferSnapshot[];
  journal: readonly WaitlistTransitionJournalEntrySnapshot[];
}

export interface WaitlistEntryMutationResult {
  entry: WaitlistEntrySnapshot;
  deadlineEvaluation: WaitlistDeadlineEvaluationSnapshot;
  fallbackObligation: WaitlistFallbackObligationSnapshot;
  continuationTruth: WaitlistContinuationTruthProjectionSnapshot;
  activeOffer: WaitlistOfferSnapshot | null;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface WaitlistAssignmentBatchResult {
  allocationBatch: WaitlistAllocationBatchSnapshot;
  plannedOffers: readonly PlannedWaitlistOfferSnapshot[];
  updatedBundles: readonly WaitlistEntryMutationResult[];
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface Phase4SmartWaitlistService {
  repositories: Phase4SmartWaitlistRepositories;
  createOrRefreshWaitlistEntry(
    input: CreateOrRefreshWaitlistEntryInput,
  ): Promise<WaitlistEntryMutationResult>;
  processReleasedCapacity(input: ProcessReleasedCapacityInput): Promise<WaitlistAssignmentBatchResult>;
  issuePlannedWaitlistOffer(input: IssuePlannedWaitlistOfferInput): Promise<WaitlistEntryMutationResult>;
  acceptWaitlistOffer(input: AcceptWaitlistOfferInput): Promise<WaitlistEntryMutationResult>;
  expireWaitlistOffer(input: ExpireWaitlistOfferInput): Promise<WaitlistEntryMutationResult>;
  supersedeWaitlistOffer(input: SupersedeWaitlistOfferInput): Promise<WaitlistEntryMutationResult>;
  refreshFallbackObligation(input: RefreshFallbackObligationInput): Promise<WaitlistEntryMutationResult>;
  pauseWaitlistEntry(input: PauseWaitlistEntryInput): Promise<WaitlistEntryMutationResult>;
  closeWaitlistEntry(input: CloseWaitlistEntryInput): Promise<WaitlistEntryMutationResult>;
  settleWaitlistCommitOutcome(input: SettleWaitlistCommitOutcomeInput): Promise<WaitlistEntryMutationResult>;
  queryCurrentWaitlist(bookingCaseId: string): Promise<WaitlistBundle | null>;
  queryWaitlistOffer(waitlistOfferId: string): Promise<WaitlistOfferSnapshot | null>;
}

function defaultPayloadArtifactRef(entryId: string, scope: string): string {
  return `artifact://booking/waitlist/${entryId}/${scope}`;
}

function defaultEdgeCorrelationId(entryId: string, scope: string): string {
  return `${entryId}::${scope}`;
}

function deadlineClassOrdinal(value: WaitlistDeadlineClass): 0 | 1 | 2 | 3 {
  return value === "expired" ? 3 : value === "critical" ? 2 : value === "warn" ? 1 : 0;
}

function riskStateFromEvaluation(
  evaluation: WaitlistDeadlineEvaluationSnapshot,
): WaitlistWindowRiskState {
  return evaluation.offerabilityState === "overdue"
    ? "overdue"
    : evaluation.offerabilityState === "fallback_required"
      ? "fallback_due"
      : evaluation.offerabilityState === "at_risk"
        ? "at_risk"
        : "on_track";
}

function buildWaitlistEntryEvents(
  eventType: string,
  entry: WaitlistEntrySnapshot,
  extras: Record<string, unknown>,
): FoundationEventEnvelope<object> {
  return makeFoundationEvent(eventType, {
    governingRef: entry.waitlistEntryId,
    bookingCaseId: entry.bookingCaseId,
    waitlistEntryId: entry.waitlistEntryId,
    activeState: entry.activeState,
    continuationState: entry.continuationState,
    ...extras,
  });
}

export function createPhase4SmartWaitlistService(input?: {
  repositories?: Phase4SmartWaitlistRepositories;
  idGenerator?: BackboneIdGenerator;
  rankPlan?: WaitlistRankPlanSnapshot;
}): Phase4SmartWaitlistService {
  const repositories = input?.repositories ?? createPhase4SmartWaitlistStore();
  const rankPlan = input?.rankPlan ?? defaultWaitlistRankPlan();
  const idGenerator =
    input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase4-smart-waitlist");

  function nextId(kind: string): string {
    return (idGenerator.nextId as unknown as (value: string) => string)(kind);
  }

  async function getBundleFromEntry(entry: WaitlistEntrySnapshot): Promise<WaitlistBundle> {
    const deadlineEvaluationDocument = await repositories.getDeadlineEvaluation(
      entry.latestDeadlineEvaluationRef,
    );
    const fallbackDocument = await repositories.getFallbackObligation(entry.activeFallbackObligationRef);
    const continuationDocument = await repositories.getContinuationTruth(
      entry.continuationTruthProjectionRef,
    );
    invariant(
      deadlineEvaluationDocument && fallbackDocument && continuationDocument,
      "WAITLIST_BUNDLE_INCOMPLETE",
      `Waitlist bundle for ${entry.waitlistEntryId} is incomplete.`,
    );
    const activeOfferRef = await repositories.getCurrentWaitlistOfferRef(entry.waitlistEntryId);
    const activeOfferDocument = activeOfferRef
      ? await repositories.getWaitlistOffer(activeOfferRef)
      : null;
    const offers = (await repositories.listWaitlistOffersForEntry(entry.waitlistEntryId)).map((row) =>
      row.toSnapshot(),
    );
    const journal = (await repositories.listTransitionJournalEntries(entry.waitlistEntryId)).map((row) =>
      row.toSnapshot(),
    );
    return {
      entry,
      deadlineEvaluation: deadlineEvaluationDocument.toSnapshot(),
      fallbackObligation: fallbackDocument.toSnapshot(),
      continuationTruth: continuationDocument.toSnapshot(),
      activeOffer: activeOfferDocument?.toSnapshot() ?? null,
      offers,
      journal,
    };
  }

  function buildPriorityKey(entryId: string, deadlineAt: string, joinedAt: string): string {
    return `${deadlineAt}::${joinedAt}::${entryId}`;
  }

  function buildEligibilityKeys(
    envelope: WaitlistPreferenceEnvelopeSnapshot,
  ): WaitlistEligibilityIndexKeysSnapshot {
    const modalityKeys =
      envelope.modality === "either"
        ? ["modality:any"]
        : [`modality:${envelope.modality}`, "modality:any"];
    const siteKeys =
      envelope.siteRefs.length === 0
        ? ["site:any"]
        : uniqueSorted([...envelope.siteRefs.map((siteRef) => `site:${siteRef}`), "site:any"]);
    const localDayKeys = enumerateLocalDayKeys(
      envelope.timeframeEarliest,
      envelope.timeframeLatest,
      envelope.timeZone,
    ).map((dayKey) => `day:${dayKey}`);
    const continuityKeys = uniqueSorted([
      "continuity:any",
      `continuity:${envelope.continuityPreference}`,
    ]);
    return {
      modalityKeys,
      siteKeys,
      localDayKeys,
      continuityKeys,
    };
  }

  async function latestTerminalOffer(entryId: string): Promise<WaitlistOfferSnapshot | null> {
    const offers = (await repositories.listWaitlistOffersForEntry(entryId)).map((row) => row.toSnapshot());
    const terminal = offers
      .filter((offer) =>
        offer.offerState === "expired" ||
        offer.offerState === "superseded" ||
        offer.offerState === "lost_race" ||
        offer.offerState === "commit_failed" ||
        offer.offerState === "closed",
      )
      .sort((left, right) => compareIso(right.updatedAt, left.updatedAt));
    return terminal[0] ?? null;
  }

  async function evaluateDeadline(
    entry: WaitlistEntrySnapshot,
    evaluatedAt: string,
    reasonHint?: string,
  ): Promise<WaitlistDeadlineEvaluationSnapshot> {
    const waitMinutes = Math.max(0, elapsedMinutes(entry.joinedAt, evaluatedAt));
    const workingMinutesRemaining = elapsedMinutes(evaluatedAt, entry.deadlineAt);
    const laxityMinutes = workingMinutesRemaining - entry.expectedOfferServiceMinutes;
    const deadlineClass: WaitlistDeadlineClass =
      laxityMinutes <= 0
        ? workingMinutesRemaining < 0
          ? "expired"
          : "critical"
        : laxityMinutes <= rankPlan.thetaWaitCriticalMinutes
          ? "critical"
          : laxityMinutes <= rankPlan.thetaWaitWarnMinutes
            ? "warn"
            : "on_track";
    const deadlineWarnScore =
      1 /
      (1 +
        Math.exp((laxityMinutes - rankPlan.thetaWaitWarnMinutes) / rankPlan.tauDeadlineMinutes));
    const deadlineLateScore =
      laxityMinutes >= 0
        ? 0
        : Math.min(
            1,
            Math.log(1 + Math.max(0, -laxityMinutes) / rankPlan.tauWaitLateMinutes) /
              Math.log(1 + rankPlan.hWaitLateMinutes / rankPlan.tauWaitLateMinutes),
          );
    const deadlinePressure =
      0.55 * deadlineWarnScore +
      0.45 * deadlineLateScore;
    const ageLift = Math.min(
      1,
      Math.log(1 + waitMinutes / rankPlan.tauWaitlistMinutes) /
        Math.log(1 + rankPlan.ageWaitCapMinutes / rankPlan.tauWaitlistMinutes),
    );
    const fairnessDebt = Math.min(
      1,
      Math.max(0, waitMinutes - rankPlan.fairnessFloorMinutes) / rankPlan.fairnessHorizonMinutes,
    );
    const terminalOffer = await latestTerminalOffer(entry.waitlistEntryId);
    const cooldown =
      terminalOffer &&
      elapsedMinutes(terminalOffer.updatedAt, evaluatedAt) < rankPlan.cooldownWindowMinutes
        ? 1
        : 0;
    const safeWaitlistUntilAt = subtractMinutes(entry.deadlineAt, entry.expectedOfferServiceMinutes);
    const offerabilityState: WaitlistOfferabilityState =
      workingMinutesRemaining < 0
        ? "overdue"
        : compareIso(evaluatedAt, safeWaitlistUntilAt) > 0
          ? "fallback_required"
          : deadlineClass === "critical"
            ? "at_risk"
            : "waitlist_safe";
    const reasonCode =
      reasonHint ??
      (offerabilityState === "overdue"
        ? "waitlist_deadline_missed"
        : offerabilityState === "fallback_required"
          ? "waitlist_safe_window_elapsed"
          : offerabilityState === "at_risk"
            ? "waitlist_laxity_critical"
            : "waitlist_on_track");
    return {
      waitlistDeadlineEvaluationId: normalizeRecordId("waitlist_deadline_eval", {
        entryId: entry.waitlistEntryId,
        evaluatedAt,
        offerabilityState,
      }),
      schemaVersion: PHASE4_SMART_WAITLIST_SCHEMA_VERSION,
      waitlistEntryRef: entry.waitlistEntryId,
      bookingCaseRef: entry.bookingCaseId,
      rankPlanVersion: WAITLIST_RANK_PLAN_VERSION,
      deadlineAt: entry.deadlineAt,
      expectedOfferServiceMinutes: entry.expectedOfferServiceMinutes,
      safeWaitlistUntilAt,
      workingMinutesRemaining,
      laxityMinutes,
      deadlineClass,
      offerabilityState,
      reasonCode,
      deadlineWarnScore,
      deadlineLateScore,
      deadlinePressure,
      waitMinutes,
      ageLift,
      fairnessDebt,
      cooldown,
      evaluatedAt,
      version: 1,
    };
  }

  function chooseFallbackRoute(input: {
    evaluation: WaitlistDeadlineEvaluationSnapshot;
    noEligibleSupply?: boolean;
    staleCapacityTruth?: boolean;
    policyCutoff?: boolean;
    callbackAllowed?: boolean;
    hubAllowed?: boolean;
  }): {
    requiredFallbackRoute: WaitlistFallbackRoute;
    triggerClass: WaitlistFallbackTriggerClass;
  } {
    const callbackAllowed = input.callbackAllowed ?? true;
    const hubAllowed = input.hubAllowed ?? true;
    if (input.staleCapacityTruth) {
      return callbackAllowed
        ? { requiredFallbackRoute: "callback", triggerClass: "stale_capacity_truth" }
        : hubAllowed
          ? { requiredFallbackRoute: "hub", triggerClass: "stale_capacity_truth" }
          : { requiredFallbackRoute: "booking_failed", triggerClass: "stale_capacity_truth" };
    }
    if (input.policyCutoff) {
      return callbackAllowed
        ? { requiredFallbackRoute: "callback", triggerClass: "policy_cutoff" }
        : hubAllowed
          ? { requiredFallbackRoute: "hub", triggerClass: "policy_cutoff" }
          : { requiredFallbackRoute: "booking_failed", triggerClass: "policy_cutoff" };
    }
    if (input.evaluation.offerabilityState === "overdue") {
      return callbackAllowed
        ? { requiredFallbackRoute: "callback", triggerClass: "no_safe_laxity" }
        : hubAllowed
          ? { requiredFallbackRoute: "hub", triggerClass: "no_safe_laxity" }
          : { requiredFallbackRoute: "booking_failed", triggerClass: "no_safe_laxity" };
    }
    if (input.evaluation.offerabilityState === "fallback_required") {
      return callbackAllowed
        ? { requiredFallbackRoute: "callback", triggerClass: "no_safe_laxity" }
        : hubAllowed
          ? { requiredFallbackRoute: "hub", triggerClass: "no_safe_laxity" }
          : { requiredFallbackRoute: "booking_failed", triggerClass: "no_safe_laxity" };
    }
    if (input.noEligibleSupply) {
      return callbackAllowed
        ? { requiredFallbackRoute: "callback", triggerClass: "no_eligible_supply" }
        : hubAllowed
          ? { requiredFallbackRoute: "hub", triggerClass: "no_eligible_supply" }
          : { requiredFallbackRoute: "booking_failed", triggerClass: "no_eligible_supply" };
    }
    return {
      requiredFallbackRoute: "stay_local_waitlist",
      triggerClass: "none",
    };
  }

function continuationStateFromFallback(
  entry: WaitlistEntrySnapshot,
  fallback: WaitlistFallbackObligationSnapshot,
  activeOffer: WaitlistOfferSnapshot | null,
): WaitlistContinuationState {
  if (entry.activeState === "closed" || entry.continuationState === "closed") {
    return "closed";
  }
  if (entry.activeState === "transferred") {
    return fallback.requiredFallbackRoute === "hub" ? "hub_transferred" : "callback_transferred";
  }
  if (activeOffer && (activeOffer.offerState === "sent" || activeOffer.offerState === "opened")) {
    return "offer_pending";
  }
    if (activeOffer?.offerState === "accepted") {
      return "accepted_pending_confirmation";
    }
    if (fallback.requiredFallbackRoute === "callback") {
      return fallback.transferState === "transferred"
        ? "callback_transferred"
        : "fallback_pending";
    }
    if (fallback.requiredFallbackRoute === "hub") {
      return fallback.transferState === "transferred"
        ? "hub_transferred"
        : "fallback_pending";
    }
    if (fallback.requiredFallbackRoute === "booking_failed") {
      return "booking_failed";
    }
    return "waiting_local_supply";
  }

function visibleStateFromState(
  continuationState: WaitlistContinuationState,
  evaluation: WaitlistDeadlineEvaluationSnapshot,
  activeOffer: WaitlistOfferSnapshot | null,
): WaitlistPatientVisibleState {
    if (continuationState === "callback_transferred" || continuationState === "fallback_pending") {
      return "callback_expected";
    }
    if (continuationState === "hub_transferred") {
      return "hub_review_pending";
    }
    if (continuationState === "booking_failed") {
      return "expired";
    }
    if (continuationState === "closed") {
      return "closed";
    }
    if (continuationState === "accepted_pending_confirmation") {
      return "accepted_pending_booking";
    }
    if (activeOffer && activeOffer.offerState !== "expired" && activeOffer.offerState !== "superseded") {
      return "offer_available";
    }
    return evaluation.offerabilityState === "overdue" ? "expired" : "waiting_for_offer";
  }

  async function refreshBundle(
    entry: WaitlistEntrySnapshot,
    evaluatedAt: string,
    options?: {
      noEligibleSupply?: boolean;
      staleCapacityTruth?: boolean;
      policyCutoff?: boolean;
      callbackAllowed?: boolean;
      hubAllowed?: boolean;
      activeOfferOverride?: WaitlistOfferSnapshot | null;
      reasonHint?: string;
      commandActionRecordRef?: string;
      commandSettlementRecordRef?: string;
      payloadArtifactRef?: string | null;
      edgeCorrelationId?: string | null;
      actionScope?: WaitlistTransitionJournalEntrySnapshot["actionScope"];
      transferRefs?: {
        callbackCaseRef?: string | null;
        callbackExpectationEnvelopeRef?: string | null;
        hubCoordinationCaseRef?: string | null;
      };
    },
  ): Promise<WaitlistEntryMutationResult> {
    const currentDeadlineRef = await repositories.getCurrentDeadlineEvaluationRef(entry.waitlistEntryId);
    const currentDeadline = currentDeadlineRef
      ? (await repositories.getDeadlineEvaluation(currentDeadlineRef))?.toSnapshot() ?? null
      : null;
    const deadlineEvaluationBase = await evaluateDeadline(entry, evaluatedAt, options?.reasonHint);
    const deadlineEvaluation: WaitlistDeadlineEvaluationSnapshot = {
      ...deadlineEvaluationBase,
      waitlistDeadlineEvaluationId:
        currentDeadline?.waitlistDeadlineEvaluationId ?? deadlineEvaluationBase.waitlistDeadlineEvaluationId,
      version: (currentDeadline?.version ?? 0) + 1,
    };
    await repositories.saveDeadlineEvaluation(
      deadlineEvaluation,
      currentDeadline ? { expectedVersion: currentDeadline.version } : undefined,
    );
    await repositories.setCurrentDeadlineEvaluationRef(
      entry.waitlistEntryId,
      deadlineEvaluation.waitlistDeadlineEvaluationId,
    );

    const fallbackDecision = chooseFallbackRoute({
      evaluation: deadlineEvaluation,
      noEligibleSupply: options?.noEligibleSupply,
      staleCapacityTruth: options?.staleCapacityTruth,
      policyCutoff: options?.policyCutoff,
      callbackAllowed: options?.callbackAllowed,
      hubAllowed: options?.hubAllowed,
    });
    const currentFallbackRef = await repositories.getCurrentFallbackObligationRef(entry.waitlistEntryId);
    const currentFallback = currentFallbackRef
      ? (await repositories.getFallbackObligation(currentFallbackRef))?.toSnapshot() ?? null
      : null;
    const fallback: WaitlistFallbackObligationSnapshot = {
      waitlistFallbackObligationId:
        currentFallback?.waitlistFallbackObligationId ??
        normalizeRecordId("waitlist_fallback", {
          entryId: entry.waitlistEntryId,
          createdAt: evaluatedAt,
        }),
      schemaVersion: PHASE4_SMART_WAITLIST_SCHEMA_VERSION,
      bookingCaseRef: entry.bookingCaseId,
      waitlistEntryRef: entry.waitlistEntryId,
      latestDeadlineEvaluationRef: deadlineEvaluation.waitlistDeadlineEvaluationId,
      requiredFallbackRoute: fallbackDecision.requiredFallbackRoute,
      triggerClass: fallbackDecision.triggerClass,
      transferState:
        fallbackDecision.requiredFallbackRoute === "stay_local_waitlist"
          ? "monitoring"
          : options?.transferRefs
            ? "transferred"
            : "armed",
      callbackCaseRef:
        optionalRef(options?.transferRefs?.callbackCaseRef) ?? currentFallback?.callbackCaseRef ?? null,
      callbackExpectationEnvelopeRef:
        optionalRef(options?.transferRefs?.callbackExpectationEnvelopeRef) ??
        currentFallback?.callbackExpectationEnvelopeRef ??
        null,
      hubCoordinationCaseRef:
        optionalRef(options?.transferRefs?.hubCoordinationCaseRef) ??
        currentFallback?.hubCoordinationCaseRef ??
        null,
      bookingFailureReasonCode:
        fallbackDecision.requiredFallbackRoute === "booking_failed" ? fallbackDecision.triggerClass : null,
      createdAt: currentFallback?.createdAt ?? evaluatedAt,
      transferredAt:
        options?.transferRefs && fallbackDecision.requiredFallbackRoute !== "stay_local_waitlist"
          ? evaluatedAt
          : currentFallback?.transferredAt ?? null,
      clearedAt:
        fallbackDecision.requiredFallbackRoute === "stay_local_waitlist"
          ? null
          : currentFallback?.clearedAt ?? null,
      updatedAt: evaluatedAt,
      version: (currentFallback?.version ?? 0) + 1,
    };
    await repositories.saveFallbackObligation(
      fallback,
      currentFallback ? { expectedVersion: currentFallback.version } : undefined,
    );
    await repositories.setCurrentFallbackObligationRef(entry.waitlistEntryId, fallback.waitlistFallbackObligationId);

    const activeOffer =
      options?.activeOfferOverride ??
      ((await repositories.getCurrentWaitlistOfferRef(entry.waitlistEntryId)) &&
      (await repositories.getWaitlistOffer(
        requireRef(await repositories.getCurrentWaitlistOfferRef(entry.waitlistEntryId), "currentWaitlistOfferRef"),
      ))
        ? (
            await repositories.getWaitlistOffer(
              requireRef(await repositories.getCurrentWaitlistOfferRef(entry.waitlistEntryId), "currentWaitlistOfferRef"),
            )
          )?.toSnapshot() ?? null
        : null);
    const nextContinuationState = continuationStateFromFallback(entry, fallback, activeOffer);
    const nextVisibleState = visibleStateFromState(nextContinuationState, deadlineEvaluation, activeOffer);

    const currentContinuationRef = await repositories.getCurrentContinuationTruthRef(entry.waitlistEntryId);
    const currentContinuation = currentContinuationRef
      ? (await repositories.getContinuationTruth(currentContinuationRef))?.toSnapshot() ?? null
      : null;
    const continuationProjection: WaitlistContinuationTruthProjectionSnapshot = {
      waitlistContinuationTruthProjectionId:
        currentContinuation?.waitlistContinuationTruthProjectionId ??
        normalizeRecordId("waitlist_continuation", {
          entryId: entry.waitlistEntryId,
          generatedAt: evaluatedAt,
          nextContinuationState,
          nextVisibleState,
          fallbackRef: fallback.waitlistFallbackObligationId,
        }),
      schemaVersion: PHASE4_SMART_WAITLIST_SCHEMA_VERSION,
      bookingCaseRef: entry.bookingCaseId,
      waitlistEntryRef: entry.waitlistEntryId,
      activeWaitlistOfferRef: activeOffer?.waitlistOfferId ?? null,
      latestDeadlineEvaluationRef: deadlineEvaluation.waitlistDeadlineEvaluationId,
      fallbackObligationRef: fallback.waitlistFallbackObligationId,
      reservationTruthProjectionRef: activeOffer?.reservationTruthProjectionRef ?? null,
      selectedAnchorRef: entry.selectedAnchorRef,
      patientVisibleState: nextVisibleState,
      windowRiskState: riskStateFromEvaluation(deadlineEvaluation),
      dominantActionRef:
        nextVisibleState === "offer_available"
          ? "waitlist_accept_offer"
          : nextVisibleState === "callback_expected"
            ? "waitlist_callback_fallback"
            : nextVisibleState === "hub_review_pending"
              ? "waitlist_hub_review"
              : nextVisibleState === "accepted_pending_booking"
                ? "booking_confirmation_pending"
                : "waitlist_wait",
      fallbackActionRef:
        fallback.requiredFallbackRoute === "stay_local_waitlist"
          ? null
          : fallback.requiredFallbackRoute === "callback"
            ? "waitlist_callback_fallback"
            : fallback.requiredFallbackRoute === "hub"
              ? "waitlist_hub_review"
              : "waitlist_booking_failed",
      nextEvaluationAt:
        activeOffer && (activeOffer.offerState === "sent" || activeOffer.offerState === "opened")
          ? activeOffer.offerExpiryAt
          : deadlineEvaluation.safeWaitlistUntilAt,
      projectionFreshnessEnvelopeRef: sha256({
        deadlineEvaluationRef: deadlineEvaluation.waitlistDeadlineEvaluationId,
        fallbackRef: fallback.waitlistFallbackObligationId,
        activeOfferRef: activeOffer?.waitlistOfferId ?? null,
        patientVisibleState: nextVisibleState,
        windowRiskState: riskStateFromEvaluation(deadlineEvaluation),
      }),
      generatedAt: evaluatedAt,
      version: (currentContinuation?.version ?? 0) + 1,
    };
    await repositories.saveContinuationTruth(
      continuationProjection,
      currentContinuation ? { expectedVersion: currentContinuation.version } : undefined,
    );
    await repositories.setCurrentContinuationTruthRef(
      entry.waitlistEntryId,
      continuationProjection.waitlistContinuationTruthProjectionId,
    );

    const updatedEntry: WaitlistEntrySnapshot = {
      ...entry,
      continuationState: nextContinuationState,
      activeOfferRef:
        activeOffer &&
        (activeOffer.offerState === "sent" ||
          activeOffer.offerState === "opened" ||
          activeOffer.offerState === "accepted")
          ? activeOffer.waitlistOfferId
          : null,
      latestDeadlineEvaluationRef: deadlineEvaluation.waitlistDeadlineEvaluationId,
      activeFallbackObligationRef: fallback.waitlistFallbackObligationId,
      continuationTruthProjectionRef: continuationProjection.waitlistContinuationTruthProjectionId,
      safeWaitlistUntilAt: deadlineEvaluation.safeWaitlistUntilAt,
      lastEvaluatedAt: evaluatedAt,
      updatedAt: evaluatedAt,
      version: entry.version + 1,
    };
    await repositories.saveWaitlistEntry(updatedEntry, { expectedVersion: entry.version });

    if (updatedEntry.activeOfferRef === null) {
      await repositories.setCurrentWaitlistOfferRef(updatedEntry.waitlistEntryId, null);
    }

    if (options?.actionScope) {
      const currentJournal = await repositories.listTransitionJournalEntries(entry.waitlistEntryId);
      const priorContinuationDocument = entry.continuationTruthProjectionRef.startsWith(
        "waitlist_continuation_placeholder",
      )
        ? null
        : await repositories.getContinuationTruth(entry.continuationTruthProjectionRef);
      const previousVisibleState =
        priorContinuationDocument?.toSnapshot().patientVisibleState ?? "waiting_for_offer";
      await repositories.saveTransitionJournalEntry({
        waitlistTransitionJournalEntryId: normalizeRecordId("waitlist_transition", {
          entryId: updatedEntry.waitlistEntryId,
          actionScope: options.actionScope,
          recordedAt: evaluatedAt,
        }),
        waitlistEntryRef: updatedEntry.waitlistEntryId,
        waitlistOfferRef: activeOffer?.waitlistOfferId ?? null,
        actionScope: options.actionScope,
        previousContinuationState: entry.continuationState,
        nextContinuationState: updatedEntry.continuationState,
        previousVisibleState,
        nextVisibleState,
        reasonCodes: uniqueSorted([
          deadlineEvaluation.reasonCode,
          fallback.triggerClass,
          fallback.requiredFallbackRoute,
        ]),
        commandActionRecordRef:
          optionalRef(options.commandActionRecordRef) ?? `${updatedEntry.waitlistEntryId}::refresh`,
        commandSettlementRecordRef:
          optionalRef(options.commandSettlementRecordRef) ?? `${updatedEntry.waitlistEntryId}::refresh`,
        payloadArtifactRef:
          optionalRef(options.payloadArtifactRef) ??
          defaultPayloadArtifactRef(updatedEntry.waitlistEntryId, options.actionScope),
        edgeCorrelationId:
          optionalRef(options.edgeCorrelationId) ??
          defaultEdgeCorrelationId(updatedEntry.waitlistEntryId, options.actionScope),
        recordedAt: evaluatedAt,
        version: currentJournal.length + 1,
      });
    }

    return {
      entry: updatedEntry,
      deadlineEvaluation,
      fallbackObligation: fallback,
      continuationTruth: continuationProjection,
      activeOffer,
      emittedEvents: [],
    };
  }

  function buildPreferenceFit(entry: WaitlistEntrySnapshot, capacity: ReleasedCapacityInput): number {
    const siteFit =
      entry.preferenceEnvelope.siteRefs.length === 0 ||
      entry.preferenceEnvelope.siteRefs.includes(capacity.siteRef)
        ? 1
        : 0;
    const modalityFit =
      entry.preferenceEnvelope.modality === "either" ||
      entry.preferenceEnvelope.modality === capacity.modality
        ? 1
        : 0;
    const travelFit =
      capacity.travelMinutes === null ||
      capacity.travelMinutes === undefined ||
      capacity.travelMinutes <= entry.preferenceEnvelope.maxTravelMinutes
        ? 1
        : 0;
    const continuityFit =
      entry.preferenceEnvelope.continuityPreference === "no_preference"
        ? 1
        : Math.max(0, Math.min(1, capacity.continuityScore));
    return (siteFit + modalityFit + travelFit + continuityFit) / 4;
  }

  function computeScoreVector(input: {
    entry: WaitlistEntrySnapshot;
    evaluation: WaitlistDeadlineEvaluationSnapshot;
    capacity: ReleasedCapacityInput;
  }): WaitlistOfferScoreVectorSnapshot {
    const preferenceFit = buildPreferenceFit(input.entry, input.capacity);
    const acceptanceProbability = 0;
    const matchScore =
      rankPlan.alphaDeadline * input.evaluation.deadlinePressure +
      rankPlan.alphaAge * input.evaluation.ageLift +
      rankPlan.alphaFair * input.evaluation.fairnessDebt +
      rankPlan.alphaPref * preferenceFit -
      rankPlan.alphaCooldown * input.evaluation.cooldown;
    const pairUtility =
      rankPlan.betaAge * input.evaluation.ageLift +
      rankPlan.betaFair * input.evaluation.fairnessDebt +
      rankPlan.betaPref * preferenceFit +
      rankPlan.betaAccept * acceptanceProbability -
      rankPlan.betaCooldown * input.evaluation.cooldown;
    return {
      rankPlanVersion: WAITLIST_RANK_PLAN_VERSION,
      deadlineClassOrdinal: deadlineClassOrdinal(input.evaluation.deadlineClass),
      deadlinePressure: input.evaluation.deadlinePressure,
      ageLift: input.evaluation.ageLift,
      fairnessDebt: input.evaluation.fairnessDebt,
      preferenceFit,
      acceptanceProbability,
      cooldown: input.evaluation.cooldown,
      matchScore,
      pairUtility,
      stablePairOrderKey: [
        String(deadlineClassOrdinal(input.evaluation.deadlineClass)).padStart(2, "0"),
        matchScore.toFixed(6),
        pairUtility.toFixed(6),
        input.entry.joinedAt,
        input.entry.waitlistEntryId,
        input.capacity.capacityUnitRef,
      ].join("::"),
    };
  }

  function compareScoreVectors(
    left: WaitlistOfferScoreVectorSnapshot,
    right: WaitlistOfferScoreVectorSnapshot,
  ): number {
    if (left.deadlineClassOrdinal !== right.deadlineClassOrdinal) {
      return right.deadlineClassOrdinal - left.deadlineClassOrdinal;
    }
    if (left.matchScore !== right.matchScore) {
      return right.matchScore - left.matchScore;
    }
    if (left.pairUtility !== right.pairUtility) {
      return right.pairUtility - left.pairUtility;
    }
    return left.stablePairOrderKey.localeCompare(right.stablePairOrderKey);
  }

  async function currentActiveOfferForEntry(entryId: string): Promise<WaitlistOfferSnapshot | null> {
    const offerRef = await repositories.getCurrentWaitlistOfferRef(entryId);
    if (!offerRef) {
      return null;
    }
    const offerDocument = await repositories.getWaitlistOffer(offerRef);
    return offerDocument?.toSnapshot() ?? null;
  }

  return {
    repositories,

    async createOrRefreshWaitlistEntry(command) {
      const joinedAt = ensureIsoTimestamp(command.joinedAt, "joinedAt");
      const currentEntryRef = await repositories.getCurrentWaitlistEntryRef(
        requireRef(command.bookingCaseId, "bookingCaseId"),
      );
      const currentEntry = currentEntryRef
        ? (await repositories.getWaitlistEntry(currentEntryRef))?.toSnapshot() ?? null
        : null;
      const preferenceEnvelope: WaitlistPreferenceEnvelopeSnapshot = {
        modality: command.preferenceEnvelope.modality,
        siteRefs: uniqueSorted(command.preferenceEnvelope.siteRefs),
        timeframeEarliest: ensureIsoTimestamp(
          command.preferenceEnvelope.timeframeEarliest,
          "preferenceEnvelope.timeframeEarliest",
        ),
        timeframeLatest: ensureIsoTimestamp(
          command.preferenceEnvelope.timeframeLatest,
          "preferenceEnvelope.timeframeLatest",
        ),
        timeZone: requireRef(command.preferenceEnvelope.timeZone, "preferenceEnvelope.timeZone"),
        maxTravelMinutes: ensureNonNegativeInteger(
          command.preferenceEnvelope.maxTravelMinutes,
          "preferenceEnvelope.maxTravelMinutes",
        ),
        continuityPreference: requireRef(
          command.preferenceEnvelope.continuityPreference,
          "preferenceEnvelope.continuityPreference",
        ),
        offerMode: command.preferenceEnvelope.offerMode,
        responseWindowMinutes: ensurePositiveInteger(
          command.preferenceEnvelope.responseWindowMinutes,
          "preferenceEnvelope.responseWindowMinutes",
        ),
        convenienceTags: uniqueSorted(command.preferenceEnvelope.convenienceTags),
      };
      invariant(
        compareIso(preferenceEnvelope.timeframeEarliest, preferenceEnvelope.timeframeLatest) <= 0,
        "INVALID_WAITLIST_TIMEFRAME",
        "preferenceEnvelope.timeframeLatest must not be earlier than timeframeEarliest.",
      );
      const deadlineAt = ensureIsoTimestamp(command.deadlineAt, "deadlineAt");
      invariant(
        compareIso(joinedAt, deadlineAt) < 0,
        "INVALID_WAITLIST_DEADLINE",
        "deadlineAt must be later than joinedAt.",
      );
      const expectedOfferServiceMinutes = ensurePositiveInteger(
        command.expectedOfferServiceMinutes,
        "expectedOfferServiceMinutes",
      );
      const waitlistEntryId =
        currentEntry?.waitlistEntryId ??
        normalizeRecordId("waitlist_entry", {
          bookingCaseId: command.bookingCaseId,
          joinedAt,
        });
      const createdEntry: WaitlistEntrySnapshot = {
        waitlistEntryId,
        schemaVersion: PHASE4_SMART_WAITLIST_SCHEMA_VERSION,
        bookingCaseId: requireRef(command.bookingCaseId, "bookingCaseId"),
        patientRef: requireRef(command.patientRef, "patientRef"),
        requestRef: requireRef(command.requestRef, "requestRef"),
        requestLineageRef: requireRef(command.requestLineageRef, "requestLineageRef"),
        routeFamilyRef: requireRef(command.routeFamilyRef, "routeFamilyRef"),
        selectionAudience: command.selectionAudience,
        selectedAnchorRef: requireRef(command.selectedAnchorRef, "selectedAnchorRef"),
        activeState: currentEntry?.activeState ?? "active",
        continuationState: currentEntry?.continuationState ?? "waiting_local_supply",
        preferenceEnvelope,
        eligibilityHash: sha256(preferenceEnvelope),
        indexedEligibilityKeys: buildEligibilityKeys(preferenceEnvelope),
        joinedAt: currentEntry?.joinedAt ?? joinedAt,
        priorityKey:
          currentEntry?.priorityKey ?? buildPriorityKey(waitlistEntryId, deadlineAt, joinedAt),
        candidateCursor: currentEntry?.candidateCursor ?? null,
        activeOfferRef: currentEntry?.activeOfferRef ?? null,
        offerHistoryRefs: currentEntry?.offerHistoryRefs ?? [],
        latestDeadlineEvaluationRef: currentEntry?.latestDeadlineEvaluationRef ?? nextId("waitlist_deadline_placeholder"),
        activeFallbackObligationRef:
          currentEntry?.activeFallbackObligationRef ?? nextId("waitlist_fallback_placeholder"),
        continuationTruthProjectionRef:
          currentEntry?.continuationTruthProjectionRef ??
          nextId("waitlist_continuation_placeholder"),
        deadlineAt,
        safeWaitlistUntilAt: subtractMinutes(deadlineAt, expectedOfferServiceMinutes),
        expectedOfferServiceMinutes,
        responseWindowMinutes: preferenceEnvelope.responseWindowMinutes,
        lastEvaluatedAt: currentEntry?.lastEvaluatedAt ?? joinedAt,
        latestAllocationBatchRef: currentEntry?.latestAllocationBatchRef ?? null,
        capabilityResolutionRef: requireRef(command.capabilityResolutionRef, "capabilityResolutionRef"),
        capabilityTupleHash: requireRef(command.capabilityTupleHash, "capabilityTupleHash"),
        providerAdapterBindingRef: requireRef(
          command.providerAdapterBindingRef,
          "providerAdapterBindingRef",
        ),
        providerAdapterBindingHash: requireRef(
          command.providerAdapterBindingHash,
          "providerAdapterBindingHash",
        ),
        authoritativeReadAndConfirmationPolicyRef: requireRef(
          command.authoritativeReadAndConfirmationPolicyRef,
          "authoritativeReadAndConfirmationPolicyRef",
        ),
        reservationSemantics: command.reservationSemantics,
        rankPlanVersion: WAITLIST_RANK_PLAN_VERSION,
        createdAt: currentEntry?.createdAt ?? joinedAt,
        updatedAt: joinedAt,
        version: (currentEntry?.version ?? 0) + 1,
      };
      await repositories.saveWaitlistEntry(
        createdEntry,
        currentEntry ? { expectedVersion: currentEntry.version } : undefined,
      );
      await repositories.setCurrentWaitlistEntryRef(createdEntry.bookingCaseId, createdEntry.waitlistEntryId);

      const refreshed = await refreshBundle(createdEntry, joinedAt, {
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
        actionScope: "join",
      });

      return {
        ...refreshed,
        emittedEvents: [
          buildWaitlistEntryEvents("booking.waitlist.joined", refreshed.entry, {
            deadlineEvaluationRef: refreshed.deadlineEvaluation.waitlistDeadlineEvaluationId,
            fallbackObligationRef: refreshed.fallbackObligation.waitlistFallbackObligationId,
            continuationTruthRef: refreshed.continuationTruth.waitlistContinuationTruthProjectionId,
          }),
          makeFoundationEvent("booking.waitlist.deadline_evaluated", {
            governingRef: refreshed.deadlineEvaluation.waitlistDeadlineEvaluationId,
            bookingCaseId: refreshed.entry.bookingCaseId,
            waitlistEntryId: refreshed.entry.waitlistEntryId,
            offerabilityState: refreshed.deadlineEvaluation.offerabilityState,
            deadlineClass: refreshed.deadlineEvaluation.deadlineClass,
          }),
        ],
      };
    },

    async processReleasedCapacity(command) {
      const processedAt = ensureIsoTimestamp(command.processedAt, "processedAt");
      const updatedBundles: WaitlistEntryMutationResult[] = [];
      const plannedOffers: PlannedWaitlistOfferSnapshot[] = [];
      const pairOrder: string[] = [];

      for (const capacity of command.releasedCapacity) {
        invariant(
          capacity.authoritativeReleaseState === "authoritative_cancelled" ||
            capacity.authoritativeReleaseState === "authoritative_released",
          "WAITLIST_RELEASE_NOT_AUTHORITATIVE",
          "Only authoritative released capacity may trigger local waitlist matching.",
        );
        const candidateDocuments = await repositories.queryIndexedCandidates({
          modality: capacity.modality,
          siteRef: capacity.siteRef,
          localDayKey: capacity.localDayKey,
          continuityKeys:
            capacity.continuityScore > 0
              ? ["continuity:preferred_clinician_if_available", "continuity:no_preference"]
              : ["continuity:no_preference"],
        });
        const candidateEntries = candidateDocuments.map((row) => row.toSnapshot());

        const candidatePairs: {
          entry: WaitlistEntrySnapshot;
          evaluation: WaitlistDeadlineEvaluationSnapshot;
          scoreVector: WaitlistOfferScoreVectorSnapshot;
        }[] = [];
        for (const entry of candidateEntries) {
          if (entryActivationState(entry) !== "offerable") {
            continue;
          }
          if (compareIso(capacity.slotStartAt, entry.preferenceEnvelope.timeframeEarliest) < 0) {
            continue;
          }
          if (compareIso(capacity.slotStartAt, entry.preferenceEnvelope.timeframeLatest) > 0) {
            continue;
          }
          const activeOffer = await currentActiveOfferForEntry(entry.waitlistEntryId);
          const refreshed = await refreshBundle(entry, processedAt, {
            activeOfferOverride: activeOffer,
            commandActionRecordRef: command.commandActionRecordRef,
            commandSettlementRecordRef: command.commandSettlementRecordRef,
            payloadArtifactRef: optionalRef(command.payloadArtifactRef),
            edgeCorrelationId: optionalRef(command.edgeCorrelationId),
            actionScope: "refresh_deadline",
          });
          updatedBundles.push(refreshed);
          if (
            refreshed.deadlineEvaluation.offerabilityState === "fallback_required" ||
            refreshed.deadlineEvaluation.offerabilityState === "overdue"
          ) {
            continue;
          }
          if (activeOffer && (activeOffer.offerState === "sent" || activeOffer.offerState === "opened")) {
            continue;
          }
          if (buildPreferenceFit(refreshed.entry, capacity) <= 0) {
            continue;
          }
          candidatePairs.push({
            entry: refreshed.entry,
            evaluation: refreshed.deadlineEvaluation,
            scoreVector: computeScoreVector({
              entry: refreshed.entry,
              evaluation: refreshed.deadlineEvaluation,
              capacity,
            }),
          });
        }

        candidatePairs.sort((left, right) => compareScoreVectors(left.scoreVector, right.scoreVector));
        const selected = candidatePairs[0];
        if (!selected) {
          continue;
        }

        const allocationBatchRef = normalizeRecordId("waitlist_batch", {
          capacityUnitRef: capacity.capacityUnitRef,
          processedAt,
          waitlistEntryId: selected.entry.waitlistEntryId,
        });
        pairOrder.push(selected.scoreVector.stablePairOrderKey);
        plannedOffers.push({
          waitlistOfferId: normalizeRecordId("waitlist_offer", {
            allocationBatchRef,
            waitlistEntryId: selected.entry.waitlistEntryId,
            capacityUnitRef: capacity.capacityUnitRef,
          }),
          waitlistEntryRef: selected.entry.waitlistEntryId,
          deadlineEvaluationRef: selected.evaluation.waitlistDeadlineEvaluationId,
          fallbackObligationRef: selected.entry.activeFallbackObligationRef,
          continuationFenceEpoch: updatedBundles.length + plannedOffers.length + 1,
          releasedCapacity: capacity,
          allocationBatchRef,
          truthMode: selected.entry.reservationSemantics,
          scoreVector: selected.scoreVector,
          offerOrdinal: 1,
          offerExpiryAt: addMinutes(processedAt, selected.entry.responseWindowMinutes),
          exclusiveUntilAt:
            selected.entry.reservationSemantics === "exclusive_hold"
              ? addMinutes(processedAt, selected.entry.responseWindowMinutes)
              : null,
          selectionToken: sha256({
            waitlistEntryId: selected.entry.waitlistEntryId,
            capacityUnitRef: capacity.capacityUnitRef,
            processedAt,
          }),
          selectionProofHash: sha256({
            waitlistEntryId: selected.entry.waitlistEntryId,
            releasedSlotRef: capacity.releasedSlotRef,
            scoreVector: selected.scoreVector,
          }),
        });
      }

      const allocationBatch: WaitlistAllocationBatchSnapshot = {
        waitlistAllocationBatchId:
          plannedOffers[0]?.allocationBatchRef ??
          normalizeRecordId("waitlist_batch", { processedAt, seed: nextId("waitlist_batch") }),
        schemaVersion: PHASE4_SMART_WAITLIST_SCHEMA_VERSION,
        batchingHorizonSeconds: rankPlan.batchingHorizonSeconds,
        releasedCapacityUnitRefs: uniqueSorted(
          command.releasedCapacity.map((capacity) => capacity.capacityUnitRef),
        ),
        releasedSlotRefs: uniqueSorted(command.releasedCapacity.map((capacity) => capacity.releasedSlotRef)),
        assignmentTupleHash: sha256(
          plannedOffers.map((offer) => ({
            waitlistEntryRef: offer.waitlistEntryRef,
            capacityUnitRef: offer.releasedCapacity.capacityUnitRef,
            matchScore: offer.scoreVector.matchScore,
          })),
        ),
        eligiblePairCount: pairOrder.length,
        assignedPairCount: plannedOffers.length,
        stablePairOrder: pairOrder,
        createdAt: processedAt,
        version: 1,
      };
      await repositories.saveAllocationBatch(allocationBatch);

      return {
        allocationBatch,
        plannedOffers,
        updatedBundles,
        emittedEvents: [],
      };
    },

    async issuePlannedWaitlistOffer(command) {
      const plannedOffer = command.plannedOffer;
      const entryDocument = await repositories.getWaitlistEntry(plannedOffer.waitlistEntryRef);
      invariant(entryDocument, "WAITLIST_ENTRY_NOT_FOUND", "WaitlistEntry was not found.");
      const entry = entryDocument.toSnapshot();
      const priorActiveOffer = await currentActiveOfferForEntry(entry.waitlistEntryId);
      if (priorActiveOffer && priorActiveOffer.waitlistOfferId !== plannedOffer.waitlistOfferId) {
        const superseded = {
          ...priorActiveOffer,
          offerState: "superseded" as const,
          supersededByRef: plannedOffer.waitlistOfferId,
          updatedAt: command.sentAt,
          version: priorActiveOffer.version + 1,
        };
        await repositories.saveWaitlistOffer(superseded, { expectedVersion: priorActiveOffer.version });
      }
      const offer: WaitlistOfferSnapshot = {
        waitlistOfferId: plannedOffer.waitlistOfferId,
        schemaVersion: PHASE4_SMART_WAITLIST_SCHEMA_VERSION,
        waitlistEntryRef: plannedOffer.waitlistEntryRef,
        deadlineEvaluationRef: plannedOffer.deadlineEvaluationRef,
        fallbackObligationRef: plannedOffer.fallbackObligationRef,
        continuationFenceEpoch: plannedOffer.continuationFenceEpoch,
        releasedSlotRef: plannedOffer.releasedCapacity.releasedSlotRef,
        selectedNormalizedSlotRef: plannedOffer.releasedCapacity.selectedNormalizedSlotRef,
        selectedCanonicalSlotIdentityRef:
          plannedOffer.releasedCapacity.selectedCanonicalSlotIdentityRef,
        sourceSlotSetSnapshotRef: optionalRef(plannedOffer.releasedCapacity.sourceSlotSetSnapshotRef),
        capacityUnitRef: plannedOffer.releasedCapacity.capacityUnitRef,
        reservationRef: requireRef(command.reservationRef, "reservationRef"),
        reservationTruthProjectionRef: requireRef(
          command.reservationTruthProjectionRef,
          "reservationTruthProjectionRef",
        ),
        allocationBatchRef: plannedOffer.allocationBatchRef,
        truthMode: plannedOffer.truthMode,
        scoreVector: plannedOffer.scoreVector,
        offerOrdinal: plannedOffer.offerOrdinal,
        offerState: "sent",
        holdState: command.holdState,
        offerExpiryAt: plannedOffer.offerExpiryAt,
        exclusiveUntilAt: plannedOffer.exclusiveUntilAt,
        sentAt: ensureIsoTimestamp(command.sentAt, "sentAt"),
        openedAt: null,
        respondedAt: null,
        selectionToken: plannedOffer.selectionToken,
        selectionProofHash: plannedOffer.selectionProofHash,
        supersededByRef: null,
        createdAt: ensureIsoTimestamp(command.sentAt, "sentAt"),
        updatedAt: ensureIsoTimestamp(command.sentAt, "sentAt"),
        version: 1,
      };
      await repositories.saveWaitlistOffer(offer);
      await repositories.setCurrentWaitlistOfferRef(entry.waitlistEntryId, offer.waitlistOfferId);

      const refreshed = await refreshBundle(
        {
          ...entry,
          activeOfferRef: offer.waitlistOfferId,
          offerHistoryRefs: uniqueSorted([...entry.offerHistoryRefs, offer.waitlistOfferId]),
          latestAllocationBatchRef: plannedOffer.allocationBatchRef,
        },
        offer.sentAt,
        {
          activeOfferOverride: offer,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
          actionScope: "issue_offer",
        },
      );
      return {
        ...refreshed,
        activeOffer: offer,
        emittedEvents: [
          makeFoundationEvent("booking.waitlist.offer.sent", {
            governingRef: offer.waitlistOfferId,
            bookingCaseId: refreshed.entry.bookingCaseId,
            waitlistEntryId: refreshed.entry.waitlistEntryId,
            reservationTruthProjectionRef: offer.reservationTruthProjectionRef,
            truthMode: offer.truthMode,
            offerExpiryAt: offer.offerExpiryAt,
          }),
        ],
      };
    },

    async acceptWaitlistOffer(command) {
      const offerDocument = await repositories.getWaitlistOffer(requireRef(command.waitlistOfferId, "waitlistOfferId"));
      invariant(offerDocument, "WAITLIST_OFFER_NOT_FOUND", "WaitlistOffer was not found.");
      const offer = offerDocument.toSnapshot();
      invariant(
        offer.offerState === "sent" || offer.offerState === "opened",
        "WAITLIST_OFFER_NOT_ACCEPTABLE",
        "Only active decision-required offers may be accepted.",
      );
      invariant(
        compareIso(ensureIsoTimestamp(command.acceptedAt, "acceptedAt"), offer.offerExpiryAt) <= 0,
        "WAITLIST_OFFER_EXPIRED",
        "WaitlistOffer can no longer be accepted after offerExpiryAt.",
      );
      const acceptedOffer: WaitlistOfferSnapshot = {
        ...offer,
        offerState: "accepted",
        respondedAt: ensureIsoTimestamp(command.acceptedAt, "acceptedAt"),
        updatedAt: ensureIsoTimestamp(command.acceptedAt, "acceptedAt"),
        version: offer.version + 1,
      };
      await repositories.saveWaitlistOffer(acceptedOffer, { expectedVersion: offer.version });
      const entryDocument = await repositories.getWaitlistEntry(offer.waitlistEntryRef);
      invariant(entryDocument, "WAITLIST_ENTRY_NOT_FOUND", "WaitlistEntry was not found.");
      const refreshed = await refreshBundle(
        {
          ...entryDocument.toSnapshot(),
          activeOfferRef: acceptedOffer.waitlistOfferId,
        },
        acceptedOffer.updatedAt,
        {
          activeOfferOverride: acceptedOffer,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
          actionScope: "accept_offer",
        },
      );
      return {
        ...refreshed,
        activeOffer: acceptedOffer,
        emittedEvents: [
          makeFoundationEvent("booking.waitlist.offer.accepted", {
            governingRef: acceptedOffer.waitlistOfferId,
            bookingCaseId: refreshed.entry.bookingCaseId,
            waitlistEntryId: refreshed.entry.waitlistEntryId,
            reservationTruthProjectionRef: acceptedOffer.reservationTruthProjectionRef,
          }),
        ],
      };
    },

    async expireWaitlistOffer(command) {
      const offerDocument = await repositories.getWaitlistOffer(requireRef(command.waitlistOfferId, "waitlistOfferId"));
      invariant(offerDocument, "WAITLIST_OFFER_NOT_FOUND", "WaitlistOffer was not found.");
      const offer = offerDocument.toSnapshot();
      const expiredOffer: WaitlistOfferSnapshot = {
        ...offer,
        offerState: "expired",
        holdState: offer.holdState === "held" ? "expired" : offer.holdState,
        updatedAt: ensureIsoTimestamp(command.expiredAt, "expiredAt"),
        respondedAt: offer.respondedAt ?? ensureIsoTimestamp(command.expiredAt, "expiredAt"),
        version: offer.version + 1,
      };
      await repositories.saveWaitlistOffer(expiredOffer, { expectedVersion: offer.version });
      const entryDocument = await repositories.getWaitlistEntry(expiredOffer.waitlistEntryRef);
      invariant(entryDocument, "WAITLIST_ENTRY_NOT_FOUND", "WaitlistEntry was not found.");
      const entry = entryDocument.toSnapshot();
      const refreshed = await refreshBundle(
        {
          ...entry,
          candidateCursor: `expired::${expiredOffer.capacityUnitRef}`,
          activeOfferRef: null,
        },
        expiredOffer.updatedAt,
        {
          noEligibleSupply: true,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
          actionScope: "expire_offer",
          reasonHint: requireRef(command.reasonCode, "reasonCode"),
        },
      );
      return {
        ...refreshed,
        emittedEvents: [
          makeFoundationEvent("booking.waitlist.offer.expired", {
            governingRef: expiredOffer.waitlistOfferId,
            bookingCaseId: refreshed.entry.bookingCaseId,
            waitlistEntryId: refreshed.entry.waitlistEntryId,
            reasonCode: command.reasonCode,
          }),
        ],
      };
    },

    async supersedeWaitlistOffer(command) {
      const offerDocument = await repositories.getWaitlistOffer(requireRef(command.waitlistOfferId, "waitlistOfferId"));
      invariant(offerDocument, "WAITLIST_OFFER_NOT_FOUND", "WaitlistOffer was not found.");
      const offer = offerDocument.toSnapshot();
      const supersededOffer: WaitlistOfferSnapshot = {
        ...offer,
        offerState: "superseded",
        supersededByRef: requireRef(command.supersededByRef, "supersededByRef"),
        updatedAt: ensureIsoTimestamp(command.supersededAt, "supersededAt"),
        version: offer.version + 1,
      };
      await repositories.saveWaitlistOffer(supersededOffer, { expectedVersion: offer.version });
      const entryDocument = await repositories.getWaitlistEntry(supersededOffer.waitlistEntryRef);
      invariant(entryDocument, "WAITLIST_ENTRY_NOT_FOUND", "WaitlistEntry was not found.");
      const refreshed = await refreshBundle(
        {
          ...entryDocument.toSnapshot(),
          candidateCursor: `superseded::${supersededOffer.capacityUnitRef}`,
          activeOfferRef: null,
        },
        supersededOffer.updatedAt,
        {
          noEligibleSupply: true,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
          actionScope: "supersede_offer",
          reasonHint: requireRef(command.reasonCode, "reasonCode"),
        },
      );
      return {
        ...refreshed,
        emittedEvents: [
          makeFoundationEvent("booking.waitlist.offer.superseded", {
            governingRef: supersededOffer.waitlistOfferId,
            bookingCaseId: refreshed.entry.bookingCaseId,
            waitlistEntryId: refreshed.entry.waitlistEntryId,
            supersededByRef: supersededOffer.supersededByRef,
            reasonCode: command.reasonCode,
          }),
        ],
      };
    },

    async refreshFallbackObligation(command) {
      const entryDocument = await repositories.getWaitlistEntry(requireRef(command.waitlistEntryId, "waitlistEntryId"));
      invariant(entryDocument, "WAITLIST_ENTRY_NOT_FOUND", "WaitlistEntry was not found.");
      return refreshBundle(entryDocument.toSnapshot(), ensureIsoTimestamp(command.evaluatedAt, "evaluatedAt"), {
        noEligibleSupply: command.noEligibleSupply ?? false,
        staleCapacityTruth: command.staleCapacityTruth ?? false,
        policyCutoff: command.policyCutoff ?? false,
        callbackAllowed: command.callbackAllowed ?? true,
        hubAllowed: command.hubAllowed ?? true,
        transferRefs:
          optionalRef(command.callbackCaseRef) ||
          optionalRef(command.callbackExpectationEnvelopeRef) ||
          optionalRef(command.hubCoordinationCaseRef)
            ? {
                callbackCaseRef: optionalRef(command.callbackCaseRef),
                callbackExpectationEnvelopeRef: optionalRef(command.callbackExpectationEnvelopeRef),
                hubCoordinationCaseRef: optionalRef(command.hubCoordinationCaseRef),
              }
            : undefined,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
        actionScope: "fallback_transfer",
      });
    },

    async pauseWaitlistEntry(command) {
      const entryDocument = await repositories.getWaitlistEntry(requireRef(command.waitlistEntryId, "waitlistEntryId"));
      invariant(entryDocument, "WAITLIST_ENTRY_NOT_FOUND", "WaitlistEntry was not found.");
      const entry = entryDocument.toSnapshot();
      const pausedEntry: WaitlistEntrySnapshot = {
        ...entry,
        activeState: "paused",
        activeOfferRef: null,
        updatedAt: ensureIsoTimestamp(command.pausedAt, "pausedAt"),
        version: entry.version + 1,
      };
      await repositories.saveWaitlistEntry(pausedEntry, { expectedVersion: entry.version });
      await repositories.setCurrentWaitlistOfferRef(pausedEntry.waitlistEntryId, null);
      return refreshBundle(pausedEntry, pausedEntry.updatedAt, {
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
        actionScope: "pause",
        reasonHint: requireRef(command.reasonCode, "reasonCode"),
      });
    },

    async closeWaitlistEntry(command) {
      const entryDocument = await repositories.getWaitlistEntry(requireRef(command.waitlistEntryId, "waitlistEntryId"));
      invariant(entryDocument, "WAITLIST_ENTRY_NOT_FOUND", "WaitlistEntry was not found.");
      const entry = entryDocument.toSnapshot();
      const closedEntry: WaitlistEntrySnapshot = {
        ...entry,
        activeState: "closed",
        continuationState: "closed",
        activeOfferRef: null,
        updatedAt: ensureIsoTimestamp(command.closedAt, "closedAt"),
        version: entry.version + 1,
      };
      await repositories.saveWaitlistEntry(closedEntry, { expectedVersion: entry.version });
      await repositories.setCurrentWaitlistOfferRef(closedEntry.waitlistEntryId, null);
      return refreshBundle(closedEntry, closedEntry.updatedAt, {
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        payloadArtifactRef: optionalRef(command.payloadArtifactRef),
        edgeCorrelationId: optionalRef(command.edgeCorrelationId),
        actionScope: "close",
        reasonHint: requireRef(command.reasonCode, "reasonCode"),
      });
    },

    async settleWaitlistCommitOutcome(command) {
      const offerDocument = await repositories.getWaitlistOffer(requireRef(command.waitlistOfferId, "waitlistOfferId"));
      invariant(offerDocument, "WAITLIST_OFFER_NOT_FOUND", "WaitlistOffer was not found.");
      const offer = offerDocument.toSnapshot();
      const entryDocument = await repositories.getWaitlistEntry(offer.waitlistEntryRef);
      invariant(entryDocument, "WAITLIST_ENTRY_NOT_FOUND", "WaitlistEntry was not found.");
      const entry = entryDocument.toSnapshot();
      const settledAt = ensureIsoTimestamp(command.settledAt, "settledAt");
      const settledOffer: WaitlistOfferSnapshot = {
        ...offer,
        offerState:
          command.outcome === "booked"
            ? "closed"
            : command.outcome === "failed" || command.outcome === "expired"
              ? "commit_failed"
              : "accepted",
        holdState:
          command.outcome === "booked"
            ? "confirmed"
            : command.outcome === "failed" || command.outcome === "expired"
              ? "released"
              : "pending_confirmation",
        updatedAt: settledAt,
        respondedAt: offer.respondedAt ?? settledAt,
        version: offer.version + 1,
      };
      await repositories.saveWaitlistOffer(settledOffer, { expectedVersion: offer.version });
      const transferRefs =
        command.outcome === "failed" || command.outcome === "expired"
          ? {
              callbackCaseRef: optionalRef(command.callbackCaseRef),
              callbackExpectationEnvelopeRef: optionalRef(command.callbackExpectationEnvelopeRef),
              hubCoordinationCaseRef: optionalRef(command.hubCoordinationCaseRef),
            }
          : undefined;
      const refreshed = await refreshBundle(
        {
          ...entry,
          activeState: command.outcome === "booked" ? "closed" : entry.activeState,
          continuationState:
            command.outcome === "booked" ? "closed" : "accepted_pending_confirmation",
          activeOfferRef:
            command.outcome === "failed" || command.outcome === "expired" ? null : settledOffer.waitlistOfferId,
        },
        settledAt,
        {
          activeOfferOverride:
            command.outcome === "failed" || command.outcome === "expired" ? null : settledOffer,
          noEligibleSupply: command.outcome === "failed" || command.outcome === "expired",
          transferRefs,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          payloadArtifactRef: optionalRef(command.payloadArtifactRef),
          edgeCorrelationId: optionalRef(command.edgeCorrelationId),
          actionScope: "commit_settlement",
          reasonHint: uniqueSorted(command.reasonCodes ?? []).join("::") || `commit_${command.outcome}`,
        },
      );
      if (command.outcome === "booked") {
        const fallbackDocument = await repositories.getFallbackObligation(refreshed.entry.activeFallbackObligationRef);
        if (fallbackDocument) {
          const fallback = fallbackDocument.toSnapshot();
          await repositories.saveFallbackObligation({
            ...fallback,
            transferState: "satisfied",
            clearedAt: settledAt,
            updatedAt: settledAt,
            version: fallback.version + 1,
          }, { expectedVersion: fallback.version });
        }
      }
      return refreshed;
    },

    async queryCurrentWaitlist(bookingCaseId) {
      const currentEntryRef = await repositories.getCurrentWaitlistEntryRef(requireRef(bookingCaseId, "bookingCaseId"));
      if (!currentEntryRef) {
        return null;
      }
      const entryDocument = await repositories.getWaitlistEntry(currentEntryRef);
      return entryDocument ? getBundleFromEntry(entryDocument.toSnapshot()) : null;
    },

    async queryWaitlistOffer(waitlistOfferId) {
      return (await repositories.getWaitlistOffer(waitlistOfferId))?.toSnapshot() ?? null;
    },
  };
}
