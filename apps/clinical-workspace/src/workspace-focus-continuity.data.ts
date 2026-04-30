import type {
  StaffQueueCase,
  StaffShellLedger,
  StaffShellRoute,
  TaskWorkspaceProjection,
} from "./workspace-shell.data";
import { applyQueueChangeBatch, listQueueCases } from "./workspace-shell.data";
import { resolveStaffBookingCaseSeed } from "./workspace-booking-handoff.model";
import { buildQueueCallbackAdminMergeDigest } from "./workspace-queue-callback-admin-merge.data";

export type ProtectedCompositionMode =
  | "none"
  | "composing"
  | "comparing"
  | "confirming"
  | "delta_review"
  | "dispute_review";

export type FocusProtectionState =
  | "idle"
  | "active"
  | "release_pending"
  | "invalidated"
  | "recovery_only";

export interface WorkspaceProtectionStripProjection {
  stripId: string;
  visible: boolean;
  focusState: FocusProtectionState;
  protectedMode: ProtectedCompositionMode;
  focusProtectionLeaseRef: string;
  protectedCompositionStateRef: string;
  title: string;
  summary: string;
  protectedSubject: string;
  invalidatingDriftState: string;
  waitingBatchCount: number;
  trayActionLabel: string | null;
}

export interface BufferedQueueChangeGroupProjection {
  groupId: string;
  label: string;
  count: number;
  detail: string;
  tone: "neutral" | "accent" | "caution" | "critical";
}

export interface BufferedQueueChangeTrayProjection {
  trayId: string;
  trayState: StaffShellLedger["bufferedQueueTrayState"];
  batchState: "hidden" | "buffered" | "review_required";
  queueRef: string;
  sourceRankSnapshotRef: string;
  targetRankSnapshotRef: string;
  preservedAnchorRef: string;
  focusConflictState: "clear" | "protected" | "invalidated";
  impactClass: "bufferable" | "review_required";
  title: string;
  summary: string;
  applyLabel: string;
  applyEnabled: boolean;
  applyReason: string;
  reviewLabel: string;
  deferLabel: string;
  totalCount: number;
  groups: readonly BufferedQueueChangeGroupProjection[];
}

export interface ProtectedCompositionRecoveryProjection {
  recoveryId: string;
  recoveryState: "stale_recoverable" | "recovery_only";
  headline: string;
  summary: string;
  blockingReasons: readonly string[];
  preservedDraftSummary: string;
  preservedAnchorRef: string;
  preservedDecisionEpochRef: string;
  quietReturnTargetRef: string;
  recoveryActionLabel: string;
}

export interface CompletionContinuityStageProjection {
  stageId: string;
  stageState: "authoritative" | "pending_settlement" | "blocked" | "stale_recoverable";
  headline: string;
  summary: string;
  taskCompletionSettlementEnvelopeRef: string;
  workspaceContinuityEvidenceProjectionRef: string;
  latestPrefetchWindowRef: string;
  latestNextTaskLaunchLeaseRef: string;
}

export interface NextTaskPostureCardProjection {
  cardId: string;
  nextTaskState: "ready" | "prefetched" | "blocked" | "stale_recoverable" | "release_pending";
  headline: string;
  summary: string;
  candidateTaskId: string | null;
  candidatePatientLabel: string | null;
  prefetchWindowRef: string;
  launchLeaseRef: string;
  sourceRankSnapshotRef: string;
  launchEnabled: boolean;
  launchLabel: string;
  blockingReasons: readonly string[];
}

export interface DepartureReturnStubProjection {
  stubId: string;
  title: string;
  summary: string;
  queueRef: string;
  preservedAnchorRef: string;
  lastQuietRegionLabel: string;
  quietReturnTargetRef: string;
  sourceRankSnapshotRef: string;
}

export interface WorkspaceFocusContinuityProjection {
  projectionId: string;
  noAutoAdvancePolicy: "forbidden";
  focusState: FocusProtectionState;
  protectedMode: ProtectedCompositionMode;
  protectionStrip: WorkspaceProtectionStripProjection;
  bufferedQueueTray: BufferedQueueChangeTrayProjection | null;
  recovery: ProtectedCompositionRecoveryProjection | null;
  completionContinuityStage: CompletionContinuityStageProjection;
  nextTaskPostureCard: NextTaskPostureCardProjection;
  departureReturnStub: DepartureReturnStubProjection;
}

