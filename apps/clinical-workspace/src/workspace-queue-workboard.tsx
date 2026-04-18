import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  buildStaffPath,
  buildQueueWorkbenchProjection,
  parseStaffPath,
  requireCase,
  requireQueue,
  staffQueues,
  type QueueAnchorStubProjection,
  type QueueChangeBatchProjection,
  type QueuePreviewDigestProjection,
  type QueueRowPresentationContract,
  type QueueToolbarFilterKey,
  type QueueWorkbenchProjection,
  type StaffQueueCase,
  type StaffShellLedger,
  type StaffShellRoute,
} from "./workspace-shell.data";
import { BufferedQueueChangeTray } from "./workspace-focus-continuity";
import type { WorkspaceFocusContinuityProjection } from "./workspace-focus-continuity.data";
import {
  buildQueueCallbackAdminMergeMap,
  type QueueCallbackAdminMergeDigestProjection,
  type QueueMergeLaunchAction,
} from "./workspace-queue-callback-admin-merge.data";
import {
  WORKSPACE_FOCUS_TARGET_IDS,
  buildWorkspaceSurfaceAttributes,
} from "./workspace-accessibility";

export function QueueToolbar({
  route,
  projection,
  filterKey,
  onFilterChange,
  searchQuery,
  onSearchQueryChange,
  onQueueChange,
}: {
  route: StaffShellRoute;
  projection: QueueWorkbenchProjection;
  filterKey: QueueToolbarFilterKey;
  onFilterChange: (nextFilter: QueueToolbarFilterKey) => void;
  searchQuery: string;
  onSearchQueryChange: (nextQuery: string) => void;
  onQueueChange: (queueKey: string) => void;
}) {
  const queue = requireQueue(projection.queueKey);
  return (
    <section
      className="staff-shell__queue-toolbar"
      data-testid="queue-toolbar"
      aria-labelledby="workspace-workboard-heading"
    >
      <header className="staff-shell__queue-toolbar-head">
        <div>
          <span className="staff-shell__eyebrow">QueueWorkbenchProjection</span>
          <strong id="workspace-workboard-heading">{queue.label}</strong>
          <p>{queue.description}</p>
        </div>
        <div className="staff-shell__queue-toolbar-meta">
          <span>{projection.rankSnapshotRef}</span>
          <span>{projection.queueHealthDigest.label}</span>
          <span>{projection.rowCount} visible rows</span>
        </div>
      </header>

      <div className="staff-shell__queue-toolbar-controls">
        <div className="staff-shell__queue-picker staff-shell__queue-picker--toolbar">
          {staffQueues.map((queueOption) => (
            <button
              key={queueOption.key}
              type="button"
              className="staff-shell__queue-link"
              data-active={projection.queueKey === queueOption.key ? "true" : "false"}
              onClick={() => onQueueChange(queueOption.key)}
            >
              {queueOption.label}
            </button>
          ))}
        </div>

        <label className="staff-shell__queue-search-field">
          <span className="sr-only">Search the current queue</span>
          <input
            aria-label="Search the current queue"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
            placeholder={route.kind === "search" ? "Search request, patient, or route" : "Filter this queue"}
          />
        </label>
      </div>

      <div className="staff-shell__queue-filter-row" aria-label="Queue filters">
        {projection.toolbarFilters.map((option) => (
          <button
            key={option.key}
            type="button"
            className="staff-shell__queue-filter-chip"
            data-active={filterKey === option.key ? "true" : "false"}
            onClick={() => onFilterChange(option.key)}
          >
            <span>{option.label}</span>
            <strong>{option.count}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

export function QueueChangeBatchBanner({
  batch,
  onApply,
  onDismiss,
}: {
  batch: QueueChangeBatchProjection;
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div data-testid="queue-change-batch-banner">
      <BufferedQueueChangeTray
        projection={{
          trayId: `queue_change_batch_banner::${batch.batchId}`,
          trayState: "expanded",
          batchState: batch.batchImpactClass === "review_required" ? "review_required" : "buffered",
          queueRef: batch.queueRef,
          sourceRankSnapshotRef: batch.sourceRankSnapshotRef,
          targetRankSnapshotRef: batch.targetRankSnapshotRef,
          preservedAnchorRef: batch.preservedAnchorRef,
          focusConflictState: "clear",
          impactClass: batch.batchImpactClass,
          title: batch.summaryMessage,
          summary: `Preserve ${batch.preservedAnchorRef} until the target snapshot ${batch.targetRankSnapshotRef} is explicitly applied.`,
          applyLabel: "Apply queued changes",
          applyEnabled: true,
          applyReason: "Compatibility wrapper for the original queue batch banner contract.",
          reviewLabel: "Review buffered queue changes",
          deferLabel: "Review later",
          totalCount:
            batch.updatedRefs.length +
            batch.insertedRefs.length +
            batch.invalidatedAnchorRefs.length +
            batch.replacementAnchorRefs.length,
          groups: [
            {
              groupId: "priority-shift-refs",
              label: "Priority shifts",
              count: batch.priorityShiftRefs.length,
              detail: "Rows whose rank changed between the source and target snapshots.",
              tone: "accent",
            },
          ],
        }}
        onApply={onApply}
        onToggleReview={onDismiss}
        onDefer={onDismiss}
      />
    </div>
  );
}

export function QueueAnchorStub({
  stub,
  onResolve,
}: {
  stub: QueueAnchorStubProjection;
  onResolve: (stub: QueueAnchorStubProjection) => void;
}) {
  return (
    <section className="staff-shell__queue-anchor-stub" data-testid="queue-anchor-stub" data-stub-state={stub.stubState}>
      <div>
        <span className="staff-shell__eyebrow">QueueAnchorStub</span>
        <strong>{stub.title}</strong>
        <p>{stub.summary}</p>
      </div>
      <button type="button" className="staff-shell__inline-action" onClick={() => onResolve(stub)}>
        {stub.actionLabel}
      </button>
    </section>
  );
}

export function QueueRow({
  row,
  task,
  mergeDigest,
  rowIndex,
  rowCount,
  selectedTaskId,
  runtimeScenario,
  onHover,
  onSelect,
  onOpen,
}: {
  row: QueueRowPresentationContract;
  task: StaffQueueCase;
  mergeDigest: QueueCallbackAdminMergeDigestProjection;
  rowIndex: number;
  rowCount: number;
  selectedTaskId: string;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  onHover: (taskId: string) => void;
  onSelect: (taskId: string) => void;
  onOpen: (taskId: string) => void;
}) {
  const rowId = `queue-option-${row.taskId}`;
  const labelId = `${rowId}-label`;
  const summaryId = `${rowId}-summary`;
  const secondaryId = `${rowId}-secondary`;
  const noteId = `${rowId}-note`;
  const selected = row.taskId === selectedTaskId;
  return (
    <article
      id={rowId}
      className="staff-shell__queue-row"
      data-active={row.rowState === "selected" || row.rowState === "task_open" ? "true" : "false"}
      data-previewing={row.rowState === "preview_peek" || row.rowState === "preview_pinned" ? "true" : "false"}
      data-row-state={row.rowState}
      data-movement-state={row.movementState}
      data-selection-state={selected ? "selected" : "unselected"}
      data-focus-state={row.taskId === selectedTaskId ? "focused" : "idle"}
      role="option"
      aria-selected={selected}
      aria-labelledby={`${labelId} ${summaryId}`}
      aria-describedby={`${secondaryId} ${noteId}`}
      aria-posinset={rowIndex + 1}
      aria-setsize={rowCount}
      onMouseEnter={() => onHover(row.taskId)}
      {...buildWorkspaceSurfaceAttributes({
        surface: "queue_workboard",
        surfaceState: row.rowState,
        focusModel: "listbox",
        selectedAnchorRef: row.anchorRef,
        runtimeScenario,
      })}
    >
      <span className="staff-shell__signal-rail" data-tone={row.signalTone} />
      <button
        type="button"
        className="staff-shell__queue-row-main"
        data-task-id={row.taskId}
        data-anchor-ref={row.anchorRef}
        tabIndex={-1}
        onClick={() => onSelect(row.taskId)}
        onFocus={() => onHover(row.taskId)}
      >
        <div className="staff-shell__queue-copy">
          <div className="staff-shell__queue-primary-line">
            <strong id={labelId}>{row.primaryLabel}</strong>
            <span id={summaryId}>{row.primarySummary}</span>
          </div>
          <span className="staff-shell__queue-secondary-line" id={secondaryId}>
            {row.secondaryLine}
          </span>
        </div>
      </button>
      <div className="staff-shell__queue-status-cluster">
        <span className="staff-shell__queue-status-chip" data-state={task.state}>
          {row.statusChipLabel}
        </span>
        <span className="staff-shell__queue-state-note" data-merge-family={mergeDigest.executionFamily}>
          {mergeDigest.executionFamily.replaceAll("_", " ")}
        </span>
        <span className="staff-shell__queue-state-note" data-merge-posture={mergeDigest.dominantPosture}>
          {mergeDigest.dominantPosture.replaceAll("_", " ")}
        </span>
        <span className="staff-shell__queue-rank-chip">
          {row.currentRank}
          {row.targetRank !== row.currentRank ? ` → ${row.targetRank}` : ""}
        </span>
        <span className="staff-shell__queue-state-note" id={noteId}>
          {row.rightClusterLabel}
        </span>
        <button
          type="button"
          className="staff-shell__queue-open-button"
          aria-label={row.openActionLabel}
          tabIndex={-1}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(row.taskId);
          }}
        >
          Open
        </button>
      </div>
    </article>
  );
}

export function QueuePreviewPocket({
  task,
  digest,
  mergeDigest,
  previewMode,
  runtimeScenario,
  onOpenAction,
  onPinToggle,
}: {
  task: StaffQueueCase | null;
  digest: QueuePreviewDigestProjection | null;
  mergeDigest: QueueCallbackAdminMergeDigestProjection | null;
  previewMode: QueueWorkbenchProjection["previewMode"];
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  onOpenAction: (taskId: string, action: QueueMergeLaunchAction) => void;
  onPinToggle: () => void;
}) {
  if (!task || !digest || !mergeDigest) {
    return (
      <section
        className="staff-shell__preview-pocket"
        data-testid="queue-preview-pocket"
        data-preview-mode="idle"
        id={WORKSPACE_FOCUS_TARGET_IDS.previewPocket}
        tabIndex={-1}
        role="complementary"
        aria-labelledby="workspace-preview-heading"
        {...buildWorkspaceSurfaceAttributes({
          surface: "queue_preview",
          surfaceState: "idle",
          focusModel: "tab_ring",
          selectedAnchorRef: "queue_preview_idle",
          runtimeScenario,
        })}
      >
        <span className="staff-shell__eyebrow">QueuePreviewDigest</span>
        <strong id="workspace-preview-heading">Summary-first scan pocket</strong>
        <p>Hover or focus to peek. Click a row to pin the preview. Open stays explicit and same-shell.</p>
      </section>
    );
  }

  return (
    <section
      className="staff-shell__preview-pocket"
      data-testid="queue-preview-pocket"
      data-preview-mode={previewMode}
      id={WORKSPACE_FOCUS_TARGET_IDS.previewPocket}
      tabIndex={-1}
      role="complementary"
      aria-labelledby="workspace-preview-heading"
      {...buildWorkspaceSurfaceAttributes({
        surface: "queue_preview",
        surfaceState: previewMode,
        focusModel: "tab_ring",
        selectedAnchorRef: digest.rankEntryRef,
        runtimeScenario,
      })}
    >
      <header>
        <span className="staff-shell__eyebrow">QueuePreviewDigest</span>
        <strong id="workspace-preview-heading">{task.patientLabel}</strong>
        <p>{mergeDigest.dominantSummary}</p>
      </header>
      <div className="staff-shell__preview-chip-row" aria-label="Merged queue badges">
        {mergeDigest.queueBadgeLabels.map((label) => (
          <span key={label} className="staff-shell__queue-filter-chip" data-active="false">
            {label}
          </span>
        ))}
      </div>
      <dl className="staff-shell__preview-pocket-grid">
        <div>
          <dt>Delta</dt>
          <dd>{digest.materialDeltaSummaryRef}</dd>
        </div>
        <div>
          <dt>Ownership</dt>
          <dd>{digest.ownershipDigestRef}</dd>
        </div>
        <div>
          <dt>Next action</dt>
          <dd>{mergeDigest.launchActions[0]?.label ?? digest.nextActionDigestRef}</dd>
        </div>
        <div>
          <dt>Patient expectation</dt>
          <dd>{mergeDigest.patientExpectationDigest ?? "No patient expectation digest"}</dd>
        </div>
      </dl>
      <div className="staff-shell__preview-pocket-actions">
        {mergeDigest.launchActions.slice(0, 3).map((action) => (
          <button
            key={action.actionId}
            type="button"
            className={action.dominant ? "staff-shell__inline-action" : "staff-shell__utility-button"}
            onClick={() => onOpenAction(task.id, action)}
          >
            {action.label}
          </button>
        ))}
        <button type="button" className="staff-shell__utility-button" onClick={onPinToggle}>
          {previewMode === "pinned_summary" ? "Unpin preview" : "Pin preview"}
        </button>
      </div>
    </section>
  );
}

export function QueueWorkboardFrame({
  projection,
  previewTask,
  mergeDigests,
  runtimeScenario,
  listRef,
  onRowHover,
  onRowSelect,
  onRowOpen,
  onListKeyDown,
  onPreviewPinToggle,
  onPreviewAction,
}: {
  projection: QueueWorkbenchProjection;
  previewTask: StaffQueueCase | null;
  mergeDigests: Readonly<Record<string, QueueCallbackAdminMergeDigestProjection>>;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  listRef: React.RefObject<HTMLDivElement | null>;
  onRowHover: (taskId: string) => void;
  onRowSelect: (taskId: string) => void;
  onRowOpen: (taskId: string) => void;
  onListKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onPreviewPinToggle: () => void;
  onPreviewAction: (taskId: string, action: QueueMergeLaunchAction) => void;
}) {
  const selectedTaskId =
    projection.rows.find((item) => item.anchorRef === projection.selectedAnchorId)?.taskId ??
    projection.rows[0]?.taskId ??
    "";
  const activeDescendantId = selectedTaskId ? `queue-option-${selectedTaskId}` : undefined;
  const selectedIndex = Math.max(
    0,
    projection.rows.findIndex((item) => item.taskId === selectedTaskId),
  );
  const virtualizationActive =
    projection.virtualizationState === "windowed" && projection.rows.length > 50;
  const windowSize = virtualizationActive ? 16 : projection.rows.length;
  const windowStart = virtualizationActive
    ? Math.max(0, Math.min(selectedIndex - 4, projection.rows.length - windowSize))
    : 0;
  const windowEnd = virtualizationActive
    ? Math.min(projection.rows.length, windowStart + windowSize)
    : projection.rows.length;
  const renderedRows = projection.rows.slice(windowStart, windowEnd);
  return (
    <section
      className="staff-shell__queue-frame"
      data-testid="QueueWorkboardFrame"
      data-virtualization-state={projection.virtualizationState}
      data-virtual-window={virtualizationActive ? `${windowStart}-${windowEnd - 1}` : `0-${projection.rows.length - 1}`}
      {...buildWorkspaceSurfaceAttributes({
        surface: "queue_workboard",
        surfaceState: projection.previewMode,
        focusModel: "listbox",
        selectedAnchorRef: projection.selectedAnchorId,
        runtimeScenario,
      })}
    >
      <p id="workspace-workboard-keyboard-model" className="sr-only">
        Arrow keys move between rows. Space pins the preview. Enter opens the selected task in
        the same shell. Focus and selection stay distinct until you commit.
      </p>
      <div
        ref={listRef}
        className="staff-shell__queue-list"
        data-testid="queue-workboard"
        role="listbox"
        tabIndex={0}
        aria-label="Clinical queue workboard"
        aria-describedby="workspace-workboard-keyboard-model"
        aria-activedescendant={activeDescendantId}
        data-row-count={projection.rows.length}
        onKeyDown={onListKeyDown}
      >
        {renderedRows.map((row, index) => (
          <QueueRow
            key={row.taskId}
            row={row}
            task={requireCase(row.taskId)}
            mergeDigest={mergeDigests[row.taskId]!}
            rowIndex={windowStart + index}
            rowCount={projection.rows.length}
            selectedTaskId={selectedTaskId}
            runtimeScenario={runtimeScenario}
            onHover={onRowHover}
            onSelect={onRowSelect}
            onOpen={onRowOpen}
          />
        ))}
      </div>
      <QueuePreviewPocket
        task={previewTask}
        digest={projection.queuePreviewDigest}
        mergeDigest={previewTask ? mergeDigests[previewTask.id] ?? null : null}
        previewMode={projection.previewMode}
        runtimeScenario={runtimeScenario}
        onOpenAction={onPreviewAction}
        onPinToggle={onPreviewPinToggle}
      />
    </section>
  );
}

export function QueueScanManager({
  route,
  ledger,
  focusContinuity,
  runtimeScenario,
  previewTaskId,
  previewPinned,
  onPreviewTaskChange,
  onPreviewPinnedChange,
  onLedgerChange,
  onNavigate,
  onOpenTask,
  onOpenPeerRouteTask,
}: {
  route: StaffShellRoute;
  ledger: StaffShellLedger;
  focusContinuity: WorkspaceFocusContinuityProjection;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  previewTaskId: string | null;
  previewPinned: boolean;
  onPreviewTaskChange: (taskId: string) => void;
  onPreviewPinnedChange: (nextPinned: boolean) => void;
  onLedgerChange: (updater: (current: StaffShellLedger) => StaffShellLedger) => void;
  onNavigate: (nextRoute: StaffShellRoute) => void;
  onOpenTask: (taskId: string) => void;
  onOpenPeerRouteTask: (
    routeKind: "callbacks" | "consequences",
    taskId: string,
    anchorRef: string,
  ) => void;
}) {
  const [filterKey, setFilterKey] = useState<QueueToolbarFilterKey>("all");
  const [searchQuery, setSearchQuery] = useState(route.kind === "search" ? ledger.searchQuery : "");
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const explicitPinTaskRef = useRef<string | null>(previewPinned ? previewTaskId : null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFilterKey("all");
    setSearchQuery(route.kind === "search" ? ledger.searchQuery : "");
  }, [route.kind, route.queueKey, route.searchQuery, ledger.searchQuery]);

  useEffect(() => {
    if (!previewTaskId) {
      onPreviewTaskChange(ledger.selectedTaskId);
    }
  }, [ledger.selectedTaskId, onPreviewTaskChange, previewTaskId]);

  useEffect(() => {
    explicitPinTaskRef.current = previewPinned ? previewTaskId : null;
  }, [previewPinned, previewTaskId]);

  useEffect(() => {
    const listNode = listRef.current;
    if (!listNode) {
      return;
    }
    const selectedNode = listNode.querySelector<HTMLElement>(`[data-anchor-ref="${ledger.selectedAnchorId}"]`);
    selectedNode?.scrollIntoView({ block: "nearest" });
  }, [ledger.selectedAnchorId, route.path]);

  const projection = useMemo(
    () =>
      buildQueueWorkbenchProjection({
        route,
        ledger,
        selectedTaskId: ledger.selectedTaskId,
        previewTaskId,
        previewPinned,
        filterKey,
        searchQuery,
      }),
    [filterKey, ledger, previewPinned, previewTaskId, route, searchQuery],
  );

  const previewTask = projection.previewTaskId ? requireCase(projection.previewTaskId) : null;
  const mergeDigests = useMemo(
    () =>
      buildQueueCallbackAdminMergeMap({
        runtimeScenario,
        taskIds: Array.from(
          new Set([
            ...projection.rows.map((row) => row.taskId),
            ...(projection.previewTaskId ? [projection.previewTaskId] : []),
          ]),
        ),
      }),
    [projection.previewTaskId, projection.rows, runtimeScenario],
  );

  const schedulePreview = (taskId: string) => {
    if (explicitPinTaskRef.current === taskId) {
      return;
    }
    if (previewPinned && previewTaskId === taskId) {
      return;
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => {
      onPreviewTaskChange(taskId);
      onPreviewPinnedChange(false);
    }, 100);
  };

  const selectRow = (taskId: string) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    explicitPinTaskRef.current = taskId;
    onLedgerChange((current) => ({
      ...current,
      selectedTaskId: taskId,
      previewTaskId: taskId,
      selectedAnchorId: `queue-row-${taskId}`,
    }));
    onPreviewTaskChange(taskId);
    onPreviewPinnedChange(true);
  };

  const openRow = (taskId: string) => {
    selectRow(taskId);
    onOpenTask(taskId);
  };

  const openPreviewAction = (taskId: string, action: QueueMergeLaunchAction) => {
    selectRow(taskId);
    if (action.routeKind === "task") {
      onOpenTask(taskId);
      return;
    }
    onOpenPeerRouteTask(action.routeKind, taskId, action.anchorRef);
  };

  const handleBatchApply = () => {
    onLedgerChange((current) => ({
      ...current,
      queuedBatchPending: false,
      bufferedUpdateCount: 0,
      bufferedQueueTrayState: "collapsed",
    }));
  };

  const handleStubResolve = (stub: QueueAnchorStubProjection) => {
    if (stub.stubState === "filtered") {
      setFilterKey("all");
      return;
    }
    if (stub.stubState === "search_hidden") {
      setSearchQuery("");
      return;
    }
    if (stub.targetQueueKey) {
      onNavigate(parseStaffPath(buildStaffPath({ kind: "queue", queueKey: stub.targetQueueKey })));
      return;
    }
    const fallbackRow = projection.rows[0];
    if (fallbackRow) {
      selectRow(fallbackRow.taskId);
    }
  };

  const onListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!projection.rows.length) {
      return;
    }
    const currentIndex = projection.rows.findIndex((row) => row.taskId === ledger.selectedTaskId);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex =
        event.key === "ArrowDown"
          ? Math.min(currentIndex + 1, projection.rows.length - 1)
          : Math.max(currentIndex - 1, 0);
      const nextRow = projection.rows[nextIndex] ?? projection.rows[0];
      if (!nextRow) {
        return;
      }
      onLedgerChange((current) => ({
        ...current,
        selectedTaskId: nextRow.taskId,
        previewTaskId: nextRow.taskId,
        selectedAnchorId: nextRow.anchorRef,
      }));
      onPreviewTaskChange(nextRow.taskId);
      onPreviewPinnedChange(false);
      return;
    }
    if (event.key === " " || event.key === "Spacebar" || event.key === "Space") {
      event.preventDefault();
      selectRow(ledger.selectedTaskId);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      openRow(ledger.selectedTaskId);
    }
  };

  return (
    <aside
      className="staff-shell__workboard-pane"
      data-testid="queue-scan-manager"
      id={WORKSPACE_FOCUS_TARGET_IDS.workboard}
      tabIndex={-1}
      role="region"
      aria-labelledby="workspace-workboard-heading"
      {...buildWorkspaceSurfaceAttributes({
        surface: "queue_workboard",
        surfaceState: route.kind,
        focusModel: "listbox",
        selectedAnchorRef: ledger.selectedAnchorId,
        runtimeScenario,
      })}
    >
      <QueueToolbar
        route={route}
        projection={projection}
        filterKey={filterKey}
        onFilterChange={setFilterKey}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onQueueChange={(queueKey) => onNavigate(parseStaffPath(buildStaffPath({ kind: "queue", queueKey })))}
      />

      {focusContinuity.bufferedQueueTray && (
        <BufferedQueueChangeTray
          projection={focusContinuity.bufferedQueueTray}
          onApply={handleBatchApply}
          onToggleReview={() =>
            onLedgerChange((current) => ({
              ...current,
              bufferedQueueTrayState:
                current.bufferedQueueTrayState === "expanded" ? "collapsed" : "expanded",
            }))
          }
          onDefer={() =>
            onLedgerChange((current) => ({
              ...current,
              bufferedQueueTrayState: "deferred",
            }))
          }
        />
      )}

      {projection.anchorStub ? <QueueAnchorStub stub={projection.anchorStub} onResolve={handleStubResolve} /> : null}

      <QueueWorkboardFrame
        projection={projection}
        previewTask={previewTask}
        mergeDigests={mergeDigests}
        runtimeScenario={runtimeScenario}
        listRef={listRef}
        onRowHover={schedulePreview}
        onRowSelect={selectRow}
        onRowOpen={openRow}
        onListKeyDown={onListKeyDown}
        onPreviewPinToggle={() => onPreviewPinnedChange(!previewPinned)}
        onPreviewAction={openPreviewAction}
      />
    </aside>
  );
}
