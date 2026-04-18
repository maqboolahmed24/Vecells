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
import type {
  BookingCapabilityResolutionSnapshot,
  BookingProviderAdapterBindingSnapshot,
} from "./phase4-booking-capability-engine";
import type { SearchPolicySnapshot } from "./phase4-booking-case-kernel";

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

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort() as T[];
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

function addSeconds(timestamp: string, seconds: number): string {
  const date = new Date(timestamp);
  date.setUTCSeconds(date.getUTCSeconds() + seconds);
  return date.toISOString();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function normalizeRecordId(prefix: string, digest: string): string {
  return `${prefix}_${digest.slice(0, 24)}`;
}

const PHASE4_SLOT_SEARCH_SCHEMA_VERSION =
  "284.phase4.slot-search-snapshot-pipeline.v1" as const;
const SLOT_FILTER_PLAN_VERSION = "284.filter-plan.slot-normalization.v1" as const;
const SLOT_RANK_PLAN_VERSION = "284.pre-rank-candidate-order.v1" as const;
const SLOT_NORMALIZATION_VERSION = "284.temporal-normalization.v1" as const;
const DEFAULT_SNAPSHOT_PAGE_SIZE = 25;
const DEFAULT_SNAPSHOT_TTL_SECONDS = 900;
const AMBIGUOUS_LOCAL_TIME_POLICY = "reject_without_offset_then_recover";
const SAME_SHELL_REFRESH_ACTION = "booking_search_refresh_in_place";
const SAME_SHELL_SUPPORT_ACTION = "booking_search_support_fallback";

export type SlotSearchCoverageState =
  | "complete"
  | "partial_coverage"
  | "timeout"
  | "degraded"
  | "failed";

export type SlotSnapshotRecoveryViewState =
  | "renderable"
  | "partial_coverage"
  | "stale_refresh_required"
  | "no_supply_confirmed"
  | "support_fallback";

export type SlotSearchSelectionAudience = "patient" | "staff";

export type SlotSearchActionScope =
  | "search_slots"
  | "book_slot"
  | "view_appointment"
  | "request_staff_assist";

export type SlotSearchModality = "in_person" | "remote" | "either";

export type SupplierBookabilityMode =
  | "patient_self_service"
  | "staff_assist_only"
  | "dual"
  | "view_only";

export type TemporalValidityState =
  | "valid"
  | "ambiguous_local_time"
  | "invalid_timestamp"
  | "timezone_missing"
  | "timezone_unresolvable";

export type DstBoundaryState = "steady" | "adjacent_boundary" | "crosses_boundary" | "unknown";

export interface SlotSearchQueryEnvelopeSnapshot {
  requestedStartAt: string;
  requestedEndAt: string;
  timeZone: string;
  modality: SlotSearchModality;
  sitePreferences: readonly string[];
  sameBandReorderSlackMinutesByWindow: {
    preferred: number;
    acceptable: number;
  };
}

export interface SlotSearchSessionSnapshot {
  slotSearchSessionId: string;
  bookingCaseId: string;
  caseVersionRef: string;
  searchPolicyRef: string;
  policyBundleHash: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  selectionAudience: SlotSearchSelectionAudience;
  requestedActionScope: SlotSearchActionScope;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  providerSearchSliceRefs: readonly string[];
  slotSetSnapshotRef: string;
  coverageState: SlotSearchCoverageState;
  queryEnvelope: SlotSearchQueryEnvelopeSnapshot;
  temporalNormalizationEnvelopeRef: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface ProviderSearchSliceSnapshot {
  providerSearchSliceId: string;
  slotSearchSessionRef: string;
  supplierRef: string;
  queryFingerprint: string;
  supplierWindowRef: string | null;
  providerAdapterBindingRef: string;
  searchWindowStartAt: string;
  searchWindowEndAt: string;
  fetchStartedAt: string;
  fetchCompletedAt: string;
  completedAt: string;
  coverageState: SlotSearchCoverageState;
  partialReasonCode: string | null;
  sourceVersionRef: string | null;
  degradationReasonRefs: readonly string[];
  returnedRawCount: number;
  normalizedCount: number;
  deduplicatedCount: number;
  filteredCount: number;
  surfacedCount: number;
  rawPayloadRef: string;
  rawPayloadChecksum: string;
  rejectReasonCounters: Readonly<Record<string, number>>;
}

export interface TemporalNormalizationEnvelopeSnapshot {
  temporalNormalizationEnvelopeId: string;
  slotSearchSessionRef: string;
  sourceTimeZone: string;
  displayTimeZone: string;
  clockSkewMilliseconds: number;
  ambiguousLocalTimePolicy: string;
  normalizationVersionRef: string;
  dstBoundaryRefs: readonly string[];
  generatedAt: string;
}

export interface CanonicalSlotIdentitySnapshot {
  canonicalSlotIdentityId: string;
  supplierRef: string;
  supplierSlotRef: string | null;
  capacityUnitRef: string;
  scheduleRef: string;
  locationRef: string;
  practitionerRef: string;
  serviceRef: string;
  slotStartAtEpoch: number;
  slotEndAtEpoch: number;
  modality: string;
  bookabilityMode: SupplierBookabilityMode;
  scheduleOwnerRef: string;
  inventoryLineageRef: string;
  canonicalTieBreakKey: string;
  identityStrength: string;
  sourceHash: string;
}

export interface NormalizedSlotSnapshot {
  normalizedSlotId: string;
  slotSetSnapshotRef: string;
  slotSearchSessionRef: string;
  slotPublicId: string;
  supplierRef: string;
  supplierSlotId: string;
  canonicalSlotIdentityRef: string;
  capacityUnitRef: string;
  scheduleId: string;
  scheduleOwnerRef: string;
  siteId: string;
  siteName: string;
  clinicianType: string;
  modality: string;
  serviceRef: string;
  practitionerRef: string;
  locationRef: string;
  startAt: string;
  endAt: string;
  startAtEpoch: number;
  endAtEpoch: number;
  localDayKey: string;
  displayTimeZone: string;
  sourceTimeZone: string;
  temporalNormalizationEnvelopeRef: string;
  temporalValidityState: TemporalValidityState;
  dstBoundaryState: DstBoundaryState;
  clockSkewMilliseconds: number;
  bookableUntil: string | null;
  continuityScore: number;
  restrictions: readonly string[];
  accessibilityTags: readonly string[];
  bookabilityMode: SupplierBookabilityMode;
  hardFilterMask: readonly string[];
  rankFeatures: Readonly<Record<string, number | string | boolean>>;
  scoreExplanationRef: string | null;
  canonicalTieBreakKey: string;
  sourceVersion: string | null;
  rawPayloadRef: string;
  rawPayloadChecksum: string;
  sourceSliceRef: string;
}

export interface SnapshotCandidateDayBucketSnapshot {
  localDayKey: string;
  normalizedSlotRefs: readonly string[];
  surfacedCount: number;
}

export interface SnapshotCandidateIndexSnapshot {
  snapshotCandidateIndexId: string;
  slotSetSnapshotRef: string;
  selectionAudience: SlotSearchSelectionAudience;
  rankPlanVersion: string;
  capacityRankProofRef: string | null;
  orderedSlotRefs: readonly string[];
  dayBuckets: readonly SnapshotCandidateDayBucketSnapshot[];
  aggregateCounters: Readonly<Record<string, number>>;
  pageSize: number;
}

export interface SlotSnapshotRecoveryStateSnapshot {
  slotSnapshotRecoveryStateId: string;
  slotSetSnapshotRef: string;
  viewState: SlotSnapshotRecoveryViewState;
  coverageState: SlotSearchCoverageState;
  anchorDayKey: string | null;
  reasonCodes: readonly string[];
  supportHelpVisible: boolean;
  sameShellActionRef: string | null;
  generatedAt: string;
}

export interface SlotSetSnapshotSnapshot {
  slotSetSnapshotId: string;
  searchSessionId: string;
  searchPolicyRef: string;
  caseVersionRef: string;
  policyBundleHash: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  slotCount: number;
  candidateCount: number;
  snapshotChecksum: string;
  candidateIndexRef: string;
  filterPlanVersion: string;
  rankPlanVersion: string;
  coverageState: SlotSearchCoverageState;
  recoveryStateRef: string;
  fetchedAt: string;
  expiresAt: string;
}

export interface ProviderSearchRawSlotRowInput {
  supplierSlotRef: string;
  capacityUnitRef: string;
  scheduleRef: string;
  scheduleOwnerRef?: string | null;
  locationRef: string;
  locationName?: string | null;
  practitionerRef?: string | null;
  serviceRef?: string | null;
  clinicianType?: string | null;
  modality: string;
  startAt: string;
  endAt: string;
  bookableUntil?: string | null;
  sourceTimeZone?: string | null;
  siteTimeZone?: string | null;
  siteId?: string | null;
  siteName?: string | null;
  accessibilityTags?: readonly string[];
  continuityScore?: number;
  restrictions?: readonly string[];
  restrictionState?: "satisfied" | "not_satisfied";
  bookabilityMode?: SupplierBookabilityMode;
  inventoryLineageRef?: string | null;
  sourceVersionRef?: string | null;
  rawPayloadRef?: string | null;
  rawPayloadChecksum?: string | null;
}

export interface ProviderSearchWindowInput {
  supplierRef: string;
  queryFingerprint?: string | null;
  supplierWindowRef?: string | null;
  searchWindowStartAt: string;
  searchWindowEndAt: string;
  fetchStartedAt?: string | null;
  fetchCompletedAt?: string | null;
  coverageStateHint?: SlotSearchCoverageState | null;
  partialReasonCode?: string | null;
  sourceVersionRef?: string | null;
  degradationReasonRefs?: readonly string[];
  rawPayloadRef?: string | null;
  rawPayloadChecksum?: string | null;
  rawRows: readonly ProviderSearchRawSlotRowInput[];
}

export interface SlotSearchExecutionInput {
  bookingCaseId: string;
  caseVersionRef: string;
  searchPolicy: SearchPolicySnapshot;
  capabilityResolution: BookingCapabilityResolutionSnapshot;
  providerAdapterBinding: BookingProviderAdapterBindingSnapshot;
  displayTimeZone: string;
  supplierWindows: readonly ProviderSearchWindowInput[];
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  occurredAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  expiresInSeconds?: number;
}

export interface SlotSnapshotSelectabilityInput {
  bookingCaseId: string;
  caseVersionRef: string;
  policyBundleHash: string;
  providerAdapterBindingHash: string;
  capabilityTupleHash: string;
  now: string;
}

export interface SlotSnapshotSelectabilityResult {
  selectable: boolean;
  failureReasonCodes: readonly string[];
}

export interface SlotSearchExecutionResult {
  searchSession: SlotSearchSessionSnapshot;
  slotSetSnapshot: SlotSetSnapshotSnapshot;
  recoveryState: SlotSnapshotRecoveryStateSnapshot;
  temporalNormalizationEnvelope: TemporalNormalizationEnvelopeSnapshot;
  providerSearchSlices: readonly ProviderSearchSliceSnapshot[];
  canonicalSlotIdentities: readonly CanonicalSlotIdentitySnapshot[];
  normalizedSlots: readonly NormalizedSlotSnapshot[];
  candidateIndex: SnapshotCandidateIndexSnapshot;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
  supersededSnapshotRefs: readonly string[];
}

export interface SlotSearchPageResult {
  searchSession: SlotSearchSessionSnapshot;
  slotSetSnapshot: SlotSetSnapshotSnapshot;
  recoveryState: SlotSnapshotRecoveryStateSnapshot;
  effectiveRecoveryState: SlotSnapshotRecoveryStateSnapshot;
  candidateIndex: SnapshotCandidateIndexSnapshot;
  pageNumber: number;
  totalPages: number;
  slots: readonly NormalizedSlotSnapshot[];
  selectable: boolean;
  failureReasonCodes: readonly string[];
}

export interface SlotSearchDayBucketResult {
  searchSession: SlotSearchSessionSnapshot;
  slotSetSnapshot: SlotSetSnapshotSnapshot;
  recoveryState: SlotSnapshotRecoveryStateSnapshot;
  effectiveRecoveryState: SlotSnapshotRecoveryStateSnapshot;
  candidateIndex: SnapshotCandidateIndexSnapshot;
  localDayKey: string;
  slots: readonly NormalizedSlotSnapshot[];
  selectable: boolean;
  failureReasonCodes: readonly string[];
}

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

interface StoredRow<T> {
  snapshot: T;
  version: number;
}

class StoredDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly row: StoredRow<T>) {}

  toSnapshot(): T {
    return structuredClone(this.row.snapshot);
  }
}

