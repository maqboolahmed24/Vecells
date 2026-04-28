import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import type { Phase3TaskLocalAckState } from "./phase3-triage-kernel";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function saveWithCas<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  } else if (current) {
    invariant(
      current.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, row);
}

function nextKernelId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export type TaskCompletionAuthoritativeSettlementState =
  | "pending"
  | "settled"
  | "recovery_required"
  | "manual_handoff_required"
  | "stale_recoverable";

export type TaskCompletionNextTaskLaunchState = "blocked" | "gated" | "ready" | "launched";

export type OperatorHandoffType =
  | "booking"
  | "pharmacy"
  | "supervisor"
  | "operations"
  | "manual";

export type OperatorHandoffSettlementState =
  | "pending_acceptance"
  | "acknowledged"
  | "recovery_required"
  | "superseded";

const authoritativeSettlementStates: readonly TaskCompletionAuthoritativeSettlementState[] = [
  "pending",
  "settled",
  "recovery_required",
  "manual_handoff_required",
  "stale_recoverable",
];

const nextTaskLaunchStates: readonly TaskCompletionNextTaskLaunchState[] = [
  "blocked",
  "gated",
  "ready",
  "launched",
];

const handoffTypes: readonly OperatorHandoffType[] = [
  "booking",
  "pharmacy",
  "supervisor",
  "operations",
  "manual",
];

const handoffSettlementStates: readonly OperatorHandoffSettlementState[] = [
  "pending_acceptance",
  "acknowledged",
  "recovery_required",
  "superseded",
];

const localAckStates: readonly Phase3TaskLocalAckState[] = ["none", "shown", "superseded"];

export interface TaskCompletionSettlementEnvelopeSnapshot {
  taskCompletionSettlementEnvelopeId: string;
  taskId: string;
  actionType: string;
  selectedAnchorRef: string;
  sourceQueueRankSnapshotRef: string;
  workspaceTrustEnvelopeRef: string;
  localAckState: Phase3TaskLocalAckState;
  authoritativeSettlementState: TaskCompletionAuthoritativeSettlementState;
  nextOwnerRef: string | null;
  closureSummaryRef: string;
  blockingReasonRefs: readonly string[];
  nextTaskLaunchState: TaskCompletionNextTaskLaunchState;
  nextTaskLaunchLeaseRef: string | null;
  experienceContinuityEvidenceRef: string;
  releaseConditionRef: string;
  operatorHandoffFrameRef: string | null;
  settledAt: string;
  settlementRevision: number;
  version: number;
}

export interface OperatorHandoffFrameSnapshot {
  operatorHandoffFrameId: string;
  taskId: string;
  handoffType: OperatorHandoffType;
  nextOwnerRef: string;
  readinessSummaryRef: string;
  pendingDependencyRefs: readonly string[];
  confirmedArtifactRef: string | null;
  settlementState: OperatorHandoffSettlementState;
  generatedAt: string;
  handoffRevision: number;
  version: number;
}

export interface Phase3TaskCompletionContinuityBundle {
  completionEnvelope: TaskCompletionSettlementEnvelopeSnapshot | null;
  operatorHandoffFrame: OperatorHandoffFrameSnapshot | null;
}

