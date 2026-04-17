import {
  EpisodeAggregate,
  createCommandSettlementAuthorityService,
  createCommandSettlementStore,
  createLeaseFenceCommandAuthorityService,
  type SubmissionBackboneDependencies,
  type CommandActionRecordDocument,
  type CommandSettlementDependencies,
  type CommandSettlementRecordDocument,
  type RecordCommandSettlementInput,
  type RequestLifecycleLeaseDocument,
} from "@vecells/domain-identity-access";
import {
  RequestAggregate,
  RequestLineageAggregate,
  assertPhase3FenceAdvance,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type Phase3CommandWitness,
  type Phase3LeaseFenceTuple,
} from "@vecells/domain-kernel";
import {
  createPhase3TriageKernelService,
  createPhase3TriageKernelStore,
  type CreatePhase3TriageTaskInput,
  type Phase3CommandContext,
  type Phase3ReviewSessionSnapshot,
  type Phase3TriageKernelRepositories,
  type Phase3TriageKernelService,
  type Phase3TriageTransitionResult,
  type Phase3TriageTaskDocument,
  type Phase3TriageTaskStatus,
  type TransitionTaskInput,
} from "@vecells/domain-triage-workspace";
import {
  commandSettlementMigrationPlanRefs,
  commandSettlementPersistenceTables,
} from "./command-settlement";

const TRIAGE_DOMAIN = "triage_workspace";
const TRIAGE_DESCRIPTOR = "TriageTask";
const DEFAULT_LEASE_AUTHORITY_REF = "lease_authority_triage_workspace";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
  }
}

export const phase3TriageKernelPersistenceTables = [
  ...new Set([
    ...commandSettlementPersistenceTables,
    "phase3_triage_tasks",
    "phase3_review_sessions",
    "phase3_task_launch_contexts",
    "phase3_task_command_settlements",
    "phase3_task_transition_journal",
  ]),
] as const;

export const phase3TriageKernelMigrationPlanRefs = [
  ...commandSettlementMigrationPlanRefs,
  "services/command-api/migrations/110_phase3_triage_task_kernel.sql",
] as const;

interface Phase3TaskRequestContext {
  episodeId: string;
  requestLineageRef: string;
  createdAt: string;
}

interface LeaseCommandContext extends Phase3LeaseFenceTuple {
  leaseId: string;
  governingObjectVersionRef: string;
}

export interface CreatePhase3KernelTaskInput extends CreatePhase3TriageTaskInput {
  episodeId: string;
  requestLineageRef: string;
}

export interface Phase3KernelClaimTaskInput {
  taskId: string;
  actorRef: string;
  claimedAt: string;
  ownerSessionRef?: string | null;
  leaseTtlSeconds?: number;
}

export interface Phase3KernelEnterReviewInput {
  taskId: string;
  actorRef: string;
  openedAt: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  reviewActionLeaseRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
}

export interface Phase3KernelHeartbeatInput {
  taskId: string;
  reviewSessionId: string;
  actorRef: string;
  heartbeatAt: string;
  ownerSessionRef?: string | null;
}

export interface Phase3KernelReacquireLeaseInput {
  taskId: string;
  actorRef: string;
  reacquiredAt: string;
  ownerSessionRef?: string | null;
  leaseTtlSeconds?: number;
}

export interface Phase3KernelReleaseInput {
  taskId: string;
  actorRef: string;
  releasedAt: string;
  closeBlockReason?: string | null;
}

export interface Phase3KernelStaleOwnerInput {
  taskId: string;
  authorizedByRef: string;
  detectedAt: string;
  breakReason: string;
  breakGuardSeconds?: number;
}

export interface Phase3KernelTakeoverInput {
  taskId: string;
  actorRef: string;
  authorizedByRef: string;
  takeoverAt: string;
  takeoverReason: string;
  ownerSessionRef?: string | null;
  leaseTtlSeconds?: number;
}

export interface Phase3KernelTransitionInput
  extends Omit<
    TransitionTaskInput,
    "presentedOwnershipEpoch" | "presentedFencingToken" | "presentedLineageFenceEpoch" | "command"
  > {
  actorRef: string;
  recordedAt: string;
}

export interface Phase3TriageKernelApplication {
  readonly triageRepositories: Phase3TriageKernelRepositories;
  readonly controlPlaneRepositories: CommandSettlementDependencies;
  readonly triageService: Phase3TriageKernelService;
  readonly leaseAuthority: ReturnType<typeof createLeaseFenceCommandAuthorityService>;
  readonly settlementAuthority: ReturnType<typeof createCommandSettlementAuthorityService>;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  createTask(input: CreatePhase3KernelTaskInput): Promise<Phase3TriageTransitionResult>;
  moveTaskToQueue(input: {
    taskId: string;
    actorRef: string;
    queuedAt: string;
  }): Promise<Phase3TriageTransitionResult>;
  claimTask(input: Phase3KernelClaimTaskInput): Promise<Phase3TriageTransitionResult>;
  enterReview(input: Phase3KernelEnterReviewInput): Promise<Phase3TriageTransitionResult>;
  heartbeatReviewSession(input: Phase3KernelHeartbeatInput): Promise<Phase3TriageTransitionResult>;
  reacquireTaskLease(input: Phase3KernelReacquireLeaseInput): Promise<Phase3TriageTransitionResult>;
  releaseTask(input: Phase3KernelReleaseInput): Promise<Phase3TriageTransitionResult>;
  markStaleOwnerDetected(
    input: Phase3KernelStaleOwnerInput,
  ): Promise<Phase3TriageTransitionResult>;
  takeOverStaleTask(input: Phase3KernelTakeoverInput): Promise<Phase3TriageTransitionResult>;
  transitionTask(input: Phase3KernelTransitionInput): Promise<Phase3TriageTransitionResult>;
  markAwaitingPatientInfo(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & { moreInfoContractRef: string },
  ): Promise<Phase3TriageTransitionResult>;
  markReviewResumed(
    input: Omit<Phase3KernelTransitionInput, "nextStatus">,
  ): Promise<Phase3TriageTransitionResult>;
  markEndpointSelected(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & {
      currentDecisionEpochRef: string;
      currentEndpointDecisionRef: string;
    },
  ): Promise<Phase3TriageTransitionResult>;
  markEscalated(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & {
      currentDecisionEpochRef: string;
      escalationContractRef: string;
    },
  ): Promise<Phase3TriageTransitionResult>;
  markResolvedWithoutAppointment(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & {
      currentDecisionEpochRef: string;
      consequenceHookRef: string;
    },
  ): Promise<Phase3TriageTransitionResult>;
  markHandoffPending(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & {
      currentDecisionEpochRef: string;
      consequenceHookRef: string;
    },
  ): Promise<Phase3TriageTransitionResult>;
  reopenTask(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & { reopenContractRef: string },
  ): Promise<Phase3TriageTransitionResult>;
  closeTask(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & {
      lifecycleCoordinatorSignalRef: string;
    },
  ): Promise<Phase3TriageTransitionResult>;
}

