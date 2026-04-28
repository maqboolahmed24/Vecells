import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  createPhase3AdminResolutionSettlementKernelService,
  createPhase3AdminResolutionSettlementKernelStore,
  type AdminResolutionCrossDomainReentrySnapshot,
  type AdminResolutionLiveTupleSnapshot,
  type AdminResolutionReentryDestination,
  type AdminResolutionReentryResolution,
  type AdminResolutionSettlementActionType,
  type AdminResolutionSettlementMutationResult,
  type AdminResolutionSettlementResult,
  type AdminResolutionSettlementTrustState,
  type Phase3AdminResolutionSettlementBundle,
  type Phase3AdminResolutionSettlementKernelService,
  type Phase3AdminResolutionSettlementRepositories,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3AdminResolutionPolicyApplication,
  phase3AdminResolutionPolicyMigrationPlanRefs,
  phase3AdminResolutionPolicyPersistenceTables,
  type Phase3AdminResolutionPolicyApplication,
  type Phase3AdminResolutionPolicyApplicationBundle,
} from "./phase3-admin-resolution-policy";
import {
  createPhase3AdviceAdminDependencyApplication,
  phase3AdviceAdminDependencyMigrationPlanRefs,
  phase3AdviceAdminDependencyPersistenceTables,
  type AdviceAdminDependencyMutationInput,
  type Phase3AdviceAdminDependencyApplication,
  type Phase3AdviceAdminDependencyApplicationBundle,
} from "./phase3-advice-admin-dependency";
import {
  createPhase3ReopenLaunchApplication,
  phase3ReopenLaunchMigrationPlanRefs,
  phase3ReopenLaunchPersistenceTables,
  type GovernedReopenResult,
  type Phase3ReopenLaunchApplication,
} from "./phase3-reopen-launch-leases";
import {
  createPhase3SelfCareBoundaryApplication,
  phase3SelfCareBoundaryMigrationPlanRefs,
  phase3SelfCareBoundaryPersistenceTables,
  type Phase3SelfCareBoundaryApplication,
  type Phase3SelfCareBoundaryApplicationBundle,
} from "./phase3-self-care-boundary-grants";
import {
  createPhase3SelfCareOutcomeAnalyticsApplication,
  phase3SelfCareOutcomeAnalyticsMigrationPlanRefs,
  phase3SelfCareOutcomeAnalyticsPersistenceTables,
  type Phase3SelfCareOutcomeAnalyticsApplication,
  type Phase3SelfCareOutcomeAnalyticsApplicationBundle,
} from "./phase3-self-care-outcome-analytics";
import {
  createPhase3TaskCompletionContinuityApplication,
  phase3TaskCompletionContinuityMigrationPlanRefs,
  phase3TaskCompletionContinuityPersistenceTables,
  type Phase3TaskCompletionContinuityApplication,
  type Phase3TaskCompletionContinuityApplicationBundle,
} from "./phase3-task-completion-continuity";

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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function mapEnvelopeStateToTrustState(
  completionContinuityBundle: Phase3TaskCompletionContinuityApplicationBundle | null,
): AdminResolutionSettlementTrustState {
  const envelopeState = completionContinuityBundle?.workspaceTrustEnvelope?.envelopeState ?? null;
  switch (envelopeState) {
    case "interactive":
      return "trusted";
    case "recovery_required":
      return "quarantined";
    case "observe_only":
    case "reassigned":
    case "stale_recoverable":
    default:
      return envelopeState === null ? "trusted" : "degraded";
  }
}

type Phase3AdminResolutionCaseSnapshot =
  Phase3AdminResolutionPolicyApplicationBundle["adminResolutionBundle"]["currentAdminResolutionCase"];

type Phase3AdminResolutionArtifactSnapshot =
  Phase3AdminResolutionPolicyApplicationBundle["adminResolutionBundle"]["currentCompletionArtifact"];

export const PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SERVICE_NAME =
  "Phase3AdminResolutionSettlementApplication";
export const PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SCHEMA_VERSION =
  "254.phase3.admin-resolution-settlement-and-reentry.v1";
export const PHASE3_ADMIN_RESOLUTION_SETTLEMENT_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/admin-resolution-settlement",
] as const;

