import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import {
  createPhase6PharmacyBounceBackStore,
  type Phase6PharmacyBounceBackRepositories,
  type PharmacyPracticeVisibilityProjectionSnapshot,
} from "./phase6-pharmacy-bounce-back-engine";
import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  type AggregateRef,
  type Phase6PharmacyCaseKernelService,
  type PharmacyCaseBundle,
  type PharmacyCaseSnapshot,
} from "./phase6-pharmacy-case-kernel";
import {
  createPhase6PharmacyDirectoryChoiceStore,
  type Phase6PharmacyDirectoryChoiceRepositories,
  type PharmacyChoiceTruthProjection,
  type PharmacyConsentCheckpoint,
} from "./phase6-pharmacy-directory-choice-engine";
import {
  createPhase6PharmacyDispatchStore,
  type Phase6PharmacyDispatchRepositories,
  type PharmacyContinuityEvidenceProjectionSnapshot,
  type PharmacyDispatchSettlementSnapshot,
  type PharmacyDispatchTruthProjectionSnapshot,
} from "./phase6-pharmacy-dispatch-engine";
import {
  createPhase6PharmacyOutcomeStore,
  type Phase6PharmacyOutcomeRepositories,
  type PharmacyOutcomeSettlementSnapshot,
} from "./phase6-pharmacy-outcome-reconciliation-engine";
import {
  createPhase6PharmacyPatientStatusStore,
  type Phase6PharmacyPatientStatusRepositories,
  type PharmacyOutcomeTruthProjectionSnapshot,
  type PharmacyPatientStatusProjectionSnapshot,
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
const TASK_355 =
  "par_355_phase6_track_backend_build_pharmacy_console_support_region_and_stock_truth_api" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task344 = typeof TASK_344;
type Task351 = typeof TASK_351;
type Task353 = typeof TASK_353;
type Task355 = typeof TASK_355;

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
  return trimmed.length === 0 ? null : trimmed;
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

function ensureFiniteNumber(value: number, field: string): number {
  invariant(Number.isFinite(value), `INVALID_${field.toUpperCase()}`, `${field} must be finite.`);
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

function currentDocumentsFromIndex<T>(
  idsByScope: Map<string, string>,
  snapshots: Map<string, T>,
): readonly SnapshotDocument<T>[] {
  return [...idsByScope.values()]
    .map((id) => snapshots.get(id))
    .filter((snapshot): snapshot is T => snapshot !== undefined)
    .map((snapshot) => new StoredDocument(snapshot));
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
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

function materialDigest<T extends object>(snapshot: T): string {
  const {
    version: _version,
    computedAt: _computedAt,
    refreshedAt: _refreshedAt,
    createdAt: _createdAt,
    invalidatedAt: _invalidatedAt,
    ...rest
  } =
    snapshot as T & {
      version?: number;
      computedAt?: string;
      refreshedAt?: string;
      createdAt?: string;
      invalidatedAt?: string | null;
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

export type InventoryFreshnessState = "fresh" | "aging" | "stale" | "unavailable";
export type InventoryExpiryBand = "safe" | "watch" | "near_expiry" | "expired" | "unknown";
export type InventoryEquivalenceClass =
  | "exact"
  | "therapeutic_substitute"
  | "pack_variant"
  | "partial_supply"
  | "no_supply";
export type InventoryReservationState =
  | "none"
  | "reserved"
  | "partially_reserved"
  | "unavailable";
export type InventoryFenceState = "active" | "invalidated" | "released";
export type InventoryTrustState = "verified" | "governed_override" | "missing";
export type InventoryFreshnessConfidenceState = "high" | "medium" | "low" | "unknown";
export type InventorySubstitutionPolicyState =
  | "allowed"
  | "patient_ack_required"
  | "supervisor_required"
  | "not_allowed";
export type MedicationLineState = "not_started" | "in_review" | "verified";
export type MedicationCheckpointDerivedState =
  | "not_started"
  | "in_review"
  | "verified"
  | "review_required"
  | "blocked"
  | "supervisor_required";
export type SupplyComputationState = "exact" | "short" | "excess" | "non_comparable";
export type PharmacyConsoleSupportRegion =
  | "inventory_support"
  | "handoff_support"
  | "assurance_support"
  | "none";
export type PharmacyHandoffReadinessState = "not_ready" | "review_required" | "verified";
export type PharmacyConsoleContinuityValidationState =
  | "not_required"
  | "current"
  | "stale"
  | "blocked";
export type PharmacyActionCanonicalSettlementType = "none" | "dispatch" | "outcome";
export type PharmacyActionSettlementAgreementState = "ready" | "pending" | "blocked" | "converged";
export type PharmacyAssuranceState =
  | "clear"
  | "consent_blocked"
  | "dispatch_pending"
  | "outcome_review"
  | "recovery_required";
export type PharmacyHandoffWatchState =
  | "not_started"
  | "active"
  | "blocked"
  | "completed";

export interface PharmacyMedicationLineStateSnapshot {
  pharmacyMedicationLineStateId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  lineItemRef: string;
  medicationLabel: string;
  strengthLabel: string | null;
  formLabel: string | null;
  baseUnit: string;
  prescribedBaseUnits: number;
  dailyBaseUnits: number | null;
  packBasisRef: string;
  intendedSupplyWindowDays: number | null;
  selectedCandidateRef: string | null;
  overrideState: "none" | "governed_resolved" | "supervisor_required";
  currentLineState: MedicationLineState;
  requiredCommunicationPreviewRefs: readonly string[];
  communicationPreviewed: boolean;
  blockingSignalCodes: readonly string[];
  reviewSignalCodes: readonly string[];
  informationSignalCodes: readonly string[];
  verifiedEvidenceRefs: readonly string[];
  clarificationThreadRef: string | null;
  crossLineImpactDigestRef: string | null;
  lineItemVersionRef: string;
  policyBundleRef: string;
  reviewSessionRef: string;
  version: number;
}

export interface InventorySupportRecordSnapshot {
  inventorySupportRecordId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  lineItemRef: string;
  candidateRef: string;
  productIdentityRef: string;
  equivalenceClass: InventoryEquivalenceClass;
  packBasisRef: string;
  baseUnitsPerPack: number;
  availableQuantity: number;
  reservedQuantity: number;
  batchOrLotRef: string | null;
  expiryBand: InventoryExpiryBand;
  storageRequirementRef: string | null;
  controlledStockFlag: boolean;
  locationOrBinRef: string | null;
  verifiedAt: string | null;
  staleAfterAt: string | null;
  hardStopAfterAt: string | null;
  trustState: InventoryTrustState;
  freshnessConfidenceState: InventoryFreshnessConfidenceState;
  quarantineFlag: boolean;
  supervisorHoldFlag: boolean;
  substitutionPolicyState: InventorySubstitutionPolicyState;
  approvalBurdenRef: string | null;
  patientCommunicationDeltaRef: string | null;
  handoffConsequenceRef: string | null;
  selectedPackCount: number | null;
  selectedBaseUnits: number | null;
  policyBundleDigest: string;
  missionScopeDigest: string;
  continuityScopeDigest: string;
  version: number;
}

export interface InventoryTruthRecordProjection {
  inventorySupportRecordRef: AggregateRef<"InventorySupportRecord", Task355>;
  productIdentityRef: string;
  packBasisRef: string;
  availableQuantity: number;
  reservedQuantity: number;
  batchOrLotRef: string | null;
  expiryBand: InventoryExpiryBand;
  storageRequirementRef: string | null;
  controlledStockFlag: boolean;
  locationOrBinRef: string | null;
  lastVerifiedAt: string | null;
  freshnessState: InventoryFreshnessState;
  freshnessConfidenceState: InventoryFreshnessConfidenceState;
  quarantineFlag: boolean;
  supervisorHoldFlag: boolean;
  hardStopReached: boolean;
  trustState: InventoryTrustState;
}

export interface InventoryTruthProjectionSnapshot {
  inventoryTruthProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  lineItemRef: string;
  stockRecords: readonly InventoryTruthRecordProjection[];
  dominantFreshnessState: InventoryFreshnessState;
  hardStopReached: boolean;
  trustState: InventoryTrustState;
  computedAt: string;
  version: number;
}

export interface SupplyComputationSnapshot {
  supplyComputationId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  lineItemRef: string;
  candidateRef: string;
  baseUnit: string;
  prescribedBaseUnits: number;
  dailyBaseUnits: number | null;
  selectedBaseUnits: number | null;
  coverageRatio: number | null;
  remainingBaseUnits: number | null;
  daysCovered: number | null;
  splitPackRemainderBaseUnits: number | null;
  substitutionEquivalenceClass: InventoryEquivalenceClass;
  instructionDeltaRef: string | null;
  computationState: SupplyComputationState;
  computedAt: string;
  version: number;
}

export interface InventoryComparisonCandidateProjection {
  candidateRef: string;
  lineItemRef: string;
  equivalenceClass: InventoryEquivalenceClass;
  inventoryTruthRef: AggregateRef<"InventoryTruthProjection", Task355>;
  freshnessState: InventoryFreshnessState;
  expiryBand: InventoryExpiryBand;
  packBasisRef: string;
  selectedPackCount: number | null;
  selectedBaseUnits: number | null;
  coverageRatio: number | null;
  remainingBaseUnits: number | null;
  daysCovered: number | null;
  substitutionPolicyState: InventorySubstitutionPolicyState;
  approvalBurdenRef: string | null;
  patientCommunicationDeltaRef: string | null;
  handoffConsequenceRef: string | null;
  reservationState: InventoryReservationState;
  rank: number;
  rankReasonRef: string;
  supplyComputationRef: AggregateRef<"SupplyComputation", Task355> | null;
  commitReady: boolean;
  blockingReasonCodes: readonly string[];
}

export interface InventoryComparisonFenceSnapshot {
  inventoryComparisonFenceId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  lineItemRef: string;
  candidateRef: string;
  inventoryTruthProjectionRef: AggregateRef<"InventoryTruthProjection", Task355>;
  policyBundleDigest: string;
  availabilityDigest: string;
  expiryDigest: string;
  quarantineDigest: string;
  supervisorRequirementDigest: string;
  missionScopeDigest: string;
  continuityScopeDigest: string;
  candidateSetDigest: string;
  previousCandidateRef: string | null;
  fenceState: InventoryFenceState;
  invalidatedReasonCode: string | null;
  fenceEpoch: number;
  createdAt: string;
  refreshedAt: string;
  invalidatedAt: string | null;
  actorRef: string | null;
  idempotencyKey: string | null;
  version: number;
}

export interface InventoryComparisonProjectionSnapshot {
  inventoryComparisonProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  lineItemRef: string;
  inventoryTruthProjectionRef: AggregateRef<"InventoryTruthProjection", Task355>;
  activeFenceRef: AggregateRef<"InventoryComparisonFence", Task355> | null;
  preservedReadOnlyFenceRef: AggregateRef<"InventoryComparisonFence", Task355> | null;
  dominantCompareState: "ready" | "review_required" | "blocked";
  candidateRows: readonly InventoryComparisonCandidateProjection[];
  blockingReasonCodes: readonly string[];
  computedAt: string;
  version: number;
}

export interface LineCheckpointEvaluationSnapshot {
  lineCheckpointEvaluationId: string;
  lineItemRef: string;
  checkpointCode: string;
  requiredEvidenceRefs: readonly string[];
  blockingSignalCount: number;
  reviewSignalCount: number;
  informationSignalCount: number;
  freshnessState: InventoryFreshnessState;
  overrideState: PharmacyMedicationLineStateSnapshot["overrideState"];
  settlementGateState: PharmacyActionSettlementAgreementState;
  derivedState: MedicationCheckpointDerivedState;
  derivedAt: string;
}

export interface MedicationValidationCardProjection {
  lineItemRef: string;
  lineItemVersionRef: string;
  checkpointProjectionRef: AggregateRef<"MedicationValidationProjection", Task355>;
  inventoryTruthRef: AggregateRef<"InventoryTruthProjection", Task355>;
  policyBundleRef: string;
  supplyComputationRef: AggregateRef<"SupplyComputation", Task355> | null;
  reviewSessionRef: string;
  selectedStockAnchorRef: string | null;
  clarificationThreadRef: string | null;
  crossLineImpactDigestRef: string | null;
  settlementDigestRef: string;
  dominantActionRef: string;
  checkpointEvaluation: LineCheckpointEvaluationSnapshot;
  renderedAt: string;
}

export interface MedicationValidationProjectionSnapshot {
  medicationValidationProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  lineCards: readonly MedicationValidationCardProjection[];
  caseCheckpointRollup: MedicationCheckpointDerivedState;
  computedAt: string;
  version: number;
}

export interface PharmacyMissionProjectionSnapshot {
  pharmacyMissionProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  missionTokenRef: string;
  dominantPromotedRegion: PharmacyConsoleSupportRegion;
  suppressedRegionRefs: readonly PharmacyConsoleSupportRegion[];
  queueAnchorLeaseRef: string;
  handoffWatchWindowRef: string | null;
  fenceEpoch: number;
  continuityValidationState: PharmacyConsoleContinuityValidationState;
  computedAt: string;
  version: number;
}

export interface PharmacyActionSettlementProjectionSnapshot {
  pharmacyActionSettlementProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  canonicalSettlementType: PharmacyActionCanonicalSettlementType;
  canonicalSettlementRef: string | null;
  mutationGateRef: string | null;
  fenceEpoch: number;
  agreementState: PharmacyActionSettlementAgreementState;
  blockingReasonCodes: readonly string[];
  computedAt: string;
  version: number;
}

export interface PharmacyHandoffWatchProjectionSnapshot {
  pharmacyHandoffWatchProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  watchWindowState: PharmacyHandoffWatchState;
  watchWindowStartAt: string | null;
  watchWindowEndAt: string | null;
  blockerRefs: readonly string[];
  recoveryOwnerRef: string | null;
  computedAt: string;
  version: number;
}

export interface PharmacyHandoffProjectionSnapshot {
  pharmacyHandoffProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  handoffReadinessState: PharmacyHandoffReadinessState;
  inventoryFreshnessState: InventoryFreshnessState;
  patientCommunicationPreviewState: "previewed" | "missing";
  actionSettlementRef: AggregateRef<"PharmacyActionSettlementProjection", Task355>;
  continuityEvidenceRef:
    AggregateRef<"PharmacyConsoleContinuityEvidenceProjection", Task355>;
  handoffWatchProjectionRef: AggregateRef<"PharmacyHandoffWatchProjection", Task355>;
  blockingReasonCodes: readonly string[];
  computedAt: string;
  version: number;
}

export interface PharmacyConsoleContinuityEvidenceProjectionSnapshot {
  pharmacyConsoleContinuityEvidenceProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  continuityEvidenceProjectionRef:
    AggregateRef<"PharmacyContinuityEvidenceProjection", Task343> | null;
  validationState: PharmacyConsoleContinuityValidationState;
  blockingRefs: readonly string[];
  pendingPosture: PharmacyContinuityEvidenceProjectionSnapshot["pendingPosture"] | null;
  nextReviewAt: string | null;
  computedAt: string;
  version: number;
}

export interface PharmacyAssuranceProjectionSnapshot {
  pharmacyAssuranceProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  choiceTruthProjectionRef: AggregateRef<"PharmacyChoiceTruthProjection", Task343> | null;
  dispatchTruthProjectionRef: AggregateRef<"PharmacyDispatchTruthProjection", Task343> | null;
  outcomeTruthProjectionRef: AggregateRef<"PharmacyOutcomeTruthProjection", Task351> | null;
  consentCheckpointProjectionRef:
    AggregateRef<"PharmacyConsentCheckpointProjection", Task355> | null;
  practiceVisibilityProjectionRef:
    AggregateRef<"PharmacyPracticeVisibilityProjection", Task353> | null;
  assuranceState: PharmacyAssuranceState;
  blockingReasonCodes: readonly string[];
  currentRecoveryOwnerRef: string | null;
  computedAt: string;
  version: number;
}

export type PharmacyConsentCheckpointProjection = PharmacyConsentCheckpoint;

export interface PharmacyConsoleSummaryProjectionSnapshot {
  pharmacyConsoleSummaryProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  lineItemCount: number;
  verifiedLineCount: number;
  reviewRequiredLineCount: number;
  blockedLineCount: number;
  activeFenceCount: number;
  staleInventoryLineCount: number;
  dominantPromotedRegion: PharmacyConsoleSupportRegion;
  handoffReadinessState: PharmacyHandoffReadinessState;
  actionSettlementState: PharmacyActionSettlementAgreementState;
  continuityValidationState: PharmacyConsoleContinuityValidationState;
  assuranceState: PharmacyAssuranceState;
  computedAt: string;
  version: number;
}

export interface PharmacyConsoleWorklistProjectionSnapshot {
  pharmacyConsoleWorklistProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  caseStatus: PharmacyCaseSnapshot["status"];
  supportRegionState: PharmacyConsoleSupportRegion;
  inventoryFreshnessState: InventoryFreshnessState;
  handoffReadinessState: PharmacyHandoffReadinessState;
  actionSettlementState: PharmacyActionSettlementAgreementState;
  continuityValidationState: PharmacyConsoleContinuityValidationState;
  assuranceState: PharmacyAssuranceState;
  blockingReasonCodes: readonly string[];
  computedAt: string;
  version: number;
}

export interface PharmacyCaseWorkbenchProjectionSnapshot {
  pharmacyCaseWorkbenchProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  summaryProjectionRef: AggregateRef<"PharmacyConsoleSummaryProjection", Task355>;
  missionProjectionRef: AggregateRef<"PharmacyMissionProjection", Task355>;
  medicationValidationProjectionRef:
    AggregateRef<"MedicationValidationProjection", Task355>;
  inventoryTruthProjectionRefs: readonly AggregateRef<"InventoryTruthProjection", Task355>[];
  inventoryComparisonProjectionRefs:
    readonly AggregateRef<"InventoryComparisonProjection", Task355>[];
  handoffProjectionRef: AggregateRef<"PharmacyHandoffProjection", Task355>;
  handoffWatchProjectionRef: AggregateRef<"PharmacyHandoffWatchProjection", Task355>;
  actionSettlementProjectionRef:
    AggregateRef<"PharmacyActionSettlementProjection", Task355>;
  consoleContinuityEvidenceProjectionRef:
    AggregateRef<"PharmacyConsoleContinuityEvidenceProjection", Task355>;
  assuranceProjectionRef: AggregateRef<"PharmacyAssuranceProjection", Task355>;
  choiceTruthProjectionRef: AggregateRef<"PharmacyChoiceTruthProjection", Task343> | null;
  dispatchTruthProjectionRef:
    AggregateRef<"PharmacyDispatchTruthProjection", Task343> | null;
  outcomeTruthProjectionRef:
    AggregateRef<"PharmacyOutcomeTruthProjection", Task351> | null;
  consentCheckpointProjectionRef:
    AggregateRef<"PharmacyConsentCheckpointProjection", Task355> | null;
  computedAt: string;
  version: number;
}

export interface PharmacyConsoleAuditEventSnapshot {
  pharmacyConsoleAuditEventId: string;
  pharmacyCaseId: string;
  lineItemRef: string | null;
  scopeKind: "case" | "line";
  eventName: string;
  payloadDigest: string;
  recordedAt: string;
  version: number;
}

export interface PharmacyConsoleSummaryProjectionBuilder {
  buildSummaryProjection(input: {
    bundle: PharmacyCaseBundle;
    lineCards: readonly MedicationValidationCardProjection[];
    activeFences: readonly InventoryComparisonFenceSnapshot[];
    mission: PharmacyMissionProjectionSnapshot;
    handoff: PharmacyHandoffProjectionSnapshot;
    actionSettlement: PharmacyActionSettlementProjectionSnapshot;
    continuity: PharmacyConsoleContinuityEvidenceProjectionSnapshot;
    assurance: PharmacyAssuranceProjectionSnapshot;
    inventoryTruth: readonly InventoryTruthProjectionSnapshot[];
    recordedAt: string;
  }): PharmacyConsoleSummaryProjectionSnapshot;
}

export interface PharmacyConsoleWorklistProjectionBuilder {
  buildWorklistProjection(input: {
    bundle: PharmacyCaseBundle;
    summary: PharmacyConsoleSummaryProjectionSnapshot;
    recordedAt: string;
  }): PharmacyConsoleWorklistProjectionSnapshot;
}

export interface PharmacyCaseWorkbenchProjectionBuilder {
  buildWorkbenchProjection(input: {
    bundle: PharmacyCaseBundle;
    summary: PharmacyConsoleSummaryProjectionSnapshot;
    mission: PharmacyMissionProjectionSnapshot;
    medicationValidation: MedicationValidationProjectionSnapshot;
    inventoryTruth: readonly InventoryTruthProjectionSnapshot[];
    inventoryComparison: readonly InventoryComparisonProjectionSnapshot[];
    handoff: PharmacyHandoffProjectionSnapshot;
    handoffWatch: PharmacyHandoffWatchProjectionSnapshot;
    actionSettlement: PharmacyActionSettlementProjectionSnapshot;
    continuity: PharmacyConsoleContinuityEvidenceProjectionSnapshot;
    assurance: PharmacyAssuranceProjectionSnapshot;
    choiceTruth: PharmacyChoiceTruthProjection | null;
    dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
    outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot | null;
    consentCheckpoint: PharmacyConsentCheckpoint | null;
    recordedAt: string;
  }): PharmacyCaseWorkbenchProjectionSnapshot;
}

export interface MedicationValidationProjectionBuilder {
  buildMedicationValidationProjection(input: {
    bundle: PharmacyCaseBundle;
    lineStates: readonly PharmacyMedicationLineStateSnapshot[];
    inventoryTruth: readonly InventoryTruthProjectionSnapshot[];
    activeFencesByLine: ReadonlyMap<string, InventoryComparisonFenceSnapshot | null>;
    supplyByLine: ReadonlyMap<string, SupplyComputationSnapshot | null>;
    actionSettlementState: PharmacyActionSettlementAgreementState;
    recordedAt: string;
  }): MedicationValidationProjectionSnapshot;
}

export interface InventoryTruthProjectionBuilder {
  buildInventoryTruthProjection(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    lineState: PharmacyMedicationLineStateSnapshot;
    stockRecords: readonly InventorySupportRecordSnapshot[];
    recordedAt: string;
  }): InventoryTruthProjectionSnapshot;
}

export interface InventoryComparisonProjectionBuilder {
  buildInventoryComparisonProjection(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    lineState: PharmacyMedicationLineStateSnapshot;
    inventoryTruth: InventoryTruthProjectionSnapshot;
    stockRecords: readonly InventorySupportRecordSnapshot[];
    supplyComputations: ReadonlyMap<string, SupplyComputationSnapshot>;
    activeFence: InventoryComparisonFenceSnapshot | null;
    preservedFence: InventoryComparisonFenceSnapshot | null;
    recordedAt: string;
  }): InventoryComparisonProjectionSnapshot;
}

export interface InventoryComparisonFenceService {
  createFence(input: {
    pharmacyCaseId: string;
    lineItemRef: string;
    candidateRef: string;
    actorRef?: string | null;
    idempotencyKey?: string | null;
    recordedAt: string;
  }): Promise<InventoryComparisonFenceSnapshot>;
  refreshFence(input: {
    pharmacyCaseId: string;
    lineItemRef: string;
    recordedAt: string;
  }): Promise<InventoryComparisonFenceSnapshot | null>;
  invalidateFence(input: {
    inventoryComparisonFenceId: string;
    recordedAt: string;
    reasonCode: string;
  }): Promise<InventoryComparisonFenceSnapshot | null>;
}

export interface SupplyComputationService {
  computeSupply(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    lineState: PharmacyMedicationLineStateSnapshot;
    stockRecord: InventorySupportRecordSnapshot;
    recordedAt: string;
  }): SupplyComputationSnapshot;
}

export interface PharmacyHandoffProjectionBuilder {
  buildHandoffProjection(input: {
    bundle: PharmacyCaseBundle;
    lineCards: readonly MedicationValidationCardProjection[];
    inventoryTruth: readonly InventoryTruthProjectionSnapshot[];
    actionSettlement: PharmacyActionSettlementProjectionSnapshot;
    continuity: PharmacyConsoleContinuityEvidenceProjectionSnapshot;
    handoffWatch: PharmacyHandoffWatchProjectionSnapshot;
    recordedAt: string;
  }): PharmacyHandoffProjectionSnapshot;
}

export interface PharmacyActionSettlementProjectionBuilder {
  buildActionSettlementProjection(input: {
    bundle: PharmacyCaseBundle;
    dispatchSettlement: PharmacyDispatchSettlementSnapshot | null;
    dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
    outcomeSettlement: PharmacyOutcomeSettlementSnapshot | null;
    outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot | null;
    continuity: PharmacyConsoleContinuityEvidenceProjectionSnapshot;
    activeFences: readonly InventoryComparisonFenceSnapshot[];
    recordedAt: string;
  }): PharmacyActionSettlementProjectionSnapshot;
}

export interface PharmacyConsoleContinuityEvidenceProjectionBuilder {
  buildConsoleContinuityEvidenceProjection(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    continuityEvidence: PharmacyContinuityEvidenceProjectionSnapshot | null;
    recordedAt: string;
  }): PharmacyConsoleContinuityEvidenceProjectionSnapshot;
}

export interface PharmacyAssuranceProjectionBuilder {
  buildAssuranceProjection(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    choiceTruth: PharmacyChoiceTruthProjection | null;
    dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
    outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot | null;
    consentCheckpoint: PharmacyConsentCheckpoint | null;
    practiceVisibility: PharmacyPracticeVisibilityProjectionSnapshot | null;
    recordedAt: string;
  }): PharmacyAssuranceProjectionSnapshot;
}