function protectedModeFor(input: {
  route: StaffShellRoute;
  task: StaffQueueCase;
  taskProjection: TaskWorkspaceProjection | null;
  ledger: StaffShellLedger;
}): ProtectedCompositionMode {
  const { route, task, taskProjection, ledger } = input;
  if (route.kind === "more-info") {
    return "composing";
  }
  if (route.kind === "decision") {
    return "confirming";
  }
  if (route.kind === "callbacks") {
    return ledger.callbackStage === "outcome"
      ? "confirming"
      : ledger.callbackStage === "repair"
        ? "dispute_review"
        : "none";
  }
  if (route.kind === "messages") {
    return ledger.messageStage === "detail" ? "none" : "dispute_review";
  }
  if (route.kind === "bookings") {
    const focusMode = resolveStaffBookingCaseSeed(route.bookingCaseId).focusMode;
    return focusMode === "comparing"
      ? "comparing"
      : focusMode === "confirming"
        ? "confirming"
        : "none";
  }
  if (!taskProjection) {
    return "none";
  }
  if (taskProjection.openingMode === "approval_review") {
    return "confirming";
  }
  if (taskProjection.openingMode === "handoff_review") {
    return "dispute_review";
  }
  if (taskProjection.openingMode === "resumed_review" && task.deltaClass !== "contextual") {
    return "delta_review";
  }
  return "none";
}

function focusStateFor(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
  protectedMode: ProtectedCompositionMode,
): FocusProtectionState {
  if (protectedMode === "none") {
    return "idle";
  }
  switch (runtimeScenario) {
    case "blocked":
    case "read_only":
    case "recovery_only":
      return "recovery_only";
    case "stale_review":
      return "invalidated";
    case "live":
    default:
      return "active";
  }
}

function focusSubjectFor(
  protectedMode: ProtectedCompositionMode,
  route: StaffShellRoute,
  task: StaffQueueCase,
): string {
  switch (protectedMode) {
    case "composing":
      return `More-info compose for ${task.patientLabel}`;
    case "confirming":
      if (route.kind === "callbacks") {
        return `Callback outcome capture for ${task.patientLabel}`;
      }
      if (route.kind === "bookings") {
        return `Assisted booking confirmation for ${task.patientLabel}`;
      }
      return route.kind === "decision"
        ? `Endpoint consequence draft for ${task.patientLabel}`
        : `Approval or commit status for ${task.patientLabel}`;
    case "delta_review":
      return `Returned-evidence comparison for ${task.patientLabel}`;
    case "dispute_review":
      if (route.kind === "messages") {
        return `Message delivery dispute review for ${task.patientLabel}`;
      }
      return `Delivery or handoff dispute review for ${task.patientLabel}`;
    case "comparing":
      return `Comparison hold for ${task.patientLabel}`;
    case "none":
    default:
      return `Current task shell for ${task.patientLabel}`;
  }
}

function invalidatingDriftStateFor(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
  protectedMode: ProtectedCompositionMode,
): string {
  if (protectedMode === "none") {
    return "none";
  }
  switch (runtimeScenario) {
    case "stale_review":
      return "review_version";
    case "read_only":
      return "publication";
    case "recovery_only":
      return "trust";
    case "blocked":
      return "settlement_drift";
    case "live":
    default:
      return "none";
  }
}

function queueGroupRows(task: StaffQueueCase) {
  return applyQueueChangeBatch(listQueueCases(task.launchQueue), task.id);
}

