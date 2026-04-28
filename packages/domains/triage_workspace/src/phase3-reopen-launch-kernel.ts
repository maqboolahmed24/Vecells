import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  createPhase3ApprovalEscalationKernelStore,
  type Phase3ApprovalEscalationRepositories,
  type TriageReopenRecordSnapshot,
} from "./phase3-approval-escalation-kernel";
import {
  Phase3TaskLaunchContextDocument,
  createPhase3TriageKernelStore,
  type Phase3TaskLaunchContextSnapshot,
  type Phase3TriageKernelRepositories,
} from "./phase3-triage-kernel";

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

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function nextKernelId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

export type NextTaskLaunchEligibilityState =
  | "blocked"
  | "ready"
  | "stale"
  | "continuity_blocked";

export type NextTaskLaunchLeaseState = "live" | "invalidated" | "expired" | "consumed";

const nextTaskLaunchEligibilityStates: readonly NextTaskLaunchEligibilityState[] = [
  "blocked",
  "ready",
  "stale",
  "continuity_blocked",
];

const nextTaskLaunchLeaseStates: readonly NextTaskLaunchLeaseState[] = [
  "live",
  "invalidated",
  "expired",
  "consumed",
];

export interface NextTaskLaunchLeaseSnapshot {
  nextTaskLaunchLeaseId: string;
  sourceTaskRef: string;
  launchContextRef: string;
  prefetchWindowRef: string | null;
  nextTaskCandidateRef: string;
  sourceSettlementEnvelopeRef: string;
  continuityEvidenceRef: string;
  sourceQueueKey: string;
  sourceRankSnapshotRef: string;
  returnAnchorRef: string;
  launchEligibilityState: NextTaskLaunchEligibilityState;
  blockingReasonRefs: readonly string[];
  issuedAt: string;
  expiresAt: string;
  leaseState: NextTaskLaunchLeaseState;
  version: number;
}

export class NextTaskLaunchLeaseDocument {
  private constructor(private readonly snapshot: NextTaskLaunchLeaseSnapshot) {}

  static create(input: Omit<NextTaskLaunchLeaseSnapshot, "version">): NextTaskLaunchLeaseDocument {
    return new NextTaskLaunchLeaseDocument(NextTaskLaunchLeaseDocument.normalize({ ...input, version: 1 }));
  }

  static hydrate(snapshot: NextTaskLaunchLeaseSnapshot): NextTaskLaunchLeaseDocument {
    return new NextTaskLaunchLeaseDocument(NextTaskLaunchLeaseDocument.normalize(snapshot));
  }

  static normalize(snapshot: NextTaskLaunchLeaseSnapshot): NextTaskLaunchLeaseSnapshot {
    ensurePositiveInteger(snapshot.version, "version");
    invariant(
      nextTaskLaunchEligibilityStates.includes(snapshot.launchEligibilityState),
      "INVALID_NEXT_TASK_LAUNCH_ELIGIBILITY_STATE",
      "Unsupported NextTaskLaunchLease.launchEligibilityState.",
    );
    invariant(
      nextTaskLaunchLeaseStates.includes(snapshot.leaseState),
      "INVALID_NEXT_TASK_LAUNCH_LEASE_STATE",
      "Unsupported NextTaskLaunchLease.leaseState.",
    );
    const issuedAt = ensureIsoTimestamp(snapshot.issuedAt, "issuedAt");
    const expiresAt = ensureIsoTimestamp(snapshot.expiresAt, "expiresAt");
    invariant(
      compareIso(expiresAt, issuedAt) > 0,
      "INVALID_NEXT_TASK_LAUNCH_LEASE_EXPIRY",
      "NextTaskLaunchLease.expiresAt must be after issuedAt.",
    );
    return {
      ...snapshot,
      nextTaskLaunchLeaseId: requireRef(snapshot.nextTaskLaunchLeaseId, "nextTaskLaunchLeaseId"),
      sourceTaskRef: requireRef(snapshot.sourceTaskRef, "sourceTaskRef"),
      launchContextRef: requireRef(snapshot.launchContextRef, "launchContextRef"),
      prefetchWindowRef: optionalRef(snapshot.prefetchWindowRef),
      nextTaskCandidateRef: requireRef(snapshot.nextTaskCandidateRef, "nextTaskCandidateRef"),
      sourceSettlementEnvelopeRef: requireRef(
        snapshot.sourceSettlementEnvelopeRef,
        "sourceSettlementEnvelopeRef",
      ),
      continuityEvidenceRef: requireRef(snapshot.continuityEvidenceRef, "continuityEvidenceRef"),
      sourceQueueKey: requireRef(snapshot.sourceQueueKey, "sourceQueueKey"),
      sourceRankSnapshotRef: requireRef(snapshot.sourceRankSnapshotRef, "sourceRankSnapshotRef"),
      returnAnchorRef: requireRef(snapshot.returnAnchorRef, "returnAnchorRef"),
      blockingReasonRefs: uniqueSorted(snapshot.blockingReasonRefs),
      issuedAt,
      expiresAt,
    };
  }

