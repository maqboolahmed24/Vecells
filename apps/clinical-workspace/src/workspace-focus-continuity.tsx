import type {
  BufferedQueueChangeTrayProjection,
  CompletionContinuityStageProjection,
  DepartureReturnStubProjection,
  NextTaskPostureCardProjection,
  ProtectedCompositionRecoveryProjection,
  WorkspaceFocusContinuityProjection,
  WorkspaceProtectionStripProjection,
} from "./workspace-focus-continuity.data";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function WorkspaceProtectionStrip({
  projection,
  onToggleTray,
}: {
  projection: WorkspaceProtectionStripProjection;
  onToggleTray: () => void;
}) {
  if (!projection.visible) {
    return null;
  }

  return (
    <section
      className="staff-shell__focus-protection-strip"
      data-testid="WorkspaceProtectionStrip"
      data-focus-protection={projection.focusState}
      data-protected-composition={projection.protectedMode}
    >
      <div
        className="staff-shell__focus-protection-copy"
        data-testid="protected-composition-ribbon"
      >
        <span className="staff-shell__eyebrow">WorkspaceFocusProtectionLease</span>
        <strong>{projection.title}</strong>
        <p>{projection.summary}</p>
      </div>
      <div className="staff-shell__focus-protection-meta">
        <span>
          <strong>Protected subject</strong>
          {projection.protectedSubject}
        </span>
        <span>
          <strong>Drift state</strong>
          {projection.invalidatingDriftState}
        </span>
        <span>
          <strong>Queued changes</strong>
          {projection.waitingBatchCount}
        </span>
        {projection.trayActionLabel && (
          <button type="button" className="staff-shell__inline-action" onClick={onToggleTray}>
            {projection.trayActionLabel}
          </button>
        )}
      </div>
    </section>
  );
}

export function BufferedQueueChangeTray({
  projection,
  onApply,
  onToggleReview,
  onDefer,
}: {
  projection: BufferedQueueChangeTrayProjection;
  onApply: () => void;
  onToggleReview: () => void;
  onDefer: () => void;
}) {
  return (
    <section
      className="staff-shell__buffered-queue-tray"
      data-testid="BufferedQueueChangeTray"
      data-buffered-queue-batch={projection.batchState}
      data-tray-state={projection.trayState}
      data-focus-conflict-state={projection.focusConflictState}
    >
      <header className="staff-shell__buffered-queue-head">
        <div>
          <span className="staff-shell__eyebrow">Queue update</span>
          <strong>{projection.title}</strong>
          <p>{projection.summary}</p>
        </div>
        <div className="staff-shell__buffered-queue-count">
          <span>Total waiting</span>
          <strong>{projection.totalCount}</strong>
        </div>
      </header>

      <div className="staff-shell__buffered-queue-meta">
        <span>
          <strong>Current queue</strong>
          Preserved
        </span>
        <span>
          <strong>Updated queue</strong>
          Ready
        </span>
        <span>
          <strong>Selected row</strong>
          Preserved
        </span>
      </div>

      {projection.trayState === "expanded" && (
        <div className="staff-shell__buffered-queue-groups">
          {projection.groups.map((group) => (
            <article
              key={group.groupId}
              className="staff-shell__buffered-queue-group"
              data-tone={group.tone}
            >
              <div className="staff-shell__buffered-queue-group-head">
                <span>{group.label}</span>
                <strong>{group.count}</strong>
              </div>
              <p>{group.detail}</p>
            </article>
          ))}
        </div>
      )}

      <div className="staff-shell__buffered-queue-actions">
        <button
          type="button"
          className="staff-shell__inline-action"
          onClick={onApply}
          disabled={!projection.applyEnabled}
          aria-describedby={`${projection.trayId}-apply-reason`}
          aria-label={`${projection.applyLabel} Apply queued changes`}
        >
          {projection.applyLabel}
        </button>
        <button type="button" className="staff-shell__utility-button" onClick={onToggleReview}>
          {projection.reviewLabel}
        </button>
        <button type="button" className="staff-shell__utility-button" onClick={onDefer}>
          {projection.deferLabel}
        </button>
      </div>
      <p id={`${projection.trayId}-apply-reason`} className="staff-shell__buffered-queue-apply-reason">
        {projection.applyReason}
      </p>
    </section>
  );
}

