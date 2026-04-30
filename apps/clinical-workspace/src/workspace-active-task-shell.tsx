import { useEffect, useState } from "react";
import { buildAutomationAnchorElementAttributes } from "@vecells/persistent-shell";
import { CasePulse, SharedStatusStrip } from "@vecells/design-system";
import type {
  PromotedSupportRegionProjection,
  StaffRouteKind,
  StaffShellRoute,
  TaskCanvasFrameProjection,
  TaskStackRowProjection,
  TaskWorkspaceProjection,
} from "./workspace-shell.data";
import {
  EndpointReasoningStage,
  MoreInfoInlineSideStage,
  ProtectedCompositionFreezeFrame,
  QuickCaptureTray,
} from "./workspace-reasoning-layer";
import {
  ArtifactViewerStage,
  AttachmentDigestGrid,
  PatientResponseThreadPanel,
} from "./workspace-attachment-thread";
import { DeltaFirstResumeShell } from "./workspace-changed-review";
import type { WorkspaceFocusContinuityProjection } from "./workspace-focus-continuity.data";
import {
  BufferedQueueChangeTray,
  CompletionContinuityStage,
  DepartureReturnStub,
  NextTaskPostureCard,
  ProtectedCompositionRecovery,
  WorkspaceProtectionStrip,
} from "./workspace-focus-continuity";
import {
  WORKSPACE_FOCUS_TARGET_IDS,
  buildWorkspaceSurfaceAttributes,
} from "./workspace-accessibility";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function stackToneLabel(tone: TaskStackRowProjection["tone"]): string {
  switch (tone) {
    case "accent":
      return "accent";
    case "caution":
      return "caution";
    case "critical":
      return "critical";
    case "neutral":
    default:
      return "neutral";
  }
}

function routeStateLabel(kind: StaffRouteKind): string {
  switch (kind) {
    case "task":
      return "Active review";
    case "more-info":
      return "More-info child route";
    case "decision":
      return "Decision child route";
    default:
      return "Workspace route";
  }
}

function publicTaskText(value: string): string {
  return value
    .replace(/\bEvidenceStack\b/g, "Evidence")
    .replace(/\bDeltaStack\b/g, "Change review")
    .replace(/\bauthoritative delta packet\b/gi, "confirmed change")
    .replace(/\bdelta packet\b/gi, "change update")
    .replace(/\bdecisive delta\b/gi, "important change")
    .replace(/\bdelta\b/gi, "change")
    .replace(/\binvalidates\b/gi, "changes")
    .replace(/\binvalidated\b/gi, "changed")
    .replace(/\bauthoritative\b/gi, "confirmed")
    .replace(/\bLineage\b/g, "History")
    .replace(/\blineage\b/gi, "history")
    .replace(/\bposture\b/gi, "status")
    .replace(/\btruth\b/gi, "confirmed information")
    .replace(/\btuple\b/gi, "details")
    .replace(/\bstub\b/gi, "summary")
    .replace(/\brequest_215_callback\b/g, "callback request")
    .replace(/\bcluster_214_callback\b/g, "callback conversation")
    .replace(/\b[a-z]+(?:_[a-z0-9]+)+\b/g, (token) =>
      token.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    );
}

type WorkspaceRuntimeScenario =
  | "live"
  | "stale_review"
  | "read_only"
  | "recovery_only"
  | "blocked";

function StackRows({
  rows,
  formatText = (value: string) => value,
}: {
  rows: readonly TaskStackRowProjection[];
  formatText?: (value: string) => string;
}) {
  return (
    <div className="staff-shell__stack-rows">
      {rows.map((row) => (
        <article
          key={row.id}
          className="staff-shell__stack-row"
          data-tone={stackToneLabel(row.tone)}
        >
          <div className="staff-shell__stack-row-head">
            <span>{formatText(row.label)}</span>
            <strong>{formatText(row.value)}</strong>
          </div>
          <p>{formatText(row.detail)}</p>
        </article>
      ))}
    </div>
  );
}

