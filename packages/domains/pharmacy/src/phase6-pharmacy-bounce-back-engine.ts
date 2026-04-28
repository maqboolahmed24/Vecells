import { createHash } from "node:crypto";

import {
  RequestAggregate,
  RequestBackboneInvariantError,
  RequestLineageAggregate,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  EpisodeAggregate,
  createLifecycleCoordinatorService,
  createLifecycleCoordinatorStore,
  createReachabilityGovernorService,
  createReachabilityStore,
  type LifecycleCoordinatorDependencies,
  type LifecycleCoordinatorService,
  type ReachabilityDependencies,
  type ReachabilityGovernorService,
  type RouteHealthState,
} from "@vecells/domain-identity-access";

import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  type AggregateRef,
  type PharmacyAuthorityCommandInput,
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
  type PharmacyDispatchSettlementSnapshot,
  type PharmacyDispatchTruthProjectionSnapshot,
} from "./phase6-pharmacy-dispatch-engine";
import {
  createPhase6PharmacyOutcomeStore,
  type Phase6PharmacyOutcomeRepositories,
  type PharmacyOutcomeClassificationState,
  type PharmacyOutcomeSettlementSnapshot,
  type PharmacyOutcomeTrustClass,
} from "./phase6-pharmacy-outcome-reconciliation-engine";
import {
  createPhase6PharmacyPatientStatusService,
  createPhase6PharmacyPatientStatusStore,
  type PatientShellConsistencyProjectionSnapshot,
  type Phase6PharmacyPatientStatusRepositories,
  type Phase6PharmacyPatientStatusService,
  type PharmacyBounceBackType,
  type PharmacyBounceBackRecordSnapshot,
  type PharmacyPatientStatusBundle,
  type PharmacyPatientStatusProjectionSnapshot,
  type PharmacyReachabilityPlanSnapshot,
  type PharmacyOutcomeTruthProjectionSnapshot,
} from "./phase6-pharmacy-patient-status-engine";

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_344 =
  "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts" as const;
const TASK_353 =
  "par_353_phase6_track_backend_build_bounce_back_urgent_return_and_reopen_mechanics" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task344 = typeof TASK_344;
type Task353 = typeof TASK_353;

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

function addMinutes(timestamp: string, minutes: number): string {
  return new Date(Date.parse(timestamp) + minutes * 60_000).toISOString();
}

