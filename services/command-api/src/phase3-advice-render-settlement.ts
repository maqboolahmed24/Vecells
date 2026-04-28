import { createDeterministicBackboneIdGenerator, type BackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3AdviceRenderKernelService,
  createPhase3AdviceRenderKernelStore,
  type AdviceBundleVersionSnapshot,
  type AdviceRenderPublicationState,
  type AdviceRenderReleaseGateState,
  type AdviceRenderReleaseTrustState,
  type AdviceRenderSettlementSnapshot,
  type AdviceRenderState,
  type AdviceVariantSetSnapshot,
  type ClinicalContentApprovalRecordSnapshot,
  type ContentReviewScheduleSnapshot,
  type EvaluateAdviceRenderCandidateInput,
  type Phase3AdviceRenderBundle,
  type Phase3AdviceRenderKernelRepositories,
  type Phase3AdviceRenderKernelService,
  type RegisterAdviceBundleVersionInput,
  type RegisterAdviceVariantSetInput,
  type RegisterClinicalContentApprovalRecordInput,
  type RegisterContentReviewScheduleInput,
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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function derivePathwayRef(bundle: Phase3SelfCareBoundaryApplicationBundle): string {
  const boundary = bundle.boundaryBundle.currentBoundaryDecision;
  if (boundary?.operationalFollowUpScope === "self_serve_guidance") {
    return "self_serve_guidance";
  }
  return boundary?.operationalFollowUpScope ?? "self_serve_guidance";
}

export const PHASE3_ADVICE_RENDER_SERVICE_NAME =
  "Phase3AdviceRenderSettlementApplication";
export const PHASE3_ADVICE_RENDER_SCHEMA_VERSION =
  "250.phase3.advice-render-settlement.v1";
export const PHASE3_ADVICE_RENDER_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/advice-render",
] as const;

