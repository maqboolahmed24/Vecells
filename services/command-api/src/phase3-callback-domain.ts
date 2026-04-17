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
  createPhase3CallbackKernelService,
  createPhase3CallbackKernelStore,
  evaluateCallbackResolutionDecision,
  resolveCallbackAttemptWindowPolicy,
  resolveCallbackVoicemailPolicy,
  type CallbackOutcome,
  type CallbackRouteAuthorityState,
  type CallbackSafetyClassification,
  type CallbackSafetyPreemptionState,
  type CallbackStateConfidenceBand,
  type CallbackResolutionDecision,
  type CallbackVoicemailCompletionDisposition,
  type CreateCallbackCaseInput,
  type Phase3CallbackBundle,
  type Phase3CallbackKernelRepositories,
  type Phase3CallbackKernelService,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3DirectResolutionApplication,
  phase3DirectResolutionMigrationPlanRefs,
  phase3DirectResolutionPersistenceTables,
  type CommitDirectResolutionInput,
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

export const PHASE3_CALLBACK_SERVICE_NAME = "Phase3CallbackDomainApplication";
export const PHASE3_CALLBACK_SCHEMA_VERSION = "243.phase3.callback-domain.v1";
export const PHASE3_CALLBACK_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/callback-case",
] as const;

const CALLBACK_DOMAIN = "callback_case";
const CALLBACK_DESCRIPTOR = "CallbackCase";
const CALLBACK_LEASE_AUTHORITY_REF = "lease_authority_callback_case";
const CALLBACK_ADAPTER_CONTRACT_PROFILE_REF = "telephony_provider_simulator_callback.v1";
const CALLBACK_WEBHOOK_SIGNATURE_POLICY_VERSION = "phase3-callback-hmac-sha256-simulator.v1";
const CALLBACK_WEBHOOK_SIGNATURE_HEADER = "x-vecells-simulator-signature";
const CALLBACK_WEBHOOK_TIMESTAMP_HEADER = "x-vecells-simulator-timestamp";
const CALLBACK_WEBHOOK_SECRET = "phase3_callback_simulator_secret";