function normalizeTaskCompletionSettlementEnvelope(
  input: TaskCompletionSettlementEnvelopeSnapshot,
): TaskCompletionSettlementEnvelopeSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.settlementRevision, "settlementRevision");
  invariant(
    authoritativeSettlementStates.includes(input.authoritativeSettlementState),
    "INVALID_TASK_COMPLETION_SETTLEMENT_STATE",
    "Unsupported TaskCompletionSettlementEnvelope.authoritativeSettlementState.",
  );
  invariant(
    nextTaskLaunchStates.includes(input.nextTaskLaunchState),
    "INVALID_TASK_COMPLETION_NEXT_TASK_STATE",
    "Unsupported TaskCompletionSettlementEnvelope.nextTaskLaunchState.",
  );
  invariant(
    localAckStates.includes(input.localAckState),
    "INVALID_TASK_COMPLETION_LOCAL_ACK_STATE",
    "Unsupported TaskCompletionSettlementEnvelope.localAckState.",
  );
  return {
    ...input,
    taskCompletionSettlementEnvelopeId: requireRef(
      input.taskCompletionSettlementEnvelopeId,
      "taskCompletionSettlementEnvelopeId",
    ),
    taskId: requireRef(input.taskId, "taskId"),
    actionType: requireRef(input.actionType, "actionType"),
    selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
    sourceQueueRankSnapshotRef: requireRef(
      input.sourceQueueRankSnapshotRef,
      "sourceQueueRankSnapshotRef",
    ),
    workspaceTrustEnvelopeRef: requireRef(
      input.workspaceTrustEnvelopeRef,
      "workspaceTrustEnvelopeRef",
    ),
    nextOwnerRef: optionalRef(input.nextOwnerRef),
    closureSummaryRef: requireRef(input.closureSummaryRef, "closureSummaryRef"),
    blockingReasonRefs: uniqueSorted(input.blockingReasonRefs),
    nextTaskLaunchLeaseRef: optionalRef(input.nextTaskLaunchLeaseRef),
    experienceContinuityEvidenceRef: requireRef(
      input.experienceContinuityEvidenceRef,
      "experienceContinuityEvidenceRef",
    ),
    releaseConditionRef: requireRef(input.releaseConditionRef, "releaseConditionRef"),
    operatorHandoffFrameRef: optionalRef(input.operatorHandoffFrameRef),
    settledAt: ensureIsoTimestamp(input.settledAt, "settledAt"),
  };
}

function normalizeOperatorHandoffFrame(
  input: OperatorHandoffFrameSnapshot,
): OperatorHandoffFrameSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.handoffRevision, "handoffRevision");
  invariant(
    handoffTypes.includes(input.handoffType),
    "INVALID_OPERATOR_HANDOFF_TYPE",
    "Unsupported OperatorHandoffFrame.handoffType.",
  );
  invariant(
    handoffSettlementStates.includes(input.settlementState),
    "INVALID_OPERATOR_HANDOFF_SETTLEMENT_STATE",
    "Unsupported OperatorHandoffFrame.settlementState.",
  );
  return {
    ...input,
    operatorHandoffFrameId: requireRef(input.operatorHandoffFrameId, "operatorHandoffFrameId"),
    taskId: requireRef(input.taskId, "taskId"),
    nextOwnerRef: requireRef(input.nextOwnerRef, "nextOwnerRef"),
    readinessSummaryRef: requireRef(input.readinessSummaryRef, "readinessSummaryRef"),
    pendingDependencyRefs: uniqueSorted(input.pendingDependencyRefs),
    confirmedArtifactRef: optionalRef(input.confirmedArtifactRef),
    generatedAt: ensureIsoTimestamp(input.generatedAt, "generatedAt"),
  };
}