function buildBufferedQueueChangeTray(input: {
  task: StaffQueueCase;
  ledger: StaffShellLedger;
  focusState: FocusProtectionState;
}): BufferedQueueChangeTrayProjection | null {
  const { task, ledger, focusState } = input;
  if (!ledger.queuedBatchPending) {
    return null;
  }

  const sourceRows = listQueueCases(task.launchQueue);
  const targetRows = queueGroupRows(task);
  const rankShiftCount = targetRows.filter((row) => row.currentQueueRank !== row.nextQueueRank).length;
  const reassignedCount = targetRows.filter((row) => row.state === "reassigned").length;
  const blockingCount = targetRows.filter((row) => row.state === "blocked" || row.state === "escalated").length;
  const returnedEvidenceCount = targetRows.filter(
    (row) => row.deltaClass === "decisive" || row.deltaClass === "consequential",
  ).length;
  const removedCount = sourceRows.filter((row) => row.state === "approval").length;
  const totalCount =
    ledger.bufferedUpdateCount ||
    rankShiftCount + reassignedCount + blockingCount + returnedEvidenceCount + removedCount;
  const impactClass: BufferedQueueChangeTrayProjection["impactClass"] =
    blockingCount || removedCount || reassignedCount ? "review_required" : "bufferable";
  const focusConflictState: BufferedQueueChangeTrayProjection["focusConflictState"] =
    focusState === "active" || focusState === "release_pending"
      ? "protected"
      : focusState === "invalidated" || focusState === "recovery_only"
        ? "invalidated"
        : "clear";
  const applyEnabled = focusConflictState === "clear";

  return {
    trayId: `buffered_queue_change_tray::${task.id}`,
    trayState: ledger.bufferedQueueTrayState,
    batchState: impactClass === "review_required" ? "review_required" : "buffered",
    queueRef: task.launchQueue,
    sourceRankSnapshotRef: "Current queue order",
    targetRankSnapshotRef: "Recommended queue order",
    preservedAnchorRef: ledger.selectedAnchorId,
    focusConflictState,
    impactClass,
    title: "Buffered queue changes are waiting behind the current focus hold",
    summary:
      focusConflictState === "clear"
        ? `${totalCount} queued background changes are ready for explicit review. Nothing will apply itself.`
        : `${totalCount} queued background changes are held while the current composition or compare status remains protected.`,
    applyLabel: "Apply buffered queue changes",
    applyEnabled,
    applyReason: applyEnabled
      ? "The current shell is calm enough to reconcile the next committed rank snapshot."
      : "Applying now would break the active protected state or mix the current task with a newer queue snapshot.",
    reviewLabel:
      ledger.bufferedQueueTrayState === "expanded" ? "Collapse buffered change tray" : "Review buffered queue changes",
    deferLabel: "Keep this batch buffered",
    totalCount,
    groups: [
      {
        groupId: "queue-reorders",
        label: "Queue reorders",
        count: rankShiftCount,
        detail: "Rows with a changed committed rank between the source and target snapshots.",
        tone: "accent",
      },
      {
        groupId: "returned-evidence",
        label: "Returned evidence",
        count: returnedEvidenceCount,
        detail: "Tasks whose delta class still affects the current queue recommendation.",
        tone: "caution",
      },
      {
        groupId: "blocking-changes",
        label: "Blocking changes",
        count: blockingCount,
        detail: "Rows that now require escalation or blocked-only status.",
        tone: "critical",
      },
      {
        groupId: "reassigned-tasks",
        label: "Reassigned tasks",
        count: reassignedCount,
        detail: "Rows that left the current slice and now need an explicit return path.",
        tone: "neutral",
      },
      {
        groupId: "removed-or-approval",
        label: "Removed or approval-owned",
        count: removedCount,
        detail: "Rows that are no longer routine queue work inside this shell slice.",
        tone: "neutral",
      },
    ],
  };
}

