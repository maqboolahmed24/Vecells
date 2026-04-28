import {
  type AccessGrantActionScope,
  createAccessGrantService,
  type ContactRouteFreshnessState,
  type ContactRouteKind,
  type ContactRouteSourceAuthorityClass,
  type ContactRouteVerificationMethod,
  createIdentityRepairStore,
  type ReachabilityAssessmentRecord,
  type ReachabilityAuthorityWeight,
  type ReachabilityDependency,
  type ReachabilityDomain,
  type ReachabilityObservationClass,
  type ReachabilityOutcomePolarity,
  type ReachabilityPurpose,
  type ContactRouteRepairJourney,
  type ContactRouteVerificationCheckpoint,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  type CallbackOutcome,
  type CallbackSafetyClassification,
  type CallbackSafetyPreemptionState,
  type MessageDeliveryEvidenceState,
  type MessageDeliveryEvidenceStrength,
  type MessageRepairIntent,
} from "@vecells/domain-triage-workspace";
import {
  createIdentityAccessApplication,
  identityAccessMigrationPlanRefs,
  identityAccessPersistenceTables,
  type IdentityAccessApplication,
} from "./identity-access";
import {
  createPhase3CallbackDomainApplication,
  phase3CallbackMigrationPlanRefs,
  phase3CallbackPersistenceTables,
  type Phase3CallbackApplicationBundle,
  type Phase3CallbackDomainApplication,
} from "./phase3-callback-domain";
import {
  createPhase3ClinicianMessageDomainApplication,
  phase3ClinicianMessageMigrationPlanRefs,
  phase3ClinicianMessagePersistenceTables,
  type Phase3ClinicianMessageApplicationBundle,
  type Phase3ClinicianMessageDomainApplication,
} from "./phase3-clinician-message-domain";
import {
  createPhase3DirectResolutionApplication,
  type Phase3DirectResolutionApplication,
} from "./phase3-direct-resolution-handoffs";
import {
  createReplayCollisionApplication,
  type ReplayCollisionApplication,
} from "./replay-collision-authority";
import {
  createPhase3TriageKernelApplication,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

export const PHASE3_COMMUNICATION_REPAIR_SERVICE_NAME =
  "Phase3CommunicationReachabilityRepairApplication";
export const PHASE3_COMMUNICATION_REPAIR_SCHEMA_VERSION =
  "245.phase3.communication-repair.v1";
export const PHASE3_COMMUNICATION_REPAIR_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/communication-repair",
] as const;

const CALLBACK_DOMAIN = "callback_case";
const MESSAGE_DOMAIN = "clinician_message_thread";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
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

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function nextApplicationId(idGenerator: BackboneIdGenerator, kind: string): string {
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
  map.set(key, row);
}