class Phase3TriageKernelApplicationImpl implements Phase3TriageKernelApplication {
  readonly triageRepositories: Phase3TriageKernelRepositories;
  readonly controlPlaneRepositories: CommandSettlementDependencies;
  readonly triageService: Phase3TriageKernelService;
  readonly leaseAuthority;
  readonly settlementAuthority;
  readonly persistenceTables = phase3TriageKernelPersistenceTables;
  readonly migrationPlanRef = phase3TriageKernelMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3TriageKernelMigrationPlanRefs;

  private readonly taskRequestContextById = new Map<string, Phase3TaskRequestContext>();

  constructor(options?: {
    triageRepositories?: Phase3TriageKernelRepositories;
    controlPlaneRepositories?: CommandSettlementDependencies;
    idGenerator?: BackboneIdGenerator;
  }) {
    const idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_triage_kernel");
    this.triageRepositories = options?.triageRepositories ?? createPhase3TriageKernelStore();
    this.controlPlaneRepositories = options?.controlPlaneRepositories ?? createCommandSettlementStore();
    this.triageService = createPhase3TriageKernelService(this.triageRepositories, { idGenerator });
    this.leaseAuthority = createLeaseFenceCommandAuthorityService(
      this.controlPlaneRepositories,
      idGenerator,
    );
    this.settlementAuthority = createCommandSettlementAuthorityService(
      this.controlPlaneRepositories,
      idGenerator,
    );
  }

  async createTask(input: CreatePhase3KernelTaskInput): Promise<Phase3TriageTransitionResult> {
    await this.ensureRequestContext({
      requestId: input.requestId,
      episodeId: input.episodeId,
      requestLineageRef: input.requestLineageRef,
      createdAt: input.createdAt,
    });
    const created = await this.triageService.createTask(input);
    this.taskRequestContextById.set(created.task.taskId, {
      episodeId: input.episodeId,
      requestLineageRef: input.requestLineageRef,
      createdAt: input.createdAt,
    });
    return created;
  }

  async moveTaskToQueue(input: {
    taskId: string;
    actorRef: string;
    queuedAt: string;
  }): Promise<Phase3TriageTransitionResult> {
    return this.transitionTask({
      taskId: input.taskId,
      actorRef: input.actorRef,
      nextStatus: "queued",
      recordedAt: input.queuedAt,
    });
  }

