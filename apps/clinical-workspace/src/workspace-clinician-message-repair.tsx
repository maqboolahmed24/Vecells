import { useEffect, useMemo, useState } from "react";
import type {
  ClinicianMessageChronologyEventProjection,
  ClinicianMessageChronologyGroupProjection,
  ClinicianMessageReceiptPosture,
  ClinicianMessageRepairKind,
  ClinicianMessageStage,
  ClinicianMessageDetailSurfaceProjection,
  ClinicianMessageWorkbenchProjection,
  DeliveryDisputeStageProjection,
  DeliveryTruthLadderProjection,
  MessageRepairActionProjection,
  MessageRepairWorkbenchProjection,
  MessageThreadMastheadProjection,
  AttachmentRecoveryPromptProjection,
} from "./workspace-clinician-message-repair.data";
import type { WorkspaceFocusContinuityProjection } from "./workspace-focus-continuity.data";
import {
  BufferedQueueChangeTray,
  ProtectedCompositionRecovery,
  WorkspaceProtectionStrip,
} from "./workspace-focus-continuity";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function labelFromToken(value: string): string {
  return value.replaceAll("_", " ");
}

function receiptTone(
  value: ClinicianMessageReceiptPosture,
): "neutral" | "accent" | "caution" | "critical" {
  switch (value) {
    case "durable_delivery":
      return "accent";
    case "provider_accepted":
    case "manual_attestation":
      return "caution";
    case "contradictory_signal":
    case "failed":
    case "expired":
      return "critical";
    case "draft_local":
    default:
      return "neutral";
  }
}

function stageLabel(stage: ClinicianMessageStage): string {
  switch (stage) {
    case "dispute":
      return "Delivery dispute review";
    case "repair":
      return "Repair workbench";
    case "detail":
    default:
      return "Thread detail";
  }
}

function repairKindLabel(value: ClinicianMessageRepairKind): string {
  return value === "none" ? "No repair active" : labelFromToken(value);
}

function MessageWorklistRow({
  row,
  onSelect,
  onOpenTask,
}: {
  row: ClinicianMessageWorkbenchProjection["rows"][number];
  onSelect: (taskId: string, anchorRef: string) => void;
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <article
      className="staff-shell__message-row"
      data-testid="ClinicianMessageWorklistRow"
      data-task-id={row.taskId}
      data-selected={row.selected ? "true" : "false"}
      data-thread-state={row.threadState}
      data-delivery-truth={row.latestDeliveryTruth}
      data-repair-kind={row.repairKind}
      data-receipt-posture={row.latestReceiptPosture}
    >
      <button
        type="button"
        className="staff-shell__message-row-main"
        onClick={() => onSelect(row.taskId, row.anchorRef)}
      >
        <div className="staff-shell__message-row-head">
          <div>
            <strong>{row.patientLabel}</strong>
            <span>{row.requestLabel}</span>
          </div>
          <span
            className="staff-shell__message-badge"
            data-tone={receiptTone(row.latestReceiptPosture)}
          >
            {labelFromToken(row.latestReceiptPosture)}
          </span>
        </div>
        <div className="staff-shell__message-row-meta">
          <span>{row.routeLabel}</span>
          <span>{labelFromToken(row.expectationState)}</span>
        </div>
        <p>{row.summary}</p>
        <div className="staff-shell__message-row-foot">
          <span>{row.dueLabel}</span>
          <span>{row.nextAllowedActionLabel}</span>
        </div>
      </button>
      <div className="staff-shell__message-row-signals">
        <span className="staff-shell__message-chip">{labelFromToken(row.threadState)}</span>
        <span className="staff-shell__message-chip">{repairKindLabel(row.repairKind)}</span>
        <span className="staff-shell__message-chip">
          {labelFromToken(row.resolutionGateState)}
        </span>
        <button
          type="button"
          className="staff-shell__utility-button"
          onClick={() => onOpenTask(row.taskId)}
        >
          Open task shell
        </button>
      </div>
    </article>
  );
}

