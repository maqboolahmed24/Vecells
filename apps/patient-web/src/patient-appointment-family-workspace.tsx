import {
  startTransition,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import "./patient-appointment-family-workspace.css";

import {
  AppointmentManageEntryResolver as resolveAppointmentManageEntry,
  NetworkLocalContinuityBinder,
  UnifiedAppointmentFamilyResolver,
  appointmentsWorkspaceHref337,
  clearNetworkLocalContinuityBinderReceipt,
  type AppointmentFamilyEntrySource337,
  type AppointmentFamilyRow337,
  type AppointmentFamilyStatusProjection337,
  type HubLocalReturnAnchorReceiptProjection337,
  type PatientAppointmentFamilyWorkspaceProjection337,
} from "./patient-appointment-family-workspace.model";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function glyphForFamily(kind: AppointmentFamilyRow337["kind"]): ReactNode {
  switch (kind) {
    case "local_appointment":
      return "L";
    case "network_appointment":
      return "N";
    case "waitlist_continuation":
      return "W";
    case "callback_follow_on":
      return "C";
    default:
      return "A";
  }
}

function toneClass(tone: string): string {
  return `appointment-family__tone--${tone}`;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function replaceQuery(
  href: string,
  params: Record<string, string | null | undefined>,
): string {
  const url = new URL(href, "https://vecells.local");
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return `${url.pathname}${url.search}`;
}

function childRouteForWorkspace(
  row: AppointmentFamilyRow337,
  workspace: PatientAppointmentFamilyWorkspaceProjection337,
): string | null {
  const routeRef = row.manageEntry.routeRef;
  if (!routeRef) {
    return null;
  }
  const returnTarget =
    workspace.entrySource === "request_detail" && workspace.requestContextRef
      ? `/requests/${workspace.requestContextRef}`
      : "/appointments";
  return replaceQuery(routeRef, {
    entry: workspace.entrySource,
    request: workspace.requestContextRef,
    returnRoute: returnTarget,
  });
}

export function AppointmentFamilyStatusChip({
  status,
}: {
  status: AppointmentFamilyStatusProjection337;
}) {
  return (
    <span
      className={`appointment-family__status-chip ${toneClass(status.tone)}`}
      data-testid="AppointmentFamilyStatusChip"
      data-state={status.state}
      data-tone={status.tone}
    >
      <strong>{status.primaryLabel}</strong>
      <small>{status.secondaryLabel}</small>
    </span>
  );
}

export function PatientAppointmentFamilyRow({
  row,
  selected,
  onSelect,
  onOpen,
  compact = false,
}: {
  row: AppointmentFamilyRow337;
  selected: boolean;
  onSelect: (row: AppointmentFamilyRow337) => void;
  onOpen: (row: AppointmentFamilyRow337) => void;
  compact?: boolean;
}) {
  return (
    <article
      className={`appointment-family__row ${selected ? "appointment-family__row--selected" : ""} ${compact ? "appointment-family__row--compact" : ""}`}
      data-testid={`appointment-family-row-${row.familyRef}`}
      data-family-ref={row.familyRef}
      data-family-kind={row.kind}
      data-truth-source={row.truthSource}
      data-status-state={row.status.state}
      data-manage-resolution={row.manageEntry.resolutionKind}
    >
      <button
        type="button"
        className="appointment-family__row-select"
        onClick={() => onSelect(row)}
      >
        <span className={`appointment-family__glyph ${toneClass(row.status.tone)}`} aria-hidden>
          {glyphForFamily(row.kind)}
        </span>
        <span className="appointment-family__row-copy">
          <small>{row.eyebrow}</small>
          <strong>{row.title}</strong>
          <span>{row.summary}</span>
        </span>
      </button>
      <div className="appointment-family__row-meta">
        <AppointmentFamilyStatusChip status={row.status} />
        <button
          type="button"
          className="appointment-family__row-action"
          data-testid={`appointment-family-open-${row.familyRef}`}
          onClick={() => onOpen(row)}
        >
          {row.nextSafeActionLabel}
        </button>
      </div>
    </article>
  );
}

export function HubFallbackRibbon({
  fallback,
}: {
  fallback: AppointmentFamilyRow337["fallback"];
}) {
  if (!fallback) {
    return null;
  }
  return (
    <section
      className={`appointment-family__fallback-ribbon ${toneClass(fallback.tone)}`}
      data-testid="HubFallbackRibbon"
      data-tone={fallback.tone}
    >
      <strong>{fallback.headline}</strong>
      <p>{fallback.body}</p>
    </section>
  );
}

export function AppointmentFamilyTimelineBridge({
  row,
}: {
  row: AppointmentFamilyRow337;
}) {
  return (
    <section
      className="appointment-family__timeline"
      data-testid="AppointmentFamilyTimelineBridge"
      data-family-ref={row.familyRef}
      aria-labelledby="appointment-family-timeline-heading"
    >
      <div className="appointment-family__section-heading">
        <small>Timeline bridge</small>
        <h3 id="appointment-family-timeline-heading">Current reminder and continuity chain</h3>
      </div>
      <ol className="appointment-family__timeline-list">
        {row.timelineRows.map((timelineRow) => (
          <li
            key={timelineRow.timelineRowId}
            className={`appointment-family__timeline-row ${toneClass(timelineRow.tone)}`}
            data-family-timeline-row={timelineRow.timelineRowId}
          >
            <header>
              <strong>{timelineRow.label}</strong>
              <span>{timelineRow.stateLabel}</span>
            </header>
            <p>{timelineRow.detail}</p>
            <small>{timelineRow.timeLabel}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function HubLocalReturnAnchorReceipt({
  receipt,
}: {
  receipt: HubLocalReturnAnchorReceiptProjection337 | null;
}) {
  if (!receipt) {
    return null;
  }
  return (
    <section
      className="appointment-family__return-receipt"
      data-testid="HubLocalReturnAnchorReceipt"
    >
      <strong>{receipt.title}</strong>
      <p>{receipt.body}</p>
      <dl>
        {receipt.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AppointmentManageEntryResolver({
  row,
  workspace,
  onOpen,
}: {
  row: AppointmentFamilyRow337;
  workspace: PatientAppointmentFamilyWorkspaceProjection337;
  onOpen: (row: AppointmentFamilyRow337) => void;
}) {
  const resolution = resolveAppointmentManageEntry({
    kind: row.kind,
    familyRef: row.familyRef,
    title: row.title,
    variant: workspace.variant,
  });

  return (
    <section
      className="appointment-family__manage-card"
      data-testid="AppointmentManageEntryResolver"
      data-resolution-kind={resolution.resolutionKind}
      data-stale-cta-suppressed={String(resolution.staleCtaSuppressed)}
    >
      <div className="appointment-family__section-heading">
        <small>Manage entry</small>
        <h3>Current child route decision</h3>
      </div>
      <p>{resolution.actionSummary}</p>
      <dl className="appointment-family__summary-grid">
        <div>
          <dt>Route family</dt>
          <dd>{humanize(resolution.routeFamilyRef)}</dd>
        </div>
        <div>
          <dt>Return anchor</dt>
          <dd>{resolution.returnAnchorLabel}</dd>
        </div>
        <div>
          <dt>CTA posture</dt>
          <dd>{resolution.staleCtaSuppressed ? "stale CTA suppressed" : "current CTA"}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="appointment-family__primary-action"
        data-testid="appointment-family-manage-entry-action"
        onClick={() => onOpen(row)}
      >
        {resolution.actionLabel}
      </button>
    </section>
  );
}

function DetailPanel({
  workspace,
  onOpen,
}: {
  workspace: PatientAppointmentFamilyWorkspaceProjection337;
  onOpen: (row: AppointmentFamilyRow337) => void;
}) {
  const row = workspace.selectedRow;

  return (
    <div
      className="appointment-family__detail"
      data-testid="appointment-family-detail-panel"
      data-selected-family-ref={row.familyRef}
    >
      <section className="appointment-family__hero" data-testid="appointment-family-hero">
        <div className="appointment-family__section-heading">
          <small>{row.eyebrow}</small>
          <h2>{row.title}</h2>
        </div>
        <p>{row.summary}</p>
        <AppointmentFamilyStatusChip status={row.status} />
        <dl className="appointment-family__summary-grid">
          {row.appointmentRows.slice(0, 4).map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <HubFallbackRibbon fallback={row.fallback} />
      <AppointmentManageEntryResolver row={row} workspace={workspace} onOpen={onOpen} />
      <section className="appointment-family__summary-card">
        <div className="appointment-family__section-heading">
          <small>Authority and nuance</small>
          <h3>What this family member is allowed to say</h3>
        </div>
        <dl className="appointment-family__summary-grid">
          {row.disclosureRows.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <AppointmentFamilyTimelineBridge row={row} />
    </div>
  );
}

export function PatientAppointmentFamilyWorkspace({
  initialWorkspace,
}: {
  initialWorkspace?: PatientAppointmentFamilyWorkspaceProjection337;
}) {
  const [workspace, setWorkspace] = useState<PatientAppointmentFamilyWorkspaceProjection337>(
    () => initialWorkspace ?? UnifiedAppointmentFamilyResolver(),
  );

  useEffect(() => {
    const onPopState = () => {
      startTransition(() => {
        setWorkspace(UnifiedAppointmentFamilyResolver());
      });
    };
    safeWindow()?.addEventListener("popstate", onPopState);
    return () => safeWindow()?.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (workspace.returnReceipt) {
      clearNetworkLocalContinuityBinderReceipt();
    }
  }, [workspace.returnReceipt]);

  function setSelectedRow(row: AppointmentFamilyRow337): void {
    const ownerWindow = safeWindow();
    const nextHref = appointmentsWorkspaceHref337({
      familyRef: row.familyRef,
      entrySource: workspace.entrySource,
      requestContextRef: workspace.requestContextRef,
      variant: workspace.variant,
    });
    ownerWindow?.history.replaceState({}, "", nextHref);
    startTransition(() => {
      setWorkspace(
        UnifiedAppointmentFamilyResolver({
          search: new URL(nextHref, "https://vecells.local").search,
          entrySource: workspace.entrySource,
          requestContextRef: workspace.requestContextRef,
          variant: workspace.variant,
        }),
      );
    });
  }

  function openManageEntry(row: AppointmentFamilyRow337): void {
    const ownerWindow = safeWindow();
    const routeRef = childRouteForWorkspace(row, workspace);
    if (!ownerWindow || !routeRef) {
      return;
    }
    NetworkLocalContinuityBinder({
      selectedFamilyRef: row.familyRef,
      selectedAnchorRef: row.selectedAnchorRef,
      selectedAnchorLabel: row.title,
      entrySource: workspace.entrySource,
      requestContextRef: workspace.requestContextRef,
      childRouteRef: routeRef,
      returnTargetRef:
        workspace.entrySource === "request_detail" && workspace.requestContextRef
          ? `/requests/${workspace.requestContextRef}`
          : "/appointments",
      pendingReceipt: true,
      recordedAt: "2026-04-23T10:00:00.000Z",
    });
    ownerWindow.location.assign(routeRef);
  }

  return (
    <section
      className="appointment-family"
      data-testid="PatientAppointmentFamilyWorkspace"
      data-visual-mode={workspace.visualMode}
      data-selected-family-ref={workspace.selectedFamilyRef}
      data-entry-source={workspace.entrySource}
      data-request-context={workspace.requestContextRef ?? "none"}
      data-return-anchor={workspace.returnReceipt ? "restored" : "steady"}
    >
      <HubLocalReturnAnchorReceipt receipt={workspace.returnReceipt} />
      <header className="appointment-family__header">
        <div className="appointment-family__section-heading">
          <small>Appointments family</small>
          <h2>One appointment grammar across local and network work</h2>
        </div>
        <dl className="appointment-family__header-grid">
          {workspace.headerRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </header>
      <div className="appointment-family__layout">
        <aside className="appointment-family__rail" data-testid="appointment-family-work-rail">
          {workspace.rows.map((row) => (
            <PatientAppointmentFamilyRow
              key={row.familyRef}
              row={row}
              selected={row.familyRef === workspace.selectedFamilyRef}
              onSelect={setSelectedRow}
              onOpen={openManageEntry}
            />
          ))}
        </aside>
        <DetailPanel workspace={workspace} onOpen={openManageEntry} />
      </div>
    </section>
  );
}

function requestWorkspace(
  requestRef: string,
): PatientAppointmentFamilyWorkspaceProjection337 {
  return UnifiedAppointmentFamilyResolver({
    entrySource: "request_detail",
    requestContextRef: requestRef,
  });
}

export function PatientRequestDownstreamWorkRail({
  requestRef,
  onNavigate,
}: {
  requestRef: string;
  onNavigate?: (pathname: string) => void;
}) {
  const workspace = requestWorkspace(requestRef);
  const rows = workspace.rows.filter((row) => row.requestRef === requestRef);

  function openFamilyWorkspace(row: AppointmentFamilyRow337): void {
    const target = appointmentsWorkspaceHref337({
      familyRef: row.familyRef,
      entrySource: "request_detail",
      requestContextRef: requestRef,
      variant: workspace.variant,
    });
    if (onNavigate) {
      onNavigate(target);
      return;
    }
    safeWindow()?.location.assign(target);
  }

  return (
    <section
      className="appointment-family__downstream-rail"
      data-testid="PatientRequestDownstreamWorkRail"
      data-request-ref={requestRef}
      data-family-count={String(rows.length)}
    >
      <div className="appointment-family__section-heading">
        <small>Related appointment work</small>
        <h3>Booking, network follow-on, waitlist, and callback use one family grammar</h3>
      </div>
      <div className="appointment-family__downstream-list">
        {rows.map((row) => (
          <PatientAppointmentFamilyRow
            key={row.familyRef}
            row={row}
            selected={row.familyRef === workspace.selectedFamilyRef}
            onSelect={() => openFamilyWorkspace(row)}
            onOpen={() => openFamilyWorkspace(row)}
            compact
          />
        ))}
      </div>
    </section>
  );
}
