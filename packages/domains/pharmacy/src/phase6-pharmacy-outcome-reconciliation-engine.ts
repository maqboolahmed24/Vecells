import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import {
  createAssimilationSafetyServices,
  createAssimilationSafetyStore,
  type AssimilationSafetyDependencies,
  type ClassificationInput,
  type EvidenceAssimilationSettlement,
  type MaterialDeltaInput,
  type SafetyEvaluationInput,
} from "@vecells/domain-intake-safety";

import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  type AggregateRef,
  type Phase6PharmacyCaseKernelService,
  type PharmacyCaseSnapshot,
  type PharmacyOutcomeDisposition,
  type PharmacyServiceType,
} from "./phase6-pharmacy-case-kernel";
import {
  createPhase6PharmacyDirectoryChoiceStore,
  type Phase6PharmacyDirectoryChoiceRepositories,
  type PharmacyConsentCheckpoint,
  type PharmacyConsentCheckpointState,
  type PharmacyProvider,
} from "./phase6-pharmacy-directory-choice-engine";
import {
  createPhase6PharmacyDispatchStore,
  type Phase6PharmacyDispatchRepositories,
  type PharmacyDispatchAttemptSnapshot,
  type PharmacyDispatchTruthProjectionSnapshot,
} from "./phase6-pharmacy-dispatch-engine";
import type { PharmacyOutcomeTruthProjectionSnapshot } from "./phase6-pharmacy-patient-status-engine";
import {
  createPhase6PharmacyReferralPackageStore,
  type Phase6PharmacyReferralPackageRepositories,
  type PharmacyCorrelationRecordSnapshot,
} from "./phase6-pharmacy-referral-package-engine";

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_344 =
  "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts" as const;
const TASK_352 =
  "par_352_phase6_track_backend_build_pharmacy_outcome_ingest_update_record_observation_and_reconciliation_pipeline" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task344 = typeof TASK_344;
type Task352 = typeof TASK_352;

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

class StoredDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function requireText(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function optionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireText(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1 inclusive.`,
  );
  return Number(value.toFixed(6));
}

function ensureInteger(value: number, field: string): number {
  invariant(Number.isInteger(value), `INVALID_${field.toUpperCase()}`, `${field} must be an integer.`);
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function latestIso(...values: Array<string | null | undefined>): string | null {
  const normalized = values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort(compareIso);
  return normalized.length === 0 ? null : normalized[normalized.length - 1]!;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function stableStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
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
      row.version > current.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, structuredClone(row));
}

function makeRef<TTarget extends string, TOwner extends string>(
  targetFamily: TTarget,
  refId: string,
  ownerTask: TOwner,
): AggregateRef<TTarget, TOwner> {
  return {
    targetFamily,
    refId: requireText(refId, `${targetFamily}.refId`),
    ownerTask,
  };
}

function stableProjectionId(prefix: string, input: unknown): string {
  return `${prefix}_${sha256Hex(stableStringify(input)).slice(0, 16)}`;
}

function minutesBetween(left: string, right: string): number {
  return Math.abs(Date.parse(left) - Date.parse(right)) / 60_000;
}

function expDecay(minutes: number, tau: number): number {
  return Math.exp(-Math.abs(minutes) / Math.max(tau, 1));
}

export type PharmacyOutcomeSourceType =
  | "gp_workflow_observation"
  | "direct_structured_message"
  | "email_ingest"
  | "manual_structured_capture";

export type PharmacyOutcomeTrustClass =
  | "trusted_structured"
  | "trusted_observed"
  | "email_low_assurance"
  | "manual_operator_entered";

export type PharmacyOutcomeDecisionClass =
  | "exact_replay"
  | "semantic_replay"
  | "collision_review"
  | "distinct";

export type PharmacyOutcomeDedupeState = "new" | "duplicate" | "collision_review";

export type PharmacyOutcomeClassificationState =
  | "advice_only"
  | "medicine_supplied"
  | "resolved_no_supply"
  | "onward_referral"
  | "urgent_gp_action"
  | "unable_to_contact"
  | "pharmacy_unable_to_complete"
  | "unmatched";

export type PharmacyOutcomeMatchState = "strong_match" | "review_required" | "unmatched";

export type PharmacyOutcomeManualReviewState =
  | "none"
  | "required"
  | "in_review"
  | "approved_apply"
  | "approved_reopen"
  | "approved_unmatched";

export type PharmacyOutcomeIngestSettlementState =
  | "unsettled"
  | "duplicate_ignored"
  | "review_required"
  | "resolved_pending_projection"
  | "reopened_for_safety"
  | "unmatched";

export type PharmacyOutcomeGateState =
  | "open"
  | "in_review"
  | "resolved_apply"
  | "resolved_reopen"
  | "resolved_unmatched"
  | "superseded";

export type PharmacyOutcomeBlockingClosureState = "blocks_close" | "operational_only";

export type PharmacyOutcomeGatePatientVisibilityState = "review_placeholder" | "hidden";

export type PharmacyOutcomeSettlementResult =
  | "resolved_pending_projection"
  | "reopened_for_safety"
  | "review_required"
  | "unmatched"
  | "duplicate_ignored";

export type PharmacyOutcomeMatchConfidenceBand = "high" | "medium" | "low";

export type PharmacyOutcomeCloseEligibilityState =
  | "blocked_by_reconciliation"
  | "blocked_by_safety"
  | "eligible_pending_projection"
  | "not_closable";

export interface OutcomeEvidenceEnvelopeSnapshot {
  outcomeEvidenceEnvelopeId: string;
  sourceType: PharmacyOutcomeSourceType;
  sourceMessageKey: string;
  rawPayloadHash: string;
  semanticPayloadHash: string;
  replayKey: string;
  decisionClass: PharmacyOutcomeDecisionClass;
  parserVersion: string;
  receivedAt: string;
  trustClass: PharmacyOutcomeTrustClass;
  correlationRefs: readonly string[];
  dedupeState: PharmacyOutcomeDedupeState;
  version: number;
}

export interface PharmacyOutcomeSourceProvenanceSnapshot {
  outcomeSourceProvenanceId: string;
  outcomeEvidenceEnvelopeRef: AggregateRef<"OutcomeEvidenceEnvelope", Task343>;
  senderIdentityRef: string | null;
  inboundTransportFamily: string | null;
  inboundChannelRef: string | null;
  trustedCorrelationFragments: readonly string[];
  gpWorkflowIdentifiers: readonly string[];
  parserAssumptionRefs: readonly string[];
  degradedFieldRefs: readonly string[];
  fieldOriginRefs: readonly string[];
  rawPayloadRef: string | null;
  recordedAt: string;
  version: number;
}

export interface NormalizedPharmacyOutcomeEvidenceSnapshot {
  normalizedPharmacyOutcomeEvidenceId: string;
  outcomeEvidenceEnvelopeRef: AggregateRef<"OutcomeEvidenceEnvelope", Task343>;
  classificationState: PharmacyOutcomeClassificationState;
  outcomeAt: string;
  patientRefId: string | null;
  providerRefId: string | null;
  providerOdsCode: string | null;
  serviceType: PharmacyServiceType | null;
  trustedCorrelationRefs: readonly string[];
  sourceFloor: number;
  transportHintRefs: readonly string[];
  routeIntentTupleHash: string | null;
  rawPayloadRef: string | null;
  version: number;
}

export interface PharmacyOutcomeMatchScorecardSnapshot {
  pharmacyOutcomeMatchScorecardId: string;
  ingestAttemptRef: AggregateRef<"PharmacyOutcomeIngestAttempt", Task343>;
  policyVersionRef: string;
  thresholdFamilyRefs: readonly string[];
  candidateCaseRef: AggregateRef<"PharmacyCase", Task342> | null;
  runnerUpCaseRef: AggregateRef<"PharmacyCase", Task342> | null;
  mPatient: number;
  mProvider: number;
  mService: number;
  mTime: number;
  mTransport: number;
  mContra: number;
  sourceFloor: number;
  rawMatch: number;
  matchScore: number;
  runnerUpMatchScore: number;
  posteriorMatchConfidence: number;
  deltaToRunnerUp: number;
  hardFloorSatisfied: boolean;
  autoApplyThresholdSatisfied: boolean;
  calculatedAt: string;
  version: number;
}

export interface PharmacyOutcomeIngestAttemptSnapshot {
  ingestAttemptId: string;
  outcomeEvidenceEnvelopeRef: AggregateRef<"OutcomeEvidenceEnvelope", Task343>;
  pharmacyCaseId: string | null;
  bestCandidateCaseRef: AggregateRef<"PharmacyCase", Task342> | null;
  runnerUpCaseRef: AggregateRef<"PharmacyCase", Task342> | null;
  matchState: PharmacyOutcomeMatchState;
  matchScore: number;
  runnerUpMatchScore: number;
  posteriorMatchConfidence: number;
  contradictionScore: number;
  classificationState: PharmacyOutcomeClassificationState;
  replayState: PharmacyOutcomeDecisionClass;
  manualReviewState: PharmacyOutcomeManualReviewState;
  outcomeReconciliationGateRef:
    AggregateRef<"PharmacyOutcomeReconciliationGate", Task343> | null;
  autoApplyEligible: boolean;
  closeEligibilityState: PharmacyOutcomeCloseEligibilityState;
  settlementState: PharmacyOutcomeIngestSettlementState;
  createdAt: string;
  settledAt: string | null;
  version: number;
}

export interface PharmacyOutcomeReconciliationGateSnapshot {
  outcomeReconciliationGateId: string;
  pharmacyCaseId: string;
  ingestAttemptRef: AggregateRef<"PharmacyOutcomeIngestAttempt", Task343>;
  outcomeEvidenceEnvelopeRef: AggregateRef<"OutcomeEvidenceEnvelope", Task343>;
  candidateCaseRef: AggregateRef<"PharmacyCase", Task342>;
  runnerUpCaseRef: AggregateRef<"PharmacyCase", Task342> | null;
  matchScore: number;
  runnerUpMatchScore: number;
  posteriorMatchConfidence: number;
  contradictionScore: number;
  classificationState: PharmacyOutcomeClassificationState;
  gateState: PharmacyOutcomeGateState;
  manualReviewState: Exclude<PharmacyOutcomeManualReviewState, "none"> | "dismissed";
  blockingClosureState: PharmacyOutcomeBlockingClosureState;
  patientVisibilityState: PharmacyOutcomeGatePatientVisibilityState;
  currentOwnerRef: string;
  resolutionNotesRef: string | null;
  openedAt: string;
  resolvedAt: string | null;
  version: number;
}

export interface PharmacyOutcomeSettlementSnapshot {
  settlementId: string;
  pharmacyCaseId: string;
  ingestAttemptId: string;
  consentCheckpointRef: AggregateRef<"PharmacyConsentCheckpoint", Task343> | null;
  outcomeReconciliationGateRef:
    AggregateRef<"PharmacyOutcomeReconciliationGate", Task343> | null;
  result: PharmacyOutcomeSettlementResult;
  matchConfidenceBand: PharmacyOutcomeMatchConfidenceBand;
  closeEligibilityState: PharmacyOutcomeCloseEligibilityState;
  receiptTextRef: string;
  experienceContinuityEvidenceRef: string;
  causalToken: string;
  recoveryRouteRef: string | null;
  recordedAt: string;
  version: number;
}

export interface PharmacyOutcomeAuditEventSnapshot {
  pharmacyOutcomeAuditEventId: string;
  pharmacyCaseId: string | null;
  ingestAttemptId: string | null;
  outcomeReconciliationGateId: string | null;
  settlementId: string | null;
  eventName: string;
  actorRef: string | null;
  payloadDigest: string;
  recordedAt: string;
  version: number;
}

export interface PharmacyOutcomeReviewDebtItem {
  pharmacyCaseId: string | null;
  ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot;
  reconciliationGate: PharmacyOutcomeReconciliationGateSnapshot | null;
  closeBlockerRefs: readonly string[];
}

export interface Phase6PharmacyOutcomeTruthProjectionRepositories {
  getOutcomeTruthProjection(
    pharmacyOutcomeTruthProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyOutcomeTruthProjectionSnapshot> | null>;
  getCurrentOutcomeTruthProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyOutcomeTruthProjectionSnapshot> | null>;
  saveOutcomeTruthProjection(
    snapshot: PharmacyOutcomeTruthProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface Phase6PharmacyOutcomeRepositories
  extends Phase6PharmacyOutcomeTruthProjectionRepositories {
  getOutcomeEvidenceEnvelope(
    outcomeEvidenceEnvelopeId: string,
  ): Promise<SnapshotDocument<OutcomeEvidenceEnvelopeSnapshot> | null>;
  listOutcomeEvidenceEnvelopes(): Promise<readonly SnapshotDocument<OutcomeEvidenceEnvelopeSnapshot>[]>;
  saveOutcomeEvidenceEnvelope(
    snapshot: OutcomeEvidenceEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getOutcomeSourceProvenance(
    outcomeSourceProvenanceId: string,
  ): Promise<SnapshotDocument<PharmacyOutcomeSourceProvenanceSnapshot> | null>;
  saveOutcomeSourceProvenance(
    snapshot: PharmacyOutcomeSourceProvenanceSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getNormalizedOutcomeEvidence(
    normalizedPharmacyOutcomeEvidenceId: string,
  ): Promise<SnapshotDocument<NormalizedPharmacyOutcomeEvidenceSnapshot> | null>;
  getNormalizedOutcomeEvidenceByEnvelope(
    outcomeEvidenceEnvelopeId: string,
  ): Promise<SnapshotDocument<NormalizedPharmacyOutcomeEvidenceSnapshot> | null>;
  saveNormalizedOutcomeEvidence(
    snapshot: NormalizedPharmacyOutcomeEvidenceSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getOutcomeMatchScorecard(
    pharmacyOutcomeMatchScorecardId: string,
  ): Promise<SnapshotDocument<PharmacyOutcomeMatchScorecardSnapshot> | null>;
  saveOutcomeMatchScorecard(
    snapshot: PharmacyOutcomeMatchScorecardSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getOutcomeIngestAttempt(
    ingestAttemptId: string,
  ): Promise<SnapshotDocument<PharmacyOutcomeIngestAttemptSnapshot> | null>;
  listOutcomeIngestAttemptsByCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyOutcomeIngestAttemptSnapshot>[]>;
  listOutcomeIngestAttempts(): Promise<readonly SnapshotDocument<PharmacyOutcomeIngestAttemptSnapshot>[]>;
  saveOutcomeIngestAttempt(
    snapshot: PharmacyOutcomeIngestAttemptSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getOutcomeReconciliationGate(
    outcomeReconciliationGateId: string,
  ): Promise<SnapshotDocument<PharmacyOutcomeReconciliationGateSnapshot> | null>;
  getCurrentOutcomeReconciliationGateForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyOutcomeReconciliationGateSnapshot> | null>;
  listOutcomeReconciliationGates(): Promise<
    readonly SnapshotDocument<PharmacyOutcomeReconciliationGateSnapshot>[]
  >;
  saveOutcomeReconciliationGate(
    snapshot: PharmacyOutcomeReconciliationGateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getOutcomeSettlement(
    settlementId: string,
  ): Promise<SnapshotDocument<PharmacyOutcomeSettlementSnapshot> | null>;
  getCurrentOutcomeSettlementForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyOutcomeSettlementSnapshot> | null>;
  listOutcomeSettlementsByCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyOutcomeSettlementSnapshot>[]>;
  saveOutcomeSettlement(
    snapshot: PharmacyOutcomeSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listOutcomeAuditEventsByCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyOutcomeAuditEventSnapshot>[]>;
  appendOutcomeAuditEvent(snapshot: PharmacyOutcomeAuditEventSnapshot): Promise<void>;
}

export interface Phase6PharmacyOutcomeStore extends Phase6PharmacyOutcomeRepositories {}

export function createPhase6PharmacyOutcomeStore(): Phase6PharmacyOutcomeStore {
  const envelopes = new Map<string, OutcomeEvidenceEnvelopeSnapshot>();
  const provenance = new Map<string, PharmacyOutcomeSourceProvenanceSnapshot>();
  const normalizedEvidence = new Map<string, NormalizedPharmacyOutcomeEvidenceSnapshot>();
  const normalizedByEnvelope = new Map<string, string>();
  const matchScorecards = new Map<string, PharmacyOutcomeMatchScorecardSnapshot>();
  const ingestAttempts = new Map<string, PharmacyOutcomeIngestAttemptSnapshot>();
  const attemptIdsByCase = new Map<string, string[]>();
  const reconciliationGates = new Map<string, PharmacyOutcomeReconciliationGateSnapshot>();
  const currentGateByCase = new Map<string, string>();
  const settlements = new Map<string, PharmacyOutcomeSettlementSnapshot>();
  const currentSettlementByCase = new Map<string, string>();
  const settlementIdsByCase = new Map<string, string[]>();
  const outcomeTruth = new Map<string, PharmacyOutcomeTruthProjectionSnapshot>();
  const currentOutcomeTruthByCase = new Map<string, string>();
  const auditEvents = new Map<string | null, PharmacyOutcomeAuditEventSnapshot[]>();

  function appendIndex(index: Map<string, string[]>, key: string, value: string): void {
    const current = index.get(key) ?? [];
    if (!current.includes(value)) {
      index.set(key, [...current, value]);
    }
  }

  return {
    async getOutcomeEvidenceEnvelope(outcomeEvidenceEnvelopeId) {
      const snapshot = envelopes.get(outcomeEvidenceEnvelopeId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listOutcomeEvidenceEnvelopes() {
      return [...envelopes.values()]
        .sort((left, right) => compareIso(left.receivedAt, right.receivedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveOutcomeEvidenceEnvelope(snapshot, options) {
      saveWithCas(envelopes, snapshot.outcomeEvidenceEnvelopeId, snapshot, options);
    },

    async getOutcomeSourceProvenance(outcomeSourceProvenanceId) {
      const snapshot = provenance.get(outcomeSourceProvenanceId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async saveOutcomeSourceProvenance(snapshot, options) {
      saveWithCas(provenance, snapshot.outcomeSourceProvenanceId, snapshot, options);
    },

    async getNormalizedOutcomeEvidence(normalizedPharmacyOutcomeEvidenceId) {
      const snapshot = normalizedEvidence.get(normalizedPharmacyOutcomeEvidenceId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getNormalizedOutcomeEvidenceByEnvelope(outcomeEvidenceEnvelopeId) {
      const normalizedId = normalizedByEnvelope.get(outcomeEvidenceEnvelopeId);
      return normalizedId ? new StoredDocument(normalizedEvidence.get(normalizedId)!) : null;
    },

    async saveNormalizedOutcomeEvidence(snapshot, options) {
      saveWithCas(
        normalizedEvidence,
        snapshot.normalizedPharmacyOutcomeEvidenceId,
        snapshot,
        options,
      );
      normalizedByEnvelope.set(
        snapshot.outcomeEvidenceEnvelopeRef.refId,
        snapshot.normalizedPharmacyOutcomeEvidenceId,
      );
    },

    async getOutcomeMatchScorecard(pharmacyOutcomeMatchScorecardId) {
      const snapshot = matchScorecards.get(pharmacyOutcomeMatchScorecardId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async saveOutcomeMatchScorecard(snapshot, options) {
      saveWithCas(matchScorecards, snapshot.pharmacyOutcomeMatchScorecardId, snapshot, options);
    },

    async getOutcomeIngestAttempt(ingestAttemptId) {
      const snapshot = ingestAttempts.get(ingestAttemptId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listOutcomeIngestAttemptsByCase(pharmacyCaseId) {
      return (attemptIdsByCase.get(pharmacyCaseId) ?? [])
        .map((attemptId) => ingestAttempts.get(attemptId)!)
        .sort((left, right) => compareIso(left.createdAt, right.createdAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async listOutcomeIngestAttempts() {
      return [...ingestAttempts.values()]
        .sort((left, right) => compareIso(left.createdAt, right.createdAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveOutcomeIngestAttempt(snapshot, options) {
      saveWithCas(ingestAttempts, snapshot.ingestAttemptId, snapshot, options);
      if (snapshot.pharmacyCaseId) {
        appendIndex(attemptIdsByCase, snapshot.pharmacyCaseId, snapshot.ingestAttemptId);
      }
    },

    async getOutcomeReconciliationGate(outcomeReconciliationGateId) {
      const snapshot = reconciliationGates.get(outcomeReconciliationGateId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentOutcomeReconciliationGateForCase(pharmacyCaseId) {
      const gateId = currentGateByCase.get(pharmacyCaseId);
      return gateId ? new StoredDocument(reconciliationGates.get(gateId)!) : null;
    },

    async listOutcomeReconciliationGates() {
      return [...reconciliationGates.values()]
        .sort((left, right) => compareIso(left.openedAt, right.openedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveOutcomeReconciliationGate(snapshot, options) {
      saveWithCas(
        reconciliationGates,
        snapshot.outcomeReconciliationGateId,
        snapshot,
        options,
      );
      currentGateByCase.set(snapshot.pharmacyCaseId, snapshot.outcomeReconciliationGateId);
      if (snapshot.resolvedAt !== null || snapshot.gateState === "superseded") {
        const currentId = currentGateByCase.get(snapshot.pharmacyCaseId);
        if (currentId === snapshot.outcomeReconciliationGateId) {
          currentGateByCase.delete(snapshot.pharmacyCaseId);
        }
      }
    },

    async getOutcomeSettlement(settlementId) {
      const snapshot = settlements.get(settlementId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentOutcomeSettlementForCase(pharmacyCaseId) {
      const settlementId = currentSettlementByCase.get(pharmacyCaseId);
      return settlementId ? new StoredDocument(settlements.get(settlementId)!) : null;
    },

    async listOutcomeSettlementsByCase(pharmacyCaseId) {
      return (settlementIdsByCase.get(pharmacyCaseId) ?? [])
        .map((settlementId) => settlements.get(settlementId)!)
        .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveOutcomeSettlement(snapshot, options) {
      saveWithCas(settlements, snapshot.settlementId, snapshot, options);
      currentSettlementByCase.set(snapshot.pharmacyCaseId, snapshot.settlementId);
      appendIndex(settlementIdsByCase, snapshot.pharmacyCaseId, snapshot.settlementId);
    },

    async getOutcomeTruthProjection(pharmacyOutcomeTruthProjectionId) {
      const snapshot = outcomeTruth.get(pharmacyOutcomeTruthProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentOutcomeTruthProjectionForCase(pharmacyCaseId) {
      const projectionId = currentOutcomeTruthByCase.get(pharmacyCaseId);
      return projectionId ? new StoredDocument(outcomeTruth.get(projectionId)!) : null;
    },

    async saveOutcomeTruthProjection(snapshot, options) {
      saveWithCas(
        outcomeTruth,
        snapshot.pharmacyOutcomeTruthProjectionId,
        snapshot,
        options,
      );
      currentOutcomeTruthByCase.set(snapshot.pharmacyCaseId, snapshot.pharmacyOutcomeTruthProjectionId);
    },

    async listOutcomeAuditEventsByCase(pharmacyCaseId) {
      return (auditEvents.get(pharmacyCaseId) ?? [])
        .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async appendOutcomeAuditEvent(snapshot) {
      const key = snapshot.pharmacyCaseId;
      const current = auditEvents.get(key) ?? [];
      auditEvents.set(key, [...current, structuredClone(snapshot)]);
    },
  };
}

export interface PharmacyOutcomeMatchingPolicySnapshot {
  policyVersionRef: string;
  thresholdFamilyRefs: readonly string[];
  tauPatientFloor: number;
  tauServiceFloor: number;
  tauRouteFloor: number;
  tauMatchTimeMinutes: number;
  epsilon: number;
  omegaPatient: number;
  omegaProvider: number;
  omegaService: number;
  omegaTime: number;
  omegaTransport: number;
  lambdaMatchContra: number;
  kappaMatch: number;
  tauStrongMatch: number;
  tauPosteriorStrong: number;
  deltaMatch: number;
  tauContraApply: number;
  trustSourceFloor: Readonly<Record<PharmacyOutcomeTrustClass, number>>;
  autoApplyByTrustClass: Readonly<Record<PharmacyOutcomeTrustClass, boolean>>;
  lowAssuranceTrustedCorrelationDirectApply: boolean;
}

export const defaultPharmacyOutcomeMatchingPolicy = {
  policyVersionRef: "phase6.pharmacy.outcome.reconciliation.v1",
  thresholdFamilyRefs: [
    "tau_patient_floor",
    "tau_service_floor",
    "tau_route_floor",
    "tau_match_time",
    "tau_strong_match",
    "tau_posterior_strong",
    "delta_match",
    "tau_contra_apply",
  ],
  tauPatientFloor: 0.55,
  tauServiceFloor: 0.7,
  tauRouteFloor: 0.65,
  tauMatchTimeMinutes: 720,
  epsilon: 0.01,
  omegaPatient: 0.34,
  omegaProvider: 0.22,
  omegaService: 0.16,
  omegaTime: 0.14,
  omegaTransport: 0.14,
  lambdaMatchContra: 1.25,
  kappaMatch: 7.5,
  tauStrongMatch: 0.74,
  tauPosteriorStrong: 0.72,
  deltaMatch: 0.12,
  tauContraApply: 0.2,
  trustSourceFloor: {
    trusted_structured: 0.98,
    trusted_observed: 0.94,
    email_low_assurance: 0.62,
    manual_operator_entered: 0.58,
  },
  autoApplyByTrustClass: {
    trusted_structured: true,
    trusted_observed: true,
    email_low_assurance: false,
    manual_operator_entered: false,
  },
  lowAssuranceTrustedCorrelationDirectApply: true,
} as const satisfies PharmacyOutcomeMatchingPolicySnapshot;

export interface ParsePharmacyOutcomeEvidenceInput {
  sourceType: PharmacyOutcomeSourceType;
  sourceMessageKey?: string | null;
  rawPayload: unknown;
  receivedAt: string;
  parserVersion?: string | null;
  senderIdentityRef?: string | null;
  inboundTransportFamily?: string | null;
  inboundChannelRef?: string | null;
}

export interface ParsedPharmacyOutcomeEvidence {
  envelope: Omit<OutcomeEvidenceEnvelopeSnapshot, "outcomeEvidenceEnvelopeId" | "decisionClass" | "dedupeState" | "version">;
  normalized: Omit<
    NormalizedPharmacyOutcomeEvidenceSnapshot,
    "normalizedPharmacyOutcomeEvidenceId" | "outcomeEvidenceEnvelopeRef" | "version"
  >;
  provenance: Omit<
    PharmacyOutcomeSourceProvenanceSnapshot,
    "outcomeSourceProvenanceId" | "outcomeEvidenceEnvelopeRef" | "version"
  >;
}

export interface PharmacyOutcomeSourceRegistry {
  parse(input: ParsePharmacyOutcomeEvidenceInput): ParsedPharmacyOutcomeEvidence;
}

function sourceTrustClass(sourceType: PharmacyOutcomeSourceType): PharmacyOutcomeTrustClass {
  switch (sourceType) {
    case "direct_structured_message":
      return "trusted_structured";
    case "gp_workflow_observation":
      return "trusted_observed";
    case "email_ingest":
      return "email_low_assurance";
    case "manual_structured_capture":
      return "manual_operator_entered";
  }
}

function normalizeClassification(rawPayload: Record<string, unknown>): PharmacyOutcomeClassificationState {
  const direct = optionalText(rawPayload.classificationState as string | undefined);
  if (
    direct &&
    [
      "advice_only",
      "medicine_supplied",
      "resolved_no_supply",
      "onward_referral",
      "urgent_gp_action",
      "unable_to_contact",
      "pharmacy_unable_to_complete",
      "unmatched",
    ].includes(direct)
  ) {
    return direct as PharmacyOutcomeClassificationState;
  }
  if (rawPayload.urgentGpAction === true) {
    return "urgent_gp_action";
  }
  if (rawPayload.onwardReferral === true) {
    return "onward_referral";
  }
  if (rawPayload.unableToContact === true) {
    return "unable_to_contact";
  }
  if (rawPayload.pharmacyUnableToComplete === true) {
    return "pharmacy_unable_to_complete";
  }
  if (rawPayload.medicineSupplied === true) {
    return "medicine_supplied";
  }
  if (rawPayload.resolvedNoSupply === true) {
    return "resolved_no_supply";
  }
  return "advice_only";
}

function normalizeServiceType(rawPayload: Record<string, unknown>): PharmacyServiceType | null {
  const direct = optionalText(rawPayload.serviceType as string | undefined);
  if (
    direct === "clinical_pathway_consultation" ||
    direct === "minor_illness_fallback"
  ) {
    return direct;
  }
  return null;
}

function normalizeCorrelationRefs(rawPayload: Record<string, unknown>): string[] {
  const refs: string[] = [];
  const arrayRefs = Array.isArray(rawPayload.correlationRefs)
    ? (rawPayload.correlationRefs as unknown[])
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
    : [];
  refs.push(...arrayRefs);
  for (const key of [
    "correlationId",
    "packageId",
    "dispatchAttemptId",
    "routeIntentTupleHash",
    "outboundReference",
    "outboundReferenceSetHash",
  ]) {
    const value = optionalText(rawPayload[key] as string | undefined);
    if (value) {
      refs.push(value);
    }
  }
  return uniqueSorted(refs);
}

function buildSemanticPayload(input: {
  sourceType: PharmacyOutcomeSourceType;
  rawPayload: Record<string, unknown>;
  classificationState: PharmacyOutcomeClassificationState;
  serviceType: PharmacyServiceType | null;
  correlationRefs: readonly string[];
}): Record<string, unknown> {
  return {
    sourceType: input.sourceType,
    classificationState: input.classificationState,
    outcomeAt:
      optionalText(input.rawPayload.outcomeAt as string | undefined) ??
      optionalText(input.rawPayload.recordedAt as string | undefined) ??
      null,
    patientRefId:
      optionalText(input.rawPayload.patientRefId as string | undefined) ??
      optionalText(input.rawPayload.patientRef as string | undefined) ??
      null,
    providerRefId:
      optionalText(input.rawPayload.providerRefId as string | undefined) ??
      optionalText(input.rawPayload.providerRef as string | undefined) ??
      null,
    providerOdsCode:
      optionalText(input.rawPayload.providerOdsCode as string | undefined) ??
      optionalText(input.rawPayload.odsCode as string | undefined) ??
      null,
    serviceType: input.serviceType,
    correlationRefs: [...input.correlationRefs],
    transportHintRefs: Array.isArray(input.rawPayload.transportHintRefs)
      ? (input.rawPayload.transportHintRefs as unknown[]).filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    medicineCodes: Array.isArray(input.rawPayload.medicineCodes)
      ? (input.rawPayload.medicineCodes as unknown[]).filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    urgentGpAction: Boolean(input.rawPayload.urgentGpAction),
    onwardReferral: Boolean(input.rawPayload.onwardReferral),
    unableToContact: Boolean(input.rawPayload.unableToContact),
    pharmacyUnableToComplete: Boolean(input.rawPayload.pharmacyUnableToComplete),
  };
}

export function createPharmacyOutcomeSourceRegistry(
  policy: PharmacyOutcomeMatchingPolicySnapshot = defaultPharmacyOutcomeMatchingPolicy,
): PharmacyOutcomeSourceRegistry {
  return {
    parse(input) {
      const receivedAt = ensureIsoTimestamp(input.receivedAt, "receivedAt");
      const rawPayload =
        typeof input.rawPayload === "string"
          ? { rawText: input.rawPayload }
          : ((input.rawPayload as Record<string, unknown>) ?? {});
      const classificationState = normalizeClassification(rawPayload);
      const serviceType = normalizeServiceType(rawPayload);
      const correlationRefs = normalizeCorrelationRefs(rawPayload);
      const semanticPayload = buildSemanticPayload({
        sourceType: input.sourceType,
        rawPayload,
        classificationState,
        serviceType,
        correlationRefs,
      });
      const sourceMessageKey =
        optionalText(input.sourceMessageKey) ??
        optionalText(rawPayload.sourceMessageKey as string | undefined) ??
        optionalText(rawPayload.messageId as string | undefined) ??
        stableProjectionId("pharmacy_outcome_message", {
          sourceType: input.sourceType,
          semanticPayload,
        });
      const parserVersion = optionalText(input.parserVersion) ?? "phase6_pharmacy_outcome_parser_v1";
      const rawPayloadHash = sha256Hex(stableStringify(input.rawPayload));
      const semanticPayloadHash = sha256Hex(stableStringify(semanticPayload));
      const replayKey = stableReviewDigest({
        sourceType: input.sourceType,
        sourceMessageKey,
        semanticPayloadHash,
      });
      const trustClass = sourceTrustClass(input.sourceType);
      return {
        envelope: {
          sourceType: input.sourceType,
          sourceMessageKey,
          rawPayloadHash,
          semanticPayloadHash,
          replayKey,
          parserVersion,
          receivedAt,
          trustClass,
          correlationRefs,
        },
        normalized: {
          classificationState,
          outcomeAt:
            optionalText(semanticPayload.outcomeAt as string | undefined) ?? receivedAt,
          patientRefId: optionalText(semanticPayload.patientRefId as string | undefined),
          providerRefId: optionalText(semanticPayload.providerRefId as string | undefined),
          providerOdsCode: optionalText(semanticPayload.providerOdsCode as string | undefined),
          serviceType,
          trustedCorrelationRefs: correlationRefs,
          sourceFloor: policy.trustSourceFloor[trustClass],
          transportHintRefs: uniqueSorted(
            Array.isArray(semanticPayload.transportHintRefs)
              ? (semanticPayload.transportHintRefs as string[])
              : [],
          ),
          routeIntentTupleHash: optionalText(rawPayload.routeIntentTupleHash as string | undefined),
          rawPayloadRef: `${input.sourceType}:${sourceMessageKey}`,
        },
        provenance: {
          senderIdentityRef:
            optionalText(input.senderIdentityRef) ??
            optionalText(rawPayload.senderIdentityRef as string | undefined),
          inboundTransportFamily:
            optionalText(input.inboundTransportFamily) ??
            optionalText(rawPayload.inboundTransportFamily as string | undefined) ??
            (input.sourceType === "email_ingest"
              ? "secure_mail"
              : input.sourceType === "manual_structured_capture"
                ? "operator_capture"
                : "structured_ingress"),
          inboundChannelRef:
            optionalText(input.inboundChannelRef) ??
            optionalText(rawPayload.inboundChannelRef as string | undefined),
          trustedCorrelationFragments: correlationRefs,
          gpWorkflowIdentifiers: uniqueSorted(
            [
              optionalText(rawPayload.workflowMessageId as string | undefined),
              optionalText(rawPayload.workflowItemId as string | undefined),
            ].filter((value): value is string => value !== null),
          ),
          parserAssumptionRefs: uniqueSorted([
            input.sourceType === "manual_structured_capture"
              ? "manual_capture.requires_operator_trust_review"
              : input.sourceType === "email_ingest"
                ? "email_ingest.requires_transport_inference"
                : "structured_fields_consumed",
          ]),
          degradedFieldRefs: uniqueSorted([
            ...(!semanticPayload.patientRefId ? ["patientRefId"] : []),
            ...(!semanticPayload.providerRefId && !semanticPayload.providerOdsCode
              ? ["provider_identity"]
              : []),
            ...(serviceType === null ? ["serviceType"] : []),
          ]),
          fieldOriginRefs: uniqueSorted([
            input.sourceType === "gp_workflow_observation"
              ? "field_origin.gp_workflow_observation"
              : input.sourceType === "direct_structured_message"
                ? "field_origin.direct_structured_message"
                : input.sourceType === "email_ingest"
                  ? "field_origin.email_structured_extract"
                  : "field_origin.manual_operator_capture",
          ]),
          rawPayloadRef: `${input.sourceType}:${sourceMessageKey}`,
          recordedAt: receivedAt,
        },
      };
    },
  };
}

export interface PharmacyOutcomeReplayDecision {
  decisionClass: PharmacyOutcomeDecisionClass;
  dedupeState: PharmacyOutcomeDedupeState;
  priorEnvelope: OutcomeEvidenceEnvelopeSnapshot | null;
  priorAttempt: PharmacyOutcomeIngestAttemptSnapshot | null;
  priorSettlement: PharmacyOutcomeSettlementSnapshot | null;
}

export interface PharmacyOutcomeReplayClassifier {
  classify(input: {
    parsed: ParsedPharmacyOutcomeEvidence;
    repositories: Phase6PharmacyOutcomeRepositories;
  }): Promise<PharmacyOutcomeReplayDecision>;
}

function semanticReplayScopeKey(parsed: ParsedPharmacyOutcomeEvidence): string {
  return stableReviewDigest({
    sourceType: parsed.envelope.sourceType,
    patientRefId: parsed.normalized.patientRefId,
    providerRefId: parsed.normalized.providerRefId,
    providerOdsCode: parsed.normalized.providerOdsCode,
    serviceType: parsed.normalized.serviceType,
    classificationState: parsed.normalized.classificationState,
    correlationRefs: parsed.envelope.correlationRefs,
  });
}

function replayMeaningScopeKey(input: {
  sourceType: PharmacyOutcomeSourceType;
  classificationState: PharmacyOutcomeClassificationState;
  patientRefId: string | null;
  providerRefId: string | null;
  providerOdsCode: string | null;
  serviceType: PharmacyServiceType | null;
  correlationRefs: readonly string[];
}): string {
  return stableReviewDigest({
    sourceType: input.sourceType,
    classificationState: input.classificationState,
    patientRefId: input.patientRefId,
    providerRefId: input.providerRefId,
    providerOdsCode: input.providerOdsCode,
    serviceType: input.serviceType,
    correlationRefs: uniqueSorted([...input.correlationRefs]),
  });
}

export function createPharmacyOutcomeReplayClassifier(): PharmacyOutcomeReplayClassifier {
  return {
    async classify(input) {
      const existingEnvelopes = (
        await input.repositories.listOutcomeEvidenceEnvelopes()
      ).map((document) => document.toSnapshot());
      const semanticScope = semanticReplayScopeKey(input.parsed);
      const parsedMeaningScope = replayMeaningScopeKey({
        sourceType: input.parsed.envelope.sourceType,
        classificationState: input.parsed.normalized.classificationState,
        patientRefId: input.parsed.normalized.patientRefId,
        providerRefId: input.parsed.normalized.providerRefId,
        providerOdsCode: input.parsed.normalized.providerOdsCode,
        serviceType: input.parsed.normalized.serviceType,
        correlationRefs: input.parsed.normalized.trustedCorrelationRefs,
      });

      const sourceKeyMatch = existingEnvelopes.find(
        (candidate) => candidate.sourceMessageKey === input.parsed.envelope.sourceMessageKey,
      );
      const exactReplay = existingEnvelopes.find(
        (candidate) =>
          candidate.replayKey === input.parsed.envelope.replayKey &&
          candidate.semanticPayloadHash === input.parsed.envelope.semanticPayloadHash,
      );
      const semanticReplay = existingEnvelopes.find(
        (candidate) =>
          candidate.sourceType === input.parsed.envelope.sourceType &&
          candidate.semanticPayloadHash === input.parsed.envelope.semanticPayloadHash &&
          semanticReplayScopeKey({
            ...input.parsed,
            envelope: {
              ...input.parsed.envelope,
              sourceMessageKey: candidate.sourceMessageKey,
              semanticPayloadHash: candidate.semanticPayloadHash,
            },
          }) === semanticScope,
      );

      const priorEnvelope = exactReplay ?? semanticReplay ?? sourceKeyMatch ?? null;
      const priorAttempt =
        priorEnvelope === null
          ? null
          : (
              await input.repositories.listOutcomeIngestAttempts()
            )
              .map((document) => document.toSnapshot())
              .find(
                (attempt) =>
                  attempt.outcomeEvidenceEnvelopeRef.refId === priorEnvelope.outcomeEvidenceEnvelopeId,
              ) ?? null;
      const priorSettlement =
        priorAttempt?.settlementState && priorAttempt.pharmacyCaseId
          ? (
              await input.repositories.listOutcomeSettlementsByCase(priorAttempt.pharmacyCaseId)
            )
              .map((document) => document.toSnapshot())
              .find((settlement) => settlement.ingestAttemptId === priorAttempt.ingestAttemptId) ??
            null
          : null;
      const sourceKeyNormalized =
        sourceKeyMatch === undefined
          ? null
          : (
              await input.repositories.getNormalizedOutcomeEvidenceByEnvelope(
                sourceKeyMatch.outcomeEvidenceEnvelopeId,
              )
            )?.toSnapshot() ?? null;
      const sourceKeyMeaningScope =
        sourceKeyMatch === undefined || sourceKeyNormalized === null
          ? null
          : replayMeaningScopeKey({
              sourceType: sourceKeyMatch.sourceType,
              classificationState: sourceKeyNormalized.classificationState,
              patientRefId: sourceKeyNormalized.patientRefId,
              providerRefId: sourceKeyNormalized.providerRefId,
              providerOdsCode: sourceKeyNormalized.providerOdsCode,
              serviceType: sourceKeyNormalized.serviceType,
              correlationRefs: sourceKeyNormalized.trustedCorrelationRefs,
            });

      if (exactReplay) {
        return {
          decisionClass: "exact_replay",
          dedupeState: "duplicate",
          priorEnvelope: exactReplay,
          priorAttempt,
          priorSettlement,
        };
      }

      if (
        semanticReplay &&
        semanticReplay.rawPayloadHash !== input.parsed.envelope.rawPayloadHash
      ) {
        return {
          decisionClass: "semantic_replay",
          dedupeState: "duplicate",
          priorEnvelope: semanticReplay,
          priorAttempt,
          priorSettlement,
        };
      }

      if (sourceKeyMatch && sourceKeyMeaningScope === parsedMeaningScope) {
        return {
          decisionClass: "semantic_replay",
          dedupeState: "duplicate",
          priorEnvelope: sourceKeyMatch,
          priorAttempt,
          priorSettlement,
        };
      }

      const collision =
        sourceKeyMatch !== undefined &&
        sourceKeyMatch.semanticPayloadHash !== input.parsed.envelope.semanticPayloadHash;
      if (collision) {
        return {
          decisionClass: "collision_review",
          dedupeState: "collision_review",
          priorEnvelope: sourceKeyMatch,
          priorAttempt,
          priorSettlement,
        };
      }

      return {
        decisionClass: "distinct",
        dedupeState: "new",
        priorEnvelope: null,
        priorAttempt: null,
        priorSettlement: null,
      };
    },
  };
}

export interface PharmacyOutcomeEnvelopeWriter {
  persist(input: {
    parsed: ParsedPharmacyOutcomeEvidence;
    replayDecision: PharmacyOutcomeReplayDecision;
    repositories: Phase6PharmacyOutcomeRepositories;
    idGenerator: BackboneIdGenerator;
  }): Promise<{
    envelope: OutcomeEvidenceEnvelopeSnapshot;
    provenance: PharmacyOutcomeSourceProvenanceSnapshot;
    normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
  }>;
}

export function createPharmacyOutcomeEnvelopeWriter(): PharmacyOutcomeEnvelopeWriter {
  return {
    async persist(input) {
      const envelope: OutcomeEvidenceEnvelopeSnapshot = {
        outcomeEvidenceEnvelopeId: nextId(input.idGenerator, "pharmacy_outcome_evidence"),
        ...input.parsed.envelope,
        decisionClass: input.replayDecision.decisionClass,
        dedupeState: input.replayDecision.dedupeState,
        version: 1,
      };
      await input.repositories.saveOutcomeEvidenceEnvelope(envelope);

      const provenance: PharmacyOutcomeSourceProvenanceSnapshot = {
        outcomeSourceProvenanceId: nextId(input.idGenerator, "pharmacy_outcome_provenance"),
        outcomeEvidenceEnvelopeRef: makeRef(
          "OutcomeEvidenceEnvelope",
          envelope.outcomeEvidenceEnvelopeId,
          TASK_343,
        ),
        ...input.parsed.provenance,
        version: 1,
      };
      await input.repositories.saveOutcomeSourceProvenance(provenance);

      const normalized: NormalizedPharmacyOutcomeEvidenceSnapshot = {
        normalizedPharmacyOutcomeEvidenceId: nextId(
          input.idGenerator,
          "pharmacy_outcome_normalized",
        ),
        outcomeEvidenceEnvelopeRef: provenance.outcomeEvidenceEnvelopeRef,
        ...input.parsed.normalized,
        version: 1,
      };
      await input.repositories.saveNormalizedOutcomeEvidence(normalized);

      return {
        envelope,
        provenance,
        normalized,
      };
    },
  };
}

interface MatchCandidateContext {
  pharmacyCase: PharmacyCaseSnapshot;
  correlationRecord: PharmacyCorrelationRecordSnapshot | null;
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
  dispatchAttempt: PharmacyDispatchAttemptSnapshot | null;
  consentCheckpoint: PharmacyConsentCheckpoint | null;
  provider: PharmacyProvider | null;
}

export interface PharmacyOutcomeMatchPreview {
  bestCandidate: MatchCandidateContext | null;
  runnerUp: MatchCandidateContext | null;
  matchState: PharmacyOutcomeMatchState;
  scorecard: Omit<PharmacyOutcomeMatchScorecardSnapshot, "pharmacyOutcomeMatchScorecardId" | "ingestAttemptRef" | "version">;
  exactCorrelationMatched: boolean;
}

export interface PharmacyOutcomeMatcher {
  previewMatch(input: {
    normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
    envelope: OutcomeEvidenceEnvelopeSnapshot;
    policy: PharmacyOutcomeMatchingPolicySnapshot;
  }): Promise<PharmacyOutcomeMatchPreview>;
}

function caseEligibleForOutcomeMatch(pharmacyCase: PharmacyCaseSnapshot): boolean {
  return [
    "dispatch_pending",
    "referred",
    "consultation_outcome_pending",
    "outcome_reconciliation_pending",
    "resolved_by_pharmacy",
  ].includes(pharmacyCase.status);
}

function patientMatch(
  pharmacyCase: PharmacyCaseSnapshot,
  normalized: NormalizedPharmacyOutcomeEvidenceSnapshot,
): number {
  if (normalized.patientRefId === null) {
    return 0.65;
  }
  return pharmacyCase.patientRef.refId === normalized.patientRefId ? 1 : 0;
}

function providerMatch(
  provider: PharmacyProvider | null,
  normalized: NormalizedPharmacyOutcomeEvidenceSnapshot,
): number {
  if (normalized.providerRefId === null && normalized.providerOdsCode === null) {
    return 0.62;
  }
  if (provider === null) {
    return 0;
  }
  if (
    normalized.providerRefId !== null &&
    normalized.providerRefId === provider.providerId
  ) {
    return 1;
  }
  if (
    normalized.providerOdsCode !== null &&
    normalized.providerOdsCode === provider.odsCode
  ) {
    return 1;
  }
  return 0.08;
}

function serviceMatch(
  pharmacyCase: PharmacyCaseSnapshot,
  normalized: NormalizedPharmacyOutcomeEvidenceSnapshot,
): number {
  if (normalized.serviceType === null) {
    return 0.72;
  }
  return pharmacyCase.serviceType === normalized.serviceType ? 1 : 0.05;
}

function transportMatch(
  context: MatchCandidateContext,
  normalized: NormalizedPharmacyOutcomeEvidenceSnapshot,
  envelope: OutcomeEvidenceEnvelopeSnapshot,
): number {
  if (context.correlationRecord === null) {
    return normalized.transportHintRefs.length === 0 ? 0.45 : 0.1;
  }
  if (
    normalized.trustedCorrelationRefs.some(
      (ref) =>
        ref === context.correlationRecord!.correlationId ||
        ref === context.correlationRecord!.packageId ||
        ref === context.correlationRecord!.dispatchAttemptId ||
        ref === context.correlationRecord!.routeIntentTupleHash ||
        context.correlationRecord!.outboundReferenceSet.includes(ref),
    )
  ) {
    return 1;
  }
  if (context.correlationRecord.transportMode !== null) {
    if (envelope.sourceType === "gp_workflow_observation") {
      return 0.82;
    }
    if (envelope.sourceType === "direct_structured_message") {
      return 0.76;
    }
  }
  return 0.28;
}

function contradictionScoreForCandidate(input: {
  context: MatchCandidateContext;
  normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
  mPatient: number;
  mProvider: number;
  mService: number;
  mTime: number;
}): number {
  const contradictionCandidates = [
    input.mPatient === 0 ? 1 : 0,
    input.mProvider < 0.1 ? 0.7 : 0,
    input.mService < 0.1 ? 0.8 : 0,
    input.mTime < 0.2 ? 0.5 : 0,
    input.context.pharmacyCase.status === "resolved_by_pharmacy" ? 0.1 : 0,
  ];
  return ensureUnitInterval(Math.max(...contradictionCandidates), "contradictionScore");
}

function scoreConfidenceBand(
  posteriorMatchConfidence: number,
  matchScore: number,
): PharmacyOutcomeMatchConfidenceBand {
  if (posteriorMatchConfidence >= 0.85 && matchScore >= 0.8) {
    return "high";
  }
  if (posteriorMatchConfidence >= 0.6 && matchScore >= 0.55) {
    return "medium";
  }
  return "low";
}

function computeMatchScore(input: {
  mPatient: number;
  mProvider: number;
  mService: number;
  mTime: number;
  mTransport: number;
  mContra: number;
  sourceFloor: number;
  policy: PharmacyOutcomeMatchingPolicySnapshot;
}): { rawMatch: number; matchScore: number } {
  const rawMatch =
    Math.max(input.policy.epsilon, input.mPatient) ** input.policy.omegaPatient *
    Math.max(input.policy.epsilon, input.mProvider) ** input.policy.omegaProvider *
    Math.max(input.policy.epsilon, input.mService) ** input.policy.omegaService *
    Math.max(input.policy.epsilon, input.mTime) ** input.policy.omegaTime *
    Math.max(input.policy.epsilon, input.mTransport) ** input.policy.omegaTransport;
  const matchScore =
    input.sourceFloor *
    rawMatch *
    (1 - input.mContra) ** input.policy.lambdaMatchContra;
  return {
    rawMatch: ensureUnitInterval(rawMatch, "rawMatch"),
    matchScore: ensureUnitInterval(matchScore, "matchScore"),
  };
}

function autoApplyAllowedByTrust(input: {
  policy: PharmacyOutcomeMatchingPolicySnapshot;
  normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
  envelope: OutcomeEvidenceEnvelopeSnapshot;
  exactCorrelationMatched: boolean;
}): boolean {
  if (input.policy.autoApplyByTrustClass[input.envelope.trustClass]) {
    return true;
  }
  return (
    input.policy.lowAssuranceTrustedCorrelationDirectApply &&
    input.exactCorrelationMatched &&
    ["email_ingest", "manual_structured_capture"].includes(input.envelope.sourceType)
  );
}

export function createPharmacyOutcomeMatcher(input: {
  caseKernelService: Phase6PharmacyCaseKernelService;
  directoryRepositories: Phase6PharmacyDirectoryChoiceRepositories;
  dispatchRepositories: Phase6PharmacyDispatchRepositories;
  packageRepositories: Phase6PharmacyReferralPackageRepositories;
}): PharmacyOutcomeMatcher {
  return {
    async previewMatch({ normalized, envelope, policy }) {
      const caseDocuments = await input.caseKernelService.repositories.listPharmacyCases();
      const correlationDocuments = await input.packageRepositories.listCorrelationRecords();
      const correlationsByCase = new Map(
        correlationDocuments.map((document) => {
          const snapshot = document.toSnapshot();
          return [snapshot.pharmacyCaseId, snapshot] as const;
        }),
      );

      const exactCorrelationCandidates = [...correlationsByCase.values()].filter((correlation) =>
        normalized.trustedCorrelationRefs.some(
          (ref) =>
            ref === correlation.correlationId ||
            ref === correlation.packageId ||
            ref === correlation.dispatchAttemptId ||
            ref === correlation.routeIntentTupleHash ||
            correlation.outboundReferenceSet.includes(ref),
        ),
      );
      const exactCorrelationMatched = exactCorrelationCandidates.length === 1;

      const candidateContexts: MatchCandidateContext[] = [];
      for (const document of caseDocuments) {
        const pharmacyCase = document.toSnapshot();
        if (!caseEligibleForOutcomeMatch(pharmacyCase)) {
          continue;
        }
        const correlationRecord = correlationsByCase.get(pharmacyCase.pharmacyCaseId) ?? null;
        const dispatchTruth =
          (
            await input.dispatchRepositories.getCurrentDispatchTruthProjectionForCase(
              pharmacyCase.pharmacyCaseId,
            )
          )?.toSnapshot() ?? null;
        const dispatchAttempt =
          (
            await input.dispatchRepositories.getCurrentDispatchAttemptForCase(
              pharmacyCase.pharmacyCaseId,
            )
          )?.toSnapshot() ?? null;
        const consentCheckpoint =
          (
            await input.directoryRepositories.getLatestConsentCheckpointForCase(
              pharmacyCase.pharmacyCaseId,
            )
          )?.toSnapshot() ?? null;
        const provider =
          pharmacyCase.selectedProviderRef === null
            ? null
            : (
                await input.directoryRepositories.getProvider(
                  pharmacyCase.selectedProviderRef.refId,
                )
              )?.toSnapshot() ?? null;
        candidateContexts.push({
          pharmacyCase,
          correlationRecord,
          dispatchTruth,
          dispatchAttempt,
          consentCheckpoint,
          provider,
        });
      }

      const eligibleScored = candidateContexts
        .map((context) => {
          if (
            exactCorrelationCandidates.length > 0 &&
            !exactCorrelationCandidates.some(
              (candidate) => candidate.pharmacyCaseId === context.pharmacyCase.pharmacyCaseId,
            )
          ) {
            return null;
          }
          const mPatient = patientMatch(context.pharmacyCase, normalized);
          const mService = serviceMatch(context.pharmacyCase, normalized);
          const mProvider = providerMatch(context.provider, normalized);
          const mTransport = transportMatch(context, normalized, envelope);
          const expectedWindowMidpoint =
            context.dispatchAttempt?.confirmedAt ??
            context.dispatchAttempt?.attemptedAt ??
            context.correlationRecord?.updatedAt ??
            context.pharmacyCase.updatedAt;
          const mTime = ensureUnitInterval(
            expDecay(
              minutesBetween(normalized.outcomeAt, expectedWindowMidpoint),
              policy.tauMatchTimeMinutes,
            ),
            "mTime",
          );
          const hardFloorSatisfied =
            mPatient >= policy.tauPatientFloor &&
            mService >= policy.tauServiceFloor &&
            (context.correlationRecord === null || Math.max(mProvider, mTransport) >= policy.tauRouteFloor);
          if (!hardFloorSatisfied) {
            return null;
          }
          const mContra = contradictionScoreForCandidate({
            context,
            normalized,
            mPatient,
            mProvider,
            mService,
            mTime,
          });
          const { rawMatch, matchScore } = computeMatchScore({
            mPatient,
            mProvider,
            mService,
            mTime,
            mTransport,
            mContra,
            sourceFloor: normalized.sourceFloor,
            policy,
          });
          return {
            context,
            hardFloorSatisfied,
            mPatient,
            mProvider,
            mService,
            mTime,
            mTransport,
            mContra,
            rawMatch,
            matchScore,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort((left, right) => right.matchScore - left.matchScore);

      const bestCandidate = eligibleScored[0]?.context ?? null;
      const runnerUp = eligibleScored[1]?.context ?? null;
      const bestScore = eligibleScored[0]?.matchScore ?? 0;
      const runnerUpScore = eligibleScored[1]?.matchScore ?? 0;
      const posteriorDenominator =
        eligibleScored.reduce(
          (sum, candidate) => sum + Math.exp(policy.kappaMatch * candidate.matchScore),
          0,
        ) || 1;
      const posterior =
        eligibleScored[0] === undefined
          ? 0
          : ensureUnitInterval(
              Math.exp(policy.kappaMatch * eligibleScored[0].matchScore) / posteriorDenominator,
              "posteriorMatchConfidence",
            );
      const deltaToRunnerUp = ensureUnitInterval(
        Math.max(0, bestScore - runnerUpScore),
        "deltaToRunnerUp",
      );
      const autoApplyThresholdSatisfied =
        bestScore >= policy.tauStrongMatch &&
        posterior >= policy.tauPosteriorStrong &&
        deltaToRunnerUp >= policy.deltaMatch &&
        (eligibleScored[0]?.mContra ?? 1) <= policy.tauContraApply;
      const matchState: PharmacyOutcomeMatchState =
        bestCandidate === null
          ? "unmatched"
          : autoApplyThresholdSatisfied
            ? "strong_match"
            : "review_required";

      return {
        bestCandidate,
        runnerUp,
        matchState,
        exactCorrelationMatched,
        scorecard: {
          policyVersionRef: policy.policyVersionRef,
          thresholdFamilyRefs: policy.thresholdFamilyRefs,
          candidateCaseRef:
            bestCandidate === null
              ? null
              : makeRef("PharmacyCase", bestCandidate.pharmacyCase.pharmacyCaseId, TASK_342),
          runnerUpCaseRef:
            runnerUp === null
              ? null
              : makeRef("PharmacyCase", runnerUp.pharmacyCase.pharmacyCaseId, TASK_342),
          mPatient: eligibleScored[0]?.mPatient ?? 0,
          mProvider: eligibleScored[0]?.mProvider ?? 0,
          mService: eligibleScored[0]?.mService ?? 0,
          mTime: eligibleScored[0]?.mTime ?? 0,
          mTransport: eligibleScored[0]?.mTransport ?? 0,
          mContra: eligibleScored[0]?.mContra ?? 0,
          sourceFloor: normalized.sourceFloor,
          rawMatch: eligibleScored[0]?.rawMatch ?? 0,
          matchScore: bestScore,
          runnerUpMatchScore: runnerUpScore,
          posteriorMatchConfidence: posterior,
          deltaToRunnerUp,
          hardFloorSatisfied: eligibleScored[0]?.hardFloorSatisfied ?? false,
          autoApplyThresholdSatisfied,
          calculatedAt: envelope.receivedAt,
        },
      };
    },
  };
}

export interface PharmacyOutcomeSafetyBridge {
  assimilate(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
    envelope: OutcomeEvidenceEnvelopeSnapshot;
    replayDecision: PharmacyOutcomeReplayDecision;
    currentGate: PharmacyOutcomeReconciliationGateSnapshot | null;
  }): Promise<EvidenceAssimilationSettlement>;
}

function classificationToMaterialityClass(
  classificationState: PharmacyOutcomeClassificationState,
): MaterialDeltaInput["explicitMaterialityClass"] {
  switch (classificationState) {
    case "advice_only":
    case "medicine_supplied":
    case "resolved_no_supply":
      return "operational_nonclinical";
    case "unable_to_contact":
      return "contact_safety_material";
    case "urgent_gp_action":
    case "onward_referral":
    case "pharmacy_unable_to_complete":
      return "safety_material";
    case "unmatched":
      return "unresolved";
    default:
      return "safety_material";
  }
}

function classificationToMisclassificationRisk(
  classificationState: PharmacyOutcomeClassificationState,
  decisionClass: PharmacyOutcomeDecisionClass,
): ClassificationInput["explicitMisclassificationRiskState"] {
  if (decisionClass === "collision_review") {
    return "fail_closed_review";
  }
  if (
    classificationState === "urgent_gp_action" ||
    classificationState === "onward_referral"
  ) {
    return "urgent_hold";
  }
  if (classificationState === "unmatched") {
    return "fail_closed_review";
  }
  return "ordinary";
}

function classificationToEvidenceClass(
  classificationState: PharmacyOutcomeClassificationState,
): NonNullable<ClassificationInput["explicitDominantEvidenceClass"]> {
  return classificationState === "unable_to_contact"
    ? "contact_safety_relevant"
    : "potentially_clinical";
}

function classificationToSafetyFeatures(
  classificationState: PharmacyOutcomeClassificationState,
): SafetyEvaluationInput["featureStates"] {
  return {
    [`pharmacy_outcome.${classificationState}`]: "present",
    "pharmacy_outcome.has_consultation": "present",
    "pharmacy_outcome.requires_gp_review":
      classificationState === "urgent_gp_action" ||
      classificationState === "onward_referral" ||
      classificationState === "pharmacy_unable_to_complete"
        ? "present"
        : "absent",
    "pharmacy_outcome.unable_to_contact":
      classificationState === "unable_to_contact" ? "present" : "absent",
  };
}

export function createPharmacyOutcomeSafetyBridge(input?: {
  repositories?: AssimilationSafetyDependencies;
}) : PharmacyOutcomeSafetyBridge {
  const repositories = input?.repositories ?? createAssimilationSafetyStore();
  const services = createAssimilationSafetyServices(repositories);
  return {
    async assimilate({ pharmacyCase, normalized, envelope, replayDecision, currentGate }) {
      return services.coordinator.assimilateEvidence({
        episodeId: pharmacyCase.episodeRef.refId,
        requestId: pharmacyCase.originRequestId,
        sourceDomain:
          envelope.sourceType === "manual_structured_capture"
            ? "support_capture"
            : envelope.sourceType === "email_ingest"
              ? "pharmacy_return"
              : "adapter_observation",
        governingObjectRef: `OutcomeEvidenceEnvelope/${envelope.outcomeEvidenceEnvelopeId}`,
        ingressEvidenceRefs: [
          `pharmacy.outcome.${envelope.sourceType}.${envelope.replayKey}`,
          ...envelope.correlationRefs,
        ],
        decidedAt: envelope.receivedAt,
        materialDelta: {
          changedEvidenceRefs: [envelope.outcomeEvidenceEnvelopeId],
          changedFeatureRefs: [
            `pharmacy_outcome.${normalized.classificationState}`,
            ...envelope.correlationRefs,
          ],
          changedDependencyRefs: pharmacyCase.activeReachabilityDependencyRefs.map((ref) => ref.refId),
          changedChronologyRefs: [normalized.outcomeAt],
          materialityPolicyRef: "phase6.pharmacy.outcome.materiality.v1",
          explicitMaterialityClass: classificationToMaterialityClass(
            normalized.classificationState,
          ),
          explicitDecisionBasis:
            replayDecision.decisionClass === "collision_review"
              ? "contradiction_delta"
              : "feature_delta",
          reasonCodes: uniqueSorted([
            `pharmacy_outcome.${normalized.classificationState}`,
            `pharmacy_outcome_source.${envelope.sourceType}`,
          ]),
          degradedFailClosed: replayDecision.decisionClass === "collision_review",
          currentPendingPreemptionRef: currentGate?.outcomeReconciliationGateId ?? null,
          decidedByRef: "PharmacyOutcomeSafetyBridge",
        },
        classification: {
          classifierVersionRef: "phase6.pharmacy.outcome.classifier.v1",
          evidenceItems: [
            {
              evidenceRef: envelope.outcomeEvidenceEnvelopeId,
              suggestedClass: classificationToEvidenceClass(normalized.classificationState),
              confidence:
                envelope.trustClass === "trusted_structured" ||
                envelope.trustClass === "trusted_observed"
                  ? 0.95
                  : 0.6,
            },
          ],
          activeDependencyRefs: pharmacyCase.activeReachabilityDependencyRefs.map((ref) => ref.refId),
          triggerReasonCodes: uniqueSorted([
            `pharmacy_outcome.${normalized.classificationState}`,
            `replay.${replayDecision.decisionClass}`,
          ]),
          confidenceBand:
            envelope.trustClass === "trusted_structured"
              ? "high"
              : envelope.trustClass === "trusted_observed"
                ? "medium"
                : "low",
          explicitDominantEvidenceClass: classificationToEvidenceClass(
            normalized.classificationState,
          ),
          explicitMisclassificationRiskState: classificationToMisclassificationRisk(
            normalized.classificationState,
            replayDecision.decisionClass,
          ),
          manualReviewOverride:
            envelope.sourceType === "manual_structured_capture" ||
            envelope.sourceType === "email_ingest",
          decidedByRef: "PharmacyOutcomeSafetyBridge",
        },
        safetyEvaluation: {
          requestTypeRef: "pharmacy_outcome",
          featureStates: classificationToSafetyFeatures(normalized.classificationState),
          deltaFeatureRefs: [`pharmacy_outcome.${normalized.classificationState}`],
          deltaDependencyRefs: pharmacyCase.activeReachabilityDependencyRefs.map((ref) => ref.refId),
          activeReachabilityDependencyRefs: pharmacyCase.activeReachabilityDependencyRefs.map(
            (ref) => ref.refId,
          ),
          priorityHint:
            normalized.classificationState === "urgent_gp_action" ? "urgent_live" : "routine_review",
          blockingActionScopeRefs: currentGate ? ["pharmacy.outcome.reconciliation"] : [],
          reasonCode: `pharmacy_outcome.${normalized.classificationState}`,
        },
        replayClassHint:
          replayDecision.decisionClass === "exact_replay" ||
          replayDecision.decisionClass === "semantic_replay"
            ? replayDecision.decisionClass
            : null,
      });
    },
  };
}

function settlementResultToDisposition(
  classificationState: PharmacyOutcomeClassificationState,
): PharmacyOutcomeDisposition {
  switch (classificationState) {
    case "urgent_gp_action":
      return "urgent_bounce_back";
    case "unable_to_contact":
      return "no_contact_return_pending";
    case "pharmacy_unable_to_complete":
    case "onward_referral":
      return "unresolved_returned";
    case "advice_only":
    case "medicine_supplied":
    case "resolved_no_supply":
      return "resolved_by_pharmacy";
    case "unmatched":
      return "pending_review";
  }
}

function settlementResultToTruthState(
  result: PharmacyOutcomeSettlementResult,
): PharmacyOutcomeTruthProjectionSnapshot["outcomeTruthState"] {
  switch (result) {
    case "resolved_pending_projection":
      return "resolved_pending_projection";
    case "reopened_for_safety":
      return "reopened_for_safety";
    case "review_required":
      return "review_required";
    case "unmatched":
      return "unmatched";
    case "duplicate_ignored":
      return "duplicate_ignored";
  }
}

function settlementResultToPatientVisibility(
  result: PharmacyOutcomeSettlementResult,
): PharmacyOutcomeTruthProjectionSnapshot["patientVisibilityState"] {
  switch (result) {
    case "resolved_pending_projection":
      return "quiet_result";
    case "reopened_for_safety":
      return "recovery_required";
    case "review_required":
    case "unmatched":
      return "review_placeholder";
    case "duplicate_ignored":
      return "hidden";
  }
}

function closeEligibilityFromContext(input: {
  pharmacyCase: PharmacyCaseSnapshot | null;
  manualReviewRequired: boolean;
  safetySettlement: EvidenceAssimilationSettlement | null;
}): PharmacyOutcomeCloseEligibilityState {
  if (input.manualReviewRequired) {
    return "blocked_by_reconciliation";
  }
  if (
    input.safetySettlement?.materialDelta.triggerDecision === "re_safety_required" ||
    input.safetySettlement?.materialDelta.triggerDecision === "blocked_manual_review"
  ) {
    return "blocked_by_safety";
  }
  if (input.pharmacyCase === null) {
    return "not_closable";
  }
  if (
    input.pharmacyCase.currentClosureBlockerRefs.length > 0 ||
    input.pharmacyCase.activeReachabilityDependencyRefs.length > 0
  ) {
    return "blocked_by_safety";
  }
  return "eligible_pending_projection";
}

function outcomeClosureBlockerRef(outcomeReconciliationGateId: string): AggregateRef<"ClosureBlocker", Task344> {
  return makeRef("ClosureBlocker", `pharmacy_outcome_gate:${outcomeReconciliationGateId}`, TASK_344);
}

function filterOutcomeClosureBlockerRefs(
  refs: readonly AggregateRef<"ClosureBlocker", Task344>[],
  outcomeReconciliationGateId: string,
): AggregateRef<"ClosureBlocker", Task344>[] {
  return refs.filter(
    (ref) => ref.refId !== `pharmacy_outcome_gate:${outcomeReconciliationGateId}`,
  );
}

function continuityEvidenceRef(input: {
  pharmacyCaseId: string;
  settlementId: string;
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
}): string {
  return (
    input.dispatchTruth?.continuityEvidenceRef ??
    stableProjectionId("pharmacy_outcome_continuity", {
      pharmacyCaseId: input.pharmacyCaseId,
      settlementId: input.settlementId,
    })
  );
}

export interface PreviewPharmacyOutcomeEvidenceResult {
  parsed: ParsedPharmacyOutcomeEvidence;
  replayDecision: PharmacyOutcomeReplayDecision;
}

export interface MatchPharmacyOutcomeEvidenceResult {
  envelope: OutcomeEvidenceEnvelopeSnapshot;
  normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
  replayDecision: PharmacyOutcomeReplayDecision;
  matchPreview: PharmacyOutcomeMatchPreview;
  provenance: PharmacyOutcomeSourceProvenanceSnapshot;
}

export interface IngestPharmacyOutcomeEvidenceInput extends ParsePharmacyOutcomeEvidenceInput {
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  reasonCode: string;
  currentOwnerRef?: string | null;
}

export interface ResolvePharmacyOutcomeReconciliationGateInput {
  outcomeReconciliationGateId: string;
  resolution: "apply" | "reopen" | "unmatched";
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  reasonCode: string;
  recordedAt: string;
  resolutionNotesRef?: string | null;
}

export interface PharmacyOutcomeCommandResult {
  envelope: OutcomeEvidenceEnvelopeSnapshot;
  provenance: PharmacyOutcomeSourceProvenanceSnapshot;
  normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
  ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot;
  matchScorecard: PharmacyOutcomeMatchScorecardSnapshot;
  reconciliationGate: PharmacyOutcomeReconciliationGateSnapshot | null;
  settlement: PharmacyOutcomeSettlementSnapshot;
  outcomeTruthProjection: PharmacyOutcomeTruthProjectionSnapshot;
  assimilationSettlement: EvidenceAssimilationSettlement | null;
  caseMutation: Awaited<
    ReturnType<Phase6PharmacyCaseKernelService["capturePharmacyOutcome"]>
  > | null;
}

export interface PharmacyOutcomeReviewResolutionResult {
  reconciliationGate: PharmacyOutcomeReconciliationGateSnapshot;
  settlement: PharmacyOutcomeSettlementSnapshot;
  outcomeTruthProjection: PharmacyOutcomeTruthProjectionSnapshot;
  caseMutation: Awaited<
    ReturnType<Phase6PharmacyCaseKernelService["capturePharmacyOutcome"]>
  > | null;
}

export interface PharmacyOutcomeReviewCloseBlockPosture {
  pharmacyCaseId: string;
  currentCloseEligibilityState: PharmacyOutcomeCloseEligibilityState;
  openReconciliationGateRef: string | null;
  closeBlockerRefs: readonly string[];
  patientVisibilityState: PharmacyOutcomeTruthProjectionSnapshot["patientVisibilityState"];
}

export interface PharmacyOutcomeSettlementService {
  settleDuplicate(
    input: {
      ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot;
      pharmacyCase: PharmacyCaseSnapshot | null;
      currentConsentCheckpoint: PharmacyConsentCheckpoint | null;
      recordedAt: string;
      dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
    },
  ): PharmacyOutcomeSettlementSnapshot;
  settleReviewRequired(
    input: {
      ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot;
      pharmacyCase: PharmacyCaseSnapshot;
      currentConsentCheckpoint: PharmacyConsentCheckpoint | null;
      recordedAt: string;
      dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
      gateRef: AggregateRef<"PharmacyOutcomeReconciliationGate", Task343>;
    },
  ): PharmacyOutcomeSettlementSnapshot;
  settleUnmatched(
    input: {
      ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot;
      recordedAt: string;
    },
  ): PharmacyOutcomeSettlementSnapshot;
  settleApplied(
    input: {
      ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot;
      pharmacyCase: PharmacyCaseSnapshot;
      currentConsentCheckpoint: PharmacyConsentCheckpoint | null;
      recordedAt: string;
      dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
      result: Extract<
        PharmacyOutcomeSettlementResult,
        "resolved_pending_projection" | "reopened_for_safety"
      >;
      gateRef: AggregateRef<"PharmacyOutcomeReconciliationGate", Task343> | null;
    },
  ): PharmacyOutcomeSettlementSnapshot;
}

export function createPharmacyOutcomeSettlementService(
  idGenerator: BackboneIdGenerator,
): PharmacyOutcomeSettlementService {
  function baseSettlement(input: {
    ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot;
    pharmacyCaseId: string;
    currentConsentCheckpoint: PharmacyConsentCheckpoint | null;
    recordedAt: string;
    result: PharmacyOutcomeSettlementResult;
    dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
    gateRef: AggregateRef<"PharmacyOutcomeReconciliationGate", Task343> | null;
    recoveryRouteRef?: string | null;
  }): PharmacyOutcomeSettlementSnapshot {
    return {
      settlementId: nextId(idGenerator, "pharmacy_outcome_settlement"),
      pharmacyCaseId: input.pharmacyCaseId,
      ingestAttemptId: input.ingestAttempt.ingestAttemptId,
      consentCheckpointRef:
        input.currentConsentCheckpoint === null
          ? null
          : makeRef(
              "PharmacyConsentCheckpoint",
              input.currentConsentCheckpoint.pharmacyConsentCheckpointId,
              TASK_343,
            ),
      outcomeReconciliationGateRef: input.gateRef,
      result: input.result,
      matchConfidenceBand: scoreConfidenceBand(
        input.ingestAttempt.posteriorMatchConfidence,
        input.ingestAttempt.matchScore,
      ),
      closeEligibilityState: input.ingestAttempt.closeEligibilityState,
      receiptTextRef: `pharmacy.outcome.settlement.${input.result}`,
      experienceContinuityEvidenceRef: continuityEvidenceRef({
        pharmacyCaseId: input.pharmacyCaseId,
        settlementId: input.ingestAttempt.ingestAttemptId,
        dispatchTruth: input.dispatchTruth,
      }),
      causalToken: stableReviewDigest({
        ingestAttemptId: input.ingestAttempt.ingestAttemptId,
        result: input.result,
        recordedAt: input.recordedAt,
      }),
      recoveryRouteRef: optionalText(input.recoveryRouteRef),
      recordedAt: input.recordedAt,
      version: 1,
    };
  }

  return {
    settleDuplicate(input) {
      const pharmacyCaseId = input.pharmacyCase?.pharmacyCaseId ?? "duplicate_without_case";
      return baseSettlement({
        ingestAttempt: input.ingestAttempt,
        pharmacyCaseId,
        currentConsentCheckpoint: input.currentConsentCheckpoint,
        recordedAt: input.recordedAt,
        result: "duplicate_ignored",
        dispatchTruth: input.dispatchTruth,
        gateRef: null,
      });
    },

    settleReviewRequired(input) {
      return baseSettlement({
        ingestAttempt: input.ingestAttempt,
        pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
        currentConsentCheckpoint: input.currentConsentCheckpoint,
        recordedAt: input.recordedAt,
        result: "review_required",
        dispatchTruth: input.dispatchTruth,
        gateRef: input.gateRef,
      });
    },

    settleUnmatched(input) {
      return {
        settlementId: nextId(idGenerator, "pharmacy_outcome_settlement"),
        pharmacyCaseId: "unmatched",
        ingestAttemptId: input.ingestAttempt.ingestAttemptId,
        consentCheckpointRef: null,
        outcomeReconciliationGateRef: null,
        result: "unmatched",
        matchConfidenceBand: "low",
        closeEligibilityState: "not_closable",
        receiptTextRef: "pharmacy.outcome.settlement.unmatched",
        experienceContinuityEvidenceRef: stableProjectionId("pharmacy_outcome_continuity", {
          ingestAttemptId: input.ingestAttempt.ingestAttemptId,
          unmatched: true,
        }),
        causalToken: stableReviewDigest({
          ingestAttemptId: input.ingestAttempt.ingestAttemptId,
          unmatched: true,
        }),
        recoveryRouteRef: "pharmacy.outcome.reconciliation.unmatched",
        recordedAt: input.recordedAt,
        version: 1,
      };
    },

    settleApplied(input) {
      return baseSettlement({
        ingestAttempt: input.ingestAttempt,
        pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
        currentConsentCheckpoint: input.currentConsentCheckpoint,
        recordedAt: input.recordedAt,
        result: input.result,
        dispatchTruth: input.dispatchTruth,
        gateRef: input.gateRef,
        recoveryRouteRef:
          input.result === "reopened_for_safety"
            ? `pharmacy.outcome.reopen/${input.pharmacyCase.pharmacyCaseId}`
            : null,
      });
    },
  };
}

export interface PharmacyOutcomeTruthProjectionBuilder {
  build(input: {
    pharmacyCase: PharmacyCaseSnapshot | null;
    currentTruth: PharmacyOutcomeTruthProjectionSnapshot | null;
    settlement: PharmacyOutcomeSettlementSnapshot;
    ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot;
    normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
    gate: PharmacyOutcomeReconciliationGateSnapshot | null;
  }): PharmacyOutcomeTruthProjectionSnapshot | null;
}

export function createPharmacyOutcomeTruthProjectionBuilder(): PharmacyOutcomeTruthProjectionBuilder {
  return {
    build(input) {
      if (
        input.pharmacyCase === null ||
        input.settlement.result === "unmatched"
      ) {
        return input.currentTruth;
      }

      const duplicatePreservesCurrent =
        input.settlement.result === "duplicate_ignored" && input.currentTruth !== null;
      const effectiveTruthState = duplicatePreservesCurrent
        ? input.currentTruth!.outcomeTruthState
        : settlementResultToTruthState(input.settlement.result);

      const resolvedCalmAllowed =
        input.settlement.result === "resolved_pending_projection" &&
        input.pharmacyCase.status === "resolved_by_pharmacy" &&
        input.pharmacyCase.currentClosureBlockerRefs.length === 0 &&
        input.pharmacyCase.activeReachabilityDependencyRefs.length === 0 &&
        input.gate === null;

      const outcomeTruthState =
        resolvedCalmAllowed ? "settled_resolved" : effectiveTruthState;
      const patientVisibilityState = duplicatePreservesCurrent
        ? input.currentTruth!.patientVisibilityState
        : resolvedCalmAllowed
          ? "quiet_result"
          : settlementResultToPatientVisibility(input.settlement.result);
      const computedAt = input.settlement.recordedAt;

      const base = {
        pharmacyOutcomeTruthProjectionId:
          input.currentTruth?.pharmacyOutcomeTruthProjectionId ??
          stableProjectionId("pharmacy_outcome_truth", {
            pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
          }),
        pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
        latestOutcomeSettlementRef: input.settlement.settlementId,
        latestOutcomeRecordRef: input.settlement.settlementId,
        latestIngestAttemptRef: input.ingestAttempt.ingestAttemptId,
        outcomeReconciliationGateRef: input.gate?.outcomeReconciliationGateId ?? null,
        outcomeTruthState,
        resolutionClass: input.normalized.classificationState,
        matchConfidenceBand: input.settlement.matchConfidenceBand,
        contradictionScore: input.ingestAttempt.contradictionScore,
        manualReviewState: input.ingestAttempt.manualReviewState,
        closeEligibilityState: input.settlement.closeEligibilityState,
        patientVisibilityState,
        continuityEvidenceRef: input.settlement.experienceContinuityEvidenceRef,
        audienceMessageRef: `pharmacy.outcome.truth.${outcomeTruthState}`,
        computedAt,
        version:
          input.currentTruth === null ? 1 : nextVersion(input.currentTruth.version),
      } satisfies PharmacyOutcomeTruthProjectionSnapshot;
      return base;
    },
  };
}

export interface Phase6PharmacyOutcomeReconciliationService {
  readonly repositories: Phase6PharmacyOutcomeStore;
  readonly caseKernelService: Phase6PharmacyCaseKernelService;
  readonly sourceRegistry: PharmacyOutcomeSourceRegistry;
  readonly envelopeWriter: PharmacyOutcomeEnvelopeWriter;
  readonly replayClassifier: PharmacyOutcomeReplayClassifier;
  readonly matcher: PharmacyOutcomeMatcher;
  readonly settlementService: PharmacyOutcomeSettlementService;
  readonly truthProjectionBuilder: PharmacyOutcomeTruthProjectionBuilder;
  readonly safetyBridge: PharmacyOutcomeSafetyBridge;
  previewNormalizedOutcome(input: ParsePharmacyOutcomeEvidenceInput): Promise<PreviewPharmacyOutcomeEvidenceResult>;
  matchOutcomeEvidence(input: ParsePharmacyOutcomeEvidenceInput): Promise<MatchPharmacyOutcomeEvidenceResult>;
  ingestOutcomeEvidence(input: IngestPharmacyOutcomeEvidenceInput): Promise<PharmacyOutcomeCommandResult>;
  resolveOutcomeReconciliationGate(
    input: ResolvePharmacyOutcomeReconciliationGateInput,
  ): Promise<PharmacyOutcomeReviewResolutionResult>;
  getOutcomeTruthProjection(pharmacyCaseId: string): Promise<PharmacyOutcomeTruthProjectionSnapshot | null>;
  getOutcomeReviewDebt(pharmacyCaseId?: string): Promise<readonly PharmacyOutcomeReviewDebtItem[]>;
  getOutcomeReviewCloseBlockPosture(
    pharmacyCaseId: string,
  ): Promise<PharmacyOutcomeReviewCloseBlockPosture | null>;
}

export function createPhase6PharmacyOutcomeReconciliationService(input?: {
  repositories?: Phase6PharmacyOutcomeStore;
  caseKernelService?: Phase6PharmacyCaseKernelService;
  directoryRepositories?: Phase6PharmacyDirectoryChoiceRepositories;
  dispatchRepositories?: Phase6PharmacyDispatchRepositories;
  packageRepositories?: Phase6PharmacyReferralPackageRepositories;
  safetyRepositories?: AssimilationSafetyDependencies;
  idGenerator?: BackboneIdGenerator;
  policy?: PharmacyOutcomeMatchingPolicySnapshot;
}): Phase6PharmacyOutcomeReconciliationService {
  const repositories = input?.repositories ?? createPhase6PharmacyOutcomeStore();
  const caseKernelService =
    input?.caseKernelService ??
    createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });
  const directoryRepositories =
    input?.directoryRepositories ?? createPhase6PharmacyDirectoryChoiceStore();
  const dispatchRepositories =
    input?.dispatchRepositories ?? createPhase6PharmacyDispatchStore();
  const packageRepositories =
    input?.packageRepositories ?? createPhase6PharmacyReferralPackageStore();
  const idGenerator =
    input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase6-pharmacy-outcome");
  const policy = input?.policy ?? defaultPharmacyOutcomeMatchingPolicy;

  const sourceRegistry = createPharmacyOutcomeSourceRegistry(policy);
  const replayClassifier = createPharmacyOutcomeReplayClassifier();
  const envelopeWriter = createPharmacyOutcomeEnvelopeWriter();
  const matcher = createPharmacyOutcomeMatcher({
    caseKernelService,
    directoryRepositories,
    dispatchRepositories,
    packageRepositories,
  });
  const settlementService = createPharmacyOutcomeSettlementService(idGenerator);
  const truthProjectionBuilder = createPharmacyOutcomeTruthProjectionBuilder();
  const safetyBridge = createPharmacyOutcomeSafetyBridge({
    repositories: input?.safetyRepositories,
  });

  async function appendAuditEvent(input: {
    pharmacyCaseId: string | null;
    ingestAttemptId: string | null;
    gateId?: string | null;
    settlementId?: string | null;
    eventName: string;
    actorRef?: string | null;
    payload: unknown;
    recordedAt: string;
  }) {
    const current = await repositories.listOutcomeAuditEventsByCase(input.pharmacyCaseId ?? "");
    await repositories.appendOutcomeAuditEvent({
      pharmacyOutcomeAuditEventId: nextId(idGenerator, "pharmacy_outcome_audit"),
      pharmacyCaseId: input.pharmacyCaseId,
      ingestAttemptId: input.ingestAttemptId ?? null,
      outcomeReconciliationGateId: optionalText(input.gateId) ?? null,
      settlementId: optionalText(input.settlementId) ?? null,
      eventName: input.eventName,
      actorRef: optionalText(input.actorRef) ?? null,
      payloadDigest: sha256Hex(stableStringify(input.payload)),
      recordedAt: input.recordedAt,
      version: current.length + 1,
    });
  }

  async function loadCaseContext(
    pharmacyCaseId: string,
  ): Promise<{
    pharmacyCase: PharmacyCaseSnapshot;
    currentConsentCheckpoint: PharmacyConsentCheckpoint | null;
    dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
  }> {
    const bundle = await caseKernelService.getPharmacyCase(pharmacyCaseId);
    invariant(bundle !== null, "PHARMACY_CASE_NOT_FOUND", "PharmacyCase was not found.");
    const currentConsentCheckpoint =
      (
        await directoryRepositories.getLatestConsentCheckpointForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    const dispatchTruth =
      (
        await dispatchRepositories.getCurrentDispatchTruthProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    return {
      pharmacyCase: bundle.pharmacyCase,
      currentConsentCheckpoint,
      dispatchTruth,
    };
  }

  async function persistTruthProjection(input: {
    pharmacyCase: PharmacyCaseSnapshot | null;
    settlement: PharmacyOutcomeSettlementSnapshot;
    ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot;
    normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
    gate: PharmacyOutcomeReconciliationGateSnapshot | null;
  }): Promise<PharmacyOutcomeTruthProjectionSnapshot> {
    const currentTruth =
      input.pharmacyCase === null
        ? null
        : (
            await repositories.getCurrentOutcomeTruthProjectionForCase(
              input.pharmacyCase.pharmacyCaseId,
            )
          )?.toSnapshot() ?? null;
    const nextTruth = truthProjectionBuilder.build({
      pharmacyCase: input.pharmacyCase,
      currentTruth,
      settlement: input.settlement,
      ingestAttempt: input.ingestAttempt,
      normalized: input.normalized,
      gate: input.gate,
    });
    invariant(
      nextTruth !== null,
      "OUTCOME_TRUTH_NOT_AVAILABLE",
      "Outcome truth projection is unavailable for unmatched evidence.",
    );
    await repositories.saveOutcomeTruthProjection(nextTruth, currentTruth ? { expectedVersion: currentTruth.version } : undefined);
    return nextTruth;
  }

  async function createIngestAttempt(input: {
    envelope: OutcomeEvidenceEnvelopeSnapshot;
    normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
    matchPreview: PharmacyOutcomeMatchPreview;
    replayDecision: PharmacyOutcomeReplayDecision;
    manualReviewState: PharmacyOutcomeManualReviewState;
    closeEligibilityState: PharmacyOutcomeCloseEligibilityState;
    settlementState: PharmacyOutcomeIngestSettlementState;
    gateRef?: AggregateRef<"PharmacyOutcomeReconciliationGate", Task343> | null;
    settledAt?: string | null;
  }): Promise<{
    ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot;
    matchScorecard: PharmacyOutcomeMatchScorecardSnapshot;
  }> {
    const ingestAttempt: PharmacyOutcomeIngestAttemptSnapshot = {
      ingestAttemptId: nextId(idGenerator, "pharmacy_outcome_ingest"),
      outcomeEvidenceEnvelopeRef: makeRef(
        "OutcomeEvidenceEnvelope",
        input.envelope.outcomeEvidenceEnvelopeId,
        TASK_343,
      ),
      pharmacyCaseId: input.matchPreview.bestCandidate?.pharmacyCase.pharmacyCaseId ?? null,
      bestCandidateCaseRef:
        input.matchPreview.bestCandidate === null
          ? null
          : makeRef(
              "PharmacyCase",
              input.matchPreview.bestCandidate.pharmacyCase.pharmacyCaseId,
              TASK_342,
            ),
      runnerUpCaseRef:
        input.matchPreview.runnerUp === null
          ? null
          : makeRef(
              "PharmacyCase",
              input.matchPreview.runnerUp.pharmacyCase.pharmacyCaseId,
              TASK_342,
            ),
      matchState: input.matchPreview.matchState,
      matchScore: input.matchPreview.scorecard.matchScore,
      runnerUpMatchScore: input.matchPreview.scorecard.runnerUpMatchScore,
      posteriorMatchConfidence: input.matchPreview.scorecard.posteriorMatchConfidence,
      contradictionScore: input.matchPreview.scorecard.mContra,
      classificationState: input.normalized.classificationState,
      replayState: input.replayDecision.decisionClass,
      manualReviewState: input.manualReviewState,
      outcomeReconciliationGateRef: input.gateRef ?? null,
      autoApplyEligible: input.matchPreview.scorecard.autoApplyThresholdSatisfied,
      closeEligibilityState: input.closeEligibilityState,
      settlementState: input.settlementState,
      createdAt: input.envelope.receivedAt,
      settledAt: input.settledAt ?? null,
      version: 1,
    };
    await repositories.saveOutcomeIngestAttempt(ingestAttempt);

    const matchScorecard: PharmacyOutcomeMatchScorecardSnapshot = {
      pharmacyOutcomeMatchScorecardId: nextId(idGenerator, "pharmacy_outcome_scorecard"),
      ingestAttemptRef: makeRef("PharmacyOutcomeIngestAttempt", ingestAttempt.ingestAttemptId, TASK_343),
      ...input.matchPreview.scorecard,
      version: 1,
    };
    await repositories.saveOutcomeMatchScorecard(matchScorecard);
    return {
      ingestAttempt,
      matchScorecard,
    };
  }

  async function openReviewGate(input: {
    ingestAttemptId: string;
    pharmacyCase: PharmacyCaseSnapshot;
    envelope: OutcomeEvidenceEnvelopeSnapshot;
    normalized: NormalizedPharmacyOutcomeEvidenceSnapshot;
    matchPreview: PharmacyOutcomeMatchPreview;
    actorRef: string;
    recordedAt: string;
  }): Promise<PharmacyOutcomeReconciliationGateSnapshot> {
    const existing =
      (
        await repositories.getCurrentOutcomeReconciliationGateForCase(
          input.pharmacyCase.pharmacyCaseId,
        )
      )?.toSnapshot() ?? null;
    const snapshot: PharmacyOutcomeReconciliationGateSnapshot =
      existing === null
        ? {
            outcomeReconciliationGateId: nextId(idGenerator, "pharmacy_outcome_gate"),
            pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
            ingestAttemptRef: makeRef("PharmacyOutcomeIngestAttempt", input.ingestAttemptId, TASK_343),
            outcomeEvidenceEnvelopeRef: makeRef(
              "OutcomeEvidenceEnvelope",
              input.envelope.outcomeEvidenceEnvelopeId,
              TASK_343,
            ),
            candidateCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
            runnerUpCaseRef:
              input.matchPreview.runnerUp === null
                ? null
                : makeRef(
                    "PharmacyCase",
                    input.matchPreview.runnerUp.pharmacyCase.pharmacyCaseId,
                    TASK_342,
                  ),
            matchScore: input.matchPreview.scorecard.matchScore,
            runnerUpMatchScore: input.matchPreview.scorecard.runnerUpMatchScore,
            posteriorMatchConfidence: input.matchPreview.scorecard.posteriorMatchConfidence,
            contradictionScore: input.matchPreview.scorecard.mContra,
            classificationState: input.normalized.classificationState,
            gateState: "open",
            manualReviewState: "required",
            blockingClosureState: "blocks_close",
            patientVisibilityState: "review_placeholder",
            currentOwnerRef: input.actorRef,
            resolutionNotesRef: null,
            openedAt: input.recordedAt,
            resolvedAt: null,
            version: 1,
          }
        : {
            ...existing,
            ingestAttemptRef: makeRef("PharmacyOutcomeIngestAttempt", input.ingestAttemptId, TASK_343),
            outcomeEvidenceEnvelopeRef: makeRef(
              "OutcomeEvidenceEnvelope",
              input.envelope.outcomeEvidenceEnvelopeId,
              TASK_343,
            ),
            runnerUpCaseRef:
              input.matchPreview.runnerUp === null
                ? null
                : makeRef(
                    "PharmacyCase",
                    input.matchPreview.runnerUp.pharmacyCase.pharmacyCaseId,
                    TASK_342,
                  ),
            matchScore: input.matchPreview.scorecard.matchScore,
            runnerUpMatchScore: input.matchPreview.scorecard.runnerUpMatchScore,
            posteriorMatchConfidence: input.matchPreview.scorecard.posteriorMatchConfidence,
            contradictionScore: input.matchPreview.scorecard.mContra,
            gateState: "open",
            manualReviewState: "required",
            blockingClosureState: "blocks_close",
            patientVisibilityState: "review_placeholder",
            currentOwnerRef: input.actorRef,
            resolutionNotesRef: null,
            resolvedAt: null,
            version: nextVersion(existing.version),
          };
    await repositories.saveOutcomeReconciliationGate(
      snapshot,
      existing ? { expectedVersion: existing.version } : undefined,
    );
    return snapshot;
  }

  async function mutateCaseForOutcome(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    settlement: PharmacyOutcomeSettlementSnapshot;
    classificationState: PharmacyOutcomeClassificationState;
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    actorRef: string;
    reasonCode: string;
    gate: PharmacyOutcomeReconciliationGateSnapshot | null;
    currentCloseBlockers: readonly AggregateRef<"ClosureBlocker", Task344>[];
  }) {
    const disposition =
      input.settlement.result === "review_required"
        ? ("pending_review" satisfies PharmacyOutcomeDisposition)
        : settlementResultToDisposition(input.classificationState);

    return caseKernelService.capturePharmacyOutcome({
      pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
      outcomeRef: makeRef("PharmacyOutcomeSettlement", input.settlement.settlementId, TASK_343),
      correlationRef: input.pharmacyCase.correlationRef,
      disposition,
      currentClosureBlockerRefs: input.currentCloseBlockers,
      activeReachabilityDependencyRefs: input.pharmacyCase.activeReachabilityDependencyRefs,
      actorRef: input.actorRef,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      recordedAt: input.settlement.recordedAt,
      leaseRef: input.pharmacyCase.leaseRef,
      expectedOwnershipEpoch: input.pharmacyCase.ownershipEpoch,
      expectedLineageFenceRef: input.pharmacyCase.lineageFenceRef,
      scopedMutationGateRef:
        input.gate === null
          ? `pharmacy_outcome_mutation_${input.settlement.settlementId}`
          : `pharmacy_outcome_gate_${input.gate.outcomeReconciliationGateId}`,
      reasonCode: input.reasonCode,
      idempotencyKey: `pharmacy_outcome_${input.settlement.settlementId}`,
    });
  }

  async function loadCurrentGateForCase(
    pharmacyCaseId: string,
  ): Promise<PharmacyOutcomeReconciliationGateSnapshot | null> {
    return (
      await repositories.getCurrentOutcomeReconciliationGateForCase(pharmacyCaseId)
    )?.toSnapshot() ?? null;
  }

  return {
    repositories,
    caseKernelService,
    sourceRegistry,
    envelopeWriter,
    replayClassifier,
    matcher,
    settlementService,
    truthProjectionBuilder,
    safetyBridge,

    async previewNormalizedOutcome(command) {
      const parsed = sourceRegistry.parse(command);
      const replayDecision = await replayClassifier.classify({
        parsed,
        repositories,
      });
      return {
        parsed,
        replayDecision,
      };
    },

    async matchOutcomeEvidence(command) {
      const preview = await this.previewNormalizedOutcome(command);
      const persisted = await envelopeWriter.persist({
        parsed: preview.parsed,
        replayDecision: preview.replayDecision,
        repositories,
        idGenerator,
      });
      const matchPreview = await matcher.previewMatch({
        normalized: persisted.normalized,
        envelope: persisted.envelope,
        policy,
      });
      return {
        envelope: persisted.envelope,
        normalized: persisted.normalized,
        replayDecision: preview.replayDecision,
        matchPreview,
        provenance: persisted.provenance,
      };
    },

    async ingestOutcomeEvidence(command) {
      const preview = await this.previewNormalizedOutcome(command);
      const persisted = await envelopeWriter.persist({
        parsed: preview.parsed,
        replayDecision: preview.replayDecision,
        repositories,
        idGenerator,
      });
      const matchPreview = await matcher.previewMatch({
        normalized: persisted.normalized,
        envelope: persisted.envelope,
        policy,
      });

      const currentGate =
        matchPreview.bestCandidate === null
          ? null
          : await loadCurrentGateForCase(matchPreview.bestCandidate.pharmacyCase.pharmacyCaseId);
      const safetySettlement =
        matchPreview.bestCandidate === null
          ? null
          : await safetyBridge.assimilate({
              pharmacyCase: matchPreview.bestCandidate.pharmacyCase,
              normalized: persisted.normalized,
              envelope: persisted.envelope,
              replayDecision: preview.replayDecision,
              currentGate,
            });
      const closeEligibilityState = closeEligibilityFromContext({
        pharmacyCase: matchPreview.bestCandidate?.pharmacyCase ?? null,
        manualReviewRequired:
          preview.replayDecision.decisionClass === "collision_review" ||
          matchPreview.matchState !== "strong_match" ||
          !autoApplyAllowedByTrust({
            policy,
            normalized: persisted.normalized,
            envelope: persisted.envelope,
            exactCorrelationMatched: matchPreview.exactCorrelationMatched,
          }),
        safetySettlement,
      });
      const safetyTriggerDecision = safetySettlement?.materialDelta.triggerDecision ?? null;
      const safetyRequiresReopen =
        safetyTriggerDecision === "re_safety_required" ||
        safetySettlement?.safetyDecision?.requestedSafetyState === "urgent_diversion_required";
      const safetyBlocksAutomaticSettlement = safetyTriggerDecision === "blocked_manual_review";

      if (
        preview.replayDecision.decisionClass === "exact_replay" ||
        preview.replayDecision.decisionClass === "semantic_replay"
      ) {
        const { ingestAttempt, matchScorecard } = await createIngestAttempt({
          envelope: persisted.envelope,
          normalized: persisted.normalized,
          matchPreview,
          replayDecision: preview.replayDecision,
          manualReviewState: "none",
          closeEligibilityState,
          settlementState: "duplicate_ignored",
          settledAt: persisted.envelope.receivedAt,
        });
        const duplicateCase =
          matchPreview.bestCandidate?.pharmacyCase ?? null;
        const duplicateConsent = matchPreview.bestCandidate?.consentCheckpoint ?? null;
        const duplicateDispatchTruth = matchPreview.bestCandidate?.dispatchTruth ?? null;
        const settlement = settlementService.settleDuplicate({
          ingestAttempt,
          pharmacyCase: duplicateCase,
          currentConsentCheckpoint: duplicateConsent,
          recordedAt: persisted.envelope.receivedAt,
          dispatchTruth: duplicateDispatchTruth,
        });
        await repositories.saveOutcomeSettlement(settlement);
        const truth = await persistTruthProjection({
          pharmacyCase: duplicateCase,
          settlement,
          ingestAttempt,
          normalized: persisted.normalized,
          gate: null,
        });
        await appendAuditEvent({
          pharmacyCaseId: duplicateCase?.pharmacyCaseId ?? null,
          ingestAttemptId: ingestAttempt.ingestAttemptId,
          settlementId: settlement.settlementId,
          eventName: "pharmacy.outcome.replay.ignored",
          actorRef: command.actorRef,
          payload: {
            replayDecisionClass: preview.replayDecision.decisionClass,
            priorEnvelopeId: preview.replayDecision.priorEnvelope?.outcomeEvidenceEnvelopeId ?? null,
          },
          recordedAt: persisted.envelope.receivedAt,
        });
        return {
          envelope: persisted.envelope,
          provenance: persisted.provenance,
          normalized: persisted.normalized,
          ingestAttempt,
          matchScorecard,
          reconciliationGate: null,
          settlement,
          outcomeTruthProjection: truth,
          assimilationSettlement: null,
          caseMutation: null,
        };
      }

      if (matchPreview.bestCandidate === null) {
        const { ingestAttempt, matchScorecard } = await createIngestAttempt({
          envelope: persisted.envelope,
          normalized: persisted.normalized,
          matchPreview,
          replayDecision: preview.replayDecision,
          manualReviewState: "required",
          closeEligibilityState: "not_closable",
          settlementState: "unmatched",
          settledAt: persisted.envelope.receivedAt,
        });
        const settlement = settlementService.settleUnmatched({
          ingestAttempt,
          recordedAt: persisted.envelope.receivedAt,
        });
        await repositories.saveOutcomeSettlement(settlement);
        await appendAuditEvent({
          pharmacyCaseId: null,
          ingestAttemptId: ingestAttempt.ingestAttemptId,
          settlementId: settlement.settlementId,
          eventName: "pharmacy.outcome.settled",
          actorRef: command.actorRef,
          payload: {
            result: settlement.result,
            classificationState: persisted.normalized.classificationState,
          },
          recordedAt: persisted.envelope.receivedAt,
        });
        return {
          envelope: persisted.envelope,
          provenance: persisted.provenance,
          normalized: persisted.normalized,
          ingestAttempt,
          matchScorecard,
          reconciliationGate: null,
          settlement,
          outcomeTruthProjection: {
            pharmacyOutcomeTruthProjectionId: stableProjectionId("pharmacy_outcome_truth_unmatched", {
              ingestAttemptId: ingestAttempt.ingestAttemptId,
            }),
            pharmacyCaseId: "unmatched",
            latestOutcomeSettlementRef: settlement.settlementId,
            latestOutcomeRecordRef: settlement.settlementId,
            latestIngestAttemptRef: ingestAttempt.ingestAttemptId,
            outcomeReconciliationGateRef: null,
            outcomeTruthState: "unmatched",
            resolutionClass: persisted.normalized.classificationState,
            matchConfidenceBand: "low",
            contradictionScore: ingestAttempt.contradictionScore,
            manualReviewState: ingestAttempt.manualReviewState,
            closeEligibilityState: "not_closable",
            patientVisibilityState: "hidden",
            continuityEvidenceRef: settlement.experienceContinuityEvidenceRef,
            audienceMessageRef: "pharmacy.outcome.truth.unmatched",
            computedAt: settlement.recordedAt,
            version: 1,
          },
          assimilationSettlement: null,
          caseMutation: null,
        };
      }

      const candidateCase = matchPreview.bestCandidate.pharmacyCase;
      const currentConsentCheckpoint = matchPreview.bestCandidate.consentCheckpoint;
      const currentDispatchTruth = matchPreview.bestCandidate.dispatchTruth;
      const directApplyAllowed =
        autoApplyAllowedByTrust({
          policy,
          normalized: persisted.normalized,
          envelope: persisted.envelope,
          exactCorrelationMatched: matchPreview.exactCorrelationMatched,
        }) &&
        matchPreview.matchState === "strong_match" &&
        preview.replayDecision.decisionClass === "distinct" &&
        currentGate === null &&
        currentConsentCheckpoint?.checkpointState !== "revoked_post_dispatch" &&
        currentConsentCheckpoint?.checkpointState !== "withdrawal_reconciliation" &&
        !safetyBlocksAutomaticSettlement &&
        closeEligibilityState !== "blocked_by_reconciliation";

      if (!directApplyAllowed) {
        const placeholderAttemptId = nextId(idGenerator, "pharmacy_outcome_ingest");
        const gate = await openReviewGate({
          ingestAttemptId: placeholderAttemptId,
          pharmacyCase: candidateCase,
          envelope: persisted.envelope,
          normalized: persisted.normalized,
          matchPreview,
          actorRef:
            optionalText(command.currentOwnerRef) ?? command.actorRef,
          recordedAt: persisted.envelope.receivedAt,
        });
        const { ingestAttempt, matchScorecard } = await createIngestAttempt({
          envelope: persisted.envelope,
          normalized: persisted.normalized,
          matchPreview,
          replayDecision: preview.replayDecision,
          manualReviewState: "required",
          closeEligibilityState: "blocked_by_reconciliation",
          settlementState: "review_required",
          gateRef: makeRef(
            "PharmacyOutcomeReconciliationGate",
            gate.outcomeReconciliationGateId,
            TASK_343,
          ),
          settledAt: persisted.envelope.receivedAt,
        });
        const gateWithAttempt: PharmacyOutcomeReconciliationGateSnapshot = {
          ...gate,
          ingestAttemptRef: makeRef("PharmacyOutcomeIngestAttempt", ingestAttempt.ingestAttemptId, TASK_343),
          version: gate.version + 1,
        };
        await repositories.saveOutcomeReconciliationGate(gateWithAttempt, {
          expectedVersion: gate.version,
        });
        const settlement = settlementService.settleReviewRequired({
          ingestAttempt,
          pharmacyCase: candidateCase,
          currentConsentCheckpoint,
          recordedAt: persisted.envelope.receivedAt,
          dispatchTruth: currentDispatchTruth,
          gateRef: makeRef(
            "PharmacyOutcomeReconciliationGate",
            gate.outcomeReconciliationGateId,
            TASK_343,
          ),
        });
        await repositories.saveOutcomeSettlement(settlement);
        const caseMutation = await mutateCaseForOutcome({
          pharmacyCase: candidateCase,
          settlement,
          classificationState: persisted.normalized.classificationState,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          actorRef: command.actorRef,
          reasonCode: command.reasonCode,
          gate: gateWithAttempt,
          currentCloseBlockers: uniqueSorted([
            ...candidateCase.currentClosureBlockerRefs.map((ref) => ref.refId),
            outcomeClosureBlockerRef(gate.outcomeReconciliationGateId).refId,
          ]).map((refId) => makeRef("ClosureBlocker", refId, TASK_344)),
        });
        const truth = await persistTruthProjection({
          pharmacyCase: caseMutation.pharmacyCase,
          settlement,
          ingestAttempt,
          normalized: persisted.normalized,
          gate: gateWithAttempt,
        });
        await appendAuditEvent({
          pharmacyCaseId: candidateCase.pharmacyCaseId,
          ingestAttemptId: ingestAttempt.ingestAttemptId,
          gateId: gate.outcomeReconciliationGateId,
          settlementId: settlement.settlementId,
          eventName:
            preview.replayDecision.decisionClass === "collision_review"
              ? "pharmacy.outcome.reconciliation.opened"
              : "pharmacy.outcome.settled",
          actorRef: command.actorRef,
          payload: {
            result: settlement.result,
            decisionClass: preview.replayDecision.decisionClass,
            matchState: matchPreview.matchState,
          },
          recordedAt: persisted.envelope.receivedAt,
        });
        return {
          envelope: persisted.envelope,
          provenance: persisted.provenance,
          normalized: persisted.normalized,
          ingestAttempt,
          matchScorecard,
          reconciliationGate: gateWithAttempt,
          settlement,
          outcomeTruthProjection: truth,
          assimilationSettlement: safetySettlement,
          caseMutation,
        };
      }

      const { ingestAttempt, matchScorecard } = await createIngestAttempt({
        envelope: persisted.envelope,
        normalized: persisted.normalized,
        matchPreview,
        replayDecision: preview.replayDecision,
        manualReviewState: "none",
        closeEligibilityState:
          safetyRequiresReopen ? "blocked_by_safety" : "eligible_pending_projection",
        settlementState:
          safetyRequiresReopen ||
          !(
            persisted.normalized.classificationState === "advice_only" ||
            persisted.normalized.classificationState === "medicine_supplied" ||
            persisted.normalized.classificationState === "resolved_no_supply"
          )
            ? "reopened_for_safety"
            : "resolved_pending_projection",
        settledAt: persisted.envelope.receivedAt,
      });
      const settlementResult: Extract<
        PharmacyOutcomeSettlementResult,
        "resolved_pending_projection" | "reopened_for_safety"
      > =
        safetyRequiresReopen ||
        !(
          persisted.normalized.classificationState === "advice_only" ||
          persisted.normalized.classificationState === "medicine_supplied" ||
          persisted.normalized.classificationState === "resolved_no_supply"
        )
          ? "reopened_for_safety"
          : "resolved_pending_projection";
      const settlement = settlementService.settleApplied({
        ingestAttempt,
        pharmacyCase: candidateCase,
        currentConsentCheckpoint,
        recordedAt: persisted.envelope.receivedAt,
        dispatchTruth: currentDispatchTruth,
        result: settlementResult,
        gateRef: null,
      });
      await repositories.saveOutcomeSettlement(settlement);
      const caseMutation = await mutateCaseForOutcome({
        pharmacyCase: candidateCase,
        settlement,
        classificationState: persisted.normalized.classificationState,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        actorRef: command.actorRef,
        reasonCode: command.reasonCode,
        gate: null,
        currentCloseBlockers:
          settlementResult === "resolved_pending_projection"
            ? candidateCase.currentClosureBlockerRefs
            : candidateCase.currentClosureBlockerRefs,
      });
      const truth = await persistTruthProjection({
        pharmacyCase: caseMutation.pharmacyCase,
        settlement,
        ingestAttempt,
        normalized: persisted.normalized,
        gate: null,
      });
      await appendAuditEvent({
        pharmacyCaseId: candidateCase.pharmacyCaseId,
        ingestAttemptId: ingestAttempt.ingestAttemptId,
        settlementId: settlement.settlementId,
        eventName: "pharmacy.outcome.settled",
        actorRef: command.actorRef,
        payload: {
          result: settlement.result,
          classificationState: persisted.normalized.classificationState,
        },
        recordedAt: persisted.envelope.receivedAt,
      });
      return {
        envelope: persisted.envelope,
        provenance: persisted.provenance,
        normalized: persisted.normalized,
        ingestAttempt,
        matchScorecard,
        reconciliationGate: null,
        settlement,
        outcomeTruthProjection: truth,
        assimilationSettlement: safetySettlement,
        caseMutation,
      };
    },

    async resolveOutcomeReconciliationGate(command) {
      const gateDocument = await repositories.getOutcomeReconciliationGate(
        command.outcomeReconciliationGateId,
      );
      invariant(
        gateDocument !== null,
        "OUTCOME_RECONCILIATION_GATE_NOT_FOUND",
        "PharmacyOutcomeReconciliationGate was not found.",
      );
      const gate = gateDocument.toSnapshot();
      const ingestAttemptDocument = await repositories.getOutcomeIngestAttempt(
        gate.ingestAttemptRef.refId,
      );
      invariant(
        ingestAttemptDocument !== null,
        "OUTCOME_INGEST_ATTEMPT_NOT_FOUND",
        "PharmacyOutcomeIngestAttempt was not found.",
      );
      const ingestAttempt = ingestAttemptDocument.toSnapshot();
      const envelopeDocument = await repositories.getOutcomeEvidenceEnvelope(
        gate.outcomeEvidenceEnvelopeRef.refId,
      );
      invariant(
        envelopeDocument !== null,
        "OUTCOME_EVIDENCE_ENVELOPE_NOT_FOUND",
        "OutcomeEvidenceEnvelope was not found.",
      );
      const envelope = envelopeDocument.toSnapshot();
      const normalizedDocument = await repositories.getNormalizedOutcomeEvidenceByEnvelope(
        envelope.outcomeEvidenceEnvelopeId,
      );
      const caseContext = await loadCaseContext(gate.pharmacyCaseId);
      const settlementResult =
        command.resolution === "apply"
          ? ("resolved_pending_projection" as const)
          : command.resolution === "reopen"
            ? ("reopened_for_safety" as const)
            : ("unmatched" as const);
      const nextGate: PharmacyOutcomeReconciliationGateSnapshot = {
        ...gate,
        gateState:
          command.resolution === "apply"
            ? "resolved_apply"
            : command.resolution === "reopen"
              ? "resolved_reopen"
              : "resolved_unmatched",
        manualReviewState:
          command.resolution === "apply"
            ? "approved_apply"
            : command.resolution === "reopen"
              ? "approved_reopen"
              : "approved_unmatched",
        resolutionNotesRef: optionalText(command.resolutionNotesRef),
        resolvedAt: ensureIsoTimestamp(command.recordedAt, "recordedAt"),
        version: nextVersion(gate.version),
      };
      await repositories.saveOutcomeReconciliationGate(nextGate, {
        expectedVersion: gate.version,
      });
      const updatedAttempt: PharmacyOutcomeIngestAttemptSnapshot = {
        ...ingestAttempt,
        manualReviewState:
          command.resolution === "apply"
            ? "approved_apply"
            : command.resolution === "reopen"
              ? "approved_reopen"
              : "approved_unmatched",
        outcomeReconciliationGateRef: makeRef(
          "PharmacyOutcomeReconciliationGate",
          nextGate.outcomeReconciliationGateId,
          TASK_343,
        ),
        settlementState:
          command.resolution === "apply"
            ? "resolved_pending_projection"
            : command.resolution === "reopen"
              ? "reopened_for_safety"
              : "unmatched",
        closeEligibilityState:
          command.resolution === "apply"
            ? "eligible_pending_projection"
            : command.resolution === "reopen"
              ? "blocked_by_safety"
              : "not_closable",
        settledAt: command.recordedAt,
        version: nextVersion(ingestAttempt.version),
      };
      await repositories.saveOutcomeIngestAttempt(updatedAttempt, {
        expectedVersion: ingestAttempt.version,
      });
      const settlement =
        command.resolution === "unmatched"
          ? settlementService.settleUnmatched({
              ingestAttempt: updatedAttempt,
              recordedAt: command.recordedAt,
            })
          : settlementService.settleApplied({
              ingestAttempt: updatedAttempt,
              pharmacyCase: caseContext.pharmacyCase,
              currentConsentCheckpoint: caseContext.currentConsentCheckpoint,
              recordedAt: command.recordedAt,
              dispatchTruth: caseContext.dispatchTruth,
              result:
                command.resolution === "apply"
                  ? "resolved_pending_projection"
                  : "reopened_for_safety",
              gateRef: makeRef(
                "PharmacyOutcomeReconciliationGate",
                nextGate.outcomeReconciliationGateId,
                TASK_343,
              ),
            });
      await repositories.saveOutcomeSettlement(settlement);
      let caseMutation: Awaited<
        ReturnType<Phase6PharmacyCaseKernelService["capturePharmacyOutcome"]>
      > | null = null;
      if (command.resolution !== "unmatched") {
        const normalized = normalizedDocument?.toSnapshot() ?? {
          normalizedPharmacyOutcomeEvidenceId: "missing_normalized",
          outcomeEvidenceEnvelopeRef: makeRef("OutcomeEvidenceEnvelope", envelope.outcomeEvidenceEnvelopeId, TASK_343),
          classificationState: updatedAttempt.classificationState,
          outcomeAt: command.recordedAt,
          patientRefId: caseContext.pharmacyCase.patientRef.refId,
          providerRefId: caseContext.pharmacyCase.selectedProviderRef?.refId ?? null,
          providerOdsCode: null,
          serviceType: caseContext.pharmacyCase.serviceType,
          trustedCorrelationRefs: envelope.correlationRefs,
          sourceFloor: policy.trustSourceFloor[envelope.trustClass],
          transportHintRefs: [],
          routeIntentTupleHash: null,
          rawPayloadRef: null,
          version: 1,
        };
        caseMutation = await mutateCaseForOutcome({
          pharmacyCase: caseContext.pharmacyCase,
          settlement,
          classificationState: normalized.classificationState,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          actorRef: command.actorRef,
          reasonCode: command.reasonCode,
          gate: nextGate,
          currentCloseBlockers:
            command.resolution === "apply"
              ? filterOutcomeClosureBlockerRefs(
                  caseContext.pharmacyCase.currentClosureBlockerRefs,
                  nextGate.outcomeReconciliationGateId,
                )
              : caseContext.pharmacyCase.currentClosureBlockerRefs,
        });
      }
      const truth = await persistTruthProjection({
        pharmacyCase: caseMutation?.pharmacyCase ?? caseContext.pharmacyCase,
        settlement,
        ingestAttempt: updatedAttempt,
        normalized:
          normalizedDocument?.toSnapshot() ?? {
            normalizedPharmacyOutcomeEvidenceId: "missing_normalized",
            outcomeEvidenceEnvelopeRef: makeRef("OutcomeEvidenceEnvelope", envelope.outcomeEvidenceEnvelopeId, TASK_343),
            classificationState: updatedAttempt.classificationState,
            outcomeAt: command.recordedAt,
            patientRefId: caseContext.pharmacyCase.patientRef.refId,
            providerRefId: caseContext.pharmacyCase.selectedProviderRef?.refId ?? null,
            providerOdsCode: null,
            serviceType: caseContext.pharmacyCase.serviceType,
            trustedCorrelationRefs: envelope.correlationRefs,
            sourceFloor: policy.trustSourceFloor[envelope.trustClass],
            transportHintRefs: [],
            routeIntentTupleHash: null,
            rawPayloadRef: null,
            version: 1,
          },
        gate: command.resolution === "apply" ? null : nextGate,
      });
      await appendAuditEvent({
        pharmacyCaseId: gate.pharmacyCaseId,
        ingestAttemptId: updatedAttempt.ingestAttemptId,
        gateId: nextGate.outcomeReconciliationGateId,
        settlementId: settlement.settlementId,
        eventName: "pharmacy.outcome.reconciliation.resolved",
        actorRef: command.actorRef,
        payload: {
          resolution: command.resolution,
          result: settlement.result,
        },
        recordedAt: command.recordedAt,
      });
      return {
        reconciliationGate: nextGate,
        ingestAttempt: updatedAttempt,
        settlement,
        outcomeTruthProjection: truth,
        caseMutation,
      };
    },

    async getOutcomeTruthProjection(pharmacyCaseId) {
      return (
        await repositories.getCurrentOutcomeTruthProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },

    async getOutcomeReviewDebt(pharmacyCaseId) {
      const attempts = (
        pharmacyCaseId
          ? await repositories.listOutcomeIngestAttemptsByCase(pharmacyCaseId)
          : await repositories.listOutcomeIngestAttempts()
      ).map((document) => document.toSnapshot());
      const items: PharmacyOutcomeReviewDebtItem[] = [];
      for (const attempt of attempts) {
        if (
          !["required", "in_review", "approved_apply", "approved_reopen", "approved_unmatched"].includes(
            attempt.manualReviewState,
          ) &&
          attempt.settlementState !== "review_required" &&
          attempt.settlementState !== "unmatched"
        ) {
          continue;
        }
        const gate =
          attempt.outcomeReconciliationGateRef === null
            ? null
            : (
                await repositories.getOutcomeReconciliationGate(
                  attempt.outcomeReconciliationGateRef.refId,
                )
              )?.toSnapshot() ?? null;
        const pharmacyCase = attempt.pharmacyCaseId
          ? (await caseKernelService.getPharmacyCase(attempt.pharmacyCaseId))?.pharmacyCase ?? null
          : null;
        items.push({
          pharmacyCaseId: attempt.pharmacyCaseId,
          ingestAttempt: attempt,
          reconciliationGate: gate,
          closeBlockerRefs: pharmacyCase?.currentClosureBlockerRefs.map((ref) => ref.refId) ?? [],
        });
      }
      return items.sort((left, right) =>
        compareIso(left.ingestAttempt.createdAt, right.ingestAttempt.createdAt),
      );
    },

    async getOutcomeReviewCloseBlockPosture(pharmacyCaseId) {
      const bundle = await caseKernelService.getPharmacyCase(pharmacyCaseId);
      if (!bundle) {
        return null;
      }
      const truth = await repositories.getCurrentOutcomeTruthProjectionForCase(pharmacyCaseId);
      const gate = await repositories.getCurrentOutcomeReconciliationGateForCase(pharmacyCaseId);
      return {
        pharmacyCaseId,
        currentCloseEligibilityState:
          truth?.toSnapshot().closeEligibilityState ?? "not_closable",
        openReconciliationGateRef: gate?.toSnapshot().outcomeReconciliationGateId ?? null,
        closeBlockerRefs: bundle.pharmacyCase.currentClosureBlockerRefs.map((ref) => ref.refId),
        patientVisibilityState: truth?.toSnapshot().patientVisibilityState ?? "hidden",
      };
    },
  };
}