export function CasePulseBand({
  projection,
  route,
}: {
  projection: TaskWorkspaceProjection;
  route: StaffShellRoute;
}) {
  return (
    <section
      className="staff-shell__case-pulse-band"
      data-testid="case-pulse-band"
      data-opening-mode={projection.openingMode}
      data-route-state={route.kind}
    >
      <div className="staff-shell__case-pulse-main">
        <CasePulse pulse={projection.casePulse} />
      </div>
      <div className="staff-shell__case-pulse-meta">
        <div>
          <strong>Route state</strong>
          <span>{routeStateLabel(route.kind)}</span>
        </div>
        <div>
          <strong>Opening mode</strong>
          <span>{projection.openingMode.replaceAll("_", " ")}</span>
        </div>
        <div>
          <strong>Decision epoch</strong>
          <span data-decision-epoch-ref={projection.decisionEpochRef}>Current decision</span>
        </div>
        <div>
          <strong>Review lease</strong>
          <span data-review-action-lease-ref={projection.reviewActionLeaseRef}>Review active</span>
        </div>
        <div>
          <strong>Trust envelope</strong>
          <span data-workspace-trust-envelope-ref={projection.workspaceTrustEnvelopeRef}>Ready</span>
        </div>
        <div>
          <strong>Selected item</strong>
          <span data-selected-anchor-ref={projection.selectedAnchorRef}>Current task</span>
        </div>
      </div>
    </section>
  );
}

export function TaskStatusStrip({ projection }: { projection: TaskWorkspaceProjection }) {
  return (
    <section
      className="staff-shell__task-status-strip"
      data-testid="task-status-strip"
      data-shell-posture={projection.shellPosture}
      data-local-ack-state={projection.reasoningLayer.rapidEntryDraft.autosaveState}
    >
      <SharedStatusStrip input={projection.statusInput} />
      <div className="staff-shell__task-status-meta">
        <span>
          <strong>Status</strong>
          <span data-status-truth-tuple-ref={projection.statusTruthTupleRef}>Ready</span>
        </span>
        <span>
          <strong>Focus</strong>
          <span data-decision-dock-focus-lease-ref={projection.decisionDockFocusLeaseRef}>
            Task canvas
          </span>
        </span>
        <span>
          <strong>Review</strong>
          <span data-quiet-settlement-envelope-ref={projection.quietSettlementEnvelopeRef}>
            Pending
          </span>
        </span>
      </div>
    </section>
  );
}

export function SummaryStack({ frame }: { frame: TaskCanvasFrameProjection }) {
  return (
    <section className="staff-shell__task-stack" data-testid="summary-stack">
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">{frame.summaryStack.title}</span>
        <h3>{frame.summaryStack.headline}</h3>
        <p>{frame.summaryStack.dominantQuestion}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span>Ownership</span>
        <strong>{frame.summaryStack.ownershipSummary}</strong>
      </div>
      <StackRows rows={frame.summaryStack.rows} />
    </section>
  );
}

export function DeltaStack({ frame }: { frame: TaskCanvasFrameProjection }) {
  return (
    <section
      className="staff-shell__task-stack staff-shell__task-stack--delta"
      data-testid="delta-stack"
      data-expanded-by-default={frame.deltaStack.expandedByDefault ? "true" : "false"}
      data-delta-class={frame.deltaStack.deltaClass}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">{publicTaskText(frame.deltaStack.title)}</span>
        <h3>{publicTaskText(frame.deltaStack.headline)}</h3>
        <p>{publicTaskText(frame.deltaStack.decisiveMeaning)}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span style={{ textTransform: "none" }}>
          Change summary
        </span>
        <strong data-delta-packet-ref={frame.deltaStack.authoritativeDeltaPacketRef}>
          {frame.deltaStack.deltaClass === "decisive" ? "Needs review" : "Updated information"}
        </strong>
      </div>
      <StackRows rows={frame.deltaStack.rows} formatText={publicTaskText} />
      <div
        className="staff-shell__superseded-context"
        data-testid="superseded-context"
      >
        {frame.deltaStack.supersededContextRefs.map((item) => (
          <span key={item}>{publicTaskText(item)}</span>
        ))}
      </div>
    </section>
  );
}

