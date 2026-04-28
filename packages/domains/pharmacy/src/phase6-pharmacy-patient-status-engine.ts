import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  createIdentityRepairStore,
  createReachabilityStore,
  evaluateContactRouteRepairJourney,
  ReachabilityAssessmentRecordDocument,
  ReachabilityDependencyDocument,
  type ContactRouteSnapshot,
  type ContactRouteVerificationCheckpointDocument,
  type IdentityRepairBranchDisposition,
  type IdentityRepairDependencies,
  type IdentityRepairReleaseSettlement,
  type ReachabilityAssessmentRecord,
  type ReachabilityDependencies,
  type ReachabilityDependency,
} from "../../identity_access/src/index";

import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  type AggregateRef,
  type PharmacyCaseBundle,
  type PharmacyCaseSnapshot,
  type PharmacyCaseStatus,
  type Phase6PharmacyCaseKernelService,
} from "./phase6-pharmacy-case-kernel";
import {
  createPhase6PharmacyDirectoryChoiceStore,
  type Phase6PharmacyDirectoryChoiceRepositories,
  type PharmacyChoiceExplanation,
  type PharmacyChoiceTruthProjection,
  type PharmacyConsentCheckpoint,
  type PharmacyProvider,
} from "./phase6-pharmacy-directory-choice-engine";
import {
  createPhase6PharmacyDispatchStore,
  type Phase6PharmacyDispatchRepositories,
  type PharmacyDispatchTruthProjectionSnapshot,
} from "./phase6-pharmacy-dispatch-engine";
import { type PharmacyPatientMacroState } from "./phase6-pharmacy-eligibility-engine";
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
const TASK_351 =
  "par_351_phase6_track_backend_build_patient_instruction_generation_and_referral_status_projections" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task344 = typeof TASK_344;
type Task351 = typeof TASK_351;

const DEFAULT_COPY_GRAMMAR_VERSION_REF = "phase6_pharmacy_patient_copy_v1";

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

