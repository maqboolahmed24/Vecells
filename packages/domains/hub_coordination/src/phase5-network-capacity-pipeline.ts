import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import {
  createPhase5EnhancedAccessPolicyService,
  type ActivePolicyPackSet,
  type CapacityAdmissionDisposition,
  type HubCapacityIngestionPolicySnapshot,
  type NetworkPolicyEvaluationResult,
  type Phase5EnhancedAccessPolicyRepositories,
  type Phase5EnhancedAccessPolicyService,
  type Phase5EnhancedAccessPolicyStore,
  type PolicyEvaluationFactsSnapshot,
  type PolicyExceptionRecordSnapshot,
  type SourceTrustState,
} from "./phase5-enhanced-access-policy-engine";
import {
  createPhase5HubCaseKernelService,
  type HubCaseBundle,
  type Phase5HubCaseKernelService,
} from "./phase5-hub-case-kernel";

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
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function startOfWeekUtc(timestamp: string): string {
  const date = new Date(timestamp);
  const day = date.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + delta);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

function endOfWeekUtc(timestamp: string): string {
  const date = new Date(startOfWeekUtc(timestamp));
  date.setUTCDate(date.getUTCDate() + 6);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

function addHours(timestamp: string, hours: number): string {
  const date = new Date(timestamp);
  date.setTime(date.getTime() + hours * 60 * 60 * 1_000);
  return date.toISOString();
}

function roundToNearestQuarterHour(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

function durationMinutes(startAt: string, endAt: string): number {
  return ensureNonNegativeInteger(
    Math.round((Date.parse(endAt) - Date.parse(startAt)) / 60_000),
    "durationMinutes",
  );
}

export const phase5HubCapacitySourceModes = [
  "native_api_feed",
  "partner_schedule_sync",
  "manual_capacity_board",
  "batched_capacity_import",
] as const;

export type HubCapacitySourceMode = (typeof phase5HubCapacitySourceModes)[number];
export type CapacitySourceFreshnessState = "fresh" | "aging" | "stale";
export type RequiredWindowFit = 0 | 1 | 2;
export type ManageCapabilityState = "network_manage_ready" | "read_only" | "blocked";
export type CapacityOfferabilityState =
  | "direct_commit"
  | "patient_offerable"
  | "callback_only_reasoning"
  | "diagnostic_only";
export type CapacitySupplyExceptionCode =
  | "CAPACITY_MISSING"
  | "CAPACITY_STALE"
  | "CAPACITY_DEGRADED_CALLBACK_ONLY"
  | "CAPACITY_DEGRADED_DIAGNOSTIC_ONLY"
  | "CAPACITY_QUARANTINED"
  | "CAPACITY_HIDDEN"
  | "CAPACITY_POLICY_INVALID"
  | "CAPACITY_DEDUPE_COLLISION";
export type CapacitySupplyExceptionSeverity = "info" | "warning" | "blocking";
export type CapacitySupplyExceptionFamily =
  | "missing"
  | "staleness"
  | "trust"
  | "visibility"
  | "policy"
  | "dedupe";
export type AssuranceCompletenessState = "complete" | "partial" | "blocked";

export interface Phase5RankPlanConfig {
  windowWeight: number;
  waitWeight: number;
  travelWeight: number;
  accessibilityWeight: number;
  manageWeight: number;
  tauWaitMinutes: number;
  tauTravelMinutes: number;
}

export interface Phase5UncertaintyModelConfig {
  trustedPenalty: number;
  degradedPenalty: number;
  quarantinedPenalty: number;
  freshPenalty: number;
  agingPenalty: number;
  stalePenalty: number;
  readOnlyPenalty: number;
  blockedPenalty: number;
}

const rankPlanCatalog = {
  "312.rank-plan.network-candidate.v1": {
    windowWeight: 0.34,
    waitWeight: 0.22,
    travelWeight: 0.16,
    accessibilityWeight: 0.18,
    manageWeight: 0.1,
    tauWaitMinutes: 720,
    tauTravelMinutes: 45,
  },
} as const satisfies Record<string, Phase5RankPlanConfig>;

const uncertaintyModelCatalog = {
  "312.uncertainty-model.network-candidate.v1": {
    trustedPenalty: 0.04,
    degradedPenalty: 0.18,
    quarantinedPenalty: 0.42,
    freshPenalty: 0.01,
    agingPenalty: 0.05,
    stalePenalty: 0.15,
    readOnlyPenalty: 0.03,
    blockedPenalty: 0.08,
  },
} as const satisfies Record<string, Phase5UncertaintyModelConfig>;

const sourceModePrecedence: Record<HubCapacitySourceMode, number> = {
  native_api_feed: 3,
  partner_schedule_sync: 2,
  manual_capacity_board: 1,
  batched_capacity_import: 0,
};

export interface CapacitySourceTrustRecordInput {
  sourceTrustRef: string;
  trustLowerBound: number;
  completenessState: AssuranceCompletenessState;
  hardBlock: boolean;
  observedTrustState?: SourceTrustState | "unknown";
  evaluatedAt: string;
  reviewDueAt: string;
  sourceRefs?: readonly string[];
}

export interface HubCapacityRawSupplyRow {
  upstreamSlotRef?: string | null;
  capacityUnitRef?: string | null;
  siteId: string;
  siteLabel?: string | null;
  timezone: string;
  modality: string;
  clinicianType: string;
  startAt: string;
  endAt: string;
  manageCapabilityState: ManageCapabilityState;
  accessibilityFitScore: number;
  travelMinutes: number;
  sourceRefs?: readonly string[];
}

export interface HubCapacityAdapterBindingSnapshot {
  bindingRef: string;
  sourceMode: HubCapacitySourceMode;
  sourceRef: string;
  sourceIdentity: string;
  sourceVersion: string;
  fetchedAt: string;
  trustRecord: CapacitySourceTrustRecordInput;
  capacityRows: readonly HubCapacityRawSupplyRow[];
  sourceRefs: readonly string[];
}

export interface HubCapacityAdapterFetchInput {
  hubCoordinationCaseId: string;
  asOf: string;
  binding: HubCapacityAdapterBindingSnapshot;
}

export interface HubCapacityAdapterResult {
  sourceMode: HubCapacitySourceMode;
  sourceRef: string;
  sourceIdentity: string;
  sourceVersion: string;
  fetchedAt: string;
  trustRecord: CapacitySourceTrustRecordInput;
  capacityRows: readonly HubCapacityRawSupplyRow[];
  sourceRefs: readonly string[];
}

export interface HubCapacityAdapter {
  sourceMode: HubCapacitySourceMode;
  fetchCapacity(input: HubCapacityAdapterFetchInput): Promise<HubCapacityAdapterResult>;
}

export interface CapacityAdapterRunSnapshot {
  adapterRunId: string;
  snapshotId: string | null;
  hubCoordinationCaseId: string;
  bindingRef: string;
  sourceMode: HubCapacitySourceMode;
  sourceRef: string;
  sourceIdentity: string;
  sourceVersion: string;
  fetchedAt: string;
  rawRowCount: number;
  sourceTrustRef: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface CapacitySourceTrustAdmissionSnapshot {
  sourceTrustAdmissionId: string;
  snapshotId: string | null;
  hubCoordinationCaseId: string;
  adapterRunRef: string;
  sourceMode: HubCapacitySourceMode;
  sourceRef: string;
  sourceIdentity: string;
  sourceVersion: string;
  sourceTrustRef: string;
  sourceTrustState: SourceTrustState;
  sourceTrustTier: 0 | 1 | 2;
  trustLowerBound: number;
  completenessState: AssuranceCompletenessState;
  hardBlock: boolean;
  sourceFreshnessState: CapacitySourceFreshnessState;
  stalenessMinutes: number;
  admissionDisposition: CapacityAdmissionDisposition;
  patientOfferableAllowed: boolean;
  directCommitAllowed: boolean;
  hiddenFromPatientTruth: boolean;
  candidateCount: number;
  evaluatedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface NetworkSlotCandidateSnapshot {
  candidateId: string;
  networkCandidateSnapshotRef: string;
  siteId: string;
  siteLabel: string | null;
  sourceRef: string;
  sourceTrustRef: string;
  sourceTrustState: SourceTrustState;
  sourceTrustTier: 0 | 1 | 2;
  sourceFreshnessState: CapacitySourceFreshnessState;
  startAt: string;
  endAt: string;
  timezone: string;
  modality: string;
  clinicianType: string;
  capacityUnitRef: string;
  manageCapabilityState: ManageCapabilityState;
  accessibilityFitScore: number;
  travelMinutes: number;
  waitMinutes: number;
  stalenessMinutes: number;
  requiredWindowFit: RequiredWindowFit;
  windowClass: RequiredWindowFit;
  offerabilityState: CapacityOfferabilityState;
  baseUtility: number;
  uncertaintyRadius: number;
  robustFit: number;
  capacityRankExplanationRef: string;
  patientReasonCueRefs: readonly string[];
  staffReasonRefs: readonly string[];
  blockedByPolicyReasonRefs: readonly string[];
  sourceRefs: readonly string[];
  version: number;
}

export interface CapacityRankExplanationSnapshot {
  capacityRankExplanationId: string;
  networkCandidateSnapshotRef: string;
  candidateRef: string;
  policyTupleHash: string;
  windowClass: RequiredWindowFit;
  sourceTrustState: SourceTrustState;
  baseUtility: number;
  uncertaintyRadius: number;
  robustFit: number;
  patientReasonCueRefs: readonly string[];
  staffReasonRefs: readonly string[];
  blockedByPolicyReasonRefs: readonly string[];
  generatedAt: string;
  version: number;
}

export interface CapacityRankedCandidateProofSnapshot {
  candidateRank: number;
  candidateRef: string;
  windowClass: RequiredWindowFit;
  sourceTrustState: SourceTrustState;
  sourceTrustTier: 0 | 1 | 2;
  baseUtility: number;
  uncertaintyRadius: number;
  robustFit: number;
  travelMinutes: number;
  startAt: string;
  offerabilityState: CapacityOfferabilityState;
  patientOfferable: boolean;
  directCommitEligible: boolean;
  capacityRankExplanationRef: string;
  patientReasonCueRefs: readonly string[];
}

export interface CapacityRankProofSnapshot {
  capacityRankProofId: string;
  networkCandidateSnapshotRef: string;
  rankPlanVersionRef: string;
  uncertaintyModelVersionRef: string;
  policyTupleHash: string;
  proofChecksum: string;
  orderedCandidateRefs: readonly string[];
  rankedCandidates: readonly CapacityRankedCandidateProofSnapshot[];
  generatedAt: string;
  version: number;
}

export interface NetworkCandidateSnapshot {
  snapshotId: string;
  hubCoordinationCaseId: string;
  policyEvaluationRef: string;
  compiledPolicyBundleRef: string;
  policyTupleHash: string;
  rankPlanVersionRef: string;
  uncertaintyModelVersionRef: string;
  fetchedAt: string;
  expiresAt: string;
  candidateRefs: readonly string[];
  candidateCount: number;
  trustedCandidateCount: number;
  degradedCandidateCount: number;
  quarantinedCandidateCount: number;
  capacityRankProofRef: string;
  capacityRankExplanationRefs: readonly string[];
  sourceRefs: readonly string[];
  version: number;
}

export interface CrossSiteDominanceDecisionSnapshot {
  winnerCandidateRef: string;
  loserCandidateRef: string;
  weaklyDominatedOn: readonly string[];
  strictCoordinates: readonly string[];
  persistedEffect: string;
}

export interface CrossSiteDecisionPlanSnapshot {
  decisionPlanId: string;
  hubCoordinationCaseId: string;
  snapshotId: string;
  policyEvaluationRef: string;
  policyTupleHash: string;
  orderedCandidateRefs: readonly string[];
  patientOfferableFrontierRefs: readonly string[];
  directCommitFrontierRefs: readonly string[];
  callbackReasoningRefs: readonly string[];
  diagnosticOnlyRefs: readonly string[];
  dominanceDecisions: readonly CrossSiteDominanceDecisionSnapshot[];
  generatedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface EnhancedAccessMinutesLedgerSnapshot {
  enhancedAccessMinutesLedgerId: string;
  pcnRef: string;
  policyTupleHash: string;
  weekStartAt: string;
  weekEndAt: string;
  adjustedPopulation: number;
  minutesPer1000Required: number;
  requiredMinutes: number;
  deliveredMinutes: number;
  availableMinutes: number;
  cancelledMinutes: number;
  replacementMinutes: number;
  ledgerState: "on_track" | "at_risk" | "make_up_required" | "completed";
  sourceRefs: readonly string[];
  version: number;
}

export interface CancellationMakeUpLedgerSnapshot {
  cancellationMakeUpLedgerId: string;
  pcnRef: string;
  policyTupleHash: string;
  serviceDate: string;
  cancelledMinutes: number;
  replacementMinutes: number;
  makeUpDueAt: string;
  commissionerExceptionRef: string | null;
  makeUpState: "replacement_due" | "replacement_provided" | "exception_granted" | "expired";
  sourceRefs: readonly string[];
  version: number;
}

export interface CapacitySupplyExceptionSnapshot {
  capacitySupplyExceptionId: string;
  snapshotId: string | null;
  hubCoordinationCaseId: string;
  sourceRef: string | null;
  candidateRef: string | null;
  family: CapacitySupplyExceptionFamily;
  exceptionCode: CapacitySupplyExceptionCode;
  severity: CapacitySupplyExceptionSeverity;
  safeSummary: string;
  createdAt: string;
  version: number;
}

export interface NetworkCapacityReplayFixtureSnapshot {
  networkCapacityReplayFixtureId: string;
  snapshotId: string;
  hubCoordinationCaseId: string;
  evaluatedAt: string;
  presentedPolicyTupleHash: string | null;
  adjustedPopulation: number | null;
  deliveredMinutes: number | null;
  availableMinutes: number | null;
  cancelledMinutes: number | null;
  replacementMinutes: number | null;
  commissionerExceptionRef: string | null;
  minimumNecessaryContractRef: string | null;
  weekStartAt: string | null;
  weekEndAt: string | null;
  cancellationServiceDate: string | null;
  adapterBindings: readonly HubCapacityAdapterBindingSnapshot[];
  sourceRefs: readonly string[];
  version: number;
}

export interface BuildNetworkCandidateSnapshotInput {
  hubCoordinationCaseId: string;
  evaluatedAt: string;
  adapterBindings: readonly HubCapacityAdapterBindingSnapshot[];
  presentedPolicyTupleHash?: string | null;
  adjustedPopulation?: number | null;
  deliveredMinutes?: number | null;
  availableMinutes?: number | null;
  cancelledMinutes?: number | null;
  replacementMinutes?: number | null;
  commissionerExceptionRef?: string | null;
  minimumNecessaryContractRef?: string | null;
  weekStartAt?: string | null;
  weekEndAt?: string | null;
  cancellationServiceDate?: string | null;
  sourceRefs?: readonly string[];
}

export interface NetworkCapacityPipelineResult {
  snapshotId: string;
  hubCaseBundle: HubCaseBundle;
  activePolicySet: ActivePolicyPackSet;
  policyResult: NetworkPolicyEvaluationResult;
  adapterRuns: readonly CapacityAdapterRunSnapshot[];
  sourceAdmissions: readonly CapacitySourceTrustAdmissionSnapshot[];
  candidates: readonly NetworkSlotCandidateSnapshot[];
  snapshot: NetworkCandidateSnapshot | null;
  rankProof: CapacityRankProofSnapshot | null;
  rankExplanations: readonly CapacityRankExplanationSnapshot[];
  decisionPlan: CrossSiteDecisionPlanSnapshot | null;
  minutesLedger: EnhancedAccessMinutesLedgerSnapshot;
  cancellationMakeUpLedger: CancellationMakeUpLedgerSnapshot | null;
  supplyExceptions: readonly CapacitySupplyExceptionSnapshot[];
  replayFixture: NetworkCapacityReplayFixtureSnapshot;
}

export interface NetworkCapacityReplayResult extends NetworkCapacityPipelineResult {
  matchesStoredSnapshot: boolean;
  mismatchFields: readonly string[];
  originalSnapshot: NetworkCandidateSnapshot | null;
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

export interface Phase5NetworkCapacityPipelineRepositories {
  getAdapterRun(adapterRunId: string): Promise<SnapshotDocument<CapacityAdapterRunSnapshot> | null>;
  saveAdapterRun(
    snapshot: CapacityAdapterRunSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdapterRunsForSnapshot(
    snapshotId: string,
  ): Promise<readonly SnapshotDocument<CapacityAdapterRunSnapshot>[]>;
  getSourceTrustAdmission(
    sourceTrustAdmissionId: string,
  ): Promise<SnapshotDocument<CapacitySourceTrustAdmissionSnapshot> | null>;
  saveSourceTrustAdmission(
    snapshot: CapacitySourceTrustAdmissionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSourceTrustAdmissionsForSnapshot(
    snapshotId: string,
  ): Promise<readonly SnapshotDocument<CapacitySourceTrustAdmissionSnapshot>[]>;
  getCandidate(
    candidateId: string,
  ): Promise<SnapshotDocument<NetworkSlotCandidateSnapshot> | null>;
  saveCandidate(
    snapshot: NetworkSlotCandidateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listCandidatesForSnapshot(
    snapshotId: string,
  ): Promise<readonly SnapshotDocument<NetworkSlotCandidateSnapshot>[]>;
  getSnapshot(snapshotId: string): Promise<SnapshotDocument<NetworkCandidateSnapshot> | null>;
  saveSnapshot(
    snapshot: NetworkCandidateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSnapshotsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<NetworkCandidateSnapshot>[]>;
  getRankProof(
    capacityRankProofId: string,
  ): Promise<SnapshotDocument<CapacityRankProofSnapshot> | null>;
  saveRankProof(
    snapshot: CapacityRankProofSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getRankExplanation(
    capacityRankExplanationId: string,
  ): Promise<SnapshotDocument<CapacityRankExplanationSnapshot> | null>;
  saveRankExplanation(
    snapshot: CapacityRankExplanationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listRankExplanationsForSnapshot(
    snapshotId: string,
  ): Promise<readonly SnapshotDocument<CapacityRankExplanationSnapshot>[]>;
  getDecisionPlan(
    decisionPlanId: string,
  ): Promise<SnapshotDocument<CrossSiteDecisionPlanSnapshot> | null>;
  saveDecisionPlan(
    snapshot: CrossSiteDecisionPlanSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveMinutesLedger(
    snapshot: EnhancedAccessMinutesLedgerSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listMinutesLedgersForPcn(
    pcnRef: string,
  ): Promise<readonly SnapshotDocument<EnhancedAccessMinutesLedgerSnapshot>[]>;
  saveCancellationMakeUpLedger(
    snapshot: CancellationMakeUpLedgerSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listCancellationMakeUpLedgersForPcn(
    pcnRef: string,
  ): Promise<readonly SnapshotDocument<CancellationMakeUpLedgerSnapshot>[]>;
  appendSupplyException(snapshot: CapacitySupplyExceptionSnapshot): Promise<void>;
  listSupplyExceptionsForSnapshot(
    snapshotId: string,
  ): Promise<readonly SnapshotDocument<CapacitySupplyExceptionSnapshot>[]>;
  saveReplayFixture(
    snapshot: NetworkCapacityReplayFixtureSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReplayFixtureForSnapshot(
    snapshotId: string,
  ): Promise<SnapshotDocument<NetworkCapacityReplayFixtureSnapshot> | null>;
}

export class Phase5NetworkCapacityPipelineStore
  implements Phase5NetworkCapacityPipelineRepositories
{
  private readonly adapterRuns = new Map<string, CapacityAdapterRunSnapshot>();
  private readonly snapshotAdapterRuns = new Map<string, string[]>();
  private readonly sourceTrustAdmissions = new Map<string, CapacitySourceTrustAdmissionSnapshot>();
  private readonly snapshotAdmissions = new Map<string, string[]>();
  private readonly candidates = new Map<string, NetworkSlotCandidateSnapshot>();
  private readonly snapshotCandidates = new Map<string, string[]>();
  private readonly snapshots = new Map<string, NetworkCandidateSnapshot>();
  private readonly caseSnapshots = new Map<string, string[]>();
  private readonly rankProofs = new Map<string, CapacityRankProofSnapshot>();
  private readonly rankExplanations = new Map<string, CapacityRankExplanationSnapshot>();
  private readonly snapshotRankExplanations = new Map<string, string[]>();
  private readonly decisionPlans = new Map<string, CrossSiteDecisionPlanSnapshot>();
  private readonly minutesLedgers = new Map<string, EnhancedAccessMinutesLedgerSnapshot>();
  private readonly pcnMinutesLedgers = new Map<string, string[]>();
  private readonly cancellationLedgers = new Map<string, CancellationMakeUpLedgerSnapshot>();
  private readonly pcnCancellationLedgers = new Map<string, string[]>();
  private readonly supplyExceptions = new Map<string, CapacitySupplyExceptionSnapshot[]>();
  private readonly replayFixtures = new Map<string, NetworkCapacityReplayFixtureSnapshot>();

  private candidateStoreKey(snapshotId: string, candidateId: string): string {
    return `${snapshotId}:${candidateId}`;
  }

  private rankExplanationStoreKey(snapshotId: string, explanationId: string): string {
    return `${snapshotId}:${explanationId}`;
  }

  async getAdapterRun(adapterRunId: string) {
    const snapshot = this.adapterRuns.get(adapterRunId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveAdapterRun(snapshot: CapacityAdapterRunSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.adapterRuns, snapshot.adapterRunId, snapshot, options);
    if (snapshot.snapshotId) {
      const ids = this.snapshotAdapterRuns.get(snapshot.snapshotId) ?? [];
      if (!ids.includes(snapshot.adapterRunId)) {
        ids.push(snapshot.adapterRunId);
        this.snapshotAdapterRuns.set(snapshot.snapshotId, ids);
      }
    }
  }

  async listAdapterRunsForSnapshot(snapshotId: string) {
    return (this.snapshotAdapterRuns.get(snapshotId) ?? [])
      .map((adapterRunId) => this.adapterRuns.get(adapterRunId))
      .filter((value): value is CapacityAdapterRunSnapshot => value !== undefined)
      .map((value) => new StoredDocument(value));
  }

  async getSourceTrustAdmission(sourceTrustAdmissionId: string) {
    const snapshot = this.sourceTrustAdmissions.get(sourceTrustAdmissionId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveSourceTrustAdmission(
    snapshot: CapacitySourceTrustAdmissionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.sourceTrustAdmissions,
      snapshot.sourceTrustAdmissionId,
      snapshot,
      options,
    );
    if (snapshot.snapshotId) {
      const ids = this.snapshotAdmissions.get(snapshot.snapshotId) ?? [];
      if (!ids.includes(snapshot.sourceTrustAdmissionId)) {
        ids.push(snapshot.sourceTrustAdmissionId);
        this.snapshotAdmissions.set(snapshot.snapshotId, ids);
      }
    }
  }

  async listSourceTrustAdmissionsForSnapshot(snapshotId: string) {
    return (this.snapshotAdmissions.get(snapshotId) ?? [])
      .map((admissionId) => this.sourceTrustAdmissions.get(admissionId))
      .filter((value): value is CapacitySourceTrustAdmissionSnapshot => value !== undefined)
      .map((value) => new StoredDocument(value));
  }

  async getCandidate(candidateId: string) {
    const snapshot = [...this.candidates.values()].find((value) => value.candidateId === candidateId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveCandidate(snapshot: NetworkSlotCandidateSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(
      this.candidates,
      this.candidateStoreKey(snapshot.networkCandidateSnapshotRef, snapshot.candidateId),
      snapshot,
      options,
    );
    const ids = this.snapshotCandidates.get(snapshot.networkCandidateSnapshotRef) ?? [];
    if (!ids.includes(snapshot.candidateId)) {
      ids.push(snapshot.candidateId);
      this.snapshotCandidates.set(snapshot.networkCandidateSnapshotRef, ids);
    }
  }

  async listCandidatesForSnapshot(snapshotId: string) {
    return (this.snapshotCandidates.get(snapshotId) ?? [])
      .map((candidateId) => this.candidates.get(this.candidateStoreKey(snapshotId, candidateId)))
      .filter((value): value is NetworkSlotCandidateSnapshot => value !== undefined)
      .map((value) => new StoredDocument(value));
  }

  async getSnapshot(snapshotId: string) {
    const snapshot = this.snapshots.get(snapshotId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveSnapshot(snapshot: NetworkCandidateSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.snapshots, snapshot.snapshotId, snapshot, options);
    const ids = this.caseSnapshots.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!ids.includes(snapshot.snapshotId)) {
      ids.push(snapshot.snapshotId);
      this.caseSnapshots.set(snapshot.hubCoordinationCaseId, ids);
    }
  }

  async listSnapshotsForCase(hubCoordinationCaseId: string) {
    return (this.caseSnapshots.get(hubCoordinationCaseId) ?? [])
      .map((snapshotId) => this.snapshots.get(snapshotId))
      .filter((value): value is NetworkCandidateSnapshot => value !== undefined)
      .map((value) => new StoredDocument(value));
  }

  async getRankProof(capacityRankProofId: string) {
    const snapshot = this.rankProofs.get(capacityRankProofId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveRankProof(snapshot: CapacityRankProofSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.rankProofs, snapshot.capacityRankProofId, snapshot, options);
  }

  async getRankExplanation(capacityRankExplanationId: string) {
    const snapshot = [...this.rankExplanations.values()].find(
      (value) => value.capacityRankExplanationId === capacityRankExplanationId,
    );
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveRankExplanation(
    snapshot: CapacityRankExplanationSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.rankExplanations,
      this.rankExplanationStoreKey(
        snapshot.networkCandidateSnapshotRef,
        snapshot.capacityRankExplanationId,
      ),
      snapshot,
      options,
    );
    const ids = this.snapshotRankExplanations.get(snapshot.networkCandidateSnapshotRef) ?? [];
    if (!ids.includes(snapshot.capacityRankExplanationId)) {
      ids.push(snapshot.capacityRankExplanationId);
      this.snapshotRankExplanations.set(snapshot.networkCandidateSnapshotRef, ids);
    }
  }

  async listRankExplanationsForSnapshot(snapshotId: string) {
    return (this.snapshotRankExplanations.get(snapshotId) ?? [])
      .map((explanationId) =>
        this.rankExplanations.get(this.rankExplanationStoreKey(snapshotId, explanationId)),
      )
      .filter((value): value is CapacityRankExplanationSnapshot => value !== undefined)
      .map((value) => new StoredDocument(value));
  }

  async getDecisionPlan(decisionPlanId: string) {
    const snapshot = this.decisionPlans.get(decisionPlanId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveDecisionPlan(
    snapshot: CrossSiteDecisionPlanSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.decisionPlans, snapshot.decisionPlanId, snapshot, options);
  }

  async saveMinutesLedger(
    snapshot: EnhancedAccessMinutesLedgerSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.minutesLedgers,
      snapshot.enhancedAccessMinutesLedgerId,
      snapshot,
      options,
    );
    const ids = this.pcnMinutesLedgers.get(snapshot.pcnRef) ?? [];
    if (!ids.includes(snapshot.enhancedAccessMinutesLedgerId)) {
      ids.push(snapshot.enhancedAccessMinutesLedgerId);
      this.pcnMinutesLedgers.set(snapshot.pcnRef, ids);
    }
  }

  async listMinutesLedgersForPcn(pcnRef: string) {
    return (this.pcnMinutesLedgers.get(pcnRef) ?? [])
      .map((ledgerId) => this.minutesLedgers.get(ledgerId))
      .filter((value): value is EnhancedAccessMinutesLedgerSnapshot => value !== undefined)
      .map((value) => new StoredDocument(value));
  }

  async saveCancellationMakeUpLedger(
    snapshot: CancellationMakeUpLedgerSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.cancellationLedgers,
      snapshot.cancellationMakeUpLedgerId,
      snapshot,
      options,
    );
    const ids = this.pcnCancellationLedgers.get(snapshot.pcnRef) ?? [];
    if (!ids.includes(snapshot.cancellationMakeUpLedgerId)) {
      ids.push(snapshot.cancellationMakeUpLedgerId);
      this.pcnCancellationLedgers.set(snapshot.pcnRef, ids);
    }
  }

  async listCancellationMakeUpLedgersForPcn(pcnRef: string) {
    return (this.pcnCancellationLedgers.get(pcnRef) ?? [])
      .map((ledgerId) => this.cancellationLedgers.get(ledgerId))
      .filter((value): value is CancellationMakeUpLedgerSnapshot => value !== undefined)
      .map((value) => new StoredDocument(value));
  }

  async appendSupplyException(snapshot: CapacitySupplyExceptionSnapshot) {
    const entries = this.supplyExceptions.get(snapshot.snapshotId ?? "__none__") ?? [];
    entries.push(structuredClone(snapshot));
    this.supplyExceptions.set(snapshot.snapshotId ?? "__none__", entries);
  }

  async listSupplyExceptionsForSnapshot(snapshotId: string) {
    return (this.supplyExceptions.get(snapshotId) ?? []).map((value) => new StoredDocument(value));
  }

  async saveReplayFixture(
    snapshot: NetworkCapacityReplayFixtureSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.replayFixtures, snapshot.snapshotId, snapshot, options);
  }

  async getReplayFixtureForSnapshot(snapshotId: string) {
    const snapshot = this.replayFixtures.get(snapshotId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }
}

export function createPhase5NetworkCapacityPipelineStore() {
  return new Phase5NetworkCapacityPipelineStore();
}

function validateSourceMode(mode: string): HubCapacitySourceMode {
  invariant(
    phase5HubCapacitySourceModes.includes(mode as HubCapacitySourceMode),
    "INVALID_SOURCE_MODE",
    `sourceMode must be one of ${phase5HubCapacitySourceModes.join(", ")}.`,
  );
  return mode as HubCapacitySourceMode;
}

function normalizeTrustState(input: CapacitySourceTrustRecordInput): SourceTrustState {
  ensureUnitInterval(input.trustLowerBound, "trustLowerBound");
  ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
  ensureIsoTimestamp(input.reviewDueAt, "reviewDueAt");
  requireRef(input.sourceTrustRef, "sourceTrustRef");
  if (input.hardBlock || input.completenessState === "blocked" || input.trustLowerBound < 0.4) {
    return "quarantined";
  }
  if (input.trustLowerBound >= 0.85 && input.completenessState === "complete") {
    return "trusted";
  }
  return "degraded";
}

function trustTier(trustState: SourceTrustState): 0 | 1 | 2 {
  if (trustState === "trusted") {
    return 2;
  }
  if (trustState === "degraded") {
    return 1;
  }
  return 0;
}

function freshnessState(
  policy: HubCapacityIngestionPolicySnapshot,
  stalenessMinutes: number,
): CapacitySourceFreshnessState {
  if (stalenessMinutes <= policy.freshnessThresholdMinutes) {
    return "fresh";
  }
  if (stalenessMinutes <= policy.staleThresholdMinutes) {
    return "aging";
  }
  return "stale";
}

function admissionDisposition(
  policy: HubCapacityIngestionPolicySnapshot,
  sourceTrustState: SourceTrustState,
  sourceFreshnessState: CapacitySourceFreshnessState,
): CapacityAdmissionDisposition {
  if (sourceFreshnessState === "stale") {
    return "stale_capacity";
  }
  if (sourceTrustState === "quarantined") {
    return "quarantined_excluded";
  }
  if (sourceTrustState === "degraded") {
    return policy.degradedVisibilityModes.includes("callback_only_reasoning")
      ? "degraded_callback_only"
      : "degraded_diagnostic_only";
  }
  return "trusted_admitted";
}

function exceptionSummary(code: CapacitySupplyExceptionCode): string {
  switch (code) {
    case "CAPACITY_MISSING":
      return "No usable network capacity is available for the current snapshot build.";
    case "CAPACITY_STALE":
      return "Capacity freshness is stale and cannot be treated as authoritative booking truth.";
    case "CAPACITY_DEGRADED_CALLBACK_ONLY":
      return "Capacity trust is degraded and is retained only for callback reasoning.";
    case "CAPACITY_DEGRADED_DIAGNOSTIC_ONLY":
      return "Capacity trust is degraded and is retained only for diagnostic-only reasoning.";
    case "CAPACITY_QUARANTINED":
      return "Capacity trust is quarantined and is excluded from ordinary offerable surfaces.";
    case "CAPACITY_HIDDEN":
      return "The candidate is hidden from patient or direct-commit surfaces under current rules.";
    case "CAPACITY_POLICY_INVALID":
      return "Capacity fell outside the active governed offer window and was rejected.";
    case "CAPACITY_DEDUPE_COLLISION":
      return "Duplicate or overlapping capacity was merged to one canonical capacity unit.";
  }
}

function exceptionFamily(code: CapacitySupplyExceptionCode): CapacitySupplyExceptionFamily {
  switch (code) {
    case "CAPACITY_MISSING":
      return "missing";
    case "CAPACITY_STALE":
      return "staleness";
    case "CAPACITY_DEGRADED_CALLBACK_ONLY":
    case "CAPACITY_DEGRADED_DIAGNOSTIC_ONLY":
    case "CAPACITY_QUARANTINED":
      return "trust";
    case "CAPACITY_HIDDEN":
      return "visibility";
    case "CAPACITY_POLICY_INVALID":
      return "policy";
    case "CAPACITY_DEDUPE_COLLISION":
      return "dedupe";
  }
}

function exceptionSeverity(code: CapacitySupplyExceptionCode): CapacitySupplyExceptionSeverity {
  switch (code) {
    case "CAPACITY_DEDUPE_COLLISION":
    case "CAPACITY_HIDDEN":
      return "warning";
    case "CAPACITY_DEGRADED_CALLBACK_ONLY":
      return "warning";
    default:
      return "blocking";
  }
}

function sourceRefsForSnapshot(
  ...collections: ReadonlyArray<readonly string[] | undefined>
): readonly string[] {
  return uniqueSortedRefs(collections.flatMap((value) => value ?? []));
}

function resolveRequiredWindowFit(
  startAt: string,
  bundle: HubCaseBundle,
  policy: ActivePolicyPackSet,
): RequiredWindowFit {
  const start = Date.parse(startAt);
  const latestSafeOfferAt = Date.parse(
    bundle.networkBookingRequest.clinicalTimeframe.latestSafeOfferAt ??
      bundle.networkBookingRequest.clinicalTimeframe.dueAt,
  );
  const dueAt = Date.parse(bundle.networkBookingRequest.clinicalTimeframe.dueAt);
  if (start <= latestSafeOfferAt) {
    return 2;
  }
  if (
    start <=
      dueAt + policy.varianceWindowPolicy.approvedVarianceAfterMinutes * 60_000 &&
    start >=
      latestSafeOfferAt -
        policy.varianceWindowPolicy.approvedVarianceBeforeMinutes * 60_000
  ) {
    return 1;
  }
  return 0;
}

function normalizedCapacityUnitRef(
  sourceMode: HubCapacitySourceMode,
  sourceIdentity: string,
  row: HubCapacityRawSupplyRow,
): string {
  const explicit = optionalRef(row.capacityUnitRef);
  if (explicit) {
    return explicit;
  }
  return `capacity_unit_${sha256Hex(
    stableStringify({
      sourceMode,
      sourceIdentity,
      upstreamSlotRef: optionalRef(row.upstreamSlotRef),
      siteId: row.siteId,
      startAt: row.startAt,
      endAt: row.endAt,
      modality: row.modality,
      clinicianType: row.clinicianType,
    }),
  ).slice(0, 24)}`;
}

function rankPlanConfig(rankPlanVersionRef: string): Phase5RankPlanConfig {
  const config = rankPlanCatalog[rankPlanVersionRef as keyof typeof rankPlanCatalog];
  invariant(
    config !== undefined,
    "UNKNOWN_RANK_PLAN_VERSION",
    `Unsupported rankPlanVersionRef ${rankPlanVersionRef}.`,
  );
  return config;
}

function uncertaintyConfig(uncertaintyModelVersionRef: string): Phase5UncertaintyModelConfig {
  const config =
    uncertaintyModelCatalog[
      uncertaintyModelVersionRef as keyof typeof uncertaintyModelCatalog
    ];
  invariant(
    config !== undefined,
    "UNKNOWN_UNCERTAINTY_MODEL_VERSION",
    `Unsupported uncertaintyModelVersionRef ${uncertaintyModelVersionRef}.`,
  );
  return config;
}

function manageScore(manageCapabilityState: ManageCapabilityState): number {
  if (manageCapabilityState === "network_manage_ready") {
    return 1;
  }
  if (manageCapabilityState === "read_only") {
    return 0.72;
  }
  return 0.2;
}

function buildBaseUtility(input: {
  waitMinutes: number;
  travelMinutes: number;
  accessibilityFitScore: number;
  requiredWindowFit: RequiredWindowFit;
  manageCapabilityState: ManageCapabilityState;
  rankPlanVersionRef: string;
}): number {
  const config = rankPlanConfig(input.rankPlanVersionRef);
  const waitScore = Math.exp(-input.waitMinutes / config.tauWaitMinutes);
  const travelScore = Math.exp(-input.travelMinutes / config.tauTravelMinutes);
  const windowScore = input.requiredWindowFit / 2;
  const score =
    config.windowWeight * windowScore +
    config.waitWeight * waitScore +
    config.travelWeight * travelScore +
    config.accessibilityWeight * input.accessibilityFitScore +
    config.manageWeight * manageScore(input.manageCapabilityState);
  return Number(clamp(score, 0, 1).toFixed(6));
}

function buildUncertaintyRadius(input: {
  sourceTrustState: SourceTrustState;
  sourceFreshnessState: CapacitySourceFreshnessState;
  manageCapabilityState: ManageCapabilityState;
  uncertaintyModelVersionRef: string;
}): number {
  const config = uncertaintyConfig(input.uncertaintyModelVersionRef);
  const trustPenalty =
    input.sourceTrustState === "trusted"
      ? config.trustedPenalty
      : input.sourceTrustState === "degraded"
        ? config.degradedPenalty
        : config.quarantinedPenalty;
  const freshnessPenalty =
    input.sourceFreshnessState === "fresh"
      ? config.freshPenalty
      : input.sourceFreshnessState === "aging"
        ? config.agingPenalty
        : config.stalePenalty;
  const managePenalty =
    input.manageCapabilityState === "network_manage_ready"
      ? 0
      : input.manageCapabilityState === "read_only"
        ? config.readOnlyPenalty
        : config.blockedPenalty;
  return Number(clamp(trustPenalty + freshnessPenalty + managePenalty, 0, 0.95).toFixed(6));
}

function resolveOfferabilityState(input: {
  requiredWindowFit: RequiredWindowFit;
  manageCapabilityState: ManageCapabilityState;
  sourceTrustState: SourceTrustState;
  sourceFreshnessState: CapacitySourceFreshnessState;
  admissionDisposition: CapacityAdmissionDisposition;
}): CapacityOfferabilityState {
  if (
    input.admissionDisposition === "quarantined_excluded" ||
    input.admissionDisposition === "degraded_diagnostic_only"
  ) {
    return "diagnostic_only";
  }
  if (
    input.admissionDisposition === "degraded_callback_only" ||
    input.admissionDisposition === "stale_capacity" ||
    input.requiredWindowFit === 0
  ) {
    return "callback_only_reasoning";
  }
  if (input.manageCapabilityState === "blocked") {
    return "callback_only_reasoning";
  }
  if (
    input.sourceTrustState === "trusted" &&
    input.sourceFreshnessState !== "stale" &&
    input.manageCapabilityState === "network_manage_ready"
  ) {
    return "direct_commit";
  }
  return "patient_offerable";
}

function orderCandidates(
  left: Pick<
    NetworkSlotCandidateSnapshot,
    "windowClass" | "sourceTrustTier" | "robustFit" | "travelMinutes" | "startAt" | "candidateId"
  >,
  right: Pick<
    NetworkSlotCandidateSnapshot,
    "windowClass" | "sourceTrustTier" | "robustFit" | "travelMinutes" | "startAt" | "candidateId"
  >,
): number {
  if (left.windowClass !== right.windowClass) {
    return right.windowClass - left.windowClass;
  }
  if (left.sourceTrustTier !== right.sourceTrustTier) {
    return right.sourceTrustTier - left.sourceTrustTier;
  }
  if (left.robustFit !== right.robustFit) {
    return right.robustFit - left.robustFit;
  }
  if (left.travelMinutes !== right.travelMinutes) {
    return left.travelMinutes - right.travelMinutes;
  }
  const isoOrder = compareIso(left.startAt, right.startAt);
  if (isoOrder !== 0) {
    return isoOrder;
  }
  return left.candidateId.localeCompare(right.candidateId);
}

function sourceWinsTie(left: CandidateDraft, right: CandidateDraft): boolean {
  if (left.sourceTrustTier !== right.sourceTrustTier) {
    return left.sourceTrustTier > right.sourceTrustTier;
  }
  const freshnessRank = {
    fresh: 2,
    aging: 1,
    stale: 0,
  } as const satisfies Record<CapacitySourceFreshnessState, number>;
  if (freshnessRank[left.sourceFreshnessState] !== freshnessRank[right.sourceFreshnessState]) {
    return freshnessRank[left.sourceFreshnessState] > freshnessRank[right.sourceFreshnessState];
  }
  if (left.manageCapabilityState !== right.manageCapabilityState) {
    return manageScore(left.manageCapabilityState) > manageScore(right.manageCapabilityState);
  }
  const leftMode = sourceModePrecedence[left.sourceMode];
  const rightMode = sourceModePrecedence[right.sourceMode];
  if (leftMode !== rightMode) {
    return leftMode > rightMode;
  }
  return left.candidateId.localeCompare(right.candidateId) <= 0;
}

function buildPatientCue(input: {
  candidateRank: number;
  windowClass: RequiredWindowFit;
  sourceTrustState: SourceTrustState;
  offerabilityState: CapacityOfferabilityState;
}): readonly string[] {
  const cues: string[] = [];
  if (input.windowClass === 2) {
    cues.push("cue_inside_required_window");
  } else if (input.windowClass === 1) {
    cues.push("cue_inside_approved_variance");
  }
  if (input.offerabilityState === "callback_only_reasoning") {
    cues.push("cue_visible_for_callback_only");
  } else if (input.offerabilityState === "diagnostic_only") {
    cues.push("cue_hidden_from_booking_truth");
  } else if (input.sourceTrustState === "trusted") {
    cues.push(input.candidateRank === 1 ? "cue_trusted_fastest_fit" : "cue_trusted_alternative");
  }
  return cues;
}

function buildBlockedReasonRefs(candidate: {
  requiredWindowFit: RequiredWindowFit;
  offerabilityState: CapacityOfferabilityState;
  sourceTrustState: SourceTrustState;
  sourceFreshnessState: CapacitySourceFreshnessState;
  manageCapabilityState: ManageCapabilityState;
}): readonly string[] {
  const reasons: string[] = [];
  if (candidate.requiredWindowFit === 0) {
    reasons.push("outside_window_visible_by_policy");
  }
  if (candidate.sourceTrustState === "degraded") {
    reasons.push("degraded_trust");
  }
  if (candidate.sourceTrustState === "quarantined") {
    reasons.push("quarantined_trust");
  }
  if (candidate.sourceFreshnessState === "stale") {
    reasons.push("stale_capacity");
  }
  if (candidate.manageCapabilityState !== "network_manage_ready") {
    reasons.push(`manage_${candidate.manageCapabilityState}`);
  }
  if (candidate.offerabilityState === "callback_only_reasoning") {
    reasons.push("callback_only_reasoning");
  }
  if (candidate.offerabilityState === "diagnostic_only") {
    reasons.push("diagnostic_only");
  }
  return uniqueSortedRefs(reasons);
}

function staffReasonRefs(candidate: {
  requiredWindowFit: RequiredWindowFit;
  sourceTrustState: SourceTrustState;
  sourceFreshnessState: CapacitySourceFreshnessState;
  travelMinutes: number;
  waitMinutes: number;
  stalenessMinutes: number;
  manageCapabilityState: ManageCapabilityState;
}): readonly string[] {
  return [
    `required_window_fit=${candidate.requiredWindowFit}`,
    `source_trust_state=${candidate.sourceTrustState}`,
    `source_freshness_state=${candidate.sourceFreshnessState}`,
    `travel_minutes=${candidate.travelMinutes}`,
    `wait_minutes=${candidate.waitMinutes}`,
    `staleness_minutes=${candidate.stalenessMinutes}`,
    `manage_capability_state=${candidate.manageCapabilityState}`,
  ];
}

function weakDominates(left: NetworkSlotCandidateSnapshot, right: NetworkSlotCandidateSnapshot): {
  dominates: boolean;
  weaklyDominatedOn: readonly string[];
  strictCoordinates: readonly string[];
} {
  const weakCoordinates: string[] = [];
  const strictCoordinates: string[] = [];

  if (left.windowClass >= right.windowClass) {
    weakCoordinates.push("windowClass");
    if (left.windowClass > right.windowClass) {
      strictCoordinates.push("windowClass");
    }
  } else {
    return { dominates: false, weaklyDominatedOn: [], strictCoordinates: [] };
  }

  if (left.sourceTrustTier >= right.sourceTrustTier) {
    weakCoordinates.push("sourceTrustTier");
    if (left.sourceTrustTier > right.sourceTrustTier) {
      strictCoordinates.push("sourceTrustTier");
    }
  } else {
    return { dominates: false, weaklyDominatedOn: [], strictCoordinates: [] };
  }

  if (left.robustFit >= right.robustFit) {
    weakCoordinates.push("robustFit");
    if (left.robustFit > right.robustFit) {
      strictCoordinates.push("robustFit");
    }
  } else {
    return { dominates: false, weaklyDominatedOn: [], strictCoordinates: [] };
  }

  if (compareIso(left.startAt, right.startAt) <= 0) {
    weakCoordinates.push("startAt");
    if (compareIso(left.startAt, right.startAt) < 0) {
      strictCoordinates.push("startAt");
    }
  } else {
    return { dominates: false, weaklyDominatedOn: [], strictCoordinates: [] };
  }

  return {
    dominates: strictCoordinates.length > 0,
    weaklyDominatedOn: weakCoordinates,
    strictCoordinates,
  };
}

function createSupplyException(
  idGenerator: BackboneIdGenerator,
  input: {
    snapshotId: string | null;
    hubCoordinationCaseId: string;
    sourceRef?: string | null;
    candidateRef?: string | null;
    exceptionCode: CapacitySupplyExceptionCode;
    createdAt: string;
  },
): CapacitySupplyExceptionSnapshot {
  return {
    capacitySupplyExceptionId: nextId(idGenerator, "capacity_supply_exception"),
    snapshotId: input.snapshotId ?? null,
    hubCoordinationCaseId: requireRef(input.hubCoordinationCaseId, "hubCoordinationCaseId"),
    sourceRef: optionalRef(input.sourceRef),
    candidateRef: optionalRef(input.candidateRef),
    family: exceptionFamily(input.exceptionCode),
    exceptionCode: input.exceptionCode,
    severity: exceptionSeverity(input.exceptionCode),
    safeSummary: exceptionSummary(input.exceptionCode),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    version: 1,
  };
}

function normalizeAdapterRow(row: HubCapacityRawSupplyRow): HubCapacityRawSupplyRow {
  return {
    upstreamSlotRef: optionalRef(row.upstreamSlotRef),
    capacityUnitRef: optionalRef(row.capacityUnitRef),
    siteId: requireRef(row.siteId, "siteId"),
    siteLabel: optionalRef(row.siteLabel),
    timezone: requireRef(row.timezone, "timezone"),
    modality: requireRef(row.modality, "modality"),
    clinicianType: requireRef(row.clinicianType, "clinicianType"),
    startAt: ensureIsoTimestamp(row.startAt, "startAt"),
    endAt: ensureIsoTimestamp(row.endAt, "endAt"),
    manageCapabilityState: row.manageCapabilityState,
    accessibilityFitScore: ensureUnitInterval(row.accessibilityFitScore, "accessibilityFitScore"),
    travelMinutes: ensureNonNegativeInteger(row.travelMinutes, "travelMinutes"),
    sourceRefs: uniqueSortedRefs(row.sourceRefs ?? []),
  };
}

function normalizeBinding(binding: HubCapacityAdapterBindingSnapshot): HubCapacityAdapterBindingSnapshot {
  const sourceMode = validateSourceMode(binding.sourceMode);
  return {
    bindingRef: requireRef(binding.bindingRef, "bindingRef"),
    sourceMode,
    sourceRef: requireRef(binding.sourceRef, "sourceRef"),
    sourceIdentity: requireRef(binding.sourceIdentity, "sourceIdentity"),
    sourceVersion: requireRef(binding.sourceVersion, "sourceVersion"),
    fetchedAt: ensureIsoTimestamp(binding.fetchedAt, "fetchedAt"),
    trustRecord: {
      sourceTrustRef: requireRef(binding.trustRecord.sourceTrustRef, "sourceTrustRef"),
      trustLowerBound: ensureUnitInterval(binding.trustRecord.trustLowerBound, "trustLowerBound"),
      completenessState: binding.trustRecord.completenessState,
      hardBlock: Boolean(binding.trustRecord.hardBlock),
      observedTrustState: binding.trustRecord.observedTrustState,
      evaluatedAt: ensureIsoTimestamp(binding.trustRecord.evaluatedAt, "evaluatedAt"),
      reviewDueAt: ensureIsoTimestamp(binding.trustRecord.reviewDueAt, "reviewDueAt"),
      sourceRefs: uniqueSortedRefs(binding.trustRecord.sourceRefs ?? []),
    },
    capacityRows: binding.capacityRows.map((row) => normalizeAdapterRow(row)),
    sourceRefs: uniqueSortedRefs(binding.sourceRefs),
  };
}

function createTypedHubCapacityAdapter(
  sourceMode: HubCapacitySourceMode,
  resolver?: (
    input: HubCapacityAdapterFetchInput,
  ) => Promise<HubCapacityAdapterResult> | HubCapacityAdapterResult,
): HubCapacityAdapter {
  return {
    sourceMode,
    async fetchCapacity(input) {
      const normalizedBinding = normalizeBinding(input.binding);
      invariant(
        normalizedBinding.sourceMode === sourceMode,
        "CAPACITY_ADAPTER_SOURCE_MODE_MISMATCH",
        `Binding source mode ${normalizedBinding.sourceMode} does not match adapter ${sourceMode}.`,
      );
      if (resolver) {
        const resolved = await resolver({
          ...input,
          binding: normalizedBinding,
        });
        invariant(
          resolved.sourceMode === sourceMode,
          "CAPACITY_ADAPTER_RESULT_SOURCE_MODE_MISMATCH",
          `Adapter result source mode ${resolved.sourceMode} does not match adapter ${sourceMode}.`,
        );
        return {
          ...resolved,
          trustRecord: normalizeBinding({
            ...normalizedBinding,
            capacityRows: [],
            trustRecord: resolved.trustRecord,
          }).trustRecord,
          capacityRows: resolved.capacityRows.map((row) => normalizeAdapterRow(row)),
          sourceRefs: uniqueSortedRefs(resolved.sourceRefs),
        };
      }
      return {
        sourceMode,
        sourceRef: normalizedBinding.sourceRef,
        sourceIdentity: normalizedBinding.sourceIdentity,
        sourceVersion: normalizedBinding.sourceVersion,
        fetchedAt: normalizedBinding.fetchedAt,
        trustRecord: normalizedBinding.trustRecord,
        capacityRows: normalizedBinding.capacityRows,
        sourceRefs: normalizedBinding.sourceRefs,
      };
    },
  };
}

export function createNativeApiFeedCapacityAdapter(
  resolver?: (
    input: HubCapacityAdapterFetchInput,
  ) => Promise<HubCapacityAdapterResult> | HubCapacityAdapterResult,
) {
  return createTypedHubCapacityAdapter("native_api_feed", resolver);
}

export function createPartnerScheduleSyncCapacityAdapter(
  resolver?: (
    input: HubCapacityAdapterFetchInput,
  ) => Promise<HubCapacityAdapterResult> | HubCapacityAdapterResult,
) {
  return createTypedHubCapacityAdapter("partner_schedule_sync", resolver);
}

export function createManualCapacityBoardAdapter(
  resolver?: (
    input: HubCapacityAdapterFetchInput,
  ) => Promise<HubCapacityAdapterResult> | HubCapacityAdapterResult,
) {
  return createTypedHubCapacityAdapter("manual_capacity_board", resolver);
}

export function createBatchedCapacityImportAdapter(
  resolver?: (
    input: HubCapacityAdapterFetchInput,
  ) => Promise<HubCapacityAdapterResult> | HubCapacityAdapterResult,
) {
  return createTypedHubCapacityAdapter("batched_capacity_import", resolver);
}

interface CandidateDraft {
  candidateId: string;
  sourceMode: HubCapacitySourceMode;
  sourceIdentity: string;
  sourceVersion: string;
  sourceRef: string;
  sourceTrustRef: string;
  sourceTrustState: SourceTrustState;
  sourceTrustTier: 0 | 1 | 2;
  sourceFreshnessState: CapacitySourceFreshnessState;
  siteId: string;
  siteLabel: string | null;
  timezone: string;
  modality: string;
  clinicianType: string;
  capacityUnitRef: string;
  manageCapabilityState: ManageCapabilityState;
  accessibilityFitScore: number;
  travelMinutes: number;
  waitMinutes: number;
  stalenessMinutes: number;
  requiredWindowFit: RequiredWindowFit;
  offerabilityState: CapacityOfferabilityState;
  baseUtility: number;
  uncertaintyRadius: number;
  robustFit: number;
  startAt: string;
  endAt: string;
  patientReasonCueRefs: readonly string[];
  staffReasonRefs: readonly string[];
  blockedByPolicyReasonRefs: readonly string[];
  sourceRefs: readonly string[];
}

function buildCandidateSnapshot(
  snapshotId: string,
  draft: CandidateDraft,
  explanationRef: string,
): NetworkSlotCandidateSnapshot {
  return {
    candidateId: draft.candidateId,
    networkCandidateSnapshotRef: snapshotId,
    siteId: draft.siteId,
    siteLabel: draft.siteLabel,
    sourceRef: draft.sourceRef,
    sourceTrustRef: draft.sourceTrustRef,
    sourceTrustState: draft.sourceTrustState,
    sourceTrustTier: draft.sourceTrustTier,
    sourceFreshnessState: draft.sourceFreshnessState,
    startAt: draft.startAt,
    endAt: draft.endAt,
    timezone: draft.timezone,
    modality: draft.modality,
    clinicianType: draft.clinicianType,
    capacityUnitRef: draft.capacityUnitRef,
    manageCapabilityState: draft.manageCapabilityState,
    accessibilityFitScore: draft.accessibilityFitScore,
    travelMinutes: draft.travelMinutes,
    waitMinutes: draft.waitMinutes,
    stalenessMinutes: draft.stalenessMinutes,
    requiredWindowFit: draft.requiredWindowFit,
    windowClass: draft.requiredWindowFit,
    offerabilityState: draft.offerabilityState,
    baseUtility: draft.baseUtility,
    uncertaintyRadius: draft.uncertaintyRadius,
    robustFit: draft.robustFit,
    capacityRankExplanationRef: explanationRef,
    patientReasonCueRefs: draft.patientReasonCueRefs,
    staffReasonRefs: draft.staffReasonRefs,
    blockedByPolicyReasonRefs: draft.blockedByPolicyReasonRefs,
    sourceRefs: draft.sourceRefs,
    version: 1,
  };
}

function minutesFromCandidates(candidates: readonly CandidateDraft[]): number {
  return candidates.reduce((sum, candidate) => sum + durationMinutes(candidate.startAt, candidate.endAt), 0);
}

function buildMinutesLedger(input: {
  evaluatedAt: string;
  pcnRef: string;
  policyTupleHash: string;
  serviceObligationMinutesPer1000: number;
  adjustedPopulation: number | null;
  deliveredMinutes: number | null;
  availableMinutes: number | null;
  cancelledMinutes: number | null;
  replacementMinutes: number | null;
  weekStartAt?: string | null;
  weekEndAt?: string | null;
  sourceRefs: readonly string[];
  idGenerator: BackboneIdGenerator;
}): EnhancedAccessMinutesLedgerSnapshot {
  const adjustedPopulation = ensureNonNegativeInteger(
    input.adjustedPopulation ?? 0,
    "adjustedPopulation",
  );
  const requiredMinutes = roundToNearestQuarterHour(
    (adjustedPopulation / 1_000) * input.serviceObligationMinutesPer1000,
  );
  const deliveredMinutes = ensureNonNegativeInteger(input.deliveredMinutes ?? 0, "deliveredMinutes");
  const availableMinutes = ensureNonNegativeInteger(input.availableMinutes ?? 0, "availableMinutes");
  const cancelledMinutes = ensureNonNegativeInteger(input.cancelledMinutes ?? 0, "cancelledMinutes");
  const replacementMinutes = ensureNonNegativeInteger(
    input.replacementMinutes ?? 0,
    "replacementMinutes",
  );
  const ledgerState =
    deliveredMinutes >= requiredMinutes && availableMinutes >= requiredMinutes
      ? "completed"
      : cancelledMinutes > replacementMinutes
        ? "make_up_required"
        : availableMinutes >= requiredMinutes || deliveredMinutes >= requiredMinutes * 0.8
          ? "on_track"
          : "at_risk";

  return {
    enhancedAccessMinutesLedgerId: nextId(input.idGenerator, "enhanced_access_minutes_ledger"),
    pcnRef: requireRef(input.pcnRef, "pcnRef"),
    policyTupleHash: requireRef(input.policyTupleHash, "policyTupleHash"),
    weekStartAt: ensureIsoTimestamp(input.weekStartAt ?? startOfWeekUtc(input.evaluatedAt), "weekStartAt"),
    weekEndAt: ensureIsoTimestamp(input.weekEndAt ?? endOfWeekUtc(input.evaluatedAt), "weekEndAt"),
    adjustedPopulation,
    minutesPer1000Required: ensureNonNegativeInteger(
      input.serviceObligationMinutesPer1000,
      "serviceObligationMinutesPer1000",
    ),
    requiredMinutes: ensureNonNegativeInteger(requiredMinutes, "requiredMinutes"),
    deliveredMinutes,
    availableMinutes,
    cancelledMinutes,
    replacementMinutes,
    ledgerState,
    sourceRefs: uniqueSortedRefs(input.sourceRefs),
    version: 1,
  };
}

function buildCancellationLedger(input: {
  evaluatedAt: string;
  pcnRef: string;
  policyTupleHash: string;
  cancelledMinutes: number;
  replacementMinutes: number;
  commissionerExceptionRef: string | null;
  bankHolidayMakeUpWindowHours: number;
  cancellationServiceDate?: string | null;
  sourceRefs: readonly string[];
  idGenerator: BackboneIdGenerator;
}): CancellationMakeUpLedgerSnapshot | null {
  const cancelledMinutes = ensureNonNegativeInteger(input.cancelledMinutes, "cancelledMinutes");
  if (cancelledMinutes === 0) {
    return null;
  }
  const replacementMinutes = ensureNonNegativeInteger(
    input.replacementMinutes,
    "replacementMinutes",
  );
  const serviceDate = ensureIsoTimestamp(
    input.cancellationServiceDate ?? input.evaluatedAt,
    "cancellationServiceDate",
  );
  const commissionerExceptionRef = optionalRef(input.commissionerExceptionRef);
  return {
    cancellationMakeUpLedgerId: nextId(input.idGenerator, "cancellation_make_up_ledger"),
    pcnRef: requireRef(input.pcnRef, "pcnRef"),
    policyTupleHash: requireRef(input.policyTupleHash, "policyTupleHash"),
    serviceDate,
    cancelledMinutes,
    replacementMinutes,
    makeUpDueAt: addHours(serviceDate, input.bankHolidayMakeUpWindowHours),
    commissionerExceptionRef,
    makeUpState: commissionerExceptionRef
      ? "exception_granted"
      : replacementMinutes >= cancelledMinutes
        ? "replacement_provided"
        : Date.parse(addHours(serviceDate, input.bankHolidayMakeUpWindowHours)) < Date.parse(input.evaluatedAt)
          ? "expired"
          : "replacement_due",
    sourceRefs: uniqueSortedRefs(input.sourceRefs),
    version: 1,
  };
}

function buildPolicyFacts(input: {
  activePolicySet: ActivePolicyPackSet;
  candidates: readonly CandidateDraft[];
  sourceAdmissions: readonly CapacitySourceTrustAdmissionSnapshot[];
  adjustedPopulation: number | null;
  deliveredMinutes: number | null;
  availableMinutes: number | null;
  cancelledMinutes: number | null;
  replacementMinutes: number | null;
  commissionerExceptionRef: string | null;
  minimumNecessaryContractRef: string | null;
}): PolicyEvaluationFactsSnapshot {
  const requiredWindowFit =
    input.candidates.length === 0
      ? null
      : input.candidates.reduce<RequiredWindowFit>(
          (current, candidate) => (candidate.requiredWindowFit > current ? candidate.requiredWindowFit : current),
          0,
        );
  const sourceAdmissionSummary = input.sourceAdmissions.map((admission) => ({
    sourceRef: admission.sourceRef,
    sourceTrustState: admission.sourceTrustState,
    candidateCount: admission.candidateCount,
  }));

  return {
    routeToNetworkRequested: true,
    urgentBounceRequired: false,
    requiredWindowFit,
    sourceAdmissionSummary,
    staleCapacityDetected: input.sourceAdmissions.some(
      (admission) => admission.sourceFreshnessState === "stale",
    ),
    adjustedPopulation: input.adjustedPopulation,
    deliveredMinutes: input.deliveredMinutes,
    availableMinutes: input.availableMinutes,
    cancelledMinutes: input.cancelledMinutes,
    replacementMinutes: input.replacementMinutes,
    commissionerExceptionRef: optionalRef(input.commissionerExceptionRef),
    minimumNecessaryContractRef:
      optionalRef(input.minimumNecessaryContractRef) ??
      input.activePolicySet.practiceVisibilityPolicy.minimumNecessaryContractRef,
    ackDebtOpen: false,
    visibilityDeltaRequired: false,
  };
}

function compareSnapshots(left: NetworkCandidateSnapshot | null, right: NetworkCandidateSnapshot | null): readonly string[] {
  const mismatches: string[] = [];
  if (left === null || right === null) {
    if (left !== right) {
      mismatches.push("snapshotPresence");
    }
    return mismatches;
  }
  if (left.policyTupleHash !== right.policyTupleHash) {
    mismatches.push("policyTupleHash");
  }
  if (stableStringify(left.candidateRefs) !== stableStringify(right.candidateRefs)) {
    mismatches.push("candidateRefs");
  }
  return mismatches;
}

export interface Phase5NetworkCapacityPipelineService {
  repositories: Phase5NetworkCapacityPipelineRepositories;
  policyService: Phase5EnhancedAccessPolicyService;
  hubCaseService: Phase5HubCaseKernelService;
  buildCandidateSnapshotForCase(
    input: BuildNetworkCandidateSnapshotInput,
  ): Promise<NetworkCapacityPipelineResult>;
  replayCandidateSnapshot(input: { snapshotId: string }): Promise<NetworkCapacityReplayResult>;
}

export function createPhase5NetworkCapacityPipelineService(input?: {
  repositories?: Phase5NetworkCapacityPipelineRepositories;
  idGenerator?: BackboneIdGenerator;
  policyService?: Phase5EnhancedAccessPolicyService;
  policyRepositories?: Phase5EnhancedAccessPolicyRepositories | Phase5EnhancedAccessPolicyStore;
  hubCaseService?: Phase5HubCaseKernelService;
  adapters?: readonly HubCapacityAdapter[];
}): Phase5NetworkCapacityPipelineService {
  const repositories = input?.repositories ?? createPhase5NetworkCapacityPipelineStore();
  const idGenerator =
    input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase5-network-capacity");
  const hubCaseService = input?.hubCaseService ?? createPhase5HubCaseKernelService();
  const policyService =
    input?.policyService ??
    createPhase5EnhancedAccessPolicyService({
      repositories: input?.policyRepositories,
      hubCaseService,
    });

  const adapters = new Map<HubCapacitySourceMode, HubCapacityAdapter>();
  for (const adapter of input?.adapters ?? [
    createNativeApiFeedCapacityAdapter(),
    createPartnerScheduleSyncCapacityAdapter(),
    createManualCapacityBoardAdapter(),
    createBatchedCapacityImportAdapter(),
  ]) {
    adapters.set(adapter.sourceMode, adapter);
  }

  return {
    repositories,
    policyService,
    hubCaseService,

    async buildCandidateSnapshotForCase(command) {
      const hubCoordinationCaseId = requireRef(command.hubCoordinationCaseId, "hubCoordinationCaseId");
      const evaluatedAt = ensureIsoTimestamp(command.evaluatedAt, "evaluatedAt");
      const snapshotId = nextId(idGenerator, "network_candidate_snapshot");
      const hubCaseBundle = await hubCaseService.queryHubCaseBundle(hubCoordinationCaseId);
      invariant(
        hubCaseBundle !== null,
        "HUB_CASE_NOT_FOUND",
        `Hub case ${hubCoordinationCaseId} was not found.`,
      );
      const activePolicySet = await policyService.loadActivePolicyPacksForScope({
        pcnRef: hubCaseBundle.hubCase.servingPcnId,
        asOf: evaluatedAt,
      });

      const supplyExceptions: CapacitySupplyExceptionSnapshot[] = [];
      const adapterRuns: CapacityAdapterRunSnapshot[] = [];
      const sourceAdmissions: CapacitySourceTrustAdmissionSnapshot[] = [];
      const candidateDrafts: CandidateDraft[] = [];

      for (const rawBinding of command.adapterBindings.map((binding) => normalizeBinding(binding))) {
        const adapter = adapters.get(rawBinding.sourceMode);
        invariant(
          adapter !== undefined,
          "CAPACITY_ADAPTER_NOT_REGISTERED",
          `No adapter is registered for source mode ${rawBinding.sourceMode}.`,
        );
        const adapterResult = await adapter.fetchCapacity({
          hubCoordinationCaseId,
          asOf: evaluatedAt,
          binding: rawBinding,
        });
        const trustState = normalizeTrustState(adapterResult.trustRecord);
        const stalenessMinutes = ensureNonNegativeInteger(
          Math.max(0, Math.round((Date.parse(evaluatedAt) - Date.parse(adapterResult.fetchedAt)) / 60_000)),
          "stalenessMinutes",
        );
        const sourceFreshnessState = freshnessState(
          activePolicySet.capacityIngestionPolicy,
          stalenessMinutes,
        );
        const disposition = admissionDisposition(
          activePolicySet.capacityIngestionPolicy,
          trustState,
          sourceFreshnessState,
        );
        const adapterRun: CapacityAdapterRunSnapshot = {
          adapterRunId: nextId(idGenerator, "capacity_adapter_run"),
          snapshotId,
          hubCoordinationCaseId,
          bindingRef: rawBinding.bindingRef,
          sourceMode: rawBinding.sourceMode,
          sourceRef: rawBinding.sourceRef,
          sourceIdentity: rawBinding.sourceIdentity,
          sourceVersion: rawBinding.sourceVersion,
          fetchedAt: rawBinding.fetchedAt,
          rawRowCount: adapterResult.capacityRows.length,
          sourceTrustRef: rawBinding.trustRecord.sourceTrustRef,
          sourceRefs: sourceRefsForSnapshot(rawBinding.sourceRefs, rawBinding.trustRecord.sourceRefs),
          version: 1,
        };
        adapterRuns.push(adapterRun);
        await repositories.saveAdapterRun(adapterRun);

        if (disposition === "stale_capacity") {
          supplyExceptions.push(
            createSupplyException(idGenerator, {
              snapshotId,
              hubCoordinationCaseId,
              sourceRef: rawBinding.sourceRef,
              exceptionCode: "CAPACITY_STALE",
              createdAt: evaluatedAt,
            }),
          );
        }
        if (disposition === "degraded_callback_only") {
          supplyExceptions.push(
            createSupplyException(idGenerator, {
              snapshotId,
              hubCoordinationCaseId,
              sourceRef: rawBinding.sourceRef,
              exceptionCode: "CAPACITY_DEGRADED_CALLBACK_ONLY",
              createdAt: evaluatedAt,
            }),
          );
        }
        if (disposition === "degraded_diagnostic_only") {
          supplyExceptions.push(
            createSupplyException(idGenerator, {
              snapshotId,
              hubCoordinationCaseId,
              sourceRef: rawBinding.sourceRef,
              exceptionCode: "CAPACITY_DEGRADED_DIAGNOSTIC_ONLY",
              createdAt: evaluatedAt,
            }),
          );
        }
        if (disposition === "quarantined_excluded") {
          supplyExceptions.push(
            createSupplyException(idGenerator, {
              snapshotId,
              hubCoordinationCaseId,
              sourceRef: rawBinding.sourceRef,
              exceptionCode: "CAPACITY_QUARANTINED",
              createdAt: evaluatedAt,
            }),
          );
        }

        let admittedCandidateCount = 0;
        for (const row of adapterResult.capacityRows.map((value) => normalizeAdapterRow(value))) {
          const requiredWindowFit = resolveRequiredWindowFit(row.startAt, hubCaseBundle, activePolicySet);
          if (
            requiredWindowFit === 0 &&
            !activePolicySet.varianceWindowPolicy.outsideWindowVisibleByPolicy
          ) {
            supplyExceptions.push(
              createSupplyException(idGenerator, {
                snapshotId,
                hubCoordinationCaseId,
                sourceRef: rawBinding.sourceRef,
                exceptionCode: "CAPACITY_POLICY_INVALID",
                createdAt: evaluatedAt,
              }),
            );
            continue;
          }
          admittedCandidateCount += 1;
          const capacityUnitRef = normalizedCapacityUnitRef(
            rawBinding.sourceMode,
            rawBinding.sourceIdentity,
            row,
          );
          const waitMinutes = ensureNonNegativeInteger(
            Math.max(0, Math.round((Date.parse(row.startAt) - Date.parse(evaluatedAt)) / 60_000)),
            "waitMinutes",
          );
          const baseUtility = buildBaseUtility({
            waitMinutes,
            travelMinutes: row.travelMinutes,
            accessibilityFitScore: row.accessibilityFitScore,
            requiredWindowFit,
            manageCapabilityState: row.manageCapabilityState,
            rankPlanVersionRef: activePolicySet.compiledPolicy.rankPlanVersionRef,
          });
          const uncertaintyRadius = buildUncertaintyRadius({
            sourceTrustState: trustState,
            sourceFreshnessState,
            manageCapabilityState: row.manageCapabilityState,
            uncertaintyModelVersionRef: activePolicySet.compiledPolicy.uncertaintyModelVersionRef,
          });
          const offerabilityState = resolveOfferabilityState({
            requiredWindowFit,
            manageCapabilityState: row.manageCapabilityState,
            sourceTrustState: trustState,
            sourceFreshnessState,
            admissionDisposition: disposition,
          });
          const blockedByPolicyReasonRefs = buildBlockedReasonRefs({
            requiredWindowFit,
            offerabilityState,
            sourceTrustState: trustState,
            sourceFreshnessState,
            manageCapabilityState: row.manageCapabilityState,
          });

          candidateDrafts.push({
            candidateId: `candidate_${sha256Hex(
              stableStringify({
                hubCoordinationCaseId,
                capacityUnitRef,
                sourceRef: rawBinding.sourceRef,
              }),
            ).slice(0, 24)}`,
            sourceMode: rawBinding.sourceMode,
            sourceIdentity: rawBinding.sourceIdentity,
            sourceVersion: rawBinding.sourceVersion,
            sourceRef: rawBinding.sourceRef,
            sourceTrustRef: rawBinding.trustRecord.sourceTrustRef,
            sourceTrustState: trustState,
            sourceTrustTier: trustTier(trustState),
            sourceFreshnessState,
            siteId: row.siteId,
            siteLabel: row.siteLabel ?? null,
            timezone: row.timezone,
            modality: row.modality,
            clinicianType: row.clinicianType,
            capacityUnitRef,
            manageCapabilityState: row.manageCapabilityState,
            accessibilityFitScore: row.accessibilityFitScore,
            travelMinutes: row.travelMinutes,
            waitMinutes,
            stalenessMinutes,
            requiredWindowFit,
            offerabilityState,
            baseUtility,
            uncertaintyRadius,
            robustFit: Number(clamp(baseUtility - uncertaintyRadius, 0, 1).toFixed(6)),
            startAt: row.startAt,
            endAt: row.endAt,
            patientReasonCueRefs: [],
            staffReasonRefs: [],
            blockedByPolicyReasonRefs,
            sourceRefs: sourceRefsForSnapshot(rawBinding.sourceRefs, row.sourceRefs, command.sourceRefs),
          });
        }

        const admission: CapacitySourceTrustAdmissionSnapshot = {
          sourceTrustAdmissionId: nextId(idGenerator, "capacity_source_trust_admission"),
          snapshotId,
          hubCoordinationCaseId,
          adapterRunRef: adapterRun.adapterRunId,
          sourceMode: rawBinding.sourceMode,
          sourceRef: rawBinding.sourceRef,
          sourceIdentity: rawBinding.sourceIdentity,
          sourceVersion: rawBinding.sourceVersion,
          sourceTrustRef: rawBinding.trustRecord.sourceTrustRef,
          sourceTrustState: trustState,
          sourceTrustTier: trustTier(trustState),
          trustLowerBound: rawBinding.trustRecord.trustLowerBound,
          completenessState: rawBinding.trustRecord.completenessState,
          hardBlock: rawBinding.trustRecord.hardBlock,
          sourceFreshnessState,
          stalenessMinutes,
          admissionDisposition: disposition,
          patientOfferableAllowed: disposition === "trusted_admitted",
          directCommitAllowed: disposition === "trusted_admitted",
          hiddenFromPatientTruth: disposition !== "trusted_admitted",
          candidateCount: admittedCandidateCount,
          evaluatedAt,
          sourceRefs: sourceRefsForSnapshot(
            rawBinding.sourceRefs,
            rawBinding.trustRecord.sourceRefs,
            command.sourceRefs,
          ),
          version: 1,
        };
        sourceAdmissions.push(admission);
        await repositories.saveSourceTrustAdmission(admission);
      }

      const dedupedCandidatesByCapacityUnit = new Map<string, CandidateDraft>();
      for (const draft of candidateDrafts) {
        const current = dedupedCandidatesByCapacityUnit.get(draft.capacityUnitRef);
        if (!current) {
          dedupedCandidatesByCapacityUnit.set(draft.capacityUnitRef, draft);
          continue;
        }
        if (sourceWinsTie(draft, current)) {
          supplyExceptions.push(
            createSupplyException(idGenerator, {
              snapshotId,
              hubCoordinationCaseId,
              sourceRef: current.sourceRef,
              candidateRef: current.candidateId,
              exceptionCode: "CAPACITY_DEDUPE_COLLISION",
              createdAt: evaluatedAt,
            }),
          );
          dedupedCandidatesByCapacityUnit.set(draft.capacityUnitRef, draft);
        } else {
          supplyExceptions.push(
            createSupplyException(idGenerator, {
              snapshotId,
              hubCoordinationCaseId,
              sourceRef: draft.sourceRef,
              candidateRef: draft.candidateId,
              exceptionCode: "CAPACITY_DEDUPE_COLLISION",
              createdAt: evaluatedAt,
            }),
          );
        }
      }

      const dedupedDrafts = [...dedupedCandidatesByCapacityUnit.values()].sort((left, right) =>
        orderCandidates(
          {
            windowClass: left.requiredWindowFit,
            sourceTrustTier: left.sourceTrustTier,
            robustFit: left.robustFit,
            travelMinutes: left.travelMinutes,
            startAt: left.startAt,
            candidateId: left.candidateId,
          },
          {
            windowClass: right.requiredWindowFit,
            sourceTrustTier: right.sourceTrustTier,
            robustFit: right.robustFit,
            travelMinutes: right.travelMinutes,
            startAt: right.startAt,
            candidateId: right.candidateId,
          },
        ),
      );

      if (dedupedDrafts.length === 0) {
        supplyExceptions.push(
          createSupplyException(idGenerator, {
            snapshotId,
            hubCoordinationCaseId,
            exceptionCode: "CAPACITY_MISSING",
            createdAt: evaluatedAt,
          }),
        );
      }

      const totalAvailableMinutes =
        command.availableMinutes ?? minutesFromCandidates(dedupedDrafts);
      const policyFacts = buildPolicyFacts({
        activePolicySet,
        candidates: dedupedDrafts,
        sourceAdmissions,
        adjustedPopulation: command.adjustedPopulation ?? null,
        deliveredMinutes: command.deliveredMinutes ?? totalAvailableMinutes,
        availableMinutes: totalAvailableMinutes,
        cancelledMinutes: command.cancelledMinutes ?? 0,
        replacementMinutes: command.replacementMinutes ?? 0,
        commissionerExceptionRef: command.commissionerExceptionRef ?? null,
        minimumNecessaryContractRef: command.minimumNecessaryContractRef ?? null,
      });
      const policyResult = await policyService.evaluateHubCaseAgainstPolicy({
        hubCoordinationCaseId,
        pcnRef: hubCaseBundle.hubCase.servingPcnId,
        evaluationScope: "candidate_snapshot",
        evaluatedAt,
        presentedPolicyTupleHash: optionalRef(command.presentedPolicyTupleHash),
        facts: policyFacts,
      });

      const rankExplanations: CapacityRankExplanationSnapshot[] = [];
      const candidates: NetworkSlotCandidateSnapshot[] = [];
      for (const [index, draft] of dedupedDrafts.entries()) {
        const candidateRank = index + 1;
        const patientReasonCueRefs = buildPatientCue({
          candidateRank,
          windowClass: draft.requiredWindowFit,
          sourceTrustState: draft.sourceTrustState,
          offerabilityState: draft.offerabilityState,
        });
        const explanation: CapacityRankExplanationSnapshot = {
          capacityRankExplanationId: `capacity_rank_explanation_${sha256Hex(
            stableStringify({
              candidateRef: draft.candidateId,
              policyTupleHash: policyResult.evaluation.policyTupleHash,
            }),
          ).slice(0, 24)}`,
          networkCandidateSnapshotRef: snapshotId,
          candidateRef: draft.candidateId,
          policyTupleHash: policyResult.evaluation.policyTupleHash,
          windowClass: draft.requiredWindowFit,
          sourceTrustState: draft.sourceTrustState,
          baseUtility: draft.baseUtility,
          uncertaintyRadius: draft.uncertaintyRadius,
          robustFit: draft.robustFit,
          patientReasonCueRefs,
          staffReasonRefs: staffReasonRefs(draft),
          blockedByPolicyReasonRefs: draft.blockedByPolicyReasonRefs,
          generatedAt: evaluatedAt,
          version: 1,
        };
        const candidate = buildCandidateSnapshot(snapshotId, {
          ...draft,
          patientReasonCueRefs,
          staffReasonRefs: explanation.staffReasonRefs,
        }, explanation.capacityRankExplanationId);
        rankExplanations.push(explanation);
        candidates.push(candidate);
      }

      const rankedCandidates: CapacityRankedCandidateProofSnapshot[] = candidates.map(
        (candidate, index) => ({
          candidateRank: index + 1,
          candidateRef: candidate.candidateId,
          windowClass: candidate.windowClass,
          sourceTrustState: candidate.sourceTrustState,
          sourceTrustTier: candidate.sourceTrustTier,
          baseUtility: candidate.baseUtility,
          uncertaintyRadius: candidate.uncertaintyRadius,
          robustFit: candidate.robustFit,
          travelMinutes: candidate.travelMinutes,
          startAt: candidate.startAt,
          offerabilityState: candidate.offerabilityState,
          patientOfferable:
            candidate.offerabilityState === "direct_commit" ||
            candidate.offerabilityState === "patient_offerable",
          directCommitEligible: candidate.offerabilityState === "direct_commit",
          capacityRankExplanationRef: candidate.capacityRankExplanationRef,
          patientReasonCueRefs: candidate.patientReasonCueRefs,
        }),
      );

      const rankProof =
        candidates.length === 0
          ? null
          : {
              capacityRankProofId: nextId(idGenerator, "capacity_rank_proof"),
              networkCandidateSnapshotRef: snapshotId,
              rankPlanVersionRef: activePolicySet.compiledPolicy.rankPlanVersionRef,
              uncertaintyModelVersionRef: activePolicySet.compiledPolicy.uncertaintyModelVersionRef,
              policyTupleHash: policyResult.evaluation.policyTupleHash,
              proofChecksum: sha256Hex(
                stableStringify({
                  orderedCandidateRefs: candidates.map((candidate) => candidate.candidateId),
                  rankedCandidates,
                }),
              ),
              orderedCandidateRefs: candidates.map((candidate) => candidate.candidateId),
              rankedCandidates,
              generatedAt: evaluatedAt,
              version: 1,
            } satisfies CapacityRankProofSnapshot;

      const dominanceDecisions: CrossSiteDominanceDecisionSnapshot[] = [];
      const dominated = new Set<string>();
      for (const winner of candidates) {
        for (const loser of candidates) {
          if (winner.candidateId === loser.candidateId) {
            continue;
          }
          const dominance = weakDominates(winner, loser);
          if (!dominance.dominates) {
            continue;
          }
          const existing = dominanceDecisions.find(
            (entry) => entry.loserCandidateRef === loser.candidateId,
          );
          if (existing) {
            continue;
          }
          dominated.add(loser.candidateId);
          dominanceDecisions.push({
            winnerCandidateRef: winner.candidateId,
            loserCandidateRef: loser.candidateId,
            weaklyDominatedOn: dominance.weaklyDominatedOn,
            strictCoordinates: dominance.strictCoordinates,
            persistedEffect:
              loser.offerabilityState === "diagnostic_only"
                ? "Removed from patient-offerable and direct-commit frontiers; retained as diagnostic-only evidence."
                : loser.offerabilityState === "callback_only_reasoning"
                  ? "Removed from ordinary frontiers; retained for callback reasoning only."
                  : "Removed from patient-offerable and direct-commit frontiers.",
          });
        }
      }

      const decisionPlan =
        candidates.length === 0
          ? null
          : {
              decisionPlanId: nextId(idGenerator, "cross_site_decision_plan"),
              hubCoordinationCaseId,
              snapshotId,
              policyEvaluationRef: policyResult.evaluation.policyEvaluationId,
              policyTupleHash: policyResult.evaluation.policyTupleHash,
              orderedCandidateRefs: candidates.map((candidate) => candidate.candidateId),
              patientOfferableFrontierRefs: candidates
                .filter(
                  (candidate) =>
                    !dominated.has(candidate.candidateId) &&
                    (candidate.offerabilityState === "direct_commit" ||
                      candidate.offerabilityState === "patient_offerable"),
                )
                .map((candidate) => candidate.candidateId),
              directCommitFrontierRefs: candidates
                .filter(
                  (candidate) =>
                    !dominated.has(candidate.candidateId) &&
                    candidate.offerabilityState === "direct_commit",
                )
                .map((candidate) => candidate.candidateId),
              callbackReasoningRefs: candidates
                .filter((candidate) => candidate.offerabilityState === "callback_only_reasoning")
                .map((candidate) => candidate.candidateId),
              diagnosticOnlyRefs: candidates
                .filter((candidate) => candidate.offerabilityState === "diagnostic_only")
                .map((candidate) => candidate.candidateId),
              dominanceDecisions,
              generatedAt: evaluatedAt,
              sourceRefs: sourceRefsForSnapshot(command.sourceRefs, activePolicySet.compiledPolicy.sourceRefs),
              version: 1,
            } satisfies CrossSiteDecisionPlanSnapshot;

      const snapshot =
        candidates.length === 0 || rankProof === null
          ? null
          : {
              snapshotId,
              hubCoordinationCaseId,
              policyEvaluationRef: policyResult.evaluation.policyEvaluationId,
              compiledPolicyBundleRef: policyResult.evaluation.compiledPolicyBundleRef,
              policyTupleHash: policyResult.evaluation.policyTupleHash,
              rankPlanVersionRef: activePolicySet.compiledPolicy.rankPlanVersionRef,
              uncertaintyModelVersionRef: activePolicySet.compiledPolicy.uncertaintyModelVersionRef,
              fetchedAt: evaluatedAt,
              expiresAt: addHours(evaluatedAt, 1),
              candidateRefs: candidates.map((candidate) => candidate.candidateId),
              candidateCount: candidates.length,
              trustedCandidateCount: candidates.filter((candidate) => candidate.sourceTrustState === "trusted").length,
              degradedCandidateCount: candidates.filter((candidate) => candidate.sourceTrustState === "degraded").length,
              quarantinedCandidateCount: candidates.filter((candidate) => candidate.sourceTrustState === "quarantined").length,
              capacityRankProofRef: rankProof.capacityRankProofId,
              capacityRankExplanationRefs: rankExplanations.map(
                (explanation) => explanation.capacityRankExplanationId,
              ),
              sourceRefs: sourceRefsForSnapshot(command.sourceRefs, activePolicySet.compiledPolicy.sourceRefs),
              version: 1,
            } satisfies NetworkCandidateSnapshot;

      for (const explanation of rankExplanations) {
        await repositories.saveRankExplanation(explanation);
      }
      for (const exception of supplyExceptions) {
        if (exception.exceptionCode === "CAPACITY_HIDDEN") {
          continue;
        }
        await repositories.appendSupplyException(exception);
      }
      for (const candidate of candidates) {
        if (
          candidate.offerabilityState === "callback_only_reasoning" ||
          candidate.offerabilityState === "diagnostic_only"
        ) {
          const hiddenException = createSupplyException(idGenerator, {
            snapshotId,
            hubCoordinationCaseId,
            sourceRef: candidate.sourceRef,
            candidateRef: candidate.candidateId,
            exceptionCode: "CAPACITY_HIDDEN",
            createdAt: evaluatedAt,
          });
          supplyExceptions.push(hiddenException);
          await repositories.appendSupplyException(hiddenException);
        }
        await repositories.saveCandidate(candidate);
      }
      if (rankProof) {
        await repositories.saveRankProof(rankProof);
      }
      if (snapshot) {
        await repositories.saveSnapshot(snapshot);
      }
      if (decisionPlan) {
        await repositories.saveDecisionPlan(decisionPlan);
      }

      const minutesLedger = buildMinutesLedger({
        evaluatedAt,
        pcnRef: hubCaseBundle.hubCase.servingPcnId,
        policyTupleHash: policyResult.evaluation.policyTupleHash,
        serviceObligationMinutesPer1000:
          activePolicySet.serviceObligationPolicy.weeklyMinutesPer1000AdjustedPopulation,
        adjustedPopulation: command.adjustedPopulation ?? 0,
        deliveredMinutes: command.deliveredMinutes ?? totalAvailableMinutes,
        availableMinutes: totalAvailableMinutes,
        cancelledMinutes: command.cancelledMinutes ?? 0,
        replacementMinutes: command.replacementMinutes ?? 0,
        weekStartAt: command.weekStartAt,
        weekEndAt: command.weekEndAt,
        sourceRefs: sourceRefsForSnapshot(command.sourceRefs, activePolicySet.compiledPolicy.sourceRefs),
        idGenerator,
      });
      await repositories.saveMinutesLedger(minutesLedger);

      const cancellationMakeUpLedger = buildCancellationLedger({
        evaluatedAt,
        pcnRef: hubCaseBundle.hubCase.servingPcnId,
        policyTupleHash: policyResult.evaluation.policyTupleHash,
        cancelledMinutes: command.cancelledMinutes ?? 0,
        replacementMinutes: command.replacementMinutes ?? 0,
        commissionerExceptionRef: command.commissionerExceptionRef ?? null,
        bankHolidayMakeUpWindowHours:
          activePolicySet.serviceObligationPolicy.bankHolidayMakeUpWindowHours,
        cancellationServiceDate: command.cancellationServiceDate,
        sourceRefs: sourceRefsForSnapshot(command.sourceRefs, activePolicySet.compiledPolicy.sourceRefs),
        idGenerator,
      });
      if (cancellationMakeUpLedger) {
        await repositories.saveCancellationMakeUpLedger(cancellationMakeUpLedger);
      }

      const replayFixture: NetworkCapacityReplayFixtureSnapshot = {
        networkCapacityReplayFixtureId: nextId(idGenerator, "network_capacity_replay_fixture"),
        snapshotId,
        hubCoordinationCaseId,
        evaluatedAt,
        presentedPolicyTupleHash: optionalRef(command.presentedPolicyTupleHash),
        adjustedPopulation: command.adjustedPopulation ?? null,
        deliveredMinutes: command.deliveredMinutes ?? totalAvailableMinutes,
        availableMinutes: totalAvailableMinutes,
        cancelledMinutes: command.cancelledMinutes ?? 0,
        replacementMinutes: command.replacementMinutes ?? 0,
        commissionerExceptionRef: optionalRef(command.commissionerExceptionRef),
        minimumNecessaryContractRef: optionalRef(command.minimumNecessaryContractRef),
        weekStartAt: optionalRef(command.weekStartAt),
        weekEndAt: optionalRef(command.weekEndAt),
        cancellationServiceDate: optionalRef(command.cancellationServiceDate),
        adapterBindings: command.adapterBindings.map((binding) => normalizeBinding(binding)),
        sourceRefs: sourceRefsForSnapshot(command.sourceRefs, activePolicySet.compiledPolicy.sourceRefs),
        version: 1,
      };
      await repositories.saveReplayFixture(replayFixture);

      return {
        snapshotId,
        hubCaseBundle,
        activePolicySet,
        policyResult,
        adapterRuns,
        sourceAdmissions,
        candidates,
        snapshot,
        rankProof,
        rankExplanations,
        decisionPlan,
        minutesLedger,
        cancellationMakeUpLedger,
        supplyExceptions,
        replayFixture,
      };
    },

    async replayCandidateSnapshot(command) {
      const snapshotId = requireRef(command.snapshotId, "snapshotId");
      const fixtureDocument = await repositories.getReplayFixtureForSnapshot(snapshotId);
      invariant(
        fixtureDocument !== null,
        "CAPACITY_REPLAY_FIXTURE_NOT_FOUND",
        `No replay fixture was found for snapshot ${snapshotId}.`,
      );
      const fixture = fixtureDocument.toSnapshot();
      const replay = await this.buildCandidateSnapshotForCase({
        hubCoordinationCaseId: fixture.hubCoordinationCaseId,
        evaluatedAt: fixture.evaluatedAt,
        adapterBindings: fixture.adapterBindings,
        presentedPolicyTupleHash: fixture.presentedPolicyTupleHash,
        adjustedPopulation: fixture.adjustedPopulation,
        deliveredMinutes: fixture.deliveredMinutes,
        availableMinutes: fixture.availableMinutes,
        cancelledMinutes: fixture.cancelledMinutes,
        replacementMinutes: fixture.replacementMinutes,
        commissionerExceptionRef: fixture.commissionerExceptionRef,
        minimumNecessaryContractRef: fixture.minimumNecessaryContractRef,
        weekStartAt: fixture.weekStartAt,
        weekEndAt: fixture.weekEndAt,
        cancellationServiceDate: fixture.cancellationServiceDate,
        sourceRefs: fixture.sourceRefs,
      });
      const originalSnapshot = (await repositories.getSnapshot(snapshotId))?.toSnapshot() ?? null;
      const mismatchFields = compareSnapshots(replay.snapshot, originalSnapshot);
      return {
        ...replay,
        matchesStoredSnapshot: mismatchFields.length === 0,
        mismatchFields,
        originalSnapshot,
      };
    },
  };
}

export const PHASE5_NETWORK_CAPACITY_PIPELINE_SERVICE_NAME =
  "Phase5NetworkCapacityPipeline";
export const PHASE5_NETWORK_CAPACITY_PIPELINE_SCHEMA_VERSION =
  "318.phase5.network-capacity-pipeline.v1";
export const phase5NetworkCapacityPersistenceTables = [
  "phase5_network_capacity_adapter_runs",
  "phase5_capacity_source_trust_admissions",
  "phase5_network_slot_candidates",
  "phase5_network_candidate_snapshots",
  "phase5_capacity_rank_proofs",
  "phase5_capacity_rank_explanations",
  "phase5_cross_site_decision_plans",
  "phase5_enhanced_access_minutes_ledgers",
  "phase5_cancellation_make_up_ledgers",
  "phase5_capacity_supply_exceptions",
  "phase5_network_capacity_replay_fixtures",
] as const;
