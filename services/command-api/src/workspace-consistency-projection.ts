import {
  createWorkspaceProjectionAuthorityService,
  createWorkspaceProjectionStore,
  workspaceProjectionParallelInterfaceGaps,
  type AllowedLivePatchMode,
  type AssembleWorkspaceProjectionBundleInput,
  type ProtectedCompositionMode,
  type WorkspaceContextProjectionBundle,
  type WorkspaceFocusProtectionLeaseState,
  type WorkspaceInvalidatingDriftState,
  type WorkspaceLeaseHealthState,
  type WorkspaceProjectionDependencies,
  type WorkspaceSliceTrustState,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  createPhase3TriageKernelApplication,
  type CreatePhase3KernelTaskInput,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";
import {
  createReleaseTrustFreezeSimulationHarness,
  releaseTrustFreezeWorkspaceScenarioIds,
  type ReleaseTrustFreezeSimulationResult,
} from "./release-trust-freeze";

export const WORKSPACE_CONTEXT_PROJECTION_SERVICE_NAME = "WorkspaceContextProjectionService";
export const WORKSPACE_CONTEXT_SCHEMA_VERSION = "232.phase3.workspace-context-projection.v1";
export const WORKSPACE_CONTEXT_FIXTURE_TASK_ID = "phase3_workspace_task_232_primary";
export const WORKSPACE_CONTEXT_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/:taskId/context",
  "GET /internal/v1/workspace/tasks/:taskId/trust-envelope",
] as const;

