import { useMemo, useState } from "react";
import type {
  ApprovalAuthoritySummaryProjection,
  ApprovalInboxRouteProjection,
  ApprovalInboxRowProjection,
  ApprovalReviewStageProjection,
  EscalationOutcomeClass,
  EscalationOutcomeRecorderProjection,
  EscalationRouteProjection,
  EscalationInboxRowProjection,
  EscalationCommandSurfaceProjection,
  TaskStackRowProjection,
  TaskWorkspaceProjection,
  UrgentContactTimelineProjection,
} from "./workspace-shell.data";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function StackExcerpt({
  title,
  eyebrow,
  rows,
}: {
  title: string;
  eyebrow: string;
  rows: readonly TaskStackRowProjection[];
}) {
  return (
    <section className="staff-shell__control-room-card">
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
      </header>
      <div className="staff-shell__reasoning-list">
        {rows.map((row) => (
          <article
            key={row.id}
            className="staff-shell__reasoning-list-row"
            data-tone={row.tone ?? "neutral"}
          >
            <div>
              <strong>{row.label}</strong>
              <span>{row.value}</span>
            </div>
            <p>{row.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SourceReviewExcerpt({ projection }: { projection: TaskWorkspaceProjection }) {
  return (
    <div className="staff-shell__control-room-evidence-grid">
      <StackExcerpt
        eyebrow="Current review frame"
        title={projection.taskCanvasFrame.summaryStack.headline}
        rows={projection.taskCanvasFrame.summaryStack.rows.slice(0, 2)}
      />
      <StackExcerpt
        eyebrow="Delta-first context"
        title={projection.taskCanvasFrame.deltaStack.headline}
        rows={projection.taskCanvasFrame.deltaStack.rows}
      />
      <StackExcerpt
        eyebrow="Evidence excerpt"
        title={projection.taskCanvasFrame.evidenceStack.headline}
        rows={projection.taskCanvasFrame.evidenceStack.rows.slice(0, 3)}
      />
      <StackExcerpt
        eyebrow="Consequence preview"
        title={projection.taskCanvasFrame.consequenceStack.headline}
        rows={projection.taskCanvasFrame.consequenceStack.rows}
      />
    </div>
  );
}

function ApprovalInboxRow({
  row,
  onSelect,
  onOpen,
}: {
  row: ApprovalInboxRowProjection;
  onSelect: (taskId: string, anchorRef: string) => void;
  onOpen: (taskId: string, anchorRef: string) => void;
}) {
  return (
    <article
      className="staff-shell__approval-row"
      data-testid="ApprovalInboxRow"
      data-task-id={row.taskId}
      data-anchor-ref={row.anchorRef}
      data-selected={row.selected ? "true" : "false"}
      data-approval-state={row.approvalState}
      data-commit-state={row.commitState}
    >
      <button
        type="button"
        className="staff-shell__approval-row-main"
        onClick={() => onSelect(row.taskId, row.anchorRef)}
      >
        <div className="staff-shell__approval-row-head">
          <strong>{row.patientLabel}</strong>
          <span>{row.consequenceLabel}</span>
        </div>
        <div className="staff-shell__approval-row-meta">
          <span>{row.approverRole}</span>
          <span>{row.timestampLabel}</span>
        </div>
        <p>{row.summary}</p>
      </button>
      <div className="staff-shell__approval-row-signals">
        <span className="staff-shell__approval-badge" data-tone={row.approvalState}>
          {row.approvalState.replaceAll("_", " ")}
        </span>
        <span className="staff-shell__approval-badge" data-tone={row.commitState}>
          {row.commitState.replaceAll("_", " ")}
        </span>
        <span className="staff-shell__approval-note">{row.changedSinceLastReview}</span>
        <span className="staff-shell__approval-note">{row.irreversibleEffectLabel}</span>
        {row.supersessionLabel && <span className="staff-shell__approval-note">{row.supersessionLabel}</span>}
        <button
          type="button"
          className="staff-shell__utility-button"
          onClick={() => onOpen(row.taskId, row.anchorRef)}
        >
          Open task shell
        </button>
      </div>
    </article>
  );
}

export function ApprovalReviewStage({
  stage,
  onOpenTask,
}: {
  stage: ApprovalReviewStageProjection;
  onOpenTask: (taskId: string, anchorRef?: string) => void;
}) {
  return (
    <section
      className="staff-shell__control-room-review"
      data-testid="ApprovalReviewStage"
      data-approval-state={stage.approvalState}
      data-decision-epoch={stage.decisionEpochRef}
    >
      <header className="staff-shell__control-room-head">
        <div>
          <span className="staff-shell__eyebrow">ApprovalReviewStage</span>
          <h2>{stage.summary}</h2>
          <p>{stage.rationale}</p>
        </div>
        <div className="staff-shell__control-room-meta">
          <span>{stage.approvalCheckpointRef}</span>
          <span>{stage.decisionEpochRef}</span>
          <span>{stage.approvalRole}</span>
        </div>
      </header>

      <section className="staff-shell__approval-lifecycle" aria-label="Decision commit envelope">
        {stage.lifecycle.map((step) => (
          <article
            key={step.stepId}
            className="staff-shell__approval-lifecycle-step"
            data-current={step.current ? "true" : "false"}
            data-reached={step.reached ? "true" : "false"}
          >
            <span className="staff-shell__approval-dot" />
            <strong>{step.label}</strong>
          </article>
        ))}
      </section>

      {stage.freezeReason && (
        <section className="staff-shell__control-room-freeze">
          <strong>Commit fencing</strong>
          <p>{stage.freezeReason}</p>
          {stage.replacementAuthorityRef && <span>{stage.replacementAuthorityRef}</span>}
        </section>
      )}

      <section className="staff-shell__control-room-card">
        <header className="staff-shell__task-stack-header">
          <span className="staff-shell__eyebrow">Irreversible effects</span>
          <h3>What cannot be released without approval</h3>
        </header>
        <ul className="staff-shell__approval-effects">
          {stage.irreversibleEffects.map((effect) => (
            <li key={effect}>{effect}</li>
          ))}
        </ul>
      </section>

      <SourceReviewExcerpt projection={stage.sourceTaskProjection} />

      <div className="staff-shell__control-room-actions">
        <button
          type="button"
          className="staff-shell__inline-action"
          disabled={!stage.actionEnabled}
        >
          {stage.actionLabel}
        </button>
        <button
          type="button"
          className="staff-shell__utility-button"
          onClick={() => onOpenTask(stage.sourceTaskProjection.taskId, `approval-preview-${stage.sourceTaskProjection.taskId}`)}
        >
          Open full task shell
        </button>
      </div>
    </section>
  );
}

export function ApprovalAuthoritySummary({
  summary,
}: {
  summary: ApprovalAuthoritySummaryProjection;
}) {
  return (
    <aside
      className="staff-shell__control-room-side"
      data-testid="ApprovalAuthoritySummary"
      data-approval-role={summary.approvalRole}
      data-approval-state={summary.approvalState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">ApprovalAuthoritySummary</span>
        <h3>{summary.approvalRole}</h3>
        <p>{summary.auditTrailLabel}</p>
      </header>
      <dl className="staff-shell__control-room-facts">
        <div>
          <dt>Checkpoint</dt>
          <dd>{summary.approvalCheckpointRef}</dd>
        </div>
        <div>
          <dt>Decision epoch</dt>
          <dd>{summary.decisionEpochRef}</dd>
        </div>
        <div>
          <dt>Commit posture</dt>
          <dd>{summary.commitState.replaceAll("_", " ")}</dd>
        </div>
      </dl>
      <div className="staff-shell__control-room-side-list">
        {summary.irreversibleEffects.map((effect) => (
          <article key={effect}>
            <strong>Irreversible effect</strong>
            <p>{effect}</p>
          </article>
        ))}
      </div>
      {summary.replacementAuthorityRef && (
        <section className="staff-shell__control-room-freeze">
          <strong>Replacement authority</strong>
          <p>{summary.replacementAuthorityRef}</p>
        </section>
      )}
    </aside>
  );
}

export function ApprovalInboxRoute({
  projection,
  onSelectTask,
  onOpenTask,
}: {
  projection: ApprovalInboxRouteProjection;
  onSelectTask: (taskId: string, anchorRef: string) => void;
  onOpenTask: (taskId: string, anchorRef?: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "pending" | "superseded" | "frozen">("all");
  const [sortMode, setSortMode] = useState<"queue" | "state" | "latest">("queue");

  const visibleRows = useMemo(() => {
    const filtered = projection.rows.filter((row) => {
      if (filter === "pending") {
        return row.approvalState === "pending" || row.approvalState === "required";
      }
      if (filter === "superseded") {
        return row.approvalState === "superseded";
      }
      if (filter === "frozen") {
        return row.commitState === "recovery_required";
      }
      return true;
    });

    if (sortMode === "state") {
      return [...filtered].sort((left, right) => left.approvalState.localeCompare(right.approvalState));
    }
    if (sortMode === "latest") {
      return [...filtered].sort((left, right) => right.timestampLabel.localeCompare(left.timestampLabel));
    }
    return filtered;
  }, [filter, projection.rows, sortMode]);

  return (
    <section
      className="staff-shell__control-room"
      data-testid="ApprovalInboxRoute"
      data-approval-state={projection.reviewStage.approvalState}
      data-design-mode={projection.visualMode}
    >
      <header className="staff-shell__control-room-topline">
        <div>
          <span className="staff-shell__eyebrow">Quiet_Escalation_Control_Room</span>
          <h2>Approval inbox</h2>
          <p>{projection.queueHealthSummary}</p>
        </div>
        <div className="staff-shell__control-room-summary">
          <span>{projection.rowCount} visible approvals</span>
          <span>{projection.authoritySummary.approvalRole}</span>
          <span>{projection.authoritySummary.commitState.replaceAll("_", " ")}</span>
        </div>
      </header>

      <div className="staff-shell__control-room-toolbar">
        <div className="staff-shell__chip-row" aria-label="Approval filters">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["superseded", "Superseded"],
            ["frozen", "Recovery"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="staff-shell__chip"
              data-active={filter === value ? "true" : "false"}
              onClick={() => setFilter(value as typeof filter)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="staff-shell__control-room-select">
          <span className="sr-only">Approval sorting</span>
          <select value={sortMode} aria-label="Approval sorting" onChange={(event) => setSortMode(event.currentTarget.value as typeof sortMode)}>
            <option value="queue">Sort by queue order</option>
            <option value="state">Sort by approval state</option>
            <option value="latest">Sort by latest touch</option>
          </select>
        </label>
      </div>

      <div className="staff-shell__control-room-grid">
        <div className="staff-shell__control-room-lane" data-testid="ApprovalInboxLane">
          {visibleRows.length === 0 ? (
            <section className="staff-shell__control-room-empty">
              <strong>{projection.emptyStateTitle}</strong>
              <p>{projection.emptyStateSummary}</p>
            </section>
          ) : (
            visibleRows.map((row) => (
              <ApprovalInboxRow key={row.rowId} row={row} onSelect={onSelectTask} onOpen={onOpenTask} />
            ))
          )}
        </div>
        <ApprovalReviewStage stage={projection.reviewStage} onOpenTask={onOpenTask} />
        <ApprovalAuthoritySummary summary={projection.authoritySummary} />
      </div>
    </section>
  );
}

function EscalationInboxRow({
  row,
  onSelect,
  onOpen,
}: {
  row: EscalationInboxRowProjection;
  onSelect: (taskId: string, anchorRef: string) => void;
  onOpen: (taskId: string, anchorRef: string) => void;
}) {
  return (
    <article
      className="staff-shell__escalation-row"
      data-testid="EscalationInboxRow"
      data-task-id={row.taskId}
      data-anchor-ref={row.anchorRef}
      data-selected={row.selected ? "true" : "false"}
      data-escalation-state={row.escalationState}
      data-severity-band={row.severityBand}
    >
      <button
        type="button"
        className="staff-shell__escalation-row-main"
        onClick={() => onSelect(row.taskId, row.anchorRef)}
      >
        <div className="staff-shell__escalation-row-head">
          <strong>{row.patientLabel}</strong>
          <span>{row.currentStatusLabel}</span>
        </div>
        <p>{row.urgencyReason}</p>
        <div className="staff-shell__escalation-row-meta">
          <span>{row.lastMeaningfulTouch}</span>
          <span>{row.nextGovernedAction}</span>
        </div>
      </button>
      <div className="staff-shell__escalation-row-actions">
        <span className="staff-shell__approval-badge" data-tone={row.severityBand}>
          {row.severityBand}
        </span>
        <span className="staff-shell__approval-badge" data-tone={row.escalationState}>
          {row.escalationState.replaceAll("_", " ")}
        </span>
        <button type="button" className="staff-shell__utility-button" onClick={() => onOpen(row.taskId, row.anchorRef)}>
          Open task shell
        </button>
      </div>
    </article>
  );
}

export function EscalationCommandSurface({
  surface,
  onOpenTask,
}: {
  surface: EscalationCommandSurfaceProjection;
  onOpenTask: (taskId: string, anchorRef?: string) => void;
}) {
  return (
    <section
      className={classNames(
        "staff-shell__control-room-review",
        "staff-shell__control-room-review--urgent",
        surface.urgentStage !== "active" && "staff-shell__control-room-review--quiet",
      )}
      data-testid="EscalationCommandSurface"
      data-urgent-stage={surface.urgentStage}
      data-escalation-state={surface.escalationState}
      data-decision-epoch={surface.decisionEpochRef}
    >
      <header className="staff-shell__control-room-head">
        <div>
          <span className="staff-shell__eyebrow">EscalationCommandSurface</span>
          <h2>{surface.urgencyReason}</h2>
          <p>{surface.summary}</p>
        </div>
        <div className="staff-shell__control-room-meta">
          <span>{surface.dutyEscalationRef}</span>
          <span>{surface.escalationOwnerLabel}</span>
          <span>{surface.severityBand}</span>
        </div>
      </header>

      <dl className="staff-shell__control-room-facts">
        <div>
          <dt>Urgent stage</dt>
          <dd>{surface.urgentStage.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Current state</dt>
          <dd>{surface.escalationState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Next governed action</dt>
          <dd>{surface.actionLabel}</dd>
        </div>
      </dl>

      {surface.freezeReason && (
        <section className="staff-shell__control-room-freeze staff-shell__control-room-freeze--critical">
          <strong>Urgent fencing</strong>
          <p>{surface.freezeReason}</p>
        </section>
      )}

      <section className="staff-shell__control-room-card">
        <header className="staff-shell__task-stack-header">
          <span className="staff-shell__eyebrow">Lineage-visible reopen law</span>
          <h3>{surface.lineageSummary}</h3>
        </header>
        <p>
          The urgent path stays impossible to miss, but the source evidence and consequence preview remain visible so
          the operator can see why the escalation exists.
        </p>
      </section>

      <SourceReviewExcerpt projection={surface.sourceTaskProjection} />

      <div className="staff-shell__control-room-actions">
        <button type="button" className="staff-shell__inline-action" disabled={!surface.actionEnabled}>
          {surface.actionLabel}
        </button>
        <button
          type="button"
          className="staff-shell__utility-button"
          onClick={() => onOpenTask(surface.sourceTaskProjection.taskId, `escalation-preview-${surface.sourceTaskProjection.taskId}`)}
        >
          Open full task shell
        </button>
      </div>
    </section>
  );
}

export function UrgentContactTimeline({ timeline }: { timeline: UrgentContactTimelineProjection }) {
  return (
    <section
      className="staff-shell__control-room-side"
      data-testid="UrgentContactTimeline"
      data-escalation-state={timeline.escalationState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">UrgentContactTimeline</span>
        <h3>{timeline.currentStatusLabel}</h3>
        <p>{timeline.nextGovernedAction}</p>
      </header>
      <dl className="staff-shell__control-room-facts">
        <div>
          <dt>Elapsed</dt>
          <dd>{timeline.elapsedLabel}</dd>
        </div>
        <div>
          <dt>Current settlement</dt>
          <dd>{timeline.escalationState.replaceAll("_", " ")}</dd>
        </div>
      </dl>
      <ol className="staff-shell__timeline-list">
        {timeline.entries.map((entry) => (
          <li key={entry.entryId} className="staff-shell__timeline-entry" data-tone={entry.eventTone}>
            <span className="staff-shell__timeline-dot" />
            <div>
              <strong>{entry.headline}</strong>
              <span>
                {entry.occurredAtLabel} · {entry.actorLabel}
              </span>
              <p>{entry.summary}</p>
              <small>{entry.outcomeLabel}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function EscalationOutcomeRecorder({
  recorder,
}: {
  recorder: EscalationOutcomeRecorderProjection;
}) {
  const [selectedOutcome, setSelectedOutcome] = useState<EscalationOutcomeClass>("return_to_triage");
  const activeOption = recorder.options.find((option) => option.outcomeClass === selectedOutcome) ?? recorder.options[0];

  return (
    <section
      className="staff-shell__control-room-side"
      data-testid="EscalationOutcomeRecorder"
      data-escalation-state={recorder.escalationState}
      data-selected-outcome={selectedOutcome}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">EscalationOutcomeRecorder</span>
        <h3>{activeOption?.label ?? "Outcome capture"}</h3>
        <p>{recorder.lastOutcomeSummary}</p>
      </header>
      <div className="staff-shell__chip-row">
        {recorder.options.map((option) => (
          <button
            key={option.optionId}
            type="button"
            className="staff-shell__chip"
            data-active={selectedOutcome === option.outcomeClass ? "true" : "false"}
            onClick={() => setSelectedOutcome(option.outcomeClass)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {activeOption && (
        <section className="staff-shell__control-room-card">
          <header className="staff-shell__task-stack-header">
            <span className="staff-shell__eyebrow">Outcome summary</span>
            <h3>{activeOption.label}</h3>
          </header>
          <p>{activeOption.summary}</p>
        </section>
      )}
      <section className="staff-shell__control-room-side-list">
        {recorder.provenanceStrips.map((strip) => (
          <article key={strip}>
            <strong>Provenance</strong>
            <p>{strip}</p>
          </article>
        ))}
      </section>
    </section>
  );
}

export function EscalationWorkspaceRoute({
  projection,
  onSelectTask,
  onOpenTask,
}: {
  projection: EscalationRouteProjection;
  onSelectTask: (taskId: string, anchorRef: string) => void;
  onOpenTask: (taskId: string, anchorRef?: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "active" | "relief" | "blocked">("all");
  const [sortMode, setSortMode] = useState<"severity" | "elapsed" | "latest">("severity");

  const visibleRows = useMemo(() => {
    const filtered = projection.rows.filter((row) => {
      if (filter === "active") {
        return row.escalationState === "active" || row.escalationState === "contact_in_progress";
      }
      if (filter === "relief") {
        return row.escalationState === "returned_to_triage" || row.escalationState === "direct_outcome_recorded";
      }
      if (filter === "blocked") {
        return row.escalationState === "handoff_pending";
      }
      return true;
    });

    if (sortMode === "elapsed") {
      return [...filtered].sort((left, right) => right.lastMeaningfulTouch.localeCompare(left.lastMeaningfulTouch));
    }
    if (sortMode === "latest") {
      return [...filtered].sort((left, right) => right.currentStatusLabel.localeCompare(left.currentStatusLabel));
    }
    return [...filtered].sort((left, right) => right.severityBand.localeCompare(left.severityBand));
  }, [filter, projection.rows, sortMode]);

  return (
    <section
      className="staff-shell__control-room"
      data-testid="EscalationWorkspaceRoute"
      data-design-mode={projection.visualMode}
      data-urgent-stage={projection.commandSurface.urgentStage}
      data-escalation-state={projection.commandSurface.escalationState}
    >
      <header className="staff-shell__control-room-topline">
        <div>
          <span className="staff-shell__eyebrow">Quiet_Escalation_Control_Room</span>
          <h2>Escalations</h2>
          <p>{projection.queueHealthSummary}</p>
        </div>
        <div className="staff-shell__control-room-summary">
          <span>{projection.rowCount} urgent rows</span>
          <span>{projection.commandSurface.escalationOwnerLabel}</span>
          <span>{projection.urgentTimeline.elapsedLabel}</span>
        </div>
      </header>

      <div className="staff-shell__control-room-toolbar">
        <div className="staff-shell__chip-row" aria-label="Escalation filters">
          {[
            ["all", "All"],
            ["active", "Active"],
            ["relief", "Reopened"],
            ["blocked", "Blocked"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="staff-shell__chip"
              data-active={filter === value ? "true" : "false"}
              onClick={() => setFilter(value as typeof filter)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="staff-shell__control-room-select">
          <span className="sr-only">Escalation sorting</span>
          <select value={sortMode} aria-label="Escalation sorting" onChange={(event) => setSortMode(event.currentTarget.value as typeof sortMode)}>
            <option value="severity">Sort by severity</option>
            <option value="elapsed">Sort by elapsed watch</option>
            <option value="latest">Sort by current state</option>
          </select>
        </label>
      </div>

      <div className="staff-shell__control-room-grid staff-shell__control-room-grid--urgent">
        <div className="staff-shell__control-room-lane" data-testid="EscalationInboxLane">
          {visibleRows.length === 0 ? (
            <section className="staff-shell__control-room-empty">
              <strong>{projection.emptyStateTitle}</strong>
              <p>{projection.emptyStateSummary}</p>
            </section>
          ) : (
            visibleRows.map((row) => (
              <EscalationInboxRow key={row.rowId} row={row} onSelect={onSelectTask} onOpen={onOpenTask} />
            ))
          )}
        </div>
        <EscalationCommandSurface surface={projection.commandSurface} onOpenTask={onOpenTask} />
        <div className="staff-shell__control-room-side-column">
          <UrgentContactTimeline timeline={projection.urgentTimeline} />
          <EscalationOutcomeRecorder recorder={projection.outcomeRecorder} />
        </div>
      </div>
    </section>
  );
}