export function EvidenceStack({ frame }: { frame: TaskCanvasFrameProjection }) {
  return (
    <section className="staff-shell__task-stack" data-testid="evidence-stack">
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">{publicTaskText(frame.evidenceStack.title)}</span>
        <h3>{frame.evidenceStack.headline}</h3>
        <p>{publicTaskText(frame.evidenceStack.lineageStripLabel)}</p>
      </header>
      <StackRows rows={frame.evidenceStack.rows} />
    </section>
  );
}

export function ConsequenceStack({ frame }: { frame: TaskCanvasFrameProjection }) {
  return (
    <section className="staff-shell__task-stack" data-testid="consequence-stack">
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">{publicTaskText(frame.consequenceStack.title)}</span>
        <h3>{publicTaskText(frame.consequenceStack.headline)}</h3>
        <p>{publicTaskText(frame.consequenceStack.decisionPreviewSummary)}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span>Current preview</span>
        <strong>{publicTaskText(frame.consequenceStack.decisionPreviewLabel)}</strong>
      </div>
      <StackRows rows={frame.consequenceStack.rows} />
    </section>
  );
}

export function ReferenceStack({
  frame,
  onOpenArtifact,
  onCloseArtifact,
  onSelectThreadEvent,
  onResetThreadSelection,
}: {
  frame: TaskCanvasFrameProjection;
  onOpenArtifact: (artifactId: string) => void;
  onCloseArtifact: () => void;
  onSelectThreadEvent: (eventId: string) => void;
  onResetThreadSelection: () => void;
}) {
  const referenceLayer = frame.referenceStack.attachmentAndThread;
  const [isOpen, setIsOpen] = useState(!frame.referenceStack.collapsedByDefault);

  useEffect(() => {
    if (referenceLayer.artifactViewerStage || referenceLayer.patientResponseThreadPanel.anchorStub) {
      setIsOpen(true);
    }
  }, [referenceLayer.artifactViewerStage, referenceLayer.patientResponseThreadPanel.anchorStub]);

  return (
    <details
      className="staff-shell__task-stack staff-shell__task-stack--reference"
      data-testid="reference-stack"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="staff-shell__task-stack-summary">
        <div>
          <span className="staff-shell__eyebrow">{publicTaskText(frame.referenceStack.title)}</span>
          <strong>{publicTaskText(frame.referenceStack.headline)}</strong>
        </div>
        <span>{publicTaskText(frame.referenceStack.digestLabel)}</span>
      </summary>
      <div className="staff-shell__reference-layer">
        <StackRows rows={frame.referenceStack.rows} />
        <AttachmentDigestGrid
          projection={referenceLayer.attachmentDigestGrid}
          onOpenArtifact={onOpenArtifact}
        />
        <div
          className="staff-shell__reference-support-layout"
          data-viewer-open={referenceLayer.artifactViewerStage ? "true" : "false"}
        >
          {referenceLayer.artifactViewerStage && (
            <ArtifactViewerStage
              projection={referenceLayer.artifactViewerStage}
              onClose={onCloseArtifact}
            />
          )}
          <PatientResponseThreadPanel
            projection={referenceLayer.patientResponseThreadPanel}
            onSelectEvent={onSelectThreadEvent}
            onResetSelection={onResetThreadSelection}
            onOpenArtifact={onOpenArtifact}
          />
        </div>
      </div>
    </details>
  );
}