function buildRecoveryProjection(input: {
  taskProjection: TaskWorkspaceProjection | null;
  focusState: FocusProtectionState;
  protectedMode: ProtectedCompositionMode;
  task: StaffQueueCase;
}): ProtectedCompositionRecoveryProjection | null {
  const { taskProjection, focusState, protectedMode, task } = input;
  if (
    focusState !== "invalidated" &&
    focusState !== "recovery_only" &&
    !taskProjection?.reasoningLayer.freezeFrame
  ) {
    return null;
  }

  const freezeFrame = taskProjection?.reasoningLayer.freezeFrame;
  const quietReturnTargetRef = taskProjection?.taskCanvasFrame.quietReturnTargetRef ?? `quiet_return::${task.id}::summary`;
  const decisionEpochRef = taskProjection?.decisionEpochRef ?? `decision_epoch::${task.id}::current`;
  return {
    recoveryId: `protected_composition_recovery::${task.id}`,
    recoveryState: focusState === "recovery_only" ? "recovery_only" : "stale_recoverable",
    headline:
      focusState === "recovery_only"
        ? "Protected work is preserved in recovery-only status"
        : "Protected work is preserved and waiting for drift recovery",
    summary:
      freezeFrame?.summary ??
      (protectedMode === "delta_review"
        ? "The compare target changed underneath the current review, so the shell preserved the active mental model instead of swapping you to a fresh row."
        : "The current composed or confirmed state drifted, so the shell preserved the draft and anchor instead of silently discarding them."),
    blockingReasons:
      freezeFrame?.blockingReasons ??
      [
        focusState === "recovery_only" ? "The current tuple is recovery-only." : "The current tuple drifted.",
        "Draft, compare target, and quiet return remain preserved until you explicitly recover.",
      ],
    preservedDraftSummary: freezeFrame?.preservedDraftSummary ?? "Draft and protected evidence remain pinned to the prior anchor.",
    preservedAnchorRef: freezeFrame?.preservedAnchorRef ?? taskProjection?.selectedAnchorRef ?? `queue-row-${task.id}`,
    preservedDecisionEpochRef: freezeFrame?.preservedDecisionEpochRef ?? decisionEpochRef,
    quietReturnTargetRef,
    recoveryActionLabel: freezeFrame?.recoveryActionLabel ?? "Restore the protected shell state",
  };
}

function buildCompletionContinuityStage(input: {
  task: StaffQueueCase;
  taskProjection: TaskWorkspaceProjection | null;
  ledger: StaffShellLedger;
  focusState: FocusProtectionState;
}): CompletionContinuityStageProjection {
  const { task, taskProjection, ledger, focusState } = input;
  const mergeDigest = buildQueueCallbackAdminMergeDigest({
    runtimeScenario: ledger.runtimeScenario,
    taskId: task.id,
  });
  let stageState: CompletionContinuityStageProjection["stageState"] =
    mergeDigest.completionAuthorityState;
  let headline =
    mergeDigest.completionAuthorityState === "authoritative"
      ? "Completion calmness is authoritative"
      : mergeDigest.completionAuthorityState === "blocked"
        ? "Completion calmness is blocked"
        : mergeDigest.completionAuthorityState === "stale_recoverable"
          ? "Completion calmness is stale-recoverable"
          : "Completion calmness is still provisional";
  let summary =
    mergeDigest.completionAuthorityState === "authoritative"
      ? "The current task has a governed quiet-return path, and the shell may safely show next-task readiness without replacing the active task."
      : mergeDigest.completionAuthorityState === "blocked"
        ? `A blocking authority chain is still active. ${mergeDigest.dominantSummary}`
        : mergeDigest.completionAuthorityState === "stale_recoverable"
          ? `The shell keeps the current completion view visible while the governing tuple recovers. ${mergeDigest.dominantSummary}`
          : `The current task has not reached authoritative quiet completion yet. ${mergeDigest.dominantSummary}`;

  if (
    stageState === "authoritative" &&
    (focusState === "active" || focusState === "release_pending")
  ) {
    stageState = "pending_settlement";
    headline = "Completion calmness is still provisional";
    summary =
      "Protected work still owns the shell, so quiet completion stays visible but cannot yet arm live next-task launch.";
  }

  return {
    stageId: `completion_continuity_stage::${task.id}`,
    stageState,
    headline,
    summary,
    taskCompletionSettlementEnvelopeRef:
      taskProjection?.quietSettlementEnvelopeRef ?? `task_completion_settlement_envelope::${task.id}::pending`,
    workspaceContinuityEvidenceProjectionRef: `workspace_continuity_evidence_projection::${task.id}`,
    latestPrefetchWindowRef: `next_task_prefetch_window::${task.launchQueue}::${task.id}`,
    latestNextTaskLaunchLeaseRef: `next_task_launch_lease::${task.launchQueue}::${task.id}`,
  };
}