export interface Phase3TaskCompletionContinuityRepositories {
  getTaskCompletionSettlementEnvelope(
    taskCompletionSettlementEnvelopeId: string,
  ): Promise<TaskCompletionSettlementEnvelopeSnapshot | null>;
  saveTaskCompletionSettlementEnvelope(
    envelope: TaskCompletionSettlementEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listTaskCompletionSettlementEnvelopesForTask(
    taskId: string,
  ): Promise<readonly TaskCompletionSettlementEnvelopeSnapshot[]>;
  getCurrentTaskCompletionSettlementEnvelopeForTask(
    taskId: string,
  ): Promise<TaskCompletionSettlementEnvelopeSnapshot | null>;

  getOperatorHandoffFrame(operatorHandoffFrameId: string): Promise<OperatorHandoffFrameSnapshot | null>;
  saveOperatorHandoffFrame(
    frame: OperatorHandoffFrameSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listOperatorHandoffFramesForTask(taskId: string): Promise<readonly OperatorHandoffFrameSnapshot[]>;
  getCurrentOperatorHandoffFrameForTask(taskId: string): Promise<OperatorHandoffFrameSnapshot | null>;
}

class InMemoryPhase3TaskCompletionContinuityStore
  implements Phase3TaskCompletionContinuityRepositories
{
  private readonly envelopes = new Map<string, TaskCompletionSettlementEnvelopeSnapshot>();
  private readonly envelopeIdsByTask = new Map<string, string[]>();
  private readonly handoffFrames = new Map<string, OperatorHandoffFrameSnapshot>();
  private readonly handoffIdsByTask = new Map<string, string[]>();

  async getTaskCompletionSettlementEnvelope(
    taskCompletionSettlementEnvelopeId: string,
  ): Promise<TaskCompletionSettlementEnvelopeSnapshot | null> {
    return this.envelopes.get(taskCompletionSettlementEnvelopeId) ?? null;
  }

  async saveTaskCompletionSettlementEnvelope(
    envelope: TaskCompletionSettlementEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = normalizeTaskCompletionSettlementEnvelope(envelope);
    saveWithCas(this.envelopes, normalized.taskCompletionSettlementEnvelopeId, normalized, options);
    const existingIds = this.envelopeIdsByTask.get(normalized.taskId) ?? [];
    if (!existingIds.includes(normalized.taskCompletionSettlementEnvelopeId)) {
      this.envelopeIdsByTask.set(normalized.taskId, [
        ...existingIds,
        normalized.taskCompletionSettlementEnvelopeId,
      ]);
    }
  }

  async listTaskCompletionSettlementEnvelopesForTask(
    taskId: string,
  ): Promise<readonly TaskCompletionSettlementEnvelopeSnapshot[]> {
    const ids = this.envelopeIdsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.envelopes.get(id))
      .filter((entry): entry is TaskCompletionSettlementEnvelopeSnapshot => entry !== undefined)
      .sort((left, right) =>
        left.settlementRevision === right.settlementRevision
          ? compareIso(left.settledAt, right.settledAt)
          : left.settlementRevision - right.settlementRevision,
      );
  }

  async getCurrentTaskCompletionSettlementEnvelopeForTask(
    taskId: string,
  ): Promise<TaskCompletionSettlementEnvelopeSnapshot | null> {
    return (await this.listTaskCompletionSettlementEnvelopesForTask(taskId)).at(-1) ?? null;
  }

  async getOperatorHandoffFrame(
    operatorHandoffFrameId: string,
  ): Promise<OperatorHandoffFrameSnapshot | null> {
    return this.handoffFrames.get(operatorHandoffFrameId) ?? null;
  }

  async saveOperatorHandoffFrame(
    frame: OperatorHandoffFrameSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = normalizeOperatorHandoffFrame(frame);
    saveWithCas(this.handoffFrames, normalized.operatorHandoffFrameId, normalized, options);
    const existingIds = this.handoffIdsByTask.get(normalized.taskId) ?? [];
    if (!existingIds.includes(normalized.operatorHandoffFrameId)) {
      this.handoffIdsByTask.set(normalized.taskId, [
        ...existingIds,
        normalized.operatorHandoffFrameId,
      ]);
    }
  }

  async listOperatorHandoffFramesForTask(taskId: string): Promise<readonly OperatorHandoffFrameSnapshot[]> {
    const ids = this.handoffIdsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.handoffFrames.get(id))
      .filter((entry): entry is OperatorHandoffFrameSnapshot => entry !== undefined)
      .sort((left, right) =>
        left.handoffRevision === right.handoffRevision
          ? compareIso(left.generatedAt, right.generatedAt)
          : left.handoffRevision - right.handoffRevision,
      );
  }

  async getCurrentOperatorHandoffFrameForTask(
    taskId: string,
  ): Promise<OperatorHandoffFrameSnapshot | null> {
    return (await this.listOperatorHandoffFramesForTask(taskId)).at(-1) ?? null;
  }
}

