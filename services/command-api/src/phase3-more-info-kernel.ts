import {
  createAccessGrantService,
  createIdentityAccessStore,
  createLeaseFenceCommandAuthorityService,
  type AccessGrantDocument,
  type AccessGrantIssueResult,
  type AccessGrantMaterializedToken,
  type IdentityAccessDependencies,
} from "@vecells/domain-identity-access";
import {
  computeMoreInfoWorkerEffectKey,
  createPhase3MoreInfoKernelService,
  createPhase3MoreInfoKernelStore,
  resolveQuietHoursReleaseAt,
  resolveReplyWindowState,
  type CreateMoreInfoCycleInput,
  type MoreInfoCycleSnapshot,
  type MoreInfoKernelBundle,
  type MoreInfoKernelRepositories,
  type MoreInfoQuietHoursWindow,
  type MoreInfoReminderScheduleSnapshot,
  type MoreInfoReplyWindowCheckpointSnapshot,
} from "@vecells/domain-triage-workspace";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  accessGrantMigrationPlanRefs,
  accessGrantPersistenceTables,
} from "./access-grant";
import {
  createPhase3TriageKernelApplication,
  phase3TriageKernelMigrationPlanRefs,
  phase3TriageKernelPersistenceTables,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

const MORE_INFO_DOMAIN = "triage_more_info";
const MORE_INFO_LEASE_AUTHORITY_REF = "lease_authority_triage_more_info";
export const PHASE3_MORE_INFO_SERVICE_NAME = "Phase3MoreInfoKernelApplication";
export const PHASE3_MORE_INFO_SCHEMA_VERSION = "236.phase3.more-info-kernel.v1";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(typeof value === "string" && value.trim().length > 0, `INVALID_${field.toUpperCase()}`, `${field} is required.`);
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
  invariant(!Number.isNaN(Date.parse(normalized)), `INVALID_${field.toUpperCase()}_TIMESTAMP`, `${field} must be a valid ISO-8601 timestamp.`);
  return normalized;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function addMinutes(isoTimestamp: string, minutes: number): string {
  return new Date(Date.parse(isoTimestamp) + minutes * 60_000).toISOString();
}

function minIso(left: string, right: string): string {
  return compareIso(left, right) <= 0 ? left : right;
}

function nextMoreInfoId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export type MoreInfoOutboxEffectType =
  | "initial_delivery"
  | "reminder_send"
  | "callback_fallback_seed";

export type MoreInfoOutboxDispatchState = "pending" | "dispatched" | "cancelled";

export interface MoreInfoOutboxEntrySnapshot {
  outboxEntryId: string;
  cycleId: string;
  checkpointRef: string;
  scheduleRef: string;
  requestLineageRef: string;
  effectType: MoreInfoOutboxEffectType;
  effectKey: string;
  reminderOrdinal: number | null;
  dispatchState: MoreInfoOutboxDispatchState;
  reasonRef: string | null;
  dueAt: string;
  createdAt: string;
  dispatchedAt: string | null;
  cancelledAt: string | null;
  version: number;
}

export interface MoreInfoReachabilityPosture {
  summaryState: "clear" | "degraded" | "blocked";
  deliveryRiskState: "on_track" | "at_risk" | "likely_failed" | "disputed";
  blockedReasonRef?: string | null;
  callbackFallbackAllowed?: boolean;
}

export interface RequestMoreInfoInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  promptSetRef: string;
  channelRef: string;
  responseRouteFamilyRef: string;
  dueAt: string;
  expiresAt: string;
  reminderOffsetsMinutes: readonly number[];
  cadencePolicyRef: string;
  quietHoursWindow?: MoreInfoQuietHoursWindow | null;
  responseGrantExpiresAt?: string | null;
  responseRecoveryRouteRef?: string | null;
  supersedeActiveCycleId?: string | null;
  cycleLeaseTtlSeconds?: number;
}

export interface RequestMoreInfoResult {
  cycle: MoreInfoCycleSnapshot;
  checkpoint: MoreInfoReplyWindowCheckpointSnapshot;
  schedule: MoreInfoReminderScheduleSnapshot;
  taskTransition:
    | Awaited<ReturnType<Phase3TriageKernelApplication["markAwaitingPatientInfo"]>>
    | null;
  responseGrant: {
    grantRef: string | null;
    materializedToken: AccessGrantMaterializedToken | null;
  };
  supersededCycle: MoreInfoKernelBundle | null;
  initialOutboxEntry: MoreInfoOutboxEntrySnapshot;
}

export interface ReceiveMoreInfoPatientResponseInput {
  cycleId: string;
  receivedAt: string;
  repairBlocked?: boolean;
}

export interface ResumeReviewFromMoreInfoInput {
  taskId: string;
  cycleId: string;
  actorRef: string;
  resumedAt: string;
}

export interface DrainMoreInfoReminderWorkerInput {
  evaluatedAt: string;
  reachabilityByCycleId?: Readonly<Record<string, MoreInfoReachabilityPosture>>;
}

export interface SupersedeMoreInfoCycleInput {
  cycleId: string;
  replacementCycleId: string;
  actorRef: string;
  recordedAt: string;
}

export interface CancelMoreInfoCycleInput {
  cycleId: string;
  actorRef: string;
  recordedAt: string;
  cancellationReasonRef?: string | null;
}

export interface RecomputeMoreInfoCheckpointInput {
  cycleId: string;
  evaluatedAt: string;
  reachability?: MoreInfoReachabilityPosture | null;
}

export interface MarkMoreInfoReminderDueInput {
  cycleId: string;
  evaluatedAt: string;
}

export interface DispatchMoreInfoReminderInput {
  cycleId: string;
  dispatchedAt: string;
}

export interface SuppressMoreInfoReminderCommandInput {
  cycleId: string;
  suppressedAt: string;
  reasonRef: string;
  nextQuietHoursReleaseAt?: string | null;
  replyWindowState?: "reminder_due" | "blocked_repair";
  repairRequiredReasonRef?: string | null;
}