function addMinutes(iso: string, minutes: number): string {
  const date = new Date(iso);
  invariant(!Number.isNaN(date.getTime()), "INVALID_BASE_TIMESTAMP", "Base timestamp is invalid.");
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

function domainObjectKey(
  communicationDomain: CommunicationRepairDomain,
  communicationObjectRef: string,
): string {
  return `${communicationDomain}::${communicationObjectRef}`;
}

export type CommunicationRepairDomain = "callback_case" | "clinician_message_thread";
export type CommunicationRepairBindingState =
  | "monitoring"
  | "repair_required"
  | "awaiting_verification"
  | "rebound_pending"
  | "clear";
export type CommunicationRepairAuthorizationKind =
  | "controlled_resend"
  | "channel_change"
  | "attachment_recovery"
  | "callback_reschedule";
export type CommunicationRepairAuthorizationState =
  | "authorized"
  | "used"
  | "superseded"
  | "expired";

export interface CommunicationRepairBindingSnapshot {
  bindingId: string;
  taskId: string;
  communicationDomain: CommunicationRepairDomain;
  communicationObjectRef: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  contactRouteRef: string;
  reachabilityDependencyRef: string;
  currentContactRouteSnapshotRef: string;
  currentReachabilityAssessmentRef: string;
  currentReachabilityEpoch: number;
  activeRepairJourneyRef: string | null;
  activeRepairEntryGrantRef: string | null;
  activeVerificationCheckpointRef: string | null;
  lastCommunicationObservationRef: string | null;
  lastAuthorizationRef: string | null;
  lastReboundRecordRef: string | null;
  bindingState: CommunicationRepairBindingState;
  selectedAnchorRef: string;
  recoveryRouteRef: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CommunicationRepairAuthorizationSnapshot {
  authorizationId: string;
  bindingRef: string;
  taskId: string;
  communicationDomain: CommunicationRepairDomain;
  communicationObjectRef: string;
  authorizationKind: CommunicationRepairAuthorizationKind;
  repairJourneyRef: string | null;
  governingGateRef: string | null;
  governingGateDecision: string | null;
  governingEvidenceRef: string | null;
  reachabilityEpoch: number;
  repairEntryGrantRef: string | null;
  authorizationState: CommunicationRepairAuthorizationState;
  sameShellRecoveryRef: string;
  reasonCode: string;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  version: number;
}

export interface CommunicationRepairReboundRecordSnapshot {
  reboundRecordId: string;
  bindingRef: string;
  taskId: string;
  communicationDomain: CommunicationRepairDomain;
  communicationObjectRef: string;
  reachabilityDependencyRef: string;
  repairJourneyRef: string;
  verificationCheckpointRef: string;
  resultingContactRouteSnapshotRef: string;
  resultingReachabilityAssessmentRef: string;
  resultingReachabilityEpoch: number;
  reboundState: "rebound" | "blocked";
  recordedAt: string;
  version: number;
}

export interface CommunicationRepairBindingBundle {
  binding: CommunicationRepairBindingSnapshot;
  dependency: ReachabilityDependency;
  assessment: ReachabilityAssessmentRecord;
  repairJourney: ContactRouteRepairJourney | null;
  verificationCheckpoint: ContactRouteVerificationCheckpoint | null;
  activeAuthorization: CommunicationRepairAuthorizationSnapshot | null;
  lastReboundRecord: CommunicationRepairReboundRecordSnapshot | null;
}

export interface Phase3CommunicationRepairTaskBundle {
  taskId: string;
  callbackRepair: CommunicationRepairBindingBundle | null;
  messageRepair: CommunicationRepairBindingBundle | null;
}

interface CommunicationRepairRepositories {
  getBinding(bindingId: string): Promise<CommunicationRepairBindingSnapshot | null>;
  getBindingByObject(
    communicationDomain: CommunicationRepairDomain,
    communicationObjectRef: string,
  ): Promise<CommunicationRepairBindingSnapshot | null>;
  listBindingsForTask(taskId: string): Promise<readonly CommunicationRepairBindingSnapshot[]>;
  saveBinding(
    binding: CommunicationRepairBindingSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getAuthorization(
    authorizationId: string,
  ): Promise<CommunicationRepairAuthorizationSnapshot | null>;
  listAuthorizationsForBinding(
    bindingRef: string,
  ): Promise<readonly CommunicationRepairAuthorizationSnapshot[]>;
  saveAuthorization(
    authorization: CommunicationRepairAuthorizationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReboundRecord(reboundRecordId: string): Promise<CommunicationRepairReboundRecordSnapshot | null>;
  listReboundRecordsForBinding(
    bindingRef: string,
  ): Promise<readonly CommunicationRepairReboundRecordSnapshot[]>;
  saveReboundRecord(
    reboundRecord: CommunicationRepairReboundRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

class InMemoryCommunicationRepairStore implements CommunicationRepairRepositories {
  private readonly bindings = new Map<string, CommunicationRepairBindingSnapshot>();
  private readonly bindingByObject = new Map<string, string>();
  private readonly authorizations = new Map<string, CommunicationRepairAuthorizationSnapshot>();
  private readonly reboundRecords = new Map<string, CommunicationRepairReboundRecordSnapshot>();

  async getBinding(bindingId: string): Promise<CommunicationRepairBindingSnapshot | null> {
    return this.bindings.get(bindingId) ?? null;
  }

  async getBindingByObject(
    communicationDomain: CommunicationRepairDomain,
    communicationObjectRef: string,
  ): Promise<CommunicationRepairBindingSnapshot | null> {
    const bindingId = this.bindingByObject.get(domainObjectKey(communicationDomain, communicationObjectRef));
    return bindingId ? (this.bindings.get(bindingId) ?? null) : null;
  }

  async listBindingsForTask(taskId: string): Promise<readonly CommunicationRepairBindingSnapshot[]> {
    return [...this.bindings.values()]
      .filter((binding) => binding.taskId === taskId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async saveBinding(
    binding: CommunicationRepairBindingSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.bindings, binding.bindingId, binding, options);
    this.bindingByObject.set(
      domainObjectKey(binding.communicationDomain, binding.communicationObjectRef),
      binding.bindingId,
    );
  }

  async getAuthorization(
    authorizationId: string,
  ): Promise<CommunicationRepairAuthorizationSnapshot | null> {
    return this.authorizations.get(authorizationId) ?? null;
  }

  async listAuthorizationsForBinding(
    bindingRef: string,
  ): Promise<readonly CommunicationRepairAuthorizationSnapshot[]> {
    return [...this.authorizations.values()]
      .filter((authorization) => authorization.bindingRef === bindingRef)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async saveAuthorization(
    authorization: CommunicationRepairAuthorizationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.authorizations, authorization.authorizationId, authorization, options);
  }

  async getReboundRecord(
    reboundRecordId: string,
  ): Promise<CommunicationRepairReboundRecordSnapshot | null> {
    return this.reboundRecords.get(reboundRecordId) ?? null;
  }

  async listReboundRecordsForBinding(
    bindingRef: string,
  ): Promise<readonly CommunicationRepairReboundRecordSnapshot[]> {
    return [...this.reboundRecords.values()]
      .filter((record) => record.bindingRef === bindingRef)
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
  }

  async saveReboundRecord(
    reboundRecord: CommunicationRepairReboundRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.reboundRecords, reboundRecord.reboundRecordId, reboundRecord, options);
  }
}

export function createPhase3CommunicationRepairStore(): CommunicationRepairRepositories {
  return new InMemoryCommunicationRepairStore();
}

export const phase3CommunicationRepairRoutes = [
  {
    routeId: "workspace_task_communication_repair_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/communication-repair",
    contractFamily: "CommunicationRepairBundleContract",
    purpose:
      "Expose the canonical communication reachability dependency, repair journey, verification checkpoint, grant posture, and controlled resend or reschedule authorization chain for one task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_record_callback_reachability",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-reachability",
    contractFamily: "RecordCallbackReachabilityObservationCommandContract",
    purpose:
      "Append callback failure or route-drift evidence as authoritative ReachabilityObservation input and open or refresh same-shell repair only through the canonical dependency chain.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_record_message_reachability",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-reachability",
    contractFamily: "RecordMessageReachabilityObservationCommandContract",
    purpose:
      "Append clinician-message delivery or dispute evidence as authoritative ReachabilityObservation input instead of mutating local message status flags.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_attach_contact_route_candidate",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/communication-repair/{bindingId}:attach-candidate-route",
    contractFamily: "AttachCommunicationRepairCandidateRouteCommandContract",
    purpose:
      "Attach one candidate ContactRouteSnapshot to the live repair journey so repair can rebound only on a fresh snapshot rather than mutable profile edits.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_issue_contact_route_verification",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/communication-repair/{bindingId}:issue-verification",
    contractFamily: "IssueCommunicationRepairVerificationCheckpointCommandContract",
    purpose:
      "Open the one live ContactRouteVerificationCheckpoint for the current repair journey and return the existing checkpoint on duplicate requests.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_settle_contact_route_verification",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/communication-repair/{bindingId}/verification/{checkpointId}:settle",
    contractFamily: "SettleCommunicationRepairVerificationCheckpointCommandContract",
    purpose:
      "Settle communication-route verification, mint a fresh verified snapshot, append a new ReachabilityAssessmentRecord, and rebind only on the new reachability epoch.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_authorize_message_repair_action",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/message-thread/{threadId}:authorize-repair-action",
    contractFamily: "AuthorizeMessageRepairActionCommandContract",
    purpose:
      "Authorize controlled resend, channel change, or attachment recovery only when the current repair chain is clear, rebound, and still backed by the governing ThreadResolutionGate or terminal delivery chain.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_authorize_callback_reschedule",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:authorize-reschedule",
    contractFamily: "AuthorizeCallbackRescheduleCommandContract",
    purpose:
      "Authorize callback reschedule only after the current repair chain rebounds on a fresh reachability epoch and the callback retry or reopen chain remains current.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3CommunicationRepairPersistenceTables = [
  ...new Set([
    ...identityAccessPersistenceTables,
    ...phase3CallbackPersistenceTables,
    ...phase3ClinicianMessagePersistenceTables,
    "phase3_communication_repair_bindings",
    "phase3_communication_repair_authorizations",
    "phase3_communication_rebound_records",
  ]),
] as const;

export const phase3CommunicationRepairMigrationPlanRefs = [
  ...new Set([
    ...identityAccessMigrationPlanRefs,
    ...phase3CallbackMigrationPlanRefs,
    ...phase3ClinicianMessageMigrationPlanRefs,
    "services/command-api/migrations/121_phase3_communication_reachability_repair.sql",
  ]),
] as const;

export interface RecordCallbackReachabilityObservationInput {
  taskId: string;
  callbackCaseId: string;
  actorRef: string;
  recordedAt: string;
  outcome: CallbackOutcome;
  routeEvidenceRef: string;
  pathwayRef: string;
  explicitPermissionState: "granted" | "not_granted" | "unknown";
  containsClinicalContent: boolean;
  verifiedTargetState: "verified" | "unknown";
  safetyClassification: CallbackSafetyClassification;
  safetyPreemptionState: CallbackSafetyPreemptionState;
  tenantPolicyRef?: string | null;
  providerDispositionRef?: string | null;
  patientAcknowledgementRef?: string | null;
  voicemailEvidenceRefs?: readonly string[];
  observationClass?: ReachabilityObservationClass | null;
  observationSourceRef?: string | null;
  authorityWeight?: ReachabilityAuthorityWeight | null;
  evidenceRef?: string | null;
}

export interface RecordMessageReachabilityObservationInput {
  taskId: string;
  threadId: string;
  actorRef: string;
  recordedAt: string;
  deliveryState: Exclude<MessageDeliveryEvidenceState, "unobserved">;
  evidenceStrength: MessageDeliveryEvidenceStrength;
  providerDispositionRef: string;
  deliveryArtifactRefs: readonly string[];
  observationClass?: ReachabilityObservationClass | null;
  observationSourceRef?: string | null;
  authorityWeight?: ReachabilityAuthorityWeight | null;
  evidenceRef?: string | null;
}

export interface AttachCommunicationRepairCandidateRouteInput {
  taskId: string;
  bindingId: string;
  actorRef: string;
  recordedAt: string;
  subjectRef: string;
  routeRef: string;
  routeVersionRef: string;
  routeKind: ContactRouteKind;
  normalizedAddressRef: string;
  preferenceProfileRef: string;
  verificationState: "unverified" | "verified_stale";
  demographicFreshnessState: ContactRouteFreshnessState;
  preferenceFreshnessState: ContactRouteFreshnessState;
  sourceAuthorityClass: ContactRouteSourceAuthorityClass;
}

export interface IssueCommunicationRepairVerificationInput {
  taskId: string;
  bindingId: string;
  actorRef: string;
  recordedAt: string;
  contactRouteRef: string;
  contactRouteVersionRef: string;
  verificationMethod: ContactRouteVerificationMethod;
}

export interface SettleCommunicationRepairVerificationInput {
  taskId: string;
  bindingId: string;
  actorRef: string;
  checkpointId: string;
  recordedAt: string;
  verificationState: "verified" | "failed";
}

export interface AuthorizeMessageRepairActionInput {
  taskId: string;
  threadId: string;
  actorRef: string;
  recordedAt: string;
  authorizationKind: Exclude<CommunicationRepairAuthorizationKind, "callback_reschedule">;
  expiresInMinutes?: number | null;
}

export interface AuthorizeCallbackRescheduleInput {
  taskId: string;
  callbackCaseId: string;
  actorRef: string;
  recordedAt: string;
  expiresInMinutes?: number | null;
}

export interface CommunicationRepairAuthorizationResult {
  outcome: "authorized" | "blocked_existing_chain";
  authorization: CommunicationRepairAuthorizationSnapshot | null;
  bindingBundle: CommunicationRepairBindingBundle;
  reasonCode: string;
}

export interface Phase3CommunicationRepairApplication {
  readonly serviceName: typeof PHASE3_COMMUNICATION_REPAIR_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_COMMUNICATION_REPAIR_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_COMMUNICATION_REPAIR_QUERY_SURFACES;
  readonly routes: typeof phase3CommunicationRepairRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly directResolutionApplication: Phase3DirectResolutionApplication;
  readonly replayApplication: ReplayCollisionApplication;
  readonly callbackApplication: Phase3CallbackDomainApplication;
  readonly clinicianMessageApplication: Phase3ClinicianMessageDomainApplication;
  readonly identityAccessApplication: IdentityAccessApplication;
  readonly repositories: CommunicationRepairRepositories;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskCommunicationRepair(taskId: string): Promise<Phase3CommunicationRepairTaskBundle>;
  recordCallbackReachability(
    input: RecordCallbackReachabilityObservationInput,
  ): Promise<CommunicationRepairBindingBundle>;
  recordMessageReachability(
    input: RecordMessageReachabilityObservationInput,
  ): Promise<CommunicationRepairBindingBundle>;
  attachCandidateRoute(
    input: AttachCommunicationRepairCandidateRouteInput,
  ): Promise<CommunicationRepairBindingBundle>;
  issueVerificationCheckpoint(
    input: IssueCommunicationRepairVerificationInput,
  ): Promise<CommunicationRepairBindingBundle>;
  settleVerificationCheckpoint(
    input: SettleCommunicationRepairVerificationInput,
  ): Promise<CommunicationRepairBindingBundle>;
  authorizeMessageRepairAction(
    input: AuthorizeMessageRepairActionInput,
  ): Promise<CommunicationRepairAuthorizationResult>;
  authorizeCallbackReschedule(
    input: AuthorizeCallbackRescheduleInput,
  ): Promise<CommunicationRepairAuthorizationResult>;
}

type CommunicationPromiseBundle =
  | {
      kind: "callback_case";
      taskId: string;
      objectRef: string;
      routeRef: string;
      episodeRef: string;
      requestId: string;
      requestLineageRef: string;
      selectedAnchorRef: string;
      recoveryRouteRef: string;
      reachabilityDomain: ReachabilityDomain;
      purpose: ReachabilityPurpose;
      blockedActionScopeRefs: readonly AccessGrantActionScope[];
    }
  | {
      kind: "clinician_message_thread";
      taskId: string;
      objectRef: string;
      routeRef: string;
      episodeRef: string;
      requestId: string;
      requestLineageRef: string;
      selectedAnchorRef: string;
      recoveryRouteRef: string;
      reachabilityDomain: ReachabilityDomain;
      purpose: ReachabilityPurpose;
      blockedActionScopeRefs: readonly AccessGrantActionScope[];
    };

class Phase3CommunicationRepairApplicationImpl
  implements Phase3CommunicationRepairApplication
{
  readonly serviceName = PHASE3_COMMUNICATION_REPAIR_SERVICE_NAME;
  readonly schemaVersion = PHASE3_COMMUNICATION_REPAIR_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_COMMUNICATION_REPAIR_QUERY_SURFACES;
  readonly routes = phase3CommunicationRepairRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly directResolutionApplication: Phase3DirectResolutionApplication;
  readonly replayApplication: ReplayCollisionApplication;
  readonly callbackApplication: Phase3CallbackDomainApplication;
  readonly clinicianMessageApplication: Phase3ClinicianMessageDomainApplication;
  readonly identityAccessApplication: IdentityAccessApplication;
  readonly repositories: CommunicationRepairRepositories;
  readonly persistenceTables = phase3CommunicationRepairPersistenceTables;
  readonly migrationPlanRef = phase3CommunicationRepairMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3CommunicationRepairMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;
  private authorizationBarrier: Promise<void> = Promise.resolve();

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    directResolutionApplication?: Phase3DirectResolutionApplication;
    replayApplication?: ReplayCollisionApplication;
    callbackApplication?: Phase3CallbackDomainApplication;
    clinicianMessageApplication?: Phase3ClinicianMessageDomainApplication;
    identityAccessApplication?: IdentityAccessApplication;
    repositories?: CommunicationRepairRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_communication_repair");
    this.triageApplication =
      options?.triageApplication ?? createPhase3TriageKernelApplication();
    this.directResolutionApplication =
      options?.directResolutionApplication ??
      createPhase3DirectResolutionApplication({
        triageApplication: this.triageApplication,
      });
    this.replayApplication =
      options?.replayApplication ?? createReplayCollisionApplication();
    this.callbackApplication =
      options?.callbackApplication ??
      createPhase3CallbackDomainApplication({
        triageApplication: this.triageApplication,
        directResolutionApplication: this.directResolutionApplication,
        replayApplication: this.replayApplication,
      });
    this.clinicianMessageApplication =
      options?.clinicianMessageApplication ??
      createPhase3ClinicianMessageDomainApplication({
        triageApplication: this.triageApplication,
        directResolutionApplication: this.directResolutionApplication,
        replayApplication: this.replayApplication,
      });
    this.identityAccessApplication =
      options?.identityAccessApplication ??
      createIdentityAccessApplication({
        repositories: createIdentityRepairStore(),
        idGenerator: this.idGenerator,
      });
    this.repositories = options?.repositories ?? createPhase3CommunicationRepairStore();
  }

  async queryTaskCommunicationRepair(taskId: string): Promise<Phase3CommunicationRepairTaskBundle> {
    const bindings = await this.repositories.listBindingsForTask(taskId);
    let callbackRepair: CommunicationRepairBindingBundle | null = null;
    let messageRepair: CommunicationRepairBindingBundle | null = null;
    for (const binding of bindings) {
      const bundle = await this.materializeBindingBundle(binding);
      if (binding.communicationDomain === CALLBACK_DOMAIN) {
        callbackRepair = bundle;
      } else {
        messageRepair = bundle;
      }
    }
    return {
      taskId,
      callbackRepair,
      messageRepair,
    };
  }

  async recordCallbackReachability(
    input: RecordCallbackReachabilityObservationInput,
  ): Promise<CommunicationRepairBindingBundle> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const callbackBundle = await this.requireCallbackBundle(input.taskId, input.callbackCaseId);
    const promiseBundle = this.callbackPromiseBundle(callbackBundle);
    const binding = await this.ensureBinding(promiseBundle, recordedAt);

    if (
      callbackBundle.callbackCase.state === "awaiting_outcome_evidence" ||
      callbackBundle.callbackCase.state === "attempt_in_progress"
    ) {
      await this.callbackApplication.recordOutcomeEvidence({
        taskId: input.taskId,
        callbackCaseId: input.callbackCaseId,
        actorRef: input.actorRef,
        recordedAt,
        outcome: input.outcome,
        routeEvidenceRef: input.routeEvidenceRef,
        providerDispositionRef: optionalRef(input.providerDispositionRef),
        patientAcknowledgementRef: optionalRef(input.patientAcknowledgementRef),
        safetyClassification: input.safetyClassification,
        safetyPreemptionState: input.safetyPreemptionState,
        pathwayRef: input.pathwayRef,
        tenantPolicyRef: optionalRef(input.tenantPolicyRef),
        explicitPermissionState: input.explicitPermissionState,
        containsClinicalContent: input.containsClinicalContent,
        verifiedTargetState: input.verifiedTargetState,
        voicemailEvidenceRefs: input.voicemailEvidenceRefs ?? [],
        reachabilityDependencyRef: binding.reachabilityDependencyRef,
      });
    }

    const observation = this.resolveCallbackObservation(input);
    const recordedObservation = await this.identityAccessApplication.reachabilityGovernor.recordObservation({
      reachabilityDependencyRef: binding.reachabilityDependencyRef,
      observationClass: observation.observationClass,
      observationSourceRef:
        optionalRef(input.observationSourceRef) ??
        `callback_case:${input.callbackCaseId}:${input.outcome}`,
      observedAt: recordedAt,
      recordedAt,
      outcomePolarity: observation.outcomePolarity,
      authorityWeight: observation.authorityWeight,
      evidenceRef:
        optionalRef(input.evidenceRef) ??
        `${input.callbackCaseId}:${input.outcome}:${input.routeEvidenceRef}`,
    });
    const refreshed = await this.identityAccessApplication.reachabilityGovernor.refreshDependencyAssessment({
      reachabilityDependencyRef: binding.reachabilityDependencyRef,
      assessedAt: recordedAt,
    });

    const bundleAfterRefresh = await this.syncBindingAfterAssessment({
      binding,
      dependency: refreshed.dependency.toSnapshot(),
      assessment: refreshed.assessment.toSnapshot(),
      observationId: recordedObservation.reachabilityObservationId,
      recordedAt,
    });

    const shouldRepair = await this.shouldOpenRepairJourney({
      binding: bundleAfterRefresh.binding,
      dependency: bundleAfterRefresh.dependency,
      assessment: bundleAfterRefresh.assessment,
      triggeringObservationClass: observation.observationClass,
    });
    if (!shouldRepair) {
      return bundleAfterRefresh;
    }

    const repairResult = await this.identityAccessApplication.reachabilityGovernor.openRepairJourney({
      reachabilityDependencyRef: binding.reachabilityDependencyRef,
      issuedAt: recordedAt,
    });
    const withRepair = await this.syncBindingAfterAssessment({
      binding: bundleAfterRefresh.binding,
      dependency: repairResult.dependency.toSnapshot(),
      assessment: refreshed.assessment.toSnapshot(),
      activeRepairJourneyRef: repairResult.journey.repairJourneyId,
      observationId: recordedObservation.reachabilityObservationId,
      recordedAt,
    });
    await this.ensureRepairEntryGrant(withRepair.binding, recordedAt);
    await this.callbackApplication.settleResolutionGate({
      taskId: input.taskId,
      callbackCaseId: input.callbackCaseId,
      actorRef: input.actorRef,
      recordedAt,
      routeAuthorityState: "repair_required",
      explicitDecision: "retry",
    });
    return this.requireBindingBundle(withRepair.binding.bindingId);
  }

  async recordMessageReachability(
    input: RecordMessageReachabilityObservationInput,
  ): Promise<CommunicationRepairBindingBundle> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const messageBundle = await this.requireMessageBundle(input.taskId, input.threadId);
    const promiseBundle = this.messagePromiseBundle(messageBundle);
    const binding = await this.ensureBinding(promiseBundle, recordedAt);

    if (messageBundle.messageThread.state !== "contact_route_repair_pending") {
      await this.clinicianMessageApplication.recordDeliveryEvidence({
        taskId: input.taskId,
        threadId: input.threadId,
        actorRef: input.actorRef,
        recordedAt,
        deliveryState: input.deliveryState,
        evidenceStrength: input.evidenceStrength,
        providerDispositionRef: input.providerDispositionRef,
        deliveryArtifactRefs: input.deliveryArtifactRefs,
        reachabilityDependencyRef: binding.reachabilityDependencyRef,
      });
    }

    const observation = this.resolveMessageObservation(input);
    const recordedObservation = await this.identityAccessApplication.reachabilityGovernor.recordObservation({
      reachabilityDependencyRef: binding.reachabilityDependencyRef,
      observationClass: observation.observationClass,
      observationSourceRef:
        optionalRef(input.observationSourceRef) ??
        `message_thread:${input.threadId}:${input.deliveryState}`,
      observedAt: recordedAt,
      recordedAt,
      outcomePolarity: observation.outcomePolarity,
      authorityWeight: observation.authorityWeight,
      evidenceRef:
        optionalRef(input.evidenceRef) ??
        `${input.threadId}:${input.deliveryState}:${input.providerDispositionRef}`,
    });
    const refreshed = await this.identityAccessApplication.reachabilityGovernor.refreshDependencyAssessment({
      reachabilityDependencyRef: binding.reachabilityDependencyRef,
      assessedAt: recordedAt,
    });

    const bundleAfterRefresh = await this.syncBindingAfterAssessment({
      binding,
      dependency: refreshed.dependency.toSnapshot(),
      assessment: refreshed.assessment.toSnapshot(),
      observationId: recordedObservation.reachabilityObservationId,
      recordedAt,
    });

    const shouldRepair = await this.shouldOpenRepairJourney({
      binding: bundleAfterRefresh.binding,
      dependency: bundleAfterRefresh.dependency,
      assessment: bundleAfterRefresh.assessment,
      triggeringObservationClass: observation.observationClass,
    });
    if (!shouldRepair) {
      return bundleAfterRefresh;
    }

    const repairResult = await this.identityAccessApplication.reachabilityGovernor.openRepairJourney({
      reachabilityDependencyRef: binding.reachabilityDependencyRef,
      issuedAt: recordedAt,
    });
    const withRepair = await this.syncBindingAfterAssessment({
      binding: bundleAfterRefresh.binding,
      dependency: repairResult.dependency.toSnapshot(),
      assessment: refreshed.assessment.toSnapshot(),
      activeRepairJourneyRef: repairResult.journey.repairJourneyId,
      observationId: recordedObservation.reachabilityObservationId,
      recordedAt,
    });
    await this.ensureRepairEntryGrant(withRepair.binding, recordedAt);
    await this.clinicianMessageApplication.settleResolutionGate({
      taskId: input.taskId,
      threadId: input.threadId,
      actorRef: input.actorRef,
      recordedAt,
      explicitDecision: "repair_route",
      decisionReasonRef: refreshed.assessment.toSnapshot().dominantReasonCode,
      sameShellRecoveryRef: withRepair.binding.recoveryRouteRef,
    });
    return this.requireBindingBundle(withRepair.binding.bindingId);
  }

  async attachCandidateRoute(
    input: AttachCommunicationRepairCandidateRouteInput,
  ): Promise<CommunicationRepairBindingBundle> {
    const bindingBundle = await this.requireBindingBundle(input.bindingId);
    invariant(
      bindingBundle.binding.taskId === input.taskId,
      "COMMUNICATION_REPAIR_TASK_MISMATCH",
      `Binding ${input.bindingId} does not belong to task ${input.taskId}.`,
    );
    invariant(
      bindingBundle.binding.activeRepairJourneyRef,
      "REPAIR_JOURNEY_REQUIRED",
      "A live repair journey is required before a candidate route can attach.",
    );
    const createdAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const snapshot = await this.identityAccessApplication.reachabilityGovernor.freezeContactRouteSnapshot({
      subjectRef: input.subjectRef,
      routeRef: input.routeRef,
      routeVersionRef: input.routeVersionRef,
      routeKind: input.routeKind,
      normalizedAddressRef: input.normalizedAddressRef,
      preferenceProfileRef: input.preferenceProfileRef,
      verificationState: input.verificationState,
      demographicFreshnessState: input.demographicFreshnessState,
      preferenceFreshnessState: input.preferenceFreshnessState,
      sourceAuthorityClass: input.sourceAuthorityClass,
      createdAt,
    });
    await this.identityAccessApplication.reachabilityGovernor.attachCandidateSnapshot({
      repairJourneyRef: requireRef(
        bindingBundle.binding.activeRepairJourneyRef,
        "binding.activeRepairJourneyRef",
      ),
      contactRouteSnapshotRef: snapshot.snapshot.contactRouteSnapshotId,
      updatedAt: createdAt,
    });
    return this.requireBindingBundle(input.bindingId);
  }

  async issueVerificationCheckpoint(
    input: IssueCommunicationRepairVerificationInput,
  ): Promise<CommunicationRepairBindingBundle> {
    const bindingBundle = await this.requireBindingBundle(input.bindingId);
    invariant(
      bindingBundle.binding.taskId === input.taskId,
      "COMMUNICATION_REPAIR_TASK_MISMATCH",
      `Binding ${input.bindingId} does not belong to task ${input.taskId}.`,
    );
    const checkpoint = await this.identityAccessApplication.reachabilityGovernor.issueVerificationCheckpoint({
      repairJourneyRef: requireRef(
        bindingBundle.binding.activeRepairJourneyRef,
        "binding.activeRepairJourneyRef",
      ),
      contactRouteRef: input.contactRouteRef,
      contactRouteVersionRef: input.contactRouteVersionRef,
      verificationMethod: input.verificationMethod,
      dependentGrantRefs: bindingBundle.binding.activeRepairEntryGrantRef
        ? [bindingBundle.binding.activeRepairEntryGrantRef]
        : [],
      evaluatedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    });
    const updatedBinding: CommunicationRepairBindingSnapshot = {
      ...bindingBundle.binding,
      activeVerificationCheckpointRef: checkpoint.checkpointId,
      bindingState: "awaiting_verification",
      updatedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      version: nextVersion(bindingBundle.binding.version),
    };
    await this.repositories.saveBinding(updatedBinding, {
      expectedVersion: bindingBundle.binding.version,
    });
    return this.requireBindingBundle(input.bindingId);
  }

  async settleVerificationCheckpoint(
    input: SettleCommunicationRepairVerificationInput,
  ): Promise<CommunicationRepairBindingBundle> {
    const bindingBundle = await this.requireBindingBundle(input.bindingId);
    invariant(
      bindingBundle.binding.taskId === input.taskId,
      "COMMUNICATION_REPAIR_TASK_MISMATCH",
      `Binding ${input.bindingId} does not belong to task ${input.taskId}.`,
    );
    const settled =
      await this.identityAccessApplication.reachabilityGovernor.settleVerificationCheckpoint({
        checkpointId: input.checkpointId,
        verificationState: input.verificationState,
        evaluatedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      });
    let reboundRecordId: string | null = null;
    if (settled.checkpoint.toSnapshot().rebindState === "rebound" && settled.resultingSnapshot) {
      const reboundRecord: CommunicationRepairReboundRecordSnapshot = {
        reboundRecordId: nextApplicationId(this.idGenerator, "communication_rebound_record"),
        bindingRef: bindingBundle.binding.bindingId,
        taskId: bindingBundle.binding.taskId,
        communicationDomain: bindingBundle.binding.communicationDomain,
        communicationObjectRef: bindingBundle.binding.communicationObjectRef,
        reachabilityDependencyRef: bindingBundle.binding.reachabilityDependencyRef,
        repairJourneyRef: settled.journey.repairJourneyId,
        verificationCheckpointRef: settled.checkpoint.checkpointId,
        resultingContactRouteSnapshotRef: settled.resultingSnapshot.contactRouteSnapshotId,
        resultingReachabilityAssessmentRef: settled.assessment.reachabilityAssessmentId,
        resultingReachabilityEpoch: settled.assessment.toSnapshot().resultingReachabilityEpoch,
        reboundState: "rebound",
        recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
        version: 1,
      };
      await this.repositories.saveReboundRecord(reboundRecord);
      reboundRecordId = reboundRecord.reboundRecordId;
    }
    const updated = await this.syncBindingAfterAssessment({
      binding: bindingBundle.binding,
      dependency: settled.dependency.toSnapshot(),
      assessment: settled.assessment.toSnapshot(),
      activeRepairJourneyRef: settled.dependency.toSnapshot().repairJourneyRef,
      activeVerificationCheckpointRef:
        settled.checkpoint.toSnapshot().rebindState === "pending"
          ? settled.checkpoint.checkpointId
          : null,
      reboundRecordId,
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    });
    if (settled.checkpoint.toSnapshot().rebindState === "rebound") {
      await this.revokeRepairGrantIfPresent(updated.binding, input.recordedAt);
      const revokedBinding: CommunicationRepairBindingSnapshot = {
        ...updated.binding,
        activeRepairEntryGrantRef: null,
        updatedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
        version: nextVersion(updated.binding.version),
      };
      await this.repositories.saveBinding(revokedBinding, {
        expectedVersion: updated.binding.version,
      });
    }
    return this.requireBindingBundle(input.bindingId);
  }

  async authorizeMessageRepairAction(
    input: AuthorizeMessageRepairActionInput,
  ): Promise<CommunicationRepairAuthorizationResult> {
    return this.withAuthorizationBarrier(async () => {
      const messageBundle = await this.requireMessageBundle(input.taskId, input.threadId);
      const binding = await this.requireBindingByObject(MESSAGE_DOMAIN, input.threadId);
      const bindingBundle = await this.requireBindingBundle(binding.bindingId);
      if (
        !(
          bindingBundle.assessment.assessmentState === "clear" &&
          bindingBundle.assessment.routeAuthorityState === "current" &&
          bindingBundle.dependency.repairState === "none" &&
          bindingBundle.binding.activeRepairJourneyRef === null
        )
      ) {
        return {
          outcome: "blocked_existing_chain",
          authorization: null,
          bindingBundle,
          reasonCode: "MESSAGE_245_REPAIR_CHAIN_NOT_CLEAR",
        };
      }

      const gateDecision = messageBundle.currentResolutionGate?.decision ?? null;
      const evidenceState = messageBundle.currentDeliveryEvidenceBundle?.deliveryState ?? null;
      const gateRef = messageBundle.currentResolutionGate?.threadResolutionGateId ?? null;
      const evidenceRef =
        messageBundle.currentDeliveryEvidenceBundle?.messageDeliveryEvidenceBundleId ?? null;
      const allowedByGate =
        gateDecision === "repair_route" ||
        gateDecision === "reopen" ||
        evidenceState === "failed" ||
        evidenceState === "disputed" ||
        evidenceState === "expired";
      if (!allowedByGate) {
        return {
          outcome: "blocked_existing_chain",
          authorization: null,
          bindingBundle,
          reasonCode: "MESSAGE_245_EXISTING_CHAIN_STILL_PROVISIONAL",
        };
      }

      const existing = await this.findReusableAuthorization({
        binding: bindingBundle.binding,
        authorizationKind: input.authorizationKind,
        reachabilityEpoch: bindingBundle.binding.currentReachabilityEpoch,
        governingGateRef: gateRef,
      });
      if (existing) {
        return {
          outcome: "authorized",
          authorization: existing,
          bindingBundle,
          reasonCode: existing.reasonCode,
        };
      }

      const authorization = await this.issueAuthorization({
        binding: bindingBundle.binding,
        authorizationKind: input.authorizationKind,
        governingGateRef: gateRef,
        governingGateDecision: gateDecision,
        governingEvidenceRef: evidenceRef,
        reasonCode: "MESSAGE_245_CONTROLLED_REPAIR_ACTION_AUTHORIZED",
        recordedAt: input.recordedAt,
        expiresInMinutes: input.expiresInMinutes ?? 30,
      });
      return {
        outcome: "authorized",
        authorization,
        bindingBundle: await this.requireBindingBundle(binding.bindingId),
        reasonCode: authorization.reasonCode,
      };
    });
  }

  async authorizeCallbackReschedule(
    input: AuthorizeCallbackRescheduleInput,
  ): Promise<CommunicationRepairAuthorizationResult> {
    return this.withAuthorizationBarrier(async () => {
      const callbackBundle = await this.requireCallbackBundle(input.taskId, input.callbackCaseId);
      const binding = await this.requireBindingByObject(CALLBACK_DOMAIN, input.callbackCaseId);
      const bindingBundle = await this.requireBindingBundle(binding.bindingId);
      if (
        !(
          bindingBundle.assessment.assessmentState === "clear" &&
          bindingBundle.assessment.routeAuthorityState === "current" &&
          bindingBundle.dependency.repairState === "none" &&
          bindingBundle.binding.activeRepairJourneyRef === null
        )
      ) {
        return {
          outcome: "blocked_existing_chain",
          authorization: null,
          bindingBundle,
          reasonCode: "CALLBACK_245_REPAIR_CHAIN_NOT_CLEAR",
        };
      }

      const gateDecision = callbackBundle.currentResolutionGate?.decision ?? null;
      const evidenceOutcome = callbackBundle.latestOutcomeEvidenceBundle?.outcome ?? null;
      const allowedByGate =
        gateDecision === "retry" ||
        evidenceOutcome === "route_invalid" ||
        evidenceOutcome === "no_answer";
      if (!allowedByGate) {
        return {
          outcome: "blocked_existing_chain",
          authorization: null,
          bindingBundle,
          reasonCode: "CALLBACK_245_EXISTING_CHAIN_STILL_PROVISIONAL",
        };
      }

      const gateRef = callbackBundle.currentResolutionGate?.callbackResolutionGateId ?? null;
      const evidenceRef =
        callbackBundle.latestOutcomeEvidenceBundle?.callbackOutcomeEvidenceBundleId ?? null;
      const existing = await this.findReusableAuthorization({
        binding: bindingBundle.binding,
        authorizationKind: "callback_reschedule",
        reachabilityEpoch: bindingBundle.binding.currentReachabilityEpoch,
        governingGateRef: gateRef,
      });
      if (existing) {
        return {
          outcome: "authorized",
          authorization: existing,
          bindingBundle,
          reasonCode: existing.reasonCode,
        };
      }

      const authorization = await this.issueAuthorization({
        binding: bindingBundle.binding,
        authorizationKind: "callback_reschedule",
        governingGateRef: gateRef,
        governingGateDecision: gateDecision,
        governingEvidenceRef: evidenceRef,
        reasonCode: "CALLBACK_245_RESCHEDULE_AUTHORIZED",
        recordedAt: input.recordedAt,
        expiresInMinutes: input.expiresInMinutes ?? 30,
      });
      return {
        outcome: "authorized",
        authorization,
        bindingBundle: await this.requireBindingBundle(binding.bindingId),
        reasonCode: authorization.reasonCode,
      };
    });
  }

  private async withAuthorizationBarrier<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.authorizationBarrier;
    let release!: () => void;
    this.authorizationBarrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  private resolveCallbackObservation(input: RecordCallbackReachabilityObservationInput): {
    observationClass: ReachabilityObservationClass;
    outcomePolarity: ReachabilityOutcomePolarity;
    authorityWeight: ReachabilityAuthorityWeight;
  } {
    if (input.observationClass) {
      return {
        observationClass: input.observationClass,
        outcomePolarity: this.defaultPolarityForObservation(input.observationClass),
        authorityWeight: input.authorityWeight ?? this.defaultAuthorityWeightForObservation(input.observationClass),
      };
    }
    switch (input.outcome) {
      case "answered":
        return {
          observationClass: "delivery_receipt",
          outcomePolarity: "positive",
          authorityWeight: input.authorityWeight ?? "strong",
        };
      case "no_answer":
        return {
          observationClass: "no_answer",
          outcomePolarity: "negative",
          authorityWeight: input.authorityWeight ?? "moderate",
        };
      case "route_invalid":
        return {
          observationClass: "invalid_route",
          outcomePolarity: "negative",
          authorityWeight: input.authorityWeight ?? "strong",
        };
      case "voicemail_left":
        return {
          observationClass: "delivery_receipt",
          outcomePolarity: "ambiguous",
          authorityWeight: input.authorityWeight ?? "weak",
        };
      case "provider_failure":
        return {
          observationClass: "manual_dispute",
          outcomePolarity: "ambiguous",
          authorityWeight: input.authorityWeight ?? "strong",
        };
    }
  }

  private resolveMessageObservation(input: RecordMessageReachabilityObservationInput): {
    observationClass: ReachabilityObservationClass;
    outcomePolarity: ReachabilityOutcomePolarity;
    authorityWeight: ReachabilityAuthorityWeight;
  } {
    if (input.observationClass) {
      return {
        observationClass: input.observationClass,
        outcomePolarity: this.defaultPolarityForObservation(input.observationClass),
        authorityWeight: input.authorityWeight ?? this.defaultAuthorityWeightForObservation(input.observationClass),
      };
    }
    if (input.deliveryState === "delivered") {
      return {
        observationClass: "delivery_receipt",
        outcomePolarity: "positive",
        authorityWeight: input.authorityWeight ?? "strong",
      };
    }
    if (input.deliveryState === "disputed") {
      return {
        observationClass: "manual_dispute",
        outcomePolarity: "ambiguous",
        authorityWeight: input.authorityWeight ?? "strong",
      };
    }
    if (/bounce/i.test(input.providerDispositionRef)) {
      return {
        observationClass: "bounce",
        outcomePolarity: "negative",
        authorityWeight: input.authorityWeight ?? "strong",
      };
    }
    if (/invalid/i.test(input.providerDispositionRef)) {
      return {
        observationClass: "invalid_route",
        outcomePolarity: "negative",
        authorityWeight: input.authorityWeight ?? "strong",
      };
    }
    if (/opt[_ -]?out/i.test(input.providerDispositionRef)) {
      return {
        observationClass: "opt_out",
        outcomePolarity: "negative",
        authorityWeight: input.authorityWeight ?? "strong",
      };
    }
    return {
      observationClass: "delivery_receipt",
      outcomePolarity: "negative",
      authorityWeight: input.authorityWeight ?? "moderate",
    };
  }

  private defaultPolarityForObservation(
    observationClass: ReachabilityObservationClass,
  ): ReachabilityOutcomePolarity {
    switch (observationClass) {
      case "delivery_receipt":
      case "verification_success":
      case "manual_confirmed_reachable":
      case "transport_ack":
        return "positive";
      case "manual_dispute":
        return "ambiguous";
      default:
        return "negative";
    }
  }

  private defaultAuthorityWeightForObservation(
    observationClass: ReachabilityObservationClass,
  ): ReachabilityAuthorityWeight {
    switch (observationClass) {
      case "transport_ack":
        return "weak";
      case "no_answer":
      case "preference_change":
      case "demographic_change":
      case "delivery_receipt":
        return "moderate";
      default:
        return "strong";
    }
  }

  private async shouldOpenRepairJourney(input: {
    binding: CommunicationRepairBindingSnapshot;
    dependency: ReachabilityDependency;
    assessment: ReachabilityAssessmentRecord;
    triggeringObservationClass: ReachabilityObservationClass;
  }): Promise<boolean> {
    if (input.binding.activeRepairJourneyRef) {
      return true;
    }
    if (
      input.triggeringObservationClass === "transport_ack" ||
      (input.triggeringObservationClass === "delivery_receipt" &&
        input.assessment.assessmentState !== "disputed")
    ) {
      return false;
    }
    if (input.triggeringObservationClass === "no_answer") {
      const observations =
        await this.identityAccessApplication.repositories.listReachabilityObservationsForDependency(
          input.binding.reachabilityDependencyRef,
        );
      const noAnswerCount = observations.filter(
        (observation) => observation.toSnapshot().observationClass === "no_answer",
      ).length;
      return noAnswerCount >= 2 || input.assessment.assessmentState === "blocked";
    }
    return input.assessment.assessmentState !== "clear";
  }

  private bindingStateFromAssessment(
    dependency: ReachabilityDependency,
    assessment: ReachabilityAssessmentRecord,
  ): CommunicationRepairBindingState {
    if (dependency.repairState === "rebound_pending" || assessment.resultingRepairState === "rebound_pending") {
      return "rebound_pending";
    }
    if (assessment.resultingRepairState === "awaiting_verification") {
      return "awaiting_verification";
    }
    if (assessment.resultingRepairState === "repair_required" || dependency.repairJourneyRef) {
      return "repair_required";
    }
    if (assessment.assessmentState === "clear") {
      return "clear";
    }
    return "monitoring";
  }

  private async syncBindingAfterAssessment(input: {
    binding: CommunicationRepairBindingSnapshot;
    dependency: ReachabilityDependency;
    assessment: ReachabilityAssessmentRecord;
    recordedAt: string;
    activeRepairJourneyRef?: string | null;
    activeVerificationCheckpointRef?: string | null;
    observationId?: string | null;
    reboundRecordId?: string | null;
  }): Promise<CommunicationRepairBindingBundle> {
    const nextBinding: CommunicationRepairBindingSnapshot = {
      ...input.binding,
      currentContactRouteSnapshotRef: input.dependency.currentContactRouteSnapshotRef,
      currentReachabilityAssessmentRef: input.dependency.currentReachabilityAssessmentRef,
      currentReachabilityEpoch: input.dependency.reachabilityEpoch,
      activeRepairJourneyRef:
        input.activeRepairJourneyRef !== undefined
          ? input.activeRepairJourneyRef
          : input.dependency.repairJourneyRef,
      activeVerificationCheckpointRef:
        input.activeVerificationCheckpointRef !== undefined
          ? input.activeVerificationCheckpointRef
          : input.binding.activeVerificationCheckpointRef,
      lastCommunicationObservationRef:
        input.observationId !== undefined ? input.observationId : input.binding.lastCommunicationObservationRef,
      lastReboundRecordRef:
        input.reboundRecordId !== undefined ? input.reboundRecordId : input.binding.lastReboundRecordRef,
      bindingState: this.bindingStateFromAssessment(input.dependency, input.assessment),
      updatedAt: input.recordedAt,
      version: nextVersion(input.binding.version),
    };
    await this.repositories.saveBinding(nextBinding, {
      expectedVersion: input.binding.version,
    });
    return this.requireBindingBundle(nextBinding.bindingId);
  }

  private async ensureBinding(
    promiseBundle: CommunicationPromiseBundle,
    recordedAt: string,
  ): Promise<CommunicationRepairBindingSnapshot> {
    const current = await this.repositories.getBindingByObject(
      promiseBundle.kind,
      promiseBundle.objectRef,
    );
    if (current) {
      return current;
    }

    const dependencyResult = await this.identityAccessApplication.reachabilityGovernor.createDependency({
      episodeId: promiseBundle.episodeRef,
      requestId: promiseBundle.requestId,
      domain: promiseBundle.reachabilityDomain,
      domainObjectRef: promiseBundle.objectRef,
      requiredRouteRef: promiseBundle.routeRef,
      purpose: promiseBundle.purpose,
      blockedActionScopeRefs: promiseBundle.blockedActionScopeRefs,
      selectedAnchorRef: promiseBundle.selectedAnchorRef,
      requestReturnBundleRef: `request_return_bundle_${promiseBundle.objectRef}`,
      resumeContinuationRef: promiseBundle.recoveryRouteRef,
      deadlineAt: addMinutes(recordedAt, 1440),
      failureEffect: "invalidate_pending_action",
      assessedAt: recordedAt,
    });
    const binding: CommunicationRepairBindingSnapshot = {
      bindingId: nextApplicationId(this.idGenerator, "communication_repair_binding"),
      taskId: promiseBundle.taskId,
      communicationDomain: promiseBundle.kind,
      communicationObjectRef: promiseBundle.objectRef,
      episodeRef: promiseBundle.episodeRef,
      requestId: promiseBundle.requestId,
      requestLineageRef: promiseBundle.requestLineageRef,
      contactRouteRef: promiseBundle.routeRef,
      reachabilityDependencyRef: dependencyResult.dependency.dependencyId,
      currentContactRouteSnapshotRef: dependencyResult.dependency.currentContactRouteSnapshotRef,
      currentReachabilityAssessmentRef:
        dependencyResult.assessment.reachabilityAssessmentId,
      currentReachabilityEpoch: dependencyResult.dependency.toSnapshot().reachabilityEpoch,
      activeRepairJourneyRef: null,
      activeRepairEntryGrantRef: null,
      activeVerificationCheckpointRef: null,
      lastCommunicationObservationRef: null,
      lastAuthorizationRef: null,
      lastReboundRecordRef: null,
      bindingState: this.bindingStateFromAssessment(
        dependencyResult.dependency.toSnapshot(),
        dependencyResult.assessment.toSnapshot(),
      ),
      selectedAnchorRef: promiseBundle.selectedAnchorRef,
      recoveryRouteRef: promiseBundle.recoveryRouteRef,
      createdAt: recordedAt,
      updatedAt: recordedAt,
      version: 1,
    };
    await this.repositories.saveBinding(binding);
    return binding;
  }

  private async ensureRepairEntryGrant(
    binding: CommunicationRepairBindingSnapshot,
    recordedAt: string,
  ): Promise<void> {
    if (binding.activeRepairEntryGrantRef) {
      return;
    }
    const issued = await createAccessGrantService(
      this.identityAccessApplication.repositories,
      this.idGenerator,
    ).issueGrant({
      grantFamily: "transaction_action_minimal",
      actionScope: "contact_route_repair",
      lineageScope: "request",
      routeFamilyRef:
        binding.communicationDomain === CALLBACK_DOMAIN
          ? "staff_workspace_callback_contact_repair"
          : "staff_workspace_message_contact_repair",
      governingObjectRef: binding.reachabilityDependencyRef,
      governingVersionRef: `${binding.reachabilityDependencyRef}@repair`,
      phiExposureClass: "minimal",
      recoveryRouteRef: binding.recoveryRouteRef,
      subjectBindingMode: "hard_subject",
      tokenKeyVersionRef: "token_key_local_v1",
      issuedLineageFenceEpoch: binding.currentReachabilityEpoch,
      presentedToken: "",
      expiresAt: addMinutes(recordedAt, 30),
      createdAt: recordedAt,
    });
    const nextBinding: CommunicationRepairBindingSnapshot = {
      ...binding,
      activeRepairEntryGrantRef: issued.grant.grantId,
      updatedAt: recordedAt,
      version: nextVersion(binding.version),
    };
    await this.repositories.saveBinding(nextBinding, {
      expectedVersion: binding.version,
    });
  }

  private async revokeRepairGrantIfPresent(
    binding: CommunicationRepairBindingSnapshot,
    recordedAt: string,
  ): Promise<void> {
    if (!binding.activeRepairEntryGrantRef) {
      return;
    }
    try {
      await createAccessGrantService(this.identityAccessApplication.repositories, this.idGenerator).revokeGrant({
        grantRef: binding.activeRepairEntryGrantRef,
        governingObjectRef: binding.reachabilityDependencyRef,
        lineageFenceEpoch: binding.currentReachabilityEpoch,
        reasonCodes: ["COMMUNICATION_REPAIR_REBOUND_COMPLETE"],
        recordedAt: ensureIsoTimestamp(recordedAt, "recordedAt"),
      });
    } catch {
      // Replay-safe revocation remains best-effort because duplicate settle flows may revisit the
      // same rebound after the grant was already rotated or revoked.
    }
  }

  private async issueAuthorization(input: {
    binding: CommunicationRepairBindingSnapshot;
    authorizationKind: CommunicationRepairAuthorizationKind;
    governingGateRef: string | null;
    governingGateDecision: string | null;
    governingEvidenceRef: string | null;
    reasonCode: string;
    recordedAt: string;
    expiresInMinutes: number;
  }): Promise<CommunicationRepairAuthorizationSnapshot> {
    const existingActive = await this.findActiveAuthorization(input.binding.bindingId);
    if (existingActive) {
      const superseded: CommunicationRepairAuthorizationSnapshot = {
        ...existingActive,
        authorizationState: "superseded",
        updatedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
        version: nextVersion(existingActive.version),
      };
      await this.repositories.saveAuthorization(superseded, {
        expectedVersion: existingActive.version,
      });
    }
    const authorization: CommunicationRepairAuthorizationSnapshot = {
      authorizationId: nextApplicationId(this.idGenerator, "communication_repair_authorization"),
      bindingRef: input.binding.bindingId,
      taskId: input.binding.taskId,
      communicationDomain: input.binding.communicationDomain,
      communicationObjectRef: input.binding.communicationObjectRef,
      authorizationKind: input.authorizationKind,
      repairJourneyRef: input.binding.activeRepairJourneyRef,
      governingGateRef: input.governingGateRef,
      governingGateDecision: input.governingGateDecision,
      governingEvidenceRef: input.governingEvidenceRef,
      reachabilityEpoch: input.binding.currentReachabilityEpoch,
      repairEntryGrantRef: input.binding.activeRepairEntryGrantRef,
      authorizationState: "authorized",
      sameShellRecoveryRef: input.binding.recoveryRouteRef,
      reasonCode: input.reasonCode,
      createdAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      expiresAt: addMinutes(ensureIsoTimestamp(input.recordedAt, "recordedAt"), input.expiresInMinutes),
      updatedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      version: 1,
    };
    await this.repositories.saveAuthorization(authorization);
    const updatedBinding: CommunicationRepairBindingSnapshot = {
      ...input.binding,
      lastAuthorizationRef: authorization.authorizationId,
      updatedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      version: nextVersion(input.binding.version),
    };
    await this.repositories.saveBinding(updatedBinding, {
      expectedVersion: input.binding.version,
    });
    return authorization;
  }

  private async findReusableAuthorization(input: {
    binding: CommunicationRepairBindingSnapshot;
    authorizationKind: CommunicationRepairAuthorizationKind;
    reachabilityEpoch: number;
    governingGateRef: string | null;
  }): Promise<CommunicationRepairAuthorizationSnapshot | null> {
    const authorizations = await this.repositories.listAuthorizationsForBinding(input.binding.bindingId);
    return (
      authorizations.find(
        (authorization) =>
          authorization.authorizationState === "authorized" &&
          authorization.authorizationKind === input.authorizationKind &&
          authorization.reachabilityEpoch === input.reachabilityEpoch &&
          authorization.governingGateRef === input.governingGateRef,
      ) ?? null
    );
  }

  private async findActiveAuthorization(
    bindingRef: string,
  ): Promise<CommunicationRepairAuthorizationSnapshot | null> {
    const authorizations = await this.repositories.listAuthorizationsForBinding(bindingRef);
    return authorizations.find((authorization) => authorization.authorizationState === "authorized") ?? null;
  }

  private async requireBindingByObject(
    communicationDomain: CommunicationRepairDomain,
    communicationObjectRef: string,
  ): Promise<CommunicationRepairBindingSnapshot> {
    const binding = await this.repositories.getBindingByObject(
      communicationDomain,
      communicationObjectRef,
    );
    invariant(
      binding,
      "COMMUNICATION_REPAIR_BINDING_NOT_FOUND",
      `Communication repair binding is required for ${communicationDomain} ${communicationObjectRef}.`,
    );
    return binding;
  }

  private async requireBindingBundle(bindingId: string): Promise<CommunicationRepairBindingBundle> {
    const binding = await this.repositories.getBinding(bindingId);
    invariant(binding, "COMMUNICATION_REPAIR_BINDING_NOT_FOUND", `Binding ${bindingId} is required.`);
    return this.materializeBindingBundle(binding);
  }

  private async materializeBindingBundle(
    binding: CommunicationRepairBindingSnapshot,
  ): Promise<CommunicationRepairBindingBundle> {
    const dependency = await this.identityAccessApplication.repositories.getReachabilityDependency(
      binding.reachabilityDependencyRef,
    );
    invariant(
      dependency,
      "REACHABILITY_DEPENDENCY_NOT_FOUND",
      `ReachabilityDependency ${binding.reachabilityDependencyRef} is required.`,
    );
    const assessment = await this.identityAccessApplication.repositories.getReachabilityAssessment(
      binding.currentReachabilityAssessmentRef,
    );
    invariant(
      assessment,
      "REACHABILITY_ASSESSMENT_NOT_FOUND",
      `ReachabilityAssessmentRecord ${binding.currentReachabilityAssessmentRef} is required.`,
    );
    const repairJourney = binding.activeRepairJourneyRef
      ? await this.identityAccessApplication.repositories.getContactRouteRepairJourney(
          binding.activeRepairJourneyRef,
        )
      : undefined;
    const verificationCheckpoint = binding.activeVerificationCheckpointRef
      ? await this.identityAccessApplication.repositories.getContactRouteVerificationCheckpoint(
          binding.activeVerificationCheckpointRef,
        )
      : undefined;
    const activeAuthorization = binding.lastAuthorizationRef
      ? await this.repositories.getAuthorization(binding.lastAuthorizationRef)
      : null;
    const lastReboundRecord = binding.lastReboundRecordRef
      ? await this.repositories.getReboundRecord(binding.lastReboundRecordRef)
      : null;
    return {
      binding,
      dependency: dependency.toSnapshot(),
      assessment: assessment.toSnapshot(),
      repairJourney: repairJourney?.toSnapshot() ?? null,
      verificationCheckpoint: verificationCheckpoint?.toSnapshot() ?? null,
      activeAuthorization:
        activeAuthorization?.authorizationState === "authorized" ? activeAuthorization : null,
      lastReboundRecord,
    };
  }

  private callbackPromiseBundle(
    bundle: Phase3CallbackApplicationBundle,
  ): CommunicationPromiseBundle {
    return {
      kind: CALLBACK_DOMAIN,
      taskId: bundle.task.taskId,
      objectRef: bundle.callbackCase.callbackCaseId,
      routeRef: bundle.callbackCase.contactRouteRef,
      episodeRef: bundle.callbackCase.episodeRef,
      requestId: bundle.callbackCase.requestId,
      requestLineageRef: bundle.callbackCase.requestLineageRef,
      selectedAnchorRef: bundle.task.launchContextRef,
      recoveryRouteRef: `/workspace/tasks/${bundle.task.taskId}/callback/${bundle.callbackCase.callbackCaseId}/repair`,
      reachabilityDomain: "callback",
      purpose: "callback",
      blockedActionScopeRefs: ["callback_status_entry", "callback_response", "contact_route_repair"],
    };
  }

  private messagePromiseBundle(
    bundle: Phase3ClinicianMessageApplicationBundle,
  ): CommunicationPromiseBundle {
    const routeRef =
      bundle.currentDispatchEnvelope?.contactRouteRef ??
      bundle.currentDispatchEnvelope?.routeIntentBindingRef ??
      null;
    invariant(
      routeRef,
      "MESSAGE_CONTACT_ROUTE_REQUIRED",
      "Clinician message repair requires MessageDispatchEnvelope.contactRouteRef.",
    );
    return {
      kind: MESSAGE_DOMAIN,
      taskId: bundle.task.taskId,
      objectRef: bundle.messageThread.threadId,
      routeRef,
      episodeRef: bundle.messageThread.episodeRef,
      requestId: bundle.messageThread.requestId,
      requestLineageRef: bundle.messageThread.requestLineageRef,
      selectedAnchorRef: bundle.task.launchContextRef,
      recoveryRouteRef: `/workspace/tasks/${bundle.task.taskId}/message/${bundle.messageThread.threadId}/repair`,
      reachabilityDomain: "staff",
      purpose: "clinician_message",
      blockedActionScopeRefs: ["message_thread_entry", "message_reply", "contact_route_repair"],
    };
  }

  private async requireCallbackBundle(
    taskId: string,
    callbackCaseId: string,
  ): Promise<Phase3CallbackApplicationBundle> {
    const bundle = await this.callbackApplication.queryTaskCallbackDomain(taskId);
    invariant(bundle, "CALLBACK_CASE_NOT_FOUND", `Task ${taskId} has no current CallbackCase.`);
    invariant(
      bundle.callbackCase.callbackCaseId === callbackCaseId,
      "CALLBACK_CASE_TASK_MISMATCH",
      `CallbackCase ${callbackCaseId} does not belong to task ${taskId}.`,
    );
    return bundle;
  }

  private async requireMessageBundle(
    taskId: string,
    threadId: string,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const bundle = await this.clinicianMessageApplication.queryTaskClinicianMessageDomain(taskId);
    invariant(
      bundle,
      "MESSAGE_THREAD_NOT_FOUND",
      `Task ${taskId} has no current ClinicianMessageThread.`,
    );
    invariant(
      bundle.messageThread.threadId === threadId,
      "MESSAGE_THREAD_TASK_MISMATCH",
      `Thread ${threadId} does not belong to task ${taskId}.`,
    );
    return bundle;
  }
}

export function createPhase3CommunicationReachabilityRepairApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  directResolutionApplication?: Phase3DirectResolutionApplication;
  replayApplication?: ReplayCollisionApplication;
  callbackApplication?: Phase3CallbackDomainApplication;
  clinicianMessageApplication?: Phase3ClinicianMessageDomainApplication;
  identityAccessApplication?: IdentityAccessApplication;
  repositories?: CommunicationRepairRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3CommunicationRepairApplication {
  return new Phase3CommunicationRepairApplicationImpl(options);
}