function buildNextTaskPostureCard(input: {
  task: StaffQueueCase;
  ledger: StaffShellLedger;
  focusState: FocusProtectionState;
  completionContinuityStage: CompletionContinuityStageProjection;
}): NextTaskPostureCardProjection {
  const { task, ledger, focusState, completionContinuityStage } = input;
  const mergeDigest = buildQueueCallbackAdminMergeDigest({
    runtimeScenario: ledger.runtimeScenario,
    taskId: task.id,
  });
  const candidate =
    queueGroupRows(task).find((row) => row.id !== task.id) ?? listQueueCases(task.launchQueue).find((row) => row.id !== task.id) ?? null;
  const sourceRankSnapshotRef = ledger.queuedBatchPending
    ? "Current queue order"
    : "Recommended queue order";
  const prefetchWindowRef = `next_task_prefetch_window::${task.launchQueue}::${candidate?.id ?? "none"}`;
  const launchLeaseRef = `next_task_launch_lease::${task.launchQueue}::${candidate?.id ?? "none"}`;
  const blockingReasons: string[] = [];
  let nextTaskState: NextTaskPostureCardProjection["nextTaskState"] = "ready";
  let headline = candidate ? `Next task is ready: ${candidate.patientLabel}` : "No governed next task is ready";
  let summary =
    "The current launch lease matches the committed queue snapshot, and the shell may expose an explicit next-task CTA without replacing the current review automatically.";

  if (!candidate) {
    nextTaskState = "blocked";
    headline = "No governed next-task candidate is available";
    summary = "The launch lease cannot be minted because no next candidate is available from the current queue slice.";
    blockingReasons.push("No next-task candidate exists in the current committed queue slice.");
  } else if (ledger.queuedBatchPending) {
    nextTaskState = "blocked";
    headline = `Next task is blocked by buffered queue churn: ${candidate.patientLabel}`;
    summary = "The next candidate is visible, but the source queue snapshot is no longer the committed launch source.";
    blockingReasons.push("Buffered queue change batch must be reviewed or safely applied first.");
  } else if (mergeDigest.nextTaskGateState === "blocked") {
    nextTaskState = "blocked";
    headline = "Next-task launch is blocked";
    summary = `The current launch lease is blocked by the active execution chain. ${mergeDigest.dominantSummary}`;
    blockingReasons.push("Blocking authority chain froze the current launch lease.");
  } else if (mergeDigest.nextTaskGateState === "stale_recoverable") {
    nextTaskState = "stale_recoverable";
    headline = "Next-task launch is stale-recoverable";
    summary = `A candidate is still warmed summary-first, but the launch lease is not authoritative. ${mergeDigest.dominantSummary}`;
    blockingReasons.push("Trust, publication, or completion drift invalidated the current launch lease.");
  } else if (focusState === "active" || focusState === "release_pending") {
    nextTaskState = "release_pending";
    headline = `Next task is warmed only: ${candidate.patientLabel}`;
    summary = "The shell warmed the next candidate summary-first, but protected work still owns the primary region.";
    blockingReasons.push("Protected composition still owns the current shell.");
  } else if (
    mergeDigest.nextTaskGateState === "gated" ||
    completionContinuityStage.stageState !== "authoritative"
  ) {
    nextTaskState = "prefetched";
    headline = `Next task is prefetched only: ${candidate.patientLabel}`;
    summary = `The shell may warm the next candidate summary-first, but it may not mint a live next-task CTA until the current execution settles. ${mergeDigest.dominantSummary}`;
    blockingReasons.push("Completion calmness is still provisional.");
  }

  return {
    cardId: `next_task_posture_card::${task.id}`,
    nextTaskState,
    headline,
    summary,
    candidateTaskId: candidate?.id ?? null,
    candidatePatientLabel: candidate?.patientLabel ?? null,
    prefetchWindowRef,
    launchLeaseRef,
    sourceRankSnapshotRef,
    launchEnabled: nextTaskState === "ready" && Boolean(candidate),
    launchLabel: candidate ? `Launch ${candidate.patientLabel}` : "Next task unavailable",
    blockingReasons,
  };
}

