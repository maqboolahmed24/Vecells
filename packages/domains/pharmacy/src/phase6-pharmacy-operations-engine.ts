import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import {
  createPhase6PharmacyBounceBackStore,
  type Phase6PharmacyBounceBackRepositories,
  type PharmacyBounceBackSupervisorReviewSnapshot,
  type PharmacyBounceBackTruthProjectionSnapshot,
  type PharmacyPracticeVisibilityProjectionSnapshot,
} from "./phase6-pharmacy-bounce-back-engine";
import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  type AggregateRef,
  type Phase6PharmacyCaseKernelService,
  type PharmacyCaseSnapshot,
} from "./phase6-pharmacy-case-kernel";
import {
  createPhase6PharmacyDirectoryChoiceStore,
  type Phase6PharmacyDirectoryChoiceRepositories,
  type PharmacyChoiceTruthProjection,
  type PharmacyConsentCheckpoint,
  type PharmacyConsentRevocationRecord,
  type PharmacyDirectoryFreshnessPosture,
  type PharmacyDirectorySourceSnapshot,
  type PharmacyProvider,
  type PharmacyProviderCapabilitySnapshot,
} from "./phase6-pharmacy-directory-choice-engine";
import {
  createPhase6PharmacyDispatchStore,
  type Phase6PharmacyDispatchRepositories,
  type PharmacyContinuityEvidenceProjectionSnapshot,
  type PharmacyDispatchAttemptSnapshot,
  type PharmacyDispatchTruthProjectionSnapshot,
} from "./phase6-pharmacy-dispatch-engine";
import {
  createPhase6PharmacyOutcomeStore,
  type Phase6PharmacyOutcomeRepositories,
  type PharmacyOutcomeIngestAttemptSnapshot,
  type PharmacyOutcomeReconciliationGateSnapshot,
  type PharmacyOutcomeSettlementSnapshot,
} from "./phase6-pharmacy-outcome-reconciliation-engine";
import {
  createPhase6PharmacyPatientStatusStore,
  type Phase6PharmacyPatientStatusRepositories,
  type PharmacyOutcomeTruthProjectionSnapshot,
  type PharmacyBounceBackRecordSnapshot,
  type PharmacyPatientContinuityProjectionSnapshot,
  type PharmacyPatientInstructionPanelSnapshot,
  type PharmacyPatientStatusProjectionSnapshot,
  type PharmacyReachabilityPlanSnapshot,
} from "./phase6-pharmacy-patient-status-engine";

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_344 =
  "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts" as const;
const TASK_351 =
  "par_351_phase6_track_backend_build_patient_instruction_generation_and_referral_status_projections" as const;
const TASK_353 =
  "par_353_phase6_track_backend_build_bounce_back_urgent_return_and_reopen_mechanics" as const;
const TASK_354 =
  "par_354_phase6_track_backend_build_practice_visibility_operations_queue_and_exception_handling_views_api" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task344 = typeof TASK_344;
type Task351 = typeof TASK_351;
type Task353 = typeof TASK_353;
type Task354 = typeof TASK_354;

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

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireText(value, field);
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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function latestIso(...values: Array<string | null | undefined>): string | null {
  const normalized = values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort(compareIso);
  return normalized.length === 0 ? null : normalized[normalized.length - 1]!;
}

function addHours(timestamp: string, hours: number): string {
  return new Date(Date.parse(timestamp) + hours * 60 * 60_000).toISOString();
}