export const phase3AdminResolutionSettlementRoutes = [
  {
    routeId: "workspace_task_admin_resolution_settlement_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution-settlement",
    contractFamily: "AdminResolutionSettlementBundleContract",
    purpose:
      "Expose the authoritative AdminResolutionSettlement chain, current AdminResolutionExperienceProjection, and governed re-entry record for one bounded admin task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_record_admin_resolution_settlement",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:record-settlement",
    contractFamily: "RecordAdminResolutionSettlementCommandContract",
    purpose:
      "Record one authoritative bounded-admin settlement against the current boundary, dependency, continuity, and publication tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_settle_admin_notification",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:settle-notification",
    contractFamily: "SettleAdminNotificationCommandContract",
    purpose:
      "Settle the patient-notified posture without collapsing notification, waiting, and completion into one generic done state.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_settle_admin_waiting_state",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:settle-waiting-state",
    contractFamily: "SettleAdminWaitingStateCommandContract",
    purpose:
      "Settle one live waiting_dependency posture only while the bounded-admin tuple remains legal and the case is genuinely in waiting state.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_settle_admin_completion",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:settle-completion",
    contractFamily: "SettleAdminCompletionCommandContract",
    purpose:
      "Enter completed only when the current tuple, completion artifact, expectation binding, and continuity envelope all remain authoritative.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_reopen_admin_resolution_for_review",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:reopen-for-review",
    contractFamily: "ReopenAdminResolutionForReviewCommandContract",
    purpose:
      "Freeze bounded-admin consequence and reopen governed review with lineage-safe provenance instead of a route-local status flip.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_resolve_admin_cross_domain_reentry",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:resolve-cross-domain-reentry",
    contractFamily: "ResolveAdminCrossDomainReentryCommandContract",
    purpose:
      "Resolve the correct re-entry domain from current boundary, dependency, and stale tuple truth and write one canonical re-entry artifact.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3AdminResolutionSettlementPersistenceTables = [
  ...new Set([
    ...phase3SelfCareBoundaryPersistenceTables,
    ...phase3AdminResolutionPolicyPersistenceTables,
    ...phase3AdviceAdminDependencyPersistenceTables,
    ...phase3SelfCareOutcomeAnalyticsPersistenceTables,
    ...phase3TaskCompletionContinuityPersistenceTables,
    ...phase3ReopenLaunchPersistenceTables,
    "phase3_admin_resolution_action_records",
    "phase3_admin_resolution_settlements",
    "phase3_admin_resolution_experience_projections",
    "phase3_admin_resolution_cross_domain_reentries",
  ]),
] as const;

export const phase3AdminResolutionSettlementMigrationPlanRefs = [
  ...new Set([
    ...phase3SelfCareBoundaryMigrationPlanRefs,
    ...phase3AdminResolutionPolicyMigrationPlanRefs,
    ...phase3AdviceAdminDependencyMigrationPlanRefs,
    ...phase3SelfCareOutcomeAnalyticsMigrationPlanRefs,
    ...phase3TaskCompletionContinuityMigrationPlanRefs,
    ...phase3ReopenLaunchMigrationPlanRefs,
    "services/command-api/migrations/130_phase3_admin_resolution_settlement_and_reentry.sql",
  ]),
] as const;

export interface Phase3AdminResolutionSettlementApplicationBundle {
  settlementBundle: Phase3AdminResolutionSettlementBundle;
  selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle | null;
  adminResolutionPolicyBundle: Phase3AdminResolutionPolicyApplicationBundle | null;
  dependencyBundle: Phase3AdviceAdminDependencyApplicationBundle | null;
  analyticsBundle: Phase3SelfCareOutcomeAnalyticsApplicationBundle | null;
  completionContinuityBundle: Phase3TaskCompletionContinuityApplicationBundle | null;
  recommendedReentry: AdminResolutionReentryResolution | null;
}

export interface BaseAdminResolutionSettlementCommandInput {
  taskId: string;
  adminResolutionCaseId: string;
  actorRef: string;
  recordedAt: string;
  presentedBoundaryTupleHash?: string | null;
  presentedDecisionEpochRef?: string | null;
  presentedDependencySetRef?: string | null;
  presentedCompletionArtifactRef?: string | null;
  presentedLineageFenceEpoch?: number | null;
  reasonCodeRefs?: readonly string[];
}

export interface RecordAdminResolutionSettlementCommandInput
  extends BaseAdminResolutionSettlementCommandInput {
  actionType: AdminResolutionSettlementActionType;
  desiredResult: AdminResolutionSettlementResult;
}

export interface SettleAdminNotificationCommandInput
  extends BaseAdminResolutionSettlementCommandInput {}

export interface SettleAdminWaitingStateCommandInput
  extends BaseAdminResolutionSettlementCommandInput {}

export interface SettleAdminCompletionCommandInput
  extends BaseAdminResolutionSettlementCommandInput {}

export interface ReopenAdminResolutionForReviewCommandInput
  extends BaseAdminResolutionSettlementCommandInput {
  reopenReasonCodeRefs?: readonly string[];
}

export interface ResolveAdminCrossDomainReentryCommandInput
  extends BaseAdminResolutionSettlementCommandInput {
  preferredDestination?: AdminResolutionReentryDestination | null;
}

interface AdminResolutionSettlementContext {
  taskId: string;
  selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle | null;
  adminResolutionPolicyBundle: Phase3AdminResolutionPolicyApplicationBundle | null;
  dependencyBundle: Phase3AdviceAdminDependencyApplicationBundle | null;
  analyticsBundle: Phase3SelfCareOutcomeAnalyticsApplicationBundle | null;
  completionContinuityBundle: Phase3TaskCompletionContinuityApplicationBundle | null;
}

export interface Phase3AdminResolutionSettlementApplication {
  readonly serviceName: typeof PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_ADMIN_RESOLUTION_SETTLEMENT_QUERY_SURFACES;
  readonly routes: typeof phase3AdminResolutionSettlementRoutes;
  readonly selfCareBoundaryApplication: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  readonly adminResolutionPolicyApplication: Pick<
    Phase3AdminResolutionPolicyApplication,
    "queryTaskAdminResolution"
  >;
  readonly dependencyApplication: Pick<
    Phase3AdviceAdminDependencyApplication,
    "queryTaskAdviceAdminDependency"
  >;
  readonly analyticsApplication: Pick<
    Phase3SelfCareOutcomeAnalyticsApplication,
    "queryTaskSelfCareOutcomeAnalytics"
  >;
  readonly taskCompletionContinuityApplication: Pick<
    Phase3TaskCompletionContinuityApplication,
    | "queryTaskCompletionContinuity"
    | "settleTaskCompletion"
    | "computeContinuityEvidence"
    | "invalidateStaleContinuity"
  >;
  readonly reopenLaunchApplication: Pick<
    Phase3ReopenLaunchApplication,
    "reopenFromInvalidation"
  >;
  readonly repositories: Phase3AdminResolutionSettlementRepositories;
  readonly service: Phase3AdminResolutionSettlementKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskAdminResolutionSettlement(
    taskId: string,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle>;
  recordAdminResolutionSettlement(
    input: RecordAdminResolutionSettlementCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle>;
  settleAdminNotification(
    input: SettleAdminNotificationCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle>;
  settleAdminWaitingState(
    input: SettleAdminWaitingStateCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle>;
  settleAdminCompletion(
    input: SettleAdminCompletionCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle>;
  reopenAdminResolutionForReview(
    input: ReopenAdminResolutionForReviewCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle>;
  resolveAdminCrossDomainReentry(
    input: ResolveAdminCrossDomainReentryCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle>;
}

class Phase3AdminResolutionSettlementApplicationImpl
  implements Phase3AdminResolutionSettlementApplication
{
  readonly serviceName = PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SERVICE_NAME;
  readonly schemaVersion = PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_ADMIN_RESOLUTION_SETTLEMENT_QUERY_SURFACES;
  readonly routes = phase3AdminResolutionSettlementRoutes;
  readonly selfCareBoundaryApplication: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  readonly adminResolutionPolicyApplication: Pick<
    Phase3AdminResolutionPolicyApplication,
    "queryTaskAdminResolution"
  >;
  readonly dependencyApplication: Pick<
    Phase3AdviceAdminDependencyApplication,
    "queryTaskAdviceAdminDependency"
  >;
  readonly analyticsApplication: Pick<
    Phase3SelfCareOutcomeAnalyticsApplication,
    "queryTaskSelfCareOutcomeAnalytics"
  >;
  readonly taskCompletionContinuityApplication: Pick<
    Phase3TaskCompletionContinuityApplication,
    | "queryTaskCompletionContinuity"
    | "settleTaskCompletion"
    | "computeContinuityEvidence"
    | "invalidateStaleContinuity"
  >;
  readonly reopenLaunchApplication: Pick<
    Phase3ReopenLaunchApplication,
    "reopenFromInvalidation"
  >;
  readonly repositories: Phase3AdminResolutionSettlementRepositories;
  readonly service: Phase3AdminResolutionSettlementKernelService;
  readonly persistenceTables = phase3AdminResolutionSettlementPersistenceTables;
  readonly migrationPlanRef = phase3AdminResolutionSettlementMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3AdminResolutionSettlementMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;

  constructor(options?: {
    selfCareBoundaryApplication?: Pick<
      Phase3SelfCareBoundaryApplication,
      "queryTaskSelfCareBoundary"
    >;
    adminResolutionPolicyApplication?: Pick<
      Phase3AdminResolutionPolicyApplication,
      "queryTaskAdminResolution"
    >;
    dependencyApplication?: Pick<
      Phase3AdviceAdminDependencyApplication,
      "queryTaskAdviceAdminDependency"
    >;
    analyticsApplication?: Pick<
      Phase3SelfCareOutcomeAnalyticsApplication,
      "queryTaskSelfCareOutcomeAnalytics"
    >;
    taskCompletionContinuityApplication?: Pick<
      Phase3TaskCompletionContinuityApplication,
      | "queryTaskCompletionContinuity"
      | "settleTaskCompletion"
      | "computeContinuityEvidence"
      | "invalidateStaleContinuity"
    >;
    reopenLaunchApplication?: Pick<
      Phase3ReopenLaunchApplication,
      "reopenFromInvalidation"
    >;
    repositories?: Phase3AdminResolutionSettlementRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_admin_resolution_settlement");
    this.selfCareBoundaryApplication =
      options?.selfCareBoundaryApplication ??
      createPhase3SelfCareBoundaryApplication({
        idGenerator: this.idGenerator,
      });
    this.adminResolutionPolicyApplication =
      options?.adminResolutionPolicyApplication ??
      createPhase3AdminResolutionPolicyApplication({
        idGenerator: this.idGenerator,
        selfCareBoundaryApplication: this.selfCareBoundaryApplication,
      });
    this.dependencyApplication =
      options?.dependencyApplication ??
      createPhase3AdviceAdminDependencyApplication({
        idGenerator: this.idGenerator,
        selfCareBoundaryApplication: this.selfCareBoundaryApplication,
        adminResolutionApplication: this.adminResolutionPolicyApplication,
      });
    this.analyticsApplication =
      options?.analyticsApplication ??
      createPhase3SelfCareOutcomeAnalyticsApplication({
        idGenerator: this.idGenerator,
        selfCareBoundaryApplication: this.selfCareBoundaryApplication,
        adminResolutionApplication: this.adminResolutionPolicyApplication,
        dependencyApplication: this.dependencyApplication,
      });
    this.taskCompletionContinuityApplication =
      options?.taskCompletionContinuityApplication ??
      createPhase3TaskCompletionContinuityApplication({
        idGenerator: this.idGenerator,
      });
    this.reopenLaunchApplication =
      options?.reopenLaunchApplication ??
      createPhase3ReopenLaunchApplication({
        idGenerator: this.idGenerator,
      });
    this.repositories =
      options?.repositories ?? createPhase3AdminResolutionSettlementKernelStore();
    this.service = createPhase3AdminResolutionSettlementKernelService(this.repositories, {
      idGenerator: this.idGenerator,
    });
  }

  async queryTaskAdminResolutionSettlement(
    taskId: string,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle> {
    const context = await this.collectContext(taskId);
    const settlementBundle = await this.service.queryTaskBundle(taskId);
    return {
      settlementBundle,
      selfCareBoundaryBundle: context.selfCareBoundaryBundle,
      adminResolutionPolicyBundle: context.adminResolutionPolicyBundle,
      dependencyBundle: context.dependencyBundle,
      analyticsBundle: context.analyticsBundle,
      completionContinuityBundle: context.completionContinuityBundle,
      recommendedReentry: this.deriveRecommendedReentry(context, settlementBundle.currentSettlement),
    };
  }

  async recordAdminResolutionSettlement(
    input: RecordAdminResolutionSettlementCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle> {
    return this.applySettlementCommand(input, input.actionType, input.desiredResult, false);
  }

  async settleAdminNotification(
    input: SettleAdminNotificationCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle> {
    return this.applySettlementCommand(input, "notify_patient", "patient_notified", false);
  }

  async settleAdminWaitingState(
    input: SettleAdminWaitingStateCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle> {
    return this.applySettlementCommand(input, "wait_dependency", "waiting_dependency", false);
  }

  async settleAdminCompletion(
    input: SettleAdminCompletionCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle> {
    return this.applySettlementCommand(input, "record_completion", "completed", false);
  }

  async reopenAdminResolutionForReview(
    input: ReopenAdminResolutionForReviewCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle> {
    return this.applySettlementCommand(
      {
        ...input,
        reasonCodeRefs: uniqueSorted([...(input.reasonCodeRefs ?? []), ...(input.reopenReasonCodeRefs ?? [])]),
      },
      "reopen_for_review",
      "reopened_for_review",
      true,
    );
  }

  async resolveAdminCrossDomainReentry(
    input: ResolveAdminCrossDomainReentryCommandInput,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle> {
    const context = await this.requireContext(input.taskId, input.adminResolutionCaseId);
    const settlementBundle = await this.service.queryTaskBundle(input.taskId);
    invariant(
      settlementBundle.currentSettlement,
      "ADMIN_RESOLUTION_SETTLEMENT_REQUIRED",
      `Task ${input.taskId} requires a current AdminResolutionSettlement before resolving re-entry.`,
    );
    const reentryResolution =
      this.deriveForcedReentry(
        context,
        settlementBundle.currentSettlement,
        false,
        input.preferredDestination ?? null,
      ) ??
      this.deriveRecommendedReentry(context, settlementBundle.currentSettlement);
    invariant(
      reentryResolution,
      "ADMIN_RESOLUTION_REENTRY_NOT_REQUIRED",
      "Current bounded-admin tuple does not require cross-domain re-entry.",
    );
    const reentry = await this.persistReentry(context, settlementBundle.currentSettlement, reentryResolution, input);
    await this.refreshProjectionWithReentry(
      context,
      settlementBundle.currentSettlement,
      reentry,
      input.recordedAt,
      context.completionContinuityBundle,
    );
    return this.queryTaskAdminResolutionSettlement(input.taskId);
  }

  private async applySettlementCommand(
    input: BaseAdminResolutionSettlementCommandInput,
    actionType: AdminResolutionSettlementActionType,
    desiredResult: AdminResolutionSettlementResult,
    forceReentry: boolean,
  ): Promise<Phase3AdminResolutionSettlementApplicationBundle> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const context = await this.requireContext(input.taskId, input.adminResolutionCaseId);

    if (desiredResult === "waiting_dependency") {
      invariant(
        context.currentCase.waitingState !== "none",
        "ADMIN_RESOLUTION_WAITING_STATE_REQUIRED",
        "settleAdminWaitingState requires the current AdminResolutionCase to already be in a waiting posture.",
      );
    }

    const provisionalSettlement = {
      result: desiredResult,
      taskId: input.taskId,
      adminResolutionCaseRef: context.currentCase.adminResolutionCaseId,
      boundaryDecisionRef: context.currentCase.boundaryDecisionRef,
      boundaryTupleHash: context.currentCase.boundaryTupleHash,
      decisionEpochRef: context.currentCase.decisionEpochRef,
      dependencySetRef:
        context.dependencyBundle?.currentDependencySetRef ?? context.currentCase.dependencySetRef ?? "dependency_set_missing",
      recoveryRouteRef: `/workspace/task/${input.taskId}/admin-resolution`,
    };
    const reentryResolution = this.deriveForcedReentry(
      context,
      provisionalSettlement,
      forceReentry,
      null,
    );
    const finalResult =
      reentryResolution === null
        ? desiredResult
        : reentryResolution.destination === "clinician_review" ||
            reentryResolution.destination === "triage_review"
          ? "reopened_for_review"
          : "blocked_pending_safety";

    const reopenResult =
      reentryResolution?.resolverMode === "reopen_launch"
        ? await this.reopenLaunchApplication.reopenFromInvalidation({
            taskId: input.taskId,
            actorRef: input.actorRef,
            recordedAt,
            reasonCode: reentryResolution.causalReasonCodeRefs[0] ?? "admin_resolution_reentry",
            evidenceRefs: uniqueSorted([...(input.reasonCodeRefs ?? []), ...reentryResolution.causalReasonCodeRefs]).map(
              (reason) => `reason://${reason}`,
            ),
            sourceDomain: "direct_resolution",
          })
        : null;

    const completionContinuityBundle = await this.reconcileCompletionContinuity({
      taskId: input.taskId,
      actorRef: input.actorRef,
      recordedAt,
      finalResult,
    });
    const liveTuple = this.buildLiveTuple(context, completionContinuityBundle, actionType, reopenResult);
    const mutationResult = await this.service.recordAdminResolutionSettlement({
      adminResolutionCaseRef: context.currentCase.adminResolutionCaseId,
      caseBoundaryDecisionRef: context.currentCase.boundaryDecisionRef,
      caseBoundaryTupleHash: context.currentCase.boundaryTupleHash,
      caseDecisionEpochRef: context.currentCase.decisionEpochRef,
      caseLineageFenceEpoch: context.currentCase.lineageFenceEpoch,
      actionType,
      desiredResult: finalResult,
      actorRef: input.actorRef,
      recordedAt,
      policyBundleRef: context.currentCase.policyBundleRef,
      liveTuple,
      presentedBoundaryTupleHash: input.presentedBoundaryTupleHash,
      presentedDecisionEpochRef: input.presentedDecisionEpochRef,
      presentedDependencySetRef: input.presentedDependencySetRef,
      presentedCompletionArtifactRef: input.presentedCompletionArtifactRef,
      presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      completionArtifactRef: context.currentCompletionArtifact?.adminResolutionCompletionArtifactId ?? null,
      patientExpectationTemplateRef:
        context.analyticsBundle?.currentExpectationResolution?.patientExpectationTemplateRef ??
        context.currentCompletionArtifact?.patientExpectationTemplateRef ??
        null,
      reasonCodeRefs: uniqueSorted([
        ...(input.reasonCodeRefs ?? []),
        ...(reentryResolution?.causalReasonCodeRefs ?? []),
        actionType === "notify_patient"
          ? "admin_resolution_notification_settled"
          : actionType === "wait_dependency"
            ? "admin_resolution_waiting_settled"
            : actionType === "record_completion"
              ? "admin_resolution_completion_settled"
              : actionType === "reopen_for_review"
                ? "admin_resolution_reopened_for_review"
                : actionType === "block_pending_safety"
                  ? "admin_resolution_blocked_pending_safety"
                  : "admin_resolution_settlement_recorded",
      ]),
    });

    if (reentryResolution) {
      const reentry = await this.persistReentry(context, mutationResult.settlement, reentryResolution, {
        ...input,
        adminResolutionCaseId: context.currentCase.adminResolutionCaseId,
      }, reopenResult);
      await this.refreshProjectionWithReentry(
        context,
        mutationResult.settlement,
        reentry,
        recordedAt,
        completionContinuityBundle,
      );
    }

    return this.queryTaskAdminResolutionSettlement(input.taskId);
  }

  private async collectContext(taskId: string): Promise<AdminResolutionSettlementContext> {
    const [selfCareBoundaryBundle, adminResolutionPolicyBundle, dependencyBundle, analyticsBundle, completionContinuityBundle] =
      await Promise.all([
        this.selfCareBoundaryApplication.queryTaskSelfCareBoundary(taskId).catch(() => null),
        this.adminResolutionPolicyApplication.queryTaskAdminResolution(taskId).catch(() => null),
        this.dependencyApplication.queryTaskAdviceAdminDependency(taskId).catch(() => null),
        this.analyticsApplication.queryTaskSelfCareOutcomeAnalytics(taskId).catch(() => null),
        this.taskCompletionContinuityApplication.queryTaskCompletionContinuity(taskId).catch(() => null),
      ]);
    return {
      taskId,
      selfCareBoundaryBundle,
      adminResolutionPolicyBundle,
      dependencyBundle,
      analyticsBundle,
      completionContinuityBundle,
    };
  }

  private async requireContext(
    taskId: string,
    adminResolutionCaseId: string,
  ): Promise<
    AdminResolutionSettlementContext & {
      currentCase: NonNullable<Phase3AdminResolutionCaseSnapshot>;
      currentCompletionArtifact: Phase3AdminResolutionArtifactSnapshot;
    }
  > {
    const context = await this.collectContext(taskId);
    invariant(
      context.selfCareBoundaryBundle !== null,
      "SELF_CARE_BOUNDARY_BUNDLE_REQUIRED",
      `Task ${taskId} requires the live 249 boundary bundle before admin settlement can proceed.`,
    );
    invariant(
      context.adminResolutionPolicyBundle !== null,
      "ADMIN_RESOLUTION_POLICY_BUNDLE_REQUIRED",
      `Task ${taskId} requires the 251 admin-resolution policy bundle before settlement can proceed.`,
    );
    const currentCase = context.adminResolutionPolicyBundle.adminResolutionBundle.currentAdminResolutionCase;
    invariant(
      currentCase !== null,
      "ADMIN_RESOLUTION_CASE_REQUIRED",
      `Task ${taskId} requires a current AdminResolutionCase before 254 settlement can proceed.`,
    );
    invariant(
      currentCase.adminResolutionCaseId === requireRef(adminResolutionCaseId, "adminResolutionCaseId"),
      "ADMIN_RESOLUTION_CASE_MISMATCH",
      "Presented AdminResolutionCase does not match the current bounded-admin case for this task.",
    );
    return {
      ...context,
      currentCase,
      currentCompletionArtifact:
        context.adminResolutionPolicyBundle.adminResolutionBundle.currentCompletionArtifact,
    };
  }

  private buildLiveTuple(
    context: AdminResolutionSettlementContext & {
      currentCase: NonNullable<Phase3AdminResolutionCaseSnapshot>;
      currentCompletionArtifact: Phase3AdminResolutionArtifactSnapshot;
    },
    completionContinuityBundle: Phase3TaskCompletionContinuityApplicationBundle | null,
    actionType: AdminResolutionSettlementActionType,
    reopenResult: GovernedReopenResult | null,
  ): AdminResolutionLiveTupleSnapshot {
    const boundary =
      context.selfCareBoundaryBundle?.boundaryBundle.currentBoundaryDecision ?? null;
    const trustState = mapEnvelopeStateToTrustState(completionContinuityBundle);
    const completionEnvelopeRef =
      completionContinuityBundle?.completionEnvelope?.taskCompletionSettlementEnvelopeId ??
      completionContinuityBundle?.task.taskCompletionSettlementEnvelopeRef ??
      `task_completion_settlement_envelope_${context.taskId}`;
    const surfaceRouteContractRef =
      completionContinuityBundle?.reviewSession.surfaceRouteContractRef ??
      "surface_route_contract.workspace.admin_resolution";
    const surfacePublicationRef =
      completionContinuityBundle?.reviewSession.surfacePublicationRef ??
      "surface_publication.workspace.admin_resolution.current";
    const runtimePublicationBundleRef =
      completionContinuityBundle?.reviewSession.runtimePublicationBundleRef ??
      "runtime_publication_bundle.workspace.admin_resolution.current";
    const selectedAnchorRef =
      completionContinuityBundle?.reviewSession.selectedAnchorRef ??
      boundary?.selectedAnchorRef ??
      `anchor_${context.taskId}`;
    const trustEnvelope = completionContinuityBundle?.workspaceTrustEnvelope ?? null;
    const continuityProjection =
      completionContinuityBundle?.workspaceContinuityEvidenceProjection ?? null;
    return {
      taskId: context.taskId,
      currentBoundaryDecisionRef:
        boundary?.selfCareBoundaryDecisionId ?? context.currentCase.boundaryDecisionRef,
      currentBoundaryTupleHash: boundary?.boundaryTupleHash ?? context.currentCase.boundaryTupleHash,
      currentBoundaryState: boundary?.boundaryState ?? "live",
      currentClinicalMeaningState:
        boundary?.clinicalMeaningState ?? context.currentCase.clinicalMeaningState,
      currentOperationalFollowUpScope:
        boundary?.operationalFollowUpScope ?? context.currentCase.operationalFollowUpScope,
      currentAdminMutationAuthorityState:
        boundary?.adminMutationAuthorityState ?? context.currentCase.adminMutationAuthorityState,
      currentDecisionEpochRef:
        reopenResult?.decisionSupersessionRecordRef
          ? context.currentCase.decisionEpochRef
          : (boundary?.decisionEpochRef ?? context.currentCase.decisionEpochRef),
      currentDecisionSupersessionRecordRef:
        reopenResult?.decisionSupersessionRecordRef ??
        boundary?.decisionSupersessionRecordRef ??
        null,
      currentDependencySetRef:
        context.dependencyBundle?.currentDependencySetRef ??
        context.currentCase.dependencySetRef ??
        "dependency_set_missing",
      currentDependencyReopenState:
        context.dependencyBundle?.projection.reopenState ?? boundary?.reopenState ?? "stable",
      canContinueCurrentConsequence:
        context.dependencyBundle?.projection.canContinueCurrentConsequence ?? true,
      currentLineageFenceEpoch: context.currentCase.lineageFenceEpoch,
      currentCompletionArtifactRef:
        context.currentCompletionArtifact?.adminResolutionCompletionArtifactId ?? null,
      currentPatientExpectationTemplateRef:
        context.analyticsBundle?.currentExpectationResolution?.patientExpectationTemplateRef ??
        context.currentCompletionArtifact?.patientExpectationTemplateRef ??
        context.adminResolutionPolicyBundle?.adminResolutionBundle.currentSubtypeProfile?.patientExpectationTemplateRef ??
        null,
      currentReopenState: boundary?.reopenState ?? context.currentCase.reopenState,
      currentVisibilityTier:
        context.currentCompletionArtifact?.visibilityTier ?? "patient_authenticated",
      currentSummarySafetyTier:
        context.currentCompletionArtifact?.summarySafetyTier ?? "clinical_safe_summary",
      currentPlaceholderContractRef:
        context.currentCompletionArtifact?.placeholderContractRef ??
        "placeholder_contract.admin_resolution.default",
      currentReleaseState: context.currentCompletionArtifact?.releaseState ?? "current",
      currentTrustState: trustState,
      currentSurfaceRouteContractRef: surfaceRouteContractRef,
      currentSurfacePublicationRef: surfacePublicationRef,
      currentRuntimePublicationBundleRef: runtimePublicationBundleRef,
      currentTaskCompletionSettlementEnvelopeRef: completionEnvelopeRef,
      currentSelectedAnchorRef: selectedAnchorRef,
      currentRouteFamilyRef: "rf_workspace_phase3_triage",
      currentPatientShellConsistencyProjectionRef: `patient_shell_consistency_projection_${context.taskId}`,
      currentPatientEmbeddedSessionProjectionRef: `patient_embedded_session_projection_${context.taskId}`,
      currentStaffWorkspaceConsistencyProjectionRef:
        trustEnvelope?.workspaceConsistencyProjectionRef ??
        `staff_workspace_consistency_projection_${context.taskId}`,
      currentWorkspaceSliceTrustProjectionRef:
        trustEnvelope?.workspaceSliceTrustProjectionRef ??
        `workspace_slice_trust_projection_${context.taskId}`,
      currentConsistencyProjectionRef:
        continuityProjection?.workspaceContinuityEvidenceProjectionId ??
        `workspace_continuity_evidence_projection_${context.taskId}`,
      currentVisibilityPolicyRef: "visibility_policy.admin_resolution.current",
      currentAudienceTier:
        context.selfCareBoundaryBundle?.boundaryBundle.currentAdviceEligibilityGrant?.audienceTier ??
        "patient_authenticated",
      currentTransitionEnvelopeRef: `transition_envelope.admin_resolution.${context.taskId}.${actionType}`,
      currentReleaseWatchRef:
        context.currentCase.releaseWatchRef ?? "release_watch.admin_resolution.current",
      currentRouteIntentBindingRef:
        boundary?.routeIntentBindingRef ?? `route_intent_binding_admin_resolution_${context.taskId}`,
      currentReviewActionLeaseRef:
        completionContinuityBundle?.reviewSession.reviewActionLeaseRef ??
        `review_action_lease_${context.taskId}`,
      currentReviewActionOwnershipEpochRef: `review_action_ownership_epoch_${context.taskId}_${context.currentCase.lineageFenceEpoch}`,
      currentReviewActionFencingToken:
        completionContinuityBundle?.task.fencingToken ?? `review_action_fencing_token_${context.taskId}`,
      currentWorkspaceConsistencyProjectionRef:
        trustEnvelope?.workspaceConsistencyProjectionRef ??
        `workspace_consistency_projection_${context.taskId}`,
      currentWorkspaceTrustProjectionRef:
        trustEnvelope?.workspaceSliceTrustProjectionRef ??
        `workspace_trust_projection_${context.taskId}`,
      currentCommandActionRef: `command_action.admin_resolution.${context.taskId}.${actionType}`,
      currentCommandSettlementRef: `command_settlement.admin_resolution.${context.taskId}.${actionType}`,
      currentReleaseApprovalFreezeRef: `release_approval_freeze.${context.currentCompletionArtifact?.releaseState ?? "current"}`,
      currentChannelReleaseFreezeRef: `channel_release_freeze.${context.currentCompletionArtifact?.releaseState ?? "current"}`,
    };
  }

  private deriveForcedReentry(
    context: AdminResolutionSettlementContext & {
      currentCase: NonNullable<Phase3AdminResolutionCaseSnapshot>;
      currentCompletionArtifact: Phase3AdminResolutionArtifactSnapshot;
    },
    provisionalSettlement: {
      result: AdminResolutionSettlementResult;
      taskId: string;
      adminResolutionCaseRef: string;
      boundaryDecisionRef: string;
      boundaryTupleHash: string;
      decisionEpochRef: string;
      dependencySetRef: string;
      recoveryRouteRef: string;
    },
    forceReentry: boolean,
    preferredDestination: AdminResolutionReentryDestination | null,
  ): AdminResolutionReentryResolution | null {
    if (forceReentry) {
      return {
        destination: preferredDestination ?? "clinician_review",
        resolverMode: "reopen_launch",
        reasonClass: "clinical_reentry",
        causalReasonCodeRefs: ["admin_resolution_manual_reopen_requested"],
        preserveSupersededProvenance: true,
        continuityHintRef: "continuity_hint.same_shell_reopen_launch",
        recoveryRouteRef: `/workspace/task/${context.taskId}/decision`,
      };
    }

    const boundary = context.selfCareBoundaryBundle?.boundaryBundle.currentBoundaryDecision ?? null;
    const dependencyProjection = context.dependencyBundle?.projection ?? null;
    const currentDependencySet =
      context.dependencyBundle?.dependencyBundle.currentAdviceAdminDependencySet ?? null;
    const liveTupleIsIllegal =
      boundary === null ||
      boundary.boundaryState !== "live" ||
      boundary.clinicalMeaningState !== "bounded_admin_only" ||
      boundary.operationalFollowUpScope !== "bounded_admin_resolution" ||
      boundary.adminMutationAuthorityState !== "bounded_admin_only" ||
      boundary.reopenState !== "stable" ||
      optionalRef(boundary.decisionSupersessionRecordRef) !== null ||
      (dependencyProjection !== null &&
        (!dependencyProjection.canContinueCurrentConsequence ||
          (dependencyProjection.reopenState !== null &&
            dependencyProjection.reopenState !== "stable")));

    if (!liveTupleIsIllegal) {
      return null;
    }

    const resolved = this.service.reentryResolver.resolve({
      settlement: provisionalSettlement,
      liveTuple: {
        currentClinicalMeaningState: boundary?.clinicalMeaningState ?? "clinician_reentry_required",
        currentBoundaryState: boundary?.boundaryState ?? "blocked",
        currentReopenState: boundary?.reopenState ?? "blocked_pending_review",
        currentDependencyReopenState: dependencyProjection?.reopenState ?? null,
        currentDependencySetRef:
          context.dependencyBundle?.currentDependencySetRef ??
          context.currentCase.dependencySetRef ??
          "dependency_set_missing",
        canContinueCurrentConsequence:
          dependencyProjection?.canContinueCurrentConsequence ?? false,
      },
      reasonCodeRefs: uniqueSorted([
        ...(boundary?.reasonCodeRefs ?? []),
        ...(currentDependencySet?.reasonCodeRefs ?? []),
      ]),
      dominantRecoveryRouteRef: dependencyProjection?.dominantRecoveryRouteRef ?? null,
      dominantBlockerRef: dependencyProjection?.dominantBlockerRef ?? null,
    });

    if (preferredDestination) {
      return {
        ...resolved,
        destination: preferredDestination,
      };
    }
    return resolved;
  }

  private deriveRecommendedReentry(
    context: AdminResolutionSettlementContext,
    currentSettlement: Phase3AdminResolutionSettlementBundle["currentSettlement"],
  ): AdminResolutionReentryResolution | null {
    if (!currentSettlement || !context.adminResolutionPolicyBundle?.adminResolutionBundle.currentAdminResolutionCase) {
      return null;
    }
    return this.deriveForcedReentry(
      {
        ...context,
        currentCase: context.adminResolutionPolicyBundle.adminResolutionBundle.currentAdminResolutionCase,
        currentCompletionArtifact:
          context.adminResolutionPolicyBundle.adminResolutionBundle.currentCompletionArtifact,
      },
      {
        result: currentSettlement.result,
        taskId: currentSettlement.taskId,
        adminResolutionCaseRef: currentSettlement.adminResolutionCaseRef,
        boundaryDecisionRef: currentSettlement.boundaryDecisionRef,
        boundaryTupleHash: currentSettlement.boundaryTupleHash,
        decisionEpochRef: currentSettlement.decisionEpochRef,
        dependencySetRef: currentSettlement.dependencySetRef,
        recoveryRouteRef: currentSettlement.recoveryRouteRef,
      },
      false,
      null,
    );
  }

  private async reconcileCompletionContinuity(options: {
    taskId: string;
    actorRef: string;
    recordedAt: string;
    finalResult: AdminResolutionSettlementResult;
  }): Promise<Phase3TaskCompletionContinuityApplicationBundle | null> {
    switch (options.finalResult) {
      case "completed":
        return this.taskCompletionContinuityApplication.settleTaskCompletion({
          taskId: options.taskId,
          actorRef: options.actorRef,
          recordedAt: options.recordedAt,
        });
      case "reopened_for_review":
      case "blocked_pending_safety":
        return this.taskCompletionContinuityApplication.invalidateStaleContinuity({
          taskId: options.taskId,
          actorRef: options.actorRef,
          recordedAt: options.recordedAt,
          invalidationReason: "reopened",
        });
      case "stale_recoverable":
        return this.taskCompletionContinuityApplication.invalidateStaleContinuity({
          taskId: options.taskId,
          actorRef: options.actorRef,
          recordedAt: options.recordedAt,
          invalidationReason: "decision_superseded",
        });
      case "queued":
      case "patient_notified":
      case "waiting_dependency":
      default:
        return this.taskCompletionContinuityApplication.computeContinuityEvidence({
          taskId: options.taskId,
          recordedAt: options.recordedAt,
        });
    }
  }

  private async persistReentry(
    context: AdminResolutionSettlementContext & {
      currentCase: NonNullable<Phase3AdminResolutionCaseSnapshot>;
      currentCompletionArtifact: Phase3AdminResolutionArtifactSnapshot;
    },
    settlement: AdminResolutionSettlementMutationResult["settlement"] | Phase3AdminResolutionSettlementBundle["currentSettlement"],
    reentryResolution: AdminResolutionReentryResolution,
    input:
      | ResolveAdminCrossDomainReentryCommandInput
      | BaseAdminResolutionSettlementCommandInput,
    reopenResult?: GovernedReopenResult | null,
  ): Promise<AdminResolutionCrossDomainReentrySnapshot> {
    invariant(settlement !== null, "ADMIN_RESOLUTION_SETTLEMENT_REQUIRED", "Settlement is required.");
    return this.service.resolveAdminCrossDomainReentry({
      adminResolutionCaseRef: context.currentCase.adminResolutionCaseId,
      originatingSettlementRef: settlement.adminResolutionSettlementId,
      decisionEpochRef: settlement.decisionEpochRef,
      boundaryDecisionRef: settlement.boundaryDecisionRef,
      boundaryTupleHash: settlement.boundaryTupleHash,
      dependencySetRef: settlement.dependencySetRef,
      destination: reentryResolution.destination,
      resolverMode: reentryResolution.resolverMode,
      reasonClass: reentryResolution.reasonClass,
      causalReasonCodeRefs: uniqueSorted([
        ...(input.reasonCodeRefs ?? []),
        ...reentryResolution.causalReasonCodeRefs,
      ]),
      preserveSupersededProvenance: reentryResolution.preserveSupersededProvenance,
      createdGovernedArtifactRef: reopenResult?.reopenRecord.reopenRecordId ?? null,
      reusedGovernedArtifactRef: reopenResult?.queuedTaskTransition?.task.taskId ?? null,
      continuityHintRef: reentryResolution.continuityHintRef,
      recoveryRouteRef: reentryResolution.recoveryRouteRef,
      createdAt: input.recordedAt,
    });
  }

  private async refreshProjectionWithReentry(
    context: AdminResolutionSettlementContext & {
      currentCase: NonNullable<Phase3AdminResolutionCaseSnapshot>;
      currentCompletionArtifact: Phase3AdminResolutionArtifactSnapshot;
    },
    settlement: AdminResolutionSettlementMutationResult["settlement"] | Phase3AdminResolutionSettlementBundle["currentSettlement"],
    reentry: AdminResolutionCrossDomainReentrySnapshot,
    recordedAt: string,
    completionContinuityBundle: Phase3TaskCompletionContinuityApplicationBundle | null,
  ): Promise<void> {
    invariant(settlement !== null, "ADMIN_RESOLUTION_SETTLEMENT_REQUIRED", "Settlement is required.");
    const liveTuple = this.buildLiveTuple(
      context,
      completionContinuityBundle,
      settlement.result === "completed" ? "record_completion" : "reopen_for_review",
      null,
    );
    const projection = this.service.projectionReconciler.reconcile({
      settlement,
      liveTuple,
      reentry,
      computedAt: recordedAt,
    });
    await this.repositories.saveAdminResolutionExperienceProjection(projection);
  }
}

export function createPhase3AdminResolutionSettlementApplication(options?: {
  selfCareBoundaryApplication?: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  adminResolutionPolicyApplication?: Pick<
    Phase3AdminResolutionPolicyApplication,
    "queryTaskAdminResolution"
  >;
  dependencyApplication?: Pick<
    Phase3AdviceAdminDependencyApplication,
    "queryTaskAdviceAdminDependency"
  >;
  analyticsApplication?: Pick<
    Phase3SelfCareOutcomeAnalyticsApplication,
    "queryTaskSelfCareOutcomeAnalytics"
  >;
  taskCompletionContinuityApplication?: Pick<
    Phase3TaskCompletionContinuityApplication,
    | "queryTaskCompletionContinuity"
    | "settleTaskCompletion"
    | "computeContinuityEvidence"
    | "invalidateStaleContinuity"
  >;
  reopenLaunchApplication?: Pick<
    Phase3ReopenLaunchApplication,
    "reopenFromInvalidation"
  >;
  repositories?: Phase3AdminResolutionSettlementRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3AdminResolutionSettlementApplication {
  return new Phase3AdminResolutionSettlementApplicationImpl(options);
}