function buildDepartureReturnStub(input: {
  task: StaffQueueCase;
  ledger: StaffShellLedger;
  taskProjection: TaskWorkspaceProjection | null;
}): DepartureReturnStubProjection {
  const { task, ledger, taskProjection } = input;
  return {
    stubId: `departure_return_stub::${task.id}`,
    title: "Departure and quiet return stay pinned",
    summary: ledger.queuedBatchPending
      ? `Return is still pinned to ${ledger.selectedAnchorId} while buffered queue changes wait behind the current shell.`
      : `Return remains pinned to ${ledger.lastQuietRegionLabel} and ${ledger.selectedAnchorId} until the operator explicitly launches elsewhere.`,
    queueRef: task.launchQueue,
    preservedAnchorRef: ledger.selectedAnchorId,
    lastQuietRegionLabel: ledger.lastQuietRegionLabel,
    quietReturnTargetRef: taskProjection?.taskCanvasFrame.quietReturnTargetRef ?? `quiet_return::${task.id}::summary`,
    sourceRankSnapshotRef: ledger.queuedBatchPending
      ? "Current queue order"
      : "Recommended queue order",
  };
}

export function buildWorkspaceFocusContinuityProjection(input: {
  route: StaffShellRoute;
  task: StaffQueueCase;
  taskProjection: TaskWorkspaceProjection | null;
  ledger: StaffShellLedger;
}): WorkspaceFocusContinuityProjection {
  const { route, task, taskProjection, ledger } = input;
  const protectedMode = protectedModeFor({ route, task, taskProjection, ledger });
  const focusState = focusStateFor(ledger.runtimeScenario, protectedMode);
  const invalidatingDriftState = invalidatingDriftStateFor(ledger.runtimeScenario, protectedMode);
  const bufferedQueueTray = buildBufferedQueueChangeTray({ task, ledger, focusState });
  const completionContinuityStage = buildCompletionContinuityStage({
    task,
    taskProjection,
    ledger,
    focusState,
  });
  const nextTaskPostureCard = buildNextTaskPostureCard({
    task,
    ledger,
    focusState,
    completionContinuityStage,
  });

  return {
    projectionId: `workspace_focus_continuity_projection::${task.id}::${route.kind}`,
    noAutoAdvancePolicy: "forbidden",
    focusState,
    protectedMode,
    protectionStrip: {
      stripId: `workspace_protection_strip::${task.id}`,
      visible: protectedMode !== "none",
      focusState,
      protectedMode,
      focusProtectionLeaseRef:
        taskProjection?.reasoningLayer.focusProtectionLeaseRef ?? `workspace_focus_protection_lease::${task.id}::${route.kind}`,
      protectedCompositionStateRef:
        taskProjection?.reasoningLayer.protectedCompositionStateRef ??
        `protected_composition_state::${task.id}::${route.kind}`,
      title:
        focusState === "recovery_only"
          ? "Protected work is frozen in recovery-only status"
          : focusState === "invalidated"
            ? "Protected work is preserved while drift is reconciled"
            : "Protected work is holding the current shell steady",
      summary:
        protectedMode === "none"
          ? "No active protected work is holding the current shell."
          : `${focusSubjectFor(protectedMode, route, task)} stays pinned while background queue churn and launch suggestions remain bounded.`,
      protectedSubject: focusSubjectFor(protectedMode, route, task),
      invalidatingDriftState,
      waitingBatchCount: bufferedQueueTray?.totalCount ?? 0,
      trayActionLabel: bufferedQueueTray
        ? ledger.bufferedQueueTrayState === "expanded"
          ? "Collapse buffered changes"
          : "Review buffered changes"
        : null,
    },
    bufferedQueueTray,
    recovery: buildRecoveryProjection({
      taskProjection,
      focusState,
      protectedMode,
      task,
    }),
    completionContinuityStage,
    nextTaskPostureCard,
    departureReturnStub: buildDepartureReturnStub({
      task,
      ledger,
      taskProjection,
    }),
  };
}