export interface Phase6PharmacyConsoleRepositories {
  getMedicationLineState(
    pharmacyMedicationLineStateId: string,
  ): Promise<SnapshotDocument<PharmacyMedicationLineStateSnapshot> | null>;
  listMedicationLineStatesForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyMedicationLineStateSnapshot>[]>;
  saveMedicationLineState(
    snapshot: PharmacyMedicationLineStateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getInventorySupportRecord(
    inventorySupportRecordId: string,
  ): Promise<SnapshotDocument<InventorySupportRecordSnapshot> | null>;
  listInventorySupportRecordsForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<InventorySupportRecordSnapshot>[]>;
  listInventorySupportRecordsForLine(
    pharmacyCaseId: string,
    lineItemRef: string,
  ): Promise<readonly SnapshotDocument<InventorySupportRecordSnapshot>[]>;
  saveInventorySupportRecord(
    snapshot: InventorySupportRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getSupplyComputation(
    supplyComputationId: string,
  ): Promise<SnapshotDocument<SupplyComputationSnapshot> | null>;
  getCurrentSupplyComputationForCandidate(
    pharmacyCaseId: string,
    lineItemRef: string,
    candidateRef: string,
  ): Promise<SnapshotDocument<SupplyComputationSnapshot> | null>;
  listSupplyComputationsForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<SupplyComputationSnapshot>[]>;
  listSupplyComputationsForLine(
    pharmacyCaseId: string,
    lineItemRef: string,
  ): Promise<readonly SnapshotDocument<SupplyComputationSnapshot>[]>;
  saveSupplyComputation(
    snapshot: SupplyComputationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getInventoryComparisonFence(
    inventoryComparisonFenceId: string,
  ): Promise<SnapshotDocument<InventoryComparisonFenceSnapshot> | null>;
  getCurrentInventoryComparisonFenceForLine(
    pharmacyCaseId: string,
    lineItemRef: string,
  ): Promise<SnapshotDocument<InventoryComparisonFenceSnapshot> | null>;
  saveInventoryComparisonFence(
    snapshot: InventoryComparisonFenceSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getConsoleSummaryProjection(
    pharmacyConsoleSummaryProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyConsoleSummaryProjectionSnapshot> | null>;
  getCurrentConsoleSummaryProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyConsoleSummaryProjectionSnapshot> | null>;
  listCurrentConsoleSummaryProjections(): Promise<
    readonly SnapshotDocument<PharmacyConsoleSummaryProjectionSnapshot>[]
  >;
  saveConsoleSummaryProjection(
    snapshot: PharmacyConsoleSummaryProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getConsoleWorklistProjection(
    pharmacyConsoleWorklistProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyConsoleWorklistProjectionSnapshot> | null>;
  getCurrentConsoleWorklistProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyConsoleWorklistProjectionSnapshot> | null>;
  listCurrentConsoleWorklistProjections(): Promise<
    readonly SnapshotDocument<PharmacyConsoleWorklistProjectionSnapshot>[]
  >;
  saveConsoleWorklistProjection(
    snapshot: PharmacyConsoleWorklistProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCaseWorkbenchProjection(
    pharmacyCaseWorkbenchProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyCaseWorkbenchProjectionSnapshot> | null>;
  getCurrentCaseWorkbenchProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyCaseWorkbenchProjectionSnapshot> | null>;
  saveCaseWorkbenchProjection(
    snapshot: PharmacyCaseWorkbenchProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getMissionProjection(
    pharmacyMissionProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyMissionProjectionSnapshot> | null>;
  getCurrentMissionProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyMissionProjectionSnapshot> | null>;
  saveMissionProjection(
    snapshot: PharmacyMissionProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getMedicationValidationProjection(
    medicationValidationProjectionId: string,
  ): Promise<SnapshotDocument<MedicationValidationProjectionSnapshot> | null>;
  getCurrentMedicationValidationProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<MedicationValidationProjectionSnapshot> | null>;
  saveMedicationValidationProjection(
    snapshot: MedicationValidationProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getInventoryTruthProjection(
    inventoryTruthProjectionId: string,
  ): Promise<SnapshotDocument<InventoryTruthProjectionSnapshot> | null>;
  getCurrentInventoryTruthProjectionForLine(
    pharmacyCaseId: string,
    lineItemRef: string,
  ): Promise<SnapshotDocument<InventoryTruthProjectionSnapshot> | null>;
  listCurrentInventoryTruthProjectionsForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<InventoryTruthProjectionSnapshot>[]>;
  saveInventoryTruthProjection(
    snapshot: InventoryTruthProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getInventoryComparisonProjection(
    inventoryComparisonProjectionId: string,
  ): Promise<SnapshotDocument<InventoryComparisonProjectionSnapshot> | null>;
  getCurrentInventoryComparisonProjectionForLine(
    pharmacyCaseId: string,
    lineItemRef: string,
  ): Promise<SnapshotDocument<InventoryComparisonProjectionSnapshot> | null>;
  listCurrentInventoryComparisonProjectionsForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<InventoryComparisonProjectionSnapshot>[]
  >;
  saveInventoryComparisonProjection(
    snapshot: InventoryComparisonProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getHandoffProjection(
    pharmacyHandoffProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyHandoffProjectionSnapshot> | null>;
  getCurrentHandoffProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyHandoffProjectionSnapshot> | null>;
  saveHandoffProjection(
    snapshot: PharmacyHandoffProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getHandoffWatchProjection(
    pharmacyHandoffWatchProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyHandoffWatchProjectionSnapshot> | null>;
  getCurrentHandoffWatchProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyHandoffWatchProjectionSnapshot> | null>;
  saveHandoffWatchProjection(
    snapshot: PharmacyHandoffWatchProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getActionSettlementProjection(
    pharmacyActionSettlementProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyActionSettlementProjectionSnapshot> | null>;
  getCurrentActionSettlementProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyActionSettlementProjectionSnapshot> | null>;
  saveActionSettlementProjection(
    snapshot: PharmacyActionSettlementProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getConsoleContinuityEvidenceProjection(
    pharmacyConsoleContinuityEvidenceProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyConsoleContinuityEvidenceProjectionSnapshot> | null>;
  getCurrentConsoleContinuityEvidenceProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyConsoleContinuityEvidenceProjectionSnapshot> | null>;
  saveConsoleContinuityEvidenceProjection(
    snapshot: PharmacyConsoleContinuityEvidenceProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getAssuranceProjection(
    pharmacyAssuranceProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyAssuranceProjectionSnapshot> | null>;
  getCurrentAssuranceProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyAssuranceProjectionSnapshot> | null>;
  saveAssuranceProjection(
    snapshot: PharmacyAssuranceProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listConsoleAuditEventsForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyConsoleAuditEventSnapshot>[]>;
  appendConsoleAuditEvent(snapshot: PharmacyConsoleAuditEventSnapshot): Promise<void>;
}

export interface Phase6PharmacyConsoleStore extends Phase6PharmacyConsoleRepositories {}

function normalizeMedicationLineState(
  snapshot: PharmacyMedicationLineStateSnapshot,
): PharmacyMedicationLineStateSnapshot {
  return {
    ...snapshot,
    pharmacyMedicationLineStateId: requireText(
      snapshot.pharmacyMedicationLineStateId,
      "pharmacyMedicationLineStateId",
    ),
    pharmacyCaseRef: makeRef("PharmacyCase", snapshot.pharmacyCaseRef.refId, TASK_342),
    lineItemRef: requireText(snapshot.lineItemRef, "lineItemRef"),
    medicationLabel: requireText(snapshot.medicationLabel, "medicationLabel"),
    strengthLabel: optionalText(snapshot.strengthLabel),
    formLabel: optionalText(snapshot.formLabel),
    baseUnit: requireText(snapshot.baseUnit, "baseUnit"),
    prescribedBaseUnits: ensureNonNegativeNumber(
      snapshot.prescribedBaseUnits,
      "prescribedBaseUnits",
    ),
    dailyBaseUnits:
      snapshot.dailyBaseUnits === null
        ? null
        : ensureNonNegativeNumber(snapshot.dailyBaseUnits, "dailyBaseUnits"),
    packBasisRef: requireText(snapshot.packBasisRef, "packBasisRef"),
    intendedSupplyWindowDays:
      snapshot.intendedSupplyWindowDays === null
        ? null
        : ensureNonNegativeInteger(snapshot.intendedSupplyWindowDays, "intendedSupplyWindowDays"),
    selectedCandidateRef: optionalText(snapshot.selectedCandidateRef),
    requiredCommunicationPreviewRefs: uniqueSorted(snapshot.requiredCommunicationPreviewRefs),
    communicationPreviewed: snapshot.communicationPreviewed,
    blockingSignalCodes: uniqueSorted(snapshot.blockingSignalCodes),
    reviewSignalCodes: uniqueSorted(snapshot.reviewSignalCodes),
    informationSignalCodes: uniqueSorted(snapshot.informationSignalCodes),
    verifiedEvidenceRefs: uniqueSorted(snapshot.verifiedEvidenceRefs),
    clarificationThreadRef: optionalText(snapshot.clarificationThreadRef),
    crossLineImpactDigestRef: optionalText(snapshot.crossLineImpactDigestRef),
    lineItemVersionRef: requireText(snapshot.lineItemVersionRef, "lineItemVersionRef"),
    policyBundleRef: requireText(snapshot.policyBundleRef, "policyBundleRef"),
    reviewSessionRef: requireText(snapshot.reviewSessionRef, "reviewSessionRef"),
    version: ensureNonNegativeInteger(snapshot.version, "version"),
  };
}

function normalizeInventorySupportRecord(
  snapshot: InventorySupportRecordSnapshot,
): InventorySupportRecordSnapshot {
  return {
    ...snapshot,
    inventorySupportRecordId: requireText(snapshot.inventorySupportRecordId, "inventorySupportRecordId"),
    pharmacyCaseRef: makeRef("PharmacyCase", snapshot.pharmacyCaseRef.refId, TASK_342),
    lineItemRef: requireText(snapshot.lineItemRef, "lineItemRef"),
    candidateRef: requireText(snapshot.candidateRef, "candidateRef"),
    productIdentityRef: requireText(snapshot.productIdentityRef, "productIdentityRef"),
    packBasisRef: requireText(snapshot.packBasisRef, "packBasisRef"),
    baseUnitsPerPack: ensureNonNegativeNumber(snapshot.baseUnitsPerPack, "baseUnitsPerPack"),
    availableQuantity: ensureNonNegativeNumber(snapshot.availableQuantity, "availableQuantity"),
    reservedQuantity: ensureNonNegativeNumber(snapshot.reservedQuantity, "reservedQuantity"),
    batchOrLotRef: optionalText(snapshot.batchOrLotRef),
    storageRequirementRef: optionalText(snapshot.storageRequirementRef),
    locationOrBinRef: optionalText(snapshot.locationOrBinRef),
    verifiedAt: snapshot.verifiedAt === null ? null : ensureIsoTimestamp(snapshot.verifiedAt, "verifiedAt"),
    staleAfterAt:
      snapshot.staleAfterAt === null ? null : ensureIsoTimestamp(snapshot.staleAfterAt, "staleAfterAt"),
    hardStopAfterAt:
      snapshot.hardStopAfterAt === null
        ? null
        : ensureIsoTimestamp(snapshot.hardStopAfterAt, "hardStopAfterAt"),
    approvalBurdenRef: optionalText(snapshot.approvalBurdenRef),
    patientCommunicationDeltaRef: optionalText(snapshot.patientCommunicationDeltaRef),
    handoffConsequenceRef: optionalText(snapshot.handoffConsequenceRef),
    selectedPackCount:
      snapshot.selectedPackCount === null
        ? null
        : ensureNonNegativeNumber(snapshot.selectedPackCount, "selectedPackCount"),
    selectedBaseUnits:
      snapshot.selectedBaseUnits === null
        ? null
        : ensureNonNegativeNumber(snapshot.selectedBaseUnits, "selectedBaseUnits"),
    policyBundleDigest: requireText(snapshot.policyBundleDigest, "policyBundleDigest"),
    missionScopeDigest: requireText(snapshot.missionScopeDigest, "missionScopeDigest"),
    continuityScopeDigest: requireText(snapshot.continuityScopeDigest, "continuityScopeDigest"),
    version: ensureNonNegativeInteger(snapshot.version, "version"),
  };
}

function normalizeSupplyComputation(
  snapshot: SupplyComputationSnapshot,
): SupplyComputationSnapshot {
  return {
    ...snapshot,
    supplyComputationId: requireText(snapshot.supplyComputationId, "supplyComputationId"),
    pharmacyCaseRef: makeRef("PharmacyCase", snapshot.pharmacyCaseRef.refId, TASK_342),
    lineItemRef: requireText(snapshot.lineItemRef, "lineItemRef"),
    candidateRef: requireText(snapshot.candidateRef, "candidateRef"),
    baseUnit: requireText(snapshot.baseUnit, "baseUnit"),
    prescribedBaseUnits: ensureNonNegativeNumber(snapshot.prescribedBaseUnits, "prescribedBaseUnits"),
    dailyBaseUnits:
      snapshot.dailyBaseUnits === null
        ? null
        : ensureNonNegativeNumber(snapshot.dailyBaseUnits, "dailyBaseUnits"),
    selectedBaseUnits:
      snapshot.selectedBaseUnits === null
        ? null
        : ensureNonNegativeNumber(snapshot.selectedBaseUnits, "selectedBaseUnits"),
    coverageRatio:
      snapshot.coverageRatio === null
        ? null
        : ensureFiniteNumber(snapshot.coverageRatio, "coverageRatio"),
    remainingBaseUnits:
      snapshot.remainingBaseUnits === null
        ? null
        : ensureNonNegativeNumber(snapshot.remainingBaseUnits, "remainingBaseUnits"),
    daysCovered:
      snapshot.daysCovered === null
        ? null
        : ensureNonNegativeNumber(snapshot.daysCovered, "daysCovered"),
    splitPackRemainderBaseUnits:
      snapshot.splitPackRemainderBaseUnits === null
        ? null
        : ensureNonNegativeNumber(
            snapshot.splitPackRemainderBaseUnits,
            "splitPackRemainderBaseUnits",
          ),
    instructionDeltaRef: optionalText(snapshot.instructionDeltaRef),
    computedAt: ensureIsoTimestamp(snapshot.computedAt, "computedAt"),
    version: ensureNonNegativeInteger(snapshot.version, "version"),
  };
}

function normalizeFence(snapshot: InventoryComparisonFenceSnapshot): InventoryComparisonFenceSnapshot {
  return {
    ...snapshot,
    inventoryComparisonFenceId: requireText(
      snapshot.inventoryComparisonFenceId,
      "inventoryComparisonFenceId",
    ),
    pharmacyCaseRef: makeRef("PharmacyCase", snapshot.pharmacyCaseRef.refId, TASK_342),
    lineItemRef: requireText(snapshot.lineItemRef, "lineItemRef"),
    candidateRef: requireText(snapshot.candidateRef, "candidateRef"),
    inventoryTruthProjectionRef: makeRef(
      "InventoryTruthProjection",
      snapshot.inventoryTruthProjectionRef.refId,
      TASK_355,
    ),
    policyBundleDigest: requireText(snapshot.policyBundleDigest, "policyBundleDigest"),
    availabilityDigest: requireText(snapshot.availabilityDigest, "availabilityDigest"),
    expiryDigest: requireText(snapshot.expiryDigest, "expiryDigest"),
    quarantineDigest: requireText(snapshot.quarantineDigest, "quarantineDigest"),
    supervisorRequirementDigest: requireText(
      snapshot.supervisorRequirementDigest,
      "supervisorRequirementDigest",
    ),
    missionScopeDigest: requireText(snapshot.missionScopeDigest, "missionScopeDigest"),
    continuityScopeDigest: requireText(snapshot.continuityScopeDigest, "continuityScopeDigest"),
    candidateSetDigest: requireText(snapshot.candidateSetDigest, "candidateSetDigest"),
    previousCandidateRef: optionalText(snapshot.previousCandidateRef),
    invalidatedReasonCode: optionalText(snapshot.invalidatedReasonCode),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    refreshedAt: ensureIsoTimestamp(snapshot.refreshedAt, "refreshedAt"),
    invalidatedAt:
      snapshot.invalidatedAt === null
        ? null
        : ensureIsoTimestamp(snapshot.invalidatedAt, "invalidatedAt"),
    actorRef: optionalText(snapshot.actorRef),
    idempotencyKey: optionalText(snapshot.idempotencyKey),
    fenceEpoch: ensureNonNegativeInteger(snapshot.fenceEpoch, "fenceEpoch"),
    version: ensureNonNegativeInteger(snapshot.version, "version"),
  };
}

function normalizeAudit(snapshot: PharmacyConsoleAuditEventSnapshot): PharmacyConsoleAuditEventSnapshot {
  return {
    ...snapshot,
    pharmacyConsoleAuditEventId: requireText(
      snapshot.pharmacyConsoleAuditEventId,
      "pharmacyConsoleAuditEventId",
    ),
    pharmacyCaseId: requireText(snapshot.pharmacyCaseId, "pharmacyCaseId"),
    lineItemRef: optionalText(snapshot.lineItemRef),
    payloadDigest: requireText(snapshot.payloadDigest, "payloadDigest"),
    recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    version: ensureNonNegativeInteger(snapshot.version, "version"),
  };
}

export function createPhase6PharmacyConsoleStore(): Phase6PharmacyConsoleStore {
  const lineStates = new Map<string, PharmacyMedicationLineStateSnapshot>();
  const lineIdsByCase = new Map<string, string[]>();
  const inventoryRecords = new Map<string, InventorySupportRecordSnapshot>();
  const inventoryIdsByCase = new Map<string, string[]>();
  const inventoryIdsByCaseLine = new Map<string, string[]>();
  const supplyComputations = new Map<string, SupplyComputationSnapshot>();
  const currentSupplyByCaseLineCandidate = new Map<string, string>();
  const supplyIdsByCase = new Map<string, string[]>();
  const supplyIdsByCaseLine = new Map<string, string[]>();
  const fences = new Map<string, InventoryComparisonFenceSnapshot>();
  const currentFenceByCaseLine = new Map<string, string>();
  const summaries = new Map<string, PharmacyConsoleSummaryProjectionSnapshot>();
  const currentSummaryByCase = new Map<string, string>();
  const worklist = new Map<string, PharmacyConsoleWorklistProjectionSnapshot>();
  const currentWorklistByCase = new Map<string, string>();
  const workbench = new Map<string, PharmacyCaseWorkbenchProjectionSnapshot>();
  const currentWorkbenchByCase = new Map<string, string>();
  const missions = new Map<string, PharmacyMissionProjectionSnapshot>();
  const currentMissionByCase = new Map<string, string>();
  const medicationValidation = new Map<string, MedicationValidationProjectionSnapshot>();
  const currentMedicationValidationByCase = new Map<string, string>();
  const inventoryTruth = new Map<string, InventoryTruthProjectionSnapshot>();
  const currentInventoryTruthByCaseLine = new Map<string, string>();
  const inventoryComparison = new Map<string, InventoryComparisonProjectionSnapshot>();
  const currentInventoryComparisonByCaseLine = new Map<string, string>();
  const handoff = new Map<string, PharmacyHandoffProjectionSnapshot>();
  const currentHandoffByCase = new Map<string, string>();
  const handoffWatch = new Map<string, PharmacyHandoffWatchProjectionSnapshot>();
  const currentHandoffWatchByCase = new Map<string, string>();
  const actionSettlement = new Map<string, PharmacyActionSettlementProjectionSnapshot>();
  const currentActionSettlementByCase = new Map<string, string>();
  const continuity = new Map<string, PharmacyConsoleContinuityEvidenceProjectionSnapshot>();
  const currentContinuityByCase = new Map<string, string>();
  const assurance = new Map<string, PharmacyAssuranceProjectionSnapshot>();
  const currentAssuranceByCase = new Map<string, string>();
  const auditEvents = new Map<string, PharmacyConsoleAuditEventSnapshot[]>();

  function appendIndex(index: Map<string, string[]>, key: string, value: string): void {
    const current = new Set(index.get(key) ?? []);
    current.add(value);
    index.set(key, [...current].sort((left, right) => left.localeCompare(right)));
  }

  function caseLineKey(pharmacyCaseId: string, lineItemRef: string): string {
    return `${pharmacyCaseId}::${lineItemRef}`;
  }

  function caseLineCandidateKey(
    pharmacyCaseId: string,
    lineItemRef: string,
    candidateRef: string,
  ): string {
    return `${pharmacyCaseId}::${lineItemRef}::${candidateRef}`;
  }

  return {
    async getMedicationLineState(pharmacyMedicationLineStateId) {
      const snapshot = lineStates.get(pharmacyMedicationLineStateId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async listMedicationLineStatesForCase(pharmacyCaseId) {
      return (lineIdsByCase.get(pharmacyCaseId) ?? [])
        .map((id) => lineStates.get(id)!)
        .sort((left, right) => left.lineItemRef.localeCompare(right.lineItemRef))
        .map((snapshot) => new StoredDocument(snapshot));
    },
    async saveMedicationLineState(snapshot, options) {
      const normalized = normalizeMedicationLineState(snapshot);
      saveWithCas(lineStates, normalized.pharmacyMedicationLineStateId, normalized, options);
      appendIndex(lineIdsByCase, normalized.pharmacyCaseRef.refId, normalized.pharmacyMedicationLineStateId);
    },
    async getInventorySupportRecord(inventorySupportRecordId) {
      const snapshot = inventoryRecords.get(inventorySupportRecordId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async listInventorySupportRecordsForCase(pharmacyCaseId) {
      return (inventoryIdsByCase.get(pharmacyCaseId) ?? [])
        .map((id) => inventoryRecords.get(id)!)
        .sort((left, right) => left.candidateRef.localeCompare(right.candidateRef))
        .map((snapshot) => new StoredDocument(snapshot));
    },
    async listInventorySupportRecordsForLine(pharmacyCaseId, lineItemRef) {
      return (inventoryIdsByCaseLine.get(caseLineKey(pharmacyCaseId, lineItemRef)) ?? [])
        .map((id) => inventoryRecords.get(id)!)
        .sort((left, right) => left.candidateRef.localeCompare(right.candidateRef))
        .map((snapshot) => new StoredDocument(snapshot));
    },
    async saveInventorySupportRecord(snapshot, options) {
      const normalized = normalizeInventorySupportRecord(snapshot);
      saveWithCas(
        inventoryRecords,
        normalized.inventorySupportRecordId,
        normalized,
        options,
      );
      appendIndex(
        inventoryIdsByCase,
        normalized.pharmacyCaseRef.refId,
        normalized.inventorySupportRecordId,
      );
      appendIndex(
        inventoryIdsByCaseLine,
        caseLineKey(normalized.pharmacyCaseRef.refId, normalized.lineItemRef),
        normalized.inventorySupportRecordId,
      );
    },
    async getSupplyComputation(supplyComputationId) {
      const snapshot = supplyComputations.get(supplyComputationId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentSupplyComputationForCandidate(pharmacyCaseId, lineItemRef, candidateRef) {
      const currentId = currentSupplyByCaseLineCandidate.get(
        caseLineCandidateKey(pharmacyCaseId, lineItemRef, candidateRef),
      );
      return currentId === undefined ? null : new StoredDocument(supplyComputations.get(currentId)!);
    },
    async listSupplyComputationsForCase(pharmacyCaseId) {
      return (supplyIdsByCase.get(pharmacyCaseId) ?? [])
        .map((id) => supplyComputations.get(id)!)
        .sort((left, right) => compareIso(left.computedAt, right.computedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },
    async listSupplyComputationsForLine(pharmacyCaseId, lineItemRef) {
      return (supplyIdsByCaseLine.get(caseLineKey(pharmacyCaseId, lineItemRef)) ?? [])
        .map((id) => supplyComputations.get(id)!)
        .sort((left, right) => compareIso(left.computedAt, right.computedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },
    async saveSupplyComputation(snapshot, options) {
      const normalized = normalizeSupplyComputation(snapshot);
      saveWithCas(
        supplyComputations,
        normalized.supplyComputationId,
        normalized,
        options,
      );
      currentSupplyByCaseLineCandidate.set(
        caseLineCandidateKey(
          normalized.pharmacyCaseRef.refId,
          normalized.lineItemRef,
          normalized.candidateRef,
        ),
        normalized.supplyComputationId,
      );
      appendIndex(supplyIdsByCase, normalized.pharmacyCaseRef.refId, normalized.supplyComputationId);
      appendIndex(
        supplyIdsByCaseLine,
        caseLineKey(normalized.pharmacyCaseRef.refId, normalized.lineItemRef),
        normalized.supplyComputationId,
      );
    },
    async getInventoryComparisonFence(inventoryComparisonFenceId) {
      const snapshot = fences.get(inventoryComparisonFenceId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentInventoryComparisonFenceForLine(pharmacyCaseId, lineItemRef) {
      const currentId = currentFenceByCaseLine.get(caseLineKey(pharmacyCaseId, lineItemRef));
      return currentId === undefined ? null : new StoredDocument(fences.get(currentId)!);
    },
    async saveInventoryComparisonFence(snapshot, options) {
      const normalized = normalizeFence(snapshot);
      saveWithCas(fences, normalized.inventoryComparisonFenceId, normalized, options);
      currentFenceByCaseLine.set(
        caseLineKey(normalized.pharmacyCaseRef.refId, normalized.lineItemRef),
        normalized.inventoryComparisonFenceId,
      );
    },
    async getConsoleSummaryProjection(pharmacyConsoleSummaryProjectionId) {
      const snapshot = summaries.get(pharmacyConsoleSummaryProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentConsoleSummaryProjectionForCase(pharmacyCaseId) {
      const currentId = currentSummaryByCase.get(pharmacyCaseId);
      return currentId === undefined ? null : new StoredDocument(summaries.get(currentId)!);
    },
    async listCurrentConsoleSummaryProjections() {
      return currentDocumentsFromIndex(currentSummaryByCase, summaries);
    },
    async saveConsoleSummaryProjection(snapshot, options) {
      saveWithCas(
        summaries,
        snapshot.pharmacyConsoleSummaryProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentSummaryByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyConsoleSummaryProjectionId);
    },
    async getConsoleWorklistProjection(pharmacyConsoleWorklistProjectionId) {
      const snapshot = worklist.get(pharmacyConsoleWorklistProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentConsoleWorklistProjectionForCase(pharmacyCaseId) {
      const currentId = currentWorklistByCase.get(pharmacyCaseId);
      return currentId === undefined ? null : new StoredDocument(worklist.get(currentId)!);
    },
    async listCurrentConsoleWorklistProjections() {
      return currentDocumentsFromIndex(currentWorklistByCase, worklist);
    },
    async saveConsoleWorklistProjection(snapshot, options) {
      saveWithCas(
        worklist,
        snapshot.pharmacyConsoleWorklistProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentWorklistByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyConsoleWorklistProjectionId);
    },
    async getCaseWorkbenchProjection(pharmacyCaseWorkbenchProjectionId) {
      const snapshot = workbench.get(pharmacyCaseWorkbenchProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentCaseWorkbenchProjectionForCase(pharmacyCaseId) {
      const currentId = currentWorkbenchByCase.get(pharmacyCaseId);
      return currentId === undefined ? null : new StoredDocument(workbench.get(currentId)!);
    },
    async saveCaseWorkbenchProjection(snapshot, options) {
      saveWithCas(
        workbench,
        snapshot.pharmacyCaseWorkbenchProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentWorkbenchByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyCaseWorkbenchProjectionId);
    },
    async getMissionProjection(pharmacyMissionProjectionId) {
      const snapshot = missions.get(pharmacyMissionProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentMissionProjectionForCase(pharmacyCaseId) {
      const currentId = currentMissionByCase.get(pharmacyCaseId);
      return currentId === undefined ? null : new StoredDocument(missions.get(currentId)!);
    },
    async saveMissionProjection(snapshot, options) {
      saveWithCas(
        missions,
        snapshot.pharmacyMissionProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentMissionByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyMissionProjectionId);
    },
    async getMedicationValidationProjection(medicationValidationProjectionId) {
      const snapshot = medicationValidation.get(medicationValidationProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentMedicationValidationProjectionForCase(pharmacyCaseId) {
      const currentId = currentMedicationValidationByCase.get(pharmacyCaseId);
      return currentId === undefined ? null : new StoredDocument(medicationValidation.get(currentId)!);
    },
    async saveMedicationValidationProjection(snapshot, options) {
      saveWithCas(
        medicationValidation,
        snapshot.medicationValidationProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentMedicationValidationByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.medicationValidationProjectionId,
      );
    },
    async getInventoryTruthProjection(inventoryTruthProjectionId) {
      const snapshot = inventoryTruth.get(inventoryTruthProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentInventoryTruthProjectionForLine(pharmacyCaseId, lineItemRef) {
      const currentId = currentInventoryTruthByCaseLine.get(caseLineKey(pharmacyCaseId, lineItemRef));
      return currentId === undefined ? null : new StoredDocument(inventoryTruth.get(currentId)!);
    },
    async listCurrentInventoryTruthProjectionsForCase(pharmacyCaseId) {
      const rows = [...currentInventoryTruthByCaseLine.entries()]
        .filter(([key]) => key.startsWith(`${pharmacyCaseId}::`))
        .map(([, projectionId]) => inventoryTruth.get(projectionId)!)
        .sort((left, right) => left.lineItemRef.localeCompare(right.lineItemRef));
      return rows.map((snapshot) => new StoredDocument(snapshot));
    },
    async saveInventoryTruthProjection(snapshot, options) {
      saveWithCas(
        inventoryTruth,
        snapshot.inventoryTruthProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentInventoryTruthByCaseLine.set(
        caseLineKey(snapshot.pharmacyCaseRef.refId, snapshot.lineItemRef),
        snapshot.inventoryTruthProjectionId,
      );
    },
    async getInventoryComparisonProjection(inventoryComparisonProjectionId) {
      const snapshot = inventoryComparison.get(inventoryComparisonProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentInventoryComparisonProjectionForLine(pharmacyCaseId, lineItemRef) {
      const currentId = currentInventoryComparisonByCaseLine.get(
        caseLineKey(pharmacyCaseId, lineItemRef),
      );
      return currentId === undefined ? null : new StoredDocument(inventoryComparison.get(currentId)!);
    },
    async listCurrentInventoryComparisonProjectionsForCase(pharmacyCaseId) {
      const rows = [...currentInventoryComparisonByCaseLine.entries()]
        .filter(([key]) => key.startsWith(`${pharmacyCaseId}::`))
        .map(([, projectionId]) => inventoryComparison.get(projectionId)!)
        .sort((left, right) => left.lineItemRef.localeCompare(right.lineItemRef));
      return rows.map((snapshot) => new StoredDocument(snapshot));
    },
    async saveInventoryComparisonProjection(snapshot, options) {
      saveWithCas(
        inventoryComparison,
        snapshot.inventoryComparisonProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentInventoryComparisonByCaseLine.set(
        caseLineKey(snapshot.pharmacyCaseRef.refId, snapshot.lineItemRef),
        snapshot.inventoryComparisonProjectionId,
      );
    },
    async getHandoffProjection(pharmacyHandoffProjectionId) {
      const snapshot = handoff.get(pharmacyHandoffProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentHandoffProjectionForCase(pharmacyCaseId) {
      const currentId = currentHandoffByCase.get(pharmacyCaseId);
      return currentId === undefined ? null : new StoredDocument(handoff.get(currentId)!);
    },
    async saveHandoffProjection(snapshot, options) {
      saveWithCas(
        handoff,
        snapshot.pharmacyHandoffProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentHandoffByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyHandoffProjectionId);
    },
    async getHandoffWatchProjection(pharmacyHandoffWatchProjectionId) {
      const snapshot = handoffWatch.get(pharmacyHandoffWatchProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentHandoffWatchProjectionForCase(pharmacyCaseId) {
      const currentId = currentHandoffWatchByCase.get(pharmacyCaseId);
      return currentId === undefined ? null : new StoredDocument(handoffWatch.get(currentId)!);
    },
    async saveHandoffWatchProjection(snapshot, options) {
      saveWithCas(
        handoffWatch,
        snapshot.pharmacyHandoffWatchProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentHandoffWatchByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyHandoffWatchProjectionId);
    },
    async getActionSettlementProjection(pharmacyActionSettlementProjectionId) {
      const snapshot = actionSettlement.get(pharmacyActionSettlementProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentActionSettlementProjectionForCase(pharmacyCaseId) {
      const currentId = currentActionSettlementByCase.get(pharmacyCaseId);
      return currentId === undefined ? null : new StoredDocument(actionSettlement.get(currentId)!);
    },
    async saveActionSettlementProjection(snapshot, options) {
      saveWithCas(
        actionSettlement,
        snapshot.pharmacyActionSettlementProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentActionSettlementByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyActionSettlementProjectionId,
      );
    },
    async getConsoleContinuityEvidenceProjection(pharmacyConsoleContinuityEvidenceProjectionId) {
      const snapshot = continuity.get(pharmacyConsoleContinuityEvidenceProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentConsoleContinuityEvidenceProjectionForCase(pharmacyCaseId) {
      const currentId = currentContinuityByCase.get(pharmacyCaseId);
      return currentId === undefined ? null : new StoredDocument(continuity.get(currentId)!);
    },
    async saveConsoleContinuityEvidenceProjection(snapshot, options) {
      saveWithCas(
        continuity,
        snapshot.pharmacyConsoleContinuityEvidenceProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentContinuityByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyConsoleContinuityEvidenceProjectionId,
      );
    },
    async getAssuranceProjection(pharmacyAssuranceProjectionId) {
      const snapshot = assurance.get(pharmacyAssuranceProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },
    async getCurrentAssuranceProjectionForCase(pharmacyCaseId) {
      const currentId = currentAssuranceByCase.get(pharmacyCaseId);
      return currentId === undefined ? null : new StoredDocument(assurance.get(currentId)!);
    },
    async saveAssuranceProjection(snapshot, options) {
      saveWithCas(
        assurance,
        snapshot.pharmacyAssuranceProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentAssuranceByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyAssuranceProjectionId);
    },
    async listConsoleAuditEventsForCase(pharmacyCaseId) {
      return (auditEvents.get(pharmacyCaseId) ?? []).map((snapshot) => new StoredDocument(snapshot));
    },
    async appendConsoleAuditEvent(snapshot) {
      const normalized = normalizeAudit(snapshot);
      const current = auditEvents.get(normalized.pharmacyCaseId) ?? [];
      auditEvents.set(normalized.pharmacyCaseId, [...current, normalized]);
    },
  };
}

function computeFreshness(input: {
  verifiedAt: string | null;
  staleAfterAt: string | null;
  hardStopAfterAt: string | null;
  trustState: InventoryTrustState;
  recordedAt: string;
}): {
  freshnessRatio: number | null;
  freshnessState: InventoryFreshnessState;
  hardStopReached: boolean;
} {
  if (
    input.verifiedAt === null ||
    input.staleAfterAt === null ||
    input.trustState === "missing"
  ) {
    return {
      freshnessRatio: null,
      freshnessState: "unavailable",
      hardStopReached:
        input.hardStopAfterAt !== null && Date.parse(input.recordedAt) >= Date.parse(input.hardStopAfterAt),
    };
  }
  const numerator = Date.parse(input.recordedAt) - Date.parse(input.verifiedAt);
  const denominator = Math.max(
    1,
    Date.parse(input.staleAfterAt) - Date.parse(input.verifiedAt),
  );
  const freshnessRatio = clamp(numerator / denominator, 0, 2);
  return {
    freshnessRatio,
    freshnessState:
      freshnessRatio < 0.67 ? "fresh" : freshnessRatio < 1 ? "aging" : "stale",
    hardStopReached:
      input.hardStopAfterAt !== null && Date.parse(input.recordedAt) >= Date.parse(input.hardStopAfterAt),
  };
}

function freshnessSeverity(state: InventoryFreshnessState): number {
  switch (state) {
    case "fresh":
      return 0;
    case "aging":
      return 1;
    case "stale":
      return 2;
    case "unavailable":
      return 3;
  }
}

function reservationStateFromRecord(record: InventorySupportRecordSnapshot): InventoryReservationState {
  if (record.availableQuantity <= 0) {
    return "unavailable";
  }
  if (record.reservedQuantity <= 0) {
    return "none";
  }
  if (record.reservedQuantity >= record.availableQuantity) {
    return "reserved";
  }
  return "partially_reserved";
}

function equivalenceRank(equivalenceClass: InventoryEquivalenceClass): number {
  switch (equivalenceClass) {
    case "exact":
      return 0;
    case "pack_variant":
      return 1;
    case "therapeutic_substitute":
      return 2;
    case "partial_supply":
      return 3;
    case "no_supply":
      return 4;
  }
}

function dominantFreshnessState(
  stockRecords: readonly InventoryTruthRecordProjection[],
): InventoryFreshnessState {
  if (stockRecords.length === 0) {
    return "unavailable";
  }
  return [...stockRecords]
    .sort((left, right) => freshnessSeverity(right.freshnessState) - freshnessSeverity(left.freshnessState))[0]!
    .freshnessState;
}

function buildAuditEvent(input: {
  pharmacyCaseId: string;
  lineItemRef: string | null;
  scopeKind: "case" | "line";
  eventName: string;
  payload: unknown;
  recordedAt: string;
}): PharmacyConsoleAuditEventSnapshot {
  const id = stableProjectionId("pharmacy_console_audit", {
    pharmacyCaseId: input.pharmacyCaseId,
    lineItemRef: input.lineItemRef,
    eventName: input.eventName,
    recordedAt: input.recordedAt,
    payload: input.payload,
  });
  return {
    pharmacyConsoleAuditEventId: id,
    pharmacyCaseId: input.pharmacyCaseId,
    lineItemRef: input.lineItemRef,
    scopeKind: input.scopeKind,
    eventName: input.eventName,
    payloadDigest: sha256Hex(stableStringify(input.payload)),
    recordedAt: input.recordedAt,
    version: 1,
  };
}

export function createInventoryTruthProjectionBuilder(): InventoryTruthProjectionBuilder {
  return {
    buildInventoryTruthProjection(input) {
      const stockRecords = input.stockRecords.map((record) => {
        const freshness = computeFreshness({
          verifiedAt: record.verifiedAt,
          staleAfterAt: record.staleAfterAt,
          hardStopAfterAt: record.hardStopAfterAt,
          trustState: record.trustState,
          recordedAt: input.recordedAt,
        });
        return {
          inventorySupportRecordRef: makeRef("InventorySupportRecord", record.inventorySupportRecordId, TASK_355),
          productIdentityRef: record.productIdentityRef,
          packBasisRef: record.packBasisRef,
          availableQuantity: record.availableQuantity,
          reservedQuantity: record.reservedQuantity,
          batchOrLotRef: record.batchOrLotRef,
          expiryBand: record.expiryBand,
          storageRequirementRef: record.storageRequirementRef,
          controlledStockFlag: record.controlledStockFlag,
          locationOrBinRef: record.locationOrBinRef,
          lastVerifiedAt: record.verifiedAt,
          freshnessState: freshness.freshnessState,
          freshnessConfidenceState: record.freshnessConfidenceState,
          quarantineFlag: record.quarantineFlag,
          supervisorHoldFlag: record.supervisorHoldFlag,
          hardStopReached: freshness.hardStopReached,
          trustState: record.trustState,
        } satisfies InventoryTruthRecordProjection;
      });
      return {
        inventoryTruthProjectionId: stableProjectionId("pharmacy_inventory_truth", {
          pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
          lineItemRef: input.lineState.lineItemRef,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
        lineItemRef: input.lineState.lineItemRef,
        stockRecords,
        dominantFreshnessState: dominantFreshnessState(stockRecords),
        hardStopReached: stockRecords.some((record) => record.hardStopReached),
        trustState:
          stockRecords.length === 0
            ? "missing"
            : stockRecords.every((record) => record.trustState === "verified")
              ? "verified"
              : stockRecords.some((record) => record.trustState === "governed_override")
                ? "governed_override"
                : "missing",
        computedAt: input.recordedAt,
        version: 1,
      };
    },
  };
}

export function createSupplyComputationService(): SupplyComputationService {
  return {
    computeSupply(input) {
      const selectedBaseUnits =
        input.stockRecord.selectedBaseUnits ??
        (input.stockRecord.selectedPackCount === null
          ? null
          : input.stockRecord.selectedPackCount * input.stockRecord.baseUnitsPerPack);
      const coverageRatio =
        selectedBaseUnits === null || input.lineState.prescribedBaseUnits <= 0
          ? null
          : selectedBaseUnits / input.lineState.prescribedBaseUnits;
      const remainingBaseUnits =
        selectedBaseUnits === null
          ? null
          : Math.max(input.lineState.prescribedBaseUnits - selectedBaseUnits, 0);
      const daysCovered =
        selectedBaseUnits === null ||
        input.lineState.dailyBaseUnits === null ||
        input.lineState.dailyBaseUnits <= 0
          ? null
          : Math.floor(selectedBaseUnits / input.lineState.dailyBaseUnits);
      const splitPackRemainderBaseUnits =
        selectedBaseUnits === null
          ? null
          : selectedBaseUnits % Math.max(1, input.stockRecord.baseUnitsPerPack);
      const computationState: SupplyComputationState =
        selectedBaseUnits === null
          ? "non_comparable"
          : coverageRatio === null
            ? "non_comparable"
            : coverageRatio === 1
              ? "exact"
              : coverageRatio < 1
                ? "short"
                : "excess";
      return normalizeSupplyComputation({
        supplyComputationId: stableProjectionId("pharmacy_supply_computation", {
          pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
          lineItemRef: input.lineState.lineItemRef,
          candidateRef: input.stockRecord.candidateRef,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
        lineItemRef: input.lineState.lineItemRef,
        candidateRef: input.stockRecord.candidateRef,
        baseUnit: input.lineState.baseUnit,
        prescribedBaseUnits: input.lineState.prescribedBaseUnits,
        dailyBaseUnits: input.lineState.dailyBaseUnits,
        selectedBaseUnits,
        coverageRatio,
        remainingBaseUnits,
        daysCovered,
        splitPackRemainderBaseUnits,
        substitutionEquivalenceClass: input.stockRecord.equivalenceClass,
        instructionDeltaRef: input.stockRecord.patientCommunicationDeltaRef,
        computationState,
        computedAt: input.recordedAt,
        version: 1,
      });
    },
  };
}

function candidateBlockingReasons(input: {
  record: InventorySupportRecordSnapshot;
  inventoryTruth: InventoryTruthProjectionSnapshot;
  supply: SupplyComputationSnapshot | null;
  activeFence: InventoryComparisonFenceSnapshot | null;
  lineState: PharmacyMedicationLineStateSnapshot;
}): string[] {
  const stock = input.inventoryTruth.stockRecords.find(
    (entry) => entry.inventorySupportRecordRef.refId === input.record.inventorySupportRecordId,
  );
  const freshnessState = stock?.freshnessState ?? "unavailable";
  const reasons: string[] = [];
  if (freshnessState === "stale" || freshnessState === "unavailable") {
    reasons.push("INVENTORY_FRESHNESS_BLOCKED");
  }
  if (stock?.hardStopReached) {
    reasons.push("INVENTORY_HARD_STOP_REACHED");
  }
  if (input.record.quarantineFlag) {
    reasons.push("INVENTORY_QUARANTINED");
  }
  if (input.record.supervisorHoldFlag) {
    reasons.push("SUPERVISOR_HOLD_ACTIVE");
  }
  if (input.record.substitutionPolicyState === "not_allowed") {
    reasons.push("SUBSTITUTION_NOT_ALLOWED");
  }
  if (input.supply === null || input.supply.computationState === "non_comparable") {
    reasons.push("SUPPLY_COMPUTATION_MISSING");
  }
  if (input.activeFence === null || input.activeFence.candidateRef !== input.record.candidateRef) {
    reasons.push("FENCE_NOT_ACTIVE");
  }
  if (
    input.record.patientCommunicationDeltaRef !== null &&
    !input.lineState.communicationPreviewed
  ) {
    reasons.push("PATIENT_COMMUNICATION_PREVIEW_MISSING");
  }
  return uniqueSorted(reasons);
}

export function createInventoryComparisonProjectionBuilder(
  supplyComputationService: SupplyComputationService = createSupplyComputationService(),
): InventoryComparisonProjectionBuilder {
  return {
    buildInventoryComparisonProjection(input) {
      const stockRows = input.stockRecords.map((record) => {
        const supply =
          input.supplyComputations.get(record.candidateRef) ??
          supplyComputationService.computeSupply({
            pharmacyCase: input.pharmacyCase,
            lineState: input.lineState,
            stockRecord: record,
            recordedAt: input.recordedAt,
          });
        const truthRow = input.inventoryTruth.stockRecords.find(
          (entry) => entry.inventorySupportRecordRef.refId === record.inventorySupportRecordId,
        );
        const blockingReasons = candidateBlockingReasons({
          record,
          inventoryTruth: input.inventoryTruth,
          supply,
          activeFence: input.activeFence,
          lineState: input.lineState,
        });
        return {
          candidateRef: record.candidateRef,
          lineItemRef: input.lineState.lineItemRef,
          equivalenceClass: record.equivalenceClass,
          inventoryTruthRef: makeRef(
            "InventoryTruthProjection",
            input.inventoryTruth.inventoryTruthProjectionId,
            TASK_355,
          ),
          freshnessState: truthRow?.freshnessState ?? "unavailable",
          expiryBand: record.expiryBand,
          packBasisRef: record.packBasisRef,
          selectedPackCount: record.selectedPackCount,
          selectedBaseUnits: supply.selectedBaseUnits,
          coverageRatio: supply.coverageRatio,
          remainingBaseUnits: supply.remainingBaseUnits,
          daysCovered: supply.daysCovered,
          substitutionPolicyState: record.substitutionPolicyState,
          approvalBurdenRef: record.approvalBurdenRef,
          patientCommunicationDeltaRef: record.patientCommunicationDeltaRef,
          handoffConsequenceRef: record.handoffConsequenceRef,
          reservationState: reservationStateFromRecord(record),
          rank: 0,
          rankReasonRef: `equivalence:${record.equivalenceClass}`,
          supplyComputationRef: makeRef("SupplyComputation", supply.supplyComputationId, TASK_355),
          commitReady: blockingReasons.length === 0,
          blockingReasonCodes: blockingReasons,
        } satisfies InventoryComparisonCandidateProjection;
      });
      const noSupplyCandidate: InventoryComparisonCandidateProjection = {
        candidateRef: `${input.lineState.lineItemRef}_no_supply`,
        lineItemRef: input.lineState.lineItemRef,
        equivalenceClass: "no_supply",
        inventoryTruthRef: makeRef(
          "InventoryTruthProjection",
          input.inventoryTruth.inventoryTruthProjectionId,
          TASK_355,
        ),
        freshnessState: input.inventoryTruth.dominantFreshnessState,
        expiryBand: "unknown",
        packBasisRef: input.lineState.packBasisRef,
        selectedPackCount: null,
        selectedBaseUnits: 0,
        coverageRatio: 0,
        remainingBaseUnits: input.lineState.prescribedBaseUnits,
        daysCovered: 0,
        substitutionPolicyState: "allowed",
        approvalBurdenRef: null,
        patientCommunicationDeltaRef: "patient.no_supply.explain_next_step",
        handoffConsequenceRef: "handoff.no_supply.return_or_escalate",
        reservationState: "none",
        rank: 0,
        rankReasonRef: "equivalence:no_supply",
        supplyComputationRef: null,
        commitReady: false,
        blockingReasonCodes: ["NO_SUPPLY_SELECTED"],
      };
      const candidateRows = [...stockRows, noSupplyCandidate]
        .sort((left, right) => {
          const leftCommit = left.commitReady ? 0 : 1;
          const rightCommit = right.commitReady ? 0 : 1;
          if (leftCommit !== rightCommit) {
            return leftCommit - rightCommit;
          }
          const leftEq = equivalenceRank(left.equivalenceClass);
          const rightEq = equivalenceRank(right.equivalenceClass);
          if (leftEq !== rightEq) {
            return leftEq - rightEq;
          }
          return (right.coverageRatio ?? -1) - (left.coverageRatio ?? -1);
        })
        .map((candidate, index) => ({
          ...candidate,
          rank: index + 1,
          rankReasonRef: `${candidate.rankReasonRef}.rank_${index + 1}`,
        }));
      const dominantCompareState =
        candidateRows.some((candidate) => candidate.commitReady)
          ? "ready"
          : candidateRows.some((candidate) => candidate.blockingReasonCodes.length > 0)
            ? "blocked"
            : "review_required";
      return {
        inventoryComparisonProjectionId: stableProjectionId("pharmacy_inventory_compare", {
          pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
          lineItemRef: input.lineState.lineItemRef,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
        lineItemRef: input.lineState.lineItemRef,
        inventoryTruthProjectionRef: makeRef(
          "InventoryTruthProjection",
          input.inventoryTruth.inventoryTruthProjectionId,
          TASK_355,
        ),
        activeFenceRef:
          input.activeFence === null
            ? null
            : makeRef("InventoryComparisonFence", input.activeFence.inventoryComparisonFenceId, TASK_355),
        preservedReadOnlyFenceRef:
          input.preservedFence === null
            ? null
            : makeRef(
                "InventoryComparisonFence",
                input.preservedFence.inventoryComparisonFenceId,
                TASK_355,
              ),
        dominantCompareState,
        candidateRows,
        blockingReasonCodes: uniqueSorted(
          candidateRows.flatMap((candidate) => candidate.blockingReasonCodes),
        ),
        computedAt: input.recordedAt,
        version: 1,
      };
    },
  };
}

export function createMedicationValidationProjectionBuilder(): MedicationValidationProjectionBuilder {
  return {
    buildMedicationValidationProjection(input) {
      const cards = input.lineStates.map((lineState) => {
        const inventoryProjection =
          input.inventoryTruth.find((entry) => entry.lineItemRef === lineState.lineItemRef) ?? null;
        invariant(
          inventoryProjection !== null,
          "INVENTORY_PROJECTION_REQUIRED",
          `Inventory projection missing for ${lineState.lineItemRef}.`,
        );
        const activeFence = input.activeFencesByLine.get(lineState.lineItemRef) ?? null;
        const supplyComputation = input.supplyByLine.get(lineState.lineItemRef) ?? null;
        const freshnessState = inventoryProjection.dominantFreshnessState;
        const blockingSignalCount =
          lineState.blockingSignalCodes.length +
          (freshnessState === "stale" || freshnessState === "unavailable" ? 1 : 0) +
          (inventoryProjection.hardStopReached ? 1 : 0);
        const reviewSignalCount =
          lineState.reviewSignalCodes.length + (freshnessState === "aging" ? 1 : 0);
        const settlementGateState = input.actionSettlementState;
        const derivedState: MedicationCheckpointDerivedState =
          lineState.currentLineState === "not_started"
            ? "not_started"
            : blockingSignalCount > 0 || settlementGateState === "blocked"
              ? "blocked"
              : lineState.overrideState === "supervisor_required"
                ? "supervisor_required"
                : reviewSignalCount > 0 || activeFence === null
                  ? "review_required"
                  : lineState.overrideState === "governed_resolved" ||
                      (lineState.currentLineState === "verified" &&
                        supplyComputation !== null &&
                        freshnessState !== "stale" &&
                        freshnessState !== "unavailable")
                    ? "verified"
                    : "in_review";
        const checkpointEvaluation: LineCheckpointEvaluationSnapshot = {
          lineCheckpointEvaluationId: stableProjectionId("pharmacy_line_checkpoint", {
            pharmacyCaseId: input.bundle.pharmacyCase.pharmacyCaseId,
            lineItemRef: lineState.lineItemRef,
          }),
          lineItemRef: lineState.lineItemRef,
          checkpointCode: "line_item_validation",
          requiredEvidenceRefs: lineState.verifiedEvidenceRefs,
          blockingSignalCount,
          reviewSignalCount,
          informationSignalCount: lineState.informationSignalCodes.length,
          freshnessState,
          overrideState: lineState.overrideState,
          settlementGateState,
          derivedState,
          derivedAt: input.recordedAt,
        };
        const dominantActionRef =
          derivedState === "blocked"
            ? "inventory.refresh_or_override"
            : derivedState === "review_required"
              ? "inventory.compare_and_bind_fence"
              : derivedState === "supervisor_required"
                ? "request_supervisor_cosign"
                : "line.ready";
        return {
          lineItemRef: lineState.lineItemRef,
          lineItemVersionRef: lineState.lineItemVersionRef,
          checkpointProjectionRef: makeRef(
            "MedicationValidationProjection",
            stableProjectionId("pharmacy_medication_validation", {
              pharmacyCaseId: input.bundle.pharmacyCase.pharmacyCaseId,
            }),
            TASK_355,
          ),
          inventoryTruthRef: makeRef(
            "InventoryTruthProjection",
            inventoryProjection.inventoryTruthProjectionId,
            TASK_355,
          ),
          policyBundleRef: lineState.policyBundleRef,
          supplyComputationRef:
            supplyComputation === null
              ? null
              : makeRef("SupplyComputation", supplyComputation.supplyComputationId, TASK_355),
          reviewSessionRef: lineState.reviewSessionRef,
          selectedStockAnchorRef: lineState.selectedCandidateRef,
          clarificationThreadRef: lineState.clarificationThreadRef,
          crossLineImpactDigestRef: lineState.crossLineImpactDigestRef,
          settlementDigestRef: sha256Hex(
            stableStringify({
              settlementGateState,
              activeFence: activeFence?.inventoryComparisonFenceId ?? null,
            }),
          ),
          dominantActionRef,
          checkpointEvaluation,
          renderedAt: input.recordedAt,
        } satisfies MedicationValidationCardProjection;
      });

      const rollupOrder: readonly MedicationCheckpointDerivedState[] = [
        "blocked",
        "supervisor_required",
        "review_required",
        "in_review",
        "verified",
        "not_started",
      ];
      const caseCheckpointRollup =
        rollupOrder.find((state) =>
          cards.some((card) => card.checkpointEvaluation.derivedState === state),
        ) ?? "not_started";
      return {
        medicationValidationProjectionId: stableProjectionId("pharmacy_medication_validation", {
          pharmacyCaseId: input.bundle.pharmacyCase.pharmacyCaseId,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", input.bundle.pharmacyCase.pharmacyCaseId, TASK_342),
        lineCards: cards,
        caseCheckpointRollup,
        computedAt: input.recordedAt,
        version: 1,
      };
    },
  };
}

export function createPharmacyConsoleContinuityEvidenceProjectionBuilder(): PharmacyConsoleContinuityEvidenceProjectionBuilder {
  return {
    buildConsoleContinuityEvidenceProjection(input) {
      if (input.continuityEvidence === null) {
        return {
          pharmacyConsoleContinuityEvidenceProjectionId: stableProjectionId(
            "pharmacy_console_continuity",
            { pharmacyCaseId: input.pharmacyCase.pharmacyCaseId },
          ),
          pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
          continuityEvidenceProjectionRef: null,
          validationState: "not_required",
          blockingRefs: [],
          pendingPosture: null,
          nextReviewAt: null,
          computedAt: input.recordedAt,
          version: 1,
        };
      }
      const validationState: PharmacyConsoleContinuityValidationState =
        input.continuityEvidence.pendingPosture === "recovery_required" ||
        input.continuityEvidence.pendingPosture === "likely_failed_pending"
          ? "blocked"
          : input.continuityEvidence.nextReviewAt !== null &&
              Date.parse(input.recordedAt) >= Date.parse(input.continuityEvidence.nextReviewAt)
            ? "stale"
            : "current";
      const blockingRefs =
        validationState === "blocked"
          ? [input.continuityEvidence.pharmacyContinuityEvidenceProjectionId]
          : [];
      return {
        pharmacyConsoleContinuityEvidenceProjectionId: stableProjectionId(
          "pharmacy_console_continuity",
          { pharmacyCaseId: input.pharmacyCase.pharmacyCaseId },
        ),
        pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
        continuityEvidenceProjectionRef: makeRef(
          "PharmacyContinuityEvidenceProjection",
          input.continuityEvidence.pharmacyContinuityEvidenceProjectionId,
          TASK_343,
        ),
        validationState,
        blockingRefs,
        pendingPosture: input.continuityEvidence.pendingPosture,
        nextReviewAt: input.continuityEvidence.nextReviewAt,
        computedAt: input.recordedAt,
        version: 1,
      };
    },
  };
}

export function createPharmacyActionSettlementProjectionBuilder(): PharmacyActionSettlementProjectionBuilder {
  return {
    buildActionSettlementProjection(input) {
      const latestTransition = [...input.bundle.transitionJournal]
        .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
        .at(-1) ?? null;
      const latestFenceEpoch = input.activeFences.reduce(
        (currentMax, fence) => Math.max(currentMax, fence.fenceEpoch),
        0,
      );
      const continuityBlocked = input.continuity.validationState === "blocked";
      const continuityStale = input.continuity.validationState === "stale";
      let canonicalSettlementType: PharmacyActionCanonicalSettlementType = "none";
      let canonicalSettlementRef: string | null = null;
      let agreementState: PharmacyActionSettlementAgreementState = "ready";
      const blockingReasonCodes: string[] = [];

      if (input.outcomeSettlement !== null || input.outcomeTruth !== null) {
        canonicalSettlementType = "outcome";
        canonicalSettlementRef = input.outcomeSettlement?.settlementId ?? null;
        if (
          input.outcomeTruth?.outcomeTruthState === "settled_resolved" &&
          input.outcomeTruth.outcomeReconciliationGateRef === null &&
          !continuityBlocked &&
          !continuityStale
        ) {
          agreementState = "converged";
        } else {
          agreementState = "blocked";
          blockingReasonCodes.push("OUTCOME_REVIEW_OR_GATE_ACTIVE");
        }
      } else if (input.dispatchSettlement !== null || input.dispatchTruth !== null) {
        canonicalSettlementType = "dispatch";
        canonicalSettlementRef = input.dispatchSettlement?.settlementId ?? null;
        if (
          input.dispatchTruth?.authoritativeProofState === "satisfied" &&
          !continuityBlocked &&
          !continuityStale
        ) {
          agreementState = "converged";
        } else {
          agreementState = "pending";
          blockingReasonCodes.push("DISPATCH_PROOF_PENDING");
        }
      }
      if (continuityBlocked) {
        blockingReasonCodes.push("CONTINUITY_BLOCKED");
        agreementState = "blocked";
      } else if (continuityStale && agreementState !== "blocked") {
        blockingReasonCodes.push("CONTINUITY_STALE");
        agreementState = canonicalSettlementType === "none" ? "ready" : "pending";
      }
      return {
        pharmacyActionSettlementProjectionId: stableProjectionId("pharmacy_action_settlement", {
          pharmacyCaseId: input.bundle.pharmacyCase.pharmacyCaseId,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", input.bundle.pharmacyCase.pharmacyCaseId, TASK_342),
        canonicalSettlementType,
        canonicalSettlementRef,
        mutationGateRef: latestTransition?.scopedMutationGateRef ?? null,
        fenceEpoch: latestFenceEpoch,
        agreementState,
        blockingReasonCodes: uniqueSorted(blockingReasonCodes),
        computedAt: input.recordedAt,
        version: 1,
      };
    },
  };
}

export function createPharmacyHandoffProjectionBuilder(): PharmacyHandoffProjectionBuilder {
  return {
    buildHandoffProjection(input) {
      const lineStates = input.lineCards.map((line) => line.checkpointEvaluation.derivedState);
      const allLinesVerified = lineStates.every(
        (state) => state === "verified" || state === "not_started",
      );
      const communicationPreviewState =
        input.lineCards.every(
          (line) =>
            !line.checkpointEvaluation.requiredEvidenceRefs.includes("patient_comm_preview") ||
            line.checkpointEvaluation.derivedState === "verified",
        )
          ? "previewed"
          : "missing";
      const inventoryFreshnessState = input.inventoryTruth
        .map((entry) => entry.dominantFreshnessState)
        .sort((left, right) => freshnessSeverity(right) - freshnessSeverity(left))[0] ?? "unavailable";
      const blockingReasonCodes = [
        ...(!allLinesVerified ? ["LINE_VERIFICATION_INCOMPLETE"] : []),
        ...(communicationPreviewState === "missing" ? ["PATIENT_COMMUNICATION_PREVIEW_MISSING"] : []),
        ...(inventoryFreshnessState === "stale" || inventoryFreshnessState === "unavailable"
          ? ["INVENTORY_FRESHNESS_BLOCKED"]
          : []),
        ...(input.actionSettlement.agreementState === "blocked" || input.actionSettlement.agreementState === "pending"
          ? ["ACTION_SETTLEMENT_UNRESOLVED"]
          : []),
        ...input.handoffWatch.blockerRefs.map(() => "HANDOFF_WATCH_BLOCKED"),
        ...input.bundle.pharmacyCase.currentClosureBlockerRefs.map(() => "CLOSURE_BLOCKER_ACTIVE"),
      ];
      const handoffReadinessState: PharmacyHandoffReadinessState =
        blockingReasonCodes.length === 0
          ? "verified"
          : blockingReasonCodes.every((reason) =>
                ["LINE_VERIFICATION_INCOMPLETE", "PATIENT_COMMUNICATION_PREVIEW_MISSING"].includes(
                  reason,
                ),
              )
            ? "review_required"
            : "not_ready";
      return {
        pharmacyHandoffProjectionId: stableProjectionId("pharmacy_handoff", {
          pharmacyCaseId: input.bundle.pharmacyCase.pharmacyCaseId,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", input.bundle.pharmacyCase.pharmacyCaseId, TASK_342),
        handoffReadinessState,
        inventoryFreshnessState,
        patientCommunicationPreviewState: communicationPreviewState,
        actionSettlementRef: makeRef(
          "PharmacyActionSettlementProjection",
          input.actionSettlement.pharmacyActionSettlementProjectionId,
          TASK_355,
        ),
        continuityEvidenceRef: makeRef(
          "PharmacyConsoleContinuityEvidenceProjection",
          input.continuity.pharmacyConsoleContinuityEvidenceProjectionId,
          TASK_355,
        ),
        handoffWatchProjectionRef: makeRef(
          "PharmacyHandoffWatchProjection",
          input.handoffWatch.pharmacyHandoffWatchProjectionId,
          TASK_355,
        ),
        blockingReasonCodes: uniqueSorted(blockingReasonCodes),
        computedAt: input.recordedAt,
        version: 1,
      };
    },
  };
}

export function createPharmacyAssuranceProjectionBuilder(): PharmacyAssuranceProjectionBuilder {
  return {
    buildAssuranceProjection(input) {
      const blockingReasonCodes: string[] = [];
      let assuranceState: PharmacyAssuranceState = "clear";
      if (
        input.consentCheckpoint !== null &&
        input.consentCheckpoint.checkpointState !== "satisfied"
      ) {
        assuranceState = "consent_blocked";
        blockingReasonCodes.push("CONSENT_CHECKPOINT_UNSATISFIED");
      }
      if (
        input.outcomeTruth !== null &&
        input.outcomeTruth.outcomeTruthState !== "settled_resolved"
      ) {
        assuranceState = "outcome_review";
        blockingReasonCodes.push("OUTCOME_REVIEW_ACTIVE");
      } else if (
        input.dispatchTruth !== null &&
        input.dispatchTruth.authoritativeProofState !== "satisfied"
      ) {
        assuranceState = "dispatch_pending";
        blockingReasonCodes.push("DISPATCH_CONFIRMATION_PENDING");
      }
      if (input.practiceVisibility?.currentCloseBlockerRefs.length) {
        assuranceState = "recovery_required";
        blockingReasonCodes.push("PRACTICE_VISIBILITY_CLOSE_BLOCKERS");
      }
      return {
        pharmacyAssuranceProjectionId: stableProjectionId("pharmacy_assurance", {
          pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
        choiceTruthProjectionRef:
          input.choiceTruth === null
            ? null
            : makeRef(
                "PharmacyChoiceTruthProjection",
                input.choiceTruth.pharmacyChoiceTruthProjectionId,
                TASK_343,
              ),
        dispatchTruthProjectionRef:
          input.dispatchTruth === null
            ? null
            : makeRef(
                "PharmacyDispatchTruthProjection",
                input.dispatchTruth.pharmacyDispatchTruthProjectionId,
                TASK_343,
              ),
        outcomeTruthProjectionRef:
          input.outcomeTruth === null
            ? null
            : makeRef(
                "PharmacyOutcomeTruthProjection",
                input.outcomeTruth.pharmacyOutcomeTruthProjectionId,
                TASK_351,
              ),
        consentCheckpointProjectionRef:
          input.consentCheckpoint === null
            ? null
            : makeRef(
                "PharmacyConsentCheckpointProjection",
                input.consentCheckpoint.pharmacyConsentCheckpointId,
                TASK_355,
              ),
        practiceVisibilityProjectionRef:
          input.practiceVisibility === null
            ? null
            : makeRef(
                "PharmacyPracticeVisibilityProjection",
                input.practiceVisibility.pharmacyPracticeVisibilityProjectionId,
                TASK_353,
              ),
        assuranceState,
        blockingReasonCodes: uniqueSorted(blockingReasonCodes),
        currentRecoveryOwnerRef:
          input.practiceVisibility?.currentCloseBlockerRefs[0] ??
          input.dispatchTruth?.dispatchAttemptRef.refId ??
          null,
        computedAt: input.recordedAt,
        version: 1,
      };
    },
  };
}

export function createPharmacyConsoleSummaryProjectionBuilder(): PharmacyConsoleSummaryProjectionBuilder {
  return {
    buildSummaryProjection(input) {
      return {
        pharmacyConsoleSummaryProjectionId: stableProjectionId("pharmacy_console_summary", {
          pharmacyCaseId: input.bundle.pharmacyCase.pharmacyCaseId,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", input.bundle.pharmacyCase.pharmacyCaseId, TASK_342),
        lineItemCount: input.lineCards.length,
        verifiedLineCount: input.lineCards.filter(
          (line) => line.checkpointEvaluation.derivedState === "verified",
        ).length,
        reviewRequiredLineCount: input.lineCards.filter((line) =>
          ["review_required", "in_review"].includes(line.checkpointEvaluation.derivedState),
        ).length,
        blockedLineCount: input.lineCards.filter((line) =>
          ["blocked", "supervisor_required"].includes(line.checkpointEvaluation.derivedState),
        ).length,
        activeFenceCount: input.activeFences.filter((fence) => fence.fenceState === "active").length,
        staleInventoryLineCount: input.inventoryTruth.filter((entry) =>
          ["stale", "unavailable"].includes(entry.dominantFreshnessState),
        ).length,
        dominantPromotedRegion: input.mission.dominantPromotedRegion,
        handoffReadinessState: input.handoff.handoffReadinessState,
        actionSettlementState: input.actionSettlement.agreementState,
        continuityValidationState: input.continuity.validationState,
        assuranceState: input.assurance.assuranceState,
        computedAt: input.recordedAt,
        version: 1,
      };
    },
  };
}

export function createPharmacyConsoleWorklistProjectionBuilder(): PharmacyConsoleWorklistProjectionBuilder {
  return {
    buildWorklistProjection(input) {
      const blockingReasonCodes = [
        ...(input.summary.blockedLineCount > 0 ? ["LINE_BLOCKERS_ACTIVE"] : []),
        ...(input.summary.staleInventoryLineCount > 0 ? ["STALE_INVENTORY_PRESENT"] : []),
        ...(input.summary.actionSettlementState === "blocked" ||
        input.summary.actionSettlementState === "pending"
          ? ["SETTLEMENT_NOT_CONVERGED"]
          : []),
        ...(input.summary.continuityValidationState === "blocked" ||
        input.summary.continuityValidationState === "stale"
          ? ["CONTINUITY_NOT_CURRENT"]
          : []),
      ];
      return {
        pharmacyConsoleWorklistProjectionId: stableProjectionId("pharmacy_console_worklist", {
          pharmacyCaseId: input.bundle.pharmacyCase.pharmacyCaseId,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", input.bundle.pharmacyCase.pharmacyCaseId, TASK_342),
        caseStatus: input.bundle.pharmacyCase.status,
        supportRegionState: input.summary.dominantPromotedRegion,
        inventoryFreshnessState:
          input.summary.staleInventoryLineCount > 0 ? "stale" : "fresh",
        handoffReadinessState: input.summary.handoffReadinessState,
        actionSettlementState: input.summary.actionSettlementState,
        continuityValidationState: input.summary.continuityValidationState,
        assuranceState: input.summary.assuranceState,
        blockingReasonCodes: uniqueSorted(blockingReasonCodes),
        computedAt: input.recordedAt,
        version: 1,
      };
    },
  };
}

export function createPharmacyCaseWorkbenchProjectionBuilder(): PharmacyCaseWorkbenchProjectionBuilder {
  return {
    buildWorkbenchProjection(input) {
      return {
        pharmacyCaseWorkbenchProjectionId: stableProjectionId("pharmacy_case_workbench", {
          pharmacyCaseId: input.bundle.pharmacyCase.pharmacyCaseId,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", input.bundle.pharmacyCase.pharmacyCaseId, TASK_342),
        summaryProjectionRef: makeRef(
          "PharmacyConsoleSummaryProjection",
          input.summary.pharmacyConsoleSummaryProjectionId,
          TASK_355,
        ),
        missionProjectionRef: makeRef(
          "PharmacyMissionProjection",
          input.mission.pharmacyMissionProjectionId,
          TASK_355,
        ),
        medicationValidationProjectionRef: makeRef(
          "MedicationValidationProjection",
          input.medicationValidation.medicationValidationProjectionId,
          TASK_355,
        ),
        inventoryTruthProjectionRefs: input.inventoryTruth.map((entry) =>
          makeRef("InventoryTruthProjection", entry.inventoryTruthProjectionId, TASK_355),
        ),
        inventoryComparisonProjectionRefs: input.inventoryComparison.map((entry) =>
          makeRef("InventoryComparisonProjection", entry.inventoryComparisonProjectionId, TASK_355),
        ),
        handoffProjectionRef: makeRef(
          "PharmacyHandoffProjection",
          input.handoff.pharmacyHandoffProjectionId,
          TASK_355,
        ),
        handoffWatchProjectionRef: makeRef(
          "PharmacyHandoffWatchProjection",
          input.handoffWatch.pharmacyHandoffWatchProjectionId,
          TASK_355,
        ),
        actionSettlementProjectionRef: makeRef(
          "PharmacyActionSettlementProjection",
          input.actionSettlement.pharmacyActionSettlementProjectionId,
          TASK_355,
        ),
        consoleContinuityEvidenceProjectionRef: makeRef(
          "PharmacyConsoleContinuityEvidenceProjection",
          input.continuity.pharmacyConsoleContinuityEvidenceProjectionId,
          TASK_355,
        ),
        assuranceProjectionRef: makeRef(
          "PharmacyAssuranceProjection",
          input.assurance.pharmacyAssuranceProjectionId,
          TASK_355,
        ),
        choiceTruthProjectionRef:
          input.choiceTruth === null
            ? null
            : makeRef(
                "PharmacyChoiceTruthProjection",
                input.choiceTruth.pharmacyChoiceTruthProjectionId,
                TASK_343,
              ),
        dispatchTruthProjectionRef:
          input.dispatchTruth === null
            ? null
            : makeRef(
                "PharmacyDispatchTruthProjection",
                input.dispatchTruth.pharmacyDispatchTruthProjectionId,
                TASK_343,
              ),
        outcomeTruthProjectionRef:
          input.outcomeTruth === null
            ? null
            : makeRef(
                "PharmacyOutcomeTruthProjection",
                input.outcomeTruth.pharmacyOutcomeTruthProjectionId,
                TASK_351,
              ),
        consentCheckpointProjectionRef:
          input.consentCheckpoint === null
            ? null
            : makeRef(
                "PharmacyConsentCheckpointProjection",
                input.consentCheckpoint.pharmacyConsentCheckpointId,
                TASK_355,
              ),
        computedAt: input.recordedAt,
        version: 1,
      };
    },
  };
}

function buildFenceDigests(input: {
  record: InventorySupportRecordSnapshot;
  candidateSetDigest: string;
}): {
  policyBundleDigest: string;
  availabilityDigest: string;
  expiryDigest: string;
  quarantineDigest: string;
  supervisorRequirementDigest: string;
  missionScopeDigest: string;
  continuityScopeDigest: string;
  candidateSetDigest: string;
} {
  return {
    policyBundleDigest: input.record.policyBundleDigest,
    availabilityDigest: sha256Hex(
      stableStringify({
        availableQuantity: input.record.availableQuantity,
        reservedQuantity: input.record.reservedQuantity,
        batchOrLotRef: input.record.batchOrLotRef,
      }),
    ),
    expiryDigest: sha256Hex(
      stableStringify({
        expiryBand: input.record.expiryBand,
        verifiedAt: input.record.verifiedAt,
        staleAfterAt: input.record.staleAfterAt,
        hardStopAfterAt: input.record.hardStopAfterAt,
      }),
    ),
    quarantineDigest: sha256Hex(
      stableStringify({
        quarantineFlag: input.record.quarantineFlag,
      }),
    ),
    supervisorRequirementDigest: sha256Hex(
      stableStringify({
        supervisorHoldFlag: input.record.supervisorHoldFlag,
        substitutionPolicyState: input.record.substitutionPolicyState,
      }),
    ),
    missionScopeDigest: input.record.missionScopeDigest,
    continuityScopeDigest: input.record.continuityScopeDigest,
    candidateSetDigest: input.candidateSetDigest,
  };
}

function buildCandidateSetDigestFromRecords(
  stockRecords: readonly InventorySupportRecordSnapshot[],
): string {
  return sha256Hex(
    stableStringify(
      stockRecords.map((row) => ({
        candidateRef: row.candidateRef,
        availableQuantity: row.availableQuantity,
        reservedQuantity: row.reservedQuantity,
        expiryBand: row.expiryBand,
        quarantineFlag: row.quarantineFlag,
        supervisorHoldFlag: row.supervisorHoldFlag,
        substitutionPolicyState: row.substitutionPolicyState,
        missionScopeDigest: row.missionScopeDigest,
        continuityScopeDigest: row.continuityScopeDigest,
      })),
    ),
  );
}

function fenceDriftReason(input: {
  currentFence: InventoryComparisonFenceSnapshot;
  digests: ReturnType<typeof buildFenceDigests>;
}): string | null {
  if (input.currentFence.availabilityDigest !== input.digests.availabilityDigest) {
    return "AVAILABILITY_DRIFT";
  }
  if (input.currentFence.expiryDigest !== input.digests.expiryDigest) {
    return "EXPIRY_DRIFT";
  }
  if (input.currentFence.quarantineDigest !== input.digests.quarantineDigest) {
    return "QUARANTINE_DRIFT";
  }
  if (
    input.currentFence.supervisorRequirementDigest !== input.digests.supervisorRequirementDigest
  ) {
    return "SUPERVISOR_REQUIREMENT_DRIFT";
  }
  if (input.currentFence.missionScopeDigest !== input.digests.missionScopeDigest) {
    return "MISSION_SCOPE_DRIFT";
  }
  if (input.currentFence.continuityScopeDigest !== input.digests.continuityScopeDigest) {
    return "CONTINUITY_SCOPE_DRIFT";
  }
  if (input.currentFence.candidateSetDigest !== input.digests.candidateSetDigest) {
    return "CANDIDATE_SET_DRIFT";
  }
  return null;
}

interface ConsoleCaseContext {
  bundle: PharmacyCaseBundle;
  choiceTruth: PharmacyChoiceTruthProjection | null;
  consentCheckpoint: PharmacyConsentCheckpoint | null;
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
  dispatchSettlement: PharmacyDispatchSettlementSnapshot | null;
  continuityEvidence: PharmacyContinuityEvidenceProjectionSnapshot | null;
  outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot | null;
  outcomeSettlement: PharmacyOutcomeSettlementSnapshot | null;
  patientStatus: PharmacyPatientStatusProjectionSnapshot | null;
  practiceVisibility: PharmacyPracticeVisibilityProjectionSnapshot | null;
  lineStates: readonly PharmacyMedicationLineStateSnapshot[];
  stockByLine: ReadonlyMap<string, readonly InventorySupportRecordSnapshot[]>;
}

async function loadConsoleCaseContext(input: {
  pharmacyCaseId: string;
  repositories: Phase6PharmacyConsoleRepositories;
  caseKernelService: Phase6PharmacyCaseKernelService;
  directoryRepositories: Phase6PharmacyDirectoryChoiceRepositories;
  dispatchRepositories: Phase6PharmacyDispatchRepositories;
  outcomeRepositories: Phase6PharmacyOutcomeRepositories;
  patientStatusRepositories: Phase6PharmacyPatientStatusRepositories;
  bounceBackRepositories: Phase6PharmacyBounceBackRepositories;
}): Promise<ConsoleCaseContext | null> {
  const bundle = await input.caseKernelService.getPharmacyCase(input.pharmacyCaseId);
  if (bundle === null || bundle.pharmacyCase.status === "closed") {
    return null;
  }
  const [
    choiceTruth,
    consentCheckpoint,
    dispatchTruth,
    dispatchSettlement,
    continuityEvidence,
    outcomeTruth,
    outcomeSettlement,
    patientStatus,
    practiceVisibility,
    lineStates,
    stockRecords,
  ] = await Promise.all([
    input.directoryRepositories.getLatestChoiceTruthProjectionForCase(input.pharmacyCaseId),
    input.directoryRepositories.getLatestConsentCheckpointForCase(input.pharmacyCaseId),
    input.dispatchRepositories.getCurrentDispatchTruthProjectionForCase(input.pharmacyCaseId),
    input.dispatchRepositories.getCurrentDispatchSettlementForCase(input.pharmacyCaseId),
    input.dispatchRepositories.getCurrentContinuityEvidenceProjectionForCase(input.pharmacyCaseId),
    input.outcomeRepositories.getCurrentOutcomeTruthProjectionForCase(input.pharmacyCaseId),
    input.outcomeRepositories.getCurrentOutcomeSettlementForCase(input.pharmacyCaseId),
    input.patientStatusRepositories.getCurrentPatientStatusProjectionForCase(input.pharmacyCaseId),
    input.bounceBackRepositories.getCurrentPracticeVisibilityProjectionForCase(input.pharmacyCaseId),
    input.repositories.listMedicationLineStatesForCase(input.pharmacyCaseId),
    input.repositories.listInventorySupportRecordsForCase(input.pharmacyCaseId),
  ]);

  const stockByLine = new Map<string, InventorySupportRecordSnapshot[]>();
  for (const row of stockRecords.map((entry) => entry.toSnapshot())) {
    const current = stockByLine.get(row.lineItemRef) ?? [];
    stockByLine.set(row.lineItemRef, [...current, row]);
  }

  return {
    bundle,
    choiceTruth: choiceTruth?.toSnapshot() ?? null,
    consentCheckpoint: consentCheckpoint?.toSnapshot() ?? null,
    dispatchTruth: dispatchTruth?.toSnapshot() ?? null,
    dispatchSettlement: dispatchSettlement?.toSnapshot() ?? null,
    continuityEvidence: continuityEvidence?.toSnapshot() ?? null,
    outcomeTruth: outcomeTruth?.toSnapshot() ?? null,
    outcomeSettlement: outcomeSettlement?.toSnapshot() ?? null,
    patientStatus: patientStatus?.toSnapshot() ?? null,
    practiceVisibility: practiceVisibility?.toSnapshot() ?? null,
    lineStates: lineStates.map((entry) => entry.toSnapshot()),
    stockByLine,
  };
}

export interface Phase6PharmacyConsoleBackendServiceDependencies {
  repositories?: Phase6PharmacyConsoleStore;
  caseKernelService?: Phase6PharmacyCaseKernelService;
  directoryRepositories?: Phase6PharmacyDirectoryChoiceRepositories;
  dispatchRepositories?: Phase6PharmacyDispatchRepositories;
  outcomeRepositories?: Phase6PharmacyOutcomeRepositories;
  patientStatusRepositories?: Phase6PharmacyPatientStatusRepositories;
  bounceBackRepositories?: Phase6PharmacyBounceBackRepositories;
  summaryProjectionBuilder?: PharmacyConsoleSummaryProjectionBuilder;
  worklistProjectionBuilder?: PharmacyConsoleWorklistProjectionBuilder;
  caseWorkbenchProjectionBuilder?: PharmacyCaseWorkbenchProjectionBuilder;
  medicationValidationProjectionBuilder?: MedicationValidationProjectionBuilder;
  inventoryTruthProjectionBuilder?: InventoryTruthProjectionBuilder;
  inventoryComparisonProjectionBuilder?: InventoryComparisonProjectionBuilder;
  inventoryComparisonFenceService?: InventoryComparisonFenceService;
  supplyComputationService?: SupplyComputationService;
  handoffProjectionBuilder?: PharmacyHandoffProjectionBuilder;
  actionSettlementProjectionBuilder?: PharmacyActionSettlementProjectionBuilder;
  consoleContinuityEvidenceProjectionBuilder?: PharmacyConsoleContinuityEvidenceProjectionBuilder;
  assuranceProjectionBuilder?: PharmacyAssuranceProjectionBuilder;
}

export interface Phase6PharmacyConsoleBackendService {
  readonly repositories: Phase6PharmacyConsoleStore;
  refreshConsoleCase(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyCaseWorkbenchProjectionSnapshot | null>;
  fetchConsoleSummaryProjection(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyConsoleSummaryProjectionSnapshot | null>;
  fetchConsoleWorklist(
    input?: {
      recordedAt?: string;
      supportRegionState?: PharmacyConsoleSupportRegion;
      handoffReadinessState?: PharmacyHandoffReadinessState;
      inventoryFreshnessState?: InventoryFreshnessState;
    },
  ): Promise<readonly PharmacyConsoleWorklistProjectionSnapshot[]>;
  fetchCaseWorkbenchProjection(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyCaseWorkbenchProjectionSnapshot | null>;
  fetchMissionProjection(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyMissionProjectionSnapshot | null>;
  fetchMedicationValidationProjection(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<MedicationValidationProjectionSnapshot | null>;
  fetchInventoryTruthProjection(
    pharmacyCaseId: string,
    lineItemRef: string,
    input?: { recordedAt?: string },
  ): Promise<InventoryTruthProjectionSnapshot | null>;
  fetchInventoryComparisonProjection(
    pharmacyCaseId: string,
    lineItemRef: string,
    input?: { recordedAt?: string },
  ): Promise<InventoryComparisonProjectionSnapshot | null>;
  createInventoryComparisonFence(
    input: {
      pharmacyCaseId: string;
      lineItemRef: string;
      candidateRef: string;
      actorRef?: string | null;
      idempotencyKey?: string | null;
      recordedAt?: string;
    },
  ): Promise<InventoryComparisonFenceSnapshot>;
  refreshInventoryComparisonFence(
    input: {
      pharmacyCaseId: string;
      lineItemRef: string;
      recordedAt?: string;
    },
  ): Promise<InventoryComparisonFenceSnapshot | null>;
  invalidateInventoryComparisonFence(
    input: {
      inventoryComparisonFenceId: string;
      recordedAt?: string;
      reasonCode: string;
    },
  ): Promise<InventoryComparisonFenceSnapshot | null>;
  fetchSupplyComputation(
    pharmacyCaseId: string,
    lineItemRef: string,
    candidateRef: string,
    input?: { recordedAt?: string },
  ): Promise<SupplyComputationSnapshot | null>;
  fetchHandoffProjection(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyHandoffProjectionSnapshot | null>;
  fetchHandoffWatchProjection(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyHandoffWatchProjectionSnapshot | null>;
  fetchActionSettlementProjection(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyActionSettlementProjectionSnapshot | null>;
  fetchConsoleContinuityEvidenceProjection(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyConsoleContinuityEvidenceProjectionSnapshot | null>;
  fetchAssuranceProjection(
    pharmacyCaseId: string,
    input?: { recordedAt?: string },
  ): Promise<PharmacyAssuranceProjectionSnapshot | null>;
  fetchChoiceTruthProjection(pharmacyCaseId: string): Promise<PharmacyChoiceTruthProjection | null>;
  fetchDispatchTruthProjection(
    pharmacyCaseId: string,
  ): Promise<PharmacyDispatchTruthProjectionSnapshot | null>;
  fetchOutcomeTruthProjection(
    pharmacyCaseId: string,
  ): Promise<PharmacyOutcomeTruthProjectionSnapshot | null>;
  fetchConsentCheckpointProjection(
    pharmacyCaseId: string,
  ): Promise<PharmacyConsentCheckpoint | null>;
}

export function createPhase6PharmacyConsoleBackendService(
  input: Phase6PharmacyConsoleBackendServiceDependencies = {},
): Phase6PharmacyConsoleBackendService {
  const repositories = input.repositories ?? createPhase6PharmacyConsoleStore();
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

  const supplyComputationService =
    input.supplyComputationService ?? createSupplyComputationService();
  const inventoryTruthProjectionBuilder =
    input.inventoryTruthProjectionBuilder ?? createInventoryTruthProjectionBuilder();
  const inventoryComparisonProjectionBuilder =
    input.inventoryComparisonProjectionBuilder ??
    createInventoryComparisonProjectionBuilder(supplyComputationService);
  const medicationValidationProjectionBuilder =
    input.medicationValidationProjectionBuilder ?? createMedicationValidationProjectionBuilder();
  const continuityProjectionBuilder =
    input.consoleContinuityEvidenceProjectionBuilder ??
    createPharmacyConsoleContinuityEvidenceProjectionBuilder();
  const actionSettlementProjectionBuilder =
    input.actionSettlementProjectionBuilder ?? createPharmacyActionSettlementProjectionBuilder();
  const assuranceProjectionBuilder =
    input.assuranceProjectionBuilder ?? createPharmacyAssuranceProjectionBuilder();
  const handoffProjectionBuilder =
    input.handoffProjectionBuilder ?? createPharmacyHandoffProjectionBuilder();
  const summaryProjectionBuilder =
    input.summaryProjectionBuilder ?? createPharmacyConsoleSummaryProjectionBuilder();
  const worklistProjectionBuilder =
    input.worklistProjectionBuilder ?? createPharmacyConsoleWorklistProjectionBuilder();
  const caseWorkbenchProjectionBuilder =
    input.caseWorkbenchProjectionBuilder ?? createPharmacyCaseWorkbenchProjectionBuilder();

  async function persistProjection<T extends { version: number }>(
    current: T | null,
    candidate: T,
    save: (snapshot: T, options?: CompareAndSetWriteOptions) => Promise<void>,
    auditInput: {
      pharmacyCaseId: string;
      lineItemRef?: string | null;
      eventName: string;
      scopeKind: "case" | "line";
    },
  ): Promise<T> {
    if (current === null) {
      await save(candidate);
      await repositories.appendConsoleAuditEvent(
        buildAuditEvent({
          pharmacyCaseId: auditInput.pharmacyCaseId,
          lineItemRef: auditInput.lineItemRef ?? null,
          scopeKind: auditInput.scopeKind,
          eventName: `${auditInput.eventName}.created`,
          payload: candidate,
          recordedAt:
            "computedAt" in candidate &&
            typeof (candidate as { computedAt?: string }).computedAt === "string"
              ? (candidate as { computedAt: string }).computedAt
              : new Date().toISOString(),
        }),
      );
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
    await save(next, { expectedVersion: current.version });
    await repositories.appendConsoleAuditEvent(
      buildAuditEvent({
        pharmacyCaseId: auditInput.pharmacyCaseId,
        lineItemRef: auditInput.lineItemRef ?? null,
        scopeKind: auditInput.scopeKind,
        eventName: `${auditInput.eventName}.updated`,
        payload: {
          previous: current,
          next,
        },
        recordedAt:
          "computedAt" in next &&
          typeof (next as { computedAt?: string }).computedAt === "string"
            ? (next as { computedAt: string }).computedAt
            : new Date().toISOString(),
      }),
    );
    return next;
  }

  async function refreshCaseInternal(
    pharmacyCaseId: string,
    recordedAt: string,
  ): Promise<PharmacyCaseWorkbenchProjectionSnapshot | null> {
    const context = await loadConsoleCaseContext({
      pharmacyCaseId,
      repositories,
      caseKernelService,
      directoryRepositories,
      dispatchRepositories,
      outcomeRepositories,
      patientStatusRepositories,
      bounceBackRepositories,
    });
    if (context === null) {
      return null;
    }

    const inventoryTruthRows: InventoryTruthProjectionSnapshot[] = [];
    const supplyByLine = new Map<string, SupplyComputationSnapshot | null>();
    const supplyByLineCandidate = new Map<string, SupplyComputationSnapshot>();
    const activeFences: InventoryComparisonFenceSnapshot[] = [];
    const activeFenceByLine = new Map<string, InventoryComparisonFenceSnapshot | null>();
    const preservedFenceByLine = new Map<string, InventoryComparisonFenceSnapshot | null>();

    for (const lineState of context.lineStates) {
      const stockRecords = context.stockByLine.get(lineState.lineItemRef) ?? [];
      const inventoryTruth = inventoryTruthProjectionBuilder.buildInventoryTruthProjection({
        pharmacyCase: context.bundle.pharmacyCase,
        lineState,
        stockRecords,
        recordedAt,
      });
      const currentInventoryTruth =
        (
          await repositories.getCurrentInventoryTruthProjectionForLine(
            pharmacyCaseId,
            lineState.lineItemRef,
          )
        )?.toSnapshot() ?? null;
      const persistedInventoryTruth = await persistProjection(
        currentInventoryTruth,
        inventoryTruth,
        (snapshot, options) => repositories.saveInventoryTruthProjection(snapshot, options),
        {
          pharmacyCaseId,
          lineItemRef: lineState.lineItemRef,
          eventName: "inventory_truth",
          scopeKind: "line",
        },
      );
      inventoryTruthRows.push(persistedInventoryTruth);

      for (const stockRecord of stockRecords) {
        const computed = supplyComputationService.computeSupply({
          pharmacyCase: context.bundle.pharmacyCase,
          lineState,
          stockRecord,
          recordedAt,
        });
        const currentSupply =
          (
            await repositories.getCurrentSupplyComputationForCandidate(
              pharmacyCaseId,
              lineState.lineItemRef,
              stockRecord.candidateRef,
            )
          )?.toSnapshot() ?? null;
        const persistedSupply = await persistProjection(
          currentSupply,
          computed,
          (snapshot, options) => repositories.saveSupplyComputation(snapshot, options),
          {
            pharmacyCaseId,
            lineItemRef: lineState.lineItemRef,
            eventName: "supply_computation",
            scopeKind: "line",
          },
        );
        supplyByLineCandidate.set(stockRecord.candidateRef, persistedSupply);
      }
      const selectedCandidateRef = lineState.selectedCandidateRef ?? stockRecords[0]?.candidateRef ?? null;
      supplyByLine.set(
        lineState.lineItemRef,
        selectedCandidateRef === null ? null : supplyByLineCandidate.get(selectedCandidateRef) ?? null,
      );

      const currentFence =
        (
          await repositories.getCurrentInventoryComparisonFenceForLine(
            pharmacyCaseId,
            lineState.lineItemRef,
          )
        )?.toSnapshot() ?? null;
      if (currentFence !== null) {
        const boundRecord = stockRecords.find((row) => row.candidateRef === currentFence.candidateRef);
        if (boundRecord === undefined) {
          const invalidated = {
            ...currentFence,
            fenceState: "invalidated" as const,
            invalidatedReasonCode: "CANDIDATE_MISSING",
            invalidatedAt: recordedAt,
            refreshedAt: recordedAt,
            version: nextVersion(currentFence.version),
          };
          await repositories.saveInventoryComparisonFence(invalidated, {
            expectedVersion: currentFence.version,
          });
          preservedFenceByLine.set(lineState.lineItemRef, invalidated);
          activeFenceByLine.set(lineState.lineItemRef, null);
        } else {
          const candidateSetDigest = buildCandidateSetDigestFromRecords(stockRecords);
          const digests = buildFenceDigests({
            record: boundRecord,
            candidateSetDigest,
          });
          const driftReason = fenceDriftReason({
            currentFence,
            digests,
          });
          if (driftReason !== null || currentFence.fenceState !== "active") {
            const invalidated = {
              ...currentFence,
              fenceState: "invalidated" as const,
              invalidatedReasonCode: driftReason ?? currentFence.invalidatedReasonCode ?? "FENCE_NOT_ACTIVE",
              invalidatedAt: recordedAt,
              refreshedAt: recordedAt,
              version: nextVersion(currentFence.version),
            };
            await repositories.saveInventoryComparisonFence(invalidated, {
              expectedVersion: currentFence.version,
            });
            preservedFenceByLine.set(lineState.lineItemRef, invalidated);
            activeFenceByLine.set(lineState.lineItemRef, null);
          } else {
            activeFences.push(currentFence);
            activeFenceByLine.set(lineState.lineItemRef, currentFence);
            preservedFenceByLine.set(lineState.lineItemRef, null);
          }
        }
      } else {
        activeFenceByLine.set(lineState.lineItemRef, null);
        preservedFenceByLine.set(lineState.lineItemRef, null);
      }
    }

    const continuity = continuityProjectionBuilder.buildConsoleContinuityEvidenceProjection({
      pharmacyCase: context.bundle.pharmacyCase,
      continuityEvidence: context.continuityEvidence,
      recordedAt,
    });
    const currentContinuity =
      (await repositories.getCurrentConsoleContinuityEvidenceProjectionForCase(pharmacyCaseId))?.toSnapshot() ??
      null;
    const persistedContinuity = await persistProjection(
      currentContinuity,
      continuity,
      (snapshot, options) => repositories.saveConsoleContinuityEvidenceProjection(snapshot, options),
      {
        pharmacyCaseId,
        eventName: "console_continuity",
        scopeKind: "case",
      },
    );

    const actionSettlement = actionSettlementProjectionBuilder.buildActionSettlementProjection({
      bundle: context.bundle,
      dispatchSettlement: context.dispatchSettlement,
      dispatchTruth: context.dispatchTruth,
      outcomeSettlement: context.outcomeSettlement,
      outcomeTruth: context.outcomeTruth,
      continuity: persistedContinuity,
      activeFences,
      recordedAt,
    });
    const currentActionSettlement =
      (await repositories.getCurrentActionSettlementProjectionForCase(pharmacyCaseId))?.toSnapshot() ??
      null;
    const persistedActionSettlement = await persistProjection(
      currentActionSettlement,
      actionSettlement,
      (snapshot, options) => repositories.saveActionSettlementProjection(snapshot, options),
      {
        pharmacyCaseId,
        eventName: "action_settlement",
        scopeKind: "case",
      },
    );

    const medicationValidation = medicationValidationProjectionBuilder.buildMedicationValidationProjection({
      bundle: context.bundle,
      lineStates: context.lineStates,
      inventoryTruth: inventoryTruthRows,
      activeFencesByLine: activeFenceByLine,
      supplyByLine,
      actionSettlementState: persistedActionSettlement.agreementState,
      recordedAt,
    });
    const currentMedicationValidation =
      (await repositories.getCurrentMedicationValidationProjectionForCase(pharmacyCaseId))?.toSnapshot() ??
      null;
    const persistedMedicationValidation = await persistProjection(
      currentMedicationValidation,
      medicationValidation,
      (snapshot, options) => repositories.saveMedicationValidationProjection(snapshot, options),
      {
        pharmacyCaseId,
        eventName: "medication_validation",
        scopeKind: "case",
      },
    );

    const inventoryComparisonRows: InventoryComparisonProjectionSnapshot[] = [];
    for (const lineState of context.lineStates) {
      const inventoryTruth = inventoryTruthRows.find((entry) => entry.lineItemRef === lineState.lineItemRef)!;
      const currentComparison =
        (
          await repositories.getCurrentInventoryComparisonProjectionForLine(
            pharmacyCaseId,
            lineState.lineItemRef,
          )
        )?.toSnapshot() ?? null;
      const supplyByCandidate = new Map<string, SupplyComputationSnapshot>();
      for (const supply of await repositories.listSupplyComputationsForLine(pharmacyCaseId, lineState.lineItemRef)) {
        const snapshot = supply.toSnapshot();
        supplyByCandidate.set(snapshot.candidateRef, snapshot);
      }
      const candidateProjection = inventoryComparisonProjectionBuilder.buildInventoryComparisonProjection({
        pharmacyCase: context.bundle.pharmacyCase,
        lineState,
        inventoryTruth,
        stockRecords: context.stockByLine.get(lineState.lineItemRef) ?? [],
        supplyComputations: supplyByCandidate,
        activeFence: activeFenceByLine.get(lineState.lineItemRef) ?? null,
        preservedFence: preservedFenceByLine.get(lineState.lineItemRef) ?? null,
        recordedAt,
      });
      const persistedComparison = await persistProjection(
        currentComparison,
        candidateProjection,
        (snapshot, options) => repositories.saveInventoryComparisonProjection(snapshot, options),
        {
          pharmacyCaseId,
          lineItemRef: lineState.lineItemRef,
          eventName: "inventory_comparison",
          scopeKind: "line",
        },
      );
      inventoryComparisonRows.push(persistedComparison);
    }

    const handoffWatch = {
      pharmacyHandoffWatchProjectionId: stableProjectionId("pharmacy_handoff_watch", {
        pharmacyCaseId,
      }),
      pharmacyCaseRef: makeRef("PharmacyCase", pharmacyCaseId, TASK_342),
      watchWindowState:
        context.dispatchTruth === null
          ? "not_started"
          : context.dispatchTruth.authoritativeProofState === "satisfied" &&
              context.outcomeTruth?.outcomeTruthState === "settled_resolved"
            ? "completed"
            : context.bundle.pharmacyCase.currentConfirmationGateRefs.length > 0 ||
                context.bundle.pharmacyCase.currentClosureBlockerRefs.length > 0
              ? "blocked"
              : "active",
      watchWindowStartAt: context.dispatchTruth?.computedAt ?? null,
      watchWindowEndAt:
        context.dispatchTruth?.proofDeadlineAt ?? context.outcomeTruth?.computedAt ?? null,
      blockerRefs: uniqueSorted([
        ...context.bundle.pharmacyCase.currentConfirmationGateRefs.map((ref) => ref.refId),
        ...context.bundle.pharmacyCase.currentClosureBlockerRefs.map((ref) => ref.refId),
        ...(context.outcomeTruth === null || context.outcomeTruth.outcomeReconciliationGateRef === null
          ? []
          : [context.outcomeTruth.outcomeReconciliationGateRef]),
      ]),
      recoveryOwnerRef:
        context.dispatchTruth?.dispatchAttemptRef.refId ??
        context.practiceVisibility?.pharmacyPracticeVisibilityProjectionId ??
        null,
      computedAt: recordedAt,
      version: 1,
    } satisfies PharmacyHandoffWatchProjectionSnapshot;
    const currentHandoffWatch =
      (await repositories.getCurrentHandoffWatchProjectionForCase(pharmacyCaseId))?.toSnapshot() ?? null;
    const persistedHandoffWatch = await persistProjection(
      currentHandoffWatch,
      handoffWatch,
      (snapshot, options) => repositories.saveHandoffWatchProjection(snapshot, options),
      {
        pharmacyCaseId,
        eventName: "handoff_watch",
        scopeKind: "case",
      },
    );

    const assurance = assuranceProjectionBuilder.buildAssuranceProjection({
      pharmacyCase: context.bundle.pharmacyCase,
      choiceTruth: context.choiceTruth,
      dispatchTruth: context.dispatchTruth,
      outcomeTruth: context.outcomeTruth,
      consentCheckpoint: context.consentCheckpoint,
      practiceVisibility: context.practiceVisibility,
      recordedAt,
    });
    const currentAssurance =
      (await repositories.getCurrentAssuranceProjectionForCase(pharmacyCaseId))?.toSnapshot() ?? null;
    const persistedAssurance = await persistProjection(
      currentAssurance,
      assurance,
      (snapshot, options) => repositories.saveAssuranceProjection(snapshot, options),
      {
        pharmacyCaseId,
        eventName: "assurance",
        scopeKind: "case",
      },
    );

    const mission = {
      pharmacyMissionProjectionId: stableProjectionId("pharmacy_mission", { pharmacyCaseId }),
      pharmacyCaseRef: makeRef("PharmacyCase", pharmacyCaseId, TASK_342),
      missionTokenRef: stableProjectionId("pharmacy_mission_token", {
        pharmacyCaseId,
        leaseRef: context.bundle.pharmacyCase.leaseRef.refId,
        ownershipEpoch: context.bundle.pharmacyCase.ownershipEpoch,
      }),
      dominantPromotedRegion:
        inventoryComparisonRows.some((row) => row.dominantCompareState !== "ready")
          ? "inventory_support"
          : persistedHandoffWatch.watchWindowState === "blocked" ||
              persistedActionSettlement.agreementState === "pending" ||
              persistedActionSettlement.agreementState === "blocked"
            ? "handoff_support"
            : persistedAssurance.assuranceState !== "clear"
              ? "assurance_support"
              : "none",
      suppressedRegionRefs: [] as PharmacyConsoleSupportRegion[],
      queueAnchorLeaseRef: context.bundle.pharmacyCase.leaseRef.refId,
      handoffWatchWindowRef: persistedHandoffWatch.pharmacyHandoffWatchProjectionId,
      fenceEpoch: Math.max(0, ...activeFences.map((fence) => fence.fenceEpoch)),
      continuityValidationState: persistedContinuity.validationState,
      computedAt: recordedAt,
      version: 1,
    } satisfies PharmacyMissionProjectionSnapshot;
    mission.suppressedRegionRefs = (
      ["inventory_support", "handoff_support", "assurance_support"] as const
    ).filter((entry) => entry !== mission.dominantPromotedRegion);
    const currentMission =
      (await repositories.getCurrentMissionProjectionForCase(pharmacyCaseId))?.toSnapshot() ?? null;
    const persistedMission = await persistProjection(
      currentMission,
      mission,
      (snapshot, options) => repositories.saveMissionProjection(snapshot, options),
      {
        pharmacyCaseId,
        eventName: "mission",
        scopeKind: "case",
      },
    );

    const handoff = handoffProjectionBuilder.buildHandoffProjection({
      bundle: context.bundle,
      lineCards: persistedMedicationValidation.lineCards,
      inventoryTruth: inventoryTruthRows,
      actionSettlement: persistedActionSettlement,
      continuity: persistedContinuity,
      handoffWatch: persistedHandoffWatch,
      recordedAt,
    });
    const currentHandoff =
      (await repositories.getCurrentHandoffProjectionForCase(pharmacyCaseId))?.toSnapshot() ?? null;
    const persistedHandoff = await persistProjection(
      currentHandoff,
      handoff,
      (snapshot, options) => repositories.saveHandoffProjection(snapshot, options),
      {
        pharmacyCaseId,
        eventName: "handoff",
        scopeKind: "case",
      },
    );

    const summary = summaryProjectionBuilder.buildSummaryProjection({
      bundle: context.bundle,
      lineCards: persistedMedicationValidation.lineCards,
      activeFences,
      mission: persistedMission,
      handoff: persistedHandoff,
      actionSettlement: persistedActionSettlement,
      continuity: persistedContinuity,
      assurance: persistedAssurance,
      inventoryTruth: inventoryTruthRows,
      recordedAt,
    });
    const currentSummary =
      (await repositories.getCurrentConsoleSummaryProjectionForCase(pharmacyCaseId))?.toSnapshot() ?? null;
    const persistedSummary = await persistProjection(
      currentSummary,
      summary,
      (snapshot, options) => repositories.saveConsoleSummaryProjection(snapshot, options),
      {
        pharmacyCaseId,
        eventName: "console_summary",
        scopeKind: "case",
      },
    );

    const worklist = worklistProjectionBuilder.buildWorklistProjection({
      bundle: context.bundle,
      summary: persistedSummary,
      recordedAt,
    });
    const currentWorklist =
      (await repositories.getCurrentConsoleWorklistProjectionForCase(pharmacyCaseId))?.toSnapshot() ?? null;
    await persistProjection(
      currentWorklist,
      worklist,
      (snapshot, options) => repositories.saveConsoleWorklistProjection(snapshot, options),
      {
        pharmacyCaseId,
        eventName: "console_worklist",
        scopeKind: "case",
      },
    );

    const workbench = caseWorkbenchProjectionBuilder.buildWorkbenchProjection({
      bundle: context.bundle,
      summary: persistedSummary,
      mission: persistedMission,
      medicationValidation: persistedMedicationValidation,
      inventoryTruth: inventoryTruthRows,
      inventoryComparison: inventoryComparisonRows,
      handoff: persistedHandoff,
      handoffWatch: persistedHandoffWatch,
      actionSettlement: persistedActionSettlement,
      continuity: persistedContinuity,
      assurance: persistedAssurance,
      choiceTruth: context.choiceTruth,
      dispatchTruth: context.dispatchTruth,
      outcomeTruth: context.outcomeTruth,
      consentCheckpoint: context.consentCheckpoint,
      recordedAt,
    });
    const currentWorkbench =
      (await repositories.getCurrentCaseWorkbenchProjectionForCase(pharmacyCaseId))?.toSnapshot() ?? null;
    return persistProjection(
      currentWorkbench,
      workbench,
      (snapshot, options) => repositories.saveCaseWorkbenchProjection(snapshot, options),
      {
        pharmacyCaseId,
        eventName: "case_workbench",
        scopeKind: "case",
      },
    );
  }

  const inventoryComparisonFenceService: InventoryComparisonFenceService =
    input.inventoryComparisonFenceService ?? {
      async createFence(command) {
        const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
        await refreshCaseInternal(command.pharmacyCaseId, recordedAt);
        const inventoryComparison =
          (
            await repositories.getCurrentInventoryComparisonProjectionForLine(
              command.pharmacyCaseId,
              command.lineItemRef,
            )
          )?.toSnapshot() ?? null;
        invariant(
          inventoryComparison !== null,
          "INVENTORY_COMPARISON_REQUIRED",
          `Inventory comparison missing for ${command.lineItemRef}.`,
        );
        const candidate = inventoryComparison.candidateRows.find(
          (entry) => entry.candidateRef === command.candidateRef,
        );
        invariant(
          candidate !== undefined,
          "INVENTORY_CANDIDATE_REQUIRED",
          `Candidate ${command.candidateRef} missing for ${command.lineItemRef}.`,
        );
        const inventoryTruth =
          (
            await repositories.getCurrentInventoryTruthProjectionForLine(
              command.pharmacyCaseId,
              command.lineItemRef,
            )
          )?.toSnapshot() ?? null;
        invariant(
          inventoryTruth !== null,
          "INVENTORY_TRUTH_REQUIRED",
          `Inventory truth missing for ${command.lineItemRef}.`,
        );
        const recordDocument = await repositories.listInventorySupportRecordsForLine(
          command.pharmacyCaseId,
          command.lineItemRef,
        );
        const record = recordDocument
          .map((entry) => entry.toSnapshot())
          .find((entry) => entry.candidateRef === command.candidateRef);
        invariant(record !== undefined, "INVENTORY_RECORD_REQUIRED", "Inventory record missing.");
        const candidateSetDigest = buildCandidateSetDigestFromRecords(
          recordDocument.map((entry) => entry.toSnapshot()),
        );
        const digests = buildFenceDigests({ record, candidateSetDigest });
        const idempotencyKey = optionalText(command.idempotencyKey);
        const fenceId =
          idempotencyKey === null
            ? stableProjectionId("inventory_fence", {
                pharmacyCaseId: command.pharmacyCaseId,
                lineItemRef: command.lineItemRef,
                candidateRef: command.candidateRef,
                recordedAt,
              })
            : stableProjectionId("inventory_fence", {
                pharmacyCaseId: command.pharmacyCaseId,
                lineItemRef: command.lineItemRef,
                candidateRef: command.candidateRef,
                idempotencyKey,
              });
        const existing = (await repositories.getInventoryComparisonFence(fenceId))?.toSnapshot() ?? null;
        if (existing !== null) {
          return existing;
        }
        const current =
          (
            await repositories.getCurrentInventoryComparisonFenceForLine(
              command.pharmacyCaseId,
              command.lineItemRef,
            )
          )?.toSnapshot() ?? null;
        const fence = normalizeFence({
          inventoryComparisonFenceId: fenceId,
          pharmacyCaseRef: makeRef("PharmacyCase", command.pharmacyCaseId, TASK_342),
          lineItemRef: command.lineItemRef,
          candidateRef: command.candidateRef,
          inventoryTruthProjectionRef: makeRef(
            "InventoryTruthProjection",
            inventoryTruth.inventoryTruthProjectionId,
            TASK_355,
          ),
          ...digests,
          previousCandidateRef: current?.candidateRef ?? null,
          fenceState: "active",
          invalidatedReasonCode: null,
          fenceEpoch: (current?.fenceEpoch ?? 0) + 1,
          createdAt: recordedAt,
          refreshedAt: recordedAt,
          invalidatedAt: null,
          actorRef: optionalText(command.actorRef),
          idempotencyKey,
          version: 1,
        });
        await repositories.saveInventoryComparisonFence(fence);
        await repositories.appendConsoleAuditEvent(
          buildAuditEvent({
            pharmacyCaseId: command.pharmacyCaseId,
            lineItemRef: command.lineItemRef,
            scopeKind: "line",
            eventName: "inventory_fence.created",
            payload: fence,
            recordedAt,
          }),
        );
        await refreshCaseInternal(command.pharmacyCaseId, recordedAt);
        return fence;
      },
      async refreshFence(command) {
        const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
        await refreshCaseInternal(command.pharmacyCaseId, recordedAt);
        const current =
          (
            await repositories.getCurrentInventoryComparisonFenceForLine(
              command.pharmacyCaseId,
              command.lineItemRef,
            )
          )?.toSnapshot() ?? null;
        if (current === null) {
          return null;
        }
        const inventoryComparison =
          (
            await repositories.getCurrentInventoryComparisonProjectionForLine(
              command.pharmacyCaseId,
              command.lineItemRef,
            )
          )?.toSnapshot() ?? null;
        if (inventoryComparison === null) {
          return current;
        }
        const candidate = inventoryComparison.candidateRows.find(
          (row) => row.candidateRef === current.candidateRef,
        );
        if (candidate === undefined) {
          return this.invalidateFence({
            inventoryComparisonFenceId: current.inventoryComparisonFenceId,
            recordedAt,
            reasonCode: "CANDIDATE_MISSING",
          });
        }
        const stockRecords = (
          await repositories.listInventorySupportRecordsForLine(command.pharmacyCaseId, command.lineItemRef)
        ).map((entry) => entry.toSnapshot());
        const boundRecord = stockRecords.find((row) => row.candidateRef === current.candidateRef);
        if (!boundRecord) {
          return this.invalidateFence({
            inventoryComparisonFenceId: current.inventoryComparisonFenceId,
            recordedAt,
            reasonCode: "CANDIDATE_MISSING",
          });
        }
        const digests = buildFenceDigests({
          record: boundRecord,
          candidateSetDigest: buildCandidateSetDigestFromRecords(stockRecords),
        });
        const driftReason = fenceDriftReason({
          currentFence: current,
          digests,
        });
        if (driftReason !== null) {
          return this.invalidateFence({
            inventoryComparisonFenceId: current.inventoryComparisonFenceId,
            recordedAt,
            reasonCode: driftReason,
          });
        }
        const refreshed = {
          ...current,
          refreshedAt: recordedAt,
          version: nextVersion(current.version),
        };
        await repositories.saveInventoryComparisonFence(refreshed, {
          expectedVersion: current.version,
        });
        await refreshCaseInternal(command.pharmacyCaseId, recordedAt);
        return refreshed;
      },
      async invalidateFence(command) {
        const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
        const current =
          (await repositories.getInventoryComparisonFence(command.inventoryComparisonFenceId))?.toSnapshot() ??
          null;
        if (current === null) {
          return null;
        }
        if (current.fenceState === "invalidated") {
          return current;
        }
        const invalidated = {
          ...current,
          fenceState: "invalidated" as const,
          invalidatedReasonCode: requireText(command.reasonCode, "reasonCode"),
          invalidatedAt: recordedAt,
          refreshedAt: recordedAt,
          version: nextVersion(current.version),
        };
        await repositories.saveInventoryComparisonFence(invalidated, {
          expectedVersion: current.version,
        });
        await repositories.appendConsoleAuditEvent(
          buildAuditEvent({
            pharmacyCaseId: current.pharmacyCaseRef.refId,
            lineItemRef: current.lineItemRef,
            scopeKind: "line",
            eventName: "inventory_fence.invalidated",
            payload: invalidated,
            recordedAt,
          }),
        );
        await refreshCaseInternal(current.pharmacyCaseRef.refId, recordedAt);
        return invalidated;
      },
    };

  return {
    repositories,
    async refreshConsoleCase(pharmacyCaseId, input) {
      const recordedAt = ensureIsoTimestamp(
        input?.recordedAt ?? new Date().toISOString(),
        "recordedAt",
      );
      return refreshCaseInternal(pharmacyCaseId, recordedAt);
    },
    async fetchConsoleSummaryProjection(pharmacyCaseId, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (
        await repositories.getCurrentConsoleSummaryProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
    async fetchConsoleWorklist(input) {
      const recordedAt = ensureIsoTimestamp(
        input?.recordedAt ?? new Date().toISOString(),
        "recordedAt",
      );
      const caseDocuments = await caseKernelService.repositories.listPharmacyCases();
      for (const row of caseDocuments) {
        if (row.toSnapshot().status === "closed") {
          continue;
        }
        await refreshCaseInternal(row.toSnapshot().pharmacyCaseId, recordedAt);
      }
      const rows = (await repositories.listCurrentConsoleWorklistProjections()).map((entry) =>
        entry.toSnapshot(),
      );
      return rows.filter((row) => {
        if (
          input?.supportRegionState !== undefined &&
          row.supportRegionState !== input.supportRegionState
        ) {
          return false;
        }
        if (
          input?.handoffReadinessState !== undefined &&
          row.handoffReadinessState !== input.handoffReadinessState
        ) {
          return false;
        }
        if (
          input?.inventoryFreshnessState !== undefined &&
          row.inventoryFreshnessState !== input.inventoryFreshnessState
        ) {
          return false;
        }
        return true;
      });
    },
    async fetchCaseWorkbenchProjection(pharmacyCaseId, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (
        await repositories.getCurrentCaseWorkbenchProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
    async fetchMissionProjection(pharmacyCaseId, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (await repositories.getCurrentMissionProjectionForCase(pharmacyCaseId))?.toSnapshot() ?? null;
    },
    async fetchMedicationValidationProjection(pharmacyCaseId, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (
        await repositories.getCurrentMedicationValidationProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
    async fetchInventoryTruthProjection(pharmacyCaseId, lineItemRef, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (
        await repositories.getCurrentInventoryTruthProjectionForLine(pharmacyCaseId, lineItemRef)
      )?.toSnapshot() ?? null;
    },
    async fetchInventoryComparisonProjection(pharmacyCaseId, lineItemRef, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (
        await repositories.getCurrentInventoryComparisonProjectionForLine(
          pharmacyCaseId,
          lineItemRef,
        )
      )?.toSnapshot() ?? null;
    },
    async createInventoryComparisonFence(command) {
      return inventoryComparisonFenceService.createFence({
        ...command,
        recordedAt: ensureIsoTimestamp(
          command.recordedAt ?? new Date().toISOString(),
          "recordedAt",
        ),
      });
    },
    async refreshInventoryComparisonFence(command) {
      return inventoryComparisonFenceService.refreshFence({
        ...command,
        recordedAt: ensureIsoTimestamp(
          command.recordedAt ?? new Date().toISOString(),
          "recordedAt",
        ),
      });
    },
    async invalidateInventoryComparisonFence(command) {
      return inventoryComparisonFenceService.invalidateFence({
        ...command,
        recordedAt: ensureIsoTimestamp(
          command.recordedAt ?? new Date().toISOString(),
          "recordedAt",
        ),
      });
    },
    async fetchSupplyComputation(pharmacyCaseId, lineItemRef, candidateRef, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (
        await repositories.getCurrentSupplyComputationForCandidate(
          pharmacyCaseId,
          lineItemRef,
          candidateRef,
        )
      )?.toSnapshot() ?? null;
    },
    async fetchHandoffProjection(pharmacyCaseId, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (await repositories.getCurrentHandoffProjectionForCase(pharmacyCaseId))?.toSnapshot() ?? null;
    },
    async fetchHandoffWatchProjection(pharmacyCaseId, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (
        await repositories.getCurrentHandoffWatchProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
    async fetchActionSettlementProjection(pharmacyCaseId, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (
        await repositories.getCurrentActionSettlementProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
    async fetchConsoleContinuityEvidenceProjection(pharmacyCaseId, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (
        await repositories.getCurrentConsoleContinuityEvidenceProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
    async fetchAssuranceProjection(pharmacyCaseId, input) {
      await refreshCaseInternal(
        pharmacyCaseId,
        ensureIsoTimestamp(input?.recordedAt ?? new Date().toISOString(), "recordedAt"),
      );
      return (await repositories.getCurrentAssuranceProjectionForCase(pharmacyCaseId))?.toSnapshot() ?? null;
    },
    async fetchChoiceTruthProjection(pharmacyCaseId) {
      return (
        await directoryRepositories.getLatestChoiceTruthProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
    async fetchDispatchTruthProjection(pharmacyCaseId) {
      return (
        await dispatchRepositories.getCurrentDispatchTruthProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
    async fetchOutcomeTruthProjection(pharmacyCaseId) {
      return (
        await outcomeRepositories.getCurrentOutcomeTruthProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
    async fetchConsentCheckpointProjection(pharmacyCaseId) {
      return (
        await directoryRepositories.getLatestConsentCheckpointForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
  };
}
