import { useId } from "react";
import type {
  QueueRowPresentationContract,
  StaffQueueCase,
  StaffRouteKind,
  StaffShellLedger,
} from "./workspace-shell.data";

export const ASSISTIVE_QUEUE_ASSURANCE_VISUAL_MODE =
  "Assistive_Queue_Assurance_Continuum";

export type AssistiveContinuumPosture =
  | "shadow_only"
  | "observe_only"
  | "degraded"
  | "quarantined"
  | "frozen"
  | "blocked_by_policy";

export type AssistiveContinuumActionability =
  | "manual_review_only"
  | "observe_only"
  | "recovery_only"
  | "provenance_only"
  | "blocked";

export type AssistiveQueueAndAssuranceMergeState = {
  visualMode: typeof ASSISTIVE_QUEUE_ASSURANCE_VISUAL_MODE;
  taskId: string;
  patientLabel: string;
  queueKey: string;
  routeKind: StaffRouteKind;
  selectedAnchorRef: string;
  trustPosture: AssistiveContinuumPosture;
  actionability: AssistiveContinuumActionability;
  queueCue: {
    capabilityFamilyLabel: string;
    trustLabel: string;
    helperLabel: string;
    actionabilityCeiling: string;
  };
  contextPocket: {
    queueContextRef: string;
    selectedAnchorRef: string;
    continuityStubLabel: string;
    sameShellReturnLabel: string;
  };
  stageBridge: {
    bridgeRef: string;
    label: string;
    detail: string;
    targetStageMode: "promoted" | "downgraded" | "folded";
  };
  opsTrustSummary: {
    driftLabel: string;
    trustEnvelopeRef: string;
    monitoringRef: string;
    freezeLabel: string;
    incidentLabel: string;
  };
  releaseAssurance: {
    candidateRef: string;
    baselineSnapshotRef: string;
    rolloutRungLabel: string;
    rollbackRef: string;
    vendorAuditRef: string;
    vendorSafetyRef: string;
  };
  recoveryFrame: {
    recoveryLabel: string;
    freezeVocabulary: string;
    suppressedActionLabel: string;
    explanation: string;
  };
};

export type AssistiveQueueAndAssuranceMergeAdapterInput = {
  task: StaffQueueCase;
  row?: QueueRowPresentationContract;
  routeKind: StaffRouteKind;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorRef: string;
  queueKey?: string | null;
};

function postureForRuntime(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): AssistiveContinuumPosture {
  switch (runtimeScenario) {
    case "read_only":
      return "observe_only";
    case "stale_review":
    case "recovery_only":
      return "degraded";
    case "blocked":
      return "frozen";
    case "live":
    default:
      return "shadow_only";
  }
}

function actionabilityForPosture(
  posture: AssistiveContinuumPosture,
): AssistiveContinuumActionability {
  switch (posture) {
    case "shadow_only":
      return "manual_review_only";
    case "observe_only":
      return "observe_only";
    case "degraded":
      return "recovery_only";
    case "frozen":
      return "provenance_only";
    case "blocked_by_policy":
    case "quarantined":
    default:
      return "blocked";
  }
}

function trustLabelForPosture(posture: AssistiveContinuumPosture): string {
  switch (posture) {
    case "shadow_only":
      return "Shadow only";
    case "observe_only":
      return "Observe only";
    case "degraded":
      return "Degraded";
    case "quarantined":
      return "Quarantined";
    case "frozen":
      return "Frozen";
    case "blocked_by_policy":
      return "Blocked";
  }
}

function helperForPosture(posture: AssistiveContinuumPosture): string {
  switch (posture) {
    case "shadow_only":
      return "Cue only";
    case "observe_only":
      return "Read only";
    case "degraded":
      return "Recover";
    case "frozen":
      return "Frozen";
    case "quarantined":
      return "Contained";
    case "blocked_by_policy":
      return "Blocked";
  }
}

