import {
  QueueRankPlanDocument,
  createDeterministicQueueRankingIdGenerator,
  createQueueRankingAuthorityService,
  createQueueRankingStore,
  queueDefaultPlan,
  type QueueAssignmentSuggestionSnapshotDocument,
  type QueueOverloadState,
  type QueueRankEntryDocument,
  type QueueRankingDependencies,
  type QueueRankingFactCut,
  type QueueRankSnapshotDocument,
  type QueueRankTaskFact,
  type QueueReviewerFact,
} from "@vecells/api-contracts";
import {
  type WorkspaceMutationAuthorityState,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  createPhase3TriageKernelApplication,
  phase3TriageKernelMigrationPlanRefs,
  phase3TriageKernelPersistenceTables,
  type Phase3KernelClaimTaskInput,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export const PHASE3_QUEUE_ENGINE_SERVICE_NAME = "Phase3QueueEngineService";
export const PHASE3_QUEUE_ENGINE_SCHEMA_VERSION = "233.phase3.queue-engine.v1";
export const PHASE3_QUEUE_ENGINE_FIXTURE_QUEUE_KEY = "repair";
export const PHASE3_QUEUE_QUERY_SURFACES = [
  "GET /v1/workspace/queues/{queueKey}",
  "GET /internal/v1/workspace/queues/{queueKey}/assignment-suggestions",
  "POST /internal/v1/workspace/queues/{queueKey}/refresh",
  "POST /v1/workspace/queues/{queueKey}/tasks/{taskId}/soft-claim",
] as const;

export const queueRankingRoutes = [
  {
    routeId: "workspace_queue_current",
    method: "GET",
    path: "/v1/workspace/queues/{queueKey}",
    contractFamily: "QueueRankSnapshotContract",
    purpose:
      "Return the latest committed QueueRankSnapshot plus QueueRankEntry rows for one workspace queue key without recomputing rank client-side.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_queue_assignment_suggestions_current",
    method: "GET",
    path: "/internal/v1/workspace/queues/{queueKey}/assignment-suggestions",
    contractFamily: "QueueAssignmentSuggestionSnapshotContract",
    purpose:
      "Return the latest QueueAssignmentSuggestionSnapshot downstream of the current committed queue rank snapshot.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_queue_refresh_current",
    method: "POST",
    path: "/internal/v1/workspace/queues/{queueKey}/refresh",
    contractFamily: "QueueRankRefreshCommandContract",
    purpose:
      "Refresh one deterministic QueueRankSnapshot from one governed fact cut and publish replayable row order plus overload posture.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_queue_soft_claim",
    method: "POST",
    path: "/v1/workspace/queues/{queueKey}/tasks/{taskId}/soft-claim",
    contractFamily: "QueueSoftClaimContract",
    purpose:
      "Acquire a fenced soft-claim into the Phase 3 triage kernel using the presented queue snapshot ref and current task lease tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const queueRankingPersistenceTables = [
  ...new Set([
    "queue_rank_plans",
    "queue_rank_snapshots",
    "queue_rank_entries",
    "queue_assignment_suggestion_snapshots",
    ...phase3TriageKernelPersistenceTables,
  ]),
] as const;

export const queueRankingMigrationPlanRefs = [
  "services/command-api/migrations/073_queue_rank_models.sql",
  ...phase3TriageKernelMigrationPlanRefs,
] as const;

export const phase3QueueScenarioIds = [
  "exact_formula_sort_precedence",
  "fairness_band_rotation",
  "overload_critical_posture",
  "reviewer_suggestion_downstream_only",
  "soft_claim_race_serialized",
] as const;

type Phase3QueueScenarioId = (typeof phase3QueueScenarioIds)[number];

export interface QueueViewResult {
  plan: typeof queueDefaultPlan;
  snapshot: ReturnType<QueueRankSnapshotDocument["toSnapshot"]>;
  entries: readonly ReturnType<QueueRankEntryDocument["toSnapshot"]>[];
  suggestion: ReturnType<QueueAssignmentSuggestionSnapshotDocument["toSnapshot"]> | null;
}

export interface RefreshQueueSnapshotInput {
  queueKey: string;
  asOfAt: string;
  generatedAt: string;
  sourceFactCutRef: string;
  trustInputRefs: readonly string[];
  taskFacts: readonly QueueRankTaskFact[];
  telemetry?: QueueRankingFactCut["telemetry"];
  reviewers?: readonly QueueReviewerFact[];
  reviewerScopeRef?: string;
  seedTriageTasks?: boolean;
}

export interface RefreshQueueSnapshotResult extends QueueViewResult {
  suggestion: ReturnType<QueueAssignmentSuggestionSnapshotDocument["toSnapshot"]> | null;
}

export interface SoftClaimQueueTaskInput {
  queueKey: string;
  taskId: string;
  rankSnapshotRef: string;
  actorRef: string;
  claimedAt: string;
  ownerSessionRef?: string | null;
  leaseTtlSeconds?: number;
  mutationAuthorityState?: WorkspaceMutationAuthorityState;
}

export interface QueueRankingScenarioResult {
  scenarioId: Phase3QueueScenarioId;
  title: string;
  rankSnapshotId: string;
  rowOrderHash: string;
  orderedTaskRefs: readonly string[];
  heldTaskRefs: readonly string[];
  overloadState: QueueOverloadState;
  suggestionSnapshotId: string | null;
  governedAutoClaimRefs: readonly string[];
  softClaimOutcome: "not_attempted" | "claimed" | "blocked_race";
}

interface QueueScenarioDefinition {
  scenarioId: Phase3QueueScenarioId;
  title: string;
  generatedAt: string;
  asOfAt: string;
  telemetry?: QueueRankingFactCut["telemetry"];
  taskFacts: readonly QueueRankTaskFact[];
  reviewers?: readonly QueueReviewerFact[];
  reviewerScopeRef?: string;
  softClaimRaceTaskRef?: string;
}

function baseTask(input: {
  taskRef: string;
  queueEnteredAt: string;
  slaTargetAt: string;
  expectedHandleMinutes: number;
  clinicalPriorityBand: number;
  residualRisk: number;
  contactRisk: number;
  fairnessBandRef: string;
  duplicateReviewFlag?: boolean;
  escalated?: boolean;
  returned?: boolean;
  lastMaterialReturnAt?: string;
  evidenceDeltaSeverity?: number;
  urgencyCarry?: number;
  vulnerability?: number;
  coverageFit?: number;
  assimilationPending?: boolean;
  preemptionPending?: boolean;
  trustState?: "trusted" | "stale" | "quarantined";
  missingTrustInputRefs?: readonly string[];
  scopeExcluded?: boolean;
  archetypeRef?: string;
}): QueueRankTaskFact {
  return {
    taskRef: input.taskRef,
    queueEnteredAt: input.queueEnteredAt,
    slaTargetAt: input.slaTargetAt,
    expectedHandleMinutes: input.expectedHandleMinutes,
    clinicalPriorityBand: input.clinicalPriorityBand,
    residualRisk: input.residualRisk,
    contactRisk: input.contactRisk,
    assimilationPending: input.assimilationPending ?? false,
    preemptionPending: input.preemptionPending ?? false,
    escalated: input.escalated ?? false,
    returned: input.returned ?? false,
    lastMaterialReturnAt: input.lastMaterialReturnAt ?? null,
    evidenceDeltaSeverity: input.evidenceDeltaSeverity ?? 0,
    urgencyCarry: input.urgencyCarry ?? 0,
    vulnerability: input.vulnerability ?? 0,
    coverageFit: input.coverageFit ?? 0.82,
    duplicateReviewFlag: input.duplicateReviewFlag ?? false,
    fairnessBandRef: input.fairnessBandRef,
    trustState: input.trustState ?? "trusted",
    missingTrustInputRefs: input.missingTrustInputRefs ?? [],
    scopeExcluded: input.scopeExcluded ?? false,
    archetypeRef: input.archetypeRef ?? "general_review",
  };
}

const queueScenarioDefinitions: readonly QueueScenarioDefinition[] = [
  {
    scenarioId: "exact_formula_sort_precedence",
    title: "Exact lexicographic order wins before within-tier urgency",
    asOfAt: "2026-04-16T10:00:00Z",
    generatedAt: "2026-04-16T10:00:05Z",
    telemetry: {
      criticalArrivalRatePerHour: 0.42,
      empiricalServiceRatePerHour: 1.3,
      activeReviewerCount: 4,
    },
    taskFacts: [
      baseTask({
        taskRef: "task_queue_escalated",
        queueEnteredAt: "2026-04-16T08:15:00Z",
        slaTargetAt: "2026-04-16T11:05:00Z",
        expectedHandleMinutes: 18,
        clinicalPriorityBand: 5,
        residualRisk: 0.91,
        contactRisk: 0.26,
        fairnessBandRef: "band_routine",
        escalated: true,
        urgencyCarry: 0.44,
      }),
      baseTask({
        taskRef: "task_queue_duplicate",
        queueEnteredAt: "2026-04-16T07:55:00Z",
        slaTargetAt: "2026-04-16T10:55:00Z",
        expectedHandleMinutes: 11,
        clinicalPriorityBand: 4,
        residualRisk: 0.62,
        contactRisk: 0.28,
        fairnessBandRef: "band_returned_review",
        returned: true,
        lastMaterialReturnAt: "2026-04-16T09:25:00Z",
        evidenceDeltaSeverity: 0.74,
        duplicateReviewFlag: true,
      }),
      baseTask({
        taskRef: "task_queue_risk_attention",
        queueEnteredAt: "2026-04-16T07:35:00Z",
        slaTargetAt: "2026-04-16T12:20:00Z",
        expectedHandleMinutes: 14,
        clinicalPriorityBand: 3,
        residualRisk: 0.58,
        contactRisk: 0.51,
        fairnessBandRef: "band_risk_attention",
      }),
      baseTask({
        taskRef: "task_queue_low_intensity",
        queueEnteredAt: "2026-04-16T07:20:00Z",
        slaTargetAt: "2026-04-16T13:15:00Z",
        expectedHandleMinutes: 9,
        clinicalPriorityBand: 2,
        residualRisk: 0.14,
        contactRisk: 0.08,
        fairnessBandRef: "band_low_intensity",
      }),
    ],
  },
  {
    scenarioId: "fairness_band_rotation",
    title: "Non-critical bands rotate through deterministic fairness credits",
    asOfAt: "2026-04-16T10:10:00Z",
    generatedAt: "2026-04-16T10:10:05Z",
    telemetry: {
      criticalArrivalRatePerHour: 0.35,
      empiricalServiceRatePerHour: 1.45,
      activeReviewerCount: 5,
    },
    taskFacts: [
      baseTask({
        taskRef: "task_fair_return",
        queueEnteredAt: "2026-04-16T07:40:00Z",
        slaTargetAt: "2026-04-16T13:00:00Z",
        expectedHandleMinutes: 10,
        clinicalPriorityBand: 3,
        residualRisk: 0.38,
        contactRisk: 0.21,
        fairnessBandRef: "band_returned_review",
        returned: true,
        lastMaterialReturnAt: "2026-04-16T09:30:00Z",
        evidenceDeltaSeverity: 0.62,
      }),
      baseTask({
        taskRef: "task_fair_risk",
        queueEnteredAt: "2026-04-16T07:30:00Z",
        slaTargetAt: "2026-04-16T13:15:00Z",
        expectedHandleMinutes: 13,
        clinicalPriorityBand: 3,
        residualRisk: 0.55,
        contactRisk: 0.52,
        fairnessBandRef: "band_risk_attention",
      }),
      baseTask({
        taskRef: "task_fair_routine",
        queueEnteredAt: "2026-04-16T07:20:00Z",
        slaTargetAt: "2026-04-16T13:30:00Z",
        expectedHandleMinutes: 16,
        clinicalPriorityBand: 3,
        residualRisk: 0.21,
        contactRisk: 0.14,
        fairnessBandRef: "band_routine",
      }),
      baseTask({
        taskRef: "task_fair_low",
        queueEnteredAt: "2026-04-16T07:10:00Z",
        slaTargetAt: "2026-04-16T14:00:00Z",
        expectedHandleMinutes: 8,
        clinicalPriorityBand: 2,
        residualRisk: 0.12,
        contactRisk: 0.09,
        fairnessBandRef: "band_low_intensity",
      }),
    ],
  },
  {
    scenarioId: "overload_critical_posture",
    title: "Critical overload suppresses routine fairness promises",
    asOfAt: "2026-04-16T10:20:00Z",
    generatedAt: "2026-04-16T10:20:05Z",
    telemetry: {
      criticalArrivalRatePerHour: 2.4,
      empiricalServiceRatePerHour: 0.35,
      activeReviewerCount: 1,
    },
    taskFacts: [
      baseTask({
        taskRef: "task_overload_escalated",
        queueEnteredAt: "2026-04-16T08:50:00Z",
        slaTargetAt: "2026-04-16T10:35:00Z",
        expectedHandleMinutes: 22,
        clinicalPriorityBand: 5,
        residualRisk: 0.89,
        contactRisk: 0.42,
        fairnessBandRef: "band_routine",
        escalated: true,
      }),
      baseTask({
        taskRef: "task_overload_returned",
        queueEnteredAt: "2026-04-16T08:35:00Z",
        slaTargetAt: "2026-04-16T10:55:00Z",
        expectedHandleMinutes: 14,
        clinicalPriorityBand: 4,
        residualRisk: 0.61,
        contactRisk: 0.33,
        fairnessBandRef: "band_returned_review",
        returned: true,
        lastMaterialReturnAt: "2026-04-16T09:50:00Z",
        evidenceDeltaSeverity: 0.66,
      }),
      baseTask({
        taskRef: "task_overload_routine",
        queueEnteredAt: "2026-04-16T08:10:00Z",
        slaTargetAt: "2026-04-16T12:15:00Z",
        expectedHandleMinutes: 12,
        clinicalPriorityBand: 3,
        residualRisk: 0.22,
        contactRisk: 0.16,
        fairnessBandRef: "band_routine",
      }),
    ],
  },
  {
    scenarioId: "reviewer_suggestion_downstream_only",
    title: "Reviewer-fit suggestions stay downstream of canonical order",
    asOfAt: "2026-04-16T10:30:00Z",
    generatedAt: "2026-04-16T10:30:05Z",
    telemetry: {
      criticalArrivalRatePerHour: 0.45,
      empiricalServiceRatePerHour: 1.25,
      activeReviewerCount: 4,
    },
    taskFacts: [
      baseTask({
        taskRef: "task_suggest_escalated",
        queueEnteredAt: "2026-04-16T08:05:00Z",
        slaTargetAt: "2026-04-16T10:50:00Z",
        expectedHandleMinutes: 18,
        clinicalPriorityBand: 5,
        residualRisk: 0.88,
        contactRisk: 0.26,
        fairnessBandRef: "band_routine",
        escalated: true,
      }),
      baseTask({
        taskRef: "task_suggest_returned",
        queueEnteredAt: "2026-04-16T08:15:00Z",
        slaTargetAt: "2026-04-16T11:05:00Z",
        expectedHandleMinutes: 12,
        clinicalPriorityBand: 4,
        residualRisk: 0.57,
        contactRisk: 0.2,
        fairnessBandRef: "band_returned_review",
        returned: true,
        lastMaterialReturnAt: "2026-04-16T10:00:00Z",
        evidenceDeltaSeverity: 0.58,
      }),
      baseTask({
        taskRef: "task_suggest_routine",
        queueEnteredAt: "2026-04-16T07:40:00Z",
        slaTargetAt: "2026-04-16T12:05:00Z",
        expectedHandleMinutes: 15,
        clinicalPriorityBand: 3,
        residualRisk: 0.24,
        contactRisk: 0.14,
        fairnessBandRef: "band_routine",
      }),
    ],
    reviewerScopeRef: "reviewer_scope_phase3_queue",
    reviewers: [
      {
        reviewerRef: "reviewer_ava",
        freeCapacity: 2,
        loadHeadroom: 0.86,
        eligibleTaskRefs: [
          "task_suggest_escalated",
          "task_suggest_returned",
          "task_suggest_routine",
        ],
        skillScores: {
          task_suggest_escalated: 0.95,
          task_suggest_returned: 0.52,
          task_suggest_routine: 0.44,
        },
        continuityScores: {
          task_suggest_returned: 0.74,
        },
        sameContextTaskRefs: ["task_suggest_returned"],
        contextSwitchCosts: {
          task_suggest_escalated: 0.12,
        },
        focusPenaltyByTaskRef: {},
      },
      {
        reviewerRef: "reviewer_bea",
        freeCapacity: 2,
        loadHeadroom: 0.68,
        eligibleTaskRefs: [
          "task_suggest_escalated",
          "task_suggest_returned",
          "task_suggest_routine",
        ],
        skillScores: {
          task_suggest_escalated: 0.61,
          task_suggest_returned: 0.9,
          task_suggest_routine: 0.84,
        },
        continuityScores: {
          task_suggest_routine: 0.43,
        },
        sameContextTaskRefs: ["task_suggest_routine"],
        contextSwitchCosts: {
          task_suggest_returned: 0.04,
        },
        focusPenaltyByTaskRef: {
          task_suggest_escalated: 0.12,
        },
      },
    ],
  },
  {
    scenarioId: "soft_claim_race_serialized",
    title: "Queue-originated soft claim reuses the Phase 3 lease fence",
    asOfAt: "2026-04-16T10:40:00Z",
    generatedAt: "2026-04-16T10:40:05Z",
    telemetry: {
      criticalArrivalRatePerHour: 0.4,
      empiricalServiceRatePerHour: 1.2,
      activeReviewerCount: 3,
    },
    taskFacts: [
      baseTask({
        taskRef: "task_claim_race_target",
        queueEnteredAt: "2026-04-16T08:00:00Z",
        slaTargetAt: "2026-04-16T10:58:00Z",
        expectedHandleMinutes: 17,
        clinicalPriorityBand: 5,
        residualRisk: 0.85,
        contactRisk: 0.24,
        fairnessBandRef: "band_routine",
        escalated: true,
      }),
      baseTask({
        taskRef: "task_claim_race_followup",
        queueEnteredAt: "2026-04-16T07:50:00Z",
        slaTargetAt: "2026-04-16T11:20:00Z",
        expectedHandleMinutes: 12,
        clinicalPriorityBand: 4,
        residualRisk: 0.52,
        contactRisk: 0.18,
        fairnessBandRef: "band_returned_review",
        returned: true,
        lastMaterialReturnAt: "2026-04-16T09:58:00Z",
        evidenceDeltaSeverity: 0.57,
      }),
    ],
    softClaimRaceTaskRef: "task_claim_race_target",
  },
] as const;

class Phase3QueueEngineApplicationImpl {
  readonly repositories: QueueRankingDependencies;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly authority;
  readonly defaultPlan = queueDefaultPlan;
  readonly serviceName = PHASE3_QUEUE_ENGINE_SERVICE_NAME;
  readonly schemaVersion = PHASE3_QUEUE_ENGINE_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_QUEUE_QUERY_SURFACES;
  readonly routes = queueRankingRoutes;
  readonly migrationPlanRef = queueRankingMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = queueRankingMigrationPlanRefs;
  readonly persistenceTables = queueRankingPersistenceTables;

  constructor(options?: {
    repositories?: QueueRankingDependencies;
    triageApplication?: Phase3TriageKernelApplication;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.repositories = options?.repositories ?? createQueueRankingStore();
    const queueIdGenerator = createDeterministicQueueRankingIdGenerator(
      "command_api_phase3_queue_engine",
    );
    this.authority = createQueueRankingAuthorityService(this.repositories, queueIdGenerator);
    this.triageApplication =
      options?.triageApplication ??
      createPhase3TriageKernelApplication({
        idGenerator:
          options?.idGenerator ??
          createDeterministicBackboneIdGenerator("command_api_phase3_queue_engine"),
      });
  }

  async refreshQueueSnapshot(input: RefreshQueueSnapshotInput): Promise<RefreshQueueSnapshotResult> {
    await this.ensurePlan();
    if (input.seedTriageTasks !== false) {
      for (const taskFact of input.taskFacts) {
        await this.ensureQueuedTriageTask(input.queueKey, taskFact);
      }
    }

    const ranking = await this.authority.materializeRankSnapshot(
      this.defaultPlan.queueRankPlanId,
      {
        queueRef: input.queueKey,
        queueFamilyRef: this.defaultPlan.queueFamilyRef,
        sourceFactCutRef: input.sourceFactCutRef,
        asOfAt: input.asOfAt,
        generatedAt: input.generatedAt,
        trustInputRefs: [...input.trustInputRefs],
        taskFacts: input.taskFacts,
        telemetry: input.telemetry,
      },
    );

    let suggestion: ReturnType<QueueAssignmentSuggestionSnapshotDocument["toSnapshot"]> | null =
      null;
    if (input.reviewers && input.reviewerScopeRef) {
      const derived = await this.authority.deriveAssignmentSuggestionSnapshot({
        rankSnapshotRef: ranking.snapshot.toSnapshot().rankSnapshotId,
        reviewerScopeRef: input.reviewerScopeRef,
        generatedAt: input.generatedAt,
        reviewers: input.reviewers,
      });
      suggestion = derived.snapshot.toSnapshot();
    }

    return {
      plan: this.defaultPlan,
      snapshot: ranking.snapshot.toSnapshot(),
      entries: ranking.entries.map((entry) => entry.toSnapshot()),
      suggestion,
    };
  }

  async queryQueue(queueKey: string): Promise<QueueViewResult | null> {
    const snapshot = await this.repositories.getLatestQueueRankSnapshotByQueue(queueKey);
    if (!snapshot) {
      return null;
    }
    const entries = await this.repositories.listQueueRankEntries(snapshot.toSnapshot().rankSnapshotId);
    const suggestion = await this.repositories.getLatestQueueAssignmentSuggestionByRankSnapshotRef(
      snapshot.toSnapshot().rankSnapshotId,
    );
    return {
      plan: this.defaultPlan,
      snapshot: snapshot.toSnapshot(),
      entries: entries.map((entry) => entry.toSnapshot()),
      suggestion: suggestion?.toSnapshot() ?? null,
    };
  }

  async softClaimTask(input: SoftClaimQueueTaskInput) {
    const view = await this.queryQueue(input.queueKey);
    invariant(view, `Queue ${input.queueKey} has no committed snapshot.`);
    invariant(
      view.snapshot.rankSnapshotId === input.rankSnapshotRef,
      `Queue ${input.queueKey} requires the latest committed rank snapshot for soft claim.`,
    );
    invariant(
      (input.mutationAuthorityState ?? "live") === "live",
      `Queue ${input.queueKey} is not currently writable for soft claim.`,
    );

    const row = view.entries.find((entry) => entry.taskRef === input.taskId);
    invariant(row, `Task ${input.taskId} is not present in queue ${input.queueKey}.`);
    invariant(row.eligibilityState === "eligible", `Task ${input.taskId} is not queue-claimable.`);

    const claimInput: Phase3KernelClaimTaskInput = {
      taskId: input.taskId,
      actorRef: input.actorRef,
      claimedAt: input.claimedAt,
      ownerSessionRef: input.ownerSessionRef ?? null,
      leaseTtlSeconds: input.leaseTtlSeconds,
    };
    return this.triageApplication.claimTask(claimInput);
  }

  async runScenarioById(scenarioId: Phase3QueueScenarioId): Promise<QueueRankingScenarioResult> {
    const scenario = queueScenarioDefinitions.find((candidate) => candidate.scenarioId === scenarioId);
    invariant(scenario, `Unknown queue scenario ${scenarioId}.`);
    const application = createQueueRankingApplication({
      repositories: createQueueRankingStore(),
      triageApplication: createPhase3TriageKernelApplication({
        idGenerator: createDeterministicBackboneIdGenerator(`phase3_queue_${scenarioId}`),
      }),
      idGenerator: createDeterministicBackboneIdGenerator(`phase3_queue_${scenarioId}`),
    });

    const refreshed = await application.refreshQueueSnapshot({
      queueKey: PHASE3_QUEUE_ENGINE_FIXTURE_QUEUE_KEY,
      asOfAt: scenario.asOfAt,
      generatedAt: scenario.generatedAt,
      sourceFactCutRef: `fact_cut_${scenario.scenarioId}`,
      trustInputRefs: ["trust_slice_queue", "trust_slice_reachability", "trust_slice_workspace"],
      taskFacts: scenario.taskFacts,
      telemetry: scenario.telemetry,
      reviewers: scenario.reviewers,
      reviewerScopeRef: scenario.reviewerScopeRef,
    });

    let softClaimOutcome: QueueRankingScenarioResult["softClaimOutcome"] = "not_attempted";
    if (scenario.softClaimRaceTaskRef) {
      await Promise.allSettled([
        application.softClaimTask({
          queueKey: PHASE3_QUEUE_ENGINE_FIXTURE_QUEUE_KEY,
          taskId: scenario.softClaimRaceTaskRef,
          rankSnapshotRef: refreshed.snapshot.rankSnapshotId,
          actorRef: "reviewer_one",
          claimedAt: "2026-04-16T10:40:08Z",
        }),
        application.softClaimTask({
          queueKey: PHASE3_QUEUE_ENGINE_FIXTURE_QUEUE_KEY,
          taskId: scenario.softClaimRaceTaskRef,
          rankSnapshotRef: refreshed.snapshot.rankSnapshotId,
          actorRef: "reviewer_two",
          claimedAt: "2026-04-16T10:40:08Z",
        }),
      ]).then((results) => {
        const fulfilledCount = results.filter((result) => result.status === "fulfilled").length;
        softClaimOutcome = fulfilledCount === 1 ? "blocked_race" : "claimed";
      });
    }

    return {
      scenarioId: scenario.scenarioId,
      title: scenario.title,
      rankSnapshotId: refreshed.snapshot.rankSnapshotId,
      rowOrderHash: refreshed.snapshot.rowOrderHash,
      orderedTaskRefs: refreshed.entries.map((entry) => entry.taskRef),
      heldTaskRefs: refreshed.entries
        .filter((entry) => entry.eligibilityState !== "eligible")
        .map((entry) => entry.taskRef),
      overloadState: refreshed.snapshot.overloadState,
      suggestionSnapshotId: refreshed.suggestion?.suggestionSnapshotId ?? null,
      governedAutoClaimRefs: refreshed.suggestion?.governedAutoClaimRefs ?? [],
      softClaimOutcome,
    };
  }

  async runAllScenarios(): Promise<readonly QueueRankingScenarioResult[]> {
    const results: QueueRankingScenarioResult[] = [];
    for (const scenarioId of phase3QueueScenarioIds) {
      results.push(await this.runScenarioById(scenarioId));
    }
    return results;
  }

  private async ensurePlan(): Promise<void> {
    const existing = await this.repositories.getQueueRankPlan(this.defaultPlan.queueRankPlanId);
    if (!existing) {
      await this.repositories.saveQueueRankPlan(QueueRankPlanDocument.fromSnapshot(this.defaultPlan));
    }
  }

  private async ensureQueuedTriageTask(
    queueKey: string,
    taskFact: QueueRankTaskFact,
  ): Promise<void> {
    const existing = await this.triageApplication.triageRepositories.getTask(taskFact.taskRef);
    if (!existing) {
      await this.triageApplication.createTask({
        taskId: taskFact.taskRef,
        requestId: `request_${taskFact.taskRef}`,
        queueKey,
        sourceQueueRankSnapshotRef: `queue_rank_snapshot_seed_${queueKey}`,
        returnAnchorRef: `queue_row_${taskFact.taskRef}`,
        returnAnchorTupleHash: `return_anchor_hash_${taskFact.taskRef}`,
        selectedAnchorRef: `selected_anchor_${taskFact.taskRef}`,
        selectedAnchorTupleHash: `selected_anchor_hash_${taskFact.taskRef}`,
        workspaceTrustEnvelopeRef: `workspace_trust_envelope_${taskFact.taskRef}`,
        surfaceRouteContractRef: "route_contract_workspace_task_v1",
        surfacePublicationRef: "surface_publication_workspace_task_v1",
        runtimePublicationBundleRef: "runtime_publication_workspace_task_v1",
        taskCompletionSettlementEnvelopeRef: `task_completion_envelope_${taskFact.taskRef}`,
        createdAt: taskFact.queueEnteredAt,
        episodeId: `episode_${taskFact.taskRef}`,
        requestLineageRef: `lineage_${taskFact.taskRef}`,
      });
    }
    const current = await this.triageApplication.triageRepositories.getTask(taskFact.taskRef);
    if (!current) {
      return;
    }
    if (current.toSnapshot().status === "triage_ready") {
      await this.triageApplication.moveTaskToQueue({
        taskId: taskFact.taskRef,
        actorRef: "queue_engine_seed",
        queuedAt: taskFact.queueEnteredAt,
      });
    }
  }
}

export interface QueueRankingApplication {
  readonly repositories: QueueRankingDependencies;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly authority: ReturnType<typeof createQueueRankingAuthorityService>;
  readonly defaultPlan: typeof queueDefaultPlan;
  readonly querySurfaces: typeof PHASE3_QUEUE_QUERY_SURFACES;
  readonly routes: typeof queueRankingRoutes;
  readonly serviceName: typeof PHASE3_QUEUE_ENGINE_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_QUEUE_ENGINE_SCHEMA_VERSION;
  readonly migrationPlanRef: (typeof queueRankingMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof queueRankingMigrationPlanRefs;
  readonly persistenceTables: typeof queueRankingPersistenceTables;
  readonly simulation: {
    runScenarioById(scenarioId: Phase3QueueScenarioId): Promise<QueueRankingScenarioResult>;
    runAllScenarios(): Promise<readonly QueueRankingScenarioResult[]>;
  };
  refreshQueueSnapshot(input: RefreshQueueSnapshotInput): Promise<RefreshQueueSnapshotResult>;
  queryQueue(queueKey: string): Promise<QueueViewResult | null>;
  softClaimTask(input: SoftClaimQueueTaskInput): Promise<unknown>;
  runScenarioById(scenarioId: Phase3QueueScenarioId): Promise<QueueRankingScenarioResult>;
  runAllScenarios(): Promise<readonly QueueRankingScenarioResult[]>;
}

export function createQueueRankingApplication(options?: {
  repositories?: QueueRankingDependencies;
  triageApplication?: Phase3TriageKernelApplication;
  idGenerator?: BackboneIdGenerator;
}): QueueRankingApplication {
  const application = new Phase3QueueEngineApplicationImpl(options);
  return {
    repositories: application.repositories,
    triageApplication: application.triageApplication,
    authority: application.authority,
    defaultPlan: application.defaultPlan,
    querySurfaces: application.querySurfaces,
    routes: application.routes,
    serviceName: application.serviceName,
    schemaVersion: application.schemaVersion,
    migrationPlanRef: application.migrationPlanRef,
    migrationPlanRefs: application.migrationPlanRefs,
    persistenceTables: application.persistenceTables,
    simulation: {
      runScenarioById: application.runScenarioById.bind(application),
      runAllScenarios: application.runAllScenarios.bind(application),
    },
    refreshQueueSnapshot: application.refreshQueueSnapshot.bind(application),
    queryQueue: application.queryQueue.bind(application),
    softClaimTask: application.softClaimTask.bind(application),
    runScenarioById: application.runScenarioById.bind(application),
    runAllScenarios: application.runAllScenarios.bind(application),
  };
}
