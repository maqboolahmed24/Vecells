import { createHmac, timingSafeEqual } from "node:crypto";
import {
  createCommandSettlementAuthorityService,
  createLeaseFenceCommandAuthorityService,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  createPhase3ClinicianMessageKernelService,
  createPhase3ClinicianMessageKernelStore,
  type ClinicianMessageThreadSnapshot,
  type MessageDeliveryEvidenceStrength,
  type MessageDeliveryEvidenceState,
  type MessageDispatchEnvelopeSnapshot,
  type MessagePatientReplySnapshot,
  type MessageReplyClassificationHint,
  type MessageRepairIntent,
  type MessageTransportState,
  type Phase3ClinicianMessageBundle,
  type Phase3ClinicianMessageKernelRepositories,
  type Phase3ClinicianMessageKernelService,
  type ThreadDeliveryRiskState,
  type ThreadExpectationPatientVisibleState,
  type ThreadResolutionDecision,
  type ThreadStateConfidenceBand,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3DirectResolutionApplication,
  phase3DirectResolutionMigrationPlanRefs,
  phase3DirectResolutionPersistenceTables,
  type Phase3DirectResolutionApplication,
} from "./phase3-direct-resolution-handoffs";
import {
  createReplayCollisionApplication,
  replayCollisionMigrationPlanRefs,
  replayCollisionPersistenceTables,
  type ReplayCollisionApplication,
} from "./replay-collision-authority";
import {
  createPhase3TriageKernelApplication,
  phase3TriageKernelMigrationPlanRefs,
  phase3TriageKernelPersistenceTables,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

export const PHASE3_CLINICIAN_MESSAGE_SERVICE_NAME =
  "Phase3ClinicianMessageDomainApplication";
export const PHASE3_CLINICIAN_MESSAGE_SCHEMA_VERSION =
  "244.phase3.clinician-message-domain.v1";
export const PHASE3_CLINICIAN_MESSAGE_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/message-thread",
] as const;

const MESSAGE_DOMAIN = "clinician_message_thread";
const MESSAGE_DESCRIPTOR = "ClinicianMessageThread";
const MESSAGE_LEASE_AUTHORITY_REF = "lease_authority_clinician_message_thread";
const MESSAGE_ADAPTER_CONTRACT_PROFILE_REF = "secure_message_provider_simulator.v1";
const MESSAGE_WEBHOOK_SIGNATURE_POLICY_VERSION = "phase3-message-hmac-sha256-simulator.v1";
const MESSAGE_WEBHOOK_SIGNATURE_HEADER = "x-vecells-message-signature";
const MESSAGE_WEBHOOK_TIMESTAMP_HEADER = "x-vecells-message-timestamp";
const MESSAGE_WEBHOOK_SECRET = "phase3_clinician_message_simulator_secret";

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

function addSeconds(iso: string, seconds: number): string {
  const date = new Date(iso);
  invariant(!Number.isNaN(date.getTime()), "INVALID_BASE_TIMESTAMP", "Base timestamp is invalid.");
  date.setUTCSeconds(date.getUTCSeconds() + seconds);
  return date.toISOString();
}

function nextApplicationId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function headerLookup(headers: Record<string, string>, key: string): string | null {
  const lower = key.toLowerCase();
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === lower) {
      return value;
    }
  }
  return null;
}

function stableTimingCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function canonicalReceiptPayload(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
}

function buildMessageWebhookSignature(timestamp: string, payload: string): string {
  return createHmac("sha256", MESSAGE_WEBHOOK_SECRET).update(`${timestamp}.${payload}`).digest("hex");
}

export const phase3ClinicianMessageRoutes = [
  {
    routeId: "workspace_task_message_thread_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/message-thread",
    contractFamily: "ClinicianMessageThreadBundleContract",
    purpose:
      "Expose the current ClinicianMessageThread, MessageDispatchEnvelope, MessageDeliveryEvidenceBundle, ThreadExpectationEnvelope, ThreadResolutionGate, and latest patient reply for one task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_create_message_thread",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:create-message-thread",
    contractFamily: "CreateClinicianMessageThreadCommandContract",
    purpose:
      "Create the canonical ClinicianMessageThread from the live ClinicianMessageSeed instead of leaving messaging as an implied preview consequence.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_save_message_draft",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/message-thread/{threadId}:save-draft",
    contractFamily: "SaveClinicianMessageDraftCommandContract",
    purpose:
      "Save the current thread draft under the live thread fence so stale tabs cannot fork new thread text or reset approval posture.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_approve_message_draft",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/message-thread/{threadId}:approve-draft",
    contractFamily: "ApproveClinicianMessageDraftCommandContract",
    purpose:
      "Bind draft approval to the live thread version and review-action lease instead of treating approval as an unfenced UI transition.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_send_message_thread",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/message-thread/{threadId}:send",
    contractFamily: "SendClinicianMessageThreadCommandContract",
    purpose:
      "Create or reuse one immutable MessageDispatchEnvelope for the current thread version and dispatch fence.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_record_message_provider_receipt",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-provider-receipt",
    contractFamily: "RecordClinicianMessageProviderReceiptCommandContract",
    purpose:
      "Verify signed channel callbacks and reconcile provider replay onto the live MessageDispatchEnvelope through AdapterReceiptCheckpoint.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_record_message_delivery_evidence",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-delivery-evidence",
    contractFamily: "RecordMessageDeliveryEvidenceCommandContract",
    purpose:
      "Bind delivered, failed, disputed, or expired posture to MessageDeliveryEvidenceBundle instead of raw provider status.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_ingest_message_reply",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/message-thread/{threadId}:ingest-reply",
    contractFamily: "IngestClinicianMessageReplyCommandContract",
    purpose:
      "Persist patient reply on the canonical thread first, then emit the assimilation hook needed for later resafety work.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_settle_message_resolution_gate",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:settle-resolution-gate",
    contractFamily: "SettleThreadResolutionGateCommandContract",
    purpose:
      "Authorize await-reply, review-pending, repair-route, callback escalation, reopen, or close only through ThreadResolutionGate.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_reopen_message_thread",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:reopen",
    contractFamily: "ReopenClinicianMessageThreadCommandContract",
    purpose:
      "Reopen a closed thread under a fresh lifecycle lease and expectation revision instead of mutating a stale closed shell.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3ClinicianMessagePersistenceTables = [
  ...new Set([
    ...phase3TriageKernelPersistenceTables,
    ...phase3DirectResolutionPersistenceTables,
    ...replayCollisionPersistenceTables,
    "phase3_clinician_message_threads",
    "phase3_message_dispatch_envelopes",
    "phase3_message_delivery_evidence_bundles",
    "phase3_thread_expectation_envelopes",
    "phase3_thread_resolution_gates",
    "phase3_message_patient_replies",
    "phase3_message_thread_outbox_entries",
  ]),
] as const;

export const phase3ClinicianMessageMigrationPlanRefs = [
  ...new Set([
    ...phase3TriageKernelMigrationPlanRefs,
    ...phase3DirectResolutionMigrationPlanRefs,
    ...replayCollisionMigrationPlanRefs,
    "services/command-api/migrations/120_phase3_clinician_message_domain.sql",
  ]),
] as const;

export type MessageThreadOutboxEffectType =
  | "projection_refresh"
  | "reply_assimilation"
  | "callback_escalation";
export type MessageThreadOutboxDispatchState = "pending" | "dispatched" | "cancelled";

export interface MessageThreadOutboxEntrySnapshot {
  outboxEntryId: string;
  threadId: string;
  effectType: MessageThreadOutboxEffectType;
  effectKey: string;
  dispatchEnvelopeRef: string | null;
  deliveryEvidenceBundleRef: string | null;
  expectationEnvelopeRef: string | null;
  resolutionGateRef: string | null;
  patientReplyRef: string | null;
  payloadDigestRef: string;
  dispatchState: MessageThreadOutboxDispatchState;
  createdAt: string;
  dispatchedAt: string | null;
  cancelledAt: string | null;
  version: number;
}

interface TaskSnapshot {
  taskId: string;
  requestId: string;
  assignedTo: string | null;
  status: string;
  reviewVersion: number;
  version: number;
  launchContextRef: string;
  lifecycleLeaseRef: string | null;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  activeReviewSessionRef: string | null;
}

interface MessageCommandContext {
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  causalToken: string;
}

export interface CreateClinicianMessageThreadCommandInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  reviewActionLeaseRef?: string | null;
  threadPurposeRef?: string;
  closureRuleRef?: string;
  approvalRequiredState?: "required" | "not_required";
}

export interface SaveClinicianMessageDraftCommandInput {
  taskId: string;
  threadId: string;
  actorRef: string;
  recordedAt: string;
  reviewActionLeaseRef?: string | null;
  messageSubject: string;
  messageBody: string;
}

export interface ApproveClinicianMessageDraftCommandInput {
  taskId: string;
  threadId: string;
  actorRef: string;
  recordedAt: string;
  reviewActionLeaseRef?: string | null;
}

