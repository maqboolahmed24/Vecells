import { createHash } from "node:crypto";
import {
  createAccessGrantService,
  createLeaseFenceCommandAuthorityService,
  type IdentityAccessDependencies,
} from "@vecells/domain-identity-access";
import {
  applyAssimilationSafetyToRequest,
  assertRoutineContinuationAllowed,
  createAssimilationSafetyServices,
  createAssimilationSafetyStore,
  type AssimilationSafetyDependencies,
  type AssimilationSafetyServices,
  type ClassificationInput,
  type EvidenceAssimilationRecordSnapshot,
  type EvidenceBatchItem,
  type EvidenceCaptureBundleDocument,
  type EvidenceClassificationDecisionSnapshot,
  type EvidenceClass,
  type EvidenceSnapshotDocument,
  type MaterialDeltaAssessmentSnapshot,
  type MaterialDeltaDecisionBasis,
  type MaterialityClass,
  type RequestedSafetyState,
  type SafetyDecisionRecordSnapshot,
  type SafetyDecisionOutcome,
  type SafetyEvaluationInput,
  type SafetyPreemptionRecordSnapshot,
  type UrgentDiversionActionMode,
  type UrgentDiversionSettlementSnapshot,
} from "@vecells/domain-intake-safety";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type Phase3CommandWitness,
} from "@vecells/domain-kernel";
import {
  buildMoreInfoResponsePayloadHash,
  buildMoreInfoResponseReplayKey,
  createPhase3MoreInfoKernelService,
  createPhase3MoreInfoResponseResafetyService,
  createPhase3MoreInfoResponseResafetyStore,
  evaluateMoreInfoResponseChurnGuard,
  resolveMoreInfoResponseDisposition,
  type CreateResponseAssimilationRecordInput,
  type MoreInfoCycleSnapshot,
  type MoreInfoResponseDispositionSnapshot,
  type MoreInfoResponseReplayDisposition,
  type MoreInfoReplyWindowCheckpointSnapshot,
  type MoreInfoResponseResafetyRepositories,
  type MoreInfoSupervisorReviewRequirementSnapshot,
  type ResolvedMoreInfoResponseDisposition,
  type ResponseAssimilationRecordSnapshot,
  type ResponseAssimilationRoutingOutcome,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3MoreInfoKernelApplication,
  phase3MoreInfoKernelMigrationPlanRefs,
  phase3MoreInfoKernelPersistenceTables,
  type Phase3MoreInfoKernelApplication,
} from "./phase3-more-info-kernel";

const MORE_INFO_DOMAIN = "triage_more_info";
export const PHASE3_MORE_INFO_RESPONSE_RESAFETY_SERVICE_NAME =
  "Phase3MoreInfoResponseResafetyApplication";
