import type { RuntimeScenario } from "@vecells/persistent-shell";
import { requireCase, type StaffQueueCase } from "./workspace-shell.data";
import {
  buildCallbackWorkbenchProjection,
  listCallbackWorkbenchTaskIds,
} from "./workspace-callback-workbench.data";
import { buildSelfCareAdminViewsRouteProjection } from "./workspace-selfcare-admin.data";

export type QueueMergeExecutionFamily = "callback" | "self_care" | "admin_resolution" | "triage_only";
export type QueueMergePosture =
  | "ready"
  | "repair_required"
  | "waiting_dependency"
  | "completed"
  | "reopened"
  | "stale_recoverable"
  | "blocked";

export type QueueMergeCompletionAuthorityState =
  | "authoritative"
  | "pending_settlement"
  | "blocked"
  | "stale_recoverable";

export type QueueMergeNextTaskGateState = "ready" | "gated" | "blocked" | "stale_recoverable";

export interface QueueMergeLaunchAction {
  actionId: string;
  routeKind: "callbacks" | "consequences" | "task";
  anchorRef: string;
  label: string;
  summary: string;
  actionState: QueueMergePosture;
  dominant: boolean;
}

export interface QueueCallbackAdminMergeDigestProjection {
  taskId: string;
  executionFamily: QueueMergeExecutionFamily;
  dominantPosture: QueueMergePosture;
  dominantSummary: string;
  queueBadgeLabels: readonly string[];
  patientExpectationDigest: string | null;
  decisionEpochRef: string | null;
  completionAuthorityState: QueueMergeCompletionAuthorityState;
  nextTaskGateState: QueueMergeNextTaskGateState;
  launchActions: readonly QueueMergeLaunchAction[];
}

function labelFromToken(value: string | null | undefined): string {
  if (!value) {
    return "not available";
  }
  return value.replaceAll("_", " ");
}

function callbackMerge(taskId: string, runtimeScenario: RuntimeScenario) {
  if (!listCallbackWorkbenchTaskIds().includes(taskId)) {
    return null;
  }
  const projection = buildCallbackWorkbenchProjection({
    runtimeScenario,
    selectedTaskId: taskId,
    selectedAnchorRef: `callback-detail-${taskId}`,
    selectedStage: "detail",
  });
  const detail = projection.detailSurface;
  const repairRequired =
    detail.routeRepairPrompt.visible &&
    (detail.routeHealth === "repair_required" || detail.callbackState === "contact_route_repair_pending");
  let posture: QueueMergePosture = "ready";
  if (detail.mutationState === "blocked") {
    posture = "blocked";
  } else if (detail.mutationState === "stale_recoverable" || detail.mutationState === "recovery_only") {
    posture = "stale_recoverable";
  } else if (repairRequired) {
    posture = "repair_required";
  } else if (
    detail.callbackState === "awaiting_outcome_evidence" ||
    detail.currentAttemptState === "provider_acked" ||
    detail.currentAttemptState === "outcome_pending" ||
    detail.callbackState === "awaiting_retry" ||
    detail.callbackState === "voicemail_left" ||
    detail.callbackState === "no_answer"
  ) {
    posture = "waiting_dependency";
  }

  return {
    executionFamily: "callback" as const,
    posture,
    summary: repairRequired ? detail.routeRepairPrompt.summary : detail.summary,
    patientExpectationDigest: detail.expectationCard.patientVisibleState,
    decisionEpochRef: detail.decisionEpochRef,
    launchAction: {
      actionId: `queue-callback-launch::${taskId}`,
      routeKind: "callbacks" as const,
      anchorRef:
        detail.selectedStage === "repair" || repairRequired
          ? `callback-repair-${taskId}`
          : `callback-detail-${taskId}`,
      label: repairRequired ? "Open callback repair" : "Open callback stage",
      summary: repairRequired ? detail.routeRepairPrompt.summary : detail.summary,
      actionState: posture,
      dominant: repairRequired || posture === "waiting_dependency",
    },
  };
}

function consequenceMerge(taskId: string, runtimeScenario: RuntimeScenario) {
  const projection = buildSelfCareAdminViewsRouteProjection({
    runtimeScenario,
    selectedTaskId: taskId,
  });
  if (projection.selectedTaskId !== taskId) {
    return null;
  }

  const detail = projection.detailSurface;
  const family: Extract<QueueMergeExecutionFamily, "self_care" | "admin_resolution"> =
    detail.boundaryMode === "self_care" ? "self_care" : "admin_resolution";
  let posture: QueueMergePosture = "ready";
  if (detail.mutationState === "blocked") {
    posture = "blocked";
  } else if (detail.mutationState === "stale_recoverable" || detail.mutationState === "recovery_only") {
    posture = "stale_recoverable";
  } else if (detail.boundaryDriftRecovery.visible && detail.reopenState !== "stable") {
    posture = "reopened";
  } else if (family === "self_care") {
    posture =
      detail.adviceSettlement === "renderable"
        ? "ready"
        : detail.adviceSettlement === "superseded"
          ? "reopened"
          : detail.adviceSettlement === "invalidated" || detail.adviceSettlement === "quarantined"
            ? "blocked"
            : "stale_recoverable";
  } else {
    posture =
      detail.adminSettlement === "completed" || detail.adminSettlement === "patient_notified"
        ? "completed"
        : detail.adminSettlement === "waiting_dependency"
          ? "waiting_dependency"
          : detail.adminSettlement === "reopened_for_review"
            ? "reopened"
            : detail.adminSettlement === "blocked_pending_safety"
              ? "blocked"
              : detail.adminSettlement === "stale_recoverable"
                ? "stale_recoverable"
                : "ready";
  }

  return {
    executionFamily: family,
    posture,
    summary: detail.boundaryDriftRecovery.visible ? detail.boundaryDriftRecovery.summary : detail.routeSummary,
    patientExpectationDigest: detail.patientExpectationPreview.expectationTemplateRef,
    decisionEpochRef: detail.decisionEpochRef,
    launchAction: {
      actionId: `queue-consequence-launch::${taskId}`,
      routeKind: "consequences" as const,
      anchorRef: `consequence-detail-${taskId}`,
      label: family === "self_care" ? "Open self-care stage" : "Open bounded admin stage",
      summary: detail.boundaryDriftRecovery.visible ? detail.boundaryDriftRecovery.summary : detail.routeSummary,
      actionState: posture,
      dominant: posture !== "completed",
    },
  };
}