export const workspaceContextRoutes = [
  {
    routeId: "workspace_task_context_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/context",
    contractFamily: "WorkspaceContextProjectionContract",
    purpose:
      "Resolve StaffWorkspaceConsistencyProjection, WorkspaceSliceTrustProjection, ProtectedCompositionState, WorkspaceContinuityEvidenceProjection, and WorkspaceTrustEnvelope from one task-scoped workspace context query.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_trust_envelope_current",
    method: "GET",
    path: "/internal/v1/workspace/tasks/{taskId}/trust-envelope",
    contractFamily: "WorkspaceTrustEnvelopeContract",
    purpose:
      "Expose the current WorkspaceTrustEnvelope as the only authority for writable posture, interruption pacing, and calm completion.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
] as const;

export const workspaceContextScenarioIds = [
  "fresh_writable_live_lease",
  "preview_only_without_live_lease",
  "same_shell_route_change_continuity",
  "trust_downgrade_protected_composition",
  "anchor_repair_required",
  "ownership_drift_reacquire_required",
] as const;

type WorkspaceContextScenarioId = (typeof workspaceContextScenarioIds)[number];

export interface QueryWorkspaceTaskContextInput {
  taskId: string;
  workspaceRef: string;
  currentRouteFamilyRef?: string;
  currentSurfaceRouteContractRef?: string;
  currentSurfacePublicationRef?: string;
  currentRuntimePublicationBundleRef?: string;
  surfaceRuntimeBindingRef?: string;
  releaseScenarioId?: (typeof releaseTrustFreezeWorkspaceScenarioIds)[number];
  reviewActionLeaseState?: WorkspaceLeaseHealthState;
  requestLifecycleLeaseState?: WorkspaceLeaseHealthState;
  queueSliceTrustState?: WorkspaceSliceTrustState;
  attachmentSliceTrustState?: WorkspaceSliceTrustState;
  assistiveSliceTrustState?: WorkspaceSliceTrustState;
  dependencySliceTrustState?: WorkspaceSliceTrustState;
  blockingDependencyRefs?: readonly string[];
  presentedOwnershipEpoch?: number | null;
  presentedFencingToken?: string | null;
  presentedLineageFenceEpoch?: number | null;
  continuitySelectedAnchorTupleHashRef?: string;
  continuitySourceQueueRankSnapshotRef?: string;
  anchorRepairTargetRef?: string | null;
  consequenceState?: "current" | "review_required" | "superseded";
  compositionMode?: ProtectedCompositionMode | null;
  focusProtectionLeaseRef?: string | null;
  focusProtectionLeaseState?: WorkspaceFocusProtectionLeaseState | null;
  invalidatingDriftState?: WorkspaceInvalidatingDriftState | null;
  draftArtifactRefs?: readonly string[];
  compareAnchorRefs?: readonly string[];
  primaryReadingTargetRef?: string | null;
  quietReturnTargetRef?: string | null;
  allowedLivePatchMode?: AllowedLivePatchMode | null;
  releaseGateRef?: string | null;
  compositionStartedAt?: string | null;
  compositionReleasedAt?: string | null;
}

export interface WorkspaceContextScenarioResult {
  scenarioId: WorkspaceContextScenarioId;
  bundle: WorkspaceContextProjectionBundle;
  releaseTrustScenario: ReleaseTrustFreezeSimulationResult;
}

export interface WorkspaceContextProjectionApplication {
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly workspaceRepositories: WorkspaceProjectionDependencies;
  readonly workspaceAuthority: ReturnType<typeof createWorkspaceProjectionAuthorityService>;
  readonly querySurfaces: typeof WORKSPACE_CONTEXT_QUERY_SURFACES;
  readonly schemaVersion: typeof WORKSPACE_CONTEXT_SCHEMA_VERSION;
  readonly serviceName: typeof WORKSPACE_CONTEXT_PROJECTION_SERVICE_NAME;
  readonly parallelInterfaceGaps: typeof workspaceProjectionParallelInterfaceGaps;
  queryWorkspaceTaskContext(input: QueryWorkspaceTaskContextInput): Promise<WorkspaceContextProjectionBundle>;
  simulation: {
    runAllScenarios(): Promise<WorkspaceContextScenarioResult[]>;
  };
}

async function seedOpenReviewTask(
  triageApplication: Phase3TriageKernelApplication,
): Promise<void> {
  const existingTask = await triageApplication.triageRepositories.getTask(WORKSPACE_CONTEXT_FIXTURE_TASK_ID);
  if (existingTask) {
    return;
  }

  const taskInput: CreatePhase3KernelTaskInput = {
    taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
    requestId: "request_232_workspace_primary",
    queueKey: "repair",
    sourceQueueRankSnapshotRef: "queue_rank_snapshot_232_primary",
    returnAnchorRef: "queue_row_232_primary",
    returnAnchorTupleHash: "anchor_tuple_hash_232_primary",
    selectedAnchorRef: "anchor_patient_summary_232",
    selectedAnchorTupleHash: "anchor_tuple_hash_232_primary",
    workspaceTrustEnvelopeRef: "workspace_trust_envelope_seed_232",
    surfaceRouteContractRef: "route_contract_workspace_task_v1",
    surfacePublicationRef: "surface_publication_workspace_task_v1",
    runtimePublicationBundleRef: "runtime_publication_workspace_task_v1",
    taskCompletionSettlementEnvelopeRef: "task_completion_envelope_232_primary",
    createdAt: "2026-04-16T09:00:00.000Z",
    episodeId: "episode_232_workspace_primary",
    requestLineageRef: "request_lineage_232_workspace_primary",
  };
  await triageApplication.createTask(taskInput);
  await triageApplication.moveTaskToQueue({
    taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
    actorRef: "reviewer_232_primary",
    queuedAt: "2026-04-16T09:00:30.000Z",
  });
  await triageApplication.claimTask({
    taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
    actorRef: "reviewer_232_primary",
    claimedAt: "2026-04-16T09:01:00.000Z",
  });
  await triageApplication.enterReview({
    taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
    actorRef: "reviewer_232_primary",
    openedAt: "2026-04-16T09:02:00.000Z",
    staffWorkspaceConsistencyProjectionRef: "workspace_consistency_seed_232",
    workspaceSliceTrustProjectionRef: "workspace_slice_trust_seed_232",
    audienceSurfaceRuntimeBindingRef: "audsurf_runtime_binding_workspace_task_v1",
    reviewActionLeaseRef: "review_action_lease_232_primary",
    selectedAnchorRef: "anchor_patient_summary_232",
    selectedAnchorTupleHashRef: "anchor_tuple_hash_232_primary",
  });
}

function mapSettlementState(authoritativeOutcomeState: string): AssembleWorkspaceProjectionBundleInput["completionSettlementState"] {
  switch (authoritativeOutcomeState) {
    case "settled":
      return "settled";
    case "stale_recoverable":
    case "review_required":
      return "stale_recoverable";
    case "recovery_required":
      return "recovery_required";
    case "failed":
    case "expired":
      return "manual_handoff_required";
    default:
      return "pending";
  }
}

function normalizeLeaseState(
  state: WorkspaceLeaseHealthState | undefined,
  fallback: WorkspaceLeaseHealthState,
): WorkspaceLeaseHealthState {
  return state ?? fallback;
}

function defaultPrimaryReadingTarget(taskId: string): string {
  return `${taskId}::primary_reading_target`;
}

class WorkspaceContextProjectionApplicationImpl implements WorkspaceContextProjectionApplication {
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly workspaceRepositories: WorkspaceProjectionDependencies;
  readonly workspaceAuthority: ReturnType<typeof createWorkspaceProjectionAuthorityService>;
  readonly querySurfaces = WORKSPACE_CONTEXT_QUERY_SURFACES;
  readonly schemaVersion = WORKSPACE_CONTEXT_SCHEMA_VERSION;
  readonly serviceName = WORKSPACE_CONTEXT_PROJECTION_SERVICE_NAME;
  readonly parallelInterfaceGaps = workspaceProjectionParallelInterfaceGaps;
  readonly simulation;

  private readonly releaseTrustHarness = createReleaseTrustFreezeSimulationHarness();

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    workspaceRepositories?: WorkspaceProjectionDependencies;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.triageApplication =
      options?.triageApplication ??
      createPhase3TriageKernelApplication({
        idGenerator:
          options?.idGenerator ??
          createDeterministicBackboneIdGenerator("workspace_context_projection_application"),
      });
    this.workspaceRepositories = options?.workspaceRepositories ?? createWorkspaceProjectionStore();
    this.workspaceAuthority = createWorkspaceProjectionAuthorityService(
      this.workspaceRepositories,
      options?.idGenerator ??
        createDeterministicBackboneIdGenerator("workspace_context_projection_service"),
    );
    this.simulation = {
      runAllScenarios: async () => {
        const results: WorkspaceContextScenarioResult[] = [];
        for (const scenarioId of workspaceContextScenarioIds) {
          results.push(await this.runScenario(scenarioId));
        }
        return results;
      },
    };
  }

  async queryWorkspaceTaskContext(
    input: QueryWorkspaceTaskContextInput,
  ): Promise<WorkspaceContextProjectionBundle> {
    await seedOpenReviewTask(this.triageApplication);

    const task = await this.triageApplication.triageRepositories.getTask(input.taskId);
    if (!task) {
      throw new Error(`TriageTask ${input.taskId} is required.`);
    }
    const taskSnapshot = task.toSnapshot();
    const reviewSession = taskSnapshot.activeReviewSessionRef
      ? await this.triageApplication.triageRepositories.getReviewSession(
          taskSnapshot.activeReviewSessionRef,
        )
      : null;
    if (!reviewSession) {
      throw new Error(`Active review session is required for task ${input.taskId}.`);
    }
    const reviewSessionSnapshot = reviewSession.toSnapshot();
    const launchContext = await this.triageApplication.triageRepositories.getLaunchContext(
      taskSnapshot.launchContextRef,
    );
    if (!launchContext) {
      throw new Error(`TaskLaunchContext ${taskSnapshot.launchContextRef} is required.`);
    }
    const launchContextSnapshot = launchContext.toSnapshot();
    const settlements = await this.triageApplication.triageRepositories.listTaskCommandSettlements();
    const latestSettlement = [...settlements]
      .filter((settlement) => settlement.toSnapshot().taskId === input.taskId)
      .sort((left, right) =>
        left.toSnapshot().recordedAt.localeCompare(right.toSnapshot().recordedAt),
      )
      .at(-1);

    const releaseTrustScenario = await this.releaseTrustHarness.runScenarioById(
      input.releaseScenarioId ?? "live_exact_parity_trusted_slices",
    );

    const reviewActionLeaseState = normalizeLeaseState(
      input.reviewActionLeaseState,
      taskSnapshot.ownershipState === "active" ? "live" : "expired",
    );
    const requestLifecycleLeaseState = normalizeLeaseState(
      input.requestLifecycleLeaseState,
      taskSnapshot.lifecycleLeaseRef ? "live" : "missing",
    );

    const bundleInput: AssembleWorkspaceProjectionBundleInput = {
      workspaceRef: input.workspaceRef,
      workspaceFamily: "staff_review",
      taskId: taskSnapshot.taskId,
      requestId: taskSnapshot.requestId,
      queueKey: taskSnapshot.queueKey,
      routeFamilyRef: "rf_workspace_phase3_triage",
      routeContinuityEvidenceContractRef: "route_continuity_workspace_task_completion_v1",
      audienceTier: "staff_triage",
      governingObjectRefs: [
        taskSnapshot.taskId,
        taskSnapshot.requestId,
        reviewSessionSnapshot.reviewSessionId,
      ],
      entityVersionRefs: [
        `${taskSnapshot.taskId}@v${task.version}`,
        `${reviewSessionSnapshot.reviewSessionId}@v${reviewSession.version}`,
        `review_version_${taskSnapshot.reviewVersion}`,
      ],
      queueChangeBatchRef: null,
      reviewVersionRef: taskSnapshot.reviewVersion,
      workspaceSnapshotVersion: reviewSessionSnapshot.workspaceSnapshotVersion,
      reviewFreshnessState: taskSnapshot.reviewFreshnessState,
      currentRouteFamilyRef: input.currentRouteFamilyRef ?? "rf_workspace_phase3_triage",
      expectedSurfaceRouteContractRef: reviewSessionSnapshot.surfaceRouteContractRef,
      currentSurfaceRouteContractRef:
        input.currentSurfaceRouteContractRef ?? reviewSessionSnapshot.surfaceRouteContractRef,
      expectedSurfacePublicationRef: reviewSessionSnapshot.surfacePublicationRef,
      surfacePublicationRef:
        input.currentSurfacePublicationRef ?? reviewSessionSnapshot.surfacePublicationRef,
      expectedRuntimePublicationBundleRef: reviewSessionSnapshot.runtimePublicationBundleRef,
      runtimePublicationBundleRef:
        input.currentRuntimePublicationBundleRef ?? reviewSessionSnapshot.runtimePublicationBundleRef,
      selectedAnchorRef: reviewSessionSnapshot.selectedAnchorRef,
      selectedAnchorTupleHashRef: reviewSessionSnapshot.selectedAnchorTupleHashRef,
      continuitySelectedAnchorTupleHashRef:
        input.continuitySelectedAnchorTupleHashRef ??
        reviewSessionSnapshot.selectedAnchorTupleHashRef,
      continuitySourceQueueRankSnapshotRef:
        input.continuitySourceQueueRankSnapshotRef ??
        launchContextSnapshot.sourceQueueRankSnapshotRef,
      sourceQueueRankSnapshotRef: launchContextSnapshot.sourceQueueRankSnapshotRef,
      latestTaskCompletionSettlementRef:
        latestSettlement?.toSnapshot().settlementId ??
        taskSnapshot.taskCompletionSettlementEnvelopeRef,
      taskCompletionSettlementEnvelopeRef: taskSnapshot.taskCompletionSettlementEnvelopeRef,
      latestPrefetchWindowRef: launchContextSnapshot.prefetchWindowRef,
      latestNextTaskLaunchLeaseRef: null,
      experienceContinuityEvidenceRef: `experience_continuity_evidence_${taskSnapshot.taskId}`,
      completionSettlementState: mapSettlementState(
        latestSettlement?.toSnapshot().authoritativeOutcomeState ?? "pending",
      ),
      nextTaskLaunchState: launchContextSnapshot.nextTaskLaunchState,
      releaseTrustVerdict: releaseTrustScenario.verdict,
      queueSliceTrustState: input.queueSliceTrustState,
      attachmentSliceTrustState: input.attachmentSliceTrustState,
      assistiveSliceTrustState: input.assistiveSliceTrustState,
      dependencySliceTrustState: input.dependencySliceTrustState,
      assuranceSliceTrustRefs: releaseTrustScenario.verdict.requiredAssuranceSliceTrustRefs,
      blockingDependencyRefs: input.blockingDependencyRefs ?? [],
      reviewActionLeaseRef: reviewSessionSnapshot.reviewActionLeaseRef,
      reviewActionLeaseState,
      requestLifecycleLeaseRef: reviewSessionSnapshot.requestLifecycleLeaseRef,
      requestLifecycleLeaseState,
      focusProtectionLeaseRef:
        input.focusProtectionLeaseRef ??
        (input.compositionMode ? "focus_protection_lease_232_primary" : null),
      focusProtectionLeaseState: input.focusProtectionLeaseState ?? "active",
      invalidatingDriftState: input.invalidatingDriftState ?? "none",
      compositionMode: input.compositionMode ?? null,
      draftArtifactRefs: input.draftArtifactRefs ?? [],
      compareAnchorRefs: input.compareAnchorRefs ?? [],
      primaryReadingTargetRef: input.primaryReadingTargetRef ?? defaultPrimaryReadingTarget(input.taskId),
      quietReturnTargetRef: input.quietReturnTargetRef ?? `${input.taskId}::quiet_return`,
      allowedLivePatchMode: input.allowedLivePatchMode ?? "blocking_only",
      releaseGateRef:
        input.releaseGateRef ??
        (input.compositionMode ? `release_gate_${input.taskId}` : null),
      compositionStartedAt: input.compositionStartedAt ?? "2026-04-16T09:03:00.000Z",
      compositionReleasedAt: input.compositionReleasedAt ?? null,
      consequenceState:
        input.consequenceState ??
        (taskSnapshot.latestDecisionSupersessionRef ? "superseded" : "current"),
      anchorRepairTargetRef: input.anchorRepairTargetRef ?? null,
      staleOwnerRecoveryRef: taskSnapshot.staleOwnerRecoveryRef,
      ownershipEpochRef: taskSnapshot.ownershipEpoch,
      presentedOwnershipEpoch: input.presentedOwnershipEpoch ?? taskSnapshot.ownershipEpoch,
      fencingToken: taskSnapshot.fencingToken,
      presentedFencingToken: input.presentedFencingToken ?? taskSnapshot.fencingToken,
      lineageFenceEpoch: taskSnapshot.currentLineageFenceEpoch,
      presentedLineageFenceEpoch:
        input.presentedLineageFenceEpoch ?? taskSnapshot.currentLineageFenceEpoch,
      surfaceRuntimeBindingRef:
        input.surfaceRuntimeBindingRef ??
        reviewSessionSnapshot.audienceSurfaceRuntimeBindingRef,
      computedAt: "2026-04-16T09:05:00.000Z",
      staleAt: "2026-04-16T09:15:00.000Z",
    };

    return this.workspaceAuthority.assembleWorkspaceProjectionBundle(bundleInput);
  }

  private async runScenario(
    scenarioId: WorkspaceContextScenarioId,
  ): Promise<WorkspaceContextScenarioResult> {
    switch (scenarioId) {
      case "fresh_writable_live_lease": {
        const releaseTrustScenario = await this.releaseTrustHarness.runScenarioById(
          "live_exact_parity_trusted_slices",
        );
        const bundle = await this.queryWorkspaceTaskContext({
          taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
          workspaceRef: "/workspace/task/phase3_workspace_task_232_primary",
          releaseScenarioId: "live_exact_parity_trusted_slices",
        });
        return { scenarioId, bundle, releaseTrustScenario };
      }
      case "preview_only_without_live_lease": {
        const releaseTrustScenario = await this.releaseTrustHarness.runScenarioById(
          "live_exact_parity_trusted_slices",
        );
        const bundle = await this.queryWorkspaceTaskContext({
          taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
          workspaceRef: "/workspace/task/phase3_workspace_task_232_primary",
          releaseScenarioId: "live_exact_parity_trusted_slices",
          reviewActionLeaseState: "missing",
        });
        return { scenarioId, bundle, releaseTrustScenario };
      }
      case "same_shell_route_change_continuity": {
        const releaseTrustScenario = await this.releaseTrustHarness.runScenarioById(
          "live_exact_parity_trusted_slices",
        );
        const bundle = await this.queryWorkspaceTaskContext({
          taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
          workspaceRef: "/workspace/task/phase3_workspace_task_232_primary/more-info",
          releaseScenarioId: "live_exact_parity_trusted_slices",
        });
        return { scenarioId, bundle, releaseTrustScenario };
      }
      case "trust_downgrade_protected_composition": {
        const releaseTrustScenario = await this.releaseTrustHarness.runScenarioById(
          "diagnostic_only_degraded_slice",
        );
        const bundle = await this.queryWorkspaceTaskContext({
          taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
          workspaceRef: "/workspace/task/phase3_workspace_task_232_primary/decision",
          releaseScenarioId: "diagnostic_only_degraded_slice",
          compositionMode: "drafting",
          focusProtectionLeaseRef: "focus_protection_lease_232_primary",
          focusProtectionLeaseState: "invalidated",
          invalidatingDriftState: "trust",
          draftArtifactRefs: ["draft_232_primary"],
        });
        return { scenarioId, bundle, releaseTrustScenario };
      }
      case "anchor_repair_required": {
        const releaseTrustScenario = await this.releaseTrustHarness.runScenarioById(
          "live_exact_parity_trusted_slices",
        );
        const bundle = await this.queryWorkspaceTaskContext({
          taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
          workspaceRef: "/workspace/task/phase3_workspace_task_232_primary/decision",
          releaseScenarioId: "live_exact_parity_trusted_slices",
          continuitySelectedAnchorTupleHashRef: "anchor_tuple_hash_232_repair_required",
          anchorRepairTargetRef: "anchor_patient_summary_232_repaired",
        });
        return { scenarioId, bundle, releaseTrustScenario };
      }
      case "ownership_drift_reacquire_required": {
        const releaseTrustScenario = await this.releaseTrustHarness.runScenarioById(
          "live_exact_parity_trusted_slices",
        );
        const bundle = await this.queryWorkspaceTaskContext({
          taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
          workspaceRef: "/workspace/task/phase3_workspace_task_232_primary",
          releaseScenarioId: "live_exact_parity_trusted_slices",
          presentedOwnershipEpoch: 0,
          presentedFencingToken: "stale_fencing_token_232",
          presentedLineageFenceEpoch: 0,
          reviewActionLeaseState: "expired",
          requestLifecycleLeaseState: "expired",
        });
        return { scenarioId, bundle, releaseTrustScenario };
      }
    }
  }
}

export function createWorkspaceConsistencyProjectionApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  workspaceRepositories?: WorkspaceProjectionDependencies;
  idGenerator?: BackboneIdGenerator;
}): WorkspaceContextProjectionApplication {
  return new WorkspaceContextProjectionApplicationImpl(options);
}