export function MessageThreadMasthead({
  projection,
  selectedStage,
  onSelectStage,
}: {
  projection: MessageThreadMastheadProjection;
  selectedStage: ClinicianMessageStage;
  onSelectStage: (stage: ClinicianMessageStage) => void;
}) {
  const stages: readonly ClinicianMessageStage[] = ["detail", "dispute", "repair"];
  return (
    <header
      className="staff-shell__message-masthead"
      data-testid="MessageThreadMasthead"
      data-thread-state={projection.latestDeliveryTruth}
      data-receipt-posture={projection.latestReceiptPosture}
    >
      <div className="staff-shell__message-masthead-main">
        <div>
          <span className="staff-shell__eyebrow">MessageThreadMasthead</span>
          <h2>{projection.headline}</h2>
          <p>{projection.summary}</p>
        </div>
        <div className="staff-shell__message-masthead-alert">
          <strong>Current risk</strong>
          <p>{projection.riskSummary}</p>
        </div>
      </div>
      <div className="staff-shell__message-masthead-strip">
        <span>{projection.patientLabel}</span>
        <strong>{projection.routeLabel}</strong>
        <span>{labelFromToken(projection.expectationState)}</span>
        <span>{labelFromToken(projection.resolutionGateState)}</span>
      </div>
      <div className="staff-shell__message-facts">
        <div>
          <strong>Participants</strong>
          <span>{projection.participantsLabel}</span>
        </div>
        <div>
          <strong>Dispatch envelope</strong>
          <span>{projection.latestDispatchEnvelopeRef}</span>
        </div>
        <div>
          <strong>Delivery bundle</strong>
          <span>{projection.latestDeliveryEvidenceBundleRef ?? "Not yet current"}</span>
        </div>
        <div>
          <strong>Expectation envelope</strong>
          <span>{projection.latestExpectationEnvelopeRef}</span>
        </div>
        <div>
          <strong>Resolution gate</strong>
          <span>{projection.latestResolutionGateRef}</span>
        </div>
        <div>
          <strong>Thread tuple</strong>
          <span>{projection.threadTupleRef}</span>
        </div>
      </div>
      <div
        className="staff-shell__message-stage-tabs"
        role="tablist"
        aria-label="Clinician message stages"
      >
        {stages.map((stage) => (
          <button
            key={stage}
            type="button"
            className="staff-shell__message-stage-tab"
            data-selected={selectedStage === stage ? "true" : "false"}
            onClick={() => onSelectStage(stage)}
          >
            {stageLabel(stage)}
          </button>
        ))}
      </div>
    </header>
  );
}

