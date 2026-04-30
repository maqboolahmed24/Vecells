import type {
  EndpointReasoningStageProjection,
  MoreInfoInlineSideStageProjection,
  ProtectedCompositionFreezeFrameProjection,
  QuickCaptureTrayProjection,
  RapidEntryDraftProjection,
  StaffShellRoute,
  TaskStackRowProjection,
  TaskWorkspaceProjection,
} from "./workspace-shell.data";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function StackRows({ rows }: { rows: readonly TaskStackRowProjection[] }) {
  return (
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
  );
}

export function ReasonChipGroup({
  chips,
  selectedValue,
  disabled,
  onSelect,
}: {
  chips: readonly string[];
  selectedValue: string | null;
  disabled: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <section className="staff-shell__capture-block" data-testid="ReasonChipGroup">
      <span className="staff-shell__capture-label">ReasonChipGroup</span>
      <div className="staff-shell__chip-row">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            className="staff-shell__chip"
            data-active={selectedValue === chip ? "true" : "false"}
            disabled={disabled}
            onClick={() => onSelect(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
    </section>
  );
}

export function QuestionSetPicker({
  questionSets,
  selectedValue,
  disabled,
  onSelect,
}: {
  questionSets: readonly string[];
  selectedValue: string | null;
  disabled: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <section className="staff-shell__capture-block" data-testid="QuestionSetPicker">
      <span className="staff-shell__capture-label">Question sets</span>
      <div className="staff-shell__picker-grid" role="listbox" aria-label="Question sets">
        {questionSets.map((questionSet) => (
          <button
            key={questionSet}
            type="button"
            role="option"
            aria-selected={selectedValue === questionSet}
            className="staff-shell__picker-card"
            data-active={selectedValue === questionSet ? "true" : "false"}
            disabled={disabled}
            onClick={() => onSelect(questionSet)}
          >
            {questionSet}
          </button>
        ))}
      </div>
    </section>
  );
}

export function RapidEntryNoteField({
  draft,
  disabled,
  onChange,
}: {
  draft: RapidEntryDraftProjection;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <section
      className="staff-shell__capture-block staff-shell__capture-block--note"
      data-testid="RapidEntryNoteField"
      data-autosave-state={draft.autosaveState}
    >
      <label className="staff-shell__note-field">
        <span className="staff-shell__capture-label">RapidEntryNoteField</span>
        <textarea
          aria-label="Rapid entry note"
          value={draft.noteValue}
          disabled={disabled}
          placeholder={draft.notePlaceholder}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </label>
      <div className="staff-shell__note-meta">
        <span>{draft.localOnlyLabel}</span>
        <strong>{draft.lastLocalChangeAt}</strong>
      </div>
    </section>
  );
}

function MacroRow({
  label,
  values,
  selectedValue,
  disabled,
  onSelect,
}: {
  label: string;
  values: readonly string[];
  selectedValue: string | null;
  disabled: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <section className="staff-shell__capture-block">
      <span className="staff-shell__capture-label">{label}</span>
      <div className="staff-shell__chip-row">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            className="staff-shell__chip staff-shell__chip--soft"
            data-active={selectedValue === value ? "true" : "false"}
            disabled={disabled}
            onClick={() => onSelect(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </section>
  );
}

export function QuickCaptureTray({
  projection,
  route,
  disabled,
  onOpenTask,
  onOpenMoreInfo,
  onOpenDecision,
  onDecisionChange,
  onReasonSelect,
  onQuestionSetSelect,
  onMacroSelect,
  onDuePickSelect,
  onNoteChange,
}: {
  projection: TaskWorkspaceProjection;
  route: StaffShellRoute;
  disabled: boolean;
  onOpenTask: () => void;
  onOpenMoreInfo: () => void;
  onOpenDecision: () => void;
  onDecisionChange: (value: string) => void;
  onReasonSelect: (value: string) => void;
  onQuestionSetSelect: (value: string) => void;
  onMacroSelect: (value: string) => void;
  onDuePickSelect: (value: string) => void;
  onNoteChange: (value: string) => void;
}) {
  const tray: QuickCaptureTrayProjection = projection.reasoningLayer.quickCaptureTray;
  const draft = projection.reasoningLayer.rapidEntryDraft;

  return (
    <section
      className="staff-shell__quick-capture-tray"
      data-testid="QuickCaptureTray"
      data-active-mode={tray.activeMode}
      data-autosave-state={tray.autosaveState}
    >
      <div className="staff-shell__tray-tabs" role="tablist" aria-label="Reasoning dock modes">
        <button
          type="button"
          role="tab"
          className="staff-shell__tray-tab"
          aria-selected={tray.activeMode === "rapid_entry"}
          data-active={tray.activeMode === "rapid_entry" ? "true" : "false"}
          onClick={onOpenTask}
        >
          Rapid entry
        </button>
        <button
          type="button"
          role="tab"
          className="staff-shell__tray-tab"
          aria-selected={tray.activeMode === "more_info"}
          data-active={tray.activeMode === "more_info" ? "true" : "false"}
          onClick={onOpenMoreInfo}
        >
          More-info
        </button>
        <button
          type="button"
          role="tab"
          className="staff-shell__tray-tab"
          aria-selected={tray.activeMode === "endpoint_reasoning"}
          data-active={tray.activeMode === "endpoint_reasoning" ? "true" : "false"}
          onClick={onOpenDecision}
        >
          Endpoint reasoning
        </button>
      </div>

      <div className="staff-shell__tray-copy">
        <p>{tray.keyboardHint}</p>
        <span>{tray.localAcknowledgement}</span>
      </div>

      <section className="staff-shell__capture-block">
        <span className="staff-shell__capture-label">QuickCaptureTray</span>
        <div className="staff-shell__chip-row">
          {tray.endpointShortcuts.map((shortcut, index) => (
            <button
              key={shortcut}
              type="button"
              className="staff-shell__chip staff-shell__chip--accent"
              data-active={
                projection.decisionDock.shortlist[index] === projection.taskCanvasFrame.consequenceStack.decisionPreviewLabel
                  ? "true"
                  : "false"
              }
              disabled={disabled}
              onClick={() =>
                onDecisionChange(projection.decisionDock.shortlist[index] ?? projection.decisionDock.shortlist[0] ?? shortcut)
              }
            >
              {shortcut}
            </button>
          ))}
        </div>
      </section>

      <ReasonChipGroup
        chips={tray.reasonChips}
        selectedValue={draft.selectedReasonChip}
        disabled={disabled}
        onSelect={onReasonSelect}
      />
      <QuestionSetPicker
        questionSets={tray.questionSets}
        selectedValue={draft.selectedQuestionSet}
        disabled={disabled}
        onSelect={onQuestionSetSelect}
      />
      <MacroRow
        label="Saved phrases"
        values={tray.macros}
        selectedValue={draft.selectedMacro}
        disabled={disabled}
        onSelect={onMacroSelect}
      />
      <MacroRow
        label="Due-date quick picks"
        values={tray.duePicks}
        selectedValue={draft.selectedDuePick}
        disabled={disabled}
        onSelect={onDuePickSelect}
      />
      <RapidEntryNoteField draft={draft} disabled={disabled} onChange={onNoteChange} />

      <div className="staff-shell__tray-footer">
        <span>Review action</span>
        <strong data-review-action-lease-ref={tray.reviewActionLeaseRef}>Ready</strong>
      </div>

      {route.kind !== "task" && (
        <div className="staff-shell__tray-return">
          <button
            type="button"
            className="staff-shell__dock-action staff-shell__dock-action--ghost"
            onClick={onOpenTask}
          >
            Return to task summary
          </button>
        </div>
      )}
    </section>
  );
}

export function MoreInfoInlineSideStage({
  stage,
  disabled,
}: {
  stage: MoreInfoInlineSideStageProjection;
  disabled: boolean;
}) {
  return (
    <section
      className="staff-shell__inline-side-stage"
      data-testid="MoreInfoInlineSideStage"
      data-stage-state={stage.stageState}
      data-cycle-mode={stage.cycleMode}
      data-request-ref={stage.requestRef}
      data-request-lineage-ref={stage.requestLineageRef}
      data-more-info-cycle-ref={stage.cycleRef}
      data-reply-window-checkpoint={stage.replyWindowCheckpointRef}
      data-reminder-schedule-ref={stage.reminderScheduleRef}
      data-patient-conversation-route={stage.patientConversationRouteRef}
      data-phase3-bundle-ref={stage.phase3ConversationBundleRef}
      data-due-state={stage.dueState}
      data-reply-eligibility-state={stage.replyEligibilityState}
      data-secure-link-access-state={stage.secureLinkAccessState}
      data-delivery-posture={stage.deliveryPosture}
      data-repair-posture={stage.repairPosture}
      data-dominant-next-action={stage.dominantPatientActionRef}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">MoreInfoInlineSideStage</span>
        <h3>{stage.headline}</h3>
        <p>{stage.summary}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span>Cycle ref</span>
        <strong>{stage.cycleRef}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Status digest</span>
        <strong>{stage.statusDigestRef}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Reply window</span>
        <strong>{stage.replyWindowCheckpointRef}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Patient route</span>
        <strong>{stage.patientConversationRouteRef}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Delivery status</span>
        <strong>{stage.deliveryPosture}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Repair status</span>
        <strong>{stage.repairPosture}</strong>
      </div>
      <div className="staff-shell__reasoning-list">
        {stage.questionPreview.map((prompt, index) => (
          <article key={prompt} className="staff-shell__reasoning-list-row">
            <div>
              <strong>Prompt {index + 1}</strong>
              <span>{prompt}</span>
            </div>
            <p>{index === 0 ? "Promoted first because it protects the current cycle from accidental supersession." : "Remains editable in the same shell without leaving the active task."}</p>
          </article>
        ))}
      </div>
      <div className="staff-shell__stage-actions">
        <button
          type="button"
          className="staff-shell__dock-action"
          disabled={disabled || !stage.sendEnabled}
        >
          {stage.sendLabel}
        </button>
        <span>{stage.dominantWorkspaceActionRef}</span>
      </div>
    </section>
  );
}

export function ConsequencePreviewSurface({
  preview,
}: {
  preview: EndpointReasoningStageProjection["preview"];
}) {
  return (
    <section
      className="staff-shell__consequence-preview-surface"
      data-testid="ConsequencePreviewSurface"
      data-preview-state={preview.previewState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">ConsequencePreviewSurface</span>
        <h3>{preview.headline}</h3>
        <p>{preview.summary}</p>
      </header>
      {preview.approvalCheckpointRef && (
        <div className="staff-shell__task-stack-inline">
          <span>Approval checkpoint</span>
          <strong>{preview.approvalCheckpointRef}</strong>
        </div>
      )}
      <StackRows rows={preview.rows} />
      <div className="staff-shell__tray-footer">
        <span>Transition envelope</span>
        <strong>{preview.transitionEnvelopeRef}</strong>
      </div>
    </section>
  );
}

export function EndpointReasoningStage({
  stage,
  disabled,
}: {
  stage: EndpointReasoningStageProjection;
  disabled: boolean;
}) {
  return (
    <section
      className="staff-shell__inline-side-stage"
      data-testid="EndpointReasoningStage"
      data-stage-state={stage.stageState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">EndpointReasoningStage</span>
        <h3>{stage.headline}</h3>
        <p>{stage.summary}</p>
      </header>
      <div className="staff-shell__task-stack-inline">
        <span>Decision epoch</span>
        <strong>{stage.decisionEpochRef}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Endpoint binding</span>
        <strong>{stage.endpointDecisionBindingRef}</strong>
      </div>
      <div className="staff-shell__task-stack-inline">
        <span>Rationale</span>
        <strong>{stage.rationaleLabel}</strong>
      </div>
      <ConsequencePreviewSurface preview={stage.preview} />
      <div className="staff-shell__stage-actions">
        <button
          type="button"
          className="staff-shell__dock-action"
          disabled={disabled || !stage.sendEnabled}
        >
          {stage.sendLabel}
        </button>
        <span>{stage.reviewActionLeaseRef}</span>
      </div>
    </section>
  );
}

export function ProtectedCompositionFreezeFrame({
  freezeFrame,
}: {
  freezeFrame: ProtectedCompositionFreezeFrameProjection;
}) {
  return (
    <section
      className={classNames(
        "staff-shell__freeze-frame",
        freezeFrame.freezeState === "recovery_only" && "staff-shell__freeze-frame--blocking",
      )}
      data-testid="ProtectedCompositionFreezeFrame"
      data-freeze-state={freezeFrame.freezeState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">ProtectedCompositionFreezeFrame</span>
        <h3>{freezeFrame.headline}</h3>
        <p>{freezeFrame.summary}</p>
      </header>
      <ul className="staff-shell__freeze-list">
        {freezeFrame.blockingReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <div className="staff-shell__freeze-preserved">
        <strong>Frozen history</strong>
        <span>{freezeFrame.preservedDraftSummary}</span>
        <span>{freezeFrame.preservedAnchorRef}</span>
        <span>{freezeFrame.preservedDecisionEpochRef}</span>
      </div>
      <button type="button" className="staff-shell__dock-action staff-shell__dock-action--ghost">
        {freezeFrame.recoveryActionLabel}
      </button>
    </section>
  );
}