export function PromotedSupportRegion({
  region,
  runtimeScenario,
}: {
  region: PromotedSupportRegionProjection;
  runtimeScenario: WorkspaceRuntimeScenario;
}) {
  return (
    <aside
      className="staff-shell__promoted-support-region"
      data-testid="promoted-support-region"
      data-region-kind={region.kind}
      id={WORKSPACE_FOCUS_TARGET_IDS.context}
      tabIndex={-1}
      role="complementary"
      aria-labelledby="workspace-context-heading"
      {...buildWorkspaceSurfaceAttributes({
        surface: "context_region",
        surfaceState: region.kind,
        focusModel: "tab_ring",
        selectedAnchorRef: region.quietReturnTargetRef,
        runtimeScenario,
      })}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">Support region</span>
        <h3 id="workspace-context-heading">{region.title}</h3>
        <p>{region.summary}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span>Return target</span>
        <strong data-quiet-return-target-ref={region.quietReturnTargetRef}>Task summary</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>State</span>
        <strong>{region.stateLabel}</strong>
      </div>
      <StackRows rows={region.rows} />
      <button type="button" className="staff-shell__inline-action">
        {region.actionLabel}
      </button>
    </aside>
  );
}

export function TaskCanvas({
  projection,
  runtimeScenario,
  onOpenArtifact,
  onCloseArtifact,
  onSelectThreadEvent,
  onResetThreadSelection,
}: {
  projection: TaskWorkspaceProjection;
  runtimeScenario: WorkspaceRuntimeScenario;
  onOpenArtifact: (artifactId: string) => void;
  onCloseArtifact: () => void;
  onSelectThreadEvent: (eventId: string) => void;
  onResetThreadSelection: () => void;
}) {
  return (
    <section
      className="staff-shell__task-canvas-frame"
      data-testid="task-canvas-frame"
      data-primary-region-binding={projection.taskCanvasFrame.primaryRegionBindingRef}
      data-status-strip-authority={projection.taskCanvasFrame.statusStripAuthorityRef}
      id={WORKSPACE_FOCUS_TARGET_IDS.taskCanvas}
      tabIndex={-1}
      role="region"
      aria-labelledby="workspace-task-canvas-heading"
      {...buildWorkspaceSurfaceAttributes({
        surface: "task_canvas",
        surfaceState: projection.shellPosture,
        focusModel: "tab_ring",
        selectedAnchorRef: projection.selectedAnchorRef,
        runtimeScenario,
      })}
    >
      <h2 id="workspace-task-canvas-heading" className="sr-only">
        Task canvas
      </h2>
      <div className="staff-shell__task-canvas-main">
        <SummaryStack frame={projection.taskCanvasFrame} />
        <DeltaStack frame={projection.taskCanvasFrame} />
        <EvidenceStack frame={projection.taskCanvasFrame} />
        <ConsequenceStack frame={projection.taskCanvasFrame} />
        <ReferenceStack
          frame={projection.taskCanvasFrame}
          onOpenArtifact={onOpenArtifact}
          onCloseArtifact={onCloseArtifact}
          onSelectThreadEvent={onSelectThreadEvent}
          onResetThreadSelection={onResetThreadSelection}
        />
      </div>
    </section>
  );
}

