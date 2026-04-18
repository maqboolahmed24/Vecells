import { createDeterministicBackboneIdGenerator, type BackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3AdminResolutionPolicyKernelService,
  createPhase3AdminResolutionPolicyKernelStore,
  type AdminResolutionCaseContinuityEvaluation,
  type AdminResolutionCaseSnapshot,
  type AdminResolutionCaseState,
  type AdminResolutionCompletionType,
  type AdminResolutionDependencyShape,
  type AdminResolutionSubtypeProfileSnapshot,
  type AdminResolutionSubtypeRef,
  type AdminResolutionWaitingState,
  type Phase3AdminResolutionPolicyBundle,
  type Phase3AdminResolutionPolicyKernelRepositories,
  type Phase3AdminResolutionPolicyKernelService,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3SelfCareBoundaryApplication,
  phase3SelfCareBoundaryMigrationPlanRefs,
  phase3SelfCareBoundaryPersistenceTables,
  type Phase3SelfCareBoundaryApplication,
  type Phase3SelfCareBoundaryApplicationBundle,
} from "./phase3-self-care-boundary-grants";

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

const canonicalSubtypeRefs: readonly AdminResolutionSubtypeRef[] = [
  "document_or_letter_workflow",
  "form_workflow",
  "result_follow_up_workflow",
  "medication_admin_query",
  "registration_or_demographic_update",
  "routed_admin_task",
];

const legacySubtypeAliases: Readonly<Record<string, AdminResolutionSubtypeRef>> = {
  demographic_correction: "registration_or_demographic_update",
  demographic_update: "registration_or_demographic_update",
  registration_update: "registration_or_demographic_update",
  booking_support: "routed_admin_task",
  document_workflow: "document_or_letter_workflow",
  form_support: "form_workflow",
  medication_query: "medication_admin_query",
  result_follow_up: "result_follow_up_workflow",
};

function normalizeSubtypeRef(
  value: string | null | undefined,
  field: string,
): AdminResolutionSubtypeRef {
  const normalized = requireRef(value, field);
  if ((canonicalSubtypeRefs as readonly string[]).includes(normalized)) {
    return normalized as AdminResolutionSubtypeRef;
  }
  const alias = legacySubtypeAliases[normalized];
  invariant(
    alias,
    "UNSUPPORTED_ADMIN_RESOLUTION_SUBTYPE_REF",
    `${field} must resolve to one canonical AdminResolutionSubtypeProfile.`,
  );
  return alias;
}

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export const PHASE3_ADMIN_RESOLUTION_POLICY_SERVICE_NAME =
  "Phase3AdminResolutionPolicyApplication";
export const PHASE3_ADMIN_RESOLUTION_POLICY_SCHEMA_VERSION =
  "251.phase3.admin-resolution-case-policy.v1";
export const PHASE3_ADMIN_RESOLUTION_POLICY_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/admin-resolution",
] as const;