  toSnapshot(): NextTaskLaunchLeaseSnapshot {
    return {
      ...this.snapshot,
      blockingReasonRefs: [...this.snapshot.blockingReasonRefs],
    };
  }

  get version(): number {
    return this.snapshot.version;
  }

  update(changes: Partial<NextTaskLaunchLeaseSnapshot>): NextTaskLaunchLeaseDocument {
    return NextTaskLaunchLeaseDocument.hydrate({
      ...this.snapshot,
      ...changes,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface Phase3ReopenLaunchKernelRepositories
  extends Pick<
      Phase3TriageKernelRepositories,
      "getLaunchContext" | "saveLaunchContext"
    >,
    Pick<
      Phase3ApprovalEscalationRepositories,
      | "getTriageReopenRecord"
      | "getLatestTriageReopenRecordForTask"
      | "saveTriageReopenRecord"
      | "listTriageReopenRecordsForTask"
    > {
  getNextTaskLaunchLease(
    nextTaskLaunchLeaseId: string,
  ): Promise<NextTaskLaunchLeaseDocument | undefined>;
  saveNextTaskLaunchLease(
    lease: NextTaskLaunchLeaseDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getLatestNextTaskLaunchLeaseForSourceTask(
    sourceTaskRef: string,
  ): Promise<NextTaskLaunchLeaseDocument | undefined>;
  listNextTaskLaunchLeasesForSourceTask(
    sourceTaskRef: string,
  ): Promise<readonly NextTaskLaunchLeaseDocument[]>;
}

export class InMemoryPhase3ReopenLaunchKernelStore
  implements Phase3ReopenLaunchKernelRepositories
{
  private readonly triageRepositories: Phase3TriageKernelRepositories;
  private readonly approvalRepositories: Phase3ApprovalEscalationRepositories;
  private readonly leases = new Map<string, NextTaskLaunchLeaseSnapshot>();
  private readonly leaseIdsBySourceTask = new Map<string, string[]>();

  constructor(options?: {
    triageRepositories?: Phase3TriageKernelRepositories;
    approvalRepositories?: Phase3ApprovalEscalationRepositories;
  }) {
    this.triageRepositories = options?.triageRepositories ?? createPhase3TriageKernelStore();
    this.approvalRepositories =
      options?.approvalRepositories ?? createPhase3ApprovalEscalationKernelStore();
  }

  getLaunchContext(launchContextId: string) {
    return this.triageRepositories.getLaunchContext(launchContextId);
  }

  saveLaunchContext(
    launchContext: Phase3TaskLaunchContextDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    return this.triageRepositories.saveLaunchContext(launchContext, options);
  }

  getTriageReopenRecord(reopenRecordId: string) {
    return this.approvalRepositories.getTriageReopenRecord(reopenRecordId);
  }

  getLatestTriageReopenRecordForTask(taskId: string) {
    return this.approvalRepositories.getLatestTriageReopenRecordForTask(taskId);
  }

  saveTriageReopenRecord(
    record: TriageReopenRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    return this.approvalRepositories.saveTriageReopenRecord(record, options);
  }

  listTriageReopenRecordsForTask(taskId: string) {
    return this.approvalRepositories.listTriageReopenRecordsForTask(taskId);
  }

  async getNextTaskLaunchLease(
    nextTaskLaunchLeaseId: string,
  ): Promise<NextTaskLaunchLeaseDocument | undefined> {
    const row = this.leases.get(nextTaskLaunchLeaseId);
    return row ? NextTaskLaunchLeaseDocument.hydrate(row) : undefined;
  }

  async saveNextTaskLaunchLease(
    lease: NextTaskLaunchLeaseDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = lease.toSnapshot();
    saveWithCas(this.leases, row.nextTaskLaunchLeaseId, row, options);
    const existing = this.leaseIdsBySourceTask.get(row.sourceTaskRef) ?? [];
    if (!existing.includes(row.nextTaskLaunchLeaseId)) {
      this.leaseIdsBySourceTask.set(row.sourceTaskRef, [...existing, row.nextTaskLaunchLeaseId]);
    }
  }

  async getLatestNextTaskLaunchLeaseForSourceTask(
    sourceTaskRef: string,
  ): Promise<NextTaskLaunchLeaseDocument | undefined> {
    const ids = this.leaseIdsBySourceTask.get(sourceTaskRef) ?? [];
    const latestId = ids.at(-1);
    return latestId ? this.getNextTaskLaunchLease(latestId) : undefined;
  }

  async listNextTaskLaunchLeasesForSourceTask(
    sourceTaskRef: string,
  ): Promise<readonly NextTaskLaunchLeaseDocument[]> {
    const ids = this.leaseIdsBySourceTask.get(sourceTaskRef) ?? [];
    return ids
      .map((id) => this.leases.get(id))
      .filter((entry): entry is NextTaskLaunchLeaseSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.issuedAt, right.issuedAt))
      .map((entry) => NextTaskLaunchLeaseDocument.hydrate(entry));
  }
}

export function createPhase3ReopenLaunchKernelStore(options?: {
  triageRepositories?: Phase3TriageKernelRepositories;
  approvalRepositories?: Phase3ApprovalEscalationRepositories;
}): Phase3ReopenLaunchKernelRepositories {
  return new InMemoryPhase3ReopenLaunchKernelStore(options);
}

export interface Phase3ReopenLaunchBundle {
  launchContext: Phase3TaskLaunchContextSnapshot;
  reopenRecord: TriageReopenRecordSnapshot | null;
  nextTaskLaunchLease: NextTaskLaunchLeaseSnapshot | null;
}

export interface RecordGovernedReopenInput {
  taskId: string;
  sourceDomain: TriageReopenRecordSnapshot["sourceDomain"];
  reasonCode: string;
  evidenceRefs: readonly string[];
  supersededDecisionEpochRef: string;
  decisionSupersessionRecordRef: string;
  priorityOverride: string;
  reopenedByMode: TriageReopenRecordSnapshot["reopenedByMode"];
  reopenedAt: string;
}

export interface RestoreTaskLaunchContextInput {
  launchContextRef: string;
  restoredAt: string;
  selectedAnchorRef?: string;
  selectedAnchorTupleHash?: string;
  nextTaskCandidateRefs?: readonly string[];
  nextTaskRankSnapshotRef?: string | null;
  nextTaskBlockingReasonRefs?: readonly string[];
  nextTaskLaunchState?: Phase3TaskLaunchContextSnapshot["nextTaskLaunchState"];
  departingTaskReturnStubState?: Phase3TaskLaunchContextSnapshot["departingTaskReturnStubState"];
  changedSinceSeenAt?: string | null;
  previewSnapshotRef?: string | null;
  previewDigestRef?: string | null;
  prefetchWindowRef?: string | null;
  prefetchCandidateRefs?: readonly string[];
  prefetchRankSnapshotRef?: string | null;
}

export interface IssueNextTaskLaunchLeaseInput {
  sourceTaskRef: string;
  launchContextRef: string;
  prefetchWindowRef?: string | null;
  nextTaskCandidateRef: string;
  sourceSettlementEnvelopeRef: string;
  continuityEvidenceRef: string;
  sourceRankSnapshotRef: string;
  issuedAt: string;
  expiresAt: string;
  launchEligibilityState: NextTaskLaunchEligibilityState;
  blockingReasonRefs?: readonly string[];
}

export interface ValidateNextTaskLaunchLeaseInput {
  nextTaskLaunchLeaseId: string;
  validatedAt: string;
  currentSourceRankSnapshotRef: string;
  currentSourceSettlementEnvelopeRef: string;
  currentContinuityEvidenceRef: string;
  currentReturnAnchorRef: string;
  currentSelectedAnchorRef: string;
  currentSelectedAnchorTupleHash: string;
  staleOwnerRecoveryRef?: string | null;
  ownershipDrifted?: boolean;
  publicationDrifted?: boolean;
  trustDrifted?: boolean;
}

export interface InvalidateNextTaskLaunchLeaseInput {
  nextTaskLaunchLeaseId: string;
  invalidatedAt: string;
  launchEligibilityState?: NextTaskLaunchEligibilityState;
  blockingReasonRefs: readonly string[];
}

export interface Phase3ReopenLaunchKernelService {
  queryTaskBundle(input: {
    taskId: string;
    launchContextRef: string;
  }): Promise<Phase3ReopenLaunchBundle>;
  recordGovernedReopen(input: RecordGovernedReopenInput): Promise<{
    reopenRecord: TriageReopenRecordSnapshot;
    reusedExisting: boolean;
  }>;
  restoreTaskLaunchContext(
    input: RestoreTaskLaunchContextInput,
  ): Promise<Phase3TaskLaunchContextSnapshot>;
  issueNextTaskLaunchLease(input: IssueNextTaskLaunchLeaseInput): Promise<{
    launchContext: Phase3TaskLaunchContextSnapshot;
    nextTaskLaunchLease: NextTaskLaunchLeaseSnapshot;
    reusedExisting: boolean;
  }>;
  validateNextTaskLaunchLease(
    input: ValidateNextTaskLaunchLeaseInput,
  ): Promise<{
    launchContext: Phase3TaskLaunchContextSnapshot;
    nextTaskLaunchLease: NextTaskLaunchLeaseSnapshot;
  }>;
  invalidateNextTaskLaunchLease(
    input: InvalidateNextTaskLaunchLeaseInput,
  ): Promise<{
    launchContext: Phase3TaskLaunchContextSnapshot;
    nextTaskLaunchLease: NextTaskLaunchLeaseSnapshot;
  }>;
  listNextTaskLaunchLeasesForSourceTask(
    sourceTaskRef: string,
  ): Promise<readonly NextTaskLaunchLeaseSnapshot[]>;
}

class Phase3ReopenLaunchKernelServiceImpl implements Phase3ReopenLaunchKernelService {
  constructor(
    private readonly repositories: Phase3ReopenLaunchKernelRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async queryTaskBundle(input: {
    taskId: string;
    launchContextRef: string;
  }): Promise<Phase3ReopenLaunchBundle> {
    const launchContext = await this.requireLaunchContext(input.launchContextRef);
    invariant(
      launchContext.toSnapshot().taskId === input.taskId,
      "TASK_LAUNCH_CONTEXT_TASK_MISMATCH",
      "TaskLaunchContext does not belong to the requested task.",
    );
    const reopenRecord =
      (await this.repositories.getLatestTriageReopenRecordForTask(input.taskId)) ?? null;
    const nextTaskLaunchLease =
      (await this.repositories.getLatestNextTaskLaunchLeaseForSourceTask(input.taskId))?.toSnapshot() ??
      null;
    return {
      launchContext: launchContext.toSnapshot(),
      reopenRecord,
      nextTaskLaunchLease,
    };
  }

  async recordGovernedReopen(input: RecordGovernedReopenInput): Promise<{
    reopenRecord: TriageReopenRecordSnapshot;
    reusedExisting: boolean;
  }> {
    const normalizedEvidenceRefs = uniqueSorted(input.evidenceRefs);
    const existing = await this.repositories.listTriageReopenRecordsForTask(input.taskId);
    const replayMatch = existing.find(
      (record) =>
        record.sourceDomain === input.sourceDomain &&
        record.reasonCode === requireRef(input.reasonCode, "reasonCode") &&
        record.supersededDecisionEpochRef ===
          requireRef(input.supersededDecisionEpochRef, "supersededDecisionEpochRef") &&
        record.decisionSupersessionRecordRef ===
          requireRef(input.decisionSupersessionRecordRef, "decisionSupersessionRecordRef") &&
        record.priorityOverride === requireRef(input.priorityOverride, "priorityOverride") &&
        record.reopenedByMode === input.reopenedByMode &&
        sameStringArray(record.evidenceRefs, normalizedEvidenceRefs),
    );
    if (replayMatch) {
      return {
        reopenRecord: replayMatch,
        reusedExisting: true,
      };
    }

    const reopenRecord: TriageReopenRecordSnapshot = {
      reopenRecordId: nextKernelId(this.idGenerator, "phase3_triage_reopen_record"),
      taskId: requireRef(input.taskId, "taskId"),
      sourceDomain: input.sourceDomain,
      reasonCode: requireRef(input.reasonCode, "reasonCode"),
      evidenceRefs: normalizedEvidenceRefs,
      supersededDecisionEpochRef: requireRef(
        input.supersededDecisionEpochRef,
        "supersededDecisionEpochRef",
      ),
      decisionSupersessionRecordRef: requireRef(
        input.decisionSupersessionRecordRef,
        "decisionSupersessionRecordRef",
      ),
      priorityOverride: requireRef(input.priorityOverride, "priorityOverride"),
      reopenedByMode: input.reopenedByMode,
      reopenedAt: ensureIsoTimestamp(input.reopenedAt, "reopenedAt"),
      version: 1,
    };
    await this.repositories.saveTriageReopenRecord(reopenRecord);
    return {
      reopenRecord,
      reusedExisting: false,
    };
  }

  async restoreTaskLaunchContext(
    input: RestoreTaskLaunchContextInput,
  ): Promise<Phase3TaskLaunchContextSnapshot> {
    const launchContext = await this.requireLaunchContext(input.launchContextRef);
    const snapshot = launchContext.toSnapshot();
    const restoredAt = ensureIsoTimestamp(input.restoredAt, "restoredAt");
    const updated = launchContext.update({
      selectedAnchorRef: input.selectedAnchorRef ?? snapshot.selectedAnchorRef,
      selectedAnchorTupleHash: input.selectedAnchorTupleHash ?? snapshot.selectedAnchorTupleHash,
      returnAnchorRef: input.selectedAnchorRef ?? snapshot.returnAnchorRef,
      returnAnchorTupleHash: input.selectedAnchorTupleHash ?? snapshot.returnAnchorTupleHash,
      nextTaskCandidateRefs: input.nextTaskCandidateRefs ?? snapshot.nextTaskCandidateRefs,
      nextTaskRankSnapshotRef:
        input.nextTaskRankSnapshotRef === undefined
          ? snapshot.nextTaskRankSnapshotRef
          : input.nextTaskRankSnapshotRef,
      nextTaskBlockingReasonRefs:
        input.nextTaskBlockingReasonRefs === undefined
          ? snapshot.nextTaskBlockingReasonRefs
          : uniqueSorted(input.nextTaskBlockingReasonRefs),
      nextTaskLaunchState: input.nextTaskLaunchState ?? snapshot.nextTaskLaunchState,
      departingTaskReturnStubState:
        input.departingTaskReturnStubState ?? snapshot.departingTaskReturnStubState,
      changedSinceSeenAt:
        input.changedSinceSeenAt === undefined ? snapshot.changedSinceSeenAt : input.changedSinceSeenAt,
      previewSnapshotRef:
        input.previewSnapshotRef === undefined
          ? snapshot.previewSnapshotRef
          : input.previewSnapshotRef,
      previewDigestRef:
        input.previewDigestRef === undefined ? snapshot.previewDigestRef : input.previewDigestRef,
      prefetchWindowRef:
        input.prefetchWindowRef === undefined
          ? snapshot.prefetchWindowRef
          : input.prefetchWindowRef,
      prefetchCandidateRefs: input.prefetchCandidateRefs ?? snapshot.prefetchCandidateRefs,
      prefetchRankSnapshotRef:
        input.prefetchRankSnapshotRef === undefined
          ? snapshot.prefetchRankSnapshotRef
          : input.prefetchRankSnapshotRef,
      updatedAt: restoredAt,
    });
    await this.repositories.saveLaunchContext(updated, { expectedVersion: launchContext.version });
    return updated.toSnapshot();
  }

  async issueNextTaskLaunchLease(input: IssueNextTaskLaunchLeaseInput): Promise<{
    launchContext: Phase3TaskLaunchContextSnapshot;
    nextTaskLaunchLease: NextTaskLaunchLeaseSnapshot;
    reusedExisting: boolean;
  }> {
    const launchContext = await this.requireLaunchContext(input.launchContextRef);
    const snapshot = launchContext.toSnapshot();
    invariant(
      snapshot.taskId === input.sourceTaskRef,
      "NEXT_TASK_LAUNCH_LEASE_TASK_MISMATCH",
      "TaskLaunchContext does not belong to the requested source task.",
    );
    const leaseTuple = this.buildLaunchLeaseTuple(input, snapshot);
    const existingLeases = await this.repositories.listNextTaskLaunchLeasesForSourceTask(
      input.sourceTaskRef,
    );
    const replayMatch = existingLeases.find((lease) => {
      const current = lease.toSnapshot();
      return (
        current.leaseState === "live" &&
        current.expiresAt > leaseTuple.issuedAt &&
        this.sameLaunchLeaseTuple(current, leaseTuple)
      );
    });
    if (replayMatch) {
      return {
        launchContext: await this.syncLaunchContextFromLease(
          launchContext,
          replayMatch.toSnapshot(),
          leaseTuple.issuedAt,
        ),
        nextTaskLaunchLease: replayMatch.toSnapshot(),
        reusedExisting: true,
      };
    }

    for (const lease of existingLeases) {
      const current = lease.toSnapshot();
      if (current.leaseState === "live") {
        const invalidated = lease.update({
          leaseState: "invalidated",
          launchEligibilityState: current.launchEligibilityState,
          blockingReasonRefs: uniqueSorted([
            ...current.blockingReasonRefs,
            "TASK_241_NEXT_TASK_CONTEXT_REPLACED",
          ]),
        });
        await this.repositories.saveNextTaskLaunchLease(invalidated, {
          expectedVersion: lease.version,
        });
      }
    }

    const nextTaskLaunchLease = NextTaskLaunchLeaseDocument.create(leaseTuple);
    await this.repositories.saveNextTaskLaunchLease(nextTaskLaunchLease);
    const updatedLaunchContext = await this.syncLaunchContextFromLease(
      launchContext,
      nextTaskLaunchLease.toSnapshot(),
      leaseTuple.issuedAt,
    );
    return {
      launchContext: updatedLaunchContext,
      nextTaskLaunchLease: nextTaskLaunchLease.toSnapshot(),
      reusedExisting: false,
    };
  }

  async validateNextTaskLaunchLease(
    input: ValidateNextTaskLaunchLeaseInput,
  ): Promise<{
    launchContext: Phase3TaskLaunchContextSnapshot;
    nextTaskLaunchLease: NextTaskLaunchLeaseSnapshot;
  }> {
    const lease = await this.requireNextTaskLaunchLease(input.nextTaskLaunchLeaseId);
    const current = lease.toSnapshot();
    const launchContext = await this.requireLaunchContext(current.launchContextRef);
    const currentLaunchContext = launchContext.toSnapshot();
    const validatedAt = ensureIsoTimestamp(input.validatedAt, "validatedAt");
    let nextState = current.leaseState;
    let nextEligibility = current.launchEligibilityState;
    const nextBlockingReasonRefs = [...current.blockingReasonRefs];

    if (compareIso(current.expiresAt, validatedAt) <= 0) {
      nextState = "expired";
      nextEligibility = "blocked";
      nextBlockingReasonRefs.push("TASK_241_NEXT_TASK_LEASE_EXPIRED");
    } else if (input.currentSourceRankSnapshotRef !== current.sourceRankSnapshotRef) {
      nextState = "invalidated";
      nextEligibility = "stale";
      nextBlockingReasonRefs.push("TASK_241_QUEUE_SNAPSHOT_DRIFT");
    } else if (
      input.currentSourceSettlementEnvelopeRef !== current.sourceSettlementEnvelopeRef
    ) {
      nextState = "invalidated";
      nextEligibility = "blocked";
      nextBlockingReasonRefs.push("TASK_241_SETTLEMENT_DRIFT");
    } else if (input.currentContinuityEvidenceRef !== current.continuityEvidenceRef) {
      nextState = "invalidated";
      nextEligibility = "continuity_blocked";
      nextBlockingReasonRefs.push("TASK_241_CONTINUITY_DRIFT");
    } else if (
      input.currentReturnAnchorRef !== current.returnAnchorRef ||
      input.currentSelectedAnchorRef !== currentLaunchContext.selectedAnchorRef ||
      input.currentSelectedAnchorTupleHash !== currentLaunchContext.selectedAnchorTupleHash
    ) {
      nextState = "invalidated";
      nextEligibility = "continuity_blocked";
      nextBlockingReasonRefs.push("TASK_241_RETURN_ANCHOR_DRIFT");
    } else if (optionalRef(input.staleOwnerRecoveryRef) !== null) {
      nextState = "invalidated";
      nextEligibility = "blocked";
      nextBlockingReasonRefs.push(
        `TASK_241_STALE_OWNER_RECOVERY:${input.staleOwnerRecoveryRef!.trim()}`,
      );
    } else if (input.ownershipDrifted) {
      nextState = "invalidated";
      nextEligibility = "blocked";
      nextBlockingReasonRefs.push("TASK_241_OWNERSHIP_DRIFT");
    } else if (input.publicationDrifted) {
      nextState = "invalidated";
      nextEligibility = "continuity_blocked";
      nextBlockingReasonRefs.push("TASK_241_PUBLICATION_DRIFT");
    } else if (input.trustDrifted) {
      nextState = "invalidated";
      nextEligibility = "continuity_blocked";
      nextBlockingReasonRefs.push("TASK_241_TRUST_DRIFT");
    }

    const updatedLease = lease.update({
      leaseState: nextState,
      launchEligibilityState: nextEligibility,
      blockingReasonRefs: uniqueSorted(nextBlockingReasonRefs),
    });
    await this.repositories.saveNextTaskLaunchLease(updatedLease, { expectedVersion: lease.version });
    const updatedLaunchContext = await this.syncLaunchContextFromLease(
      launchContext,
      updatedLease.toSnapshot(),
      validatedAt,
    );
    return {
      launchContext: updatedLaunchContext,
      nextTaskLaunchLease: updatedLease.toSnapshot(),
    };
  }

  async invalidateNextTaskLaunchLease(
    input: InvalidateNextTaskLaunchLeaseInput,
  ): Promise<{
    launchContext: Phase3TaskLaunchContextSnapshot;
    nextTaskLaunchLease: NextTaskLaunchLeaseSnapshot;
  }> {
    const lease = await this.requireNextTaskLaunchLease(input.nextTaskLaunchLeaseId);
    const launchContext = await this.requireLaunchContext(lease.toSnapshot().launchContextRef);
    const updated = lease.update({
      leaseState: "invalidated",
      launchEligibilityState: input.launchEligibilityState ?? "blocked",
      blockingReasonRefs: uniqueSorted(input.blockingReasonRefs),
    });
    await this.repositories.saveNextTaskLaunchLease(updated, { expectedVersion: lease.version });
    const updatedLaunchContext = await this.syncLaunchContextFromLease(
      launchContext,
      updated.toSnapshot(),
      input.invalidatedAt,
    );
    return {
      launchContext: updatedLaunchContext,
      nextTaskLaunchLease: updated.toSnapshot(),
    };
  }

  async listNextTaskLaunchLeasesForSourceTask(
    sourceTaskRef: string,
  ): Promise<readonly NextTaskLaunchLeaseSnapshot[]> {
    return (await this.repositories.listNextTaskLaunchLeasesForSourceTask(sourceTaskRef)).map((lease) =>
      lease.toSnapshot(),
    );
  }

  private buildLaunchLeaseTuple(
    input: IssueNextTaskLaunchLeaseInput,
    launchContext: Phase3TaskLaunchContextSnapshot,
  ): Omit<NextTaskLaunchLeaseSnapshot, "version"> {
    invariant(
      launchContext.nextTaskCandidateRefs.includes(input.nextTaskCandidateRef),
      "NEXT_TASK_CANDIDATE_NOT_VISIBLE",
      "NextTaskLaunchLease requires the candidate to come from TaskLaunchContext.nextTaskCandidateRefs.",
    );
    return {
      nextTaskLaunchLeaseId: nextKernelId(this.idGenerator, "phase3_next_task_launch_lease"),
      sourceTaskRef: requireRef(input.sourceTaskRef, "sourceTaskRef"),
      launchContextRef: requireRef(input.launchContextRef, "launchContextRef"),
      prefetchWindowRef: optionalRef(input.prefetchWindowRef),
      nextTaskCandidateRef: requireRef(input.nextTaskCandidateRef, "nextTaskCandidateRef"),
      sourceSettlementEnvelopeRef: requireRef(
        input.sourceSettlementEnvelopeRef,
        "sourceSettlementEnvelopeRef",
      ),
      continuityEvidenceRef: requireRef(input.continuityEvidenceRef, "continuityEvidenceRef"),
      sourceQueueKey: launchContext.sourceQueueKey,
      sourceRankSnapshotRef: requireRef(input.sourceRankSnapshotRef, "sourceRankSnapshotRef"),
      returnAnchorRef: launchContext.returnAnchorRef,
      launchEligibilityState: input.launchEligibilityState,
      blockingReasonRefs: uniqueSorted(input.blockingReasonRefs ?? []),
      issuedAt: ensureIsoTimestamp(input.issuedAt, "issuedAt"),
      expiresAt: ensureIsoTimestamp(input.expiresAt, "expiresAt"),
      leaseState: "live",
    };
  }

  private sameLaunchLeaseTuple(
    current: NextTaskLaunchLeaseSnapshot,
    next: Omit<NextTaskLaunchLeaseSnapshot, "version">,
  ): boolean {
    return (
      current.sourceTaskRef === next.sourceTaskRef &&
      current.launchContextRef === next.launchContextRef &&
      current.prefetchWindowRef === next.prefetchWindowRef &&
      current.nextTaskCandidateRef === next.nextTaskCandidateRef &&
      current.sourceSettlementEnvelopeRef === next.sourceSettlementEnvelopeRef &&
      current.continuityEvidenceRef === next.continuityEvidenceRef &&
      current.sourceQueueKey === next.sourceQueueKey &&
      current.sourceRankSnapshotRef === next.sourceRankSnapshotRef &&
      current.returnAnchorRef === next.returnAnchorRef &&
      current.launchEligibilityState === next.launchEligibilityState &&
      sameStringArray(current.blockingReasonRefs, next.blockingReasonRefs)
    );
  }

  private async syncLaunchContextFromLease(
    launchContext: Phase3TaskLaunchContextDocument,
    lease: NextTaskLaunchLeaseSnapshot,
    updatedAt: string,
  ): Promise<Phase3TaskLaunchContextSnapshot> {
    const nextTaskLaunchState =
      lease.leaseState === "live" && lease.launchEligibilityState === "ready"
        ? "ready"
        : lease.launchEligibilityState === "continuity_blocked" && lease.leaseState !== "expired"
          ? "gated"
          : "blocked";
    const updated = launchContext.update({
      nextTaskRankSnapshotRef: lease.sourceRankSnapshotRef,
      nextTaskBlockingReasonRefs: lease.blockingReasonRefs,
      nextTaskLaunchState,
      departingTaskReturnStubState: "pinned",
      updatedAt: ensureIsoTimestamp(updatedAt, "updatedAt"),
    });
    await this.repositories.saveLaunchContext(updated, { expectedVersion: launchContext.version });
    return updated.toSnapshot();
  }

  private async requireLaunchContext(
    launchContextRef: string,
  ): Promise<Phase3TaskLaunchContextDocument> {
    const launchContext = await this.repositories.getLaunchContext(launchContextRef);
    invariant(
      launchContext,
      "TASK_LAUNCH_CONTEXT_NOT_FOUND",
      `TaskLaunchContext ${launchContextRef} is required.`,
    );
    return launchContext;
  }

  private async requireNextTaskLaunchLease(
    nextTaskLaunchLeaseId: string,
  ): Promise<NextTaskLaunchLeaseDocument> {
    const lease = await this.repositories.getNextTaskLaunchLease(nextTaskLaunchLeaseId);
    invariant(
      lease,
      "NEXT_TASK_LAUNCH_LEASE_NOT_FOUND",
      `NextTaskLaunchLease ${nextTaskLaunchLeaseId} is required.`,
    );
    return lease;
  }
}

export function createPhase3ReopenLaunchKernelService(
  repositories: Phase3ReopenLaunchKernelRepositories = createPhase3ReopenLaunchKernelStore(),
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3ReopenLaunchKernelService {
  const idGenerator =
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("phase3_reopen_launch_kernel");
  return new Phase3ReopenLaunchKernelServiceImpl(repositories, idGenerator);
}