export interface SendClinicianMessageThreadCommandInput {
  taskId: string;
  threadId: string;
  actorRef: string;
  recordedAt: string;
  reviewActionLeaseRef?: string | null;
  contactRouteRef?: string | null;
  routeIntentBindingRef?: string | null;
  deliveryPlanRef?: string;
  channelTemplateRef?: string;
  repairIntent?: MessageRepairIntent;
  providerCorrelationRef?: string | null;
  supportMutationAttemptRef?: string | null;
  supportActionRecordRef?: string | null;
}

export interface RecordClinicianMessageProviderReceiptCommandInput {
  taskId: string;
  threadId: string;
  recordedAt: string;
  requestUrl: string;
  headers: Record<string, string>;
  transportMessageId: string;
  orderingKey: string;
  rawReceipt: unknown;
  semanticReceipt: Record<string, unknown>;
}

export interface RecordMessageDeliveryEvidenceCommandInput {
  taskId: string;
  threadId: string;
  actorRef: string;
  recordedAt: string;
  reviewActionLeaseRef?: string | null;
  deliveryState: Exclude<MessageDeliveryEvidenceState, "unobserved">;
  evidenceStrength: MessageDeliveryEvidenceStrength;
  providerDispositionRef: string;
  deliveryArtifactRefs: readonly string[];
  reachabilityDependencyRef?: string | null;
  supportActionSettlementRef?: string | null;
}

export interface IngestClinicianMessageReplyCommandInput {
  taskId: string;
  threadId: string;
  recordedAt: string;
  replyRouteFamilyRef: string;
  replyChannelRef: string;
  replyText: string;
  replyArtifactRefs?: readonly string[];
  providerCorrelationRef?: string | null;
  secureEntryGrantRef?: string | null;
  classificationHint?: MessageReplyClassificationHint;
  reSafetyRequired?: boolean;
}

export interface SettleThreadResolutionGateCommandInput {
  taskId: string;
  threadId: string;
  actorRef: string;
  recordedAt: string;
  reviewActionLeaseRef?: string | null;
  explicitDecision: ThreadResolutionDecision;
  decisionReasonRef?: string | null;
  callbackEscalationRef?: string | null;
  sameShellRecoveryRef?: string | null;
}

export interface ReopenClinicianMessageThreadCommandInput {
  taskId: string;
  threadId: string;
  actorRef: string;
  recordedAt: string;
  reviewActionLeaseRef?: string | null;
}

export interface Phase3ClinicianMessageApplicationBundle
  extends Phase3ClinicianMessageBundle {
  task: TaskSnapshot;
  clinicianMessageSeedRef: string;
}

