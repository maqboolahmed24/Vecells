import { createDeterministicBackboneIdGenerator, type BackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3SelfCareBoundaryKernelService,
  createPhase3SelfCareBoundaryKernelStore,
  type AdviceEligibilityGrantSnapshot,
  type AdviceEligibilityGrantState,
  type AdviceEligibilityGrantTransitionCauseClass,
  type ClassifySelfCareBoundaryInput,
  type EndpointDecisionBundle,
  type Phase3ApprovalEscalationBundle,
  type Phase3DirectResolutionBundle,
  type Phase3SelfCareBoundaryBundle,
  type Phase3SelfCareBoundaryKernelRepositories,
  type Phase3SelfCareBoundaryKernelService,
  type SelfCareBoundaryDecisionSnapshot,
  type SelfCareBoundarySupersessionCauseClass,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3ApprovalEscalationApplication,
  phase3ApprovalEscalationMigrationPlanRefs,
  phase3ApprovalEscalationPersistenceTables,
  type Phase3ApprovalEscalationApplication,
} from "./phase3-approval-escalation";
import {
  createPhase3DirectResolutionApplication,
  phase3DirectResolutionMigrationPlanRefs,
  phase3DirectResolutionPersistenceTables,
  type Phase3DirectResolutionApplication,
} from "./phase3-direct-resolution-handoffs";
import {
  createPhase3EndpointDecisionEngineApplication,
  phase3EndpointDecisionMigrationPlanRefs,
  phase3EndpointDecisionPersistenceTables,
  type Phase3EndpointDecisionEngineApplication,
} from "./phase3-endpoint-decision-engine";
import {
  createPhase3TriageKernelApplication,
  phase3TriageKernelMigrationPlanRefs,
  phase3TriageKernelPersistenceTables,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

type TaskSnapshot = {
  taskId: string;
  requestId: string;
  status: string;
  currentLineageFenceEpoch: number;
  currentDecisionEpochRef: string | null;
  activeReviewSessionRef: string | null;
  currentEndpointDecisionRef: string | null;
  latestDecisionSupersessionRef: string | null;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
};

type ReviewSessionSnapshot = {
  reviewSessionId: string;
  sessionState: string;
  selectedAnchorRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  workspaceSliceTrustProjectionRef: string;
};

type RequestSnapshot = {
  requestId: string;
  requestLineageRef: string;
  currentEvidenceSnapshotRef: string | null;
  currentSafetyDecisionRef: string | null;
  currentSafetyPreemptionRef: string | null;
  currentUrgentDiversionSettlementRef: string | null;
  currentIdentityBindingRef: string | null;
  safetyState: string;
};

type EndpointActionSnapshot = {
  decisionId: string;
  routeIntentBindingRef: string;
  recordedAt: string;
};

interface SelfCareBoundaryTriagePort {
  triageRepositories: Pick<Phase3TriageKernelApplication["triageRepositories"], "getTask" | "getReviewSession">;
  controlPlaneRepositories: Pick<Phase3TriageKernelApplication["controlPlaneRepositories"], "getRequest">;
}

interface SelfCareBoundaryEndpointPort {
  queryTaskEndpointDecision(taskId: string): Promise<EndpointDecisionBundle | null>;
  decisionRepositories: Pick<
    Phase3EndpointDecisionEngineApplication["decisionRepositories"],
    "listActionRecordsForTask"
  >;
}

interface SelfCareBoundaryApprovalPort {
  queryTaskApprovalEscalation(taskId: string): Promise<Phase3ApprovalEscalationBundle>;
}

interface SelfCareBoundaryDirectResolutionPort {
  queryTaskDirectResolution(taskId: string): Promise<Phase3DirectResolutionBundle>;
}

interface ResolvedSelfCareBoundaryContext {
  task: TaskSnapshot;
  request: RequestSnapshot;
  reviewSession: ReviewSessionSnapshot | null;
  endpointBundle: EndpointDecisionBundle | null;
  approvalBundle: Phase3ApprovalEscalationBundle | null;
  directResolutionBundle: Phase3DirectResolutionBundle | null;
  currentEndpointAction: EndpointActionSnapshot | null;
  currentRouteIntentBindingRef: string | null;
  currentSessionEpochRef: string | null;
  currentSubjectBindingVersionRef: string | null;
  currentSurfaceRouteContractRef: string | null;
  currentSurfacePublicationRef: string | null;
  currentRuntimePublicationBundleRef: string | null;
  currentTrustRef: string | null;
}

export const PHASE3_SELF_CARE_BOUNDARY_SERVICE_NAME =
  "Phase3SelfCareBoundaryAndAdviceGrantApplication";
export const PHASE3_SELF_CARE_BOUNDARY_SCHEMA_VERSION =
  "249.phase3.self-care-boundary-and-grants.v1";
export const PHASE3_SELF_CARE_BOUNDARY_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/self-care-boundary",
] as const;