  async claimTask(input: Phase3KernelClaimTaskInput): Promise<Phase3TriageTransitionResult> {
    const task = await this.requireTask(input.taskId);
    const taskSnapshot = task.toSnapshot();
    const requestContext = this.requireTaskRequestContext(taskSnapshot.taskId);
    const claimedAt = input.claimedAt;

    const acquired = await this.leaseAuthority.acquireLease({
      requestId: taskSnapshot.requestId,
      episodeId: requestContext.episodeId,
      requestLineageRef: requestContext.requestLineageRef,
      domain: TRIAGE_DOMAIN,
      domainObjectRef: taskSnapshot.taskId,
      leaseAuthorityRef: DEFAULT_LEASE_AUTHORITY_REF,
      ownerActorRef: input.actorRef,
      ownerSessionRef: input.ownerSessionRef ?? `session_${input.actorRef}`,
      governingObjectVersionRef: this.governingVersionRef(task),
      leaseScopeComponents: ["task_claim", "triage_mutation"],
      leaseTtlSeconds: input.leaseTtlSeconds ?? 300,
      acquiredAt: claimedAt,
      sameShellRecoveryRouteRef: this.recoveryRouteRef(taskSnapshot.taskId),
      operatorVisibleWorkRef: this.operatorVisibleWorkRef(taskSnapshot.taskId),
      blockedActionScopeRefs: ["task_claim", "task_release"],
    });

    assertPhase3FenceAdvance({
      currentOwnershipEpoch: taskSnapshot.ownershipEpoch,
      nextOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
      currentLineageFenceEpoch: taskSnapshot.currentLineageFenceEpoch,
      nextLineageFenceEpoch: acquired.lineageFence.currentEpoch,
    });

    const command = await this.issueSettledCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: claimedAt,
      actionScope: "task_claim",
      semanticPayload: {
        nextOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
        nextLineageFenceEpoch: acquired.lineageFence.currentEpoch,
      },
      leaseContext: {
        leaseId: acquired.lease.leaseId,
        ownershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
        fencingToken: acquired.lease.toSnapshot().fencingToken,
        lineageFenceEpoch: acquired.lineageFence.currentEpoch,
        governingObjectVersionRef: this.governingVersionRef(task),
      },
    });

    return this.triageService.claimTask({
      taskId: taskSnapshot.taskId,
      actorRef: input.actorRef,
      presentedOwnershipEpoch: taskSnapshot.ownershipEpoch,
      presentedFencingToken: taskSnapshot.fencingToken,
      presentedLineageFenceEpoch: taskSnapshot.currentLineageFenceEpoch,
      nextOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
      nextLineageFenceEpoch: acquired.lineageFence.currentEpoch,
      nextFencingToken: acquired.lease.toSnapshot().fencingToken,
      lifecycleLeaseRef: acquired.lease.leaseId,
      leaseAuthorityRef: DEFAULT_LEASE_AUTHORITY_REF,
      leaseTtlSeconds: acquired.lease.toSnapshot().leaseTtlSeconds,
      claimedAt,
      command,
    });
  }

  async enterReview(input: Phase3KernelEnterReviewInput): Promise<Phase3TriageTransitionResult> {
    const task = await this.requireTask(input.taskId);
    const taskSnapshot = task.toSnapshot();
    const command = await this.issueSettledCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.openedAt,
      actionScope: "start_review",
      semanticPayload: {
        selectedAnchorRef: input.selectedAnchorRef,
        selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
      },
      leaseContext: this.requireCurrentLeaseContext(task),
    });

    return this.triageService.enterReview({
      taskId: taskSnapshot.taskId,
      presentedOwnershipEpoch: taskSnapshot.ownershipEpoch,
      presentedFencingToken: taskSnapshot.fencingToken,
      presentedLineageFenceEpoch: taskSnapshot.currentLineageFenceEpoch,
      staffWorkspaceConsistencyProjectionRef: input.staffWorkspaceConsistencyProjectionRef,
      workspaceSliceTrustProjectionRef: input.workspaceSliceTrustProjectionRef,
      audienceSurfaceRuntimeBindingRef: input.audienceSurfaceRuntimeBindingRef,
      reviewActionLeaseRef: input.reviewActionLeaseRef,
      requestLifecycleLeaseRef: taskSnapshot.lifecycleLeaseRef ?? "missing_lifecycle_lease_ref",
      selectedAnchorRef: input.selectedAnchorRef,
      selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
      openedAt: input.openedAt,
      command,
    });
  }

  async heartbeatReviewSession(input: Phase3KernelHeartbeatInput): Promise<Phase3TriageTransitionResult> {
    const task = await this.requireTask(input.taskId);
    const taskSnapshot = task.toSnapshot();
    await this.leaseAuthority.heartbeatLease({
      domain: TRIAGE_DOMAIN,
      domainObjectRef: taskSnapshot.taskId,
      leaseId: taskSnapshot.lifecycleLeaseRef ?? "missing_lifecycle_lease_ref",
      presentedOwnershipEpoch: taskSnapshot.ownershipEpoch,
      presentedFencingToken: taskSnapshot.fencingToken,
      ownerSessionRef: input.ownerSessionRef ?? `session_${input.actorRef}`,
      heartbeatAt: input.heartbeatAt,
      sameShellRecoveryRouteRef: this.recoveryRouteRef(taskSnapshot.taskId),
      operatorVisibleWorkRef: this.operatorVisibleWorkRef(taskSnapshot.taskId),
      blockedActionScopeRefs: ["start_review", "task_release"],
      detectedByRef: input.actorRef,
    });
    return this.triageService.heartbeatReviewSession({
      taskId: taskSnapshot.taskId,
      reviewSessionId: input.reviewSessionId,
      presentedOwnershipEpoch: taskSnapshot.ownershipEpoch,
      presentedFencingToken: taskSnapshot.fencingToken,
      presentedLineageFenceEpoch: taskSnapshot.currentLineageFenceEpoch,
      heartbeatAt: input.heartbeatAt,
    });
  }

  async reacquireTaskLease(
    input: Phase3KernelReacquireLeaseInput,
  ): Promise<Phase3TriageTransitionResult> {
    const task = await this.requireTask(input.taskId);
    const taskSnapshot = task.toSnapshot();
    invariant(
      taskSnapshot.ownershipState === "active",
      "LEASE_REACQUIRE_REQUIRES_ACTIVE_OWNERSHIP",
      "Lease reacquire requires active task ownership.",
    );
    const requestContext = this.requireTaskRequestContext(taskSnapshot.taskId);
    const reacquired = await this.leaseAuthority.acquireLease({
      requestId: taskSnapshot.requestId,
      episodeId: requestContext.episodeId,
      requestLineageRef: requestContext.requestLineageRef,
      domain: TRIAGE_DOMAIN,
      domainObjectRef: taskSnapshot.taskId,
      leaseAuthorityRef: DEFAULT_LEASE_AUTHORITY_REF,
      ownerActorRef: input.actorRef,
      ownerSessionRef: input.ownerSessionRef ?? `session_${input.actorRef}`,
      governingObjectVersionRef: this.governingVersionRef(task),
      leaseScopeComponents: ["task_claim", "triage_mutation"],
      leaseTtlSeconds: input.leaseTtlSeconds ?? 300,
      acquiredAt: input.reacquiredAt,
      sameShellRecoveryRouteRef: this.recoveryRouteRef(taskSnapshot.taskId),
      operatorVisibleWorkRef: this.operatorVisibleWorkRef(taskSnapshot.taskId),
      blockedActionScopeRefs: ["start_review", "select_endpoint", "task_release"],
    });

    return this.triageService.refreshActiveLease({
      taskId: taskSnapshot.taskId,
      presentedOwnershipEpoch: taskSnapshot.ownershipEpoch,
      presentedFencingToken: taskSnapshot.fencingToken,
      presentedLineageFenceEpoch: taskSnapshot.currentLineageFenceEpoch,
      nextOwnershipEpoch: reacquired.lease.toSnapshot().ownershipEpoch,
      nextLineageFenceEpoch: reacquired.lineageFence.currentEpoch,
      nextFencingToken: reacquired.lease.toSnapshot().fencingToken,
      lifecycleLeaseRef: reacquired.lease.toSnapshot().leaseId,
      leaseAuthorityRef: DEFAULT_LEASE_AUTHORITY_REF,
      leaseTtlSeconds: reacquired.lease.toSnapshot().leaseTtlSeconds,
      refreshedAt: input.reacquiredAt,
    });
  }

  async releaseTask(input: Phase3KernelReleaseInput): Promise<Phase3TriageTransitionResult> {
    const task = await this.requireTask(input.taskId);
    const taskSnapshot = task.toSnapshot();
    const leaseContext = this.requireCurrentLeaseContext(task);
    const command = await this.issueSettledCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.releasedAt,
      actionScope: "task_release",
      semanticPayload: {
        closeBlockReason: input.closeBlockReason ?? null,
      },
      leaseContext,
    });
    const released = await this.leaseAuthority.releaseLease({
      domain: TRIAGE_DOMAIN,
      domainObjectRef: taskSnapshot.taskId,
      leaseId: leaseContext.leaseId,
      presentedOwnershipEpoch: leaseContext.ownershipEpoch,
      presentedFencingToken: leaseContext.fencingToken,
      releasedAt: input.releasedAt,
      closeBlockReason: input.closeBlockReason ?? null,
      sameShellRecoveryRouteRef: this.recoveryRouteRef(taskSnapshot.taskId),
      operatorVisibleWorkRef: this.operatorVisibleWorkRef(taskSnapshot.taskId),
      blockedActionScopeRefs: ["task_release", "task_claim"],
      detectedByRef: input.actorRef,
    });

    return this.triageService.releaseTask({
      taskId: taskSnapshot.taskId,
      presentedOwnershipEpoch: taskSnapshot.ownershipEpoch,
      presentedFencingToken: taskSnapshot.fencingToken,
      presentedLineageFenceEpoch: taskSnapshot.currentLineageFenceEpoch,
      nextLineageFenceEpoch: released.lineageFence.currentEpoch,
      releasedAt: input.releasedAt,
      command,
    });
  }

  async markStaleOwnerDetected(
    input: Phase3KernelStaleOwnerInput,
  ): Promise<Phase3TriageTransitionResult> {
    const task = await this.requireTask(input.taskId);
    const taskSnapshot = task.toSnapshot();
    const leaseContext = this.requireCurrentLeaseContext(task);
    const broken = await this.leaseAuthority.breakLease({
      domain: TRIAGE_DOMAIN,
      domainObjectRef: taskSnapshot.taskId,
      leaseId: leaseContext.leaseId,
      brokenAt: input.detectedAt,
      authorizedByRef: input.authorizedByRef,
      breakReason: input.breakReason,
      sameShellRecoveryRouteRef: this.recoveryRouteRef(taskSnapshot.taskId),
      operatorVisibleWorkRef: this.operatorVisibleWorkRef(taskSnapshot.taskId),
      blockedActionScopeRefs: ["task_claim", "start_review", "task_release"],
      breakGuardSeconds: input.breakGuardSeconds ?? 0,
    });

    return this.triageService.markStaleOwnerDetected({
      taskId: taskSnapshot.taskId,
      staleOwnerRecoveryRef: broken.recovery.staleOwnershipRecoveryId,
      nextLineageFenceEpoch: broken.lineageFence.currentEpoch,
      detectedAt: input.detectedAt,
      broken: true,
    });
  }

  async takeOverStaleTask(input: Phase3KernelTakeoverInput): Promise<Phase3TriageTransitionResult> {
    const task = await this.requireTask(input.taskId);
    const taskSnapshot = task.toSnapshot();
    const requestContext = this.requireTaskRequestContext(taskSnapshot.taskId);
    const priorLeaseRef = taskSnapshot.lifecycleLeaseRef ?? "missing_prior_lease_ref";
    const takeover = await this.leaseAuthority.takeoverLease({
      priorLeaseId: priorLeaseRef,
      requestId: taskSnapshot.requestId,
      episodeId: requestContext.episodeId,
      requestLineageRef: requestContext.requestLineageRef,
      domain: TRIAGE_DOMAIN,
      domainObjectRef: taskSnapshot.taskId,
      governingObjectVersionRef: this.governingVersionRef(task),
      leaseAuthorityRef: DEFAULT_LEASE_AUTHORITY_REF,
      toOwnerActorRef: input.actorRef,
      toOwnerSessionRef: input.ownerSessionRef ?? `session_${input.actorRef}`,
      leaseScopeComponents: ["task_claim", "triage_mutation"],
      leaseTtlSeconds: input.leaseTtlSeconds ?? 300,
      takeoverReason: input.takeoverReason,
      authorizedByRef: input.authorizedByRef,
      committedAt: input.takeoverAt,
      sameShellRecoveryRouteRef: this.recoveryRouteRef(taskSnapshot.taskId),
      operatorVisibleWorkRef: this.operatorVisibleWorkRef(taskSnapshot.taskId),
      blockedActionScopeRefs: ["task_claim", "task_release"],
    });
    const replacementLease = takeover.replacementLease.toSnapshot();
    const command = await this.issueSettledCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.takeoverAt,
      actionScope: "take_over_stale_task",
      semanticPayload: {
        priorLeaseRef,
        replacementLeaseRef: replacementLease.leaseId,
        recoveryRef: takeover.recovery.staleOwnershipRecoveryId,
      },
      leaseContext: {
        leaseId: replacementLease.leaseId,
        ownershipEpoch: replacementLease.ownershipEpoch,
        fencingToken: replacementLease.fencingToken,
        lineageFenceEpoch: takeover.lineageFence.currentEpoch,
        governingObjectVersionRef: this.governingVersionRef(task),
      },
    });

    return this.triageService.takeOverStaleTask({
      taskId: taskSnapshot.taskId,
      actorRef: input.actorRef,
      staleOwnerRecoveryRef: takeover.recovery.staleOwnershipRecoveryId,
      nextOwnershipEpoch: replacementLease.ownershipEpoch,
      nextLineageFenceEpoch: takeover.lineageFence.currentEpoch,
      nextFencingToken: replacementLease.fencingToken,
      lifecycleLeaseRef: replacementLease.leaseId,
      leaseAuthorityRef: DEFAULT_LEASE_AUTHORITY_REF,
      leaseTtlSeconds: replacementLease.leaseTtlSeconds,
      takeoverAt: input.takeoverAt,
      command,
    });
  }

  async transitionTask(input: Phase3KernelTransitionInput): Promise<Phase3TriageTransitionResult> {
    const task = await this.requireTask(input.taskId);
    const taskSnapshot = task.toSnapshot();
    const command = await this.issueCommandForTaskState({
      task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: this.actionScopeForStatus(input.nextStatus),
      semanticPayload: {
        nextStatus: input.nextStatus,
        currentDecisionEpochRef: input.currentDecisionEpochRef ?? null,
        currentEndpointDecisionRef: input.currentEndpointDecisionRef ?? null,
      },
    });
    return this.triageService.transitionTask({
      ...input,
      taskId: taskSnapshot.taskId,
      presentedOwnershipEpoch: taskSnapshot.ownershipEpoch,
      presentedFencingToken: taskSnapshot.fencingToken,
      presentedLineageFenceEpoch: taskSnapshot.currentLineageFenceEpoch,
      command,
    });
  }

  async markAwaitingPatientInfo(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & { moreInfoContractRef: string },
  ): Promise<Phase3TriageTransitionResult> {
    return this.transitionTask({ ...input, nextStatus: "awaiting_patient_info" });
  }

  async markReviewResumed(
    input: Omit<Phase3KernelTransitionInput, "nextStatus">,
  ): Promise<Phase3TriageTransitionResult> {
    return this.transitionTask({ ...input, nextStatus: "review_resumed" });
  }

  async markEndpointSelected(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & {
      currentDecisionEpochRef: string;
      currentEndpointDecisionRef: string;
    },
  ): Promise<Phase3TriageTransitionResult> {
    return this.transitionTask({ ...input, nextStatus: "endpoint_selected" });
  }

  async markEscalated(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & {
      currentDecisionEpochRef: string;
      escalationContractRef: string;
    },
  ): Promise<Phase3TriageTransitionResult> {
    return this.transitionTask({ ...input, nextStatus: "escalated" });
  }

  async markResolvedWithoutAppointment(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & {
      currentDecisionEpochRef: string;
      consequenceHookRef: string;
    },
  ): Promise<Phase3TriageTransitionResult> {
    return this.transitionTask({ ...input, nextStatus: "resolved_without_appointment" });
  }

  async markHandoffPending(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & {
      currentDecisionEpochRef: string;
      consequenceHookRef: string;
    },
  ): Promise<Phase3TriageTransitionResult> {
    return this.transitionTask({ ...input, nextStatus: "handoff_pending" });
  }

  async reopenTask(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & { reopenContractRef: string },
  ): Promise<Phase3TriageTransitionResult> {
    const task = await this.requireTask(input.taskId);
    const taskSnapshot = task.toSnapshot();
    const requestContext = this.requireTaskRequestContext(taskSnapshot.taskId);
    const currentLease =
      taskSnapshot.ownershipState === "active" &&
      taskSnapshot.lifecycleLeaseRef !== null &&
      taskSnapshot.leaseAuthorityRef !== null
        ? this.requireCurrentLeaseContext(task)
        : null;

    let command: Phase3CommandContext;
    let nextOwnershipEpoch: number;
    let nextLineageFenceEpoch: number;
    let nextFencingToken: string;
    let lifecycleLeaseRef: string;
    let leaseTtlSeconds: number;

    if (currentLease) {
      command = await this.issueSettledCommand({
        task,
        actorRef: input.actorRef,
        recordedAt: input.recordedAt,
        actionScope: "reopen",
        semanticPayload: {
          reopenContractRef: input.reopenContractRef,
          continuationMode: "current_live_lease",
        },
        leaseContext: currentLease,
      });
      nextOwnershipEpoch = taskSnapshot.ownershipEpoch;
      nextLineageFenceEpoch = taskSnapshot.currentLineageFenceEpoch;
      nextFencingToken = taskSnapshot.fencingToken;
      lifecycleLeaseRef = currentLease.leaseId;
      leaseTtlSeconds = taskSnapshot.leaseTtlSeconds ?? 300;
    } else {
      await this.releaseDetachedReopenLeaseIfNeeded(task, input.actorRef, input.recordedAt);
      const acquired = await this.leaseAuthority.acquireLease({
        requestId: taskSnapshot.requestId,
        episodeId: requestContext.episodeId,
        requestLineageRef: requestContext.requestLineageRef,
        domain: TRIAGE_DOMAIN,
        domainObjectRef: taskSnapshot.taskId,
        leaseAuthorityRef: DEFAULT_LEASE_AUTHORITY_REF,
        ownerActorRef: input.actorRef,
        ownerSessionRef: `session_${input.actorRef}`,
        governingObjectVersionRef: this.governingVersionRef(task),
        leaseScopeComponents: ["task_reopen", "triage_mutation"],
        leaseTtlSeconds: 300,
        acquiredAt: input.recordedAt,
        sameShellRecoveryRouteRef: this.recoveryRouteRef(taskSnapshot.taskId),
        operatorVisibleWorkRef: this.operatorVisibleWorkRef(taskSnapshot.taskId),
        blockedActionScopeRefs: ["reopen", "move_to_queue"],
      });
      nextOwnershipEpoch = acquired.lease.toSnapshot().ownershipEpoch;
      nextLineageFenceEpoch = acquired.lineageFence.currentEpoch;
      nextFencingToken = acquired.lease.toSnapshot().fencingToken;
      lifecycleLeaseRef = acquired.lease.toSnapshot().leaseId;
      leaseTtlSeconds = acquired.lease.toSnapshot().leaseTtlSeconds;
      command = await this.issueSettledCommand({
        task,
        actorRef: input.actorRef,
        recordedAt: input.recordedAt,
        actionScope: "reopen",
        semanticPayload: {
          reopenContractRef: input.reopenContractRef,
          continuationMode: "fresh_lease",
        },
        leaseContext: {
          leaseId: lifecycleLeaseRef,
          ownershipEpoch: nextOwnershipEpoch,
          fencingToken: nextFencingToken,
          lineageFenceEpoch: nextLineageFenceEpoch,
          governingObjectVersionRef: this.governingVersionRef(task),
        },
      });
    }

    return this.triageService.reopenTask({
      taskId: taskSnapshot.taskId,
      actorRef: input.actorRef,
      presentedOwnershipEpoch: taskSnapshot.ownershipEpoch,
      presentedFencingToken: taskSnapshot.fencingToken,
      presentedLineageFenceEpoch: taskSnapshot.currentLineageFenceEpoch,
      nextOwnershipEpoch,
      nextLineageFenceEpoch,
      nextFencingToken,
      lifecycleLeaseRef,
      leaseAuthorityRef: DEFAULT_LEASE_AUTHORITY_REF,
      leaseTtlSeconds,
      reopenedAt: input.recordedAt,
      reopenContractRef: input.reopenContractRef,
      retainCurrentLease: currentLease !== null,
      selectedAnchorRef: input.selectedAnchorRef,
      selectedAnchorTupleHash: input.selectedAnchorTupleHash,
      command,
    });
  }

  async closeTask(
    input: Omit<Phase3KernelTransitionInput, "nextStatus"> & {
      lifecycleCoordinatorSignalRef: string;
    },
  ): Promise<Phase3TriageTransitionResult> {
    return this.transitionTask({ ...input, nextStatus: "closed" });
  }

  private async ensureRequestContext(input: {
    requestId: string;
    episodeId: string;
    requestLineageRef: string;
    createdAt: string;
  }): Promise<void> {
    const submissionRepositories =
      this.controlPlaneRepositories as unknown as SubmissionBackboneDependencies;
    const episode = await this.controlPlaneRepositories.getEpisode(input.episodeId);
    if (!episode) {
      await this.controlPlaneRepositories.saveEpisode(
        EpisodeAggregate.create({
          episodeId: input.episodeId,
          episodeFingerprint: `episode_fp_${input.episodeId}`,
          openedAt: input.createdAt,
        }),
      );
    }
    const request = await this.controlPlaneRepositories.getRequest(input.requestId);
    if (!request) {
      await this.controlPlaneRepositories.saveRequest(
        RequestAggregate.create({
          requestId: input.requestId,
          episodeId: input.episodeId,
          originEnvelopeRef: `origin_envelope_${input.requestId}`,
          promotionRecordRef: `promotion_${input.requestId}`,
          tenantId: "tenant_phase3_triage",
          sourceChannel: "support_assisted_capture",
          originIngressRecordRef: `ingress_${input.requestId}`,
          normalizedSubmissionRef: `normalized_${input.requestId}`,
          requestType: "clinical_question",
          requestLineageRef: input.requestLineageRef,
          createdAt: input.createdAt,
        }),
      );
    }
    const requestLineage = await submissionRepositories.getRequestLineage(input.requestLineageRef);
    if (!requestLineage) {
      await submissionRepositories.saveRequestLineage(
        RequestLineageAggregate.create({
          requestLineageId: input.requestLineageRef,
          episodeRef: input.episodeId,
          requestRef: input.requestId,
          originEnvelopeRef: `origin_envelope_${input.requestId}`,
          submissionPromotionRecordRef: `promotion_${input.requestId}`,
          continuityWitnessRef: `continuity_${input.requestId}`,
          createdAt: input.createdAt,
        }),
      );
    }
  }

  private requireTaskRequestContext(taskId: string): Phase3TaskRequestContext {
    const context = this.taskRequestContextById.get(taskId);
    if (!context) {
      throw new Error(`Task request context is missing for ${taskId}.`);
    }
    return context;
  }

  private async requireTask(taskId: string): Promise<Phase3TriageTaskDocument> {
    const task = await this.triageRepositories.getTask(taskId);
    if (!task) {
      throw new Error(`TriageTask ${taskId} is required.`);
    }
    return task;
  }

  private governingVersionRef(task: Phase3TriageTaskDocument): string {
    return `${task.toSnapshot().taskId}@v${task.version}`;
  }

  private recoveryRouteRef(taskId: string): string {
    return `/workspace/tasks/${taskId}/recover`;
  }

  private operatorVisibleWorkRef(taskId: string): string {
    return `work_${taskId}`;
  }

  private async currentControlPlaneVersionRef(
    taskId: string,
    fallback: string,
  ): Promise<string> {
    const authorityState = await this.controlPlaneRepositories.getLeaseAuthorityState(
      `${TRIAGE_DOMAIN}::${taskId}`,
    );
    return authorityState?.governingObjectVersionRef ?? fallback;
  }

  private requireCurrentLeaseContext(task: Phase3TriageTaskDocument): LeaseCommandContext {
    const snapshot = task.toSnapshot();
    if (
      snapshot.lifecycleLeaseRef === null ||
      snapshot.ownershipState !== "active" ||
      snapshot.leaseAuthorityRef === null
    ) {
      throw new Error(`Task ${snapshot.taskId} does not currently hold a live lease.`);
    }
    return {
      leaseId: snapshot.lifecycleLeaseRef,
      ownershipEpoch: snapshot.ownershipEpoch,
      fencingToken: snapshot.fencingToken,
      lineageFenceEpoch: snapshot.currentLineageFenceEpoch,
      governingObjectVersionRef: this.governingVersionRef(task),
    };
  }

  private async releaseDetachedReopenLeaseIfNeeded(
    task: Phase3TriageTaskDocument,
    actorRef: string,
    recordedAt: string,
  ): Promise<void> {
    const snapshot = task.toSnapshot();
    if (
      snapshot.ownershipState === "active" &&
      snapshot.lifecycleLeaseRef !== null &&
      snapshot.leaseAuthorityRef !== null
    ) {
      return;
    }
    const authorityState = await this.controlPlaneRepositories.getLeaseAuthorityState(
      `${TRIAGE_DOMAIN}::${snapshot.taskId}`,
    );
    if (!authorityState?.currentLeaseRef) {
      return;
    }
    const currentLease = await this.controlPlaneRepositories.getRequestLifecycleLease(
      authorityState.currentLeaseRef,
    );
    const leaseSnapshot = currentLease?.toSnapshot();
    if (
      !leaseSnapshot ||
      leaseSnapshot.state !== "active" ||
      leaseSnapshot.domainObjectRef !== snapshot.taskId ||
      leaseSnapshot.ownershipEpoch !== snapshot.ownershipEpoch ||
      leaseSnapshot.fencingToken !== snapshot.fencingToken ||
      authorityState.currentLineageEpoch !== snapshot.currentLineageFenceEpoch
    ) {
      return;
    }
    await this.leaseAuthority.releaseLease({
      domain: TRIAGE_DOMAIN,
      domainObjectRef: snapshot.taskId,
      leaseId: leaseSnapshot.leaseId,
      presentedOwnershipEpoch: leaseSnapshot.ownershipEpoch,
      presentedFencingToken: leaseSnapshot.fencingToken,
      releasedAt: recordedAt,
      closeBlockReason: "reopen_reacquire",
      sameShellRecoveryRouteRef: this.recoveryRouteRef(snapshot.taskId),
      operatorVisibleWorkRef: this.operatorVisibleWorkRef(snapshot.taskId),
      blockedActionScopeRefs: ["reopen", "task_claim"],
      detectedByRef: actorRef,
    });
  }

  private actionScopeForStatus(status: Phase3TriageTaskStatus): string {
    switch (status) {
      case "queued":
        return "move_to_queue";
      case "awaiting_patient_info":
        return "request_more_info";
      case "review_resumed":
        return "resume_review";
      case "endpoint_selected":
        return "select_endpoint";
      case "escalated":
        return "escalate";
      case "resolved_without_appointment":
        return "resolved_without_appointment";
      case "handoff_pending":
        return "handoff_pending";
      case "reopened":
        return "reopen";
      case "closed":
        return "close";
      default:
        return "task_release";
    }
  }

  private asDomainCommandContext(witness: Phase3CommandWitness): Phase3CommandContext {
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

  private buildSyntheticCommandWitness(input: {
    task: Phase3TriageTaskDocument;
    actorRef: string;
    recordedAt: string;
    actionScope: string;
  }): Phase3CommandContext {
    const snapshot = input.task.toSnapshot();
    const suffix = `${snapshot.taskId}_${input.actionScope}_${input.recordedAt}`;
    return this.asDomainCommandContext({
      actorRef: input.actorRef,
      routeIntentTupleHash: `synthetic_route_tuple_${suffix}`,
      routeIntentBindingRef: `synthetic_route_binding_${suffix}`,
      commandActionRecordRef: `synthetic_action_${suffix}`,
      commandSettlementRecordRef: `synthetic_settlement_${suffix}`,
      transitionEnvelopeRef: `synthetic_transition_envelope_${suffix}`,
      releaseRecoveryDispositionRef: `synthetic_recovery_${suffix}`,
      causalToken: `synthetic_cause_${suffix}`,
      recordedAt: input.recordedAt,
      recoveryRouteRef: this.recoveryRouteRef(snapshot.taskId),
    });
  }

  private buildCommandWitness(input: {
    actorRef: string;
    actionRecord: CommandActionRecordDocument;
    settlementRecord: CommandSettlementRecordDocument;
  }): Phase3CommandContext {
    const action = input.actionRecord.toSnapshot();
    const settlement = input.settlementRecord.toSnapshot();
    return this.asDomainCommandContext({
      actorRef: input.actorRef,
      routeIntentTupleHash: action.routeIntentTupleHash,
      routeIntentBindingRef: action.routeIntentRef,
      commandActionRecordRef: action.actionRecordId,
      commandSettlementRecordRef: settlement.settlementId,
      transitionEnvelopeRef: `transition_envelope_${action.actionRecordId}_${settlement.settlementId}`,
      releaseRecoveryDispositionRef:
        settlement.sameShellRecoveryRef ?? `recovery_disposition_${action.actionRecordId}`,
      causalToken: action.causalToken,
      recordedAt: settlement.recordedAt,
      recoveryRouteRef: settlement.sameShellRecoveryRef ?? this.recoveryRouteRef(action.governingObjectRef),
    });
  }

  private async issueCommandForTaskState(input: {
    task: Phase3TriageTaskDocument;
    actorRef: string;
    recordedAt: string;
    actionScope: string;
    semanticPayload: Record<string, unknown>;
  }): Promise<Phase3CommandContext> {
    const snapshot = input.task.toSnapshot();
    if (
      snapshot.ownershipState === "active" &&
      snapshot.lifecycleLeaseRef !== null &&
      snapshot.leaseAuthorityRef !== null
    ) {
      return this.issueSettledCommand({
        ...input,
        leaseContext: this.requireCurrentLeaseContext(input.task),
      });
    }
    return this.buildSyntheticCommandWitness(input);
  }

  private async issueSettledCommand(input: {
    task: Phase3TriageTaskDocument;
    actorRef: string;
    recordedAt: string;
    actionScope: string;
    semanticPayload: Record<string, unknown>;
    leaseContext: LeaseCommandContext;
  }): Promise<Phase3CommandContext> {
    const task = input.task.toSnapshot();
    const governingObjectVersionRef = await this.currentControlPlaneVersionRef(
      task.taskId,
      input.leaseContext.governingObjectVersionRef,
    );
    const action = await this.leaseAuthority.registerCommandAction({
      leaseId: input.leaseContext.leaseId,
      domain: TRIAGE_DOMAIN,
      domainObjectRef: task.taskId,
      governingObjectVersionRef,
      presentedOwnershipEpoch: input.leaseContext.ownershipEpoch,
      presentedFencingToken: input.leaseContext.fencingToken,
      presentedLineageFenceEpoch: input.leaseContext.lineageFenceEpoch,
      actionScope: input.actionScope,
      governingObjectRef: task.taskId,
      canonicalObjectDescriptorRef: TRIAGE_DESCRIPTOR,
      initiatingBoundedContextRef: TRIAGE_DOMAIN,
      governingBoundedContextRef: TRIAGE_DOMAIN,
      lineageScope: "request",
      routeIntentRef: `route_intent_${input.actionScope}_${task.taskId}`,
      routeContractDigestRef: `route_contract_digest_${input.actionScope}_v1`,
      requiredContextBoundaryRefs: [],
      parentAnchorRef: task.launchContextRef,
      edgeCorrelationId: `edge_${input.actionScope}_${task.taskId}`,
      initiatingUiEventRef: `ui_event_${input.actionScope}_${task.taskId}`,
      initiatingUiEventCausalityFrameRef: `ui_frame_${input.actionScope}_${task.taskId}`,
      actingContextRef: "staff_workspace",
      policyBundleRef: "policy_triage_workspace_v1",
      sourceCommandId: `cmd_${input.actionScope}_${task.taskId}_${input.recordedAt}`,
      transportCorrelationId: `transport_${input.actionScope}_${task.taskId}`,
      semanticPayload: input.semanticPayload,
      idempotencyKey: `idempotency_${input.actionScope}_${task.taskId}_${input.recordedAt}`,
      idempotencyRecordRef: `idempotency_record_${input.actionScope}_${task.taskId}`,
      commandFollowingTokenRef: `command_follow_${input.actionScope}_${task.taskId}`,
      expectedEffectSetRefs: [`triage.${task.taskId}.${input.actionScope}`],
      causalToken: `causal_${input.actionScope}_${task.taskId}_${input.recordedAt}`,
      createdAt: input.recordedAt,
      sameShellRecoveryRouteRef: this.recoveryRouteRef(task.taskId),
      operatorVisibleWorkRef: this.operatorVisibleWorkRef(task.taskId),
      blockedActionScopeRefs: [input.actionScope],
      detectedByRef: input.actorRef,
    });
    const settlementInput: RecordCommandSettlementInput = {
      actionRecordRef: action.actionRecord.actionRecordId,
      replayDecisionClass: "distinct",
      result: "applied",
      processingAcceptanceState: "accepted_for_processing",
      externalObservationState: "projection_visible",
      authoritativeOutcomeState: "settled",
      authoritativeProofClass: "review_disposition",
      sameShellRecoveryRef: this.recoveryRouteRef(task.taskId),
      projectionVersionRef: `${task.taskId}@projection_${input.recordedAt}`,
      uiTransitionSettlementRef: `ui_transition_${action.actionRecord.actionRecordId}`,
      projectionVisibilityRef: "staff_workspace",
      auditRecordRef: `audit_${action.actionRecord.actionRecordId}`,
      blockingRefs: [],
      quietEligibleAt: input.recordedAt,
      lastSafeAnchorRef: task.launchContextRef,
      allowedSummaryTier: "full",
      recordedAt: input.recordedAt,
    };
    const settlement = await this.settlementAuthority.recordSettlement(settlementInput);
    return this.buildCommandWitness({
      actorRef: input.actorRef,
      actionRecord: action.actionRecord,
      settlementRecord: settlement.settlement,
    });
  }
}

export function createPhase3TriageKernelApplication(options?: {
  triageRepositories?: Phase3TriageKernelRepositories;
  controlPlaneRepositories?: CommandSettlementDependencies;
  idGenerator?: BackboneIdGenerator;
}): Phase3TriageKernelApplication {
  return new Phase3TriageKernelApplicationImpl(options);
}