export const phase3AdviceRenderRoutes = [
  {
    routeId: "workspace_task_advice_render_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/advice-render",
    contractFamily: "AdviceRenderBundleContract",
    purpose:
      "Expose the current advice content selection, current AdviceRenderSettlement, and the effective render posture later patient and staff self-care surfaces must consume.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_advice_content_approval_register",
    method: "POST",
    path: "/internal/v1/workspace/advice-content/approvals:register",
    contractFamily: "ClinicalContentApprovalRecordRegisterCommandContract",
    purpose:
      "Register one explicit ClinicalContentApprovalRecord so advice render cannot proceed on implied or stale content approval.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_advice_content_review_schedule_register",
    method: "POST",
    path: "/internal/v1/workspace/advice-content/review-schedules:register",
    contractFamily: "ContentReviewScheduleRegisterCommandContract",
    purpose:
      "Register one ContentReviewSchedule so advice render can fail closed when review cadence or hard expiry drift.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_advice_bundle_version_register",
    method: "POST",
    path: "/internal/v1/workspace/advice-content/bundles:register",
    contractFamily: "AdviceBundleVersionRegisterCommandContract",
    purpose:
      "Register one AdviceBundleVersion for a specific pathway, compiled policy bundle, and approved audience envelope.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_advice_variant_set_register",
    method: "POST",
    path: "/internal/v1/workspace/advice-content/variants:register",
    contractFamily: "AdviceVariantSetRegisterCommandContract",
    purpose:
      "Register one AdviceVariantSet with explicit channel, locale, reading-level, accessibility, and governed artifact-contract references.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_render_advice",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:render-advice",
    contractFamily: "AdviceRenderCommandContract",
    purpose:
      "Settle visible self-care advice only when the current boundary, grant, approved content, variant set, publication tuple, and trust posture still align.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_invalidate_advice_render",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/advice-render/{adviceRenderSettlementId}:invalidate",
    contractFamily: "AdviceRenderInvalidateCommandContract",
    purpose:
      "Invalidate the current advice render when boundary, grant, evidence, session, or publication truth has drifted.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_supersede_advice_render",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/advice-render/{adviceRenderSettlementId}:supersede",
    contractFamily: "AdviceRenderSupersedeCommandContract",
    purpose:
      "Supersede the current advice render when a newer approved content bundle or variant set replaces the visible settlement.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_quarantine_advice_render",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/advice-render/{adviceRenderSettlementId}:quarantine",
    contractFamily: "AdviceRenderQuarantineCommandContract",
    purpose:
      "Quarantine the current advice render when trust or publication posture blocks fresh visible advice while preserving governed provenance.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3AdviceRenderPersistenceTables = [
  ...new Set([
    ...phase3SelfCareBoundaryPersistenceTables,
    "phase3_clinical_content_approval_records",
    "phase3_content_review_schedules",
    "phase3_advice_bundle_versions",
    "phase3_advice_variant_sets",
    "phase3_advice_render_settlements",
  ]),
] as const;

export const phase3AdviceRenderMigrationPlanRefs = [
  ...new Set([
    ...phase3SelfCareBoundaryMigrationPlanRefs,
    "services/command-api/migrations/126_phase3_advice_render_settlement_and_content_approval.sql",
  ]),
] as const;

export interface Phase3AdviceRenderApplicationBundle {
  renderBundle: Phase3AdviceRenderBundle;
  selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle;
  selectedAdviceBundleVersion: AdviceBundleVersionSnapshot | null;
  selectedAdviceVariantSet: AdviceVariantSetSnapshot | null;
  selectedApprovalRecord: ClinicalContentApprovalRecordSnapshot | null;
  selectedReviewSchedule: ContentReviewScheduleSnapshot | null;
  effectiveRenderState: AdviceRenderState | null;
  effectiveReasonCodeRefs: readonly string[];
}

export type RegisterClinicalContentApprovalRecordCommandInput =
  RegisterClinicalContentApprovalRecordInput;
export type RegisterContentReviewScheduleCommandInput =
  RegisterContentReviewScheduleInput;
export type RegisterAdviceBundleVersionCommandInput = RegisterAdviceBundleVersionInput;
export type RegisterAdviceVariantSetCommandInput = RegisterAdviceVariantSetInput;

export interface RenderAdviceCommandInput {
  taskId: string;
  actorRef: string;
  settledAt: string;
  readingLevelRef?: string | null;
  accessibilityVariantRefs?: readonly string[];
  releaseApprovalFreezeRef?: string | null;
  channelReleaseFreezeRef?: string | null;
  publicationState?: AdviceRenderPublicationState;
  releaseTrustState?: AdviceRenderReleaseTrustState;
  releaseGateState?: AdviceRenderReleaseGateState;
  channelReleaseState?: AdviceRenderReleaseGateState;
  artifactPresentationContractRef?: string | null;
  outboundNavigationGrantPolicyRef?: string | null;
  visibilityTier?: string | null;
  summarySafetyTier?: string | null;
  placeholderContractRef?: string | null;
  recoveryRouteRef?: string | null;
}

export interface TransitionAdviceRenderCommandInput {
  taskId: string;
  adviceRenderSettlementId: string;
  actorRef: string;
  settledAt: string;
  reasonCodeRefs?: readonly string[];
}

export interface Phase3AdviceRenderApplication {
  readonly serviceName: typeof PHASE3_ADVICE_RENDER_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_ADVICE_RENDER_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_ADVICE_RENDER_QUERY_SURFACES;
  readonly routes: typeof phase3AdviceRenderRoutes;
  readonly selfCareBoundaryApplication: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  readonly repositories: Phase3AdviceRenderKernelRepositories;
  readonly service: Phase3AdviceRenderKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskAdviceRender(taskId: string): Promise<Phase3AdviceRenderApplicationBundle>;
  registerClinicalContentApprovalRecord(
    input: RegisterClinicalContentApprovalRecordCommandInput,
  ): Promise<ClinicalContentApprovalRecordSnapshot>;
  registerContentReviewSchedule(
    input: RegisterContentReviewScheduleCommandInput,
  ): Promise<ContentReviewScheduleSnapshot>;
  registerAdviceBundleVersion(
    input: RegisterAdviceBundleVersionCommandInput,
  ): Promise<AdviceBundleVersionSnapshot>;
  registerAdviceVariantSet(
    input: RegisterAdviceVariantSetCommandInput,
  ): Promise<AdviceVariantSetSnapshot>;
  renderAdvice(input: RenderAdviceCommandInput): Promise<Phase3AdviceRenderApplicationBundle>;
  invalidateAdviceRender(
    input: TransitionAdviceRenderCommandInput,
  ): Promise<Phase3AdviceRenderApplicationBundle>;
  supersedeAdviceRender(
    input: TransitionAdviceRenderCommandInput,
  ): Promise<Phase3AdviceRenderApplicationBundle>;
  quarantineAdviceRender(
    input: TransitionAdviceRenderCommandInput,
  ): Promise<Phase3AdviceRenderApplicationBundle>;
}

class Phase3AdviceRenderApplicationImpl implements Phase3AdviceRenderApplication {
  readonly serviceName = PHASE3_ADVICE_RENDER_SERVICE_NAME;
  readonly schemaVersion = PHASE3_ADVICE_RENDER_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_ADVICE_RENDER_QUERY_SURFACES;
  readonly routes = phase3AdviceRenderRoutes;
  readonly selfCareBoundaryApplication: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  readonly repositories: Phase3AdviceRenderKernelRepositories;
  readonly service: Phase3AdviceRenderKernelService;
  readonly persistenceTables = phase3AdviceRenderPersistenceTables;
  readonly migrationPlanRef = phase3AdviceRenderMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3AdviceRenderMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;

  constructor(options?: {
    selfCareBoundaryApplication?: Pick<
      Phase3SelfCareBoundaryApplication,
      "queryTaskSelfCareBoundary"
    >;
    repositories?: Phase3AdviceRenderKernelRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_advice_render");
    this.selfCareBoundaryApplication =
      options?.selfCareBoundaryApplication ??
      createPhase3SelfCareBoundaryApplication({
        idGenerator: this.idGenerator,
      });
    this.repositories =
      options?.repositories ?? createPhase3AdviceRenderKernelStore();
    this.service = createPhase3AdviceRenderKernelService(this.repositories, {
      idGenerator: this.idGenerator,
    });
  }

  async queryTaskAdviceRender(taskId: string): Promise<Phase3AdviceRenderApplicationBundle> {
    const selfCareBoundaryBundle =
      await this.selfCareBoundaryApplication.queryTaskSelfCareBoundary(taskId);
    const renderBundle = await this.service.queryTaskBundle(taskId);
    const evaluation = await this.evaluateCurrentCandidate(
      taskId,
      selfCareBoundaryBundle,
      renderBundle,
    );

    let effectiveRenderState: AdviceRenderState | null = null;
    let effectiveReasonCodeRefs = evaluation.reasonCodeRefs;
    const currentSettlement = renderBundle.currentRenderSettlement;
    if (currentSettlement) {
      if (
        evaluation.selectedAdviceBundleVersion &&
        currentSettlement.adviceBundleVersionRef !==
          evaluation.selectedAdviceBundleVersion.adviceBundleVersionId &&
        evaluation.renderState === "renderable"
      ) {
        effectiveRenderState = "superseded";
        effectiveReasonCodeRefs = uniqueSorted([
          ...currentSettlement.reasonCodeRefs,
          ...evaluation.reasonCodeRefs,
          "advice_bundle_version_superseded",
        ]);
      } else if (evaluation.renderState !== "renderable") {
        effectiveRenderState = evaluation.renderState;
        effectiveReasonCodeRefs = uniqueSorted([
          ...currentSettlement.reasonCodeRefs,
          ...evaluation.reasonCodeRefs,
        ]);
      } else {
        effectiveRenderState = currentSettlement.renderState;
        effectiveReasonCodeRefs = uniqueSorted([
          ...currentSettlement.reasonCodeRefs,
          ...evaluation.reasonCodeRefs,
        ]);
      }
    } else {
      effectiveRenderState = evaluation.renderState;
    }

    return {
      renderBundle,
      selfCareBoundaryBundle,
      selectedAdviceBundleVersion: evaluation.selectedAdviceBundleVersion,
      selectedAdviceVariantSet: evaluation.selectedAdviceVariantSet,
      selectedApprovalRecord: evaluation.selectedApprovalRecord,
      selectedReviewSchedule: evaluation.selectedReviewSchedule,
      effectiveRenderState,
      effectiveReasonCodeRefs,
    };
  }

  async registerClinicalContentApprovalRecord(
    input: RegisterClinicalContentApprovalRecordCommandInput,
  ): Promise<ClinicalContentApprovalRecordSnapshot> {
    return this.service.registerClinicalContentApprovalRecord(input);
  }

  async registerContentReviewSchedule(
    input: RegisterContentReviewScheduleCommandInput,
  ): Promise<ContentReviewScheduleSnapshot> {
    return this.service.registerContentReviewSchedule(input);
  }

  async registerAdviceBundleVersion(
    input: RegisterAdviceBundleVersionCommandInput,
  ): Promise<AdviceBundleVersionSnapshot> {
    return this.service.registerAdviceBundleVersion(input);
  }

  async registerAdviceVariantSet(
    input: RegisterAdviceVariantSetCommandInput,
  ): Promise<AdviceVariantSetSnapshot> {
    return this.service.registerAdviceVariantSet(input);
  }

  async renderAdvice(input: RenderAdviceCommandInput): Promise<Phase3AdviceRenderApplicationBundle> {
    const selfCareBoundaryBundle =
      await this.selfCareBoundaryApplication.queryTaskSelfCareBoundary(input.taskId);
    const settleInput = this.toSettleAdviceRenderInput(selfCareBoundaryBundle, input);
    await this.service.settleAdviceRender(settleInput);
    return this.queryTaskAdviceRender(input.taskId);
  }

  async invalidateAdviceRender(
    input: TransitionAdviceRenderCommandInput,
  ): Promise<Phase3AdviceRenderApplicationBundle> {
    await this.service.transitionAdviceRender({
      taskId: input.taskId,
      adviceRenderSettlementId: input.adviceRenderSettlementId,
      nextRenderState: "invalidated",
      reasonCodeRefs: uniqueSorted([
        ...(input.reasonCodeRefs ?? []),
        "manual_invalidate_advice_render",
      ]),
      settledAt: input.settledAt,
    });
    return this.queryTaskAdviceRender(input.taskId);
  }

  async supersedeAdviceRender(
    input: TransitionAdviceRenderCommandInput,
  ): Promise<Phase3AdviceRenderApplicationBundle> {
    await this.service.transitionAdviceRender({
      taskId: input.taskId,
      adviceRenderSettlementId: input.adviceRenderSettlementId,
      nextRenderState: "superseded",
      reasonCodeRefs: uniqueSorted([
        ...(input.reasonCodeRefs ?? []),
        "manual_supersede_advice_render",
      ]),
      settledAt: input.settledAt,
    });
    return this.queryTaskAdviceRender(input.taskId);
  }

  async quarantineAdviceRender(
    input: TransitionAdviceRenderCommandInput,
  ): Promise<Phase3AdviceRenderApplicationBundle> {
    await this.service.transitionAdviceRender({
      taskId: input.taskId,
      adviceRenderSettlementId: input.adviceRenderSettlementId,
      nextRenderState: "quarantined",
      trustState: "quarantined",
      reasonCodeRefs: uniqueSorted([
        ...(input.reasonCodeRefs ?? []),
        "manual_quarantine_advice_render",
      ]),
      settledAt: input.settledAt,
    });
    return this.queryTaskAdviceRender(input.taskId);
  }

  private async evaluateCurrentCandidate(
    taskId: string,
    selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle,
    renderBundle?: Phase3AdviceRenderBundle,
  ) {
    const bundle = selfCareBoundaryBundle.boundaryBundle;
    const boundaryDecision = bundle.currentBoundaryDecision;
    const grant = bundle.currentAdviceEligibilityGrant;
    const currentSettlement = renderBundle?.currentRenderSettlement ?? null;
    const currentVariant =
      currentSettlement === null
        ? null
        : (renderBundle?.adviceVariantSets.find(
            (variant) =>
              variant.adviceVariantSetId === currentSettlement.adviceVariantSetRef,
          ) ?? null);
    return this.service.evaluateAdviceRenderCandidate({
      taskId,
      requestRef:
        boundaryDecision?.requestRef ??
        grant?.requestRef ??
        `request_ref_missing_${taskId}`,
      pathwayRef: derivePathwayRef(selfCareBoundaryBundle),
      compiledPolicyBundleRef:
        boundaryDecision?.compiledPolicyBundleRef ??
        grant?.compiledPolicyBundleRef ??
        "policy_bundle_missing",
      adviceEligibilityGrantRef: grant?.adviceEligibilityGrantId ?? null,
      effectiveAdviceGrantState: selfCareBoundaryBundle.effectiveAdviceGrantState,
      effectiveAdviceGrantReasonCodeRefs:
        selfCareBoundaryBundle.effectiveAdviceGrantReasonCodeRefs,
      boundaryDecisionRef: boundaryDecision?.selfCareBoundaryDecisionId ?? null,
      boundaryTupleHash: boundaryDecision?.boundaryTupleHash ?? null,
      decisionEpochRef:
        boundaryDecision?.decisionEpochRef ?? grant?.decisionEpochRef ?? null,
      decisionSupersessionRecordRef:
        boundaryDecision?.decisionSupersessionRecordRef ??
        grant?.decisionSupersessionRecordRef ??
        null,
      routeIntentBindingRef:
        boundaryDecision?.routeIntentBindingRef ?? grant?.routeIntentRef ?? null,
      surfaceRouteContractRef: grant?.surfaceRouteContractRef ?? null,
      surfacePublicationRef: grant?.surfacePublicationRef ?? null,
      runtimePublicationBundleRef: grant?.runtimePublicationBundleRef ?? null,
      dependencySetRef: boundaryDecision?.dependencySetRef ?? null,
      clinicalMeaningState: boundaryDecision?.clinicalMeaningState ?? null,
      operationalFollowUpScope: boundaryDecision?.operationalFollowUpScope ?? null,
      reopenState: boundaryDecision?.reopenState ?? null,
      audienceTier: grant?.audienceTier ?? null,
      channelRef: grant?.channelRef ?? null,
      localeRef: grant?.localeRef ?? null,
      readingLevelRef: currentVariant?.readingLevelRef ?? null,
      accessibilityVariantRefs: currentVariant?.accessibilityVariantRefs ?? [],
      settledAt:
        currentSettlement?.settledAt ??
        new Date().toISOString(),
    });
  }

  private toSettleAdviceRenderInput(
    selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle,
    input: RenderAdviceCommandInput,
  ) {
    const bundle = selfCareBoundaryBundle.boundaryBundle;
    const boundaryDecision = bundle.currentBoundaryDecision;
    const grant = bundle.currentAdviceEligibilityGrant;
    invariant(
      boundaryDecision,
      "SELF_CARE_BOUNDARY_DECISION_REQUIRED",
      `Task ${input.taskId} requires a current SelfCareBoundaryDecision.`,
    );
    invariant(
      grant,
      "ADVICE_ELIGIBILITY_GRANT_REQUIRED",
      `Task ${input.taskId} requires a current AdviceEligibilityGrant.`,
    );

    const settledAt = ensureIsoTimestamp(input.settledAt, "settledAt");
    return {
      taskId: input.taskId,
      requestRef: boundaryDecision.requestRef,
      pathwayRef: derivePathwayRef(selfCareBoundaryBundle),
      compiledPolicyBundleRef: boundaryDecision.compiledPolicyBundleRef,
      adviceEligibilityGrantRef: grant.adviceEligibilityGrantId,
      effectiveAdviceGrantState: selfCareBoundaryBundle.effectiveAdviceGrantState,
      effectiveAdviceGrantReasonCodeRefs:
        selfCareBoundaryBundle.effectiveAdviceGrantReasonCodeRefs,
      boundaryDecisionRef: boundaryDecision.selfCareBoundaryDecisionId,
      boundaryTupleHash: boundaryDecision.boundaryTupleHash,
      decisionEpochRef: boundaryDecision.decisionEpochRef,
      decisionSupersessionRecordRef:
        boundaryDecision.decisionSupersessionRecordRef ??
        grant.decisionSupersessionRecordRef,
      routeIntentBindingRef: boundaryDecision.routeIntentBindingRef,
      surfaceRouteContractRef: grant.surfaceRouteContractRef,
      surfacePublicationRef: grant.surfacePublicationRef,
      runtimePublicationBundleRef: grant.runtimePublicationBundleRef,
      dependencySetRef: boundaryDecision.dependencySetRef,
      clinicalMeaningState: boundaryDecision.clinicalMeaningState,
      operationalFollowUpScope: boundaryDecision.operationalFollowUpScope,
      reopenState: boundaryDecision.reopenState,
      audienceTier: grant.audienceTier,
      channelRef: grant.channelRef,
      localeRef: grant.localeRef,
      readingLevelRef: optionalRef(input.readingLevelRef),
      accessibilityVariantRefs: input.accessibilityVariantRefs ?? [],
      releaseApprovalFreezeRef: optionalRef(input.releaseApprovalFreezeRef),
      channelReleaseFreezeRef: optionalRef(input.channelReleaseFreezeRef),
      publicationState: input.publicationState ?? "current",
      releaseTrustState: input.releaseTrustState ?? "trusted",
      releaseGateState: input.releaseGateState ?? "open",
      channelReleaseState: input.channelReleaseState ?? "open",
      artifactPresentationContractRef: optionalRef(input.artifactPresentationContractRef),
      outboundNavigationGrantPolicyRef: optionalRef(
        input.outboundNavigationGrantPolicyRef,
      ),
      visibilityTier: optionalRef(input.visibilityTier) ?? "authenticated",
      summarySafetyTier:
        optionalRef(input.summarySafetyTier) ?? "clinical_safe_summary",
      placeholderContractRef: optionalRef(input.placeholderContractRef),
      recoveryRouteRef: optionalRef(input.recoveryRouteRef),
      commandActionRef: nextId(this.idGenerator, "phase3_advice_render_action"),
      commandSettlementRef: nextId(
        this.idGenerator,
        "phase3_advice_render_command_settlement",
      ),
      transitionEnvelopeRef: `transition_envelope_${input.taskId}_render`,
      recoveryDispositionRef: "recovery_disposition_self_care_render",
      patientTimelineRef: `patient_timeline_${input.taskId}`,
      communicationTemplateRef: `communication_template_${input.taskId}`,
      controlStatusSnapshotRef: `control_status_snapshot_${input.taskId}`,
      settledAt,
      reasonCodeRefs: [`advice_render_requested_by:${requireRef(input.actorRef, "actorRef")}`],
    } satisfies EvaluateAdviceRenderCandidateInput & {
      commandActionRef: string;
      commandSettlementRef: string;
    };
  }
}

export function createPhase3AdviceRenderApplication(options?: {
  selfCareBoundaryApplication?: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  repositories?: Phase3AdviceRenderKernelRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3AdviceRenderApplication {
  return new Phase3AdviceRenderApplicationImpl(options);
}