export function DecisionDock({
  projection,
  focusContinuity,
  route,
  runtimeScenario,
  selectedDecision,
  onDecisionChange,
  onOpenMoreInfo,
  onOpenDecision,
  onOpenTask,
  onLaunchNext,
  onBufferedQueueApply,
  onBufferedQueueToggleReview,
  onBufferedQueueDefer,
  onOpenSupportStub,
  onReasonSelect,
  onQuestionSetSelect,
  onMacroSelect,
  onDuePickSelect,
  onNoteChange,
}: {
  projection: TaskWorkspaceProjection;
  focusContinuity: WorkspaceFocusContinuityProjection;
  route: StaffShellRoute;
  runtimeScenario: WorkspaceRuntimeScenario;
  selectedDecision: string;
  onDecisionChange: (value: string) => void;
  onOpenMoreInfo: () => void;
  onOpenDecision: () => void;
  onOpenTask: () => void;
  onLaunchNext: () => void;
  onBufferedQueueApply: () => void;
  onBufferedQueueToggleReview: () => void;
  onBufferedQueueDefer: () => void;
  onOpenSupportStub: () => void;
  onReasonSelect: (value: string) => void;
  onQuestionSetSelect: (value: string) => void;
  onMacroSelect: (value: string) => void;
  onDuePickSelect: (value: string) => void;
  onNoteChange: (value: string) => void;
}) {
  const dominantActionAttributes = buildAutomationAnchorElementAttributes({
    markerClass: "dominant_action",
    markerRef: `marker.${route.routeFamilyRef}.dominant_action`,
    domMarker: "dominant-action",
    routeFamilyRef: route.routeFamilyRef,
    shellSlug: "clinical-workspace",
    audienceSurface: "audsurf_clinical_workspace",
    disclosureFenceState: "safe",
    repeatedInstanceStrategy: "shared_anchor_only",
    selector: `[data-testid="decision-dock"]`,
    selectorAttribute: "data-testid",
    selectorValue: "decision-dock",
    supportingDomMarkers: ["data-dominant-action", "data-route-state"],
    supportingEventClasses: ["dominant_action_changed"],
    contractState: "exact",
    gapResolutionRef: null,
    source_refs: ["prompt/116.md"],
  });

  return (
    <aside
      className="staff-shell__decision-dock"
      data-testid="decision-dock"
      data-route-state={route.kind}
      data-dominant-action={selectedDecision}
      data-dock-state={projection.decisionDock.stateStability}
      id={WORKSPACE_FOCUS_TARGET_IDS.decisionDock}
      tabIndex={-1}
      role="complementary"
      aria-labelledby="workspace-decision-dock-heading"
      {...dominantActionAttributes}
      {...buildWorkspaceSurfaceAttributes({
        surface: "decision_dock",
        surfaceState: route.kind,
        focusModel: "tab_ring",
        selectedAnchorRef: projection.selectedAnchorRef,
        runtimeScenario,
      })}
    >
      <header className="staff-shell__decision-dock-head">
        <span className="staff-shell__eyebrow">Next action</span>
        <h3 id="workspace-decision-dock-heading">{projection.decisionDock.primaryActionLabel}</h3>
        <p>{projection.decisionDock.primaryActionReason}</p>
      </header>

      <div className="staff-shell__task-stack-inline">
        <span>Focus</span>
        <strong data-focus-lease-ref={projection.decisionDock.focusLeaseRef}>Task canvas</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Outcome preview</span>
        <strong>{publicTaskText(projection.decisionDock.consequencePreviewRef)}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Recommendation</span>
        <strong>{publicTaskText(projection.decisionDock.recommendationReasonRef)}</strong>
      </div>

      {projection.decisionDock.blockingReason && (
        <section className="staff-shell__dock-blocking-reason">
          <strong>Commit fencing</strong>
          <p>{projection.decisionDock.blockingReason}</p>
        </section>
      )}

      <QuickCaptureTray
        projection={projection}
        route={route}
        disabled={Boolean(projection.reasoningLayer.freezeFrame)}
        onOpenTask={onOpenTask}
        onOpenMoreInfo={onOpenMoreInfo}
        onOpenDecision={onOpenDecision}
        onDecisionChange={onDecisionChange}
        onReasonSelect={onReasonSelect}
        onQuestionSetSelect={onQuestionSetSelect}
        onMacroSelect={onMacroSelect}
        onDuePickSelect={onDuePickSelect}
        onNoteChange={onNoteChange}
      />

      <section className="staff-shell__decision-choice">
        <span className="staff-shell__capture-label">Decision shortlist</span>
        <div className="staff-shell__chip-row">
          {projection.decisionDock.shortlist.map((option) => (
            <button
              key={option}
              type="button"
              className="staff-shell__chip"
              data-active={selectedDecision === option ? "true" : "false"}
              onClick={() => onDecisionChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      {route.kind === "more-info" && (
        <MoreInfoInlineSideStage
          stage={projection.reasoningLayer.moreInfoStage}
          disabled={Boolean(projection.reasoningLayer.freezeFrame)}
        />
      )}

      {route.kind === "decision" && (
        <EndpointReasoningStage
          stage={projection.reasoningLayer.endpointReasoningStage}
          disabled={Boolean(projection.reasoningLayer.freezeFrame)}
        />
      )}

      {projection.reasoningLayer.freezeFrame && (
        <ProtectedCompositionFreezeFrame freezeFrame={projection.reasoningLayer.freezeFrame} />
      )}

      <CompletionContinuityStage projection={focusContinuity.completionContinuityStage} />

      {focusContinuity.bufferedQueueTray && (
        <BufferedQueueChangeTray
          projection={focusContinuity.bufferedQueueTray}
          onApply={onBufferedQueueApply}
          onToggleReview={onBufferedQueueToggleReview}
          onDefer={onBufferedQueueDefer}
        />
      )}

      <NextTaskPostureCard
        projection={focusContinuity.nextTaskPostureCard}
        noAutoAdvancePolicy={focusContinuity.noAutoAdvancePolicy}
        onLaunchNext={onLaunchNext}
      />

      <DepartureReturnStub projection={focusContinuity.departureReturnStub} />

      <div className="staff-shell__dock-actions">
        {route.kind !== "task" && (
          <button type="button" className="staff-shell__dock-action" onClick={onOpenTask}>
            Return to task shell
          </button>
        )}
        <button type="button" className="staff-shell__dock-action" onClick={onOpenMoreInfo}>
          More-info child route
        </button>
        <button type="button" className="staff-shell__dock-action" onClick={onOpenDecision}>
          Decision child route
        </button>
        <button
          type="button"
          className="staff-shell__dock-action staff-shell__dock-action--ghost"
          onClick={onOpenSupportStub}
        >
          Open support review
        </button>
      </div>

      <section
        className={classNames(
          "staff-shell__dock-support-note",
          route.kind !== "task" && "staff-shell__dock-support-note--active",
        )}
      >
          <strong>Child route handling</strong>
          <p>
            {route.kind === "task"
              ? "The next action stays dominant while child routes remain secondary states of the same task."
              : "Child-route work stays inside the active workspace and keeps the current case context visible."}
          </p>
      </section>
    </aside>
  );
}

export function ActiveTaskShell({
  projection,
  focusContinuity,
  route,
  runtimeScenario,
  selectedDecision,
  onDecisionChange,
  onOpenMoreInfo,
  onOpenDecision,
  onOpenTask,
  onLaunchNext,
  onBufferedQueueApply,
  onBufferedQueueToggleReview,
  onBufferedQueueDefer,
  onOpenSupportStub,
  onReasonSelect,
  onQuestionSetSelect,
  onMacroSelect,
  onDuePickSelect,
  onNoteChange,
  onOpenArtifact,
  onCloseArtifact,
  onSelectThreadEvent,
  onResetThreadSelection,
  onSelectAnchor,
}: {
  projection: TaskWorkspaceProjection;
  focusContinuity: WorkspaceFocusContinuityProjection;
  route: StaffShellRoute;
  runtimeScenario: WorkspaceRuntimeScenario;
  selectedDecision: string;
  onDecisionChange: (value: string) => void;
  onOpenMoreInfo: () => void;
  onOpenDecision: () => void;
  onOpenTask: () => void;
  onLaunchNext: () => void;
  onBufferedQueueApply: () => void;
  onBufferedQueueToggleReview: () => void;
  onBufferedQueueDefer: () => void;
  onOpenSupportStub: () => void;
  onReasonSelect: (value: string) => void;
  onQuestionSetSelect: (value: string) => void;
  onMacroSelect: (value: string) => void;
  onDuePickSelect: (value: string) => void;
  onNoteChange: (value: string) => void;
  onOpenArtifact: (artifactId: string) => void;
  onCloseArtifact: () => void;
  onSelectThreadEvent: (eventId: string) => void;
  onResetThreadSelection: () => void;
  onSelectAnchor: (anchorRef: string) => void;
}) {
  return (
    <div
      className="staff-shell__active-task-shell"
      data-testid="ActiveTaskShell"
      data-request-ref={projection.requestRef}
      data-request-lineage-ref={projection.requestLineageRef}
      data-patient-conversation-route={projection.patientConversationRouteRef}
      data-phase3-bundle-ref={projection.phase3ConversationBundleRef}
      data-evidence-delta-packet-ref={projection.evidenceDeltaPacketRef}
      data-more-info-response-disposition-ref={projection.moreInfoResponseDispositionRef}
      data-delivery-posture={projection.deliveryPosture}
      data-repair-posture={projection.repairPosture}
      data-opening-mode={projection.openingMode}
      data-shell-posture={projection.shellPosture}
      data-support-region={projection.promotedSupportRegion ? projection.promotedSupportRegion.kind : "none"}
      data-focus-protection={focusContinuity.focusState}
      data-protected-composition={focusContinuity.protectedMode}
      data-buffered-queue-batch={focusContinuity.bufferedQueueTray?.batchState ?? "hidden"}
      data-next-task-state={focusContinuity.nextTaskPostureCard.nextTaskState}
      data-auto-advance={focusContinuity.noAutoAdvancePolicy}
      {...buildWorkspaceSurfaceAttributes({
        surface: "active_task_shell",
        surfaceState: projection.shellPosture,
        focusModel: "tab_ring",
        selectedAnchorRef: projection.selectedAnchorRef,
        runtimeScenario,
      })}
    >
      <WorkspaceProtectionStrip
        projection={focusContinuity.protectionStrip}
        onToggleTray={onBufferedQueueToggleReview}
      />
      <CasePulseBand projection={projection} route={route} />
      <TaskStatusStrip projection={projection} />
      {focusContinuity.recovery && <ProtectedCompositionRecovery projection={focusContinuity.recovery} />}
      {projection.deltaFirstResumeShell && (
        <DeltaFirstResumeShell
          projection={projection.deltaFirstResumeShell}
          onSelectAnchor={onSelectAnchor}
        />
      )}
      <TaskCanvas
        projection={projection}
        runtimeScenario={runtimeScenario}
        onOpenArtifact={onOpenArtifact}
        onCloseArtifact={onCloseArtifact}
        onSelectThreadEvent={onSelectThreadEvent}
        onResetThreadSelection={onResetThreadSelection}
      />
      <DecisionDock
        projection={projection}
        focusContinuity={focusContinuity}
        route={route}
        runtimeScenario={runtimeScenario}
        selectedDecision={selectedDecision}
        onDecisionChange={onDecisionChange}
        onOpenMoreInfo={onOpenMoreInfo}
        onOpenDecision={onOpenDecision}
        onOpenTask={onOpenTask}
        onLaunchNext={onLaunchNext}
        onBufferedQueueApply={onBufferedQueueApply}
        onBufferedQueueToggleReview={onBufferedQueueToggleReview}
        onBufferedQueueDefer={onBufferedQueueDefer}
        onOpenSupportStub={onOpenSupportStub}
        onReasonSelect={onReasonSelect}
        onQuestionSetSelect={onQuestionSetSelect}
        onMacroSelect={onMacroSelect}
        onDuePickSelect={onDuePickSelect}
        onNoteChange={onNoteChange}
      />
      {projection.promotedSupportRegion && (
        <PromotedSupportRegion region={projection.promotedSupportRegion} runtimeScenario={runtimeScenario} />
      )}
    </div>
  );
}