export function ProtectedCompositionRecovery({
  projection,
}: {
  projection: ProtectedCompositionRecoveryProjection;
}) {
  return (
    <section
      className="staff-shell__protected-recovery"
      data-testid="ProtectedCompositionRecovery"
      data-recovery-state={projection.recoveryState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">Recovery support</span>
        <h3>{projection.headline}</h3>
        <p>{projection.summary}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span>Preserved item</span>
        <strong data-preserved-anchor-ref={projection.preservedAnchorRef}>Current task</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Decision</span>
        <strong data-preserved-decision-epoch-ref={projection.preservedDecisionEpochRef}>
          Current review
        </strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Return target</span>
        <strong data-quiet-return-target-ref={projection.quietReturnTargetRef}>Task summary</strong>
      </div>
      <ul className="staff-shell__recovery-list">
        {projection.blockingReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <div className="staff-shell__protected-recovery-footer">
        <span>{projection.preservedDraftSummary}</span>
        <button type="button" className="staff-shell__inline-action">
          {projection.recoveryActionLabel}
        </button>
      </div>
    </section>
  );
}

export function CompletionContinuityStage({
  projection,
}: {
  projection: CompletionContinuityStageProjection;
}) {
  return (
    <section
      className="staff-shell__completion-continuity-stage"
      data-testid="CompletionContinuityStage"
      data-stage-state={projection.stageState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">Completion status</span>
        <h3>{projection.headline}</h3>
        <p>{projection.summary}</p>
      </header>
      <div className="staff-shell__continuity-grid">
        <div>
          <strong>Settlement</strong>
          <span data-task-completion-settlement-envelope-ref={projection.taskCompletionSettlementEnvelopeRef}>
            Pending
          </span>
        </div>
        <div>
          <strong>Continuity</strong>
          <span data-workspace-continuity-evidence-projection-ref={projection.workspaceContinuityEvidenceProjectionRef}>
            Ready
          </span>
        </div>
        <div>
          <strong>Next task</strong>
          <span data-latest-prefetch-window-ref={projection.latestPrefetchWindowRef}>Prepared</span>
        </div>
        <div>
          <strong>Launch</strong>
          <span data-latest-next-task-launch-lease-ref={projection.latestNextTaskLaunchLeaseRef}>
            Manual start
          </span>
        </div>
      </div>
    </section>
  );
}

export function NextTaskPostureCard({
  projection,
  noAutoAdvancePolicy,
  onLaunchNext,
}: {
  projection: NextTaskPostureCardProjection;
  noAutoAdvancePolicy: WorkspaceFocusContinuityProjection["noAutoAdvancePolicy"];
  onLaunchNext: () => void;
}) {
  return (
    <section
      className="staff-shell__next-task-posture"
      data-testid="NextTaskPostureCard"
      data-next-task-state={projection.nextTaskState}
      data-auto-advance={noAutoAdvancePolicy}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">Next task</span>
        <h3>{projection.headline}</h3>
        <p>{projection.summary}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span>Candidate</span>
        <strong>{projection.candidatePatientLabel ?? "No approved candidate"}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Queue status</span>
        <strong>Preserved</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Prefetch window</span>
        <strong data-prefetch-window-ref={projection.prefetchWindowRef}>Prepared</strong>
      </div>
      {!projection.launchEnabled && projection.blockingReasons.length > 0 && (
        <ul className="staff-shell__next-task-blockers">
          {projection.blockingReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className={classNames("staff-shell__dock-action", "staff-shell__dock-action--primary")}
        disabled={!projection.launchEnabled}
        onClick={onLaunchNext}
      >
        {projection.launchLabel}
      </button>
    </section>
  );
}

export function DepartureReturnStub({
  projection,
}: {
  projection: DepartureReturnStubProjection;
}) {
  return (
    <section className="staff-shell__departure-return-stub" data-testid="DepartureReturnStub">
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">Return support</span>
        <h3>{projection.title}</h3>
        <p>{projection.summary}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span>Queue scope</span>
        <strong>{projection.queueRef}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Preserved item</span>
        <strong data-preserved-anchor-ref={projection.preservedAnchorRef}>Current task</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Visible region</span>
        <strong>{projection.lastQuietRegionLabel}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Return target</span>
        <strong data-quiet-return-target-ref={projection.quietReturnTargetRef}>Task summary</strong>
      </div>
    </section>
  );
}