function bridgeStageForPosture(
  posture: AssistiveContinuumPosture,
): AssistiveQueueAndAssuranceMergeState["stageBridge"]["targetStageMode"] {
  switch (posture) {
    case "degraded":
    case "frozen":
      return "downgraded";
    case "observe_only":
      return "folded";
    case "shadow_only":
    case "quarantined":
    case "blocked_by_policy":
    default:
      return "promoted";
  }
}

export function buildAssistiveQueueAndAssuranceMergeState({
  task,
  row,
  routeKind,
  runtimeScenario,
  selectedAnchorRef,
  queueKey,
}: AssistiveQueueAndAssuranceMergeAdapterInput): AssistiveQueueAndAssuranceMergeState {
  const trustPosture = postureForRuntime(runtimeScenario);
  const actionability = actionabilityForPosture(trustPosture);
  const effectiveQueueKey = queueKey ?? task.queueKey;
  const selectedAnchor = row?.anchorRef ?? selectedAnchorRef;
  const trustLabel = trustLabelForPosture(trustPosture);
  const helperLabel = helperForPosture(trustPosture);

  return {
    visualMode: ASSISTIVE_QUEUE_ASSURANCE_VISUAL_MODE,
    taskId: task.id,
    patientLabel: task.patientLabel,
    queueKey: effectiveQueueKey,
    routeKind,
    selectedAnchorRef: selectedAnchor,
    trustPosture,
    actionability,
    queueCue: {
      capabilityFamilyLabel: "Documentation",
      trustLabel,
      helperLabel,
      actionabilityCeiling:
        actionability === "manual_review_only"
          ? "No autonomous write"
          : actionability.replaceAll("_", " "),
    },
    contextPocket: {
      queueContextRef: `assistive_queue_context.427.${effectiveQueueKey}.${task.id}`,
      selectedAnchorRef: selectedAnchor,
      continuityStubLabel: `From ${effectiveQueueKey} queue`,
      sameShellReturnLabel: "Return keeps queue row and selected anchor traceable",
    },
    stageBridge: {
      bridgeRef: `assistive_queue_open_to_stage_bridge.427.${task.id}.${selectedAnchor}`,
      label: "Open with assistive context",
      detail:
        "The task opens in the current workspace shell; queue context remains attached to the assistive stage.",
      targetStageMode: bridgeStageForPosture(trustPosture),
    },
    opsTrustSummary: {
      driftLabel:
        trustPosture === "shadow_only"
          ? "No drift requiring operator action"
          : "Trust posture narrowed across queue and task",
      trustEnvelopeRef: `assistive_capability_trust_envelope.427.${task.id}.${selectedAnchor}`,
      monitoringRef: `assistive_monitoring_projection.415.${task.id}.queue_assurance`,
      freezeLabel:
        trustPosture === "frozen" || trustPosture === "degraded"
          ? "Freeze vocabulary active"
          : "Freeze path available",
      incidentLabel:
        trustPosture === "frozen"
          ? "Incident review required before widening"
          : "No open incident escalation",
    },
    releaseAssurance: {
      candidateRef: `assistive_release_candidate.417.${task.id}.continuum`,
      baselineSnapshotRef: `assurance_baseline_snapshot.426.${task.id}.audit_safety`,
      rolloutRungLabel:
        trustPosture === "shadow_only"
          ? "Shadow rung only"
          : "Rollout held below write posture",
      rollbackRef: `rollback_readiness_bundle.417.${task.id}.assistive`,
      vendorAuditRef: "data/config/426_model_audit_baseline.example.json",
      vendorSafetyRef: "data/config/426_model_safety_baseline.example.json",
    },
    recoveryFrame: {
      recoveryLabel:
        trustPosture === "degraded"
          ? "Recover in place"
          : trustPosture === "frozen"
            ? "Frozen in place"
            : "Recovery vocabulary ready",
      freezeVocabulary: trustLabel,
      suppressedActionLabel:
        actionability === "manual_review_only"
          ? "Completion-adjacent controls stay human-owned"
          : "Assistive widening controls suppressed",
      explanation:
        "Queue, task, ops, and release surfaces reuse the same posture, provenance, freeze, and recovery grammar.",
    },
  };
}

