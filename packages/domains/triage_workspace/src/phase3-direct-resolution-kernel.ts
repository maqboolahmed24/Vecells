import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import type { Phase3EndpointCode } from "./phase3-endpoint-decision-kernel";

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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function nextKernelId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
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
  map.set(key, row);
}

export type DirectResolutionSeedState = "live" | "recovery_only" | "superseded";
export type BookingIntentState = "seeded" | "recovery_only" | "superseded";
export type PharmacyIntentState = "seeded" | "recovery_only" | "superseded";
export type TriageOutcomePresentationArtifactType =
  | "direct_resolution_confirmation"
  | "clinician_message_preview"
  | "clinician_callback_confirmation"
  | "booking_handoff_confirmation"
  | "pharmacy_handoff_confirmation";
export type TriageOutcomePresentationArtifactState =
  | "summary_only"
  | "interactive_same_shell"
  | "external_handoff_ready"
  | "recovery_only";
export type PatientStatusProjectionCode =
  | "self_care_issued"
  | "admin_resolution_started"
  | "callback_created"
  | "clinician_message_created"
  | "booking_handoff_pending"
  | "pharmacy_handoff_pending"
  | "recovery_required";
export type PatientStatusProjectionVisibilityState = "live" | "recovery_only";
export type DirectResolutionSettlementClass = "direct_resolution" | "handoff_seed";
export type DirectResolutionSettlementState = "settled" | "recovery_only" | "superseded";
export type DirectResolutionOutboxEffectType =
  | "patient_status_projection"
  | "consequence_publication"
  | "presentation_artifact_publication"
  | "lifecycle_outcome_recorded"
  | "lifecycle_handoff_active"
  | "lifecycle_closure_evaluation";
export type DirectResolutionOutboxDispatchState = "pending" | "dispatched" | "cancelled";

const seedStates: readonly DirectResolutionSeedState[] = [
  "live",
  "recovery_only",
  "superseded",
];
const bookingStates: readonly BookingIntentState[] = ["seeded", "recovery_only", "superseded"];
const pharmacyStates: readonly PharmacyIntentState[] = ["seeded", "recovery_only", "superseded"];
const artifactTypes: readonly TriageOutcomePresentationArtifactType[] = [
  "direct_resolution_confirmation",
  "clinician_message_preview",
  "clinician_callback_confirmation",
  "booking_handoff_confirmation",
  "pharmacy_handoff_confirmation",
];
const artifactStates: readonly TriageOutcomePresentationArtifactState[] = [
  "summary_only",
  "interactive_same_shell",
  "external_handoff_ready",
  "recovery_only",
];
const projectionCodes: readonly PatientStatusProjectionCode[] = [
  "self_care_issued",
  "admin_resolution_started",
  "callback_created",
  "clinician_message_created",
  "booking_handoff_pending",
  "pharmacy_handoff_pending",
  "recovery_required",
];
const projectionVisibilityStates: readonly PatientStatusProjectionVisibilityState[] = [
  "live",
  "recovery_only",
];
const settlementClasses: readonly DirectResolutionSettlementClass[] = [
  "direct_resolution",
  "handoff_seed",
];
const settlementStates: readonly DirectResolutionSettlementState[] = [
  "settled",
  "recovery_only",
  "superseded",
];
const outboxEffectTypes: readonly DirectResolutionOutboxEffectType[] = [
  "patient_status_projection",
  "consequence_publication",
  "presentation_artifact_publication",
  "lifecycle_outcome_recorded",
  "lifecycle_handoff_active",
  "lifecycle_closure_evaluation",
];
const outboxDispatchStates: readonly DirectResolutionOutboxDispatchState[] = [
  "pending",
  "dispatched",
  "cancelled",
];