function preferredFamily(input: {
  callback: ReturnType<typeof callbackMerge>;
  consequence: ReturnType<typeof consequenceMerge>;
}): QueueMergeExecutionFamily {
  if (input.callback?.posture === "repair_required") {
    return "callback";
  }
  if (
    input.consequence?.executionFamily === "admin_resolution" &&
    input.consequence.posture !== "ready"
  ) {
    return "admin_resolution";
  }
  if (input.callback) {
    return "callback";
  }
  if (input.consequence) {
    return input.consequence.executionFamily;
  }
  return "triage_only";
}

function completionAuthorityState(input: {
  task: StaffQueueCase;
  runtimeScenario: RuntimeScenario;
  dominantPosture: QueueMergePosture;
}): QueueMergeCompletionAuthorityState {
  if (input.runtimeScenario === "blocked" || input.dominantPosture === "blocked") {
    return "blocked";
  }
  if (input.runtimeScenario !== "live" || input.dominantPosture === "stale_recoverable") {
    return "stale_recoverable";
  }
  if (
    input.task.returnToQuietEligibility === "blocked" ||
    input.dominantPosture === "repair_required" ||
    input.dominantPosture === "waiting_dependency" ||
    input.dominantPosture === "reopened" ||
    input.dominantPosture === "ready"
  ) {
    return "pending_settlement";
  }
  return "authoritative";
}

function nextTaskGateState(input: {
  completionAuthorityState: QueueMergeCompletionAuthorityState;
  runtimeScenario: RuntimeScenario;
}): QueueMergeNextTaskGateState {
  if (input.completionAuthorityState === "blocked") {
    return "blocked";
  }
  if (input.runtimeScenario !== "live" || input.completionAuthorityState === "stale_recoverable") {
    return "stale_recoverable";
  }
  if (input.completionAuthorityState !== "authoritative") {
    return "gated";
  }
  return "ready";
}

export function buildQueueCallbackAdminMergeDigest(input: {
  runtimeScenario: RuntimeScenario;
  taskId: string;
}): QueueCallbackAdminMergeDigestProjection {
  const task = requireCase(input.taskId);
  const callback = callbackMerge(task.id, input.runtimeScenario);
  const consequence = consequenceMerge(task.id, input.runtimeScenario);
  const executionFamily = preferredFamily({ callback, consequence });
  const dominantPosture =
    executionFamily === "callback"
      ? callback?.posture ?? "ready"
      : executionFamily === "admin_resolution" || executionFamily === "self_care"
        ? consequence?.posture ?? "ready"
        : task.returnToQuietEligibility === "blocked"
          ? "blocked"
          : "ready";
  const completionState = completionAuthorityState({
    task,
    runtimeScenario: input.runtimeScenario,
    dominantPosture,
  });
  const gateState = nextTaskGateState({
    completionAuthorityState: completionState,
    runtimeScenario: input.runtimeScenario,
  });
  const dominantSummary =
    executionFamily === "callback"
      ? callback?.summary ?? task.resumeActionSummary
      : executionFamily === "admin_resolution" || executionFamily === "self_care"
        ? consequence?.summary ?? task.resumeActionSummary
        : task.resumeActionSummary;
  const patientExpectationDigest =
    callback?.patientExpectationDigest ?? consequence?.patientExpectationDigest ?? null;

  return {
    taskId: task.id,
    executionFamily,
    dominantPosture,
    dominantSummary,
    queueBadgeLabels: [
      executionFamily === "triage_only"
        ? `triage:${labelFromToken(dominantPosture)}`
        : `${executionFamily}:${labelFromToken(dominantPosture)}`,
      `completion:${labelFromToken(completionState)}`,
      `next-task:${labelFromToken(gateState)}`,
    ],
    patientExpectationDigest,
    decisionEpochRef: callback?.decisionEpochRef ?? consequence?.decisionEpochRef ?? null,
    completionAuthorityState: completionState,
    nextTaskGateState: gateState,
    launchActions: [
      callback?.launchAction,
      consequence?.launchAction,
      {
        actionId: `queue-task-launch::${task.id}`,
        routeKind: "task",
        anchorRef: `queue-row-${task.id}`,
        label: "Open task shell",
        summary: task.resumeActionSummary,
        actionState: dominantPosture,
        dominant: executionFamily === "triage_only",
      },
    ].filter((value): value is QueueMergeLaunchAction => Boolean(value)),
  };
}

export function buildQueueCallbackAdminMergeMap(input: {
  runtimeScenario: RuntimeScenario;
  taskIds: readonly string[];
}): Readonly<Record<string, QueueCallbackAdminMergeDigestProjection>> {
  return Object.fromEntries(
    input.taskIds.map((taskId) => [
      taskId,
      buildQueueCallbackAdminMergeDigest({
        runtimeScenario: input.runtimeScenario,
        taskId,
      }),
    ]),
  );
}