export function AssistiveQueueTrustBadge({
  state,
}: {
  state: AssistiveQueueAndAssuranceMergeState;
}) {
  return (
    <span
      className="assistive-continuum__trust-badge"
      data-testid="AssistiveQueueTrustBadge"
      data-posture={state.trustPosture}
    >
      {state.queueCue.trustLabel}
    </span>
  );
}

export function AssistiveQueueCue({
  state,
}: {
  state: AssistiveQueueAndAssuranceMergeState;
}) {
  return (
    <div
      className="assistive-continuum__queue-cue"
      data-testid="AssistiveQueueCue"
      data-visual-mode={state.visualMode}
      data-posture={state.trustPosture}
      role="status"
      aria-label={`Assistive cue: ${state.queueCue.capabilityFamilyLabel}, ${state.queueCue.trustLabel}, ${state.queueCue.actionabilityCeiling}`}
    >
      <AssistiveQueueTrustBadge state={state} />
      <span className="assistive-continuum__queue-cue-label">
        {state.queueCue.capabilityFamilyLabel}
      </span>
      <span className="assistive-continuum__queue-cue-helper">
        {state.queueCue.helperLabel}
      </span>
    </div>
  );
}

export function AssistiveQueueContextPocket({
  state,
}: {
  state: AssistiveQueueAndAssuranceMergeState;
}) {
  const headingId = useId();
  return (
    <section
      className="assistive-continuum__context-pocket"
      data-testid="AssistiveQueueContextPocket"
      data-visual-mode={state.visualMode}
      aria-labelledby={headingId}
    >
      <span className="assistive-continuum__eyebrow">Assistive queue context</span>
      <h3 id={headingId}>{state.contextPocket.continuityStubLabel}</h3>
      <p>{state.contextPocket.sameShellReturnLabel}</p>
      <dl>
        <div>
          <dt>Context ref</dt>
          <dd>{state.contextPocket.queueContextRef}</dd>
        </div>
        <div>
          <dt>Selected anchor</dt>
          <dd>{state.contextPocket.selectedAnchorRef}</dd>
        </div>
      </dl>
    </section>
  );
}

export function AssistiveQueueOpenToStageBridge({
  state,
  onOpenStage,
}: {
  state: AssistiveQueueAndAssuranceMergeState;
  onOpenStage?: () => void;
}) {
  return (
    <section
      className="assistive-continuum__stage-bridge"
      data-testid="AssistiveQueueOpenToStageBridge"
      data-target-stage={state.stageBridge.targetStageMode}
      aria-label="Assistive queue to stage bridge"
    >
      <div>
        <span className="assistive-continuum__eyebrow">Same-shell bridge</span>
        <strong>{state.stageBridge.label}</strong>
        <p>{state.stageBridge.detail}</p>
      </div>
      {onOpenStage ? (
        <button type="button" className="assistive-continuum__button" onClick={onOpenStage}>
          Open task
        </button>
      ) : (
        <span className="assistive-continuum__micro">{state.stageBridge.bridgeRef}</span>
      )}
    </section>
  );
}

export function AssistiveOpsTrustSummaryCard({
  state,
}: {
  state: AssistiveQueueAndAssuranceMergeState;
}) {
  const headingId = useId();
  return (
    <section
      className="assistive-continuum__summary-card assistive-continuum__summary-card--ops"
      data-testid="AssistiveOpsTrustSummaryCard"
      data-posture={state.trustPosture}
      aria-labelledby={headingId}
    >
      <span className="assistive-continuum__eyebrow">Assistive Ops</span>
      <h3 id={headingId}>Trust summary</h3>
      <p>{state.opsTrustSummary.driftLabel}</p>
      <dl>
        <div>
          <dt>Trust envelope</dt>
          <dd>{state.opsTrustSummary.trustEnvelopeRef}</dd>
        </div>
        <div>
          <dt>Monitoring</dt>
          <dd>{state.opsTrustSummary.monitoringRef}</dd>
        </div>
      </dl>
    </section>
  );
}