function minutesBetween(left: string, right: string): number {
  return Math.max(0, Math.round((Date.parse(right) - Date.parse(left)) / 60_000));
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
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableProjectionId(prefix: string, input: unknown): string {
  return `${prefix}_${sha256Hex(stableStringify(input)).slice(0, 16)}`;
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
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

function currentDocumentsFromIndex<T>(
  idsByScope: Map<string, string>,
  snapshots: Map<string, T>,
): readonly SnapshotDocument<T>[] {
  return [...idsByScope.values()]
    .map((id) => snapshots.get(id))
    .filter((snapshot): snapshot is T => snapshot !== undefined)
    .map((snapshot) => new StoredDocument(snapshot));
}

function materialDigest<T extends object>(snapshot: T): string {
  const {
    version: _version,
    computedAt: _computedAt,
    historySummary: _historySummary,
    queueAgeMinutes: _queueAgeMinutes,
    caseAgeMinutes: _caseAgeMinutes,
    ...rest
  } = snapshot as T & {
    version?: number;
    computedAt?: string;
    historySummary?: unknown;
    queueAgeMinutes?: number;
    caseAgeMinutes?: number;
  };
  return sha256Hex(stableStringify(rest));
}

function refreshVolatileSnapshot<T extends { version: number }>(candidate: T, current: T): T {
  const candidateWithCurrentVersion = {
    ...candidate,
    version: current.version,
  };
  return stableStringify(candidateWithCurrentVersion) === stableStringify(current)
    ? current
    : candidateWithCurrentVersion;
}

function severityRank(severity: PharmacyOperationsSeverity): number {
  switch (severity) {
    case "critical":
      return 5;
    case "urgent":
      return 4;
    case "warning":
      return 3;
    case "routine":
      return 2;
    case "healthy":
      return 1;
  }
}

function freshnessRank(state: PharmacyOperationsFreshnessState): number {
  switch (state) {
    case "expired":
      return 4;
    case "stale":
      return 3;
    case "degraded":
      return 2;
    case "current":
      return 1;
  }
}

function continuityRank(state: PharmacyOperationsContinuityState): number {
  switch (state) {
    case "blocked":
      return 3;
    case "stale":
      return 2;
    case "current":
      return 1;
  }
}

function dispatchStateFromTruth(
  pharmacyCase: PharmacyCaseSnapshot,
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null,
): PharmacyPracticeDispatchState {
  if (pharmacyCase.status === "closed") {
    return "closed";
  }
  if (pharmacyCase.status === "unresolved_returned") {
    return "returned";
  }
  if (pharmacyCase.status === "urgent_bounce_back") {
    return "returned";
  }
  if (pharmacyCase.status === "no_contact_return_pending") {
    return "returned";
  }
  if (dispatchTruth === null) {
    if (pharmacyCase.status === "consent_pending") {
      return "consent_pending";
    }
    if (pharmacyCase.status === "provider_selected") {
      return "choice_selected_waiting_consent";
    }
    if (pharmacyCase.status === "eligible_choice_pending") {
      return "choice_pending";
    }
    if (pharmacyCase.status === "dispatch_pending" || pharmacyCase.status === "package_ready") {
      return "dispatch_pending";
    }
    return "not_started";
  }
  if (dispatchTruth.authoritativeProofState === "expired") {
    return "proof_stale";
  }
  if (dispatchTruth.transportAcceptanceState === "rejected") {
    return "dispatch_failed";
  }
  if (dispatchTruth.transportAcceptanceState === "disputed") {
    return "dispatch_failed";
  }
  if (dispatchTruth.authoritativeProofState === "disputed") {
    return "dispatch_failed";
  }
  if (dispatchTruth.authoritativeProofState === "satisfied") {
    return "referred_confirmed";
  }
  return "referred_waiting_proof";
}

function freshnessFromDirectorySources(
  sourceSnapshots: readonly PharmacyDirectorySourceSnapshot[],
): PharmacyOperationsFreshnessState {
  let worst: PharmacyOperationsFreshnessState = "current";
  for (const snapshot of sourceSnapshots) {
    const candidate =
      snapshot.sourceFreshnessPosture === "current"
        ? "current"
        : snapshot.sourceFreshnessPosture === "degraded"
          ? "degraded"
          : snapshot.sourceFreshnessPosture === "stale"
            ? "stale"
            : "expired";
    if (freshnessRank(candidate) > freshnessRank(worst)) {
      worst = candidate;
    }
  }
  return worst;
}

function continuityFromPatientProjection(
  patientContinuity: PharmacyPatientContinuityProjectionSnapshot | null,
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null,
): PharmacyOperationsContinuityState {
  if (patientContinuity !== null) {
    if (patientContinuity.freshnessState === "blocked") {
      return "blocked";
    }
    if (patientContinuity.freshnessState === "stale") {
      return "stale";
    }
    return "current";
  }
  if (dispatchTruth?.proofRiskState === "disputed") {
    return "blocked";
  }
  if (dispatchTruth?.proofRiskState === "likely_failed") {
    return "stale";
  }
  return "current";
}

function providerKeyFromProvider(provider: PharmacyProvider | null): string | null {
  if (provider === null) {
    return null;
  }
  return provider.odsCode;
}

export const defaultPharmacyOperationsPolicy = {
  configuredOutcomeWindowHours: 24,
  conflictingOutcomeContradictionThreshold: 0.25,
  providerCriticalCaseThreshold: 2,
} as const;

export type PharmacyOperationsWorklistFamily =
  | "pharmacy_active_cases_projection"
  | "pharmacy_waiting_for_choice_projection"
  | "pharmacy_dispatched_waiting_outcome_projection"
  | "pharmacy_bounce_back_projection"
  | "pharmacy_dispatch_exception_projection"
  | "pharmacy_provider_health_projection";

export type PharmacyOperationsExceptionClass =
  | "discovery_unavailable"
  | "no_eligible_providers_returned"
  | "dispatch_failed"
  | "acknowledgement_missing"
  | "outcome_unmatched"
  | "no_outcome_within_configured_window"
  | "conflicting_outcomes"
  | "reachability_repair_required"
  | "consent_revoked_after_dispatch"
  | "dispatch_proof_stale";

export type PharmacyOperationsSeverity = "healthy" | "routine" | "warning" | "urgent" | "critical";

export type PharmacyOperationsContinuityState = "current" | "stale" | "blocked";
export type PharmacyOperationsFreshnessState = "current" | "degraded" | "stale" | "expired";
export type PharmacyOperationsReviewDebtState = "none" | "review_required";

export type PharmacyPracticeDispatchState =
  | "not_started"
  | "choice_pending"
  | "choice_selected_waiting_consent"
  | "consent_pending"
  | "dispatch_pending"
  | "referred_waiting_proof"
  | "referred_confirmed"
  | "dispatch_failed"
  | "proof_stale"
  | "returned"
  | "closed";

export type PharmacyProviderDiscoveryAvailabilityState = "healthy" | "degraded" | "unavailable";
export type PharmacyProviderDispatchHealthState = "healthy" | "degraded" | "failing";

export interface PharmacyExceptionEvidenceBundle {
  exceptionClass: PharmacyOperationsExceptionClass;
  severity: PharmacyOperationsSeverity;
  evidenceRefs: readonly string[];
  rationaleRef: string;
}

export interface PharmacyOperationsQueueAgeingSummary {
  youngestQueueAgeMinutes: number;
  oldestQueueAgeMinutes: number;
  averageQueueAgeMinutes: number;
}

export interface PharmacyWorklistSummary {
  worklistFamily: PharmacyOperationsWorklistFamily;
  totalCount: number;
  criticalCount: number;
  urgentCount: number;
  warningCount: number;
  changedSinceSeenCount: number;
  ageing: PharmacyOperationsQueueAgeingSummary;
}

export interface PharmacyOperationsWorklistQueryInput {
  recordedAt?: string;
  providerKeys?: readonly string[];
  minimumQueueAgeMinutes?: number;
  severityAtLeast?: Exclude<PharmacyOperationsSeverity, "healthy"> | null;
  exceptionClasses?: readonly PharmacyOperationsExceptionClass[];
  continuityStates?: readonly PharmacyOperationsContinuityState[];
  reviewDebtState?: PharmacyOperationsReviewDebtState | null;
  sortBy?: "priority" | "queue_age" | "case_age" | "provider" | "freshness" | "continuity";
  sortDirection?: "asc" | "desc";
  seenRows?: readonly PharmacySeenProjectionVersion[];
}

export interface PharmacyProviderHealthQueryInput {
  recordedAt?: string;
  providerKeys?: readonly string[];
  severityAtLeast?: PharmacyOperationsSeverity | null;
  exceptionClasses?: readonly PharmacyOperationsExceptionClass[];
  sortBy?: "priority" | "queue_age" | "provider";
  sortDirection?: "asc" | "desc";
  seenRows?: readonly PharmacySeenProjectionVersion[];
}

export interface PharmacySeenProjectionVersion {
  projectionId: string;
  version: number;
}

export interface PharmacyWorklistDeltaEntry {
  projectionId: string;
  changeType: "added" | "changed" | "removed";
  currentVersion: number | null;
  previousVersion: number | null;
}

export interface PharmacyWorklistDeltaResult {
  worklistFamily: PharmacyOperationsWorklistFamily;
  addedCount: number;
  changedCount: number;
  removedCount: number;
  unchangedCount: number;
  deltaEntries: readonly PharmacyWorklistDeltaEntry[];
}

export interface PharmacyActiveCasesProjectionSnapshot {
  pharmacyActiveCasesProjectionId: string;
  worklistFamily: "pharmacy_active_cases_projection";
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  providerKey: string | null;
  selectedProviderDisplayName: string | null;
  patientStatusProjectionRef: AggregateRef<"PharmacyPatientStatusProjection", Task351> | null;
  practiceVisibilityProjectionRef: AggregateRef<
    "PharmacyPracticeVisibilityProjection",
    Task353
  > | null;
  dispatchTruthProjectionRef: AggregateRef<"PharmacyDispatchTruthProjection", Task343> | null;
  outcomeTruthProjectionRef: AggregateRef<"PharmacyOutcomeTruthProjection", Task343> | null;
  bounceBackTruthProjectionRef: AggregateRef<"PharmacyBounceBackTruthProjection", Task353> | null;
  caseStatus: PharmacyCaseSnapshot["status"];
  dispatchState: PharmacyPracticeDispatchState;
  latestPatientInstructionState: string | null;
  lastOutcomeEvidenceRef: string | null;
  lastOutcomeEvidenceSummaryRef: string | null;
  gpActionRequiredState: string | null;
  triageReentryState: string | null;
  urgentReturnState: string | null;
  reachabilityRepairState: string | null;
  currentCloseBlockerRefs: readonly string[];
  currentConfirmationGateRefs: readonly string[];
  continuityState: PharmacyOperationsContinuityState;
  freshnessState: PharmacyOperationsFreshnessState;
  reviewDebtState: PharmacyOperationsReviewDebtState;
  activeExceptionClasses: readonly PharmacyOperationsExceptionClass[];
  evidenceRefs: readonly string[];
  severity: PharmacyOperationsSeverity;
  queueAgeMinutes: number;
  caseAgeMinutes: number;
  lastMeaningfulEventAt: string;
  latestCaseUpdatedAt: string;
  slaTargetAt: string;
  computedAt: string;
  version: number;
}

export interface PharmacyWaitingForChoiceProjectionSnapshot {
  pharmacyWaitingForChoiceProjectionId: string;
  worklistFamily: "pharmacy_waiting_for_choice_projection";
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  choiceTruthProjectionRef: AggregateRef<"PharmacyChoiceTruthProjection", Task343>;
  directorySnapshotRef: AggregateRef<"PharmacyDirectorySnapshot", Task343>;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  providerKey: string | null;
  selectedProviderDisplayName: string | null;
  visibleChoiceCount: number;
  recommendedFrontierCount: number;
  recommendedFrontierSummaryRef: string;
  warnedChoiceCount: number;
  warnedChoiceSummaryRef: string;
  staleDirectoryPosture: PharmacyOperationsFreshnessState;
  selectedProviderState: PharmacyChoiceTruthProjection["projectionState"];
  patientOverrideRequired: boolean;
  suppressedUnsafeSummaryRef: string | null;
  continuityState: PharmacyOperationsContinuityState;
  freshnessState: PharmacyOperationsFreshnessState;
  reviewDebtState: PharmacyOperationsReviewDebtState;
  activeExceptionClasses: readonly PharmacyOperationsExceptionClass[];
  evidenceRefs: readonly string[];
  severity: PharmacyOperationsSeverity;
  queueAgeMinutes: number;
  caseAgeMinutes: number;
  computedAt: string;
  version: number;
}

export interface PharmacyDispatchedWaitingOutcomeProjectionSnapshot {
  pharmacyDispatchedWaitingOutcomeProjectionId: string;
  worklistFamily: "pharmacy_dispatched_waiting_outcome_projection";
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  dispatchTruthProjectionRef: AggregateRef<"PharmacyDispatchTruthProjection", Task343>;
  dispatchAttemptRef: AggregateRef<"PharmacyDispatchAttempt", Task343>;
  outcomeTruthProjectionRef: AggregateRef<"PharmacyOutcomeTruthProjection", Task343> | null;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  providerKey: string | null;
  selectedProviderDisplayName: string | null;
  transportMode: string;
  dispatchState: PharmacyPracticeDispatchState;
  authoritativeProofState: PharmacyDispatchTruthProjectionSnapshot["authoritativeProofState"];
  proofRiskState: PharmacyDispatchTruthProjectionSnapshot["proofRiskState"];
  proofDeadlineAt: string;
  outcomeTruthState: PharmacyOutcomeTruthProjectionSnapshot["outcomeTruthState"] | "not_received";
  noOutcomeWindowBreached: boolean;
  continuityState: PharmacyOperationsContinuityState;
  freshnessState: PharmacyOperationsFreshnessState;
  reviewDebtState: PharmacyOperationsReviewDebtState;
  activeExceptionClasses: readonly PharmacyOperationsExceptionClass[];
  evidenceRefs: readonly string[];
  severity: PharmacyOperationsSeverity;
  queueAgeMinutes: number;
  caseAgeMinutes: number;
  computedAt: string;
  version: number;
}

export interface PharmacyBounceBackProjectionSnapshot {
  pharmacyBounceBackProjectionId: string;
  worklistFamily: "pharmacy_bounce_back_projection";
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  bounceBackTruthProjectionRef: AggregateRef<"PharmacyBounceBackTruthProjection", Task353>;
  bounceBackRecordRef: AggregateRef<"PharmacyBounceBackRecord", Task344>;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  providerKey: string | null;
  selectedProviderDisplayName: string | null;
  bounceBackType: PharmacyBounceBackRecordSnapshot["bounceBackType"];
  reopenedCaseStatus: PharmacyBounceBackTruthProjectionSnapshot["reopenedCaseStatus"];
  gpActionRequired: boolean;
  triageReentryState: PharmacyBounceBackTruthProjectionSnapshot["triageReentryState"];
  urgentReturnState: string | null;
  reachabilityRepairState: string | null;
  supervisorReviewState: PharmacyBounceBackRecordSnapshot["supervisorReviewState"];
  loopRisk: number;
  reopenPriorityBand: number;
  continuityState: PharmacyOperationsContinuityState;
  freshnessState: PharmacyOperationsFreshnessState;
  reviewDebtState: PharmacyOperationsReviewDebtState;
  activeExceptionClasses: readonly PharmacyOperationsExceptionClass[];
  evidenceRefs: readonly string[];
  severity: PharmacyOperationsSeverity;
  queueAgeMinutes: number;
  caseAgeMinutes: number;
  computedAt: string;
  version: number;
}

export interface PharmacyDispatchExceptionProjectionSnapshot {
  pharmacyDispatchExceptionProjectionId: string;
  worklistFamily: "pharmacy_dispatch_exception_projection";
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  providerKey: string | null;
  selectedProviderDisplayName: string | null;
  primaryExceptionClass: PharmacyOperationsExceptionClass;
  activeExceptionClasses: readonly PharmacyOperationsExceptionClass[];
  exceptionEvidence: readonly PharmacyExceptionEvidenceBundle[];
  continuityState: PharmacyOperationsContinuityState;
  freshnessState: PharmacyOperationsFreshnessState;
  reviewDebtState: PharmacyOperationsReviewDebtState;
  severity: PharmacyOperationsSeverity;
  evidenceRefs: readonly string[];
  queueAgeMinutes: number;
  caseAgeMinutes: number;
  computedAt: string;
  version: number;
}

export interface PharmacyProviderTransportHealthSummary {
  transportMode: string;
  activeCaseCount: number;
  dispatchFailureCount: number;
  acknowledgementDebtCount: number;
  staleProofCount: number;
}

export interface PharmacyProviderHealthProjectionSnapshot {
  pharmacyProviderHealthProjectionId: string;
  worklistFamily: "pharmacy_provider_health_projection";
  providerKey: string;
  latestProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  providerDisplayName: string;
  discoveryAvailabilityState: PharmacyProviderDiscoveryAvailabilityState;
  dispatchHealthState: PharmacyProviderDispatchHealthState;
  continuityState: PharmacyOperationsContinuityState;
  freshnessState: PharmacyOperationsFreshnessState;
  reviewDebtState: PharmacyOperationsReviewDebtState;
  activeExceptionClasses: readonly PharmacyOperationsExceptionClass[];
  evidenceRefs: readonly string[];
  activeCaseCount: number;
  waitingForChoiceCount: number;
  dispatchFailureCount: number;
  acknowledgementDebtCount: number;
  staleProofCount: number;
  unmatchedOutcomeCount: number;
  conflictingOutcomeCount: number;
  reachabilityRepairCaseCount: number;
  consentRevokedAfterDispatchCount: number;
  transportSummaries: readonly PharmacyProviderTransportHealthSummary[];
  lastGoodEvidenceAt: string | null;
  latestEvidenceAt: string | null;
  queueAgeMinutes: number;
  severity: PharmacyOperationsSeverity;
  computedAt: string;
  version: number;
}

export interface PharmacyPracticeVisibilityModelSnapshot {
  pharmacyCaseId: string;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  providerKey: string | null;
  selectedProviderDisplayName: string | null;
  dispatchState: PharmacyPracticeDispatchState;
  latestPatientInstructionState: string | null;
  lastOutcomeEvidenceRef: string | null;
  lastOutcomeEvidenceSummaryRef: string | null;
  gpActionRequiredState: string | null;
  triageReentryState: string | null;
  urgentReturnState: string | null;
  reachabilityRepairState: string | null;
  currentCloseBlockerRefs: readonly string[];
  currentConfirmationGateRefs: readonly string[];
  continuityState: PharmacyOperationsContinuityState;
  freshnessState: PharmacyOperationsFreshnessState;
  minimumNecessaryTimestamps: {
    caseCreatedAt: string;
    caseUpdatedAt: string;
    lastMeaningfulEventAt: string;
    proofDeadlineAt: string | null;
    latestOutcomeAt: string | null;
  };
  minimumNecessaryRefs: {
    patientStatusProjectionRef: string | null;
    practiceVisibilityProjectionRef: string | null;
    dispatchTruthProjectionRef: string | null;
    outcomeTruthProjectionRef: string | null;
    bounceBackTruthProjectionRef: string | null;
  };
  activeExceptionClasses: readonly PharmacyOperationsExceptionClass[];
  computedAt: string;
  version: number;
}

export interface PharmacyOperationsAuditEventSnapshot {
  pharmacyOperationsAuditEventId: string;
  scopeKind: "pharmacy_case" | "provider";
  scopeRef: string;
  projectionFamily: PharmacyOperationsWorklistFamily;
  eventName: string;
  severity: PharmacyOperationsSeverity;
  primaryExceptionClass: PharmacyOperationsExceptionClass | null;
  evidenceRefs: readonly string[];
  payloadDigest: string;
  recordedAt: string;
  version: number;
}

export interface PharmacyProviderHealthDetail {
  projection: PharmacyProviderHealthProjectionSnapshot;
  historySummary: readonly PharmacyOperationsAuditEventSnapshot[];
}

export interface PharmacyOperationsProjectionBuilder {
  buildOperationsProjections(input: {
    context: CaseOperationsContext;
    exceptionEvidence: readonly PharmacyExceptionEvidenceBundle[];
    practiceVisibilityModel: PharmacyPracticeVisibilityModelSnapshot;
    recordedAt: string;
  }): {
    activeCasesProjection: PharmacyActiveCasesProjectionSnapshot | null;
    waitingForChoiceProjection: PharmacyWaitingForChoiceProjectionSnapshot | null;
    dispatchedWaitingOutcomeProjection: PharmacyDispatchedWaitingOutcomeProjectionSnapshot | null;
    bounceBackProjection: PharmacyBounceBackProjectionSnapshot | null;
    dispatchExceptionProjection: PharmacyDispatchExceptionProjectionSnapshot | null;
  };
}

export interface PharmacyPracticeVisibilityProjectionBuilder {
  buildPracticeVisibilityModel(input: {
    context: CaseOperationsContext;
    exceptionEvidence: readonly PharmacyExceptionEvidenceBundle[];
    recordedAt: string;
  }): PharmacyPracticeVisibilityModelSnapshot;
}

export interface PharmacyExceptionClassifier {
  classifyCase(input: {
    context: CaseOperationsContext;
    recordedAt: string;
  }): readonly PharmacyExceptionEvidenceBundle[];
}

export interface PharmacyProviderHealthProjectionBuilder {
  buildProviderHealthProjections(input: {
    contexts: readonly CaseOperationsContext[];
    exceptionEvidenceByCaseId: ReadonlyMap<string, readonly PharmacyExceptionEvidenceBundle[]>;
    currentActiveCases: ReadonlyMap<string, PharmacyActiveCasesProjectionSnapshot>;
    currentWaitingForChoice: ReadonlyMap<string, PharmacyWaitingForChoiceProjectionSnapshot>;
    currentDispatchedWaitingOutcome: ReadonlyMap<
      string,
      PharmacyDispatchedWaitingOutcomeProjectionSnapshot
    >;
    currentBounceBack: ReadonlyMap<string, PharmacyBounceBackProjectionSnapshot>;
    recordedAt: string;
  }): readonly PharmacyProviderHealthProjectionSnapshot[];
}

export interface PharmacyWorklistDeltaService {
  computeChangedSinceSeen<T extends { version: number }>(input: {
    worklistFamily: PharmacyOperationsWorklistFamily;
    currentRows: readonly T[];
    seenRows: readonly PharmacySeenProjectionVersion[];
    projectionIdSelector: (row: T) => string;
  }): PharmacyWorklistDeltaResult;
}

export interface PharmacyOperationsQueryService {
  fetchActiveCasesWorklist(input?: PharmacyOperationsWorklistQueryInput): Promise<{
    rows: readonly PharmacyActiveCasesProjectionSnapshot[];
    summary: PharmacyWorklistSummary;
  }>;
  fetchWaitingForChoiceWorklist(input?: PharmacyOperationsWorklistQueryInput): Promise<{
    rows: readonly PharmacyWaitingForChoiceProjectionSnapshot[];
    summary: PharmacyWorklistSummary;
  }>;
  fetchDispatchedWaitingOutcomeWorklist(input?: PharmacyOperationsWorklistQueryInput): Promise<{
    rows: readonly PharmacyDispatchedWaitingOutcomeProjectionSnapshot[];
    summary: PharmacyWorklistSummary;
  }>;
  fetchBounceBackWorklist(input?: PharmacyOperationsWorklistQueryInput): Promise<{
    rows: readonly PharmacyBounceBackProjectionSnapshot[];
    summary: PharmacyWorklistSummary;
  }>;
  fetchDispatchExceptionWorklist(input?: PharmacyOperationsWorklistQueryInput): Promise<{
    rows: readonly PharmacyDispatchExceptionProjectionSnapshot[];
    summary: PharmacyWorklistSummary;
  }>;
  fetchProviderHealthSummary(input?: PharmacyProviderHealthQueryInput): Promise<{
    rows: readonly PharmacyProviderHealthProjectionSnapshot[];
    summary: PharmacyWorklistSummary;
  }>;
  fetchProviderHealthDetail(
    providerKey: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyProviderHealthDetail | null>;
  fetchPracticeVisibilityModel(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyPracticeVisibilityModelSnapshot | null>;
  fetchQueueCountsAndAgeingSummaries(input?: {
    recordedAt?: string;
    seenRowsByWorklist?: Partial<
      Record<PharmacyOperationsWorklistFamily, readonly PharmacySeenProjectionVersion[]>
    >;
  }): Promise<readonly PharmacyWorklistSummary[]>;
  fetchChangedSinceSeenDeltas(input: {
    recordedAt?: string;
    worklistFamily: PharmacyOperationsWorklistFamily;
    seenRows: readonly PharmacySeenProjectionVersion[];
  }): Promise<PharmacyWorklistDeltaResult>;
}

export interface Phase6PharmacyOperationsRepositories {
  getActiveCasesProjection(
    pharmacyActiveCasesProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyActiveCasesProjectionSnapshot> | null>;
  getCurrentActiveCasesProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyActiveCasesProjectionSnapshot> | null>;
  listCurrentActiveCasesProjections(): Promise<
    readonly SnapshotDocument<PharmacyActiveCasesProjectionSnapshot>[]
  >;
  saveActiveCasesProjection(
    snapshot: PharmacyActiveCasesProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  clearCurrentActiveCasesProjectionForCase(pharmacyCaseId: string): Promise<void>;
  getWaitingForChoiceProjection(
    pharmacyWaitingForChoiceProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyWaitingForChoiceProjectionSnapshot> | null>;
  getCurrentWaitingForChoiceProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyWaitingForChoiceProjectionSnapshot> | null>;
  listCurrentWaitingForChoiceProjections(): Promise<
    readonly SnapshotDocument<PharmacyWaitingForChoiceProjectionSnapshot>[]
  >;
  saveWaitingForChoiceProjection(
    snapshot: PharmacyWaitingForChoiceProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  clearCurrentWaitingForChoiceProjectionForCase(pharmacyCaseId: string): Promise<void>;
  getDispatchedWaitingOutcomeProjection(
    pharmacyDispatchedWaitingOutcomeProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchedWaitingOutcomeProjectionSnapshot> | null>;
  getCurrentDispatchedWaitingOutcomeProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchedWaitingOutcomeProjectionSnapshot> | null>;
  listCurrentDispatchedWaitingOutcomeProjections(): Promise<
    readonly SnapshotDocument<PharmacyDispatchedWaitingOutcomeProjectionSnapshot>[]
  >;
  saveDispatchedWaitingOutcomeProjection(
    snapshot: PharmacyDispatchedWaitingOutcomeProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  clearCurrentDispatchedWaitingOutcomeProjectionForCase(pharmacyCaseId: string): Promise<void>;
  getBounceBackProjection(
    pharmacyBounceBackProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackProjectionSnapshot> | null>;
  getCurrentBounceBackProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackProjectionSnapshot> | null>;
  listCurrentBounceBackProjections(): Promise<
    readonly SnapshotDocument<PharmacyBounceBackProjectionSnapshot>[]
  >;
  saveBounceBackProjection(
    snapshot: PharmacyBounceBackProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  clearCurrentBounceBackProjectionForCase(pharmacyCaseId: string): Promise<void>;
  getDispatchExceptionProjection(
    pharmacyDispatchExceptionProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchExceptionProjectionSnapshot> | null>;
  getCurrentDispatchExceptionProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchExceptionProjectionSnapshot> | null>;
  listCurrentDispatchExceptionProjections(): Promise<
    readonly SnapshotDocument<PharmacyDispatchExceptionProjectionSnapshot>[]
  >;
  saveDispatchExceptionProjection(
    snapshot: PharmacyDispatchExceptionProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  clearCurrentDispatchExceptionProjectionForCase(pharmacyCaseId: string): Promise<void>;
  getProviderHealthProjection(
    pharmacyProviderHealthProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyProviderHealthProjectionSnapshot> | null>;
  getCurrentProviderHealthProjection(
    providerKey: string,
  ): Promise<SnapshotDocument<PharmacyProviderHealthProjectionSnapshot> | null>;
  listCurrentProviderHealthProjections(): Promise<
    readonly SnapshotDocument<PharmacyProviderHealthProjectionSnapshot>[]
  >;
  saveProviderHealthProjection(
    snapshot: PharmacyProviderHealthProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  clearCurrentProviderHealthProjection(providerKey: string): Promise<void>;
  listOperationsAuditEventsForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyOperationsAuditEventSnapshot>[]>;
  listOperationsAuditEventsForProvider(
    providerKey: string,
  ): Promise<readonly SnapshotDocument<PharmacyOperationsAuditEventSnapshot>[]>;
  appendOperationsAuditEvent(snapshot: PharmacyOperationsAuditEventSnapshot): Promise<void>;
}

export interface Phase6PharmacyOperationsStore extends Phase6PharmacyOperationsRepositories {}

export function createPhase6PharmacyOperationsStore(): Phase6PharmacyOperationsStore {
  const activeCases = new Map<string, PharmacyActiveCasesProjectionSnapshot>();
  const currentActiveCaseByCase = new Map<string, string>();
  const waitingChoice = new Map<string, PharmacyWaitingForChoiceProjectionSnapshot>();
  const currentWaitingChoiceByCase = new Map<string, string>();
  const waitingOutcome = new Map<string, PharmacyDispatchedWaitingOutcomeProjectionSnapshot>();
  const currentWaitingOutcomeByCase = new Map<string, string>();
  const bounceBack = new Map<string, PharmacyBounceBackProjectionSnapshot>();
  const currentBounceBackByCase = new Map<string, string>();
  const dispatchExceptions = new Map<string, PharmacyDispatchExceptionProjectionSnapshot>();
  const currentDispatchExceptionByCase = new Map<string, string>();
  const providerHealth = new Map<string, PharmacyProviderHealthProjectionSnapshot>();
  const currentProviderHealthByKey = new Map<string, string>();
  const auditEvents = new Map<string, PharmacyOperationsAuditEventSnapshot>();
  const auditIdsByCase = new Map<string, string[]>();
  const auditIdsByProvider = new Map<string, string[]>();

  function appendAuditIndex(index: Map<string, string[]>, key: string, id: string) {
    const current = new Set(index.get(key) ?? []);
    current.add(id);
    index.set(
      key,
      [...current].sort((left, right) => left.localeCompare(right)),
    );
  }

  async function appendOperationsAuditEvent(snapshot: PharmacyOperationsAuditEventSnapshot) {
    auditEvents.set(snapshot.pharmacyOperationsAuditEventId, structuredClone(snapshot));
    if (snapshot.scopeKind === "pharmacy_case") {
      appendAuditIndex(auditIdsByCase, snapshot.scopeRef, snapshot.pharmacyOperationsAuditEventId);
      return;
    }
    appendAuditIndex(
      auditIdsByProvider,
      snapshot.scopeRef,
      snapshot.pharmacyOperationsAuditEventId,
    );
  }

  return {
    async getActiveCasesProjection(pharmacyActiveCasesProjectionId) {
      const snapshot = activeCases.get(pharmacyActiveCasesProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentActiveCasesProjectionForCase(pharmacyCaseId) {
      const id = currentActiveCaseByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(activeCases.get(id)!);
    },
    async listCurrentActiveCasesProjections() {
      return currentDocumentsFromIndex(currentActiveCaseByCase, activeCases);
    },
    async saveActiveCasesProjection(snapshot, options) {
      saveWithCas(activeCases, snapshot.pharmacyActiveCasesProjectionId, snapshot, options);
      currentActiveCaseByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyActiveCasesProjectionId,
      );
    },
    async clearCurrentActiveCasesProjectionForCase(pharmacyCaseId) {
      currentActiveCaseByCase.delete(pharmacyCaseId);
    },
    async getWaitingForChoiceProjection(pharmacyWaitingForChoiceProjectionId) {
      const snapshot = waitingChoice.get(pharmacyWaitingForChoiceProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentWaitingForChoiceProjectionForCase(pharmacyCaseId) {
      const id = currentWaitingChoiceByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(waitingChoice.get(id)!);
    },
    async listCurrentWaitingForChoiceProjections() {
      return currentDocumentsFromIndex(currentWaitingChoiceByCase, waitingChoice);
    },
    async saveWaitingForChoiceProjection(snapshot, options) {
      saveWithCas(waitingChoice, snapshot.pharmacyWaitingForChoiceProjectionId, snapshot, options);
      currentWaitingChoiceByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyWaitingForChoiceProjectionId,
      );
    },
    async clearCurrentWaitingForChoiceProjectionForCase(pharmacyCaseId) {
      currentWaitingChoiceByCase.delete(pharmacyCaseId);
    },
    async getDispatchedWaitingOutcomeProjection(pharmacyDispatchedWaitingOutcomeProjectionId) {
      const snapshot = waitingOutcome.get(pharmacyDispatchedWaitingOutcomeProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentDispatchedWaitingOutcomeProjectionForCase(pharmacyCaseId) {
      const id = currentWaitingOutcomeByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(waitingOutcome.get(id)!);
    },
    async listCurrentDispatchedWaitingOutcomeProjections() {
      return currentDocumentsFromIndex(currentWaitingOutcomeByCase, waitingOutcome);
    },
    async saveDispatchedWaitingOutcomeProjection(snapshot, options) {
      saveWithCas(
        waitingOutcome,
        snapshot.pharmacyDispatchedWaitingOutcomeProjectionId,
        snapshot,
        options,
      );
      currentWaitingOutcomeByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyDispatchedWaitingOutcomeProjectionId,
      );
    },
    async clearCurrentDispatchedWaitingOutcomeProjectionForCase(pharmacyCaseId) {
      currentWaitingOutcomeByCase.delete(pharmacyCaseId);
    },
    async getBounceBackProjection(pharmacyBounceBackProjectionId) {
      const snapshot = bounceBack.get(pharmacyBounceBackProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentBounceBackProjectionForCase(pharmacyCaseId) {
      const id = currentBounceBackByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(bounceBack.get(id)!);
    },
    async listCurrentBounceBackProjections() {
      return currentDocumentsFromIndex(currentBounceBackByCase, bounceBack);
    },
    async saveBounceBackProjection(snapshot, options) {
      saveWithCas(bounceBack, snapshot.pharmacyBounceBackProjectionId, snapshot, options);
      currentBounceBackByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyBounceBackProjectionId,
      );
    },
    async clearCurrentBounceBackProjectionForCase(pharmacyCaseId) {
      currentBounceBackByCase.delete(pharmacyCaseId);
    },
    async getDispatchExceptionProjection(pharmacyDispatchExceptionProjectionId) {
      const snapshot = dispatchExceptions.get(pharmacyDispatchExceptionProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentDispatchExceptionProjectionForCase(pharmacyCaseId) {
      const id = currentDispatchExceptionByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(dispatchExceptions.get(id)!);
    },
    async listCurrentDispatchExceptionProjections() {
      return currentDocumentsFromIndex(currentDispatchExceptionByCase, dispatchExceptions);
    },
    async saveDispatchExceptionProjection(snapshot, options) {
      saveWithCas(
        dispatchExceptions,
        snapshot.pharmacyDispatchExceptionProjectionId,
        snapshot,
        options,
      );
      currentDispatchExceptionByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyDispatchExceptionProjectionId,
      );
    },
    async clearCurrentDispatchExceptionProjectionForCase(pharmacyCaseId) {
      currentDispatchExceptionByCase.delete(pharmacyCaseId);
    },
    async getProviderHealthProjection(pharmacyProviderHealthProjectionId) {
      const snapshot = providerHealth.get(pharmacyProviderHealthProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentProviderHealthProjection(providerKey) {
      const id = currentProviderHealthByKey.get(providerKey);
      return id === undefined ? null : new StoredDocument(providerHealth.get(id)!);
    },
    async listCurrentProviderHealthProjections() {
      return currentDocumentsFromIndex(currentProviderHealthByKey, providerHealth);
    },
    async saveProviderHealthProjection(snapshot, options) {
      saveWithCas(providerHealth, snapshot.pharmacyProviderHealthProjectionId, snapshot, options);
      currentProviderHealthByKey.set(
        snapshot.providerKey,
        snapshot.pharmacyProviderHealthProjectionId,
      );
    },
    async clearCurrentProviderHealthProjection(providerKey) {
      currentProviderHealthByKey.delete(providerKey);
    },
    async listOperationsAuditEventsForCase(pharmacyCaseId) {
      return (auditIdsByCase.get(pharmacyCaseId) ?? [])
        .map((id) => auditEvents.get(id))
        .filter((entry): entry is PharmacyOperationsAuditEventSnapshot => entry !== undefined)
        .map((entry) => new StoredDocument(entry));
    },
    async listOperationsAuditEventsForProvider(providerKey) {
      return (auditIdsByProvider.get(providerKey) ?? [])
        .map((id) => auditEvents.get(id))
        .filter((entry): entry is PharmacyOperationsAuditEventSnapshot => entry !== undefined)
        .map((entry) => new StoredDocument(entry));
    },
    appendOperationsAuditEvent,
  };
}

interface CaseOperationsContext {
  pharmacyCase: PharmacyCaseSnapshot;
  choiceTruth: PharmacyChoiceTruthProjection | null;
  consentCheckpoint: PharmacyConsentCheckpoint | null;
  latestConsentRevocation: PharmacyConsentRevocationRecord | null;
  latestDirectorySources: readonly PharmacyDirectorySourceSnapshot[];
  latestDirectoryProviders: readonly PharmacyProvider[];
  latestDirectoryCapabilities: readonly PharmacyProviderCapabilitySnapshot[];
  selectedProvider: PharmacyProvider | null;
  selectedProviderCapability: PharmacyProviderCapabilitySnapshot | null;
  dispatchAttempt: PharmacyDispatchAttemptSnapshot | null;
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
  continuityProjection: PharmacyContinuityEvidenceProjectionSnapshot | null;
  outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot | null;
  outcomeGate: PharmacyOutcomeReconciliationGateSnapshot | null;
  outcomeSettlement: PharmacyOutcomeSettlementSnapshot | null;
  outcomeIngestAttempts: readonly PharmacyOutcomeIngestAttemptSnapshot[];
  patientStatus: PharmacyPatientStatusProjectionSnapshot | null;
  patientContinuity: PharmacyPatientContinuityProjectionSnapshot | null;
  patientInstructionPanel: PharmacyPatientInstructionPanelSnapshot | null;
  practiceVisibility: PharmacyPracticeVisibilityProjectionSnapshot | null;
  bounceBackRecord: PharmacyBounceBackRecordSnapshot | null;
  bounceBackTruth: PharmacyBounceBackTruthProjectionSnapshot | null;
  supervisorReview: PharmacyBounceBackSupervisorReviewSnapshot | null;
  reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
}

export interface Phase6PharmacyOperationsServiceDependencies {
  repositories?: Phase6PharmacyOperationsStore;
  caseKernelService?: Phase6PharmacyCaseKernelService;
  directoryRepositories?: Phase6PharmacyDirectoryChoiceRepositories;
  dispatchRepositories?: Phase6PharmacyDispatchRepositories;
  outcomeRepositories?: Phase6PharmacyOutcomeRepositories;
  patientStatusRepositories?: Phase6PharmacyPatientStatusRepositories;
  bounceBackRepositories?: Phase6PharmacyBounceBackRepositories;
}

export interface Phase6PharmacyOperationsService {
  readonly repositories: Phase6PharmacyOperationsStore;
  readonly operationsProjectionBuilder: PharmacyOperationsProjectionBuilder;
  readonly practiceVisibilityProjectionBuilder: PharmacyPracticeVisibilityProjectionBuilder;
  readonly exceptionClassifier: PharmacyExceptionClassifier;
  readonly providerHealthProjectionBuilder: PharmacyProviderHealthProjectionBuilder;
  readonly worklistDeltaService: PharmacyWorklistDeltaService;
  readonly queryService: PharmacyOperationsQueryService;
  refreshOperationsProjections(input?: { recordedAt?: string }): Promise<{
    activeCases: readonly PharmacyActiveCasesProjectionSnapshot[];
    waitingForChoice: readonly PharmacyWaitingForChoiceProjectionSnapshot[];
    waitingOutcome: readonly PharmacyDispatchedWaitingOutcomeProjectionSnapshot[];
    bounceBack: readonly PharmacyBounceBackProjectionSnapshot[];
    exceptions: readonly PharmacyDispatchExceptionProjectionSnapshot[];
    providerHealth: readonly PharmacyProviderHealthProjectionSnapshot[];
  }>;
}

function buildQueueSummary<
  T extends { severity: PharmacyOperationsSeverity; queueAgeMinutes: number },
>(
  worklistFamily: PharmacyOperationsWorklistFamily,
  rows: readonly T[],
  changedSinceSeenCount: number,
): PharmacyWorklistSummary {
  const queueAges = rows.map((row) => row.queueAgeMinutes);
  const average =
    queueAges.length === 0
      ? 0
      : Math.round(queueAges.reduce((sum, value) => sum + value, 0) / queueAges.length);
  return {
    worklistFamily,
    totalCount: rows.length,
    criticalCount: rows.filter((row) => row.severity === "critical").length,
    urgentCount: rows.filter((row) => row.severity === "urgent").length,
    warningCount: rows.filter((row) => row.severity === "warning").length,
    changedSinceSeenCount,
    ageing: {
      youngestQueueAgeMinutes: queueAges.length === 0 ? 0 : Math.min(...queueAges),
      oldestQueueAgeMinutes: queueAges.length === 0 ? 0 : Math.max(...queueAges),
      averageQueueAgeMinutes: average,
    },
  };
}

function createPharmacyWorklistDeltaService(): PharmacyWorklistDeltaService {
  return {
    computeChangedSinceSeen<T extends { version: number }>(input: {
      worklistFamily: PharmacyOperationsWorklistFamily;
      currentRows: readonly T[];
      seenRows: readonly PharmacySeenProjectionVersion[];
      projectionIdSelector: (row: T) => string;
    }): PharmacyWorklistDeltaResult {
      const seenByProjectionId = new Map<string, number>(
        input.seenRows.map((entry) => [entry.projectionId, entry.version]),
      );
      const currentIds = new Set<string>();
      const deltaEntries: PharmacyWorklistDeltaEntry[] = [];
      let unchangedCount = 0;
      for (const row of input.currentRows) {
        const projectionId = input.projectionIdSelector(row);
        currentIds.add(projectionId);
        const previousVersion = seenByProjectionId.get(projectionId);
        if (previousVersion === undefined) {
          deltaEntries.push({
            projectionId,
            changeType: "added",
            currentVersion: row.version,
            previousVersion: null,
          });
          continue;
        }
        if (previousVersion !== row.version) {
          deltaEntries.push({
            projectionId,
            changeType: "changed",
            currentVersion: row.version,
            previousVersion: previousVersion ?? null,
          });
          continue;
        }
        unchangedCount += 1;
      }
      for (const seen of input.seenRows) {
        if (currentIds.has(seen.projectionId)) {
          continue;
        }
        deltaEntries.push({
          projectionId: seen.projectionId,
          changeType: "removed",
          currentVersion: null,
          previousVersion: seen.version,
        });
      }
      return {
        worklistFamily: input.worklistFamily,
        addedCount: deltaEntries.filter((entry) => entry.changeType === "added").length,
        changedCount: deltaEntries.filter((entry) => entry.changeType === "changed").length,
        removedCount: deltaEntries.filter((entry) => entry.changeType === "removed").length,
        unchangedCount,
        deltaEntries,
      };
    },
  };
}

function createPharmacyExceptionClassifier(): PharmacyExceptionClassifier {
  return {
    classifyCase(input) {
      const evidence: PharmacyExceptionEvidenceBundle[] = [];
      const { context, recordedAt } = input;
      const queueAgeEvidenceRef = `pharmacy_case:${context.pharmacyCase.pharmacyCaseId}`;

      if (
        context.choiceTruth !== null &&
        context.latestDirectorySources.length > 0 &&
        context.latestDirectorySources.every((snapshot) => snapshot.sourceStatus !== "success")
      ) {
        evidence.push({
          exceptionClass: "discovery_unavailable",
          severity: "critical",
          evidenceRefs: uniqueSorted([
            context.choiceTruth.pharmacyChoiceTruthProjectionId,
            ...context.latestDirectorySources.map((snapshot) => snapshot.directorySourceSnapshotId),
          ]),
          rationaleRef: "pharmacy.exception.discovery_unavailable",
        });
      }

      if (
        context.choiceTruth !== null &&
        context.choiceTruth.visibleProviderRefs.length === 0 &&
        context.pharmacyCase.status !== "closed"
      ) {
        evidence.push({
          exceptionClass: "no_eligible_providers_returned",
          severity: "warning",
          evidenceRefs: uniqueSorted([
            context.choiceTruth.pharmacyChoiceTruthProjectionId,
            ...context.latestDirectorySources.map((snapshot) => snapshot.directorySourceSnapshotId),
          ]),
          rationaleRef: "pharmacy.exception.no_eligible_providers_returned",
        });
      }

      if (
        context.dispatchAttempt !== null &&
        (context.dispatchAttempt.status === "failed" ||
          context.dispatchTruth?.transportAcceptanceState === "rejected" ||
          context.dispatchTruth?.transportAcceptanceState === "disputed")
      ) {
        evidence.push({
          exceptionClass: "dispatch_failed",
          severity: "critical",
          evidenceRefs: uniqueSorted([
            context.dispatchAttempt.dispatchAttemptId,
            context.dispatchTruth?.pharmacyDispatchTruthProjectionId ?? "",
          ]),
          rationaleRef: "pharmacy.exception.dispatch_failed",
        });
      }

      if (
        context.dispatchAttempt !== null &&
        context.dispatchTruth !== null &&
        context.dispatchAttempt.status === "sent_pending_proof" &&
        context.dispatchTruth.authoritativeProofState === "pending" &&
        compareIso(recordedAt, context.dispatchTruth.proofDeadlineAt) <= 0
      ) {
        evidence.push({
          exceptionClass: "acknowledgement_missing",
          severity: "urgent",
          evidenceRefs: uniqueSorted([
            context.dispatchAttempt.dispatchAttemptId,
            context.dispatchTruth.pharmacyDispatchTruthProjectionId,
            context.dispatchTruth.proofEnvelopeRef.refId,
          ]),
          rationaleRef: "pharmacy.exception.acknowledgement_missing",
        });
      }

      if (
        context.dispatchTruth !== null &&
        (context.dispatchTruth.authoritativeProofState === "expired" ||
          context.dispatchTruth.authoritativeProofState === "disputed" ||
          compareIso(recordedAt, context.dispatchTruth.proofDeadlineAt) > 0)
      ) {
        evidence.push({
          exceptionClass: "dispatch_proof_stale",
          severity: "critical",
          evidenceRefs: uniqueSorted([
            context.dispatchTruth.pharmacyDispatchTruthProjectionId,
            context.dispatchTruth.dispatchAttemptRef.refId,
            context.dispatchTruth.proofEnvelopeRef.refId,
          ]),
          rationaleRef: "pharmacy.exception.dispatch_proof_stale",
        });
      }

      if (context.outcomeTruth !== null && context.outcomeTruth.outcomeTruthState === "unmatched") {
        evidence.push({
          exceptionClass: "outcome_unmatched",
          severity: "urgent",
          evidenceRefs: uniqueSorted([
            context.outcomeTruth.pharmacyOutcomeTruthProjectionId,
            context.outcomeTruth.latestIngestAttemptRef ?? "",
            context.outcomeTruth.outcomeReconciliationGateRef ?? "",
          ]),
          rationaleRef: "pharmacy.exception.outcome_unmatched",
        });
      }

      const noOutcomeDeadlineAt =
        context.dispatchAttempt?.confirmedAt !== null &&
        context.dispatchAttempt?.confirmedAt !== undefined
          ? addHours(
              context.dispatchAttempt.confirmedAt,
              defaultPharmacyOperationsPolicy.configuredOutcomeWindowHours,
            )
          : context.pharmacyCase.slaTargetAt;
      if (
        context.dispatchTruth !== null &&
        (context.outcomeTruth === null ||
          ["review_required", "unmatched", "duplicate_ignored"].includes(
            context.outcomeTruth.outcomeTruthState,
          )) &&
        compareIso(recordedAt, noOutcomeDeadlineAt) > 0
      ) {
        evidence.push({
          exceptionClass: "no_outcome_within_configured_window",
          severity: "urgent",
          evidenceRefs: uniqueSorted([
            context.dispatchTruth.pharmacyDispatchTruthProjectionId,
            context.outcomeTruth?.pharmacyOutcomeTruthProjectionId ?? "",
            queueAgeEvidenceRef,
          ]),
          rationaleRef: "pharmacy.exception.no_outcome_within_configured_window",
        });
      }

      const distinctOutcomeClassifications = new Set(
        context.outcomeIngestAttempts
          .filter((attempt) => attempt.pharmacyCaseId === context.pharmacyCase.pharmacyCaseId)
          .map((attempt) => attempt.classificationState),
      );
      if (
        context.outcomeGate !== null &&
        (context.outcomeGate.contradictionScore >=
          defaultPharmacyOperationsPolicy.conflictingOutcomeContradictionThreshold ||
          distinctOutcomeClassifications.size > 1)
      ) {
        evidence.push({
          exceptionClass: "conflicting_outcomes",
          severity: "critical",
          evidenceRefs: uniqueSorted([
            context.outcomeGate.outcomeReconciliationGateId,
            ...context.outcomeIngestAttempts.map((attempt) => attempt.ingestAttemptId),
          ]),
          rationaleRef: "pharmacy.exception.conflicting_outcomes",
        });
      }

      if (context.reachabilityPlan !== null && context.reachabilityPlan.repairState !== "clear") {
        evidence.push({
          exceptionClass: "reachability_repair_required",
          severity:
            context.reachabilityPlan.repairState === "blocked_identity" ? "critical" : "urgent",
          evidenceRefs: uniqueSorted([
            context.reachabilityPlan.pharmacyReachabilityPlanId,
            context.patientStatus?.pharmacyPatientStatusProjectionId ?? "",
          ]),
          rationaleRef: "pharmacy.exception.reachability_repair_required",
        });
      }

      if (
        context.latestConsentRevocation !== null &&
        context.dispatchAttempt !== null &&
        context.dispatchAttempt.status !== "failed"
      ) {
        evidence.push({
          exceptionClass: "consent_revoked_after_dispatch",
          severity: "critical",
          evidenceRefs: uniqueSorted([
            context.latestConsentRevocation.pharmacyConsentRevocationRecordId,
            context.dispatchAttempt.dispatchAttemptId,
            context.consentCheckpoint?.pharmacyConsentCheckpointId ?? "",
          ]),
          rationaleRef: "pharmacy.exception.consent_revoked_after_dispatch",
        });
      }

      return evidence.sort((left, right) => {
        const severityCompare = severityRank(right.severity) - severityRank(left.severity);
        if (severityCompare !== 0) {
          return severityCompare;
        }
        return left.exceptionClass.localeCompare(right.exceptionClass);
      });
    },
  };
}

function createPharmacyPracticeVisibilityProjectionBuilder(): PharmacyPracticeVisibilityProjectionBuilder {
  return {
    buildPracticeVisibilityModel(input) {
      const { context, exceptionEvidence, recordedAt } = input;
      const selectedProvider = context.selectedProvider;
      const dispatchTruth = context.dispatchTruth;
      const outcomeTruth = context.outcomeTruth;
      const practiceVisibility = context.practiceVisibility;
      const patientStatus = context.patientStatus;
      const bounceBackTruth = context.bounceBackTruth;
      const lastMeaningfulEventAt =
        latestIso(
          patientStatus?.lastMeaningfulEventAt,
          context.pharmacyCase.updatedAt,
          dispatchTruth?.computedAt,
          outcomeTruth?.computedAt,
          bounceBackTruth?.computedAt,
          practiceVisibility?.computedAt,
        ) ?? context.pharmacyCase.updatedAt;
      const proofDeadlineAt = dispatchTruth?.proofDeadlineAt ?? null;
      const latestOutcomeAt = latestIso(
        outcomeTruth?.computedAt,
        context.outcomeSettlement?.recordedAt,
        ...context.outcomeIngestAttempts.map((attempt) => attempt.createdAt),
      );
      return {
        pharmacyCaseId: context.pharmacyCase.pharmacyCaseId,
        selectedProviderRef:
          selectedProvider === null
            ? null
            : makeRef("PharmacyProvider", selectedProvider.providerId, TASK_343),
        providerKey: providerKeyFromProvider(selectedProvider),
        selectedProviderDisplayName: selectedProvider?.displayName ?? null,
        dispatchState: dispatchStateFromTruth(context.pharmacyCase, dispatchTruth),
        latestPatientInstructionState:
          practiceVisibility?.latestPatientInstructionState ??
          patientStatus?.currentMacroState ??
          null,
        lastOutcomeEvidenceRef:
          practiceVisibility?.latestOutcomeEvidenceRef ??
          outcomeTruth?.latestOutcomeRecordRef ??
          outcomeTruth?.latestOutcomeSettlementRef ??
          null,
        lastOutcomeEvidenceSummaryRef: outcomeTruth?.audienceMessageRef ?? null,
        gpActionRequiredState: practiceVisibility?.gpActionRequiredState ?? null,
        triageReentryState:
          practiceVisibility?.triageReentryState ?? bounceBackTruth?.triageReentryState ?? null,
        urgentReturnState: practiceVisibility?.urgentReturnState ?? null,
        reachabilityRepairState:
          practiceVisibility?.reachabilityRepairState ??
          context.reachabilityPlan?.repairState ??
          null,
        currentCloseBlockerRefs: context.pharmacyCase.currentClosureBlockerRefs.map(
          (ref) => ref.refId,
        ),
        currentConfirmationGateRefs: context.pharmacyCase.currentConfirmationGateRefs.map(
          (ref) => ref.refId,
        ),
        continuityState: continuityFromPatientProjection(context.patientContinuity, dispatchTruth),
        freshnessState:
          dispatchTruth?.authoritativeProofState === "expired"
            ? "expired"
            : dispatchTruth?.authoritativeProofState === "disputed"
              ? "stale"
              : context.latestDirectorySources.length > 0
                ? freshnessFromDirectorySources(context.latestDirectorySources)
                : "current",
        minimumNecessaryTimestamps: {
          caseCreatedAt: context.pharmacyCase.createdAt,
          caseUpdatedAt: context.pharmacyCase.updatedAt,
          lastMeaningfulEventAt,
          proofDeadlineAt,
          latestOutcomeAt,
        },
        minimumNecessaryRefs: {
          patientStatusProjectionRef: patientStatus?.pharmacyPatientStatusProjectionId ?? null,
          practiceVisibilityProjectionRef:
            practiceVisibility?.pharmacyPracticeVisibilityProjectionId ?? null,
          dispatchTruthProjectionRef: dispatchTruth?.pharmacyDispatchTruthProjectionId ?? null,
          outcomeTruthProjectionRef: outcomeTruth?.pharmacyOutcomeTruthProjectionId ?? null,
          bounceBackTruthProjectionRef:
            bounceBackTruth?.pharmacyBounceBackTruthProjectionId ?? null,
        },
        activeExceptionClasses: uniqueSorted(
          exceptionEvidence.map((entry) => entry.exceptionClass),
        ) as readonly PharmacyOperationsExceptionClass[],
        computedAt: recordedAt,
        version: 1,
      };
    },
  };
}

function severityFromContext(input: {
  context: CaseOperationsContext;
  exceptionEvidence: readonly PharmacyExceptionEvidenceBundle[];
}): PharmacyOperationsSeverity {
  const highestExceptionSeverity = input.exceptionEvidence.reduce<PharmacyOperationsSeverity>(
    (highest, entry) =>
      severityRank(entry.severity) > severityRank(highest) ? entry.severity : highest,
    "routine",
  );
  if (highestExceptionSeverity !== "routine") {
    return highestExceptionSeverity;
  }
  if (input.context.bounceBackTruth?.gpActionRequired) {
    return "urgent";
  }
  if (input.context.choiceTruth?.patientOverrideRequired) {
    return "warning";
  }
  return "routine";
}

function reviewDebtStateFromContext(
  context: CaseOperationsContext,
  exceptionEvidence: readonly PharmacyExceptionEvidenceBundle[],
): PharmacyOperationsReviewDebtState {
  if (exceptionEvidence.some((entry) => entry.exceptionClass === "conflicting_outcomes")) {
    return "review_required";
  }
  if (
    context.outcomeTruth?.manualReviewState !== null &&
    context.outcomeTruth?.manualReviewState !== undefined
  ) {
    return context.outcomeTruth.manualReviewState === "none" ? "none" : "review_required";
  }
  if (
    context.bounceBackRecord?.supervisorReviewState === "required" ||
    context.bounceBackRecord?.supervisorReviewState === "in_review"
  ) {
    return "review_required";
  }
  return "none";
}

function createPharmacyOperationsProjectionBuilder(): PharmacyOperationsProjectionBuilder {
  return {
    buildOperationsProjections(input: {
      context: CaseOperationsContext;
      exceptionEvidence: readonly PharmacyExceptionEvidenceBundle[];
      practiceVisibilityModel: PharmacyPracticeVisibilityModelSnapshot;
      recordedAt: string;
    }) {
      const { context, exceptionEvidence, practiceVisibilityModel, recordedAt } = input;
      const provider = context.selectedProvider;
      const providerKey = providerKeyFromProvider(provider);
      const commonEvidenceRefs = uniqueSorted(
        exceptionEvidence.flatMap((entry) => entry.evidenceRefs),
      );
      const severity = severityFromContext({ context, exceptionEvidence });
      const continuityState = practiceVisibilityModel.continuityState;
      const freshnessState = practiceVisibilityModel.freshnessState;
      const reviewDebtState = reviewDebtStateFromContext(context, exceptionEvidence);
      const caseAgeMinutes = minutesBetween(context.pharmacyCase.createdAt, recordedAt);
      const lastMeaningfulEventAt =
        practiceVisibilityModel.minimumNecessaryTimestamps.lastMeaningfulEventAt;
      const activeCasesProjection =
        context.pharmacyCase.status === "closed"
          ? null
          : {
              pharmacyActiveCasesProjectionId: stableProjectionId("pharmacy_active_case", {
                pharmacyCaseId: context.pharmacyCase.pharmacyCaseId,
              }),
              worklistFamily: "pharmacy_active_cases_projection" as const,
              pharmacyCaseRef: makeRef(
                "PharmacyCase",
                context.pharmacyCase.pharmacyCaseId,
                TASK_342,
              ),
              selectedProviderRef:
                provider === null
                  ? null
                  : makeRef("PharmacyProvider", provider.providerId, TASK_343),
              providerKey,
              selectedProviderDisplayName: provider?.displayName ?? null,
              patientStatusProjectionRef:
                context.patientStatus === null
                  ? null
                  : makeRef(
                      "PharmacyPatientStatusProjection",
                      context.patientStatus.pharmacyPatientStatusProjectionId,
                      TASK_351,
                    ),
              practiceVisibilityProjectionRef:
                context.practiceVisibility === null
                  ? null
                  : makeRef(
                      "PharmacyPracticeVisibilityProjection",
                      context.practiceVisibility.pharmacyPracticeVisibilityProjectionId,
                      TASK_353,
                    ),
              dispatchTruthProjectionRef:
                context.dispatchTruth === null
                  ? null
                  : makeRef(
                      "PharmacyDispatchTruthProjection",
                      context.dispatchTruth.pharmacyDispatchTruthProjectionId,
                      TASK_343,
                    ),
              outcomeTruthProjectionRef:
                context.outcomeTruth === null
                  ? null
                  : makeRef(
                      "PharmacyOutcomeTruthProjection",
                      context.outcomeTruth.pharmacyOutcomeTruthProjectionId,
                      TASK_343,
                    ),
              bounceBackTruthProjectionRef:
                context.bounceBackTruth === null
                  ? null
                  : makeRef(
                      "PharmacyBounceBackTruthProjection",
                      context.bounceBackTruth.pharmacyBounceBackTruthProjectionId,
                      TASK_353,
                    ),
              caseStatus: context.pharmacyCase.status,
              dispatchState: practiceVisibilityModel.dispatchState,
              latestPatientInstructionState: practiceVisibilityModel.latestPatientInstructionState,
              lastOutcomeEvidenceRef: practiceVisibilityModel.lastOutcomeEvidenceRef,
              lastOutcomeEvidenceSummaryRef: practiceVisibilityModel.lastOutcomeEvidenceSummaryRef,
              gpActionRequiredState: practiceVisibilityModel.gpActionRequiredState,
              triageReentryState: practiceVisibilityModel.triageReentryState,
              urgentReturnState: practiceVisibilityModel.urgentReturnState,
              reachabilityRepairState: practiceVisibilityModel.reachabilityRepairState,
              currentCloseBlockerRefs: practiceVisibilityModel.currentCloseBlockerRefs,
              currentConfirmationGateRefs: practiceVisibilityModel.currentConfirmationGateRefs,
              continuityState,
              freshnessState,
              reviewDebtState,
              activeExceptionClasses: practiceVisibilityModel.activeExceptionClasses,
              evidenceRefs: commonEvidenceRefs,
              severity,
              queueAgeMinutes: minutesBetween(lastMeaningfulEventAt, recordedAt),
              caseAgeMinutes,
              lastMeaningfulEventAt,
              latestCaseUpdatedAt: context.pharmacyCase.updatedAt,
              slaTargetAt: context.pharmacyCase.slaTargetAt,
              computedAt: recordedAt,
              version: 1,
            };

      const waitingForChoiceProjection =
        context.choiceTruth === null ||
        !["eligible_choice_pending", "provider_selected", "consent_pending"].includes(
          context.pharmacyCase.status,
        )
          ? null
          : {
              pharmacyWaitingForChoiceProjectionId: stableProjectionId(
                "pharmacy_waiting_for_choice",
                {
                  pharmacyCaseId: context.pharmacyCase.pharmacyCaseId,
                },
              ),
              worklistFamily: "pharmacy_waiting_for_choice_projection" as const,
              pharmacyCaseRef: makeRef(
                "PharmacyCase",
                context.pharmacyCase.pharmacyCaseId,
                TASK_342,
              ),
              choiceTruthProjectionRef: makeRef(
                "PharmacyChoiceTruthProjection",
                context.choiceTruth.pharmacyChoiceTruthProjectionId,
                TASK_343,
              ),
              directorySnapshotRef: context.choiceTruth.directorySnapshotRef,
              selectedProviderRef:
                provider === null
                  ? null
                  : makeRef("PharmacyProvider", provider.providerId, TASK_343),
              providerKey,
              selectedProviderDisplayName: provider?.displayName ?? null,
              visibleChoiceCount: context.choiceTruth.visibleProviderRefs.length,
              recommendedFrontierCount: context.choiceTruth.recommendedProviderRefs.length,
              recommendedFrontierSummaryRef: `recommended_frontier.count.${context.choiceTruth.recommendedProviderRefs.length}`,
              warnedChoiceCount: context.choiceTruth.warningVisibleProviderRefs.length,
              warnedChoiceSummaryRef: `warned_choice.count.${context.choiceTruth.warningVisibleProviderRefs.length}`,
              staleDirectoryPosture:
                context.latestDirectorySources.length === 0
                  ? "expired"
                  : freshnessFromDirectorySources(context.latestDirectorySources),
              selectedProviderState: context.choiceTruth.projectionState,
              patientOverrideRequired: context.choiceTruth.patientOverrideRequired,
              suppressedUnsafeSummaryRef: context.choiceTruth.suppressedUnsafeSummaryRef,
              continuityState,
              freshnessState:
                context.latestDirectorySources.length === 0
                  ? "expired"
                  : freshnessFromDirectorySources(context.latestDirectorySources),
              reviewDebtState,
              activeExceptionClasses: uniqueSorted(
                exceptionEvidence
                  .map((entry) => entry.exceptionClass)
                  .filter((entry) =>
                    ["discovery_unavailable", "no_eligible_providers_returned"].includes(entry),
                  ),
              ) as readonly PharmacyOperationsExceptionClass[],
              evidenceRefs: commonEvidenceRefs,
              severity,
              queueAgeMinutes: minutesBetween(context.choiceTruth.computedAt, recordedAt),
              caseAgeMinutes,
              computedAt: recordedAt,
              version: 1,
            };

      const outcomeTruthState: PharmacyDispatchedWaitingOutcomeProjectionSnapshot["outcomeTruthState"] =
        context.outcomeTruth?.outcomeTruthState ?? "not_received";
      const waitingOutcomeProjection: PharmacyDispatchedWaitingOutcomeProjectionSnapshot | null =
        context.dispatchTruth === null ||
        context.dispatchAttempt === null ||
        ["resolved_by_pharmacy", "closed"].includes(context.pharmacyCase.status)
          ? null
          : {
              pharmacyDispatchedWaitingOutcomeProjectionId: stableProjectionId(
                "pharmacy_waiting_outcome",
                {
                  pharmacyCaseId: context.pharmacyCase.pharmacyCaseId,
                },
              ),
              worklistFamily: "pharmacy_dispatched_waiting_outcome_projection" as const,
              pharmacyCaseRef: makeRef(
                "PharmacyCase",
                context.pharmacyCase.pharmacyCaseId,
                TASK_342,
              ),
              dispatchTruthProjectionRef: makeRef(
                "PharmacyDispatchTruthProjection",
                context.dispatchTruth.pharmacyDispatchTruthProjectionId,
                TASK_343,
              ),
              dispatchAttemptRef: makeRef(
                "PharmacyDispatchAttempt",
                context.dispatchAttempt.dispatchAttemptId,
                TASK_343,
              ),
              outcomeTruthProjectionRef:
                context.outcomeTruth === null
                  ? null
                  : makeRef(
                      "PharmacyOutcomeTruthProjection",
                      context.outcomeTruth.pharmacyOutcomeTruthProjectionId,
                      TASK_343,
                    ),
              selectedProviderRef:
                provider === null
                  ? null
                  : makeRef("PharmacyProvider", provider.providerId, TASK_343),
              providerKey,
              selectedProviderDisplayName: provider?.displayName ?? null,
              transportMode: context.dispatchTruth.transportMode,
              dispatchState: dispatchStateFromTruth(context.pharmacyCase, context.dispatchTruth),
              authoritativeProofState: context.dispatchTruth.authoritativeProofState,
              proofRiskState: context.dispatchTruth.proofRiskState,
              proofDeadlineAt: context.dispatchTruth.proofDeadlineAt,
              outcomeTruthState,
              noOutcomeWindowBreached: exceptionEvidence.some(
                (entry) => entry.exceptionClass === "no_outcome_within_configured_window",
              ),
              continuityState,
              freshnessState:
                context.dispatchTruth.authoritativeProofState === "expired"
                  ? "expired"
                  : context.dispatchTruth.authoritativeProofState === "disputed"
                    ? "stale"
                    : freshnessState,
              reviewDebtState,
              activeExceptionClasses: uniqueSorted(
                exceptionEvidence
                  .map((entry) => entry.exceptionClass)
                  .filter((entry) =>
                    [
                      "dispatch_failed",
                      "acknowledgement_missing",
                      "outcome_unmatched",
                      "no_outcome_within_configured_window",
                      "conflicting_outcomes",
                      "consent_revoked_after_dispatch",
                      "dispatch_proof_stale",
                    ].includes(entry),
                  ),
              ) as readonly PharmacyOperationsExceptionClass[],
              evidenceRefs: commonEvidenceRefs,
              severity,
              queueAgeMinutes: minutesBetween(
                context.dispatchAttempt.confirmedAt ?? context.dispatchAttempt.attemptedAt,
                recordedAt,
              ),
              caseAgeMinutes,
              computedAt: recordedAt,
              version: 1,
            };

      const bounceBackProjection =
        context.bounceBackTruth === null || context.bounceBackRecord === null
          ? null
          : {
              pharmacyBounceBackProjectionId: stableProjectionId("pharmacy_bounce_back", {
                pharmacyCaseId: context.pharmacyCase.pharmacyCaseId,
              }),
              worklistFamily: "pharmacy_bounce_back_projection" as const,
              pharmacyCaseRef: makeRef(
                "PharmacyCase",
                context.pharmacyCase.pharmacyCaseId,
                TASK_342,
              ),
              bounceBackTruthProjectionRef: makeRef(
                "PharmacyBounceBackTruthProjection",
                context.bounceBackTruth.pharmacyBounceBackTruthProjectionId,
                TASK_353,
              ),
              bounceBackRecordRef: makeRef(
                "PharmacyBounceBackRecord",
                context.bounceBackRecord.bounceBackRecordId,
                TASK_344,
              ),
              selectedProviderRef:
                provider === null
                  ? null
                  : makeRef("PharmacyProvider", provider.providerId, TASK_343),
              providerKey,
              selectedProviderDisplayName: provider?.displayName ?? null,
              bounceBackType: context.bounceBackRecord.bounceBackType,
              reopenedCaseStatus: context.bounceBackTruth.reopenedCaseStatus,
              gpActionRequired: context.bounceBackTruth.gpActionRequired,
              triageReentryState: context.bounceBackTruth.triageReentryState,
              urgentReturnState: practiceVisibilityModel.urgentReturnState,
              reachabilityRepairState: practiceVisibilityModel.reachabilityRepairState,
              supervisorReviewState: context.bounceBackRecord.supervisorReviewState,
              loopRisk: context.bounceBackTruth.loopRisk,
              reopenPriorityBand: context.bounceBackTruth.reopenPriorityBand,
              continuityState,
              freshnessState,
              reviewDebtState,
              activeExceptionClasses: uniqueSorted(
                exceptionEvidence
                  .map((entry) => entry.exceptionClass)
                  .filter((entry) => entry === "reachability_repair_required"),
              ) as readonly PharmacyOperationsExceptionClass[],
              evidenceRefs: uniqueSorted([
                ...commonEvidenceRefs,
                context.bounceBackRecord.bounceBackRecordId,
                context.bounceBackTruth.pharmacyBounceBackTruthProjectionId,
              ]),
              severity:
                context.bounceBackTruth.gpActionRequired ||
                context.bounceBackTruth.reopenPriorityBand >= 3
                  ? "critical"
                  : severity,
              queueAgeMinutes: minutesBetween(context.bounceBackRecord.createdAt, recordedAt),
              caseAgeMinutes,
              computedAt: recordedAt,
              version: 1,
            };

      const dispatchExceptionProjection =
        exceptionEvidence.length === 0
          ? null
          : {
              pharmacyDispatchExceptionProjectionId: stableProjectionId(
                "pharmacy_dispatch_exception",
                {
                  pharmacyCaseId: context.pharmacyCase.pharmacyCaseId,
                },
              ),
              worklistFamily: "pharmacy_dispatch_exception_projection" as const,
              pharmacyCaseRef: makeRef(
                "PharmacyCase",
                context.pharmacyCase.pharmacyCaseId,
                TASK_342,
              ),
              selectedProviderRef:
                provider === null
                  ? null
                  : makeRef("PharmacyProvider", provider.providerId, TASK_343),
              providerKey,
              selectedProviderDisplayName: provider?.displayName ?? null,
              primaryExceptionClass: exceptionEvidence[0]!.exceptionClass,
              activeExceptionClasses: uniqueSorted(
                exceptionEvidence.map((entry) => entry.exceptionClass),
              ) as readonly PharmacyOperationsExceptionClass[],
              exceptionEvidence,
              continuityState,
              freshnessState,
              reviewDebtState,
              severity: exceptionEvidence.reduce<PharmacyOperationsSeverity>(
                (highest, entry) =>
                  severityRank(entry.severity) > severityRank(highest) ? entry.severity : highest,
                "routine",
              ),
              evidenceRefs: commonEvidenceRefs,
              queueAgeMinutes: minutesBetween(lastMeaningfulEventAt, recordedAt),
              caseAgeMinutes,
              computedAt: recordedAt,
              version: 1,
            };

      return {
        activeCasesProjection,
        waitingForChoiceProjection,
        dispatchedWaitingOutcomeProjection: waitingOutcomeProjection,
        bounceBackProjection,
        dispatchExceptionProjection,
      };
    },
  };
}

function createPharmacyProviderHealthProjectionBuilder(): PharmacyProviderHealthProjectionBuilder {
  return {
    buildProviderHealthProjections(input) {
      type MutableProviderHealth = {
        providerKey: string;
        latestProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
        providerDisplayName: string;
        discoveryAvailabilityState: PharmacyProviderDiscoveryAvailabilityState;
        dispatchHealthState: PharmacyProviderDispatchHealthState;
        continuityState: PharmacyOperationsContinuityState;
        freshnessState: PharmacyOperationsFreshnessState;
        reviewDebtState: PharmacyOperationsReviewDebtState;
        activeExceptionClasses: Set<PharmacyOperationsExceptionClass>;
        evidenceRefs: Set<string>;
        activeCaseCount: number;
        waitingForChoiceCount: number;
        dispatchFailureCount: number;
        acknowledgementDebtCount: number;
        staleProofCount: number;
        unmatchedOutcomeCount: number;
        conflictingOutcomeCount: number;
        reachabilityRepairCaseCount: number;
        consentRevokedAfterDispatchCount: number;
        transportByMode: Map<
          string,
          {
            activeCaseCount: number;
            dispatchFailureCount: number;
            acknowledgementDebtCount: number;
            staleProofCount: number;
          }
        >;
        lastGoodEvidenceAt: string | null;
        latestEvidenceAt: string | null;
      };

      const byProviderKey = new Map<string, MutableProviderHealth>();
      const currentByCase = new Map(
        input.contexts.map((context) => [context.pharmacyCase.pharmacyCaseId, context] as const),
      );

      function getOrCreateProvider(inputProvider: PharmacyProvider): MutableProviderHealth {
        const providerKey = inputProvider.odsCode;
        const current = byProviderKey.get(providerKey);
        if (current) {
          if (compareIso(current.providerDisplayName, inputProvider.displayName) < 0) {
            current.providerDisplayName = inputProvider.displayName;
            current.latestProviderRef = makeRef(
              "PharmacyProvider",
              inputProvider.providerId,
              TASK_343,
            );
          }
          return current;
        }
        const next: MutableProviderHealth = {
          providerKey,
          latestProviderRef: makeRef("PharmacyProvider", inputProvider.providerId, TASK_343),
          providerDisplayName: inputProvider.displayName,
          discoveryAvailabilityState: "healthy",
          dispatchHealthState: "healthy",
          continuityState: "current",
          freshnessState: "current",
          reviewDebtState: "none",
          activeExceptionClasses: new Set(),
          evidenceRefs: new Set(),
          activeCaseCount: 0,
          waitingForChoiceCount: 0,
          dispatchFailureCount: 0,
          acknowledgementDebtCount: 0,
          staleProofCount: 0,
          unmatchedOutcomeCount: 0,
          conflictingOutcomeCount: 0,
          reachabilityRepairCaseCount: 0,
          consentRevokedAfterDispatchCount: 0,
          transportByMode: new Map(),
          lastGoodEvidenceAt: null,
          latestEvidenceAt: null,
        };
        byProviderKey.set(providerKey, next);
        return next;
      }

      for (const context of input.contexts) {
        for (const provider of context.latestDirectoryProviders) {
          const target = getOrCreateProvider(provider);
          const contributorRefs = provider.normalizationProvenance.contributingSourceSnapshotRefs;
          const contributingSources = context.latestDirectorySources.filter((snapshot) =>
            contributorRefs.includes(snapshot.directorySourceSnapshotId),
          );
          if (contributingSources.length === 0) {
            continue;
          }
          const providerFreshness = freshnessFromDirectorySources(contributingSources);
          if (freshnessRank(providerFreshness) > freshnessRank(target.freshnessState)) {
            target.freshnessState = providerFreshness;
          }
          const allUnavailable = contributingSources.every(
            (snapshot) => snapshot.sourceStatus !== "success",
          );
          if (allUnavailable) {
            target.discoveryAvailabilityState = "unavailable";
          } else if (
            contributingSources.some(
              (snapshot) =>
                snapshot.sourceStatus === "partial" ||
                snapshot.sourceFreshnessPosture !== "current",
            ) &&
            target.discoveryAvailabilityState !== "unavailable"
          ) {
            target.discoveryAvailabilityState = "degraded";
          }
          target.latestEvidenceAt =
            latestIso(
              target.latestEvidenceAt,
              ...contributingSources.map((snapshot) => snapshot.capturedAt),
            ) ?? target.latestEvidenceAt;
          target.lastGoodEvidenceAt =
            latestIso(
              target.lastGoodEvidenceAt,
              ...contributingSources
                .filter(
                  (snapshot) =>
                    snapshot.sourceStatus === "success" &&
                    ["current", "degraded"].includes(snapshot.sourceFreshnessPosture),
                )
                .map((snapshot) => snapshot.capturedAt),
            ) ?? target.lastGoodEvidenceAt;
          for (const source of contributingSources) {
            target.evidenceRefs.add(source.directorySourceSnapshotId);
          }
        }
      }

      for (const [caseId, projection] of input.currentActiveCases.entries()) {
        const context = currentByCase.get(caseId);
        if (!context) {
          continue;
        }
        const provider = context.selectedProvider;
        if (provider === null) {
          continue;
        }
        const target = getOrCreateProvider(provider);
        target.activeCaseCount += 1;
        target.latestEvidenceAt = latestIso(
          target.latestEvidenceAt,
          projection.lastMeaningfulEventAt,
          projection.latestCaseUpdatedAt,
        );
        if (continuityRank(projection.continuityState) > continuityRank(target.continuityState)) {
          target.continuityState = projection.continuityState;
        }
        if (projection.reviewDebtState === "review_required") {
          target.reviewDebtState = "review_required";
        }
        for (const exceptionClass of projection.activeExceptionClasses) {
          target.activeExceptionClasses.add(exceptionClass);
        }
        for (const evidenceRef of projection.evidenceRefs) {
          target.evidenceRefs.add(evidenceRef);
        }
        if (projection.activeExceptionClasses.includes("reachability_repair_required")) {
          target.reachabilityRepairCaseCount += 1;
        }
        if (projection.activeExceptionClasses.includes("consent_revoked_after_dispatch")) {
          target.consentRevokedAfterDispatchCount += 1;
        }
      }

      for (const [caseId, projection] of input.currentWaitingForChoice.entries()) {
        const context = currentByCase.get(caseId);
        const provider = context?.selectedProvider;
        if (provider === null || provider === undefined) {
          continue;
        }
        const target = getOrCreateProvider(provider);
        target.waitingForChoiceCount += 1;
        target.latestEvidenceAt =
          latestIso(
            target.latestEvidenceAt,
            context?.choiceTruth?.computedAt,
            ...(context?.latestDirectorySources ?? []).map((snapshot) => snapshot.capturedAt),
          ) ?? target.latestEvidenceAt;
        for (const evidenceRef of projection.evidenceRefs) {
          target.evidenceRefs.add(evidenceRef);
        }
      }

      for (const [caseId, projection] of input.currentDispatchedWaitingOutcome.entries()) {
        const context = currentByCase.get(caseId);
        const provider = context?.selectedProvider;
        if (provider === null || provider === undefined) {
          continue;
        }
        const target = getOrCreateProvider(provider);
        const transportSummary = target.transportByMode.get(projection.transportMode) ?? {
          activeCaseCount: 0,
          dispatchFailureCount: 0,
          acknowledgementDebtCount: 0,
          staleProofCount: 0,
        };
        transportSummary.activeCaseCount += 1;
        if (projection.activeExceptionClasses.includes("dispatch_failed")) {
          transportSummary.dispatchFailureCount += 1;
          target.dispatchFailureCount += 1;
          target.dispatchHealthState = "failing";
        }
        if (projection.activeExceptionClasses.includes("acknowledgement_missing")) {
          transportSummary.acknowledgementDebtCount += 1;
          target.acknowledgementDebtCount += 1;
          if (target.dispatchHealthState === "healthy") {
            target.dispatchHealthState = "degraded";
          }
        }
        if (projection.activeExceptionClasses.includes("dispatch_proof_stale")) {
          transportSummary.staleProofCount += 1;
          target.staleProofCount += 1;
          target.dispatchHealthState = "failing";
        }
        target.transportByMode.set(projection.transportMode, transportSummary);
        if (projection.activeExceptionClasses.includes("outcome_unmatched")) {
          target.unmatchedOutcomeCount += 1;
        }
        if (projection.activeExceptionClasses.includes("conflicting_outcomes")) {
          target.conflictingOutcomeCount += 1;
        }
        if (continuityRank(projection.continuityState) > continuityRank(target.continuityState)) {
          target.continuityState = projection.continuityState;
        }
        if (freshnessRank(projection.freshnessState) > freshnessRank(target.freshnessState)) {
          target.freshnessState = projection.freshnessState;
        }
        if (projection.reviewDebtState === "review_required") {
          target.reviewDebtState = "review_required";
        }
        for (const exceptionClass of projection.activeExceptionClasses) {
          target.activeExceptionClasses.add(exceptionClass);
        }
        for (const evidenceRef of projection.evidenceRefs) {
          target.evidenceRefs.add(evidenceRef);
        }
        target.latestEvidenceAt =
          latestIso(
            target.latestEvidenceAt,
            context?.dispatchAttempt?.attemptedAt,
            context?.dispatchAttempt?.confirmedAt,
            context?.dispatchTruth?.computedAt,
            context?.outcomeTruth?.computedAt,
          ) ?? target.latestEvidenceAt;
      }

      for (const [caseId, projection] of input.currentBounceBack.entries()) {
        const context = currentByCase.get(caseId);
        const provider = context?.selectedProvider;
        if (provider === null || provider === undefined) {
          continue;
        }
        const target = getOrCreateProvider(provider);
        if (continuityRank(projection.continuityState) > continuityRank(target.continuityState)) {
          target.continuityState = projection.continuityState;
        }
        if (projection.reviewDebtState === "review_required") {
          target.reviewDebtState = "review_required";
        }
        if (projection.activeExceptionClasses.includes("reachability_repair_required")) {
          target.reachabilityRepairCaseCount += 1;
        }
        for (const exceptionClass of projection.activeExceptionClasses) {
          target.activeExceptionClasses.add(exceptionClass);
        }
        for (const evidenceRef of projection.evidenceRefs) {
          target.evidenceRefs.add(evidenceRef);
        }
        target.latestEvidenceAt =
          latestIso(
            target.latestEvidenceAt,
            context?.bounceBackRecord?.createdAt,
            context?.bounceBackTruth?.computedAt,
            context?.practiceVisibility?.computedAt,
          ) ?? target.latestEvidenceAt;
      }

      return [...byProviderKey.values()].map((entry) => {
        const activeExceptionClasses = uniqueSorted([
          ...entry.activeExceptionClasses,
        ]) as readonly PharmacyOperationsExceptionClass[];
        const severity: PharmacyOperationsSeverity =
          entry.dispatchFailureCount >=
            defaultPharmacyOperationsPolicy.providerCriticalCaseThreshold ||
          entry.discoveryAvailabilityState === "unavailable" ||
          entry.conflictingOutcomeCount > 0 ||
          entry.staleProofCount > 0
            ? "critical"
            : entry.acknowledgementDebtCount > 0 ||
                entry.unmatchedOutcomeCount > 0 ||
                entry.discoveryAvailabilityState === "degraded"
              ? "warning"
              : "healthy";
        const latestEvidenceAt = entry.latestEvidenceAt;
        return {
          pharmacyProviderHealthProjectionId: stableProjectionId("pharmacy_provider_health", {
            providerKey: entry.providerKey,
          }),
          worklistFamily: "pharmacy_provider_health_projection" as const,
          providerKey: entry.providerKey,
          latestProviderRef: entry.latestProviderRef,
          providerDisplayName: entry.providerDisplayName,
          discoveryAvailabilityState: entry.discoveryAvailabilityState,
          dispatchHealthState: entry.dispatchHealthState,
          continuityState: entry.continuityState,
          freshnessState: entry.freshnessState,
          reviewDebtState: entry.reviewDebtState,
          activeExceptionClasses,
          evidenceRefs: uniqueSorted([...entry.evidenceRefs]),
          activeCaseCount: entry.activeCaseCount,
          waitingForChoiceCount: entry.waitingForChoiceCount,
          dispatchFailureCount: entry.dispatchFailureCount,
          acknowledgementDebtCount: entry.acknowledgementDebtCount,
          staleProofCount: entry.staleProofCount,
          unmatchedOutcomeCount: entry.unmatchedOutcomeCount,
          conflictingOutcomeCount: entry.conflictingOutcomeCount,
          reachabilityRepairCaseCount: entry.reachabilityRepairCaseCount,
          consentRevokedAfterDispatchCount: entry.consentRevokedAfterDispatchCount,
          transportSummaries: [...entry.transportByMode.entries()]
            .map(([transportMode, summary]) => ({
              transportMode,
              ...summary,
            }))
            .sort((left, right) => left.transportMode.localeCompare(right.transportMode)),
          lastGoodEvidenceAt: entry.lastGoodEvidenceAt,
          latestEvidenceAt,
          queueAgeMinutes:
            latestEvidenceAt === null ? 0 : minutesBetween(latestEvidenceAt, input.recordedAt),
          severity,
          computedAt: input.recordedAt,
          version: 1,
        } satisfies PharmacyProviderHealthProjectionSnapshot;
      });
    },
  };
}

function applyCaseProjectionFilters<
  T extends {
    providerKey: string | null;
    severity: PharmacyOperationsSeverity;
    queueAgeMinutes: number;
    continuityState: PharmacyOperationsContinuityState;
    reviewDebtState: PharmacyOperationsReviewDebtState;
    activeExceptionClasses: readonly PharmacyOperationsExceptionClass[];
    freshnessState: PharmacyOperationsFreshnessState;
  },
>(rows: readonly T[], input: PharmacyOperationsWorklistQueryInput | undefined): T[] {
  let filtered = [...rows];
  if (input?.providerKeys && input.providerKeys.length > 0) {
    const allowed = new Set(input.providerKeys);
    filtered = filtered.filter((row) => row.providerKey !== null && allowed.has(row.providerKey));
  }
  if (input?.minimumQueueAgeMinutes !== undefined) {
    filtered = filtered.filter((row) => row.queueAgeMinutes >= input.minimumQueueAgeMinutes!);
  }
  if (input?.severityAtLeast) {
    filtered = filtered.filter(
      (row) => severityRank(row.severity) >= severityRank(input.severityAtLeast!),
    );
  }
  if (input?.exceptionClasses && input.exceptionClasses.length > 0) {
    filtered = filtered.filter((row) =>
      input.exceptionClasses!.some((exceptionClass) =>
        row.activeExceptionClasses.includes(exceptionClass),
      ),
    );
  }
  if (input?.continuityStates && input.continuityStates.length > 0) {
    const allowed = new Set(input.continuityStates);
    filtered = filtered.filter((row) => allowed.has(row.continuityState));
  }
  if (input?.reviewDebtState) {
    filtered = filtered.filter((row) => row.reviewDebtState === input.reviewDebtState);
  }
  const sortBy = input?.sortBy ?? "priority";
  const direction = input?.sortDirection ?? "desc";
  filtered.sort((left, right) => {
    const multiplier = direction === "desc" ? -1 : 1;
    const priorityLeft =
      severityRank(left.severity) * 100 +
      freshnessRank(left.freshnessState) * 10 +
      continuityRank(left.continuityState);
    const priorityRight =
      severityRank(right.severity) * 100 +
      freshnessRank(right.freshnessState) * 10 +
      continuityRank(right.continuityState);
    switch (sortBy) {
      case "queue_age":
        return multiplier * (left.queueAgeMinutes - right.queueAgeMinutes);
      case "case_age":
        return (
          multiplier *
          ((left as { caseAgeMinutes?: number }).caseAgeMinutes ??
            0 - ((right as { caseAgeMinutes?: number }).caseAgeMinutes ?? 0))
        );
      case "provider":
        return multiplier * (left.providerKey ?? "").localeCompare(right.providerKey ?? "");
      case "freshness":
        return (
          multiplier * (freshnessRank(left.freshnessState) - freshnessRank(right.freshnessState))
        );
      case "continuity":
        return (
          multiplier *
          (continuityRank(left.continuityState) - continuityRank(right.continuityState))
        );
      case "priority":
      default:
        if (priorityLeft !== priorityRight) {
          return multiplier * (priorityLeft - priorityRight);
        }
        return multiplier * (left.queueAgeMinutes - right.queueAgeMinutes);
    }
  });
  if (direction === "desc") {
    filtered.reverse();
  }
  return filtered;
}

function applyProviderHealthFilters(
  rows: readonly PharmacyProviderHealthProjectionSnapshot[],
  input: PharmacyProviderHealthQueryInput | undefined,
): PharmacyProviderHealthProjectionSnapshot[] {
  let filtered = [...rows];
  if (input?.providerKeys && input.providerKeys.length > 0) {
    const allowed = new Set(input.providerKeys);
    filtered = filtered.filter((row) => allowed.has(row.providerKey));
  }
  if (input?.severityAtLeast) {
    filtered = filtered.filter(
      (row) => severityRank(row.severity) >= severityRank(input.severityAtLeast!),
    );
  }
  if (input?.exceptionClasses && input.exceptionClasses.length > 0) {
    filtered = filtered.filter((row) =>
      input.exceptionClasses!.some((exceptionClass) =>
        row.activeExceptionClasses.includes(exceptionClass),
      ),
    );
  }
  const sortBy = input?.sortBy ?? "priority";
  const direction = input?.sortDirection ?? "desc";
  filtered.sort((left, right) => {
    const multiplier = direction === "desc" ? -1 : 1;
    switch (sortBy) {
      case "queue_age":
        return multiplier * (left.queueAgeMinutes - right.queueAgeMinutes);
      case "provider":
        return multiplier * left.providerKey.localeCompare(right.providerKey);
      case "priority":
      default:
        if (severityRank(left.severity) !== severityRank(right.severity)) {
          return multiplier * (severityRank(left.severity) - severityRank(right.severity));
        }
        return multiplier * (left.queueAgeMinutes - right.queueAgeMinutes);
    }
  });
  if (direction === "desc") {
    filtered.reverse();
  }
  return filtered;
}

async function loadCaseOperationsContext(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  directoryRepositories: Phase6PharmacyDirectoryChoiceRepositories;
  dispatchRepositories: Phase6PharmacyDispatchRepositories;
  outcomeRepositories: Phase6PharmacyOutcomeRepositories;
  patientStatusRepositories: Phase6PharmacyPatientStatusRepositories;
  bounceBackRepositories: Phase6PharmacyBounceBackRepositories;
}): Promise<CaseOperationsContext> {
  const { pharmacyCase } = input;
  const [
    choiceTruthDoc,
    consentCheckpointDoc,
    consentRevocationDoc,
    latestDirectorySnapshotDoc,
    dispatchAttemptDoc,
    dispatchTruthDoc,
    continuityProjectionDoc,
    outcomeTruthDoc,
    outcomeGateDoc,
    outcomeSettlementDoc,
    outcomeIngestAttemptDocs,
    patientStatusDoc,
    patientContinuityDoc,
    patientInstructionDoc,
    practiceVisibilityDoc,
    bounceBackRecordDoc,
    bounceBackTruthDoc,
    supervisorReviewDoc,
    reachabilityPlanDoc,
  ] = await Promise.all([
    input.directoryRepositories.getLatestChoiceTruthProjectionForCase(pharmacyCase.pharmacyCaseId),
    input.directoryRepositories.getLatestConsentCheckpointForCase(pharmacyCase.pharmacyCaseId),
    input.directoryRepositories.getLatestConsentRevocationForCase(pharmacyCase.pharmacyCaseId),
    input.directoryRepositories.getLatestDirectorySnapshotForCase(pharmacyCase.pharmacyCaseId),
    input.dispatchRepositories.getCurrentDispatchAttemptForCase(pharmacyCase.pharmacyCaseId),
    input.dispatchRepositories.getCurrentDispatchTruthProjectionForCase(
      pharmacyCase.pharmacyCaseId,
    ),
    input.dispatchRepositories.getCurrentContinuityEvidenceProjectionForCase(
      pharmacyCase.pharmacyCaseId,
    ),
    input.outcomeRepositories.getCurrentOutcomeTruthProjectionForCase(pharmacyCase.pharmacyCaseId),
    input.outcomeRepositories.getCurrentOutcomeReconciliationGateForCase(
      pharmacyCase.pharmacyCaseId,
    ),
    input.outcomeRepositories.getCurrentOutcomeSettlementForCase(pharmacyCase.pharmacyCaseId),
    input.outcomeRepositories.listOutcomeIngestAttemptsByCase(pharmacyCase.pharmacyCaseId),
    input.patientStatusRepositories.getCurrentPatientStatusProjectionForCase(
      pharmacyCase.pharmacyCaseId,
    ),
    input.patientStatusRepositories.getCurrentPatientContinuityProjectionForCase(
      pharmacyCase.pharmacyCaseId,
    ),
    input.patientStatusRepositories.getCurrentPatientInstructionPanelForCase(
      pharmacyCase.pharmacyCaseId,
    ),
    input.bounceBackRepositories.getCurrentPracticeVisibilityProjectionForCase(
      pharmacyCase.pharmacyCaseId,
    ),
    input.bounceBackRepositories.getCurrentBounceBackRecordForCase(pharmacyCase.pharmacyCaseId),
    input.bounceBackRepositories.getCurrentBounceBackTruthProjectionForCase(
      pharmacyCase.pharmacyCaseId,
    ),
    input.bounceBackRepositories.getCurrentSupervisorReviewForCase(pharmacyCase.pharmacyCaseId),
    input.patientStatusRepositories.getCurrentReachabilityPlanForCase(pharmacyCase.pharmacyCaseId),
  ]);
  const choiceTruth = choiceTruthDoc?.toSnapshot() ?? null;
  const latestDirectorySources =
    latestDirectorySnapshotDoc === null
      ? []
      : (
          await input.directoryRepositories.listDirectorySourceSnapshots(
            latestDirectorySnapshotDoc.toSnapshot().directorySnapshotId,
          )
        ).map((entry) => entry.toSnapshot());
  const latestDirectoryProviders =
    latestDirectorySnapshotDoc === null
      ? []
      : (
          await input.directoryRepositories.listProviders(
            latestDirectorySnapshotDoc.toSnapshot().directorySnapshotId,
          )
        ).map((entry) => entry.toSnapshot());
  const latestDirectoryCapabilities =
    latestDirectorySnapshotDoc === null
      ? []
      : (
          await input.directoryRepositories.listProviderCapabilitySnapshots(
            latestDirectorySnapshotDoc.toSnapshot().directorySnapshotId,
          )
        ).map((entry) => entry.toSnapshot());
  const selectedProviderRef =
    choiceTruth?.selectedProviderRef ?? pharmacyCase.selectedProviderRef ?? null;
  const selectedProvider =
    selectedProviderRef === null
      ? null
      : ((await input.directoryRepositories.getProvider(selectedProviderRef.refId))?.toSnapshot() ??
        latestDirectoryProviders.find(
          (provider) => provider.providerId === selectedProviderRef.refId,
        ) ??
        null);
  const selectedProviderCapabilityRef = choiceTruth?.selectedProviderCapabilitySnapshotRef ?? null;
  const selectedProviderCapability =
    selectedProviderCapabilityRef === null
      ? null
      : ((
          await input.directoryRepositories.getProviderCapabilitySnapshot(
            selectedProviderCapabilityRef.refId,
          )
        )?.toSnapshot() ??
        latestDirectoryCapabilities.find(
          (capability) =>
            capability.providerCapabilitySnapshotId === selectedProviderCapabilityRef.refId,
        ) ??
        null);
  return {
    pharmacyCase,
    choiceTruth,
    consentCheckpoint: consentCheckpointDoc?.toSnapshot() ?? null,
    latestConsentRevocation: consentRevocationDoc?.toSnapshot() ?? null,
    latestDirectorySources,
    latestDirectoryProviders,
    latestDirectoryCapabilities,
    selectedProvider,
    selectedProviderCapability,
    dispatchAttempt: dispatchAttemptDoc?.toSnapshot() ?? null,
    dispatchTruth: dispatchTruthDoc?.toSnapshot() ?? null,
    continuityProjection: continuityProjectionDoc?.toSnapshot() ?? null,
    outcomeTruth: outcomeTruthDoc?.toSnapshot() ?? null,
    outcomeGate: outcomeGateDoc?.toSnapshot() ?? null,
    outcomeSettlement: outcomeSettlementDoc?.toSnapshot() ?? null,
    outcomeIngestAttempts: outcomeIngestAttemptDocs.map((entry) => entry.toSnapshot()),
    patientStatus: patientStatusDoc?.toSnapshot() ?? null,
    patientContinuity: patientContinuityDoc?.toSnapshot() ?? null,
    patientInstructionPanel: patientInstructionDoc?.toSnapshot() ?? null,
    practiceVisibility: practiceVisibilityDoc?.toSnapshot() ?? null,
    bounceBackRecord: bounceBackRecordDoc?.toSnapshot() ?? null,
    bounceBackTruth: bounceBackTruthDoc?.toSnapshot() ?? null,
    supervisorReview: supervisorReviewDoc?.toSnapshot() ?? null,
    reachabilityPlan: reachabilityPlanDoc?.toSnapshot() ?? null,
  };
}

function buildAuditEvent(input: {
  projectionFamily: PharmacyOperationsWorklistFamily;
  scopeKind: PharmacyOperationsAuditEventSnapshot["scopeKind"];
  scopeRef: string;
  eventName: string;
  severity: PharmacyOperationsSeverity;
  primaryExceptionClass: PharmacyOperationsExceptionClass | null;
  evidenceRefs: readonly string[];
  payload: unknown;
  recordedAt: string;
}): PharmacyOperationsAuditEventSnapshot {
  return {
    pharmacyOperationsAuditEventId: stableProjectionId("pharmacy_operations_audit", {
      scopeKind: input.scopeKind,
      scopeRef: input.scopeRef,
      projectionFamily: input.projectionFamily,
      eventName: input.eventName,
      recordedAt: input.recordedAt,
      payloadDigest: sha256Hex(stableStringify(input.payload)),
    }),
    scopeKind: input.scopeKind,
    scopeRef: input.scopeRef,
    projectionFamily: input.projectionFamily,
    eventName: input.eventName,
    severity: input.severity,
    primaryExceptionClass: input.primaryExceptionClass,
    evidenceRefs: uniqueSorted(input.evidenceRefs),
    payloadDigest: sha256Hex(stableStringify(input.payload)),
    recordedAt: input.recordedAt,
    version: 1,
  };
}

export function createPhase6PharmacyOperationsService(
  input: Phase6PharmacyOperationsServiceDependencies = {},
): Phase6PharmacyOperationsService {
  const repositories = input.repositories ?? createPhase6PharmacyOperationsStore();
  const caseKernelService =
    input.caseKernelService ??
    createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });
  const directoryRepositories =
    input.directoryRepositories ?? createPhase6PharmacyDirectoryChoiceStore();
  const dispatchRepositories = input.dispatchRepositories ?? createPhase6PharmacyDispatchStore();
  const outcomeRepositories = input.outcomeRepositories ?? createPhase6PharmacyOutcomeStore();
  const patientStatusRepositories =
    input.patientStatusRepositories ?? createPhase6PharmacyPatientStatusStore();
  const bounceBackRepositories =
    input.bounceBackRepositories ?? createPhase6PharmacyBounceBackStore();

  const exceptionClassifier = createPharmacyExceptionClassifier();
  const practiceVisibilityProjectionBuilder = createPharmacyPracticeVisibilityProjectionBuilder();
  const operationsProjectionBuilder = createPharmacyOperationsProjectionBuilder();
  const providerHealthProjectionBuilder = createPharmacyProviderHealthProjectionBuilder();
  const worklistDeltaService = createPharmacyWorklistDeltaService();

  async function persistCaseProjection<T extends { version: number }>(
    current: T | null,
    candidate: T | null,
    save: (snapshot: T, options?: CompareAndSetWriteOptions) => Promise<void>,
    clear: () => Promise<void>,
    toAudit: (
      eventName: string,
      snapshot: T | null,
      previous: T | null,
    ) => PharmacyOperationsAuditEventSnapshot,
  ) {
    if (candidate === null) {
      if (current !== null) {
        await clear();
        await repositories.appendOperationsAuditEvent(toAudit("removed", null, current));
      }
      return null;
    }
    if (current === null) {
      await save(candidate);
      await repositories.appendOperationsAuditEvent(toAudit("entered", candidate, null));
      return candidate;
    }
    if (materialDigest(candidate) === materialDigest(current)) {
      const refreshed = refreshVolatileSnapshot(candidate, current);
      if (refreshed !== current) {
        await save(refreshed, { expectedVersion: current.version });
      }
      return refreshed;
    }
    const next = {
      ...candidate,
      version: nextVersion(current.version),
    };
    if (materialDigest(next) !== materialDigest(current)) {
      await save(next, { expectedVersion: current.version });
      await repositories.appendOperationsAuditEvent(toAudit("updated", next, current));
      return next;
    }
    return current;
  }

  async function refreshOperationsProjections(input?: { recordedAt?: string }) {
    const recordedAt = ensureIsoTimestamp(
      input?.recordedAt ?? new Date().toISOString(),
      "recordedAt",
    );
    const caseDocuments = await caseKernelService.repositories.listPharmacyCases();
    const contexts = await Promise.all(
      caseDocuments.map((document) =>
        loadCaseOperationsContext({
          pharmacyCase: document.toSnapshot(),
          directoryRepositories,
          dispatchRepositories,
          outcomeRepositories,
          patientStatusRepositories,
          bounceBackRepositories,
        }),
      ),
    );

    const activeCaseByCaseId = new Map<string, PharmacyActiveCasesProjectionSnapshot>();
    const waitingChoiceByCaseId = new Map<string, PharmacyWaitingForChoiceProjectionSnapshot>();
    const waitingOutcomeByCaseId = new Map<
      string,
      PharmacyDispatchedWaitingOutcomeProjectionSnapshot
    >();
    const bounceBackByCaseId = new Map<string, PharmacyBounceBackProjectionSnapshot>();
    const exceptionEvidenceByCaseId = new Map<string, readonly PharmacyExceptionEvidenceBundle[]>();
    const exceptionByCaseId = new Map<string, PharmacyDispatchExceptionProjectionSnapshot>();

    for (const context of contexts) {
      const exceptionEvidence = exceptionClassifier.classifyCase({
        context,
        recordedAt,
      });
      exceptionEvidenceByCaseId.set(context.pharmacyCase.pharmacyCaseId, exceptionEvidence);
      const practiceVisibilityModel =
        practiceVisibilityProjectionBuilder.buildPracticeVisibilityModel({
          context,
          exceptionEvidence,
          recordedAt,
        });
      const projectionSet = operationsProjectionBuilder.buildOperationsProjections({
        context,
        exceptionEvidence,
        practiceVisibilityModel,
        recordedAt,
      });
      if (projectionSet.activeCasesProjection !== null) {
        activeCaseByCaseId.set(
          context.pharmacyCase.pharmacyCaseId,
          projectionSet.activeCasesProjection,
        );
      }
      if (projectionSet.waitingForChoiceProjection !== null) {
        waitingChoiceByCaseId.set(
          context.pharmacyCase.pharmacyCaseId,
          projectionSet.waitingForChoiceProjection,
        );
      }
      if (projectionSet.dispatchedWaitingOutcomeProjection !== null) {
        waitingOutcomeByCaseId.set(
          context.pharmacyCase.pharmacyCaseId,
          projectionSet.dispatchedWaitingOutcomeProjection,
        );
      }
      if (projectionSet.bounceBackProjection !== null) {
        bounceBackByCaseId.set(
          context.pharmacyCase.pharmacyCaseId,
          projectionSet.bounceBackProjection,
        );
      }
      if (projectionSet.dispatchExceptionProjection !== null) {
        exceptionByCaseId.set(
          context.pharmacyCase.pharmacyCaseId,
          projectionSet.dispatchExceptionProjection,
        );
      }
    }

    for (const context of contexts) {
      const caseId = context.pharmacyCase.pharmacyCaseId;
      const currentActive =
        (await repositories.getCurrentActiveCasesProjectionForCase(caseId))?.toSnapshot() ?? null;
      const currentWaitingChoice =
        (await repositories.getCurrentWaitingForChoiceProjectionForCase(caseId))?.toSnapshot() ??
        null;
      const currentWaitingOutcome =
        (
          await repositories.getCurrentDispatchedWaitingOutcomeProjectionForCase(caseId)
        )?.toSnapshot() ?? null;
      const currentBounceBack =
        (await repositories.getCurrentBounceBackProjectionForCase(caseId))?.toSnapshot() ?? null;
      const currentException =
        (await repositories.getCurrentDispatchExceptionProjectionForCase(caseId))?.toSnapshot() ??
        null;

      const activeCandidate = activeCaseByCaseId.get(caseId) ?? null;
      const waitingChoiceCandidate = waitingChoiceByCaseId.get(caseId) ?? null;
      const waitingOutcomeCandidate = waitingOutcomeByCaseId.get(caseId) ?? null;
      const bounceBackCandidate = bounceBackByCaseId.get(caseId) ?? null;
      const exceptionCandidate = exceptionByCaseId.get(caseId) ?? null;

      const buildCaseAudit = <
        T extends {
          evidenceRefs: readonly string[];
          severity: PharmacyOperationsSeverity;
          activeExceptionClasses?: readonly PharmacyOperationsExceptionClass[];
        },
      >(
        projectionFamily: PharmacyOperationsWorklistFamily,
        eventName: string,
        snapshot: T | null,
        previous: T | null,
      ) =>
        buildAuditEvent({
          projectionFamily,
          scopeKind: "pharmacy_case",
          scopeRef: caseId,
          eventName,
          severity: snapshot?.severity ?? previous?.severity ?? "routine",
          primaryExceptionClass:
            snapshot?.activeExceptionClasses?.[0] ?? previous?.activeExceptionClasses?.[0] ?? null,
          evidenceRefs: snapshot?.evidenceRefs ?? previous?.evidenceRefs ?? [],
          payload: {
            snapshot,
            previous,
          },
          recordedAt,
        });

      const persistedActive = await persistCaseProjection(
        currentActive,
        activeCandidate,
        (snapshot, options) => repositories.saveActiveCasesProjection(snapshot, options),
        () => repositories.clearCurrentActiveCasesProjectionForCase(caseId),
        (eventName, snapshot, previous) =>
          buildCaseAudit("pharmacy_active_cases_projection", eventName, snapshot, previous),
      );
      if (persistedActive !== null) {
        activeCaseByCaseId.set(caseId, persistedActive);
      }

      const persistedWaitingChoice = await persistCaseProjection(
        currentWaitingChoice,
        waitingChoiceCandidate,
        (snapshot, options) => repositories.saveWaitingForChoiceProjection(snapshot, options),
        () => repositories.clearCurrentWaitingForChoiceProjectionForCase(caseId),
        (eventName, snapshot, previous) =>
          buildCaseAudit("pharmacy_waiting_for_choice_projection", eventName, snapshot, previous),
      );
      if (persistedWaitingChoice !== null) {
        waitingChoiceByCaseId.set(caseId, persistedWaitingChoice);
      }

      const persistedWaitingOutcome = await persistCaseProjection(
        currentWaitingOutcome,
        waitingOutcomeCandidate,
        (snapshot, options) =>
          repositories.saveDispatchedWaitingOutcomeProjection(snapshot, options),
        () => repositories.clearCurrentDispatchedWaitingOutcomeProjectionForCase(caseId),
        (eventName, snapshot, previous) =>
          buildCaseAudit(
            "pharmacy_dispatched_waiting_outcome_projection",
            eventName,
            snapshot,
            previous,
          ),
      );
      if (persistedWaitingOutcome !== null) {
        waitingOutcomeByCaseId.set(caseId, persistedWaitingOutcome);
      }

      const persistedBounceBack = await persistCaseProjection(
        currentBounceBack,
        bounceBackCandidate,
        (snapshot, options) => repositories.saveBounceBackProjection(snapshot, options),
        () => repositories.clearCurrentBounceBackProjectionForCase(caseId),
        (eventName, snapshot, previous) =>
          buildCaseAudit("pharmacy_bounce_back_projection", eventName, snapshot, previous),
      );
      if (persistedBounceBack !== null) {
        bounceBackByCaseId.set(caseId, persistedBounceBack);
      }

      const persistedException = await persistCaseProjection(
        currentException,
        exceptionCandidate,
        (snapshot, options) => repositories.saveDispatchExceptionProjection(snapshot, options),
        () => repositories.clearCurrentDispatchExceptionProjectionForCase(caseId),
        (eventName, snapshot, previous) =>
          buildCaseAudit("pharmacy_dispatch_exception_projection", eventName, snapshot, previous),
      );
      if (persistedException !== null) {
        exceptionByCaseId.set(caseId, persistedException);
      }
    }

    const providerCandidates = providerHealthProjectionBuilder.buildProviderHealthProjections({
      contexts,
      exceptionEvidenceByCaseId,
      currentActiveCases: activeCaseByCaseId,
      currentWaitingForChoice: waitingChoiceByCaseId,
      currentDispatchedWaitingOutcome: waitingOutcomeByCaseId,
      currentBounceBack: bounceBackByCaseId,
      recordedAt,
    });

    const liveProviderKeys = new Set(providerCandidates.map((candidate) => candidate.providerKey));
    const currentProviderHealthRows = (
      await repositories.listCurrentProviderHealthProjections()
    ).map((entry) => entry.toSnapshot());

    for (const providerRow of currentProviderHealthRows) {
      if (liveProviderKeys.has(providerRow.providerKey)) {
        continue;
      }
      await repositories.clearCurrentProviderHealthProjection(providerRow.providerKey);
      await repositories.appendOperationsAuditEvent(
        buildAuditEvent({
          projectionFamily: "pharmacy_provider_health_projection",
          scopeKind: "provider",
          scopeRef: providerRow.providerKey,
          eventName: "removed",
          severity: providerRow.severity,
          primaryExceptionClass: providerRow.activeExceptionClasses[0] ?? null,
          evidenceRefs: providerRow.evidenceRefs,
          payload: providerRow,
          recordedAt,
        }),
      );
    }

    const providerHealthByKey = new Map<string, PharmacyProviderHealthProjectionSnapshot>();
    for (const candidate of providerCandidates) {
      const current =
        (
          await repositories.getCurrentProviderHealthProjection(candidate.providerKey)
        )?.toSnapshot() ?? null;
      if (current === null) {
        await repositories.saveProviderHealthProjection(candidate);
        await repositories.appendOperationsAuditEvent(
          buildAuditEvent({
            projectionFamily: "pharmacy_provider_health_projection",
            scopeKind: "provider",
            scopeRef: candidate.providerKey,
            eventName: "entered",
            severity: candidate.severity,
            primaryExceptionClass: candidate.activeExceptionClasses[0] ?? null,
            evidenceRefs: candidate.evidenceRefs,
            payload: candidate,
            recordedAt,
          }),
        );
        providerHealthByKey.set(candidate.providerKey, candidate);
        continue;
      }
      if (materialDigest(candidate) === materialDigest(current)) {
        const refreshed = refreshVolatileSnapshot(candidate, current);
        if (refreshed !== current) {
          await repositories.saveProviderHealthProjection(refreshed, {
            expectedVersion: current.version,
          });
        }
        providerHealthByKey.set(candidate.providerKey, refreshed);
        continue;
      }
      const next = {
        ...candidate,
        version: nextVersion(current.version),
      };
      if (materialDigest(next) !== materialDigest(current)) {
        await repositories.saveProviderHealthProjection(next, {
          expectedVersion: current.version,
        });
        await repositories.appendOperationsAuditEvent(
          buildAuditEvent({
            projectionFamily: "pharmacy_provider_health_projection",
            scopeKind: "provider",
            scopeRef: next.providerKey,
            eventName: current.severity !== next.severity ? "severity_changed" : "updated",
            severity: next.severity,
            primaryExceptionClass: next.activeExceptionClasses[0] ?? null,
            evidenceRefs: next.evidenceRefs,
            payload: {
              previous: current,
              next,
            },
            recordedAt,
          }),
        );
        providerHealthByKey.set(candidate.providerKey, next);
        continue;
      }
      providerHealthByKey.set(candidate.providerKey, current);
    }

    return {
      activeCases: [...activeCaseByCaseId.values()],
      waitingForChoice: [...waitingChoiceByCaseId.values()],
      waitingOutcome: [...waitingOutcomeByCaseId.values()],
      bounceBack: [...bounceBackByCaseId.values()],
      exceptions: [...exceptionByCaseId.values()],
      providerHealth: [...providerHealthByKey.values()],
    };
  }

  const queryService: PharmacyOperationsQueryService = {
    async fetchActiveCasesWorklist(query) {
      await refreshOperationsProjections({ recordedAt: query?.recordedAt });
      const currentRows = (await repositories.listCurrentActiveCasesProjections()).map((entry) =>
        entry.toSnapshot(),
      );
      const rows = applyCaseProjectionFilters(currentRows, query);
      const delta = worklistDeltaService.computeChangedSinceSeen({
        worklistFamily: "pharmacy_active_cases_projection",
        currentRows: rows,
        seenRows: query?.seenRows ?? [],
        projectionIdSelector: (row) => row.pharmacyActiveCasesProjectionId,
      });
      return {
        rows,
        summary: buildQueueSummary(
          "pharmacy_active_cases_projection",
          rows,
          delta.addedCount + delta.changedCount + delta.removedCount,
        ),
      };
    },
    async fetchWaitingForChoiceWorklist(query) {
      await refreshOperationsProjections({ recordedAt: query?.recordedAt });
      const currentRows = (await repositories.listCurrentWaitingForChoiceProjections()).map(
        (entry) => entry.toSnapshot(),
      );
      const rows = applyCaseProjectionFilters(currentRows, query);
      const delta = worklistDeltaService.computeChangedSinceSeen({
        worklistFamily: "pharmacy_waiting_for_choice_projection",
        currentRows: rows,
        seenRows: query?.seenRows ?? [],
        projectionIdSelector: (row) => row.pharmacyWaitingForChoiceProjectionId,
      });
      return {
        rows,
        summary: buildQueueSummary(
          "pharmacy_waiting_for_choice_projection",
          rows,
          delta.addedCount + delta.changedCount + delta.removedCount,
        ),
      };
    },
    async fetchDispatchedWaitingOutcomeWorklist(query) {
      await refreshOperationsProjections({ recordedAt: query?.recordedAt });
      const currentRows = (await repositories.listCurrentDispatchedWaitingOutcomeProjections()).map(
        (entry) => entry.toSnapshot(),
      );
      const rows = applyCaseProjectionFilters(currentRows, query);
      const delta = worklistDeltaService.computeChangedSinceSeen({
        worklistFamily: "pharmacy_dispatched_waiting_outcome_projection",
        currentRows: rows,
        seenRows: query?.seenRows ?? [],
        projectionIdSelector: (row) => row.pharmacyDispatchedWaitingOutcomeProjectionId,
      });
      return {
        rows,
        summary: buildQueueSummary(
          "pharmacy_dispatched_waiting_outcome_projection",
          rows,
          delta.addedCount + delta.changedCount + delta.removedCount,
        ),
      };
    },
    async fetchBounceBackWorklist(query) {
      await refreshOperationsProjections({ recordedAt: query?.recordedAt });
      const currentRows = (await repositories.listCurrentBounceBackProjections()).map((entry) =>
        entry.toSnapshot(),
      );
      const rows = applyCaseProjectionFilters(currentRows, query);
      const delta = worklistDeltaService.computeChangedSinceSeen({
        worklistFamily: "pharmacy_bounce_back_projection",
        currentRows: rows,
        seenRows: query?.seenRows ?? [],
        projectionIdSelector: (row) => row.pharmacyBounceBackProjectionId,
      });
      return {
        rows,
        summary: buildQueueSummary(
          "pharmacy_bounce_back_projection",
          rows,
          delta.addedCount + delta.changedCount + delta.removedCount,
        ),
      };
    },
    async fetchDispatchExceptionWorklist(query) {
      await refreshOperationsProjections({ recordedAt: query?.recordedAt });
      const currentRows = (await repositories.listCurrentDispatchExceptionProjections()).map(
        (entry) => entry.toSnapshot(),
      );
      const rows = applyCaseProjectionFilters(currentRows, query);
      const delta = worklistDeltaService.computeChangedSinceSeen({
        worklistFamily: "pharmacy_dispatch_exception_projection",
        currentRows: rows,
        seenRows: query?.seenRows ?? [],
        projectionIdSelector: (row) => row.pharmacyDispatchExceptionProjectionId,
      });
      return {
        rows,
        summary: buildQueueSummary(
          "pharmacy_dispatch_exception_projection",
          rows,
          delta.addedCount + delta.changedCount + delta.removedCount,
        ),
      };
    },
    async fetchProviderHealthSummary(query) {
      await refreshOperationsProjections({ recordedAt: query?.recordedAt });
      const currentRows = (await repositories.listCurrentProviderHealthProjections()).map((entry) =>
        entry.toSnapshot(),
      );
      const rows = applyProviderHealthFilters(currentRows, query);
      const delta = worklistDeltaService.computeChangedSinceSeen({
        worklistFamily: "pharmacy_provider_health_projection",
        currentRows: rows,
        seenRows: query?.seenRows ?? [],
        projectionIdSelector: (row) => row.pharmacyProviderHealthProjectionId,
      });
      return {
        rows,
        summary: buildQueueSummary(
          "pharmacy_provider_health_projection",
          rows,
          delta.addedCount + delta.changedCount + delta.removedCount,
        ),
      };
    },
    async fetchProviderHealthDetail(providerKey, input) {
      await refreshOperationsProjections({ recordedAt: input?.recordedAt });
      const current = await repositories.getCurrentProviderHealthProjection(providerKey);
      if (!current) {
        return null;
      }
      return {
        projection: current.toSnapshot(),
        historySummary: (await repositories.listOperationsAuditEventsForProvider(providerKey)).map(
          (entry) => entry.toSnapshot(),
        ),
      };
    },
    async fetchPracticeVisibilityModel(pharmacyCaseId, input) {
      const recordedAt = ensureIsoTimestamp(
        input?.recordedAt ?? new Date().toISOString(),
        "recordedAt",
      );
      const bundle = await caseKernelService.getPharmacyCase(pharmacyCaseId);
      if (bundle === null || bundle.pharmacyCase.status === "closed") {
        return null;
      }
      const context = await loadCaseOperationsContext({
        pharmacyCase: bundle.pharmacyCase,
        directoryRepositories,
        dispatchRepositories,
        outcomeRepositories,
        patientStatusRepositories,
        bounceBackRepositories,
      });
      const exceptionEvidence = exceptionClassifier.classifyCase({
        context,
        recordedAt,
      });
      const practiceVisibilityModel =
        practiceVisibilityProjectionBuilder.buildPracticeVisibilityModel({
          context,
          exceptionEvidence,
          recordedAt,
        });
      const currentProjection =
        await repositories.getCurrentActiveCasesProjectionForCase(pharmacyCaseId);
      return currentProjection === null
        ? practiceVisibilityModel
        : {
            ...practiceVisibilityModel,
            version: currentProjection.toSnapshot().version,
          };
    },
    async fetchQueueCountsAndAgeingSummaries(input) {
      const seenRowsByWorklist = input?.seenRowsByWorklist ?? {};
      const active = await queryService.fetchActiveCasesWorklist({
        recordedAt: input?.recordedAt,
        seenRows: seenRowsByWorklist.pharmacy_active_cases_projection,
      });
      const waitingChoice = await queryService.fetchWaitingForChoiceWorklist({
        recordedAt: input?.recordedAt,
        seenRows: seenRowsByWorklist.pharmacy_waiting_for_choice_projection,
      });
      const waitingOutcome = await queryService.fetchDispatchedWaitingOutcomeWorklist({
        recordedAt: input?.recordedAt,
        seenRows: seenRowsByWorklist.pharmacy_dispatched_waiting_outcome_projection,
      });
      const bounceBack = await queryService.fetchBounceBackWorklist({
        recordedAt: input?.recordedAt,
        seenRows: seenRowsByWorklist.pharmacy_bounce_back_projection,
      });
      const exceptions = await queryService.fetchDispatchExceptionWorklist({
        recordedAt: input?.recordedAt,
        seenRows: seenRowsByWorklist.pharmacy_dispatch_exception_projection,
      });
      const providerHealth = await queryService.fetchProviderHealthSummary({
        recordedAt: input?.recordedAt,
        seenRows: seenRowsByWorklist.pharmacy_provider_health_projection,
      });
      return [
        active.summary,
        waitingChoice.summary,
        waitingOutcome.summary,
        bounceBack.summary,
        exceptions.summary,
        providerHealth.summary,
      ];
    },
    async fetchChangedSinceSeenDeltas(input) {
      await refreshOperationsProjections({ recordedAt: input.recordedAt });
      switch (input.worklistFamily) {
        case "pharmacy_active_cases_projection": {
          const currentRows = (await repositories.listCurrentActiveCasesProjections()).map(
            (entry) => entry.toSnapshot(),
          );
          return worklistDeltaService.computeChangedSinceSeen({
            worklistFamily: input.worklistFamily,
            currentRows,
            seenRows: input.seenRows,
            projectionIdSelector: (row) => row.pharmacyActiveCasesProjectionId,
          });
        }
        case "pharmacy_waiting_for_choice_projection": {
          const currentRows = (await repositories.listCurrentWaitingForChoiceProjections()).map(
            (entry) => entry.toSnapshot(),
          );
          return worklistDeltaService.computeChangedSinceSeen({
            worklistFamily: input.worklistFamily,
            currentRows,
            seenRows: input.seenRows,
            projectionIdSelector: (row) => row.pharmacyWaitingForChoiceProjectionId,
          });
        }
        case "pharmacy_dispatched_waiting_outcome_projection": {
          const currentRows = (
            await repositories.listCurrentDispatchedWaitingOutcomeProjections()
          ).map((entry) => entry.toSnapshot());
          return worklistDeltaService.computeChangedSinceSeen({
            worklistFamily: input.worklistFamily,
            currentRows,
            seenRows: input.seenRows,
            projectionIdSelector: (row) => row.pharmacyDispatchedWaitingOutcomeProjectionId,
          });
        }
        case "pharmacy_bounce_back_projection": {
          const currentRows = (await repositories.listCurrentBounceBackProjections()).map((entry) =>
            entry.toSnapshot(),
          );
          return worklistDeltaService.computeChangedSinceSeen({
            worklistFamily: input.worklistFamily,
            currentRows,
            seenRows: input.seenRows,
            projectionIdSelector: (row) => row.pharmacyBounceBackProjectionId,
          });
        }
        case "pharmacy_dispatch_exception_projection": {
          const currentRows = (await repositories.listCurrentDispatchExceptionProjections()).map(
            (entry) => entry.toSnapshot(),
          );
          return worklistDeltaService.computeChangedSinceSeen({
            worklistFamily: input.worklistFamily,
            currentRows,
            seenRows: input.seenRows,
            projectionIdSelector: (row) => row.pharmacyDispatchExceptionProjectionId,
          });
        }
        case "pharmacy_provider_health_projection": {
          const currentRows = (await repositories.listCurrentProviderHealthProjections()).map(
            (entry) => entry.toSnapshot(),
          );
          return worklistDeltaService.computeChangedSinceSeen({
            worklistFamily: input.worklistFamily,
            currentRows,
            seenRows: input.seenRows,
            projectionIdSelector: (row) => row.pharmacyProviderHealthProjectionId,
          });
        }
      }
    },
  };

  return {
    repositories,
    operationsProjectionBuilder,
    practiceVisibilityProjectionBuilder,
    exceptionClassifier,
    providerHealthProjectionBuilder,
    worklistDeltaService,
    queryService,
    refreshOperationsProjections,
  };
}