export function createPhase3TaskCompletionContinuityKernelStore(): Phase3TaskCompletionContinuityRepositories {
  return new InMemoryPhase3TaskCompletionContinuityStore();
}

export interface SettleTaskCompletionEnvelopeInput {
  taskCompletionSettlementEnvelopeId?: string;
  taskId: string;
  actionType: string;
  selectedAnchorRef: string;
  sourceQueueRankSnapshotRef: string;
  workspaceTrustEnvelopeRef: string;
  localAckState: Phase3TaskLocalAckState;
  authoritativeSettlementState: TaskCompletionAuthoritativeSettlementState;
  nextOwnerRef?: string | null;
  closureSummaryRef: string;
  blockingReasonRefs: readonly string[];
  nextTaskLaunchState: TaskCompletionNextTaskLaunchState;
  nextTaskLaunchLeaseRef?: string | null;
  experienceContinuityEvidenceRef: string;
  releaseConditionRef: string;
  operatorHandoffFrameRef?: string | null;
  settledAt: string;
}

export interface RecordOperatorHandoffFrameInput {
  operatorHandoffFrameId?: string;
  taskId: string;
  handoffType: OperatorHandoffType;
  nextOwnerRef: string;
  readinessSummaryRef: string;
  pendingDependencyRefs: readonly string[];
  confirmedArtifactRef?: string | null;
  settlementState: OperatorHandoffSettlementState;
  generatedAt: string;
}

export interface Phase3TaskCompletionContinuityKernelService {
  queryTaskBundle(taskId: string): Promise<Phase3TaskCompletionContinuityBundle>;
  settleTaskCompletion(input: SettleTaskCompletionEnvelopeInput): Promise<{
    completionEnvelope: TaskCompletionSettlementEnvelopeSnapshot;
    reusedExisting: boolean;
  }>;
  recordOperatorHandoffFrame(input: RecordOperatorHandoffFrameInput): Promise<{
    operatorHandoffFrame: OperatorHandoffFrameSnapshot;
    reusedExisting: boolean;
  }>;
  listTaskCompletionSettlementEnvelopesForTask(
    taskId: string,
  ): Promise<readonly TaskCompletionSettlementEnvelopeSnapshot[]>;
  listOperatorHandoffFramesForTask(taskId: string): Promise<readonly OperatorHandoffFrameSnapshot[]>;
}