export function AssistiveOpsIncidentAndFreezeStrip({
  state,
}: {
  state: AssistiveQueueAndAssuranceMergeState;
}) {
  const alerting = state.trustPosture === "frozen" || state.trustPosture === "blocked_by_policy";
  return (
    <section
      className="assistive-continuum__freeze-strip"
      data-testid="AssistiveOpsIncidentAndFreezeStrip"
      data-posture={state.trustPosture}
      role={alerting ? "alert" : "status"}
      aria-label={`Assistive incident and freeze posture: ${state.opsTrustSummary.freezeLabel}`}
    >
      <span>{state.opsTrustSummary.freezeLabel}</span>
      <strong>{state.opsTrustSummary.incidentLabel}</strong>
    </section>
  );
}

export function AssistiveReleaseCandidateDeltaBadge({
  state,
}: {
  state: AssistiveQueueAndAssuranceMergeState;
}) {
  return (
    <span
      className="assistive-continuum__release-delta"
      data-testid="AssistiveReleaseCandidateDeltaBadge"
      data-rollout-rung={state.releaseAssurance.rolloutRungLabel}
    >
      {state.releaseAssurance.rolloutRungLabel}
    </span>
  );
}

export function AssistiveReleaseAssuranceSummaryCard({
  state,
}: {
  state: AssistiveQueueAndAssuranceMergeState;
}) {
  const headingId = useId();
  return (
    <section
      className="assistive-continuum__summary-card assistive-continuum__summary-card--release"
      data-testid="AssistiveReleaseAssuranceSummaryCard"
      aria-labelledby={headingId}
    >
      <div className="assistive-continuum__card-head">
        <div>
          <span className="assistive-continuum__eyebrow">Release Admin</span>
          <h3 id={headingId}>Assurance summary</h3>
        </div>
        <AssistiveReleaseCandidateDeltaBadge state={state} />
      </div>
      <dl>
        <div>
          <dt>Candidate</dt>
          <dd>{state.releaseAssurance.candidateRef}</dd>
        </div>
        <div>
          <dt>Baseline</dt>
          <dd>{state.releaseAssurance.baselineSnapshotRef}</dd>
        </div>
        <div>
          <dt>Audit</dt>
          <dd>{state.releaseAssurance.vendorAuditRef}</dd>
        </div>
        <div>
          <dt>Safety</dt>
          <dd>{state.releaseAssurance.vendorSafetyRef}</dd>
        </div>
      </dl>
    </section>
  );
}

export function AssistiveCrossSurfaceRecoveryFrame({
  state,
}: {
  state: AssistiveQueueAndAssuranceMergeState;
}) {
  const headingId = useId();
  return (
    <section
      className="assistive-continuum__recovery-frame"
      data-testid="AssistiveCrossSurfaceRecoveryFrame"
      data-posture={state.trustPosture}
      aria-labelledby={headingId}
    >
      <span className="assistive-continuum__eyebrow">Cross-surface recovery</span>
      <h3 id={headingId}>{state.recoveryFrame.recoveryLabel}</h3>
      <p>{state.recoveryFrame.explanation}</p>
      <div className="assistive-continuum__recovery-path" aria-label="Recovery status path">
        <span data-active="true">Queue</span>
        <span data-active="true">Task</span>
        <span data-active="true">Ops</span>
        <span data-active="true">Release</span>
      </div>
      <p className="assistive-continuum__micro">
        {state.recoveryFrame.freezeVocabulary}: {state.recoveryFrame.suppressedActionLabel}
      </p>
    </section>
  );
}

export function AssistiveQueueAndAssuranceMergeAdapter({
  state,
}: {
  state: AssistiveQueueAndAssuranceMergeState;
}) {
  return (
    <section
      className="assistive-continuum"
      data-testid="AssistiveQueueAndAssuranceMergeAdapter"
      data-visual-mode={state.visualMode}
      aria-label="Assistive queue and assurance continuum"
    >
      <AssistiveOpsTrustSummaryCard state={state} />
      <AssistiveOpsIncidentAndFreezeStrip state={state} />
      <AssistiveReleaseAssuranceSummaryCard state={state} />
      <AssistiveCrossSurfaceRecoveryFrame state={state} />
    </section>
  );
}