export const phase3SelfCareBoundaryRoutes = [
  {
    routeId: "workspace_task_self_care_boundary_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/self-care-boundary",
    contractFamily: "SelfCareBoundaryBundleContract",
    purpose:
      "Expose the current SelfCareBoundaryDecision, AdviceEligibilityGrant posture, upstream endpoint and approval dependencies, and the stable tuple that later advice-render and admin-resolution tasks consume.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_classify_self_care_boundary",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:classify-self-care-boundary",
    contractFamily: "ClassifySelfCareBoundaryCommandContract",
    purpose:
      "Classify the authoritative self-care versus bounded-admin versus clinician-review boundary from the current endpoint, evidence, route-intent, selected-anchor, and lineage-fence tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_issue_advice_eligibility_grant",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/self-care-boundary/{boundaryDecisionId}:issue-advice-grant",
    contractFamily: "IssueAdviceEligibilityGrantCommandContract",
    purpose:
      "Issue one narrow AdviceEligibilityGrant bound to the current self-care tuple, audience tier, route family, subject binding, session epoch, and publication or trust tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_supersede_self_care_boundary",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/self-care-boundary/{boundaryDecisionId}:supersede",
    contractFamily: "SupersedeSelfCareBoundaryCommandContract",
    purpose:
      "Supersede the current boundary and mint a replacement classification when evidence, safety, route, publication, trust, or reopen drift invalidates the prior tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_invalidate_advice_eligibility_grant",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/advice-grants/{grantId}:invalidate",
    contractFamily: "InvalidateAdviceEligibilityGrantCommandContract",
    purpose:
      "Invalidate a live advice grant when session, subject, route, publication, trust, evidence, or decision-epoch drift proves the stored grant tuple is no longer current.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_expire_advice_eligibility_grant",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/advice-grants/{grantId}:expire",
    contractFamily: "ExpireAdviceEligibilityGrantCommandContract",
    purpose:
      "Expire one advice grant explicitly when its bounded render window has elapsed instead of leaving stale advice authority live.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_self_care_boundary_expire_due_grants",
    method: "POST",
    path: "/internal/v1/workspace/self-care-boundaries:expire-due-grants",
    contractFamily: "ExpireDueAdviceEligibilityGrantsCommandContract",
    purpose:
      "Drain due grant expiry against the canonical AdviceEligibilityGrant TTL boundary without silently widening advice validity after its bounded window ends.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
] as const;

export const phase3SelfCareBoundaryPersistenceTables = [
  ...new Set([
    ...phase3TriageKernelPersistenceTables,
    ...phase3EndpointDecisionPersistenceTables,
    ...phase3ApprovalEscalationPersistenceTables,
    ...phase3DirectResolutionPersistenceTables,
    "phase3_self_care_boundary_decisions",
    "phase3_self_care_boundary_supersession_records",
    "phase3_advice_eligibility_grants",
    "phase3_advice_eligibility_grant_transition_records",
  ]),
] as const;

export const phase3SelfCareBoundaryMigrationPlanRefs = [
  ...new Set([
    ...phase3TriageKernelMigrationPlanRefs,
    ...phase3EndpointDecisionMigrationPlanRefs,
    ...phase3ApprovalEscalationMigrationPlanRefs,
    ...phase3DirectResolutionMigrationPlanRefs,
    "services/command-api/migrations/125_phase3_self_care_boundary_and_advice_grants.sql",
  ]),
] as const;

export interface Phase3SelfCareBoundaryApplicationBundle {
  boundaryBundle: Phase3SelfCareBoundaryBundle;
  endpointBundle: EndpointDecisionBundle | null;
  approvalBundle: Phase3ApprovalEscalationBundle | null;
  directResolutionBundle: Phase3DirectResolutionBundle | null;
  effectiveAdviceGrantState: AdviceEligibilityGrantState | null;
  effectiveAdviceGrantReasonCodeRefs: readonly string[];
}

export interface ClassifySelfCareBoundaryCommandInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  dependencySetRef?: string | null;
  reasonCodeRefs?: readonly string[];
}

export interface IssueAdviceEligibilityGrantCommandInput {
  taskId: string;
  boundaryDecisionId: string;
  actorRef: string;
  issuedAt: string;
  expiresAt: string;
  routeFamily: string;
  audienceTier: string;
  channelRef: string;
  localeRef: string;
  adviceBundleVersionRef: string;
  reasonCodeRefs?: readonly string[];
  subjectBindingVersionRef?: string | null;
  sessionEpochRef?: string | null;
  assuranceSliceTrustRefs?: readonly string[];
}

export interface SupersedeSelfCareBoundaryCommandInput {
  taskId: string;
  boundaryDecisionId: string;
  actorRef: string;
  recordedAt: string;
  causeClass?: SelfCareBoundarySupersessionCauseClass;
  reasonCodeRefs?: readonly string[];
  dependencySetRef?: string | null;
}

export interface InvalidateAdviceEligibilityGrantCommandInput {
  taskId: string;
  grantId: string;
  actorRef: string;
  recordedAt: string;
  causeClass?: AdviceEligibilityGrantTransitionCauseClass;
  reasonCodeRefs?: readonly string[];
  subjectBindingVersionRef?: string | null;
  sessionEpochRef?: string | null;
}

export interface ExpireAdviceEligibilityGrantCommandInput {
  taskId: string;
  grantId: string;
  actorRef: string;
  recordedAt: string;
  reasonCodeRefs?: readonly string[];
}

export interface ExpireDueAdviceEligibilityGrantsCommandInput {
  evaluatedAt: string;
}