export interface Phase3ClinicianMessageDomainApplication {
  readonly serviceName: typeof PHASE3_CLINICIAN_MESSAGE_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_CLINICIAN_MESSAGE_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_CLINICIAN_MESSAGE_QUERY_SURFACES;
  readonly routes: typeof phase3ClinicianMessageRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly directResolutionApplication: Phase3DirectResolutionApplication;
  readonly replayApplication: ReplayCollisionApplication;
  readonly repositories: Phase3ClinicianMessageKernelRepositories;
  readonly service: Phase3ClinicianMessageKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  readonly outboxEntries: readonly MessageThreadOutboxEntrySnapshot[];
  queryTaskClinicianMessageDomain(
    taskId: string,
  ): Promise<Phase3ClinicianMessageApplicationBundle | null>;
  createMessageThread(
    input: CreateClinicianMessageThreadCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle>;
  saveDraft(
    input: SaveClinicianMessageDraftCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle>;
  approveDraft(
    input: ApproveClinicianMessageDraftCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle>;
  sendThread(
    input: SendClinicianMessageThreadCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle>;
  recordProviderReceipt(
    input: RecordClinicianMessageProviderReceiptCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle>;
  recordDeliveryEvidence(
    input: RecordMessageDeliveryEvidenceCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle>;
  ingestPatientReply(
    input: IngestClinicianMessageReplyCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle>;
  settleResolutionGate(
    input: SettleThreadResolutionGateCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle>;
  reopenThread(
    input: ReopenClinicianMessageThreadCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle>;
  listOutboxEntries(): readonly MessageThreadOutboxEntrySnapshot[];
}

class Phase3ClinicianMessageDomainApplicationImpl
  implements Phase3ClinicianMessageDomainApplication
{
  readonly serviceName = PHASE3_CLINICIAN_MESSAGE_SERVICE_NAME;
  readonly schemaVersion = PHASE3_CLINICIAN_MESSAGE_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_CLINICIAN_MESSAGE_QUERY_SURFACES;
  readonly routes = phase3ClinicianMessageRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly directResolutionApplication: Phase3DirectResolutionApplication;
  readonly replayApplication: ReplayCollisionApplication;
  readonly repositories: Phase3ClinicianMessageKernelRepositories;
  readonly service: Phase3ClinicianMessageKernelService;
  readonly persistenceTables = phase3ClinicianMessagePersistenceTables;
  readonly migrationPlanRef = phase3ClinicianMessageMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3ClinicianMessageMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;
  private readonly leaseAuthority;
  private readonly settlementAuthority;
  private readonly outboxEntriesStore = new Map<string, MessageThreadOutboxEntrySnapshot>();
  private readonly outboxByEffectKey = new Map<string, string>();

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    directResolutionApplication?: Phase3DirectResolutionApplication;
    replayApplication?: ReplayCollisionApplication;
    repositories?: Phase3ClinicianMessageKernelRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_clinician_message");
    this.triageApplication =
      options?.triageApplication ??
      createPhase3TriageKernelApplication({ idGenerator: this.idGenerator });
    this.directResolutionApplication =
      options?.directResolutionApplication ??
      createPhase3DirectResolutionApplication({
        idGenerator: this.idGenerator,
        triageApplication: this.triageApplication,
      });
    this.replayApplication =
      options?.replayApplication ??
      createReplayCollisionApplication({ idGenerator: this.idGenerator });
    this.repositories =
      options?.repositories ?? createPhase3ClinicianMessageKernelStore();
    this.service = createPhase3ClinicianMessageKernelService(this.repositories, {
      idGenerator: this.idGenerator,
    });
    this.leaseAuthority = createLeaseFenceCommandAuthorityService(
      this.triageApplication.controlPlaneRepositories,
      this.idGenerator,
    );
    this.settlementAuthority = createCommandSettlementAuthorityService(
      this.triageApplication.controlPlaneRepositories,
      this.idGenerator,
    );
  }

  get outboxEntries(): readonly MessageThreadOutboxEntrySnapshot[] {
    return this.listOutboxEntries();
  }

  listOutboxEntries(): readonly MessageThreadOutboxEntrySnapshot[] {
    return [...this.outboxEntriesStore.values()].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  }

  async queryTaskClinicianMessageDomain(
    taskId: string,
  ): Promise<Phase3ClinicianMessageApplicationBundle | null> {
    const task = await this.requireTask(taskId);
    const bundle = await this.service.queryCurrentThreadBundleForTask(taskId);
    if (!bundle) {
      return null;
    }
    return {
      ...bundle,
      task,
      clinicianMessageSeedRef: bundle.messageThread.clinicianMessageSeedRef,
    };
  }

  async createMessageThread(
    input: CreateClinicianMessageThreadCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const task = await this.requireTask(input.taskId);
    await this.requireReviewActionLease(task, input.reviewActionLeaseRef, "message_create_thread");
    const directResolutionBundle =
      await this.directResolutionApplication.queryTaskDirectResolution(input.taskId);
    const clinicianMessageSeed = directResolutionBundle.clinicianMessageSeed;
    invariant(
      clinicianMessageSeed,
      "CLINICIAN_MESSAGE_SEED_NOT_FOUND",
      "A live ClinicianMessageSeed is required.",
    );
    invariant(
      clinicianMessageSeed.seedState === "live" &&
        clinicianMessageSeed.decisionSupersessionRecordRef === null,
      "CLINICIAN_MESSAGE_SEED_NOT_LIVE",
      "ClinicianMessageSeed must be current before the thread is created.",
    );

    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const threadId = nextApplicationId(this.idGenerator, "phase3_clinician_message_thread");
    const lease = await this.acquireThreadLease({
      threadId,
      task,
      actorRef: input.actorRef,
      recordedAt,
      ownerSessionRef: `session_${input.actorRef}`,
    });
    const created = await this.service.createMessageThread({
      threadId,
      sourceTriageTaskRef: input.taskId,
      clinicianMessageSeedRef: clinicianMessageSeed.clinicianMessageSeedId,
      episodeRef: clinicianMessageSeed.episodeRef,
      requestId: clinicianMessageSeed.requestId,
      requestLineageRef: clinicianMessageSeed.requestLineageRef,
      lineageCaseLinkRef: clinicianMessageSeed.lineageCaseLinkRef,
      decisionEpochRef: clinicianMessageSeed.decisionEpochRef,
      decisionId: clinicianMessageSeed.decisionId,
      threadPurposeRef: input.threadPurposeRef ?? "operational_follow_up",
      closureRuleRef: input.closureRuleRef ?? "close_after_review_or_callback",
      authorActorRef: input.actorRef,
      approvalRequiredState: input.approvalRequiredState ?? "required",
      messageSubject: clinicianMessageSeed.messageSubject,
      messageBody: clinicianMessageSeed.messageBody,
      requestLifecycleLeaseRef: lease.leaseId,
      leaseAuthorityRef: MESSAGE_LEASE_AUTHORITY_REF,
      ownershipEpoch: lease.ownershipEpoch,
      fencingToken: lease.fencingToken,
      currentLineageFenceEpoch: lease.lineageFenceEpoch,
      createdAt: recordedAt,
      initialExpectationEnvelope: this.buildExpectationEnvelope({
        threadId,
        routeIntentBindingRef: `route_intent_message_create_${task.taskId}`,
        patientVisibleState: "reply_blocked",
        replyWindowRef: "thread_reply_window_blocked_until_dispatch",
        deliveryRiskState: "on_track",
        stateConfidenceBand: "high",
        fallbackGuidanceRef: "THREAD_244_DRAFT_NOT_SENT",
        reachabilityDependencyRef: null,
        supportActionSettlementRef: null,
        continuityEvidenceRef: `thread_continuity_${threadId}_create`,
        causalToken: `thread_create_${threadId}_${recordedAt}`,
        createdAt: recordedAt,
      }),
    });
    this.ensureOutboxEntry({
      threadId: created.bundle.messageThread.threadId,
      effectType: "projection_refresh",
      effectKey: `${created.bundle.messageThread.threadId}::projection_refresh::create`,
      dispatchEnvelopeRef: null,
      deliveryEvidenceBundleRef: null,
      expectationEnvelopeRef: created.bundle.currentExpectationEnvelope?.threadExpectationEnvelopeId ?? null,
      resolutionGateRef: null,
      patientReplyRef: null,
      payloadDigestRef: `projection_refresh_create_${created.bundle.messageThread.threadId}`,
      createdAt: recordedAt,
    });
    return this.requireThreadBundle(input.taskId, created.bundle.messageThread.threadId);
  }

  async saveDraft(
    input: SaveClinicianMessageDraftCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const task = await this.requireTask(input.taskId);
    await this.requireReviewActionLease(task, input.reviewActionLeaseRef, "message_save_draft");
    const bundle = await this.requireThreadBundle(input.taskId, input.threadId);
    await this.service.saveDraft({
      threadRef: input.threadId,
      messageSubject: input.messageSubject,
      messageBody: input.messageBody,
      authorActorRef: input.actorRef,
      recordedAt: input.recordedAt,
    });
    this.ensureOutboxEntry({
      threadId: input.threadId,
      effectType: "projection_refresh",
      effectKey: `${input.threadId}::projection_refresh::draft`,
      dispatchEnvelopeRef: bundle.currentDispatchEnvelope?.messageDispatchEnvelopeId ?? null,
      deliveryEvidenceBundleRef: bundle.currentDeliveryEvidenceBundle?.messageDeliveryEvidenceBundleId ?? null,
      expectationEnvelopeRef: bundle.currentExpectationEnvelope?.threadExpectationEnvelopeId ?? null,
      resolutionGateRef: bundle.currentResolutionGate?.threadResolutionGateId ?? null,
      patientReplyRef: bundle.latestReply?.messagePatientReplyId ?? null,
      payloadDigestRef: `projection_refresh_draft_${input.threadId}`,
      createdAt: input.recordedAt,
    });
    return this.requireThreadBundle(input.taskId, input.threadId);
  }

  async approveDraft(
    input: ApproveClinicianMessageDraftCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const task = await this.requireTask(input.taskId);
    await this.requireReviewActionLease(task, input.reviewActionLeaseRef, "message_approve_draft");
    const bundle = await this.requireThreadBundle(input.taskId, input.threadId);
    await this.service.approveDraft({
      threadRef: input.threadId,
      approvedByRef: input.actorRef,
      approvedAt: input.recordedAt,
    });
    this.ensureOutboxEntry({
      threadId: input.threadId,
      effectType: "projection_refresh",
      effectKey: `${input.threadId}::projection_refresh::approved`,
      dispatchEnvelopeRef: bundle.currentDispatchEnvelope?.messageDispatchEnvelopeId ?? null,
      deliveryEvidenceBundleRef: bundle.currentDeliveryEvidenceBundle?.messageDeliveryEvidenceBundleId ?? null,
      expectationEnvelopeRef: bundle.currentExpectationEnvelope?.threadExpectationEnvelopeId ?? null,
      resolutionGateRef: bundle.currentResolutionGate?.threadResolutionGateId ?? null,
      patientReplyRef: bundle.latestReply?.messagePatientReplyId ?? null,
      payloadDigestRef: `projection_refresh_approved_${input.threadId}`,
      createdAt: input.recordedAt,
    });
    return this.requireThreadBundle(input.taskId, input.threadId);
  }

  async sendThread(
    input: SendClinicianMessageThreadCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const task = await this.requireTask(input.taskId);
    await this.requireReviewActionLease(task, input.reviewActionLeaseRef, "message_send");
    const bundle = await this.requireThreadBundle(input.taskId, input.threadId);
    const thread = bundle.messageThread;

    invariant(
      thread.approvalRequiredState === "not_required" || thread.approverActorRef !== null,
      "MESSAGE_APPROVAL_REQUIRED",
      "The thread must be approved before send.",
    );
    const directResolutionBundle =
      await this.directResolutionApplication.queryTaskDirectResolution(input.taskId);
    const clinicianMessageSeed = directResolutionBundle.clinicianMessageSeed;
    invariant(
      clinicianMessageSeed &&
        clinicianMessageSeed.seedState === "live" &&
        clinicianMessageSeed.decisionSupersessionRecordRef === null,
      "MESSAGE_DECISION_EPOCH_STALE",
      "The live ClinicianMessageSeed must still be current before send.",
    );

    const currentDispatch = bundle.currentDispatchEnvelope;
    const currentResolution = bundle.currentResolutionGate;
    const currentDelivery = bundle.currentDeliveryEvidenceBundle;
    const mayMintFreshDispatch =
      !currentDispatch ||
      currentResolution?.decision === "repair_route" ||
      currentResolution?.decision === "reopen" ||
      currentDelivery?.deliveryState === "failed" ||
      currentDelivery?.deliveryState === "expired" ||
      currentDelivery?.deliveryState === "disputed";
    if (currentDispatch && !mayMintFreshDispatch) {
      return bundle;
    }

    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const command = await this.issueMessageCommand({
      bundle,
      actorRef: input.actorRef,
      recordedAt,
      actionScope: "message_send",
      semanticPayload: {
        repairIntent: input.repairIntent ?? "initial_send",
      },
    });
    const dispatchFenceEpoch = thread.dispatchFenceCounter + 1;
    const threadVersionRef = `${thread.threadId}@v${thread.version}`;
    const effectKey = `clinician_message_dispatch::${thread.threadId}::${dispatchFenceEpoch}::${threadVersionRef}`;
    const replay = await this.replayApplication.authority.resolveInboundCommand({
      actionScope: "message_send",
      governingLineageRef: thread.requestLineageRef,
      effectiveActorRef: input.actorRef,
      sourceCommandId: command.commandActionRecordRef,
      sourceCommandIdFamily: "command_id",
      transportCorrelationId: optionalRef(input.providerCorrelationRef),
      causalParentRef: thread.clinicianMessageSeedRef,
      intentGeneration: dispatchFenceEpoch,
      expectedEffectSetRefs: [effectKey],
      scope: {
        governingObjectRef: thread.threadId,
        governingObjectVersionRef: threadVersionRef,
        routeContractDigestRef: "route_contract_digest_message_send_244_v1",
      },
      rawPayload: {
        threadId: thread.threadId,
        repairIntent: input.repairIntent ?? "initial_send",
      },
      semanticPayload: {
        threadId: thread.threadId,
        threadVersionRef,
        dispatchFenceEpoch,
        repairIntent: input.repairIntent ?? "initial_send",
      },
      firstAcceptedActionRecordRef: command.commandActionRecordRef,
      acceptedSettlementRef: command.commandSettlementRecordRef,
      observedAt: recordedAt,
    });
    const dispatchAttempt = await this.replayApplication.authority.ensureAdapterDispatchAttempt({
      idempotencyRecordRef: replay.idempotencyRecord.idempotencyRecordId,
      actionScope: "message_send",
      governingLineageRef: thread.requestLineageRef,
      actionRecordRef: command.commandActionRecordRef,
      adapterContractProfileRef: MESSAGE_ADAPTER_CONTRACT_PROFILE_REF,
      effectScope: `message_thread_${thread.threadId}`,
      effectKey,
      transportPayload: {
        subject: thread.messageSubject,
        body: thread.messageBody,
        template: input.channelTemplateRef ?? "secure_message_template_follow_up_v1",
      },
      semanticPayload: {
        threadId: thread.threadId,
        threadVersionRef,
        dispatchFenceEpoch,
        repairIntent: input.repairIntent ?? "initial_send",
      },
      providerCorrelationRef: optionalRef(input.providerCorrelationRef),
      firstDispatchedAt: recordedAt,
    });

    const dispatched = await this.service.dispatchThread({
      threadRef: thread.threadId,
      nextState: "sent",
      dispatchEnvelope: {
        messageDispatchEnvelopeId: nextApplicationId(this.idGenerator, "message_dispatch_envelope"),
        threadVersionRef,
        draftRef: thread.latestDraftRef,
        approvedByRef: thread.approverActorRef,
        deliveryPlanRef: input.deliveryPlanRef ?? "delivery_plan_secure_message_standard",
        contactRouteRef: optionalRef(input.contactRouteRef),
        routeIntentBindingRef: input.routeIntentBindingRef ?? command.routeIntentBindingRef,
        requestLifecycleLeaseRef: thread.requestLifecycleLeaseRef,
        dispatchFenceEpoch,
        ownershipEpochRef: thread.ownershipEpoch,
        fencingToken: thread.fencingToken,
        commandActionRecordRef: command.commandActionRecordRef,
        idempotencyRecordRef: replay.idempotencyRecord.idempotencyRecordId,
        adapterDispatchAttemptRef: dispatchAttempt.dispatchAttempt.dispatchAttemptId,
        adapterEffectKey: effectKey,
        latestReceiptCheckpointRef: null,
        supportMutationAttemptRef: optionalRef(input.supportMutationAttemptRef),
        supportActionRecordRef: optionalRef(input.supportActionRecordRef),
        repairIntent: input.repairIntent ?? "initial_send",
        channelTemplateRef: input.channelTemplateRef ?? "secure_message_template_follow_up_v1",
        transportState: "dispatching",
        deliveryEvidenceState: "unobserved",
        currentDeliveryConfidenceRef: "delivery_confidence_unobserved",
        deliveryModelVersionRef: "message_delivery_model_244.v1",
        calibrationVersion: "message_delivery_calibration_244.v1",
        causalToken: command.causalToken,
        idempotencyKey: replay.idempotencyRecord.toSnapshot().replayKey,
        createdAt: recordedAt,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        threadId: thread.threadId,
        routeIntentBindingRef: input.routeIntentBindingRef ?? command.routeIntentBindingRef,
        patientVisibleState: "reply_blocked",
        replyWindowRef: "thread_reply_window_pending_delivery",
        deliveryRiskState: "on_track",
        stateConfidenceBand: "medium",
        fallbackGuidanceRef: "THREAD_244_DELIVERY_PENDING",
        reachabilityDependencyRef: null,
        supportActionSettlementRef: null,
        continuityEvidenceRef: `thread_continuity_${thread.threadId}_dispatch_${dispatchFenceEpoch}`,
        causalToken: `${command.causalToken}_expectation`,
        createdAt: recordedAt,
      }),
      dispatchedAt: recordedAt,
    });

    this.ensureOutboxEntry({
      threadId: thread.threadId,
      effectType: "projection_refresh",
      effectKey: `${thread.threadId}::projection_refresh::dispatch::${dispatched.dispatchEnvelope.messageDispatchEnvelopeId}`,
      dispatchEnvelopeRef: dispatched.dispatchEnvelope.messageDispatchEnvelopeId,
      deliveryEvidenceBundleRef: null,
      expectationEnvelopeRef:
        dispatched.bundle.currentExpectationEnvelope?.threadExpectationEnvelopeId ?? null,
      resolutionGateRef: null,
      patientReplyRef: null,
      payloadDigestRef: effectKey,
      createdAt: recordedAt,
    });

    return this.requireThreadBundle(input.taskId, input.threadId);
  }

  async recordProviderReceipt(
    input: RecordClinicianMessageProviderReceiptCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const bundle = await this.requireThreadBundle(input.taskId, input.threadId);
    const currentDispatch = bundle.currentDispatchEnvelope;
    invariant(
      currentDispatch,
      "MESSAGE_DISPATCH_ENVELOPE_REQUIRED",
      "A live MessageDispatchEnvelope is required.",
    );
    this.verifyMessageWebhookSignature(input.headers, input.rawReceipt);
    const receiptResult = await this.replayApplication.authority.recordAdapterReceiptCheckpoint({
      actionScope: "message_provider_receipt",
      governingLineageRef: bundle.messageThread.requestLineageRef,
      adapterContractProfileRef: MESSAGE_ADAPTER_CONTRACT_PROFILE_REF,
      effectKey: currentDispatch.adapterEffectKey,
      providerCorrelationRef:
        (typeof input.semanticReceipt.providerCorrelationRef === "string"
          ? optionalRef(input.semanticReceipt.providerCorrelationRef)
          : null) ??
        (typeof input.semanticReceipt.messageId === "string"
          ? optionalRef(input.semanticReceipt.messageId)
          : null),
      transportMessageId: input.transportMessageId,
      orderingKey: input.orderingKey,
      rawReceipt: input.rawReceipt,
      semanticReceipt: input.semanticReceipt,
      linkedSettlementRef: null,
      recordedAt: input.recordedAt,
    });
    const statusClass =
      typeof input.semanticReceipt.statusClass === "string"
        ? input.semanticReceipt.statusClass
        : null;
    const nextTransportState: MessageTransportState =
      receiptResult.decisionClass === "collision_review"
        ? currentDispatch.transportState
        : statusClass === "accepted" || statusClass === "queued" || statusClass === "delivered"
          ? "provider_accepted"
          : statusClass === "failed" || statusClass === "rejected" || statusClass === "bounced"
            ? "provider_rejected"
            : currentDispatch.transportState;
    await this.service.observeProviderReceipt({
      threadRef: bundle.messageThread.threadId,
      messageDispatchEnvelopeId: currentDispatch.messageDispatchEnvelopeId,
      receiptCheckpointRef: receiptResult.checkpoint.receiptCheckpointId,
      receiptDecisionClass: receiptResult.decisionClass,
      nextTransportState,
      observedAt: input.recordedAt,
    });
    this.ensureOutboxEntry({
      threadId: bundle.messageThread.threadId,
      effectType: "projection_refresh",
      effectKey: `${bundle.messageThread.threadId}::projection_refresh::receipt::${receiptResult.checkpoint.receiptCheckpointId}`,
      dispatchEnvelopeRef: currentDispatch.messageDispatchEnvelopeId,
      deliveryEvidenceBundleRef:
        bundle.currentDeliveryEvidenceBundle?.messageDeliveryEvidenceBundleId ?? null,
      expectationEnvelopeRef:
        bundle.currentExpectationEnvelope?.threadExpectationEnvelopeId ?? null,
      resolutionGateRef: bundle.currentResolutionGate?.threadResolutionGateId ?? null,
      patientReplyRef: bundle.latestReply?.messagePatientReplyId ?? null,
      payloadDigestRef: receiptResult.checkpoint.receiptCheckpointId,
      createdAt: input.recordedAt,
    });
    return this.requireThreadBundle(input.taskId, input.threadId);
  }

  async recordDeliveryEvidence(
    input: RecordMessageDeliveryEvidenceCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const task = await this.requireTask(input.taskId);
    await this.requireReviewActionLease(
      task,
      input.reviewActionLeaseRef,
      "message_record_delivery_evidence",
    );
    const bundle = await this.requireThreadBundle(input.taskId, input.threadId);
    const currentDispatch = bundle.currentDispatchEnvelope;
    invariant(
      currentDispatch,
      "MESSAGE_DISPATCH_ENVELOPE_REQUIRED",
      "A live MessageDispatchEnvelope is required.",
    );
    const currentDelivery = bundle.currentDeliveryEvidenceBundle;
    invariant(
      !(
        currentDelivery &&
        currentDelivery.deliveryState === "delivered" &&
        input.deliveryState === "failed"
      ),
      "MESSAGE_DELIVERY_CONTRADICTION_REQUIRES_DISPUTE",
      "Contradictory late evidence must settle as disputed instead of silently replacing delivered truth.",
    );
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const command = await this.issueMessageCommand({
      bundle,
      actorRef: input.actorRef,
      recordedAt,
      actionScope: "message_record_delivery_evidence",
      semanticPayload: {
        deliveryState: input.deliveryState,
        evidenceStrength: input.evidenceStrength,
      },
    });
    const nextState =
      input.deliveryState === "delivered"
        ? "delivered"
        : input.deliveryState === "disputed"
          ? "delivery_disputed"
          : "delivery_failed";
    const evidenceResult = await this.service.recordDeliveryEvidence({
      threadRef: bundle.messageThread.threadId,
      nextState,
      evidenceBundle: {
        messageDeliveryEvidenceBundleId: nextApplicationId(
          this.idGenerator,
          "message_delivery_evidence_bundle",
        ),
        dispatchEnvelopeRef: currentDispatch.messageDispatchEnvelopeId,
        dispatchFenceEpoch: currentDispatch.dispatchFenceEpoch,
        threadVersionRef: currentDispatch.threadVersionRef,
        receiptCheckpointRef:
          currentDispatch.latestReceiptCheckpointRef ??
          `receipt_checkpoint_missing_${currentDispatch.messageDispatchEnvelopeId}`,
        deliveryState: input.deliveryState,
        evidenceStrength: input.evidenceStrength,
        providerDispositionRef: input.providerDispositionRef,
        deliveryArtifactRefs: input.deliveryArtifactRefs,
        reachabilityDependencyRef: optionalRef(input.reachabilityDependencyRef),
        supportActionSettlementRef: optionalRef(input.supportActionSettlementRef),
        causalToken: command.causalToken,
        recordedAt,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        threadId: bundle.messageThread.threadId,
        routeIntentBindingRef: command.routeIntentBindingRef,
        patientVisibleState:
          input.deliveryState === "delivered" ? "reply_needed" : "delivery_repair_required",
        replyWindowRef:
          input.deliveryState === "delivered"
            ? "thread_reply_window_standard"
            : "thread_reply_window_blocked_repair",
        deliveryRiskState:
          input.deliveryState === "delivered"
            ? "on_track"
            : input.deliveryState === "disputed"
              ? "disputed"
              : "likely_failed",
        stateConfidenceBand: input.deliveryState === "delivered" ? "high" : "medium",
        fallbackGuidanceRef:
          input.deliveryState === "delivered"
            ? "THREAD_244_REPLY_WINDOW_OPEN"
            : "THREAD_244_DELIVERY_REPAIR_REQUIRED",
        reachabilityDependencyRef: optionalRef(input.reachabilityDependencyRef),
        supportActionSettlementRef: optionalRef(input.supportActionSettlementRef),
        continuityEvidenceRef: `thread_continuity_${bundle.messageThread.threadId}_delivery_${recordedAt}`,
        causalToken: `${command.causalToken}_expectation`,
        createdAt: recordedAt,
      }),
      recordedAt,
    });
    this.ensureOutboxEntry({
      threadId: bundle.messageThread.threadId,
      effectType: "projection_refresh",
      effectKey: `${bundle.messageThread.threadId}::projection_refresh::delivery::${evidenceResult.evidenceBundle.messageDeliveryEvidenceBundleId}`,
      dispatchEnvelopeRef: currentDispatch.messageDispatchEnvelopeId,
      deliveryEvidenceBundleRef: evidenceResult.evidenceBundle.messageDeliveryEvidenceBundleId,
      expectationEnvelopeRef:
        evidenceResult.bundle.currentExpectationEnvelope?.threadExpectationEnvelopeId ?? null,
      resolutionGateRef: evidenceResult.bundle.currentResolutionGate?.threadResolutionGateId ?? null,
      patientReplyRef: evidenceResult.bundle.latestReply?.messagePatientReplyId ?? null,
      payloadDigestRef: evidenceResult.evidenceBundle.messageDeliveryEvidenceBundleId,
      createdAt: recordedAt,
    });
    return this.requireThreadBundle(input.taskId, input.threadId);
  }

  async ingestPatientReply(
    input: IngestClinicianMessageReplyCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const bundle = await this.requireThreadBundle(input.taskId, input.threadId);
    const currentDispatch = bundle.currentDispatchEnvelope;
    invariant(
      currentDispatch,
      "MESSAGE_DISPATCH_ENVELOPE_REQUIRED",
      "A live MessageDispatchEnvelope is required.",
    );
    const currentDelivery = bundle.currentDeliveryEvidenceBundle;
    invariant(
      currentDelivery?.deliveryState === "delivered",
      "MESSAGE_REPLY_REQUIRES_DELIVERED_THREAD",
      "Patient replies may only enter a delivered thread.",
    );
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const classificationHint = input.classificationHint ?? "unknown";
    const reSafetyRequired = input.reSafetyRequired ?? classificationHint !== "technical_only";
    const replyResult = await this.service.ingestPatientReply({
      threadRef: bundle.messageThread.threadId,
      nextState: "patient_replied",
      reply: {
        messagePatientReplyId: nextApplicationId(this.idGenerator, "message_patient_reply"),
        requestId: bundle.messageThread.requestId,
        requestLineageRef: bundle.messageThread.requestLineageRef,
        dispatchEnvelopeRef: currentDispatch.messageDispatchEnvelopeId,
        threadVersionRef: currentDispatch.threadVersionRef,
        replyRouteFamilyRef: input.replyRouteFamilyRef,
        replyChannelRef: input.replyChannelRef,
        replyText: input.replyText,
        replyArtifactRefs: input.replyArtifactRefs ?? [],
        providerCorrelationRef: optionalRef(input.providerCorrelationRef),
        secureEntryGrantRef: optionalRef(input.secureEntryGrantRef),
        classificationHint,
        reSafetyRequired,
        needsAssimilation:
          reSafetyRequired || classificationHint === "potentially_clinical" || classificationHint === "contact_safety_relevant",
        causalToken:
          optionalRef(input.providerCorrelationRef) ??
          `message_reply_${bundle.messageThread.threadId}_${recordedAt}`,
        repliedAt: recordedAt,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        threadId: bundle.messageThread.threadId,
        routeIntentBindingRef:
          bundle.currentExpectationEnvelope?.routeIntentBindingRef ??
          `route_intent_message_reply_${bundle.messageThread.threadId}`,
        patientVisibleState: "awaiting_review",
        replyWindowRef: "thread_reply_window_under_review",
        deliveryRiskState: "on_track",
        stateConfidenceBand: "high",
        fallbackGuidanceRef: "THREAD_244_REPLY_UNDER_REVIEW",
        reachabilityDependencyRef: currentDelivery.reachabilityDependencyRef,
        supportActionSettlementRef: null,
        continuityEvidenceRef: `thread_continuity_${bundle.messageThread.threadId}_reply_${recordedAt}`,
        causalToken: `message_reply_expectation_${bundle.messageThread.threadId}_${recordedAt}`,
        createdAt: recordedAt,
      }),
      recordedAt,
    });
    this.ensureOutboxEntry({
      threadId: bundle.messageThread.threadId,
      effectType: "projection_refresh",
      effectKey: `${bundle.messageThread.threadId}::projection_refresh::reply::${replyResult.reply.messagePatientReplyId}`,
      dispatchEnvelopeRef: currentDispatch.messageDispatchEnvelopeId,
      deliveryEvidenceBundleRef: currentDelivery.messageDeliveryEvidenceBundleId,
      expectationEnvelopeRef:
        replyResult.bundle.currentExpectationEnvelope?.threadExpectationEnvelopeId ?? null,
      resolutionGateRef: replyResult.bundle.currentResolutionGate?.threadResolutionGateId ?? null,
      patientReplyRef: replyResult.reply.messagePatientReplyId,
      payloadDigestRef: replyResult.reply.messagePatientReplyId,
      createdAt: recordedAt,
    });
    if (replyResult.reply.needsAssimilation) {
      this.ensureOutboxEntry({
        threadId: bundle.messageThread.threadId,
        effectType: "reply_assimilation",
        effectKey: `${bundle.messageThread.threadId}::reply_assimilation::${replyResult.reply.messagePatientReplyId}`,
        dispatchEnvelopeRef: currentDispatch.messageDispatchEnvelopeId,
        deliveryEvidenceBundleRef: currentDelivery.messageDeliveryEvidenceBundleId,
        expectationEnvelopeRef:
          replyResult.bundle.currentExpectationEnvelope?.threadExpectationEnvelopeId ?? null,
        resolutionGateRef: replyResult.bundle.currentResolutionGate?.threadResolutionGateId ?? null,
        patientReplyRef: replyResult.reply.messagePatientReplyId,
        payloadDigestRef: `reply_assimilation_${replyResult.reply.messagePatientReplyId}`,
        createdAt: recordedAt,
      });
    }
    return this.requireThreadBundle(input.taskId, input.threadId);
  }

  async settleResolutionGate(
    input: SettleThreadResolutionGateCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const task = await this.requireTask(input.taskId);
    await this.requireReviewActionLease(task, input.reviewActionLeaseRef, "message_settle_resolution_gate");
    const bundle = await this.requireThreadBundle(input.taskId, input.threadId);
    const currentDispatch = bundle.currentDispatchEnvelope;
    const currentExpectation = bundle.currentExpectationEnvelope;
    const currentDelivery = bundle.currentDeliveryEvidenceBundle;
    const latestReply = bundle.latestReply;
    invariant(
      currentDispatch && currentExpectation,
      "MESSAGE_RESOLUTION_CONTEXT_REQUIRED",
      "Current dispatch and expectation context are required.",
    );
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    if (input.explicitDecision === "close") {
      invariant(
        currentExpectation.patientVisibleState !== "delivery_repair_required",
        "MESSAGE_CLOSE_BLOCKED_BY_REPAIR",
        "Thread closure is blocked while delivery repair is still required.",
      );
      invariant(
        !bundle.messageThread.reSafetyRequired,
        "MESSAGE_CLOSE_BLOCKED_BY_RESAFETY",
        "Thread closure is blocked while reply resafety is still pending.",
      );
    }
    if (input.explicitDecision === "review_pending") {
      invariant(latestReply, "MESSAGE_REVIEW_PENDING_REQUIRES_REPLY", "A patient reply is required.");
    }
    if (input.explicitDecision === "repair_route") {
      invariant(
        currentDelivery?.deliveryState === "failed" ||
          currentDelivery?.deliveryState === "expired" ||
          currentDelivery?.deliveryState === "disputed" ||
          bundle.messageThread.state === "contact_route_repair_pending",
        "MESSAGE_REPAIR_ROUTE_NOT_AUTHORIZED",
        "Repair routing requires failed, expired, or disputed delivery posture.",
      );
    }
    if (input.explicitDecision === "reopen") {
      invariant(bundle.messageThread.state === "closed", "MESSAGE_REOPEN_REQUIRES_CLOSED", "Only a closed thread may be reopened through the gate.");
    }

    const command = await this.issueMessageCommand({
      bundle,
      actorRef: input.actorRef,
      recordedAt,
      actionScope: "message_settle_resolution_gate",
      semanticPayload: {
        explicitDecision: input.explicitDecision,
        callbackEscalationRef: input.callbackEscalationRef ?? null,
      },
    });
    const mapping = this.mapResolutionDecision(input.explicitDecision);
    const resolved = await this.service.settleResolutionGate({
      threadRef: bundle.messageThread.threadId,
      nextState: mapping.nextState,
      resolutionGate: {
        threadResolutionGateId: nextApplicationId(this.idGenerator, "thread_resolution_gate"),
        latestDispatchRef: currentDispatch.messageDispatchEnvelopeId,
        latestReplyRef: latestReply?.messagePatientReplyId ?? null,
        latestExpectationEnvelopeRef: currentExpectation.threadExpectationEnvelopeId,
        latestSupportActionSettlementRef: null,
        decision: input.explicitDecision,
        decisionReasonRef: input.decisionReasonRef ?? mapping.reasonRef,
        sameShellRecoveryRef: optionalRef(input.sameShellRecoveryRef),
        requiresLifecycleReview:
          input.explicitDecision === "review_pending" ||
          input.explicitDecision === "escalate_to_callback",
        causalToken: command.causalToken,
        decidedAt: recordedAt,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        threadId: bundle.messageThread.threadId,
        routeIntentBindingRef: command.routeIntentBindingRef,
        patientVisibleState: mapping.patientVisibleState,
        replyWindowRef: mapping.replyWindowRef,
        deliveryRiskState: mapping.deliveryRiskState,
        stateConfidenceBand: mapping.confidenceBand,
        fallbackGuidanceRef: mapping.fallbackGuidanceRef,
        reachabilityDependencyRef: currentDelivery?.reachabilityDependencyRef ?? currentExpectation.reachabilityDependencyRef,
        supportActionSettlementRef: null,
        continuityEvidenceRef: `thread_continuity_${bundle.messageThread.threadId}_resolution_${recordedAt}`,
        causalToken: `${command.causalToken}_expectation`,
        createdAt: recordedAt,
      }),
      callbackEscalationRef: optionalRef(input.callbackEscalationRef),
      recordedAt,
    });
    if (input.explicitDecision === "close") {
      await this.releaseCurrentLease(bundle, input.actorRef, recordedAt, "message_thread_closed");
      await this.service.closeThread({
        threadRef: bundle.messageThread.threadId,
        closedAt: recordedAt,
      });
    }
    this.ensureOutboxEntry({
      threadId: bundle.messageThread.threadId,
      effectType:
        input.explicitDecision === "escalate_to_callback"
          ? "callback_escalation"
          : "projection_refresh",
      effectKey:
        input.explicitDecision === "escalate_to_callback"
          ? `${bundle.messageThread.threadId}::callback_escalation::${resolved.currentResolutionGate?.threadResolutionGateId ?? "pending"}`
          : `${bundle.messageThread.threadId}::projection_refresh::resolution::${resolved.currentResolutionGate?.threadResolutionGateId ?? "pending"}`,
      dispatchEnvelopeRef: currentDispatch.messageDispatchEnvelopeId,
      deliveryEvidenceBundleRef:
        currentDelivery?.messageDeliveryEvidenceBundleId ?? null,
      expectationEnvelopeRef: resolved.currentExpectationEnvelope?.threadExpectationEnvelopeId ?? null,
      resolutionGateRef: resolved.currentResolutionGate?.threadResolutionGateId ?? null,
      patientReplyRef: latestReply?.messagePatientReplyId ?? null,
      payloadDigestRef:
        resolved.currentResolutionGate?.threadResolutionGateId ??
        `thread_resolution_${bundle.messageThread.threadId}`,
      createdAt: recordedAt,
    });
    return this.requireThreadBundle(input.taskId, input.threadId);
  }

  async reopenThread(
    input: ReopenClinicianMessageThreadCommandInput,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const task = await this.requireTask(input.taskId);
    await this.requireReviewActionLease(task, input.reviewActionLeaseRef, "message_reopen");
    const bundle = await this.requireThreadBundle(input.taskId, input.threadId);
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const lease = await this.acquireThreadLease({
      threadId: bundle.messageThread.threadId,
      task,
      actorRef: input.actorRef,
      recordedAt,
      ownerSessionRef: `session_${input.actorRef}`,
    });
    await this.service.reopenThread({
      threadRef: bundle.messageThread.threadId,
      nextState: "reopened",
      requestLifecycleLeaseRef: lease.leaseId,
      leaseAuthorityRef: MESSAGE_LEASE_AUTHORITY_REF,
      ownershipEpoch: lease.ownershipEpoch,
      fencingToken: lease.fencingToken,
      currentLineageFenceEpoch: lease.lineageFenceEpoch,
      expectationEnvelope: this.buildExpectationEnvelope({
        threadId: bundle.messageThread.threadId,
        routeIntentBindingRef: `route_intent_message_reopen_${bundle.messageThread.threadId}`,
        patientVisibleState: "awaiting_review",
        replyWindowRef: "thread_reply_window_reopened_review",
        deliveryRiskState: "on_track",
        stateConfidenceBand: "medium",
        fallbackGuidanceRef: "THREAD_244_REOPENED_UNDER_REVIEW",
        reachabilityDependencyRef: bundle.currentDeliveryEvidenceBundle?.reachabilityDependencyRef ?? bundle.currentExpectationEnvelope?.reachabilityDependencyRef ?? null,
        supportActionSettlementRef: null,
        continuityEvidenceRef: `thread_continuity_${bundle.messageThread.threadId}_reopen`,
        causalToken: `message_reopen_${bundle.messageThread.threadId}_${recordedAt}`,
        createdAt: recordedAt,
      }),
      reopenedAt: recordedAt,
    });
    this.ensureOutboxEntry({
      threadId: bundle.messageThread.threadId,
      effectType: "projection_refresh",
      effectKey: `${bundle.messageThread.threadId}::projection_refresh::reopen`,
      dispatchEnvelopeRef: bundle.currentDispatchEnvelope?.messageDispatchEnvelopeId ?? null,
      deliveryEvidenceBundleRef:
        bundle.currentDeliveryEvidenceBundle?.messageDeliveryEvidenceBundleId ?? null,
      expectationEnvelopeRef: null,
      resolutionGateRef: bundle.currentResolutionGate?.threadResolutionGateId ?? null,
      patientReplyRef: bundle.latestReply?.messagePatientReplyId ?? null,
      payloadDigestRef: `projection_refresh_reopen_${bundle.messageThread.threadId}`,
      createdAt: recordedAt,
    });
    return this.requireThreadBundle(input.taskId, input.threadId);
  }

  private async requireThreadBundle(
    taskId: string,
    threadId: string,
  ): Promise<Phase3ClinicianMessageApplicationBundle> {
    const task = await this.requireTask(taskId);
    const bundle = await this.service.queryThreadBundle(threadId);
    invariant(
      bundle.messageThread.sourceTriageTaskRef === taskId,
      "MESSAGE_THREAD_TASK_MISMATCH",
      `ClinicianMessageThread ${threadId} does not belong to task ${taskId}.`,
    );
    return {
      ...bundle,
      task,
      clinicianMessageSeedRef: bundle.messageThread.clinicianMessageSeedRef,
    };
  }

  private async requireTask(taskId: string): Promise<TaskSnapshot> {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} is required.`);
    const snapshot = task.toSnapshot();
    return {
      taskId: snapshot.taskId,
      requestId: snapshot.requestId,
      assignedTo: snapshot.assignedTo,
      status: snapshot.status,
      reviewVersion: snapshot.reviewVersion,
      version: snapshot.version,
      launchContextRef: snapshot.launchContextRef,
      lifecycleLeaseRef: snapshot.lifecycleLeaseRef,
      ownershipEpoch: snapshot.ownershipEpoch,
      fencingToken: snapshot.fencingToken,
      currentLineageFenceEpoch: snapshot.currentLineageFenceEpoch,
      activeReviewSessionRef: snapshot.activeReviewSessionRef,
    };
  }

  private async requireTaskRequestContext(
    taskId: string,
  ): Promise<{ episodeId: string; requestLineageRef: string }> {
    const task = await this.requireTask(taskId);
    const request = await this.triageApplication.controlPlaneRepositories.getRequest(task.requestId);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${task.requestId} is required for ${taskId}.`);
    const snapshot = request.toSnapshot();
    return {
      episodeId: snapshot.episodeId,
      requestLineageRef: snapshot.requestLineageRef,
    };
  }

  private async requireReviewActionLease(
    task: TaskSnapshot,
    presentedReviewActionLeaseRef: string | null | undefined,
    actionScope: string,
  ): Promise<string | null> {
    if (!task.activeReviewSessionRef) {
      return null;
    }
    const session = await this.triageApplication.triageRepositories.getReviewSession(
      task.activeReviewSessionRef,
    );
    invariant(
      session,
      "REVIEW_SESSION_NOT_FOUND",
      `Active ReviewSession ${task.activeReviewSessionRef} is required.`,
    );
    const expected = session.toSnapshot().reviewActionLeaseRef;
    invariant(
      optionalRef(presentedReviewActionLeaseRef) === expected,
      "REVIEW_ACTION_LEASE_MISMATCH",
      `${actionScope} requires the current ReviewActionLease.`,
    );
    return expected;
  }

  private async acquireThreadLease(input: {
    threadId: string;
    task: TaskSnapshot;
    actorRef: string;
    recordedAt: string;
    ownerSessionRef: string;
  }): Promise<{
    leaseId: string;
    ownershipEpoch: number;
    fencingToken: string;
    lineageFenceEpoch: number;
    expiresAt: string;
  }> {
    const requestContext = await this.requireTaskRequestContext(input.task.taskId);
    const acquired = await this.leaseAuthority.acquireLease({
      requestId: input.task.requestId,
      episodeId: requestContext.episodeId,
      requestLineageRef: requestContext.requestLineageRef,
      domain: MESSAGE_DOMAIN,
      domainObjectRef: input.threadId,
      leaseAuthorityRef: MESSAGE_LEASE_AUTHORITY_REF,
      ownerActorRef: input.actorRef,
      ownerSessionRef: input.ownerSessionRef,
      governingObjectVersionRef: `${input.threadId}@v1`,
      leaseScopeComponents: ["message_thread", "message_mutation"],
      leaseTtlSeconds: 1800,
      acquiredAt: input.recordedAt,
      sameShellRecoveryRouteRef: this.messageRecoveryRoute(input.task.taskId, input.threadId),
      operatorVisibleWorkRef: `message_thread_${input.threadId}`,
      blockedActionScopeRefs: ["message_send", "message_resolution"],
    });
    const snapshot = acquired.lease.toSnapshot();
    return {
      leaseId: snapshot.leaseId,
      ownershipEpoch: snapshot.ownershipEpoch,
      fencingToken: snapshot.fencingToken,
      lineageFenceEpoch: acquired.lineageFence.currentEpoch,
      expiresAt: addSeconds(snapshot.heartbeatAt, snapshot.leaseTtlSeconds),
    };
  }

  private async releaseCurrentLease(
    bundle: Phase3ClinicianMessageApplicationBundle,
    actorRef: string,
    recordedAt: string,
    reason: string,
  ): Promise<void> {
    await this.leaseAuthority.releaseLease({
      domain: MESSAGE_DOMAIN,
      domainObjectRef: bundle.messageThread.threadId,
      leaseId: bundle.messageThread.requestLifecycleLeaseRef,
      presentedOwnershipEpoch: bundle.messageThread.ownershipEpoch,
      presentedFencingToken: bundle.messageThread.fencingToken,
      releasedAt: recordedAt,
      closeBlockReason: reason,
      sameShellRecoveryRouteRef: this.messageRecoveryRoute(
        bundle.task.taskId,
        bundle.messageThread.threadId,
      ),
      operatorVisibleWorkRef: `message_thread_${bundle.messageThread.threadId}`,
      blockedActionScopeRefs: ["message_send", "message_resolution"],
      detectedByRef: actorRef,
    });
  }

  private async issueMessageCommand(input: {
    bundle: Phase3ClinicianMessageApplicationBundle;
    actorRef: string;
    recordedAt: string;
    actionScope: string;
    semanticPayload: Record<string, unknown>;
  }): Promise<MessageCommandContext> {
    const governingObjectVersionRef = await this.currentMessageControlPlaneVersionRef(
      input.bundle.messageThread.threadId,
      `${input.bundle.messageThread.threadId}@v${input.bundle.messageThread.version}`,
    );
    const action = await this.leaseAuthority.registerCommandAction({
      leaseId: input.bundle.messageThread.requestLifecycleLeaseRef,
      domain: MESSAGE_DOMAIN,
      domainObjectRef: input.bundle.messageThread.threadId,
      governingObjectVersionRef,
      presentedOwnershipEpoch: input.bundle.messageThread.ownershipEpoch,
      presentedFencingToken: input.bundle.messageThread.fencingToken,
      presentedLineageFenceEpoch: input.bundle.messageThread.currentLineageFenceEpoch,
      actionScope: input.actionScope,
      governingObjectRef: input.bundle.messageThread.threadId,
      canonicalObjectDescriptorRef: MESSAGE_DESCRIPTOR,
      initiatingBoundedContextRef: MESSAGE_DOMAIN,
      governingBoundedContextRef: MESSAGE_DOMAIN,
      lineageScope: "request",
      routeIntentRef: `route_intent_${input.actionScope}_${input.bundle.messageThread.threadId}`,
      routeContractDigestRef: `route_contract_digest_${input.actionScope}_244_v1`,
      requiredContextBoundaryRefs: [],
      parentAnchorRef: input.bundle.task.launchContextRef,
      edgeCorrelationId: `edge_${input.actionScope}_${input.bundle.messageThread.threadId}`,
      initiatingUiEventRef: `ui_event_${input.actionScope}_${input.bundle.messageThread.threadId}`,
      initiatingUiEventCausalityFrameRef: `ui_frame_${input.actionScope}_${input.bundle.messageThread.threadId}`,
      actingContextRef: "staff_workspace",
      policyBundleRef: "policy_phase3_clinician_message_244.v1",
      sourceCommandId: `cmd_${input.actionScope}_${input.bundle.messageThread.threadId}_${input.recordedAt}`,
      transportCorrelationId: `transport_${input.actionScope}_${input.bundle.messageThread.threadId}`,
      semanticPayload: input.semanticPayload,
      idempotencyKey: `idempotency_${input.actionScope}_${input.bundle.messageThread.threadId}_${input.recordedAt}`,
      idempotencyRecordRef: `idempotency_record_${input.actionScope}_${input.bundle.messageThread.threadId}`,
      commandFollowingTokenRef: `command_follow_${input.actionScope}_${input.bundle.messageThread.threadId}`,
      expectedEffectSetRefs: [`message.${input.bundle.messageThread.threadId}.${input.actionScope}`],
      causalToken: `causal_${input.actionScope}_${input.bundle.messageThread.threadId}_${input.recordedAt}`,
      createdAt: input.recordedAt,
      sameShellRecoveryRouteRef: this.messageRecoveryRoute(
        input.bundle.task.taskId,
        input.bundle.messageThread.threadId,
      ),
      operatorVisibleWorkRef: `message_thread_${input.bundle.messageThread.threadId}`,
      blockedActionScopeRefs: [input.actionScope],
      detectedByRef: input.actorRef,
    });
    const settlement = await this.settlementAuthority.recordSettlement({
      actionRecordRef: action.actionRecord.actionRecordId,
      replayDecisionClass: "distinct",
      result: "applied",
      processingAcceptanceState: "accepted_for_processing",
      externalObservationState: "projection_visible",
      authoritativeOutcomeState: "settled",
      authoritativeProofClass: "review_disposition",
      sameShellRecoveryRef: this.messageRecoveryRoute(
        input.bundle.task.taskId,
        input.bundle.messageThread.threadId,
      ),
      projectionVersionRef: `${input.bundle.messageThread.threadId}@projection_${input.recordedAt}`,
      uiTransitionSettlementRef: `ui_transition_${action.actionRecord.actionRecordId}`,
      projectionVisibilityRef: "staff_workspace",
      auditRecordRef: `audit_${action.actionRecord.actionRecordId}`,
      blockingRefs: [],
      quietEligibleAt: input.recordedAt,
      lastSafeAnchorRef: input.bundle.task.launchContextRef,
      allowedSummaryTier: "full",
      recordedAt: input.recordedAt,
    });
    return {
      routeIntentBindingRef: action.actionRecord.toSnapshot().routeIntentRef,
      commandActionRecordRef: action.actionRecord.actionRecordId,
      commandSettlementRecordRef: settlement.settlement.settlementId,
      causalToken: action.actionRecord.toSnapshot().causalToken,
    };
  }

  private async currentMessageControlPlaneVersionRef(
    threadId: string,
    fallback: string,
  ): Promise<string> {
    const authorityState = await this.triageApplication.controlPlaneRepositories.getLeaseAuthorityState(
      `${MESSAGE_DOMAIN}::${threadId}`,
    );
    return authorityState?.governingObjectVersionRef ?? fallback;
  }

  private verifyMessageWebhookSignature(headers: Record<string, string>, rawReceipt: unknown): void {
    const timestamp = headerLookup(headers, MESSAGE_WEBHOOK_TIMESTAMP_HEADER);
    const signature = headerLookup(headers, MESSAGE_WEBHOOK_SIGNATURE_HEADER);
    invariant(timestamp, "MESSAGE_WEBHOOK_TIMESTAMP_MISSING", "Message webhook timestamp header is required.");
    invariant(signature, "MESSAGE_WEBHOOK_SIGNATURE_MISSING", "Message webhook signature header is required.");
    const expected = buildMessageWebhookSignature(timestamp, canonicalReceiptPayload(rawReceipt));
    invariant(
      stableTimingCompare(signature, expected),
      "MESSAGE_WEBHOOK_SIGNATURE_REJECTED",
      `Message webhook signature failed verification under ${MESSAGE_WEBHOOK_SIGNATURE_POLICY_VERSION}.`,
    );
  }

  private messageRecoveryRoute(taskId: string, threadId: string): string {
    return `/workspace/tasks/${taskId}/message/${threadId}/recover`;
  }

  private ensureOutboxEntry(input: {
    threadId: string;
    effectType: MessageThreadOutboxEffectType;
    effectKey: string;
    dispatchEnvelopeRef: string | null;
    deliveryEvidenceBundleRef: string | null;
    expectationEnvelopeRef: string | null;
    resolutionGateRef: string | null;
    patientReplyRef: string | null;
    payloadDigestRef: string;
    createdAt: string;
  }): MessageThreadOutboxEntrySnapshot {
    const existingId = this.outboxByEffectKey.get(input.effectKey);
    if (existingId) {
      const existing = this.outboxEntriesStore.get(existingId);
      invariant(existing, "OUTBOX_ENTRY_NOT_FOUND", `Missing outbox entry ${existingId}.`);
      return existing;
    }
    const entry: MessageThreadOutboxEntrySnapshot = {
      outboxEntryId: nextApplicationId(this.idGenerator, "message_thread_outbox_entry"),
      threadId: input.threadId,
      effectType: input.effectType,
      effectKey: input.effectKey,
      dispatchEnvelopeRef: input.dispatchEnvelopeRef,
      deliveryEvidenceBundleRef: input.deliveryEvidenceBundleRef,
      expectationEnvelopeRef: input.expectationEnvelopeRef,
      resolutionGateRef: input.resolutionGateRef,
      patientReplyRef: input.patientReplyRef,
      payloadDigestRef: input.payloadDigestRef,
      dispatchState: "pending",
      createdAt: input.createdAt,
      dispatchedAt: null,
      cancelledAt: null,
      version: 1,
    };
    this.outboxEntriesStore.set(entry.outboxEntryId, entry);
    this.outboxByEffectKey.set(entry.effectKey, entry.outboxEntryId);
    return entry;
  }

  private buildExpectationEnvelope(input: {
    threadId: string;
    routeIntentBindingRef: string;
    patientVisibleState: ThreadExpectationPatientVisibleState;
    replyWindowRef: string;
    deliveryRiskState: ThreadDeliveryRiskState;
    stateConfidenceBand: ThreadStateConfidenceBand;
    fallbackGuidanceRef: string;
    reachabilityDependencyRef: string | null;
    supportActionSettlementRef: string | null;
    continuityEvidenceRef: string;
    causalToken: string;
    createdAt: string;
  }) {
    return {
      threadExpectationEnvelopeId: nextApplicationId(this.idGenerator, "thread_expectation_envelope"),
      reachabilityDependencyRef: input.reachabilityDependencyRef,
      contactRepairJourneyRef: null,
      identityRepairBranchDispositionRef: null,
      patientVisibleState: input.patientVisibleState,
      replyWindowRef: input.replyWindowRef,
      deliveryRiskState: input.deliveryRiskState,
      stateConfidenceBand: input.stateConfidenceBand,
      fallbackGuidanceRef: input.fallbackGuidanceRef,
      routeIntentBindingRef: input.routeIntentBindingRef,
      requiredReleaseApprovalFreezeRef: null,
      channelReleaseFreezeState: "open",
      requiredAssuranceSliceTrustRefs: [] as const,
      latestSupportActionSettlementRef: input.supportActionSettlementRef,
      transitionEnvelopeRef: `transition_envelope_${input.threadId}_${input.createdAt}`,
      continuityEvidenceRef: input.continuityEvidenceRef,
      freezeDispositionRef: null,
      causalToken: input.causalToken,
      createdAt: input.createdAt,
    };
  }

  private mapResolutionDecision(decision: ThreadResolutionDecision): {
    nextState: ClinicianMessageThreadSnapshot["state"];
    patientVisibleState: ThreadExpectationPatientVisibleState;
    replyWindowRef: string;
    deliveryRiskState: ThreadDeliveryRiskState;
    confidenceBand: ThreadStateConfidenceBand;
    fallbackGuidanceRef: string;
    reasonRef: string;
  } {
    switch (decision) {
      case "await_reply":
        return {
          nextState: "delivered",
          patientVisibleState: "reply_needed",
          replyWindowRef: "thread_reply_window_standard",
          deliveryRiskState: "on_track",
          confidenceBand: "high",
          fallbackGuidanceRef: "THREAD_244_REPLY_WINDOW_OPEN",
          reasonRef: "THREAD_244_AWAIT_REPLY",
        };
      case "review_pending":
        return {
          nextState: "awaiting_clinician_review",
          patientVisibleState: "awaiting_review",
          replyWindowRef: "thread_reply_window_under_review",
          deliveryRiskState: "on_track",
          confidenceBand: "high",
          fallbackGuidanceRef: "THREAD_244_REPLY_UNDER_REVIEW",
          reasonRef: "THREAD_244_REVIEW_PENDING",
        };
      case "escalate_to_callback":
        return {
          nextState: "escalated_to_callback",
          patientVisibleState: "reviewed",
          replyWindowRef: "thread_reply_window_closed_callback_escalation",
          deliveryRiskState: "on_track",
          confidenceBand: "medium",
          fallbackGuidanceRef: "THREAD_244_CALLBACK_ESCALATION_STARTED",
          reasonRef: "THREAD_244_ESCALATE_TO_CALLBACK",
        };
      case "close":
        return {
          nextState: "closed",
          patientVisibleState: "closed",
          replyWindowRef: "thread_reply_window_closed",
          deliveryRiskState: "on_track",
          confidenceBand: "high",
          fallbackGuidanceRef: "THREAD_244_THREAD_CLOSED",
          reasonRef: "THREAD_244_CLOSE",
        };
      case "reopen":
        return {
          nextState: "reopened",
          patientVisibleState: "awaiting_review",
          replyWindowRef: "thread_reply_window_reopened_review",
          deliveryRiskState: "on_track",
          confidenceBand: "medium",
          fallbackGuidanceRef: "THREAD_244_REOPENED_UNDER_REVIEW",
          reasonRef: "THREAD_244_REOPEN",
        };
      case "repair_route":
        return {
          nextState: "contact_route_repair_pending",
          patientVisibleState: "delivery_repair_required",
          replyWindowRef: "thread_reply_window_blocked_repair",
          deliveryRiskState: "likely_failed",
          confidenceBand: "medium",
          fallbackGuidanceRef: "THREAD_244_DELIVERY_REPAIR_REQUIRED",
          reasonRef: "THREAD_244_REPAIR_ROUTE",
        };
    }
  }
}

export function createPhase3ClinicianMessageDomainApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  directResolutionApplication?: Phase3DirectResolutionApplication;
  replayApplication?: ReplayCollisionApplication;
  repositories?: Phase3ClinicianMessageKernelRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3ClinicianMessageDomainApplication {
  return new Phase3ClinicianMessageDomainApplicationImpl(options);
}