export interface ExpireMoreInfoCycleInput {
  cycleId: string;
  actorRef: string;
  recordedAt: string;
}

export interface DispatchMoreInfoReminderResult extends MoreInfoKernelBundle {
  outboxEntry: MoreInfoOutboxEntrySnapshot;
}

export interface MoreInfoWorkerDispatchRecord {
  cycleId: string;
  effectType:
    | "initial_delivery"
    | "reminder_send"
    | "callback_fallback_seed"
    | "suppressed"
    | "expired";
  outboxEntryRef: string | null;
  reasonRef: string | null;
  recordedAt: string;
}

export const phase3MoreInfoRoutes = [
  {
    routeId: "workspace_task_more_info_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/more-info",
    contractFamily: "MoreInfoCycleBundleContract",
  },
  {
    routeId: "workspace_task_request_more_info",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:request-more-info",
    contractFamily: "MoreInfoCycleRequestCommandContract",
  },
  {
    routeId: "workspace_task_supersede_more_info",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:supersede",
    contractFamily: "MoreInfoCycleSupersessionCommandContract",
  },
  {
    routeId: "workspace_task_cancel_more_info",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:cancel",
    contractFamily: "MoreInfoCycleCancellationCommandContract",
  },
  {
    routeId: "workspace_task_recompute_more_info_checkpoint",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:recompute-checkpoint",
    contractFamily: "MoreInfoReplyWindowRecomputeCommandContract",
  },
  {
    routeId: "workspace_task_mark_more_info_reminder_due",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:mark-reminder-due",
    contractFamily: "MoreInfoReminderDueCommandContract",
  },
  {
    routeId: "workspace_task_dispatch_more_info_reminder",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:dispatch-reminder",
    contractFamily: "MoreInfoReminderDispatchCommandContract",
  },
  {
    routeId: "workspace_task_suppress_more_info_reminder",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:suppress-reminder",
    contractFamily: "MoreInfoReminderSuppressionCommandContract",
  },
  {
    routeId: "workspace_task_expire_more_info_cycle",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:expire",
    contractFamily: "MoreInfoCycleExpiryCommandContract",
  },
  {
    routeId: "workspace_more_info_worker_drain",
    method: "POST",
    path: "/internal/v1/workspace/more-info:drain-worker",
    contractFamily: "MoreInfoWorkerDrainCommandContract",
  },
] as const;

export const PHASE3_MORE_INFO_QUERY_SURFACES = phase3MoreInfoRoutes
  .filter((route) => route.method === "GET")
  .map((route) => route.path);

export interface Phase3MoreInfoKernelApplication {
  readonly serviceName: typeof PHASE3_MORE_INFO_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_MORE_INFO_SCHEMA_VERSION;
  readonly querySurfaces: readonly string[];
  readonly routes: typeof phase3MoreInfoRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly moreInfoRepositories: MoreInfoKernelRepositories;
  readonly identityRepositories: IdentityAccessDependencies;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  requestMoreInfo(input: RequestMoreInfoInput): Promise<RequestMoreInfoResult>;
  queryTaskMoreInfo(taskId: string): Promise<MoreInfoKernelBundle | null>;
  getCurrentTaskMoreInfo(taskId: string): Promise<MoreInfoKernelBundle | null>;
  supersedeActiveCycle(input: SupersedeMoreInfoCycleInput): Promise<MoreInfoKernelBundle>;
  cancelCycle(input: CancelMoreInfoCycleInput): Promise<MoreInfoKernelBundle>;
  recomputeCheckpoint(input: RecomputeMoreInfoCheckpointInput): Promise<MoreInfoKernelBundle>;
  markReminderDue(input: MarkMoreInfoReminderDueInput): Promise<MoreInfoKernelBundle>;
  dispatchReminder(input: DispatchMoreInfoReminderInput): Promise<DispatchMoreInfoReminderResult>;
  suppressReminder(input: SuppressMoreInfoReminderCommandInput): Promise<MoreInfoKernelBundle>;
  expireCycle(input: ExpireMoreInfoCycleInput): Promise<MoreInfoKernelBundle>;
  receivePatientResponse(input: ReceiveMoreInfoPatientResponseInput): Promise<{
    classification: string;
    cycle: MoreInfoCycleSnapshot;
    checkpoint: MoreInfoReplyWindowCheckpointSnapshot;
    schedule: MoreInfoReminderScheduleSnapshot;
  }>;
  resumeReviewFromPatientResponse(input: ResumeReviewFromMoreInfoInput): Promise<{
    cycle: MoreInfoCycleSnapshot;
    checkpoint: MoreInfoReplyWindowCheckpointSnapshot;
    schedule: MoreInfoReminderScheduleSnapshot;
    taskTransition: Awaited<ReturnType<Phase3TriageKernelApplication["markReviewResumed"]>>;
  }>;
  drainReminderWorker(input: DrainMoreInfoReminderWorkerInput): Promise<{
    dispatched: readonly MoreInfoWorkerDispatchRecord[];
    outboxEntries: readonly MoreInfoOutboxEntrySnapshot[];
  }>;
  listOutboxEntries(): readonly MoreInfoOutboxEntrySnapshot[];
}

export const phase3MoreInfoKernelPersistenceTables = [
  ...new Set([
    ...phase3TriageKernelPersistenceTables,
    ...accessGrantPersistenceTables,
    "phase3_more_info_cycles",
    "phase3_more_info_reply_window_checkpoints",
    "phase3_more_info_reminder_schedules",
    "phase3_more_info_outbox_entries",
  ]),
] as const;

export const phase3MoreInfoKernelMigrationPlanRefs = [
  ...new Set([
    ...phase3TriageKernelMigrationPlanRefs,
    ...accessGrantMigrationPlanRefs,
    "services/command-api/migrations/112_phase3_more_info_cycle_kernel.sql",
  ]),
] as const;