export interface CallbackCaseSeedSnapshot {
  callbackSeedId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  episodeRef: string;
  decisionEpochRef: string;
  decisionId: string;
  lineageCaseLinkRef: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  callbackWindowRef: string;
  callbackReasonSummary: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  seedState: DirectResolutionSeedState;
  decisionSupersessionRecordRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ClinicianMessageSeedSnapshot {
  clinicianMessageSeedId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  episodeRef: string;
  decisionEpochRef: string;
  decisionId: string;
  lineageCaseLinkRef: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  messageSubject: string;
  messageBody: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  seedState: DirectResolutionSeedState;
  decisionSupersessionRecordRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SelfCareConsequenceStarterSnapshot {
  selfCareStarterId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  decisionEpochRef: string;
  decisionId: string;
  boundaryTupleRef: string | null;
  adviceSummary: string;
  safetyNetAdvice: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  starterState: DirectResolutionSeedState;
  decisionSupersessionRecordRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AdminResolutionStarterSnapshot {
  adminResolutionStarterId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  episodeRef: string;
  decisionEpochRef: string;
  decisionId: string;
  lineageCaseLinkRef: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  adminResolutionSubtypeRef: string;
  summaryText: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  starterState: DirectResolutionSeedState;
  decisionSupersessionRecordRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BookingIntentSnapshot {
  intentId: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  sourceTriageTaskRef: string;
  lineageCaseLinkRef: string;
  priorityBand: string;
  timeframe: string;
  modality: string;
  clinicianType: string;
  continuityPreference: string;
  accessNeeds: string;
  patientPreferenceSummary: string;
  createdFromDecisionId: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  intentState: BookingIntentState;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PharmacyIntentSnapshot {
  intentId: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  sourceTriageTaskRef: string;
  lineageCaseLinkRef: string;
  suspectedPathway: string;
  eligibilityFacts: readonly string[];
  exclusionFlags: readonly string[];
  patientChoicePending: boolean;
  createdFromDecisionId: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  intentState: PharmacyIntentState;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TriageOutcomePresentationArtifactSnapshot {
  presentationArtifactId: string;
  taskId: string;
  requestId: string;
  decisionEpochRef: string;
  endpointDecisionRef: string | null;
  artifactType: TriageOutcomePresentationArtifactType;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  artifactState: TriageOutcomePresentationArtifactState;
  headline: string;
  summaryLines: readonly string[];
  patientFacingSummary: string;
  provenanceRefs: readonly string[];
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  decisionSupersessionRecordRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PatientStatusProjectionUpdateSnapshot {
  projectionUpdateId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  decisionEpochRef: string;
  decisionId: string;
  endpointCode: Phase3EndpointCode;
  statusCode: PatientStatusProjectionCode;
  headline: string;
  summaryLines: readonly string[];
  patientFacingSummary: string;
  visibilityState: PatientStatusProjectionVisibilityState;
  sourceSettlementRef: string;
  decisionSupersessionRecordRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface DirectResolutionSettlementSnapshot {
  settlementId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  decisionEpochRef: string;
  decisionId: string;
  endpointCode: Phase3EndpointCode;
  settlementClass: DirectResolutionSettlementClass;
  triageTaskStatus: "resolved_without_appointment" | "handoff_pending";
  callbackSeedRef: string | null;
  clinicianMessageSeedRef: string | null;
  selfCareStarterRef: string | null;
  adminResolutionStarterRef: string | null;
  bookingIntentRef: string | null;
  pharmacyIntentRef: string | null;
  lineageCaseLinkRef: string | null;
  presentationArtifactRef: string;
  patientStatusProjectionRef: string;
  lifecycleHookEffectRef: string;
  closureEvaluationEffectRef: string | null;
  settlementState: DirectResolutionSettlementState;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  decisionSupersessionRecordRef: string | null;
  recordedAt: string;
  version: number;
}

export interface DirectResolutionOutboxEntrySnapshot {
  outboxEntryId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  settlementRef: string;
  decisionEpochRef: string;
  effectType: DirectResolutionOutboxEffectType;
  effectKey: string;
  targetRef: string;
  dispatchState: DirectResolutionOutboxDispatchState;
  reasonRef: string | null;
  createdAt: string;
  dispatchedAt: string | null;
  cancelledAt: string | null;
  version: number;
}

export interface Phase3DirectResolutionBundle {
  settlement: DirectResolutionSettlementSnapshot | null;
  callbackSeed: CallbackCaseSeedSnapshot | null;
  clinicianMessageSeed: ClinicianMessageSeedSnapshot | null;
  selfCareStarter: SelfCareConsequenceStarterSnapshot | null;
  adminResolutionStarter: AdminResolutionStarterSnapshot | null;
  bookingIntent: BookingIntentSnapshot | null;
  pharmacyIntent: PharmacyIntentSnapshot | null;
  presentationArtifact: TriageOutcomePresentationArtifactSnapshot | null;
  patientStatusProjection: PatientStatusProjectionUpdateSnapshot | null;
  outboxEntries: readonly DirectResolutionOutboxEntrySnapshot[];
}

export interface DirectResolutionOutboxDispatchRecord {
  outboxEntryRef: string;
  settlementRef: string;
  effectType: DirectResolutionOutboxEffectType;
  targetRef: string;
  recordedAt: string;
}

export interface Phase3DirectResolutionKernelRepositories {
  getSettlement(settlementId: string): Promise<DirectResolutionSettlementSnapshot | null>;
  saveSettlement(
    settlement: DirectResolutionSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSettlementsForTask(taskId: string): Promise<readonly DirectResolutionSettlementSnapshot[]>;
  getCurrentSettlementForTask(taskId: string): Promise<DirectResolutionSettlementSnapshot | null>;
  getSettlementForTaskEpoch(
    taskId: string,
    decisionEpochRef: string,
  ): Promise<DirectResolutionSettlementSnapshot | null>;

  getCallbackSeed(callbackSeedId: string): Promise<CallbackCaseSeedSnapshot | null>;
  saveCallbackSeed(
    callbackSeed: CallbackCaseSeedSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentCallbackSeedForTask(taskId: string): Promise<CallbackCaseSeedSnapshot | null>;
  listCallbackSeedsForTask(taskId: string): Promise<readonly CallbackCaseSeedSnapshot[]>;

  getClinicianMessageSeed(
    clinicianMessageSeedId: string,
  ): Promise<ClinicianMessageSeedSnapshot | null>;
  saveClinicianMessageSeed(
    clinicianMessageSeed: ClinicianMessageSeedSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentClinicianMessageSeedForTask(taskId: string): Promise<ClinicianMessageSeedSnapshot | null>;
  listClinicianMessageSeedsForTask(taskId: string): Promise<readonly ClinicianMessageSeedSnapshot[]>;

  getSelfCareStarter(selfCareStarterId: string): Promise<SelfCareConsequenceStarterSnapshot | null>;
  saveSelfCareStarter(
    selfCareStarter: SelfCareConsequenceStarterSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentSelfCareStarterForTask(taskId: string): Promise<SelfCareConsequenceStarterSnapshot | null>;
  listSelfCareStartersForTask(taskId: string): Promise<readonly SelfCareConsequenceStarterSnapshot[]>;

  getAdminResolutionStarter(
    adminResolutionStarterId: string,
  ): Promise<AdminResolutionStarterSnapshot | null>;
  saveAdminResolutionStarter(
    adminResolutionStarter: AdminResolutionStarterSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentAdminResolutionStarterForTask(taskId: string): Promise<AdminResolutionStarterSnapshot | null>;
  listAdminResolutionStartersForTask(taskId: string): Promise<readonly AdminResolutionStarterSnapshot[]>;

  getBookingIntent(intentId: string): Promise<BookingIntentSnapshot | null>;
  saveBookingIntent(
    bookingIntent: BookingIntentSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentBookingIntentForTask(taskId: string): Promise<BookingIntentSnapshot | null>;
  listBookingIntentsForTask(taskId: string): Promise<readonly BookingIntentSnapshot[]>;

  getPharmacyIntent(intentId: string): Promise<PharmacyIntentSnapshot | null>;
  savePharmacyIntent(
    pharmacyIntent: PharmacyIntentSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentPharmacyIntentForTask(taskId: string): Promise<PharmacyIntentSnapshot | null>;
  listPharmacyIntentsForTask(taskId: string): Promise<readonly PharmacyIntentSnapshot[]>;

  getPresentationArtifact(
    presentationArtifactId: string,
  ): Promise<TriageOutcomePresentationArtifactSnapshot | null>;
  savePresentationArtifact(
    artifact: TriageOutcomePresentationArtifactSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentPresentationArtifactForTask(
    taskId: string,
  ): Promise<TriageOutcomePresentationArtifactSnapshot | null>;
  listPresentationArtifactsForTask(
    taskId: string,
  ): Promise<readonly TriageOutcomePresentationArtifactSnapshot[]>;

  getPatientStatusProjection(
    projectionUpdateId: string,
  ): Promise<PatientStatusProjectionUpdateSnapshot | null>;
  savePatientStatusProjection(
    projection: PatientStatusProjectionUpdateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentPatientStatusProjectionForTask(
    taskId: string,
  ): Promise<PatientStatusProjectionUpdateSnapshot | null>;
  listPatientStatusProjectionsForTask(
    taskId: string,
  ): Promise<readonly PatientStatusProjectionUpdateSnapshot[]>;

  getOutboxEntry(outboxEntryId: string): Promise<DirectResolutionOutboxEntrySnapshot | null>;
  getOutboxEntryByEffectKey(effectKey: string): Promise<DirectResolutionOutboxEntrySnapshot | null>;
  saveOutboxEntry(
    outboxEntry: DirectResolutionOutboxEntrySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listOutboxEntries(): Promise<readonly DirectResolutionOutboxEntrySnapshot[]>;
  listOutboxEntriesForTask(taskId: string): Promise<readonly DirectResolutionOutboxEntrySnapshot[]>;

  withTaskBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

class InMemoryPhase3DirectResolutionKernelStore
  implements Phase3DirectResolutionKernelRepositories
{
  private readonly settlements = new Map<string, DirectResolutionSettlementSnapshot>();
  private readonly settlementsByTask = new Map<string, string[]>();
  private readonly currentSettlementByTask = new Map<string, string>();
  private readonly settlementByTaskEpoch = new Map<string, string>();

  private readonly callbackSeeds = new Map<string, CallbackCaseSeedSnapshot>();
  private readonly callbackSeedsByTask = new Map<string, string[]>();
  private readonly currentCallbackSeedByTask = new Map<string, string>();

  private readonly clinicianMessageSeeds = new Map<string, ClinicianMessageSeedSnapshot>();
  private readonly clinicianMessageSeedsByTask = new Map<string, string[]>();
  private readonly currentClinicianMessageSeedByTask = new Map<string, string>();

  private readonly selfCareStarters = new Map<string, SelfCareConsequenceStarterSnapshot>();
  private readonly selfCareStartersByTask = new Map<string, string[]>();
  private readonly currentSelfCareStarterByTask = new Map<string, string>();

  private readonly adminResolutionStarters = new Map<string, AdminResolutionStarterSnapshot>();
  private readonly adminResolutionStartersByTask = new Map<string, string[]>();
  private readonly currentAdminResolutionStarterByTask = new Map<string, string>();

  private readonly bookingIntents = new Map<string, BookingIntentSnapshot>();
  private readonly bookingIntentsByTask = new Map<string, string[]>();
  private readonly currentBookingIntentByTask = new Map<string, string>();

  private readonly pharmacyIntents = new Map<string, PharmacyIntentSnapshot>();
  private readonly pharmacyIntentsByTask = new Map<string, string[]>();
  private readonly currentPharmacyIntentByTask = new Map<string, string>();

  private readonly artifacts = new Map<string, TriageOutcomePresentationArtifactSnapshot>();
  private readonly artifactsByTask = new Map<string, string[]>();
  private readonly currentArtifactByTask = new Map<string, string>();

  private readonly patientStatusProjections = new Map<string, PatientStatusProjectionUpdateSnapshot>();
  private readonly patientStatusProjectionsByTask = new Map<string, string[]>();
  private readonly currentPatientStatusProjectionByTask = new Map<string, string>();

  private readonly outboxEntries = new Map<string, DirectResolutionOutboxEntrySnapshot>();
  private readonly outboxEntriesByTask = new Map<string, string[]>();
  private readonly outboxEntryByEffectKey = new Map<string, string>();

  private boundaryQueue: Promise<void> = Promise.resolve();

  async withTaskBoundary<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.boundaryQueue;
    let release: () => void = () => undefined;
    this.boundaryQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  async getSettlement(settlementId: string): Promise<DirectResolutionSettlementSnapshot | null> {
    return this.settlements.get(settlementId) ?? null;
  }

  async saveSettlement(
    settlement: DirectResolutionSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.settlements, settlement.settlementId, settlement, options);
    const existing = this.settlementsByTask.get(settlement.taskId) ?? [];
    if (!existing.includes(settlement.settlementId)) {
      this.settlementsByTask.set(settlement.taskId, [...existing, settlement.settlementId]);
    }
    this.currentSettlementByTask.set(settlement.taskId, settlement.settlementId);
    this.settlementByTaskEpoch.set(
      `${settlement.taskId}::${settlement.decisionEpochRef}`,
      settlement.settlementId,
    );
  }

  async listSettlementsForTask(
    taskId: string,
  ): Promise<readonly DirectResolutionSettlementSnapshot[]> {
    return (this.settlementsByTask.get(taskId) ?? [])
      .map((id) => this.settlements.get(id))
      .filter((entry): entry is DirectResolutionSettlementSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async getCurrentSettlementForTask(
    taskId: string,
  ): Promise<DirectResolutionSettlementSnapshot | null> {
    const current = this.currentSettlementByTask.get(taskId);
    return current ? (this.settlements.get(current) ?? null) : null;
  }

  async getSettlementForTaskEpoch(
    taskId: string,
    decisionEpochRef: string,
  ): Promise<DirectResolutionSettlementSnapshot | null> {
    const current = this.settlementByTaskEpoch.get(`${taskId}::${decisionEpochRef}`);
    return current ? (this.settlements.get(current) ?? null) : null;
  }

  async getCallbackSeed(callbackSeedId: string): Promise<CallbackCaseSeedSnapshot | null> {
    return this.callbackSeeds.get(callbackSeedId) ?? null;
  }

  async saveCallbackSeed(
    callbackSeed: CallbackCaseSeedSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.callbackSeeds, callbackSeed.callbackSeedId, callbackSeed, options);
    const existing = this.callbackSeedsByTask.get(callbackSeed.taskId) ?? [];
    if (!existing.includes(callbackSeed.callbackSeedId)) {
      this.callbackSeedsByTask.set(callbackSeed.taskId, [...existing, callbackSeed.callbackSeedId]);
    }
    this.currentCallbackSeedByTask.set(callbackSeed.taskId, callbackSeed.callbackSeedId);
  }

  async getCurrentCallbackSeedForTask(taskId: string): Promise<CallbackCaseSeedSnapshot | null> {
    const current = this.currentCallbackSeedByTask.get(taskId);
    return current ? (this.callbackSeeds.get(current) ?? null) : null;
  }

  async listCallbackSeedsForTask(taskId: string): Promise<readonly CallbackCaseSeedSnapshot[]> {
    return (this.callbackSeedsByTask.get(taskId) ?? [])
      .map((id) => this.callbackSeeds.get(id))
      .filter((entry): entry is CallbackCaseSeedSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getClinicianMessageSeed(
    clinicianMessageSeedId: string,
  ): Promise<ClinicianMessageSeedSnapshot | null> {
    return this.clinicianMessageSeeds.get(clinicianMessageSeedId) ?? null;
  }

  async saveClinicianMessageSeed(
    clinicianMessageSeed: ClinicianMessageSeedSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.clinicianMessageSeeds,
      clinicianMessageSeed.clinicianMessageSeedId,
      clinicianMessageSeed,
      options,
    );
    const existing = this.clinicianMessageSeedsByTask.get(clinicianMessageSeed.taskId) ?? [];
    if (!existing.includes(clinicianMessageSeed.clinicianMessageSeedId)) {
      this.clinicianMessageSeedsByTask.set(clinicianMessageSeed.taskId, [
        ...existing,
        clinicianMessageSeed.clinicianMessageSeedId,
      ]);
    }
    this.currentClinicianMessageSeedByTask.set(
      clinicianMessageSeed.taskId,
      clinicianMessageSeed.clinicianMessageSeedId,
    );
  }

  async getCurrentClinicianMessageSeedForTask(
    taskId: string,
  ): Promise<ClinicianMessageSeedSnapshot | null> {
    const current = this.currentClinicianMessageSeedByTask.get(taskId);
    return current ? (this.clinicianMessageSeeds.get(current) ?? null) : null;
  }

  async listClinicianMessageSeedsForTask(
    taskId: string,
  ): Promise<readonly ClinicianMessageSeedSnapshot[]> {
    return (this.clinicianMessageSeedsByTask.get(taskId) ?? [])
      .map((id) => this.clinicianMessageSeeds.get(id))
      .filter((entry): entry is ClinicianMessageSeedSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getSelfCareStarter(
    selfCareStarterId: string,
  ): Promise<SelfCareConsequenceStarterSnapshot | null> {
    return this.selfCareStarters.get(selfCareStarterId) ?? null;
  }

  async saveSelfCareStarter(
    selfCareStarter: SelfCareConsequenceStarterSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.selfCareStarters, selfCareStarter.selfCareStarterId, selfCareStarter, options);
    const existing = this.selfCareStartersByTask.get(selfCareStarter.taskId) ?? [];
    if (!existing.includes(selfCareStarter.selfCareStarterId)) {
      this.selfCareStartersByTask.set(selfCareStarter.taskId, [
        ...existing,
        selfCareStarter.selfCareStarterId,
      ]);
    }
    this.currentSelfCareStarterByTask.set(selfCareStarter.taskId, selfCareStarter.selfCareStarterId);
  }

  async getCurrentSelfCareStarterForTask(
    taskId: string,
  ): Promise<SelfCareConsequenceStarterSnapshot | null> {
    const current = this.currentSelfCareStarterByTask.get(taskId);
    return current ? (this.selfCareStarters.get(current) ?? null) : null;
  }

  async listSelfCareStartersForTask(
    taskId: string,
  ): Promise<readonly SelfCareConsequenceStarterSnapshot[]> {
    return (this.selfCareStartersByTask.get(taskId) ?? [])
      .map((id) => this.selfCareStarters.get(id))
      .filter((entry): entry is SelfCareConsequenceStarterSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getAdminResolutionStarter(
    adminResolutionStarterId: string,
  ): Promise<AdminResolutionStarterSnapshot | null> {
    return this.adminResolutionStarters.get(adminResolutionStarterId) ?? null;
  }

  async saveAdminResolutionStarter(
    adminResolutionStarter: AdminResolutionStarterSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.adminResolutionStarters,
      adminResolutionStarter.adminResolutionStarterId,
      adminResolutionStarter,
      options,
    );
    const existing = this.adminResolutionStartersByTask.get(adminResolutionStarter.taskId) ?? [];
    if (!existing.includes(adminResolutionStarter.adminResolutionStarterId)) {
      this.adminResolutionStartersByTask.set(adminResolutionStarter.taskId, [
        ...existing,
        adminResolutionStarter.adminResolutionStarterId,
      ]);
    }
    this.currentAdminResolutionStarterByTask.set(
      adminResolutionStarter.taskId,
      adminResolutionStarter.adminResolutionStarterId,
    );
  }

  async getCurrentAdminResolutionStarterForTask(
    taskId: string,
  ): Promise<AdminResolutionStarterSnapshot | null> {
    const current = this.currentAdminResolutionStarterByTask.get(taskId);
    return current ? (this.adminResolutionStarters.get(current) ?? null) : null;
  }

  async listAdminResolutionStartersForTask(
    taskId: string,
  ): Promise<readonly AdminResolutionStarterSnapshot[]> {
    return (this.adminResolutionStartersByTask.get(taskId) ?? [])
      .map((id) => this.adminResolutionStarters.get(id))
      .filter((entry): entry is AdminResolutionStarterSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getBookingIntent(intentId: string): Promise<BookingIntentSnapshot | null> {
    return this.bookingIntents.get(intentId) ?? null;
  }

  async saveBookingIntent(
    bookingIntent: BookingIntentSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.bookingIntents, bookingIntent.intentId, bookingIntent, options);
    const existing = this.bookingIntentsByTask.get(bookingIntent.sourceTriageTaskRef) ?? [];
    if (!existing.includes(bookingIntent.intentId)) {
      this.bookingIntentsByTask.set(bookingIntent.sourceTriageTaskRef, [
        ...existing,
        bookingIntent.intentId,
      ]);
    }
    this.currentBookingIntentByTask.set(bookingIntent.sourceTriageTaskRef, bookingIntent.intentId);
  }

  async getCurrentBookingIntentForTask(taskId: string): Promise<BookingIntentSnapshot | null> {
    const current = this.currentBookingIntentByTask.get(taskId);
    return current ? (this.bookingIntents.get(current) ?? null) : null;
  }

  async listBookingIntentsForTask(taskId: string): Promise<readonly BookingIntentSnapshot[]> {
    return (this.bookingIntentsByTask.get(taskId) ?? [])
      .map((id) => this.bookingIntents.get(id))
      .filter((entry): entry is BookingIntentSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getPharmacyIntent(intentId: string): Promise<PharmacyIntentSnapshot | null> {
    return this.pharmacyIntents.get(intentId) ?? null;
  }

  async savePharmacyIntent(
    pharmacyIntent: PharmacyIntentSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.pharmacyIntents, pharmacyIntent.intentId, pharmacyIntent, options);
    const existing = this.pharmacyIntentsByTask.get(pharmacyIntent.sourceTriageTaskRef) ?? [];
    if (!existing.includes(pharmacyIntent.intentId)) {
      this.pharmacyIntentsByTask.set(pharmacyIntent.sourceTriageTaskRef, [
        ...existing,
        pharmacyIntent.intentId,
      ]);
    }
    this.currentPharmacyIntentByTask.set(pharmacyIntent.sourceTriageTaskRef, pharmacyIntent.intentId);
  }

  async getCurrentPharmacyIntentForTask(taskId: string): Promise<PharmacyIntentSnapshot | null> {
    const current = this.currentPharmacyIntentByTask.get(taskId);
    return current ? (this.pharmacyIntents.get(current) ?? null) : null;
  }

  async listPharmacyIntentsForTask(taskId: string): Promise<readonly PharmacyIntentSnapshot[]> {
    return (this.pharmacyIntentsByTask.get(taskId) ?? [])
      .map((id) => this.pharmacyIntents.get(id))
      .filter((entry): entry is PharmacyIntentSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getPresentationArtifact(
    presentationArtifactId: string,
  ): Promise<TriageOutcomePresentationArtifactSnapshot | null> {
    return this.artifacts.get(presentationArtifactId) ?? null;
  }

  async savePresentationArtifact(
    artifact: TriageOutcomePresentationArtifactSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.artifacts, artifact.presentationArtifactId, artifact, options);
    const existing = this.artifactsByTask.get(artifact.taskId) ?? [];
    if (!existing.includes(artifact.presentationArtifactId)) {
      this.artifactsByTask.set(artifact.taskId, [...existing, artifact.presentationArtifactId]);
    }
    this.currentArtifactByTask.set(artifact.taskId, artifact.presentationArtifactId);
  }

  async getCurrentPresentationArtifactForTask(
    taskId: string,
  ): Promise<TriageOutcomePresentationArtifactSnapshot | null> {
    const current = this.currentArtifactByTask.get(taskId);
    return current ? (this.artifacts.get(current) ?? null) : null;
  }

  async listPresentationArtifactsForTask(
    taskId: string,
  ): Promise<readonly TriageOutcomePresentationArtifactSnapshot[]> {
    return (this.artifactsByTask.get(taskId) ?? [])
      .map((id) => this.artifacts.get(id))
      .filter((entry): entry is TriageOutcomePresentationArtifactSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getPatientStatusProjection(
    projectionUpdateId: string,
  ): Promise<PatientStatusProjectionUpdateSnapshot | null> {
    return this.patientStatusProjections.get(projectionUpdateId) ?? null;
  }

  async savePatientStatusProjection(
    projection: PatientStatusProjectionUpdateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.patientStatusProjections, projection.projectionUpdateId, projection, options);
    const existing = this.patientStatusProjectionsByTask.get(projection.taskId) ?? [];
    if (!existing.includes(projection.projectionUpdateId)) {
      this.patientStatusProjectionsByTask.set(projection.taskId, [
        ...existing,
        projection.projectionUpdateId,
      ]);
    }
    this.currentPatientStatusProjectionByTask.set(projection.taskId, projection.projectionUpdateId);
  }

  async getCurrentPatientStatusProjectionForTask(
    taskId: string,
  ): Promise<PatientStatusProjectionUpdateSnapshot | null> {
    const current = this.currentPatientStatusProjectionByTask.get(taskId);
    return current ? (this.patientStatusProjections.get(current) ?? null) : null;
  }

  async listPatientStatusProjectionsForTask(
    taskId: string,
  ): Promise<readonly PatientStatusProjectionUpdateSnapshot[]> {
    return (this.patientStatusProjectionsByTask.get(taskId) ?? [])
      .map((id) => this.patientStatusProjections.get(id))
      .filter((entry): entry is PatientStatusProjectionUpdateSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getOutboxEntry(outboxEntryId: string): Promise<DirectResolutionOutboxEntrySnapshot | null> {
    return this.outboxEntries.get(outboxEntryId) ?? null;
  }

  async getOutboxEntryByEffectKey(
    effectKey: string,
  ): Promise<DirectResolutionOutboxEntrySnapshot | null> {
    const current = this.outboxEntryByEffectKey.get(effectKey);
    return current ? (this.outboxEntries.get(current) ?? null) : null;
  }

  async saveOutboxEntry(
    outboxEntry: DirectResolutionOutboxEntrySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.outboxEntries, outboxEntry.outboxEntryId, outboxEntry, options);
    const existing = this.outboxEntriesByTask.get(outboxEntry.taskId) ?? [];
    if (!existing.includes(outboxEntry.outboxEntryId)) {
      this.outboxEntriesByTask.set(outboxEntry.taskId, [...existing, outboxEntry.outboxEntryId]);
    }
    this.outboxEntryByEffectKey.set(outboxEntry.effectKey, outboxEntry.outboxEntryId);
  }

  async listOutboxEntries(): Promise<readonly DirectResolutionOutboxEntrySnapshot[]> {
    return [...this.outboxEntries.values()].sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async listOutboxEntriesForTask(
    taskId: string,
  ): Promise<readonly DirectResolutionOutboxEntrySnapshot[]> {
    return (this.outboxEntriesByTask.get(taskId) ?? [])
      .map((id) => this.outboxEntries.get(id))
      .filter((entry): entry is DirectResolutionOutboxEntrySnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }
}

function normalizeCallbackSeed(input: CallbackCaseSeedSnapshot): CallbackCaseSeedSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.leaseTtlSeconds, "leaseTtlSeconds");
  ensurePositiveInteger(input.ownershipEpoch, "ownershipEpoch");
  ensurePositiveInteger(input.currentLineageFenceEpoch, "currentLineageFenceEpoch");
  invariant(seedStates.includes(input.seedState), "INVALID_CALLBACK_SEED_STATE", "Unsupported callback seed state.");
  return {
    ...input,
    callbackSeedId: requireRef(input.callbackSeedId, "callbackSeedId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    episodeRef: requireRef(input.episodeRef, "episodeRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    lineageCaseLinkRef: requireRef(input.lineageCaseLinkRef, "lineageCaseLinkRef"),
    lifecycleLeaseRef: requireRef(input.lifecycleLeaseRef, "lifecycleLeaseRef"),
    leaseAuthorityRef: requireRef(input.leaseAuthorityRef, "leaseAuthorityRef"),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    callbackWindowRef: requireRef(input.callbackWindowRef, "callbackWindowRef"),
    callbackReasonSummary: requireRef(input.callbackReasonSummary, "callbackReasonSummary"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
  };
}

function normalizeClinicianMessageSeed(
  input: ClinicianMessageSeedSnapshot,
): ClinicianMessageSeedSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.leaseTtlSeconds, "leaseTtlSeconds");
  ensurePositiveInteger(input.ownershipEpoch, "ownershipEpoch");
  ensurePositiveInteger(input.currentLineageFenceEpoch, "currentLineageFenceEpoch");
  invariant(
    seedStates.includes(input.seedState),
    "INVALID_CLINICIAN_MESSAGE_SEED_STATE",
    "Unsupported clinician message seed state.",
  );
  return {
    ...input,
    clinicianMessageSeedId: requireRef(input.clinicianMessageSeedId, "clinicianMessageSeedId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    episodeRef: requireRef(input.episodeRef, "episodeRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    lineageCaseLinkRef: requireRef(input.lineageCaseLinkRef, "lineageCaseLinkRef"),
    lifecycleLeaseRef: requireRef(input.lifecycleLeaseRef, "lifecycleLeaseRef"),
    leaseAuthorityRef: requireRef(input.leaseAuthorityRef, "leaseAuthorityRef"),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    messageSubject: requireRef(input.messageSubject, "messageSubject"),
    messageBody: requireRef(input.messageBody, "messageBody"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
  };
}

function normalizeSelfCareStarter(
  input: SelfCareConsequenceStarterSnapshot,
): SelfCareConsequenceStarterSnapshot {
  ensurePositiveInteger(input.version, "version");
  invariant(
    seedStates.includes(input.starterState),
    "INVALID_SELF_CARE_STARTER_STATE",
    "Unsupported self-care starter state.",
  );
  return {
    ...input,
    selfCareStarterId: requireRef(input.selfCareStarterId, "selfCareStarterId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    boundaryTupleRef: optionalRef(input.boundaryTupleRef),
    adviceSummary: requireRef(input.adviceSummary, "adviceSummary"),
    safetyNetAdvice: requireRef(input.safetyNetAdvice, "safetyNetAdvice"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
  };
}

function normalizeAdminResolutionStarter(
  input: AdminResolutionStarterSnapshot,
): AdminResolutionStarterSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.leaseTtlSeconds, "leaseTtlSeconds");
  ensurePositiveInteger(input.ownershipEpoch, "ownershipEpoch");
  ensurePositiveInteger(input.currentLineageFenceEpoch, "currentLineageFenceEpoch");
  invariant(
    seedStates.includes(input.starterState),
    "INVALID_ADMIN_RESOLUTION_STARTER_STATE",
    "Unsupported admin-resolution starter state.",
  );
  return {
    ...input,
    adminResolutionStarterId: requireRef(
      input.adminResolutionStarterId,
      "adminResolutionStarterId",
    ),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    episodeRef: requireRef(input.episodeRef, "episodeRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    lineageCaseLinkRef: requireRef(input.lineageCaseLinkRef, "lineageCaseLinkRef"),
    lifecycleLeaseRef: requireRef(input.lifecycleLeaseRef, "lifecycleLeaseRef"),
    leaseAuthorityRef: requireRef(input.leaseAuthorityRef, "leaseAuthorityRef"),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    adminResolutionSubtypeRef: requireRef(
      input.adminResolutionSubtypeRef,
      "adminResolutionSubtypeRef",
    ),
    summaryText: requireRef(input.summaryText, "summaryText"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
  };
}

function normalizeBookingIntent(input: BookingIntentSnapshot): BookingIntentSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.leaseTtlSeconds, "leaseTtlSeconds");
  ensurePositiveInteger(input.ownershipEpoch, "ownershipEpoch");
  ensurePositiveInteger(input.currentLineageFenceEpoch, "currentLineageFenceEpoch");
  invariant(
    bookingStates.includes(input.intentState),
    "INVALID_BOOKING_INTENT_STATE",
    "Unsupported booking intent state.",
  );
  return {
    ...input,
    intentId: requireRef(input.intentId, "intentId"),
    episodeRef: requireRef(input.episodeRef, "episodeRef"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    sourceTriageTaskRef: requireRef(input.sourceTriageTaskRef, "sourceTriageTaskRef"),
    lineageCaseLinkRef: requireRef(input.lineageCaseLinkRef, "lineageCaseLinkRef"),
    priorityBand: requireRef(input.priorityBand, "priorityBand"),
    timeframe: requireRef(input.timeframe, "timeframe"),
    modality: requireRef(input.modality, "modality"),
    clinicianType: requireRef(input.clinicianType, "clinicianType"),
    continuityPreference: requireRef(input.continuityPreference, "continuityPreference"),
    accessNeeds: requireRef(input.accessNeeds, "accessNeeds"),
    patientPreferenceSummary: requireRef(input.patientPreferenceSummary, "patientPreferenceSummary"),
    createdFromDecisionId: requireRef(input.createdFromDecisionId, "createdFromDecisionId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    lifecycleLeaseRef: requireRef(input.lifecycleLeaseRef, "lifecycleLeaseRef"),
    leaseAuthorityRef: requireRef(input.leaseAuthorityRef, "leaseAuthorityRef"),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
  };
}

function normalizePharmacyIntent(input: PharmacyIntentSnapshot): PharmacyIntentSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.leaseTtlSeconds, "leaseTtlSeconds");
  ensurePositiveInteger(input.ownershipEpoch, "ownershipEpoch");
  ensurePositiveInteger(input.currentLineageFenceEpoch, "currentLineageFenceEpoch");
  invariant(
    pharmacyStates.includes(input.intentState),
    "INVALID_PHARMACY_INTENT_STATE",
    "Unsupported pharmacy intent state.",
  );
  return {
    ...input,
    intentId: requireRef(input.intentId, "intentId"),
    episodeRef: requireRef(input.episodeRef, "episodeRef"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    sourceTriageTaskRef: requireRef(input.sourceTriageTaskRef, "sourceTriageTaskRef"),
    lineageCaseLinkRef: requireRef(input.lineageCaseLinkRef, "lineageCaseLinkRef"),
    suspectedPathway: requireRef(input.suspectedPathway, "suspectedPathway"),
    eligibilityFacts: uniqueSorted(input.eligibilityFacts),
    exclusionFlags: uniqueSorted(input.exclusionFlags),
    createdFromDecisionId: requireRef(input.createdFromDecisionId, "createdFromDecisionId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    lifecycleLeaseRef: requireRef(input.lifecycleLeaseRef, "lifecycleLeaseRef"),
    leaseAuthorityRef: requireRef(input.leaseAuthorityRef, "leaseAuthorityRef"),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
  };
}

function normalizePresentationArtifact(
  input: TriageOutcomePresentationArtifactSnapshot,
): TriageOutcomePresentationArtifactSnapshot {
  ensurePositiveInteger(input.version, "version");
  invariant(
    artifactTypes.includes(input.artifactType),
    "INVALID_TRIAGE_OUTCOME_ARTIFACT_TYPE",
    "Unsupported TriageOutcomePresentationArtifact type.",
  );
  invariant(
    artifactStates.includes(input.artifactState),
    "INVALID_TRIAGE_OUTCOME_ARTIFACT_STATE",
    "Unsupported TriageOutcomePresentationArtifact state.",
  );
  return {
    ...input,
    presentationArtifactId: requireRef(input.presentationArtifactId, "presentationArtifactId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    endpointDecisionRef: optionalRef(input.endpointDecisionRef),
    artifactPresentationContractRef: requireRef(
      input.artifactPresentationContractRef,
      "artifactPresentationContractRef",
    ),
    outboundNavigationGrantPolicyRef: requireRef(
      input.outboundNavigationGrantPolicyRef,
      "outboundNavigationGrantPolicyRef",
    ),
    audienceSurfaceRuntimeBindingRef: requireRef(
      input.audienceSurfaceRuntimeBindingRef,
      "audienceSurfaceRuntimeBindingRef",
    ),
    surfaceRouteContractRef: requireRef(input.surfaceRouteContractRef, "surfaceRouteContractRef"),
    surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      input.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    visibilityTier: requireRef(input.visibilityTier, "visibilityTier"),
    summarySafetyTier: requireRef(input.summarySafetyTier, "summarySafetyTier"),
    placeholderContractRef: requireRef(input.placeholderContractRef, "placeholderContractRef"),
    headline: requireRef(input.headline, "headline"),
    summaryLines: uniqueSorted(input.summaryLines),
    patientFacingSummary: requireRef(input.patientFacingSummary, "patientFacingSummary"),
    provenanceRefs: uniqueSorted(input.provenanceRefs),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
  };
}

function normalizePatientStatusProjection(
  input: PatientStatusProjectionUpdateSnapshot,
): PatientStatusProjectionUpdateSnapshot {
  ensurePositiveInteger(input.version, "version");
  invariant(
    projectionCodes.includes(input.statusCode),
    "INVALID_PATIENT_STATUS_PROJECTION_CODE",
    "Unsupported patient status projection code.",
  );
  invariant(
    projectionVisibilityStates.includes(input.visibilityState),
    "INVALID_PATIENT_STATUS_VISIBILITY_STATE",
    "Unsupported patient status visibility state.",
  );
  return {
    ...input,
    projectionUpdateId: requireRef(input.projectionUpdateId, "projectionUpdateId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    headline: requireRef(input.headline, "headline"),
    summaryLines: uniqueSorted(input.summaryLines),
    patientFacingSummary: requireRef(input.patientFacingSummary, "patientFacingSummary"),
    sourceSettlementRef: requireRef(input.sourceSettlementRef, "sourceSettlementRef"),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
  };
}

function normalizeSettlement(
  input: DirectResolutionSettlementSnapshot,
): DirectResolutionSettlementSnapshot {
  ensurePositiveInteger(input.version, "version");
  invariant(
    settlementClasses.includes(input.settlementClass),
    "INVALID_DIRECT_RESOLUTION_SETTLEMENT_CLASS",
    "Unsupported direct-resolution settlement class.",
  );
  invariant(
    settlementStates.includes(input.settlementState),
    "INVALID_DIRECT_RESOLUTION_SETTLEMENT_STATE",
    "Unsupported direct-resolution settlement state.",
  );
  return {
    ...input,
    settlementId: requireRef(input.settlementId, "settlementId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    callbackSeedRef: optionalRef(input.callbackSeedRef),
    clinicianMessageSeedRef: optionalRef(input.clinicianMessageSeedRef),
    selfCareStarterRef: optionalRef(input.selfCareStarterRef),
    adminResolutionStarterRef: optionalRef(input.adminResolutionStarterRef),
    bookingIntentRef: optionalRef(input.bookingIntentRef),
    pharmacyIntentRef: optionalRef(input.pharmacyIntentRef),
    lineageCaseLinkRef: optionalRef(input.lineageCaseLinkRef),
    presentationArtifactRef: requireRef(input.presentationArtifactRef, "presentationArtifactRef"),
    patientStatusProjectionRef: requireRef(
      input.patientStatusProjectionRef,
      "patientStatusProjectionRef",
    ),
    lifecycleHookEffectRef: requireRef(input.lifecycleHookEffectRef, "lifecycleHookEffectRef"),
    closureEvaluationEffectRef: optionalRef(input.closureEvaluationEffectRef),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
  };
}

function normalizeOutboxEntry(
  input: DirectResolutionOutboxEntrySnapshot,
): DirectResolutionOutboxEntrySnapshot {
  ensurePositiveInteger(input.version, "version");
  invariant(
    outboxEffectTypes.includes(input.effectType),
    "INVALID_DIRECT_RESOLUTION_OUTBOX_EFFECT_TYPE",
    "Unsupported direct-resolution outbox effect type.",
  );
  invariant(
    outboxDispatchStates.includes(input.dispatchState),
    "INVALID_DIRECT_RESOLUTION_OUTBOX_DISPATCH_STATE",
    "Unsupported direct-resolution outbox dispatch state.",
  );
  return {
    ...input,
    outboxEntryId: requireRef(input.outboxEntryId, "outboxEntryId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    settlementRef: requireRef(input.settlementRef, "settlementRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    effectKey: requireRef(input.effectKey, "effectKey"),
    targetRef: requireRef(input.targetRef, "targetRef"),
    reasonRef: optionalRef(input.reasonRef),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    dispatchedAt: input.dispatchedAt
      ? ensureIsoTimestamp(input.dispatchedAt, "dispatchedAt")
      : null,
    cancelledAt: input.cancelledAt
      ? ensureIsoTimestamp(input.cancelledAt, "cancelledAt")
      : null,
  };
}

export function createPhase3DirectResolutionKernelStore(): Phase3DirectResolutionKernelRepositories {
  return new InMemoryPhase3DirectResolutionKernelStore();
}

export interface CommitDirectResolutionSettlementInput {
  settlement: Omit<DirectResolutionSettlementSnapshot, "version">;
  callbackSeed?: Omit<CallbackCaseSeedSnapshot, "version"> | null;
  clinicianMessageSeed?: Omit<ClinicianMessageSeedSnapshot, "version"> | null;
  selfCareStarter?: Omit<SelfCareConsequenceStarterSnapshot, "version"> | null;
  adminResolutionStarter?: Omit<AdminResolutionStarterSnapshot, "version"> | null;
  bookingIntent?: Omit<BookingIntentSnapshot, "version"> | null;
  pharmacyIntent?: Omit<PharmacyIntentSnapshot, "version"> | null;
  presentationArtifact: Omit<TriageOutcomePresentationArtifactSnapshot, "version">;
  patientStatusProjection: Omit<PatientStatusProjectionUpdateSnapshot, "version">;
  outboxEntries: readonly Omit<DirectResolutionOutboxEntrySnapshot, "version">[];
}

export interface ReconcileSupersededDirectResolutionInput {
  taskId: string;
  priorDecisionEpochRef: string;
  decisionSupersessionRecordRef: string;
  reconciledAt: string;
}

export interface DrainDirectResolutionOutboxWorkerInput {
  evaluatedAt: string;
}

export interface Phase3DirectResolutionKernelService {
  readonly repositories: Phase3DirectResolutionKernelRepositories;
  queryTaskBundle(taskId: string): Promise<Phase3DirectResolutionBundle>;
  commitDirectResolutionSettlement(
    input: CommitDirectResolutionSettlementInput,
  ): Promise<Phase3DirectResolutionBundle>;
  reconcileSupersededConsequences(
    input: ReconcileSupersededDirectResolutionInput,
  ): Promise<Phase3DirectResolutionBundle>;
  listOutboxEntries(): Promise<readonly DirectResolutionOutboxEntrySnapshot[]>;
  drainOutboxWorker(
    input: DrainDirectResolutionOutboxWorkerInput,
  ): Promise<{
    dispatched: readonly DirectResolutionOutboxDispatchRecord[];
    outboxEntries: readonly DirectResolutionOutboxEntrySnapshot[];
  }>;
}

class InMemoryPhase3DirectResolutionKernelService
  implements Phase3DirectResolutionKernelService
{
  readonly repositories: Phase3DirectResolutionKernelRepositories;

  constructor(
    repositories: Phase3DirectResolutionKernelRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {
    this.repositories = repositories;
  }

  async queryTaskBundle(taskId: string): Promise<Phase3DirectResolutionBundle> {
    const settlement = await this.repositories.getCurrentSettlementForTask(taskId);
    const callbackSeed = await this.repositories.getCurrentCallbackSeedForTask(taskId);
    const clinicianMessageSeed = await this.repositories.getCurrentClinicianMessageSeedForTask(taskId);
    const selfCareStarter = await this.repositories.getCurrentSelfCareStarterForTask(taskId);
    const adminResolutionStarter = await this.repositories.getCurrentAdminResolutionStarterForTask(taskId);
    const bookingIntent = await this.repositories.getCurrentBookingIntentForTask(taskId);
    const pharmacyIntent = await this.repositories.getCurrentPharmacyIntentForTask(taskId);
    const presentationArtifact = await this.repositories.getCurrentPresentationArtifactForTask(taskId);
    const patientStatusProjection = await this.repositories.getCurrentPatientStatusProjectionForTask(taskId);
    const outboxEntries = await this.repositories.listOutboxEntriesForTask(taskId);
    return {
      settlement,
      callbackSeed,
      clinicianMessageSeed,
      selfCareStarter,
      adminResolutionStarter,
      bookingIntent,
      pharmacyIntent,
      presentationArtifact,
      patientStatusProjection,
      outboxEntries,
    };
  }

  async commitDirectResolutionSettlement(
    input: CommitDirectResolutionSettlementInput,
  ): Promise<Phase3DirectResolutionBundle> {
    return this.repositories.withTaskBoundary(async () => {
      const existing = await this.repositories.getSettlementForTaskEpoch(
        input.settlement.taskId,
        input.settlement.decisionEpochRef,
      );
      if (existing && existing.settlementState !== "superseded") {
        return this.queryTaskBundle(input.settlement.taskId);
      }

      const settlement = normalizeSettlement({ ...input.settlement, version: 1 });
      const callbackSeed = input.callbackSeed
        ? normalizeCallbackSeed({ ...input.callbackSeed, version: 1 })
        : null;
      const clinicianMessageSeed = input.clinicianMessageSeed
        ? normalizeClinicianMessageSeed({ ...input.clinicianMessageSeed, version: 1 })
        : null;
      const selfCareStarter = input.selfCareStarter
        ? normalizeSelfCareStarter({ ...input.selfCareStarter, version: 1 })
        : null;
      const adminResolutionStarter = input.adminResolutionStarter
        ? normalizeAdminResolutionStarter({ ...input.adminResolutionStarter, version: 1 })
        : null;
      const bookingIntent = input.bookingIntent
        ? normalizeBookingIntent({ ...input.bookingIntent, version: 1 })
        : null;
      const pharmacyIntent = input.pharmacyIntent
        ? normalizePharmacyIntent({ ...input.pharmacyIntent, version: 1 })
        : null;
      const presentationArtifact = normalizePresentationArtifact({
        ...input.presentationArtifact,
        version: 1,
      });
      const patientStatusProjection = normalizePatientStatusProjection({
        ...input.patientStatusProjection,
        version: 1,
      });
      const outboxEntries = input.outboxEntries.map((entry) =>
        normalizeOutboxEntry({ ...entry, version: 1 }),
      );

      if (callbackSeed) {
        await this.repositories.saveCallbackSeed(callbackSeed);
      }
      if (clinicianMessageSeed) {
        await this.repositories.saveClinicianMessageSeed(clinicianMessageSeed);
      }
      if (selfCareStarter) {
        await this.repositories.saveSelfCareStarter(selfCareStarter);
      }
      if (adminResolutionStarter) {
        await this.repositories.saveAdminResolutionStarter(adminResolutionStarter);
      }
      if (bookingIntent) {
        await this.repositories.saveBookingIntent(bookingIntent);
      }
      if (pharmacyIntent) {
        await this.repositories.savePharmacyIntent(pharmacyIntent);
      }
      await this.repositories.savePresentationArtifact(presentationArtifact);
      await this.repositories.savePatientStatusProjection(patientStatusProjection);
      await this.repositories.saveSettlement(settlement);

      for (const outboxEntry of outboxEntries) {
        const existingEntry = await this.repositories.getOutboxEntryByEffectKey(outboxEntry.effectKey);
        if (existingEntry) {
          continue;
        }
        await this.repositories.saveOutboxEntry(outboxEntry);
      }

      return this.queryTaskBundle(settlement.taskId);
    });
  }

  async reconcileSupersededConsequences(
    input: ReconcileSupersededDirectResolutionInput,
  ): Promise<Phase3DirectResolutionBundle> {
    return this.repositories.withTaskBoundary(async () => {
      const bundle = await this.queryTaskBundle(input.taskId);
      const reconciliationTime = ensureIsoTimestamp(input.reconciledAt, "reconciledAt");

      const reconcileSeed = <T extends { version: number; decisionEpochRef: string; updatedAt: string; decisionSupersessionRecordRef: string | null }>(
        row: T | null,
        stateField: keyof T,
        recoveryState: string,
        save: (value: T, options?: CompareAndSetWriteOptions) => Promise<void>,
      ) => {
        if (!row || row.decisionEpochRef !== input.priorDecisionEpochRef) {
          return Promise.resolve();
        }
        if ((row as T & Record<PropertyKey, unknown>)[stateField] === recoveryState) {
          return Promise.resolve();
        }
        return save(
          {
            ...row,
            [stateField]: recoveryState,
            decisionSupersessionRecordRef: input.decisionSupersessionRecordRef,
            updatedAt: reconciliationTime,
            version: nextVersion(row.version),
          } as T,
          { expectedVersion: row.version },
        );
      };

      await reconcileSeed(
        bundle.callbackSeed,
        "seedState",
        "recovery_only",
        this.repositories.saveCallbackSeed.bind(this.repositories),
      );
      await reconcileSeed(
        bundle.clinicianMessageSeed,
        "seedState",
        "recovery_only",
        this.repositories.saveClinicianMessageSeed.bind(this.repositories),
      );
      await reconcileSeed(
        bundle.selfCareStarter,
        "starterState",
        "recovery_only",
        this.repositories.saveSelfCareStarter.bind(this.repositories),
      );
      await reconcileSeed(
        bundle.adminResolutionStarter,
        "starterState",
        "recovery_only",
        this.repositories.saveAdminResolutionStarter.bind(this.repositories),
      );
      await reconcileSeed(
        bundle.bookingIntent,
        "intentState",
        "recovery_only",
        this.repositories.saveBookingIntent.bind(this.repositories),
      );
      await reconcileSeed(
        bundle.pharmacyIntent,
        "intentState",
        "recovery_only",
        this.repositories.savePharmacyIntent.bind(this.repositories),
      );

      if (
        bundle.presentationArtifact &&
        bundle.presentationArtifact.decisionEpochRef === input.priorDecisionEpochRef &&
        bundle.presentationArtifact.artifactState !== "recovery_only"
      ) {
        await this.repositories.savePresentationArtifact(
          normalizePresentationArtifact({
            ...bundle.presentationArtifact,
            artifactState: "recovery_only",
            decisionSupersessionRecordRef: input.decisionSupersessionRecordRef,
            updatedAt: reconciliationTime,
            version: nextVersion(bundle.presentationArtifact.version),
          }),
          { expectedVersion: bundle.presentationArtifact.version },
        );
      }

      if (
        bundle.settlement &&
        bundle.settlement.decisionEpochRef === input.priorDecisionEpochRef &&
        bundle.settlement.settlementState !== "recovery_only"
      ) {
        await this.repositories.saveSettlement(
          normalizeSettlement({
            ...bundle.settlement,
            settlementState: "recovery_only",
            decisionSupersessionRecordRef: input.decisionSupersessionRecordRef,
            recordedAt: reconciliationTime,
            version: nextVersion(bundle.settlement.version),
          }),
          { expectedVersion: bundle.settlement.version },
        );
      }

      for (const outboxEntry of bundle.outboxEntries) {
        if (
          outboxEntry.decisionEpochRef !== input.priorDecisionEpochRef ||
          outboxEntry.dispatchState !== "pending"
        ) {
          continue;
        }
        await this.repositories.saveOutboxEntry(
          normalizeOutboxEntry({
            ...outboxEntry,
            dispatchState: "cancelled",
            reasonRef: "decision_epoch_superseded",
            cancelledAt: reconciliationTime,
            version: nextVersion(outboxEntry.version),
          }),
          { expectedVersion: outboxEntry.version },
        );
      }

      const settlement =
        (await this.repositories.getSettlementForTaskEpoch(input.taskId, input.priorDecisionEpochRef)) ??
        bundle.settlement;
      invariant(
        settlement,
        "DIRECT_RESOLUTION_SETTLEMENT_NOT_FOUND",
        `DirectResolutionSettlement for ${input.taskId} and ${input.priorDecisionEpochRef} is required.`,
      );

      const recoveryProjectionEffectKey = `${input.taskId}::recovery_required::${input.decisionSupersessionRecordRef}`;
      const existingProjectionEntry =
        await this.repositories.getOutboxEntryByEffectKey(recoveryProjectionEffectKey);
      if (!existingProjectionEntry) {
        const recoveryProjection = normalizePatientStatusProjection({
          projectionUpdateId: nextKernelId(
            this.idGenerator,
            "phase3_patient_status_projection_update",
          ),
          taskId: settlement.taskId,
          requestId: settlement.requestId,
          requestLineageRef: settlement.requestLineageRef,
          decisionEpochRef: settlement.decisionEpochRef,
          decisionId: settlement.decisionId,
          endpointCode: settlement.endpointCode,
          statusCode: "recovery_required",
          headline: "Outcome needs review",
          summaryLines: [
            "The prior consequence is no longer actionable under the current decision epoch.",
            "Use the governed recovery path before launching new downstream work.",
          ],
          patientFacingSummary:
            "This update changed after review. The care team is re-checking the next step.",
          visibilityState: "recovery_only",
          sourceSettlementRef: settlement.settlementId,
          decisionSupersessionRecordRef: input.decisionSupersessionRecordRef,
          createdAt: reconciliationTime,
          updatedAt: reconciliationTime,
          version: 1,
        });
        await this.repositories.savePatientStatusProjection(recoveryProjection);
        await this.repositories.saveOutboxEntry(
          normalizeOutboxEntry({
            outboxEntryId: nextKernelId(this.idGenerator, "phase3_direct_resolution_outbox"),
            taskId: settlement.taskId,
            requestId: settlement.requestId,
            requestLineageRef: settlement.requestLineageRef,
            settlementRef: settlement.settlementId,
            decisionEpochRef: settlement.decisionEpochRef,
            effectType: "patient_status_projection",
            effectKey: recoveryProjectionEffectKey,
            targetRef: recoveryProjection.projectionUpdateId,
            dispatchState: "pending",
            reasonRef: "decision_epoch_superseded",
            createdAt: reconciliationTime,
            dispatchedAt: null,
            cancelledAt: null,
            version: 1,
          }),
        );
      }

      return this.queryTaskBundle(input.taskId);
    });
  }

  async listOutboxEntries(): Promise<readonly DirectResolutionOutboxEntrySnapshot[]> {
    return this.repositories.listOutboxEntries();
  }

  async drainOutboxWorker(
    input: DrainDirectResolutionOutboxWorkerInput,
  ): Promise<{
    dispatched: readonly DirectResolutionOutboxDispatchRecord[];
    outboxEntries: readonly DirectResolutionOutboxEntrySnapshot[];
  }> {
    const evaluatedAt = ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
    const dispatched: DirectResolutionOutboxDispatchRecord[] = [];
    for (const entry of await this.repositories.listOutboxEntries()) {
      if (entry.dispatchState !== "pending") {
        continue;
      }
      await this.repositories.saveOutboxEntry(
        normalizeOutboxEntry({
          ...entry,
          dispatchState: "dispatched",
          dispatchedAt: evaluatedAt,
          version: nextVersion(entry.version),
        }),
        { expectedVersion: entry.version },
      );
      dispatched.push({
        outboxEntryRef: entry.outboxEntryId,
        settlementRef: entry.settlementRef,
        effectType: entry.effectType,
        targetRef: entry.targetRef,
        recordedAt: evaluatedAt,
      });
    }
    return {
      dispatched,
      outboxEntries: await this.repositories.listOutboxEntries(),
    };
  }
}

export function createPhase3DirectResolutionKernelService(
  repositories: Phase3DirectResolutionKernelRepositories = createPhase3DirectResolutionKernelStore(),
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3DirectResolutionKernelService {
  return new InMemoryPhase3DirectResolutionKernelService(
    repositories,
    options?.idGenerator ??
      createDeterministicBackboneIdGenerator("phase3_direct_resolution_kernel"),
  );
}