function addHours(timestamp: string, hours: number): string {
  return new Date(Date.parse(timestamp) + hours * 60 * 60_000).toISOString();
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

const bounceBackThresholds = {
  B_loop: 3,
  tau_loop: 0.65,
  tau_reopen_secondary: 0.6,
  tau_contact_return: 0.7,
  nu_clinical: 0.35,
  nu_contact: 0.2,
  nu_provider: 0.15,
  nu_consent: 0.15,
  nu_timing: 0.15,
} as const;

const directUrgentRouteRequiredTypes: readonly PharmacyBounceBackType[] = [
  "urgent_gp_return",
  "safeguarding_concern",
] as const;

const outcomeClassificationToBounceBackType: Partial<
  Record<PharmacyOutcomeClassificationState, PharmacyBounceBackType>
> = {
  urgent_gp_action: "urgent_gp_return",
  onward_referral: "routine_gp_return",
  unable_to_contact: "patient_not_contactable",
  pharmacy_unable_to_complete: "pharmacy_unable_to_complete",
} as const;

const routeBlockedActionScopes = {
  pharmacy_contact: ["pharmacy_status_entry", "contact_route_repair"],
  outcome_confirmation: ["pharmacy_status_entry"],
  urgent_return: ["pharmacy_status_entry", "contact_route_repair"],
} as const;

export type PharmacyBounceBackEvidenceSourceKind =
  | "outcome_observation"
  | "dispatch_failure"
  | "pharmacy_message"
  | "manual_capture"
  | "reachability_failure";

export type PharmacyBounceBackEvidenceTrustClass = "high" | "medium" | "low";

export interface PharmacyBounceBackEvidenceEnvelopeSnapshot {
  pharmacyBounceBackEvidenceEnvelopeId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  sourceKind: PharmacyBounceBackEvidenceSourceKind;
  sourceOutcomeOrDispatchRef:
    | AggregateRef<"PharmacyOutcomeSettlement", Task343>
    | AggregateRef<"PharmacyDispatchSettlement", Task343>
    | null;
  normalizedBounceBackType: PharmacyBounceBackType;
  normalizedEvidenceRefs: readonly string[];
  trustClass: PharmacyBounceBackEvidenceTrustClass;
  evidenceSummaryRef: string;
  replayDigest: string;
  receivedAt: string;
  normalizedAt: string;
  version: number;
}

export type UrgentReturnRouteClass =
  | "dedicated_professional_number"
  | "urgent_care_escalation"
  | "monitored_email_fallback";

export interface UrgentReturnDirectRouteProfileSnapshot {
  urgentReturnDirectRouteProfileId: string;
  bounceBackType: Extract<PharmacyBounceBackType, "urgent_gp_return" | "safeguarding_concern">;
  routeClass: UrgentReturnRouteClass;
  directRouteRef: string;
  fallbackRouteRef: string | null;
  updateRecordForbidden: true;
  monitoredSafetyNetRequired: boolean;
  contractSourceRef: string;
  routeEvidenceRequirementRef: string;
  calmCopyForbidden: true;
  reviewedAt: string;
  version: number;
}

export type PharmacyPracticeLatestPatientInstructionState =
  | "choose_or_confirm"
  | "action_in_progress"
  | "reviewing_next_steps"
  | "completed"
  | "urgent_action";

export type PharmacyPracticeGpActionRequiredState =
  | "none"
  | "routine_review"
  | "urgent_gp_action";

export type PharmacyPracticeTriageReentryState =
  | "not_reentered"
  | "reentry_pending"
  | "triage_active";

export type PharmacyPracticeUrgentReturnState =
  | "none"
  | "routine_return_active"
  | "urgent_return_active";

export type PharmacyPracticeReachabilityRepairState =
  | "not_required"
  | "required"
  | "in_progress";

export type PharmacyPracticeMinimumNecessaryAudienceView =
  | "summary_only"
  | "clinical_action_required"
  | "operations_attention";

export interface PharmacyPracticeVisibilityProjectionSnapshot {
  pharmacyPracticeVisibilityProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  dispatchTruthProjectionRef: AggregateRef<"PharmacyDispatchTruthProjection", Task343> | null;
  patientStatusProjectionRef: AggregateRef<"PharmacyPatientStatusProjection", Task344>;
  latestOutcomeTruthProjectionRef:
    | AggregateRef<"PharmacyOutcomeTruthProjection", Task343>
    | null;
  latestOutcomeEvidenceRef: string | null;
  activeBounceBackRecordRef: AggregateRef<"PharmacyBounceBackRecord", Task344> | null;
  reachabilityPlanRef: AggregateRef<"PharmacyReachabilityPlan", Task344> | null;
  latestPatientInstructionState: PharmacyPracticeLatestPatientInstructionState;
  gpActionRequiredState: PharmacyPracticeGpActionRequiredState;
  triageReentryState: PharmacyPracticeTriageReentryState;
  urgentReturnState: PharmacyPracticeUrgentReturnState;
  reachabilityRepairState: PharmacyPracticeReachabilityRepairState;
  currentCloseBlockerRefs: readonly string[];
  currentConfirmationGateRefs: readonly string[];
  minimumNecessaryAudienceView: PharmacyPracticeMinimumNecessaryAudienceView;
  wrongPatientFreezeState: "clear" | "identity_repair_active";
  calmCopyAllowed: boolean;
  computedAt: string;
  version: number;
}

export type PharmacyBounceBackSupervisorResolution =
  | "resolved_allow_redispatch"
  | "resolved_keep_block"
  | "dismiss_as_material_change";

export interface PharmacyBounceBackSupervisorReviewSnapshot {
  pharmacyBounceBackSupervisorReviewId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  bounceBackRecordRef: AggregateRef<"PharmacyBounceBackRecord", Task344>;
  reviewState: "required" | "in_review" | "resolved";
  loopRisk: number;
  materialChange: number;
  reopenPriorityBand: number;
  assignedSupervisorRef: string | null;
  openedAt: string;
  lastUpdatedAt: string;
  resolvedAt: string | null;
  resolution: PharmacyBounceBackSupervisorResolution | null;
  resolutionNotesRef: string | null;
  version: number;
}

export type PharmacyReturnNotificationState = "suppressed" | "ready" | "emitted";

export type PharmacyReturnNotificationChannelHint =
  | "secure_message"
  | "sms"
  | "email"
  | "none";

export interface PharmacyReturnNotificationTriggerSnapshot {
  pharmacyReturnNotificationTriggerId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  bounceBackRecordRef: AggregateRef<"PharmacyBounceBackRecord", Task344>;
  patientStatusProjectionRef: AggregateRef<"PharmacyPatientStatusProjection", Task344>;
  notificationState: PharmacyReturnNotificationState;
  channelHint: PharmacyReturnNotificationChannelHint;
  headlineCopyRef: string;
  bodyCopyRef: string;
  warningCopyRef: string | null;
  selectedAnchorRef: string;
  activeReturnContractRef: string | null;
  generatedAt: string;
  patientInformedAt: string | null;
  version: number;
}

export type PharmacyBounceBackReacquisitionMode = "original_request" | "duty_task";

export interface PharmacyBounceBackTruthProjectionSnapshot {
  pharmacyBounceBackTruthProjectionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  bounceBackRecordRef: AggregateRef<"PharmacyBounceBackRecord", Task344>;
  patientStatusProjectionRef: AggregateRef<"PharmacyPatientStatusProjection", Task344>;
  practiceVisibilityProjectionRef:
    AggregateRef<"PharmacyPracticeVisibilityProjection", Task353>;
  reachabilityPlanRef: AggregateRef<"PharmacyReachabilityPlan", Task344> | null;
  currentNotificationTriggerRef:
    AggregateRef<"PharmacyReturnNotificationTrigger", Task353> | null;
  currentSupervisorReviewRef:
    AggregateRef<"PharmacyBounceBackSupervisorReview", Task353> | null;
  reopenedCaseStatus:
    | "unresolved_returned"
    | "urgent_bounce_back"
    | "no_contact_return_pending";
  returnedTaskRef: string | null;
  reacquisitionMode: PharmacyBounceBackReacquisitionMode;
  triageReentryState: PharmacyPracticeTriageReentryState;
  gpActionRequired: boolean;
  materialChange: number;
  loopRisk: number;
  reopenSignal: number;
  reopenPriorityBand: number;
  patientNotificationState: PharmacyReturnNotificationState;
  rotatedPatientEntryGrantRefs: readonly string[];
  autoRedispatchBlocked: boolean;
  autoCloseBlocked: boolean;
  computedAt: string;
  version: number;
}

export interface PharmacyBounceBackLoopSupervisorPosture {
  pharmacyCaseId: string;
  bounceBackRecordId: string | null;
  materialChange: number | null;
  loopRisk: number | null;
  reopenPriorityBand: number | null;
  supervisorReviewState: PharmacyBounceBackRecordSnapshot["supervisorReviewState"] | null;
  autoRedispatchBlocked: boolean;
  autoCloseBlocked: boolean;
}

export interface PreviewPharmacyBounceBackInput {
  pharmacyCaseId: string;
  sourceKind: PharmacyBounceBackEvidenceSourceKind;
  sourceOutcomeOrDispatchRef?:
    | AggregateRef<"PharmacyOutcomeSettlement", Task343>
    | AggregateRef<"PharmacyDispatchSettlement", Task343>
    | null;
  explicitBounceBackType?: PharmacyBounceBackType | null;
  normalizedEvidenceRefs?: readonly string[];
  evidenceSummaryRef: string;
  trustClass?: PharmacyBounceBackEvidenceTrustClass;
  patientContactFailureSeverity?: number;
  contactRouteTrustFailure?: number;
  patientDeclinedRequiresAlternative?: boolean;
  outstandingClinicalWorkRequired?: boolean;
  firstUnableDeclaredAt?: string | null;
  originPriorityBand?: number | null;
  deltaClinical?: number;
  deltaContact?: number;
  deltaProvider?: number;
  deltaConsent?: number;
  deltaTiming?: number;
  gpActionRequired?: boolean;
  safeguardingFlag?: boolean;
  receivedAt: string;
  recordedAt: string;
}

export interface PreviewPharmacyBounceBackResult {
  normalizedEnvelope: PharmacyBounceBackEvidenceEnvelopeSnapshot;
  bounceBackType: PharmacyBounceBackType;
  urgencyCarryFloor: number;
  uUrgent: 0 | 1;
  uUnable: 0 | 1;
  uContact: number;
  uDecline: number;
  deltaClinical: number;
  deltaContact: number;
  deltaProvider: number;
  deltaConsent: number;
  deltaTiming: number;
  materialChange: number;
  loopRisk: number;
  reopenSignal: number;
  reopenPriorityBand: number;
  reopenedCaseStatus:
    | "unresolved_returned"
    | "urgent_bounce_back"
    | "no_contact_return_pending";
  gpActionRequired: boolean;
  supervisorReviewRequired: boolean;
  reopenByAt: string | null;
  directUrgentRouteRequired: boolean;
}

export interface IngestPharmacyBounceBackInput
  extends PharmacyAuthorityCommandInput,
    PreviewPharmacyBounceBackInput {
  patientShellConsistencyProjectionId: string;
  patientContactRouteRef?: string | null;
  patientRecoveryLoopRef?: string | null;
  emitPatientNotification?: boolean;
}

export interface ResolvePharmacyBounceBackSupervisorReviewInput {
  pharmacyCaseId: string;
  bounceBackRecordId: string;
  actorRef: string;
  resolution: PharmacyBounceBackSupervisorResolution;
  assignedSupervisorRef?: string | null;
  resolutionNotesRef?: string | null;
  recordedAt: string;
}

export interface ReopenPharmacyCaseFromBounceBackInput extends PharmacyAuthorityCommandInput {
  pharmacyCaseId: string;
  bounceBackRecordId: string;
  patientShellConsistencyProjectionId: string;
  reopenToStatus: "candidate_received" | "rules_evaluating" | "consent_pending";
  clearBounceBackRef?: boolean;
  clearOutcomeRef?: boolean;
}

export interface PharmacyBounceBackCommandResult {
  pharmacyCase: PharmacyCaseSnapshot;
  bounceBackRecord: PharmacyBounceBackRecordSnapshot;
  bounceBackTruthProjection: PharmacyBounceBackTruthProjectionSnapshot;
  practiceVisibilityProjection: PharmacyPracticeVisibilityProjectionSnapshot;
  patientStatusProjection: PharmacyPatientStatusProjectionSnapshot;
  notificationTrigger: PharmacyReturnNotificationTriggerSnapshot | null;
  supervisorReview: PharmacyBounceBackSupervisorReviewSnapshot | null;
  reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
  replayed: boolean;
}

export interface Phase6PharmacyBounceBackRepositories {
  getBounceBackEvidenceEnvelope(
    pharmacyBounceBackEvidenceEnvelopeId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackEvidenceEnvelopeSnapshot> | null>;
  findBounceBackEvidenceEnvelopeByReplayDigest(
    replayDigest: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackEvidenceEnvelopeSnapshot> | null>;
  saveBounceBackEvidenceEnvelope(
    snapshot: PharmacyBounceBackEvidenceEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getBounceBackRecord(
    bounceBackRecordId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackRecordSnapshot> | null>;
  getCurrentBounceBackRecordForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackRecordSnapshot> | null>;
  listBounceBackRecordsByCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyBounceBackRecordSnapshot>[]>;
  saveBounceBackRecord(
    snapshot: PharmacyBounceBackRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getUrgentReturnDirectRouteProfile(
    urgentReturnDirectRouteProfileId: string,
  ): Promise<SnapshotDocument<UrgentReturnDirectRouteProfileSnapshot> | null>;
  getUrgentReturnDirectRouteProfileForType(
    bounceBackType: Extract<PharmacyBounceBackType, "urgent_gp_return" | "safeguarding_concern">,
  ): Promise<SnapshotDocument<UrgentReturnDirectRouteProfileSnapshot> | null>;
  saveUrgentReturnDirectRouteProfile(
    snapshot: UrgentReturnDirectRouteProfileSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPracticeVisibilityProjection(
    pharmacyPracticeVisibilityProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyPracticeVisibilityProjectionSnapshot> | null>;
  getCurrentPracticeVisibilityProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyPracticeVisibilityProjectionSnapshot> | null>;
  savePracticeVisibilityProjection(
    snapshot: PharmacyPracticeVisibilityProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getSupervisorReview(
    pharmacyBounceBackSupervisorReviewId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackSupervisorReviewSnapshot> | null>;
  getCurrentSupervisorReviewForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackSupervisorReviewSnapshot> | null>;
  saveSupervisorReview(
    snapshot: PharmacyBounceBackSupervisorReviewSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReturnNotificationTrigger(
    pharmacyReturnNotificationTriggerId: string,
  ): Promise<SnapshotDocument<PharmacyReturnNotificationTriggerSnapshot> | null>;
  getCurrentReturnNotificationTriggerForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyReturnNotificationTriggerSnapshot> | null>;
  saveReturnNotificationTrigger(
    snapshot: PharmacyReturnNotificationTriggerSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getBounceBackTruthProjection(
    pharmacyBounceBackTruthProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackTruthProjectionSnapshot> | null>;
  getCurrentBounceBackTruthProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyBounceBackTruthProjectionSnapshot> | null>;
  saveBounceBackTruthProjection(
    snapshot: PharmacyBounceBackTruthProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findBounceBackReplay(replayDigest: string): Promise<string | null>;
  saveBounceBackReplay(replayDigest: string, bounceBackRecordId: string): Promise<void>;
}

export interface Phase6PharmacyBounceBackStore extends Phase6PharmacyBounceBackRepositories {}

export function createPhase6PharmacyBounceBackStore(): Phase6PharmacyBounceBackStore {
  const evidenceEnvelopes = new Map<string, PharmacyBounceBackEvidenceEnvelopeSnapshot>();
  const evidenceByDigest = new Map<string, string>();
  const bounceBackRecords = new Map<string, PharmacyBounceBackRecordSnapshot>();
  const currentBounceBackByCase = new Map<string, string>();
  const bounceBackIdsByCase = new Map<string, string[]>();
  const directRoutes = new Map<string, UrgentReturnDirectRouteProfileSnapshot>();
  const directRouteByType = new Map<string, string>();
  const practiceVisibility = new Map<string, PharmacyPracticeVisibilityProjectionSnapshot>();
  const currentPracticeVisibilityByCase = new Map<string, string>();
  const supervisorReviews = new Map<string, PharmacyBounceBackSupervisorReviewSnapshot>();
  const currentSupervisorReviewByCase = new Map<string, string>();
  const returnNotifications = new Map<string, PharmacyReturnNotificationTriggerSnapshot>();
  const currentReturnNotificationByCase = new Map<string, string>();
  const truthProjections = new Map<string, PharmacyBounceBackTruthProjectionSnapshot>();
  const currentTruthByCase = new Map<string, string>();
  const replayIndex = new Map<string, string>();

  function appendIndex(index: Map<string, string[]>, key: string, value: string) {
    const current = new Set(index.get(key) ?? []);
    current.add(value);
    index.set(key, [...current].sort((left, right) => left.localeCompare(right)));
  }

  return {
    async getBounceBackEvidenceEnvelope(pharmacyBounceBackEvidenceEnvelopeId) {
      const snapshot = evidenceEnvelopes.get(pharmacyBounceBackEvidenceEnvelopeId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async findBounceBackEvidenceEnvelopeByReplayDigest(replayDigest) {
      const id = evidenceByDigest.get(replayDigest);
      return id === undefined ? null : new StoredDocument(evidenceEnvelopes.get(id)!);
    },

    async saveBounceBackEvidenceEnvelope(snapshot, options) {
      saveWithCas(
        evidenceEnvelopes,
        snapshot.pharmacyBounceBackEvidenceEnvelopeId,
        snapshot,
        options,
      );
      evidenceByDigest.set(snapshot.replayDigest, snapshot.pharmacyBounceBackEvidenceEnvelopeId);
    },

    async getBounceBackRecord(bounceBackRecordId) {
      const snapshot = bounceBackRecords.get(bounceBackRecordId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentBounceBackRecordForCase(pharmacyCaseId) {
      const recordId = currentBounceBackByCase.get(pharmacyCaseId);
      return recordId === undefined ? null : new StoredDocument(bounceBackRecords.get(recordId)!);
    },

    async listBounceBackRecordsByCase(pharmacyCaseId) {
      const ids = bounceBackIdsByCase.get(pharmacyCaseId) ?? [];
      return ids
        .map((id) => bounceBackRecords.get(id))
        .filter((value): value is PharmacyBounceBackRecordSnapshot => value !== undefined)
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveBounceBackRecord(snapshot, options) {
      saveWithCas(bounceBackRecords, snapshot.bounceBackRecordId, snapshot, options);
      currentBounceBackByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.bounceBackRecordId);
      appendIndex(bounceBackIdsByCase, snapshot.pharmacyCaseRef.refId, snapshot.bounceBackRecordId);
    },

    async getUrgentReturnDirectRouteProfile(urgentReturnDirectRouteProfileId) {
      const snapshot = directRoutes.get(urgentReturnDirectRouteProfileId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getUrgentReturnDirectRouteProfileForType(bounceBackType) {
      const id = directRouteByType.get(bounceBackType);
      return id === undefined ? null : new StoredDocument(directRoutes.get(id)!);
    },

    async saveUrgentReturnDirectRouteProfile(snapshot, options) {
      saveWithCas(directRoutes, snapshot.urgentReturnDirectRouteProfileId, snapshot, options);
      directRouteByType.set(snapshot.bounceBackType, snapshot.urgentReturnDirectRouteProfileId);
    },

    async getPracticeVisibilityProjection(pharmacyPracticeVisibilityProjectionId) {
      const snapshot = practiceVisibility.get(pharmacyPracticeVisibilityProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentPracticeVisibilityProjectionForCase(pharmacyCaseId) {
      const projectionId = currentPracticeVisibilityByCase.get(pharmacyCaseId);
      return projectionId === undefined
        ? null
        : new StoredDocument(practiceVisibility.get(projectionId)!);
    },

    async savePracticeVisibilityProjection(snapshot, options) {
      saveWithCas(
        practiceVisibility,
        snapshot.pharmacyPracticeVisibilityProjectionId,
        snapshot,
        options,
      );
      currentPracticeVisibilityByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyPracticeVisibilityProjectionId,
      );
    },

    async getSupervisorReview(pharmacyBounceBackSupervisorReviewId) {
      const snapshot = supervisorReviews.get(pharmacyBounceBackSupervisorReviewId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentSupervisorReviewForCase(pharmacyCaseId) {
      const reviewId = currentSupervisorReviewByCase.get(pharmacyCaseId);
      return reviewId === undefined ? null : new StoredDocument(supervisorReviews.get(reviewId)!);
    },

    async saveSupervisorReview(snapshot, options) {
      saveWithCas(
        supervisorReviews,
        snapshot.pharmacyBounceBackSupervisorReviewId,
        snapshot,
        options,
      );
      currentSupervisorReviewByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyBounceBackSupervisorReviewId,
      );
    },

    async getReturnNotificationTrigger(pharmacyReturnNotificationTriggerId) {
      const snapshot = returnNotifications.get(pharmacyReturnNotificationTriggerId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentReturnNotificationTriggerForCase(pharmacyCaseId) {
      const triggerId = currentReturnNotificationByCase.get(pharmacyCaseId);
      return triggerId === undefined ? null : new StoredDocument(returnNotifications.get(triggerId)!);
    },

    async saveReturnNotificationTrigger(snapshot, options) {
      saveWithCas(
        returnNotifications,
        snapshot.pharmacyReturnNotificationTriggerId,
        snapshot,
        options,
      );
      currentReturnNotificationByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyReturnNotificationTriggerId,
      );
    },

    async getBounceBackTruthProjection(pharmacyBounceBackTruthProjectionId) {
      const snapshot = truthProjections.get(pharmacyBounceBackTruthProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentBounceBackTruthProjectionForCase(pharmacyCaseId) {
      const truthId = currentTruthByCase.get(pharmacyCaseId);
      return truthId === undefined ? null : new StoredDocument(truthProjections.get(truthId)!);
    },

    async saveBounceBackTruthProjection(snapshot, options) {
      saveWithCas(
        truthProjections,
        snapshot.pharmacyBounceBackTruthProjectionId,
        snapshot,
        options,
      );
      currentTruthByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyBounceBackTruthProjectionId);
    },

    async findBounceBackReplay(replayDigest) {
      return replayIndex.get(replayDigest) ?? null;
    },

    async saveBounceBackReplay(replayDigest, bounceBackRecordId) {
      replayIndex.set(replayDigest, bounceBackRecordId);
    },
  };
}

export interface Phase6PharmacyBounceBackServiceDependencies {
  repositories?: Phase6PharmacyBounceBackRepositories;
  patientStatusRepositories?: Phase6PharmacyPatientStatusRepositories;
  patientStatusService?: Phase6PharmacyPatientStatusService;
  caseKernelService?: Phase6PharmacyCaseKernelService;
  directoryRepositories?: Phase6PharmacyDirectoryChoiceRepositories;
  dispatchRepositories?: Phase6PharmacyDispatchRepositories;
  outcomeRepositories?: Phase6PharmacyOutcomeRepositories;
  reachabilityRepositories?: ReachabilityDependencies;
  reachabilityGovernor?: ReachabilityGovernorService;
  lifecycleRepositories?: LifecycleCoordinatorDependencies;
  lifecycleService?: LifecycleCoordinatorService;
  idGenerator?: BackboneIdGenerator;
}

export interface Phase6PharmacyBounceBackService {
  previewNormalizedBounceBack(
    input: PreviewPharmacyBounceBackInput,
  ): Promise<PreviewPharmacyBounceBackResult>;
  ingestBounceBackEvidence(
    input: IngestPharmacyBounceBackInput,
  ): Promise<PharmacyBounceBackCommandResult>;
  reopenCaseFromBounceBack(
    input: ReopenPharmacyCaseFromBounceBackInput,
  ): Promise<PharmacyBounceBackCommandResult>;
  getActiveBounceBackSummary(
    pharmacyCaseId: string,
  ): Promise<PharmacyBounceBackTruthProjectionSnapshot | null>;
  getLoopRiskAndSupervisorPosture(
    pharmacyCaseId: string,
  ): Promise<PharmacyBounceBackLoopSupervisorPosture | null>;
  getReturnSpecificPatientMessagePreview(
    pharmacyCaseId: string,
  ): Promise<PharmacyReturnNotificationTriggerSnapshot | null>;
  resolveSupervisorReview(
    input: ResolvePharmacyBounceBackSupervisorReviewInput,
  ): Promise<PharmacyBounceBackCommandResult>;
}

export interface PharmacyBounceBackNormalizer {
  normalizeBounceBack(
    input: PreviewPharmacyBounceBackInput,
  ): Promise<NormalizedBounceBackComputation>;
}

export interface PharmacyBounceBackRecordService {
  ingestBounceBack(
    input: IngestPharmacyBounceBackInput,
  ): Promise<PharmacyBounceBackCommandResult>;
}

export interface PharmacyReopenPriorityCalculator {
  computeReopenPriority(
    input: PreviewPharmacyBounceBackInput,
  ): Promise<NormalizedBounceBackComputation>;
}

export interface PharmacyUrgentReturnChannelResolver {
  resolveUrgentReturnChannel(
    pharmacyCase: PharmacyCaseSnapshot,
    bounceBackType: Extract<PharmacyBounceBackType, "urgent_gp_return" | "safeguarding_concern">,
    recordedAt: string,
  ): Promise<UrgentReturnDirectRouteProfileSnapshot>;
}

export interface PharmacyReopenLeaseService {
  reacquireTriageLease(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    recordedAt: string;
    replayDigest: string;
    bounceBackType: PharmacyBounceBackType;
    uUrgent: 0 | 1;
    uUnable: 0 | 1;
    uContact: number;
    reopenSignal: number;
    deltaClinical: number;
    deltaContact: number;
    deltaProvider: number;
    deltaConsent: number;
    deltaTiming: number;
    blockingReachabilityRefs: readonly string[];
  }): Promise<PharmacyPracticeTriageReentryState>;
}

export interface PharmacyReturnReachabilityBridge {
  ensureReturnReachability(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    patientContactRouteRef: string;
    recordedAt: string;
    selectedAnchorRef: string;
    requestReturnBundleRef: string | null;
    resumeContinuationRef: string | null;
    patientRecoveryLoopRef: string | null;
  }): Promise<{
    dependencyRefs: readonly AggregateRef<"ReachabilityDependency", Task344>[];
    dominantDependencyRef: string | null;
    repairJourneyRef: string | null;
  }>;
}

export interface PharmacyBounceBackTruthProjectionBuilder {
  buildBounceBackTruth(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    bounceBackRecord: PharmacyBounceBackRecordSnapshot;
    patientStatusProjection: PharmacyPatientStatusProjectionSnapshot;
    practiceVisibilityProjection: PharmacyPracticeVisibilityProjectionSnapshot;
    reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
    notificationTrigger: PharmacyReturnNotificationTriggerSnapshot | null;
    supervisorReview: PharmacyBounceBackSupervisorReviewSnapshot | null;
    reacquisitionMode: PharmacyBounceBackReacquisitionMode;
    triageReentryState: PharmacyPracticeTriageReentryState;
    rotatedPatientEntryGrantRefs: readonly string[];
    recordedAt: string;
  }): PharmacyBounceBackTruthProjectionSnapshot;
}

export interface PharmacyLoopSupervisorEscalationService {
  ensureSupervisorReview(input: {
    pharmacyCase: PharmacyCaseSnapshot;
    bounceBackRecordId: string;
    materialChange: number;
    loopRisk: number;
    reopenPriorityBand: number;
    recordedAt: string;
  }): PharmacyBounceBackSupervisorReviewSnapshot | null;
}

type NormalizedBounceBackComputation = PreviewPharmacyBounceBackResult & {
  pharmacyCase: PharmacyCaseSnapshot;
  selectedProvider: PharmacyProvider | null;
  selectedChoiceTruth: PharmacyChoiceTruthProjection | null;
  selectedChoiceExplanation: PharmacyChoiceExplanation | null;
  consentCheckpoint: PharmacyConsentCheckpoint | null;
};

function mapOutcomeTrustClass(trustClass: PharmacyOutcomeTrustClass): PharmacyBounceBackEvidenceTrustClass {
  if (trustClass === "trusted_observed" || trustClass === "trusted_structured") {
    return "high";
  }
  if (trustClass === "email_low_assurance") {
    return "medium";
  }
  return "low";
}

function defaultOriginPriorityBand(pharmacyCase: PharmacyCaseSnapshot): number {
  return pharmacyCase.serviceType === "clinical_pathway_consultation" ? 1 : 0;
}

function classifyGpActionRequired(input: {
  bounceBackType: PharmacyBounceBackType;
  explicitGpActionRequired: boolean | undefined;
  outstandingClinicalWorkRequired: boolean;
  patientDeclinedRequiresAlternative: boolean;
}): boolean {
  if (typeof input.explicitGpActionRequired === "boolean") {
    return input.explicitGpActionRequired;
  }
  switch (input.bounceBackType) {
    case "urgent_gp_return":
    case "routine_gp_return":
    case "safeguarding_concern":
      return true;
    case "pharmacy_unable_to_complete":
    case "referral_expired":
      return input.outstandingClinicalWorkRequired;
    case "patient_not_contactable":
      return true;
    case "patient_declined":
      return input.patientDeclinedRequiresAlternative;
  }
  invariant(false, "UNKNOWN_BOUNCE_BACK_TYPE", `Unhandled bounce-back type ${input.bounceBackType}.`);
}

function defaultDeltaVector(input: {
  bounceBackType: PharmacyBounceBackType;
  patientContactFailureSeverity: number;
  contactRouteTrustFailure: number;
  patientDeclinedRequiresAlternative: boolean;
  outstandingClinicalWorkRequired: boolean;
  safeguardingFlag: boolean;
}): {
  deltaClinical: number;
  deltaContact: number;
  deltaProvider: number;
  deltaConsent: number;
  deltaTiming: number;
} {
  switch (input.bounceBackType) {
    case "urgent_gp_return":
      return {
        deltaClinical: 0.9,
        deltaContact: Math.max(input.contactRouteTrustFailure, 0.2),
        deltaProvider: 0.35,
        deltaConsent: 0.1,
        deltaTiming: 0.6,
      };
    case "routine_gp_return":
      return {
        deltaClinical: 0.65,
        deltaContact: Math.max(input.contactRouteTrustFailure, 0.1),
        deltaProvider: 0.3,
        deltaConsent: 0.15,
        deltaTiming: 0.4,
      };
    case "patient_not_contactable":
      return {
        deltaClinical: 0.05,
        deltaContact: Math.max(
          input.patientContactFailureSeverity,
          input.contactRouteTrustFailure,
          0.7,
        ),
        deltaProvider: 0.05,
        deltaConsent: 0.1,
        deltaTiming: 0.4,
      };
    case "patient_declined":
      return {
        deltaClinical: 0.05,
        deltaContact: 0.1,
        deltaProvider: input.patientDeclinedRequiresAlternative ? 0.35 : 0.1,
        deltaConsent: input.patientDeclinedRequiresAlternative ? 1 : 0.7,
        deltaTiming: 0.15,
      };
    case "pharmacy_unable_to_complete":
      return {
        deltaClinical: input.outstandingClinicalWorkRequired ? 0.8 : 0.4,
        deltaContact: Math.max(input.contactRouteTrustFailure, 0.15),
        deltaProvider: 0.45,
        deltaConsent: 0.15,
        deltaTiming: 0.55,
      };
    case "referral_expired":
      return {
        deltaClinical: input.outstandingClinicalWorkRequired ? 0.6 : 0.2,
        deltaContact: Math.max(input.contactRouteTrustFailure, 0.1),
        deltaProvider: 0.25,
        deltaConsent: 0.15,
        deltaTiming: 1,
      };
    case "safeguarding_concern":
      return {
        deltaClinical: input.safeguardingFlag ? 1 : 0.9,
        deltaContact: Math.max(input.contactRouteTrustFailure, 0.3),
        deltaProvider: 0.4,
        deltaConsent: 0.2,
        deltaTiming: 0.8,
      };
  }
  invariant(false, "UNKNOWN_BOUNCE_BACK_TYPE", `Unhandled bounce-back type ${input.bounceBackType}.`);
}

function urgencyCarryFloorFromType(input: {
  bounceBackType: PharmacyBounceBackType;
  outstandingClinicalWorkRequired: boolean;
  firstUnableDeclaredAt: string | null;
  recordedAt: string;
}): number {
  const elapsedHours =
    input.firstUnableDeclaredAt === null
      ? 0
      : Math.max(
          0,
          (Date.parse(input.recordedAt) - Date.parse(input.firstUnableDeclaredAt)) / 3_600_000,
        );
  switch (input.bounceBackType) {
    case "urgent_gp_return":
    case "safeguarding_concern":
      return 3;
    case "patient_not_contactable":
      return 2;
    case "pharmacy_unable_to_complete":
      return input.outstandingClinicalWorkRequired || elapsedHours >= 6 ? 2 : 1;
    case "referral_expired":
      return elapsedHours >= 12 ? 2 : 1;
    case "routine_gp_return":
    case "patient_declined":
      return 1;
  }
  invariant(false, "UNKNOWN_BOUNCE_BACK_TYPE", `Unhandled bounce-back type ${input.bounceBackType}.`);
}

function reopenByAtFromBand(reopenPriorityBand: number, recordedAt: string): string | null {
  switch (reopenPriorityBand) {
    case 3:
      return addMinutes(recordedAt, 15);
    case 2:
      return addHours(recordedAt, 4);
    case 1:
      return addHours(recordedAt, 24);
    default:
      return null;
  }
}

function mapMacroStateToPracticeInstructionState(
  status: PharmacyPatientStatusProjectionSnapshot["currentMacroState"],
): PharmacyPracticeLatestPatientInstructionState {
  return status;
}

function mapBounceBackTypeToReopenTriggerFamily(
  bounceBackType: PharmacyBounceBackType,
): "urgent_bounce_back" | "pharmacy_unable_to_complete" | "contact_dependency_failure" {
  switch (bounceBackType) {
    case "urgent_gp_return":
    case "routine_gp_return":
    case "safeguarding_concern":
      return "urgent_bounce_back";
    case "patient_not_contactable":
      return "contact_dependency_failure";
    case "patient_declined":
    case "pharmacy_unable_to_complete":
    case "referral_expired":
      return "pharmacy_unable_to_complete";
  }
  invariant(false, "UNKNOWN_BOUNCE_BACK_TYPE", `Unhandled bounce-back type ${bounceBackType}.`);
}

function mapReopenedStatusToNotificationHeadline(
  reopenedCaseStatus: PharmacyBounceBackRecordSnapshot["reopenedCaseStatus"],
): string {
  switch (reopenedCaseStatus) {
    case "urgent_bounce_back":
      return "pharmacy.return.urgent_action_required";
    case "no_contact_return_pending":
      return "pharmacy.return.contact_repair_required";
    case "unresolved_returned":
      return "pharmacy.return.review_required";
  }
}

function routeHealthStatePriority(value: RouteHealthState): number {
  switch (value) {
    case "blocked":
      return 4;
    case "disputed":
      return 3;
    case "degraded":
      return 2;
    case "clear":
      return 1;
  }
}

async function seedLifecycleScopeForCase(
  repositories: LifecycleCoordinatorDependencies,
  authority: LifecycleCoordinatorService,
  pharmacyCase: PharmacyCaseSnapshot,
  recordedAt: string,
) {
  const existingRequest = await repositories.getRequest(pharmacyCase.originRequestId);
  const existingLineage = await repositories.getRequestLineage(pharmacyCase.requestLineageRef.refId);
  const existingEpisode = await repositories.getEpisode(pharmacyCase.episodeRef.refId);
  if (!existingEpisode) {
    const episode = EpisodeAggregate.create({
      episodeId: pharmacyCase.episodeRef.refId,
      episodeFingerprint: `${pharmacyCase.episodeRef.refId}_fingerprint`,
      openedAt: pharmacyCase.createdAt,
    }).attachRequestMembership({
      requestRef: pharmacyCase.originRequestId,
      requestLineageRef: pharmacyCase.requestLineageRef.refId,
      updatedAt: recordedAt,
    });
    await repositories.saveEpisode(episode);
  }
  if (!existingLineage) {
    const lineage = RequestLineageAggregate.create({
      requestLineageId: pharmacyCase.requestLineageRef.refId,
      episodeRef: pharmacyCase.episodeRef.refId,
      requestRef: pharmacyCase.originRequestId,
      continuityWitnessRef: `${pharmacyCase.originRequestId}_continuity`,
      createdAt: pharmacyCase.createdAt,
    });
    await repositories.saveRequestLineage(lineage);
  }
  if (!existingRequest) {
    const request = RequestAggregate.create({
      requestId: pharmacyCase.originRequestId,
      episodeId: pharmacyCase.episodeRef.refId,
      originEnvelopeRef: `${pharmacyCase.originRequestId}_envelope`,
      promotionRecordRef: `${pharmacyCase.originRequestId}_promotion`,
      tenantId: pharmacyCase.tenantId,
      sourceChannel: "self_service_form",
      originIngressRecordRef: `${pharmacyCase.originRequestId}_ingress`,
      normalizedSubmissionRef: `${pharmacyCase.originRequestId}_normalized`,
      requestType: "service_request",
      requestLineageRef: pharmacyCase.requestLineageRef.refId,
      createdAt: pharmacyCase.createdAt,
    });
    await repositories.saveRequest(request);
  }
  const fence = await authority.initializeLifecyclePartition({
    episodeId: pharmacyCase.episodeRef.refId,
    issuedAt: recordedAt,
  });
  return fence;
}

function buildBounceBackReplayDigest(input: {
  pharmacyCaseId: string;
  bounceBackType: PharmacyBounceBackType;
  sourceKind: PharmacyBounceBackEvidenceSourceKind;
  sourceOutcomeOrDispatchRef:
    | AggregateRef<"PharmacyOutcomeSettlement", Task343>
    | AggregateRef<"PharmacyDispatchSettlement", Task343>
    | null;
  normalizedEvidenceRefs: readonly string[];
  receivedAt: string;
}): string {
  return sha256Hex(
    stableStringify({
      pharmacyCaseId: input.pharmacyCaseId,
      bounceBackType: input.bounceBackType,
      sourceKind: input.sourceKind,
      sourceOutcomeOrDispatchRef: input.sourceOutcomeOrDispatchRef,
      normalizedEvidenceRefs: uniqueSorted(input.normalizedEvidenceRefs),
      receivedAt: input.receivedAt,
    }),
  );
}

async function loadCurrentCase(
  caseKernelService: Phase6PharmacyCaseKernelService,
  pharmacyCaseId: string,
): Promise<PharmacyCaseBundle> {
  const bundle = await caseKernelService.getPharmacyCase(pharmacyCaseId);
  invariant(bundle !== null, "PHARMACY_CASE_NOT_FOUND", `PharmacyCase ${pharmacyCaseId} was not found.`);
  return bundle;
}

async function loadProviderContext(input: {
  repositories: Phase6PharmacyDirectoryChoiceRepositories;
  pharmacyCase: PharmacyCaseSnapshot;
}): Promise<{
  selectedProvider: PharmacyProvider | null;
  selectedChoiceTruth: PharmacyChoiceTruthProjection | null;
  selectedChoiceExplanation: PharmacyChoiceExplanation | null;
  consentCheckpoint: PharmacyConsentCheckpoint | null;
}> {
  const selectedProvider =
    input.pharmacyCase.selectedProviderRef === null
      ? null
      : (await input.repositories.getProvider(input.pharmacyCase.selectedProviderRef.refId))?.toSnapshot() ?? null;
  const selectedChoiceTruth =
    (
      await input.repositories.getLatestChoiceTruthProjectionForCase(
        input.pharmacyCase.pharmacyCaseId,
      )
    )?.toSnapshot() ?? null;
  const selectedChoiceExplanation =
    selectedChoiceTruth?.selectedProviderExplanationRef === null || selectedChoiceTruth === null
      ? null
      : (
          await input.repositories.getChoiceExplanation(
            selectedChoiceTruth.selectedProviderExplanationRef.refId,
          )
        )?.toSnapshot() ?? null;
  const consentCheckpoint =
    input.pharmacyCase.activeConsentCheckpointRef === null
      ? null
      : (
          await input.repositories.getConsentCheckpoint(
            input.pharmacyCase.activeConsentCheckpointRef.refId,
          )
        )?.toSnapshot() ?? null;
  return {
    selectedProvider,
    selectedChoiceTruth,
    selectedChoiceExplanation,
    consentCheckpoint,
  };
}

async function inferBounceBackTypeFromSource(input: {
  preview: PreviewPharmacyBounceBackInput;
  dispatchRepositories: Phase6PharmacyDispatchRepositories;
  outcomeRepositories: Phase6PharmacyOutcomeRepositories;
}): Promise<{
  bounceBackType: PharmacyBounceBackType;
  trustClass: PharmacyBounceBackEvidenceTrustClass;
}> {
  if (input.preview.explicitBounceBackType) {
    return {
      bounceBackType: input.preview.explicitBounceBackType,
      trustClass: input.preview.trustClass ?? "medium",
    };
  }

  const sourceRef = input.preview.sourceOutcomeOrDispatchRef ?? null;
  if (sourceRef?.targetFamily === "PharmacyOutcomeSettlement") {
    const settlement = await input.outcomeRepositories.getOutcomeSettlement(sourceRef.refId);
    invariant(
      settlement !== null,
      "OUTCOME_SETTLEMENT_NOT_FOUND",
      `PharmacyOutcomeSettlement ${sourceRef.refId} was not found.`,
    );
    const ingestAttempt = await input.outcomeRepositories.getOutcomeIngestAttempt(
      settlement.toSnapshot().ingestAttemptId,
    );
    invariant(
      ingestAttempt !== null,
      "OUTCOME_INGEST_ATTEMPT_NOT_FOUND",
      `PharmacyOutcomeIngestAttempt ${settlement.toSnapshot().ingestAttemptId} was not found.`,
    );
    const classification = ingestAttempt.toSnapshot().classificationState;
    const mapped = outcomeClassificationToBounceBackType[classification];
    invariant(
      mapped !== undefined,
      "OUTCOME_CLASSIFICATION_REQUIRES_EXPLICIT_BOUNCE_BACK_TYPE",
      `Outcome classification ${classification} requires an explicit bounce-back type override.`,
    );
    const envelope = await input.outcomeRepositories.getOutcomeEvidenceEnvelope(
      ingestAttempt.toSnapshot().outcomeEvidenceEnvelopeRef.refId,
    );
    return {
      bounceBackType: mapped,
      trustClass:
        input.preview.trustClass ??
        mapOutcomeTrustClass(envelope?.toSnapshot().trustClass ?? "manual_operator_entered"),
    };
  }

  if (sourceRef?.targetFamily === "PharmacyDispatchSettlement") {
    const settlement = await input.dispatchRepositories.getDispatchSettlement(sourceRef.refId);
    invariant(
      settlement !== null,
      "DISPATCH_SETTLEMENT_NOT_FOUND",
      `PharmacyDispatchSettlement ${sourceRef.refId} was not found.`,
    );
    return {
      bounceBackType:
        settlement.toSnapshot().result === "stale_choice_or_consent"
          ? "patient_declined"
          : "referral_expired",
      trustClass: input.preview.trustClass ?? "medium",
    };
  }

  if (input.preview.sourceKind === "reachability_failure") {
    return {
      bounceBackType: "patient_not_contactable",
      trustClass: input.preview.trustClass ?? "medium",
    };
  }

  invariant(
    false,
    "BOUNCE_BACK_TYPE_REQUIRED",
    "Unable to infer a bounce-back type from the provided source; explicitBounceBackType is required.",
  );
}

async function computeNormalizedBounceBack(input: {
  preview: PreviewPharmacyBounceBackInput;
  repositories: Phase6PharmacyBounceBackRepositories;
  caseKernelService: Phase6PharmacyCaseKernelService;
  directoryRepositories: Phase6PharmacyDirectoryChoiceRepositories;
  dispatchRepositories: Phase6PharmacyDispatchRepositories;
  outcomeRepositories: Phase6PharmacyOutcomeRepositories;
}): Promise<NormalizedBounceBackComputation> {
  const caseBundle = await loadCurrentCase(input.caseKernelService, input.preview.pharmacyCaseId);
  const pharmacyCase = caseBundle.pharmacyCase;
  const providerContext = await loadProviderContext({
    repositories: input.directoryRepositories,
    pharmacyCase,
  });

  const inferred = await inferBounceBackTypeFromSource({
    preview: input.preview,
    dispatchRepositories: input.dispatchRepositories,
    outcomeRepositories: input.outcomeRepositories,
  });

  const normalizedEvidenceRefs = uniqueSorted(input.preview.normalizedEvidenceRefs ?? []);
  const replayDigest = buildBounceBackReplayDigest({
    pharmacyCaseId: pharmacyCase.pharmacyCaseId,
    bounceBackType: inferred.bounceBackType,
    sourceKind: input.preview.sourceKind,
    sourceOutcomeOrDispatchRef: input.preview.sourceOutcomeOrDispatchRef ?? null,
    normalizedEvidenceRefs,
    receivedAt: input.preview.receivedAt,
  });

  const priorRecords = await input.repositories.listBounceBackRecordsByCase(pharmacyCase.pharmacyCaseId);
  const lastUnableRecord = [...priorRecords]
    .map((value) => value.toSnapshot())
    .reverse()
    .find((record) =>
      record.bounceBackType === "pharmacy_unable_to_complete" ||
      record.bounceBackType === "referral_expired",
    );
  const firstUnableDeclaredAt =
    optionalText(input.preview.firstUnableDeclaredAt) ??
    lastUnableRecord?.createdAt ??
    null;
  const defaultVector = defaultDeltaVector({
    bounceBackType: inferred.bounceBackType,
    patientContactFailureSeverity: ensureUnitInterval(
      input.preview.patientContactFailureSeverity ?? 0,
      "patientContactFailureSeverity",
    ),
    contactRouteTrustFailure: ensureUnitInterval(
      input.preview.contactRouteTrustFailure ?? 0,
      "contactRouteTrustFailure",
    ),
    patientDeclinedRequiresAlternative: Boolean(
      input.preview.patientDeclinedRequiresAlternative,
    ),
    outstandingClinicalWorkRequired: Boolean(input.preview.outstandingClinicalWorkRequired),
    safeguardingFlag: Boolean(input.preview.safeguardingFlag),
  });

  const deltaClinical = ensureUnitInterval(
    input.preview.deltaClinical ?? defaultVector.deltaClinical,
    "deltaClinical",
  );
  const deltaContact = ensureUnitInterval(
    input.preview.deltaContact ?? defaultVector.deltaContact,
    "deltaContact",
  );
  const deltaProvider = ensureUnitInterval(
    input.preview.deltaProvider ?? defaultVector.deltaProvider,
    "deltaProvider",
  );
  const deltaConsent = ensureUnitInterval(
    input.preview.deltaConsent ?? defaultVector.deltaConsent,
    "deltaConsent",
  );
  const deltaTiming = ensureUnitInterval(
    input.preview.deltaTiming ?? defaultVector.deltaTiming,
    "deltaTiming",
  );

  const uUrgent =
    inferred.bounceBackType === "urgent_gp_return" ||
    inferred.bounceBackType === "safeguarding_concern"
      ? 1
      : 0;
  const uUnable =
    inferred.bounceBackType === "pharmacy_unable_to_complete" ||
    (inferred.bounceBackType === "referral_expired" &&
      Boolean(input.preview.outstandingClinicalWorkRequired))
      ? 1
      : 0;
  const uContact =
    inferred.bounceBackType === "patient_not_contactable"
      ? ensureUnitInterval(
          Math.max(
            input.preview.patientContactFailureSeverity ?? 0,
            input.preview.contactRouteTrustFailure ?? 0,
          ),
          "uContact",
        )
      : 0;
  const uDecline =
    inferred.bounceBackType === "patient_declined"
      ? ensureUnitInterval(
          input.preview.patientDeclinedRequiresAlternative ? 1 : 0.55,
          "uDecline",
        )
      : 0;

  const materialChange = ensureUnitInterval(
    1 -
      (1 - bounceBackThresholds.nu_clinical * deltaClinical) *
        (1 - bounceBackThresholds.nu_contact * deltaContact) *
        (1 - bounceBackThresholds.nu_provider * deltaProvider) *
        (1 - bounceBackThresholds.nu_consent * deltaConsent) *
        (1 - bounceBackThresholds.nu_timing * deltaTiming),
    "materialChange",
  );
  const bounceCount = priorRecords.length + 1;
  const loopRisk = ensureUnitInterval(
    Math.min(bounceCount / bounceBackThresholds.B_loop, 1) * (1 - materialChange),
    "loopRisk",
  );
  const reopenSignal = ensureUnitInterval(
    Math.max(uUrgent, uUnable, uContact, uDecline),
    "reopenSignal",
  );
  const originPriorityBand = ensureIntegerInRange(
    input.preview.originPriorityBand ?? defaultOriginPriorityBand(pharmacyCase),
    "originPriorityBand",
    0,
    3,
  );
  const reopenPriorityBand = ensureIntegerInRange(
    Math.max(
      originPriorityBand,
      uUrgent === 1 ? 3 : 0,
      Math.max(uUnable, uContact) >= bounceBackThresholds.tau_reopen_secondary ? 2 : 0,
      loopRisk >= bounceBackThresholds.tau_loop ? 1 : 0,
    ),
    "reopenPriorityBand",
    0,
    3,
  );
  const reopenedCaseStatus =
    uUrgent === 1
      ? "urgent_bounce_back"
      : uContact >= bounceBackThresholds.tau_contact_return
        ? "no_contact_return_pending"
        : "unresolved_returned";
  const gpActionRequired = classifyGpActionRequired({
    bounceBackType: inferred.bounceBackType,
    explicitGpActionRequired: input.preview.gpActionRequired,
    outstandingClinicalWorkRequired: Boolean(input.preview.outstandingClinicalWorkRequired),
    patientDeclinedRequiresAlternative: Boolean(
      input.preview.patientDeclinedRequiresAlternative,
    ),
  });

  const normalizedEnvelope: PharmacyBounceBackEvidenceEnvelopeSnapshot = {
    pharmacyBounceBackEvidenceEnvelopeId: stableProjectionId("pharmacy_bounce_back_envelope", {
      replayDigest,
      recordedAt: input.preview.recordedAt,
    }),
    pharmacyCaseRef: makeRef("PharmacyCase", pharmacyCase.pharmacyCaseId, TASK_342),
    sourceKind: input.preview.sourceKind,
    sourceOutcomeOrDispatchRef: input.preview.sourceOutcomeOrDispatchRef ?? null,
    normalizedBounceBackType: inferred.bounceBackType,
    normalizedEvidenceRefs,
    trustClass: inferred.trustClass,
    evidenceSummaryRef: requireText(input.preview.evidenceSummaryRef, "evidenceSummaryRef"),
    replayDigest,
    receivedAt: ensureIsoTimestamp(input.preview.receivedAt, "receivedAt"),
    normalizedAt: ensureIsoTimestamp(input.preview.recordedAt, "recordedAt"),
    version: 1,
  };

  return {
    pharmacyCase,
    selectedProvider: providerContext.selectedProvider,
    selectedChoiceTruth: providerContext.selectedChoiceTruth,
    selectedChoiceExplanation: providerContext.selectedChoiceExplanation,
    consentCheckpoint: providerContext.consentCheckpoint,
    normalizedEnvelope,
    bounceBackType: inferred.bounceBackType,
    urgencyCarryFloor: urgencyCarryFloorFromType({
      bounceBackType: inferred.bounceBackType,
      outstandingClinicalWorkRequired: Boolean(input.preview.outstandingClinicalWorkRequired),
      firstUnableDeclaredAt,
      recordedAt: input.preview.recordedAt,
    }),
    uUrgent: uUrgent as 0 | 1,
    uUnable: uUnable as 0 | 1,
    uContact,
    uDecline,
    deltaClinical,
    deltaContact,
    deltaProvider,
    deltaConsent,
    deltaTiming,
    materialChange,
    loopRisk,
    reopenSignal,
    reopenPriorityBand,
    reopenedCaseStatus,
    gpActionRequired,
    supervisorReviewRequired: loopRisk >= bounceBackThresholds.tau_loop,
    reopenByAt: reopenByAtFromBand(reopenPriorityBand, input.preview.recordedAt),
    directUrgentRouteRequired: directUrgentRouteRequiredTypes.includes(inferred.bounceBackType),
  };
}

async function ensureUrgentReturnDirectRouteProfile(
  repositories: Phase6PharmacyBounceBackRepositories,
  pharmacyCase: PharmacyCaseSnapshot,
  bounceBackType: Extract<PharmacyBounceBackType, "urgent_gp_return" | "safeguarding_concern">,
  recordedAt: string,
): Promise<UrgentReturnDirectRouteProfileSnapshot> {
  const existing = await repositories.getUrgentReturnDirectRouteProfileForType(bounceBackType);
  if (existing) {
    return existing.toSnapshot();
  }
  const routeClass: UrgentReturnRouteClass =
    bounceBackType === "safeguarding_concern"
      ? "urgent_care_escalation"
      : "dedicated_professional_number";
  const snapshot: UrgentReturnDirectRouteProfileSnapshot = {
    urgentReturnDirectRouteProfileId: stableProjectionId("urgent_return_direct_route", {
      tenantId: pharmacyCase.tenantId,
      bounceBackType,
    }),
    bounceBackType,
    routeClass,
    directRouteRef:
      routeClass === "urgent_care_escalation"
        ? `tenant:${pharmacyCase.tenantId}:urgent-care-escalation`
        : `tenant:${pharmacyCase.tenantId}:practice-professional-number`,
    fallbackRouteRef: `tenant:${pharmacyCase.tenantId}:practice-monitored-email`,
    updateRecordForbidden: true,
    monitoredSafetyNetRequired: true,
    contractSourceRef:
      "nhs-england-pharmacy-first-and-update-record-urgent-return-guidance",
    routeEvidenceRequirementRef: `route_evidence.${bounceBackType}`,
    calmCopyForbidden: true,
    reviewedAt: recordedAt,
    version: 1,
  };
  await repositories.saveUrgentReturnDirectRouteProfile(snapshot);
  return snapshot;
}

async function ensureReachabilityDependencies(input: {
  reachabilityGovernor: ReachabilityGovernorService;
  reachabilityRepositories: ReachabilityDependencies;
  pharmacyCase: PharmacyCaseSnapshot;
  patientStatusRepositories: Phase6PharmacyPatientStatusRepositories;
  patientContactRouteRef: string;
  recordedAt: string;
  selectedAnchorRef: string;
  requestReturnBundleRef: string | null;
  resumeContinuationRef: string | null;
  patientRecoveryLoopRef: string | null;
}): Promise<{
  dependencyRefs: readonly AggregateRef<"ReachabilityDependency", Task344>[];
  dominantDependencyRef: string | null;
  repairJourneyRef: string | null;
}> {
  const latestSnapshot =
    await input.reachabilityRepositories.getLatestContactRouteSnapshotForRoute(
      input.patientContactRouteRef,
    );
  invariant(
    latestSnapshot !== undefined,
    "CONTACT_ROUTE_SNAPSHOT_REQUIRED",
    `A current ContactRouteSnapshot is required for route ${input.patientContactRouteRef}.`,
  );

  const currentPlan =
    (
      await input.patientStatusRepositories.getCurrentReachabilityPlanForCase(
        input.pharmacyCase.pharmacyCaseId,
      )
    )?.toSnapshot() ?? null;
  const existingRefs = input.pharmacyCase.activeReachabilityDependencyRefs;

  const ensured = [] as Array<{
    purpose: "pharmacy_contact" | "outcome_confirmation" | "urgent_return";
    dependencyId: string;
    routeHealthState: RouteHealthState;
    repairJourneyRef: string | null;
  }>;

  for (const purpose of ["pharmacy_contact", "outcome_confirmation", "urgent_return"] as const) {
    const existingRef =
      existingRefs.find((value) => {
        if (purpose === "pharmacy_contact") {
          return currentPlan?.pharmacyContactDependencyRef === value.refId;
        }
        if (purpose === "outcome_confirmation") {
          return currentPlan?.outcomeConfirmationDependencyRef === value.refId;
        }
        return currentPlan?.urgentReturnDependencyRef === value.refId;
      }) ?? null;

    const existingDependency =
      existingRef === null
        ? undefined
        : await input.reachabilityRepositories.getReachabilityDependency(existingRef.refId);
    const dependency =
      existingDependency ??
      (
        await input.reachabilityGovernor.createDependency({
          episodeId: input.pharmacyCase.episodeRef.refId,
          requestId: input.pharmacyCase.originRequestId,
          domain: "pharmacy",
          domainObjectRef: `${input.pharmacyCase.pharmacyCaseId}:${purpose}`,
          requiredRouteRef: input.patientContactRouteRef,
          purpose,
          blockedActionScopeRefs: routeBlockedActionScopes[purpose],
          selectedAnchorRef: input.selectedAnchorRef,
          requestReturnBundleRef: input.requestReturnBundleRef,
          resumeContinuationRef: input.resumeContinuationRef,
          deadlineAt:
            purpose === "urgent_return"
              ? addMinutes(input.recordedAt, 30)
              : addHours(input.recordedAt, 12),
          failureEffect: purpose === "urgent_return" ? "urgent_review" : "escalate",
          assessedAt: input.recordedAt,
        })
      ).dependency;

    const refreshed = await input.reachabilityGovernor.refreshDependencyAssessment({
      reachabilityDependencyRef: dependency.dependencyId,
      assessedAt: input.recordedAt,
    });

    let repairJourneyRef = refreshed.dependency.toSnapshot().repairJourneyRef;
    if (refreshed.dependency.toSnapshot().routeHealthState !== "clear") {
      const journey = await input.reachabilityGovernor.openRepairJourney({
        reachabilityDependencyRef: refreshed.dependency.dependencyId,
        patientRecoveryLoopRef: input.patientRecoveryLoopRef,
        issuedAt: input.recordedAt,
      });
      repairJourneyRef = journey.journey.repairJourneyId;
    }

    ensured.push({
      purpose,
      dependencyId: refreshed.dependency.dependencyId,
      routeHealthState: refreshed.dependency.toSnapshot().routeHealthState,
      repairJourneyRef,
    });
  }

  const dominant = [...ensured].sort((left, right) => {
    const priority =
      left.purpose === right.purpose
        ? 0
        : left.purpose === "urgent_return"
          ? -1
          : right.purpose === "urgent_return"
            ? 1
            : left.purpose === "outcome_confirmation"
              ? -1
              : 1;
    if (priority !== 0) {
      return priority;
    }
    return routeHealthStatePriority(right.routeHealthState) - routeHealthStatePriority(left.routeHealthState);
  }).find((entry) => entry.routeHealthState !== "clear");

  return {
    dependencyRefs: ensured.map((entry) =>
      makeRef("ReachabilityDependency", entry.dependencyId, TASK_344),
    ),
    dominantDependencyRef: dominant?.dependencyId ?? null,
    repairJourneyRef: dominant?.repairJourneyRef ?? null,
  };
}

function buildPracticeVisibilityProjection(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  patientStatusProjection: PharmacyPatientStatusProjectionSnapshot;
  dispatchTruth: PharmacyDispatchTruthProjectionSnapshot | null;
  outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot | null;
  bounceBackRecord: PharmacyBounceBackRecordSnapshot;
  reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
  selectedProvider: PharmacyProvider | null;
  triageReentryState: PharmacyPracticeTriageReentryState;
  recordedAt: string;
}): PharmacyPracticeVisibilityProjectionSnapshot {
  const urgentReturnState: PharmacyPracticeUrgentReturnState =
    input.bounceBackRecord.reopenedCaseStatus === "urgent_bounce_back"
      ? "urgent_return_active"
      : input.bounceBackRecord.reopenedCaseStatus === "unresolved_returned" ||
          input.bounceBackRecord.reopenedCaseStatus === "no_contact_return_pending"
        ? "routine_return_active"
        : "none";
  const gpActionRequiredState: PharmacyPracticeGpActionRequiredState =
    input.bounceBackRecord.reopenedCaseStatus === "urgent_bounce_back"
      ? "urgent_gp_action"
      : input.bounceBackRecord.gpActionRequired
        ? "routine_review"
        : "none";
  const reachabilityRepairState: PharmacyPracticeReachabilityRepairState =
    input.reachabilityPlan === null || input.reachabilityPlan.repairState === "clear"
      ? "not_required"
      : input.reachabilityPlan.repairState === "repair_required" ||
          input.reachabilityPlan.repairState === "blocked_identity"
        ? "required"
        : "in_progress";
  const minimumNecessaryAudienceView: PharmacyPracticeMinimumNecessaryAudienceView =
    input.patientStatusProjection.currentIdentityRepairDispositionRef !== null ||
    input.bounceBackRecord.supervisorReviewState !== "not_required"
      ? "operations_attention"
      : input.bounceBackRecord.gpActionRequired
        ? "clinical_action_required"
        : "summary_only";

  return {
    pharmacyPracticeVisibilityProjectionId: stableProjectionId("pharmacy_practice_visibility", {
      pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
      bounceBackRecordId: input.bounceBackRecord.bounceBackRecordId,
      recordedAt: input.recordedAt,
    }),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
    selectedProviderRef:
      input.selectedProvider === null
        ? null
        : makeRef("PharmacyProvider", input.selectedProvider.providerId, TASK_343),
    dispatchTruthProjectionRef:
      input.dispatchTruth === null
        ? null
        : makeRef(
            "PharmacyDispatchTruthProjection",
            input.dispatchTruth.pharmacyDispatchTruthProjectionId,
            TASK_343,
          ),
    patientStatusProjectionRef: makeRef(
      "PharmacyPatientStatusProjection",
      input.patientStatusProjection.pharmacyPatientStatusProjectionId,
      TASK_344,
    ),
    latestOutcomeTruthProjectionRef:
      input.outcomeTruth === null
        ? null
        : makeRef(
            "PharmacyOutcomeTruthProjection",
            input.outcomeTruth.pharmacyOutcomeTruthProjectionId,
            TASK_343,
          ),
    latestOutcomeEvidenceRef: input.outcomeTruth?.latestOutcomeRecordRef ?? null,
    activeBounceBackRecordRef: makeRef(
      "PharmacyBounceBackRecord",
      input.bounceBackRecord.bounceBackRecordId,
      TASK_344,
    ),
    reachabilityPlanRef:
      input.reachabilityPlan === null
        ? null
        : makeRef(
            "PharmacyReachabilityPlan",
            input.reachabilityPlan.pharmacyReachabilityPlanId,
            TASK_344,
          ),
    latestPatientInstructionState: mapMacroStateToPracticeInstructionState(
      input.patientStatusProjection.currentMacroState,
    ),
    gpActionRequiredState,
    triageReentryState: input.triageReentryState,
    urgentReturnState,
    reachabilityRepairState,
    currentCloseBlockerRefs: input.pharmacyCase.currentClosureBlockerRefs.map((value) => value.refId),
    currentConfirmationGateRefs: input.pharmacyCase.currentConfirmationGateRefs.map(
      (value) => value.refId,
    ),
    minimumNecessaryAudienceView,
    wrongPatientFreezeState: input.bounceBackRecord.wrongPatientFreezeState,
    calmCopyAllowed:
      input.patientStatusProjection.calmCopyAllowed &&
      input.bounceBackRecord.supervisorReviewState === "not_required",
    computedAt: input.recordedAt,
    version: 1,
  };
}

function buildNotificationTrigger(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  patientStatusProjection: PharmacyPatientStatusProjectionSnapshot;
  shellProjection: PatientShellConsistencyProjectionSnapshot;
  bounceBackRecordId: string;
  reopenedCaseStatus: PharmacyBounceBackRecordSnapshot["reopenedCaseStatus"];
  emitPatientNotification: boolean;
  wrongPatientFreezeState: PharmacyBounceBackRecordSnapshot["wrongPatientFreezeState"];
  repairState: PharmacyReachabilityPlanSnapshot["repairState"] | null;
  recordedAt: string;
}): PharmacyReturnNotificationTriggerSnapshot | null {
  if (input.wrongPatientFreezeState === "identity_repair_active") {
    return {
      pharmacyReturnNotificationTriggerId: stableProjectionId("pharmacy_return_notification", {
        pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
        bounceBackRecordId: input.bounceBackRecordId,
        recordedAt: input.recordedAt,
        state: "suppressed",
      }),
      pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
      bounceBackRecordRef: makeRef("PharmacyBounceBackRecord", input.bounceBackRecordId, TASK_344),
      patientStatusProjectionRef: makeRef(
        "PharmacyPatientStatusProjection",
        input.patientStatusProjection.pharmacyPatientStatusProjectionId,
        TASK_344,
      ),
      notificationState: "suppressed",
      channelHint: "none",
      headlineCopyRef: "pharmacy.return.suppressed.identity_repair",
      bodyCopyRef: "pharmacy.return.suppressed.identity_repair.body",
      warningCopyRef: "pharmacy.return.suppressed.identity_repair.warning",
      selectedAnchorRef: input.shellProjection.selectedAnchorRef,
      activeReturnContractRef: input.shellProjection.activeReturnContractRef,
      generatedAt: input.recordedAt,
      patientInformedAt: null,
      version: 1,
    };
  }

  const state: PharmacyReturnNotificationState = input.emitPatientNotification ? "emitted" : "ready";
  return {
    pharmacyReturnNotificationTriggerId: stableProjectionId("pharmacy_return_notification", {
      pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
      bounceBackRecordId: input.bounceBackRecordId,
      recordedAt: input.recordedAt,
      state,
    }),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
    bounceBackRecordRef: makeRef("PharmacyBounceBackRecord", input.bounceBackRecordId, TASK_344),
    patientStatusProjectionRef: makeRef(
      "PharmacyPatientStatusProjection",
      input.patientStatusProjection.pharmacyPatientStatusProjectionId,
      TASK_344,
    ),
    notificationState: state,
    channelHint:
      input.reopenedCaseStatus === "urgent_bounce_back"
        ? "secure_message"
        : input.reopenedCaseStatus === "no_contact_return_pending" ||
            input.repairState === "repair_required"
          ? "sms"
          : "email",
    headlineCopyRef: mapReopenedStatusToNotificationHeadline(input.reopenedCaseStatus),
    bodyCopyRef: `${mapReopenedStatusToNotificationHeadline(input.reopenedCaseStatus)}.body`,
    warningCopyRef:
      input.reopenedCaseStatus === "urgent_bounce_back"
        ? "pharmacy.return.urgent_action_required.warning"
        : null,
    selectedAnchorRef: input.shellProjection.selectedAnchorRef,
    activeReturnContractRef: input.shellProjection.activeReturnContractRef,
    generatedAt: input.recordedAt,
    patientInformedAt: state === "emitted" ? input.recordedAt : null,
    version: 1,
  };
}

function buildSupervisorReviewSnapshot(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  bounceBackRecordId: string;
  materialChange: number;
  loopRisk: number;
  reopenPriorityBand: number;
  recordedAt: string;
}): PharmacyBounceBackSupervisorReviewSnapshot {
  return {
    pharmacyBounceBackSupervisorReviewId: stableProjectionId("pharmacy_bounce_back_review", {
      pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
      bounceBackRecordId: input.bounceBackRecordId,
    }),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
    bounceBackRecordRef: makeRef("PharmacyBounceBackRecord", input.bounceBackRecordId, TASK_344),
    reviewState: "required",
    loopRisk: input.loopRisk,
    materialChange: input.materialChange,
    reopenPriorityBand: input.reopenPriorityBand,
    assignedSupervisorRef: null,
    openedAt: input.recordedAt,
    lastUpdatedAt: input.recordedAt,
    resolvedAt: null,
    resolution: null,
    resolutionNotesRef: null,
    version: 1,
  };
}

function buildTruthProjection(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  bounceBackRecord: PharmacyBounceBackRecordSnapshot;
  patientStatusProjection: PharmacyPatientStatusProjectionSnapshot;
  practiceVisibilityProjection: PharmacyPracticeVisibilityProjectionSnapshot;
  reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
  notificationTrigger: PharmacyReturnNotificationTriggerSnapshot | null;
  supervisorReview: PharmacyBounceBackSupervisorReviewSnapshot | null;
  reacquisitionMode: PharmacyBounceBackReacquisitionMode;
  triageReentryState: PharmacyPracticeTriageReentryState;
  rotatedPatientEntryGrantRefs: readonly string[];
  recordedAt: string;
}): PharmacyBounceBackTruthProjectionSnapshot {
  return {
    pharmacyBounceBackTruthProjectionId: stableProjectionId("pharmacy_bounce_back_truth", {
      pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
      bounceBackRecordId: input.bounceBackRecord.bounceBackRecordId,
      recordedAt: input.recordedAt,
    }),
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCase.pharmacyCaseId, TASK_342),
    bounceBackRecordRef: makeRef(
      "PharmacyBounceBackRecord",
      input.bounceBackRecord.bounceBackRecordId,
      TASK_344,
    ),
    patientStatusProjectionRef: makeRef(
      "PharmacyPatientStatusProjection",
      input.patientStatusProjection.pharmacyPatientStatusProjectionId,
      TASK_344,
    ),
    practiceVisibilityProjectionRef: makeRef(
      "PharmacyPracticeVisibilityProjection",
      input.practiceVisibilityProjection.pharmacyPracticeVisibilityProjectionId,
      TASK_353,
    ),
    reachabilityPlanRef:
      input.reachabilityPlan === null
        ? null
        : makeRef(
            "PharmacyReachabilityPlan",
            input.reachabilityPlan.pharmacyReachabilityPlanId,
            TASK_344,
          ),
    currentNotificationTriggerRef:
      input.notificationTrigger === null
        ? null
        : makeRef(
            "PharmacyReturnNotificationTrigger",
            input.notificationTrigger.pharmacyReturnNotificationTriggerId,
            TASK_353,
          ),
    currentSupervisorReviewRef:
      input.supervisorReview === null
        ? null
        : makeRef(
            "PharmacyBounceBackSupervisorReview",
            input.supervisorReview.pharmacyBounceBackSupervisorReviewId,
            TASK_353,
          ),
    reopenedCaseStatus: input.bounceBackRecord.reopenedCaseStatus,
    returnedTaskRef: input.bounceBackRecord.returnedTaskRef,
    reacquisitionMode: input.reacquisitionMode,
    triageReentryState: input.triageReentryState,
    gpActionRequired: input.bounceBackRecord.gpActionRequired,
    materialChange: input.bounceBackRecord.materialChange,
    loopRisk: input.bounceBackRecord.loopRisk,
    reopenSignal: input.bounceBackRecord.reopenSignal,
    reopenPriorityBand: input.bounceBackRecord.reopenPriorityBand,
    patientNotificationState: input.notificationTrigger?.notificationState ?? "suppressed",
    rotatedPatientEntryGrantRefs: [...input.rotatedPatientEntryGrantRefs],
    autoRedispatchBlocked: input.bounceBackRecord.autoRedispatchBlocked,
    autoCloseBlocked: input.bounceBackRecord.autoCloseBlocked,
    computedAt: input.recordedAt,
    version: 1,
  };
}

async function loadBounceBackResult(
  repositories: Phase6PharmacyBounceBackRepositories,
  patientStatusRepositories: Phase6PharmacyPatientStatusRepositories,
  patientStatusService: Phase6PharmacyPatientStatusService,
  caseKernelService: Phase6PharmacyCaseKernelService,
  pharmacyCaseId: string,
): Promise<PharmacyBounceBackCommandResult | null> {
  const truth = await repositories.getCurrentBounceBackTruthProjectionForCase(pharmacyCaseId);
  if (truth === null) {
    return null;
  }
  const truthSnapshot = truth.toSnapshot();
  const bounceBackRecord = await repositories.getBounceBackRecord(truthSnapshot.bounceBackRecordRef.refId);
  const practiceVisibility = await repositories.getPracticeVisibilityProjection(
    truthSnapshot.practiceVisibilityProjectionRef.refId,
  );
  invariant(
    bounceBackRecord !== null && practiceVisibility !== null,
    "BOUNCE_BACK_REPLAY_DRIFT",
    `Replay for pharmacy case ${pharmacyCaseId} is missing required bounce-back artifacts.`,
  );
  const bundle = await loadCurrentCase(caseKernelService, pharmacyCaseId);
  const patientStatusProjection = await patientStatusService.getPatientPharmacyStatus(pharmacyCaseId);
  invariant(
    patientStatusProjection !== null,
    "PATIENT_STATUS_PROJECTION_REQUIRED",
    `PharmacyPatientStatusProjection missing for replayed case ${pharmacyCaseId}.`,
  );
  const notification =
    truthSnapshot.currentNotificationTriggerRef === null
      ? null
      : (
          await repositories.getReturnNotificationTrigger(
            truthSnapshot.currentNotificationTriggerRef.refId,
          )
        )?.toSnapshot() ?? null;
  const supervisorReview =
    truthSnapshot.currentSupervisorReviewRef === null
      ? null
      : (
          await repositories.getSupervisorReview(
            truthSnapshot.currentSupervisorReviewRef.refId,
          )
        )?.toSnapshot() ?? null;
  const reachabilityPlan =
    (
      await patientStatusRepositories.getCurrentReachabilityPlanForCase(
        bundle.pharmacyCase.pharmacyCaseId,
      )
    )?.toSnapshot() ?? null;
  return {
    pharmacyCase: bundle.pharmacyCase,
    bounceBackRecord: bounceBackRecord.toSnapshot(),
    bounceBackTruthProjection: truthSnapshot,
    practiceVisibilityProjection: practiceVisibility.toSnapshot(),
    patientStatusProjection,
    notificationTrigger: notification,
    supervisorReview,
    reachabilityPlan,
    replayed: true,
  };
}

export function createPhase6PharmacyBounceBackService(
  input: Phase6PharmacyBounceBackServiceDependencies = {},
): Phase6PharmacyBounceBackService {
  const repositories = input.repositories ?? createPhase6PharmacyBounceBackStore();
  const patientStatusRepositories =
    input.patientStatusRepositories ?? createPhase6PharmacyPatientStatusStore();
  const caseKernelService =
    input.caseKernelService ??
    createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });
  const directoryRepositories =
    input.directoryRepositories ?? createPhase6PharmacyDirectoryChoiceStore();
  const dispatchRepositories =
    input.dispatchRepositories ?? createPhase6PharmacyDispatchStore();
  const outcomeRepositories = input.outcomeRepositories ?? createPhase6PharmacyOutcomeStore();
  const reachabilityRepositories = input.reachabilityRepositories ?? createReachabilityStore();
  const reachabilityGovernor =
    input.reachabilityGovernor ??
    createReachabilityGovernorService(
      reachabilityRepositories,
      createDeterministicBackboneIdGenerator("phase6-pharmacy-bounce-back-reachability"),
    );
  const lifecycleRepositories =
    input.lifecycleRepositories ?? createLifecycleCoordinatorStore();
  const lifecycleService =
    input.lifecycleService ?? createLifecycleCoordinatorService(lifecycleRepositories);
  const patientStatusService =
    input.patientStatusService ??
    createPhase6PharmacyPatientStatusService({
      repositories: patientStatusRepositories,
      outcomeRepositories,
      caseKernelService,
      directoryRepositories,
      dispatchRepositories,
      reachabilityRepositories,
    });
  const idGenerator =
    input.idGenerator ?? createDeterministicBackboneIdGenerator("phase6-pharmacy-bounce-back");
  const inFlightBounceBackByReplayDigest = new Map<
    string,
    Promise<PharmacyBounceBackCommandResult>
  >();

  function nextId(kind: string): string {
    return (idGenerator.nextId as unknown as (value: string) => string)(kind);
  }

  const bounceBackNormalizer: PharmacyBounceBackNormalizer = {
    async normalizeBounceBack(preview) {
      return computeNormalizedBounceBack({
        preview,
        repositories,
        caseKernelService,
        directoryRepositories,
        dispatchRepositories,
        outcomeRepositories,
      });
    },
  };

  const pharmacyReopenPriorityCalculator: PharmacyReopenPriorityCalculator = {
    async computeReopenPriority(preview) {
      return bounceBackNormalizer.normalizeBounceBack(preview);
    },
  };

  const pharmacyUrgentReturnChannelResolver: PharmacyUrgentReturnChannelResolver = {
    async resolveUrgentReturnChannel(pharmacyCase, bounceBackType, recordedAt) {
      return ensureUrgentReturnDirectRouteProfile(
        repositories,
        pharmacyCase,
        bounceBackType,
        recordedAt,
      );
    },
  };

  const pharmacyReturnReachabilityBridge: PharmacyReturnReachabilityBridge = {
    async ensureReturnReachability(bridgeInput) {
      return ensureReachabilityDependencies({
        reachabilityGovernor,
        reachabilityRepositories,
        pharmacyCase: bridgeInput.pharmacyCase,
        patientStatusRepositories,
        patientContactRouteRef: bridgeInput.patientContactRouteRef,
        recordedAt: bridgeInput.recordedAt,
        selectedAnchorRef: bridgeInput.selectedAnchorRef,
        requestReturnBundleRef: bridgeInput.requestReturnBundleRef,
        resumeContinuationRef: bridgeInput.resumeContinuationRef,
        patientRecoveryLoopRef: bridgeInput.patientRecoveryLoopRef,
      });
    },
  };

  const pharmacyLoopSupervisorEscalationService: PharmacyLoopSupervisorEscalationService = {
    ensureSupervisorReview(reviewInput) {
      return reviewInput.loopRisk >= bounceBackThresholds.tau_loop
        ? buildSupervisorReviewSnapshot(reviewInput)
        : null;
    },
  };

  const pharmacyBounceBackTruthProjectionBuilder: PharmacyBounceBackTruthProjectionBuilder = {
    buildBounceBackTruth(truthInput) {
      return buildTruthProjection(truthInput);
    },
  };

  const pharmacyReopenLeaseService: PharmacyReopenLeaseService = {
    async reacquireTriageLease(leaseInput) {
      const fence = await seedLifecycleScopeForCase(
        lifecycleRepositories,
        lifecycleService,
        leaseInput.pharmacyCase,
        leaseInput.recordedAt,
      );
      const lifecycleResult = await lifecycleService.recordLifecycleSignal({
        episodeId: leaseInput.pharmacyCase.episodeRef.refId,
        requestId: leaseInput.pharmacyCase.originRequestId,
        requestLineageRef: leaseInput.pharmacyCase.requestLineageRef.refId,
        sourceDomain: "pharmacy",
        signalFamily: "reopen",
        signalType: `pharmacy.return.${leaseInput.bounceBackType}`,
        domainObjectRef: leaseInput.replayDigest,
        milestoneHint: "triage_active",
        presentedLineageEpoch: fence.currentEpoch,
        occurredAt: leaseInput.recordedAt,
        recordedAt: leaseInput.recordedAt,
        causalTokenRef: stableReviewDigest({
          replayDigest: leaseInput.replayDigest,
          recordedAt: leaseInput.recordedAt,
        }),
        reopenTriggerFamily: mapBounceBackTypeToReopenTriggerFamily(leaseInput.bounceBackType),
        reopenTargetState: "triage_active",
        uUrgent: leaseInput.uUrgent,
        uUnable: leaseInput.uUnable,
        uContact: leaseInput.uContact,
        uBounce: leaseInput.reopenSignal,
        deltaClinical: leaseInput.deltaClinical,
        deltaContact: leaseInput.deltaContact,
        deltaProvider: leaseInput.deltaProvider,
        deltaConsent: leaseInput.deltaConsent,
        deltaTiming: leaseInput.deltaTiming,
        returnCount: (await repositories.listBounceBackRecordsByCase(leaseInput.pharmacyCase.pharmacyCaseId))
          .length,
        blockingReachabilityRefs: [...leaseInput.blockingReachabilityRefs],
        blockingApprovalRefs: [],
        blockingConfirmationRefs: leaseInput.pharmacyCase.currentConfirmationGateRefs.map(
          (value) => value.refId,
        ),
        blockingReconciliationRefs: [],
        blockingGrantRefs: [],
        blockingLineageCaseLinkRefs: [leaseInput.pharmacyCase.lineageCaseLinkRef.refId],
      });
      return lifecycleResult.reopenedRecord === null ? "reentry_pending" : "triage_active";
    },
  };

  const pharmacyBounceBackRecordService: PharmacyBounceBackRecordService = {
    async ingestBounceBack(command) {
      return service.ingestBounceBackEvidence(command);
    },
  };

  async function projectArtifacts(inputValue: {
    pharmacyCase: PharmacyCaseSnapshot;
    shellProjection: PatientShellConsistencyProjectionSnapshot;
    computed: NormalizedBounceBackComputation;
    bounceBackRecord: PharmacyBounceBackRecordSnapshot;
    reacquisitionMode: PharmacyBounceBackReacquisitionMode;
    triageReentryState: PharmacyPracticeTriageReentryState;
    rotatedPatientEntryGrantRefs: readonly string[];
    emitPatientNotification: boolean;
    recordedAt: string;
  }): Promise<{
    updatedRecord: PharmacyBounceBackRecordSnapshot;
    practiceVisibilityProjection: PharmacyPracticeVisibilityProjectionSnapshot;
    patientStatusProjection: PharmacyPatientStatusProjectionSnapshot;
    notificationTrigger: PharmacyReturnNotificationTriggerSnapshot | null;
    supervisorReview: PharmacyBounceBackSupervisorReviewSnapshot | null;
    reachabilityPlan: PharmacyReachabilityPlanSnapshot | null;
    truthProjection: PharmacyBounceBackTruthProjectionSnapshot;
  }> {
    const patientBundle = await patientStatusService.projectPatientStatus({
      pharmacyCaseId: inputValue.pharmacyCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        inputValue.shellProjection.patientShellConsistencyProjectionId,
      recordedAt: inputValue.recordedAt,
    });
    const reachabilityPlan =
      (
        await patientStatusRepositories.getCurrentReachabilityPlanForCase(
          inputValue.pharmacyCase.pharmacyCaseId,
        )
      )?.toSnapshot() ?? patientBundle.reachabilityPlan;
    const practiceVisibilityProjection = buildPracticeVisibilityProjection({
      pharmacyCase: patientBundle.pharmacyCase,
      patientStatusProjection: patientBundle.patientStatusProjection,
      dispatchTruth: inputValue.pharmacyCase.activeDispatchAttemptRef
        ? (
            await dispatchRepositories.getCurrentDispatchTruthProjectionForCase(
              inputValue.pharmacyCase.pharmacyCaseId,
            )
          )?.toSnapshot() ?? null
        : null,
      outcomeTruth:
        (
          await outcomeRepositories.getCurrentOutcomeTruthProjectionForCase(
            inputValue.pharmacyCase.pharmacyCaseId,
          )
        )?.toSnapshot() ?? null,
      bounceBackRecord: inputValue.bounceBackRecord,
      reachabilityPlan,
      selectedProvider: inputValue.computed.selectedProvider,
      triageReentryState: inputValue.triageReentryState,
      recordedAt: inputValue.recordedAt,
    });
    await repositories.savePracticeVisibilityProjection(practiceVisibilityProjection);

    const notificationTrigger = buildNotificationTrigger({
      pharmacyCase: patientBundle.pharmacyCase,
      patientStatusProjection: patientBundle.patientStatusProjection,
      shellProjection: inputValue.shellProjection,
      bounceBackRecordId: inputValue.bounceBackRecord.bounceBackRecordId,
      reopenedCaseStatus: inputValue.bounceBackRecord.reopenedCaseStatus,
      emitPatientNotification: inputValue.emitPatientNotification,
      wrongPatientFreezeState: inputValue.bounceBackRecord.wrongPatientFreezeState,
      repairState: reachabilityPlan?.repairState ?? null,
      recordedAt: inputValue.recordedAt,
    });
    if (notificationTrigger !== null) {
      await repositories.saveReturnNotificationTrigger(notificationTrigger);
    }

    const supervisorReview =
      inputValue.computed.supervisorReviewRequired
        ? buildSupervisorReviewSnapshot({
            pharmacyCase: patientBundle.pharmacyCase,
            bounceBackRecordId: inputValue.bounceBackRecord.bounceBackRecordId,
            materialChange: inputValue.computed.materialChange,
            loopRisk: inputValue.computed.loopRisk,
            reopenPriorityBand: inputValue.computed.reopenPriorityBand,
            recordedAt: inputValue.recordedAt,
          })
        : null;
    if (supervisorReview !== null) {
      await repositories.saveSupervisorReview(supervisorReview);
    }

    const updatedRecord: PharmacyBounceBackRecordSnapshot = {
      ...inputValue.bounceBackRecord,
      patientInstructionRef: makeRef(
        "PharmacyPatientStatusProjection",
        patientBundle.patientStatusProjection.pharmacyPatientStatusProjectionId,
        TASK_344,
      ),
      practiceVisibilityRef: makeRef(
        "PharmacyPracticeVisibilityProjection",
        practiceVisibilityProjection.pharmacyPracticeVisibilityProjectionId,
        TASK_344,
      ),
      currentReachabilityPlanRef:
        reachabilityPlan === null
          ? null
          : makeRef("PharmacyReachabilityPlan", reachabilityPlan.pharmacyReachabilityPlanId, TASK_344),
      patientInformedAt: notificationTrigger?.patientInformedAt ?? null,
      supervisorReviewState:
        supervisorReview === null ? "not_required" : supervisorReview.reviewState,
      updatedAt: inputValue.recordedAt,
      version: nextVersion(inputValue.bounceBackRecord.version),
    };
    await repositories.saveBounceBackRecord(updatedRecord, {
      expectedVersion: inputValue.bounceBackRecord.version,
    });
    await patientStatusRepositories.saveBounceBackRecord(updatedRecord);

    const truthProjection = buildTruthProjection({
      pharmacyCase: patientBundle.pharmacyCase,
      bounceBackRecord: updatedRecord,
      patientStatusProjection: patientBundle.patientStatusProjection,
      practiceVisibilityProjection,
      reachabilityPlan,
      notificationTrigger,
      supervisorReview,
      reacquisitionMode: inputValue.reacquisitionMode,
      triageReentryState: inputValue.triageReentryState,
      rotatedPatientEntryGrantRefs: inputValue.rotatedPatientEntryGrantRefs,
      recordedAt: inputValue.recordedAt,
    });
    await repositories.saveBounceBackTruthProjection(truthProjection);

    return {
      updatedRecord,
      practiceVisibilityProjection,
      patientStatusProjection: patientBundle.patientStatusProjection,
      notificationTrigger,
      supervisorReview,
      reachabilityPlan,
      truthProjection,
    };
  }

  const service: Phase6PharmacyBounceBackService = {
    async previewNormalizedBounceBack(preview) {
      return pharmacyReopenPriorityCalculator.computeReopenPriority(preview);
    },

    async ingestBounceBackEvidence(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const computed = await bounceBackNormalizer.normalizeBounceBack(command);

      const replayedRecordId = await repositories.findBounceBackReplay(
        computed.normalizedEnvelope.replayDigest,
      );
      if (replayedRecordId !== null) {
        const replayed = await loadBounceBackResult(
          repositories,
          patientStatusRepositories,
          patientStatusService,
          caseKernelService,
          command.pharmacyCaseId,
        );
        if (replayed !== null) {
          return replayed;
        }
      }

      const inFlight = inFlightBounceBackByReplayDigest.get(computed.normalizedEnvelope.replayDigest);
      if (inFlight !== undefined) {
        return inFlight;
      }

      const ingestPromise = (async () => {
        await repositories.saveBounceBackEvidenceEnvelope(computed.normalizedEnvelope);

        const shellProjection = await patientStatusRepositories.getPatientShellConsistencyProjection(
          command.patientShellConsistencyProjectionId,
        );
        invariant(
          shellProjection !== null,
          "PATIENT_SHELL_CONSISTENCY_PROJECTION_NOT_FOUND",
          `PatientShellConsistencyProjection ${command.patientShellConsistencyProjectionId} was not found.`,
        );

        const patientContactRouteRef =
          optionalText(command.patientContactRouteRef) ??
          (
            await patientStatusRepositories.getCurrentReachabilityPlanForCase(command.pharmacyCaseId)
          )?.toSnapshot().patientContactRouteRef ??
          null;
        invariant(
          patientContactRouteRef !== null,
          "PATIENT_CONTACT_ROUTE_REF_REQUIRED",
          "patientContactRouteRef is required until a current PharmacyReachabilityPlan exists.",
        );

        const reachability = await pharmacyReturnReachabilityBridge.ensureReturnReachability({
          pharmacyCase: computed.pharmacyCase,
          patientContactRouteRef,
          recordedAt,
          selectedAnchorRef: shellProjection.toSnapshot().selectedAnchorRef,
          requestReturnBundleRef: shellProjection.toSnapshot().activeReturnContractRef,
          resumeContinuationRef: shellProjection.toSnapshot().bundleVersion,
          patientRecoveryLoopRef: command.patientRecoveryLoopRef ?? null,
        });

        const directUrgentRoute =
          computed.bounceBackType === "urgent_gp_return" ||
          computed.bounceBackType === "safeguarding_concern"
            ? await pharmacyUrgentReturnChannelResolver.resolveUrgentReturnChannel(
                computed.pharmacyCase,
                computed.bounceBackType,
                recordedAt,
              )
            : null;

        const reacquisitionMode: PharmacyBounceBackReacquisitionMode =
          computed.reopenPriorityBand >= 3 || computed.supervisorReviewRequired
            ? "duty_task"
            : "original_request";
        const returnedTaskRef =
          reacquisitionMode === "duty_task"
            ? `duty_task:${computed.pharmacyCase.tenantId}:${computed.pharmacyCase.originRequestId}:${computed.bounceBackType}:${recordedAt}`
            : `request_reacquisition:${computed.pharmacyCase.originRequestId}:${computed.reopenPriorityBand}`;

        const closeBlockerRefs = uniqueSorted([
          ...computed.pharmacyCase.currentClosureBlockerRefs.map((value) => value.refId),
          `pharmacy_bounce_back_close:${computed.pharmacyCase.pharmacyCaseId}`,
          computed.supervisorReviewRequired
            ? `pharmacy_loop_review:${computed.pharmacyCase.pharmacyCaseId}`
            : "",
        ]).map((refId) => makeRef("ClosureBlocker", refId, TASK_344));

        const provisionalRecord: PharmacyBounceBackRecordSnapshot = {
          bounceBackRecordId: nextId("pharmacyBounceBackRecord"),
          pharmacyCaseRef: makeRef("PharmacyCase", computed.pharmacyCase.pharmacyCaseId, TASK_342),
          bounceBackEvidenceEnvelopeRef: makeRef(
            "PharmacyBounceBackEvidenceEnvelope",
            computed.normalizedEnvelope.pharmacyBounceBackEvidenceEnvelopeId,
            TASK_344,
          ),
          bounceBackType: computed.bounceBackType,
          normalizedEvidenceRefs: computed.normalizedEnvelope.normalizedEvidenceRefs,
          urgencyCarryFloor: computed.urgencyCarryFloor,
          materialChange: computed.materialChange,
          loopRisk: computed.loopRisk,
          reopenSignal: computed.reopenSignal,
          reopenPriorityBand: computed.reopenPriorityBand,
          sourceOutcomeOrDispatchRef: command.sourceOutcomeOrDispatchRef ?? null,
          reachabilityDependencyRef: reachability.dominantDependencyRef,
          patientInstructionRef: makeRef(
            "PharmacyPatientStatusProjection",
            `pending:${computed.pharmacyCase.pharmacyCaseId}`,
            TASK_344,
          ),
          practiceVisibilityRef: makeRef(
            "PharmacyPracticeVisibilityProjection",
            `pending:${computed.pharmacyCase.pharmacyCaseId}`,
            TASK_344,
          ),
          supervisorReviewState: computed.supervisorReviewRequired ? "required" : "not_required",
          directUrgentRouteRef:
            directUrgentRoute === null
              ? null
              : makeRef(
                  "UrgentReturnDirectRouteProfile",
                  directUrgentRoute.urgentReturnDirectRouteProfileId,
                  TASK_344,
                ),
          gpActionRequired: computed.gpActionRequired,
          reopenedCaseStatus: computed.reopenedCaseStatus,
          currentReachabilityPlanRef: null,
          wrongPatientFreezeState:
            computed.pharmacyCase.activeIdentityRepairCaseRef === null
              ? "clear"
              : "identity_repair_active",
          autoRedispatchBlocked:
            computed.supervisorReviewRequired ||
            computed.reopenedCaseStatus === "urgent_bounce_back" ||
            computed.reopenedCaseStatus === "no_contact_return_pending",
          autoCloseBlocked: true,
          returnedTaskRef,
          reopenByAt: computed.reopenByAt,
          patientInformedAt: null,
          createdAt: recordedAt,
          updatedAt: recordedAt,
          version: 1,
        };
        await repositories.saveBounceBackRecord(provisionalRecord);
        await patientStatusRepositories.saveBounceBackRecord(provisionalRecord);

        const existingBundle = await loadCurrentCase(caseKernelService, command.pharmacyCaseId);
        const caseMutation =
          existingBundle.pharmacyCase.status === "referred" ||
          existingBundle.pharmacyCase.status === "consultation_outcome_pending" ||
          existingBundle.pharmacyCase.status === "outcome_reconciliation_pending"
            ? await caseKernelService.capturePharmacyOutcome({
                pharmacyCaseId: computed.pharmacyCase.pharmacyCaseId,
                actorRef: command.actorRef,
                commandActionRecordRef: command.commandActionRecordRef,
                commandSettlementRecordRef: command.commandSettlementRecordRef,
                leaseRef: command.leaseRef,
                expectedOwnershipEpoch: command.expectedOwnershipEpoch,
                expectedLineageFenceRef: command.expectedLineageFenceRef,
                scopedMutationGateRef: command.scopedMutationGateRef,
                reasonCode: command.reasonCode,
                recordedAt,
                idempotencyKey:
                  command.idempotencyKey ??
                  `pharmacy_bounce_back:${computed.normalizedEnvelope.replayDigest}`,
                outcomeRef:
                  command.sourceOutcomeOrDispatchRef?.targetFamily === "PharmacyOutcomeSettlement"
                    ? command.sourceOutcomeOrDispatchRef
                    : null,
                disposition: computed.reopenedCaseStatus,
                bounceBackRef: makeRef(
                  "PharmacyBounceBackRecord",
                  provisionalRecord.bounceBackRecordId,
                  TASK_344,
                ),
                currentClosureBlockerRefs: closeBlockerRefs,
                activeReachabilityDependencyRefs: reachability.dependencyRefs,
              })
            : {
                pharmacyCase: existingBundle.pharmacyCase,
                lineageCaseLink: existingBundle.lineageCaseLink,
                transitionJournalEntries: [],
                eventJournalEntries: [],
                emittedEvents: [],
                staleOwnerRecovery: existingBundle.staleOwnerRecovery,
                replayed: false,
              };

        const triageReentryState =
          computed.pharmacyCase.activeIdentityRepairCaseRef === null
            ? await pharmacyReopenLeaseService.reacquireTriageLease({
                pharmacyCase: caseMutation.pharmacyCase,
                recordedAt,
                replayDigest: provisionalRecord.bounceBackRecordId,
                bounceBackType: computed.bounceBackType,
                uUrgent: computed.uUrgent,
                uUnable: computed.uUnable,
                uContact: computed.uContact,
                reopenSignal: computed.reopenSignal,
                deltaClinical: computed.deltaClinical,
                deltaContact: computed.deltaContact,
                deltaProvider: computed.deltaProvider,
                deltaConsent: computed.deltaConsent,
                deltaTiming: computed.deltaTiming,
                blockingReachabilityRefs: reachability.dependencyRefs.map((value) => value.refId),
              })
            : ("reentry_pending" as PharmacyPracticeTriageReentryState);

        const rotatedPatientEntryGrantRefs =
          reachability.dominantDependencyRef === null
            ? []
            : [
                `rotated_patient_entry_grant:${caseMutation.pharmacyCase.pharmacyCaseId}:${reachability.dominantDependencyRef}`,
              ];

        const projected = await projectArtifacts({
          pharmacyCase: caseMutation.pharmacyCase,
          shellProjection: shellProjection.toSnapshot(),
          computed,
          bounceBackRecord: provisionalRecord,
          reacquisitionMode,
          triageReentryState,
          rotatedPatientEntryGrantRefs,
          emitPatientNotification: Boolean(command.emitPatientNotification ?? true),
          recordedAt,
        });

        await repositories.saveBounceBackReplay(
          computed.normalizedEnvelope.replayDigest,
          projected.updatedRecord.bounceBackRecordId,
        );

        return {
          pharmacyCase: caseMutation.pharmacyCase,
          bounceBackRecord: projected.updatedRecord,
          bounceBackTruthProjection: projected.truthProjection,
          practiceVisibilityProjection: projected.practiceVisibilityProjection,
          patientStatusProjection: projected.patientStatusProjection,
          notificationTrigger: projected.notificationTrigger,
          supervisorReview: projected.supervisorReview,
          reachabilityPlan: projected.reachabilityPlan,
          replayed: false,
        };
      })();
      inFlightBounceBackByReplayDigest.set(computed.normalizedEnvelope.replayDigest, ingestPromise);
      try {
        return await ingestPromise;
      } finally {
        inFlightBounceBackByReplayDigest.delete(computed.normalizedEnvelope.replayDigest);
      }
    },

    async reopenCaseFromBounceBack(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const bounceBackRecord = await repositories.getBounceBackRecord(command.bounceBackRecordId);
      invariant(
        bounceBackRecord !== null,
        "BOUNCE_BACK_RECORD_NOT_FOUND",
        `PharmacyBounceBackRecord ${command.bounceBackRecordId} was not found.`,
      );
      const currentRecord = bounceBackRecord.toSnapshot();
      invariant(
        currentRecord.supervisorReviewState !== "required" &&
          currentRecord.supervisorReviewState !== "in_review",
        "SUPERVISOR_REVIEW_REQUIRED",
        "Supervisor review must resolve before the case can reopen from bounce-back.",
      );
      const shellProjection = await patientStatusRepositories.getPatientShellConsistencyProjection(
        command.patientShellConsistencyProjectionId,
      );
      invariant(
        shellProjection !== null,
        "PATIENT_SHELL_CONSISTENCY_PROJECTION_NOT_FOUND",
        `PatientShellConsistencyProjection ${command.patientShellConsistencyProjectionId} was not found.`,
      );
      const reopened = await caseKernelService.reopenPharmacyCase({
        ...command,
        clearOutcomeRef: command.clearOutcomeRef ?? false,
        clearBounceBackRef: command.clearBounceBackRef ?? false,
        currentClosureBlockerRefs: [],
        activeReachabilityDependencyRefs:
          currentRecord.currentReachabilityPlanRef === null
            ? []
            : (
                await patientStatusRepositories.getCurrentReachabilityPlanForCase(
                  command.pharmacyCaseId,
                )
              )?.toSnapshot().dominantBrokenDependency === "none"
              ? []
              : reopenedActiveReachabilityRefs(
                  (
                    await patientStatusRepositories.getCurrentReachabilityPlanForCase(
                      command.pharmacyCaseId,
                    )
                  )?.toSnapshot() ?? null,
                ),
      });

      const currentTruth = await repositories.getCurrentBounceBackTruthProjectionForCase(
        command.pharmacyCaseId,
      );
      invariant(
        currentTruth !== null,
        "BOUNCE_BACK_TRUTH_PROJECTION_NOT_FOUND",
        `PharmacyBounceBackTruthProjection missing for case ${command.pharmacyCaseId}.`,
      );
      const patientBundle = await patientStatusService.projectPatientStatus({
        pharmacyCaseId: command.pharmacyCaseId,
        patientShellConsistencyProjectionId:
          shellProjection.toSnapshot().patientShellConsistencyProjectionId,
        recordedAt,
      });
      const updatedTruth = withMonotoneVersion(
        {
          ...currentTruth.toSnapshot(),
          patientStatusProjectionRef: makeRef(
            "PharmacyPatientStatusProjection",
            patientBundle.patientStatusProjection.pharmacyPatientStatusProjectionId,
            TASK_344,
          ),
          triageReentryState: "triage_active" as PharmacyPracticeTriageReentryState,
          computedAt: recordedAt,
          version: 1,
        },
        currentTruth.toSnapshot(),
        (value) => value.pharmacyBounceBackTruthProjectionId,
      );
      const currentDispatchTruth =
        (
          await dispatchRepositories.getCurrentDispatchTruthProjectionForCase(command.pharmacyCaseId)
        )?.toSnapshot() ?? null;
      const currentOutcomeTruth =
        (
          await outcomeRepositories.getCurrentOutcomeTruthProjectionForCase(command.pharmacyCaseId)
        )?.toSnapshot() ?? null;
      const nextPracticeVisibilityProjection = buildPracticeVisibilityProjection({
        pharmacyCase: reopened.pharmacyCase,
        patientStatusProjection: patientBundle.patientStatusProjection,
        dispatchTruth: currentDispatchTruth,
        outcomeTruth: currentOutcomeTruth,
        bounceBackRecord: currentRecord,
        reachabilityPlan: patientBundle.reachabilityPlan,
        selectedProvider: null,
        triageReentryState: "triage_active",
        recordedAt,
      });
      await repositories.savePracticeVisibilityProjection(nextPracticeVisibilityProjection);

      const finalTruth = {
        ...updatedTruth,
        practiceVisibilityProjectionRef: makeRef(
          "PharmacyPracticeVisibilityProjection",
          nextPracticeVisibilityProjection.pharmacyPracticeVisibilityProjectionId,
          TASK_353,
        ),
      };
      await repositories.saveBounceBackTruthProjection(finalTruth);

      return {
        pharmacyCase: reopened.pharmacyCase,
        bounceBackRecord: currentRecord,
        bounceBackTruthProjection: finalTruth,
        practiceVisibilityProjection: nextPracticeVisibilityProjection,
        patientStatusProjection: patientBundle.patientStatusProjection,
        notificationTrigger:
          (
            await repositories.getCurrentReturnNotificationTriggerForCase(command.pharmacyCaseId)
          )?.toSnapshot() ?? null,
        supervisorReview:
          (
            await repositories.getCurrentSupervisorReviewForCase(command.pharmacyCaseId)
          )?.toSnapshot() ?? null,
        reachabilityPlan: patientBundle.reachabilityPlan,
        replayed: false,
      };
    },

    async getActiveBounceBackSummary(pharmacyCaseId) {
      return (
        await repositories.getCurrentBounceBackTruthProjectionForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },

    async getLoopRiskAndSupervisorPosture(pharmacyCaseId) {
      const current = await repositories.getCurrentBounceBackRecordForCase(pharmacyCaseId);
      if (current === null) {
        return null;
      }
      const snapshot = current.toSnapshot();
      return {
        pharmacyCaseId,
        bounceBackRecordId: snapshot.bounceBackRecordId,
        materialChange: snapshot.materialChange,
        loopRisk: snapshot.loopRisk,
        reopenPriorityBand: snapshot.reopenPriorityBand,
        supervisorReviewState: snapshot.supervisorReviewState,
        autoRedispatchBlocked: snapshot.autoRedispatchBlocked,
        autoCloseBlocked: snapshot.autoCloseBlocked,
      };
    },

    async getReturnSpecificPatientMessagePreview(pharmacyCaseId) {
      return (
        await repositories.getCurrentReturnNotificationTriggerForCase(pharmacyCaseId)
      )?.toSnapshot() ?? null;
    },

    async resolveSupervisorReview(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const currentRecordDocument = await repositories.getBounceBackRecord(command.bounceBackRecordId);
      invariant(
        currentRecordDocument !== null,
        "BOUNCE_BACK_RECORD_NOT_FOUND",
        `PharmacyBounceBackRecord ${command.bounceBackRecordId} was not found.`,
      );
      const currentRecord = currentRecordDocument.toSnapshot();
      const currentReviewDocument =
        await repositories.getCurrentSupervisorReviewForCase(command.pharmacyCaseId);
      invariant(
        currentReviewDocument !== null,
        "SUPERVISOR_REVIEW_NOT_FOUND",
        `Supervisor review for case ${command.pharmacyCaseId} was not found.`,
      );
      const currentReview = currentReviewDocument.toSnapshot();
      invariant(
        currentReview.bounceBackRecordRef.refId === command.bounceBackRecordId,
        "SUPERVISOR_REVIEW_RECORD_MISMATCH",
        `Supervisor review ${currentReview.pharmacyBounceBackSupervisorReviewId} is not bound to ${command.bounceBackRecordId}.`,
      );

      const nextReview: PharmacyBounceBackSupervisorReviewSnapshot = {
        ...currentReview,
        reviewState: "resolved",
        assignedSupervisorRef: command.assignedSupervisorRef ?? currentReview.assignedSupervisorRef,
        resolvedAt: recordedAt,
        resolution: command.resolution,
        resolutionNotesRef: command.resolutionNotesRef ?? currentReview.resolutionNotesRef,
        lastUpdatedAt: recordedAt,
        version: nextVersion(currentReview.version),
      };
      await repositories.saveSupervisorReview(nextReview, {
        expectedVersion: currentReview.version,
      });

      const nextRecord: PharmacyBounceBackRecordSnapshot = {
        ...currentRecord,
        supervisorReviewState: "resolved",
        autoRedispatchBlocked: command.resolution === "resolved_keep_block",
        updatedAt: recordedAt,
        version: nextVersion(currentRecord.version),
      };
      await repositories.saveBounceBackRecord(nextRecord, {
        expectedVersion: currentRecord.version,
      });
      await patientStatusRepositories.saveBounceBackRecord(nextRecord);

      const truthProjectionDocument =
        await repositories.getCurrentBounceBackTruthProjectionForCase(command.pharmacyCaseId);
      invariant(
        truthProjectionDocument !== null,
        "BOUNCE_BACK_TRUTH_PROJECTION_NOT_FOUND",
        `PharmacyBounceBackTruthProjection for case ${command.pharmacyCaseId} was not found.`,
      );
      const nextTruth: PharmacyBounceBackTruthProjectionSnapshot = {
        ...truthProjectionDocument.toSnapshot(),
        currentSupervisorReviewRef: makeRef(
          "PharmacyBounceBackSupervisorReview",
          nextReview.pharmacyBounceBackSupervisorReviewId,
          TASK_353,
        ),
        autoRedispatchBlocked: nextRecord.autoRedispatchBlocked,
        computedAt: recordedAt,
        version: nextVersion(truthProjectionDocument.toSnapshot().version),
      };
      const patientStatusProjection = await patientStatusService.getPatientPharmacyStatus(
        command.pharmacyCaseId,
      );
      invariant(
        patientStatusProjection !== null,
        "PATIENT_STATUS_PROJECTION_REQUIRED",
        `PharmacyPatientStatusProjection missing for case ${command.pharmacyCaseId}.`,
      );

      const currentCase = await loadCurrentCase(caseKernelService, command.pharmacyCaseId);
      const currentDispatchTruth =
        (
          await dispatchRepositories.getCurrentDispatchTruthProjectionForCase(command.pharmacyCaseId)
        )?.toSnapshot() ?? null;
      const currentOutcomeTruth =
        (
          await outcomeRepositories.getCurrentOutcomeTruthProjectionForCase(command.pharmacyCaseId)
        )?.toSnapshot() ?? null;
      const nextPracticeVisibilityProjection = buildPracticeVisibilityProjection({
        pharmacyCase: currentCase.pharmacyCase,
        patientStatusProjection,
        dispatchTruth: currentDispatchTruth,
        outcomeTruth: currentOutcomeTruth,
        bounceBackRecord: nextRecord,
        reachabilityPlan:
          (
            await patientStatusRepositories.getCurrentReachabilityPlanForCase(command.pharmacyCaseId)
          )?.toSnapshot() ?? null,
        selectedProvider: null,
        triageReentryState: nextTruth.triageReentryState,
        recordedAt,
      });
      await repositories.savePracticeVisibilityProjection(nextPracticeVisibilityProjection);
      const finalTruth: PharmacyBounceBackTruthProjectionSnapshot = {
        ...nextTruth,
        patientStatusProjectionRef: makeRef(
          "PharmacyPatientStatusProjection",
          patientStatusProjection.pharmacyPatientStatusProjectionId,
          TASK_344,
        ),
        practiceVisibilityProjectionRef: makeRef(
          "PharmacyPracticeVisibilityProjection",
          nextPracticeVisibilityProjection.pharmacyPracticeVisibilityProjectionId,
          TASK_353,
        ),
      };
      await repositories.saveBounceBackTruthProjection(finalTruth, {
        expectedVersion: truthProjectionDocument.toSnapshot().version,
      });
      return {
        pharmacyCase: currentCase.pharmacyCase,
        bounceBackRecord: nextRecord,
        bounceBackTruthProjection: finalTruth,
        practiceVisibilityProjection: nextPracticeVisibilityProjection,
        patientStatusProjection,
        notificationTrigger:
          (
            await repositories.getCurrentReturnNotificationTriggerForCase(command.pharmacyCaseId)
          )?.toSnapshot() ?? null,
        supervisorReview: nextReview,
        reachabilityPlan:
          (
            await patientStatusRepositories.getCurrentReachabilityPlanForCase(command.pharmacyCaseId)
          )?.toSnapshot() ?? null,
        replayed: false,
      };
    },
  };

  return service;
}

function reopenedActiveReachabilityRefs(
  plan: PharmacyReachabilityPlanSnapshot | null,
): readonly AggregateRef<"ReachabilityDependency", Task344>[] {
  if (plan === null) {
    return [];
  }
  return uniqueSorted([
    plan.pharmacyContactDependencyRef,
    plan.outcomeConfirmationDependencyRef,
    plan.urgentReturnDependencyRef,
  ]).map((refId) => makeRef("ReachabilityDependency", refId, TASK_344));
}
