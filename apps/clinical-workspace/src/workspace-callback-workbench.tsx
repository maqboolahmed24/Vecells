import { useEffect, useMemo, useState } from "react";
import type {
  CallbackDetailSurfaceProjection,
  CallbackEvidenceState,
  CallbackOutcome,
  CallbackOutcomeCaptureProjection,
  CallbackRouteRepairPromptProjection,
  CallbackWorkbenchProjection,
  CallbackWorklistRowProjection,
} from "./workspace-callback-workbench.data";
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

function publicCallbackText(value: string): string {
  return value
    .replace(/\brequest_215_callback\b/g, "callback request")
    .replace(/\bcluster_214_callback\b/g, "callback conversation")
    .replace(/\bposture\b/gi, "status")
    .replace(/\btruth\b/gi, "confirmed information")
    .replace(/\btuple\b/gi, "details")
    .replace(/\blineage\b/gi, "history")
    .replace(/\bstub\b/gi, "summary")
    .replace(/\b[a-z]+(?:_[a-z0-9]+)+\b/g, (token) =>
      token.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    );
}

function evidenceTone(value: CallbackEvidenceState): "critical" | "caution" | "accent" {
  switch (value) {
    case "durable":
      return "accent";
    case "partial":
      return "caution";
    case "missing":
    default:
      return "critical";
  }
}

function stageLabel(stage: CallbackWorkbenchProjection["selectedStage"]): string {
  switch (stage) {
    case "repair":
      return "Route repair stage";
    case "outcome":
      return "Outcome capture stage";
    case "detail":
    default:
      return "Callback detail";
  }
}

