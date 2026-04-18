import { useMemo, useState } from "react";
import type {
  ChangedWorkRouteProjection,
  ChangedWorkRowProjection,
  DeltaFirstResumeShellProjection,
  EvidenceDeltaSummaryProjection,
  InlineChangedRegionMarkersProjection,
  ResumeReviewGateProjection,
  StaffRouteKind,
  SupersededContextCompareProjection,
  TaskStackRowProjection,
  TaskWorkspaceProjection,
} from "./workspace-shell.data";

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

function ExcerptCard({
  eyebrow,
  title,
  rows,
}: {
  eyebrow: string;
  title: string;
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
            data-tone={stackToneLabel(row.tone)}
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

function ChangedWorkRow({
  row,
  onSelect,
  onOpen,
}: {
  row: ChangedWorkRowProjection;
  onSelect: (taskId: string, anchorRef: string) => void;
  onOpen: (taskId: string, anchorRef?: string) => void;
}) {
  return (
    <article
      className="staff-shell__changed-row"
      data-testid="ChangedWorkRow"
      data-task-id={row.taskId}
      data-selected={row.selected ? "true" : "false"}
      data-delta-class={row.deltaClass}
      data-resume-state={row.resumeState}
      data-recommit-required={row.recommitRequired ? "true" : "false"}
    >
      <button
        type="button"
        className="staff-shell__changed-row-main"
        onClick={() => onSelect(row.taskId, row.anchorRef)}
      >
        <div className="staff-shell__changed-row-head">
          <strong>{row.patientLabel}</strong>
          <span>{row.changedSummary}</span>
        </div>
        <div className="staff-shell__changed-row-meta">
          <span>{row.urgencyLabel}</span>
          <span>{row.returnedEvidenceCount} returned-evidence cues</span>
          <span>{row.contradictionCount} contradictions</span>
        </div>
      </button>
      <div className="staff-shell__changed-row-signals">
        <span className="staff-shell__approval-badge" data-tone={row.deltaClass}>
          {row.deltaClass}
        </span>
        <span className="staff-shell__approval-badge" data-tone={row.resumeState}>
          {row.resumeState.replaceAll("_", " ")}
        </span>
        <span className="staff-shell__approval-note">{row.resumeLabel}</span>
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

export function EvidenceDeltaSummary({
  projection,
}: {
  projection: EvidenceDeltaSummaryProjection;
}) {
  return (
    <section
      className="staff-shell__delta-summary"
      data-testid="EvidenceDeltaSummary"
      data-delta-class={projection.deltaClass}
      data-resume-state={projection.reviewState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">EvidenceDeltaPacket</span>
        <h3>{projection.summary}</h3>
        <p>{projection.explanation}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span>Authoritative delta packet</span>
        <strong>{projection.authoritativeDeltaPacketRef}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Primary changed anchor</span>
        <strong>{projection.primaryChangedAnchorRef}</strong>
      </div>
      <div className="staff-shell__delta-summary-grid">
        <article>
          <strong>Changed fields</strong>
          <ul>
            {projection.changedFieldRefs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <strong>Contradictions</strong>
          <ul>
            {(projection.contradictionRefs.length ? projection.contradictionRefs : ["None currently promoted."]).map(
              (item) => (
                <li key={item}>{item}</li>
              ),
            )}
          </ul>
        </article>
        <article>
          <strong>Invalidated actions</strong>
          <ul>
            {projection.actionInvalidationRefs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

export function InlineChangedRegionMarkers({
  projection,
  selectedAnchorRef,
  onSelectAnchor,
}: {
  projection: InlineChangedRegionMarkersProjection;
  selectedAnchorRef: string;
  onSelectAnchor: (anchorRef: string) => void;
}) {
  return (
    <section className="staff-shell__changed-markers" data-testid="InlineChangedRegionMarkers">
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">InlineChangedRegionMarkers</span>
        <h3>{projection.headline}</h3>
      </header>
      <div className="staff-shell__changed-marker-list">
        {projection.markers.map((marker) => (
          <button
            key={marker.markerId}
            type="button"
            className="staff-shell__changed-marker"
            data-kind={marker.kind}
            data-tone={marker.tone}
            data-selected={selectedAnchorRef === marker.anchorRef ? "true" : "false"}
            onClick={() => onSelectAnchor(marker.anchorRef)}
          >
            <span>{marker.label}</span>
            <strong>{marker.summary}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

export function SupersededContextCompare({
  projection,
}: {
  projection: SupersededContextCompareProjection;
}) {
  const [expanded, setExpanded] = useState(projection.defaultExpanded);

  return (
    <section
      className="staff-shell__superseded-compare"
      data-testid="SupersededContextCompare"
      data-expanded={expanded ? "true" : "false"}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">SupersededContextCompare</span>
        <h3>{projection.headline}</h3>
        <p>{projection.summary}</p>
      </header>
      <button
        type="button"
        className="staff-shell__utility-button"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Collapse superseded context" : "Expand superseded context"}
      </button>
      {expanded && (
        <div className="staff-shell__superseded-compare-list">
          {projection.items.map((item) => (
            <article key={item.itemId} className="staff-shell__superseded-compare-row">
              <div>
                <strong>{item.label}</strong>
                <p>{item.previousContext}</p>
              </div>
              <div>
                <strong>What changed now</strong>
                <p>{item.currentMeaning}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function ResumeReviewGate({
  projection,
}: {
  projection: ResumeReviewGateProjection;
}) {
  return (
    <section
      className="staff-shell__resume-gate"
      data-testid="ResumeReviewGate"
      data-resume-state={projection.reviewState}
      data-recommit-required={projection.recommitRequired ? "true" : "false"}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">ResumeReviewGate</span>
        <h3>{projection.headline}</h3>
        <p>{projection.summary}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span>Patient-return impact</span>
        <strong>{projection.patientReturnImpact}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Governing refs</span>
        <strong>{projection.governingRefs.join(" · ")}</strong>
      </div>
      <button
        type="button"
        className="staff-shell__inline-action"
        disabled={!projection.actionEnabled}
      >
        {projection.dominantActionLabel}
      </button>
    </section>
  );
}

export function DeltaFirstResumeShell({
  projection,
  onSelectAnchor,
}: {
  projection: DeltaFirstResumeShellProjection;
  onSelectAnchor: (anchorRef: string) => void;
}) {
  return (
    <section
      className="staff-shell__delta-reentry-shell"
      data-testid="DeltaFirstResumeShell"
      data-delta-class={projection.deltaClass}
      data-resume-state={projection.reviewState}
      data-recommit-required={projection.recommitRequired ? "true" : "false"}
      data-superseded-context={projection.supersededContextState}
      data-selected-anchor-ref={projection.selectedAnchorRef}
    >
      <EvidenceDeltaSummary projection={projection.evidenceDeltaSummary} />
      <InlineChangedRegionMarkers
        projection={projection.inlineChangedRegionMarkers}
        selectedAnchorRef={projection.selectedAnchorRef}
        onSelectAnchor={onSelectAnchor}
      />
      <SupersededContextCompare projection={projection.supersededContextCompare} />
      <ResumeReviewGate projection={projection.resumeReviewGate} />
    </section>
  );
}

function ChangedRouteContextRail({
  projection,
}: {
  projection: TaskWorkspaceProjection;
}) {
  return (
    <aside className="staff-shell__control-room-side-column staff-shell__changed-context-rail">
      <ExcerptCard
        eyebrow="Review frame"
        title={projection.taskCanvasFrame.summaryStack.headline}
        rows={projection.taskCanvasFrame.summaryStack.rows.slice(0, 2)}
      />
      <ExcerptCard
        eyebrow="Evidence excerpt"
        title={projection.taskCanvasFrame.evidenceStack.headline}
        rows={projection.taskCanvasFrame.evidenceStack.rows.slice(0, 3)}
      />
      <ExcerptCard
        eyebrow="Consequence excerpt"
        title={projection.taskCanvasFrame.consequenceStack.headline}
        rows={projection.taskCanvasFrame.consequenceStack.rows}
      />
    </aside>
  );
}

export function ChangedWorkRoute({
  projection,
  routeKind,
  onSelectTask,
  onOpenTask,
  onSelectAnchor,
}: {
  projection: ChangedWorkRouteProjection;
  routeKind: StaffRouteKind;
  onSelectTask: (taskId: string, anchorRef: string) => void;
  onOpenTask: (taskId: string, anchorRef?: string) => void;
  onSelectAnchor: (anchorRef: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "recommit" | "contextual" | "urgent">("all");
  const visibleRows = useMemo(() => {
    if (filter === "recommit") {
      return projection.rows.filter((row) => row.recommitRequired);
    }
    if (filter === "contextual") {
      return projection.rows.filter((row) => row.deltaClass === "contextual" || row.deltaClass === "clerical");
    }
    if (filter === "urgent") {
      return projection.rows.filter((row) => row.urgencyLabel !== "Routine review impact");
    }
    return projection.rows;
  }, [filter, projection.rows]);

  return (
    <section
      className="staff-shell__control-room staff-shell__changed-route"
      data-testid="ChangedWorkRoute"
      data-route-kind={routeKind}
      data-design-mode={projection.visualMode}
      data-delta-class={projection.deltaFirstResumeShell.deltaClass}
      data-resume-state={projection.deltaFirstResumeShell.reviewState}
      data-recommit-required={projection.deltaFirstResumeShell.recommitRequired ? "true" : "false"}
      data-superseded-context={projection.deltaFirstResumeShell.supersededContextState}
    >
      <header className="staff-shell__control-room-topline">
        <div>
          <span className="staff-shell__eyebrow">Delta_Reentry_Compass</span>
          <h2>Changed since seen</h2>
          <p>{projection.queueHealthSummary}</p>
        </div>
        <div className="staff-shell__control-room-summary">
          <span>{projection.rowCount} changed items</span>
          <span>{projection.deltaFirstResumeShell.evidenceDeltaSummary.authoritativeDeltaPacketRef}</span>
          <span>{projection.deltaFirstResumeShell.resumeReviewGate.reviewState.replaceAll("_", " ")}</span>
        </div>
      </header>

      <section className="staff-shell__control-room-toolbar">
        <div className="staff-shell__chip-row">
          {[
            ["all", "All changed work"],
            ["recommit", "Recommit required"],
            ["contextual", "Contextual or clerical"],
            ["urgent", "Urgent impact"],
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
      </section>

      {visibleRows.length === 0 ? (
        <section className="staff-shell__control-room-empty">
          <strong>{projection.emptyStateTitle}</strong>
          <p>{projection.emptyStateSummary}</p>
        </section>
      ) : (
        <div className="staff-shell__control-room-grid staff-shell__control-room-grid--changed">
          <section className="staff-shell__control-room-lane">
            {visibleRows.map((row) => (
              <ChangedWorkRow
                key={row.rowId}
                row={row}
                onSelect={onSelectTask}
                onOpen={onOpenTask}
              />
            ))}
          </section>
          <div className="staff-shell__changed-review-plane">
            <DeltaFirstResumeShell
              projection={projection.deltaFirstResumeShell}
              onSelectAnchor={onSelectAnchor}
            />
            <ChangedRouteContextRail projection={projection.sourceTaskProjection} />
          </div>
        </div>
      )}
    </section>
  );
}
