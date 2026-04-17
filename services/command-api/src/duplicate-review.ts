import {
  EpisodeAggregate,
  createDuplicateEvidenceSimulationHarness,
  createDuplicateReviewAuthorityService,
  createPhase3DuplicateReviewAuthorityService,
  createPhase3DuplicateReviewStore,
  duplicateResolutionParallelInterfaceGaps,
  type DuplicateConsequenceInvalidationRecordDocument,
  type DuplicateDecisionClass,
  type DuplicateReviewMode,
  type DuplicateReviewPhase3Dependencies,
  type DuplicateReviewSnapshotDocument,
  type ResolveDuplicateReviewInput,
} from "@vecells/domain-identity-access";
import {
  RequestAggregate,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  createPhase3TriageKernelApplication,
  phase3TriageKernelMigrationPlanRefs,
  phase3TriageKernelPersistenceTables,
  type CreatePhase3KernelTaskInput,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export const PHASE3_DUPLICATE_REVIEW_SERVICE_NAME = "Phase3DuplicateReviewService";
export const PHASE3_DUPLICATE_REVIEW_SCHEMA_VERSION = "234.phase3.duplicate-review.v1";
export const PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID = "phase3_duplicate_review_task_234_primary";
export const PHASE3_DUPLICATE_REVIEW_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/duplicate-review",
  "POST /internal/v1/workspace/tasks/{taskId}/duplicate-review/resolve",
] as const;