function CallbackWorklistRow({
  row,
  onSelect,
  onOpenTask,
}: {
  row: CallbackWorklistRowProjection;
  onSelect: (taskId: string, anchorRef: string) => void;
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <article
      className="staff-shell__callback-row"
      data-testid="CallbackWorklistRow"
      data-task-id={row.taskId}
      data-callback-state={row.callbackState}
      data-intent-lease-state={row.intentLeaseState}
      data-attempt-state={row.attemptState}
      data-route-health={row.routeHealthLabel.toLowerCase().replaceAll(" ", "_")}
      data-resolution-gate={row.resolutionGateState}
      data-selected={row.selected ? "true" : "false"}
    >
      <button
        type="button"
        className="staff-shell__callback-row-main"
        onClick={() => onSelect(row.taskId, row.anchorRef)}
      >
        <div className="staff-shell__callback-row-head">
          <div>
            <strong>{row.patientLabel}</strong>
            <span>{row.requestLabel}</span>
          </div>
          <span className="staff-shell__callback-chip" data-tone={row.routeHealthLabel.toLowerCase().replaceAll(" ", "_")}>
            {row.routeHealthLabel}
          </span>
        </div>
        <div className="staff-shell__callback-row-meta">
          <span>{row.promiseWindowLabel}</span>
          <span>{row.urgencyLabel}</span>
          <span>{row.currentOwnerLabel}</span>
        </div>
        <p>{publicCallbackText(row.summary)}</p>
        <div className="staff-shell__callback-row-foot">
          <span>{row.dueLabel}</span>
          <span>{row.nextAllowedActionLabel}</span>
        </div>
      </button>
      <div className="staff-shell__callback-row-guards">
        <span className="staff-shell__callback-badge">{publicCallbackText(labelFromToken(row.callbackState))}</span>
        <span className="staff-shell__callback-badge">{publicCallbackText(labelFromToken(row.intentLeaseState))}</span>
        <span className="staff-shell__callback-badge">{publicCallbackText(labelFromToken(row.resolutionGateState))}</span>
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

export function CallbackExpectationCard({
  projection,
}: {
  projection: CallbackDetailSurfaceProjection["expectationCard"];
}) {
  return (
    <section
      className="staff-shell__callback-card"
      data-testid="CallbackExpectationCard"
      data-callback-state={projection.patientVisibleState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">Callback expectation</span>
        <h3>Current patient promise</h3>
        <p>{publicCallbackText(projection.patientWordingPreview)}</p>
      </header>
      <div className="staff-shell__callback-facts">
        <div>
          <strong>Envelope</strong>
          <span>Current expectation</span>
        </div>
        <div>
          <strong>Visible state</strong>
          <span>{publicCallbackText(labelFromToken(projection.patientVisibleState))}</span>
        </div>
        <div>
          <strong>Promised window</strong>
          <span>{publicCallbackText(projection.promiseWindowLabel)}</span>
        </div>
        <div>
          <strong>Preferred route</strong>
          <span>{publicCallbackText(projection.preferredRouteLabel)}</span>
        </div>
      </div>
      {projection.stalePromiseWarning && (
        <div className="staff-shell__callback-alert" data-tone="critical">
          <strong>Promise warning</strong>
          <p>{publicCallbackText(projection.stalePromiseWarning)}</p>
        </div>
      )}
      <p className="staff-shell__callback-fallback">{publicCallbackText(projection.fallbackGuidance)}</p>
    </section>
  );
}

export function CallbackAttemptTimeline({
  projection,
  liveAttemptAnchorRef,
  onSelectAttempt,
}: {
  projection: CallbackDetailSurfaceProjection["attemptTimeline"];
  liveAttemptAnchorRef: string | null;
  onSelectAttempt: (anchorRef: string) => void;
}) {
  const entries = projection.entries;
  return (
    <section
      className="staff-shell__callback-card"
      data-testid="CallbackAttemptTimeline"
      data-attempt-state={projection.activeAttemptState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">CallbackAttemptRecord</span>
        <h3>Attempt ladder</h3>
        <p>{projection.emptyStateLabel}</p>
      </header>

      {entries.length === 0 && !liveAttemptAnchorRef ? (
        <div className="staff-shell__callback-empty">
          <strong>No callback attempts yet</strong>
          <p>The first approved attempt will appear here with its attempt fence and provider correlation.</p>
        </div>
      ) : (
        <ol className="staff-shell__callback-timeline">
          {entries.map((entry) => (
            <li
              key={entry.entryId}
              className="staff-shell__callback-timeline-entry"
              data-evidence-state={entry.evidenceState}
              data-attempt-state={entry.attemptState}
              data-selected={entry.selected ? "true" : "false"}
            >
              <button
                type="button"
                className="staff-shell__callback-timeline-button"
                onClick={() => onSelectAttempt(entry.anchorRef)}
              >
                <div className="staff-shell__callback-timeline-head">
                  <div>
                    <strong>{entry.occurredAtLabel}</strong>
                    <span>{entry.targetRouteLabel}</span>
                  </div>
                  <span
                    className="staff-shell__callback-chip"
                    data-tone={evidenceTone(entry.evidenceState)}
                  >
                    {entry.evidenceState}
                  </span>
                </div>
                <div className="staff-shell__callback-timeline-meta">
                  <span>{entry.providerCorrelationRef}</span>
                  <span>{entry.dialFenceRef}</span>
                </div>
                <p>{entry.note}</p>
                <div className="staff-shell__callback-timeline-foot">
                  <span>{labelFromToken(entry.attemptState)}</span>
                  <span>{entry.outcome ? labelFromToken(entry.outcome) : "Outcome pending"}</span>
                  <span>{entry.outcomeEvidenceBundleRef ?? "Outcome bundle missing"}</span>
                </div>
              </button>
            </li>
          ))}
          {liveAttemptAnchorRef && (
            <li
              className="staff-shell__callback-timeline-entry"
              data-evidence-state="missing"
              data-attempt-state="outcome_pending"
              data-selected={projection.entries.length === 0 ? "true" : "false"}
            >
              <button
                type="button"
                className="staff-shell__callback-timeline-button"
                onClick={() => onSelectAttempt(liveAttemptAnchorRef)}
              >
                <div className="staff-shell__callback-timeline-head">
                  <div>
                    <strong>Now</strong>
                    <span>Current live callback route</span>
                  </div>
                  <span className="staff-shell__callback-chip" data-tone="caution">
                    missing
                  </span>
                </div>
                <div className="staff-shell__callback-timeline-meta">
                  <span>provider correlation pending</span>
                  <span>attempt fence reused in place</span>
                </div>
                <p>The live attempt is active. Repeated taps must reuse this same record.</p>
                <div className="staff-shell__callback-timeline-foot">
                  <span>outcome pending</span>
                  <span>Outcome not yet recorded</span>
                  <span>Bundle pending</span>
                </div>
              </button>
            </li>
          )}
        </ol>
      )}
    </section>
  );
}

export function CallbackRouteRepairPrompt({
  projection,
  compact = false,
  onOpenRepair,
}: {
  projection: CallbackRouteRepairPromptProjection;
  compact?: boolean;
  onOpenRepair: () => void;
}) {
  if (!projection.visible) {
    return null;
  }

  return (
    <section
      className={classNames("staff-shell__callback-card", compact && "staff-shell__callback-card--compact")}
      data-testid="CallbackRouteRepairPrompt"
      data-route-health={projection.routeHealth}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">Contact route repair</span>
        <h3>{projection.headline}</h3>
        <p>{projection.summary}</p>
      </header>
      <div className="staff-shell__callback-facts">
        <div>
          <strong>Route health</strong>
          <span>{labelFromToken(projection.routeHealth)}</span>
        </div>
        {projection.verificationCheckpointRef && (
          <div>
            <strong>Verification checkpoint</strong>
            <span>{projection.verificationCheckpointRef}</span>
          </div>
        )}
        {projection.reachabilityAssessmentRef && (
          <div>
            <strong>Reachability assessment</strong>
            <span>{projection.reachabilityAssessmentRef}</span>
          </div>
        )}
      </div>
      <button type="button" className="staff-shell__inline-action" onClick={onOpenRepair}>
        {projection.actionLabel}
      </button>
    </section>
  );
}

export function CallbackOutcomeCapture({
  projection,
  selectedOutcome,
  checkedEvidence,
  onOutcomeChange,
  onEvidenceToggle,
  onOpenRepair,
}: {
  projection: CallbackOutcomeCaptureProjection;
  selectedOutcome: CallbackOutcome;
  checkedEvidence: readonly string[];
  onOutcomeChange: (outcome: CallbackOutcome) => void;
  onEvidenceToggle: (evidence: string) => void;
  onOpenRepair: () => void;
}) {
  const option =
    projection.outcomeOptions.find((candidate) => candidate.outcome === selectedOutcome) ??
    projection.outcomeOptions[0];
  if (!option) {
    return null;
  }
  const allEvidenceReady = option.requiredEvidence.every((item) => checkedEvidence.includes(item));

  return (
    <section
      className="staff-shell__callback-card staff-shell__callback-card--stage"
      data-testid="CallbackOutcomeCapture"
      data-resolution-gate={projection.resolutionGateState}
      data-stage-state={projection.stageState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">CallbackOutcomeCapture</span>
        <h3>Outcome evidence and legal next step</h3>
        <p>{projection.duplicateAttemptGuardLabel}</p>
      </header>

      <div className="staff-shell__callback-facts">
        <div>
          <strong>Resolution gate</strong>
          <span>{projection.resolutionGateRef}</span>
        </div>
        <div>
          <strong>Selected attempt</strong>
          <span>{projection.selectedAttemptRef ?? "No attempt selected"}</span>
        </div>
        <div>
          <strong>Gate status</strong>
          <span>{labelFromToken(projection.resolutionGateState)}</span>
        </div>
      </div>

      {(projection.stageState === "repair_required" || projection.stageState === "blocked" || projection.stageState === "stale_recoverable") && (
        <div className="staff-shell__callback-alert" data-tone="caution">
          <strong>{projection.stageState === "repair_required" ? "Repair dominates" : "Capture frozen"}</strong>
          <p>{projection.freezeReason ?? "Outcome capture is not currently writable."}</p>
          {projection.stageState === "repair_required" && (
            <button type="button" className="staff-shell__inline-action" onClick={onOpenRepair}>
              Open route repair
            </button>
          )}
        </div>
      )}

      <div className="staff-shell__callback-outcome-grid" role="radiogroup" aria-label="Callback outcome choices">
        {projection.outcomeOptions.map((candidate) => (
          <button
            key={candidate.outcome}
            type="button"
            className="staff-shell__callback-outcome-option"
            data-selected={candidate.outcome === option.outcome ? "true" : "false"}
            onClick={() => onOutcomeChange(candidate.outcome)}
          >
            <strong>{candidate.label}</strong>
            <p>{candidate.summary}</p>
          </button>
        ))}
      </div>

      <section className="staff-shell__callback-evidence-panel">
        <header className="staff-shell__task-stack-header">
          <span className="staff-shell__eyebrow">Required evidence</span>
          <h3>{option.label}</h3>
        </header>
        <div className="staff-shell__callback-evidence-list">
          {option.requiredEvidence.map((item) => (
            <label key={item} className="staff-shell__callback-evidence-item">
              <input
                type="checkbox"
                checked={checkedEvidence.includes(item)}
                onChange={() => onEvidenceToggle(item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="staff-shell__callback-next-actions">
        <header className="staff-shell__task-stack-header">
          <span className="staff-shell__eyebrow">Legal next actions</span>
          <h3>Gate-driven actions only</h3>
        </header>
        <ul>
          {option.legalNextActions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <button
          type="button"
          className="staff-shell__inline-action"
          disabled={!allEvidenceReady || projection.stageState !== "ready"}
        >
          Record {option.label.toLowerCase()} outcome
        </button>
      </section>
    </section>
  );
}

export function CallbackDetailSurface({
  projection,
  liveAttemptAnchorRef,
  dedupeState,
  selectedOutcome,
  checkedEvidence,
  onSelectAttempt,
  onSelectStage,
  onOutcomeChange,
  onEvidenceToggle,
  onInitiateAttempt,
  onOpenTask,
}: {
  projection: CallbackDetailSurfaceProjection;
  liveAttemptAnchorRef: string | null;
  dedupeState: "idle" | "current_attempt_active" | "reused_existing_attempt";
  selectedOutcome: CallbackOutcome;
  checkedEvidence: readonly string[];
  onSelectAttempt: (anchorRef: string) => void;
  onSelectStage: (stage: CallbackWorkbenchProjection["selectedStage"]) => void;
  onOutcomeChange: (outcome: CallbackOutcome) => void;
  onEvidenceToggle: (evidence: string) => void;
  onInitiateAttempt: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <section
      className="staff-shell__callback-detail"
      data-testid="CallbackDetailSurface"
      data-request-ref={projection.requestRef}
      data-request-lineage-ref={projection.requestLineageRef}
      data-patient-conversation-route={projection.patientConversationRouteRef}
      data-phase3-bundle-ref={projection.phase3ConversationBundleRef}
      data-delivery-posture={projection.deliveryPosture}
      data-repair-posture={projection.repairPosture}
      data-dominant-next-action={projection.dominantNextActionRef}
      data-callback-state={projection.callbackState}
      data-intent-lease-state={projection.intentLeaseState}
      data-attempt-state={projection.currentAttemptState}
      data-route-health={projection.routeHealth}
      data-resolution-gate={projection.resolutionGateState}
      data-stage={projection.selectedStage}
      data-dedupe-state={dedupeState}
    >
      <header className="staff-shell__callback-detail-head">
        <div>
          <span className="staff-shell__eyebrow">Callback detail</span>
          <h2>{projection.headline}</h2>
          <p>{publicCallbackText(projection.summary)}</p>
        </div>
        <div className="staff-shell__callback-facts">
          <div>
            <strong>Decision epoch</strong>
            <span>Current decision</span>
          </div>
          <div>
            <strong>Intent lease</strong>
            <span>{publicCallbackText(labelFromToken(projection.intentLeaseState))}</span>
          </div>
          <div>
            <strong>Resolution gate</strong>
            <span>{publicCallbackText(labelFromToken(projection.resolutionGateState))}</span>
          </div>
          <div>
            <strong>Selected stage</strong>
            <span>{stageLabel(projection.selectedStage)}</span>
          </div>
        </div>
      </header>

      <section className="staff-shell__callback-detail-summary">
        <div className="staff-shell__callback-detail-strip">
          <span>{publicCallbackText(projection.ownerLabel)}</span>
          <strong>{publicCallbackText(projection.promiseWindowLabel)}</strong>
          <span>{publicCallbackText(projection.preferredRouteLabel)}</span>
          <span>{publicCallbackText(projection.urgencyLabel)}</span>
        </div>
        <div className="staff-shell__callback-control-bar">
          {projection.controls.map((control) => (
            <button
              key={control.controlId}
              type="button"
              className={control.actionKey === "open_task" ? "staff-shell__utility-button" : "staff-shell__inline-action"}
              disabled={
                !control.enabled ||
                (control.actionKey === "initiate_attempt" &&
                  (liveAttemptAnchorRef !== null || dedupeState !== "idle"))
              }
              data-dedupe-state={control.actionKey === "initiate_attempt" ? dedupeState : undefined}
              onClick={() => {
                if (control.actionKey === "open_task") {
                  onOpenTask(projection.taskId);
                  return;
                }
                if (control.actionKey === "initiate_attempt") {
                  onInitiateAttempt();
                  onSelectStage("outcome");
                  return;
                }
                if (control.actionKey === "schedule" || control.actionKey === "reschedule" || control.actionKey === "cancel") {
                  onSelectStage("detail");
                }
              }}
            >
                {publicCallbackText(control.label)}
            </button>
          ))}
        </div>
      </section>

      {projection.routeRepairPrompt.visible && (
        <CallbackRouteRepairPrompt
          projection={projection.routeRepairPrompt}
          compact
          onOpenRepair={() => onSelectStage("repair")}
        />
      )}

      <div className="staff-shell__callback-main-grid">
        <CallbackExpectationCard projection={projection.expectationCard} />
        <CallbackAttemptTimeline
          projection={projection.attemptTimeline}
          liveAttemptAnchorRef={liveAttemptAnchorRef}
          onSelectAttempt={onSelectAttempt}
        />
        <section className="staff-shell__callback-card">
          <header className="staff-shell__task-stack-header">
            <span className="staff-shell__eyebrow">Source review context</span>
            <h3>What this callback is attached to</h3>
          </header>
          <ul className="staff-shell__callback-context-list">
            {projection.sourceSummaryPoints.map((item) => (
              <li key={item}>{publicCallbackText(item)}</li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="staff-shell__callback-side-stage">
        {projection.selectedStage === "repair" ? (
          <CallbackRouteRepairPrompt
            projection={projection.routeRepairPrompt}
            onOpenRepair={() => onSelectStage("repair")}
          />
        ) : (
          <CallbackOutcomeCapture
            projection={projection.outcomeCapture}
            selectedOutcome={selectedOutcome}
            checkedEvidence={checkedEvidence}
            onOutcomeChange={onOutcomeChange}
            onEvidenceToggle={onEvidenceToggle}
            onOpenRepair={() => onSelectStage("repair")}
          />
        )}
      </aside>
    </section>
  );
}

export function CallbackWorklistRoute({
  projection,
  focusContinuity,
  selectedAnchorRef,
  onSelectCase,
  onSelectAttempt,
  onSelectStage,
  onOpenTask,
  onBufferedQueueApply,
  onBufferedQueueToggleReview,
  onBufferedQueueDefer,
}: {
  projection: CallbackWorkbenchProjection;
  focusContinuity: WorkspaceFocusContinuityProjection;
  selectedAnchorRef: string;
  onSelectCase: (taskId: string, anchorRef: string) => void;
  onSelectAttempt: (anchorRef: string) => void;
  onSelectStage: (stage: CallbackWorkbenchProjection["selectedStage"]) => void;
  onOpenTask: (taskId: string) => void;
  onBufferedQueueApply: () => void;
  onBufferedQueueToggleReview: () => void;
  onBufferedQueueDefer: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "repair" | "attempt" | "evidence">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dedupeState, setDedupeState] = useState<"idle" | "current_attempt_active" | "reused_existing_attempt">("idle");
  const [liveAttemptAnchorRef, setLiveAttemptAnchorRef] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<CallbackOutcome>("answered");
  const [checkedEvidence, setCheckedEvidence] = useState<readonly string[]>([]);

  useEffect(() => {
    setDedupeState("idle");
    setLiveAttemptAnchorRef(null);
    setSelectedOutcome("answered");
    setCheckedEvidence([]);
  }, [projection.detailSurface.callbackCaseId]);

  const visibleRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return projection.rows.filter((row) => {
      if (filter === "repair" && row.routeHealthLabel !== "Repair required") {
        return false;
      }
      if (filter === "attempt" && row.intentLeaseState !== "live_ready") {
        return false;
      }
      if (filter === "evidence" && row.resolutionGateState !== "awaiting_evidence") {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return [
        row.patientLabel,
        row.requestLabel,
        row.summary,
        row.nextAllowedActionLabel,
        row.callbackState,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [filter, projection.rows, searchQuery]);

  const initiateAttempt = () => {
    if (dedupeState === "idle") {
      const anchorRef = `callback-attempt-live-${projection.detailSurface.taskId}`;
      setLiveAttemptAnchorRef(anchorRef);
      setDedupeState("current_attempt_active");
      onSelectAttempt(anchorRef);
      return;
    }
    setDedupeState("reused_existing_attempt");
  };

  const toggleEvidence = (evidence: string) => {
    setCheckedEvidence((current) =>
      current.includes(evidence)
        ? current.filter((item) => item !== evidence)
        : [...current, evidence],
    );
  };

  return (
    <section
      className="staff-shell__callback-workbench"
      data-testid="CallbackWorklistRoute"
      data-design-mode={projection.visualMode}
      data-callback-state={projection.detailSurface.callbackState}
      data-intent-lease-state={projection.detailSurface.intentLeaseState}
      data-attempt-state={
        liveAttemptAnchorRef ? "outcome_pending" : projection.detailSurface.currentAttemptState
      }
      data-route-health={projection.detailSurface.routeHealth}
      data-resolution-gate={projection.detailSurface.resolutionGateState}
      data-next-task-state={focusContinuity.nextTaskPostureCard.nextTaskState}
      data-focus-protection={focusContinuity.focusState}
      data-protected-composition={focusContinuity.protectedMode}
      data-buffered-queue-batch={focusContinuity.bufferedQueueTray?.batchState ?? "hidden"}
      data-auto-advance={focusContinuity.noAutoAdvancePolicy}
    >
      <header className="staff-shell__callback-workbench-head">
        <div>
          <span className="staff-shell__eyebrow">Callback_Operations_Deck</span>
          <h2>Callback workbench</h2>
          <p>{projection.queueHealthSummary}</p>
        </div>
        <div className="staff-shell__callback-summary-strip">
          <span>{projection.rowCount} live callback cases</span>
          <span>{projection.dueNowSummary}</span>
          <span>{stageLabel(projection.selectedStage)}</span>
        </div>
      </header>

      <div className="staff-shell__callback-toolbar">
        <div className="staff-shell__callback-filter-group" role="tablist" aria-label="Callback filters">
          {[
            ["all", "All"],
            ["repair", "Repair"],
            ["attempt", "Ready to attempt"],
            ["evidence", "Awaiting evidence"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="staff-shell__callback-filter"
              data-selected={filter === key ? "true" : "false"}
              onClick={() => setFilter(key as typeof filter)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="staff-shell__search-field">
          <span>Search callback work</span>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.currentTarget.value)} />
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

      {focusContinuity.recovery && <ProtectedCompositionRecovery projection={focusContinuity.recovery} />}

      <div className="staff-shell__callback-workbench-grid">
        <aside className="staff-shell__callback-lane">
          <header className="staff-shell__task-stack-header">
            <span className="staff-shell__eyebrow">Callback list</span>
            <h3>Approved callback list</h3>
            <p>Promise window, route health, and next legal action stay readable at scan speed.</p>
          </header>
          <div className="staff-shell__callback-lane-list">
            {visibleRows.map((row) => (
              <CallbackWorklistRow
                key={row.rowId}
                row={row}
                onSelect={onSelectCase}
                onOpenTask={onOpenTask}
              />
            ))}
          </div>
        </aside>

        <CallbackDetailSurface
          projection={projection.detailSurface}
          liveAttemptAnchorRef={liveAttemptAnchorRef}
          dedupeState={dedupeState}
          selectedOutcome={selectedOutcome}
          checkedEvidence={checkedEvidence}
          onSelectAttempt={onSelectAttempt}
          onSelectStage={onSelectStage}
          onOutcomeChange={setSelectedOutcome}
          onEvidenceToggle={toggleEvidence}
          onInitiateAttempt={initiateAttempt}
          onOpenTask={onOpenTask}
        />
      </div>

      <div className="staff-shell__callback-footnote">
        <span data-selected-anchor-ref={selectedAnchorRef}>Selected callback remains open</span>
        <span>Duplicate dial status: {publicCallbackText(labelFromToken(dedupeState))}</span>
      </div>
    </section>
  );
}
