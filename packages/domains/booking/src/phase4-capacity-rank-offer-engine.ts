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
import type { SearchPolicySnapshot } from "./phase4-booking-case-kernel";
import type {
  BookingCapabilityResolutionSnapshot,
  BookingProviderAdapterBindingSnapshot,
  BookingSelectionAudience,
} from "./phase4-booking-capability-engine";
import type {
  NormalizedSlotSnapshot,
  SlotSearchCoverageState,
  SlotSetSnapshotSnapshot,
  SnapshotCandidateIndexSnapshot,
  SlotSnapshotRecoveryStateSnapshot,
} from "./phase4-slot-search-snapshot-pipeline";

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
    `${field} must be between 0 and 1.`,
  );
  return value;
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort() as T[];
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function addSeconds(timestamp: string, seconds: number): string {
  const date = new Date(timestamp);
  date.setUTCSeconds(date.getUTCSeconds() + seconds);
  return date.toISOString();
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

function normalizeRecordId(prefix: string, digest: string): string {
  return `${prefix}_${digest.slice(0, 24)}`;
}

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function midpointMinutes(instantStart: string, instantEnd: string, timeZone: string): number {
  const midpointEpoch = Math.floor((Date.parse(instantStart) + Date.parse(instantEnd)) / 2);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(new Date(midpointEpoch));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function quantizeUnit(value: number): bigint {
  const clamped = Math.min(1, Math.max(0, value));
  return BigInt(Math.round(clamped * 1_000_000));
}

function decodeMidpointPreference(summary: string | null | undefined): number {
  const normalized = (summary ?? "").toLowerCase();
  if (normalized.includes("morning")) {
    return 9 * 60 + 30;
  }
  if (normalized.includes("afternoon")) {
    return 14 * 60;
  }
  if (normalized.includes("evening")) {
    return 18 * 60;
  }
  return 12 * 60;
}

const PHASE4_CAPACITY_RANK_SCHEMA_VERSION =
  "285.phase4.slot-scoring-offer-orchestration.v1" as const;
const RANK_PLAN_VERSION = "285.rank-plan.local-booking.v1" as const;
const DISCLOSURE_POLICY_VERSION = "285.capacity-rank-disclosure-policy.v1" as const;
const STABLE_TIE_BREAK_RULE = "canonicalTieBreakKey ascending" as const;
const DEFAULT_OFFER_SESSION_TTL_SECONDS = 900;
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PREFERRED_WINDOW_CAP_MINUTES = 2880;
const SCALE = 1_000_000n;
const HALF_SCALE = 500_000n;

export type CapacityRankFrontierState =
  | "frontier_ranked"
  | "non_frontier"
  | "dominated_removed"
  | "filtered_out"
  | "explanation_only";

export type CapacityRankSourceTrustState =
  | "trusted"
  | "degraded"
  | "quarantined"
  | "not_applicable";

export type CapacityRankDominanceDisposition =
  | "none"
  | "retained"
  | "removed_by_dominance"
  | "retained_after_tie";

export type CapacityRankDisclosureSurfaceFamily =
  | "patient_booking"
  | "staff_booking"
  | "support_replay"
  | "operations_capacity";

export type OfferTruthMode =
  | "truthful_nonexclusive"
  | "exclusive_hold"
  | "degraded_manual_pending";

export type OfferHoldSupportState =
  | "not_supported"
  | "supported_later"
  | "degraded_manual_only";

export type OfferSessionState =
  | "offerable"
  | "branch_only"
  | "selected"
  | "superseded"
  | "expired"
  | "recovery_only";

export type OfferCandidateOfferabilityState =
  | "patient_self_service"
  | "staff_assist_only"
  | "staff_and_patient";

export type OfferContinuationBranchRef =
  | "join_local_waitlist"
  | "assisted_callback"
  | "fallback_to_hub";

export interface RankPlanWeightsSnapshot {
  w_delay: number;
  w_continuity: number;
  w_site: number;
  w_tod: number;
  w_travel: number;
  w_modality: number;
}

export interface RankPlanTausSnapshot {
  tau_delay: number;
  tau_tod: number;
  tau_travel: number;
}

export interface RankPlanSnapshot {
  rankPlanId: string;
  rankPlanVersion: typeof RANK_PLAN_VERSION;
  searchPolicyRef: string;
  policyBundleHash: string;
  preferredWindowMinutes: number;
  acceptableWindowMinutes: number;
  sameBandReorderSlackMinutesByWindow: {
    preferred: number;
    acceptable: number;
  };
  weights: RankPlanWeightsSnapshot;
  taus: RankPlanTausSnapshot;
  stableTieBreakRule: typeof STABLE_TIE_BREAK_RULE;
  compiledAt: string;
}

export interface CapacityRankDisclosurePolicySnapshot {
  capacityRankDisclosurePolicyId: string;
  surfaceFamily: CapacityRankDisclosureSurfaceFamily;
  audienceTier: "patient" | "staff" | "support" | "operations";
  patientSafeFields: readonly string[];
  staffReplayFields: readonly string[];
  operationsFields: readonly string[];
  policyState: "active" | "superseded";
  publishedAt: string;
  policyVersionRef: typeof DISCLOSURE_POLICY_VERSION;
}

export interface CapacityRankFeatureVectorSnapshot {
  waitMinutes: number;
  midpointLocalMinutes: number;
  preferredMidpointMinutes: number;
  travelMinutesProxy: number;
  continuityScore: number;
  f_delay_micros: number;
  f_continuity_micros: number;
  f_site_micros: number;
  f_tod_micros: number;
  f_travel_micros: number;
  f_modality_micros: number;
}

export interface CapacityRankExplanationSnapshot {
  capacityRankExplanationId: string;
  capacityRankProofRef: string;
  candidateRef: string;
  canonicalSlotIdentityRef: string;
  normalizedSlotRef: string;
  rankOrdinal: number;
  windowClass: 0 | 1 | 2;
  frontierState: CapacityRankFrontierState;
  sourceTrustState: CapacityRankSourceTrustState;
  normalizedFeatureVector: CapacityRankFeatureVectorSnapshot;
  reasonCodeRefs: readonly string[];
  patientReasonCueRefs: readonly string[];
  staffExplanationRefs: readonly string[];
  supportExplanationRefs: readonly string[];
  opsDiagnosticRefs: readonly string[];
  uncertaintyRadius: number;
  robustFit: "deterministic";
  dominanceDisposition: CapacityRankDominanceDisposition;
  canonicalTieBreakKey: string;
  rankPlanVersionRef: typeof RANK_PLAN_VERSION;
  explanationTupleHash: string;
  generatedAt: string;
}

export interface RankedOfferCandidateSnapshot {
  offerCandidateId: string;
  offerSessionRef: string;
  capacityRankProofRef: string;
  normalizedSlotRef: string;
  canonicalSlotIdentityRef: string;
  candidateRank: number;
  candidateHash: string;
  selectionAudience: BookingSelectionAudience;
  offerabilityState: OfferCandidateOfferabilityState;
  windowClass: 0 | 1 | 2;
  frontierMembership: boolean;
  softScoreMicros: number;
  patientReasonCueRefs: readonly string[];
  capacityRankExplanationRef: string;
  slotSnapshot: NormalizedSlotSnapshot;
}

export interface CapacityRankProofSnapshot {
  capacityRankProofId: string;
  rankingScope: "local_booking";
  sourceSnapshotRef: string;
  sourceDecisionPlanRef: string | null;
  rankPlanRef: string;
  rankPlanVersionRef: typeof RANK_PLAN_VERSION;
  candidateUniverseHash: string;
  orderedCandidateRefs: readonly string[];
  frontierCandidateRefs: readonly string[];
  dominatedCandidateRefs: readonly string[];
  patientOfferableCandidateRefs: readonly string[];
  explanationRefs: readonly string[];
  tieBreakSchemaRef: typeof STABLE_TIE_BREAK_RULE;
  proofChecksum: string;
  generatedAt: string;
  supersededAt: string | null;
}

export interface OfferContinuationBranchSnapshot {
  branchRef: OfferContinuationBranchRef;
  branchReasonCode: string;
  dominant: boolean;
}

export interface OfferSessionSnapshot {
  offerSessionId: string;
  bookingCaseId: string;
  slotSetSnapshotRef: string;
  rankPlanRef: string;
  rankPlanVersion: typeof RANK_PLAN_VERSION;
  capacityRankProofRef: string;
  capacityRankDisclosurePolicyRef: string;
  capabilityResolutionRef: string;
  capabilityTupleHash: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  searchPolicyRef: string;
  selectionAudience: BookingSelectionAudience;
  offeredCandidateRefs: readonly string[];
  selectedOfferCandidateRef: string | null;
  selectedNormalizedSlotRef: string | null;
  selectedCanonicalSlotIdentityRef: string | null;
  selectedCandidateHash: string | null;
  reservationTruthProjectionRef: string;
  selectionToken: string;
  selectionProofHash: string;
  truthMode: OfferTruthMode;
  holdSupportState: OfferHoldSupportState;
  compareModeState: "list" | "calendar" | "compare";
  expiresAt: string;
  sessionState: OfferSessionState;
  dominantActionRef: string | null;
  continuationBranches: readonly OfferContinuationBranchSnapshot[];
  createdAt: string;
  supersededAt: string | null;
}

export interface OfferSessionTupleInput {
  bookingCaseId: string;
  caseVersionRef: string;
  policyBundleHash: string;
  providerAdapterBindingHash: string;
  capabilityTupleHash: string;
  currentSlotSetSnapshotRef: string;
  now: string;
}

export interface OfferSessionCompilationInput {
  bookingCaseId: string;
  searchPolicy: SearchPolicySnapshot;
  capabilityResolution: BookingCapabilityResolutionSnapshot;
  providerAdapterBinding: BookingProviderAdapterBindingSnapshot;
  slotSetSnapshot: SlotSetSnapshotSnapshot;
  recoveryState: SlotSnapshotRecoveryStateSnapshot;
  candidateIndex: SnapshotCandidateIndexSnapshot;
  normalizedSlots: readonly NormalizedSlotSnapshot[];
  patientPreferenceSummary?: string | null;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  occurredAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  offerSessionTtlSeconds?: number;
}

export interface SelectOfferCandidateInput {
  offerSessionId: string;
  offerCandidateId: string;
  selectionToken: string;
  selectionProofHash: string;
  currentTuple: OfferSessionTupleInput;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  occurredAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface OfferSessionCompilationResult {
  rankPlan: RankPlanSnapshot;
  disclosurePolicy: CapacityRankDisclosurePolicySnapshot;
  capacityRankProof: CapacityRankProofSnapshot;
  explanations: readonly CapacityRankExplanationSnapshot[];
  offerCandidates: readonly RankedOfferCandidateSnapshot[];
  offerSession: OfferSessionSnapshot;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
  supersededOfferSessionRefs: readonly string[];
}

export interface OfferSessionReadResult {
  rankPlan: RankPlanSnapshot;
  disclosurePolicy: CapacityRankDisclosurePolicySnapshot;
  capacityRankProof: CapacityRankProofSnapshot;
  explanations: readonly CapacityRankExplanationSnapshot[];
  offerCandidates: readonly RankedOfferCandidateSnapshot[];
  offerSession: OfferSessionSnapshot;
}

export interface OfferSessionPageResult extends OfferSessionReadResult {
  pageNumber: number;
  totalPages: number;
  candidates: readonly RankedOfferCandidateSnapshot[];
  selectable: boolean;
  failureReasonCodes: readonly string[];
}

export interface OfferSessionCompareResult extends OfferSessionReadResult {
  candidates: readonly RankedOfferCandidateSnapshot[];
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

export interface Phase4CapacityRankRepositories {
  getRankPlan(rankPlanId: string): Promise<SnapshotDocument<RankPlanSnapshot> | null>;
  getDisclosurePolicy(
    capacityRankDisclosurePolicyId: string,
  ): Promise<SnapshotDocument<CapacityRankDisclosurePolicySnapshot> | null>;
  getCapacityRankProof(
    capacityRankProofId: string,
  ): Promise<SnapshotDocument<CapacityRankProofSnapshot> | null>;
  getOfferSession(offerSessionId: string): Promise<SnapshotDocument<OfferSessionSnapshot> | null>;
  getCurrentOfferSessionRef(scopeKey: string): Promise<string | null>;
  listExplanations(
    capacityRankProofId: string,
  ): Promise<readonly SnapshotDocument<CapacityRankExplanationSnapshot>[]>;
  listOfferCandidates(
    offerSessionId: string,
  ): Promise<readonly SnapshotDocument<RankedOfferCandidateSnapshot>[]>;
  getCompilationReplay(
    replayKey: string,
  ): Promise<{ offerSessionId: string; capacityRankProofId: string } | null>;
  getSelectionReplay(
    replayKey: string,
  ): Promise<{ offerSessionId: string; selectedOfferCandidateRef: string } | null>;
}

interface ExtendedPhase4CapacityRankRepositories extends Phase4CapacityRankRepositories {
  saveRankPlan(snapshot: RankPlanSnapshot, options?: CompareAndSetWriteOptions): Promise<void>;
  saveDisclosurePolicy(
    snapshot: CapacityRankDisclosurePolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveCapacityRankProof(
    snapshot: CapacityRankProofSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveExplanation(
    snapshot: CapacityRankExplanationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveOfferCandidate(
    snapshot: RankedOfferCandidateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveOfferSession(
    snapshot: OfferSessionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  setCurrentOfferSessionRef(scopeKey: string, offerSessionId: string): Promise<void>;
  saveCompilationReplay(
    replayKey: string,
    replay: { offerSessionId: string; capacityRankProofId: string },
  ): Promise<void>;
  saveSelectionReplay(
    replayKey: string,
    replay: { offerSessionId: string; selectedOfferCandidateRef: string },
  ): Promise<void>;
}

export function createPhase4CapacityRankStore(): ExtendedPhase4CapacityRankRepositories {
  const rankPlans = new Map<string, StoredRow<RankPlanSnapshot>>();
  const disclosurePolicies = new Map<string, StoredRow<CapacityRankDisclosurePolicySnapshot>>();
  const proofs = new Map<string, StoredRow<CapacityRankProofSnapshot>>();
  const explanations = new Map<string, StoredRow<CapacityRankExplanationSnapshot>>();
  const explanationRefsByProof = new Map<string, string[]>();
  const offerCandidates = new Map<string, StoredRow<RankedOfferCandidateSnapshot>>();
  const candidateRefsBySession = new Map<string, string[]>();
  const offerSessions = new Map<string, StoredRow<OfferSessionSnapshot>>();
  const currentOfferSessionByScope = new Map<string, string>();
  const compilationReplay = new Map<string, { offerSessionId: string; capacityRankProofId: string }>();
  const selectionReplay = new Map<string, { offerSessionId: string; selectedOfferCandidateRef: string }>();

  return {
    async getRankPlan(rankPlanId) {
      const row = rankPlans.get(rankPlanId);
      return row ? new StoredDocument(row) : null;
    },
    async getDisclosurePolicy(capacityRankDisclosurePolicyId) {
      const row = disclosurePolicies.get(capacityRankDisclosurePolicyId);
      return row ? new StoredDocument(row) : null;
    },
    async getCapacityRankProof(capacityRankProofId) {
      const row = proofs.get(capacityRankProofId);
      return row ? new StoredDocument(row) : null;
    },
    async getOfferSession(offerSessionId) {
      const row = offerSessions.get(offerSessionId);
      return row ? new StoredDocument(row) : null;
    },
    async getCurrentOfferSessionRef(scopeKey) {
      return currentOfferSessionByScope.get(scopeKey) ?? null;
    },
    async listExplanations(capacityRankProofId) {
      return (explanationRefsByProof.get(capacityRankProofId) ?? [])
        .map((ref) => explanations.get(ref))
        .filter((row): row is StoredRow<CapacityRankExplanationSnapshot> => row !== undefined)
        .map((row) => new StoredDocument(row));
    },
    async listOfferCandidates(offerSessionId) {
      return (candidateRefsBySession.get(offerSessionId) ?? [])
        .map((ref) => offerCandidates.get(ref))
        .filter((row): row is StoredRow<RankedOfferCandidateSnapshot> => row !== undefined)
        .map((row) => new StoredDocument(row));
    },
    async getCompilationReplay(replayKey) {
      return structuredClone(compilationReplay.get(replayKey) ?? null);
    },
    async getSelectionReplay(replayKey) {
      return structuredClone(selectionReplay.get(replayKey) ?? null);
    },
    async saveRankPlan(snapshot, options) {
      saveWithCas(rankPlans, snapshot.rankPlanId, snapshot, options);
    },
    async saveDisclosurePolicy(snapshot, options) {
      saveWithCas(
        disclosurePolicies,
        snapshot.capacityRankDisclosurePolicyId,
        snapshot,
        options,
      );
    },
    async saveCapacityRankProof(snapshot, options) {
      saveWithCas(proofs, snapshot.capacityRankProofId, snapshot, options);
    },
    async saveExplanation(snapshot, options) {
      saveWithCas(explanations, snapshot.capacityRankExplanationId, snapshot, options);
      const existing = explanationRefsByProof.get(snapshot.capacityRankProofRef) ?? [];
      if (!existing.includes(snapshot.capacityRankExplanationId)) {
        explanationRefsByProof.set(snapshot.capacityRankProofRef, [
          ...existing,
          snapshot.capacityRankExplanationId,
        ]);
      }
    },
    async saveOfferCandidate(snapshot, options) {
      saveWithCas(offerCandidates, snapshot.offerCandidateId, snapshot, options);
      const existing = candidateRefsBySession.get(snapshot.offerSessionRef) ?? [];
      if (!existing.includes(snapshot.offerCandidateId)) {
        candidateRefsBySession.set(snapshot.offerSessionRef, [...existing, snapshot.offerCandidateId]);
      }
    },
    async saveOfferSession(snapshot, options) {
      saveWithCas(offerSessions, snapshot.offerSessionId, snapshot, options);
    },
    async setCurrentOfferSessionRef(scopeKey, offerSessionId) {
      currentOfferSessionByScope.set(scopeKey, offerSessionId);
    },
    async saveCompilationReplay(replayKey, replay) {
      compilationReplay.set(replayKey, structuredClone(replay));
    },
    async saveSelectionReplay(replayKey, replay) {
      selectionReplay.set(replayKey, structuredClone(replay));
    },
  };
}

function offerScopeKey(bookingCaseId: string, selectionAudience: BookingSelectionAudience): string {
  return `${bookingCaseId}::${selectionAudience}::offer_session`;
}

function normalizeSlack(searchPolicy: SearchPolicySnapshot): { preferred: number; acceptable: number } {
  return {
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
  };
}

function compileRankPlan(searchPolicy: SearchPolicySnapshot, occurredAt: string): RankPlanSnapshot {
  const timeframeEarliestEpoch = Date.parse(ensureIsoTimestamp(searchPolicy.timeframeEarliest, "timeframeEarliest"));
  const timeframeLatestEpoch = Date.parse(ensureIsoTimestamp(searchPolicy.timeframeLatest, "timeframeLatest"));
  invariant(
    timeframeLatestEpoch >= timeframeEarliestEpoch,
    "SEARCH_POLICY_TIMEFRAME_INVALID",
    "SearchPolicy timeframeLatest must not be earlier than timeframeEarliest.",
  );
  const spanMinutes = Math.max(
    0,
    Math.round((timeframeLatestEpoch - timeframeEarliestEpoch) / 60000),
  );
  const preferredWindowMinutes = Math.min(spanMinutes, DEFAULT_PREFERRED_WINDOW_CAP_MINUTES);
  const acceptableWindowMinutes = spanMinutes;
  const sameBandReorderSlackMinutesByWindow = normalizeSlack(searchPolicy);
  const weights: RankPlanWeightsSnapshot = {
    w_delay: 0.36,
    w_continuity: 0.21,
    w_site: 0.14,
    w_tod: 0.12,
    w_travel: 0.1,
    w_modality: 0.07,
  };
  const weightSum = Object.values(weights).reduce((sum, value) => sum + value, 0);
  invariant(
    Math.abs(weightSum - 1) < 1e-9,
    "RANK_PLAN_WEIGHT_SUM_INVALID",
    "RankPlan weights must sum to 1.",
  );
  const rankPlanDigest = sha256({
    policyBundleHash: searchPolicy.policyBundleHash,
    preferredWindowMinutes,
    acceptableWindowMinutes,
    sameBandReorderSlackMinutesByWindow,
    weights,
    taus: { tau_delay: 240, tau_tod: 120, tau_travel: 60 },
    stableTieBreakRule: STABLE_TIE_BREAK_RULE,
  });
  return {
    rankPlanId: normalizeRecordId("rank_plan", rankPlanDigest),
    rankPlanVersion: RANK_PLAN_VERSION,
    searchPolicyRef: searchPolicy.policyId,
    policyBundleHash: searchPolicy.policyBundleHash,
    preferredWindowMinutes,
    acceptableWindowMinutes,
    sameBandReorderSlackMinutesByWindow,
    weights,
    taus: {
      tau_delay: 240,
      tau_tod: 120,
      tau_travel: 60,
    },
    stableTieBreakRule: STABLE_TIE_BREAK_RULE,
    compiledAt: occurredAt,
  };
}

function buildDisclosurePolicy(
  selectionAudience: BookingSelectionAudience,
): CapacityRankDisclosurePolicySnapshot {
  const surfaceFamily =
    selectionAudience === "patient" ? "patient_booking" : "staff_booking";
  return {
    capacityRankDisclosurePolicyId: `capacity_rank_disclosure_policy_${surfaceFamily}`,
    surfaceFamily,
    audienceTier: selectionAudience === "patient" ? "patient" : "staff",
    patientSafeFields: ["patientReasonCueRefs", "windowClass"],
    staffReplayFields: [
      "windowClass",
      "frontierState",
      "normalizedFeatureVector",
      "reasonCodeRefs",
      "canonicalTieBreakKey",
    ],
    operationsFields: [
      "windowClass",
      "frontierState",
      "normalizedFeatureVector",
      "reasonCodeRefs",
      "opsDiagnosticRefs",
      "canonicalTieBreakKey",
    ],
    policyState: "active",
    publishedAt: "2026-04-18T00:00:00.000Z",
    policyVersionRef: DISCLOSURE_POLICY_VERSION,
  };
}

function supportsAudienceBookability(
  selectionAudience: BookingSelectionAudience,
  bookabilityMode: NormalizedSlotSnapshot["bookabilityMode"],
): boolean {
  if (selectionAudience === "patient") {
    return bookabilityMode === "patient_self_service" || bookabilityMode === "dual";
  }
  return bookabilityMode !== "view_only";
}

function patientOfferable(bookabilityMode: NormalizedSlotSnapshot["bookabilityMode"]): boolean {
  return bookabilityMode === "patient_self_service" || bookabilityMode === "dual";
}

function deriveOfferabilityState(
  bookabilityMode: NormalizedSlotSnapshot["bookabilityMode"],
): OfferCandidateOfferabilityState {
  if (bookabilityMode === "staff_assist_only") {
    return "staff_assist_only";
  }
  if (bookabilityMode === "patient_self_service") {
    return "patient_self_service";
  }
  return "staff_and_patient";
}

function inferHardFilterReasons(
  slot: NormalizedSlotSnapshot,
  searchPolicy: SearchPolicySnapshot,
  selectionAudience: BookingSelectionAudience,
): readonly string[] {
  const reasons = new Set<string>();
  const timeframeLatest = Date.parse(ensureIsoTimestamp(searchPolicy.timeframeLatest, "timeframeLatest"));
  if (slot.startAtEpoch > timeframeLatest) {
    reasons.add("beyond_clinically_safe_latest_date");
  }
  if (searchPolicy.modality !== "either" && slot.modality !== searchPolicy.modality) {
    reasons.add("wrong_modality");
  }
  if (slot.clinicianType !== searchPolicy.clinicianType) {
    reasons.add("wrong_clinician_type");
  }
  if (
    searchPolicy.accessibilityNeeds.length > 0 &&
    !searchPolicy.accessibilityNeeds.every((need) => slot.accessibilityTags.includes(need))
  ) {
    reasons.add("incompatible_accessibility_needs");
  }
  if (!supportsAudienceBookability(selectionAudience, slot.bookabilityMode)) {
    reasons.add("not_bookable_by_current_actor_mode");
  }
  if (
    slot.restrictions.some(
      (restriction) =>
        restriction.includes("patient_exclusion") ||
        restriction.includes("linkage") ||
        restriction.includes("bookability_blocked"),
    )
  ) {
    reasons.add("patient_exclusions_or_linkage_problem");
  }
  return [...reasons].sort();
}

function siteTravelMinutesProxy(searchPolicy: SearchPolicySnapshot, siteId: string): number {
  const siteIndex = searchPolicy.sitePreference.indexOf(siteId);
  if (siteIndex === 0) {
    return 0;
  }
  if (siteIndex > 0) {
    return Math.min(searchPolicy.maxTravelTime, 10 + siteIndex * 10);
  }
  if (searchPolicy.sitePreference.length === 0) {
    return Math.min(searchPolicy.maxTravelTime, 20);
  }
  return searchPolicy.maxTravelTime;
}

function windowClassForSlot(
  slot: NormalizedSlotSnapshot,
  searchPolicy: SearchPolicySnapshot,
  rankPlan: RankPlanSnapshot,
): 0 | 1 | 2 {
  const start = Date.parse(ensureIsoTimestamp(searchPolicy.timeframeEarliest, "timeframeEarliest"));
  const preferredCutoff = start + rankPlan.preferredWindowMinutes * 60_000;
  const acceptableCutoff = Date.parse(
    ensureIsoTimestamp(searchPolicy.timeframeLatest, "timeframeLatest"),
  );
  if (slot.startAtEpoch <= preferredCutoff) {
    return 2;
  }
  if (slot.startAtEpoch <= acceptableCutoff) {
    return 1;
  }
  return 0;
}

interface CandidateComputation {
  slot: NormalizedSlotSnapshot;
  offerCandidateId: string;
  candidateHash: string;
  offerabilityState: OfferCandidateOfferabilityState;
  waitMinutes: number;
  midpointLocalMinutes: number;
  preferredMidpointMinutes: number;
  travelMinutesProxy: number;
  windowClass: 0 | 1 | 2;
  frontierMembership: boolean;
  softScoreMicros: number;
  featureVector: CapacityRankFeatureVectorSnapshot;
  reasonCodeRefs: readonly string[];
  patientReasonCueRefs: readonly string[];
  staffExplanationRefs: readonly string[];
  supportExplanationRefs: readonly string[];
  opsDiagnosticRefs: readonly string[];
}

function reasonCuesForCandidate(input: {
  slot: NormalizedSlotSnapshot;
  rankOrdinal: number;
  windowClass: 0 | 1 | 2;
  featureVector: CapacityRankFeatureVectorSnapshot;
  searchPolicy: SearchPolicySnapshot;
}): readonly string[] {
  const cues: string[] = [];
  if (input.rankOrdinal === 1 && input.windowClass >= 1) {
    cues.push("cue_soonest");
  }
  if (input.featureVector.f_continuity_micros >= 700_000) {
    cues.push("cue_best_match");
  }
  if (input.featureVector.f_site_micros === 1_000_000) {
    cues.push("cue_preferred_site");
  }
  if (
    input.searchPolicy.accessibilityNeeds.length > 0 &&
    input.searchPolicy.accessibilityNeeds.every((need) => input.slot.accessibilityTags.includes(need))
  ) {
    cues.push("cue_accessibility_fit");
  }
  if (input.featureVector.f_tod_micros >= 700_000) {
    cues.push("cue_time_of_day_fit");
  }
  if (input.featureVector.f_travel_micros >= 700_000 && !cues.includes("cue_preferred_site")) {
    cues.push("cue_closest_suitable_site");
  }
  return uniqueSorted(cues).slice(0, 2);
}

function sourceTrustStateFromCoverage(coverageState: SlotSearchCoverageState): CapacityRankSourceTrustState {
  switch (coverageState) {
    case "complete":
      return "trusted";
    case "partial_coverage":
    case "degraded":
      return "degraded";
    case "timeout":
      return "quarantined";
    case "failed":
      return "not_applicable";
  }
}

function truthModeForBinding(
  binding: BookingProviderAdapterBindingSnapshot,
): OfferTruthMode {
  return binding.reservationSemantics === "degraded_manual_pending"
    ? "degraded_manual_pending"
    : "truthful_nonexclusive";
}

function holdSupportStateForBinding(
  binding: BookingProviderAdapterBindingSnapshot,
): OfferHoldSupportState {
  if (binding.reservationSemantics === "degraded_manual_pending") {
    return "degraded_manual_only";
  }
  if (binding.actionScopeSet.includes("hold_slot")) {
    return "supported_later";
  }
  return "not_supported";
}

function computeFeatureVector(input: {
  slot: NormalizedSlotSnapshot;
  searchPolicy: SearchPolicySnapshot;
  rankPlan: RankPlanSnapshot;
  preferredMidpointMinutes: number;
}): CapacityRankFeatureVectorSnapshot & { softScoreMicros: number } {
  const waitMinutes = Math.max(
    0,
    Math.round(
      (input.slot.startAtEpoch -
        Date.parse(ensureIsoTimestamp(input.searchPolicy.timeframeEarliest, "timeframeEarliest"))) /
        60_000,
    ),
  );
  const midpointLocalMinutes = midpointMinutes(
    input.slot.startAt,
    input.slot.endAt,
    input.slot.displayTimeZone,
  );
  const travelMinutesProxy = siteTravelMinutesProxy(input.searchPolicy, input.slot.siteId);
  const fDelay = Math.exp(-waitMinutes / input.rankPlan.taus.tau_delay);
  const fContinuity = ensureUnitInterval(input.slot.continuityScore, "continuityScore");
  const fSite =
    input.searchPolicy.sitePreference.length === 0
      ? 0.5
      : input.searchPolicy.sitePreference.includes(input.slot.siteId)
        ? 1
        : 0;
  const fTod = Math.exp(
    -Math.abs(midpointLocalMinutes - input.preferredMidpointMinutes) / input.rankPlan.taus.tau_tod,
  );
  const fTravel = Math.exp(-travelMinutesProxy / input.rankPlan.taus.tau_travel);
  const fModality =
    input.searchPolicy.modality === "either" || input.slot.modality === input.searchPolicy.modality
      ? 1
      : 0;

  const featureMicros = {
    f_delay: quantizeUnit(fDelay),
    f_continuity: quantizeUnit(fContinuity),
    f_site: quantizeUnit(fSite),
    f_tod: quantizeUnit(fTod),
    f_travel: quantizeUnit(fTravel),
    f_modality: quantizeUnit(fModality),
  };
  const weightedSum =
    BigInt(Math.round(input.rankPlan.weights.w_delay * 1_000_000)) * featureMicros.f_delay +
    BigInt(Math.round(input.rankPlan.weights.w_continuity * 1_000_000)) *
      featureMicros.f_continuity +
    BigInt(Math.round(input.rankPlan.weights.w_site * 1_000_000)) * featureMicros.f_site +
    BigInt(Math.round(input.rankPlan.weights.w_tod * 1_000_000)) * featureMicros.f_tod +
    BigInt(Math.round(input.rankPlan.weights.w_travel * 1_000_000)) * featureMicros.f_travel +
    BigInt(Math.round(input.rankPlan.weights.w_modality * 1_000_000)) *
      featureMicros.f_modality;
  const softScoreMicros = Number((weightedSum + HALF_SCALE) / SCALE);

  return {
    waitMinutes,
    midpointLocalMinutes,
    preferredMidpointMinutes: input.preferredMidpointMinutes,
    travelMinutesProxy,
    continuityScore: input.slot.continuityScore,
    f_delay_micros: Number(featureMicros.f_delay),
    f_continuity_micros: Number(featureMicros.f_continuity),
    f_site_micros: Number(featureMicros.f_site),
    f_tod_micros: Number(featureMicros.f_tod),
    f_travel_micros: Number(featureMicros.f_travel),
    f_modality_micros: Number(featureMicros.f_modality),
    softScoreMicros,
  };
}

function continuationBranches(
  recoveryState: SlotSnapshotRecoveryStateSnapshot,
): readonly OfferContinuationBranchSnapshot[] {
  const branches: OfferContinuationBranchSnapshot[] = [
    {
      branchRef: "join_local_waitlist",
      branchReasonCode: "no_acceptable_local_slot_join_waitlist",
      dominant: recoveryState.coverageState === "complete",
    },
    {
      branchRef: "assisted_callback",
      branchReasonCode: "no_acceptable_local_slot_assisted_callback",
      dominant: recoveryState.coverageState !== "complete",
    },
    {
      branchRef: "fallback_to_hub",
      branchReasonCode: "no_acceptable_local_slot_fallback_to_hub",
      dominant: false,
    },
  ];
  return branches;
}

function candidateUniverseHash(
  snapshot: SlotSetSnapshotSnapshot,
  candidateIndex: SnapshotCandidateIndexSnapshot,
): string {
  return sha256({
    slotSetSnapshotRef: snapshot.slotSetSnapshotId,
    snapshotChecksum: snapshot.snapshotChecksum,
    orderedSlotRefs: candidateIndex.orderedSlotRefs,
  });
}

function buildSelectionProofHash(input: {
  offerSessionId: string;
  slotSetSnapshotRef: string;
  capacityRankProofRef: string;
  selectionToken: string;
  truthMode: OfferTruthMode;
  reservationTruthProjectionRef: string;
  providerAdapterBindingHash: string;
  capabilityTupleHash: string;
  selectedCandidateHash: string | null;
  selectedCanonicalSlotIdentityRef: string | null;
}): string {
  return sha256(input);
}

function buildOffersCreatedEvent(input: {
  offerSession: OfferSessionSnapshot;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
  occurredAt: string;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.offers.created", {
    governingRef: input.offerSession.offerSessionId,
    governingVersionRef: input.offerSession.selectionProofHash,
    previousState: "offers_absent",
    nextState: input.offerSession.sessionState,
    stateAxis: "offer_session",
    selectedSlotRef: input.offerSession.selectedNormalizedSlotRef ?? "slot_none_available",
    commandActionRecordRef: input.commandActionRecordRef,
    commandSettlementRef: input.commandSettlementRecordRef,
    routeIntentRef: input.routeIntentBindingRef,
    subjectRef: input.subjectRef,
    payloadArtifactRef: input.payloadArtifactRef,
    edgeCorrelationId: input.edgeCorrelationId,
    occurredAt: input.occurredAt,
  });
}

function buildSlotSelectedEvent(input: {
  offerSession: OfferSessionSnapshot;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  subjectRef: string;
  payloadArtifactRef: string;
  edgeCorrelationId: string;
  occurredAt: string;
}): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.slot.selected", {
    governingRef: input.offerSession.offerSessionId,
    governingVersionRef: input.offerSession.selectionProofHash,
    previousState: "offers_ready",
    nextState: "selecting",
    stateAxis: "offer_session",
    selectedSlotRef: requireRef(
      input.offerSession.selectedNormalizedSlotRef,
      "selectedNormalizedSlotRef",
    ),
    commandActionRecordRef: input.commandActionRecordRef,
    commandSettlementRef: input.commandSettlementRecordRef,
    routeIntentRef: input.routeIntentBindingRef,
    subjectRef: input.subjectRef,
    payloadArtifactRef: input.payloadArtifactRef,
    edgeCorrelationId: input.edgeCorrelationId,
    occurredAt: input.occurredAt,
  });
}

function offerSessionSelectable(
  offerSession: OfferSessionSnapshot,
  currentTuple: OfferSessionTupleInput,
): { selectable: boolean; failureReasonCodes: readonly string[] } {
  const reasons: string[] = [];
  if (compareIso(currentTuple.now, offerSession.expiresAt) > 0) {
    reasons.push("offer_session_expired");
  }
  if (offerSession.sessionState === "superseded") {
    reasons.push("offer_session_superseded");
  }
  if (offerSession.slotSetSnapshotRef !== currentTuple.currentSlotSetSnapshotRef) {
    reasons.push("slot_snapshot_drift");
  }
  if (offerSession.providerAdapterBindingHash !== currentTuple.providerAdapterBindingHash) {
    reasons.push("binding_hash_drift");
  }
  if (offerSession.capabilityTupleHash !== currentTuple.capabilityTupleHash) {
    reasons.push("capability_tuple_drift");
  }
  return {
    selectable: reasons.length === 0,
    failureReasonCodes: uniqueSorted(reasons),
  };
}

export interface Phase4CapacityRankService {
  repositories: Phase4CapacityRankRepositories;
  createOfferSession(input: OfferSessionCompilationInput): Promise<OfferSessionCompilationResult>;
  queryCurrentOfferSession(
    bookingCaseId: string,
    selectionAudience: BookingSelectionAudience,
  ): Promise<OfferSessionReadResult | null>;
  fetchOfferPage(
    offerSessionId: string,
    pageNumber: number,
    currentTuple: OfferSessionTupleInput,
  ): Promise<OfferSessionPageResult>;
  fetchCompareCandidates(
    offerSessionId: string,
    candidateRefs: readonly string[],
    currentTuple: OfferSessionTupleInput,
  ): Promise<OfferSessionCompareResult>;
  selectOfferCandidate(input: SelectOfferCandidateInput): Promise<OfferSessionCompilationResult>;
}

export function createPhase4CapacityRankService(input?: {
  repositories?: ExtendedPhase4CapacityRankRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase4CapacityRankService {
  const repositories = input?.repositories ?? createPhase4CapacityRankStore();
  const idGenerator = input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase4-booking");

  async function requireRankPlan(rankPlanId: string): Promise<RankPlanSnapshot> {
    const document = await repositories.getRankPlan(rankPlanId);
    invariant(document, "RANK_PLAN_NOT_FOUND", `RankPlan ${rankPlanId} was not found.`);
    return document.toSnapshot();
  }

  async function requireProof(capacityRankProofId: string): Promise<CapacityRankProofSnapshot> {
    const document = await repositories.getCapacityRankProof(capacityRankProofId);
    invariant(document, "CAPACITY_RANK_PROOF_NOT_FOUND", `CapacityRankProof ${capacityRankProofId} was not found.`);
    return document.toSnapshot();
  }

  async function requireDisclosurePolicy(
    capacityRankDisclosurePolicyId: string,
  ): Promise<CapacityRankDisclosurePolicySnapshot> {
    const document = await repositories.getDisclosurePolicy(capacityRankDisclosurePolicyId);
    invariant(
      document,
      "CAPACITY_RANK_DISCLOSURE_POLICY_NOT_FOUND",
      `CapacityRankDisclosurePolicy ${capacityRankDisclosurePolicyId} was not found.`,
    );
    return document.toSnapshot();
  }

  async function requireOfferSession(offerSessionId: string): Promise<OfferSessionSnapshot> {
    const document = await repositories.getOfferSession(offerSessionId);
    invariant(document, "OFFER_SESSION_NOT_FOUND", `OfferSession ${offerSessionId} was not found.`);
    return document.toSnapshot();
  }

  async function bundleFor(offerSession: OfferSessionSnapshot): Promise<OfferSessionReadResult> {
    const rankPlan = await requireRankPlan(offerSession.rankPlanRef);
    const disclosurePolicy = await requireDisclosurePolicy(
      offerSession.capacityRankDisclosurePolicyRef,
    );
    const proof = await requireProof(offerSession.capacityRankProofRef);
    const explanations = (await repositories.listExplanations(proof.capacityRankProofId)).map((document) =>
      document.toSnapshot(),
    );
    const offerCandidates = (await repositories.listOfferCandidates(offerSession.offerSessionId)).map(
      (document) => document.toSnapshot(),
    );
    return {
      rankPlan,
      disclosurePolicy,
      capacityRankProof: proof,
      explanations,
      offerCandidates,
      offerSession,
    };
  }

  async function supersedeCurrentOfferSessionIfNeeded(
    bookingCaseId: string,
    selectionAudience: BookingSelectionAudience,
    newOfferSessionId: string,
    occurredAt: string,
  ): Promise<readonly string[]> {
    const currentRef = await repositories.getCurrentOfferSessionRef(
      offerScopeKey(bookingCaseId, selectionAudience),
    );
    if (!currentRef || currentRef === newOfferSessionId) {
      return [];
    }
    const current = await requireOfferSession(currentRef);
    await repositories.saveOfferSession({
      ...current,
      sessionState: "superseded",
      supersededAt: occurredAt,
    });
    return [current.offerSessionId];
  }

  return {
    repositories,

    async createOfferSession(input) {
      const occurredAt = ensureIsoTimestamp(input.occurredAt, "occurredAt");
      invariant(
        input.capabilityResolution.requestedActionScope === "search_slots",
        "CAPABILITY_SCOPE_MISMATCH",
        "285 expects the live snapshot capability tuple from search_slots.",
      );
      invariant(
        input.slotSetSnapshot.slotSetSnapshotId === input.candidateIndex.slotSetSnapshotRef,
        "SNAPSHOT_CANDIDATE_INDEX_MISMATCH",
        "SnapshotCandidateIndex must belong to the supplied SlotSetSnapshot.",
      );
      const replayKey = `${requireRef(input.bookingCaseId, "bookingCaseId")}::${requireRef(
        input.slotSetSnapshot.slotSetSnapshotId,
        "slotSetSnapshot.slotSetSnapshotId",
      )}::${requireRef(input.commandActionRecordRef, "commandActionRecordRef")}`;
      const replay = await repositories.getCompilationReplay(replayKey);
      if (replay) {
        return {
          ...(await bundleFor(await requireOfferSession(replay.offerSessionId))),
          emittedEvents: [],
          supersededOfferSessionRefs: [],
        };
      }

      const rankPlan = compileRankPlan(input.searchPolicy, occurredAt);
      const disclosurePolicy = buildDisclosurePolicy(input.capabilityResolution.selectionAudience);
      const preferredMidpointMinutes = decodeMidpointPreference(input.patientPreferenceSummary);
      const slotById = new Map(input.normalizedSlots.map((slot) => [slot.normalizedSlotId, slot] as const));
      const universeCandidates = input.candidateIndex.orderedSlotRefs
        .map((slotRef) => slotById.get(slotRef))
        .filter((slot): slot is NormalizedSlotSnapshot => slot !== undefined);

      const feasible: CandidateComputation[] = [];
      for (const slot of universeCandidates) {
        const hardFilters = inferHardFilterReasons(
          slot,
          input.searchPolicy,
          input.capabilityResolution.selectionAudience,
        );
        if (hardFilters.length > 0) {
          continue;
        }
        const featureVector = computeFeatureVector({
          slot,
          searchPolicy: input.searchPolicy,
          rankPlan,
          preferredMidpointMinutes,
        });
        const offerCandidateId = normalizeRecordId(
          "offer_candidate",
          sha256({
            slotSetSnapshotRef: input.slotSetSnapshot.slotSetSnapshotId,
            normalizedSlotRef: slot.normalizedSlotId,
            selectionAudience: input.capabilityResolution.selectionAudience,
            rankPlanRef: rankPlan.rankPlanId,
          }),
        );
        feasible.push({
          slot,
          offerCandidateId,
          candidateHash: sha256({
            offerCandidateId,
            normalizedSlotRef: slot.normalizedSlotId,
            canonicalSlotIdentityRef: slot.canonicalSlotIdentityRef,
            startAt: slot.startAt,
            canonicalTieBreakKey: slot.canonicalTieBreakKey,
          }),
          offerabilityState: deriveOfferabilityState(slot.bookabilityMode),
          waitMinutes: featureVector.waitMinutes,
          midpointLocalMinutes: featureVector.midpointLocalMinutes,
          preferredMidpointMinutes,
          travelMinutesProxy: featureVector.travelMinutesProxy,
          windowClass: windowClassForSlot(slot, input.searchPolicy, rankPlan),
          frontierMembership: false,
          softScoreMicros: featureVector.softScoreMicros,
          featureVector,
          reasonCodeRefs: [],
          patientReasonCueRefs: [],
          staffExplanationRefs: [],
          supportExplanationRefs: [],
          opsDiagnosticRefs: [],
        });
      }

      const slackByClass: Record<0 | 1 | 2, number> = {
        2: rankPlan.sameBandReorderSlackMinutesByWindow.preferred,
        1: rankPlan.sameBandReorderSlackMinutesByWindow.acceptable,
        0: 0,
      };
      for (const windowClass of [2, 1, 0] as const) {
        const candidates = feasible.filter((candidate) => candidate.windowClass === windowClass);
        if (candidates.length === 0) {
          continue;
        }
        const earliest = Math.min(...candidates.map((candidate) => candidate.slot.startAtEpoch));
        const frontierCutoff = earliest + slackByClass[windowClass] * 60_000;
        for (const candidate of candidates) {
          candidate.frontierMembership = candidate.slot.startAtEpoch <= frontierCutoff;
        }
      }

      const orderedCandidates = [...feasible].sort((left, right) => {
        if (left.windowClass !== right.windowClass) {
          return right.windowClass - left.windowClass;
        }
        if (left.frontierMembership !== right.frontierMembership) {
          return left.frontierMembership ? -1 : 1;
        }
        if (left.frontierMembership && right.frontierMembership) {
          if (left.softScoreMicros !== right.softScoreMicros) {
            return right.softScoreMicros - left.softScoreMicros;
          }
          if (left.slot.startAtEpoch !== right.slot.startAtEpoch) {
            return left.slot.startAtEpoch - right.slot.startAtEpoch;
          }
          return left.slot.canonicalTieBreakKey.localeCompare(right.slot.canonicalTieBreakKey);
        }
        if (left.slot.startAtEpoch !== right.slot.startAtEpoch) {
          return left.slot.startAtEpoch - right.slot.startAtEpoch;
        }
        if (left.softScoreMicros !== right.softScoreMicros) {
          return right.softScoreMicros - left.softScoreMicros;
        }
        return left.slot.canonicalTieBreakKey.localeCompare(right.slot.canonicalTieBreakKey);
      });

      const proofId = nextId(idGenerator, "capacity_rank_proof");
      const offerSessionId = nextId(idGenerator, "offer_session");
      const sourceTrustState = sourceTrustStateFromCoverage(input.slotSetSnapshot.coverageState);
      const explanations: CapacityRankExplanationSnapshot[] = [];
      const offerCandidates: RankedOfferCandidateSnapshot[] = [];
      for (const [index, candidate] of orderedCandidates.entries()) {
        const rankOrdinal = index + 1;
        const reasonCodeRefs = uniqueSorted([
          candidate.windowClass === 2
            ? "window_preferred"
            : candidate.windowClass === 1
              ? "window_acceptable"
              : "window_outside",
          candidate.frontierMembership ? "frontier_member" : "frontier_non_member",
          candidate.offerabilityState === "staff_assist_only"
            ? "staff_assist_only_offer"
            : "self_service_offer",
        ]);
        const patientReasonCueRefs = reasonCuesForCandidate({
          slot: candidate.slot,
          rankOrdinal,
          windowClass: candidate.windowClass,
          featureVector: candidate.featureVector,
          searchPolicy: input.searchPolicy,
        });
        const staffExplanationRefs = uniqueSorted([
          `soft_score_micros:${candidate.softScoreMicros}`,
          `travel_proxy_minutes:${candidate.featureVector.travelMinutesProxy}`,
          `wait_minutes:${candidate.featureVector.waitMinutes}`,
        ]);
        const supportExplanationRefs = uniqueSorted([
          `candidate_hash:${candidate.candidateHash}`,
          `window_class:${candidate.windowClass}`,
        ]);
        const opsDiagnosticRefs = uniqueSorted([
          `frontier:${candidate.frontierMembership ? "yes" : "no"}`,
          `canonical_tiebreak:${candidate.slot.canonicalTieBreakKey}`,
        ]);
        const explanationTupleHash = sha256({
          proofId,
          candidateRef: candidate.offerCandidateId,
          rankOrdinal,
          windowClass: candidate.windowClass,
          frontierMembership: candidate.frontierMembership,
          softScoreMicros: candidate.softScoreMicros,
          patientReasonCueRefs,
          reasonCodeRefs,
        });
        const explanation: CapacityRankExplanationSnapshot = {
          capacityRankExplanationId: normalizeRecordId(
            "capacity_rank_explanation",
            explanationTupleHash,
          ),
          capacityRankProofRef: proofId,
          candidateRef: candidate.offerCandidateId,
          canonicalSlotIdentityRef: candidate.slot.canonicalSlotIdentityRef,
          normalizedSlotRef: candidate.slot.normalizedSlotId,
          rankOrdinal,
          windowClass: candidate.windowClass,
          frontierState: candidate.frontierMembership ? "frontier_ranked" : "non_frontier",
          sourceTrustState,
          normalizedFeatureVector: candidate.featureVector,
          reasonCodeRefs,
          patientReasonCueRefs,
          staffExplanationRefs,
          supportExplanationRefs,
          opsDiagnosticRefs,
          uncertaintyRadius: 0,
          robustFit: "deterministic",
          dominanceDisposition: "retained",
          canonicalTieBreakKey: candidate.slot.canonicalTieBreakKey,
          rankPlanVersionRef: rankPlan.rankPlanVersion,
          explanationTupleHash,
          generatedAt: occurredAt,
        };
        explanations.push(explanation);
        offerCandidates.push({
          offerCandidateId: candidate.offerCandidateId,
          offerSessionRef: offerSessionId,
          capacityRankProofRef: proofId,
          normalizedSlotRef: candidate.slot.normalizedSlotId,
          canonicalSlotIdentityRef: candidate.slot.canonicalSlotIdentityRef,
          candidateRank: rankOrdinal,
          candidateHash: candidate.candidateHash,
          selectionAudience: input.capabilityResolution.selectionAudience,
          offerabilityState: candidate.offerabilityState,
          windowClass: candidate.windowClass,
          frontierMembership: candidate.frontierMembership,
          softScoreMicros: candidate.softScoreMicros,
          patientReasonCueRefs,
          capacityRankExplanationRef: explanation.capacityRankExplanationId,
          slotSnapshot: {
            ...candidate.slot,
            rankFeatures: {
              ...candidate.slot.rankFeatures,
              waitMinutes: candidate.featureVector.waitMinutes,
              preferredMidpointMinutes: candidate.featureVector.preferredMidpointMinutes,
              midpointLocalMinutes: candidate.featureVector.midpointLocalMinutes,
              travelMinutesProxy: candidate.featureVector.travelMinutesProxy,
              softScoreMicros: candidate.softScoreMicros,
              frontierMembership: candidate.frontierMembership,
              windowClass: candidate.windowClass,
            },
            scoreExplanationRef: explanation.capacityRankExplanationId,
          },
        });
      }

      const proof: CapacityRankProofSnapshot = {
        capacityRankProofId: proofId,
        rankingScope: "local_booking",
        sourceSnapshotRef: input.slotSetSnapshot.slotSetSnapshotId,
        sourceDecisionPlanRef: null,
        rankPlanRef: rankPlan.rankPlanId,
        rankPlanVersionRef: rankPlan.rankPlanVersion,
        candidateUniverseHash: candidateUniverseHash(input.slotSetSnapshot, input.candidateIndex),
        orderedCandidateRefs: offerCandidates.map((candidate) => candidate.offerCandidateId),
        frontierCandidateRefs: offerCandidates
          .filter((candidate) => candidate.frontierMembership)
          .map((candidate) => candidate.offerCandidateId),
        dominatedCandidateRefs: [],
        patientOfferableCandidateRefs: offerCandidates
          .filter((candidate) => patientOfferable(candidate.slotSnapshot.bookabilityMode))
          .map((candidate) => candidate.offerCandidateId),
        explanationRefs: explanations.map((explanation) => explanation.capacityRankExplanationId),
        tieBreakSchemaRef: STABLE_TIE_BREAK_RULE,
        proofChecksum: sha256({
          proofId,
          orderedCandidateRefs: offerCandidates.map((candidate) => candidate.offerCandidateId),
          explanationRefs: explanations.map((explanation) => explanation.capacityRankExplanationId),
        }),
        generatedAt: occurredAt,
        supersededAt: null,
      };

      const dominantCandidate = offerCandidates[0] ?? null;
      const truthMode = truthModeForBinding(input.providerAdapterBinding);
      const selectionToken = normalizeRecordId(
        "offer_selection_token",
        sha256({
          offerSessionId,
          bookingCaseId: input.bookingCaseId,
          slotSetSnapshotRef: input.slotSetSnapshot.slotSetSnapshotId,
          capabilityTupleHash: input.capabilityResolution.capabilityTupleHash,
        }),
      );
      const reservationTruthProjectionRef = dominantCandidate
        ? `reservation_truth_projection_pending_286_${dominantCandidate.canonicalSlotIdentityRef}`
        : `reservation_truth_projection_not_applicable_${offerSessionId}`;
      const sessionState: OfferSessionState = dominantCandidate ? "offerable" : "branch_only";
      const continuationBranchSet = dominantCandidate ? [] : continuationBranches(input.recoveryState);
      const selectionProofHash = buildSelectionProofHash({
        offerSessionId,
        slotSetSnapshotRef: input.slotSetSnapshot.slotSetSnapshotId,
        capacityRankProofRef: proof.capacityRankProofId,
        selectionToken,
        truthMode,
        reservationTruthProjectionRef,
        providerAdapterBindingHash: input.providerAdapterBinding.bindingHash,
        capabilityTupleHash: input.capabilityResolution.capabilityTupleHash,
        selectedCandidateHash: dominantCandidate?.candidateHash ?? null,
        selectedCanonicalSlotIdentityRef: dominantCandidate?.canonicalSlotIdentityRef ?? null,
      });
      const offerSession: OfferSessionSnapshot = {
        offerSessionId,
        bookingCaseId: input.bookingCaseId,
        slotSetSnapshotRef: input.slotSetSnapshot.slotSetSnapshotId,
        rankPlanRef: rankPlan.rankPlanId,
        rankPlanVersion: rankPlan.rankPlanVersion,
        capacityRankProofRef: proof.capacityRankProofId,
        capacityRankDisclosurePolicyRef: disclosurePolicy.capacityRankDisclosurePolicyId,
        capabilityResolutionRef: input.capabilityResolution.bookingCapabilityResolutionId,
        capabilityTupleHash: input.capabilityResolution.capabilityTupleHash,
        providerAdapterBindingRef: input.providerAdapterBinding.bookingProviderAdapterBindingId,
        providerAdapterBindingHash: input.providerAdapterBinding.bindingHash,
        searchPolicyRef: input.searchPolicy.policyId,
        selectionAudience: input.capabilityResolution.selectionAudience,
        offeredCandidateRefs: offerCandidates.map((candidate) => candidate.offerCandidateId),
        selectedOfferCandidateRef: dominantCandidate?.offerCandidateId ?? null,
        selectedNormalizedSlotRef: dominantCandidate?.normalizedSlotRef ?? null,
        selectedCanonicalSlotIdentityRef: dominantCandidate?.canonicalSlotIdentityRef ?? null,
        selectedCandidateHash: dominantCandidate?.candidateHash ?? null,
        reservationTruthProjectionRef,
        selectionToken,
        selectionProofHash,
        truthMode,
        holdSupportState: holdSupportStateForBinding(input.providerAdapterBinding),
        compareModeState: "list",
        expiresAt: addSeconds(
          occurredAt,
          input.offerSessionTtlSeconds ?? DEFAULT_OFFER_SESSION_TTL_SECONDS,
        ),
        sessionState,
        dominantActionRef:
          dominantCandidate?.offerCandidateId ??
          continuationBranchSet.find((branch) => branch.dominant)?.branchRef ??
          null,
        continuationBranches: continuationBranchSet,
        createdAt: occurredAt,
        supersededAt: null,
      };

      const supersededOfferSessionRefs = await supersedeCurrentOfferSessionIfNeeded(
        input.bookingCaseId,
        input.capabilityResolution.selectionAudience,
        offerSession.offerSessionId,
        occurredAt,
      );
      await repositories.saveRankPlan(rankPlan);
      await repositories.saveDisclosurePolicy(disclosurePolicy);
      await repositories.saveCapacityRankProof(proof);
      for (const explanation of explanations) {
        await repositories.saveExplanation(explanation);
      }
      for (const candidate of offerCandidates) {
        await repositories.saveOfferCandidate(candidate);
      }
      await repositories.saveOfferSession(offerSession);
      await repositories.setCurrentOfferSessionRef(
        offerScopeKey(input.bookingCaseId, input.capabilityResolution.selectionAudience),
        offerSession.offerSessionId,
      );
      await repositories.saveCompilationReplay(replayKey, {
        offerSessionId: offerSession.offerSessionId,
        capacityRankProofId: proof.capacityRankProofId,
      });

      const event = buildOffersCreatedEvent({
        offerSession,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        subjectRef: input.subjectRef,
        payloadArtifactRef:
          optionalRef(input.payloadArtifactRef) ??
          `artifact://booking/offers/${input.bookingCaseId}/${offerSession.offerSessionId}`,
        edgeCorrelationId:
          optionalRef(input.edgeCorrelationId) ?? offerSession.offerSessionId,
        occurredAt,
      });

      return {
        rankPlan,
        disclosurePolicy,
        capacityRankProof: proof,
        explanations,
        offerCandidates,
        offerSession,
        emittedEvents: [event],
        supersededOfferSessionRefs,
      };
    },

    async queryCurrentOfferSession(bookingCaseId, selectionAudience) {
      const offerSessionRef = await repositories.getCurrentOfferSessionRef(
        offerScopeKey(bookingCaseId, selectionAudience),
      );
      if (!offerSessionRef) {
        return null;
      }
      return bundleFor(await requireOfferSession(offerSessionRef));
    },

    async fetchOfferPage(offerSessionId, pageNumber, currentTuple) {
      const offerSession = await requireOfferSession(offerSessionId);
      const bundle = await bundleFor(offerSession);
      const selectability = offerSessionSelectable(bundle.offerSession, currentTuple);
      const totalPages = Math.max(
        1,
        Math.ceil(bundle.offerSession.offeredCandidateRefs.length / DEFAULT_PAGE_SIZE),
      );
      const start = Math.max(0, (ensurePositiveInteger(pageNumber, "pageNumber") - 1) * DEFAULT_PAGE_SIZE);
      const visibleRefs = bundle.capacityRankProof.orderedCandidateRefs.slice(
        start,
        start + DEFAULT_PAGE_SIZE,
      );
      const candidateByRef = new Map(
        bundle.offerCandidates.map((candidate) => [candidate.offerCandidateId, candidate] as const),
      );
      return {
        ...bundle,
        pageNumber,
        totalPages,
        candidates: visibleRefs
          .map((candidateRef) => candidateByRef.get(candidateRef))
          .filter((candidate): candidate is RankedOfferCandidateSnapshot => candidate !== undefined),
        selectable: selectability.selectable,
        failureReasonCodes: selectability.failureReasonCodes,
      };
    },

    async fetchCompareCandidates(offerSessionId, candidateRefs, currentTuple) {
      const offerSession = await requireOfferSession(offerSessionId);
      const bundle = await bundleFor(offerSession);
      const selectability = offerSessionSelectable(bundle.offerSession, currentTuple);
      const requested = new Set(candidateRefs.map((candidateRef) => requireRef(candidateRef, "candidateRef")));
      const candidateByRef = new Map(
        bundle.offerCandidates.map((candidate) => [candidate.offerCandidateId, candidate] as const),
      );
      return {
        ...bundle,
        candidates: bundle.capacityRankProof.orderedCandidateRefs
          .filter((candidateRef) => requested.has(candidateRef))
          .map((candidateRef) => candidateByRef.get(candidateRef))
          .filter((candidate): candidate is RankedOfferCandidateSnapshot => candidate !== undefined),
        selectable: selectability.selectable,
        failureReasonCodes: selectability.failureReasonCodes,
      };
    },

    async selectOfferCandidate(input) {
      const occurredAt = ensureIsoTimestamp(input.occurredAt, "occurredAt");
      const selectionReplayKey = `${requireRef(input.offerSessionId, "offerSessionId")}::${requireRef(
        input.commandActionRecordRef,
        "commandActionRecordRef",
      )}`;
      const replay = await repositories.getSelectionReplay(selectionReplayKey);
      if (replay) {
        return {
          ...(await bundleFor(await requireOfferSession(replay.offerSessionId))),
          emittedEvents: [],
          supersededOfferSessionRefs: [],
        };
      }

      const offerSession = await requireOfferSession(input.offerSessionId);
      const bundle = await bundleFor(offerSession);
      const selectability = offerSessionSelectable(bundle.offerSession, input.currentTuple);
      invariant(
        selectability.selectable,
        "OFFER_SESSION_NOT_SELECTABLE",
        `OfferSession is not selectable: ${selectability.failureReasonCodes.join(", ")}`,
      );
      invariant(
        bundle.offerSession.selectionToken === requireRef(input.selectionToken, "selectionToken"),
        "SELECTION_TOKEN_MISMATCH",
        "selectionToken does not match the current OfferSession.",
      );
      const selected = bundle.offerCandidates.find(
        (candidate) => candidate.offerCandidateId === input.offerCandidateId,
      );
      invariant(
        selected,
        "OFFER_CANDIDATE_NOT_FOUND",
        `OfferCandidate ${input.offerCandidateId} does not belong to OfferSession ${input.offerSessionId}.`,
      );
      const expectedSelectionProofHash = buildSelectionProofHash({
        offerSessionId: bundle.offerSession.offerSessionId,
        slotSetSnapshotRef: bundle.offerSession.slotSetSnapshotRef,
        capacityRankProofRef: bundle.capacityRankProof.capacityRankProofId,
        selectionToken: bundle.offerSession.selectionToken,
        truthMode: bundle.offerSession.truthMode,
        reservationTruthProjectionRef: bundle.offerSession.reservationTruthProjectionRef,
        providerAdapterBindingHash: bundle.offerSession.providerAdapterBindingHash,
        capabilityTupleHash: bundle.offerSession.capabilityTupleHash,
        selectedCandidateHash: selected.candidateHash,
        selectedCanonicalSlotIdentityRef: selected.canonicalSlotIdentityRef,
      });
      invariant(
        expectedSelectionProofHash === requireRef(input.selectionProofHash, "selectionProofHash"),
        "SELECTION_PROOF_HASH_MISMATCH",
        "selectionProofHash no longer matches the current ranked proof tuple.",
      );
      const updatedOfferSession: OfferSessionSnapshot = {
        ...bundle.offerSession,
        sessionState: "selected",
        selectedOfferCandidateRef: selected.offerCandidateId,
        selectedNormalizedSlotRef: selected.normalizedSlotRef,
        selectedCanonicalSlotIdentityRef: selected.canonicalSlotIdentityRef,
        selectedCandidateHash: selected.candidateHash,
        selectionProofHash: expectedSelectionProofHash,
        dominantActionRef: selected.offerCandidateId,
      };
      await repositories.saveOfferSession(updatedOfferSession);
      await repositories.saveSelectionReplay(selectionReplayKey, {
        offerSessionId: updatedOfferSession.offerSessionId,
        selectedOfferCandidateRef: selected.offerCandidateId,
      });
      const event = buildSlotSelectedEvent({
        offerSession: updatedOfferSession,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        subjectRef: input.subjectRef,
        payloadArtifactRef:
          optionalRef(input.payloadArtifactRef) ??
          `artifact://booking/offers/${updatedOfferSession.bookingCaseId}/${updatedOfferSession.offerSessionId}/selection`,
        edgeCorrelationId:
          optionalRef(input.edgeCorrelationId) ?? updatedOfferSession.offerSessionId,
        occurredAt,
      });
      return {
        ...(await bundleFor(updatedOfferSession)),
        emittedEvents: [event],
        supersededOfferSessionRefs: [],
      };
    },
  };
}