class Phase3MoreInfoKernelApplicationImpl implements Phase3MoreInfoKernelApplication {
  readonly serviceName = PHASE3_MORE_INFO_SERVICE_NAME;
  readonly schemaVersion = PHASE3_MORE_INFO_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_MORE_INFO_QUERY_SURFACES;
  readonly routes = phase3MoreInfoRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly moreInfoRepositories: MoreInfoKernelRepositories;
  readonly identityRepositories: IdentityAccessDependencies;
  readonly persistenceTables = phase3MoreInfoKernelPersistenceTables;
  readonly migrationPlanRef = phase3MoreInfoKernelMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3MoreInfoKernelMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;
  private readonly moreInfoService;
  private readonly accessGrantService;
  private readonly leaseAuthority;
  private readonly outboxEntries = new Map<string, MoreInfoOutboxEntrySnapshot>();
  private readonly outboxByEffectKey = new Map<string, string>();

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    moreInfoRepositories?: MoreInfoKernelRepositories;
    identityRepositories?: IdentityAccessDependencies;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ?? createDeterministicBackboneIdGenerator("command_api_phase3_more_info");
    this.triageApplication =
      options?.triageApplication ?? createPhase3TriageKernelApplication();
    this.moreInfoRepositories =
      options?.moreInfoRepositories ?? createPhase3MoreInfoKernelStore();
    this.identityRepositories = options?.identityRepositories ?? createIdentityAccessStore();
    this.moreInfoService = createPhase3MoreInfoKernelService(this.moreInfoRepositories, {
      idGenerator: this.idGenerator,
    });
    this.accessGrantService = createAccessGrantService(
      this.identityRepositories,
      this.idGenerator,
    );
    this.leaseAuthority = createLeaseFenceCommandAuthorityService(
      this.triageApplication.controlPlaneRepositories,
      this.idGenerator,
    );
  }

  listOutboxEntries(): readonly MoreInfoOutboxEntrySnapshot[] {
    return [...this.outboxEntries.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async queryTaskMoreInfo(taskId: string): Promise<MoreInfoKernelBundle | null> {
    const cycle = await this.moreInfoRepositories.findLatestCycleForTask(taskId);
    if (!cycle) {
      return null;
    }
    const checkpoint = await this.moreInfoRepositories.getReplyWindowCheckpoint(
      cycle.toSnapshot().activeCheckpointRef,
    );
    const schedule = await this.moreInfoRepositories.getReminderSchedule(
      cycle.toSnapshot().reminderScheduleRef,
    );
    invariant(checkpoint && schedule, "MORE_INFO_BUNDLE_INCOMPLETE", "Current more-info bundle is incomplete.");
    return {
      cycle: cycle.toSnapshot(),
      checkpoint: checkpoint.toSnapshot(),
      schedule: schedule.toSnapshot(),
    };
  }

  async getCurrentTaskMoreInfo(taskId: string): Promise<MoreInfoKernelBundle | null> {
    return this.queryTaskMoreInfo(taskId);
  }

  async requestMoreInfo(input: RequestMoreInfoInput): Promise<RequestMoreInfoResult> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const task = await this.requireTask(input.taskId);
    invariant(
      task.toSnapshot().status === "in_review" ||
        task.toSnapshot().status === "awaiting_patient_info",
      "TASK_NOT_READY_FOR_MORE_INFO",
      "requestMoreInfo requires the task to be in_review or awaiting_patient_info.",
    );
    const request = await this.triageApplication.controlPlaneRepositories.getRequest(
      task.toSnapshot().requestId,
    );
    invariant(request, "REQUEST_NOT_FOUND", `Request ${task.toSnapshot().requestId} was not found.`);
    const cycleId = nextMoreInfoId(this.idGenerator, "phase3_more_info_cycle");

    let supersededCycle: MoreInfoKernelBundle | null = null;
    const liveCycle = await this.moreInfoRepositories.findLiveCycleForLineage(
      request.requestLineageRef,
    );
    if (liveCycle) {
      invariant(
        liveCycle.toSnapshot().cycleId === optionalRef(input.supersedeActiveCycleId),
        "EXPLICIT_SUPERSESSION_REQUIRED",
        "A live MoreInfoCycle must be explicitly superseded before replacement.",
      );
      supersededCycle = await this.supersedeCycle(liveCycle.toSnapshot(), cycleId, recordedAt);
    }

    const acquired = await this.leaseAuthority.acquireLease({
      requestId: task.toSnapshot().requestId,
      episodeId: request.episodeId,
      requestLineageRef: request.requestLineageRef,
      domain: MORE_INFO_DOMAIN,
      domainObjectRef: cycleId,
      leaseAuthorityRef: MORE_INFO_LEASE_AUTHORITY_REF,
      ownerActorRef: input.actorRef,
      ownerWorkerRef: "more_info_cycle_kernel",
      governingObjectVersionRef: `${cycleId}@v1`,
      leaseScopeComponents: ["respond_more_info", "more_info_timer", "reminder_scheduler"],
      leaseTtlSeconds: input.cycleLeaseTtlSeconds ?? 1800,
      acquiredAt: recordedAt,
      sameShellRecoveryRouteRef: this.responseRecoveryRoute(task.toSnapshot().requestId),
      operatorVisibleWorkRef: `more_info_${cycleId}`,
      blockedActionScopeRefs: ["respond_more_info", "contact_route_repair"],
    });

    const issuedGrant = await this.issueResponseGrant({
      cycleId,
      responseRouteFamilyRef: input.responseRouteFamilyRef,
      recordedAt,
      responseGrantExpiresAt:
        optionalRef(input.responseGrantExpiresAt) ??
        minIso(addMinutes(recordedAt, 20), ensureIsoTimestamp(input.dueAt, "dueAt")),
      responseRecoveryRouteRef:
        optionalRef(input.responseRecoveryRouteRef) ??
        this.responseRecoveryRoute(task.toSnapshot().requestId),
      lineageFenceEpoch: acquired.lineageFence.currentEpoch,
    });

    const cycleBundle = await this.moreInfoService.createCycle({
      cycleId,
      taskId: input.taskId,
      requestId: task.toSnapshot().requestId,
      requestLineageRef: request.requestLineageRef,
      promptSetRef: input.promptSetRef,
      channelRef: input.channelRef,
      responseRouteFamilyRef: input.responseRouteFamilyRef,
      dueAt: input.dueAt,
      expiresAt: input.expiresAt,
      reminderOffsetsMinutes: input.reminderOffsetsMinutes,
      cadencePolicyRef: input.cadencePolicyRef,
      quietHoursWindow: input.quietHoursWindow ?? null,
      lifecycleLeaseRef: acquired.lease.toSnapshot().leaseId,
      leaseAuthorityRef: MORE_INFO_LEASE_AUTHORITY_REF,
      ownershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
      fencingToken: acquired.lease.toSnapshot().fencingToken,
      currentLineageFenceEpoch: acquired.lineageFence.currentEpoch,
      responseGrantRef: issuedGrant.grantRef,
      responseGrantExpiresAt:
        issuedGrant.grantExpiresAt ??
        optionalRef(input.responseGrantExpiresAt) ??
        minIso(addMinutes(recordedAt, 20), ensureIsoTimestamp(input.dueAt, "dueAt")),
      supersedesCycleRef: supersededCycle?.cycle.cycleId ?? null,
      createdAt: recordedAt,
    } satisfies CreateMoreInfoCycleInput);

    const initialOutboxEntry = this.ensureOutboxEntry({
      cycle: cycleBundle.cycle,
      checkpoint: cycleBundle.checkpoint,
      schedule: cycleBundle.schedule,
      effectType: "initial_delivery",
      reminderOrdinal: null,
      reasonRef: null,
      dueAt: recordedAt,
      createdAt: recordedAt,
    });

    const taskTransition =
      task.toSnapshot().status === "awaiting_patient_info"
        ? null
        : await this.triageApplication.markAwaitingPatientInfo({
            taskId: input.taskId,
            actorRef: input.actorRef,
            recordedAt,
            moreInfoContractRef: cycleBundle.cycle.cycleId,
          });

    return {
      ...cycleBundle,
      taskTransition,
      responseGrant: {
        grantRef: issuedGrant.grantRef,
        materializedToken: issuedGrant.materializedToken,
      },
      supersededCycle,
      initialOutboxEntry,
    };
  }

  async receivePatientResponse(
    input: ReceiveMoreInfoPatientResponseInput,
  ): Promise<{
    classification: string;
    cycle: MoreInfoCycleSnapshot;
    checkpoint: MoreInfoReplyWindowCheckpointSnapshot;
    schedule: MoreInfoReminderScheduleSnapshot;
  }> {
    const cycle = await this.requireCycle(input.cycleId);
    const receipt = await this.moreInfoService.receivePatientResponse({
      cycleId: input.cycleId,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
      receivedAt: input.receivedAt,
      repairBlocked: Boolean(input.repairBlocked),
    });
    if (
      receipt.classification === "accepted_on_time" ||
      receipt.classification === "accepted_late_review"
    ) {
      await this.revokeResponseGrantIfPresent(receipt.cycle, input.receivedAt, [
        "MORE_INFO_RESPONSE_RECEIVED",
      ]);
    }
    return {
      classification: receipt.classification,
      cycle: receipt.cycle,
      checkpoint: receipt.checkpoint,
      schedule: receipt.schedule,
    };
  }

  async supersedeActiveCycle(input: SupersedeMoreInfoCycleInput): Promise<MoreInfoKernelBundle> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const cycle = await this.requireCycle(input.cycleId);
    invariant(
      cycle.state !== "review_resumed" &&
        cycle.state !== "expired" &&
        cycle.state !== "superseded" &&
        cycle.state !== "cancelled",
      "MORE_INFO_CYCLE_NOT_LIVE",
      "Only live more-info cycles may be superseded.",
    );
    await this.recomputeCheckpoint({
      cycleId: input.cycleId,
      evaluatedAt: recordedAt,
      reachability: { summaryState: "clear", deliveryRiskState: "on_track" },
    });
    return this.supersedeCycle(await this.requireCycle(input.cycleId), input.replacementCycleId, recordedAt);
  }

  async cancelCycle(input: CancelMoreInfoCycleInput): Promise<MoreInfoKernelBundle> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const cycle = await this.requireCycle(input.cycleId);
    const released = await this.leaseAuthority.releaseLease({
      domain: MORE_INFO_DOMAIN,
      domainObjectRef: cycle.cycleId,
      leaseId: cycle.lifecycleLeaseRef,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      releasedAt: recordedAt,
      sameShellRecoveryRouteRef: this.responseRecoveryRoute(cycle.requestId),
      operatorVisibleWorkRef: `more_info_${cycle.cycleId}`,
      blockedActionScopeRefs: ["respond_more_info"],
      closeBlockReason:
        optionalRef(input.cancellationReasonRef) ?? "more_info_cycle_cancelled",
      detectedByRef: input.actorRef,
    });
    const bundle = await this.moreInfoService.cancelCycle({
      cycleId: cycle.cycleId,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
      nextLineageFenceEpoch: released.lineageFence.currentEpoch,
      recordedAt,
    });
    await this.revokeResponseGrantIfPresent(cycle, recordedAt, [
      optionalRef(input.cancellationReasonRef)?.toUpperCase() ?? "MORE_INFO_CYCLE_CANCELLED",
    ]);
    this.cancelPendingOutboxForCycle(cycle.cycleId, recordedAt, "cancelled");
    return bundle;
  }

  async recomputeCheckpoint(
    input: RecomputeMoreInfoCheckpointInput,
  ): Promise<MoreInfoKernelBundle> {
    const cycle = await this.requireCycle(input.cycleId);
    const reachability = input.reachability ?? {
      summaryState: "clear",
      deliveryRiskState: "on_track",
    };
    return this.moreInfoService.refreshReplyWindowState({
      cycleId: cycle.cycleId,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
      evaluatedAt: input.evaluatedAt,
      repairBlocked: reachability.summaryState === "blocked",
      repairRequiredReasonRef:
        reachability.summaryState === "blocked"
          ? optionalRef(reachability.blockedReasonRef) ?? "reachability_dependency_active"
          : null,
    });
  }

  async markReminderDue(input: MarkMoreInfoReminderDueInput): Promise<MoreInfoKernelBundle> {
    const bundle = await this.recomputeCheckpoint({
      cycleId: input.cycleId,
      evaluatedAt: input.evaluatedAt,
      reachability: { summaryState: "clear", deliveryRiskState: "on_track" },
    });
    invariant(
      bundle.checkpoint.replyWindowState === "reminder_due",
      "MORE_INFO_REMINDER_NOT_DUE",
      "markReminderDue requires the authoritative checkpoint to be reminder_due.",
    );
    return bundle;
  }

  async dispatchReminder(
    input: DispatchMoreInfoReminderInput,
  ): Promise<DispatchMoreInfoReminderResult> {
    const dueBundle = await this.markReminderDue({
      cycleId: input.cycleId,
      evaluatedAt: input.dispatchedAt,
    });
    const reminderOrdinal = dueBundle.schedule.dispatchedReminderCount + 1;
    const outboxEntry = this.ensureOutboxEntry({
      cycle: dueBundle.cycle,
      checkpoint: dueBundle.checkpoint,
      schedule: dueBundle.schedule,
      effectType: "reminder_send",
      reminderOrdinal,
      reasonRef: null,
      dueAt: input.dispatchedAt,
      createdAt: input.dispatchedAt,
    });
    const bundle = await this.moreInfoService.markReminderDispatched({
      cycleId: dueBundle.cycle.cycleId,
      presentedOwnershipEpoch: dueBundle.cycle.ownershipEpoch,
      presentedFencingToken: dueBundle.cycle.fencingToken,
      presentedLineageFenceEpoch: dueBundle.cycle.currentLineageFenceEpoch,
      reminderSentAt: input.dispatchedAt,
    });
    this.dispatchOutboxEntry(outboxEntry.outboxEntryId, input.dispatchedAt);
    return {
      ...bundle,
      outboxEntry,
    };
  }

  async suppressReminder(
    input: SuppressMoreInfoReminderCommandInput,
  ): Promise<MoreInfoKernelBundle> {
    const cycle = await this.requireCycle(input.cycleId);
    return this.moreInfoService.markReminderSuppressed({
      cycleId: cycle.cycleId,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
      suppressedAt: input.suppressedAt,
      suppressionReasonRef: input.reasonRef,
      nextQuietHoursReleaseAt: input.nextQuietHoursReleaseAt ?? null,
      replyWindowState: input.replyWindowState,
      repairRequiredReasonRef: input.repairRequiredReasonRef ?? null,
    });
  }

  async expireCycle(input: ExpireMoreInfoCycleInput): Promise<MoreInfoKernelBundle> {
    const cycle = await this.requireCycle(input.cycleId);
    return this.expireCycleAndReleaseLease(cycle, input.recordedAt);
  }

  async resumeReviewFromPatientResponse(
    input: ResumeReviewFromMoreInfoInput,
  ): Promise<{
    cycle: MoreInfoCycleSnapshot;
    checkpoint: MoreInfoReplyWindowCheckpointSnapshot;
    schedule: MoreInfoReminderScheduleSnapshot;
    taskTransition: Awaited<ReturnType<Phase3TriageKernelApplication["markReviewResumed"]>>;
  }> {
    const cycle = await this.requireCycle(input.cycleId);
    invariant(
      cycle.state === "response_received",
      "MORE_INFO_NOT_READY_FOR_REVIEW_RESUME",
      "Only response_received cycles may resume review.",
    );
    const released = await this.leaseAuthority.releaseLease({
      domain: MORE_INFO_DOMAIN,
      domainObjectRef: cycle.cycleId,
      leaseId: cycle.lifecycleLeaseRef,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      releasedAt: input.resumedAt,
      sameShellRecoveryRouteRef: this.responseRecoveryRoute(cycle.requestId),
      operatorVisibleWorkRef: `more_info_${cycle.cycleId}`,
      blockedActionScopeRefs: ["respond_more_info"],
      closeBlockReason: "review_resumed",
      detectedByRef: input.actorRef,
    });
    const bundle = await this.moreInfoService.resumeReview({
      cycleId: input.cycleId,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
      nextLineageFenceEpoch: released.lineageFence.currentEpoch,
      recordedAt: input.resumedAt,
    });
    const taskTransition = await this.triageApplication.markReviewResumed({
      taskId: input.taskId,
      actorRef: input.actorRef,
      recordedAt: input.resumedAt,
    });
    this.cancelPendingOutboxForCycle(cycle.cycleId, input.resumedAt, "review_resumed");
    return {
      ...bundle,
      taskTransition,
    };
  }

  async drainReminderWorker(input: DrainMoreInfoReminderWorkerInput): Promise<{
    dispatched: readonly MoreInfoWorkerDispatchRecord[];
    outboxEntries: readonly MoreInfoOutboxEntrySnapshot[];
  }> {
    const evaluatedAt = ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
    const dispatched: MoreInfoWorkerDispatchRecord[] = [];

    for (const pending of this.listOutboxEntries()) {
      if (pending.dispatchState !== "pending" || compareIso(pending.dueAt, evaluatedAt) > 0) {
        continue;
      }
      if (pending.effectType !== "initial_delivery") {
        continue;
      }
      const cycle = await this.requireCycle(pending.cycleId);
      if (cycle.state !== "awaiting_delivery") {
        this.cancelOutboxEntry(pending.outboxEntryId, evaluatedAt);
        continue;
      }
      await this.moreInfoService.markDelivered({
        cycleId: cycle.cycleId,
        presentedOwnershipEpoch: cycle.ownershipEpoch,
        presentedFencingToken: cycle.fencingToken,
        presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
        deliveredAt: evaluatedAt,
      });
      this.dispatchOutboxEntry(pending.outboxEntryId, evaluatedAt);
      dispatched.push({
        cycleId: cycle.cycleId,
        effectType: "initial_delivery",
        outboxEntryRef: pending.outboxEntryId,
        reasonRef: null,
        recordedAt: evaluatedAt,
      });
    }

    const cycles = await this.moreInfoRepositories.listCycles();
    for (const cycleDocument of cycles) {
      const cycle = cycleDocument.toSnapshot();
      if (
        cycle.state === "review_resumed" ||
        cycle.state === "superseded" ||
        cycle.state === "cancelled" ||
        cycle.state === "expired" ||
        cycle.state === "response_received"
      ) {
        continue;
      }
      const bundle = await this.queryTaskMoreInfo(cycle.taskId);
      invariant(bundle, "MORE_INFO_BUNDLE_MISSING", "Live cycle bundle could not be materialized.");
      const reachability =
        input.reachabilityByCycleId?.[cycle.cycleId] ?? {
          summaryState: "clear",
          deliveryRiskState: "on_track",
        };
      const repairBlocked = reachability.summaryState === "blocked";
      const checkpointState = resolveReplyWindowState({
        checkpoint: bundle.checkpoint,
        evaluatedAt,
        repairBlocked,
      });

      if (cycle.state === "awaiting_delivery") {
        continue;
      }

      if (checkpointState === "expired") {
        const expiredBundle = await this.expireCycleAndReleaseLease(cycle, evaluatedAt);
        dispatched.push({
          cycleId: cycle.cycleId,
          effectType: "expired",
          outboxEntryRef: null,
          reasonRef: "reply_window_expired",
          recordedAt: evaluatedAt,
        });
        this.cancelPendingOutboxForCycle(cycle.cycleId, evaluatedAt, "expired");
        void expiredBundle;
        continue;
      }

      if (
        checkpointState !== bundle.checkpoint.replyWindowState ||
        (checkpointState === "late_review" && cycle.state !== "awaiting_late_review")
      ) {
        await this.moreInfoService.refreshReplyWindowState({
          cycleId: cycle.cycleId,
          presentedOwnershipEpoch: cycle.ownershipEpoch,
          presentedFencingToken: cycle.fencingToken,
          presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
          evaluatedAt,
          repairBlocked,
          repairRequiredReasonRef: repairBlocked
            ? optionalRef(reachability.blockedReasonRef) ?? "reachability_dependency_active"
            : null,
        });
      }

      const latest = await this.requireBundle(cycle.cycleId);
      if (checkpointState === "blocked_repair") {
        if (
          Boolean(reachability.callbackFallbackAllowed) &&
          (reachability.deliveryRiskState === "likely_failed" ||
            reachability.deliveryRiskState === "disputed") &&
          latest.schedule.callbackFallbackState !== "seeded"
        ) {
          const seedRef = nextMoreInfoId(this.idGenerator, "more_info_callback_seed");
          const entry = this.ensureOutboxEntry({
            cycle: latest.cycle,
            checkpoint: latest.checkpoint,
            schedule: latest.schedule,
            effectType: "callback_fallback_seed",
            reminderOrdinal: null,
            reasonRef: optionalRef(reachability.blockedReasonRef) ?? "reachability_dependency_active",
            dueAt: evaluatedAt,
            createdAt: evaluatedAt,
          });
          await this.moreInfoService.markCallbackFallbackSeeded({
            cycleId: cycle.cycleId,
            presentedOwnershipEpoch: cycle.ownershipEpoch,
            presentedFencingToken: cycle.fencingToken,
            presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
            callbackFallbackSeedRef: seedRef,
            seededAt: evaluatedAt,
            repairRequiredReasonRef:
              optionalRef(reachability.blockedReasonRef) ?? "reachability_dependency_active",
          });
          this.dispatchOutboxEntry(entry.outboxEntryId, evaluatedAt);
          dispatched.push({
            cycleId: cycle.cycleId,
            effectType: "callback_fallback_seed",
            outboxEntryRef: entry.outboxEntryId,
            reasonRef:
              optionalRef(reachability.blockedReasonRef) ?? "reachability_dependency_active",
            recordedAt: evaluatedAt,
          });
        } else if (
          latest.schedule.scheduleState !== "suppressed" ||
          latest.checkpoint.replyWindowState !== "blocked_repair"
        ) {
          await this.moreInfoService.markReminderSuppressed({
            cycleId: cycle.cycleId,
            presentedOwnershipEpoch: cycle.ownershipEpoch,
            presentedFencingToken: cycle.fencingToken,
            presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
            suppressedAt: evaluatedAt,
            suppressionReasonRef:
              optionalRef(reachability.blockedReasonRef) ?? "reachability_dependency_active",
            replyWindowState: "blocked_repair",
            repairRequiredReasonRef:
              optionalRef(reachability.blockedReasonRef) ?? "reachability_dependency_active",
          });
          dispatched.push({
            cycleId: cycle.cycleId,
            effectType: "suppressed",
            outboxEntryRef: null,
            reasonRef:
              optionalRef(reachability.blockedReasonRef) ?? "reachability_dependency_active",
            recordedAt: evaluatedAt,
          });
        }
        continue;
      }

      if (checkpointState !== "reminder_due") {
        continue;
      }
      if (
        latest.schedule.scheduleState === "completed" ||
        latest.schedule.scheduleState === "cancelled" ||
        latest.schedule.scheduleState === "exhausted"
      ) {
        continue;
      }
      if (latest.schedule.quietHoursWindow) {
        const nextQuietHoursReleaseAt = resolveQuietHoursReleaseAt({
          evaluatedAt,
          quietHoursWindow: latest.schedule.quietHoursWindow,
        });
        if (nextQuietHoursReleaseAt !== evaluatedAt) {
          await this.moreInfoService.markReminderSuppressed({
            cycleId: cycle.cycleId,
            presentedOwnershipEpoch: cycle.ownershipEpoch,
            presentedFencingToken: cycle.fencingToken,
            presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
            suppressedAt: evaluatedAt,
            suppressionReasonRef: "quiet_hours_delay",
            nextQuietHoursReleaseAt,
            replyWindowState: "reminder_due",
          });
          dispatched.push({
            cycleId: cycle.cycleId,
            effectType: "suppressed",
            outboxEntryRef: null,
            reasonRef: "quiet_hours_delay",
            recordedAt: evaluatedAt,
          });
          continue;
        }
      }

      const reminderOrdinal = latest.schedule.dispatchedReminderCount + 1;
      const entry = this.ensureOutboxEntry({
        cycle: latest.cycle,
        checkpoint: latest.checkpoint,
        schedule: latest.schedule,
        effectType: "reminder_send",
        reminderOrdinal,
        reasonRef: null,
        dueAt: evaluatedAt,
        createdAt: evaluatedAt,
      });
      await this.moreInfoService.markReminderDispatched({
        cycleId: cycle.cycleId,
        presentedOwnershipEpoch: cycle.ownershipEpoch,
        presentedFencingToken: cycle.fencingToken,
        presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
        reminderSentAt: evaluatedAt,
      });
      this.dispatchOutboxEntry(entry.outboxEntryId, evaluatedAt);
      dispatched.push({
        cycleId: cycle.cycleId,
        effectType: "reminder_send",
        outboxEntryRef: entry.outboxEntryId,
        reasonRef: null,
        recordedAt: evaluatedAt,
      });
    }

    return {
      dispatched,
      outboxEntries: this.listOutboxEntries(),
    };
  }

  private async requireTask(taskId: string) {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TASK_NOT_FOUND", `TriageTask ${taskId} was not found.`);
    return task;
  }

  private async requireCycle(cycleId: string): Promise<MoreInfoCycleSnapshot> {
    const cycle = await this.moreInfoRepositories.getCycle(cycleId);
    invariant(cycle, "MORE_INFO_CYCLE_NOT_FOUND", `MoreInfoCycle ${cycleId} was not found.`);
    return cycle.toSnapshot();
  }

  private async requireBundle(cycleId: string): Promise<MoreInfoKernelBundle> {
    const cycle = await this.requireCycle(cycleId);
    const checkpoint = await this.moreInfoRepositories.getReplyWindowCheckpoint(cycle.activeCheckpointRef);
    const schedule = await this.moreInfoRepositories.getReminderSchedule(cycle.reminderScheduleRef);
    invariant(checkpoint && schedule, "MORE_INFO_BUNDLE_INCOMPLETE", "MoreInfo bundle is incomplete.");
    return {
      cycle,
      checkpoint: checkpoint.toSnapshot(),
      schedule: schedule.toSnapshot(),
    };
  }

  private async supersedeCycle(
    cycle: MoreInfoCycleSnapshot,
    replacementCycleId: string,
    recordedAt: string,
  ): Promise<MoreInfoKernelBundle> {
    const released = await this.leaseAuthority.releaseLease({
      domain: MORE_INFO_DOMAIN,
      domainObjectRef: cycle.cycleId,
      leaseId: cycle.lifecycleLeaseRef,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      releasedAt: recordedAt,
      sameShellRecoveryRouteRef: this.responseRecoveryRoute(cycle.requestId),
      operatorVisibleWorkRef: `more_info_${cycle.cycleId}`,
      blockedActionScopeRefs: ["respond_more_info"],
      closeBlockReason: "superseded_by_replacement_cycle",
      detectedByRef: PHASE3_MORE_INFO_SERVICE_NAME,
    });
    const bundle = await this.moreInfoService.supersedeCycle({
      cycleId: cycle.cycleId,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
      nextLineageFenceEpoch: released.lineageFence.currentEpoch,
      supersededByCycleRef: replacementCycleId,
      recordedAt,
    });
    await this.revokeResponseGrantIfPresent(cycle, recordedAt, ["SUPERSEDED_MORE_INFO_CYCLE"]);
    this.cancelPendingOutboxForCycle(cycle.cycleId, recordedAt, "superseded");
    return bundle;
  }

  private async expireCycleAndReleaseLease(
    cycle: MoreInfoCycleSnapshot,
    recordedAt: string,
  ): Promise<MoreInfoKernelBundle> {
    const released = await this.leaseAuthority.releaseLease({
      domain: MORE_INFO_DOMAIN,
      domainObjectRef: cycle.cycleId,
      leaseId: cycle.lifecycleLeaseRef,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      releasedAt: recordedAt,
      sameShellRecoveryRouteRef: this.responseRecoveryRoute(cycle.requestId),
      operatorVisibleWorkRef: `more_info_${cycle.cycleId}`,
      blockedActionScopeRefs: ["respond_more_info"],
      closeBlockReason: "reply_window_expired",
      detectedByRef: PHASE3_MORE_INFO_SERVICE_NAME,
    });
    const bundle = await this.moreInfoService.markExpired({
      cycleId: cycle.cycleId,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
      nextLineageFenceEpoch: released.lineageFence.currentEpoch,
      recordedAt,
    });
    await this.revokeResponseGrantIfPresent(cycle, recordedAt, ["MORE_INFO_REPLY_WINDOW_EXPIRED"]);
    return bundle;
  }

  private async revokeResponseGrantIfPresent(
    cycle: MoreInfoCycleSnapshot,
    recordedAt: string,
    reasonCodes: readonly string[],
  ): Promise<void> {
    if (!cycle.responseGrantRef) {
      return;
    }
    try {
      await this.accessGrantService.revokeGrant({
        grantRef: cycle.responseGrantRef,
        governingObjectRef: cycle.cycleId,
        lineageFenceEpoch: cycle.currentLineageFenceEpoch,
        causeClass: "manual_revoke",
        reasonCodes,
        recordedAt,
      });
    } catch {
      // Grant revocation remains best-effort here because tests may revisit the same cycle after
      // a previous replay-safe revoke path has already landed.
    }
  }

  private async issueResponseGrant(input: {
    cycleId: string;
    responseRouteFamilyRef: string;
    recordedAt: string;
    responseGrantExpiresAt: string;
    responseRecoveryRouteRef: string;
    lineageFenceEpoch: number;
  }): Promise<{
    grantRef: string | null;
    materializedToken: AccessGrantMaterializedToken | null;
    grantExpiresAt: string | null;
  }> {
    const issued: AccessGrantIssueResult = await this.accessGrantService.issueGrant({
      grantFamily: "transaction_action_minimal",
      actionScope: "respond_more_info",
      lineageScope: "request",
      routeFamilyRef: input.responseRouteFamilyRef,
      governingObjectRef: input.cycleId,
      governingVersionRef: `${input.cycleId}@v1`,
      phiExposureClass: "minimal",
      recoveryRouteRef: input.responseRecoveryRouteRef,
      subjectBindingMode: "hard_subject",
      tokenKeyVersionRef: "token_key_local_v1",
      issuedLineageFenceEpoch: input.lineageFenceEpoch,
      presentedToken: "",
      expiresAt: input.responseGrantExpiresAt,
      createdAt: input.recordedAt,
    });
    return {
      grantRef: issued.grant.grantId,
      materializedToken: issued.materializedToken,
      grantExpiresAt: issued.grant.toSnapshot().expiresAt,
    };
  }

  private responseRecoveryRoute(requestId: string): string {
    return `/v1/me/requests/${requestId}/more-info`;
  }

  private ensureOutboxEntry(input: {
    cycle: MoreInfoCycleSnapshot;
    checkpoint: MoreInfoReplyWindowCheckpointSnapshot;
    schedule: MoreInfoReminderScheduleSnapshot;
    effectType: MoreInfoOutboxEffectType;
    reminderOrdinal: number | null;
    reasonRef: string | null;
    dueAt: string;
    createdAt: string;
  }): MoreInfoOutboxEntrySnapshot {
    const effectKey = computeMoreInfoWorkerEffectKey({
      cycleId: input.cycle.cycleId,
      effectType: input.effectType,
      ordinal: input.reminderOrdinal ?? 0,
      checkpointRevision: input.checkpoint.checkpointRevision,
    });
    const existingId = this.outboxByEffectKey.get(effectKey);
    if (existingId) {
      const existing = this.outboxEntries.get(existingId);
      invariant(existing, "OUTBOX_ENTRY_NOT_FOUND", `Missing outbox entry ${existingId}.`);
      return existing;
    }
    const entry: MoreInfoOutboxEntrySnapshot = {
      outboxEntryId: nextMoreInfoId(this.idGenerator, "phase3_more_info_outbox"),
      cycleId: input.cycle.cycleId,
      checkpointRef: input.checkpoint.checkpointId,
      scheduleRef: input.schedule.scheduleId,
      requestLineageRef: input.cycle.requestLineageRef,
      effectType: input.effectType,
      effectKey,
      reminderOrdinal: input.reminderOrdinal,
      dispatchState: "pending",
      reasonRef: optionalRef(input.reasonRef),
      dueAt: ensureIsoTimestamp(input.dueAt, "dueAt"),
      createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
      dispatchedAt: null,
      cancelledAt: null,
      version: 1,
    };
    this.outboxEntries.set(entry.outboxEntryId, entry);
    this.outboxByEffectKey.set(effectKey, entry.outboxEntryId);
    return entry;
  }

  private dispatchOutboxEntry(outboxEntryId: string, dispatchedAt: string): void {
    const entry = this.outboxEntries.get(outboxEntryId);
    invariant(entry, "OUTBOX_ENTRY_NOT_FOUND", `Outbox entry ${outboxEntryId} is missing.`);
    this.outboxEntries.set(outboxEntryId, {
      ...entry,
      dispatchState: "dispatched",
      dispatchedAt: ensureIsoTimestamp(dispatchedAt, "dispatchedAt"),
      version: entry.version + 1,
    });
  }

  private cancelOutboxEntry(outboxEntryId: string, cancelledAt: string): void {
    const entry = this.outboxEntries.get(outboxEntryId);
    invariant(entry, "OUTBOX_ENTRY_NOT_FOUND", `Outbox entry ${outboxEntryId} is missing.`);
    this.outboxEntries.set(outboxEntryId, {
      ...entry,
      dispatchState: "cancelled",
      cancelledAt: ensureIsoTimestamp(cancelledAt, "cancelledAt"),
      version: entry.version + 1,
    });
  }

  private cancelPendingOutboxForCycle(
    cycleId: string,
    cancelledAt: string,
    reasonRef: string,
  ): void {
    for (const entry of this.outboxEntries.values()) {
      if (entry.cycleId !== cycleId || entry.dispatchState !== "pending") {
        continue;
      }
      this.outboxEntries.set(entry.outboxEntryId, {
        ...entry,
        dispatchState: "cancelled",
        reasonRef,
        cancelledAt: ensureIsoTimestamp(cancelledAt, "cancelledAt"),
        version: entry.version + 1,
      });
    }
  }
}

export function createPhase3MoreInfoKernelApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  moreInfoRepositories?: MoreInfoKernelRepositories;
  identityRepositories?: IdentityAccessDependencies;
  idGenerator?: BackboneIdGenerator;
}): Phase3MoreInfoKernelApplication {
  return new Phase3MoreInfoKernelApplicationImpl(options);
}