export const PHASE3_MORE_INFO_RESPONSE_RESAFETY_SCHEMA_VERSION =
  "237.phase3.more-info-response-resafety.v1";

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

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256Hex(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function nextLocalId(seed: string, counters: Map<string, number>, kind: string): string {
  const next = (counters.get(kind) ?? 0) + 1;
  counters.set(kind, next);
  return `${seed}_${kind}_${String(next).padStart(4, "0")}`;
}

function mediaTypeForArtifactRef(artifactRef: string): string {
  if (artifactRef.endsWith(".txt")) {
    return "text/plain";
  }
  if (artifactRef.endsWith(".json")) {
    return "application/json";
  }
  return "application/octet-stream";
}

export interface ReceiveMoreInfoReplyInput {
  taskId: string;
  cycleId: string;
  actorRef: string;
  idempotencyKey: string;
  receivedAt: string;
  messageText?: string | null;
  structuredFacts?: Readonly<Record<string, unknown>>;
  sourceArtifactRefs?: readonly string[];
  attachmentRefs?: readonly string[];
  repairBlockReasonRefs?: readonly string[];
  policyAllowsLateReview?: boolean;
  requestClosedOverride?: boolean;
  allowListTechnicalOnly?: boolean;
  pureControlPlaneDelta?: boolean;
  degradedParsing?: boolean;
  contactSafetyDependencyFailure?: boolean;
  changedFeatureRefs?: readonly string[];
  changedDependencyRefs?: readonly string[];
  changedChronologyRefs?: readonly string[];
  activeReachabilityDependencyRefs?: readonly string[];
  blockingActionScopeRefs?: readonly string[];
  priorityHint?: "routine_review" | "urgent_review" | "urgent_live";
  urgentDiversionActionMode?: UrgentDiversionActionMode;
  clinicianResolutionEventAt?: string | null;
  autoReturnToQueue?: boolean;
}

export interface ReceiveMoreInfoReplyResult {
  replayed: boolean;
  disposition: MoreInfoResponseDispositionSnapshot;
  responseAssimilation: ResponseAssimilationRecordSnapshot | null;
  evidenceAssimilation: EvidenceAssimilationRecordSnapshot | null;
  materialDelta: MaterialDeltaAssessmentSnapshot | null;
  classification: EvidenceClassificationDecisionSnapshot | null;
  captureBundleRef: string | null;
  resultingSnapshotRef: string | null;
  preemption: SafetyPreemptionRecordSnapshot | null;
  safetyDecision: SafetyDecisionRecordSnapshot | null;
  urgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null;
  supervisorReviewRequirement: MoreInfoSupervisorReviewRequirementSnapshot | null;
  routingOutcome: ResponseAssimilationRoutingOutcome | null;
  taskTransitionRef: string | null;
  queueReturnTransitionRef: string | null;
}

export interface EvaluateMoreInfoReplyDispositionInput {
  taskId: string;
  cycleId: string;
  idempotencyKey: string;
  payloadHash: string;
  replayKey: string;
  receivedAt: string;
  repairBlockReasonRefs?: readonly string[];
  policyAllowsLateReview?: boolean;
  requestClosedOverride?: boolean;
}

export interface EvaluateMoreInfoReplyDispositionResult {
  replayed: boolean;
  replayDisposition: MoreInfoResponseReplayDisposition;
  existingResult: ReceiveMoreInfoReplyResult | null;
  resolvedDisposition: ResolvedMoreInfoResponseDisposition;
  cycle: MoreInfoCycleSnapshot;
  checkpoint: MoreInfoReplyWindowCheckpointSnapshot;
  requestLineageRef: string;
  requestClosed: boolean;
}

export interface AssimilateAcceptedMoreInfoReplyInput extends ReceiveMoreInfoReplyInput {
  payloadHash: string;
  replayKey: string;
  disposition: ResolvedMoreInfoResponseDisposition;
}

export interface Phase3MoreInfoResponseResafetyApplication {
  readonly serviceName: typeof PHASE3_MORE_INFO_RESPONSE_RESAFETY_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_MORE_INFO_RESPONSE_RESAFETY_SCHEMA_VERSION;
  readonly routes: typeof phase3MoreInfoResponseResafetyRoutes;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  readonly moreInfoApplication: Phase3MoreInfoKernelApplication;
  readonly responseRepositories: MoreInfoResponseResafetyRepositories;
  readonly safetyRepositories: AssimilationSafetyDependencies;
  evaluateReplyDisposition(
    input: EvaluateMoreInfoReplyDispositionInput,
  ): Promise<EvaluateMoreInfoReplyDispositionResult>;
  receiveMoreInfoReply(input: ReceiveMoreInfoReplyInput): Promise<ReceiveMoreInfoReplyResult>;
}

export const phase3MoreInfoResponseResafetyRoutes = [
  {
    routeId: "workspace_task_receive_more_info_reply",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/more-info/{cycleId}:receive-reply",
    contractFamily: "MoreInfoReplyReceiptCommandContract",
  },
  {
    routeId: "workspace_task_evaluate_more_info_reply_disposition",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:evaluate-reply",
    contractFamily: "MoreInfoReplyDispositionCommandContract",
  },
  {
    routeId: "workspace_task_assimilate_more_info_reply",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:assimilate-reply",
    contractFamily: "MoreInfoReplyAssimilationCommandContract",
  },
  {
    routeId: "workspace_task_classify_more_info_reply",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:classify-reply",
    contractFamily: "MoreInfoReplyClassificationCommandContract",
  },
  {
    routeId: "workspace_task_run_more_info_resafety",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:run-resafety",
    contractFamily: "MoreInfoReplyResafetyCommandContract",
  },
  {
    routeId: "workspace_task_settle_more_info_urgent_return",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:settle-urgent-return",
    contractFamily: "MoreInfoUrgentReturnSettlementContract",
  },
  {
    routeId: "workspace_task_settle_more_info_review_resumed_return",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:settle-review-resumed-return",
    contractFamily: "MoreInfoReviewResumedSettlementContract",
  },
  {
    routeId: "workspace_task_mark_more_info_supervisor_review_required",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:mark-supervisor-review-required",
    contractFamily: "MoreInfoSupervisorReviewRequirementContract",
  },
] as const;

export const phase3MoreInfoResponseResafetyPersistenceTables = [
  ...new Set([
    ...phase3MoreInfoKernelPersistenceTables,
    "phase3_more_info_response_dispositions",
    "phase3_response_assimilation_records",
    "phase3_more_info_supervisor_review_requirements",
  ]),
] as const;

export const phase3MoreInfoResponseResafetyMigrationPlanRefs = [
  ...new Set([
    ...phase3MoreInfoKernelMigrationPlanRefs,
    "services/command-api/migrations/113_phase3_more_info_response_resafety.sql",
  ]),
] as const;

class Phase3MoreInfoResponseResafetyApplicationImpl
  implements Phase3MoreInfoResponseResafetyApplication
{
  readonly serviceName = PHASE3_MORE_INFO_RESPONSE_RESAFETY_SERVICE_NAME;
  readonly schemaVersion = PHASE3_MORE_INFO_RESPONSE_RESAFETY_SCHEMA_VERSION;
  readonly routes = phase3MoreInfoResponseResafetyRoutes;
  readonly persistenceTables = phase3MoreInfoResponseResafetyPersistenceTables;
  readonly migrationPlanRef = phase3MoreInfoResponseResafetyMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3MoreInfoResponseResafetyMigrationPlanRefs;
  readonly moreInfoApplication: Phase3MoreInfoKernelApplication;
  readonly responseRepositories: MoreInfoResponseResafetyRepositories;
  readonly safetyRepositories: AssimilationSafetyDependencies;

  private readonly idGenerator: BackboneIdGenerator;
  private readonly moreInfoService;
  private readonly responseService;
  private readonly assimilationSafety: AssimilationSafetyServices;
  private readonly accessGrants;
  private readonly leaseAuthority;
  private readonly localCounters = new Map<string, number>();
  private readonly beforeAssimilationCommitHook?: (input: {
    taskId: string;
    cycleId: string;
    recordedAt: string;
  }) => Promise<void>;

  constructor(options?: {
    moreInfoApplication?: Phase3MoreInfoKernelApplication;
    responseRepositories?: MoreInfoResponseResafetyRepositories;
    safetyRepositories?: AssimilationSafetyDependencies;
    identityRepositories?: IdentityAccessDependencies;
    idGenerator?: BackboneIdGenerator;
    beforeAssimilationCommitHook?: (input: {
      taskId: string;
      cycleId: string;
      recordedAt: string;
    }) => Promise<void>;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_more_info_response_resafety");
    this.moreInfoApplication =
      options?.moreInfoApplication ?? createPhase3MoreInfoKernelApplication();
    this.responseRepositories =
      options?.responseRepositories ?? createPhase3MoreInfoResponseResafetyStore();
    this.safetyRepositories = options?.safetyRepositories ?? createAssimilationSafetyStore();
    const identityRepositories =
      options?.identityRepositories ?? this.moreInfoApplication.identityRepositories;
    this.moreInfoService = createPhase3MoreInfoKernelService(this.moreInfoApplication.moreInfoRepositories, {
      idGenerator: this.idGenerator,
    });
    this.responseService = createPhase3MoreInfoResponseResafetyService(
      this.responseRepositories,
      { idGenerator: this.idGenerator },
    );
    this.assimilationSafety = createAssimilationSafetyServices(
      this.safetyRepositories,
      this.idGenerator,
    );
    this.accessGrants = createAccessGrantService(identityRepositories, this.idGenerator);
    this.leaseAuthority = createLeaseFenceCommandAuthorityService(
      this.moreInfoApplication.triageApplication.controlPlaneRepositories,
      this.idGenerator,
    );
    this.beforeAssimilationCommitHook = options?.beforeAssimilationCommitHook;
  }

  async evaluateReplyDisposition(
    input: EvaluateMoreInfoReplyDispositionInput,
  ): Promise<EvaluateMoreInfoReplyDispositionResult> {
    const existingByIdempotency = await this.responseRepositories.findDispositionByIdempotencyKey(
      input.idempotencyKey,
    );
    if (existingByIdempotency) {
      const replayBundle = await this.requireBundle(existingByIdempotency.cycleId);
      return {
        replayed: true,
        replayDisposition: "idempotent_replay",
        existingResult: await this.hydrateResultFromDisposition(existingByIdempotency),
        resolvedDisposition: {
          dispositionClass: existingByIdempotency.dispositionClass,
          accepted: existingByIdempotency.accepted,
          lateReview: existingByIdempotency.lateReview,
          reasonCodeRefs: existingByIdempotency.reasonCodeRefs,
        },
        cycle: replayBundle.cycle,
        checkpoint: replayBundle.checkpoint,
        requestLineageRef: existingByIdempotency.requestLineageRef,
        requestClosed: false,
      };
    }

    const existingByReplayKey = await this.responseRepositories.findDispositionByReplayKey(
      input.replayKey,
    );
    if (existingByReplayKey) {
      const replayBundle = await this.requireBundle(existingByReplayKey.cycleId);
      return {
        replayed: true,
        replayDisposition: "semantic_replay",
        existingResult: await this.hydrateResultFromDisposition(existingByReplayKey),
        resolvedDisposition: {
          dispositionClass: existingByReplayKey.dispositionClass,
          accepted: existingByReplayKey.accepted,
          lateReview: existingByReplayKey.lateReview,
          reasonCodeRefs: existingByReplayKey.reasonCodeRefs,
        },
        cycle: replayBundle.cycle,
        checkpoint: replayBundle.checkpoint,
        requestLineageRef: existingByReplayKey.requestLineageRef,
        requestClosed: false,
      };
    }

    const cycle = await this.requireCycle(input.cycleId);
    invariant(
      cycle.taskId === requireRef(input.taskId, "taskId"),
      "MORE_INFO_TASK_CYCLE_MISMATCH",
      "The requested task and more-info cycle do not belong together.",
    );
    const bundle = await this.requireBundle(cycle.cycleId);
    const request = await this.requireRequest(cycle.requestId);
    const currentCycle = await this.moreInfoApplication.moreInfoRepositories.findLiveCycleForLineage(
      cycle.requestLineageRef,
    );
    const requestClosed =
      input.requestClosedOverride ??
      (request.toSnapshot().workflowState === "closed" ||
        request.toSnapshot().workflowState === "outcome_recorded");

    const resolvedDisposition = resolveMoreInfoResponseDisposition({
      targetCycleId: cycle.cycleId,
      currentCycleId: currentCycle?.toSnapshot().cycleId ?? null,
      cycleState: cycle.state,
      checkpointState: bundle.checkpoint.replyWindowState,
      requestClosed,
      repairBlockReasonRefs: input.repairBlockReasonRefs,
      replayAlreadyAssimilated: false,
      policyAllowsLateReview: input.policyAllowsLateReview,
    });

    return {
      replayed: false,
      replayDisposition: "distinct",
      existingResult: null,
      resolvedDisposition,
      cycle,
      checkpoint: bundle.checkpoint,
      requestLineageRef: cycle.requestLineageRef,
      requestClosed,
    };
  }

  async receiveMoreInfoReply(input: ReceiveMoreInfoReplyInput): Promise<ReceiveMoreInfoReplyResult> {
    const receivedAt = ensureIsoTimestamp(input.receivedAt, "receivedAt");
    const cycle = await this.requireCycle(input.cycleId);
    const payloadHash = buildMoreInfoResponsePayloadHash({
      cycleId: input.cycleId,
      messageText: input.messageText ?? null,
      structuredFacts: input.structuredFacts ?? null,
      attachmentRefs: input.attachmentRefs ?? [],
      sourceArtifactRefs: input.sourceArtifactRefs ?? [],
      responseGrantRef: cycle.responseGrantRef,
    });
    const replayKey = buildMoreInfoResponseReplayKey({
      requestLineageRef: cycle.requestLineageRef,
      cycleId: cycle.cycleId,
      payloadHash,
    });
    const evaluated = await this.evaluateReplyDisposition({
      taskId: input.taskId,
      cycleId: input.cycleId,
      idempotencyKey: input.idempotencyKey,
      payloadHash,
      replayKey,
      receivedAt,
      repairBlockReasonRefs: input.repairBlockReasonRefs,
      policyAllowsLateReview: input.policyAllowsLateReview,
      requestClosedOverride: input.requestClosedOverride,
    });

    if (evaluated.replayed && evaluated.existingResult) {
      return evaluated.existingResult;
    }

    if (!evaluated.resolvedDisposition.accepted) {
      const disposition = await this.responseService.createDisposition({
        taskId: input.taskId,
        cycleId: input.cycleId,
        checkpointRef: evaluated.checkpoint.checkpointId,
        requestId: cycle.requestId,
        requestLineageRef: cycle.requestLineageRef,
        responseGrantRef: cycle.responseGrantRef,
        checkpointRevision: evaluated.checkpoint.checkpointRevision,
        ownershipEpoch: cycle.ownershipEpoch,
        currentLineageFenceEpoch: cycle.currentLineageFenceEpoch,
        idempotencyKey: input.idempotencyKey,
        replayKey,
        sourcePayloadHash: payloadHash,
        replayDisposition: evaluated.replayDisposition,
        dispositionClass: evaluated.resolvedDisposition.dispositionClass,
        reasonCodeRefs: evaluated.resolvedDisposition.reasonCodeRefs,
        blockedRecoveryRouteRef:
          evaluated.resolvedDisposition.dispositionClass === "blocked_repair"
            ? `/workspace/tasks/${input.taskId}/recover`
            : null,
        receivedAt,
      });
      return {
        replayed: false,
        disposition,
        responseAssimilation: null,
        evidenceAssimilation: null,
        materialDelta: null,
        classification: null,
        captureBundleRef: null,
        resultingSnapshotRef: null,
        preemption: null,
        safetyDecision: null,
        urgentDiversionSettlement: null,
        supervisorReviewRequirement: null,
        routingOutcome: null,
        taskTransitionRef: null,
        queueReturnTransitionRef: null,
      };
    }

    return this.assimilateAcceptedReply({
      ...input,
      payloadHash,
      replayKey,
      disposition: evaluated.resolvedDisposition,
    });
  }

  private async assimilateAcceptedReply(
    input: AssimilateAcceptedMoreInfoReplyInput,
  ): Promise<ReceiveMoreInfoReplyResult> {
    const cycle = await this.requireCycle(input.cycleId);
    const request = await this.requireRequest(cycle.requestId);
    const liveBeforeReceipt = await this.requireBundle(cycle.cycleId);

    const receipt = await this.moreInfoService.receivePatientResponse({
      cycleId: cycle.cycleId,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
      receivedAt: input.receivedAt,
      repairBlocked: false,
    });
    invariant(
      receipt.classification === "accepted_on_time" ||
        receipt.classification === "accepted_late_review",
      "MORE_INFO_ACCEPTED_RECEIPT_REQUIRED",
      "Accepted reply assimilation requires a live accepted receipt from the more-info kernel.",
    );

    await this.revokeGrantIfPresent(receipt.cycle, input.receivedAt, [
      "MORE_INFO_REPLY_ASSIMILATION_STARTED",
    ]);

    if (this.beforeAssimilationCommitHook) {
      await this.beforeAssimilationCommitHook({
        taskId: input.taskId,
        cycleId: input.cycleId,
        recordedAt: input.receivedAt,
      });
    }

    const currentLiveCycle = await this.moreInfoApplication.moreInfoRepositories.findLiveCycleForLineage(
      cycle.requestLineageRef,
    );
    invariant(
      currentLiveCycle?.toSnapshot().cycleId === cycle.cycleId ||
        currentLiveCycle === undefined,
      "MORE_INFO_REPLY_CURRENT_CYCLE_DRIFT",
      "Accepted reply assimilation must fail closed if the active cycle drifted before commit.",
    );
    const currentBundle = await this.requireBundle(cycle.cycleId);
    invariant(
      currentBundle.cycle.state === "response_received",
      "MORE_INFO_REPLY_NOT_READY_FOR_ASSIMILATION",
      "Accepted reply assimilation requires the more-info cycle to be in response_received state.",
    );

    const capture = await this.buildCaptureBundle({
      cycle: currentBundle.cycle,
      receivedAt: input.receivedAt,
      messageText: input.messageText ?? null,
      structuredFacts: input.structuredFacts ?? {},
      payloadHash: input.payloadHash,
      sourceArtifactRefs: input.sourceArtifactRefs ?? [],
      attachmentRefs: input.attachmentRefs ?? [],
      degradedParsing: Boolean(input.degradedParsing),
    });

    const settlement = await this.assimilationSafety.coordinator.assimilateEvidence({
      episodeId: request.toSnapshot().episodeId,
      requestId: request.requestId,
      sourceDomain: "patient_reply",
      governingObjectRef: cycle.cycleId,
      ingressEvidenceRefs: [
        capture.captureBundle.captureBundleId,
        ...capture.captureBundle.toSnapshot().sourceArtifactRefs,
        ...capture.captureBundle.toSnapshot().attachmentArtifactRefs,
      ],
      replayClassHint: undefined,
      decidedAt: input.receivedAt,
      priorCompositeSnapshotRef: request.toSnapshot().currentEvidenceSnapshotRef,
      currentSafetyDecisionEpoch: request.toSnapshot().safetyDecisionEpoch,
      currentPendingPreemptionRef: null,
      currentPendingSafetyEpoch: null,
      candidateSnapshotIntent: {
        evidenceSnapshotId: capture.evidenceSnapshotId,
        captureBundleRef: capture.captureBundle.captureBundleId,
        authoritativeNormalizedDerivationPackageRef:
          capture.normalizedDerivationPackageRef,
        authoritativeDerivedFactsPackageRef: capture.derivedFactsPackageRef,
        currentSummaryParityRecordRef: capture.summaryParityRecordRef,
        createdAt: input.receivedAt,
      },
      materialDelta: this.buildMaterialityInput(input),
      classification: this.buildClassificationInput(input, capture.evidenceItems),
      safetyEvaluation: this.buildSafetyEvaluationInput(input),
    });

    const updatedRequest = applyAssimilationSafetyToRequest(request, settlement);
    await this.moreInfoApplication.triageApplication.controlPlaneRepositories.saveRequest(
      updatedRequest,
      { expectedVersion: request.version },
    );

    const routineGuardFailure = this.tryAssertRoutineContinuation(settlement);

    const churnGuard = evaluateMoreInfoResponseChurnGuard({
      priorResponseAssimilations:
        await this.responseRepositories.listResponseAssimilationRecordsByRequest(
          currentBundle.cycle.requestId,
        ),
      clinicianResolutionEventAt: input.clinicianResolutionEventAt ?? null,
      currentRecordedAt: input.receivedAt,
      currentRequestedSafetyState:
        settlement.safetyDecision?.requestedSafetyState ??
        (settlement.materialDelta.triggerDecision === "no_re_safety" ? "screen_clear" : null),
    });

    let supervisorReviewRequirement: MoreInfoSupervisorReviewRequirementSnapshot | null = null;
    let responseAssimilation: ResponseAssimilationRecordSnapshot | null = null;
    let routingOutcome: ResponseAssimilationRoutingOutcome =
      routineGuardFailure !== null ? "manual_review_blocked" : "review_resumed_then_queued";
    let taskTransitionRef: string | null = null;
    let queueReturnTransitionRef: string | null = null;

    const releasedMoreInfo = await this.releaseMoreInfoCycle(
      cycle,
      input.actorRef,
      input.receivedAt,
    );
    await this.synchronizeTaskLineageFence(
      input.taskId,
      releasedMoreInfo.cycle.currentLineageFenceEpoch,
      input.receivedAt,
    );

    if (
      settlement.safetyDecision &&
      settlement.safetyDecision.requestedSafetyState === "urgent_diversion_required"
    ) {
      const urgent = await this.transitionAwaitingPatientInfoTask({
        taskId: input.taskId,
        nextStatus: "escalated",
        actorRef: input.actorRef,
        recordedAt: input.receivedAt,
        currentDecisionEpochRef: this.decisionEpochRef(
          currentBundle.cycle.requestId,
          settlement.safetyDecision.resultingSafetyEpoch,
        ),
        escalationContractRef: this.escalationContractRef(input.idempotencyKey),
      });
      routingOutcome = "urgent_return";
      taskTransitionRef = urgent.transitionJournalEntry?.transitionJournalEntryId ?? null;
    } else if (routineGuardFailure !== null) {
      routingOutcome = "manual_review_blocked";
    } else if (churnGuard.requiresSupervisorReview) {
      routingOutcome = "supervisor_review_required";
    } else {
      const resumed = await this.transitionAwaitingPatientInfoTask({
        taskId: input.taskId,
        nextStatus: "review_resumed",
        actorRef: input.actorRef,
        recordedAt: input.receivedAt,
      });
      taskTransitionRef = resumed.transitionJournalEntry?.transitionJournalEntryId ?? null;
      routingOutcome = input.autoReturnToQueue === false ? "review_resumed_only" : "review_resumed_then_queued";
      if (input.autoReturnToQueue !== false) {
        const queued = await this.transitionAwaitingPatientInfoTask({
          taskId: input.taskId,
          nextStatus: "queued",
          actorRef: input.actorRef,
          recordedAt: input.receivedAt,
        });
        queueReturnTransitionRef = queued.transitionJournalEntry?.transitionJournalEntryId ?? null;
      }
    }

    const disposition = await this.responseService.createDisposition({
      taskId: input.taskId,
      cycleId: currentBundle.cycle.cycleId,
      checkpointRef: liveBeforeReceipt.checkpoint.checkpointId,
      requestId: currentBundle.cycle.requestId,
      requestLineageRef: currentBundle.cycle.requestLineageRef,
      responseGrantRef: currentBundle.cycle.responseGrantRef,
      checkpointRevision: liveBeforeReceipt.checkpoint.checkpointRevision,
      ownershipEpoch: currentBundle.cycle.ownershipEpoch,
      currentLineageFenceEpoch: liveBeforeReceipt.cycle.currentLineageFenceEpoch,
      idempotencyKey: input.idempotencyKey,
      replayKey: input.replayKey,
      sourcePayloadHash: input.payloadHash,
      dispositionClass: input.disposition.dispositionClass,
      reasonCodeRefs: input.disposition.reasonCodeRefs,
      resultingEvidenceAssimilationRef: settlement.assimilationRecord.evidenceAssimilationId,
      receivedAt: input.receivedAt,
    });

    responseAssimilation = await this.responseService.createResponseAssimilationRecord(
      this.buildResponseAssimilationInput({
        taskId: input.taskId,
        cycle: currentBundle.cycle,
        captureBundleRef: capture.captureBundle.captureBundleId,
        dispositionRef: disposition.dispositionId,
        settlement,
        recordedAt: input.receivedAt,
        routingOutcome,
      }),
    );

    if (routingOutcome === "supervisor_review_required") {
      supervisorReviewRequirement =
        await this.responseService.createSupervisorReviewRequirement({
          taskId: input.taskId,
          cycleId: currentBundle.cycle.cycleId,
          requestId: currentBundle.cycle.requestId,
          requestLineageRef: currentBundle.cycle.requestLineageRef,
          triggeringResponseAssimilationRef: responseAssimilation.responseAssimilationRecordId,
          windowStartAt: churnGuard.windowStartAt,
          windowEndsAt: churnGuard.windowEndsAt,
          reopenCountWithinWindow: churnGuard.reopenCountWithinWindow,
          suppressAutomaticRoutineQueue: churnGuard.suppressAutomaticRoutineQueue,
          reasonCodeRefs: churnGuard.reasonCodeRefs,
          createdAt: input.receivedAt,
        });
    }

    return {
      replayed: false,
      disposition,
      responseAssimilation,
      evidenceAssimilation: settlement.assimilationRecord,
      materialDelta: settlement.materialDelta,
      classification: settlement.classification,
      captureBundleRef: capture.captureBundle.captureBundleId,
      resultingSnapshotRef: settlement.resultingSnapshot?.evidenceSnapshotId ?? null,
      preemption: settlement.preemption,
      safetyDecision: settlement.safetyDecision,
      urgentDiversionSettlement: settlement.urgentDiversionSettlement,
      supervisorReviewRequirement,
      routingOutcome,
      taskTransitionRef,
      queueReturnTransitionRef,
    };
  }

  private async hydrateResultFromDisposition(
    disposition: MoreInfoResponseDispositionSnapshot,
  ): Promise<ReceiveMoreInfoReplyResult> {
    const responseAssimilation =
      (await this.responseRepositories.findAssimilationByDispositionRef(disposition.dispositionId)) ??
      (disposition.resultingResponseAssimilationRef
        ? await this.responseRepositories.getResponseAssimilationRecord(
            disposition.resultingResponseAssimilationRef,
          )
        : null);
    const evidenceAssimilation =
      responseAssimilation?.evidenceAssimilationRef
        ? await this.safetyRepositories.getEvidenceAssimilationRecord(
            responseAssimilation.evidenceAssimilationRef,
          )
        : disposition.resultingEvidenceAssimilationRef
          ? await this.safetyRepositories.getEvidenceAssimilationRecord(
              disposition.resultingEvidenceAssimilationRef,
            )
          : null;
    const materialDelta =
      evidenceAssimilation?.materialDeltaAssessmentRef
        ? await this.safetyRepositories.getMaterialDeltaAssessment(
            evidenceAssimilation.materialDeltaAssessmentRef,
          )
        : null;
    const classification =
      evidenceAssimilation?.classificationDecisionRef
        ? await this.safetyRepositories.getEvidenceClassificationDecision(
            evidenceAssimilation.classificationDecisionRef,
          )
        : null;
    const preemption =
      evidenceAssimilation?.resultingPreemptionRef
        ? await this.safetyRepositories.getSafetyPreemptionRecord(
            evidenceAssimilation.resultingPreemptionRef,
          )
        : null;
    const safetyDecision = responseAssimilation?.safetyDecisionRef
      ? await this.safetyRepositories.getSafetyDecisionRecord(responseAssimilation.safetyDecisionRef)
      : null;
    const urgentDiversionSettlement = responseAssimilation?.urgentDiversionSettlementRef
      ? await this.safetyRepositories.getUrgentDiversionSettlement(
          responseAssimilation.urgentDiversionSettlementRef,
        )
      : null;
    const supervisorReviewRequirement =
      responseAssimilation?.routingOutcome === "supervisor_review_required"
        ? (
            await this.responseRepositories.listSupervisorReviewRequirementsByTask(
              disposition.taskId,
            )
          ).at(-1) ?? null
        : null;

    return {
      replayed: true,
      disposition,
      responseAssimilation,
      evidenceAssimilation,
      materialDelta,
      classification,
      captureBundleRef: responseAssimilation?.evidenceCaptureBundleRef ?? null,
      resultingSnapshotRef: responseAssimilation?.evidenceSnapshotRef ?? null,
      preemption,
      safetyDecision,
      urgentDiversionSettlement,
      supervisorReviewRequirement,
      routingOutcome: responseAssimilation?.routingOutcome ?? null,
      taskTransitionRef: null,
      queueReturnTransitionRef: null,
    };
  }

  private async requireBundle(cycleId: string) {
    const cycle = await this.requireCycle(cycleId);
    const checkpoint =
      await this.moreInfoApplication.moreInfoRepositories.getReplyWindowCheckpoint(
        cycle.activeCheckpointRef,
      );
    const schedule =
      await this.moreInfoApplication.moreInfoRepositories.getReminderSchedule(
        cycle.reminderScheduleRef,
      );
    invariant(checkpoint && schedule, "MORE_INFO_BUNDLE_INCOMPLETE", "More-info bundle is incomplete.");
    return {
      cycle,
      checkpoint: checkpoint.toSnapshot(),
      schedule: schedule.toSnapshot(),
    };
  }

  private async requireCycle(cycleId: string) {
    const cycle = await this.moreInfoApplication.moreInfoRepositories.getCycle(cycleId);
    invariant(cycle, "MORE_INFO_CYCLE_NOT_FOUND", `MoreInfoCycle ${cycleId} was not found.`);
    return cycle.toSnapshot();
  }

  private async requireRequest(requestId: string) {
    const request =
      await this.moreInfoApplication.triageApplication.controlPlaneRepositories.getRequest(requestId);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${requestId} was not found.`);
    return request;
  }

  private buildMaterialityInput(input: ReceiveMoreInfoReplyInput): {
    materialityPolicyRef: string;
    explicitMaterialityClass: MaterialityClass;
    explicitDecisionBasis: MaterialDeltaDecisionBasis;
    changedEvidenceRefs: readonly string[];
    changedFeatureRefs: readonly string[];
    changedDependencyRefs: readonly string[];
    changedChronologyRefs: readonly string[];
    degradedFailClosed: boolean;
    reasonCodes: readonly string[];
  } {
    const changedFeatureRefs = uniqueSorted(input.changedFeatureRefs ?? []);
    const changedDependencyRefs = uniqueSorted([
      ...(input.changedDependencyRefs ?? []),
      input.contactSafetyDependencyFailure ? "active_reply_contact_dependency_failure" : "",
    ]);
    const changedChronologyRefs = uniqueSorted(input.changedChronologyRefs ?? []);
    const degradedFailClosed = Boolean(input.degradedParsing);

    let explicitMaterialityClass: MaterialityClass;
    if (degradedFailClosed) {
      explicitMaterialityClass = "unresolved";
    } else if (changedDependencyRefs.length > 0) {
      explicitMaterialityClass = "contact_safety_material";
    } else if (changedFeatureRefs.length > 0 || changedChronologyRefs.length > 0) {
      explicitMaterialityClass = "safety_material";
    } else if ((input.attachmentRefs?.length ?? 0) > 0) {
      explicitMaterialityClass = "operational_nonclinical";
    } else {
      explicitMaterialityClass =
        input.allowListTechnicalOnly || input.pureControlPlaneDelta
          ? "technical_only"
          : "safety_material";
    }

    let explicitDecisionBasis: MaterialDeltaDecisionBasis;
    if (degradedFailClosed) {
      explicitDecisionBasis = "degraded_fail_closed";
    } else if (changedDependencyRefs.length > 0) {
      explicitDecisionBasis = "dependency_delta";
    } else if (changedChronologyRefs.length > 0) {
      explicitDecisionBasis = "chronology_delta";
    } else if (changedFeatureRefs.includes("critical_contradiction")) {
      explicitDecisionBasis = "contradiction_delta";
    } else if (changedFeatureRefs.length > 0) {
      explicitDecisionBasis = "feature_delta";
    } else {
      explicitDecisionBasis = "no_semantic_delta";
    }

    return {
      materialityPolicyRef: "phase3-more-info-response-materiality-237.v1",
      explicitMaterialityClass,
      explicitDecisionBasis,
      changedEvidenceRefs: uniqueSorted([
        "raw_more_info_response",
        ...(input.sourceArtifactRefs ?? []),
        ...(input.attachmentRefs ?? []),
      ]),
      changedFeatureRefs,
      changedDependencyRefs,
      changedChronologyRefs,
      degradedFailClosed,
      reasonCodes: uniqueSorted([
        degradedFailClosed ? "more_info_parser_degraded_fail_closed" : "",
        changedDependencyRefs.length > 0 ? "more_info_contact_safety_material" : "",
        changedFeatureRefs.length > 0 || changedChronologyRefs.length > 0
          ? "more_info_material_change_detected"
          : "",
      ]),
    };
  }

  private buildClassificationInput(
    input: ReceiveMoreInfoReplyInput,
    evidenceItems: readonly EvidenceBatchItem[],
  ): ClassificationInput {
    const defaultClass: EvidenceClass =
      input.allowListTechnicalOnly || input.pureControlPlaneDelta
        ? "technical_metadata"
        : input.contactSafetyDependencyFailure
          ? "contact_safety_relevant"
          : "potentially_clinical";

    return {
      evidenceItems:
        evidenceItems.length > 0
          ? evidenceItems.map((item) => ({
              ...item,
              suggestedClass: defaultClass,
              confidence: input.degradedParsing ? 0.25 : 0.9,
              allowListRef:
                defaultClass === "technical_metadata"
                  ? "phase3-more-info-technical-allow-list-237.v1"
                  : null,
              dependencyRef:
                defaultClass === "contact_safety_relevant"
                  ? "active_reply_contact_dependency_failure"
                  : null,
            }))
          : [
              {
                evidenceRef: "raw_more_info_response",
                suggestedClass: defaultClass,
                confidence: input.degradedParsing ? 0.25 : 0.9,
                allowListRef:
                  defaultClass === "technical_metadata"
                    ? "phase3-more-info-technical-allow-list-237.v1"
                    : null,
                dependencyRef:
                  defaultClass === "contact_safety_relevant"
                    ? "active_reply_contact_dependency_failure"
                    : null,
              },
            ],
      classifierVersionRef: "phase3-more-info-classifier-237.v1",
      explicitDominantEvidenceClass: defaultClass,
      explicitMisclassificationRiskState: input.degradedParsing
        ? "fail_closed_review"
        : undefined,
      confidenceBand: input.degradedParsing ? "low" : undefined,
      activeDependencyRefs: uniqueSorted([
        ...(input.activeReachabilityDependencyRefs ?? []),
        input.contactSafetyDependencyFailure ? "active_reply_contact_dependency_failure" : "",
      ]),
      triggerReasonCodes: uniqueSorted([
        defaultClass === "potentially_clinical"
          ? "phase3_more_info_default_potentially_clinical"
          : "",
        defaultClass === "contact_safety_relevant"
          ? "phase3_more_info_contact_safety_dependency"
          : "",
        input.allowListTechnicalOnly || input.pureControlPlaneDelta
          ? "phase3_more_info_technical_allow_list"
          : "",
        input.degradedParsing ? "phase3_more_info_classifier_fail_closed" : "",
      ]),
    };
  }

  private buildSafetyEvaluationInput(input: ReceiveMoreInfoReplyInput): SafetyEvaluationInput {
    const changedFeatureRefs = new Set(uniqueSorted(input.changedFeatureRefs ?? []));
    return {
      requestTypeRef: "Symptoms",
      featureStates: {
        urgent_red_flag: changedFeatureRefs.has("urgent_red_flag") ? "present" : "absent",
        respiratory_distress: changedFeatureRefs.has("respiratory_distress")
          ? "present"
          : "absent",
        severe_bleeding: changedFeatureRefs.has("severe_bleeding") ? "present" : "absent",
        urgent_contact_failure: input.contactSafetyDependencyFailure ? "present" : "absent",
        callback_unreachable: input.contactSafetyDependencyFailure ? "present" : "absent",
        critical_contradiction: changedFeatureRefs.has("critical_contradiction")
          ? "present"
          : input.degradedParsing
            ? "unresolved"
            : "absent",
        new_clinical_detail: changedFeatureRefs.size > 0 ? "present" : "absent",
        symptom_worsened: changedFeatureRefs.has("symptom_worsened") ? "present" : "absent",
        backdated_event: uniqueSorted(input.changedChronologyRefs ?? []).includes("backdated_event")
          ? "present"
          : "absent",
        timing_conflict: uniqueSorted(input.changedChronologyRefs ?? []).includes("timing_conflict")
          ? "present"
          : "absent",
        consent_withdrawn: "absent",
        weak_pharmacy_match: "absent",
      },
      blockingActionScopeRefs: uniqueSorted([
        ...(input.blockingActionScopeRefs ?? []),
        "close_request",
        "handoff_finalise",
      ]),
      activeReachabilityDependencyRefs: uniqueSorted([
        ...(input.activeReachabilityDependencyRefs ?? []),
        input.contactSafetyDependencyFailure ? "active_reply_contact_dependency_failure" : "",
      ]),
      reasonCode: "more_info_reply_resafety",
      priorityHint:
        input.priorityHint ??
        (changedFeatureRefs.has("urgent_red_flag") || changedFeatureRefs.has("respiratory_distress")
          ? "urgent_review"
          : "routine_review"),
      urgentDiversionIntent: {
        actionMode: input.urgentDiversionActionMode ?? "urgent_guidance_presented",
        settlementState: "issued",
        issuedAt: input.receivedAt,
        settledAt: input.receivedAt,
        presentationArtifactRef: this.presentationArtifactRef("urgent", input.cycleId),
        authoritativeActionRef: this.authoritativeActionRef(input.cycleId),
      },
    };
  }

  private async buildCaptureBundle(input: {
    cycle: { cycleId: string; requestLineageRef: string };
    receivedAt: string;
    messageText: string | null;
    structuredFacts: Readonly<Record<string, unknown>>;
    payloadHash: string;
    sourceArtifactRefs: readonly string[];
    attachmentRefs: readonly string[];
    degradedParsing: boolean;
  }): Promise<{
    captureBundle: EvidenceCaptureBundleDocument;
    evidenceSnapshotId: string;
    normalizedDerivationPackageRef: string;
    derivedFactsPackageRef: string | null;
    summaryParityRecordRef: string;
    evidenceItems: readonly EvidenceBatchItem[];
  }> {
    const rawArtifactId = nextLocalId(input.cycle.cycleId, this.localCounters, "raw_reply_source");
    await this.assimilationSafety.evidenceBackbone.artifacts.registerSourceArtifact({
      artifactId: rawArtifactId,
      locator: `object://phase3-more-info/raw/${rawArtifactId}.json`,
      checksum: `sha256_${input.payloadHash.slice(0, 20)}`,
      mediaType: "application/json",
      byteLength: stableStringify({
        messageText: input.messageText,
        structuredFacts: input.structuredFacts,
      }).length,
      createdAt: input.receivedAt,
    });

    for (const artifactRef of input.sourceArtifactRefs) {
      await this.assimilationSafety.evidenceBackbone.artifacts.registerSourceArtifact({
        artifactId: artifactRef,
        locator: `object://phase3-more-info/source/${artifactRef}`,
        checksum: `sha256_${sha256Hex(artifactRef).slice(0, 20)}`,
        mediaType: mediaTypeForArtifactRef(artifactRef),
        byteLength: artifactRef.length * 4,
        createdAt: input.receivedAt,
      });
    }

    for (const attachmentRef of input.attachmentRefs) {
      await this.assimilationSafety.evidenceBackbone.artifacts.registerSourceArtifact({
        artifactId: attachmentRef,
        locator: `object://phase3-more-info/attachment/${attachmentRef}`,
        checksum: `sha256_${sha256Hex(attachmentRef).slice(0, 20)}`,
        mediaType: mediaTypeForArtifactRef(attachmentRef),
        byteLength: attachmentRef.length * 6,
        createdAt: input.receivedAt,
      });
    }

    const captureBundle = await this.assimilationSafety.evidenceBackbone.captureBundles.freezeCaptureBundle({
      captureBundleId: nextLocalId(input.cycle.cycleId, this.localCounters, "capture_bundle"),
      evidenceLineageRef: input.cycle.requestLineageRef,
      sourceChannel: "patient_more_info_reply",
      replayClass: "distinct",
      transportCorrelationRef: `reply_transport_${input.cycle.cycleId}`,
      capturePolicyVersion: "phase3-more-info-capture-237.v1",
      sourceHash: input.payloadHash,
      semanticHash: sha256Hex({
        cycleId: input.cycle.cycleId,
        messageText: input.messageText,
        structuredFacts: input.structuredFacts,
      }),
      sourceArtifactRefs: uniqueSorted([rawArtifactId, ...input.sourceArtifactRefs]),
      attachmentArtifactRefs: uniqueSorted(input.attachmentRefs),
      metadataArtifactRefs: [],
      createdAt: input.receivedAt,
    });

    const normalizedArtifactId = nextLocalId(
      input.cycle.cycleId,
      this.localCounters,
      "normalized_reply",
    );
    await this.assimilationSafety.evidenceBackbone.artifacts.registerDerivedArtifact({
      artifactId: normalizedArtifactId,
      locator: `object://phase3-more-info/derived/${normalizedArtifactId}.json`,
      checksum: `sha256_${sha256Hex({
        messageText: input.messageText,
        structuredFacts: input.structuredFacts,
      }).slice(0, 20)}`,
      mediaType: "application/json",
      byteLength: stableStringify(input.structuredFacts).length + (input.messageText?.length ?? 0),
      createdAt: input.receivedAt,
    });
    const normalizedDerivation = await this.assimilationSafety.evidenceBackbone.derivations.createDerivationPackage({
      derivationPackageId: nextLocalId(
        input.cycle.cycleId,
        this.localCounters,
        "normalized_derivation",
      ),
      captureBundleRef: captureBundle.captureBundleId,
      derivationClass: "canonical_normalization",
      derivationVersion: "phase3-more-info-normalization-237.v1",
      policyVersionRef: "phase3-more-info-normalization-policy-237.v1",
      derivedArtifactRef: normalizedArtifactId,
      createdAt: input.receivedAt,
    });

    const factsArtifactId = nextLocalId(input.cycle.cycleId, this.localCounters, "facts_reply");
    await this.assimilationSafety.evidenceBackbone.artifacts.registerDerivedArtifact({
      artifactId: factsArtifactId,
      locator: `object://phase3-more-info/derived/${factsArtifactId}.json`,
      checksum: `sha256_${sha256Hex(input.structuredFacts).slice(0, 20)}`,
      mediaType: "application/json",
      byteLength: stableStringify(input.structuredFacts).length,
      createdAt: input.receivedAt,
    });
    const derivedFacts = await this.assimilationSafety.evidenceBackbone.derivations.createDerivationPackage({
      derivationPackageId: nextLocalId(
        input.cycle.cycleId,
        this.localCounters,
        "facts_derivation",
      ),
      captureBundleRef: captureBundle.captureBundleId,
      derivationClass: "structured_fact_extraction",
      derivationVersion: "phase3-more-info-facts-237.v1",
      policyVersionRef: "phase3-more-info-facts-policy-237.v1",
      derivedArtifactRef: factsArtifactId,
      createdAt: input.receivedAt,
    });

    const summaryArtifactId = nextLocalId(input.cycle.cycleId, this.localCounters, "summary_reply");
    await this.assimilationSafety.evidenceBackbone.artifacts.registerDerivedArtifact({
      artifactId: summaryArtifactId,
      locator: `object://phase3-more-info/derived/${summaryArtifactId}.txt`,
      checksum: `sha256_${sha256Hex({
        messageText: input.messageText,
        degraded: input.degradedParsing,
      }).slice(0, 20)}`,
      mediaType: "text/plain",
      byteLength:
        (input.messageText?.length ?? 0) +
        (input.degradedParsing ? 20 : 12) +
        Object.keys(input.structuredFacts).length * 8,
      createdAt: input.receivedAt,
    });
    const summaryDerivation = await this.assimilationSafety.evidenceBackbone.derivations.createDerivationPackage({
      derivationPackageId: nextLocalId(
        input.cycle.cycleId,
        this.localCounters,
        "summary_derivation",
      ),
      captureBundleRef: captureBundle.captureBundleId,
      derivationClass: "staff_review_summary",
      derivationVersion: "phase3-more-info-summary-237.v1",
      policyVersionRef: "phase3-more-info-summary-policy-237.v1",
      derivedArtifactRef: summaryArtifactId,
      createdAt: input.receivedAt,
    });
    const parity = await this.assimilationSafety.evidenceBackbone.summaryParity.createSummaryParityRecord({
      parityRecordId: nextLocalId(input.cycle.cycleId, this.localCounters, "summary_parity"),
      captureBundleRef: captureBundle.captureBundleId,
      normalizedDerivationPackageRef: normalizedDerivation.derivationPackageId,
      authoritativeDerivedFactsPackageRef: derivedFacts.derivationPackageId,
      summaryDerivationPackageRef: summaryDerivation.derivationPackageId,
      summaryKind: "staff_review_summary",
      parityPolicyVersion: "phase3-more-info-summary-parity-237.v1",
      blockingReasonRefs: input.degradedParsing ? ["parser_degraded_fail_closed"] : [],
      createdAt: input.receivedAt,
    });

    const evidenceItems: EvidenceBatchItem[] = uniqueSorted([
      rawArtifactId,
      ...input.sourceArtifactRefs,
      ...input.attachmentRefs,
    ]).map((evidenceRef) => ({
      evidenceRef,
      suggestedClass: "potentially_clinical",
      confidence: input.degradedParsing ? 0.25 : 0.85,
      allowListRef: null,
      dependencyRef: null,
    }));

    return {
      captureBundle,
      evidenceSnapshotId: nextLocalId(input.cycle.cycleId, this.localCounters, "evidence_snapshot"),
      normalizedDerivationPackageRef: normalizedDerivation.derivationPackageId,
      derivedFactsPackageRef: derivedFacts.derivationPackageId,
      summaryParityRecordRef: parity.parityRecordId,
      evidenceItems,
    };
  }

  private buildResponseAssimilationInput(input: {
    taskId: string;
    cycle: { cycleId: string; requestId: string; requestLineageRef: string };
    captureBundleRef: string;
    dispositionRef: string;
    settlement: {
      assimilationRecord: EvidenceAssimilationRecordSnapshot;
      materialDelta: MaterialDeltaAssessmentSnapshot;
      classification: EvidenceClassificationDecisionSnapshot;
      resultingSnapshot: EvidenceSnapshotDocument | null;
      preemption: SafetyPreemptionRecordSnapshot | null;
      safetyDecision: SafetyDecisionRecordSnapshot | null;
      urgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null;
      incremental: { impactedRuleRefs: readonly string[]; conflictVectorRef: string | null } | null;
    };
    routingOutcome: ResponseAssimilationRoutingOutcome;
    recordedAt: string;
  }): CreateResponseAssimilationRecordInput {
    return {
      dispositionRef: input.dispositionRef,
      taskId: input.taskId,
      cycleId: input.cycle.cycleId,
      requestId: input.cycle.requestId,
      requestLineageRef: input.cycle.requestLineageRef,
      evidenceCaptureBundleRef: input.captureBundleRef,
      evidenceSnapshotRef: input.settlement.resultingSnapshot?.evidenceSnapshotId ?? null,
      evidenceAssimilationRef: input.settlement.assimilationRecord.evidenceAssimilationId,
      materialDeltaAssessmentRef: input.settlement.materialDelta.materialDeltaAssessmentId,
      classificationDecisionRef: input.settlement.classification.classificationDecisionId,
      safetyPreemptionRef: input.settlement.preemption?.preemptionId ?? null,
      safetyDecisionRef: input.settlement.safetyDecision?.safetyDecisionId ?? null,
      urgentDiversionSettlementRef:
        input.settlement.urgentDiversionSettlement?.urgentDiversionSettlementId ?? null,
      deltaFeatureRefs: uniqueSorted([
        ...input.settlement.materialDelta.changedFeatureRefs,
        ...input.settlement.materialDelta.changedDependencyRefs,
        ...input.settlement.materialDelta.changedChronologyRefs,
      ]),
      impactedRuleRefs: uniqueSorted(input.settlement.incremental?.impactedRuleRefs ?? []),
      conflictVectorRef: input.settlement.incremental?.conflictVectorRef ?? null,
      requestedSafetyState: input.settlement.safetyDecision?.requestedSafetyState ?? null,
      safetyDecisionOutcome: input.settlement.safetyDecision?.decisionOutcome ?? null,
      resultingSafetyDecisionEpoch:
        input.settlement.safetyDecision?.resultingSafetyEpoch ??
        input.settlement.assimilationRecord.resultingSafetyEpoch,
      routingOutcome: input.routingOutcome,
      recordedAt: input.recordedAt,
    };
  }

  private tryAssertRoutineContinuation(settlement: {
    assimilationRecord: EvidenceAssimilationRecordSnapshot;
    preemption: SafetyPreemptionRecordSnapshot | null;
    safetyDecision: SafetyDecisionRecordSnapshot | null;
    urgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null;
  }): string | null {
    try {
      assertRoutineContinuationAllowed({
        latestAssimilation: settlement.assimilationRecord,
        latestPreemption: settlement.preemption,
        latestSafetyDecision: settlement.safetyDecision,
        latestUrgentDiversionSettlement: settlement.urgentDiversionSettlement,
        expectedSafetyEpoch: settlement.safetyDecision?.resultingSafetyEpoch ?? undefined,
      });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "routine_continuation_blocked";
    }
  }

  private async releaseMoreInfoCycle(
    cycle: {
      cycleId: string;
      requestId: string;
      lifecycleLeaseRef: string;
      ownershipEpoch: number;
      fencingToken: string;
      currentLineageFenceEpoch: number;
    },
    actorRef: string,
    recordedAt: string,
  ) {
    const released = await this.leaseAuthority.releaseLease({
      domain: MORE_INFO_DOMAIN,
      domainObjectRef: cycle.cycleId,
      leaseId: cycle.lifecycleLeaseRef,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      releasedAt: recordedAt,
      sameShellRecoveryRouteRef: `/workspace/tasks/${cycle.requestId}/recover`,
      operatorVisibleWorkRef: `more_info_${cycle.cycleId}`,
      blockedActionScopeRefs: ["respond_more_info"],
      closeBlockReason: "reply_assimilation_settled",
      detectedByRef: actorRef,
    });
    return this.moreInfoService.resumeReview({
      cycleId: cycle.cycleId,
      presentedOwnershipEpoch: cycle.ownershipEpoch,
      presentedFencingToken: cycle.fencingToken,
      presentedLineageFenceEpoch: cycle.currentLineageFenceEpoch,
      nextLineageFenceEpoch: released.lineageFence.currentEpoch,
      recordedAt,
    });
  }

  private async synchronizeTaskLineageFence(
    taskId: string,
    nextLineageFenceEpoch: number,
    recordedAt: string,
  ): Promise<void> {
    const task =
      await this.moreInfoApplication.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `Triage task ${taskId} was not found.`);
    if (task.toSnapshot().currentLineageFenceEpoch >= nextLineageFenceEpoch) {
      return;
    }
    const updatedTask = task.update({
      currentLineageFenceEpoch: nextLineageFenceEpoch,
      updatedAt: recordedAt,
    });
    await this.moreInfoApplication.triageApplication.triageRepositories.saveTask(updatedTask, {
      expectedVersion: task.version,
    });
  }

  private async transitionAwaitingPatientInfoTask(input: {
    taskId: string;
    nextStatus: "queued" | "review_resumed" | "escalated";
    actorRef: string;
    recordedAt: string;
    currentDecisionEpochRef?: string;
    escalationContractRef?: string;
  }) {
    const triageApplication = this.moreInfoApplication.triageApplication;
    const task = await triageApplication.triageRepositories.getTask(input.taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `Triage task ${input.taskId} was not found.`);
    const taskSnapshot = task.toSnapshot();
    const command = this.buildSyntheticTaskCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: this.taskActionScopeForStatus(input.nextStatus),
    });
    return triageApplication.triageService.transitionTask({
      taskId: input.taskId,
      nextStatus: input.nextStatus,
      presentedOwnershipEpoch: taskSnapshot.ownershipEpoch,
      presentedFencingToken: taskSnapshot.fencingToken,
      presentedLineageFenceEpoch: taskSnapshot.currentLineageFenceEpoch,
      currentDecisionEpochRef: input.currentDecisionEpochRef,
      escalationContractRef: input.escalationContractRef,
      command,
    });
  }

  private buildSyntheticTaskCommand(input: {
    task: { toSnapshot(): { taskId: string } };
    actorRef: string;
    recordedAt: string;
    actionScope: string;
  }) {
    const snapshot = input.task.toSnapshot();
    const suffix = `${snapshot.taskId}_${input.actionScope}_${input.recordedAt}`;
    return this.asTaskCommandContext({
      actorRef: input.actorRef,
      routeIntentTupleHash: `synthetic_route_tuple_${suffix}`,
      routeIntentBindingRef: `synthetic_route_binding_${suffix}`,
      commandActionRecordRef: `synthetic_action_${suffix}`,
      commandSettlementRecordRef: `synthetic_settlement_${suffix}`,
      transitionEnvelopeRef: `synthetic_transition_envelope_${suffix}`,
      releaseRecoveryDispositionRef: `synthetic_recovery_${suffix}`,
      causalToken: `synthetic_cause_${suffix}`,
      recordedAt: input.recordedAt,
      recoveryRouteRef: `/workspace/tasks/${snapshot.taskId}/recover`,
    });
  }

  private asTaskCommandContext(witness: Phase3CommandWitness) {
    return {
      actorRef: witness.actorRef,
      routeIntentTupleHash: witness.routeIntentTupleHash,
      routeIntentBindingRef: witness.routeIntentBindingRef,
      commandActionRecordRef: witness.commandActionRecordRef,
      commandSettlementRecordRef: witness.commandSettlementRecordRef,
      transitionEnvelopeRef: witness.transitionEnvelopeRef,
      releaseRecoveryDispositionRef: witness.releaseRecoveryDispositionRef,
      causalToken: witness.causalToken,
      recordedAt: witness.recordedAt,
      recoveryRouteRef: witness.recoveryRouteRef ?? null,
    };
  }

  private taskActionScopeForStatus(status: "queued" | "review_resumed" | "escalated"): string {
    switch (status) {
      case "queued":
        return "move_to_queue";
      case "review_resumed":
        return "resume_review";
      case "escalated":
      default:
        return "escalate";
    }
  }

  private async revokeGrantIfPresent(
    cycle: { responseGrantRef: string | null; cycleId: string; currentLineageFenceEpoch: number },
    recordedAt: string,
    reasonCodes: readonly string[],
  ): Promise<void> {
    const responseGrantRef = optionalRef(cycle.responseGrantRef);
    if (!responseGrantRef) {
      return;
    }
    await this.accessGrants.revokeGrant({
      grantRef: responseGrantRef,
      governingObjectRef: cycle.cycleId,
      lineageFenceEpoch: cycle.currentLineageFenceEpoch,
      causeClass: "manual_revoke",
      reasonCodes,
      recordedAt,
    });
  }

  private decisionEpochRef(requestId: string, epoch: number): string {
    return `decision_epoch_${requestId}_${epoch}`;
  }

  private escalationContractRef(dispositionId: string): string {
    return `more_info_reply_escalation_${dispositionId}`;
  }

  private presentationArtifactRef(kind: string, cycleId: string): string {
    return `presentation_${kind}_${cycleId}`;
  }

  private authoritativeActionRef(cycleId: string): string {
    return `authoritative_urgent_action_${cycleId}`;
  }
}

export function createPhase3MoreInfoResponseResafetyApplication(options?: {
  moreInfoApplication?: Phase3MoreInfoKernelApplication;
  responseRepositories?: MoreInfoResponseResafetyRepositories;
  safetyRepositories?: AssimilationSafetyDependencies;
  identityRepositories?: IdentityAccessDependencies;
  idGenerator?: BackboneIdGenerator;
  beforeAssimilationCommitHook?: (input: {
    taskId: string;
    cycleId: string;
    recordedAt: string;
  }) => Promise<void>;
}): Phase3MoreInfoResponseResafetyApplication {
  return new Phase3MoreInfoResponseResafetyApplicationImpl(options);
}