function saveWithCas<T>(
  map: Map<string, StoredRow<T>>,
  key: string,
  snapshot: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  }
  map.set(key, {
    snapshot: structuredClone(snapshot),
    version: (current?.version ?? 0) + 1,
  });
}

export interface Phase4SlotSearchSnapshotRepositories {
  getSlotSearchSession(
    slotSearchSessionId: string,
  ): Promise<SnapshotDocument<SlotSearchSessionSnapshot> | null>;
  getSlotSetSnapshot(
    slotSetSnapshotId: string,
  ): Promise<SnapshotDocument<SlotSetSnapshotSnapshot> | null>;
  getSnapshotRecoveryState(
    slotSnapshotRecoveryStateId: string,
  ): Promise<SnapshotDocument<SlotSnapshotRecoveryStateSnapshot> | null>;
  getTemporalNormalizationEnvelope(
    temporalNormalizationEnvelopeId: string,
  ): Promise<SnapshotDocument<TemporalNormalizationEnvelopeSnapshot> | null>;
  getSnapshotCandidateIndex(
    snapshotCandidateIndexId: string,
  ): Promise<SnapshotDocument<SnapshotCandidateIndexSnapshot> | null>;
  listProviderSearchSlices(
    slotSearchSessionId: string,
  ): Promise<readonly SnapshotDocument<ProviderSearchSliceSnapshot>[]>;
  listCanonicalSlotIdentities(
    slotSetSnapshotId: string,
  ): Promise<readonly SnapshotDocument<CanonicalSlotIdentitySnapshot>[]>;
  listNormalizedSlots(
    slotSetSnapshotId: string,
  ): Promise<readonly SnapshotDocument<NormalizedSlotSnapshot>[]>;
  getCurrentSlotSearchSessionRef(scopeKey: string): Promise<string | null>;
  getCurrentSlotSetSnapshotRef(scopeKey: string): Promise<string | null>;
  getExecutionReplay(
    replayKey: string,
  ): Promise<{ slotSearchSessionId: string; slotSetSnapshotId: string } | null>;
}