export const phase3CallbackRoutes = [
  {
    routeId: "workspace_task_callback_case_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/callback-case",
    contractFamily: "CallbackCaseBundleContract",
    purpose:
      "Expose the current CallbackCase, CallbackIntentLease, CallbackAttemptRecord, CallbackExpectationEnvelope, CallbackOutcomeEvidenceBundle, and CallbackResolutionGate for one workspace task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_create_callback_case",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:create-callback-case",
    contractFamily: "CreateCallbackCaseCommandContract",
    purpose:
      "Create the canonical CallbackCase from the current live callback seed instead of leaving callback work implied by direct-resolution seed state.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_schedule_callback_case",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:schedule",
    contractFamily: "ScheduleCallbackCaseCommandContract",
    purpose:
      "Schedule or claim the current callback only through the live CallbackIntentLease and a fresh CallbackExpectationEnvelope revision.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_reschedule_callback_case",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:reschedule",
    contractFamily: "RescheduleCallbackCaseCommandContract",
    purpose:
      "Replace materially stale callback lease tuples when the callback window, urgency, or contact route changes.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_cancel_callback_case",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:cancel",
    contractFamily: "CancelCallbackCaseCommandContract",
    purpose:
      "Cancel callback only through CallbackResolutionGate instead of treating local schedule removal as authoritative cancellation truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_arm_callback_ready",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:arm-ready",
    contractFamily: "ArmCallbackReadyCommandContract",
    purpose:
      "Arm callback ready-for-attempt only when the active CallbackIntentLease and current attempt-window policy still agree.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_initiate_callback_attempt",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:initiate-attempt",
    contractFamily: "InitiateCallbackAttemptCommandContract",
    purpose:
      "Initiate one exclusive callback attempt through the canonical idempotency, command-action, and adapter-dispatch chain.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_record_callback_provider_receipt",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-provider-receipt",
    contractFamily: "RecordCallbackProviderReceiptCommandContract",
    purpose:
      "Verify telephony webhook signatures, collapse replay onto the live attempt fence, and record AdapterReceiptCheckpoint-backed callback evidence.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_record_callback_outcome_evidence",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-outcome-evidence",
    contractFamily: "RecordCallbackOutcomeEvidenceCommandContract",
    purpose:
      "Bind callback outcome truth to CallbackOutcomeEvidenceBundle instead of telephony status or local acknowledgement.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_settle_callback_resolution_gate",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:settle-resolution-gate",
    contractFamily: "SettleCallbackResolutionGateCommandContract",
    purpose:
      "Settle retry, escalation, completion, cancel, or expiry only through the authoritative CallbackResolutionGate.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_reopen_callback_case",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:reopen",
    contractFamily: "ReopenCallbackCaseCommandContract",
    purpose:
      "Reopen a closed callback shell with a fresh CallbackIntentLease and fresh expectation envelope when downstream or lineage drift invalidates the prior closure.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3CallbackPersistenceTables = [
  ...new Set([
    ...phase3TriageKernelPersistenceTables,
    ...phase3DirectResolutionPersistenceTables,
    ...replayCollisionPersistenceTables,
    "phase3_callback_cases",
    "phase3_callback_intent_leases",
    "phase3_callback_attempt_records",
    "phase3_callback_expectation_envelopes",
    "phase3_callback_outcome_evidence_bundles",
    "phase3_callback_resolution_gates",
  ]),
] as const;

export const phase3CallbackMigrationPlanRefs = [
  ...new Set([
    ...phase3TriageKernelMigrationPlanRefs,
    ...phase3DirectResolutionMigrationPlanRefs,
    ...replayCollisionMigrationPlanRefs,
    "services/command-api/migrations/119_phase3_callback_case_domain.sql",
  ]),
] as const;

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

function addMinutes(iso: string, minutes: number): string {
  const date = new Date(iso);
  invariant(!Number.isNaN(date.getTime()), "INVALID_BASE_TIMESTAMP", "Base timestamp is invalid.");
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
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
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function canonicalReceiptPayload(rawReceipt: unknown): string {
  return typeof rawReceipt === "string" ? rawReceipt : JSON.stringify(rawReceipt);
}

function buildCallbackWebhookSignature(timestamp: string, rawPayload: string): string {
  return createHmac("sha256", CALLBACK_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawPayload}`)
    .digest("hex");
}

interface TaskSnapshot {
  taskId: string;
  requestId: string;
  queueKey: string;
  assignedTo: string | null;
  status: string;
  reviewVersion: number;
  version: number;
  launchContextRef: string;
  lifecycleLeaseRef: string | null;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
}

export interface Phase3CallbackApplicationBundle extends Phase3CallbackBundle {
  task: TaskSnapshot;
  callbackSeedRef: string | null;
}

export interface CreateCallbackCaseCommandInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  callbackUrgencyRef: string;
  preferredWindowRef: string;
  serviceWindowRef: string;
  contactRouteRef: string;
  fallbackRouteRef: string;
  retryPolicyRef: string;
  pathwayRef: string;
}

export interface ScheduleCallbackCaseCommandInput extends CreateCallbackCaseCommandInput {
  callbackCaseId: string;
  routeAuthorityState?: CallbackRouteAuthorityState;
  reachabilityDependencyRef?: string | null;
}

export interface CancelCallbackCaseCommandInput {
  taskId: string;
  callbackCaseId: string;
  actorRef: string;
  recordedAt: string;
  cancelReasonRef: string;
}

export interface ArmCallbackReadyCommandInput {
  taskId: string;
  callbackCaseId: string;
  actorRef: string;
  recordedAt: string;
  pathwayRef: string;
  routeAuthorityState?: CallbackRouteAuthorityState;
}

export interface InitiateCallbackAttemptCommandInput {
  taskId: string;
  callbackCaseId: string;
  actorRef: string;
  recordedAt: string;
  dialTargetRef: string;
  providerCorrelationRef?: string | null;
}

export interface RecordCallbackProviderReceiptCommandInput {
  taskId: string;
  callbackCaseId: string;
  actorRef?: string | null;
  recordedAt: string;
  requestUrl: string;
  headers: Record<string, string>;
  transportMessageId: string;
  orderingKey: string;
  rawReceipt: unknown;
  semanticReceipt: Record<string, unknown>;
}

export interface RecordCallbackOutcomeEvidenceCommandInput {
  taskId: string;
  callbackCaseId: string;
  actorRef: string;
  recordedAt: string;
  outcome: CallbackOutcome;
  routeEvidenceRef: string;
  providerDispositionRef?: string | null;
  patientAcknowledgementRef?: string | null;
  safetyClassification: CallbackSafetyClassification;
  safetyPreemptionState: CallbackSafetyPreemptionState;
  pathwayRef: string;
  tenantPolicyRef?: string | null;
  explicitPermissionState: "granted" | "not_granted" | "unknown";
  containsClinicalContent: boolean;
  verifiedTargetState: "verified" | "unknown";
  voicemailEvidenceRefs?: readonly string[];
  reachabilityDependencyRef?: string | null;
}

export interface SettleCallbackResolutionGateCommandInput {
  taskId: string;
  callbackCaseId: string;
  actorRef: string;
  recordedAt: string;
  maxAttempts?: number;
  routeAuthorityState?: CallbackRouteAuthorityState;
  explicitDecision?: CallbackResolutionDecision | null;
  cancelReasonRef?: string | null;
}

export interface ReopenCallbackCaseCommandInput extends CreateCallbackCaseCommandInput {
  callbackCaseId: string;
}

export interface Phase3CallbackDomainApplication {
  readonly serviceName: typeof PHASE3_CALLBACK_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_CALLBACK_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_CALLBACK_QUERY_SURFACES;
  readonly routes: typeof phase3CallbackRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly directResolutionApplication: Phase3DirectResolutionApplication;
  readonly replayApplication: ReplayCollisionApplication;
  readonly repositories: Phase3CallbackKernelRepositories;
  readonly service: Phase3CallbackKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskCallbackDomain(taskId: string): Promise<Phase3CallbackApplicationBundle | null>;
  createCallbackCase(input: CreateCallbackCaseCommandInput): Promise<Phase3CallbackApplicationBundle>;
  scheduleCallbackCase(input: ScheduleCallbackCaseCommandInput): Promise<Phase3CallbackApplicationBundle>;
  rescheduleCallbackCase(input: ScheduleCallbackCaseCommandInput): Promise<Phase3CallbackApplicationBundle>;
  cancelCallbackCase(input: CancelCallbackCaseCommandInput): Promise<Phase3CallbackApplicationBundle>;
  armCallbackReady(input: ArmCallbackReadyCommandInput): Promise<Phase3CallbackApplicationBundle>;
  initiateCallbackAttempt(
    input: InitiateCallbackAttemptCommandInput,
  ): Promise<Phase3CallbackApplicationBundle>;
  recordProviderReceipt(
    input: RecordCallbackProviderReceiptCommandInput,
  ): Promise<Phase3CallbackApplicationBundle>;
  recordOutcomeEvidence(
    input: RecordCallbackOutcomeEvidenceCommandInput,
  ): Promise<Phase3CallbackApplicationBundle>;
  settleResolutionGate(
    input: SettleCallbackResolutionGateCommandInput,
  ): Promise<Phase3CallbackApplicationBundle>;
  reopenCallbackCase(input: ReopenCallbackCaseCommandInput): Promise<Phase3CallbackApplicationBundle>;
}

class Phase3CallbackDomainApplicationImpl implements Phase3CallbackDomainApplication {
  readonly serviceName = PHASE3_CALLBACK_SERVICE_NAME;
  readonly schemaVersion = PHASE3_CALLBACK_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_CALLBACK_QUERY_SURFACES;
  readonly routes = phase3CallbackRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly directResolutionApplication: Phase3DirectResolutionApplication;
  readonly replayApplication: ReplayCollisionApplication;
  readonly repositories: Phase3CallbackKernelRepositories;
  readonly service: Phase3CallbackKernelService;
  readonly persistenceTables = phase3CallbackPersistenceTables;
  readonly migrationPlanRef = phase3CallbackMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3CallbackMigrationPlanRefs;
  private readonly idGenerator: BackboneIdGenerator;
  private readonly leaseAuthority;
  private readonly settlementAuthority;

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    directResolutionApplication?: Phase3DirectResolutionApplication;
    replayApplication?: ReplayCollisionApplication;
    repositories?: Phase3CallbackKernelRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_callback_domain");
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
    this.repositories = options?.repositories ?? createPhase3CallbackKernelStore();
    this.service = createPhase3CallbackKernelService(this.repositories, {
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

  async queryTaskCallbackDomain(taskId: string): Promise<Phase3CallbackApplicationBundle | null> {
    const task = await this.requireTask(taskId);
    const bundle = await this.service.queryCurrentCallbackBundleForTask(taskId);
    if (!bundle) {
      return null;
    }
    return {
      ...bundle,
      task,
      callbackSeedRef: bundle.callbackCase.callbackSeedRef,
    };
  }

  async createCallbackCase(
    input: CreateCallbackCaseCommandInput,
  ): Promise<Phase3CallbackApplicationBundle> {
    const task = await this.requireTask(input.taskId);
    const directResolutionBundle =
      await this.directResolutionApplication.queryTaskDirectResolution(input.taskId);
    const callbackSeed = directResolutionBundle.callbackSeed;
    invariant(callbackSeed, "CALLBACK_SEED_NOT_FOUND", "A live CallbackCaseSeed is required.");
    invariant(callbackSeed.seedState === "live", "CALLBACK_SEED_NOT_LIVE", "CallbackCaseSeed must be live.");

    const createdAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const callbackCaseId = nextApplicationId(this.idGenerator, "phase3_callback_case");
    const lease = await this.acquireCallbackLease({
      callbackCaseId,
      task,
      actorRef: input.actorRef,
      recordedAt: createdAt,
      ownerSessionRef: `session_${input.actorRef}`,
    });
    const initialExpectation = this.buildExpectationEnvelope({
      callbackCaseId,
      routeIntentBindingRef: `route_intent_callback_create_${input.taskId}`,
      patientVisibleState: "queued",
      expectationReasonRef: "CALLBACK_243_WINDOW_ACTIVE",
      policy: resolveCallbackAttemptWindowPolicy({
        callbackUrgencyRef: input.callbackUrgencyRef,
        preferredWindowRef: input.preferredWindowRef,
        serviceWindowRef: input.serviceWindowRef,
        routeAuthorityState: "current",
        recordedAt: createdAt,
      }),
      requiredAssuranceSliceTrustRefs: [],
      continuityEvidenceRef: `callback_continuity_evidence_${callbackCaseId}_create`,
      causalToken: `callback_create_${callbackCaseId}_${createdAt}`,
      createdAt,
    });

    await this.service.createCallbackCase({
      callbackCaseId,
      sourceTriageTaskRef: input.taskId,
      callbackSeedRef: callbackSeed.callbackSeedId,
      episodeRef: callbackSeed.episodeRef,
      requestId: callbackSeed.requestId,
      requestLineageRef: callbackSeed.requestLineageRef,
      lineageCaseLinkRef: callbackSeed.lineageCaseLinkRef,
      decisionEpochRef: callbackSeed.decisionEpochRef,
      decisionId: callbackSeed.decisionId,
      initialCaseState: "queued",
      callbackUrgencyRef: input.callbackUrgencyRef,
      preferredWindowRef: input.preferredWindowRef,
      serviceWindowRef: input.serviceWindowRef,
      contactRouteRef: input.contactRouteRef,
      fallbackRouteRef: input.fallbackRouteRef,
      retryPolicyRef: input.retryPolicyRef,
      reachabilityDependencyRef: null,
      createdAt,
      initialIntentLease: {
        callbackIntentLeaseId: nextApplicationId(this.idGenerator, "callback_intent_lease"),
        requestLifecycleLeaseRef: lease.leaseId,
        leaseAuthorityRef: CALLBACK_LEASE_AUTHORITY_REF,
        ownedByActorRef: input.actorRef,
        ownedBySessionRef: `session_${input.actorRef}`,
        serviceWindowRef: input.serviceWindowRef,
        contactRouteRef: input.contactRouteRef,
        routeIntentBindingRef: `route_intent_callback_create_${input.taskId}`,
        lineageFenceEpoch: lease.lineageFenceEpoch,
        ownershipEpoch: lease.ownershipEpoch,
        fencingToken: lease.fencingToken,
        leaseMode: "queued",
        lastHeartbeatAt: createdAt,
        staleOwnerRecoveryRef: null,
        expiresAt: lease.expiresAt,
      },
      initialExpectationEnvelope: initialExpectation,
    });

    return this.requireCallbackBundle(input.taskId, callbackCaseId);
  }

  async scheduleCallbackCase(
    input: ScheduleCallbackCaseCommandInput,
  ): Promise<Phase3CallbackApplicationBundle> {
    return this.scheduleLike(input, false);
  }

  async rescheduleCallbackCase(
    input: ScheduleCallbackCaseCommandInput,
  ): Promise<Phase3CallbackApplicationBundle> {
    return this.scheduleLike(input, true);
  }

  async cancelCallbackCase(
    input: CancelCallbackCaseCommandInput,
  ): Promise<Phase3CallbackApplicationBundle> {
    const bundle = await this.requireCallbackBundle(input.taskId, input.callbackCaseId);
    const currentIntentLease = bundle.currentIntentLease;
    invariant(currentIntentLease, "CALLBACK_INTENT_LEASE_REQUIRED", "Active CallbackIntentLease is required.");
    const command = await this.issueCallbackCommand({
      bundle,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "callback_cancel",
      semanticPayload: { cancelReasonRef: input.cancelReasonRef },
    });
    const resolution = await this.service.cancelCallback({
      callbackCaseRef: bundle.callbackCase.callbackCaseId,
      nextCaseState: "cancelled",
      resolutionGate: {
        callbackResolutionGateId: nextApplicationId(this.idGenerator, "callback_resolution_gate"),
        latestAttemptRef:
          bundle.latestAttempt?.callbackAttemptRecordId ??
          `callback_attempt_none_${bundle.callbackCase.callbackCaseId}`,
        latestOutcomeEvidenceRef:
          bundle.latestOutcomeEvidenceBundle?.callbackOutcomeEvidenceBundleId ??
          `callback_outcome_none_${bundle.callbackCase.callbackCaseId}`,
        latestExpectationEnvelopeRef: requireRef(
          bundle.currentExpectationEnvelope?.expectationEnvelopeId,
          "currentExpectationEnvelope.expectationEnvelopeId",
        ),
        decision: "cancel",
        decisionReasonRef: input.cancelReasonRef,
        nextActionAt: null,
        stalePromiseRevocationRef: `stale_promise_revocation_${bundle.callbackCase.callbackCaseId}_${input.recordedAt}`,
        requiresLifecycleReview: false,
        causalToken: command.causalToken,
        decidedAt: input.recordedAt,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        callbackCaseId: bundle.callbackCase.callbackCaseId,
        routeIntentBindingRef: command.routeIntentBindingRef,
        patientVisibleState: "closed",
        expectationReasonRef: input.cancelReasonRef,
        policy: resolveCallbackAttemptWindowPolicy({
          callbackUrgencyRef: bundle.callbackCase.callbackUrgencyRef,
          preferredWindowRef: bundle.callbackCase.preferredWindowRef,
          serviceWindowRef: currentIntentLease.serviceWindowRef,
          routeAuthorityState: "current",
          recordedAt: input.recordedAt,
        }),
        requiredAssuranceSliceTrustRefs: [],
        continuityEvidenceRef: `callback_continuity_evidence_${bundle.callbackCase.callbackCaseId}_cancel`,
        causalToken: `${command.causalToken}_expectation`,
        createdAt: input.recordedAt,
      }),
      recordedAt: input.recordedAt,
    });
    await this.releaseCurrentLease(bundle, input.actorRef, input.recordedAt, "callback_cancelled");
    await this.service.closeCallbackCase({
      callbackCaseRef: resolution.callbackCase.callbackCaseId,
      closedAt: input.recordedAt,
    });
    return this.requireCallbackBundle(input.taskId, input.callbackCaseId);
  }

  async armCallbackReady(
    input: ArmCallbackReadyCommandInput,
  ): Promise<Phase3CallbackApplicationBundle> {
    const bundle = await this.requireCallbackBundle(input.taskId, input.callbackCaseId);
    const currentIntentLease = bundle.currentIntentLease;
    invariant(currentIntentLease, "CALLBACK_INTENT_LEASE_REQUIRED", "Active CallbackIntentLease is required.");
    const routeAuthorityState = input.routeAuthorityState ?? "current";
    const policy = resolveCallbackAttemptWindowPolicy({
      callbackUrgencyRef: bundle.callbackCase.callbackUrgencyRef,
      preferredWindowRef: bundle.callbackCase.preferredWindowRef,
      serviceWindowRef: currentIntentLease.serviceWindowRef,
      routeAuthorityState,
      recordedAt: input.recordedAt,
    });
    const readyCaseState =
      policy.windowRiskState === "repair_required"
        ? "contact_route_repair_pending"
        : policy.windowRiskState === "missed_window"
          ? "awaiting_retry"
          : "ready_for_attempt";
    const visibleState =
      readyCaseState === "ready_for_attempt" ? "scheduled" : "retry_planned";
    const command = await this.issueCallbackCommand({
      bundle,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "callback_arm_ready",
      semanticPayload: { routeAuthorityState, pathwayRef: input.pathwayRef },
    });
    await this.service.armCallbackReadyForAttempt({
      callbackCaseRef: bundle.callbackCase.callbackCaseId,
      nextCaseState: readyCaseState,
      intentLease: {
        ...currentIntentLease,
        leaseMode:
          readyCaseState === "ready_for_attempt" ? "ready_for_attempt" : "suspended_for_repair",
        routeIntentBindingRef: command.routeIntentBindingRef,
        lastHeartbeatAt: input.recordedAt,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        callbackCaseId: bundle.callbackCase.callbackCaseId,
        routeIntentBindingRef: command.routeIntentBindingRef,
        patientVisibleState: visibleState,
        expectationReasonRef:
          readyCaseState === "ready_for_attempt"
            ? "CALLBACK_243_READY_FOR_ATTEMPT"
            : policy.fallbackGuidanceRef,
        policy,
        requiredAssuranceSliceTrustRefs: [],
        continuityEvidenceRef: `callback_continuity_evidence_${bundle.callbackCase.callbackCaseId}_armed`,
        causalToken: `${command.causalToken}_expectation`,
        createdAt: input.recordedAt,
      }),
      recordedAt: input.recordedAt,
    });
    return this.requireCallbackBundle(input.taskId, input.callbackCaseId);
  }

  async initiateCallbackAttempt(
    input: InitiateCallbackAttemptCommandInput,
  ): Promise<Phase3CallbackApplicationBundle> {
    const bundle = await this.requireCallbackBundle(input.taskId, input.callbackCaseId);
    const currentIntentLease = bundle.currentIntentLease;
    invariant(currentIntentLease, "CALLBACK_INTENT_LEASE_REQUIRED", "Active CallbackIntentLease is required.");
    const command = await this.issueCallbackCommand({
      bundle,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "callback_initiate_attempt",
      semanticPayload: { dialTargetRef: input.dialTargetRef },
    });
    const effectKey = `callback_attempt::${bundle.callbackCase.callbackCaseId}::${currentIntentLease.lineageFenceEpoch}::${input.dialTargetRef}`;
    const replay = await this.replayApplication.authority.resolveInboundCommand({
      actionScope: "callback_initiate_attempt",
      governingLineageRef: bundle.callbackCase.requestLineageRef,
      effectiveActorRef: input.actorRef,
      sourceCommandId: command.commandActionRecordRef,
      sourceCommandIdFamily: "command_id",
      transportCorrelationId: optionalRef(input.providerCorrelationRef),
      causalParentRef: bundle.callbackCase.callbackSeedRef,
      intentGeneration: currentIntentLease.monotoneRevision,
      expectedEffectSetRefs: [effectKey],
      scope: {
        governingObjectRef: bundle.callbackCase.callbackCaseId,
        governingObjectVersionRef: `${bundle.callbackCase.callbackCaseId}@v${bundle.callbackCase.version}`,
        routeContractDigestRef: "route_contract_digest_callback_initiate_attempt_243_v1",
      },
      rawPayload: { dialTargetRef: input.dialTargetRef, providerCorrelationRef: input.providerCorrelationRef ?? null },
      semanticPayload: {
        callbackCaseId: bundle.callbackCase.callbackCaseId,
        attemptFenceEpoch: currentIntentLease.lineageFenceEpoch,
        dialTargetRef: input.dialTargetRef,
      },
      firstAcceptedActionRecordRef: command.commandActionRecordRef,
      acceptedSettlementRef: command.commandSettlementRecordRef,
      observedAt: input.recordedAt,
    });
    const dispatch = await this.replayApplication.authority.ensureAdapterDispatchAttempt({
      idempotencyRecordRef: replay.idempotencyRecord.idempotencyRecordId,
      actionScope: "callback_initiate_attempt",
      governingLineageRef: bundle.callbackCase.requestLineageRef,
      actionRecordRef: command.commandActionRecordRef,
      adapterContractProfileRef: CALLBACK_ADAPTER_CONTRACT_PROFILE_REF,
      effectScope: `callback_attempt_scope_${bundle.callbackCase.callbackCaseId}`,
      effectKey,
      transportPayload: {
        dialTargetRef: input.dialTargetRef,
        providerRef: "telephony_provider_simulator",
      },
      semanticPayload: {
        callbackCaseId: bundle.callbackCase.callbackCaseId,
        attemptFenceEpoch: currentIntentLease.lineageFenceEpoch,
        dialTargetRef: input.dialTargetRef,
      },
      providerCorrelationRef: optionalRef(input.providerCorrelationRef),
      firstDispatchedAt: input.recordedAt,
    });

    await this.service.initiateCallbackAttempt({
      callbackCaseRef: bundle.callbackCase.callbackCaseId,
      nextCaseState: "attempt_in_progress",
      attempt: {
        callbackAttemptRecordId: nextApplicationId(this.idGenerator, "callback_attempt"),
        callbackIntentLeaseRef: currentIntentLease.callbackIntentLeaseId,
        requestLifecycleLeaseRef: currentIntentLease.requestLifecycleLeaseRef,
        attemptOrdinal: bundle.callbackCase.attemptCounter + 1,
        attemptFenceEpoch: currentIntentLease.lineageFenceEpoch,
        ownershipEpochRef: currentIntentLease.ownershipEpoch,
        fencingToken: currentIntentLease.fencingToken,
        dialTargetRef: input.dialTargetRef,
        channelProviderRef: "telephony_provider_simulator",
        commandActionRecordRef: command.commandActionRecordRef,
        idempotencyRecordRef: replay.idempotencyRecord.idempotencyRecordId,
        adapterDispatchAttemptRef: dispatch.dispatchAttempt.dispatchAttemptId,
        adapterEffectKey: effectKey,
        latestReceiptCheckpointRef: null,
        latestReceiptDecisionClass: null,
        initiatedAt: input.recordedAt,
        settlementState: dispatch.reusedExistingAttempt ? "provider_acked" : "initiated",
        idempotencyKey: replay.idempotencyRecord.toSnapshot().replayKey,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        callbackCaseId: bundle.callbackCase.callbackCaseId,
        routeIntentBindingRef: command.routeIntentBindingRef,
        patientVisibleState: "attempting_now",
        expectationReasonRef: "CALLBACK_243_ATTEMPT_IN_PROGRESS",
        policy: resolveCallbackAttemptWindowPolicy({
          callbackUrgencyRef: bundle.callbackCase.callbackUrgencyRef,
          preferredWindowRef: bundle.callbackCase.preferredWindowRef,
          serviceWindowRef: currentIntentLease.serviceWindowRef,
          routeAuthorityState: "current",
          recordedAt: input.recordedAt,
        }),
        requiredAssuranceSliceTrustRefs: [],
        continuityEvidenceRef: `callback_continuity_evidence_${bundle.callbackCase.callbackCaseId}_attempt`,
        causalToken: `${command.causalToken}_expectation`,
        createdAt: input.recordedAt,
      }),
      recordedAt: input.recordedAt,
    });
    return this.requireCallbackBundle(input.taskId, input.callbackCaseId);
  }

  async recordProviderReceipt(
    input: RecordCallbackProviderReceiptCommandInput,
  ): Promise<Phase3CallbackApplicationBundle> {
    const bundle = await this.requireCallbackBundle(input.taskId, input.callbackCaseId);
    const attempt = bundle.latestAttempt;
    invariant(attempt, "CALLBACK_ATTEMPT_REQUIRED", "A live CallbackAttemptRecord is required.");
    this.verifyCallbackWebhookSignature(input.headers, input.rawReceipt);
    const receiptResult = await this.replayApplication.authority.recordAdapterReceiptCheckpoint({
      actionScope: "callback_provider_receipt",
      governingLineageRef: bundle.callbackCase.requestLineageRef,
      adapterContractProfileRef: CALLBACK_ADAPTER_CONTRACT_PROFILE_REF,
      effectKey: attempt.adapterEffectKey,
      providerCorrelationRef:
        (typeof input.semanticReceipt.providerCorrelationRef === "string"
          ? optionalRef(input.semanticReceipt.providerCorrelationRef)
          : null) ??
        (typeof input.semanticReceipt.callSid === "string"
          ? optionalRef(input.semanticReceipt.callSid)
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
    const settlementState =
      receiptResult.decisionClass === "collision_review"
        ? "reconcile_required"
        : statusClass === "completed" ||
            statusClass === "no_answer" ||
            statusClass === "busy" ||
            statusClass === "failed" ||
            statusClass === "route_invalid"
          ? "outcome_pending"
          : "provider_acked";
    await this.service.observeProviderReceipt({
      callbackCaseRef: bundle.callbackCase.callbackCaseId,
      callbackAttemptRecordId: attempt.callbackAttemptRecordId,
      receiptCheckpointRef: receiptResult.checkpoint.receiptCheckpointId,
      receiptDecisionClass: receiptResult.decisionClass,
      settlementState,
      observedAt: input.recordedAt,
    });
    return this.requireCallbackBundle(input.taskId, input.callbackCaseId);
  }

  async recordOutcomeEvidence(
    input: RecordCallbackOutcomeEvidenceCommandInput,
  ): Promise<Phase3CallbackApplicationBundle> {
    const bundle = await this.requireCallbackBundle(input.taskId, input.callbackCaseId);
    const attempt = bundle.latestAttempt;
    invariant(attempt, "CALLBACK_ATTEMPT_REQUIRED", "A live CallbackAttemptRecord is required.");
    let voicemailDisposition: CallbackVoicemailCompletionDisposition | null = null;
    let voicemailPolicyRef: string | null = null;
    const voicemailEvidenceRefs = [...new Set((input.voicemailEvidenceRefs ?? []).map((value) => value.trim()).filter(Boolean))];
    if (input.outcome === "voicemail_left") {
      const voicemailPolicy = resolveCallbackVoicemailPolicy({
        pathwayRef: input.pathwayRef,
        tenantPolicyRef: optionalRef(input.tenantPolicyRef),
        callbackUrgencyRef: bundle.callbackCase.callbackUrgencyRef,
        explicitPermissionState: input.explicitPermissionState,
        containsClinicalContent: input.containsClinicalContent,
        verifiedTargetState: input.verifiedTargetState,
      });
      invariant(
        voicemailPolicy.voicemailAllowedState === "allowed",
        "CALLBACK_VOICEMAIL_POLICY_BLOCKED",
        "Voicemail cannot be settled without an explicit allowed voicemail policy.",
      );
      for (const requiredEvidenceRef of voicemailPolicy.requiredEvidenceRefs) {
        invariant(
          voicemailEvidenceRefs.includes(requiredEvidenceRef),
          "CALLBACK_VOICEMAIL_EVIDENCE_MISSING",
          `Missing required voicemail evidence ${requiredEvidenceRef}.`,
        );
      }
      voicemailDisposition = voicemailPolicy.completionDisposition;
      voicemailPolicyRef = voicemailPolicy.policyRef;
    }

    const routeAuthorityState =
      input.outcome === "route_invalid" ? "repair_required" : "current";
    const policy = resolveCallbackAttemptWindowPolicy({
      callbackUrgencyRef: bundle.callbackCase.callbackUrgencyRef,
      preferredWindowRef: bundle.callbackCase.preferredWindowRef,
      serviceWindowRef:
        bundle.currentIntentLease?.serviceWindowRef ?? bundle.callbackCase.serviceWindowRef,
      routeAuthorityState,
      recordedAt: input.recordedAt,
    });
    const nextCaseState =
      input.outcome === "route_invalid"
        ? "contact_route_repair_pending"
        : input.outcome === "answered"
          ? "answered"
          : input.outcome === "no_answer"
            ? "no_answer"
            : input.outcome === "voicemail_left"
              ? "voicemail_left"
              : "no_answer";
    const visibleState =
      nextCaseState === "contact_route_repair_pending"
        ? "route_repair_required"
        : nextCaseState === "answered"
          ? "scheduled"
          : "retry_planned";

    await this.service.recordOutcomeEvidence({
      callbackCaseRef: bundle.callbackCase.callbackCaseId,
      nextCaseState,
      reachabilityDependencyRef: optionalRef(input.reachabilityDependencyRef),
      evidenceBundle: {
        callbackOutcomeEvidenceBundleId: nextApplicationId(
          this.idGenerator,
          "callback_outcome_evidence_bundle",
        ),
        attemptRef: attempt.callbackAttemptRecordId,
        attemptFenceEpoch: attempt.attemptFenceEpoch,
        outcome: input.outcome,
        recordedByActorRef: input.actorRef,
        recordedAt: input.recordedAt,
        routeEvidenceRef: input.routeEvidenceRef,
        providerDispositionRef: optionalRef(input.providerDispositionRef),
        patientAcknowledgementRef: optionalRef(input.patientAcknowledgementRef),
        safetyClassification: input.safetyClassification,
        safetyPreemptionState: input.safetyPreemptionState,
        voicemailPolicyRef,
        voicemailEvidenceRefs,
        causalToken: `callback_outcome_${bundle.callbackCase.callbackCaseId}_${attempt.attemptFenceEpoch}_${input.recordedAt}`,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        callbackCaseId: bundle.callbackCase.callbackCaseId,
        routeIntentBindingRef:
          bundle.currentIntentLease?.routeIntentBindingRef ??
          `route_intent_callback_outcome_${bundle.callbackCase.callbackCaseId}`,
        patientVisibleState: visibleState,
        expectationReasonRef:
          nextCaseState === "contact_route_repair_pending"
            ? "CALLBACK_243_CONTACT_ROUTE_REPAIR_REQUIRED"
            : input.outcome === "answered"
              ? "CALLBACK_243_OUTCOME_RECORDED_ANSWERED"
              : input.outcome === "voicemail_left"
                ? "CALLBACK_243_OUTCOME_RECORDED_VOICEMAIL"
                : "CALLBACK_243_OUTCOME_RECORDED_NO_ANSWER",
        policy,
        requiredAssuranceSliceTrustRefs: [],
        continuityEvidenceRef: `callback_continuity_evidence_${bundle.callbackCase.callbackCaseId}_outcome`,
        causalToken: `callback_outcome_expectation_${bundle.callbackCase.callbackCaseId}_${input.recordedAt}`,
        createdAt: input.recordedAt,
      }),
      recordedAt: input.recordedAt,
    });

    return this.requireCallbackBundle(input.taskId, input.callbackCaseId);
  }

  async settleResolutionGate(
    input: SettleCallbackResolutionGateCommandInput,
  ): Promise<Phase3CallbackApplicationBundle> {
    const bundle = await this.requireCallbackBundle(input.taskId, input.callbackCaseId);
    const attempt = bundle.latestAttempt;
    const evidence = bundle.latestOutcomeEvidenceBundle;
    const expectation = bundle.currentExpectationEnvelope;
    invariant(attempt, "CALLBACK_ATTEMPT_REQUIRED", "A live CallbackAttemptRecord is required.");
    invariant(evidence, "CALLBACK_OUTCOME_EVIDENCE_REQUIRED", "A CallbackOutcomeEvidenceBundle is required.");
    invariant(expectation, "CALLBACK_EXPECTATION_REQUIRED", "A CallbackExpectationEnvelope is required.");

    const command = await this.issueCallbackCommand({
      bundle,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "callback_settle_resolution",
      semanticPayload: {
        explicitDecision: input.explicitDecision ?? null,
        cancelReasonRef: input.cancelReasonRef ?? null,
      },
    });
    const voicemailDisposition =
      evidence.outcome === "voicemail_left"
        ? (evidence.voicemailPolicyRef?.includes("allowed")
            ? "retry"
            : null)
        : null;
    const evaluation = evaluateCallbackResolutionDecision({
      latestAttemptOrdinal: attempt.attemptOrdinal,
      maxAttempts: input.maxAttempts ?? 3,
      outcome: evidence.outcome,
      routeAuthorityState: input.routeAuthorityState ?? "current",
      safetyPreemptionState: evidence.safetyPreemptionState,
      expectationWindowUpperAt: expectation.windowUpperAt,
      evaluatedAt: input.recordedAt,
      voicemailDisposition,
      explicitDecision: input.explicitDecision ?? null,
    });
    const routeRequiresRepair = (input.routeAuthorityState ?? "current") !== "current";
    const nextCaseState =
      evaluation.decision === "retry"
        ? evidence.outcome === "route_invalid" || routeRequiresRepair
          ? "contact_route_repair_pending"
          : "awaiting_retry"
        : evaluation.decision === "escalate"
          ? "escalation_review"
          : evaluation.decision === "complete"
            ? "completed"
            : evaluation.decision === "cancel"
              ? "cancelled"
              : "expired";
    const patientVisibleState =
      evaluation.decision === "retry"
        ? evidence.outcome === "route_invalid" || routeRequiresRepair
          ? "route_repair_required"
          : "retry_planned"
        : evaluation.decision === "escalate"
          ? "escalated"
          : "closed";

    await this.service.settleResolutionGate({
      callbackCaseRef: bundle.callbackCase.callbackCaseId,
      nextCaseState,
      resolutionGate: {
        callbackResolutionGateId: nextApplicationId(this.idGenerator, "callback_resolution_gate"),
        latestAttemptRef: attempt.callbackAttemptRecordId,
        latestOutcomeEvidenceRef: evidence.callbackOutcomeEvidenceBundleId,
        latestExpectationEnvelopeRef: expectation.expectationEnvelopeId,
        decision: evaluation.decision,
        decisionReasonRef:
          input.cancelReasonRef && evaluation.decision === "cancel"
            ? input.cancelReasonRef
            : evaluation.decisionReasonRef,
        nextActionAt: evaluation.nextActionAt,
        stalePromiseRevocationRef:
          evaluation.decision === "complete"
            ? null
            : `stale_promise_revocation_${bundle.callbackCase.callbackCaseId}_${input.recordedAt}`,
        requiresLifecycleReview: evaluation.requiresLifecycleReview,
        causalToken: command.causalToken,
        decidedAt: input.recordedAt,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        callbackCaseId: bundle.callbackCase.callbackCaseId,
        routeIntentBindingRef: command.routeIntentBindingRef,
        patientVisibleState,
        expectationReasonRef: evaluation.decisionReasonRef,
        policy: resolveCallbackAttemptWindowPolicy({
          callbackUrgencyRef: bundle.callbackCase.callbackUrgencyRef,
          preferredWindowRef: bundle.callbackCase.preferredWindowRef,
          serviceWindowRef:
            bundle.currentIntentLease?.serviceWindowRef ?? bundle.callbackCase.serviceWindowRef,
          routeAuthorityState:
            evaluation.decision === "retry" && evidence.outcome === "route_invalid"
              ? "repair_required"
              : "current",
          recordedAt: input.recordedAt,
        }),
        requiredAssuranceSliceTrustRefs: [],
        continuityEvidenceRef: `callback_continuity_evidence_${bundle.callbackCase.callbackCaseId}_resolution`,
        causalToken: `${command.causalToken}_expectation`,
        createdAt: input.recordedAt,
      }),
      recordedAt: input.recordedAt,
    });

    if (
      evaluation.decision === "complete" ||
      evaluation.decision === "cancel" ||
      evaluation.decision === "expire"
    ) {
      if (bundle.currentIntentLease) {
        await this.releaseCurrentLease(bundle, input.actorRef, input.recordedAt, evaluation.decision);
      }
      await this.service.closeCallbackCase({
        callbackCaseRef: bundle.callbackCase.callbackCaseId,
        closedAt: input.recordedAt,
      });
    }

    return this.requireCallbackBundle(input.taskId, input.callbackCaseId);
  }

  async reopenCallbackCase(
    input: ReopenCallbackCaseCommandInput,
  ): Promise<Phase3CallbackApplicationBundle> {
    const bundle = await this.requireCallbackBundle(input.taskId, input.callbackCaseId);
    const task = bundle.task;
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const lease = await this.acquireCallbackLease({
      callbackCaseId: bundle.callbackCase.callbackCaseId,
      task,
      actorRef: input.actorRef,
      recordedAt,
      ownerSessionRef: `session_${input.actorRef}`,
    });
    const command = {
      routeIntentBindingRef: `route_intent_callback_reopen_${input.callbackCaseId}`,
      causalToken: `callback_reopen_${input.callbackCaseId}_${recordedAt}`,
    };
    const policy = resolveCallbackAttemptWindowPolicy({
      callbackUrgencyRef: input.callbackUrgencyRef,
      preferredWindowRef: input.preferredWindowRef,
      serviceWindowRef: input.serviceWindowRef,
      routeAuthorityState: "current",
      recordedAt,
    });
    await this.service.reopenCallbackCase({
      callbackCaseRef: bundle.callbackCase.callbackCaseId,
      nextCaseState: "reopened",
      intentLease: {
        callbackIntentLeaseId: nextApplicationId(this.idGenerator, "callback_intent_lease"),
        requestLifecycleLeaseRef: lease.leaseId,
        leaseAuthorityRef: CALLBACK_LEASE_AUTHORITY_REF,
        ownedByActorRef: input.actorRef,
        ownedBySessionRef: `session_${input.actorRef}`,
        serviceWindowRef: input.serviceWindowRef,
        contactRouteRef: input.contactRouteRef,
        routeIntentBindingRef: command.routeIntentBindingRef,
        lineageFenceEpoch: lease.lineageFenceEpoch,
        ownershipEpoch: lease.ownershipEpoch,
        fencingToken: lease.fencingToken,
        leaseMode: "queued",
        monotoneRevision: 1,
        lastHeartbeatAt: recordedAt,
        staleOwnerRecoveryRef: null,
        expiresAt: lease.expiresAt,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        callbackCaseId: bundle.callbackCase.callbackCaseId,
        routeIntentBindingRef: command.routeIntentBindingRef,
        patientVisibleState: "queued",
        expectationReasonRef: "CALLBACK_243_REOPENED",
        policy,
        requiredAssuranceSliceTrustRefs: [],
        continuityEvidenceRef: `callback_continuity_evidence_${bundle.callbackCase.callbackCaseId}_reopen`,
        causalToken: command.causalToken,
        createdAt: recordedAt,
      }),
      reopenedAt: recordedAt,
    });
    return this.requireCallbackBundle(input.taskId, input.callbackCaseId);
  }

  private async scheduleLike(
    input: ScheduleCallbackCaseCommandInput,
    isReschedule: boolean,
  ): Promise<Phase3CallbackApplicationBundle> {
    const bundle = await this.requireCallbackBundle(input.taskId, input.callbackCaseId);
    const routeAuthorityState = input.routeAuthorityState ?? "current";
    const currentLease = bundle.currentIntentLease;
    invariant(currentLease, "CALLBACK_INTENT_LEASE_REQUIRED", "Active CallbackIntentLease is required.");

    const materialChange =
      currentLease.serviceWindowRef !== input.serviceWindowRef ||
      currentLease.contactRouteRef !== input.contactRouteRef ||
      bundle.callbackCase.preferredWindowRef !== input.preferredWindowRef ||
      bundle.callbackCase.callbackUrgencyRef !== input.callbackUrgencyRef;

    let activeLease = currentLease;
    if (materialChange) {
      await this.releaseCurrentLease(
        bundle,
        input.actorRef,
        input.recordedAt,
        isReschedule ? "callback_reschedule" : "callback_schedule",
      );
      const reacquired = await this.acquireCallbackLease({
        callbackCaseId: bundle.callbackCase.callbackCaseId,
        task: bundle.task,
        actorRef: input.actorRef,
        recordedAt: input.recordedAt,
        ownerSessionRef: `session_${input.actorRef}`,
      });
      activeLease = {
        ...currentLease,
        callbackIntentLeaseId: nextApplicationId(this.idGenerator, "callback_intent_lease"),
        requestLifecycleLeaseRef: reacquired.leaseId,
        ownershipEpoch: reacquired.ownershipEpoch,
        fencingToken: reacquired.fencingToken,
        lineageFenceEpoch: reacquired.lineageFenceEpoch,
        expiresAt: reacquired.expiresAt,
      };
    }

    const actionScope = isReschedule ? "callback_reschedule" : "callback_schedule";
    const command = await this.issueCallbackCommand({
      bundle: {
        ...bundle,
        currentIntentLease: activeLease,
      },
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope,
      semanticPayload: {
        callbackUrgencyRef: input.callbackUrgencyRef,
        preferredWindowRef: input.preferredWindowRef,
        serviceWindowRef: input.serviceWindowRef,
        contactRouteRef: input.contactRouteRef,
      },
    });
    const policy = resolveCallbackAttemptWindowPolicy({
      callbackUrgencyRef: input.callbackUrgencyRef,
      preferredWindowRef: input.preferredWindowRef,
      serviceWindowRef: input.serviceWindowRef,
      routeAuthorityState,
      recordedAt: input.recordedAt,
    });

    await this.service.scheduleCallback({
      callbackCaseRef: bundle.callbackCase.callbackCaseId,
      nextCaseState: "scheduled",
      callbackUrgencyRef: input.callbackUrgencyRef,
      preferredWindowRef: input.preferredWindowRef,
      fallbackRouteRef: input.fallbackRouteRef,
      reachabilityDependencyRef: optionalRef(input.reachabilityDependencyRef),
      intentLease: {
        callbackIntentLeaseId: activeLease.callbackIntentLeaseId,
        requestLifecycleLeaseRef: activeLease.requestLifecycleLeaseRef,
        leaseAuthorityRef: CALLBACK_LEASE_AUTHORITY_REF,
        ownedByActorRef: input.actorRef,
        ownedBySessionRef: `session_${input.actorRef}`,
        serviceWindowRef: input.serviceWindowRef,
        contactRouteRef: input.contactRouteRef,
        routeIntentBindingRef: command.routeIntentBindingRef,
        lineageFenceEpoch: activeLease.lineageFenceEpoch,
        ownershipEpoch: activeLease.ownershipEpoch,
        fencingToken: activeLease.fencingToken,
        leaseMode: "scheduled",
        monotoneRevision: activeLease.monotoneRevision,
        lastHeartbeatAt: input.recordedAt,
        staleOwnerRecoveryRef: null,
        expiresAt: activeLease.expiresAt,
      },
      expectationEnvelope: this.buildExpectationEnvelope({
        callbackCaseId: bundle.callbackCase.callbackCaseId,
        routeIntentBindingRef: command.routeIntentBindingRef,
        patientVisibleState:
          policy.windowRiskState === "repair_required" ? "route_repair_required" : "scheduled",
        expectationReasonRef:
          isReschedule
            ? "CALLBACK_243_EXPECTATION_RESCHEDULED"
            : "CALLBACK_243_EXPECTATION_SCHEDULED",
        policy,
        requiredAssuranceSliceTrustRefs: [],
        continuityEvidenceRef: `callback_continuity_evidence_${bundle.callbackCase.callbackCaseId}_${actionScope}`,
        causalToken: `${command.causalToken}_expectation`,
        createdAt: input.recordedAt,
      }),
      recordedAt: input.recordedAt,
    });

    return this.requireCallbackBundle(input.taskId, input.callbackCaseId);
  }

  private buildExpectationEnvelope(input: {
    callbackCaseId: string;
    routeIntentBindingRef: string;
    patientVisibleState: "queued" | "scheduled" | "attempting_now" | "retry_planned" | "route_repair_required" | "escalated" | "closed";
    expectationReasonRef: string;
    policy: ReturnType<typeof resolveCallbackAttemptWindowPolicy>;
    requiredAssuranceSliceTrustRefs: readonly string[];
    continuityEvidenceRef: string;
    causalToken: string;
    createdAt: string;
  }): NonNullable<CreateCallbackCaseInput["initialExpectationEnvelope"]> {
    const confidenceBand: CallbackStateConfidenceBand = input.policy.stateConfidenceBand;
    return {
      expectationEnvelopeId: nextApplicationId(this.idGenerator, "callback_expectation_envelope"),
      identityRepairBranchDispositionRef: null,
      patientVisibleState: input.patientVisibleState,
      expectedWindowRef: input.policy.expectedWindowRef,
      windowLowerAt: input.policy.windowLowerAt,
      windowUpperAt: input.policy.windowUpperAt,
      windowRiskState: input.policy.windowRiskState,
      stateConfidenceBand: confidenceBand,
      predictionModelRef: input.policy.predictionModelRef,
      fallbackGuidanceRef: input.policy.fallbackGuidanceRef,
      grantSetRef: null,
      routeIntentBindingRef: input.routeIntentBindingRef,
      requiredReleaseApprovalFreezeRef: null,
      channelReleaseFreezeState: "open",
      requiredAssuranceSliceTrustRefs: input.requiredAssuranceSliceTrustRefs,
      transitionEnvelopeRef: `transition_envelope_${input.callbackCaseId}_${input.createdAt}`,
      continuityEvidenceRef: input.continuityEvidenceRef,
      causalToken: input.causalToken,
      freezeDispositionRef: null,
      expectationReasonRef: input.expectationReasonRef,
      createdAt: input.createdAt,
    };
  }

  private async requireCallbackBundle(
    taskId: string,
    callbackCaseId: string,
  ): Promise<Phase3CallbackApplicationBundle> {
    const task = await this.requireTask(taskId);
    const bundle = await this.service.queryCallbackBundle(callbackCaseId);
    invariant(
      bundle.callbackCase.sourceTriageTaskRef === taskId,
      "CALLBACK_CASE_TASK_MISMATCH",
      `CallbackCase ${callbackCaseId} does not belong to task ${taskId}.`,
    );
    return {
      ...bundle,
      task,
      callbackSeedRef: bundle.callbackCase.callbackSeedRef,
    };
  }

  private async requireTask(taskId: string): Promise<TaskSnapshot> {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} is required.`);
    const snapshot = task.toSnapshot();
    return {
      taskId: snapshot.taskId,
      requestId: snapshot.requestId,
      queueKey: snapshot.queueKey,
      assignedTo: snapshot.assignedTo,
      status: snapshot.status,
      reviewVersion: snapshot.reviewVersion,
      version: snapshot.version,
      launchContextRef: snapshot.launchContextRef,
      lifecycleLeaseRef: snapshot.lifecycleLeaseRef,
      ownershipEpoch: snapshot.ownershipEpoch,
      fencingToken: snapshot.fencingToken,
      currentLineageFenceEpoch: snapshot.currentLineageFenceEpoch,
    };
  }

  private async acquireCallbackLease(input: {
    callbackCaseId: string;
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
      domain: CALLBACK_DOMAIN,
      domainObjectRef: input.callbackCaseId,
      leaseAuthorityRef: CALLBACK_LEASE_AUTHORITY_REF,
      ownerActorRef: input.actorRef,
      ownerSessionRef: input.ownerSessionRef,
      governingObjectVersionRef: `${input.callbackCaseId}@v1`,
      leaseScopeComponents: ["callback_schedule", "callback_mutation"],
      leaseTtlSeconds: 1800,
      acquiredAt: input.recordedAt,
      sameShellRecoveryRouteRef: this.callbackRecoveryRoute(input.task.taskId, input.callbackCaseId),
      operatorVisibleWorkRef: `callback_case_${input.callbackCaseId}`,
      blockedActionScopeRefs: ["callback_schedule", "callback_attempt"],
    });
    const leaseSnapshot = acquired.lease.toSnapshot();
    return {
      leaseId: leaseSnapshot.leaseId,
      ownershipEpoch: leaseSnapshot.ownershipEpoch,
      fencingToken: leaseSnapshot.fencingToken,
      lineageFenceEpoch: acquired.lineageFence.currentEpoch,
      expiresAt: addSeconds(leaseSnapshot.heartbeatAt, leaseSnapshot.leaseTtlSeconds),
    };
  }

  private async releaseCurrentLease(
    bundle: Phase3CallbackApplicationBundle,
    actorRef: string,
    recordedAt: string,
    reason: string,
  ): Promise<void> {
    const currentIntentLease = bundle.currentIntentLease;
    if (!currentIntentLease) {
      return;
    }
    await this.leaseAuthority.releaseLease({
      domain: CALLBACK_DOMAIN,
      domainObjectRef: bundle.callbackCase.callbackCaseId,
      leaseId: currentIntentLease.requestLifecycleLeaseRef,
      presentedOwnershipEpoch: currentIntentLease.ownershipEpoch,
      presentedFencingToken: currentIntentLease.fencingToken,
      releasedAt: recordedAt,
      closeBlockReason: reason,
      sameShellRecoveryRouteRef: this.callbackRecoveryRoute(
        bundle.task.taskId,
        bundle.callbackCase.callbackCaseId,
      ),
      operatorVisibleWorkRef: `callback_case_${bundle.callbackCase.callbackCaseId}`,
      blockedActionScopeRefs: ["callback_schedule", "callback_attempt"],
      detectedByRef: actorRef,
    });
  }

  private async issueCallbackCommand(input: {
    bundle: Phase3CallbackApplicationBundle;
    actorRef: string;
    recordedAt: string;
    actionScope: string;
    semanticPayload: Record<string, unknown>;
  }) {
    const lease = input.bundle.currentIntentLease;
    invariant(lease, "CALLBACK_INTENT_LEASE_REQUIRED", "Active CallbackIntentLease is required.");
    const governingObjectVersionRef = await this.currentCallbackControlPlaneVersionRef(
      input.bundle.callbackCase.callbackCaseId,
      `${input.bundle.callbackCase.callbackCaseId}@v${input.bundle.callbackCase.version}`,
    );
    const action = await this.leaseAuthority.registerCommandAction({
      leaseId: requireRef(lease.requestLifecycleLeaseRef, "requestLifecycleLeaseRef"),
      domain: CALLBACK_DOMAIN,
      domainObjectRef: input.bundle.callbackCase.callbackCaseId,
      governingObjectVersionRef,
      presentedOwnershipEpoch: lease.ownershipEpoch,
      presentedFencingToken: lease.fencingToken,
      presentedLineageFenceEpoch: lease.lineageFenceEpoch,
      actionScope: input.actionScope,
      governingObjectRef: input.bundle.callbackCase.callbackCaseId,
      canonicalObjectDescriptorRef: CALLBACK_DESCRIPTOR,
      initiatingBoundedContextRef: CALLBACK_DOMAIN,
      governingBoundedContextRef: CALLBACK_DOMAIN,
      lineageScope: "request",
      routeIntentRef: `route_intent_${input.actionScope}_${input.bundle.callbackCase.callbackCaseId}`,
      routeContractDigestRef: `route_contract_digest_${input.actionScope}_243_v1`,
      requiredContextBoundaryRefs: [],
      parentAnchorRef: input.bundle.task.launchContextRef,
      edgeCorrelationId: `edge_${input.actionScope}_${input.bundle.callbackCase.callbackCaseId}`,
      initiatingUiEventRef: `ui_event_${input.actionScope}_${input.bundle.callbackCase.callbackCaseId}`,
      initiatingUiEventCausalityFrameRef: `ui_frame_${input.actionScope}_${input.bundle.callbackCase.callbackCaseId}`,
      actingContextRef: "staff_workspace",
      policyBundleRef: "policy_phase3_callback_domain_243.v1",
      sourceCommandId: `cmd_${input.actionScope}_${input.bundle.callbackCase.callbackCaseId}_${input.recordedAt}`,
      transportCorrelationId: `transport_${input.actionScope}_${input.bundle.callbackCase.callbackCaseId}`,
      semanticPayload: input.semanticPayload,
      idempotencyKey: `idempotency_${input.actionScope}_${input.bundle.callbackCase.callbackCaseId}_${input.recordedAt}`,
      idempotencyRecordRef: `idempotency_record_${input.actionScope}_${input.bundle.callbackCase.callbackCaseId}`,
      commandFollowingTokenRef: `command_follow_${input.actionScope}_${input.bundle.callbackCase.callbackCaseId}`,
      expectedEffectSetRefs: [`callback.${input.bundle.callbackCase.callbackCaseId}.${input.actionScope}`],
      causalToken: `causal_${input.actionScope}_${input.bundle.callbackCase.callbackCaseId}_${input.recordedAt}`,
      createdAt: input.recordedAt,
      sameShellRecoveryRouteRef: this.callbackRecoveryRoute(
        input.bundle.task.taskId,
        input.bundle.callbackCase.callbackCaseId,
      ),
      operatorVisibleWorkRef: `callback_case_${input.bundle.callbackCase.callbackCaseId}`,
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
      sameShellRecoveryRef: this.callbackRecoveryRoute(
        input.bundle.task.taskId,
        input.bundle.callbackCase.callbackCaseId,
      ),
      projectionVersionRef: `${input.bundle.callbackCase.callbackCaseId}@projection_${input.recordedAt}`,
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

  private async currentCallbackControlPlaneVersionRef(
    callbackCaseId: string,
    fallback: string,
  ): Promise<string> {
    const authorityState = await this.triageApplication.controlPlaneRepositories.getLeaseAuthorityState(
      `${CALLBACK_DOMAIN}::${callbackCaseId}`,
    );
    return authorityState?.governingObjectVersionRef ?? fallback;
  }

  private verifyCallbackWebhookSignature(headers: Record<string, string>, rawReceipt: unknown): void {
    const timestamp = headerLookup(headers, CALLBACK_WEBHOOK_TIMESTAMP_HEADER);
    const signature = headerLookup(headers, CALLBACK_WEBHOOK_SIGNATURE_HEADER);
    invariant(timestamp, "CALLBACK_WEBHOOK_TIMESTAMP_MISSING", "Callback webhook timestamp header is required.");
    invariant(signature, "CALLBACK_WEBHOOK_SIGNATURE_MISSING", "Callback webhook signature header is required.");
    const expected = buildCallbackWebhookSignature(timestamp, canonicalReceiptPayload(rawReceipt));
    invariant(
      stableTimingCompare(signature, expected),
      "CALLBACK_WEBHOOK_SIGNATURE_REJECTED",
      `Callback webhook signature failed verification under ${CALLBACK_WEBHOOK_SIGNATURE_POLICY_VERSION}.`,
    );
  }

  private callbackRecoveryRoute(taskId: string, callbackCaseId: string): string {
    return `/workspace/tasks/${taskId}/callback/${callbackCaseId}/recover`;
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
}

export function createPhase3CallbackDomainApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  directResolutionApplication?: Phase3DirectResolutionApplication;
  replayApplication?: ReplayCollisionApplication;
  repositories?: Phase3CallbackKernelRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3CallbackDomainApplication {
  return new Phase3CallbackDomainApplicationImpl(options);
}