function ensureProbability(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1.`,
  );
  return Number(value.toFixed(6));
}

function ensureIntegerInRange(value: number, field: string, min: number, max: number): number {
  invariant(
    Number.isInteger(value) && value >= min && value <= max,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be an integer between ${min} and ${max}.`,
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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function canonicalStringify(value: unknown): string {
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
    return `[${value.map((entry) => canonicalStringify(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalStringify(entryValue)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
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

function versionedCopyRef(kind: string, code: string): string {
  return `${DEFAULT_COPY_GRAMMAR_VERSION_REF}.${kind}.${code}`;
}

function stableProjectionId(prefix: string, input: unknown): string {
  return `${prefix}_${sha256Hex(canonicalStringify(input)).slice(0, 16)}`;
}

function withMonotoneVersion<T extends { version: number }>(
  candidate: T,
  existing: T | null,
  idSelector: (value: T) => string,
): T {
  if (existing === null || idSelector(existing) !== idSelector(candidate)) {
    return candidate;
  }
  return {
    ...candidate,
    version: existing.version + 1,
  };
}

export type PharmacyOutcomeTruthState =
  | "waiting_for_outcome"
  | "review_required"
  | "resolved_pending_projection"
  | "reopened_for_safety"
  | "unmatched"
  | "duplicate_ignored"
  | "settled_resolved";

export type PharmacyOutcomeMatchConfidenceBand = "high" | "medium" | "low";

export type PharmacyOutcomeCloseEligibilityState =
  | "blocked_by_reconciliation"
  | "blocked_by_safety"
  | "eligible_pending_projection"
  | "not_closable";

export type PharmacyOutcomePatientVisibilityState =
  | "review_placeholder"
  | "recovery_required"
  | "quiet_result"
  | "hidden";

export interface PharmacyOutcomeTruthProjectionSnapshot {
  pharmacyOutcomeTruthProjectionId: string;
  pharmacyCaseId: string;
  latestOutcomeSettlementRef: string | null;
  latestOutcomeRecordRef: string | null;
  latestIngestAttemptRef: string | null;
  outcomeReconciliationGateRef: string | null;
  outcomeTruthState: PharmacyOutcomeTruthState;
  resolutionClass: string | null;
  matchConfidenceBand: PharmacyOutcomeMatchConfidenceBand;
  contradictionScore: number;
  manualReviewState: string | null;
  closeEligibilityState: PharmacyOutcomeCloseEligibilityState;
  patientVisibilityState: PharmacyOutcomePatientVisibilityState;
  continuityEvidenceRef: string;
  audienceMessageRef: string;
  computedAt: string;
  version: number;
}

export type PharmacyReachabilityPlanRouteAuthorityState =
  | "current"
  | "stale_verification"
  | "stale_demographics"
  | "disputed"
  | "superseded";

export type PharmacyReachabilityPlanDeliveryRiskState =
  | "clear"
  | "at_risk"
  | "likely_failed"
  | "disputed";

export type PharmacyReachabilityPlanRepairState =
  | "clear"
  | "repair_required"
  | "recovering"
  | "rebound_pending"
  | "blocked_identity";

export type PharmacyReachabilityDominantBrokenDependency =
  | "none"
  | "pharmacy_contact"
  | "outcome_confirmation"
  | "urgent_return";

export interface PharmacyReachabilityPlanSnapshot {
  pharmacyReachabilityPlanId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  patientContactRouteRef: string;
  pharmacyContactDependencyRef: string;
  outcomeConfirmationDependencyRef: string;
  urgentReturnDependencyRef: string;
  currentReachabilityAssessmentRef: string;
  currentContactRouteSnapshotRef: string;
  contactRepairJourneyRef: string | null;
  routeAuthorityState: PharmacyReachabilityPlanRouteAuthorityState;
  deliveryRiskState: PharmacyReachabilityPlanDeliveryRiskState;
  repairState: PharmacyReachabilityPlanRepairState;
  dominantBrokenDependency: PharmacyReachabilityDominantBrokenDependency;
  lastValidatedAt: string;
  refreshedAt: string;
  version: number;
}

export type PharmacyBounceBackType =
  | "urgent_gp_return"
  | "routine_gp_return"
  | "patient_not_contactable"
  | "patient_declined"
  | "pharmacy_unable_to_complete"
  | "referral_expired"
  | "safeguarding_concern";

export interface PharmacyBounceBackRecordSnapshot {
  bounceBackRecordId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  bounceBackEvidenceEnvelopeRef: AggregateRef<"PharmacyBounceBackEvidenceEnvelope", Task344>;
  bounceBackType: PharmacyBounceBackType;
  normalizedEvidenceRefs: readonly string[];
  urgencyCarryFloor: number;
  materialChange: number;
  loopRisk: number;
  reopenSignal: number;
  reopenPriorityBand: number;
  sourceOutcomeOrDispatchRef:
    | AggregateRef<"PharmacyOutcomeSettlement", Task343>
    | AggregateRef<"PharmacyDispatchSettlement", Task343>
    | null;
  reachabilityDependencyRef: string | null;
  patientInstructionRef: AggregateRef<"PharmacyPatientStatusProjection", Task344>;
  practiceVisibilityRef: AggregateRef<"PharmacyPracticeVisibilityProjection", Task344>;
  supervisorReviewState: "not_required" | "required" | "in_review" | "resolved";
  directUrgentRouteRef: AggregateRef<"UrgentReturnDirectRouteProfile", Task344> | null;
  gpActionRequired: boolean;
  reopenedCaseStatus:
    | "unresolved_returned"
    | "urgent_bounce_back"
    | "no_contact_return_pending";
  currentReachabilityPlanRef: AggregateRef<"PharmacyReachabilityPlan", Task344> | null;
  wrongPatientFreezeState: "clear" | "identity_repair_active";
  autoRedispatchBlocked: boolean;
  autoCloseBlocked: boolean;
  returnedTaskRef: string | null;
  reopenByAt: string | null;
  patientInformedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type PatientShellConsistencyState = "live" | "revalidate_only" | "recovery_only" | "blocked";

export interface PatientShellConsistencyProjectionSnapshot {
  patientShellConsistencyProjectionId: string;
  subjectRef: string;
  shellContinuityKey: string;
  selectedSectionRef: string;
  activeRouteFamilyRef: string;
  selectedAnchorRef: string;
  activeReturnContractRef: string | null;
  bundleVersion: string;
  audienceTier: string;
  shellConsistencyState: PatientShellConsistencyState;
  computedAt: string;
  staleAt: string;
  causalConsistencyState: string;
  version: number;
}

export type PatientExperienceContinuityValidationState = "trusted" | "degraded" | "stale" | "blocked";

export interface PatientExperienceContinuityEvidenceProjectionSnapshot {
  patientExperienceContinuityEvidenceProjectionId: string;
  patientShellConsistencyRef: string;
  controlCode: "patient_nav";
  routeFamilyRef: string;
  selectedAnchorRef: string;
  sourceSettlementOrContinuationRef: string;
  experienceContinuityEvidenceRef: string;
  continuityTupleHash: string;
  validationState: PatientExperienceContinuityValidationState;
  capturedAt: string;
  version: number;
}

export type PharmacyPatientStatusStaleOrBlockedPosture =
  | "clear"
  | "stale"
  | "blocked"
  | "repair_required"
  | "identity_frozen";

export interface PharmacyPatientStatusProjectionSnapshot {
  pharmacyPatientStatusProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  dispatchTruthProjectionRef:
    | AggregateRef<"PharmacyDispatchTruthProjection", Task343>
    | null;
  outcomeTruthProjectionRef:
    | AggregateRef<"PharmacyOutcomeTruthProjection", Task343>
    | null;
  bounceBackRecordRef: AggregateRef<"PharmacyBounceBackRecord", Task344> | null;
  reachabilityPlanRef: AggregateRef<"PharmacyReachabilityPlan", Task344> | null;
  currentMacroState: PharmacyPatientMacroState;
  nextSafeActionCopyRef: string;
  warningCopyRef: string | null;
  reviewCopyRef: string | null;
  continuityEvidenceRef: string;
  staleOrBlockedPosture: PharmacyPatientStatusStaleOrBlockedPosture;
  dominantReachabilityDependencyRef: string | null;
  lastMeaningfulEventAt: string;
  calmCopyAllowed: boolean;
  currentClosureBlockerRefs: readonly string[];
  currentIdentityRepairDispositionRef: string | null;
  audienceMessageRef: string;
  computedAt: string;
  version: number;
}

export type PharmacyPatientProviderSummaryDetailVisibilityState =
  | "full"
  | "provenance_only"
  | "hidden";

export interface PharmacyPatientProviderSummarySnapshot {
  pharmacyPatientProviderSummaryId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  providerRef: AggregateRef<"PharmacyProvider", Task343> | null;
  detailVisibilityState: PharmacyPatientProviderSummaryDetailVisibilityState;
  providerDisplayName: string | null;
  openingState: string | null;
  consultationModeHints: readonly string[];
  contactEndpoints: readonly string[];
  patientReasonCueRefs: readonly string[];
  warningCopyRef: string | null;
  selectedAnchorRef: string;
  computedAt: string;
  version: number;
}

export type PharmacyPatientReferralReferenceDisplayMode = "available" | "pending" | "suppressed";

export interface PharmacyPatientReferralReferenceSummarySnapshot {
  pharmacyPatientReferralReferenceSummaryId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  dispatchTruthProjectionRef:
    | AggregateRef<"PharmacyDispatchTruthProjection", Task343>
    | null;
  correlationRecordRef: AggregateRef<"PharmacyCorrelationRecord", Task343> | null;
  displayMode: PharmacyPatientReferralReferenceDisplayMode;
  displayReference: string | null;
  outboundReferenceSetHash: string | null;
  selectedAnchorRef: string;
  computedAt: string;
  version: number;
}

export type PharmacyPatientRepairProjectionState =
  | "not_required"
  | "ready"
  | "awaiting_verification"
  | "rebound_pending"
  | "manual_recovery"
  | "identity_frozen";

export interface PharmacyPatientReachabilityRepairProjectionSnapshot {
  pharmacyPatientReachabilityRepairProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  dominantBrokenDependency: PharmacyReachabilityDominantBrokenDependency;
  reachabilityDependencyRef: string | null;
  currentContactRouteSnapshotRef: string | null;
  currentReachabilityAssessmentRef: string | null;
  contactRepairJourneyRef: string | null;
  selectedProviderSummaryRef: AggregateRef<"PharmacyPatientProviderSummary", Task351> | null;
  referralReferenceSummaryRef:
    AggregateRef<"PharmacyPatientReferralReferenceSummary", Task351> | null;
  referralAnchorRef: string;
  resumeContinuationRef: string | null;
  selectedAnchorRef: string;
  governingStatusTruthRevision: string;
  nextRepairAction:
    | "none"
    | "collect_route"
    | "verify_candidate_route"
    | "resume_original_action"
    | "manual_recovery"
    | "stale_restart_required";
  repairProjectionState: PharmacyPatientRepairProjectionState;
  computedAt: string;
  version: number;
}

export type PharmacyPatientContinuityFreshnessState = "current" | "stale" | "blocked";

export interface PharmacyPatientContinuityProjectionSnapshot {
  pharmacyPatientContinuityProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  patientShellConsistencyProjectionRef: string;
  experienceContinuityProjectionRef: string | null;
  selectedAnchorRef: string;
  activeRouteFamilyRef: string;
  shellConsistencyState: PatientShellConsistencyState;
  continuityValidationState: PatientExperienceContinuityValidationState;
  freshnessState: PharmacyPatientContinuityFreshnessState;
  governingStatusTruthRevision: string;
  computedAt: string;
  version: number;
}

export interface PharmacyPatientInstructionPanelSnapshot {
  pharmacyPatientInstructionPanelId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  patientStatusProjectionRef: AggregateRef<"PharmacyPatientStatusProjection", Task351>;
  providerSummaryRef: AggregateRef<"PharmacyPatientProviderSummary", Task351> | null;
  repairProjectionRef:
    AggregateRef<"PharmacyPatientReachabilityRepairProjection", Task351> | null;
  referralReferenceSummaryRef:
    AggregateRef<"PharmacyPatientReferralReferenceSummary", Task351> | null;
  contentGrammarVersionRef: string;
  macroState: PharmacyPatientMacroState;
  headlineCopyRef: string;
  headlineText: string;
  nextStepCopyRef: string;
  nextStepText: string;
  whoOrWhereCopyRef: string | null;
  whoOrWhereText: string | null;
  whenExpectationCopyRef: string | null;
  whenExpectationText: string | null;
  symptomsWorsenCopyRef: string;
  symptomsWorsenText: string;
  warningCopyRef: string | null;
  warningText: string | null;
  reviewCopyRef: string | null;
  reviewText: string | null;
  calmCompletionCopyRef: string | null;
  calmCompletionText: string | null;
  generatedAt: string;
  version: number;
}

export interface PharmacyPatientStatusAuditEventSnapshot {
  pharmacyPatientStatusAuditEventId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  previousMacroState: PharmacyPatientMacroState | "none";
  nextMacroState: PharmacyPatientMacroState;
  previousDominantReachabilityDependencyRef: string | null;
  nextDominantReachabilityDependencyRef: string | null;
  previousStaleOrBlockedPosture: PharmacyPatientStatusStaleOrBlockedPosture | "none";
  nextStaleOrBlockedPosture: PharmacyPatientStatusStaleOrBlockedPosture;
  governingStatusTruthRevision: string;
  recordedAt: string;
  version: number;
}

export interface Phase6PharmacyPatientStatusRepositories {
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
  getReachabilityPlan(
    pharmacyReachabilityPlanId: string,
  ): Promise<SnapshotDocument<PharmacyReachabilityPlanSnapshot> | null>;
  getCurrentReachabilityPlanForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyReachabilityPlanSnapshot> | null>;
  saveReachabilityPlan(
    snapshot: PharmacyReachabilityPlanSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getBounceBackRecord(
    bounceBackRecordId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackRecordSnapshot> | null>;
  getCurrentBounceBackRecordForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackRecordSnapshot> | null>;
  saveBounceBackRecord(
    snapshot: PharmacyBounceBackRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPatientShellConsistencyProjection(
    patientShellConsistencyProjectionId: string,
  ): Promise<SnapshotDocument<PatientShellConsistencyProjectionSnapshot> | null>;
  savePatientShellConsistencyProjection(
    snapshot: PatientShellConsistencyProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPatientExperienceContinuityProjection(
    patientExperienceContinuityEvidenceProjectionId: string,
  ): Promise<SnapshotDocument<PatientExperienceContinuityEvidenceProjectionSnapshot> | null>;
  savePatientExperienceContinuityProjection(
    snapshot: PatientExperienceContinuityEvidenceProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPatientStatusProjection(
    pharmacyPatientStatusProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyPatientStatusProjectionSnapshot> | null>;
  getCurrentPatientStatusProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyPatientStatusProjectionSnapshot> | null>;
  savePatientStatusProjection(
    snapshot: PharmacyPatientStatusProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPatientProviderSummary(
    pharmacyPatientProviderSummaryId: string,
  ): Promise<SnapshotDocument<PharmacyPatientProviderSummarySnapshot> | null>;
  getCurrentPatientProviderSummaryForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyPatientProviderSummarySnapshot> | null>;
  savePatientProviderSummary(
    snapshot: PharmacyPatientProviderSummarySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPatientReferralReferenceSummary(
    pharmacyPatientReferralReferenceSummaryId: string,
  ): Promise<SnapshotDocument<PharmacyPatientReferralReferenceSummarySnapshot> | null>;
  getCurrentPatientReferralReferenceSummaryForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyPatientReferralReferenceSummarySnapshot> | null>;
  savePatientReferralReferenceSummary(
    snapshot: PharmacyPatientReferralReferenceSummarySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPatientReachabilityRepairProjection(
    pharmacyPatientReachabilityRepairProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyPatientReachabilityRepairProjectionSnapshot> | null>;
  getCurrentPatientReachabilityRepairProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyPatientReachabilityRepairProjectionSnapshot> | null>;
  savePatientReachabilityRepairProjection(
    snapshot: PharmacyPatientReachabilityRepairProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPatientContinuityProjection(
    pharmacyPatientContinuityProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyPatientContinuityProjectionSnapshot> | null>;
  getCurrentPatientContinuityProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyPatientContinuityProjectionSnapshot> | null>;
  savePatientContinuityProjection(
    snapshot: PharmacyPatientContinuityProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPatientInstructionPanel(
    pharmacyPatientInstructionPanelId: string,
  ): Promise<SnapshotDocument<PharmacyPatientInstructionPanelSnapshot> | null>;
  getCurrentPatientInstructionPanelForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyPatientInstructionPanelSnapshot> | null>;
  savePatientInstructionPanel(
    snapshot: PharmacyPatientInstructionPanelSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listPatientStatusAuditEventsForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyPatientStatusAuditEventSnapshot>[]>;
  savePatientStatusAuditEvent(
    snapshot: PharmacyPatientStatusAuditEventSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface Phase6PharmacyPatientStatusStore
  extends Phase6PharmacyPatientStatusRepositories {}

export function createPhase6PharmacyPatientStatusStore(): Phase6PharmacyPatientStatusStore {
  const outcomeTruth = new Map<string, PharmacyOutcomeTruthProjectionSnapshot>();
  const currentOutcomeTruthByCase = new Map<string, string>();
  const reachabilityPlans = new Map<string, PharmacyReachabilityPlanSnapshot>();
  const currentReachabilityPlanByCase = new Map<string, string>();
  const bounceBackRecords = new Map<string, PharmacyBounceBackRecordSnapshot>();
  const currentBounceBackByCase = new Map<string, string>();
  const shellConsistency = new Map<string, PatientShellConsistencyProjectionSnapshot>();
  const continuityEvidence = new Map<string, PatientExperienceContinuityEvidenceProjectionSnapshot>();
  const statusProjections = new Map<string, PharmacyPatientStatusProjectionSnapshot>();
  const currentStatusByCase = new Map<string, string>();
  const providerSummaries = new Map<string, PharmacyPatientProviderSummarySnapshot>();
  const currentProviderSummaryByCase = new Map<string, string>();
  const referralSummaries = new Map<string, PharmacyPatientReferralReferenceSummarySnapshot>();
  const currentReferralSummaryByCase = new Map<string, string>();
  const repairProjections = new Map<string, PharmacyPatientReachabilityRepairProjectionSnapshot>();
  const currentRepairByCase = new Map<string, string>();
  const continuityProjections = new Map<string, PharmacyPatientContinuityProjectionSnapshot>();
  const currentContinuityByCase = new Map<string, string>();
  const instructionPanels = new Map<string, PharmacyPatientInstructionPanelSnapshot>();
  const currentInstructionByCase = new Map<string, string>();
  const auditEvents = new Map<string, PharmacyPatientStatusAuditEventSnapshot>();
  const auditIdsByCase = new Map<string, string[]>();

  function appendIndex(map: Map<string, string[]>, key: string, value: string) {
    const current = new Set(map.get(key) ?? []);
    current.add(value);
    map.set(key, [...current].sort());
  }

  return {
    async getOutcomeTruthProjection(pharmacyOutcomeTruthProjectionId) {
      const snapshot = outcomeTruth.get(pharmacyOutcomeTruthProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentOutcomeTruthProjectionForCase(pharmacyCaseId) {
      const projectionId = currentOutcomeTruthByCase.get(pharmacyCaseId);
      return projectionId === undefined ? null : new StoredDocument(outcomeTruth.get(projectionId)!);
    },

    async saveOutcomeTruthProjection(snapshot, options) {
      saveWithCas(outcomeTruth, snapshot.pharmacyOutcomeTruthProjectionId, snapshot, options);
      currentOutcomeTruthByCase.set(snapshot.pharmacyCaseId, snapshot.pharmacyOutcomeTruthProjectionId);
    },

    async getReachabilityPlan(pharmacyReachabilityPlanId) {
      const snapshot = reachabilityPlans.get(pharmacyReachabilityPlanId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentReachabilityPlanForCase(pharmacyCaseId) {
      const planId = currentReachabilityPlanByCase.get(pharmacyCaseId);
      return planId === undefined ? null : new StoredDocument(reachabilityPlans.get(planId)!);
    },

    async saveReachabilityPlan(snapshot, options) {
      saveWithCas(reachabilityPlans, snapshot.pharmacyReachabilityPlanId, snapshot, options);
      currentReachabilityPlanByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyReachabilityPlanId);
    },

    async getBounceBackRecord(bounceBackRecordId) {
      const snapshot = bounceBackRecords.get(bounceBackRecordId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentBounceBackRecordForCase(pharmacyCaseId) {
      const recordId = currentBounceBackByCase.get(pharmacyCaseId);
      return recordId === undefined ? null : new StoredDocument(bounceBackRecords.get(recordId)!);
    },

    async saveBounceBackRecord(snapshot, options) {
      saveWithCas(bounceBackRecords, snapshot.bounceBackRecordId, snapshot, options);
      currentBounceBackByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.bounceBackRecordId);
    },

    async getPatientShellConsistencyProjection(patientShellConsistencyProjectionId) {
      const snapshot = shellConsistency.get(patientShellConsistencyProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async savePatientShellConsistencyProjection(snapshot, options) {
      saveWithCas(
        shellConsistency,
        snapshot.patientShellConsistencyProjectionId,
        snapshot,
        options,
      );
    },

    async getPatientExperienceContinuityProjection(
      patientExperienceContinuityEvidenceProjectionId,
    ) {
      const snapshot = continuityEvidence.get(patientExperienceContinuityEvidenceProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async savePatientExperienceContinuityProjection(snapshot, options) {
      saveWithCas(
        continuityEvidence,
        snapshot.patientExperienceContinuityEvidenceProjectionId,
        snapshot,
        options,
      );
    },

    async getPatientStatusProjection(pharmacyPatientStatusProjectionId) {
      const snapshot = statusProjections.get(pharmacyPatientStatusProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentPatientStatusProjectionForCase(pharmacyCaseId) {
      const projectionId = currentStatusByCase.get(pharmacyCaseId);
      return projectionId === undefined ? null : new StoredDocument(statusProjections.get(projectionId)!);
    },

    async savePatientStatusProjection(snapshot, options) {
      saveWithCas(statusProjections, snapshot.pharmacyPatientStatusProjectionId, snapshot, options);
      currentStatusByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyPatientStatusProjectionId);
    },

    async getPatientProviderSummary(pharmacyPatientProviderSummaryId) {
      const snapshot = providerSummaries.get(pharmacyPatientProviderSummaryId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentPatientProviderSummaryForCase(pharmacyCaseId) {
      const summaryId = currentProviderSummaryByCase.get(pharmacyCaseId);
      return summaryId === undefined ? null : new StoredDocument(providerSummaries.get(summaryId)!);
    },

    async savePatientProviderSummary(snapshot, options) {
      saveWithCas(providerSummaries, snapshot.pharmacyPatientProviderSummaryId, snapshot, options);
      currentProviderSummaryByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyPatientProviderSummaryId);
    },

    async getPatientReferralReferenceSummary(pharmacyPatientReferralReferenceSummaryId) {
      const snapshot = referralSummaries.get(pharmacyPatientReferralReferenceSummaryId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentPatientReferralReferenceSummaryForCase(pharmacyCaseId) {
      const summaryId = currentReferralSummaryByCase.get(pharmacyCaseId);
      return summaryId === undefined ? null : new StoredDocument(referralSummaries.get(summaryId)!);
    },

    async savePatientReferralReferenceSummary(snapshot, options) {
      saveWithCas(referralSummaries, snapshot.pharmacyPatientReferralReferenceSummaryId, snapshot, options);
      currentReferralSummaryByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyPatientReferralReferenceSummaryId,
      );
    },

    async getPatientReachabilityRepairProjection(pharmacyPatientReachabilityRepairProjectionId) {
      const snapshot = repairProjections.get(pharmacyPatientReachabilityRepairProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentPatientReachabilityRepairProjectionForCase(pharmacyCaseId) {
      const projectionId = currentRepairByCase.get(pharmacyCaseId);
      return projectionId === undefined ? null : new StoredDocument(repairProjections.get(projectionId)!);
    },

    async savePatientReachabilityRepairProjection(snapshot, options) {
      saveWithCas(
        repairProjections,
        snapshot.pharmacyPatientReachabilityRepairProjectionId,
        snapshot,
        options,
      );
      currentRepairByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyPatientReachabilityRepairProjectionId,
      );
    },

    async getPatientContinuityProjection(pharmacyPatientContinuityProjectionId) {
      const snapshot = continuityProjections.get(pharmacyPatientContinuityProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentPatientContinuityProjectionForCase(pharmacyCaseId) {
      const projectionId = currentContinuityByCase.get(pharmacyCaseId);
      return projectionId === undefined ? null : new StoredDocument(continuityProjections.get(projectionId)!);
    },

    async savePatientContinuityProjection(snapshot, options) {
      saveWithCas(
        continuityProjections,
        snapshot.pharmacyPatientContinuityProjectionId,
        snapshot,
        options,
      );
      currentContinuityByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyPatientContinuityProjectionId);
    },

    async getPatientInstructionPanel(pharmacyPatientInstructionPanelId) {
      const snapshot = instructionPanels.get(pharmacyPatientInstructionPanelId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentPatientInstructionPanelForCase(pharmacyCaseId) {
      const panelId = currentInstructionByCase.get(pharmacyCaseId);
      return panelId === undefined ? null : new StoredDocument(instructionPanels.get(panelId)!);
    },

    async savePatientInstructionPanel(snapshot, options) {
      saveWithCas(instructionPanels, snapshot.pharmacyPatientInstructionPanelId, snapshot, options);
      currentInstructionByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyPatientInstructionPanelId);
    },

    async listPatientStatusAuditEventsForCase(pharmacyCaseId) {
      return (auditIdsByCase.get(pharmacyCaseId) ?? [])
        .map((eventId) => auditEvents.get(eventId))
        .filter((snapshot): snapshot is PharmacyPatientStatusAuditEventSnapshot => snapshot !== undefined)
        .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async savePatientStatusAuditEvent(snapshot, options) {
      saveWithCas(auditEvents, snapshot.pharmacyPatientStatusAuditEventId, snapshot, options);
      appendIndex(auditIdsByCase, snapshot.pharmacyCaseRef.refId, snapshot.pharmacyPatientStatusAuditEventId);
    },
  };
}

export interface ProjectPharmacyPatientStatusInput {
  pharmacyCaseId: string;
  patientShellConsistencyProjectionId: string;
  recordedAt: string;
}

export interface PharmacyPatientStatusBundle {
  pharmacyCase: PharmacyCaseSnapshot;
  patientStatusProjection: PharmacyPatientStatusProjectionSnapshot;
  providerSummary: PharmacyPatientProviderSummarySnapshot;
  referralReferenceSummary: PharmacyPatientReferralReferenceSummarySnapshot;
  reachabilityRepairProjection: PharmacyPatientReachabilityRepairProjectionSnapshot;
  continuityProjection: PharmacyPatientContinuityProjectionSnapshot;
  instructionPanel: PharmacyPatientInstructionPanelSnapshot;
  outcomeTruthProjection: PharmacyOutcomeTruthProjectionSnapshot | null;
  reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
}

export interface Phase6PharmacyPatientStatusService {
  projectPatientStatus(input: ProjectPharmacyPatientStatusInput): Promise<PharmacyPatientStatusBundle>;
  getPatientPharmacyStatus(
    pharmacyCaseId: string,
  ): Promise<PharmacyPatientStatusProjectionSnapshot | null>;
  getPatientInstructionPanel(
    pharmacyCaseId: string,
  ): Promise<PharmacyPatientInstructionPanelSnapshot | null>;
  getPatientContactRouteRepairEntry(
    pharmacyCaseId: string,
  ): Promise<PharmacyPatientReachabilityRepairProjectionSnapshot | null>;
  getPatientReferralReferenceSummary(
    pharmacyCaseId: string,
  ): Promise<PharmacyPatientReferralReferenceSummarySnapshot | null>;
}

export interface Phase6PharmacyOutcomeTruthProjectionReader {
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

export interface Phase6PharmacyPatientStatusServiceDependencies {
  repositories?: Phase6PharmacyPatientStatusRepositories;
  outcomeRepositories?: Phase6PharmacyOutcomeTruthProjectionReader | null;
  caseKernelService?: Phase6PharmacyCaseKernelService;
  directoryRepositories?: Phase6PharmacyDirectoryChoiceRepositories;
  dispatchRepositories?: Phase6PharmacyDispatchRepositories;
  packageRepositories?: Phase6PharmacyReferralPackageRepositories;
  reachabilityRepositories?: ReachabilityDependencies;
  identityRepairRepositories?: IdentityRepairDependencies;
  idGenerator?: BackboneIdGenerator;
}

function mapDeliveryRiskState(
  riskState: ReachabilityAssessmentRecord["deliveryRiskState"],
): PharmacyReachabilityPlanDeliveryRiskState {
  switch (riskState) {
    case "on_track":
      return "clear";
    case "at_risk":
      return "at_risk";
    case "likely_failed":
      return "likely_failed";
    case "disputed":
      return "disputed";
  }
}

function mapRouteAuthorityState(
  authorityState: ReachabilityAssessmentRecord["routeAuthorityState"],
): PharmacyReachabilityPlanRouteAuthorityState {
  switch (authorityState) {
    case "current":
      return "current";
    case "stale_verification":
      return "stale_verification";
    case "stale_demographics":
      return "stale_demographics";
    case "stale_preferences":
      return "stale_demographics";
    case "disputed":
      return "disputed";
    case "superseded":
      return "superseded";
  }
}

function mapRepairState(
  repairState: ReachabilityDependency["repairState"],
  identityFrozen: boolean,
): PharmacyReachabilityPlanRepairState {
  if (identityFrozen) {
    return "blocked_identity";
  }
  switch (repairState) {
    case "none":
      return "clear";
    case "repair_required":
      return "repair_required";
    case "awaiting_verification":
      return "recovering";
    case "rebound_pending":
      return "rebound_pending";
  }
}

function dominantDependencyWeight(
  dependency: PharmacyReachabilityDominantBrokenDependency,
): number {
  switch (dependency) {
    case "urgent_return":
      return 3;
    case "outcome_confirmation":
      return 2;
    case "pharmacy_contact":
      return 1;
    case "none":
      return 0;
  }
}

function mapDependencyPurpose(
  purpose: ReachabilityDependency["purpose"],
): PharmacyReachabilityDominantBrokenDependency {
  switch (purpose) {
    case "urgent_return":
      return "urgent_return";
    case "outcome_confirmation":
      return "outcome_confirmation";
    case "pharmacy_contact":
      return "pharmacy_contact";
    default:
      return "none";
  }
}

function bounceBackImpliesUrgentAction(
  bounceBack: PharmacyBounceBackRecordSnapshot | null,
  outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot | null,
  pharmacyCase: PharmacyCaseSnapshot,
): boolean {
  if (pharmacyCase.status === "urgent_bounce_back") {
    return true;
  }
  if (bounceBack === null) {
    return (
      outcomeTruth?.outcomeTruthState === "reopened_for_safety" &&
      outcomeTruth.resolutionClass === "urgent_gp_action"
    );
  }
  return (
    bounceBack.bounceBackType === "urgent_gp_return" ||
    bounceBack.bounceBackType === "safeguarding_concern"
  );
}

function synthesizeOutcomeTruthProjection(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
  computedAt: string;
}): PharmacyOutcomeTruthProjectionSnapshot {
  const { pharmacyCase, dispatchTruth, computedAt } = input;
  let outcomeTruthState: PharmacyOutcomeTruthState = "waiting_for_outcome";
  let resolutionClass: string | null = null;
  let patientVisibilityState: PharmacyOutcomePatientVisibilityState = "hidden";
  let closeEligibilityState: PharmacyOutcomeCloseEligibilityState = "not_closable";
  let messageRef = versionedCopyRef("message", "outcome.waiting");
  if (pharmacyCase.status === "outcome_reconciliation_pending") {
    outcomeTruthState = "review_required";
    patientVisibilityState = "review_placeholder";
    closeEligibilityState = "blocked_by_reconciliation";
    resolutionClass = "review_required";
    messageRef = versionedCopyRef("message", "outcome.review");
  } else if (
    pharmacyCase.status === "unresolved_returned" ||
    pharmacyCase.status === "no_contact_return_pending"
  ) {
    outcomeTruthState = "review_required";
    patientVisibilityState = "review_placeholder";
    closeEligibilityState = "blocked_by_reconciliation";
    resolutionClass = "returned_for_review";
    messageRef = versionedCopyRef("message", "outcome.returned_for_review");
  } else if (pharmacyCase.status === "urgent_bounce_back") {
    outcomeTruthState = "reopened_for_safety";
    patientVisibilityState = "recovery_required";
    closeEligibilityState = "blocked_by_safety";
    resolutionClass = "urgent_gp_action";
    messageRef = versionedCopyRef("message", "outcome.urgent_return");
  } else if (
    pharmacyCase.status === "resolved_by_pharmacy" ||
    pharmacyCase.status === "closed"
  ) {
    outcomeTruthState = "settled_resolved";
    patientVisibilityState = "quiet_result";
    closeEligibilityState = "eligible_pending_projection";
    resolutionClass = "settled_resolved";
    messageRef = versionedCopyRef("message", "outcome.completed");
  }
  return {
    pharmacyOutcomeTruthProjectionId: stableProjectionId("pharmacy_outcome_truth", {
      pharmacyCaseId: pharmacyCase.pharmacyCaseId,
      outcomeTruthState,
      computedAt,
    }),
    pharmacyCaseId: pharmacyCase.pharmacyCaseId,
    latestOutcomeSettlementRef: pharmacyCase.outcomeRef?.refId ?? null,
    latestOutcomeRecordRef: null,
    latestIngestAttemptRef: null,
    outcomeReconciliationGateRef: null,
    outcomeTruthState,
    resolutionClass,
    matchConfidenceBand: outcomeTruthState === "settled_resolved" ? "high" : "low",
    contradictionScore: 0,
    manualReviewState:
      outcomeTruthState === "review_required" ? "required" : outcomeTruthState === "reopened_for_safety" ? "approved_reopen" : null,
    closeEligibilityState,
    patientVisibilityState,
    continuityEvidenceRef:
      dispatchTruth?.continuityEvidenceRef ??
      stableProjectionId("synthetic_outcome_continuity", {
        pharmacyCaseId: pharmacyCase.pharmacyCaseId,
      }),
    audienceMessageRef: messageRef,
    computedAt,
    version: 1,
  };
}

async function loadCurrentCase(
  caseKernelService: Phase6PharmacyCaseKernelService,
  pharmacyCaseId: string,
): Promise<PharmacyCaseBundle> {
  const bundle = await caseKernelService.getPharmacyCase(pharmacyCaseId);
  invariant(
    bundle !== null,
    "PHARMACY_CASE_NOT_FOUND",
    `PharmacyCase ${pharmacyCaseId} was not found.`,
  );
  return bundle;
}

async function loadDispatchTruth(
  dispatchRepositories: Phase6PharmacyDispatchRepositories,
  pharmacyCaseId: string,
): Promise<PharmacyDispatchTruthProjectionSnapshot | null> {
  const current = await dispatchRepositories.getCurrentDispatchTruthProjectionForCase(pharmacyCaseId);
  return current?.toSnapshot() ?? null;
}

async function loadSelectedProviderContext(input: {
  directoryRepositories: Phase6PharmacyDirectoryChoiceRepositories;
  pharmacyCaseId: string;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
}): Promise<{
  choiceTruth: PharmacyChoiceTruthProjection | null;
  consentCheckpoint: PharmacyConsentCheckpoint | null;
  selectedProvider: PharmacyProvider | null;
  selectedExplanation: PharmacyChoiceExplanation | null;
}> {
  const choiceTruth = (
    await input.directoryRepositories.getLatestChoiceTruthProjectionForCase(input.pharmacyCaseId)
  )?.toSnapshot() ?? null;
  const consentCheckpoint = (
    await input.directoryRepositories.getLatestConsentCheckpointForCase(input.pharmacyCaseId)
  )?.toSnapshot() ?? null;
  const selectedProvider = input.selectedProviderRef
    ? (await input.directoryRepositories.getProvider(input.selectedProviderRef.refId))?.toSnapshot() ?? null
    : null;
  const selectedExplanation =
    choiceTruth?.selectedProviderExplanationRef === null ||
    choiceTruth?.selectedProviderExplanationRef === undefined
      ? null
      : (
          await input.directoryRepositories.getChoiceExplanation(
            choiceTruth.selectedProviderExplanationRef.refId,
          )
        )?.toSnapshot() ?? null;
  return {
    choiceTruth,
    consentCheckpoint,
    selectedProvider,
    selectedExplanation,
  };
}

async function loadCorrelationRecord(
  packageRepositories: Phase6PharmacyReferralPackageRepositories,
  pharmacyCaseId: string,
): Promise<PharmacyCorrelationRecordSnapshot | null> {
  const current = await packageRepositories.getCurrentCorrelationRecordForCase(pharmacyCaseId);
  return current?.toSnapshot() ?? null;
}

async function loadOutcomeTruth(
  repositories: Phase6PharmacyOutcomeTruthProjectionReader,
  pharmacyCase: PharmacyCaseSnapshot,
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null,
  recordedAt: string,
): Promise<PharmacyOutcomeTruthProjectionSnapshot> {
  const current = await repositories.getCurrentOutcomeTruthProjectionForCase(
    pharmacyCase.pharmacyCaseId,
  );
  if (current !== null) {
    return current.toSnapshot();
  }
  const synthesized = synthesizeOutcomeTruthProjection({
    pharmacyCase,
    dispatchTruth,
    computedAt: recordedAt,
  });
  await repositories.saveOutcomeTruthProjection(synthesized);
  return synthesized;
}

async function synthesizeReachabilityPlan(input: {
  reachabilityRepositories: ReachabilityDependencies;
  pharmacyCase: PharmacyCaseSnapshot;
  recordedAt: string;
  identityFrozen: boolean;
}): Promise<PharmacyReachabilityPlanSnapshot | null> {
  if (input.pharmacyCase.activeReachabilityDependencyRefs.length === 0) {
    return null;
  }
  const dependencySnapshots = (
    await Promise.all(
      input.pharmacyCase.activeReachabilityDependencyRefs.map(async (dependencyRef) =>
        (await input.reachabilityRepositories.getReachabilityDependency(dependencyRef.refId))?.toSnapshot() ??
        null,
      ),
    )
  ).filter((value): value is ReachabilityDependency => value !== null);

  if (dependencySnapshots.length === 0) {
    return null;
  }

  const dependencyAssessmentPairs = await Promise.all(
    dependencySnapshots.map(async (dependency) => {
      const assessment =
        (await input.reachabilityRepositories.getReachabilityAssessment(
          dependency.currentReachabilityAssessmentRef,
        ))?.toSnapshot() ?? null;
      return { dependency, assessment };
    }),
  );

  const livePairs = dependencyAssessmentPairs.filter(
    (pair): pair is { dependency: ReachabilityDependency; assessment: ReachabilityAssessmentRecord } =>
      pair.assessment !== null,
  );
  if (livePairs.length === 0) {
    return null;
  }

  const dominant = [...livePairs].sort((left, right) => {
    const leftWeight =
      dominantDependencyWeight(mapDependencyPurpose(left.dependency.purpose)) +
      (left.dependency.routeHealthState === "clear" ? 0 : 10);
    const rightWeight =
      dominantDependencyWeight(mapDependencyPurpose(right.dependency.purpose)) +
      (right.dependency.routeHealthState === "clear" ? 0 : 10);
    return rightWeight - leftWeight || compareIso(left.assessment.assessedAt, right.assessment.assessedAt);
  })[0]!;

  const dependencyByPurpose = new Map<ReachabilityDependency["purpose"], ReachabilityDependency>(
    livePairs.map((pair) => [pair.dependency.purpose, pair.dependency]),
  );

  return {
    pharmacyReachabilityPlanId: stableProjectionId("pharmacy_reachability_plan", {
      pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
      reachabilityEpoch: dominant.dependency.reachabilityEpoch,
      recordedAt: input.recordedAt,
    }),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
    patientContactRouteRef: dominant.dependency.requiredRouteRef,
    pharmacyContactDependencyRef:
      dependencyByPurpose.get("pharmacy_contact")?.dependencyId ?? `missing::pharmacy_contact`,
    outcomeConfirmationDependencyRef:
      dependencyByPurpose.get("outcome_confirmation")?.dependencyId ??
      `missing::outcome_confirmation`,
    urgentReturnDependencyRef:
      dependencyByPurpose.get("urgent_return")?.dependencyId ?? `missing::urgent_return`,
    currentReachabilityAssessmentRef: dominant.assessment.reachabilityAssessmentId,
    currentContactRouteSnapshotRef: dominant.assessment.contactRouteSnapshotRef,
    contactRepairJourneyRef: dominant.dependency.repairJourneyRef,
    routeAuthorityState: mapRouteAuthorityState(dominant.assessment.routeAuthorityState),
    deliveryRiskState: mapDeliveryRiskState(dominant.assessment.deliveryRiskState),
    repairState: mapRepairState(dominant.dependency.repairState, input.identityFrozen),
    dominantBrokenDependency:
      dominant.dependency.routeHealthState === "clear"
        ? "none"
        : mapDependencyPurpose(dominant.dependency.purpose),
    lastValidatedAt: dominant.assessment.assessedAt,
    refreshedAt: input.recordedAt,
    version: 1,
  };
}

async function loadReachabilitySupport(input: {
  repositories: Phase6PharmacyPatientStatusRepositories;
  reachabilityRepositories: ReachabilityDependencies;
  pharmacyCase: PharmacyCaseSnapshot;
  recordedAt: string;
  identityFrozen: boolean;
}) {
  const storedPlan = await input.repositories.getCurrentReachabilityPlanForCase(
    input.pharmacyCase.pharmacyCaseId,
  );
  let reachabilityPlan = storedPlan?.toSnapshot() ?? null;
  if (reachabilityPlan === null) {
    reachabilityPlan = await synthesizeReachabilityPlan({
      reachabilityRepositories: input.reachabilityRepositories,
      pharmacyCase: input.pharmacyCase,
      recordedAt: input.recordedAt,
      identityFrozen: input.identityFrozen,
    });
    if (reachabilityPlan !== null) {
      await input.repositories.saveReachabilityPlan(reachabilityPlan);
    }
  }

  if (reachabilityPlan === null) {
    return {
      reachabilityPlan: null,
      dominantDependency: null,
      dominantAssessment: null,
      currentSnapshot: null,
      repairJourneyVerdict: null,
      repairJourneyRef: null,
    };
  }

  const candidateDependencyId =
    reachabilityPlan.dominantBrokenDependency === "pharmacy_contact"
      ? reachabilityPlan.pharmacyContactDependencyRef
      : reachabilityPlan.dominantBrokenDependency === "outcome_confirmation"
        ? reachabilityPlan.outcomeConfirmationDependencyRef
        : reachabilityPlan.dominantBrokenDependency === "urgent_return"
          ? reachabilityPlan.urgentReturnDependencyRef
          : reachabilityPlan.pharmacyContactDependencyRef;

  const dominantDependency =
    (await input.reachabilityRepositories.getReachabilityDependency(candidateDependencyId))?.toSnapshot() ??
    null;
  const dominantAssessment =
    dominantDependency === null
      ? null
      : (
          await input.reachabilityRepositories.getReachabilityAssessment(
            dominantDependency.currentReachabilityAssessmentRef,
          )
        )?.toSnapshot() ?? null;
  const currentSnapshot =
    dominantAssessment === null
      ? null
      : (
          await input.reachabilityRepositories.getContactRouteSnapshot(
            dominantAssessment.contactRouteSnapshotRef,
          )
        )?.toSnapshot() ?? null;

  let repairJourneyVerdict:
    | ReturnType<typeof evaluateContactRouteRepairJourney>
    | null = null;
  let repairJourneyRef: string | null = reachabilityPlan.contactRepairJourneyRef;

  if (dominantDependency !== null && dominantAssessment !== null && dominantDependency.repairJourneyRef) {
    const repairJourney = await input.reachabilityRepositories.getContactRouteRepairJourney(
      dominantDependency.repairJourneyRef,
    );
    const checkpoints =
      repairJourney === undefined
        ? []
        : await input.reachabilityRepositories.listContactRouteVerificationCheckpointsForRepairJourney(
            repairJourney.repairJourneyId,
          );
    const checkpoint =
      checkpoints.length === 0
        ? null
        : [...checkpoints]
            .sort((left, right) =>
              compareIso(left.toSnapshot().evaluatedAt ?? "", right.toSnapshot().evaluatedAt ?? ""),
            )
            .pop() ?? null;
    if (repairJourney !== undefined) {
      repairJourneyVerdict = evaluateContactRouteRepairJourney({
        dependency: ReachabilityDependencyDocument.hydrate(dominantDependency),
        journey: repairJourney,
        assessment: ReachabilityAssessmentRecordDocument.hydrate(dominantAssessment),
        checkpoint: checkpoint as ContactRouteVerificationCheckpointDocument | null,
      });
      repairJourneyRef = repairJourney.toSnapshot().repairJourneyId;
    }
  }

  return {
    reachabilityPlan,
    dominantDependency,
    dominantAssessment,
    currentSnapshot,
    repairJourneyVerdict,
    repairJourneyRef,
  };
}

async function loadIdentityRepairSupport(input: {
  identityRepairRepositories: IdentityRepairDependencies;
  pharmacyCase: PharmacyCaseSnapshot;
}) {
  const branchDisposition =
    input.pharmacyCase.identityRepairBranchDispositionRef === null
      ? null
      : (
          await input.identityRepairRepositories.getIdentityRepairBranchDisposition(
            input.pharmacyCase.identityRepairBranchDispositionRef.refId,
          )
        )?.toSnapshot() ?? null;
  const releaseSettlement =
    input.pharmacyCase.identityRepairReleaseSettlementRef === null
      ? null
      : (
          await input.identityRepairRepositories.getIdentityRepairReleaseSettlement(
            input.pharmacyCase.identityRepairReleaseSettlementRef.refId,
          )
        )?.toSnapshot() ?? null;
  const identityFrozen =
    branchDisposition !== null &&
    branchDisposition.branchState !== "released" &&
    releaseSettlement === null;

  return {
    branchDisposition,
    releaseSettlement,
    identityFrozen,
  };
}

function deriveContinuityFreshness(input: {
  shell: PatientShellConsistencyProjectionSnapshot;
  continuityEvidence: PatientExperienceContinuityEvidenceProjectionSnapshot | null;
}): {
  continuityValidationState: PatientExperienceContinuityValidationState;
  freshnessState: PharmacyPatientContinuityFreshnessState;
} {
  if (input.shell.shellConsistencyState === "blocked") {
    return {
      continuityValidationState: "blocked",
      freshnessState: "blocked",
    };
  }
  const validationState = input.continuityEvidence?.validationState ?? "blocked";
  if (validationState === "blocked") {
    return {
      continuityValidationState: "blocked",
      freshnessState: "blocked",
    };
  }
  if (
    validationState === "stale" ||
    input.shell.shellConsistencyState === "recovery_only" ||
    input.shell.shellConsistencyState === "revalidate_only"
  ) {
    return {
      continuityValidationState: validationState,
      freshnessState: "stale",
    };
  }
  if (validationState === "degraded") {
    return {
      continuityValidationState: validationState,
      freshnessState: "stale",
    };
  }
  return {
    continuityValidationState: validationState,
    freshnessState: "current",
  };
}

function deriveStatusPosture(input: {
  identityFrozen: boolean;
  reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
  shell: PatientShellConsistencyProjectionSnapshot;
  continuityValidationState: PatientExperienceContinuityValidationState;
}): PharmacyPatientStatusStaleOrBlockedPosture {
  if (input.identityFrozen) {
    return "identity_frozen";
  }
  if (
    input.reachabilityPlan !== null &&
    input.reachabilityPlan.dominantBrokenDependency !== "none" &&
    input.reachabilityPlan.repairState !== "clear"
  ) {
    return "repair_required";
  }
  if (
    input.shell.shellConsistencyState === "blocked" ||
    input.continuityValidationState === "blocked"
  ) {
    return "blocked";
  }
  if (
    input.shell.shellConsistencyState !== "live" ||
    input.continuityValidationState === "degraded" ||
    input.continuityValidationState === "stale"
  ) {
    return "stale";
  }
  return "clear";
}

function mapMacroState(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  consentCheckpoint: PharmacyConsentCheckpoint | null;
  outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot;
  reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
  bounceBack: PharmacyBounceBackRecordSnapshot | null;
  identityFrozen: boolean;
  continuityValidationState: PatientExperienceContinuityValidationState;
}): PharmacyPatientMacroState {
  const urgentAction = bounceBackImpliesUrgentAction(
    input.bounceBack,
    input.outcomeTruth,
    input.pharmacyCase,
  );
  if (urgentAction) {
    return "urgent_action";
  }
  if (input.identityFrozen) {
    return "reviewing_next_steps";
  }
  if (
    input.reachabilityPlan !== null &&
    input.reachabilityPlan.dominantBrokenDependency === "urgent_return" &&
    input.reachabilityPlan.repairState !== "clear"
  ) {
    return "urgent_action";
  }

  const consentNeedsRenewal =
    input.consentCheckpoint === null ||
    input.consentCheckpoint.checkpointState !== "satisfied" ||
    input.consentCheckpoint.continuityState !== "current";

  if (
    input.pharmacyCase.status === "eligible_choice_pending" ||
    input.pharmacyCase.status === "provider_selected" ||
    input.pharmacyCase.status === "consent_pending" ||
    input.pharmacyCase.status === "package_ready" ||
    consentNeedsRenewal
  ) {
    return "choose_or_confirm";
  }

  const reviewRequired =
    input.outcomeTruth.outcomeTruthState === "review_required" ||
    input.outcomeTruth.outcomeTruthState === "unmatched" ||
    input.outcomeTruth.outcomeTruthState === "duplicate_ignored" ||
    input.outcomeTruth.outcomeTruthState === "reopened_for_safety" ||
    input.pharmacyCase.status === "outcome_reconciliation_pending" ||
    input.pharmacyCase.status === "unresolved_returned" ||
    input.pharmacyCase.status === "no_contact_return_pending" ||
    input.continuityValidationState !== "trusted" ||
    (input.reachabilityPlan !== null &&
      input.reachabilityPlan.dominantBrokenDependency !== "none" &&
      input.reachabilityPlan.dominantBrokenDependency !== "urgent_return");

  const completedAllowed =
    input.outcomeTruth.outcomeTruthState === "settled_resolved" &&
    input.continuityValidationState === "trusted" &&
    input.pharmacyCase.currentClosureBlockerRefs.length === 0 &&
    input.pharmacyCase.status !== "urgent_bounce_back" &&
    input.pharmacyCase.status !== "no_contact_return_pending" &&
    input.pharmacyCase.status !== "outcome_reconciliation_pending" &&
    !input.identityFrozen &&
    (input.reachabilityPlan === null ||
      (input.reachabilityPlan.dominantBrokenDependency === "none" &&
        input.reachabilityPlan.repairState === "clear"));

  if (completedAllowed) {
    return "completed";
  }
  if (reviewRequired) {
    return "reviewing_next_steps";
  }
  if (
    input.pharmacyCase.status === "dispatch_pending" ||
    input.pharmacyCase.status === "referred" ||
    input.pharmacyCase.status === "consultation_outcome_pending"
  ) {
    return "action_in_progress";
  }
  return "reviewing_next_steps";
}

function buildPatientProviderSummary(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  selectedProvider: PharmacyProvider | null;
  selectedExplanation: PharmacyChoiceExplanation | null;
  shell: PatientShellConsistencyProjectionSnapshot;
  identityFrozen: boolean;
  recordedAt: string;
}): PharmacyPatientProviderSummarySnapshot {
  const detailVisibilityState: PharmacyPatientProviderSummaryDetailVisibilityState =
    input.selectedProvider === null
      ? "hidden"
      : input.identityFrozen
        ? "provenance_only"
        : "full";
  return {
    pharmacyPatientProviderSummaryId: stableProjectionId("pharmacy_patient_provider_summary", {
      pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
      providerRef: input.selectedProvider?.providerId ?? null,
      detailVisibilityState,
      recordedAt: input.recordedAt,
    }),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
    providerRef:
      input.selectedProvider === null
        ? null
        : makeRef("PharmacyProvider", input.selectedProvider.providerId, TASK_343),
    detailVisibilityState,
    providerDisplayName: input.selectedProvider?.displayName ?? null,
    openingState: input.selectedProvider?.openingState ?? null,
    consultationModeHints:
      detailVisibilityState === "full" ? [...(input.selectedProvider?.consultationModeHints ?? [])] : [],
    contactEndpoints:
      detailVisibilityState === "full" ? [...(input.selectedProvider?.contactEndpoints ?? [])] : [],
    patientReasonCueRefs: [...(input.selectedExplanation?.patientReasonCueRefs ?? [])],
    warningCopyRef: input.selectedExplanation?.warningCopyRef ?? null,
    selectedAnchorRef: input.shell.selectedAnchorRef,
    computedAt: input.recordedAt,
    version: 1,
  };
}

function buildReferralReferenceSummary(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
  correlationRecord: PharmacyCorrelationRecordSnapshot | null;
  shell: PatientShellConsistencyProjectionSnapshot;
  identityFrozen: boolean;
  recordedAt: string;
}): PharmacyPatientReferralReferenceSummarySnapshot {
  const outboundReference =
    input.correlationRecord?.outboundReferenceSet[0] ??
    (input.dispatchTruth?.outboundReferenceSetHash
      ? input.dispatchTruth.outboundReferenceSetHash.slice(0, 12).toUpperCase()
      : null);
  const displayMode: PharmacyPatientReferralReferenceDisplayMode = input.identityFrozen
    ? "suppressed"
    : outboundReference === null
      ? "pending"
      : "available";
  return {
    pharmacyPatientReferralReferenceSummaryId: stableProjectionId(
      "pharmacy_patient_referral_reference_summary",
      {
        pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
        displayMode,
        outboundReference,
      },
    ),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
    dispatchTruthProjectionRef:
      input.dispatchTruth === null
        ? null
        : makeRef(
            "PharmacyDispatchTruthProjection",
            input.dispatchTruth.pharmacyDispatchTruthProjectionId,
            TASK_343,
          ),
    correlationRecordRef:
      input.correlationRecord === null
        ? null
        : makeRef("PharmacyCorrelationRecord", input.correlationRecord.correlationId, TASK_343),
    displayMode,
    displayReference: displayMode === "available" ? outboundReference : null,
    outboundReferenceSetHash:
      input.correlationRecord?.outboundReferenceSetHash ?? input.dispatchTruth?.outboundReferenceSetHash ?? null,
    selectedAnchorRef: input.shell.selectedAnchorRef,
    computedAt: input.recordedAt,
    version: 1,
  };
}

function buildContinuityProjection(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  shell: PatientShellConsistencyProjectionSnapshot;
  continuityEvidence: PatientExperienceContinuityEvidenceProjectionSnapshot | null;
  continuityValidationState: PatientExperienceContinuityValidationState;
  freshnessState: PharmacyPatientContinuityFreshnessState;
  governingStatusTruthRevision: string;
  recordedAt: string;
}): PharmacyPatientContinuityProjectionSnapshot {
  return {
    pharmacyPatientContinuityProjectionId: stableProjectionId("pharmacy_patient_continuity_projection", {
      pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
      governingStatusTruthRevision: input.governingStatusTruthRevision,
    }),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
    patientShellConsistencyProjectionRef: input.shell.patientShellConsistencyProjectionId,
    experienceContinuityProjectionRef:
      input.continuityEvidence?.patientExperienceContinuityEvidenceProjectionId ?? null,
    selectedAnchorRef: input.shell.selectedAnchorRef,
    activeRouteFamilyRef: input.shell.activeRouteFamilyRef,
    shellConsistencyState: input.shell.shellConsistencyState,
    continuityValidationState: input.continuityValidationState,
    freshnessState: input.freshnessState,
    governingStatusTruthRevision: input.governingStatusTruthRevision,
    computedAt: input.recordedAt,
    version: 1,
  };
}

function buildReachabilityRepairProjection(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
  dominantDependency: ReachabilityDependency | null;
  dominantAssessment: ReachabilityAssessmentRecord | null;
  currentSnapshot: ContactRouteSnapshot | null;
  repairJourneyVerdict: ReturnType<typeof evaluateContactRouteRepairJourney> | null;
  providerSummary: PharmacyPatientProviderSummarySnapshot;
  referralReferenceSummary: PharmacyPatientReferralReferenceSummarySnapshot;
  shell: PatientShellConsistencyProjectionSnapshot;
  identityFrozen: boolean;
  governingStatusTruthRevision: string;
  recordedAt: string;
}): PharmacyPatientReachabilityRepairProjectionSnapshot {
  let repairProjectionState: PharmacyPatientRepairProjectionState = "not_required";
  let nextRepairAction: PharmacyPatientReachabilityRepairProjectionSnapshot["nextRepairAction"] = "none";
  if (input.identityFrozen) {
    repairProjectionState = "identity_frozen";
  } else if (
    input.reachabilityPlan !== null &&
    input.reachabilityPlan.dominantBrokenDependency !== "none" &&
    input.reachabilityPlan.repairState !== "clear"
  ) {
    if (input.repairJourneyVerdict !== null) {
      nextRepairAction = input.repairJourneyVerdict.nextAction;
      repairProjectionState =
        nextRepairAction === "verify_candidate_route"
          ? "awaiting_verification"
          : nextRepairAction === "resume_original_action"
            ? "rebound_pending"
            : nextRepairAction === "manual_recovery"
              ? "manual_recovery"
              : "ready";
    } else {
      repairProjectionState = "ready";
      nextRepairAction = "collect_route";
    }
  }

  return {
    pharmacyPatientReachabilityRepairProjectionId: stableProjectionId(
      "pharmacy_patient_reachability_repair_projection",
      {
        pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
        governingStatusTruthRevision: input.governingStatusTruthRevision,
      },
    ),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
    dominantBrokenDependency: input.reachabilityPlan?.dominantBrokenDependency ?? "none",
    reachabilityDependencyRef: input.dominantDependency?.dependencyId ?? null,
    currentContactRouteSnapshotRef: input.currentSnapshot?.contactRouteSnapshotId ?? null,
    currentReachabilityAssessmentRef: input.dominantAssessment?.reachabilityAssessmentId ?? null,
    contactRepairJourneyRef: input.repairJourneyVerdict?.repairJourneyId ?? null,
    selectedProviderSummaryRef:
      input.providerSummary.providerRef === null
        ? null
        : makeRef(
            "PharmacyPatientProviderSummary",
            input.providerSummary.pharmacyPatientProviderSummaryId,
            TASK_351,
          ),
    referralReferenceSummaryRef: makeRef(
      "PharmacyPatientReferralReferenceSummary",
      input.referralReferenceSummary.pharmacyPatientReferralReferenceSummaryId,
      TASK_351,
    ),
    referralAnchorRef: input.shell.selectedAnchorRef,
    resumeContinuationRef: input.dominantDependency?.resumeContinuationRef ?? null,
    selectedAnchorRef: input.shell.selectedAnchorRef,
    governingStatusTruthRevision: input.governingStatusTruthRevision,
    nextRepairAction,
    repairProjectionState,
    computedAt: input.recordedAt,
    version: 1,
  };
}

function buildInstructionCopy(input: {
  macroState: PharmacyPatientMacroState;
  pharmacyCase: PharmacyCaseSnapshot;
  selectedProvider: PharmacyProvider | null;
  providerSummary: PharmacyPatientProviderSummarySnapshot;
  statusPosture: PharmacyPatientStatusStaleOrBlockedPosture;
  reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
  repairProjection: PharmacyPatientReachabilityRepairProjectionSnapshot;
  outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot;
  bounceBack: PharmacyBounceBackRecordSnapshot | null;
  identityFrozen: boolean;
}): Omit<PharmacyPatientInstructionPanelSnapshot, "pharmacyPatientInstructionPanelId" | "pharmacyCaseRef" | "patientStatusProjectionRef" | "providerSummaryRef" | "repairProjectionRef" | "referralReferenceSummaryRef" | "contentGrammarVersionRef" | "generatedAt" | "version"> {
  const providerName = input.selectedProvider?.displayName ?? "the pharmacy";
  let headlineCode = "status.waiting";
  let headlineText = "We’re getting the next pharmacy step ready.";
  let nextStepCode = "next_step.wait";
  let nextStepText = "You do not need to book an appointment. We’ll show the next safe step here.";
  let whoOrWhereCode: string | null = null;
  let whoOrWhereText: string | null = null;
  let whenCode: string | null = null;
  let whenText: string | null = null;
  let warningCode: string | null = null;
  let warningText: string | null = null;
  let reviewCode: string | null = null;
  let reviewText: string | null = null;
  let calmCode: string | null = null;
  let calmText: string | null = null;

  if (input.identityFrozen) {
    headlineCode = "status.identity_frozen";
    headlineText = "We’re checking this referral before any more pharmacy action happens.";
    nextStepCode = "next_step.identity_frozen";
    nextStepText = "Use support or recovery guidance in this request shell. We’ve paused live pharmacy actions for safety.";
    warningCode = "warning.identity_frozen";
    warningText = `We’re keeping ${providerName} as read-only background context while identity checks are completed.`;
  } else if (input.statusPosture === "repair_required") {
    headlineCode = "status.contact_repair";
    headlineText = "Update or confirm how we can contact you.";
    nextStepCode = "next_step.contact_repair";
    nextStepText = "Complete the contact repair step so this pharmacy referral can continue safely.";
    warningCode = "warning.contact_repair";
    warningText =
      "We cannot rely on your current contact details for this pharmacy referral until repair is complete.";
    reviewCode = "review.contact_repair";
    reviewText =
      input.repairProjection.nextRepairAction === "verify_candidate_route"
        ? "We’ve sent a route check. Finish verification to return to the pharmacy step."
        : "Your pharmacy summary stays here while you repair the contact route in the same request shell.";
  } else if (input.macroState === "choose_or_confirm") {
    headlineCode = "status.choose_or_confirm";
    headlineText =
      input.selectedProvider === null
        ? "Choose a pharmacy to continue."
        : `Confirm that you still want ${providerName} to receive this referral.`;
    nextStepCode = "next_step.choose_or_confirm";
    nextStepText =
      input.selectedProvider === null
        ? "Choose a pharmacy from the available list so we can continue."
        : "Renew or confirm your pharmacy consent so we can continue safely.";
    whoOrWhereCode = "where.provider_selection";
    whoOrWhereText =
      input.selectedProvider === null
        ? "You can review the available pharmacies and choose the one that works best for you."
        : `${providerName} remains selected. We’ll keep that choice visible while you confirm consent.`;
  } else if (input.macroState === "action_in_progress") {
    headlineCode =
      input.pharmacyCase.status === "dispatch_pending"
        ? "status.dispatch_pending"
        : "status.action_in_progress";
    headlineText =
      input.pharmacyCase.status === "dispatch_pending"
        ? `We’re sending your referral to ${providerName}.`
        : `${providerName} is the current pharmacy for this referral.`;
    nextStepCode = "next_step.action_in_progress";
    nextStepText =
      input.pharmacyCase.status === "dispatch_pending" ||
      input.pharmacyCase.status === "referred"
        ? `Follow the referral instructions for ${providerName}. This is not a booked appointment.`
        : "Keep checking this request shell for the latest safe update from the pharmacy route.";
    whoOrWhereCode = "where.contact_or_consult";
    whoOrWhereText =
      input.selectedProvider === null
        ? null
        : `The pharmacist may speak to you by phone, video or in person, depending on what is safest and available.`;
    whenCode = "when.action_in_progress";
    whenText =
      input.pharmacyCase.status === "dispatch_pending"
        ? "Wait for the referral handoff to finish before you act on pharmacy contact details."
        : "If the pharmacy needs to speak to you, they will use the current contact route held for this referral.";
    warningCode = input.providerSummary.warningCopyRef;
    warningText =
      input.providerSummary.warningCopyRef === null
        ? null
        : "There are important notes about this pharmacy choice. Review them before you continue.";
  } else if (input.macroState === "reviewing_next_steps") {
    headlineCode = "status.reviewing_next_steps";
    headlineText = "We’re reviewing the next step from the pharmacy route.";
    nextStepCode = "next_step.reviewing_next_steps";
    nextStepText =
      "Keep this request available. We’ll show the next safe step here once the review is complete.";
    reviewCode = "review.outcome_or_return";
    reviewText =
      input.outcomeTruth.outcomeTruthState === "review_required"
        ? "We’re reviewing an update from the pharmacy before we show a final result."
        : input.bounceBack !== null
          ? "The pharmacy route has returned work for review. We’re keeping your chosen pharmacy visible while that happens."
          : "This pharmacy route cannot show calm completion yet.";
  } else if (input.macroState === "completed") {
    headlineCode = "status.completed";
    headlineText = "The pharmacy outcome has been recorded.";
    nextStepCode = "next_step.completed";
    nextStepText = "You do not need to do anything else right now unless your symptoms change.";
    calmCode = "calm.completed";
    calmText =
      "We’ve kept the pharmacy summary here as a record of the completed referral outcome.";
  } else if (input.macroState === "urgent_action") {
    headlineCode = "status.urgent_action";
    headlineText = "Please act on this urgently.";
    nextStepCode = "next_step.urgent_action";
    nextStepText =
      "Do not wait for routine pharmacy contact. Follow the urgent return guidance shown in this request shell now.";
    warningCode = "warning.urgent_action";
    warningText =
      input.bounceBack?.bounceBackType === "safeguarding_concern"
        ? "We’re not keeping this in routine pharmacy flow because it needs urgent review."
        : "The pharmacy route has escalated this so routine progress guidance is no longer safe.";
  }

  const symptomsWorsenCode =
    input.macroState === "urgent_action"
      ? "worsen.urgent"
      : "worsen.default";
  const symptomsWorsenText =
    input.macroState === "urgent_action"
      ? "If symptoms get worse or you feel you need urgent help, use NHS 111 or contact your GP practice straight away."
      : "If your symptoms get worse while this pharmacy referral is in progress, use NHS 111 or contact your GP practice.";

  return {
    macroState: input.macroState,
    headlineCopyRef: versionedCopyRef("headline", headlineCode),
    headlineText,
    nextStepCopyRef: versionedCopyRef("next_step", nextStepCode),
    nextStepText,
    whoOrWhereCopyRef: whoOrWhereCode === null ? null : versionedCopyRef("where_or_who", whoOrWhereCode),
    whoOrWhereText,
    whenExpectationCopyRef: whenCode === null ? null : versionedCopyRef("when", whenCode),
    whenExpectationText: whenText,
    symptomsWorsenCopyRef: versionedCopyRef("worsen", symptomsWorsenCode),
    symptomsWorsenText,
    warningCopyRef: warningCode === null ? null : versionedCopyRef("warning", warningCode),
    warningText,
    reviewCopyRef: reviewCode === null ? null : versionedCopyRef("review", reviewCode),
    reviewText,
    calmCompletionCopyRef: calmCode === null ? null : versionedCopyRef("calm", calmCode),
    calmCompletionText: calmText,
  };
}

function buildStatusProjection(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
  outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot | null;
  bounceBack: PharmacyBounceBackRecordSnapshot | null;
  reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
  macroState: PharmacyPatientMacroState;
  nextSafeActionCopyRef: string;
  warningCopyRef: string | null;
  reviewCopyRef: string | null;
  continuityEvidenceRef: string;
  staleOrBlockedPosture: PharmacyPatientStatusStaleOrBlockedPosture;
  dominantReachabilityDependencyRef: string | null;
  lastMeaningfulEventAt: string;
  calmCopyAllowed: boolean;
  currentIdentityRepairDispositionRef: string | null;
  audienceMessageRef: string;
  recordedAt: string;
}): PharmacyPatientStatusProjectionSnapshot {
  return {
    pharmacyPatientStatusProjectionId: stableProjectionId("pharmacy_patient_status", {
      pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
      macroState: input.macroState,
      posture: input.staleOrBlockedPosture,
      recordedAt: input.recordedAt,
    }),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
    selectedProviderRef: input.selectedProviderRef,
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
            TASK_343,
          ),
    bounceBackRecordRef:
      input.bounceBack === null
        ? null
        : makeRef("PharmacyBounceBackRecord", input.bounceBack.bounceBackRecordId, TASK_344),
    reachabilityPlanRef:
      input.reachabilityPlan === null
        ? null
        : makeRef("PharmacyReachabilityPlan", input.reachabilityPlan.pharmacyReachabilityPlanId, TASK_344),
    currentMacroState: input.macroState,
    nextSafeActionCopyRef: input.nextSafeActionCopyRef,
    warningCopyRef: input.warningCopyRef,
    reviewCopyRef: input.reviewCopyRef,
    continuityEvidenceRef: input.continuityEvidenceRef,
    staleOrBlockedPosture: input.staleOrBlockedPosture,
    dominantReachabilityDependencyRef: input.dominantReachabilityDependencyRef,
    lastMeaningfulEventAt: input.lastMeaningfulEventAt,
    calmCopyAllowed: input.calmCopyAllowed,
    currentClosureBlockerRefs: [...input.pharmacyCase.currentClosureBlockerRefs.map((value) => value.refId)],
    currentIdentityRepairDispositionRef: input.currentIdentityRepairDispositionRef,
    audienceMessageRef: input.audienceMessageRef,
    computedAt: input.recordedAt,
    version: 1,
  };
}

function buildAuditEventIfNeeded(input: {
  previousStatus: PharmacyPatientStatusProjectionSnapshot | null;
  nextStatus: PharmacyPatientStatusProjectionSnapshot;
  pharmacyCaseId: string;
  governingStatusTruthRevision: string;
  recordedAt: string;
}): PharmacyPatientStatusAuditEventSnapshot | null {
  if (
    input.previousStatus !== null &&
    input.previousStatus.currentMacroState === input.nextStatus.currentMacroState &&
    input.previousStatus.dominantReachabilityDependencyRef ===
      input.nextStatus.dominantReachabilityDependencyRef &&
    input.previousStatus.staleOrBlockedPosture === input.nextStatus.staleOrBlockedPosture
  ) {
    return null;
  }
  return {
    pharmacyPatientStatusAuditEventId: stableProjectionId("pharmacy_patient_status_audit", {
      pharmacyCaseId: input.pharmacyCaseId,
      recordedAt: input.recordedAt,
      governingStatusTruthRevision: input.governingStatusTruthRevision,
    }),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCaseId, TASK_342),
    previousMacroState: input.previousStatus?.currentMacroState ?? "none",
    nextMacroState: input.nextStatus.currentMacroState,
    previousDominantReachabilityDependencyRef:
      input.previousStatus?.dominantReachabilityDependencyRef ?? null,
    nextDominantReachabilityDependencyRef: input.nextStatus.dominantReachabilityDependencyRef,
    previousStaleOrBlockedPosture: input.previousStatus?.staleOrBlockedPosture ?? "none",
    nextStaleOrBlockedPosture: input.nextStatus.staleOrBlockedPosture,
    governingStatusTruthRevision: input.governingStatusTruthRevision,
    recordedAt: input.recordedAt,
    version: 1,
  };
}

export function createPhase6PharmacyPatientStatusService(
  input: Phase6PharmacyPatientStatusServiceDependencies = {},
): Phase6PharmacyPatientStatusService {
  const repositories = input.repositories ?? createPhase6PharmacyPatientStatusStore();
  const outcomeRepositories = input.outcomeRepositories ?? repositories;
  const caseKernelService =
    input.caseKernelService ??
    createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });
  const directoryRepositories =
    input.directoryRepositories ?? createPhase6PharmacyDirectoryChoiceStore();
  const dispatchRepositories =
    input.dispatchRepositories ?? createPhase6PharmacyDispatchStore();
  const packageRepositories =
    input.packageRepositories ?? createPhase6PharmacyReferralPackageStore();
  const reachabilityRepositories =
    input.reachabilityRepositories ?? createReachabilityStore();
  const identityRepairRepositories =
    input.identityRepairRepositories ?? createIdentityRepairStore();
  const idGenerator =
    input.idGenerator ?? createDeterministicBackboneIdGenerator("phase6-pharmacy-patient-status");

  return {
    async projectPatientStatus(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const caseBundle = await loadCurrentCase(caseKernelService, command.pharmacyCaseId);
      const pharmacyCase = caseBundle.pharmacyCase;
      const shellProjection = await repositories.getPatientShellConsistencyProjection(
        command.patientShellConsistencyProjectionId,
      );
      invariant(
        shellProjection !== null,
        "PATIENT_SHELL_CONSISTENCY_PROJECTION_NOT_FOUND",
        `PatientShellConsistencyProjection ${command.patientShellConsistencyProjectionId} was not found.`,
      );
      const shell = shellProjection.toSnapshot();
      const previousStatus = (
        await repositories.getCurrentPatientStatusProjectionForCase(pharmacyCase.pharmacyCaseId)
      )?.toSnapshot() ?? null;

      const dispatchTruth = await loadDispatchTruth(dispatchRepositories, pharmacyCase.pharmacyCaseId);
      const correlationRecord = await loadCorrelationRecord(
        packageRepositories,
        pharmacyCase.pharmacyCaseId,
      );
      const previousContinuityProjection = (
        await repositories.getCurrentPatientContinuityProjectionForCase(pharmacyCase.pharmacyCaseId)
      )?.toSnapshot() ?? null;
      const previousReferralReferenceSummary = (
        await repositories.getCurrentPatientReferralReferenceSummaryForCase(
          pharmacyCase.pharmacyCaseId,
        )
      )?.toSnapshot() ?? null;
      const previousRepairProjection = (
        await repositories.getCurrentPatientReachabilityRepairProjectionForCase(
          pharmacyCase.pharmacyCaseId,
        )
      )?.toSnapshot() ?? null;
      const previousInstructionPanel = (
        await repositories.getCurrentPatientInstructionPanelForCase(pharmacyCase.pharmacyCaseId)
      )?.toSnapshot() ?? null;

      const identityRepair = await loadIdentityRepairSupport({
        identityRepairRepositories,
        pharmacyCase,
      });

      const reachabilitySupport = await loadReachabilitySupport({
        repositories,
        reachabilityRepositories,
        pharmacyCase,
        recordedAt,
        identityFrozen: identityRepair.identityFrozen,
      });

      const selectedProviderContext = await loadSelectedProviderContext({
        directoryRepositories,
        pharmacyCaseId: pharmacyCase.pharmacyCaseId,
        selectedProviderRef: pharmacyCase.selectedProviderRef,
      });

      const outcomeTruth = await loadOutcomeTruth(
        outcomeRepositories,
        pharmacyCase,
        dispatchTruth,
        recordedAt,
      );

      const continuityEvidenceRef =
        outcomeTruth.outcomeTruthState !== "waiting_for_outcome"
          ? outcomeTruth.continuityEvidenceRef
          : dispatchTruth?.continuityEvidenceRef ??
            stableProjectionId("synthetic_patient_continuity_evidence", {
              pharmacyCaseId: pharmacyCase.pharmacyCaseId,
            });

      const continuityEvidenceProjection = (
        await repositories.getPatientExperienceContinuityProjection(continuityEvidenceRef)
      )?.toSnapshot() ?? null;

      const continuityVerdict = deriveContinuityFreshness({
        shell,
        continuityEvidence: continuityEvidenceProjection,
      });

      const staleOrBlockedPosture = deriveStatusPosture({
        identityFrozen: identityRepair.identityFrozen,
        reachabilityPlan: reachabilitySupport.reachabilityPlan,
        shell,
        continuityValidationState: continuityVerdict.continuityValidationState,
      });

      const macroState = mapMacroState({
        pharmacyCase,
        consentCheckpoint: selectedProviderContext.consentCheckpoint,
        outcomeTruth,
        reachabilityPlan: reachabilitySupport.reachabilityPlan,
        bounceBack:
          pharmacyCase.bounceBackRef === null
            ? (await repositories.getCurrentBounceBackRecordForCase(pharmacyCase.pharmacyCaseId))?.toSnapshot() ??
              null
            : (await repositories.getBounceBackRecord(pharmacyCase.bounceBackRef.refId))?.toSnapshot() ??
              null,
        identityFrozen: identityRepair.identityFrozen,
        continuityValidationState: continuityVerdict.continuityValidationState,
      });

      const providerSummary = buildPatientProviderSummary({
        pharmacyCase,
        selectedProvider: selectedProviderContext.selectedProvider,
        selectedExplanation: selectedProviderContext.selectedExplanation,
        shell,
        identityFrozen: identityRepair.identityFrozen,
        recordedAt,
      });
      await repositories.savePatientProviderSummary(providerSummary);

      const referralReferenceSummary = buildReferralReferenceSummary({
        pharmacyCase,
        dispatchTruth,
        correlationRecord,
        shell,
        identityFrozen: identityRepair.identityFrozen,
        recordedAt,
      });
      const versionedReferralReferenceSummary = withMonotoneVersion(
        referralReferenceSummary,
        previousReferralReferenceSummary,
        (value) => value.pharmacyPatientReferralReferenceSummaryId,
      );
      await repositories.savePatientReferralReferenceSummary(versionedReferralReferenceSummary);

      const bounceBack =
        pharmacyCase.bounceBackRef === null
          ? (await repositories.getCurrentBounceBackRecordForCase(pharmacyCase.pharmacyCaseId))?.toSnapshot() ??
            null
          : (await repositories.getBounceBackRecord(pharmacyCase.bounceBackRef.refId))?.toSnapshot() ?? null;

      const lastMeaningfulEventAt =
        latestIso(
          bounceBack?.updatedAt,
          outcomeTruth.computedAt,
          dispatchTruth?.computedAt,
          selectedProviderContext.consentCheckpoint?.evaluatedAt,
          selectedProviderContext.choiceTruth?.computedAt,
          pharmacyCase.updatedAt,
        ) ?? recordedAt;

      const copyDraft = buildInstructionCopy({
        macroState,
        pharmacyCase,
        selectedProvider: selectedProviderContext.selectedProvider,
        providerSummary,
        statusPosture: staleOrBlockedPosture,
        reachabilityPlan: reachabilitySupport.reachabilityPlan,
        repairProjection: {
          pharmacyPatientReachabilityRepairProjectionId: "",
          pharmacyCaseRef: makeRef("PharmacyCase", pharmacyCase.pharmacyCaseId, TASK_342),
          dominantBrokenDependency:
            reachabilitySupport.reachabilityPlan?.dominantBrokenDependency ?? "none",
          reachabilityDependencyRef: reachabilitySupport.dominantDependency?.dependencyId ?? null,
          currentContactRouteSnapshotRef:
            reachabilitySupport.currentSnapshot?.contactRouteSnapshotId ?? null,
          currentReachabilityAssessmentRef:
            reachabilitySupport.dominantAssessment?.reachabilityAssessmentId ?? null,
          contactRepairJourneyRef: reachabilitySupport.repairJourneyRef,
          selectedProviderSummaryRef: null,
          referralReferenceSummaryRef: null,
          referralAnchorRef: shell.selectedAnchorRef,
          resumeContinuationRef:
            reachabilitySupport.dominantDependency?.resumeContinuationRef ?? null,
          selectedAnchorRef: shell.selectedAnchorRef,
          governingStatusTruthRevision: "",
          nextRepairAction:
            reachabilitySupport.repairJourneyVerdict?.nextAction ?? "none",
          repairProjectionState: "not_required",
          computedAt: recordedAt,
          version: 1,
        },
        outcomeTruth,
        bounceBack,
        identityFrozen: identityRepair.identityFrozen,
      });

      const calmCopyAllowed =
        macroState === "completed" ||
        (macroState === "action_in_progress" && staleOrBlockedPosture === "clear");

      const statusTuple = {
        pharmacyCaseId: pharmacyCase.pharmacyCaseId,
        macroState,
        staleOrBlockedPosture,
        dominantBrokenDependency:
          reachabilitySupport.reachabilityPlan?.dominantBrokenDependency ?? "none",
        dispatchTruthProjectionId: dispatchTruth?.pharmacyDispatchTruthProjectionId ?? null,
        outcomeTruthProjectionId: outcomeTruth.pharmacyOutcomeTruthProjectionId,
        bounceBackRecordId: bounceBack?.bounceBackRecordId ?? null,
        continuityEvidenceRef,
        patientShellConsistencyProjectionId: shell.patientShellConsistencyProjectionId,
      };
      const governingStatusTruthRevision = stableReviewDigest(statusTuple);

      const continuityProjection = withMonotoneVersion(
        buildContinuityProjection({
          pharmacyCase,
          shell,
          continuityEvidence: continuityEvidenceProjection,
          continuityValidationState: continuityVerdict.continuityValidationState,
          freshnessState: continuityVerdict.freshnessState,
          governingStatusTruthRevision,
          recordedAt,
        }),
        previousContinuityProjection,
        (value) => value.pharmacyPatientContinuityProjectionId,
      );
      await repositories.savePatientContinuityProjection(continuityProjection);

      const statusProjection = buildStatusProjection({
        pharmacyCase,
        selectedProviderRef:
          selectedProviderContext.selectedProvider === null
            ? null
            : makeRef(
                "PharmacyProvider",
                selectedProviderContext.selectedProvider.providerId,
                TASK_343,
              ),
        dispatchTruth,
        outcomeTruth,
        bounceBack,
        reachabilityPlan: reachabilitySupport.reachabilityPlan,
        macroState,
        nextSafeActionCopyRef: copyDraft.nextStepCopyRef,
        warningCopyRef: copyDraft.warningCopyRef,
        reviewCopyRef: copyDraft.reviewCopyRef,
        continuityEvidenceRef,
        staleOrBlockedPosture,
        dominantReachabilityDependencyRef:
          reachabilitySupport.dominantDependency?.dependencyId ?? null,
        lastMeaningfulEventAt,
        calmCopyAllowed,
        currentIdentityRepairDispositionRef:
          identityRepair.branchDisposition?.branchDispositionId ?? null,
        audienceMessageRef: copyDraft.headlineCopyRef,
        recordedAt,
      });
      await repositories.savePatientStatusProjection(statusProjection);

      const repairProjection = buildReachabilityRepairProjection({
        pharmacyCase,
        reachabilityPlan: reachabilitySupport.reachabilityPlan,
        dominantDependency: reachabilitySupport.dominantDependency,
        dominantAssessment: reachabilitySupport.dominantAssessment,
        currentSnapshot: reachabilitySupport.currentSnapshot,
        repairJourneyVerdict: reachabilitySupport.repairJourneyVerdict,
        providerSummary,
        referralReferenceSummary,
        shell,
        identityFrozen: identityRepair.identityFrozen,
        governingStatusTruthRevision,
        recordedAt,
      });
      const versionedRepairProjection = withMonotoneVersion(
        repairProjection,
        previousRepairProjection,
        (value) => value.pharmacyPatientReachabilityRepairProjectionId,
      );
      await repositories.savePatientReachabilityRepairProjection(versionedRepairProjection);

      const instructionPanel = withMonotoneVersion<PharmacyPatientInstructionPanelSnapshot>(
        {
        pharmacyPatientInstructionPanelId: stableProjectionId("pharmacy_patient_instruction_panel", {
          pharmacyCaseId: pharmacyCase.pharmacyCaseId,
          governingStatusTruthRevision,
        }),
        pharmacyCaseRef: makeRef("PharmacyCase", pharmacyCase.pharmacyCaseId, TASK_342),
        patientStatusProjectionRef: makeRef(
          "PharmacyPatientStatusProjection",
          statusProjection.pharmacyPatientStatusProjectionId,
          TASK_351,
        ),
        providerSummaryRef:
          providerSummary.providerRef === null
            ? null
            : makeRef(
                "PharmacyPatientProviderSummary",
                providerSummary.pharmacyPatientProviderSummaryId,
                TASK_351,
              ),
        repairProjectionRef:
          repairProjection.repairProjectionState === "not_required"
            ? null
            : makeRef(
                "PharmacyPatientReachabilityRepairProjection",
                repairProjection.pharmacyPatientReachabilityRepairProjectionId,
                TASK_351,
              ),
        referralReferenceSummaryRef: makeRef(
          "PharmacyPatientReferralReferenceSummary",
          referralReferenceSummary.pharmacyPatientReferralReferenceSummaryId,
          TASK_351,
        ),
        contentGrammarVersionRef: DEFAULT_COPY_GRAMMAR_VERSION_REF,
        ...copyDraft,
        generatedAt: recordedAt,
        version: 1,
      },
        previousInstructionPanel,
        (value) => value.pharmacyPatientInstructionPanelId,
      );
      await repositories.savePatientInstructionPanel(instructionPanel);

      const auditEvent = buildAuditEventIfNeeded({
        previousStatus,
        nextStatus: statusProjection,
        pharmacyCaseId: pharmacyCase.pharmacyCaseId,
        governingStatusTruthRevision,
        recordedAt,
      });
      if (auditEvent !== null) {
        await repositories.savePatientStatusAuditEvent(auditEvent);
      }

      return {
        pharmacyCase,
        patientStatusProjection: statusProjection,
        providerSummary,
        referralReferenceSummary: versionedReferralReferenceSummary,
        reachabilityRepairProjection: versionedRepairProjection,
        continuityProjection,
        instructionPanel,
        outcomeTruthProjection: outcomeTruth,
        reachabilityPlan: reachabilitySupport.reachabilityPlan,
      };
    },

    async getPatientPharmacyStatus(pharmacyCaseId) {
      return (
        await repositories.getCurrentPatientStatusProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },

    async getPatientInstructionPanel(pharmacyCaseId) {
      return (
        await repositories.getCurrentPatientInstructionPanelForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },

    async getPatientContactRouteRepairEntry(pharmacyCaseId) {
      return (
        await repositories.getCurrentPatientReachabilityRepairProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },

    async getPatientReferralReferenceSummary(pharmacyCaseId) {
      return (
        await repositories.getCurrentPatientReferralReferenceSummaryForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },
  };
}