interface ExtendedPhase4SlotSearchSnapshotRepositories
  extends Phase4SlotSearchSnapshotRepositories {
  saveSlotSearchSession(
    snapshot: SlotSearchSessionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveProviderSearchSlice(
    snapshot: ProviderSearchSliceSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveTemporalNormalizationEnvelope(
    snapshot: TemporalNormalizationEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveCanonicalSlotIdentity(
    slotSetSnapshotId: string,
    snapshot: CanonicalSlotIdentitySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveNormalizedSlot(
    snapshot: NormalizedSlotSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveSnapshotCandidateIndex(
    snapshot: SnapshotCandidateIndexSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveSnapshotRecoveryState(
    snapshot: SlotSnapshotRecoveryStateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveSlotSetSnapshot(
    snapshot: SlotSetSnapshotSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  setCurrentSlotSearchSessionRef(scopeKey: string, slotSearchSessionId: string): Promise<void>;
  setCurrentSlotSetSnapshotRef(scopeKey: string, slotSetSnapshotId: string | null): Promise<void>;
  saveExecutionReplay(
    replayKey: string,
    value: { slotSearchSessionId: string; slotSetSnapshotId: string },
  ): Promise<void>;
}

export function createPhase4SlotSearchSnapshotStore(): ExtendedPhase4SlotSearchSnapshotRepositories {
  const sessions = new Map<string, StoredRow<SlotSearchSessionSnapshot>>();
  const slices = new Map<string, StoredRow<ProviderSearchSliceSnapshot>>();
  const sliceRefsBySession = new Map<string, string[]>();
  const envelopes = new Map<string, StoredRow<TemporalNormalizationEnvelopeSnapshot>>();
  const identities = new Map<string, StoredRow<CanonicalSlotIdentitySnapshot>>();
  const identityRefsBySnapshot = new Map<string, string[]>();
  const normalizedSlots = new Map<string, StoredRow<NormalizedSlotSnapshot>>();
  const normalizedSlotRefsBySnapshot = new Map<string, string[]>();
  const candidateIndices = new Map<string, StoredRow<SnapshotCandidateIndexSnapshot>>();
  const recoveryStates = new Map<string, StoredRow<SlotSnapshotRecoveryStateSnapshot>>();
  const snapshots = new Map<string, StoredRow<SlotSetSnapshotSnapshot>>();
  const currentSessionByScope = new Map<string, string>();
  const currentSnapshotByScope = new Map<string, string>();
  const executionReplay = new Map<
    string,
    { slotSearchSessionId: string; slotSetSnapshotId: string }
  >();

  return {
    async getSlotSearchSession(slotSearchSessionId) {
      const row = sessions.get(slotSearchSessionId);
      return row ? new StoredDocument(row) : null;
    },
    async getSlotSetSnapshot(slotSetSnapshotId) {
      const row = snapshots.get(slotSetSnapshotId);
      return row ? new StoredDocument(row) : null;
    },
    async getSnapshotRecoveryState(slotSnapshotRecoveryStateId) {
      const row = recoveryStates.get(slotSnapshotRecoveryStateId);
      return row ? new StoredDocument(row) : null;
    },
    async getTemporalNormalizationEnvelope(temporalNormalizationEnvelopeId) {
      const row = envelopes.get(temporalNormalizationEnvelopeId);
      return row ? new StoredDocument(row) : null;
    },
    async getSnapshotCandidateIndex(snapshotCandidateIndexId) {
      const row = candidateIndices.get(snapshotCandidateIndexId);
      return row ? new StoredDocument(row) : null;
    },
    async listProviderSearchSlices(slotSearchSessionId) {
      return (sliceRefsBySession.get(slotSearchSessionId) ?? [])
        .map((sliceId) => slices.get(sliceId))
        .filter((row): row is StoredRow<ProviderSearchSliceSnapshot> => row !== undefined)
        .map((row) => new StoredDocument(row));
    },
    async listCanonicalSlotIdentities(slotSetSnapshotId) {
      return (identityRefsBySnapshot.get(slotSetSnapshotId) ?? [])
        .map((identityId) => identities.get(identityId))
        .filter((row): row is StoredRow<CanonicalSlotIdentitySnapshot> => row !== undefined)
        .map((row) => new StoredDocument(row));
    },
    async listNormalizedSlots(slotSetSnapshotId) {
      return (normalizedSlotRefsBySnapshot.get(slotSetSnapshotId) ?? [])
        .map((slotId) => normalizedSlots.get(slotId))
        .filter((row): row is StoredRow<NormalizedSlotSnapshot> => row !== undefined)
        .map((row) => new StoredDocument(row));
    },
    async getCurrentSlotSearchSessionRef(scopeKey) {
      return currentSessionByScope.get(scopeKey) ?? null;
    },
    async getCurrentSlotSetSnapshotRef(scopeKey) {
      return currentSnapshotByScope.get(scopeKey) ?? null;
    },
    async getExecutionReplay(replayKey) {
      const row = executionReplay.get(replayKey);
      return row ? structuredClone(row) : null;
    },
    async saveSlotSearchSession(snapshot, options) {
      saveWithCas(sessions, snapshot.slotSearchSessionId, snapshot, options);
    },
    async saveProviderSearchSlice(snapshot, options) {
      saveWithCas(slices, snapshot.providerSearchSliceId, snapshot, options);
      const existing = sliceRefsBySession.get(snapshot.slotSearchSessionRef) ?? [];
      if (!existing.includes(snapshot.providerSearchSliceId)) {
        sliceRefsBySession.set(snapshot.slotSearchSessionRef, [...existing, snapshot.providerSearchSliceId]);
      }
    },
    async saveTemporalNormalizationEnvelope(snapshot, options) {
      saveWithCas(envelopes, snapshot.temporalNormalizationEnvelopeId, snapshot, options);
    },
    async saveCanonicalSlotIdentity(slotSetSnapshotId, snapshot, options) {
      saveWithCas(identities, snapshot.canonicalSlotIdentityId, snapshot, options);
      const existing = identityRefsBySnapshot.get(slotSetSnapshotId) ?? [];
      if (!existing.includes(snapshot.canonicalSlotIdentityId)) {
        identityRefsBySnapshot.set(slotSetSnapshotId, [
          ...existing,
          snapshot.canonicalSlotIdentityId,
        ]);
      }
    },
    async saveNormalizedSlot(snapshot, options) {
      saveWithCas(normalizedSlots, snapshot.normalizedSlotId, snapshot, options);
      const existing = normalizedSlotRefsBySnapshot.get(snapshot.slotSetSnapshotRef) ?? [];
      if (!existing.includes(snapshot.normalizedSlotId)) {
        normalizedSlotRefsBySnapshot.set(snapshot.slotSetSnapshotRef, [
          ...existing,
          snapshot.normalizedSlotId,
        ]);
      }
    },
    async saveSnapshotCandidateIndex(snapshot, options) {
      saveWithCas(candidateIndices, snapshot.snapshotCandidateIndexId, snapshot, options);
    },
    async saveSnapshotRecoveryState(snapshot, options) {
      saveWithCas(recoveryStates, snapshot.slotSnapshotRecoveryStateId, snapshot, options);
    },
    async saveSlotSetSnapshot(snapshot, options) {
      saveWithCas(snapshots, snapshot.slotSetSnapshotId, snapshot, options);
    },
    async setCurrentSlotSearchSessionRef(scopeKey, slotSearchSessionId) {
      currentSessionByScope.set(scopeKey, slotSearchSessionId);
    },
    async setCurrentSlotSetSnapshotRef(scopeKey, slotSetSnapshotId) {
      if (slotSetSnapshotId === null) {
        currentSnapshotByScope.delete(scopeKey);
        return;
      }
      currentSnapshotByScope.set(scopeKey, slotSetSnapshotId);
    },
    async saveExecutionReplay(replayKey, value) {
      executionReplay.set(replayKey, structuredClone(value));
    },
  };
}

function searchScopeKey(bookingCaseId: string, selectionAudience: SlotSearchSelectionAudience): string {
  return `${bookingCaseId}::${selectionAudience}::search_slots`;
}

function routeTupleHash(input: {
  routeIntentBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
}): string {
  return sha256({
    routeIntentBindingRef: input.routeIntentBindingRef,
    surfaceRouteContractRef: input.surfaceRouteContractRef,
    surfacePublicationRef: input.surfacePublicationRef,
    runtimePublicationBundleRef: input.runtimePublicationBundleRef,
  });
}

function translateSelectionAudience(
  value: SearchPolicySnapshot["selectionAudience"],
): SlotSearchSelectionAudience {
  return value === "patient_self_service" ? "patient" : "staff";
}

function buildQueryEnvelope(
  searchPolicy: SearchPolicySnapshot,
  displayTimeZone: string,
): SlotSearchQueryEnvelopeSnapshot {
  return {
    requestedStartAt: ensureIsoTimestamp(searchPolicy.timeframeEarliest, "timeframeEarliest"),
    requestedEndAt: ensureIsoTimestamp(searchPolicy.timeframeLatest, "timeframeLatest"),
    timeZone: requireRef(displayTimeZone, "displayTimeZone"),
    modality:
      searchPolicy.modality === "remote" || searchPolicy.modality === "either"
        ? (searchPolicy.modality as SlotSearchModality)
        : "in_person",
    sitePreferences: uniqueSorted(searchPolicy.sitePreference),
    sameBandReorderSlackMinutesByWindow: {
      preferred: ensureNonNegativeInteger(
        searchPolicy.sameBandReorderSlackMinutesByWindow.preferred ??
          searchPolicy.sameBandReorderSlackMinutesByWindow.early ??
          0,
        "sameBandReorderSlackMinutesByWindow.preferred",
      ),
      acceptable: ensureNonNegativeInteger(
        searchPolicy.sameBandReorderSlackMinutesByWindow.acceptable ??
          searchPolicy.sameBandReorderSlackMinutesByWindow.standard ??
          0,
        "sameBandReorderSlackMinutesByWindow.acceptable",
      ),
    },
  };
}

function parseGmtOffset(value: string): number | null {
  if (value === "GMT" || value === "UTC") {
    return 0;
  }
  const match = value.match(/^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    return null;
  }
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes);
}

function resolveTimeZoneOffsetMinutes(instant: string, timeZone: string): number | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = formatter.formatToParts(new Date(instant));
    const zoneName = parts.find((part) => part.type === "timeZoneName")?.value;
    return zoneName ? parseGmtOffset(zoneName) : null;
  } catch {
    return null;
  }
}

function localDayKey(instant: string, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(instant));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  invariant(
    year && month && day,
    "LOCAL_DAY_KEY_UNRESOLVABLE",
    `Could not resolve local day key for ${instant} in ${timeZone}.`,
  );
  return `${year}-${month}-${day}`;
}

function hasExplicitOffset(value: string): boolean {
  return /(?:Z|[+-]\d{2}:\d{2}|[+-]\d{4})$/.test(value);
}

function normalizeTemporalFields(input: {
  startAt: string;
  endAt: string;
  sourceTimeZone: string | null;
  displayTimeZone: string;
}): {
  startAt: string;
  endAt: string;
  startAtEpoch: number;
  endAtEpoch: number;
  localDayKey: string;
  sourceTimeZone: string;
  temporalValidityState: TemporalValidityState;
  dstBoundaryState: DstBoundaryState;
} {
  const startAt = requireRef(input.startAt, "startAt");
  const endAt = requireRef(input.endAt, "endAt");
  const sourceTimeZone = optionalRef(input.sourceTimeZone);

  if (!hasExplicitOffset(startAt) || !hasExplicitOffset(endAt)) {
    invariant(
      sourceTimeZone !== null,
      "TEMPORAL_TIMEZONE_MISSING",
      "Explicit offset or sourceTimeZone is required for temporal normalization.",
    );
    throw new RequestBackboneInvariantError(
      "TEMPORAL_AMBIGUOUS_LOCAL_TIME",
      "Offset-free supplier timestamps are rejected until a timezone-safe bridge exists.",
    );
  }

  const normalizedStartAt = ensureIsoTimestamp(startAt, "startAt");
  const normalizedEndAt = ensureIsoTimestamp(endAt, "endAt");
  invariant(
    compareIso(normalizedStartAt, normalizedEndAt) < 0,
    "TEMPORAL_RANGE_INVALID",
    "endAt must be later than startAt.",
  );

  const effectiveSourceTimeZone = sourceTimeZone ?? input.displayTimeZone;
  const startAtEpoch = Date.parse(normalizedStartAt);
  const endAtEpoch = Date.parse(normalizedEndAt);
  invariant(
    Number.isFinite(startAtEpoch) && Number.isFinite(endAtEpoch),
    "TEMPORAL_RANGE_INVALID",
    "Normalized timestamps must remain parseable.",
  );

  const currentOffset = resolveTimeZoneOffsetMinutes(normalizedStartAt, effectiveSourceTimeZone);
  const priorOffset = resolveTimeZoneOffsetMinutes(
    new Date(startAtEpoch - 60 * 60 * 1000).toISOString(),
    effectiveSourceTimeZone,
  );
  const laterOffset = resolveTimeZoneOffsetMinutes(
    new Date(startAtEpoch + 60 * 60 * 1000).toISOString(),
    effectiveSourceTimeZone,
  );

  let dstBoundaryState: DstBoundaryState = "unknown";
  if (currentOffset !== null && priorOffset !== null && laterOffset !== null) {
    if (priorOffset !== currentOffset && laterOffset !== currentOffset) {
      dstBoundaryState = "crosses_boundary";
    } else if (priorOffset !== currentOffset || laterOffset !== currentOffset) {
      dstBoundaryState = "adjacent_boundary";
    } else {
      dstBoundaryState = "steady";
    }
  }

  return {
    startAt: normalizedStartAt,
    endAt: normalizedEndAt,
    startAtEpoch,
    endAtEpoch,
    localDayKey: localDayKey(normalizedStartAt, input.displayTimeZone),
    sourceTimeZone: effectiveSourceTimeZone,
    temporalValidityState: "valid",
    dstBoundaryState,
  };
}

function satisfiesBookabilityMode(
  selectionAudience: SlotSearchSelectionAudience,
  bookabilityMode: SupplierBookabilityMode,
): boolean {
  if (selectionAudience === "patient") {
    return bookabilityMode === "patient_self_service" || bookabilityMode === "dual";
  }
  return bookabilityMode !== "view_only";
}

function buildCanonicalTieBreakKey(input: {
  startAtEpoch: number;
  siteId: string;
  modality: string;
  bookabilityMode: SupplierBookabilityMode;
  supplierSlotRef: string;
  inventoryLineageRef: string;
}): string {
  return [
    input.startAtEpoch.toString().padStart(16, "0"),
    input.siteId,
    input.modality,
    input.bookabilityMode,
    input.inventoryLineageRef,
    input.supplierSlotRef,
  ].join("::");
}

function deriveCoverageState(
  states: readonly SlotSearchCoverageState[],
): SlotSearchCoverageState {
  if (states.includes("failed")) {
    return "failed";
  }
  if (states.includes("timeout")) {
    return "timeout";
  }
  if (states.includes("degraded")) {
    return "degraded";
  }
  if (states.includes("partial_coverage")) {
    return "partial_coverage";
  }
  return "complete";
}

function deriveRecoveryState(input: {
  coverageState: SlotSearchCoverageState;
  candidateCount: number;
  anchorDayKey: string | null;
  reasonCodes: readonly string[];
  generatedAt: string;
}): SlotSnapshotRecoveryStateSnapshot {
  let viewState: SlotSnapshotRecoveryViewState;
  let sameShellActionRef: string | null = null;
  let supportHelpVisible = false;

  switch (input.coverageState) {
    case "complete":
      if (input.candidateCount > 0) {
        viewState = "renderable";
      } else {
        viewState = "no_supply_confirmed";
        sameShellActionRef = SAME_SHELL_SUPPORT_ACTION;
        supportHelpVisible = true;
      }
      break;
    case "partial_coverage":
      viewState = "partial_coverage";
      sameShellActionRef = SAME_SHELL_SUPPORT_ACTION;
      supportHelpVisible = true;
      break;
    case "timeout":
    case "degraded":
      viewState = input.candidateCount > 0 ? "partial_coverage" : "support_fallback";
      sameShellActionRef = SAME_SHELL_SUPPORT_ACTION;
      supportHelpVisible = true;
      break;
    case "failed":
      viewState = "support_fallback";
      sameShellActionRef = SAME_SHELL_SUPPORT_ACTION;
      supportHelpVisible = true;
      break;
  }

  return {
    slotSnapshotRecoveryStateId: normalizeRecordId(
      "slot_snapshot_recovery",
      sha256({
        coverageState: input.coverageState,
        candidateCount: input.candidateCount,
        anchorDayKey: input.anchorDayKey,
        reasonCodes: input.reasonCodes,
        generatedAt: input.generatedAt,
      }),
    ),
    slotSetSnapshotRef: "",
    viewState,
    coverageState: input.coverageState,
    anchorDayKey: input.anchorDayKey,
    reasonCodes: uniqueSorted(input.reasonCodes),
    supportHelpVisible,
    sameShellActionRef,
    generatedAt: input.generatedAt,
  };
}

function computeSnapshotChecksum(normalizedSlots: readonly NormalizedSlotSnapshot[]): string {
  return sha256(
    normalizedSlots.map((slot) => ({
      normalizedSlotId: slot.normalizedSlotId,
      canonicalSlotIdentityRef: slot.canonicalSlotIdentityRef,
      startAt: slot.startAt,
      endAt: slot.endAt,
      bookabilityMode: slot.bookabilityMode,
      sourceVersion: slot.sourceVersion,
    })),
  );
}

function selectabilityResult(
  snapshot: SlotSetSnapshotSnapshot,
  recoveryState: SlotSnapshotRecoveryStateSnapshot,
  current: SlotSnapshotSelectabilityInput,
): SlotSnapshotSelectabilityResult {
  const reasons: string[] = [];
  if (compareIso(current.now, snapshot.expiresAt) > 0) {
    reasons.push("snapshot_expired");
  }
  if (snapshot.caseVersionRef !== current.caseVersionRef) {
    reasons.push("case_version_drift");
  }
  if (snapshot.policyBundleHash !== current.policyBundleHash) {
    reasons.push("policy_bundle_drift");
  }
  if (snapshot.providerAdapterBindingHash !== current.providerAdapterBindingHash) {
    reasons.push("binding_hash_drift");
  }
  if (snapshot.capabilityTupleHash !== current.capabilityTupleHash) {
    reasons.push("capability_tuple_drift");
  }
  if (!["complete", "partial_coverage"].includes(snapshot.coverageState)) {
    reasons.push("coverage_not_selectable");
  }
  if (recoveryState.viewState === "stale_refresh_required") {
    reasons.push("snapshot_stale");
  }
  return {
    selectable: reasons.length === 0,
    failureReasonCodes: uniqueSorted(reasons),
  };
}

function staleRecoveryState(
  snapshot: SlotSetSnapshotSnapshot,
  recoveryState: SlotSnapshotRecoveryStateSnapshot,
  generatedAt: string,
  reasonCodes: readonly string[],
): SlotSnapshotRecoveryStateSnapshot {
  return {
    slotSnapshotRecoveryStateId: normalizeRecordId(
      "slot_snapshot_recovery_stale",
      sha256({
        snapshotRef: snapshot.slotSetSnapshotId,
        reasonCodes,
        generatedAt,
      }),
    ),
    slotSetSnapshotRef: snapshot.slotSetSnapshotId,
    viewState: "stale_refresh_required",
    coverageState: snapshot.coverageState,
    anchorDayKey: recoveryState.anchorDayKey,
    reasonCodes: uniqueSorted(reasonCodes),
    supportHelpVisible: recoveryState.supportHelpVisible,
    sameShellActionRef: SAME_SHELL_REFRESH_ACTION,
    generatedAt,
  };
}

function defaultPayloadArtifactRef(input: SlotSearchExecutionInput): string {
  return (
    optionalRef(input.payloadArtifactRef) ??
    `artifact://booking/search/${requireRef(input.bookingCaseId, "bookingCaseId")}/${requireRef(
      input.commandActionRecordRef,
      "commandActionRecordRef",
    )}`
  );
}

function buildSlotsFetchedEvent(input: {
  searchSession: SlotSearchSessionSnapshot;
  snapshot: SlotSetSnapshotSnapshot;
  topSlotRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
  occurredAt: string;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.slots.fetched", {
    governingRef: input.snapshot.slotSetSnapshotId,
    governingVersionRef: input.snapshot.snapshotChecksum,
    previousState: "search_pending",
    nextState: input.snapshot.coverageState,
    stateAxis: "slot_search_coverage",
    selectedSlotRef: input.topSlotRef,
    commandActionRecordRef: input.commandActionRecordRef,
    commandSettlementRef: input.commandSettlementRecordRef,
    routeIntentRef: input.routeIntentBindingRef,
    subjectRef: input.subjectRef,
    payloadArtifactRef: input.payloadArtifactRef,
    edgeCorrelationId: input.edgeCorrelationId,
    occurredAt: input.occurredAt,
  });
}

function currentDayAnchor(normalizedSlots: readonly NormalizedSlotSnapshot[]): string | null {
  return normalizedSlots[0]?.localDayKey ?? null;
}

function ensureSearchLiveTuple(
  capabilityResolution: BookingCapabilityResolutionSnapshot,
  binding: BookingProviderAdapterBindingSnapshot,
): void {
  invariant(
    capabilityResolution.requestedActionScope === "search_slots",
    "CAPABILITY_SCOPE_MISMATCH",
    "Booking capability resolution must be bound to search_slots for slot search.",
  );
  invariant(
    capabilityResolution.providerAdapterBindingRef === binding.bookingProviderAdapterBindingId,
    "BINDING_RESOLUTION_MISMATCH",
    "Capability resolution no longer references the active provider adapter binding.",
  );
}

function supportedCapabilityForSearch(capabilityState: BookingCapabilityResolutionSnapshot["capabilityState"]): boolean {
  return capabilityState === "live_self_service" || capabilityState === "live_staff_assist";
}

function defaultIdentityStrength(input: {
  supplierSlotRef: string | null;
  inventoryLineageRef: string;
}): string {
  if (input.supplierSlotRef && input.inventoryLineageRef !== "inventory_lineage_missing") {
    return "supplier_slot_plus_inventory";
  }
  if (input.supplierSlotRef) {
    return "supplier_slot_exact";
  }
  return "capacity_schedule_fallback";
}

function sortedNormalizedSlots(slots: readonly NormalizedSlotSnapshot[]): NormalizedSlotSnapshot[] {
  return [...slots].sort((left, right) => {
    const startOrder = left.startAtEpoch - right.startAtEpoch;
    if (startOrder !== 0) {
      return startOrder;
    }
    return left.canonicalTieBreakKey.localeCompare(right.canonicalTieBreakKey);
  });
}

function materializeCandidateIndex(
  snapshotId: string,
  selectionAudience: SlotSearchSelectionAudience,
  normalizedSlots: readonly NormalizedSlotSnapshot[],
  aggregateCounters: Readonly<Record<string, number>>,
): SnapshotCandidateIndexSnapshot {
  const orderedSlots = sortedNormalizedSlots(normalizedSlots);
  const buckets = new Map<string, string[]>();
  for (const slot of orderedSlots) {
    const existing = buckets.get(slot.localDayKey) ?? [];
    existing.push(slot.normalizedSlotId);
    buckets.set(slot.localDayKey, existing);
  }
  const dayBuckets: SnapshotCandidateDayBucketSnapshot[] = [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([localDayKey, normalizedSlotRefs]) => ({
      localDayKey,
      normalizedSlotRefs,
      surfacedCount: normalizedSlotRefs.length,
    }));
  return {
    snapshotCandidateIndexId: normalizeRecordId(
      "snapshot_candidate_index",
      sha256({
        snapshotId,
        selectionAudience,
        orderedSlotRefs: orderedSlots.map((slot) => slot.normalizedSlotId),
        aggregateCounters,
      }),
    ),
    slotSetSnapshotRef: snapshotId,
    selectionAudience,
    rankPlanVersion: SLOT_RANK_PLAN_VERSION,
    capacityRankProofRef: null,
    orderedSlotRefs: orderedSlots.map((slot) => slot.normalizedSlotId),
    dayBuckets,
    aggregateCounters,
    pageSize: DEFAULT_SNAPSHOT_PAGE_SIZE,
  };
}

function computeAggregateCounters(input: {
  rawReturnedCount: number;
  normalizedCount: number;
  deduplicatedCount: number;
  filteredCount: number;
  surfacedCount: number;
  rejectReasonCounters: Readonly<Record<string, number>>;
}): Readonly<Record<string, number>> {
  return {
    rawReturnedCount: input.rawReturnedCount,
    normalizedCount: input.normalizedCount,
    deduplicatedCount: input.deduplicatedCount,
    filteredCount: input.filteredCount,
    surfacedCount: input.surfacedCount,
    ...input.rejectReasonCounters,
  };
}

function buildSnapshotPage(
  orderedSlotIds: readonly string[],
  pageSize: number,
  pageNumber: number,
): readonly string[] {
  const start = Math.max(0, (pageNumber - 1) * pageSize);
  return orderedSlotIds.slice(start, start + pageSize);
}

function inferTopSlotRef(normalizedSlots: readonly NormalizedSlotSnapshot[]): string {
  return normalizedSlots[0]?.slotPublicId ?? "slot_none_available";
}

export interface Phase4SlotSearchSnapshotService {
  repositories: Phase4SlotSearchSnapshotRepositories;
  executeSlotSearch(input: SlotSearchExecutionInput): Promise<SlotSearchExecutionResult>;
  queryCurrentSlotSearch(
    bookingCaseId: string,
    selectionAudience: SlotSearchSelectionAudience,
  ): Promise<SlotSearchExecutionResult | null>;
  fetchSnapshotPage(
    slotSetSnapshotId: string,
    pageNumber: number,
    currentTuple: SlotSnapshotSelectabilityInput,
  ): Promise<SlotSearchPageResult>;
  fetchDayBucket(
    slotSetSnapshotId: string,
    localDayKey: string,
    currentTuple: SlotSnapshotSelectabilityInput,
  ): Promise<SlotSearchDayBucketResult>;
  invalidateSnapshot(
    slotSetSnapshotId: string,
    reasonCodes: readonly string[],
    invalidatedAt: string,
  ): Promise<SlotSnapshotRecoveryStateSnapshot>;
}

export function createPhase4SlotSearchSnapshotService(input?: {
  repositories?: ExtendedPhase4SlotSearchSnapshotRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase4SlotSearchSnapshotService {
  const repositories = input?.repositories ?? createPhase4SlotSearchSnapshotStore();
  const idGenerator = input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase4-booking");

  async function requireSession(slotSearchSessionId: string): Promise<SlotSearchSessionSnapshot> {
    const document = await repositories.getSlotSearchSession(slotSearchSessionId);
    invariant(document, "SLOT_SEARCH_SESSION_NOT_FOUND", `SlotSearchSession ${slotSearchSessionId} was not found.`);
    return document.toSnapshot();
  }

  async function requireSnapshot(slotSetSnapshotId: string): Promise<SlotSetSnapshotSnapshot> {
    const document = await repositories.getSlotSetSnapshot(slotSetSnapshotId);
    invariant(document, "SLOT_SET_SNAPSHOT_NOT_FOUND", `SlotSetSnapshot ${slotSetSnapshotId} was not found.`);
    return document.toSnapshot();
  }

  async function requireRecoveryState(
    slotSnapshotRecoveryStateId: string,
  ): Promise<SlotSnapshotRecoveryStateSnapshot> {
    const document = await repositories.getSnapshotRecoveryState(slotSnapshotRecoveryStateId);
    invariant(
      document,
      "SLOT_SNAPSHOT_RECOVERY_STATE_NOT_FOUND",
      `SlotSnapshotRecoveryState ${slotSnapshotRecoveryStateId} was not found.`,
    );
    return document.toSnapshot();
  }

  async function requireCandidateIndex(
    snapshotCandidateIndexId: string,
  ): Promise<SnapshotCandidateIndexSnapshot> {
    const document = await repositories.getSnapshotCandidateIndex(snapshotCandidateIndexId);
    invariant(
      document,
      "SNAPSHOT_CANDIDATE_INDEX_NOT_FOUND",
      `SnapshotCandidateIndex ${snapshotCandidateIndexId} was not found.`,
    );
    return document.toSnapshot();
  }

  async function bundleFor(
    searchSession: SlotSearchSessionSnapshot,
  ): Promise<SlotSearchExecutionResult> {
    const snapshot = await requireSnapshot(searchSession.slotSetSnapshotRef);
    const recoveryState = await requireRecoveryState(snapshot.recoveryStateRef);
    const temporalNormalizationEnvelope = await repositories.getTemporalNormalizationEnvelope(
      requireRef(searchSession.temporalNormalizationEnvelopeRef, "temporalNormalizationEnvelopeRef"),
    );
    invariant(
      temporalNormalizationEnvelope,
      "TEMPORAL_NORMALIZATION_ENVELOPE_NOT_FOUND",
      `TemporalNormalizationEnvelope ${searchSession.temporalNormalizationEnvelopeRef} was not found.`,
    );
    const providerSearchSlices = (await repositories.listProviderSearchSlices(searchSession.slotSearchSessionId)).map(
      (document) => document.toSnapshot(),
    );
    const normalizedSlots = (await repositories.listNormalizedSlots(snapshot.slotSetSnapshotId)).map((document) =>
      document.toSnapshot(),
    );
    const candidateIndex = await requireCandidateIndex(snapshot.candidateIndexRef);
    const canonicalSlotIdentities = (await repositories.listCanonicalSlotIdentities(snapshot.slotSetSnapshotId)).map(
      (document) => document.toSnapshot(),
    );
    return {
      searchSession,
      slotSetSnapshot: snapshot,
      recoveryState,
      temporalNormalizationEnvelope: temporalNormalizationEnvelope.toSnapshot(),
      providerSearchSlices,
      canonicalSlotIdentities,
      normalizedSlots,
      candidateIndex,
      emittedEvents: [],
      supersededSnapshotRefs: [],
    };
  }

  function buildFallbackSnapshot(
    input: SlotSearchExecutionInput,
    now: string,
    coverageState: SlotSearchCoverageState,
    reasonCodes: readonly string[],
  ): Omit<SlotSearchExecutionResult, "emittedEvents" | "supersededSnapshotRefs"> {
    const queryEnvelope = buildQueryEnvelope(input.searchPolicy, input.displayTimeZone);
    const sessionId = nextId(idGenerator, "slot_search_session");
    const sessionExpiresAt = addSeconds(now, input.expiresInSeconds ?? DEFAULT_SNAPSHOT_TTL_SECONDS);
    const temporalEnvelope: TemporalNormalizationEnvelopeSnapshot = {
      temporalNormalizationEnvelopeId: nextId(idGenerator, "temporal_normalization_envelope"),
      slotSearchSessionRef: sessionId,
      sourceTimeZone: input.displayTimeZone,
      displayTimeZone: input.displayTimeZone,
      clockSkewMilliseconds: 0,
      ambiguousLocalTimePolicy: AMBIGUOUS_LOCAL_TIME_POLICY,
      normalizationVersionRef: SLOT_NORMALIZATION_VERSION,
      dstBoundaryRefs: [],
      generatedAt: now,
    };
    const snapshotId = nextId(idGenerator, "slot_set_snapshot");
    const candidateIndex = materializeCandidateIndex(
      snapshotId,
      translateSelectionAudience(input.searchPolicy.selectionAudience),
      [],
      computeAggregateCounters({
        rawReturnedCount: 0,
        normalizedCount: 0,
        deduplicatedCount: 0,
        filteredCount: 0,
        surfacedCount: 0,
        rejectReasonCounters: {},
      }),
    );
    const recoveryStateSeed = deriveRecoveryState({
      coverageState,
      candidateCount: 0,
      anchorDayKey: null,
      reasonCodes,
      generatedAt: now,
    });
    const recoveryState: SlotSnapshotRecoveryStateSnapshot = {
      ...recoveryStateSeed,
      slotSetSnapshotRef: snapshotId,
    };
    const snapshot: SlotSetSnapshotSnapshot = {
      slotSetSnapshotId: snapshotId,
      searchSessionId: sessionId,
      searchPolicyRef: input.searchPolicy.policyId,
      caseVersionRef: input.caseVersionRef,
      policyBundleHash: input.searchPolicy.policyBundleHash,
      providerAdapterBindingRef: input.providerAdapterBinding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: input.providerAdapterBinding.bindingHash,
      capabilityResolutionRef: input.capabilityResolution.bookingCapabilityResolutionId,
      capabilityTupleHash: input.capabilityResolution.capabilityTupleHash,
      slotCount: 0,
      candidateCount: 0,
      snapshotChecksum: sha256({ snapshotId, reasonCodes }),
      candidateIndexRef: candidateIndex.snapshotCandidateIndexId,
      filterPlanVersion: SLOT_FILTER_PLAN_VERSION,
      rankPlanVersion: SLOT_RANK_PLAN_VERSION,
      coverageState,
      recoveryStateRef: recoveryState.slotSnapshotRecoveryStateId,
      fetchedAt: now,
      expiresAt: sessionExpiresAt,
    };
    const searchSession: SlotSearchSessionSnapshot = {
      slotSearchSessionId: sessionId,
      bookingCaseId: input.bookingCaseId,
      caseVersionRef: input.caseVersionRef,
      searchPolicyRef: input.searchPolicy.policyId,
      policyBundleHash: input.searchPolicy.policyBundleHash,
      providerAdapterBindingRef: input.providerAdapterBinding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: input.providerAdapterBinding.bindingHash,
      capabilityResolutionRef: input.capabilityResolution.bookingCapabilityResolutionId,
      capabilityTupleHash: input.capabilityResolution.capabilityTupleHash,
      selectionAudience: translateSelectionAudience(input.searchPolicy.selectionAudience),
      requestedActionScope: "search_slots",
      routeIntentBindingRef: input.capabilityResolution.routeTuple.routeIntentBindingRef,
      routeIntentTupleHash: input.capabilityResolution.routeTuple.routeTupleHash,
      surfaceRouteContractRef: input.capabilityResolution.routeTuple.surfaceRouteContractRef,
      surfacePublicationRef: input.capabilityResolution.routeTuple.surfacePublicationRef,
      runtimePublicationBundleRef: input.capabilityResolution.routeTuple.runtimePublicationBundleRef,
      providerSearchSliceRefs: [],
      slotSetSnapshotRef: snapshotId,
      coverageState,
      queryEnvelope,
      temporalNormalizationEnvelopeRef: temporalEnvelope.temporalNormalizationEnvelopeId,
      createdAt: now,
      expiresAt: sessionExpiresAt,
    };
    return {
      searchSession,
      slotSetSnapshot: snapshot,
      recoveryState,
      temporalNormalizationEnvelope: temporalEnvelope,
      providerSearchSlices: [],
      canonicalSlotIdentities: [],
      normalizedSlots: [],
      candidateIndex,
    };
  }

  async function supersedeCurrentSnapshotIfNeeded(
    bookingCaseId: string,
    selectionAudience: SlotSearchSelectionAudience,
    newSnapshotId: string,
    now: string,
  ): Promise<readonly string[]> {
    const scopeKey = searchScopeKey(bookingCaseId, selectionAudience);
    const currentSnapshotId = await repositories.getCurrentSlotSetSnapshotRef(scopeKey);
    if (!currentSnapshotId || currentSnapshotId === newSnapshotId) {
      return [];
    }
    const currentSnapshot = await requireSnapshot(currentSnapshotId);
    const currentRecovery = await requireRecoveryState(currentSnapshot.recoveryStateRef);
    const supersededRecovery = staleRecoveryState(
      currentSnapshot,
      currentRecovery,
      now,
      ["snapshot_superseded_by_refresh"],
    );
    await repositories.saveSnapshotRecoveryState(supersededRecovery);
    await repositories.saveSlotSetSnapshot({
      ...currentSnapshot,
      recoveryStateRef: supersededRecovery.slotSnapshotRecoveryStateId,
      expiresAt: now,
    });
    return [currentSnapshotId];
  }

  return {
    repositories,

    async executeSlotSearch(input) {
      ensureSearchLiveTuple(input.capabilityResolution, input.providerAdapterBinding);
      const occurredAt = ensureIsoTimestamp(input.occurredAt, "occurredAt");
      const replayKey = `${requireRef(input.bookingCaseId, "bookingCaseId")}::${requireRef(
        input.commandActionRecordRef,
        "commandActionRecordRef",
      )}`;
      const replay = await repositories.getExecutionReplay(replayKey);
      if (replay) {
        const session = await requireSession(replay.slotSearchSessionId);
        return bundleFor(session);
      }

      const selectionAudience = translateSelectionAudience(input.searchPolicy.selectionAudience);
      invariant(
        input.capabilityResolution.selectionAudience === selectionAudience,
        "CAPABILITY_AUDIENCE_MISMATCH",
        "Capability resolution selectionAudience no longer matches SearchPolicy selectionAudience.",
      );
      invariant(
        input.capabilityResolution.providerAdapterBindingHash === input.providerAdapterBinding.bindingHash,
        "BINDING_HASH_MISMATCH",
        "Capability resolution no longer matches the compiled provider adapter binding hash.",
      );
      invariant(
        input.providerAdapterBinding.actionScopeSet.includes("search_slots"),
        "BINDING_SEARCH_SCOPE_MISSING",
        "Provider adapter binding does not permit search_slots.",
      );
      invariant(
        input.providerAdapterBinding.selectionAudienceSet.includes(selectionAudience),
        "BINDING_AUDIENCE_NOT_SUPPORTED",
        "Provider adapter binding does not permit the current search audience.",
      );

      const now = occurredAt;
      const scopeKey = searchScopeKey(input.bookingCaseId, selectionAudience);

      if (
        !supportedCapabilityForSearch(input.capabilityResolution.capabilityState) ||
        input.providerAdapterBinding.bindingState !== "live"
      ) {
        const fallback = buildFallbackSnapshot(
          input,
          now,
          input.capabilityResolution.capabilityState === "blocked" ? "failed" : "degraded",
          [
            `capability_state:${input.capabilityResolution.capabilityState}`,
            `binding_state:${input.providerAdapterBinding.bindingState}`,
          ],
        );
        await repositories.saveTemporalNormalizationEnvelope(fallback.temporalNormalizationEnvelope);
        await repositories.saveSnapshotCandidateIndex(fallback.candidateIndex);
        await repositories.saveSnapshotRecoveryState(fallback.recoveryState);
        await repositories.saveSlotSetSnapshot(fallback.slotSetSnapshot);
        await repositories.saveSlotSearchSession(fallback.searchSession);
        await repositories.setCurrentSlotSearchSessionRef(scopeKey, fallback.searchSession.slotSearchSessionId);
        await repositories.setCurrentSlotSetSnapshotRef(scopeKey, fallback.slotSetSnapshot.slotSetSnapshotId);
        await repositories.saveExecutionReplay(replayKey, {
          slotSearchSessionId: fallback.searchSession.slotSearchSessionId,
          slotSetSnapshotId: fallback.slotSetSnapshot.slotSetSnapshotId,
        });
        const emittedEvent = buildSlotsFetchedEvent({
          searchSession: fallback.searchSession,
          snapshot: fallback.slotSetSnapshot,
          topSlotRef: "slot_none_available",
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          routeIntentBindingRef: input.capabilityResolution.routeTuple.routeIntentBindingRef,
          subjectRef: input.subjectRef,
          payloadArtifactRef: defaultPayloadArtifactRef(input),
          edgeCorrelationId: optionalRef(input.edgeCorrelationId) ?? fallback.searchSession.slotSearchSessionId,
          occurredAt: now,
        });
        return {
          ...fallback,
          emittedEvents: [emittedEvent],
          supersededSnapshotRefs: [],
        };
      }

      invariant(
        input.supplierWindows.length > 0,
        "SUPPLIER_WINDOWS_MISSING",
        "At least one ProviderSearchSlice window is required when capability is live for search.",
      );

      const searchSessionId = nextId(idGenerator, "slot_search_session");
      const queryEnvelope = buildQueryEnvelope(input.searchPolicy, input.displayTimeZone);
      const sessionExpiresAt = addSeconds(now, input.expiresInSeconds ?? DEFAULT_SNAPSHOT_TTL_SECONDS);

      const envelopeSourceZones = new Set<string>();
      const envelopeBoundaryRefs = new Set<string>();
      let maxClockSkewMilliseconds = 0;
      const providerSearchSlices: ProviderSearchSliceSnapshot[] = [];
      const canonicalSlotIdentityByHash = new Map<string, CanonicalSlotIdentitySnapshot>();
      const canonicalSlotIdentityRefsBySnapshot: CanonicalSlotIdentitySnapshot[] = [];
      const normalizedSlots: NormalizedSlotSnapshot[] = [];
      const rejectReasonCounters = new Map<string, number>();
      let rawReturnedCount = 0;
      let normalizedCount = 0;
      let filteredCount = 0;
      let deduplicatedCount = 0;
      let surfacedCount = 0;

      const snapshotId = nextId(idGenerator, "slot_set_snapshot");

      for (const supplierWindow of input.supplierWindows) {
        invariant(
          requireRef(supplierWindow.supplierRef, "supplierRef") === input.providerAdapterBinding.supplierRef,
          "SUPPLIER_WINDOW_BINDING_MISMATCH",
          "ProviderSearchSlice supplierRef must match the compiled provider adapter binding supplier.",
        );
        const searchWindowStartAt = ensureIsoTimestamp(
          supplierWindow.searchWindowStartAt,
          "searchWindowStartAt",
        );
        const searchWindowEndAt = ensureIsoTimestamp(
          supplierWindow.searchWindowEndAt,
          "searchWindowEndAt",
        );
        invariant(
          compareIso(searchWindowStartAt, searchWindowEndAt) < 0,
          "SUPPLIER_WINDOW_INVALID",
          "ProviderSearchSlice searchWindowEndAt must be later than searchWindowStartAt.",
        );
        const fetchStartedAt = ensureIsoTimestamp(
          optionalRef(supplierWindow.fetchStartedAt) ?? now,
          "fetchStartedAt",
        );
        const fetchCompletedAt = ensureIsoTimestamp(
          optionalRef(supplierWindow.fetchCompletedAt) ?? now,
          "fetchCompletedAt",
        );
        rawReturnedCount += supplierWindow.rawRows.length;

        const sliceRejectCounters = new Map<string, number>();
        let sliceNormalizedCount = 0;
        let sliceDeduplicatedCount = 0;
        let sliceFilteredCount = 0;
        let sliceSurfacedCount = 0;
        const sliceDegradationReasons = uniqueSorted(supplierWindow.degradationReasonRefs ?? []);
        const providerSearchSliceId = nextId(idGenerator, "provider_search_slice");

        for (const rawRow of supplierWindow.rawRows) {
          try {
            const temporal = normalizeTemporalFields({
              startAt: rawRow.startAt,
              endAt: rawRow.endAt,
              sourceTimeZone: optionalRef(rawRow.sourceTimeZone),
              displayTimeZone: input.displayTimeZone,
            });
            envelopeSourceZones.add(temporal.sourceTimeZone);
            envelopeBoundaryRefs.add(`${temporal.localDayKey}:${temporal.dstBoundaryState}`);
            sliceNormalizedCount += 1;
            normalizedCount += 1;

            const restrictions = uniqueSorted(rawRow.restrictions ?? []);
            const accessibilityTags = uniqueSorted(rawRow.accessibilityTags ?? []);
            const siteId = optionalRef(rawRow.siteId) ?? optionalRef(rawRow.locationRef) ?? "site_unknown";
            const siteName =
              optionalRef(rawRow.siteName) ?? optionalRef(rawRow.locationName) ?? siteId;
            const practitionerRef =
              optionalRef(rawRow.practitionerRef) ?? "practitioner_unspecified";
            const serviceRef = optionalRef(rawRow.serviceRef) ?? "service_unspecified";
            const scheduleOwnerRef =
              optionalRef(rawRow.scheduleOwnerRef) ?? optionalRef(rawRow.scheduleRef) ?? "schedule_owner_unspecified";
            const inventoryLineageRef =
              optionalRef(rawRow.inventoryLineageRef) ?? "inventory_lineage_missing";
            const bookabilityMode = rawRow.bookabilityMode ?? "dual";
            const canonicalTieBreakKey = buildCanonicalTieBreakKey({
              startAtEpoch: temporal.startAtEpoch,
              siteId,
              modality: requireRef(rawRow.modality, "modality"),
              bookabilityMode,
              supplierSlotRef: requireRef(rawRow.supplierSlotRef, "supplierSlotRef"),
              inventoryLineageRef,
            });
            const identityHash = sha256({
              supplierRef: input.providerAdapterBinding.supplierRef,
              supplierSlotRef: rawRow.supplierSlotRef,
              capacityUnitRef: rawRow.capacityUnitRef,
              scheduleRef: rawRow.scheduleRef,
              scheduleOwnerRef,
              locationRef: rawRow.locationRef,
              practitionerRef,
              serviceRef,
              slotStartAtEpoch: temporal.startAtEpoch,
              slotEndAtEpoch: temporal.endAtEpoch,
              modality: rawRow.modality,
              bookabilityMode,
              inventoryLineageRef,
            });
            const canonicalSlotIdentity: CanonicalSlotIdentitySnapshot = {
              canonicalSlotIdentityId: normalizeRecordId("canonical_slot_identity", identityHash),
              supplierRef: input.providerAdapterBinding.supplierRef,
              supplierSlotRef: optionalRef(rawRow.supplierSlotRef),
              capacityUnitRef: requireRef(rawRow.capacityUnitRef, "capacityUnitRef"),
              scheduleRef: requireRef(rawRow.scheduleRef, "scheduleRef"),
              locationRef: requireRef(rawRow.locationRef, "locationRef"),
              practitionerRef,
              serviceRef,
              slotStartAtEpoch: temporal.startAtEpoch,
              slotEndAtEpoch: temporal.endAtEpoch,
              modality: requireRef(rawRow.modality, "modality"),
              bookabilityMode,
              scheduleOwnerRef,
              inventoryLineageRef,
              canonicalTieBreakKey,
              identityStrength: defaultIdentityStrength({
                supplierSlotRef: optionalRef(rawRow.supplierSlotRef),
                inventoryLineageRef,
              }),
              sourceHash: identityHash,
            };

            if (!canonicalSlotIdentityByHash.has(identityHash)) {
              canonicalSlotIdentityByHash.set(identityHash, canonicalSlotIdentity);
              canonicalSlotIdentityRefsBySnapshot.push(canonicalSlotIdentity);
            } else {
              sliceDeduplicatedCount += 1;
              deduplicatedCount += 1;
              const count = (sliceRejectCounters.get("duplicate_alias_same_canonical_identity") ?? 0) + 1;
              sliceRejectCounters.set("duplicate_alias_same_canonical_identity", count);
              rejectReasonCounters.set(
                "duplicate_alias_same_canonical_identity",
                (rejectReasonCounters.get("duplicate_alias_same_canonical_identity") ?? 0) + 1,
              );
              continue;
            }

            const filterReasons: string[] = [];
            if (compareIso(temporal.startAt, queryEnvelope.requestedStartAt) < 0 ||
                compareIso(temporal.startAt, queryEnvelope.requestedEndAt) > 0) {
              filterReasons.push("outside_clinical_timeframe");
            }
            if (
              queryEnvelope.modality !== "either" &&
              requireRef(rawRow.modality, "modality") !== queryEnvelope.modality
            ) {
              filterReasons.push("incompatible_modality");
            }
            if (
              rawRow.clinicianType &&
              rawRow.clinicianType !== input.searchPolicy.clinicianType
            ) {
              filterReasons.push("incompatible_clinician_type");
            }
            if (
              queryEnvelope.sitePreferences.length > 0 &&
              !queryEnvelope.sitePreferences.includes(siteId)
            ) {
              filterReasons.push("site_or_accessibility_mismatch");
            }
            if (
              input.searchPolicy.accessibilityNeeds.length > 0 &&
              !input.searchPolicy.accessibilityNeeds.every((need) => accessibilityTags.includes(need))
            ) {
              filterReasons.push("site_or_accessibility_mismatch");
            }
            const bookableUntil = optionalRef(rawRow.bookableUntil);
            if (
              (bookableUntil && compareIso(bookableUntil, now) <= 0) ||
              compareIso(temporal.startAt, now) <= 0
            ) {
              filterReasons.push("slot_already_expired");
            }
            if (!satisfiesBookabilityMode(selectionAudience, bookabilityMode)) {
              filterReasons.push("unsupported_bookability_mode");
            }
            if (rawRow.restrictionState === "not_satisfied") {
              filterReasons.push("provider_restrictions_not_satisfied");
            }

            if (filterReasons.length > 0) {
              sliceFilteredCount += 1;
              filteredCount += 1;
              for (const reason of filterReasons) {
                sliceRejectCounters.set(reason, (sliceRejectCounters.get(reason) ?? 0) + 1);
                rejectReasonCounters.set(reason, (rejectReasonCounters.get(reason) ?? 0) + 1);
              }
              continue;
            }

            const rawPayloadRef =
              optionalRef(rawRow.rawPayloadRef) ??
              optionalRef(supplierWindow.rawPayloadRef) ??
              `payload://booking/search/${input.providerAdapterBinding.supplierRef}/${rawRow.supplierSlotRef}`;
            const rawPayloadChecksum =
              optionalRef(rawRow.rawPayloadChecksum) ??
              optionalRef(supplierWindow.rawPayloadChecksum) ??
              sha256({
                supplierSlotRef: rawRow.supplierSlotRef,
                startAt: rawRow.startAt,
                endAt: rawRow.endAt,
              });
            const normalizedSlot: NormalizedSlotSnapshot = {
              normalizedSlotId: nextId(idGenerator, "normalized_slot"),
              slotSetSnapshotRef: snapshotId,
              slotSearchSessionRef: searchSessionId,
              slotPublicId: normalizeRecordId("slot_public", sha256(identityHash)),
              supplierRef: input.providerAdapterBinding.supplierRef,
              supplierSlotId: requireRef(rawRow.supplierSlotRef, "supplierSlotRef"),
              canonicalSlotIdentityRef: canonicalSlotIdentity.canonicalSlotIdentityId,
              capacityUnitRef: requireRef(rawRow.capacityUnitRef, "capacityUnitRef"),
              scheduleId: requireRef(rawRow.scheduleRef, "scheduleRef"),
              scheduleOwnerRef,
              siteId,
              siteName,
              clinicianType:
                optionalRef(rawRow.clinicianType) ?? input.searchPolicy.clinicianType,
              modality: requireRef(rawRow.modality, "modality"),
              serviceRef,
              practitionerRef,
              locationRef: requireRef(rawRow.locationRef, "locationRef"),
              startAt: temporal.startAt,
              endAt: temporal.endAt,
              startAtEpoch: temporal.startAtEpoch,
              endAtEpoch: temporal.endAtEpoch,
              localDayKey: temporal.localDayKey,
              displayTimeZone: input.displayTimeZone,
              sourceTimeZone: temporal.sourceTimeZone,
              temporalNormalizationEnvelopeRef: "",
              temporalValidityState: temporal.temporalValidityState,
              dstBoundaryState: temporal.dstBoundaryState,
              clockSkewMilliseconds: 0,
              bookableUntil,
              continuityScore: rawRow.continuityScore ?? 0,
              restrictions,
              accessibilityTags,
              bookabilityMode,
              hardFilterMask: [],
              rankFeatures: {
                localDayKey: temporal.localDayKey,
                startAtEpoch: temporal.startAtEpoch,
                continuityScore: rawRow.continuityScore ?? 0,
                sitePreferred: queryEnvelope.sitePreferences.includes(siteId),
                bookabilityMode,
              },
              scoreExplanationRef: null,
              canonicalTieBreakKey,
              sourceVersion: optionalRef(rawRow.sourceVersionRef) ?? optionalRef(supplierWindow.sourceVersionRef),
              rawPayloadRef,
              rawPayloadChecksum,
              sourceSliceRef: providerSearchSliceId,
            };
            normalizedSlots.push(normalizedSlot);
            sliceSurfacedCount += 1;
            surfacedCount += 1;
          } catch (error) {
            if (error instanceof RequestBackboneInvariantError) {
              const reasonCode =
                error.code === "TEMPORAL_AMBIGUOUS_LOCAL_TIME"
                  ? "temporal_ambiguous_local_time"
                  : error.code === "TEMPORAL_TIMEZONE_MISSING"
                    ? "temporal_timezone_missing"
                    : "temporal_invalid_timestamp";
              sliceRejectCounters.set(reasonCode, (sliceRejectCounters.get(reasonCode) ?? 0) + 1);
              rejectReasonCounters.set(reasonCode, (rejectReasonCounters.get(reasonCode) ?? 0) + 1);
              continue;
            }
            throw error;
          }
        }

        const sliceCoverageState = supplierWindow.coverageStateHint ?? "complete";
        const rawPayloadRef =
          optionalRef(supplierWindow.rawPayloadRef) ??
          `payload://booking/search/${input.providerAdapterBinding.supplierRef}/${sha256({
            searchWindowStartAt,
            searchWindowEndAt,
            rawRows: supplierWindow.rawRows.length,
          })}`;
        const rawPayloadChecksum =
          optionalRef(supplierWindow.rawPayloadChecksum) ??
          sha256(
            supplierWindow.rawRows.map((row) => ({
              supplierSlotRef: row.supplierSlotRef,
              startAt: row.startAt,
              endAt: row.endAt,
            })),
          );
        const slice: ProviderSearchSliceSnapshot = {
          providerSearchSliceId,
          slotSearchSessionRef: searchSessionId,
          supplierRef: input.providerAdapterBinding.supplierRef,
          queryFingerprint:
            optionalRef(supplierWindow.queryFingerprint) ??
            sha256({
              searchWindowStartAt,
              searchWindowEndAt,
              modality: queryEnvelope.modality,
              sitePreferences: queryEnvelope.sitePreferences,
            }),
          supplierWindowRef: optionalRef(supplierWindow.supplierWindowRef),
          providerAdapterBindingRef: input.providerAdapterBinding.bookingProviderAdapterBindingId,
          searchWindowStartAt,
          searchWindowEndAt,
          fetchStartedAt,
          fetchCompletedAt,
          completedAt: fetchCompletedAt,
          coverageState: sliceCoverageState,
          partialReasonCode: optionalRef(supplierWindow.partialReasonCode),
          sourceVersionRef: optionalRef(supplierWindow.sourceVersionRef),
          degradationReasonRefs: sliceDegradationReasons,
          returnedRawCount: supplierWindow.rawRows.length,
          normalizedCount: sliceNormalizedCount,
          deduplicatedCount: sliceDeduplicatedCount,
          filteredCount: sliceFilteredCount,
          surfacedCount: sliceSurfacedCount,
          rawPayloadRef,
          rawPayloadChecksum,
          rejectReasonCounters: Object.fromEntries([...sliceRejectCounters.entries()].sort()),
        };
        providerSearchSlices.push(slice);
      }

      const temporalEnvelope: TemporalNormalizationEnvelopeSnapshot = {
        temporalNormalizationEnvelopeId: nextId(idGenerator, "temporal_normalization_envelope"),
        slotSearchSessionRef: searchSessionId,
        sourceTimeZone: [...envelopeSourceZones].sort()[0] ?? input.displayTimeZone,
        displayTimeZone: input.displayTimeZone,
        clockSkewMilliseconds: maxClockSkewMilliseconds,
        ambiguousLocalTimePolicy: AMBIGUOUS_LOCAL_TIME_POLICY,
        normalizationVersionRef: SLOT_NORMALIZATION_VERSION,
        dstBoundaryRefs: [...envelopeBoundaryRefs].sort(),
        generatedAt: now,
      };

      for (const normalizedSlot of normalizedSlots) {
        normalizedSlot.temporalNormalizationEnvelopeRef = temporalEnvelope.temporalNormalizationEnvelopeId;
      }
      for (const slice of providerSearchSlices) {
        // No-op, kept for explicit iteration symmetry.
        void slice;
      }

      const aggregateCoverageState = deriveCoverageState(
        providerSearchSlices.map((slice) => slice.coverageState),
      );
      const candidateIndex = materializeCandidateIndex(
        snapshotId,
        selectionAudience,
        normalizedSlots,
        computeAggregateCounters({
          rawReturnedCount,
          normalizedCount,
          deduplicatedCount,
          filteredCount,
          surfacedCount,
          rejectReasonCounters: Object.fromEntries([...rejectReasonCounters.entries()].sort()),
        }),
      );
      const recoveryStateSeed = deriveRecoveryState({
        coverageState: aggregateCoverageState,
        candidateCount: normalizedSlots.length,
        anchorDayKey: currentDayAnchor(normalizedSlots),
        reasonCodes: uniqueSorted([
          ...providerSearchSlices.flatMap((slice) => slice.degradationReasonRefs),
          ...Object.keys(Object.fromEntries(rejectReasonCounters)),
        ]),
        generatedAt: now,
      });
      const recoveryState: SlotSnapshotRecoveryStateSnapshot = {
        ...recoveryStateSeed,
        slotSetSnapshotRef: snapshotId,
      };
      const slotSetSnapshot: SlotSetSnapshotSnapshot = {
        slotSetSnapshotId: snapshotId,
        searchSessionId,
        searchPolicyRef: input.searchPolicy.policyId,
        caseVersionRef: input.caseVersionRef,
        policyBundleHash: input.searchPolicy.policyBundleHash,
        providerAdapterBindingRef: input.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash: input.providerAdapterBinding.bindingHash,
        capabilityResolutionRef: input.capabilityResolution.bookingCapabilityResolutionId,
        capabilityTupleHash: input.capabilityResolution.capabilityTupleHash,
        slotCount: normalizedSlots.length,
        candidateCount: candidateIndex.orderedSlotRefs.length,
        snapshotChecksum: computeSnapshotChecksum(normalizedSlots),
        candidateIndexRef: candidateIndex.snapshotCandidateIndexId,
        filterPlanVersion: SLOT_FILTER_PLAN_VERSION,
        rankPlanVersion: SLOT_RANK_PLAN_VERSION,
        coverageState: aggregateCoverageState,
        recoveryStateRef: recoveryState.slotSnapshotRecoveryStateId,
        fetchedAt: now,
        expiresAt: sessionExpiresAt,
      };
      const searchSession: SlotSearchSessionSnapshot = {
        slotSearchSessionId: searchSessionId,
        bookingCaseId: input.bookingCaseId,
        caseVersionRef: input.caseVersionRef,
        searchPolicyRef: input.searchPolicy.policyId,
        policyBundleHash: input.searchPolicy.policyBundleHash,
        providerAdapterBindingRef: input.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash: input.providerAdapterBinding.bindingHash,
        capabilityResolutionRef: input.capabilityResolution.bookingCapabilityResolutionId,
        capabilityTupleHash: input.capabilityResolution.capabilityTupleHash,
        selectionAudience,
        requestedActionScope: "search_slots",
        routeIntentBindingRef: input.capabilityResolution.routeTuple.routeIntentBindingRef,
        routeIntentTupleHash:
          input.capabilityResolution.routeTuple.routeTupleHash ||
          routeTupleHash(input.capabilityResolution.routeTuple),
        surfaceRouteContractRef: input.capabilityResolution.routeTuple.surfaceRouteContractRef,
        surfacePublicationRef: input.capabilityResolution.routeTuple.surfacePublicationRef,
        runtimePublicationBundleRef:
          input.capabilityResolution.routeTuple.runtimePublicationBundleRef,
        providerSearchSliceRefs: providerSearchSlices.map((slice) => slice.providerSearchSliceId),
        slotSetSnapshotRef: slotSetSnapshot.slotSetSnapshotId,
        coverageState: aggregateCoverageState,
        queryEnvelope,
        temporalNormalizationEnvelopeRef: temporalEnvelope.temporalNormalizationEnvelopeId,
        createdAt: now,
        expiresAt: sessionExpiresAt,
      };

      const supersededSnapshotRefs = await supersedeCurrentSnapshotIfNeeded(
        input.bookingCaseId,
        selectionAudience,
        slotSetSnapshot.slotSetSnapshotId,
        now,
      );

      await repositories.saveTemporalNormalizationEnvelope(temporalEnvelope);
      for (const slice of providerSearchSlices) {
        await repositories.saveProviderSearchSlice(slice);
      }
      for (const canonicalSlotIdentity of canonicalSlotIdentityRefsBySnapshot) {
        await repositories.saveCanonicalSlotIdentity(snapshotId, canonicalSlotIdentity);
      }
      for (const normalizedSlot of normalizedSlots) {
        await repositories.saveNormalizedSlot(normalizedSlot);
      }
      await repositories.saveSnapshotCandidateIndex(candidateIndex);
      await repositories.saveSnapshotRecoveryState(recoveryState);
      await repositories.saveSlotSetSnapshot(slotSetSnapshot);
      await repositories.saveSlotSearchSession(searchSession);
      await repositories.setCurrentSlotSearchSessionRef(scopeKey, searchSession.slotSearchSessionId);
      await repositories.setCurrentSlotSetSnapshotRef(scopeKey, slotSetSnapshot.slotSetSnapshotId);
      await repositories.saveExecutionReplay(replayKey, {
        slotSearchSessionId: searchSession.slotSearchSessionId,
        slotSetSnapshotId: slotSetSnapshot.slotSetSnapshotId,
      });

      const emittedEvent = buildSlotsFetchedEvent({
        searchSession,
        snapshot: slotSetSnapshot,
        topSlotRef: inferTopSlotRef(sortedNormalizedSlots(normalizedSlots)),
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        routeIntentBindingRef: input.capabilityResolution.routeTuple.routeIntentBindingRef,
        subjectRef: input.subjectRef,
        payloadArtifactRef: defaultPayloadArtifactRef(input),
        edgeCorrelationId: optionalRef(input.edgeCorrelationId) ?? searchSession.slotSearchSessionId,
        occurredAt: now,
      });

      return {
        searchSession,
        slotSetSnapshot,
        recoveryState,
        temporalNormalizationEnvelope: temporalEnvelope,
        providerSearchSlices,
        canonicalSlotIdentities: canonicalSlotIdentityRefsBySnapshot,
        normalizedSlots: sortedNormalizedSlots(normalizedSlots),
        candidateIndex,
        emittedEvents: [emittedEvent],
        supersededSnapshotRefs,
      };
    },

    async queryCurrentSlotSearch(bookingCaseId, selectionAudience) {
      const currentSnapshotRef = await repositories.getCurrentSlotSetSnapshotRef(
        searchScopeKey(bookingCaseId, selectionAudience),
      );
      if (!currentSnapshotRef) {
        return null;
      }
      const snapshot = await requireSnapshot(currentSnapshotRef);
      const session = await requireSession(snapshot.searchSessionId);
      return bundleFor(session);
    },

    async fetchSnapshotPage(slotSetSnapshotId, pageNumber, currentTuple) {
      const snapshot = await requireSnapshot(slotSetSnapshotId);
      const recoveryState = await requireRecoveryState(snapshot.recoveryStateRef);
      const searchSession = await requireSession(snapshot.searchSessionId);
      const candidateIndex = await requireCandidateIndex(snapshot.candidateIndexRef);
      const slotsById = new Map(
        (await repositories.listNormalizedSlots(snapshot.slotSetSnapshotId)).map((document) => {
          const slot = document.toSnapshot();
          return [slot.normalizedSlotId, slot] as const;
        }),
      );
      const selectability = selectabilityResult(snapshot, recoveryState, currentTuple);
      const effectiveRecoveryState = selectability.selectable
        ? recoveryState
        : staleRecoveryState(snapshot, recoveryState, currentTuple.now, selectability.failureReasonCodes);
      const totalPages = Math.max(
        1,
        Math.ceil(candidateIndex.orderedSlotRefs.length / candidateIndex.pageSize),
      );
      const pageRefs = buildSnapshotPage(
        candidateIndex.orderedSlotRefs,
        candidateIndex.pageSize,
        ensurePositiveInteger(pageNumber, "pageNumber"),
      );
      return {
        searchSession,
        slotSetSnapshot: snapshot,
        recoveryState,
        effectiveRecoveryState,
        candidateIndex,
        pageNumber,
        totalPages,
        slots: pageRefs
          .map((slotId) => slotsById.get(slotId))
          .filter((slot): slot is NormalizedSlotSnapshot => slot !== undefined),
        selectable: selectability.selectable,
        failureReasonCodes: selectability.failureReasonCodes,
      };
    },

    async fetchDayBucket(slotSetSnapshotId, localDayKeyInput, currentTuple) {
      const localDayKey = requireRef(localDayKeyInput, "localDayKey");
      const snapshot = await requireSnapshot(slotSetSnapshotId);
      const recoveryState = await requireRecoveryState(snapshot.recoveryStateRef);
      const searchSession = await requireSession(snapshot.searchSessionId);
      const candidateIndex = await requireCandidateIndex(snapshot.candidateIndexRef);
      const dayBucket = candidateIndex.dayBuckets.find((bucket) => bucket.localDayKey === localDayKey);
      invariant(dayBucket, "SNAPSHOT_DAY_BUCKET_NOT_FOUND", `Day bucket ${localDayKey} was not found.`);
      const slotsById = new Map(
        (await repositories.listNormalizedSlots(snapshot.slotSetSnapshotId)).map((document) => {
          const slot = document.toSnapshot();
          return [slot.normalizedSlotId, slot] as const;
        }),
      );
      const selectability = selectabilityResult(snapshot, recoveryState, currentTuple);
      const effectiveRecoveryState = selectability.selectable
        ? recoveryState
        : staleRecoveryState(snapshot, recoveryState, currentTuple.now, selectability.failureReasonCodes);
      return {
        searchSession,
        slotSetSnapshot: snapshot,
        recoveryState,
        effectiveRecoveryState,
        candidateIndex,
        localDayKey,
        slots: dayBucket.normalizedSlotRefs
          .map((slotId) => slotsById.get(slotId))
          .filter((slot): slot is NormalizedSlotSnapshot => slot !== undefined),
        selectable: selectability.selectable,
        failureReasonCodes: selectability.failureReasonCodes,
      };
    },

    async invalidateSnapshot(slotSetSnapshotId, reasonCodes, invalidatedAtInput) {
      const invalidatedAt = ensureIsoTimestamp(invalidatedAtInput, "invalidatedAt");
      const snapshot = await requireSnapshot(slotSetSnapshotId);
      const recoveryState = await requireRecoveryState(snapshot.recoveryStateRef);
      const nextRecovery = staleRecoveryState(
        snapshot,
        recoveryState,
        invalidatedAt,
        uniqueSorted([...reasonCodes, "explicit_invalidation"]),
      );
      await repositories.saveSnapshotRecoveryState(nextRecovery);
      await repositories.saveSlotSetSnapshot({
        ...snapshot,
        recoveryStateRef: nextRecovery.slotSnapshotRecoveryStateId,
        expiresAt: invalidatedAt,
      });
      const searchSession = await requireSession(snapshot.searchSessionId);
      await repositories.setCurrentSlotSetSnapshotRef(
        searchScopeKey(searchSession.bookingCaseId, searchSession.selectionAudience),
        null,
      );
      return nextRecovery;
    },
  };
}