export const phase3AdminResolutionPolicyRoutes = [
  {
    routeId: "workspace_task_admin_resolution_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution",
    contractFamily: "AdminResolutionPolicyBundleContract",
    purpose:
      "Expose the current AdminResolutionCase, AdminResolutionCompletionArtifact, current subtype policy, and continuity freeze posture for one bounded admin-resolution task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_admin_resolution_subtype_policy_current",
    method: "GET",
    path: "/internal/v1/workspace/admin-resolution/subtypes/{adminResolutionSubtypeRef}",
    contractFamily: "AdminResolutionSubtypePolicyContract",
    purpose:
      "Fetch one canonical AdminResolutionSubtypeProfile through the governed subtype registry instead of prose queue labels.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_open_admin_resolution_case",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:open-admin-resolution-case",
    contractFamily: "OpenAdminResolutionCaseCommandContract",
    purpose:
      "Open the canonical AdminResolutionCase only from the current legal bounded-admin boundary tuple and live admin-resolution starter.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_reclassify_admin_resolution_subtype",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:reclassify-subtype",
    contractFamily: "ReclassifyAdminResolutionSubtypeCommandContract",
    purpose:
      "Reclassify routed or active bounded admin work onto one canonical subtype profile instead of leaving it as prose routing.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_enter_admin_resolution_waiting_state",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:enter-waiting-state",
    contractFamily: "EnterAdminResolutionWaitingStateCommandContract",
    purpose:
      "Enter one typed admin waiting posture only when owner, dependency shape, SLA clock, and expiry or repair rule all match subtype policy.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_cancel_admin_resolution_wait",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:cancel-wait",
    contractFamily: "CancelAdminResolutionWaitCommandContract",
    purpose:
      "Cancel one active admin waiting posture and restore in-progress work without inventing a generic waiting bucket.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_record_admin_resolution_completion_artifact",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:record-completion-artifact",
    contractFamily: "RecordAdminResolutionCompletionArtifactCommandContract",
    purpose:
      "Record one typed AdminResolutionCompletionArtifact so bounded admin completion is proof-backed rather than a generic done toggle.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3AdminResolutionPolicyPersistenceTables = [
  ...new Set([
    ...phase3SelfCareBoundaryPersistenceTables,
    "phase3_admin_resolution_subtype_profiles",
    "phase3_admin_resolution_cases",
    "phase3_admin_resolution_completion_artifacts",
  ]),
] as const;

export const phase3AdminResolutionPolicyMigrationPlanRefs = [
  ...new Set([
    ...phase3SelfCareBoundaryMigrationPlanRefs,
    "services/command-api/migrations/127_phase3_admin_resolution_case_policy_kernel.sql",
  ]),
] as const;

export interface Phase3AdminResolutionPolicyApplicationBundle {
  adminResolutionBundle: Phase3AdminResolutionPolicyBundle;
  selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle;
  continuityEvaluation: AdminResolutionCaseContinuityEvaluation;
  effectiveCaseState: AdminResolutionCaseState | null;
  effectiveReasonCodeRefs: readonly string[];
  normalizedBoundarySubtypeRef: AdminResolutionSubtypeRef | null;
  normalizedStarterSubtypeRef: AdminResolutionSubtypeRef | null;
}

export interface OpenAdminResolutionCaseCommandInput {
  taskId: string;
  actorRef: string;
  openedAt: string;
  adminResolutionSubtypeRef?: string | null;
}

export interface ReclassifyAdminResolutionSubtypeCommandInput {
  taskId: string;
  adminResolutionCaseId: string;
  nextSubtypeRef: string;
  actorRef: string;
  recordedAt: string;
}

export interface EnterAdminResolutionWaitingStateCommandInput {
  taskId: string;
  adminResolutionCaseId: string;
  waitingState: AdminResolutionWaitingState;
  waitingReasonCodeRef: string;
  dependencyShape: AdminResolutionDependencyShape;
  ownerRef: string;
  slaClockSourceRef: string;
  expiryOrRepairRuleRef: string;
  recordedAt: string;
}

export interface CancelAdminResolutionWaitCommandInput {
  taskId: string;
  adminResolutionCaseId: string;
  actorRef: string;
  recordedAt: string;
}

export interface RecordAdminResolutionCompletionArtifactCommandInput {
  taskId: string;
  adminResolutionCaseId: string;
  completionType: AdminResolutionCompletionType;
  completionEvidenceRefs: readonly string[];
  patientVisibleSummaryRef: string;
  recordedAt: string;
  patientExpectationTemplateRef?: string | null;
  artifactPresentationContractRef?: string | null;
  artifactByteGrantRefs?: readonly string[];
  outboundNavigationGrantRefs?: readonly string[];
  releaseState?: "current" | "degraded" | "quarantined";
  visibilityTier?: string | null;
  summarySafetyTier?: string | null;
  placeholderContractRef?: string | null;
  communicationDispatchRefs?: readonly string[];
  deliveryOutcomeRefs?: readonly string[];
}

export interface Phase3AdminResolutionPolicyApplication {
  readonly serviceName: typeof PHASE3_ADMIN_RESOLUTION_POLICY_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_ADMIN_RESOLUTION_POLICY_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_ADMIN_RESOLUTION_POLICY_QUERY_SURFACES;
  readonly routes: typeof phase3AdminResolutionPolicyRoutes;
  readonly selfCareBoundaryApplication: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  readonly repositories: Phase3AdminResolutionPolicyKernelRepositories;
  readonly service: Phase3AdminResolutionPolicyKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskAdminResolution(taskId: string): Promise<Phase3AdminResolutionPolicyApplicationBundle>;
  querySubtypePolicy(
    adminResolutionSubtypeRef: string,
  ): Promise<AdminResolutionSubtypeProfileSnapshot | null>;
  openAdminResolutionCase(
    input: OpenAdminResolutionCaseCommandInput,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle>;
  reclassifyAdminResolutionSubtype(
    input: ReclassifyAdminResolutionSubtypeCommandInput,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle>;
  enterAdminResolutionWaitingState(
    input: EnterAdminResolutionWaitingStateCommandInput,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle>;
  cancelAdminResolutionWait(
    input: CancelAdminResolutionWaitCommandInput,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle>;
  recordAdminResolutionCompletionArtifact(
    input: RecordAdminResolutionCompletionArtifactCommandInput,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle>;
}

class Phase3AdminResolutionPolicyApplicationImpl
  implements Phase3AdminResolutionPolicyApplication
{
  readonly serviceName = PHASE3_ADMIN_RESOLUTION_POLICY_SERVICE_NAME;
  readonly schemaVersion = PHASE3_ADMIN_RESOLUTION_POLICY_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_ADMIN_RESOLUTION_POLICY_QUERY_SURFACES;
  readonly routes = phase3AdminResolutionPolicyRoutes;
  readonly selfCareBoundaryApplication: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  readonly repositories: Phase3AdminResolutionPolicyKernelRepositories;
  readonly service: Phase3AdminResolutionPolicyKernelService;
  readonly persistenceTables = phase3AdminResolutionPolicyPersistenceTables;
  readonly migrationPlanRef = phase3AdminResolutionPolicyMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3AdminResolutionPolicyMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;

  constructor(options?: {
    selfCareBoundaryApplication?: Pick<
      Phase3SelfCareBoundaryApplication,
      "queryTaskSelfCareBoundary"
    >;
    repositories?: Phase3AdminResolutionPolicyKernelRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_admin_resolution_policy");
    this.selfCareBoundaryApplication =
      options?.selfCareBoundaryApplication ??
      createPhase3SelfCareBoundaryApplication({
        idGenerator: this.idGenerator,
      });
    this.repositories =
      options?.repositories ?? createPhase3AdminResolutionPolicyKernelStore();
    this.service = createPhase3AdminResolutionPolicyKernelService(this.repositories, {
      idGenerator: this.idGenerator,
    });
  }

  async queryTaskAdminResolution(
    taskId: string,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle> {
    const selfCareBoundaryBundle =
      await this.selfCareBoundaryApplication.queryTaskSelfCareBoundary(taskId);
    const adminResolutionBundle = await this.service.queryTaskBundle(taskId);
    const continuityEvaluation = await this.service.evaluateCaseContinuity(
      this.toContinuityInput(taskId, selfCareBoundaryBundle),
    );
    const boundaryDecision = selfCareBoundaryBundle.boundaryBundle.currentBoundaryDecision;
    const normalizedBoundarySubtypeRef =
      boundaryDecision?.adminResolutionSubtypeRef !== null &&
      boundaryDecision?.adminResolutionSubtypeRef !== undefined
        ? normalizeSubtypeRef(
            boundaryDecision.adminResolutionSubtypeRef,
            "boundaryDecision.adminResolutionSubtypeRef",
          )
        : null;
    const normalizedStarterSubtypeRef =
      selfCareBoundaryBundle.directResolutionBundle?.adminResolutionStarter?.adminResolutionSubtypeRef
        ? normalizeSubtypeRef(
            selfCareBoundaryBundle.directResolutionBundle.adminResolutionStarter
              .adminResolutionSubtypeRef,
            "adminResolutionStarter.adminResolutionSubtypeRef",
          )
        : null;

    return {
      adminResolutionBundle,
      selfCareBoundaryBundle,
      continuityEvaluation,
      effectiveCaseState: continuityEvaluation.effectiveCaseState,
      effectiveReasonCodeRefs: continuityEvaluation.effectiveReasonCodeRefs,
      normalizedBoundarySubtypeRef,
      normalizedStarterSubtypeRef,
    };
  }

  async querySubtypePolicy(
    adminResolutionSubtypeRef: string,
  ): Promise<AdminResolutionSubtypeProfileSnapshot | null> {
    return this.service.querySubtypeProfile(
      normalizeSubtypeRef(adminResolutionSubtypeRef, "adminResolutionSubtypeRef"),
    );
  }

  async openAdminResolutionCase(
    input: OpenAdminResolutionCaseCommandInput,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle> {
    const upstream = await this.selfCareBoundaryApplication.queryTaskSelfCareBoundary(
      input.taskId,
    );
    const boundaryDecision = upstream.boundaryBundle.currentBoundaryDecision;
    const adminResolutionStarter = upstream.directResolutionBundle?.adminResolutionStarter ?? null;

    invariant(
      boundaryDecision,
      "SELF_CARE_BOUNDARY_DECISION_REQUIRED",
      `Task ${input.taskId} requires a current SelfCareBoundaryDecision.`,
    );
    invariant(
      boundaryDecision.decisionState === "admin_resolution",
      "CURRENT_BOUNDARY_IS_NOT_ADMIN_RESOLUTION",
      `Task ${input.taskId} is not currently classified as bounded admin-resolution.`,
    );
    invariant(
      adminResolutionStarter,
      "ADMIN_RESOLUTION_STARTER_REQUIRED",
      `Task ${input.taskId} requires a live AdminResolutionStarter from 240 direct resolution.`,
    );
    invariant(
      adminResolutionStarter.starterState === "live",
      "ADMIN_RESOLUTION_STARTER_NOT_LIVE",
      "AdminResolutionCase may open only from a live AdminResolutionStarter.",
    );
    invariant(
      optionalRef(adminResolutionStarter.decisionSupersessionRecordRef) === null,
      "ADMIN_RESOLUTION_STARTER_SUPERSEDED",
      "Superseded AdminResolutionStarter may not open a new AdminResolutionCase.",
    );
    invariant(
      boundaryDecision.decisionEpochRef === adminResolutionStarter.decisionEpochRef,
      "ADMIN_RESOLUTION_DECISION_EPOCH_DRIFT",
      "Boundary decision and admin starter must agree on the current DecisionEpoch.",
    );
    const normalizedStarterSubtype = normalizeSubtypeRef(
      adminResolutionStarter.adminResolutionSubtypeRef,
      "adminResolutionStarter.adminResolutionSubtypeRef",
    );
    const normalizedBoundarySubtype =
      boundaryDecision.adminResolutionSubtypeRef === null
        ? null
        : normalizeSubtypeRef(
            boundaryDecision.adminResolutionSubtypeRef,
            "boundaryDecision.adminResolutionSubtypeRef",
          );
    if (normalizedBoundarySubtype !== null) {
      invariant(
        normalizedBoundarySubtype === normalizedStarterSubtype,
        "ADMIN_RESOLUTION_SUBTYPE_DRIFT",
        "Boundary decision and admin starter must agree on the canonical admin subtype.",
      );
    }

    const requestedSubtype = optionalRef(input.adminResolutionSubtypeRef);
    const normalizedRequestedSubtype =
      requestedSubtype === null
        ? null
        : normalizeSubtypeRef(requestedSubtype, "adminResolutionSubtypeRef");
    const openingSubtype =
      normalizedRequestedSubtype === null
        ? normalizedStarterSubtype
        : this.resolveOpeningSubtype(normalizedStarterSubtype, normalizedRequestedSubtype);

    await this.service.openAdminResolutionCase({
      episodeRef: adminResolutionStarter.episodeRef,
      requestRef: boundaryDecision.requestRef,
      requestLineageRef: adminResolutionStarter.requestLineageRef,
      lineageCaseLinkRef: adminResolutionStarter.lineageCaseLinkRef,
      sourceTriageTaskRef: input.taskId,
      sourceAdminResolutionStarterRef: adminResolutionStarter.adminResolutionStarterId,
      sourceDomainRef: "phase3_direct_resolution",
      sourceDecisionRef: adminResolutionStarter.decisionId,
      sourceLineageRef: adminResolutionStarter.requestLineageRef,
      adminResolutionSubtypeRef: openingSubtype,
      boundaryDecisionRef: boundaryDecision.selfCareBoundaryDecisionId,
      boundaryTupleHash: boundaryDecision.boundaryTupleHash,
      boundaryState: boundaryDecision.boundaryState,
      clinicalMeaningState: boundaryDecision.clinicalMeaningState,
      operationalFollowUpScope: boundaryDecision.operationalFollowUpScope,
      adminMutationAuthorityState: boundaryDecision.adminMutationAuthorityState,
      decisionEpochRef: boundaryDecision.decisionEpochRef,
      decisionSupersessionRecordRef:
        boundaryDecision.decisionSupersessionRecordRef ??
        adminResolutionStarter.decisionSupersessionRecordRef,
      policyBundleRef: boundaryDecision.compiledPolicyBundleRef,
      lineageFenceEpoch: boundaryDecision.lineageFenceEpoch,
      currentOwnerRef: requireRef(input.actorRef, "actorRef"),
      dependencySetRef: boundaryDecision.dependencySetRef,
      reopenState: boundaryDecision.reopenState,
      releaseWatchRef: null,
      watchWindowRef: null,
      currentActionRecordRef: nextId(
        this.idGenerator,
        "phase3_admin_resolution_open_command_action",
      ),
      openedAt: ensureIsoTimestamp(input.openedAt, "openedAt"),
    });
    return this.queryTaskAdminResolution(input.taskId);
  }

  async reclassifyAdminResolutionSubtype(
    input: ReclassifyAdminResolutionSubtypeCommandInput,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle> {
    await this.assertCurrentCaseIsMutable(input.taskId, input.adminResolutionCaseId, input.recordedAt);
    await this.service.reclassifyAdminResolutionSubtype({
      adminResolutionCaseId: input.adminResolutionCaseId,
      nextSubtypeRef: normalizeSubtypeRef(input.nextSubtypeRef, "nextSubtypeRef"),
      currentOwnerRef: requireRef(input.actorRef, "actorRef"),
      currentActionRecordRef: nextId(
        this.idGenerator,
        "phase3_admin_resolution_reclassify_command_action",
      ),
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    });
    return this.queryTaskAdminResolution(input.taskId);
  }

  async enterAdminResolutionWaitingState(
    input: EnterAdminResolutionWaitingStateCommandInput,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle> {
    await this.assertCurrentCaseIsMutable(input.taskId, input.adminResolutionCaseId, input.recordedAt);
    await this.service.enterAdminResolutionWaitingState({
      adminResolutionCaseId: input.adminResolutionCaseId,
      waitingState: input.waitingState as Exclude<AdminResolutionWaitingState, "none">,
      waitingReasonCodeRef: requireRef(input.waitingReasonCodeRef, "waitingReasonCodeRef"),
      dependencyShape: input.dependencyShape,
      ownerRef: requireRef(input.ownerRef, "ownerRef"),
      slaClockSourceRef: requireRef(input.slaClockSourceRef, "slaClockSourceRef"),
      expiryOrRepairRuleRef: requireRef(
        input.expiryOrRepairRuleRef,
        "expiryOrRepairRuleRef",
      ),
      currentActionRecordRef: nextId(
        this.idGenerator,
        "phase3_admin_resolution_wait_command_action",
      ),
      enteredAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    });
    return this.queryTaskAdminResolution(input.taskId);
  }

  async cancelAdminResolutionWait(
    input: CancelAdminResolutionWaitCommandInput,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle> {
    await this.assertCurrentCaseIsMutable(input.taskId, input.adminResolutionCaseId, input.recordedAt);
    await this.service.cancelAdminResolutionWait({
      adminResolutionCaseId: input.adminResolutionCaseId,
      currentOwnerRef: requireRef(input.actorRef, "actorRef"),
      currentActionRecordRef: nextId(
        this.idGenerator,
        "phase3_admin_resolution_cancel_wait_command_action",
      ),
      canceledAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    });
    return this.queryTaskAdminResolution(input.taskId);
  }

  async recordAdminResolutionCompletionArtifact(
    input: RecordAdminResolutionCompletionArtifactCommandInput,
  ): Promise<Phase3AdminResolutionPolicyApplicationBundle> {
    await this.assertCurrentCaseIsMutable(input.taskId, input.adminResolutionCaseId, input.recordedAt);
    await this.service.recordAdminResolutionCompletionArtifact({
      adminResolutionCaseId: input.adminResolutionCaseId,
      completionType: input.completionType,
      completionEvidenceRefs: input.completionEvidenceRefs,
      patientVisibleSummaryRef: requireRef(
        input.patientVisibleSummaryRef,
        "patientVisibleSummaryRef",
      ),
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      patientExpectationTemplateRef: optionalRef(input.patientExpectationTemplateRef),
      artifactPresentationContractRef: optionalRef(
        input.artifactPresentationContractRef,
      ),
      artifactByteGrantRefs: input.artifactByteGrantRefs,
      outboundNavigationGrantRefs: input.outboundNavigationGrantRefs,
      releaseState: input.releaseState,
      visibilityTier: optionalRef(input.visibilityTier),
      summarySafetyTier: optionalRef(input.summarySafetyTier),
      placeholderContractRef: optionalRef(input.placeholderContractRef),
      communicationDispatchRefs: input.communicationDispatchRefs,
      deliveryOutcomeRefs: input.deliveryOutcomeRefs,
    });
    return this.queryTaskAdminResolution(input.taskId);
  }

  private resolveOpeningSubtype(
    starterSubtype: AdminResolutionSubtypeRef,
    requestedSubtype: AdminResolutionSubtypeRef,
  ): AdminResolutionSubtypeRef {
    if (starterSubtype === "routed_admin_task") {
      return requestedSubtype;
    }
    invariant(
      starterSubtype === requestedSubtype,
      "ADMIN_RESOLUTION_OPEN_SUBTYPE_OVERRIDE_FORBIDDEN",
      "A non-routed admin starter may open only with its current canonical subtype.",
    );
    return starterSubtype;
  }

  private async assertCurrentCaseIsMutable(
    taskId: string,
    adminResolutionCaseId: string,
    recordedAt: string,
  ): Promise<AdminResolutionCaseSnapshot> {
    const bundle = await this.queryTaskAdminResolution(taskId);
    const currentCase = bundle.adminResolutionBundle.currentAdminResolutionCase;
    invariant(
      currentCase,
      "ADMIN_RESOLUTION_CASE_NOT_FOUND",
      `Task ${taskId} does not have a current AdminResolutionCase.`,
    );
    invariant(
      currentCase.adminResolutionCaseId === requireRef(adminResolutionCaseId, "adminResolutionCaseId"),
      "STALE_ADMIN_RESOLUTION_CASE_REF",
      "Mutations are allowed only against the current AdminResolutionCase for the task.",
    );
    ensureIsoTimestamp(recordedAt, "recordedAt");
    invariant(
      bundle.continuityEvaluation.effectiveCaseState !== "frozen",
      "ADMIN_RESOLUTION_CASE_FROZEN",
      `Admin consequence is frozen: ${bundle.continuityEvaluation.effectiveReasonCodeRefs.join(", ") || "continuity drift"}.`,
    );
    return currentCase;
  }

  private toContinuityInput(
    taskId: string,
    selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle,
  ) {
    const boundaryDecision = selfCareBoundaryBundle.boundaryBundle.currentBoundaryDecision;
    return {
      taskId,
      currentBoundaryDecisionRef: boundaryDecision?.selfCareBoundaryDecisionId ?? null,
      currentBoundaryTupleHash: boundaryDecision?.boundaryTupleHash ?? null,
      currentBoundaryState: boundaryDecision?.boundaryState ?? null,
      currentClinicalMeaningState: boundaryDecision?.clinicalMeaningState ?? null,
      currentOperationalFollowUpScope:
        boundaryDecision?.operationalFollowUpScope ?? null,
      currentAdminMutationAuthorityState:
        boundaryDecision?.adminMutationAuthorityState ?? null,
      currentDecisionEpochRef: boundaryDecision?.decisionEpochRef ?? null,
      currentDecisionSupersessionRecordRef:
        boundaryDecision?.decisionSupersessionRecordRef ?? null,
      currentReopenState: boundaryDecision?.reopenState ?? null,
      evaluatedAt: new Date().toISOString(),
    } as const;
  }
}

export function createPhase3AdminResolutionPolicyApplication(options?: {
  selfCareBoundaryApplication?: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  repositories?: Phase3AdminResolutionPolicyKernelRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3AdminResolutionPolicyApplication {
  return new Phase3AdminResolutionPolicyApplicationImpl(options);
}