export function DeliveryTruthLadder({
  projection,
}: {
  projection: DeliveryTruthLadderProjection;
}) {
  return (
    <section
      className="staff-shell__message-ladder"
      data-testid="DeliveryTruthLadder"
      data-current-truth={projection.currentTruth}
      data-receipt-posture={projection.latestReceiptPosture}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">DeliveryTruthLadder</span>
        <h3>Current delivery truth</h3>
        <p>
          Transport and evidence stay separate. The ladder only reaches delivered when the
          current evidence bundle says it does.
        </p>
      </header>
      <ol className="staff-shell__message-ladder-list">
        {projection.steps.map((step) => (
          <li
            key={step.stepId}
            className="staff-shell__message-ladder-step"
            data-state={step.state}
            data-step-key={step.stepKey}
          >
            <span className="staff-shell__message-ladder-rail" aria-hidden="true" />
            <div className="staff-shell__message-ladder-copy">
              <strong>{step.label}</strong>
              <p>{step.evidenceLabel}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MessageChronologyEvent({
  row,
  onSelectEvent,
}: {
  row: ClinicianMessageChronologyEventProjection;
  onSelectEvent: (anchorRef: string) => void;
}) {
  return (
    <article
      className="staff-shell__message-event"
      data-testid="ClinicianMessageChronologyEvent"
      data-selected={row.selected ? "true" : "false"}
      data-receipt-posture={row.receiptPosture}
      data-kind={row.kind}
      data-anchor-ref={row.anchorRef}
    >
      <button
        type="button"
        className="staff-shell__message-event-main"
        onClick={() => onSelectEvent(row.anchorRef)}
      >
        <div className="staff-shell__message-event-head">
          <div>
            <strong>{row.headline}</strong>
            <span>
              {row.occurredAtLabel} · {row.actorLabel}
            </span>
          </div>
          <span
            className="staff-shell__message-badge"
            data-tone={receiptTone(row.receiptPosture)}
          >
            {labelFromToken(row.receiptPosture)}
          </span>
        </div>
        <p>{row.summary}</p>
        <dl className="staff-shell__message-event-meta">
          <div>
            <dt>Dispatch envelope</dt>
            <dd>{row.dispatchEnvelopeRef}</dd>
          </div>
          <div>
            <dt>Delivery bundle</dt>
            <dd>{row.deliveryEvidenceBundleRef ?? "Bundle not current"}</dd>
          </div>
          <div>
            <dt>Expectation</dt>
            <dd>{row.expectationEnvelopeRef}</dd>
          </div>
          <div>
            <dt>Evidence strength</dt>
            <dd>{row.evidenceStrengthLabel}</dd>
          </div>
        </dl>
        {row.repairHint && <span className="staff-shell__message-event-hint">{row.repairHint}</span>}
      </button>
    </article>
  );
}

function MessageChronologyGroup({
  group,
  onSelectEvent,
}: {
  group: ClinicianMessageChronologyGroupProjection;
  onSelectEvent: (anchorRef: string) => void;
}) {
  return (
    <section className="staff-shell__message-group" data-testid="ClinicianMessageChronologyGroup">
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">{group.label}</span>
        <h3>{group.label}</h3>
        <p>{group.summary}</p>
      </header>
      <div className="staff-shell__message-group-list">
        {group.rows.map((row) => (
          <MessageChronologyEvent
            key={row.rowId}
            row={row}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </section>
  );
}

export function DeliveryDisputeStage({
  projection,
  onOpenRepair,
}: {
  projection: DeliveryDisputeStageProjection;
  onOpenRepair: () => void;
}) {
  return (
    <section
      className="staff-shell__message-side-stage"
      data-testid="DeliveryDisputeStage"
      data-stage-state={projection.stageState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">DeliveryDisputeStage</span>
        <h3>Contradictory receipt review</h3>
        <p>
          Pin the disputed route, evidence, and next repair action in place without replacing the
          chronology.
        </p>
      </header>
      {projection.contradictoryReceiptSummary ? (
        <div className="staff-shell__message-alert" data-tone="critical">
          <strong>Contradictory same-fence signal</strong>
          <p>{projection.contradictoryReceiptSummary}</p>
        </div>
      ) : (
        <div className="staff-shell__message-alert" data-tone="caution">
          <strong>No contradictory bundle is currently active</strong>
          <p>The thread remains here only when review needs to stay bounded before repair.</p>
        </div>
      )}
      <div className="staff-shell__message-facts">
        <div>
          <strong>Pinned route</strong>
          <span>{projection.pinnedRouteLabel}</span>
        </div>
        <div>
          <strong>Selected anchor</strong>
          <span>{projection.selectedEventAnchorRef ?? "Latest chronology anchor"}</span>
        </div>
      </div>
      <section className="staff-shell__message-evidence-list">
        {projection.pinnedEvidenceRefs.map((item) => (
          <article key={item} className="staff-shell__message-evidence-item">
            <strong>Evidence ref</strong>
            <span>{item}</span>
          </article>
        ))}
      </section>
      {projection.freezeReason && (
        <div className="staff-shell__message-alert" data-tone="caution">
          <strong>Mutation frozen</strong>
          <p>{projection.freezeReason}</p>
        </div>
      )}
      {projection.callbackFallbackSummary && (
        <div className="staff-shell__message-fallback">
          <strong>Fallback</strong>
          <p>{projection.callbackFallbackSummary}</p>
        </div>
      )}
      <button type="button" className="staff-shell__inline-action" onClick={onOpenRepair}>
        {projection.nextRepairLabel}
      </button>
    </section>
  );
}

export function AttachmentRecoveryPrompt({
  projection,
}: {
  projection: AttachmentRecoveryPromptProjection;
}) {
  if (!projection.visible) {
    return null;
  }
  return (
    <section
      className="staff-shell__message-prompt"
      data-testid="AttachmentRecoveryPrompt"
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">AttachmentRecoveryPrompt</span>
        <h3>{projection.headline}</h3>
        <p>{projection.summary}</p>
      </header>
      <div className="staff-shell__message-facts">
        <div>
          <strong>Artifact set</strong>
          <span>{projection.recoveryArtifactLabel ?? "No current artifact set"}</span>
        </div>
        <div>
          <strong>Checkpoint</strong>
          <span>{projection.checkpointRef ?? "No active checkpoint"}</span>
        </div>
      </div>
      <button type="button" className="staff-shell__utility-button">
        {projection.actionLabel}
      </button>
    </section>
  );
}

function RepairActionCard({
  action,
  selected,
  onSelect,
}: {
  action: MessageRepairActionProjection;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="staff-shell__message-repair-action"
      data-selected={selected ? "true" : "false"}
      data-enabled={action.enabled ? "true" : "false"}
      data-action-key={action.actionKey}
      onClick={onSelect}
    >
      <strong>{action.label}</strong>
      <p>{action.summary}</p>
      {action.blockedReason && <span>{action.blockedReason}</span>}
    </button>
  );
}

export function MessageRepairWorkbench({
  projection,
  selectedAction,
  checkedEvidence,
  onSelectAction,
  onToggleEvidence,
}: {
  projection: MessageRepairWorkbenchProjection;
  selectedAction: Exclude<ClinicianMessageRepairKind, "none">;
  checkedEvidence: readonly string[];
  onSelectAction: (actionKey: Exclude<ClinicianMessageRepairKind, "none">) => void;
  onToggleEvidence: (value: string) => void;
}) {
  const activeAction =
    projection.actions.find((action) => action.actionKey === selectedAction) ??
    projection.actions[0];
  if (!activeAction) {
    return null;
  }
  const actionUnlocked =
    activeAction.enabled &&
    activeAction.requiredChecks.every((item) => checkedEvidence.includes(item)) &&
    projection.stageState === "live";

  return (
    <section
      className="staff-shell__message-side-stage"
      data-testid="MessageRepairWorkbench"
      data-stage-state={projection.stageState}
      data-repair-kind={projection.repairKind}
      data-selected-action={activeAction.actionKey}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">MessageRepairWorkbench</span>
        <h3>{projection.dominantActionLabel}</h3>
        <p>{projection.summary}</p>
      </header>
      <div className="staff-shell__message-facts">
        <div>
          <strong>Route safety</strong>
          <span>{projection.routeSafetyLabel}</span>
        </div>
        <div>
          <strong>Repair posture</strong>
          <span>{repairKindLabel(projection.repairKind)}</span>
        </div>
      </div>
      <div className="staff-shell__message-repair-grid">
        {projection.actions.map((action) => (
          <RepairActionCard
            key={action.actionId}
            action={action}
            selected={activeAction.actionKey === action.actionKey}
            onSelect={() => onSelectAction(action.actionKey)}
          />
        ))}
      </div>

      <section className="staff-shell__message-checklist">
        <header className="staff-shell__task-stack-header">
          <span className="staff-shell__eyebrow">Current legal action</span>
          <h3>{activeAction.label}</h3>
          <p>
            {activeAction.enabled
              ? "Required checks must be satisfied before the current repair action is unlocked."
              : activeAction.blockedReason ?? "This action is not currently legal."}
          </p>
        </header>
        {activeAction.requiredChecks.length > 0 ? (
          <div className="staff-shell__message-checklist-items">
            {activeAction.requiredChecks.map((item) => (
              <label key={item} className="staff-shell__message-check-item">
                <input
                  type="checkbox"
                  checked={checkedEvidence.includes(item)}
                  onChange={() => onToggleEvidence(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="staff-shell__message-alert" data-tone="caution">
            <strong>Action fenced</strong>
            <p>{activeAction.blockedReason ?? "No additional checks are currently defined."}</p>
          </div>
        )}
      </section>

      {projection.attachmentRecoveryPrompt && (
        <AttachmentRecoveryPrompt projection={projection.attachmentRecoveryPrompt} />
      )}

      <button
        type="button"
        className="staff-shell__inline-action"
        disabled={!actionUnlocked}
      >
        {activeAction.enabled ? `Unlock ${activeAction.label.toLowerCase()}` : activeAction.label}
      </button>
    </section>
  );
}

function ClinicianMessageDetailSurface({
  projection,
  selectedAction,
  checkedEvidence,
  onSelectStage,
  onSelectEvent,
  onSelectAction,
  onToggleEvidence,
}: {
  projection: ClinicianMessageDetailSurfaceProjection;
  selectedAction: Exclude<ClinicianMessageRepairKind, "none">;
  checkedEvidence: readonly string[];
  onSelectStage: (stage: ClinicianMessageStage) => void;
  onSelectEvent: (anchorRef: string) => void;
  onSelectAction: (actionKey: Exclude<ClinicianMessageRepairKind, "none">) => void;
  onToggleEvidence: (value: string) => void;
}) {
  return (
    <section
      className="staff-shell__message-detail"
      data-testid="ClinicianMessageDetailSurface"
      data-thread-state={projection.threadState}
      data-delivery-truth={projection.latestDeliveryTruth}
      data-repair-kind={projection.repairKind}
      data-thread-tuple={projection.threadTupleRef}
      data-dispute-stage={projection.selectedStage}
      data-mutation-state={projection.mutationState}
    >
      <MessageThreadMasthead
        projection={projection.masthead}
        selectedStage={projection.selectedStage}
        onSelectStage={onSelectStage}
      />

      <div className="staff-shell__message-main-grid">
        <div className="staff-shell__message-chronology-plane">
          <DeliveryTruthLadder projection={projection.deliveryTruthLadder} />
          <section className="staff-shell__message-source-card">
            <header className="staff-shell__task-stack-header">
              <span className="staff-shell__eyebrow">Source review context</span>
              <h3>What this thread is attached to</h3>
            </header>
            <ul className="staff-shell__message-context-list">
              {projection.sourceSummaryPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          {projection.chronologyGroups.map((group) => (
            <MessageChronologyGroup
              key={group.groupId}
              group={group}
              onSelectEvent={onSelectEvent}
            />
          ))}
        </div>

        <aside className="staff-shell__message-side-lane">
          {projection.selectedStage === "dispute" ? (
            <DeliveryDisputeStage
              projection={projection.deliveryDisputeStage}
              onOpenRepair={() => onSelectStage("repair")}
            />
          ) : (
            <MessageRepairWorkbench
              projection={projection.repairWorkbench}
              selectedAction={selectedAction}
              checkedEvidence={checkedEvidence}
              onSelectAction={onSelectAction}
              onToggleEvidence={onToggleEvidence}
            />
          )}
        </aside>
      </div>
    </section>
  );
}

export function ClinicianMessageThreadSurface({
  projection,
  focusContinuity,
  onSelectThread,
  onSelectEvent,
  onSelectStage,
  onOpenTask,
  onBufferedQueueApply,
  onBufferedQueueToggleReview,
  onBufferedQueueDefer,
}: {
  projection: ClinicianMessageWorkbenchProjection;
  focusContinuity: WorkspaceFocusContinuityProjection;
  onSelectThread: (taskId: string, anchorRef: string) => void;
  onSelectEvent: (anchorRef: string) => void;
  onSelectStage: (stage: ClinicianMessageStage) => void;
  onOpenTask: (taskId: string) => void;
  onBufferedQueueApply: () => void;
  onBufferedQueueToggleReview: () => void;
  onBufferedQueueDefer: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "lag" | "disputed" | "repair">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<
    Exclude<ClinicianMessageRepairKind, "none">
  >(projection.detailSurface.repairWorkbench.selectedActionKey);
  const [checkedEvidence, setCheckedEvidence] = useState<readonly string[]>([]);

  useEffect(() => {
    setSelectedAction(projection.detailSurface.repairWorkbench.selectedActionKey);
    setCheckedEvidence([]);
  }, [projection.detailSurface.threadId, projection.detailSurface.repairWorkbench.selectedActionKey]);

  const visibleRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return projection.rows.filter((row) => {
      if (filter === "lag" && row.latestDeliveryTruth !== "transport_accepted") {
        return false;
      }
      if (filter === "disputed" && row.threadState !== "disputed") {
        return false;
      }
      if (
        filter === "repair" &&
        row.repairKind !== "route_repair" &&
        row.repairKind !== "attachment_recovery"
      ) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return [
        row.patientLabel,
        row.requestLabel,
        row.summary,
        row.routeLabel,
        row.nextAllowedActionLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [filter, projection.rows, searchQuery]);

  const toggleEvidence = (value: string) => {
    setCheckedEvidence((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  return (
    <section
      className="staff-shell__message-workbench"
      data-testid="ClinicianMessageThreadSurface"
      data-design-mode={projection.visualMode}
      data-shell-type="staff"
      data-route-family="rf_staff_workspace_child"
      data-thread-state={projection.detailSurface.threadState}
      data-delivery-truth={projection.detailSurface.latestDeliveryTruth}
      data-repair-kind={projection.detailSurface.repairKind}
      data-thread-tuple={projection.detailSurface.threadTupleRef}
      data-dispute-stage={projection.selectedStage}
      data-dominant-action={projection.detailSurface.repairWorkbench.dominantActionLabel}
      data-continuity-key={projection.continuityKey}
      data-mutation-state={projection.mutationState}
      data-focus-protection={focusContinuity.focusState}
      data-protected-composition={focusContinuity.protectedMode}
      data-buffered-queue-batch={focusContinuity.bufferedQueueTray?.batchState ?? "hidden"}
      data-auto-advance={focusContinuity.noAutoAdvancePolicy}
    >
      <header className="staff-shell__message-workbench-head">
        <div>
          <span className="staff-shell__eyebrow">Thread_Repair_Studio</span>
          <h2>Clinician messaging thread</h2>
          <p>{projection.queueHealthSummary}</p>
        </div>
        <div className="staff-shell__message-summary-strip">
          <span>{projection.rowCount} live message threads</span>
          <span>{projection.lagSummary}</span>
          <span>{stageLabel(projection.selectedStage)}</span>
        </div>
      </header>

      <div className="staff-shell__message-toolbar">
        <div
          className="staff-shell__message-filter-group"
          role="tablist"
          aria-label="Clinician message filters"
        >
          {[
            ["all", "All"],
            ["lag", "Delivery lag"],
            ["disputed", "Disputed"],
            ["repair", "Repair"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="staff-shell__message-filter"
              data-selected={filter === key ? "true" : "false"}
              onClick={() => setFilter(key as typeof filter)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="staff-shell__search-field">
          <span>Search message threads</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </label>
      </div>

      <WorkspaceProtectionStrip
        projection={focusContinuity.protectionStrip}
        onToggleTray={onBufferedQueueToggleReview}
      />

      {focusContinuity.bufferedQueueTray && (
        <BufferedQueueChangeTray
          projection={focusContinuity.bufferedQueueTray}
          onApply={onBufferedQueueApply}
          onToggleReview={onBufferedQueueToggleReview}
          onDefer={onBufferedQueueDefer}
        />
      )}

      {focusContinuity.recovery && (
        <ProtectedCompositionRecovery projection={focusContinuity.recovery} />
      )}

      <div className="staff-shell__message-workbench-grid">
        <aside className="staff-shell__message-lane">
          <header className="staff-shell__task-stack-header">
            <span className="staff-shell__eyebrow">ClinicianMessageThreadSurface</span>
            <h3>Evidence-bound message list</h3>
            <p>
              Scan route risk, thread truth, and next legal action without confusing transport
              acceptance for delivery.
            </p>
          </header>
          <div className="staff-shell__message-lane-list">
            {visibleRows.map((row) => (
              <MessageWorklistRow
                key={row.rowId}
                row={row}
                onSelect={onSelectThread}
                onOpenTask={onOpenTask}
              />
            ))}
          </div>
        </aside>

        <ClinicianMessageDetailSurface
          projection={projection.detailSurface}
          selectedAction={selectedAction}
          checkedEvidence={checkedEvidence}
          onSelectStage={onSelectStage}
          onSelectEvent={onSelectEvent}
          onSelectAction={(actionKey) => {
            setSelectedAction(actionKey);
            setCheckedEvidence([]);
          }}
          onToggleEvidence={toggleEvidence}
        />
      </div>
    </section>
  );
}
