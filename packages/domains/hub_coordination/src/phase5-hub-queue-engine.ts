import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import type { SourceTrustState } from "./phase5-enhanced-access-policy-engine";
import {
  createPhase5HubCaseKernelService,
  type HubCaseBundle,
  type HubCoordinationCaseSnapshot,
  type NetworkBookingPriorityBand,
  type NetworkBookingRequestSnapshot,
  type Phase5HubCaseKernelService,
  type PreferredModality,
} from "./phase5-hub-case-kernel";
import {
  createPhase5NetworkCapacityPipelineStore,
  type CapacityOfferabilityState,
  type CapacityRankExplanationSnapshot,
  type CapacityRankProofSnapshot,
  type CapacitySourceTrustAdmissionSnapshot,
  type CrossSiteDecisionPlanSnapshot,
  type NetworkCandidateSnapshot,
  type NetworkSlotCandidateSnapshot,
  type Phase5NetworkCapacityPipelineRepositories,
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

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && Number.isInteger(value) && value > 0,
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

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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

function addMinutes(timestamp: string, minutes: number): string {
  const date = new Date(timestamp);
  date.setTime(date.getTime() + minutes * 60_000);
  return date.toISOString();
}

function workingMinutesBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 60_000);
}

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function floatEq(left: number, right: number, epsilon = 1e-9): boolean {
  return Math.abs(left - right) <= epsilon;
}

const priorityBandWeight: Record<NetworkBookingPriorityBand, number> = {
  routine: 0,
  priority: 1,
  urgent: 2,
  same_day: 3,
  safety_escalation: 4,
};

export const hubQueueTimerTypes = [
  "candidate_refresh",
  "patient_choice_expiry",
  "required_window_breach",
  "too_urgent_for_network",
  "practice_notification_overdue",
] as const;

export type HubQueueTimerType = (typeof hubQueueTimerTypes)[number];
export type HubQueueTimerState =
  | "armed"
  | "overdue"
  | "settled"
  | "suppressed"
  | "blocked_by_upstream_gap";
export type HubQueueTimerSeverity = "info" | "warning" | "critical";
export type HubQueueOverloadState = "nominal" | "overload_critical";
export type HubQueueConvergenceState = "converged" | "failed_closed";
export type QueueChangeApplyPolicy = "idle_only" | "explicit_apply" | "immediate_if_safe";
export type QueueBatchImpactClass = "bufferable" | "review_required";
export type QueueBatchAnchorApplyState = "preserved" | "invalidated" | "replaced" | "released";
export type QueueBatchState = "available" | "applied" | "dismissed";
export type HubEscalationBannerType =
  | "too_urgent"
  | "no_trusted_supply"
  | "practice_ack_overdue"
  | "supplier_drift"
  | "stale_owner"
  | "callback_transfer_blocked";
export type HubQueueContinuityState = "preserved" | "invalidated" | "replaced" | "released";
export type HubQueueDominantAction =
  | "claim_case"
  | "refresh_candidates"
  | "review_ranked_options"
  | "resolve_patient_choice"
  | "revalidate_candidate"
  | "complete_booking"
  | "send_practice_update"
  | "recover_stale_owner"
  | "return_to_practice"
  | "close_case";
export type HubPostureState =
  | "nominal"
  | "warning"
  | "overload_critical"
  | "recovery_only"
  | "mutation_frozen";
export type HubQueueEligibilityState =
  | "eligible"
  | "held_preemption"
  | "held_trust"
  | "excluded_scope";

export interface HubQueueRankPlanConfig {
  queueFamilyRef: string;
  eligibilityRuleSetRef: string;
  lexicographicTierPolicyRef: string;
  withinTierWeightSetRef: string;
  fairnessMergePolicyRef: string;
  overloadGuardPolicyRef: string;
  assignmentSuggestionPolicyRef: string;
  explanationSchemaRef: string;
  canonicalTieBreakPolicyRef: string;
  effectiveAt: string;
  minimumServiceMinutes: number;
  coordinatorParallelism: number;
  coordinationDelayMinutes: number;
  queueVarianceWeight: number;
  serviceVarianceWeight: number;
  dependencyVarianceWeight: number;
  tauBreachCritical: number;
  tauBreachWarn: number;
  epsilonRank: number;
  maxIterations: number;
  overloadObservationMinutes: number;
  overloadGuardThreshold: number;
  fairnessQuantumMinutes: number;
  fairnessCreditCap: number;
  fairnessAgeDebtStartMinutes: number;
  fairnessAgeDebtHorizonMinutes: number;
  fairnessAgeWeight: number;
  flushBufferMinutes: number;
  candidateRefreshGraceMinutes: number;
  callbackTransferDebtMinutes: number;
  practiceAckGraceMinutes: number;
  bounceCap: number;
  secondaryWeights: {
    gap: number;
    trust: number;
    degraded: number;
    access: number;
    modality: number;
    localfail: number;
    waiting: number;
    bounce: number;
  };
}

export interface HubQueueRankPlanSnapshot {
  queueRankPlanId: string;
  queueFamilyRef: string;
  eligibilityRuleSetRef: string;
  lexicographicTierPolicyRef: string;
  withinTierWeightSetRef: string;
  fairnessMergePolicyRef: string;
  overloadGuardPolicyRef: string;
  assignmentSuggestionPolicyRef: string;
  explanationSchemaRef: string;
  canonicalTieBreakPolicyRef: string;
  planHash: string;
  effectiveAt: string;
  version: number;
}

export interface HubFairnessLedgerEntrySnapshot {
  practiceRef: string;
  creditBefore: number;
  creditAfter: number;
  ageDebt: number;
  emittedCaseRefs: readonly string[];
}

export interface HubFairnessCycleStateSnapshot {
  fairnessCycleStateId: string;
  queueRef: string;
  rankSnapshotRef: string;
  overloadState: HubQueueOverloadState;
  fairnessSuppressed: boolean;
  rhoHubCritical: number;
  criticalCaseRefs: readonly string[];
  ledgerEntries: readonly HubFairnessLedgerEntrySnapshot[];
  creditLedger: Readonly<Record<string, number>>;
  generatedAt: string;
  version: number;
}

export interface HubQueueRankSnapshot {
  rankSnapshotId: string;
  queueRef: string;
  queueRankPlanRef: string;
  asOfAt: string;
  sourceFactCutRef: string;
  trustInputRefs: readonly string[];
  eligibleTaskRefs: readonly string[];
  excludedTaskRefs: readonly string[];
  overloadState: HubQueueOverloadState;
  fairnessCycleStateRef: string | null;
  rowOrderHash: string;
  convergenceState: HubQueueConvergenceState;
  iterationCount: number;
  sourceRefs: readonly string[];
  generatedAt: string;
  version: number;
}

export interface HubQueueRiskExplanationSnapshot {
  hubQueueRiskExplanationId: string;
  rankSnapshotRef: string;
  hubCoordinationCaseId: string;
  expectedService: number;
  dClinical: number;
  dSla: number;
  laxityClinical: number;
  laxitySla: number;
  urgencyCarry: number;
  workloadAheadMinutes: number;
  waitToStartMinutes: number;
  coordinationDelayMinutes: number;
  dependencyDelayMinutes: number;
  pClinicalBreach: number;
  pSlaBreach: number;
  pBreach: number;
  riskBand: 0 | 1 | 2 | 3;
  bestFit: number;
  bestTrustedFit: number;
  trustGap: number;
  degradedOnly: boolean;
  accessPenalty: number;
  modalityGap: number;
  localFail: number;
  awaitingPatient: number;
  bounce: number;
  secondaryScore: number;
  iterationIndex: number;
  convergenceDelta: number;
  sourceRefs: readonly string[];
  generatedAt: string;
  version: number;
}

export interface HubQueueRankEntrySnapshot {
  rankEntryId: string;
  rankSnapshotRef: string;
  taskRef: string;
  ordinal: number;
  eligibilityState: HubQueueEligibilityState;
  lexicographicTier: string;
  urgencyScore: number;
  residualBand: number;
  contactRiskBand: number;
  duplicateReviewFlag: boolean;
  urgencyCarry: number;
  fairnessBandRef: string;
  fairnessCreditBefore: number;
  fairnessCreditAfter: number;
  canonicalTieBreakKey: string;
  explanationPayloadRef: string;
  generatedAt: string;
  version: number;
}