export const duplicateReviewRoutes = [
  {
    routeId: "workspace_task_duplicate_review_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/duplicate-review",
    contractFamily: "DuplicateReviewSnapshotContract",
    purpose:
      "Return the current task-scoped DuplicateReviewSnapshot derived from canonical DuplicateCluster, DuplicatePairEvidence, and DuplicateResolutionDecision authority.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_duplicate_review_resolve",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/duplicate-review/resolve",
    contractFamily: "DuplicateResolutionDecisionCommandContract",
    purpose:
      "Resolve duplicate review only from the latest DuplicateReviewSnapshot, canonical DuplicatePairEvidence, and append-only DuplicateResolutionDecision authority.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const duplicateReviewPersistenceTables = [
  ...new Set([
    "episodes",
    "requests",
    "duplicate_pair_evidences",
    "duplicate_clusters",
    "duplicate_resolution_decisions",
    "duplicate_review_snapshots",
    "duplicate_consequence_invalidation_records",
    ...phase3TriageKernelPersistenceTables,
  ]),
] as const;

export const duplicateReviewMigrationPlanRefs = [
  "services/command-api/migrations/062_submission_and_lineage_backbone.sql",
  "services/command-api/migrations/070_duplicate_cluster_and_pair_evidence.sql",
  ...phase3TriageKernelMigrationPlanRefs,
  "services/command-api/migrations/111_phase3_duplicate_review_projection_and_invalidation.sql",
] as const;

export const phase3DuplicateReviewScenarioIds = [
  "review_required_snapshot",
  "same_request_attach_with_witness",
  "reversal_invalidates_downstream",
  "retry_authority_boundary",
] as const;

type Phase3DuplicateReviewScenarioId = (typeof phase3DuplicateReviewScenarioIds)[number];

export interface QueryTaskDuplicateReviewResult {
  taskId: string;
  snapshot: ReturnType<DuplicateReviewSnapshotDocument["toSnapshot"]>;
  invalidations: readonly ReturnType<
    DuplicateConsequenceInvalidationRecordDocument["toSnapshot"]
  >[];
}

export interface ResolveTaskDuplicateReviewCommand {
  duplicateReviewSnapshotRef: string;
  decisionClass: DuplicateDecisionClass;
  winningPairEvidenceRef: string;
  continuityWitnessClass?: ResolveDuplicateReviewInput["continuityWitnessClass"];
  continuityWitnessRef?: string | null;
  reviewMode: DuplicateReviewMode;
  reasonCodes: readonly string[];
  decidedByRef: string;
  decidedAt: string;
  targetRequestRef?: string | null;
  targetEpisodeRef?: string | null;
}

export interface ResolveTaskDuplicateReviewResult extends QueryTaskDuplicateReviewResult {
  decision: ReturnType<
    Awaited<ReturnType<ReturnType<typeof createPhase3DuplicateReviewAuthorityService>["resolveDuplicateReview"]>>["decision"]["toSnapshot"]
  >;
  supersededDecisionRef: string | null;
}

export interface DuplicateReviewScenarioResult {
  scenarioId: Phase3DuplicateReviewScenarioId;
  taskId: string;
  snapshotId: string;
  decisionClass: DuplicateDecisionClass;
  invalidationTargetTypes: readonly string[];
}

export interface DuplicateReviewApplication {
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly repositories: DuplicateReviewPhase3Dependencies;
  readonly authority: ReturnType<typeof createDuplicateReviewAuthorityService>;
  readonly phase3Authority: ReturnType<typeof createPhase3DuplicateReviewAuthorityService>;
  readonly simulation: ReturnType<typeof createDuplicateEvidenceSimulationHarness>;
  readonly migrationPlanRef: (typeof duplicateReviewMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof duplicateReviewMigrationPlanRefs;
  readonly querySurfaces: typeof PHASE3_DUPLICATE_REVIEW_QUERY_SURFACES;
  readonly schemaVersion: typeof PHASE3_DUPLICATE_REVIEW_SCHEMA_VERSION;
  readonly serviceName: typeof PHASE3_DUPLICATE_REVIEW_SERVICE_NAME;
  readonly parallelInterfaceGaps: typeof duplicateResolutionParallelInterfaceGaps;
  queryTaskDuplicateReview(taskId: string): Promise<QueryTaskDuplicateReviewResult>;
  resolveTaskDuplicateReview(
    taskId: string,
    command: ResolveTaskDuplicateReviewCommand,
  ): Promise<ResolveTaskDuplicateReviewResult>;
  runScenarioById(scenarioId: Phase3DuplicateReviewScenarioId): Promise<DuplicateReviewScenarioResult>;
  runAllScenarios(): Promise<readonly DuplicateReviewScenarioResult[]>;
}

async function seedTaskFixture(application: DuplicateReviewApplicationImpl): Promise<void> {
  await application.seedTaskFixture();
}

class DuplicateReviewApplicationImpl implements DuplicateReviewApplication {
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly repositories: DuplicateReviewPhase3Dependencies;
  readonly authority: ReturnType<typeof createDuplicateReviewAuthorityService>;
  readonly phase3Authority: ReturnType<typeof createPhase3DuplicateReviewAuthorityService>;
  readonly simulation: ReturnType<typeof createDuplicateEvidenceSimulationHarness>;
  readonly migrationPlanRef =
    "services/command-api/migrations/111_phase3_duplicate_review_projection_and_invalidation.sql" as const;
  readonly migrationPlanRefs = duplicateReviewMigrationPlanRefs;
  readonly querySurfaces = PHASE3_DUPLICATE_REVIEW_QUERY_SURFACES;
  readonly schemaVersion = PHASE3_DUPLICATE_REVIEW_SCHEMA_VERSION;
  readonly serviceName = PHASE3_DUPLICATE_REVIEW_SERVICE_NAME;
  readonly parallelInterfaceGaps = duplicateResolutionParallelInterfaceGaps;

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    repositories?: DuplicateReviewPhase3Dependencies;
    idGenerator?: BackboneIdGenerator;
  }) {
    const idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_duplicate_review_234");
    this.triageApplication = options?.triageApplication ?? createPhase3TriageKernelApplication({ idGenerator });
    this.repositories = options?.repositories ?? createPhase3DuplicateReviewStore();
    this.authority = createDuplicateReviewAuthorityService(this.repositories, idGenerator);
    this.phase3Authority = createPhase3DuplicateReviewAuthorityService(this.repositories, idGenerator);
    this.simulation = createDuplicateEvidenceSimulationHarness(this.authority, this.repositories);
  }

  async queryTaskDuplicateReview(taskId: string): Promise<QueryTaskDuplicateReviewResult> {
    await seedTaskFixture(this);
    const task = await this.requireTask(taskId);
    const taskSnapshot = task.toSnapshot();
    invariant(taskSnapshot.duplicateClusterRef, `TriageTask ${taskId} does not declare duplicate review work.`);

    const snapshot = await this.phase3Authority.publishDuplicateReviewSnapshot({
      taskId,
      duplicateClusterRef: taskSnapshot.duplicateClusterRef,
      renderedAt: "2026-04-16T11:04:00.000Z",
    });
    await this.persistTaskDuplicateRefs(taskId, {
      duplicateReviewSnapshotRef: snapshot.duplicateReviewSnapshotId,
      duplicateResolutionDecisionRef: snapshot.toSnapshot().currentResolutionDecisionRef,
      reviewFreshnessState:
        snapshot.toSnapshot().workspaceRelevance.workspaceState === "explicit_review_required"
          ? "review_required"
          : "fresh",
      updatedAt: snapshot.toSnapshot().lastRenderedAt,
    });

    const invalidations = await this.repositories.listDuplicateConsequenceInvalidationsForDecision(
      snapshot.toSnapshot().currentResolutionDecisionRef,
    );
    return {
      taskId,
      snapshot: snapshot.toSnapshot(),
      invalidations: invalidations.map((entry) => entry.toSnapshot()),
    };
  }

  async resolveTaskDuplicateReview(
    taskId: string,
    command: ResolveTaskDuplicateReviewCommand,
  ): Promise<ResolveTaskDuplicateReviewResult> {
    await seedTaskFixture(this);
    const task = await this.requireTask(taskId);
    const taskSnapshot = task.toSnapshot();
    invariant(taskSnapshot.duplicateClusterRef, `TriageTask ${taskId} does not declare duplicate review work.`);

    const resolved = await this.phase3Authority.resolveDuplicateReview({
      taskId,
      duplicateClusterRef: taskSnapshot.duplicateClusterRef,
      duplicateReviewSnapshotRef: command.duplicateReviewSnapshotRef,
      decisionClass: command.decisionClass,
      winningPairEvidenceRef: command.winningPairEvidenceRef,
      continuityWitnessClass: command.continuityWitnessClass,
      continuityWitnessRef: command.continuityWitnessRef,
      reviewMode: command.reviewMode,
      reasonCodes: command.reasonCodes,
      decidedByRef: command.decidedByRef,
      decidedAt: command.decidedAt,
      targetRequestRef: command.targetRequestRef,
      targetEpisodeRef: command.targetEpisodeRef,
    });

    await this.persistTaskDuplicateRefs(taskId, {
      duplicateReviewSnapshotRef: resolved.snapshot.duplicateReviewSnapshotId,
      duplicateResolutionDecisionRef: resolved.decision.duplicateResolutionDecisionId,
      reviewFreshnessState: resolved.invalidations.length > 0 ? "review_required" : "fresh",
      updatedAt: command.decidedAt,
    });

    return {
      taskId,
      snapshot: resolved.snapshot.toSnapshot(),
      invalidations: resolved.invalidations.map((entry) => entry.toSnapshot()),
      decision: resolved.decision.toSnapshot(),
      supersededDecisionRef: resolved.supersededDecision?.duplicateResolutionDecisionId ?? null,
    };
  }

  async runScenarioById(scenarioId: Phase3DuplicateReviewScenarioId): Promise<DuplicateReviewScenarioResult> {
    await seedTaskFixture(this);
    switch (scenarioId) {
      case "review_required_snapshot": {
        const queried = await this.queryTaskDuplicateReview(PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID);
        return {
          scenarioId,
          taskId: queried.taskId,
          snapshotId: queried.snapshot.duplicateReviewSnapshotId,
          decisionClass: queried.snapshot.currentDecisionClass,
          invalidationTargetTypes: queried.invalidations.map((entry) => entry.targetType),
        };
      }
      case "same_request_attach_with_witness": {
        const queried = await this.queryTaskDuplicateReview(PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID);
        const resolved = await this.resolveTaskDuplicateReview(PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID, {
          duplicateReviewSnapshotRef: queried.snapshot.duplicateReviewSnapshotId,
          decisionClass: "same_request_attach",
          winningPairEvidenceRef: queried.snapshot.winningPairEvidenceRef ?? queried.snapshot.pairEvidenceRefs[0]!,
          continuityWitnessClass: "workflow_return",
          continuityWitnessRef: "witness_234_workflow_return",
          reviewMode: "human_review",
          reasonCodes: ["WORKFLOW_RETURN_CONFIRMED", "CONTINUITY_WITNESS_PRESENT"],
          decidedByRef: "reviewer_234_primary",
          decidedAt: "2026-04-16T11:10:00.000Z",
        });
        return {
          scenarioId,
          taskId: resolved.taskId,
          snapshotId: resolved.snapshot.duplicateReviewSnapshotId,
          decisionClass: resolved.decision.decisionClass,
          invalidationTargetTypes: resolved.invalidations.map((entry) => entry.targetType),
        };
      }
      case "reversal_invalidates_downstream": {
        const attach = await this.runScenarioById("same_request_attach_with_witness");
        const attachSnapshot = await this.queryTaskDuplicateReview(attach.taskId);
        const separated = await this.resolveTaskDuplicateReview(attach.taskId, {
          duplicateReviewSnapshotRef: attachSnapshot.snapshot.duplicateReviewSnapshotId,
          decisionClass: "separate_request",
          winningPairEvidenceRef:
            attachSnapshot.snapshot.winningPairEvidenceRef ?? attachSnapshot.snapshot.pairEvidenceRefs[0]!,
          reviewMode: "human_review",
          reasonCodes: ["LATE_EVIDENCE_DELTA", "ATTACH_NO_LONGER_SAFE"],
          decidedByRef: "reviewer_234_primary",
          decidedAt: "2026-04-16T11:16:00.000Z",
        });
        return {
          scenarioId,
          taskId: separated.taskId,
          snapshotId: separated.snapshot.duplicateReviewSnapshotId,
          decisionClass: separated.decision.decisionClass,
          invalidationTargetTypes: separated.invalidations.map((entry) => entry.targetType),
        };
      }
      case "retry_authority_boundary": {
        const result = await this.simulation.simulateScenario("exact_retry_collapse");
        const snapshot = await this.phase3Authority.publishDuplicateReviewSnapshot({
          taskId: "phase3_duplicate_review_retry_boundary",
          duplicateClusterRef: result.cluster.clusterId,
          renderedAt: "2026-04-16T11:18:00.000Z",
        });
        return {
          scenarioId,
          taskId: "phase3_duplicate_review_retry_boundary",
          snapshotId: snapshot.duplicateReviewSnapshotId,
          decisionClass: snapshot.toSnapshot().currentDecisionClass,
          invalidationTargetTypes: [],
        };
      }
    }
  }

  async runAllScenarios(): Promise<readonly DuplicateReviewScenarioResult[]> {
    const results: DuplicateReviewScenarioResult[] = [];
    for (const scenarioId of phase3DuplicateReviewScenarioIds) {
      results.push(await this.runScenarioById(scenarioId));
    }
    return results;
  }

  async seedTaskFixture(): Promise<void> {
    const existingTask = await this.triageApplication.triageRepositories.getTask(
      PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID,
    );
    if (existingTask?.toSnapshot().duplicateClusterRef) {
      return;
    }

    await this.seedDuplicatePrerequisites();

    const assessed = await this.authority.assessIncomingDuplicate({
      incomingLineageRef: "lineage_234_incoming_primary",
      incomingSnapshotRef: "snapshot_234_incoming_primary",
      decidedByRef: "duplicate_governor_234",
      decidedAt: "2026-04-16T11:00:00.000Z",
      reviewMode: "human_review",
      candidatePairs: [
        {
          pairEvidenceId: "pair_evidence_234_primary",
          candidateRequestRef: "request_234_candidate_primary",
          candidateEpisodeRef: "episode_234_primary",
          continuitySignalRefs: ["workflow_return_signal_234_primary"],
          relationModelVersionRef: "duplicate_model_234_v1",
          channelCalibrationRef: "duplicate_calibration_web_v1",
          piRetry: 0.03,
          piSameRequestAttach: 0.67,
          piSameEpisode: 0.17,
          piRelatedEpisode: 0.05,
          piNewEpisode: 0.08,
          classMargin: 0.24,
          candidateMargin: 0.28,
          uncertaintyScore: 0.08,
        },
        {
          pairEvidenceId: "pair_evidence_234_competing",
          candidateRequestRef: "request_234_candidate_competing",
          candidateEpisodeRef: "episode_234_primary",
          continuitySignalRefs: ["workflow_return_signal_234_competing"],
          relationModelVersionRef: "duplicate_model_234_v1",
          channelCalibrationRef: "duplicate_calibration_web_v1",
          piRetry: 0.02,
          piSameRequestAttach: 0.21,
          piSameEpisode: 0.39,
          piRelatedEpisode: 0.08,
          piNewEpisode: 0.3,
          classMargin: 0.14,
          candidateMargin: 0.13,
          uncertaintyScore: 0.18,
        },
      ],
    });

    const taskInput: CreatePhase3KernelTaskInput = {
      taskId: PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID,
      requestId: "request_234_workspace_primary",
      queueKey: "repair",
      sourceQueueRankSnapshotRef: "queue_rank_snapshot_234_primary",
      returnAnchorRef: "queue_row_234_primary",
      returnAnchorTupleHash: "anchor_tuple_hash_234_primary",
      selectedAnchorRef: "anchor_duplicate_review_234",
      selectedAnchorTupleHash: "anchor_tuple_hash_234_primary",
      workspaceTrustEnvelopeRef: "workspace_trust_envelope_seed_234",
      surfaceRouteContractRef: "route_contract_workspace_duplicate_review_v1",
      surfacePublicationRef: "surface_publication_workspace_duplicate_review_v1",
      runtimePublicationBundleRef: "runtime_publication_workspace_duplicate_review_v1",
      taskCompletionSettlementEnvelopeRef: "task_completion_envelope_234_primary",
      createdAt: "2026-04-16T11:00:10.000Z",
      episodeId: "episode_234_primary",
      requestLineageRef: "lineage_234_workspace_primary",
    };
    if (!existingTask) {
      await this.triageApplication.createTask(taskInput);
      await this.triageApplication.moveTaskToQueue({
        taskId: PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID,
        actorRef: "reviewer_234_primary",
        queuedAt: "2026-04-16T11:00:15.000Z",
      });
      await this.triageApplication.claimTask({
        taskId: PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID,
        actorRef: "reviewer_234_primary",
        claimedAt: "2026-04-16T11:00:20.000Z",
      });
      await this.triageApplication.enterReview({
        taskId: PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID,
        actorRef: "reviewer_234_primary",
        openedAt: "2026-04-16T11:00:30.000Z",
        staffWorkspaceConsistencyProjectionRef: "workspace_consistency_seed_234",
        workspaceSliceTrustProjectionRef: "workspace_slice_trust_seed_234",
        audienceSurfaceRuntimeBindingRef: "audsurf_runtime_binding_workspace_duplicate_review_v1",
        reviewActionLeaseRef: "review_action_lease_234_primary",
        selectedAnchorRef: "anchor_duplicate_review_234",
        selectedAnchorTupleHashRef: "anchor_tuple_hash_234_primary",
      });
    }

    await this.persistTaskDuplicateRefs(PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID, {
      duplicateClusterRef: assessed.cluster.clusterId,
      duplicateResolutionDecisionRef: assessed.decision.duplicateResolutionDecisionId,
      reviewFreshnessState: "review_required",
      updatedAt: "2026-04-16T11:00:40.000Z",
    });
  }

  private async seedDuplicatePrerequisites(): Promise<void> {
    const episodes = [
      ["episode_234_primary", "episode_fp_234_primary"],
      ["episode_234_retry", "episode_fp_234_retry"],
    ] as const;
    for (const [episodeId, episodeFingerprint] of episodes) {
      const existing = await this.repositories.getEpisode(episodeId);
      if (!existing) {
        await this.repositories.saveEpisode(
          EpisodeAggregate.create({
            episodeId,
            episodeFingerprint,
            openedAt: "2026-04-16T10:40:00.000Z",
          }),
        );
      }
    }

    const requests = [
      ["request_234_candidate_primary", "episode_234_primary", "lineage_234_candidate_primary"],
      ["request_234_candidate_competing", "episode_234_primary", "lineage_234_candidate_competing"],
      ["request_234_workspace_primary", "episode_234_primary", "lineage_234_workspace_primary"],
    ] as const;
    for (const [requestId, episodeId, requestLineageRef] of requests) {
      const existing = await this.repositories.getRequest(requestId);
      if (!existing) {
        await this.repositories.saveRequest(
          RequestAggregate.create({
            requestId,
            episodeId,
            originEnvelopeRef: `envelope_${requestId}`,
            promotionRecordRef: `promotion_${requestId}`,
            tenantId: "tenant_234",
            sourceChannel: "self_service_form",
            originIngressRecordRef: `ingress_${requestId}`,
            normalizedSubmissionRef: `normalized_${requestId}`,
            requestType: "clinical_question",
            requestLineageRef,
            createdAt: "2026-04-16T10:40:00.000Z",
          }),
        );
      }
    }
  }

  private async persistTaskDuplicateRefs(
    taskId: string,
    updates: {
      duplicateClusterRef?: string;
      duplicateReviewSnapshotRef?: string;
      duplicateResolutionDecisionRef?: string;
      reviewFreshnessState: "fresh" | "queued_updates" | "review_required";
      updatedAt: string;
    },
  ): Promise<void> {
    const task = await this.requireTask(taskId);
    const nextTask = task.update({
      duplicateClusterRef: updates.duplicateClusterRef ?? task.toSnapshot().duplicateClusterRef,
      duplicateReviewSnapshotRef:
        updates.duplicateReviewSnapshotRef ?? task.toSnapshot().duplicateReviewSnapshotRef,
      duplicateResolutionDecisionRef:
        updates.duplicateResolutionDecisionRef ?? task.toSnapshot().duplicateResolutionDecisionRef,
      reviewFreshnessState: updates.reviewFreshnessState,
      updatedAt: updates.updatedAt,
    });
    await this.triageApplication.triageRepositories.saveTask(nextTask, {
      expectedVersion: task.version,
    });
  }

  private async requireTask(taskId: string) {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, `TriageTask ${taskId} is required.`);
    return task;
  }
}

export function createDuplicateReviewApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  repositories?: DuplicateReviewPhase3Dependencies;
  idGenerator?: BackboneIdGenerator;
}): DuplicateReviewApplication {
  return new DuplicateReviewApplicationImpl(options);
}
