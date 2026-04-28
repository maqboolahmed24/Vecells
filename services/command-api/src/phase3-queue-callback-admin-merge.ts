import type { QueueViewResult } from "./queue-ranking";
import {
  createQueueRankingApplication,
  PHASE3_QUEUE_ENGINE_FIXTURE_QUEUE_KEY,
  phase3QueueScenarioIds,
  queueRankingMigrationPlanRefs,
  queueRankingPersistenceTables,
  type QueueRankingApplication,
} from "./queue-ranking";
import {
  createPhase3CallbackDomainApplication,
  phase3CallbackMigrationPlanRefs,
  phase3CallbackPersistenceTables,
  type Phase3CallbackApplicationBundle,
  type Phase3CallbackDomainApplication,
} from "./phase3-callback-domain";
import {
  createPhase3SelfCareBoundaryApplication,
  phase3SelfCareBoundaryMigrationPlanRefs,
  phase3SelfCareBoundaryPersistenceTables,
  type Phase3SelfCareBoundaryApplication,
  type Phase3SelfCareBoundaryApplicationBundle,
} from "./phase3-self-care-boundary-grants";
import {
  createPhase3AdviceRenderApplication,
  phase3AdviceRenderMigrationPlanRefs,
  phase3AdviceRenderPersistenceTables,
  type Phase3AdviceRenderApplication,
  type Phase3AdviceRenderApplicationBundle,
} from "./phase3-advice-render-settlement";
import {
  createPhase3AdminResolutionPolicyApplication,
  phase3AdminResolutionPolicyMigrationPlanRefs,
  phase3AdminResolutionPolicyPersistenceTables,
  type Phase3AdminResolutionPolicyApplication,
  type Phase3AdminResolutionPolicyApplicationBundle,
} from "./phase3-admin-resolution-policy";
import {
  createPhase3AdminResolutionSettlementApplication,
  phase3AdminResolutionSettlementMigrationPlanRefs,
  phase3AdminResolutionSettlementPersistenceTables,
  type Phase3AdminResolutionSettlementApplication,
  type Phase3AdminResolutionSettlementApplicationBundle,
} from "./phase3-admin-resolution-settlement";
import {
  createPhase3TaskCompletionContinuityApplication,
  phase3TaskCompletionContinuityMigrationPlanRefs,
  phase3TaskCompletionContinuityPersistenceTables,
  type Phase3TaskCompletionContinuityApplication,
  type Phase3TaskCompletionContinuityApplicationBundle,
} from "./phase3-task-completion-continuity";
import {
  createPhase3SelfCareOutcomeAnalyticsApplication,
  phase3SelfCareOutcomeAnalyticsMigrationPlanRefs,
  phase3SelfCareOutcomeAnalyticsPersistenceTables,
  type Phase3SelfCareOutcomeAnalyticsApplication,
  type Phase3SelfCareOutcomeAnalyticsApplicationBundle,
} from "./phase3-self-care-outcome-analytics";

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function labelFromToken(value: string | null | undefined): string {
  if (!value) {
    return "not available";
  }
  return value.replaceAll("_", " ");
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function entryTaskId(entry: { taskRef?: unknown; taskId?: unknown; sourceTriageTaskRef?: unknown }): string {
  return (
    optionalString(entry.taskRef) ??
    optionalString(entry.taskId) ??
    optionalString(entry.sourceTriageTaskRef) ??
    "task_missing"
  );
}

type QueueEntrySnapshot = QueueViewResult["entries"][number];

type QueueMergeExecutionFamily = "callback" | "self_care" | "admin_resolution" | "triage_only";
type QueueMergePosture =
  | "ready"
  | "repair_required"
  | "waiting_dependency"
  | "completed"
  | "reopened"
  | "stale_recoverable"
  | "blocked";

export const PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SERVICE_NAME =
  "Phase3QueueCallbackAdminMergeApplication";
export const PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SCHEMA_VERSION =
  "270.phase3.queue-callback-admin-merge.v1";
export const PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_QUERY_SURFACES = [
  "GET /v1/workspace/queues/{queueKey}/phase3-execution-merge",
  "GET /v1/workspace/tasks/{taskId}/phase3-execution-merge",
] as const;

export const phase3QueueCallbackAdminMergeRoutes = [
  {
    routeId: "workspace_queue_phase3_execution_merge_current",
    method: "GET",
    path: "/v1/workspace/queues/{queueKey}/phase3-execution-merge",
    contractFamily: "Phase3QueueCallbackAdminMergeContract",
    purpose:
      "Expose one authoritative queue-visible digest joining queue rank truth, callback consequence truth, self-care or bounded-admin truth, completion settlement, and next-task gate posture.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_phase3_execution_merge_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/phase3-execution-merge",
    contractFamily: "Phase3QueueCallbackAdminMergeTaskContract",
    purpose:
      "Expose the merged Phase 3 execution bundle for one task so queue, callback, self-care, admin-resolution, and next-task surfaces agree on one authority chain.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
] as const;

export const phase3QueueCallbackAdminMergePersistenceTables = [
  ...new Set([
    ...queueRankingPersistenceTables,
    ...phase3CallbackPersistenceTables,
    ...phase3SelfCareBoundaryPersistenceTables,
    ...phase3AdviceRenderPersistenceTables,
    ...phase3AdminResolutionPolicyPersistenceTables,
    ...phase3AdminResolutionSettlementPersistenceTables,
    ...phase3TaskCompletionContinuityPersistenceTables,
    ...phase3SelfCareOutcomeAnalyticsPersistenceTables,
  ]),
] as const;

export const phase3QueueCallbackAdminMergeMigrationPlanRefs = [
  ...new Set([
    ...queueRankingMigrationPlanRefs,
    ...phase3CallbackMigrationPlanRefs,
    ...phase3SelfCareBoundaryMigrationPlanRefs,
    ...phase3AdviceRenderMigrationPlanRefs,
    ...phase3AdminResolutionPolicyMigrationPlanRefs,
    ...phase3AdminResolutionSettlementMigrationPlanRefs,
    ...phase3TaskCompletionContinuityMigrationPlanRefs,
    ...phase3SelfCareOutcomeAnalyticsMigrationPlanRefs,
  ]),
] as const;

export interface Phase3QueueCallbackAdminLaunchAction {
  actionId: string;
  executionFamily: Exclude<QueueMergeExecutionFamily, "triage_only">;
  routePath: string;
  actionState: QueueMergePosture;
  actionLabel: string;
  summary: string;
  dominant: boolean;
}

export interface Phase3QueueCallbackAdminDigest {
  taskId: string;
  queueKey: string;
  rankSnapshotRef: string;
  rankEntryRef: string | null;
  requestLineageRef: string | null;
  executionFamily: QueueMergeExecutionFamily;
  dominantPosture: QueueMergePosture;
  queueBadgeLabels: readonly string[];
  dominantSummary: string;
  patientExpectationDigest: string | null;
  completionSettlementState: string | null;
  nextTaskGateState: string | null;
  continuityEvidenceRef: string | null;
  nextTaskLaunchLeaseRef: string | null;
  decisionEpochRef: string | null;
  selectedAnchorRef: string;
  launchActions: readonly Phase3QueueCallbackAdminLaunchAction[];
  authoritativeTupleRefs: readonly string[];
}

export interface Phase3QueueCallbackAdminQueueBundle {
  queueKey: string;
  rankSnapshotRef: string;
  rowOrderHash: string;
  generatedAt: string | null;
  digests: readonly Phase3QueueCallbackAdminDigest[];
}

export interface Phase3QueueCallbackAdminTaskBundle {
  taskId: string;
  digest: Phase3QueueCallbackAdminDigest;
  queueBundle: Phase3QueueCallbackAdminQueueBundle | null;
  queueEntry: QueueEntrySnapshot | null;
  callbackBundle: Phase3CallbackApplicationBundle | null;
  selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle | null;
  adviceRenderBundle: Phase3AdviceRenderApplicationBundle | null;
  adminResolutionBundle: Phase3AdminResolutionPolicyApplicationBundle | null;
  adminResolutionSettlementBundle: Phase3AdminResolutionSettlementApplicationBundle | null;
  analyticsBundle: Phase3SelfCareOutcomeAnalyticsApplicationBundle | null;
  completionContinuityBundle: Phase3TaskCompletionContinuityApplicationBundle | null;
}

interface QueueCallbackAdminPorts {
  queueApplication: Pick<QueueRankingApplication, "queryQueue">;
  callbackApplication: Pick<Phase3CallbackDomainApplication, "queryTaskCallbackDomain">;
  selfCareBoundaryApplication: Pick<Phase3SelfCareBoundaryApplication, "queryTaskSelfCareBoundary">;
  adviceRenderApplication: Pick<Phase3AdviceRenderApplication, "queryTaskAdviceRender">;
  adminResolutionApplication: Pick<Phase3AdminResolutionPolicyApplication, "queryTaskAdminResolution">;
  adminResolutionSettlementApplication: Pick<
    Phase3AdminResolutionSettlementApplication,
    "queryTaskAdminResolutionSettlement"
  >;
  analyticsApplication: Pick<Phase3SelfCareOutcomeAnalyticsApplication, "queryTaskSelfCareOutcomeAnalytics">;
  completionContinuityApplication: Pick<
    Phase3TaskCompletionContinuityApplication,
    "queryTaskCompletionContinuity"
  >;
}

export interface Phase3QueueCallbackAdminMergeApplication extends QueueCallbackAdminPorts {
  readonly serviceName: typeof PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_QUERY_SURFACES;
  readonly routes: typeof phase3QueueCallbackAdminMergeRoutes;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRefs: readonly string[];
  queryIntegratedQueueSurface(queueKey: string): Promise<Phase3QueueCallbackAdminQueueBundle>;
  queryIntegratedTaskExecution(
    taskId: string,
    queueKey?: string | null,
  ): Promise<Phase3QueueCallbackAdminTaskBundle>;
}

function completionPosture(
  completionBundle: Phase3TaskCompletionContinuityApplicationBundle | null,
): {
  settlementState: string | null;
  nextTaskGateState: string | null;
  continuityEvidenceRef: string | null;
  nextTaskLaunchLeaseRef: string | null;
} {
  return {
    settlementState:
      completionBundle?.completionEnvelope?.authoritativeSettlementState ??
      completionBundle?.task?.taskCompletionSettlementEnvelopeRef ??
      null,
    nextTaskGateState:
      completionBundle?.nextTaskLaunchLease?.launchEligibilityState ??
      completionBundle?.completionEnvelope?.nextTaskLaunchState ??
      null,
    continuityEvidenceRef:
      completionBundle?.workspaceContinuityEvidenceProjection?.workspaceContinuityEvidenceProjectionId ??
      completionBundle?.completionEnvelope?.experienceContinuityEvidenceRef ??
      null,
    nextTaskLaunchLeaseRef: completionBundle?.nextTaskLaunchLease?.nextTaskLaunchLeaseId ?? null,
  };
}

function deriveCallbackState(
  callbackBundle: Phase3CallbackApplicationBundle | null,
): {
  posture: QueueMergePosture | null;
  summary: string | null;
  expectationDigest: string | null;
  decisionEpochRef: string | null;
  tupleRefs: readonly string[];
  launchAction: Phase3QueueCallbackAdminLaunchAction | null;
} {
  if (!callbackBundle) {
    return {
      posture: null,
      summary: null,
      expectationDigest: null,
      decisionEpochRef: null,
      tupleRefs: [],
      launchAction: null,
    };
  }

  const callbackCase = callbackBundle.callbackCase;
  const gate = callbackBundle.currentResolutionGate;
  const expectation = callbackBundle.currentExpectationEnvelope;
  const latestAttempt = callbackBundle.latestAttempt;
  const routeRepairRequired =
    callbackCase.state === "contact_route_repair_pending" ||
    callbackCase.patientVisibleExpectationState === "route_repair_required";
  const waitingEvidence =
    callbackCase.state === "awaiting_outcome_evidence" ||
    latestAttempt?.settlementState === "outcome_pending" ||
    latestAttempt?.settlementState === "provider_acked";
  const posture: QueueMergePosture = routeRepairRequired
    ? "repair_required"
    : waitingEvidence
      ? "waiting_dependency"
      : callbackCase.state === "closed" || callbackCase.state === "completed"
        ? "completed"
        : callbackCase.state === "reopened"
          ? "reopened"
          : "ready";

  const summary = routeRepairRequired
    ? "Contact-route repair is the dominant callback action."
    : waitingEvidence
      ? "Callback outcome evidence is still authoritative work."
      : callbackCase.state === "closed" || callbackCase.state === "completed"
        ? "Callback outcome is settled, but queue calmness still depends on completion settlement."
        : `Callback case is ${labelFromToken(callbackCase.state)} with ${labelFromToken(gate?.decision ?? "awaiting_attempt")}.`;

  return {
    posture,
    summary,
    expectationDigest:
      optionalString(expectation?.patientVisibleState) ??
      optionalString(callbackCase.patientVisibleExpectationState),
    decisionEpochRef: optionalString(callbackCase.decisionEpochRef),
    tupleRefs: unique([
      optionalString(callbackCase.callbackCaseId) ?? "",
      optionalString(callbackBundle.currentIntentLease?.callbackIntentLeaseId) ?? "",
      optionalString(gate?.callbackResolutionGateId) ?? "",
      optionalString(callbackBundle.latestOutcomeEvidenceBundle?.callbackOutcomeEvidenceBundleId) ?? "",
    ]),
    launchAction: {
      actionId: `queue_callback_launch::${callbackCase.sourceTriageTaskRef}`,
      executionFamily: "callback",
      routePath: "/workspace/callbacks",
      actionState: posture,
      actionLabel: routeRepairRequired ? "Open callback repair" : "Open callback stage",
      summary,
      dominant: routeRepairRequired || waitingEvidence,
    },
  };
}

function deriveConsequenceState(input: {
  selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle | null;
  adviceRenderBundle: Phase3AdviceRenderApplicationBundle | null;
  adminResolutionBundle: Phase3AdminResolutionPolicyApplicationBundle | null;
  adminResolutionSettlementBundle: Phase3AdminResolutionSettlementApplicationBundle | null;
  analyticsBundle: Phase3SelfCareOutcomeAnalyticsApplicationBundle | null;
}): {
  family: Extract<QueueMergeExecutionFamily, "self_care" | "admin_resolution"> | null;
  posture: QueueMergePosture | null;
  summary: string | null;
  patientExpectationDigest: string | null;
  decisionEpochRef: string | null;
  tupleRefs: readonly string[];
  launchAction: Phase3QueueCallbackAdminLaunchAction | null;
} {
  const boundaryDecision = input.selfCareBoundaryBundle?.boundaryBundle.currentBoundaryDecision;
  if (!boundaryDecision) {
    return {
      family: null,
      posture: null,
      summary: null,
      patientExpectationDigest: null,
      decisionEpochRef: null,
      tupleRefs: [],
      launchAction: null,
    };
  }

  const decisionState = optionalString(boundaryDecision.decisionState) ?? "clinician_review_required";
  const renderSettlement = input.adviceRenderBundle?.renderBundle.currentRenderSettlement ?? null;
  const adminCase = input.adminResolutionBundle?.adminResolutionBundle.currentAdminResolutionCase ?? null;
  const adminSettlement = input.adminResolutionSettlementBundle?.settlementBundle.currentSettlement ?? null;
  const expectationResolution = input.analyticsBundle?.currentExpectationResolution ?? null;

  const family: Extract<QueueMergeExecutionFamily, "self_care" | "admin_resolution"> =
    decisionState === "self_care" ? "self_care" : "admin_resolution";

  let posture: QueueMergePosture = "ready";
  let summary = `Boundary is ${labelFromToken(decisionState)}.`;

  if (family === "self_care") {
    const renderState = optionalString(renderSettlement?.renderState) ?? "withheld";
    posture =
      renderState === "renderable"
        ? "ready"
        : renderState === "superseded"
          ? "reopened"
          : renderState === "invalidated" || renderState === "quarantined"
            ? "blocked"
            : "stale_recoverable";
    summary =
      renderState === "renderable"
        ? "Self-care advice remains the canonical consequence path."
        : `Self-care render posture is ${labelFromToken(renderState)} and cannot be softened into a generic consequence chip.`;
  } else {
    const settlementResult = optionalString(adminSettlement?.result) ?? optionalString(adminCase?.caseState) ?? "queued";
    posture =
      settlementResult === "completed"
        ? "completed"
        : settlementResult === "waiting_dependency"
          ? "waiting_dependency"
          : settlementResult === "reopened_for_review"
            ? "reopened"
            : settlementResult === "blocked_pending_safety"
              ? "blocked"
              : settlementResult === "stale_recoverable"
                ? "stale_recoverable"
                : "ready";
    summary =
      settlementResult === "completed"
        ? "Bounded admin is completed, but calm queue posture still follows the completion envelope."
        : settlementResult === "waiting_dependency"
          ? "Bounded admin is waiting on dependency truth and must stay explicit."
          : settlementResult === "reopened_for_review"
            ? "Bounded admin was reopened and prior completion must not look active."
            : `Bounded admin is ${labelFromToken(settlementResult)}.`;
  }

  return {
    family,
    posture,
    summary,
    patientExpectationDigest:
      optionalString(expectationResolution?.patientExpectationTemplateRef) ??
      optionalString(adminSettlement?.patientExpectationTemplateRef) ??
      optionalString(input.adminResolutionBundle?.adminResolutionBundle.currentSubtypeProfile?.patientExpectationTemplateRef) ??
      optionalString(renderSettlement?.artifactPresentationContractRef) ??
      optionalString(input.selfCareBoundaryBundle?.boundaryBundle.currentAdviceEligibilityGrant?.adviceBundleVersionRef),
    decisionEpochRef: optionalString(boundaryDecision.decisionEpochRef),
    tupleRefs: unique([
      optionalString(boundaryDecision.selfCareBoundaryDecisionId) ?? "",
      optionalString(renderSettlement?.adviceRenderSettlementId) ?? "",
      optionalString(adminCase?.adminResolutionCaseId) ?? "",
      optionalString(adminSettlement?.adminResolutionSettlementId) ?? "",
      optionalString(input.adminResolutionBundle?.adminResolutionBundle.currentCompletionArtifact?.adminResolutionCompletionArtifactId) ?? "",
    ]),
    launchAction: {
      actionId: `queue_consequence_launch::${optionalString(boundaryDecision.taskId) ?? "task"}`,
      executionFamily: family,
      routePath: "/workspace/consequences",
      actionState: posture,
      actionLabel: family === "self_care" ? "Open self-care stage" : "Open bounded admin stage",
      summary,
      dominant: posture !== "completed",
    },
  };
}

function preferredFamily(input: {
  callback: ReturnType<typeof deriveCallbackState>;
  consequence: ReturnType<typeof deriveConsequenceState>;
}): QueueMergeExecutionFamily {
  if (input.callback.posture === "repair_required") {
    return "callback";
  }
  if (input.consequence.family === "admin_resolution" && input.consequence.posture && input.consequence.posture !== "ready") {
    return "admin_resolution";
  }
  if (input.callback.posture) {
    return "callback";
  }
  if (input.consequence.family) {
    return input.consequence.family;
  }
  return "triage_only";
}

class Phase3QueueCallbackAdminMergeApplicationImpl
  implements Phase3QueueCallbackAdminMergeApplication
{
  readonly serviceName = PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SERVICE_NAME;
  readonly schemaVersion = PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_QUERY_SURFACES;
  readonly routes = phase3QueueCallbackAdminMergeRoutes;
  readonly persistenceTables = phase3QueueCallbackAdminMergePersistenceTables;
  readonly migrationPlanRefs = phase3QueueCallbackAdminMergeMigrationPlanRefs;
  readonly queueApplication: QueueCallbackAdminPorts["queueApplication"];
  readonly callbackApplication: QueueCallbackAdminPorts["callbackApplication"];
  readonly selfCareBoundaryApplication: QueueCallbackAdminPorts["selfCareBoundaryApplication"];
  readonly adviceRenderApplication: QueueCallbackAdminPorts["adviceRenderApplication"];
  readonly adminResolutionApplication: QueueCallbackAdminPorts["adminResolutionApplication"];
  readonly adminResolutionSettlementApplication: QueueCallbackAdminPorts["adminResolutionSettlementApplication"];
  readonly analyticsApplication: QueueCallbackAdminPorts["analyticsApplication"];
  readonly completionContinuityApplication: QueueCallbackAdminPorts["completionContinuityApplication"];

  constructor(options?: Partial<QueueCallbackAdminPorts>) {
    this.queueApplication =
      options?.queueApplication ??
      createQueueRankingApplication();
    this.callbackApplication =
      options?.callbackApplication ??
      createPhase3CallbackDomainApplication();
    this.selfCareBoundaryApplication =
      options?.selfCareBoundaryApplication ??
      createPhase3SelfCareBoundaryApplication();
    this.adviceRenderApplication =
      options?.adviceRenderApplication ??
      createPhase3AdviceRenderApplication({
        selfCareBoundaryApplication: this.selfCareBoundaryApplication,
      });
    this.adminResolutionApplication =
      options?.adminResolutionApplication ??
      createPhase3AdminResolutionPolicyApplication({
        selfCareBoundaryApplication: this.selfCareBoundaryApplication,
      });
    this.adminResolutionSettlementApplication =
      options?.adminResolutionSettlementApplication ??
      createPhase3AdminResolutionSettlementApplication({
        selfCareBoundaryApplication: this.selfCareBoundaryApplication,
        adminResolutionPolicyApplication: this.adminResolutionApplication,
      });
    this.analyticsApplication =
      options?.analyticsApplication ??
      createPhase3SelfCareOutcomeAnalyticsApplication({
        selfCareBoundaryApplication: this.selfCareBoundaryApplication,
        adviceRenderApplication: this.adviceRenderApplication,
        adminResolutionApplication: this.adminResolutionApplication,
      });
    this.completionContinuityApplication =
      options?.completionContinuityApplication ??
      createPhase3TaskCompletionContinuityApplication();
  }

  async queryIntegratedQueueSurface(queueKey: string): Promise<Phase3QueueCallbackAdminQueueBundle> {
    const queue = await this.queueApplication.queryQueue(queueKey);
    if (!queue) {
      return {
        queueKey,
        rankSnapshotRef: `queue_rank_snapshot::${queueKey}`,
        rowOrderHash: "empty",
        generatedAt: null,
        digests: [],
      };
    }
    const digests = await Promise.all(
      queue.entries.map(async (entry) => {
        const taskBundle = await this.queryIntegratedTaskExecution(entryTaskId(entry), queueKey);
        return {
          ...taskBundle.digest,
          rankEntryRef: optionalString(entry.rankEntryId) ?? optionalString(entry.taskRef),
        };
      }),
    );
    return {
      queueKey,
      rankSnapshotRef: optionalString(queue.snapshot.rankSnapshotId) ?? `queue_rank_snapshot::${queueKey}`,
      rowOrderHash: optionalString(queue.snapshot.rowOrderHash) ?? digests.map((digest) => digest.taskId).join("|"),
      generatedAt: optionalString(queue.snapshot.generatedAt),
      digests,
    };
  }

  async queryIntegratedTaskExecution(
    taskId: string,
    queueKey?: string | null,
  ): Promise<Phase3QueueCallbackAdminTaskBundle> {
    const [callbackBundle, selfCareBoundaryBundle, adviceRenderBundle, adminResolutionBundle, adminResolutionSettlementBundle, analyticsBundle, completionContinuityBundle] =
      await Promise.all([
        this.callbackApplication.queryTaskCallbackDomain(taskId).catch(() => null),
        this.selfCareBoundaryApplication.queryTaskSelfCareBoundary(taskId).catch(() => null),
        this.adviceRenderApplication.queryTaskAdviceRender(taskId).catch(() => null),
        this.adminResolutionApplication.queryTaskAdminResolution(taskId).catch(() => null),
        this.adminResolutionSettlementApplication.queryTaskAdminResolutionSettlement(taskId).catch(() => null),
        this.analyticsApplication.queryTaskSelfCareOutcomeAnalytics(taskId).catch(() => null),
        this.completionContinuityApplication.queryTaskCompletionContinuity(taskId).catch(() => null),
      ]);

    const callback = deriveCallbackState(callbackBundle);
    const consequence = deriveConsequenceState({
      selfCareBoundaryBundle,
      adviceRenderBundle,
      adminResolutionBundle,
      adminResolutionSettlementBundle,
      analyticsBundle,
    });
    const preferred = preferredFamily({ callback, consequence });
    const completion = completionPosture(completionContinuityBundle);
    const queueBundle =
      queueKey && optionalString(queueKey)
        ? await this.queueApplication.queryQueue(queueKey).catch(() => null)
        : null;
    const queueEntry =
      queueBundle?.entries.find((entry) => entryTaskId(entry) === taskId) ?? null;
    const dominantPosture =
      preferred === "callback"
        ? callback.posture ?? "ready"
        : preferred === "admin_resolution" || preferred === "self_care"
          ? consequence.posture ?? "ready"
          : completion.settlementState === "blocked"
            ? "blocked"
            : "ready";

    const queueRef = queueKey ?? optionalString(completionContinuityBundle?.task?.queueKey) ?? "recommended";
    const selectedAnchorRef = `queue-row-${taskId}`;
    const launchActions = [
      callback.launchAction,
      consequence.launchAction,
    ].filter((action): action is Phase3QueueCallbackAdminLaunchAction => action !== null);

    const queueBadgeLabels = unique([
      preferred === "callback" ? `callback:${labelFromToken(callback.posture)}` : "",
      preferred !== "callback" && consequence.family
        ? `${consequence.family}:${labelFromToken(consequence.posture)}`
        : consequence.family
          ? `${consequence.family}:${labelFromToken(consequence.posture)}`
          : "",
      completion.settlementState ? `completion:${labelFromToken(completion.settlementState)}` : "",
      completion.nextTaskGateState ? `next-task:${labelFromToken(completion.nextTaskGateState)}` : "",
    ]);

    const digest: Phase3QueueCallbackAdminDigest = {
      taskId,
      queueKey: queueRef,
      rankSnapshotRef:
        optionalString(queueBundle?.snapshot.rankSnapshotId) ??
        optionalString(completionContinuityBundle?.launchContext.sourceQueueRankSnapshotRef) ??
        `queue_rank_snapshot::${queueRef}`,
      rankEntryRef:
        queueEntry === null
          ? null
          : optionalString(queueEntry.rankEntryId) ??
            optionalString(queueEntry.taskRef),
      requestLineageRef:
        optionalString(callbackBundle?.callbackCase?.requestLineageRef) ??
        optionalString(selfCareBoundaryBundle?.boundaryBundle.currentBoundaryDecision?.requestRef) ??
        optionalString(completionContinuityBundle?.task?.requestId),
      executionFamily: preferred,
      dominantPosture,
      queueBadgeLabels,
      dominantSummary:
        preferred === "callback"
          ? callback.summary ?? "Callback merge digest unavailable."
          : consequence.summary ?? "Consequence merge digest unavailable.",
      patientExpectationDigest:
        callback.expectationDigest ??
        consequence.patientExpectationDigest ??
        null,
      completionSettlementState: completion.settlementState,
      nextTaskGateState: completion.nextTaskGateState,
      continuityEvidenceRef: completion.continuityEvidenceRef,
      nextTaskLaunchLeaseRef: completion.nextTaskLaunchLeaseRef,
      decisionEpochRef: callback.decisionEpochRef ?? consequence.decisionEpochRef,
      selectedAnchorRef,
      launchActions,
      authoritativeTupleRefs: unique([
        ...callback.tupleRefs,
        ...consequence.tupleRefs,
        optionalString(completionContinuityBundle?.completionEnvelope?.taskCompletionSettlementEnvelopeId) ?? "",
        optionalString(completionContinuityBundle?.nextTaskLaunchLease?.nextTaskLaunchLeaseId) ?? "",
      ]),
    };

    return {
      taskId,
      digest,
      queueBundle:
        queueBundle === null
          ? null
          : {
              queueKey: queueRef,
              rankSnapshotRef: optionalString(queueBundle.snapshot.rankSnapshotId) ?? `queue_rank_snapshot::${queueRef}`,
              rowOrderHash:
                optionalString(queueBundle.snapshot.rowOrderHash) ??
                queueBundle.entries.map((entry) => entryTaskId(entry)).join("|"),
              generatedAt: optionalString(queueBundle.snapshot.generatedAt),
              digests: [digest],
            },
      queueEntry,
      callbackBundle,
      selfCareBoundaryBundle,
      adviceRenderBundle,
      adminResolutionBundle,
      adminResolutionSettlementBundle,
      analyticsBundle,
      completionContinuityBundle,
    };
  }
}

export function createPhase3QueueCallbackAdminMergeApplication(
  options?: Partial<QueueCallbackAdminPorts>,
): Phase3QueueCallbackAdminMergeApplication {
  return new Phase3QueueCallbackAdminMergeApplicationImpl(options);
}

export const phase3QueueCallbackAdminMergeFixture = {
  queueKey: PHASE3_QUEUE_ENGINE_FIXTURE_QUEUE_KEY,
  queueScenarioIds: phase3QueueScenarioIds,
  requiredRouteFamilies: [
    "/workspace/queue/:queueKey",
    "/workspace/callbacks",
    "/workspace/consequences",
    "/workspace/task/:taskId",
  ],
} as const;