class Phase3TaskCompletionContinuityKernelServiceImpl
  implements Phase3TaskCompletionContinuityKernelService
{
  constructor(
    private readonly repositories: Phase3TaskCompletionContinuityRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async queryTaskBundle(taskId: string): Promise<Phase3TaskCompletionContinuityBundle> {
    return {
      completionEnvelope: await this.repositories.getCurrentTaskCompletionSettlementEnvelopeForTask(taskId),
      operatorHandoffFrame: await this.repositories.getCurrentOperatorHandoffFrameForTask(taskId),
    };
  }

  async settleTaskCompletion(input: SettleTaskCompletionEnvelopeInput): Promise<{
    completionEnvelope: TaskCompletionSettlementEnvelopeSnapshot;
    reusedExisting: boolean;
  }> {
    const latest = await this.repositories.getCurrentTaskCompletionSettlementEnvelopeForTask(input.taskId);
    const normalizedTuple = this.normalizeEnvelopeTuple(input);
    if (latest && this.sameEnvelopeTuple(latest, normalizedTuple)) {
      return {
        completionEnvelope: latest,
        reusedExisting: true,
      };
    }

    const requestedId = optionalRef(input.taskCompletionSettlementEnvelopeId);
    const updateInPlace = requestedId !== null && latest?.taskCompletionSettlementEnvelopeId === requestedId;
    const settlementRevision = (latest?.settlementRevision ?? 0) + 1;
    const completionEnvelope = normalizeTaskCompletionSettlementEnvelope(
      updateInPlace && latest
        ? {
            ...normalizedTuple,
            taskCompletionSettlementEnvelopeId: latest.taskCompletionSettlementEnvelopeId,
            settlementRevision,
            version: nextVersion(latest.version),
          }
        : {
            ...normalizedTuple,
            taskCompletionSettlementEnvelopeId:
              requestedId ?? nextKernelId(this.idGenerator, "phase3_task_completion_settlement_envelope"),
            settlementRevision,
            version: 1,
          },
    );
    await this.repositories.saveTaskCompletionSettlementEnvelope(
      completionEnvelope,
      updateInPlace && latest ? { expectedVersion: latest.version } : undefined,
    );
    return {
      completionEnvelope,
      reusedExisting: false,
    };
  }

  async recordOperatorHandoffFrame(input: RecordOperatorHandoffFrameInput): Promise<{
    operatorHandoffFrame: OperatorHandoffFrameSnapshot;
    reusedExisting: boolean;
  }> {
    const latest = await this.repositories.getCurrentOperatorHandoffFrameForTask(input.taskId);
    const normalizedTuple = this.normalizeHandoffTuple(input);
    if (latest && this.sameHandoffTuple(latest, normalizedTuple)) {
      return {
        operatorHandoffFrame: latest,
        reusedExisting: true,
      };
    }

    const requestedId = optionalRef(input.operatorHandoffFrameId);
    const updateInPlace = requestedId !== null && latest?.operatorHandoffFrameId === requestedId;
    const handoffRevision = (latest?.handoffRevision ?? 0) + 1;
    const operatorHandoffFrame = normalizeOperatorHandoffFrame(
      updateInPlace && latest
        ? {
            ...normalizedTuple,
            operatorHandoffFrameId: latest.operatorHandoffFrameId,
            handoffRevision,
            version: nextVersion(latest.version),
          }
        : {
            ...normalizedTuple,
            operatorHandoffFrameId:
              requestedId ?? nextKernelId(this.idGenerator, "phase3_operator_handoff_frame"),
            handoffRevision,
            version: 1,
          },
    );
    await this.repositories.saveOperatorHandoffFrame(
      operatorHandoffFrame,
      updateInPlace && latest ? { expectedVersion: latest.version } : undefined,
    );
    return {
      operatorHandoffFrame,
      reusedExisting: false,
    };
  }

  async listTaskCompletionSettlementEnvelopesForTask(
    taskId: string,
  ): Promise<readonly TaskCompletionSettlementEnvelopeSnapshot[]> {
    return this.repositories.listTaskCompletionSettlementEnvelopesForTask(taskId);
  }

  async listOperatorHandoffFramesForTask(
    taskId: string,
  ): Promise<readonly OperatorHandoffFrameSnapshot[]> {
    return this.repositories.listOperatorHandoffFramesForTask(taskId);
  }

  private normalizeEnvelopeTuple(
    input: SettleTaskCompletionEnvelopeInput,
  ): Omit<TaskCompletionSettlementEnvelopeSnapshot, "taskCompletionSettlementEnvelopeId" | "settlementRevision" | "version"> {
    const settledAt = ensureIsoTimestamp(input.settledAt, "settledAt");
    return {
      taskId: requireRef(input.taskId, "taskId"),
      actionType: requireRef(input.actionType, "actionType"),
      selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
      sourceQueueRankSnapshotRef: requireRef(
        input.sourceQueueRankSnapshotRef,
        "sourceQueueRankSnapshotRef",
      ),
      workspaceTrustEnvelopeRef: requireRef(
        input.workspaceTrustEnvelopeRef,
        "workspaceTrustEnvelopeRef",
      ),
      localAckState: input.localAckState,
      authoritativeSettlementState: input.authoritativeSettlementState,
      nextOwnerRef: optionalRef(input.nextOwnerRef),
      closureSummaryRef: requireRef(input.closureSummaryRef, "closureSummaryRef"),
      blockingReasonRefs: uniqueSorted(input.blockingReasonRefs),
      nextTaskLaunchState: input.nextTaskLaunchState,
      nextTaskLaunchLeaseRef: optionalRef(input.nextTaskLaunchLeaseRef),
      experienceContinuityEvidenceRef: requireRef(
        input.experienceContinuityEvidenceRef,
        "experienceContinuityEvidenceRef",
      ),
      releaseConditionRef: requireRef(input.releaseConditionRef, "releaseConditionRef"),
      operatorHandoffFrameRef: optionalRef(input.operatorHandoffFrameRef),
      settledAt,
    };
  }

  private normalizeHandoffTuple(
    input: RecordOperatorHandoffFrameInput,
  ): Omit<OperatorHandoffFrameSnapshot, "operatorHandoffFrameId" | "handoffRevision" | "version"> {
    return {
      taskId: requireRef(input.taskId, "taskId"),
      handoffType: input.handoffType,
      nextOwnerRef: requireRef(input.nextOwnerRef, "nextOwnerRef"),
      readinessSummaryRef: requireRef(input.readinessSummaryRef, "readinessSummaryRef"),
      pendingDependencyRefs: uniqueSorted(input.pendingDependencyRefs),
      confirmedArtifactRef: optionalRef(input.confirmedArtifactRef),
      settlementState: input.settlementState,
      generatedAt: ensureIsoTimestamp(input.generatedAt, "generatedAt"),
    };
  }

  private sameEnvelopeTuple(
    current: TaskCompletionSettlementEnvelopeSnapshot,
    next: Omit<TaskCompletionSettlementEnvelopeSnapshot, "taskCompletionSettlementEnvelopeId" | "settlementRevision" | "version">,
  ): boolean {
    return (
      current.taskId === next.taskId &&
      current.actionType === next.actionType &&
      current.selectedAnchorRef === next.selectedAnchorRef &&
      current.sourceQueueRankSnapshotRef === next.sourceQueueRankSnapshotRef &&
      current.workspaceTrustEnvelopeRef === next.workspaceTrustEnvelopeRef &&
      current.localAckState === next.localAckState &&
      current.authoritativeSettlementState === next.authoritativeSettlementState &&
      current.nextOwnerRef === next.nextOwnerRef &&
      current.closureSummaryRef === next.closureSummaryRef &&
      sameStringArray(current.blockingReasonRefs, next.blockingReasonRefs) &&
      current.nextTaskLaunchState === next.nextTaskLaunchState &&
      current.nextTaskLaunchLeaseRef === next.nextTaskLaunchLeaseRef &&
      current.experienceContinuityEvidenceRef === next.experienceContinuityEvidenceRef &&
      current.releaseConditionRef === next.releaseConditionRef &&
      current.operatorHandoffFrameRef === next.operatorHandoffFrameRef
    );
  }

  private sameHandoffTuple(
    current: OperatorHandoffFrameSnapshot,
    next: Omit<OperatorHandoffFrameSnapshot, "operatorHandoffFrameId" | "handoffRevision" | "version">,
  ): boolean {
    return (
      current.taskId === next.taskId &&
      current.handoffType === next.handoffType &&
      current.nextOwnerRef === next.nextOwnerRef &&
      current.readinessSummaryRef === next.readinessSummaryRef &&
      sameStringArray(current.pendingDependencyRefs, next.pendingDependencyRefs) &&
      current.confirmedArtifactRef === next.confirmedArtifactRef &&
      current.settlementState === next.settlementState
    );
  }
}

export function createPhase3TaskCompletionContinuityKernelService(
  repositories: Phase3TaskCompletionContinuityRepositories = createPhase3TaskCompletionContinuityKernelStore(),
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3TaskCompletionContinuityKernelService {
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase3_task_completion_continuity_kernel");
  return new Phase3TaskCompletionContinuityKernelServiceImpl(repositories, idGenerator);
}