export interface Phase3SelfCareBoundaryApplication {
  readonly serviceName: typeof PHASE3_SELF_CARE_BOUNDARY_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_SELF_CARE_BOUNDARY_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_SELF_CARE_BOUNDARY_QUERY_SURFACES;
  readonly routes: typeof phase3SelfCareBoundaryRoutes;
  readonly triageApplication: SelfCareBoundaryTriagePort;
  readonly endpointApplication: SelfCareBoundaryEndpointPort;
  readonly approvalApplication: SelfCareBoundaryApprovalPort;
  readonly directResolutionApplication: SelfCareBoundaryDirectResolutionPort;
  readonly repositories: Phase3SelfCareBoundaryKernelRepositories;
  readonly service: Phase3SelfCareBoundaryKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskSelfCareBoundary(taskId: string): Promise<Phase3SelfCareBoundaryApplicationBundle>;
  classifySelfCareBoundary(
    input: ClassifySelfCareBoundaryCommandInput,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle>;
  issueAdviceEligibilityGrant(
    input: IssueAdviceEligibilityGrantCommandInput,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle>;
  supersedeSelfCareBoundary(
    input: SupersedeSelfCareBoundaryCommandInput,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle>;
  invalidateAdviceEligibilityGrant(
    input: InvalidateAdviceEligibilityGrantCommandInput,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle>;
  expireAdviceEligibilityGrant(
    input: ExpireAdviceEligibilityGrantCommandInput,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle>;
  expireDueAdviceEligibilityGrants(
    input: ExpireDueAdviceEligibilityGrantsCommandInput,
  ): Promise<readonly AdviceEligibilityGrantSnapshot[]>;
}

class Phase3SelfCareBoundaryApplicationImpl implements Phase3SelfCareBoundaryApplication {
  readonly serviceName = PHASE3_SELF_CARE_BOUNDARY_SERVICE_NAME;
  readonly schemaVersion = PHASE3_SELF_CARE_BOUNDARY_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_SELF_CARE_BOUNDARY_QUERY_SURFACES;
  readonly routes = phase3SelfCareBoundaryRoutes;
  readonly triageApplication: SelfCareBoundaryTriagePort;
  readonly endpointApplication: SelfCareBoundaryEndpointPort;
  readonly approvalApplication: SelfCareBoundaryApprovalPort;
  readonly directResolutionApplication: SelfCareBoundaryDirectResolutionPort;
  readonly repositories: Phase3SelfCareBoundaryKernelRepositories;
  readonly service: Phase3SelfCareBoundaryKernelService;
  readonly persistenceTables = phase3SelfCareBoundaryPersistenceTables;
  readonly migrationPlanRef = phase3SelfCareBoundaryMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3SelfCareBoundaryMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;

  constructor(options?: {
    triageApplication?: SelfCareBoundaryTriagePort;
    endpointApplication?: SelfCareBoundaryEndpointPort;
    approvalApplication?: SelfCareBoundaryApprovalPort;
    directResolutionApplication?: SelfCareBoundaryDirectResolutionPort;
    repositories?: Phase3SelfCareBoundaryKernelRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_self_care_boundary");
    const triageApplication =
      options?.triageApplication ??
      createPhase3TriageKernelApplication({ idGenerator: this.idGenerator });
    const endpointApplication =
      options?.endpointApplication ??
      createPhase3EndpointDecisionEngineApplication({
        idGenerator: this.idGenerator,
        triageApplication: triageApplication as Phase3TriageKernelApplication,
      });
    const approvalApplication =
      options?.approvalApplication ??
      createPhase3ApprovalEscalationApplication({
        idGenerator: this.idGenerator,
        triageApplication: triageApplication as Phase3TriageKernelApplication,
        endpointApplication: endpointApplication as Phase3EndpointDecisionEngineApplication,
      });
    const directResolutionApplication =
      options?.directResolutionApplication ??
      createPhase3DirectResolutionApplication({
        idGenerator: this.idGenerator,
        triageApplication: triageApplication as Phase3TriageKernelApplication,
        endpointApplication: endpointApplication as Phase3EndpointDecisionEngineApplication,
        approvalApplication: approvalApplication as Phase3ApprovalEscalationApplication,
      });
    this.triageApplication = triageApplication;
    this.endpointApplication = endpointApplication;
    this.approvalApplication = approvalApplication;
    this.directResolutionApplication = directResolutionApplication;
    this.repositories =
      options?.repositories ?? createPhase3SelfCareBoundaryKernelStore();
    this.service = createPhase3SelfCareBoundaryKernelService(this.repositories, {
      idGenerator: this.idGenerator,
    });
  }

  async queryTaskSelfCareBoundary(
    taskId: string,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle> {
    const context = await this.resolveContext(taskId);
    return this.buildBundle(context);
  }

  async classifySelfCareBoundary(
    input: ClassifySelfCareBoundaryCommandInput,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle> {
    const context = await this.resolveContext(input.taskId);
    const classification = this.deriveBoundaryClassification(context, input);
    await this.service.classifyBoundaryDecision(classification);
    return this.queryTaskSelfCareBoundary(input.taskId);
  }

  async issueAdviceEligibilityGrant(
    input: IssueAdviceEligibilityGrantCommandInput,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle> {
    const context = await this.resolveContext(input.taskId);
    const boundaryDecision = await this.repositories.getBoundaryDecision(input.boundaryDecisionId);
    invariant(
      boundaryDecision,
      "SELF_CARE_BOUNDARY_DECISION_NOT_FOUND",
      `SelfCareBoundaryDecision ${input.boundaryDecisionId} is required.`,
    );
    const assessment = this.assessGrantEligibility(context, boundaryDecision, input);
    await this.service.issueAdviceEligibilityGrant({
      taskId: input.taskId,
      requestRef: context.request.requestId,
      boundaryDecisionRef: boundaryDecision.selfCareBoundaryDecisionId,
      evidenceSnapshotRef: boundaryDecision.evidenceSnapshotRef,
      decisionEpochRef: boundaryDecision.decisionEpochRef,
      decisionSupersessionRecordRef:
        context.endpointBundle?.latestSupersession?.decisionSupersessionRecordId ??
        boundaryDecision.decisionSupersessionRecordRef,
      safetyState: context.request.safetyState,
      routeFamily: input.routeFamily,
      audienceTier: input.audienceTier,
      channelRef: input.channelRef,
      localeRef: input.localeRef,
      compiledPolicyBundleRef: boundaryDecision.compiledPolicyBundleRef,
      adviceBundleVersionRef: input.adviceBundleVersionRef,
      lineageFenceEpoch: boundaryDecision.lineageFenceEpoch,
      routeIntentRef: requireRef(
        context.currentRouteIntentBindingRef,
        "currentRouteIntentBindingRef",
      ),
      subjectBindingVersionRef:
        optionalRef(input.subjectBindingVersionRef) ?? context.currentSubjectBindingVersionRef,
      sessionEpochRef: optionalRef(input.sessionEpochRef) ?? context.currentSessionEpochRef,
      assuranceSliceTrustRefs:
        input.assuranceSliceTrustRefs ??
        (context.currentTrustRef ? [context.currentTrustRef] : []),
      surfaceRouteContractRef: requireRef(
        context.currentSurfaceRouteContractRef,
        "currentSurfaceRouteContractRef",
      ),
      surfacePublicationRef: requireRef(
        context.currentSurfacePublicationRef,
        "currentSurfacePublicationRef",
      ),
      runtimePublicationBundleRef: requireRef(
        context.currentRuntimePublicationBundleRef,
        "currentRuntimePublicationBundleRef",
      ),
      reasonCodeRefs: [...(input.reasonCodeRefs ?? []), ...assessment.reasonCodeRefs],
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
      grantState: assessment.grantState,
      transitionCauseClass: assessment.causeClass,
    });
    return this.queryTaskSelfCareBoundary(input.taskId);
  }

  async supersedeSelfCareBoundary(
    input: SupersedeSelfCareBoundaryCommandInput,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle> {
    const context = await this.resolveContext(input.taskId);
    const classification = this.deriveBoundaryClassification(context, {
      taskId: input.taskId,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      dependencySetRef: input.dependencySetRef,
      reasonCodeRefs: input.reasonCodeRefs,
    });
    classification.supersessionCauseClass = input.causeClass ?? classification.supersessionCauseClass;
    await this.service.classifyBoundaryDecision(classification);
    return this.queryTaskSelfCareBoundary(input.taskId);
  }

  async invalidateAdviceEligibilityGrant(
    input: InvalidateAdviceEligibilityGrantCommandInput,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle> {
    const context = await this.resolveContext(input.taskId);
    const grant = await this.repositories.getAdviceEligibilityGrant(input.grantId);
    invariant(grant, "ADVICE_ELIGIBILITY_GRANT_NOT_FOUND", `AdviceEligibilityGrant ${input.grantId} is required.`);
    const boundaryDecision =
      (await this.repositories.getBoundaryDecision(grant.boundaryDecisionRef)) ?? null;
    const assessment = this.assessGrantEffectiveness(context, boundaryDecision, grant, {
      subjectBindingVersionRef: input.subjectBindingVersionRef,
      sessionEpochRef: input.sessionEpochRef,
    });
    await this.service.transitionAdviceEligibilityGrant({
      taskId: input.taskId,
      adviceEligibilityGrantId: input.grantId,
      nextGrantState: "invalidated",
      causeClass:
        input.causeClass ??
        assessment.causeClass ??
        "manual_replace",
      reasonCodeRefs: uniqueSorted([
        ...(input.reasonCodeRefs ?? []),
        ...assessment.reasonCodeRefs,
      ]),
      recordedAt: input.recordedAt,
    });
    return this.queryTaskSelfCareBoundary(input.taskId);
  }

  async expireAdviceEligibilityGrant(
    input: ExpireAdviceEligibilityGrantCommandInput,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle> {
    await this.service.transitionAdviceEligibilityGrant({
      taskId: input.taskId,
      adviceEligibilityGrantId: input.grantId,
      nextGrantState: "expired",
      causeClass: "expired_ttl",
      reasonCodeRefs: [...(input.reasonCodeRefs ?? []), "grant_ttl_elapsed"],
      recordedAt: input.recordedAt,
    });
    return this.queryTaskSelfCareBoundary(input.taskId);
  }

  async expireDueAdviceEligibilityGrants(
    input: ExpireDueAdviceEligibilityGrantsCommandInput,
  ): Promise<readonly AdviceEligibilityGrantSnapshot[]> {
    const expired = await this.service.expireDueAdviceEligibilityGrants(input.evaluatedAt);
    return expired.map((entry) => entry.adviceEligibilityGrant);
  }

  private async buildBundle(
    context: ResolvedSelfCareBoundaryContext,
  ): Promise<Phase3SelfCareBoundaryApplicationBundle> {
    const boundaryBundle = await this.service.queryTaskBundle(context.task.taskId);
    const effective = this.assessGrantEffectiveness(
      context,
      boundaryBundle.currentBoundaryDecision,
      boundaryBundle.currentAdviceEligibilityGrant,
    );
    return {
      boundaryBundle,
      endpointBundle: context.endpointBundle,
      approvalBundle: context.approvalBundle,
      directResolutionBundle: context.directResolutionBundle,
      effectiveAdviceGrantState: effective.effectiveState,
      effectiveAdviceGrantReasonCodeRefs: effective.reasonCodeRefs,
    };
  }

  private async resolveContext(taskId: string): Promise<ResolvedSelfCareBoundaryContext> {
    const taskDocument = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(taskDocument, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} is required.`);
    const task = taskDocument.toSnapshot() as TaskSnapshot;
    const requestDocument = await this.triageApplication.controlPlaneRepositories.getRequest(
      task.requestId,
    );
    invariant(requestDocument, "REQUEST_NOT_FOUND", `Request ${task.requestId} is required.`);
    const request = requestDocument.toSnapshot() as RequestSnapshot;
    const endpointBundle = await this.endpointApplication.queryTaskEndpointDecision(taskId);
    const approvalBundle = await this.approvalApplication.queryTaskApprovalEscalation(taskId);
    const directResolutionBundle = await this.directResolutionApplication.queryTaskDirectResolution(taskId);
    const reviewSession =
      task.activeReviewSessionRef !== null
        ? (((await this.triageApplication.triageRepositories.getReviewSession(
            task.activeReviewSessionRef,
          ))?.toSnapshot() as ReviewSessionSnapshot | undefined) ?? null)
        : null;
    const endpointActions =
      endpointBundle !== null
        ? await this.endpointApplication.decisionRepositories.listActionRecordsForTask(taskId)
        : [];
    const currentEndpointAction =
      endpointBundle !== null
        ? ([...endpointActions]
            .filter((action) => action.decisionId === endpointBundle.decision.decisionId)
            .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
            .at(-1) as EndpointActionSnapshot | undefined) ?? null
        : null;
    const currentRouteIntentBindingRef =
      currentEndpointAction?.routeIntentBindingRef ??
      directResolutionBundle.settlement?.routeIntentBindingRef ??
      null;
    return {
      task,
      request,
      reviewSession,
      endpointBundle,
      approvalBundle,
      directResolutionBundle,
      currentEndpointAction,
      currentRouteIntentBindingRef,
      currentSessionEpochRef: reviewSession?.reviewSessionId ?? task.activeReviewSessionRef ?? null,
      currentSubjectBindingVersionRef: request.currentIdentityBindingRef,
      currentSurfaceRouteContractRef:
        reviewSession?.surfaceRouteContractRef ??
        endpointBundle?.binding.surfaceRouteContractRef ??
        task.surfaceRouteContractRef,
      currentSurfacePublicationRef:
        reviewSession?.surfacePublicationRef ??
        endpointBundle?.binding.surfacePublicationRef ??
        task.surfacePublicationRef,
      currentRuntimePublicationBundleRef:
        reviewSession?.runtimePublicationBundleRef ??
        endpointBundle?.binding.runtimePublicationBundleRef ??
        task.runtimePublicationBundleRef,
      currentTrustRef:
        reviewSession?.workspaceSliceTrustProjectionRef ??
        endpointBundle?.binding.workspaceSliceTrustProjectionRef ??
        null,
    };
  }

  private deriveBoundaryClassification(
    context: ResolvedSelfCareBoundaryContext,
    input: ClassifySelfCareBoundaryCommandInput,
  ): ClassifySelfCareBoundaryInput {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const reasonCodeRefs = new Set<string>(input.reasonCodeRefs ?? []);
    const endpointBundle = context.endpointBundle;
    const evidenceSnapshotRef =
      context.request.currentEvidenceSnapshotRef ?? endpointBundle?.epoch.evidenceSnapshotRef ?? null;
    invariant(
      evidenceSnapshotRef,
      "CURRENT_EVIDENCE_SNAPSHOT_REQUIRED",
      `Task ${context.task.taskId} requires a current evidence snapshot for self-care boundary work.`,
    );
    invariant(
      endpointBundle,
      "CURRENT_ENDPOINT_DECISION_BUNDLE_REQUIRED",
      `Task ${context.task.taskId} requires an endpoint decision bundle for self-care boundary work.`,
    );
    invariant(
      context.currentRouteIntentBindingRef,
      "CURRENT_ROUTE_INTENT_BINDING_REQUIRED",
      `Task ${context.task.taskId} requires a current route-intent binding for self-care boundary work.`,
    );

    let decisionState: ClassifySelfCareBoundaryInput["decisionState"];
    let clinicalMeaningState: ClassifySelfCareBoundaryInput["clinicalMeaningState"];
    let operationalFollowUpScope: ClassifySelfCareBoundaryInput["operationalFollowUpScope"];
    let adminMutationAuthorityState: ClassifySelfCareBoundaryInput["adminMutationAuthorityState"];
    let reopenState: ClassifySelfCareBoundaryInput["reopenState"] = "stable";
    let boundaryState: ClassifySelfCareBoundaryInput["boundaryState"] = "live";

    const endpointCode = endpointBundle.decision.chosenEndpoint;
    const approvalState = context.approvalBundle?.checkpoint?.state ?? "not_required";
    const directResolutionState = context.directResolutionBundle?.settlement?.settlementState ?? null;

    if (
      endpointBundle.epoch.epochState !== "live" &&
      endpointBundle.epoch.epochState !== "committed"
    ) {
      reasonCodeRefs.add("decision_epoch_not_live");
      decisionState = "blocked_pending_review";
      clinicalMeaningState = "clinician_reentry_required";
      operationalFollowUpScope = "none";
      adminMutationAuthorityState = "frozen";
      reopenState = "blocked_pending_review";
      boundaryState = "blocked";
    } else if (endpointBundle.binding.bindingState !== "live") {
      reasonCodeRefs.add("endpoint_binding_not_live");
      decisionState = "blocked_pending_review";
      clinicalMeaningState = "clinician_reentry_required";
      operationalFollowUpScope = "none";
      adminMutationAuthorityState = "frozen";
      reopenState = "blocked_pending_review";
      boundaryState = "blocked";
    } else if (context.task.status === "reopened") {
      reasonCodeRefs.add("task_reopened_requires_clinician_review");
      decisionState = "clinician_review_required";
      clinicalMeaningState = "clinician_reentry_required";
      operationalFollowUpScope = "none";
      adminMutationAuthorityState = "frozen";
      reopenState = "reopened";
      boundaryState = "reopened";
    } else if (
      context.request.currentSafetyPreemptionRef !== null ||
      context.request.currentUrgentDiversionSettlementRef !== null ||
      context.task.status === "escalated"
    ) {
      if (context.request.currentSafetyPreemptionRef !== null) {
        reasonCodeRefs.add("safety_preemption_requires_clinician_review");
      }
      if (context.request.currentUrgentDiversionSettlementRef !== null) {
        reasonCodeRefs.add("urgent_diversion_requires_clinician_review");
      }
      if (context.task.status === "escalated") {
        reasonCodeRefs.add("task_escalated_requires_clinician_review");
      }
      decisionState = "clinician_review_required";
      clinicalMeaningState = "clinician_reentry_required";
      operationalFollowUpScope = "none";
      adminMutationAuthorityState = "frozen";
      reopenState = "reopen_required";
      boundaryState = "live";
    } else if (
      (endpointCode === "self_care_and_safety_net" || endpointCode === "admin_resolution") &&
      (directResolutionState === "recovery_only" || directResolutionState === "superseded")
    ) {
      reasonCodeRefs.add("direct_resolution_tuple_drift_requires_reclassify");
      decisionState = "clinician_review_required";
      clinicalMeaningState = "clinician_reentry_required";
      operationalFollowUpScope = "none";
      adminMutationAuthorityState = "frozen";
      reopenState = "reopen_required";
      boundaryState = "live";
    } else if (endpointCode === "self_care_and_safety_net") {
      reasonCodeRefs.add("current_endpoint_self_care");
      if (approvalState === "required" || approvalState === "pending") {
        reasonCodeRefs.add("approval_checkpoint_pending");
      } else if (approvalState === "approved") {
        reasonCodeRefs.add("approval_checkpoint_approved");
      }
      decisionState = "self_care";
      clinicalMeaningState = "informational_only";
      operationalFollowUpScope = "self_serve_guidance";
      adminMutationAuthorityState = "none";
    } else if (endpointCode === "admin_resolution") {
      reasonCodeRefs.add("current_endpoint_admin_resolution");
      decisionState = "admin_resolution";
      clinicalMeaningState = "bounded_admin_only";
      operationalFollowUpScope = "bounded_admin_resolution";
      adminMutationAuthorityState = "bounded_admin_only";
    } else {
      reasonCodeRefs.add("current_endpoint_requires_clinician_review");
      decisionState = "clinician_review_required";
      clinicalMeaningState = "clinician_reentry_required";
      operationalFollowUpScope = "none";
      adminMutationAuthorityState = "frozen";
    }

    return {
      taskId: context.task.taskId,
      requestRef: context.request.requestId,
      evidenceSnapshotRef,
      decisionEpochRef: endpointBundle.epoch.epochId,
      decisionSupersessionRecordRef:
        endpointBundle.latestSupersession?.decisionSupersessionRecordId ?? null,
      decisionState,
      clinicalMeaningState,
      operationalFollowUpScope,
      adminMutationAuthorityState,
      reasonCodeRefs: [...reasonCodeRefs],
      adminResolutionSubtypeRef:
        context.directResolutionBundle?.adminResolutionStarter?.adminResolutionSubtypeRef ??
        optionalRef((endpointBundle.decision.payload.adminResolutionSubtypeRef as string | undefined) ?? null),
      routeIntentBindingRef: context.currentRouteIntentBindingRef,
      selectedAnchorRef: endpointBundle.binding.selectedAnchorRef,
      lineageFenceEpoch: endpointBundle.epoch.lineageFenceEpoch,
      dependencySetRef: optionalRef(input.dependencySetRef),
      adviceRenderSettlementRef: null,
      adminResolutionCaseRef:
        context.directResolutionBundle?.adminResolutionStarter?.adminResolutionStarterId ?? null,
      selfCareExperienceProjectionRef: null,
      adminResolutionExperienceProjectionRef: null,
      reopenTriggerRefs:
        reopenState === "stable" ? [] : [...reasonCodeRefs],
      reopenState,
      boundaryState,
      compiledPolicyBundleRef: endpointBundle.epoch.compiledPolicyBundleRef,
      decidedAt: recordedAt,
      supersessionCauseClass: this.deriveBoundarySupersessionCause([...reasonCodeRefs]),
    };
  }

  private deriveBoundarySupersessionCause(
    reasonCodeRefs: readonly string[],
  ): SelfCareBoundarySupersessionCauseClass {
    if (
      reasonCodeRefs.includes("task_reopened_requires_clinician_review") ||
      reasonCodeRefs.includes("direct_resolution_tuple_drift_requires_reclassify")
    ) {
      return "reopen";
    }
    if (
      reasonCodeRefs.includes("safety_preemption_requires_clinician_review") ||
      reasonCodeRefs.includes("urgent_diversion_requires_clinician_review")
    ) {
      return "safety_drift";
    }
    if (reasonCodeRefs.includes("endpoint_binding_not_live")) {
      return "route_drift";
    }
    return "decision_supersession";
  }

  private assessGrantEligibility(
    context: ResolvedSelfCareBoundaryContext,
    boundaryDecision: SelfCareBoundaryDecisionSnapshot,
    input: IssueAdviceEligibilityGrantCommandInput,
  ): {
    grantState: Extract<AdviceEligibilityGrantState, "live" | "blocked">;
    reasonCodeRefs: readonly string[];
    causeClass: AdviceEligibilityGrantTransitionCauseClass;
  } {
    const reasons = new Set<string>();
    let causeClass: AdviceEligibilityGrantTransitionCauseClass = "manual_replace";

    if (boundaryDecision.boundaryState !== "live") {
      reasons.add("boundary_not_live");
      causeClass = "boundary_superseded";
    }
    if (boundaryDecision.reopenState !== "stable") {
      reasons.add("boundary_reopen_not_stable");
      causeClass = "reopen";
    }
    if (boundaryDecision.decisionState !== "self_care") {
      reasons.add("boundary_decision_not_self_care");
      causeClass = "boundary_not_self_care";
    }
    if (boundaryDecision.clinicalMeaningState !== "informational_only") {
      reasons.add("boundary_clinical_meaning_not_informational_only");
      causeClass = "boundary_not_self_care";
    }
    if (
      context.approvalBundle?.approvalAssessment?.requiredApprovalMode === "required" &&
      context.approvalBundle.checkpoint?.state !== "approved"
    ) {
      if (context.approvalBundle.checkpoint?.state === "rejected") {
        reasons.add("approval_checkpoint_rejected");
        causeClass = "approval_rejected";
      } else {
        reasons.add("approval_checkpoint_pending");
        causeClass = "approval_pending";
      }
    }
    if (!context.directResolutionBundle?.selfCareStarter) {
      reasons.add("self_care_consequence_starter_missing");
      causeClass = "boundary_not_self_care";
    }
    if (context.directResolutionBundle?.settlement?.settlementState !== "settled") {
      reasons.add("direct_resolution_not_settled");
      causeClass = "boundary_not_self_care";
    }
    if (
      context.directResolutionBundle?.settlement?.endpointCode !== "self_care_and_safety_net"
    ) {
      reasons.add("direct_resolution_endpoint_not_self_care");
      causeClass = "boundary_not_self_care";
    }
    if (
      context.endpointBundle?.epoch.epochId !== boundaryDecision.decisionEpochRef ||
      context.task.currentDecisionEpochRef !== boundaryDecision.decisionEpochRef
    ) {
      reasons.add("decision_epoch_drift");
      causeClass = "route_drift";
    }
    if (
      context.request.currentEvidenceSnapshotRef !== null &&
      context.request.currentEvidenceSnapshotRef !== boundaryDecision.evidenceSnapshotRef
    ) {
      reasons.add("evidence_snapshot_drift");
      causeClass = "evidence_drift";
    }
    if (context.task.currentLineageFenceEpoch !== boundaryDecision.lineageFenceEpoch) {
      reasons.add("lineage_fence_drift");
      causeClass = "route_drift";
    }
    const subjectBindingVersionRef =
      optionalRef(input.subjectBindingVersionRef) ?? context.currentSubjectBindingVersionRef;
    const sessionEpochRef = optionalRef(input.sessionEpochRef) ?? context.currentSessionEpochRef;
    if (!subjectBindingVersionRef) {
      reasons.add("subject_binding_version_missing");
      causeClass = "subject_drift";
    }
    if (!sessionEpochRef) {
      reasons.add("session_epoch_missing");
      causeClass = "session_drift";
    }
    if (context.currentTrustRef === null) {
      reasons.add("workspace_trust_projection_missing");
      causeClass = "trust_drift";
    }

    return {
      grantState: reasons.size === 0 ? "live" : "blocked",
      reasonCodeRefs: [...reasons],
      causeClass,
    };
  }

  private assessGrantEffectiveness(
    context: ResolvedSelfCareBoundaryContext,
    boundaryDecision: SelfCareBoundaryDecisionSnapshot | null,
    adviceGrant: AdviceEligibilityGrantSnapshot | null,
    overrides?: {
      subjectBindingVersionRef?: string | null;
      sessionEpochRef?: string | null;
    },
  ): {
    effectiveState: AdviceEligibilityGrantState | null;
    reasonCodeRefs: readonly string[];
    causeClass: AdviceEligibilityGrantTransitionCauseClass | null;
  } {
    if (!adviceGrant) {
      return {
        effectiveState: null,
        reasonCodeRefs: [],
        causeClass: null,
      };
    }
    if (adviceGrant.grantState !== "live") {
      return {
        effectiveState: adviceGrant.grantState,
        reasonCodeRefs: adviceGrant.reasonCodeRefs,
        causeClass: null,
      };
    }
    const reasons = new Set<string>();
    let causeClass: AdviceEligibilityGrantTransitionCauseClass | null = null;
    const now = new Date().toISOString();
    if (adviceGrant.expiresAt <= now) {
      reasons.add("grant_ttl_elapsed");
      causeClass = "expired_ttl";
      return {
        effectiveState: "expired",
        reasonCodeRefs: [...reasons],
        causeClass,
      };
    }
    if (!boundaryDecision) {
      reasons.add("boundary_decision_missing");
      causeClass = "boundary_superseded";
    } else {
      if (boundaryDecision.selfCareBoundaryDecisionId !== adviceGrant.boundaryDecisionRef) {
        reasons.add("boundary_decision_ref_drift");
        causeClass = "boundary_superseded";
      }
      if (boundaryDecision.boundaryTupleHash !== adviceGrant.boundaryTupleHash) {
        reasons.add("boundary_tuple_hash_drift");
        causeClass = "boundary_superseded";
      }
      if (
        boundaryDecision.boundaryState !== "live" ||
        boundaryDecision.reopenState !== "stable" ||
        boundaryDecision.decisionState !== "self_care"
      ) {
        reasons.add("boundary_no_longer_authorizes_self_care");
        causeClass = "boundary_superseded";
      }
      if (boundaryDecision.evidenceSnapshotRef !== adviceGrant.evidenceSnapshotRef) {
        reasons.add("evidence_snapshot_drift");
        causeClass = "evidence_drift";
      }
      if (boundaryDecision.decisionEpochRef !== adviceGrant.decisionEpochRef) {
        reasons.add("decision_epoch_drift");
        causeClass = "route_drift";
      }
      if (boundaryDecision.lineageFenceEpoch !== adviceGrant.lineageFenceEpoch) {
        reasons.add("lineage_fence_drift");
        causeClass = "route_drift";
      }
    }
    if (
      context.currentRouteIntentBindingRef !== null &&
      context.currentRouteIntentBindingRef !== adviceGrant.routeIntentRef
    ) {
      reasons.add("route_intent_binding_drift");
      causeClass = "route_drift";
    }
    if (
      context.request.currentEvidenceSnapshotRef !== null &&
      context.request.currentEvidenceSnapshotRef !== adviceGrant.evidenceSnapshotRef
    ) {
      reasons.add("evidence_snapshot_drift");
      causeClass = "evidence_drift";
    }
    const subjectBindingVersionRef =
      optionalRef(overrides?.subjectBindingVersionRef) ?? context.currentSubjectBindingVersionRef;
    if (
      subjectBindingVersionRef !== null &&
      adviceGrant.subjectBindingVersionRef !== null &&
      subjectBindingVersionRef !== adviceGrant.subjectBindingVersionRef
    ) {
      reasons.add("subject_binding_version_drift");
      causeClass = "subject_drift";
    }
    const sessionEpochRef =
      optionalRef(overrides?.sessionEpochRef) ?? context.currentSessionEpochRef;
    if (
      sessionEpochRef !== null &&
      adviceGrant.sessionEpochRef !== null &&
      sessionEpochRef !== adviceGrant.sessionEpochRef
    ) {
      reasons.add("session_epoch_drift");
      causeClass = "session_drift";
    }
    if (
      context.currentSurfaceRouteContractRef !== null &&
      context.currentSurfaceRouteContractRef !== adviceGrant.surfaceRouteContractRef
    ) {
      reasons.add("surface_route_contract_drift");
      causeClass = "publication_drift";
    }
    if (
      context.currentSurfacePublicationRef !== null &&
      context.currentSurfacePublicationRef !== adviceGrant.surfacePublicationRef
    ) {
      reasons.add("surface_publication_drift");
      causeClass = "publication_drift";
    }
    if (
      context.currentRuntimePublicationBundleRef !== null &&
      context.currentRuntimePublicationBundleRef !== adviceGrant.runtimePublicationBundleRef
    ) {
      reasons.add("runtime_publication_bundle_drift");
      causeClass = "publication_drift";
    }
    if (
      context.currentTrustRef !== null &&
      !adviceGrant.assuranceSliceTrustRefs.includes(context.currentTrustRef)
    ) {
      reasons.add("assurance_trust_tuple_drift");
      causeClass = "trust_drift";
    }
    if (
      context.approvalBundle?.approvalAssessment?.requiredApprovalMode === "required" &&
      context.approvalBundle.checkpoint?.state !== "approved"
    ) {
      if (context.approvalBundle.checkpoint?.state === "rejected") {
        reasons.add("approval_checkpoint_rejected");
        causeClass = "approval_rejected";
      } else {
        reasons.add("approval_checkpoint_pending");
        causeClass = "approval_pending";
      }
    }
    if (
      context.directResolutionBundle?.settlement?.settlementState !== "settled" ||
      context.directResolutionBundle?.settlement?.endpointCode !== "self_care_and_safety_net" ||
      !context.directResolutionBundle?.selfCareStarter
    ) {
      reasons.add("self_care_consequence_no_longer_settled");
      causeClass = "boundary_not_self_care";
    }

    return {
      effectiveState: reasons.size === 0 ? "live" : "invalidated",
      reasonCodeRefs: [...reasons],
      causeClass,
    };
  }
}

export function createPhase3SelfCareBoundaryApplication(options?: {
  triageApplication?: SelfCareBoundaryTriagePort;
  endpointApplication?: SelfCareBoundaryEndpointPort;
  approvalApplication?: SelfCareBoundaryApprovalPort;
  directResolutionApplication?: SelfCareBoundaryDirectResolutionPort;
  repositories?: Phase3SelfCareBoundaryKernelRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3SelfCareBoundaryApplication {
  return new Phase3SelfCareBoundaryApplicationImpl(options);
}