export interface HubQueueTimerSnapshot {
  hubQueueTimerId: string;
  rankSnapshotRef: string;
  hubCoordinationCaseId: string;
  timerType: HubQueueTimerType;
  timerState: HubQueueTimerState;
  severity: HubQueueTimerSeverity;
  dueAt: string | null;
  observedAt: string;
  settledAt: string | null;
  governingRef: string | null;
  safeSummary: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface QueueChangeBatchSnapshot {
  batchId: string;
  queueRef: string;
  sourceRankSnapshotRef: string;
  targetRankSnapshotRef: string;
  preservedAnchorRef: string | null;
  preservedAnchorTupleHash: string | null;
  insertedRefs: readonly string[];
  updatedRefs: readonly string[];
  priorityShiftRefs: readonly string[];
  rankPlanVersion: string;
  applyPolicy: QueueChangeApplyPolicy;
  batchImpactClass: QueueBatchImpactClass;
  focusProtectedRef: string | null;
  invalidatedAnchorRefs: readonly string[];
  replacementAnchorRefs: readonly string[];
  anchorApplyState: QueueBatchAnchorApplyState;
  summaryMessage: string;
  firstBufferedAt: string;
  flushDeadlineAt: string;
  batchState: QueueBatchState;
  createdAt: string;
  version: number;
}

export interface HubQueueWorkbenchRowSnapshot {
  hubCoordinationCaseId: string;
  ordinal: number;
  riskBand: 0 | 1 | 2 | 3;
  breachProbability: number;
  priorityBand: NetworkBookingPriorityBand;
  status: HubCoordinationCaseSnapshot["status"];
  dominantAction: HubQueueDominantAction;
  bannerRef: string | null;
  timerRefs: readonly string[];
}

export interface HubQueueWorkbenchProjectionSnapshot {
  hubQueueWorkbenchProjectionId: string;
  queueRef: string;
  rankSnapshotRef: string;
  activeQueueChangeBatchRef: string | null;
  visibleRowRefs: readonly string[];
  rows: readonly HubQueueWorkbenchRowSnapshot[];
  selectedQueueRowRef: string | null;
  selectedOptionCardRef: string | null;
  selectedAnchorRef: string | null;
  selectedAnchorTupleHashRef: string | null;
  dominantActionRef: string | null;
  blockerStubRefs: readonly string[];
  continuityState: HubQueueContinuityState;
  sourceRefs: readonly string[];
  generatedAt: string;
  version: number;
}

export interface HubCaseConsoleProjectionSnapshot {
  hubCaseConsoleProjectionId: string;
  rankSnapshotRef: string;
  hubCoordinationCaseId: string;
  networkBookingRequestId: string;
  queueOrdinal: number | null;
  dominantAction: HubQueueDominantAction;
  blockerStubRefs: readonly string[];
  timerRefs: readonly string[];
  optionCardRefs: readonly string[];
  escalationBannerRef: string | null;
  selectedOptionCardRef: string | null;
  selectedAnchorRef: string | null;
  selectedAnchorTupleHashRef: string | null;
  continuityState: HubQueueContinuityState;
  sourceRefs: readonly string[];
  generatedAt: string;
  version: number;
}

export interface HubOptionCapacityReservationBindingSnapshot {
  hubCoordinationCaseId: string;
  candidateRef: string;
  reservationRef: string;
  reservationState: "requested" | "held" | "confirmed" | "released" | "expired";
  reservationFenceToken: string | null;
  expiresAt: string | null;
  sourceRefs: readonly string[];
}

export interface HubOptionCardProjectionSnapshot {
  hubOptionCardProjectionId: string;
  rankSnapshotRef: string;
  hubCoordinationCaseId: string;
  candidateRef: string;
  decisionPlanRef: string | null;
  networkCandidateSnapshotRef: string | null;
  policyEvaluationRef: string | null;
  capacityRankProofRef: string | null;
  capacityRankExplanationRef: string | null;
  reservationRef: string | null;
  reservationState: HubOptionCapacityReservationBindingSnapshot["reservationState"] | "none";
  sourceTrustState: SourceTrustState | "missing";
  offerabilityState: CapacityOfferabilityState | "diagnostic_only";
  approvedVarianceVisible: boolean;
  truthfulHoldState: "none" | "soft_hold" | "held" | "confirmed";
  rankReasonRefs: readonly string[];
  patientReasonCueRefs: readonly string[];
  blockedByPolicyReasonRefs: readonly string[];
  sourceRefs: readonly string[];
  generatedAt: string;
  version: number;
}

export interface HubPostureProjectionSnapshot {
  hubPostureProjectionId: string;
  queueRef: string;
  rankSnapshotRef: string;
  postureState: HubPostureState;
  overloadState: HubQueueOverloadState;
  caseCount: number;
  criticalCaseCount: number;
  warningCaseCount: number;
  noTrustedSupplyCount: number;
  staleOwnerCount: number;
  practiceAckOverdueCount: number;
  callbackBlockedCount: number;
  sourceRefs: readonly string[];
  generatedAt: string;
  version: number;
}

export interface HubEscalationBannerProjectionSnapshot {
  hubEscalationBannerProjectionId: string;
  queueRef: string;
  rankSnapshotRef: string;
  hubCoordinationCaseId: string | null;
  bannerType: HubEscalationBannerType;
  dominantAction: HubQueueDominantAction;
  safeSummary: string;
  blockerRefs: readonly string[];
  sourceRefs: readonly string[];
  generatedAt: string;
  version: number;
}

export interface HubConsoleConsistencyProjectionSnapshot {
  hubConsoleConsistencyProjectionId: string;
  queueRef: string;
  rankSnapshotRef: string;
  workbenchProjectionRef: string;
  caseConsoleProjectionRefs: readonly string[];
  optionCardProjectionRefs: readonly string[];
  postureProjectionRef: string;
  escalationBannerRefs: readonly string[];
  selectedAnchorRef: string | null;
  selectedAnchorTupleHashRef: string | null;
  activeQueueChangeBatchRef: string | null;
  bundleVersionHash: string;
  freezeControls: boolean;
  generatedAt: string;
  version: number;
}

export interface HubQueueReplayFixtureSnapshot {
  hubQueueReplayFixtureId: string;
  rankSnapshotRef: string;
  queueRef: string;
  hubCoordinationCaseIds: readonly string[];
  evaluatedAt: string;
  continuity: QueueContinuityBindingInput | null;
  caseBindings: readonly HubQueueCaseBindingInput[];
  sourceRefs: readonly string[];
  version: number;
}

export interface QueueContinuityBindingInput {
  selectedQueueRowRef?: string | null;
  selectedOptionCardRef?: string | null;
  selectedAnchorRef?: string | null;
  selectedAnchorTupleHashRef?: string | null;
  dominantActionRef?: string | null;
  blockerStubRefs?: readonly string[];
  focusProtectedRef?: string | null;
}

export interface HubQueueCaseBindingInput {
  hubCoordinationCaseId: string;
  patientChoiceExpiresAt?: string | null;
  bounceCount?: number | null;
  dependencyDelayMinutes?: number | null;
  localFailureScore?: number | null;
  accessPenalty?: number | null;
  modalityGap?: number | null;
  awaitingPatient?: boolean | null;
  callbackTransferBlocked?: boolean | null;
  candidateRefreshGraceMinutes?: number | null;
  currentDominantAction?: HubQueueDominantAction | null;
  blockerStubRefs?: readonly string[];
  reservationBindings?: readonly HubOptionCapacityReservationBindingSnapshot[];
  selectedAnchorRef?: string | null;
  selectedAnchorTupleHashRef?: string | null;
  selectedOptionCardRef?: string | null;
  sourceRefs?: readonly string[];
}

export interface PublishHubQueueOrderInput {
  queueRef?: string;
  hubCoordinationCaseIds: readonly string[];
  evaluatedAt: string;
  continuity?: QueueContinuityBindingInput | null;
  caseBindings?: readonly HubQueueCaseBindingInput[];
  sourceFactCutRef?: string | null;
  trustInputRefs?: readonly string[];
  applyPolicy?: QueueChangeApplyPolicy;
  sourceRefs?: readonly string[];
}

export interface HubQueuePublishResult {
  queueRankPlan: HubQueueRankPlanSnapshot;
  fairnessState: HubFairnessCycleStateSnapshot | null;
  rankSnapshot: HubQueueRankSnapshot;
  rankEntries: readonly HubQueueRankEntrySnapshot[];
  riskExplanations: readonly HubQueueRiskExplanationSnapshot[];
  timers: readonly HubQueueTimerSnapshot[];
  queueChangeBatch: QueueChangeBatchSnapshot | null;
  workbenchProjection: HubQueueWorkbenchProjectionSnapshot;
  consistencyProjection: HubConsoleConsistencyProjectionSnapshot;
  caseConsoleProjections: readonly HubCaseConsoleProjectionSnapshot[];
  optionCardProjections: readonly HubOptionCardProjectionSnapshot[];
  postureProjection: HubPostureProjectionSnapshot;
  escalationBanners: readonly HubEscalationBannerProjectionSnapshot[];
  replayFixture: HubQueueReplayFixtureSnapshot;
}

export interface HubQueueReplayResult extends HubQueuePublishResult {
  matchesStoredSnapshot: boolean;
  mismatchFields: readonly string[];
  originalSnapshot: HubQueueRankSnapshot | null;
}

export interface Phase5HubQueueEngineRepositories {
  getRankPlan(
    queueRankPlanId: string,
  ): Promise<SnapshotDocument<HubQueueRankPlanSnapshot> | null>;
  saveRankPlan(
    snapshot: HubQueueRankPlanSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getFairnessState(
    queueRef: string,
  ): Promise<SnapshotDocument<HubFairnessCycleStateSnapshot> | null>;
  saveFairnessState(
    snapshot: HubFairnessCycleStateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getRankSnapshot(
    rankSnapshotId: string,
  ): Promise<SnapshotDocument<HubQueueRankSnapshot> | null>;
  saveRankSnapshot(
    snapshot: HubQueueRankSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listRankSnapshotsForQueue(
    queueRef: string,
  ): Promise<readonly SnapshotDocument<HubQueueRankSnapshot>[]>;
  saveRiskExplanation(
    snapshot: HubQueueRiskExplanationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listRiskExplanationsForSnapshot(
    rankSnapshotId: string,
  ): Promise<readonly SnapshotDocument<HubQueueRiskExplanationSnapshot>[]>;
  saveRankEntry(
    snapshot: HubQueueRankEntrySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listRankEntriesForSnapshot(
    rankSnapshotId: string,
  ): Promise<readonly SnapshotDocument<HubQueueRankEntrySnapshot>[]>;
  saveTimer(snapshot: HubQueueTimerSnapshot, options?: CompareAndSetWriteOptions): Promise<void>;
  listTimersForSnapshot(
    rankSnapshotId: string,
  ): Promise<readonly SnapshotDocument<HubQueueTimerSnapshot>[]>;
  saveQueueChangeBatch(
    snapshot: QueueChangeBatchSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getQueueChangeBatch(batchId: string): Promise<SnapshotDocument<QueueChangeBatchSnapshot> | null>;
  listQueueChangeBatchesForQueue(
    queueRef: string,
  ): Promise<readonly SnapshotDocument<QueueChangeBatchSnapshot>[]>;
  saveWorkbenchProjection(
    snapshot: HubQueueWorkbenchProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getWorkbenchProjection(
    workbenchProjectionId: string,
  ): Promise<SnapshotDocument<HubQueueWorkbenchProjectionSnapshot> | null>;
  listWorkbenchProjectionsForQueue(
    queueRef: string,
  ): Promise<readonly SnapshotDocument<HubQueueWorkbenchProjectionSnapshot>[]>;
  saveCaseConsoleProjection(
    snapshot: HubCaseConsoleProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listCaseConsoleProjectionsForSnapshot(
    rankSnapshotId: string,
  ): Promise<readonly SnapshotDocument<HubCaseConsoleProjectionSnapshot>[]>;
  saveOptionCardProjection(
    snapshot: HubOptionCardProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listOptionCardProjectionsForSnapshot(
    rankSnapshotId: string,
  ): Promise<readonly SnapshotDocument<HubOptionCardProjectionSnapshot>[]>;
  savePostureProjection(
    snapshot: HubPostureProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listPostureProjectionsForQueue(
    queueRef: string,
  ): Promise<readonly SnapshotDocument<HubPostureProjectionSnapshot>[]>;
  saveEscalationBanner(
    snapshot: HubEscalationBannerProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listEscalationBannersForSnapshot(
    rankSnapshotId: string,
  ): Promise<readonly SnapshotDocument<HubEscalationBannerProjectionSnapshot>[]>;
  saveConsistencyProjection(
    snapshot: HubConsoleConsistencyProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listConsistencyProjectionsForQueue(
    queueRef: string,
  ): Promise<readonly SnapshotDocument<HubConsoleConsistencyProjectionSnapshot>[]>;
  saveReplayFixture(
    snapshot: HubQueueReplayFixtureSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReplayFixtureForSnapshot(
    rankSnapshotId: string,
  ): Promise<SnapshotDocument<HubQueueReplayFixtureSnapshot> | null>;
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

export class Phase5HubQueueEngineStore implements Phase5HubQueueEngineRepositories {
  private readonly rankPlans = new Map<string, HubQueueRankPlanSnapshot>();
  private readonly fairnessStates = new Map<string, HubFairnessCycleStateSnapshot>();
  private readonly rankSnapshots = new Map<string, HubQueueRankSnapshot>();
  private readonly queueRankSnapshots = new Map<string, string[]>();
  private readonly riskExplanations = new Map<string, HubQueueRiskExplanationSnapshot>();
  private readonly snapshotRiskExplanations = new Map<string, string[]>();
  private readonly rankEntries = new Map<string, HubQueueRankEntrySnapshot>();
  private readonly snapshotRankEntries = new Map<string, string[]>();
  private readonly timers = new Map<string, HubQueueTimerSnapshot>();
  private readonly snapshotTimers = new Map<string, string[]>();
  private readonly queueChangeBatches = new Map<string, QueueChangeBatchSnapshot>();
  private readonly queueBatches = new Map<string, string[]>();
  private readonly workbenchProjections = new Map<string, HubQueueWorkbenchProjectionSnapshot>();
  private readonly queueWorkbenchProjections = new Map<string, string[]>();
  private readonly caseConsoleProjections = new Map<string, HubCaseConsoleProjectionSnapshot>();
  private readonly snapshotCaseConsoleProjections = new Map<string, string[]>();
  private readonly optionCardProjections = new Map<string, HubOptionCardProjectionSnapshot>();
  private readonly snapshotOptionCardProjections = new Map<string, string[]>();
  private readonly postureProjections = new Map<string, HubPostureProjectionSnapshot>();
  private readonly queuePostureProjections = new Map<string, string[]>();
  private readonly escalationBanners = new Map<string, HubEscalationBannerProjectionSnapshot>();
  private readonly snapshotEscalationBanners = new Map<string, string[]>();
  private readonly consistencyProjections = new Map<string, HubConsoleConsistencyProjectionSnapshot>();
  private readonly queueConsistencyProjections = new Map<string, string[]>();
  private readonly replayFixtures = new Map<string, HubQueueReplayFixtureSnapshot>();

  private pushIndex(index: Map<string, string[]>, key: string, id: string) {
    const ids = index.get(key) ?? [];
    if (!ids.includes(id)) {
      ids.push(id);
      index.set(key, ids);
    }
  }

  async getRankPlan(queueRankPlanId: string) {
    const snapshot = this.rankPlans.get(queueRankPlanId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveRankPlan(snapshot: HubQueueRankPlanSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.rankPlans, snapshot.queueRankPlanId, snapshot, options);
  }

  async getFairnessState(queueRef: string) {
    const snapshot = this.fairnessStates.get(queueRef);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveFairnessState(
    snapshot: HubFairnessCycleStateSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.fairnessStates, snapshot.queueRef, snapshot, options);
  }

  async getRankSnapshot(rankSnapshotId: string) {
    const snapshot = this.rankSnapshots.get(rankSnapshotId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveRankSnapshot(snapshot: HubQueueRankSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.rankSnapshots, snapshot.rankSnapshotId, snapshot, options);
    this.pushIndex(this.queueRankSnapshots, snapshot.queueRef, snapshot.rankSnapshotId);
  }

  async listRankSnapshotsForQueue(queueRef: string) {
    return (this.queueRankSnapshots.get(queueRef) ?? [])
      .map((snapshotId) => this.rankSnapshots.get(snapshotId))
      .filter((snapshot): snapshot is HubQueueRankSnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async saveRiskExplanation(
    snapshot: HubQueueRiskExplanationSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.riskExplanations, snapshot.hubQueueRiskExplanationId, snapshot, options);
    this.pushIndex(
      this.snapshotRiskExplanations,
      snapshot.rankSnapshotRef,
      snapshot.hubQueueRiskExplanationId,
    );
  }

  async listRiskExplanationsForSnapshot(rankSnapshotId: string) {
    return (this.snapshotRiskExplanations.get(rankSnapshotId) ?? [])
      .map((snapshotId) => this.riskExplanations.get(snapshotId))
      .filter((snapshot): snapshot is HubQueueRiskExplanationSnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async saveRankEntry(snapshot: HubQueueRankEntrySnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.rankEntries, snapshot.rankEntryId, snapshot, options);
    this.pushIndex(this.snapshotRankEntries, snapshot.rankSnapshotRef, snapshot.rankEntryId);
  }

  async listRankEntriesForSnapshot(rankSnapshotId: string) {
    return (this.snapshotRankEntries.get(rankSnapshotId) ?? [])
      .map((snapshotId) => this.rankEntries.get(snapshotId))
      .filter((snapshot): snapshot is HubQueueRankEntrySnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async saveTimer(snapshot: HubQueueTimerSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.timers, snapshot.hubQueueTimerId, snapshot, options);
    this.pushIndex(this.snapshotTimers, snapshot.rankSnapshotRef, snapshot.hubQueueTimerId);
  }

  async listTimersForSnapshot(rankSnapshotId: string) {
    return (this.snapshotTimers.get(rankSnapshotId) ?? [])
      .map((snapshotId) => this.timers.get(snapshotId))
      .filter((snapshot): snapshot is HubQueueTimerSnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async saveQueueChangeBatch(
    snapshot: QueueChangeBatchSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.queueChangeBatches, snapshot.batchId, snapshot, options);
    this.pushIndex(this.queueBatches, snapshot.queueRef, snapshot.batchId);
  }

  async getQueueChangeBatch(batchId: string) {
    const snapshot = this.queueChangeBatches.get(batchId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async listQueueChangeBatchesForQueue(queueRef: string) {
    return (this.queueBatches.get(queueRef) ?? [])
      .map((snapshotId) => this.queueChangeBatches.get(snapshotId))
      .filter((snapshot): snapshot is QueueChangeBatchSnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async saveWorkbenchProjection(
    snapshot: HubQueueWorkbenchProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.workbenchProjections, snapshot.hubQueueWorkbenchProjectionId, snapshot, options);
    this.pushIndex(
      this.queueWorkbenchProjections,
      snapshot.queueRef,
      snapshot.hubQueueWorkbenchProjectionId,
    );
  }

  async getWorkbenchProjection(workbenchProjectionId: string) {
    const snapshot = this.workbenchProjections.get(workbenchProjectionId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async listWorkbenchProjectionsForQueue(queueRef: string) {
    return (this.queueWorkbenchProjections.get(queueRef) ?? [])
      .map((snapshotId) => this.workbenchProjections.get(snapshotId))
      .filter((snapshot): snapshot is HubQueueWorkbenchProjectionSnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async saveCaseConsoleProjection(
    snapshot: HubCaseConsoleProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.caseConsoleProjections,
      snapshot.hubCaseConsoleProjectionId,
      snapshot,
      options,
    );
    this.pushIndex(
      this.snapshotCaseConsoleProjections,
      snapshot.rankSnapshotRef,
      snapshot.hubCaseConsoleProjectionId,
    );
  }

  async listCaseConsoleProjectionsForSnapshot(rankSnapshotId: string) {
    return (this.snapshotCaseConsoleProjections.get(rankSnapshotId) ?? [])
      .map((snapshotId) => this.caseConsoleProjections.get(snapshotId))
      .filter((snapshot): snapshot is HubCaseConsoleProjectionSnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async saveOptionCardProjection(
    snapshot: HubOptionCardProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.optionCardProjections,
      snapshot.hubOptionCardProjectionId,
      snapshot,
      options,
    );
    this.pushIndex(
      this.snapshotOptionCardProjections,
      snapshot.rankSnapshotRef,
      snapshot.hubOptionCardProjectionId,
    );
  }

  async listOptionCardProjectionsForSnapshot(rankSnapshotId: string) {
    return (this.snapshotOptionCardProjections.get(rankSnapshotId) ?? [])
      .map((snapshotId) => this.optionCardProjections.get(snapshotId))
      .filter((snapshot): snapshot is HubOptionCardProjectionSnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async savePostureProjection(
    snapshot: HubPostureProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.postureProjections, snapshot.hubPostureProjectionId, snapshot, options);
    this.pushIndex(
      this.queuePostureProjections,
      snapshot.queueRef,
      snapshot.hubPostureProjectionId,
    );
  }

  async listPostureProjectionsForQueue(queueRef: string) {
    return (this.queuePostureProjections.get(queueRef) ?? [])
      .map((snapshotId) => this.postureProjections.get(snapshotId))
      .filter((snapshot): snapshot is HubPostureProjectionSnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async saveEscalationBanner(
    snapshot: HubEscalationBannerProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.escalationBanners,
      snapshot.hubEscalationBannerProjectionId,
      snapshot,
      options,
    );
    this.pushIndex(
      this.snapshotEscalationBanners,
      snapshot.rankSnapshotRef,
      snapshot.hubEscalationBannerProjectionId,
    );
  }

  async listEscalationBannersForSnapshot(rankSnapshotId: string) {
    return (this.snapshotEscalationBanners.get(rankSnapshotId) ?? [])
      .map((snapshotId) => this.escalationBanners.get(snapshotId))
      .filter((snapshot): snapshot is HubEscalationBannerProjectionSnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async saveConsistencyProjection(
    snapshot: HubConsoleConsistencyProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.consistencyProjections,
      snapshot.hubConsoleConsistencyProjectionId,
      snapshot,
      options,
    );
    this.pushIndex(
      this.queueConsistencyProjections,
      snapshot.queueRef,
      snapshot.hubConsoleConsistencyProjectionId,
    );
  }

  async listConsistencyProjectionsForQueue(queueRef: string) {
    return (this.queueConsistencyProjections.get(queueRef) ?? [])
      .map((snapshotId) => this.consistencyProjections.get(snapshotId))
      .filter((snapshot): snapshot is HubConsoleConsistencyProjectionSnapshot => snapshot !== undefined)
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async saveReplayFixture(
    snapshot: HubQueueReplayFixtureSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.replayFixtures, snapshot.rankSnapshotRef, snapshot, options);
  }

  async getReplayFixtureForSnapshot(rankSnapshotId: string) {
    const snapshot = this.replayFixtures.get(rankSnapshotId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }
}

export function createPhase5HubQueueEngineStore() {
  return new Phase5HubQueueEngineStore();
}

export interface Phase5HubQueueEngineService {
  repositories: Phase5HubQueueEngineRepositories;
  hubCaseService: Phase5HubCaseKernelService;
  capacityRepositories: Phase5NetworkCapacityPipelineRepositories;
  publishHubQueueOrder(input: PublishHubQueueOrderInput): Promise<HubQueuePublishResult>;
  replayHubQueueOrder(input: { rankSnapshotId: string }): Promise<HubQueueReplayResult>;
}

const queueRankPlanCatalog = {
  "319.hub-queue-rank-plan.v1": {
    queueFamilyRef: "hub_coordination.queue",
    eligibilityRuleSetRef: "319.hub-queue.eligibility.v1",
    lexicographicTierPolicyRef: "319.hub-queue.lexicographic.v1",
    withinTierWeightSetRef: "319.hub-queue.secondary.v1",
    fairnessMergePolicyRef: "319.hub-queue.fairness.v1",
    overloadGuardPolicyRef: "319.hub-queue.overload.v1",
    assignmentSuggestionPolicyRef: "319.hub-queue.suggestion.v1",
    explanationSchemaRef: "319.hub-queue.explanation.v1",
    canonicalTieBreakPolicyRef: "319.hub-queue.tie-break.v1",
    effectiveAt: "2026-04-23T00:00:00.000Z",
    minimumServiceMinutes: 15,
    coordinatorParallelism: 2,
    coordinationDelayMinutes: 5,
    queueVarianceWeight: 1.2,
    serviceVarianceWeight: 0.8,
    dependencyVarianceWeight: 1.4,
    tauBreachCritical: 0.7,
    tauBreachWarn: 0.35,
    epsilonRank: 0.0001,
    maxIterations: 8,
    overloadObservationMinutes: 120,
    overloadGuardThreshold: 0.8,
    fairnessQuantumMinutes: 15,
    fairnessCreditCap: 6,
    fairnessAgeDebtStartMinutes: 45,
    fairnessAgeDebtHorizonMinutes: 120,
    fairnessAgeWeight: 0.75,
    flushBufferMinutes: 15,
    candidateRefreshGraceMinutes: 5,
    callbackTransferDebtMinutes: 20,
    practiceAckGraceMinutes: 15,
    bounceCap: 4,
    secondaryWeights: {
      gap: 0.24,
      trust: 0.14,
      degraded: 0.11,
      access: 0.11,
      modality: 0.08,
      localfail: 0.12,
      waiting: 0.1,
      bounce: 0.1,
    },
  },
} as const satisfies Record<string, HubQueueRankPlanConfig>;

interface QueueCaseContext {
  bundle: HubCaseBundle;
  binding: RequiredHubQueueCaseBindingInput;
  candidateSnapshot: NetworkCandidateSnapshot | null;
  candidates: readonly NetworkSlotCandidateSnapshot[];
  rankProof: CapacityRankProofSnapshot | null;
  rankExplanations: readonly CapacityRankExplanationSnapshot[];
  decisionPlan: CrossSiteDecisionPlanSnapshot | null;
  sourceAdmissions: readonly CapacitySourceTrustAdmissionSnapshot[];
}

interface RequiredHubQueueCaseBindingInput {
  hubCoordinationCaseId: string;
  patientChoiceExpiresAt: string | null;
  bounceCount: number;
  dependencyDelayMinutes: number;
  localFailureScore: number;
  accessPenalty: number;
  modalityGap: number;
  awaitingPatient: boolean;
  callbackTransferBlocked: boolean;
  candidateRefreshGraceMinutes: number;
  currentDominantAction: HubQueueDominantAction | null;
  blockerStubRefs: readonly string[];
  reservationBindings: readonly HubOptionCapacityReservationBindingSnapshot[];
  selectedAnchorRef: string | null;
  selectedAnchorTupleHashRef: string | null;
  selectedOptionCardRef: string | null;
  sourceRefs: readonly string[];
}

interface QueueRankingDraft {
  hubCoordinationCaseId: string;
  bundle: HubCaseBundle;
  binding: RequiredHubQueueCaseBindingInput;
  priorityWeight: number;
  expectedService: number;
  dClinical: number;
  dSla: number;
  laxityClinical: number;
  laxitySla: number;
  urgencyCarry: number;
  coordinationDelayMinutes: number;
  dependencyDelayMinutes: number;
  workloadAheadMinutes: number;
  waitToStartMinutes: number;
  pClinicalBreach: number;
  pSlaBreach: number;
  pBreach: number;
  riskBand: 0 | 1 | 2 | 3;
  bestFit: number;
  bestTrustedFit: number;
  trustGap: number;
  degradedOnly: boolean;
  accessPenalty: number;
  modalityGap: number;
  localFail: number;
  awaitingPatient: number;
  bounce: number;
  secondaryScore: number;
  fairnessPracticeRef: string;
  fairnessCreditBefore: number;
  fairnessCreditAfter: number;
  serviceCost: number;
  dominantAction: HubQueueDominantAction;
  timers: readonly HubQueueTimerSnapshot[];
  bannerType: HubEscalationBannerType | null;
  sourceRefs: readonly string[];
}

function normalizeCaseBinding(
  binding: HubQueueCaseBindingInput,
  plan: HubQueueRankPlanConfig,
): RequiredHubQueueCaseBindingInput {
  return {
    hubCoordinationCaseId: requireRef(binding.hubCoordinationCaseId, "hubCoordinationCaseId"),
    patientChoiceExpiresAt: optionalRef(binding.patientChoiceExpiresAt)
      ? ensureIsoTimestamp(binding.patientChoiceExpiresAt!, "patientChoiceExpiresAt")
      : null,
    bounceCount: ensureNonNegativeInteger(binding.bounceCount ?? 0, "bounceCount"),
    dependencyDelayMinutes: ensureNonNegativeInteger(
      binding.dependencyDelayMinutes ?? 0,
      "dependencyDelayMinutes",
    ),
    localFailureScore: ensureUnitInterval(
      binding.localFailureScore ?? 0,
      "localFailureScore",
    ),
    accessPenalty: ensureUnitInterval(binding.accessPenalty ?? 0, "accessPenalty"),
    modalityGap: ensureUnitInterval(binding.modalityGap ?? 0, "modalityGap"),
    awaitingPatient: Boolean(binding.awaitingPatient),
    callbackTransferBlocked: Boolean(binding.callbackTransferBlocked),
    candidateRefreshGraceMinutes: ensureNonNegativeInteger(
      binding.candidateRefreshGraceMinutes ?? plan.candidateRefreshGraceMinutes,
      "candidateRefreshGraceMinutes",
    ),
    currentDominantAction: binding.currentDominantAction ?? null,
    blockerStubRefs: uniqueSortedRefs(binding.blockerStubRefs ?? []),
    reservationBindings: (binding.reservationBindings ?? []).map((entry) => ({
      hubCoordinationCaseId: requireRef(entry.hubCoordinationCaseId, "reservation.hubCoordinationCaseId"),
      candidateRef: requireRef(entry.candidateRef, "reservation.candidateRef"),
      reservationRef: requireRef(entry.reservationRef, "reservation.reservationRef"),
      reservationState: entry.reservationState,
      reservationFenceToken: optionalRef(entry.reservationFenceToken),
      expiresAt: optionalRef(entry.expiresAt)
        ? ensureIsoTimestamp(entry.expiresAt!, "reservation.expiresAt")
        : null,
      sourceRefs: uniqueSortedRefs(entry.sourceRefs ?? []),
    })),
    selectedAnchorRef: optionalRef(binding.selectedAnchorRef),
    selectedAnchorTupleHashRef: optionalRef(binding.selectedAnchorTupleHashRef),
    selectedOptionCardRef: optionalRef(binding.selectedOptionCardRef),
    sourceRefs: uniqueSortedRefs(binding.sourceRefs ?? []),
  };
}

function normalizeContinuity(
  continuity: QueueContinuityBindingInput | null | undefined,
): QueueContinuityBindingInput | null {
  if (!continuity) {
    return null;
  }
  return {
    selectedQueueRowRef: optionalRef(continuity.selectedQueueRowRef),
    selectedOptionCardRef: optionalRef(continuity.selectedOptionCardRef),
    selectedAnchorRef: optionalRef(continuity.selectedAnchorRef),
    selectedAnchorTupleHashRef: optionalRef(continuity.selectedAnchorTupleHashRef),
    dominantActionRef: optionalRef(continuity.dominantActionRef),
    blockerStubRefs: uniqueSortedRefs(continuity.blockerStubRefs ?? []),
    focusProtectedRef: optionalRef(continuity.focusProtectedRef),
  };
}

function currentRankPlan(
  planId: keyof typeof queueRankPlanCatalog = "319.hub-queue-rank-plan.v1",
): HubQueueRankPlanSnapshot {
  const plan = queueRankPlanCatalog[planId];
  invariant(plan !== undefined, "UNKNOWN_QUEUE_RANK_PLAN", `Unsupported queue rank plan ${planId}.`);
  return {
    queueRankPlanId: planId,
    queueFamilyRef: plan.queueFamilyRef,
    eligibilityRuleSetRef: plan.eligibilityRuleSetRef,
    lexicographicTierPolicyRef: plan.lexicographicTierPolicyRef,
    withinTierWeightSetRef: plan.withinTierWeightSetRef,
    fairnessMergePolicyRef: plan.fairnessMergePolicyRef,
    overloadGuardPolicyRef: plan.overloadGuardPolicyRef,
    assignmentSuggestionPolicyRef: plan.assignmentSuggestionPolicyRef,
    explanationSchemaRef: plan.explanationSchemaRef,
    canonicalTieBreakPolicyRef: plan.canonicalTieBreakPolicyRef,
    planHash: sha256Hex(stableStringify(plan)),
    effectiveAt: plan.effectiveAt,
    version: 1,
  };
}

function dominantActionForCase(
  hubCase: HubCoordinationCaseSnapshot,
  binding: RequiredHubQueueCaseBindingInput,
): HubQueueDominantAction {
  if (binding.currentDominantAction) {
    return binding.currentDominantAction;
  }
  if (hubCase.ownerState === "stale_owner_recovery") {
    return "recover_stale_owner";
  }
  switch (hubCase.status) {
    case "queued":
      return "claim_case";
    case "candidate_searching":
    case "candidates_ready":
      return "refresh_candidates";
    case "coordinator_selecting":
      return "review_ranked_options";
    case "alternatives_offered":
    case "patient_choice_pending":
      return "resolve_patient_choice";
    case "candidate_revalidating":
      return "revalidate_candidate";
    case "native_booking_pending":
    case "confirmation_pending":
      return "complete_booking";
    case "booked_pending_practice_ack":
      return "send_practice_update";
    case "callback_transfer_pending":
    case "callback_offered":
    case "escalated_back":
      return "return_to_practice";
    case "booked":
    case "closed":
      return "close_case";
    default:
      return "review_ranked_options";
  }
}

function eligibilityForCase(hubCase: HubCoordinationCaseSnapshot): HubQueueEligibilityState {
  if (hubCase.status === "closed" || hubCase.status === "booked") {
    return "excluded_scope";
  }
  if (hubCase.ownerState === "stale_owner_recovery") {
    return "held_preemption";
  }
  if (hubCase.policyTupleHash === null && hubCase.status !== "queued" && hubCase.status !== "claimed") {
    return "held_trust";
  }
  return "eligible";
}

function calculateBestFits(candidates: readonly NetworkSlotCandidateSnapshot[]) {
  const bestFit = candidates.reduce((best, candidate) => Math.max(best, candidate.robustFit), 0);
  const trusted = candidates.filter((candidate) => candidate.sourceTrustState === "trusted");
  const bestTrustedFit = trusted.reduce((best, candidate) => Math.max(best, candidate.robustFit), 0);
  return {
    bestFit: round6(bestFit),
    bestTrustedFit: round6(bestTrustedFit),
    trustGap: round6(Math.max(0, bestFit - bestTrustedFit)),
    degradedOnly: candidates.length > 0 && trusted.length === 0,
  };
}

function inferAccessPenalty(
  request: NetworkBookingRequestSnapshot,
  candidates: readonly NetworkSlotCandidateSnapshot[],
  binding: RequiredHubQueueCaseBindingInput,
): number {
  if (!floatEq(binding.accessPenalty, 0)) {
    return binding.accessPenalty;
  }
  if (request.accessNeeds.accessibilityRequirementRefs.length === 0) {
    return 0;
  }
  if (candidates.length === 0) {
    return 1;
  }
  const bestAccessibility = candidates.reduce(
    (best, candidate) => Math.max(best, candidate.accessibilityFitScore),
    0,
  );
  return round6(clamp(1 - bestAccessibility, 0, 1));
}

function inferModalityGap(
  request: NetworkBookingRequestSnapshot,
  candidates: readonly NetworkSlotCandidateSnapshot[],
  binding: RequiredHubQueueCaseBindingInput,
): number {
  if (!floatEq(binding.modalityGap, 0)) {
    return binding.modalityGap;
  }
  if (candidates.length === 0) {
    return 1;
  }
  const preferredModes = new Set<PreferredModality>(request.modalityPreference.preferredModes);
  const bestMatching = candidates.some((candidate) =>
    preferredModes.has(candidate.modality as PreferredModality),
  );
  return bestMatching ? 0 : 1;
}

function inferLocalFailureScore(
  request: NetworkBookingRequestSnapshot,
  binding: RequiredHubQueueCaseBindingInput,
): number {
  if (!floatEq(binding.localFailureScore, 0)) {
    return binding.localFailureScore;
  }
  if (
    request.reasonForHubRouting === "waitlist_breach_risk" ||
    request.reasonForHubRouting === "supervisor_return"
  ) {
    return 1;
  }
  if (request.reasonForHubRouting === "no_local_capacity") {
    return 0.7;
  }
  return 0.2;
}

function inferAwaitingPatient(
  hubCase: HubCoordinationCaseSnapshot,
  binding: RequiredHubQueueCaseBindingInput,
): boolean {
  if (binding.awaitingPatient) {
    return true;
  }
  return hubCase.status === "patient_choice_pending" || hubCase.status === "alternatives_offered";
}

function logGamma(z: number): number {
  const coefficients = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.001208650973866179,
    -0.000005395239384953,
  ];
  let x = z;
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const coefficient of coefficients) {
    y += 1;
    ser += coefficient / y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function regularizedGammaP(a: number, x: number): number {
  if (x <= 0) {
    return 0;
  }
  if (x < a + 1) {
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 1; n <= 200; n += 1) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 3e-7) {
        return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
      }
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }

  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 200; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) {
      d = 1e-30;
    }
    c = b + an / c;
    if (Math.abs(c) < 1e-30) {
      c = 1e-30;
    }
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-7) {
      break;
    }
  }
  return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

function gammaCdf(x: number, shape: number, scale: number): number {
  if (x <= 0) {
    return 0;
  }
  return clamp(regularizedGammaP(shape, x / scale), 0, 1);
}

function computeBreachProbability(deadlineMinutes: number, meanMinutes: number, varianceMinutes: number): number {
  if (deadlineMinutes <= 0) {
    return 1;
  }
  const mean = Math.max(1, meanMinutes);
  const variance = Math.max(1, varianceMinutes);
  const shape = Math.max(0.001, (mean * mean) / variance);
  const scale = Math.max(0.001, variance / mean);
  return round6(1 - gammaCdf(deadlineMinutes, shape, scale));
}

function computeIntrinsicSeedOrder(drafts: readonly QueueRankingDraft[]): readonly string[] {
  return [...drafts]
    .sort((left, right) => {
      const leftMin = Math.min(left.laxityClinical, left.laxitySla);
      const rightMin = Math.min(right.laxityClinical, right.laxitySla);
      if (!floatEq(leftMin, rightMin)) {
        return leftMin - rightMin;
      }
      if (!floatEq(left.urgencyCarry, right.urgencyCarry)) {
        return right.urgencyCarry - left.urgencyCarry;
      }
      if (left.priorityWeight !== right.priorityWeight) {
        return right.priorityWeight - left.priorityWeight;
      }
      const leftQueued = left.bundle.hubCase.queueEnteredAt ?? left.bundle.networkBookingRequest.requestedAt;
      const rightQueued =
        right.bundle.hubCase.queueEnteredAt ?? right.bundle.networkBookingRequest.requestedAt;
      const queuedComparison = compareIso(leftQueued, rightQueued);
      if (queuedComparison !== 0) {
        return queuedComparison;
      }
      return left.hubCoordinationCaseId.localeCompare(right.hubCoordinationCaseId);
    })
    .map((draft) => draft.hubCoordinationCaseId);
}

function computeQueueMetrics(
  orderedDrafts: readonly QueueRankingDraft[],
  evaluatedAt: string,
  plan: HubQueueRankPlanConfig,
): readonly QueueRankingDraft[] {
  const byId = new Map(orderedDrafts.map((draft) => [draft.hubCoordinationCaseId, draft] as const));
  let workloadAhead = 0;
  const results: QueueRankingDraft[] = [];
  for (const caseId of orderedDrafts.map((draft) => draft.hubCoordinationCaseId)) {
    const draft = byId.get(caseId)!;
    const waitToStartMinutes = round6(workloadAhead / plan.coordinatorParallelism);
    const dependencyDelayMinutes = draft.binding.dependencyDelayMinutes;
    const coordinationDelayMinutes = draft.coordinationDelayMinutes;
    const totalMean =
      waitToStartMinutes + draft.expectedService + coordinationDelayMinutes + dependencyDelayMinutes;
    const totalVariance =
      waitToStartMinutes * plan.queueVarianceWeight +
      draft.expectedService * plan.serviceVarianceWeight +
      dependencyDelayMinutes * plan.dependencyVarianceWeight +
      coordinationDelayMinutes;
    const pClinicalBreach = computeBreachProbability(draft.dClinical, totalMean, totalVariance);
    const pSlaBreach = computeBreachProbability(draft.dSla, totalMean, totalVariance);
    const pBreach = round6(Math.max(pClinicalBreach, pSlaBreach));
    const riskBand: 0 | 1 | 2 | 3 =
      Math.min(draft.laxityClinical, draft.laxitySla) <= 0
        ? 3
        : pBreach >= plan.tauBreachCritical
          ? 2
          : pBreach >= plan.tauBreachWarn
            ? 1
            : 0;
    const secondaryScore = round6(
      plan.secondaryWeights.gap * (1 - draft.bestTrustedFit) +
        plan.secondaryWeights.trust * draft.trustGap +
        plan.secondaryWeights.degraded * (draft.degradedOnly ? 1 : 0) +
        plan.secondaryWeights.access * draft.accessPenalty +
        plan.secondaryWeights.modality * draft.modalityGap +
        plan.secondaryWeights.localfail * draft.localFail +
        plan.secondaryWeights.waiting * draft.awaitingPatient +
        plan.secondaryWeights.bounce * draft.bounce,
    );
    const nextDraft: QueueRankingDraft = {
      ...draft,
      workloadAheadMinutes: round6(workloadAhead),
      waitToStartMinutes,
      dependencyDelayMinutes,
      coordinationDelayMinutes,
      pClinicalBreach,
      pSlaBreach,
      pBreach,
      riskBand,
      secondaryScore,
      timers: draft.timers,
    };
    workloadAhead += draft.expectedService + coordinationDelayMinutes + dependencyDelayMinutes;
    results.push(nextDraft);
  }
  return results;
}

function stableSortDrafts(drafts: readonly QueueRankingDraft[]): readonly QueueRankingDraft[] {
  return [...drafts].sort((left, right) => {
    if (left.riskBand !== right.riskBand) {
      return right.riskBand - left.riskBand;
    }
    if (!floatEq(left.urgencyCarry, right.urgencyCarry)) {
      return right.urgencyCarry - left.urgencyCarry;
    }
    if (!floatEq(left.pBreach, right.pBreach)) {
      return right.pBreach - left.pBreach;
    }
    if (left.priorityWeight !== right.priorityWeight) {
      return right.priorityWeight - left.priorityWeight;
    }
    if (!floatEq(left.secondaryScore, right.secondaryScore)) {
      return right.secondaryScore - left.secondaryScore;
    }
    const leftQueued = left.bundle.hubCase.queueEnteredAt ?? left.bundle.networkBookingRequest.requestedAt;
    const rightQueued =
      right.bundle.hubCase.queueEnteredAt ?? right.bundle.networkBookingRequest.requestedAt;
    const queuedComparison = compareIso(leftQueued, rightQueued);
    if (queuedComparison !== 0) {
      return queuedComparison;
    }
    return left.hubCoordinationCaseId.localeCompare(right.hubCoordinationCaseId);
  });
}

function serviceCostForDraft(draft: QueueRankingDraft, plan: HubQueueRankPlanConfig): number {
  return round6(Math.max(1, draft.expectedService / plan.fairnessQuantumMinutes));
}

function groupByPractice(drafts: readonly QueueRankingDraft[]): Map<string, QueueRankingDraft[]> {
  const grouped = new Map<string, QueueRankingDraft[]>();
  for (const draft of drafts) {
    const queue = grouped.get(draft.fairnessPracticeRef) ?? [];
    queue.push(draft);
    grouped.set(draft.fairnessPracticeRef, queue);
  }
  return grouped;
}

function computeCriticalLoad(
  drafts: readonly QueueRankingDraft[],
  plan: HubQueueRankPlanConfig,
): { rhoHubCritical: number; overloadState: HubQueueOverloadState; criticalCaseRefs: readonly string[] } {
  const critical = drafts.filter((draft) => draft.riskBand === 3);
  if (critical.length === 0) {
    return {
      rhoHubCritical: 0,
      overloadState: "nominal",
      criticalCaseRefs: [],
    };
  }
  const totalCriticalMinutes = critical.reduce((sum, draft) => sum + draft.expectedService, 0);
  const rhoHubCritical = round6(
    totalCriticalMinutes / (plan.coordinatorParallelism * plan.overloadObservationMinutes),
  );
  return {
    rhoHubCritical,
    overloadState: rhoHubCritical >= plan.overloadGuardThreshold ? "overload_critical" : "nominal",
    criticalCaseRefs: critical.map((draft) => draft.hubCoordinationCaseId),
  };
}

function fairnessMerge(
  drafts: readonly QueueRankingDraft[],
  previousFairnessState: HubFairnessCycleStateSnapshot | null,
  evaluatedAt: string,
  plan: HubQueueRankPlanConfig,
): {
  orderedDrafts: readonly QueueRankingDraft[];
  fairnessStateDraft: Omit<HubFairnessCycleStateSnapshot, "fairnessCycleStateId" | "rankSnapshotRef" | "generatedAt" | "version">;
} {
  const criticalLoad = computeCriticalLoad(drafts, plan);
  const previousCredits = { ...(previousFairnessState?.creditLedger ?? {}) };
  const fairnessEntries = new Map<string, HubFairnessLedgerEntrySnapshot>();

  const byBand = new Map<0 | 1 | 2 | 3, QueueRankingDraft[]>();
  for (const band of [3, 2, 1, 0] as const) {
    byBand.set(
      band,
      drafts.filter((draft) => draft.riskBand === band),
    );
  }

  const orderedDrafts: QueueRankingDraft[] = [];
  orderedDrafts.push(...(byBand.get(3) ?? []));

  for (const band of [2, 1, 0] as const) {
    const bandDrafts = byBand.get(band) ?? [];
    if (bandDrafts.length === 0) {
      continue;
    }
    if (criticalLoad.overloadState === "overload_critical") {
      orderedDrafts.push(...bandDrafts);
      continue;
    }

    const grouped = groupByPractice(bandDrafts);
    while ([...grouped.values()].some((queue) => queue.length > 0)) {
      const candidates = [...grouped.entries()]
        .filter(([, queue]) => queue.length > 0)
        .map(([practiceRef, queue]) => {
          const head = queue[0]!;
          const ageMinutes = workingMinutesBetween(
            head.bundle.hubCase.queueEnteredAt ?? head.bundle.networkBookingRequest.requestedAt,
            evaluatedAt,
          );
          const ageDebt = round6(
            clamp(
              (ageMinutes - plan.fairnessAgeDebtStartMinutes) / plan.fairnessAgeDebtHorizonMinutes,
              0,
              1,
            ),
          );
          const creditBefore = clamp(previousCredits[practiceRef] ?? 0, 0, plan.fairnessCreditCap);
          const toppedUp = clamp(
            creditBefore + 1 + plan.fairnessAgeWeight * ageDebt,
            0,
            plan.fairnessCreditCap,
          );
          const serviceCost = serviceCostForDraft(head, plan);
          return {
            practiceRef,
            head,
            ageDebt,
            creditBefore,
            toppedUp,
            serviceCost,
            score: toppedUp / serviceCost,
          };
        })
        .sort((left, right) => {
          if (!floatEq(left.score, right.score)) {
            return right.score - left.score;
          }
          const queuedComparison = compareIso(
            left.head.bundle.hubCase.queueEnteredAt ?? left.head.bundle.networkBookingRequest.requestedAt,
            right.head.bundle.hubCase.queueEnteredAt ??
              right.head.bundle.networkBookingRequest.requestedAt,
          );
          if (queuedComparison !== 0) {
            return queuedComparison;
          }
          return left.practiceRef.localeCompare(right.practiceRef);
        });

      const chosen = candidates[0]!;
      const nextQueue = grouped.get(chosen.practiceRef)!;
      const emitted = nextQueue.shift()!;
      const creditAfter = round6(clamp(chosen.toppedUp - chosen.serviceCost, 0, plan.fairnessCreditCap));
      previousCredits[chosen.practiceRef] = creditAfter;
      const existingEntry = fairnessEntries.get(chosen.practiceRef);
      fairnessEntries.set(chosen.practiceRef, {
        practiceRef: chosen.practiceRef,
        creditBefore: existingEntry?.creditBefore ?? chosen.creditBefore,
        creditAfter,
        ageDebt: Math.max(existingEntry?.ageDebt ?? 0, chosen.ageDebt),
        emittedCaseRefs: [...(existingEntry?.emittedCaseRefs ?? []), emitted.hubCoordinationCaseId],
      });
      orderedDrafts.push({
        ...emitted,
        fairnessCreditBefore: chosen.creditBefore,
        fairnessCreditAfter: creditAfter,
        serviceCost: chosen.serviceCost,
      });
    }
  }

  return {
    orderedDrafts,
    fairnessStateDraft: {
      queueRef: drafts[0]?.bundle.hubCase.servingPcnId
        ? `hub_queue:${drafts[0]!.bundle.hubCase.servingPcnId}`
        : "hub_queue:unknown",
      overloadState: criticalLoad.overloadState,
      fairnessSuppressed: criticalLoad.overloadState === "overload_critical",
      rhoHubCritical: criticalLoad.rhoHubCritical,
      criticalCaseRefs: criticalLoad.criticalCaseRefs,
      ledgerEntries: [...fairnessEntries.values()].sort((left, right) =>
        left.practiceRef.localeCompare(right.practiceRef),
      ),
      creditLedger: previousCredits,
    },
  };
}

function compareRiskExplanationSets(
  left: readonly HubQueueRiskExplanationSnapshot[],
  right: readonly HubQueueRiskExplanationSnapshot[],
): number {
  const leftMap = new Map(left.map((entry) => [entry.hubCoordinationCaseId, entry] as const));
  let maxDelta = 0;
  for (const entry of right) {
    const previous = leftMap.get(entry.hubCoordinationCaseId);
    if (!previous) {
      maxDelta = Math.max(maxDelta, 1);
      continue;
    }
    maxDelta = Math.max(maxDelta, Math.abs(previous.pBreach - entry.pBreach));
  }
  return maxDelta;
}

function compareOrder(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function compareQueueSnapshots(
  left: HubQueueRankSnapshot | null,
  right: HubQueueRankSnapshot | null,
): readonly string[] {
  const mismatches: string[] = [];
  if (left === null || right === null) {
    if (left !== right) {
      mismatches.push("snapshotPresence");
    }
    return mismatches;
  }
  if (left.rowOrderHash !== right.rowOrderHash) {
    mismatches.push("rowOrderHash");
  }
  if (left.overloadState !== right.overloadState) {
    mismatches.push("overloadState");
  }
  if (left.convergenceState !== right.convergenceState) {
    mismatches.push("convergenceState");
  }
  return mismatches;
}

async function loadCapacityContext(
  repositories: Phase5NetworkCapacityPipelineRepositories,
  hubCase: HubCoordinationCaseSnapshot,
): Promise<{
  candidateSnapshot: NetworkCandidateSnapshot | null;
  candidates: readonly NetworkSlotCandidateSnapshot[];
  rankProof: CapacityRankProofSnapshot | null;
  rankExplanations: readonly CapacityRankExplanationSnapshot[];
  decisionPlan: CrossSiteDecisionPlanSnapshot | null;
  sourceAdmissions: readonly CapacitySourceTrustAdmissionSnapshot[];
}> {
  const candidateSnapshot = hubCase.candidateSnapshotRef
    ? (await repositories.getSnapshot(hubCase.candidateSnapshotRef))?.toSnapshot() ?? null
    : null;
  const candidates = candidateSnapshot
    ? (await repositories.listCandidatesForSnapshot(candidateSnapshot.snapshotId)).map((document) =>
        document.toSnapshot(),
      )
    : [];
  const rankProof =
    candidateSnapshot && candidateSnapshot.capacityRankProofRef
      ? (await repositories.getRankProof(candidateSnapshot.capacityRankProofRef))?.toSnapshot() ?? null
      : null;
  const rankExplanations = candidateSnapshot
    ? (await repositories.listRankExplanationsForSnapshot(candidateSnapshot.snapshotId)).map((document) =>
        document.toSnapshot(),
      )
    : [];
  const decisionPlan =
    hubCase.crossSiteDecisionPlanRef !== null
      ? (await repositories.getDecisionPlan(hubCase.crossSiteDecisionPlanRef))?.toSnapshot() ?? null
      : null;
  const sourceAdmissions = candidateSnapshot
    ? (await repositories.listSourceTrustAdmissionsForSnapshot(candidateSnapshot.snapshotId)).map((document) =>
        document.toSnapshot(),
      )
    : [];
  return {
    candidateSnapshot,
    candidates,
    rankProof,
    rankExplanations,
    decisionPlan,
    sourceAdmissions,
  };
}

function queueRefForBundles(queueRef: string | undefined, bundles: readonly HubCaseBundle[]): string {
  if (queueRef) {
    return requireRef(queueRef, "queueRef");
  }
  const pcnRefs = uniqueSortedRefs(bundles.map((bundle) => bundle.hubCase.servingPcnId));
  invariant(
    pcnRefs.length === 1,
    "MIXED_QUEUE_SCOPE",
    "All hub cases in one ranking pass must belong to the same serving PCN unless queueRef is supplied explicitly.",
  );
  return `hub_queue:${pcnRefs[0]!}`;
}

function makeTimer(
  idGenerator: BackboneIdGenerator,
  rankSnapshotRef: string,
  hubCoordinationCaseId: string,
  timerType: HubQueueTimerType,
  timerState: HubQueueTimerState,
  severity: HubQueueTimerSeverity,
  dueAt: string | null,
  observedAt: string,
  governingRef: string | null,
  safeSummary: string,
  sourceRefs: readonly string[],
): HubQueueTimerSnapshot {
  return {
    hubQueueTimerId: nextId(idGenerator, `hub_queue_timer_${timerType}`),
    rankSnapshotRef,
    hubCoordinationCaseId,
    timerType,
    timerState,
    severity,
    dueAt,
    observedAt,
    settledAt: timerState === "settled" ? observedAt : null,
    governingRef,
    safeSummary,
    sourceRefs: uniqueSortedRefs(sourceRefs),
    version: 1,
  };
}

function makeTimersForCase(
  idGenerator: BackboneIdGenerator,
  evaluatedAt: string,
  rankSnapshotRef: string,
  context: QueueCaseContext,
  draft: Omit<
    QueueRankingDraft,
    | "workloadAheadMinutes"
    | "waitToStartMinutes"
    | "pClinicalBreach"
    | "pSlaBreach"
    | "pBreach"
    | "riskBand"
    | "secondaryScore"
    | "fairnessCreditBefore"
    | "fairnessCreditAfter"
    | "serviceCost"
    | "timers"
    | "bannerType"
  >,
  plan: HubQueueRankPlanConfig,
): readonly HubQueueTimerSnapshot[] {
  const timers: HubQueueTimerSnapshot[] = [];
  const { hubCase } = context.bundle;
  const request = context.bundle.networkBookingRequest;
  const candidateSnapshot = context.candidateSnapshot;
  const refreshDueAt = candidateSnapshot?.expiresAt ?? evaluatedAt;
  const refreshState: HubQueueTimerState =
    candidateSnapshot === null &&
    (hubCase.status === "candidate_searching" ||
      hubCase.status === "candidates_ready" ||
      hubCase.status === "coordinator_selecting")
      ? "overdue"
      : workingMinutesBetween(evaluatedAt, addMinutes(refreshDueAt, context.binding.candidateRefreshGraceMinutes)) <=
            0
        ? "overdue"
        : "armed";
  timers.push(
    makeTimer(
      idGenerator,
      rankSnapshotRef,
      hubCase.hubCoordinationCaseId,
      "candidate_refresh",
      refreshState,
      refreshState === "overdue" ? "warning" : "info",
      candidateSnapshot?.expiresAt ?? refreshDueAt,
      evaluatedAt,
      candidateSnapshot?.snapshotId ?? hubCase.candidateSnapshotRef,
      refreshState === "overdue" ? "Candidate evidence is stale or missing." : "Candidate evidence is current.",
      [
        candidateSnapshot?.snapshotId ?? "missing_candidate_snapshot",
        ...context.binding.sourceRefs,
      ],
    ),
  );

  const patientChoiceDueAt = context.binding.patientChoiceExpiresAt;
  if (hubCase.status === "patient_choice_pending" || hubCase.status === "alternatives_offered") {
    const patientChoiceState: HubQueueTimerState =
      patientChoiceDueAt === null
        ? "blocked_by_upstream_gap"
        : workingMinutesBetween(evaluatedAt, patientChoiceDueAt) <= 0
          ? "overdue"
          : "armed";
    timers.push(
      makeTimer(
        idGenerator,
        rankSnapshotRef,
        hubCase.hubCoordinationCaseId,
        "patient_choice_expiry",
        patientChoiceState,
        patientChoiceState === "overdue" ? "critical" : "warning",
        patientChoiceDueAt,
        evaluatedAt,
        hubCase.activeAlternativeOfferSessionRef,
        patientChoiceState === "blocked_by_upstream_gap"
          ? "Patient choice expiry is blocked until AlternativeOfferSession exposes an expiry."
          : patientChoiceState === "overdue"
            ? "Patient choice window has expired."
            : "Patient choice window is open.",
        [hubCase.activeAlternativeOfferSessionRef ?? "missing_patient_choice_session"],
      ),
    );
  }

  timers.push(
    makeTimer(
      idGenerator,
      rankSnapshotRef,
      hubCase.hubCoordinationCaseId,
      "required_window_breach",
      workingMinutesBetween(evaluatedAt, request.clinicalTimeframe.dueAt) <= 0 ? "overdue" : "armed",
      workingMinutesBetween(evaluatedAt, request.clinicalTimeframe.dueAt) <= 0 ? "critical" : "warning",
      request.clinicalTimeframe.dueAt,
      evaluatedAt,
      request.networkBookingRequestId,
      workingMinutesBetween(evaluatedAt, request.clinicalTimeframe.dueAt) <= 0
        ? "Required window has been breached."
        : "Required window timer is active.",
      [request.networkBookingRequestId],
    ),
  );

  const tooUrgentDueAt = request.clinicalTimeframe.latestSafeOfferAt ?? request.clinicalTimeframe.dueAt;
  timers.push(
    makeTimer(
      idGenerator,
      rankSnapshotRef,
      hubCase.hubCoordinationCaseId,
      "too_urgent_for_network",
      workingMinutesBetween(evaluatedAt, tooUrgentDueAt) <= 0 ? "overdue" : "armed",
      workingMinutesBetween(evaluatedAt, tooUrgentDueAt) <= 0 ? "critical" : "warning",
      tooUrgentDueAt,
      evaluatedAt,
      request.networkBookingRequestId,
      workingMinutesBetween(evaluatedAt, tooUrgentDueAt) <= 0
        ? "Case is now too urgent for normal network coordination."
        : "Case remains inside the safe network-coordination window.",
      [request.networkBookingRequestId],
    ),
  );

  if (hubCase.practiceAckGeneration > 0 || hubCase.status === "booked_pending_practice_ack") {
    const dueAt = hubCase.practiceAckDueAt;
    const overdue = dueAt !== null && workingMinutesBetween(evaluatedAt, addMinutes(dueAt, plan.practiceAckGraceMinutes)) <= 0;
    timers.push(
      makeTimer(
        idGenerator,
        rankSnapshotRef,
        hubCase.hubCoordinationCaseId,
        "practice_notification_overdue",
        dueAt === null ? "blocked_by_upstream_gap" : overdue ? "overdue" : "armed",
        overdue ? "critical" : "warning",
        dueAt,
        evaluatedAt,
        hubCase.offerToConfirmationTruthRef,
        dueAt === null
          ? "Practice acknowledgement deadline is missing."
          : overdue
            ? "Practice acknowledgement is overdue."
            : "Practice acknowledgement timer is active.",
        [hubCase.offerToConfirmationTruthRef ?? "missing_practice_ack_truth"],
      ),
    );
  }

  return timers;
}

function bannerForDraft(context: QueueCaseContext, draft: QueueRankingDraft): HubEscalationBannerType | null {
  if (draft.timers.some((timer) => timer.timerType === "too_urgent_for_network" && timer.timerState === "overdue")) {
    return "too_urgent";
  }
  if (
    context.sourceAdmissions.length > 0 &&
    context.sourceAdmissions.every((entry) => entry.sourceTrustState !== "trusted")
  ) {
    return "no_trusted_supply";
  }
  if (
    draft.timers.some(
      (timer) => timer.timerType === "practice_notification_overdue" && timer.timerState === "overdue",
    )
  ) {
    return "practice_ack_overdue";
  }
  if (
    context.candidateSnapshot !== null &&
    context.bundle.hubCase.policyTupleHash !== null &&
    context.candidateSnapshot.policyTupleHash !== context.bundle.hubCase.policyTupleHash
  ) {
    return "supplier_drift";
  }
  if (context.bundle.hubCase.ownerState === "stale_owner_recovery") {
    return "stale_owner";
  }
  if (
    context.binding.callbackTransferBlocked ||
    (context.bundle.hubCase.status === "callback_transfer_pending" &&
      workingMinutesBetween(
        context.bundle.hubCase.lastProgressAt ?? context.bundle.networkBookingRequest.requestedAt,
        draft.bundle.hubCase.updatedAt,
      ) >= 20)
  ) {
    return "callback_transfer_blocked";
  }
  return null;
}

function buildQueueChangeBatch(
  idGenerator: BackboneIdGenerator,
  queueRef: string,
  previousSnapshot: HubQueueRankSnapshot | null,
  nextSnapshot: HubQueueRankSnapshot,
  continuity: QueueContinuityBindingInput | null,
  applyPolicy: QueueChangeApplyPolicy,
  plan: HubQueueRankPlanConfig,
): QueueChangeBatchSnapshot | null {
  if (previousSnapshot === null) {
    return null;
  }
  const previousOrder = previousSnapshot.eligibleTaskRefs;
  const nextOrder = nextSnapshot.eligibleTaskRefs;
  const previousOrdinal = new Map(previousOrder.map((caseId, index) => [caseId, index + 1] as const));
  const nextOrdinal = new Map(nextOrder.map((caseId, index) => [caseId, index + 1] as const));
  const insertedRefs = nextOrder.filter((caseId) => !previousOrdinal.has(caseId));
  const updatedRefs = nextOrder.filter((caseId) => previousOrdinal.has(caseId));
  const priorityShiftRefs = updatedRefs.filter(
    (caseId) => previousOrdinal.get(caseId) !== nextOrdinal.get(caseId),
  );
  if (insertedRefs.length === 0 && priorityShiftRefs.length === 0) {
    return null;
  }
  const preservedAnchorRef = continuity?.selectedAnchorRef ?? continuity?.selectedQueueRowRef ?? null;
  const anchorStillVisible = preservedAnchorRef !== null && nextOrdinal.has(preservedAnchorRef);
  const anchorApplyState: QueueBatchAnchorApplyState =
    preservedAnchorRef === null ? "released" : anchorStillVisible ? "preserved" : "invalidated";
  return {
    batchId: nextId(idGenerator, "hub_queue_change_batch"),
    queueRef,
    sourceRankSnapshotRef: previousSnapshot.rankSnapshotId,
    targetRankSnapshotRef: nextSnapshot.rankSnapshotId,
    preservedAnchorRef,
    preservedAnchorTupleHash: continuity?.selectedAnchorTupleHashRef ?? null,
    insertedRefs,
    updatedRefs,
    priorityShiftRefs,
    rankPlanVersion: nextSnapshot.queueRankPlanRef,
    applyPolicy,
    batchImpactClass:
      anchorApplyState === "preserved" && priorityShiftRefs.length <= 2 ? "bufferable" : "review_required",
    focusProtectedRef: continuity?.focusProtectedRef ?? null,
    invalidatedAnchorRefs: anchorApplyState === "invalidated" && preservedAnchorRef ? [preservedAnchorRef] : [],
    replacementAnchorRefs: [],
    anchorApplyState,
    summaryMessage:
      anchorApplyState === "invalidated"
        ? "Queue changed and the pinned anchor could not be preserved."
        : "Queue changed and active work continuity has been buffered.",
    firstBufferedAt: nextSnapshot.generatedAt,
    flushDeadlineAt: addMinutes(nextSnapshot.generatedAt, plan.flushBufferMinutes),
    batchState: applyPolicy === "immediate_if_safe" && anchorApplyState === "preserved" ? "applied" : "available",
    createdAt: nextSnapshot.generatedAt,
    version: 1,
  };
}

function postureStateForQueue(
  overloadState: HubQueueOverloadState,
  banners: readonly HubEscalationBannerProjectionSnapshot[],
  queueChangeBatch: QueueChangeBatchSnapshot | null,
  convergenceState: HubQueueConvergenceState,
): HubPostureState {
  if (convergenceState === "failed_closed") {
    return "mutation_frozen";
  }
  if (overloadState === "overload_critical") {
    return "overload_critical";
  }
  if (queueChangeBatch?.batchImpactClass === "review_required") {
    return "mutation_frozen";
  }
  if (
    banners.some((banner) =>
      banner.bannerType === "stale_owner" ||
      banner.bannerType === "supplier_drift" ||
      banner.bannerType === "callback_transfer_blocked",
    )
  ) {
    return "recovery_only";
  }
  if (banners.length > 0) {
    return "warning";
  }
  return "nominal";
}

function bundleVersionHash(
  workbenchProjectionRef: string,
  postureProjectionRef: string,
  caseConsoleProjectionRefs: readonly string[],
  escalationBannerRefs: readonly string[],
): string {
  return sha256Hex(
    stableStringify({
      workbenchProjectionRef,
      postureProjectionRef,
      caseConsoleProjectionRefs,
      escalationBannerRefs,
    }),
  );
}

function truthInputRefsForQueue(
  inputTrustRefs: readonly string[] | undefined,
  contexts: readonly QueueCaseContext[],
): readonly string[] {
  return uniqueSortedRefs([
    ...(inputTrustRefs ?? []),
    ...contexts.flatMap((context) => context.sourceAdmissions.map((entry) => entry.sourceTrustAdmissionId)),
    ...contexts
      .map((context) => context.bundle.hubCase.policyEvaluationRef)
      .filter((value): value is string => typeof value === "string"),
  ]);
}

export function createPhase5HubQueueEngineService(input?: {
  repositories?: Phase5HubQueueEngineRepositories;
  idGenerator?: BackboneIdGenerator;
  hubCaseService?: Phase5HubCaseKernelService;
  capacityRepositories?: Phase5NetworkCapacityPipelineRepositories;
}): Phase5HubQueueEngineService {
  const repositories = input?.repositories ?? createPhase5HubQueueEngineStore();
  const idGenerator =
    input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase5-hub-queue");
  const hubCaseService = input?.hubCaseService ?? createPhase5HubCaseKernelService();
  const capacityRepositories =
    input?.capacityRepositories ?? createPhase5NetworkCapacityPipelineStore();

  return {
    repositories,
    hubCaseService,
    capacityRepositories,

    async publishHubQueueOrder(command) {
      const plan = queueRankPlanCatalog["319.hub-queue-rank-plan.v1"];
      const queueRankPlan = currentRankPlan();
      const existingPlan = await repositories.getRankPlan(queueRankPlan.queueRankPlanId);
      if (existingPlan === null) {
        await repositories.saveRankPlan(queueRankPlan, { expectedVersion: undefined });
      }
      const evaluatedAt = ensureIsoTimestamp(command.evaluatedAt, "evaluatedAt");
      const caseIds = [...new Set(command.hubCoordinationCaseIds.map((value) => requireRef(value, "hubCoordinationCaseIds")))];
      invariant(caseIds.length > 0, "EMPTY_QUEUE_INPUT", "At least one hub case id is required.");

      const caseBindingMap = new Map(
        (command.caseBindings ?? []).map((binding) => [
          requireRef(binding.hubCoordinationCaseId, "hubCoordinationCaseId"),
          normalizeCaseBinding(binding, plan),
        ] as const),
      );

      const bundles: HubCaseBundle[] = [];
      for (const caseId of caseIds) {
        const bundle = await hubCaseService.queryHubCaseBundle(caseId);
        invariant(bundle !== null, "HUB_CASE_NOT_FOUND", `Hub case ${caseId} was not found.`);
        bundles.push(bundle);
      }
      const queueRef = queueRefForBundles(command.queueRef, bundles);
      const continuity = normalizeContinuity(command.continuity);

      const contexts: QueueCaseContext[] = [];
      for (const bundle of bundles) {
        const capacityContext = await loadCapacityContext(capacityRepositories, bundle.hubCase);
        contexts.push({
          bundle,
          binding:
            caseBindingMap.get(bundle.hubCase.hubCoordinationCaseId) ??
            normalizeCaseBinding({ hubCoordinationCaseId: bundle.hubCase.hubCoordinationCaseId }, plan),
          ...capacityContext,
        });
      }

      const sourceRefs = uniqueSortedRefs([
        ...(command.sourceRefs ?? []),
        "blueprint/phase-5-the-network-horizon.md#5D",
        "blueprint/phase-0-the-foundation-protocol.md#1.11 QueueChangeBatch",
      ]);

      const drafts: QueueRankingDraft[] = contexts.map((context) => {
        const request = context.bundle.networkBookingRequest;
        const hubCase = context.bundle.hubCase;
        const fits = calculateBestFits(context.candidates);
        const accessPenalty = inferAccessPenalty(request, context.candidates, context.binding);
        const modalityGap = inferModalityGap(request, context.candidates, context.binding);
        const localFail = inferLocalFailureScore(request, context.binding);
        const awaitingPatient = inferAwaitingPatient(hubCase, context.binding) ? 1 : 0;
        const bounce = round6(
          clamp(context.binding.bounceCount, 0, plan.bounceCap) / plan.bounceCap,
        );
        const expectedService = Math.max(plan.minimumServiceMinutes, hubCase.expectedCoordinationMinutes);
        const dClinical = workingMinutesBetween(evaluatedAt, request.clinicalTimeframe.dueAt);
        const dSla = hubCase.slaTargetAt ? workingMinutesBetween(evaluatedAt, hubCase.slaTargetAt) : dClinical;
        const laxityClinical = round6(dClinical - expectedService);
        const laxitySla = round6(dSla - expectedService);
        return {
          hubCoordinationCaseId: hubCase.hubCoordinationCaseId,
          bundle: context.bundle,
          binding: context.binding,
          priorityWeight: priorityBandWeight[request.priorityBand],
          expectedService,
          dClinical,
          dSla,
          laxityClinical,
          laxitySla,
          urgencyCarry: hubCase.urgencyCarry,
          coordinationDelayMinutes: plan.coordinationDelayMinutes,
          dependencyDelayMinutes: context.binding.dependencyDelayMinutes,
          workloadAheadMinutes: 0,
          waitToStartMinutes: 0,
          pClinicalBreach: 0,
          pSlaBreach: 0,
          pBreach: 0,
          riskBand: 0,
          bestFit: fits.bestFit,
          bestTrustedFit: fits.bestTrustedFit,
          trustGap: fits.trustGap,
          degradedOnly: fits.degradedOnly,
          accessPenalty,
          modalityGap,
          localFail,
          awaitingPatient,
          bounce,
          secondaryScore: 0,
          fairnessPracticeRef: request.originPracticeOds,
          fairnessCreditBefore: 0,
          fairnessCreditAfter: 0,
          serviceCost: 1,
          dominantAction: dominantActionForCase(hubCase, context.binding),
          timers: [],
          bannerType: null,
          sourceRefs: uniqueSortedRefs([
            ...context.binding.sourceRefs,
            ...(context.candidateSnapshot?.sourceRefs ?? []),
            ...(context.decisionPlan?.sourceRefs ?? []),
            request.networkBookingRequestId,
            hubCase.hubCoordinationCaseId,
          ]),
        };
      });

      const previousSnapshots = await repositories.listRankSnapshotsForQueue(queueRef);
      const previousSnapshot =
        previousSnapshots.length > 0
          ? previousSnapshots[previousSnapshots.length - 1]!.toSnapshot()
          : null;
      const previousFairnessState = (await repositories.getFairnessState(queueRef))?.toSnapshot() ?? null;

      const seedOrder =
        previousSnapshot?.eligibleTaskRefs.filter((caseId) =>
          drafts.some((draft) => draft.hubCoordinationCaseId === caseId),
        ) ?? computeIntrinsicSeedOrder(drafts);
      const draftById = new Map(drafts.map((draft) => [draft.hubCoordinationCaseId, draft] as const));
      const intrinsicSeedDrafts = computeIntrinsicSeedOrder(drafts)
        .map((caseId) => draftById.get(caseId))
        .filter((draft): draft is QueueRankingDraft => draft !== undefined);
      let ordered = seedOrder
        .map((caseId) => draftById.get(caseId))
        .filter((draft): draft is QueueRankingDraft => draft !== undefined);
      for (const draft of drafts) {
        if (!ordered.some((entry) => entry.hubCoordinationCaseId === draft.hubCoordinationCaseId)) {
          ordered.push(draft);
        }
      }

      let previousExplanations: HubQueueRiskExplanationSnapshot[] = [];
      let finalExplanations: HubQueueRiskExplanationSnapshot[] = [];
      let convergedDrafts: readonly QueueRankingDraft[] = ordered;
      let iterationCount = 0;
      let convergenceState: HubQueueConvergenceState = "converged";
      for (let iteration = 1; iteration <= plan.maxIterations; iteration += 1) {
        iterationCount = iteration;
        const withMetrics = computeQueueMetrics(ordered, evaluatedAt, plan);
        const nextOrderedDrafts = stableSortDrafts(withMetrics);
        const explanations = nextOrderedDrafts.map((draft) => ({
          hubQueueRiskExplanationId: nextId(idGenerator, "hub_queue_risk_explanation"),
          rankSnapshotRef: "pending",
          hubCoordinationCaseId: draft.hubCoordinationCaseId,
          expectedService: draft.expectedService,
          dClinical: draft.dClinical,
          dSla: draft.dSla,
          laxityClinical: draft.laxityClinical,
          laxitySla: draft.laxitySla,
          urgencyCarry: draft.urgencyCarry,
          workloadAheadMinutes: draft.workloadAheadMinutes,
          waitToStartMinutes: draft.waitToStartMinutes,
          coordinationDelayMinutes: draft.coordinationDelayMinutes,
          dependencyDelayMinutes: draft.dependencyDelayMinutes,
          pClinicalBreach: draft.pClinicalBreach,
          pSlaBreach: draft.pSlaBreach,
          pBreach: draft.pBreach,
          riskBand: draft.riskBand,
          bestFit: draft.bestFit,
          bestTrustedFit: draft.bestTrustedFit,
          trustGap: draft.trustGap,
          degradedOnly: draft.degradedOnly,
          accessPenalty: draft.accessPenalty,
          modalityGap: draft.modalityGap,
          localFail: draft.localFail,
          awaitingPatient: draft.awaitingPatient,
          bounce: draft.bounce,
          secondaryScore: draft.secondaryScore,
          iterationIndex: iteration,
          convergenceDelta: 0,
          sourceRefs: draft.sourceRefs,
          generatedAt: evaluatedAt,
          version: 1,
        }));
        const maxDelta = compareRiskExplanationSets(previousExplanations, explanations);
        const nextOrder = nextOrderedDrafts.map((draft) => draft.hubCoordinationCaseId);
        const currentOrder = ordered.map((draft) => draft.hubCoordinationCaseId);
        finalExplanations = explanations.map((entry) => ({ ...entry, convergenceDelta: round6(maxDelta) }));
        if (compareOrder(currentOrder, nextOrder) && maxDelta <= plan.epsilonRank) {
          convergedDrafts = nextOrderedDrafts;
          break;
        }
        previousExplanations = explanations;
        ordered = nextOrder.map((caseId) => draftById.get(caseId)!).filter(Boolean);
        convergedDrafts = nextOrderedDrafts;
        if (iteration === plan.maxIterations) {
          convergenceState = "failed_closed";
          convergedDrafts = stableSortDrafts(computeQueueMetrics(intrinsicSeedDrafts, evaluatedAt, plan));
          finalExplanations = convergedDrafts.map((draft) => ({
            hubQueueRiskExplanationId: nextId(idGenerator, "hub_queue_risk_explanation_failed_closed"),
            rankSnapshotRef: "pending",
            hubCoordinationCaseId: draft.hubCoordinationCaseId,
            expectedService: draft.expectedService,
            dClinical: draft.dClinical,
            dSla: draft.dSla,
            laxityClinical: draft.laxityClinical,
            laxitySla: draft.laxitySla,
            urgencyCarry: draft.urgencyCarry,
            workloadAheadMinutes: draft.workloadAheadMinutes,
            waitToStartMinutes: draft.waitToStartMinutes,
            coordinationDelayMinutes: draft.coordinationDelayMinutes,
            dependencyDelayMinutes: draft.dependencyDelayMinutes,
            pClinicalBreach: draft.pClinicalBreach,
            pSlaBreach: draft.pSlaBreach,
            pBreach: draft.pBreach,
            riskBand: draft.riskBand,
            bestFit: draft.bestFit,
            bestTrustedFit: draft.bestTrustedFit,
            trustGap: draft.trustGap,
            degradedOnly: draft.degradedOnly,
            accessPenalty: draft.accessPenalty,
            modalityGap: draft.modalityGap,
            localFail: draft.localFail,
            awaitingPatient: draft.awaitingPatient,
            bounce: draft.bounce,
            secondaryScore: draft.secondaryScore,
            iterationIndex: iteration,
            convergenceDelta: 1,
            sourceRefs: draft.sourceRefs,
            generatedAt: evaluatedAt,
            version: 1,
          }));
          break;
        }
      }

      const fairnessMerged =
        convergenceState === "failed_closed"
          ? {
              orderedDrafts: convergedDrafts,
              fairnessStateDraft: {
                queueRef,
                overloadState: computeCriticalLoad(convergedDrafts, plan).overloadState,
                fairnessSuppressed: true,
                rhoHubCritical: computeCriticalLoad(convergedDrafts, plan).rhoHubCritical,
                criticalCaseRefs: computeCriticalLoad(convergedDrafts, plan).criticalCaseRefs,
                ledgerEntries: [],
                creditLedger: previousFairnessState?.creditLedger ?? {},
              },
            }
          : fairnessMerge(convergedDrafts, previousFairnessState, evaluatedAt, plan);
      const finalOrderedDrafts =
        convergenceState === "failed_closed"
          ? convergedDrafts
          : computeQueueMetrics(fairnessMerged.orderedDrafts, evaluatedAt, plan);
      convergedDrafts = finalOrderedDrafts;
      if (convergenceState !== "failed_closed") {
        finalExplanations = finalOrderedDrafts.map((draft) => ({
          hubQueueRiskExplanationId: nextId(idGenerator, "hub_queue_risk_explanation_final"),
          rankSnapshotRef: "pending",
          hubCoordinationCaseId: draft.hubCoordinationCaseId,
          expectedService: draft.expectedService,
          dClinical: draft.dClinical,
          dSla: draft.dSla,
          laxityClinical: draft.laxityClinical,
          laxitySla: draft.laxitySla,
          urgencyCarry: draft.urgencyCarry,
          workloadAheadMinutes: draft.workloadAheadMinutes,
          waitToStartMinutes: draft.waitToStartMinutes,
          coordinationDelayMinutes: draft.coordinationDelayMinutes,
          dependencyDelayMinutes: draft.dependencyDelayMinutes,
          pClinicalBreach: draft.pClinicalBreach,
          pSlaBreach: draft.pSlaBreach,
          pBreach: draft.pBreach,
          riskBand: draft.riskBand,
          bestFit: draft.bestFit,
          bestTrustedFit: draft.bestTrustedFit,
          trustGap: draft.trustGap,
          degradedOnly: draft.degradedOnly,
          accessPenalty: draft.accessPenalty,
          modalityGap: draft.modalityGap,
          localFail: draft.localFail,
          awaitingPatient: draft.awaitingPatient,
          bounce: draft.bounce,
          secondaryScore: draft.secondaryScore,
          iterationIndex: iterationCount,
          convergenceDelta: 0,
          sourceRefs: draft.sourceRefs,
          generatedAt: evaluatedAt,
          version: 1,
        }));
      }

      const criticalLoad = computeCriticalLoad(convergedDrafts, plan);
      const rankSnapshotId = nextId(idGenerator, "hub_queue_rank_snapshot");
      const eligibleDrafts = convergedDrafts.filter(
        (draft) => eligibilityForCase(draft.bundle.hubCase) === "eligible",
      );
      const excludedTaskRefs = convergedDrafts
        .filter((draft) => eligibilityForCase(draft.bundle.hubCase) !== "eligible")
        .map((draft) => draft.hubCoordinationCaseId);
      const rowOrderHash = sha256Hex(stableStringify(eligibleDrafts.map((draft) => draft.hubCoordinationCaseId)));
      const fairnessState = (() => {
        return {
          fairnessCycleStateId: nextId(idGenerator, "hub_queue_fairness_cycle"),
          queueRef,
          rankSnapshotRef: rankSnapshotId,
          overloadState: criticalLoad.overloadState,
          fairnessSuppressed: fairnessMerged.fairnessStateDraft.fairnessSuppressed,
          rhoHubCritical: criticalLoad.rhoHubCritical,
          criticalCaseRefs: criticalLoad.criticalCaseRefs,
          ledgerEntries: fairnessMerged.fairnessStateDraft.ledgerEntries,
          creditLedger: fairnessMerged.fairnessStateDraft.creditLedger,
          generatedAt: evaluatedAt,
          version: previousFairnessState ? previousFairnessState.version + 1 : 1,
        } satisfies HubFairnessCycleStateSnapshot;
      })();
      await repositories.saveFairnessState(fairnessState, {
        expectedVersion: previousFairnessState?.version,
      });

      const rankSnapshot: HubQueueRankSnapshot = {
        rankSnapshotId,
        queueRef,
        queueRankPlanRef: queueRankPlan.queueRankPlanId,
        asOfAt: evaluatedAt,
        sourceFactCutRef: optionalRef(command.sourceFactCutRef) ?? `fact_cut:${evaluatedAt}`,
        trustInputRefs: truthInputRefsForQueue(command.trustInputRefs, contexts),
        eligibleTaskRefs: eligibleDrafts.map((draft) => draft.hubCoordinationCaseId),
        excludedTaskRefs,
        overloadState: fairnessState.overloadState,
        fairnessCycleStateRef: fairnessState.fairnessCycleStateId,
        rowOrderHash,
        convergenceState,
        iterationCount,
        sourceRefs,
        generatedAt: evaluatedAt,
        version: previousSnapshot ? previousSnapshot.version + 1 : 1,
      };
      await repositories.saveRankSnapshot(rankSnapshot);

      const explanationsByCaseId = new Map<string, HubQueueRiskExplanationSnapshot>();
      for (const explanation of finalExplanations) {
        const persisted = { ...explanation, rankSnapshotRef: rankSnapshotId };
        explanationsByCaseId.set(persisted.hubCoordinationCaseId, persisted);
        await repositories.saveRiskExplanation(persisted);
      }

      const draftsWithTimersAndBanners: QueueRankingDraft[] = [];
      const contextsByCaseId = new Map(
        contexts.map((context) => [context.bundle.hubCase.hubCoordinationCaseId, context] as const),
      );
      for (const draft of convergedDrafts) {
        const context = contextsByCaseId.get(draft.hubCoordinationCaseId)!;
        const interimDraft = { ...draft };
        interimDraft.timers = makeTimersForCase(idGenerator, evaluatedAt, rankSnapshotId, context, draft, plan);
        interimDraft.bannerType = bannerForDraft(context, interimDraft);
        draftsWithTimersAndBanners.push(interimDraft);
        for (const timer of interimDraft.timers) {
          await repositories.saveTimer(timer);
        }
      }

      const rankEntries: HubQueueRankEntrySnapshot[] = [];
      for (const [index, draft] of draftsWithTimersAndBanners.entries()) {
        if (eligibilityForCase(draft.bundle.hubCase) !== "eligible") {
          continue;
        }
        const explanation = explanationsByCaseId.get(draft.hubCoordinationCaseId)!;
        const rankEntry: HubQueueRankEntrySnapshot = {
          rankEntryId: nextId(idGenerator, "hub_queue_rank_entry"),
          rankSnapshotRef: rankSnapshotId,
          taskRef: draft.hubCoordinationCaseId,
          ordinal: index + 1,
          eligibilityState: "eligible",
          lexicographicTier: `risk_band_${draft.riskBand}`,
          urgencyScore: draft.pBreach,
          residualBand: draft.riskBand,
          contactRiskBand: draft.riskBand,
          duplicateReviewFlag: false,
          urgencyCarry: draft.urgencyCarry,
          fairnessBandRef: draft.fairnessPracticeRef,
          fairnessCreditBefore: draft.fairnessCreditBefore,
          fairnessCreditAfter: draft.fairnessCreditAfter,
          canonicalTieBreakKey: sha256Hex(
            stableStringify([
              draft.riskBand,
              draft.urgencyCarry,
              draft.pBreach,
              draft.priorityWeight,
              draft.secondaryScore,
              draft.bundle.hubCase.queueEnteredAt ?? draft.bundle.networkBookingRequest.requestedAt,
              draft.hubCoordinationCaseId,
            ]),
          ),
          explanationPayloadRef: explanation.hubQueueRiskExplanationId,
          generatedAt: evaluatedAt,
          version: 1,
        };
        rankEntries.push(rankEntry);
        await repositories.saveRankEntry(rankEntry);
      }

      const queueChangeBatch = buildQueueChangeBatch(
        idGenerator,
        queueRef,
        previousSnapshot,
        rankSnapshot,
        continuity,
        command.applyPolicy ?? "immediate_if_safe",
        plan,
      );
      if (queueChangeBatch) {
        await repositories.saveQueueChangeBatch(queueChangeBatch);
      }

      const banners: HubEscalationBannerProjectionSnapshot[] = [];
      for (const draft of draftsWithTimersAndBanners) {
        if (!draft.bannerType) {
          continue;
        }
        const banner: HubEscalationBannerProjectionSnapshot = {
          hubEscalationBannerProjectionId: nextId(idGenerator, "hub_escalation_banner"),
          queueRef,
          rankSnapshotRef: rankSnapshotId,
          hubCoordinationCaseId: draft.hubCoordinationCaseId,
          bannerType: draft.bannerType,
          dominantAction: draft.dominantAction,
          safeSummary:
            draft.bannerType === "too_urgent"
              ? "Case has crossed the safe network-coordination threshold."
              : draft.bannerType === "no_trusted_supply"
                ? "No trusted capacity remains for this case."
                : draft.bannerType === "practice_ack_overdue"
                  ? "Practice acknowledgement is overdue."
                  : draft.bannerType === "supplier_drift"
                    ? "Candidate or policy evidence has drifted."
                    : draft.bannerType === "stale_owner"
                      ? "Ownership is stale and recovery is required."
                      : "Callback transfer is blocked.",
          blockerRefs: uniqueSortedRefs([
            ...draft.binding.blockerStubRefs,
            ...draft.timers
              .filter((timer) => timer.timerState === "overdue" || timer.timerState === "blocked_by_upstream_gap")
              .map((timer) => timer.hubQueueTimerId),
          ]),
          sourceRefs: draft.sourceRefs,
          generatedAt: evaluatedAt,
          version: 1,
        };
        banners.push(banner);
        await repositories.saveEscalationBanner(banner);
      }

      const bannersByCaseId = new Map(
        banners
          .filter((banner) => banner.hubCoordinationCaseId !== null)
          .map((banner) => [banner.hubCoordinationCaseId!, banner] as const),
      );

      const optionCardProjections: HubOptionCardProjectionSnapshot[] = [];
      const caseConsoleProjections: HubCaseConsoleProjectionSnapshot[] = [];
      for (const draft of draftsWithTimersAndBanners) {
        const context = contextsByCaseId.get(draft.hubCoordinationCaseId)!;
        const optionCardRefs: string[] = [];
        for (const candidate of context.candidates) {
          const explanation =
            context.rankExplanations.find(
              (entry) => entry.capacityRankExplanationId === candidate.capacityRankExplanationRef,
            ) ?? null;
          const reservation =
            context.binding.reservationBindings.find((entry) => entry.candidateRef === candidate.candidateId) ??
            null;
          const optionCard: HubOptionCardProjectionSnapshot = {
            hubOptionCardProjectionId: nextId(idGenerator, "hub_option_card_projection"),
            rankSnapshotRef: rankSnapshotId,
            hubCoordinationCaseId: draft.hubCoordinationCaseId,
            candidateRef: candidate.candidateId,
            decisionPlanRef: context.decisionPlan?.decisionPlanId ?? null,
            networkCandidateSnapshotRef: context.candidateSnapshot?.snapshotId ?? null,
            policyEvaluationRef: context.bundle.hubCase.policyEvaluationRef,
            capacityRankProofRef: context.rankProof?.capacityRankProofId ?? null,
            capacityRankExplanationRef: explanation?.capacityRankExplanationId ?? null,
            reservationRef: reservation?.reservationRef ?? null,
            reservationState: reservation?.reservationState ?? "none",
            sourceTrustState: candidate.sourceTrustState,
            offerabilityState: candidate.offerabilityState,
            approvedVarianceVisible: candidate.windowClass === 1,
            truthfulHoldState:
              reservation?.reservationState === "held"
                ? "held"
                : reservation?.reservationState === "confirmed"
                  ? "confirmed"
                  : reservation?.reservationState === "requested"
                    ? "soft_hold"
                    : "none",
            rankReasonRefs: uniqueSortedRefs([
              explanation?.capacityRankExplanationId ?? "",
              candidate.capacityRankExplanationRef,
            ]),
            patientReasonCueRefs: [...candidate.patientReasonCueRefs],
            blockedByPolicyReasonRefs: [...candidate.blockedByPolicyReasonRefs],
            sourceRefs: uniqueSortedRefs([
              ...candidate.sourceRefs,
              ...(reservation?.sourceRefs ?? []),
              context.rankProof?.capacityRankProofId ?? "",
              context.decisionPlan?.decisionPlanId ?? "",
            ]),
            generatedAt: evaluatedAt,
            version: 1,
          };
          optionCardProjections.push(optionCard);
          optionCardRefs.push(optionCard.hubOptionCardProjectionId);
          await repositories.saveOptionCardProjection(optionCard);
        }

        const caseConsoleProjection: HubCaseConsoleProjectionSnapshot = {
          hubCaseConsoleProjectionId: nextId(idGenerator, "hub_case_console_projection"),
          rankSnapshotRef: rankSnapshotId,
          hubCoordinationCaseId: draft.hubCoordinationCaseId,
          networkBookingRequestId: draft.bundle.networkBookingRequest.networkBookingRequestId,
          queueOrdinal:
            rankEntries.find((entry) => entry.taskRef === draft.hubCoordinationCaseId)?.ordinal ?? null,
          dominantAction: draft.dominantAction,
          blockerStubRefs: uniqueSortedRefs([
            ...draft.binding.blockerStubRefs,
            ...draft.timers
              .filter((timer) => timer.timerState === "overdue" || timer.timerState === "blocked_by_upstream_gap")
              .map((timer) => timer.hubQueueTimerId),
          ]),
          timerRefs: draft.timers.map((timer) => timer.hubQueueTimerId),
          optionCardRefs,
          escalationBannerRef: bannersByCaseId.get(draft.hubCoordinationCaseId)?.hubEscalationBannerProjectionId ?? null,
          selectedOptionCardRef: draft.binding.selectedOptionCardRef,
          selectedAnchorRef: draft.binding.selectedAnchorRef,
          selectedAnchorTupleHashRef: draft.binding.selectedAnchorTupleHashRef,
          continuityState:
            continuity?.selectedAnchorRef === draft.hubCoordinationCaseId &&
            rankEntries.some((entry) => entry.taskRef === draft.hubCoordinationCaseId)
              ? "preserved"
              : draft.binding.selectedAnchorRef
                ? "invalidated"
                : "released",
          sourceRefs: draft.sourceRefs,
          generatedAt: evaluatedAt,
          version: 1,
        };
        caseConsoleProjections.push(caseConsoleProjection);
        await repositories.saveCaseConsoleProjection(caseConsoleProjection);
      }

      const postureProjection: HubPostureProjectionSnapshot = {
        hubPostureProjectionId: nextId(idGenerator, "hub_posture_projection"),
        queueRef,
        rankSnapshotRef: rankSnapshotId,
        postureState: postureStateForQueue(
          rankSnapshot.overloadState,
          banners,
          queueChangeBatch,
          rankSnapshot.convergenceState,
        ),
        overloadState: rankSnapshot.overloadState,
        caseCount: rankEntries.length,
        criticalCaseCount: draftsWithTimersAndBanners.filter((draft) => draft.riskBand === 3).length,
        warningCaseCount: draftsWithTimersAndBanners.filter((draft) => draft.riskBand >= 1).length,
        noTrustedSupplyCount: banners.filter((banner) => banner.bannerType === "no_trusted_supply").length,
        staleOwnerCount: banners.filter((banner) => banner.bannerType === "stale_owner").length,
        practiceAckOverdueCount: banners.filter((banner) => banner.bannerType === "practice_ack_overdue").length,
        callbackBlockedCount: banners.filter((banner) => banner.bannerType === "callback_transfer_blocked").length,
        sourceRefs,
        generatedAt: evaluatedAt,
        version: 1,
      };
      await repositories.savePostureProjection(postureProjection);

      const visibleRowRefs = rankEntries.map((entry) => entry.taskRef);
      const workbenchProjection: HubQueueWorkbenchProjectionSnapshot = {
        hubQueueWorkbenchProjectionId: nextId(idGenerator, "hub_queue_workbench_projection"),
        queueRef,
        rankSnapshotRef: rankSnapshotId,
        activeQueueChangeBatchRef: queueChangeBatch?.batchId ?? null,
        visibleRowRefs,
        rows: draftsWithTimersAndBanners
          .filter((draft) => eligibilityForCase(draft.bundle.hubCase) === "eligible")
          .map((draft, index) => ({
            hubCoordinationCaseId: draft.hubCoordinationCaseId,
            ordinal: index + 1,
            riskBand: draft.riskBand,
            breachProbability: draft.pBreach,
            priorityBand: draft.bundle.networkBookingRequest.priorityBand,
            status: draft.bundle.hubCase.status,
            dominantAction: draft.dominantAction,
            bannerRef: bannersByCaseId.get(draft.hubCoordinationCaseId)?.hubEscalationBannerProjectionId ?? null,
            timerRefs: draft.timers.map((timer) => timer.hubQueueTimerId),
          })),
        selectedQueueRowRef: continuity?.selectedQueueRowRef ?? null,
        selectedOptionCardRef: continuity?.selectedOptionCardRef ?? null,
        selectedAnchorRef: continuity?.selectedAnchorRef ?? null,
        selectedAnchorTupleHashRef: continuity?.selectedAnchorTupleHashRef ?? null,
        dominantActionRef: continuity?.dominantActionRef ?? null,
        blockerStubRefs: uniqueSortedRefs(continuity?.blockerStubRefs ?? []),
        continuityState:
          queueChangeBatch?.anchorApplyState === "preserved"
            ? "preserved"
            : queueChangeBatch?.anchorApplyState === "invalidated"
              ? "invalidated"
              : queueChangeBatch?.anchorApplyState === "replaced"
                ? "replaced"
                : "released",
        sourceRefs,
        generatedAt: evaluatedAt,
        version: previousSnapshot ? previousSnapshot.version + 1 : 1,
      };
      await repositories.saveWorkbenchProjection(workbenchProjection);

      const consistencyProjection: HubConsoleConsistencyProjectionSnapshot = {
        hubConsoleConsistencyProjectionId: nextId(idGenerator, "hub_console_consistency_projection"),
        queueRef,
        rankSnapshotRef: rankSnapshotId,
        workbenchProjectionRef: workbenchProjection.hubQueueWorkbenchProjectionId,
        caseConsoleProjectionRefs: caseConsoleProjections.map((projection) => projection.hubCaseConsoleProjectionId),
        optionCardProjectionRefs: optionCardProjections.map((projection) => projection.hubOptionCardProjectionId),
        postureProjectionRef: postureProjection.hubPostureProjectionId,
        escalationBannerRefs: banners.map((banner) => banner.hubEscalationBannerProjectionId),
        selectedAnchorRef: continuity?.selectedAnchorRef ?? null,
        selectedAnchorTupleHashRef: continuity?.selectedAnchorTupleHashRef ?? null,
        activeQueueChangeBatchRef: queueChangeBatch?.batchId ?? null,
        bundleVersionHash: bundleVersionHash(
          workbenchProjection.hubQueueWorkbenchProjectionId,
          postureProjection.hubPostureProjectionId,
          caseConsoleProjections.map((projection) => projection.hubCaseConsoleProjectionId),
          banners.map((banner) => banner.hubEscalationBannerProjectionId),
        ),
        freezeControls:
          rankSnapshot.convergenceState === "failed_closed" ||
          postureProjection.postureState === "mutation_frozen" ||
          postureProjection.postureState === "recovery_only" ||
          rankSnapshot.overloadState === "overload_critical",
        generatedAt: evaluatedAt,
        version: previousSnapshot ? previousSnapshot.version + 1 : 1,
      };
      await repositories.saveConsistencyProjection(consistencyProjection);

      const replayFixture: HubQueueReplayFixtureSnapshot = {
        hubQueueReplayFixtureId: nextId(idGenerator, "hub_queue_replay_fixture"),
        rankSnapshotRef: rankSnapshotId,
        queueRef,
        hubCoordinationCaseIds: caseIds,
        evaluatedAt,
        continuity,
        caseBindings: contexts.map((context) => ({
          hubCoordinationCaseId: context.binding.hubCoordinationCaseId,
          patientChoiceExpiresAt: context.binding.patientChoiceExpiresAt,
          bounceCount: context.binding.bounceCount,
          dependencyDelayMinutes: context.binding.dependencyDelayMinutes,
          localFailureScore: context.binding.localFailureScore,
          accessPenalty: context.binding.accessPenalty,
          modalityGap: context.binding.modalityGap,
          awaitingPatient: context.binding.awaitingPatient,
          callbackTransferBlocked: context.binding.callbackTransferBlocked,
          candidateRefreshGraceMinutes: context.binding.candidateRefreshGraceMinutes,
          currentDominantAction: context.binding.currentDominantAction,
          blockerStubRefs: context.binding.blockerStubRefs,
          reservationBindings: context.binding.reservationBindings,
          selectedAnchorRef: context.binding.selectedAnchorRef,
          selectedAnchorTupleHashRef: context.binding.selectedAnchorTupleHashRef,
          selectedOptionCardRef: context.binding.selectedOptionCardRef,
          sourceRefs: context.binding.sourceRefs,
        })),
        sourceRefs,
        version: 1,
      };
      await repositories.saveReplayFixture(replayFixture);

      return {
        queueRankPlan,
        fairnessState,
        rankSnapshot,
        rankEntries,
        riskExplanations: [...explanationsByCaseId.values()],
        timers: draftsWithTimersAndBanners.flatMap((draft) => draft.timers),
        queueChangeBatch,
        workbenchProjection,
        consistencyProjection,
        caseConsoleProjections,
        optionCardProjections,
        postureProjection,
        escalationBanners: banners,
        replayFixture,
      };
    },

    async replayHubQueueOrder(command) {
      const rankSnapshotId = requireRef(command.rankSnapshotId, "rankSnapshotId");
      const originalSnapshot = (await repositories.getRankSnapshot(rankSnapshotId))?.toSnapshot() ?? null;
      const replayFixture = (await repositories.getReplayFixtureForSnapshot(rankSnapshotId))?.toSnapshot() ?? null;
      invariant(
        replayFixture !== null,
        "QUEUE_REPLAY_FIXTURE_NOT_FOUND",
        `No replay fixture was found for rank snapshot ${rankSnapshotId}.`,
      );
      const replay = await this.publishHubQueueOrder({
        queueRef: replayFixture.queueRef,
        hubCoordinationCaseIds: replayFixture.hubCoordinationCaseIds,
        evaluatedAt: replayFixture.evaluatedAt,
        continuity: replayFixture.continuity,
        caseBindings: replayFixture.caseBindings,
        sourceRefs: replayFixture.sourceRefs,
      });
      const mismatchFields = compareQueueSnapshots(originalSnapshot, replay.rankSnapshot);
      return {
        ...replay,
        matchesStoredSnapshot: mismatchFields.length === 0,
        mismatchFields,
        originalSnapshot,
      };
    },
  };
}
