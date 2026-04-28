import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import type {
  AlternativeOfferEntrySnapshot,
  AlternativeOfferFallbackCardSnapshot,
  AlternativeOfferSessionSnapshot,
  HubOfferToConfirmationTruthProjectionSnapshot,
  OfferMutationFenceInput,
  Phase5AlternativeOfferEngineRepositories,
  RequestCallbackFromAlternativeOfferInput,
  RequestCallbackFromAlternativeOfferResult,
} from "./phase5-alternative-offer-engine";
import type {
  HubCaseBundle,
  HubCaseTransitionResult,
  HubCoordinationCaseSnapshot,
  NetworkBookingPriorityBand,
  Phase5HubCaseKernelService,
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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256Hex(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
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

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function minutesUntil(deadlineAt: string, recordedAt: string): number {
  return Math.max(0, Math.floor((Date.parse(deadlineAt) - Date.parse(recordedAt)) / 60_000));
}

function priorityBandOrdinal(priorityBand: NetworkBookingPriorityBand): number {
  switch (priorityBand) {
    case "urgent":
      return 2;
    case "priority":
      return 1;
    default:
      return 0;
  }
}

const DEFAULT_SOURCE_REFS = [
  "blueprint/phase-0-the-foundation-protocol.md#Canonical request model",
  "blueprint/phase-4-the-booking-engine.md#WaitlistDeadlineEvaluation",
  "blueprint/phase-4-the-booking-engine.md#WaitlistFallbackObligation",
  "blueprint/phase-4-the-booking-engine.md#WaitlistContinuationTruthProjection",
  "blueprint/phase-5-the-network-horizon.md#5G. No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
  "blueprint/callback-and-clinician-messaging-loop.md#Callback domain / CallbackExpectationEnvelope",
  "blueprint/phase-cards.md#Card-6",
] as const;

export const hubFallbackTypes = [
  "callback_request",
  "policy_callback",
  "return_to_practice",
  "urgent_return_to_practice",
] as const;
export type HubFallbackType = (typeof hubFallbackTypes)[number];

export const hubFallbackStates = [
  "pending_link",
  "transferred",
  "completed",
  "supervisor_review_required",
  "aborted",
] as const;
export type HubFallbackState = (typeof hubFallbackStates)[number];

export const callbackFallbackStates = [
  "pending_link",
  "linked",
  "offered",
  "completed",
  "aborted",
] as const;
export type CallbackFallbackState = (typeof callbackFallbackStates)[number];

export const returnToPracticeStates = [
  "pending_link",
  "linked",
  "supervisor_review_required",
  "completed",
  "aborted",
] as const;
export type HubReturnToPracticeState = (typeof returnToPracticeStates)[number];

export const hubFallbackLoopEscalationStates = [
  "required",
  "acknowledged",
  "resolved",
] as const;
export type HubFallbackLoopEscalationState =
  (typeof hubFallbackLoopEscalationStates)[number];

export const hubCoordinationExceptionClasses = [
  "callback_link_missing",
  "return_link_missing",
  "loop_prevention",
  "stale_offer_provenance",
  "illegal_fallback_route",
  "reconciliation_stalled",
  "imported_confirmation_disputed",
  "supplier_drift_detected",
  "callback_transfer_blocked",
  "practice_acknowledgement_overdue",
  "stale_owner_or_stale_lease",
  "backfill_ambiguity_supervision",
] as const;
export type HubCoordinationExceptionClass = (typeof hubCoordinationExceptionClasses)[number];

export const hubCoordinationExceptionStates = ["open", "resolved"] as const;
export type HubCoordinationExceptionState = (typeof hubCoordinationExceptionStates)[number];

export const hubCoordinationExceptionRetryStates = [
  "not_applicable",
  "waiting_manual",
  "retryable",
  "closed",
] as const;
export type HubCoordinationExceptionRetryState =
  (typeof hubCoordinationExceptionRetryStates)[number];

export const hubCoordinationExceptionEscalationStates = [
  "none",
  "supervisor_review_required",
  "supervisor_reviewed",
  "closed",
] as const;
export type HubCoordinationExceptionEscalationState =
  (typeof hubCoordinationExceptionEscalationStates)[number];

export interface Phase4WaitlistCarryForwardSnapshot {
  waitlistDeadlineEvaluationRef: string;
  waitlistFallbackObligationRef: string;
  waitlistContinuationTruthProjectionRef: string;
  requiredFallbackRoute: "callback" | "hub" | "booking_failed";
  triggerClass: string;
  patientVisibleState: string;
  windowRiskState: string;
  boundAt: string;
}

export interface HubFallbackRecordSnapshot {
  hubFallbackRecordId: string;
  hubCoordinationCaseId: string;
  fallbackType: HubFallbackType;
  fallbackState: HubFallbackState;
  fallbackReasonCode: string;
  sourceOfferSessionRef: string | null;
  sourceFallbackCardRef: string | null;
  callbackFallbackRef: string | null;
  returnToPracticeRef: string | null;
  activeExceptionRef: string | null;
  offerLeadMinutes: number | null;
  callbackLeadMinutes: number | null;
  remainingClinicalWindowMinutes: number;
  urgencyCarryFloor: number;
  bounceCount: number;
  noveltyScore: number;
  waitlistDeadlineEvaluationRef: string | null;
  waitlistFallbackObligationRef: string | null;
  waitlistContinuationTruthProjectionRef: string | null;
  waitlistRequiredFallbackRoute: string | null;
  waitlistWindowRiskState: string | null;
  carryForwardBoundAt: string | null;
  truthProjectionRef: string | null;
  truthTupleHash: string;
  stateConfidenceBand: "high" | "medium" | "low";
  transferredAt: string | null;
  completedAt: string | null;
  recordedAt: string;
  updatedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface CallbackFallbackRecordSnapshot {
  callbackFallbackRecordId: string;
  hubFallbackRecordRef: string;
  hubCoordinationCaseId: string;
  callbackState: CallbackFallbackState;
  callbackLeadMinutes: number;
  sourceOfferSessionRef: string | null;
  sourceFallbackCardRef: string | null;
  callbackCaseRef: string | null;
  callbackExpectationEnvelopeRef: string | null;
  linkedAt: string | null;
  offeredAt: string | null;
  completedAt: string | null;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubReturnToPracticeRecordSnapshot {
  hubReturnToPracticeRecordId: string;
  hubFallbackRecordRef: string;
  hubCoordinationCaseId: string;
  returnState: HubReturnToPracticeState;
  returnReasonCode: string;
  targetPracticeOds: string;
  urgencyCarryFloor: number;
  pBreach: number;
  trustGap: number;
  bestTrustedFit: number;
  bounceCount: number;
  noveltyScore: number;
  reopenedWorkflowRef: string | null;
  reopenedLineageCaseLinkRef: string | null;
  reopenedLeaseRef: string | null;
  reopenLifecycleState: "pending" | "linked" | "blocked";
  linkedAt: string | null;
  completedAt: string | null;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubFallbackCycleCounterSnapshot {
  hubFallbackCycleCounterId: string;
  hubCoordinationCaseId: string;
  bounceCount: number;
  previousBestTrustedFit: number;
  previousPriorityBand: NetworkBookingPriorityBand;
  latestNoveltyScore: number;
  lastReturnedAt: string | null;
  updatedAt: string;
  version: number;
}

export interface HubFallbackSupervisorEscalationSnapshot {
  hubFallbackSupervisorEscalationId: string;
  hubCoordinationCaseId: string;
  hubFallbackRecordRef: string;
  exceptionRef: string;
  escalationState: HubFallbackLoopEscalationState;
  triggerCode: string;
  bounceCount: number;
  noveltyScore: number;
  noveltyThreshold: number;
  bounceThreshold: number;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubCoordinationExceptionSnapshot {
  exceptionId: string;
  hubCoordinationCaseId: string;
  hubFallbackRecordRef: string | null;
  activeChildRef: string | null;
  exceptionClass: HubCoordinationExceptionClass;
  exceptionState: HubCoordinationExceptionState;
  retryState: HubCoordinationExceptionRetryState;
  escalationState: HubCoordinationExceptionEscalationState;
  reasonCode: string;
  truthProjectionRef: string | null;
  truthTupleHash: string;
  details: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
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

export interface Phase5HubFallbackRepositories {
  getFallbackRecord(
    hubFallbackRecordId: string,
  ): Promise<SnapshotDocument<HubFallbackRecordSnapshot> | null>;
  getCurrentFallbackForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<HubFallbackRecordSnapshot> | null>;
  listFallbackRecordsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<HubFallbackRecordSnapshot>[]>;
  saveFallbackRecord(
    snapshot: HubFallbackRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCallbackFallbackRecord(
    callbackFallbackRecordId: string,
  ): Promise<SnapshotDocument<CallbackFallbackRecordSnapshot> | null>;
  getCurrentCallbackFallbackForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<CallbackFallbackRecordSnapshot> | null>;
  saveCallbackFallbackRecord(
    snapshot: CallbackFallbackRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReturnToPracticeRecord(
    hubReturnToPracticeRecordId: string,
  ): Promise<SnapshotDocument<HubReturnToPracticeRecordSnapshot> | null>;
  getCurrentReturnToPracticeRecordForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<HubReturnToPracticeRecordSnapshot> | null>;
  saveReturnToPracticeRecord(
    snapshot: HubReturnToPracticeRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCycleCounterForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<HubFallbackCycleCounterSnapshot> | null>;
  saveCycleCounter(
    snapshot: HubFallbackCycleCounterSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getSupervisorEscalation(
    hubFallbackSupervisorEscalationId: string,
  ): Promise<SnapshotDocument<HubFallbackSupervisorEscalationSnapshot> | null>;
  listSupervisorEscalationsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<HubFallbackSupervisorEscalationSnapshot>[]>;
  saveSupervisorEscalation(
    snapshot: HubFallbackSupervisorEscalationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getHubCoordinationException(
    exceptionId: string,
  ): Promise<SnapshotDocument<HubCoordinationExceptionSnapshot> | null>;
  listHubCoordinationExceptionsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<HubCoordinationExceptionSnapshot>[]>;
  saveHubCoordinationException(
    snapshot: HubCoordinationExceptionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export class Phase5HubFallbackStore implements Phase5HubFallbackRepositories {
  private readonly fallbackRecords = new Map<string, HubFallbackRecordSnapshot>();
  private readonly caseFallbackRecords = new Map<string, string[]>();
  private readonly caseCurrentFallback = new Map<string, string>();
  private readonly callbackFallbackRecords = new Map<string, CallbackFallbackRecordSnapshot>();
  private readonly caseCurrentCallbackFallback = new Map<string, string>();
  private readonly returnToPracticeRecords = new Map<string, HubReturnToPracticeRecordSnapshot>();
  private readonly caseCurrentReturnToPractice = new Map<string, string>();
  private readonly cycleCounters = new Map<string, HubFallbackCycleCounterSnapshot>();
  private readonly supervisorEscalations = new Map<string, HubFallbackSupervisorEscalationSnapshot>();
  private readonly caseSupervisorEscalations = new Map<string, string[]>();
  private readonly exceptions = new Map<string, HubCoordinationExceptionSnapshot>();
  private readonly caseExceptions = new Map<string, string[]>();

  async getFallbackRecord(hubFallbackRecordId: string) {
    const row = this.fallbackRecords.get(hubFallbackRecordId);
    return row ? new StoredDocument(row) : null;
  }

  async getCurrentFallbackForCase(hubCoordinationCaseId: string) {
    const current = this.caseCurrentFallback.get(hubCoordinationCaseId);
    return current ? this.getFallbackRecord(current) : null;
  }

  async listFallbackRecordsForCase(hubCoordinationCaseId: string) {
    return (this.caseFallbackRecords.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.fallbackRecords.get(id))
      .filter((row): row is HubFallbackRecordSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => new StoredDocument(row));
  }

  async saveFallbackRecord(
    snapshot: HubFallbackRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.fallbackRecords, snapshot.hubFallbackRecordId, snapshot, options);
    const current = this.caseFallbackRecords.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.hubFallbackRecordId)) {
      this.caseFallbackRecords.set(snapshot.hubCoordinationCaseId, [
        ...current,
        snapshot.hubFallbackRecordId,
      ]);
    }
    this.caseCurrentFallback.set(snapshot.hubCoordinationCaseId, snapshot.hubFallbackRecordId);
  }

  async getCallbackFallbackRecord(callbackFallbackRecordId: string) {
    const row = this.callbackFallbackRecords.get(callbackFallbackRecordId);
    return row ? new StoredDocument(row) : null;
  }

  async getCurrentCallbackFallbackForCase(hubCoordinationCaseId: string) {
    const current = this.caseCurrentCallbackFallback.get(hubCoordinationCaseId);
    return current ? this.getCallbackFallbackRecord(current) : null;
  }

  async saveCallbackFallbackRecord(
    snapshot: CallbackFallbackRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.callbackFallbackRecords,
      snapshot.callbackFallbackRecordId,
      snapshot,
      options,
    );
    this.caseCurrentCallbackFallback.set(
      snapshot.hubCoordinationCaseId,
      snapshot.callbackFallbackRecordId,
    );
  }

  async getReturnToPracticeRecord(hubReturnToPracticeRecordId: string) {
    const row = this.returnToPracticeRecords.get(hubReturnToPracticeRecordId);
    return row ? new StoredDocument(row) : null;
  }

  async getCurrentReturnToPracticeRecordForCase(hubCoordinationCaseId: string) {
    const current = this.caseCurrentReturnToPractice.get(hubCoordinationCaseId);
    return current ? this.getReturnToPracticeRecord(current) : null;
  }

  async saveReturnToPracticeRecord(
    snapshot: HubReturnToPracticeRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.returnToPracticeRecords,
      snapshot.hubReturnToPracticeRecordId,
      snapshot,
      options,
    );
    this.caseCurrentReturnToPractice.set(
      snapshot.hubCoordinationCaseId,
      snapshot.hubReturnToPracticeRecordId,
    );
  }

  async getCycleCounterForCase(hubCoordinationCaseId: string) {
    const row = this.cycleCounters.get(hubCoordinationCaseId);
    return row ? new StoredDocument(row) : null;
  }

  async saveCycleCounter(
    snapshot: HubFallbackCycleCounterSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.cycleCounters, snapshot.hubCoordinationCaseId, snapshot, options);
  }

  async getSupervisorEscalation(hubFallbackSupervisorEscalationId: string) {
    const row = this.supervisorEscalations.get(hubFallbackSupervisorEscalationId);
    return row ? new StoredDocument(row) : null;
  }

  async listSupervisorEscalationsForCase(hubCoordinationCaseId: string) {
    return (this.caseSupervisorEscalations.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.supervisorEscalations.get(id))
      .filter((row): row is HubFallbackSupervisorEscalationSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => new StoredDocument(row));
  }

  async saveSupervisorEscalation(
    snapshot: HubFallbackSupervisorEscalationSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.supervisorEscalations,
      snapshot.hubFallbackSupervisorEscalationId,
      snapshot,
      options,
    );
    const current = this.caseSupervisorEscalations.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.hubFallbackSupervisorEscalationId)) {
      this.caseSupervisorEscalations.set(snapshot.hubCoordinationCaseId, [
        ...current,
        snapshot.hubFallbackSupervisorEscalationId,
      ]);
    }
  }

  async getHubCoordinationException(exceptionId: string) {
    const row = this.exceptions.get(exceptionId);
    return row ? new StoredDocument(row) : null;
  }

  async listHubCoordinationExceptionsForCase(hubCoordinationCaseId: string) {
    return (this.caseExceptions.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.exceptions.get(id))
      .filter((row): row is HubCoordinationExceptionSnapshot => row !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => new StoredDocument(row));
  }

  async saveHubCoordinationException(
    snapshot: HubCoordinationExceptionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.exceptions, snapshot.exceptionId, snapshot, options);
    const current = this.caseExceptions.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.exceptionId)) {
      this.caseExceptions.set(snapshot.hubCoordinationCaseId, [...current, snapshot.exceptionId]);
    }
  }
}

export function createPhase5HubFallbackStore() {
  return new Phase5HubFallbackStore();
}

export interface HubFallbackLeadTimeDecisionInput {
  remainingClinicalWindowMinutes: number;
  offerLeadMinutes: number;
  callbackLeadMinutes: number;
  trustedAlternativeFrontierExists: boolean;
  callbackRequested: boolean;
  policyRequiresCallback: boolean;
  degradedOnlyEvidence: boolean;
}

export interface HubFallbackLeadTimeDecision {
  decision: "alternatives" | "callback" | "return_to_practice";
  offerLeadLegal: boolean;
  callbackLeadLegal: boolean;
  remainingClinicalWindowMinutes: number;
  reasonCode: string;
}

export function evaluateHubFallbackLeadTimeDecision(
  input: HubFallbackLeadTimeDecisionInput,
): HubFallbackLeadTimeDecision {
  const remainingClinicalWindowMinutes = ensureNonNegativeInteger(
    input.remainingClinicalWindowMinutes,
    "remainingClinicalWindowMinutes",
  );
  const offerLeadMinutes = ensureNonNegativeInteger(input.offerLeadMinutes, "offerLeadMinutes");
  const callbackLeadMinutes = ensureNonNegativeInteger(
    input.callbackLeadMinutes,
    "callbackLeadMinutes",
  );
  const offerLeadLegal = offerLeadMinutes <= remainingClinicalWindowMinutes;
  const callbackLeadLegal = callbackLeadMinutes <= remainingClinicalWindowMinutes;

  if (input.trustedAlternativeFrontierExists && offerLeadLegal && !input.callbackRequested && !input.policyRequiresCallback) {
    return {
      decision: "alternatives",
      offerLeadLegal,
      callbackLeadLegal,
      remainingClinicalWindowMinutes,
      reasonCode: "trusted_alternatives_fit_clinical_window",
    };
  }

  if ((input.callbackRequested || input.policyRequiresCallback) && callbackLeadLegal) {
    return {
      decision: "callback",
      offerLeadLegal,
      callbackLeadLegal,
      remainingClinicalWindowMinutes,
      reasonCode: input.callbackRequested
        ? "patient_requested_callback_within_window"
        : "policy_callback_within_window",
    };
  }

  if (input.degradedOnlyEvidence) {
    return {
      decision: "return_to_practice",
      offerLeadLegal,
      callbackLeadLegal,
      remainingClinicalWindowMinutes,
      reasonCode: "degraded_only_supply_requires_return",
    };
  }

  if (input.trustedAlternativeFrontierExists && !offerLeadLegal) {
    return {
      decision: "return_to_practice",
      offerLeadLegal,
      callbackLeadLegal,
      remainingClinicalWindowMinutes,
      reasonCode: "offer_lead_exceeds_clinical_window",
    };
  }

  if ((input.callbackRequested || input.policyRequiresCallback) && !callbackLeadLegal) {
    return {
      decision: "return_to_practice",
      offerLeadLegal,
      callbackLeadLegal,
      remainingClinicalWindowMinutes,
      reasonCode: "callback_lead_exceeds_clinical_window",
    };
  }

  return {
    decision: "return_to_practice",
    offerLeadLegal,
    callbackLeadLegal,
    remainingClinicalWindowMinutes,
    reasonCode: input.trustedAlternativeFrontierExists
      ? "fallback_required_by_policy"
      : "no_trusted_frontier_available",
  };
}

export interface HubFallbackNoveltyInput {
  previousBestTrustedFit: number | null;
  currentBestTrustedFit: number;
  previousPriorityBand: NetworkBookingPriorityBand | null;
  currentPriorityBand: NetworkBookingPriorityBand;
  newClinicalContextScore?: number;
}

export function computeHubFallbackNoveltyScore(input: HubFallbackNoveltyInput): number {
  const currentBestTrustedFit = ensureUnitInterval(
    input.currentBestTrustedFit,
    "currentBestTrustedFit",
  );
  const previousBestTrustedFit =
    input.previousBestTrustedFit === null
      ? null
      : ensureUnitInterval(input.previousBestTrustedFit, "previousBestTrustedFit");
  const newClinicalContextScore = ensureUnitInterval(
    input.newClinicalContextScore ?? 0,
    "newClinicalContextScore",
  );
  if (previousBestTrustedFit === null || input.previousPriorityBand === null) {
    return 1;
  }
  const deltaBestTrustedFit = Math.max(0, currentBestTrustedFit - previousBestTrustedFit);
  const priorityUpgradeScore =
    priorityBandOrdinal(input.currentPriorityBand) > priorityBandOrdinal(input.previousPriorityBand)
      ? 1
      : 0;
  return Number(
    Math.max(deltaBestTrustedFit, newClinicalContextScore, priorityUpgradeScore).toFixed(6),
  );
}

export interface HubFallbackLoopEscalationDecisionInput {
  bounceCount: number;
  noveltyScore: number;
  bounceThreshold?: number;
  noveltyThreshold?: number;
}

export function shouldEscalateHubFallbackLoop(
  input: HubFallbackLoopEscalationDecisionInput,
): boolean {
  const bounceCount = ensureNonNegativeInteger(input.bounceCount, "bounceCount");
  const noveltyScore = ensureUnitInterval(input.noveltyScore, "noveltyScore");
  const bounceThreshold = ensurePositiveInteger(input.bounceThreshold ?? 3, "bounceThreshold");
  const noveltyThreshold = ensureUnitInterval(input.noveltyThreshold ?? 0.35, "noveltyThreshold");
  return bounceCount >= bounceThreshold && noveltyScore < noveltyThreshold;
}

function requireHubCaseBundle(
  bundle: HubCaseBundle | null,
  hubCoordinationCaseId: string,
): HubCaseBundle {
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

function updateAlternativeOfferEntry(
  current: AlternativeOfferEntrySnapshot,
  input: Partial<AlternativeOfferEntrySnapshot>,
): AlternativeOfferEntrySnapshot {
  return {
    ...current,
    ...input,
    version: nextVersion(current.version),
  };
}

function updateAlternativeOfferFallbackCard(
  current: AlternativeOfferFallbackCardSnapshot,
  input: Partial<AlternativeOfferFallbackCardSnapshot>,
): AlternativeOfferFallbackCardSnapshot {
  return {
    ...current,
    ...input,
    version: nextVersion(current.version),
  };
}

function updateAlternativeOfferSession(
  current: AlternativeOfferSessionSnapshot,
  input: Partial<AlternativeOfferSessionSnapshot>,
): AlternativeOfferSessionSnapshot {
  return {
    ...current,
    ...input,
    monotoneRevision: current.monotoneRevision + 1,
    version: nextVersion(current.version),
  };
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

function currentClinicalWindowClose(request: HubCaseBundle["networkBookingRequest"]): string {
  return request.clinicalTimeframe.latestSafeOfferAt ?? request.clinicalTimeframe.dueAt;
}

function baseFallbackBlockingRefs(
  fallbackLinkState: HubOfferToConfirmationTruthProjectionSnapshot["fallbackLinkState"],
): string[] {
  if (fallbackLinkState === "callback_pending_link" || fallbackLinkState === "return_pending_link") {
    return ["fallback_linkage_pending"];
  }
  return [];
}

function updateFallbackRecord(
  current: HubFallbackRecordSnapshot,
  input: Partial<HubFallbackRecordSnapshot>,
  updatedAt: string,
): HubFallbackRecordSnapshot {
  return {
    ...current,
    ...input,
    updatedAt,
    version: nextVersion(current.version),
  };
}

function updateCallbackFallbackRecord(
  current: CallbackFallbackRecordSnapshot,
  input: Partial<CallbackFallbackRecordSnapshot>,
): CallbackFallbackRecordSnapshot {
  return {
    ...current,
    ...input,
    version: nextVersion(current.version),
  };
}

function updateReturnToPracticeRecord(
  current: HubReturnToPracticeRecordSnapshot,
  input: Partial<HubReturnToPracticeRecordSnapshot>,
): HubReturnToPracticeRecordSnapshot {
  return {
    ...current,
    ...input,
    version: nextVersion(current.version),
  };
}

function updateCycleCounter(
  current: HubFallbackCycleCounterSnapshot,
  input: Partial<HubFallbackCycleCounterSnapshot>,
): HubFallbackCycleCounterSnapshot {
  return {
    ...current,
    ...input,
    version: nextVersion(current.version),
  };
}

function updateSupervisorEscalation(
  current: HubFallbackSupervisorEscalationSnapshot,
  input: Partial<HubFallbackSupervisorEscalationSnapshot>,
): HubFallbackSupervisorEscalationSnapshot {
  return {
    ...current,
    ...input,
    version: nextVersion(current.version),
  };
}

function updateHubCoordinationException(
  current: HubCoordinationExceptionSnapshot,
  input: Partial<HubCoordinationExceptionSnapshot>,
  updatedAt: string,
): HubCoordinationExceptionSnapshot {
  return {
    ...current,
    ...input,
    updatedAt,
    version: nextVersion(current.version),
  };
}

function buildOfferMutationFenceFromSession(
  session: AlternativeOfferSessionSnapshot,
  truthTupleHash: string,
): OfferMutationFenceInput {
  return {
    subjectRef: session.subjectRef,
    sessionEpochRef: session.sessionEpochRef,
    subjectBindingVersionRef: session.subjectBindingVersionRef,
    manifestVersionRef: session.manifestVersionRef,
    releaseApprovalFreezeRef: session.releaseApprovalFreezeRef,
    channelReleaseFreezeState: session.channelReleaseFreezeState,
    visibleOfferSetHash: session.visibleOfferSetHash,
    truthTupleHash,
    offerFenceEpoch: session.offerFenceEpoch,
    experienceContinuityEvidenceRef: session.experienceContinuityEvidenceRef,
    surfacePublicationRef: session.surfacePublicationRef,
    runtimePublicationBundleRef: session.runtimePublicationBundleRef,
  };
}

export interface Phase5CallbackLinkBridgeInput {
  hubCoordinationCaseId: string;
  hubFallbackRecord: HubFallbackRecordSnapshot;
  callbackFallbackRecord: CallbackFallbackRecordSnapshot;
  hubCaseBundle: HubCaseBundle;
  recordedAt: string;
}

export interface Phase5CallbackLinkBridgeResult {
  callbackCaseRef: string | null;
  callbackExpectationEnvelopeRef: string | null;
  linkedAt: string | null;
  createdOrReused: boolean;
  sourceRefs: readonly string[];
}

export interface Phase5PracticeReopenBridgeInput {
  hubCoordinationCaseId: string;
  hubFallbackRecord: HubFallbackRecordSnapshot;
  returnToPracticeRecord: HubReturnToPracticeRecordSnapshot;
  hubCaseBundle: HubCaseBundle;
  recordedAt: string;
}

export interface Phase5PracticeReopenBridgeResult {
  reopenedWorkflowRef: string | null;
  reopenedLineageCaseLinkRef: string | null;
  reopenedLeaseRef: string | null;
  linkedAt: string | null;
  sourceRefs: readonly string[];
}

export interface Phase5CallbackLinkBridge {
  materializeCallbackLink(
    input: Phase5CallbackLinkBridgeInput,
  ): Promise<Phase5CallbackLinkBridgeResult>;
}

export interface Phase5PracticeReopenBridge {
  materializePracticeReopen(
    input: Phase5PracticeReopenBridgeInput,
  ): Promise<Phase5PracticeReopenBridgeResult>;
}

export interface Phase5AlternativeOfferFallbackActions {
  requestCallbackFromAlternativeOffer(
    input: RequestCallbackFromAlternativeOfferInput,
  ): Promise<RequestCallbackFromAlternativeOfferResult>;
}

export function createPendingCallbackLinkBridge(): Phase5CallbackLinkBridge {
  return {
    async materializeCallbackLink() {
      return {
        callbackCaseRef: null,
        callbackExpectationEnvelopeRef: null,
        linkedAt: null,
        createdOrReused: false,
        sourceRefs: ["phase5-hub-fallback-engine.ts#createPendingCallbackLinkBridge"],
      };
    },
  };
}

export function createPendingPracticeReopenBridge(): Phase5PracticeReopenBridge {
  return {
    async materializePracticeReopen() {
      return {
        reopenedWorkflowRef: null,
        reopenedLineageCaseLinkRef: null,
        reopenedLeaseRef: null,
        linkedAt: null,
        sourceRefs: ["phase5-hub-fallback-engine.ts#createPendingPracticeReopenBridge"],
      };
    },
  };
}

export interface ResolveNoSlotFallbackInput {
  hubCoordinationCaseId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  trustedAlternativeFrontierExists: boolean;
  degradedOnlyEvidence: boolean;
  callbackRequested?: boolean;
  policyRequiresCallback?: boolean;
  offerLeadMinutes: number;
  callbackLeadMinutes: number;
  bestTrustedFit: number;
  trustGap: number;
  pBreach: number;
  newClinicalContextScore?: number;
  alternativeOfferSessionId?: string | null;
  phase4WaitlistCarryForward?: Phase4WaitlistCarryForwardSnapshot | null;
  sourceRefs?: readonly string[];
}

export interface LinkCallbackFallbackInput {
  hubFallbackRecordId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  sourceRefs?: readonly string[];
}

export interface LinkReturnToPracticeInput {
  hubFallbackRecordId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  sourceRefs?: readonly string[];
}

export interface CompleteHubFallbackInput {
  hubFallbackRecordId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  closeHubCase?: boolean;
  closeDecisionRef?: string | null;
  sourceRefs?: readonly string[];
}

export interface RaiseHubCoordinationExceptionInput {
  hubCoordinationCaseId: string;
  hubFallbackRecordRef?: string | null;
  activeChildRef?: string | null;
  exceptionClass: HubCoordinationExceptionClass;
  reasonCode: string;
  truthProjectionRef?: string | null;
  truthTupleHash: string;
  retryState?: HubCoordinationExceptionRetryState;
  escalationState?: HubCoordinationExceptionEscalationState;
  details?: Record<string, unknown>;
  recordedAt: string;
  sourceRefs?: readonly string[];
}

export interface ResolveNoSlotFallbackResult {
  decision: HubFallbackLeadTimeDecision;
  fallbackRecord: HubFallbackRecordSnapshot | null;
  callbackFallbackRecord: CallbackFallbackRecordSnapshot | null;
  returnToPracticeRecord: HubReturnToPracticeRecordSnapshot | null;
  cycleCounter: HubFallbackCycleCounterSnapshot | null;
  supervisorEscalation: HubFallbackSupervisorEscalationSnapshot | null;
  exception: HubCoordinationExceptionSnapshot | null;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot | null;
  hubTransition: HubCaseTransitionResult | null;
  session: AlternativeOfferSessionSnapshot | null;
  fallbackCard: AlternativeOfferFallbackCardSnapshot | null;
  route: HubFallbackLeadTimeDecision["decision"];
}

export interface LinkCallbackFallbackResult {
  fallbackRecord: HubFallbackRecordSnapshot;
  callbackFallbackRecord: CallbackFallbackRecordSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  hubTransition: HubCaseTransitionResult;
}

export interface LinkReturnToPracticeResult {
  fallbackRecord: HubFallbackRecordSnapshot;
  returnToPracticeRecord: HubReturnToPracticeRecordSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
}

export interface CompleteHubFallbackResult {
  fallbackRecord: HubFallbackRecordSnapshot;
  releasedCase: HubCaseTransitionResult | null;
  closedCase: HubCaseTransitionResult | null;
}

export interface Phase5HubFallbackEngineService {
  resolveNoSlotFallback(input: ResolveNoSlotFallbackInput): Promise<ResolveNoSlotFallbackResult>;
  linkCallbackFallback(input: LinkCallbackFallbackInput): Promise<LinkCallbackFallbackResult>;
  linkReturnToPractice(input: LinkReturnToPracticeInput): Promise<LinkReturnToPracticeResult>;
  completeHubFallback(input: CompleteHubFallbackInput): Promise<CompleteHubFallbackResult>;
  raiseHubCoordinationException(
    input: RaiseHubCoordinationExceptionInput,
  ): Promise<HubCoordinationExceptionSnapshot>;
  resolveHubCoordinationException(
    exceptionId: string,
    resolvedAt: string,
  ): Promise<HubCoordinationExceptionSnapshot>;
}

export function createPhase5HubFallbackEngineService(input: {
  repositories?: Phase5HubFallbackRepositories;
  hubCaseService: Phase5HubCaseKernelService;
  offerRepositories: Phase5AlternativeOfferEngineRepositories;
  offerActions?: Phase5AlternativeOfferFallbackActions;
  callbackBridge?: Phase5CallbackLinkBridge;
  practiceReopenBridge?: Phase5PracticeReopenBridge;
  idGenerator?: BackboneIdGenerator;
}): Phase5HubFallbackEngineService {
  const repositories = input.repositories ?? createPhase5HubFallbackStore();
  const hubCaseService = input.hubCaseService;
  const offerRepositories = input.offerRepositories;
  const offerActions = input.offerActions;
  const callbackBridge = input.callbackBridge ?? createPendingCallbackLinkBridge();
  const practiceReopenBridge =
    input.practiceReopenBridge ?? createPendingPracticeReopenBridge();
  const idGenerator =
    input.idGenerator ??
    createDeterministicBackboneIdGenerator("phase5-hub-fallback-engine");

  async function currentContext(hubCoordinationCaseId: string) {
    const hubCaseBundle = requireHubCaseBundle(
      await hubCaseService.queryHubCaseBundle(hubCoordinationCaseId),
      hubCoordinationCaseId,
    );
    const truthProjection = await offerRepositories.getTruthProjectionForCase(hubCoordinationCaseId);
    const session = await offerRepositories.getCurrentSessionForCase(hubCoordinationCaseId);
    const fallbackCard =
      session === null
        ? null
        : await offerRepositories.getFallbackCardForSession(
            session.toSnapshot().alternativeOfferSessionId,
          );
    return {
      hubCaseBundle,
      truthProjection: truthProjection?.toSnapshot() ?? null,
      session: session?.toSnapshot() ?? null,
      fallbackCard: fallbackCard?.toSnapshot() ?? null,
    };
  }

  async function raiseException(
    inputValue: RaiseHubCoordinationExceptionInput,
  ): Promise<HubCoordinationExceptionSnapshot> {
    const createdAt = ensureIsoTimestamp(inputValue.recordedAt, "recordedAt");
    const exception: HubCoordinationExceptionSnapshot = {
      exceptionId: nextId(idGenerator, "hubCoordinationException"),
      hubCoordinationCaseId: requireRef(inputValue.hubCoordinationCaseId, "hubCoordinationCaseId"),
      hubFallbackRecordRef: optionalRef(inputValue.hubFallbackRecordRef),
      activeChildRef: optionalRef(inputValue.activeChildRef),
      exceptionClass: inputValue.exceptionClass,
      exceptionState: "open",
      retryState: inputValue.retryState ?? "waiting_manual",
      escalationState: inputValue.escalationState ?? "none",
      reasonCode: requireRef(inputValue.reasonCode, "reasonCode"),
      truthProjectionRef: optionalRef(inputValue.truthProjectionRef),
      truthTupleHash: requireRef(inputValue.truthTupleHash, "truthTupleHash"),
      details: structuredClone(inputValue.details ?? {}),
      createdAt,
      updatedAt: createdAt,
      resolvedAt: null,
      sourceRefs: uniqueSortedRefs([
        ...DEFAULT_SOURCE_REFS,
        ...(inputValue.sourceRefs ?? []),
      ]),
      version: 1,
    };
    await repositories.saveHubCoordinationException(exception);
    return exception;
  }

  async function upsertFallbackTruthProjection(inputValue: {
    hubCaseBundle: HubCaseBundle;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot | null;
    session: AlternativeOfferSessionSnapshot | null;
    fallbackCard: AlternativeOfferFallbackCardSnapshot | null;
    fallbackRecord: HubFallbackRecordSnapshot;
    selectionSource: HubOfferToConfirmationTruthProjectionSnapshot["selectionSource"];
    fallbackLinkState: HubOfferToConfirmationTruthProjectionSnapshot["fallbackLinkState"];
    patientVisibilityState: HubOfferToConfirmationTruthProjectionSnapshot["patientVisibilityState"];
    closureState: HubOfferToConfirmationTruthProjectionSnapshot["closureState"];
    offerState: HubOfferToConfirmationTruthProjectionSnapshot["offerState"];
    offerActionabilityState: HubOfferToConfirmationTruthProjectionSnapshot["offerActionabilityState"];
    generatedAt: string;
  }): Promise<HubOfferToConfirmationTruthProjectionSnapshot> {
    const current = inputValue.truthProjection;
    if (!current) {
      const createdCore = {
        hubOfferToConfirmationTruthProjectionId: nextId(idGenerator, "hubOfferToConfirmationTruth"),
        hubCoordinationCaseId: inputValue.hubCaseBundle.hubCase.hubCoordinationCaseId,
        selectionSource: inputValue.selectionSource,
        candidateSnapshotRef: inputValue.session?.candidateSnapshotRef ?? inputValue.hubCaseBundle.hubCase.candidateSnapshotRef,
        selectedCandidateRef: null,
        selectedCandidateSourceVersion: null,
        selectedCapacityUnitRef: null,
        offerSessionRef: inputValue.session?.alternativeOfferSessionId ?? null,
        offerOptimisationPlanRef:
          inputValue.session?.optimisationPlanRef ??
          inputValue.hubCaseBundle.hubCase.activeOfferOptimisationPlanRef,
        fallbackCardRef: inputValue.fallbackCard?.alternativeOfferFallbackCardId ?? null,
        offerSetHash: inputValue.session?.visibleOfferSetHash ?? null,
        offerSessionRevision: inputValue.session?.monotoneRevision ?? 0,
        offerExpiryAt: inputValue.session?.expiresAt ?? null,
        offerState: inputValue.offerState,
        offerActionabilityState: inputValue.offerActionabilityState,
        latestRegenerationSettlementRef:
          inputValue.session?.latestRegenerationSettlementRef ??
          inputValue.hubCaseBundle.hubCase.latestOfferRegenerationSettlementRef,
        commitAttemptRef: null,
        bookingEvidenceRef: inputValue.hubCaseBundle.hubCase.bookingEvidenceRef,
        confirmationGateRef: null,
        hubAppointmentId: inputValue.hubCaseBundle.hubCase.networkAppointmentRef,
        practiceAcknowledgementRef: null,
        practiceAckGeneration: inputValue.hubCaseBundle.hubCase.practiceAckGeneration,
        fallbackRef: inputValue.fallbackRecord.hubFallbackRecordId,
        fallbackLinkState: inputValue.fallbackLinkState,
        confirmationTruthState: "no_commit" as const,
        patientVisibilityState: inputValue.patientVisibilityState,
        practiceVisibilityState: "not_started" as const,
        closureState: inputValue.closureState,
        experienceContinuityEvidenceRef:
          inputValue.session?.experienceContinuityEvidenceRef ?? null,
        policyTupleHash:
          inputValue.session?.policyTupleHash ??
          inputValue.hubCaseBundle.hubCase.policyTupleHash ??
          "phase5.hub-fallback.policy.unbound",
        blockingRefs:
          inputValue.closureState === "closable"
            ? []
            : baseFallbackBlockingRefs(inputValue.fallbackLinkState),
        causalToken: nextId(idGenerator, "hubFallbackTruthCausalToken"),
        monotoneRevision: 1,
        generatedAt: inputValue.generatedAt,
        sourceRefs: uniqueSortedRefs(DEFAULT_SOURCE_REFS),
        version: 1,
      };
      const created: HubOfferToConfirmationTruthProjectionSnapshot = {
        ...createdCore,
        truthTupleHash: computeTruthTupleHash({
          ...createdCore,
          truthTupleHash: undefined as never,
        }),
      };
      await offerRepositories.saveTruthProjection(created);
      return created;
    }

    const updated = updateTruthProjection(
      current,
      {
        selectionSource: inputValue.selectionSource,
        offerSessionRef:
          inputValue.session?.alternativeOfferSessionId ?? current.offerSessionRef,
        offerOptimisationPlanRef:
          inputValue.session?.optimisationPlanRef ?? current.offerOptimisationPlanRef,
        fallbackCardRef: inputValue.fallbackCard?.alternativeOfferFallbackCardId ?? current.fallbackCardRef,
        offerSetHash: inputValue.session?.visibleOfferSetHash ?? current.offerSetHash,
        offerSessionRevision: inputValue.session?.monotoneRevision ?? current.offerSessionRevision,
        offerExpiryAt: inputValue.session?.expiresAt ?? current.offerExpiryAt,
        offerState: inputValue.offerState,
        offerActionabilityState: inputValue.offerActionabilityState,
        latestRegenerationSettlementRef:
          inputValue.session?.latestRegenerationSettlementRef ??
          current.latestRegenerationSettlementRef,
        bookingEvidenceRef: inputValue.hubCaseBundle.hubCase.bookingEvidenceRef,
        hubAppointmentId: inputValue.hubCaseBundle.hubCase.networkAppointmentRef,
        practiceAckGeneration: inputValue.hubCaseBundle.hubCase.practiceAckGeneration,
        fallbackRef: inputValue.fallbackRecord.hubFallbackRecordId,
        fallbackLinkState: inputValue.fallbackLinkState,
        patientVisibilityState: inputValue.patientVisibilityState,
        closureState: inputValue.closureState,
        experienceContinuityEvidenceRef:
          inputValue.session?.experienceContinuityEvidenceRef ?? current.experienceContinuityEvidenceRef,
        policyTupleHash:
          inputValue.session?.policyTupleHash ??
          inputValue.hubCaseBundle.hubCase.policyTupleHash ??
          current.policyTupleHash,
        blockingRefs:
          inputValue.closureState === "closable"
            ? []
            : baseFallbackBlockingRefs(inputValue.fallbackLinkState),
        causalToken: nextId(idGenerator, "hubFallbackTruthCausalToken"),
      },
      inputValue.generatedAt,
    );
    await offerRepositories.saveTruthProjection(updated, { expectedVersion: current.version });
    return updated;
  }

  async function preserveOfferSessionAsReadOnlyProvenance(inputValue: {
    session: AlternativeOfferSessionSnapshot;
    fallbackCard: AlternativeOfferFallbackCardSnapshot | null;
    fallbackRecordId: string;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    recordedAt: string;
    callbackMode: boolean;
  }): Promise<{
    session: AlternativeOfferSessionSnapshot;
    fallbackCard: AlternativeOfferFallbackCardSnapshot | null;
  }> {
    const currentEntries = (
      await offerRepositories.listEntriesForSession(inputValue.session.alternativeOfferSessionId)
    ).map((row) => row.toSnapshot());
    for (const entry of currentEntries) {
      const updatedEntry = updateAlternativeOfferEntry(entry, {
        selectionState: "read_only_provenance",
        truthTupleHash: inputValue.truthProjection.truthTupleHash,
      });
      await offerRepositories.saveEntry(updatedEntry, { expectedVersion: entry.version });
    }

    const updatedFallbackCard =
      inputValue.fallbackCard === null
        ? null
        : updateAlternativeOfferFallbackCard(inputValue.fallbackCard, {
            sourceFallbackRef: inputValue.fallbackRecordId,
            eligibilityState: inputValue.callbackMode ? "selected" : "read_only_provenance",
          });
    if (updatedFallbackCard) {
      await offerRepositories.saveFallbackCard(updatedFallbackCard, {
        expectedVersion: inputValue.fallbackCard!.version,
      });
    }

    const updatedSession = updateAlternativeOfferSession(inputValue.session, {
      openChoiceState: "read_only_provenance",
      patientChoiceState: inputValue.callbackMode ? "callback_requested" : "recovery_only",
      callbackOfferState: inputValue.callbackMode ? "selected" : "blocked",
      truthTupleHash: inputValue.truthProjection.truthTupleHash,
    });
    await offerRepositories.saveSession(updatedSession, {
      expectedVersion: inputValue.session.version,
    });

    return {
      session: updatedSession,
      fallbackCard: updatedFallbackCard,
    };
  }

  async function requireFallbackRecord(
    hubFallbackRecordId: string,
    code = "HUB_FALLBACK_RECORD_NOT_FOUND",
    message = "HubFallbackRecord could not be found.",
  ): Promise<HubFallbackRecordSnapshot> {
    return requireSnapshot(repositories.getFallbackRecord(hubFallbackRecordId), code, message);
  }

  async function createFallbackRecord(inputValue: {
    hubCaseBundle: HubCaseBundle;
    fallbackType: HubFallbackType;
    fallbackReasonCode: string;
    sourceOfferSessionRef?: string | null;
    sourceFallbackCardRef?: string | null;
    offerLeadMinutes?: number | null;
    callbackLeadMinutes?: number | null;
    remainingClinicalWindowMinutes: number;
    urgencyCarryFloor: number;
    bounceCount: number;
    noveltyScore: number;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot | null;
    phase4WaitlistCarryForward?: Phase4WaitlistCarryForwardSnapshot | null;
    recordedAt: string;
    sourceRefs?: readonly string[];
  }): Promise<HubFallbackRecordSnapshot> {
    const snapshot: HubFallbackRecordSnapshot = {
      hubFallbackRecordId: nextId(idGenerator, "hubFallbackRecord"),
      hubCoordinationCaseId: inputValue.hubCaseBundle.hubCase.hubCoordinationCaseId,
      fallbackType: inputValue.fallbackType,
      fallbackState: "pending_link",
      fallbackReasonCode: requireRef(inputValue.fallbackReasonCode, "fallbackReasonCode"),
      sourceOfferSessionRef: optionalRef(inputValue.sourceOfferSessionRef),
      sourceFallbackCardRef: optionalRef(inputValue.sourceFallbackCardRef),
      callbackFallbackRef: null,
      returnToPracticeRef: null,
      activeExceptionRef: null,
      offerLeadMinutes:
        inputValue.offerLeadMinutes === undefined || inputValue.offerLeadMinutes === null
          ? null
          : ensureNonNegativeInteger(inputValue.offerLeadMinutes, "offerLeadMinutes"),
      callbackLeadMinutes:
        inputValue.callbackLeadMinutes === undefined || inputValue.callbackLeadMinutes === null
          ? null
          : ensureNonNegativeInteger(inputValue.callbackLeadMinutes, "callbackLeadMinutes"),
      remainingClinicalWindowMinutes: ensureNonNegativeInteger(
        inputValue.remainingClinicalWindowMinutes,
        "remainingClinicalWindowMinutes",
      ),
      urgencyCarryFloor: ensureUnitInterval(inputValue.urgencyCarryFloor, "urgencyCarryFloor"),
      bounceCount: ensureNonNegativeInteger(inputValue.bounceCount, "bounceCount"),
      noveltyScore: ensureUnitInterval(inputValue.noveltyScore, "noveltyScore"),
      waitlistDeadlineEvaluationRef:
        inputValue.phase4WaitlistCarryForward?.waitlistDeadlineEvaluationRef ?? null,
      waitlistFallbackObligationRef:
        inputValue.phase4WaitlistCarryForward?.waitlistFallbackObligationRef ?? null,
      waitlistContinuationTruthProjectionRef:
        inputValue.phase4WaitlistCarryForward?.waitlistContinuationTruthProjectionRef ?? null,
      waitlistRequiredFallbackRoute:
        inputValue.phase4WaitlistCarryForward?.requiredFallbackRoute ?? null,
      waitlistWindowRiskState: inputValue.phase4WaitlistCarryForward?.windowRiskState ?? null,
      carryForwardBoundAt: inputValue.phase4WaitlistCarryForward?.boundAt ?? null,
      truthProjectionRef: inputValue.truthProjection?.hubOfferToConfirmationTruthProjectionId ?? null,
      truthTupleHash:
        inputValue.truthProjection?.truthTupleHash ??
        (inputValue.hubCaseBundle.hubCase.policyTupleHash ?? "phase5.hub-fallback.truth.unbound"),
      stateConfidenceBand: "high",
      transferredAt: null,
      completedAt: null,
      recordedAt: inputValue.recordedAt,
      updatedAt: inputValue.recordedAt,
      sourceRefs: uniqueSortedRefs([
        ...DEFAULT_SOURCE_REFS,
        ...(inputValue.sourceRefs ?? []),
      ]),
      version: 1,
    };
    await repositories.saveFallbackRecord(snapshot);
    return snapshot;
  }

  async function createCallbackFallbackRecord(inputValue: {
    hubFallbackRecord: HubFallbackRecordSnapshot;
    callbackLeadMinutes: number;
    sourceOfferSessionRef?: string | null;
    sourceFallbackCardRef?: string | null;
    recordedAt: string;
    sourceRefs?: readonly string[];
  }): Promise<CallbackFallbackRecordSnapshot> {
    const snapshot: CallbackFallbackRecordSnapshot = {
      callbackFallbackRecordId: nextId(idGenerator, "callbackFallbackRecord"),
      hubFallbackRecordRef: inputValue.hubFallbackRecord.hubFallbackRecordId,
      hubCoordinationCaseId: inputValue.hubFallbackRecord.hubCoordinationCaseId,
      callbackState: "pending_link",
      callbackLeadMinutes: ensureNonNegativeInteger(
        inputValue.callbackLeadMinutes,
        "callbackLeadMinutes",
      ),
      sourceOfferSessionRef: optionalRef(inputValue.sourceOfferSessionRef),
      sourceFallbackCardRef: optionalRef(inputValue.sourceFallbackCardRef),
      callbackCaseRef: null,
      callbackExpectationEnvelopeRef: null,
      linkedAt: null,
      offeredAt: null,
      completedAt: null,
      sourceRefs: uniqueSortedRefs([
        ...DEFAULT_SOURCE_REFS,
        ...(inputValue.sourceRefs ?? []),
      ]),
      version: 1,
    };
    await repositories.saveCallbackFallbackRecord(snapshot);
    const patchedFallback = updateFallbackRecord(
      inputValue.hubFallbackRecord,
      { callbackFallbackRef: snapshot.callbackFallbackRecordId },
      inputValue.recordedAt,
    );
    await repositories.saveFallbackRecord(patchedFallback, {
      expectedVersion: inputValue.hubFallbackRecord.version,
    });
    return snapshot;
  }

  async function createReturnToPracticeRecord(inputValue: {
    hubFallbackRecord: HubFallbackRecordSnapshot;
    targetPracticeOds: string;
    urgencyCarryFloor: number;
    pBreach: number;
    trustGap: number;
    bestTrustedFit: number;
    bounceCount: number;
    noveltyScore: number;
    returnReasonCode: string;
    recordedAt: string;
    sourceRefs?: readonly string[];
  }): Promise<HubReturnToPracticeRecordSnapshot> {
    const snapshot: HubReturnToPracticeRecordSnapshot = {
      hubReturnToPracticeRecordId: nextId(idGenerator, "hubReturnToPracticeRecord"),
      hubFallbackRecordRef: inputValue.hubFallbackRecord.hubFallbackRecordId,
      hubCoordinationCaseId: inputValue.hubFallbackRecord.hubCoordinationCaseId,
      returnState: "pending_link",
      returnReasonCode: requireRef(inputValue.returnReasonCode, "returnReasonCode"),
      targetPracticeOds: requireRef(inputValue.targetPracticeOds, "targetPracticeOds"),
      urgencyCarryFloor: ensureUnitInterval(inputValue.urgencyCarryFloor, "urgencyCarryFloor"),
      pBreach: ensureUnitInterval(inputValue.pBreach, "pBreach"),
      trustGap: ensureUnitInterval(inputValue.trustGap, "trustGap"),
      bestTrustedFit: ensureUnitInterval(inputValue.bestTrustedFit, "bestTrustedFit"),
      bounceCount: ensureNonNegativeInteger(inputValue.bounceCount, "bounceCount"),
      noveltyScore: ensureUnitInterval(inputValue.noveltyScore, "noveltyScore"),
      reopenedWorkflowRef: null,
      reopenedLineageCaseLinkRef: null,
      reopenedLeaseRef: null,
      reopenLifecycleState: "pending",
      linkedAt: null,
      completedAt: null,
      sourceRefs: uniqueSortedRefs([
        ...DEFAULT_SOURCE_REFS,
        ...(inputValue.sourceRefs ?? []),
      ]),
      version: 1,
    };
    await repositories.saveReturnToPracticeRecord(snapshot);
    const patchedFallback = updateFallbackRecord(
      inputValue.hubFallbackRecord,
      { returnToPracticeRef: snapshot.hubReturnToPracticeRecordId },
      inputValue.recordedAt,
    );
    await repositories.saveFallbackRecord(patchedFallback, {
      expectedVersion: inputValue.hubFallbackRecord.version,
    });
    return snapshot;
  }

  async function ensureCycleCounter(inputValue: {
    hubCase: HubCoordinationCaseSnapshot;
    bestTrustedFit: number;
    newClinicalContextScore?: number;
    recordedAt: string;
  }): Promise<{
    cycleCounter: HubFallbackCycleCounterSnapshot;
    noveltyScore: number;
    bounceCount: number;
  }> {
    const current = (
      await repositories.getCycleCounterForCase(inputValue.hubCase.hubCoordinationCaseId)
    )?.toSnapshot();
    const nextBounceCount = (current?.bounceCount ?? 0) + 1;
    const noveltyScore = computeHubFallbackNoveltyScore({
      previousBestTrustedFit: current?.previousBestTrustedFit ?? null,
      currentBestTrustedFit: inputValue.bestTrustedFit,
      previousPriorityBand: current?.previousPriorityBand ?? null,
      currentPriorityBand: inputValue.hubCase.urgencyCarry >= 0.8 ? "urgent" : "priority",
      newClinicalContextScore: inputValue.newClinicalContextScore,
    });
    const snapshot =
      current === undefined
        ? null
        : current;
    const nextCounter: HubFallbackCycleCounterSnapshot =
      snapshot === null
        ? {
            hubFallbackCycleCounterId: nextId(idGenerator, "hubFallbackCycleCounter"),
            hubCoordinationCaseId: inputValue.hubCase.hubCoordinationCaseId,
            bounceCount: nextBounceCount,
            previousBestTrustedFit: ensureUnitInterval(
              inputValue.bestTrustedFit,
              "bestTrustedFit",
            ),
            previousPriorityBand: inputValue.hubCase.urgencyCarry >= 0.8 ? "urgent" : "priority",
            latestNoveltyScore: noveltyScore,
            lastReturnedAt: inputValue.recordedAt,
            updatedAt: inputValue.recordedAt,
            version: 1,
          }
        : updateCycleCounter(snapshot, {
            bounceCount: nextBounceCount,
            previousBestTrustedFit: ensureUnitInterval(
              inputValue.bestTrustedFit,
              "bestTrustedFit",
            ),
            previousPriorityBand: inputValue.hubCase.urgencyCarry >= 0.8 ? "urgent" : "priority",
            latestNoveltyScore: noveltyScore,
            lastReturnedAt: inputValue.recordedAt,
            updatedAt: inputValue.recordedAt,
          });
    await repositories.saveCycleCounter(nextCounter, {
      expectedVersion: snapshot?.version,
    });
    return {
      cycleCounter: nextCounter,
      noveltyScore,
      bounceCount: nextBounceCount,
    };
  }

  async function createSupervisorEscalation(inputValue: {
    hubFallbackRecord: HubFallbackRecordSnapshot;
    exception: HubCoordinationExceptionSnapshot;
    bounceCount: number;
    noveltyScore: number;
    recordedAt: string;
    sourceRefs?: readonly string[];
  }): Promise<HubFallbackSupervisorEscalationSnapshot> {
    const snapshot: HubFallbackSupervisorEscalationSnapshot = {
      hubFallbackSupervisorEscalationId: nextId(idGenerator, "hubFallbackSupervisorEscalation"),
      hubCoordinationCaseId: inputValue.hubFallbackRecord.hubCoordinationCaseId,
      hubFallbackRecordRef: inputValue.hubFallbackRecord.hubFallbackRecordId,
      exceptionRef: inputValue.exception.exceptionId,
      escalationState: "required",
      triggerCode: "bounce_novelty_threshold_breached",
      bounceCount: ensureNonNegativeInteger(inputValue.bounceCount, "bounceCount"),
      noveltyScore: ensureUnitInterval(inputValue.noveltyScore, "noveltyScore"),
      noveltyThreshold: 0.35,
      bounceThreshold: 3,
      recordedAt: inputValue.recordedAt,
      sourceRefs: uniqueSortedRefs([
        ...DEFAULT_SOURCE_REFS,
        ...(inputValue.sourceRefs ?? []),
      ]),
      version: 1,
    };
    await repositories.saveSupervisorEscalation(snapshot);
    return snapshot;
  }

  return {
    async resolveNoSlotFallback(command) {
      const sourceRefs = uniqueSortedRefs([
        ...DEFAULT_SOURCE_REFS,
        ...(command.sourceRefs ?? []),
      ]);
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const context = await currentContext(command.hubCoordinationCaseId);
      const remainingClinicalWindowMinutes = minutesUntil(
        currentClinicalWindowClose(context.hubCaseBundle.networkBookingRequest),
        recordedAt,
      );
      const decision = evaluateHubFallbackLeadTimeDecision({
        remainingClinicalWindowMinutes,
        offerLeadMinutes: command.offerLeadMinutes,
        callbackLeadMinutes: command.callbackLeadMinutes,
        trustedAlternativeFrontierExists: command.trustedAlternativeFrontierExists,
        callbackRequested: command.callbackRequested ?? false,
        policyRequiresCallback: command.policyRequiresCallback ?? false,
        degradedOnlyEvidence: command.degradedOnlyEvidence,
      });

      if (decision.decision === "alternatives") {
        return {
          decision,
          fallbackRecord: null,
          callbackFallbackRecord: null,
          returnToPracticeRecord: null,
          cycleCounter: null,
          supervisorEscalation: null,
          exception: null,
          truthProjection: context.truthProjection,
          hubTransition: null,
          session: context.session,
          fallbackCard: context.fallbackCard,
          route: "alternatives",
        };
      }

      if (decision.decision === "callback") {
        const fallbackType: HubFallbackType =
          command.callbackRequested === true ? "callback_request" : "policy_callback";
        const fallbackRecord = await createFallbackRecord({
          hubCaseBundle: context.hubCaseBundle,
          fallbackType,
          fallbackReasonCode: decision.reasonCode,
          sourceOfferSessionRef: command.alternativeOfferSessionId ?? context.session?.alternativeOfferSessionId,
          sourceFallbackCardRef: context.fallbackCard?.alternativeOfferFallbackCardId,
          offerLeadMinutes: command.offerLeadMinutes,
          callbackLeadMinutes: command.callbackLeadMinutes,
          remainingClinicalWindowMinutes: decision.remainingClinicalWindowMinutes,
          urgencyCarryFloor: context.hubCaseBundle.hubCase.urgencyCarry,
          bounceCount: 0,
          noveltyScore: 1,
          truthProjection: context.truthProjection,
          phase4WaitlistCarryForward: command.phase4WaitlistCarryForward ?? null,
          recordedAt,
          sourceRefs,
        });
        const callbackFallbackRecord = await createCallbackFallbackRecord({
          hubFallbackRecord: fallbackRecord,
          callbackLeadMinutes: command.callbackLeadMinutes,
          sourceOfferSessionRef:
            command.alternativeOfferSessionId ?? context.session?.alternativeOfferSessionId,
          sourceFallbackCardRef: context.fallbackCard?.alternativeOfferFallbackCardId,
          recordedAt,
          sourceRefs,
        });
        const activeFallbackRecord = await requireFallbackRecord(
          fallbackRecord.hubFallbackRecordId,
        );

        if (context.session && offerActions) {
          const callbackResult = await offerActions.requestCallbackFromAlternativeOffer({
            ...buildOfferMutationFenceFromSession(
              context.session,
              context.truthProjection?.truthTupleHash ?? context.session.truthTupleHash,
            ),
            alternativeOfferSessionId: context.session.alternativeOfferSessionId,
            actorRef: command.actorRef,
            routeIntentBindingRef: command.routeIntentBindingRef,
            commandActionRecordRef: command.commandActionRecordRef,
            commandSettlementRecordRef: command.commandSettlementRecordRef,
            recordedAt,
            activeFallbackRef: activeFallbackRecord.hubFallbackRecordId,
            callbackExpectationRef: null,
            skipGrantValidation: false,
          });
          const patchedTruth = await upsertFallbackTruthProjection({
            hubCaseBundle: requireHubCaseBundle(
              await hubCaseService.queryHubCaseBundle(command.hubCoordinationCaseId),
              command.hubCoordinationCaseId,
            ),
            truthProjection: callbackResult.truthProjection,
            session: callbackResult.session,
            fallbackCard: callbackResult.fallbackCard,
            fallbackRecord: activeFallbackRecord,
            selectionSource: "callback_fallback",
            fallbackLinkState: "callback_pending_link",
            patientVisibilityState: "fallback_visible",
            closureState: "blocked_by_fallback_linkage",
            offerState: callbackResult.truthProjection.offerState,
            offerActionabilityState: callbackResult.truthProjection.offerActionabilityState,
            generatedAt: recordedAt,
          });
          const patchedSession = updateAlternativeOfferSession(callbackResult.session, {
            truthTupleHash: patchedTruth.truthTupleHash,
          });
          await offerRepositories.saveSession(patchedSession, {
            expectedVersion: callbackResult.session.version,
          });
          const patchedFallbackCard = updateAlternativeOfferFallbackCard(
            callbackResult.fallbackCard,
            {
              sourceFallbackRef: fallbackRecord.hubFallbackRecordId,
            },
          );
          await offerRepositories.saveFallbackCard(patchedFallbackCard, {
            expectedVersion: callbackResult.fallbackCard.version,
          });
          return {
            decision,
            fallbackRecord: (
              await repositories.getCurrentFallbackForCase(command.hubCoordinationCaseId)
            )!.toSnapshot(),
            callbackFallbackRecord,
            returnToPracticeRecord: null,
            cycleCounter: null,
            supervisorEscalation: null,
            exception: null,
            truthProjection: patchedTruth,
            hubTransition: callbackResult.hubTransition,
            session: patchedSession,
            fallbackCard: patchedFallbackCard,
            route: "callback",
          };
        }

        const hubTransition = await hubCaseService.markCallbackTransferPending({
          hubCoordinationCaseId: command.hubCoordinationCaseId,
          actorRef: command.actorRef,
          routeIntentBindingRef: command.routeIntentBindingRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          recordedAt,
          reasonCode: decision.reasonCode,
          expectedOwnershipEpoch:
            context.hubCaseBundle.hubCase.ownerState === "unclaimed"
              ? context.hubCaseBundle.hubCase.ownershipEpoch
              : context.hubCaseBundle.hubCase.ownershipEpoch,
          expectedOwnershipFenceToken:
            context.hubCaseBundle.hubCase.ownerState === "unclaimed"
              ? undefined
              : context.hubCaseBundle.hubCase.ownershipFenceToken,
          activeFallbackRef: activeFallbackRecord.hubFallbackRecordId,
        });
        const refreshedBundle = requireHubCaseBundle(
          await hubCaseService.queryHubCaseBundle(command.hubCoordinationCaseId),
          command.hubCoordinationCaseId,
        );
        const truthProjection = await upsertFallbackTruthProjection({
          hubCaseBundle: refreshedBundle,
          truthProjection: context.truthProjection,
          session: context.session,
          fallbackCard: context.fallbackCard,
          fallbackRecord: activeFallbackRecord,
          selectionSource: "callback_fallback",
          fallbackLinkState: "callback_pending_link",
          patientVisibilityState: "fallback_visible",
          closureState: "blocked_by_fallback_linkage",
          offerState: context.session ? "declined" : "not_used",
          offerActionabilityState: context.session ? "read_only_provenance" : "fallback_only",
          generatedAt: recordedAt,
        });
        let session = context.session;
        let fallbackCard = context.fallbackCard;
        if (context.session) {
          const preserved = await preserveOfferSessionAsReadOnlyProvenance({
            session: context.session,
            fallbackCard: context.fallbackCard,
            fallbackRecordId: fallbackRecord.hubFallbackRecordId,
            truthProjection,
            recordedAt,
            callbackMode: true,
          });
          session = preserved.session;
          fallbackCard = preserved.fallbackCard;
        }
        return {
          decision,
          fallbackRecord: activeFallbackRecord,
          callbackFallbackRecord,
          returnToPracticeRecord: null,
          cycleCounter: null,
          supervisorEscalation: null,
          exception: null,
          truthProjection,
          hubTransition,
          session,
          fallbackCard,
          route: "callback",
        };
      }

      const cycleState = await ensureCycleCounter({
        hubCase: context.hubCaseBundle.hubCase,
        bestTrustedFit: command.bestTrustedFit,
        newClinicalContextScore: command.newClinicalContextScore,
        recordedAt,
      });
      const urgencyCarryFloor = Number(
        Math.max(
          ensureUnitInterval(command.pBreach, "pBreach"),
          ensureUnitInterval(command.trustGap, "trustGap"),
          context.hubCaseBundle.hubCase.urgencyCarry,
        ).toFixed(6),
      );
      const fallbackRecord = await createFallbackRecord({
        hubCaseBundle: context.hubCaseBundle,
        fallbackType:
          decision.remainingClinicalWindowMinutes === 0
            ? "urgent_return_to_practice"
            : "return_to_practice",
        fallbackReasonCode: decision.reasonCode,
        sourceOfferSessionRef: command.alternativeOfferSessionId ?? context.session?.alternativeOfferSessionId,
        sourceFallbackCardRef: context.fallbackCard?.alternativeOfferFallbackCardId,
        offerLeadMinutes: command.offerLeadMinutes,
        callbackLeadMinutes: command.callbackLeadMinutes,
        remainingClinicalWindowMinutes: decision.remainingClinicalWindowMinutes,
        urgencyCarryFloor,
        bounceCount: cycleState.bounceCount,
        noveltyScore: cycleState.noveltyScore,
        truthProjection: context.truthProjection,
        phase4WaitlistCarryForward: command.phase4WaitlistCarryForward ?? null,
        recordedAt,
        sourceRefs,
      });
      const returnRecord = await createReturnToPracticeRecord({
        hubFallbackRecord: fallbackRecord,
        targetPracticeOds: context.hubCaseBundle.networkBookingRequest.originPracticeOds,
        urgencyCarryFloor,
        pBreach: command.pBreach,
        trustGap: command.trustGap,
        bestTrustedFit: command.bestTrustedFit,
        bounceCount: cycleState.bounceCount,
        noveltyScore: cycleState.noveltyScore,
        returnReasonCode: decision.reasonCode,
        recordedAt,
        sourceRefs,
      });
      const activeFallbackRecord = await requireFallbackRecord(
        fallbackRecord.hubFallbackRecordId,
      );
      const hubTransition = await hubCaseService.markEscalatedBack({
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        actorRef: command.actorRef,
        routeIntentBindingRef: command.routeIntentBindingRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        recordedAt,
        reasonCode: decision.reasonCode,
        expectedOwnershipEpoch: context.hubCaseBundle.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken:
          context.hubCaseBundle.hubCase.ownerState === "unclaimed"
            ? undefined
            : context.hubCaseBundle.hubCase.ownershipFenceToken,
          activeFallbackRef: activeFallbackRecord.hubFallbackRecordId,
      });
      const loopEscalated = shouldEscalateHubFallbackLoop({
        bounceCount: cycleState.bounceCount,
        noveltyScore: cycleState.noveltyScore,
      });

      const refreshedBundle = requireHubCaseBundle(
        await hubCaseService.queryHubCaseBundle(command.hubCoordinationCaseId),
        command.hubCoordinationCaseId,
      );
      const truthProjection = await upsertFallbackTruthProjection({
        hubCaseBundle: refreshedBundle,
        truthProjection: context.truthProjection,
        session: context.session,
        fallbackCard: context.fallbackCard,
        fallbackRecord: activeFallbackRecord,
        selectionSource: "return_to_practice",
        fallbackLinkState: "return_pending_link",
        patientVisibilityState: "fallback_visible",
        closureState: "blocked_by_fallback_linkage",
        offerState: context.session ? "superseded" : "not_used",
        offerActionabilityState: context.session ? "read_only_provenance" : "fallback_only",
        generatedAt: recordedAt,
      });
      let session = context.session;
      let fallbackCard = context.fallbackCard;
      if (context.session) {
          const preserved = await preserveOfferSessionAsReadOnlyProvenance({
            session: context.session,
            fallbackCard: context.fallbackCard,
            fallbackRecordId: activeFallbackRecord.hubFallbackRecordId,
            truthProjection,
            recordedAt,
            callbackMode: false,
        });
        session = preserved.session;
        fallbackCard = preserved.fallbackCard;
      }

      let exception: HubCoordinationExceptionSnapshot | null = null;
      let supervisorEscalation: HubFallbackSupervisorEscalationSnapshot | null = null;
      if (loopEscalated) {
          exception = await raiseException({
            hubCoordinationCaseId: command.hubCoordinationCaseId,
            hubFallbackRecordRef: activeFallbackRecord.hubFallbackRecordId,
            activeChildRef: returnRecord.hubReturnToPracticeRecordId,
            exceptionClass: "loop_prevention",
          reasonCode: "bounce_novelty_threshold_breached",
          truthProjectionRef: truthProjection.hubOfferToConfirmationTruthProjectionId,
          truthTupleHash: truthProjection.truthTupleHash,
          retryState: "waiting_manual",
          escalationState: "supervisor_review_required",
          details: {
            bounceCount: cycleState.bounceCount,
            noveltyScore: cycleState.noveltyScore,
          },
          recordedAt,
          sourceRefs,
        });
        supervisorEscalation = await createSupervisorEscalation({
          hubFallbackRecord: activeFallbackRecord,
          exception,
          bounceCount: cycleState.bounceCount,
          noveltyScore: cycleState.noveltyScore,
          recordedAt,
          sourceRefs,
        });
        const patchedFallback = updateFallbackRecord(
          activeFallbackRecord,
          {
            fallbackState: "supervisor_review_required",
            activeExceptionRef: exception.exceptionId,
            truthProjectionRef: truthProjection.hubOfferToConfirmationTruthProjectionId,
            truthTupleHash: truthProjection.truthTupleHash,
          },
          recordedAt,
        );
        await repositories.saveFallbackRecord(patchedFallback, {
          expectedVersion: activeFallbackRecord.version,
        });
        const patchedReturn = updateReturnToPracticeRecord(returnRecord, {
          returnState: "supervisor_review_required",
          reopenLifecycleState: "blocked",
        });
        await repositories.saveReturnToPracticeRecord(patchedReturn, {
          expectedVersion: returnRecord.version,
        });
        return {
          decision,
          fallbackRecord: patchedFallback,
          callbackFallbackRecord: null,
          returnToPracticeRecord: patchedReturn,
          cycleCounter: cycleState.cycleCounter,
          supervisorEscalation,
          exception,
          truthProjection,
          hubTransition,
          session,
          fallbackCard,
          route: "return_to_practice",
        };
      }

      return {
        decision,
        fallbackRecord: activeFallbackRecord,
        callbackFallbackRecord: null,
        returnToPracticeRecord: returnRecord,
        cycleCounter: cycleState.cycleCounter,
        supervisorEscalation: null,
        exception: null,
        truthProjection,
        hubTransition,
        session,
        fallbackCard,
        route: "return_to_practice",
      };
    },

    async linkCallbackFallback(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const fallbackRecord = await requireSnapshot(
        repositories.getFallbackRecord(command.hubFallbackRecordId),
        "HUB_FALLBACK_RECORD_NOT_FOUND",
        "HubFallbackRecord could not be found.",
      );
      invariant(
        fallbackRecord.callbackFallbackRef !== null,
        "CALLBACK_FALLBACK_RECORD_REQUIRED",
        "A callback fallback record is required before callback linkage can complete.",
      );
      const callbackFallbackRecord = await requireSnapshot(
        repositories.getCallbackFallbackRecord(fallbackRecord.callbackFallbackRef),
        "CALLBACK_FALLBACK_RECORD_NOT_FOUND",
        "CallbackFallbackRecord could not be found.",
      );
      const context = await currentContext(fallbackRecord.hubCoordinationCaseId);
      const bridgeResult = await callbackBridge.materializeCallbackLink({
        hubCoordinationCaseId: fallbackRecord.hubCoordinationCaseId,
        hubFallbackRecord: fallbackRecord,
        callbackFallbackRecord,
        hubCaseBundle: context.hubCaseBundle,
        recordedAt,
      });
      invariant(
        optionalRef(bridgeResult.callbackCaseRef) !== null,
        "CALLBACK_CASE_REQUIRED",
        "Callback linkage requires the current CallbackCase.",
      );
      invariant(
        optionalRef(bridgeResult.callbackExpectationEnvelopeRef) !== null,
        "CALLBACK_EXPECTATION_ENVELOPE_REQUIRED",
        "Callback linkage requires the current CallbackExpectationEnvelope.",
      );

      const patchedCallbackFallback = updateCallbackFallbackRecord(callbackFallbackRecord, {
        callbackState: "offered",
        callbackCaseRef: bridgeResult.callbackCaseRef,
        callbackExpectationEnvelopeRef: bridgeResult.callbackExpectationEnvelopeRef,
        linkedAt: bridgeResult.linkedAt ?? recordedAt,
        offeredAt: recordedAt,
      });
      await repositories.saveCallbackFallbackRecord(patchedCallbackFallback, {
        expectedVersion: callbackFallbackRecord.version,
      });

      const truthProjection = await upsertFallbackTruthProjection({
        hubCaseBundle: context.hubCaseBundle,
        truthProjection: context.truthProjection,
        session: context.session,
        fallbackCard: context.fallbackCard,
        fallbackRecord,
        selectionSource: "callback_fallback",
        fallbackLinkState: "callback_linked",
        patientVisibilityState: "fallback_visible",
        closureState: "closable",
        offerState: context.truthProjection?.offerState ?? "declined",
        offerActionabilityState:
          context.truthProjection?.offerActionabilityState ?? "read_only_provenance",
        generatedAt: recordedAt,
      });
      if (context.session) {
        const patchedSession = updateAlternativeOfferSession(context.session, {
          truthTupleHash: truthProjection.truthTupleHash,
        });
        await offerRepositories.saveSession(patchedSession, {
          expectedVersion: context.session.version,
        });
      }

      const patchedFallback = updateFallbackRecord(
        fallbackRecord,
        {
          fallbackState: "transferred",
          transferredAt: recordedAt,
          truthProjectionRef: truthProjection.hubOfferToConfirmationTruthProjectionId,
          truthTupleHash: truthProjection.truthTupleHash,
        },
        recordedAt,
      );
      await repositories.saveFallbackRecord(patchedFallback, {
        expectedVersion: fallbackRecord.version,
      });

      const hubTransition = await hubCaseService.markCallbackOffered({
        hubCoordinationCaseId: fallbackRecord.hubCoordinationCaseId,
        actorRef: command.actorRef,
        routeIntentBindingRef: command.routeIntentBindingRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        recordedAt,
        reasonCode: "callback_linked",
        expectedOwnershipEpoch: context.hubCaseBundle.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken:
          context.hubCaseBundle.hubCase.ownerState === "unclaimed"
            ? undefined
            : context.hubCaseBundle.hubCase.ownershipFenceToken,
        callbackExpectationRef: requireRef(
          bridgeResult.callbackExpectationEnvelopeRef,
          "callbackExpectationEnvelopeRef",
        ),
      });

      return {
        fallbackRecord: patchedFallback,
        callbackFallbackRecord: patchedCallbackFallback,
        truthProjection,
        hubTransition,
      };
    },

    async linkReturnToPractice(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const fallbackRecord = await requireSnapshot(
        repositories.getFallbackRecord(command.hubFallbackRecordId),
        "HUB_FALLBACK_RECORD_NOT_FOUND",
        "HubFallbackRecord could not be found.",
      );
      invariant(
        fallbackRecord.returnToPracticeRef !== null,
        "RETURN_TO_PRACTICE_RECORD_REQUIRED",
        "A return-to-practice record is required before reopen linkage can complete.",
      );
      const returnToPracticeRecord = await requireSnapshot(
        repositories.getReturnToPracticeRecord(fallbackRecord.returnToPracticeRef),
        "RETURN_TO_PRACTICE_RECORD_NOT_FOUND",
        "HubReturnToPracticeRecord could not be found.",
      );
      const context = await currentContext(fallbackRecord.hubCoordinationCaseId);
      const bridgeResult = await practiceReopenBridge.materializePracticeReopen({
        hubCoordinationCaseId: fallbackRecord.hubCoordinationCaseId,
        hubFallbackRecord: fallbackRecord,
        returnToPracticeRecord,
        hubCaseBundle: context.hubCaseBundle,
        recordedAt,
      });
      invariant(
        optionalRef(bridgeResult.reopenedWorkflowRef) !== null,
        "RETURN_REOPEN_WORKFLOW_REQUIRED",
        "Return-to-practice linkage requires a durable downstream workflow reference.",
      );
      invariant(
        optionalRef(bridgeResult.reopenedLineageCaseLinkRef) !== null,
        "RETURN_REOPEN_LINEAGE_REQUIRED",
        "Return-to-practice linkage requires the governed downstream lineage reference.",
      );

      const patchedReturn = updateReturnToPracticeRecord(returnToPracticeRecord, {
        returnState: "linked",
        reopenedWorkflowRef: bridgeResult.reopenedWorkflowRef,
        reopenedLineageCaseLinkRef: bridgeResult.reopenedLineageCaseLinkRef,
        reopenedLeaseRef: bridgeResult.reopenedLeaseRef,
        reopenLifecycleState: "linked",
        linkedAt: bridgeResult.linkedAt ?? recordedAt,
      });
      await repositories.saveReturnToPracticeRecord(patchedReturn, {
        expectedVersion: returnToPracticeRecord.version,
      });

      const truthProjection = await upsertFallbackTruthProjection({
        hubCaseBundle: context.hubCaseBundle,
        truthProjection: context.truthProjection,
        session: context.session,
        fallbackCard: context.fallbackCard,
        fallbackRecord,
        selectionSource: "return_to_practice",
        fallbackLinkState: "return_linked",
        patientVisibilityState: "fallback_visible",
        closureState: "closable",
        offerState: context.truthProjection?.offerState ?? "superseded",
        offerActionabilityState:
          context.truthProjection?.offerActionabilityState ?? "read_only_provenance",
        generatedAt: recordedAt,
      });
      if (context.session) {
        const patchedSession = updateAlternativeOfferSession(context.session, {
          truthTupleHash: truthProjection.truthTupleHash,
        });
        await offerRepositories.saveSession(patchedSession, {
          expectedVersion: context.session.version,
        });
      }

      const patchedFallback = updateFallbackRecord(
        fallbackRecord,
        {
          fallbackState: "transferred",
          transferredAt: recordedAt,
          truthProjectionRef: truthProjection.hubOfferToConfirmationTruthProjectionId,
          truthTupleHash: truthProjection.truthTupleHash,
        },
        recordedAt,
      );
      await repositories.saveFallbackRecord(patchedFallback, {
        expectedVersion: fallbackRecord.version,
      });

      return {
        fallbackRecord: patchedFallback,
        returnToPracticeRecord: patchedReturn,
        truthProjection,
      };
    },

    async completeHubFallback(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const fallbackRecord = await requireSnapshot(
        repositories.getFallbackRecord(command.hubFallbackRecordId),
        "HUB_FALLBACK_RECORD_NOT_FOUND",
        "HubFallbackRecord could not be found.",
      );
      invariant(
        fallbackRecord.fallbackState === "transferred" || fallbackRecord.fallbackState === "completed",
        "FALLBACK_NOT_TRANSFERRED",
        "Hub fallback may complete only after downstream linkage is durable.",
      );
      const patchedFallback = updateFallbackRecord(
        fallbackRecord,
        {
          fallbackState: "completed",
          completedAt: recordedAt,
        },
        recordedAt,
      );
      await repositories.saveFallbackRecord(patchedFallback, {
        expectedVersion: fallbackRecord.version,
      });

      if (!command.closeHubCase) {
        return {
          fallbackRecord: patchedFallback,
          releasedCase: null,
          closedCase: null,
        };
      }

      const context = await currentContext(fallbackRecord.hubCoordinationCaseId);
      const releasedCase = await hubCaseService.releaseHubCase({
        hubCoordinationCaseId: fallbackRecord.hubCoordinationCaseId,
        actorRef: command.actorRef,
        routeIntentBindingRef: command.routeIntentBindingRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        recordedAt,
        reasonCode: "fallback_completed_release",
        expectedOwnershipEpoch: context.hubCaseBundle.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken:
          context.hubCaseBundle.hubCase.ownerState === "unclaimed"
            ? undefined
            : context.hubCaseBundle.hubCase.ownershipFenceToken,
        carriedOpenCaseBlockerRefs: [],
      });
      const closeRecordedAt = new Date(Date.parse(recordedAt) + 60_000).toISOString();
      const closedCase = await hubCaseService.closeHubCase({
        hubCoordinationCaseId: fallbackRecord.hubCoordinationCaseId,
        actorRef: command.actorRef,
        routeIntentBindingRef: command.routeIntentBindingRef,
        commandActionRecordRef: `${command.commandActionRecordRef}_close`,
        commandSettlementRecordRef: `${command.commandSettlementRecordRef}_close`,
        recordedAt: closeRecordedAt,
        reasonCode: "fallback_completed_close",
        expectedOwnershipEpoch: releasedCase.hubCase.ownershipEpoch,
        closeDecisionRef: requireRef(command.closeDecisionRef, "closeDecisionRef"),
        carriedOpenCaseBlockerRefs: [],
      });
      return {
        fallbackRecord: patchedFallback,
        releasedCase,
        closedCase,
      };
    },

    async raiseHubCoordinationException(command) {
      return raiseException(command);
    },

    async resolveHubCoordinationException(exceptionId, resolvedAt) {
      const current = await requireSnapshot(
        repositories.getHubCoordinationException(exceptionId),
        "HUB_COORDINATION_EXCEPTION_NOT_FOUND",
        "HubCoordinationException could not be found.",
      );
      const patched = updateHubCoordinationException(
        current,
        {
          exceptionState: "resolved",
          retryState: "closed",
          escalationState:
            current.escalationState === "none" ? "closed" : "supervisor_reviewed",
          resolvedAt: ensureIsoTimestamp(resolvedAt, "resolvedAt"),
        },
        ensureIsoTimestamp(resolvedAt, "resolvedAt"),
      );
      await repositories.saveHubCoordinationException(patched, {
        expectedVersion: current.version,
      });
      return patched;
    },
  };
}
