import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import {
  createPhase5ActingScopeVisibilityService,
  type ActingContextSnapshot,
  type CrossOrganisationVisibilityEnvelopeSnapshot,
  type MinimumNecessaryProjectionResult,
  type Phase5ActingScopeVisibilityService,
} from "./phase5-acting-context-visibility-kernel";
import {
  createPhase5AlternativeOfferEngineStore,
  type HubOfferToConfirmationTruthProjectionSnapshot,
  type Phase5AlternativeOfferEngineRepositories,
} from "./phase5-alternative-offer-engine";
import {
  createPhase5EnhancedAccessPolicyService,
  type NetworkPolicyEvaluationResult,
  type Phase5EnhancedAccessPolicyService,
  type PolicyEvaluationFactsSnapshot,
} from "./phase5-enhanced-access-policy-engine";
import {
  createPhase5HubCaseKernelService,
  type HubCaseBundle,
  type Phase5HubCaseKernelService,
} from "./phase5-hub-case-kernel";
import {
  createPhase5HubCommitEngineStore,
  type HubAppointmentRecordSnapshot,
  type HubContinuityEvidenceProjectionSnapshot,
  type HubSupplierMirrorStateSnapshot,
  type Phase5HubCommitEngineRepositories,
} from "./phase5-hub-commit-engine";
import {
  createPhase5PracticeContinuityService,
  createPhase5PracticeContinuityStore,
  type CurrentPracticeContinuityState,
  type Phase5PracticeContinuityService,
  type PracticeVisibilityDeltaRecordSnapshot,
} from "./phase5-practice-continuity-engine";

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
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256Hex(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function addMinutes(timestamp: string, minutes: number): string {
  const date = new Date(timestamp);
  date.setTime(date.getTime() + minutes * 60_000);
  return date.toISOString();
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

const DEFAULT_SOURCE_REFS = [
  "blueprint/phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility",
  "blueprint/patient-account-and-communications-blueprint.md#ConversationThreadProjection",
  "blueprint/patient-portal-experience-architecture-blueprint.md#Booking and manage continuity",
  "blueprint/phase-0-the-foundation-protocol.md#2.8 ScopedMutationGate",
  "blueprint/phase-0-the-foundation-protocol.md#1.8F ReachabilityAssessmentRecord",
  "blueprint/phase-0-the-foundation-protocol.md#1.9B ContactRouteVerificationCheckpoint",
  "docs/architecture/313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md",
  "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_REMINDERS_AND_MANAGE_REFRESH.json",
].sort();

export const reminderTransportChannels = ["sms", "email", "app_inbox"] as const;
export type ReminderTransportChannel = (typeof reminderTransportChannels)[number];

export const networkReminderScheduleStates = [
  "draft",
  "scheduled",
  "queued",
  "sent",
  "delivery_blocked",
  "disputed",
  "cancelled",
  "completed",
] as const;
export type NetworkReminderScheduleState = (typeof networkReminderScheduleStates)[number];

export const networkReminderTransportAckStates = [
  "none",
  "accepted",
  "rejected",
  "timed_out",
] as const;
export type NetworkReminderTransportAckState =
  (typeof networkReminderTransportAckStates)[number];

export const networkReminderDeliveryEvidenceStates = [
  "pending",
  "delivered",
  "disputed",
  "failed",
  "expired",
  "suppressed",
] as const;
export type NetworkReminderDeliveryEvidenceState =
  (typeof networkReminderDeliveryEvidenceStates)[number];

export const networkReminderDeliveryRiskStates = [
  "on_track",
  "at_risk",
  "likely_failed",
  "disputed",
] as const;
export type NetworkReminderDeliveryRiskState =
  (typeof networkReminderDeliveryRiskStates)[number];

export const networkReminderOutcomeStates = [
  "scheduled",
  "awaiting_delivery_truth",
  "delivered",
  "callback_fallback",
  "settled",
  "recovery_required",
  "suppressed",
] as const;
export type NetworkReminderAuthoritativeOutcomeState =
  (typeof networkReminderOutcomeStates)[number];

export const reminderConfidenceBands = ["high", "medium", "low"] as const;
export type ReminderConfidenceBand = (typeof reminderConfidenceBands)[number];

export const reminderAssessmentStates = ["clear", "at_risk", "blocked", "disputed"] as const;
export type ReminderAssessmentState = (typeof reminderAssessmentStates)[number];

export const reminderRouteAuthorityStates = [
  "current",
  "stale_verification",
  "stale_demographics",
  "stale_preferences",
  "disputed",
] as const;
export type ReminderRouteAuthorityState = (typeof reminderRouteAuthorityStates)[number];

export const reminderRebindStates = ["not_required", "rebound", "repair_required"] as const;
export type ReminderRebindState = (typeof reminderRebindStates)[number];

export const reminderTimelinePublicationKinds = [
  "reminder_scheduled",
  "reminder_suppressed",
  "reminder_failed",
  "reminder_delivered",
  "manage_settlement",
] as const;
export type ReminderTimelinePublicationKind =
  (typeof reminderTimelinePublicationKinds)[number];

export const manageActionScopes = [
  "cancel",
  "reschedule",
  "callback_request",
  "details_update",
] as const;
export type HubManageActionScope = (typeof manageActionScopes)[number];

export const manageCapabilityStates = ["live", "stale", "blocked", "expired"] as const;
export type NetworkManageCapabilityState = (typeof manageCapabilityStates)[number];

export const manageReadOnlyModes = ["interactive", "read_only"] as const;
export type NetworkManageReadOnlyMode = (typeof manageReadOnlyModes)[number];

export const manageSettlementResults = [
  "applied",
  "provider_pending",
  "stale_recoverable",
  "blocked_dependency",
  "identity_recheck_required",
  "reconciliation_required",
  "unsupported_capability",
] as const;
export type HubManageSettlementResult = (typeof manageSettlementResults)[number];

export const visibilityProjectionStates = [
  "not_published",
  "published_pending_ack",
  "acknowledged",
  "stale",
  "superseded",
] as const;
export type PracticeVisibilityProjectionState =
  (typeof visibilityProjectionStates)[number];

export const visibilityProjectionAckStates = [
  "not_required",
  "ack_pending",
  "acknowledged",
  "exception_recorded",
  "superseded",
] as const;
export type PracticeVisibilityProjectionAckState =
  (typeof visibilityProjectionAckStates)[number];

export interface NetworkReminderScheduleSnapshot {
  networkReminderScheduleId: string;
  reminderPlanRef: string;
  scheduledFor: string;
  scheduleKind: "primary" | "follow_up" | "repair";
  scheduleState: "scheduled" | "suppressed" | "completed" | "cancelled";
  templateVersionRef: string;
  routeProfileRef: string;
  contactRouteVersionRef: string;
  reachabilityAssessmentRef: string;
  truthTupleHash: string;
  createdAt: string;
  sentAt: string | null;
  sourceRefs: readonly string[];
  version: number;
}

export interface NetworkReminderDeliveryEvidenceSnapshot {
  networkReminderDeliveryEvidenceId: string;
  reminderPlanRef: string;
  reminderScheduleRef: string;
  observedAt: string;
  evidenceState: NetworkReminderDeliveryEvidenceState;
  transportAckState: NetworkReminderTransportAckState;
  deliveryRiskState: NetworkReminderDeliveryRiskState;
  adapterName: string;
  adapterCorrelationKey: string | null;
  externalDispatchRef: string | null;
  suppressionReasonRefs: readonly string[];
  sourceRefs: readonly string[];
  version: number;
}

export interface NetworkReminderPlanSnapshot {
  networkReminderPlanId: string;
  hubCoordinationCaseId: string;
  hubAppointmentId: string;
  threadId: string;
  conversationClusterRef: string;
  conversationSubthreadRef: string;
  communicationEnvelopeRef: string;
  templateSetRef: string;
  templateVersionRef: string;
  routeProfileRef: string;
  channel: ReminderTransportChannel;
  payloadRef: string;
  contactRouteRef: string;
  contactRouteVersionRef: string;
  currentContactRouteSnapshotRef: string;
  reachabilityDependencyRef: string;
  currentReachabilityAssessmentRef: string;
  reachabilityEpoch: number;
  contactRepairJourneyRef: string;
  deliveryModelVersionRef: string;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef: string;
  transitionEnvelopeRef: string;
  releaseRecoveryDispositionRef: string;
  appointmentVersionRef: string;
  truthTupleHash: string;
  scheduleRefs: readonly string[];
  scheduleState: NetworkReminderScheduleState;
  transportAckState: NetworkReminderTransportAckState;
  deliveryEvidenceState: NetworkReminderDeliveryEvidenceState;
  deliveryRiskState: NetworkReminderDeliveryRiskState;
  authoritativeOutcomeState: NetworkReminderAuthoritativeOutcomeState;
  stateConfidenceBand: ReminderConfidenceBand;
  suppressionReasonRefs: readonly string[];
  deliveryEvidenceRefs: readonly string[];
  lastDeliveryAttemptAt: string | null;
  nextAttemptAt: string | null;
  nextReminderDueAt: string | null;
  causalToken: string;
  monotoneRevision: number;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface ReminderTimelinePublicationSnapshot {
  reminderTimelinePublicationId: string;
  reminderPlanRef: string;
  publicationKind: ReminderTimelinePublicationKind;
  threadId: string;
  conversationSubthreadRef: string;
  communicationEnvelopeRef: string;
  publicationRef: string;
  publishedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface NetworkManageCapabilitiesSnapshot {
  networkManageCapabilitiesId: string;
  hubCoordinationCaseId: string;
  hubAppointmentId: string;
  appointmentVersionRef: string;
  capabilityState: NetworkManageCapabilityState;
  readOnlyMode: NetworkManageReadOnlyMode;
  reasonCode: string;
  policyTupleHash: string;
  truthTupleHash: string;
  visibilityEnvelopeVersionRef: string;
  supplierTruthVersionRef: string;
  sessionFenceToken: string;
  subjectFenceToken: string;
  manageWindowEndsAt: string;
  allowedActions: readonly HubManageActionScope[];
  blockedReasonRefs: readonly string[];
  fallbackRouteRef: string | null;
  compiledPolicyBundleRef: string;
  enhancedAccessPolicyRef: string;
  practiceVisibilityPolicyRef: string;
  policyEvaluationRef: string;
  routeIntentRef: string;
  subjectRef: string;
  sessionEpochRef: string;
  subjectBindingVersionRef: string;
  manifestVersionRef: string | null;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeState: "monitoring" | "frozen" | "kill_switch_active" | "rollback_recommended" | "released";
  mutationGateRef: string;
  consistencyToken: string;
  stateConfidenceBand: ReminderConfidenceBand;
  causalToken: string;
  monotoneRevision: number;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubManageSettlementSnapshot {
  hubManageSettlementId: string;
  idempotencyKey: string;
  hubCoordinationCaseId: string;
  hubAppointmentId: string;
  networkManageCapabilitiesRef: string;
  actionScope: HubManageActionScope;
  routeIntentRef: string;
  mutationGateRef: string;
  lineageFenceEpoch: number;
  result: HubManageSettlementResult;
  experienceContinuityEvidenceRef: string | null;
  causalToken: string;
  transitionEnvelopeRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  stateConfidenceBand: ReminderConfidenceBand;
  recoveryRouteRef: string | null;
  presentationArtifactRef: string | null;
  blockerRefs: readonly string[];
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface PracticeVisibilityProjectionSnapshot {
  practiceVisibilityProjectionId: string;
  hubCoordinationCaseId: string;
  hubAppointmentId: string;
  originPracticeOds: string;
  bundleVersion: number;
  entityVersionRefs: readonly string[];
  minimumNecessaryViewRef: string;
  visibilityEnvelopeVersionRef: string;
  crossOrganisationVisibilityEnvelopeRef: string;
  actingContextRef: string;
  actingScopeTupleRef: string;
  practiceVisibilityPolicyRef: string;
  serviceObligationPolicyRef: string;
  policyEvaluationRef: string;
  policyTupleHash: string;
  minimumNecessaryContractRef: string;
  slotSummaryRef: string;
  confirmationState: string;
  patientFacingStateRef: string;
  notificationState: string;
  ackGeneration: number;
  practiceAcknowledgementState: PracticeVisibilityProjectionAckState;
  manageSettlementState: string;
  supplierMirrorState: string;
  latestContinuityMessageRef: string | null;
  truthProjectionRef: string;
  truthTupleHash: string;
  experienceContinuityEvidenceRef: string | null;
  transitionEnvelopeRef: string;
  releaseRecoveryDispositionRef: string;
  patientSafeStatus: string;
  projectionState: PracticeVisibilityProjectionState;
  visibleFieldRefs: readonly string[];
  hiddenFieldRefs: readonly string[];
  stateConfidenceBand: ReminderConfidenceBand;
  actionRequiredState: string;
  staleAt: string;
  causalToken: string;
  monotoneRevision: number;
  recordedAt: string;
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

export interface Phase5ReminderManageVisibilityRepositories {
  getReminderPlan(
    networkReminderPlanId: string,
  ): Promise<SnapshotDocument<NetworkReminderPlanSnapshot> | null>;
  getCurrentReminderPlanForAppointment(
    hubAppointmentId: string,
  ): Promise<SnapshotDocument<NetworkReminderPlanSnapshot> | null>;
  saveReminderPlan(
    snapshot: NetworkReminderPlanSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReminderSchedule(
    networkReminderScheduleId: string,
  ): Promise<SnapshotDocument<NetworkReminderScheduleSnapshot> | null>;
  saveReminderSchedule(
    snapshot: NetworkReminderScheduleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listReminderSchedulesForPlan(
    networkReminderPlanId: string,
  ): Promise<readonly SnapshotDocument<NetworkReminderScheduleSnapshot>[]>;
  saveReminderDeliveryEvidence(
    snapshot: NetworkReminderDeliveryEvidenceSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listReminderDeliveryEvidenceForPlan(
    networkReminderPlanId: string,
  ): Promise<readonly SnapshotDocument<NetworkReminderDeliveryEvidenceSnapshot>[]>;
  appendTimelinePublication(snapshot: ReminderTimelinePublicationSnapshot): Promise<void>;
  listTimelinePublicationsForPlan(
    networkReminderPlanId: string,
  ): Promise<readonly SnapshotDocument<ReminderTimelinePublicationSnapshot>[]>;
  getManageCapabilities(
    networkManageCapabilitiesId: string,
  ): Promise<SnapshotDocument<NetworkManageCapabilitiesSnapshot> | null>;
  getCurrentManageCapabilitiesForAppointment(
    hubAppointmentId: string,
  ): Promise<SnapshotDocument<NetworkManageCapabilitiesSnapshot> | null>;
  saveManageCapabilities(
    snapshot: NetworkManageCapabilitiesSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getManageSettlement(
    hubManageSettlementId: string,
  ): Promise<SnapshotDocument<HubManageSettlementSnapshot> | null>;
  findManageSettlementByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<SnapshotDocument<HubManageSettlementSnapshot> | null>;
  saveManageSettlement(
    snapshot: HubManageSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listManageSettlementsForAppointment(
    hubAppointmentId: string,
  ): Promise<readonly SnapshotDocument<HubManageSettlementSnapshot>[]>;
  getPracticeVisibilityProjection(
    practiceVisibilityProjectionId: string,
  ): Promise<SnapshotDocument<PracticeVisibilityProjectionSnapshot> | null>;
  getCurrentPracticeVisibilityProjectionForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<PracticeVisibilityProjectionSnapshot> | null>;
  savePracticeVisibilityProjection(
    snapshot: PracticeVisibilityProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listPracticeVisibilityProjectionsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<PracticeVisibilityProjectionSnapshot>[]>;
}

export class Phase5ReminderManageVisibilityStore
  implements Phase5ReminderManageVisibilityRepositories
{
  private readonly reminderPlans = new Map<string, NetworkReminderPlanSnapshot>();
  private readonly currentReminderPlanByAppointment = new Map<string, string>();
  private readonly reminderSchedules = new Map<string, NetworkReminderScheduleSnapshot>();
  private readonly schedulesByPlan = new Map<string, string[]>();
  private readonly reminderEvidence = new Map<string, NetworkReminderDeliveryEvidenceSnapshot>();
  private readonly evidenceByPlan = new Map<string, string[]>();
  private readonly timelinePublications = new Map<string, ReminderTimelinePublicationSnapshot[]>();
  private readonly manageCapabilities = new Map<string, NetworkManageCapabilitiesSnapshot>();
  private readonly currentManageCapabilitiesByAppointment = new Map<string, string>();
  private readonly manageSettlements = new Map<string, HubManageSettlementSnapshot>();
  private readonly manageSettlementByIdempotencyKey = new Map<string, string>();
  private readonly settlementsByAppointment = new Map<string, string[]>();
  private readonly practiceVisibilityProjections = new Map<
    string,
    PracticeVisibilityProjectionSnapshot
  >();
  private readonly currentPracticeVisibilityProjectionByCase = new Map<string, string>();
  private readonly practiceVisibilityHistoryByCase = new Map<string, string[]>();

  private pushIndex(index: Map<string, string[]>, key: string, id: string) {
    const current = index.get(key) ?? [];
    if (!current.includes(id)) {
      index.set(key, [...current, id]);
    }
  }

  async getReminderPlan(networkReminderPlanId: string) {
    const row = this.reminderPlans.get(networkReminderPlanId);
    return row ? new StoredDocument(row) : null;
  }

  async getCurrentReminderPlanForAppointment(hubAppointmentId: string) {
    const id = this.currentReminderPlanByAppointment.get(hubAppointmentId);
    return id ? this.getReminderPlan(id) : null;
  }

  async saveReminderPlan(
    snapshot: NetworkReminderPlanSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.reminderPlans, snapshot.networkReminderPlanId, snapshot, options);
    this.currentReminderPlanByAppointment.set(
      snapshot.hubAppointmentId,
      snapshot.networkReminderPlanId,
    );
  }

  async getReminderSchedule(networkReminderScheduleId: string) {
    const row = this.reminderSchedules.get(networkReminderScheduleId);
    return row ? new StoredDocument(row) : null;
  }

  async saveReminderSchedule(
    snapshot: NetworkReminderScheduleSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.reminderSchedules, snapshot.networkReminderScheduleId, snapshot, options);
    this.pushIndex(this.schedulesByPlan, snapshot.reminderPlanRef, snapshot.networkReminderScheduleId);
  }

  async listReminderSchedulesForPlan(networkReminderPlanId: string) {
    return (this.schedulesByPlan.get(networkReminderPlanId) ?? [])
      .map((id) => this.reminderSchedules.get(id))
      .filter((value): value is NetworkReminderScheduleSnapshot => value !== undefined)
      .sort((left, right) => compareIso(left.scheduledFor, right.scheduledFor))
      .map((value) => new StoredDocument(value));
  }

  async saveReminderDeliveryEvidence(
    snapshot: NetworkReminderDeliveryEvidenceSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.reminderEvidence,
      snapshot.networkReminderDeliveryEvidenceId,
      snapshot,
      options,
    );
    this.pushIndex(this.evidenceByPlan, snapshot.reminderPlanRef, snapshot.networkReminderDeliveryEvidenceId);
  }

  async listReminderDeliveryEvidenceForPlan(networkReminderPlanId: string) {
    return (this.evidenceByPlan.get(networkReminderPlanId) ?? [])
      .map((id) => this.reminderEvidence.get(id))
      .filter((value): value is NetworkReminderDeliveryEvidenceSnapshot => value !== undefined)
      .sort((left, right) => compareIso(left.observedAt, right.observedAt))
      .map((value) => new StoredDocument(value));
  }

  async appendTimelinePublication(snapshot: ReminderTimelinePublicationSnapshot) {
    const current = this.timelinePublications.get(snapshot.reminderPlanRef) ?? [];
    this.timelinePublications.set(snapshot.reminderPlanRef, [...current, structuredClone(snapshot)]);
  }

  async listTimelinePublicationsForPlan(networkReminderPlanId: string) {
    return (this.timelinePublications.get(networkReminderPlanId) ?? [])
      .sort((left, right) => compareIso(left.publishedAt, right.publishedAt))
      .map((value) => new StoredDocument(value));
  }

  async getManageCapabilities(networkManageCapabilitiesId: string) {
    const row = this.manageCapabilities.get(networkManageCapabilitiesId);
    return row ? new StoredDocument(row) : null;
  }

  async getCurrentManageCapabilitiesForAppointment(hubAppointmentId: string) {
    const id = this.currentManageCapabilitiesByAppointment.get(hubAppointmentId);
    return id ? this.getManageCapabilities(id) : null;
  }

  async saveManageCapabilities(
    snapshot: NetworkManageCapabilitiesSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.manageCapabilities, snapshot.networkManageCapabilitiesId, snapshot, options);
    this.currentManageCapabilitiesByAppointment.set(
      snapshot.hubAppointmentId,
      snapshot.networkManageCapabilitiesId,
    );
  }

  async getManageSettlement(hubManageSettlementId: string) {
    const row = this.manageSettlements.get(hubManageSettlementId);
    return row ? new StoredDocument(row) : null;
  }

  async findManageSettlementByIdempotencyKey(idempotencyKey: string) {
    const id = this.manageSettlementByIdempotencyKey.get(idempotencyKey);
    return id ? this.getManageSettlement(id) : null;
  }

  async saveManageSettlement(
    snapshot: HubManageSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.manageSettlements, snapshot.hubManageSettlementId, snapshot, options);
    this.manageSettlementByIdempotencyKey.set(snapshot.idempotencyKey, snapshot.hubManageSettlementId);
    this.pushIndex(this.settlementsByAppointment, snapshot.hubAppointmentId, snapshot.hubManageSettlementId);
  }

  async listManageSettlementsForAppointment(hubAppointmentId: string) {
    return (this.settlementsByAppointment.get(hubAppointmentId) ?? [])
      .map((id) => this.manageSettlements.get(id))
      .filter((value): value is HubManageSettlementSnapshot => value !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((value) => new StoredDocument(value));
  }

  async getPracticeVisibilityProjection(practiceVisibilityProjectionId: string) {
    const row = this.practiceVisibilityProjections.get(practiceVisibilityProjectionId);
    return row ? new StoredDocument(row) : null;
  }

  async getCurrentPracticeVisibilityProjectionForCase(hubCoordinationCaseId: string) {
    const id = this.currentPracticeVisibilityProjectionByCase.get(hubCoordinationCaseId);
    return id ? this.getPracticeVisibilityProjection(id) : null;
  }

  async savePracticeVisibilityProjection(
    snapshot: PracticeVisibilityProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.practiceVisibilityProjections,
      snapshot.practiceVisibilityProjectionId,
      snapshot,
      options,
    );
    this.currentPracticeVisibilityProjectionByCase.set(
      snapshot.hubCoordinationCaseId,
      snapshot.practiceVisibilityProjectionId,
    );
    this.pushIndex(
      this.practiceVisibilityHistoryByCase,
      snapshot.hubCoordinationCaseId,
      snapshot.practiceVisibilityProjectionId,
    );
  }

  async listPracticeVisibilityProjectionsForCase(hubCoordinationCaseId: string) {
    return (this.practiceVisibilityHistoryByCase.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.practiceVisibilityProjections.get(id))
      .filter((value): value is PracticeVisibilityProjectionSnapshot => value !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((value) => new StoredDocument(value));
  }
}

export function createPhase5ReminderManageVisibilityStore(): Phase5ReminderManageVisibilityStore {
  return new Phase5ReminderManageVisibilityStore();
}

export interface ReminderTimelinePublisherInput {
  reminderPlan: NetworkReminderPlanSnapshot;
  publicationKind: ReminderTimelinePublicationKind;
  publishedAt: string;
}

export interface ReminderTimelinePublisherResult {
  publicationRef: string;
}

export interface ReminderTimelinePublisher {
  publish(input: ReminderTimelinePublisherInput): Promise<ReminderTimelinePublisherResult>;
}

function createStaticReminderTimelinePublisher(): ReminderTimelinePublisher {
  return {
    async publish(input) {
      return {
        publicationRef: `${input.reminderPlan.networkReminderPlanId}::${input.publicationKind}::${input.publishedAt}`,
      };
    },
  };
}

export function createReminderTimelinePublisher(): ReminderTimelinePublisher {
  return createStaticReminderTimelinePublisher();
}

export interface NetworkReminderDispatchAdapterInput {
  reminderPlan: NetworkReminderPlanSnapshot;
  reminderSchedule: NetworkReminderScheduleSnapshot;
  attemptedAt: string;
}

export interface NetworkReminderDispatchAdapterResult {
  outcome: "accepted" | "rejected" | "timed_out";
  adapterName: string;
  adapterCorrelationKey?: string | null;
  externalDispatchRef?: string | null;
}

export interface NetworkReminderDispatchAdapter {
  channel: ReminderTransportChannel;
  dispatch(
    input: NetworkReminderDispatchAdapterInput,
  ): Promise<NetworkReminderDispatchAdapterResult>;
}

function createStaticReminderDispatchAdapter(
  channel: ReminderTransportChannel,
  adapterName: string,
  resultFactory: (
    input: NetworkReminderDispatchAdapterInput,
  ) => NetworkReminderDispatchAdapterResult,
): NetworkReminderDispatchAdapter {
  return {
    channel,
    async dispatch(input) {
      return resultFactory(input);
    },
  };
}

export function createSmsNetworkReminderDispatchAdapter(): NetworkReminderDispatchAdapter {
  return createStaticReminderDispatchAdapter("sms", "sms", (input) => ({
    outcome: "accepted",
    adapterName: "sms",
    adapterCorrelationKey: `${input.reminderPlan.networkReminderPlanId}::sms`,
    externalDispatchRef: `${input.reminderSchedule.networkReminderScheduleId}::sms-dispatch`,
  }));
}

export function createEmailNetworkReminderDispatchAdapter(): NetworkReminderDispatchAdapter {
  return createStaticReminderDispatchAdapter("email", "email", (input) => ({
    outcome: "accepted",
    adapterName: "email",
    adapterCorrelationKey: `${input.reminderPlan.networkReminderPlanId}::email`,
    externalDispatchRef: `${input.reminderSchedule.networkReminderScheduleId}::email-dispatch`,
  }));
}

export function createAppInboxNetworkReminderDispatchAdapter(): NetworkReminderDispatchAdapter {
  return createStaticReminderDispatchAdapter("app_inbox", "app_inbox", (input) => ({
    outcome: "accepted",
    adapterName: "app_inbox",
    adapterCorrelationKey: `${input.reminderPlan.networkReminderPlanId}::app-inbox`,
    externalDispatchRef: `${input.reminderSchedule.networkReminderScheduleId}::app-inbox-dispatch`,
  }));
}

export interface ReminderPlanDispositionInput {
  authoritativeConfirmation: boolean;
  assessmentState: ReminderAssessmentState;
  routeAuthorityState: ReminderRouteAuthorityState;
  rebindState: ReminderRebindState;
  continuityValidationState: HubContinuityEvidenceProjectionSnapshot["validationState"];
}

export interface ReminderPlanDisposition {
  scheduleState: NetworkReminderScheduleState;
  transportAckState: NetworkReminderTransportAckState;
  deliveryEvidenceState: NetworkReminderDeliveryEvidenceState;
  deliveryRiskState: NetworkReminderDeliveryRiskState;
  authoritativeOutcomeState: NetworkReminderAuthoritativeOutcomeState;
  stateConfidenceBand: ReminderConfidenceBand;
  suppressionReasonRefs: readonly string[];
}

function routeIsClear(input: {
  assessmentState: ReminderAssessmentState;
  routeAuthorityState: ReminderRouteAuthorityState;
  rebindState: ReminderRebindState;
}): boolean {
  return (
    input.assessmentState === "clear" &&
    input.routeAuthorityState === "current" &&
    (input.rebindState === "rebound" || input.rebindState === "not_required")
  );
}

export function evaluateReminderPlanDisposition(
  input: ReminderPlanDispositionInput,
): ReminderPlanDisposition {
  if (!input.authoritativeConfirmation) {
    return {
      scheduleState: "draft",
      transportAckState: "none",
      deliveryEvidenceState: "suppressed",
      deliveryRiskState: "at_risk",
      authoritativeOutcomeState: "recovery_required",
      stateConfidenceBand: "low",
      suppressionReasonRefs: ["authoritative_confirmation_missing"],
    };
  }
  if (input.continuityValidationState !== "trusted") {
    return {
      scheduleState: "delivery_blocked",
      transportAckState: "none",
      deliveryEvidenceState: "suppressed",
      deliveryRiskState: "disputed",
      authoritativeOutcomeState: "recovery_required",
      stateConfidenceBand: "low",
      suppressionReasonRefs: [`continuity_${input.continuityValidationState}`],
    };
  }
  if (!routeIsClear(input)) {
    return {
      scheduleState: "delivery_blocked",
      transportAckState: "none",
      deliveryEvidenceState: "suppressed",
      deliveryRiskState:
        input.assessmentState === "disputed" || input.routeAuthorityState === "disputed"
          ? "disputed"
          : "likely_failed",
      authoritativeOutcomeState: "suppressed",
      stateConfidenceBand: "medium",
      suppressionReasonRefs: uniqueSortedRefs([
        input.assessmentState === "clear" ? "" : `reachability_${input.assessmentState}`,
        input.routeAuthorityState === "current"
          ? ""
          : `route_authority_${input.routeAuthorityState}`,
        input.rebindState === "repair_required" ? "contact_route_repair_required" : "",
      ]),
    };
  }
  return {
    scheduleState: "scheduled",
    transportAckState: "none",
    deliveryEvidenceState: "pending",
    deliveryRiskState: "on_track",
    authoritativeOutcomeState: "scheduled",
    stateConfidenceBand: "high",
    suppressionReasonRefs: [],
  };
}

export interface ManageCapabilityLeaseInput {
  authoritativeConfirmation: boolean;
  continuityValidationState: HubContinuityEvidenceProjectionSnapshot["validationState"];
  supplierDriftState: HubSupplierMirrorStateSnapshot["driftState"] | "not_started";
  manageFreezeState: HubSupplierMirrorStateSnapshot["manageFreezeState"] | "live";
  ackDebtOpen: boolean;
  identityHoldState: boolean;
  assessmentState: ReminderAssessmentState;
  routeAuthorityState: ReminderRouteAuthorityState;
  rebindState: ReminderRebindState;
  policyTupleCurrent: boolean;
  channelReleaseFreezeState: NetworkManageCapabilitiesSnapshot["channelReleaseFreezeState"];
  sessionCurrent: boolean;
  subjectBindingCurrent: boolean;
  publicationCurrent: boolean;
  supportedActions: readonly HubManageActionScope[];
}

export interface ManageCapabilityLeaseDecision {
  capabilityState: NetworkManageCapabilityState;
  readOnlyMode: NetworkManageReadOnlyMode;
  reasonCode: string;
  allowedActions: readonly HubManageActionScope[];
  blockedReasonRefs: readonly string[];
  fallbackRouteRef: string | null;
  stateConfidenceBand: ReminderConfidenceBand;
}

function fallbackRouteForBlockedReasons(reasons: readonly string[]): string | null {
  if (reasons.includes("session_expired")) {
    return "patient_session_rebind";
  }
  if (reasons.includes("subject_binding_stale")) {
    return "patient_session_rebind";
  }
  if (reasons.includes("publication_stale")) {
    return "patient_manage_refresh";
  }
  if (reasons.includes("contact_route_repair_required")) {
    return "patient_contact_route_repair";
  }
  if (
    reasons.some((reason) => reason.startsWith("supplier_")) ||
    reasons.includes("manage_frozen")
  ) {
    return "hub_manage_reconciliation";
  }
  if (reasons.includes("identity_hold")) {
    return "patient_identity_recheck";
  }
  if (reasons.includes("practice_ack_debt_open")) {
    return "hub_practice_visibility_review";
  }
  if (reasons.includes("embedded_release_frozen")) {
    return "patient_browser_handoff";
  }
  if (reasons.includes("authoritative_confirmation_missing")) {
    return "hub_confirmation_recovery";
  }
  return reasons.length > 0 ? "patient_manage_read_only" : null;
}

export function evaluateManageCapabilityLease(
  input: ManageCapabilityLeaseInput,
): ManageCapabilityLeaseDecision {
  const blockedReasonRefs = uniqueSortedRefs([
    input.authoritativeConfirmation ? "" : "authoritative_confirmation_missing",
    input.continuityValidationState === "trusted"
      ? ""
      : `continuity_${input.continuityValidationState}`,
    input.supplierDriftState === "aligned" || input.supplierDriftState === "not_started"
      ? ""
      : `supplier_${input.supplierDriftState}`,
    input.manageFreezeState === "live" ? "" : "manage_frozen",
    input.ackDebtOpen ? "practice_ack_debt_open" : "",
    input.identityHoldState ? "identity_hold" : "",
    routeIsClear(input) ? "" : "contact_route_repair_required",
    input.policyTupleCurrent ? "" : "policy_tuple_drift",
    input.sessionCurrent ? "" : "session_expired",
    input.subjectBindingCurrent ? "" : "subject_binding_stale",
    input.publicationCurrent ? "" : "publication_stale",
    input.channelReleaseFreezeState === "frozen" ||
    input.channelReleaseFreezeState === "kill_switch_active" ||
    input.channelReleaseFreezeState === "rollback_recommended"
      ? "embedded_release_frozen"
      : "",
  ]);

  const capabilityState: NetworkManageCapabilityState = blockedReasonRefs.includes("session_expired")
    ? "expired"
    : blockedReasonRefs.some((reason) =>
          reason === "policy_tuple_drift" ||
          reason === "subject_binding_stale" ||
          reason === "publication_stale" ||
          reason.startsWith("supplier_"),
        )
      ? "stale"
      : blockedReasonRefs.length > 0
        ? "blocked"
        : "live";
  const readOnlyMode: NetworkManageReadOnlyMode =
    capabilityState === "live" ? "interactive" : "read_only";
  const stateConfidenceBand: ReminderConfidenceBand =
    capabilityState === "live"
      ? "high"
      : capabilityState === "stale"
        ? "medium"
        : "low";
  return {
    capabilityState,
    readOnlyMode,
    reasonCode: blockedReasonRefs[0] ?? "live",
    allowedActions: capabilityState === "live" ? uniqueSortedRefs(input.supportedActions) as HubManageActionScope[] : [],
    blockedReasonRefs,
    fallbackRouteRef: fallbackRouteForBlockedReasons(blockedReasonRefs),
    stateConfidenceBand,
  };
}

function isAuthoritativeAppointment(appointment: HubAppointmentRecordSnapshot): boolean {
  return (
    appointment.externalConfirmationState === "confirmed" &&
    (appointment.appointmentState === "confirmed" ||
      appointment.appointmentState === "confirmed_pending_practice_ack")
  );
}

function mapContinuityAckState(
  continuityState: CurrentPracticeContinuityState,
  appointment: HubAppointmentRecordSnapshot,
): PracticeVisibilityProjectionAckState {
  const acknowledgement = continuityState.currentAcknowledgement;
  if (acknowledgement) {
    switch (acknowledgement.ackState) {
      case "received":
        return "acknowledged";
      case "exception_recorded":
        return "exception_recorded";
      case "superseded":
        return "superseded";
      default:
        return "ack_pending";
    }
  }
  switch (appointment.practiceAcknowledgementState) {
    case "not_required":
      return "not_required";
    case "acknowledged":
      return "acknowledged";
    case "exception_recorded":
      return "exception_recorded";
    case "superseded":
      return "superseded";
    default:
      return "ack_pending";
  }
}

function manageSettlementStateFromResult(
  settlement: HubManageSettlementSnapshot | null,
): string {
  return settlement?.result ?? "none";
}

function latestSupplierMirrorState(
  mirrorState: HubSupplierMirrorStateSnapshot | null,
): string {
  return mirrorState?.driftState ?? "not_started";
}

function notificationStateFromReminder(
  reminderPlan: NetworkReminderPlanSnapshot | null,
  continuityState: CurrentPracticeContinuityState,
): string {
  if (reminderPlan) {
    switch (reminderPlan.authoritativeOutcomeState) {
      case "scheduled":
        return "reminder_scheduled";
      case "delivered":
      case "settled":
        return "reminder_delivered";
      case "suppressed":
        return "reminder_suppressed";
      case "recovery_required":
        return "reminder_recovery_required";
      case "callback_fallback":
        return "callback_fallback";
      default:
        return "reminder_pending";
    }
  }
  if (continuityState.currentMessage) {
    return `continuity_${continuityState.currentMessage.messageState}`;
  }
  return "not_started";
}

function actionRequiredState(input: {
  reminderPlan: NetworkReminderPlanSnapshot | null;
  acknowledgementState: PracticeVisibilityProjectionAckState;
  mirrorState: HubSupplierMirrorStateSnapshot | null;
  latestManageSettlement: HubManageSettlementSnapshot | null;
}): string {
  if (
    input.reminderPlan &&
    (input.reminderPlan.scheduleState === "delivery_blocked" ||
      input.reminderPlan.authoritativeOutcomeState === "recovery_required")
  ) {
    return "contact_route_repair";
  }
  if (
    input.mirrorState &&
    (input.mirrorState.driftState === "drift_detected" ||
      input.mirrorState.driftState === "disputed" ||
      input.mirrorState.manageFreezeState !== "live")
  ) {
    return "supplier_review_required";
  }
  if (
    input.latestManageSettlement &&
    input.latestManageSettlement.result !== "applied" &&
    input.latestManageSettlement.result !== "provider_pending"
  ) {
    return "manage_recovery_required";
  }
  if (input.acknowledgementState !== "acknowledged" && input.acknowledgementState !== "not_required") {
    return "practice_ack_required";
  }
  return "none";
}

function patientSafeStatus(input: {
  appointment: HubAppointmentRecordSnapshot;
  reminderPlan: NetworkReminderPlanSnapshot | null;
  latestManageSettlement: HubManageSettlementSnapshot | null;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
}): string {
  if (input.truthProjection.patientVisibilityState === "recovery_required") {
    return "recovery_required";
  }
  if (
    input.latestManageSettlement &&
    input.latestManageSettlement.result !== "applied" &&
    input.latestManageSettlement.result !== "provider_pending"
  ) {
    return `manage_${input.latestManageSettlement.result}`;
  }
  if (
    input.reminderPlan &&
    (input.reminderPlan.authoritativeOutcomeState === "recovery_required" ||
      input.reminderPlan.authoritativeOutcomeState === "suppressed")
  ) {
    return `reminder_${input.reminderPlan.authoritativeOutcomeState}`;
  }
  return input.appointment.appointmentState === "confirmed"
    ? "confirmed_network_booking"
    : "confirmed_network_booking_pending_practice_ack";
}

function projectionStateFromContext(input: {
  envelope: CrossOrganisationVisibilityEnvelopeSnapshot;
  acknowledgementState: PracticeVisibilityProjectionAckState;
}): PracticeVisibilityProjectionState {
  if (input.envelope.envelopeState !== "current") {
    return "stale";
  }
  if (input.acknowledgementState === "acknowledged" || input.acknowledgementState === "not_required") {
    return "acknowledged";
  }
  return "published_pending_ack";
}

function projectionConfidenceBand(input: {
  envelope: CrossOrganisationVisibilityEnvelopeSnapshot;
  reminderPlan: NetworkReminderPlanSnapshot | null;
  mirrorState: HubSupplierMirrorStateSnapshot | null;
  latestManageSettlement: HubManageSettlementSnapshot | null;
  acknowledgementState: PracticeVisibilityProjectionAckState;
}): ReminderConfidenceBand {
  if (input.envelope.envelopeState !== "current") {
    return "low";
  }
  if (
    input.reminderPlan &&
    (input.reminderPlan.deliveryRiskState === "likely_failed" ||
      input.reminderPlan.deliveryRiskState === "disputed")
  ) {
    return "low";
  }
  if (
    input.mirrorState &&
    (input.mirrorState.driftState === "drift_detected" ||
      input.mirrorState.driftState === "disputed")
  ) {
    return "low";
  }
  if (
    input.latestManageSettlement &&
    input.latestManageSettlement.result !== "applied" &&
    input.latestManageSettlement.result !== "provider_pending"
  ) {
    return "medium";
  }
  if (input.acknowledgementState !== "acknowledged" && input.acknowledgementState !== "not_required") {
    return "medium";
  }
  return "high";
}

function buildPolicyFacts(
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot,
  minimumNecessaryContractRef: string,
  overrides?: Partial<PolicyEvaluationFactsSnapshot>,
): PolicyEvaluationFactsSnapshot {
  return {
    routeToNetworkRequested: true,
    urgentBounceRequired: false,
    requiredWindowFit: null,
    sourceAdmissionSummary: [],
    staleCapacityDetected: false,
    adjustedPopulation: null,
    deliveredMinutes: null,
    availableMinutes: null,
    cancelledMinutes: null,
    replacementMinutes: null,
    commissionerExceptionRef: null,
    minimumNecessaryContractRef,
    ackDebtOpen:
      truthProjection.practiceVisibilityState !== "acknowledged" &&
      truthProjection.practiceVisibilityState !== "exception_granted",
    visibilityDeltaRequired: truthProjection.practiceVisibilityState !== "not_started",
    ...(overrides ?? {}),
  };
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

function requireBundle(bundle: HubCaseBundle | null, hubCoordinationCaseId: string): HubCaseBundle {
  invariant(
    bundle !== null,
    "HUB_CASE_BUNDLE_NOT_FOUND",
    `HubCoordinationCase ${hubCoordinationCaseId} was not found.`,
  );
  return bundle;
}

interface ReminderManageContext {
  hubCaseBundle: HubCaseBundle;
  appointment: HubAppointmentRecordSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  continuityProjection: HubContinuityEvidenceProjectionSnapshot | null;
  mirrorState: HubSupplierMirrorStateSnapshot | null;
  continuityState: CurrentPracticeContinuityState;
}

export interface CreateOrRefreshReminderPlanInput {
  hubCoordinationCaseId: string;
  scheduledFor: string;
  recordedAt: string;
  threadId: string;
  conversationClusterRef: string;
  conversationSubthreadRef: string;
  communicationEnvelopeRef: string;
  templateSetRef: string;
  templateVersionRef: string;
  routeProfileRef: string;
  channel: ReminderTransportChannel;
  payloadRef: string;
  contactRouteRef: string;
  contactRouteVersionRef: string;
  currentContactRouteSnapshotRef: string;
  reachabilityDependencyRef: string;
  currentReachabilityAssessmentRef: string;
  assessmentState: ReminderAssessmentState;
  routeAuthorityState: ReminderRouteAuthorityState;
  reachabilityEpoch: number;
  contactRepairJourneyRef: string;
  rebindState: ReminderRebindState;
  deliveryModelVersionRef?: string;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef: string;
  transitionEnvelopeRef: string;
  releaseRecoveryDispositionRef: string;
  sourceRefs?: readonly string[];
}

export interface CreateOrRefreshReminderPlanResult {
  reminderPlan: NetworkReminderPlanSnapshot;
  reminderSchedule: NetworkReminderScheduleSnapshot | null;
  timelinePublication: ReminderTimelinePublicationSnapshot | null;
  replayed: boolean;
}

export interface DispatchReminderScheduleInput {
  reminderPlanId: string;
  reminderScheduleId: string;
  attemptedAt: string;
  sourceRefs?: readonly string[];
}

export interface DispatchReminderScheduleResult {
  reminderPlan: NetworkReminderPlanSnapshot;
  reminderSchedule: NetworkReminderScheduleSnapshot;
  deliveryEvidence: NetworkReminderDeliveryEvidenceSnapshot;
  timelinePublication: ReminderTimelinePublicationSnapshot;
}

export interface RecordReminderDeliveryEvidenceInput {
  reminderPlanId: string;
  reminderScheduleId: string;
  observedAt: string;
  evidenceState: NetworkReminderDeliveryEvidenceState;
  transportAckState: NetworkReminderTransportAckState;
  deliveryRiskState: NetworkReminderDeliveryRiskState;
  adapterName: string;
  adapterCorrelationKey?: string | null;
  externalDispatchRef?: string | null;
  suppressionReasonRefs?: readonly string[];
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  practiceVisibilityEnvelopeId?: string | null;
  reopenPracticeAcknowledgement?: boolean;
  sourceRefs?: readonly string[];
}

export interface RecordReminderDeliveryEvidenceResult {
  reminderPlan: NetworkReminderPlanSnapshot;
  reminderSchedule: NetworkReminderScheduleSnapshot;
  deliveryEvidence: NetworkReminderDeliveryEvidenceSnapshot;
  timelinePublication: ReminderTimelinePublicationSnapshot;
  deltaRecord: PracticeVisibilityDeltaRecordSnapshot | null;
  visibilityProjection: PracticeVisibilityProjectionSnapshot | null;
}

export interface CompileNetworkManageCapabilitiesInput {
  hubCoordinationCaseId: string;
  recordedAt: string;
  visibilityEnvelopeVersionRef: string;
  sessionFenceToken: string;
  subjectFenceToken: string;
  routeIntentRef: string;
  subjectRef: string;
  sessionEpochRef: string;
  subjectBindingVersionRef: string;
  manifestVersionRef?: string | null;
  releaseApprovalFreezeRef?: string | null;
  channelReleaseFreezeState?: NetworkManageCapabilitiesSnapshot["channelReleaseFreezeState"];
  supportedActions?: readonly HubManageActionScope[];
  capabilityLeaseMinutes?: number;
  identityHoldState?: boolean;
  assessmentState?: ReminderAssessmentState;
  routeAuthorityState?: ReminderRouteAuthorityState;
  rebindState?: ReminderRebindState;
  sessionCurrent?: boolean;
  subjectBindingCurrent?: boolean;
  publicationCurrent?: boolean;
  minimumNecessaryContractRef?: string;
  sourceRefs?: readonly string[];
}

export interface CompileNetworkManageCapabilitiesResult {
  capabilities: NetworkManageCapabilitiesSnapshot;
  policyEvaluation: NetworkPolicyEvaluationResult;
  replayed: boolean;
}

export interface ExecuteHubManageActionInput {
  hubCoordinationCaseId: string;
  networkManageCapabilitiesId: string;
  actionScope: HubManageActionScope;
  idempotencyKey: string;
  actorRef: string;
  routeIntentRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  transitionEnvelopeRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  mutationGateRef?: string;
  presentationArtifactRef?: string | null;
  practiceVisibilityEnvelopeId?: string | null;
  materialChange?: boolean;
  containsClinicalText?: boolean;
  sourceRefs?: readonly string[];
}

export interface ExecuteHubManageActionResult {
  settlement: HubManageSettlementSnapshot;
  capabilities: NetworkManageCapabilitiesSnapshot;
  deltaRecord: PracticeVisibilityDeltaRecordSnapshot | null;
  visibilityProjection: PracticeVisibilityProjectionSnapshot | null;
  replayed: boolean;
}

export interface RefreshPracticeVisibilityProjectionInput {
  hubCoordinationCaseId: string;
  visibilityEnvelopeId: string;
  recordedAt: string;
  policyFacts?: Partial<PolicyEvaluationFactsSnapshot>;
  sourceRefs?: readonly string[];
}

export interface RefreshPracticeVisibilityProjectionResult {
  projection: PracticeVisibilityProjectionSnapshot;
  policyEvaluation: NetworkPolicyEvaluationResult;
}

export interface CurrentReminderManageVisibilityState {
  reminderPlan: NetworkReminderPlanSnapshot | null;
  reminderSchedules: readonly NetworkReminderScheduleSnapshot[];
  latestReminderDeliveryEvidence: NetworkReminderDeliveryEvidenceSnapshot | null;
  currentManageCapabilities: NetworkManageCapabilitiesSnapshot | null;
  latestManageSettlement: HubManageSettlementSnapshot | null;
  practiceVisibilityProjection: PracticeVisibilityProjectionSnapshot | null;
  latestTimelinePublication: ReminderTimelinePublicationSnapshot | null;
  latestDeltaRecord: PracticeVisibilityDeltaRecordSnapshot | null;
  appointment: HubAppointmentRecordSnapshot | null;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot | null;
}

export interface Phase5ReminderManageVisibilityService {
  repositories: Phase5ReminderManageVisibilityRepositories;
  createOrRefreshReminderPlan(
    input: CreateOrRefreshReminderPlanInput,
  ): Promise<CreateOrRefreshReminderPlanResult>;
  dispatchReminderSchedule(
    input: DispatchReminderScheduleInput,
  ): Promise<DispatchReminderScheduleResult>;
  recordReminderDeliveryEvidence(
    input: RecordReminderDeliveryEvidenceInput,
  ): Promise<RecordReminderDeliveryEvidenceResult>;
  compileNetworkManageCapabilities(
    input: CompileNetworkManageCapabilitiesInput,
  ): Promise<CompileNetworkManageCapabilitiesResult>;
  executeHubManageAction(
    input: ExecuteHubManageActionInput,
  ): Promise<ExecuteHubManageActionResult>;
  refreshPracticeVisibilityProjection(
    input: RefreshPracticeVisibilityProjectionInput,
  ): Promise<RefreshPracticeVisibilityProjectionResult>;
  queryCurrentReminderManageVisibilityState(
    hubCoordinationCaseId: string,
  ): Promise<CurrentReminderManageVisibilityState>;
}

export interface CreatePhase5ReminderManageVisibilityServiceOptions {
  repositories: Phase5ReminderManageVisibilityRepositories;
  hubCaseService: Phase5HubCaseKernelService;
  offerRepositories: Phase5AlternativeOfferEngineRepositories;
  commitRepositories: Phase5HubCommitEngineRepositories;
  policyService: Phase5EnhancedAccessPolicyService;
  practiceContinuityService: Phase5PracticeContinuityService;
  actingScopeService?: Phase5ActingScopeVisibilityService;
  reminderTimelinePublisher?: ReminderTimelinePublisher;
  reminderDispatchAdapters?: readonly NetworkReminderDispatchAdapter[];
  idGenerator?: BackboneIdGenerator;
}

export function createPhase5ReminderManageVisibilityService(
  input?: Partial<CreatePhase5ReminderManageVisibilityServiceOptions>,
): Phase5ReminderManageVisibilityService {
  const hubCaseService = input?.hubCaseService ?? createPhase5HubCaseKernelService();
  const repositories = input?.repositories ?? createPhase5ReminderManageVisibilityStore();
  const offerRepositories =
    input?.offerRepositories ?? createPhase5AlternativeOfferEngineStore();
  const commitRepositories = input?.commitRepositories ?? createPhase5HubCommitEngineStore();
  const policyService =
    input?.policyService ?? createPhase5EnhancedAccessPolicyService({ hubCaseService });
  const actingScopeService =
    input?.actingScopeService ?? createPhase5ActingScopeVisibilityService({ hubCaseService });
  const practiceContinuityService =
    input?.practiceContinuityService ??
    createPhase5PracticeContinuityService({
      repositories: createPhase5PracticeContinuityStore(),
      hubCaseService,
      offerRepositories,
      commitRepositories,
      policyService,
      actingScopeService,
    });
  const reminderTimelinePublisher =
    input?.reminderTimelinePublisher ?? createReminderTimelinePublisher();
  const reminderDispatchAdapters =
    input?.reminderDispatchAdapters ??
    [
      createSmsNetworkReminderDispatchAdapter(),
      createEmailNetworkReminderDispatchAdapter(),
      createAppInboxNetworkReminderDispatchAdapter(),
    ];
  const adapterByChannel = new Map(
    reminderDispatchAdapters.map((adapter) => [adapter.channel, adapter] as const),
  );
  const idGenerator =
    input?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase5-reminders-manage-visibility");

  async function loadContext(hubCoordinationCaseId: string): Promise<ReminderManageContext> {
    const hubCaseBundle = requireBundle(
      await hubCaseService.queryHubCaseBundle(hubCoordinationCaseId),
      hubCoordinationCaseId,
    );
    const truthProjection = await requireSnapshot(
      offerRepositories.getTruthProjectionForCase(hubCoordinationCaseId),
      "HUB_OFFER_TRUTH_NOT_FOUND",
      "HubOfferToConfirmationTruthProjection is required.",
    );
    const appointment =
      truthProjection.hubAppointmentId !== null
        ? await requireSnapshot(
            commitRepositories.getAppointmentRecord(truthProjection.hubAppointmentId),
            "HUB_APPOINTMENT_NOT_FOUND",
            "HubAppointmentRecord is required.",
          )
        : await (async () => {
            const latest = (await commitRepositories.listAppointmentsForCase(hubCoordinationCaseId))
              .map((document) => document.toSnapshot())
              .at(-1);
            invariant(
              latest !== undefined,
              "HUB_APPOINTMENT_NOT_FOUND",
              "HubAppointmentRecord is required.",
            );
            return latest;
          })();
    const continuityProjection =
      (await commitRepositories.getContinuityProjectionForCase(hubCoordinationCaseId))?.toSnapshot() ??
      null;
    const mirrorState =
      (await commitRepositories.getMirrorStateForAppointment(appointment.hubAppointmentId))?.toSnapshot() ??
      null;
    const continuityState =
      await practiceContinuityService.queryCurrentPracticeContinuityState(hubCoordinationCaseId);
    return {
      hubCaseBundle,
      appointment,
      truthProjection,
      continuityProjection,
      mirrorState,
      continuityState,
    };
  }

  async function evaluateManagePolicy(inputValue: {
    hubCaseId: string;
    pcnRef: string;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    minimumNecessaryContractRef: string;
    recordedAt: string;
    facts?: Partial<PolicyEvaluationFactsSnapshot>;
  }): Promise<NetworkPolicyEvaluationResult> {
    return policyService.evaluateHubCaseAgainstPolicy({
      hubCoordinationCaseId: inputValue.hubCaseId,
      pcnRef: inputValue.pcnRef,
      evaluationScope: "manage_exposure",
      evaluatedAt: inputValue.recordedAt,
      presentedPolicyTupleHash: inputValue.truthProjection.policyTupleHash,
      facts: buildPolicyFacts(
        inputValue.truthProjection,
        inputValue.minimumNecessaryContractRef,
        inputValue.facts,
      ),
    });
  }

  async function evaluatePracticeVisibilityPolicy(inputValue: {
    hubCaseId: string;
    pcnRef: string;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    minimumNecessaryContractRef: string;
    recordedAt: string;
    facts?: Partial<PolicyEvaluationFactsSnapshot>;
  }): Promise<NetworkPolicyEvaluationResult> {
    return policyService.evaluateHubCaseAgainstPolicy({
      hubCoordinationCaseId: inputValue.hubCaseId,
      pcnRef: inputValue.pcnRef,
      evaluationScope: "practice_visibility_generation",
      evaluatedAt: inputValue.recordedAt,
      presentedPolicyTupleHash: inputValue.truthProjection.policyTupleHash,
      facts: buildPolicyFacts(
        inputValue.truthProjection,
        inputValue.minimumNecessaryContractRef,
        inputValue.facts,
      ),
    });
  }

  async function publishTimelineEvent(inputValue: {
    reminderPlan: NetworkReminderPlanSnapshot;
    publicationKind: ReminderTimelinePublicationKind;
    publishedAt: string;
    sourceRefs: readonly string[];
  }): Promise<ReminderTimelinePublicationSnapshot> {
    const published = await reminderTimelinePublisher.publish({
      reminderPlan: inputValue.reminderPlan,
      publicationKind: inputValue.publicationKind,
      publishedAt: inputValue.publishedAt,
    });
    const snapshot: ReminderTimelinePublicationSnapshot = {
      reminderTimelinePublicationId: nextId(idGenerator, "reminderTimelinePublication"),
      reminderPlanRef: inputValue.reminderPlan.networkReminderPlanId,
      publicationKind: inputValue.publicationKind,
      threadId: inputValue.reminderPlan.threadId,
      conversationSubthreadRef: inputValue.reminderPlan.conversationSubthreadRef,
      communicationEnvelopeRef: inputValue.reminderPlan.communicationEnvelopeRef,
      publicationRef: published.publicationRef,
      publishedAt: inputValue.publishedAt,
      sourceRefs: uniqueSortedRefs(inputValue.sourceRefs),
      version: 1,
    };
    await repositories.appendTimelinePublication(snapshot);
    return snapshot;
  }

  async function resolveVisibilityContext(
    visibilityEnvelopeId: string,
    hubCoordinationCaseId: string,
  ): Promise<{
    envelope: CrossOrganisationVisibilityEnvelopeSnapshot;
    actingContext: ActingContextSnapshot;
    minimumNecessaryView: MinimumNecessaryProjectionResult;
  }> {
    const envelope = await actingScopeService.repositories.getVisibilityEnvelope(visibilityEnvelopeId);
    invariant(
      envelope !== null,
      "VISIBILITY_ENVELOPE_NOT_FOUND",
      "CrossOrganisationVisibilityEnvelope is required.",
    );
    const actingContext = await actingScopeService.repositories.getActingContext(envelope.actingContextRef);
    invariant(
      actingContext !== null,
      "ACTING_CONTEXT_NOT_FOUND",
      "ActingContext is required for PracticeVisibilityProjection.",
    );
    const minimumNecessaryView =
      await actingScopeService.materializeHubCaseAudienceProjection({
        hubCoordinationCaseId,
        visibilityEnvelopeId: envelope.crossOrganisationVisibilityEnvelopeId,
      });
    return {
      envelope,
      actingContext,
      minimumNecessaryView,
    };
  }

  async function refreshPracticeVisibilityProjectionInternal(
    inputValue: RefreshPracticeVisibilityProjectionInput,
  ): Promise<RefreshPracticeVisibilityProjectionResult> {
    const recordedAt = ensureIsoTimestamp(inputValue.recordedAt, "recordedAt");
    const context = await loadContext(inputValue.hubCoordinationCaseId);
    const visibilityContext = await resolveVisibilityContext(
      inputValue.visibilityEnvelopeId,
      inputValue.hubCoordinationCaseId,
    );
    const policyEvaluation = await evaluatePracticeVisibilityPolicy({
      hubCaseId: inputValue.hubCoordinationCaseId,
      pcnRef: context.hubCaseBundle.hubCase.servingPcnId,
      truthProjection: context.truthProjection,
      minimumNecessaryContractRef: visibilityContext.envelope.minimumNecessaryContractRef,
      recordedAt,
      facts: inputValue.policyFacts,
    });
    const currentProjection =
      (await repositories.getCurrentPracticeVisibilityProjectionForCase(
        inputValue.hubCoordinationCaseId,
      ))?.toSnapshot() ?? null;
    const acknowledgementState = mapContinuityAckState(
      context.continuityState,
      context.appointment,
    );
    const currentReminderPlan =
      (await repositories.getCurrentReminderPlanForAppointment(context.appointment.hubAppointmentId))?.toSnapshot() ??
      null;
    const latestManageSettlement =
      (await repositories.listManageSettlementsForAppointment(context.appointment.hubAppointmentId))
        .map((document) => document.toSnapshot())
        .at(-1) ?? null;

    if (currentProjection !== null) {
      invariant(
        context.hubCaseBundle.hubCase.practiceAckGeneration >= currentProjection.ackGeneration,
        "PRACTICE_VISIBILITY_ACK_GENERATION_REGRESSION",
        "PracticeVisibilityProjection may not move to a lower acknowledgement generation.",
      );
      invariant(
        visibilityContext.envelope.version >= currentProjection.bundleVersion,
        "PRACTICE_VISIBILITY_ENVELOPE_REGRESSION",
        "PracticeVisibilityProjection may not be refreshed from an older visibility envelope.",
      );
    }

    const projection: PracticeVisibilityProjectionSnapshot = {
      practiceVisibilityProjectionId:
        currentProjection?.practiceVisibilityProjectionId ??
        nextId(idGenerator, "practiceVisibilityProjection"),
      hubCoordinationCaseId: inputValue.hubCoordinationCaseId,
      hubAppointmentId: context.appointment.hubAppointmentId,
      originPracticeOds: context.hubCaseBundle.networkBookingRequest.originPracticeOds,
      bundleVersion: visibilityContext.envelope.version,
      entityVersionRefs: uniqueSortedRefs([
        `${context.appointment.hubAppointmentId}@v${context.appointment.version}`,
        `${context.truthProjection.hubOfferToConfirmationTruthProjectionId}@v${context.truthProjection.version}`,
        `${policyEvaluation.evaluation.policyEvaluationId}@v${policyEvaluation.evaluation.version}`,
        context.continuityProjection
          ? `${context.continuityProjection.hubContinuityEvidenceProjectionId}@v${context.continuityProjection.version}`
          : "",
        context.mirrorState
          ? `${context.mirrorState.hubSupplierMirrorStateId}@v${context.mirrorState.version}`
          : "",
      ]),
      minimumNecessaryViewRef: `minimum_necessary_view_${visibilityContext.envelope.crossOrganisationVisibilityEnvelopeId}`,
      visibilityEnvelopeVersionRef: visibilityContext.envelope.crossOrganisationVisibilityEnvelopeId,
      crossOrganisationVisibilityEnvelopeRef:
        visibilityContext.envelope.crossOrganisationVisibilityEnvelopeId,
      actingContextRef: visibilityContext.actingContext.actingContextId,
      actingScopeTupleRef: visibilityContext.envelope.actingScopeTupleRef,
      practiceVisibilityPolicyRef: policyEvaluation.compiledPolicy.practiceVisibilityPolicyRef,
      serviceObligationPolicyRef: policyEvaluation.compiledPolicy.serviceObligationPolicyRef,
      policyEvaluationRef: policyEvaluation.evaluation.policyEvaluationId,
      policyTupleHash: policyEvaluation.compiledPolicy.policyTupleHash,
      minimumNecessaryContractRef: visibilityContext.envelope.minimumNecessaryContractRef,
      slotSummaryRef:
        context.truthProjection.selectedCandidateRef ?? context.appointment.appointmentVersionRef,
      confirmationState: context.truthProjection.confirmationTruthState,
      patientFacingStateRef: context.truthProjection.patientVisibilityState,
      notificationState: notificationStateFromReminder(
        currentReminderPlan,
        context.continuityState,
      ),
      ackGeneration: context.hubCaseBundle.hubCase.practiceAckGeneration,
      practiceAcknowledgementState: acknowledgementState,
      manageSettlementState: manageSettlementStateFromResult(latestManageSettlement),
      supplierMirrorState: latestSupplierMirrorState(context.mirrorState),
      latestContinuityMessageRef: context.continuityState.currentMessage?.practiceContinuityMessageId ?? null,
      truthProjectionRef: context.truthProjection.hubOfferToConfirmationTruthProjectionId,
      truthTupleHash: context.truthProjection.truthTupleHash,
      experienceContinuityEvidenceRef:
        context.continuityProjection?.experienceContinuityEvidenceRef ?? null,
      transitionEnvelopeRef:
        latestManageSettlement?.transitionEnvelopeRef ??
        currentReminderPlan?.transitionEnvelopeRef ??
        "transition_envelope.practice_visibility_projection",
      releaseRecoveryDispositionRef:
        latestManageSettlement?.releaseRecoveryDispositionRef ??
        currentReminderPlan?.releaseRecoveryDispositionRef ??
        "release_recovery.practice_visibility_projection",
      patientSafeStatus: patientSafeStatus({
        appointment: context.appointment,
        reminderPlan: currentReminderPlan,
        latestManageSettlement,
        truthProjection: context.truthProjection,
      }),
      projectionState: projectionStateFromContext({
        envelope: visibilityContext.envelope,
        acknowledgementState,
      }),
      visibleFieldRefs: uniqueSortedRefs(
        Object.keys(visibilityContext.minimumNecessaryView.visibleFields),
      ),
      hiddenFieldRefs: uniqueSortedRefs(
        visibilityContext.minimumNecessaryView.withheldFieldRefs,
      ),
      stateConfidenceBand: projectionConfidenceBand({
        envelope: visibilityContext.envelope,
        reminderPlan: currentReminderPlan,
        mirrorState: context.mirrorState,
        latestManageSettlement,
        acknowledgementState,
      }),
      actionRequiredState: actionRequiredState({
        reminderPlan: currentReminderPlan,
        acknowledgementState,
        mirrorState: context.mirrorState,
        latestManageSettlement,
      }),
      staleAt: addMinutes(recordedAt, 120),
      causalToken:
        currentProjection?.causalToken ?? nextId(idGenerator, "practiceVisibilityProjectionCausal"),
      monotoneRevision: (currentProjection?.monotoneRevision ?? 0) + 1,
      recordedAt,
      sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(inputValue.sourceRefs ?? [])]),
      version: currentProjection ? nextVersion(currentProjection.version) : 1,
    };
    await repositories.savePracticeVisibilityProjection(projection, {
      expectedVersion: currentProjection?.version,
    });
    return { projection, policyEvaluation };
  }

  return {
    repositories,

    async createOrRefreshReminderPlan(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const scheduledFor = ensureIsoTimestamp(command.scheduledFor, "scheduledFor");
      const context = await loadContext(command.hubCoordinationCaseId);
      const existing =
        (await repositories.getCurrentReminderPlanForAppointment(context.appointment.hubAppointmentId))?.toSnapshot() ??
        null;

      if (
        existing &&
        existing.appointmentVersionRef === context.appointment.appointmentVersionRef &&
        existing.contactRouteVersionRef === command.contactRouteVersionRef &&
        existing.templateVersionRef === command.templateVersionRef &&
        existing.nextReminderDueAt === scheduledFor
      ) {
        const latestPublication = (
          await repositories.listTimelinePublicationsForPlan(existing.networkReminderPlanId)
        )
          .map((document) => document.toSnapshot())
          .at(-1) ?? null;
        const schedule = (
          await repositories.listReminderSchedulesForPlan(existing.networkReminderPlanId)
        )
          .map((document) => document.toSnapshot())
          .find((entry) => entry.scheduledFor === scheduledFor) ?? null;
        return {
          reminderPlan: existing,
          reminderSchedule: schedule,
          timelinePublication: latestPublication,
          replayed: true,
        };
      }

      const disposition = evaluateReminderPlanDisposition({
        authoritativeConfirmation: isAuthoritativeAppointment(context.appointment),
        assessmentState: command.assessmentState,
        routeAuthorityState: command.routeAuthorityState,
        rebindState: command.rebindState,
        continuityValidationState: context.continuityProjection?.validationState ?? "trusted",
      });
      const nextPlan: NetworkReminderPlanSnapshot = {
        networkReminderPlanId: existing?.networkReminderPlanId ?? nextId(idGenerator, "networkReminderPlan"),
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        hubAppointmentId: context.appointment.hubAppointmentId,
        threadId: requireRef(command.threadId, "threadId"),
        conversationClusterRef: requireRef(command.conversationClusterRef, "conversationClusterRef"),
        conversationSubthreadRef: requireRef(command.conversationSubthreadRef, "conversationSubthreadRef"),
        communicationEnvelopeRef: requireRef(command.communicationEnvelopeRef, "communicationEnvelopeRef"),
        templateSetRef: requireRef(command.templateSetRef, "templateSetRef"),
        templateVersionRef: requireRef(command.templateVersionRef, "templateVersionRef"),
        routeProfileRef: requireRef(command.routeProfileRef, "routeProfileRef"),
        channel: command.channel,
        payloadRef: requireRef(command.payloadRef, "payloadRef"),
        contactRouteRef: requireRef(command.contactRouteRef, "contactRouteRef"),
        contactRouteVersionRef: requireRef(command.contactRouteVersionRef, "contactRouteVersionRef"),
        currentContactRouteSnapshotRef: requireRef(
          command.currentContactRouteSnapshotRef,
          "currentContactRouteSnapshotRef",
        ),
        reachabilityDependencyRef: requireRef(command.reachabilityDependencyRef, "reachabilityDependencyRef"),
        currentReachabilityAssessmentRef: requireRef(
          command.currentReachabilityAssessmentRef,
          "currentReachabilityAssessmentRef",
        ),
        reachabilityEpoch: ensureNonNegativeInteger(command.reachabilityEpoch, "reachabilityEpoch"),
        contactRepairJourneyRef: requireRef(command.contactRepairJourneyRef, "contactRepairJourneyRef"),
        deliveryModelVersionRef:
          optionalRef(command.deliveryModelVersionRef) ?? "phase5.network_reminder.delivery.v1",
        artifactPresentationContractRef: requireRef(
          command.artifactPresentationContractRef,
          "artifactPresentationContractRef",
        ),
        outboundNavigationGrantPolicyRef: requireRef(
          command.outboundNavigationGrantPolicyRef,
          "outboundNavigationGrantPolicyRef",
        ),
        transitionEnvelopeRef: requireRef(command.transitionEnvelopeRef, "transitionEnvelopeRef"),
        releaseRecoveryDispositionRef: requireRef(
          command.releaseRecoveryDispositionRef,
          "releaseRecoveryDispositionRef",
        ),
        appointmentVersionRef: context.appointment.appointmentVersionRef,
        truthTupleHash: context.truthProjection.truthTupleHash,
        scheduleRefs: [],
        scheduleState: disposition.scheduleState,
        transportAckState: disposition.transportAckState,
        deliveryEvidenceState: disposition.deliveryEvidenceState,
        deliveryRiskState: disposition.deliveryRiskState,
        authoritativeOutcomeState: disposition.authoritativeOutcomeState,
        stateConfidenceBand: disposition.stateConfidenceBand,
        suppressionReasonRefs: disposition.suppressionReasonRefs,
        deliveryEvidenceRefs: existing?.deliveryEvidenceRefs ?? [],
        lastDeliveryAttemptAt: existing?.lastDeliveryAttemptAt ?? null,
        nextAttemptAt: disposition.scheduleState === "scheduled" ? scheduledFor : null,
        nextReminderDueAt: scheduledFor,
        causalToken: existing?.causalToken ?? nextId(idGenerator, "networkReminderPlanCausal"),
        monotoneRevision: (existing?.monotoneRevision ?? 0) + 1,
        recordedAt,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(command.sourceRefs ?? [])]),
        version: existing ? nextVersion(existing.version) : 1,
      };

      let reminderSchedule: NetworkReminderScheduleSnapshot | null = null;
      if (disposition.scheduleState === "scheduled") {
        reminderSchedule = {
          networkReminderScheduleId: nextId(idGenerator, "networkReminderSchedule"),
          reminderPlanRef: nextPlan.networkReminderPlanId,
          scheduledFor,
          scheduleKind: "primary",
          scheduleState: "scheduled",
          templateVersionRef: nextPlan.templateVersionRef,
          routeProfileRef: nextPlan.routeProfileRef,
          contactRouteVersionRef: nextPlan.contactRouteVersionRef,
          reachabilityAssessmentRef: nextPlan.currentReachabilityAssessmentRef,
          truthTupleHash: nextPlan.truthTupleHash,
          createdAt: recordedAt,
          sentAt: null,
          sourceRefs: nextPlan.sourceRefs,
          version: 1,
        };
        await repositories.saveReminderSchedule(reminderSchedule);
        nextPlan.scheduleRefs = [reminderSchedule.networkReminderScheduleId];
      }

      await repositories.saveReminderPlan(nextPlan, { expectedVersion: existing?.version });
      const timelinePublication = await publishTimelineEvent({
        reminderPlan: nextPlan,
        publicationKind:
          disposition.scheduleState === "scheduled"
            ? "reminder_scheduled"
            : "reminder_suppressed",
        publishedAt: recordedAt,
        sourceRefs: nextPlan.sourceRefs,
      });
      return {
        reminderPlan: nextPlan,
        reminderSchedule,
        timelinePublication,
        replayed: false,
      };
    },

    async dispatchReminderSchedule(command) {
      const attemptedAt = ensureIsoTimestamp(command.attemptedAt, "attemptedAt");
      const reminderPlan = await requireSnapshot(
        repositories.getReminderPlan(command.reminderPlanId),
        "REMINDER_PLAN_NOT_FOUND",
        "NetworkReminderPlan is required.",
      );
      const reminderSchedule = await requireSnapshot(
        repositories.getReminderSchedule(command.reminderScheduleId),
        "REMINDER_SCHEDULE_NOT_FOUND",
        "NetworkReminderSchedule is required.",
      );
      invariant(
        reminderSchedule.reminderPlanRef === reminderPlan.networkReminderPlanId,
        "REMINDER_SCHEDULE_PLAN_MISMATCH",
        "Reminder schedule does not belong to the supplied plan.",
      );
      const adapter = adapterByChannel.get(reminderPlan.channel);
      invariant(adapter, "REMINDER_ADAPTER_NOT_FOUND", "Reminder dispatch adapter is required.");
      const dispatch = await adapter.dispatch({
        reminderPlan,
        reminderSchedule,
        attemptedAt,
      });
      const nextSchedule: NetworkReminderScheduleSnapshot = {
        ...reminderSchedule,
        scheduleState:
          dispatch.outcome === "accepted"
            ? "completed"
            : dispatch.outcome === "rejected"
              ? "suppressed"
              : "cancelled",
        sentAt: dispatch.outcome === "accepted" ? attemptedAt : null,
        version: nextVersion(reminderSchedule.version),
      };
      await repositories.saveReminderSchedule(nextSchedule, {
        expectedVersion: reminderSchedule.version,
      });
      const nextPlan: NetworkReminderPlanSnapshot = {
        ...reminderPlan,
        scheduleState: dispatch.outcome === "accepted" ? "sent" : "delivery_blocked",
        transportAckState:
          dispatch.outcome === "accepted"
            ? "accepted"
            : dispatch.outcome === "rejected"
              ? "rejected"
              : "timed_out",
        deliveryEvidenceState: dispatch.outcome === "accepted" ? "pending" : "failed",
        deliveryRiskState: dispatch.outcome === "accepted" ? "on_track" : "at_risk",
        authoritativeOutcomeState:
          dispatch.outcome === "accepted"
            ? "awaiting_delivery_truth"
            : "recovery_required",
        lastDeliveryAttemptAt: attemptedAt,
        nextAttemptAt:
          dispatch.outcome === "accepted" ? null : addMinutes(attemptedAt, 30),
        monotoneRevision: reminderPlan.monotoneRevision + 1,
        version: nextVersion(reminderPlan.version),
      };
      const deliveryEvidence: NetworkReminderDeliveryEvidenceSnapshot = {
        networkReminderDeliveryEvidenceId: nextId(idGenerator, "networkReminderDeliveryEvidence"),
        reminderPlanRef: nextPlan.networkReminderPlanId,
        reminderScheduleRef: nextSchedule.networkReminderScheduleId,
        observedAt: attemptedAt,
        evidenceState: dispatch.outcome === "accepted" ? "pending" : "failed",
        transportAckState: nextPlan.transportAckState,
        deliveryRiskState: nextPlan.deliveryRiskState,
        adapterName: dispatch.adapterName,
        adapterCorrelationKey: optionalRef(dispatch.adapterCorrelationKey),
        externalDispatchRef: optionalRef(dispatch.externalDispatchRef),
        suppressionReasonRefs:
          dispatch.outcome === "accepted" ? [] : ["dispatch_not_accepted"],
        sourceRefs: uniqueSortedRefs([...nextPlan.sourceRefs, ...(command.sourceRefs ?? [])]),
        version: 1,
      };
      nextPlan.deliveryEvidenceRefs = [deliveryEvidence.networkReminderDeliveryEvidenceId];
      await repositories.saveReminderDeliveryEvidence(deliveryEvidence);
      await repositories.saveReminderPlan(nextPlan, { expectedVersion: reminderPlan.version });
      const timelinePublication = await publishTimelineEvent({
        reminderPlan: nextPlan,
        publicationKind:
          dispatch.outcome === "accepted" ? "reminder_scheduled" : "reminder_failed",
        publishedAt: attemptedAt,
        sourceRefs: deliveryEvidence.sourceRefs,
      });
      return {
        reminderPlan: nextPlan,
        reminderSchedule: nextSchedule,
        deliveryEvidence,
        timelinePublication,
      };
    },

    async recordReminderDeliveryEvidence(command) {
      const observedAt = ensureIsoTimestamp(command.observedAt, "observedAt");
      const reminderPlan = await requireSnapshot(
        repositories.getReminderPlan(command.reminderPlanId),
        "REMINDER_PLAN_NOT_FOUND",
        "NetworkReminderPlan is required.",
      );
      const reminderSchedule = await requireSnapshot(
        repositories.getReminderSchedule(command.reminderScheduleId),
        "REMINDER_SCHEDULE_NOT_FOUND",
        "NetworkReminderSchedule is required.",
      );
      invariant(
        reminderSchedule.reminderPlanRef === reminderPlan.networkReminderPlanId,
        "REMINDER_SCHEDULE_PLAN_MISMATCH",
        "Reminder schedule does not belong to the supplied plan.",
      );
      const deliveryEvidence: NetworkReminderDeliveryEvidenceSnapshot = {
        networkReminderDeliveryEvidenceId: nextId(idGenerator, "networkReminderDeliveryEvidence"),
        reminderPlanRef: reminderPlan.networkReminderPlanId,
        reminderScheduleRef: reminderSchedule.networkReminderScheduleId,
        observedAt,
        evidenceState: command.evidenceState,
        transportAckState: command.transportAckState,
        deliveryRiskState: command.deliveryRiskState,
        adapterName: requireRef(command.adapterName, "adapterName"),
        adapterCorrelationKey: optionalRef(command.adapterCorrelationKey),
        externalDispatchRef: optionalRef(command.externalDispatchRef),
        suppressionReasonRefs: uniqueSortedRefs(command.suppressionReasonRefs ?? []),
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(command.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.saveReminderDeliveryEvidence(deliveryEvidence);

      const nextPlan: NetworkReminderPlanSnapshot = {
        ...reminderPlan,
        transportAckState: command.transportAckState,
        deliveryEvidenceState: command.evidenceState,
        deliveryRiskState: command.deliveryRiskState,
        authoritativeOutcomeState:
          command.evidenceState === "delivered"
            ? "delivered"
            : command.evidenceState === "suppressed"
              ? "suppressed"
              : command.evidenceState === "pending"
                ? "awaiting_delivery_truth"
                : "recovery_required",
        scheduleState:
          command.evidenceState === "delivered"
            ? "completed"
            : command.evidenceState === "pending"
              ? reminderPlan.scheduleState
              : command.evidenceState === "disputed"
                ? "disputed"
                : "delivery_blocked",
        suppressionReasonRefs: uniqueSortedRefs([
          ...reminderPlan.suppressionReasonRefs,
          ...(command.suppressionReasonRefs ?? []),
        ]),
        deliveryEvidenceRefs: uniqueSortedRefs([
          ...reminderPlan.deliveryEvidenceRefs,
          deliveryEvidence.networkReminderDeliveryEvidenceId,
        ]),
        lastDeliveryAttemptAt: observedAt,
        nextAttemptAt:
          command.evidenceState === "failed" || command.evidenceState === "expired"
            ? addMinutes(observedAt, 30)
            : null,
        monotoneRevision: reminderPlan.monotoneRevision + 1,
        version: nextVersion(reminderPlan.version),
      };
      await repositories.saveReminderPlan(nextPlan, { expectedVersion: reminderPlan.version });

      const nextSchedule: NetworkReminderScheduleSnapshot = {
        ...reminderSchedule,
        scheduleState:
          command.evidenceState === "delivered"
            ? "completed"
            : command.evidenceState === "suppressed"
              ? "suppressed"
              : command.evidenceState === "failed" || command.evidenceState === "expired"
                ? "cancelled"
                : reminderSchedule.scheduleState,
        version: nextVersion(reminderSchedule.version),
      };
      await repositories.saveReminderSchedule(nextSchedule, {
        expectedVersion: reminderSchedule.version,
      });

      const timelinePublication = await publishTimelineEvent({
        reminderPlan: nextPlan,
        publicationKind:
          command.evidenceState === "delivered"
            ? "reminder_delivered"
            : command.evidenceState === "suppressed"
              ? "reminder_suppressed"
              : "reminder_failed",
        publishedAt: observedAt,
        sourceRefs: deliveryEvidence.sourceRefs,
      });

      let deltaRecord: PracticeVisibilityDeltaRecordSnapshot | null = null;
      let visibilityProjection: PracticeVisibilityProjectionSnapshot | null = null;
      if (
        command.reopenPracticeAcknowledgement !== false &&
        (command.evidenceState === "failed" ||
          command.evidenceState === "expired" ||
          command.evidenceState === "disputed")
      ) {
        const reopened = await practiceContinuityService.reopenPracticeAcknowledgementDebt({
          hubCoordinationCaseId: reminderPlan.hubCoordinationCaseId,
          actorRef: command.actorRef,
          routeIntentBindingRef: command.routeIntentBindingRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          recordedAt: observedAt,
          changeClass: "reminder_failed",
          deltaReason: "reminder_failure",
          sourceRefs: deliveryEvidence.sourceRefs,
        });
        deltaRecord = reopened.deltaRecord;
        if (command.practiceVisibilityEnvelopeId) {
          visibilityProjection = (
            await refreshPracticeVisibilityProjectionInternal({
              hubCoordinationCaseId: reminderPlan.hubCoordinationCaseId,
              visibilityEnvelopeId: command.practiceVisibilityEnvelopeId,
              recordedAt: observedAt,
              sourceRefs: deliveryEvidence.sourceRefs,
            })
          ).projection;
        }
      }

      return {
        reminderPlan: nextPlan,
        reminderSchedule: nextSchedule,
        deliveryEvidence,
        timelinePublication,
        deltaRecord,
        visibilityProjection,
      };
    },

    async compileNetworkManageCapabilities(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const context = await loadContext(command.hubCoordinationCaseId);
      const existing =
        (await repositories.getCurrentManageCapabilitiesForAppointment(
          context.appointment.hubAppointmentId,
        ))?.toSnapshot() ?? null;
      const minimumNecessaryContractRef =
        optionalRef(command.minimumNecessaryContractRef) ??
        "MinimumNecessaryContract.patient_manage";
      const policyEvaluation = await evaluateManagePolicy({
        hubCaseId: command.hubCoordinationCaseId,
        pcnRef: context.hubCaseBundle.hubCase.servingPcnId,
        truthProjection: context.truthProjection,
        minimumNecessaryContractRef,
        recordedAt,
      });
      const leaseDecision = evaluateManageCapabilityLease({
        authoritativeConfirmation: isAuthoritativeAppointment(context.appointment),
        continuityValidationState: context.continuityProjection?.validationState ?? "trusted",
        supplierDriftState: context.mirrorState?.driftState ?? "not_started",
        manageFreezeState: context.mirrorState?.manageFreezeState ?? "live",
        ackDebtOpen:
          context.truthProjection.practiceVisibilityState !== "acknowledged" &&
          context.truthProjection.practiceVisibilityState !== "exception_granted",
        identityHoldState: command.identityHoldState ?? false,
        assessmentState: command.assessmentState ?? "clear",
        routeAuthorityState: command.routeAuthorityState ?? "current",
        rebindState: command.rebindState ?? "not_required",
        policyTupleCurrent:
          policyEvaluation.evaluation.policyTupleHash === context.hubCaseBundle.hubCase.policyTupleHash,
        channelReleaseFreezeState: command.channelReleaseFreezeState ?? "released",
        sessionCurrent: command.sessionCurrent ?? true,
        subjectBindingCurrent: command.subjectBindingCurrent ?? true,
        publicationCurrent: command.publicationCurrent ?? true,
        supportedActions:
          command.supportedActions ?? ["cancel", "reschedule", "callback_request", "details_update"],
      });
      const consistencyToken = sha256Hex({
        hubAppointmentId: context.appointment.hubAppointmentId,
        appointmentVersionRef: context.appointment.appointmentVersionRef,
        truthTupleHash: context.truthProjection.truthTupleHash,
        policyTupleHash: policyEvaluation.compiledPolicy.policyTupleHash,
        visibilityEnvelopeVersionRef: command.visibilityEnvelopeVersionRef,
        sessionFenceToken: command.sessionFenceToken,
        subjectFenceToken: command.subjectFenceToken,
        allowedActions: leaseDecision.allowedActions,
        blockedReasonRefs: leaseDecision.blockedReasonRefs,
        channelReleaseFreezeState: command.channelReleaseFreezeState ?? "released",
      });
      if (
        existing &&
        existing.consistencyToken === consistencyToken &&
        compareIso(existing.manageWindowEndsAt, recordedAt) > 0
      ) {
        return {
          capabilities: existing,
          policyEvaluation,
          replayed: true,
        };
      }
      const capabilities: NetworkManageCapabilitiesSnapshot = {
        networkManageCapabilitiesId:
          existing?.networkManageCapabilitiesId ??
          nextId(idGenerator, "networkManageCapabilities"),
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        hubAppointmentId: context.appointment.hubAppointmentId,
        appointmentVersionRef: context.appointment.appointmentVersionRef,
        capabilityState: leaseDecision.capabilityState,
        readOnlyMode: leaseDecision.readOnlyMode,
        reasonCode: leaseDecision.reasonCode,
        policyTupleHash: policyEvaluation.compiledPolicy.policyTupleHash,
        truthTupleHash: context.truthProjection.truthTupleHash,
        visibilityEnvelopeVersionRef: requireRef(
          command.visibilityEnvelopeVersionRef,
          "visibilityEnvelopeVersionRef",
        ),
        supplierTruthVersionRef:
          context.mirrorState?.supplierVersion ?? context.appointment.appointmentVersionRef,
        sessionFenceToken: requireRef(command.sessionFenceToken, "sessionFenceToken"),
        subjectFenceToken: requireRef(command.subjectFenceToken, "subjectFenceToken"),
        manageWindowEndsAt: addMinutes(
          recordedAt,
          ensurePositiveInteger(command.capabilityLeaseMinutes ?? 15, "capabilityLeaseMinutes"),
        ),
        allowedActions: leaseDecision.allowedActions,
        blockedReasonRefs: leaseDecision.blockedReasonRefs,
        fallbackRouteRef: leaseDecision.fallbackRouteRef,
        compiledPolicyBundleRef: policyEvaluation.compiledPolicy.compiledPolicyBundleRef,
        enhancedAccessPolicyRef: policyEvaluation.compiledPolicy.policyId,
        practiceVisibilityPolicyRef: policyEvaluation.compiledPolicy.practiceVisibilityPolicyRef,
        policyEvaluationRef: policyEvaluation.evaluation.policyEvaluationId,
        routeIntentRef: requireRef(command.routeIntentRef, "routeIntentRef"),
        subjectRef: requireRef(command.subjectRef, "subjectRef"),
        sessionEpochRef: requireRef(command.sessionEpochRef, "sessionEpochRef"),
        subjectBindingVersionRef: requireRef(
          command.subjectBindingVersionRef,
          "subjectBindingVersionRef",
        ),
        manifestVersionRef: optionalRef(command.manifestVersionRef),
        releaseApprovalFreezeRef:
          optionalRef(command.releaseApprovalFreezeRef) ?? "release_approval.patient_manage",
        channelReleaseFreezeState: command.channelReleaseFreezeState ?? "released",
        mutationGateRef: "ScopedMutationGate.hub_manage",
        consistencyToken,
        stateConfidenceBand: leaseDecision.stateConfidenceBand,
        causalToken:
          existing?.causalToken ?? nextId(idGenerator, "networkManageCapabilitiesCausal"),
        monotoneRevision: (existing?.monotoneRevision ?? 0) + 1,
        recordedAt,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(command.sourceRefs ?? [])]),
        version: existing ? nextVersion(existing.version) : 1,
      };
      await repositories.saveManageCapabilities(capabilities, {
        expectedVersion: existing?.version,
      });
      return {
        capabilities,
        policyEvaluation,
        replayed: false,
      };
    },

    async executeHubManageAction(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const replay = await repositories.findManageSettlementByIdempotencyKey(command.idempotencyKey);
      if (replay) {
        const settlement = replay.toSnapshot();
        const currentCapabilities = await requireSnapshot(
          repositories.getManageCapabilities(settlement.networkManageCapabilitiesRef),
          "MANAGE_CAPABILITIES_NOT_FOUND",
          "NetworkManageCapabilities is required.",
        );
        const projection =
          (
            await repositories.getCurrentPracticeVisibilityProjectionForCase(
              command.hubCoordinationCaseId,
            )
          )?.toSnapshot() ?? null;
        return {
          settlement,
          capabilities: currentCapabilities,
          deltaRecord: null,
          visibilityProjection: projection,
          replayed: true,
        };
      }

      const context = await loadContext(command.hubCoordinationCaseId);
      const capabilities = await requireSnapshot(
        repositories.getManageCapabilities(command.networkManageCapabilitiesId),
        "MANAGE_CAPABILITIES_NOT_FOUND",
        "NetworkManageCapabilities is required.",
      );
      invariant(
        capabilities.hubAppointmentId === context.appointment.hubAppointmentId,
        "MANAGE_CAPABILITIES_APPOINTMENT_MISMATCH",
        "Manage capabilities do not belong to the current hub appointment.",
      );
      let result: HubManageSettlementResult;
      let blockerRefs = [...capabilities.blockedReasonRefs];

      if (compareIso(capabilities.manageWindowEndsAt, recordedAt) <= 0) {
        result = "stale_recoverable";
        blockerRefs = uniqueSortedRefs([...blockerRefs, "capability_lease_expired"]);
      } else if (capabilities.capabilityState === "expired") {
        result = "stale_recoverable";
      } else if (capabilities.capabilityState === "stale") {
        result = "stale_recoverable";
      } else if (capabilities.capabilityState === "blocked") {
        result = capabilities.blockedReasonRefs.includes("identity_hold")
          ? "identity_recheck_required"
          : capabilities.blockedReasonRefs.some((reason) => reason.startsWith("supplier_"))
            ? "reconciliation_required"
            : "blocked_dependency";
      } else if (!capabilities.allowedActions.includes(command.actionScope)) {
        result = "unsupported_capability";
        blockerRefs = uniqueSortedRefs([...blockerRefs, "unsupported_action_scope"]);
      } else if (command.actionScope === "details_update" && command.containsClinicalText) {
        result = "unsupported_capability";
        blockerRefs = uniqueSortedRefs([...blockerRefs, "clinical_reentry_required"]);
      } else if (
        context.mirrorState &&
        (context.mirrorState.driftState === "drift_detected" ||
          context.mirrorState.driftState === "disputed")
      ) {
        result = "reconciliation_required";
        blockerRefs = uniqueSortedRefs([...blockerRefs, "supplier_drift_reconciliation_required"]);
      } else {
        result =
          command.actionScope === "cancel" || command.actionScope === "details_update"
            ? "applied"
            : "provider_pending";
      }

      const settlement: HubManageSettlementSnapshot = {
        hubManageSettlementId: nextId(idGenerator, "hubManageSettlement"),
        idempotencyKey: requireRef(command.idempotencyKey, "idempotencyKey"),
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        hubAppointmentId: context.appointment.hubAppointmentId,
        networkManageCapabilitiesRef: capabilities.networkManageCapabilitiesId,
        actionScope: command.actionScope,
        routeIntentRef: requireRef(command.routeIntentRef, "routeIntentRef"),
        mutationGateRef:
          optionalRef(command.mutationGateRef) ?? capabilities.mutationGateRef,
        lineageFenceEpoch: context.hubCaseBundle.hubCase.ownershipEpoch,
        result,
        experienceContinuityEvidenceRef:
          context.continuityProjection?.experienceContinuityEvidenceRef ?? null,
        causalToken: nextId(idGenerator, "hubManageSettlementCausal"),
        transitionEnvelopeRef: requireRef(command.transitionEnvelopeRef, "transitionEnvelopeRef"),
        surfaceRouteContractRef: requireRef(
          command.surfaceRouteContractRef,
          "surfaceRouteContractRef",
        ),
        surfacePublicationRef: requireRef(
          command.surfacePublicationRef,
          "surfacePublicationRef",
        ),
        runtimePublicationBundleRef: requireRef(
          command.runtimePublicationBundleRef,
          "runtimePublicationBundleRef",
        ),
        releaseRecoveryDispositionRef: requireRef(
          command.releaseRecoveryDispositionRef,
          "releaseRecoveryDispositionRef",
        ),
        stateConfidenceBand:
          result === "applied"
            ? "high"
            : result === "provider_pending" || result === "stale_recoverable"
              ? "medium"
              : "low",
        recoveryRouteRef:
          result === "applied" || result === "provider_pending"
            ? null
            : capabilities.fallbackRouteRef,
        presentationArtifactRef: optionalRef(command.presentationArtifactRef),
        blockerRefs: uniqueSortedRefs(blockerRefs),
        recordedAt,
        sourceRefs: uniqueSortedRefs([...DEFAULT_SOURCE_REFS, ...(command.sourceRefs ?? [])]),
        version: 1,
      };
      await repositories.saveManageSettlement(settlement);

      const degradedCapabilities: NetworkManageCapabilitiesSnapshot = {
        ...capabilities,
        capabilityState:
          result === "applied" || result === "provider_pending"
            ? "blocked"
            : capabilities.capabilityState,
        readOnlyMode:
          result === "applied" || result === "provider_pending"
            ? "read_only"
            : capabilities.readOnlyMode,
        reasonCode:
          result === "applied" || result === "provider_pending"
            ? "post_mutation_refresh_required"
            : capabilities.reasonCode,
        allowedActions:
          result === "applied" || result === "provider_pending" ? [] : capabilities.allowedActions,
        blockedReasonRefs:
          result === "applied" || result === "provider_pending"
            ? uniqueSortedRefs([
                ...capabilities.blockedReasonRefs,
                "post_mutation_refresh_required",
              ])
            : capabilities.blockedReasonRefs,
        monotoneRevision: capabilities.monotoneRevision + 1,
        recordedAt,
        version: nextVersion(capabilities.version),
      };
      await repositories.saveManageCapabilities(degradedCapabilities, {
        expectedVersion: capabilities.version,
      });

      let deltaRecord: PracticeVisibilityDeltaRecordSnapshot | null = null;
      let visibilityProjection: PracticeVisibilityProjectionSnapshot | null = null;
      if (
        command.materialChange !== false &&
        (result === "applied" || result === "provider_pending")
      ) {
        const changeClass =
          command.actionScope === "cancel"
            ? "cancelled"
            : command.actionScope === "reschedule"
              ? "rescheduled"
              : command.actionScope === "callback_request"
                ? "callback_fallback"
                : "reopened";
        const reopened = await practiceContinuityService.reopenPracticeAcknowledgementDebt({
          hubCoordinationCaseId: command.hubCoordinationCaseId,
          actorRef: command.actorRef,
          routeIntentBindingRef: command.routeIntentRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          recordedAt,
          changeClass,
          deltaReason:
            command.actionScope === "details_update" ? "truth_changed" : "appointment_version_changed",
          sourceRefs: settlement.sourceRefs,
        });
        deltaRecord = reopened.deltaRecord;
        const visibilityEnvelopeId =
          optionalRef(command.practiceVisibilityEnvelopeId) ??
          (
            await repositories.getCurrentPracticeVisibilityProjectionForCase(
              command.hubCoordinationCaseId,
            )
          )?.toSnapshot().visibilityEnvelopeVersionRef ??
          null;
        if (visibilityEnvelopeId) {
          visibilityProjection = (
            await refreshPracticeVisibilityProjectionInternal({
              hubCoordinationCaseId: command.hubCoordinationCaseId,
              visibilityEnvelopeId,
              recordedAt,
              sourceRefs: settlement.sourceRefs,
            })
          ).projection;
        }
      }

      return {
        settlement,
        capabilities: degradedCapabilities,
        deltaRecord,
        visibilityProjection,
        replayed: false,
      };
    },

    async refreshPracticeVisibilityProjection(command) {
      return refreshPracticeVisibilityProjectionInternal(command);
    },

    async queryCurrentReminderManageVisibilityState(hubCoordinationCaseId) {
      const context = await loadContext(hubCoordinationCaseId);
      const reminderPlan =
        (
          await repositories.getCurrentReminderPlanForAppointment(context.appointment.hubAppointmentId)
        )?.toSnapshot() ?? null;
      const reminderSchedules =
        reminderPlan === null
          ? []
          : (await repositories.listReminderSchedulesForPlan(reminderPlan.networkReminderPlanId)).map(
              (document) => document.toSnapshot(),
            );
      const latestReminderDeliveryEvidence =
        reminderPlan === null
          ? null
          : (await repositories.listReminderDeliveryEvidenceForPlan(reminderPlan.networkReminderPlanId))
              .map((document) => document.toSnapshot())
              .at(-1) ?? null;
      const latestTimelinePublication =
        reminderPlan === null
          ? null
          : (await repositories.listTimelinePublicationsForPlan(reminderPlan.networkReminderPlanId))
              .map((document) => document.toSnapshot())
              .at(-1) ?? null;
      const currentManageCapabilities =
        (
          await repositories.getCurrentManageCapabilitiesForAppointment(
            context.appointment.hubAppointmentId,
          )
        )?.toSnapshot() ?? null;
      const latestManageSettlement = (
        await repositories.listManageSettlementsForAppointment(context.appointment.hubAppointmentId)
      )
        .map((document) => document.toSnapshot())
        .at(-1) ?? null;
      const practiceVisibilityProjection =
        (
          await repositories.getCurrentPracticeVisibilityProjectionForCase(hubCoordinationCaseId)
        )?.toSnapshot() ?? null;
      return {
        reminderPlan,
        reminderSchedules,
        latestReminderDeliveryEvidence,
        currentManageCapabilities,
        latestManageSettlement,
        practiceVisibilityProjection,
        latestTimelinePublication,
        latestDeltaRecord: context.continuityState.latestDeltaRecord,
        appointment: context.appointment,
        truthProjection: context.truthProjection,
      };
    },
  };
}
